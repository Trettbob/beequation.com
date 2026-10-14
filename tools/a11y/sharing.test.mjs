import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharing = require('../../assets/sharing-core.js');

test('daily shares contain two five-cell rows, optional streak and tagged local URL', () => {
  const result = { number: 123, seconds: 47, slips: [0, 1, 2, 0, 0, 0, 0, 1, 2, 0], streak: 12 };
  const lines = sharing.dailyText(result, 'https://fr.beequation.com').split('\n');
  assert.equal(lines[0], 'Beequation No. 123 🐝 0:47');
  assert.equal(lines[1], '🍯🟨🟧🍯🍯');
  assert.equal(lines[2], '🍯🍯🟨🟧🍯');
  assert.equal(lines[3], '🐝 12-day hive streak');
  assert.equal(lines[4], 'https://fr.beequation.com/today/?utm_source=share&utm_medium=daily&utm_campaign=hive');
  assert.equal(sharing.dailyText({ ...result, streak: 1 }).split('\n').length, 4);
  assert.match(sharing.dailyText({ ...result, hard: true, untimed: true, slips: [0, 0, 0, 0, 0, 0, 0, 0, 0, -1] }), /^Beequation No\. 123★ 🐝 No slips\n.*\n.*🟫/);
});

test('preview shares omit the number while preserving every other result detail', () => {
  const result = { number: null, seconds: 47, slips: [0, 1, 2, 0, 0, 0, 0, 1, 2, 0], streak: 12 };
  const expected = 'Preview hive 🐝 0:47\n🍯🟨🟧🍯🍯\n🍯🍯🟨🟧🍯\n🐝 12-day hive streak\nhttps://fr.beequation.com/today/?utm_source=share&utm_medium=daily&utm_campaign=hive';
  assert.equal(sharing.dailyText(result, 'https://fr.beequation.com'), expected);
  assert.equal(sharing.dailyText({ ...result, number: undefined }, 'https://fr.beequation.com'), expected);
  assert.equal(sharing.dailyText({ ...result, number: 1 }, 'https://fr.beequation.com'), expected.replace('Preview hive', 'Beequation No. 1'));
  const words = { previewHive: 'Ruche en aperçu', noSlips: 'Aucune erreur', streak: 'série de {n} jours' };
  assert.equal(sharing.dailyText({ ...result, hard: true, untimed: true, slips: [0, 0, 0, 0, 0, 0, 0, 0, 0, -1] }, 'https://fr.beequation.com', words), 'Ruche en aperçu★ 🐝 Aucune erreur\n🍯🍯🍯🍯🍯\n🍯🍯🍯🍯🟫\n🐝 série de 12 jours\nhttps://fr.beequation.com/today/?utm_source=share&utm_medium=daily&utm_campaign=hive');
});

test('waggle codec strictly validates version, modes, tiers, seeds and scores', () => {
  const round = { kind: 'blitz', mode: 'mul', tier: 5, seed: 4294967295, score: 14 };
  assert.deepEqual(sharing.decodeWaggle(sharing.encodeWaggle(round)), round);
  assert.match(sharing.waggleUrl(round, 'https://ja.beequation.com'), /app=pro&waggle=v1\.blitz-mul\.5\.4294967295\.14&utm_source=share&utm_medium=waggle/);
  for (const bad of ['v2.blitz-mul.5.1.14', 'v1.blitz-bad.5.1.14', 'v1.blitz-mul.0.1.14', 'v1.blitz-mul.5.-1.14', 'v1.blitz-mul.5.4294967296.14', 'v1.blitz-mul.5.01.14', 'v1.blitz-mul.5.1.14.extra', 'v1.practice-add.1.1.11', 'v1.blitz-add.11.1.3', 'v1.blitz-add.01.1.3']) assert.equal(sharing.decodeWaggle(bad), null);
  // Pro levels go up to 10 (Hive Mind); the game checks each mode's own number of levels.
  assert.deepEqual(sharing.decodeWaggle('v1.blitz-add.10.7.3'), { kind: 'blitz', mode: 'add', tier: 10, seed: 7, score: 3 });
});

test('Honey Jars earn every seven played days, cap at two and protect one missed day', () => {
  let state = {};
  for (let day = 1; day <= 21; day++) state = sharing.updateHive(state, `2026-09-${String(day).padStart(2, '0')}`, true).state;
  assert.equal(state.jars, 2);
  assert.equal(state.current, 21);
  const saved = sharing.updateHive(state, '2026-09-23', false);
  assert.equal(saved.state.jars, 1);
  assert.equal(saved.state.current, 21);
  assert.equal(saved.savedStreak, 21);
  assert.equal(sharing.updateHive(saved.state, '2026-09-23', false).savedStreak, 0);
  const played = sharing.updateHive(saved.state, '2026-09-23', true).state;
  assert.equal(played.current, 22);
  assert.equal(sharing.updateHive(played, '2026-09-26', true).state.current, 1);
});

test('migration does not award historical jars and repeated plays do not advance streak', () => {
  const state = sharing.migrateHive({ '2026-10-10': {}, '2026-10-11': {} });
  assert.equal(state.current, 2);
  assert.equal(state.jars, 0);
  const played = sharing.updateHive(state, '2026-10-12', true).state;
  assert.equal(sharing.updateHive(played, '2026-10-12', true).state.current, 3);
});

test('countdown formats local midnight and clamps negative values', () => {
  assert.equal(sharing.countdown(new Date(2026, 9, 12, 20, 47, 15)), '03:12:45');
  assert.equal(sharing.formatCountdown(-2), '00:00:00');
  assert.equal(sharing.formatCountdown(3661), '01:01:01');
});

test('daily shares localise untimed details and streaks without changing the grid', () => {
  const words = { slips: '{n} erreurs', noSlips: 'Aucune erreur', streak: 'série de {n} jours' };
  const result = { number: 124, untimed: true, slips: [0, 1, 2, 0, 0, 0, 0, 0, 0, 0], streak: 3, hard: true };
  const lines = sharing.dailyText(result, 'https://fr.beequation.com/', words).split('\n');
  assert.equal(lines[0], 'Beequation No. 124★ 🐝 3 erreurs');
  assert.equal(lines[3], '🐝 série de 3 jours');
  assert.equal(lines[4], 'https://fr.beequation.com/today/?utm_source=share&utm_medium=daily&utm_campaign=hive');
  assert.match(sharing.dailyText({ ...result, slips: Array(10).fill(0) }, undefined, words), /Aucune erreur/);
});

test('Blitz shares include the replay link and localised mode and level', () => {
  const round = { kind: 'blitz', mode: 'mul', tier: 5, seed: 42, score: 14 };
  assert.equal(sharing.blitzText(round, undefined, { mode: 'Times', level: 'Level {n}' }),
    'Beequation blitz 🐝 14 in 60s (Times, Level 5)\n' + sharing.waggleUrl(round));
  assert.equal(sharing.blitzText(round, 'https://fr.beequation.com', {
    blitz: 'Beequation blitz 🐝 {score} en 60s ({mode}, {level})', mode: 'Multiplications', level: 'Niveau {n}'
  }).split('\n')[0], 'Beequation blitz 🐝 14 en 60s (Multiplications, Niveau 5)');
});

test('Waggle rejects trailing whitespace and coerced encoder values', () => {
  const round = { kind: 'practice', mode: 'add', tier: 1, seed: 0, score: 10 };
  const encoded = sharing.encodeWaggle(round);
  for (const suffix of ['\n', '\r', ' ', '\t']) assert.equal(sharing.decodeWaggle(encoded + suffix), null);
  for (const field of ['tier', 'seed', 'score']) {
    assert.throws(() => sharing.encodeWaggle({ ...round, [field]: String(round[field]) }), /Invalid Waggle round/);
  }
  assert.throws(() => sharing.encodeWaggle(null), /Invalid Waggle round/);
});

test('Honey Jar repeat-open protection survives an earlier clock date', () => {
  const previous = { current: 12, best: 12, jars: 2, consecutive: 12, lastPlayed: '2026-10-10', checked: '2026-10-10' };
  const saved = sharing.updateHive(previous, '2026-10-12', false);
  const earlier = sharing.updateHive(saved.state, '2026-10-11', false);
  assert.deepEqual(earlier.state, saved.state);
  assert.equal(sharing.updateHive(earlier.state, '2026-10-12', false).state.jars, 1);
  assert.deepEqual(previous, { current: 12, best: 12, jars: 2, consecutive: 12, lastPlayed: '2026-10-10', checked: '2026-10-10' });
});

test('Honey Jars earn on day seven and require seven actual consecutive plays after a save', () => {
  let state = {};
  for (let day = 1; day <= 6; day++) state = sharing.updateHive(state, `2026-10-0${day}`, true).state;
  assert.equal(state.jars, 0);
  state = sharing.updateHive(state, '2026-10-07', true).state;
  assert.equal(state.jars, 1);
  assert.equal(sharing.updateHive(state, '2026-10-07', true).state.jars, 1);
  state = sharing.updateHive(state, '2026-10-09', true).state;
  assert.equal(state.current, 8);
  assert.equal(state.jars, 0);
  for (let day = 10; day <= 14; day++) state = sharing.updateHive(state, `2026-10-${day}`, true).state;
  assert.equal(state.jars, 0);
  assert.equal(sharing.updateHive(state, '2026-10-15', true).state.jars, 1);
});

test('missing two days resets even after a jar was spent on an open without playing', () => {
  const previous = { current: 12, best: 20, jars: 2, consecutive: 12, lastPlayed: '2026-10-10' };
  const opened = sharing.updateHive(previous, '2026-10-12', false).state;
  const resumed = sharing.updateHive(opened, '2026-10-13', true).state;
  assert.equal(resumed.current, 1);
  assert.equal(resumed.best, 20);
  assert.equal(resumed.jars, 1);
  assert.equal(sharing.updateHive({ ...previous, jars: 0 }, '2026-10-12', true).state.current, 1);
  assert.equal(sharing.updateHive(previous, '2026-10-13', true).state.jars, 2);
});

test('migration ignores invalid calendar dates and does not mutate historical daily records', () => {
  const daily = { '2026-02-30': {}, '2026-10-10': {}, '2026-10-11': {}, 'not-a-date': {} };
  const before = JSON.stringify(daily);
  const state = sharing.migrateHive(daily);
  assert.equal(state.current, 2);
  assert.equal(state.jars, 0);
  assert.equal(state.consecutive, 0);
  assert.equal(JSON.stringify(daily), before);
  assert.deepEqual(sharing.updateHive(state, '2026-02-30', true).state, state);
});

test('countdown crosses month and year boundaries and rounds the remaining second up', () => {
  assert.equal(sharing.countdown(new Date(2026, 11, 31, 23, 59, 59, 500)), '00:00:01');
  assert.equal(sharing.countdown(new Date(2026, 9, 31, 0, 0, 0)), '24:00:00');
});

test('the browser game carries the current sharing core (tools/build-langs.py copies it in)', async () => {
  const fs = await import('node:fs');
  const play = fs.readFileSync(new URL('../../play.html', import.meta.url), 'utf8');
  const core = fs.readFileSync(new URL('../../assets/sharing-core.js', import.meta.url), 'utf8').trim();
  assert.equal(play.match(/\/\*sharing-core\*\/([\s\S]*?)\/\*\/sharing-core\*\//)[1], core);
  assert.doesNotMatch(play, /<script[^>]+src=/, 'the game loads no scripts from anywhere else');
});

test('Kids Waggle links need app=kids, a Kids world, one of its levels and a score within the round', () => {
  const round = { kind: 'kids', mode: 'add', tier: 3, seed: 4294967295, score: 9 };
  const encoded = sharing.encodeWaggle(round);
  assert.equal(encoded, 'v1.kids-add.3.4294967295.9');
  assert.deepEqual(sharing.decodeWaggle(encoded, 'kids'), round);
  assert.equal(sharing.decodeWaggle(encoded), null, 'a Pro link never reads a Kids round');
  assert.equal(sharing.decodeWaggle('v1.blitz-mul.5.42.14', 'kids'), null, 'a Kids link never reads a Pro round');
  assert.deepEqual(sharing.decodeWaggle('v1.kids-hive.5.0.3', 'kids'), { kind: 'kids', mode: 'hive', tier: 5, seed: 0, score: 3 });
  for (const bad of ['v1.kids-add.9.1.3', 'v1.kids-mul.8.1.3', 'v1.kids-frac.7.1.3', 'v1.kids-tens.6.1.3', 'v1.kids-dec.5.1.3', 'v1.kids-hive.6.1.3',
    'v1.kids-hive.1.1.4', 'v1.kids-add.1.1.11', 'v1.kids-neg.1.1.3', 'v1.kids-trio.1.1.3', 'v1.kids-add.0.1.3', 'v1.kids-add.1.01.3', 'v1.kids-add.1.4294967296.3',
    'v1.kids-add.1.1.3 ', 'v2.kids-add.1.1.3', 'v1.kids-add.1.1.3.4', 'v1.kids-constructor.1.1.3', 'v1.kids-__proto__.1.1.3']) assert.equal(sharing.decodeWaggle(bad, 'kids'), null, bad);
  assert.throws(() => sharing.encodeWaggle({ ...round, mode: 'trio' }), /Invalid Waggle round/);
  assert.throws(() => sharing.encodeWaggle({ ...round, score: 11 }), /Invalid Waggle round/);
});

test('Kids links carry no campaign tags and the share text names no one', () => {
  const round = { kind: 'kids', mode: 'mul', tier: 2, seed: 77, score: 9 };
  assert.equal(sharing.waggleUrl(round, 'https://fr.beequation.com/'), 'https://fr.beequation.com/play.html?app=kids&waggle=v1.kids-mul.2.77.9');
  assert.equal(sharing.kidsText(round), 'Can you beat a Beequation Kids player? 9/10 on this honeycomb 🐝 Your turn:\nhttps://beequation.com/play.html?app=kids&waggle=v1.kids-mul.2.77.9');
  assert.equal(sharing.kidsText({ ...round, mode: 'hive', score: 2 }, 'https://de.beequation.com', '{score} von {of}').split('\n')[0], '2 von 3');
  assert.throws(() => sharing.kidsText({ kind: 'blitz', mode: 'mul', tier: 2, seed: 77, score: 9 }), /Invalid Waggle round/);
});

test('the Kids worlds in the sharing core match the browser game (WORLDS in play.html)', async () => {
  const fs = await import('node:fs');
  const play = fs.readFileSync(new URL('../../play.html', import.meta.url), 'utf8');
  const worlds = Object.fromEntries([...play.matchAll(/\{ id: '(\w+)', title: T\.worlds\.\w+\[0\],[^\n]*?tiers: (\d+)/g)].map(m => [m[1], Number(m[2])]));
  assert.deepEqual(worlds, { ...sharing.kidsWorlds });
});

test('the family hive counts wins for the week from Monday, gives both a point for a tie and starts again', () => {
  assert.equal(sharing.weekStart('2026-10-14'), '2026-10-12');
  assert.equal(sharing.weekStart('2026-10-12'), '2026-10-12');
  assert.equal(sharing.weekStart('2026-10-18'), '2026-10-12');
  assert.equal(sharing.weekStart('2027-01-01'), '2026-12-28');
  assert.equal(sharing.weekStart('2026-02-30'), null);
  let state = sharing.addFamilyResult(undefined, '2026-10-12', 9, 7);
  state = sharing.addFamilyResult(state, '2026-10-14', 5, 8);
  state = sharing.addFamilyResult(state, '2026-10-18', 6, 6);
  assert.deepEqual(state, { week: '2026-10-12', kids: 2, grown: 2 });
  assert.deepEqual(sharing.familyWeek(state, '2026-10-19'), { week: '2026-10-19', kids: 0, grown: 0 });
  assert.deepEqual(sharing.addFamilyResult(state, '2026-10-19', 1, 0), { week: '2026-10-19', kids: 1, grown: 0 });
  assert.deepEqual(sharing.familyWeek({ week: '2026-10-12', kids: -3, grown: 'x' }, '2026-10-13'), { week: '2026-10-12', kids: 0, grown: 0 });
  assert.deepEqual(state, { week: '2026-10-12', kids: 2, grown: 2 }, 'reading a week does not change the saved tally');
});
