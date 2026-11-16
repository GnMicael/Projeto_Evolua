// Cria (ou promove) o primeiro administrador. Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=./chave-servico.json npm run make-admin -- email@exemplo.com "SenhaForte123" "Nome"
// Nunca coloque a chave de serviço no frontend nem no repositório.
import { initializeApp, applicationDefault } from 'firebase-admin/app'; import { getAuth } from 'firebase-admin/auth'; import { getFirestore, FieldValue } from 'firebase-admin/firestore'
const [email, password, name = 'Administrador'] = process.argv.slice(2)
if (!email || !password) { console.error('Uso: npm run make-admin -- <email> <senha> [nome]'); process.exit(1) }
initializeApp({ credential: applicationDefault(), projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID })
const auth = getAuth(); let user
try { user = await auth.getUserByEmail(email) } catch { user = await auth.createUser({ email, password, displayName: name }) }
await auth.setCustomUserClaims(user.uid, { admin: true })
await getFirestore().doc(`adminProfiles/${user.uid}`).set({ name, email, createdAt: FieldValue.serverTimestamp() }, { merge: true })
console.log('Administrador pronto:', email, user.uid)
