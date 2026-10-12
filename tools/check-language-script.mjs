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
  constructor(tag) { this.tagName=tag.toUpperCase(); this.children=[]; this.attrs={}; this.events={}; }
  appendChild(child) { this.children.push(child); child.parent=this; }
  insertBefore(child, sibling) { const i=this.children.indexOf(sibling); this.children.splice(i<0?0:i,0,child); child.parent=this; }
  insertAdjacentElement(where,child) { assert.equal(where,'afterend'); const i=this.parent.children.indexOf(this); this.parent.children.splice(i+1,0,child); child.parent=this.parent; }
  setAttribute(key,value) {this.attrs[key]=value;}
  addEventListener(key,callback) {this.events[key]=callback;}
  remove() {this.parent.children.splice(this.parent.children.indexOf(this),1);}
}
function run(path, {languages=['fr-FR'], values={}, blocked=false, search='', hash=''}={}) {
  const html=source(path), store=new Map(Object.entries(values)), head=new Element('head'), body=new Element('body');
  const header=new Element('header'); header.id='bqh'; body.appendChild(header);
  const events={}, redirects=[];
  const document={head,body,createElement:tag=>new Element(tag),getElementById:id=>id==='bqh'?header:null,
    addEventListener:(name,f)=>{events[name]=f;}};
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  const context={document,navigator:{languages},location:{search,hash,replace:url=>redirects.push(url),pathname:'/'+path},URLSearchParams};
  Object.defineProperty(context,'localStorage',{get(){if(blocked)throw Error('storage denied');return storage;}});
  context.window=context;
  vm.createContext(context);
  const code=script(html, before?'lang-redirect':'lang-suggestion');
  if(code)vm.runInContext(code,context);
  const ga=script(html,'ga'); if(ga)vm.runInContext(ga,context);
  return {store,head,body,events,redirects,context,banner:()=>body.children.find(x=>x.id==='bq-language-suggestion')};
}
let r=run('support.html',{search:'?from=test',hash:'#help'});
assert.deepEqual(r.redirects,[], 'English page must not redirect');
assert.equal(r.banner().lang,'fr');
assert.equal(r.banner().children[0].href,'https://fr.beequation.com/support.html?from=test#help');
assert.equal(r.head.children.length,0,'no external scripts before consent');
r.banner().children[1].events.click();
assert.equal(r.banner(),undefined);
assert.equal(r.store.get('bq-lang-dismissed'),'yes');
assert.equal(run('support.html',{values:Object.fromEntries(r.store)}).banner(),undefined);
for (const values of [{}, {'bq-consent':'basic'}, {'bq-consent':'no'}]) {
  r=run('support.html',{values});
  assert.equal(r.head.children.length,0,'no analytics without opt-in');
}
r=run('support.html',{values:{'bq-consent':'no'}});r.banner().children[1].events.click();
assert.equal(r.store.has('bq-lang-dismissed'),false,'respect legacy no-storage preference');
r=run('support.html',{values:{'bq-consent':'all'}});
assert.equal(r.head.children.length,1);
assert.match(r.head.children[0].src,/^https:\/\/www.googletagmanager.com\/gtag\/js/);
r=run('support.html');r.store.set('bq-consent','all');r.events['bq-consent']();
assert.equal(r.head.children.length,1,'analytics loads after explicit consent event');
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
r=run('play.html');assert.equal(r.banner().children[0].href,'https://fr.beequation.com/play.html');assert.equal(r.head.children.length,0);
console.log('PASS: generated JavaScript, all 14 suggestions, no redirect, dismissal/revisit, blocked storage, explicit English, locale fallback, analytics opt-in');
