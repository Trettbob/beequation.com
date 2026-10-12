# Beequation accessibility tooling

Run from the website worktree root. No commits, pushes, publishing commands or package installations were performed. Existing PDFs and built sites were not regenerated.

## Commands

Use the existing external-drive Node:

```sh
export PATH="/Volumes/External SSD/Projects/devtools/node/bin:$PATH"
```

### Page audit (run on the host, outside the Codex sandbox)

```sh
node tools/a11y/audit-pages.mjs
node tools/a11y/audit-pages.mjs --lang en,fr --only 'learn/**/*.html' --limit 5
node tools/a11y/audit-pages.mjs --lang en --only 'play.html'
```

It discovers English at the repo root and the 14 language sites at `dist/<code>`, including sitemap indexes, directory indexes, `404.html` and `play.html`. All referenced pages must exist. Each site has a separate local HTTP origin bound to `127.0.0.1` on an ephemeral port, preserving root-relative links and assets. External requests are blocked. Four workers each own an isolated browser context; language, viewport, cookie consent and game progress do not leak between runs.

Each page uses 1280×800 and 320×640 in light and dark schemes. Axe runs the six requested tag sets. Play is clicked through choose, kids home, kids addition level 1, kids result, pro home and pro addition level 1 using its data attributes; solving the kids round uses the board's actual controls, without injected app state. Result precedes pro home in the traversal. In-memory game progress is discarded with the context.

`--lang` accepts a code or comma-separated codes; default is all 15. `--limit` limits pages **per site**, after filtering. `--only` matches the site-relative URL path; quote globs. `*` matches one path segment, `**` matches recursively, and `?` matches one character. Directory pages use URL paths such as `learn/`, not `learn/index.html`.

Outputs:

- `reports/a11y/pages.json`: rules → page routes → nodes, deduplicated by selector/check IDs across languages, states and viewports; every occurrence and language-specific HTML/failure detail is retained. Axe incomplete results, run errors and coverage are separate.
- `reports/a11y/pages.md`: impact-sorted human findings and coverage summary.

Reflow uses 320 CSS pixels, equivalent to a 1280px viewport at 400% for layout; it does not test browser magnification or OS scaling. Text-spacing checks inject line-height 1.5, paragraph bottom margin 2em, letter spacing 0.12em and word spacing 0.16em, then remove the override. Hidden/clip overflow is checked in both dimensions; text-range overlap is a review heuristic.

Keyboard checks actually press Tab through visible native/custom controls, including SVG buttons. Native radio groups count as one Tab stop. Outline and box-shadow changes, plus ancestor focus filters, are inspected. Missing indicators are review findings because color changes, pseudo-elements and other indicators cannot be completely judged by this heuristic. It does not certify focus contrast, magnifier use, complete reading order or all possible app states.

Layout/focus/axe runs use reduced motion to avoid random Indie overlays. Current Indie code is an IIFE exposing no scheduler, so its 30-second appearance check is **explicitly skipped**, not passed. If a future page exposes `window.__bqBeeAuditScheduler(milliseconds)` as a supported test hook, the script invokes it with 30000 and observes bee insertions, including transient ones. It does not monkey-patch timers or alter production pages to expose a hook.

Exit codes: 0 no automated findings; 1 findings; 2 setup, page script or traversal errors. Automated output and axe incomplete results still need human review.

### PDF audit

```sh
bash tools/a11y/audit-pdfs.sh
```

Uses the supplied Java 21 and veraPDF CLI, `-f ua1`, and recursively audits `assets/` plus each `learn-i18n/<code>/assets/`. It never changes PDFs and does not audit duplicate `dist/` copies. Each expected file must have a validator result. Output is `reports/a11y/pdfs.json` and `pdfs.md`, grouped by clause/test with descriptions, failed-file counts and complete failed-check totals. Validator stderr is retained in ignored `pdfs.validator.log`; Java glyph warnings are not discarded. `NODE`, `JAVA_HOME` and `VERAPDF` can override the defaults.

Exit codes: 0 all compliant; 1 non-compliant PDFs; 2 processing/coverage errors. The current report intentionally exits 1.

### Metadata fixer

**Dependency missing:** install only `pdf-lib` into the existing a11y tools directory yourself:

```sh
npm install --prefix "/Volumes/External SSD/Projects/devtools/tools/a11y" pdf-lib
```

The expected module is `/Volumes/External SSD/Projects/devtools/tools/a11y/node_modules/pdf-lib`. Nothing was installed by Codex. The fixer uses pdf-lib's [document metadata and catalog APIs](https://pdf-lib.js.org/docs/api/classes/pdfdocument).

```sh
node tools/a11y/pdf-ua-fix.mjs --lang en-GB assets/worksheets/2d-shapes.pdf
# Use the document's actual language for translated PDFs, e.g. fr, nb, pt-BR.
```

This rewrites the named PDF in place via a temporary sibling and rename, preserving permissions. It reads the PDF Title into `dc:title`, writes `dc:language` and `pdfuaid:part=1`, sets catalog Lang, DisplayDocTitle and Marked, and preserves the existing structure tree and page content. It refuses untagged PDFs, missing titles and overwriting third-party XMP. Its own output can be processed repeatedly. Adding PDF/UA identification is **not a certification**; rerun veraPDF.

`tools/make-worksheets.mjs` now invokes the fixer after every `page.pdf`, passing the worksheet's `htmlLang`. If the module is absent it warns once and continues the build. Other repair failures stop generation. Puzzle pack PDFs come from the apps repo; their producer was not changed here. This standalone fixer can repair their metadata, but not their untagged drawings.

### Worksheet regeneration (host Chrome)

For a first review of the affected sources:

```sh
node tools/make-worksheets.mjs "/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core" column-addition column-subtraction short-multiplication multiplication-grid 2d-shapes
```

Omit IDs to rebuild all English worksheets. Add `--lang <code>` to generate a language's worksheets. This is the existing producer and also generates previews/manifests using its existing `cwebp` requirement; no additional preview tool was installed. Review the printed columns and grid placeholders, then rerun the PDF audit. Rebuild Learn/language sites through the existing builders when ready to incorporate changed question JSON; no publishing is needed to audit local outputs.

## Verification

Local checks:

```sh
node --test tools/a11y/audit.test.mjs tools/a11y/worksheets.test.mjs tools/a11y/pdf-fix.test.mjs
```

Observed here: **7 passed, 2 skipped**, no test failures. The HTTP server test is skipped only on EPERM; the real PDF integration test is skipped when pdf-lib is absent. The latter copies the real 2d-shapes PDF to a temporary directory, exercises the actual fixer twice, compares decoded page streams and structure-tree references, then runs veraPDF to assert metadata failure removal while preserving the 115 content failures. It has not been executed with pdf-lib in this session.

Host browser checks (not launched here):

```sh
node --test tools/a11y/browser.test.mjs
```

These exercise real Chrome against controlled reflow/spacing/focus fixtures, both colour schemes, scheduler skip/transient bee detection, and the actual play page's six-state click route. They require no package installation. Script syntax, shell syntax and `git diff --check` passed here.

All 15 current sitemaps were discovered successfully: **1,156 pages**, including mandatory pages. Browser audit output has not been generated because this sandbox cannot launch Chrome or listen on localhost. No browser accessibility pass is claimed.

The final PDF audit processed **1,269/1,269 existing PDFs**, with four failed rules and zero processing/coverage errors. See [the investigation](../../reports/a11y/pdf-investigation.md) and [the complete PDF summary](../../reports/a11y/pdfs.md). These are baseline results, not regenerated-PDF results.

## Files changed

- `.gitignore`: ignores generated report data/logs while allowing `reports/a11y/*.md` summaries.
- `tools/make-worksheets.mjs`: metadata hook, decorative column layout replacing malformed tables with an accompanying printed equation, and meaningful □ placeholders in multiplication-grid answer cells.
- `tools/a11y/audit-pages.mjs`: local page server, axe runs, custom layout/keyboard/motion checks, app traversal and reporting.
- `tools/a11y/audit-pdfs.sh`, `summarize-pdfs.mjs`: veraPDF execution and JSON/Markdown summaries with coverage checks.
- `tools/a11y/pdf-ua-fix.mjs`: optional metadata post-processing, not content retagging.
- `tools/a11y/common.mjs`: shared discovery, globs, grouping and reporting utilities.
- `tools/a11y/audit.test.mjs`, `worksheets.test.mjs`, `pdf-fix.test.mjs`, `browser.test.mjs`: scoped local and host acceptance checks.
- `tools/a11y/README.md`, `reports/a11y/pdf-investigation.md`, `reports/a11y/pdfs.md`: instructions, evidence and baseline summary. Generated JSON and diagnostic text/logs remain ignored.
