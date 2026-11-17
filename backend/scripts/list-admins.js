import 'dotenv/config';
import { adminAuth, db } from '../src/firebase.js';

// Lista quem tem a claim admin de verdade no Authentication (a fonte da verdade).
try {
  const admins = [];
  let pageToken;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    for (const u of page.users) if (u.customClaims?.admin === true) admins.push(u);
    pageToken = page.pageToken;
  } while (pageToken);

  if (!admins.length) console.log('Nenhum administrador definido.');
  for (const u of admins) console.log(`${u.email ?? '(sem e-mail)'}  uid=${u.uid}`);

  // Mantém o espelho em adminProfiles coerente (apenas informativo; as regras usam a claim).
  const profiles = await db.collection('adminProfiles').get();
  const ids = new Set(admins.map(u => u.uid));
  const stale = profiles.docs.filter(d => !ids.has(d.id));
  if (stale.length) console.log(`\nAviso: ${stale.length} perfil(is) em adminProfiles sem a claim admin: ${stale.map(d => d.data().email || d.id).join(', ')}`);
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
