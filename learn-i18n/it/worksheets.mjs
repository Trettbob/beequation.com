// Italy (it): the printable worksheets' words, formats and pictures, and which sheets Italy uses.
// Read by tools/make-worksheets.mjs --lang it (see learn-i18n/README.md). Facts follow learn-i18n/it/BRIEF.md:
// decimal comma; no thousands separator for four digits, a point from 10.000 up; × for multiplication and ":" for
// division in the scuola primaria; euro and centesimi ("3,45 €", "45 centesimi"); clock phrases as children learn
// them ("le tre e un quarto", "le quattro meno un quarto"), with 24-hour times in daily use; tabelline from 1 to 10.
// Years follow the brief's curriculum notes (usual textbook practice; the national objectives are set only for the
// end of classe terza and classe quinta).
//
// Left out (they don't fit Italian schools):
// - multiplication-check-practice: England's timed national check; Italy has no times-tables test.
// - multiplication-grid: a 12 × 12 grid; in Italy the tabelline and the "tavola pitagorica" go from 1 to 10.
// The tabelline and division sheets also ask facts with 11 and 12: on the Italian sheets these are named as a
// "sfida in più", solved by splitting (5 × 12 = 5 × 10 + 5 × 2).

const NBSP = ' ';
const HOURS = ['', "l'una", 'le due', 'le tre', 'le quattro', 'le cinque', 'le sei', 'le sette', 'le otto', 'le nove',
  'le dieci', 'le undici', 'le dodici'];
const MINUTES = { 5: 'cinque', 10: 'dieci', 15: 'un quarto', 20: 'venti', 25: 'venticinque', 30: 'mezza' };

// The clock phrase children learn in Italian primary schools, h = 1 to 12 on a dial, m in 5s:
// "le tre in punto", "l'una e mezza", "le tre e un quarto"; after the half hour "meno": "le quattro meno venti".
function timeWords(h, m) {
  const hh = h % 12 || 12, next = hh % 12 + 1;
  if (m === 0) return `${HOURS[hh]} in punto`;
  if (m <= 30) return `${HOURS[hh]} e ${MINUTES[m]}`;
  return `${HOURS[next]} meno ${MINUTES[60 - m]}`;
}

// A dial time happens twice a day, and 24-hour time is everyday Italian: "3:35 o 15:35" (12:05 → "12:05 o 00:05").
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  const later = hh === 12 ? '00' : String(hh + 12);
  return `${hh}:${mm} o ${later}:${mm}`;
}

// Whole numbers: four digits stay together (2500, 9999), a point from 10.000 up (the brief's rule for our pages).
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : s;
  return n < 0 ? `−${g}` : g;
};

// Amounts in centesimi: under 1 € in centesimi ("65 centesimi"), whole euros "2 €", otherwise "3,45 €".
const money = c => (c < 100 ? `${c} ${c === 1 ? 'centesimo' : 'centesimi'}`
  : c % 100 === 0 ? `${num(c / 100)}${NBSP}€` : `${num(Math.floor(c / 100))},${String(c % 100).padStart(2, '0')}${NBSP}€`);

const ROUND = { 10: 'alle decine', 100: 'alle centinaia', 1000: 'alle migliaia' };

// fruit for the bar chart, with the article the questions need
const ART = { Mele: 'le mele', Banane: 'le banane', Uva: "l'uva", Arance: 'le arance', Pere: 'le pere' };
const TO = { Mele: 'alle mele', Banane: 'alle banane', Uva: "all'uva", Arance: 'alle arance', Pere: 'alle pere' };

// euro coin colours (BRIEF.md section 6)
const COPPER = '#B87333';   // 1, 2 and 5 centesimi
const GOLD = '#C9A13B';     // "oro nordico": 10, 20 and 50 centesimi; also the gold-coloured part of 1 € and 2 €
const SILVER = '#D7DCE3';   // the silver-coloured part of 1 € and 2 €

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Orologio: la lancetta lunga punta sul numero ${minute} e la lancetta corta punta sul numero ${hour}`
      : `Orologio: la lancetta lunga punta sul numero ${minute} e la lancetta corta è tra i numeri ${hour} e ${next}`;
  },
  shapeAlt: n => `Figura ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind} con ${shaded} parti colorate su ${total} parti uguali`,
  fractionKinds: {"bar": "Striscia", "circle": "Cerchio", "grid": "Griglia"},
  coinAlt: value => `Moneta da ${value}`,
  rectangleAlt: (w, h) => `Rettangolo su una griglia di ${w} colonne e ${h} righe di quadrati di lato 1 cm`,
  chartAlt: "Grafico a barre dei voti per la frutta preferita; i valori sono nella tabella sottostante",
  chartFruit: "Frutta", chartVotes: "Voti",
  htmlLang: 'it',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '×', div: ':',
  tensOnes: b => `${b} decine e ${b} unità`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'decina' : 'decine'} e ${o} unità`,
  // "3482 alle centinaia → 3500"
  roundQ: (n, to, b) => `<b class="n">${n}</b> ${ROUND[String(to).replace(/\D/g, '')]} → ${b}`,
  of: (f, x) => `${f} di ${x}`,
  pctOf: (p, x) => `${p}% di ${x}`,

  timeWords, digital,

  money,
  coinValues: [1, 2, 5, 10, 20, 50],
  coinLabel: v => (v >= 100 ? `${v / 100}${NBSP}€` : `${v}${NBSP}c`),
  // euro coins: colour of the outer part, real diameter in mm (ECB)
  coins: { 1: [COPPER, 16.25, 'circle'], 2: [COPPER, 18.75, 'circle'], 5: [COPPER, 21.25, 'circle'],
    10: [GOLD, 19.75, 'circle'], 20: [GOLD, 22.25, 'circle'], 50: [GOLD, 24.25, 'circle'],
    100: [GOLD, 23.25, 'circle'], 200: [SILVER, 25.75, 'circle'] },
  // 1 €: gold-coloured ring, silver-coloured centre; 2 €: silver-coloured ring, gold-coloured centre
  coinInner: v => (v === 100 ? SILVER : v === 200 ? GOLD : null),
  // prices go up in 5 centesimi, like a cash total in Italy (rounded to the nearest 5 cents)
  paid: [100, 200, 500], costStep: 5,
  // prices are random (10 centesimi to 4,95 €), so most items are ones whose price can vary with the quantity
  shopItems: ['una matita', 'delle caramelle', 'un fumetto', 'della frutta', 'un quaderno', 'delle figurine',
    'dei biscotti', 'della pizza al taglio'],
  changeQ: (item, cost, paid, b) => `Compri ${item} per ${cost} e paghi con ${paid}. Resto: ${b}`,

  perimQ: b => `<div class="ansline">Perimetro ${b} cm</div><div class="ansline">Area ${b} cm²</div>`,
  perimA: (p, a) => `Perimetro ${p} cm, area ${a} cm²`,
  shapes: { 3: 'triangolo', 4: 'quadrato', rect: 'rettangolo', 5: 'pentagono', 6: 'esagono', 8: 'ottagono', 0: 'cerchio', 7: 'ettagono', 10: 'decagono' },
  shapeQ: b => `<div class="ansline wide">Nome:</div><div class="ansline">Lati ${b} Vertici ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'cerchio: nessun lato dritto (il contorno è una linea curva), nessun vertice' : `${name}: ${n} lati, ${n} vertici`),

  fruits: ['Mele', 'Banane', 'Uva', 'Arance', 'Pere'],
  chartQs: (f, v, mx, mn) => [
    [`Quanti bambini hanno scelto ${ART[f[1]]}?`, v[1]],
    ['Qual è la frutta più votata?', f[mx]],
    ['Qual è la frutta meno votata?', f[mn]],
    [`Quanti bambini in più hanno scelto ${ART[f[mx]]} rispetto ${TO[f[mn]]}?`, v[mx] - v[mn]],
    ['Quanti bambini hanno votato in tutto?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { 'infanzia-5-anni': 'Infanzia, 5 anni', 'classe-prima': 'Classe prima', 'classe-seconda': 'Classe seconda',
    'classe-terza': 'Classe terza', 'classe-quarta': 'Classe quarta', 'classe-quinta': 'Classe quinta' },
  // "Classe seconda", "Classi prima e seconda", "Classi dalla terza alla quinta",
  // "Infanzia (5 anni) e classe prima", "Dall'infanzia (5 anni) alla classe seconda"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const ord = y => n[y].replace('Classe ', '');
    const cls = ys.filter(y => y.startsWith('classe-'));
    if (cls.length < ys.length) {
      const last = n[ys[ys.length - 1]].toLowerCase();
      return ys.length > 2 ? `Dall'infanzia (5 anni) alla ${last}` : `Infanzia (5 anni) e ${last}`;
    }
    return ys.length > 2 ? `Classi dalla ${ord(ys[0])} alla ${ord(ys[ys.length - 1])}` : `Classi ${ord(ys[0])} e ${ord(ys[1])}`;
  },
  name: 'Nome', date: 'Data', tip: 'Il consiglio di Indie:', answers: 'Soluzioni',
  titleTag: t => `Scheda «${t}» di Beequation Kids`,
  footer: 'Fotocopiabile liberamente, a casa e in classe. Altre schede gratuite su <b>it.beequation.com/learn</b>',
  promo: '<b>Esercitati con Indie.</b> Gioca gratis ai rompicapi a favo con i numeri su it.beequation.com, oppure cerca Beequation Kids sul telefono o sul tablet: senza pubblicità, senza raccolta di dati e senza cronometro.',

  sheets: {
    // numeri e valore posizionale
    'missing-numbers-to-100': { title: 'Numerazioni fino a 100', years: ['classe-seconda'],
      desc: 'Conta di 1 in 1, di 2 in 2, di 5 in 5 e di 10 in 10', how: 'Completa ogni numerazione con i numeri che mancano.',
      tip: 'Leggi i numeri a voce alta mentre conti. Le tue orecchie si accorgono subito di un salto che non torna!' },
    'tens-and-ones': { title: 'Decine e unità', years: ['classe-prima', 'classe-seconda'],
      desc: 'Scomponi i numeri di due cifre', how: 'Scomponi ogni numero in decine e unità.',
      tip: 'La cifra a sinistra ti dice quante decine ci sono. 47 è fatto di 4 decine e 7 unità: da u, proprio come sul quaderno.' },
    'hundreds-tens-ones': { title: 'Centinaia, decine e unità', years: ['classe-seconda', 'classe-terza'],
      desc: 'Il valore posizionale fino a 999', how: 'Scrivi ogni numero come centinaia + decine + unità.',
      tip: 'Lo zero tiene il posto. In 405 non ci sono decine, ma grazie allo 0 il 4 resta al posto delle centinaia.' },
    'rounding': { title: 'Arrotondare i numeri', years: ['classe-quarta', 'classe-quinta'],
      desc: 'Alle decine, alle centinaia e alle migliaia', how: 'Arrotonda ogni numero come indicato.',
      tip: 'Guarda la cifra subito a destra della posizione a cui arrotondi. Se è 5 o più, arrotondi per eccesso; se è 4 o meno, per difetto.' },
    // addizioni e sottrazioni
    'number-bonds-to-10': { title: 'Gli amici del 10', years: ['infanzia-5-anni', 'classe-prima'],
      desc: 'Le coppie di numeri che fanno 10', how: 'Scrivi il numero che manca per arrivare a 10. Chi è ancora all\'infanzia può dirlo a voce e farsi aiutare da un grande a scriverlo.',
      tip: 'Usa le dita! Alza 7 dita: quante ne restano giù? Sono quelle che mancano per fare 10.' },
    'number-bonds-to-20': { title: 'Gli amici del 20', years: ['classe-prima', 'classe-seconda'],
      desc: 'Le coppie di numeri che fanno 20', how: 'Scrivi il numero che manca. In ogni operazione c\'è il 20!',
      tip: 'Se sai che 3 + 7 = 10, sai anche che 13 + 7 = 20. Gli amici del 10 ti aiutano a trovare quelli del 20!' },
    'add-and-subtract-within-20': { title: 'Addizioni e sottrazioni entro il 20', years: ['classe-prima', 'classe-seconda'],
      desc: 'Operazioni miste entro il 20', how: 'Calcola ogni risultato.',
      tip: 'Per le sottrazioni, torna indietro sulla linea dei numeri, oppure chiediti: quanto devo aggiungere al numero più piccolo per arrivare al più grande?' },
    'column-addition': { title: 'Addizioni in colonna', years: ['classe-seconda', 'classe-terza'],
      desc: 'Numeri di tre cifre, con il riporto', how: 'Esegui le addizioni in colonna. Comincia dalle unità!',
      tip: 'Se in una colonna la somma fa 10 o più, scrivi le unità e riporta 1 nella colonna dopo. Scrivi il riporto piccolo in alto, così non lo dimentichi.' },
    'column-subtraction': { title: 'Sottrazioni in colonna', years: ['classe-seconda', 'classe-terza'],
      desc: 'Numeri di tre cifre, con il prestito', how: 'Esegui le sottrazioni in colonna, come hai imparato in classe (con il prestito o con il cambio). Comincia dalle unità!',
      tip: 'Fai la prova con un\'addizione: se 532 − 178 = 354, allora 354 + 178 deve fare 532.' },
    // moltiplicazioni e divisioni
    'times-tables-2-5-10': { title: 'Le tabelline del 2, del 5 e del 10', years: ['classe-seconda', 'classe-terza'],
      desc: 'Moltiplicazioni in ordine sparso', how: 'Calcola ogni moltiplicazione. Trovi anche l\'11 o il 12? È una sfida in più: 5 × 12 è 5 × 10 più 5 × 2.',
      tip: 'Nella tabellina del 10 tutti i risultati finiscono con 0, in quella del 5 finiscono con 0 o con 5.' },
    'times-tables-3-4-8': { title: 'Le tabelline del 3, del 4 e dell\'8', years: ['classe-seconda', 'classe-terza'],
      desc: 'Moltiplicazioni in ordine sparso', how: 'Calcola ogni moltiplicazione. Trovi anche l\'11 o il 12? È una sfida in più: 4 × 11 è 4 × 10 più 4.',
      tip: 'La tabellina dell\'8 è il doppio di quella del 4. Se 4 × 6 = 24, allora 8 × 6 = 48.' },
    'division-facts': { title: 'Divisioni con le tabelline', years: ['classe-terza', 'classe-quarta'],
      desc: 'Usa le tabelline per dividere', how: 'Calcola ogni divisione (42 : 6 si legge «42 diviso 6»). Se qualcuna esce dalle tabelline, come 88 : 11, è una sfida in più!',
      tip: 'La divisione è l\'operazione inversa della moltiplicazione. Per 42 : 6 chiediti: 6 per quanto fa 42?' },
    'short-multiplication': { title: 'Moltiplicazioni in colonna', years: ['classe-terza', 'classe-quarta'],
      desc: 'Numeri di tre cifre per una cifra', how: 'Esegui le moltiplicazioni in colonna.',
      tip: 'Comincia dalle unità. Se il prodotto fa 10 o più, scrivi le unità e riporta le decine: le aggiungi dopo aver moltiplicato la cifra successiva.' },
    // frazioni
    'what-fraction-is-shaded': { title: 'Quale frazione è colorata?', years: ['classe-terza', 'classe-quarta'],
      desc: 'Mezzi, terzi, quarti e altre frazioni', how: 'Scrivi la frazione che indica la parte colorata di ogni figura.',
      tip: 'Conta prima tutte le parti uguali: è il numero sotto la linea, il denominatore. Poi conta le parti colorate: è il numero sopra, il numeratore.' },
    'fractions-of-amounts': { title: 'La frazione di un numero', years: ['classe-terza', 'classe-quarta'],
      desc: 'Come ½ di 12 o ¾ di 20', how: 'Calcola ogni risultato.',
      tip: 'Dividi per il denominatore e moltiplica per il numeratore. Per ¾ di 20: 20 : 4 = 5, poi 5 × 3 = 15.' },
    'equivalent-fractions': { title: 'Frazioni equivalenti', years: ['classe-quarta', 'classe-quinta'],
      desc: 'Trova il numero che manca', how: 'Scrivi il numero che manca perché le due frazioni siano equivalenti.',
      tip: 'Quello che fai al denominatore, fallo anche al numeratore. ½ = ⁴⁄₈ perché tutti e due i numeri sono stati moltiplicati per 4.' },
    // numeri decimali e percentuali
    'tenths-and-hundredths': { title: 'Decimi e centesimi', years: ['classe-quarta', 'classe-quinta'],
      desc: 'Dalle frazioni decimali ai numeri decimali', how: 'Scrivi ogni frazione decimale come numero decimale.',
      tip: 'I decimi vanno al primo posto dopo la virgola, i centesimi al secondo. ⁷⁄₁₀₀ è 0,07.' },
    'percentages-of-amounts': { title: 'La percentuale di un numero', years: ['classe-quinta'],
      desc: '10%, 25%, 50% e altre percentuali', how: 'Calcola ogni risultato.',
      tip: 'Per il 10% dividi per 10. Poi costruisci le altre: il 30% è tre volte il 10%, il 5% è la metà del 10%.' },
    // leggere l'orologio
    'time-oclock-and-half-past': { title: 'Le ore in punto e le mezz\'ore', years: ['classe-prima', 'classe-seconda'],
      desc: 'Leggi l\'orologio', how: 'Scrivi in parole l\'ora segnata da ogni orologio.',
      tip: 'La lancetta corta indica le ore. Quella lunga indica i minuti: se punta sul 12 è l\'ora in punto, se punta sul 6 è «e mezza».' },
    'time-quarter-past-and-to': { title: 'I quarti d\'ora', years: ['classe-seconda'],
      desc: 'Leggi l\'orologio', how: 'Scrivi in parole l\'ora segnata da ogni orologio.',
      tip: '«E un quarto»: la lancetta lunga punta sul 3. «Meno un quarto»: punta sul 9, e la lancetta corta è quasi arrivata all\'ora dopo.' },
    'time-to-5-minutes': { title: 'L\'ora di 5 in 5 minuti', years: ['classe-seconda', 'classe-terza'],
      desc: 'Leggi l\'orologio', how: 'Scrivi ogni ora in parole e in cifre. Ogni ora capita due volte al giorno: scrivi tutte e due le forme (3:35 o 15:35). Dopo la mezza va bene anche «le tre e quaranta».',
      tip: 'Conta di 5 in 5: da un numero all\'altro dell\'orologio passano 5 minuti. Dopo il 6, guarda quanto manca all\'ora dopo: sull\'8 mancano 20 minuti, quindi è «meno venti».' },
    // l'euro e i soldi
    'counting-coins': { title: 'Contare le monete', years: ['classe-seconda', 'classe-terza'],
      desc: 'Somma le monete in centesimi', how: 'Quanti soldi ci sono in ogni borsellino? Scrivi il totale.',
      tip: 'Comincia dalla moneta che vale di più e vai avanti: 20 centesimi, 30, 35, 36… Ricorda: 100 centesimi fanno 1 euro.' },
    'giving-change': { title: 'Quanto resto ricevi?', years: ['classe-terza', 'classe-quarta'],
      desc: 'Pagando con 1 €, 2 € e 5 €', how: 'Calcola il resto per ogni acquisto.',
      tip: 'Conta in avanti dal prezzo fino ai soldi che hai dato. Da 65 centesimi a 1 €: 5 centesimi per arrivare a 70 e altri 30 per arrivare a 1 €. Il resto è 35 centesimi.' },
    // le misure
    'perimeter-and-area': { title: 'Perimetro e area', years: ['classe-quarta', 'classe-quinta'],
      desc: 'Rettangoli sulla carta a quadretti', how: 'Ogni quadretto ha il lato di 1 cm. Calcola il perimetro e l\'area di ogni rettangolo.',
      tip: 'Il perimetro è la misura del contorno: somma tutti i lati. L\'area è il numero di quadretti che ci sono dentro.' },
    // geometria e figure
    '2d-shapes': { title: 'Le figure piane', years: ['classe-seconda', 'classe-terza'],
      desc: 'Nomi, lati e vertici', how: 'Scrivi il nome di ogni figura e conta i suoi lati e i suoi vertici (i punti dove si incontrano due lati).',
      tip: 'Metti un puntino su ogni vertice mentre conti: così non ne conti nessuno due volte! E il nome ti aiuta: il pentagono ha 5 lati, l\'esagono 6.' },
    // dati e grafici
    'reading-bar-charts': { title: 'Leggere un istogramma', years: ['classe-seconda', 'classe-terza'],
      desc: 'Indagine sulla frutta preferita', how: 'I bambini della 3ª A hanno votato la loro frutta preferita. Guarda l\'istogramma e rispondi alle domande.',
      tip: 'Metti il dito in cima alla colonna e spostalo dritto fino ai numeri sul lato: così leggi quanto vale.' },
    // relazioni
    'missing-number-problems': { title: 'Il numero che manca', years: ['classe-terza', 'classe-quarta', 'classe-quinta'],
      desc: 'Trova il numero nel quadratino', how: 'Trova il numero che manca in ogni uguaglianza.',
      tip: 'Usa l\'operazione inversa. Per ▢ + 7 = 15 calcola 15 − 7. Per 3 × ▢ = 24 calcola 24 : 3.' },
  },
};
