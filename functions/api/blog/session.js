/* Pagina întreabă la încărcare dacă mai există o sesiune validă. Cookie-ul e
   `HttpOnly`, deci singurul mod de a afla e să întrebe serverul. */

import { isAdmin, json } from '../../_lib/blog-auth.js';

export async function onRequestGet(context) {
  if (!await isAdmin(context)) return json({ admin: false });

  return json({
    admin: true,
    name: context.env.ADMIN_NAME || 'Nicoleta',
    role: context.env.ADMIN_ROLE || 'Director'
  });
}
