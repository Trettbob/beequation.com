import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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
