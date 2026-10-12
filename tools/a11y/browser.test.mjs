// Host-only acceptance checks. The sandbox must not launch Chrome.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {serveSite,auditState,playStates,reducedMotion} from './audit-pages.mjs';
const DEV='/Volumes/External SSD/Projects/devtools';
let browser,fixture,site,tmp,axeSource;
const hostTest=(name,fn)=>test(name,{skip:process.env.BQ_SKIP_BROWSER==='1'?'Chrome is unavailable in this sandbox; run on the host':false},fn);
before(async()=>{
  if(process.env.BQ_SKIP_BROWSER==='1')return;
  const puppeteer=createRequire(path.join(DEV,'tools/shots/package.json'))('puppeteer-core');
  browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-browser-'));
  await fs.writeFile(path.join(tmp,'index.html'),`<!doctype html><html lang="en"><head><title>Audit fixture</title><style>
  body{margin:0;background:white;color:black} @media(prefers-color-scheme:dark){body{background:black;color:white}}
  .wide{width:700px} .clip{width:60px;height:25px;white-space:nowrap;overflow:hidden}
  button:focus-visible{outline:3px solid red} #nofocus:focus-visible{outline:none;box-shadow:none}
  .overlap{position:absolute;top:200px;left:0}
  </style></head><body><main><h1>Audit fixture</h1><p class="wide">Wide content</p><p class="clip">Clipped words with spacing</p>
  <details><summary>Closed details</summary><a id="closed-link" href="#">Hidden link</a><p>Hidden text</p></details>
  <div style="display:none"><button id="display-hidden">Hidden button</button></div>
  <div hidden><button id="hidden-button">Hidden button</button></div><div inert><button id="inert-button">Inert button</button></div>
  <div style="visibility:hidden"><button id="visibility-hidden">Hidden button</button></div>
  <dialog><button id="closed-dialog">Hidden button</button></dialog>
  <div style="position:fixed;left:-600px"><button id="offscreen">Offscreen button</button></div>
  <h2 id="landmark" tabindex="-1">Programmatic focus target</h2><button id="focus">Visible focus</button><button id="nofocus">No focus indicator</button><div id="unreachable" role="button">Not keyboard reachable</div>
  <p class="overlap">Overlapping first sentence</p><p class="overlap">Overlapping second sentence</p></main></body></html>`);
  fixture=await serveSite(tmp);site=await serveSite(process.cwd());
  axeSource=await fs.readFile(path.join(DEV,'tools/a11y/node_modules/axe-core/axe.min.js'),'utf8');
});
after(async()=>{if(browser)await browser.close();if(fixture)await fixture.close();if(site)await site.close();if(tmp)await fs.rm(tmp,{recursive:true,force:true});});
async function newPage(origin,width=320,scheme='light') {
  const ctx=await browser.createBrowserContext();const page=await ctx.newPage();
  await page.setViewport({width,height:640});
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(origin+'/')||/^(data:|about:|blob:)/.test(r.url())?r.continue():r.abort());
  return {ctx,page};
}
hostTest('real browser detects reflow, clipped and overlapping text, unreachable controls and missing focus',async()=>{
  const {ctx,page}=await newPage(fixture.origin);
  try {
    await page.goto(fixture.origin+'/');
    const result=await auditState(page,{lang:'en',path:'/',state:'page',width:320,height:640,scheme:'light'},axeSource);
    const ids=result.findings.map(f=>f.id);
    for(const id of ['reflow-horizontal-scroll','text-spacing-clipped','text-spacing-overlap-review','keyboard-unreachable','focus-indicator-review'])assert.ok(ids.includes(id),id);
    assert.deepEqual(result.findings.find(f=>f.id==='keyboard-unreachable').nodes.map(n=>n.target[0]),['#unreachable']);
    const focus=result.findings.find(f=>f.id==='focus-indicator-review');
    assert.ok(focus.nodes.some(n=>n.target.includes('#nofocus')));
    assert.ok(!focus.nodes.some(n=>n.target.includes('#focus')));
    assert.equal(await page.$eval('.clip',e=>getComputedStyle(e).letterSpacing),'normal','spacing override is removed');
  } finally {await ctx.close();}
});
hostTest('real browser applies both color schemes',async()=>{
  for(const [scheme,want]of [['light','rgb(255, 255, 255)'],['dark','rgb(0, 0, 0)']]) {
    const {ctx,page}=await newPage(fixture.origin,1280,scheme);
    try {await page.goto(fixture.origin+'/');assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),want);} finally {await ctx.close();}
  }
});
hostTest('private Indie scheduler is explicitly skipped; exposed scheduler producing a bee fails',async()=>{
  const {ctx,page}=await newPage(fixture.origin);
  try {
    await page.goto(fixture.origin+'/');assert.equal((await reducedMotion(page)).status,'skipped');
    await page.evaluate(()=>{window.__bqBeeAuditScheduler=ms=>{if(ms!==30000)throw Error('wrong interval');const bee=document.createElement('div');bee.className='bq-bee';document.body.append(bee);bee.remove();};});
    assert.equal((await reducedMotion(page)).status,'failed','transient bees count as an appearance');
  } finally {await ctx.close();}
});
hostTest('real play page reaches all six states by clicking its data attributes',async()=>{
  const {ctx,page}=await newPage(site.origin,1280);
  try {
    await page.goto(site.origin+'/play.html');const states=[];
    await playStates(page,async state=>{states.push(state);});
    assert.deepEqual(states,['choose','kids-home','kids-game','result','pro-home','pro-game']);
  } finally {await ctx.close();}
});

hostTest('site header fits enlarged text/spacing and accessibility dialog keeps keyboard behavior',async()=>{
  for(const width of [320,1280,1600]) {
    const {ctx,page}=await newPage(site.origin,width);
    try {
      await page.goto(site.origin+'/');
      for(const text of [100,125,150])for(const spacing of [false,true]) {
        await page.evaluate(({text,spacing})=>{window.bqA11y.text=text;window.bqA11y.spacing=spacing;window.bqApplyA11y();document.dispatchEvent(new Event('bq-a11y'));},{text,spacing});
        const fit=await page.evaluate(()=>{const p=document.querySelector('.bqh-pill'),r=p.getBoundingClientRect();return [...p.querySelectorAll('a,button,summary')].filter(e=>e.getClientRects().length&&!e.closest('.bqh-panel,details:not([open]) .langs')).every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right;});});
        assert.ok(fit,`header ${width}px ${text}% spacing ${spacing}`);
      }
      await page.evaluate(()=>{window.bqA11y.text=100;window.bqA11y.spacing=false;window.bqApplyA11y();document.dispatchEvent(new Event('bq-a11y'));});
      const compact=await page.$eval('#bqh',e=>e.classList.contains('bqh-compact'));
      if(compact)await page.click('.bqh-hive');
      const trigger=compact?'.bqm [data-bq-a11y-open]':'.bqh-pill [data-bq-a11y-open]';
      await page.click(trigger);
      assert.equal(await page.$eval('#bq-a11y',e=>e.open),true);
      if(width>=600)assert.equal(await page.evaluate(selector=>Math.round(document.querySelector('#bq-a11y').getBoundingClientRect().top-document.querySelector(selector).getBoundingClientRect().bottom),trigger),8);
      await page.focus('[data-a11y-close]');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'bq-a11y-size');
      await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-a11y-close')),true);
      await page.keyboard.press('Escape');assert.equal(await page.$eval('#bq-a11y',e=>e.open),false);assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-bq-a11y-open')),true);
    }finally{await ctx.close();}
  }
});
hostTest('Easy Read keeps 20px text, 1.6 leading and 48px pictures at 320px',async()=>{
  const {ctx,page}=await newPage(site.origin);
  try {
    for(const slug of ['how-to-play','privacy','terms']) {
      await page.goto(site.origin+'/easy-read/'+slug+'.html');
      const sizes=await page.$$eval('.easy-point',rows=>rows.map(r=>{const p=r.querySelector('p'),s=getComputedStyle(p),pic=r.querySelector('svg,img').getBoundingClientRect();return {font:parseFloat(s.fontSize),line:parseFloat(s.lineHeight)/parseFloat(s.fontSize),pic:pic.width,right:p.getBoundingClientRect().right,points:r.querySelectorAll('p').length};}));
      for(const v of sizes){assert.ok(v.font>=20);assert.ok(v.line>=1.6);assert.equal(v.pic,48);assert.ok(v.right<=320);assert.equal(v.points,1);}
    }
  }finally{await ctx.close();}
});
