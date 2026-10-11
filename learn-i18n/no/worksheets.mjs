// Norway (no): the printable worksheets' words, formats and pictures, and which sheets Norway uses.
// Read by tools/make-worksheets.mjs --lang no (see learn-i18n/README.md). Facts follow learn-i18n/no/BRIEF.md:
// decimal comma, a space for thousands from 10 000 up (four-digit numbers stay together: 2500), the raised dot · for
// multiplication and ":" for division (never ÷, which means minus in Norway), kroner with coins of 1, 5, 10 and 20 kr
// and no øre coins (so the krone is the smallest unit here), clock phrases as children learn them ("halv fire" = 3:30,
// "fem på halv fire" = 3:25), 24-hour digital times, den lille gangetabellen to 10 · 10.
//
// Left out (they don't fit Norwegian schools):
// - multiplication-check-practice: England's timed tables check; Norway has no tables test.
// - multiplication-grid: a 12 × 12 grid; in Norway den lille gangetabellen goes to 10 · 10.
// The times-table and division sheets ask up to 12; on the Norwegian sheets the 11 and 12 questions are named as
// extra challenges ("ekstranøtter"), solved by splitting (12 · 5 = 10 · 5 + 2 · 5).

const NBSP = ' ';

// whole numbers: groups of three with a no-break space from 10 000 up; four-digit numbers stay together (2500)
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : s;
  return n < 0 ? `−${g}` : g;
};

// The clock phrase children learn in Norwegian schools, h = 1 to 12 on a dial. "Halv" counts towards the next hour:
// 3:30 is "halv fire", 3:25 "fem på halv fire", 3:35 "fem over halv fire". For :20 and :40 the Learn pages give
// "tjue over tre" and "ti over halv fire" first; the sheets' instructions say the other forms are right too.
const H = ['tolv', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv'];
function timeWords(h, m) {
  const hh = h % 12 || 12, now = H[hh], then = H[(hh % 12) + 1];
  switch (m) {
    case 0: return `klokka ${now}`;
    case 5: return `fem over ${now}`;
    case 10: return `ti over ${now}`;
    case 15: return `kvart over ${now}`;
    case 20: return `tjue over ${now}`;
    case 25: return `fem på halv ${then}`;
    case 30: return `halv ${then}`;
    case 35: return `fem over halv ${then}`;
    case 40: return `ti over halv ${then}`;
    case 45: return `kvart på ${then}`;
    case 50: return `ti på ${then}`;
    case 55: return `fem på ${then}`;
    default: return m < 30 ? `${m} minutter over ${now}` : `${60 - m} minutter på ${then}`;
  }
}

// A dial time happens twice a day, and digital clocks in Norway use the 24-hour clock: 03:40 eller 15:40
// (12:05 on the dial → 00:05 eller 12:05).
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  const night = hh === 12 ? 0 : hh, day = hh === 12 ? 12 : hh + 12;
  return `${String(night).padStart(2, '0')}:${mm} eller ${day}:${mm}`;
}

// amounts in whole kroner (no øre coins since 2012): "65 kr"
const kroner = k => `${num(k)}${NBSP}kr`;

const PLACE = { 10: 'tier', 100: 'hundrer', 1000: 'tusen' };
const SILVER = '#D7DCE3';   // 1 and 5 kroner (cupronickel)
const GOLD = '#F2C14E';     // 10 and 20 kroner (Nordic gold)

export default {
  htmlLang: 'nb',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '·', div: ':',
  tensOnes: b => `${b} tiere og ${b} enere`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'tier' : 'tiere'} og ${o} ${o === 1 ? 'ener' : 'enere'}`,
  roundQ: (n, to, b) => `<b class="n">${n}</b> til nærmeste ${PLACE[String(to).replace(/\D/g, '')] || to} → ${b}`,
  of: (f, x) => `${f} av ${x}`,
  pctOf: (p, x) => `${p}${NBSP}% av ${x}`,
  timeWords, digital,

  money: kroner,
  coinValues: [1, 5, 10, 20],
  coinLabel: v => `${v} kr`,
  // Norwegian coins (Norges Bank): fill and real diameter in mm. The 1- and 5-krone coins have a small hole in the
  // middle, which the worksheet tool can't draw (its inner circle is a two-colour ring), so they stay plain.
  // Note the trap: the 10-krone coin (24 mm) is smaller than the 5-krone coin (26 mm).
  coins: { 1: [SILVER, 21, 'circle'], 5: [SILVER, 26, 'circle'], 10: [GOLD, 24, 'circle'], 20: [GOLD, 27.5, 'circle'] },
  coinInner: () => null,
  // paying with a tjuekroning, a femtilapp or a hundrelapp; prices in steps of 5 kr (10 kr to 95 kr)
  paid: [20, 50, 100], costStep: 5,
  // prices are random (10 kr to 95 kr), so most items are ones whose price can vary
  shopItems: ['smågodt', 'frukt', 'boller', 'klistremerker', 'en ball', 'et puslespill', 'en bok', 'fargeblyanter'],
  changeQ: (item, cost, paid, b) => `Du kjøper ${item} for ${cost} og betaler med ${paid}. Du får igjen: ${b}`,

  perimQ: b => `<div class="ansline">Omkrets ${b} cm</div><div class="ansline">Areal ${b} cm²</div>`,
  perimA: (p, a) => `Omkrets ${p} cm, areal ${a} cm²`,
  shapes: { 3: 'trekant', 4: 'kvadrat', rect: 'rektangel', 5: 'femkant', 6: 'sekskant', 8: 'åttekant', 0: 'sirkel', 7: 'sjukant', 10: 'tikant' },
  shapeQ: b => `<div class="ansline wide">Navn:</div><div class="ansline">Sider ${b} Hjørner ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'sirkel: ingen rette sider, 0 hjørner' : `${name}: ${n} sider, ${n} hjørner`),

  fruits: ['Epler', 'Bananer', 'Druer', 'Appelsiner', 'Pærer'],
  chartQs: (f, v, mx, mn) => [
    [`Hvor mange barn valgte ${f[1].toLowerCase()}?`, v[1]],
    ['Hvilken frukt var mest populær?', f[mx]],
    ['Hvilken frukt var minst populær?', f[mn]],
    [`Hvor mange flere barn valgte ${f[mx].toLowerCase()} enn ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Hvor mange barn stemte til sammen?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { barnehage: 'Siste år i barnehagen', '1-trinn': '1. trinn', '2-trinn': '2. trinn', '3-trinn': '3. trinn', '4-trinn': '4. trinn',
    '5-trinn': '5. trinn', '6-trinn': '6. trinn', '7-trinn': '7. trinn' },
  // "2. trinn", "1. og 2. trinn", "4.–6. trinn", "Siste år i barnehagen og 1. trinn"
  yearsLabel: (ys, n) => {
    const tr = ys.filter(y => y.endsWith('-trinn')).map(y => y.split('-')[0]);
    const t = tr.length === 1 ? `${tr[0]}. trinn` : tr.length === 2 ? `${tr[0]}. og ${tr[1]}. trinn` : tr.length > 2 ? `${tr[0]}.–${tr[tr.length - 1]}. trinn` : '';
    if (!ys.includes('barnehage')) return t;
    return t ? `${n.barnehage} og ${t}` : n.barnehage;
  },
  name: 'Navn', date: 'Dato', tip: 'Indies tips:', answers: 'Fasit',
  titleTag: t => `Oppgaveark «${t}» – Beequation Kids`,
  footer: 'Fritt til kopiering for bruk hjemme og i klassen. Flere oppgaveark på <b>no.beequation.com/learn</b>',
  promo: '<b>Øv med Indie.</b> Spill gratis bikakeoppgaver med tall på no.beequation.com, eller finn Beequation Kids på mobil eller nettbrett: ingen reklame, ingen innsamling av data og ingen stoppeklokke.',

  sheets: {
    // tall og plassverdi
    'missing-numbers-to-100': { title: 'Tallrekker til 100', years: ['1-trinn', '2-trinn'],
      desc: 'Tell med 1, 2, 5 og 10 om gangen', how: 'Skriv tallene som mangler i hver tallrekke.',
      tip: 'Si tallene høyt mens du teller. Ørene dine merker fort et hopp som ikke passer.' },
    'tens-and-ones': { title: 'Tiere og enere', years: ['1-trinn', '2-trinn'],
      desc: 'Del opp tosifrede tall', how: 'Del opp hvert tall i tiere og enere.',
      tip: 'Sifferet til venstre forteller hvor mange tiere det er. 47 er 4 tiere og 7 enere.' },
    'hundreds-tens-ones': { title: 'Hundrere, tiere og enere', years: ['3-trinn'],
      desc: 'Plassverdi opp til 1000', how: 'Skriv hvert tall som hundrere + tiere + enere.',
      tip: 'Nullen holder plassen. I 405 er det ingen tiere, men takket være 0 blir 4-tallet stående på hundrerplassen.' },
    rounding: { title: 'Avrunding', years: ['4-trinn', '5-trinn'],
      desc: 'Rund av til nærmeste tier, hundrer og tusen', how: 'Rund av hvert tall slik det står.',
      tip: 'Se på sifferet rett til høyre for plassen du runder av til. Er det 0, 1, 2, 3 eller 4, runder du ned. Er det 5, 6, 7, 8 eller 9, runder du opp.' },
    // pluss og minus
    'number-bonds-to-10': { title: 'Tiervenner', years: ['barnehage', '1-trinn'],
      desc: 'Tallpar som blir 10 til sammen', how: 'Skriv tallet som mangler, så det blir 10.',
      tip: 'Bruk fingrene! Hold opp 7 fingre. Hvor mange er nede? Det er tallet du trenger for å få 10.' },
    'number-bonds-to-20': { title: 'Tallvenner til 20', years: ['1-trinn', '2-trinn'],
      desc: 'Tallpar som blir 20 til sammen', how: 'Skriv tallet som mangler. I hvert stykke er 20 med.',
      tip: 'Kan du at 3 + 7 = 10, kan du også at 13 + 7 = 20. Tiervennene hjelper deg med tallvennene til 20!' },
    'add-and-subtract-within-20': { title: 'Pluss og minus til 20', years: ['1-trinn', '2-trinn'],
      desc: 'Blandede stykker opp til 20', how: 'Regn ut hvert stykke.',
      tip: 'Over tieren regner du i to steg: 8 + 6 = 8 + 2 + 4 = 14. Med minus går det på samme måte: 14 − 6 = 14 − 4 − 2 = 8.' },
    'column-addition': { title: 'Pluss med oppstilling', years: ['3-trinn', '4-trinn'],
      desc: 'Tresifrede tall, med minnetall', how: 'Regn ut med oppstilling. Begynn med enerne!',
      tip: 'Blir en kolonne 10 eller mer, skriver du bare enerne under streken. 1-tallet har du i minne: skriv det lite øverst i neste kolonne.' },
    'column-subtraction': { title: 'Minus med oppstilling', years: ['3-trinn', '4-trinn'],
      desc: 'Tresifrede tall, med veksling', how: 'Regn ut med oppstilling, slik du har lært i klassen. Begynn med enerne!',
      tip: 'Sjekk med pluss: Hvis 532 − 178 = 354, må 354 + 178 bli 532.' },
    // gange og dele
    'times-tables-2-5-10': { title: '2-, 5- og 10-gangen', years: ['3-trinn', '4-trinn'],
      desc: 'Blandede gangestykker, med ekstranøtter til 12', how: 'Regn ut hvert stykke. Stykker med 11 og 12 er ekstranøtter.',
      tip: 'I 10-gangen ender alle svarene på 0, og i 5-gangen ender de på 0 eller 5. Og 12 · 5? Regn 10 · 5 + 2 · 5 = 50 + 10 = 60.' },
    'times-tables-3-4-8': { title: '3-, 4- og 8-gangen', years: ['3-trinn', '4-trinn'],
      desc: 'Blandede gangestykker, med ekstranøtter til 12', how: 'Regn ut hvert stykke. Stykker med 11 og 12 er ekstranøtter.',
      tip: '8-gangen er det dobbelte av 4-gangen. Hvis 4 · 6 = 24, er 8 · 6 = 48.' },
    'division-facts': { title: 'Delestykker', years: ['4-trinn', '5-trinn'],
      desc: 'Bruk gangetabellen til å dele, med ekstranøtter til 144 : 12', how: 'Regn ut hvert stykke. Noen stykker går forbi den lille gangetabellen: de er ekstranøtter.',
      tip: 'Å dele er det omvendte av å gange. Når du skal regne 42 : 6, spør du: 6 ganger hva er 42? 84 : 7 kan du dele opp: 70 : 7 = 10 og 14 : 7 = 2, til sammen 12.' },
    'short-multiplication': { title: 'Gange med oppstilling', years: ['4-trinn', '5-trinn'],
      desc: 'Tresifrede tall ganger ensifrede tall', how: 'Regn ut med oppstilling. Står stykket på én linje i boka di (234 · 3), er det det samme regnestykket.',
      tip: 'Begynn med enerne. Blir det 10 eller mer, skriver du enerne og har tierne i minne. Legg minnetallet til etter at du har ganget neste siffer.' },
    // brøk
    'what-fraction-is-shaded': { title: 'Hvor stor del er farget?', years: ['3-trinn', '4-trinn', '5-trinn'],
      desc: 'Halvdeler, tredeler, firedeler og flere', how: 'Skriv som en brøk hvor stor del av hver figur som er farget.',
      tip: 'Tell først alle de like store delene: det er nevneren, under brøkstreken. Tell så de fargede delene: det er telleren, over brøkstreken.' },
    'fractions-of-amounts': { title: 'Brøkdel av et antall', years: ['5-trinn', '6-trinn'],
      desc: 'For eksempel ½ av 12 og ¾ av 20', how: 'Regn ut hvert stykke.',
      tip: 'Del på nevneren, og gang så med telleren. Slik finner du ¾ av 20: 20 : 4 = 5, og 5 · 3 = 15.' },
    'equivalent-fractions': { title: 'Likeverdige brøker', years: ['6-trinn', '7-trinn'],
      desc: 'Utvid brøken og finn tallet som mangler', how: 'Skriv tallet som mangler, så de to brøkene blir like store.',
      tip: 'Det du gjør med nevneren, gjør du også med telleren. ½ = ⁴⁄₈, fordi begge tallene er ganget med 4.' },
    // desimaltall og prosent
    'tenths-and-hundredths': { title: 'Tideler og hundredeler', years: ['5-trinn', '6-trinn'],
      desc: 'Skriv brøker som desimaltall', how: 'Skriv hver brøk som et desimaltall.',
      tip: 'Tidelene står på første plass etter kommaet, og hundredelene på andre plass. ⁷⁄₁₀₀ er 0,07.' },
    'percentages-of-amounts': { title: 'Prosent av et tall', years: ['6-trinn', '7-trinn'],
      desc: `10${NBSP}%, 25${NBSP}%, 50${NBSP}% og flere`, how: 'Regn ut hvert stykke.',
      tip: `10${NBSP}% finner du ved å dele på 10. Så bygger du videre: 30${NBSP}% er tre ganger 10${NBSP}%, og 5${NBSP}% er halvparten av 10${NBSP}%.` },
    // klokka
    'time-oclock-and-half-past': { title: 'Hel og halv time', years: ['1-trinn', '2-trinn'],
      desc: 'Les av klokka', how: 'Skriv hva klokka er på hver klokke.',
      tip: 'Den korte viseren viser timen. Peker den lange viseren på 12, er det hel time. Peker den på 6, er det halv: halv fire betyr en halv time før fire.' },
    'time-quarter-past-and-to': { title: 'Kvart over og kvart på', years: ['2-trinn'],
      desc: 'Les av klokka', how: 'Skriv med ord hva klokka er på hver klokke.',
      tip: 'Kvart over: Den lange viseren peker på 3. Kvart på: Den peker på 9, og den korte viseren er nesten fremme ved neste time.' },
    'time-to-5-minutes': { title: 'Klokka på fem minutter nær', years: ['3-trinn', '4-trinn'],
      desc: 'Les av klokka, med ord og digitalt', how: 'Skriv hvert klokkeslett med ord og slik det står på en digital klokke. Hvert klokkeslett kommer to ganger i døgnet, så skriv begge. Klokka 3.20 kan du også kalle «ti på halv fire», og 3.40 «tjue på fire».',
      tip: 'Tell med 5 om gangen mens den lange viseren går rundt: fra ett tall til det neste er det 5 minutter. Nær 6-tallet regner du fra halv: fem på halv og fem over halv.' },
    // penger
    'counting-coins': { title: 'Tell myntene', years: ['1-trinn', '2-trinn'],
      desc: 'Legg sammen norske mynter', how: 'Hvor mye penger er det i hver lommebok? Skriv beløpet.',
      tip: 'Begynn med mynten som er verdt mest, og tell videre: 20 kr, 30 kr, 35 kr, 36 kr … Pass på: tieren er mindre enn femmeren!' },
    'giving-change': { title: 'Hvor mye får du igjen?', years: ['2-trinn', '3-trinn'],
      desc: 'Betal med 20, 50 og 100 kr', how: 'Regn ut hvor mye du får igjen hver gang du handler.',
      tip: 'Tell oppover fra prisen til det du betalte. Fra 65 kr til 100 kr: 5 kr til 70 kr, og 30 kr til 100 kr. Du får 35 kr igjen.' },
    // måling
    'perimeter-and-area': { title: 'Omkrets og areal', years: ['4-trinn', '5-trinn', '6-trinn'],
      desc: 'Rektangler på rutenett', how: 'Hver rute er 1 cm ganger 1 cm. Finn omkretsen og arealet til hvert rektangel.',
      tip: 'Omkretsen er hvor langt det er rundt hele figuren: legg sammen alle sidene. Arealet er hvor mange ruter det er inni.' },
    // geometri og figurer
    '2d-shapes': { title: 'Geometriske figurer', years: ['1-trinn', '2-trinn'],
      desc: 'Navn, sider og hjørner', how: 'Skriv navnet på hver figur, og tell sidene og hjørnene.',
      tip: 'Sett en liten prikk på hvert hjørne mens du teller, så teller du ikke noe hjørne to ganger. Et kvadrat og et rektangel er begge firkanter.' },
    // statistikk og diagrammer
    'reading-bar-charts': { title: 'Les et søylediagram', years: ['2-trinn', '3-trinn'],
      desc: 'Undersøkelse: favorittfrukt', how: 'Elevene i 3B har stemt over hvilken frukt de liker best. Bruk søylediagrammet til å svare på spørsmålene.',
      tip: 'Før fingeren fra toppen av søylen og rett bort til tallene på siden. Der leser du av hvor mange det er.' },
    // algebra og likninger
    'missing-number-problems': { title: 'Finn tallet som mangler', years: ['4-trinn', '5-trinn', '6-trinn', '7-trinn'],
      desc: 'Hvilket tall står i ruta?', how: 'Finn tallet som mangler i hvert regnestykke.',
      tip: 'Bruk den omvendte regneoperasjonen. I ▢ + 7 = 15 regner du 15 − 7. I 3 · ▢ = 24 regner du 24 : 3.' },
  },
};
