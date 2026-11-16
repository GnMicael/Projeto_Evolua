import { initializeApp } from 'firebase/app'; import { getAuth, connectAuthEmulator } from 'firebase/auth'; import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'; import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
const e = import.meta.env
const cfg = { apiKey: e.VITE_FIREBASE_API_KEY, authDomain: e.VITE_FIREBASE_AUTH_DOMAIN, projectId: e.VITE_FIREBASE_PROJECT_ID, storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: e.VITE_FIREBASE_APP_ID }
export const configured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)
export const app: any = configured ? initializeApp(cfg) : null
export const auth: any = configured ? getAuth(app) : null
export const db: any = configured ? getFirestore(app) : null
export const storage: any = configured ? getStorage(app) : null
export const functions: any = configured ? getFunctions(app, e.VITE_FUNCTIONS_REGION || 'us-central1') : null
if (configured && e.VITE_USE_EMULATORS === 'true') { connectAuthEmulator(auth, 'http://127.0.0.1:9099'); connectFirestoreEmulator(db, '127.0.0.1', 8080); connectStorageEmulator(storage, '127.0.0.1', 9199); connectFunctionsEmulator(functions, '127.0.0.1', 5001) }
