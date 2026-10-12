const T = {
  lastResult: "Ultimo risultato",
  readNumbers: "Leggi tutti i numeri",
  boardLabel: "Numeri dell’alveare",
  vibration: "Vibrazione",
  keyboardTitle: "Con lettore di schermo o tastiera",
  keyboardHelp: "Usa Tab per entrare nell’alveare. Le frecce passano da un numero all’altro; Home e Fine vanno al primo e all’ultimo. Invio o Spazio seleziona. Nel gioco, R legge tutti i numeri riga per riga. Esc torna indietro. La zona Ultimo risultato dopo l’alveare conserva ogni messaggio ed è raggiungibile con Tab o con il cursore di lettura del lettore di schermo.",
  noClock: "Senza fretta: Kids, i livelli e i puzzle quotidiani non hanno limiti di tempo. Solo Blitz ha un conto alla rovescia.",
  vibrationHelp: "Sui dispositivi compatibili puoi disattivare la vibrazione qui. Nuovo puzzle: impulso di 10 ms; risposta corretta: un impulso di 40 ms; errore: due impulsi di 40 ms con una pausa di 60 ms; fine del turno o tempo scaduto: un impulso di 300 ms.",
  readRow: (n, values) => `Riga ${n}: ${values}.`,
  cellPosition: (value, row, col) => `${value}, riga ${row}, colonna ${col}`,
  timeRemaining: (n) => `Restano ${n} secondi.`,
  timeUp: "Tempo scaduto.",
  locale: 'it',
  decSep: ",",
  indie: "L'ape Indie", back: 'Indietro', close: 'Chiudi', quit: 'Esci', settings: 'Impostazioni', frac: s => s.replace('/', ' fratto '),
  switchApp: 'Cambia app', siteAria: 'Beequation: torna a beequation.com',
  tiers: ["Uovo","Larva","Ronzio","Operaia","Bottinatrice","Sentinella","Pappa Reale","Regina","Sciame","Mente Alveare"],
  ages: ["5+","6+","7+","8+","10+","12+","ragazzi e adulti","esperti","esperti","esperti"],
  modes: {
    add: ["Addizioni","Trova il numero che è la somma di altri due"],
    mul: ["Moltiplicazioni","Trova il numero che è il prodotto di altri due"],
    neg: ["Negativi","Somme con numeri sotto lo zero"],
    frac: ["Frazioni","Somma le frazioni a mente"],
    mixed: ["Misto","Somma o prodotto: cambia a ogni rompicapo"],
    hive: ["Grande Alveare","Risolvine quattro, poi risolvi le loro risposte"],
    dec: ["Decimali","Somma i decimali a mente"],
    trio: ["Trio","Trova il numero che è la somma di altri tre"],
    tens: ["Decine","Somma decine e centinaia"],
  },
  dailyJunior: 'Sfida del giorno Junior', dailyPro: 'Sfida del giorno',
  // Beequation Kids
  worlds: {
    add: ["Prato delle Addizioni",["Germoglio delle Somme","Grillo del Più","Superstar delle Somme","Asso delle Addizioni","Talento del Totale","Maestro del Prato","Cavalletta del Cento","Mago delle Somme"]],
    mul: ["Giardino delle Tabelline",["Girino delle Tabelline","Doppio Lampo","Magia del Per","Prof del Prodotto","Genio del Giardino","Titano delle Tabelline","Fata delle Tabelline"]],
    frac: ["Foresta delle Frazioni",["Mito delle Metà","Regina dei Quarti","Stella degli Spicchi","Campione delle Frazioni","Pizzaiolo Provetto","Saggio della Foresta"]],
    tens: ["Città delle Decine",["Cucciolo delle Decine","Esploratore delle Decine","Amico dei Numeroni","Eroe delle Centinaia","Sindaco della Città"]],
    dec: ["Dune dei Decimali",["Cagnolino della Virgola","Cammello dei Decimi","Saetta delle Dune","Dinamo dei Decimali"]],
    hive: ["Grande Alveare",["Ape Operosa","Capitano del Favo","Leggenda dell'Alveare","Tesoro del Miele","Maestà dell'Alveare"]],
  },
  gateTitle: 'Solo per adulti', gatePrompt: 'Scrivi questo numero in cifre:', gateAnswer: 'Risposta in cifre', gateMiss: 'Non è giusto. Prova con il nuovo numero.',
  gateOk: 'Continua', gateCancel: 'Annulla',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app,
  // one word with a zero-width space after the thousands and the hundreds
  gateWords: n => {
    const ONES = ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];
    const TEENS = ['dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
    const TENS = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];
    const ZW = '​', r = n % 100, th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10;
    let rest;
    if (r < 20) rest = TEENS[r - 10];
    else {
      const t = TENS[Math.floor(r / 10)], o = r % 10;
      rest = o === 0 ? t : o === 1 || o === 8 ? t.slice(0, -1) + ONES[o] : o === 3 ? `${t}tré` : t + ONES[o];
    }
    const thousands = th === 1 ? 'mille' : `${ONES[th]}mila`, hundreds = h === 1 ? 'cento' : `${ONES[h]}cento`;
    return `${thousands}${ZW}${rest.startsWith('ott') ? hundreds.slice(0, -1) : hundreds}${ZW}${rest}`;
  },
  stickersN: n => n === 1 ? '1 figurina' : `${n} figurine`, grownAria: 'Area genitori', grown: 'Genitori', hello: 'Ciao! Sono Indie.<br>Andiamo a caccia di numeri!', play: 'Gioca',
  unlock: 'Sblocca', starsOf: (n, of) => `★ ${n} su ${of}`, today: 'Sfida del giorno', doneTick: 'Fatto ✓', isNew: 'Nuova!',
  kLevelAria: (t, st, s) => `Livello ${t}${st === 'paid' ? ', bloccato' : st === 'locked' ? ', non ancora aperto' : `, ${s} ${s === 1 ? 'stella' : 'stelle'}`}`,
  moreLevels: 'Altri livelli ti aspettano nel gioco completo.', askGrown: 'Chiedi a un adulto', paidNudge: 'Questi livelli sono nel gioco completo. Chiedi a un adulto!',
  finishFirst: t => `Prima completa il livello ${t}. Ce la puoi fare!`,
  cheer: ['Ce la puoi fare!', 'Con calma, hai tempo.', 'Trovane due che ne fanno un terzo!', 'Guarda bene ogni numero.'], yay: ['Sì!', 'Grande!', 'Esatto!', 'Super!', 'Wow!'],
  puzzleOf: (n, of) => `Rompicapo ${n} di ${of}`, worldLevel: (w, t) => `${w}, livello ${t}`, smallCombOf: n => `, favo piccolo ${n} di 4`, bigComb: ', favo grande!',
  useAnswers: 'Ora usa le tue quattro risposte!', kAsk: word => `Quale numero ottieni ${word} altri due?`, added: 'sommando', multiplied: 'moltiplicando',
  hint: 'Aiutino', psst: x => `Psst! Prova a cominciare da ${x}.`, oops: 'Ops! Provane un altro.',
  heads: ['', 'Ben fatto!', 'Ottimo lavoro!', 'Fantastico!'], helpNone: 'senza nemmeno un aiutino!', helpOne: 'con un solo aiutino.', helpN: n => `con ${n} aiutini.`,
  starsAria: n => `${n} ${n === 1 ? 'stella' : 'stelle'} su 3`, solvedAll: n => n === 1 ? 'Hai risolto il rompicapo' : `Hai risolto tutti e ${n} i rompicapi`, comeBack: 'Torna domani per una nuova sfida!', newSticker: 'Nuova figurina!',
  addedToBook: 'Aggiunta al tuo album', get3: 'Ottieni 3 stelle per vincere la figurina di questo livello.', nextLevel: 'Livello successivo', again: 'Gioca ancora', home: 'Inizio', map: 'Mappa',
  myStickers: 'Le mie figurine', stickersHow: 'Ottieni 3 stelle in un livello per vincere la sua figurina.', notWon: n => `${n}, non ancora vinta`,
  forGrown: 'Per i genitori', kFull: 'Gioco completo sbloccato', kUnlockAll: n => `Sblocca tutti i ${n} livelli`, kThanks: 'Grazie! Tutti i mondi e i livelli sono aperti.',
  kFree: free =>
      `Il gioco gratuito ha ${free} livelli e la sfida del giorno. Abbonati, o acquista l'accesso a vita una volta sola, per aprire tutti i livelli dei sei mondi: calcoli più difficili, tabelline fino al 20, frazioni, decine e centinaia, numeri decimali e il Grande Alveare.`,
  kPrice: 'Da 4,99 £ al mese, con 7 giorni gratis. Niente pubblicità. Nessun dato raccolto. Puoi annullare quando vuoi.', backToFree: 'Torna alla versione gratuita (solo anteprima)',
  kBuy: 'Sblocca il gioco completo', previewNote: "Questa anteprima simula l'acquisto. Nell'app, qui si apre l'App Store o Google Play.", helpsTitle: 'Cosa si impara',
  helps: "Ogni rompicapo chiede di trovare un numero formato da altri due. Così i bambini allenano le relazioni tra i numeri e il calcolo mentale veloce. Gli aiutini di Indie mantengono il clima sereno, e le stelle contano aiutini ed errori con delicatezza: non c'è nessun cronometro da battere.",
  progress: 'Progressi', reset: 'Azzera i progressi', resetAsk: 'Cancellare le stelle e le figurine su questo dispositivo?', resetDone: 'Progressi azzerati',
  // Beequation Pro
  streakAria: n => `Serie di ${n} ${n === 1 ? 'giorno' : 'giorni'}`, dailyOn: d => `Sfida del giorno, ${d}`, hiveNo: n => `Alveare n. ${n}`, doneIn: t => `Fatto in ${t}. A mezzanotte arriva un nuovo alveare.`,
  tenMixed: 'Dieci rompicapi misti, oggi uguali per tutti.', seeResult: 'Vedi il tuo risultato', playToday: "Gioca l'alveare di oggi", blitzTile: 'Blitz 60 s',
  best: n => `Record ${n}`, beatClock: 'Sfida il tempo', hiveSub: 'Esperti, 4 in 1', practice: 'Allenamento', highest: 'Livello più alto raggiunto', notStarted: 'Non iniziato',
  rounds: (tagline, hive) => `${tagline}. Partite da ${hive ? '3 alveari' : '10 rompicapi'}.`,
  aLevelAria: (t, name, st, s) => `Livello ${t}, ${name}${st === 'paid' ? ', nella versione completa' : st === 'locked' ? ', bloccato' : `, ${s} ${s === 1 ? 'stella' : 'stelle'}`}`,
  cellsAges: (n, a) => `${n} celle, ${/^\d/.test(a) ? `età ${a}` : `per ${a}`}`, fullVersion: 'Versione completa', finishLevel: t => `Completa il livello ${t}`,
  blitzTitle: 'Blitz di 60 secondi', blitzHow: 'Risolvi più rompicapi che puoi in un minuto. Un tocco sbagliato costa 2 secondi. Giochi al tuo livello sbloccato più alto.',
  nameLevel: (name, t) => `${name}, livello ${t}`, solvedWord: 'risolti', smallComb: n => `Favo piccolo ${n} di 4`, finalComb: 'Favo finale: le tue quattro risposte',
  trioAsk: "Quale numero è la **somma di altri tre**?",
  aAsk: b => `Quale numero è ${b} di altri due?`, addUpTo: 'la somma', multiplyTo: 'il prodotto', inARow: n => `${n} di fila`, wrongCosts: 'Un tocco sbagliato costa 2 secondi',
  dailyDone: 'Sfida del giorno completata', firstDaily: 'Il tuo primo alveare del giorno. Torna domani.', faster: n => `${n} ${n === 1 ? 'secondo' : 'secondi'} in meno rispetto all'ultima volta`,
  slower: n => `${n} ${n === 1 ? 'secondo' : 'secondi'} in più rispetto all'ultima volta`, sameTime: "Stesso tempo dell'ultima volta", blitzOf: name => `Blitz ${name}`, nSolved: n => n === 1 ? '1 risolto' : `${n} risolti`,
  newBest: 'Nuovo record personale', yourBest: n => `Il tuo record è ${n}`, levelDone: (name, t) => `Livello completato: ${name} ${t}`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => n === 1 ? '1 errore' : `${n} errori`, for3: par => `Per 3 stelle: meno di ${par} con al massimo 1 errore.`, fullMarks: 'Punteggio pieno.',
  shareNo: n => `Beequation n. ${n}`, firstTry: 'Al primo colpo', oneSlip: '1 errore', twoPlus: '2 o più', streak: n => `Serie di ${n} ${n === 1 ? 'giorno' : 'giorni'}`, last7: 'Ultimi 7 giorni',
  share: 'Condividi il risultato', nextName: (name, t) => `Prossimo: ${name} ${t}`, unlockNext: 'Sblocca i prossimi livelli', playBlitz: 'Gioca un blitz di 60 s',
  shareBlitz: (n, mode, name) => `Beequation blitz: ${n} ${n === 1 ? 'risolto' : 'risolti'} in 60 s (${mode}, ${name})`, copied: 'Risultato copiato',
  aAll: n => `Tutti i ${n} livelli`, aThanks: 'Grazie. Tutti i livelli sono aperti.',
  aFree: n => { return ((free, queen) =>
      `La versione gratuita include ${free} livelli, la Sfida del giorno e il blitz. La versione completa apre tutti i livelli fino a «${queen}», compresi Decimali, Trio e i rompicapi esperti del Grande Alveare.`)(n, T.tiers[9]); },
  aPrice: "Da 2,99 £ al mese o 29,99 £ all'anno, con 7 giorni gratis, oppure con l'accesso a vita. Niente pubblicità. Puoi annullare quando vuoi.", aBuy: 'Sblocca la versione completa',
  howTitle: 'Come si gioca', how: 'Ogni favo nasconde un numero che si ottiene sommando o moltiplicando altri due. Toccalo. Ogni partita ha 10 rompicapi; nel Grande Alveare risolvi quattro favi, poi un favo formato dalle loro risposte.',
  aFull: 'Versione completa sbloccata',
  // the chooser
  chooseIntro: 'Due app basate sullo stesso rompicapo. Scegline una da provare. Puoi cambiare quando vuoi.',
  kidsPick: "Dai 5 ai 12 anni. Mondi coloratissimi, l'ape Indie, figurine e nessun cronometro.", proPick: 'Ragazzi e adulti. Sfida del giorno con le serie, blitz di 60 secondi, livelli per esperti.',
  savedHere: 'I progressi vengono salvati solo in questo browser.',
};
