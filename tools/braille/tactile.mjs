// BANA design principles: remove decoration, keep symbols distinct, leave >=3mm
// between unrelated marks. One diagram/group per A4 page. Teacher review remains
// necessary: these are computer-made masters, not certified tactile graphics.
const attr = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const strip = s => s.replace(/<[^>]*>/g, ' ').replaceAll('□', '___').replace(/\s+/g, ' ').trim();
const svgs = s => [...s.matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(m => m[0]);
export const coinLabels = data => data.items.flatMap(it => svgs(it.q).map(svg => strip(svg.match(/<text\b[\s\S]*?<\/text>/)?.[0] || '')));
export const hasPictures = data => !!data.chart || data.id === 'multiplication-grid' || data.items.some(it => svgs(it.q).length);
const attributes = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1],m[2]]));

// Render the actual liblouis Unicode cells as vector dots. A Unicode string in
// the accessible label preserves the identity; no installed braille font needed.
export function brailleLabel(value) {
  const dots = [...value].flatMap((c,i) => {
    const mask = c.charCodeAt(0)-0x2800;
    return Array.from({length:6},(_,d) => mask & (1<<d) ? `<circle cx="${1+i*6+(d>=3?2.5:0)}" cy="${1+(d%3)*2.5}" r="0.75" fill="black"/>` : '').join('');
  }).join('');
  return `<svg class="braille-label" role="img" aria-label="${attr(value)}" viewBox="0 0 ${value.length*6} 7" style="width:${value.length*6}mm;height:7mm">${dots}</svg>`;
}

function clock(svg) {
  const hands = [...svg.matchAll(/<line[^>]*stroke-linecap="round"[^>]*\/>/g)].map(m => attributes(m[0]));
  const ticks = Array.from({length:12},(_,i) => {
    const a=i*Math.PI/6, r=i%3?39:36;
    return `<line class="tick" x1="${50+r*Math.sin(a)}" y1="${50-r*Math.cos(a)}" x2="${50+43*Math.sin(a)}" y2="${50-43*Math.cos(a)}" stroke="black" stroke-width="${i%3?1.1:2}"/>`;
  }).join('');
  const h=hands[0], m=hands[1], dx=Number(m.x2)-50, dy=Number(m.y2)-50, len=Math.hypot(dx,dy);
  const ux=dx/len,uy=dy/len,tx=50+35*ux,ty=50+35*uy;
  return `<svg role="img" aria-label="${attributes(svg)['aria-label']}" viewBox="0 0 100 100" style="width:100mm;height:100mm"><circle cx="50" cy="50" r="47" fill="white" stroke="black" stroke-width="1.1"/>${ticks}
  <line class="hour-hand" x1="50" y1="50" x2="${h.x2}" y2="${h.y2}" stroke="black" stroke-width="2.4" stroke-linecap="round"/>
  <line class="minute-hand" x1="50" y1="50" x2="${tx-3*ux}" y2="${ty-3*uy}" stroke="black" stroke-width="1.1"/>
  <path d="M${tx} ${ty} L${tx-5*ux-3*uy} ${ty-5*uy+3*ux} L${tx-5*ux+3*uy} ${ty-5*uy-3*ux} Z" fill="black"/></svg>`;
}

function outline(svg, hatch, index, maxW=140, maxH=100) {
  const a=attributes(svg.match(/<svg[^>]*>/)[0]), [x,y,w,h]=a.viewBox.split(/\s+/).map(Number);
  const scale=Math.min(maxW/(w+6),maxH/(h+6));
  let inner=svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace(/<text\b[\s\S]*?<\/text>/g,'');
  inner=inner.replace(/<(rect|circle|polygon|path|line)\b[^>]*\/>/g, tag => {
    const a=attributes(tag);
    let fill=a.fill==='none'?'none':hatch && a.fill && a.fill!=='#fff' && a.fill!=='white' ? `url(#hatch${index})` : 'white';
    tag=tag.replace(/\s(?:fill|stroke|stroke-width|opacity|style|class)="[^"]*"/g,'');
    return tag.replace('/>',` fill="${fill}" stroke="black" stroke-width="1.1mm" vector-effect="non-scaling-stroke"/>`);
  });
  // Hatching spacing is 6mm physically, stroke 1.1mm. Identical texture only
  // where a fraction was shaded; a rectangle grid remains entirely unfilled.
  const pitch=6/scale;
  return `<svg role="img" aria-label="${a['aria-label']}" viewBox="${x-3} ${y-3} ${w+6} ${h+6}" style="width:${(w+6)*scale}mm;height:${(h+6)*scale}mm">
    <defs><pattern id="hatch${index}" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}"><path d="M0 ${pitch} L${pitch} 0" fill="none" stroke="black" stroke-width="1.1mm" vector-effect="non-scaling-stroke"/></pattern></defs>${inner}</svg>`;
}

function grid(row,col,labels) {
  // Four-by-four pieces of the same 12x12 matrix; 25mm cells, roomy labels.
  let s='';
  for(let r=0;r<=4;r++) s+=`<line x1="35" x2="135" y1="${25+r*25}" y2="${25+r*25}"/>`;
  for(let c=0;c<=4;c++) s+=`<line y1="25" y2="125" x1="${35+c*25}" x2="${35+c*25}"/>`;
  const label=(v,x,y)=>`<foreignObject x="${x}" y="${y}" width="24" height="10"><div xmlns="http://www.w3.org/1999/xhtml">${brailleLabel(labels[String(v)])}</div></foreignObject>`;
  for(let r=0;r<4;r++) s+=label(row+r,9,33+r*25);
  for(let c=0;c<4;c++) s+=label(col+c,38+c*25,9);
  return `<svg role="img" aria-label="${row}–${row+3}, ${col}–${col+3}" viewBox="0 0 145 135" style="width:145mm;height:135mm"><g stroke="black" stroke-width="1.1" fill="none">${s}</g></svg>`;
}

function barChart(data, labels) {
  const rows=[...data.chartTable.matchAll(/<tr><th scope="row">(.*?)<\/th><td>(.*?)<\/td><\/tr>/g)].map(m=>[m[1],Number(m[2])]);
  let bars='';
  rows.forEach(([name,v],i)=>{ const x=35+i*25; bars+=`<rect x="${x}" y="${110-v*9}" width="15" height="${v*9}" fill="white" stroke="black" stroke-width="1.1"/>`; });
  let ticks='';
  for(let v=0;v<=10;v++) {
    const y=110-v*9;
    ticks+=`<line x1="25" x2="29" y1="${y}" y2="${y}" stroke="black" stroke-width="1.1"/><foreignObject x="3" y="${y-3}" width="21" height="7"><div xmlns="http://www.w3.org/1999/xhtml">${brailleLabel(labels[String(v)])}</div></foreignObject>`;
  }
  rows.forEach(([name,v],i)=>ticks+=`<foreignObject x="${35+i*25}" y="119" width="22" height="7"><div xmlns="http://www.w3.org/1999/xhtml">${brailleLabel(labels[String(i+1)])}</div></foreignObject>`);
  return `<svg role="img" aria-label="${attributes(data.chart)['aria-label']}" viewBox="0 0 170 135" style="width:170mm;height:135mm">${bars}${ticks}<line x1="29" x2="29" y1="16" y2="110" stroke="black" stroke-width="1.1"/></svg><div class="chart-key">${rows.map(([name],i)=>`${i+1}. ${name}`).join(' · ')}</div>`;
}

export const tactileCSS = `
  @page { size:A4; margin:12mm; }
  * {box-sizing:border-box;}
  html,body {background:white;color:black;font:16pt/1.35 sans-serif;margin:0;}
  .page {width:186mm;height:270mm;break-after:page;display:flex;flex-direction:column;gap:5mm;}
  .page:last-child {break-after:auto;}
  h1 {font-size:18pt;margin:0;} p {margin:0;font-size:12pt;}
  .question-label {display:flex;align-items:center;gap:8mm;font-size:24pt;margin:3mm 0;}
  .diagram {margin:3mm 0;display:flex;justify-content:center;align-items:center;gap:8mm;flex-wrap:wrap;}
  .coin {display:flex;flex-direction:column;align-items:center;gap:4mm;min-width:32mm;}
  .coin p {font-size:14pt;}
  .chart-key {font-size:12pt;width:100%;text-align:center;}
  footer {font-size:8pt;line-height:1.3;margin-top:auto;}
  .braille-label {flex:none;}
`;

export function renderTactile(data,words,labels) {
  if(!hasPictures(data)) return '';
  const pages=[];
  const page=(number,picture,prompt='') => {
    const first=pages.length===0;
    pages.push(`<section class="page"><h1>${attr(data.title)}</h1>${first?`<p>${attr(words.tactileNote)}</p>`:''}<p>${attr(data.how)}</p><div class="question-label"><b>${number}</b>${brailleLabel(labels[String(number)])}</div><div class="diagram">${picture}</div>${prompt?`<p>${prompt}</p>`:''}<footer>${attr(words.license)}<br>https://creativecommons.org/licenses/by/4.0/</footer></section>`);
  };
  if(data.id==='multiplication-grid') {
    let n=1; for(let r=1;r<=12;r+=4) for(let c=1;c<=12;c+=4) page(n++,grid(r,c,labels));
  } else if(data.chart) {
    page(1,barChart(data,labels));
  } else data.items.forEach((it,i) => {
    const pictures=svgs(it.q);
    let drawing;
    if(data.id.startsWith('time-')) drawing=clock(pictures[0]);
    else if(data.id==='counting-coins') drawing=pictures.map((svg,j)=>{
      const v=strip(svg.match(/<text\b[\s\S]*?<\/text>/)?.[0]||'');
      const labelKey=data.htmlLang==='ja' ? v.replace(/\D/g,'') : v;
      return `<div class="coin">${outline(svg,false,`${i}-${j}`,32,32)}<p>${v}</p>${brailleLabel(labels[labelKey])}</div>`;
    }).join('');
    else drawing=pictures.map((svg,j)=>outline(svg,data.id==='what-fraction-is-shaded',`${i}-${j}`)).join('');
    page(i+1,drawing,strip(it.q.replace(/<svg\b[\s\S]*?<\/svg>/g,'')));
  });
  return pages.join('');
}
