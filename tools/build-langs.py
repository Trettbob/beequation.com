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

# Indie (the Hexabee) flies across the page now and then: first after 12-20 s, then every 1-2 minutes. Visitors can
# catch Indie with the mouse or a finger (she wriggles and smiles); let go and she flies off the way she was flung.
# She says things in a speech bubble (SAY, per language) while flying, when caught and when let go.
# Decoration only: hidden from screen readers, off with Reduce Motion and while the tab is hidden.
BEE = """<!--bee--><script>(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var SAY=__SAY__,k='#1C1A4A',hx='M82 60 L66 86 L34 86 L18 60 L34 34 L66 34 Z',svg='<svg viewBox="8 9 80 80" width="72" height="72" aria-hidden="true" focusable="false">'
+'<defs><clipPath id="bqhb"><path d="'+hx+'"/></clipPath></defs>'
+'<ellipse class="w" cx="42" cy="28" rx="13" ry="10" fill="#DFF1FF" stroke="'+k+'" stroke-width="3" transform="rotate(-20 42 28)"/>'
+'<ellipse class="w" cx="60" cy="26" rx="12" ry="9.5" fill="#DFF1FF" stroke="'+k+'" stroke-width="3" transform="rotate(18 60 26)"/>'
+'<path d="'+hx+'" fill="#FFD84D"/><g clip-path="url(#bqhb)" fill="'+k+'"><rect x="35" y="30" width="7" height="60"/><rect x="50" y="30" width="7" height="60"/></g>'
+'<path d="'+hx+'" fill="none" stroke="'+k+'" stroke-width="3.5" stroke-linejoin="round"/>'
+'<g class="eo"><circle cx="68" cy="56" r="3.6" fill="'+k+'"/><circle cx="69" cy="55" r="1.1" fill="#fff"/></g>'
+'<path class="eh" d="M64.5 57 Q68 52 71.5 57" fill="none" stroke="'+k+'" stroke-width="2.6" stroke-linecap="round"/>'
+'<path d="M63 66 Q69 71 75 65M64 34 Q68 20 76 16" fill="none" stroke="'+k+'" stroke-width="2.6" stroke-linecap="round"/>'
+'<circle cx="76" cy="61" r="3" fill="#FFA8D2"/><circle cx="77" cy="15.5" r="3.2" fill="'+k+'"/>'
+'<path d="M18 57 L11 60 L18 63" fill="'+k+'" stroke="'+k+'" stroke-width="2" stroke-linejoin="round"/></svg>';
var st=document.createElement('style');st.textContent='.bq-bee{position:fixed;left:0;top:0;z-index:30;padding:14px;margin:-14px;cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;will-change:transform}'
+'.bq-bee .b{transform-origin:50% 50%}.bq-bee .say{position:absolute;left:62px;bottom:72px;padding:6px 11px;border-radius:14px;background:#fff;color:#1C1A4A;font:700 14px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.18);opacity:0;transform:scale(.6);transform-origin:0 100%;transition:opacity .2s,transform .2s;pointer-events:none}'
+'.bq-bee .say:after{content:"";position:absolute;left:10px;bottom:-6px;border:7px solid transparent;border-bottom:0;border-top-color:#fff}.bq-bee .say.on{opacity:1;transform:scale(1)}'
+'.bq-bee svg{display:block}.bq-bee .w{transform-box:fill-box;transform-origin:50% 100%;animation:bqflap .11s ease-in-out infinite alternate}@keyframes bqflap{to{transform:scaleY(.4)}}'
+'@media (prefers-color-scheme:dark){.bq-bee svg{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)}}'
+'.bq-bee .eh{display:none}.bq-bee.held{cursor:grabbing}.bq-bee.held .eh{display:inline}.bq-bee.held .eo{display:none}'
+'.bq-bee.held .b svg{animation:bqwig .09s ease-in-out infinite alternate}.bq-bee.held .w{animation-duration:.06s}@keyframes bqwig{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}';
document.head.appendChild(st);
function later(ms){setTimeout(fly,ms!=null?ms:60000+Math.random()*60000);}
function fly(){if(document.hidden){document.addEventListener('visibilitychange',function v(){if(!document.hidden){document.removeEventListener('visibilitychange',v);later(4000+Math.random()*6000);}});return;}
var el=document.createElement('div');el.className='bq-bee';el.setAttribute('aria-hidden','true');el.innerHTML='<div class="b">'+svg+'</div><div class="say"></div>';document.body.appendChild(el);
var body=el.firstChild,bub=el.lastChild,said=0;function say(list,ms){bub.textContent=list[Math.floor(Math.random()*list.length)];bub.classList.add('on');clearTimeout(said);if(ms)said=setTimeout(function(){bub.classList.remove('on');},ms);}
var W=innerWidth,H=innerHeight,ltr=Math.random()<.5,y0=H*(.12+Math.random()*.55),amp=18+Math.random()*30,dur=6000+Math.random()*3000;
var sp0=0,mode='cross',t0=0,last=0,x=ltr?-90:W+90,y=y0,face=ltr?1:-1,tilt=0,vx=0,vy=0,gx=0,gy=0,trail=[];
function draw(){el.style.transform='translate('+x+'px,'+y+'px)';body.style.transform='rotate('+(face*tilt)+'deg) scaleX('+face+')';}
function gone(){el.remove();later();}
function step(t){if(mode==='held')return;if(!t0)t0=t;if(!last)last=t;var dt=Math.min(50,t-last);last=t;
if(mode==='cross'){var p=(t-t0)/dur;if(p>=1)return gone();if(p>.12&&!sp0){sp0=1;say(SAY.fly,2600);}x=ltr?-90+(W+180)*p:W+90-(W+180)*p;y=y0+Math.sin(p*Math.PI*4)*amp;tilt=Math.cos(p*Math.PI*4)*8;}
else{vx*=1.03;vy*=1.03;x+=vx*dt;y+=vy*dt+Math.sin(t/90)*1.5;tilt=Math.max(-25,Math.min(25,vy*-20));
if(x<-140||x>innerWidth+140||y<-140||y>innerHeight+140)return gone();}
draw();requestAnimationFrame(step);}
el.addEventListener('pointerdown',function(e){if(mode==='away')return;e.preventDefault();mode='held';el.classList.add('held');try{el.setPointerCapture(e.pointerId);}catch(_){}
gx=e.clientX-x;gy=e.clientY-y;tilt=0;trail=[[e.clientX,e.clientY,e.timeStamp]];say(SAY.held);draw();});
el.addEventListener('pointermove',function(e){if(mode!=='held')return;var nx=e.clientX-gx;if(Math.abs(nx-x)>2)face=nx>x?1:-1;x=nx;y=e.clientY-gy;
trail.push([e.clientX,e.clientY,e.timeStamp]);if(trail.length>6)trail.shift();draw();});
function release(e){if(mode!=='held')return;el.classList.remove('held');mode='away';var a=trail[0],b=trail[trail.length-1],ms=Math.max(16,b[2]-a[2]);
vx=(b[0]-a[0])/ms;vy=(b[1]-a[1])/ms;var sp=Math.sqrt(vx*vx+vy*vy);
if(sp<.25||e.timeStamp-b[2]>120){vx=(Math.random()<.5?-1:1)*.35;vy=-.25;sp=.43;}
if(sp>1.6){vx*=1.6/sp;vy*=1.6/sp;}face=vx>=0?1:-1;say(SAY.free,1200);last=0;t0=1;requestAnimationFrame(step);}
el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
draw();requestAnimationFrame(step);}
later(12000+Math.random()*8000);}catch(e){}})();</script><!--/bee-->"""

# What Indie says in her speech bubble: while flying, when caught, and when let go.
SAY = {
  'en': {'fly': ["Catch me if you can!", "Hi! I'm Indie!", "Buzz buzz!", "Wheee!", "Maths is sweet!", "Can you spot the sum?", "7 + 3 = 10!"],
         'held': ["You caught me!", "Hee hee, that tickles!", "Good catch!", "Oh! Hello there!"], 'free': ["Bye!", "Wheee!", "See you soon!"]},
  'fr': {'fly': ["Attrape-moi si tu peux !", "Salut ! Je suis Indie !", "Bzz bzz !", "Youpi !", "Les maths, c'est trop bon !", "Tu vois la somme ?", "7 + 3 = 10 !"],
         'held': ["Tu m'as attrapée !", "Hi hi, ça chatouille !", "Bien joué !", "Oh ! Bonjour !"], 'free': ["Au revoir !", "Youpi !", "À bientôt !"]},
  'es': {'fly': ["¡Atrápame si puedes!", "¡Hola! ¡Soy Indie!", "¡Bzz bzz!", "¡Yupiii!", "¡Las mates son dulces!", "¿Ves la suma?", "¡7 + 3 = 10!"],
         'held': ["¡Me atrapaste!", "¡Ji, ji, me haces cosquillas!", "¡Buena captura!", "¡Oh! ¡Hola!"], 'free': ["¡Adiós!", "¡Yupiii!", "¡Hasta pronto!"]},
  'de': {'fly': ["Fang mich doch!", "Hallo! Ich bin Indie!", "Summ summ!", "Juhuuu!", "Mathe ist süß!", "Siehst du die Summe?", "7 + 3 = 10!"],
         'held': ["Du hast mich!", "Hihi, das kitzelt!", "Gut gefangen!", "Oh! Hallo!"], 'free': ["Tschüss!", "Juhuuu!", "Bis bald!"]},
  'pt': {'fly': ["Me pegue se puder!", "Oi! Eu sou a Indie!", "Bzz bzz!", "Uhuuu!", "Matemática é doce!", "Você vê a soma?", "7 + 3 = 10!"],
         'held': ["Você me pegou!", "Hihi, faz cócegas!", "Boa pegada!", "Oh! Olá!"], 'free': ["Tchau!", "Uhuuu!", "Até logo!"]},
}

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
    s = s.replace('</body>', BEE.replace('__SAY__', json.dumps(SAY[lang], ensure_ascii=False)) + '\n</body>', 1)
    if lang == 'en':
        if page in PAGES and LIVE:
            s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + REDIRECT.replace("var L=['fr','es','de','pt']", 'var L=' + json.dumps(sorted(LIVE))), 1)
        if LIVE: s = s.replace('</body>', REMEMBER + '\n</body>', 1)
    return s

def update_english():
    pages = [p for p in os.listdir(ROOT) if p.endswith('.html')]
    for dp, _, fs in os.walk(os.path.join(ROOT, 'learn')):   # the Learn section has sub-folders
        pages += [os.path.relpath(os.path.join(dp, f), ROOT) for f in fs if f.endswith('.html')]
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
