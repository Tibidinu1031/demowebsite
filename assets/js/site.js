/* ==========================================================================
   Fernhollow — site behaviour
   No dependencies. Every module is optional: if its markup isn't on the page
   it returns quietly.
   ========================================================================== */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------- nav */

  function currentPage() {
    const here = location.pathname.split('/').pop() || 'index.html';

    $$('.navlink, .drawer__list a').forEach((a) => {
      const target = a.getAttribute('href');
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ------------------------------------------------------------ masthead */

  function masthead() {
    const bar = $('[data-masthead]');
    if (!bar) return;

    // A zero-height sentinel is cheaper than listening to scroll.
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    new IntersectionObserver(
      ([entry]) => bar.dataset.stuck = String(!entry.isIntersecting),
      { rootMargin: '-8px 0px 0px 0px' }
    ).observe(sentinel);
  }

  /* ----------------------------------------------------------- dashboard
     One overlay listing every destination, built here rather than repeated in
     nine HTML files. It replaces the old mobile drawer: the burger opens it
     below 62em, the labelled trigger opens it above, and Cmd/Ctrl-K opens it
     anywhere. Without JS the header nav is shown inline instead (see
     layout.css) so the site is still navigable. */

  const ICON = {
    rooms: '<path d="M3.4 13.8V7.4a4.6 4.6 0 0 1 9.2 0v6.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M1.6 13.8h12.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="10.3" cy="9.7" r=".9" fill="currentColor"/>',
    approach: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10.8 5.2 9.3 9.3 5.2 10.8 6.7 6.7Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    journal: '<path d="M8 4.6C7 3.6 5.6 3.1 3.4 3.1H2v9.3h1.6c2 0 3.4.5 4.4 1.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 4.6c1-1 2.4-1.5 4.6-1.5H14v9.3h-1.6c-2 0-3.4.5-4.4 1.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 4.6v9.2" fill="none" stroke="currentColor" stroke-width="1.3"/>',
    hours: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.3V8l2.7 1.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    phone: '<path d="M5.6 2.4 7 5.1 5.6 6.6c.6 1.5 2.3 3.2 3.8 3.8l1.5-1.4 2.7 1.4-.4 2.4c-.1.6-.6 1-1.2 1C6.6 13.7 2.3 9.4 2.2 4c0-.6.4-1.1 1-1.2Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    visit: '<rect x="2.2" y="3.4" width="11.6" height="10.4" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.2 6.7h11.6M5.4 2.2v2.5M10.6 2.2v2.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="m6 10.3 1.5 1.5 3-3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>',
    arrow: '<path d="M2 8h12M9 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="m3.5 3.5 9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  };

  const DESTINATIONS = [
    { href: 'rooms.html', icon: 'rooms', title: 'Rooms', go: 'Three of them',
      desc: 'The Nest, The Grove and Hollow Club. Group sizes, staffing, and what a week actually costs.' },
    { href: 'approach.html', icon: 'approach', title: 'Approach', go: 'Nine minutes',
      desc: 'Long blocks, real tools and quiet adults — including the four things we are not good at.' },
    { href: 'journal.html', icon: 'journal', title: 'Journal', go: 'Three entries',
      desc: 'Notes from the hall, written by whoever happened to be standing there at the time.' },
    { href: 'visit.html', icon: 'hours', title: 'Fees &amp; hours', go: 'Practicalities',
      desc: 'Opening times, directions, the waitlist, and the questions parents actually ask.' },
    { href: 'tel:+15550148', icon: 'phone', title: 'Call us', go: '(555) 014-8', mod: 'call',
      desc: 'Someone always picks up, which is more than we can promise about the email.' },
    { href: 'visit.html#enquire', icon: 'visit', title: 'Book a visit', go: 'Ask for a Tuesday', mod: 'book',
      desc: 'Ten in the morning, when it is noisy. Forty minutes, no presentation, no folder.' }
  ];

  function dashboard() {
    const bar = $('.masthead__actions');
    if (!bar) return;

    const burger = $('[data-burger]');

    // The burger's markup still points at the drawer this replaced.
    burger?.setAttribute('aria-controls', 'dash');

    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dash-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'dash');
    trigger.innerHTML =
      '<span class="dash-trigger__dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
      'Menu <kbd aria-hidden="true">' + (isMac ? '⌘' : 'Ctrl ') + 'K</kbd>';
    bar.insertBefore(trigger, burger || null);

    const panel = document.createElement('div');
    panel.className = 'dash';
    panel.id = 'dash';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Everything at Fernhollow');
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
          <p class="eyebrow">Everything at Fernhollow</p>
          <button class="dash__close" type="button">
            <span class="u-sr">Close menu</span>
            <svg viewBox="0 0 16 16" aria-hidden="true">${ICON.close}</svg>
          </button>
        </header>
        <nav class="dash__grid" aria-label="All sections">${cards}</nav>
        <footer class="dash__foot">
          <span><strong>12 Wexford Lane</strong>, Alder Park 05412</span>
          <span>Monday to Friday, <strong>7:30am &ndash; 6:00pm</strong></span>
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
        // Flush styles so the panel is actually visible — a hidden element
        // can't take focus, and waiting on a frame that may never come
        // (background tab, headless render) would strand the dialog.
        void panel.offsetHeight;
        // Land on the first destination, not the close button — picking somewhere
        // to go is what this panel is for.
        ($('.dashcard', panel) || focusables()[0])?.focus({ preventScroll: true });
      } else if (lastFocus instanceof HTMLElement) {
        lastFocus.focus({ preventScroll: true });
      }
    };

    const isOpen = () => panel.dataset.open === 'true';

    // Echo the live "right now" line into the panel footer, when it exists.
    const mirrorNow = () => {
      const slot = $('[data-dash-now]', panel);
      const what = $('[data-now-what]');
      if (slot && what) slot.innerHTML = 'Right now: <strong>' + what.textContent + '</strong>';
    };

    trigger.addEventListener('click', () => setOpen(!isOpen()));
    burger?.addEventListener('click', () => setOpen(!isOpen()));
    close.addEventListener('click', () => setOpen(false));

    panel.addEventListener('click', (e) => {
      if (e.target === panel) setOpen(false);           // click the backdrop
      else if (e.target.closest('a')) setOpen(false);   // or pick a destination
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

      // Keep Tab inside the dialog.
      if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        return;
      }

      // Arrow keys walk the cards.
      if (e.key.startsWith('Arrow')) {
        const list = $$('.dashcard', panel);
        if (!list.length) return;
        e.preventDefault();
        const at = list.indexOf(document.activeElement);
        // Focus elsewhere in the dialog (the close button, say) drops into the grid.
        if (at === -1) { list[0].focus(); return; }
        const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        list[(at + step + list.length) % list.length].focus();
      }
    });

    matchMedia('(min-width: 62em)').addEventListener('change', () => {
      if (isOpen()) setOpen(false);
    });
  }

  /* -------------------------------------------------------------- reveal */

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

    // Insurance. If the observer never fires — a background tab, a headless
    // renderer, something we haven't thought of — text must not stay invisible.
    setTimeout(() => {
      items.forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
      });
    }, 4000);
  }

  /* ------------------------------------------------------- drawn marks */

  function marks() {
    const items = $$('[data-mark]');
    if (!items.length) return;

    items.forEach((el) => {
      const path = $('path', el);
      if (!path) return;

      // Feed the real path length to CSS so the dash animation is exact.
      const len = Math.ceil(path.getTotalLength());
      el.style.setProperty('--len', len);

      if (calm.matches) { el.classList.add('is-drawn'); return; }

      new IntersectionObserver(([entry], obs) => {
        if (!entry.isIntersecting) return;
        // Let the headline settle before the pen moves.
        setTimeout(() => el.classList.add('is-drawn'), 420);
        obs.disconnect();
      }, { threshold: 0.6 }).observe(el);
    });
  }

  /* -------------------------------------------------------------- ticker */

  function ticker() {
    const track = $('[data-ticker]');
    if (!track) return;

    const group = $('.ticker__group', track);
    if (!group) return;

    // Duplicate once so translateX(-50%) lands on a seam we can't see.
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);
  }

  /* ----------------------------------------------------------- the clock
     The schedule lives in the markup, so the widget and the printed
     timetable can never drift apart. */

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const toClock = (mins) => {
    const h24 = Math.floor(mins / 60) % 24;
    const m = String(mins % 60).padStart(2, '0');
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${m}${h24 < 12 ? 'am' : 'pm'}`;
  };

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

      const stamp = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      label.textContent = `Right now · ${stamp}`;

      if (weekend) {
        box.dataset.open = 'false';
        what.textContent = 'The garden is empty';
        meta.textContent = `We open again Monday at ${toClock(opens)}.`;
        return;
      }

      if (mins < opens) {
        const wait = opens - mins;
        box.dataset.open = 'false';
        what.textContent = 'Not open yet';
        meta.textContent = wait > 60
          ? `Doors open at ${toClock(opens)}, in about ${plural(Math.round(wait / 60), 'hour')}.`
          : `Doors open at ${toClock(opens)}, in ${plural(wait, 'minute')}.`;
        return;
      }

      if (mins >= closes) {
        box.dataset.open = 'false';
        what.textContent = 'Everyone has gone home';
        meta.textContent = `Something has certainly been left behind. Back at ${toClock(opens)}.`;
        return;
      }

      const slot = schedule.find((s) => mins >= s.from && mins < s.to) || schedule[schedule.length - 1];
      box.dataset.open = 'true';
      what.textContent = slot.title;
      meta.textContent = `Since ${toClock(slot.from)} — until ${toClock(slot.to)}.`;
      slot.row.setAttribute('data-now', 'true');
    };

    render();
    setInterval(render, 30000);
  }

  /* ------------------------------------------------------------ parallax */

  function parallax() {
    const art = $('[data-parallax] .hero__arch img');
    if (!art || calm.matches) return;
    if (!matchMedia('(min-width: 64em)').matches) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const shift = Math.max(-40, Math.min(0, -window.scrollY * 0.045));
      art.style.setProperty('--py', `${shift}px`);
    };

    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* -------------------------------------------------------------- to top */

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

  /* ---------------------------------------------------------------- form */

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

      // Bots fill everything, including the field nobody can see.
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

  /* ------------------------------------------------------------ playful
     Three pointer toys. All of them are opt-in on capability: fine pointer,
     hover available, and motion not reduced. Nothing below changes what the
     page says or where anything sits. */

  const playable = () =>
    !calm.matches && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Primary buttons lean towards the cursor while it's over them. */
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

  /* The garden leans with the cursor. */
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

  /* Clicking the wordmark shakes the tree. On the page you're already on it
     takes you back to the top instead of reloading. */
  function leaves() {
    const mark = $('.masthead .mark');
    if (!mark) return;

    const here = location.pathname.split('/').pop() || 'index.html';
    const tones = ['var(--sage)', 'var(--ochre)', 'var(--clay)', 'var(--sage-deep)', 'var(--petal)'];

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

  /* ----------------------------------------------------------------- go */

  const start = () => {
    currentPage();
    masthead();
    dashboard();
    reveal();
    marks();
    ticker();
    nowWidget();
    parallax();
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
