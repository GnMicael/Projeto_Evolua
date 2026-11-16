import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import 'dotenv/config';
const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credential = serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson))
    : applicationDefault();
const app = getApps()[0] ?? initializeApp({
    credential,
    projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
export const adminAuth = getAuth(app);
export const db = getFirestore(app);
export function getBucket() {
    return getStorage(app).bucket(process.env.FIREBASE_STORAGE_BUCKET || undefined);
}
export { app };
