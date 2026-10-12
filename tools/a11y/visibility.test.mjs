import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as audit from './audit-pages.mjs';

// Geometry and style inputs model the browser boundary; the production visibility
// and overlap decisions run unchanged, including ancestor traversal and clipping.
function environment() {
  const doc={elementFromPoint:()=>null};
  const c={window:{},document:doc,innerWidth:320,innerHeight:640,getComputedStyle:e=>({display:'block',visibility:'visible',opacity:'1',overflowX:'visible',overflowY:'visible',contentVisibility:'visible',...e.style})};
  vm.runInNewContext(`(${audit.installAuditHelpers})()`,c);
  return {a:c.window.__bqAuditHelpers,doc};
}
function element(tag='div',attrs={},parent=null,box={left:10,top:10,right:100,bottom:30}) {
  const e={localName:tag,parentElement:parent,style:{},children:[],hasAttribute:k=>k in attrs,getAttribute:k=>attrs[k]??null,getBoundingClientRect:()=>({...box,width:box.right-box.left,height:box.bottom-box.top}),contains(x){for(;x;x=x.parentElement)if(x===this)return true;return false;}};
  parent?.children.push(e);return e;
}
test('closed details admit only the first summary and its children; open details admit content',()=>{
  assert.equal(typeof audit.installAuditHelpers,'function');
  const {a}=environment(),d=element('details'),s=element('summary',{},d),icon=element('span',{},s),link=element('a',{},d);
  assert.equal(a.visible(icon),true);assert.equal(a.visible(link),false);
  const open=element('details',{open:''});assert.equal(a.visible(element('a',{},open)),true);
});
test('ancestor hidden/inert/style, closed dialog/popover and off-viewport controls are excluded',()=>{
  const {a}=environment();
  for(const attrs of [{hidden:''},{inert:''}])assert.equal(a.visible(element('button',{},element('div',attrs))),false);
  for(const style of [{display:'none'},{visibility:'hidden'},{opacity:'0'},{contentVisibility:'hidden'}]){const p=element();p.style=style;assert.equal(a.visible(element('button',{},p)),false);}
  assert.equal(a.visible(element('button',{},element('dialog'))),false);
  const menu=element('div',{popover:''});menu.matches=()=>false;assert.equal(a.visible(element('button',{},menu)),false);
  assert.equal(a.visible(element('button',{},null,{left:350,top:10,right:400,bottom:40})),false);
  assert.equal(a.visible(element('button',{},null,{left:10,top:700,right:100,bottom:730})),false);
  const panel=element('div',{},null,{left:0,top:0,right:50,bottom:50});panel.style.overflowX='hidden';
  assert.equal(a.visible(element('button',{},panel,{left:60,top:10,right:90,bottom:30})),false);
  assert.equal(a.visible(element('button')),true);
});
test('text intersections exclude containment and occluding layers but retain real text collisions',()=>{
  const {a,doc}=environment(),one=element('p'),two=element('p'),r=one.getBoundingClientRect();
  doc.elementFromPoint=()=>one;
  assert.equal(a.overlap(one,r,two,r),true);
  assert.equal(a.overlap(one,r,element('span',{},one),r),false);
  const layer=element('aside');doc.elementFromPoint=()=>layer;
  assert.equal(a.overlap(one,r,two,r),false);
  layer.contains=x=>x===two;doc.elementFromPoint=()=>two;
  one.parentElement=element('main');two.parentElement=layer;layer.style.position='fixed';
  assert.equal(a.overlap(one,r,two,r),false,'text below an opaque fixed note is not a text collision');
  assert.equal(a.overlap(one,r,two,{...r,left:110,right:200}),false);
});
test('focus review recognizes SVG strokes and background changes while retaining missing indicators',()=>{
  const {a}=environment();
  const plain=['none','0px','rgb(0, 0, 0)','none','none','rgb(255, 255, 255)','rgb(0, 0, 0)','rgb(0, 0, 0)','none','1px'];
  assert.equal(a.indication([plain],[plain]),false);
  const stroke=[...plain];stroke[8]='rgb(255, 176, 32)';stroke[9]='5px';assert.equal(a.indication([plain,plain],[plain,stroke]),true);
  const background=[...plain];background[5]='rgb(58, 66, 86)';assert.equal(a.indication([plain],[background]),true);
});
test('layout clipping requires overflowing text, not decoration widening the scroll area',()=>{
  const p=element('p');p.id='clip';p.outerHTML='<p id="clip">Visible text</p>';p.textContent='Visible text';p.style.overflowX='hidden';p.clientWidth=90;p.clientHeight=20;p.scrollWidth=180;p.scrollHeight=20;
  p.closest=()=>null;p.querySelectorAll=()=>[];
  const text={nodeType:3,textContent:'Visible text',rect:{left:10,top:10,right:180,bottom:30,width:170,height:20}};p.childNodes=[text];
  const c={window:{},document:{body:{querySelectorAll:()=>[p]},createRange:()=>({selectNodeContents(n){this.n=n;},getClientRects(){return [this.n.rect];}})},innerWidth:320,innerHeight:640,Node:{TEXT_NODE:3},CSS:{escape:s=>s},getComputedStyle:e=>({display:'block',visibility:'visible',opacity:'1',overflowX:'visible',overflowY:'visible',...e.style})};
  vm.runInNewContext(`(${audit.installAuditHelpers})()`,c);
  assert.ok(vm.runInNewContext(`(${audit.inspectLayout})(true)`,c).some(f=>f.id==='text-spacing-clipped'));
  text.rect.right=80;text.rect.width=70;
  assert.equal(vm.runInNewContext(`(${audit.inspectLayout})(true)`,c).length,0,'decorative scroll overflow has no clipped text');
});
