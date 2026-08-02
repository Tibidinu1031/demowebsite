/* ==========================================================================
   Arcobaleno — blog

   ATENȚIE, ÎNAINTE DE PRODUCȚIE
   Site-ul este static: nu există server, deci nu există autentificare reală.
   Poarta de mai jos ține publicul la distanță de formularul de scriere, dar
   oricine deschide acest fișier vede cum e construită. Postările se salvează
   în localStorage, adică rămân doar în browserul care le-a scris.

   Când blogul trebuie să funcționeze cu adevărat, înlocuiți `signIn()` cu un
   apel către un endpoint care verifică parola pe server și `readPosts()` /
   `writePosts()` cu apeluri către o bază de date. Restul fișierului rămâne.
   ========================================================================== */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const root = $('[data-blog]');
  if (!root) return;

  const KEY_POSTS   = 'arc-blog-posts';
  const KEY_SESSION = 'arc-blog-session';

  /* ------------------------------------------------------------- conturile
     Amprentele sunt FNV-1a peste `utilizator:parolă:arcobaleno`. Nu e
     criptografie, e doar atât cât să nu stea parola scrisă în clar în fișier.

     admin      / arcobaleno2026
     educatoare / curcubeu2026                                             */

  const ACCOUNTS = [
    { user: 'admin',      name: 'Nicoleta', role: 'Director',        fp: 'c94f718e' },
    { user: 'educatoare', name: 'Priya Raghunathan',   role: 'Educatoare', fp: 'b8c41f08' }
  ];

  const fingerprint = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  };

  const signIn = (user, pass) => {
    const account = ACCOUNTS.find((a) => a.user === user.trim().toLowerCase());
    if (!account) return null;
    return fingerprint(`${account.user}:${pass}:arcobaleno`) === account.fp ? account : null;
  };

  /* ------------------------------------------------------------- depozitul */

  const SEED = [
    {
      id: 'seed-2',
      title: 'Înscrierile pentru anul școlar 2026–2027 sunt deschise',
      tag: 'Anunț',
      body: 'Am deschis lista pentru septembrie. Avem două locuri libere la after school, ' +
            'lista de așteptare la ateliere și locuri la Școala de vară.\n\n' +
            'Nu percepem taxă de înscriere și nu ținem locuri deoparte pentru nimeni. ' +
            'Ordinea e strict cronologică, cu o singură excepție: frații copiilor ' +
            'care sunt deja la noi intră primii.\n\n' +
            'Cel mai simplu e să veniți într-o marți, la zece dimineața, când e gălăgie.',
      author: 'Nicoleta',
      role: 'Director',
      date: '2026-07-14T09:10:00'
    },
    {
      id: 'seed-1',
      title: 'Ce am plantat în straturi în primăvara asta',
      tag: 'Din curte',
      body: 'Cele șase straturi ridicate au fost semănate în martie de copiii de la școala de vară, ' +
            'fiecare grupă cu stratul ei.\n\n' +
            'Au ieșit ridichi (multe), mazăre (puțină), gălbenele, salată, două feluri de ' +
            'busuioc și un dovleac care a hotărât singur că locul lui e sub leagăn.\n\n' +
            'Plivitul rămâne, ca în fiecare an, partea la care ne pricepem cel mai puțin.',
      author: 'Priya Raghunathan',
      role: 'Educatoare',
      date: '2026-05-06T15:40:00'
    }
  ];

  const readPosts = () => {
    try {
      const raw = localStorage.getItem(KEY_POSTS);
      if (!raw) return SEED.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : SEED.slice();
    } catch (e) {
      return SEED.slice();
    }
  };

  const writePosts = (posts) => {
    try {
      localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
    } catch (e) {
      status('Postarea nu a putut fi salvată în acest browser.', 'bad');
    }
  };

  /* --------------------------------------------------------------- sesiunea */

  const readSession = () => {
    try {
      const raw = sessionStorage.getItem(KEY_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const writeSession = (account) => {
    try {
      if (account) sessionStorage.setItem(KEY_SESSION, JSON.stringify(account));
      else sessionStorage.removeItem(KEY_SESSION);
    } catch (e) { /* nimic */ }
  };

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

  let account = readSession();
  let posts = readPosts();

  function status(message, tone) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.dataset.tone = tone || 'ok';
    statusBox.hidden = !message;
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
        <footer class="post__foot">
          <button class="btn btn--ghost btn--sm" type="button" data-post-delete="${escape(post.id)}">
            Șterge postarea
          </button>
        </footer>
      </article>`).join('');
  }

  /* ---------------------------------------------------------------- acțiuni */

  authForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const user = $('#blog-user', authForm).value;
    const pass = $('#blog-pass', authForm).value;
    const found = signIn(user, pass);

    if (!found) {
      authError.hidden = false;
      $('#blog-pass', authForm).value = '';
      $('#blog-pass', authForm).focus();
      return;
    }

    authError.hidden = true;
    account = { user: found.user, name: found.name, role: found.role };
    writeSession(account);
    authForm.reset();
    paintSession();
    status('');
    $('#post-title')?.focus({ preventScroll: true });
  });

  logout?.addEventListener('click', () => {
    account = null;
    writeSession(null);
    paintSession();
    status('');
  });

  compose?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!account) return;

    const title = $('#post-title', compose).value.trim();
    const body  = $('#post-body', compose).value.trim();
    const tag   = $('#post-tag', compose).value.trim();

    if (!title || !body) {
      status('Postarea are nevoie de un titlu și de un text.', 'bad');
      return;
    }

    posts = [{
      id: 'p' + Date.now().toString(36),
      title, body, tag,
      author: account.name,
      role: account.role,
      date: new Date().toISOString()
    }].concat(posts);

    writePosts(posts);
    compose.reset();
    paintPosts();
    status('Postare publicată. Apare acum în listă.', 'ok');

    list?.firstElementChild?.scrollIntoView({
      block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  list?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-post-delete]');
    if (!btn || !account) return;

    const id = btn.dataset.postDelete;
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    if (!confirm(`Ștergeți postarea „${post.title}”?`)) return;

    posts = posts.filter((p) => p.id !== id);
    writePosts(posts);
    paintPosts();
    status('Postarea a fost ștearsă.', 'ok');
  });

  paintSession();
  paintPosts();
})();
