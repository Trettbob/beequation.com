// India, English (in): the printable worksheets' words, formats and pictures, and which sheets Indian schools use.
// Read by tools/make-worksheets.mjs --lang in (see learn-i18n/README.md and learn-i18n/in/BRIEF.md).
// Indian English as Indian schools write it: Classes 1 to 5, "carrying" and "borrowing", "tables", British spelling.
// Numbers use the Indian place-value grouping (1,000 / 10,000 / 1,00,000 / 10,00,000). Money is in whole rupees
// (₹): paise are not used in children's everyday sums any more, so the generator's smallest unit is ₹1 (like yen and
// won, see README). Coins: ₹1, ₹2, ₹5, ₹10 and ₹20 of the current series (2019 onwards); notes: ₹10, ₹20, ₹50, ₹100,
// ₹200, ₹500. Clock times: "3 o'clock", "half past 3", "quarter past 3", "quarter to 4", "10 minutes past 3".
//
// Left out:
// - multiplication-check-practice: England's timed national check; India has no such test (tables are learnt by heart
//   and checked in class).

// Indian grouping: the last three digits, then pairs (1,00,000 = one lakh; 10,00,000 = ten lakh; 1,00,00,000 = one crore)
const num = n => {
  const s = String(Math.abs(n)), last = s.slice(-3), rest = s.slice(0, -3);
  return (n < 0 ? '−' : '') + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last : last);
};
const rupees = v => `₹${num(v)}`;

// coin colours (Reserve Bank of India, coins of the 2019 series): ₹1 and ₹2 stainless steel; ₹5 nickel-brass;
// ₹10 a brass-coloured ring with a steel-coloured centre; ₹20 a 12-sided steel-coloured ring with a brass-coloured centre
const STEEL = '#D3D7DC';
const BRASS = '#E2C15A';

const NAMES = { 'class-1': 'Class 1', 'class-2': 'Class 2', 'class-3': 'Class 3', 'class-4': 'Class 4', 'class-5': 'Class 5' };

export default {
  // Text alternatives describe the picture, without adding a worked answer (as in English).
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Clock: the minute hand points to ${minute} and the hour hand points to ${hour}`
      : `Clock: the minute hand points to ${minute} and the hour hand is between ${hour} and ${next}`;
  },
  shapes: { 3: 'triangle', 4: 'square', rect: 'rectangle', 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 0: 'circle', 7: 'heptagon', 10: 'decagon' },
  htmlLang: 'en-IN',
  num,
  mul: '×', div: '÷',
  tensOnes: b => `${b} tens and ${b} ones`, tensOnesA: (t, o) => `${t} tens, ${o} ones`,

  // money in whole rupees: "₹35", "₹1,250"
  money: v => rupees(v),
  coinValues: [1, 2, 5, 10, 20],
  coinLabel: v => `₹${v}`,
  coinAlt: value => `${value} coin`,
  // value: [fill, real diameter in mm, 'circle' | number of sides]
  coins: { 1: [STEEL, 20, 'circle'], 2: [STEEL, 23, 'circle'], 5: [BRASS, 25, 'circle'], 10: [BRASS, 27, 'circle'], 20: [STEEL, 27, 12] },
  coinInner: v => (v === 10 ? STEEL : v === 20 ? BRASS : null),
  // paying with a ₹20, ₹50 or ₹100 note; prices in whole rupees
  paid: [20, 50, 100], costStep: 1,
  shopItems: ['a pencil', 'a samosa', 'a comic', 'a juice', 'a notebook', 'some stickers', 'an eraser', 'a packet of biscuits'],
  changeQ: (item, cost, paid, b) => `You buy ${item} for ${cost} and pay with ${paid}. Change: ${b}`,

  fruits: ['Mangoes', 'Bananas', 'Apples', 'Guavas', 'Grapes'],

  years: NAMES,
  // "Class 3", "Classes 1 and 2", "Classes 3 to 5"
  yearsLabel: (ys, n) => {
    const k = ys.map(y => n[y].replace('Class ', ''));
    return ys.length === 1 ? n[ys[0]] : ys.length > 2 ? `Classes ${k[0]} to ${k[k.length - 1]}` : `Classes ${k.join(' and ')}`;
  },
  titleTag: t => `${t} worksheet: Beequation Kids`,
  promo: '<b>Practise with Indie.</b> Play free honeycomb number puzzles at in.beequation.com, or look for Beequation Kids on your phone or tablet: no ads, no tracking, no timers.',

  sheets: {
    // counting and place value
    'missing-numbers-to-100': { title: 'Missing numbers to 100', years: ['class-1', 'class-2'],
      desc: 'Count in 1s, 2s, 5s and 10s', how: 'Fill in the missing numbers in each sequence.',
      tip: 'Say the numbers out loud as you count. Your ears can spot a jump that looks wrong!' },
    'tens-and-ones': { title: 'Tens and ones', years: ['class-1', 'class-2'],
      desc: 'Break two-digit numbers into tens and ones', how: 'Split each number into tens and ones.',
      tip: 'The digit on the left tells you how many tens. 47 is 4 tens and 7 ones.' },
    'hundreds-tens-ones': { title: 'Hundreds, tens and ones', years: ['class-2', 'class-3'],
      desc: 'Place value up to 999', how: 'Write each number as hundreds + tens + ones (its expanded form).',
      tip: 'A zero keeps a place empty. In 405 there are no tens, but the 0 keeps the 4 in the hundreds place.' },
    rounding: { title: 'Rounding off numbers', years: ['class-4', 'class-5'],
      desc: 'Round off to the nearest 10, 100 and 1,000', how: 'Round off each number as shown.',
      tip: 'Look at the digit just to the right of the place you are rounding to. 5 or more rounds up.' },
    // addition and subtraction
    'number-bonds-to-10': { title: 'Pairs that make 10', years: ['class-1'],
      desc: 'Number pairs that add up to 10', how: 'Write the missing number to make 10.',
      tip: 'Use your fingers! Hold up 7 fingers. How many are still down? That makes 10.' },
    'number-bonds-to-20': { title: 'Pairs that make 20', years: ['class-1', 'class-2'],
      desc: 'Number pairs that add up to 20', how: 'Write the missing number to make 20.',
      tip: 'If you know 3 + 7 = 10, then 13 + 7 = 20. Pairs that make 10 help with pairs that make 20!' },
    'add-and-subtract-within-20': { title: 'Adding and subtracting up to 20', years: ['class-1', 'class-2'],
      desc: 'Mixed sums up to 20', how: 'Work out each answer.',
      tip: 'For take-away sums, count back on a number line, or think: what do I add to the small number to get the big one?' },
    'column-addition': { title: 'Addition with carrying', years: ['class-3'],
      desc: 'Three-digit numbers in columns, with carrying', how: 'Add in columns. Start with the ones!',
      tip: 'If a column adds up to 10 or more, carry 1 ten (or 1 hundred) over to the next column.' },
    'column-subtraction': { title: 'Subtraction with borrowing', years: ['class-3'],
      desc: 'Three-digit numbers in columns, with borrowing', how: 'Subtract in columns. Start with the ones!',
      tip: 'Check a subtraction with an addition: if 532 − 178 = 354, then 354 + 178 should be 532.' },
    // multiplication and division
    'times-tables-2-5-10': { title: 'Tables of 2, 5 and 10', years: ['class-2', 'class-3'],
      desc: 'Mixed questions from the tables', how: 'Work out each answer.',
      tip: 'Every answer in the table of 10 ends in 0, and every answer in the table of 5 ends in 0 or 5.' },
    'times-tables-3-4-8': { title: 'Tables of 3, 4 and 8', years: ['class-3'],
      desc: 'Mixed questions from the tables', how: 'Work out each answer.',
      tip: 'The table of 8 is the table of 4 doubled. If 4 × 6 = 24, then 8 × 6 = 48.' },
    'multiplication-grid': { title: 'Multiplication grid', years: ['class-3', 'class-4', 'class-5'],
      desc: 'Fill in the 12 × 12 grid', how: 'Multiply the number at the start of each row by the number at the top of each column.',
      tip: 'Fill in the easy rows first (1, 2, 5, 10, 11). Then use the grid\'s pattern: 3 × 7 is the same as 7 × 3.' },
    'division-facts': { title: 'Division using tables', years: ['class-3', 'class-4'],
      desc: 'Use the tables to divide', how: 'Work out each answer.',
      tip: 'Division is the reverse of multiplication. For 42 ÷ 6, ask: 6 times what makes 42?' },
    'short-multiplication': { title: 'Multiplying by a one-digit number', years: ['class-4', 'class-5'],
      desc: 'Three-digit numbers × one-digit numbers, in columns', how: 'Multiply in columns.',
      tip: 'Start with the ones. Carry the tens over to the next column and add them after you multiply.' },
    // fractions
    'what-fraction-is-shaded': { title: 'What fraction is shaded?', years: ['class-2', 'class-3', 'class-4'],
      desc: 'Halves, thirds, quarters and more', how: 'Write the fraction of each shape that is shaded.',
      tip: 'Count all the equal parts first: that is the denominator, the bottom number. Then count the shaded parts: that is the numerator, on top.' },
    'fractions-of-amounts': { title: 'Fraction of a number', years: ['class-4', 'class-5'],
      desc: 'Like ½ of 12 and ¾ of 20', how: 'Work out each answer.',
      tip: 'Divide by the denominator, then multiply by the numerator. For ¾ of 20: 20 ÷ 4 = 5, then 5 × 3 = 15.' },
    'equivalent-fractions': { title: 'Equivalent fractions', years: ['class-4', 'class-5'],
      desc: 'Find the missing number', how: 'Write the missing number so the fractions are equal.',
      tip: 'Whatever you do to the denominator, do the same to the numerator. ½ = ⁴⁄₈ because both numbers were multiplied by 4.' },
    // decimals and percentages
    'tenths-and-hundredths': { title: 'Tenths and hundredths', years: ['class-4', 'class-5'],
      desc: 'Fractions as decimals', how: 'Write each fraction as a decimal.',
      tip: 'Tenths go in the first place after the decimal point, hundredths in the second. ⁷⁄₁₀₀ is 0.07.' },
    'percentages-of-amounts': { title: 'Percentage of a number', years: ['class-5'],
      desc: '10%, 25%, 50% and more', how: 'Work out each answer.',
      tip: 'Find 10% by dividing by 10. Then build up: 30% is three lots of 10%, and 5% is half of 10%.' },
    // time
    'time-oclock-and-half-past': { title: "O'clock and half past", years: ['class-1', 'class-2'],
      desc: 'Read the clocks', how: 'Write the time shown on each clock.',
      tip: 'The short hand shows the hour. The long hand shows the minutes: pointing at 12 means o\'clock, at 6 means half past.' },
    'time-quarter-past-and-to': { title: 'Quarter past and quarter to', years: ['class-2', 'class-3'],
      desc: 'Read the clocks', how: 'Write the time shown on each clock in words.',
      tip: 'Quarter past: the long hand points at 3. Quarter to: it points at 9, and the short hand is nearly at the next hour.' },
    'time-to-5-minutes': { title: 'Time to 5 minutes', years: ['class-3'],
      desc: 'Read the clocks', how: 'Write each time in words and as a digital time.',
      tip: 'Count in 5s as the long hand goes round: each number on the clock is 5 more minutes.' },
    // money
    'counting-coins': { title: 'Counting coins', years: ['class-1', 'class-2'],
      desc: 'Add up Indian coins', how: 'How much money is in each purse? Write the total.',
      tip: 'Start with the coin worth the most, then count on. ₹20, ₹30, ₹35, ₹36…' },
    'giving-change': { title: 'How much change?', years: ['class-2', 'class-3'],
      desc: 'Change from ₹20, ₹50 and ₹100', how: 'Work out the change for each shopping trip.',
      tip: 'Count up from the price to the money you paid. From ₹35 to ₹50: ₹5 makes ₹40, then ₹10 makes ₹50. The change is ₹15.' },
    // measurement
    'perimeter-and-area': { title: 'Perimeter and area', years: ['class-4', 'class-5'],
      desc: 'Rectangles on a centimetre grid', how: 'Each square is 1 cm by 1 cm. Find the perimeter and area of each rectangle.',
      tip: 'Perimeter is the distance all the way round (add the sides). Area is the number of squares inside.' },
    // shapes
    '2d-shapes': { title: '2D shapes', years: ['class-1', 'class-2'],
      desc: 'Names, sides and corners', how: 'Name each shape and count its sides and vertices (corners).',
      tip: 'Put a dot on each corner as you count, so you don\'t count one twice.' },
    // data handling
    'reading-bar-charts': { title: 'Reading a bar graph', years: ['class-4', 'class-5'],
      desc: 'Favourite fruit survey', how: 'Class 3 voted for their favourite fruit. Use the bar graph to answer the questions.',
      tip: 'Run your finger from the top of the bar across to the numbers on the side to read its value.' },
    // patterns and algebra
    'missing-number-problems': { title: 'Find the missing number', years: ['class-3', 'class-4', 'class-5'],
      desc: 'Find the number in the box', how: 'Find the missing number in each number sentence.',
      tip: 'Do the reverse. For ▢ + 7 = 15, work out 15 − 7. For 3 × ▢ = 24, work out 24 ÷ 3.' },
  },
};
