# Writing Learn pages

The Learn section is built from the files in this folder by `python3 tools/build-learn.py` (run from the repo
root), then `python3 tools/build-langs.py` adds the flying bee. Read `topics/fractions.html` first: it is the
model topic page. The front matter and shortcodes are documented at the top of `tools/build-learn.py`.

## Who it's for
Parents, carers and teachers of children aged 4 to 11 (Reception to Year 6), mostly in the UK. Write for a busy
parent who isn't confident at maths: plain words, short paragraphs, concrete examples with real numbers.
Teachers should still find it accurate and useful.

## Facts
- Follow the **National Curriculum in England** (2014, still current) for what is taught in each year, and the
  EYFS framework for Reception. Don't invent statistics, studies or quotes. If unsure, leave it out.
- Tests: the **Multiplication Tables Check** is in June of Year 4 (25 questions, 6 seconds each, times tables up
  to 12 × 12, done on screen; there is no pass mark). **Key Stage 2 SATs** are in May of Year 6 (arithmetic paper
  plus two reasoning papers). **Key Stage 1 SATs** stopped being compulsory from 2023/24; some schools still use
  the papers. The Reception Baseline Assessment happens in the first six weeks of Reception.
- Mention US grades only as a rough guide (UK Year N ≈ US Grade N−1).
- Every worked example and every challenge answer must be correct. Check the arithmetic twice.

## Voice
- UK English spelling and terms: maths, colour, centre, metre, litre, pupils, Year 3, carers, tens frame is
  "ten frame", "times tables", "column method", "number line", "part-whole model", "bar model".
- Friendly and direct. Second person ("your child", "you"). No "simply", "just", "easy" (it isn't for everyone).
- Use the words children will hear at school, then explain them.
- Use proper symbols: × ÷ − (minus sign), and the fraction characters ½ ¼ ¾ ⅓ ⅔ ⅕ ⅛ or ¹⁄₇-style for others.
- No emoji anywhere.

## Indie
Indie is a cheerful honeybee shaped like a hexagon (the "Hexabee"), and the mascot of Beequation Kids. Indie is
**she/her**. She is the running theme of every page:
- the `indie:` front-matter line: one or two short, warm sentences in her voice, ideally with a bee, honey or
  honeycomb twist that also teaches something;
- at least one `<tip>` per page (practical advice for the grown-up), written in a plain adult voice;
- one `<challenge q="...">answer</challenge>` per topic or year page: a short word problem starring Indie, with the
  worked answer;
- `<try/>` near the end of topic and year pages. Don't oversell the app; one box is enough.

## Page shapes
**Topic page** (`topics/<slug>.html`, about 1,000 to 1,500 words): intro with a definition; "What children learn,
year by year" table (link each year to `/learn/years/year-N.html`); "The big ideas" (3 to 6 numbered h3s, with a
simple inline SVG where a picture really helps); a `<tip>`; "Common mistakes to look out for"; "Five-minute games
for home" (4 to 6); a `<challenge>`; "Free <topic> worksheets" with `<worksheets topic="<slug>"/>`; "Quick answers"
(3 to 5 `<qa>`); `<try/>`; "Keep learning" `<cards>` (2 or 3 related links).

**Year page** (`years/<slug>.html`): what a child of that age is working on; the curriculum for the year grouped by
topic (link each topic heading to its topic page); "By the end of the year, most children can…" checklist; key
vocabulary; tests that year (if any); how to help at home; `<tip>`; `<challenge>`; `<worksheets year="<slug>"/>`;
`<qa>`s; `<try/>`; links to the previous and next year.

**Guide** (parents/, teachers/): a practical article, 800 to 1,400 words, with h2 sections, at least one `<tip>`,
`<qa>`s where they fit, and "Keep learning" cards.

## Inline pictures
Inline SVG only (no image files, no external requests). Give each one `role="img"` and an `aria-label` that says
what it shows, `width`/`height` plus `style="display:block;max-width:100%;height:auto"`. Use the candy colours
#FFD84D #7EE8C6 #8FD3FF #FFA8D2 #FFB37A #C6B2FF #FFB020 for fills, `stroke="currentColor"` for lines and
`fill="currentColor"` for text so it works in light and dark mode. Keep them simple and check the maths in them.

## Links
Link between Learn pages freely (topics, years, parents, teachers, glossary at `/learn/glossary/`, worksheets at
`/learn/worksheets/`). The older articles are `/learn/number-bonds-to-20.html`, `/learn/times-tables-practice.html`,
`/learn/mental-maths-strategies.html` and `/learn/daily-maths-puzzle-for-adults.html`. Free puzzle pack for
classes: `/teachers.html`. The browser game: `/play.html`. Outside links are fine when they help (e.g. GOV.UK
curriculum pages), but the page itself must not load anything from another site.
