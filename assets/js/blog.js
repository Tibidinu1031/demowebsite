/* ==========================================================================
   Arcobaleno — blog

   Partea din browser. Nu verifică ea parola și nu ține ea postările: pentru
   amândouă întreabă funcțiile din `functions/api/blog/`, care rulează pe
   Cloudflare. Cookie-ul de sesiune e `HttpOnly`, deci fișierul acesta nu îl
   poate citi — de aceea starea contului se află întrebând `/api/blog/session`.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const root = $('[data-blog]');
  if (!root) return;

  const API = '/api/blog';

  async function api(path, options = {}) {
    const res = await fetch(API + path, {
      credentials: 'same-origin',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Ceva nu a mers. Mai încercați o dată.');
    return data;
  }

  /* ----------------------------------------------------------------- ajutor */

  const escape = (text) => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const paragraphs = (text) => escape(text)
    .split(/\n{2,}/)
    .map((block) => `<p>${block.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');

  const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
                'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];

  const prettyDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getDate()} ${LUNI[d.getMonth()]} ${d.getFullYear()}`;
  };

  const readingTime = (text) => {
    const words = text.trim().split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 200))} min`;
  };

  /* ------------------------------------------------------------------ starea */

  const authForm  = $('[data-blog-auth]');
  const authError = $('[data-blog-error]');
  const whoSlot   = $('[data-blog-who]');
  const roleSlot  = $('[data-blog-role]');
  const logout    = $('[data-blog-logout]');
  const compose   = $('[data-blog-compose]');
  const statusBox = $('[data-blog-status]');
  const list      = $('[data-blog-list]');
  const countSlot = $('[data-blog-count]');

  let account = null;
  let posts = [];

  function status(message, tone) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.dataset.tone = tone || 'ok';
    statusBox.hidden = !message;
  }

  function fail(message) {
    if (!authError) return;
    authError.textContent = message;
    authError.hidden = !message;
  }

  function paintSession() {
    root.dataset.state = account ? 'in' : 'out';
    if (whoSlot)  whoSlot.textContent  = account ? account.name : '';
    if (roleSlot) roleSlot.textContent = account ? account.role : '';
  }

  function paintPosts() {
    if (!list) return;

    if (countSlot) {
      countSlot.textContent = posts.length === 1 ? 'o postare' : `${posts.length} postări`;
    }

    if (!posts.length) {
      list.innerHTML = `
        <p class="blog__empty">
          Încă nu e nicio postare aici. Autentificați-vă și scrieți prima.
        </p>`;
      return;
    }

    list.innerHTML = posts.map((post) => `
      <article class="post" data-post="${escape(post.id)}">
        <header class="post__head">
          <p class="post__meta">
            <time datetime="${escape(post.date)}">${prettyDate(post.date)}</time>
            <span aria-hidden="true">&middot;</span>
            <span>${escape(post.author)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${readingTime(post.body)}</span>
          </p>
          ${post.tag ? `<p class="pill pill--sage">${escape(post.tag)}</p>` : ''}
        </header>
        <h3 class="post__title">${escape(post.title)}</h3>
        <div class="post__body">${paragraphs(post.body)}</div>
        ${account ? `
        <footer class="post__foot">
          <button class="btn btn--ghost btn--sm" type="button" data-post-delete="${escape(post.id)}">
            Șterge postarea
          </button>
        </footer>` : ''}
      </article>`).join('');
  }

  /* ---------------------------------------------------------------- acțiuni */

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const field = $('#blog-pass', authForm);
    const button = $('button[type="submit"]', authForm);

    fail('');
    if (button) button.disabled = true;

    try {
      account = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ password: field.value })
      });
      authForm.reset();
      paintSession();
      paintPosts();
      status('');
      $('#post-title')?.focus({ preventScroll: true });
    } catch (err) {
      fail(err.message);
      field.value = '';
      field.focus();
    } finally {
      if (button) button.disabled = false;
    }
  });

  logout?.addEventListener('click', async () => {
    await api('/logout', { method: 'POST' }).catch(() => {});
    account = null;
    paintSession();
    paintPosts();
    status('');
  });

  compose?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = $('#post-title', compose).value.trim();
    const body  = $('#post-body', compose).value.trim();
    const tag   = $('#post-tag', compose).value.trim();

    if (!title || !body) {
      status('Postarea are nevoie de un titlu și de un text.', 'bad');
      return;
    }

    const button = $('button[type="submit"]', compose);
    if (button) button.disabled = true;

    try {
      const { post } = await api('/posts', {
        method: 'POST',
        body: JSON.stringify({ title, body, tag })
      });

      posts = [post].concat(posts);
      compose.reset();
      paintPosts();
      status('Postare publicată. O vede oricine intră pe pagină.', 'ok');

      list?.firstElementChild?.scrollIntoView({
        block: 'center',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    } catch (err) {
      status(err.message, 'bad');
    } finally {
      if (button) button.disabled = false;
    }
  });

  list?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-post-delete]');
    if (!btn || !account) return;

    const id = btn.dataset.postDelete;
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    if (!confirm(`Ștergeți postarea „${post.title}”?`)) return;

    try {
      await api(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      posts = posts.filter((p) => p.id !== id);
      paintPosts();
      status('Postarea a fost ștearsă.', 'ok');
    } catch (err) {
      status(err.message, 'bad');
    }
  });

  /* ------------------------------------------------------------- la încărcare */

  (async () => {
    const [session, listing] = await Promise.all([
      api('/session').catch(() => ({ admin: false })),
      api('/posts').catch(() => null)
    ]);

    account = session.admin ? { name: session.name, role: session.role } : null;

    if (listing) {
      posts = listing.posts;
    } else if (list) {
      list.innerHTML = `
        <p class="blog__empty">
          Postările nu s-au putut încărca. Reîncărcați pagina peste un minut.
        </p>`;
      paintSession();
      return;
    }

    paintSession();
    paintPosts();
  })();
})();
