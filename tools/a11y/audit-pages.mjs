#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {LANGS, PREVIEW_LANGS, discoverPages, localFile, matchesGlob, groupFindings, md} from './common.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const DEV='/Volumes/External SSD/Projects/devtools';
const TAGS=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'];
const delay=ms=>new Promise(r=>setTimeout(r,ms));

export async function serveSite(root) {
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.pdf':'application/pdf','.xml':'application/xml'};
  const canonical=await fs.realpath(root);
  const server=http.createServer(async (req,res)=>{
    try {
      const url=new URL(req.url,'http://localhost');
      const file=await fs.realpath(localFile(root,url.pathname));
      if(!file.startsWith(canonical+path.sep)) throw Error('outside site');
      const body=await fs.readFile(file);
      res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(body);
    } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};
}

// Installed in each browser realm; layout and keyboard use the same state visibility.
export function installAuditHelpers() {
  const intersect=(a,b)=>({left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)});
  function rect(e,r=e.getBoundingClientRect(),viewport=true) {
    r={left:r.left,top:r.top,right:r.right,bottom:r.bottom};
    for(let p=e;p;p=p.parentElement) {
      const s=getComputedStyle(p);
      if(p.hasAttribute('hidden')||p.hasAttribute('inert')||s.display==='none'||s.visibility!=='visible'||Number(s.opacity)===0||s.contentVisibility==='hidden')return null;
      if(p.localName==='dialog'&&!p.hasAttribute('open'))return null;
      if(p.hasAttribute('popover')&&!p.matches(':popover-open'))return null;
      if(p.localName==='details'&&!p.hasAttribute('open')) {
        const summary=[...p.children].find(c=>c.localName==='summary');
        if(p!==e&&(!summary||!summary.contains(e)))return null;
      }
      if(p!==e) {
        const b=p.getBoundingClientRect();
        if(['hidden','clip','scroll','auto'].includes(s.overflowX)){r.left=Math.max(r.left,b.left);r.right=Math.min(r.right,b.right);}
        if(['hidden','clip','scroll','auto'].includes(s.overflowY)){r.top=Math.max(r.top,b.top);r.bottom=Math.min(r.bottom,b.bottom);}
      }
    }
    if(viewport)r=intersect(r,{left:0,top:0,right:innerWidth,bottom:innerHeight});
    return r.right-r.left>1&&r.bottom-r.top>1?r:null;
  }
  const visible=(e,viewport=true)=>!!rect(e,undefined,viewport);
  function layer(e) {for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.position==='fixed'||p.localName==='dialog'||p.hasAttribute('popover'))return p;}return null;}
  function overlap(a,ar,b,br) {
    if(a===b||a.contains(b)||b.contains(a))return false;
    ar=rect(a,ar);br=rect(b,br);if(!ar||!br)return false;
    const r=intersect(ar,br);if(r.right-r.left<=2||r.bottom-r.top<=2)return false;
    // Modal/fixed overlays occlude the text below them; they are not two visible
    // text boxes colliding. Absolute positioning alone never exempts real text.
    if(layer(a)!==layer(b))return false;
    for(const [x,y] of [[.5,.5],[.2,.2],[.8,.8]]) {
      const top=document.elementFromPoint(r.left+(r.right-r.left)*x,r.top+(r.bottom-r.top)*y);
      if(top&&(a.contains(top)||b.contains(top)||top.contains(a)||top.contains(b)))return true;
    }
    return false;
  }
  function snapshot(e) {
    const nodes=[];for(let p=e;p&&nodes.length<4;p=p.parentElement)nodes.push(p);
    nodes.push(...e.querySelectorAll('polygon,path,rect,circle,ellipse'));
    return nodes.map(p=>{const s=getComputedStyle(p);return [s.outlineStyle,s.outlineWidth,s.outlineColor,s.boxShadow,s.filter,s.backgroundColor,s.color,s.borderColor,s.stroke,s.strokeWidth];});
  }
  function indication(before,after) {
    return after.some((s,i)=>{const b=before[i];if(!b)return false;
      return (s[0]!=='none'&&parseFloat(s[1])>0&&!/^(transparent|rgba\(0, 0, 0, 0\))$/.test(s[2])&&s.slice(0,3).join()!==b.slice(0,3).join()) ||
        s.some((v,k)=>k>=3&&v!==b[k]&&v&&v!=='none'&&v!=='transparent'&&v!=='rgba(0, 0, 0, 0)');});
  }
  window.__bqAuditHelpers={rect,visible,overlap,snapshot,indication};
}

// Functions evaluated in Chrome are self-contained. Stable selectors also cover SVG controls.
export function inspectLayout(spacing=false) {
  const selector=e=>{if(e.id)return '#'+CSS.escape(e.id);const parts=[];while(e && e!==document.documentElement){let p=e.localName;const siblings=e.parentElement ? [...e.parentElement.children].filter(x=>x.localName===e.localName):[];if(siblings.length>1)p+=`:nth-of-type(${siblings.indexOf(e)+1})`;parts.unshift(p);e=e.parentElement;}return 'html > '+parts.join(' > ');};
  const {visible,overlap}=window.__bqAuditHelpers;
  const all=[...document.body.querySelectorAll('*')].filter(e=>visible(e,spacing)),out=[];
  if(!spacing && document.documentElement.scrollWidth>innerWidth+1) {
    const bad=all.filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1 || r.left<-1;});
    out.push({id:'reflow-horizontal-scroll',impact:'serious',description:'Horizontal scrolling at 320 CSS pixels (400% zoom equivalent)',nodes:(bad.length?bad:[document.documentElement]).slice(0,100).map(e=>({target:[selector(e)],html:e.outerHTML.slice(0,700),failureSummary:`Document width ${document.documentElement.scrollWidth}px exceeds viewport ${innerWidth}px`}))});
  }
  if(spacing) {
    const textRects=e=>{
      const out=[];for(const el of [e,...e.querySelectorAll('*')]) {
        if(!visible(el,false)||(el.closest('[aria-hidden="true"]')&&!el.closest('[role="math"]')))continue;
        for(const n of el.childNodes){if(n.nodeType!==Node.TEXT_NODE||!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);out.push(...range.getClientRects());}
      }return out;
    };
    const clipped=all.filter(e=>{
      const s=getComputedStyle(e),x=['hidden','clip'].includes(s.overflowX),y=['hidden','clip'].includes(s.overflowY),b=e.getBoundingClientRect();
      if(!(x&&e.scrollWidth>e.clientWidth+1||y&&e.scrollHeight>e.clientHeight+1)||e.clientWidth<=2||e.clientHeight<=2)return false;
      // Decorative confetti/images expanding scroll bounds are not clipped text.
      return textRects(e).some(r=>x&&(r.left<b.left-1||r.right>b.right+1)||y&&(r.top<b.top-1||r.bottom>b.bottom+1));
    });
    if(clipped.length) out.push({id:'text-spacing-clipped',impact:'serious',description:'Text-spacing override clips text; inspect each flagged container',nodes:clipped.map(e=>({target:[selector(e)],html:e.outerHTML.slice(0,700),failureSummary:`Scroll ${e.scrollWidth}×${e.scrollHeight}; client ${e.clientWidth}×${e.clientHeight}`}))});
    const rects=[];
    for(const e of all.filter(e=>(!e.closest('[aria-hidden="true"]')||e.closest('[role="math"]')))) for(const n of e.childNodes) {
      if(n.nodeType!==Node.TEXT_NODE || !n.textContent.trim()) continue;
      const range=document.createRange();range.selectNodeContents(n);
      for(const r of range.getClientRects()) if(r.width>2&&r.height>2) rects.push({e,r});
    }
    rects.sort((a,b)=>a.r.top-b.r.top);
    const seen=new Set(),overlaps=[];
    for(let i=0;i<rects.length;i++) for(let j=i+1;j<rects.length && rects[j].r.top<rects[i].r.bottom-2;j++) {
      const a=rects[i],b=rects[j];if(a.e===b.e || a.e.contains(b.e)||b.e.contains(a.e))continue;
      if(overlap(a.e,a.r,b.e,b.r)) {
        const targets=[selector(a.e),selector(b.e)].sort(),key=targets.join('|');if(seen.has(key))continue;seen.add(key);
        overlaps.push({target:targets,html:a.e.outerHTML.slice(0,350)+'\n'+b.e.outerHTML.slice(0,350),failureSummary:'Text rectangles overlap after spacing override; visual review required'});
      }
    }
    if(overlaps.length)out.push({id:'text-spacing-overlap-review',impact:'moderate',description:'Possible overlapping text after spacing override (heuristic, requires visual review)',nodes:overlaps});
  }
  return out;
}

export async function inspectKeyboard(page) {
  await page.evaluate(installAuditHelpers);
  await page.evaluate(()=>{
    window.__bqAudit={next:0,entries:new Map()};
    const body=document.body,old=body.getAttribute('tabindex');body.setAttribute('tabindex','-1');body.focus();if(old===null)body.removeAttribute('tabindex');else body.setAttribute('tabindex',old);
  });
  const collect=async()=>page.evaluate(()=>{
    const a=window.__bqAudit;let stops=0;
    const cssPath=e=>{if(e.id)return '#'+CSS.escape(e.id);let parts=[];while(e&&e!==document.documentElement){const sib=e.parentElement?[...e.parentElement.children].filter(x=>x.localName===e.localName):[];parts.unshift(e.localName+(sib.length>1?`:nth-of-type(${sib.indexOf(e)+1})`:''));e=e.parentElement;}return 'html > '+parts.join(' > ');};
    for(const e of document.querySelectorAll('a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,iframe,object,audio[controls],video[controls],[tabindex]:not([tabindex^="-"]),[contenteditable]:not([contenteditable=false]),[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=slider],[role=spinbutton]')) {
      if(!window.__bqAuditHelpers.visible(e,false)||e.matches(':disabled'))continue;
      if(e.matches('input[type=radio]') && e.name) {const group=[...document.querySelectorAll('input[type=radio]')].filter(x=>x.name===e.name&&x.form===e.form&&!x.disabled);if(e!==(group.find(x=>x.checked)||group[0]))continue;}
      stops++;if(!window.__bqAuditHelpers.visible(e)||a.entries.has(e))continue;
      const id='bqa-'+a.next++;e.setAttribute('data-bq-audit',id);
      const chain=window.__bqAuditHelpers.snapshot(e);
      a.entries.set(e,{id,target:[cssPath(e)],html:e.outerHTML.slice(0,700),before:chain});
    }
    return stops;
  });
  let count=await collect(),first=null,reached=new Set(),missingFocus=[],truncated=true;
  for(let step=0;step<Math.max(100,count*3+30);step++) {
    await page.keyboard.press('Tab');
    const focus=await page.evaluate(()=>{
      const e=document.activeElement,entry=window.__bqAudit.entries.get(e);if(!entry)return null;
      const indication=window.__bqAuditHelpers.indication(entry.before,window.__bqAuditHelpers.snapshot(e));
      return {...entry,visible:e.matches(':focus-visible'),indication};
    });
    if(!focus)continue;
    if(first===null)first=focus.id;else if(first===focus.id){truncated=false;break;}
    reached.add(focus.id);
    if(!focus.visible || !focus.indication)missingFocus.push({target:focus.target,html:focus.html,failureSummary:'Tab focus has no changed visible outline, box-shadow or ancestor filter; check alternative indicators manually'});
  }
  const unreachable=await page.evaluate(ids=>[...window.__bqAudit.entries.values()].filter(e=>!ids.includes(e.id)).map(e=>({target:e.target,html:e.html,failureSummary:'Not reached during a complete Tab traversal'})),[...reached]);
  const out=[];
  if(unreachable.length)out.push({id:'keyboard-unreachable',impact:'serious',description:'Visible interactive elements not reachable by Tab (radio groups treated as one stop)',nodes:unreachable});
  if(missingFocus.length)out.push({id:'focus-indicator-review',impact:'moderate',description:'No detected focus indicator; color-only/pseudo-element indicators need manual review',nodes:missingFocus});
  if(truncated&&count)out.push({id:'keyboard-traversal-incomplete',impact:'serious',description:'Tab traversal failed to return to its first focus stop',nodes:[{target:['body'],html:'',failureSummary:'Possible focus trap or dynamically changing tab order'}]});
  await page.evaluate(()=>{for(const e of document.querySelectorAll('[data-bq-audit]'))e.removeAttribute('data-bq-audit');delete window.__bqAudit;});
  return out;
}

export async function auditState(page,meta,axeSource) {
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(installAuditHelpers);
  await page.evaluate(axeSource);
  const axe=await page.evaluate(tags=>window.axe.run(document,{runOnly:{type:'tag',values:tags}}),TAGS);
  const findings=axe.violations.map(v=>({...meta,id:v.id,impact:v.impact,description:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,html:n.html,failureSummary:n.failureSummary,checks:[...n.any,...n.all,...n.none].map(c=>c.id)}))}));
  if(meta.width===320)findings.push(...(await page.evaluate(inspectLayout,false)).map(f=>({...meta,...f})));
  // Keyboard checks run before spacing, which might change focus styles/layout.
  const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
  findings.push(...(await inspectKeyboard(page)).map(f=>({...meta,...f})));
  await page.evaluate(({x,y})=>{document.activeElement?.blur();window.scrollTo(x,y);},scroll);
  const spacing=await page.addStyleTag({content:'* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }'});
  findings.push(...(await page.evaluate(inspectLayout,true)).map(f=>({...meta,...f})));
  await spacing.evaluate(e=>e.remove());
  return {findings,incomplete:axe.incomplete.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))}))};
}

export async function reducedMotion(page) {
  // Current Indie code is an IIFE with no exposed scheduler. Do not patch timers:
  // that would alter the behavior under audit. An opt-in hook can exercise 30s.
  const available=await page.evaluate(()=>typeof window.__bqBeeAuditScheduler==='function');
  if(!available)return {status:'skipped',reason:'Indie scheduler is not exposed; 30s observation skipped as requested'};
  await page.evaluate(()=>{window.__bqBeeSeen=!!document.querySelector('.bq-bee');window.__bqBeeObserver=new MutationObserver(records=>{if(document.querySelector('.bq-bee')||records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('.bq-bee')||n.querySelector('.bq-bee')))))window.__bqBeeSeen=true;});window.__bqBeeObserver.observe(document.documentElement,{childList:true,subtree:true});});
  await page.evaluate(()=>window.__bqBeeAuditScheduler(30000));
  await delay(50);
  return await page.evaluate(()=>{window.__bqBeeObserver.disconnect();return {status:window.__bqBeeSeen?'failed':'passed',method:'exposed scheduler, 30000ms'};});
}

export async function playStates(page,run) {
  await run('choose');
  await page.click('[data-kids]');await page.waitForSelector('[data-world]');await run('kids-home');
  await page.click('[data-world="add"]');await page.click('[data-t="1"]');await page.waitForSelector('[data-i]');await run('kids-game');
  // Solve the first addition level through real board controls. Trying its cells
  // needs no private app state and works with translated labels.
  for(let attempt=0;attempt<160;attempt++) {
    if(await page.$('[data-done]'))break;
    const cells=await page.$$eval('[data-i]',es=>es.map(e=>({index:e.dataset.i,mark:e.classList.contains('correct')})));
    if(!cells.length)throw Error('Kids game ended without result controls');
    if(cells.some(c=>c.mark)){await delay(1150);continue;}
    // Each puzzle has at most five cells on level 1. Correctness is signalled by
    // the .correct class; mistakes do not prevent reaching the result screen.
    for(const c of cells) {
      await page.click(`[data-i="${c.index}"]`);
      if(await page.$('.cell.correct')){await delay(1150);break;}
      await delay(510);
    }
  }
  await page.waitForSelector('[data-done]',{timeout:5000});await run('result');
  await page.click('[data-done]');await page.click('[data-back]');await page.click('[data-switch]');
  await page.click('[data-adult]');await page.waitForSelector('[data-mode]');await run('pro-home');
  await page.click('[data-mode="add"]');await page.click('[data-t="1"]');await page.waitForSelector('[data-i]');await run('pro-game');
}

async function main() {
  const args=process.argv.slice(2),opts={};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--help'){console.log('audit-pages.mjs [--lang en,fr] [--limit N] [--only "learn/**/*.html"]\nRuns 4 isolated browser contexts concurrently; reports/a11y/pages.{json,md}');return;}
    if(!['--lang','--limit','--only'].includes(args[i]) || !args[i+1] || args[i+1].startsWith('--'))throw Error(`Unknown/incomplete option ${args[i]}`);
    opts[args[i].slice(2)]=args[++i];
  }
  const langs=opts.lang?opts.lang.split(','):LANGS;
  if(langs.some(l=>![...LANGS,...PREVIEW_LANGS].includes(l)))throw Error(`Unknown language; choose ${[...LANGS,...PREVIEW_LANGS].join(',')}`);
  const limit=opts.limit?Number(opts.limit):Infinity;
  if(limit!==Infinity&&(!Number.isInteger(limit)||limit<1))throw Error('--limit must be a positive integer');
  const report={generatedAt:new Date().toISOString(),tags:TAGS,concurrency:4,options:opts,sites:[],runs:[],errors:[],skips:[],rules:[]};
  const findings=[],servers=[],tasks=[];let browser;
  try {
    for(const lang of langs) {
      const root=lang==='en'?ROOT:path.join(ROOT,'dist',lang);
      const pages=await discoverPages(root);
      const selected=pages.filter(p=>!opts.only||matchesGlob(p,opts.only)).slice(0,limit);
      report.sites.push({lang,availablePages:pages.length,selectedPages:selected.length});
      const server=await serveSite(root);servers.push(server);
      for(const p of selected)tasks.push({lang,path:p,origin:server.origin});
    }
    if(!tasks.length)throw Error('No pages match the requested filters');
    const require=createRequire(path.join(DEV,'tools/shots/package.json'));
    const puppeteer=require('puppeteer-core');
    const axeSource=await fs.readFile(path.join(DEV,'tools/a11y/node_modules/axe-core/axe.min.js'),'utf8');
    browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
    report.browserVersion=await browser.version();report.axeVersion=createRequire(path.join(DEV,'tools/a11y/package.json'))('axe-core/package.json').version;
    let index=0;
    await Promise.all(Array.from({length:4},async()=>{
      while(index<tasks.length) {
        const task=tasks[index++];console.log(`${task.lang} ${task.path}`);
        for(const scheme of ['light','dark'])for(const [width,height]of [[1280,800],[320,640]]) {
          const context=await browser.createBrowserContext();
          try {
            const page=await context.newPage();await page.setViewport({width,height});
            // Suppress Indie randomness during layout/focus checks; reduced motion
            // is tested separately with the same preference applied before load.
            await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]);
            await page.setRequestInterception(true);
            page.on('request',r=>{const url=r.url();if(url.startsWith(task.origin+'/')||/^(data:|blob:|about:)/.test(url))r.continue();else r.abort();});
            page.on('pageerror',e=>report.errors.push({...task,scheme,width,error:e.message,type:'page-script'}));
            const response=await page.goto(task.origin+task.path,{waitUntil:'networkidle0',timeout:30000});
            if(response.status()!==200)throw Error(`HTTP ${response.status()}`);
            const motion=await reducedMotion(page);report.skips.push({...task,scheme,width,check:'reduced-motion',...motion});
            if(motion.status==='failed')findings.push({...task,scheme,width,height,state:'page',id:'reduced-motion-indie',impact:'serious',description:'Indie appears with reduced motion',nodes:[{target:['.bq-bee'],html:'',failureSummary:'Scheduler produced a bee during 30s reduced-motion interval'}]});
            const run=async state=>{const meta={lang:task.lang,path:task.path,state,width,height,scheme};const result=await auditState(page,meta,axeSource);findings.push(...result.findings);report.runs.push({...meta,incomplete:result.incomplete});};
            if(task.path==='/play.html')await playStates(page,run);else await run('page');
          } catch(e){report.errors.push({lang:task.lang,path:task.path,scheme,width,height,error:e.stack});}
          finally{await context.close();}
        }
      }
    }));
  } catch(e){report.errors.push({error:e.stack,type:'setup'});}
  finally {
    if(browser)await browser.close();await Promise.all(servers.map(s=>s.close()));
    report.rules=groupFindings(findings);
    const dir=path.join(ROOT,'reports/a11y');await fs.mkdir(dir,{recursive:true});
    await fs.writeFile(path.join(dir,'pages.json'),JSON.stringify(report,null,2)+'\n');
    const lines=['# Page accessibility audit','',`Generated ${report.generatedAt}. ${report.runs.length} completed state/viewport/scheme runs. ${report.errors.length} errors.`, '', 'Automated findings require review. Text overlap and focus styling are heuristics; axe incomplete results need manual checks. Pages use reduced motion for stable layout checks. CSS width 320 is the reflow equivalent of 400% at 1280px, not browser magnification.', '', '| Impact | Rule | Page routes | Deduplicated nodes |','| --- | --- | ---: | ---: |',...report.rules.map(r=>`| ${r.impact} | ${md(r.id)} | ${r.pages.length} | ${r.pages.reduce((n,p)=>n+p.nodes.length,0)} |`),''];
    for(const r of report.rules) {
      lines.push(`## ${r.impact}: ${r.id}`,'',r.description+(r.helpUrl?` ([rule](${r.helpUrl}))`:''),'');
      for(const p of r.pages) {lines.push(`### ${p.path}`,'');for(const n of p.nodes)lines.push(`- \`${md(JSON.stringify(n.target))}\` — ${n.languages.join(', ')}; ${n.occurrences.length} occurrences. ${md(n.samples[0]?.failureSummary || '')}`);lines.push('');}
    }
    const skipped=report.skips.filter(s=>s.status==='skipped');
    lines.push('## Coverage','',...report.sites.map(s=>`- ${s.lang}: ${s.selectedPages}/${s.availablePages} pages selected.`),`- Reduced-motion scheduler checks skipped: ${skipped.length} (current Indie scheduler is private).`,`- Runs with axe incomplete results: ${report.runs.filter(r=>r.incomplete.length).length}; details in pages.json.`,'');
    if(report.errors.length)lines.push('## Errors','',...report.errors.map(e=>`- ${md(e.lang || '')} ${md(e.path || '')}: ${md(e.error)}`),'');
    await fs.writeFile(path.join(dir,'pages.md'),lines.join('\n'));
  }
  console.log(`reports/a11y/pages.{json,md}: ${report.rules.length} rules, ${report.errors.length} errors`);
  process.exitCode=report.errors.length?2:report.rules.length?1:0;
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  try {await main();} catch(e) {console.error(e.message);process.exitCode=2;}
}
