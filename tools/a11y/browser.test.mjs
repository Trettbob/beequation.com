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
before(async()=>{
  const puppeteer=createRequire(path.join(DEV,'tools/shots/package.json'))('puppeteer-core');
  browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-browser-'));
  await fs.writeFile(path.join(tmp,'index.html'),`<!doctype html><html lang="en"><head><title>Audit fixture</title><style>
  body{margin:0;background:white;color:black} @media(prefers-color-scheme:dark){body{background:black;color:white}}
  .wide{width:700px} .clip{width:60px;height:25px;white-space:nowrap;overflow:hidden}
  button:focus-visible{outline:3px solid red} #nofocus:focus-visible{outline:none;box-shadow:none}
  .overlap{position:absolute;top:200px;left:0}
  </style></head><body><main><h1>Audit fixture</h1><p class="wide">Wide content</p><p class="clip">Clipped words with spacing</p>
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
test('real browser detects reflow, clipped and overlapping text, unreachable controls and missing focus',async()=>{
  const {ctx,page}=await newPage(fixture.origin);
  try {
    await page.goto(fixture.origin+'/');
    const result=await auditState(page,{lang:'en',path:'/',state:'page',width:320,height:640,scheme:'light'},axeSource);
    const ids=result.findings.map(f=>f.id);
    for(const id of ['reflow-horizontal-scroll','text-spacing-clipped','text-spacing-overlap-review','keyboard-unreachable','focus-indicator-review'])assert.ok(ids.includes(id),id);
    assert.ok(!result.findings.find(f=>f.id==='keyboard-unreachable').nodes.some(n=>n.target.includes('#landmark')));
    const focus=result.findings.find(f=>f.id==='focus-indicator-review');
    assert.ok(focus.nodes.some(n=>n.target.includes('#nofocus')));
    assert.ok(!focus.nodes.some(n=>n.target.includes('#focus')));
    assert.equal(await page.$eval('.clip',e=>getComputedStyle(e).letterSpacing),'normal','spacing override is removed');
  } finally {await ctx.close();}
});
test('real browser applies both color schemes',async()=>{
  for(const [scheme,want]of [['light','rgb(255, 255, 255)'],['dark','rgb(0, 0, 0)']]) {
    const {ctx,page}=await newPage(fixture.origin,1280,scheme);
    try {await page.goto(fixture.origin+'/');assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),want);} finally {await ctx.close();}
  }
});
test('private Indie scheduler is explicitly skipped; exposed scheduler producing a bee fails',async()=>{
  const {ctx,page}=await newPage(fixture.origin);
  try {
    await page.goto(fixture.origin+'/');assert.equal((await reducedMotion(page)).status,'skipped');
    await page.evaluate(()=>{window.__bqBeeAuditScheduler=ms=>{if(ms!==30000)throw Error('wrong interval');const bee=document.createElement('div');bee.className='bq-bee';document.body.append(bee);bee.remove();};});
    assert.equal((await reducedMotion(page)).status,'failed','transient bees count as an appearance');
  } finally {await ctx.close();}
});
test('real play page reaches all six states by clicking its data attributes',async()=>{
  const {ctx,page}=await newPage(site.origin,1280);
  try {
    await page.goto(site.origin+'/play.html');const states=[];
    await playStates(page,async state=>{states.push(state);});
    assert.deepEqual(states,['choose','kids-home','kids-game','result','pro-home','pro-game']);
  } finally {await ctx.close();}
});
