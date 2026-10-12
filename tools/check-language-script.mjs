// Dependency-free execution check for generated suggestion/analytics scripts.
// A small DOM boundary records actual script output; layout needs the browser check.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const before = process.argv.includes('--before');
function source(path) {
  return before ? execFileSync('git', ['show', `HEAD:${path}`], {cwd:root, encoding:'utf8'}) : readFileSync(resolve(root, path), 'utf8');
}
function script(html, marker) {
  const block = html.match(new RegExp(`<!--${marker}-->([\\s\\S]*?)<!--/${marker}-->`));
  return block?.[1].match(/<script>([\s\S]*?)<\/script>/)?.[1];
}
class Element {
  constructor(tag) { this.tagName=tag.toUpperCase(); this.children=[]; this.attrs={}; this.events={}; this.style={}; }
  getBoundingClientRect(){return {height:120,top:547,bottom:667};}
  contains(el){return el===this||Object.values(this.parts||{}).includes(el);}
  appendChild(child) { this.children.push(child); child.parent=this; }
  insertBefore(child, sibling) { const i=this.children.indexOf(sibling); this.children.splice(i<0?0:i,0,child); child.parent=this; }
  insertAdjacentElement(where,child) { assert.equal(where,'afterend'); const i=this.parent.children.indexOf(this); this.parent.children.splice(i+1,0,child); child.parent=this.parent; }
  setAttribute(key,value) {this.attrs[key]=value;}
  addEventListener(key,callback) {this.events[key]=callback;}
  querySelector(selector) { this.parts??={}; return this.parts[selector]??=new Element(selector); }
  remove() {this.parent.children.splice(this.parent.children.indexOf(this),1);}
}
function run(path, {languages=['fr-FR'], values={}, blocked=false, search='', hash='', cookie='', hostname='beequation.com', protocol='https:'}={}) {
  const html=source(path), store=new Map(Object.entries(values)), head=new Element('head'), body=new Element('body');
  const skip=new Element('a');skip.className='skip';body.appendChild(skip);
  const header=new Element('header'); header.id='bqh'; body.appendChild(header);
  const events={}, redirects=[], cookies=[],scrolls=[],windowEvents={};
  const notice=()=>body.children.find(x=>x.className==='bq-ok');
  const document={head,body,documentElement:new Element('html'),createElement:tag=>new Element(tag),getElementById:id=>id==='bqh'?header:null,
    addEventListener:(name,f)=>{(events[name]??=[]).push(f);},removeEventListener:(name,f)=>{events[name]=(events[name]||[]).filter(x=>x!==f);},
    dispatchEvent:event=>{for(const f of events[event.type]||[])f(event);},
    querySelector:selector=>selector==='.bq-ok'?notice():selector==='.skip'?skip:null};
  Object.defineProperty(document,'cookie',{get:()=> '_ga=test; _ga_3YFSG10Q1W=test; '+cookie,set:value=>cookies.push(value)});
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  const context={document,navigator:{languages},location:{search,hash,replace:url=>redirects.push(url),pathname:'/'+path,hostname,protocol},URLSearchParams,Event};
  Object.defineProperty(context,'localStorage',{get(){if(blocked)throw Error('storage denied');return storage;}});
  context.window=context;context.addEventListener=(k,f)=>{windowEvents[k]=f;};context.removeEventListener=k=>{delete windowEvents[k];};context.innerHeight=667;context.scrollBy=(x,y)=>scrolls.push(y);context.getComputedStyle=()=>({paddingBottom:'0px',display:'flex',visibility:'visible'});
  vm.createContext(context);
  const code=script(html, before?'lang-redirect':'lang-suggestion');
  if(code)vm.runInContext(code,context);
  const consent=script(html,'consent'); if(consent)vm.runInContext(consent,context);
  const ga=script(html,'ga'); if(ga)vm.runInContext(ga,context);
  return {store,head,body,events,redirects,context,cookies,notice,scrolls,windowEvents,external:()=>head.children.filter(x=>x.tagName==='SCRIPT'),emit:()=>document.dispatchEvent(new Event('bq-consent')),banner:()=>body.children.find(x=>x.id==='bq-language-suggestion')};
}
let r=run('support.html',{search:'?from=test',hash:'#help'});
assert.deepEqual(r.redirects,[], 'English page must not redirect');
assert.equal(r.banner().lang,'fr');
assert.equal(r.banner().children[0].href,'https://fr.beequation.com/support.html?from=test#help');
assert.equal(r.external().length,0,'no external scripts before consent');
r.banner().children[1].events.click();
assert.equal(r.banner(),undefined);
assert.equal(r.store.get('bq-lang-dismissed'),'yes');
assert.equal(run('support.html',{values:Object.fromEntries(r.store)}).banner(),undefined);
for (const values of [{}, {'bq-consent':'all'}, {'bq-consent':'basic'}, {'bq-consent':'no'}]) {
  r=run('support.html',{values});
  assert.equal(r.external().length,0,'no analytics without opt-in');
}
r=run('support.html',{values:{'bq-consent':'no'}});r.banner().children[1].events.click();
assert.equal(r.store.has('bq-lang-dismissed'),false,'respect legacy no-storage preference');
// Catch stale opt-in, duplicate loads, dual ready/load callbacks and revocation during download.
for(const path of ['support.html', ...['fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko'].map(c=>`dist/${c}/support.html`)]) {
  // Missing adoption would show the note and fail to load the opted-in trackers.
  for(const value of ['all2','basic']) {
    r=run(path,{cookie:`bq-consent=${value}`,hostname:'fr.beequation.com'});
    assert.equal(r.store.get('bq-consent'),value,'adopt shared preference');
    assert.equal(r.notice(),undefined);
    assert.equal(r.external().length,value==='all2'?2:0);
  }
  for(const value of ['all','no','invalid']) {
    r=run(path,{cookie:`bq-consent=${value}`});assert.ok(r.notice());assert.equal(r.external().length,0);
  }
  r=run(path,{cookie:'bq-consent=all2',values:{'bq-consent':'all'}});
  assert.ok(r.notice(),'old local consent still asks again');assert.equal(r.external().length,0);
  r=run(path,{cookie:'bq-consent=all2',values:{'bq-consent':'basic'}});
  assert.equal(r.external().length,0,'local refusal is not overridden');
  r=run(path);
  assert.equal(r.body.children[1],r.notice(),'consent follows skip link in tab order');
  assert.equal(r.notice().attrs.role,'region');assert.ok(r.notice().attrs['aria-label']);
  assert.ok(!r.notice().innerHTML.includes('<h2'),'no heading');
  r.notice().querySelector('.n').events.click();
  assert.ok(r.cookies.includes('bq-consent=basic; Domain=.beequation.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure'));
  for(const value of [undefined,'all','basic','no','all2']) {
    r=run(path,{values:value?{'bq-consent':value}:{}});
    assert.equal(!!r.notice(),!['basic','all2'].includes(value),`${path}: notice for ${value}`);
    assert.equal(r.external().length,value==='all2'?2:0,`${path}: analytics for ${value}`);
  }
  r=run(path,{values:{'bq-consent':'all'}});
  r.notice().querySelector('.y').events.click();
  assert.equal(r.store.get('bq-consent'),'all2');
  assert.ok(r.cookies.includes('bq-consent=all2; Domain=.beequation.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure'));
  assert.equal(r.notice(),undefined);
  assert.equal(r.external().length,2,'both analytics load after explicit consent');
  r.emit();r.emit();assert.equal(r.external().length,2,'once per page');
  assert.match(r.external()[0].src,/^https:\/\/www.googletagmanager.com\/gtm\.js\?id=GTM-W9MNXL3Z$/);
  const metric=r.external()[1], visits=[];
  assert.equal(metric.src,'https://tracker.metricool.com/resources/be.js');
  r.context.beTracker={t:value=>visits.push(value.hash)};
  metric.readyState='loading';metric.onreadystatechange();assert.equal(visits.length,0);
  metric.readyState='loaded';metric.onreadystatechange();metric.onload();
  assert.deepEqual(visits,['c337db956c4b6298e8a11c302d888802'],'only one Metricool visit');
  r.events.click.forEach(f=>f({target:{closest:()=>true}}));
  r.notice().querySelector('.n').events.click();
  assert.equal(r.store.get('bq-consent'),'basic');
  assert.equal(r.context['ga-disable-G-3YFSG10Q1W'],true);
  assert.equal(r.cookies.filter(c=>c.startsWith('_ga')).length,12,'GA cookies deleted on reopening and decline');
  r.emit();metric.onload();assert.equal(r.external().length,2);assert.equal(visits.length,1);
  r.events.click.forEach(f=>f({target:{closest:()=>true}}));
  r.notice().querySelector('.y').events.click();
  assert.equal(r.context['ga-disable-G-3YFSG10Q1W'],false,'allow again re-enables GA without reloading scripts');
  assert.equal(r.external().length,2);
  r=run(path,{values:{'bq-consent':'all2'}});
  const pending=r.external()[1];let sent=0;r.context.beTracker={t:()=>sent++};
  r.events.click.forEach(f=>f({target:{closest:()=>true}}));r.notice().querySelector('.n').events.click();
  pending.onload();assert.equal(sent,0,'decline before script completes prevents visit');
}
// Layout measurement is supplied at the DOM boundary; exercise actual padding/focus handling.
r=run('support.html');
assert.equal(r.body.style.paddingBottom,'calc(0px + 120px)');
const obscured={getBoundingClientRect:()=>({top:570,bottom:600})};
r.context.document.activeElement=obscured;
r.windowEvents.resize();assert.deepEqual(r.scrolls,[61],'resize keeps focused content above the strip');
r.events.focusin[0]({target:obscured});assert.equal(r.scrolls.length,2);
r.events.focusin[0]({target:r.notice().querySelector('.n')});assert.equal(r.scrolls.length,2,'never scroll away from consent buttons');
r.notice().querySelector('.n').events.click();
assert.equal(r.body.style.paddingBottom,undefined,'restore page padding');assert.equal(r.events.focusin.length,0);assert.equal(r.windowEvents.resize,undefined);
for(const hostname of ['localhost','beequation.test','evilbeequation.com','beequation.com.evil.test']) {
  r=run('support.html',{hostname,cookie:'bq-consent=all2'});assert.ok(r.notice());
  r.notice().querySelector('.y').events.click();assert.equal(r.cookies.length,0);assert.equal(r.external().length,0);
}
r=run('support.html',{protocol:'http:'});r.notice().querySelector('.y').events.click();
assert.ok(r.cookies.some(c=>c.startsWith('bq-consent=all2;')&&!c.includes('Secure')));
r=run('support.html',{blocked:true});r.banner().children[1].events.click();assert.equal(r.banner(),undefined);
r=run('support.html',{search:'?lang=en'});assert.equal(r.banner(),undefined);assert.equal(r.store.get('bq-lang'),'en');
assert.equal(run('support.html',{values:{'bq-lang':'en'}}).banner(),undefined);
assert.equal(run('support.html',{languages:['en-GB','fr']}).banner(),undefined);
assert.equal(run('support.html',{languages:['zz-ZZ']}).banner(),undefined);
assert.equal(run('support.html',{languages:['zz-ZZ','fr']}).banner().lang,'fr');
for(const saved of ['constructor','__proto__','toString','xx']) assert.equal(run('support.html',{values:{'bq-lang':saved}}).banner().lang,'fr');
for(const code of ['fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko']) {
  r=run('support.html',{languages:[code]});
  assert.equal(r.banner().children[0].href,`https://${code}.beequation.com/support.html`);
  assert.ok(r.banner().children.every(x=>x.textContent.length>0));
}
for(const code of ['nb-NO','nn-NO']) assert.equal(run('learn/mental-maths-strategies.html',{languages:[code]}).banner().children[0].href,'https://no.beequation.com/learn/mental-maths-strategies.html');
assert.equal(run('learn/years/year-1.html').banner().children[0].href,'https://fr.beequation.com/learn/');
for(const path of ['play.html',...['fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko'].map(c=>`dist/${c}/play.html`)]) {
  r=run(path,{values:{'bq-consent':'all2'}});assert.equal(r.external().length,0);assert.equal(script(source(path),'ga'),undefined);assert.equal(script(source(path),'consent'),undefined);
}
r=run('play.html');assert.equal(r.banner().children[0].href,'https://fr.beequation.com/play.html');assert.equal(r.external().length,0);
console.log('PASS: generated JavaScript, all 14 suggestions, no redirect, dismissal/revisit, blocked storage, explicit English, locale fallback, GA + Metricool consent, migration, once per page, callbacks, revocation, all 15 sites');
