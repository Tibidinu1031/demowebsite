# Arcobaleno

Site de prezentare pentru un after school. HTML, CSS și JavaScript
simplu — fără pas de build, fără dependențe, fără framework. Deschideți
`index.html` în browser și funcționează.

```bash
python -m http.server 4321
```

Apoi vizitați <http://localhost:4321>. (Merge și deschis cu `file://`, dar un
server e mai bun — filmele, `fetch`, tranzițiile între documente și canonicalele
relative se comportă corect peste HTTP.)

---

## Structură

```
index.html              Prima pagină (erou video, galerie, întrebări frecvente)
rooms.html              Cele patru programe, echipa și tabelul complet de tarife
approach.html           Filosofia pe larg, inclusiv ce nu ne iese
gallery.html            Galeria video
blog.html               Blogul cu autentificare și publicare
faq.html                Întrebări frecvente, pe patru categorii
visit.html              Formular de contact, chestiuni practice
404.html                Pagina de eroare

assets/css/base.css        Ordinea straturilor, reset, tokenuri, elemente
assets/css/layout.css      Grila, secțiunile, antetul, subsolul, panourile
assets/css/components.css  Tot ce se refolosește; plus stratul de utilitare
assets/css/pages.css       Compoziția la nivel de pagină, stiluri de tipar
assets/js/site.js          Module mici, fiecare inactiv dacă marcajul lipsește
assets/js/blog.js          Partea din browser a blogului: cere totul de la API
assets/img/*.svg           Ilustrații desenate de mână
assets/video/*.mp4         Filmul din erou și cele patru filme din galerie
functions/_lib/            Cod folosit de funcții, nepublicat (underscore)
functions/api/blog/        Autentificarea și postările, pe Cloudflare
api/whatsapp.js            Releul WhatsApp — scris pentru Vercel, vezi mai jos
tools/hash-password.mjs    Generatorul amprentei de parolă
```

`favicon.svg`, `robots.txt`, `sitemap.xml` și `schema.sql` stau în rădăcină.

## Ce e nou față de versiunea precedentă

- **Tot site-ul e în română** și marca a devenit Arcobaleno. Orele sunt în format
  de 24 de ore, tarifele în lei, telefonul e `+40 721 996 570`, iar domeniul din
  canonicale, sitemap și JSON-LD e `arcobaleno.ro`.
- **Erou video.** Prima fereastră e ocupată de `assets/video/hero.mp4`, cu un voal
  în cerneala casei peste el și titlul „Bine ați venit la Arcobaleno Afterschool”.
  Secțiunea ocupă exact `100svh - antet - bandă`, deci se vede întreagă fără scroll.
- **Bandă de anunț** verde deasupra antetului, cu X. Odată închisă rămâne închisă
  (`localStorage`, cheia `arc-banner`). Înălțimea ei e măsurată de `site.js` și
  pusă în `--banner-h`, pentru că eroul se dimensionează în funcție de ea.
- **Galerie** cu patru filmări, toate pe un rând centrat, previzualizare la hover
  și lightbox la clic.
- **Blog** cu autentificare și formular de publicare.
- **Întrebări frecvente** ca pagină de sine stătătoare, cu date structurate
  `FAQPage`, plus o secțiune scurtă pe prima pagină.
- **WhatsApp**: buton plutitor pe fiecare pagină. Cu releul pornit, mesajul ajunge
  direct pe telefonul școlii; fără el, se deschide `wa.me` cu textul deja scris.
- **Rețele sociale**: Instagram și Facebook, în erou și în subsol.
- **Patru programe** în loc de trei grupe pe vârste: after school în anul școlar,
  școală de vară, ateliere interactive și excursii.

## Note de design

**Tipografie.** Fraunces pentru titluri, condusă prin axele ei variabile `SOFT`,
`WONK` și `opsz`, nu doar prin `wght` — acolo stă caracterul ei. Instrument Sans
pentru text. Ambele de la Google Fonts, cu un teanc de rezerve din sistem.

**Culoare.** Luată de pe hârtie, nu de pe ecran: crem cald, cerneală de pin,
teracotă nesmălțuită, ocru, salvie. Tokenurile semantice (`--rule`, `--surface`)
derivă din paletă cu `color-mix()`, deci o schimbare de paletă se propagă.

**Așezare.** O singură grilă cu nume (`.shell`) rezolvă orice lățime din site —
text, lat și pe toată pagina — prin linii de grilă denumite. Secțiunile se
înscriu cu `.u-wide` / `.u-full`, fără containere imbricate.

**Straturi în cascadă.** Declarate o dată, sus în `base.css`, ca
`reset, tokens, base, layout, components, pages, utilities`. Utilitarele câștigă
fără `!important`, datorită locului stratului, nu specificității.

**Textură.** O suprapunere fixă și repetată de `feTurbulence`, la opacitate mică,
mai palidă pe ecranele dense. E singurul motiv pentru care culorile plate se
citesc ca hârtie.

**Mișcare.** Tranziții între documente unde sunt acceptate; dezvăluiri la derulare
prin `IntersectionObserver`, cu o plasă de siguranță de 4 secunde ca textul să nu
rămână invizibil; totul se oprește sub `prefers-reduced-motion`.

## Eroul video

`assets/video/hero.mp4` rulează mut, în buclă, cu `playsinline`, și pornește doar
dacă utilizatorul nu a cerut mai puțină mișcare și dacă browserul nu raportează o
conexiune lentă sau modul de economisire a datelor. Există un buton de pauză în
colț. Filmul apare printr-o estompare după primul cadru, ca să nu se vadă un
dreptunghi negru cât se încarcă.

Antetul stă peste film cât timp pagina nu e derulată, așa că pe prima pagină
(`<body class="has-hero-video">`) sigla și butoanele din antet trec pe culoarea
hârtiei. De la primul scroll antetul își recapătă fundalul crem și cerneala.

**Fișierul are 11 MB**, recomprimat din 21 MB (H.264, CRF 30, `+faststart`).
Rămâne cea mai grea bucată de la prima încărcare; dacă vreți și mai puțin,
urmează o variantă `.webm` și un cadru-poster `.jpg` pus în `poster=""`.

## Galeria

Patru filmări pe un singur rând centrat de la 58em în sus, două pe rând între 34
și 58em, una sub alta pe telefon. Cardurile
pornesc o previzualizare mută la trecerea cursorului (doar pointer fin, fără
mișcare redusă) și deschid filmul mare, cu sunet, la clic. Lightboxul se
închide din `Esc`, din X sau din clic pe fundal, și oprește filmul când se închide.

Filmele nu au deocamdată cadru-poster, pentru că se generează cu `ffmpeg`, care nu
era disponibil aici:

```bash
for i in 1 2 3 4; do
  ffmpeg -i assets/video/galerie-$i.mp4 -ss 00:00:01 -frames:v 1 assets/video/galerie-$i.jpg
done
```

Apoi puneți `poster="assets/video/galerie-1.jpg"` pe fiecare `<video>` din
`gallery.html` și pe `index.html`.

## Blogul

Pagina se citește de oricine. Publică o singură persoană — administratorul —
care intră cu o parolă din coloana stângă. Nu există înscriere și nici formular
de „parolă uitată”: contul se face o dată, punând două valori în Cloudflare, iar
o parolă uitată se înlocuiește tot de acolo. Postările se salvează într-o bază
de date, deci se văd de pe orice calculator.

```
functions/_lib/blog-auth.js       Parola, sesiunea, cookie-ul
functions/api/blog/login.js       POST — verifică parola, deschide sesiunea
functions/api/blog/logout.js      POST — închide sesiunea
functions/api/blog/session.js     GET  — mai sunt autentificat?
functions/api/blog/posts/         GET public, POST și DELETE doar autentificat
schema.sql                        Tabelele D1
tools/hash-password.mjs           Generatorul amprentei de parolă
```

### Cum se face contul

1. **Alegeți parola** și generați valorile de pus în Cloudflare. Parola rămâne pe
   calculatorul dumneavoastră; în Cloudflare ajunge doar amprenta ei:

   ```bash
   node tools/hash-password.mjs "parola-aleasă"
   ```

2. **Creați baza de date** și tabelele:

   ```bash
   npx wrangler d1 create arcobaleno-blog
   npx wrangler d1 execute arcobaleno-blog --remote --file=schema.sql
   ```

3. **Legați baza de site**, din panou: proiectul Pages → Settings → Functions →
   **D1 database bindings** → Add binding, cu numele variabilei `DB` și baza
   `arcobaleno-blog`.

4. **Puneți variabilele**, în Cloudflare Pages → Settings → Variables and Secrets.
   Primele două sunt de tip **Secret**, ultimele două pot fi text obișnuit:

   ```
   ADMIN_PASSWORD_HASH  amprenta scoasă de comanda de la pasul 1
   SESSION_SECRET       cheia scoasă de aceeași comandă
   ADMIN_NAME           Nicoleta
   ADMIN_ROLE           Director
   ```

Gata — nu mai e nimic de creat. La următoarea publicare, parola de la pasul 1
deschide formularul de scriere.

### Dacă se uită parola

Rulați din nou comanda de la pasul 1, cu parola nouă, și înlocuiți
`ADMIN_PASSWORD_HASH` în Cloudflare. Dacă schimbați și `SESSION_SECRET`, se
închid pe loc toate sesiunile rămase deschise pe alte calculatoare.

### Ce ține parola în siguranță

Parola nu e scrisă nicăieri în site și nu pleacă niciodată către browser. În
Cloudflare stă doar amprenta ei, PBKDF2-SHA256 cu sare, deci nici cine vede
variabilele nu poate citi parola. Sesiunea e un cookie `HttpOnly`, `Secure`,
`SameSite=Strict`, semnat cu `SESSION_SECRET` și valabil opt ore — JavaScriptul
din pagină nu îl poate citi, deci nu poate fi furat de un script străin. La opt
încercări greșite de pe aceeași adresă, intrarea se blochează un sfert de oră.

### Cum se probează local

`python -m http.server` servește doar fișierele, nu și funcțiile, deci blogul va
părea căzut. Pentru funcții, o dată:

```bash
cp wrangler.toml.example wrangler.toml
cp .dev.vars.example .dev.vars
npx wrangler d1 execute arcobaleno-blog --local --file=schema.sql
```

Completați `.dev.vars` cu valorile scoase de `tools/hash-password.mjs`, apoi:

```bash
npx wrangler pages dev
```

> `wrangler.toml` e trecut **dinadins** în `.gitignore`. Dacă ajunge în depozit,
> integrarea cu Git a Cloudflare citește proiectul ca **Worker**, nu ca **Pages**,
> și build-ul cade cu „Missing entry-point to Worker script”. În producție nu e
> nevoie de el: baza de date și variabilele se leagă din panou.

`.dev.vars` și dosarul `.wrangler/` sunt trecute în `.gitignore`, deci nu ajung
niciodată pe GitHub.

## WhatsApp

Butonul plutitor din colțul din dreapta jos deschide o fereastră mică de
compunere: patru întrebări gata scrise și un câmp liber.

Chatul are **două comportamente**, iar comutatorul e o singură linie: câmpul
`relay` din obiectul `CONTACT`, în `assets/js/site.js`.

| `relay` | Ce se întâmplă la trimitere |
|---|---|
| gol (acum) | Se deschide `wa.me` într-o filă nouă, cu mesajul deja scris. Vizitatorul apasă „trimite”. |
| adresa releului | Mesajul pleacă prin POST și **ajunge direct pe telefonul școlii**. Vizitatorul rămâne pe site și vede confirmarea în fereastră. |

Dacă releul e configurat dar nu răspunde, mesajul nu se pierde: se revine automat
la varianta cu `wa.me`.

### De ce e nevoie de un server

Un site static **nu poate trimite** mesaje WhatsApp singur. Trimiterea cere o
cheie de acces de la Meta, iar o cheie pusă într-un fișier JS public poate fi
citită de oricine și folosită pentru a trimite mesaje în numele școlii. De aceea
pasul acesta se face pe server.

Releul e scris deja: `api/whatsapp.js`. E o funcție serverless, gândită pentru
Vercel; merge la fel pe Netlify (mutată în `netlify/functions/`) și, cu mici
ajustări la `req`/`res`, pe Cloudflare Workers.

### Ce aveți de făcut

1. **Cont WhatsApp Business Platform.** În [Meta for Developers](https://developers.facebook.com/)
   creați o aplicație, adăugați produsul WhatsApp și legați un **număr expeditor**.
   Acesta trebuie să fie diferit de numărul pe care vreți să primiți mesajele.
2. **Șablon aprobat.** Meta nu lasă o firmă să înceapă o conversație cu text
   liber. Creați un șablon cu o singură variabilă în corp și așteptați aprobarea:

   ```
   Nume:  mesaj_site
   Limbă: ro
   Corp:  Mesaj nou de pe site: {{1}}
   ```

3. **Publicați funcția** și puneți variabilele de mediu:

   ```
   WHATSAPP_TOKEN     cheia permanentă din Meta
   WHATSAPP_PHONE_ID  ID-ul numărului expeditor
   WHATSAPP_TO        40721996570
   WHATSAPP_TEMPLATE  mesaj_site
   ALLOWED_ORIGIN     https://arcobaleno.ro
   ```

4. **Porniți releul** din site:

   ```js
   relay: 'https://arcobaleno.ro/api/whatsapp'
   ```

Codul încearcă întâi mesaj cu text liber — care merge cât timp sunteți în
fereastra de 24 de ore de după ultimul dumneavoastră răspuns — și cade pe șablon
în rest, deci funcționează în ambele situații.

**Alternativa mai simplă**, dacă nu vreți să treceți prin aprobarea Meta: același
releu, dar care trimite pe e-mail sau prin SMS (Twilio). Se schimbă doar funcția
`callGraph` din `api/whatsapp.js`; restul, inclusiv partea din site, rămâne.

### Numărul

Numărul stă într-un singur loc, în obiectul `CONTACT` din `assets/js/site.js`.
Schimbați-l acolo și, pentru linkurile scrise direct în pagini, căutați
`40721996570` și `+40721996570` în fișierele HTML.

Numărul folosit acum este cel dat pentru teste.

Orice link sau buton din pagini cu atributul `data-wa-open` deschide fereastra de
chat în loc să navigheze, deci puteți pune „Scrie-ne pe WhatsApp” oriunde.

## Rețele sociale

Instagram și Facebook apar în două locuri: sub butoanele din erou și în ultima
coloană a subsolului, pe fiecare pagină. Butoanele își iau culoarea din
`currentColor`, deci aceleași stiluri merg și peste filmul din erou, și pe
cerneala subsolului.

Adresele sunt scrise direct în HTML. Ca să le schimbați, căutați
`instagram.com/after_school_arcobaleno` și
`facebook.com/afterschoolarcobalenotargoviste`. Pictogramele sunt în spritul din
capul fiecărei pagini, `#i-instagram` și `#i-facebook`.

## Fotografiile echipei

Portretele sunt ilustrații SVG. Peste ele se poate pune o fotografie reală,
adăugând un `<img class="person__photo">` în `.person__portrait` — vezi Nicoleta
în `index.html`. Dacă fișierul lipsește, `site.js` scoate `<img>` și rămâne
ilustrația, deci pagina nu arată niciodată o imagine ruptă.

Fotografia Nicoletei e deja pusă, în `assets/img/nicoleta.jpg`. Încadrarea se
reglează din `object-position: center 22%` în `components.css`.

## Sigla

Sigla reală se pune peste marca desenată, în același fel ca portretele: un
`<img class="mark__logo">` în `.mark__badge`, în antetul și în subsolul fiecărei
pagini. Dacă fișierul lipsește, `site.js` scoate `<img>` și rămâne marca
desenată, deci pagina nu arată niciodată o imagine ruptă.

> **De pus:** salvați sigla ca `assets/img/logo.png` și apare singură, în toate
> cele douăsprezece pagini. E afișată într-un pătrat de 2,4rem, cu
> `object-fit: cover` și colțuri rotunjite — o siglă pătrată e ideală.
>
> Ca s-o folosiți și ca favicon, adăugați în `<head>`, după linia cu
> `favicon.svg`: `<link rel="icon" href="assets/img/logo.png" sizes="any">`.

## Adresa

Adresa vine de pe siglă: **Str. Preot Toma Georgescu nr. 12, Târgoviște**. A
înlocuit adresa inventată din varianta în engleză, în toate paginile, în JSON-LD
și în subsolul meniului.

Numele școlilor de la care se iau copiii (Marlow, Beckett Road, Sfântul Aldate)
au rămas cele inventate — înlocuiți-le cu școlile reale din zonă.

## Meniul

Un singur panou arată toate destinațiile — Programe, Abordare, Galerie, Blog,
Jurnal, Întrebări frecvente, Tarife & program, Sună-ne, Programează o vizită —
ca niște carduri cu o descriere fiecare. Cele două care *fac* ceva, nu duc
undeva (sună, programează), sunt stilizate diferit.

E construit de `site.js`, nu repetat în unsprezece fișiere HTML, deci lista de
destinații stă într-un singur loc (`DESTINATIONS`).

| Cum se deschide | |
|---|---|
| `Cmd/Ctrl + K` | oriunde |
| Butonul **Meniu** | de la 62em în sus |
| Burgerul | sub 62em |

`Esc` închide și readuce focusul pe butonul care l-a deschis. `Tab` e prins în
dialog și se întoarce la început. Săgețile se plimbă prin carduri. Subsolul
panoului preia linia „chiar acum” de pe prima pagină, când există.

Fără JavaScript nu există panou, deci navigația din antet stă într-un bloc
`<noscript>`, iar burgerul e ascuns — site-ul rămâne navigabil.

## Widgetul „chiar acum”

Prima pagină arată ce se întâmplă la școală în acest moment. Își citește programul
din atributele `data-from` / `data-to` de pe orarul tipărit, deci widgetul și
orarul nu se pot îndepărta unul de celălalt. Tratează și înainte de deschidere,
după închidere și weekendul, și evidențiază rândul curent.

## Accesibilitate

Link de sărit peste navigație, un singur `h1` pe pagină, repere etichetate, inele
de focus vizibile, `inert` pe dialogurile închise cu focusul readus pe declanșator,
`aria-current` pe elementul de navigație activ, text alternativ la fiecare
imagine și o bandă decorativă ascunsă de tehnologiile asistive. Filmul din erou
este `aria-hidden` și are buton de oprire.

## Înainte de lansare

- **Adăugați poster și `.webm`** pentru `hero.mp4`. Recomprimarea e făcută.
- **Niciun fișier peste 25 MiB.** Cloudflare refuză build-ul cu „Asset too large”
  dacă un fișier depășește pragul. Filmele sunt acum toate sub el; dacă adăugați
  altele, treceți-le întâi prin:

  ```bash
  ffmpeg -i intrare.mp4 -c:v libx264 -crf 30 -preset slow \
         -c:a aac -b:a 96k -movflags +faststart iesire.mp4
  ```
- **Blogul are nevoie de baza de date legată** și de cele patru variabile puse în
  Cloudflare, altfel autentificarea răspunde cu eroare. Vezi „Blogul”, mai sus.
- **Releul WhatsApp e scris pentru Vercel** și nu pornește pe Cloudflare Pages,
  care își caută funcțiile în `functions/`, nu în `api/`. Până e mutat, chatul
  cade automat pe varianta cu `wa.me`, care merge — dar `CONTACT.relay` din
  `assets/js/site.js` trebuie lăsat gol.
- **Formularul e doar front-end.** `visit.html` interceptează trimiterea și arată
  o confirmare în pagină. Puneți în `action` adresa unui procesator real
  (Formspree, Netlify Forms, o funcție serverless) și ștergeți ramura cu
  `preventDefault` din `site.js` dacă vreți un POST obișnuit. Capcana pentru roboți
  e deja legată.
- **Serviți `404.html` cu un status 404 real** — se face automat pe Netlify,
  Vercel și GitHub Pages; pe nginx folosiți `error_page 404 /404.html;`.
- **Înlocuiți `https://arcobaleno.ro/`** în canonicale, `sitemap.xml`, `robots.txt`
  și JSON-LD dacă domeniul e altul.
- **Adăugați un `og:image` raster.** Momentan arată spre un SVG, pe care cele mai
  multe rețele sociale nu îl randează. Vă trebuie un PNG de 1200×630.
- **Găzduiți fonturile local** dacă preferați să nu depindeți de Google Fonts.

## O notă despre conținut

Adresa, echipa, tarifele, recenziile și articolele din jurnal sunt text de
umplutură, păstrat din versiunea în engleză a acestui site și tradus. Numărul de
telefon este cel dat pentru teste. Înlocuiți fiecare cuvânt înainte de a folosi
site-ul pentru o școală reală și verificați ca afirmațiile despre raporturi,
autorizații și protecția copilului să corespundă cu ce poate susține școala.

Pentru filmările din galerie: verificați acordurile de imagine ale familiilor
înainte de publicare. Textul din pagină spune deja că filmăm doar copiii ale căror
familii au semnat și că acordul poate fi retras oricând — asigurați-vă că e
adevărat.
