// Checks a language's game words (i18n/play/<code>.js) against the English table in play.html: same keys, same
// kinds of values (strings, lists of the same length, functions with the same arguments), functions that return
// text without "undefined", and grown-ups check number words identical to the apps' (apps repo,
// apps/kids/src/i18n/numberWords.ts) for every number the check can ask.
// Usage (from the repo root): node --experimental-strip-types tools/check-play-words.mjs <code> [apps repo]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , code, APPS = path.join(ROOT, '..', 'beequation')] = process.argv;
const table = src => (0, eval)(`(() => { ${src.replace(/^[\s\S]*?(const T = )/, '$1')}; return T; })()`);
const en = table(fs.readFileSync(path.join(ROOT, 'play.html'), 'utf8').match(/\/\*T\*\/([\s\S]*?)\/\*\/T\*\//)[1]);
const tr = table(fs.readFileSync(path.join(ROOT, 'i18n', 'play', `${code}.js`), 'utf8'));
const bad = [];
const walk = (a, b, at) => {
  if (typeof a === 'function') {
    if (typeof b !== 'function') return bad.push(`${at}: should be a function`);
    if (b.length !== a.length) bad.push(`${at}: takes ${b.length} arguments, English takes ${a.length}`);
    const tries = { kLevelAria: [[3, 'open', 2], [3, 'paid', 0], [3, 'locked', 0]], aLevelAria: [[3, 'Buzz', 'open', 2], [3, 'Buzz', 'paid', 0], [3, 'Buzz', 'locked', 0]], rounds: [['Tagline', true], ['Tagline', false]], slips: [[0], [1], [2], [5]], gateWords: [[1234], [9876]], frac: [['3/4'], ['12']], subJoin: [['A', 'B']] };
    for (const args of tries[at.split('.').pop()] || [Array.from({ length: a.length }, (_, i) => [7, 'X', 'Y'][i] ?? 1)]) {
      const out = b(...args);
      if (typeof out !== 'string' || /undefined|NaN|\[object/.test(out)) bad.push(`${at}(${args}): ${JSON.stringify(out)}`);
    }
    return;
  }
  if (Array.isArray(a)) { if (!Array.isArray(b) || b.length !== a.length) return bad.push(`${at}: should be a list of ${a.length}`); return a.forEach((x, i) => walk(x, b[i], `${at}[${i}]`)); }
  if (a && typeof a === 'object') { for (const k of Object.keys(a)) if (!(k in b)) bad.push(`${at}.${k}: missing`); for (const k of Object.keys(b)) if (!(k in a)) bad.push(`${at}.${k}: not in English`); return Object.keys(a).forEach(k => k in b && walk(a[k], b[k], `${at}.${k}`)); }
  if (typeof a === 'string' && typeof b !== 'string' && at !== 'T.locale') bad.push(`${at}: should be text`);
  if (typeof b === 'string' && /[£$]\{|\$\{/.test(b)) bad.push(`${at}: contains a template placeholder`);
};
walk(en, tr, 'T');
// 'no' is Norwegian Bokmål (nb); 'in' is Indian English (en-IN), whose number words are the apps' English ones
if (tr.locale !== code && tr.locale !== { no: 'nb', in: 'en-IN' }[code] && !String(tr.locale).startsWith(code)) bad.push(`T.locale: ${tr.locale}`);
const appLang = { no: 'nb', in: 'en' }[code] || code;
const { numberInWords } = await import(pathToFileURL(path.join(APPS, 'apps/kids/src/i18n/numberWords.ts')).href);
let n = 0, note = '';
if (!numberInWords[appLang]) {
  // A language the apps don't have yet (Hindi, until the apps get Hindi): nothing to compare the grown-ups check with.
  note = ` (grown-ups number words NOT compared: the apps have no "${appLang}" number words yet; add them to the apps' numberWords.ts, then run this again)`;
} else for (let th = 1; th <= 9; th++) for (let h = 1; h <= 9; h++) for (let r = 10; r <= 99; r++) {
  const x = th * 1000 + h * 100 + r; n++;
  if (tr.gateWords(x) !== numberInWords[appLang](x)) { bad.push(`gateWords(${x}): "${tr.gateWords(x)}" but the app says "${numberInWords[appLang](x)}"`); if (bad.length > 30) break; }
}
console.log(bad.length ? bad.join('\n') : note ? `${code}: all keys match${note}` : `${code}: all keys match, ${n} grown-ups numbers match the app`);
process.exit(bad.length ? 1 : 0);
