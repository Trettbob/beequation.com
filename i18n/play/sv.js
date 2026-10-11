const T = {
  locale: 'sv',
  decSep: ",",
  indie: 'Biet Indie', back: 'Tillbaka', close: 'Stäng', quit: 'Avsluta', settings: 'Inställningar', frac: s => s.replace('/', ' genom '),
  switchApp: 'Byt app', siteAria: 'Beequation: tillbaka till beequation.com',
  tiers: ["Ägg","Larv","Surr","Arbetsbi","Samlarbi","Vaktbi","Prinsessa","Drottning","Svärm","Kupans hjärna"],
  ages: ["5+","6+","7+","8+","10+","12+","tonåringar och vuxna","experter","experter","experter"],
  modes: {
    add: ["Plus","Hitta talet som är summan av två andra"],
    mul: ["Gånger","Hitta talet som är produkten av två andra"],
    neg: ["Negativa","Addition med tal under noll"],
    frac: ["Bråk","Addera bråk i huvudet"],
    mixed: ["Blandat","Plus eller gånger – växlar från pussel till pussel"],
    hive: ["Stora kupan","Lös fyra, lös sedan deras svar"],
    dec: ["Decimaltal","Addera decimaltal i huvudet"],
    trio: ["Trio","Hitta talet som är summan av tre andra"],
    tens: ["Tiotal","Addera tiotal och hundratal"],
  },
  dailyJunior: 'Dagens pussel', dailyPro: 'Dagens kupa',
  // Beequation Kids
  worlds: {
    add: ["Plusängen",["Plusplanta","Pluskompis","Summastjärna","Plusproffs","Summahjälte","Ängsmästare","Hundrahoppare","Summamagiker"]],
    mul: ["Gångergården",["Gångeryngel","Dubbelblixt","Gångermagi","Produktproffs","Gårdsgeni","Gångertitan","Gångertrollkarl"]],
    frac: ["Bråkskogen",["Halvmåne","Kvartsdrottning","Bitstjärna","Bråkmästare","Pizzaproffs","Skogsuggla"]],
    tens: ["Tiotalsstaden",["Tiotalsknatte","Tiotalsturist","Jättetalskompis","Hundrahjälte","Borgmästare"]],
    dec: ["Decimaldynerna",["Kommavalp","Tiondelsvandrare","Dynsprinter","Decimaldynamo"]],
    hive: ["Stora kupan",["Flitigt bi","Vaxkakskapten","Kupans legend","Honungshjälte","Bidrottning"]],
  },
  gateTitle: 'Bara för vuxna', gatePrompt: 'Skriv talet med siffror:', gateAnswer: 'Svar med siffror', gateMiss: 'Det stämmer inte. Försök med det nya talet.',
  gateOk: 'Fortsätt', gateCancel: 'Avbryt',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app:
  // one word, split once after "tusen" ("sjutusen trehundrafyrtiotvå"), with "ettusen" and "etthundra"
  gateWords: n => {
    const ONES = ['', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio'];
    const TEENS = ['tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton'];
    const TENS = ['', '', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio', 'åttio', 'nittio'];
    const THOUSANDS = ['', 'ettusen', 'tvåtusen', 'tretusen', 'fyratusen', 'femtusen', 'sextusen', 'sjutusen', 'åttatusen', 'niotusen'];
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, r = n % 100;
    const rest = r < 20 ? TEENS[r - 10] : TENS[Math.floor(r / 10)] + ONES[r % 10];
    return `${THOUSANDS[th]} ${ONES[h]}hundra${rest}`;
  },
  stickersN: n => n === 1 ? '1 klistermärke' : `${n} klistermärken`, grownAria: 'För vuxna', grown: 'Vuxna', hello: 'Hej! Jag heter Indie.<br>Kom, så letar vi tal!', play: 'Spela',
  unlock: 'Lås upp', starsOf: (n, of) => `★ ${n} av ${of}`, today: 'Dagens pussel', doneTick: 'Klart ✓', isNew: 'Nytt!',
  kLevelAria: (t, st, s) => `Nivå ${t}${st === 'paid' ? ', låst' : st === 'locked' ? ', inte öppen än' : `, ${s} ${s === 1 ? 'stjärna' : 'stjärnor'}`}`,
  moreLevels: 'Fler nivåer väntar i hela spelet.', askGrown: 'Fråga en vuxen', paidNudge: 'De här nivåerna finns i hela spelet. Fråga en vuxen!',
  finishFirst: t => `Klara nivå ${t} först. Du fixar det!`,
  cheer: ['Du klarar det!', 'Ta den tid du behöver.', 'Hitta två tal som blir ett tredje!', 'Titta på alla talen.'], yay: ['Ja!', 'Toppen!', 'Rätt!', 'Superbra!', 'Wow!'],
  puzzleOf: (n, of) => `Pussel ${n} av ${of}`, worldLevel: (w, t) => `${w}, nivå ${t}`, smallCombOf: n => `, liten vaxkaka ${n} av 4`, bigComb: ', stor vaxkaka!',
  useAnswers: 'Använd nu dina fyra svar!', kAsk: word => `Vilket tal får du om du ${word} två andra?`, added: 'lägger ihop', multiplied: 'multiplicerar',
  hint: 'Tips', psst: x => `Psst! Testa att börja med ${x}.`, oops: 'Hoppsan! Testa ett annat.',
  heads: ['', 'Bra jobbat!', 'Superbra!', 'Fantastiskt!'], helpNone: 'och behövde inga tips alls!', helpOne: 'och behövde bara 1 tips.', helpN: n => `och behövde ${n} tips.`,
  starsAria: n => `${n} av 3 stjärnor`, solvedAll: n => `Du löste alla ${n} pussel`, comeBack: 'Kom tillbaka i morgon, då finns ett nytt!', newSticker: 'Nytt klistermärke!',
  addedToBook: 'Nu i din klistermärkesbok', get3: 'Ta 3 stjärnor så vinner du nivåns klistermärke.', nextLevel: 'Nästa nivå', again: 'Spela igen', home: 'Hem', map: 'Karta',
  myStickers: 'Mina klistermärken', stickersHow: 'Ta 3 stjärnor på en nivå så vinner du dess klistermärke.', notWon: n => `${n}, inte vunnet än`,
  forGrown: 'För vuxna', kFull: 'Hela spelet är upplåst', kUnlockAll: n => `Lås upp alla ${n} nivåer`, kThanks: 'Tack! Alla världar och nivåer är öppna.',
  kFree: free =>
      `Gratisspelet har ${free} nivåer och ett dagligt pussel. Prenumerera, eller köp Livstid en gång, så öppnas alla nivåer i alla sex världar: svårare plustal, multiplikationstabellen upp till 20, bråk, tiotal och hundratal, decimaltal och Stora kupan.`,
  kPrice: 'Från 4,99 £ i månaden, med 7 dagar gratis. Ingen reklam. Ingen datainsamling. Säg upp när du vill.', backToFree: 'Tillbaka till gratisversionen (bara i förhandsvisningen)',
  kBuy: 'Lås upp hela spelet', previewNote: 'Förhandsvisningen simulerar köpet. I appen öppnas App Store eller Google Play.', helpsTitle: 'Så hjälper det',
  helps: 'I varje pussel letar ditt barn efter ett tal som bildas av två andra. Det bygger upp talkamrater och snabb huvudräkning. Indies tips håller stämningen lugn, och stjärnorna räknar tips och misstag på ett snällt sätt, så det finns ingen klocka att tävla mot.',
  progress: 'Framsteg', reset: 'Nollställ framsteg', resetAsk: 'Radera stjärnor och klistermärken på den här enheten?', resetDone: 'Framstegen är nollställda',
  // Beequation Pro
  streakAria: n => `${n} ${n === 1 ? 'dag' : 'dagar'} i rad`, dailyOn: d => `Dagens kupa, ${d}`, hiveNo: n => `Kupa nr ${n}`, doneIn: t => `Klar på ${t}. En ny kupa öppnar vid midnatt.`,
  tenMixed: 'Tio blandade pussel. Alla spelar samma i dag.', seeResult: 'Se ditt resultat', playToday: 'Spela dagens kupa', blitzTile: 'Blixt 60 s',
  best: n => `Rekord ${n}`, beatClock: 'Tävla mot klockan', hiveSub: 'Expert, 4 blir 1', practice: 'Träna', highest: 'Högsta nivå hittills', notStarted: 'Inte påbörjad',
  rounds: (tagline, hive) => `${tagline}. Rundor om ${hive ? '3 kupor' : '10 pussel'}.`,
  aLevelAria: (t, name, st, s) => `Nivå ${t}, ${name}${st === 'paid' ? ', i fullversionen' : st === 'locked' ? `, klara nivå ${t - 1} först` : `, ${s} ${s === 1 ? 'stjärna' : 'stjärnor'}`}`,
  cellsAges: (n, a) => `${n} celler, ${/^\d/.test(a) ? `ålder ${a}` : `för ${a}`}`, fullVersion: 'Fullversion', finishLevel: t => `Klara nivå ${t}`,
  blitzTitle: 'Blixt på 60 sekunder', blitzHow: 'Lös så många du kan på en minut. Ett feltryck kostar 2 sekunder. Du spelar på din högsta öppna nivå.',
  nameLevel: (name, t) => `${name}, nivå ${t}`, solvedWord: 'lösta', smallComb: n => `Liten vaxkaka ${n} av 4`, finalComb: 'Sista vaxkakan: dina fyra svar',
  trioAsk: "Hitta talet som är **summan** av **tre** andra",
  aAsk: b => `Hitta talet som är ${b} av två andra`, addUpTo: 'summan', multiplyTo: 'produkten', inARow: n => `${n} i rad`, wrongCosts: 'Ett feltryck kostar 2 sekunder',
  dailyDone: 'Dagens kupa klar', firstDaily: 'Din första dagliga kupa. Kom tillbaka i morgon.', faster: n => `${n} ${n === 1 ? 'sekund' : 'sekunder'} snabbare än förra gången`,
  slower: n => `${n} ${n === 1 ? 'sekund' : 'sekunder'} långsammare än förra gången`, sameTime: 'Samma tid som förra gången', blitzOf: name => `Blixt: ${name}`, nSolved: n => n === 1 ? '1 löst' : `${n} lösta`,
  newBest: 'Nytt personbästa', yourBest: n => `Ditt rekord är ${n}`, levelDone: (name, t) => `${name} ${t} klar`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => `${n} misstag`, for3: par => `För 3 stjärnor: under ${par} med högst 1 misstag.`, fullMarks: 'Full pott.',
  shareNo: n => `Beequation nr ${n}`, firstTry: 'Första försöket', oneSlip: '1 misstag', twoPlus: '2 eller fler', streak: n => `${n} ${n === 1 ? 'dag' : 'dagar'} i rad`, last7: 'Senaste 7 dagarna',
  share: 'Dela resultat', nextName: (name, t) => `Nästa: ${name} ${t}`, unlockNext: 'Lås upp fler nivåer', playBlitz: 'Spela en blixt på 60 s',
  shareBlitz: (n, mode, name) => `Beequation blixt: ${n} ${n === 1 ? 'löst' : 'lösta'} på 60 s (${mode}, ${name})`, copied: 'Resultatet är kopierat',
  aAll: n => `Alla ${n} nivåer`, aThanks: 'Tack. Alla nivåer är öppna.',
  aFree: n => { return ((free, queen) =>
      `I gratisversionen ingår ${free} nivåer, Dagens kupa och blixten. Fullversionen öppnar alla nivåer upp till ${queen}, bland annat Decimaltal, Trio och expertpusslen i Stora kupan.`)(n, T.tiers[9]); },
  aPrice: 'Från 2,99 £ i månaden eller 29,99 £ om året, med 7 dagar gratis. Du kan också köpa Livstid. Ingen reklam. Säg upp när du vill.', aBuy: 'Lås upp fullversionen',
  howTitle: 'Så spelar du', how: 'Varje vaxkaka gömmer ett tal som bildas av två andra, genom addition eller multiplikation. Tryck på det. En runda är 10 pussel. I Stora kupan löser du fyra vaxkakor och sedan en vaxkaka av deras svar.',
  aFull: 'Fullversionen är upplåst',
  // the chooser
  chooseIntro: 'Två appar som bygger på samma pussel. Välj en och prova. Du kan byta när du vill.',
  kidsPick: 'För barn 5–12 år. Färgglada världar, biet Indie, klistermärken och ingen klocka.', proPick: 'Tonåringar och vuxna. Dagens kupa med svit, blixt på 60 sekunder och expertnivåer.',
  savedHere: 'Framstegen sparas bara i den här webbläsaren.',
};
