// Builds the free printable worksheets for the Learn section: A4 PDFs (questions, then an answer page) with
// Beequation Kids branding and Indie, a WebP preview of each first page, and learn-src/worksheets.json (read by
// tools/build-learn.py to show the worksheet cards). Questions come from fixed seeds, so a rebuild gives the same
// sheets. Uses the Google Chrome already on the Mac via puppeteer-core, and cwebp for the previews.
// Usage (from the repo root): node tools/make-worksheets.mjs <puppeteer-core dir> [id ...]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , PUP, ...ONLY] = process.argv;
if (!PUP) throw new Error('usage: make-worksheets.mjs <puppeteer-core dir> [id ...]');
const require = createRequire(path.join(PUP, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'worksheets');
const b64 = f => fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = w => `data:font/ttf;base64,${b64(`assets/fonts/Fredoka_${w}.ttf`)}`;
const ICON = `data:image/png;base64,${b64('assets/beequation-kids-icon.png')}`;
const YEAR = 2026;
const INK = '#1C1A4A', SOFT = '#5A5688', GRAPE = '#6A4BF5', LEMON = '#FFD84D';
const TINTS = ['#FFF1B8', '#D2F7EA', '#D6EFFF', '#FFE0F0', '#FFE3CC', '#E9E1FF'];
const CANDY = ['#FFD84D', '#7EE8C6', '#8FD3FF', '#FFA8D2', '#FFB37A', '#C6B2FF'];

// ---------- helpers ----------
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (const c of seed) { h = Math.imul(h ^ c.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = arr => arr[Math.floor(next() * arr.length)];
  return { next, int, pick };
}
// n distinct items from make(), compared by key
function unique(n, make, key = x => JSON.stringify(x)) {
  const out = [], seen = new Set();
  for (let guard = 0; out.length < n && guard < 10000; guard++) { const x = make(); const k = key(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
  if (out.length < n) throw new Error('not enough distinct questions');
  return out;
}
const box = '<span class="bx"></span>';
const fr = (n, d) => `<span class="fr"><b>${n}</b><i>${d}</i></span>`;
const pounds = p => p >= 100 ? `£${(p / 100).toFixed(2)}` : `${p}p`;

// Indie the Hexabee (apps/kids/src/components/Indie.tsx)
const HEXP = 'M82 60 L66 86 L34 86 L18 60 L34 34 L66 34 Z';
const indie = (cls = 'indie', happy = true) => `<svg class="${cls}" viewBox="1 9 91.4 80">
  <ellipse cx="42" cy="28" rx="13" ry="10" fill="#DFF1FF" stroke="${INK}" stroke-width="3" transform="rotate(-20 42 28)"/>
  <ellipse cx="60" cy="26" rx="12" ry="9.5" fill="#DFF1FF" stroke="${INK}" stroke-width="3" transform="rotate(18 60 26)"/>
  <path d="${HEXP}" fill="${LEMON}"/><rect x="35" y="34" width="7" height="52" fill="${INK}"/><rect x="50" y="34" width="7" height="52" fill="${INK}"/>
  <path d="${HEXP}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  ${happy ? `<path d="M64.5 57 Q68 52 71.5 57" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` : `<circle cx="68" cy="56" r="3.6" fill="${INK}"/><circle cx="69" cy="55" r="1.1" fill="#fff"/>`}
  <path d="${happy ? 'M62 65 Q69 74 76 64' : 'M63 66 Q69 71 75 65'}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="76" cy="61" r="3" fill="#FFA8D2"/><path d="M64 34 Q68 20 76 16" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="77" cy="15.5" r="3.2" fill="${INK}"/><path d="M18 57 L11 60 L18 63" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></svg>`;

// ---------- pictures ----------
function clock(h, m, size = 30) {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 44 : 40;
    return `<line x1="${50 + r1 * Math.sin(a)}" y1="${50 - r1 * Math.cos(a)}" x2="${50 + 47 * Math.sin(a)}" y2="${50 - 47 * Math.cos(a)}" stroke="${INK}" stroke-width="${i % 5 ? 0.8 : 1.8}"/>`;
  }).join('');
  const nums = Array.from({ length: 12 }, (_, i) => { const n = i + 1, a = n * 30 * Math.PI / 180; return `<text x="${50 + 33 * Math.sin(a)}" y="${50 - 33 * Math.cos(a) + 3.6}" text-anchor="middle" font-size="10.5">${n}</text>`; }).join('');
  const ha = ((h % 12) * 30 + m * 0.5) * Math.PI / 180, ma = m * 6 * Math.PI / 180;
  return `<svg viewBox="0 0 100 100" style="width:${size}mm;height:${size}mm"><circle cx="50" cy="50" r="48" fill="#fff" stroke="${INK}" stroke-width="2.4"/>${ticks}${nums}
    <line x1="50" y1="50" x2="${50 + 22 * Math.sin(ha)}" y2="${50 - 22 * Math.cos(ha)}" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${50 + 36 * Math.sin(ma)}" y2="${50 - 36 * Math.cos(ma)}" stroke="${GRAPE}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3" fill="${INK}"/></svg>`;
}
const timeWords = (h, m) => {
  const hh = h % 12 || 12, next = (h % 12) + 1;
  if (m === 0) return `${hh} o'clock`;
  if (m === 30) return `half past ${hh}`;
  if (m === 15) return `quarter past ${hh}`;
  if (m === 45) return `quarter to ${next}`;
  return m < 30 ? `${m} minutes past ${hh}` : `${60 - m} minutes to ${next}`;
};
const digital = (h, m) => `${h % 12 || 12}:${String(m).padStart(2, '0')}`;

function fractionShape(kind, n, k, size = 26) {
  if (kind === 'bar') {
    const w = 100 / n;
    return `<svg viewBox="-1 -1 102 32" style="width:${size * 1.4}mm;height:${size * 0.45}mm">${Array.from({ length: n }, (_, i) => `<rect x="${i * w}" y="0" width="${w}" height="30" fill="${i < k ? '#FFA8D2' : '#fff'}" stroke="${INK}" stroke-width="1.2"/>`).join('')}</svg>`;
  }
  if (kind === 'circle') {
    const parts = Array.from({ length: n }, (_, i) => {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const x0 = 50 + 46 * Math.cos(a0), y0 = 50 + 46 * Math.sin(a0), x1 = 50 + 46 * Math.cos(a1), y1 = 50 + 46 * Math.sin(a1);
      return `<path d="M50 50 L${x0} ${y0} A46 46 0 ${1 / n > 0.5 ? 1 : 0} 1 ${x1} ${y1} Z" fill="${i < k ? '#8FD3FF' : '#fff'}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 100" style="width:${size}mm;height:${size}mm">${n === 1 ? `<circle cx="50" cy="50" r="46" fill="#8FD3FF" stroke="${INK}" stroke-width="1.6"/>` : parts}</svg>`;
  }
  // grid of n squares (rows × cols)
  const cols = n % 4 === 0 && n > 4 ? 4 : n % 3 === 0 && n > 3 ? 3 : n, rows = n / cols, s = 100 / Math.max(cols, rows);
  return `<svg viewBox="-1 -1 ${cols * s + 2} ${rows * s + 2}" style="width:${size * cols / Math.max(cols, rows)}mm;height:${size * rows / Math.max(cols, rows)}mm">${Array.from({ length: n }, (_, i) => `<rect x="${(i % cols) * s}" y="${Math.floor(i / cols) * s}" width="${s}" height="${s}" fill="${i < k ? '#7EE8C6' : '#fff'}" stroke="${INK}" stroke-width="1.4"/>`).join('')}</svg>`;
}

const COINS = { 1: ['#D9895B', 20.3, 'circle'], 2: ['#D9895B', 25.9, 'circle'], 5: ['#D7DCE3', 18, 'circle'], 10: ['#D7DCE3', 24.5, 'circle'],
  20: ['#D7DCE3', 21.4, 7], 50: ['#D7DCE3', 27.3, 7], 100: ['#F2C14E', 23.4, 12], 200: ['#F2C14E', 28.4, 'circle'] };
function coin(v) {
  const [fill, d, shape] = COINS[v], r = d / 2;
  const label = v >= 100 ? `£${v / 100}` : `${v}p`;
  const outline = shape === 'circle' ? `<circle cx="${r}" cy="${r}" r="${r - 0.6}" fill="${fill}" stroke="${INK}" stroke-width="0.8"/>`
    : `<polygon points="${Array.from({ length: shape }, (_, i) => { const a = (i / shape) * 2 * Math.PI - Math.PI / 2; return `${r + (r - 0.6) * Math.cos(a)},${r + (r - 0.6) * Math.sin(a)}`; }).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
  const inner = v === 200 ? `<circle cx="${r}" cy="${r}" r="${r * 0.66}" fill="#D7DCE3" stroke="${INK}" stroke-width="0.4"/>` : v === 100 ? `<circle cx="${r}" cy="${r}" r="${r * 0.64}" fill="#D7DCE3" stroke="${INK}" stroke-width="0.4"/>` : '';
  return `<svg viewBox="0 0 ${d} ${d}" style="width:${d * 0.5}mm;height:${d * 0.5}mm">${outline}${inner}<text x="${r}" y="${r + 2.6}" text-anchor="middle" font-size="${label.length > 2 ? 6.4 : 7.4}" font-weight="700">${label}</text></svg>`;
}

function poly(n, size = 22, fill = CANDY[0], rect = false) {
  if (n === 0) return `<svg viewBox="0 0 100 100" style="width:${size}mm;height:${size}mm"><circle cx="50" cy="50" r="44" fill="${fill}" stroke="${INK}" stroke-width="2.4"/></svg>`;
  if (rect) return `<svg viewBox="0 0 100 100" style="width:${size}mm;height:${size}mm"><rect x="6" y="24" width="88" height="52" fill="${fill}" stroke="${INK}" stroke-width="2.4"/></svg>`;
  const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2 + (n % 2 ? 0 : Math.PI / n); return `${50 + 44 * Math.cos(a)},${52 + 44 * Math.sin(a)}`; }).join(' ');
  return `<svg viewBox="0 0 100 100" style="width:${size}mm;height:${size}mm"><polygon points="${pts}" fill="${fill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
}

function column(a, b, op) {
  const w = Math.max(String(a).length, String(b).length) + 1;
  const row = (s, sign = '') => `<tr>${Array.from({ length: w }, (_, i) => { const d = String(s).padStart(w, ' ')[i]; return `<td>${i === 0 && sign ? sign : d === ' ' ? '' : d}</td>`; }).join('')}</tr>`;
  return `<table class="col">${row(a)}${row(b, op)}<tr class="ans">${'<td></td>'.repeat(w)}</tr></table>`;
}

// ---------- the worksheets ----------
// Each: id, title, topic (slug in tools/build-learn.py), years, desc (card text), how (instructions),
// tip (Indie's tip on the sheet), cols, and make(r) → { items: [{q, a}], kind: 'list' | 'cards' | 'whole' }.
const SHEETS = [
  // counting and place value
  { id: 'missing-numbers-to-100', title: 'Missing numbers to 100', topic: 'counting-and-place-value', years: ['year-1', 'year-2'],
    desc: 'Count in 1s, 2s, 5s and 10s', how: 'Fill in the missing numbers in each sequence.', tip: 'Say the numbers out loud as you count. Your ears can spot a jump that looks wrong!', cols: 1,
    make: r => ({ kind: 'list', items: unique(12, () => { const step = r.pick([1, 2, 5, 10]); const start = step === 1 ? r.int(1, 90) : step * r.int(0, Math.floor((100 - 6 * step) / step)); const seq = Array.from({ length: 7 }, (_, i) => start + i * step); const gaps = new Set(); while (gaps.size < 3) gaps.add(r.int(1, 6)); return { seq, gaps: [...gaps] }; }, x => x.seq[0] + '-' + x.seq[1])
      .map(({ seq, gaps }) => ({ q: seq.map((n, i) => gaps.includes(i) ? box : `<b class="n">${n}</b>`).join('<span class="sep">,</span>'), a: gaps.sort((x, y) => x - y).map(i => seq[i]).join(', ') })) }) },
  { id: 'tens-and-ones', title: 'Tens and ones', topic: 'counting-and-place-value', years: ['year-1', 'year-2'],
    desc: 'Partition two-digit numbers', how: 'Split each number into tens and ones.', tip: 'The digit on the left tells you how many tens. 47 is 4 tens and 7 ones.', cols: 2,
    make: r => ({ kind: 'list', items: unique(20, () => r.int(11, 99), x => x).map(n => ({ q: `<b class="n">${n}</b> = ${box} tens and ${box} ones`, a: `${Math.floor(n / 10)} tens, ${n % 10} ones` })) }) },
  { id: 'hundreds-tens-ones', title: 'Hundreds, tens and ones', topic: 'counting-and-place-value', years: ['year-2', 'year-3'],
    desc: 'Place value to 1,000', how: 'Write each number as hundreds + tens + ones.', tip: 'A zero is a placeholder. In 405 there are no tens, but the 0 keeps the 4 in the hundreds place.', cols: 1,
    make: r => ({ kind: 'list', items: unique(14, () => r.int(101, 999), x => x).map(n => ({ q: `<b class="n">${n}</b> = ${box} + ${box} + ${box}`, a: `${Math.floor(n / 100) * 100} + ${Math.floor(n / 10) % 10 * 10} + ${n % 10}` })) }) },
  { id: 'rounding', title: 'Rounding numbers', topic: 'counting-and-place-value', years: ['year-4', 'year-5'],
    desc: 'Round to the nearest 10, 100 and 1,000', how: 'Round each number as shown.', tip: 'Look at the digit to the right of the place you are rounding to. 5 or more rounds up.', cols: 2,
    make: r => ({ kind: 'list', items: unique(24, () => { const to = r.pick([10, 100, 1000]); return { n: r.int(to === 10 ? 11 : to === 100 ? 101 : 1001, 9999), to }; }, x => x.n + '/' + x.to)
      .map(({ n, to }) => ({ q: `<b class="n">${n.toLocaleString('en-GB')}</b> to the nearest ${to.toLocaleString('en-GB')} → ${box}`, a: (Math.round(n / to) * to).toLocaleString('en-GB') })) }) },
  // addition and subtraction
  { id: 'number-bonds-to-10', title: 'Number bonds to 10', topic: 'addition-and-subtraction', years: ['reception', 'year-1'],
    desc: 'Pairs that make 10', how: 'Write the missing number to make 10.', tip: 'Use your fingers! Hold up 7 fingers. How many are still down? That makes 10.', cols: 3,
    make: r => { const qs = []; for (let i = 0; i < 24; i++) { const a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10][(i * 7 + 3) % 11]; const first = i % 2 === 0; qs.push({ q: first ? `<b class="n">${a}</b> + ${box} = 10` : `${box} + <b class="n">${a}</b> = 10`, a: String(10 - a) }); } return { kind: 'list', items: qs }; } },
  { id: 'number-bonds-to-20', title: 'Number bonds to 20', topic: 'addition-and-subtraction', years: ['year-1', 'year-2'],
    desc: 'Pairs that make 20', how: 'Write the missing number to make 20.', tip: 'If you know 3 + 7 = 10, then 13 + 7 = 20. Bonds to 10 help with bonds to 20!', cols: 3,
    make: r => ({ kind: 'list', items: Array.from({ length: 24 }, (_, i) => { const a = (i * 8 + 3) % 21; return i % 3 === 2 ? { q: `20 − <b class="n">${a}</b> = ${box}`, a: String(20 - a) } : i % 2 ? { q: `${box} + <b class="n">${a}</b> = 20`, a: String(20 - a) } : { q: `<b class="n">${a}</b> + ${box} = 20`, a: String(20 - a) }; }) }) },
  { id: 'add-and-subtract-within-20', title: 'Adding and subtracting to 20', topic: 'addition-and-subtraction', years: ['year-1', 'year-2'],
    desc: 'Mixed sums within 20', how: 'Work out each answer.', tip: 'For take-aways, count back on a number line, or think: what do I add to the small number to get the big one?', cols: 3,
    make: r => ({ kind: 'list', items: unique(30, () => { const add = r.next() < 0.5; const a = r.int(add ? 2 : 6, add ? 14 : 20), b = add ? r.int(1, 20 - a) : r.int(1, a - 1); return { add, a, b }; }).map(({ add, a, b }) => ({ q: `${a} ${add ? '+' : '−'} ${b} = ${box}`, a: String(add ? a + b : a - b) })) }) },
  { id: 'column-addition', title: 'Column addition', topic: 'addition-and-subtraction', years: ['year-3', 'year-4'],
    desc: 'Three-digit numbers, with exchanging', how: 'Add using the column method. Start with the ones!', tip: 'If a column adds up to 10 or more, exchange 10 for 1 in the next column and write it underneath.', cols: 4,
    make: r => ({ kind: 'cards', items: unique(12, () => [r.int(105, 689), r.int(106, 299)]).map(([a, b]) => ({ q: column(a, b, '+'), a: String(a + b) })) }) },
  { id: 'column-subtraction', title: 'Column subtraction', topic: 'addition-and-subtraction', years: ['year-3', 'year-4'],
    desc: 'Three-digit numbers, with exchanging', how: 'Subtract using the column method. Start with the ones!', tip: 'Check a subtraction with an addition: if 532 − 178 = 354, then 354 + 178 should be 532.', cols: 4,
    make: r => ({ kind: 'cards', items: unique(12, () => { const a = r.int(402, 987), b = r.int(118, a - 101); return [a, b]; }).map(([a, b]) => ({ q: column(a, b, '−'), a: String(a - b) })) }) },
  // multiplication and division
  { id: 'times-tables-2-5-10', title: '2, 5 and 10 times tables', topic: 'multiplication-and-division', years: ['year-2'],
    desc: 'Mixed questions', how: 'Work out each answer.', tip: 'Every answer in the 10 times table ends in 0, and every answer in the 5 times table ends in 0 or 5.', cols: 3,
    make: r => ({ kind: 'list', items: unique(30, () => [r.pick([2, 5, 10]), r.int(1, 12), r.next() < 0.5]).map(([t, n, s]) => ({ q: s ? `${n} × ${t} = ${box}` : `${t} × ${n} = ${box}`, a: String(t * n) })) }) },
  { id: 'times-tables-3-4-8', title: '3, 4 and 8 times tables', topic: 'multiplication-and-division', years: ['year-3'],
    desc: 'Mixed questions', how: 'Work out each answer.', tip: 'The 8 times table is the 4 times table doubled. If 4 × 6 = 24, then 8 × 6 = 48.', cols: 3,
    make: r => ({ kind: 'list', items: unique(30, () => [r.pick([3, 4, 8]), r.int(1, 12), r.next() < 0.5]).map(([t, n, s]) => ({ q: s ? `${n} × ${t} = ${box}` : `${t} × ${n} = ${box}`, a: String(t * n) })) }) },
  { id: 'multiplication-check-practice', title: 'Multiplication check practice', topic: 'multiplication-and-division', years: ['year-4'],
    desc: '25 questions up to 12 × 12', how: 'Like the real check, try to answer each one in about 6 seconds. Skip and come back if you need to.', tip: 'The trickiest facts are usually 6 × 7, 6 × 8, 7 × 8, 8 × 9 and 12 × 7. Practise those a little extra!', cols: 3,
    make: r => ({ kind: 'list', items: unique(25, () => [r.int(2, 12), r.int(2, 12)], ([a, b]) => Math.min(a, b) + 'x' + Math.max(a, b)).map(([a, b]) => ({ q: `${a} × ${b} = ${box}`, a: String(a * b) })) }) },
  { id: 'multiplication-grid', title: 'Multiplication grid', topic: 'multiplication-and-division', years: ['year-3', 'year-4', 'year-5', 'year-6'],
    desc: 'Fill in the 12 × 12 grid', how: 'Multiply the number at the start of each row by the number at the top of each column.', tip: 'Fill in the easy rows first (1, 2, 5, 10, 11). Then use the grid\'s pattern: 3 × 7 is the same as 7 × 3.', cols: 1,
    make: () => { const g = full => `<table class="grid12"><tr><th>×</th>${Array.from({ length: 12 }, (_, i) => `<th>${i + 1}</th>`).join('')}</tr>${Array.from({ length: 12 }, (_, r) => `<tr><th>${r + 1}</th>${Array.from({ length: 12 }, (_, c) => `<td>${full ? (r + 1) * (c + 1) : ''}</td>`).join('')}</tr>`).join('')}</table>`; return { kind: 'whole', items: [{ q: g(false), a: g(true) }] }; } },
  { id: 'division-facts', title: 'Division facts', topic: 'multiplication-and-division', years: ['year-3', 'year-4'],
    desc: 'Using times tables to divide', how: 'Work out each answer.', tip: 'Division is the inverse of multiplication. For 42 ÷ 6, ask: 6 times what makes 42?', cols: 3,
    make: r => ({ kind: 'list', items: unique(30, () => [r.int(2, 12), r.int(2, 12)]).map(([a, b]) => ({ q: `${a * b} ÷ ${a} = ${box}`, a: String(b) })) }) },
  { id: 'short-multiplication', title: 'Short multiplication', topic: 'multiplication-and-division', years: ['year-4', 'year-5'],
    desc: 'Three-digit by one-digit numbers', how: 'Multiply using the column method.', tip: 'Start with the ones. Carry any tens into the next column and add them after you multiply.', cols: 4,
    make: r => ({ kind: 'cards', items: unique(12, () => [r.int(112, 498), r.int(3, 9)]).map(([a, b]) => ({ q: column(a, b, '×'), a: String(a * b) })) }) },
  // fractions
  { id: 'what-fraction-is-shaded', title: 'What fraction is shaded?', topic: 'fractions', years: ['year-1', 'year-2', 'year-3'],
    desc: 'Halves, thirds, quarters and more', how: 'Write the fraction of each shape that is shaded.', tip: 'Count all the equal parts first: that is the bottom number. Then count the shaded parts: that is the top.', cols: 3,
    make: r => ({ kind: 'cards', items: unique(12, () => { const kind = r.pick(['bar', 'circle', 'grid']); const n = r.pick(kind === 'grid' ? [4, 6, 8, 9] : [2, 3, 4, 5, 6, 8]); return [kind, n, r.int(1, n - 1)]; }, x => x.join()).map(([kind, n, k]) => ({ q: `${fractionShape(kind, n, k)}<div class="ansline">${box}</div>`, a: fr(k, n) })) }) },
  { id: 'fractions-of-amounts', title: 'Fractions of amounts', topic: 'fractions', years: ['year-3', 'year-4'],
    desc: 'Like ½ of 12 and ¾ of 20', how: 'Work out each answer.', tip: 'Divide by the bottom number, then multiply by the top. For ¾ of 20: 20 ÷ 4 = 5, then 5 × 3 = 15.', cols: 3,
    make: r => ({ kind: 'list', items: unique(24, () => { const d = r.pick([2, 3, 4, 5, 10]), n = r.int(1, d - 1), m = r.int(2, 10); return [n, d, d * m]; }).map(([n, d, x]) => ({ q: `${fr(n, d)} of ${x} = ${box}`, a: String(x / d * n) })) }) },
  { id: 'equivalent-fractions', title: 'Equivalent fractions', topic: 'fractions', years: ['year-4', 'year-5'],
    desc: 'Find the missing number', how: 'Write the missing number so the fractions are equal.', tip: 'Whatever you do to the bottom, do the same to the top. ½ = ⁴⁄₈ because both numbers were multiplied by 4.', cols: 3,
    make: r => ({ kind: 'list', items: unique(24, () => { const d = r.pick([2, 3, 4, 5, 6, 10]), n = r.int(1, d - 1), k = r.int(2, 6), top = r.next() < 0.5; return [n, d, k, top]; }, x => x.slice(0, 3).join()).map(([n, d, k, top]) => ({ q: top ? `${fr(n, d)} = ${fr(box, d * k)}` : `${fr(n, d)} = ${fr(n * k, box)}`, a: String(top ? n * k : d * k) })) }) },
  // decimals and percentages
  { id: 'tenths-and-hundredths', title: 'Tenths and hundredths', topic: 'decimals-and-percentages', years: ['year-4', 'year-5'],
    desc: 'Fractions as decimals', how: 'Write each fraction as a decimal.', tip: 'Tenths go in the first place after the decimal point, hundredths in the second. ⁷⁄₁₀₀ is 0.07.', cols: 3,
    make: r => ({ kind: 'list', items: unique(24, () => { const d = r.pick([10, 100]); return [r.int(1, d === 10 ? 9 : 99), d]; }, x => x.join('/')).map(([n, d]) => ({ q: `${fr(n, d)} = ${box}`, a: (n / d).toFixed(d === 10 ? 1 : 2) })) }) },
  { id: 'percentages-of-amounts', title: 'Percentages of amounts', topic: 'decimals-and-percentages', years: ['year-5', 'year-6'],
    desc: '10%, 25%, 50% and more', how: 'Work out each answer.', tip: 'Find 10% by dividing by 10. Then build up: 30% is three lots of 10%, and 5% is half of 10%.', cols: 2,
    make: r => ({ kind: 'list', items: unique(20, () => { const p = r.pick([10, 20, 25, 50, 75, 5, 30, 40]); const base = p === 25 || p === 75 ? 4 * r.int(2, 30) : p === 5 ? 20 * r.int(1, 15) : 10 * r.int(2, 30); return [p, base]; }, x => x.join()).map(([p, x]) => ({ q: `${p}% of ${x} = ${box}`, a: String(x * p / 100) })) }) },
  // time
  { id: 'time-oclock-and-half-past', title: "O'clock and half past", topic: 'telling-the-time', years: ['year-1'],
    desc: 'Read the clocks', how: 'Write the time shown on each clock.', tip: 'The short hand shows the hour. The long hand shows the minutes: pointing at 12 means o\'clock, at 6 means half past.', cols: 3,
    make: r => ({ kind: 'cards', items: unique(9, () => [r.int(1, 12), r.pick([0, 30])], x => x.join()).map(([h, m]) => ({ q: `${clock(h, m)}<div class="ansline wide"></div>`, a: timeWords(h, m) })) }) },
  { id: 'time-quarter-past-and-to', title: 'Quarter past and quarter to', topic: 'telling-the-time', years: ['year-2'],
    desc: 'Read the clocks', how: 'Write the time shown on each clock in words.', tip: 'Quarter past: the long hand points at 3. Quarter to: it points at 9, and the short hand is nearly at the next hour.', cols: 3,
    make: r => ({ kind: 'cards', items: unique(9, () => [r.int(1, 12), r.pick([0, 15, 30, 45])], x => x.join()).map(([h, m]) => ({ q: `${clock(h, m)}<div class="ansline wide"></div>`, a: timeWords(h, m) })) }) },
  { id: 'time-to-5-minutes', title: 'Time to 5 minutes', topic: 'telling-the-time', years: ['year-2', 'year-3'],
    desc: 'Read the clocks', how: 'Write each time in words and as a digital time.', tip: 'Count in 5s as the long hand goes round: each number on the clock is 5 more minutes.', cols: 3,
    make: r => ({ kind: 'cards', items: unique(9, () => [r.int(1, 12), 5 * r.int(1, 11)], x => x.join()).map(([h, m]) => ({ q: `${clock(h, m)}<div class="ansline wide"></div><div class="ansline wide"></div>`, a: `${timeWords(h, m)} (${digital(h, m)})` })) }) },
  // money
  { id: 'counting-coins', title: 'Counting coins', topic: 'money', years: ['year-1', 'year-2'],
    desc: 'Add up UK coins', how: 'How much money is in each purse? Write the total.', tip: 'Start with the coin worth the most, then count on. 20p, 30p, 35p, 36p…', cols: 3,
    make: r => ({ kind: 'cards', items: unique(9, () => { const n = r.int(3, 5); return Array.from({ length: n }, () => r.pick([1, 2, 5, 10, 20, 50])).sort((a, b) => b - a); }, x => x.join()).map(cs => ({ q: `<div class="coins">${cs.map(coin).join('')}</div><div class="ansline">${box}</div>`, a: pounds(cs.reduce((s, c) => s + c, 0)) })) }) },
  { id: 'giving-change', title: 'Giving change', topic: 'money', years: ['year-3'],
    desc: 'Change from £1, £2 and £5', how: 'Work out the change for each shopping trip.', tip: 'Count up from the price to the money you paid. From 65p to £1: 5p makes 70p, then 30p makes £1. Change is 35p.', cols: 2,
    make: r => ({ kind: 'list', items: unique(16, () => { const paid = r.pick([100, 200, 500]); const cost = 5 * r.int(2, paid / 5 - 1); return [r.pick(['a pencil', 'an apple', 'a comic', 'a juice', 'a notebook', 'some stickers', 'a toy car', 'a cake']), cost, paid]; }, x => x.slice(1).join()).map(([item, cost, paid]) => ({ q: `You buy ${item} for ${pounds(cost)} and pay with ${pounds(paid)}. Change: ${box}`, a: pounds(paid - cost) })) }) },
  // measurement
  { id: 'perimeter-and-area', title: 'Perimeter and area', topic: 'measurement', years: ['year-4', 'year-5'],
    desc: 'Rectangles on a centimetre grid', how: 'Each square is 1 cm by 1 cm. Find the perimeter and area of each rectangle.', tip: 'Perimeter is the distance all the way round (add the sides). Area is the number of squares inside.', cols: 2,
    make: r => ({ kind: 'cards', items: unique(6, () => [r.int(2, 8), r.int(2, 5)], x => x.join()).map(([w, h]) => { const s = 4.2; const cells = Array.from({ length: w * h }, (_, i) => `<rect x="${(i % w) * s}" y="${Math.floor(i / w) * s}" width="${s}" height="${s}" fill="#D2F7EA" stroke="${INK}" stroke-width="0.25"/>`).join(''); return { q: `<svg viewBox="-1 -1 ${w * s + 2} ${h * s + 2}" style="width:${w * s}mm;height:${h * s}mm">${cells}<rect x="0" y="0" width="${w * s}" height="${h * s}" fill="none" stroke="${INK}" stroke-width="0.7"/></svg><div class="ansline">Perimeter ${box} cm</div><div class="ansline">Area ${box} cm²</div>`, a: `Perimeter ${2 * (w + h)} cm, area ${w * h} cm²` }; }) }) },
  // shape
  { id: '2d-shapes', title: '2D shapes', topic: 'shape-and-geometry', years: ['year-1', 'year-2'],
    desc: 'Names, sides and vertices', how: 'Name each shape and count its sides and vertices (corners).', tip: 'Put a dot on each corner as you count, so you don\'t count one twice.', cols: 3,
    make: () => ({ kind: 'cards', items: [[3, 'triangle'], [4, 'square'], [4, 'rectangle', true], [5, 'pentagon'], [6, 'hexagon'], [8, 'octagon'], [0, 'circle'], [7, 'heptagon'], [10, 'decagon']].map(([n, name, rect], i) => ({ q: `${poly(n, 22, CANDY[i % 6], rect)}<div class="ansline wide">Name:</div><div class="ansline">Sides ${box} Vertices ${box}</div>`, a: n === 0 ? 'circle: 1 curved side, 0 vertices' : `${name}: ${n} sides, ${n} vertices` })) }) },
  // data
  { id: 'reading-bar-charts', title: 'Reading a bar chart', topic: 'data-and-graphs', years: ['year-2', 'year-3'],
    desc: 'Favourite fruit survey', how: 'Class 3 voted for their favourite fruit. Use the bar chart to answer the questions.', tip: 'Run your finger from the top of the bar across to the numbers on the side to read its value.', cols: 1,
    make: r => { const fruits = ['Apples', 'Bananas', 'Grapes', 'Oranges', 'Pears'], vals = []; while (vals.length < 5) { const v = r.int(2, 10); if (!vals.includes(v)) vals.push(v); }
      const bw = 14, gap = 8, H = 60, sc = H / 10;
      const bars = vals.map((v, i) => `<rect x="${14 + i * (bw + gap)}" y="${H - v * sc + 4}" width="${bw}" height="${v * sc}" fill="${CANDY[i]}" stroke="${INK}" stroke-width="0.5"/><text x="${14 + i * (bw + gap) + bw / 2}" y="${H + 10}" text-anchor="middle" font-size="4.2">${fruits[i]}</text>`).join('');
      const grid = Array.from({ length: 11 }, (_, i) => `<line x1="10" x2="${14 + 5 * (bw + gap)}" y1="${H - i * sc + 4}" y2="${H - i * sc + 4}" stroke="#C7DDF0" stroke-width="0.3"/><text x="8" y="${H - i * sc + 5.4}" text-anchor="end" font-size="3.8">${i}</text>`).join('');
      const chart = `<svg viewBox="0 0 130 78" style="width:150mm;height:90mm">${grid}${bars}<line x1="10" x2="10" y1="4" y2="${H + 4}" stroke="${INK}" stroke-width="0.6"/><line x1="10" x2="${14 + 5 * (bw + gap)}" y1="${H + 4}" y2="${H + 4}" stroke="${INK}" stroke-width="0.6"/></svg>`;
      const mx = vals.indexOf(Math.max(...vals)), mn = vals.indexOf(Math.min(...vals));
      const qs = [[`How many children chose ${fruits[1].toLowerCase()}?`, vals[1]], [`Which fruit was the most popular?`, fruits[mx]], [`Which fruit was the least popular?`, fruits[mn]],
        [`How many more children chose ${fruits[mx].toLowerCase()} than ${fruits[mn].toLowerCase()}?`, vals[mx] - vals[mn]], [`How many children voted altogether?`, vals.reduce((a, b) => a + b, 0)]];
      return { kind: 'chart', chart, items: qs.map(([q, a]) => ({ q: `${q} <span class="line"></span>`, a: String(a) })) }; } },
  // algebra
  { id: 'missing-number-problems', title: 'Missing number problems', topic: 'algebra-and-ratio', years: ['year-3', 'year-4', 'year-5', 'year-6'],
    desc: 'Find the number in the box', how: 'Find the missing number in each number sentence.', tip: 'Use the inverse. For ▢ + 7 = 15, work out 15 − 7. For 3 × ▢ = 24, work out 24 ÷ 3.', cols: 3,
    make: r => ({ kind: 'list', items: unique(24, () => { const t = r.int(0, 3); const a = r.int(2, 12), b = r.int(2, 12); return [t, a, b]; }, x => x.join()).map(([t, a, b]) => {
      if (t === 0) return { q: `${box} + ${a} = ${a + b + 10}`, a: String(b + 10) };
      if (t === 1) return { q: `${a + b + 10} − ${box} = ${a}`, a: String(b + 10) };
      if (t === 2) return { q: `${a} × ${box} = ${a * b}`, a: String(b) };
      return { q: `${box} ÷ ${a} = ${b}`, a: String(a * b) }; }) }) },
];

// ---------- page layout ----------
const yearsLabel = ys => { const n = { reception: 'Reception', 'year-1': 'Year 1', 'year-2': 'Year 2', 'year-3': 'Year 3', 'year-4': 'Year 4', 'year-5': 'Year 5', 'year-6': 'Year 6' }; return ys.length > 2 ? `${n[ys[0]]} to ${n[ys[ys.length - 1]]}` : ys.map(y => n[y]).join(' and '); };
const header = (title, sub, happy) => `<header><img class="icon" src="${ICON}" alt=""><div class="brand"><div class="name">Beequation <span>Kids</span></div><h1>${title}</h1></div><div class="sub">${sub}</div>${indie('indie', happy)}</header>`;
const footer = `<footer><span class="dots"><i></i><i></i><i></i></span><span>Free to copy for home and classroom use. More worksheets at <b>beequation.com/learn</b></span><span class="c">© ${YEAR} Trett Labs Limited</span></footer>`;

function render(s) {
  const r = rng('ws-' + s.id), { kind, items, chart } = s.make(r), sub = yearsLabel(s.years);
  const qs = kind === 'whole' ? `<div class="whole">${items[0].q}</div>`
    : kind === 'chart' ? `<div class="whole">${chart}</div><ol class="qlist">${items.map(it => `<li>${it.q}</li>`).join('')}</ol>`
    : `<div class="${kind}" style="grid-template-columns:repeat(${s.cols},1fr)">${items.map((it, i) => `<div class="it"><span class="num" style="background:${CANDY[i % 6]}">${i + 1}</span><div class="q">${it.q}</div></div>`).join('')}</div>`;
  const as = kind === 'whole' ? `<div class="whole">${items[0].a}</div>`
    : `<ol class="alist" style="columns:${kind === 'cards' && items[0].a.length > 14 ? 2 : 3}">${items.map(it => `<li>${it.a}</li>`).join('')}</ol>`;
  return `<section class="page">${header(s.title, sub, false)}<p class="how">${s.how}</p>
    <div class="fields"><span>Name</span><span>Date</span></div>${qs}
    <div class="tipbar">${indie('mini')}<p><b>Indie's tip:</b> ${s.tip}</p></div>${footer}</section>
    <section class="page">${header('Answers', s.title, true)}<div class="answers">${as}</div>
    <div class="promo"><img class="icon" src="${ICON}" alt=""><p><b>Practise with Indie.</b> Play free honeycomb number puzzles at beequation.com, or look for Beequation Kids on your phone or tablet: no ads, no tracking, no timers.</p></div>${footer}</section>`;
}

const css = `
  @font-face { font-family: Fredoka; font-weight: 500; src: url(${font('500Medium')}); }
  @font-face { font-family: Fredoka; font-weight: 600; src: url(${font('600SemiBold')}); }
  @font-face { font-family: Fredoka; font-weight: 700; src: url(${font('700Bold')}); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #fff; }
  body { font-family: Fredoka; font-weight: 500; color: ${INK}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  svg text { font-family: Fredoka; font-weight: 600; fill: ${INK}; }
  .page { width: 186mm; height: 270mm; margin: 0 auto; display: flex; flex-direction: column; break-after: page; position: relative; }
  .page:last-child { break-after: auto; }
  header { display: flex; align-items: center; gap: 4mm; background: #EAF6FF; border-radius: 6mm; padding: 3.5mm 4mm; position: relative; }
  .icon { width: 15mm; height: 15mm; border-radius: 3.6mm; }
  .brand .name { font-weight: 700; font-size: 11pt; color: ${GRAPE}; letter-spacing: 0.2pt; } .brand .name span { color: ${INK}; }
  h1 { font-weight: 700; font-size: 21pt; line-height: 1.05; }
  .sub { margin-left: auto; margin-right: 25mm; font-weight: 600; font-size: 9.5pt; color: ${SOFT}; text-align: right; max-width: 45mm; }
  .indie { position: absolute; right: 3mm; top: 1mm; width: 22mm; height: 19.25mm; transform: rotate(-6deg); }
  .how { font-size: 11pt; margin: 4mm 1mm 0; line-height: 1.35; }
  .fields { display: flex; gap: 8mm; margin: 4mm 1mm 4mm; font-size: 10pt; font-weight: 600; }
  .fields span { flex: 1; border-bottom: 0.35mm solid ${INK}; padding-bottom: 1mm; }
  .list, .cards { display: grid; gap: 3mm 4mm; align-content: start; flex: 1; }
  .list .it { display: flex; align-items: center; gap: 2.5mm; font-size: 13pt; min-height: 10.5mm; border-bottom: 0.25mm dashed #C7DDF0; }
  .cards .it { border: 0.35mm solid #C7DDF0; border-radius: 4mm; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm 2mm 3mm; }
  .cards .it .q { display: flex; flex-direction: column; align-items: center; gap: 2.5mm; font-size: 11pt; }
  .num { flex: none; width: 6.2mm; height: 6.2mm; border-radius: 50%; font-weight: 700; font-size: 8.5pt; display: inline-flex; align-items: center; justify-content: center; }
  .cards .num { position: absolute; left: 2mm; top: 2mm; }
  .q { line-height: 1.6; } .q .n { font-weight: 700; } .sep { margin-right: 2mm; color: ${SOFT}; }
  .bx { display: inline-block; width: 11mm; height: 8mm; border: 0.4mm solid ${INK}; border-radius: 1.6mm; vertical-align: middle; background: #fff; }
  .fr { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.05; margin: 0 0.6mm; font-weight: 700; }
  .fr b, .fr i { font-style: normal; padding: 0 0.6mm; } .fr i { border-top: 0.4mm solid ${INK}; }
  .fr .bx { width: 9mm; height: 6.4mm; margin: 0.4mm 0; }
  .ansline { font-size: 10.5pt; display: flex; align-items: center; gap: 1.5mm; }
  .ansline.wide { width: 46mm; border-bottom: 0.35mm solid ${INK}; height: 7mm; color: ${SOFT}; }
  .coins { display: flex; flex-wrap: wrap; gap: 1.2mm; justify-content: center; align-items: center; max-width: 52mm; min-height: 16mm; }
  table.col { border-collapse: collapse; font-size: 15pt; font-weight: 600; }
  table.col td { width: 7mm; height: 8.5mm; text-align: center; border: 0.2mm solid #DCE8F4; }
  table.col tr.ans td { border-top: 0.5mm solid ${INK}; border-bottom: 0.5mm solid ${INK}; height: 9mm; }
  .whole { display: flex; justify-content: center; margin: 2mm 0 4mm; }
  table.grid12 { border-collapse: collapse; font-size: 10pt; }
  table.grid12 th, table.grid12 td { width: 12.8mm; height: 12.8mm; text-align: center; border: 0.3mm solid ${INK}; }
  table.grid12 th { background: #FFF1B8; font-weight: 700; } table.grid12 tr:first-child th:first-child { background: ${LEMON}; }
  .qlist { padding-left: 7mm; font-size: 12pt; line-height: 2.2; flex: 1; }
  .qlist .line { display: inline-block; width: 30mm; border-bottom: 0.35mm solid ${INK}; margin-left: 2mm; }
  .tipbar { display: flex; gap: 3mm; align-items: center; margin-top: 4mm; background: #FFF6D6; border-radius: 5mm; padding: 2.5mm 4mm; font-size: 10pt; line-height: 1.35; }
  .tipbar b { font-weight: 700; } .mini { width: 13mm; height: 11.4mm; flex: none; }
  .answers { flex: 1; margin-top: 6mm; }
  .alist { column-gap: 8mm; padding-left: 7mm; font-size: 12pt; line-height: 1.9; }
  .alist li::marker { color: ${SOFT}; font-weight: 600; }
  .answers .whole table.grid12 td { font-weight: 600; }
  footer { margin-top: 4mm; font-size: 8.5pt; color: ${SOFT}; display: flex; align-items: center; gap: 2mm; }
  footer b { color: ${INK}; font-weight: 600; } footer .c { margin-left: auto; }
  .dots { display: inline-flex; gap: 0.8mm; } .dots i { width: 2.4mm; height: 2.4mm; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: ${LEMON}; }
  .dots i:nth-child(2) { background: #7EE8C6; } .dots i:nth-child(3) { background: #8FD3FF; }
  .promo { margin-top: 4mm; display: flex; gap: 4mm; align-items: center; background: #EAF6FF; border-radius: 5mm; padding: 4mm; font-size: 10pt; line-height: 1.4; }
  .promo b { font-weight: 700; }
`;

// ---------- build ----------
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const todo = SHEETS.filter(s => !ONLY.length || ONLY.includes(s.id));
for (const s of todo) {
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>${s.title} worksheet: Beequation Kids</title><style>${css}</style></head><body>${render(s)}</body></html>`;
  if (process.env.HTML_DIR) fs.writeFileSync(path.join(process.env.HTML_DIR, `${s.id}.html`), html);   // for checking the answer pages
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({ path: path.join(OUT, `${s.id}.pdf`), format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '8mm', left: '0', right: '0' } });
  // preview of the first page at A4 proportions
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
  await page.setContent(html.replace('<body>', '<body style="padding-top:12mm"><style>.page + .page { display: none; }</style>'), { waitUntil: 'load' });
  await page.evaluateHandle('document.fonts.ready');
  const png = path.join(OUT, `${s.id}.png`);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 794, height: 1123 } });
  execFileSync('cwebp', ['-quiet', '-q', '80', '-resize', '420', '0', png, '-o', path.join(OUT, `${s.id}.webp`)]);
  fs.unlinkSync(png);
  console.log(s.id);
}
await browser.close();
const manifest = SHEETS.map(({ id, title, topic, years, desc }) => ({ id, title, topic, years, desc }));
fs.writeFileSync(path.join(ROOT, 'learn-src', 'worksheets.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${todo.length} worksheets, manifest has ${manifest.length}`);
