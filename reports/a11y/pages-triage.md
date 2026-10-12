# Page audit triage

Supplied audit: 2026-10-12T10:43:25.916Z; 352 runs, 0 errors. All **11,429 deduplicated findings** (120 real nodes; 11,309 false-positive nodes) are classified individually in [pages-triage.json](pages-triage.json). Original pages.json/pages.md are preserved.

**This is source triage, not a fresh browser audit.** Chrome cannot run in this sandbox. Real-browser regressions are retained in tools/a11y/browser.test.mjs for a host run.

| Rule | Real nodes | False-positive nodes | Fix |
| --- | ---: | ---: | --- |
| aria-prohibited-attr | 2 | 0 | Visual progress/stars/stickers receive role="img". |
| color-contrast | 3 | 0 | Hero kicker uses #9AA3B2 on #12161F (7.12:1); game result uses white on grape (5.33:1); Today borrows the page CSS instead of the injected preference CSS, restoring its honey button. |
| keyboard-unreachable | 0 | 2679 | Share ancestor/state/viewport/clipping visibility; allow only the first summary subtree of closed details. Count traversal budget across the entire rendered page, but flag only initial viewport controls. |
| reflow-horizontal-scroll | 103 | 0 | Learn tables use fixed layout and overflow-wrap:anywhere; content stays available without document overflow. |
| target-size | 3 | 0 | Glossary anchors have minimum 24×24px hit boxes and margin. |
| text-spacing-clipped | 1 | 1 | 404 bubble is in flow and cells shrink. Require overflowing text ranges, not decorative scroll overflow. Game boards use content width; stars/progress shrink; result/buttons wrap. |
| focus-indicator-review | 7 | 18 | Inspect descendant SVG stroke and background/border changes. Strengthen 404 backgrounds and Pro night strokes to honey (7.96:1 against cells). |
| page-has-heading-one | 1 | 0 | Pro home daily puzzle title becomes h1, preserving translated text. |
| text-spacing-overlap-review | 0 | 8611 | Only compare visible text from different non-containing elements; clip ranges to viewport/ancestors, ignore decorative text and distinguish fixed/modal overlay layers. Genuine absolute text collisions remain detectable. |

## Known manual issues

- The header measures full unwrapped content, including all current text/font/spacing preferences. CSS compact state and nav JS use the same measured result; resize, font readiness, ResizeObserver and preference changes refresh it. Wide pill max-width can grow to 1500px. The compact brand can wrap at phone widths.
- Easy Read has explicit 20px minimum body text, 1.6 line height (also with Extra spacing), 48px pictures, a single point per flex row, and wrapping text.
- The native modal accessibility dialog anchors 8px below its trigger on wide layouts. Phone triggers use a bottom sheet; a visible wide-screen drawer trigger also anchors below its button. Native modal semantics and explicit Tab trap remain; Escape closes and focus returns to the opener, or the visible wide accessibility/hive trigger if a preference change hides the opener.

## Files changed

The complete worktree list is in [pages-changed-files.txt](pages-changed-files.txt). Rebuilt ignored dist/ output is also present.

- Sources: tools/build-langs.py, tools/build-learn.py, tools/build_today.py; assets/accessibility.css, assets/accessibility.js, new assets/header-fit.js; index.html, 404.html, play.html, all three easy-read/*.html pages.
- Rebuilt output: shared chrome on root/Learn/Today/blog HTML; generated Learn pages and dist/<language>/ sites; sitemap.xml now reflects files present on disk (the prior missing 2d-shapes-tactile.pdf URL was removed by the existing builder).
- Tests: tools/a11y/audit-pages.mjs, browser.test.mjs, worksheets.test.mjs (copy its braille fixture dependency); new visibility.test.mjs, header-fit.test.mjs, panel.test.mjs.

## By-eye/host checks still required

1. Run `node tools/a11y/audit-pages.mjs --lang en` on the host to regenerate all 352 original states with the corrected audit. Review any remaining axe incomplete results; this source triage does not resolve those manual checks.
2. Run `node --test tools/a11y/browser.test.mjs` on the host, without BQ_SKIP_BROWSER.
3. At 1280px use 125% and 150% text, Extra spacing, and the dyslexia font in combination: Play free stays fully visible and the compact menu works; resize while a menu/dialog is open.
4. Check all Easy Read pages at 320px, the four Learn tables, the glossary letters, and 404 bubble/cells with spacing and larger text.
5. Check dialog anchoring, phone bottom sheet, Tab/Shift+Tab, Esc and focus return when changing text size switches the header.
6. Check homepage/Today hexagon focus and both game focus styles, the Pro home heading, and the Kids result screen (contrast, progress dots and stars).

No commit, push, install, publishing, daily.sh or third-party request was performed.

## Verification of final source and output

- `python3 tools/build-learn.py` and `python3 tools/build-langs.py`: pass.
- Repeating both builds: identical SHA-256 hashes for 3,345 HTML/CSS/JS/XML/JSON/text/SVG source and site files. Verification itself changed none of these files.
- `python3 tools/build-langs.py --check`: **all translated**.
- `python3 -m unittest tools.tests.test_accessibility tools.tests.test_blog tools.tests.test_worksheets tools.tests.test_braille tools.launch.test_launch`: **32 passed** (daily.sh tests excluded). Existing ResourceWarnings and expected invalid-fixture diagnostics remain in the log.
- `python3 tools/check-international-seo.py`: **6 passed**.
- `node tools/check-language-script.mjs`: **PASS**, all 15 sites.
- `BQ_SKIP_BROWSER=1 node --test tools/a11y/*.test.mjs`: **27 passed, 0 failed, 7 explicitly skipped** (6 host Chrome checks, 1 local HTTP-listen sandbox restriction). No browser was launched.
- `git diff --check`: pass.

Full command output is retained under [fix-verification/](fix-verification/). A clean automated browser audit is still unverified until the host rerun above.
