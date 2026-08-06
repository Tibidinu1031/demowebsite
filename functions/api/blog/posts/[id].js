import { isAdmin, json } from '../../../_lib/blog-auth.js';

export async function onRequestDelete(context) {
  if (!await isAdmin(context)) return json({ error: 'Nu sunteți autentificat.' }, 401);

  const result = await context.env.DB
    .prepare('DELETE FROM posts WHERE id = ?')
    .bind(context.params.id)
    .run();

  if (!result.meta.changes) return json({ error: 'Postarea nu există.' }, 404);

  return json({ ok: true });
}
