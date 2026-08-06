-- Arcobaleno — baza de date a blogului (Cloudflare D1)
--
--   npx wrangler d1 create arcobaleno-blog
--   npx wrangler d1 execute arcobaleno-blog --remote --file=schema.sql
--
-- Pentru baza locală, folosită de `wrangler pages dev`, treceți `--local`
-- în locul lui `--remote`.

CREATE TABLE IF NOT EXISTS posts (
  id     TEXT PRIMARY KEY,
  title  TEXT NOT NULL,
  tag    TEXT,
  body   TEXT NOT NULL,
  author TEXT NOT NULL,
  role   TEXT,
  date   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS posts_by_date ON posts (date DESC);

-- Încercările de intrare în cont, ca o parolă să nu poată fi ghicită prin
-- încercări repetate. Rândurile vechi se rescriu singure la următoarea
-- încercare de pe aceeași adresă.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip      TEXT PRIMARY KEY,
  tries   INTEGER NOT NULL,
  started INTEGER NOT NULL
);
