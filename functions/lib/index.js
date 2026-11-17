"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAdmin = exports.createAdmin = exports.onSchoolWrite = exports.onSubmissionWrite = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_2 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
// Tipado como any: em alguns ambientes o TypeScript não enxerga os métodos herdados de BaseAuth (TS2339).
const adminAuth = (0, auth_1.getAuth)();
const MIN = 5;
const REVIEW_STATUSES = ['approved', 'correction', 'rejected'];
const needAdmin = (r) => {
    if (!r.auth?.token.admin)
        throw new https_1.HttpsError('permission-denied', 'Somente administradores.');
};
const audit = (userId, action, resource, resourceId, extra = {}) => db.collection('auditLogs').add({ userId, action, resource, resourceId, ...extra, timestamp: firestore_2.FieldValue.serverTimestamp() });
// Recalcula os agregados públicos de uma pesquisa a partir de TODOS os envios aprovados (idempotente).
// Abaixo de 5 envios aprovados nada é publicado (privacidade estatística).
async function recompute(surveyId) {
    const subs = (await db.collection('submissions').where('surveyId', '==', surveyId).where('status', '==', 'approved').get()).docs.map(d => d.data());
    const ref = db.doc(`aggregatedResults/${surveyId}`);
    if (subs.length < MIN) {
        await ref.delete();
        return;
    }
    const sum = (k) => subs.reduce((a, s) => a + (Number(s.vals?.[k]) || 0), 0);
    await ref.set({
        surveyId,
        period: subs[0].period,
        approvedSubmissionCount: subs.length,
        schoolCount: new Set(subs.map(s => s.schoolId)).size,
        participants: sum('total'),
        impactNum: sum('impact'),
        contNum: sum('cont'),
        uniBNum: sum('uniB'),
        uniANum: sum('uniA'),
        updatedAt: firestore_2.FieldValue.serverTimestamp()
    });
}
exports.onSubmissionWrite = (0, firestore_1.onDocumentWritten)('submissions/{id}', async (ev) => {
    const b = ev.data?.before.data(), a = ev.data?.after.data(), s = a || b;
    if (!s)
        return;
    if (b?.status === a?.status)
        return;
    if (a?.status === 'approved' || b?.status === 'approved')
        await recompute(s.surveyId);
    // Só registra auditoria quando a equipe de fato revisou. Antes, uma escola que voltava um envio
    // de "correction" para "draft" gerava um log falso de revisão em nome do administrador.
    if (a?.reviewedBy && REVIEW_STATUSES.includes(a.status))
        await audit(a.reviewedBy, 'review:' + a.status, 'submissions', ev.params.id);
});
exports.onSchoolWrite = (0, firestore_1.onDocumentWritten)('schools/{id}', async (ev) => {
    const b = ev.data?.before.data(), a = ev.data?.after.data();
    if (b?.status === a?.status)
        return;
    const n = (await db.collection('schools').where('status', '==', 'approved').count().get()).data().count;
    await db.doc('publicStats/summary').set({ schools: n, updatedAt: firestore_2.FieldValue.serverTimestamp() });
    if (a?.statusBy)
        await audit(a.statusBy, 'school:' + a.status, 'schools', ev.params.id);
});
// Gestão de administradores (claims só podem ser definidas pelo Admin SDK)
exports.createAdmin = (0, https_1.onCall)(async (r) => {
    needAdmin(r);
    const name = typeof r.data?.name === 'string' ? r.data.name.trim() : '';
    const email = typeof r.data?.email === 'string' ? r.data.email.trim().toLowerCase() : '';
    if (!email)
        throw new https_1.HttpsError('invalid-argument', 'Informe o e-mail de uma conta que já entrou com Google.');
    let u;
    try {
        u = await adminAuth.getUserByEmail(email);
    }
    catch {
        throw new https_1.HttpsError('not-found', 'A conta precisa entrar com Google uma vez antes de ser promovida.');
    }
    await adminAuth.setCustomUserClaims(u.uid, { ...(u.customClaims || {}), admin: true });
    await db.doc(`adminProfiles/${u.uid}`).set({ uid: u.uid, name: name || u.displayName || email, email, role: 'admin', updatedAt: firestore_2.FieldValue.serverTimestamp(), createdBy: r.auth.uid }, { merge: true });
    await audit(r.auth.uid, 'admin:create', 'adminProfiles', u.uid);
    return { uid: u.uid };
});
// Remove apenas a permissão de administrador. Antes a função apagava a conta inteira do Authentication
// (e aceitava qualquer uid, inclusive de escolas).
exports.removeAdmin = (0, https_1.onCall)(async (r) => {
    needAdmin(r);
    const uid = typeof r.data?.uid === 'string' ? r.data.uid : '';
    if (!uid || uid === r.auth.uid)
        throw new https_1.HttpsError('failed-precondition', 'Não é possível remover a própria conta.');
    try {
        const u = await adminAuth.getUser(uid);
        const { admin: _admin, ...claims } = u.customClaims || {};
        await adminAuth.setCustomUserClaims(uid, claims);
        await adminAuth.revokeRefreshTokens(uid);
    }
    catch (e) {
        if (e?.code !== 'auth/user-not-found')
            throw new https_1.HttpsError('internal', 'Não foi possível remover a permissão.');
    }
    await db.doc(`adminProfiles/${uid}`).delete();
    await audit(r.auth.uid, 'admin:remove', 'adminProfiles', uid);
    return { ok: true };
});
