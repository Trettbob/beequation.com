#!/usr/bin/env python3
"""Builds the French, Spanish, German and Portuguese sites (fr./es./de./pt.beequation.com) from the English pages.

  python3 tools/build-langs.py            update the English pages' language menu, then build dist/<lang>/
  python3 tools/build-langs.py --check    only report text that has no translation yet

The English pages in this repo are the source. Translations live in i18n/<lang>.json as English -> translation
pairs: the page title, meta/alt/aria text, the inner HTML of each text block, text-only links and the homepage
demo's JavaScript strings. When English text changes, the build lists what needs translating and stops.
Each dist/<lang>/ folder is published to its own repo (Trettbob/<lang>.beequation.com) by tools/publish-langs.sh.
"""
import json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from i18n_segments import PAGES, segments, norm, BLOCK, SPAN, LINK, ATTR, TITLE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LANGS = {'en': 'English', 'fr': 'Français', 'es': 'Español', 'de': 'Deutsch', 'pt': 'Português'}
HTML_LANG = {'en': 'en-GB', 'fr': 'fr', 'es': 'es', 'de': 'de', 'pt': 'pt-BR'}
MAIN = 'https://beequation.com'
# Languages whose subdomain is live (DNS added and HTTPS working). The English site only offers, links to and
# switches to these; add a code here once its site loads over https, then rebuild and commit.
LIVE = set()
def site(lang): return MAIN if lang == 'en' else f'https://{lang}.beequation.com'
def url_path(page): return '/' if page == 'index.html' else '/' + page
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()

# ---------- the language menu, language links for search engines, and the first-visit language switch ----------
MENU_CSS = ('.lang { position: relative; } .lang summary { list-style: none; cursor: pointer; font-weight: 600; padding: 3px 10px; border-radius: 10px; '
            'box-shadow: inset 0 0 0 1.5px var(--line); } .lang summary::-webkit-details-marker { display: none; } '
            '.lang .langs { position: absolute; right: 0; top: calc(100% + 6px); background: var(--card); border-radius: 12px; '
            'box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 6px; display: grid; min-width: 150px; z-index: 20; } '
            '.lang .langs a { padding: 8px 12px; border-radius: 8px; } .lang .langs a:hover { background: var(--ground); } .lang .langs a[aria-current] { font-weight: 700; }')

def menu(lang, page, label):
    links = []
    for code, name in LANGS.items():
        if lang == 'en' and code not in LIVE and code != 'en': continue
        path = url_path(page) if page in PAGES else '/'
        href = site(code) + path + ('?lang=en' if code == 'en' and lang != 'en' else '')
        cur = ' aria-current="true"' if code == lang else ''
        links.append(f'<a href="{href}" lang="{code}" hreflang="{code}" data-lang="{code}"{cur}>{name}</a>')
    return (f'<!--lang-menu--><details class="lang"><summary aria-label="{label}">{lang.upper()}</summary>'
            f'<div class="langs">{"".join(links)}</div></details><!--/lang-menu-->')

def alternates(page, live_only=False):
    p = url_path(page)
    tags = [f'<link rel="alternate" hreflang="{HTML_LANG[c]}" href="{site(c)}{p}">' for c in LANGS if not live_only or c == 'en' or c in LIVE]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{MAIN}{p}">')
    return '<!--hreflang-->\n' + '\n'.join(tags) + '\n<!--/hreflang-->'

# English pages only: on a first visit, follow the browser's language if it's one of ours. A choice made in the
# menu is remembered in this browser (localStorage, never sent anywhere). Search engines get English plus the
# alternate links above, so nothing is hidden from them.
REDIRECT = """<!--lang-redirect--><script>(function(){try{var L=['fr','es','de','pt'],k='bq-lang',q=new URLSearchParams(location.search).get('lang');
if(q){localStorage.setItem(k,q);return;}var s=localStorage.getItem(k);if(s==='en')return;var pick=L.indexOf(s)>=0?s:null;
if(!pick){var ls=navigator.languages||[navigator.language||''];for(var i=0;i<ls.length;i++){var c=String(ls[i]).slice(0,2).toLowerCase();if(c==='en')return;if(L.indexOf(c)>=0){pick=c;break;}}}
if(pick)location.replace('https://'+pick+'.beequation.com'+location.pathname+location.hash);}catch(e){}})();</script><!--/lang-redirect-->"""
REMEMBER = """<!--lang-remember--><script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-lang]');if(a&&a.dataset.lang!=='en'){try{localStorage.setItem('bq-lang',a.dataset.lang);}catch(x){}}});</script><!--/lang-remember-->"""

# Indie the bee flies across the page now and then: first after 12-20 s, then every 1-2 minutes. Decoration only:
# hidden from screen readers, never in the way of clicks, off with Reduce Motion and while the tab is hidden.
BEE = """<!--bee--><script>(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var k='#1C1A4A',svg='<svg viewBox="0 0 160 140" width="76" height="66" aria-hidden="true" focusable="false">'
+'<ellipse class="w" cx="62" cy="38" rx="26" ry="20" fill="#DFF1FF" stroke="'+k+'" stroke-width="4" transform="rotate(-20 62 38)"/>'
+'<ellipse class="w" cx="96" cy="34" rx="24" ry="19" fill="#DFF1FF" stroke="'+k+'" stroke-width="4" transform="rotate(18 96 34)"/>'
+'<ellipse cx="80" cy="84" rx="52" ry="42" fill="#FFD84D" stroke="'+k+'" stroke-width="4"/>'
+'<path d="M60 46 Q55 84 62 122M84 42 Q78 84 86 126" fill="none" stroke="'+k+'" stroke-width="10" stroke-linecap="round"/>'
+'<circle cx="108" cy="76" r="7" fill="'+k+'"/><circle cx="110" cy="74" r="2.2" fill="#fff"/>'
+'<path d="M100 96 Q112 106 124 94M112 46 Q118 22 132 16" fill="none" stroke="'+k+'" stroke-width="4" stroke-linecap="round"/>'
+'<circle cx="124" cy="86" r="6" fill="#FFA8D2"/><circle cx="134" cy="15" r="6" fill="'+k+'"/>'
+'<path d="M28 88 L16 92 L28 96" fill="'+k+'" stroke="'+k+'" stroke-width="3" stroke-linejoin="round"/></svg>';
var st=document.createElement('style');st.textContent='.bq-bee{position:fixed;left:0;top:0;z-index:30;pointer-events:none;will-change:transform}'
+'.bq-bee .w{transform-box:fill-box;transform-origin:50% 100%;animation:bqflap .11s ease-in-out infinite alternate}@keyframes bqflap{to{transform:scaleY(.4)}}';
document.head.appendChild(st);
function later(ms){setTimeout(fly,ms!=null?ms:60000+Math.random()*60000);}
function fly(){if(document.hidden){document.addEventListener('visibilitychange',function v(){if(!document.hidden){document.removeEventListener('visibilitychange',v);later(4000+Math.random()*6000);}});return;}var el=document.createElement('div');el.className='bq-bee';el.setAttribute('aria-hidden','true');el.innerHTML=svg;document.body.appendChild(el);
var W=innerWidth,H=innerHeight,ltr=Math.random()<.5,y0=H*(.12+Math.random()*.55),amp=18+Math.random()*30,dur=6000+Math.random()*3000,t0=0;
function step(t){if(!t0)t0=t;var p=(t-t0)/dur;if(p>=1){el.remove();return later();}
var x=ltr?-90+(W+180)*p:W+90-(W+180)*p,y=y0+Math.sin(p*Math.PI*4)*amp,a=Math.cos(p*Math.PI*4)*8;
el.style.transform='translate('+x+'px,'+y+'px) rotate('+(ltr?a:-a)+'deg)'+(ltr?'':' scaleX(-1)');requestAnimationFrame(step);}
requestAnimationFrame(step);}
later(12000+Math.random()*8000);}catch(e){}})();</script><!--/bee-->"""

def strip_markers(s):
    for m in ('lang-menu', 'hreflang', 'lang-redirect', 'lang-remember', 'bee'):
        s = re.sub(rf'\n?<!--{m}-->.*?<!--/{m}-->', '', s, flags=re.S)
    return s

def chrome(src, lang, page, label='Language'):
    s = strip_markers(src)
    if '.lang summary' not in s:
        s = s.replace('</style>', MENU_CSS + '\n</style>', 1)
    offer = lang != 'en' or LIVE              # the English site shows languages only once one is live
    if offer:
        s = s.replace('</nav>', menu(lang, page, label) + '</nav>', 1)
    if page in PAGES and offer:
        s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + alternates(page, lang == 'en'), 1)
    s = s.replace('</body>', BEE + '\n</body>', 1)
    if lang == 'en':
        if page in PAGES and LIVE:
            s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + REDIRECT.replace("var L=['fr','es','de','pt']", 'var L=' + json.dumps(sorted(LIVE))), 1)
        if LIVE: s = s.replace('</body>', REMEMBER + '\n</body>', 1)
    return s

def update_english():
    pages = [p for p in os.listdir(ROOT) if p.endswith('.html')] + ['learn/' + p for p in os.listdir(os.path.join(ROOT, 'learn')) if p.endswith('.html')]
    for p in pages:
        s = rd(p)
        if '<nav class="top"' not in s: continue
        new = chrome(s, 'en', p)
        if new != s: open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(new)

# ---------- translating a page ----------
def translate(src, lang, page, T):
    missing = []
    def tr(text):
        k = norm(text)
        if k in T: return T[k]
        missing.append(k); return text
    head, body = strip_markers(src).split('</head>', 1)
    head = TITLE.sub(lambda m: f'<title>{tr(m.group(1))}</title>', head)
    keepnum = lambda v: re.fullmatch(r'[\d,./ −-]+', v) or re.match(r'^(width=|initial-scale|#|summary_large_image|website|article|Beequation$|https?:|light dark|noindex|\d)', v)
    head = ATTR.sub(lambda m: m.group(0) if keepnum(m.group(2)) else f'{m.group(1)}="{tr(m.group(2))}"', head)
    parts = re.split(r'(<script.*?</script>|<svg.*?</svg>)', body, flags=re.S)
    out = []
    for part in parts:
        if part.startswith('<script'):
            for k, v in T.get('__js__', {}).items(): part = part.replace(k, v)
            out.append(part); continue
        if part.startswith('<svg'):
            out.append(ATTR.sub(lambda m: m.group(0) if keepnum(m.group(2)) else f'{m.group(1)}="{tr(m.group(2))}"', part)); continue
        part = BLOCK.sub(lambda m: f'<{m.group(1)}{m.group(2) or ""}>{tr(m.group(3)) if re.search("[A-Za-z]", re.sub("<[^>]+>", "", m.group(3))) else m.group(3)}</{m.group(1)}>', part)
        part = SPAN.sub(lambda m: f'<{m.group(1)} {m.group(2)}>{tr(m.group(3))}</{m.group(1)}>', part)
        part = LINK.sub(lambda m: m.group(0) if (not re.search('[A-Za-z]', m.group(2)) or m.group(2).strip().startswith('@') or norm(m.group(2)) in ('Beequation', 'Instagram', 'TikTok', 'YouTube', 'X', 'Facebook')) else f'<a {m.group(1)}>{T[norm(m.group(2))]}</a>' if norm(m.group(2)) in T else m.group(0), part)  # links inside translated text are already done
        part = ATTR.sub(lambda m: m.group(0) if keepnum(m.group(2)) else f'{m.group(1)}="{tr(m.group(2))}"', part)
        out.append(part)
    return head + '</head>' + ''.join(out), missing

def localise(s, lang, page):
    s = re.sub(r'<html lang="[^"]*"', f'<html lang="{HTML_LANG[lang]}"', s, count=1)
    p = url_path(page)
    s = s.replace(f'<link rel="canonical" href="{MAIN}{p}">', f'<link rel="canonical" href="{site(lang)}{p}">')
    s = s.replace(f'<meta property="og:url" content="{MAIN}{p}">', f'<meta property="og:url" content="{site(lang)}{p}">')
    # English-only pages and files live on beequation.com
    s = re.sub(r'href="/(play\.html|teachers\.html|learn/[^"]*|assets/[^"]+\.pdf)"', rf'href="{MAIN}/\1"', s)
    s = re.sub(r'<a href="(?:https://beequation\.com)?/learn/">[^<]*</a>', '', s)   # Learn is English-only: not in the menu
    s = re.sub(r'<a href="(?:https://beequation\.com)?/teachers\.html">[^<]*</a>(?=<a href="/support\.html">)', '', s)
    s = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"HowTo".*?</script>\n?', '', s, flags=re.S)
    if page == 'support.html':
        import html as H
        qa = re.findall(r'<h2>(.*?)</h2><p>(.*?)</p>', s, re.S)
        strip = lambda x: H.unescape(re.sub(r'<[^>]+>', '', x)).strip()
        faq = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': HTML_LANG[lang], 'mainEntity': [{'@type': 'Question', 'name': strip(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in qa]}, ensure_ascii=False, separators=(',', ':'))
        s = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>', lambda m: f'<script type="application/ld+json">{faq}</script>', s, flags=re.S)
    return s

def build(check_only=False):
    problems = 0
    for lang in [l for l in LANGS if l != 'en']:
        T = json.load(open(os.path.join(ROOT, 'i18n', f'{lang}.json'), encoding='utf-8'))
        out = os.path.join(ROOT, 'dist', lang)
        if not check_only:
            shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
        for page in PAGES:
            html_out, missing = translate(rd(page), lang, page, T)
            for m in dict.fromkeys(missing): print(f'  {lang} {page}: no translation for: {m[:120]}'); problems += 1
            if check_only: continue
            html_out = chrome(localise(html_out, lang, page), lang, page, T.get('Language', 'Language'))
            open(os.path.join(out, page), 'w', encoding='utf-8').write(html_out)
        if check_only: continue
        shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(out, 'assets'), ignore=shutil.ignore_patterns('*.pdf'))
        shutil.copy(os.path.join(ROOT, 'favicon.ico'), out)
        open(os.path.join(out, 'CNAME'), 'w').write(f'{lang}.beequation.com\n')
        open(os.path.join(out, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\n\nSitemap: {site(lang)}/sitemap.xml\n')
        urls = ''.join(f'  <url><loc>{site(lang)}{url_path(p)}</loc></url>\n' for p in PAGES if p != '404.html')
        open(os.path.join(out, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
        open(os.path.join(out, 'README.md'), 'w').write(f'# {lang}.beequation.com\n\nBuilt from Trettbob/beequation.com by tools/build-langs.py. Do not edit here: change the English pages or i18n/{lang}.json there and rebuild.\n')
    return problems

if __name__ == '__main__':
    check = '--check' in sys.argv
    if not check: update_english()
    n = build(check)
    print(f'{n} untranslated piece(s)' if n else 'all translated')
    sys.exit(1 if n else 0)
