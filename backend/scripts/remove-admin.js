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
  // Invalida os tokens já emitidos: o backend usa verifyIdToken(..., true) e deixa de aceitar o claim antigo.
  await adminAuth.revokeRefreshTokens(user.uid);
  await db.doc(`adminProfiles/${user.uid}`).delete();
  console.log(`Administrador removido: ${email}`);
  console.log('Peça ao usuário para sair e entrar novamente com o Google para atualizar o token.');
  process.exit(0);
} catch (error) {
  if (error?.code === 'auth/user-not-found') console.error(`A conta ${email} não existe no Firebase Authentication.`);
  else console.error(error);
  process.exit(1);
}
