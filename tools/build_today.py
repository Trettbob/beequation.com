#!/usr/bin/env python3
"""Build daily puzzles locally, using the exact synced Daily Pro engine.

python3 tools/build_today.py [--date YYYY-MM-DD] [--lang en|fr|...|all]
Normal build-langs builds all sites, sharing one Node invocation for every date.
"""
import argparse
from datetime import date, datetime, timedelta
import html
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
from zoneinfo import ZoneInfo
from locale_output import locale_output

ROOT = Path(__file__).resolve().parents[1]
FIRST_DAY = date(2026, 10, 19)
PUBLISHED = date(2026, 10, 12)   # when /today/ first went live (Article datePublished)
LAUNCH = date(2026, 11, 1)
CODES = ('en', 'fr', 'es', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'tr', 'ja', 'ko', 'in', 'hi', 'id', 'vi', 'th', 'uk', 'ar')   # preview codes stay out of LIVE
# the page language where it isn't the code itself ('in' is Indian English)
LANGUAGE = {'en': 'en-GB', 'no': 'nb', 'pt': 'pt-BR', 'in': 'en-IN'}
CONTENT = ROOT.parent / 'growth/content'
NODE22 = Path('/Volumes/External SSD/Projects/devtools/node/bin/node')
ROWS = {4: [1, 2, 1], 5: [2, 1, 2], 7: [2, 3, 2], 9: [1, 2, 3, 2, 1], 12: [2, 3, 2, 3, 2]}
_CACHE = {}


def london_today():
    return datetime.now(ZoneInfo('Europe/London')).date()


def words(code):
    return json.loads((ROOT / 'i18n/today' / f'{code}.json').read_text(encoding='utf-8'))


def format_date(day, w):
    # Python integer formatting deliberately uses Western digits, including Arabic.
    return w['date_format'].format(day=day.day, month=w['months'][day.month - 1], year=day.year)


def format_month(day, w):
    return w['month_format'].format(month=w.get('archive_months', w['months'])[day.month - 1], year=day.year)


def month_after(day):
    return date(day.year + (day.month == 12), day.month % 12 + 1, 1)


def months_through(day):
    month = FIRST_DAY.replace(day=1)
    while month <= day.replace(day=1):
        yield month
        month = month_after(month)


def puzzle_data(day):
    """One engine process for today's cells, yesterday and all archived days."""
    if day not in _CACHE:
        start = min(FIRST_DAY, day - timedelta(days=1))
        dates = [(start + timedelta(days=i)).isoformat() for i in range((day - start).days + 1)]
        node = os.environ.get('BEEQUATION_NODE') or (str(NODE22) if NODE22.exists() else shutil.which('node'))
        if not node:
            raise RuntimeError('Node 22 is required (set BEEQUATION_NODE or PATH)')
        result = subprocess.run([node, str(ROOT / 'tools/today_data.mjs'), *dates], text=True, capture_output=True, check=True)
        _CACHE[day] = json.loads(result.stdout)
    return _CACHE[day]


def esc(value):
    return html.escape(str(value), quote=True)


def local_cells(p, w):
    return [s.replace('.', w['decimal_separator']) for s in p['cells']]


def board(cells, w, solution=None):
    """No solution metadata is available here for the current puzzle."""
    rows = ROWS[len(cells)]
    radius = 48
    width = math.sqrt(3) * radius
    W = max(rows) * width + 20
    H = ((len(rows) - 1) * 1.5 + 2) * radius + 20
    label = w['cells'].format(cells=', '.join(cells))
    if solution:
        label += '. ' + w['answer'].format(n=cells[solution['answer']])
        label += '. ' + w['pair'].format(a=cells[solution['pair'][0]], b=cells[solution['pair'][1]])
    svg = [f'<svg class="puzzle-board" viewBox="0 0 {W:.1f} {H:.1f}" role="img" aria-label="{esc(label)}">']
    i = 0
    for row, count in enumerate(rows):
        for col in range(count):
            x, y = W / 2 + (col - (count - 1) / 2) * width, 10 + radius + row * 1.5 * radius
            points = ' '.join(f'{x + radius * .95 * math.cos(k * math.pi / 3 - math.pi / 2):.1f},{y + radius * .95 * math.sin(k * math.pi / 3 - math.pi / 2):.1f}' for k in range(6))
            answer = solution and i == solution['answer']
            pair = solution and i in solution['pair']
            svg.append(f'<polygon points="{points}" fill="{"#FFB020" if answer else "#222938"}"' + (' stroke="#FFB020" stroke-width="3"' if pair else '') + '/>')
            svg.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" dominant-baseline="central" font-size="{24 if len(cells[i]) < 5 else 18}" fill="{"#12161F" if answer else "#F2F4F8"}">{esc(cells[i])}</text>')
            i += 1
    svg.append('</svg><ul class="sr-only">' + ''.join(f'<li>{esc(c)}</li>' for c in cells) + '</ul>')
    return ''.join(svg)


def fnv(text):
    """FNV-1a (32-bit, hex): the same function runs in the page, so taps are checked without the answer in the HTML."""
    h = 0x811c9dc5
    for ch in text.encode('utf-8'):
        h = ((h ^ ch) * 0x01000193) & 0xffffffff
    return f'{h:08x}'


def board_play(cells, w, day, answer):
    """Today's honeycomb as tappable cells. The page holds only a hash of (date, answer cell), never the answer."""
    rows = ROWS[len(cells)]
    radius = 48
    width = math.sqrt(3) * radius
    W = max(rows) * width + 20
    H = ((len(rows) - 1) * 1.5 + 2) * radius + 20
    key = fnv(f'{day.isoformat()}|{answer}|bq')
    svg = [f'<svg class="puzzle-board play-board" viewBox="0 0 {W:.1f} {H:.1f}" role="group" aria-label="{esc(w["cells"].format(cells=", ".join(cells)))}" data-d="{day.isoformat()}" data-k="{key}">']
    i = 0
    for row, count in enumerate(rows):
        for col in range(count):
            x, y = W / 2 + (col - (count - 1) / 2) * width, 10 + radius + row * 1.5 * radius
            points = ' '.join(f'{x + radius * .95 * math.cos(k * math.pi / 3 - math.pi / 2):.1f},{y + radius * .95 * math.sin(k * math.pi / 3 - math.pi / 2):.1f}' for k in range(6))
            svg.append(f'<g class="cell" role="button" tabindex="0" data-i="{i}" aria-label="{esc(cells[i])}"><polygon points="{points}"/>'
                       f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" dominant-baseline="central" font-size="{24 if len(cells[i]) < 5 else 18}">{esc(cells[i])}</text></g>')
            i += 1
    svg.append('</svg>')
    svg.append(f'<p class="play-msg" role="status" data-right="{esc(w["right"])}" data-wrong="{esc(w["wrong"])}"></p>')
    svg.append("""<script>(function(){var b=document.querySelector('.play-board');if(!b)return;var m=document.querySelector('.play-msg'),done=0;
function h(s){var x=0x811c9dc5,u=new TextEncoder().encode(s);for(var i=0;i<u.length;i++){x^=u[i];x=Math.imul(x,0x01000193)>>>0;}return ('0000000'+x.toString(16)).slice(-8);}
function tap(c){if(done)return;if(h(b.dataset.d+'|'+c.dataset.i+'|bq')===b.dataset.k){done=1;c.classList.add('yes');b.classList.add('done');m.textContent=m.dataset.right;m.className='play-msg yes';}
else{c.classList.remove('no');void c.getBBox();c.classList.add('no');m.textContent=m.dataset.wrong;m.className='play-msg no';}}
[].forEach.call(b.querySelectorAll('.cell'),function(c){c.addEventListener('click',function(){tap(c);});c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tap(c);}});});})();</script>""")
    return ''.join(svg)


def solved(day, p, w):
    cells = local_cells(p, w)
    a, b = (cells[i] for i in p['pair'])
    c = cells[p['answer']]
    equation = f'{a} {"+" if p["op"] == "add" else "×"} {b} = {c}'
    explanation = w['sum' if p['op'] == 'add' else 'product'].format(a=a, b=b, c=c, equation=equation)
    return (f'<section class="solved-puzzle"><h3><time datetime="{day}">{esc(format_date(day, w))}</time></h3>'
            + board(cells, w, p) + f'<p>{esc(w["answer"].format(n=c))}</p><p>{esc(explanation)}</p></section>')


CSS = '''
.today-content{max-width:960px;margin:24px auto;padding:0 20px}.today-puzzle,.solved-puzzle,.strategy-tip{padding:24px;border-radius:20px;margin:20px 0;background:var(--card)}
.play-board .cell{cursor:pointer;outline:none}.play-board .cell polygon{fill:#222938;transition:fill .15s}.play-board .cell text{fill:#F2F4F8;pointer-events:none}.play-board .cell:hover polygon,.play-board .cell:focus-visible polygon{fill:#2E3648}.play-board .cell:focus-visible polygon{stroke:#FFB020;stroke-width:3}.play-board .cell.yes polygon{fill:#FFB020}.play-board .cell.yes text{fill:#12161F}.play-board.done .cell{cursor:default}.play-board .cell.no{animation:tdno .35s}@keyframes tdno{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}.play-msg{min-height:1.5em;margin:0 0 14px;text-align:center;font-weight:700}.play-msg.yes{color:#FFB020}.play-msg.no{color:#F2F4F8}@media (prefers-reduced-motion:reduce){.play-board .cell.no{animation:none}}.today-puzzle{background:#12161F;color:#F2F4F8}.puzzle-board{display:block;max-width:360px;width:100%;margin:20px auto;background:#12161F;border-radius:16px;font-family:'Space Grotesk',sans-serif}
.archive-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.archive-grid .solved-puzzle{margin:0}.month-nav{display:flex;gap:24px;flex-wrap:wrap;margin:24px 0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:640px){.archive-grid{grid-template-columns:1fr}}
@media print{html,body{background:#fff!important;color:#000!important}#bqh,footer,.bq-ok,.skip,.month-nav,#bq-language-suggestion,.bq-fly,.bq-peek,.bq-pollen{display:none!important}.today-content{max-width:none;margin:0;padding:0}.archive-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8mm}.solved-puzzle{background:#fff!important;color:#000!important;break-inside:avoid;padding:3mm;box-shadow:none}.puzzle-board{max-width:58mm;margin:3mm auto;print-color-adjust:exact;-webkit-print-color-adjust:exact}.solved-puzzle h3,.solved-puzzle p{font-size:10pt;margin:2mm 0}h1{font-size:18pt}}
'''


def template(code, page, title, content, day, archive, chrome):
    # Borrow local CSS and footer; all active behaviour comes from the existing chrome.
    base = ROOT if code == 'en' else ROOT / 'dist' / code
    about = (base / 'about.html').read_text(encoding='utf-8')
    # chrome injects preference CSS before the page CSS; borrow the page style.
    about = re.sub(r'<!--a11y-head-->.*?<!--/a11y-head-->', '', about, flags=re.S)
    css = re.search(r'<style>(.*?)</style>', about, re.S).group(1)
    foot = '<!--footer--><!--/footer-->'   # chrome() fills it
    w = words(code)
    path = '/' + page.removesuffix('index.html')
    site = 'https://beequation.com' if code == 'en' else f'https://{code}.beequation.com'
    language = LANGUAGE.get(code, code)
    data = {'@context': 'https://schema.org', '@type': 'CollectionPage' if archive else 'Article',
            'name' if archive else 'headline': title, 'url': site + path, 'inLanguage': language}
    if not archive:
        data.update(datePublished=PUBLISHED.isoformat(), dateModified=day.isoformat(),
                    author={'@type': 'Organization', 'name': 'Beequation'}, publisher={'@id': 'https://beequation.com/#org'})
    trail = [(w['home'], '/'), (w['heading'], '/today/')]
    if archive: trail.append((title, path))
    breadcrumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i, 'name': name, 'item': site + link} for i, (name, link) in enumerate(trail, 1)]}
    ld = '\n'.join('<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False).replace('<', '\\u003c') + '</script>' for d in [data, breadcrumb])
    robots = '\n<meta name="robots" content="noindex">' if archive and '<div class="archive-grid"></div>' in content else ''
    s = f'''<!doctype html>
<html lang="{language}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | Beequation</title>
<meta name="description" content="{esc(w['instructions'])}">
<link rel="canonical" href="{site}{path}">{robots}
{ld}
<link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>{css}{CSS}</style></head><body>
<!--header--><!--/header-->
<main class="today-content"><h1>{esc(title)}</h1>{content}</main>{foot}
</body></html>
'''
    return chrome(s, code, page) if chrome else locale_output(s, code)


def build(code='en', day=None, *, output=None, data=None, decorate=True, chrome=None):
    day = day or london_today()
    w = words(code)
    data = data if data is not None else puzzle_data(day)
    output = Path(output) if output else ROOT if code == 'en' else ROOT / 'dist' / code
    if decorate and chrome is None:
        spec = importlib.util.spec_from_file_location('today_site_chrome', ROOT / 'tools/build-langs.py')
        module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
        chrome = module.chrome
    p = data[day.isoformat()]
    # Today's answer and pair never reach the HTML: the board gets only a hash of the answer cell (see board_play).
    current = {'cells': p['cells'], 'hive': p['hive']}
    prompt = w['prompt_sum'] if p['op'] == 'add' else w['prompt_product']
    label = w['hive'].format(n=current['hive']) if current['hive'] is not None else w['daily']
    content = (f'<section class="today-puzzle"><h2>{esc(label)}</h2><p><time datetime="{day}">{esc(format_date(day, w))}</time></p>'
               + f'<p>{esc(prompt)}</p>' + board_play(local_cells(current, w), w, day, p['answer'])
               + f'<a class="btn honey" href="/play.html?app=pro&amp;daily=1">{esc(w["play"])}</a></section>')
    yesterday = day - timedelta(days=1)
    content += f'<h2>{esc(w["yesterday"])}</h2>' + solved(yesterday, data[yesterday.isoformat()], w)
    tips_file = CONTENT / 'tips' / f'{code}.json'
    if tips_file.exists():
        tips = json.loads(tips_file.read_text(encoding='utf-8'))
        if tips:
            tip = tips[(day - FIRST_DAY).days % len(tips)]
            content += f'<aside class="strategy-tip"><h2>{esc(tip["title"])}</h2><p>{esc(tip["text"])}</p></aside>'
    months = list(months_through(day))
    if months:
        content += f'<nav class="month-nav"><a href="/today/{months[-1]:%Y-%m}/">{esc(w["archive"].format(month=format_month(months[-1], w)))}</a>'
        if len(months) > 1: content += f'<a href="/today/{months[-2]:%Y-%m}/">{esc(w["previous"])}</a>'
        content += '</nav>'
    pages = {'today/index.html': (w['heading'], content, False)}
    shown = {'today/index.html': day}
    for i, month in enumerate(months):
        title = w['archive'].format(month=format_month(month, w))
        nav = f'<nav class="month-nav"><a href="/today/">{esc(w["heading"])}</a>'
        if i > 0: nav += f'<a href="/today/{months[i-1]:%Y-%m}/">{esc(w["previous"])}</a>'
        if i + 1 < len(months): nav += f'<a href="/today/{months[i+1]:%Y-%m}/">{esc(w["next"])}</a>'
        nav += '</nav>'
        days = []
        d = max(month, FIRST_DAY)
        while d < month_after(month) and d < day:
            days.append(solved(d, data[d.isoformat()], w)); d += timedelta(days=1)
        body = nav + f'<p>{esc(w["print_hint"])}</p><div class="archive-grid">' + ''.join(days) + '</div>'
        if not days: body += f'<p>{esc(w["empty"].format(date=format_date(FIRST_DAY, w)))}</p>'
        pages[f'today/{month:%Y-%m}/index.html'] = (title, body, True)
        if days: shown[f'today/{month:%Y-%m}/index.html'] = min(month_after(month), day) - timedelta(days=1)
    for page, (title, body, archive) in pages.items():
        dest = output / page; dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(template(code, page, title, body, day, archive, chrome if decorate else None), encoding='utf-8')
    urls = [('/' + page.removesuffix('index.html'), shown[page].isoformat()) for page in pages if page in shown]
    native_output = ROOT if code == 'en' else ROOT / 'dist' / code
    sitemap = output / 'sitemap.xml'
    if output == native_output and sitemap.exists():
        host = 'https://beequation.com' if code == 'en' else f'https://{code}.beequation.com'
        s = re.sub(r'  <url><loc>' + re.escape(host) + r'/today/[^<]*</loc>.*?</url>\n', '', sitemap.read_text(encoding='utf-8'))
        entries = ''.join(f'  <url><loc>{host}{path}</loc><lastmod>{modified}</lastmod></url>\n' for path, modified in urls)
        sitemap.write_text(s.replace('</urlset>', entries + '</urlset>'), encoding='utf-8')
    return list(pages), urls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--date', type=date.fromisoformat, default=london_today())
    parser.add_argument('--lang', choices=(*CODES, 'all'), default='en')
    args = parser.parse_args()
    data = puzzle_data(args.date)
    for code in CODES if args.lang == 'all' else [args.lang]:
        pages, _ = build(code, args.date, data=data)
        print(f'{code}: {len(pages)} daily pages built for {args.date}')


if __name__ == '__main__':
    main()
