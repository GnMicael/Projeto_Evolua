import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { adminAuth, db } from './firebase.js';
import { asyncRoute, errorHandler, requireAdmin, requireAuth, requireSchool } from './middleware.js';
import { cleanDoc, idSchema, parseList, serverNow } from './utils.js';
const app = express();
const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim());
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
app.get('/health', (_req, res) => res.json({ ok: true, service: 'evolua-backend', timestamp: new Date().toISOString() }));
app.get('/api/v1', (_req, res) => res.json({ name: 'Evolua API', version: 'v1', docs: '/api/v1/docs' }));
app.get('/api/v1/docs', (_req, res) => res.json({
    authentication: 'Authorization: Bearer <Firebase ID token>',
    public: ['GET /api/v1/content', 'GET /api/v1/interviews', 'GET /api/v1/documents', 'GET /api/v1/surveys', 'GET /api/v1/results'],
    school: ['GET /api/v1/me', 'GET /api/v1/school', 'GET /api/v1/school/surveys', 'GET /api/v1/school/submissions', 'PUT /api/v1/school/submissions/:id'],
    admin: ['GET /api/v1/admin/schools', 'PATCH /api/v1/admin/schools/:id/status', 'GET /api/v1/admin/submissions', 'PATCH /api/v1/admin/submissions/:id/review', 'POST/PATCH /api/v1/admin/surveys', 'POST/PATCH /api/v1/admin/content']
}));
app.get('/api/v1/content', asyncRoute(async (_req, res) => {
    const snap = await db.doc('siteContent/main').get();
    res.json(snap.exists ? cleanDoc(snap.id, snap.data()) : {});
}));
app.get('/api/v1/interviews', asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.interviews, req.query.limit))));
app.get('/api/v1/documents', asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.documents, req.query.limit))));
app.get('/api/v1/surveys', asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.surveys, req.query.limit))));
app.get('/api/v1/results', asyncRoute(async (req, res) => {
    const snap = await db.collection('aggregatedResults').limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
}));
app.get('/api/v1/stats', asyncRoute(async (_req, res) => {
    const snap = await db.doc('publicStats/summary').get();
    res.json(snap.exists ? cleanDoc(snap.id, snap.data()) : { schools: 0 });
}));
const schoolRegisterSchema = z.object({ name: z.string().trim().min(2).max(180), responsibleName: z.string().trim().min(2).max(120), email: z.string().email().max(254), password: z.string().min(8).max(128) });
app.post('/api/v1/auth/schools/register', asyncRoute(async (req, res) => {
    const input = schoolRegisterSchema.parse(req.body);
    const user = await adminAuth.createUser({ email: input.email, password: input.password, displayName: input.responsibleName });
    await db.doc(`schools/${user.uid}`).set({ name: input.name, responsibleName: input.responsibleName, institutionalEmail: input.email, status: 'pending', createdAt: serverNow() });
    res.status(201).json({ uid: user.uid, status: 'pending', message: 'Cadastro recebido. Aguarde a aprovação da gestão.' });
}));
app.post('/api/v1/auth/session', requireAuth, asyncRoute(async (req, res) => {
    const user = req.user;
    const schoolSnap = await db.doc(`schools/${user.uid}`).get();
    res.json({ user: { uid: user.uid, email: user.email, name: user.name }, role: user.admin ? 'admin' : schoolSnap.exists ? 'school' : 'visitor', school: schoolSnap.exists ? cleanDoc(schoolSnap.id, schoolSnap.data()) : null });
}));
app.get('/api/v1/me', requireAuth, asyncRoute(async (req, res) => {
    const user = req.user;
    const school = await db.doc(`schools/${user.uid}`).get();
    res.json({ uid: user.uid, email: user.email, name: user.name, role: user.admin ? 'admin' : school.exists ? 'school' : 'visitor', school: school.exists ? cleanDoc(school.id, school.data()) : null });
}));
app.get('/api/v1/school', requireAuth, requireSchool, asyncRoute(async (req, res) => res.json(req.school)));
app.get('/api/v1/school/surveys', requireAuth, requireSchool, asyncRoute(async (req, res) => res.json(await listQuery(publicCollections.surveys, req.query.limit))));
app.get('/api/v1/school/submissions', requireAuth, requireSchool, asyncRoute(async (req, res) => {
    const snap = await db.collection('submissions').where('schoolId', '==', req.school.id).limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
}));
const submissionSchema = z.object({ vals: z.record(z.string(), z.unknown()), extra: z.record(z.string(), z.unknown()).optional(), status: z.enum(['draft', 'pending']) });
app.put('/api/v1/school/submissions/:id', requireAuth, requireSchool, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = submissionSchema.parse(req.body);
    const ref = db.doc(`submissions/${id}`);
    const existing = await ref.get();
    if (existing.exists && !['draft', 'correction'].includes(String(existing.data()?.status)))
        return res.status(409).json({ error: 'submission_locked', message: 'Este envio não pode mais ser editado.' });
    const surveyId = id.split('_')[0];
    const survey = await db.doc(`surveys/${surveyId}`).get();
    if (!survey.exists)
        return res.status(404).json({ error: 'survey_not_found', message: 'Pesquisa não encontrada.' });
    const s = survey.data();
    const data = { schoolId: req.school.id, schoolName: req.school.name, surveyId, surveyTitle: s.title, period: s.period, surveyVersion: s.version || 1, vals: input.vals, extra: input.extra ?? {}, questionsSnapshot: (s.questions ?? []).map((q) => ({ id: q.id, label: q.label })), status: input.status, updatedAt: serverNow(), ...(input.status === 'pending' ? { submittedAt: serverNow() } : {}) };
    await ref.set(existing.exists ? data : { ...data, reviewNotes: '', createdAt: serverNow() }, { merge: true });
    res.json({ id, ...data, message: input.status === 'pending' ? 'Envio encaminhado para revisão.' : 'Rascunho salvo.' });
}));
app.get('/api/v1/admin/schools', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const snap = await db.collection('schools').limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
}));
app.patch('/api/v1/admin/schools/:id/status', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const status = z.enum(['approved', 'rejected', 'suspended']).parse(req.body.status);
    await db.doc(`schools/${id}`).update({ status, statusBy: req.user.uid, statusAt: serverNow() });
    res.json({ id, status });
}));
app.get('/api/v1/admin/submissions', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const snap = await db.collection('submissions').limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
}));
app.patch('/api/v1/admin/submissions/:id/review', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = z.object({ status: z.enum(['approved', 'correction', 'rejected']), notes: z.string().max(2000).default('') }).parse(req.body);
    await db.doc(`submissions/${id}`).update({ status: input.status, reviewNotes: input.notes, reviewedBy: req.user.uid, reviewedAt: serverNow(), history: [{ at: Date.now(), status: input.status, notes: input.notes, by: req.user.uid }] });
    res.json({ id, ...input });
}));
const surveySchema = z.object({ title: z.string().trim().min(2).max(200), period: z.string().trim().min(1).max(80), instructions: z.string().max(5000).default(''), questions: z.array(z.record(z.string(), z.unknown())).default([]), status: z.enum(['draft', 'published', 'archived']).default('draft') });
app.get('/api/v1/admin/surveys', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
    const snap = await db.collection('surveys').limit(parseList(req.query.limit)).get();
    res.json(snap.docs.map(d => cleanDoc(d.id, d.data())));
}));
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
        return res.status(404).json({ error: 'not_found' });
    const changed = input.questions && JSON.stringify(current.data()?.questions ?? []) !== JSON.stringify(input.questions);
    const version = Number(current.data()?.version ?? 1) + (changed ? 1 : 0);
    await ref.update({ ...input, version, updatedAt: serverNow() });
    res.json({ id, ...input, version });
}));
app.patch('/api/v1/admin/content', requireAuth, requireAdmin, asyncRoute(async (req, res) => { const input = z.record(z.string(), z.string()).parse(req.body); await db.doc('siteContent/main').set({ ...input, updatedAt: serverNow() }, { merge: true }); res.json({ ok: true }); }));
app.get('/api/v1/admin/admins', requireAuth, requireAdmin, asyncRoute(async (req, res) => { const snap = await db.collection('adminProfiles').limit(parseList(req.query.limit)).get(); res.json(snap.docs.map(d => cleanDoc(d.id, d.data()))); }));
app.post('/api/v1/admin/admins', requireAuth, requireAdmin, asyncRoute(async (req, res) => { const input = z.object({ name: z.string().min(2).optional(), email: z.string().email() }).parse(req.body); const user = await adminAuth.getUserByEmail(input.email); await adminAuth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true }); await db.doc(`adminProfiles/${user.uid}`).set({ uid: user.uid, name: input.name || user.displayName || input.email, email: input.email, role: 'admin', updatedAt: serverNow(), createdBy: req.user.uid }, { merge: true }); res.status(201).json({ uid: user.uid, message: 'Administrador promovido. Faça login novamente com Google para atualizar o token.' }); }));
app.delete('/api/v1/admin/admins/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => { const id = idSchema.parse(req.params.id); if (id === req.user.uid)
    return res.status(409).json({ error: 'self_delete_forbidden', message: 'Não é possível remover a própria conta.' }); await adminAuth.deleteUser(id); await db.doc(`adminProfiles/${id}`).delete(); res.json({ ok: true }); }));
app.use((_req, res) => res.status(404).json({ error: 'not_found', message: 'Rota não encontrada.' }));
app.use(errorHandler);
export default app;
