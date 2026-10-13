// Dependency-free execution check for generated suggestion/analytics scripts.
// A small DOM boundary records actual script output; layout needs the browser check.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const before = process.argv.includes('--before');
// India's preview sites (not live yet, so no page offers them): their own pages are checked once built.
const PREVIEW = before ? [] : ['in','hi'].filter(c => existsSync(resolve(root, `dist/${c}/support.html`)));
function source(path) {
  return before ? execFileSync('git', ['show', `HEAD:${path}`], {cwd:root, encoding:'utf8'}) : readFileSync(resolve(root, path), 'utf8');
}
function script(html, marker) {
  const block = html.match(new RegExp(`<!--${marker}-->([\\s\\S]*?)<!--/${marker}-->`));
  return block?.[1].match(/<script>([\s\S]*?)<\/script>/)?.[1];
}
class Element {
  constructor(tag) { this.tagName=tag.toUpperCase(); this.children=[]; this.attrs={}; this.events={}; }
  appendChild(child) { this.children.push(child); child.parent=this; }
  insertBefore(child, sibling) { const i=this.children.indexOf(sibling); this.children.splice(i<0?0:i,0,child); child.parent=this; }
  insertAdjacentElement(where,child) { assert.equal(where,'afterend'); const i=this.parent.children.indexOf(this); this.parent.children.splice(i+1,0,child); child.parent=this.parent; }
  setAttribute(key,value) {this.attrs[key]=value;}
  addEventListener(key,callback) {this.events[key]=callback;}
  querySelector(selector) { this.parts??={}; return this.parts[selector]??=new Element(selector); }
  remove() {this.parent.children.splice(this.parent.children.indexOf(this),1);}
}
function run(path, {languages=['fr-FR'], values={}, blocked=false, search='', hash=''}={}) {
  const html=source(path), store=new Map(Object.entries(values)), head=new Element('head'), body=new Element('body');
  const header=new Element('header'); header.id='bqh'; body.appendChild(header);
  const events={}, redirects=[], cookies=[];
  const notice=()=>body.children.find(x=>x.className==='bq-ok');
  const document={head,body,createElement:tag=>new Element(tag),getElementById:id=>id==='bqh'?header:null,
    addEventListener:(name,f)=>{(events[name]??=[]).push(f);},
    dispatchEvent:event=>{for(const f of events[event.type]||[])f(event);},
    querySelector:selector=>selector==='.bq-ok'?notice():null};
  Object.defineProperty(document,'cookie',{get:()=> '_ga=test; _ga_3YFSG10Q1W=test',set:value=>cookies.push(value)});
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  const context={document,navigator:{languages},location:{search,hash,replace:url=>redirects.push(url),pathname:'/'+path,hostname:'beequation.com'},URLSearchParams,Event};
  Object.defineProperty(context,'localStorage',{get(){if(blocked)throw Error('storage denied');return storage;}});
  context.window=context;
  vm.createContext(context);
  const code=script(html, before?'lang-redirect':'lang-suggestion');
  if(code)vm.runInContext(code,context);
  const consent=script(html,'consent'); if(consent)vm.runInContext(consent,context);
  const ga=script(html,'ga'); if(ga)vm.runInContext(ga,context);
  return {store,head,body,events,redirects,context,cookies,notice,external:()=>head.children.filter(x=>x.tagName==='SCRIPT'),emit:()=>document.dispatchEvent(new Event('bq-consent')),banner:()=>body.children.find(x=>x.id==='bq-language-suggestion')};
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
for(const path of ['support.html', ...['fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko'].concat(PREVIEW).map(c=>`dist/${c}/support.html`)]) {
  for(const value of [undefined,'all','basic','no','all2']) {
    r=run(path,{values:value?{'bq-consent':value}:{}});
    assert.equal(!!r.notice(),!['basic','all2'].includes(value),`${path}: notice for ${value}`);
    assert.equal(r.external().length,value==='all2'?2:0,`${path}: analytics for ${value}`);
  }
  r=run(path,{values:{'bq-consent':'all'}});
  r.notice().querySelector('.y').events.click();
  assert.equal(r.store.get('bq-consent'),'all2');
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
  assert.equal(r.cookies.length,6,'GA cookies deleted on decline');
  r.emit();metric.onload();assert.equal(r.external().length,2);assert.equal(visits.length,1);
  r=run(path,{values:{'bq-consent':'all2'}});
  const pending=r.external()[1];let sent=0;r.context.beTracker={t:()=>sent++};
  r.events.click.forEach(f=>f({target:{closest:()=>true}}));r.notice().querySelector('.n').events.click();
  pending.onload();assert.equal(sent,0,'decline before script completes prevents visit');
}
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
for(const path of ['play.html',...['fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko'].concat(PREVIEW).map(c=>`dist/${c}/play.html`)]) {
  r=run(path,{values:{'bq-consent':'all2'}});assert.equal(r.external().length,0);assert.equal(script(source(path),'ga'),undefined);
}
r=run('play.html');assert.equal(r.banner().children[0].href,'https://fr.beequation.com/play.html');assert.equal(r.external().length,0);
if(!before){   // India: not offered until live; a bare 'in' (old Indonesian) never means India
  assert.equal(run('support.html',{languages:['en-IN']}).banner(),undefined,'no India banner before it is live');
  assert.equal(run('support.html',{languages:['hi-IN','hi']}).banner(),undefined,'no Hindi banner before it is live');
  assert.equal(run('support.html',{languages:['in-ID','fr']}).banner().lang,'fr');
}
console.log('PASS: generated JavaScript, all 14 suggestions, no redirect, dismissal/revisit, blocked storage, explicit English, locale fallback, GA + Metricool consent, migration, once per page, callbacks, revocation, all 15 sites'+(PREVIEW.length?` + previews ${PREVIEW.join(', ')}`:'')+', India not offered yet');
