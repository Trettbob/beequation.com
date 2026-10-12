#!/usr/bin/env node
// Evaluate only the pure engine already synced into the browser game.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const play = readFileSync(fileURLToPath(new URL('../play.html', import.meta.url)), 'utf8');
const block = play.match(/\/\/ ---- engine: generated[^\n]*\n([\s\S]*?)\/\/ ---- end engine ----/);
if (!block) throw new Error('Missing synced engine markers in play.html');
const dates = process.argv.slice(2);
for (const day of dates) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) {
    throw new Error(`Invalid date: ${day}`);
  }
}
const result = runInNewContext(block[1] + `
  const daily = DAILIES.find(d => d.id === 'pro');
  Object.fromEntries(dates.map(date => {
    const p = generate(daily.mode, daily.tier, dailyRng(date, daily.id));
    if (p.kind === 'hive' || !['add', 'mul'].includes(p.op)) throw new Error('Unexpected Daily Pro puzzle');
    const hive = date < '2026-11-01' ? null : Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse('2026-11-01T00:00:00Z')) / 864e5) + 1;
    return [date, {cells: p.cells.map(c => fmtCell(c, p.dec)), answer: p.answer, pair: p.pair, op: p.op, hive}];
  }));
`, { dates }, { timeout: 30000 });
process.stdout.write(JSON.stringify(result) + '\n');
