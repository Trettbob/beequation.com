#!/usr/bin/env python3
"""Builds the Learn section (learn/**.html) from the page sources in learn-src/.

Each source is an HTML fragment that starts with a front-matter block:

    ---
    title: <title tag and og:title>
    description: <meta description>
    h1: <page heading>
    nav: <short name for breadcrumbs and menus> (optional, defaults to h1)
    kicker: <small label above the heading> (optional)
    indie: <what Indie says at the top of the page> (optional)
    layout: article | hub (hub = full width)
    updated: YYYY-MM-DD
    author: <name> (optional; author_role supplies their role)
    reviewer: <name> (optional; reviewer_role supplies their role)
    published: YYYY-MM-DD (optional)
    reviewed: YYYY-MM-DD (optional; overrides updated in Article dateModified)
    ---

Shortcodes in the body (all plain HTML otherwise):
    <tip>text</tip>                       Indie's tip, with Indie
    <indie>text</indie>                   Indie says something (bigger)
    <challenge q="question">answer</challenge>   Indie's challenge, answer hidden until tapped
    <qa q="question">answer</qa>          a quick-answer pair (also added to FAQPage structured data)
    <worksheets topic="fractions"/>       worksheet cards from learn-src/worksheets.json (also year="year-3" or ids="a,b")
    <cards>…<card href="/x" title="T" glyph="½" colour="pink">text</card>…</cards>   link cards
    <try/>                                the "practise with Indie" app box

Run from the repo root: python3 tools/build-learn.py   (then python3 tools/build-langs.py adds the site header, the
language menu and the flying bee; its Learn mega menu is built from TOPICS, YEARS and learn-src/ too).
The four older hand-made articles in learn/ are kept; they just get the Learn menu added.

Other languages: learn-i18n/<code>/ holds that country's own Learn pages (same front matter and shortcodes), a
site.json (the template's words, the topic names, that country's school years) and its worksheets.json. They are
written for that country's school system, not translated word for word: see learn-i18n/README.md. build-langs.py
builds them into dist/<code>/learn/ (plus dist/<code>/teachers.html from pack.html) for the codes in LEARN_LIVE.
"""
import html, json, os, re, sys
from urllib.parse import quote
from build_today import format_date, words as today_words
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'learn-src')
OUT = os.path.join(ROOT, 'learn')
MAIN = 'https://beequation.com'

# ---------- the Learn map: drives the sub-menu, hubs and breadcrumbs ----------
TOPICS = [  # slug, name, glyph, candy colour
    ('counting-and-place-value', 'Counting and place value', '123', 'lemon'),
    ('addition-and-subtraction', 'Addition and subtraction', '+', 'mint'),
    ('multiplication-and-division', 'Multiplication and division', '×', 'sky'),
    ('fractions', 'Fractions', '½', 'pink'),
    ('decimals-and-percentages', 'Decimals and percentages', '%', 'lilac'),
    ('telling-the-time', 'Telling the time', '3:00', 'peach'),
    ('money', 'Money', '£', 'lemon'),
    ('measurement', 'Measurement', 'cm', 'mint'),
    ('shape-and-geometry', 'Shape and geometry', '△', 'sky'),
    ('data-and-graphs', 'Data and graphs', '▥', 'pink'),
    ('algebra-and-ratio', 'Algebra and ratio', 'x', 'lilac'),
    ('mental-maths', 'Mental maths', '⚡', 'peach'),
]
YEARS = [  # slug, name, age, US grade
    ('reception', 'Reception', '4 to 5', 'Pre-K'),
    ('year-1', 'Year 1', '5 to 6', 'Kindergarten'),
    ('year-2', 'Year 2', '6 to 7', 'Grade 1'),
    ('year-3', 'Year 3', '7 to 8', 'Grade 2'),
    ('year-4', 'Year 4', '8 to 9', 'Grade 3'),
    ('year-5', 'Year 5', '9 to 10', 'Grade 4'),
    ('year-6', 'Year 6', '10 to 11', 'Grade 5'),
]
CANDY = {'lemon': ('#FFD84D', '#1C1A4A'), 'mint': ('#7EE8C6', '#1C1A4A'), 'sky': ('#8FD3FF', '#1C1A4A'),
         'pink': ('#FFA8D2', '#1C1A4A'), 'peach': ('#FFB37A', '#1C1A4A'), 'lilac': ('#C6B2FF', '#1C1A4A'),
         'grape': ('#6A4BF5', '#FFFFFF'), 'honey': ('#FFB020', '#12161F')}
SECTIONS = {'topics': 'Topics', 'years': 'Year groups', 'parents': 'Parents', 'teachers': 'Teachers',
            'worksheets': 'Worksheets', 'glossary': 'Maths glossary'}

from a11y_math import accessible_math

def esc(s): return html.escape(s, quote=True)
def rd(p): return open(p, encoding='utf-8').read()

# ---------- languages ----------
I18N = os.path.join(ROOT, 'learn-i18n')
# Languages whose own Learn section is built into their site and linked from its header. Add a code once every page
# in learn-i18n/<code>/ is written and checked (build-langs.py --learn <code> builds one that isn't, to preview it).
LEARN_LIVE = {'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'tr', 'ja', 'ko'}
# Every word the Learn templates and the header's Learn menu use. learn-i18n/<code>/site.json "words" overrides them.
WORDS = {
    'html_lang': 'en-GB', 'home': 'Home', 'learn': 'Learn', 'learn_home': 'Learn home', 'sections': SECTIONS,
    'all_topics': 'All topics →', 'all_years': 'All year groups →', 'year_small': 'age {age} · US {us}',
    'tip': "Indie's tip", 'challenge': "Indie's challenge", 'show': 'Show the answer',
    'standard_pdf': 'Standard PDF',
    'large_print': 'Large print',
    'easy_read': 'Easy-read',
    'show_answers': 'Show answers',
    'worksheet_questions': 'Questions',
    'worksheet_downloads': 'Downloads',
    'pdf_size_pending': 'PDF; size available after generation',
    'pdf_kb': '{size} KB',
    'sheet_alt': 'Preview of the {title} worksheet', 'download': 'Download PDF',
    'try_title': 'Practise with Indie', 'try_text': 'Beequation Kids turns number facts into honeycomb puzzles, with Indie giving a hint when a child is stuck. No ads and no data collected.',
    'try_play': 'Play free in your browser', 'try_sheets': 'Free worksheets',
    # the header's Learn menu (build-langs.py)
    'teachers': 'Teachers', 'pack': 'Free puzzle pack for teachers', 'pack_desc': '24 honeycomb puzzles to print',
    'home_desc': 'Free maths help for home and school, Reception to Year 6', 'worksheets': 'Free worksheets',
    'glossary_blurb': 'Primary maths words explained in plain English, each with an example and the year children usually meet it. Pick a letter:',
    'm_topics': 'Topics', 'm_topics_k': 'Browse topics', 'm_topics_all': 'All topics',
    'm_years': 'Year groups', 'm_years_k': 'Browse year groups', 'm_years_all': 'All year groups', 'm_years_hex': 'R–6', 'm_year_small': 'Age {age} · US {us}',
    'm_parents': 'For parents', 'm_parents_k': 'Guides for parents', 'm_parents_all': 'All parent guides',
    'm_teachers': 'For teachers', 'm_teachers_k': 'Resources for teachers', 'm_teachers_all': 'All teacher resources',
    'm_sheets': 'Worksheets', 'm_sheets_k': 'Free worksheets by topic', 'm_sheets_all': 'All worksheets', 'm_sheet_n': ['{n} worksheet', '{n} worksheets'],
    'm_glossary': 'Maths glossary', 'm_glossary_k': 'Maths words from A to Z', 'm_glossary_all': 'All glossary words',
    'alphabet': 'abcdefghijklmnopqrstuvwxyz',
    'by': 'By {name}', 'reviewed_by': 'Reviewed by {name}',
    'published_on': 'Published {date}', 'reviewed_on': 'Reviewed on {date}', 'report_error': 'Report an error',
}

# Text-format vocabulary is shared with the local liblouis and EPUB generators.
import sys
sys.path.insert(0, os.path.join(ROOT, 'tools', 'braille'))
from common import words as braille_words, LICENSE

class Site:
    """One language's Learn section: where its sources are, where it's built to, its words, topics and school years."""
    def __init__(self, lang='en'):
        self.lang, self.en = lang, lang == 'en'
        self.bw = braille_words(lang)
        self.src = SRC if self.en else os.path.join(I18N, lang)
        self.out = OUT if self.en else os.path.join(ROOT, 'dist', lang, 'learn')
        self.main = MAIN if self.en else f'https://{lang}.beequation.com'
        cfg = {} if self.en else json.load(open(os.path.join(self.src, 'site.json'), encoding='utf-8'))
        self.w = {**WORDS, **cfg.get('words', {})}
        self.w['sections'] = {**SECTIONS, **self.w['sections']}
        self.topics = TOPICS if self.en else [(t['slug'], t['name'], t['glyph'], t['colour']) for t in cfg['topics']]
        # school years: slug, name, age, US grade (English only), and the short label for the menu's hexagons
        self.years = YEARS if self.en else [(y['slug'], y['name'], y['age'], y.get('us', '')) for y in cfg['years']]
        self.year_hex = ({s: 'R' if s == 'reception' else n.split()[-1] for s, n, *_ in YEARS} if self.en else
                         {y['slug']: y['short'] for y in cfg['years']})
    def has(self, rel):
        # These four articles predate learn-src; their English files are still their source.
        legacy = {'mental-maths-strategies.html', 'times-tables-practice.html',
                  'daily-maths-puzzle-for-adults.html', 'number-bonds-to-20.html'}
        worksheet = (rel.startswith('worksheets/') and rel.endswith('.html')
                     and os.path.isfile(os.path.join(self.src, rel[:-5] + '.json'))
                     and any(rel == f'worksheets/{w["id"]}.html' for w in worksheets_manifest(self)))
        return worksheet or os.path.exists(os.path.join(self.src, rel)) or (self.en and rel in legacy and os.path.isfile(os.path.join(self.out, rel)))

_SITES = {}
def site_of(lang='en'):
    if lang not in _SITES: _SITES[lang] = Site(lang)
    return _SITES[lang]
EN = site_of('en')

# ---------- Indie ----------
HEX = 'M82 60 L66 86 L34 86 L18 60 L34 34 L66 34 Z'
def indie(size=84, happy=True, cls='indie'):
    k = '#1C1A4A'
    eye = (f'<path d="M64.5 57 Q68 52 71.5 57" fill="none" stroke="{k}" stroke-width="2.6" stroke-linecap="round"/>' if happy
           else f'<circle cx="68" cy="56" r="3.6" fill="{k}"/><circle cx="69" cy="55" r="1.1" fill="#fff"/>')
    smile = 'M62 65 Q69 74 76 64' if happy else 'M63 66 Q69 71 75 65'
    return (f'<svg class="{cls}" viewBox="1 9 91.4 80" width="{size}" height="{round(size * .875)}" aria-hidden="true" focusable="false">'
            f'<ellipse cx="42" cy="28" rx="13" ry="10" fill="#DFF1FF" stroke="{k}" stroke-width="3" transform="rotate(-20 42 28)"/>'
            f'<ellipse cx="60" cy="26" rx="12" ry="9.5" fill="#DFF1FF" stroke="{k}" stroke-width="3" transform="rotate(18 60 26)"/>'
            f'<path d="{HEX}" fill="#FFD84D"/><rect x="35" y="34" width="7" height="52" fill="{k}"/><rect x="50" y="34" width="7" height="52" fill="{k}"/>'
            f'<path d="{HEX}" fill="none" stroke="{k}" stroke-width="3.5" stroke-linejoin="round"/>{eye}'
            f'<path d="{smile}" fill="none" stroke="{k}" stroke-width="2.6" stroke-linecap="round"/><circle cx="76" cy="61" r="3" fill="#FFA8D2"/>'
            f'<path d="M64 34 Q68 20 76 16" fill="none" stroke="{k}" stroke-width="2.6" stroke-linecap="round"/><circle cx="77" cy="15.5" r="3.2" fill="{k}"/>'
            f'<path d="M18 57 L11 60 L18 63" fill="{k}" stroke="{k}" stroke-width="2" stroke-linejoin="round"/></svg>')

def glyph(g, colour, size=46):
    fill, ink = CANDY.get(colour, CANDY['lemon'])
    fs = 22 if len(g) <= 1 else 17 if len(g) == 2 else 14
    return (f'<svg class="g" viewBox="0 0 46 52" width="{size}" height="{round(size * 52 / 46)}" aria-hidden="true" focusable="false">'
            f'<path d="M23 1 L45 14 L45 38 L23 51 L1 38 L1 14 Z" fill="{fill}"/>'
            f'<text x="23" y="27" text-anchor="middle" dominant-baseline="central" font-family="Fredoka, sans-serif" font-weight="700" font-size="{fs}" fill="{ink}">{esc(g)}</text></svg>')

# ---------- styles shared by every Learn page (added to the site's base styles) ----------
LEARN_CSS = """
.doc.hub { max-width: none; }
.doc p > a[href^="#"] { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; min-height: 24px; margin: 3px; }
.doc table { table-layout: fixed; overflow-wrap: anywhere; border-collapse: collapse; width: 100%; margin: 12px 0 18px; font-size: 16px; }
.doc th, .doc td { text-align: left; vertical-align: top; padding: 9px 10px; border-bottom: 1px solid var(--line); }
.doc th { font-size: 14px; color: var(--mute); font-weight: 600; }
.doc ul, .doc ol { padding-left: 22px; margin: 0 0 14px; } .doc li { margin: 0 0 6px; }
.doc h3 { font-size: 18px; margin: 22px 0 4px; }
.doc dl { margin: 0 0 18px; } .doc dt { font-weight: 700; font-size: 18px; margin: 16px 0 2px; scroll-margin-top: 16px; } .doc dd { margin: 0; color: var(--ink); }
.doc dt:target { color: var(--cobalt); }
.crumbs { font-size: 15px; color: var(--mute); margin: 0 0 14px; } .crumbs a { color: inherit; }
.kicker { font: 600 14px/1.2 inherit; letter-spacing: .06em; text-transform: uppercase; color: var(--mute); margin: 0 0 8px; }
.learnnav { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 4px 0 10px; }
.learnnav > a, .learnnav summary { display: inline-block; font-weight: 600; font-size: 15px; padding: 7px 13px; border-radius: 12px; background: var(--card); box-shadow: inset 0 0 0 1px var(--line); color: var(--ink); text-decoration: none; cursor: pointer; list-style: none; white-space: nowrap; }
.learnnav summary::-webkit-details-marker { display: none; }
.learnnav summary::after { content: ' ▾'; font-size: 12px; color: var(--mute); }
.learnnav [aria-current="page"], .learnnav .here > summary { background: var(--honey); color: var(--honey-ink); box-shadow: none; }
.learnnav .here > summary::after { color: var(--honey-ink); }
.learnnav details { position: relative; }
.learnnav .drop { position: absolute; left: 0; top: calc(100% + 6px); background: var(--card); border-radius: 16px; box-shadow: 0 12px 34px rgba(0,0,0,.2); padding: 8px; display: grid; grid-template-columns: repeat(2, minmax(200px, 1fr)); gap: 2px; z-index: 25; }
.learnnav .drop a { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; color: var(--ink); text-decoration: none; font-size: 15px; font-weight: 500; }
.learnnav .drop a:hover, .learnnav .drop a[aria-current] { background: var(--ground); }
.learnnav .drop small { color: var(--mute); font-size: 13px; }
@media (max-width: 640px) { .learnnav .drop { position: fixed; left: 12px; right: 12px; top: auto; grid-template-columns: 1fr; max-height: 70vh; overflow: auto; } }
.say { display: flex; gap: 14px; align-items: flex-end; margin: 6px 0 22px; }
.say .bubble { position: relative; background: var(--card); border-radius: 20px; padding: 14px 18px; font: 600 19px/1.35 Fredoka, 'Space Grotesk', sans-serif; color: var(--ink); box-shadow: inset 0 0 0 1px var(--line); max-width: 560px; }
.say .bubble::before { content: ''; position: absolute; left: -9px; bottom: 16px; border: 9px solid transparent; border-left: 0; border-right-color: var(--card); }
.say svg, .tip svg, .challenge svg, .trybox svg { flex: none; }
.tip { display: flex; gap: 14px; align-items: flex-start; margin: 22px 0; padding: 16px 18px; border-radius: 20px; background: #FFF6D6; color: #1C1A4A; }
.tip b.t { display: block; font: 700 15px/1.2 Fredoka, sans-serif; letter-spacing: .03em; margin-bottom: 2px; color: #8A5A00; }
.tip p { margin: 0 0 6px; } .tip p:last-child { margin: 0; }
.tip a { color: #3B24A8; }
.challenge { margin: 22px 0; padding: 16px 18px; border-radius: 20px; background: #EEE9FF; color: #1C1A4A; }
.challenge summary { cursor: pointer; list-style: none; display: flex; gap: 14px; align-items: center; }
.challenge summary::-webkit-details-marker { display: none; }
.challenge .q b { display: block; font: 700 15px/1.2 Fredoka, sans-serif; color: #3B24A8; letter-spacing: .03em; }
.challenge .show { font-size: 14px; color: #3B24A8; text-decoration: underline; }
.challenge[open] .show { display: none; }
.challenge .ans { margin: 12px 0 0 0; padding-top: 10px; border-top: 1px dashed #B9A6FF; }
@media (prefers-color-scheme: dark) {
  .tip { background: #3A3017; color: #FFF3D1; } .tip b.t { color: #FFD27A; } .tip a { color: #FFD27A; }
  .challenge { background: #2C2866; color: #F4F2FF; } .challenge .q b, .challenge .show { color: #C9C3FF; }
  .challenge .ans { border-top-color: #5A56A0; }
  .say svg, .tip svg.indie, .challenge svg.indie, .trybox svg.indie { filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff); }
}
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; margin: 14px 0 26px; }
.card { display: flex; gap: 14px; align-items: flex-start; background: var(--card); border-radius: 18px; padding: 16px; box-shadow: inset 0 0 0 1px var(--line); color: var(--ink); text-decoration: none; }
.card:hover { box-shadow: inset 0 0 0 2px var(--honey); }
.card b { display: block; font-size: 17px; margin-bottom: 2px; }
.card span { display: block; font-size: 15px; color: var(--mute); line-height: 1.4; }
.card .g { flex: none; }
.sheets { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; margin: 14px 0 26px; }
.sheet { background: var(--card); border-radius: 18px; padding: 12px; box-shadow: inset 0 0 0 1px var(--line); display: flex; flex-direction: column; }
.sheet img { width: 100%; height: auto; aspect-ratio: 210 / 297; object-fit: cover; object-position: top; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px var(--line); }
.sheet b { font-size: 16px; margin: 10px 0 2px; line-height: 1.25; }
.sheet small { color: var(--mute); font-size: 13px; flex: 1; }
.sheet a.dl { margin-top: 10px; display: inline-flex; justify-content: center; padding: 9px 12px; border-radius: 12px; background: var(--honey); color: var(--honey-ink); font-weight: 700; font-size: 15px; text-decoration: none; }
.trybox { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; margin: 34px 0 8px; padding: 22px 24px; border-radius: 22px; background: #6A4BF5; color: #fff; }
.trybox p { margin: 0 0 4px; } .trybox .t { font: 700 21px/1.2 Fredoka, sans-serif; }
.trybox .go { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
.trybox .btn.plain { background: #fff; color: #1C1A4A; box-shadow: none; }
.qa { margin: 0 0 12px; } .qa b { display: block; }
.hero { display: flex; gap: 22px; align-items: center; flex-wrap: wrap; margin: 0 0 10px; }
.hero .say { margin: 0; }
"""


# Worksheet questions remain text/HTML; the print view omits site navigation and keeps answers optional.
LEARN_CSS += "\n.sheet-formats { font-size: 13px; margin: 8px 0 0; }\n"
WORKSHEET_CSS = r"""
.doc:has(.worksheet) { max-width: 1100px; }
.worksheet { line-height: 1.6; }
.doc .worksheet-questions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 0; margin: 20px 0 28px; list-style: none; }
.worksheet-questions > li { position: relative; min-width: 0; margin: 0; padding: 16px; background: var(--card); color: var(--ink); border-radius: 18px; box-shadow: inset 0 0 0 1px var(--line); break-inside: avoid; }
.worksheet-number { display: inline-flex; align-items: center; justify-content: center; width: 2em; height: 2em; margin-bottom: 12px; border-radius: 50%; background: #FFD84D; color: #1C1A4A; font: 700 16px/1 Fredoka, sans-serif; }
.worksheet-questions > li:nth-child(6n + 2) .worksheet-number { background: #7EE8C6; }
.worksheet-questions > li:nth-child(6n + 3) .worksheet-number { background: #8FD3FF; }
.worksheet-questions > li:nth-child(6n + 4) .worksheet-number { background: #FFA8D2; }
.worksheet-questions > li:nth-child(6n + 5) .worksheet-number { background: #FFB37A; }
.worksheet-questions > li:nth-child(6n) .worksheet-number { background: #C6B2FF; }
.worksheet-question { overflow-wrap: anywhere; }
.worksheet-cards .worksheet-question { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.doc .worksheet-whole .worksheet-questions { grid-template-columns: minmax(0, 1fr); }
.worksheet svg { max-width: 100%; vertical-align: middle; background: white; border-radius: 8px; }
.worksheet svg text { fill: #1C1A4A; }
.worksheet .coins { display: flex; gap: .5em; flex-wrap: wrap; align-items: center; justify-content: center; }
.worksheet .ansline { margin-top: .5em; max-width: 100%; }
.worksheet .bx { display: inline-block; box-sizing: border-box; width: 3em; height: 1.9em; border: 2px solid var(--ink); border-radius: .35em; background: var(--ground); color: transparent; vertical-align: middle; }
.worksheet .line, .worksheet .ansline.wide { display: inline-block; box-sizing: border-box; width: 6em; max-width: 100%; min-height: 1.9em; border-bottom: 2px solid var(--ink); vertical-align: bottom; }
.worksheet .line { margin-left: .5em; }
.worksheet .fr { white-space: nowrap; }
.worksheet .fr i { font-style: normal; }
.worksheet .col { display: none; }
.worksheet .column-expression { font-size: 1.15em; }
.worksheet .grid12 { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: clamp(11px, 2vw, 18px); }
.worksheet .grid12 th, .worksheet .grid12 td { text-align: center; padding: .4em .1em; border: 1px solid currentColor; }
.worksheet .chart-data { border-collapse: collapse; width: auto; margin: 1em 0; }
.worksheet .chart-data th, .worksheet .chart-data td { padding: .3em 1em; text-align: left; border: 1px solid currentColor; }
.worksheet-answers { margin-top: 2em; }
.worksheet-answers summary { display: list-item; width: fit-content; padding: 12px 20px; border-radius: 12px; background: var(--honey); color: var(--honey-ink); cursor: pointer; font-weight: 700; }
.worksheet-answers summary:hover { outline: 2px solid var(--ink); outline-offset: 2px; }
.worksheet-answers summary:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
.worksheet-answers[open] > ol { margin-top: 20px; }
@media (min-width: 960px) { .doc .worksheet-questions { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 639px) { .doc .worksheet-questions { grid-template-columns: minmax(0, 1fr); } }
@media print {
  body:has(.worksheet) { --ground: #fff; --card: #fff; --ink: #000; --mute: #000; --line: #000; --honey: #fff; --honey-ink: #000; background: white; color: black; }
  body:has(.worksheet) #bqh, body:has(.worksheet) .learnnav, body:has(.worksheet) .bqf,
  body:has(.worksheet) .crumbs, body:has(.worksheet) .report-error,
  body:has(.worksheet) .worksheet-downloads, body:has(.worksheet) .worksheet h2:first-of-type,
  body:has(.worksheet) #bq-language-suggestion, body:has(.worksheet) .bq-ok { display: none !important; }
  body:has(.worksheet) .wrap, body:has(.worksheet) .doc { width: auto; max-width: none; margin: 0; padding: 0; border: 0; box-shadow: none; }
  body:has(.worksheet) a { color: black; }
  .doc .worksheet-questions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12pt; }
  .doc .worksheet-whole .worksheet-questions { grid-template-columns: minmax(0, 1fr); }
  .worksheet-questions > li { border: 1px solid black; box-shadow: none; background: white; color: black; }
  .worksheet-number, .worksheet-questions > li .worksheet-number { background: white; color: black; border: 1px solid black; }
  .worksheet svg { filter: grayscale(1); }
  .worksheet svg text { fill: black; }
  .worksheet-answers summary { background: white; color: black; border: 1px solid black; }
  .worksheet-answers:not([open]) { display: none; }
  .worksheet-answers[open] { break-before: page; }
  .worksheet .tip, .worksheet .tip b.t, .worksheet .tip a { background: white; color: black; filter: none; break-inside: avoid; }
}
"""

# ---------- page chrome taken from an existing page, so Learn matches the rest of the site ----------
# The site header is not copied: each page gets an empty <!--header--> slot that build-langs.py fills.
HEADER_SLOT = '<!--header--><!--/header-->'
FOOTER_SLOT = '<!--footer--><!--/footer-->'   # build-langs.py's chrome() puts the site footer here
def base_parts(lang='en'):
    base = ROOT if lang == 'en' else os.path.join(ROOT, 'dist', lang)
    s = rd(os.path.join(base, 'about.html'))
    s = re.sub(r'<!--a11y-head-->.*?<!--/a11y-head-->', '', s, flags=re.S)
    css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
    css = re.sub(r'\n\.lang \{.*', '', css)                      # (older pages: the language menu's styles)
    return css, HEADER_SLOT, FOOTER_SLOT

def learn_nav(current, S=None):
    """The Learn sub-menu. `current` is the page's path under learn/, e.g. 'topics/fractions.html'."""
    S = S or EN; w = S.w
    def a(href, label, extra=''):
        cur = ' aria-current="page"' if href == '/learn/' + current or (href.endswith('/') and href == '/learn/' + current.replace('index.html', '')) else ''
        return f'<a href="{href}"{cur}>{extra}{esc(label)}</a>'
    sec = current.split('/')[0] if '/' in current else ''
    topics = ''.join(a(f'/learn/topics/{s}.html', n, glyph(g, c, 26)) for s, n, g, c in S.topics)
    years = ''.join(a(f'/learn/years/{s}.html', n, '') .replace('</a>', f' <small>{esc(w["year_small"].format(age=age, us=us))}</small></a>') for s, n, age, us in S.years)
    det = lambda key, label, items, allhref, alllabel: (
        f'<details{" class=\"here\"" if sec == key else ""}><summary>{label}</summary><div class="drop">{items}'
        f'<a href="{allhref}"><b>{alllabel}</b></a></div></details>')
    sec_name = w['sections']
    return (f'<div class="wrap"><nav class="learnnav" aria-label="{esc(w["learn"])}">' + a('/learn/', w['learn_home']) +
            det('topics', esc(sec_name['topics']), topics, '/learn/topics/', esc(w['all_topics'])) +
            det('years', esc(sec_name['years']), years, '/learn/years/', esc(w['all_years'])) +
            ''.join(a(f'/learn/{k}/', sec_name[k]) for k in ('parents', 'teachers', 'worksheets', 'glossary')) +
            '</nav></div>')

# close the other dropdowns when one opens, and when tapping outside (works without it too)
NAV_JS = ("<script>document.addEventListener('click',function(e){document.querySelectorAll('.learnnav details[open]').forEach(function(d){"
          "if(!d.contains(e.target))d.removeAttribute('open');});});</script>")

# ---------- shortcodes ----------
def worksheets_manifest(S=None):
    p = os.path.join((S or EN).src, 'worksheets.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else []

def sheet_card(w, S=None):
    S = S or EN
    yrs = ', '.join(n for s, n, *_ in S.years if s in w['years'])
    url = f'/learn/worksheets/{w["id"]}.html'
    data = json.load(open(os.path.join(S.src, 'worksheets', w['id'] + '.json'), encoding='utf-8'))
    extra = ' · '.join(format_download(m, S) for m in worksheet_formats(data, S)[3:])
    return (f'<div class="sheet" data-years="{" ".join(w["years"])}"><a href="{url}"><img src="/assets/worksheets/{w["id"]}.webp" width="420" height="594" loading="lazy" '
            f'alt="{esc(S.w["sheet_alt"].format(title=w["title"]))}"></a><b><a href="{url}">{esc(w["title"])}</a></b><small>{esc(yrs)} · {esc(w["desc"])}</small>'
            f'<a class="dl" href="/assets/worksheets/{w["id"]}.pdf" download>{esc(S.w["download"])}</a>'
            f'<p class="sheet-formats"><a href="/assets/worksheets/{w["id"]}-large.pdf" download>{esc(S.w["large_print"])}</a> · '
            f'<a href="/assets/worksheets/{w["id"]}-easy-read.pdf" download>{esc(S.w["easy_read"])}</a></p><p class="sheet-formats">{extra}</p></div>')


def worksheet_pdfs(data, S):
    base = ROOT if S.en else S.src
    media = []
    for suffix, key in [('', 'standard_pdf'), ('-large', 'large_print'), ('-easy-read', 'easy_read')]:
        url = f'/assets/worksheets/{data["id"]}{suffix}.pdf'
        file = os.path.join(base, url.lstrip('/'))
        size = os.path.getsize(file) if os.path.isfile(file) else None
        media.append({'@type': 'MediaObject', 'name': S.w[key], 'encodingFormat': 'application/pdf',
                      'contentUrl': S.main + url, **({'contentSize': str(size) + ' B'} if size is not None else {})})
    return media


def worksheet_formats(data, S):
    media = worksheet_pdfs(data, S)
    choices = []
    if S.lang != 'ja':
        choices += [('.brf', 'brf', 'application/x-brf'), ('-braille.txt', 'brailleText', 'text/plain')]
    tactile = data.get('hasTactile', bool(data.get('chart')) or data['id'] == 'multiplication-grid'
                       or any('<svg' in it['q'] for it in data['items']))
    if tactile:
        choices.append(('-tactile.pdf', 'tactilePdf', 'application/pdf'))
    base = ROOT if S.en else S.src
    for suffix, key, mime in choices:
        url = f'/assets/worksheets/{data["id"]}{suffix}'
        file = os.path.join(base, url.lstrip('/'))
        size = os.path.getsize(file) if os.path.isfile(file) else None
        media.append({'@type':'MediaObject', 'name':S.bw[key], 'encodingFormat':mime,
                      'contentUrl':S.main + url, **({'contentSize':str(size)+' B'} if size is not None else {})})
    return media


def format_download(media, S):
    size = (S.w['pdf_kb'].format(size=max(1, (int(media['contentSize'].split()[0])+1023)//1024))
            if 'contentSize' in media else S.w['pdf_size_pending'])
    return f'<a href="{media["contentUrl"][len(S.main):]}" download>{esc(media["name"])}</a> <small>({esc(size)})</small>'


def license_line(S):
    return '<p class="worksheet-license">' + esc(S.bw['license']).replace('CC BY 4.0',
           f'<a href="{LICENSE}">CC BY 4.0</a>') + '</p>'



def worksheet_sources(S):
    pages = {}
    for sheet in worksheets_manifest(S):
        rel = f'worksheets/{sheet["id"]}.html'
        file = os.path.join(S.src, 'worksheets', sheet['id'] + '.json')
        if not os.path.isfile(file):
            raise ValueError(f'{file}: generate worksheet data with make-worksheets.mjs --lang {S.lang} --html-only first')
        data = json.load(open(file, encoding='utf-8'))
        topic = next(n for slug, n, *_ in S.topics if slug == data['topic'])
        downloads = []
        for media in worksheet_formats(data, S):
            downloads.append('<li>' + format_download(media, S) + '</li>')
        downloads.append(f'<li><a href="/learn/braille.html">{esc(S.bw["title"])}</a></li>')
        context = f'<div class="worksheet-chart">{data["chart"]}{data["chartTable"]}</div>' if data.get('chart') else ''
        body = (f'<div class="worksheet worksheet-{esc(data["kind"])}"><p class="worksheet-years">{esc(data["yearsLabel"])} · <a href="/learn/topics/{data["topic"]}.html">{esc(topic)}</a></p>'
                f'<h2>{esc(S.w["worksheet_downloads"])}</h2><ul class="worksheet-downloads">{"".join(downloads)}</ul>' +
                license_line(S) + f'<h2>{esc(S.w["worksheet_questions"])}</h2><p>{esc(data["how"])}</p>{context}'
                '<ol class="worksheet-questions" role="list">' + ''.join(
                    f'<li><span class="worksheet-number" aria-hidden="true">{i}</span><div class="worksheet-question">{it["q"]}</div></li>'
                    for i, it in enumerate(data['items'], 1)) + '</ol>'
                f'<div class="tip">{indie(56)}<div><b class="t">{esc(S.w["tip"])}</b><p>{esc(data["tip"])}</p></div></div>'
                f'<details class="worksheet-answers"><summary>{esc(S.w["show_answers"])}</summary><ol>' +
                ''.join(f'<li>{it["a"]}</li>' for it in data['items']) + '</ol></details></div>')
        pages[rel] = ({'title': data['title'], 'h1': data['title'], 'description': data['desc'],
                       'updated': '2026-10-12', 'layout': 'worksheet', '_worksheet': data}, body)
    return pages

def shortcodes(body, faq, S=None):
    S = S or EN; w = S.w
    body = re.sub(r'<tip>(.*?)</tip>', lambda m: f'<div class="tip">{indie(56)}<div><b class="t">{w["tip"]}</b>{para(m.group(1))}</div></div>', body, flags=re.S)
    body = re.sub(r'<indie>(.*?)</indie>', lambda m: f'<div class="say">{indie(92)}<div class="bubble">{m.group(1).strip()}</div></div>', body, flags=re.S)
    body = re.sub(r'<challenge q="(.*?)">(.*?)</challenge>', lambda m: (
        f'<details class="challenge"><summary>{indie(56, False)}<span class="q"><b>{w["challenge"]}</b>{m.group(1)} '
        f'<span class="show">{w["show"]}</span></span></summary><div class="ans">{para(m.group(2))}</div></details>'), body, flags=re.S)
    def qa(m):
        faq.append((m.group(1), m.group(2).strip()))
        return f'<div class="qa"><b>{m.group(1)}</b>{para(m.group(2))}</div>'
    body = re.sub(r'<qa q="(.*?)">(.*?)</qa>', qa, body, flags=re.S)
    def sheets(m):
        attrs = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        ws = worksheets_manifest(S)
        if 'ids' in attrs: ids = attrs['ids'].split(','); ws = sorted([w for w in ws if w['id'] in ids], key=lambda w: ids.index(w['id']))
        if 'topic' in attrs: ws = [w for w in ws if w['topic'] == attrs['topic']]
        if 'year' in attrs: ws = [w for w in ws if attrs['year'] in w['years']]
        return '<div class="sheets">' + ''.join(sheet_card(x, S) for x in ws) + '</div>' if ws else ''
    body = re.sub(r'<worksheets([^>]*)/>', sheets, body)
    body = re.sub(r'<card href="(.*?)" title="(.*?)"(?: glyph="(.*?)")?(?: colour="(.*?)")?>(.*?)</card>', lambda m: (
        f'<a class="card" href="{m.group(1)}">{glyph(m.group(3), m.group(4) or "lemon") if m.group(3) else ""}'
        f'<div><b>{m.group(2)}</b><span>{m.group(5).strip()}</span></div></a>'), body, flags=re.S)
    body = body.replace('<cards>', '<div class="cards">').replace('</cards>', '</div>')
    body = body.replace('<try/>', (
        f'<div class="trybox">{indie(96)}<div style="flex:1;min-width:220px"><p class="t">{w["try_title"]}</p>'
        f'<p>{w["try_text"]}</p><div class="go"><a class="btn honey" href="/play.html">{w["try_play"]}</a>'
        f'<a class="btn plain" href="/learn/worksheets/">{w["try_sheets"]}</a></div></div></div>'))
    return body

def para(s):
    s = s.strip()
    return s if s.startswith('<') else f'<p>{s}</p>'

# ---------- pages ----------
def front(src):
    m = re.match(r'---\n(.*?)\n---\n', src, re.S)
    if not m: raise SystemExit('missing front matter')
    meta = dict(l.split(': ', 1) for l in m.group(1).splitlines() if ': ' in l)
    return meta, src[m.end():]

PACK = 'pack.html'   # in learn-i18n/<code>/: that site's teachers.html (the puzzle pack), a Teachers page
def url_of(rel):
    if rel == PACK: return '/teachers.html'
    return '/learn/' + (rel[:-len('index.html')] if rel.endswith('index.html') else rel)

def crumbs_for(rel, meta, names, S=None):
    S = S or EN
    trail = [(S.w['home'], '/'), (S.w['learn'], '/learn/')]
    parts = ['teachers', PACK] if rel == PACK else rel.split('/')
    if len(parts) > 1 and parts[-1] != 'index.html':
        trail.append((names.get(parts[0] + '/index.html', S.w['sections'].get(parts[0], parts[0])), f'/learn/{parts[0]}/'))
    if rel != 'index.html': trail.append((meta.get('nav', meta['h1']), url_of(rel)))
    return trail

def alternates(rel, S):
    """hreflang links to the same page on the other sites: English, plus every live language that has a page at the
    same path (topics, guides and hubs share paths; school-year pages are each country's own, so they have none)."""
    sites = [EN] + [site_of(c) for c in sorted(LEARN_LIVE | ({S.lang} - {'en'}))]
    have = [x for x in sites if x.has(rel) or (x.en and rel == PACK)]   # (English's teachers.html is a root page)
    if len(have) < 2: return ''
    tag = lambda x: f'<link rel="alternate" hreflang="{x.w["html_lang"]}" href="{x.main}{url_of(rel)}">'
    return ('<!--learn-hreflang-->\n' + '\n'.join(tag(x) for x in have) +
            f'\n<link rel="alternate" hreflang="x-default" href="{MAIN}{url_of(rel)}">\n<!--/learn-hreflang-->\n')

def byline(meta, S):
    bits = []
    for field, role, word in [('author', 'author_role', 'by'), ('reviewer', 'reviewer_role', 'reviewed_by')]:
        if meta.get(field):
            name = meta[field] + (', ' + meta[role] if meta.get(role) else '')
            bits.append(S.w[word].format(name=name))
    for field, word in [('published', 'published_on'), ('reviewed', 'reviewed_on')]:
        if meta.get(field):
            bits.append(S.w[word].format(date=format_date(date.fromisoformat(meta[field]), today_words(S.lang))))
    return '<p class="byline">' + esc(' · '.join(bits)) + '</p>' if bits else ''


def report_error(rel, S):
    return f'<p class="report-error"><small><a href="/support.html?about={quote(url_of(rel), safe="")}">{esc(S.w["report_error"])}</a></small></p>'


def page(rel, meta, body, parts, names, S=None):
    S = S or EN
    css, nav, foot = parts
    url = S.main + url_of(rel)
    faq = []
    body = accessible_math(shortcodes(body, faq, S), S.lang)
    if '<epub/>' in body:
        file = os.path.join(ROOT if S.en else S.src, 'assets', f'beequation-worksheets-{S.lang}.epub')
        media = {'name':S.bw['epub'], 'contentUrl':S.main + f'/assets/beequation-worksheets-{S.lang}.epub',
                 **({'contentSize':str(os.path.getsize(file))+' B'} if os.path.isfile(file) else {})}
        body = body.replace('<epub/>', '<p>' + format_download(media,S) + '</p>')
    trail = crumbs_for(rel, meta, names, S)
    crumbs = ' › '.join(f'<a href="{h}">{esc(n)}</a>' for n, h in trail[1:-1]) + (f' › {esc(trail[-1][0])}' if len(trail) > 2 else '')
    ld = [{'@context': 'https://schema.org', '@type': 'CollectionPage' if meta.get('layout') == 'hub' else 'Article',
           **({'headline': meta['h1']} if meta.get('layout') != 'hub' else {'name': meta['h1']}),
           'description': meta['description'], 'url': url, 'inLanguage': S.w['html_lang'],
           **({'mainEntityOfPage': url, 'dateModified': meta.get('reviewed') or meta.get('updated', '2026-10-09'),
               **({'datePublished': meta['published']} if meta.get('published') else {}),
               'author': ({'@type': 'Person', 'name': meta['author'], **({'jobTitle': meta['author_role']} if meta.get('author_role') else {})} if meta.get('author') else {'@type': 'Organization', 'name': 'Beequation', 'url': MAIN + '/'}),
               'publisher': {'@id': MAIN + '/#org'}, 'image': MAIN + '/assets/og-image.png'} if meta.get('layout') != 'hub' else {})},
          {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
              {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': S.main + h} for i, (n, h) in enumerate(trail)]}]
    if meta.get('layout') == 'worksheet':
        data = meta['_worksheet']
        ld[0] = {'@context': 'https://schema.org', '@type': 'LearningResource', 'name': data['title'],
                 'description': data['desc'], 'url': url, 'inLanguage': S.w['html_lang'],
                 'educationalLevel': [n for slug, n, *_ in S.years if slug in data['years']],
                 'learningResourceType': 'Worksheet', 'isAccessibleForFree': True,
                 'encoding': worksheet_formats(data, S), 'license': LICENSE,
                 'accessibilityFeature': ['alternativeText', 'largePrint', 'highContrastDisplay', 'structuralNavigation'],
                 'accessMode': ['textual', 'visual'],
                 'accessModeSufficient': [{'@type': 'ItemList', 'itemListElement': ['textual']}]}
    if meta.get('layout') == 'braille':
        ld[0] = {'@context':'https://schema.org', '@type':'WebPage', 'name':meta['h1'],
                 'description':meta['description'], 'url':url, 'inLanguage':S.w['html_lang'],
                 'mainEntity': {'@type':'LearningResource', 'name':S.bw['epub'], 'license':LICENSE,
                                'inLanguage':S.w['html_lang'], 'isAccessibleForFree':True,
                                'encoding':{'@type':'MediaObject','encodingFormat':'application/epub+zip',
                                            'contentUrl':S.main + f'/assets/beequation-worksheets-{S.lang}.epub'}}}
    if rel == PACK:
        ld[0].update({'@type':'LearningResource', 'name':meta['h1'], 'license':LICENSE,
                      'isAccessibleForFree':True})
    if faq:
        strip = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
        ld.append({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': strip(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in faq]})
    lds = '\n'.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",", ":"))}</script>' for x in ld)
    hero = ''
    if meta.get('indie'):
        hero = f'<div class="say">{indie(110 if meta.get("layout") == "hub" else 92)}<div class="bubble">{meta["indie"]}</div></div>'
    kicker = f'<p class="kicker">{esc(meta["kicker"])}</p>' if meta.get('kicker') else ''
    t, d = esc(meta['title']), esc(meta['description'])
    return f'''<!doctype html>
<html lang="{S.w['html_lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{url}">
{alternates(rel, S)}<meta property="og:type" content="{'website' if meta.get('layout') == 'hub' else 'article'}">
<meta property="og:site_name" content="Beequation">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{MAIN}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
{lds}
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192.png">
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#12161F">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>{css}{LEARN_CSS}{WORKSHEET_CSS if meta.get("layout") == "worksheet" else ""}</style>
</head>
<body>
{nav}
<!--learnnav-->{learn_nav(rel, S)}<!--/learnnav-->
<main class="wrap"><article class="doc{' hub' if meta.get('layout') == 'hub' else ''}">{f'<p class="crumbs">{crumbs}</p>' if crumbs else ''}{kicker}<h1>{esc(meta['h1'])}</h1>
{byline(meta, S)}{hero}{body.strip()}{chr(10) + report_error(rel, S) if meta.get('layout') != 'hub' else ''}
</article></main>{foot}
{NAV_JS}
</body></html>
'''

def legacy(rel, nav_html):
    """Adds the Learn menu to the older hand-made articles."""
    p = os.path.join(OUT, rel); s = rd(p)
    s = re.sub(r'<!--learn-hreflang-->.*?<!--/learn-hreflang-->\n?', '', s, flags=re.S)
    s = re.sub(r'(<link rel="canonical"[^>]*>\n)', lambda m: m.group(1) + alternates(rel, EN), s, count=1)
    s = re.sub(r'\n?<!--learnnav-->.*?<!--/learnnav-->', '', s, flags=re.S)
    s = re.sub(r'\n?<script>document.addEventListener\(\'click\',function\(e\)\{document.querySelectorAll\(\'.learnnav.*?</script>', '', s, flags=re.S)
    s = s.replace('\n<main', '\n<!--learnnav-->' + nav_html + '<!--/learnnav-->\n<main', 1)   # just below the site header
    if '.learnnav {' not in s: s = s.replace('</style>', LEARN_CSS + '</style>', 1)
    s = s.replace('<!--/footer-->', '<!--/footer-->\n' + NAV_JS, 1) if '<!--/footer-->' in s else s.replace('</footer></div>', '</footer></div>\n' + NAV_JS, 1)
    if 'class="report-error"' not in s:
        s = s.replace('</article>', report_error(rel, EN) + '\n</article>', 1) if '</article>' in s else s.replace('</main>', report_error(rel, EN) + '\n</main>', 1)
    open(p, 'w', encoding='utf-8').write(s)

def sitemap(urls):
    p = os.path.join(ROOT, 'sitemap.xml'); s = rd(p)
    s = re.sub(r'  <url><loc>https://beequation\.com/learn/[^<]*</loc>.*?</url>\n', '', s)
    add = ''.join(f'  <url><loc>{MAIN}{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in urls)
    # All public assets PDFs are search resources (worksheets and the puzzle pack).
    s = re.sub(r'  <url><loc>https://beequation\.com/[^<]*\.pdf</loc>.*?</url>\n', '', s)
    from pathlib import Path
    add += ''.join(f'  <url><loc>{MAIN}/{p.relative_to(ROOT).as_posix()}</loc></url>\n'
                   for p in sorted(Path(ROOT, 'assets').rglob('*.pdf')))
    s = s.replace('</urlset>', add + '</urlset>')
    open(p, 'w', encoding='utf-8').write(s)

def llms(entries):
    """Lists every Learn page in llms.txt (the section after '## Learn' is rewritten on each build)."""
    p = os.path.join(ROOT, 'llms.txt'); s = rd(p).split('\n## Learn\n')[0].rstrip('\n')
    s += '\n\n## Learn\n\nFree primary maths guides and worksheets for parents and teachers (Reception to Year 6, National Curriculum in England).\n\n'
    s += ''.join(f'- [{t}]({MAIN}{u}): {d}\n' for u, t, d in entries)
    open(p, 'w', encoding='utf-8').write(s)

def sources(S):
    out = []
    for dp, _, fs in os.walk(S.src):
        for f in fs:
            if f.endswith('.html'): out.append(os.path.relpath(os.path.join(dp, f), S.src))
    return {**{rel: front(rd(os.path.join(S.src, rel))) for rel in sorted(out)}, **worksheet_sources(S)}

def missing_links(S, metas, extra=()):
    have = {url_of(r) for r in metas} | set(extra)
    missing = set()
    for rel in metas:
        p = os.path.join(S.out, rel) if rel != PACK else os.path.join(os.path.dirname(S.out), 'teachers.html')
        for h in re.findall(r'href="(/learn/[^"#]*)"', rd(p)):
            if h not in have: missing.add(h)
    return missing

def build_lang(lang):
    """Builds learn-i18n/<lang>/ into dist/<lang>/learn/ (and its pack page into dist/<lang>/teachers.html), without
    the site header: build-langs.py adds that. Returns the pages' paths under dist/<lang>/ and the sitemap entries."""
    S = site_of(lang)
    parts = base_parts(lang)
    metas = sources(S)
    names = {rel: m.get('nav', m['h1']) for rel, (m, _) in metas.items()}
    built, urls = [], []
    for rel, (meta, body) in metas.items():
        page_rel = 'teachers.html' if rel == PACK else 'learn/' + rel
        out = os.path.join(os.path.dirname(S.out), page_rel); os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(page(rel, meta, body, parts, names, S))
        built.append(page_rel); urls.append((url_of(rel), meta.get('reviewed') or meta.get('updated') or meta.get('published', '2026-10-09')))
    for h in sorted(missing_links(S, metas)): print(f'  {lang} learn: link to a page not written yet: {h}')
    return built, urls

def main():
    parts = base_parts()
    metas = sources(EN)
    names = {rel: m.get('nav', m['h1']) for rel, (m, _) in metas.items()}
    urls = []
    for rel, (meta, body) in metas.items():
        out = os.path.join(OUT, rel); os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(page(rel, meta, body, parts, names))
        urls.append((url_of(rel), meta.get('reviewed') or meta.get('updated') or meta.get('published', '2026-10-09')))
    old = [f for f in os.listdir(OUT) if f.endswith('.html') and f not in metas]
    for f in old:
        legacy(f, learn_nav(f)); urls.append((url_of(f), '2026-10-08'))
    sitemap(sorted(urls))
    llms([(url_of(rel), m['h1'], m['description']) for rel, (m, _) in sorted(metas.items(), key=lambda x: (x[0].count('/'), x[0] != 'index.html', x[0]))])
    # Keep the Blog catalogue when this builder rewrites the Learn llms section.
    import build_blog
    build_blog.english_catalog()
    missing = missing_links(EN, metas, {url_of(f) for f in old})   # links to Learn pages that don't exist yet
    print(f'{len(metas)} pages built, {len(old)} older articles given the menu')
    for h in sorted(missing): print('  not written yet:', h)

if __name__ == '__main__':
    main()
