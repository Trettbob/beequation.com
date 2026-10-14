#!/usr/bin/env node
// Chrome tagged-PDF metadata, unmarked decoration and ToUnicode repair; validate with veraPDF.
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
// ToUnicode repair (PDF/UA-1 7.21.7): Skia maps glyphs made by shaping (Devanagari reph, rakar,
// conjuncts, matra variants, NullMark) to U+0000 and covers each such cluster with a /Span /ActualText.
// The real text of an unmapped glyph is its cluster's ActualText minus the text of the other glyphs.
// A glyph has one ToUnicode value per font, so the most common reading wins (reph is र् in र्ष, but
// part of ई after इ). Readers that honour ActualText still get each exact cluster.
const ZERO_WIDTH='\u034F'; // COMBINING GRAPHEME JOINER: default-ignorable, keeps the grapheme cluster.
const UNKNOWN='\uFFFD';
const badUnits=s=>/[\0\uFEFF\uFFFE]/.test(s);
const utf16=hex=>{const b=Buffer.from(hex.length%4?hex.padEnd(hex.length+4-hex.length%4,'0'):hex,'hex');let s='';for(let i=0;i+1<b.length;i+=2)s+=String.fromCharCode((b[i]<<8)|b[i+1]);return s;};
const toHex=s=>Array.from({length:s.length},(_,i)=>s.charCodeAt(i).toString(16).toUpperCase().padStart(4,'0')).join('');
const hexOf=t=>t.raw.slice(1,-1).replace(/\s/g,'').toUpperCase();
function stringBytes(t) {
  if(t.type==='hex'){const h=hexOf(t);return Buffer.from(h.length%2?h+'0':h,'hex');}
  if(t.type!=='string')return null;
  const s=t.raw.slice(1,-1),out=[];
  for(let i=0;i<s.length;i++) {
    const c=s[i];
    if(c!=='\\'){out.push(c.charCodeAt(0));continue;}
    const n=s[++i];
    if(/[0-7]/.test(n)){let o=n;while(o.length<3 && /[0-7]/.test(s[i+1]))o+=s[++i];out.push(parseInt(o,8)&255);}
    else if(n==='\r'){if(s[i+1]==='\n')i++;}
    else if(n!=='\n' && n!==undefined)out.push(({n:10,r:13,t:9,b:8,f:12})[n]??n.charCodeAt(0));
  }
  return Buffer.from(out);
}
function textString(t) {
  const b=stringBytes(t);if(!b)return null;
  if(b[0]===0xFE && b[1]===0xFF)return utf16(b.subarray(2).toString('hex'));
  if(b[0]===0xEF && b[1]===0xBB && b[2]===0xBF)return b.subarray(3).toString('utf8');
  return b.toString('latin1');
}
// Codes are uppercase hex; bfrange entries are expanded so every code can be replaced individually.
export function parseToUnicode(source) {
  const s=Buffer.isBuffer(source)?source.toString('latin1'):source,tokens=tokenizeContent(s);
  const map=new Map(),ranges=[];let first=null,end=null;
  for(let i=0;i<tokens.length;i++) {
    const t=tokens[i];if(t.type!=='word')continue;
    if(t.value==='endcmap'){end=t.start;break;}
    if(t.value==='begincodespacerange')for(i++;tokens[i] && tokens[i].value!=='endcodespacerange';i+=2)ranges.push([hexOf(tokens[i]),hexOf(tokens[i+1])]);
    if(t.value!=='beginbfchar' && t.value!=='beginbfrange')continue;
    if(first===null)first=tokens[i-1]?.type==='number'?tokens[i-1].start:t.start;
    const close=t.value==='beginbfchar'?'endbfchar':'endbfrange';
    for(i++;tokens[i] && tokens[i].value!==close;) {
      if(t.value==='beginbfchar'){const src=tokens[i],dst=tokens[i+1];if(src?.type!=='hex' || dst?.type!=='hex')throw Error('Unsupported ToUnicode bfchar');map.set(hexOf(src),utf16(hexOf(dst)));i+=2;continue;}
      const [lo,hi,dst]=tokens.slice(i,i+3);i+=3;
      if(lo?.type!=='hex' || hi?.type!=='hex')throw Error('Unsupported ToUnicode bfrange');
      const width=hexOf(lo).length,a=parseInt(hexOf(lo),16),b=parseInt(hexOf(hi),16);
      if(b<a || b-a>65535)throw Error('Invalid ToUnicode bfrange');
      const items=dst.type==='array'?tokenizeContent(dst.raw.slice(1,-1)):null;
      for(let c=a;c<=b;c++) {
        const code=c.toString(16).toUpperCase().padStart(width,'0');
        if(items){if(items[c-a]?.type!=='hex')throw Error('Short ToUnicode bfrange array');map.set(code,utf16(hexOf(items[c-a])));continue;}
        if(dst?.type!=='hex')throw Error('Unsupported ToUnicode bfrange');
        const base=utf16(hexOf(dst)),last=base.charCodeAt(base.length-1)+(c-a);
        map.set(code,base.slice(0,-1)+String.fromCharCode(last&0xFFFF));
      }
    }
  }
  if(first===null || end===null)throw Error('ToUnicode CMap has no mappings or endcmap');
  const bytes=ranges.length?ranges[0][0].length/2:2;
  if(ranges.some(([lo,hi])=>lo.length!==bytes*2 || hi.length!==bytes*2))throw Error('Mixed-width ToUnicode code spaces are not supported');
  return {map,bytes,head:s.slice(0,first),tail:s.slice(end)};
}
export function writeToUnicode({map,head,tail}) {
  const entries=[...map].sort(([a],[b])=>a.length-b.length || (a<b?-1:a>b?1:0));
  let body='';
  for(let i=0;i<entries.length;i+=100) {
    const chunk=entries.slice(i,i+100);
    body+=`${chunk.length} beginbfchar\n${chunk.map(([c,u])=>`<${c}> <${toHex(u)}>`).join('\n')}\nendbfchar\n`;
  }
  return head+body+tail;
}
// Fonts draw some Devanagari vowels from other glyphs (ई as इ + reph, ो as ा + े-sign). These are the
// Unicode "do not use" look-alike sequences; they are tried only when a cluster does not decompose.
const LOOK_ALIKE=new Map([[0x0906,[0x0905,0x093E]],[0x0908,[0x0907,0x0930,0x094D]],[0x0910,[0x090F,0x0947]],[0x0911,[0x0905,0x0949]],
  [0x0913,[0x0905,0x094B]],[0x0914,[0x0905,0x094C]],[0x0949,[0x093E,0x0945]],[0x094A,[0x093E,0x0946]],[0x094B,[0x093E,0x0947]],[0x094C,[0x093E,0x0948]]]);
const lookAlike=t=>{const out=[];const add=c=>{const e=LOOK_ALIKE.get(c);if(e)e.forEach(add);else out.push(c);};for(const ch of t)add(ch.codePointAt(0));return String.fromCodePoint(...out);};
// spans: [{text, glyphs:[key]}]; known(key) gives a mapped glyph's text, or undefined when it needs a value.
// family(key) optionally names the same glyph in another weight of the same font (same glyph order).
// Returns Map(key -> text); '' means the glyph carries no text of its own (written as ZERO_WIDTH).
export function resolveGlyphText(spans,unknownKeys,known,family=()=>null) {
  const resolved=new Map(),text=k=>resolved.has(k)?resolved.get(k):known(k);
  const remainder=span=>subtract(span,span.text) ?? subtract(span,lookAlike(span.text));
  const subtract=(span,whole)=>{
    const rest=[...whole];
    for(const k of span.glyphs) {
      const t=text(k);if(t===undefined){if(unknownKeys.has(k))continue;return null;}
      for(const ch of t.replaceAll(ZERO_WIDTH,'')){const i=rest.indexOf(ch);if(i<0)return null;rest.splice(i,1);}
    }
    return rest.join('');
  };
  const borrow=()=>{
    const borrowed=new Map();
    for(const [k,t] of resolved){const f=family(k);if(f!==null && !borrowed.has(f))borrowed.set(f,t);}
    let copied=false;
    for(const k of unknownKeys){const f=family(k);if(!resolved.has(k) && f!==null && borrowed.has(f)){resolved.set(k,borrowed.get(f));copied=true;}}
    return copied;
  };
  const pending=()=>spans.map(span=>({span,open:span.glyphs.filter(k=>unknownKeys.has(k) && !resolved.has(k))})).filter(x=>x.open.length);
  for(;;) {
    const open=pending();if(!open.length)break;
    const votes=new Map();
    for(const {span,open:keys} of open) {
      if(keys.length!==1)continue;
      const r=remainder(span);if(r===null)continue;
      const v=votes.get(keys[0])??new Map();v.set(r,(v.get(r)??0)+1);votes.set(keys[0],v);
    }
    if(votes.size) {
      // Most common reading; prefer real text over an empty one, then the shorter.
      for(const [k,v] of votes)resolved.set(k,[...v].sort(([a,x],[b,y])=>y-x || (!a)-(!b) || a.length-b.length || (a<b?-1:1))[0][0]);
      continue;
    }
    // A glyph whose clusters never decompose borrows its reading from another weight of the font.
    if(borrow())continue;
    // Several unmapped glyphs only ever occur together: the first carries the remaining cluster text.
    const next=open.find(({span})=>remainder(span)!==null);
    if(!next)break;
    resolved.set(next.open[0],remainder(next.span));
  }
  borrow(); // also for mapped glyphs that no cluster uses
  return resolved;
}
function repairToUnicode(pdf,lib) {
  const {PDFName:N,PDFDict,PDFArray,PDFRawStream,PDFRef,PDFHexString,PDFString,decodePDFRawStream}=lib,ctx=pdf.context;
  const key=s=>N.of(s),decode=s=>Buffer.from(decodePDFRawStream(s).decode()).toString('latin1');
  const fonts=new Map(); // font dict -> {ref, cmap, id, family} or null
  const fontInfo=dict=>{
    if(!fonts.has(dict)) {
      const ref=dict.get(key('ToUnicode')),stream=ref&&ctx.lookup(ref);
      // Identity-encoded CIDFonts share glyph IDs across weights of one family (Skia keeps original GIDs).
      const descendant=dict.lookupMaybe(key('DescendantFonts'),PDFArray)?.lookup(0,PDFDict);
      const identity=/^\/Identity-[HV]$/.test(dict.get(key('Encoding'))?.toString()??'') && [undefined,'/Identity'].includes(descendant?.get(key('CIDToGIDMap'))?.toString());
      const family=identity?dict.get(key('BaseFont'))?.toString().replace(/^\/(?:[A-Z]{6}\+)?/,'').replace(/-[^-]*$/,''):null;
      let cmap=null;
      // A CMap this parser does not support is left exactly as it is.
      if(stream instanceof PDFRawStream)try{cmap=parseToUnicode(decode(stream));}catch{}
      fonts.set(dict,cmap?{ref,cmap,id:fonts.size,family:family||null}:null);
    }
    return fonts.get(dict);
  };
  // Skia writes every font as an indirect object: without a bad value among them, leave the PDF alone.
  for(const [,obj] of ctx.enumerateIndirectObjects())if(obj instanceof PDFDict && obj.get(key('ToUnicode')) && ['/Type0','/TrueType','/Type1','/Type3'].includes(obj.get(key('Subtype'))?.toString()))fontInfo(obj);
  const bad=()=>[...fonts.values()].some(f=>f && [...f.cmap.map.values()].some(badUnits));
  if(!bad())return {toUnicodeFixed:0,toUnicodeUnknown:0};
  const spans=[];
  function scan(text,resources,state,marks,seen) {
    const fontRes=resources?.lookupMaybe(key('Font'),PDFDict),props=resources?.lookupMaybe(key('Properties'),PDFDict);
    let operands=[];const stack=[];
    for(const t of tokenizeContent(text)) {
      if(t.type!=='word' && t.type!=='inlineImage'){operands.push(t);continue;}
      const op=t.value,args=operands;operands=[];
      if(op==='q')stack.push(state.font);
      else if(op==='Q')state.font=stack.pop()??state.font;
      else if(op==='Tf'){const f=fontRes?.lookupMaybe(key(args[0]?.value??''),PDFDict);state.font=f?fontInfo(f):null;}
      else if(op==='BMC')marks.push(null);
      else if(op==='BDC') {
        let dict=null;
        if(args[1]?.type==='dict'){const items=tokenizeContent(args[1].raw.slice(2,-2));for(let i=0;i+1<items.length;i+=2)if(items[i].type==='name' && items[i].value==='ActualText')dict=textString(items[i+1]);}
        else if(args[1]?.type==='name'){const p=props?.lookupMaybe(key(args[1].value),PDFDict)?.lookup(key('ActualText'));if(p instanceof PDFHexString || p instanceof PDFString)dict=p.decodeText();}
        marks.push(dict===null?null:{text:dict,glyphs:[]});
      }
      else if(op==='EMC'){const m=marks.pop();if(m)spans.push(m);}
      else if(op==='Do') {
        const form=resources?.lookupMaybe(key('XObject'),PDFDict)?.lookup(key(args[0]?.value??''));
        if(form instanceof PDFRawStream && form.dict.get(key('Subtype'))?.toString()==='/Form' && !seen.has(form))
          scan(decode(form),form.dict.lookupMaybe(key('Resources'),PDFDict)??resources,{...state},marks,new Set([...seen,form]));
      }
      else if(textShows.has(op)) {
        const strings=op==='TJ'?tokenizeContent(args[0].raw.slice(1,-1)).filter(x=>x.type==='hex' || x.type==='string'):[args.at(-1)];
        const span=marks.findLast(Boolean);
        for(const s of strings) {
          const b=stringBytes(s),f=state.font;if(!b)continue;
          if(!f){if(span)span.glyphs.push('?');continue;}
          for(let i=0;i+f.cmap.bytes<=b.length;i+=f.cmap.bytes) {
            if(span)span.glyphs.push(`${f.id}:${b.subarray(i,i+f.cmap.bytes).toString('hex').toUpperCase()}`);
          }
        }
      }
    }
  }
  for(const page of pdf.getPages()) {
    const entry=page.node.get(key('Contents'));if(!entry)continue;
    const contents=ctx.lookup(entry);
    const streams=contents instanceof PDFArray?Array.from({length:contents.size()},(_,i)=>ctx.lookup(contents.get(i),PDFRawStream)):[contents];
    scan(streams.map(decode).join('\n'),page.node.Resources(),{font:null},[],new Set());
  }
  const unknown=new Set();
  for(const f of fonts.values())if(f)for(const [code,u] of f.cmap.map)if(badUnits(u))unknown.add(`${f.id}:${code}`);
  if(!unknown.size)return {toUnicodeFixed:0,toUnicodeUnknown:0};
  const byId=new Map([...fonts.values()].filter(Boolean).map(f=>[f.id,f]));
  const known=k=>{if(k==='?')return undefined;const [id,code]=k.split(':'),u=byId.get(Number(id))?.cmap.map.get(code);return u===undefined || unknown.has(k)?undefined:u;};
  const family=k=>{const [id,code]=k.split(':'),f=byId.get(Number(id))?.family;return f?`${f}:${code}`:null;};
  const resolved=resolveGlyphText(spans,unknown,known,family);
  const inSpans=new Set(spans.flatMap(s=>s.glyphs));
  let fixed=0,guessed=0;
  for(const k of unknown) {
    const [id,code]=k.split(':'),f=byId.get(Number(id)),old=f.cmap.map.get(code);
    let u=resolved.get(k);
    // Still unknown: inside ActualText clusters it adds no text of its own; elsewhere keep any valid units.
    if(u===undefined){const stripped=old.replace(/[\0\uFEFF\uFFFE]/g,'');u=inSpans.has(k)?'':stripped||UNKNOWN;guessed++;}
    f.cmap.map.set(code,u===''?ZERO_WIDTH:u);f.changed=true;fixed++;
  }
  for(const f of byId.values()) {
    if(!f.changed)continue;
    const stream=ctx.flateStream(writeToUnicode(f.cmap));
    if(f.ref instanceof PDFRef)ctx.assign(f.ref,stream);else throw Error('Inline ToUnicode stream cannot be repaired');
  }
  return {toUnicodeFixed:fixed,toUnicodeUnknown:guessed};
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
  const repair={...repairContent(pdf,lib),...repairToUnicode(pdf,lib)};
  if(!changed && !repair.streamsChanged && !repair.toUnicodeFixed)return {skipped:false,file,title:pdf.getTitle(),lang,...repair,unchanged:true};
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
