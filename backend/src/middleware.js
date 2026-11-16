import { adminAuth, db } from './firebase.js';
export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const requireAuth = asyncRoute(async (req, res, next) => {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer '))
        return res.status(401).json({ error: 'missing_token', message: 'Envie um token Bearer.' });
    try {
        req.user = await adminAuth.verifyIdToken(header.slice(7), true);
        next();
    }
    catch {
        return res.status(401).json({ error: 'invalid_token', message: 'Token inválido ou expirado.' });
    }
});
export const requireAdmin = asyncRoute(async (req, res, next) => {
    if (!req.user?.admin)
        return res.status(403).json({ error: 'admin_required', message: 'Somente administradores.' });
    next();
});
export const requireSchool = asyncRoute(async (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ error: 'missing_token', message: 'Autenticação necessária.' });
    const snap = await db.doc(`schools/${req.user.uid}`).get();
    if (!snap.exists)
        return res.status(403).json({ error: 'school_required', message: 'Perfil de escola não encontrado.' });
    const school = { id: snap.id, ...snap.data() };
    if (school.status !== 'approved')
        return res.status(403).json({ error: 'school_not_approved', message: 'A escola ainda não está aprovada.' });
    req.school = school;
    next();
});
export const errorHandler = (error, _req, res, _next) => {
    console.error(error);
    if (error?.name === 'ZodError')
        return res.status(400).json({ error: 'validation_error', details: error.issues });
    if (error?.code === 'auth/email-already-exists')
        return res.status(409).json({ error: 'email_already_exists', message: 'Este e-mail já está cadastrado.' });
    return res.status(500).json({ error: 'internal_error', message: 'Erro interno do servidor.' });
};
