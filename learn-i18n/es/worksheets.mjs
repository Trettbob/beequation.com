// Spain (es): the printable worksheets' words, formats and pictures, and which sheets Spain uses.
// Read by tools/make-worksheets.mjs --lang es (see learn-i18n/README.md). Facts follow learn-i18n/es/BRIEF.md:
// decimal comma, a point for thousands from 1.000 up, × for multiplication and ":" for division in Primaria,
// euros and céntimos, "las tres y cuarto" / "las cuatro menos cuarto", tables from 1 to 10.
// Left out: multiplication-check-practice (England's timed check; Spain has no tables test) and multiplication-grid
// (a 12 × 12 grid; in Spain the tables, and the "tabla pitagórica", go from 1 to 10).

const NBSP = ' ';
const HOURS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
const MINUTES = { 5: 'cinco', 10: 'diez', 15: 'cuarto', 20: 'veinte', 25: 'veinticinco', 30: 'media' };
// "la una", "las dos", "las doce"
const hour = h => (h === 1 ? 'la una' : `las ${HOURS[h]}`);
// whole numbers: a point from 1.000 up (as in Spanish school books)
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const euros = c => (c % 100 === 0 ? `${num(c / 100)}${NBSP}€` : `${num(Math.floor(c / 100))},${String(c % 100).padStart(2, '0')}${NBSP}€`);

const NBC = '#D9895B';      // copper (1, 2 and 5 céntimos)
const GOLD = '#E5C25A';     // Nordic gold (10, 20 and 50 céntimos)
const BRASS = '#F2C14E';    // the gold-coloured part of the 1 € and 2 € coins
const SILVER = '#D7DCE3';   // the silver-coloured part of the 1 € and 2 € coins

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Reloj: la aguja larga apunta al ${minute} y la aguja corta apunta al ${hour}`
      : `Reloj: la aguja larga apunta al ${minute} y la aguja corta está entre el ${hour} y el ${next}`;
  },
  shapeAlt: n => `Figura ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind} con ${shaded} de ${total} partes iguales coloreadas`,
  fractionKinds: {"bar": "Barra", "circle": "Círculo", "grid": "Cuadrícula"},
  coinAlt: value => `Moneda de ${value}`,
  rectangleAlt: (w, h) => `Rectángulo en una cuadrícula de ${w} columnas y ${h} filas de cuadrados de 1 cm de lado`,
  chartAlt: "Diagrama de barras de los votos por la fruta favorita; los valores están en la tabla de abajo",
  chartFruit: "Fruta", chartVotes: "Votos",
  htmlLang: 'es',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '×', div: ':',
  tensOnes: b => `${b} decenas y ${b} unidades`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'decena' : 'decenas'} y ${o} ${o === 1 ? 'unidad' : 'unidades'}`,
  roundQ: (n, to, b) => `<b class="n">${n}</b> ${{ '10': 'a la decena', '100': 'a la centena', '1.000': 'al millar' }[to]} → ${b}`,
  of: (f, x) => `${f} de ${x}`,
  pctOf: (p, x) => `${p}${NBSP}% de ${x}`,

  // clock times on a dial (h 1 to 12, m in 5s): "las tres en punto", "la una y media", "las cuatro menos cuarto"
  timeWords: (h, m) => {
    const hh = h % 12 || 12, next = hh % 12 + 1;
    if (m === 0) return `${hour(hh)} en punto`;
    if (m <= 30) return `${hour(hh)} y ${MINUTES[m]}`;
    return `${hour(next)} menos ${MINUTES[60 - m]}`;
  },
  digital: (h, m) => `${h % 12 || 12}:${String(m).padStart(2, '0')}`,

  // money in céntimos: "0,65 €", "3,45 €", "1 €"
  money: c => euros(c),
  coinValues: [1, 2, 5, 10, 20, 50],
  coinLabel: v => (v >= 100 ? `${v / 100} €` : `${v} c`),
  // euro coins: colour of the outer part and real diameter in mm
  coins: { 1: [NBC, 16.25, 'circle'], 2: [NBC, 18.75, 'circle'], 5: [NBC, 21.25, 'circle'], 10: [GOLD, 19.75, 'circle'],
    20: [GOLD, 22.25, 'circle'], 50: [GOLD, 24.25, 'circle'], 100: [BRASS, 23.25, 'circle'], 200: [SILVER, 25.75, 'circle'] },
  // 1 €: gold-coloured ring, silver-coloured centre; 2 €: silver-coloured ring, gold-coloured centre
  coinInner: v => (v === 100 ? SILVER : v === 200 ? BRASS : null),
  paid: [100, 200, 500],
  shopItems: ['un lápiz', 'unas chuches', 'un cómic', 'un zumo', 'un cuaderno', 'unas pegatinas', 'un rotulador', 'un helado'],
  changeQ: (item, cost, paid, b) => `Compras ${item} por ${cost} y pagas con ${paid}. Te devuelven: ${b}`,

  perimQ: b => `<div class="ansline">Perímetro ${b} cm</div><div class="ansline">Área ${b} cm²</div>`,
  perimA: (p, a) => `Perímetro ${p} cm, área ${a} cm²`,
  shapes: { 3: 'triángulo', 4: 'cuadrado', rect: 'rectángulo', 5: 'pentágono', 6: 'hexágono', 8: 'octógono', 0: 'círculo', 7: 'heptágono', 10: 'decágono' },
  shapeQ: b => `<div class="ansline wide">Nombre:</div><div class="ansline">Lados ${b} Vértices ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'círculo: 0 lados (es una línea curva), 0 vértices' : `${name}: ${n} lados, ${n} vértices`),

  fruits: ['Manzanas', 'Plátanos', 'Uvas', 'Naranjas', 'Peras'],
  chartQs: (f, v, mx, mn) => [
    [`¿Cuántos niños eligieron ${f[1].toLowerCase()}?`, v[1]],
    ['¿Qué fruta fue la más votada?', f[mx]],
    ['¿Qué fruta fue la menos votada?', f[mn]],
    [`¿Cuántos niños más eligieron ${f[mx].toLowerCase()} que ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['¿Cuántos niños votaron en total?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { 'infantil-5-anos': 'Infantil 5 años', '1-primaria': '1.º de Primaria', '2-primaria': '2.º de Primaria', '3-primaria': '3.º de Primaria',
    '4-primaria': '4.º de Primaria', '5-primaria': '5.º de Primaria', '6-primaria': '6.º de Primaria' },
  // "Infantil 5 años y 1.º de Primaria", "2.º y 3.º de Primaria", "De 3.º a 6.º de Primaria"
  yearsLabel: (ys, n) => {
    const inf = ys.filter(y => !y.endsWith('-primaria')).map(y => n[y]);
    const pri = ys.filter(y => y.endsWith('-primaria')).map(y => n[y].replace(' de Primaria', ''));
    if (!pri.length) return inf.join(' y ');
    if (pri.length > 2) return inf.length ? `${inf.join(', ')} a ${pri[pri.length - 1]} de Primaria` : `De ${pri[0]} a ${pri[pri.length - 1]} de Primaria`;
    return [...inf, `${pri.join(' y ')} de Primaria`].join(' y ');
  },
  name: 'Nombre', date: 'Fecha', tip: 'El consejo de Indie:', answers: 'Soluciones',
  titleTag: t => `${t}: ficha de Beequation Kids`,
  footer: 'Puedes fotocopiarla libremente para casa y para el aula. Más fichas en <b>es.beequation.com/learn</b>',
  promo: '<b>Practica con Indie.</b> Juega gratis a los retos de panales con números en es.beequation.com, o busca Beequation Kids en tu móvil o tableta: sin anuncios, sin rastreo y sin cronómetros.',

  sheets: {
    // números y valor posicional
    'missing-numbers-to-100': { title: 'Series hasta el 100', years: ['1-primaria', '2-primaria'],
      desc: 'Cuenta de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10', how: 'Completa los números que faltan en cada serie.',
      tip: 'Di los números en voz alta mientras cuentas. ¡Tus oídos notan enseguida un salto que no encaja!' },
    'tens-and-ones': { title: 'Decenas y unidades', years: ['1-primaria', '2-primaria'],
      desc: 'Descompón números de dos cifras', how: 'Descompón cada número en decenas y unidades.',
      tip: 'La cifra de la izquierda te dice cuántas decenas hay. 47 son 4 decenas y 7 unidades.' },
    'hundreds-tens-ones': { title: 'Centenas, decenas y unidades', years: ['2-primaria', '3-primaria'],
      desc: 'Valor posicional hasta el 999', how: 'Escribe cada número como centenas + decenas + unidades.',
      tip: 'El cero guarda el sitio. En 405 no hay decenas, pero gracias al 0 el 4 se queda en las centenas.' },
    'rounding': { title: 'Redondear números', years: ['3-primaria', '4-primaria'],
      desc: 'A la decena, a la centena y al millar', how: 'Redondea cada número como se indica.',
      tip: 'Mira la cifra que está justo a la derecha del lugar al que redondeas. Si es 5 o más, se redondea hacia arriba.' },
    // sumas y restas
    'number-bonds-to-10': { title: 'Los amigos del 10', years: ['infantil-5-anos', '1-primaria'],
      desc: 'Parejas de números que suman 10', how: 'Escribe el número que falta para llegar a 10.',
      tip: '¡Usa los dedos! Levanta 7. ¿Cuántos se han quedado bajados? Esos son los que faltan para llegar a 10.' },
    'number-bonds-to-20': { title: 'Los amigos del 20', years: ['1-primaria', '2-primaria'],
      desc: 'Parejas de números que suman 20', how: 'Escribe el número que falta. ¡Todas las parejas suman 20!',
      tip: 'Si sabes que 3 + 7 = 10, también sabes que 13 + 7 = 20. ¡Los amigos del 10 te ayudan con los del 20!' },
    'add-and-subtract-within-20': { title: 'Sumas y restas hasta el 20', years: ['1-primaria', '2-primaria'],
      desc: 'Sumas y restas mezcladas hasta el 20', how: 'Calcula cada resultado.',
      tip: 'Para restar, cuenta hacia atrás en la recta numérica, o piensa: ¿cuánto le sumo al número pequeño para llegar al grande?' },
    'column-addition': { title: 'Sumas llevando', years: ['2-primaria', '3-primaria'],
      desc: 'Números de tres cifras, en vertical', how: 'Haz las sumas en vertical. ¡Empieza por las unidades!',
      tip: 'Si una columna suma 10 o más, escribe las unidades y llévate una a la columna siguiente. ¡Apúntala pequeñita arriba para no olvidarla!' },
    'column-subtraction': { title: 'Restas llevando', years: ['2-primaria', '3-primaria'],
      desc: 'Números de tres cifras, en vertical', how: 'Haz las restas en vertical. ¡Empieza por las unidades!',
      tip: 'Haz la prueba con una suma: si 532 − 178 = 354, entonces 354 + 178 tiene que dar 532.' },
    // multiplicación y división
    'times-tables-2-5-10': { title: 'Tablas del 2, del 5 y del 10', years: ['2-primaria', '3-primaria'],
      desc: 'Multiplicaciones salteadas', how: 'Calcula cada multiplicación. ¿Te sale un 11 o un 12? Es un reto extra: 5 × 11 es 5 × 10 y un 5 más.',
      tip: 'Todos los resultados de la tabla del 10 acaban en 0, y los de la tabla del 5 acaban en 0 o en 5.' },
    'times-tables-3-4-8': { title: 'Tablas del 3, del 4 y del 8', years: ['2-primaria', '3-primaria'],
      desc: 'Multiplicaciones salteadas', how: 'Calcula cada multiplicación. ¿Te sale un 11 o un 12? Es un reto extra: 4 × 11 es 4 × 10 y un 4 más.',
      tip: 'La tabla del 8 es el doble de la del 4. Si 4 × 6 = 24, entonces 8 × 6 = 48.' },
    'division-facts': { title: 'Divisiones con las tablas', years: ['3-primaria', '4-primaria'],
      desc: 'Usa las tablas para dividir', how: 'Calcula cada división (42 : 6 se lee «42 entre 6» y también se escribe 42 ÷ 6). Si alguna se sale de las tablas, como 88 : 11, ¡es un reto extra!',
      tip: 'Dividir es lo contrario de multiplicar. Para 42 : 6, piensa: ¿6 por cuánto da 42?' },
    'short-multiplication': { title: 'Multiplicar por una cifra', years: ['3-primaria', '4-primaria'],
      desc: 'Números de tres cifras, en vertical', how: 'Haz las multiplicaciones en vertical.',
      tip: 'Empieza por las unidades. Si te sale 10 o más, escribe las unidades y llévate las decenas: súmalas después de multiplicar la cifra siguiente.' },
    // fracciones
    'what-fraction-is-shaded': { title: '¿Qué fracción está coloreada?', years: ['3-primaria', '4-primaria'],
      desc: 'Medios, tercios, cuartos y más', how: 'Escribe la fracción de cada figura que está coloreada.',
      tip: 'Cuenta primero todas las partes iguales: es el número de abajo, el denominador. Luego cuenta las coloreadas: es el de arriba, el numerador.' },
    'fractions-of-amounts': { title: 'Fracción de una cantidad', years: ['4-primaria', '5-primaria'],
      desc: 'Como ½ de 12 o ¾ de 20', how: 'Calcula cada resultado.',
      tip: 'Divide entre el número de abajo y multiplica por el de arriba. Para ¾ de 20: 20 : 4 = 5, y 5 × 3 = 15.' },
    'equivalent-fractions': { title: 'Fracciones equivalentes', years: ['4-primaria', '5-primaria'],
      desc: 'Encuentra el número que falta', how: 'Escribe el número que falta para que las dos fracciones sean iguales.',
      tip: 'Lo que hagas abajo, hazlo también arriba. ½ = ⁴⁄₈ porque los dos números se han multiplicado por 4.' },
    // decimales y porcentajes
    'tenths-and-hundredths': { title: 'Décimas y centésimas', years: ['4-primaria', '5-primaria'],
      desc: 'De fracción a número decimal', how: 'Escribe cada fracción como número decimal.',
      tip: 'Las décimas van en el primer lugar después de la coma, y las centésimas, en el segundo. ⁷⁄₁₀₀ es 0,07.' },
    'percentages-of-amounts': { title: 'Porcentaje de una cantidad', years: ['5-primaria', '6-primaria'],
      desc: `10${NBSP}%, 25${NBSP}%, 50${NBSP}% y más`, how: 'Calcula cada resultado.',
      tip: `Para el 10${NBSP}%, divide entre 10. Luego ve sumando: el 30${NBSP}% son tres veces el 10${NBSP}%, y el 5${NBSP}% es la mitad del 10${NBSP}%.` },
    // la hora
    'time-oclock-and-half-past': { title: 'La hora en punto y la hora y media', years: ['1-primaria'],
      desc: 'Lee los relojes', how: 'Escribe la hora que marca cada reloj.',
      tip: 'La aguja corta marca la hora. La larga marca los minutos: si apunta al 12, es en punto; si apunta al 6, es y media.' },
    'time-quarter-past-and-to': { title: 'Y cuarto y menos cuarto', years: ['2-primaria'],
      desc: 'Lee los relojes', how: 'Escribe con palabras la hora que marca cada reloj.',
      tip: 'Y cuarto: la aguja larga apunta al 3. Menos cuarto: apunta al 9, y la corta ya casi ha llegado a la hora siguiente.' },
    'time-to-5-minutes': { title: 'La hora de 5 en 5 minutos', years: ['2-primaria', '3-primaria'],
      desc: 'Lee los relojes', how: 'Escribe cada hora con palabras y en formato digital.',
      tip: 'Cuenta de 5 en 5: cada número del reloj son 5 minutos. Pasado el 6, mira cuánto falta para la hora siguiente: en el 8 faltan 20, así que es «menos veinte».' },
    // el dinero
    'counting-coins': { title: 'Contar monedas', years: ['2-primaria', '3-primaria'],
      desc: 'Suma monedas de céntimo', how: '¿Cuánto dinero hay en cada monedero? Escribe el total.',
      tip: 'Empieza por la moneda que más vale y ve sumando: 20 céntimos, 30, 35, 36…' },
    'giving-change': { title: '¿Cuánto te devuelven?', years: ['3-primaria', '4-primaria'],
      desc: 'Pagando con 1 €, 2 € y 5 €', how: 'Calcula cuánto te devuelven en cada compra.',
      tip: 'Cuenta desde el precio hasta lo que has pagado. De 0,65 € a 1 €: 5 céntimos hasta 0,70 € y 30 más hasta 1 €. Te devuelven 0,35 €.' },
    // medidas
    'perimeter-and-area': { title: 'Perímetro y área', years: ['4-primaria', '5-primaria'],
      desc: 'Rectángulos en una cuadrícula de centímetros', how: 'Cada cuadrado mide 1 cm de lado. Calcula el perímetro y el área de cada rectángulo.',
      tip: 'El perímetro es lo que mide el borde: suma todos los lados. El área es el número de cuadrados que hay dentro.' },
    // geometría y figuras
    '2d-shapes': { title: 'Figuras planas', years: ['2-primaria', '3-primaria'],
      desc: 'Nombres, lados y vértices', how: 'Escribe el nombre de cada figura y cuenta sus lados y sus vértices (las esquinas).',
      tip: 'Pon un puntito en cada esquina mientras cuentas. ¡Así no cuentas ninguna dos veces!' },
    // datos y gráficos
    'reading-bar-charts': { title: 'Leer un diagrama de barras', years: ['2-primaria', '3-primaria'],
      desc: 'Encuesta de la fruta favorita', how: 'La clase de 3.º A ha votado su fruta favorita. Mira el diagrama de barras y responde a las preguntas.',
      tip: 'Pon el dedo en lo alto de la barra y llévalo recto hasta los números del lado: así sabes cuánto vale.' },
    // álgebra
    'missing-number-problems': { title: 'El número que falta', years: ['4-primaria', '5-primaria', '6-primaria'],
      desc: 'Descubre el número del recuadro', how: 'Encuentra el número que falta en cada igualdad.',
      tip: 'Usa la operación inversa. Para ▢ + 7 = 15, calcula 15 − 7. Para 3 × ▢ = 24, calcula 24 : 3.' },
  },
};
