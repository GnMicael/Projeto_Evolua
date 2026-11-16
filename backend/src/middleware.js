import { adminAuth, db } from './firebase.js';

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const requireAuth = asyncRoute(async (req, res, next) => {
    const match = /^Bearer\s+(.+)$/i.exec(req.header('authorization') || '');
    if (!match)
        return res.status(401).json({ error: 'missing_token', message: 'Envie um token Bearer.' });
    try {
        req.user = await adminAuth.verifyIdToken(match[1].trim(), true);
    }
    catch (error) {
        // Só token ruim vira 401. Falha de rede/credencial do servidor é erro 500 de verdade.
        if (String(error?.code || '').startsWith('auth/'))
            return res.status(401).json({ error: 'invalid_token', message: 'Token inválido ou expirado.' });
        throw error;
    }
    next();
});

export const requireAdmin = (req, res, next) => {
    if (req.user?.admin !== true)
        return res.status(403).json({ error: 'admin_required', message: 'Somente administradores.' });
    next();
};

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

export const notFoundHandler = (_req, res) => res.status(404).json({ error: 'not_found', message: 'Rota não encontrada.' });

export const errorHandler = (error, _req, res, next) => {
    if (res.headersSent)
        return next(error);
    if (error?.name === 'ZodError')
        return res.status(400).json({ error: 'validation_error', details: error.issues });
    if (error?.type === 'entity.parse.failed')
        return res.status(400).json({ error: 'invalid_json', message: 'O corpo da requisição não é um JSON válido.' });
    if (error?.type === 'entity.too.large')
        return res.status(413).json({ error: 'payload_too_large', message: 'Corpo da requisição grande demais.' });
    if (error?.code === 'auth/email-already-exists')
        return res.status(409).json({ error: 'email_already_exists', message: 'Este e-mail já está cadastrado.' });
    if (error?.code === 'auth/user-not-found')
        return res.status(404).json({ error: 'user_not_found', message: 'Usuário não encontrado.' });
    if (error?.code === 'auth/invalid-password' || error?.code === 'auth/invalid-email')
        return res.status(400).json({ error: 'invalid_credentials', message: 'E-mail ou senha em formato inválido.' });
    // gRPC NOT_FOUND (code 5): update() em documento que não existe.
    if (error?.code === 5 || error?.code === 'not-found')
        return res.status(404).json({ error: 'not_found', message: 'Registro não encontrado.' });
    console.error(error);
    return res.status(500).json({ error: 'internal_error', message: 'Erro interno do servidor.' });
};
