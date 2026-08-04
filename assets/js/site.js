/* ==========================================================================
   Arcobaleno — comportamentul site-ului
   Fără dependențe. Fiecare modul e opțional: dacă marcajul lui nu există
   în pagină, se retrage fără zgomot.
   ========================================================================== */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Datele de contact stau într-un singur loc. */
  const CONTACT = {
    tel: '+40728933035',
    telPretty: '0728 933 035',
    wa: '40728933035',

    /* Adresa releului care chiar trimite mesajul pe WhatsApp-ul școlii.
       Vezi `api/whatsapp.js` și secțiunea „WhatsApp” din README.

       Cât timp e gol, chatul se poartă ca înainte: deschide WhatsApp cu textul
       deja scris și omul apasă „trimite”. Puneți aici adresa funcției după ce
       o publicați — de exemplu 'https://arcobaleno.ro/api/whatsapp' — și
       mesajele ajung direct pe telefon, fără ca vizitatorul să iasă din site. */
    relay: ''
  };

  /* localStorage poate să arunce în modul privat pe iOS. Nimic din site nu
     depinde de el, așa că îl împachetăm o dată și uităm de problemă. */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* nimic */ } }
  };

  /* --------------------------------------------------------------- navigare */

  function currentPage() {
    const here = location.pathname.split('/').pop() || 'index.html';

    $$('.navlink, .drawer__list a').forEach((a) => {
      const target = a.getAttribute('href');
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ----------------------------------------------------------------- bandă
     Anunțul de înscrieri. Se închide din X și rămâne închis, iar scriptul
     din <head> îl ascunde înainte de prima pictare ca să nu clipească. */

  function banner() {
    const bar = $('[data-banner]');

    /* Eroul se dimensionează cu `100svh - antet - bandă`, deci înălțimea benzii
       trebuie să ajungă în CSS. O măsurăm aici și o remăsurăm la fiecare
       schimbare de lățime, pentru că textul se rupe altfel pe alte ecrane.

       Fără rotunjire: la zoom de 90% înălțimile ies fracționare, iar un
       jumătate de pixel lipsă lăsa o dungă de hârtie sub film. */
    const measure = () => {
      const h = bar && bar.isConnected ? bar.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty('--banner-h', `${h}px`);
      heroFit();
    };

    if (!bar) { measure(); return; }

    measure();

    /* Trei declanșatoare, pentru că niciunul nu acoperă singur tot:
       `resize` prinde schimbarea de lățime, `load` prinde așezarea finală, iar
       fonturile sosite târziu pot rupe textul benzii pe alt număr de rânduri.
       ResizeObserver se adaugă peste, unde există — dar nu ne bazăm doar pe el,
       fiindcă livrarea lui ține de bucla de randare, care poate fi suspendată. */
    addEventListener('resize', measure, { passive: true });
    addEventListener('load', measure, { once: true });
    document.fonts?.ready.then(measure).catch(() => {});
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(bar);

    $('[data-banner-close]', bar)?.addEventListener('click', () => {
      bar.dataset.closing = 'true';
      // Doar pentru fila curentă — la următoarea vizită anunțul e din nou acolo.
      try { sessionStorage.setItem('arc-banner', 'off'); } catch (e) { /* nimic */ }

      /* `transitionend` nu e garantat: într-o filă de fundal, sub randare
         suspendată sau cu tranzițiile oprite, nu se declanșează niciodată și
         banda ar rămâne pe ecran după ce omul a apăsat X. Deci cine ajunge
         primul câștigă — evenimentul sau cronometrul. */
      let closed = false;
      const done = () => {
        if (closed) return;
        closed = true;
        document.documentElement.classList.add('banner-off');
        bar.remove();
        measure();
      };

      if (calm.matches) done();
      else {
        bar.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 400);
      }
    });
  }

  /* ------------------------------------------------------------- erou fix
     `calc(100svh - antet - bandă)` ajunge aproape la milimetru, dar antetul e
     dat în `rem` iar banda e măsurată — la zoom fracționar diferența de sub un
     pixel se vede ca o dungă de hârtie între film și secțiunea următoare.

     Aici calculăm înălțimea exactă din poziția reală a eroului în document și
     o rotunjim în sus, ca eventualul rest să cadă sub `overflow: clip` în loc
     să lase o crăpătură. CSS-ul rămâne singur dacă scriptul nu rulează. */

  function heroFit() {
    const hero = $('.hero');
    if (!hero) return;

    if (!matchMedia('(min-width: 48em)').matches) {
      hero.style.removeProperty('--hero-h');
      return;
    }

    const top = hero.getBoundingClientRect().top + window.scrollY;
    hero.style.setProperty('--hero-h', `${Math.ceil(window.innerHeight - top)}px`);
  }

  /* ------------------------------------------------------------ portrete
     Fotografiile reale stau peste portretele desenate. Dacă un fișier nu
     există încă, scoatem <img> și rămâne ilustrația de dedesubt, în loc de
     pictograma de imagine ruptă. */

  function portraits() {
    $$('.person__photo, [data-optional]').forEach((img) => {
      img.addEventListener('error', () => img.remove(), { once: true });
      if (img.complete && img.naturalWidth === 0) img.remove();
    });
  }

  /* --------------------------------------------------------------- masthead */

  function masthead() {
    const bar = $('[data-masthead]');
    if (!bar) return;

    // O santinelă de înălțime zero e mai ieftină decât un ascultător de scroll.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    new IntersectionObserver(
      ([entry]) => bar.dataset.stuck = String(!entry.isIntersecting),
      { rootMargin: '-8px 0px 0px 0px' }
    ).observe(sentinel);
  }

  /* ----------------------------------------------------------------- meniul
     Un singur panou care arată toate destinațiile, construit aici și nu
     repetat în unsprezece fișiere HTML. Burgerul îl deschide sub 62em,
     butonul etichetat deasupra, iar Cmd/Ctrl-K oriunde. Fără JS se vede în
     schimb navigația din <noscript> (vezi layout.css). */

  const ICON = {
    rooms: '<path d="M3.4 13.8V7.4a4.6 4.6 0 0 1 9.2 0v6.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M1.6 13.8h12.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="10.3" cy="9.7" r=".9" fill="currentColor"/>',
    approach: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10.8 5.2 9.3 9.3 5.2 10.8 6.7 6.7Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    journal: '<path d="M8 4.6C7 3.6 5.6 3.1 3.4 3.1H2v9.3h1.6c2 0 3.4.5 4.4 1.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 4.6c1-1 2.4-1.5 4.6-1.5H14v9.3h-1.6c-2 0-3.4.5-4.4 1.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 4.6v9.2" fill="none" stroke="currentColor" stroke-width="1.3"/>',
    gallery: '<rect x="1.9" y="3.2" width="12.2" height="9.6" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6.7 6.3 10.4 8l-3.7 1.7Z" fill="currentColor" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    tour: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6.7 5.3v5.4l4.6-2.7Z" fill="currentColor"/>',
    blog: '<path d="M12.1 2.4 13.6 4l-7.4 7.4-2.2.7.7-2.2Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M2.4 14h11.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    faq: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6.2 6.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8c0 1.3-1.8 1.4-1.8 2.9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.4" r=".85" fill="currentColor"/>',
    hours: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.3V8l2.7 1.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    phone: '<path d="M5.6 2.4 7 5.1 5.6 6.6c.6 1.5 2.3 3.2 3.8 3.8l1.5-1.4 2.7 1.4-.4 2.4c-.1.6-.6 1-1.2 1C6.6 13.7 2.3 9.4 2.2 4c0-.6.4-1.1 1-1.2Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    visit: '<rect x="2.2" y="3.4" width="11.6" height="10.4" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.2 6.7h11.6M5.4 2.2v2.5M10.6 2.2v2.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="m6 10.3 1.5 1.5 3-3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
    arrow: '<path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="m3.5 3.5 9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  };

  /* Sigla WhatsApp, desenată o singură dată. */
  const WA_GLYPH =
    '<path d="M16.1 14.2c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1 1.7-.9 2.7.4 2 1.7 3.7 3.4 4.9 2.4 1.6 3.9 1.5 4.4 1.4.7-.1 1.6-.7 1.9-1.4.2-.5.2-1 .1-1.1z" fill="currentColor"/>' +
    '<path d="M12 2.2c-5.4 0-9.8 4.4-9.8 9.8 0 1.7.5 3.4 1.3 4.9L2.1 21.9l5.2-1.4c1.4.8 3 1.2 4.7 1.2 5.4 0 9.8-4.4 9.8-9.8S17.4 2.2 12 2.2zm0 17.8c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3c-.9-1.4-1.3-3-1.3-4.6 0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4-3.8 8.5-8.4 8.5z" fill="currentColor"/>';

  const DESTINATIONS = [
    { href: 'rooms.html', icon: 'rooms', title: 'Programe', go: 'Patru dintre ele',
      desc: 'After school, școală de vară, ateliere și excursii. Mărimea grupelor, echipa și cât costă.' },
    { href: 'approach.html', icon: 'approach', title: 'Abordare', go: 'Nouă minute',
      desc: 'Blocuri lungi, unelte adevărate și adulți liniștiți — inclusiv cele patru lucruri la care nu ne pricepem.' },
    { href: 'gallery.html', icon: 'gallery', title: 'Galerie', go: 'Patru filmulețe',
      desc: 'Filmări din curte și din sală, exact așa cum arată o zi obișnuită la noi.' },
    { href: 'tur-virtual.html', icon: 'tour', title: 'Tur Virtual', go: 'Cinci minute',
      desc: 'O plimbare filmată prin curte și săli, cu sunet, fără montaj care să ascundă ceva.' },
    { href: 'blog.html', icon: 'blog', title: 'Blog', go: 'Scris de echipă',
      desc: 'Anunțuri, noutăți și povești din săptămâna care a trecut. Echipa se autentifică și publică.' },
    { href: 'journal.html', icon: 'journal', title: 'Jurnal', go: 'Trei articole',
      desc: 'Însemnări din hol, scrise de cine s-a nimerit să fie acolo în momentul acela.' },
    { href: 'faq.html', icon: 'faq', title: 'Întrebări frecvente', go: 'Răspunsuri scurte',
      desc: 'Tot ce ne întreabă părinții înainte să vină în vizită, adunat într-un singur loc.' },
    { href: 'visit.html', icon: 'hours', title: 'Tarife &amp; program', go: 'Chestiuni practice',
      desc: 'Orar, cum ajungeți la noi, lista de așteptare și ce intră în taxă.' },
    { href: 'tel:' + CONTACT.tel, icon: 'phone', title: 'Sună-ne', go: CONTACT.telPretty, mod: 'call',
      desc: 'Cineva răspunde întotdeauna, ceea ce e mai mult decât putem promite despre e-mail.' },
    { href: 'visit.html#enquire', icon: 'visit', title: 'Programează o vizită', go: 'Cere o marți', mod: 'book',
      desc: 'La zece dimineața, când e gălăgie. Patruzeci de minute, fără prezentare și fără mapă.' }
  ];

  function dashboard() {
    const bar = $('.masthead__actions');
    if (!bar) return;

    const burger = $('[data-burger]');

    // Marcajul burgerului încă arată spre sertarul pe care panoul l-a înlocuit.
    burger?.setAttribute('aria-controls', 'dash');

    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dash-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'dash');
    trigger.innerHTML =
      '<span class="dash-trigger__dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
      'Meniu <kbd aria-hidden="true">' + (isMac ? '⌘' : 'Ctrl ') + 'K</kbd>';
    bar.insertBefore(trigger, burger || null);

    const panel = document.createElement('div');
    panel.className = 'dash';
    panel.id = 'dash';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Tot ce găsiți la Arcobaleno');
    panel.setAttribute('inert', '');

    const cards = DESTINATIONS.map((d, i) => `
      <a class="dashcard${d.mod ? ' dashcard--' + d.mod : ''}" href="${d.href}" style="--i:${i}">
        <span class="dashcard__no">${String(i + 1).padStart(2, '0')}</span>
        <svg class="dashcard__icon" viewBox="0 0 16 16" aria-hidden="true">${ICON[d.icon]}</svg>
        <span class="dashcard__title">${d.title}</span>
        <span class="dashcard__desc">${d.desc}</span>
        <span class="dashcard__go">${d.go}
          <svg viewBox="0 0 16 16" aria-hidden="true">${ICON.arrow}</svg>
        </span>
      </a>`).join('');

    panel.innerHTML = `
      <div class="dash__sheet">
        <header class="dash__head">
          <p class="eyebrow">Tot ce găsiți la Arcobaleno</p>
          <button class="dash__close" type="button">
            <span class="u-sr">Închide meniul</span>
            <svg viewBox="0 0 16 16" aria-hidden="true">${ICON.close}</svg>
          </button>
        </header>
        <nav class="dash__grid" aria-label="Toate secțiunile">${cards}</nav>
        <footer class="dash__foot">
          <span><strong>Str. Preot Toma Georgescu nr. 12</strong>, Târgoviște</span>
          <span>De luni până vineri, <strong>7:30 &ndash; 18:00</strong></span>
          <span data-dash-now></span>
        </footer>
      </div>`;

    document.body.append(panel);

    const close = $('.dash__close', panel);
    let lastFocus = null;

    const focusables = () =>
      $$('a[href], button:not([disabled])', panel).filter((el) => el.offsetParent !== null);

    const setOpen = (open) => {
      panel.dataset.open = String(open);
      panel.toggleAttribute('inert', !open);
      trigger.setAttribute('aria-expanded', String(open));
      burger?.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';

      if (open) {
        lastFocus = document.activeElement;
        mirrorNow();
        // Forțăm calculul stilurilor ca panoul să fie chiar vizibil — un element
        // ascuns nu poate primi focus, iar așteptarea unui cadru care s-ar putea
        // să nu vină niciodată (filă de fundal, randare headless) ar bloca dialogul.
        void panel.offsetHeight;
        // Aterizăm pe prima destinație, nu pe butonul de închidere — panoul
        // există ca să alegi unde mergi.
        ($('.dashcard', panel) || focusables()[0])?.focus({ preventScroll: true });
      } else if (lastFocus instanceof HTMLElement) {
        lastFocus.focus({ preventScroll: true });
      }
    };

    const isOpen = () => panel.dataset.open === 'true';

    // Preluăm în subsolul panoului linia „chiar acum”, când există.
    const mirrorNow = () => {
      const slot = $('[data-dash-now]', panel);
      const what = $('[data-now-what]');
      if (slot && what) slot.innerHTML = 'Chiar acum: <strong>' + what.textContent + '</strong>';
    };

    trigger.addEventListener('click', () => setOpen(!isOpen()));
    burger?.addEventListener('click', () => setOpen(!isOpen()));
    close.addEventListener('click', () => setOpen(false));

    panel.addEventListener('click', (e) => {
      if (e.target === panel) setOpen(false);           // clic pe fundal
      else if (e.target.closest('a')) setOpen(false);   // sau alegi o destinație
    });

    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();

      if (k === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!isOpen());
        return;
      }

      if (!isOpen()) return;

      if (e.key === 'Escape') { setOpen(false); return; }

      // Tab rămâne în interiorul dialogului.
      if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }

      // Săgețile se plimbă prin carduri.
      if (e.key.startsWith('Arrow')) {
        const list = $$('.dashcard', panel);
        if (!list.length) return;
        e.preventDefault();
        const at = list.indexOf(document.activeElement);
        // Dacă focusul e altundeva în dialog (pe X, să zicem), intri în grilă.
        if (at === -1) { list[0].focus(); return; }
        const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        list[(at + step + list.length) % list.length].focus();
      }
    });

    matchMedia('(min-width: 62em)').addEventListener('change', () => {
      if (isOpen()) setOpen(false);
    });
  }

  /* --------------------------------------------------------------- dezvăluiri */

  function reveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (calm.matches || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach((el) => io.observe(el));

    // Plasă de siguranță. Dacă observatorul nu se declanșează niciodată — filă
    // de fundal, randare headless, ceva la care nu ne-am gândit — textul nu are
    // voie să rămână invizibil.
    setTimeout(() => {
      items.forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
      });
    }, 4000);
  }

  /* ------------------------------------------------------------- sublinieri */

  function marks() {
    const items = $$('[data-mark]');
    if (!items.length) return;

    items.forEach((el) => {
      const path = $('path', el);
      if (!path) return;

      // Dăm lungimea reală a traseului către CSS, ca animația să fie exactă.
      const len = Math.ceil(path.getTotalLength());
      el.style.setProperty('--len', len);

      if (calm.matches) { el.classList.add('is-drawn'); return; }

      new IntersectionObserver(([entry], obs) => {
        if (!entry.isIntersecting) return;
        // Lăsăm titlul să se așeze înainte să pornească creionul.
        setTimeout(() => el.classList.add('is-drawn'), 420);
        obs.disconnect();
      }, { threshold: 0.6 }).observe(el);
    });
  }

  /* ------------------------------------------------------------------ bandă */

  function ticker() {
    const track = $('[data-ticker]');
    if (!track) return;

    const group = $('.ticker__group', track);
    if (!group) return;

    // Duplicăm o dată, ca translateX(-50%) să cadă pe o cusătură invizibilă.
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);
  }

  /* ------------------------------------------------------------------ ceasul
     Programul stă în marcaj, așa că widgetul și orarul tipărit nu se pot
     îndepărta niciodată unul de celălalt. */

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const toClock = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = String(mins % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  /* Româna cere „de” după douăzeci: 1 minut, 5 minute, 25 de minute. */
  const plural = (n, one, few) =>
    n === 1 ? `un ${one}` : (n % 100 >= 20 || n % 100 === 0 ? `${n} de ${few}` : `${n} ${few}`);

  const hours = (n) =>
    n === 1 ? 'o oră' : (n % 100 >= 20 || n % 100 === 0 ? `${n} de ore` : `${n} ore`);

  function nowWidget() {
    const box = $('[data-now]');
    const rows = $$('.rhythm__row');
    if (!box || !rows.length) return;

    const label = $('[data-now-label]', box);
    const what  = $('[data-now-what]', box);
    const meta  = $('[data-now-meta]', box);

    const schedule = rows.map((row) => ({
      row,
      from: toMinutes(row.dataset.from),
      to:   toMinutes(row.dataset.to),
      title: $('.rhythm__what', row).textContent.trim()
    }));

    const opens  = schedule[0].from;
    const closes = schedule[schedule.length - 1].to;

    const render = () => {
      const d = new Date();
      const mins = d.getHours() * 60 + d.getMinutes();
      const weekend = d.getDay() === 0 || d.getDay() === 6;

      rows.forEach((row) => row.removeAttribute('data-now'));

      const stamp = d.toLocaleTimeString('ro-RO', { hour: 'numeric', minute: '2-digit' });
      label.textContent = `Chiar acum · ${stamp}`;

      if (weekend) {
        box.dataset.open = 'false';
        what.textContent = 'Curtea e goală';
        meta.textContent = `Deschidem din nou luni, la ${toClock(opens)}.`;
        return;
      }

      if (mins < opens) {
        const wait = opens - mins;
        box.dataset.open = 'false';
        what.textContent = 'Încă nu am deschis';
        meta.textContent = wait > 60
          ? `Ușile se deschid la ${toClock(opens)}, peste aproximativ ${hours(Math.round(wait / 60))}.`
          : `Ușile se deschid la ${toClock(opens)}, peste ${plural(wait, 'minut', 'minute')}.`;
        return;
      }

      if (mins >= closes) {
        box.dataset.open = 'false';
        what.textContent = 'Toată lumea a plecat acasă';
        meta.textContent = `Sigur a rămas ceva în urmă. Revenim la ${toClock(opens)}.`;
        return;
      }

      const slot = schedule.find((s) => mins >= s.from && mins < s.to) || schedule[schedule.length - 1];
      box.dataset.open = 'true';
      what.textContent = slot.title;
      meta.textContent = `De la ${toClock(slot.from)} — până la ${toClock(slot.to)}.`;
      slot.row.setAttribute('data-now', 'true');
    };

    render();
    setInterval(render, 30000);
  }

  /* ------------------------------------------------------------- video erou
     Filmul de fundal e decorativ. Îl pornim doar dacă utilizatorul nu a cerut
     mai puțină mișcare și dacă rețeaua nu e declarată lentă; altfel rămâne
     cadrul static și pagina arată la fel de bine. */

  function heroVideo() {
    // Două elemente pe ecran lat (cadrul întreg + fundalul neclar), unul pe
    // ecran îngust. Le comandăm pe toate deodată, ca să rămână sincronizate.
    const videos = $$('[data-hero-video]');
    if (!videos.length) return;

    const main = $('.hero__media-main') || videos[0];
    const hero = main.closest('.hero');
    const saveData = navigator.connection?.saveData === true;
    const slow = /2g/.test(navigator.connection?.effectiveType || '');

    if (calm.matches || saveData || slow) {
      videos.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
      hero?.setAttribute('data-video', 'off');
      return;
    }

    main.addEventListener('loadeddata', () => hero?.setAttribute('data-video', 'on'), { once: true });
    // Unele browsere refuză autoplay până la o interacțiune; nu insistăm.
    videos.forEach((v) => v.play?.().catch(() => {}));

    // Butonul de pauză din colț, pentru cine vrea liniște.
    const toggle = $('[data-hero-toggle]');
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        const playing = !main.paused;
        videos.forEach((v) => {
          if (playing) v.pause();
          else { v.currentTime = main.currentTime; v.play().catch(() => {}); }
        });
        toggle.dataset.playing = String(!playing);
        toggle.setAttribute('aria-label', playing ? 'Pornește filmul de fundal' : 'Oprește filmul de fundal');
      });
    }

    // Butonul de sunet, lângă cel de pauză. Filmul pornește mut — așa cere
    // autoplay-ul — și rămâne mut până la clic. Clicul e un gest al omului,
    // deci browserul are voie să pornească sunetul chiar și pe un film care
    // rula deja.
    const sound = $('[data-hero-sound]');
    if (sound) {
      const label = $('[data-hero-sound-label]', sound);
      sound.hidden = false;
      sound.addEventListener('click', () => {
        const wasMuted = main.muted;
        videos.forEach((v) => {
          v.muted = !wasMuted;
          // Volumul poate rămâne pe 0 dintr-o sesiune anterioară; îl punem
          // explicit, altfel „nemut” tot n-ar scoate niciun sunet.
          if (wasMuted) v.volume = 1;
        });
        sound.dataset.muted = String(!wasMuted);
        sound.setAttribute('aria-label', wasMuted ? 'Oprește sunetul filmului' : 'Pornește sunetul filmului');
        if (label) label.textContent = wasMuted ? 'Oprește sunetul' : 'Pornește sunetul';
      });
    }
  }

  /* ---------------------------------------------------------------- galerie
     Cardurile rulează o previzualizare mută la hover; clicul deschide filmul
     mare, cu sunet și cu comenzi. */

  function gallery() {
    const cards = $$('[data-video-card]');
    if (!cards.length) return;

    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    cards.forEach((card) => {
      const preview = $('video', card);
      if (preview && fine && !calm.matches) {
        card.addEventListener('pointerenter', () => preview.play().catch(() => {}));
        card.addEventListener('pointerleave', () => { preview.pause(); preview.currentTime = 0; });
      }
    });

    // Un singur strat de lightbox, refolosit.
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Filmul din galerie');
    box.setAttribute('inert', '');
    box.innerHTML = `
      <button class="lightbox__close" type="button">
        <span class="u-sr">Închide filmul</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">${ICON.close}</svg>
      </button>
      <figure class="lightbox__frame">
        <video controls playsinline preload="metadata"></video>
        <figcaption data-lightbox-caption></figcaption>
      </figure>`;
    document.body.append(box);

    const video   = $('video', box);
    const caption = $('[data-lightbox-caption]', box);
    let lastFocus = null;

    const open = (src, text, poster) => {
      lastFocus = document.activeElement;
      video.src = src;
      if (poster) video.poster = poster;
      caption.textContent = text || '';
      box.dataset.open = 'true';
      box.removeAttribute('inert');
      document.body.style.overflow = 'hidden';
      void box.offsetHeight;
      $('.lightbox__close', box).focus({ preventScroll: true });
      video.play().catch(() => {});
    };

    const close = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      box.dataset.open = 'false';
      box.setAttribute('inert', '');
      document.body.style.overflow = '';
      if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
    };

    cards.forEach((card) => {
      $('[data-video-open]', card)?.addEventListener('click', () => {
        open(card.dataset.videoCard, card.dataset.videoTitle, card.dataset.videoPoster);
      });
    });

    $('.lightbox__close', box).addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.dataset.open === 'true') close();
    });
  }

  /* --------------------------------------------------------------- WhatsApp
     Un buton plutitor cu o fereastră de chat. Are două comportamente:

     1. Cu `CONTACT.relay` completat — mesajul pleacă prin POST către releu,
        care îl livrează pe WhatsApp-ul școlii. Vizitatorul rămâne pe site și
        vede o confirmare în fereastră. Ăsta e comportamentul dorit.
     2. Fără releu — se deschide wa.me cu textul deja scris, ca până acum.
        Rămâne și ca plasă de siguranță dacă releul cade.

     Releul are nevoie de un server: cheia WhatsApp Business nu are ce căuta
     într-un fișier JS public. Vezi `api/whatsapp.js` și README. */

  const WA_PROMPTS = [
    'Bună ziua! Aș vrea să înscriu un copil la after school.',
    'Bună ziua! Care sunt tarifele și ce include taxa?',
    'Bună ziua! Aș dori să programez o vizită.',
    'Bună ziua! Mai aveți locuri libere pentru anul acesta?'
  ];

  function whatsapp() {
    if ($('[data-wa]')) return;

    const wrap = document.createElement('div');
    wrap.className = 'wa';
    wrap.setAttribute('data-wa', '');

    wrap.innerHTML = `
      <div class="wa__panel" id="wa-panel" data-wa-panel inert>
        <header class="wa__head">
          <span class="wa__avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24">${WA_GLYPH}</svg>
          </span>
          <span class="wa__who">
            <strong>Arcobaleno Afterschool</strong>
            <span>De obicei răspundem în câteva minute</span>
          </span>
          <button class="wa__close" type="button" data-wa-close>
            <span class="u-sr">Închide conversația</span>
            <svg viewBox="0 0 16 16" aria-hidden="true">${ICON.close}</svg>
          </button>
        </header>

        <div class="wa__body">
          <p class="wa__bubble">
            Bună ziua! 👋 Scrieți-ne aici și vă răspundem pe WhatsApp.
            Alegeți o întrebare sau formulați-o cu cuvintele dumneavoastră.
          </p>
          <div class="wa__chips">
            ${WA_PROMPTS.map((p) => `<button class="wa__chip" type="button" data-wa-chip="${p}">${p.replace('Bună ziua! ', '')}</button>`).join('')}
          </div>
        </div>

        <form class="wa__form" data-wa-form>
          <label class="u-sr" for="wa-message">Mesajul dumneavoastră</label>
          <textarea id="wa-message" name="wa-message" rows="2"
                    placeholder="Scrieți mesajul…" data-wa-input></textarea>
          <button class="wa__send" type="submit" data-wa-submit>
            <span class="u-sr">Trimite mesajul</span>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M14.5 1.5 7.3 8.7M14.5 1.5 10 14.5l-2.7-5.8L1.5 6Z"
                    fill="none" stroke="currentColor" stroke-width="1.4"
                    stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
          </button>
        </form>

        <p class="wa__note" data-wa-note role="status">${
          CONTACT.relay
            ? 'Mesajul ajunge direct pe WhatsApp-ul școlii &middot; ' + CONTACT.telPretty
            : 'Se deschide WhatsApp cu mesajul deja scris &middot; ' + CONTACT.telPretty
        }</p>
      </div>

      <button class="wa__launch" type="button" aria-expanded="false" aria-controls="wa-panel" data-wa-launch>
        <span class="u-sr">Scrie-ne pe WhatsApp</span>
        <svg class="wa__launch-icon" viewBox="0 0 24 24" aria-hidden="true">${WA_GLYPH}</svg>
        <svg class="wa__launch-close" viewBox="0 0 16 16" aria-hidden="true">${ICON.close}</svg>
      </button>`;

    document.body.append(wrap);

    const panel  = $('[data-wa-panel]', wrap);
    const launch = $('[data-wa-launch]', wrap);
    const input  = $('[data-wa-input]', wrap);

    const setOpen = (open) => {
      wrap.dataset.open = String(open);
      panel.toggleAttribute('inert', !open);
      launch.setAttribute('aria-expanded', String(open));
      if (open) {
        void panel.offsetHeight;
        input.focus({ preventScroll: true });
      }
    };

    const note   = $('[data-wa-note]', wrap);
    const submit = $('[data-wa-submit]', wrap);

    const say = (text, tone) => {
      note.innerHTML = text;
      note.dataset.tone = tone || '';
    };

    /* Varianta veche: predăm mesajul aplicației WhatsApp. Folosită când nu e
       configurat niciun releu și ca plasă de siguranță dacă releul cade. */
    const handOff = (message) => {
      window.open(
        `https://wa.me/${CONTACT.wa}?text=${encodeURIComponent(message)}`,
        '_blank', 'noopener'
      );
    };

    const send = async (text) => {
      const message = (text || '').trim();
      if (!message) { input.focus(); return; }

      if (!CONTACT.relay) {
        handOff(message);
        input.value = '';
        setOpen(false);
        return;
      }

      wrap.dataset.sending = 'true';
      submit.disabled = true;
      say('Se trimite…');

      try {
        const res = await fetch(CONTACT.relay, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            page: location.pathname,
            sentAt: new Date().toISOString()
          })
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        input.value = '';
        say('Mesaj trimis. Vă răspundem pe WhatsApp cât putem de repede.', 'ok');
      } catch (err) {
        // Releul nu a răspuns — nu pierdem mesajul, îl predăm aplicației.
        say('Nu am putut trimite din site. Am deschis WhatsApp cu mesajul scris.', 'bad');
        handOff(message);
      } finally {
        wrap.dataset.sending = 'false';
        submit.disabled = false;
      }
    };

    launch.addEventListener('click', () => setOpen(wrap.dataset.open !== 'true'));
    $('[data-wa-close]', wrap).addEventListener('click', () => { setOpen(false); launch.focus(); });

    $$('[data-wa-chip]', wrap).forEach((chip) => {
      chip.addEventListener('click', () => send(chip.dataset.waChip));
    });

    $('[data-wa-form]', wrap).addEventListener('submit', (e) => {
      e.preventDefault();
      send(input.value);
    });

    // Enter trimite, Shift+Enter trece pe rând nou.
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrap.dataset.open === 'true') { setOpen(false); launch.focus(); }
    });

    // Orice link marcat data-wa-open deschide panoul în loc să navigheze.
    $$('[data-wa-open]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); setOpen(true); });
    });
  }

  /* ------------------------------------------------------------------ sus */

  function toTop() {
    const btn = $('[data-top]');
    if (!btn) return;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: calm.matches ? 'auto' : 'smooth' });
    });

    let ticking = false;
    const update = () => {
      ticking = false;
      btn.dataset.show = String(window.scrollY > window.innerHeight * 1.2);
    };

    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* --------------------------------------------------------------- formular */

  function form() {
    const el = $('[data-form]');
    if (!el) return;

    const fields = $$('.field', el);

    const validate = (field) => {
      const input = $('input, select, textarea', field);
      if (!input || !input.required) return true;

      const ok = input.checkValidity() && input.value.trim() !== '';
      field.dataset.invalid = String(!ok);
      return ok;
    };

    fields.forEach((field) => {
      const input = $('input, select, textarea', field);
      if (!input) return;
      input.addEventListener('blur', () => { if (input.value) validate(field); });
      input.addEventListener('input', () => {
        if (field.dataset.invalid === 'true') validate(field);
      });
    });

    el.addEventListener('submit', (e) => {
      e.preventDefault();

      // Roboții completează tot, inclusiv câmpul pe care nimeni nu-l vede.
      if ($('[name="company"]', el).value) return;

      const bad = fields.filter((f) => !validate(f));
      if (bad.length) {
        const input = $('input, select, textarea', bad[0]);
        input.focus();
        input.scrollIntoView({ block: 'center', behavior: calm.matches ? 'auto' : 'smooth' });
        return;
      }

      const name = ($('#child-name', el)?.value || '').trim().split(' ')[0];
      const done = $('[data-form-done]', el);
      if (done && name) {
        done.textContent = done.textContent.replace('{name}', name);
      }

      el.dataset.sent = 'true';
      done?.setAttribute('tabindex', '-1');
      done?.focus({ preventScroll: true });
      done?.scrollIntoView({ block: 'center', behavior: calm.matches ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------ joacă
     Trei jucării de pointer. Toate sunt condiționate de capabilități: pointer
     fin, hover disponibil și mișcare nerestricționată. Nimic de mai jos nu
     schimbă ce scrie în pagină sau unde stă ceva. */

  const playable = () =>
    !calm.matches && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Butoanele principale se apleacă spre cursor cât timp e deasupra lor. */
  function magnetic() {
    if (!playable()) return;

    $$('.btn--clay, .dash-trigger').forEach((el) => {
      let raf = 0;

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--mx', (dx * 0.28).toFixed(2) + 'px');
          el.style.setProperty('--my', (dy * 0.34).toFixed(2) + 'px');
        });
      });

      const settle = () => {
        cancelAnimationFrame(raf);
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      };

      el.addEventListener('pointerleave', settle);
      el.addEventListener('blur', settle);
    });
  }

  /* Ilustrația se apleacă după cursor. */
  function tilt() {
    const art = $('.hero__art');
    const arch = $('.hero__arch');
    if (!art || !arch || !playable()) return;

    let raf = 0;

    art.addEventListener('pointermove', (e) => {
      const r = art.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        arch.style.setProperty('--tilt-y', (px * 7).toFixed(2) + 'deg');
        arch.style.setProperty('--tilt-x', (-py * 5).toFixed(2) + 'deg');
      });
    });

    art.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      arch.style.setProperty('--tilt-x', '0deg');
      arch.style.setProperty('--tilt-y', '0deg');
    });
  }

  /* Clicul pe siglă scutură copacul. Pe pagina în care ești deja te duce sus
     în loc să reîncarce. */
  function leaves() {
    const mark = $('.masthead .mark');
    if (!mark) return;

    const here = location.pathname.split('/').pop() || 'index.html';
    const tones = ['var(--sage)', 'var(--ochre)', 'var(--clay)', 'var(--sky)', 'var(--petal)', 'var(--plum)'];

    mark.addEventListener('click', (e) => {
      if (mark.getAttribute('href') === here) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: calm.matches ? 'auto' : 'smooth' });
      }

      if (calm.matches) return;

      const r = mark.getBoundingClientRect();
      const count = 7 + Math.floor(Math.random() * 4);

      for (let i = 0; i < count; i++) {
        const leaf = document.createElement('span');
        leaf.className = 'leaf';
        leaf.style.cssText = [
          `left:${r.left + Math.random() * r.width}px`,
          `top:${r.bottom - 8}px`,
          `--leaf-size:${(9 + Math.random() * 11).toFixed(1)}px`,
          `--leaf-colour:${tones[i % tones.length]}`,
          `--leaf-dx:${((Math.random() - 0.5) * 190).toFixed(0)}px`,
          `--leaf-dy:${(140 + Math.random() * 230).toFixed(0)}px`,
          `--leaf-spin:${((Math.random() - 0.5) * 720).toFixed(0)}deg`,
          `--leaf-life:${(1500 + Math.random() * 1400).toFixed(0)}ms`
        ].join(';');

        document.body.append(leaf);
        leaf.addEventListener('animationend', () => leaf.remove(), { once: true });
      }
    });
  }

  /* ------------------------------------------------------------------ start */

  const start = () => {
    currentPage();
    banner();
    masthead();
    dashboard();
    reveal();
    marks();
    ticker();
    nowWidget();
    portraits();
    heroFit();
    heroVideo();
    gallery();
    whatsapp();
    toTop();
    form();
    magnetic();
    tilt();
    leaves();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
