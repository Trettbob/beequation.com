import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const ROOT=path.resolve('.');
const PUP='/Volumes/External SSD/Projects/devtools/tools/shots/node_modules/puppeteer-core';
// Run the real producer in an isolated miniature repo: original manifests and
// question JSON are never changed by this test.
test('printed arithmetic uses one accessible equation instead of a table with empty tagged cells',async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'bq-worksheets-'));
  try {
    await fs.mkdir(path.join(tmp,'tools/a11y'),{recursive:true});
    await fs.cp(path.join(ROOT,'tools/braille'),path.join(tmp,'tools/braille'),{recursive:true});
    await fs.mkdir(path.join(tmp,'assets/fonts'),{recursive:true});
    await fs.mkdir(path.join(tmp,'learn-src'));
    await fs.mkdir(path.join(tmp,'html'));
    for(const p of ['tools/make-worksheets.mjs','assets/beequation-kids-icon.png',...['500Medium','600SemiBold','700Bold'].map(w=>`assets/fonts/Fredoka_${w}.ttf`)])await fs.copyFile(path.join(ROOT,p),path.join(tmp,p));
    await fs.copyFile(path.join(ROOT,'tools/a11y/pdf-ua-fix.mjs'),path.join(tmp,'tools/a11y/pdf-ua-fix.mjs'));
    execFileSync(process.execPath,[path.join(tmp,'tools/make-worksheets.mjs'),PUP,'--html-only','column-addition','short-multiplication','multiplication-grid'],{env:{...process.env,HTML_DIR:path.join(tmp,'html')},stdio:'pipe'});
    const grid=JSON.parse(await fs.readFile(path.join(tmp,'learn-src/worksheets/multiplication-grid.json'),'utf8'));
    assert.equal((grid.items[0].q.match(/<td>□<\/td>/g)||[]).length,144,'every answer cell needs real content so Chrome retains its tag');
    assert.match(grid.items[0].a,/<td>144<\/td>/);
    for(const id of ['column-addition','short-multiplication']) {
      const data=JSON.parse(await fs.readFile(path.join(tmp,'learn-src/worksheets',id+'.json'),'utf8'));
      for(const item of data.items) {
        assert.doesNotMatch(item.q,/<table/, 'visual column layout must not become a malformed PDF table');
        assert.match(item.q,/class="col" aria-hidden="true"/);
        assert.match(item.q,/class="column-expression">\d+ [×+] \d+ = □/);
      }
    }
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});
