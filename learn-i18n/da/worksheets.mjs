// Denmark (da): the printable worksheets' words, formats and pictures, and which sheets Danish schools use.
// Read by tools/make-worksheets.mjs --lang da (see learn-i18n/README.md). Facts follow learn-i18n/da/BRIEF.md:
// decimal comma, a full stop for thousands from 10.000 up (four-digit numbers stay together: 1200), "·" for
// multiplication and ":" for division (never "÷", which reads as minus to many Danes), kroner and øre ("12,50 kr.",
// "50 øre"), Danish clock phrases ("kvart over tre", "halv fire" = 3:30, "fem minutter i halv fire"), and "den lille
// tabel" (tables 1 to 10).
//
// Left out (they don't fit Danish schools):
// - multiplication-check-practice: England's national timed check; Denmark has no times-tables test.
// - multiplication-grid: a 12 × 12 grid; in Denmark "den lille tabel" is the 10 × 10 square.
// The times-table and division sheets ask up to 12; on the Danish sheets the 11 and 12 questions are named as extras
// ("ekstraopgaver"), solved by splitting: 12 · 5 = 10 · 5 + 2 · 5.

const NBSP = ' ';
const W = ['tolv', 'et', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv'];

// The clock phrase Danish children learn, h = 1 to 12 on a dial. "Over" = past, "i" = to;
// 3:30 is "halv fire" (half way to four), 3:25 "fem minutter i halv fire", 3:35 "fem minutter over halv fire".
function timeWords(h, m) {
  const hh = h % 12 || 12, next = (h % 12) + 1;
  const now = W[hh], then = W[next];
  switch (m) {
    case 0: return `klokken er ${now}`;
    case 5: return `fem minutter over ${now}`;
    case 10: return `ti minutter over ${now}`;
    case 15: return `kvart over ${now}`;
    case 20: return `tyve minutter over ${now}`;
    case 25: return `fem minutter i halv ${then}`;
    case 30: return `halv ${then}`;
    case 35: return `fem minutter over halv ${then}`;
    case 40: return `tyve minutter i ${then}`;
    case 45: return `kvart i ${then}`;
    case 50: return `ti minutter i ${then}`;
    case 55: return `fem minutter i ${then}`;
    default: return m < 30 ? `${m} minutter over ${now}` : `${60 - m} minutter i ${then}`;
  }
}

// A dial time comes twice a day, and 24-hour time is standard in Danish writing: "3:25 eller 15:25"
// (12:05 → "12:05 eller 0:05"). Colon as on a digital clock's display.
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  const later = hh === 12 ? 0 : hh + 12;
  return `${hh}:${mm} eller ${later}:${mm}`;
}

// Whole numbers: a full stop between groups of three from 10.000 up; four-digit numbers stay together (1200).
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s;
  return n < 0 ? `−${g}` : g;
};

// Amounts in øre: "50 øre", whole kroner "20 kr.", otherwise with the comma "36,50 kr.".
const money = o => {
  if (o < 100) return `${o}${NBSP}øre`;
  if (o % 100 === 0) return `${num(o / 100)}${NBSP}kr.`;
  return `${num(Math.floor(o / 100))},${String(o % 100).padStart(2, '0')}${NBSP}kr.`;
};

const PLACE = { 10: 'tier', 100: 'hundrede', 1000: 'tusind' };
const BRONZE = '#B8733A';   // 50 øre: tin bronze, reddish brown
const SILVER = '#C9CDD2';   // 1, 2 and 5 kr.: cupronickel (the coins with a hole)
const GOLD = '#D9B44A';     // 10 and 20 kr.: aluminium bronze

export default {
  htmlLang: 'da',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '·', div: ':',
  tensOnes: b => `${b} tiere og ${b} enere`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'tier' : 'tiere'} og ${o} ${o === 1 ? 'ener' : 'enere'}`,
  roundQ: (n, to, b) => `<b class="n">${n}</b> til nærmeste ${PLACE[String(to).replace(/\D/g, '')] || to} ≈ ${b}`,
  of: (f, x) => `${f} af ${x}`,
  pctOf: (p, x) => `${p}${NBSP}% af ${x}`,
  timeWords, digital,

  money,
  // the six Danish coins: 50 øre, 1, 2, 5, 10 and 20 kr.
  coinValues: [50, 100, 200, 500, 1000, 2000],
  // the label goes inside the coin's SVG <text>; "50 øre" is too wide for one line, so "øre" goes small under "50"
  // (x = the 50-øre coin's radius, 21,5 mm / 2)
  coinLabel: v => (v >= 100 ? `${v / 100} kr.` : `<tspan dy="-1.3">${v}</tspan><tspan x="10.75" dy="5" font-size="4.6">øre</tspan>`),
  // real diameters in mm (Danmarks Nationalbank); none of them is two-coloured. The 10-krone coin is smaller than
  // the 2- and 5-krone coins, as in real life. (The hole in 1, 2 and 5 kr. isn't drawn: the label sits there.)
  coins: { 50: [BRONZE, 21.5, 'circle'], 100: [SILVER, 20.25, 'circle'], 200: [SILVER, 24.5, 'circle'],
    500: [SILVER, 28.5, 'circle'], 1000: [GOLD, 23.35, 'circle'], 2000: [GOLD, 27, 'circle'] },
  coinInner: () => null,
  // paying with a 20-krone coin, a 50-krone note or a 100-krone note; prices in steps of 50 øre, the smallest coin
  paid: [2000, 5000, 10000], costStep: 50,
  // prices are random (1 kr. to 99,50 kr.), so the items are ones whose price can vary
  shopItems: ['bland selv-slik', 'frugt', 'kager', 'is', 'klistermærker', 'tegneserier', 'perler', 'brugt legetøj'],
  // "… betaler med 50 kr. Du får …": the full stop of "kr." also ends the sentence
  changeQ: (item, cost, paid, b) => `Du køber ${item} for ${cost} og betaler med ${paid}${paid.endsWith('.') ? '' : '.'} Du får ${b} tilbage.`,

  perimQ: b => `<div class="ansline">Omkreds ${b} cm</div><div class="ansline">Areal ${b} cm²</div>`,
  perimA: (p, a) => `omkreds ${p} cm, areal ${a} cm²`,
  shapes: { 3: 'trekant', 4: 'kvadrat', rect: 'rektangel', 5: 'femkant', 6: 'sekskant', 8: 'ottekant', 0: 'cirkel', 7: 'syvkant', 10: 'tikant' },
  shapeQ: b => `<div class="ansline wide">Navn:</div><div class="ansline">Sider ${b} Hjørner ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'cirkel: ingen hjørner og ingen lige sider' : `${name}: ${n} sider, ${n} hjørner`),

  fruits: ['Æbler', 'Bananer', 'Druer', 'Jordbær', 'Pærer'],
  chartQs: (f, v, mx, mn) => [
    [`Hvor mange børn valgte ${f[1].toLowerCase()}?`, v[1]],
    ['Hvilken frugt fik flest stemmer?', f[mx]],
    ['Hvilken frugt fik færrest stemmer?', f[mn]],
    [`Hvor mange flere børn valgte ${f[mx].toLowerCase()} end ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Hvor mange børn stemte i alt?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { '0-klasse': '0. klasse', '1-klasse': '1. klasse', '2-klasse': '2. klasse', '3-klasse': '3. klasse',
    '4-klasse': '4. klasse', '5-klasse': '5. klasse', '6-klasse': '6. klasse' },
  // "2. klasse", "1. og 2. klasse", "4.–6. klasse"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const k = y => y.split('-')[0];
    return ys.length > 2 ? `${k(ys[0])}.–${k(ys[ys.length - 1])}. klasse` : `${k(ys[0])}. og ${k(ys[1])}. klasse`;
  },
  name: 'Navn', date: 'Dato', tip: 'Indies tip:', answers: 'Facit',
  titleTag: t => `${t}: opgaveark fra Beequation Kids`,
  footer: 'Må gerne kopieres til brug derhjemme og i klassen. Flere opgaveark på <b>da.beequation.com/learn</b>',
  promo: '<b>Øv med Indie.</b> Spil gratis bikageopgaver med tal på da.beequation.com, eller find Beequation Kids til mobil og tablet: ingen reklamer, ingen dataindsamling og intet tidspres.',

  sheets: {
    // Tal og positionssystemet
    'missing-numbers-to-100': { title: 'Talfølger op til 100', desc: 'Tæl i spring på 1, 2, 5 og 10',
      how: 'Skriv de tal, der mangler i hver talfølge.',
      tip: 'Sig tallene højt, mens du tæller. Så kan du tit høre det, hvis et spring ikke passer.', years: ['1-klasse', '2-klasse'] },
    'tens-and-ones': { title: 'Tiere og enere', desc: 'Del tocifrede tal op i tiere og enere',
      how: 'Skriv, hvor mange tiere og enere der er i hvert tal.',
      tip: 'I 47 står 4 til venstre: Det er 4 tiere. 7 er 7 enere. Pas på: Vi siger enerne først (»syvogfyrre«), men vi skriver tierne først.', years: ['1-klasse', '2-klasse'] },
    'hundreds-tens-ones': { title: 'Hundreder, tiere og enere', desc: 'Positionssystemet op til 1000',
      how: 'Skriv hvert tal som hundreder + tiere + enere.',
      tip: 'Nullet holder pladsen. I 405 er der ingen tiere, men takket være nullet bliver 4-tallet stående på hundredernes plads.', years: ['2-klasse', '3-klasse'] },
    rounding: { title: 'Afrunding', desc: 'Afrund til nærmeste tier, hundrede og tusind',
      how: 'Afrund hvert tal, som der står. Tegnet ≈ betyder »cirka«.',
      tip: 'Kig på cifferet lige til højre for den plads, du afrunder til. Er det 0, 1, 2, 3 eller 4, afrunder du nedad. Er det 5, 6, 7, 8 eller 9, afrunder du opad.', years: ['3-klasse', '4-klasse'] },
    // Plus og minus
    'number-bonds-to-10': { title: 'Tiervenner', desc: 'To tal, der giver 10 tilsammen',
      how: 'Skriv det tal, der mangler, så det giver 10.',
      tip: 'Brug fingrene! Hold 7 fingre op. Hvor mange er stadig nede? De to tal er tiervenner.', years: ['0-klasse', '1-klasse'] },
    'number-bonds-to-20': { title: 'Venner til 20', desc: 'To tal, der giver 20 tilsammen',
      how: 'Skriv det tal, der mangler. I alle stykkerne handler det om 20.',
      tip: 'Når du ved, at 3 + 7 = 10, ved du også, at 13 + 7 = 20. Tiervennerne hjælper dig med vennerne til 20.', years: ['1-klasse', '2-klasse'] },
    'add-and-subtract-within-20': { title: 'Plus og minus til 20', desc: 'Blandede regnestykker op til 20',
      how: 'Regn hvert stykke.',
      tip: 'Over 10 kan du regne i to trin: 8 + 5 = 8 + 2 + 3 = 13. Det hedder tierovergang. Minus virker på samme måde: 13 − 5 = 13 − 3 − 2 = 8.', years: ['1-klasse', '2-klasse'] },
    'column-addition': { title: 'Plus med opstilling', desc: 'Trecifrede tal med 1 i mente',
      how: 'Regn stykkerne. Begynd med enerne!',
      tip: 'Giver enerne tilsammen 10 eller mere, skriver du kun enerne nederst og har 1 i mente. Skriv det lille 1-tal over tierne, så du husker at lægge det til.', years: ['3-klasse', '4-klasse'] },
    'column-subtraction': { title: 'Minus med opstilling', desc: 'Trecifrede tal under hinanden',
      how: 'Regn stykkerne på den måde, I gør i klassen. Begynd med enerne!',
      tip: 'Lav prøve med plus: Hvis 532 − 178 = 354, skal 354 + 178 give 532.', years: ['3-klasse', '4-klasse'] },
    // Gange og division
    'times-tables-2-5-10': { title: '2-, 5- og 10-tabellen', desc: 'Blandede gangestykker med ekstraopgaver til 12',
      how: 'Regn hvert stykke. Stykker med 11 og 12 er ekstraopgaver til dem, der vil udfordres.',
      tip: 'I 10-tabellen ender alle resultater på 0, og i 5-tabellen ender de på 0 eller 5. Og 12 · 5? Regn 10 · 5 + 2 · 5 = 50 + 10 = 60.', years: ['2-klasse', '3-klasse'] },
    'times-tables-3-4-8': { title: '3-, 4- og 8-tabellen', desc: 'Blandede gangestykker med ekstraopgaver til 12',
      how: 'Regn hvert stykke. Stykker med 11 og 12 er ekstraopgaver til dem, der vil udfordres.',
      tip: '8-tabellen er det dobbelte af 4-tabellen. Når 4 · 6 = 24, er 8 · 6 = 48.', years: ['3-klasse', '4-klasse'] },
    'division-facts': { title: 'Division med tabellerne', desc: 'Brug den lille tabel til at dividere',
      how: 'Regn hvert stykke. 42 : 6 læses »42 delt med 6«. Nogle stykker går ud over den lille tabel: De er ekstraopgaver.',
      tip: 'Division er det modsatte af gange. Ved 42 : 6 kan du spørge: 6 gange hvad giver 42? Ved 84 : 7 kan du dele op: 70 : 7 = 10 og 14 : 7 = 2, i alt 12.', years: ['3-klasse', '4-klasse'] },
    'short-multiplication': { title: 'Gange med opstilling', desc: 'Trecifrede tal gange etcifrede tal',
      how: 'Regn stykkerne. Begynd med enerne!',
      tip: 'Gang enerne først. Bliver det 10 eller mere, skriver du enerne og har tierne i mente. Læg menten til, når du har ganget det næste ciffer.', years: ['4-klasse', '5-klasse'] },
    // Brøker
    'what-fraction-is-shaded': { title: 'Hvor stor en del er farvet?', desc: 'Halve, tredjedele, fjerdedele og flere',
      how: 'Skriv som en brøk, hvor stor en del af hver figur der er farvet.',
      tip: 'Tæl først alle de lige store dele: Det er nævneren nederst. Tæl så de farvede dele: Det er tælleren øverst.', years: ['3-klasse', '4-klasse'] },
    'fractions-of-amounts': { title: 'Brøkdele af et tal', desc: 'For eksempel ½ af 12 og ¾ af 20',
      how: 'Regn hvert stykke.',
      tip: 'Del med nævneren, og gang med tælleren. Ved ¾ af 20: 20 : 4 = 5, og 5 · 3 = 15.', years: ['4-klasse', '5-klasse'] },
    'equivalent-fractions': { title: 'Brøker med samme værdi', desc: 'Forlæng brøken, og find tallet, der mangler',
      how: 'Skriv det tal, der mangler, så de to brøker er lige store.',
      tip: 'Det, du gør ved nævneren, skal du også gøre ved tælleren. ½ = ⁴⁄₈, fordi begge tal er ganget med 4. Det hedder at forlænge brøken.', years: ['5-klasse', '6-klasse'] },
    // Decimaltal og procent
    'tenths-and-hundredths': { title: 'Tiendedele og hundrededele', desc: 'Skriv brøker som decimaltal',
      how: 'Skriv hver brøk som et decimaltal.',
      tip: 'Tiendedelene står på den første plads efter kommaet, hundrededelene på den anden. ⁷⁄₁₀₀ er 0,07.', years: ['4-klasse', '5-klasse'] },
    'percentages-of-amounts': { title: 'Procent af et tal', desc: `10${NBSP}%, 25${NBSP}%, 50${NBSP}% og flere`,
      how: 'Regn hvert stykke.',
      tip: `10${NBSP}% finder du ved at dele med 10. Så kan du bygge videre: 30${NBSP}% er tre gange 10${NBSP}%, og 5${NBSP}% er det halve af 10${NBSP}%.`, years: ['6-klasse'] },
    // Klokken og tid
    'time-oclock-and-half-past': { title: 'Hele og halve timer', desc: 'Aflæs urene',
      how: 'Skriv, hvad klokken er på hvert ur.',
      tip: 'Den lille viser fortæller, hvilken time det er. Peger den store viser på 12, er klokken hel. Peger den på 6, er klokken halv: Halv fire er en halv time før klokken fire.', years: ['1-klasse'] },
    'time-quarter-past-and-to': { title: 'Kvart over og kvart i', desc: 'Aflæs urene',
      how: 'Skriv med ord, hvad klokken er på hvert ur.',
      tip: 'Kvart over: Den store viser peger på 3. Kvart i: Den peger på 9, og den lille viser er næsten nået til den næste time.', years: ['2-klasse'] },
    'time-to-5-minutes': { title: 'Klokken på 5 minutter', desc: 'Aflæs urene',
      how: 'Skriv hvert klokkeslæt med ord og som på et digitalt ur. Hvert klokkeslæt kommer to gange i døgnet: Skriv begge.',
      tip: 'Tæl i spring på 5, mens den store viser går rundt: Fra et tal på uret til det næste er der 5 minutter. Omkring halv tæller vi fra halv: 3:25 er fem minutter i halv fire, og 3:35 er fem minutter over halv fire.', years: ['2-klasse', '3-klasse'] },
    // Penge
    'counting-coins': { title: 'Tæl mønterne', desc: 'Læg danske mønter sammen',
      how: 'Hvor mange penge er der i hver pung? Skriv beløbet.',
      tip: 'Begynd med den mønt, der er mest værd, og tæl videre. Pas på: 10-kronen er mindre end 5-kronen, så se på tallet og ikke på størrelsen. To 50-ører giver 1 krone.', years: ['2-klasse', '3-klasse'] },
    'giving-change': { title: 'Byttepenge', desc: `Byttepenge fra 20, 50 og 100${NBSP}kr.`,
      how: 'Hvor mange penge får du tilbage ved hvert køb?',
      tip: `Tæl op fra prisen til det beløb, du betaler med. Fra 36,50${NBSP}kr. til 50${NBSP}kr.: 50${NBSP}øre op til 37${NBSP}kr., 3${NBSP}kr. op til 40${NBSP}kr. og 10${NBSP}kr. op til 50${NBSP}kr. Du får 13,50${NBSP}kr. tilbage.`, years: ['3-klasse', '4-klasse'] },
    // Måling
    'perimeter-and-area': { title: 'Omkreds og areal', desc: 'Rektangler på ternet papir',
      how: 'Hver tern er 1 cm på hver side. Find omkredsen og arealet af hvert rektangel.',
      tip: 'Omkredsen er hele vejen rundt langs kanten: Læg alle siderne sammen. Arealet er antallet af tern indeni.', years: ['3-klasse', '4-klasse'] },
    // Geometri og figurer
    '2d-shapes': { title: 'Plane figurer', desc: 'Navne, sider og hjørner',
      how: 'Skriv navnet på hver figur, og tæl dens sider og hjørner.',
      tip: 'Sæt en lille prik ved hvert hjørne, når du tæller, så du ikke kommer til at tælle et hjørne to gange. Navnet hjælper også: En femkant har 5 hjørner.', years: ['1-klasse', '2-klasse'] },
    // Statistik og diagrammer
    'reading-bar-charts': { title: 'Aflæs et søjlediagram', desc: 'Undersøgelse: yndlingsfrugt',
      how: 'Eleverne i 3.a har stemt om deres yndlingsfrugt. Brug søjlediagrammet til at svare på spørgsmålene.',
      tip: 'Før fingeren fra toppen af søjlen vandret over til tallene i siden. Der kan du aflæse, hvor mange der er.', years: ['2-klasse', '3-klasse'] },
    // Mønstre og ligninger
    'missing-number-problems': { title: 'Find det skjulte tal', desc: 'Hvilket tal står i boksen?',
      how: 'Find det tal, der mangler i hvert regnestykke.',
      tip: 'Brug den modsatte regningsart. Ved ▢ + 7 = 15 regner du 15 − 7. Ved 3 · ▢ = 24 regner du 24 : 3.', years: ['4-klasse', '5-klasse', '6-klasse'] },
  },
};
