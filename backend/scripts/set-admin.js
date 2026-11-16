import 'dotenv/config';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, db } from '../src/firebase.js';

const email = String(process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: npm run set-admin -- email@gmail.com');
  console.error('Ou defina ADMIN_EMAIL no backend/.env.');
  process.exit(1);
}

try {
  const user = await adminAuth.getUserByEmail(email);
  const claims = { ...(user.customClaims || {}), admin: true };
  await adminAuth.setCustomUserClaims(user.uid, claims);
  await db.doc(`adminProfiles/${user.uid}`).set({ uid: user.uid, name: user.displayName || email, email, role: 'admin', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log(`Administrador definido: ${email}`);
  console.log('Peça ao usuário para sair e entrar novamente com o Google para atualizar o token.');
  process.exit(0);
} catch (error) {
  if (error?.code === 'auth/user-not-found') console.error(`A conta ${email} ainda não existe no Firebase Authentication. Faça login com Google uma vez e execute novamente.`);
  else console.error(error);
  process.exit(1);
}
