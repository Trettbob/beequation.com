const T = {
  locale: 'da',
  indie: 'Bien Indie', back: 'Tilbage', close: 'Luk', quit: 'Afslut', settings: 'Indstillinger', frac: s => s.replace('/', ' delt med '),
  switchApp: 'Skift app', siteAria: 'Beequation: tilbage til beequation.com',
  tiers: ['Æg', 'Larve', 'Summebi', 'Arbejderbi', 'Samlerbi', 'Vagtbi', 'Prinsesse', 'Dronning'],
  ages: ['5+', '6+', '7+', '8+', '10+', '12+', 'Unge og voksne', 'Eksperter'],
  modes: { add: ['Plus', 'Find summen af to andre tal'], mul: ['Gange', 'Find produktet af to andre tal'], neg: ['Negative tal', 'Regn med tal under nul'],
    frac: ['Brøker', 'Læg brøker sammen i hovedet'], mixed: ['Blandet', 'Plus eller gange – det skifter ved hver opgave'], hive: ['Kæmpebikuben', 'Løs fire, og løs så deres svar'] },
  dailyJunior: 'Dagens opgave', dailyPro: 'Dagens bikube',
  // Beequation Kids
  worlds: {
    add: ['Plus-engen', ['Plusspire', 'Plusven', 'Regnestjerne', 'Regnekanon', 'Plushelt', 'Engmester']],
    mul: ['Tabelhaven', ['Tabeltudse', 'Dobbeltdiamant', 'Gangegnist', 'Produktprins', 'Havegeni', 'Tabeltitan']],
    frac: ['Brøkskoven', ['Halvdelshelt', 'Kvartdronning', 'Skivestjerne', 'Brøkchampion']],
    hive: ['Kæmpebikuben', ['Flittig bi', 'Bikagekaptajn', 'Bikubelegende']],
  },
  gateTitle: 'Kun for voksne', gatePrompt: 'Skriv dette tal med cifre:', gateAnswer: 'Svar med cifre', gateMiss: 'Det er ikke rigtigt. Prøv med det nye tal.',
  gateOk: 'Fortsæt', gateCancel: 'Annuller',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app
  gateWords: n => {
    const ONES = ['', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni'];
    const LEAD = ['', 'et', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni'];
    const TEENS = ['ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
    const TENS = ['', '', 'tyve', 'tredive', 'fyrre', 'halvtreds', 'tres', 'halvfjerds', 'firs', 'halvfems'];
    const r = n % 100, t = Math.floor(r / 10), o = r % 10;
    const tail = r < 20 ? TEENS[r - 10] : o === 0 ? TENS[t] : `${ONES[o]}og${TENS[t]}`;
    return `${LEAD[Math.floor(n / 1000)]} tusind ${LEAD[Math.floor(n / 100) % 10]} hundrede og ${tail}`;
  },
  stickersN: n => n === 1 ? '1 klistermærke' : `${n} klistermærker`, grownAria: 'Voksenområdet', grown: 'Voksne', hello: 'Hej! Jeg er Indie.<br>Kom, så finder vi nogle regnestykker!', play: 'Spil',
  unlock: 'Lås op', starsOf: (n, of) => `★ ${n} af ${of}`, today: 'Dagens opgave', doneTick: 'Klaret ✓', isNew: 'Ny!',
  kLevelAria: (t, st, s) => `Bane ${t}${st === 'paid' ? ', låst' : st === 'locked' ? ', ikke åben endnu' : `, ${s} ${s === 1 ? 'stjerne' : 'stjerner'}`}`,
  moreLevels: 'Der venter flere baner i hele spillet.', askGrown: 'Spørg en voksen', paidNudge: 'Disse baner er med i hele spillet. Spørg en voksen!',
  finishFirst: t => `Gør bane ${t} færdig først. Du kan godt!`,
  cheer: ['Du kan godt!', 'Tag dig god tid.', 'Find to tal, der giver et tredje!', 'Kig på alle tallene.'], yay: ['Ja!', 'Flot!', 'Du fik den!', 'Super!', 'Wow!'],
  puzzleOf: (n, of) => `Opgave ${n} af ${of}`, worldLevel: (w, t) => `${w}, bane ${t}`, smallCombOf: n => `, lille bikage ${n} af 4`, bigComb: ', stor bikage!',
  useAnswers: 'Brug nu dine fire svar!', kAsk: word => `Hvilket tal er to andre ${word}?`, added: 'lagt sammen', multiplied: 'ganget sammen',
  hint: 'Tip', psst: x => `Psst! Prøv at starte med ${x}.`, oops: 'Ups! Prøv et andet.',
  heads: ['', 'Godt klaret!', 'Flot arbejde!', 'Fantastisk!'], helpNone: 'og brugte slet ingen tips!', helpOne: 'og brugte kun 1 tip.', helpN: n => `og brugte ${n} tips.`,
  starsAria: n => `${n} af 3 stjerner`, solvedAll: n => `Du løste alle ${n} opgaver`, comeBack: 'Kom tilbage i morgen, så er der en ny!', newSticker: 'Nyt klistermærke!',
  addedToBook: 'Sat ind i din klistermærkebog', get3: 'Få 3 stjerner, så vinder du banens klistermærke.', nextLevel: 'Næste bane', again: 'Spil igen', home: 'Hjem', map: 'Kort',
  myStickers: 'Mine klistermærker', stickersHow: 'Få 3 stjerner på en bane, så vinder du dens klistermærke.', notWon: n => `${n}, ikke vundet endnu`,
  forGrown: 'For voksne', kFull: 'Hele spillet er låst op', kUnlockAll: n => `Lås alle ${n} baner op`, kThanks: 'Tak! Alle verdener og baner er åbne.',
  kFree: n => `Det gratis spil har ${n} baner og en daglig opgave. Tag et abonnement, eller køb livstidsadgang én gang, og åbn alle baner i alle fire verdener: sværere plusstykker, tabeller op til 15, brøker og Kæmpebikuben.`,
  kPrice: 'Fra 4,99 £ om måneden med 7 dage gratis. Ingen reklamer. Ingen dataindsamling. Opsig når som helst.', backToFree: 'Tilbage til gratisversionen (kun i forhåndsvisningen)',
  kBuy: 'Lås hele spillet op', previewNote: 'Denne forhåndsvisning simulerer købet. I appen åbnes App Store eller Google Play her.', helpsTitle: 'Sådan hjælper det',
  helps: 'I hver opgave skal dit barn finde et tal, der er lavet af to andre. Det styrker talforståelsen og den hurtige hovedregning. Indies tips holder stemningen rolig, og stjernerne tæller tips og fejl blidt med, så ingen skal kæmpe mod uret.',
  progress: 'Fremskridt', reset: 'Nulstil fremskridt', resetAsk: 'Vil du slette stjerner og klistermærker på denne enhed?', resetDone: 'Fremskridt nulstillet',
  // Beequation Pro
  streakAria: n => `${n} ${n === 1 ? 'dag' : 'dage'} i træk`, dailyOn: d => `Dagens bikube, ${d}`, hiveNo: n => `Bikube nr. ${n}`, doneIn: t => `Klaret på ${t}. En ny bikube åbner ved midnat.`,
  tenMixed: 'Ti blandede opgaver. Alle spiller de samme i dag.', seeResult: 'Se dit resultat', playToday: 'Spil dagens bikube', blitzTile: 'Blitz 60 s',
  best: n => `Rekord ${n}`, beatClock: 'Kæmp mod uret', hiveSub: 'Ekspert, 4 i 1', practice: 'Træning', highest: 'Højeste bane nået', notStarted: 'Ikke startet',
  rounds: (tagline, hive) => `${tagline}. Runder med ${hive ? '3 bikuber' : '10 opgaver'}.`,
  aLevelAria: (t, name, st, s) => `Bane ${t}, ${name}${st === 'paid' ? ', i den fulde version' : st === 'locked' ? ', låst' : `, ${s} ${s === 1 ? 'stjerne' : 'stjerner'}`}`,
  cellsAges: (n, a) => `${n} felter, ${/^\d/.test(a) ? `alder ${a}` : `for ${a.toLowerCase()}`}`, fullVersion: 'Fuld version', finishLevel: t => `Gennemfør bane ${t}`,
  blitzTitle: 'Blitz på 60 sekunder', blitzHow: 'Løs så mange som muligt på et minut. Et forkert tryk koster 2 sekunder. Du spiller på din højeste åbne bane.',
  nameLevel: (name, t) => `${name}, bane ${t}`, solvedWord: 'løst', smallComb: n => `Lille bikage ${n} af 4`, finalComb: 'Sidste bikage: dine fire svar',
  aAsk: b => `Find tallet, der er to andre ${b}`, addUpTo: 'lagt sammen', multiplyTo: 'ganget sammen', inARow: n => `${n} i træk`, wrongCosts: 'Et forkert tryk koster 2 sekunder',
  dailyDone: 'Dagens bikube klaret', firstDaily: 'Din første daglige bikube. Kom tilbage i morgen.', faster: n => `${n} ${n === 1 ? 'sekund' : 'sekunder'} hurtigere end sidst`,
  slower: n => `${n} ${n === 1 ? 'sekund' : 'sekunder'} langsommere end sidst`, sameTime: 'Samme tid som sidst', blitzOf: name => `Blitz: ${name}`, nSolved: n => `${n} løst`,
  newBest: 'Ny personlig rekord', yourBest: n => `Din rekord er ${n}`, levelDone: (name, t) => `${name} ${t} klaret`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => `${n} fejl`, for3: par => `For 3 stjerner: under ${par} med højst 1 fejl.`, fullMarks: 'Fuldt hus.',
  shareNo: n => `Beequation nr. ${n}`, firstTry: 'Første forsøg', oneSlip: '1 fejl', twoPlus: '2 eller flere', streak: n => `${n} ${n === 1 ? 'dag' : 'dage'} i træk`, last7: 'Sidste 7 dage',
  share: 'Del resultat', nextName: (name, t) => `Næste: ${name} ${t}`, unlockNext: 'Lås de næste baner op', playBlitz: 'Spil en blitz på 60 sekunder',
  shareBlitz: (n, mode, name) => `Beequation-blitz: ${n} løst på 60 s (${mode}, ${name})`, copied: 'Resultat kopieret',
  aAll: n => `Alle ${n} baner`, aThanks: 'Tak. Alle baner er åbne.',
  aFree: n => `Gratis får du ${n} baner, Dagens bikube og blitz. Den fulde version åbner alle baner op til Dronning, også ekspertopgaverne i Kæmpebikuben.`,
  aPrice: 'Fra 2,99 £ om måneden eller 29,99 £ om året med 7 dage gratis, eller køb livstidsadgang én gang. Ingen reklamer. Opsig når som helst.', aBuy: 'Lås den fulde version op',
  howTitle: 'Sådan spiller du', how: 'Hver bikage gemmer på ét tal, der er lavet af to andre, ved at lægge dem sammen eller gange dem. Tryk på det. En runde er 10 opgaver; i Kæmpebikuben løser du fire bikager og derefter en bikage af deres svar.',
  aFull: 'Fuld version låst op',
  // the chooser
  chooseIntro: 'To apps bygget på samme opgavetype. Vælg én at prøve. Du kan skifte når som helst.',
  kidsPick: '5–12 år. Farverige verdener, bien Indie, klistermærker og intet ur.', proPick: 'Unge og voksne. Dagens bikube med stimer, blitz på 60 sekunder og ekspertbaner.',
  savedHere: 'Dine fremskridt gemmes kun i denne browser.',
};
