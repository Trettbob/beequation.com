// Real-browser checks using the existing local Chrome and puppeteer-core; no downloads.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from '/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://bq-preview.invalid';
async function serve(req, external){
  if(req.url().startsWith('data:'))return req.continue();
  if(!req.url().startsWith(origin)){external.push(req.url());return req.abort();}
  let file=path.join(root,decodeURIComponent(new URL(req.url()).pathname));
  if(!file.startsWith(root+path.sep))return req.respond({status:403});
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file))return req.respond({status:404});
  const contentType=({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream';
  return req.respond({status:200,contentType,body:fs.readFileSync(file)});
}
let browser;
try{
 browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,pipe:true});
 const page=await browser.newPage();const external=[],errors=[];
 await page.setRequestInterception(true);
 page.on('request',req=>serve(req,external));
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1280,height:900});
 await page.goto(origin+'/privacy.html');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('bq-consent','basic');});
 await page.reload();
 const baseline=await page.$eval('main p',e=>parseFloat(getComputedStyle(e).fontSize));
 await page.click('.bqh-pill [data-bq-a11y-open]');
 assert.equal(await page.$eval('#bq-a11y',e=>e.open),true);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'bq-a11y-size');
 await page.select('#bq-a11y-size','150');
 assert.equal(await page.$eval('main p',e=>parseFloat(getComputedStyle(e).fontSize)),baseline*1.5);
 for(const key of ['font','spacing','contrast','motion'])await page.click(`[data-a11y="${key}"]`);
 assert.equal(await page.$eval('main p',e=>getComputedStyle(e).lineHeight),String(baseline*1.5*1.5)+'px');
 assert.equal(await page.$eval('main p',e=>getComputedStyle(e).letterSpacing),String(baseline*1.5*.12)+'px');
 await page.focus('[data-a11y-close]');await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'bq-a11y-size');
 await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');
 assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-a11y-close')),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.$eval('#bq-a11y',e=>e.open),false);
 assert.equal(await page.evaluate(()=>document.activeElement.matches('.bqh-pill [data-bq-a11y-open]')),true);
 // Persisted preferences must already be applied when the head script runs.
 await page.goto(origin+'/learn/topics/fractions.html');
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('bq-text-150')),true);
 assert.equal(await page.$eval('main [role="math"]',e=>!!e.getAttribute('aria-label')),true);
 assert.equal(await page.$eval('main p',e=>parseFloat(getComputedStyle(e).fontSize)),27);
 await page.click('.bqh-pill [data-bq-a11y-open]');await page.click('[data-a11y-reset]');
 assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('bq-text-150')),false);
 await page.keyboard.press('Escape');
 // The phone drawer's own modal/inert handling must not trap the settings dialog.
 await page.setViewport({width:390,height:844});await page.goto(origin+'/privacy.html');
 await page.click('.bqh-hive');await page.click('#bqm [data-bq-a11y-open]');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'bq-a11y-size');
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.matches('#bqm [data-bq-a11y-open]')),true);
 assert.equal(await page.$eval('#bqm',e=>e.hidden),false);
 await page.keyboard.press('Escape');assert.equal(await page.$eval('#bqm',e=>e.hidden),true);
 // Respect legacy no-storage consent; malformed or unavailable storage never breaks controls.
 await page.evaluate(()=>{localStorage.setItem('bq-consent','no');localStorage.setItem('bq-a11y',JSON.stringify({text:150,font:true}));});await page.reload();
 assert.equal(await page.evaluate(()=>window.bqA11y.text),100);
 await page.click('.bqh-hive');await page.click('#bqm [data-bq-a11y-open]');await page.select('#bq-a11y-size','125');
 assert.equal(await page.evaluate(()=>localStorage.getItem('bq-a11y')),null);
 await page.evaluate(()=>{localStorage.setItem('bq-consent','basic');localStorage.setItem('bq-a11y','bad json');});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.reload();
 assert.equal(await page.evaluate(()=>window.bqA11y.motion),true);
 const blocked=await browser.newPage();await blocked.setViewport({width:1280,height:900});await blocked.setRequestInterception(true);blocked.on('request',req=>serve(req,external));await blocked.evaluateOnNewDocument(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});
 await blocked.goto(origin+'/privacy.html');await blocked.click('.bqh-pill [data-bq-a11y-open]');await blocked.select('#bq-a11y-size','125');
 assert.equal(await blocked.evaluate(()=>window.bqA11y.text),125);await blocked.close();
 // Check every locale, small viewport, dark contrast, and each local Easy Read destination.
 // plus India's preview sites once built (dist/in, dist/hi)
 for(const code of ['en','fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko',...['in','hi'].filter(c=>fs.existsSync(path.join(root,'dist',c,'privacy.html')))]){
  const prefix=code==='en'?'':'/dist/'+code;
  await page.goto(origin+prefix+'/easy-read/privacy.html');
  await page.evaluate(()=>{localStorage.setItem('bq-consent','basic');});
  await page.click('.bqh-hive');await page.click('#bqm [data-bq-a11y-open]');
  await page.select('#bq-a11y-size','150');
  await page.$eval('[data-a11y="spacing"]',e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.$eval('[data-a11y="contrast"]',e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);
  const colors=await page.$eval('main p',e=>({color:getComputedStyle(e).color,body:getComputedStyle(document.body).backgroundColor}));
  assert.deepEqual(colors,{color:'rgb(255, 255, 255)',body:'rgb(0, 0, 0)'});
  assert.equal(await page.$eval('#bq-a11y',e=>e.scrollWidth<=e.clientWidth),true,'dialog fits '+code);
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow '+code);
  for(const slug of ['how-to-play','terms']){await page.goto(origin+prefix+'/easy-read/'+slug+'.html');assert.ok(await page.$('.easy-point'));}
  await page.setViewport({width:1000,height:900});await page.goto(origin+prefix+'/privacy.html');
  assert.equal(await page.$eval('.bqh-pill',e=>e.scrollWidth<=e.clientWidth),true,'wide header fits '+code);
  await page.setViewport({width:390,height:844});
  await page.goto(origin+prefix+'/play.html');assert.equal(await page.$('#bq-a11y'),null);
 }
 assert.deepEqual(external,[],'no third-party requests');assert.deepEqual(errors,[],'no script errors');
 console.log('Accessibility browser checks passed: 15 languages, keyboard/focus, phone menu, consent, storage, text/spacing, dark contrast, reduced motion and no third-party requests.');
}finally{if(browser)await browser.close();}
