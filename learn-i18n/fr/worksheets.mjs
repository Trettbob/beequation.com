// France: the words, formats and school years of the printable worksheets (read by tools/make-worksheets.mjs --lang fr).
// Follows learn-i18n/fr/BRIEF.md: decimal comma, a space for thousands (6 234), × and ÷, euros written 2,50 €,
// the clock as French children say it (« et quart », « et demie », « moins le quart »), the years GS to CM2.
// Consignes and Indie's tips speak to the child with « tu »; the footer and promo stay neutral (they are read by adults).
// Sheets left out: multiplication-check-practice (England's Year 4 check; France has no national times-tables test)
// and percentages-of-amounts (percentages are taught in 6e, not in primary school).

const NB = ' ';   // non-breaking space: thousands, before « : ? », between a number and its unit

const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB);

// clock times in words, h from 1 to 12 on the dial (midi / minuit are not used: a dial does not say which)
const HOURS = ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'];
const MINUTES = { 5: 'cinq', 10: 'dix', 20: 'vingt', 25: 'vingt-cinq' };
const heures = h => `${HOURS[h]} heure${h === 1 ? '' : 's'}`;
const timeWords = (h, m) => {
  const hh = h % 12 || 12, next = (hh % 12) + 1;
  if (m === 0) return heures(hh);
  if (m === 15) return `${heures(hh)} et quart`;
  if (m === 30) return `${heures(hh)} et demie`;
  if (m === 45) return `${heures(next)} moins le quart`;
  return m < 30 ? `${heures(hh)} ${MINUTES[m]}` : `${heures(next)} moins ${MINUTES[60 - m]}`;
};

// amounts in centimes: 0,65 €, 3,45 €, and whole euros as 2 €
const money = c => {
  const e = Math.floor(c / 100), r = c % 100;
  return r === 0 ? `${e}${NB}€` : `${e},${String(r).padStart(2, '0')}${NB}€`;
};

const COPPER = '#D9895B', GOLD = '#E6C25A', SILVER = '#D7DCE3';

// rounding: the place is named, not written as a number
const PLACE = { 10: 'à la dizaine près', 100: 'à la centaine près', 1000: 'au millier près' };

// fruit names with their article (le raisin, les pommes)
const art = f => (f.endsWith('s') ? 'les ' : 'le ') + f.toLowerCase();

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Horloge${NB}: la grande aiguille pointe sur ${minute} et la petite aiguille pointe sur ${hour}`
      : `Horloge${NB}: la grande aiguille pointe sur ${minute} et la petite aiguille est entre ${hour} et ${next}`;
  },
  shapeAlt: n => `Figure ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind} avec ${shaded} parties coloriées sur ${total} parties égales`,
  fractionKinds: {"bar": "Bande", "circle": "Disque", "grid": "Quadrillage"},
  coinAlt: value => `Pièce de ${value}`,
  rectangleAlt: (w, h) => `Rectangle sur un quadrillage de ${w} colonnes et ${h} lignes de carrés de 1 cm de côté`,
  chartAlt: "Diagramme en barres des votes pour les fruits préférés ; les valeurs figurent dans le tableau ci-dessous",
  chartFruit: "Fruit", chartVotes: "Votes",
  htmlLang: 'fr',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '×', div: '÷',
  tensOnes: b => `${b} dizaines et ${b} unités`,
  tensOnesA: (t, o) => `${t} dizaine${t > 1 ? 's' : ''}, ${o} unité${o > 1 ? 's' : ''}`,
  roundQ: (n, to, b) => `<b class="n">${n}</b> ${PLACE[to.replace(/\D/g, '')]} → ${b}`,
  of: (f, x) => `${f} de ${x}`,
  pctOf: (p, x) => `${p}${NB}% de ${x}`,
  timeWords,
  digital: (h, m) => `${h % 12 || 12}${NB}h${NB}${String(m).padStart(2, '0')}`,
  money,
  coinValues: [1, 2, 5, 10, 20, 50],
  coinLabel: v => v >= 100 ? `${v / 100}${NB}€` : `${v}${NB}c`,
  // euro coins: fill (outer colour), real diameter in mm, shape
  coins: {
    1: [COPPER, 16.25, 'circle'], 2: [COPPER, 18.75, 'circle'], 5: [COPPER, 21.25, 'circle'],
    10: [GOLD, 19.75, 'circle'], 20: [GOLD, 22.25, 'circle'], 50: [GOLD, 24.25, 'circle'],
    100: [GOLD, 23.25, 'circle'], 200: [SILVER, 25.75, 'circle'],
  },
  // 1 €: gold-coloured ring, silver-coloured centre; 2 €: silver-coloured ring, gold-coloured centre
  coinInner: v => v === 100 ? SILVER : v === 200 ? GOLD : null,
  paid: [100, 200, 500],
  shopItems: ['un crayon', 'une gomme', 'une pomme', 'un pain au chocolat', 'un jus de fruits', 'un cahier', 'des autocollants', 'une petite voiture'],
  changeQ: (item, cost, paid, b) => `Tu achètes ${item} à ${cost} et tu paies avec ${paid}. On te rend${NB}: ${b}`,
  perimQ: b => `<div class="ansline">Périmètre ${b} cm</div><div class="ansline">Aire ${b} cm²</div>`,
  perimA: (p, a) => `périmètre ${p}${NB}cm, aire ${a}${NB}cm²`,
  shapes: { 3: 'triangle', 4: 'carré', rect: 'rectangle', 5: 'pentagone', 6: 'hexagone', 8: 'octogone', 0: 'disque', 7: 'heptagone', 10: 'décagone' },
  shapeQ: b => `<div class="ansline wide">Nom${NB}:</div><div class="ansline">Côtés ${b} Sommets ${b}</div>`,
  shapeA: (name, n) => n === 0 ? `${name}${NB}: 0 côté, 0 sommet` : `${name}${NB}: ${n} côtés, ${n} sommets`,
  fruits: ['Pommes', 'Bananes', 'Raisin', 'Oranges', 'Poires'],
  chartQs: (f, v, mx, mn) => [
    [`Combien d’enfants ont voté pour ${art(f[1])}${NB}?`, v[1]],
    [`Quel fruit a eu le plus de voix${NB}?`, art(f[mx])],
    [`Quel fruit a eu le moins de voix${NB}?`, art(f[mn])],
    [`Combien d’enfants de plus ont voté pour ${art(f[mx])} que pour ${art(f[mn])}${NB}?`, v[mx] - v[mn]],
    [`Combien d’enfants ont voté en tout${NB}?`, v.reduce((a, b) => a + b, 0)],
  ],
  years: { 'grande-section': 'Grande section', cp: 'CP', ce1: 'CE1', ce2: 'CE2', cm1: 'CM1', cm2: 'CM2' },
  yearsLabel: (ys, n) => {
    if (ys.length <= 2) return ys.map(y => n[y]).join(' et ');
    const first = ys[0] === 'grande-section' ? `de la ${n[ys[0]].toLowerCase()}` : `du ${n[ys[0]]}`;
    return `${first} au ${n[ys[ys.length - 1]]}`;
  },
  name: 'Prénom', date: 'Date', tip: `L’astuce d’Indie${NB}:`, answers: 'Corrigé',
  titleTag: t => `${t}${NB}: fiche d’exercices Beequation Kids`,
  footer: 'Photocopie libre pour la maison et la classe. D’autres fiches sur <b>fr.beequation.com/learn</b>',
  promo: `<b>S’entraîner avec Indie.</b> Des grilles en alvéoles gratuites sur fr.beequation.com, et l’app Beequation Kids sur téléphone ou tablette${NB}: sans pub, sans collecte de données, sans chrono.`,

  sheets: {
    // nombres et numération
    'missing-numbers-to-100': { title: 'Suites de nombres jusqu’à 100', years: ['cp', 'ce1'],
      desc: 'Compter de 1 en 1, de 2 en 2, de 5 en 5 et de 10 en 10',
      how: 'Complète chaque suite avec les nombres qui manquent.',
      tip: `Dis les nombres à voix haute en comptant${NB}: ton oreille repère vite un saut qui cloche${NB}!` },
    'tens-and-ones': { title: 'Dizaines et unités', years: ['cp'],
      desc: 'Décomposer les nombres à deux chiffres',
      how: 'Écris combien il y a de dizaines et d’unités dans chaque nombre.',
      tip: `Le chiffre de gauche donne les dizaines${NB}: 47, c’est 4 dizaines et 7 unités. Attention, 73 se dit «${NB}soixante-treize${NB}», mais c’est bien 7 dizaines et 3 unités${NB}!` },
    'hundreds-tens-ones': { title: 'Centaines, dizaines et unités', years: ['ce1'],
      desc: `La numération jusqu’à 1${NB}000`,
      how: 'Décompose chaque nombre en centaines + dizaines + unités.',
      tip: 'Le zéro garde la place. Dans 405, il n’y a pas de dizaines, mais le 0 laisse le 4 au rang des centaines.' },
    'rounding': { title: 'Arrondir les nombres', years: ['cm1', 'cm2'],
      desc: 'À la dizaine, à la centaine et au millier près',
      how: 'Arrondis chaque nombre comme indiqué. C’est très utile pour trouver un ordre de grandeur.',
      tip: `Regarde le chiffre juste à droite du rang demandé${NB}: si c’est 5 ou plus, on arrondit au-dessus.` },
    // addition et soustraction
    'number-bonds-to-10': { title: 'Compléments à 10', years: ['grande-section', 'cp'],
      desc: 'Les paires de nombres qui font 10',
      how: 'Écris le nombre qui manque pour faire 10.',
      tip: `Aide-toi de tes doigts${NB}! Lève 7 doigts${NB}: combien en reste-t-il de baissés${NB}? Ensemble, ça fait 10.` },
    'number-bonds-to-20': { title: 'Compléments à 20', years: ['cp', 'ce1'],
      desc: 'Les paires de nombres qui font 20',
      how: `Complète chaque calcul${NB}: tout tourne autour du nombre 20.`,
      tip: `Si tu sais que 3 + 7 = 10, alors tu sais aussi que 13 + 7 = 20. Les compléments à 10 t’aident pour ceux à 20${NB}!` },
    'add-and-subtract-within-20': { title: 'Additions et soustractions jusqu’à 20', years: ['cp', 'ce1'],
      desc: 'Calculs mélangés jusqu’à 20',
      how: 'Calcule chaque résultat.',
      tip: `Pour une soustraction, recule sur la bande numérique, ou demande-toi${NB}: combien faut-il ajouter au petit nombre pour arriver au grand${NB}?` },
    'column-addition': { title: 'Additions posées', years: ['ce1', 'ce2'],
      desc: 'Nombres à trois chiffres, avec retenues',
      how: `Calcule chaque addition posée. Commence par les unités${NB}!`,
      tip: `Si une colonne fait 10 ou plus, écris les unités et mets la retenue en haut de la colonne suivante${NB}: «${NB}je pose 2 et je retiens 1${NB}».` },
    'column-subtraction': { title: 'Soustractions posées', years: ['ce1', 'ce2'],
      desc: 'Nombres à trois chiffres, par cassage ou par compensation',
      how: `Calcule chaque soustraction posée avec la méthode apprise en classe. Commence par les unités${NB}!`,
      tip: `Fais la preuve avec une addition${NB}: si 532 − 178 = 354, alors 354 + 178 doit redonner 532.` },
    // multiplication et division
    'times-tables-2-5-10': { title: 'Tables de 2, de 5 et de 10', years: ['ce1'],
      desc: 'Calculs mélangés',
      how: `Calcule chaque résultat. Quelques calculs vont jusqu’à 11 ou 12 fois${NB}: un petit défi en plus${NB}!`,
      tip: `Dans la table de 10, tous les résultats finissent par 0${NB}; dans la table de 5, par 0 ou par 5.` },
    'times-tables-3-4-8': { title: 'Tables de 3, de 4 et de 8', years: ['ce1', 'ce2'],
      desc: 'Calculs mélangés',
      how: `Calcule chaque résultat. Quelques calculs vont jusqu’à 11 ou 12 fois${NB}: un petit défi en plus${NB}!`,
      tip: 'La table de 8, c’est le double de la table de 4. Si 4 × 6 = 24, alors 8 × 6 = 48.' },
    'multiplication-grid': { title: 'La table de Pythagore', years: ['ce2', 'cm1'],
      desc: 'Remplir la grille des tables de multiplication',
      how: 'Multiplie le nombre au début de chaque ligne par le nombre en haut de chaque colonne. Les lignes et les colonnes 11 et 12 sont un défi en plus.',
      tip: `Remplis d’abord les lignes faciles (1, 2, 5 et 10). Ensuite, sers-toi des cases déjà remplies${NB}: 3 × 7, c’est pareil que 7 × 3.` },
    'division-facts': { title: 'Diviser avec les tables', years: ['ce2', 'cm1'],
      desc: 'Se servir des tables de multiplication pour diviser',
      how: 'Calcule chaque résultat.',
      tip: `La division est l’opération inverse de la multiplication. Pour 42 ÷ 6, demande-toi${NB}: 6 fois combien font 42${NB}?` },
    'short-multiplication': { title: 'Multiplications posées', years: ['ce2', 'cm1'],
      desc: 'Un nombre à trois chiffres par un nombre à un chiffre',
      how: 'Calcule chaque multiplication posée.',
      tip: 'Commence par les unités. Note la retenue en haut de la colonne suivante et ajoute-la après avoir multiplié.' },
    // fractions
    'what-fraction-is-shaded': { title: `Quelle fraction est coloriée${NB}?`, years: ['ce1', 'ce2'],
      desc: 'Demis, tiers, quarts et plus',
      how: 'Écris la fraction de chaque figure qui est coloriée.',
      tip: `Compte d’abord toutes les parts égales${NB}: c’est le nombre du bas. Puis compte les parts coloriées${NB}: c’est le nombre du haut.` },
    'fractions-of-amounts': { title: 'Fraction d’une quantité', years: ['cm2'],
      desc: 'Comme ½ de 12 ou ¾ de 20',
      how: 'Calcule chaque résultat.',
      tip: `Divise par le nombre du bas, puis multiplie par celui du haut. Pour ¾ de 20${NB}: 20 ÷ 4 = 5, puis 5 × 3 = 15.` },
    'equivalent-fractions': { title: 'Fractions égales', years: ['cm1', 'cm2'],
      desc: 'Trouver le nombre qui manque',
      how: 'Écris le nombre qui manque pour que les deux fractions soient égales.',
      tip: 'Ce que tu fais au nombre du bas, fais-le aussi au nombre du haut. ½ = ⁴⁄₈, car on a multiplié les deux nombres par 4.' },
    // nombres décimaux
    'tenths-and-hundredths': { title: 'Dixièmes et centièmes', years: ['cm1', 'cm2'],
      desc: 'Des fractions décimales aux nombres à virgule',
      how: 'Écris chaque fraction sous la forme d’un nombre à virgule.',
      tip: 'Les dixièmes se placent au premier rang après la virgule, les centièmes au deuxième. ⁷⁄₁₀₀ s’écrit 0,07.' },
    // lire l'heure
    'time-oclock-and-half-past': { title: 'Heures justes et demi-heures', years: ['ce1'],
      desc: 'Lire l’heure sur une horloge à aiguilles',
      how: 'Écris en lettres l’heure indiquée par chaque horloge.',
      tip: `La petite aiguille montre les heures. La grande aiguille montre les minutes${NB}: sur le 12, c’est l’heure juste${NB}; sur le 6, c’est «${NB}et demie${NB}».` },
    'time-quarter-past-and-to': { title: 'Et quart, moins le quart', years: ['ce1'],
      desc: 'Lire l’heure sur une horloge à aiguilles',
      how: 'Écris en lettres l’heure indiquée par chaque horloge.',
      tip: `«${NB}Et quart${NB}»${NB}: la grande aiguille est sur le 3. «${NB}Moins le quart${NB}»${NB}: elle est sur le 9, et la petite aiguille arrive presque à l’heure suivante.` },
    'time-to-5-minutes': { title: 'L’heure de 5 en 5 minutes', years: ['ce2'],
      desc: 'Lire l’heure sur une horloge à aiguilles',
      how: 'Écris chaque heure en lettres, puis en chiffres.',
      tip: `Compte de 5 en 5 quand la grande aiguille avance${NB}: chaque nombre du cadran, c’est 5 minutes de plus.` },
    // la monnaie
    'counting-coins': { title: 'Compter les pièces', years: ['ce1', 'ce2'],
      desc: 'Additionner des pièces en euros et en centimes',
      how: `Combien d’argent y a-t-il dans chaque porte-monnaie${NB}? Écris le total.`,
      tip: `Commence par la pièce qui vaut le plus, puis ajoute les autres${NB}: 20${NB}c, 30${NB}c, 35${NB}c, 36${NB}c… Et n’oublie pas${NB}: 100 centimes font 1${NB}€.` },
    'giving-change': { title: 'Rendre la monnaie', years: ['ce1', 'ce2'],
      desc: `La monnaie sur 1${NB}€, 2${NB}€ et 5${NB}€`,
      how: 'Calcule la monnaie qu’on te rend pour chaque achat.',
      tip: `Avance du prix jusqu’à la somme donnée. De 0,65${NB}€ à 1${NB}€${NB}: 5${NB}c pour arriver à 0,70${NB}€, puis 30${NB}c pour arriver à 1${NB}€. On te rend 0,35${NB}€.` },
    // grandeurs et mesures
    'perimeter-and-area': { title: 'Périmètre et aire', years: ['cm1', 'cm2'],
      desc: 'Des rectangles sur un quadrillage en centimètres',
      how: 'Chaque carreau mesure 1 cm de côté. Trouve le périmètre et l’aire de chaque rectangle.',
      tip: `Le périmètre, c’est la longueur du tour${NB}: additionne les côtés. L’aire, c’est le nombre de carreaux à l’intérieur.` },
    // géométrie
    '2d-shapes': { title: 'Les figures planes', years: ['cm1', 'cm2'],
      desc: 'Noms, côtés et sommets',
      how: 'Écris le nom de chaque figure, puis compte ses côtés et ses sommets.',
      tip: `Fais un petit point sur chaque sommet en comptant${NB}: tu n’en compteras aucun deux fois. Et moi, je suis un hexagone${NB}: 6 côtés${NB}!` },
    // tableaux et graphiques
    'reading-bar-charts': { title: 'Lire un diagramme en barres', years: ['cp', 'ce1', 'ce2'],
      desc: 'Le sondage des fruits préférés',
      how: 'Les élèves d’une classe ont voté pour leur fruit préféré. Lis le diagramme en barres pour répondre aux questions.',
      tip: 'Pose ton doigt en haut de la barre et glisse jusqu’aux nombres sur le côté pour lire sa valeur.' },
    // algèbre
    'missing-number-problems': { title: 'Égalités à trous', years: ['ce2', 'cm1', 'cm2'],
      desc: 'Trouver le nombre qui manque',
      how: 'Trouve le nombre qui manque dans chaque égalité.',
      tip: `Sers-toi de l’opération inverse. Pour ▢ + 7 = 15, calcule 15 − 7. Pour 3 × ▢ = 24, calcule 24 ÷ 3.` },
  },
};
