// Offline Chrome check; accepts a renderer-fixture directory while translations are in progress.
// node tools/check-rtl-browser.mjs [dist/ar]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from '/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.argv[2] || path.join(root, 'dist/ar'));
const origin = 'https://rtl.beequation.test';
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,pipe:true});
try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', async req => {
    if (req.url().startsWith('data:')) return req.continue();
    if (!req.url().startsWith(origin + '/')) return req.abort();
    const pathname = new URL(req.url()).pathname;
    const base = pathname.startsWith('/assets/') ? root : output;
    const file = path.resolve(base, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(base + path.sep) || !fs.existsSync(file)) return req.respond({status:404});
    const contentType = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)] || 'application/octet-stream';
    return req.respond({status:200,contentType,body:fs.readFileSync(file)});
  });
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  for (const width of [1440, 390]) {
    await page.setViewport({width,height:900});
    for (const rel of ['support.html','today/','blog/','404.html']) {
      await page.goto(origin + '/' + rel);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).direction), 'rtl', rel);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${rel} overflow at ${width}`);
    }
    await page.goto(origin + '/support.html');
    await page.evaluate(() => document.fonts.ready);
    const positions = await page.evaluate(() => {
      const logo = document.querySelector('.bqh-logo').getBoundingClientRect();
      const end = document.querySelector('.bqh-end').getBoundingClientRect();
      return {logo:logo.x,end:end.x};
    });
    assert.ok(positions.logo > positions.end, `header mirrored at ${width}`);
    if (width === 390) {
      await page.click('.bqh-hive');
      assert.equal(await page.$eval('.bqm', e => e.hidden), false);
      assert.equal(await page.$eval('.bqm', e => getComputedStyle(e).direction), 'rtl');
    } else {
      await page.click('.lang summary');
      const bounds = await page.$eval('.langs', e => { const r=e.getBoundingClientRect();return {left:r.left,right:r.right}; });
      assert.ok(bounds.left >= 0 && bounds.right <= width, 'language grid stays inside viewport');
    }
    await page.goto(origin + '/play.html');
    await page.click('[data-kids]');
    await page.click('[data-play]');
    await page.waitForSelector('svg.board');
    assert.equal(await page.$eval('svg.board', e => getComputedStyle(e).direction), 'ltr');
    const board = await page.$eval('svg.board', e => e.getBoundingClientRect().toJSON());
    assert.ok(board.left >= 0 && board.right <= width + 1, 'board fits');
    // A physical right-arrow must still move right on the unmirrored honeycomb.
    const cells = await page.$$eval('.board .cell', els => els.map(e => ({i:e.dataset.i, x:e.getBoundingClientRect().x, y:e.getBoundingClientRect().y})));
    const pair = cells.flatMap(a => cells.filter(b => Math.abs(a.y-b.y)<1 && b.x>a.x).map(b => [a,b]))[0];
    assert.ok(pair, 'board has a horizontal neighbour');
    await page.focus(`.board .cell[data-i="${pair[0].i}"]`);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.i), pair[1].i);
    assert.equal(await page.$eval('[data-back] svg', e => getComputedStyle(e).transform), 'matrix(-1, 0, 0, 1, 0, 0)');
  }
  await page.goto(origin + '/certificate.html?d=2026-10-17&w=3&s=12');
  const date = await page.$eval('#cert-d', e => e.textContent);
  assert.match(date, /17/); assert.match(date, /2026/); assert.doesNotMatch(date, /[٠-٩۰-۹]/);
  assert.deepEqual(errors, []);
  console.log(`PASS: RTL header/menu, responsive pages, LTR board + keyboard, back arrows, Western-digit dates (${output})`);
} finally { await browser.close(); }
