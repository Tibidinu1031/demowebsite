/* ==========================================================================
   Arcobaleno — releu WhatsApp

   Primește mesajul scris în chatul de pe site și îl livrează pe WhatsApp-ul
   școlii, prin WhatsApp Business Cloud API (Meta).

   DE CE ARE NEVOIE DE SERVER
   Cheia de acces nu are ce căuta într-un fișier JS public: cine o citește
   poate trimite mesaje în numele școlii. De aceea pasul ăsta se face pe
   server, unde cheia stă într-o variabilă de mediu.

   UNDE SE PUNE
   Fișierul e scris pentru Vercel (`/api/whatsapp` → funcție Node). Merge la
   fel pe Netlify (mutat în `netlify/functions/`) și, cu mici ajustări la
   `req`/`res`, pe Cloudflare Workers. Vezi secțiunea „WhatsApp” din README.

   VARIABILE DE MEDIU
     WHATSAPP_TOKEN        Cheia permanentă din Meta (System User Access Token)
     WHATSAPP_PHONE_ID     ID-ul numărului expeditor, din Meta → WhatsApp → API
     WHATSAPP_TO           Numărul care primește mesajele: 40721996570
     WHATSAPP_TEMPLATE     Numele șablonului aprobat (implicit: mesaj_site)
     WHATSAPP_TEMPLATE_LANG Codul de limbă al șablonului (implicit: ro)
     ALLOWED_ORIGIN        Domeniul site-ului, pentru CORS (implicit: *)

   DESPRE ȘABLON
   Meta nu lasă o firmă să înceapă o conversație cu text liber. Primul mesaj
   trimis către un număr trebuie să fie un „template” aprobat în prealabil.
   Creați în Meta Business Manager un șablon cu o singură variabilă în corp,
   de exemplu:

     Nume:  mesaj_site
     Corp:  Mesaj nou de pe site: {{1}}

   După ce numărul care primește răspunde o dată, se deschide o fereastră de
   24 de ore în care se poate trimite și text liber. Codul de mai jos încearcă
   întâi textul liber și cade pe șablon dacă Meta îl refuză, așa că merge în
   ambele situații.
   ========================================================================== */

const GRAPH = 'https://graph.facebook.com/v21.0';

/* Limita de lungime ține departe încercările de a umple jurnalele. */
const MAX_LEN = 1000;

/* Un prag simplu de viteză, ținut în memoria instanței. Nu e o apărare
   serioasă — pentru asta puneți un rate limiter adevărat sau un captcha —
   dar oprește apăsatul repetat pe buton. */
const seen = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(key) {
  const now = Date.now();
  const hits = (seen.get(key) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  seen.set(key, hits);
  if (seen.size > 500) seen.clear();
  return hits.length > MAX_PER_WINDOW;
}

async function callGraph(phoneId, token, payload) {
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Doar POST.' });

  const token   = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const to      = process.env.WHATSAPP_TO;

  if (!token || !phoneId || !to) {
    console.error('Releu neconfigurat: lipsesc WHATSAPP_TOKEN / _PHONE_ID / _TO.');
    return res.status(500).json({ error: 'Releul nu e configurat.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anonim';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Prea multe mesaje. Încercați peste un minut.' });
  }

  const payload = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const message = String(payload.message || '').trim().slice(0, MAX_LEN);
  const page    = String(payload.page || '').slice(0, 120);

  if (!message) return res.status(400).json({ error: 'Mesajul e gol.' });

  const full = `Mesaj nou de pe site${page ? ` (${page})` : ''}: ${message}`;

  // Întâi text liber — merge dacă fereastra de 24 de ore e deschisă.
  let attempt = await callGraph(phoneId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { preview_url: false, body: full }
  });

  // Refuzat pentru că suntem în afara ferestrei: trimitem șablonul aprobat.
  if (!attempt.ok) {
    const template = process.env.WHATSAPP_TEMPLATE || 'mesaj_site';
    const lang     = process.env.WHATSAPP_TEMPLATE_LANG || 'ro';

    attempt = await callGraph(phoneId, token, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        components: [{
          type: 'body',
          parameters: [{ type: 'text', text: full.slice(0, 900) }]
        }]
      }
    });
  }

  if (!attempt.ok) {
    // Jurnalizăm detaliul pentru noi, dar nu îl trimitem în pagină.
    console.error('WhatsApp a refuzat mesajul:', attempt.status, JSON.stringify(attempt.body));
    return res.status(502).json({ error: 'Mesajul nu a putut fi livrat.' });
  }

  return res.status(200).json({ ok: true });
}

function safeParse(text) {
  try { return JSON.parse(text); } catch (e) { return {}; }
}
