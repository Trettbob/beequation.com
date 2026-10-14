// Real PDF/veraPDF integration; runnable without Chrome after pdf-lib is installed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fixPDF,PDF_LIB,wrapArtifacts} from './pdf-ua-fix.mjs';
let lib;try{lib=createRequire(path.join(PDF_LIB,'package.json'))(PDF_LIB);}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
test('fixer preserves worksheet structure and paint bytes, is idempotent and passes veraPDF',async t=>{
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
      return streams.filter(Boolean).map(s=>Buffer.from(decodePDFRawStream(pdf.context.lookup(s,PDFRawStream)).decode()).toString('latin1'));
    });
    const before=contents(original),tree=original.catalog.get(PDFName.of('StructTreeRoot')).toString();
    await fixPDF(file,{lang:'en-GB'});
    const pdf=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});
    assert.deepEqual(contents(pdf),before.map(streams=>streams.map(wrapArtifacts)));
    const objects=p=>p.context.enumerateIndirectObjects().filter(([,o])=>!(o instanceof PDFRawStream)).map(([r,o])=>[r.toString(),o.toString()]);
    const alt=p=>objects(p).filter(([,s])=>s.includes('/Alt '));
    assert.deepEqual(alt(pdf),alt(original));
    assert.equal(pdf.catalog.get(PDFName.of('StructTreeRoot')).toString(),tree);
    assert.equal(pdf.getTitle(),original.getTitle());
    assert.equal(pdf.catalog.getOrCreateViewerPreferences().getDisplayDocTitle(),true);
    assert.equal(pdf.catalog.lookup(PDFName.of('MarkInfo'),PDFDict).lookup(PDFName.of('Marked'),PDFBool).asBoolean(),true);
    const xmp=Buffer.from(decodePDFRawStream(pdf.catalog.lookup(PDFName.of('Metadata'),PDFRawStream)).decode()).toString('utf8');
    assert.match(xmp,/<pdfuaid:part>1<\/pdfuaid:part>/);
    const repaired=await fs.readFile(file);
    await fixPDF(file,{lang:'en-GB'});
    assert.deepEqual(await fs.readFile(file),repaired,'second pass leaves the complete PDF untouched');
    let stdout;
    try {stdout=execFileSync('/Volumes/External SSD/Projects/devtools/verapdf/verapdf',['-f','ua1','--format','json','--maxfailuresdisplayed','1',file],{env:{...process.env,JAVA_HOME:'/Volumes/External SSD/Projects/devtools/java/jdk-21.0.12.1+1-jre/Contents/Home'},encoding:'utf8'});}
    catch(e){if(e.status!==1)throw e;stdout=e.stdout;}
    const results=JSON.parse(stdout).report.jobs[0].validationResult;
    assert.ok(results.length);
    for(const v of results) {
      assert.equal(v.compliant,true,JSON.stringify(v.details.ruleSummaries.filter(r=>r.ruleStatus==='FAILED')));
    }
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});

test('page arrays and shared/nested Forms are repaired without artifacting tagged Form uses',async()=>{
  const {PDFDocument,PDFName,PDFRawStream,decodePDFRawStream}=lib;
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-pdf-forms-'));
  try {
    const pdf=await PDFDocument.create();pdf.setTitle('Forms');pdf.setLanguage('fr');
    pdf.catalog.set(PDFName.of('StructTreeRoot'),pdf.context.register(pdf.context.obj({Type:'StructTreeRoot'})));
    const inner=pdf.context.register(pdf.context.flateStream('0 0 1 1 re f',{Type:'XObject',Subtype:'Form',BBox:[0,0,10,10]}));
    const form=pdf.context.register(pdf.context.flateStream('/Inner Do',{Type:'XObject',Subtype:'Form',BBox:[0,0,10,10],Resources:{XObject:{Inner:inner}}}));
    const page=pdf.addPage();page.node.set(PDFName.of('Resources'),pdf.context.obj({XObject:{Shared:form}}));
    page.node.set(PDFName.of('Contents'),pdf.context.obj([
      pdf.context.register(pdf.context.flateStream('q /Shared Do BT (hello) Tj')),
      pdf.context.register(pdf.context.flateStream(' ET Q /Figure << /MCID 0 >> BDC /Shared Do EMC')),
    ]));
    const file=path.join(tmp,'forms.pdf');await fs.writeFile(file,await pdf.save({useObjectStreams:false}));
    await fixPDF(file,{langFromPath:true});
    const fixed=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});
    const decode=s=>Buffer.from(decodePDFRawStream(s).decode()).toString('latin1');
    assert.equal(fixed.catalog.lookup(PDFName.of('Lang')).decodeText(),'fr');
    assert.equal(decode(fixed.context.lookup(form,PDFRawStream)),'/Inner Do','shared meaningful Form is unchanged');
    assert.equal(decode(fixed.context.lookup(inner,PDFRawStream)),'0 0 1 1 re f');
    const streams=fixed.context.enumerateIndirectObjects().map(([,o])=>o).filter(o=>o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype'))?.toString()==='/Form');
    assert.equal(streams.filter(s=>decode(s).includes('/Artifact BMC')).length,2,'both decorative Form levels are repaired');
    const cs=fixed.getPages()[0].node.Contents();
    const text=Array.from({length:cs.size()},(_,i)=>decode(cs.lookup(i,PDFRawStream))).join('\n');
    assert.match(text,/BT \(hello\) Tj\n ET Q\nEMC/);
    assert.match(text,/\/Figure << \/MCID 0 >> BDC \/Shared Do EMC/);
    const first=await fs.readFile(file);await fixPDF(file,{langFromPath:true});assert.deepEqual(await fs.readFile(file),first);
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});

test('zero ToUnicode values from shaped Devanagari are rewritten from ActualText; clean fonts are untouched',async()=>{
  const {PDFDocument,PDFName,PDFRawStream,decodePDFRawStream}=lib;
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-pdf-tounicode-'));
  try {
    const pdf=await PDFDocument.create();pdf.setTitle('ToUnicode');pdf.setLanguage('hi');
    pdf.catalog.set(PDFName.of('StructTreeRoot'),pdf.context.register(pdf.context.obj({Type:'StructTreeRoot'})));
    const cmap=body=>pdf.context.register(pdf.context.flateStream(`/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n${body}endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`));
    const font=(name,toUnicode)=>pdf.context.register(pdf.context.obj({Type:'Font',Subtype:'Type0',BaseFont:name,Encoding:'Identity-H',ToUnicode:toUnicode,
      DescendantFonts:[pdf.context.obj({Type:'Font',Subtype:'CIDFontType2',BaseFont:name,CIDToGIDMap:'Identity'})]}));
    const latinMap=cmap('1 beginbfrange\n<0001> <0003> <0041>\nendbfrange\n');
    const devaMap=cmap('5 beginbfchar\n<0056> <0937>\n<0007> <0907>\n<01FA> <0000>\n<0221> <FEFF>\n<0047> <0924>\nendbfchar\n');
    const page=pdf.addPage();
    page.node.set(PDFName.of('Resources'),pdf.context.obj({Font:{F1:font('AAAAAA+NotoSansDevanagari-Medium',devaMap),F2:font('BAAAAA+Fredoka-Medium',latinMap)}}));
    page.node.set(PDFName.of('Contents'),pdf.context.register(pdf.context.flateStream([
      '/P <</MCID 0>> BDC BT /F2 12 Tf <000100020003> Tj /F1 12 Tf',
      '/Span<</ActualText <FEFF093009370937> >> BDC <005601FA> Tj EMC', // a minority reading (रष) loses to र् below
      '/Span<</ActualText <FEFF0930094D0937> >> BDC <0056> Tj <01FA> Tj EMC',
      '/Span<</ActualText (\\376\\377\\011\\044\\011\\077) >> BDC [<0221> -20 <0047>] TJ EMC', // ति as a literal UTF-16 string
      '/Span<</ActualText <FEFF0908> >> BDC <000701FA> Tj EMC ET EMC', // ई drawn as इ + reph
    ].join('\n'))));
    const file=path.join(tmp,'deva.pdf');await fs.writeFile(file,await pdf.save({useObjectStreams:false}));
    const result=await fixPDF(file,{lang:'hi'});
    assert.equal(result.toUnicodeFixed,2);assert.equal(result.toUnicodeUnknown,0);
    const fixed=await PDFDocument.load(await fs.readFile(file),{updateMetadata:false});
    const decode=ref=>Buffer.from(decodePDFRawStream(fixed.context.lookup(ref,PDFRawStream)).decode()).toString('latin1');
    const {parseToUnicode}=await import('./pdf-ua-fix.mjs');
    assert.deepEqual(Object.fromEntries(parseToUnicode(decode(devaMap)).map),{'0007':'\u0907','0047':'\u0924','0056':'\u0937','01FA':'\u0930\u094D','0221':'\u093F'});
    assert.equal(decode(latinMap),Buffer.from(decodePDFRawStream(pdf.context.lookup(latinMap,PDFRawStream)).decode()).toString('latin1'),'a font without bad values keeps its CMap');
    const first=await fs.readFile(file);await fixPDF(file,{lang:'hi'});assert.deepEqual(await fs.readFile(file),first,'idempotent');
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});

test('directory CLI uses catalog Lang then learn-i18n path, recursively, without following symlinks',async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-pdf-tree-'));
  try {
    for(const [relative,lang] of [['learn-i18n/ko/assets/a.pdf',null],['learn-i18n/fr/assets/b.PDF','pt-BR'],['assets/c.pdf',null]]) {
      const p=await lib.PDFDocument.create();p.setTitle('Language');if(lang)p.setLanguage(lang);
      p.catalog.set(lib.PDFName.of('StructTreeRoot'),p.context.register(p.context.obj({Type:'StructTreeRoot'})));p.addPage();
      const dest=path.join(tmp,relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,await p.save());
    }
    const external=path.join(tmp,'untagged.dat');await fs.writeFile(external,'Must not be parsed or changed');
    await fs.symlink(external,path.join(tmp,'assets','skip.pdf'));
    const output=execFileSync(process.execPath,['tools/a11y/pdf-ua-fix.mjs','--lang-from-path',tmp,path.join(tmp,'assets')],{encoding:'utf8'});
    assert.equal(output.trim().split('\n').length,3,'overlapping inputs are deduplicated and symlinks skipped');
    assert.equal(await fs.readFile(external,'utf8'),'Must not be parsed or changed');
    for(const [relative,want] of [['learn-i18n/ko/assets/a.pdf','ko'],['learn-i18n/fr/assets/b.PDF','pt-BR'],['assets/c.pdf','en-GB']]){
      const p=await lib.PDFDocument.load(await fs.readFile(path.join(tmp,relative)));assert.equal(p.catalog.lookup(lib.PDFName.of('Lang')).decodeText(),want);
    }
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});
