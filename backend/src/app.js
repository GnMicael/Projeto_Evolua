import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, db } from './firebase.js';
import { asyncRoute, errorHandler, notFoundHandler, requireAdmin, requireAuth, requireSchool } from './middleware.js';
import { cleanDoc, idSchema, parseList, serverNow } from './utils.js';

const app = express();
const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);
app.use(helmet());
app.use(cors({ origin: origins.includes('*') ? true : origins, credentials: false }));
app.use(express.json({ limit: '1mb' }));

const publicCollections = {
    interviews: db.collection('interviews').where('publicationStatus', '==', 'published'),
    documents: db.collection('documents').where('publicationStatus', '==', 'published'),
    surveys: db.collection('surveys').where('status', '==', 'published')
};

async function listQuery(query, limit) {
    const snap = await query.limit(parseList(limit)).get();
    return snap.docs.map(d => cleanDoc(d.id, d.data()));
}

const listCollection = (name) => asyncRoute(async (req, res) => {
    const snap = await db.collection(name).limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
});

/* ---------- Públicas ---------- */
app.get('/health', (_req, res) => res.json({ ok: true, service: 'evolua-backend', timestamp: new Date().toISOString() }));
app.get('/api/v1', (_req, res) => res.json({ name: 'Evolua API', version: 'v1', docs: '/api/v1/docs' }));
app.get('/api/v1/docs', (_req, res) => res.json({
    authentication: 'Authorization: Bearer <Firebase ID token>',
    public: [
        'GET /api/v1/content', 'GET /api/v1/interviews', 'GET /api/v1/documents', 'GET /api/v1/surveys',
        'GET /api/v1/results', 'GET /api/v1/stats', 'POST /api/v1/auth/schools/register'
    ],
    school: [
        'POST /api/v1/auth/session', 'GET /api/v1/me', 'GET /api/v1/school', 'GET /api/v1/school/surveys',
        'GET /api/v1/school/submissions', 'PUT /api/v1/school/submissions/:id'
    ],
    admin: [
        'GET /api/v1/admin/schools', 'PATCH /api/v1/admin/schools/:id/status',
        'GET /api/v1/admin/submissions', 'PATCH /api/v1/admin/submissions/:id/review',
        'GET/POST/PATCH /api/v1/admin/surveys', 'PATCH /api/v1/admin/content',
        'GET/POST /api/v1/admin/admins', 'DELETE /api/v1/admin/admins/:id'
    ]
}));

app.get('/api/v1/content', asyncRoute(async (_req, res) => {
    const snap = await db.doc('siteContent/main').get();
    res.json(snap.exists ? cleanDoc(snap.id, snap.data()) : {});
}));
app.get('/api/v1/interviews', asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.interviews, req.query.limit))));
app.get('/api/v1/documents', asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.documents, req.query.limit))));
app.get('/api/v1/surveys', asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.surveys, req.query.limit))));
app.get('/api/v1/results', listCollection('aggregatedResults'));
app.get('/api/v1/stats', asyncRoute(async (_req, res) => {
    const snap = await db.doc('publicStats/summary').get();
    res.json(snap.exists ? cleanDoc(snap.id, snap.data()) : { schools: 0 });
}));

/* ---------- Cadastro e sessão ---------- */
const schoolRegisterSchema = z.object({
    name: z.string().trim().min(2).max(180),
    responsibleName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128)
});
app.post('/api/v1/auth/schools/register', asyncRoute(async (req, res) => {
    const input = schoolRegisterSchema.parse(req.body);
    const user = await adminAuth.createUser({ email: input.email, password: input.password, displayName: input.responsibleName });
    try {
        await db.doc(`schools/${user.uid}`).set({
            name: input.name,
            responsibleName: input.responsibleName,
            institutionalEmail: input.email,
            status: 'pending',
            createdAt: serverNow()
        });
    }
    catch (error) {
        // Sem o perfil da escola a conta ficaria órfã e o e-mail "preso": desfaz o cadastro.
        await adminAuth.deleteUser(user.uid).catch(() => { });
        throw error;
    }
    res.status(201).json({ uid: user.uid, status: 'pending', message: 'Cadastro recebido. Aguarde a aprovação da gestão.' });
}));

async function sessionPayload(user) {
    const schoolSnap = await db.doc(`schools/${user.uid}`).get();
    return {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.admin ? 'admin' : schoolSnap.exists ? 'school' : 'visitor',
        school: schoolSnap.exists ? cleanDoc(schoolSnap.id, schoolSnap.data()) : null
    };
}
app.post('/api/v1/auth/session', requireAuth, asyncRoute(async (req, res) => {
    const { uid, email, name, role, school } = await sessionPayload(req.user);
    res.json({ user: { uid, email, name }, role, school });
}));
app.get('/api/v1/me', requireAuth, asyncRoute(async (req, res) => res.json(await sessionPayload(req.user))));

/* ---------- Área da escola ---------- */
app.get('/api/v1/school', requireAuth, requireSchool, (req, res) => res.json(req.school));
app.get('/api/v1/school/surveys', requireAuth, requireSchool, asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.surveys, req.query.limit))));
app.get('/api/v1/school/submissions', requireAuth, requireSchool, asyncRoute(async (req, res) => {
    const snap = await db.collection('submissions').where('schoolId', '==', req.school.id).limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
}));

const countField = z.number().finite().min(0).default(0);
const submissionSchema = z.object({
    vals: z.object({ total: countField, impact: countField, cont: countField, uniB: countField, uniA: countField }),
    extra: z.record(z.string(), z.union([z.string().max(2000), z.number()])).optional(),
    status: z.enum(['draft', 'pending'])
}).superRefine((input, ctx) => {
    if (input.status !== 'pending')
        return;
    // Mesmas regras do firestore.rules (validVals): total > 0 e nenhum indicador acima do total.
    const { total, impact, cont, uniB, uniA } = input.vals;
    if (!(total > 0) || [impact, cont, uniB, uniA].some(n => n > total))
        ctx.addIssue({ code: 'custom', path: ['vals'], message: 'Informe o total e nenhum valor pode superar o total de participantes.' });
});
const EDITABLE = ['draft', 'correction'];

app.put('/api/v1/school/submissions/:id', requireAuth, requireSchool, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = submissionSchema.parse(req.body);
    // O id é "{pesquisa}_{escola}". A escola só pode gravar no próprio envio.
    const suffix = `_${req.school.id}`;
    if (!id.endsWith(suffix) || id.length === suffix.length)
        return res.status(403).json({ error: 'submission_forbidden', message: 'Este envio pertence a outra escola.' });
    const surveyId = id.slice(0, -suffix.length);
    const survey = await db.doc(`surveys/${surveyId}`).get();
    const s = survey.data();
    if (!survey.exists || s?.status !== 'published')
        return res.status(404).json({ error: 'survey_not_found', message: 'Pesquisa não encontrada ou não publicada.' });
    const pending = input.status === 'pending';
    const base = {
        schoolId: req.school.id,
        schoolName: req.school.name ?? '',
        surveyId,
        surveyTitle: s.title ?? '',
        period: s.period ?? '',
        surveyVersion: s.version || 1,
        vals: input.vals,
        extra: input.extra ?? {},
        questionsSnapshot: (s.questions ?? []).map((q) => ({ id: q.id ?? '', label: q.label ?? '' })),
        status: input.status
    };
    const ref = db.doc(`submissions/${id}`);
    const locked = await db.runTransaction(async (tx) => {
        const existing = await tx.get(ref);
        if (existing.exists && !EDITABLE.includes(String(existing.data()?.status)))
            return true;
        const stamps = { updatedAt: serverNow(), ...(pending ? { submittedAt: serverNow() } : {}) };
        tx.set(ref, existing.exists ? { ...base, ...stamps } : { ...base, ...stamps, reviewNotes: '', createdAt: serverNow() }, { merge: true });
        return false;
    });
    if (locked)
        return res.status(409).json({ error: 'submission_locked', message: 'Este envio não pode mais ser editado.' });
    // A resposta não inclui os carimbos de data (são valores especiais do servidor, não JSON).
    res.json({ id, ...base, message: pending ? 'Envio encaminhado para revisão.' : 'Rascunho salvo.' });
}));

/* ---------- Administração ---------- */
app.get('/api/v1/admin/schools', requireAuth, requireAdmin, listCollection('schools'));
app.patch('/api/v1/admin/schools/:id/status', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const { status } = z.object({ status: z.enum(['approved', 'rejected', 'suspended']) }).parse(req.body);
    await db.doc(`schools/${id}`).update({ status, statusBy: req.user.uid, statusAt: serverNow() });
    res.json({ id, status });
}));

app.get('/api/v1/admin/submissions', requireAuth, requireAdmin, listCollection('submissions'));
const reviewSchema = z.object({
    status: z.enum(['approved', 'correction', 'rejected']),
    notes: z.string().max(2000).default('')
});
app.patch('/api/v1/admin/submissions/:id/review', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = reviewSchema.parse(req.body);
    const ref = db.doc(`submissions/${id}`);
    const snap = await ref.get();
    if (!snap.exists)
        return res.status(404).json({ error: 'not_found', message: 'Envio não encontrado.' });
    if (snap.data()?.status !== 'pending')
        return res.status(409).json({ error: 'not_pending', message: 'Somente envios em revisão podem ser avaliados.' });
    await ref.update({
        status: input.status,
        reviewNotes: input.notes,
        reviewedBy: req.user.uid,
        reviewedAt: serverNow(),
        // arrayUnion preserva o histórico das revisões anteriores (antes ele era sobrescrito).
        history: FieldValue.arrayUnion({ at: Date.now(), status: input.status, notes: input.notes, by: req.user.uid })
    });
    res.json({ id, ...input });
}));

const questionSchema = z.object({
    id: idSchema,
    label: z.string().trim().min(1).max(300),
    type: z.enum(['text', 'number', 'yesno', 'select']).default('text'),
    options: z.string().max(1000).optional()
});
const surveySchema = z.object({
    title: z.string().trim().min(2).max(200),
    period: z.string().trim().min(1).max(80),
    instructions: z.string().max(5000).default(''),
    questions: z.array(questionSchema).max(50).default([]),
    status: z.enum(['draft', 'published', 'archived']).default('draft')
});
// Só mudanças reais nas perguntas contam para o número da versão.
const questionsKey = (list) => JSON.stringify((list ?? []).map(q => [q.id, q.label, q.type ?? 'text', q.options ?? '']));

app.get('/api/v1/admin/surveys', requireAuth, requireAdmin, listCollection('surveys'));
app.post('/api/v1/admin/surveys', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const input = surveySchema.parse(req.body);
    const ref = db.collection('surveys').doc();
    await ref.set({ ...input, version: 1, createdAt: serverNow(), updatedAt: serverNow() });
    res.status(201).json({ id: ref.id, ...input, version: 1 });
}));
app.patch('/api/v1/admin/surveys/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = surveySchema.partial().parse(req.body);
    const ref = db.doc(`surveys/${id}`);
    const current = await ref.get();
    if (!current.exists)
        return res.status(404).json({ error: 'not_found', message: 'Pesquisa não encontrada.' });
    const changed = input.questions && questionsKey(current.data()?.questions) !== questionsKey(input.questions);
    const version = Number(current.data()?.version ?? 1) + (changed ? 1 : 0);
    await ref.update({ ...input, version, updatedAt: serverNow() });
    res.json({ id, ...input, version });
}));

const contentSchema = z.object({
    heroTitle: z.string().max(500),
    heroSub: z.string().max(1000),
    about: z.string().max(5000),
    goals: z.string().max(5000),
    justify: z.string().max(5000),
    contact: z.string().max(1000)
}).partial();
app.patch('/api/v1/admin/content', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const input = contentSchema.parse(req.body);
    await db.doc('siteContent/main').set({ ...input, updatedAt: serverNow() }, { merge: true });
    res.json({ ok: true });
}));

app.get('/api/v1/admin/admins', requireAuth, requireAdmin, listCollection('adminProfiles'));
app.post('/api/v1/admin/admins', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const input = z.object({ name: z.string().trim().min(2).optional(), email: z.string().trim().toLowerCase().email() }).parse(req.body);
    let user;
    try {
        user = await adminAuth.getUserByEmail(input.email);
    }
    catch (error) {
        if (error?.code === 'auth/user-not-found')
            return res.status(404).json({ error: 'user_not_found', message: 'A conta precisa entrar com Google uma vez antes de ser promovida.' });
        throw error;
    }
    await adminAuth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
    await db.doc(`adminProfiles/${user.uid}`).set({
        uid: user.uid,
        name: input.name || user.displayName || input.email,
        email: input.email,
        role: 'admin',
        updatedAt: serverNow(),
        createdBy: req.user.uid
    }, { merge: true });
    res.status(201).json({ uid: user.uid, message: 'Administrador promovido. Faça login novamente com Google para atualizar o token.' });
}));
app.delete('/api/v1/admin/admins/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    if (id === req.user.uid)
        return res.status(409).json({ error: 'self_delete_forbidden', message: 'Não é possível remover a própria conta.' });
    // Remove apenas a permissão (igual ao script remove-admin). Antes a rota apagava a conta inteira do Authentication.
    try {
        const user = await adminAuth.getUser(id);
        const { admin: _admin, ...claims } = user.customClaims || {};
        await adminAuth.setCustomUserClaims(id, claims);
        await adminAuth.revokeRefreshTokens(id);
    }
    catch (error) {
        if (error?.code !== 'auth/user-not-found')
            throw error;
    }
    await db.doc(`adminProfiles/${id}`).delete();
    res.json({ ok: true });
}));

app.use(notFoundHandler);
app.use(errorHandler);
export default app;
