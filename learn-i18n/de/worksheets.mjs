// Germany (de): words, formats and pictures for the printable worksheets (read by tools/make-worksheets.mjs --lang de).
// Facts follow learn-i18n/de/BRIEF.md: Malpunkt · and colon : (not × and ÷), decimal comma, euro and cent ("ct"),
// clock phrases as children learn them ("halb vier" = 3:30), kleines Einmaleins to 10 · 10, Zahlenraum steps
// 20 / 100 / 1000 / 1 Million, Brüche, Dezimalzahlen and Prozent in Klasse 5/6.
//
// Left out (they don't fit German schools):
// - multiplication-check-practice: England's national check; Germany has no such test.
// - multiplication-grid: a 12 × 12 grid; German classes use the 10 · 10 Einmaleins-Tafel.
// - short-multiplication: English layout (factor under the number); German written multiplication is in one line (324 · 3).
// The times-table and division sheets ask up to 12; on the German sheets the 11 and 12 questions are named as
// extras ("Extra-Aufgaben"), solved with the Zehneraufgabe (12 · 5 = 10 · 5 + 2 · 5).

const W = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

// The clock phrase children learn in German primary schools, h = 1 to 12 on a dial.
// 3:30 is "halb vier" (half towards four); "zwanzig nach / vor" for :20 and :40, the most widely understood.
function timeWords(h, m) {
  const hh = h % 12 || 12, next = (h % 12) + 1;
  const now = W[hh], then = W[next];
  switch (m) {
    case 0: return `${hh === 1 ? 'ein' : now} Uhr`;
    case 5: return `fünf nach ${now}`;
    case 10: return `zehn nach ${now}`;
    case 15: return `Viertel nach ${now}`;
    case 20: return `zwanzig nach ${now}`;
    case 25: return `fünf vor halb ${then}`;
    case 30: return `halb ${then}`;
    case 35: return `fünf nach halb ${then}`;
    case 40: return `zwanzig vor ${then}`;
    case 45: return `Viertel vor ${then}`;
    case 50: return `zehn vor ${then}`;
    case 55: return `fünf vor ${then}`;
    default: return m < 30 ? `${m} Minuten nach ${now}` : `${60 - m} Minuten vor ${then}`;
  }
}

// A dial time happens twice a day; German schools write both: 3:35 Uhr oder 15:35 Uhr (12:05 → 0:05 Uhr).
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  const later = hh === 12 ? 0 : hh + 12;
  return `${hh}:${mm} oder ${later}:${mm} Uhr`;
}

// Whole numbers: groups of three with a narrow no-break space from 10 000 on; four-digit numbers stay
// together (2500, 4562), as in the KMK standards and most schoolbooks.
const num = n => {
  const s = String(Math.abs(n));
  const g = s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
  return n < 0 ? `−${g}` : g;
};

// Amounts in cents: under 1 € in cents ("65 ct"), whole euros "2 €", otherwise with the comma "3,45 €".
const money = c => c < 100 ? `${c} ct` : c % 100 === 0 ? `${c / 100} €` : `${(c / 100).toFixed(2).replace('.', ',')} €`;

const PLACE = { 10: 'Zehner', 100: 'Hunderter', 1000: 'Tausender' };
const COPPER = '#D9895B', GOLD = '#E9C46A', SILVER = '#D7DCE3';

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Uhr: Der lange Zeiger zeigt auf die ${minute} und der kurze Zeiger auf die ${hour}`
      : `Uhr: Der lange Zeiger zeigt auf die ${minute} und der kurze Zeiger steht zwischen ${hour} und ${next}`;
  },
  shapeAlt: n => `Form ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind}: ${shaded} von ${total} gleich großen Teilen sind eingefärbt`,
  fractionKinds: {"bar": "Streifen", "circle": "Kreis", "grid": "Raster"},
  coinAlt: value => `${value}-Münze`,
  rectangleAlt: (w, h) => `Rechteck auf einem Raster mit ${w} Spalten und ${h} Zeilen aus Quadraten mit 1 cm Seitenlänge`,
  chartAlt: "Säulendiagramm zur Lieblingsobst-Abstimmung; die Werte stehen in der Tabelle darunter",
  chartFruit: "Obst", chartVotes: "Stimmen",
  htmlLang: 'de',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '·', div: ':',
  tensOnes: b => `${b} Zehner und ${b} Einer`,
  tensOnesA: (t, o) => `${t} Zehner und ${o} Einer`,
  roundQ: (n, to, b) => `Auf ${PLACE[String(to).replace(/\D/g, '')] || to}: <b class="n">${n}</b> ≈ ${b}`,
  of: (f, x) => `${f} von ${x}`,
  pctOf: (p, x) => `${p} % von ${x}`,
  timeWords, digital,
  money,
  coinValues: [1, 2, 5, 10, 20, 50],
  coinLabel: v => v >= 100 ? `${v / 100} €` : `${v} ct`,
  // euro coins: real diameters in mm; 1, 2, 5 ct copper-coloured, 10, 20, 50 ct Nordic gold, 1 € and 2 € two-coloured
  // (the fill is the outer ring: 1 € gold ring with a silver centre, 2 € silver ring with a gold centre)
  coins: { 1: [COPPER, 16.25, 'circle'], 2: [COPPER, 18.75, 'circle'], 5: [COPPER, 21.25, 'circle'],
    10: [GOLD, 19.75, 'circle'], 20: [GOLD, 22.25, 'circle'], 50: [GOLD, 24.25, 'circle'],
    100: [GOLD, 23.25, 'circle'], 200: [SILVER, 25.75, 'circle'] },
  coinInner: v => v === 100 ? SILVER : v === 200 ? GOLD : null,
  paid: [100, 200, 500],
  // prices are random (10 ct to 4,95 €), so most items are ones whose price can vary: Obst, Eis, Brezeln, Süßigkeiten
  shopItems: ['einen Bleistift', 'Obst', 'ein Comicheft', 'Eis', 'ein Heft', 'Sticker', 'Brezeln', 'Süßigkeiten'],
  changeQ: (item, cost, paid, b) => `Du kaufst ${item} für ${cost} und zahlst mit ${paid}. Rückgeld: ${b}`,
  perimQ: b => `<div class="ansline">Umfang ${b} cm</div><div class="ansline">Flächeninhalt ${b} cm²</div>`,
  perimA: (p, a) => `Umfang ${p} cm, Flächeninhalt ${a} cm²`,
  shapes: { 3: 'Dreieck', 4: 'Quadrat', rect: 'Rechteck', 5: 'Fünfeck', 6: 'Sechseck', 8: 'Achteck', 0: 'Kreis', 7: 'Siebeneck', 10: 'Zehneck' },
  shapeQ: b => `<div class="ansline wide">Name:</div><div class="ansline">Seiten ${b} Ecken ${b}</div>`,
  shapeA: (name, n) => n === 0 ? 'Kreis: keine Ecken, keine geraden Seiten' : `${name}: ${n} Seiten, ${n} Ecken`,
  fruits: ['Äpfel', 'Bananen', 'Trauben', 'Orangen', 'Birnen'],
  chartQs: (f, v, mx, mn) => [
    [`Wie viele Kinder haben ${f[1]} gewählt?`, v[1]],
    ['Welches Obst ist am beliebtesten?', f[mx]],
    ['Welches Obst haben die wenigsten Kinder gewählt?', f[mn]],
    [`Wie viele Kinder mehr haben ${f[mx]} gewählt als ${f[mn]}?`, v[mx] - v[mn]],
    ['Wie viele Kinder haben insgesamt abgestimmt?', v.reduce((a, b) => a + b, 0)]],
  years: { vorschule: 'Vorschule', 'klasse-1': '1. Klasse', 'klasse-2': '2. Klasse', 'klasse-3': '3. Klasse', 'klasse-4': '4. Klasse', 'klasse-5': '5. Klasse', 'klasse-6': '6. Klasse' },
  // "2. Klasse", "1. und 2. Klasse", "3. bis 5. Klasse", "Vorschule und 1. Klasse"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const first = ys[0], last = ys[ys.length - 1], join = ys.length > 2 ? 'bis' : 'und';
    if (ys.every(y => /^klasse-\d$/.test(y))) return `${first.slice(7)}. ${join} ${last.slice(7)}. Klasse`;
    return `${n[first]} ${join} ${n[last]}`;
  },
  name: 'Name', date: 'Datum', tip: 'Indies Tipp:', answers: 'Lösungen',
  titleTag: t => `Arbeitsblatt „${t}“ – Beequation Kids`,
  footer: 'Darf für zu Hause und den Unterricht frei kopiert werden. Mehr Arbeitsblätter auf <b>de.beequation.com/learn</b>',
  promo: '<b>Üben mit Indie.</b> Auf de.beequation.com gibt es kostenlose Wabenrätsel mit Zahlen, und für Handy und Tablet die App Beequation Kids: ohne Werbung, ohne Datenerfassung, ohne Zeitdruck.',

  sheets: {
    // Zahlen und Stellenwerte
    'missing-numbers-to-100': { title: 'Zahlenfolgen bis 100', desc: 'In Einer-, Zweier-, Fünfer- und Zehnerschritten',
      how: 'Setze die fehlenden Zahlen in jede Zahlenfolge ein.',
      tip: 'Sprich die Zahlen leise mit. Deine Ohren merken, wenn ein Sprung nicht passt.', years: ['klasse-2'] },
    'tens-and-ones': { title: 'Zehner und Einer', desc: 'Zweistellige Zahlen zerlegen',
      how: 'Zerlege jede Zahl in Zehner und Einer.',
      tip: 'Bei 47 steht die 4 vorne: Das sind 4 Zehner. Die 7 hinten sind 7 Einer. Pass auf: Wir sagen zuerst die Einer („sieben-und-vierzig“), schreiben aber zuerst die Zehner.', years: ['klasse-2'] },
    'hundreds-tens-ones': { title: 'Hunderter, Zehner und Einer', desc: 'Stellenwerte bis 1000',
      how: 'Zerlege jede Zahl in Hunderter + Zehner + Einer.',
      tip: 'Die Null hält einen Platz frei. In 405 gibt es keine Zehner, aber dank der 0 bleibt die 4 bei den Hundertern.', years: ['klasse-3'] },
    rounding: { title: 'Runden', desc: 'Auf Zehner, Hunderter und Tausender runden',
      how: 'Runde jede Zahl wie angegeben. Das Zeichen ≈ heißt „ungefähr gleich“.',
      tip: 'Schau auf die Ziffer rechts neben der Stelle, auf die du rundest. Bei 0, 1, 2, 3 oder 4 rundest du ab, bei 5, 6, 7, 8 oder 9 auf.', years: ['klasse-4', 'klasse-5'] },
    // Plus und Minus
    'number-bonds-to-10': { title: 'Zerlegungen der 10', desc: 'Verliebte Zahlen: Welche zwei Zahlen ergeben 10?',
      how: 'Schreibe die fehlende Zahl hin, damit es zusammen 10 sind.',
      tip: 'Nimm deine Finger! Halte 7 Finger hoch. Wie viele sind noch unten? Zusammen sind es 10.', years: ['vorschule', 'klasse-1'] },
    'number-bonds-to-20': { title: 'Zerlegungen der 20', desc: 'Welche zwei Zahlen ergeben 20?',
      how: 'Finde die fehlenden Zahlen. In jeder Aufgabe steckt die 20.',
      tip: 'Wenn du weißt, dass 3 + 7 = 10 ist, weißt du auch: 13 + 7 = 20. Die verliebten Zahlen helfen dir bis 20.', years: ['klasse-1'] },
    'add-and-subtract-within-20': { title: 'Plus und Minus bis 20', desc: 'Gemischte Aufgaben im Zahlenraum bis 20',
      how: 'Rechne jede Aufgabe aus.',
      tip: 'Über die 10 rechnest du in zwei Schritten: 8 + 5 = 8 + 2 + 3 = 13. Bei Minus genauso: 13 − 5 = 13 − 3 − 2 = 8.', years: ['klasse-1'] },
    'column-addition': { title: 'Schriftlich addieren', desc: 'Dreistellige Zahlen, mit Übertrag',
      how: 'Rechne schriftlich. Fang bei den Einern an!',
      tip: 'Ergibt eine Spalte 10 oder mehr, schreibst du nur die Einer hin. Die 1 schreibst du als Übertrag klein in die nächste Spalte.', years: ['klasse-3', 'klasse-4'] },
    'column-subtraction': { title: 'Schriftlich subtrahieren', desc: 'Dreistellige Zahlen untereinander',
      how: 'Rechne schriftlich, so wie du es in deiner Klasse gelernt hast. Fang bei den Einern an!',
      tip: 'Mach die Probe mit Plus: Wenn 532 − 178 = 354 stimmt, dann ergibt 354 + 178 wieder 532.', years: ['klasse-3', 'klasse-4'] },
    // Malnehmen und Teilen
    'times-tables-2-5-10': { title: 'Zweier-, Fünfer- und Zehnerreihe', desc: 'Gemischte Malaufgaben, mit Extra-Aufgaben bis 12',
      how: 'Rechne jede Aufgabe aus. Aufgaben mit 11 und 12 sind Extra-Aufgaben für Profis.',
      tip: 'In der Zehnerreihe enden alle Ergebnisse auf 0, in der Fünferreihe auf 0 oder 5. Und 12 · 5? Rechne 10 · 5 + 2 · 5 = 50 + 10 = 60.', years: ['klasse-2', 'klasse-3'] },
    'times-tables-3-4-8': { title: 'Dreier-, Vierer- und Achterreihe', desc: 'Gemischte Malaufgaben, mit Extra-Aufgaben bis 12',
      how: 'Rechne jede Aufgabe aus. Aufgaben mit 11 und 12 sind Extra-Aufgaben für Profis.',
      tip: 'Die Achterreihe ist die verdoppelte Viererreihe. Wenn 4 · 6 = 24 ist, dann ist 8 · 6 = 48.', years: ['klasse-2', 'klasse-3'] },
    'division-facts': { title: 'Geteiltaufgaben', desc: 'Mit dem Einmaleins teilen, dazu Extra-Aufgaben bis 144 : 12',
      how: 'Rechne jede Aufgabe aus. Ein paar Aufgaben gehen über das kleine Einmaleins hinaus: Das sind Extra-Aufgaben für Profis.',
      tip: 'Teilen ist die Umkehraufgabe vom Malnehmen. Bei 42 : 6 fragst du: 6 mal wie viel ist 42? Bei 84 : 7 hilft Zerlegen: 70 : 7 = 10 und 14 : 7 = 2, zusammen 12.', years: ['klasse-3', 'klasse-4'] },
    // Brüche
    'what-fraction-is-shaded': { title: 'Welcher Bruchteil ist gefärbt?', desc: 'Hälften, Drittel, Viertel und mehr',
      how: 'Schreibe als Bruch auf, welcher Teil jeder Form gefärbt ist.',
      tip: 'Zähle zuerst alle gleich großen Teile: Das ist der Nenner unten. Dann zähle die gefärbten Teile: Das ist der Zähler oben.', years: ['klasse-5', 'klasse-6'] },
    'fractions-of-amounts': { title: 'Bruchteile von Zahlen', desc: 'Zum Beispiel ½ von 12 und ¾ von 20',
      how: 'Rechne jede Aufgabe aus.',
      tip: 'Teile durch den Nenner, dann nimm mal den Zähler. Bei ¾ von 20: 20 : 4 = 5, dann 5 · 3 = 15.', years: ['klasse-5', 'klasse-6'] },
    'equivalent-fractions': { title: 'Brüche erweitern', desc: 'Gleichwertige Brüche: Finde die fehlende Zahl',
      how: 'Schreibe die fehlende Zahl hin, damit beide Brüche gleich groß sind.',
      tip: 'Was du mit dem Nenner machst, machst du auch mit dem Zähler. ½ = ⁴⁄₈, weil beide Zahlen mal 4 genommen wurden.', years: ['klasse-5', 'klasse-6'] },
    // Kommazahlen und Prozent
    'tenths-and-hundredths': { title: 'Zehntel und Hundertstel', desc: 'Brüche als Dezimalzahlen schreiben',
      how: 'Schreibe jeden Bruch als Dezimalzahl (Kommazahl).',
      tip: 'Die Zehntel stehen an der ersten Stelle nach dem Komma, die Hundertstel an der zweiten. ⁷⁄₁₀₀ ist 0,07.', years: ['klasse-6'] },
    'percentages-of-amounts': { title: 'Prozent von Zahlen', desc: '10 %, 25 %, 50 % und mehr',
      how: 'Rechne jede Aufgabe aus.',
      tip: '10 % findest du, wenn du durch 10 teilst. Dann baust du weiter: 30 % sind dreimal 10 %, und 5 % sind die Hälfte von 10 %.', years: ['klasse-6'] },
    // Uhrzeit
    'time-oclock-and-half-past': { title: 'Volle und halbe Stunden', desc: 'Die Uhr lesen',
      how: 'Schreibe auf, wie spät es auf jeder Uhr ist.',
      tip: 'Der kurze Zeiger zeigt die Stunde. Zeigt der lange Zeiger auf die 12, ist es eine volle Stunde. Zeigt er auf die 6, ist es halb: Halb vier ist eine halbe Stunde vor vier.', years: ['klasse-1'] },
    'time-quarter-past-and-to': { title: 'Viertel nach und Viertel vor', desc: 'Die Uhr lesen',
      how: 'Schreibe die Uhrzeit auf jeder Uhr in Worten. Wo man „viertel vier“ oder „dreiviertel vier“ sagt, darfst du das auch schreiben.',
      tip: 'Viertel nach: Der lange Zeiger zeigt auf die 3. Viertel vor: Er zeigt auf die 9, und der kurze Zeiger ist schon fast bei der nächsten Stunde.', years: ['klasse-2'] },
    'time-to-5-minutes': { title: 'Uhrzeit auf 5 Minuten genau', desc: 'Die Uhr lesen',
      how: 'Schreibe jede Uhrzeit in Worten und mit Ziffern. Jede Uhrzeit gibt es zweimal am Tag: Schreibe beide auf.',
      tip: 'Zähle in Fünferschritten, während der lange Zeiger herumwandert: Von einer Zahl zur nächsten sind es 5 Minuten.', years: ['klasse-2', 'klasse-3'] },
    // Geld
    'counting-coins': { title: 'Münzen zählen', desc: 'Euro-Münzen zusammenzählen',
      how: 'Wie viel Geld ist in jedem Geldbeutel? Schreibe den Betrag auf.',
      tip: 'Fang mit der Münze an, die am meisten wert ist, und zähle weiter: 20 ct, 30 ct, 35 ct, 36 ct … 100 ct sind 1 €.', years: ['klasse-2', 'klasse-3'] },
    'giving-change': { title: 'Rückgeld berechnen', desc: 'Rückgeld von 1 €, 2 € und 5 €',
      how: 'Wie viel Rückgeld bekommst du bei jedem Einkauf?',
      tip: 'Ergänze vom Preis bis zum Geld, das du gibst. Von 65 ct bis 1 €: 5 ct dazu sind 70 ct, 30 ct dazu sind 1 €. Du bekommst 35 ct zurück.', years: ['klasse-3'] },
    // Größen und Messen
    'perimeter-and-area': { title: 'Umfang und Flächeninhalt', desc: 'Rechtecke im Kästchenraster',
      how: 'Jedes Kästchen steht für 1 cm mal 1 cm. Finde den Umfang und den Flächeninhalt jedes Rechtecks.',
      tip: 'Der Umfang ist der Weg einmal ganz außen herum: Rechne alle Seiten zusammen. Der Flächeninhalt sagt dir, wie viele Kästchen innen liegen.', years: ['klasse-4', 'klasse-5'] },
    // Formen und Geometrie
    '2d-shapes': { title: 'Formen erkennen', desc: 'Namen, Seiten und Ecken',
      how: 'Schreibe zu jeder Form ihren Namen und zähle ihre Seiten und Ecken.',
      tip: 'Mach an jede Ecke einen kleinen Punkt, wenn du sie zählst. Dann zählst du keine doppelt. Und ein Fünfeck hat 5 Ecken: Der Name verrät es dir.', years: ['klasse-1', 'klasse-2'] },
    // Daten und Diagramme
    'reading-bar-charts': { title: 'Ein Säulendiagramm lesen', desc: 'Umfrage: Lieblingsobst',
      how: 'Die Klasse 3a hat abgestimmt, welches Obst sie am liebsten mag. Beantworte die Fragen mithilfe des Säulendiagramms.',
      tip: 'Fahre mit dem Finger von der Oberkante einer Säule waagerecht zu den Zahlen am Rand. Dort liest du ab, wie viele es sind.', years: ['klasse-2', 'klasse-3'] },
    // Muster, Gleichungen und Dreisatz
    'missing-number-problems': { title: 'Platzhalteraufgaben', desc: 'Finde die Zahl im Kästchen',
      how: 'Finde die fehlende Zahl in jeder Aufgabe.',
      tip: 'Nimm die Umkehraufgabe. Bei ▢ + 7 = 15 rechnest du 15 − 7. Bei 3 · ▢ = 24 rechnest du 24 : 3.', years: ['klasse-3', 'klasse-4', 'klasse-5'] },
  },
};
