// Promove uma conta Google existente a administrador. Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=./chave-servico.json npm run make-admin -- email@gmail.com
// A conta precisa ter feito login com Google pelo menos uma vez.
// Nunca coloque a chave de serviço no frontend nem no repositório.
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const email = String(process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase()
if (!email) { console.error('Uso: npm run make-admin -- email@gmail.com'); process.exit(1) }
initializeApp({ credential: applicationDefault(), projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID })
const auth = getAuth(); const db = getFirestore()
try {
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true })
  await db.doc(`adminProfiles/${user.uid}`).set({ uid: user.uid, name: user.displayName || email, email, role: 'admin', updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  console.log('Administrador definido:', email)
  console.log('Peça ao usuário para sair e entrar novamente com o Google para atualizar o token.')
} catch (error) {
  if (error?.code === 'auth/user-not-found') console.error(`A conta ${email} ainda não existe. Faça login com Google uma vez e execute novamente.`)
  else console.error(error)
  process.exit(1)
}
