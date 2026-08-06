/* Lista de postări (publică) și publicarea unei postări noi (doar admin). */

import { isAdmin, json } from '../../../_lib/blog-auth.js';

const MAX_TITLE = 120;
const MAX_TAG   = 24;
const MAX_BODY  = 20_000;

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, title, tag, body, author, role, date FROM posts ORDER BY date DESC'
  ).all();

  return json({ posts: results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!await isAdmin(context)) return json({ error: 'Nu sunteți autentificat.' }, 401);

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim().slice(0, MAX_TITLE);
  const text  = String(body.body  || '').trim().slice(0, MAX_BODY);
  const tag   = String(body.tag   || '').trim().slice(0, MAX_TAG);

  if (!title || !text) {
    return json({ error: 'Postarea are nevoie de un titlu și de un text.' }, 400);
  }

  const post = {
    id: crypto.randomUUID(),
    title,
    tag,
    body: text,
    author: env.ADMIN_NAME || 'Nicoleta',
    role: env.ADMIN_ROLE || 'Director',
    date: new Date().toISOString()
  };

  await env.DB.prepare(
    'INSERT INTO posts (id, title, tag, body, author, role, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(post.id, post.title, post.tag, post.body, post.author, post.role, post.date).run();

  return json({ post }, 201);
}
