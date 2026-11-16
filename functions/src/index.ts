import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'; import { getAuth } from 'firebase-admin/auth'; import { getFirestore, FieldValue } from 'firebase-admin/firestore'
initializeApp(); const db = getFirestore(); const MIN = 5
const needAdmin = (r: CallableRequest) => { if (!r.auth?.token.admin) throw new HttpsError('permission-denied', 'Somente administradores.') }
const audit = (userId: string, action: string, resource: string, resourceId: string, extra: any = {}) => db.collection('auditLogs').add({ userId, action, resource, resourceId, ...extra, timestamp: FieldValue.serverTimestamp() })

// Recalcula os agregados públicos de uma pesquisa a partir de TODOS os envios aprovados (idempotente).
// Abaixo de 5 envios aprovados nada é publicado (privacidade estatística).
async function recompute(surveyId: string) {
  const subs = (await db.collection('submissions').where('surveyId', '==', surveyId).where('status', '==', 'approved').get()).docs.map(d => d.data())
  const ref = db.doc(`aggregatedResults/${surveyId}`)
  if (subs.length < MIN) return ref.delete()
  const sum = (k: string) => subs.reduce((a, s) => a + (Number(s.vals?.[k]) || 0), 0)
  await ref.set({ surveyId, period: subs[0].period, approvedSubmissionCount: subs.length, schoolCount: new Set(subs.map(s => s.schoolId)).size, participants: sum('total'), impactNum: sum('impact'), contNum: sum('cont'), uniBNum: sum('uniB'), uniANum: sum('uniA'), updatedAt: FieldValue.serverTimestamp() })
}
export const onSubmissionWrite = onDocumentWritten('submissions/{id}', async ev => {
  const b = ev.data?.before.data(), a = ev.data?.after.data(), s = a || b; if (!s) return
  if (b?.status !== a?.status) { if (a?.status === 'approved' || b?.status === 'approved') await recompute(s.surveyId); if (a && a.reviewedBy && a.status !== 'pending') await audit(a.reviewedBy, 'review:' + a.status, 'submissions', ev.params.id) }
})
export const onSchoolWrite = onDocumentWritten('schools/{id}', async ev => {
  const b = ev.data?.before.data(), a = ev.data?.after.data()
  if (b?.status !== a?.status) { const n = (await db.collection('schools').where('status', '==', 'approved').count().get()).data().count; await db.doc('publicStats/summary').set({ schools: n, updatedAt: FieldValue.serverTimestamp() }); if (a?.statusBy) await audit(a.statusBy, 'school:' + a.status, 'schools', ev.params.id) }
})
// Gestão de administradores (claims só podem ser definidas pelo Admin SDK)
export const createAdmin = onCall(async r => { needAdmin(r); const { name, email, password } = r.data || {}
  if (!name || !email || !password || String(password).length < 8) throw new HttpsError('invalid-argument', 'Informe nome, e-mail e senha (mínimo de 8 caracteres).')
  const u = await getAuth().createUser({ email, password, displayName: name }); await getAuth().setCustomUserClaims(u.uid, { admin: true })
  await db.doc(`adminProfiles/${u.uid}`).set({ name, email, createdAt: FieldValue.serverTimestamp(), createdBy: r.auth!.uid }); await audit(r.auth!.uid, 'admin:create', 'adminProfiles', u.uid); return { uid: u.uid } })
export const removeAdmin = onCall(async r => { needAdmin(r); const { uid } = r.data || {}
  if (!uid || uid === r.auth!.uid) throw new HttpsError('failed-precondition', 'Não é possível remover a própria conta.')
  await getAuth().deleteUser(uid); await db.doc(`adminProfiles/${uid}`).delete(); await audit(r.auth!.uid, 'admin:remove', 'adminProfiles', uid); return { ok: true } })
