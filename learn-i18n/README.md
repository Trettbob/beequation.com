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

India has two sites: `learn-i18n/in/` (Indian English, `in.beequation.com`, `en-IN`) and `learn-i18n/hi/` (Hindi,
`hi.beequation.com`, `hi` / `hi-IN`), both with Classes 1 to 5 (`class-1` … `class-5`). Both are live in
`LIVE` and `LEARN_LIVE`, with working repos, DNS and HTTPS. Indian English text outside Learn is
`i18n/in.json`, kept complete with `python3 tools/i18n-identity.py in`.

Indonesian (`id`), Vietnamese (`vi`), Thai (`th`), Ukrainian (`uk`) and Arabic (`ar`)
are live in both `LIVE` and `LEARN_LIVE`, including their Learn sections and downloadable assets.

## Folder layout

```
learn-i18n/<code>/
  BRIEF.md            the country brief: school system, curriculum, tests, methods, notation, words (read it first)
  site.json           the template's words, the 12 topic names, the school years
  worksheets.mjs      the worksheets' words and formats, and which sheets this country uses
  worksheets.json     written by make-worksheets.mjs (don't edit)
  assets/worksheets/  written by make-worksheets.mjs: <id>.pdf, <id>-large.pdf, <id>-easy-read.pdf and <id>.webp
  index.html                       Learn home (hub)
  topics/index.html  topics/<slug>.html          same 12 slugs as English (see site.json "topics")
  years/index.html   years/<local-slug>.html     this country's own school years
  parents/index.html parents/<slug>.html         same slugs as English
  teachers/index.html teachers/<slug>.html       same slugs as English
  worksheets/index.html                          the worksheets hub
  worksheets/<id>.json                           generated questions and answers (also with --html-only)
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

`words.html_lang` is the page language (`es`, `fr`, `de`). `words.hreflang` (optional) is the hreflang search engines get when it
should carry a region the page language doesn't (Hindi: `html_lang` `hi`, `hreflang` `hi-IN`). `year_small` / `m_year_small` show a year's age
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

## Accessible worksheets

The worksheet generator writes each sheet’s instructions, tip, seeded question HTML, answers and
shared chart data to `worksheets/<id>.json` beside the manifest. This happens with `--html-only` too;
Chrome is not needed for that run or for the Python builders. `build-learn.py` uses the JSON to build
`/learn/worksheets/<id>.html`, with the normal Learn navigation, breadcrumbs, an answers disclosure,
PDF downloads, structured data and the same language alternates as the other Learn pages. English
uses `learn-src/worksheets/<id>.json` and outputs to `learn/worksheets/`. Existing country-specific
sheet selections and school years are preserved.

A normal generator run creates three tagged A4 PDFs from the same questions: standard, large print
(at least 18pt body text, smaller groups of questions and separate answer pages), and easy-read
(cream background, dark text and increased spacing). Only the standard version gets a WebP preview.
Meaningful SVGs have localised text alternatives; decorative pictures are hidden from screen readers.
Add new alternative-text words to the language’s `worksheets.mjs`, and download/page UI words to
`site.json`. Bar charts also include a real data table; column operations have a linear text version.

On a machine where Chrome can run, generate the PDFs and then rebuild the pages so file sizes
and PDF sitemap entries reflect the new files:

```sh
(
  set -e
  export PATH="/Volumes/External SSD/Projects/devtools/node/bin:$PATH"
  for code in en fr es de pt it nl pl sv da no fi tr ja ko in hi; do
    node tools/make-worksheets.mjs "/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core" --lang "$code"
  done
  python3 tools/build-learn.py
  python3 tools/build-langs.py
  python3 tools/build-langs.py --check
)
```

For a Chrome-free check, add `--html-only` to the generator command. Optional `HTML_DIR` writes
all three HTML print renders to an existing directory for inspection. Downloads whose PDF has not
yet been generated retain the correct local URL and show a translated size-pending message.
After PDF generation, inspect the print layout and the tagged PDF’s Figure/Alt entries in a PDF
accessibility checker; HTML-only checks cannot establish Chrome’s final pagination or PDF tags.

## Braille, tactile pictures, EPUB and the open licence

Worksheets and the teachers’ puzzle pack are **CC BY 4.0**, with credit to
Beequation (beequation.com): https://creativecommons.org/licenses/by/4.0/.
The apps, browser game, Beequation name, logos and Indie are excluded (see terms.html).
`tools/braille/<code>.json` holds the new translated format labels, notices and licence text.
The 14 `pack.json` files change **footer only**; `promo` is unchanged. Mirror the English
pack default in the apps repo’s `tools/puzzle-pack/make-pack.mts` as:

```js
footer: 'Free to share and adapt under CC BY 4.0, with credit to Beequation (beequation.com).<br>https://creativecommons.org/licenses/by/4.0/',
```

`make-worksheets.mjs` now also runs the two Python text generators after writing JSON.
Both can run separately, without Chrome, node packages or network requests:

```sh
export LOUIS_TABLEPATH="/Volumes/External SSD/Projects/devtools/liblouis/share/liblouis/tables"
python3 tools/braille/make-braille.py
python3 tools/braille/make-epub.py
# Optional, per-language braille frame size:
python3 tools/braille/make-braille.py --lang en --cells 40 --lines 25
```

Set `LIBLOUIS_BIN` to override the directory containing `lou_translate` and
`lou_checktable`; the default is the installed devtools liblouis directory.
Default braille pages are 30 cells by 27 lines. BRF uses North American braille
ASCII (`en-us-brf.dis`); text uses `unicode.dis`, with identical hard line breaks
and form feeds. Answers always start on a new page. Fraction slashes are retained;
column operations and the multiplication matrix are written as linear questions.
Every first page carries the translated computer-made/not-proofread notice.
Japanese is deliberately skipped: there is no standard children’s kana table in
this liblouis installation. Japanese still gets tactile PDFs and EPUB; tactile
numeral labels use UEB digits. Portuguese uses the Portugal table, with an explicit
notice on the site and in each braille sheet.

All requested tables load with `lou_checktable` in liblouis 3.39.0. English grade 1
already includes `en-ueb-math.ctb`; the digits/operators/fraction probe succeeds.
Danish `da-dk-g16.ctb` declares uncontracted six-dot grade 1 (2022 standard).
Translation adaptations discovered by the real CLI probes:

- Spanish, Korean and Italian: Unicode minus becomes the table’s ASCII hyphen.
- Italian: multiplication becomes the table’s asterisk; centred dots do too.
- Dutch: the table uses virtual dots 9–f. Temporary display wrappers extend
  `unicode.dis` and `en-us-brf.dis` with the exact physical-cell mappings shipped
  in `nl-unicode.dis`. No physical dot is discarded.
- Curly quotes/dashes become ordinary punctuation; ordinal suffixes º/ª become
  o/a. Square centimetres and approximate equality use localised words where a
  table does not support the symbol. An undefined character or non-six-dot output
  stops generation instead of silently creating a broken BRF.

These probes establish that the translation tables and display encodings work,
not that the braille is proofread or suitable for a particular child. Have a
braille reader and the child’s vision teacher check it before use.

A normal Chrome-enabled run also writes `<id>-tactile.pdf` for picture worksheets
and the multiplication grid. `--html-only` writes the exact tactile print HTML to
`HTML_DIR` alongside the other renders and refreshes all braille/EPUB files.
The tactile master uses A4, one diagram or coin group per page, black and white,
lines at least 1 mm, hatching for shaded fractions, separated labels and large
print question numbers with liblouis braille cells drawn as vector dots. Clocks
have 12 ticks, stronger cardinal ticks, a shorter thicker hour hand and an arrow
on the minute hand. The multiplication matrix is split into 4×4 sections; bar
charts have numbered bars and a key. Rectangles are enlarged for touch: each grid
square represents 1 cm in the exercise, rather than measuring 1 cm on the paper.
These follow BANA simplification and separation principles; they need physical
proofing on the chosen swell paper/embosser and teacher adaptation before use.

Download sizes come from the generated files. Tactile links appear only on sheets
with a tactile master; until the Chrome run they show the translated size-pending
notice. Rebuild both Python site builders after generating PDFs to refresh sizes.
The `/learn/braille.html` pages offer the language’s complete EPUB 3 collection for
libraries and transcription services. EPUB ZIP ordering, XML, local references,
manifest/spine, language and accessibility metadata are covered by
`tools/tests/test_braille.py`; EPUBCheck is not installed.
