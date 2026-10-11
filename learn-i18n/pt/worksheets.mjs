// Brazil (pt): the printable worksheets' words, formats and pictures, and which sheets Brazil uses.
// Read by tools/make-worksheets.mjs --lang pt (see learn-i18n/README.md). Facts follow learn-i18n/pt/BRIEF.md:
// decimal comma, a point for thousands from 1.000 up, × and ÷ in the anos iniciais, reais and centavos (R$ 3,45;
// coins 5, 10, 25 and 50 centavos and R$ 1, notes from R$ 2), clock phrases as children say them ("três e meia",
// "quinze para as quatro"), 24-hour digital times, tabuada from 1 to 10, school years pré-escola and 1º to 5º ano
// (BNCC habilidades for each sheet's years).
// Left out (they don't fit Brazilian schools):
// - multiplication-check-practice: England's timed tables check; Brazil has no national tables test.
// - multiplication-grid: a 12 × 12 grid; in Brazil the tabuada goes from 1 to 10.
// The times-table and division sheets ask up to 12: on these sheets the 11 and 12 questions are named as an extra
// challenge ("desafio extra"), solved with the 10 (5 × 11 = 5 × 10 + 5).

const NBSP = ' ';
// hours as said on a dial (feminine: "uma hora", "duas horas"); 12 is "meio-dia"
const HOURS = ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'meio-dia'];
const MINUTES = { 5: 'cinco', 10: 'dez', 15: 'quinze', 20: 'vinte', 25: 'vinte e cinco', 35: 'trinta e cinco' };
// "para a uma", "para as quatro", "para o meio-dia"
const toHour = h => (h === 1 ? 'para a uma' : h === 12 ? 'para o meio-dia' : `para as ${HOURS[h]}`);

// The phrase children learn for a dial time (h 1 to 12, m in 5s): "três horas", "três e quinze", "três e meia",
// "três e trinta e cinco", "vinte para as quatro", "quinze para as quatro", "dez para as quatro", "meio-dia e meia".
function timeWords(h, m) {
  const hh = h % 12 || 12, next = hh % 12 + 1, now = HOURS[hh];
  if (m === 0) return hh === 1 ? 'uma hora' : hh === 12 ? 'meio-dia (ou meia-noite)' : `${now} horas`;
  if (m === 30) return `${now} e meia`;
  if (m <= 35) return `${now} e ${MINUTES[m]}`;
  return `${MINUTES[60 - m]} ${toHour(next)}`;
}

// A dial time happens twice a day, and digital clocks in Brazil count to 23:59: "3:40 ou 15:40", "12:20 ou 00:20".
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0');
  return hh === 12 ? `12:${mm} ou 00:${mm}` : `${hh}:${mm} ou ${hh + 12}:${mm}`;
}

// whole numbers: a point from 1.000 up (as in Brazilian prices and on our pages)
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// money in centavos: "R$ 0,65", "R$ 3,45", "R$ 5,00"
const reais = c => `R$${NBSP}${num(Math.floor(c / 100))},${String(c % 100).padStart(2, '0')}`;

const PLACE = { '10': 'para a dezena', '100': 'para a centena', '1.000': 'para o milhar' };
// Real coins (second family, Banco Central): colours of the metal
const COPPER = '#B87333';   // 5 centavos (copper-plated steel)
const BRONZE = '#C9A13B';   // 10 and 25 centavos, and the ring of R$ 1 (bronze-plated steel)
const STEEL = '#C0C3C7';    // 50 centavos, and the centre of R$ 1 (stainless steel)

export default {
  htmlLang: 'pt-BR',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '×', div: '÷',
  tensOnes: b => `${b} dezenas e ${b} unidades`,
  tensOnesA: (t, o) => `${t} ${t === 1 ? 'dezena' : 'dezenas'} e ${o} ${o === 1 ? 'unidade' : 'unidades'}`,
  roundQ: (n, to, b) => `<b class="n">${n}</b> ${PLACE[to] || `para ${to}`} → ${b}`,
  of: (f, x) => `${f} de ${x}`,
  pctOf: (p, x) => `${p}% de ${x}`,
  timeWords, digital,

  money: c => reais(c),
  coinValues: [5, 10, 25, 50, 100],
  coinLabel: v => (v >= 100 ? `R$${NBSP}${v / 100}` : `${v}${NBSP}c`),
  // real coins: colour and diameter in mm (all round); R$ 1 has a bronze-coloured ring and a silver-coloured centre
  coins: { 5: [COPPER, 22, 'circle'], 10: [BRONZE, 20, 'circle'], 25: [BRONZE, 25, 'circle'], 50: [STEEL, 23, 'circle'],
    100: [BRONZE, 27, 'circle'] },
  coinInner: v => (v === 100 ? STEEL : null),
  // paid with notes of R$ 2, R$ 5 and R$ 10; prices go up in 5 centavos (1 centavo coins are no longer used)
  paid: [200, 500, 1000], costStep: 5,
  shopItems: ['um lápis', 'uma borracha', 'um gibi', 'um suco', 'pão de queijo', 'figurinhas', 'balas', 'frutas na feira'],
  changeQ: (item, cost, paid, b) => `Você compra ${item} por ${cost} e paga com ${paid}. Troco: ${b}`,

  perimQ: b => `<div class="ansline">Perímetro ${b} cm</div><div class="ansline">Área ${b} cm²</div>`,
  perimA: (p, a) => `Perímetro ${p} cm, área ${a} cm²`,
  shapes: { 3: 'triângulo', 4: 'quadrado', rect: 'retângulo', 5: 'pentágono', 6: 'hexágono', 8: 'octógono', 0: 'círculo', 7: 'heptágono', 10: 'decágono' },
  shapeQ: b => `<div class="ansline wide">Nome:</div><div class="ansline">Lados ${b} Vértices ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'círculo: 0 lados (é uma linha curva), 0 vértices' : `${name}: ${n} lados, ${n} vértices`),

  // all feminine, so the questions can say "a manga", "a uva"
  fruits: ['Banana', 'Maçã', 'Manga', 'Uva', 'Laranja'],
  chartQs: (f, v, mx, mn) => [
    [`Quantas crianças escolheram ${f[1].toLowerCase()}?`, v[1]],
    ['Qual fruta foi a mais votada?', f[mx]],
    ['Qual fruta foi a menos votada?', f[mn]],
    [`Quantos votos a ${f[mx].toLowerCase()} teve a mais do que a ${f[mn].toLowerCase()}?`, v[mx] - v[mn]],
    ['Quantas crianças votaram ao todo?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { 'pre-escola': 'Pré-escola', '1-ano': '1º ano', '2-ano': '2º ano', '3-ano': '3º ano', '4-ano': '4º ano', '5-ano': '5º ano' },
  // "2º ano", "2º e 3º anos", "Do 3º ao 5º ano", "Pré-escola e 1º ano", "Da pré-escola ao 2º ano"
  yearsLabel: (ys, n) => {
    if (ys.length === 1) return n[ys[0]];
    const ord = y => n[y].replace(' ano', '');
    const first = ys[0], last = ys[ys.length - 1];
    if (first === 'pre-escola') return ys.length === 2 ? `Pré-escola e ${n[last]}` : `Da pré-escola ao ${n[last]}`;
    return ys.length === 2 ? `${ord(first)} e ${ord(last)} anos` : `Do ${ord(first)} ao ${n[last]}`;
  },
  name: 'Nome', date: 'Data', tip: 'Dica da Indie:', answers: 'Respostas',
  titleTag: t => `${t} – atividade do Beequation Kids`,
  footer: 'Pode ser copiada à vontade para usar em casa e na sala de aula. Mais atividades em <b>pt.beequation.com/learn</b>',
  promo: '<b>Pratique com a Indie.</b> Jogue grátis os desafios de favo de mel com números em pt.beequation.com, ou procure Beequation Kids no celular ou no tablet: sem anúncios, sem coleta de dados e sem cronômetro.',

  sheets: {
    // números e valor posicional
    'missing-numbers-to-100': { title: 'Sequências até 100', years: ['1-ano', '2-ano'],
      desc: 'Contando de 1 em 1, de 2 em 2, de 5 em 5 e de 10 em 10', how: 'Complete os números que faltam em cada sequência.',
      tip: 'Fale os números em voz alta enquanto conta. Seu ouvido percebe na hora quando um pulo não combina!' },
    'tens-and-ones': { title: 'Dezenas e unidades', years: ['1-ano', '2-ano'],
      desc: 'Decomponha números de dois algarismos', how: 'Decomponha cada número em dezenas e unidades.',
      tip: 'O algarismo da esquerda mostra quantas dezenas há. 47 tem 4 dezenas e 7 unidades: quatro barras e sete cubinhos do material dourado.' },
    'hundreds-tens-ones': { title: 'Centenas, dezenas e unidades', years: ['2-ano', '3-ano'],
      desc: 'Valor posicional até 999', how: 'Escreva cada número como centenas + dezenas + unidades.',
      tip: 'O zero guarda o lugar. Em 405 não há dezenas, mas é o 0 que segura o 4 na ordem das centenas.' },
    'rounding': { title: 'Arredondar números', years: ['3-ano', '4-ano'],
      desc: 'Para a dezena, a centena e o milhar mais próximos', how: 'Arredonde cada número para a dezena, a centena ou o milhar mais próximo, como indicado.',
      tip: 'Olhe o algarismo logo à direita da ordem para a qual você vai arredondar. Se for 5 ou mais, arredonde para cima; se for 4 ou menos, para baixo.' },
    // adição e subtração
    'number-bonds-to-10': { title: 'Pares que formam 10', years: ['pre-escola', '1-ano'],
      desc: 'Os fatos básicos do 10', how: 'Escreva o número que falta para formar 10.',
      tip: 'Use os dedos! Levante 7 dedos. Quantos ficaram abaixados? Esse é o número que falta para chegar a 10.' },
    'number-bonds-to-20': { title: 'Pares que formam 20', years: ['1-ano', '2-ano'],
      desc: 'Os fatos básicos do 20', how: 'Escreva o número que falta. Em todas as contas aparece o 20!',
      tip: 'Se você sabe que 3 + 7 = 10, também sabe que 13 + 7 = 20. Os pares que formam 10 ajudam com os que formam 20!' },
    'add-and-subtract-within-20': { title: 'Adição e subtração até 20', years: ['1-ano', '2-ano'],
      desc: 'Contas misturadas até 20', how: 'Resolva cada conta.',
      tip: 'Para subtrair, volte na reta numérica ou pense: quanto falta para ir do número menor até o maior?' },
    'column-addition': { title: 'Conta armada de adição', years: ['2-ano', '3-ano'],
      desc: 'Números de três algarismos, com “vai um”', how: 'Resolva cada conta armada. Comece pelas unidades!',
      tip: 'Se uma coluna der 10 ou mais, escreva só as unidades e “vai um” para a coluna seguinte. Anote o 1 bem pequenininho em cima dela para não esquecer.' },
    'column-subtraction': { title: 'Conta armada de subtração', years: ['2-ano', '3-ano'],
      desc: 'Números de três algarismos, com “empresta um”', how: 'Resolva cada conta armada do jeito que você aprendeu na escola. Comece pelas unidades!',
      tip: 'Faça a prova real com uma adição: se 532 − 178 = 354, então 354 + 178 tem que dar 532.' },
    // multiplicação e divisão
    'times-tables-2-5-10': { title: 'Tabuada do 2, do 5 e do 10', years: ['2-ano', '3-ano'],
      desc: 'Contas salteadas', how: 'Resolva cada multiplicação. Apareceu um 11 ou um 12? É um desafio extra: 5 × 11 é 5 × 10 e mais 5.',
      tip: 'Na tabuada do 10, todos os resultados terminam em 0. Na do 5, terminam em 0 ou em 5.' },
    'times-tables-3-4-8': { title: 'Tabuada do 3, do 4 e do 8', years: ['3-ano', '4-ano'],
      desc: 'Contas salteadas', how: 'Resolva cada multiplicação. Apareceu um 11 ou um 12? É um desafio extra: 4 × 11 é 4 × 10 e mais 4.',
      tip: 'A tabuada do 8 é o dobro da tabuada do 4. Se 4 × 6 = 24, então 8 × 6 = 48.' },
    'division-facts': { title: 'Divisões com a tabuada', years: ['3-ano', '4-ano'],
      desc: 'Use a tabuada para dividir', how: 'Resolva cada divisão (42 ÷ 6 se lê “42 dividido por 6”). Se alguma passar da tabuada, como 88 ÷ 11, é um desafio extra!',
      tip: 'A divisão é a operação inversa da multiplicação. Para 42 ÷ 6, pense: 6 vezes quanto dá 42?' },
    'short-multiplication': { title: 'Conta armada de multiplicação', years: ['3-ano', '4-ano'],
      desc: 'Números de três algarismos vezes um algarismo', how: 'Resolva cada conta armada. Comece pelas unidades!',
      tip: 'Se a multiplicação de uma ordem der 10 ou mais, escreva as unidades e anote em cima da coluna seguinte o que “vai”. Some esse número depois de multiplicar o próximo algarismo.' },
    // frações
    'what-fraction-is-shaded': { title: 'Que fração está pintada?', years: ['4-ano', '5-ano'],
      desc: 'Meios, terços, quartos e mais', how: 'Escreva a fração de cada figura que está pintada.',
      tip: 'Primeiro conte todas as partes iguais: esse é o número de baixo, o denominador. Depois conte as partes pintadas: esse é o de cima, o numerador.' },
    'fractions-of-amounts': { title: 'Fração de uma quantidade', years: ['4-ano', '5-ano'],
      desc: 'Como ½ de 12 ou ¾ de 20', how: 'Calcule cada resultado.',
      tip: 'Divida pelo número de baixo e multiplique pelo de cima. Para ¾ de 20: 20 ÷ 4 = 5, e 5 × 3 = 15.' },
    'equivalent-fractions': { title: 'Frações equivalentes', years: ['5-ano'],
      desc: 'Descubra o número que falta', how: 'Escreva o número que falta para que as duas frações sejam equivalentes.',
      tip: 'O que você faz embaixo, faz também em cima. ½ = ⁴⁄₈ porque os dois números foram multiplicados por 4.' },
    // números decimais e porcentagem
    'tenths-and-hundredths': { title: 'Décimos e centésimos', years: ['4-ano', '5-ano'],
      desc: 'Da fração ao número decimal', how: 'Escreva cada fração como número decimal.',
      tip: 'Os décimos ficam na primeira casa depois da vírgula, e os centésimos, na segunda. ⁷⁄₁₀₀ é 0,07, como 7 centavos são R$ 0,07.' },
    'percentages-of-amounts': { title: 'Porcentagem de uma quantidade', years: ['5-ano'],
      desc: '10%, 25%, 50%, 75% e mais', how: 'Calcule cada resultado.',
      tip: 'Para achar 10%, divida por 10. Depois é só montar: 30% são três vezes 10%, e 5% é a metade de 10%. E 50% é a metade, e 25%, a quarta parte.' },
    // ver as horas
    'time-oclock-and-half-past': { title: 'Horas exatas e meia hora', years: ['1-ano', '2-ano'],
      desc: 'Leia os relógios de ponteiros', how: 'Escreva a hora que cada relógio marca.',
      tip: 'O ponteiro pequeno mostra a hora. O grande mostra os minutos: apontando para o 12, é hora exata (três horas); apontando para o 6, é meia hora (três e meia).' },
    'time-quarter-past-and-to': { title: 'E quinze, e meia e quinze para', years: ['2-ano', '3-ano'],
      desc: 'Leia os relógios de ponteiros', how: 'Escreva por extenso a hora que cada relógio marca.',
      tip: 'E quinze: o ponteiro grande aponta para o 3. Quinze para: ele aponta para o 9, e o pequeno já está quase chegando à hora seguinte. Às 3:45 faltam 15 minutos para as quatro: são quinze para as quatro.' },
    'time-to-5-minutes': { title: 'As horas de 5 em 5 minutos', years: ['3-ano', '4-ano'],
      desc: 'Leia os relógios de ponteiros', how: 'Escreva cada hora por extenso e como no relógio digital. Toda hora acontece duas vezes por dia: escreva as duas, por exemplo 3:40 ou 15:40.',
      tip: 'Conte de 5 em 5 enquanto o ponteiro grande dá a volta: de um número ao outro são 5 minutos. Depois do 6, você pode dizer quanto falta para a próxima hora: no 8 faltam 20 minutos, então são “vinte para as…”.' },
    // dinheiro
    'counting-coins': { title: 'Contar moedas', years: ['2-ano', '3-ano'],
      desc: 'Somando as moedas do real', how: 'Quanto dinheiro há em cada grupo de moedas? Escreva o total em reais (c = centavos).',
      tip: 'Comece pela moeda que vale mais e vá somando: R$ 1,00, mais 50 centavos dá R$ 1,50, mais 25 dá R$ 1,75, mais 10 dá R$ 1,85…' },
    'giving-change': { title: 'Quanto é o troco?', years: ['3-ano', '4-ano'],
      desc: `Pagando com R$${NBSP}2, R$${NBSP}5 e R$${NBSP}10`, how: 'Calcule o troco de cada compra.',
      tip: 'Conte do preço até o valor que você deu. De R$ 3,65 até R$ 5,00: mais 5 centavos dá R$ 3,70, mais 30 centavos dá R$ 4,00 e mais R$ 1,00 dá R$ 5,00. O troco é R$ 1,35.' },
    // medidas
    'perimeter-and-area': { title: 'Perímetro e área', years: ['4-ano', '5-ano'],
      desc: 'Retângulos na malha quadriculada', how: 'Cada quadradinho tem 1 cm de lado. Calcule o perímetro e a área de cada retângulo.',
      tip: 'O perímetro é a medida do contorno: some todos os lados. A área é o número de quadradinhos que cabem dentro.' },
    // geometria e figuras
    '2d-shapes': { title: 'Figuras planas', years: ['3-ano', '4-ano', '5-ano'],
      desc: 'Nomes, lados e vértices', how: 'Escreva o nome de cada figura e conte seus lados e seus vértices (os cantos).',
      tip: 'Faça um pontinho em cada canto enquanto conta: assim você não conta nenhum duas vezes. E o nome ajuda: “penta” quer dizer 5, e “hexa”, 6.' },
    // gráficos e tabelas
    'reading-bar-charts': { title: 'Ler um gráfico de colunas', years: ['2-ano', '3-ano'],
      desc: 'Pesquisa da fruta preferida', how: 'A turma do 3º ano votou na sua fruta preferida. Observe o gráfico de colunas e responda às perguntas.',
      tip: 'Coloque o dedo no alto da coluna e leve-o reto até os números do lado: é ali que você lê quanto ela vale.' },
    // álgebra e proporcionalidade
    'missing-number-problems': { title: 'Descubra o número que falta', years: ['4-ano', '5-ano'],
      desc: 'Qual número está escondido no quadradinho?', how: 'Encontre o número que falta em cada igualdade.',
      tip: 'Use a operação inversa. Para ▢ + 7 = 15, calcule 15 − 7. Para 3 × ▢ = 24, calcule 24 ÷ 3.' },
  },
};
