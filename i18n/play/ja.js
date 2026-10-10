const T = {
  locale: 'ja',
  indie: 'はちのインディ', back: 'もどる', close: '閉じる', quit: 'やめる', settings: '設定', frac: s => { const [n, d] = s.split('/'); return d ? `${d}分の${n}` : s; },   // 3/4 → 4分の3
  switchApp: 'アプリをかえる', siteAria: 'Beequation：beequation.comに戻る',
  tiers: ['タマゴ', '幼虫', 'ブンブン', '働きバチ', '蜜集めバチ', '門番バチ', 'ロイヤルゼリー', '女王バチ'],
  ages: ['5+', '6+', '7+', '8+', '10+', '12+', '中高生〜大人', 'エキスパート'],
  modes: { add: ['たし算', '2つの数をたしてできる数を探す'], mul: ['かけ算', '2つの数をかけてできる数を探す'], neg: ['負の数', '0より小さい数を含むたし算'],
    frac: ['分数', '分数のたし算を暗算で'], mixed: ['ミックス', 'たし算かかけ算か、問題ごとに変わる'], hive: ['大きなハチの巣', '4つ解いてから、その答えでもう1つ'] },
  dailyJunior: 'きょうのパズル', dailyPro: 'デイリーチャレンジ',
  // Beequation Kids
  worlds: {
    add: ['たしざんのはらっぱ', ['たしざんのふたば', 'プラスのなかま', 'たしざんスター', 'たしざんのエース', 'あわせてヒーロー', 'はらっぱマスター']],
    mul: ['かけざんのおにわ', ['くくのおたまじゃくし', 'キラキラ2ばい', 'かけざんマジック', 'かけざんのプロ', 'おにわのてんさい', 'かけざんだいおう']],
    frac: ['ぶんすうのもり', ['はんぶんヒーロー', '4ぶんの1クイーン', 'ひときれスター', 'ぶんすうチャンピオン']],
    hive: ['おおきなはちのす', ['はたらきばち', 'はちのすキャプテン', 'でんせつのはち']],
  },
  gateTitle: '保護者の方専用', gatePrompt: '次の数を、1234のような数字で入力してください：', gateAnswer: '数字で入力', gateMiss: '違います。新しい数でもう一度お試しください。',
  gateOk: '次へ', gateCancel: 'キャンセル',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app:
  // kanji numerals, a leading one dropped before 千, 百 and 十 (1973 → 千九百七十三), an empty place left out, no spaces
  gateWords: n => {
    const D = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const place = (d, unit) => (d === 0 ? '' : d === 1 ? unit : D[d] + unit);
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
    return place(th, '千') + place(h, '百') + place(t, '十') + D[o];
  },
  stickersN: n => `シール${n}まい`, grownAria: 'おうちのかたのページ', grown: 'おうちのかた', hello: 'こんにちは！インディだよ。<br>いっしょにかずさがしをしよう！', play: 'あそぶ',
  unlock: 'ロックかいじょ', starsOf: (n, of) => `★ ${n}/${of}`, today: 'きょうのパズル', doneTick: 'できた✓', isNew: 'あたらしい！',
  kLevelAria: (t, st, s) => `レベル${t}、${st === 'paid' ? 'ロックちゅう' : st === 'locked' ? 'まだひらいていないよ' : s === 0 ? 'ほしなし' : `ほし${s}つ`}`,
  moreLevels: 'フルバージョンには、もっとたくさんのレベルがあるよ。', askGrown: 'おうちのひとにきく', paidNudge: 'このレベルはフルバージョンであそべるよ。おうちのひとにきいてね！',
  finishFirst: t => `さきにレベル${t}をクリアしよう。きみならできるよ！`,
  cheer: ['きみならできるよ！', 'ゆっくりでだいじょうぶ。', 'ふたつのかずからできるかずを、さがしてみよう！', 'ぜんぶのかずをよくみてね。'], yay: ['やった！', 'すごい！', 'せいかい！', 'ばっちり！', 'わあ！'],
  puzzleOf: (n, of) => `${n}もんめ（ぜんぶで${of}もん）`, worldLevel: (w, t) => `${w}、レベル${t}`, smallCombOf: n => `、ちいさなはちのす${n}つめ（ぜんぶで4つ）`, bigComb: '、おおきなはちのす！',
  useAnswers: 'こんどは4つのこたえをつかうよ！', kAsk: word => `ほかのふたつを${word}かずはどれかな？`, added: 'たした', multiplied: 'かけた',
  hint: 'ヒント', psst: x => `こっそりおしえるね。${x}からかんがえてみて。`, oops: 'おっと！ほかのかずをえらんでみて。',
  heads: ['', 'よくできたね！', 'すごいね！', 'さいこう！'], helpNone: 'しかも、ヒントなしで！', helpOne: 'ヒントは1かいだけだったよ。', helpN: n => `ヒントは${n}かいつかったよ。`,
  starsAria: n => (n === 0 ? 'ほしなし' : `ほし3つのうち${n}つ`), solvedAll: n => `パズルを${n}もん、ぜんぶといたね！`, comeBack: 'あしたもあたらしいパズルがあるよ。またきてね！', newSticker: 'あたらしいシール！',
  addedToBook: 'シールちょうにはったよ', get3: 'ほしを3つあつめると、このレベルのシールがもらえるよ。', nextLevel: 'つぎのレベル', again: 'もういちど', home: 'ホーム', map: 'マップ',
  myStickers: 'シールちょう', stickersHow: 'レベルでほしを3つあつめると、そのレベルのシールがもらえるよ。', notWon: n => `${n}、まだもらっていないよ`,
  forGrown: 'おうちのかたへ', kFull: 'フルバージョンをご利用中', kUnlockAll: n => `全${n}レベルを解放`, kThanks: 'ありがとうございます！すべてのワールドとレベルが遊べます。',
  kFree: n => `無料版では${n}レベルと「きょうのパズル」が遊べます。サブスクリプションに登録するか、買い切り版を購入すると、4つのワールドのすべてのレベルが開きます。難しいたし算、15の段までのかけ算、分数、そして「おおきなはちのす」が遊べます。`,
  kPrice: 'サブスクリプションは月額£4.99（英国での価格）から、最初の7日間は無料。広告なし。データ収集なし。いつでも解約できます。', backToFree: '無料版に戻す（プレビューのみ）',
  kBuy: 'フルバージョンを解放', previewNote: 'このプレビューでは購入の流れを再現しているだけで、実際の購入は行われません。アプリでは、ここからApp StoreまたはGoogle Playが開きます。', helpsTitle: '学びのポイント',
  helps: 'どのパズルも、ほかの2つの数からできている数を見つけるものです。数の合成・分解の力と、すばやい暗算の力が身につきます。インディのヒントで落ち着いて取り組めて、星はヒントやミスをやさしく数えるだけ。時間制限はありません。',
  progress: '学習の記録', reset: '記録をリセット', resetAsk: 'この端末の星とシールを消去しますか？', resetDone: '記録をリセットしました',
  // Beequation Pro
  streakAria: n => `${n}日連続`, dailyOn: d => `デイリーチャレンジ・${d}`, hiveNo: n => `ハチの巣 No.${n}`, doneIn: t => `${t}でクリア。午前0時に新しいハチの巣が登場します。`,
  tenMixed: 'ミックス問題が10問。今日は全員が同じ問題に挑戦します。', seeResult: '結果を見る', playToday: '今日のハチの巣に挑戦', blitzTile: '60秒アタック',
  best: n => `自己ベスト${n}問`, beatClock: '時間との勝負', hiveSub: 'エキスパート・4→1', practice: '練習', highest: '到達した最高レベル', notStarted: '未プレイ',
  rounds: (tagline, hive) => `${tagline}。1ラウンドは${hive ? 'ハチの巣3つ' : '10問'}です。`,
  aLevelAria: (t, name, st, s) => `レベル${t}、${name}、${st === 'paid' ? 'フルバージョンで解放' : st === 'locked' ? `先にレベル${t - 1}をクリアしてください` : `星${s}個`}`,
  // ages are '5+' … from the table above: shown as 5歳以上, like the app
  cellsAges: (n, a) => `${n}マス・${/^\d+\+$/.test(a) ? `${a.slice(0, -1)}歳以上` : a}`, fullVersion: 'フルバージョン', finishLevel: t => `先にレベル${t}をクリア`,
  blitzTitle: '60秒アタック', blitzHow: '1分間でできるだけ多く解いてください。まちがった数をタップすると2秒減ります。解放済みの最高レベルでプレイします。',
  nameLevel: (name, t) => `${name}・レベル${t}`, solvedWord: '問正解', smallComb: n => `小さなハニカム：4つ中${n}つ目`, finalComb: '最後のハニカム：4つの答え',
  aAsk: b => `ほかの2つを${b}数を探してください`, addUpTo: 'たした', multiplyTo: 'かけた', inARow: n => `${n}問連続`, wrongCosts: 'まちがえると2秒減ります',
  dailyDone: 'デイリーチャレンジ達成', firstDaily: '初めてのデイリーチャレンジです。また明日も挑戦してください。', faster: n => `前回より${n}秒速い`,
  slower: n => `前回より${n}秒遅い`, sameTime: '前回と同じタイム', blitzOf: name => `60秒アタック・${name}`, nSolved: n => `${n}問正解`,
  newBest: '自己ベスト更新', yourBest: n => `自己ベスト：${n}問`, levelDone: (name, t) => `${name} ${t} クリア`,
  subJoin: (a, b) => `${a}。${b}`,
  slips: n => (n === 0 ? 'ミスなし' : `ミス${n}回`), for3: par => `星3つの条件：${par}以内、ミス1回まで。`, fullMarks: '満点です。',
  shareNo: n => `Beequation No. ${n}`, firstTry: '一発正解', oneSlip: 'ミス1回', twoPlus: 'ミス2回以上', streak: n => `${n}日連続`, last7: '過去7日間',
  share: '結果をシェア', nextName: (name, t) => `次へ：${name} ${t}`, unlockNext: '次のレベルを解放', playBlitz: '60秒アタックに挑戦',
  shareBlitz: (n, mode, name) => `Beequation 60秒アタック：${n}問正解（${mode}・${name}）`, copied: '結果をコピーしました',
  aAll: n => `全${n}レベル`, aThanks: 'ありがとうございます。すべてのレベルが解放されました。',
  aFree: n => `無料版では${n}レベル、デイリーチャレンジ、60秒アタックが遊べます。フルバージョンでは「女王バチ」までのすべてのレベルが解放され、大きなハチの巣のエキスパート問題も遊べます。`,
  aPrice: 'サブスクリプションは月額£2.99または年額£29.99（英国での価格）で、最初の7日間は無料。買い切り版もあります。広告なし。いつでも解約できます。', aBuy: 'フルバージョンを解放',
  howTitle: '遊び方', how: 'どのハニカムにも、ほかの2つの数をたすか、かけてできる数が1つ隠れています。その数をタップしてください。1ラウンドは10問。大きなハチの巣では、4つのハニカムを解いたあと、その答えでできたハニカムを解きます。',
  aFull: 'フルバージョンを解放しました',
  // the chooser
  chooseIntro: '同じパズルから生まれた2つのアプリです。試したい方を選んでください。いつでも切り替えられます。',
  kidsPick: '5〜12歳向け。カラフルなワールド、はちのインディ、シールつきで、時間制限なし。', proPick: '中高生・大人向け。連続記録つきのデイリーチャレンジ、60秒アタック、エキスパートレベル。',
  savedHere: '記録はこのブラウザにだけ保存されます。',
};
