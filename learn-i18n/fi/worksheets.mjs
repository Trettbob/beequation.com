// Finland (fi): the printable worksheets' words, formats and pictures, and which sheets Finland uses.
// Read by tools/make-worksheets.mjs --lang fi (see learn-i18n/README.md). Facts follow learn-i18n/fi/BRIEF.md:
// decimal comma, a no-break space for thousands from five digits (four-digit numbers unspaced: 2500), the raised
// dot · for multiplication and the colon : for division (never ÷), euros and cents ("snt"), times written with a
// full stop (15.30), clock phrases as children learn them ("puoli neljä" = 3.30, "varttia vaille neljä" = 3.45),
// tables 1 to 10, coins 5 snt to 2 € (1 and 2 cent coins are rarely seen in Finland).
//
// Left out (they don't fit Finnish schools):
// - multiplication-check-practice: England's timed national check; Finland has no tables test.
// - multiplication-grid: a 12 × 12 grid; Finnish tables ("kertotaulut") go to 10 · 10.
// The times-table, division and missing-number sheets ask up to 12; on the Finnish sheets the 11 and 12 questions are
// named as extra challenges ("lisähaaste"), solved through the ten (5 · 12 = 5 · 10 + 5 · 2).

const NBSP = ' ';
// hours in the nominative, as in "kello on kolme", "varttia yli kolme", "puoli neljä"
const HOURS = ['', 'yksi', 'kaksi', 'kolme', 'neljä', 'viisi', 'kuusi', 'seitsemän', 'kahdeksan', 'yhdeksän', 'kymmenen', 'yksitoista', 'kaksitoista'];
// minutes in the partitive, as in "viittä yli", "kahtakymmentä vaille"
const MIN = { 5: 'viittä', 10: 'kymmentä', 15: 'varttia', 20: 'kahtakymmentä' };

// The clock phrase children learn in Finnish schools, h = 1 to 12 on a dial. Half past three is "puoli neljä"
// (half towards four); :25 and :35 go through the half hour ("viittä vaille puoli neljä", "viittä yli puoli neljä").
function timeWords(h, m) {
  const hh = h % 12 || 12, next = hh % 12 + 1;
  const now = HOURS[hh], then = HOURS[next];
  if (m === 0) return `tasan ${now}`;
  if (m === 30) return `puoli ${then}`;
  if (m === 25) return `viittä vaille puoli ${then}`;
  if (m === 35) return `viittä yli puoli ${then}`;
  if (m < 30) return `${MIN[m]} yli ${now}`;
  return `${MIN[60 - m]} vaille ${then}`;
}

// A dial time happens twice a day; Finnish schools write times with a full stop and use the 24-hour clock:
// 3.35 tai 15.35 (12.05 tai 0.05).
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  return `${hh}.${mm} tai ${hh === 12 ? 0 : hh + 12}.${mm}`;
}

// Whole numbers: groups of three with a no-break space from 10 000 on; four-digit numbers stay together (2500).
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : s;
  return n < 0 ? `−${g}` : g;
};

// Amounts in cents: under 1 € in cents ("65 snt", as on the coins), whole euros "2 €", otherwise "3,45 €".
const money = c => (c < 100 ? `${c}${NBSP}snt` : c % 100 === 0 ? `${num(c / 100)}${NBSP}€`
  : `${num(Math.floor(c / 100))},${String(c % 100).padStart(2, '0')}${NBSP}€`);

const PLACE = { 10: 'Kymmeniin', 100: 'Satoihin', 1000: 'Tuhansiin' };
const cap = s => s[0].toUpperCase() + s.slice(1);

const COPPER = '#D9895B';   // 1, 2 and 5 cents
const GOLD = '#E5C25A';     // Nordic gold: 10, 20 and 50 cents
const BRASS = '#F2C14E';    // the gold-coloured part of the 1 € and 2 € coins
const SILVER = '#D7DCE3';   // the silver-coloured part of the 1 € and 2 € coins

export default {
  htmlLang: 'fi',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '·', div: ':',
  tensOnes: b => `${b} kymmentä ja ${b} ykköstä`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'kymmen' : 'kymmentä'} ja ${o} ${o === 1 ? 'ykkönen' : 'ykköstä'}`,
  roundQ: (n, to, b) => `${PLACE[String(to).replace(/\D/g, '')] || to}: <b class="n">${n}</b> ≈ ${b}`,
  of: (f, x) => `${f} luvusta ${x}`,
  pctOf: (p, x) => `${p}${NBSP}% luvusta ${x}`,

  timeWords, digital,

  money,
  coinValues: [5, 10, 20, 50, 100, 200],
  coinLabel: v => (v >= 100 ? `${v / 100} €` : `${v} snt`),
  // euro coins: colour of the outer part and real diameter in mm
  coins: { 1: [COPPER, 16.25, 'circle'], 2: [COPPER, 18.75, 'circle'], 5: [COPPER, 21.25, 'circle'],
    10: [GOLD, 19.75, 'circle'], 20: [GOLD, 22.25, 'circle'], 50: [GOLD, 24.25, 'circle'],
    100: [BRASS, 23.25, 'circle'], 200: [SILVER, 25.75, 'circle'] },
  // 1 €: gold-coloured ring, silver-coloured centre; 2 €: silver-coloured ring, gold-coloured centre
  coinInner: v => (v === 100 ? SILVER : v === 200 ? BRASS : null),
  paid: [100, 200, 500], costStep: 5,
  // singular nominatives: the item starts the sentence ("Korvapuusti maksaa 1,35 €")
  shopItems: ['kynä', 'pulla', 'sarjakuvalehti', 'mehu', 'vihko', 'karkkipussi', 'korvapuusti', 'jäätelö'],
  changeQ: (item, cost, paid, b) => `${cap(item)} maksaa ${cost}, ja annat ${paid}. Saat takaisin ${b}`,

  perimQ: b => `<div class="ansline">Piiri ${b} cm</div><div class="ansline">Pinta-ala ${b} cm²</div>`,
  perimA: (p, a) => `piiri ${p} cm, pinta-ala ${a} cm²`,
  shapes: { 3: 'kolmio', 4: 'neliö', rect: 'suorakulmio', 5: 'viisikulmio', 6: 'kuusikulmio', 8: 'kahdeksankulmio', 0: 'ympyrä', 7: 'seitsemänkulmio', 10: 'kymmenkulmio' },
  shapeQ: b => `<div class="ansline wide">Nimi:</div><div class="ansline">Sivuja ${b} Kärkiä ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'ympyrä: ei suoria sivuja eikä kärkiä' : `${name}: ${n} sivua, ${n} kärkeä`),

  // plural nominatives, so every question can use them as they are ("banaanit saivat")
  fruits: ['Omenat', 'Banaanit', 'Rypäleet', 'Appelsiinit', 'Päärynät'],
  chartQs: (f, v, mx, mn) => [
    [`Montako ääntä ${f[1].toLowerCase()} saivat?`, v[1]],
    ['Mikä hedelmä sai eniten ääniä?', f[mx]],
    ['Mikä hedelmä sai vähiten ääniä?', f[mn]],
    [`Montako ääntä enemmän ${f[mx].toLowerCase()} saivat kuin ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Montako lasta äänesti yhteensä?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { esiopetus: 'Esiopetus', '1-luokka': '1. luokka', '2-luokka': '2. luokka', '3-luokka': '3. luokka',
    '4-luokka': '4. luokka', '5-luokka': '5. luokka', '6-luokka': '6. luokka' },
  // "2. luokka", "1. ja 2. luokka", "4.–6. luokka", "Esiopetus ja 1. luokka"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const nums = ys.filter(y => y !== 'esiopetus').map(y => y.split('-')[0]);
    const grades = nums.length === 1 ? `${nums[0]}. luokka`
      : nums.length === 2 ? `${nums[0]}. ja ${nums[1]}. luokka` : `${nums[0]}.–${nums[nums.length - 1]}. luokka`;
    return ys.includes('esiopetus') ? `Esiopetus ja ${grades}` : grades;
  },
  name: 'Nimi', date: 'Päivämäärä', tip: 'Indien vinkki:', answers: 'Vastaukset',
  titleTag: t => `${t} – tehtävämoniste – Beequation Kids`,
  footer: 'Saa kopioida vapaasti kotiin ja luokkaan. Lisää tehtävämonisteita: <b>fi.beequation.com/learn</b>',
  promo: '<b>Harjoittele Indien kanssa.</b> Pelaa ilmaisia kennopulmia osoitteessa fi.beequation.com tai etsi Beequation Kids puhelimeesi tai tablettiisi: ei mainoksia, ei tietojen keruuta eikä ajanottoa.',

  sheets: {
    // luvut ja kymmenjärjestelmä
    'missing-numbers-to-100': { title: 'Lukujonot 100:aan asti', years: ['1-luokka', '2-luokka'],
      desc: 'Yhden, kahden, viiden ja kymmenen välein', how: 'Täydennä lukujonoista puuttuvat luvut.',
      tip: 'Sano luvut ääneen, kun lasket. Korvasi huomaa, jos jokin hyppy on väärän kokoinen.' },
    'tens-and-ones': { title: 'Kymmenet ja ykköset', years: ['1-luokka', '2-luokka'],
      desc: 'Kaksinumeroiset luvut osiin', how: 'Kirjoita, montako kymmentä ja montako ykköstä luvussa on.',
      tip: 'Vasemmanpuoleinen numero kertoo kymmenet ja oikeanpuoleinen ykköset. Luvussa 47 on 4 kymmentä ja 7 ykköstä.' },
    'hundreds-tens-ones': { title: 'Sadat, kymmenet ja ykköset', years: ['3-luokka'],
      desc: 'Kymmenjärjestelmä lukualueella 0–1000', how: 'Kirjoita jokainen luku muodossa sadat + kymmenet + ykköset.',
      tip: 'Nolla pitää paikkaa. Luvussa 405 ei ole yhtään kymmentä, mutta nollan ansiosta 4 pysyy satojen paikalla.' },
    'rounding': { title: 'Pyöristäminen', years: ['4-luokka', '5-luokka'],
      desc: 'Kymmeniin, satoihin ja tuhansiin', how: 'Pyöristä jokainen luku niin kuin on merkitty. Merkki ≈ tarkoittaa ”on likimain”.',
      tip: 'Katso numeroa, joka on heti pyöristettävän paikan oikealla puolella. Jos se on 0, 1, 2, 3 tai 4, pyöristä alaspäin. Jos se on 5, 6, 7, 8 tai 9, pyöristä ylöspäin.' },
    // yhteen- ja vähennyslasku
    'number-bonds-to-10': { title: 'Kymppiparit', years: ['esiopetus', '1-luokka'],
      desc: 'Mitkä kaksi lukua tekevät yhdessä 10?', how: 'Kirjoita puuttuva luku, niin että yhteensä tulee 10. Sormet ja napit saavat auttaa.',
      tip: 'Nosta ylös 7 sormea. Montako sormea on vielä alhaalla? Ne ovat seitsemän kymppipari: 7 + 3 = 10.' },
    'number-bonds-to-20': { title: 'Luvun 20 hajotelmat', years: ['1-luokka'],
      desc: 'Lukuparit, joiden summa on 20', how: 'Etsi puuttuvat luvut. Jokaisessa tehtävässä on mukana luku 20.',
      tip: 'Kun tiedät, että 3 + 7 = 10, tiedät myös, että 13 + 7 = 20. Kymppiparit auttavat 20:een asti.' },
    'add-and-subtract-within-20': { title: 'Plus- ja miinuslaskut 20:een asti', years: ['1-luokka', '2-luokka'],
      desc: 'Sekaisin yhteen- ja vähennyslaskuja lukualueella 0–20', how: 'Laske jokainen lasku.',
      tip: 'Kun lasket kymmenen yli, laske kahdessa osassa: 8 + 5 = 8 + 2 + 3 = 13. Vähennyslaskussa samoin: 13 − 5 = 13 − 3 − 2 = 8.' },
    'column-addition': { title: 'Yhteenlasku allekkain', years: ['3-luokka', '4-luokka'],
      desc: 'Kolminumeroiset luvut, muistinumeron kanssa', how: 'Laske allekkain. Aloita ykkösistä.',
      tip: 'Jos sarakkeen summa on 10 tai enemmän, kirjoita ykköset alle ja merkitse 1 muistiin pienellä seuraavan sarakkeen yläpuolelle.' },
    'column-subtraction': { title: 'Vähennyslasku allekkain', years: ['3-luokka', '4-luokka'],
      desc: 'Kolminumeroiset luvut, lainaamisen kanssa', how: 'Laske allekkain. Aloita ykkösistä. Jos ylempi numero on pienempi, lainaa kymppi viereisestä sarakkeesta.',
      tip: 'Tarkista vähennyslasku yhteenlaskulla: jos 532 − 178 = 354, niin 354 + 178 on 532.' },
    // kerto- ja jakolasku
    'times-tables-2-5-10': { title: 'Kertotaulut 2, 5 ja 10', years: ['2-luokka'],
      desc: 'Kertolaskuja sekaisin', how: 'Laske jokainen kertolasku. Laskut, joissa on 11 tai 12, ovat lisähaasteita: 5 · 11 on 5 · 10 ja vielä yksi 5.',
      tip: 'Kymmenen kertotaulun vastaukset loppuvat aina nollaan, viiden kertotaulun vastaukset nollaan tai viiteen.' },
    'times-tables-3-4-8': { title: 'Kertotaulut 3, 4 ja 8', years: ['2-luokka', '3-luokka'],
      desc: 'Kertolaskuja sekaisin', how: 'Laske jokainen kertolasku. Laskut, joissa on 11 tai 12, ovat lisähaasteita: 4 · 11 on 4 · 10 ja vielä yksi 4.',
      tip: 'Kahdeksan kertotaulu on neljän kertotaulu tuplana. Jos 4 · 6 = 24, niin 8 · 6 = 48.' },
    'division-facts': { title: 'Jakolaskut kertotauluilla', years: ['3-luokka', '4-luokka'],
      desc: 'Jaa kertotaulujen avulla', how: 'Laske jokainen jakolasku. Osa menee kertotaulujen 1–10 yli, kuten 88 : 11. Ne ovat lisähaasteita.',
      tip: 'Jakolasku on kertolaskun käänteinen laskutoimitus. Laskussa 42 : 6 kysy: 6 kertaa mikä on 42?' },
    'short-multiplication': { title: 'Kertolasku allekkain', years: ['3-luokka', '4-luokka'],
      desc: 'Kolminumeroinen luku kerrotaan yksinumeroisella', how: 'Laske allekkain. Aloita ykkösistä.',
      tip: 'Kerro ensin ykköset. Jos tulee 10 tai enemmän, kirjoita ykköset alle ja kymmenet muistiin. Lisää muistinumero, kun olet kertonut seuraavan numeron.' },
    // murtoluvut
    'what-fraction-is-shaded': { title: 'Mikä osa on väritetty?', years: ['3-luokka', '4-luokka'],
      desc: 'Puolikkaat, kolmasosat, neljäsosat ja muut', how: 'Kirjoita murtolukuna, mikä osa kuviosta on väritetty.',
      tip: 'Laske ensin kaikki yhtä suuret osat: se on nimittäjä murtoviivan alle. Laske sitten väritetyt osat: se on osoittaja murtoviivan päälle.' },
    'fractions-of-amounts': { title: 'Murtoluku luvusta', years: ['4-luokka', '5-luokka'],
      desc: 'Esimerkiksi ½ luvusta 12 ja ¾ luvusta 20', how: 'Laske jokainen tehtävä.',
      tip: 'Jaa nimittäjällä ja kerro sitten osoittajalla. ¾ luvusta 20: 20 : 4 = 5 ja 5 · 3 = 15.' },
    'equivalent-fractions': { title: 'Murtolukujen laventaminen', years: ['4-luokka', '5-luokka'],
      desc: 'Samanarvoiset murtoluvut: etsi puuttuva luku', how: 'Kirjoita puuttuva luku niin, että murtoluvut ovat yhtä suuret.',
      tip: 'Kun lavennat, kerro osoittaja ja nimittäjä samalla luvulla. ½ = ⁴⁄₈, koska molemmat on kerrottu neljällä.' },
    // desimaaliluvut ja prosentit
    'tenths-and-hundredths': { title: 'Kymmenesosat ja sadasosat', years: ['3-luokka', '4-luokka'],
      desc: 'Murtoluvut desimaalilukuina', how: 'Kirjoita jokainen murtoluku desimaalilukuna.',
      tip: 'Kymmenesosat tulevat ensimmäiseksi desimaalipilkun jälkeen ja sadasosat toiseksi. ⁷⁄₁₀₀ on 0,07.' },
    'percentages-of-amounts': { title: 'Prosentti luvusta', years: ['5-luokka', '6-luokka'],
      desc: `10${NBSP}%, 25${NBSP}%, 50${NBSP}% ja muita`, how: 'Laske jokainen tehtävä.',
      tip: `10${NBSP}% saat jakamalla luvun kymmenellä. Siitä voit jatkaa: 30${NBSP}% on kolme kertaa 10${NBSP}%, ja 5${NBSP}% on puolet 10${NBSP}%:sta.` },
    // kellonajat
    'time-oclock-and-half-past': { title: 'Tasan ja puoli', years: ['1-luokka'],
      desc: 'Lue kellonajat', how: 'Kirjoita sanoin, mitä kukin kello on.',
      tip: 'Lyhyt viisari näyttää tunnit, pitkä minuutit. Kun pitkä viisari osoittaa lukua 12, kello on tasan. Kun se osoittaa lukua 6, kello on puoli: puoli neljä on puoli tuntia ennen neljää.' },
    'time-quarter-past-and-to': { title: 'Varttia yli ja varttia vaille', years: ['2-luokka'],
      desc: 'Lue kellonajat', how: 'Kirjoita sanoin, mitä kukin kello on.',
      tip: 'Varttia yli: pitkä viisari osoittaa lukua 3. Varttia vaille: se osoittaa lukua 9, ja lyhyt viisari on jo melkein seuraavan tunnin kohdalla.' },
    'time-to-5-minutes': { title: 'Kellonajat viiden minuutin välein', years: ['2-luokka', '3-luokka'],
      desc: 'Lue kellonajat', how: 'Kirjoita jokainen kellonaika sanoin ja numeroin. Sama aika on kellossa kahdesti vuorokaudessa, joten kirjoita molemmat, esimerkiksi 3.35 ja 15.35.',
      tip: 'Laske viiden välein: jokainen kellotaulun numero on 5 minuuttia lisää. Kun pitkä viisari on ohittanut puolen, ajattele seuraavaa tuntia: 3.50 on kymmentä vaille neljä.' },
    // raha
    'counting-coins': { title: 'Kolikoiden laskeminen', years: ['2-luokka', '3-luokka'],
      desc: 'Laske euro- ja senttikolikot yhteen', how: 'Paljonko rahaa kussakin kukkarossa on? Kirjoita summa.',
      tip: 'Aloita arvokkaimmasta kolikosta ja jatka siitä: 50 snt, 70 snt, 80 snt, 85 snt… 100 senttiä on 1 euro.' },
    'giving-change': { title: 'Paljonko saat takaisin?', years: ['3-luokka', '4-luokka'],
      desc: 'Vaihtoraha, kun maksat 1, 2 tai 5 euroa', how: 'Laske jokaisesta ostoksesta vaihtoraha eli se, minkä saat takaisin.',
      tip: 'Laske hinnasta ylöspäin siihen summaan, jonka annoit. 65 sentistä 1 euroon: 5 snt lisää on 70 snt, ja 30 snt lisää on 1 €. Saat takaisin 35 snt.' },
    // mittaaminen
    'perimeter-and-area': { title: 'Piiri ja pinta-ala', years: ['4-luokka', '5-luokka'],
      desc: 'Suorakulmiot senttiruudukossa', how: 'Jokainen ruutu kuvaa neliötä, jonka sivu on 1 cm. Laske jokaisen suorakulmion piiri ja pinta-ala.',
      tip: 'Piiri on matka kuvion ympäri: laske kaikki sivut yhteen. Pinta-ala kertoo, montako ruutua kuvion sisällä on.' },
    // geometria
    '2d-shapes': { title: 'Tasokuviot', years: ['1-luokka', '2-luokka'],
      desc: 'Nimet, sivut ja kärjet', how: 'Kirjoita jokaisen kuvion nimi ja laske sen sivut ja kärjet (kulmat).',
      tip: 'Merkitse jokainen kärki pienellä pisteellä, kun lasket. Silloin et laske samaa kärkeä kahdesti. Nimikin auttaa: kuusikulmiossa on kuusi kulmaa.' },
    // tilastot ja diagrammit
    'reading-bar-charts': { title: 'Pylväsdiagrammin lukeminen', years: ['2-luokka', '3-luokka'],
      desc: 'Kysely lempihedelmistä', how: 'Luokan 3A oppilaat äänestivät lempihedelmäänsä. Katso pylväsdiagrammia ja vastaa kysymyksiin.',
      tip: 'Vie sormi pylvään yläreunasta suoraan sivulle lukuihin. Siitä näet, montako ääntä pylväs kuvaa.' },
    // algebra ja yhtälöt
    'missing-number-problems': { title: 'Puuttuva luku', years: ['4-luokka', '5-luokka', '6-luokka'],
      desc: 'Mikä luku tulee ruutuun?', how: 'Etsi jokaisesta yhtälöstä puuttuva luku.',
      tip: 'Käytä käänteistä laskutoimitusta. Yhtälössä ▢ + 7 = 15 laske 15 − 7. Yhtälössä 3 · ▢ = 24 laske 24 : 3.' },
  },
};
