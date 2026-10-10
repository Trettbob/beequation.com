#!/usr/bin/env python3
"""Builds the translated sites (<lang>.beequation.com, one per i18n/<lang>.json) from the English pages.

  python3 tools/build-langs.py            update the English pages' language menu, then build dist/<lang>/
  python3 tools/build-langs.py --check    only report text that has no translation yet
  python3 tools/build-langs.py --lang ja  build only dist/ja/ (the English pages are still updated)
  python3 tools/build-langs.py --live     print the live language codes (LIVE below), for publish-langs.sh

The English pages in this repo are the source. Translations live in i18n/<lang>.json as English -> translation
pairs: the page title, meta/alt/aria text, the inner HTML of each text block, text-only links and the homepage
demo's JavaScript strings. When English text changes, the build lists what needs translating and stops.
Each dist/<lang>/ folder is published to its own repo (Trettbob/<lang>.beequation.com) by tools/publish-langs.sh.
"""
import json, os, re, shutil, sys
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
LIVE = {'fr', 'es', 'de', 'pt'}
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
        if code != 'en' and code not in LIVE and code != lang: continue
        path = url_path(page) if page in PAGES else '/'
        href = site(code) + path + ('?lang=en' if code == 'en' and lang != 'en' else '')
        cur = ' aria-current="true"' if code == lang else ''
        links.append(f'<a href="{href}" lang="{code}" hreflang="{code}" data-lang="{code}"{cur}>{name}</a>')
    return (f'<!--lang-menu--><details class="lang"><summary aria-label="{label}">{lang.upper()}</summary>'
            f'<div class="langs">{"".join(links)}</div></details><!--/lang-menu-->')

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

# Indie (the Hexabee) flies across the page now and then: first after 12-20 s, then every 1-2 minutes. Visitors can
# catch Indie with the mouse or a finger (she wriggles and smiles); let go and she flies off the way she was flung.
# She says things in a speech bubble (SAY, per language) while flying, when caught and when let go, and on about
# half her flights she does a loop-the-loop partway across. About a third of flights are a pollen run instead: a
# sunflower grows at one bottom corner and a hive at the other; she collects pollen and flies it home (about 4.5 s). Every minute or so she also pops up from behind something
# on the page (a card, heading or button), says hello and ducks back down; only one Indie is on screen at a time.
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
+'.bq-peek .say{left:50px;bottom:58px}.bq-peek.f .say{left:auto;right:50px}.bq-peek.f .say:after{left:auto;right:10px}';
document.head.appendChild(st);
var busy=0;function later(ms){setTimeout(fly,ms!=null?ms:60000+Math.random()*60000);}
function fly(){if(document.hidden){document.addEventListener('visibilitychange',function v(){if(!document.hidden){document.removeEventListener('visibilitychange',v);later(4000+Math.random()*6000);}});return;}
if(busy)return later(8000);busy=1;var el=document.createElement('div');el.className='bq-bee';el.setAttribute('aria-hidden','true');el.innerHTML='<div class="b">'+svg+'</div><div class="say"></div>';document.body.appendChild(el);
var body=el.firstChild,bub=el.lastChild,said=0;function say(list,ms){bub.textContent=list[Math.floor(Math.random()*list.length)];bub.classList.add('on');clearTimeout(said);if(ms)said=setTimeout(function(){bub.classList.remove('on');},ms);}
var W=innerWidth,H=innerHeight,ltr=Math.random()<.5,y0=H*(.12+Math.random()*.55),amp=18+Math.random()*30,dur=4000+Math.random()*700;
var trip=Math.random()<.35&&W>=360&&H>=420,sc=[],tp=null,sz=1,flip=!trip&&Math.random()<.5,fs=.25+Math.random()*.4,fd=900/dur,spin=0,sp1=0,sp0=0,mode='cross',t0=0,last=0,x=ltr?-90:W+90,y=y0,face=ltr?1:-1,tilt=0,vx=0,vy=0,gx=0,gy=0,trail=[];
function draw(){el.style.transform='translate('+x+'px,'+y+'px)';body.style.transform='rotate('+(face*(tilt-spin))+'deg) scaleX('+face+') scale('+sz+')';}
function part(cls,html,side,w){var d=document.createElement('div');d.className='bq-scene '+cls;d.setAttribute('aria-hidden','true');d.innerHTML=html;d.style[side]=Math.round(W*.05)+'px';d.style.width=w+'px';document.body.appendChild(d);sc.push(d);requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('on');});});return d;}
function unscene(){sc.forEach(function(d){d.classList.remove('on');setTimeout(function(){d.remove();},400);});sc=[];}
if(trip){var fl=Math.random()<.5;mode='trip';part('fl',flower,fl?'left':'right',96);part('hv',hive,fl?'right':'left',84);
var fx=fl?W*.05+48:W-W*.05-48,fy=H-150+40,hx=fl?W-W*.05-42:W*.05+42,hy=H-84+61;
tp={sx:fl?-60:W+60,sy:H*.35,fx:fx-36,fy:fy-46,hx:hx-36,hy:hy-36,cx:W/2-36,cy:Math.min(fy,hy)-H*.42};x=tp.sx;y=tp.sy;face=fl?1:-1;}
function gone(){el.remove();unscene();busy=0;later();}
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
draw();requestAnimationFrame(step);}
el.addEventListener('pointerdown',function(e){if(mode==='away'||(tp&&tp.done))return;e.preventDefault();if(mode==='trip'){unscene();sz=1;el.style.opacity='1';}mode='held';el.classList.add('held');try{el.setPointerCapture(e.pointerId);}catch(_){}
gx=e.clientX-x;gy=e.clientY-y;tilt=0;trail=[[e.clientX,e.clientY,e.timeStamp]];say(SAY.held);draw();});
el.addEventListener('pointermove',function(e){if(mode!=='held')return;var nx=e.clientX-gx;if(Math.abs(nx-x)>2)face=nx>x?1:-1;x=nx;y=e.clientY-gy;
trail.push([e.clientX,e.clientY,e.timeStamp]);if(trail.length>6)trail.shift();draw();});
function release(e){if(mode!=='held')return;el.classList.remove('held');mode='away';var a=trail[0],b=trail[trail.length-1],ms=Math.max(16,b[2]-a[2]);
vx=(b[0]-a[0])/ms;vy=(b[1]-a[1])/ms;var sp=Math.sqrt(vx*vx+vy*vy);
if(sp<.25||e.timeStamp-b[2]>120){vx=(Math.random()<.5?-1:1)*.35;vy=-.25;sp=.43;}
if(sp>1.6){vx*=1.6/sp;vy*=1.6/sp;}face=vx>=0?1:-1;say(SAY.free,1200);last=0;t0=1;requestAnimationFrame(step);}
el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
draw();requestAnimationFrame(step);}
function peekLater(ms){setTimeout(peek,ms!=null?ms:45000+Math.random()*45000);}
function peek(){if(document.hidden||busy)return peekLater(15000);
var c=[].slice.call(document.querySelectorAll('.app,.card,.sheet,.trybox,.tip,.challenge,figure,table,.btn,h2,footer')).filter(function(e){var r=e.getBoundingClientRect();return r.width>120&&r.top>100&&r.top<innerHeight-80&&r.left>=0&&r.right<=innerWidth;});
if(!c.length)return peekLater(20000);var r=c[Math.floor(Math.random()*c.length)].getBoundingClientRect(),f=Math.random()<.5;busy=1;
var w=document.createElement('div');w.className='bq-peek'+(f?' f':'');w.setAttribute('aria-hidden','true');w.style.left=(r.left+12+Math.random()*Math.max(0,r.width-96))+'px';w.style.top=(r.top-62)+'px';
w.innerHTML='<div class="clip"><div class="b">'+svg+'</div></div><div class="say"></div>';document.body.appendChild(w);var bub=w.lastChild,t1,t2,done=0;
function down(){if(done)return;done=1;clearTimeout(t1);clearTimeout(t2);bub.classList.remove('on');w.classList.remove('up');removeEventListener('scroll',moved);setTimeout(function(){w.remove();busy=0;peekLater();},500);}
function say(l){bub.textContent=l[Math.floor(Math.random()*l.length)];bub.classList.add('on');}
var sy=scrollY;function moved(){if(Math.abs(scrollY-sy)>40)down();}addEventListener('scroll',moved,{passive:true});w.firstChild.addEventListener('pointerdown',function(){say(SAY.boo);clearTimeout(t2);t2=setTimeout(down,700);});
setTimeout(function(){w.classList.add('up');t1=setTimeout(function(){say(SAY.peek);},450);t2=setTimeout(down,4300);},30);}
later(12000+Math.random()*8000);peekLater(30000+Math.random()*20000);}catch(e){}})();</script><!--/bee-->"""

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

# The main menu stays at the top of the screen while scrolling. On phones the links fold into a menu opened by a
# little beehive button (aria-expanded, closes on Escape, a tap outside or choosing a link). Without JavaScript the
# links simply wrap as before.
MENU_LABEL = {'en': 'Menu', 'fr': 'Menu', 'es': 'Menú', 'de': 'Menü', 'pt': 'Menu'}
SKIP_LABEL = {'en': 'Skip to content', 'fr': 'Aller au contenu', 'es': 'Saltar al contenido', 'de': 'Zum Inhalt springen', 'pt': 'Pular para o conteúdo'}
SKIP = '<!--skip--><a class="skip" href="#main">__SKIP__</a><style>.skip{position:absolute;left:12px;top:-60px;z-index:50;background:#FFB020;color:#12161F;font-weight:700;padding:10px 16px;border-radius:12px;text-decoration:none}.skip:focus{top:12px}</style><!--/skip-->'
NAV = """<!--nav--><style>
html{scroll-padding-top:84px;overflow-x:clip}
.bq-top{position:sticky;top:0;z-index:28;background:var(--ground,#EEF1F5)}
.bq-top::before{content:'';position:absolute;top:0;bottom:0;left:calc(50% - 50vw);width:100vw;background:var(--ground,#EEF1F5);z-index:-1;transition:box-shadow .2s}
.bq-top.scrolled::before{box-shadow:0 10px 18px -14px rgba(0,0,0,.45)}
.bq-top .top{padding:12px 0}
.bq-links{display:flex;align-items:center;gap:22px}
.bq-hive{display:none;border:0;background:#FFF6D6;width:48px;height:48px;padding:0;border-radius:50%;cursor:pointer;-webkit-tap-highlight-color:transparent;flex:none}
.bq-hive:focus-visible{outline:3px solid var(--honey,#FFB020);outline-offset:2px}
.bq-hive svg{display:block;margin:auto;transition:transform .25s}.bq-hive[aria-expanded="true"] svg{transform:rotate(-8deg) scale(1.06)}
.bq-hive .bz{opacity:0;transition:opacity .2s,transform .3s;transform:translate(-4px,4px)}.bq-hive[aria-expanded="true"] .bz{opacity:1;transform:none}
@media (max-width:640px){
 .bq-top .top{flex-wrap:nowrap;gap:12px}.bq-top .top .brand{flex-basis:auto;margin:0}
 .bq-hive{display:grid}
 .bq-links{display:none;position:absolute;left:0;right:0;top:100%;flex-direction:column;align-items:stretch;gap:2px;padding:8px;background:var(--card,#fff);border-radius:0 0 18px 18px;box-shadow:0 18px 30px rgba(0,0,0,.25)}
 .bq-top.open .bq-links{display:flex}
 .bq-links>a{padding:12px 14px;border-radius:12px;font-size:18px!important}
 .bq-links>a:hover,.bq-links>a:focus-visible{background:var(--ground,#EEF1F5)}
 .bq-links .lang{padding:8px 14px}.bq-links .lang .langs{right:auto;left:0}
}
@media (prefers-reduced-motion:reduce){.bq-hive svg,.bq-hive .bz{transition:none}}
</style><script>(function(){var n=document.querySelector('nav.top');if(!n)return;var w=n.parentElement;w.classList.add('bq-top');
var b=n.querySelector('.brand'),box=document.createElement('div');box.className='bq-links';box.id='bq-menu';
[].slice.call(n.children).forEach(function(c){if(c!==b)box.appendChild(c);});
var h=document.createElement('button');h.type='button';h.className='bq-hive';h.setAttribute('aria-expanded','false');h.setAttribute('aria-controls','bq-menu');h.setAttribute('aria-label','__MENU__');
h.innerHTML='<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true" focusable="false"><g stroke="#1C1A4A" stroke-width="2" stroke-linejoin="round"><path d="M20 5c-4 0-6.5 2.4-7.4 5h14.8C26.5 7.4 24 5 20 5z" fill="#FFD84D"/><path d="M11.4 10h17.2c1.6 1.4 2.5 3.1 2.6 5H8.8c.1-1.9 1-3.6 2.6-5z" fill="#FFB020"/><path d="M8.8 15h22.4c.9 1.6 1.4 3.3 1.4 5H7.4c0-1.7.5-3.4 1.4-5z" fill="#FFD84D"/><path d="M7.4 20h25.2c.1 1.8-.2 3.5-.9 5H8.3c-.7-1.5-1-3.2-.9-5z" fill="#FFB020"/><path d="M8.3 25h23.4c-.6 1.9-1.6 3.6-2.9 5H11.2c-1.3-1.4-2.3-3.1-2.9-5z" fill="#FFD84D"/><path d="M6 33.5h28" fill="none" stroke-linecap="round"/></g><path d="M17.2 30v-2.6a2.8 2.8 0 0 1 5.6 0V30z" fill="#1C1A4A"/>'
+'<g class="bz"><ellipse cx="34" cy="8" rx="2.6" ry="2" fill="#DFF1FF" stroke="#1C1A4A" stroke-width="1"/><path d="M33.5 9.5l3 1.7-1.7 3-3-1.7z" fill="#FFD84D" stroke="#1C1A4A" stroke-width="1" stroke-linejoin="round"/></g></svg>';
n.appendChild(h);n.appendChild(box);
function set(o){w.classList.toggle('open',o);h.setAttribute('aria-expanded',o?'true':'false');}
h.addEventListener('click',function(e){e.stopPropagation();set(!w.classList.contains('open'));});
box.addEventListener('click',function(e){if(e.target.closest('a'))set(false);});
document.addEventListener('click',function(e){if(!w.contains(e.target))set(false);});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&w.classList.contains('open')){set(false);h.focus();}});
function sc(){w.classList.toggle('scrolled',scrollY>4);}addEventListener('scroll',sc,{passive:true});sc();})();</script><!--/nav-->"""

_SITE = {}
def site_text(lang, key, table):
    """A per-language snippet (say, consent, menu, skip): from the tables above, or i18n/<lang>.json \"__site__\"."""
    if lang in table: return table[lang]
    if lang not in _SITE:
        f = os.path.join(ROOT, 'i18n', f'{lang}.json')
        _SITE[lang] = json.load(open(f, encoding='utf-8')).get('__site__', {}) if os.path.exists(f) else {}
    return _SITE[lang].get(key, table['en'])

def strip_markers(s):
    for m in ('lang-menu', 'hreflang', 'lang-redirect', 'lang-remember', 'bee', 'em', 'consent', 'nav', 'skip'):
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
        s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + alternates(page, lang), 1)
    if '<main' in s:
        s = re.sub(r'<main(?![^>]*\bid=)([^>]*)>', r'<main id="main"\1>', s, count=1)
        mid = re.search(r'<main[^>]*\bid="([^"]+)"', s).group(1)
        s = s.replace('<body>', '<body>\n' + SKIP.replace('__SKIP__', site_text(lang, 'skip', SKIP_LABEL)).replace('#main', '#' + mid), 1)
    if '<nav class="top"' in s: s = s.replace('</body>', NAV.replace('__MENU__', site_text(lang, 'menu', MENU_LABEL)) + '\n</body>', 1)
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
    s = re.sub(r'href="/(play\.html|teachers\.html|accessibility\.html|learn/[^"]*|assets/[^"]+\.pdf)"', rf'href="{MAIN}/\1"', s)
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
    only = sys.argv[sys.argv.index('--lang') + 1] if '--lang' in sys.argv else None
    for lang in [l for l in LANGS if l != 'en' and (only is None or l == only)]:
        if not os.path.exists(os.path.join(ROOT, 'i18n', f'{lang}.json')):
            continue   # not translated yet
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
    if '--live' in sys.argv:
        print(' '.join(sorted(LIVE))); sys.exit(0)
    check = '--check' in sys.argv
    if not check: update_english()
    n = build(check)
    print(f'{n} untranslated piece(s)' if n else 'all translated')
    sys.exit(1 if n else 0)
