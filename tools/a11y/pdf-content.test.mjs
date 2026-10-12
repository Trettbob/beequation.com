import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import * as fixer from './pdf-ua-fix.mjs';

test('tokenizer keeps escaped nested strings, composites, names and comments opaque',()=>{
  assert.equal(typeof fixer.tokenizeContent,'function');
  const src='% BMC f\n/Na#6de << /MCID 0 /Data [(a\\)b(c)\\\\) <424d43> << /x /EMC >>] >> BDC\nBT [(S) 20 <4554>] TJ ET EMC';
  const tokens=fixer.tokenizeContent(src);
  assert.deepEqual(tokens.filter(t=>t.type==='word').map(t=>t.value),['BDC','BT','TJ','ET','EMC']);
  assert.equal(tokens[0].value,'Name');
  assert.equal(tokens.find(t=>t.type==='dict').raw,'<< /MCID 0 /Data [(a\\)b(c)\\\\) <424d43> << /x /EMC >>] >>');
});

test('inline image data with a false EI delimiter is one opaque paint operator',()=>{
  assert.equal(typeof fixer.wrapArtifacts,'function');
  const raw='BI /W 8 /H 1 /BPC 8 /CS /G ID a EI xyz\nEI';
  assert.equal(fixer.tokenizeContent(raw).length,1);
  assert.equal(fixer.wrapArtifacts(raw),'/Artifact BMC\n'+raw+'\nEMC\n');
  const data=deflateSync(Buffer.from('BMC EMC EI'));
  const compressed='BI /W 10 /H 1 /BPC 8 /CS /G /F /Fl ID '+data.toString('latin1')+'\nEI';
  assert.equal(fixer.tokenizeContent(compressed).length,1);
});

test('inline image boundaries use JPEG segments and encoded terminators, not embedded EI words',()=>{
  const jpeg=Buffer.from([255,216,255,224,0,8,97,32,69,73,255,217,255,218,0,2,32,69,73,32,255,0,255,217]);
  for(const [filter,data] of [['DCT',jpeg.toString('latin1')],['AHx','20454920>'],['A85',' EI ~>'],['RL',String.fromCharCode(3)+' EI '+String.fromCharCode(128)]]) {
    const src=`BI /W 1 /H 1 /CS /RGB /BPC 8 /F /${filter} ID ${data}\nEI`;
    assert.equal(fixer.tokenizeContent(src).length,1);
    assert.equal(fixer.wrapArtifacts(src),'/Artifact BMC\n'+src+'\nEMC\n');
  }
  const indexed='BI /W 4 /H 1 /CS [/Indexed /DeviceRGB 1 <000000ffffff>] /BPC 8 ID  EI \nEI';
  assert.equal(fixer.tokenizeContent(indexed).length,1);
});

test('wrapper groups paths, shading, XObjects and whole text objects without changing tagged content',()=>{
  assert.equal(typeof fixer.wrapArtifacts,'function');
  const marked='/Figure << /MCID 1 >> BDC q 0 0 m 1 1 l S Q EMC';
  const src='q 1 0 0 1 0 0 cm 0 0 m 1 1 l S /Sh sh /Im Do BT /F 12 Tf (Hi) Tj ET Q\n'+marked+'\n0 0 2 2 re W n';
  const want='/Artifact BMC\nq 1 0 0 1 0 0 cm 0 0 m 1 1 l S /Sh sh /Im Do BT /F 12 Tf (Hi) Tj ET Q\nEMC\n\n'+marked+'\n/Artifact BMC\n0 0 2 2 re W n\nEMC\n';
  assert.equal(fixer.wrapArtifacts(src),want);
  assert.equal(fixer.wrapArtifacts(want),want);
});

test('q/Q spanning real marked content stay outside balanced artifact runs',()=>{
  assert.equal(typeof fixer.wrapArtifacts,'function');
  const src='q 0 g 0 0 1 1 re f /P BMC BT (tagged) Tj ET EMC 1 1 m 2 2 l S Q';
  const out=fixer.wrapArtifacts(src);
  assert.equal(out,'q /Artifact BMC\n0 g 0 0 1 1 re f\nEMC\n /P BMC BT (tagged) Tj ET EMC /Artifact BMC\n1 1 m 2 2 l S\nEMC\n Q');
  assert.equal(fixer.wrapArtifacts(out),out);
});

test('nested marks and mixed text objects preserve already marked text; graphics-only runs remain untouched',()=>{
  assert.equal(typeof fixer.wrapArtifacts,'function');
  for(const src of ['q 1 0 0 1 0 0 cm Q','/Artifact BMC q 0 0 m 1 1 l S Q EMC','BT /Span BMC (tagged) Tj EMC ET','/P BMC /Span BMC BT (x) Tj ET EMC EMC'])assert.equal(fixer.wrapArtifacts(src),src);
  assert.throws(()=>fixer.wrapArtifacts('BT (untagged) Tj /P BMC (tagged) Tj EMC ET'),/mixed.*text/i);
});

test('malformed streams fail closed rather than writing partial repairs',()=>{
  assert.equal(typeof fixer.wrapArtifacts,'function');
  for(const src of ['(unterminated','[1 2','<< /x 1','<zz>','EMC','/P BMC 0 0 m S','Q','q 0 0 m S','BT (hi) Tj','ET','BI /W 8 /H 1 /BPC 8 /CS /G ID short'])assert.throws(()=>fixer.wrapArtifacts(src));
});
