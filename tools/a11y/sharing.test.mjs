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
