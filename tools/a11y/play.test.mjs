import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync('play.html', 'utf8');
function game(code, extra = {}, lang) {
  const table = lang ? fs.readFileSync(`i18n/play/${lang}.js`, 'utf8') : html.match(/\/\*T\*\/([\s\S]*?)\/\*\/T\*\//)[1];
  const engine = html.slice(html.indexOf('// ---- engine:'), html.indexOf('// ---- end engine ----'));
  const helpers = html.slice(html.indexOf('// ---------- helpers ----------'), html.indexOf('// ---------- router ----------'));
  return vm.runInNewContext(`${table}\n${engine}\n${helpers}\n${code}`, {document: {getElementById: () => ({})}, localStorage: {getItem: () => null}, navigator: {}, ...extra});
}
test('arrows follow staggered rows, stay at edges and Home/End reach board endpoints', () => {
  assert.equal(game('typeof boardNeighbour'), 'function');
  for (const [i,key,want] of [[0,'ArrowRight',1],[1,'ArrowRight',1],[0,'ArrowLeft',0],[0,'ArrowDown',2],[1,'ArrowDown',3],[2,'ArrowUp',0],[4,'ArrowUp',1],[3,'ArrowDown',5],[5,'ArrowUp',2],[6,'ArrowDown',6],[4,'Home',0],[0,'End',6]]) {
    assert.equal(game(`boardNeighbour(7, ${i}, '${key}')`), want, `${i} ${key}`);
  }
  for (const size of [4,5,7,9,12]) for (let i=0;i<size;i++) for (const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']) {
    const next = game(`boardNeighbour(${size}, ${i}, '${key}')`);
    assert.ok(next >= 0 && next < size);
  }
});
test('whole-board reading groups numbers in visual order and uses the cell speech formatter', () => {
  assert.equal(game('typeof readBoard'), 'function');
  assert.equal(game('readBoard({cells:[14,6,9,20,13,2,5].map(n=>frac(n))})'), 'Row 1: 14, 6. Row 2: 9, 20, 13. Row 3: 2, 5.');
  assert.equal(game('readBoard({cells:[frac(1,2),frac(-3,4),frac(2),frac(5,4)],dec:0})'), 'Row 1: 1 over 2. Row 2: −3 over 4, 2. Row 3: 5 over 4.');
  assert.equal(game('readBoard({cells:[frac(1,2),frac(3,4),frac(2),frac(5,4)],dec:2})',{},'fr'), 'Ligne 1 : 0,50. Ligne 2 : 0,75, 2,00. Ligne 3 : 1,25.');
});
test('board has one entry stop and each button names its value, row and column', () => {
  const markup = game("board({cells:[14,6,9,20,13,2,5].map(n=>frac(n))}, {}, 380, 400, 'kids')");
  assert.equal((markup.match(/tabindex="0"/g)||[]).length,1);
  assert.equal((markup.match(/role="button"/g)||[]).length,7);
  assert.match(markup,/aria-label="14, row 1, column 1"/);
  assert.match(markup,/aria-label="13, row 2, column 3"/);
});
test('time warnings survive skipped seconds and penalties without repeating or following time up', () => {
  assert.equal(game('typeof blitzWarning'), 'function');
  assert.equal(game('blitzWarning(31,29)'),30);
  assert.equal(game('blitzWarning(11,9)'),10);
  assert.equal(game('blitzWarning(6,4)'),5);
  assert.equal(game('blitzWarning(10,10)'),null);
  assert.equal(game('blitzWarning(4,0)'),null);
  assert.equal(game('blitzWarning(31,4)'),5);
});
test('vibration respects saved preference and unavailable devices', () => {
  const patterns=[];
  game("vibrate(10); vibrate(40); vibrate([40,60,40]); vibrate(300);",{navigator:{vibrate:p=>patterns.push(p)}});
  assert.equal(JSON.stringify(patterns),'[10,40,[40,60,40],300]');
  game('vibrate(40)',{localStorage:{getItem:()=>'{"vibration":false}'},navigator:{vibrate:p=>patterns.push(p)}});
  assert.equal(patterns.length,4);
  assert.doesNotThrow(()=>game('vibrate(40)'));
});

test('rendered honeycomb exposes rows and grid cells around independently labelled buttons', () => {
  const markup = game("board({cells:[14,6,9,20,13,2,5].map(n=>frac(n))}, {}, 380, 400, 'kids')");
  assert.match(markup, /role="grid"/);
  assert.equal((markup.match(/role="row"/g)||[]).length,3);
  assert.equal((markup.match(/role="gridcell"/g)||[]).length,7);
});

// Test the renderer at its DOM boundary. Browser accessibility APIs are verified on the host.
function renderer() {
  const nodes=[];
  const doc={activeElement:null,createElement:()=>element(),getElementById:()=>app};
  function element(attrs={}) {
    const e={dataset:{},attrs,attributes:Object.entries(attrs).map(([name,value])=>({name,value})),classList:{contains:()=>false},tagName:attrs.tag||'DIV',tabIndex:-1,
      setAttribute(k,v){this.attrs[k]=v;},focus(){doc.activeElement=this;},querySelectorAll:()=>[],querySelector:()=>null,replaceChildren(...children){this.children=children;},get textContent(){return this.children ? this.children.map(c=>c.textContent).join('') : this.text||'';},set textContent(v){this.text=v;this.children=undefined;}};
    nodes.push(e);return e;
  }
  const app=element(), heading=element({tag:'H1'});
  let current=heading;
  app.contains=e=>e===heading||nodes.includes(e);
  app.querySelector=sel=>sel==='h1'?current:null;
  const table=html.match(/\/\*T\*\/([\s\S]*?)\/\*\/T\*\//)[1];
  const helpers=html.slice(html.indexOf('// ---------- helpers ----------'),html.indexOf('// ---------- router ----------'));
  const redraw=html.slice(html.indexOf('const h = html =>'),html.indexOf('function render()'));
  const context=vm.createContext({document:doc,localStorage:{getItem:()=>null},navigator:{}});
  vm.runInContext(`${table}\n${helpers}\n${redraw}`,context);
  return {doc,app,heading,element,context,run:code=>vm.runInContext(code,context),setHeading:e=>current=e};
}
test('status node and its last message survive redraws without creating a second live region', () => {
  const r=renderer();r.run("h('<div>board</div><!--status--><button>Read</button>');");
  assert.equal(r.app.children[1].tabIndex,-1,'an empty status must not add a noisy Tab stop');
  r.run("announce('Correct');");
  const status=r.app.children[1];r.doc.activeElement=status;
  r.run("h('<div>new board</div><!--status--><button>Read</button>');");
  assert.equal(r.app.children[1],status);
  assert.equal(status.textContent,'Correct');
  assert.equal(r.doc.activeElement,status);
  assert.equal(status.attrs['aria-describedby'],'game-status-message','focus must expose the message as well as the Last result label');
  assert.equal(status.attrs.role,'status');assert.equal(status.attrs['aria-live'],'polite');assert.equal(status.attrs['aria-atomic'],'true');assert.equal(status.tabIndex,0);
  assert.equal(r.app.children.filter(e=>e.attrs.role==='status').length,1);
});
test('a redraw restores a focused screen heading', () => {
  const r=renderer();r.run("h('<h1>Game</h1>');");r.doc.activeElement=r.heading;
  const replacement=r.element({tag:'H1'});r.setHeading(replacement);
  r.run("h('<h1>Game</h1>');");
  assert.equal(r.doc.activeElement,replacement);
  assert.equal(replacement.tabIndex,-1);
});
test('redrawing while focus is on a game control keeps the previous board entry cell', () => {
  const markup=game("boardIndex=4; board({cells:[14,6,9,20,13,2,5].map(n=>frac(n))}, {}, 380, 400, 'kids')");
  assert.match(markup, /data-i="4" role="button" tabindex="0"/);
  assert.equal((markup.match(/tabindex="0"/g)||[]).length,1);
});

// Exercise game state transitions, capturing only the UI/timer boundaries.
function round(screen, kind='round') {
  const ui={messages:[],controls:{},focus:2,now:100000,timeouts:[],intervals:[],vibrations:[]};
  const table=html.match(/\/\*T\*\/([\s\S]*?)\/\*\/T\*\//)[1];
  const engine=html.slice(html.indexOf('// ---- engine:'),html.indexOf('// ---- end engine ----'));
  const helpers=html.slice(html.indexOf('// ---------- helpers ----------'),html.indexOf('// ---------- router ----------'));
  const kids=html.slice(html.indexOf('function k_game('),html.indexOf('function k_win('));
  const pro=html.slice(html.indexOf('function a_game('),html.indexOf('function a_result('));
  class Clock extends Date { static now(){return ui.now;} }
  const context=vm.createContext({ui,Date:Clock,window:{innerHeight:800},document:{getElementById:id=>id==='app'?{clientWidth:420}:null},localStorage:{getItem:()=>null},navigator:{vibrate:p=>ui.vibrations.push(p)},setTimeout:fn=>ui.timeouts.push(fn),setInterval:fn=>ui.intervals.push(fn),clearInterval:()=>{ui.intervals=[];}});
  vm.runInContext(`${table}\n${engine}\n${helpers}\n
    const h=markup=>ui.markup=markup;
    const on=(selector,fn)=>ui.controls[selector]=fn;
    announce=msg=>ui.messages.push(msg);
    focusCell=index=>ui.focus=index;
    wireBoard=(tap,p)=>{ui.tap=tap;ui.puzzle=p;};
    const back=()=>{};let cleanup;
    const replace=r=>{ui.result=r;cleanup();};
    const wOf=()=>({title:'Adding Meadow',stickers:[]});
    let K={stars:{},stickers:[]},P={stars:{},blitz:{},daily:{}};
    const kSave=()=>{},aSave=()=>{};
    const kidStars=(m,h)=>m+h<=1?3:m+h<=4?2:1;
    ${kids}\n${pro}\n${screen}_game({mode:'add',tier:1,kind:'${kind}'});`,context);
  return ui;
}
test('both games announce questions, hints/results and advance correct answers to cell zero',()=>{
  for(const screen of ['k','a']) {
    const ui=round(screen);
    assert.match(ui.messages.at(-1),/Puzzle 1 of/);
    assert.ok(ui.markup.indexOf('class="board"')<ui.markup.indexOf('<!--status-->'));
    assert.doesNotMatch(ui.markup,/aria-live=/,'game markup must not create a second live region');
    ui.tap((ui.puzzle.answer+1)%ui.puzzle.cells.length);
    assert.equal(ui.messages.at(-1),'Oops! Try another one.');assert.equal(ui.focus,2);
    if(screen==='k') {ui.controls['[data-hint]']();assert.match(ui.messages.at(-1),/^Psst!/);}
    ui.tap(ui.puzzle.answer);assert.match(ui.messages.at(-1),/=/);
    ui.timeouts.at(-1)();assert.equal(ui.focus,0);assert.match(ui.messages.at(-1),/Puzzle 2 of/);
    assert.equal(JSON.stringify(ui.vibrations.slice(0,4)),'[10,[40,60,40],40,10]');
  }
});
test('Blitz penalty preserves the wrong result together with a threshold warning and stops at time up',()=>{
  const ui=round('a','blitz');ui.now+=29500;
  ui.tap((ui.puzzle.answer+1)%ui.puzzle.cells.length);
  assert.equal(ui.messages.at(-1),'Oops! Try another one. A wrong tap costs 2 seconds. 30 seconds remaining.');
  const count=ui.messages.length;ui.intervals[0]();assert.equal(ui.messages.length,count,'warning is emitted once');
  ui.now+=19000;ui.intervals[0]();assert.equal(ui.messages.at(-1),'10 seconds remaining.');
  ui.now+=5000;ui.intervals[0]();assert.equal(ui.messages.at(-1),'5 seconds remaining.');
  ui.now+=5000;ui.intervals[0]();assert.equal(ui.result.name,'a_result');assert.equal(ui.vibrations.at(-1),300);
  const messages=ui.messages.length;ui.tap(ui.puzzle.answer);assert.equal(ui.messages.length,messages,'expired puzzles do not accept an answer');
});
test('levels and daily games continue without a time limit',()=>{
  for(const kind of ['round','daily']) {
    const ui=round('a',kind);ui.now+=600000;ui.intervals[0]();assert.equal(ui.result,undefined);
    ui.tap(ui.puzzle.answer);assert.match(ui.messages.at(-1),/=/);
  }
});

test('board key handlers move focus without selecting, and Enter/Space select the focused cell',()=>{
  const selected=[],doc={activeElement:null};
  const cells=Array.from({length:7},(_,i)=>({dataset:{i:String(i)},tabIndex:i? -1:0,focus(){doc.activeElement=this;this.onfocus?.();}}));
  const app={querySelectorAll:sel=>sel==='.cell'?cells:[],querySelector:sel=>cells[Number(sel.match(/data-i="(\d+)"/)?.[1])]};
  doc.getElementById=()=>app;
  game("const on=()=>{};wireBoard(i=>selected.push(i),{cells:Array(7)});",{document:doc,selected});
  let prevented=0;
  cells[0].onkeydown({key:'ArrowDown',preventDefault(){prevented++;}});
  assert.equal(doc.activeElement,cells[2]);assert.equal(cells.filter(c=>c.tabIndex===0).length,1);assert.equal(selected.length,0);
  for(const key of ['Enter',' '])cells[2].onkeydown({key,preventDefault(){prevented++;}});
  assert.deepEqual(selected,[2,2]);assert.equal(prevented,3);
});
test('R and Escape stay scoped to game focus and ignore text entry and modifier combinations',()=>{
  let handler,reads=0,backs=0,modal=false;
  const app={addEventListener:(_,fn)=>handler=fn,querySelector:sel=>sel==='[data-read]'?{click:()=>reads++}:{click:()=>backs++}};
  const source=html.slice(html.indexOf("app.addEventListener('keydown'"),html.indexOf('const switchLink ='));
  vm.runInNewContext(source,{app,document:{querySelector:()=>modal?{}:null}});
  const press=(key,options={})=>handler({key,target:{closest:()=>null},preventDefault(){},...options});
  press('r');press('R');press('Escape');assert.equal(reads,2);assert.equal(backs,1);
  for(const key of ['r','Escape']) {
    press(key,{ctrlKey:true});press(key,{altKey:true});press(key,{metaKey:true});press(key,{target:{closest:()=>({})}});
    modal=true;press(key);modal=false;
  }
  assert.equal(reads,2);assert.equal(backs,1);
});

function gate() {
  const opener={focus(){doc.activeElement=this;}},app={inert:false},doc={activeElement:opener};
  let overlay;
  doc.getElementById=()=>app;doc.body={appendChild:e=>overlay=e};
  doc.createElement=()=>{
    const field={value:'',focus(){doc.activeElement=this;}},ok={focus(){doc.activeElement=this;}},cancel={focus(){doc.activeElement=this;}};
    return {field,ok,cancel,querySelector:s=>s==='input'?field:s==='[data-ok]'?ok:cancel,querySelectorAll:()=>[field,ok,cancel],remove(){this.removed=true;}};
  };
  const code=html.slice(html.indexOf('function parentGate('),html.indexOf('function k_home('));
  game(`${code}\nparentGate(()=>{});`,{document:doc});
  return {doc,app,opener,get overlay(){return overlay;}};
}
test('grown-ups dialog keeps keyboard focus inside and restores its opener when cancelled',()=>{
  const g=gate();assert.equal(g.doc.activeElement,g.overlay.field);assert.equal(g.app.inert,true);
  let prevented=0;
  g.overlay.cancel.focus();g.overlay.onkeydown({key:'Tab',shiftKey:false,preventDefault(){prevented++;}});
  assert.equal(g.doc.activeElement,g.overlay.field);
  g.overlay.onkeydown({key:'Tab',shiftKey:true,preventDefault(){prevented++;}});
  assert.equal(g.doc.activeElement,g.overlay.cancel);assert.equal(prevented,2);
  g.overlay.cancel.onclick();assert.equal(g.doc.activeElement,g.opener);assert.equal(g.app.inert,false);
  const escaped=gate();escaped.overlay.onkeydown({key:'Escape',preventDefault(){}});assert.equal(escaped.doc.activeElement,escaped.opener);assert.equal(escaped.app.inert,false);
});
