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
    ---

Shortcodes in the body (all plain HTML otherwise):
    <tip>text</tip>                       Indie's tip, with Indie
    <indie>text</indie>                   Indie says something (bigger)
    <challenge q="question">answer</challenge>   Indie's challenge, answer hidden until tapped
    <qa q="question">answer</qa>          a quick-answer pair (also added to FAQPage structured data)
    <worksheets topic="fractions"/>       worksheet cards from learn-src/worksheets.json (also year="year-3" or ids="a,b")
    <cards>…<card href="/x" title="T" glyph="½" colour="pink">text</card>…</cards>   link cards
    <try/>                                the "practise with Indie" app box

Run from the repo root: python3 tools/build-learn.py   (then python3 tools/build-langs.py adds the flying bee).
The four older hand-made articles in learn/ are kept; they just get the Learn menu added.
"""
import html, json, os, re, sys

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

def esc(s): return html.escape(s, quote=True)
def rd(p): return open(p, encoding='utf-8').read()

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
.doc table { border-collapse: collapse; width: 100%; margin: 12px 0 18px; font-size: 16px; }
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

# ---------- page chrome taken from an existing page, so Learn matches the rest of the site ----------
def base_parts():
    s = rd(os.path.join(ROOT, 'about.html'))
    css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
    css = re.sub(r'\n\.lang \{.*', '', css)                      # build-langs.py re-adds the language-menu styles
    nav = re.search(r'<div class="wrap"><nav class="top".*?</nav></div>', s, re.S).group(0)
    nav = re.sub(r'<!--lang-menu-->.*?<!--/lang-menu-->', '', nav, flags=re.S)
    foot = re.search(r'<div class="wrap"><footer>.*?</footer></div>', s, re.S).group(0)
    return css, nav, foot

def learn_nav(current):
    """The Learn sub-menu. `current` is the page's path under learn/, e.g. 'topics/fractions.html'."""
    def a(href, label, extra=''):
        cur = ' aria-current="page"' if href == '/learn/' + current or (href.endswith('/') and href == '/learn/' + current.replace('index.html', '')) else ''
        return f'<a href="{href}"{cur}>{extra}{esc(label)}</a>'
    sec = current.split('/')[0] if '/' in current else ''
    topics = ''.join(a(f'/learn/topics/{s}.html', n, glyph(g, c, 26)) for s, n, g, c in TOPICS)
    years = ''.join(a(f'/learn/years/{s}.html', n, '') .replace('</a>', f' <small>age {age} · US {us}</small></a>') for s, n, age, us in YEARS)
    det = lambda key, label, items, allhref, alllabel: (
        f'<details{" class=\"here\"" if sec == key else ""}><summary>{label}</summary><div class="drop">{items}'
        f'<a href="{allhref}"><b>{alllabel}</b></a></div></details>')
    return ('<div class="wrap"><nav class="learnnav" aria-label="Learn">' + a('/learn/', 'Learn home') +
            det('topics', 'Topics', topics, '/learn/topics/', 'All topics →') +
            det('years', 'Year groups', years, '/learn/years/', 'All year groups →') +
            ''.join(a(f'/learn/{k}/', SECTIONS[k]) for k in ('parents', 'teachers', 'worksheets', 'glossary')) +
            '</nav></div>')

# close the other dropdowns when one opens, and when tapping outside (works without it too)
NAV_JS = ("<script>document.addEventListener('click',function(e){document.querySelectorAll('.learnnav details[open]').forEach(function(d){"
          "if(!d.contains(e.target))d.removeAttribute('open');});});</script>")

# ---------- shortcodes ----------
def worksheets_manifest():
    p = os.path.join(SRC, 'worksheets.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else []

def sheet_card(w):
    yrs = ', '.join(n for s, n, *_ in YEARS if s in w['years'])
    return (f'<div class="sheet" data-years="{" ".join(w["years"])}"><img src="/assets/worksheets/{w["id"]}.webp" width="420" height="594" loading="lazy" '
            f'alt="Preview of the {esc(w["title"])} worksheet"><b>{esc(w["title"])}</b><small>{esc(yrs)} · {esc(w["desc"])}</small>'
            f'<a class="dl" href="/assets/worksheets/{w["id"]}.pdf" download>Download PDF</a></div>')

def shortcodes(body, faq):
    body = re.sub(r'<tip>(.*?)</tip>', lambda m: f'<div class="tip">{indie(56)}<div><b class="t">Indie\'s tip</b>{para(m.group(1))}</div></div>', body, flags=re.S)
    body = re.sub(r'<indie>(.*?)</indie>', lambda m: f'<div class="say">{indie(92)}<div class="bubble">{m.group(1).strip()}</div></div>', body, flags=re.S)
    body = re.sub(r'<challenge q="(.*?)">(.*?)</challenge>', lambda m: (
        f'<details class="challenge"><summary>{indie(56, False)}<span class="q"><b>Indie\'s challenge</b>{m.group(1)} '
        f'<span class="show">Show the answer</span></span></summary><div class="ans">{para(m.group(2))}</div></details>'), body, flags=re.S)
    def qa(m):
        faq.append((m.group(1), m.group(2).strip()))
        return f'<div class="qa"><b>{m.group(1)}</b>{para(m.group(2))}</div>'
    body = re.sub(r'<qa q="(.*?)">(.*?)</qa>', qa, body, flags=re.S)
    def sheets(m):
        attrs = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
        ws = worksheets_manifest()
        if 'ids' in attrs: ids = attrs['ids'].split(','); ws = sorted([w for w in ws if w['id'] in ids], key=lambda w: ids.index(w['id']))
        if 'topic' in attrs: ws = [w for w in ws if w['topic'] == attrs['topic']]
        if 'year' in attrs: ws = [w for w in ws if attrs['year'] in w['years']]
        return '<div class="sheets">' + ''.join(sheet_card(w) for w in ws) + '</div>' if ws else ''
    body = re.sub(r'<worksheets([^>]*)/>', sheets, body)
    body = re.sub(r'<card href="(.*?)" title="(.*?)"(?: glyph="(.*?)")?(?: colour="(.*?)")?>(.*?)</card>', lambda m: (
        f'<a class="card" href="{m.group(1)}">{glyph(m.group(3), m.group(4) or "lemon") if m.group(3) else ""}'
        f'<div><b>{m.group(2)}</b><span>{m.group(5).strip()}</span></div></a>'), body, flags=re.S)
    body = body.replace('<cards>', '<div class="cards">').replace('</cards>', '</div>')
    body = body.replace('<try/>', (
        f'<div class="trybox">{indie(96)}<div style="flex:1;min-width:220px"><p class="t">Practise with Indie</p>'
        '<p>Beequation Kids turns number facts into honeycomb puzzles, with Indie giving a hint when a child is stuck. '
        'No ads and no data collected.</p><div class="go"><a class="btn honey" href="/play.html">Play free in your browser</a>'
        '<a class="btn plain" href="/learn/worksheets/">Free worksheets</a></div></div></div>'))
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

def url_of(rel): return '/learn/' + (rel[:-len('index.html')] if rel.endswith('index.html') else rel)

def crumbs_for(rel, meta, names):
    trail = [('Home', '/'), ('Learn', '/learn/')]
    parts = rel.split('/')
    if len(parts) > 1 and parts[-1] != 'index.html':
        trail.append((names.get(parts[0] + '/index.html', SECTIONS.get(parts[0], parts[0])), f'/learn/{parts[0]}/'))
    if rel != 'index.html': trail.append((meta.get('nav', meta['h1']), url_of(rel)))
    return trail

def page(rel, meta, body, parts, names):
    css, nav, foot = parts
    url = MAIN + url_of(rel)
    faq = []
    body = shortcodes(body, faq)
    trail = crumbs_for(rel, meta, names)
    crumbs = ' › '.join(f'<a href="{h}">{esc(n)}</a>' for n, h in trail[1:-1]) + (f' › {esc(trail[-1][0])}' if len(trail) > 2 else '')
    ld = [{'@context': 'https://schema.org', '@type': 'CollectionPage' if meta.get('layout') == 'hub' else 'Article',
           **({'headline': meta['h1']} if meta.get('layout') != 'hub' else {'name': meta['h1']}),
           'description': meta['description'], 'url': url, 'inLanguage': 'en-GB',
           **({'mainEntityOfPage': url, 'dateModified': meta.get('updated', '2026-10-09'),
               'author': {'@type': 'Organization', 'name': 'Beequation', 'url': MAIN + '/'},
               'publisher': {'@id': MAIN + '/#org'}, 'image': MAIN + '/assets/og-image.png'} if meta.get('layout') != 'hub' else {})},
          {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
              {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': MAIN + h} for i, (n, h) in enumerate(trail)]}]
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
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{'website' if meta.get('layout') == 'hub' else 'article'}">
<meta property="og:site_name" content="Beequation">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{MAIN}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
{lds}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#12161F">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>{css}{LEARN_CSS}</style>
</head>
<body>
{nav}
<!--learnnav-->{learn_nav(rel)}<!--/learnnav-->
<main class="wrap"><article class="doc{' hub' if meta.get('layout') == 'hub' else ''}">{f'<p class="crumbs">{crumbs}</p>' if crumbs else ''}{kicker}<h1>{esc(meta['h1'])}</h1>
{hero}{body.strip()}
</article></main>{foot}
{NAV_JS}
</body></html>
'''

def legacy(rel, nav_html):
    """Adds the Learn menu to the older hand-made articles."""
    p = os.path.join(OUT, rel); s = rd(p)
    s = re.sub(r'\n?<!--learnnav-->.*?<!--/learnnav-->', '', s, flags=re.S)
    s = re.sub(r'\n?<script>document.addEventListener\(\'click\',function\(e\)\{document.querySelectorAll\(\'.learnnav.*?</script>', '', s, flags=re.S)
    s = s.replace('</nav></div>\n<main', '</nav></div>\n<!--learnnav-->' + nav_html + '<!--/learnnav-->\n<main', 1)
    if '.learnnav {' not in s: s = s.replace('</style>', LEARN_CSS + '</style>', 1)
    s = s.replace('</footer></div>', '</footer></div>\n' + NAV_JS, 1)
    open(p, 'w', encoding='utf-8').write(s)

def sitemap(urls):
    p = os.path.join(ROOT, 'sitemap.xml'); s = rd(p)
    s = re.sub(r'  <url><loc>https://beequation\.com/learn/[^<]*</loc>.*?</url>\n', '', s)
    add = ''.join(f'  <url><loc>{MAIN}{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in urls)
    s = s.replace('</urlset>', add + '</urlset>')
    open(p, 'w', encoding='utf-8').write(s)

def llms(entries):
    """Lists every Learn page in llms.txt (the section after '## Learn' is rewritten on each build)."""
    p = os.path.join(ROOT, 'llms.txt'); s = rd(p).split('\n## Learn\n')[0].rstrip('\n')
    s += '\n\n## Learn\n\nFree primary maths guides and worksheets for parents and teachers (Reception to Year 6, National Curriculum in England).\n\n'
    s += ''.join(f'- [{t}]({MAIN}{u}): {d}\n' for u, t, d in entries)
    open(p, 'w', encoding='utf-8').write(s)

def main():
    parts = base_parts()
    sources = []
    for dp, _, fs in os.walk(SRC):
        for f in fs:
            if f.endswith('.html'): sources.append(os.path.relpath(os.path.join(dp, f), SRC))
    metas = {rel: front(rd(os.path.join(SRC, rel))) for rel in sorted(sources)}
    names = {rel: m.get('nav', m['h1']) for rel, (m, _) in metas.items()}
    urls = []
    for rel, (meta, body) in metas.items():
        out = os.path.join(OUT, rel); os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(page(rel, meta, body, parts, names))
        urls.append((url_of(rel), meta.get('updated', '2026-10-09')))
    old = [f for f in os.listdir(OUT) if f.endswith('.html') and f not in metas]
    for f in old:
        legacy(f, learn_nav(f)); urls.append((url_of(f), '2026-10-08'))
    sitemap(sorted(urls))
    llms([(url_of(rel), m['h1'], m['description']) for rel, (m, _) in sorted(metas.items(), key=lambda x: (x[0].count('/'), x[0] != 'index.html', x[0]))])
    # links to Learn pages that don't exist yet
    have = {url_of(r) for r in metas} | {url_of(f) for f in old}
    missing = set()
    for rel in metas:
        for h in re.findall(r'href="(/learn/[^"#]*)"', rd(os.path.join(OUT, rel))):
            if h not in have: missing.add(h)
    print(f'{len(metas)} pages built, {len(old)} older articles given the menu')
    for h in sorted(missing): print('  not written yet:', h)

if __name__ == '__main__':
    main()
