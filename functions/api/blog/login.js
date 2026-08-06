/* Intrarea în cont. Primește parola, o compară cu amprenta din Cloudflare și,
   dacă se potrivește, pune cookie-ul de sesiune. Cookie-ul e `HttpOnly`, deci
   JavaScriptul din pagină nu îl poate citi — și nici un script străin. */

import { verifyPassword, issueSession, setCookie, json } from '../../_lib/blog-auth.js';

/* Câte încercări greșite pe fereastră, ținute în baza de date pentru că o
   funcție Cloudflare nu are memorie proprie de la o cerere la alta. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;

async function tooManyTries(db, ip) {
  const now = Date.now();
  const row = await db.prepare('SELECT tries, started FROM login_attempts WHERE ip = ?')
    .bind(ip).first();

  if (!row || now - row.started > WINDOW_MS) {
    await db.prepare(
      'INSERT INTO login_attempts (ip, tries, started) VALUES (?, 1, ?) ' +
      'ON CONFLICT(ip) DO UPDATE SET tries = 1, started = excluded.started'
    ).bind(ip, now).run();
    return false;
  }

  await db.prepare('UPDATE login_attempts SET tries = tries + 1 WHERE ip = ?').bind(ip).run();
  return row.tries + 1 > MAX_TRIES;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    console.error('Lipsesc ADMIN_PASSWORD_HASH sau SESSION_SECRET.');
    return json({ error: 'Autentificarea nu e configurată.' }, 500);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'anonim';
  if (await tooManyTries(env.DB, ip)) {
    return json({ error: 'Prea multe încercări. Așteptați un sfert de oră.' }, 429);
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || '');

  if (!await verifyPassword(password, env.ADMIN_PASSWORD_HASH)) {
    return json({ error: 'Parolă greșită.' }, 401);
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();

  const token = await issueSession(env.SESSION_SECRET);
  return json(
    { name: env.ADMIN_NAME || 'Nicoleta', role: env.ADMIN_ROLE || 'Director' },
    200,
    { 'Set-Cookie': setCookie(token) }
  );
}
