const T = {
  lastResult: "Laatste resultaat",
  readNumbers: "Alle getallen voorlezen",
  boardLabel: "Getallen in de honingraat",
  vibration: "Trillen",
  keyboardTitle: "Met een schermlezer of toetsenbord",
  keyboardHelp: "Gebruik Tab om naar de honingraat te gaan. Met de pijltjestoetsen ga je van getal naar getal; Home en End gaan naar het eerste en laatste. Enter of Spatie kiest. In het spel leest R alle getallen rij voor rij voor. Escape gaat terug. Laatste resultaat na de honingraat bewaart elk bericht en is bereikbaar met Tab of de leescursor van de schermlezer.",
  noClock: "Geen tijdsdruk: Kids, de levels en de dagelijkse puzzels hebben geen tijdslimiet. Alleen Blitz telt af.",
  vibrationHelp: "Op ondersteunde apparaten kun je het trillen hier uitzetten. Nieuwe puzzel: 10 ms; goed: één puls van 40 ms; fout: twee pulsen van 40 ms met een pauze van 60 ms; einde van de ronde of tijd om: één puls van 300 ms.",
  readRow: (n, values) => `Rij ${n}: ${values}.`,
  cellPosition: (value, row, col) => `${value}, rij ${row}, kolom ${col}`,
  timeRemaining: (n) => `Nog ${n} seconden.`,
  timeUp: "De tijd is om.",
  locale: 'nl',
  decSep: ",",
  indie: 'Indie de bij', back: 'Terug', close: 'Sluiten', quit: 'Stoppen', settings: 'Instellingen', frac: s => s.replace('/', ' gedeeld door '),
  switchApp: 'Wissel van app', siteAria: 'Beequation: terug naar beequation.com',
  tiers: ["Ei","Larve","Zoemer","Werkster","Haalbij","Wachtbij","Prinses","Koningin","Zwerm","Korfgeest"],
  ages: ["5+","6+","7+","8+","10+","12+","Tieners & volwassenen","Experts","Experts","Experts"],
  modes: {
    add: ["Optellen","Zoek het getal dat de som is van twee andere"],
    mul: ["Vermenigvuldigen","Zoek het getal dat het product is van twee andere"],
    neg: ["Negatief","Sommen met getallen onder nul"],
    frac: ["Breuken","Breuken optellen uit je hoofd"],
    mixed: ["Gemengd","Plus of keer: het wisselt per puzzel"],
    hive: ["Grote Korf","Los er vier op, en daarna hun antwoorden"],
    dec: ["Kommagetallen","Kommagetallen optellen uit je hoofd"],
    trio: ["Trio","Zoek het getal dat de som is van drie andere"],
    tens: ["Tientallen","Tientallen en honderdtallen optellen"],
  },
  dailyJunior: 'Dagpuzzel Junior', dailyPro: 'Dagpuzzel',
  // Beequation Kids
  worlds: {
    add: ["Optelweide",["Plusplantje","Plusmaatje","Sommensuperster","Optelkanjer","Totaalheld","Weidemeester","Honderdspringer","Sommenmagiër"]],
    mul: ["Tafeltuin",["Tafelkikkervisje","Dubbeldurver","Keerkunstenaar","Productprof","Tuingenie","Tafeltitaan","Tafeltovenaar"]],
    frac: ["Breukenbos",["Helftenheld","Kwartkoningin","Stukjesster","Breukenkampioen","Pizzaprof","Wijze Bosuil"]],
    tens: ["Tientallenstad",["Tienkleuter","Tientallentrekker","Reuzengetalmaatje","Honderdheld","Burgemeester"]],
    dec: ["Kommaduinen",["Kommapup","Tiendentrekker","Duinsprinter","Kommadynamo"]],
    hive: ["Grote Korf",["Bezige Bij","Raatkapitein","Korflegende","Honingheld","Korfmajesteit"]],
  },
  gateTitle: 'Alleen voor volwassenen', gatePrompt: 'Typ dit getal in cijfers:', gateAnswer: 'Antwoord in cijfers', gateMiss: 'Dat klopt niet. Probeer het nieuwe getal.',
  gateOk: 'Doorgaan', gateCancel: 'Annuleren',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app
  // (one word up to "duizend", then a space; a zero-width space after "honderd" lets the long word wrap)
  gateWords: n => {
    const ONES = ['', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen'];
    const TEENS = ['tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'];
    const TENS = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];
    const ZWSP = '​';
    const below100 = r => {
      if (r < 10) return ONES[r];
      if (r < 20) return TEENS[r - 10];
      const t = Math.floor(r / 10), o = r % 10;
      if (o === 0) return TENS[t];
      const unit = ONES[o];
      return `${unit}${unit.endsWith('e') ? 'ën' : 'en'}${TENS[t]}`;
    };
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, r = n % 100;
    const thousands = th === 1 ? 'duizend' : `${ONES[th]}duizend`;
    const rest = below100(r);
    if (h === 0) return rest ? `${thousands} ${rest}` : thousands;
    const hundreds = h === 1 ? 'honderd' : `${ONES[h]}honderd`;
    return rest ? `${thousands} ${hundreds}${ZWSP}${rest}` : `${thousands} ${hundreds}`;
  },
  stickersN: n => n === 1 ? '1 sticker' : `${n} stickers`, grownAria: 'Ouderhoek', grown: 'Ouders', hello: 'Hoi! Ik ben Indie.<br>Kom, we gaan sommen zoeken!', play: 'Spelen',
  unlock: 'Ontgrendelen', starsOf: (n, of) => `★ ${n} van ${of}`, today: 'Puzzel van vandaag', doneTick: 'Klaar ✓', isNew: 'Nieuw!',
  kLevelAria: (t, st, s) => `Level ${t}${st === 'paid' ? ', op slot' : st === 'locked' ? ', nog niet open' : `, ${s} ${s === 1 ? 'ster' : 'sterren'}`}`,
  moreLevels: 'In het volledige spel wachten nog meer levels.', askGrown: 'Vraag een volwassene', paidNudge: 'Deze levels zitten in het volledige spel. Vraag het aan een volwassene!',
  finishFirst: t => `Speel eerst level ${t} uit. Jij kunt het!`,
  cheer: ['Jij kunt het!', 'Neem de tijd.', 'Zoek er twee die een derde getal maken!', 'Kijk goed naar elk getal.'], yay: ['Ja!', 'Goed zo!', 'Helemaal goed!', 'Super!', 'Wauw!'],
  puzzleOf: (n, of) => `Puzzel ${n} van ${of}`, worldLevel: (w, t) => `${w}, level ${t}`, smallCombOf: n => `, kleine raat ${n} van 4`, bigComb: ', grote raat!',
  useAnswers: 'Gebruik nu je vier antwoorden!', kAsk: word => `Welk getal krijg je als je twee andere ${word}?`, added: 'optelt', multiplied: 'vermenigvuldigt',
  hint: 'Tip', psst: x => `Psst! Begin eens met ${x}.`, oops: 'Oeps! Probeer een ander getal.',
  heads: ['', 'Goed gedaan!', 'Knap gedaan!', 'Geweldig!'], helpNone: 'en had geen enkele tip nodig!', helpOne: 'en had maar 1 tip nodig.', helpN: n => `met ${n} tips.`,
  starsAria: n => `${n} van de 3 sterren`, solvedAll: n => n === 1 ? 'Je hebt de puzzel opgelost' : `Je hebt alle ${n} puzzels opgelost`, comeBack: 'Morgen is er weer een nieuwe!', newSticker: 'Nieuwe sticker!',
  addedToBook: 'Toegevoegd aan je stickerboek', get3: 'Haal 3 sterren om de sticker van dit level te winnen.', nextLevel: 'Volgend level', again: 'Nog een keer', home: 'Start', map: 'Kaart',
  myStickers: 'Mijn stickers', stickersHow: 'Haal 3 sterren in een level om de sticker te winnen.', notWon: n => `${n}, nog niet gewonnen`,
  forGrown: 'Voor ouders', kFull: 'Volledig spel ontgrendeld', kUnlockAll: n => `Ontgrendel alle ${n} levels`, kThanks: 'Bedankt! Alle werelden en levels zijn open.',
  kFree: free =>
      `Het gratis spel heeft ${free} levels en elke dag een puzzel. Neem een abonnement, of koop één keer Levenslang, om alle levels in alle zes de werelden te openen: moeilijkere sommen, de tafels tot en met 20, breuken, tientallen en honderdtallen, kommagetallen en de Grote Korf.`,
  kPrice: 'Vanaf £ 4,99 per maand, met 7 dagen gratis. Geen advertenties. We verzamelen geen gegevens. Altijd opzegbaar.', backToFree: 'Terug naar de gratis versie (alleen in deze preview)',
  kBuy: 'Volledig spel ontgrendelen', previewNote: 'In deze preview wordt de aankoop alleen nagebootst. In de app opent hier de App Store of Google Play.', helpsTitle: 'Wat je kind ervan leert',
  helps: 'Bij elke puzzel zoekt je kind een getal dat met twee andere getallen te maken is. Zo oefent je kind spelenderwijs splitsen en vlot hoofdrekenen. Indie houdt het rustig met tips, tips en foutjes tellen maar licht mee voor de sterren, en er loopt geen klok.',
  progress: 'Voortgang', reset: 'Voortgang wissen', resetAsk: 'Sterren en stickers op dit apparaat wissen?', resetDone: 'Voortgang gewist',
  // Beequation Pro
  streakAria: n => n === 1 ? '1 dag op rij' : `${n} dagen op rij`, dailyOn: d => `Dagpuzzel, ${d}`, hiveNo: n => `Korf nr. ${n}`, doneIn: t => `Opgelost in ${t}. Om middernacht komt er een nieuwe korf.`,
  tenMixed: 'Tien gemengde puzzels. Iedereen speelt vandaag dezelfde.', seeResult: 'Bekijk je resultaat', playToday: 'Speel de korf van vandaag', blitzTile: '60s-blitz',
  best: n => `Record ${n}`, beatClock: 'Race tegen de klok', hiveSub: 'Expert, 4 in 1', practice: 'Oefenen', highest: 'Hoogste level', notStarted: 'Nog niet begonnen',
  rounds: (tagline, hive) => `${tagline}. Rondes van ${hive ? '3 korven' : '10 puzzels'}.`,
  aLevelAria: (t, name, st, s) => `Level ${t}, ${name}${st === 'paid' ? ', in de volledige versie' : st === 'locked' ? ', op slot' : `, ${s} ${s === 1 ? 'ster' : 'sterren'}`}`,
  cellsAges: (n, a) => `${n} vakjes, ${/^\d/.test(a) ? `vanaf ${a.replace('+', '')} jaar` : `voor ${a.toLowerCase()}`}`, fullVersion: 'Volledige versie', finishLevel: t => `Haal eerst level ${t}`,
  blitzTitle: '60-secondenblitz', blitzHow: 'Los er zoveel mogelijk op in één minuut. Een verkeerde tik kost 2 seconden. Je speelt op je hoogste open level.',
  nameLevel: (name, t) => `${name}, level ${t}`, solvedWord: 'opgelost', smallComb: n => `Kleine raat ${n} van 4`, finalComb: 'Laatste raat: je vier antwoorden',
  trioAsk: "Zoek het getal dat de **som** is van **drie** andere",
  aAsk: b => `Zoek het getal dat ${b} is van twee andere`, addUpTo: 'de som', multiplyTo: 'het product', inARow: n => `${n} op rij`, wrongCosts: 'Een verkeerde tik kost 2 seconden',
  dailyDone: 'Dagpuzzel voltooid', firstDaily: 'Je eerste Dagpuzzel. Kom morgen terug.', faster: n => `${n} ${n === 1 ? 'seconde' : 'seconden'} sneller dan vorige keer`,
  slower: n => `${n} ${n === 1 ? 'seconde' : 'seconden'} langzamer dan vorige keer`, sameTime: 'Even snel als vorige keer', blitzOf: name => `Blitz: ${name}`, nSolved: n => `${n} opgelost`,
  newBest: 'Nieuw persoonlijk record', yourBest: n => `Je record is ${n}`, levelDone: (name, t) => `${name} ${t} voltooid`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => n === 1 ? '1 fout' : `${n} fouten`, for3: par => `Voor 3 sterren: onder ${par} met hoogstens 1 fout.`, fullMarks: 'Perfecte score.',
  shareNo: n => `Beequation nr. ${n}`, firstTry: 'Meteen goed', oneSlip: '1 fout', twoPlus: '2 of meer', streak: n => n === 1 ? '1 dag op rij' : `${n} dagen op rij`, last7: 'Afgelopen 7 dagen',
  share: 'Resultaat delen', nextName: (name, t) => `Volgende: ${name} ${t}`, unlockNext: 'Ontgrendel de volgende levels', playBlitz: 'Speel een 60s-blitz',
  copied: 'Resultaat gekopieerd',
  aAll: n => `Alle ${n} levels`, aThanks: 'Bedankt. Alle levels zijn open.',
  aFree: n => { return ((free, queen) =>
      `Gratis: ${free} levels, de Dagpuzzel en de blitz. De volledige versie opent alle levels tot en met ‘${queen}’, inclusief Kommagetallen, Trio en de expertpuzzels van de Grote Korf.`)(n, T.tiers[9]); },
  aPrice: 'Vanaf £ 2,99 per maand of £ 29,99 per jaar, met 7 dagen gratis, of koop één keer Levenslang. Geen advertenties. Altijd opzegbaar.', aBuy: 'Volledige versie ontgrendelen',
  howTitle: 'Zo speel je', how: 'In elke raat zit één getal verstopt dat je maakt door twee andere op te tellen of te vermenigvuldigen. Tik erop. Een ronde heeft 10 puzzels; bij de Grote Korf los je vier raten op, en daarna een raat met hun antwoorden.',
  aFull: 'Volledige versie ontgrendeld',
  // the chooser
  chooseIntro: 'Twee apps met dezelfde puzzel. Kies er een om te proberen. Je kunt altijd wisselen.',
  kidsPick: 'Van 5 tot 12 jaar. Werelden in snoepkleuren, Indie de bij, stickers en geen klok.', proPick: 'Tieners en volwassenen. Dagpuzzel met reeksen, 60-secondenblitz en expertlevels.',
  savedHere: 'Je voortgang wordt alleen in deze browser bewaard.',
  // delen (Beequation No., Hive No. en Beequation blijven zoals ze zijn)
  shareWords: { slips: '{n} fouten', noSlips: 'Geen fouten', streak: '{n} dagen op rij in de korf', blitz: 'Beequation-blitz 🐝 {score} in 60 s ({mode}, {level})', level: 'Level {n}',
    kids: `Kun jij een Beequation Kids-speler verslaan? {score}/{of} op deze honingraat 🐝 Jouw beurt:` },
  waggle: 'Daag een vriend uit', waggleTitle: 'Een uitdaging van een vriend',
  wagglePractice: (n, mode, level) => `Beequation 🐝 ${n} van de 10 meteen goed (${mode}, ${level}). Jouw beurt!`,
  friendBlitz: n => `Een vriend loste er ${n} op in 60 s. Jouw beurt!`, friendPractice: n => `Een vriend had er ${n} van de 10 meteen goed. Jouw beurt!`,
  waggleWhy: 'Bijen doen de kwispeldans om de korf te laten zien waar de beste bloemen staan. Deze link start dezelfde ronde die je vriend speelde.',
  playRound: 'Speel dezelfde ronde', notNow: 'Niet nu', versus: (you, friend) => `Jij ${you} · Je vriend ${friend}`,
  yourHive: 'Jouw korf', daysPlayed: 'Dagen gespeeld', currentStreak: 'Huidige reeks', bestStreak: 'Langste reeks', jarsHeld: 'Honingpotten op voorraad',
  avgTime: 'Gemiddelde tijd per dag', dayCount: n => n === 1 ? '1 dag' : `${n} dagen`, dailyResults: 'Dagresultaten',
  pureHoney: 'Pure honing (geen fouten)', twoPlusSlips: '2 of meer fouten', noDailies: 'Speel je eerste Dagpuzzel om je korf te starten.',
  jarTitle: 'Honingpotten', jarsAria: n => n === 1 ? '1 honingpot' : `${n} honingpotten`,
  jarHelp: 'Speel je de Dagpuzzel 7 dagen op rij, dan verdien je een honingpot. Je kunt er 2 bewaren. Mis je één dag, dan wordt er automatisch een pot gebruikt en loopt je reeks door. Mis je twee dagen of meer, dan begint de reeks opnieuw.',
  jarSaved: n => `Een honingpot heeft je reeks van ${n === 1 ? '1 dag' : `${n} dagen`} gered 🍯`, hatchesIn: t => `De volgende korf komt uit over ${t}`,
  // Challenge a grown-up (Kids), Kids Waggle links, For grown-ups and the family hive
  challengeAsk: `Denk je dat een volwassene van je kan winnen? Daag ze uit!`, challenge: `Daag een volwassene uit`,
  passTitle: `Geef de telefoon aan een volwassene 🐝`, passHow: `De volwassene speelt dezelfde puzzels die jij net hebt opgelost, maar tegen de klok.`, imGrown: `Ik ben de volwassene`,
  readyTitle: `Klaar, volwassene?`, readyRules: (n, secs) => `Dezelfde ${n} puzzels. Je hebt ${secs} seconden. Alleen antwoorden die in één keer goed zijn tellen, en er zijn geen tips.`,
  toBeat: (n, of) => `Te verslaan: ${n} van ${of}`, start: `Start`, grownTurn: `Beurt van de volwassene`,
  vsYou: `Jij`, vsGrown: `Volwassene`, vsScore: (kid, grown) => `Jij: ${kid} · Volwassene: ${grown}`,
  kidWins: `Jij wint de honing! 🍯`, grownWins: `Deze keer wint de volwassene. Revanche?`, vsTie: `Gelijkspel! Jullie delen de honing 🍯`,
  scoreHow: of => `Puzzels in één keer goed, van de ${of}.`, rematch: `Revanche`, done: `Klaar`,
  kidsFriend: (n, of) => `Een Beequation Kids-speler had er ${n} van de ${of} goed. Jouw beurt, volwassene!`,
  kidsWhy: `Deze link speelt de ronde opnieuw die een Beequation Kids-speler net speelde. Er staan geen namen in en niets over het kind.`,
  vsKid: `Kids-speler`, linkScore: (kid, you) => `Kids-speler: ${kid} · Jij: ${you}`,
  linkKidWins: `De Kids-speler wint de honing! 🍯`, linkYouWin: `Deze keer win jij!`,
  proTitle: `Beequation Pro`, proPitch: `Leuk gevonden? Beequation Pro is hetzelfde spel voor volwassenen: elke dag een nieuwe puzzel, reeksen en Blitz.`,
  proGet: `Download Beequation Pro`, familyOffer: code => `Gezinnen met Beequation Kids krijgen 3 maanden Pro gratis met de code ${code}.`,
  sendTitle: `Stuur een uitdaging`, sendHow: `Deel een link waarmee een andere volwassene deze ronde speelt. Geen namen, niets over je kind.`,
  familyHive: `Gezinskorf`, familyTally: (kids, grown) => `Kinderen ${kids} · Volwassenen ${grown} deze week`,
  familyHow: `Gewonnen uitdagingen op dit apparaat. De stand begint elke maandag opnieuw.`,
};
