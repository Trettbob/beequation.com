import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('header measures all full-layout content and switches when it cannot fit',()=>{
  const source=fs.readFileSync('assets/header-fit.js','utf8'),classes=new Set();
  let width=1200,required=1100;
  const pill={scrollWidth:0,clientWidth:0,getBoundingClientRect:()=>({left:16,right:width+16}),querySelector:()=>null,querySelectorAll:()=>[{getBoundingClientRect:()=>({left:16,right:required+16,width:required})},{getBoundingClientRect:()=>({left:0,right:0,width:0})}]};
  const h={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},querySelector:()=>pill};
  const c={window:{innerWidth:1280},getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0'})};vm.runInNewContext(source,c);
  assert.equal(c.window.bqHeaderFits(h),true);
  required=1300;assert.equal(c.window.bqHeaderFits(h),false);
  required=1450;width=1500;c.window.innerWidth=1600;assert.equal(c.window.bqHeaderFits(h),true);
  c.window.innerWidth=320;assert.equal(c.window.bqHeaderFits(h),false);
  assert.ok(!classes.has('bqh-measuring'),'temporary measurement state is removed');
});
