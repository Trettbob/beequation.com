const T = {
  locale: 'nb',
  decSep: ",",
  indie: 'Bien Indie', back: 'Tilbake', close: 'Lukk', quit: 'Avslutt', settings: 'Innstillinger', frac: s => s.replace('/', ' delt på '),
  switchApp: 'Bytt app', siteAria: 'Beequation: tilbake til beequation.com',
  tiers: ["Egg","Larve","Surrebie","Arbeidsbie","Sankebie","Vaktbie","Hoffbie","Dronning","Sverm","Kubehjerne"],
  ages: ["5+","6+","7+","8+","10+","12+","Ungdom og voksne","Eksperter","Eksperter","Eksperter"],
  modes: {
    add: ["Pluss","Finn tallet som er summen av to andre"],
    mul: ["Gange","Finn tallet som er produktet av to andre"],
    neg: ["Negative tall","Regnestykker med tall under null"],
    frac: ["Brøk","Legg sammen brøker i hodet"],
    mixed: ["Blandet","Pluss eller gange – det skifter fra oppgave til oppgave"],
    hive: ["Storkuben","Løs fire, og løs så svarene deres"],
    dec: ["Desimaltall","Legg sammen desimaltall i hodet"],
    trio: ["Trio","Finn tallet som er summen av tre andre"],
    tens: ["Tiere","Legg sammen tiere og hundrere"],
  },
  dailyJunior: 'Dagens nøtt', dailyPro: 'Dagens kube',
  // Beequation Kids
  worlds: {
    add: ["Pluss-engen",["Sumspire","Plussvenn","Sum-superstjerne","Pluss-ess","Totalhelt","Engmester","Hundrehopper","Sumtryller"]],
    mul: ["Gangehagen",["Gangerumpetroll","Dobbeldiamant","Gangemagi","Produktproff","Hagegeni","Gangetitan","Gangetrollmann"]],
    frac: ["Brøkskogen",["Halvdelshelt","Kvartdronning","Stykkestjerne","Brøkkjempe","Pizzaproff","Skogvismann"]],
    tens: ["Tierbyen",["Tiertass","Tiervandrer","Kjempetallvenn","Hundrerhelt","Ordfører"]],
    dec: ["Desimalstranden",["Kommavalp","Tidelsturist","Strandsprinter","Desimaldynamo"]],
    hive: ["Storkuben",["Flittig bie","Kubekaptein","Kubelegende","Honninghelt","Kubemajestet"]],
  },
  gateTitle: 'Bare for voksne', gatePrompt: 'Skriv dette tallet med sifre:', gateAnswer: 'Svar med sifre', gateMiss: 'Det stemmer ikke. Prøv det nye tallet.',
  gateOk: 'Fortsett', gateCancel: 'Avbryt',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app
  gateWords: n => {
    const ONES = ['', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni'];
    const BIG = ['', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni'];
    const TEENS = ['ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
    const TENS = ['', '', 'tjue', 'tretti', 'førti', 'femti', 'seksti', 'sytti', 'åtti', 'nitti'];
    const r = n % 100, rest = r < 20 ? TEENS[r - 10] : TENS[Math.floor(r / 10)] + ONES[r % 10];
    return `${BIG[Math.floor(n / 1000)]} tusen ${BIG[Math.floor(n / 100) % 10]} hundre og ${rest}`;
  },
  stickersN: n => n === 1 ? '1 klistremerke' : `${n} klistremerker`, grownAria: 'Voksensonen', grown: 'Voksne', hello: 'Hei! Jeg er Indie.<br>Bli med på talljakt!', play: 'Spill',
  unlock: 'Lås opp', starsOf: (n, of) => `★ ${n} av ${of}`, today: 'Dagens nøtt', doneTick: 'Ferdig ✓', isNew: 'Ny!',
  kLevelAria: (t, st, s) => `Nivå ${t}${st === 'paid' ? ', låst' : st === 'locked' ? ', ikke åpent ennå' : `, ${s} ${s === 1 ? 'stjerne' : 'stjerner'}`}`,
  moreLevels: 'Flere nivåer venter i hele spillet.', askGrown: 'Spør en voksen', paidNudge: 'Disse nivåene finnes i hele spillet. Spør en voksen!',
  finishFirst: t => `Fullfør nivå ${t} først. Du klarer det!`,
  cheer: ['Du klarer det!', 'Ta den tiden du trenger.', 'Finn to tall som blir et tredje!', 'Se på hvert eneste tall.'], yay: ['Ja!', 'Flott!', 'Du klarte det!', 'Supert!', 'Wow!'],
  puzzleOf: (n, of) => `Oppgave ${n} av ${of}`, worldLevel: (w, t) => `${w}, nivå ${t}`, smallCombOf: n => `, liten bikake ${n} av 4`, bigComb: ', stor bikake!',
  useAnswers: 'Nå skal du bruke de fire svarene dine!', kAsk: word => `Hvilket tall får du når du ${word} to andre?`, added: 'legger sammen', multiplied: 'ganger',
  hint: 'Tips', psst: x => `Psst! Prøv å begynne med ${x}.`, oops: 'Oi! Prøv et annet tall.',
  heads: ['', 'Bra jobba!', 'Kjempebra!', 'Fantastisk!'], helpNone: 'og trengte ingen tips i det hele tatt!', helpOne: 'og trengte bare 1 tips.', helpN: n => `med ${n} tips.`,
  starsAria: n => `${n} av 3 stjerner`, solvedAll: n => `Du løste alle ${n} oppgavene`, comeBack: 'Kom tilbake i morgen, så får du en ny!', newSticker: 'Nytt klistremerke!',
  addedToBook: 'Lagt i klistremerkeboka di', get3: 'Få 3 stjerner for å vinne klistremerket på dette nivået.', nextLevel: 'Neste nivå', again: 'Spill igjen', home: 'Hjem', map: 'Kart',
  myStickers: 'Klistremerkene mine', stickersHow: 'Få 3 stjerner på et nivå for å vinne klistremerket.', notWon: n => `${n}, ikke vunnet ennå`,
  forGrown: 'For voksne', kFull: 'Hele spillet er låst opp', kUnlockAll: n => `Lås opp alle ${n} nivåene`, kThanks: 'Tusen takk! Alle verdener og nivåer er åpne.',
  kFree: free =>
      `Gratisversjonen har ${free} nivåer og en daglig nøtt. Abonner, eller kjøp Livstid én gang, for å åpne alle nivåene i alle de seks verdenene: vanskeligere plusstykker, gangetabellen opp til 20, brøk, tiere og hundrere, desimaltall og Storkuben.`,
  kPrice: 'Fra 4,99 pund i måneden, med 7 dager gratis. Ingen reklame. Ingen data samles inn. Si opp når som helst.', backToFree: 'Tilbake til gratisversjonen (bare i forhåndsvisningen)',
  kBuy: 'Lås opp hele spillet', previewNote: 'Kjøpet er bare simulert i denne forhåndsvisningen. I appen åpner dette App Store eller Google Play.', helpsTitle: 'Slik hjelper det',
  helps: 'I hver oppgave skal barnet finne et tall som er laget av to andre. Det bygger tallforståelse, tiervenner og rask hoderegning. Tips fra Indie holder stemningen rolig, og stjernene teller tips og feil på en snill måte, så det er ingen klokke å slå.',
  progress: 'Fremgang', reset: 'Nullstill fremgangen', resetAsk: 'Vil du slette stjerner og klistremerker på denne enheten?', resetDone: 'Fremgangen er nullstilt',
  // Beequation Pro
  streakAria: n => `${n} ${n === 1 ? 'dag' : 'dager'} på rad`, dailyOn: d => `Dagens kube, ${d}`, hiveNo: n => `Kube nr. ${n}`, doneIn: t => `Løst på ${t}. En ny kube åpnes ved midnatt.`,
  tenMixed: 'Ti blandede oppgaver. Alle spiller de samme i dag.', seeResult: 'Se resultatet ditt', playToday: 'Spill dagens kube', blitzTile: 'Blitz 60 s',
  best: n => `Rekord ${n}`, beatClock: 'Slå klokken', hiveSub: 'Ekspert, 4 i 1', practice: 'Øving', highest: 'Høyeste nivå nådd', notStarted: 'Ikke startet',
  rounds: (tagline, hive) => `${tagline}. Runder på ${hive ? '3 kuber' : '10 oppgaver'}.`,
  aLevelAria: (t, name, st, s) => `Nivå ${t}, ${name}${st === 'paid' ? ', i fullversjonen' : st === 'locked' ? ', låst' : `, ${s} ${s === 1 ? 'stjerne' : 'stjerner'}`}`,
  cellsAges: (n, a) => `${n} celler, ${/^\d/.test(a) ? `alder ${a}` : `for ${a.toLowerCase()}`}`, fullVersion: 'Fullversjon', finishLevel: t => `Fullfør nivå ${t}`,
  blitzTitle: 'Blitz på 60 sekunder', blitzHow: 'Løs så mange du kan på ett minutt. Et feil trykk koster 2 sekunder. Du spiller på ditt høyeste åpne nivå.',
  nameLevel: (name, t) => `${name}, nivå ${t}`, solvedWord: 'løst', smallComb: n => `Liten bikake ${n} av 4`, finalComb: 'Siste bikake: de fire svarene dine',
  trioAsk: "Finn tallet som er **summen** av **tre** andre",
  aAsk: b => `Finn tallet som er ${b} av to andre`, addUpTo: 'summen', multiplyTo: 'produktet', inARow: n => `${n} på rad`, wrongCosts: 'Et feil trykk koster 2 sekunder',
  dailyDone: 'Dagens kube er løst', firstDaily: 'Din første daglige kube. Kom tilbake i morgen.', faster: n => `${n} ${n === 1 ? 'sekund' : 'sekunder'} raskere enn sist`,
  slower: n => `${n} ${n === 1 ? 'sekund' : 'sekunder'} tregere enn sist`, sameTime: 'Samme tid som sist', blitzOf: name => `Blitz: ${name}`, nSolved: n => `${n} løst`,
  newBest: 'Ny personlig rekord', yourBest: n => `Rekorden din er ${n}`, levelDone: (name, t) => `${name} ${t} fullført`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => n === 1 ? '1 tabbe' : `${n} tabber`, for3: par => `For 3 stjerner: under ${par} med maks 1 tabbe.`, fullMarks: 'Full pott.',
  shareNo: n => `Beequation nr. ${n}`, firstTry: 'Første forsøk', oneSlip: '1 tabbe', twoPlus: '2 eller flere', streak: n => `${n} ${n === 1 ? 'dag' : 'dager'} på rad`, last7: 'Siste 7 dager',
  share: 'Del resultatet', nextName: (name, t) => `Neste: ${name} ${t}`, unlockNext: 'Lås opp de neste nivåene', playBlitz: 'Spill blitz på 60 s',
  shareBlitz: (n, mode, name) => `Beequation blitz: ${n} løst på 60 s (${mode}, ${name})`, copied: 'Resultatet er kopiert',
  aAll: n => `Alle ${n} nivåene`, aThanks: 'Tusen takk. Alle nivåene er åpne.',
  aFree: n => { return ((free, queen) =>
      `Gratis får du ${free} nivåer, Dagens kube og blitz. Fullversjonen åpner alle nivåene helt opp til «${queen}», blant annet Desimaltall, Trio og ekspertoppgavene i Storkuben.`)(n, T.tiers[9]); },
  aPrice: 'Fra 2,99 pund i måneden eller 29,99 pund i året, med 7 dager gratis, eller kjøp Livstid. Ingen reklame. Si opp når som helst.', aBuy: 'Lås opp fullversjonen',
  howTitle: 'Slik spiller du', how: 'Hver bikake skjuler ett tall som er laget av to andre, ved å legge sammen eller gange. Trykk på det. En runde er 10 oppgaver. I Storkuben løser du fire bikaker og så en bikake av svarene deres.',
  aFull: 'Fullversjonen er låst opp',
  // the chooser
  chooseIntro: 'To apper med den samme typen oppgaver. Velg den du vil prøve. Du kan bytte når som helst.',
  kidsPick: 'Fra 5 til 12 år. Fargesprakende verdener, bien Indie, klistremerker og ingen klokke.', proPick: 'Ungdom og voksne. Dagens kube der du holder rekken i gang, blitz på 60 sekunder og ekspertnivåer.',
  savedHere: 'Fremgangen lagres bare i denne nettleseren.',
};
