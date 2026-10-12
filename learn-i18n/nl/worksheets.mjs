// The Netherlands (nl): words, formats and pictures for the printable worksheets (read by tools/make-worksheets.mjs --lang nl).
// Facts follow learn-i18n/nl/BRIEF.md: × ("keer") and ":" ("gedeeld door"), decimal comma, no separator in four-digit
// numbers and a point from 10.000 up, euro and cent with coins from 5 cent (cash is rounded to 5 cent, so prices end
// in 0 or 5), clock phrases as children learn them ("half vier" = 3.30, "tien voor half vier" = 3.20), times written
// "15.35 uur", the tafels from 1 to 10, and the year for each sheet from the SLO tussendoelen per groep.
//
// Left out (they don't fit Dutch schools):
// - multiplication-check-practice: England's timed national check; the Netherlands has no tables test.
// - multiplication-grid: a 12 × 12 grid; Dutch children learn the tafels to 10 × 10 (11 and 12 are not standard).
// The times-table and division sheets ask up to 12; on the Dutch sheets the 11 and 12 questions are named as an
// extra challenge ("extra uitdaging"), worked out from the tafel of 10 (12 × 5 = 10 × 5 + 2 × 5).

const NBSP = '\u00A0';
const HOURS = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];

// The clock phrase children learn in Dutch primary schools, h = 1 to 12 on a dial.
// "Half" points to the next hour: 3.30 is "half vier"; 3.20 "tien voor half vier", 3.40 "tien over half vier".
function timeWords(h, m) {
  const hh = h % 12 || 12, next = (h % 12) + 1;
  const now = HOURS[hh], then = HOURS[next];
  switch (m) {
    case 0: return `${now} uur`;
    case 5: return `vijf over ${now}`;
    case 10: return `tien over ${now}`;
    case 15: return `kwart over ${now}`;
    case 20: return `tien voor half ${then}`;
    case 25: return `vijf voor half ${then}`;
    case 30: return `half ${then}`;
    case 35: return `vijf over half ${then}`;
    case 40: return `tien over half ${then}`;
    case 45: return `kwart voor ${then}`;
    case 50: return `tien voor ${then}`;
    case 55: return `vijf voor ${then}`;
    default: return m < 30 ? `${m} minuten over ${now}` : `${60 - m} minuten voor ${then}`;
  }
}

// A dial time happens twice a day (an "etmaal" has 24 hours); written with a point as in Dutch school books:
// "3.35 uur of 15.35 uur", and 12.05 → "12.05 uur of 0.05 uur".
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  const other = hh === 12 ? 0 : hh + 12;
  return `${hh}.${mm} uur of ${other}.${mm} uur`;
}

// Whole numbers: four-digit numbers stay together (2500, 4562), a point from 10.000 up (as the SLO goals write them).
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s;
  return n < 0 ? `−${g}` : g;
};

// Amounts in cents: under 1 euro "35 cent", whole euros "€ 2", otherwise "€ 3,45" (euro sign first, with a space).
const money = c => c < 100 ? `${c} cent`
  : c % 100 === 0 ? `€${NBSP}${num(c / 100)}`
  : `€${NBSP}${num(Math.floor(c / 100))},${String(c % 100).padStart(2, '0')}`;

const PLACE = { 10: 'tientallen', 100: 'honderdtallen', 1000: 'duizendtallen' };
// euro coin colours from the brief (ECB specifications)
const COPPER = '#B87333', GOLD = '#D9B44A', SILVER = '#C8CCD0';

// school years: groep 1 en 2 share one page; a sheet's label joins the groep numbers
const GROEP = { 'groep-1-2': [1, 2], 'groep-3': [3], 'groep-4': [4], 'groep-5': [5], 'groep-6': [6], 'groep-7': [7], 'groep-8': [8] };

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Klok: de grote wijzer wijst naar de ${minute} en de kleine wijzer wijst naar de ${hour}`
      : `Klok: de grote wijzer wijst naar de ${minute} en de kleine wijzer staat tussen de ${hour} en de ${next}`;
  },
  shapeAlt: n => `Figuur ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind} met ${shaded} van de ${total} gelijke delen gekleurd`,
  fractionKinds: {"bar": "Strook", "circle": "Cirkel", "grid": "Raster"},
  coinAlt: value => `Munt van ${value}`,
  rectangleAlt: (w, h) => `Rechthoek op een raster met ${w} kolommen en ${h} rijen van vierkantjes van 1 cm bij 1 cm`,
  chartAlt: "Staafdiagram van de stemmen voor het favoriete fruit; de waarden staan in de tabel hieronder",
  chartFruit: "Fruit", chartVotes: "Stemmen",
  htmlLang: 'nl',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '×', div: ':',
  tensOnes: b => `${b} tientallen en ${b} eenheden`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'tiental' : 'tientallen'} en ${o} ${o === 1 ? 'eenheid' : 'eenheden'}`,
  roundQ: (n, to, b) => `Op ${PLACE[String(to).replace(/\D/g, '')] || to}: <b class="n">${n}</b> → ${b}`,
  of: (f, x) => `${f} van ${x}`,
  pctOf: (p, x) => `${p}% van ${x}`,
  timeWords, digital,
  money,
  // coins from 5 cent up: 1 and 2 cent coins are hardly used in the Netherlands
  coinValues: [5, 10, 20, 50, 100, 200],
  coinLabel: v => v >= 100 ? `€ ${v / 100}` : `${v} ct`,
  // euro coins: real diameters in mm; 1, 2, 5 cent copper, 10, 20, 50 cent Nordic gold, € 1 and € 2 two-coloured
  // (the fill is the outer ring: € 1 gold ring with a silver centre, € 2 silver ring with a gold centre)
  coins: { 1: [COPPER, 16.25, 'circle'], 2: [COPPER, 18.75, 'circle'], 5: [COPPER, 21.25, 'circle'],
    10: [GOLD, 19.75, 'circle'], 20: [GOLD, 22.25, 'circle'], 50: [GOLD, 24.25, 'circle'],
    100: [GOLD, 23.25, 'circle'], 200: [SILVER, 25.75, 'circle'] },
  coinInner: v => v === 100 ? SILVER : v === 200 ? GOLD : null,
  // prices go up in steps of 5 cent, like a cash total in a Dutch shop
  paid: [100, 200, 500], costStep: 5,
  // prices are random (10 cent to € 4,95), so most items are ones whose price can vary
  shopItems: ['een potlood', 'stickers', 'een zakje drop', 'een ijsje', 'een schrift', 'een stuiterbal', 'stroopwafels', 'een gum'],
  changeQ: (item, cost, paid, b) => `Je koopt ${item} voor ${cost} en betaalt met ${paid}. Je krijgt ${b} terug.`,
  perimQ: b => `<div class="ansline">Omtrek ${b} cm</div><div class="ansline">Oppervlakte ${b} cm²</div>`,
  perimA: (p, a) => `omtrek ${p} cm, oppervlakte ${a} cm²`,
  shapes: { 3: 'driehoek', 4: 'vierkant', rect: 'rechthoek', 5: 'vijfhoek', 6: 'zeshoek', 8: 'achthoek', 0: 'cirkel', 7: 'zevenhoek', 10: 'tienhoek' },
  shapeQ: b => `<div class="ansline wide">Naam:</div><div class="ansline">Zijden ${b} Hoeken ${b}</div>`,
  shapeA: (name, n) => n === 0 ? 'cirkel: geen hoeken, geen rechte zijden' : `${name}: ${n} zijden, ${n} hoeken`,
  fruits: ['Appels', 'Bananen', 'Druiven', 'Sinaasappels', 'Peren'],
  chartQs: (f, v, mx, mn) => [
    [`Hoeveel kinderen kozen ${f[1].toLowerCase()}?`, v[1]],
    ['Welk fruit kozen de meeste kinderen?', f[mx]],
    ['Welk fruit kozen de minste kinderen?', f[mn]],
    [`Hoeveel kinderen kozen er meer voor ${f[mx].toLowerCase()} dan voor ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Hoeveel kinderen hebben er in totaal gestemd?', v.reduce((a, b) => a + b, 0)]],
  years: { 'groep-1-2': 'Groep 1 en 2', 'groep-3': 'Groep 3', 'groep-4': 'Groep 4', 'groep-5': 'Groep 5', 'groep-6': 'Groep 6', 'groep-7': 'Groep 7', 'groep-8': 'Groep 8' },
  // "Groep 4", "Groep 3 en 4", "Groep 1 tot en met 3", "Groep 5 tot en met 7"
  yearsLabel: (ys, n) => {
    const g = [...new Set(ys.flatMap(y => GROEP[y] || []))].sort((a, b) => a - b);
    if (!g.length || g.length !== ys.reduce((k, y) => k + (GROEP[y] || []).length, 0)) return ys.map(y => n[y]).join(', ');
    const run = g.every((x, i) => i === 0 || x === g[i - 1] + 1);
    if (g.length === 1) return `Groep ${g[0]}`;
    if (!run) return `Groep ${g.slice(0, -1).join(', ')} en ${g[g.length - 1]}`;
    return g.length === 2 ? `Groep ${g[0]} en ${g[1]}` : `Groep ${g[0]} tot en met ${g[g.length - 1]}`;
  },
  name: 'Naam', date: 'Datum', tip: 'De tip van Indie:', answers: 'Antwoorden',
  titleTag: t => `${t}: werkblad van Beequation Kids`,
  footer: 'Gratis te kopiëren voor thuis en in de klas. Meer werkbladen op <b>nl.beequation.com/learn</b>',
  promo: '<b>Oefenen met Indie.</b> Speel gratis honingraatpuzzels met getallen op nl.beequation.com, of zoek Beequation Kids op je telefoon of tablet: zonder advertenties, zonder gegevensverzameling en zonder tijdsdruk.',

  sheets: {
    // Tellen en getalbegrip
    'missing-numbers-to-100': { title: 'Getallenrijen tot 100', desc: 'Tellen met sprongen van 1, 2, 5 en 10',
      how: 'Vul in elke rij de getallen in die ontbreken.',
      tip: 'Zeg de getallen hardop terwijl je telt. Je oren horen meteen wanneer een sprong niet klopt!', years: ['groep-3', 'groep-4'] },
    'tens-and-ones': { title: 'Tientallen en eenheden', desc: 'Getallen tot 100 splitsen',
      how: 'Splits elk getal in tientallen en eenheden.',
      tip: 'Bij 47 zeg je eerst de 7 (zeven-en-veertig), maar je schrijft eerst de 4. Die 4 vooraan betekent 4 tientallen, de 7 achteraan 7 eenheden.', years: ['groep-4'] },
    'hundreds-tens-ones': { title: 'Honderdtallen, tientallen en eenheden', desc: 'Positiewaarde tot 1000',
      how: 'Splits elk getal in honderdtallen + tientallen + eenheden.',
      tip: 'Een 0 houdt een plekje vrij. In 405 zijn er geen tientallen, maar dankzij de 0 blijft de 4 bij de honderdtallen staan.', years: ['groep-5'] },
    rounding: { title: 'Afronden', desc: 'Op tientallen, honderdtallen en duizendtallen',
      how: 'Rond elk getal af zoals aangegeven.',
      tip: 'Kijk naar het cijfer rechts van de plek waarop je afrondt. Is het 0, 1, 2, 3 of 4, dan rond je naar beneden af. Bij 5, 6, 7, 8 of 9 rond je naar boven af.', years: ['groep-5', 'groep-6'] },
    // Optellen en aftrekken
    'number-bonds-to-10': { title: 'Splitsen van 10', desc: 'Welke twee getallen maken samen 10?',
      how: 'Schrijf het getal op dat ontbreekt, zodat het samen 10 is.',
      tip: 'Gebruik je vingers! Steek er 7 op. Hoeveel vingers steken er nog niet omhoog? Samen is het 10. In de klas heten zulke paren vaak de verliefde harten.', years: ['groep-1-2', 'groep-3'] },
    'number-bonds-to-20': { title: 'Samen 20', desc: 'Welke twee getallen maken samen 20?',
      how: 'Schrijf het getal op dat ontbreekt. Bij elke som draait het om 20.',
      tip: 'Weet je dat 3 + 7 = 10? Dan weet je ook dat 13 + 7 = 20. De splitsingen van 10 helpen je bij 20.', years: ['groep-3', 'groep-4'] },
    'add-and-subtract-within-20': { title: 'Plus en min tot 20', desc: 'Plus- en minsommen door elkaar',
      how: 'Reken elke som uit.',
      tip: 'Over het tiental? Spring eerst naar 10: 8 + 5 = 8 + 2 + 3 = 13. Bij min werkt het ook zo: 13 − 5 = 13 − 3 − 2 = 8.', years: ['groep-3', 'groep-4'] },
    'column-addition': { title: 'Optellen onder elkaar', desc: 'Getallen van drie cijfers',
      how: 'Reken elke som onder elkaar uit: kolomsgewijs of cijferend, zoals je het in de klas leert.',
      tip: 'Cijfer je? Begin bij de eenheden. Is een kolom samen 10 of meer, schrijf dan alleen de eenheden op en onthoud de 1: zet hem klein boven de volgende kolom.', years: ['groep-5', 'groep-6'] },
    'column-subtraction': { title: 'Aftrekken onder elkaar', desc: 'Getallen van drie cijfers',
      how: 'Reken elke som onder elkaar uit: kolomsgewijs of cijferend, zoals je het in de klas leert.',
      tip: 'Controleer je antwoord door terug te rekenen met een plussom. Is 532 − 178 = 354, dan moet 354 + 178 weer 532 zijn.', years: ['groep-5', 'groep-6'] },
    // Tafels, keer- en deelsommen
    'times-tables-2-5-10': { title: 'De tafels van 2, 5 en 10', desc: 'Keersommen door elkaar',
      how: 'Reken elke som uit. Sommen met 11 of 12 zijn een extra uitdaging: 12 × 5 is 10 × 5 en nog 2 × 5.',
      tip: 'Bij de tafel van 10 eindigt elke uitkomst op een 0, bij de tafel van 5 op een 0 of een 5.', years: ['groep-4'] },
    'times-tables-3-4-8': { title: 'De tafels van 3, 4 en 8', desc: 'Keersommen door elkaar',
      how: 'Reken elke som uit. Sommen met 11 of 12 zijn een extra uitdaging: 11 × 4 is 10 × 4 en nog 1 × 4.',
      tip: 'De tafel van 8 is de tafel van 4 verdubbeld. Is 6 × 4 = 24, dan is 6 × 8 = 48.', years: ['groep-4', 'groep-5'] },
    'division-facts': { title: 'Deeltafels', desc: 'Delen met de tafels',
      how: 'Reken elke deelsom uit. Kom je een som met 11 of 12 tegen, zoals 88 : 11? Dat is een extra uitdaging.',
      tip: 'Delen is terugrekenen met de tafels. Bij 42 : 6 vraag je je af: hoeveel keer 6 is 42? 7 × 6 = 42, dus 42 : 6 = 7.', years: ['groep-5', 'groep-6'] },
    'short-multiplication': { title: 'Vermenigvuldigen onder elkaar', desc: 'Drie cijfers keer één cijfer',
      how: 'Reken elke keersom onder elkaar uit: kolomsgewijs of cijferend, zoals je het in de klas leert.',
      tip: 'Cijfer je? Begin bij de eenheden. Is de uitkomst 10 of meer, schrijf dan de eenheden op en onthoud de tientallen. Die tel je erbij nadat je het volgende cijfer hebt vermenigvuldigd.', years: ['groep-6', 'groep-7'] },
    // Breuken
    'what-fraction-is-shaded': { title: 'Welk deel is gekleurd?', desc: 'Halven, derden, kwarten en meer',
      how: 'Schrijf als breuk op welk deel van elke figuur gekleurd is.',
      tip: 'Tel eerst alle gelijke stukjes: dat is de noemer, onder de breukstreep. Tel dan de gekleurde stukjes: dat is de teller, erboven.', years: ['groep-5', 'groep-6'] },
    'fractions-of-amounts': { title: 'Breuken van een getal', desc: 'Zoals ½ van 12 en ¾ van 20',
      how: 'Reken elke som uit.',
      tip: 'Deel door de noemer en doe het dan keer de teller. Bij ¾ van 20: 20 : 4 = 5, en 3 × 5 = 15.', years: ['groep-6', 'groep-7'] },
    'equivalent-fractions': { title: 'Gelijkwaardige breuken', desc: 'Vind het getal dat ontbreekt',
      how: 'Schrijf het getal op dat ontbreekt, zodat de twee breuken even groot zijn.',
      tip: 'Wat je met de noemer doet, doe je ook met de teller. ½ = ⁴⁄₈, want de teller en de noemer zijn allebei keer 4 gedaan.', years: ['groep-7', 'groep-8'] },
    // Kommagetallen en procenten
    'tenths-and-hundredths': { title: 'Tienden en honderdsten', desc: 'Breuken als kommagetal',
      how: 'Schrijf elke breuk als kommagetal.',
      tip: 'Het eerste cijfer achter de komma zijn de tienden, het tweede de honderdsten. ⁷⁄₁₀₀ is dus 0,07.', years: ['groep-6', 'groep-7'] },
    'percentages-of-amounts': { title: 'Procenten berekenen', desc: '10%, 25%, 50% en meer',
      how: 'Reken elke som uit.',
      tip: '10% vind je door te delen door 10. Daarmee bouw je verder: 30% is drie keer 10%, en 5% is de helft van 10%. En 25% is een kwart.', years: ['groep-7', 'groep-8'] },
    // Klokkijken
    'time-oclock-and-half-past': { title: 'Hele en halve uren', desc: 'Klokkijken',
      how: 'Schrijf op hoe laat het is op elke klok.',
      tip: 'De kleine wijzer wijst het uur aan. Wijst de grote wijzer naar de 12, dan is het een heel uur. Wijst hij naar de 6, dan is het half: half vier is een half uur vóór vier uur.', years: ['groep-3', 'groep-4'] },
    'time-quarter-past-and-to': { title: 'Kwart over en kwart voor', desc: 'Klokkijken',
      how: 'Schrijf in woorden op hoe laat het is op elke klok.',
      tip: 'Kwart over: de grote wijzer wijst naar de 3. Kwart voor: hij wijst naar de 9, en de kleine wijzer is al bijna bij het volgende uur.', years: ['groep-4'] },
    'time-to-5-minutes': { title: 'Klokkijken per 5 minuten', desc: 'In woorden en in cijfers',
      how: 'Schrijf elke tijd in woorden en in cijfers. Elke tijd komt twee keer per dag voor: schrijf ze allebei op, zoals 3.35 uur en 15.35 uur.',
      tip: 'Tel in sprongen van 5 terwijl de grote wijzer rondgaat. Tussen 20 en 40 minuten kijk je naar het halve uur: 3.20 uur is tien voor half vier, 3.40 uur is tien over half vier.', years: ['groep-5'] },
    // Rekenen met geld
    'counting-coins': { title: 'Munten tellen', desc: 'Euromunten optellen',
      how: 'Hoeveel geld zit er in elke portemonnee? Schrijf het bedrag op.',
      tip: 'Begin bij de munt die het meest waard is en tel verder: 50 cent, 70 cent, 80 cent, 85 cent … 100 cent is € 1.', years: ['groep-4', 'groep-5'] },
    'giving-change': { title: 'Wisselgeld', desc: 'Terugkrijgen van € 1, € 2 en € 5',
      how: 'Hoeveel geld krijg je terug bij elke aankoop?',
      tip: 'Tel aan vanaf de prijs tot het bedrag dat je betaalt. Van 65 cent tot € 1: 5 cent erbij is 70 cent, 30 cent erbij is € 1. Je krijgt 35 cent terug.', years: ['groep-5', 'groep-6'] },
    // Meten en wegen
    'perimeter-and-area': { title: 'Omtrek en oppervlakte', desc: 'Rechthoeken op een rooster van centimeters',
      how: 'Elk hokje is 1 cm bij 1 cm. Bereken de omtrek en de oppervlakte van elke rechthoek.',
      tip: 'De omtrek is de lengte van de rand, helemaal rond: tel alle zijden bij elkaar op. De oppervlakte is het aantal hokjes binnenin.', years: ['groep-5', 'groep-6'] },
    // Meetkunde en vormen
    '2d-shapes': { title: 'Vlakke figuren', desc: 'Namen, zijden en hoeken',
      how: 'Schrijf de naam van elke figuur op en tel de zijden en de hoeken.',
      tip: 'Zet een stipje bij elke hoek die je telt, dan tel je er geen twee keer. En de naam helpt je: een vijfhoek heeft 5 hoeken.', years: ['groep-4', 'groep-5', 'groep-6'] },
    // Tabellen en grafieken
    'reading-bar-charts': { title: 'Een staafdiagram aflezen', desc: 'Het lievelingsfruit van de klas',
      how: 'De kinderen van groep 4 hebben gestemd op hun lievelingsfruit. Gebruik het staafdiagram om de vragen te beantwoorden.',
      tip: 'Ga met je vinger van de bovenkant van een staaf recht naar de getallen aan de zijkant. Daar lees je af hoeveel kinderen het zijn.', years: ['groep-3', 'groep-4'] },
    // Verhoudingen en patronen
    'missing-number-problems': { title: 'Welk getal ontbreekt?', desc: 'Vind het getal in het hokje',
      how: 'Zoek in elke som het getal dat in het hokje hoort.',
      tip: 'Reken terug met de omgekeerde som. Bij ▢ + 7 = 15 reken je 15 − 7. Bij 3 × ▢ = 24 reken je 24 : 3.', years: ['groep-5', 'groep-6'] },
  },
};
