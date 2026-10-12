# Existing PDF/UA failures and worksheet source repairs

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
