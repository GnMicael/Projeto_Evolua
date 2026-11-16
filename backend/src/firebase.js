import 'dotenv/config';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_PROJECT_ID;

function loadCredential() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw)
        return applicationDefault();
    try {
        return cert(JSON.parse(raw));
    }
    catch (cause) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON é inválido: informe o JSON completo da conta de serviço em uma única variável.', { cause });
    }
}

const app = getApps()[0] ?? initializeApp({
    credential: loadCredential(),
    projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
export const adminAuth = getAuth(app);
export const db = getFirestore(app);
export function getBucket() {
    return getStorage(app).bucket(process.env.FIREBASE_STORAGE_BUCKET || undefined);
}
export { app };
