import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {summarizePDFs, md} from './common.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
async function pdfs(dir) {
  const out=[];
  for (const e of await fs.readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if (e.isDirectory()) out.push(...await pdfs(p));
    else if (e.isFile() && /\.pdf$/i.test(e.name)) out.push(path.relative(root,p));
  }
  return out;
}
const result=summarizePDFs(JSON.parse(await fs.readFile(process.argv[2],'utf8')),root);
const expected=(await pdfs(path.join(root,'assets'))).concat((await pdfs(path.join(root,'learn-i18n'))).filter(p=>/^learn-i18n\/[^/]+\/assets\//.test(p)));
const processed=new Set(result.files.map(f=>f.file));
for (const file of expected) if (!processed.has(file)) result.errors.push({file,error:'Not processed by veraPDF'});
for (const file of processed) if (!expected.includes(file)) result.errors.push({file,error:'Unexpected PDF outside requested asset roots'});
const status=Number(process.argv[3] || 0);
// veraPDF uses 0 for success and 1 for non-compliance on this installed CLI.
if (status>1) result.errors.push({error:`veraPDF exited ${status}`});
result.generatedAt=new Date().toISOString(); result.profile='ua1'; result.validatorExitCode=status;
result.expectedFiles=expected.length;
const dir=path.join(root,'reports/a11y'); await fs.mkdir(dir,{recursive:true});
await fs.writeFile(path.join(dir,'pdfs.json'),JSON.stringify(result,null,2)+'\n');
const failed=result.files.filter(f=>f.compliant===false).length;
const lines=['# PDF/UA-1 audit','',`Generated ${result.generatedAt}. ${result.files.length}/${expected.length} PDFs processed; ${failed} non-compliant; ${result.errors.length} processing/coverage errors.`, '', '| Clause | Test | Failed files | Failed checks | Description |','| --- | --- | ---: | ---: | --- |', ...result.rules.map(r=>`| ${md(r.clause)} | ${r.test} | ${r.fileCount} | ${r.failedChecks} | ${md(r.description)} |`),''];
for (const r of result.rules) lines.push(`## ${r.clause}-${r.test}`, '',r.description,'', ...r.files.slice(0,10).map(f=>`- \`${f}\``), ...(r.files.length>10 ? [`- ${r.files.length-10} more files; complete list in \`pdfs.json\`.`] : []),'');
if(result.errors.length) lines.push('## Processing errors','',...result.errors.map(e=>`- ${md(e.file || 'validator')}: ${md(JSON.stringify(e.error))}`),'');
await fs.writeFile(path.join(dir,'pdfs.md'),lines.join('\n'));
console.log(`${result.files.length} PDFs, ${result.rules.length} failed rules, ${result.errors.length} errors; reports/a11y/pdfs.{json,md}`);
process.exitCode=result.errors.length ? 2 : failed ? 1 : 0;
