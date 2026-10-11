// Japan (ja): the printable worksheets' words, formats and pictures, and which sheets Japan uses.
// Read by tools/make-worksheets.mjs --lang ja (see learn-i18n/README.md). Facts follow learn-i18n/ja/BRIEF.md:
// decimal point (2.5), no separator up to 9999 and a comma from 10,000 (prices with a comma from 1,000円),
// × and ÷ as in 小学校, yen only (coins 1, 5, 10, 50, 100, 500円; 1000円 is a note), clock times in 時・分
// (「3時」「3時半」「3時15分」: Japanese has no "quarter past / to"), 九九 to 9 × 9 in 2年, わり算 in 3年,
// 小数 from 3年, 概数・四捨五入 and 面積 in 4年, 百分率 in 5年.
//
// Left out:
// - multiplication-check-practice: England's timed national check; Japan has no tables test (九九 is checked by
//   recitation in class).
// The tables and division sheets generate questions up to 12; on the Japanese sheets the ones with 10, 11 and 12 are
// named as チャレンジ問題 (extending the 九九, as in 2年 3学期 and 3年 「かけ算のきまり」). The 12 × 12 grid is kept as
// 「九九表を広げよう」 for the same reason.
// Drawing note: the generator has no option for a hole, so the 5円 and 50円 coins are drawn without their central hole
// (the label sits where the hole would be); the 500円 is the current bicolour coin (gold ring, paler centre).

// whole numbers: no separator up to 9999 (as in textbooks), a comma every three digits from 10,000
const num = n => (Math.abs(n) >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(n));
// prices: 「120円」, 「1,280円」 (comma from 1,000円, no space before 円)
const yen = v => `${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}円`;

const PLACE = { 10: '十', 100: '百', 1000: '千' };

// coin colours (BRIEF.md section 6, from the 財務省 list of coins)
const ALUMINIUM = '#D8D8D8';  // 1円
const BRASS = '#D4B04C';      // 5円
const BRONZE = '#B5673A';     // 10円
const NICKEL50 = '#C9CCCF';   // 50円
const NICKEL100 = '#C4C7CA';  // 100円
const RING500 = '#D9B95A';    // 500円 (2021–): nickel-brass ring
const CENTRE500 = '#D7CFAE';  //               paler centre

export default {
  htmlLang: 'ja',
  num,
  // decimals: a point; a final 0 is not written (0.80 → 0.8), as Japanese textbooks teach
  dec: (x, places) => String(Number(x.toFixed(places))),
  mul: '×', div: '÷',
  // 「47 = 10が4こと 1が7こ」
  tensOnes: b => `10が${b}こと 1が${b}こ`,
  tensOnesA: (t, o) => `10が${t}こと1が${o}こ`,
  // 「千の位まで：4562 → □」 (四捨五入して、千の位までのがい数にする)
  roundQ: (n, to, b) => `${PLACE[String(to).replace(/\D/g, '')]}の位まで：<b class="n">${n}</b> → ${b}`,
  // 「20の¾」, 「200の25%」
  of: (f, x) => `${x}の${f}`,
  pctOf: (p, x) => `${x}の${p}%`,

  // the clock times children learn (h 1 to 12 on a dial): 「3時」, 「3時半」, 「3時15分」, 「3時45分」, 「3時25分」
  timeWords: (h, m) => {
    const hh = h % 12 || 12;
    if (m === 0) return `${hh}時`;
    if (m === 30) return `${hh}時半`;
    return `${hh}時${m}分`;
  },
  digital: (h, m) => `${h % 12 || 12}:${String(m).padStart(2, '0')}`,

  // money in yen (no smaller unit): 「65円」, 「1,250円」
  money: v => yen(v),
  coinValues: [1, 5, 10, 50, 100, 500],
  coinLabel: v => `${v}円`,
  // yen coins: colour and real diameter in mm (財務省 「通常貨幣一覧」); all round
  coins: { 1: [ALUMINIUM, 20.0, 'circle'], 5: [BRASS, 22.0, 'circle'], 10: [BRONZE, 23.5, 'circle'],
    50: [NICKEL50, 21.0, 'circle'], 100: [NICKEL100, 22.6, 'circle'], 500: [RING500, 26.5, 'circle'] },
  coinInner: v => (v === 500 ? CENTRE500 : null),
  // paying with a 100円玉, a 500円玉 or a 1000円札; prices go up in 10円 steps
  paid: [100, 500, 1000], costStep: 10,
  // prices are random (20円 to 990円), so the items are things whose price can vary
  shopItems: ['おかし', 'くだもの', 'やさい', 'ぶんぼうぐ', 'おもちゃ', '花', 'クッキー', 'おみやげ'],
  // 「70円のおかしを買って、100円をはらいました。おつりは □」
  changeQ: (item, cost, paid, b) => `${cost}の${item}を買って、${paid}をはらいました。おつりは ${b}`,

  perimQ: b => `<div class="ansline">まわりの長さ ${b} cm</div><div class="ansline">面積 ${b} cm²</div>`,
  perimA: (p, a) => `まわりの長さ ${p} cm、面積 ${a} cm²`,
  shapes: { 3: '三角形', 4: '正方形', rect: '長方形', 5: '五角形', 6: '六角形', 8: '八角形', 0: '円', 7: '七角形', 10: '十角形' },
  shapeQ: b => `<div class="ansline wide">名前：</div><div class="ansline">辺の数 ${b} 頂点の数 ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? '円：辺も頂点もない（まわりは曲がった線）' : `${name}：辺 ${n}本、頂点 ${n}こ`),

  fruits: ['りんご', 'バナナ', 'ぶどう', 'みかん', 'なし'],
  chartQs: (f, v, mx, mn) => [
    [`${f[1]}をえらんだ人は何人ですか。`, `${v[1]}人`],
    ['いちばん人気があったくだものは何ですか。', f[mx]],
    ['えらんだ人がいちばん少なかったくだものは何ですか。', f[mn]],
    [`${f[mx]}をえらんだ人は、${f[mn]}をえらんだ人より何人多いですか。`, `${v[mx] - v[mn]}人`],
    ['ぜんぶで何人が答えましたか。', `${v.reduce((a, b) => a + b, 0)}人`],
  ],

  years: { nencho: '年長', '1-nensei': '小学1年生', '2-nensei': '小学2年生', '3-nensei': '小学3年生',
    '4-nensei': '小学4年生', '5-nensei': '小学5年生', '6-nensei': '小学6年生' },
  // 「小学2年生」, 「小学1・2年生」, 「小学3〜6年生」, 「年長・小学1年生」
  yearsLabel: (ys, n) => {
    const g = ys.filter(y => y !== 'nencho').map(y => y.split('-')[0]);
    const grades = !g.length ? '' : g.length === 1 ? `小学${g[0]}年生` : g.length === 2 ? `小学${g[0]}・${g[1]}年生` : `小学${g[0]}〜${g[g.length - 1]}年生`;
    if (!ys.includes('nencho')) return grades;
    if (!grades) return n.nencho;
    return g.length > 1 ? `年長〜小学${g[g.length - 1]}年生` : `年長・${grades}`;
  },
  name: '名前', date: '日付', tip: 'インディのアドバイス：', answers: '答え',
  titleTag: t => `算数プリント「${t}」：Beequation Kids`,
  footer: '家庭や教室で自由にコピーしてお使いください。ほかのプリントは <b>ja.beequation.com/learn</b> で',
  promo: '<b>インディといっしょに練習しませんか。</b>ja.beequation.com では、数字のハニカムパズルを無料で遊べます。スマートフォンやタブレット向けのアプリ「Beequation Kids」もあります。広告なし、データ収集なし、時間制限なし。',

  sheets: {
    // 数と位取り
    'missing-numbers-to-100': { title: '100までの数のならび', years: ['1-nensei', '2-nensei'],
      desc: '1ずつ、2ずつ、5ずつ、10ずつ数える', how: 'あいている □に あてはまる かずを かきましょう。',
      tip: 'こえに だして かぞえて みよう。とびかたが おかしい ところが あったら、みみが きづいて くれるよ！' },
    'tens-and-ones': { title: '10がいくつと1がいくつ', years: ['1-nensei'],
      desc: '2けたの数を、10のまとまりとばらに分ける', how: '□に あてはまる かずを かきましょう。',
      tip: '47の 4は 十のくらいの すうじで、10が 4こ。7は 一のくらいの すうじで、1が 7こ だよ。' },
    'hundreds-tens-ones': { title: '百の位・十の位・一の位', years: ['2-nensei'],
      desc: '3けたの数を、位ごとの数に分ける', how: 'それぞれの数を、何百 + 何十 + 何 の形に分けて書きましょう。',
      tip: '0は「その位には何もない」というしるしだよ。405には十の位の数がないけれど、0があるから4は百の位にいられるんだ。' },
    'rounding': { title: 'がい数（四捨五入）', years: ['4-nensei'],
      desc: '四捨五入して、十・百・千の位までのがい数にする', how: '四捨五入して、それぞれの位までのがい数にしましょう。',
      tip: 'その位のすぐ下の位の数字を見てね。0、1、2、3、4なら切り捨て、5、6、7、8、9なら切り上げだよ。' },
    // たし算とひき算
    'number-bonds-to-10': { title: 'あといくつで10', years: ['nencho', '1-nensei'],
      desc: 'いくつといくつ：あわせて10になる2つの数', how: 'あわせて 10に なるように、□に かずを かきましょう。',
      tip: 'ゆびを つかって みよう！ ゆびを 7ほん たてると、まがって いる ゆびは なんぼん かな？ それが あと いくつで 10の かずだよ。' },
    'number-bonds-to-20': { title: '20をつくろう', years: ['1-nensei', '2-nensei'],
      desc: 'あわせて20になる2つの数', how: '□に あてはまる かずを かきましょう。どの もんだいも 20の けいさんです。',
      tip: '3 + 7 = 10 を しって いれば、13 + 7 = 20 も すぐ わかるね。10の くみあわせが、20の けいさんを たすけて くれるよ！' },
    'add-and-subtract-within-20': { title: '20までのたし算とひき算', years: ['1-nensei'],
      desc: 'くり上がり・くり下がりのある計算もまぜて', how: 'けいさんを しましょう。',
      tip: 'ひきざんで こまったら、10と いくつに わけて みよう。13 − 9 なら、10 − 9 = 1、1と 3で 4 だよ。' },
    'column-addition': { title: 'たし算の筆算（3けた）', years: ['3-nensei'],
      desc: '3けた + 3けた、くり上がりあり', how: 'たし算の筆算をしましょう。一の位から計算します。',
      tip: 'たした数が10以上になったら、次の位に1くり上げるよ。くり上げた1を小さく書いておくと、わすれないね。' },
    'column-subtraction': { title: 'ひき算の筆算（3けた）', years: ['3-nensei'],
      desc: '3けた − 3けた、くり下がりあり', how: 'ひき算の筆算をしましょう。一の位から計算します。',
      tip: 'たしかめ算をしよう。532 − 178 = 354 なら、354 + 178 は 532 になるはずだよ。' },
    // かけ算とわり算
    'times-tables-2-5-10': { title: '九九：2の段・5の段と10のかけ算', years: ['2-nensei', '3-nensei'],
      desc: '九九のまぜ問題と、九九をこえるチャレンジ問題',
      how: 'かけ算をしましょう。10、11、12が出てくる問題は、九九をこえるチャレンジ問題です。',
      tip: '5の段の答えは、一の位が0か5になるよ。かける数が1ふえると、答えはかけられる数だけふえるから、2 × 9 = 18 なら 2 × 10 = 20 だね。' },
    'times-tables-3-4-8': { title: '九九：3の段・4の段・8の段', years: ['2-nensei', '3-nensei'],
      desc: '九九のまぜ問題と、九九をこえるチャレンジ問題',
      how: 'かけ算をしましょう。10、11、12が出てくる問題は、九九をこえるチャレンジ問題です。',
      tip: '8の段の答えは、4の段の答えの2倍だよ。4 × 6 = 24 なら、8 × 6 = 48。' },
    'multiplication-grid': { title: '九九表を広げよう', years: ['2-nensei', '3-nensei'],
      desc: '12 × 12までのかけ算表をうめる',
      how: '左のはしの数（かけられる数）に、上のはしの数（かける数）をかけて、ますをうめましょう。まず九九のところをうめてから、10、11、12のところにチャレンジしましょう。',
      tip: '九九表には、きまりがたくさんかくれているよ。3 × 7 と 7 × 3 は同じ答え。右に1つ進むと、答えはその段の数だけふえるんだ。' },
    'division-facts': { title: 'わり算：九九で答えを見つけよう', years: ['3-nensei', '4-nensei'],
      desc: '九九を使うわり算と、チャレンジ問題',
      how: 'わり算をしましょう。わる数や答えが10より大きい問題は、チャレンジ問題です。',
      tip: '42 ÷ 6 は、「6 × □ = 42」の□を考えるよ。6の段で答えが42になるのは「ろくしち しじゅうに」。だから答えは7！' },
    'short-multiplication': { title: 'かけ算の筆算（3けた × 1けた）', years: ['3-nensei'],
      desc: '3けたの数に1けたの数をかける筆算', how: 'かけ算の筆算をしましょう。一の位から計算します。',
      tip: '一の位から順にかけていくよ。くり上がった数を小さく書いておいて、次の位のかけ算の答えにたしてね。' },
    // 分数
    'what-fraction-is-shaded': { title: '色をぬったのは何分の何？', years: ['3-nensei'],
      desc: '½、⅓、¼などを図で見る', how: '色をぬったところは、もとの大きさの何分の何ですか。分数で書きましょう。',
      tip: 'まず、同じ大きさに分けた数を数えよう。それが分母（下の数）。次に、色をぬった数を数えると、それが分子（上の数）だよ。' },
    'fractions-of-amounts': { title: 'ある数の何分の何', years: ['5-nensei', '6-nensei'],
      desc: '20の¾のように、ある数の½や¾にあたる大きさを求める', how: '計算しましょう。',
      tip: 'まず分母の数でわって、それから分子の数をかけるよ。20の¾なら、20 ÷ 4 = 5、5 × 3 = 15。' },
    'equivalent-fractions': { title: '大きさの等しい分数', years: ['4-nensei', '5-nensei'],
      desc: '□にあてはまる数を見つける', how: '2つの分数の大きさが等しくなるように、□にあてはまる数を書きましょう。',
      tip: '分母と分子に同じ数をかけても、分数の大きさは変わらないよ。½ = ⁴⁄₈ は、分母と分子に4をかけたんだ。' },
    // 小数と割合
    'tenths-and-hundredths': { title: '分数を小数で表そう', years: ['4-nensei', '5-nensei'],
      desc: '10分のいくつ、100分のいくつを小数に', how: '分数を小数で書きましょう。',
      tip: '⅒の位は小数点のすぐ右、¹⁄₁₀₀の位はそのもう1つ右だよ。⁷⁄₁₀₀ は 0.07。' },
    'percentages-of-amounts': { title: '百分率（%）の計算', years: ['5-nensei', '6-nensei'],
      desc: '10%、25%、50%などにあたる大きさを求める', how: '計算しましょう。',
      tip: '10%は、10でわると求められるよ。30%は10%の3つ分、5%は10%の半分だね。' },
    // 時計の読み方
    'time-oclock-and-half-past': { title: 'なんじ・なんじはん', years: ['1-nensei'],
      desc: '時計を読む（ちょうどと半）', how: 'とけいは なんじ ですか。「なんじ」か「なんじはん」で かきましょう。',
      tip: 'みじかい はりで「なんじ」を よむよ。ながい はりが 12を さして いたら ちょうど、6を さして いたら「はん」だよ。' },
    'time-quarter-past-and-to': { title: 'なんじなんぷん（15分ごと）', years: ['1-nensei'],
      desc: '長いはりが12・3・6・9をさす時計を読む', how: 'とけいは なんじ なんぷん ですか。かきましょう。',
      tip: 'ながい はりが 3を さして いたら 15ふん、6なら 30ぷん、9なら 45ふん だよ。' },
    'time-to-5-minutes': { title: '何時何分（5分ごと）', years: ['1-nensei', '2-nensei'],
      desc: '時計を読んで、デジタル時計の書き方でも書く',
      how: '時計の時こくを、上の線には「何時何分」で、下の線にはデジタル時計の書き方（3:25 など）で書きましょう。',
      tip: '長いはりは、数字1つで5分進むよ。5、10、15…と5とびで数えよう。' },
    // お金の計算
    'counting-coins': { title: 'お金をかぞえよう', years: ['2-nensei', '3-nensei'],
      desc: '1円玉から500円玉までの合計', how: 'さいふの中のお金は、ぜんぶでいくらですか。',
      tip: '大きいお金から数えるといいよ。100円、150円、160円、165円…のように、数えたしていこう。' },
    'giving-change': { title: 'おつりはいくら？', years: ['2-nensei', '3-nensei'],
      desc: '100円玉、500円玉、1000円札ではらったときのおつり', how: '買い物のおつりを計算しましょう。',
      tip: 'ねだんから、はらったお金まで数えてみよう。70円のおかしを100円で買うと、80円、90円、100円で、おつりは30円だよ。' },
    // 長さ・かさ・重さ
    'perimeter-and-area': { title: 'まわりの長さと面積', years: ['4-nensei'],
      desc: '1cmのます目にかいた長方形',
      how: '1つのます目は、1辺が1cmの正方形です。それぞれの長方形のまわりの長さと面積を求めましょう。',
      tip: 'まわりの長さは、4つの辺の長さをぜんぶたしたもの。面積は、中にある1cm²の正方形の数だよ。たて × 横 でも求められるね。' },
    // 図形
    '2d-shapes': { title: '図形の名前と辺・頂点', years: ['2-nensei', '3-nensei'],
      desc: '三角形、四角形、六角形などの名前と、辺と頂点の数',
      how: 'それぞれの図形の名前を書いて、辺と頂点（かど）の数を数えましょう。',
      tip: '数えた頂点に、小さく点をうっていこう。同じ頂点を2回数えずにすむよ。三角形は辺が3本、四角形は4本。名前に数がかくれているね。' },
    // 表とグラフ
    'reading-bar-charts': { title: '棒グラフを読もう', years: ['2-nensei', '3-nensei'],
      desc: 'すきなくだものしらべ',
      how: '3年1組で、すきなくだものをしらべました。棒グラフを見て、問題に答えましょう。',
      tip: '棒のいちばん上から、横にまっすぐ指をすべらせて、左の目もりを読もう。' },
    // 式・比・比例
    'missing-number-problems': { title: '□にあてはまる数', years: ['3-nensei', '4-nensei'],
      desc: '□を使った式で、わからない数を求める', how: '□にあてはまる数を求めましょう。',
      tip: '反対の計算を使おう。□ + 7 = 15 なら 15 − 7、3 × □ = 24 なら 24 ÷ 3 で求められるよ。' },
  },
};
