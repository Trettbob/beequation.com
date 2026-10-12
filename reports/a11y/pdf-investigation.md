# Existing PDF/UA failures and worksheet source repairs

## Content repair results — 12 October 2026

Extended `tools/a11y/pdf-ua-fix.mjs` was run on temporary copies of the requested existing PDFs, using pdf-lib 1.17.1, the supplied Node 22.23.3, veraPDF 1.30.3 and Java 21. Chrome, regeneration, installation and publishing were not run. Repository PDFs were not changed by this work. The older baseline investigation below is retained as historical evidence; its metadata-only and missing-dependency statements no longer describe the fixer.

Each copy was validated before/after with `veraPDF -f ua1 --format json --maxfailuresdisplayed 2 --recurse`. The validator processed all 11 files normally. All 11 now have **zero 7.1-3 and 7.1-8 failures**. Ten are fully compliant with veraPDF's PDF/UA-1 profile; column-addition retains its existing table defect.

| Sample path | Pages | Lang | 7.1-3 before → after | 7.1-8 before → after | Alt count before → after | Final PDF/UA-1 |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| `assets/worksheets/2d-shapes.pdf` | 2 | en-GB | 115 → 0 | 1 → 0 | 9 → 9 | PASS |
| `assets/worksheets/2d-shapes-large.pdf` | 7 | en-GB | 183 → 0 | 0 → 0 | 9 → 9 | PASS |
| `assets/worksheets/2d-shapes-easy-read.pdf` | 2 | en-GB | 117 → 0 | 0 → 0 | 9 → 9 | PASS |
| `assets/worksheets/2d-shapes-tactile.pdf` | 9 | en-GB | 18 → 0 | 0 → 0 | 18 → 18 | PASS |
| `assets/worksheets/column-addition.pdf` | 2 | en-GB | 73 → 0 | 1 → 0 | 0 → 0 | FAIL: 7.2-42, 12 checks |
| `assets/worksheets/time-to-5-minutes.pdf` | 2 | en-GB | 88 → 0 | 1 → 0 | 9 → 9 | PASS |
| `learn-i18n/fr/assets/worksheets/2d-shapes.pdf` | 2 | fr | 115 → 0 | 1 → 0 | 9 → 9 | PASS |
| `learn-i18n/ko/assets/worksheets/2d-shapes.pdf` | 2 | ko | 115 → 0 | 1 → 0 | 9 → 9 | PASS |
| `assets/beequation-puzzle-pack.pdf` | 3 | en | 94 → 0 | 1 → 0 | 24 → 24 | PASS |
| `assets/beequation-puzzle-pack-large.pdf` | 15 | en | 364 → 0 | 1 → 0 | 24 → 24 | PASS |
| `assets/beequation-puzzle-pack-easy-read.pdf` | 5 | en | 145 → 0 | 1 → 0 | 24 → 24 | PASS |

The existing `/Lang` explains the puzzle packs' `en`; `--lang-from-path` preserves it rather than replacing it with `en-GB`. The supplied current files have mixed metadata state, shown above; older files still needed the existing metadata repair.

### Exact remaining failure

Column-addition fails ISO 14289-1:2014 clause **7.2, test 42**: table rows must span the same number of columns. veraPDF's expression is `numberOfRowWithWrongColumnSpan == null || wrongColumnSpan != null`; all **12** failing tables report that rows 1 and 2 span different numbers of columns. Structure inspection confirms each first row contains three TDs and each second row four TDs, all with ColSpan 1. Table object references are `35, 54, 73, 92, 111, 130, 149, 168, 187, 206, 225, 244` (generation 0). For example, table 35 has rows 36 and 43 with K arrays of length 3 and 4. The missing empty sign cell is the earlier producer defect described below. These twelve failures were present before repair and are unchanged after it.

Repairing that table would require changing the structure tree or regenerating with the corrected worksheet producer. Neither fits the requested content-stream repair and tree-preservation constraint; Chrome cannot run here. No additional rule fails in this sample.

### Preservation and repeatability evidence

For every sample, pdf-lib decoded page-stream bytes after repair equal the original bytes with only the expected artifact delimiters inserted. An independent comparison also removes artifact marker pairs from the token sequences and verifies every original operator and operand is unchanged. The original literal/hex text and array operand sequence is identical: counts are respectively **1125, 2746, 1159, 1199, 771, 951, 1139, 746, 1931, 4598, 2482** in table order. This checks the requested pdf-lib/zlib text dump preservation; no separate text-extractor executable was available. Original non-page/catalog dictionaries and arrays, including the structure tree, ParentTree, Alt values and outline objects where present, were compared by reference and serialized value. Font content is retained. Alt-bearing objects were counted before/after as shown above. All eleven repaired PDFs are byte-identical after a second pass, and source-file SHA-256 checks confirmed originals were unchanged during verification.

The tokenizer/wrapper keeps strings, composite operands and binary inline-image data opaque. Runs include whole BT/ET blocks and balanced q/Q pairs. q/Q pairs spanning real tags stay outside artifact wrappers. Existing marked runs are untouched. Form repair is recursive and clones decorative uses to protect shared tagged Figure uses. Synthetic tests cover Forms, content arrays with cross-stream BT/ET and q/Q, languages/directories, strings/comments/composites, inline-image false EI delimiters and malformed inputs. **10 tests passed, no skips**, using:

```sh
node --test tools/a11y/pdf-content.test.mjs tools/a11y/pdf-fix.test.mjs
```

Temporary evidence and repaired copies are at `/var/folders/jc/gjvk6spj3x382xnjwrg8c_sm0000gn/T/bq-pdf-ua-samples-W7cf8f/`: `before.json`, `after.json`, `fix.log`, `results.json`, and `fixed/<original-relative-path>`. Validator stderr contains the existing glyph-code warnings; the original run log is `/tmp/bq-sample-run.log`, and completed preservation receipts are in `/tmp/bq-sample-preservation.log`. These are temporary evidence paths, not durable published assets. This is sample validation; the full 1,269-file tree was not batch-repaired or revalidated here.

Batch usage:

```sh
node tools/a11y/pdf-ua-fix.mjs --lang-from-path assets learn-i18n
```

This command repairs files in place. See the tooling README for atomic writes, per-file JSON results and explicit fail-closed limits on unsupported inline-image encodings, mixed text objects and structured/cyclic Form cloning. The retained tagged tree and known Chrome decorations are the basis for this repair; automated profile compliance does not replace a human reading-order/content review.

## Historical baseline — before content repair

Measured with veraPDF 1.30.3, Java 21, PDF/UA-1 profile on 12 October 2026. These results concern existing PDFs. Chrome was not launched and PDFs were not regenerated or repaired in this session.

| Sample | 7.1-3: untagged checks | 7.1-8: metadata checks | Other failures |
| --- | ---: | ---: | --- |
| assets/worksheets/2d-shapes.pdf | 115 | 1 | none |
| assets/worksheets/column-addition.pdf | 73 | 1 | 7.2-42: 12 checks |
| assets/worksheets/time-to-5-minutes.pdf | 88 | 1 | none |
| assets/beequation-puzzle-pack.pdf | 94 | 1 | none |

Full asset-tree validation: 1,269 PDFs, all non-compliant, zero processing/coverage errors.

| Rule | Files | Failed checks |
| --- | ---: | ---: |
| 7.1-3 | 1,269 | 203,036 |
| 7.1-8 | 1,269 | 1,269 |
| 7.2-42 | 90 | 1,080 |
| 7.2-43 | 54 | 520 |

7.2-42 covers column addition/subtraction. 7.2-43 covers short multiplication and multiplication grids. Full file lists are in `pdfs.json`; `pdfs.md` has representative files. Validator stderr contains glyph-code warnings; those are retained in `pdfs.validator.log` separately from the profile's failed rules.

## What the untagged content is

The first page's Flate-decoded content stream in 2d-shapes is object 18. It contains unmarked paint operations between tagged text blocks:

- A white page-sized rectangle (`0 0 795 1048 re`, `f`) outside any BDC/BMC tag.
- Name/date underline rectangles (`50 153 332 1 re`, `413 153 332 1 re`, followed by `f`) between text MCIDs.
- The pale yellow rounded tip-panel fill, with its path coordinates around y=929–991, outside marked content.
- Inline Indie wing/body/face paths after that panel: the wing fill starts with `.8745 .9451 1 rg`, matching the source's `#DFF1FF`. These paths are outside marked content even though the source SVG already has `aria-hidden="true"` and `focusable="false"`.
- Card borders/backgrounds and answer-slot outlines also contribute decorative drawing content. These examples establish the paint types; they are not a claimed one-to-one classification of all 115 checks.

The nine instructional shape SVGs already become **Figure structure elements with Alt text** (`Shape 1` through `Shape 9`; objects 39, 47, 55, 63, 71, 79, 87, 95 and 103). They must remain meaningful figures; hiding these would discard question information. Indie and the footer dots were already aria-hidden. Most worksheet lines and panel borders already use CSS rather than standalone decorative SVGs.

The 2d-shapes catalog already contains `/StructTreeRoot`, `/MarkInfo << /Marked true >>`, `/ViewerPreferences << /DisplayDocTitle true >>` and `/Lang (en-GB)`. Its missing key is **Metadata**. The metadata fixer retains the other settings and writes the missing stream.

## Source changes

The column arithmetic's visual table had empty sign/digit/answer TDs. Chrome omitted empty cells from the PDF structure tree; veraPDF reports unequal row spans. The generator now uses an aria-hidden flex layout for the visual digit arrangement and prints the existing accessible equation text above it. Printing the equation gives Chrome real painted content to tag; clipped screen-reader-only text is not a reliable PDF substitute. This avoids representing a decorative arrangement as a data table.

Multiplication grids remain actual data tables with row/column headers. Their 144 empty question cells now contain □ answer placeholders, so the producer has real content to tag in each cell; answer values are unchanged. This makes a small visible change to the question grid, which needs host print review.

`make-worksheets.mjs` now calls `pdf-ua-fix.mjs` after each PDF, with the actual worksheet language. The optional pdf-lib dependency is missing; generation warns once if it is unavailable. The script adds XMP title/language/PDF-UA identification and enforces the catalog flags requested. It cannot manufacture a valid structure tree or mark individual paint operators as artifacts.

## What remains unverified or requires a different producer/repair

No post-change Chrome PDF exists here. The table-source changes and metadata generator tests pass locally, but elimination of the table/catalog rules must be checked against newly generated PDFs. The real fixer/veraPDF acceptance test is supplied and waits for pdf-lib to be installed at the specified tools path.

**7.1-3 remains a demonstrated limitation of the existing Chrome/Skia output**, including the white page fill and decorative CSS/SVG paint. An HTML aria-hidden attribute excludes a node from the accessibility tree; the observed PDFs show that this does not reliably wrap its drawing commands in `/Artifact` marked content. Repeating aria-hidden attributes or changing SVG borders to CSS cannot guarantee a fix, and removing decorative drawings would still leave the unmarked page fill. Proper PDF artifact tagging requires a content-aware PDF repair or a producer that emits it. The metadata-only fixer deliberately does not blanket-mark untagged operations: not every untagged operation is necessarily decorative.

This is a limitation observed in these files, not a claim that every future Chrome release behaves identically or that all remaining failures are inherently unfixable. Revalidate regenerated output. The apps-repo puzzle-pack producer was outside this website worktree and was not changed.

References: [Chromium's tagged PDF overview](https://blog.chromium.org/2020/07/using-chrome-to-generate-more.html), [W3C PDF4: decorative images as artifacts](https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF4.html), [pdf-lib metadata API](https://pdf-lib.js.org/docs/api/classes/pdfdocument). The specific paint/tag conclusions above come from the local PDF streams and veraPDF results, not an inference of PDF/UA conformance from these general references.
