import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const moduleURL = pathToFileURL(path.resolve('tools/a11y/common.mjs'));
const common = await import(moduleURL).catch(() => ({}));

test('sitemap discovery includes nested maps, directory indexes and mandatory pages without duplicates', async () => {
  assert.equal(typeof common.discoverPages, 'function', 'page discovery is missing');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bq-a11y-'));
  try {
    await fs.mkdir(path.join(root, 'learn'));
    for (const p of ['index.html','play.html','404.html','learn/index.html']) await fs.writeFile(path.join(root,p), '<h1>fixture</h1>');
    await fs.writeFile(path.join(root,'sitemap.xml'), '<sitemapindex><sitemap><loc>https://fixture.test/child.xml</loc></sitemap></sitemapindex>');
    await fs.writeFile(path.join(root,'child.xml'), '<urlset><url><loc>https://fixture.test/</loc></url><url><loc>https://fixture.test/learn/</loc></url><url><loc>https://fixture.test/play.html</loc></url></urlset>');
    assert.deepEqual(await common.discoverPages(root), ['/','/404.html','/learn/','/play.html']);
    await fs.unlink(path.join(root,'play.html'));
    await assert.rejects(common.discoverPages(root), /play.html/);
  } finally { await fs.rm(root, {recursive:true,force:true}); }
});

test('globs support nested paths and do not mistake a single star for recursive matching', () => {
  assert.equal(typeof common.matchesGlob, 'function', 'glob matching is missing');
  assert.equal(common.matchesGlob('/learn/worksheets/a.html','learn/**/*.html'),true);
  assert.equal(common.matchesGlob('/learn/a.html','learn/**/*.html'),true);
  assert.equal(common.matchesGlob('/learn/worksheets/a.html','learn/*.html'),false);
});

test('page reports merge languages and viewports while preserving every occurrence', () => {
  assert.equal(typeof common.groupFindings, 'function', 'report aggregation is missing');
  const items = ['en','fr'].flatMap(lang => [320,1280].map(width => ({lang,path:'/learn/',state:'page',width,scheme:'dark',id:'contrast',impact:'serious',description:'Contrast',nodes:[{target:['#hero'],html:`<p lang="${lang}">`,checks:['color-contrast'],failureSummary:'Too faint'}]})));
  const [rule] = common.groupFindings(items);
  assert.equal(rule.pages.length,1); assert.equal(rule.pages[0].nodes.length,1);
  assert.equal(rule.pages[0].nodes[0].occurrences.length,4);
  assert.deepEqual(rule.pages[0].nodes[0].languages,['en','fr']);
});

test('veraPDF reports count files once per rule, keep full failed-check counts and surface job errors', () => {
  assert.equal(typeof common.summarizePDFs, 'function', 'PDF aggregation is missing');
  const rule = {ruleStatus:'FAILED',clause:'7.1',testNumber:3,description:'Untagged',failedChecks:115};
  const report = {report:{jobs:[{itemDetails:{name:'/repo/a.pdf'},validationResult:[{compliant:false,details:{ruleSummaries:[rule]}}]}, {itemDetails:{name:'/repo/b.pdf'},validationResult:[{compliant:false,details:{ruleSummaries:[{...rule,failedChecks:2}]}}]}, {itemDetails:{name:'/repo/bad.pdf'},validationResult:[]}]}};
  const result = common.summarizePDFs(report,'/repo');
  assert.equal(result.rules[0].fileCount,2); assert.equal(result.rules[0].failedChecks,117);
  assert.equal(result.errors.length,1); assert.equal(result.files.length,3);
});

const fixer=await import('./pdf-ua-fix.mjs').catch(()=>({}));
test('XMP carries Unicode title safely, language and PDF/UA identification',()=>{
  assert.equal(typeof fixer.buildXMP,'function','XMP builder is missing');
  const xml=fixer.buildXMP('Shapes & <angles> 日本語','en-GB');
  assert.match(xml,/Shapes &amp; &lt;angles&gt; 日本語/);
  assert.match(xml,/<rdf:li xml:lang="x-default">/);
  assert.match(xml,/<dc:language><rdf:Bag><rdf:li>en-GB<\/rdf:li>/);
  assert.match(xml,/<pdfuaid:part>1<\/pdfuaid:part>/);
  assert.throws(()=>fixer.buildXMP('', 'en'), /title/i);
});
test('optional fixer reports missing dependency without changing the PDF',async()=>{
  assert.equal(typeof fixer.fixPDF,'function','PDF fixer is missing');
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'bq-pdf-'));
  try {
    const p=path.join(root,'fixture.pdf');await fs.writeFile(p,'unchanged');
    const result=await fixer.fixPDF(p,{lang:'en',optional:true,modulePath:path.join(root,'missing-pdf-lib')});
    assert.equal(result.skipped,true);assert.equal(await fs.readFile(p,'utf8'),'unchanged');
    await assert.rejects(fixer.fixPDF(p,{lang:'en',modulePath:path.join(root,'missing-pdf-lib')}),/pdf-lib/);
  } finally {await fs.rm(root,{recursive:true,force:true});}
});

test('site server serves directory indexes and denies paths outside its root',async t=>{
  const {serveSite}=await import('./audit-pages.mjs');
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'bq-server-'));
  let server;
  try {
    await fs.writeFile(path.join(root,'index.html'),'<h1>English</h1>');
    await fs.symlink(path.join(root,'..'),path.join(root,'outside'));
    try {server=await serveSite(root);} catch(e) {
      if(e.code==='EPERM'){t.skip('Sandbox does not allow local HTTP listen; run this test on the host');return;}
      throw e;
    }
    const response=await fetch(server.origin+'/');assert.equal(response.status,200);
    assert.equal(await response.text(),'<h1>English</h1>');
    assert.equal((await fetch(server.origin+'/outside/')).status,404);
    assert.equal((await fetch(server.origin+'/missing.html')).status,404);
  } finally {if(server)await server.close();await fs.rm(root,{recursive:true,force:true});}
});

// Roving tabindex: real Chrome presses Tab and arrow keys (host only, like browser.test.mjs).
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const noChrome=process.env.BQ_SKIP_BROWSER==='1'?'Chrome is unavailable in this sandbox; run on the host':false;
let rovingBrowser;
after(async()=>{if(rovingBrowser)await rovingBrowser.close();});
async function keyboardFindings(html) {
  const {inspectKeyboard}=await import('./audit-pages.mjs');
  if(!rovingBrowser) {
    const puppeteer=createRequire('/Volumes/External SSD/Projects/devtools/tools/shots/package.json')('puppeteer-core');
    rovingBrowser=await puppeteer.launch({executablePath:CHROME,headless:true});
  }
  const ctx=await rovingBrowser.createBrowserContext();
  try {
    const page=await ctx.newPage();await page.setViewport({width:800,height:600});
    await page.setContent(html);
    const findings=await inspectKeyboard(page);
    const tabindex=await page.$$eval('[tabindex]',es=>Object.fromEntries(es.map(e=>[e.id,e.getAttribute('tabindex')])));
    const flagged=findings.find(f=>f.id==='keyboard-unreachable')?.nodes||[];
    return {flagged:flagged.map(n=>n.target[0]),summaries:flagged.map(n=>n.failureSummary),tabindex};
  } finally {await ctx.close();}
}
const ROVE=`<script>for(const c of document.querySelectorAll('.cell'))c.onkeydown=e=>{const all=[...document.querySelectorAll('.cell')],i=all.indexOf(c);
  const j={ArrowRight:i+1,ArrowDown:i+1,ArrowLeft:i-1,ArrowUp:i-1,Home:0,End:all.length-1}[e.key];if(j===undefined||!all[j])return;e.preventDefault();
  all.forEach((x,k)=>x.tabIndex=k===j?0:-1);all[j].focus();};</script>`;
const board=(tabindexes,{script=ROVE,extra=''}={})=>`<!doctype html><html lang="en"><title>Roving fixture</title><style>:focus-visible{outline:3px solid red}</style><body>
  <button id="before">Before</button><div role="grid" aria-label="Board"><div role="row">${tabindexes.map((t,i)=>`<div role="gridcell"><span class="cell" role="button" id="c${i}" tabindex="${t}" aria-label="Cell ${i+1}">${i+1}</span></div>`).join('')}</div></div>
  <button id="after">After</button>${extra}${script}</body></html>`;

test('valid roving-tabindex group is reachable by arrow keys and not flagged',{skip:noChrome},async()=>{
  const r=await keyboardFindings(board([0,-1,-1,-1]));
  assert.deepEqual(r.flagged,[]);
  assert.deepEqual(r.tabindex,{c0:'0',c1:'-1',c2:'-1',c3:'-1'},'roving state is restored after the arrow-key check');
});
test('well-formed roving markup without working arrow keys is still flagged',{skip:noChrome},async()=>{
  const r=await keyboardFindings(board([0,-1,-1],{script:''}));
  assert.deepEqual(r.flagged,['#c1','#c2']);
  assert.match(r.summaries[0],/arrow/);
});
test('roving group with two tabindex=0 members is flagged',{skip:noChrome},async()=>{
  const r=await keyboardFindings(board([0,0,-1]));
  assert.deepEqual(r.flagged,['#c2']);
  assert.match(r.summaries[0],/2 tabindex=0 members/);
});
test('roving group with no tabindex=0 member is flagged',{skip:noChrome},async()=>{
  const r=await keyboardFindings(board([-1,-1,-1]));
  assert.deepEqual(r.flagged,['#c0','#c1','#c2']);
  assert.match(r.summaries[0],/0 tabindex=0 members/);
});
test('stray tabindex=-1 button outside a roving group is flagged',{skip:noChrome},async()=>{
  const r=await keyboardFindings(board([0,-1],{extra:'<button id="stray" tabindex="-1">Stray</button>'}));
  assert.deepEqual(r.flagged,['#stray']);
});
