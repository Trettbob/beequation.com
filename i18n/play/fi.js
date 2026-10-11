const T = {
  locale: 'fi',
  decSep: ",",
  indie: 'Mehiläinen Indie', back: 'Takaisin', close: 'Sulje', quit: 'Lopeta', settings: 'Asetukset', frac: s => s.replace('/', ' kautta '),
  switchApp: 'Vaihda sovellusta', siteAria: 'Beequation: takaisin sivustolle beequation.com',
  tiers: ["Muna","Toukka","Pörriäinen","Työläinen","Keräilijä","Vartija","Prinsessa","Kuningatar","Parvi","Parviäly"],
  // only shown after "N ruutua, " in the level list (see cellsAges), so lower case
  ages: ["5+","6+","7+","8+","10+","12+","nuorille ja aikuisille","mestareille","mestareille","mestareille"],
  modes: {
    add: ["Yhteenlasku","Etsi luku, joka on kahden muun summa"],
    mul: ["Kertolasku","Etsi luku, joka on kahden muun tulo"],
    neg: ["Negatiiviset","Laskuja nollaa pienemmillä luvuilla"],
    frac: ["Murtoluvut","Laske murtolukuja yhteen päässä"],
    mixed: ["Sekalaiset","Plus tai kertaa – vaihtuu joka pulmassa"],
    hive: ["Iso pesä","Ratkaise neljä, sitten niiden vastaukset"],
    dec: ["Desimaaliluvut","Laske desimaalilukuja yhteen päässä"],
    trio: ["Trio","Etsi luku, joka on kolmen muun summa"],
    tens: ["Kymmenet","Laske yhteen kymmeniä ja satoja"],
  },
  dailyJunior: 'Päivän pulma', dailyPro: 'Päivän pesä',
  // Beequation Kids (names as in the app; ​ is the app's invisible wrap point inside long compounds)
  worlds: {
    add: ["Plusniitty",["Summasilmu","Pluskaveri","Plustähti","Laskuässä","Summa​sankari","Niitty​mestari","Sata​sammakko","Summavelho"]],
    mul: ["Kertotarha",["Kerto​nuijapää","Tuplasalama","Kertotaika","Tulotaituri","Tarhan nero","Kertojätti","Kertovelho"]],
    frac: ["Murtoluku​metsä",["Puolikas​sankari","Vartti​kuningatar","Siivutähti","Murtoluku​mestari","Pizza​professori","Metsä​tietäjä"]],
    tens: ["Kymppikylä",["Kymppi​taapero","Kymppi​kulkija","Isojen lukujen kaveri","Satasankari","Kylä​päällikkö"]],
    dec: ["Desimaali​dyynit",["Pilkkupentu","Kymmenesosa​vaeltaja","Dyynikiitäjä","Desimaali​dynamo"]],
    hive: ["Iso pesä",["Ahkera mehiläinen","Kenno​kapteeni","Pesälegenda","Hunaja​sankari","Pesä​kuningatar"]],
  },
  gateTitle: 'Vain aikuisille', gatePrompt: 'Kirjoita tämä luku numeroin:', gateAnswer: 'Vastaus numeroin', gateMiss: 'Ei aivan. Kokeile uutta lukua.',
  gateOk: 'Jatka', gateCancel: 'Peruuta',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app:
  // one space after the thousands, and an invisible zero-width space after "sata(a)" and "kymmentä" as wrap points
  gateWords: n => {
    const Z = '​';
    const ONES = ['', 'yksi', 'kaksi', 'kolme', 'neljä', 'viisi', 'kuusi', 'seitsemän', 'kahdeksan', 'yhdeksän'];
    const TEENS = ['kymmenen', 'yksitoista', 'kaksitoista', 'kolmetoista', 'neljätoista', 'viisitoista', 'kuusitoista', 'seitsemäntoista', 'kahdeksantoista', 'yhdeksäntoista'];
    const THOUSANDS = ['', 'tuhat'].concat(ONES.slice(2).map(o => `${o}tuhatta`));
    const HUNDREDS = ['', 'sata'].concat(ONES.slice(2).map(o => `${o}sataa`));
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, r = n % 100, o = r % 10;
    const rest = r < 20 ? TEENS[r - 10] : `${ONES[Math.floor(r / 10)]}kymmentä${o ? Z + ONES[o] : ''}`;
    return `${THOUSANDS[th]} ${HUNDREDS[h]}${Z}${rest}`;
  },
  stickersN: n => n === 1 ? '1 tarra' : `${n} tarraa`, grownAria: 'Aikuisten alue', grown: 'Aikuisille', hello: 'Hei! Olen Indie.<br>Lähdetään lukujahtiin!', play: 'Pelaa',
  unlock: 'Avaa', starsOf: (n, of) => `★ ${n}/${of}`, today: 'Päivän pulma', doneTick: 'Tehty ✓', isNew: 'Uusi!',
  kLevelAria: (t, st, s) => `Taso ${t}${st === 'paid' ? ', lukittu' : st === 'locked' ? ', ei vielä auki' : `, ${s} ${s === 1 ? 'tähti' : 'tähteä'}`}`,
  moreLevels: 'Koko pelissä odottaa lisää tasoja.', askGrown: 'Kysy aikuiselta', paidNudge: 'Nämä tasot ovat koko pelissä. Kysy aikuiselta!',
  finishFirst: t => `Pelaa ensin taso ${t} läpi. Sinä osaat!`,
  cheer: ['Sinä osaat!', 'Ei kiirettä.', 'Etsi kaksi lukua, joista tulee kolmas!', 'Katso kaikki luvut.'], yay: ['Jee!', 'Hienoa!', 'Oikein!', 'Mahtavaa!', 'Vau!'],
  puzzleOf: (n, of) => `Pulma ${n}, yhteensä ${of}`, worldLevel: (w, t) => `${w}, taso ${t}`, smallCombOf: n => `, pieni kenno ${n} neljästä`, bigComb: ', iso kenno!',
  useAnswers: 'Käytä nyt neljää vastaustasi!', kAsk: word => `Mikä luku saadaan, kun kaksi muuta ${word}?`, added: 'lasketaan yhteen', multiplied: 'kerrotaan keskenään',
  hint: 'Vihje', psst: x => `Psst! Aloita vaikka luvusta ${x}.`, oops: 'Hups! Kokeile toista.',
  heads: ['', 'Hyvin tehty!', 'Hienosti!', 'Mahtavaa!'], helpNone: 'etkä tarvinnut yhtään vihjettä!', helpOne: 'ja tarvitsit vain 1 vihjeen.', helpN: n => `ja käytit ${n} vihjettä.`,
  starsAria: n => n === 1 ? '1 tähti kolmesta' : `${n} tähteä kolmesta`, solvedAll: n => `Ratkaisit kaikki ${n} pulmaa`, comeBack: 'Huomenna odottaa uusi pulma!', newSticker: 'Uusi tarra!',
  addedToBook: 'Lisätty tarrakirjaasi', get3: 'Kerää 3 tähteä, niin saat tämän tason tarran.', nextLevel: 'Seuraava taso', again: 'Pelaa uudestaan', home: 'Alkuun', map: 'Kartta',
  myStickers: 'Omat tarrat', stickersHow: 'Kerää tasolta 3 tähteä, niin saat sen tarran.', notWon: n => `${n}, ei vielä saatu`,
  forGrown: 'Aikuisille', kFull: 'Koko peli avattu', kUnlockAll: n => `Avaa kaikki ${n} tasoa`, kThanks: 'Kiitos! Kaikki maailmat ja tasot ovat auki.',
  kFree: free =>
      `Ilmaisessa pelissä on ${free} tasoa ja päivän pulma. Tilaa tai osta elinikäinen käyttöoikeus kertamaksulla, niin kaikkien kuuden maailman tasot aukeavat: vaikeammat yhteenlaskut, kertotaulut 20:een asti, murtoluvut, kymmenet ja sadat, desimaaliluvut sekä Iso pesä.`,
  kPrice: 'Alkaen 4,99 £ kuukaudessa, ja 7 ensimmäistä päivää ovat ilmaisia. Ei mainoksia. Ei tietojen keruuta. Voit perua milloin tahansa.', backToFree: 'Takaisin ilmaisversioon (vain esikatselussa)',
  kBuy: 'Avaa koko peli', previewNote: 'Tämä esikatselu vain jäljittelee ostoa. Sovelluksessa tästä avautuu App Store tai Google Play.', helpsTitle: 'Miten peli auttaa',
  helps: 'Jokaisessa pulmassa lapsi etsii luvun, joka muodostuu kahdesta muusta. Se vahvistaa hajotelmien ja kymppiparien hallintaa sekä nopeaa päässälaskua. Indien vihjeet pitävät tunnelman rauhallisena, ja tähdet huomioivat vihjeet ja virheet lempeästi. Kelloa vastaan ei kilpailla.',
  progress: 'Edistyminen', reset: 'Nollaa edistyminen', resetAsk: 'Poistetaanko tämän laitteen tähdet ja tarrat?', resetDone: 'Edistyminen nollattu',
  // Beequation Pro
  streakAria: n => `${n} päivän putki`, dailyOn: d => `Päivän pesä, ${d}`, hiveNo: n => `Pesä nro ${n}`, doneIn: t => `Ratkaistu ajassa ${t}. Uusi pesä aukeaa keskiyöllä.`,
  tenMixed: 'Kymmenen sekalaista pulmaa. Kaikki pelaavat tänään samat.', seeResult: 'Katso tuloksesi', playToday: 'Pelaa päivän pesä', blitzTile: '60 s pikapeli',
  best: n => `Ennätys ${n}`, beatClock: 'Kelloa vastaan', hiveSub: 'Mestareille, 4 yhdeksi', practice: 'Harjoittelu', highest: 'Korkein saavutettu taso', notStarted: 'Ei aloitettu',
  rounds: (tagline, hive) => `${tagline}. Kierroksessa ${hive ? '3 pesää' : '10 pulmaa'}.`,
  aLevelAria: (t, name, st, s) => `Taso ${t}, ${name}${st === 'paid' ? ', täysversiossa' : st === 'locked' ? ', lukittu' : `, ${s} ${s === 1 ? 'tähti' : 'tähteä'}`}`,
  cellsAges: (n, a) => `${n} ruutua, ${/^\d/.test(a) ? `ikä ${a}` : a}`, fullVersion: 'Täysversio', finishLevel: t => `Läpäise ensin taso ${t}`,
  blitzTitle: '60 sekunnin pikapeli', blitzHow: 'Ratkaise minuutissa niin monta kuin ehdit. Väärä napautus maksaa 2 sekuntia. Pelaat korkeimmalla avatulla tasollasi.',
  nameLevel: (name, t) => `${name}, taso ${t}`, solvedWord: 'ratkaistu', smallComb: n => `Pieni kenno ${n} neljästä`, finalComb: 'Viimeinen kenno: neljä vastaustasi',
  trioAsk: "Etsi luku, joka on **kolmen** muun **summa**",
  aAsk: b => `Etsi luku, joka on kahden muun ${b}`, addUpTo: 'summa', multiplyTo: 'tulo', inARow: n => `${n} putkeen`, wrongCosts: 'Väärä napautus maksaa 2 sekuntia',
  dailyDone: 'Päivän pesä ratkaistu', firstDaily: 'Ensimmäinen päivän pesäsi. Tule huomenna uudestaan.', faster: n => `${n} ${n === 1 ? 'sekunnin' : 'sekuntia'} nopeampi kuin viimeksi`,
  slower: n => `${n} ${n === 1 ? 'sekunnin' : 'sekuntia'} hitaampi kuin viimeksi`, sameTime: 'Sama aika kuin viimeksi', blitzOf: name => `Pikapeli: ${name}`, nSolved: n => n === 1 ? '1 ratkaistu' : `${n} ratkaistua`,
  newBest: 'Uusi oma ennätys', yourBest: n => `Ennätyksesi on ${n}`, levelDone: (name, t) => `${name} ${t} läpäisty`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => n === 1 ? '1 virhe' : `${n} virhettä`, for3: par => `3 tähteen: alle ${par} ja enintään 1 virhe.`, fullMarks: 'Täydet pisteet.',
  shareNo: n => `Beequation nro ${n}`, firstTry: 'Heti oikein', oneSlip: '1 virhe', twoPlus: '2 tai enemmän', streak: n => `${n} päivän putki`, last7: 'Viimeiset 7 päivää',
  share: 'Jaa tulos', nextName: (name, t) => `Seuraava: ${name} ${t}`, unlockNext: 'Avaa seuraavat tasot', playBlitz: 'Pelaa 60 s pikapeli',
  shareBlitz: (n, mode, name) => `Beequation-pikapeli: ${n === 1 ? '1 pulma' : `${n} pulmaa`} 60 sekunnissa (${mode}, ${name})`, copied: 'Tulos kopioitu',
  aAll: n => `Kaikki ${n} tasoa`, aThanks: 'Kiitos. Kaikki tasot ovat auki.',
  aFree: n => { return ((free, queen) =>
      `Ilmaisversiossa on ${free} tasoa, Päivän pesä ja pikapeli. Täysversio avaa kaikki tasot tasoon ”${queen}” asti, myös Desimaaliluvut, Trion ja Ison pesän mestaripulmat.`)(n, T.tiers[9]); },
  aPrice: 'Alkaen 2,99 £ kuukaudessa tai 29,99 £ vuodessa, ja 7 ensimmäistä päivää ovat ilmaisia. Voit myös ostaa elinikäisen käyttöoikeuden kertamaksulla. Ei mainoksia. Voit perua milloin tahansa.', aBuy: 'Avaa täysversio',
  howTitle: 'Näin pelaat', how: 'Jokaisessa kennossa on yksi luku, joka saadaan kahdesta muusta laskemalla yhteen tai kertomalla. Napauta sitä. Kierroksessa on 10 pulmaa. Isossa pesässä ratkaiset neljä kennoa ja sitten kennon, joka koostuu niiden vastauksista.',
  aFull: 'Täysversio avattu',
  // the chooser
  chooseIntro: 'Kaksi sovellusta, sama pulma. Valitse, kumpaa kokeilet. Voit vaihtaa milloin tahansa.',
  kidsPick: '5–12-vuotiaille. Värikkäät maailmat, mehiläinen Indie ja tarrat. Ei kelloa.', proPick: 'Nuorille ja aikuisille. Päivän pesä ja putket, 60 sekunnin pikapeli ja mestaritasot.',
  savedHere: 'Edistyminen tallentuu vain tähän selaimeen.',
};
