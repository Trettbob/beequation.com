# Thai Learn content checks

Checked 2026-10-17. All authored changes are under `learn-i18n/th/`.
No install, commit, push, shared-tool change, or other-language edit.

## Delivered

- 41 authored HTML pages, matching every Spanish page path except the seven local year slugs.
- Years: `anuban-3`, `prathom-1`, `prathom-2`, `prathom-3`, `prathom-4`, `prathom-5`, `prathom-6`.
- BRIEF.md was written first, then PLAN.json and configuration, then the articles.
- 12 topics in the existing order; all 58 current WORDS keys; all 20 current pack W keys.
- 28 worksheet definitions with Thai instructions, descriptions, tips and local year mappings.
- Money values in satang; six everyday denominations; decimal point, thousands comma, Western digits.
- Five parent guides, four teacher guides (including 25 starters and 8 games), four standalone guides, 61 glossary entries, pack and accessibility pages.

## Successful checks

- Exact page-path parity with `learn-i18n/es/`, adjusted only for local year pages; PLAN matches the actual page set.
- 311 authored links checked: local targets exist, or are the allowed own-site pages or official sources.
- All required front-matter fields present and localised; titles at most 60 characters, descriptions at most 155.
- No Thai digits, imported country-specific assessment terms, external scripts or embedded external resources.
- Tip and try shortcodes on every page; challenges on every topic and year article.
- Balanced HTML elements, unique IDs, complete glossary letter anchors.
- All 28 sheet definitions and year references checked; all pack W keys matched to the current app generator.
- Worksheet number, decimal, money, rounding and clock callbacks exercised directly. Rounding wording corrected to จำนวนเต็มสิบ/ร้อย/พัน.
- Worked examples and challenge answers reviewed during writing and rechecked. Final exact-rational scan: 233 equation/percentage checks; three deliberately wrong examples retained only in explicitly corrective teaching contexts.
- All pairs in six honeycomb sets checked exhaustively; 26 inverse/unit/fraction checks used for narrative challenge answers.
- Two contextual percentage statements changed to explicitly name 200 as the base amount.
- The actual `tools/build-learn.py` parser, shortcodes and page renderer rendered all 41 pages in memory, with Thai language, Thai canonical URLs and valid JSON-LD. Existing base-page CSS was read; no rendered files were written. The revised mental-maths article was rendered again after its final wording correction.

## Requested commands and limits

1. From the repository root, `node tools/make-worksheets.mjs --html-only --lang th` failed before writing files. The current argument parser treats `--html-only` as its positional Puppeteer directory and calls `createRequire('--html-only/package.json')`, causing `ERR_INVALID_ARG_VALUE`.
2. The existing, already-installed Puppeteer path was then supplied without installing anything:
   `node tools/make-worksheets.mjs '/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core' --html-only --lang th`
   This reached the language-resource load and failed with `ENOENT` for `tools/braille/th.json`, also before generated files were written.
3. `python3 tools/build-langs.py --learn th` is not a Thai-only writer: its entry point first calls `update_english()` and the build can write other languages. To preserve the explicit file boundary, an OS write restriction was attempted; nested `sandbox-exec` was unavailable (`sandbox_apply: Operation not permitted`). The same entry point and arguments were then executed through `runpy` with bytecode disabled and a Python audit hook rejecting all filesystem mutations outside `learn-i18n/th/`. It stopped before opening root `certificate.html` for writing. No unguarded full build was run.

## Still outstanding outside this content task

- Repair/registration of the shared worksheet CLI and Thai braille/format resources by the jobs responsible for `tools/`.
- Generate `worksheets.json` and the 28 generated worksheet question JSON files after that dependency is ready; do not hand-author those generated files.
- A full Thai site build with permission to write its generated output and after the shared builder prerequisites are ready.
- PDF, preview, tactile, braille and EPUB generation and visual/accessibility acceptance were not performed. The pack and braille pages explicitly avoid promising downloads that do not exist.
- In-memory template rendering verifies source compatibility, not the complete translated site shell, final typography, PDF pagination or real assistive-device use.
