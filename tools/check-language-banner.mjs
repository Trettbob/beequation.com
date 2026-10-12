// Usage: node tools/check-language-banner.mjs /path/to/playwright/index.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const {chromium} = await import(pathToFileURL(resolve(process.argv[2])).href);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'http://beequation.test';
async function serve(route) {
  const path = new URL(route.request().url()).pathname;
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
    if (!route.request().url().startsWith(origin)) { external.push(route.request().url()); return route.abort(); }
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
  await page.evaluate(() => localStorage.clear());
  await page.goto(origin + '/support.html?lang=en');
  assert.equal(await banner.count(), 0, 'explicit English choice');
  await page.goto(origin + '/support.html');
  assert.equal(await banner.count(), 0, 'English choice persists');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.bq-ok .n').click();
  assert.deepEqual(external, [], 'declining analytics makes no request');
  await page.reload();
  assert.deepEqual(external, [], 'decline persists');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.bq-ok .y').click();
  await page.waitForTimeout(100);
  assert.ok(external.some(u => u.startsWith('https://www.googletagmanager.com/gtag/js')), 'explicit opt-in loads analytics');
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('blocked','SecurityError');}}));
  await page.goto(origin + '/play.html');
  assert.equal(await banner.count(), 1, 'storage denial must not break suggestion');
  await banner.locator('button').click();
  assert.equal(await banner.count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
  for (const locale of ['en-GB','zz-ZZ','nb-NO','ja-JP']) {
    const ctx = await browser.newContext({locale, reducedMotion:'reduce'});
    const p = await ctx.newPage();
    await ctx.route('**/*', r => r.request().url().startsWith(origin) ? serve(r) : r.abort());
    await p.goto(origin + '/learn/mental-maths-strategies.html');
    assert.equal(await p.locator('#bq-language-suggestion').count(), ['en-GB','zz-ZZ'].includes(locale) ? 0 : 1, locale);
    if (locale === 'nb-NO') assert.equal(await p.locator('#bq-language-suggestion a').getAttribute('href'), 'https://no.beequation.com/learn/mental-maths-strategies.html');
    await ctx.close();
  }
  console.log('PASS: no redirect, localized links, dismissal, explicit English, storage denial, cookie coexistence, analytics opt-in, locale fallback');
} finally { if (browser) await browser.close(); }
