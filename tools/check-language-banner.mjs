// Usage: node tools/check-language-banner.mjs /path/to/playwright/index.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const {chromium} = await import(pathToFileURL(resolve(process.argv[2])).href);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://beequation.com';
const codes=['fr','es','de','pt','it','nl','pl','sv','da','no','fi','tr','ja','ko'];
const local=u=>new URL(u).hostname==='beequation.com'||codes.some(c=>new URL(u).hostname===c+'.beequation.com');
async function serve(route) {
  const url=new URL(route.request().url()), code=url.hostname.split('.')[0];
  const path=(codes.includes(code)?'/dist/'+code:'')+url.pathname;
  try {
    const file = resolve(root, '.' + path + (path.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + '/')) throw Error('outside root');
    await route.fulfill({body:await readFile(file), contentType:{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'}[extname(file)] || 'application/octet-stream'});
  } catch { await route.fulfill({status:404, body:''}); }
}
let browser;
try {
  browser = await chromium.launch({channel:'chrome', headless:true});
  const context = await browser.newContext({locale:'fr-FR', reducedMotion:'reduce', viewport:{width:390,height:844}});
  const page = await context.newPage();
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.route('**/*', route => {
    if (!local(route.request().url())) { external.push(route.request().url()); return route.abort(); }
    return serve(route);
  });
  await page.goto(origin + '/support.html?from=test#help');
  assert.equal(new URL(page.url()).host, new URL(origin).host, 'must not redirect');
  const banner = page.locator('#bq-language-suggestion');
  await banner.waitFor({timeout:3000});
  assert.equal(await banner.getAttribute('lang'), 'fr');
  assert.equal(await banner.locator('a').getAttribute('href'), 'https://fr.beequation.com/support.html?from=test#help');
  assert.equal(await page.locator('.bq-ok').count(), 1, 'cookie note remains');
  assert.deepEqual(external, [], 'no third-party traffic before opt-in');
  const a = await banner.boundingBox(), b = await page.locator('.bq-ok').boundingBox();
  assert.ok(a.y + a.height <= b.y || b.y + b.height <= a.y, 'banner must not cover cookie note');
  await banner.locator('button').click();
  await page.reload();
  assert.equal(await banner.count(), 0, 'dismissal persists');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(origin + '/support.html?lang=en');
  assert.equal(await banner.count(), 0, 'explicit English choice');
  await page.goto(origin + '/support.html');
  assert.equal(await banner.count(), 0, 'English choice persists');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.bq-ok .n').click();
  assert.deepEqual(external, [], 'declining analytics makes no request');
  await page.reload();
  assert.deepEqual(external, [], 'decline persists');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.bq-ok .y').click();
  await page.waitForTimeout(100);
  assert.ok(external.some(u => u.startsWith('https://www.googletagmanager.com/gtm.js?id=GTM-W9MNXL3Z')), 'explicit opt-in loads GA');
  assert.equal(external.filter(u => u === 'https://tracker.metricool.com/resources/be.js').length, 1, 'explicit opt-in loads Metricool once');
  assert.equal(await page.evaluate(() => localStorage.getItem('bq-consent')), 'all2');
  await page.evaluate(() => document.dispatchEvent(new Event('bq-consent')));
  assert.equal(external.filter(u => u === 'https://tracker.metricool.com/resources/be.js').length, 1);
  await page.evaluate(() => localStorage.setItem('bq-consent', 'all'));
  external.length = 0;
  await page.reload();
  assert.equal(await page.locator('.bq-ok').count(), 1, 'old all consent asks again');
  assert.deepEqual(external, [], 'old consent permits neither tracker');
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('blocked','SecurityError');}}));
  await page.goto(origin + '/play.html');
  assert.equal(await banner.count(), 1, 'storage denial must not break suggestion');
  assert.deepEqual(external, [], 'play page has no analytics');
  await banner.locator('button').click();
  assert.equal(await banner.count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
  for (const locale of ['en-GB','zz-ZZ','nb-NO','ja-JP']) {
    const ctx = await browser.newContext({locale, reducedMotion:'reduce'});
    const p = await ctx.newPage();
    await ctx.route('**/*', r => local(r.request().url()) ? serve(r) : r.abort());
    await p.goto(origin + '/learn/mental-maths-strategies.html');
    assert.equal(await p.locator('#bq-language-suggestion').count(), ['en-GB','zz-ZZ'].includes(locale) ? 0 : 1, locale);
    if (locale === 'nb-NO') assert.equal(await p.locator('#bq-language-suggestion a').getAttribute('href'), 'https://no.beequation.com/learn/mental-maths-strategies.html');
    await ctx.close();
  }
  // All responses are local fixtures. No third-party request leaves this browser.
  for(const code of ['en',...codes]) {
    const ctx=await browser.newContext({reducedMotion:'reduce',viewport:{width:375,height:667}});
    const p=await ctx.newPage(), traffic=[];
    await ctx.route('**/*',r=>{if(local(r.request().url()))return serve(r);traffic.push(r.request().url());return r.abort();});
    const url=code==='en'?origin:`https://${code}.beequation.com`;
    await p.goto(url+'/support.html');
    const note=p.locator('.bq-ok');
    // Focus a bottom-of-page link; the fixed note must not hide its outline.
    const last=p.locator('footer a').last();await last.focus();
    const focused=await last.boundingBox(), strip=await note.boundingBox();
    assert.ok(focused.y+focused.height<=strip.y,`${code}: focused footer link is visible`);
    assert.equal(await note.getAttribute('role'),'region');assert.ok(await note.getAttribute('aria-label'));
    assert.equal(await note.locator('h2,svg,img').count(),0);
    assert.ok(await note.evaluate(e=>e.previousElementSibling.matches('.skip')));
    await p.keyboard.press('Escape');assert.equal(await note.count(),1,'Escape is not a choice');
    for(const width of [320,375])for(const scheme of ['light','dark'])for(const scale of [1,2])for(const contrast of [false,true]) {
      await p.setViewportSize({width,height:667});
      await p.emulateMedia({colorScheme:scheme});
      await p.evaluate(({scale,contrast})=>{
        document.documentElement.style.setProperty('--bq-text-scale',scale);
        document.documentElement.classList.toggle('bq-contrast',contrast);
      },{scale,contrast});
      // Let ResizeObserver account for text size / border changes.
      await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const box=await note.boundingBox();
      assert.ok(box.height<=667*.25+1,`${code} ${scale}x: strip height ${box.height}`);
      assert.equal(Math.round(box.y+box.height),667);
      const buttons=await note.locator('button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:r.width,height:r.height,background:s.backgroundColor,color:s.color,border:s.border,font:s.font};}));
      assert.deepEqual(buttons[0],buttons[1],'buttons have equal size and visual weight');
      assert.ok(buttons[0].height>=44);
      assert.ok(await p.evaluate(()=>parseFloat(getComputedStyle(document.body).paddingBottom)>=document.querySelector('.bq-ok').getBoundingClientRect().height));
      // Overflowing enlarged text remains scrollable and in the tab order.
      assert.ok(await note.locator('p').evaluate(e=>e.tabIndex===0&&getComputedStyle(e).overflowY==='auto'));
      assert.equal(await note.evaluate(e=>getComputedStyle(e).animationName),'none');
    }
    await p.evaluate(()=>document.documentElement.classList.add('bqm-open'));
    assert.equal(await note.isVisible(),false);
    await p.evaluate(()=>document.documentElement.classList.remove('bqm-open'));
    await p.evaluate(()=>document.querySelector('#bq-a11y').showModal());
    assert.equal(await note.isVisible(),false);
    await p.evaluate(()=>document.querySelector('#bq-a11y').close());
    assert.equal(await note.isVisible(),true);
    await p.setViewportSize({width:1280,height:800});
    const wide=await note.boundingBox();assert.ok(wide.width<=920);assert.ok(Math.abs(wide.x-(1280-wide.width)/2)<1);
    assert.deepEqual(traffic,[],'no traffic before consent in any language');
    await note.locator('.n').click();
    const cookie=(await ctx.cookies()).find(c=>c.name==='bq-consent');
    assert.equal(cookie.value,'basic');assert.equal(cookie.domain,'.beequation.com');assert.equal(cookie.path,'/');assert.equal(cookie.sameSite,'Lax');assert.equal(cookie.secure,true);
    assert.ok(Math.abs(cookie.expires-Date.now()/1000-31536000)<60);
    const other=await ctx.newPage();await other.goto((code==='en'?'https://fr.beequation.com':origin)+'/privacy.html');
    assert.equal(await other.locator('.bq-ok').count(),0);
    assert.equal(await other.evaluate(()=>localStorage.getItem('bq-consent')),'basic');
    assert.deepEqual(traffic,[],'adopting refusal never loads trackers');
    await other.locator('[data-bq-consent]').click();await other.locator('.bq-ok .y').click();
    const fresh=await ctx.newPage();await fresh.goto('https://ja.beequation.com/support.html');
    // Clear this origin's earlier local answer to exercise adoption even when code is ja.
    await fresh.evaluate(()=>localStorage.removeItem('bq-consent'));await fresh.reload();
    assert.equal(await fresh.locator('.bq-ok').count(),0);
    assert.equal(await fresh.evaluate(()=>localStorage.getItem('bq-consent')),'all2');
    await ctx.close();
  }
  console.log('PASS: no redirect, localized links, dismissal, explicit English, storage denial, cookie coexistence, analytics opt-in, locale fallback');
} finally { if (browser) await browser.close(); }
