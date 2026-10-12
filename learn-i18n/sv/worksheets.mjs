// Sweden (sv): the printable worksheets' words, formats and pictures, and which sheets Swedish schools use.
// Read by tools/make-worksheets.mjs --lang sv (see learn-i18n/README.md). Facts follow learn-i18n/sv/BRIEF.md:
// decimal comma, a (non-breaking) space for thousands from 1 000 up, the multiplication dot "·" and division with
// "/" in a line of text (never ÷), kronor with the coins 1, 2, 5 and 10 kr (no öre coins, so whole-krona prices),
// clock phrases as children learn them ("halv fyra" = 3:30, "fem i halv fyra" = 3:25), 24-hour digital times
// written "15.35", multiplikationstabellen 1–10, "hörn" for vertices, "facit" for the answer page.
// School years follow the brief's usual textbook practice (Lgr22 gives content per stage, åk 1–3 and 4–6).
//
// Left out (they don't fit Swedish schools):
// - multiplication-check-practice: England's timed national check; Sweden has no tables test.
// - multiplication-grid: a 12 × 12 grid; Swedish tables, and the multiplication table chart, go from 1 to 10.
// The tables and division sheets ask up to 12; on the Swedish sheets the 11 and 12 questions are named as extra
// challenges ("extrautmaningar"), solved by splitting (12 · 5 = 10 · 5 + 2 · 5).

const NBSP = ' ';
const W = ['tolv', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];

// Whole numbers: groups of three with a non-breaking space from 1 000 up (4 328, 25 000), as in Swedish textbooks.
const num = n => {
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return n < 0 ? `−${s}` : s;
};

// Amounts in öre: "35 kr", "1 250 kr", and with öre "19,90 kr" (not used: cash is in whole kronor).
const money = o => (o % 100 === 0 ? `${num(o / 100)}${NBSP}kr` : `${num(Math.floor(o / 100))},${String(o % 100).padStart(2, '0')}${NBSP}kr`);

// The clock phrase children learn in Swedish schools, h = 1 to 12 on a dial, m in steps of 5.
// 3:30 is "halv fyra" (half towards four); 3:25 "fem i halv fyra", 3:35 "fem över halv fyra".
function timeWords(h, m) {
  const hh = h % 12 || 12, next = (h % 12) + 1;
  const now = W[hh], then = W[next];
  switch (m) {
    case 0: return `klockan ${now}`;
    case 5: return `fem över ${now}`;
    case 10: return `tio över ${now}`;
    case 15: return `kvart över ${now}`;
    case 20: return `tjugo över ${now}`;
    case 25: return `fem i halv ${then}`;
    case 30: return `halv ${then}`;
    case 35: return `fem över halv ${then}`;
    case 40: return `tjugo i ${then}`;
    case 45: return `kvart i ${then}`;
    case 50: return `tio i ${then}`;
    case 55: return `fem i ${then}`;
    default: return m < 30 ? `${m} minuter över ${now}` : `${60 - m} minuter i ${then}`;
  }
}

// A dial time happens twice a day; Swedish children learn both, written with a point: "3.35 eller 15.35"
// (12:05 → "12.05 eller 00.05").
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  const later = hh === 12 ? '00' : String(hh + 12);
  return `${hh}.${mm} eller ${later}.${mm}`;
}

const PLACE = { 10: 'Tiotal', 100: 'Hundratal', 1000: 'Tusental' };
// Riksbank: 1 and 2 kr copper-coloured, 5 and 10 kr gold-coloured (Nordic gold); colours as suggested in the brief
const COPPER = '#C8794A', GOLD = '#E3B94B';

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Klocka: den långa visaren pekar på ${minute} och den korta visaren pekar på ${hour}`
      : `Klocka: den långa visaren pekar på ${minute} och den korta visaren är mellan ${hour} och ${next}`;
  },
  shapeAlt: n => `Form ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind} med ${shaded} av ${total} lika stora delar färglagda`,
  fractionKinds: {"bar": "Remsa", "circle": "Cirkel", "grid": "Rutnät"},
  coinAlt: value => `Mynt värt ${value}`,
  rectangleAlt: (w, h) => `Rektangel på ett rutnät med ${w} kolumner och ${h} rader av rutor med sidan 1 cm`,
  chartAlt: "Stapeldiagram över röster på favoritfrukt; värdena finns i tabellen nedan",
  chartFruit: "Frukt", chartVotes: "Röster",
  htmlLang: 'sv',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '·', div: '/',
  tensOnes: b => `${b} tiotal och ${b} ental`,
  tensOnesA: (t, o) => `${t} tiotal och ${o} ental`,
  // "Tusental: 4 567 ≈ ▢" (≈ is read "ungefär lika med")
  roundQ: (n, to, b) => `${PLACE[String(to).replace(/\D/g, '')] || to}: <b class="n">${n}</b> ≈ ${b}`,
  of: (f, x) => `${f} av ${x}`,
  pctOf: (p, x) => `${p}${NBSP}% av ${x}`,
  timeWords, digital,

  money,
  coinValues: [100, 200, 500, 1000],
  coinLabel: v => `${v / 100}${NBSP}kr`,
  // Swedish coins: colour and real diameter in mm (the 10-krona coin is smaller than the 5-krona coin)
  coins: { 100: [COPPER, 19.5, 'circle'], 200: [COPPER, 22.5, 'circle'], 500: [GOLD, 23.75, 'circle'], 1000: [GOLD, 20.5, 'circle'] },
  // no two-coloured coins in Sweden
  coinInner: () => null,
  // paying with a 20, 50 or 100 kr note; prices in whole kronor
  paid: [2000, 5000, 10000], costStep: 100,
  // prices are random (2 kr to 99 kr), so most items are ones whose price can vary
  shopItems: ['en serietidning', 'plockgodis', 'en glass', 'klistermärken', 'ett pussel', 'en leksaksbil', 'frukt', 'en bok på loppis'],
  changeQ: (item, cost, paid, b) => `Du köper ${item} för ${cost} och betalar med ${paid}. Du får tillbaka: ${b}`,

  perimQ: b => `<div class="ansline">Omkrets ${b} cm</div><div class="ansline">Area ${b} cm²</div>`,
  perimA: (p, a) => `Omkrets ${p} cm, area ${a} cm²`,
  shapes: { 3: 'triangel', 4: 'kvadrat', rect: 'rektangel', 5: 'femhörning', 6: 'sexhörning', 8: 'åttahörning', 0: 'cirkel', 7: 'sjuhörning', 10: 'tiohörning' },
  shapeQ: b => `<div class="ansline wide">Namn:</div><div class="ansline">Sidor ${b} Hörn ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'cirkel: inga raka sidor, 0 hörn' : `${name}: ${n} sidor, ${n} hörn`),

  fruits: ['Äpplen', 'Bananer', 'Druvor', 'Apelsiner', 'Päron'],
  chartQs: (f, v, mx, mn) => [
    [`Hur många barn valde ${f[1].toLowerCase()}?`, v[1]],
    ['Vilken frukt fick flest röster?', f[mx]],
    ['Vilken frukt fick färst röster?', f[mn]],
    [`Hur många fler barn valde ${f[mx].toLowerCase()} än ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Hur många barn röstade sammanlagt?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { forskoleklass: 'Förskoleklass', 'arskurs-1': 'Årskurs 1', 'arskurs-2': 'Årskurs 2', 'arskurs-3': 'Årskurs 3',
    'arskurs-4': 'Årskurs 4', 'arskurs-5': 'Årskurs 5', 'arskurs-6': 'Årskurs 6' },
  // "Årskurs 2", "Årskurs 1 och 2", "Årskurs 3–5", "Förskoleklass och årskurs 1", "Förskoleklass till årskurs 2"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const nums = ys.filter(y => y.startsWith('arskurs-')).map(y => y.slice(8));
    const hasF = ys.includes('forskoleklass');
    if (!hasF) return nums.length > 2 ? `Årskurs ${nums[0]}–${nums[nums.length - 1]}` : `Årskurs ${nums.join(' och ')}`;
    return ys.length > 2 ? `Förskoleklass till årskurs ${nums[nums.length - 1]}` : `Förskoleklass och årskurs ${nums[0]}`;
  },
  name: 'Namn', date: 'Datum', tip: 'Indies tips:', answers: 'Facit',
  titleTag: t => `${t} – arbetsblad från Beequation Kids`,
  footer: 'Får kopieras fritt för hemmet och klassrummet. Fler arbetsblad på <b>sv.beequation.com/learn</b>',
  promo: '<b>Öva med Indie.</b> Lös gratis talpussel i vaxkakor på sv.beequation.com, eller leta upp Beequation Kids i mobilen eller surfplattan: ingen reklam, ingen datainsamling och ingen klocka att tävla mot.',

  sheets: {
    // Tal och positionssystemet
    'missing-numbers-to-100': { title: 'Talföljder upp till 100', years: ['arskurs-1', 'arskurs-2'],
      desc: 'Räkna med steg på 1, 2, 5 och 10', how: 'Skriv de tal som fattas i varje talföljd.',
      tip: 'Säg talen högt medan du räknar. Öronen märker direkt om ett hopp blir fel!' },
    'tens-and-ones': { title: 'Tiotal och ental', years: ['arskurs-1', 'arskurs-2'],
      desc: 'Dela upp tvåsiffriga tal', how: 'Dela upp varje tal i tiotal och ental.',
      tip: 'Siffran till vänster visar hur många tiotal det finns. 47 är 4 tiotal och 7 ental.' },
    'hundreds-tens-ones': { title: 'Hundratal, tiotal och ental', years: ['arskurs-2', 'arskurs-3'],
      desc: `Positionssystemet upp till 1${NBSP}000`, how: 'Skriv varje tal som hundratal + tiotal + ental.',
      tip: 'Nollan håller platsen. I 405 finns inga tiotal, men tack vare nollan står 4:an kvar bland hundratalen.' },
    'rounding': { title: 'Avrunda tal', years: ['arskurs-3', 'arskurs-4'],
      desc: 'Till närmaste tiotal, hundratal och tusental',
      how: 'Avrunda varje tal till det som står framför: närmaste tiotal, hundratal eller tusental. Tecknet ≈ betyder ”ungefär lika med”.',
      tip: 'Titta på siffran direkt till höger om platsen du avrundar till. Är den 0, 1, 2, 3 eller 4 avrundar du nedåt. Är den 5, 6, 7, 8 eller 9 avrundar du uppåt.' },
    // Addition och subtraktion
    'number-bonds-to-10': { title: 'Tiokamrater', years: ['forskoleklass', 'arskurs-1'],
      desc: 'Två tal som tillsammans blir 10', how: 'Skriv talet som fattas, så att det blir 10 tillsammans.',
      tip: 'Ta hjälp av fingrarna! Håll upp 7 fingrar. Hur många är nere? De är sjuans tiokamrat.' },
    'number-bonds-to-20': { title: 'Talkamrater till 20', years: ['arskurs-1', 'arskurs-2'],
      desc: 'Två tal som tillsammans blir 20', how: 'Skriv talet som fattas. I varje uppgift handlar det om 20.',
      tip: 'Om du vet att 3 + 7 = 10, så vet du också att 13 + 7 = 20. Tiokamraterna hjälper dig hela vägen till 20!' },
    'add-and-subtract-within-20': { title: 'Plus och minus upp till 20', years: ['arskurs-1', 'arskurs-2'],
      desc: 'Blandade uppgifter med tal upp till 20', how: 'Räkna ut varje uppgift.',
      tip: 'Över tiotalet räknar du i två steg: 8 + 5 = 8 + 2 + 3 = 13. Minus går likadant: 13 − 5 = 13 − 3 − 2 = 8.' },
    'column-addition': { title: 'Addition med uppställning', years: ['arskurs-3', 'arskurs-4'],
      desc: 'Tresiffriga tal, med minnessiffra', how: 'Räkna med uppställning. Börja med entalen!',
      tip: 'Blir det 10 eller mer i en kolumn skriver du bara entalen. Tiotalet skriver du som en liten minnessiffra ovanför nästa kolumn.' },
    'column-subtraction': { title: 'Subtraktion med uppställning', years: ['arskurs-3', 'arskurs-4'],
      desc: 'Tresiffriga tal, med växling', how: 'Räkna med uppställning. Börja med entalen!',
      tip: 'Kontrollera med addition: om 532 − 178 = 354 stämmer, ska 354 + 178 bli 532.' },
    // Multiplikation och division
    'times-tables-2-5-10': { title: '2:ans, 5:ans och 10:ans tabell', years: ['arskurs-2', 'arskurs-3'],
      desc: 'Blandade uppgifter, med extrautmaningar upp till 12',
      how: 'Räkna ut varje uppgift. Uppgifter med 11 eller 12 är extrautmaningar: 5 · 11 är 5 · 10 och en femma till.',
      tip: 'I 10:ans tabell slutar alla svar på 0, och i 5:ans tabell slutar de på 0 eller 5.' },
    'times-tables-3-4-8': { title: '3:ans, 4:ans och 8:ans tabell', years: ['arskurs-3', 'arskurs-4'],
      desc: 'Blandade uppgifter, med extrautmaningar upp till 12',
      how: 'Räkna ut varje uppgift. Uppgifter med 11 eller 12 är extrautmaningar: 4 · 12 är 4 · 10 och 4 · 2.',
      tip: '8:ans tabell är dubbelt så mycket som 4:ans. Om 4 · 6 = 24, så är 8 · 6 = 48.' },
    'division-facts': { title: 'Division med tabellerna', years: ['arskurs-3', 'arskurs-4'],
      desc: 'Använd multiplikationstabellen när du dividerar',
      how: 'Räkna ut varje uppgift. 42/6 läses ”42 delat med 6”. Går en uppgift utanför tabellerna, som 84/12, är den en extrautmaning.',
      tip: 'Division är motsatsen till multiplikation. Vid 42/6 frågar du dig: 6 gånger vad blir 42?' },
    'short-multiplication': { title: 'Multiplikation med uppställning', years: ['arskurs-4', 'arskurs-5'],
      desc: 'Tresiffriga tal gånger ensiffriga', how: 'Räkna med uppställning.',
      tip: 'Börja med entalen. Blir det 10 eller mer skriver du entalen och sätter tiotalen som minnessiffra. Lägg till minnessiffran när du har multiplicerat nästa siffra.' },
    // Bråk
    'what-fraction-is-shaded': { title: 'Hur stor del är färgad?', years: ['arskurs-2', 'arskurs-3'],
      desc: 'Halvor, tredjedelar, fjärdedelar och fler', how: 'Skriv som ett bråk hur stor del av varje figur som är färgad.',
      tip: 'Räkna först alla lika stora delar: det är nämnaren, talet under bråkstrecket. Räkna sedan de färgade delarna: det är täljaren, talet ovanför.' },
    'fractions-of-amounts': { title: 'Bråkdel av ett antal', years: ['arskurs-3', 'arskurs-4'],
      desc: 'Till exempel ½ av 12 och ¾ av 20', how: 'Räkna ut varje uppgift.',
      tip: 'Dela med nämnaren och multiplicera sedan med täljaren. För ¾ av 20: 20/4 = 5 och 5 · 3 = 15.' },
    'equivalent-fractions': { title: 'Förlänga bråk', years: ['arskurs-5', 'arskurs-6'],
      desc: 'Likvärdiga bråk: hitta talet som fattas', how: 'Skriv talet som fattas, så att bråken blir lika stora.',
      tip: 'Det du gör med nämnaren gör du också med täljaren. ½ = ⁴⁄₈, eftersom båda talen har multiplicerats med 4.' },
    // Decimaltal och procent
    'tenths-and-hundredths': { title: 'Tiondelar och hundradelar', years: ['arskurs-4', 'arskurs-5'],
      desc: 'Skriv bråk som decimaltal', how: 'Skriv varje bråk som ett decimaltal.',
      tip: 'Tiondelarna står på första platsen efter decimaltecknet, hundradelarna på andra. ⁷⁄₁₀₀ är 0,07.' },
    'percentages-of-amounts': { title: 'Procent av ett tal', years: ['arskurs-5', 'arskurs-6'],
      desc: `10${NBSP}%, 25${NBSP}%, 50${NBSP}% och fler`, how: 'Räkna ut varje uppgift.',
      tip: `10${NBSP}% får du genom att dela med 10. Bygg sedan vidare: 30${NBSP}% är tre gånger 10${NBSP}%, och 5${NBSP}% är hälften av 10${NBSP}%.` },
    // Klockan och tid
    'time-oclock-and-half-past': { title: 'Hel och halv timme', years: ['arskurs-1'],
      desc: 'Läs av klockorna', how: 'Skriv vad klockan är på varje urtavla.',
      tip: 'Den korta visaren visar timmen. Pekar den långa visaren på 12 är det hel timme. Pekar den på 6 är det halv: halv fyra är en halvtimme före fyra.' },
    'time-quarter-past-and-to': { title: 'Kvart över och kvart i', years: ['arskurs-2'],
      desc: 'Läs av klockorna', how: 'Skriv med ord vad klockan är på varje urtavla.',
      tip: 'Kvart över: den långa visaren pekar på 3. Kvart i: den pekar på 9, och den korta visaren är nästan framme vid nästa timme.' },
    'time-to-5-minutes': { title: 'Klockan på 5 minuter när', years: ['arskurs-2', 'arskurs-3'],
      desc: 'Läs av klockorna',
      how: 'Skriv varje klockslag med ord och med siffror. Varje tid finns två gånger per dygn: skriv båda, till exempel 3.35 eller 15.35.',
      tip: 'Räkna med steg på 5 när den långa visaren går runt: från en siffra till nästa är det 5 minuter. Vid 25 och 35 minuter över utgår du från halv: 3.25 är fem i halv fyra och 3.35 fem över halv fyra.' },
    // Pengar
    'counting-coins': { title: 'Räkna mynt', years: ['arskurs-1', 'arskurs-2'],
      desc: 'Lägg ihop svenska mynt', how: 'Hur mycket pengar finns i varje plånbok? Skriv summan.',
      tip: 'Börja med myntet som är värt mest och räkna vidare: 10 kr, 15 kr, 17 kr, 18 kr… Se upp: 10-kronan är mindre än 5-kronan!' },
    'giving-change': { title: 'Hur mycket får du tillbaka?', years: ['arskurs-2', 'arskurs-3'],
      desc: 'Betala med 20 kr, 50 kr och 100 kr', how: 'Räkna ut hur mycket du får tillbaka vid varje köp.',
      tip: 'Räkna uppåt från priset till det du betalade med. Från 35 kr till 50 kr: 5 kr till 40 kr och 10 kr till 50 kr. Du får tillbaka 15 kr.' },
    // Mätning och enheter
    'perimeter-and-area': { title: 'Omkrets och area', years: ['arskurs-4', 'arskurs-5'],
      desc: 'Rektanglar på rutat papper', how: 'Varje ruta är 1 cm lång och 1 cm bred. Räkna ut omkretsen och arean för varje rektangel.',
      tip: 'Omkretsen är sträckan runt hela figuren: lägg ihop alla sidor. Arean är antalet rutor inuti.' },
    // Geometri och former
    '2d-shapes': { title: 'Former', years: ['arskurs-1', 'arskurs-2'],
      desc: 'Namn, sidor och hörn', how: 'Skriv namnet på varje form och räkna dess sidor och hörn.',
      tip: 'Sätt en liten prick i varje hörn när du räknar, så räknar du inget hörn två gånger. Namnet kan hjälpa dig: en femhörning har 5 hörn.' },
    // Statistik och diagram
    'reading-bar-charts': { title: 'Läsa av ett stapeldiagram', years: ['arskurs-2', 'arskurs-3'],
      desc: 'Undersökning: favoritfrukt', how: 'Klass 3B har röstat om sin favoritfrukt. Använd stapeldiagrammet för att svara på frågorna.',
      tip: 'Dra fingret rakt åt sidan från toppen av stapeln till talen längs kanten. Där läser du av hur många det är.' },
    // Algebra och samband
    'missing-number-problems': { title: 'Vilket tal fattas?', years: ['arskurs-3', 'arskurs-4', 'arskurs-5'],
      desc: 'Hitta talet i rutan', how: 'Hitta talet som fattas i varje likhet.',
      tip: 'Använd den omvända räkneoperationen. Vid ▢ + 7 = 15 räknar du 15 − 7. Vid 3 · ▢ = 24 räknar du 24/3.' },
  },
};
