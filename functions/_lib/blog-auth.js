/* ==========================================================================
   Arcobaleno — parola de administrator și sesiunea

   Folosit de funcțiile din `functions/api/blog/`. Numele dosarului începe cu
   underscore, deci Cloudflare nu îl publică și nu îl transformă în rută.

   Parola nu e ținută nicăieri în clar. În Cloudflare stă doar amprenta ei
   (PBKDF2-SHA256, cu sare), generată local cu `node tools/hash-password.mjs`.
   ========================================================================== */

const enc = new TextEncoder();

/* Numărul de iterații e scris în amprentă, nu în cod, ca să poată fi urcat
   fără a schimba fișierul. Planul gratuit Cloudflare taie funcția la 10 ms
   de procesor, iar 50.000 de iterații stau confortabil sub prag. */
export const DEFAULT_ITERATIONS = 50_000;

const toB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256
  );
  return new Uint8Array(bits);
}

export function formatHash(salt, hash, iterations) {
  return `pbkdf2$${iterations}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;

  try {
    const derived = await derive(password, fromB64(parts[2]), iterations);
    return equalBytes(derived, fromB64(parts[3]));
  } catch (e) {
    return false;
  }
}

/* ------------------------------------------------------------- sesiunea */

export const COOKIE = 'arc_admin';
export const SESSION_TTL = 60 * 60 * 8;

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

export async function issueSession(secret) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(String(exp)));
  return `${exp}.${toB64(sig)}`;
}

export async function validSession(secret, token) {
  const dot = String(token || '').indexOf('.');
  if (dot < 1) return false;

  const exp = Number(token.slice(0, dot));
  if (!Number.isInteger(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  try {
    return await crypto.subtle.verify(
      'HMAC', await hmacKey(secret), fromB64(token.slice(dot + 1)), enc.encode(String(exp))
    );
  } catch (e) {
    return false;
  }
}

export function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return '';
}

export function setCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`;
}

export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function isAdmin(context) {
  const secret = context.env.SESSION_SECRET;
  if (!secret) return false;
  return validSession(secret, readCookie(context.request, COOKIE));
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
