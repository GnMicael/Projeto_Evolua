import 'dotenv/config';
import { adminAuth, db } from '../src/firebase.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: npm run remove-admin -- email@gmail.com');
  process.exit(1);
}

try {
  const user = await adminAuth.getUserByEmail(email);
  const { admin: _admin, ...claims } = user.customClaims || {};
  await adminAuth.setCustomUserClaims(user.uid, claims);
  await db.doc(`adminProfiles/${user.uid}`).delete();
  console.log(`Administrador removido: ${email}`);
  console.log('Peça ao usuário para sair e entrar novamente com o Google para atualizar o token.');
} catch (error) {
  console.error(error);
  process.exit(1);
}
