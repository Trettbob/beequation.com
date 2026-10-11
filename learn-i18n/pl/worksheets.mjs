// Poland (pl): the printable worksheets' words, formats and pictures, and which sheets Poland uses.
// Read by tools/make-worksheets.mjs --lang pl (see learn-i18n/README.md). Facts follow learn-i18n/pl/BRIEF.md:
// "·" for multiplication and ":" for division (sections 5 and 10), decimal comma, a space for thousands only from
// 10 000 up, "25%" without a space, złoty and grosze with the real NBP coin colours and diameters (section 6),
// clock phrases as children learn them: "trzecia", "kwadrans po trzeciej", "wpół do czwartej" (names the NEXT hour),
// "za kwadrans czwarta" (section 7), and the year split of section 2.
//
// Left out (they don't fit Polish schools):
// - multiplication-check-practice: England's timed national check; Poland has no tables test in any year.
// - multiplication-grid: a 12 × 12 grid; the Polish "tabliczka mnożenia" goes to 10 · 10 ("w zakresie 100"), and the
//   "duża tabliczka" (11–20) is an optional extra.
// The times-table and division sheets ask up to 12; on the Polish sheets the 11 and 12 questions are named as extra
// questions ("zadania dodatkowe") and solved from the tens: 5 · 12 = 5 · 10 + 5 · 2.

const NBSP = ' ';

// hours on a dial are ordinal and feminine: "trzecia" (nominative), "po trzeciej" / "wpół do trzeciej" (locative and
// genitive have the same form here)
const NOM = ['dwunasta', 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta', 'siódma', 'ósma', 'dziewiąta', 'dziesiąta', 'jedenasta', 'dwunasta'];
const LOC = ['dwunastej', 'pierwszej', 'drugiej', 'trzeciej', 'czwartej', 'piątej', 'szóstej', 'siódmej', 'ósmej', 'dziewiątej', 'dziesiątej', 'jedenastej', 'dwunastej'];
const MIN = { 5: 'pięć', 10: 'dziesięć', 20: 'dwadzieścia', 25: 'dwadzieścia pięć' };

// The phrase children learn for a dial time (h 1 to 12, m in steps of 5):
// 3:00 "trzecia", 3:10 "dziesięć po trzeciej", 3:15 "kwadrans po trzeciej", 3:30 "wpół do czwartej",
// 3:40 "za dwadzieścia czwarta", 3:45 "za kwadrans czwarta", 3:55 "za pięć czwarta".
function timeWords(h, m) {
  const hh = h % 12 || 12, next = hh % 12 + 1;
  if (m === 0) return NOM[hh];
  if (m === 15) return `kwadrans po ${LOC[hh]}`;
  if (m === 30) return `wpół do ${LOC[next]}`;
  if (m === 45) return `za kwadrans ${NOM[next]}`;
  if (m < 30) return `${MIN[m] || `${m} minut`} po ${LOC[hh]}`;
  return `za ${MIN[60 - m] || `${60 - m} minut`} ${NOM[next]}`;
}

// A dial time happens twice in a "doba", and 24-hour time is everyday Polish: "3:35 lub 15:35" (12:05 → "12:05 lub 0:05").
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  return `${hh}:${mm} lub ${hh === 12 ? 0 : hh + 12}:${mm}`;
}

// Whole numbers: four digits stay together (2500, 4562), a no-break space from five digits up (10 000, 25 000).
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : s;
  return n < 0 ? `−${g}` : g;
};

// Amounts in grosze: under 1 zł in grosze ("65 gr"), whole złoty "2 zł", otherwise with the comma "3,45 zł".
// Never mixed ("0,45 gr"), as topics/money.html explains.
const money = g => g < 100 ? `${g}${NBSP}gr` : g % 100 === 0 ? `${num(g / 100)}${NBSP}zł`
  : `${num(Math.floor(g / 100))},${String(g % 100).padStart(2, '0')}${NBSP}zł`;

// "3 boki", "5 boków": 2–4 (and 22–24 …) take the nominative plural, the rest the genitive plural
const few = n => n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);

const PLACE = { 10: 'dziesiątek', 100: 'setek', 1000: 'tysięcy' };
const BRASS = '#C9A23F';    // 1, 2 and 5 gr (brass-plated steel), the ring of 2 zł and the centre of 5 zł
const SILVER = '#C8CCD0';   // 10, 20, 50 gr and 1 zł, the centre of 2 zł and the ring of 5 zł

export default {
  htmlLang: 'pl',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '·', div: ':',
  // "47 = ▢ d + ▢ j" (the how line explains d and j); answers in words with the right case
  tensOnes: b => `${b} d + ${b} j`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'dziesiątka' : few(t) ? 'dziesiątki' : 'dziesiątek'} i ${o} ${o === 1 ? 'jedność' : 'jedności'}`,
  // "Do setek: 4567 ≈ ▢"
  roundQ: (n, to, b) => `Do ${PLACE[String(to).replace(/\D/g, '')]}: <b class="n">${n}</b> ≈ ${b}`,
  of: (f, x) => `${f} liczby ${x}`,
  pctOf: (p, x) => `${p}% liczby ${x}`,
  timeWords, digital,

  money,
  coinValues: [1, 2, 5, 10, 20, 50],
  // the unit is set smaller than the number, as on the coins themselves, so "10 gr" fits on the 16,5 mm coin
  coinLabel: v => v >= 100 ? `${v / 100}<tspan font-size="4.4">${NBSP}zł</tspan>` : `${v}<tspan font-size="4.4">${NBSP}gr</tspan>`,
  // NBP coins: colour of the outer part and real diameter in mm (all round). Note 10 gr is smaller than 5 gr,
  // and 2 zł smaller than 1 zł: size doesn't show value.
  coins: { 1: [BRASS, 15.5, 'circle'], 2: [BRASS, 17.5, 'circle'], 5: [BRASS, 19.5, 'circle'],
    10: [SILVER, 16.5, 'circle'], 20: [SILVER, 18.5, 'circle'], 50: [SILVER, 20.5, 'circle'],
    100: [SILVER, 23, 'circle'], 200: [BRASS, 21.5, 'circle'], 500: [SILVER, 24, 'circle'] },
  // 2 zł: gold-coloured ring, silver centre; 5 zł: silver ring, gold-coloured centre
  coinInner: v => v === 200 ? SILVER : v === 500 ? BRASS : null,
  // paid with a 1, 2 or 5 zł coin or a 10 zł note; prices go up in 5 gr steps
  paid: [100, 200, 500, 1000], costStep: 5,
  // accusative after "Kupujesz …"; mostly things whose price depends on how many you buy
  shopItems: ['ołówek', 'mandarynki', 'bułki', 'cukierki', 'naklejki', 'jabłka', 'lizaki', 'drożdżówki'],
  changeQ: (item, cost, paid, b) => `Kupujesz ${item} za ${cost} i płacisz ${paid}. Reszta: ${b}`,

  perimQ: b => `<div class="ansline">Obwód ${b} cm</div><div class="ansline">Pole ${b} cm²</div>`,
  perimA: (p, a) => `obwód ${p} cm, pole ${a} cm²`,
  // Polish names count the angles ("-kąt"); "koło" is the filled disc drawn on the sheet
  shapes: { 3: 'trójkąt', 4: 'kwadrat', rect: 'prostokąt', 5: 'pięciokąt', 6: 'sześciokąt', 8: 'ośmiokąt', 0: 'koło', 7: 'siedmiokąt', 10: 'dziesięciokąt' },
  shapeQ: b => `<div class="ansline wide">Nazwa:</div><div class="ansline">Boki ${b} Wierzchołki ${b}</div>`,
  shapeA: (name, n) => n === 0 ? 'koło: nie ma boków ani wierzchołków'
    : `${name}: ${n} ${few(n) ? 'boki' : 'boków'}, ${n} ${few(n) ? 'wierzchołki' : 'wierzchołków'}`,

  // plural nouns whose accusative is the same as the nominative ("Ile dzieci wybrało banany?")
  fruits: ['Jabłka', 'Banany', 'Winogrona', 'Pomarańcze', 'Gruszki'],
  chartQs: (f, v, mx, mn) => [
    [`Ile dzieci wybrało ${f[1].toLowerCase()}?`, v[1]],
    ['Które owoce wybrało najwięcej dzieci?', f[mx]],
    ['Które owoce wybrało najmniej dzieci?', f[mn]],
    [`O ile więcej dzieci wybrało ${f[mx].toLowerCase()} niż ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Ile dzieci głosowało łącznie?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { zerowka: 'Zerówka', 'klasa-1': 'Klasa 1', 'klasa-2': 'Klasa 2', 'klasa-3': 'Klasa 3', 'klasa-4': 'Klasa 4', 'klasa-5': 'Klasa 5', 'klasa-6': 'Klasa 6' },
  // "Klasa 2", "Klasy 2 i 3", "Klasy 3–5", "Zerówka i klasa 1"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const k = ys.filter(y => y.startsWith('klasa-')).map(y => y.slice(6));
    const klasy = k.length === 1 ? `klasa ${k[0]}` : k.length === 2 ? `klasy ${k[0]} i ${k[1]}` : `klasy ${k[0]}–${k[k.length - 1]}`;
    if (ys.includes('zerowka')) return k.length ? `Zerówka i ${klasy}` : n.zerowka;
    return klasy.charAt(0).toUpperCase() + klasy.slice(1);
  },
  name: 'Imię i nazwisko', date: 'Data', tip: 'Wskazówka Indie:', answers: 'Odpowiedzi',
  titleTag: t => `${t}: karta pracy Beequation Kids`,
  footer: 'Możesz ją bezpłatnie kopiować do domu i do szkoły. Więcej kart pracy na <b>pl.beequation.com/learn</b>',
  promo: '<b>Poćwiczcie z Indie.</b> Darmowe łamigłówki z liczbami w plastrach miodu czekają na pl.beequation.com, a na telefon i tablet jest aplikacja Beequation Kids: bez reklam, bez zbierania danych i bez stopera.',

  sheets: {
    // liczenie i system dziesiątkowy
    'missing-numbers-to-100': { title: 'Brakujące liczby do 100', years: ['klasa-1', 'klasa-2'],
      desc: 'Liczenie co 1, co 2, co 5 i co 10', how: 'Wpisz brakujące liczby w każdym rzędzie.',
      tip: 'Mów liczby na głos, kiedy liczysz. Twoje uszy szybko wychwycą skok, który nie pasuje!' },
    'tens-and-ones': { title: 'Dziesiątki i jedności', years: ['klasa-2'],
      desc: 'Rozkład liczb dwucyfrowych', how: 'Rozłóż każdą liczbę na dziesiątki (d) i jedności (j).',
      tip: 'Cyfra z lewej strony mówi, ile jest dziesiątek. 47 to 4 dziesiątki i 7 jedności.' },
    'hundreds-tens-ones': { title: 'Setki, dziesiątki i jedności', years: ['klasa-3'],
      desc: 'System dziesiątkowy do 1000', how: 'Zapisz każdą liczbę jako sumę: setki + dziesiątki + jedności.',
      tip: 'Zero pilnuje miejsca. W liczbie 405 nie ma dziesiątek, ale dzięki zeru czwórka zostaje na miejscu setek.' },
    rounding: { title: 'Zaokrąglanie liczb', years: ['klasa-4', 'klasa-5'],
      desc: 'Do dziesiątek, setek i tysięcy', how: 'Zaokrąglij każdą liczbę tak, jak pokazano. Znak ≈ czytamy „w przybliżeniu”.',
      tip: 'Spójrz na cyfrę tuż na prawo od miejsca, do którego zaokrąglasz. Przy 0, 1, 2, 3 i 4 zaokrąglasz w dół, a przy 5, 6, 7, 8 i 9 w górę.' },
    // dodawanie i odejmowanie
    'number-bonds-to-10': { title: 'Rozkład liczby 10', years: ['zerowka', 'klasa-1'],
      desc: 'Pary liczb, które razem dają 10', how: 'Wpisz brakującą liczbę, żeby razem było 10.',
      tip: 'Pomóż sobie palcami! Pokaż 7 palców. Ile palców jest jeszcze schowanych? Tyle brakuje do 10.' },
    'number-bonds-to-20': { title: 'Rozkład liczby 20', years: ['klasa-1'],
      desc: 'Pary liczb, które razem dają 20', how: 'Wpisz brakujące liczby. W każdym działaniu chodzi o 20.',
      tip: 'Jeśli wiesz, że 3 + 7 = 10, to wiesz też, że 13 + 7 = 20. Rozkład liczby 10 pomaga przy liczbie 20!' },
    'add-and-subtract-within-20': { title: 'Dodawanie i odejmowanie w zakresie 20', years: ['klasa-1'],
      desc: 'Działania na przemian do 20', how: 'Oblicz wynik każdego działania.',
      tip: 'Przez dziesiątkę przechodź w dwóch krokach: 8 + 5 = 8 + 2 + 3 = 13. Przy odejmowaniu tak samo: 13 − 5 = 13 − 3 − 2 = 8.' },
    'column-addition': { title: 'Dodawanie pisemne', years: ['klasa-4'],
      desc: 'Liczby trzycyfrowe, z przenoszeniem', how: 'Dodaj sposobem pisemnym. Zacznij od jedności!',
      tip: 'Jeśli w kolumnie wyjdzie 10 lub więcej, zapisz jedności, a 1 przenieś do następnej kolumny. Zapisz ją małą cyfrą nad tą kolumną, żeby o niej nie zapomnieć.' },
    'column-subtraction': { title: 'Odejmowanie pisemne', years: ['klasa-4'],
      desc: 'Liczby trzycyfrowe, z pożyczaniem', how: 'Odejmij sposobem pisemnym. Zacznij od jedności!',
      tip: 'Zrób sprawdzenie dodawaniem: jeśli 532 − 178 = 354, to 354 + 178 musi dać 532.' },
    // mnożenie i dzielenie
    'times-tables-2-5-10': { title: 'Mnożenie przez 2, 5 i 10', years: ['klasa-2', 'klasa-3'],
      desc: 'Tabliczka mnożenia na wyrywki', how: 'Oblicz. Działania z 11 i 12 to zadania dodatkowe: 5 · 12 to 5 · 10 i jeszcze 5 · 2.',
      tip: 'Każdy wynik mnożenia przez 10 kończy się zerem, a każdy wynik mnożenia przez 5 kończy się zerem albo piątką.' },
    'times-tables-3-4-8': { title: 'Mnożenie przez 3, 4 i 8', years: ['klasa-3'],
      desc: 'Tabliczka mnożenia na wyrywki', how: 'Oblicz. Działania z 11 i 12 to zadania dodatkowe: 4 · 11 to 4 · 10 i jeszcze 4.',
      tip: 'Mnożenie przez 8 to podwojone mnożenie przez 4. Jeśli 4 · 6 = 24, to 8 · 6 = 48.' },
    'division-facts': { title: 'Dzielenie w zakresie tabliczki mnożenia', years: ['klasa-3', 'klasa-4'],
      desc: 'Dzielimy z pomocą tabliczki mnożenia', how: 'Oblicz. Działania z 11 i 12, takie jak 88 : 11, to zadania dodatkowe.',
      tip: 'Dzielenie to działanie odwrotne do mnożenia. Przy 42 : 6 zapytaj siebie: ile razy 6 daje 42?' },
    'short-multiplication': { title: 'Mnożenie pisemne', years: ['klasa-4'],
      desc: 'Liczby trzycyfrowe przez jednocyfrowe', how: 'Pomnóż sposobem pisemnym.',
      tip: 'Zacznij od jedności. Jeśli wyjdzie 10 lub więcej, zapisz jedności, a dziesiątki przenieś i dodaj je do następnego iloczynu.' },
    // ułamki zwykłe
    'what-fraction-is-shaded': { title: 'Jaka część jest zamalowana?', years: ['klasa-4'],
      desc: 'Połowy, trzecie, czwarte części i inne', how: 'Zapisz ułamkiem, jaka część każdej figury jest zamalowana.',
      tip: 'Najpierw policz wszystkie równe części: to mianownik, liczba pod kreską. Potem policz części zamalowane: to licznik, liczba nad kreską.' },
    'fractions-of-amounts': { title: 'Ułamek liczby', years: ['klasa-4', 'klasa-5'],
      desc: 'Na przykład ½ liczby 12 i ¾ liczby 20', how: 'Oblicz.',
      tip: 'Podziel przez mianownik, a potem pomnóż przez licznik. ¾ liczby 20: 20 : 4 = 5, a 5 · 3 = 15.' },
    'equivalent-fractions': { title: 'Rozszerzanie ułamków', years: ['klasa-5', 'klasa-6'],
      desc: 'Ułamki równe: znajdź brakującą liczbę', how: 'Wpisz brakującą liczbę tak, żeby oba ułamki były równe.',
      tip: 'Co robisz z mianownikiem, zrób też z licznikiem. ½ = ⁴⁄₈, bo licznik i mianownik pomnożono przez 4.' },
    // ułamki dziesiętne i procenty
    'tenths-and-hundredths': { title: 'Części dziesiąte i setne', years: ['klasa-4', 'klasa-5'],
      desc: 'Ułamki zwykłe jako ułamki dziesiętne', how: 'Zapisz każdy ułamek w postaci ułamka dziesiętnego.',
      tip: 'Części dziesiąte piszemy na pierwszym miejscu po przecinku, a części setne na drugim. ⁷⁄₁₀₀ to 0,07.' },
    'percentages-of-amounts': { title: 'Procent liczby', years: ['klasa-6'],
      desc: '10%, 25%, 50% i inne', how: 'Oblicz.',
      tip: '10% to jedna dziesiąta, więc podziel liczbę przez 10. Potem buduj dalej: 30% to trzy razy po 10%, a 5% to połowa z 10%.' },
    // zegar
    'time-oclock-and-half-past': { title: 'Pełne godziny i „wpół do”', years: ['klasa-1', 'klasa-2'],
      desc: 'Odczytaj godzinę z zegara', how: 'Zapisz słowami, która godzina jest na każdym zegarze.',
      tip: 'Krótka wskazówka pokazuje godzinę. Gdy długa stoi na 12, jest pełna godzina. Gdy stoi na 6, jest „wpół do”: wpół do czwartej to pół godziny przed czwartą.' },
    'time-quarter-past-and-to': { title: 'Kwadrans po i za kwadrans', years: ['klasa-2'],
      desc: 'Odczytaj godzinę z zegara', how: 'Zapisz słowami, która godzina jest na każdym zegarze.',
      tip: 'Kwadrans po: długa wskazówka stoi na 3. Za kwadrans: stoi na 9, a krótka jest już prawie przy następnej godzinie.' },
    'time-to-5-minutes': { title: 'Godziny co 5 minut', years: ['klasa-2', 'klasa-3'],
      desc: 'Odczytaj godzinę z zegara',
      how: 'Zapisz każdą godzinę słowami i cyframi. Każda godzina z tarczy wypada dwa razy w ciągu doby, więc zapisz obie, np. 3:35 lub 15:35.',
      tip: 'Licz piątkami, gdy długa wskazówka idzie dookoła: każda liczba na tarczy to kolejne 5 minut. Za szóstką licz, ile brakuje do pełnej godziny: na 8 brakuje 20 minut, więc jest „za dwadzieścia”.' },
    // pieniądze
    'counting-coins': { title: 'Liczymy monety', years: ['klasa-2', 'klasa-3'],
      desc: 'Dodawanie groszy', how: 'Ile pieniędzy jest w każdej portmonetce? Zapisz kwotę.',
      tip: 'Zacznij od monety, która jest warta najwięcej, i doliczaj: 20 gr, 30 gr, 35 gr, 36 gr… Uwaga: 10 gr jest mniejsze od 5 gr. Wielkość monety nie mówi, ile jest warta!' },
    'giving-change': { title: 'Wydawanie reszty', years: ['klasa-3', 'klasa-4'],
      desc: 'Reszta z 1 zł, 2 zł, 5 zł i 10 zł', how: 'Oblicz, ile reszty dostaniesz przy każdych zakupach.',
      tip: 'Licz w górę od ceny do kwoty, którą płacisz. Od 65 gr do 1 zł: 5 gr to 70 gr, a jeszcze 30 gr to 1 zł. Reszta: 35 gr.' },
    // miary i jednostki
    'perimeter-and-area': { title: 'Obwód i pole', years: ['klasa-4', 'klasa-5'],
      desc: 'Prostokąty na kratkach', how: 'Każda kratka to kwadrat o boku 1 cm. Oblicz obwód i pole każdego prostokąta.',
      tip: 'Obwód to droga dookoła figury: dodaj długości wszystkich boków. Pole mówi, ile kratek mieści się w środku.' },
    // figury i geometria
    '2d-shapes': { title: 'Figury płaskie', years: ['klasa-2', 'klasa-3'],
      desc: 'Nazwy, boki i wierzchołki', how: 'Napisz nazwę każdej figury i policz jej boki i wierzchołki (rogi).',
      tip: 'Przy liczeniu stawiaj kropkę przy każdym wierzchołku, żeby żadnego nie policzyć dwa razy. Nazwa też podpowiada: pięciokąt ma 5 kątów, więc ma też 5 boków.' },
    // dane i diagramy
    'reading-bar-charts': { title: 'Odczytujemy diagram słupkowy', years: ['klasa-2', 'klasa-3'],
      desc: 'Ankieta: ulubione owoce', how: 'Uczniowie klasy 3a głosowali na swoje ulubione owoce. Odpowiedz na pytania, korzystając z diagramu słupkowego.',
      tip: 'Przesuń palec od górnej krawędzi słupka poziomo do liczb z boku. Tam odczytasz, ile dzieci wybrało te owoce.' },
    // wyrażenia i równania
    'missing-number-problems': { title: 'Działania z okienkiem', years: ['klasa-3', 'klasa-4', 'klasa-5'],
      desc: 'Jaka liczba kryje się w okienku?', how: 'Wpisz brakującą liczbę w każde okienko.',
      tip: 'Skorzystaj z działania odwrotnego. Przy ▢ + 7 = 15 oblicz 15 − 7. Przy 3 · ▢ = 24 oblicz 24 : 3.' },
  },
};
