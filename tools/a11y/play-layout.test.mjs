import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('play.html', 'utf8');
const helpers = html.slice(html.indexOf('// ---------- helpers ----------'), html.indexOf('// ---------- router ----------'));
const context = vm.createContext({ document: { getElementById: () => ({}) }, localStorage: { getItem: () => null }, navigator: {} });
vm.runInContext(helpers, context);

// A width-only fit would overflow short phones; a 420px cap would waste tablet space.
test('board sizing uses both dimensions of its column, scaling labels with the SVG', () => {
  assert.equal(vm.runInContext('typeof fitBoardBox', context), 'function');
  for (const [w, h, availableW, availableH, want] of [
    [300, 500, 500, 200, [120, 200]],
    [300, 500, 180, 600, [180, 300]],
    [300, 300, 700, 700, [700, 700]],
    [300, 500, 0, 200, [0, 0]],
    [300, 500, 200, 0, [0, 0]],
  ]) {
    const actual = vm.runInContext(`fitBoardBox(${w}, ${h}, ${availableW}, ${availableH})`, context);
    assert.deepEqual([actual.width, actual.height], want);
  }
});

test('game drawing measures the board column in landscape and keeps portrait sizing', () => {
  let landscape = true;
  const app = { clientWidth: 1366, querySelector: () => ({ getBoundingClientRect: () => ({ width: 520, height: 320 }) }) };
  const c = vm.createContext({ document: { getElementById: () => app }, window: { innerHeight: 800, matchMedia: () => ({ matches: landscape }) }, localStorage: { getItem: () => null }, navigator: {} });
  vm.runInContext(helpers, c);
  assert.equal(vm.runInContext('typeof gameBoardSpace', c), 'function');
  let size = vm.runInContext('gameBoardSpace(.42)', c);
  assert.deepEqual([size.width, size.height], [512, 312]);
  landscape = false; app.clientWidth = 420;
  size = vm.runInContext('gameBoardSpace(.42)', c);
  assert.deepEqual([size.width, size.height], [380, 336]);
});

test('landscape keeps controls before the board and leaves status/read after it, preserving focus', () => {
  let landscape = true;
  const doc = { activeElement: null };
  function node(name) {
    return { name, children: [], dataset: {}, attrs: {},
      appendChild(child) {
        if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(n => n !== child);
        child.parentElement = this; this.children.push(child);
        // Reparenting a focused subtree can blur it in a browser.
        doc.activeElement = null;
      },
      focus() { doc.activeElement = this; },
      setAttribute(k, v) { this.attrs[k] = v; },
    };
  }
  const controls = node('controls'), holder = node('holder'), svg = node('board');
  const status = node('status'), tools = node('tools'), read = node('read'), help = node('help'), aside = node('hint');
  controls.appendChild(node('question')); holder.appendChild(svg);
  tools.appendChild(read); tools.appendChild(help); tools.appendChild(aside);
  help.open = true;
  svg.dataset = { portraitBox: '0 0 420 500', combWidth: '300' };
  holder.querySelector = () => svg;
  holder.getBoundingClientRect = () => ({ width: 508, height: 208 });
  const nodes = { '.game-board': holder, '.game-controls': controls, '.board-tools': tools, '[data-help]': help, '.game-aside': aside };
  const app = { children: [controls, holder, status, tools], querySelector: s => nodes[s] };
  doc.getElementById = () => app; doc.activeElement = help;
  const c = vm.createContext({ document: doc, window: { matchMedia: () => ({ matches: landscape }) }, localStorage: { getItem: () => null }, navigator: {} });
  vm.runInContext(helpers, c);
  vm.runInContext('layoutGame()', c);
  const order = n => [n.name, ...n.children.flatMap(order)];
  assert.deepEqual(app.children.flatMap(order), ['controls', 'question', 'hint', 'help', 'holder', 'board', 'status', 'tools', 'read']);
  assert.equal(doc.activeElement, help); assert.equal(help.open, true);
  assert.deepEqual([svg.attrs.width, svg.attrs.height], [120, 200]);
  assert.equal(svg.attrs.viewBox, '60 0 300 500');
  landscape = false;
  vm.runInContext('layoutGame()', c);
  assert.deepEqual(tools.children, [read, help, aside]);
  assert.equal(doc.activeElement, help);
  assert.deepEqual([svg.attrs.width, svg.attrs.height], [420, 500]);
  assert.equal(svg.attrs.viewBox, '0 0 420 500');
});
