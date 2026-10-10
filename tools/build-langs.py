#!/usr/bin/env python3
"""Builds the translated sites (<lang>.beequation.com, one per i18n/<lang>.json) from the English pages.

  python3 tools/build-langs.py            update the English pages' header and language menu, then build dist/<lang>/
  python3 tools/build-langs.py --check    only report text (page text and the header's words) with no translation yet
  python3 tools/build-langs.py --lang ja  build only dist/ja/ (the English pages are still updated)
  python3 tools/build-langs.py --live     print the live language codes (LIVE below), for publish-langs.sh

The English pages in this repo are the source. Translations live in i18n/<lang>.json as English -> translation
pairs: the page title, meta/alt/aria text, the inner HTML of each text block, text-only links and the homepage
demo's JavaScript strings. When English text changes, the build lists what needs translating and stops.
Each dist/<lang>/ folder is published to its own repo (Trettbob/<lang>.beequation.com) by tools/publish-langs.sh.
"""
import html as H, importlib.util, json, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from i18n_segments import PAGES, segments, norm, BLOCK, SPAN, LINK, ATTR, TITLE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LANGS = {'en': 'English', 'fr': 'Français', 'es': 'Español', 'de': 'Deutsch', 'pt': 'Português',
         'it': 'Italiano', 'nl': 'Nederlands', 'pl': 'Polski', 'sv': 'Svenska', 'da': 'Dansk', 'no': 'Norsk', 'fi': 'Suomi',
         'tr': 'Türkçe', 'ja': '日本語', 'ko': '한국어'}
HTML_LANG = {'en': 'en-GB', 'fr': 'fr', 'es': 'es', 'de': 'de', 'pt': 'pt-BR', 'it': 'it', 'nl': 'nl', 'pl': 'pl', 'sv': 'sv',
             'da': 'da', 'no': 'nb', 'fi': 'fi', 'tr': 'tr', 'ja': 'ja', 'ko': 'ko'}   # the subdomain is the key; 'no' is Norwegian Bokmål
MAIN = 'https://beequation.com'
# Languages whose subdomain is live (DNS added and HTTPS working). Every site only offers, links to and switches to
# these (plus itself while it's being built); add a code here once its site loads over https, then rebuild and commit.
# A language is built into dist/<code>/ as soon as i18n/<code>.json exists, live or not.
LIVE = {'fr', 'es', 'de', 'pt', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'tr', 'ja', 'ko'}
def site(lang): return MAIN if lang == 'en' else f'https://{lang}.beequation.com'
def url_path(page): return '/' if page == 'index.html' else '/' + page
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()

# ---------- the language menu, language links for search engines, and the first-visit language switch ----------
# The language menu's styles before the header had its own (chrome() takes them out of older pages).
OLD_MENU_CSS = ('.lang { position: relative; } .lang summary { list-style: none; cursor: pointer; font-weight: 600; padding: 3px 10px; border-radius: 10px; '
            'box-shadow: inset 0 0 0 1.5px var(--line); } .lang summary::-webkit-details-marker { display: none; } '
            '.lang .langs { position: absolute; right: 0; top: calc(100% + 6px); background: var(--card); border-radius: 14px; '
            'box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 8px; display: grid; grid-template-columns: repeat(3, max-content); gap: 2px; z-index: 20; } '
            '.lang .langs a { padding: 8px 12px; border-radius: 8px; white-space: nowrap; } .lang .langs a:hover { background: var(--ground); } .lang .langs a[aria-current] { font-weight: 700; } '
            '@media (max-width: 640px) { .bq-links .lang .langs { position: static; box-shadow: none; background: var(--ground); margin-top: 8px; '
            'grid-template-columns: repeat(3, minmax(0, 1fr)); } .bq-links .lang .langs a { padding: 9px 8px; } }')
OLDER_MENU_CSS = '.lang { position: relative; } .lang summary { list-style: none; cursor: pointer; font-weight: 600; padding: 3px 10px; border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); } .lang summary::-webkit-details-marker { display: none; } .lang .langs { position: absolute; right: 0; top: calc(100% + 6px); background: var(--card); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 6px; display: grid; min-width: 150px; z-index: 20; } .lang .langs a { padding: 8px 12px; border-radius: 8px; } .lang .langs a:hover { background: var(--ground); } .lang .langs a[aria-current] { font-weight: 700; }'

def lang_links(lang, page):
    """One link per language (live ones, plus this site) for the header's language chip and the phone menu's language
    screen: a grid of 3 columns, so 15 languages don't make a long list."""
    links = []
    for code, name in LANGS.items():
        if code != 'en' and code not in LIVE and code != lang: continue
        path = url_path(page) if page in PAGES else '/'
        href = site(code) + path + ('?lang=en' if code == 'en' and lang != 'en' else '')
        cur = ' aria-current="true"' if code == lang else ''
        links.append(f'<a href="{href}" lang="{code}" hreflang="{code}" data-lang="{code}"{cur}>{name}</a>')
    return links

def alternates(page, lang='en'):
    p = url_path(page)
    tags = [f'<link rel="alternate" hreflang="{HTML_LANG[c]}" href="{site(c)}{p}">' for c in LANGS if c == 'en' or c in LIVE or c == lang]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{MAIN}{p}">')
    return '<!--hreflang-->\n' + '\n'.join(tags) + '\n<!--/hreflang-->'

# English pages only: on a first visit, follow the browser's language if it's one of ours. A choice made in the
# menu is remembered in this browser (localStorage, never sent anywhere). Search engines get English plus the
# alternate links above, so nothing is hidden from them. Norwegian browsers say nb or nn; that site is no.
REDIRECT = """<!--lang-redirect--><script>(function(){try{var L=['fr','es','de','pt'],k='bq-lang',q=new URLSearchParams(location.search).get('lang');
if(q){if(localStorage.getItem('bq-consent')!=='no')localStorage.setItem(k,q);return;}var s=localStorage.getItem(k);if(s==='en')return;var pick=L.indexOf(s)>=0?s:null;
if(!pick){var ls=navigator.languages||[navigator.language||''];for(var i=0;i<ls.length;i++){var c=String(ls[i]).slice(0,2).toLowerCase();if(c==='nb'||c==='nn')c='no';if(c==='en')return;if(L.indexOf(c)>=0){pick=c;break;}}}
if(pick)location.replace('https://'+pick+'.beequation.com'+location.pathname+location.hash);}catch(e){}})();</script><!--/lang-redirect-->"""
REMEMBER = """<!--lang-remember--><script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-lang]');if(a&&a.dataset.lang!=='en'){try{if(localStorage.getItem('bq-consent')!=='no')localStorage.setItem('bq-lang',a.dataset.lang);}catch(x){}}});</script><!--/lang-remember-->"""

# Indie (the Hexabee) and the header's honey take turns, one thing at a time, in a shuffled rotation that never
# repeats one straight away: a flight across the page, a pollen run, a pop-up and a honey drip. The first comes
# 10-16 s after the page opens, then there's a 20-35 s gap after each one ends (each kind comes round every 2 minutes
# or so). Flights: visitors can catch Indie with the mouse or a finger (she wriggles and smiles); let go and she flies
# off the way she was flung. She says things in a speech bubble (SAY, per language) while flying, when caught and when
# let go, and on about half her flights she does a loop-the-loop partway across. Pollen run: a sunflower grows at one
# bottom corner and a hive at the other; she collects pollen and flies it home (about 4.5 s). Pop-up: she pops up from
# behind something on the page (a card, heading or button) well below the sticky header, says hello and ducks back
# down. Honey drip: a bead of honey appears somewhere random under the header pill, runs a little way along its bottom
# edge (leaving a thin trail that fades), then swells, drips down a little and disappears (about 3 s). Nothing starts
# while the phone menu or a header panel is open (NAV_CSS also hides a pop-up or drip already showing when one opens).
# Each one is over within 5 s (WCAG 2.2.2). Decoration only: hidden from screen readers, off with Reduce Motion and
# while the tab is hidden.
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
+'<path d="M18 57 L11 60 L18 63" fill="'+k+'" stroke="'+k+'" stroke-width="2" stroke-linejoin="round"/>'
+'<g class="po"><circle cx="39" cy="84" r="3.6" fill="#FFB020" stroke="'+k+'" stroke-width="1"/><circle cx="57" cy="85" r="3.6" fill="#FFB020" stroke="'+k+'" stroke-width="1"/></g></svg>';
var flower='<svg viewBox="0 0 96 150" width="96" height="150" aria-hidden="true"><path d="M48 58 C46 90 50 120 48 150" fill="none" stroke="#3FA34D" stroke-width="6" stroke-linecap="round"/>'
+'<ellipse cx="34" cy="104" rx="15" ry="7" fill="#55C267" transform="rotate(-28 34 104)"/><ellipse cx="62" cy="122" rx="15" ry="7" fill="#55C267" transform="rotate(28 62 122)"/>'
+[0,30,60,90,120,150,180,210,240,270,300,330].map(function(a){return '<ellipse cx="48" cy="20" rx="7" ry="14" fill="#FFD84D" stroke="#E0B21A" stroke-width="1" transform="rotate('+a+' 48 40)"/>';}).join('')
+'<circle cx="48" cy="40" r="15" fill="#7A4A22"/><circle cx="43" cy="36" r="2" fill="#4E2C10"/><circle cx="52" cy="38" r="2" fill="#4E2C10"/><circle cx="47" cy="45" r="2" fill="#4E2C10"/></svg>',
hive='<svg viewBox="0 0 40 40" width="84" height="84" aria-hidden="true"><g stroke="#1C1A4A" stroke-width="1.6" stroke-linejoin="round"><path d="M20 5c-4 0-6.5 2.4-7.4 5h14.8C26.5 7.4 24 5 20 5z" fill="#FFD84D"/><path d="M11.4 10h17.2c1.6 1.4 2.5 3.1 2.6 5H8.8c.1-1.9 1-3.6 2.6-5z" fill="#FFB020"/><path d="M8.8 15h22.4c.9 1.6 1.4 3.3 1.4 5H7.4c0-1.7.5-3.4 1.4-5z" fill="#FFD84D"/><path d="M7.4 20h25.2c.1 1.8-.2 3.5-.9 5H8.3c-.7-1.5-1-3.2-.9-5z" fill="#FFB020"/><path d="M8.3 25h23.4c-.6 1.9-1.6 3.6-2.9 5H11.2c-1.3-1.4-2.3-3.1-2.9-5z" fill="#FFD84D"/><path d="M4 33.5h32" fill="none" stroke-linecap="round"/></g><path d="M17.2 30v-2.6a2.8 2.8 0 0 1 5.6 0V30z" fill="#1C1A4A"/></svg>';
var st=document.createElement('style');st.textContent='.bq-bee{position:fixed;left:0;top:0;z-index:30;padding:14px;margin:-14px;cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;will-change:transform}'
+'.bq-bee .b{transform-origin:50% 50%}.bq-bee .say,.bq-peek .say{position:absolute;left:62px;bottom:72px;padding:6px 11px;border-radius:14px;background:#fff;color:#1C1A4A;font:700 14px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.18);opacity:0;transform:scale(.6);transform-origin:0 100%;transition:opacity .2s,transform .2s;pointer-events:none}'
+'.bq-bee .say:after,.bq-peek .say:after{content:"";position:absolute;left:10px;bottom:-6px;border:7px solid transparent;border-bottom:0;border-top-color:#fff}.bq-bee .say.on,.bq-peek .say.on{opacity:1;transform:scale(1)}'
+'.bq-bee svg,.bq-peek svg{display:block}.bq-bee .w,.bq-peek .w{transform-box:fill-box;transform-origin:50% 100%;animation:bqflap .11s ease-in-out infinite alternate}@keyframes bqflap{to{transform:scaleY(.4)}}'
+'@media (prefers-color-scheme:dark){.bq-bee svg,.bq-peek svg{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)}}'
+'.bq-bee .eh{display:none}.bq-bee.held{cursor:grabbing}.bq-bee.held .eh{display:inline}.bq-bee.held .eo{display:none}'
+'.bq-bee.held .b svg{animation:bqwig .09s ease-in-out infinite alternate}.bq-bee.held .w{animation-duration:.06s}@keyframes bqwig{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}'
+'.bq-peek{position:fixed;z-index:29;width:72px}.bq-peek .clip{width:72px;height:62px;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent}'
+'.bq-peek .b{transform:translateY(74px);transition:transform .45s cubic-bezier(.3,1.45,.55,1)}.bq-peek.up .b{transform:translateY(8px)}.bq-peek.f .b svg{transform:scaleX(-1)}'
+'.bq-bee .po{display:none}.bq-bee.pollen .po{display:inline}.bq-scene{position:fixed;bottom:0;z-index:29;pointer-events:none;transform-origin:50% 100%;transform:scaleY(0);opacity:0;transition:transform .35s cubic-bezier(.3,1.4,.6,1),opacity .3s}.bq-scene.on{transform:none;opacity:1}.bq-scene svg{display:block}'
+'.bq-drop{position:fixed;z-index:31;pointer-events:none;font:700 24px/1 system-ui,sans-serif;color:#FFB020;text-shadow:0 0 2px #1C1A4A;animation:bqdrop .6s ease-out forwards}@keyframes bqdrop{from{transform:translateY(0) scale(.6);opacity:1}to{transform:translateY(-42px) scale(1.25);opacity:0}}'
+'@media (prefers-color-scheme:dark){.bq-scene svg{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)}}'
+'.bq-peek .say{left:50px;bottom:58px}.bq-peek.f .say{left:auto;right:50px}.bq-peek.f .say:after{left:auto;right:10px}'
+'.bq-drip{position:absolute;top:100%;width:0;height:0;pointer-events:none;animation:bqhrun var(--run) ease-in-out forwards}'
+'.bq-drip i{position:absolute;left:-10px;top:-4px;width:20px;height:30px;transform-origin:50% 0;animation:bqhdip 1.6s var(--run) both}.bq-drip svg{display:block;width:100%;height:100%}'
+'.bq-trail{position:absolute;top:100%;height:3px;margin-top:-2px;border-radius:2px;background:#FFB020;pointer-events:none;transform:scaleX(0);animation:bqhgrow var(--run) ease-in-out forwards,bqhfade 1.2s var(--run) forwards}'
+'@keyframes bqhrun{to{transform:translateX(var(--dx))}}@keyframes bqhgrow{to{transform:scaleX(1)}}@keyframes bqhfade{to{opacity:0}}'
+'@keyframes bqhdip{0%{transform:translateY(0) scale(.5,.4);opacity:1;animation-timing-function:ease-out}40%{transform:translateY(0) scale(.85,.8);animation-timing-function:ease-in-out}'
+'70%{transform:translateY(4px) scale(.75,1.25);opacity:1;animation-timing-function:ease-in}100%{transform:translateY(24px) scale(.6,.8);opacity:0}}';
document.head.appendChild(st);
var busy=0,prev='',bag=[],K=['fly','trip','peek','drip'];function next(ms){setTimeout(turn,ms!=null?ms:20000+Math.random()*15000);}function end(){if(!busy)return;busy=0;next();}
function deal(){var b=K.slice();for(var i=3;i>0;i--){var j=Math.floor(Math.random()*(i+1)),q=b[i];b[i]=b[j];b[j]=q;}if(b[0]===prev)b.push(b.shift());return b;}
function from(b,same){for(var i=0;i<b.length;i++)if((b[i]===prev)===same&&(b[i]==='peek'?peek():b[i]==='drip'?drip():fly(b[i]==='trip'))){prev=b.splice(i,1)[0];busy=1;return 1;}}
function turn(){if(document.hidden){document.addEventListener('visibilitychange',function v(){if(!document.hidden){document.removeEventListener('visibilitychange',v);next(4000+Math.random()*6000);}});return;}
if(busy||document.querySelector('.bqm-open,.bqh-panel:not([hidden])'))return next(6000);
if(!bag.length)bag=deal();if(from(bag,false))return;bag=deal();if(from(bag,false)||from(bag,true))return;next();}
function fly(trip){if(trip&&(innerWidth<360||innerHeight<420))return false;var el=document.createElement('div');el.className='bq-bee';el.setAttribute('aria-hidden','true');el.innerHTML='<div class="b">'+svg+'</div><div class="say"></div>';document.body.appendChild(el);
var body=el.firstChild,bub=el.lastChild,said=0;function say(list,ms){bub.textContent=list[Math.floor(Math.random()*list.length)];bub.classList.add('on');clearTimeout(said);if(ms)said=setTimeout(function(){bub.classList.remove('on');},ms);}
var W=innerWidth,H=innerHeight,ltr=Math.random()<.5,y0=H*(.12+Math.random()*.55),amp=18+Math.random()*30,dur=4000+Math.random()*700;
var sc=[],tp=null,sz=1,flip=!trip&&Math.random()<.5,fs=.25+Math.random()*.4,fd=900/dur,spin=0,sp1=0,sp0=0,mode='cross',t0=0,last=0,x=ltr?-90:W+90,y=y0,face=ltr?1:-1,tilt=0,vx=0,vy=0,gx=0,gy=0,trail=[];
function draw(){el.style.transform='translate('+x+'px,'+y+'px)';body.style.transform='rotate('+(face*(tilt-spin))+'deg) scaleX('+face+') scale('+sz+')';}
function part(cls,html,side,w){var d=document.createElement('div');d.className='bq-scene '+cls;d.setAttribute('aria-hidden','true');d.innerHTML=html;d.style[side]=Math.round(W*.05)+'px';d.style.width=w+'px';document.body.appendChild(d);sc.push(d);requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('on');});});return d;}
function unscene(){sc.forEach(function(d){d.classList.remove('on');setTimeout(function(){d.remove();},400);});sc=[];}
if(trip){var fl=Math.random()<.5;mode='trip';part('fl',flower,fl?'left':'right',96);part('hv',hive,fl?'right':'left',84);
var fx=fl?W*.05+48:W-W*.05-48,fy=H-150+40,hx=fl?W-W*.05-42:W*.05+42,hy=H-84+61;
tp={sx:fl?-60:W+60,sy:H*.35,fx:fx-36,fy:fy-46,hx:hx-36,hy:hy-36,cx:W/2-36,cy:Math.min(fy,hy)-H*.42};x=tp.sx;y=tp.sy;face=fl?1:-1;}
var raf=0,dead=0;function gone(){if(dead)return;dead=1;cancelAnimationFrame(raf);el.remove();unscene();end();}
function step(t){if(mode==='held')return;if(!t0)t0=t;if(!last)last=t;var dt=Math.min(50,t-last);last=t;
if(mode==='trip'){var ms=t-t0,io=function(q){q=Math.max(0,Math.min(1,q));return q<.5?2*q*q:1-Math.pow(2-2*q,2)/2;};tilt=0;spin=0;
if(ms<1150){var q=io(ms/1150);x=tp.sx+(tp.fx-tp.sx)*q;y=tp.sy+(tp.fy-tp.sy)*q+Math.sin(ms/160)*6;}
else if(ms<1850){x=tp.fx+Math.sin(ms/120)*3;y=tp.fy+Math.sin(ms/90)*4;tilt=Math.sin(ms/70)*6;if(!sp0){sp0=1;say(SAY.pollen,1200);}if(ms>1350)el.classList.add('pollen');}
else if(ms<3550){var u=io((ms-1850)/1700),a=1-u;x=a*a*tp.fx+2*a*u*tp.cx+u*u*tp.hx;y=a*a*tp.fy+2*a*u*tp.cy+u*u*tp.hy;var nf=tp.hx>tp.fx?1:-1;face=nf;tilt=-12*(1-2*u);if(ms>2900&&!sp1){sp1=1;say(SAY.home,900);}}
else if(ms<3950){var v=(ms-3550)/400;x=tp.hx;y=tp.hy+v*8;sz=1-.7*v;el.style.opacity=String(1-v);}
else{if(!tp.done){tp.done=1;el.style.opacity='0';var d=document.createElement('div');d.className='bq-drop';d.setAttribute('aria-hidden','true');d.textContent='✦';d.style.left=(tp.hx+26)+'px';d.style.top=(tp.hy+6)+'px';document.body.appendChild(d);setTimeout(function(){d.remove();},700);setTimeout(unscene,250);}
if(ms>4500)return gone();}}
else if(mode==='cross'){var p=(t-t0)/dur;if(p>=1)return gone();if(p>.12&&!sp0){sp0=1;say(SAY.fly,2600);}x=ltr?-90+(W+180)*p:W+90-(W+180)*p;y=y0+Math.sin(p*Math.PI*4)*amp;tilt=Math.cos(p*Math.PI*4)*8;spin=0;
if(flip&&p>fs&&p<fs+fd){var q=(p-fs)/fd,e=q<.5?2*q*q:1-Math.pow(2-2*q,2)/2,th=e*Math.PI*2;if(!sp1){sp1=1;say(SAY.flip,1400);}x+=face*30*Math.sin(th);y-=30*(1-Math.cos(th));spin=e*360;tilt=0;}}
else{vx*=1.03;vy*=1.03;x+=vx*dt;y+=vy*dt+Math.sin(t/90)*1.5;tilt=Math.max(-25,Math.min(25,vy*-20));
if(x<-140||x>innerWidth+140||y<-140||y>innerHeight+140)return gone();}
draw();raf=requestAnimationFrame(step);}
el.addEventListener('pointerdown',function(e){if(mode==='away'||(tp&&tp.done))return;e.preventDefault();if(mode==='trip'){unscene();sz=1;el.style.opacity='1';}mode='held';el.classList.add('held');try{el.setPointerCapture(e.pointerId);}catch(_){}
gx=e.clientX-x;gy=e.clientY-y;tilt=0;trail=[[e.clientX,e.clientY,e.timeStamp]];say(SAY.held);draw();});
el.addEventListener('pointermove',function(e){if(mode!=='held')return;var nx=e.clientX-gx;if(Math.abs(nx-x)>2)face=nx>x?1:-1;x=nx;y=e.clientY-gy;
trail.push([e.clientX,e.clientY,e.timeStamp]);if(trail.length>6)trail.shift();draw();});
function release(e){if(mode!=='held')return;el.classList.remove('held');mode='away';var a=trail[0],b=trail[trail.length-1],ms=Math.max(16,b[2]-a[2]);
vx=(b[0]-a[0])/ms;vy=(b[1]-a[1])/ms;var sp=Math.sqrt(vx*vx+vy*vy);
if(sp<.25||e.timeStamp-b[2]>120){vx=(Math.random()<.5?-1:1)*.35;vy=-.25;sp=.43;}
if(sp>1.6){vx*=1.6/sp;vy*=1.6/sp;}face=vx>=0?1:-1;say(SAY.free,1200);last=0;t0=1;cancelAnimationFrame(raf);raf=requestAnimationFrame(step);}
el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
draw();raf=requestAnimationFrame(step);return true;}
function peek(){var c=[].slice.call(document.querySelectorAll('.app,.card,.sheet,.trybox,.tip,.challenge,figure,table,.btn,h2,footer')).filter(function(e){var r=e.getBoundingClientRect();return r.width>120&&r.top>170&&r.top<innerHeight-80&&r.left>=0&&r.right<=innerWidth;});
if(!c.length)return false;var r=c[Math.floor(Math.random()*c.length)].getBoundingClientRect(),f=Math.random()<.5;
var w=document.createElement('div');w.className='bq-peek'+(f?' f':'');w.setAttribute('aria-hidden','true');w.style.left=(r.left+12+Math.random()*Math.max(0,r.width-96))+'px';w.style.top=(r.top-62)+'px';
w.innerHTML='<div class="clip"><div class="b">'+svg+'</div></div><div class="say"></div>';document.body.appendChild(w);var bub=w.lastChild,t1,t2,done=0;
function down(){if(done)return;done=1;clearTimeout(t1);clearTimeout(t2);bub.classList.remove('on');w.classList.remove('up');removeEventListener('scroll',moved);setTimeout(function(){w.remove();end();},500);}
function say(l){bub.textContent=l[Math.floor(Math.random()*l.length)];bub.classList.add('on');}
var sy=scrollY;function moved(){if(Math.abs(scrollY-sy)>40)down();}addEventListener('scroll',moved,{passive:true});w.firstChild.addEventListener('pointerdown',function(){say(SAY.boo);clearTimeout(t2);t2=setTimeout(down,700);});
setTimeout(function(){if(done)return;w.classList.add('up');t1=setTimeout(function(){say(SAY.peek);},450);t2=setTimeout(down,4300);},30);return true;}
var honey='<svg viewBox="0 0 16 24" aria-hidden="true" focusable="false"><path d="M8 0C8 6 15 11 15 16.5A7 7 0 0 1 1 16.5C1 11 8 6 8 0Z" fill="#FFB020" stroke="#C97F00" stroke-width="1"/><ellipse cx="5.2" cy="15.5" rx="1.6" ry="2.6" fill="#FFE7A8" opacity=".85"/></svg>';
function drip(){var p=document.querySelector('.bqh-pill');if(!p)return false;var w=p.clientWidth,r=Math.min(30,p.clientHeight/2)+12;if(w<2*r+60)return false;
var x=r+Math.random()*(w-2*r),dist=40+Math.random()*90,dx=Math.random()<.5?-dist:dist;if(x+dx<r||x+dx>w-r)dx=-dx;if(x+dx<r||x+dx>w-r)dx=0;
var run=900+Math.round(Math.abs(dx)*5),bits=[];function bit(cls,left,css){var e=document.createElement('span');e.className=cls;e.setAttribute('aria-hidden','true');e.style.left=left+'px';for(var c in css)e.style.setProperty(c,css[c]);p.appendChild(e);bits.push(e);return e;}
bit('bq-drip',x,{'--dx':dx+'px','--run':run+'ms'}).innerHTML='<i>'+honey+'</i>';
if(dx)bit('bq-trail',dx>0?x:x+dx,{'width':Math.abs(dx)+'px','--run':run+'ms','transform-origin':dx>0?'0 50%':'100% 50%'});
setTimeout(function(){bits.forEach(function(e){e.remove();});end();},run+1700);return true;}
next(10000+Math.random()*6000);}catch(e){}})();</script><!--/bee-->"""

# What Indie says in her speech bubble: while flying, when caught, and when let go.
SAY = {
  'en': {'fly': ["Catch me if you can!", "Hi! I'm Indie!", "Buzz buzz!", "Wheee!", "Maths is sweet!", "Can you spot the sum?", "7 + 3 = 10!"],
         'held': ["You caught me!", "Hee hee, that tickles!", "Good catch!", "Oh! Hello there!"], 'flip': ["Wheee!", "Loop the loop!", "Woo-hoo!"], 'peek': ["Peekaboo!", "Psst! Over here!", "Hello down there!", "Spot the sum!"], 'boo': ["Boo!", "Eek! Found me!"], 'pollen': ["Mmm, pollen!", "Sunflower snack!", "Yum!"], 'home': ["Home sweet hive!", "Honey time!"], 'free': ["Bye!", "Wheee!", "See you soon!"]},
  'fr': {'fly': ["Attrape-moi si tu peux !", "Salut ! Je suis Indie !", "Bzz bzz !", "Youpi !", "Les maths, c'est trop bon !", "Tu vois la somme ?", "7 + 3 = 10 !"],
         'held': ["Tu m'as attrapée !", "Hi hi, ça chatouille !", "Bien joué !", "Oh ! Bonjour !"], 'flip': ["Youpi !", "Looping !", "Hourra !"], 'peek': ["Coucou !", "Psst ! Par ici !", "Bonjour là-dessous !", "Trouve la somme !"], 'boo': ["Bouh !", "Oh ! Trouvée !"], 'pollen': ["Miam, du pollen !", "Un tournesol !", "Miam !"], 'home': ["Ma ruche !", "L’heure du miel !"], 'free': ["Au revoir !", "Youpi !", "À bientôt !"]},
  'es': {'fly': ["¡Atrápame si puedes!", "¡Hola! ¡Soy Indie!", "¡Bzz bzz!", "¡Yupiii!", "¡Las mates son dulces!", "¿Ves la suma?", "¡7 + 3 = 10!"],
         'held': ["¡Me atrapaste!", "¡Ji, ji, me haces cosquillas!", "¡Buena captura!", "¡Oh! ¡Hola!"], 'flip': ["¡Yupiii!", "¡Una voltereta!", "¡Hurra!"], 'peek': ["¡Cucú!", "¡Psst! ¡Aquí!", "¡Hola ahí abajo!", "¡Busca la suma!"], 'boo': ["¡Bu!", "¡Ay! ¡Me encontraste!"], 'pollen': ["¡Mmm, polen!", "¡Un girasol!", "¡Ñam!"], 'home': ["¡Hogar, dulce colmena!", "¡Hora de la miel!"], 'free': ["¡Adiós!", "¡Yupiii!", "¡Hasta pronto!"]},
  'de': {'fly': ["Fang mich doch!", "Hallo! Ich bin Indie!", "Summ summ!", "Juhuuu!", "Mathe ist süß!", "Siehst du die Summe?", "7 + 3 = 10!"],
         'held': ["Du hast mich!", "Hihi, das kitzelt!", "Gut gefangen!", "Oh! Hallo!"], 'flip': ["Juhuuu!", "Looping!", "Hurra!"], 'peek': ["Kuckuck!", "Psst! Hier drüben!", "Hallo da unten!", "Finde die Summe!"], 'boo': ["Buh!", "Huch! Entdeckt!"], 'pollen': ["Mmm, Pollen!", "Eine Sonnenblume!", "Lecker!"], 'home': ["Ab in den Stock!", "Honigzeit!"], 'free': ["Tschüss!", "Juhuuu!", "Bis bald!"]},
  'pt': {'fly': ["Me pegue se puder!", "Oi! Eu sou a Indie!", "Bzz bzz!", "Uhuuu!", "Matemática é doce!", "Você vê a soma?", "7 + 3 = 10!"],
         'held': ["Você me pegou!", "Hihi, faz cócegas!", "Boa pegada!", "Oh! Olá!"], 'flip': ["Uhuuu!", "Cambalhota!", "Oba!"], 'peek': ["Achou!", "Psiu! Aqui!", "Olá aí embaixo!", "Ache a soma!"], 'boo': ["Bu!", "Ai! Você me achou!"], 'pollen': ["Hum, pólen!", "Um girassol!", "Delícia!"], 'home': ["Lar, doce colmeia!", "Hora do mel!"], 'free': ["Tchau!", "Uhuuu!", "Até logo!"]},
}

# The contact address never appears in the HTML (spam bots scrape pages). Links look like
# <a class="em" href="/support.html" data-e="..."> where data-e is the address reversed, then base64; this turns
# them into a mailto link showing the address in the visitor's browser.
EMAIL = """<!--em--><script>document.querySelectorAll('a.em[data-e]').forEach(function(a){try{var e=atob(a.dataset.e).split('').reverse().join('');a.href='mailto:'+e;a.textContent=e;}catch(x){}});</script><!--/em-->"""

# Indie's cookie notice. The site sets no cookies; the only things kept (in the visitor's browser, never sent
# anywhere) are browser-game progress (beequation.kids.v1, beequation.adult.v1), the language choice (bq-lang) and
# this choice itself (bq-consent). "Don't remember anything" deletes those and stops them being saved (play.html and
# the language scripts check bq-consent). The privacy page has a button (data-bq-consent) to show the notice again.
CONSENT_TEXT = {
  'en': ["Indie's note about cookies", "Good news: this site doesn't use cookies, ads or tracking (the only cookies here are the ones I dream about). If you play the free game or pick a language, your browser can remember that on this device. Nothing is ever sent to us.", "Sounds good!", "Don't remember anything", "Privacy policy"],
  'fr': ["Le petit mot d'Indie sur les cookies", "Bonne nouvelle : ce site n'utilise ni cookies, ni publicité, ni pistage (les seuls cookies ici sont ceux dont je rêve). Si vous jouez au jeu gratuit ou choisissez une langue, votre navigateur peut s'en souvenir sur cet appareil. Rien ne nous est jamais envoyé.", "Très bien !", "Ne rien mémoriser", "Politique de confidentialité"],
  'es': ["La nota de Indie sobre las cookies", "Buenas noticias: este sitio no usa cookies, anuncios ni rastreo (las únicas galletas aquí son las que yo sueño). Si juegas al juego gratis o eliges un idioma, tu navegador puede recordarlo en este dispositivo. Nunca se nos envía nada.", "¡Perfecto!", "No recordar nada", "Política de privacidad"],
  'de': ["Indies Hinweis zu Cookies", "Gute Nachricht: Diese Website verwendet keine Cookies, keine Werbung und kein Tracking (die einzigen Kekse hier sind die, von denen ich träume). Wenn Sie das kostenlose Spiel spielen oder eine Sprache wählen, kann sich Ihr Browser das auf diesem Gerät merken. Es wird nie etwas an uns gesendet.", "Alles klar!", "Nichts speichern", "Datenschutzerklärung"],
  'pt': ["O recado da Indie sobre cookies", "Boa notícia: este site não usa cookies, anúncios nem rastreamento (os únicos biscoitos aqui são os dos meus sonhos). Se você jogar o jogo grátis ou escolher um idioma, seu navegador pode lembrar disso neste aparelho. Nada é enviado para nós.", "Tudo bem!", "Não lembrar nada", "Política de privacidade"],
}
CONSENT = """<!--consent--><script>(function(){var T=__CT__,ls;try{ls=window.localStorage;ls.getItem('x');}catch(e){return;}
var st=document.createElement('style');st.textContent='.bq-ok{position:fixed;left:16px;bottom:16px;z-index:40;max-width:440px;display:flex;gap:12px;align-items:flex-end;background:#fff;color:#1C1A4A;border-radius:22px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.28);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;animation:bqok .5s cubic-bezier(.3,1.4,.6,1)}'
+'.bq-ok h2{font:700 17px/1.2 Fredoka,system-ui,sans-serif;margin:0 0 4px;color:#1C1A4A}.bq-ok p{margin:0 0 10px}.bq-ok a{color:#3B24A8}'
+'.bq-ok .go{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.bq-ok button{font:700 15px/1 inherit;font-family:inherit;border:0;border-radius:12px;padding:11px 14px;cursor:pointer}'
+'.bq-ok .y{background:#FFB020;color:#12161F}.bq-ok .n{background:#EEE9FF;color:#3B24A8}.bq-ok button:focus-visible,.bq-ok a:focus-visible{outline:3px solid #6A4BF5;outline-offset:2px}'
+'.bq-ok svg{flex:none;animation:bqwave 1.6s ease-in-out .5s 2}@keyframes bqok{from{transform:translateY(120%)}}@keyframes bqwave{50%{transform:rotate(-10deg) translateY(-4px)}}'
+'@media (max-width:520px){.bq-ok{left:10px;right:10px;bottom:10px;max-width:none}}@media (prefers-reduced-motion:reduce){.bq-ok,.bq-ok svg{animation:none}}';
document.head.appendChild(st);
var k='#1C1A4A',hx='M82 60 L66 86 L34 86 L18 60 L34 34 L66 34 Z',bee='<svg viewBox="8 9 80 80" width="64" height="64" aria-hidden="true" focusable="false"><ellipse cx="42" cy="28" rx="13" ry="10" fill="#DFF1FF" stroke="'+k+'" stroke-width="3" transform="rotate(-20 42 28)"/><ellipse cx="60" cy="26" rx="12" ry="9.5" fill="#DFF1FF" stroke="'+k+'" stroke-width="3" transform="rotate(18 60 26)"/><path d="'+hx+'" fill="#FFD84D"/><rect x="35" y="34" width="7" height="52" fill="'+k+'"/><rect x="50" y="34" width="7" height="52" fill="'+k+'"/><path d="'+hx+'" fill="none" stroke="'+k+'" stroke-width="3.5" stroke-linejoin="round"/><path d="M64.5 57 Q68 52 71.5 57M62 65 Q69 74 76 64M64 34 Q68 20 76 16" fill="none" stroke="'+k+'" stroke-width="2.6" stroke-linecap="round"/><circle cx="76" cy="61" r="3" fill="#FFA8D2"/><circle cx="77" cy="15.5" r="3.2" fill="'+k+'"/><path d="M18 57 L11 60 L18 63" fill="'+k+'" stroke="'+k+'" stroke-width="2" stroke-linejoin="round"/></svg>';
function show(){if(document.querySelector('.bq-ok'))return;var d=document.createElement('section');d.className='bq-ok';d.setAttribute('role','region');d.setAttribute('aria-labelledby','bq-ok-h');
d.innerHTML=bee+'<div><h2 id="bq-ok-h"></h2><p></p><div class="go"><button type="button" class="y"></button><button type="button" class="n"></button><a href="/privacy.html"></a></div></div>';
var q=function(s){return d.querySelector(s);};q('h2').textContent=T[0];q('p').textContent=T[1];q('.y').textContent=T[2];q('.n').textContent=T[3];q('a').textContent=T[4];
function pick(v){try{if(v==='no'){['beequation.kids.v1','beequation.adult.v1','bq-lang'].forEach(function(x){ls.removeItem(x);});}ls.setItem('bq-consent',v);}catch(e){}d.remove();}
q('.y').addEventListener('click',function(){pick('yes');});q('.n').addEventListener('click',function(){pick('no');});document.body.appendChild(d);}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-bq-consent]')){try{ls.removeItem('bq-consent');}catch(x){}show();}});
if(!ls.getItem('bq-consent'))show();})();</script><!--/consent-->"""

# ---------- the site header ----------
# One floating "pill" header for every page (the English pages, every Learn page and each language site), made by
# header() from one model, so a rebuild replaces it cleanly: <!--header--> in the page, <!--nav-css--> before </head>
# and <!--nav--> before </body>. Wide screens (1000px and up): the logo; Apps and Learn, buttons that open a mega panel
# (click, Enter or Space, or a mouse hover with a short delay); Teachers and Support; the language chip; "Play free".
# Learn's panel has its own sub-menu: a rail of sections (topics, year groups, parents, teachers, worksheets, glossary)
# that each show their pages. Narrower screens: the logo and the beehive button, which opens a full-screen menu whose
# rows slide to sub-screens (Learn has two levels). Without JavaScript the top items are plain links (/#apps, /learn/)
# that wrap onto a second row. Learn and the teachers page are English-only, so the language sites leave them out.
MENU_LABEL = {'en': 'Menu', 'fr': 'Menu', 'es': 'Menú', 'de': 'Menü', 'pt': 'Menu'}
SKIP_LABEL = {'en': 'Skip to content', 'fr': 'Aller au contenu', 'es': 'Saltar al contenido', 'de': 'Zum Inhalt springen', 'pt': 'Pular para o conteúdo'}
SKIP = '<!--skip--><a class="skip" href="#main">__SKIP__</a><style>.skip{position:absolute;left:12px;top:-60px;z-index:50;background:#FFB020;color:#12161F;font-weight:700;padding:10px 16px;border-radius:12px;text-decoration:none}.skip:focus{top:12px}</style><!--/skip-->'
HEADER_SLOT = '<!--header--><!--/header-->'   # where the header goes; strip_markers() leaves this behind

# The header's words on every site. Other languages: i18n/<lang>.json "__site__" -> "nav" (--check lists gaps).
NAV_TEXT = {'en': {
    'main': 'Main', 'apps': 'Apps', 'support': 'Support', 'play': 'Play free', 'close': 'Close menu', 'back': 'Back',
    'language': 'Language', 'browse': 'Browse', 'choose': 'Choose your language', 'apps_kicker': 'Our apps',
    'kids_desc': 'Ages 5 to 12, with Indie the bee', 'pro_desc': 'Teens and adults, daily puzzle',
    'howto': 'How to play', 'howto_desc': 'The rules in one minute', 'online': 'Play online', 'online_desc': 'Free in your browser',
    'side_kicker': 'Free to try', 'side_text': 'Play puzzles in your browser. No sign-up and no ads.',
    'about': 'About Beequation', 'about_desc': 'No ads, no tracking, made in the UK'}}
# English only, like the Learn section and the teachers page they describe (section names come from learn_menu()).
LEARN_TEXT = {'learn': 'Learn', 'teachers': 'Teachers', 'pack': 'Free puzzle pack for teachers', 'pack_desc': '24 honeycomb puzzles to print',
              'home': 'Learn home', 'home_desc': 'Free maths help for home and school, Reception to Year 6',
              'worksheets': 'Free worksheets', 'glossary': 'Primary maths words explained in plain English, each with an example and the year children usually meet it. Pick a letter:'}

def esc(s): return H.escape(str(s), quote=True)

_LEARN, _LM = None, None
def _learn():
    """tools/build-learn.py as a module: the Learn map (TOPICS, YEARS, colours, front matter) lives there."""
    global _LEARN
    if _LEARN is None:
        spec = importlib.util.spec_from_file_location('build_learn', os.path.join(ROOT, 'tools', 'build-learn.py'))
        _LEARN = importlib.util.module_from_spec(spec); spec.loader.exec_module(_LEARN)
    return _LEARN

def hexicon(g, colour='lemon'):
    """A small candy hexagon with a glyph: the CSS version of build-learn.py's glyph(), in its colours (hex_css())."""
    size = '' if len(g) <= 1 else ' l2' if len(g) == 2 else ' l3'
    return f'<span class="bqh-hex {colour if colour in _learn().CANDY else "lemon"}{size}" aria-hidden="true">{esc(g)}</span>'

def hex_css():
    return ''.join(f'.bqh-hex.{name}{{--c:{fill};--k:{ink}}}' for name, (fill, ink) in _learn().CANDY.items())

def learn_menu():
    """The Learn panel's sections, built from the data the Learn pages are built from (build-learn.py's TOPICS and
    YEARS, the learn-src/ front matter and hub cards, worksheets.json, the glossary's letters), so they stay in step."""
    global _LM
    if _LM is not None: return _LM
    L = _learn()
    src = lambda rel: rd(os.path.join('learn-src', rel))
    def cards(rel):   # a hub page's <card> list: href -> (title, glyph, colour), in page order
        return {h: (t, g, c) for h, t, g, c in re.findall(r'<card href="([^"]+)" title="([^"]*)"(?: glyph="([^"]*)")?(?: colour="([^"]*)")?>', src(rel))}
    home = cards('index.html')
    def ico(href, g, c):
        _, hg, hc = home.get(href, ('', '', ''))
        return hexicon(hg or g, hc or c)
    def guides(folder):
        hub = cards(f'{folder}/index.html'); order = list(hub); out = []
        for f in os.listdir(os.path.join(L.SRC, folder)):
            if not f.endswith('.html') or f == 'index.html': continue
            meta, _ = L.front(src(f'{folder}/{f}')); href = f'/learn/{folder}/{f}'
            _, g, c = hub.get(href, ('', '', ''))
            out.append((order.index(href) if href in order else len(order), meta.get('nav', meta['h1']), href, g or '★', c or 'lemon'))
        return [dict(href=h, label=n, icon=hexicon(g, c)) for _, n, h, g, c in sorted(out)]
    teach = guides('teachers')
    pack = cards('teachers/index.html').get('/teachers.html')
    teach.append(dict(href='/teachers.html', label=pack[0] if pack else LEARN_TEXT['pack'], icon=hexicon((pack and pack[1]) or '⬡', (pack and pack[2]) or 'honey')))
    sheets, wshub, ws = L.worksheets_manifest(), src('worksheets/index.html'), []
    for slug, name, g, c in L.TOPICS:
        k = sum(1 for w in sheets if w['topic'] == slug)
        if k: ws.append(dict(href='/learn/worksheets/' + (f'#{slug}' if f'id="{slug}"' in wshub else ''), label=name,
                             small=f'{k} worksheet' + ('' if k == 1 else 's'), icon=hexicon(g, c)))
    _LM = [
        dict(key='topics', label='Topics', icon=hexicon('+', 'mint'), kicker='Browse topics', all=('All topics', '/learn/topics/'),
             items=[dict(href=f'/learn/topics/{s}.html', label=n, icon=hexicon(g, c)) for s, n, g, c in L.TOPICS]),
        dict(key='years', label='Year groups', icon=hexicon('R–6', 'grape'), kicker='Browse year groups', all=('All year groups', '/learn/years/'),
             items=[dict(href=f'/learn/years/{s}.html', label=n, small=f'Age {age} · US {us}', icon=hexicon('R' if s == 'reception' else n.split()[-1], 'grape'))
                    for s, n, age, us in L.YEARS]),
        dict(key='parents', label='For parents', icon=ico('/learn/parents/', '♥', 'honey'), kicker='Guides for parents', all=('All parent guides', '/learn/parents/'), items=guides('parents')),
        dict(key='teachers', label='For teachers', icon=ico('/learn/teachers/', '✎', 'honey'), kicker='Resources for teachers', all=('All teacher resources', '/learn/teachers/'), items=teach),
        dict(key='worksheets', label='Worksheets', icon=ico('/learn/worksheets/', '⎙', 'honey'), kicker='Free worksheets by topic', all=('All worksheets', '/learn/worksheets/'), items=ws),
        dict(key='glossary', label='Maths glossary', icon=ico('/learn/glossary/', 'A–Z', 'honey'), kicker='Maths words from A to Z', all=('All glossary words', '/learn/glossary/'),
             letters=set(re.findall(r'\bid="([a-z])"', src('glossary/index.html'))), blurb=LEARN_TEXT['glossary']),
    ]
    return _LM

def nav_text(lang):
    return {**NAV_TEXT['en'], **(site_text(lang, 'nav', NAV_TEXT) if lang != 'en' else {})}

CHEV_D, CHEV_R, CHEV_L = '<i class="bqh-chev d"></i>', '<i class="bqh-chev r"></i>', '<i class="bqh-chev l"></i>'   # drawn in CSS
CLOSE_X = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
GLOBE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3z"/></g></svg>'
HIVE = ('<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true" focusable="false"><g stroke="#1C1A4A" stroke-width="2" stroke-linejoin="round">'
        '<path d="M20 5c-4 0-6.5 2.4-7.4 5h14.8C26.5 7.4 24 5 20 5z" fill="#FFD84D"/><path d="M11.4 10h17.2c1.6 1.4 2.5 3.1 2.6 5H8.8c.1-1.9 1-3.6 2.6-5z" fill="#FFB020"/>'
        '<path d="M8.8 15h22.4c.9 1.6 1.4 3.3 1.4 5H7.4c0-1.7.5-3.4 1.4-5z" fill="#FFD84D"/><path d="M7.4 20h25.2c.1 1.8-.2 3.5-.9 5H8.3c-.7-1.5-1-3.2-.9-5z" fill="#FFB020"/>'
        '<path d="M8.3 25h23.4c-.6 1.9-1.6 3.6-2.9 5H11.2c-1.3-1.4-2.3-3.1-2.9-5z" fill="#FFD84D"/><path d="M6 33.5h28" fill="none" stroke-linecap="round"/></g>'
        '<path d="M17.2 30v-2.6a2.8 2.8 0 0 1 5.6 0V30z" fill="#1C1A4A"/><g class="bz"><ellipse cx="34" cy="8" rx="2.6" ry="2" fill="#DFF1FF" stroke="#1C1A4A" stroke-width="1"/>'
        '<path d="M33.5 9.5l3 1.7-1.7 3-3-1.7z" fill="#FFD84D" stroke="#1C1A4A" stroke-width="1" stroke-linejoin="round"/></g></svg>')
LOGO = '<a class="bqh-logo" href="/"><img src="/assets/hexabee.svg" width="34" height="34" alt="">Beequation</a>'

def header(lang, page, label, offer):
    """The header for one page: the pill (with its mega panels) and the phone menu, from one model."""
    t, en = nav_text(lang), lang == 'en'
    cur = '/' + (page[:-len('index.html')] if page.endswith('index.html') else page)
    here = lambda href: ' aria-current="page"' if href == cur else ''
    def row(it, phone=False):   # icon tile + label (+ small line) (+ chevron on phones)
        small = f'<small>{esc(it["small"])}</small>' if it.get('small') else ''
        return (f'<a class="bqh-row" href="{it["href"]}"{here(it["href"])}><span class="bqh-tile">{it["icon"]}</span>'
                f'<span class="bqh-txt"><b>{esc(it["label"])}</b>{small}</span>{CHEV_R if phone else ""}</a>')
    img = lambda f, n: f'<img src="/assets/{f}" width="{n}" height="{n}" alt="" loading="lazy">'
    kids = dict(href='/#apps', label='Beequation Kids', small=t['kids_desc'], icon=img('beequation-kids-icon.webp', 44), f='beequation-kids-icon.webp')
    pro = dict(href='/#apps', label='Beequation Pro', small=t['pro_desc'], icon=img('beequation-icon.webp', 44), f='beequation-icon.webp')
    howto = dict(href='/how-to-play.html', label=t['howto'], small=t['howto_desc'], icon=hexicon('?', 'lilac'))
    online = dict(href='/play.html', label=t['online'], small=t['online_desc'], icon=hexicon('▶', 'mint'))
    extra = (dict(href='/teachers.html', label=LEARN_TEXT['pack'], small=LEARN_TEXT['pack_desc'], icon=hexicon('⬡', 'honey')) if en else
             dict(href='/about.html', label=t['about'], small=t['about_desc'], icon=hexicon('i', 'sky')))
    secs = learn_menu() if en else []
    learn_home = dict(href='/learn/', label=LEARN_TEXT['home'], small=LEARN_TEXT['home_desc'], icon=hexicon('⬡', 'honey'))

    def az(s):
        return '<div class="bqh-az">' + ''.join(f'<a href="/learn/glossary/#{c}">{c.upper()}</a>' if c in s['letters'] else f'<span aria-hidden="true">{c.upper()}</span>'
                                                for c in 'abcdefghijklmnopqrstuvwxyz') + '</div>'
    # ----- wide screens: the pill and its panels
    app_card = lambda it, cls: (f'<a class="bqh-app {cls}" href="{it["href"]}">{img(it["f"], 56)}<b>{esc(it["label"])}</b><small>{esc(it["small"])}</small></a>')
    apps_panel = (f'<div class="bqh-panel" id="bqh-p-apps" hidden><div class="bqh-in bqh-apps"><div><p class="bqh-kicker">{esc(t["apps_kicker"])}</p>'
                  f'<ul class="bqh-appgrid"><li>{app_card(kids, "bqh-kids")}</li><li>{app_card(pro, "bqh-pro")}</li><li class="bqh-stack">{row(howto)}{row(online)}</li></ul></div>'
                  f'<div class="bqh-side"><p class="bqh-kicker">{esc(t["side_kicker"])}</p><p class="bqh-sidetext">{esc(t["side_text"])}</p>'
                  f'<a class="bqh-cta" href="/play.html">{esc(t["play"])}</a>'
                  f'<a class="bqh-mini" href="{extra["href"]}"><span class="bqh-tile">{extra["icon"]}</span><span>{esc(extra["label"])}</span>{CHEV_R}</a></div></div></div>')
    n = len(secs)
    rail = []
    for i, s in enumerate(secs):
        on = i == 0
        body = (f'<p class="bqh-blurb">{esc(s["blurb"])}</p>{az(s)}' if s['key'] == 'glossary' else
                '<ul class="bqh-grid">' + ''.join(f'<li>{row(it)}</li>' for it in s['items']) + '</ul>')
        rail.append(f'<button type="button" class="bqh-tab" aria-expanded="{"true" if on else "false"}" aria-controls="bqh-s-{s["key"]}" style="grid-row:{i + 1}">'
                    f'<span class="bqh-tile">{s["icon"]}</span>{esc(s["label"])}{CHEV_R}</button>'
                    f'<div class="bqh-sec" id="bqh-s-{s["key"]}" style="grid-row:1/{n + 2}"{"" if on else " hidden"}><div class="bqh-sechead"><p class="bqh-kicker">{esc(s["kicker"])}</p>'
                    f'<a class="bqh-all" href="{s["all"][1]}"{here(s["all"][1])}>{esc(s["all"][0])} <span aria-hidden="true">→</span></a></div>{body}</div>')
    learn_panel = (f'<div class="bqh-panel" id="bqh-p-learn" hidden><div class="bqh-in bqh-learn" style="grid-template-rows:repeat({n},auto) 1fr auto">{"".join(rail)}'
                   f'<div class="bqh-foot" style="grid-row:{n + 2}"><a class="bqh-home" href="/learn/"{here("/learn/")}><b>{LEARN_TEXT["home"]}</b><span>{LEARN_TEXT["home_desc"]}</span></a>'
                   f'<a class="bqh-cta" href="/learn/worksheets/">{LEARN_TEXT["worksheets"]}</a></div></div></div>')
    # On a page in the Learn section, its top item (and the phone menu's Learn row) says so: aria-current, underlined.
    in_learn = ' aria-current="true"' if page.startswith('learn/') else ''
    def trigger(key, text, href, panel, inside=''):   # a link without JavaScript, a button that opens the panel with it
        return (f'<li class="bqh-item" data-panel="bqh-p-{key}"><a class="bqh-link bqh-nojs" href="{href}"{here(href) or inside}>{esc(text)}</a>'
                f'<button type="button" class="bqh-link bqh-btn" aria-expanded="false" aria-controls="bqh-p-{key}"{inside}>{esc(text)}{CHEV_D}</button>{panel}</li>')
    items = [trigger('apps', t['apps'], '/#apps', apps_panel)]
    if en:
        items.append(trigger('learn', LEARN_TEXT['learn'], '/learn/', learn_panel, in_learn))
        items.append(f'<li class="bqh-item"><a class="bqh-link" href="/teachers.html"{here("/teachers.html")}>{LEARN_TEXT["teachers"]}</a></li>')
    items.append(f'<li class="bqh-item"><a class="bqh-link" href="/support.html"{here("/support.html")}>{esc(t["support"])}</a></li>')
    links = ''.join(lang_links(lang, page)) if offer else ''
    chip = (f'<details class="lang"><summary><span class="bqh-vh">{esc(label)}: </span>{GLOBE}<span>{lang.upper()}</span>{CHEV_D}</summary>'
            f'<div class="langs">{links}</div></details>') if offer else ''
    menu_label = site_text(lang, 'menu', MENU_LABEL)
    pill = (f'<div class="bqh-pill">{LOGO}<nav class="bqh-nav" aria-label="{esc(t["main"])}"><ul class="bqh-items">{"".join(items)}</ul></nav>'
            f'<div class="bqh-end">{chip}<a class="bqh-cta bqh-cta-top" href="/play.html">{esc(t["play"])}</a>'
            f'<button type="button" class="bqh-hive" aria-expanded="false" aria-controls="bqm" aria-label="{esc(menu_label)}">{HIVE}</button></div></div>')

    # ----- phones and tablets: the full-screen menu, one screen per level
    def screen(id_, parent, kicker, title, body):
        return (f'<div class="bqm-scr" id="{id_}" hidden><button type="button" class="bqm-back" data-to="{parent}">{CHEV_L}{esc(t["back"])}</button>'
                f'<p class="bqh-kicker">{esc(kicker)}</p><h2 class="bqm-h" tabindex="-1">{esc(title)}</h2>{body}</div>')
    rows = lambda its: '<ul class="bqm-rows">' + ''.join(f'<li>{row(it, True)}</li>' for it in its) + '</ul>'
    big = [f'<li><button type="button" data-to="bqm-apps">{esc(t["apps"])}{CHEV_R}</button></li>']
    screens = [screen('bqm-apps', 'bqm-root', t['browse'], t['apps'], rows([kids, pro, howto, online, extra]))]
    if en:
        big.append(f'<li><button type="button" data-to="bqm-learn"{in_learn}>{LEARN_TEXT["learn"]}{CHEV_R}</button></li>')
        big.append(f'<li><a href="/teachers.html"{here("/teachers.html")}>{LEARN_TEXT["teachers"]}</a></li>')
        go = ''.join(f'<li><button type="button" class="bqh-row" data-to="bqm-l-{s["key"]}"><span class="bqh-tile">{s["icon"]}</span>'
                     f'<span class="bqh-txt"><b>{esc(s["label"])}</b></span>{CHEV_R}</button></li>' for s in secs)
        screens.append(screen('bqm-learn', 'bqm-root', t['browse'], LEARN_TEXT['learn'], f'<ul class="bqm-rows">{go}<li>{row(learn_home, True)}</li></ul>'))
        for s in secs:
            every = dict(href=s['all'][1], label=s['all'][0], icon=s['icon'])
            body = (f'<p class="bqh-blurb">{esc(s["blurb"])}</p>{az(s)}{rows([every])}' if s['key'] == 'glossary' else rows(s['items'] + [every]))
            screens.append(screen(f'bqm-l-{s["key"]}', 'bqm-learn', LEARN_TEXT['learn'], s['label'], body))
    big.append(f'<li><a href="/support.html"{here("/support.html")}>{esc(t["support"])}</a></li>')
    if offer:
        big.append(f'<li><button type="button" class="bqm-small" data-to="bqm-lang">{GLOBE}<span>{esc(t["language"])}</span><span class="bqm-cur">{esc(LANGS[lang])}</span>{CHEV_R}</button></li>')
        screens.append(screen('bqm-lang', 'bqm-root', t['language'], t['choose'], f'<div class="bqm-langs">{links}</div>'))
    drawer = (f'<div class="bqm" id="bqm" role="dialog" aria-modal="true" aria-label="{esc(menu_label)}" hidden>'
              f'<div class="bqm-bar">{LOGO}<button type="button" class="bqm-x" aria-label="{esc(t["close"])}">{CLOSE_X}</button></div>'
              f'<div class="bqm-body"><div class="bqm-scr" id="bqm-root" hidden><ul class="bqm-big">{"".join(big)}</ul></div>{"".join(screens)}</div>'
              f'<div class="bqm-foot"><a class="bqh-cta bqm-cta" href="/play.html">{esc(t["play"])}</a></div></div>')
    out = f'<header class="bqh" id="bqh">{pill}{drawer}</header>'
    return out if en else english_only(out)

# The header's styles. Japanese and Korean wrap between words and phrases, not mid-word (keep-all; Japanese uses
# auto-phrase where the browser has it), with overflow-wrap as the fallback for a run too long for its box.
NAV_CSS = """
html{scroll-padding-top:100px;overflow-x:clip}
.bqh{--bqh-focus:#3B24A8;--bqh-soft:#FFF1CC;position:sticky;top:12px;z-index:28;margin:12px 0 6px;padding:0 16px;pointer-events:none;font:16px/1.3 'Space Grotesk',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink)}
@media (prefers-color-scheme:dark){.bqh{--bqh-focus:#FFB020;--bqh-soft:#3A3017}}
.bqh *,.bqh *::before,.bqh *::after{box-sizing:border-box}
.bqh [hidden]{display:none!important}
:where(.bqh) ul{list-style:none;margin:0;padding:0}
:where(.bqh) p{margin:0}
.bqh button{font-family:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.bqh a:focus-visible,.bqh button:focus-visible,.bqh summary:focus-visible{outline:3px solid var(--bqh-focus);outline-offset:2px}
.bqh-vh{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.bqh-pill{pointer-events:auto;position:relative;max-width:1088px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-height:64px;padding:8px 8px 8px 18px;background:var(--card);border:1px solid transparent;border-radius:30px;box-shadow:0 12px 32px -16px rgba(18,22,31,.38),0 2px 6px rgba(18,22,31,.07)}
.bqh-logo{display:inline-flex;align-items:center;gap:10px;min-height:44px;margin-right:auto;font-weight:700;font-size:21px;letter-spacing:-.4px;color:inherit;text-decoration:none;white-space:nowrap}
.bqh-logo img{display:block;width:34px;height:34px;flex:none}
.bqh-nav{order:3;flex:1 0 100%}
.bqh-items{display:flex;flex-wrap:wrap;align-items:center;gap:2px}
.bqh-link{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border:0;border-radius:999px;background:none;font-weight:600;font-size:16px;line-height:1;color:inherit;text-decoration:none;white-space:nowrap;cursor:pointer}
.bqh-link:hover{background:var(--ground)}
.bqh-link[aria-current]{text-decoration:underline;text-decoration-color:var(--honey);text-decoration-thickness:3px;text-underline-offset:7px}
.bqh-link[aria-expanded="true"]{background:var(--bqh-soft)}
.bqh-chev{display:inline-block;flex:none;width:7px;height:7px;border:solid currentColor;border-width:0 2px 2px 0;transition:transform .2s}
.bqh-chev.d{transform:translateY(-2px) rotate(45deg)}
.bqh-chev.r{transform:rotate(-45deg);margin-right:3px}
.bqh-chev.l{transform:rotate(135deg);margin-left:4px;width:9px;height:9px}
.bqh-link[aria-expanded="true"] .bqh-chev.d,.bqh .lang[open] summary .bqh-chev.d{transform:translateY(2px) rotate(225deg)}
.bqh-btn{display:none}
.js-nav .bqh-btn{display:inline-flex}
.js-nav .bqh-nojs{display:none}
.bqh-end{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.bqh-cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border:2px solid transparent;border-radius:999px;background:var(--honey);color:var(--honey-ink,#12161F);font-weight:700;font-size:16px;line-height:1.1;text-align:center;text-decoration:none;white-space:nowrap;cursor:pointer}
.bqh-cta:hover{background:#FFC34D}
.bqh-hive{display:none;place-items:center;flex:none;width:48px;height:48px;padding:0;border:2px solid transparent;border-radius:50%;background:#FFF6D6;cursor:pointer}
.bqh-hive svg{display:block;transition:transform .25s}
.bqh-hive:hover svg{transform:rotate(-8deg) scale(1.06)}
.bqh-hive .bz{opacity:0;transform:translate(-4px,4px);transition:opacity .2s,transform .3s}
.bqh-hive:hover .bz,.bqh-hive[aria-expanded="true"] .bz{opacity:1;transform:none}
.bqh .lang{position:relative}
.bqh .lang summary{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--line);font-weight:700;font-size:15px;line-height:1;list-style:none;cursor:pointer;white-space:nowrap}
.bqh .lang summary::-webkit-details-marker{display:none}
.bqh .lang summary:hover{background:var(--ground)}
.bqh .lang[open]{flex:1 0 100%}
.bqh .lang[open] summary{background:var(--bqh-soft);box-shadow:none}
.bqh .lang .langs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-top:8px;padding:8px;border-radius:18px;background:var(--ground)}
.bqh .lang .langs a{display:flex;align-items:center;min-height:44px;padding:0 10px;border-radius:12px;color:var(--ink);font-weight:500;font-size:15px;text-decoration:none;white-space:nowrap}
.bqh .lang .langs a:hover{background:var(--card)}
.bqh .lang .langs a[aria-current]{background:var(--bqh-soft);font-weight:700}
.bqh-panel{pointer-events:auto;position:absolute;left:0;right:0;top:100%;z-index:1;padding-top:10px}
.bqh-in{max-height:calc(100vh - 110px);max-height:calc(100dvh - 110px);overflow:auto;overscroll-behavior:contain;padding:22px;background:var(--card);color:var(--ink);border:1px solid transparent;border-radius:28px;box-shadow:0 30px 60px -24px rgba(18,22,31,.5),0 4px 14px rgba(18,22,31,.08);animation:bqhDrop .16s ease-out}
@keyframes bqhDrop{from{opacity:0;transform:translateY(-6px)}}
.bqh-kicker{margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.bqh-row{display:flex;align-items:center;gap:12px;min-height:52px;padding:6px 10px 6px 6px;border-radius:16px;color:var(--ink);text-decoration:none;font-size:15.5px;line-height:1.25}
.bqh-row:hover{background:var(--ground)}
.bqh-row[aria-current="page"]{background:var(--bqh-soft)}
.bqh-txt{display:flex;flex-direction:column;gap:2px;min-width:0}
.bqh-txt b{font-weight:600}
.bqh-txt small,.bqh-app small{font-size:13.5px;font-weight:500;line-height:1.3;color:var(--mute)}
.bqh-tile{display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:12px;background:var(--ground);overflow:hidden}
.bqh-row:hover .bqh-tile{background:var(--card)}
.bqh-tile img{display:block;width:100%;height:100%}
.bqh-hex{display:grid;place-items:center;width:28px;height:32px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:var(--c);color:var(--k);font:700 14px/1 Fredoka,'Space Grotesk',sans-serif;white-space:nowrap}
.bqh-hex.l2{font-size:11.5px}.bqh-hex.l3{font-size:9px}
.bqh-apps{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:20px}
.bqh-appgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.bqh-app{display:flex;flex-direction:column;align-items:flex-start;gap:4px;height:100%;padding:18px;border:2px solid transparent;border-radius:22px;background:var(--ground);color:var(--ink);text-decoration:none}
.bqh-app:hover{border-color:var(--honey)}
.bqh-app img{display:block;width:56px;height:56px;border-radius:14px;margin-bottom:8px}
.bqh-app b{font-size:19px;letter-spacing:-.3px;line-height:1.15}
.bqh-kids{background:#EAF6FF;color:#1C1A4A;font-family:Fredoka,ui-rounded,system-ui,sans-serif}
.bqh-kids b{font-weight:700;letter-spacing:0}
.bqh-app.bqh-kids small{color:#5A5688;font-weight:600}
.bqh-stack{display:flex;flex-direction:column;justify-content:center;gap:4px}
.bqh-side{display:flex;flex-direction:column;gap:12px;padding:20px;border-radius:22px;background:var(--ground)}
.bqh-side .bqh-kicker{margin:0}
.bqh-sidetext{font-size:15px;line-height:1.4}
.bqh-mini{display:flex;align-items:center;gap:10px;margin-top:auto;padding:8px 12px 8px 8px;border:2px solid transparent;border-radius:16px;background:var(--card);color:var(--ink);font-size:14.5px;font-weight:600;line-height:1.25;text-decoration:none}
.bqh-mini:hover{border-color:var(--honey)}
.bqh-mini .bqh-chev{margin-left:auto}
.bqh-learn{display:grid;grid-template-columns:240px minmax(0,1fr);column-gap:20px;align-items:start}
.bqh-tab{grid-column:1;display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:4px 10px 4px 4px;border:2px solid transparent;border-radius:16px;background:none;font-weight:600;font-size:16px;line-height:1.2;text-align:left;cursor:pointer}
.bqh-tab .bqh-tile{width:36px;height:36px;border-radius:11px}
.bqh-tab .bqh-chev{margin-left:auto;opacity:0}
.bqh-tab:hover{background:var(--ground)}
.bqh-tab[aria-expanded="true"]{background:var(--bqh-soft)}
.bqh-tab[aria-expanded="true"] .bqh-chev{opacity:1}
.bqh-tab[aria-expanded="true"] .bqh-tile{background:var(--card)}
.bqh-sec{grid-column:2;align-self:stretch;padding-left:20px;border-left:1px solid var(--line)}
.bqh .bqh-sec[hidden]{display:block!important;visibility:hidden}
.bqh-sechead{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0 16px;margin:0 0 4px 6px}
.bqh-sechead .bqh-kicker{margin:0}
.bqh-all{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin-right:-4px;padding:0 12px;border-radius:999px;font-weight:700;font-size:15px;color:var(--cobalt);text-decoration:none;white-space:nowrap}
.bqh-all:hover{background:var(--ground);text-decoration:underline}
.bqh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2px 8px}
.bqh-blurb{max-width:62ch;margin:0 0 12px 6px;font-size:15.5px;line-height:1.45}
.bqh-az{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:6px;margin-left:6px}
.bqh-az a,.bqh-az span{display:grid;place-items:center;min-height:44px;border-radius:12px;background:var(--ground);color:var(--ink);font:700 17px/1 Fredoka,'Space Grotesk',sans-serif;text-decoration:none}
.bqh-az a:hover{background:var(--honey);color:var(--honey-ink,#12161F)}
.bqh-az span{opacity:.35}
.bqh-foot{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 20px;margin-top:18px;padding:12px 12px 12px 20px;border-radius:20px;background:var(--ground)}
.bqh-home{display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:48px;color:var(--ink);text-decoration:none}
.bqh-home b{font-size:16px}
.bqh-home span{font-size:14px;color:var(--mute)}
.bqh-home:hover b{text-decoration:underline;text-decoration-color:var(--honey);text-decoration-thickness:2px}
.bqm{pointer-events:auto;position:fixed;inset:0;z-index:3;display:flex;flex-direction:column;background:var(--card);color:var(--ink);animation:bqmOpen .22s ease-out}
@keyframes bqmOpen{from{opacity:0;transform:translateY(-10px)}}
.bqm-bar{display:flex;flex:none;align-items:center;justify-content:space-between;gap:12px;padding:21px 25px 6px 35px}
.bqm-x{display:grid;place-items:center;flex:none;width:48px;height:48px;padding:0;border:2px solid transparent;border-radius:50%;background:var(--ground);cursor:pointer}
.bqm-x:hover{background:var(--bqh-soft)}
.bqm-body{position:relative;flex:1;min-height:0;overflow:hidden}
.bqm-scr{position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain;padding:8px 24px 28px;background:var(--card)}
.bqm-big>li>a,.bqm-big>li>button{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;padding:10px 4px;border:0;border-bottom:1px solid var(--line);background:none;font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-.8px;text-align:left;text-decoration:none;color:var(--ink);cursor:pointer}
.bqm-big .bqh-chev{margin-left:auto;margin-right:8px;width:13px;height:13px;border-width:0 3px 3px 0}
.bqm-big>li>[aria-current]{text-decoration:underline;text-decoration-color:var(--honey);text-decoration-thickness:3px;text-underline-offset:6px}
.bqm-big>li>.bqm-small{min-height:60px;margin-top:16px;border:0;border-radius:16px;padding:8px 14px;background:var(--ground);font-size:17px;font-weight:600;letter-spacing:0}
.bqm-big>li>.bqm-small .bqh-chev{width:9px;height:9px;border-width:0 2px 2px 0;margin-left:4px}
.bqm-cur{margin-left:auto;font-weight:500;color:var(--mute)}
.bqm-back{display:inline-flex;align-items:center;gap:4px;min-height:44px;margin:0 0 8px -6px;padding:0 14px 0 6px;border:0;border-radius:999px;background:none;font-weight:600;font-size:17px;cursor:pointer}
.bqm-back:hover{background:var(--ground)}
.bqm-h{margin:0 0 12px;font-size:32px;line-height:1.05;letter-spacing:-1px;font-weight:700}
.bqm-h:focus{outline:none}
.bqm .bqh-row{width:100%;min-height:64px;padding:8px 2px;border:0;border-bottom:1px solid var(--line);border-radius:0;background:none;font-size:17px;text-align:left;cursor:pointer}
.bqm .bqh-row:hover{background:none}
.bqm .bqh-row:hover b{text-decoration:underline;text-decoration-color:var(--honey);text-decoration-thickness:2px}
.bqm .bqh-row[aria-current="page"] b{text-decoration:underline;text-decoration-color:var(--honey);text-decoration-thickness:3px}
.bqm .bqh-row>.bqh-chev{margin-left:auto;margin-right:8px;width:9px;height:9px;color:var(--mute)}
.bqm .bqh-tile{width:44px;height:44px}
.bqm .bqh-row:hover .bqh-tile{background:var(--ground)}
.bqm .bqh-blurb{margin:0 0 14px}
.bqm .bqh-az{margin:0 0 8px}
.bqm-langs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:4px}
.bqm-langs a{display:flex;align-items:center;justify-content:center;min-height:52px;padding:6px 4px;border:2px solid transparent;border-radius:14px;background:var(--ground);color:var(--ink);font-weight:600;font-size:15px;text-align:center;text-decoration:none}
.bqm-langs a[aria-current]{background:var(--honey);color:var(--honey-ink,#12161F);font-weight:700}
.bqm-foot{flex:none;padding:12px 24px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line)}
.bqm-cta{display:flex;width:100%;min-height:56px;font-size:18px}
@keyframes bqmIn{from{transform:translateX(100%)}}
@keyframes bqmOut{to{transform:translateX(-25%);opacity:0}}
@keyframes bqmBackIn{from{transform:translateX(-25%);opacity:0}}
@keyframes bqmBackOut{to{transform:translateX(100%)}}
.bqm-scr.f-in{z-index:2;animation:bqmIn .3s cubic-bezier(.2,.8,.2,1) both}
.bqm-scr.f-out{animation:bqmOut .3s ease both}
.bqm-scr.b-in{animation:bqmBackIn .3s ease both}
.bqm-scr.b-out{z-index:2;animation:bqmBackOut .3s cubic-bezier(.2,.8,.2,1) both}
html.bqm-open,html.bqm-open body{overflow:hidden}
html.bqm-open .bq-ok,html.bqm-open .bq-peek,html.bqm-open .bq-scene{display:none}
html:has(.bqh-panel:not([hidden])) .bq-peek,html.bqm-open .bq-drip,html.bqm-open .bq-trail,html:has(.bqh-panel:not([hidden])) .bq-drip,html:has(.bqh-panel:not([hidden])) .bq-trail{visibility:hidden}
@media (prefers-color-scheme:dark){.bqh-pill{border-color:var(--line);box-shadow:0 14px 34px -14px rgba(0,0,0,.8)}.bqh-in{border-color:var(--line);box-shadow:0 30px 60px -20px rgba(0,0,0,.85)}}
@media (min-width:1000px){
.bqh-pill{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;padding:0 8px 0 22px;border-radius:999px}
.bqh-logo{justify-self:start;margin:0}
.bqh-nav{order:0;align-self:stretch}
.bqh-items{flex-wrap:nowrap;height:100%}
.bqh-item{display:flex;align-items:center;align-self:stretch}
.bqh-end{justify-self:end;flex-wrap:nowrap}
.bqh .lang[open]{flex:none}
.bqh .lang .langs{position:absolute;right:0;top:calc(100% + 20px);z-index:2;grid-template-columns:repeat(3,max-content);margin:0;padding:10px;background:var(--card);border:1px solid transparent;border-radius:22px;box-shadow:0 24px 50px -20px rgba(18,22,31,.45),0 4px 12px rgba(18,22,31,.08);animation:bqhDrop .16s ease-out}
.bqh .lang .langs a{padding:0 14px}
.bqh .lang .langs a:hover{background:var(--ground)}
.bqm{display:none!important}
}
@media (min-width:1000px) and (prefers-color-scheme:dark){.bqh .lang .langs{border-color:var(--line);box-shadow:0 24px 50px -20px rgba(0,0,0,.85)}}
@media (max-width:999.98px){
.bqh-panel{display:none!important}
:root:not(.js-nav) .bqh{position:relative;top:0}
.js-nav .bqh-pill{flex-wrap:nowrap;border-radius:999px}
.js-nav .bqh-nav,.js-nav .bqh-end .lang,.js-nav .bqh-cta-top{display:none}
.js-nav .bqh-hive{display:grid}
}
@media (min-width:560px) and (max-width:999.98px){.js-nav .bqh-cta-top{display:inline-flex}}
@media (max-width:420px){.bqm-scr{padding:6px 18px 24px}.bqm-big>li>a,.bqm-big>li>button{font-size:25px}.bqm-h{font-size:28px}.bqm-foot{padding-left:18px;padding-right:18px}}
:lang(ja) body,:lang(ko) body{word-break:keep-all;overflow-wrap:break-word}
:lang(ja) body{line-break:strict}
@supports (word-break:auto-phrase){:lang(ja) body{word-break:auto-phrase}}
/* Site-wide focus ring: honey is under 3:1 on white, so light mode uses deep purple (dark mode keeps honey). */
:root a:focus-visible,:root button:focus-visible,:root summary:focus-visible{outline-color:#3B24A8}
@media (prefers-color-scheme:dark){:root a:focus-visible,:root button:focus-visible,:root summary:focus-visible{outline-color:#FFB020}}
@media (prefers-reduced-motion:reduce){.bqh,.bqh *{animation:none!important;transition:none!important}}
@media (prefers-contrast:more){.bqh-pill,.bqh-in,.bqh .lang .langs{border-color:var(--ink)}.bqh-kicker,.bqh-txt small,.bqh-app small,.bqh-home span{color:var(--ink)!important}.bqh .lang summary{box-shadow:inset 0 0 0 2px var(--ink)}}
@media (forced-colors:active){.bqh-link[aria-expanded="true"],.bqh-tab[aria-expanded="true"],.bqh .lang[open] summary,.bqh-row[aria-current="page"],.bqh .lang .langs a[aria-current],.bqm-langs a[aria-current]{outline:2px solid Highlight;outline-offset:-2px}.bqh-hex,.bqh-hive{forced-color-adjust:none}.bqh .bqh-hive:focus-visible{outline-color:Highlight}}
"""
def nav_head(): return "<!--nav-css--><script>document.documentElement.classList.add('js-nav')</script><style>" + NAV_CSS.strip() + hex_css() + '</style><!--/nav-css-->'

# Opens and closes the panels and the phone menu. Hover only opens panels for a mouse on a wide screen, after 150 ms
# (and closes 150 ms after leaving, so the pointer can travel into the panel); a click pins a hovered panel open.
# While a panel is open, another item (or another section in Learn's rail) only takes over once the pointer rests on
# it, so crossing Apps on the way down to Learn's panel, or crossing the rail on the way to a link, changes nothing.
# Escape closes and returns focus; a click outside closes; only one panel (or the language list) is open at a time.
# The phone menu is a modal dialog: it traps Tab, makes the page behind inert, locks scrolling, and closing it puts
# focus back on the beehive button. Sub-screens slide in (no sliding with Reduce Motion). Focus is never left on
# something that has just been hidden: tabbing into a hovered panel keeps it open, a panel that takes over from one
# holding focus (or from the open language list) moves focus to its own button, hovering another Learn section moves
# focus to that section's button, and resizing past 1000px moves it to the beehive or the Apps button.
NAV ="""<!--nav--><script>(function(){var D=document,R=D.documentElement,h=D.getElementById('bqh');if(!h)return;R.classList.add('js-nav');
function mq(q){return window.matchMedia?matchMedia(q):{matches:false};}function on(m,f){if(m.addEventListener)m.addEventListener('change',f);else if(m.addListener)m.addListener(f);}
var wide=mq('(min-width: 1000px)'),fine=mq('(hover: hover) and (pointer: fine)'),calm=mq('(prefers-reduced-motion: reduce)');
var pill=h.querySelector('.bqh-pill'),lang=pill.querySelector('.lang'),open=null,via='',tO=0,tC=0,tR=0;
function show(li,hover){clearTimeout(tO);clearTimeout(tC);var a=D.activeElement,lost=0;if(open&&open!==li){lost=open.p.contains(a);hide(open);}
if(lang&&lang.open){if(lang.querySelector('.langs').contains(a))lost=1;lang.open=false;}open=li;via=hover?'hover':'click';li.p.hidden=false;li.b.setAttribute('aria-expanded','true');if(lost)li.b.focus();}
function hide(li,back){li.p.hidden=true;li.b.setAttribute('aria-expanded','false');if(open===li)open=null;if(back)li.b.focus();}
function mouse(e){return e.pointerType==='mouse'&&fine.matches&&wide.matches;}
function arm(li){clearTimeout(tO);tO=setTimeout(function(){show(li,1);},open?110:150);}
[].forEach.call(h.querySelectorAll('.bqh-item[data-panel]'),function(li){li.b=li.querySelector('.bqh-btn');li.p=D.getElementById(li.getAttribute('data-panel'));if(!li.b||!li.p)return;
li.b.addEventListener('click',function(){if(open!==li)show(li);else if(via==='hover')via='click';else hide(li);});
li.b.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();show(li);var f=li.p.querySelector('a[href],button');if(f)f.focus();}});
li.addEventListener('pointerenter',function(e){if(!mouse(e))return;clearTimeout(tC);if(open!==li)arm(li);});
li.addEventListener('pointermove',function(e){if(open&&open!==li&&mouse(e))arm(li);});
li.addEventListener('pointerleave',function(e){if(e.pointerType!=='mouse')return;clearTimeout(tO);var o=open;if(!o||via!=='hover')return;tC=setTimeout(function(){if(open===o&&via==='hover')hide(o);},150);});
li.addEventListener('focusout',function(e){var t=e.relatedTarget;if(open===li&&t&&!li.contains(t))hide(li);});
li.p.addEventListener('click',function(e){if(e.target.closest('a[href]'))hide(li);});
li.p.addEventListener('focusin',function(){if(open===li)via='click';});});
var tabs=[].slice.call(h.querySelectorAll('.bqh-tab'));
function pick(t,f){var a=D.activeElement,lost=0;tabs.forEach(function(x){var s=x===t,p=D.getElementById(x.getAttribute('aria-controls'));x.setAttribute('aria-expanded',s?'true':'false');if(p){if(!s&&a&&p.contains(a))lost=1;p.hidden=!s;}});if(f||lost)t.focus();}
tabs.forEach(function(t,i){t.addEventListener('click',function(){pick(t);});t.addEventListener('focus',function(){pick(t);});
t.addEventListener('keydown',function(e){var k=e.key,n=k==='ArrowDown'?i+1:k==='ArrowUp'?i-1:k==='Home'?0:k==='End'?tabs.length-1:null;
if(k==='ArrowRight'){var a=D.getElementById(t.getAttribute('aria-controls')).querySelector('.bqh-grid a,.bqh-az a');if(a){e.preventDefault();a.focus();}return;}
if(n===null)return;e.preventDefault();pick(tabs[(n+tabs.length)%tabs.length],1);});
t.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse'||t.getAttribute('aria-expanded')==='true')return;clearTimeout(tR);tR=setTimeout(function(){pick(t);},90);});t.addEventListener('pointerleave',function(){clearTimeout(tR);});});
if(lang){lang.addEventListener('toggle',function(){if(lang.open&&open)hide(open);});lang.addEventListener('focusout',function(e){var t=e.relatedTarget;if(lang.open&&t&&!lang.contains(t))lang.open=false;});}
var hive=h.querySelector('.bqh-hive'),dr=D.getElementById('bqm'),cur=null;
function inert(v){[].forEach.call(D.body.children,function(el){if(el!==h&&!/^(SCRIPT|STYLE)$/.test(el.tagName))el.inert=v;});pill.inert=v;}
function go(to,dir,f){var from=cur;if(!to||from===to)return;to.hidden=false;to.scrollTop=0;cur=to;
if(from){if(dir&&!calm.matches){var a=dir>0?'f':'b';to.classList.add(a+'-in');from.classList.add(a+'-out');setTimeout(function(){to.classList.remove(a+'-in');from.classList.remove(a+'-out');if(from!==cur)from.hidden=true;},320);}else from.hidden=true;}
f=f||to.querySelector('.bqm-h')||to.querySelector('a[href],button');if(f){try{f.focus({preventScroll:true});}catch(x){f.focus();}}}
function openDr(){if(open)hide(open);dr.hidden=false;R.classList.add('bqm-open');hive.setAttribute('aria-expanded','true');inert(true);cur=null;
[].forEach.call(dr.querySelectorAll('.bqm-scr'),function(s){s.hidden=true;s.className='bqm-scr';});var r=D.getElementById('bqm-root');go(r,0,r.querySelector('a[href],button'));}
function closeDr(back){if(!dr||dr.hidden)return;dr.hidden=true;R.classList.remove('bqm-open');hive.setAttribute('aria-expanded','false');inert(false);if(back)hive.focus();}
if(hive&&dr){hive.addEventListener('click',openDr);dr.querySelector('.bqm-x').addEventListener('click',function(){closeDr(1);});
dr.addEventListener('click',function(e){var b=e.target.closest('[data-to]');
if(b){var back=b.classList.contains('bqm-back'),to=D.getElementById(b.getAttribute('data-to'));if(!back&&to)to.from=b;go(to,back?-1:1,back&&cur?cur.from:null);return;}
if(e.target.closest('a[href]'))closeDr(0);});
dr.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var f=[].filter.call(dr.querySelectorAll('a[href],button'),function(x){return x.getClientRects().length>0;});if(!f.length)return;
var a=f[0],z=f[f.length-1],c=D.activeElement;if(e.shiftKey&&(c===a||!dr.contains(c))){e.preventDefault();z.focus();}else if(!e.shiftKey&&(c===z||!dr.contains(c))){e.preventDefault();a.focus();}});}
D.addEventListener('keydown',function(e){if(e.key!=='Escape'&&e.key!=='Esc')return;
if(dr&&!dr.hidden){e.preventDefault();closeDr(1);}else if(open){var li=open,a=D.activeElement;hide(li,!a||a===D.body||li.contains(a));}
else if(lang&&lang.open){lang.open=false;lang.querySelector('summary').focus();}});
D.addEventListener('click',function(e){var t=e.target;if(open&&!open.contains(t))hide(open);if(lang&&lang.open&&!lang.contains(t))lang.open=false;});
var inH=0;h.addEventListener('focusin',function(){inH=1;});h.addEventListener('focusout',function(e){if(e.relatedTarget&&!h.contains(e.relatedTarget))inH=0;});
D.addEventListener('pointerdown',function(e){if(!h.contains(e.target))inH=0;});
on(wide,function(){if(wide.matches)closeDr(0);else{if(open)hide(open);if(lang)lang.open=false;}
var a=D.activeElement;if(inH&&(!a||a===D.body||!a.getClientRects().length)){var f=wide.matches?pill.querySelector('.bqh-btn')||pill.querySelector('.bqh-logo'):hive;if(f)f.focus();}});})();</script><!--/nav-->"""

_SITE = {}
def site_text(lang, key, table):
    """A per-language snippet (say, consent, menu, skip, nav): from the tables above, or i18n/<lang>.json \"__site__\"."""
    if lang in table: return table[lang]
    if lang not in _SITE:
        f = os.path.join(ROOT, 'i18n', f'{lang}.json')
        _SITE[lang] = json.load(open(f, encoding='utf-8')).get('__site__', {}) if os.path.exists(f) else {}
    return _SITE[lang].get(key, table['en'])

def strip_markers(s):
    """Takes out everything chrome() adds. The header leaves HEADER_SLOT behind so it's rebuilt in the same place
    (pages from before the header had <div class="wrap"><nav class="top">…</nav></div> there instead)."""
    s = re.sub(r'<!--header-->.*?<!--/header-->', HEADER_SLOT, s, flags=re.S)
    s = re.sub(r'<div class="wrap"><nav class="top".*?</nav></div>', HEADER_SLOT, s, count=1, flags=re.S)
    for m in ('lang-menu', 'hreflang', 'lang-redirect', 'lang-remember', 'bee', 'em', 'consent', 'nav', 'nav-css', 'skip',
              'drip'):   # 'drip': the honey drip's old snippet (it's part of BEE now)
        s = re.sub(rf'\n?<!--{m}-->.*?<!--/{m}-->', '', s, flags=re.S)
    return s

def english_only(s):
    """English-only pages and files live on beequation.com, so a language site links to them there."""
    return re.sub(r'href="/(play\.html|teachers\.html|accessibility\.html|learn/[^"]*|assets/[^"]+\.pdf)"', rf'href="{MAIN}/\1"', s)

def chrome(src, lang, page, label='Language'):
    s = strip_markers(src)
    for old in (OLD_MENU_CSS, OLDER_MENU_CSS):  # the language menu's styles now come with the header
        s = s.replace(old + '\n', '').replace(old, '')
    offer = bool(lang != 'en' or LIVE)        # the English site shows languages only once one is live
    if page in PAGES and offer:
        s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + alternates(page, lang), 1)
    if '<main' in s:
        s = re.sub(r'<main(?![^>]*\bid=)([^>]*)>', r'<main id="main"\1>', s, count=1)
        mid = re.search(r'<main[^>]*\bid="([^"]+)"', s).group(1)
        s = s.replace('<body>', '<body>\n' + SKIP.replace('__SKIP__', site_text(lang, 'skip', SKIP_LABEL)).replace('#main', '#' + mid), 1)
    if HEADER_SLOT in s:
        s = s.replace(HEADER_SLOT, '<!--header-->' + header(lang, page, label, offer) + '<!--/header-->', 1)
        s = s.replace('</head>', nav_head() + '\n</head>', 1)
        s = s.replace('</body>', NAV + '\n</body>', 1)
    if 'class="em"' in s: s = s.replace('</body>', EMAIL + '\n</body>', 1)
    s = s.replace('</body>', CONSENT.replace('__CT__', json.dumps(site_text(lang, 'consent', CONSENT_TEXT), ensure_ascii=False)) + '\n</body>', 1)
    s = s.replace('</body>', BEE.replace('__SAY__', json.dumps(site_text(lang, 'say', SAY), ensure_ascii=False)) + '\n</body>', 1)
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
        if '<!--header-->' not in s and '<nav class="top"' not in s: continue   # pages without the header (the game)
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
    s = english_only(s)                       # (the header, added later by chrome(), leaves out Learn and Teachers itself)
    s = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"HowTo".*?</script>\n?', '', s, flags=re.S)
    if page == 'support.html':
        qa = re.findall(r'<h2>(.*?)</h2><p>(.*?)</p>', s, re.S)
        strip = lambda x: H.unescape(re.sub(r'<[^>]+>', '', x)).strip()
        faq = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': HTML_LANG[lang], 'mainEntity': [{'@type': 'Question', 'name': strip(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in qa]}, ensure_ascii=False, separators=(',', ':'))
        s = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>', lambda m: f'<script type="application/ld+json">{faq}</script>', s, flags=re.S)
    return s

def build(check_only=False):
    problems = 0
    only = sys.argv[sys.argv.index('--lang') + 1] if '--lang' in sys.argv else None
    for lang in [l for l in LANGS if l != 'en' and (only is None or l == only)]:
        if not os.path.exists(os.path.join(ROOT, 'i18n', f'{lang}.json')):
            continue   # not translated yet
        T = json.load(open(os.path.join(ROOT, 'i18n', f'{lang}.json'), encoding='utf-8'))
        nav = T.get('__site__', {}).get('nav', {})
        for k, v in NAV_TEXT['en'].items():   # the header's words
            if not nav.get(k): print(f'  {lang} header: no translation for "{k}": {v}'); problems += 1
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
    if '--live' in sys.argv:
        print(' '.join(sorted(LIVE))); sys.exit(0)
    check = '--check' in sys.argv
    if not check: update_english()
    n = build(check)
    print(f'{n} untranslated piece(s)' if n else 'all translated')
    sys.exit(1 if n else 0)
