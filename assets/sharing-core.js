(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BeeSharing = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const modes = ['add', 'mul', 'neg', 'frac', 'mixed', 'dec', 'trio'];
  const text = (words, key, fallback, value) => String(words && words[key] || fallback).replace('{n}', value);
  const hostUrl = host => String(host || 'https://beequation.com').replace(/\/$/, '');
  function formatCountdown(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    return [Math.floor(total / 3600), Math.floor(total % 3600 / 60), total % 60].map(value => String(value).padStart(2, '0')).join(':');
  }
  function countdown(now) {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return formatCountdown(Math.ceil((midnight - now) / 1000));
  }
  function dailyText(result, host, words) {
    const slips = result.slips || [];
    const mistakes = slips.reduce((total, value) => total + Math.max(0, value), 0);
    const timed = result.seconds !== null && result.seconds !== undefined && !result.untimed;
    const detail = timed ? Math.floor(result.seconds / 60) + ':' + String(result.seconds % 60).padStart(2, '0') : mistakes ? text(words, 'slips', '{n} slips', mistakes) : text(words, 'noSlips', 'No slips');
    const lines = ['Beequation No. ' + result.number + (result.hard ? '★' : '') + ' 🐝 ' + detail];
    const cells = slips.map(value => value < 0 ? '🟫' : value === 0 ? '🍯' : value === 1 ? '🟨' : '🟧');
    for (let index = 0; index < cells.length; index += 5) lines.push(cells.slice(index, index + 5).join(''));
    if (result.streak >= 2) lines.push('🐝 ' + text(words, 'streak', '{n}-day hive streak', result.streak));
    lines.push(hostUrl(host) + '/today/?utm_source=share&utm_medium=daily&utm_campaign=hive');
    return lines.join('\n');
  }
  function encodeWaggle(round) {
    if (!round || !['tier', 'seed', 'score'].every(field => Number.isSafeInteger(round[field]))) throw new Error('Invalid Waggle round');
    const encoded = ['v1', round.kind + '-' + round.mode, round.tier, round.seed, round.score].join('.');
    if (!decodeWaggle(encoded)) throw new Error('Invalid Waggle round');
    return encoded;
  }
  function decodeWaggle(encoded) {
    if (typeof encoded !== 'string' || encoded.length > 80) return null;
    const match = /^v1\.(blitz|practice)-([a-z]+)\.(10|[1-9])\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(encoded);
    if (!match || match[0] !== encoded || !modes.includes(match[2])) return null;
    const seed = Number(match[4]), score = Number(match[5]);
    if (!Number.isSafeInteger(seed) || seed > 4294967295 || !Number.isSafeInteger(score) || score > (match[1] === 'practice' ? 10 : 1000)) return null;
    return {kind: match[1], mode: match[2], tier: Number(match[3]), seed, score};
  }
  function waggleUrl(round, host) {
    return hostUrl(host) + '/play.html?app=pro&waggle=' + encodeWaggle(round) + '&utm_source=share&utm_medium=waggle';
  }
  function blitzText(round, host, words) {
    if (!round || round.kind !== 'blitz') throw new Error('Invalid Waggle round');
    const url = waggleUrl(round, host);
    const modeNames = {add: 'Plus', mul: 'Times', neg: 'Negative', frac: 'Fractions', mixed: 'Mixed', dec: 'Decimals', trio: 'Trio'};
    const values = {score: round.score, mode: words && words.mode || modeNames[round.mode], level: text(words, 'level', 'Level {n}', round.tier)};
    const template = String(words && words.blitz || 'Beequation blitz 🐝 {score} in 60s ({mode}, {level})');
    return template.replace(/\{(score|mode|level)\}/g, (_, key) => values[key]) + '\n' + url;
  }
  function dateNumber(date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
    if (!match) return null;
    const stamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(stamp).toISOString().slice(0, 10) === date ? stamp / 86400000 : null;
  }
  function migrateHive(daily) {
    let state = {current: 0, best: 0, jars: 0, consecutive: 0, lastPlayed: null, checked: null};
    for (const date of Object.keys(daily || {}).filter(date => dateNumber(date) !== null).sort()) {
      const gap = dateNumber(date) - dateNumber(state.lastPlayed);
      state.current = state.lastPlayed && gap === 1 ? state.current + 1 : 1;
      state.best = Math.max(state.best, state.current);
      state.lastPlayed = date;
    }
    return state;
  }
  function updateHive(previous, date, played) {
    const state = Object.assign({current: 0, best: 0, jars: 0, consecutive: 0, lastPlayed: null, checked: null}, previous || {});
    let savedStreak = 0;
    const today = dateNumber(date), last = dateNumber(state.lastPlayed);
    const checked = dateNumber(state.checked);
    if (today === null || (last !== null && today < last) || (checked !== null && today < checked)) return {state, savedStreak};
    const gap = last === null ? 0 : today - last;
    if (state.checked !== date && gap > 1) {
      if (gap === 2 && state.jars > 0 && state.current > 0) {
        state.jars--;
        state.savedDate = date;
        savedStreak = state.current;
      } else {
        state.current = 0;
        state.savedDate = null;
      }
      state.consecutive = 0;
    }
    state.checked = date;
    if (played && state.lastPlayed !== date) {
      state.current = gap === 1 || state.savedDate === date ? state.current + 1 : 1;
      state.consecutive = gap === 1 ? state.consecutive + 1 : 1;
      if (state.consecutive % 7 === 0) state.jars = Math.min(2, state.jars + 1);
      state.best = Math.max(state.best, state.current);
      state.lastPlayed = date;
    }
    return {state, savedStreak};
  }
  return {dailyText, blitzText, encodeWaggle, decodeWaggle, waggleUrl, migrateHive, updateHive, countdown, formatCountdown};
});
