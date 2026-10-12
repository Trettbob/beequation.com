#!/usr/bin/env node
// Chrome tagged-PDF metadata and unmarked decoration repair; validate with veraPDF.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {inflateSync,deflateSync} from 'node:zlib';
export const PDF_LIB='/Volumes/External SSD/Projects/devtools/tools/a11y/node_modules/pdf-lib';
const whitespace=c=>c!==undefined && /[\x00\t\n\f\r ]/.test(c);
const delimiter=c=>c===undefined || whitespace(c) || '()<>[]{}/%'.includes(c);
const number=/^[+-]?(?:\d+\.?\d*|\.\d+)$/;

// Offsets are byte offsets: decoded PDF streams use Latin-1, never UTF-8.
// Composite operands are opaque to operator parsing, including words inside them.
export function tokenizeContent(source) {
  const s=Buffer.isBuffer(source)?source.toString('latin1'):source;
  let pos=0;
  const fail=message=>{throw Error(`${message} at content byte ${pos}`);};
  function skip() {
    while(pos<s.length) {
      if(whitespace(s[pos]))pos++;
      else if(s[pos]==='%'){while(pos<s.length && !'\r\n'.includes(s[pos]))pos++;}
      else break;
    }
  }
  function token() {
    skip();if(pos===s.length)return null;
    const start=pos;let type,value;
    if(s[pos]==='(') {
      type='string';pos++;let depth=1;
      while(pos<s.length && depth) {
        const c=s[pos++];
        if(c==='\\') {if(pos===s.length)fail('Unterminated string escape');if(s[pos++]==='\r' && s[pos]==='\n')pos++;}
        else if(c==='(')depth++;
        else if(c===')')depth--;
      }
      if(depth)fail('Unterminated literal string');
    } else if(s[pos]==='[' || s.slice(pos,pos+2)==='<<') {
      const dict=s[pos]==='<';type=dict?'dict':'array';pos+=dict?2:1;
      const close=dict?'>>':']';
      for(;;){skip();if(s.slice(pos,pos+close.length)===close){pos+=close.length;break;}if(!token())fail(`Unterminated ${type}`);}
    } else if(s[pos]==='<') {
      type='hex';pos++;
      while(pos<s.length && s[pos]!=='>'){if(!whitespace(s[pos]) && !/[\da-f]/i.test(s[pos]))fail('Invalid hex string');pos++;}
      if(s[pos++]!=='>')fail('Unterminated hex string');
    } else if(s[pos]==='/') {
      type='name';pos++;while(!delimiter(s[pos]))pos++;
      const raw=s.slice(start+1,pos);
      if(/#(?![\da-f]{2})/i.test(raw))fail('Invalid name escape');
      value=raw.replace(/#([\da-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
    } else {
      if(delimiter(s[pos]))fail('Unexpected delimiter');
      while(!delimiter(s[pos]))pos++;
      value=s.slice(start,pos);type=number.test(value)?'number':['true','false','null'].includes(value)?'literal':'word';
    }
    return {type,value:value??s.slice(start,pos),raw:s.slice(start,pos),start,end:pos};
  }
  function inlineImage(start) {
    const entries=new Map();
    for(;;){const key=token();if(key?.type==='word' && key.value==='ID')break;if(key?.type!=='name')fail('Invalid inline image dictionary');const val=token();if(!val)fail('Missing inline image value');entries.set(key.value,val);}
    if(!whitespace(s[pos]))fail('Inline image ID needs whitespace');
    if(s[pos++]==='\r' && s[pos]==='\n')pos++;
    const dataStart=pos,get=(a,b)=>entries.get(a)??entries.get(b);
    const filter=get('Filter','F');let end;
    // The first filter defines the encoded-data boundary even with a filter array.
    const first=filter?.type==='array'?tokenizeContent(filter.raw.slice(1,-1))[0]?.value:filter?.value;
    if(!filter) {
      const mask=get('ImageMask','IM')?.value==='true';
      const color=get('ColorSpace','CS');
      const cs=color?.type==='array'?tokenizeContent(color.raw.slice(1,-1))[0]?.value:color?.value;
      const components=mask?1:({G:1,DeviceGray:1,RGB:3,DeviceRGB:3,CMYK:4,DeviceCMYK:4,I:1,Indexed:1})[cs];
      const width=Number(get('Width','W')?.value),height=Number(get('Height','H')?.value),bits=mask?1:Number(get('BitsPerComponent','BPC')?.value);
      if(!components || !Number.isInteger(width) || width<=0 || !Number.isInteger(height) || height<=0 || ![1,2,4,8,16].includes(bits))fail('Cannot determine unfiltered inline image length');
      end=dataStart+Math.ceil(width*components*bits/8)*height;
    } else if(['Fl','FlateDecode'].includes(first)) {
      const decoded=inflateSync(Buffer.from(s.slice(dataStart),'latin1'),{info:true});end=dataStart+decoded.engine.bytesWritten;
    } else if(['AHx','ASCIIHexDecode','A85','ASCII85Decode'].includes(first)) {
      const marker=['AHx','ASCIIHexDecode'].includes(first)?'>':'~>';
      const found=s.indexOf(marker,dataStart);if(found<0)fail('Unterminated inline image encoding');end=found+marker.length;
    } else if(['RL','RunLengthDecode'].includes(first)) {
      end=dataStart;
      for(;;){if(end>=s.length)fail('Unterminated run-length image');const n=s.charCodeAt(end++);if(n===128)break;end+=n<128?n+1:1;}
    } else if(['DCT','DCTDecode'].includes(first)) {
      const byte=i=>s.charCodeAt(i);
      if(byte(dataStart)!==255 || byte(dataStart+1)!==216)fail('Inline JPEG is missing SOI');
      end=dataStart+2;let entropy=false;
      for(;;) {
        if(end>=s.length)fail('Unterminated inline JPEG');
        if(byte(end++)!==255){if(entropy)continue;fail('Invalid JPEG marker');}
        while(byte(end)===255)end++;
        const marker=byte(end++);
        if(marker===217)break;
        if(marker===0 || (marker>=208 && marker<=215)){if(entropy)continue;fail('Invalid JPEG entropy marker');}
        if(marker===1)continue;
        const length=(byte(end)<<8)|byte(end+1);
        if(length<2 || end+length>s.length)fail('Invalid JPEG segment length');
        end+=length;entropy=marker===218;
      }
    } else {
      // EI scanning alone is unsafe: binary payloads can contain whitespace EI.
      fail(`Unsupported inline image filter ${first}; refusing ambiguous EI scan`);
    }
    pos=end;if(pos>s.length || !whitespace(s[pos]))fail('Invalid inline image data length');
    while(whitespace(s[pos]))pos++;
    if(s.slice(pos,pos+2)!=='EI' || !delimiter(s[pos+2]))fail('Missing inline image EI');
    pos+=2;return {type:'inlineImage',value:'BI',raw:s.slice(start,pos),start,end:pos};
  }
  const tokens=[];
  for(let t;(t=token());){if(t.type==='word' && t.value==='BI')t=inlineImage(t.start);tokens.push(t);}
  return tokens;
}

const paints=new Set('m l c v y h re S s f F f* B B* b b* n sh Do BI'.split(' '));
const textShows=new Set(['Tj','TJ',"'",'"']);
function contentPlan(source) {
  const tokens=tokenizeContent(source),ops=[];let operands=[];
  for(const t of tokens) {
    if(t.type==='word' || t.type==='inlineImage') {ops.push({op:t.value,start:operands[0]?.start??t.start,end:t.end,operands});operands=[];}
    else operands.push(t);
  }
  if(operands.length)throw Error('Trailing operands without an operator');
  let depth=0,region=0,bt=null;const stack=[];
  for(let i=0;i<ops.length;i++) {
    const o=ops[i];o.depth=depth;o.region=region;
    if(o.op==='BMC' || o.op==='BDC'){depth++;region++;o.barrier=true;}
    else if(o.op==='EMC'){if(!depth)throw Error('Unmatched EMC');depth--;region++;o.barrier=true;}
    if(o.op==='q')stack.push(i);
    if(o.op==='Q'){const j=stack.pop();if(j===undefined)throw Error('Unmatched Q');o.pair=j;ops[j].pair=i;}
    if(o.op==='BT'){if(bt!==null)throw Error('Nested BT');bt=i;}
    if(o.op==='ET') {
      if(bt===null)throw Error('Unmatched ET');
      const block=ops.slice(bt,i+1),mixed=block.some(x=>x.barrier);
      if(mixed && block.some(x=>x.depth===0 && textShows.has(x.op)))throw Error('Mixed marked and unmarked text object cannot be wrapped as a whole');
      if(mixed){for(const x of block)x.barrier=true;}
      else if(ops[bt].depth===0){ops[bt].paint=true;}
      bt=null;
    }
    if(textShows.has(o.op) && bt===null)throw Error('Text show outside BT/ET');
  }
  if(depth || stack.length || bt!==null)throw Error('Unbalanced marked content, q/Q or BT/ET');
  for(const o of ops) {
    if(o.op==='q' || o.op==='Q') {
      const pair=ops[o.pair];
      if(o.depth!==0 || pair.depth!==0 || o.region!==pair.region || pair.barrier)o.barrier=true;
    }
    o.paint ||= paints.has(o.op);
  }
  const edits=[];let run=[];
  const flush=()=>{
    if(run.some(o=>o.paint)){edits.push({at:run[0].start,text:'/Artifact BMC\n'},{at:run.at(-1).end,text:'\nEMC\n'});}
    run=[];
  };
  for(const o of ops){if(o.depth!==0 || o.barrier)flush();else run.push(o);}
  flush();return {ops,edits};
}
function applyEdits(source,edits) {
  let result='',offset=0;
  for(const e of edits){result+=source.slice(offset,e.at)+e.text;offset=e.end??e.at;}
  return result+source.slice(offset);
}
export function wrapArtifacts(source) {
  const s=Buffer.isBuffer(source)?source.toString('latin1'):source;
  return applyEdits(s,contentPlan(s).edits);
}

function repairContent(pdf,lib) {
  const {PDFName:N,PDFRawStream,PDFArray,PDFDict,PDFRef,decodePDFRawStream}=lib,ctx=pdf.context;
  const key=s=>N.of(s),decode=s=>Buffer.from(decodePDFRawStream(s).decode()).toString('latin1');
  let streamsChanged=0,artifactRuns=0;
  function compressed(stream,text) {
    const dict=stream.dict.clone(ctx);
    for(const name of ['DecodeParms','F','FFilter','FDecodeParms'])dict.delete(key(name));
    dict.set(key('Filter'),key('FlateDecode'));
    return PDFRawStream.of(dict,deflateSync(Buffer.from(text,'latin1')));
  }
  // Clone only decorative Form uses. A shared Form may also be an entire tagged
  // Figure: changing its original stream would hide that Figure's real content.
  function process(sources,resources,ancestors=new Set()) {
    const parts=sources.map(({stream})=>decode(stream));
    const text=parts.join('\n'),{ops,edits}=contentPlan(text);
    let newResources=resources,xobjects,renames=new Map();
    for(const o of ops) {
      if(o.op!=='Do' || o.depth!==0)continue;
      const operand=o.operands[0];
      if(o.operands.length!==1 || operand.type!=='name')throw Error('Do requires one XObject name');
      const oldObjects=resources?.lookupMaybe(key('XObject'),PDFDict);
      const ref=oldObjects?.get(key(operand.value));
      if(!ref)throw Error(`Missing XObject /${operand.value}`);
      const form=ctx.lookup(ref,PDFRawStream);
      if(form.dict.get(key('Subtype'))?.toString()!=='/Form')continue;
      if(ancestors.has(form))throw Error('Cyclic unmarked Form XObject invocation');
      let name=renames.get(operand.value);
      if(!name) {
        const next=new Set(ancestors);next.add(form);
        const child=process([{stream:form}],form.dict.lookupMaybe(key('Resources'),PDFDict)??resources,next);
        if(!child.changed)continue;
        if(form.dict.has(key('StructParents')) || form.dict.has(key('StructParent')))throw Error('Cannot clone an unmarked Form with structure parent identity; repair its producer');
        if(!xobjects) {
          newResources=resources.clone(ctx);xobjects=oldObjects.clone(ctx);newResources.set(key('XObject'),xobjects);
        }
        let i=0;do{name=`BQArtifact${i++}`;}while(xobjects.has(key(name)));
        const clone=compressed(form,child.parts[0]);
        if(child.resources)clone.dict.set(key('Resources'),child.resources);
        xobjects.set(key(name),ctx.register(clone));renames.set(operand.value,name);
        streamsChanged++;
      }
      edits.push({at:operand.start,end:operand.end,text:`/${name}`});
    }
    edits.sort((a,b)=>a.at-b.at || (a.end?1:0)-(b.end?1:0));
    artifactRuns+=edits.filter(e=>e.text==='/Artifact BMC\n').length;
    // Contents arrays are one logical stream. Distribute insertions/replacements
    // back to their original streams, retaining references and cross-stream state.
    let offset=0;
    const output=parts.map((part,i)=>{
      const end=offset+part.length;
      const local=edits.filter(e=>e.at>=offset && e.at<=end).map(e=>({...e,at:e.at-offset,end:e.end===undefined?undefined:e.end-offset}));
      if(local.some(e=>e.end!==undefined && e.end>part.length))throw Error('Operand crosses page content stream boundary');
      offset=end+1;return applyEdits(part,local);
    });
    return {parts:output,resources:newResources,changed:edits.length>0};
  }
  for(const page of pdf.getPages()) {
    const entry=page.node.get(key('Contents'));if(!entry)continue;
    const contents=ctx.lookup(entry),array=contents instanceof PDFArray;
    const refs=array?Array.from({length:contents.size()},(_,i)=>contents.get(i)):[entry];
    const sources=refs.map(ref=>({ref,stream:ctx.lookup(ref,PDFRawStream)}));
    const result=process(sources,page.node.Resources());
    if(result.resources!==page.node.Resources())page.node.set(key('Resources'),result.resources);
    for(let i=0;i<sources.length;i++) {
      if(result.parts[i]===decode(sources[i].stream))continue;
      const stream=compressed(sources[i].stream,result.parts[i]);
      if(sources[i].ref instanceof PDFRef)ctx.assign(sources[i].ref,stream);
      else if(array)contents.set(i,stream);
      else page.node.set(key('Contents'),stream);
      streamsChanged++;
    }
  }
  return {streamsChanged,artifactRuns};
}
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
export async function fixPDF(file,{lang,langFromPath=false,optional=false,modulePath=PDF_LIB}={}) {
  let lib;
  try {
    const require=createRequire(path.join(modulePath,'package.json'));
    // Require the absolute package: do not accidentally find another installation.
    lib=require(modulePath);
  } catch(e) {
    if(e.code!=='MODULE_NOT_FOUND' || !e.message.includes(modulePath))throw e;
    const warning=`pdf-lib missing at ${modulePath}; PDF repair skipped. Install pdf-lib in /Volumes/External SSD/Projects/devtools/tools/a11y, then rebuild or run pdf-ua-fix.mjs.`;
    if(optional)return {skipped:true,warning};
    throw Error(warning);
  }
  const {PDFDocument,PDFName,PDFBool,PDFDict,decodePDFRawStream}=lib;
  const original=await fs.readFile(file);
  const pdf=await PDFDocument.load(original,{updateMetadata:false});
  const catalogLang=pdf.catalog.lookup(PDFName.of('Lang'));
  lang ??= langFromPath ? catalogLang?.decodeText() || file.split(path.sep).join('/').match(/(?:^|\/)learn-i18n\/([^/]+)\//)?.[1] || 'en-GB' : 'en-GB';
  if(!pdf.catalog.has(PDFName.of('StructTreeRoot')))throw Error(`${file}: no StructTreeRoot; refusing to assert Marked on an untagged PDF`);
  // Preserve third-party XMP by refusing an unsafe overwrite. Generated worksheets
  // have no Metadata. Our own output can be repaired repeatedly without duplicates.
  const old=pdf.catalog.lookupMaybe(PDFName.of('Metadata'),lib.PDFRawStream);
  if(old) {
    const decoded=Buffer.from(decodePDFRawStream(old).decode()).toString('utf8');
    if(!decoded.includes('x:xmptk="Beequation pdf-ua-fix"'))throw Error(`${file}: existing third-party XMP preserved; merge it with a metadata-aware tool`);
  }
  const xmp=buildXMP(pdf.getTitle(),lang);
  let changed=false;
  if(!old || Buffer.from(decodePDFRawStream(old).decode()).toString('utf8')!==xmp) {
    const metadata=pdf.context.stream(Buffer.from(xmp,'utf8'),{Type:'Metadata',Subtype:'XML'});
    pdf.catalog.set(PDFName.of('Metadata'),pdf.context.register(metadata));changed=true;
  }
  if(catalogLang?.decodeText()!==lang){pdf.setLanguage(lang);changed=true;}
  const viewer=pdf.catalog.getOrCreateViewerPreferences();
  if(!viewer.getDisplayDocTitle()){viewer.setDisplayDocTitle(true);changed=true;}
  let mark=pdf.catalog.lookupMaybe(PDFName.of('MarkInfo'),PDFDict);
  if(!mark){mark=pdf.context.obj({});pdf.catalog.set(PDFName.of('MarkInfo'),mark);changed=true;}
  if(mark.lookup(PDFName.of('Marked'))!==PDFBool.True){mark.set(PDFName.of('Marked'),PDFBool.True);changed=true;}
  const repair=repairContent(pdf,lib);
  if(!changed && !repair.streamsChanged)return {skipped:false,file,title:pdf.getTitle(),lang,...repair,unchanged:true};
  const output=await pdf.save({useObjectStreams:false});
  // Save beside the file and rename only after success; preserve its permissions.
  const tempDir=await fs.mkdtemp(path.join(path.dirname(file),'.bq-pdf-ua-'));
  const tmp=path.join(tempDir,'fixed.pdf');
  try {
    await fs.writeFile(tmp,output,{flag:'wx',mode:(await fs.stat(file)).mode & 0o777});
    await fs.rename(tmp,file);
  } finally {await fs.rm(tempDir,{recursive:true,force:true});}
  return {skipped:false,file,title:pdf.getTitle(),lang,...repair,unchanged:false};
}
async function* pdfFiles(target) {
  const stat=await fs.lstat(target);
  if(stat.isSymbolicLink())return;
  if(stat.isDirectory()) {
    for(const entry of (await fs.readdir(target)).sort())yield* pdfFiles(path.join(target,entry));
  } else if(stat.isFile() && /\.pdf$/i.test(target))yield target;
}
async function main() {
  const args=process.argv.slice(2),i=args.indexOf('--lang');
  const usage='pdf-ua-fix.mjs [--lang CODE | --lang-from-path] <PDF-or-directory...>';
  if(args.includes('--help')){console.log(`${usage}\nRepairs Chrome tagged PDFs in place. Validate with veraPDF -f ua1. Symlinks are skipped.`);return;}
  const lang=i<0?undefined:args[i+1];if(i>=0)args.splice(i,2);
  const j=args.indexOf('--lang-from-path'),langFromPath=j>=0;if(j>=0)args.splice(j,1);
  if(!args.length || args.some(a=>a.startsWith('--')) || (i>=0 && (!lang || lang.startsWith('--'))) || (lang && langFromPath))throw Error(`Usage: ${usage}`);
  const seen=new Set();let failures=0;
  for(const target of args) {
    try {
      for await(const file of pdfFiles(path.resolve(target))) {
        if(seen.has(file))continue;seen.add(file);
        try{console.log(JSON.stringify(await fixPDF(file,{lang,langFromPath})));}
        catch(e){failures++;console.error(JSON.stringify({file,error:e.message}));}
      }
    } catch(e){failures++;console.error(JSON.stringify({target,error:e.message}));}
  }
  if(!seen.size){console.error('No PDFs found');failures++;}
  if(failures)process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
