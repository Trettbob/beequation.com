import fs from 'node:fs/promises';
import path from 'node:path';
export const LANGS = ['en','da','de','es','fi','fr','it','ja','ko','nl','no','pl','pt','sv','tr'];
// India's preview sites (dist/in, dist/hi): audited only when asked for with --lang, until they are live.
export const PREVIEW_LANGS = ['in','hi'];
export const impactRank = {critical:0,serious:1,moderate:2,minor:3,unknown:4};
export const md = value => String(value).replaceAll('|','\\|').replace(/[\r\n]+/g,' ');
const xmlText = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'");
export function localFile(root, pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes('\0') || decoded.split('/').includes('..')) throw new Error('Unsafe path');
  const file = path.resolve(root, '.' + (decoded.startsWith('/') ? decoded : '/' + decoded), decoded.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(path.resolve(root) + path.sep)) throw new Error('Path outside site');
  return file;
}
export async function discoverPages(root) {
  const pages = new Set(['/404.html','/play.html']), visited = new Set();
  async function readMap(urlPath) {
    if (visited.has(urlPath)) return;
    visited.add(urlPath);
    const xml = await fs.readFile(localFile(root,urlPath),'utf8');
    const locs = [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/g)].map(m => new URL(xmlText(m[1].trim())).pathname);
    if (/<sitemapindex\b/.test(xml)) for (const p of locs) await readMap(p);
    else for (const p of locs) if (p.endsWith('/') || p.endsWith('.html')) pages.add(p);
  }
  await readMap('/sitemap.xml');
  for (const p of pages) if (!(await fs.stat(localFile(root,p))).isFile()) throw new Error(`Missing built page ${p}`);
  return [...pages].sort();
}
export function matchesGlob(value, glob) {
  let pattern = '';
  glob = glob.replace(/^\//,'');
  for (let i=0;i<glob.length;i++) {
    const c = glob[i];
    if (c === '*' && glob[i+1] === '*') { i++; if (glob[i+1] === '/') {i++;pattern+='(?:.*/)?';} else pattern+='.*'; }
    else if (c === '*') pattern+='[^/]*';
    else if (c === '?') pattern+='[^/]';
    else pattern+=c.replace(/[\\^$.*+?()[\]{}|]/g,'\\$&');
  }
  return new RegExp('^'+pattern+'$').test(value.replace(/^\//,''));
}
export function groupFindings(findings) {
  const rules = new Map();
  for (const f of findings) {
    if (!rules.has(f.id)) rules.set(f.id,{id:f.id,impact:f.impact || 'unknown',description:f.description,helpUrl:f.helpUrl,pages:new Map()});
    const r = rules.get(f.id);
    if (impactRank[f.impact] < impactRank[r.impact]) r.impact=f.impact;
    if (!r.pages.has(f.path)) r.pages.set(f.path,{path:f.path,nodes:new Map()});
    const p = r.pages.get(f.path);
    for (const n of f.nodes) {
      const key = JSON.stringify([n.target,[...(n.checks || [])].sort()]);
      if (!p.nodes.has(key)) p.nodes.set(key,{target:n.target,checks:n.checks || [],samples:[],languages:new Set(),occurrences:[]});
      const node = p.nodes.get(key);
      node.languages.add(f.lang);
      if (!node.samples.some(s=>s.lang===f.lang && s.html===n.html && s.failureSummary===n.failureSummary)) node.samples.push({lang:f.lang,html:n.html,failureSummary:n.failureSummary});
      const occurrence = {lang:f.lang,state:f.state,width:f.width,height:f.height,scheme:f.scheme};
      if (!node.occurrences.some(o=>JSON.stringify(o)===JSON.stringify(occurrence))) node.occurrences.push(occurrence);
    }
  }
  return [...rules.values()].map(r=>({...r,pages:[...r.pages.values()].sort((a,b)=>a.path.localeCompare(b.path)).map(p=>({...p,nodes:[...p.nodes.values()].map(n=>({...n,languages:[...n.languages].sort()}))}))})).sort((a,b)=>impactRank[a.impact]-impactRank[b.impact] || a.id.localeCompare(b.id));
}
export function summarizePDFs(raw, root) {
  if (!Array.isArray(raw?.report?.jobs)) throw new Error('Invalid veraPDF JSON: no report.jobs');
  const rules = new Map(), files = [], errors = [];
  for (const j of raw.report.jobs) {
    const file = path.relative(root,j.itemDetails?.name || 'UNKNOWN');
    const results = j.validationResult || [];
    const valid = results.length && results.every(v=>typeof v.compliant==='boolean' && v.details && !/exception|error|failed/i.test(v.jobEndStatus || ''));
    if (!valid) errors.push({file,error:j.processingError || j.taskException || j.validationResult || 'No validation result'});
    files.push({file,compliant:valid ? results.every(v=>v.compliant) : null});
    for (const v of results) for (const rule of v.details?.ruleSummaries || []) {
      if (rule.ruleStatus !== 'FAILED' && rule.status !== 'failed') continue;
      const key = `${rule.specification || ''}:${rule.clause}-${rule.testNumber}`;
      if (!rules.has(key)) rules.set(key,{specification:rule.specification,clause:rule.clause,test:rule.testNumber,description:rule.description,files:new Set(),failedChecks:0});
      const r = rules.get(key); r.files.add(file); r.failedChecks+=Number(rule.failedChecks || 0);
    }
  }
  return {files,errors,rules:[...rules.values()].map(r=>({...r,fileCount:r.files.size,files:[...r.files].sort()})).sort((a,b)=>b.failedChecks-a.failedChecks)};
}
