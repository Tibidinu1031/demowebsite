# Fernhollow

A marketing site for a fictional kindergarten and after-school. Static HTML, CSS
and vanilla JavaScript — no build step, no dependencies, no framework. Open
`index.html` in a browser and it works.

```bash
python -m http.server 4321
```

Then visit <http://localhost:4321>. (A file:// open works too, but a server is
better — `fetch`, cross-document view transitions and relative canonicals all
behave properly over HTTP.)

---

## Structure

```
index.html              Home
rooms.html              The three rooms, staffing, and the full fee table
approach.html           Long-form philosophy, including what the school is bad at
journal.html            Post index, plus a paper-only archive list
journal-the-hole.html   Feature article
journal-boredom.html    Article
journal-bread.html      Article
visit.html              Enquiry form, practicalities, FAQ
404.html                Not-found page

assets/css/base.css        Layer order, reset, design tokens, element defaults
assets/css/layout.css      The shell grid, sections, header, footer, panels
assets/css/components.css  Everything reusable; plus the utilities layer
assets/css/pages.css       Page-level composition, print styles
assets/js/site.js          Nine small modules, each a no-op if its markup is absent
assets/img/*.svg           Hand-authored illustrations
```

`favicon.svg`, `robots.txt` and `sitemap.xml` sit at the root.

## Design notes

**Type.** Fraunces for display, driven through its variable `SOFT`, `WONK` and
`opsz` axes rather than just `wght` — that is where its character lives. Instrument
Sans for text. Both from Google Fonts with a real system fallback stack behind them.

**Colour.** Sampled from paper stock rather than a screen: warm cream, pine ink,
unglazed terracotta, ochre, sage. Semantic tokens (`--rule`, `--surface`) are
derived from the palette with `color-mix()`, so a palette change propagates.

**Layout.** One named grid (`.shell`) handles every width on the site — text, wide
and full-bleed — via named grid lines. Sections opt in with `.u-wide` / `.u-full`
instead of nesting containers.

**The hero fits the fold.** From 64em up, the hero is `100svh` minus the header and
every vertical measurement is capped with `min(<fluid>, <vh>)`: on a tall display the
normal fluid scale wins, on a short laptop the height term takes over and the whole
composition shrinks together rather than overflowing. The artwork takes whichever is
narrower — the column, or the width the leftover height allows at its 72:88 ratio.
Below 64em the hero stacks and flows normally, because it cannot fit a screen at a
readable size.

**Cascade layers.** Declared once at the top of `base.css` as
`reset, tokens, base, layout, components, pages, utilities`. Utilities win without
`!important` because of where the layer sits, not because of specificity.

**Texture.** A fixed, tiled `feTurbulence` overlay at low opacity, lightened on
high-DPI displays. It is the single reason the flat fills read as stock.

**Motion.** Cross-document view transitions where supported; scroll reveals via
`IntersectionObserver` with a 4-second failsafe so text can never be stranded
invisible; every animation is disabled under `prefers-reduced-motion`.

## The dashboard

One overlay lists every destination at once — Rooms, Approach, Journal, Fees &
hours, Call us, Book a visit — as cards with a line of description each. The two
that *do* something rather than go somewhere (call, book) are styled apart.

It is built by `site.js` rather than repeated in nine HTML files, so the
destination list lives in exactly one place (`DESTINATIONS`). It replaced both
the old mobile drawer *and* the header nav — the masthead is now just the
wordmark and the menu button, and every destination lives behind that one door.

| Open it | |
|---|---|
| `Cmd/Ctrl + K` | anywhere |
| The **Menu** button | 62em and up |
| The burger | below 62em |

`Esc` closes and returns focus to whichever control opened it. `Tab` is trapped
inside the dialog and wraps. Arrow keys walk the cards and wrap around; pressing
one while focus is elsewhere in the dialog drops you into the grid. The footer
mirrors the live "right now" line from the home page when it is present.

Without JavaScript there is no dashboard, so the header nav lives inside a
`<noscript>` block and the burger is hidden — the site stays navigable. The
in-page calls to action (the hero button, the closing CTA, the footer links) are
page content and were left alone.

## Playful interactions

All of it is gated on a fine pointer, hover being available, and
`prefers-reduced-motion: no-preference`. None of it changes what the page says
or where anything sits.

- **Magnetic buttons** — primary CTAs and the menu trigger lean toward the cursor.
- **Tilting artwork** — the garden leans with the pointer, ±3.4° of yaw, ±2.4° of pitch.
- **Shake the tree** — clicking the wordmark drops a scatter of leaves. On the page
  you are already on it scrolls to the top rather than reloading.
- Room illustrations breathe on hover, tenet numbers tip over, timetable times step
  forward with their row, the seal spins faster near the cursor, and the four dots in
  the menu trigger scatter.

## The "right now" widget

The home page shows what is happening at the school at this moment. It reads its
schedule from the `data-from` / `data-to` attributes on the printed timetable
itself, so the widget and the timetable cannot drift apart. It also handles
before-open, after-close and weekends, and highlights the live row.

## Accessibility

Skip link, one `h1` per page, labelled landmarks, visible focus rings, `inert` on
the closed mobile drawer with focus returned to the trigger on close, `aria-current`
on the active nav item, alt text on every image, and a decorative-only marquee
hidden from assistive tech. Verified: no horizontal overflow at 375px on any page.

## Before this goes live

- **The form is front-end only.** `visit.html` intercepts submit and shows an inline
  confirmation. Point `action` at a real handler (Formspree, Netlify Forms, a
  serverless function) and remove the `preventDefault` branch in `site.js` if you
  want a plain POST. The honeypot field is already wired.
- **Serve `404.html` with a real 404 status** — that is automatic on Netlify, Vercel
  and GitHub Pages; on nginx use `error_page 404 /404.html;`.
- **Replace `https://fernhollow.school/`** in the canonical tags, `sitemap.xml`,
  `robots.txt` and the JSON-LD.
- **Add a raster `og:image`.** It currently points at an SVG, which most social
  platforms will not render. A 1200×630 PNG is what you want.
- **Self-host the fonts** if you would rather not depend on Google Fonts.

## A note on the content

Fernhollow is invented. The name, address, phone number, staff, fees, testimonials
and journal entries are all placeholder copy written to demonstrate the design at a
realistic density — the phone number uses the `555` reserved prefix. Replace every
word of it before using this for a real school, and check that any claims about
ratios, licensing and safeguarding match what that school can actually stand behind.
