// Real PDF/veraPDF integration; runnable without Chrome after pdf-lib is installed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fixPDF,PDF_LIB} from './pdf-ua-fix.mjs';
let lib;try{lib=createRequire(path.join(PDF_LIB,'package.json'))(PDF_LIB);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
test('metadata fixer preserves real worksheet content and removes catalog metadata failure',async t=>{
  if(!lib){t.skip('Install pdf-lib at the documented tools path');return;}
  const {PDFDocument,PDFName,PDFBool,PDFDict,PDFRawStream,decodePDFRawStream}=lib;
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-pdf-fix-'));
  const file=path.join(tmp,'2d-shapes.pdf');
  try {
    await fs.copyFile('assets/worksheets/2d-shapes.pdf',file);
    const original=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});
    const contents=pdf=>pdf.getPages().map(p=>{
      const c=p.node.Contents();
      const streams=c instanceof lib.PDFArray ? Array.from({length:c.size()},(_,i)=>c.get(i)) : [c];
      return streams.filter(Boolean).map(s=>Buffer.from(decodePDFRawStream(pdf.context.lookup(s,PDFRawStream)).decode()).toString('hex'));
    });
    const before=contents(original),tree=original.catalog.get(PDFName.of('StructTreeRoot')).toString();
    await fixPDF(file,{lang:'en-GB'});
    const pdf=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});
    assert.deepEqual(contents(pdf),before);
    assert.equal(pdf.catalog.get(PDFName.of('StructTreeRoot')).toString(),tree);
    assert.equal(pdf.getTitle(),original.getTitle());
    assert.equal(pdf.catalog.getOrCreateViewerPreferences().getDisplayDocTitle(),true);
    assert.equal(pdf.catalog.lookup(PDFName.of('MarkInfo'),PDFDict).lookup(PDFName.of('Marked'),PDFBool).asBoolean(),true);
    const xmp=Buffer.from(decodePDFRawStream(pdf.catalog.lookup(PDFName.of('Metadata'),PDFRawStream)).decode()).toString('utf8');
    assert.match(xmp,/<pdfuaid:part>1<\/pdfuaid:part>/);
    await fixPDF(file,{lang:'en-GB'}); // idempotent repair of our own metadata
    let stdout;
    try {stdout=execFileSync('/Volumes/External SSD/Projects/devtools/verapdf/verapdf',['-f','ua1','--format','json','--maxfailuresdisplayed','1',file],{env:{...process.env,JAVA_HOME:'/Volumes/External SSD/Projects/devtools/java/jdk-21.0.12.1+1-jre/Contents/Home'},encoding:'utf8'});}
    catch(e){if(e.status!==1)throw e;stdout=e.stdout;}
    const results=JSON.parse(stdout).report.jobs[0].validationResult;
    assert.ok(results.length);
    for(const v of results) {
      const failures=v.details.ruleSummaries.filter(r=>r.ruleStatus==='FAILED');
      assert.ok(!failures.some(r=>r.clause==='7.1'&&r.testNumber===8));
      assert.equal(failures.find(r=>r.clause==='7.1'&&r.testNumber===3).failedChecks,115,'metadata repair cannot silently retag content');
    }
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});
