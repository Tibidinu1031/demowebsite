/* ==========================================================================
   Arcobaleno — generatorul de parolă pentru admin

     node tools/hash-password.mjs "parola-aleasă"

   Scoate cele două valori care se pun în Cloudflare, ca variabile secrete.
   Parola în sine nu pleacă nicăieri: calculul se face pe calculatorul
   dumneavoastră, iar în Cloudflare ajunge doar amprenta.

   Ca să schimbați parola mai târziu, rulați comanda din nou și înlocuiți
   ADMIN_PASSWORD_HASH. Schimbarea lui SESSION_SECRET închide, în plus,
   toate sesiunile rămase deschise.
   ========================================================================== */

import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { derive, formatHash, DEFAULT_ITERATIONS } =
  await import('../functions/_lib/blog-auth.js');

const password = process.argv[2];

if (!password) {
  console.error('Folosire: node tools/hash-password.mjs "parola-aleasă"');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Alegeți o parolă de cel puțin 12 caractere.');
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const hash = await derive(password, salt, DEFAULT_ITERATIONS);

const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');

console.log('\nPuneți-le în Cloudflare Pages → Settings → Variables and Secrets,');
console.log('amândouă de tip „Secret”:\n');
console.log('ADMIN_PASSWORD_HASH');
console.log(formatHash(salt, hash, DEFAULT_ITERATIONS) + '\n');
console.log('SESSION_SECRET');
console.log(secret + '\n');
