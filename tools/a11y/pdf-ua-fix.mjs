#!/usr/bin/env node
// Metadata repair only. This neither tags content nor certifies PDF/UA compliance.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
export const PDF_LIB='/Volumes/External SSD/Projects/devtools/tools/a11y/node_modules/pdf-lib';
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function buildXMP(title,lang) {
  if(!title || !title.trim())throw Error('PDF must have a non-empty Title');
  if(!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(lang))throw Error('Provide a language such as en-GB');
  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Beequation pdf-ua-fix">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xml(title)}</rdf:li></rdf:Alt></dc:title>
<dc:language><rdf:Bag><rdf:li>${xml(lang)}</rdf:li></rdf:Bag></dc:language>
<pdfuaid:part>1</pdfuaid:part>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;
}
export async function fixPDF(file,{lang='en-GB',optional=false,modulePath=PDF_LIB}={}) {
  let lib;
  try {
    const require=createRequire(path.join(modulePath,'package.json'));
    // Require the absolute package: do not accidentally find another installation.
    lib=require(modulePath);
  } catch(e) {
    if(e.code!=='MODULE_NOT_FOUND' || !e.message.includes(modulePath))throw e;
    const warning=`pdf-lib missing at ${modulePath}; PDF metadata repair skipped. Install pdf-lib in /Volumes/External SSD/Projects/devtools/tools/a11y, then rebuild or run pdf-ua-fix.mjs.`;
    if(optional)return {skipped:true,warning};
    throw Error(warning);
  }
  const {PDFDocument,PDFName,PDFBool,PDFDict,decodePDFRawStream}=lib;
  const original=await fs.readFile(file);
  const pdf=await PDFDocument.load(original,{updateMetadata:false});
  if(!pdf.catalog.has(PDFName.of('StructTreeRoot')))throw Error(`${file}: no StructTreeRoot; refusing to assert Marked on an untagged PDF`);
  // Preserve third-party XMP by refusing an unsafe overwrite. Generated worksheets
  // have no Metadata. Our own output can be repaired repeatedly without duplicates.
  const old=pdf.catalog.lookupMaybe(PDFName.of('Metadata'),lib.PDFRawStream);
  if(old) {
    const decoded=Buffer.from(decodePDFRawStream(old).decode()).toString('utf8');
    if(!decoded.includes('x:xmptk="Beequation pdf-ua-fix"'))throw Error(`${file}: existing third-party XMP preserved; merge it with a metadata-aware tool`);
  }
  const xmp=buildXMP(pdf.getTitle(),lang);
  const metadata=pdf.context.stream(Buffer.from(xmp,'utf8'),{Type:'Metadata',Subtype:'XML'});
  pdf.catalog.set(PDFName.of('Metadata'),pdf.context.register(metadata));
  pdf.setLanguage(lang);
  pdf.catalog.getOrCreateViewerPreferences().setDisplayDocTitle(true);
  let mark=pdf.catalog.lookupMaybe(PDFName.of('MarkInfo'),PDFDict);
  if(!mark){mark=pdf.context.obj({});pdf.catalog.set(PDFName.of('MarkInfo'),mark);}
  mark.set(PDFName.of('Marked'),PDFBool.True);
  const output=await pdf.save({useObjectStreams:false});
  // Save beside the file and rename only after success; preserve its permissions.
  const tempDir=await fs.mkdtemp(path.join(path.dirname(file),'.bq-pdf-ua-'));
  const tmp=path.join(tempDir,'fixed.pdf');
  try {
    await fs.writeFile(tmp,output,{flag:'wx',mode:(await fs.stat(file)).mode & 0o777});
    await fs.rename(tmp,file);
  } finally {await fs.rm(tempDir,{recursive:true,force:true});}
  return {skipped:false,file,title:pdf.getTitle(),lang};
}
async function main() {
  const args=process.argv.slice(2),i=args.indexOf('--lang');
  if(args.includes('--help')){console.log('pdf-ua-fix.mjs [--lang en-GB] PDF...\nRepairs metadata in-place; does not certify PDF/UA compliance.');return;}
  const lang=i<0?'en-GB':args[i+1];if(i>=0)args.splice(i,2);
  if(!args.length || args.some(a=>a.startsWith('--')))throw Error('Usage: pdf-ua-fix.mjs [--lang en-GB] PDF...');
  for(const file of args)console.log(await fixPDF(path.resolve(file),{lang}));
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
