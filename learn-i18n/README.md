# Learn, country by country

Each folder here is one language site's own Learn section: `learn-i18n/<code>/` becomes
`https://<code>.beequation.com/learn/` (and its `pack.html` becomes that site's `/teachers.html`). These pages are
**written for that country's school system**, not translated word for word from the English ones. A Spanish parent
should find Spain's school years, Spain's curriculum and tests, the methods Spanish schools teach, euros, and words
a Spanish teacher would use.

Build: `python3 tools/build-langs.py --learn es` builds `dist/es/` with its Learn section, to preview (the
`website-es` preview server serves `dist/es`). A language goes live by adding its code to `LEARN_LIVE` in
`tools/build-learn.py`, once every page is written and checked; until then the site neither builds nor links it.
Worksheets: `node tools/make-worksheets.mjs <puppeteer-core dir> --lang es` (see below).

## Folder layout

```
learn-i18n/<code>/
  BRIEF.md            the country brief: school system, curriculum, tests, methods, notation, words (read it first)
  site.json           the template's words, the 12 topic names, the school years
  worksheets.mjs      the worksheets' words and formats, and which sheets this country uses
  worksheets.json     written by make-worksheets.mjs (don't edit)
  assets/worksheets/  written by make-worksheets.mjs: <id>.pdf and <id>.webp
  index.html                       Learn home (hub)
  topics/index.html  topics/<slug>.html          same 12 slugs as English (see site.json "topics")
  years/index.html   years/<local-slug>.html     this country's own school years
  parents/index.html parents/<slug>.html         same slugs as English
  teachers/index.html teachers/<slug>.html       same slugs as English
  worksheets/index.html                          the worksheets hub
  glossary/index.html                            maths words A to Z
  number-bonds-to-20.html  times-tables-practice.html  mental-maths-strategies.html  daily-maths-puzzle-for-adults.html
  pack.html                                      the free puzzle pack for teachers (becomes /teachers.html)
```

Paths (file names) stay in English, the same as the English site, except the school-year pages, which use this
country's own years (lowercase ASCII, hyphens: `1-primaria.html`, `cp.html`, `klasse-1.html`). Same paths let search
engines pair each page with its English version. A page can change its whole content (`parents/maths-tests-explained.html`
explains this country's tests), but keeps its path and its job.

## Page format

The same as `learn-src/` (documented at the top of `tools/build-learn.py`, style in `learn-src/STYLE.md`): front
matter, then HTML with the shortcodes `<tip>`, `<indie>`, `<challenge q="">`, `<qa q="">`, `<worksheets topic=""/>`
(or `year="<local year slug>"` or `ids="a,b"`), `<cards><card href title glyph colour>…</card></cards>`, `<try/>`.
Every front-matter value is in the language (`title`, `description`, `h1`, `nav`, `kicker`, `indie`), with `layout`
and `updated: 2026-10-10` as in English. Keep `title` under about 60 characters and `description` under about 155.

Links: only to pages that exist in this language's folder (`/learn/...`, `/teachers.html`), or to the site's own
pages (`/`, `/how-to-play.html`, `/support.html`, `/play.html`). Never to `https://beequation.com/...` or to an English
page. A few links to official sources (the education ministry, the official curriculum text) are fine where they
back up a fact; nothing else external.

## Writing for the country

- Follow BRIEF.md: its school years and ages, its curriculum (what is taught in which year), its tests, its methods
  and notation (decimal comma, thousands separator, × or ·, ÷ or :, how written methods are laid out), its money
  (euro coins and notes), 24-hour times, metric units, and its words for things (number bonds, times tables,
  column methods, place value…). Where the country does something differently from England, explain what it does;
  don't mention England, the UK, Key Stages, SATs, the Multiplication Tables Check or US grades.
- Examples use local names, places, shops, prices and situations. Keep every worked example and every challenge
  answer correct, and check the arithmetic twice. SVG pictures: text inside them in the language, decimal comma.
- Don't invent statistics, studies or quotes. If a curriculum fact isn't in the brief and you can't confirm it from
  an official source, leave it out rather than guess.
- Voice: warm, plain, direct, for a busy parent who isn't confident at maths; teachers should still find it right.
  Use the form of address the brief gives (e.g. tú / vous / du). No emoji. Proper symbols (−, ×, ÷ or the local
  ones, fraction characters).
- Indie is the same character as on the English site and in the apps: a cheerful honeybee shaped like a hexagon,
  she/her (ella, elle, sie), the mascot of Beequation Kids. Keep her `indie:` line, at least one `<tip>`, a
  `<challenge>` on topic and year pages, and one `<try/>`. App names stay "Beequation Kids" and "Beequation Pro".
- Natural, idiomatic text written by a native-speaking teacher, not a translation. Headings and structure can change
  where the country needs it; the page shapes in STYLE.md are a guide.

## site.json

```json
{
  "words": { ...every key of WORDS in tools/build-learn.py, in the language... },
  "topics": [ { "slug": "counting-and-place-value", "name": "...", "glyph": "123", "colour": "lemon" }, ... 12, same slugs and order as English ],
  "years":  [ { "slug": "1-primaria", "name": "1.º de Primaria", "age": "6 a 7", "short": "1" }, ... ]
}
```

`words.html_lang` is the page language (`es`, `fr`, `de`). `year_small` / `m_year_small` show a year's age
(`"{age} años"`). `m_years_hex` is the year-groups icon text (3 characters at most, e.g. `1–6`); each year's
`short` is its icon text (1 to 3 characters). `m_sheet_n` is `["{n} ficha", "{n} fichas"]`. `alphabet` lists the
glossary's letters in order (the glossary marks each letter's first entry with `id="<letter>"`, one character):
include the language's own letters (å ä ö, æ ø, ą ł ś, ç ğ ı ş…). Japanese uses the gojūon row heads
(あかさたなはまやらわ) and Korean the initial consonants (ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ), each entry filed under its row.

## worksheets.mjs

`export default { ... }` with any of the keys of `EN` in `tools/make-worksheets.mjs` (number and money formats, ×
and ÷ signs, clock phrases, coins, shop items, shape names, chart questions, the sheet's labels and footer), plus
`sheets: { '<id>': { title, desc, how, tip, years: [local year slugs] } }` for the sheets this country uses (leave
out ones that don't fit, like England's multiplication check). The questions themselves are generated, the same for
every language; only the words, formats and pictures change. Money is in the currency's smallest unit (cents,
öre, grosze, kuruş; yen and won have none): set `coinValues`, `coins` (real colours and diameters), `coinLabel`,
`money`, `paid` and `costStep` (prices go up in steps of this, e.g. 10 for yen or won).

## pack.json

The words of the teachers' puzzle pack (any keys of `W` in the apps repo's `tools/puzzle-pack/make-pack.mts`,
e.g. `learn-i18n/es/pack.json`): titles, instructions, labels, tips, promo and footer in the language, `mul` for
the multiplication sign used in that country's schools, `lang` for the page language.

## Bylines and dated publication

Optional front matter: `author`, `author_role`, `reviewer`, `reviewer_role`, `published` and
`reviewed`. Write names and roles as they should appear in this language; dates must be
`YYYY-MM-DD`. The byline appears directly below the H1. Article structured data uses a
Person author when supplied, the publication date, and `reviewed` (or `updated`) as its
modification date. Articles have a localised error-report link to this site's support page.

Queue new pages at `../growth/content/queue/<code>/YYYY-MM-DD__slug.html`, including the
required `path:` relative to this folder. Equivalent articles use the same path across
languages. `tools/publish_queue.py` validates due files before moving them here; see
`tools/DAILY.md` for the format, weekday warnings and dry-run commands.
