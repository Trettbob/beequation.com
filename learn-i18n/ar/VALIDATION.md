# Arabic Learn validation — 2026-10-17

## Delivered

- 41 HTML pages: the exact Spanish page-path set with seven Arabic year paths substituted.
- Years: `kg2`, `saff-1`, `saff-2`, `saff-3`, `saff-4`, `saff-5`, `saff-6`.
- `BRIEF.md` written first, followed by `PLAN.json`; complete `site.json` (58 WORDS keys, 12 ordered topics); `worksheets.mjs` (28 worksheet definitions); `pack.json` (20 W keys).
- 71 glossary entries, with every configured Arabic letter anchored; about 29,266 HTML body words.
- All authoring confined to `learn-i18n/ar/`. No commit, push or installation.

## Checks completed

- Exact page coverage, topic order, local years, front-matter language, title and description lengths, permitted links, required shortcodes and balanced source markup.
- Western digits, decimal-point notation and isolated LTR mathematical relationships.
- 260 numeric equality chains checked twice, with rational arithmetic and an independent high-precision decimal evaluation. All 21 challenge stories reviewed and recomputed; seven time calculations checked with datetime arithmetic. Narrative examples reviewed for quantities, units and interpretation. Parentheses added around slash fractions in a division example to remove ambiguity.
- All 41 pages parsed and rendered **in memory through the real `tools/build-learn.py` consumer**: shortcodes expanded, JSON-LD parsed, `lang="ar"` and `dir="rtl"` present. No generated site files written. This does not establish a complete site build, visual layout, PDF pagination or braille correctness.
- Final worksheet module imported successfully: all 28 definitions complete, valid year references, amounts in halalas, real coin denominations and dimensions, decimal and currency formatting, coin-label plurals, and 144 clock combinations.

## Requested commands and blockers

1. `node tools/make-worksheets.mjs --html-only --lang ar` failed before generation. The current CLI treats the first argument as a Puppeteer directory and calls `createRequire('--html-only/package.json')`, producing `ERR_INVALID_ARG_VALUE`.
2. Running HTML-only generation with the existing Puppeteer directory, without installing anything, reached the locale dependency and failed with `ENOENT` for `tools/braille/ar.json`.
3. `python3 tools/build-langs.py --learn ar` was invoked from the repository root under a temporary write guard limited to `learn-i18n/ar/`. The builder calls `update_english()` first and attempted to rewrite `learn/braille.html`. The guard stopped this out-of-scope write and was then removed.
4. The supported read-only check `python3 tools/build-langs.py --check --lang ar --learn ar` returned exit 1 with `ar: not built, no tools/braille/ar.json`.

No worksheet question JSON, manifest, PDF, image, braille or EPUB assets were generated. No Arabic puzzle-pack PDF was generated. Full site output and visual acceptance remain unverified. Worksheet, pack and braille pages state that downloadable files are not yet confirmed available; no nonexistent download links were invented.

Shared tools, CSS, i18n files, other languages and shared generated pages were not changed by this task. Those files had concurrent changes from other jobs and were left alone. The missing locale resources and builder behavior remain outside this task's authorized edit scope.
