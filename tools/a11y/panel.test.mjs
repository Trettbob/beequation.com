import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture(width=1280) {
  const handlers=new Map(),node=(name)=>({name,dataset:{},style:{},isConnected:true,inert:false,disabled:false,addEventListener(k,f){handlers.set(name+':'+k,f);},focus(){doc.activeElement=this;},getClientRects:()=>[{}],getBoundingClientRect:()=>({left:850,right:1000,top:20,bottom:64,width:150,height:44})});
  const opener=node('opener'),hive=node('hive'),select=node('select'),reset=node('reset'),close=node('close'),dialog=node('dialog');
  dialog.getBoundingClientRect=()=>({width:480,height:500});dialog.querySelector=k=>k==='select'?select:k==='[data-a11y-reset]'?reset:close;
  dialog.querySelectorAll=k=>k==='[data-a11y]'?[select]:[select,reset,close];select.dataset.a11y='text';
  dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;handlers.get('dialog:close')?.();};
  dialog.setAttribute=(k,v)=>{dialog[k]=v;};opener.closest=()=>null;
  const doc={activeElement:null,documentElement:{classList:{contains:()=>false}},getElementById:()=>dialog,querySelectorAll:()=>[opener],querySelector:()=>hive,addEventListener(){},dispatchEvent(){}};
  const win={bqA11y:{text:100},bqApplyA11y(){},innerWidth:width,innerHeight:800,addEventListener(k,f){handlers.set('window:'+k,f);}};
  vm.runInNewContext(fs.readFileSync('assets/accessibility.js','utf8'),{window:win,document:doc,innerWidth:width,innerHeight:800,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},Event:class{},getComputedStyle:()=>({display:'block',visibility:'visible'}),requestAnimationFrame:f=>f()});
  return {dialog,opener,select,reset,close,hive,doc,emit:(name,e={})=>handlers.get(name)?.(e)};
}
test('wide accessibility dialog anchors below the button; phones use a bottom sheet',()=>{
  const f=fixture();f.emit('opener:click');assert.equal(f.dialog.style.top,'72px');assert.equal(f.dialog['data-placement'],'anchor');assert.equal(f.doc.activeElement,f.select);
  const phone=fixture(320);phone.emit('opener:click');assert.equal(phone.dialog['data-placement'],'sheet');
});
test('dialog traps Tab, closes on Esc and returns focus to the opener or visible menu trigger',()=>{
  const f=fixture();f.emit('opener:click');f.doc.activeElement=f.close;let prevented=false;
  f.emit('dialog:keydown',{key:'Tab',preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(f.doc.activeElement,f.select);
  f.emit('dialog:keydown',{key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(f.doc.activeElement,f.close);
  f.emit('dialog:keydown',{key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(f.dialog.open,false);assert.equal(f.doc.activeElement,f.opener);
  f.emit('opener:click');f.opener.getClientRects=()=>[];f.emit('close:click');assert.equal(f.doc.activeElement,f.hive);
});
test('closing after a drawer becomes a wide header returns focus to the wide accessibility trigger',()=>{
  const f=fixture(),wide={isConnected:true,getBoundingClientRect:()=>({left:850,right:1000,top:20,bottom:64}),getClientRects:()=>[{}],focus(){f.doc.activeElement=this;}};
  f.opener.getClientRects=()=>[];f.hive.getClientRects=()=>[];
  f.doc.querySelector=selector=>selector.includes('data-bq-a11y-open')?wide:f.hive;
  f.emit('opener:click');f.emit('close:click');assert.equal(f.doc.activeElement,wide);
});
test('a wide-screen drawer trigger still anchors the accessibility dialog below its button',()=>{
  const f=fixture();f.opener.closest=()=>({});f.emit('opener:click');assert.equal(f.dialog['data-placement'],'anchor');assert.equal(f.dialog.style.top,'72px');
});
