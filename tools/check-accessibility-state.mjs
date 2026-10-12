// Execute the real settings scripts at their DOM/storage boundary. Layout still needs Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=name=>fs.readFileSync(new URL('../assets/'+name,import.meta.url),'utf8');
function run({values={},reduced=false,blocked=false,phone=false}={}){
 const classes=new Set(),store=new Map(Object.entries(values)),documentEvents={},windowEvents={},mediaEvents={};
 const root={classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains(k){return classes.has(k);}}};
 if(phone)classes.add('bqm-open');
 const localStorage={getItem(k){if(blocked)throw new Error('blocked');return store.get(k)??null;},setItem(k,v){if(blocked)throw new Error('blocked');store.set(k,v);},removeItem(k){if(blocked)throw new Error('blocked');store.delete(k);}};
 const controls=['text','font','spacing','contrast','motion'].map((key,i)=>({dataset:{a11y:key},type:i?'checkbox':'select',id:i?'':'bq-a11y-size',disabled:false,getClientRects(){return [1];},focus(){document.activeElement=this;}}));
 const actions=['reset','close'].map(key=>({events:{},addEventListener(k,f){this.events[k]=f;},focus(){document.activeElement=this;},getClientRects(){return [1];}}));
 const trigger={events:{},isConnected:true,addEventListener(k,f){this.events[k]=f;},focus(){document.activeElement=this;}};
 const dialog={inert:phone,open:false,events:{},querySelector(selector){if(selector==='select')return controls[0];return actions[selector.includes('reset')?0:1];},querySelectorAll(selector){return selector==='[data-a11y]'?controls:[...controls,...actions];},addEventListener(k,f){this.events[k]=f;},showModal(){assert.equal(this.inert,false,'phone drawer must not leave the dialog explicitly inert');this.open=true;},close(){this.open=false;this.events.close();}};
 const document={documentElement:root,activeElement:null,getElementById(){return dialog;},querySelectorAll(){return [trigger];},addEventListener(k,f){documentEvents[k]=f;},dispatchEvent(e){documentEvents[e.type]?.(e);}};
 const media={matches:reduced,addEventListener(k,f){mediaEvents[k]=f;}};
 const context={document,localStorage,matchMedia(){return media;},Event:class{constructor(type){this.type=type;}},addEventListener(k,f){windowEvents[k]=f;}};
 context.window=context;vm.createContext(context);vm.runInContext(source('accessibility-head.js'),context);vm.runInContext(source('accessibility.js'),context);
 return {context,dialog,trigger,controls,actions,classes,store,document,documentEvents,mediaEvents};
}
for(const blocked of [false,true]){
 const r=run({blocked,phone:true});r.trigger.events.click();assert.equal(r.dialog.open,true);assert.equal(r.document.activeElement,r.controls[0]);
 r.controls[0].value='150';r.dialog.events.change({target:r.controls[0]});assert.ok(r.classes.has('bq-text-150'));
 for(const c of r.controls.slice(1)){c.checked=true;r.dialog.events.change({target:c});assert.ok(r.classes.has('bq-'+c.dataset.a11y));}
 if(!blocked)assert.equal(JSON.parse(r.store.get('bq-a11y')).text,150);
 r.actions[1].focus();let prevented=false;r.dialog.events.keydown({key:'Tab',preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(r.document.activeElement,r.controls[0]);
 r.actions[0].events.click();assert.equal(r.context.bqA11y.text,100);assert.equal(r.context.bqA11y.motion,false);
 r.dialog.events.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(r.dialog.open,false);assert.equal(r.document.activeElement,r.trigger);assert.equal(r.dialog.inert,true);
}
for(const value of ['bad json','null','[]','"text"'])assert.equal(run({values:{'bq-a11y':value}}).context.bqA11y.text,100);
const saved=run({values:{'bq-a11y':JSON.stringify({text:125,font:true,motion:false})},reduced:true});assert.ok(saved.classes.has('bq-text-125'));assert.ok(saved.classes.has('bq-font'));assert.ok(!saved.classes.has('bq-motion'));
const reduced=run({reduced:true});assert.ok(reduced.classes.has('bq-motion'));reduced.actions[0].events.click();assert.equal(reduced.context.bqA11y.motion,true);
const no=run({values:{'bq-consent':'no','bq-a11y':JSON.stringify({text:150})}});assert.equal(no.context.bqA11y.text,100);no.controls[0].value='125';no.dialog.events.change({target:no.controls[0]});assert.ok(!no.store.has('bq-a11y'));
saved.store.set('bq-consent','no');saved.documentEvents['bq-consent']();assert.ok(!saved.store.has('bq-a11y'));
console.log('PASS: settings scripts — saved/invalid/blocked storage, no-storage consent, reset/reduced motion, instant classes, phone inert handling, focus return and Tab/Esc handlers (DOM boundary; browser layout unverified).');
