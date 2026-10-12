// South Korea (ko): the printable worksheets' words, formats and pictures, and which sheets Korean schools use.
// Read by tools/make-worksheets.mjs --lang ko (see learn-i18n/README.md). Facts follow learn-i18n/ko/BRIEF.md:
// decimal point, a comma every three digits (1,000원), × and ÷ in 초등학교, won with 10·50·100·500원 coins (no smaller
// unit, so no decimals in money), clock times as textbooks write them ("3시", "3시 30분", "3시 45분"; "몇 분 전" only for
// simple cases like 10분 전), 곱셈구구 from 2단 to 9단, the per-year split of the 2022 개정 교육과정 textbooks.
// Numbers are always written in digits: the curriculum asks that 1~2학년 children are not made to write them in Hangul.
//
// Left out (they don't fit Korean schools):
// - multiplication-check-practice: England's timed tables check; Korea has no tables test.
// - multiplication-grid: a 12 × 12 grid; Korea's 곱셈표 is 9 × 9.
// The tables and division sheets ask up to 12; on the Korean sheets the × 10, × 11 and × 12 questions are named as
// 도전 문제 (beyond 곱셈구구), solved with 10씩 뛰어 세기 (5 × 12 = 5 × 10 + 5 × 2).
// Years differ from BRIEF section 12 where a sheet's numbers need a later year: column addition and subtraction are
// three-digit (3-1), coin totals run past 1,000원 (2학년 numbers), the tenths sheet is half hundredths (4학년), the
// missing-number sheet has × and ÷ (3학년 up), and the shapes sheet asks for 변 and 꼭짓점 (2학년 up).

// whole numbers: a comma every three digits, as on price tags and in everyday writing (1,000 / 12,500)
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const won = w => `${num(w)}원`;
// 을 after a final consonant, 를 after a vowel (Hangul syllables only; every word passed here ends in one)
const eul = w => ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? `${w}을` : `${w}를`);

const PLACE = { 10: '십의 자리', 100: '백의 자리', 1000: '천의 자리' };

// The time children write on the clock sheets: hours and minutes in digits, as in the textbooks ("몇 시 몇 분").
// 50 and 55 minutes also have the simple "몇 시 몇 분 전" form the 2학년 textbook teaches (10분 전, 5분 전).
function timeWords(h, m) {
  const hh = h % 12 || 12, next = (h % 12) + 1;
  if (m === 0) return `${hh}시`;
  if (m >= 50) return `${hh}시 ${m}분 또는 ${next}시 ${60 - m}분 전`;
  return `${hh}시 ${m}분`;
}
const digital = (h, m) => `${h % 12 || 12}:${String(m).padStart(2, '0')}`;

// Bank of Korea coin colours: the 10원 coin (2006 on) is copper-clad, 50원, 100원 and 500원 are silver-coloured
const COPPER = '#C27C4E', SILVER = '#CDD2D8';

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `시계: 긴바늘이 가리키는 숫자는 ${minute}이고, 짧은바늘이 가리키는 숫자는 ${hour}입니다`
      : `시계: 긴바늘이 가리키는 숫자는 ${minute}이고, 짧은바늘은 두 숫자 ${hour}, ${next} 사이에 있습니다`;
  },
  shapeAlt: n => `도형 ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind}: 같은 크기의 ${total}부분 중 ${shaded}부분을 색칠한 그림`,
  fractionKinds: {"bar": "막대", "circle": "원", "grid": "격자 도형"},
  coinAlt: value => `${value} 동전`,
  rectangleAlt: (w, h) => `한 변이 1cm인 정사각형이 가로 ${w}칸, 세로 ${h}칸으로 놓인 직사각형`,
  chartAlt: "좋아하는 과일에 투표한 수를 나타낸 막대그래프. 값은 아래 표에 있습니다",
  chartFruit: "과일", chartVotes: "투표 수",
  htmlLang: 'ko',
  num,
  // decimal point; a final 0 may be left off (4학년: 0.8 = 0.80), so the answer key shows both: "0.8 (0.80)"
  dec: (x, places) => {
    const s = x.toFixed(places), t = s.replace(/0+$/, '').replace(/\.$/, '');
    return t === s ? s : `${t} (${s})`;
  },
  mul: '×', div: '÷',
  // 1학년: "47은 10개씩 묶음 4개와 낱개 7개"
  tensOnes: b => `10개씩 묶음 ${b}개와 낱개 ${b}개`,
  tensOnesA: (t, o) => `10개씩 묶음 ${t}개, 낱개 ${o}개`,
  // 5학년 반올림: "반올림하여 백의 자리까지: 4,567 → ▢"
  roundQ: (n, to, b) => `반올림하여 ${PLACE[String(to).replace(/\D/g, '')]}까지: <b class="n">${n}</b> → ${b}`,
  // "12의 ⅓" (3-2: 전체에 대한 분수만큼은 얼마), "80의 25%"
  of: (f, x) => `${x}의 ${f}`,
  pctOf: (p, x) => `${x}의 ${p}%`,

  timeWords, digital,

  // money in won, the smallest unit: "650원", "1,160원"
  money: w => won(w),
  coinValues: [10, 50, 100, 500],
  coinLabel: v => `${v}원`,
  // real diameters in mm (한국은행 현용주화)
  coins: { 10: [COPPER, 18.0, 'circle'], 50: [SILVER, 21.6, 'circle'], 100: [SILVER, 24.0, 'circle'], 500: [SILVER, 26.5, 'circle'] },
  coinInner: () => null,   // no two-colour coins in Korea
  paid: [1000, 5000], costStep: 10,
  // things a child buys at a 문구점, 편의점 or 분식집; prices are random, so items whose price can vary
  shopItems: ['공책', '색연필', '스티커', '과자', '아이스크림', '빵', '김밥', '우유'],
  // "1,000원을 내고 650원짜리 아이스크림을 샀어요. 거스름돈: ▢" (paid always ends in 원, so 을)
  changeQ: (item, cost, paid, b) => `${paid}을 내고 ${cost}짜리 ${eul(item)} 샀어요. 거스름돈: ${b}`,

  perimQ: b => `<div class="ansline">둘레 ${b} cm</div><div class="ansline">넓이 ${b} cm²</div>`,
  perimA: (p, a) => `둘레 ${p} cm, 넓이 ${a} cm²`,
  // 2학년 names 삼각형, 사각형, 원, 오각형, 육각형; 3학년 adds 정사각형 and 직사각형
  shapes: { 3: '삼각형', 4: '사각형(정사각형)', rect: '사각형(직사각형)', 5: '오각형', 6: '육각형', 8: '팔각형', 0: '원', 7: '칠각형', 10: '십각형' },
  shapeQ: b => `<div class="ansline wide">이름:</div><div class="ansline">변 ${b}개 꼭짓점 ${b}개</div>`,
  shapeA: (name, n) => (n === 0 ? '원: 변도 꼭짓점도 없어요' : `${name}: 변 ${n}개, 꼭짓점 ${n}개`),

  fruits: ['사과', '바나나', '포도', '귤', '배'],
  chartQs: (f, v, mx, mn) => [
    [`${eul(f[1])} 고른 학생은 몇 명인가요?`, `${v[1]}명`],
    ['가장 많은 학생이 고른 과일은 무엇인가요?', f[mx]],
    ['가장 적은 학생이 고른 과일은 무엇인가요?', f[mn]],
    [`${eul(f[mx])} 고른 학생은 ${eul(f[mn])} 고른 학생보다 몇 명 더 많나요?`, `${v[mx] - v[mn]}명`],
    ['조사한 학생은 모두 몇 명인가요?', `${v.reduce((a, b) => a + b, 0)}명`],
  ],

  years: { 'yuchiwon-5se': '유치원 만 5세반', 'chodeung-1': '초등 1학년', 'chodeung-2': '초등 2학년', 'chodeung-3': '초등 3학년',
    'chodeung-4': '초등 4학년', 'chodeung-5': '초등 5학년', 'chodeung-6': '초등 6학년' },
  // "초등 3학년", "초등 1~2학년", "초등 3~5학년", "유치원 만 5세반, 초등 1학년"
  yearsLabel: (ys, n) => {
    const pre = ys.filter(y => !y.startsWith('chodeung-')).map(y => n[y]);
    const g = ys.filter(y => y.startsWith('chodeung-')).map(y => Number(y.slice(9))).sort((a, b) => a - b);
    const run = g.length > 1 && g.every((x, i) => !i || x === g[i - 1] + 1);
    const pri = !g.length ? [] : [g.length === 1 ? `초등 ${g[0]}학년` : run ? `초등 ${g[0]}~${g[g.length - 1]}학년` : `초등 ${g.join('·')}학년`];
    return [...pre, ...pri].join(', ');
  },
  name: '이름', date: '날짜', tip: '인디의 팁:', answers: '정답',
  titleTag: t => `${t}: Beequation Kids 학습지`,
  footer: '집과 교실에서 자유롭게 복사해 쓰세요. 학습지 더 보기: <b>ko.beequation.com/learn</b>',
  promo: '<b>인디와 함께 연습해요.</b> ko.beequation.com에서 벌집 숫자 퍼즐을 무료로 풀어 보거나, 휴대폰이나 태블릿에서 Beequation Kids를 찾아보세요. 광고도, 데이터 수집도, 시간제한도 없어요.',

  sheets: {
    // 수 세기와 자릿값
    'missing-numbers-to-100': { title: '100까지의 수 뛰어 세기', years: ['chodeung-1', 'chodeung-2'],
      desc: '1씩, 2씩, 5씩, 10씩 뛰어 세기', how: '규칙에 맞게 빈칸에 알맞은 수를 써넣으세요.',
      tip: '수를 소리 내어 읽으면서 세어 보세요. 뛰어 세는 수가 바뀌는 곳이 있으면 귀가 먼저 알아채요!' },
    'tens-and-ones': { title: '10개씩 묶음과 낱개', years: ['chodeung-1'],
      desc: '두 자리 수를 묶음과 낱개로 나타내기', how: '각 수는 10개씩 묶음 몇 개와 낱개 몇 개인지 빈칸에 쓰세요.',
      tip: '47에서 앞의 4는 10개씩 묶음이 4개라는 뜻이고, 뒤의 7은 낱개가 7개라는 뜻이에요.' },
    'hundreds-tens-ones': { title: '세 자리 수의 자릿값', years: ['chodeung-2'],
      desc: '몇백, 몇십, 몇으로 나타내기', how: '각 수를 몇백 + 몇십 + 몇으로 나타내세요.',
      tip: '0은 빈자리를 지켜 줘요. 405는 십의 자리 숫자가 0이라서 405 = 400 + 0 + 5예요.' },
    'rounding': { title: '반올림하기', years: ['chodeung-5'],
      desc: '반올림하여 십, 백, 천의 자리까지 나타내기', how: '각 수를 반올림하여 주어진 자리까지 나타내세요.',
      tip: '나타낼 자리 바로 아래 자리의 숫자를 보세요. 0, 1, 2, 3, 4이면 버리고, 5, 6, 7, 8, 9이면 올려요.' },
    // 덧셈과 뺄셈
    'number-bonds-to-10': { title: '10 만들기', years: ['yuchiwon-5se', 'chodeung-1'],
      desc: '더해서 10이 되는 두 수', how: '빈칸에 알맞은 수를 써서 10을 만들어 보세요.',
      tip: '손가락으로 해 보세요! 손가락 7개를 펴면 접힌 손가락은 몇 개일까요? 펴진 손가락과 접힌 손가락을 모으면 10이 돼요.' },
    'number-bonds-to-20': { title: '20 만들기', years: ['chodeung-1'],
      desc: '더해서 20이 되는 두 수', how: '빈칸에 알맞은 수를 쓰세요. 모든 식에 20이 숨어 있어요!',
      tip: '3 + 7 = 10을 알면 13 + 7 = 20도 알 수 있어요. 10 만들기가 20 만들기를 도와줘요!' },
    'add-and-subtract-within-20': { title: '20까지의 덧셈과 뺄셈', years: ['chodeung-1', 'chodeung-2'],
      desc: '덧셈과 뺄셈 섞어 풀기', how: '계산해 보세요.',
      tip: '10을 넘을 때는 10을 먼저 만들어요. 8 + 5는 8 + 2 + 3 = 13. 뺄셈은 10에서 빼요. 13 − 5는 10 − 5 = 5, 5 + 3 = 8이에요.' },
    'column-addition': { title: '세 자리 수의 덧셈', years: ['chodeung-3'],
      desc: '받아올림이 있는 세로셈', how: '세로셈으로 계산하세요. 일의 자리부터 시작해요!',
      tip: '같은 자리끼리 더한 값이 10이거나 10보다 크면 일의 자리 숫자만 쓰고, 1은 바로 윗자리로 받아올려요. 받아올린 1을 윗자리 위에 작게 써 두면 잊지 않아요.' },
    'column-subtraction': { title: '세 자리 수의 뺄셈', years: ['chodeung-3'],
      desc: '받아내림이 있는 세로셈', how: '세로셈으로 계산하세요. 일의 자리부터 시작해요!',
      tip: '덧셈으로 검산해 보세요. 532 − 178 = 354가 맞다면 354 + 178은 532가 되어야 해요.' },
    // 곱셈과 나눗셈
    'times-tables-2-5-10': { title: '곱셈구구 2단, 5단과 10의 곱', years: ['chodeung-2', 'chodeung-3'],
      desc: '곱셈구구 섞어 풀기, 도전 문제 포함', how: '곱셈을 해 보세요. 곱셈구구는 9까지 곱하니까 × 10, × 11, × 12가 나오는 문제는 도전 문제예요. 10씩 뛰어 세기를 떠올려 보세요.',
      tip: '10을 곱한 값은 끝자리가 모두 0이고, 5단의 곱은 끝자리가 0 아니면 5예요. 5 × 12는 5 × 10 = 50에 5 × 2 = 10을 더해서 60이에요.' },
    'times-tables-3-4-8': { title: '곱셈구구 3단, 4단, 8단', years: ['chodeung-2', 'chodeung-3'],
      desc: '곱셈구구 섞어 풀기, 도전 문제 포함', how: '곱셈을 해 보세요. 곱셈구구는 9까지 곱하니까 × 10, × 11, × 12가 나오는 문제는 도전 문제예요. 4 × 12는 4 × 10에 4 × 2를 더하면 돼요.',
      tip: '8단의 곱은 4단의 곱의 2배예요. 4 × 6 = 24를 알면 8 × 6 = 48도 알 수 있어요.' },
    'division-facts': { title: '곱셈구구로 나눗셈하기', years: ['chodeung-3', 'chodeung-4'],
      desc: '나눗셈의 몫 구하기, 도전 문제 포함', how: '나눗셈의 몫을 구하세요. 88 ÷ 11처럼 곱셈구구를 넘는 문제는 도전 문제예요.',
      tip: '나눗셈은 곱셈을 거꾸로 생각하면 돼요. 42 ÷ 6은 “6에 어떤 수를 곱해야 42가 될까?” 하고 생각해요.' },
    'short-multiplication': { title: '(세 자리 수) × (한 자리 수)', years: ['chodeung-3', 'chodeung-4'],
      desc: '세로셈으로 곱하기', how: '세로셈으로 계산하세요.',
      tip: '일의 자리부터 곱해요. 곱이 10이거나 10보다 크면 일의 자리 숫자만 쓰고, 십의 자리 숫자는 윗자리로 올려서 다음 곱에 더해요.' },
    // 분수
    'what-fraction-is-shaded': { title: '색칠한 부분을 분수로', years: ['chodeung-3'],
      desc: '2분의 1, 3분의 1, 4분의 1 …', how: '전체를 똑같이 나눈 것 중 색칠한 부분은 얼마인지 분수로 쓰세요.',
      tip: '먼저 똑같이 나눈 부분이 모두 몇 개인지 세어요. 그 수가 아래에 쓰는 분모예요. 그다음 색칠한 부분을 세면 위에 쓰는 분자가 돼요.' },
    'fractions-of-amounts': { title: '분수만큼은 얼마일까요', years: ['chodeung-3', 'chodeung-4'],
      desc: '12의 ½, 20의 ¾ 같은 문제', how: '계산해 보세요.',
      tip: '분모로 나누고, 분자만큼 곱해요. 20의 4분의 3은 20 ÷ 4 = 5, 5 × 3 = 15예요.' },
    'equivalent-fractions': { title: '크기가 같은 분수', years: ['chodeung-5'],
      desc: '빈칸에 알맞은 수 찾기', how: '두 분수의 크기가 같도록 빈칸에 알맞은 수를 쓰세요.',
      tip: '분모에 곱한 수를 분자에도 똑같이 곱해요. 2분의 1과 8분의 4는 크기가 같아요. 분모와 분자에 모두 4를 곱했거든요.' },
    // 소수와 백분율
    'tenths-and-hundredths': { title: '분수를 소수로', years: ['chodeung-4'],
      desc: '소수 한 자리 수와 두 자리 수', how: '분수를 소수로 나타내세요.',
      tip: '분모가 10인 분수는 소수 한 자리 수, 분모가 100인 분수는 소수 두 자리 수가 돼요. 100분의 7은 0.07이에요.' },
    'percentages-of-amounts': { title: '백분율만큼은 얼마일까요', years: ['chodeung-6'],
      desc: '10%, 25%, 50% 등', how: '계산해 보세요.',
      tip: '10%는 10으로 나누면 구할 수 있어요. 30%는 10%의 3배이고, 5%는 10%의 절반이에요.' },
    // 시계 보기
    'time-oclock-and-half-past': { title: '몇 시, 몇 시 30분', years: ['chodeung-1'],
      desc: '시계 보기', how: '시계가 가리키는 시각을 쓰세요. 3시 30분은 3시 반이라고 써도 돼요.',
      tip: '짧은바늘은 ‘시’를, 긴바늘은 ‘분’을 알려 줘요. 긴바늘이 12를 가리키면 ‘몇 시’, 6을 가리키면 ‘몇 시 30분’이에요.' },
    'time-quarter-past-and-to': { title: '몇 시 15분, 몇 시 45분', years: ['chodeung-2'],
      desc: '시계 보기', how: '시계가 가리키는 시각을 ‘몇 시 몇 분’으로 쓰세요.',
      tip: '긴바늘이 3을 가리키면 15분, 9를 가리키면 45분이에요. 45분일 때 짧은바늘은 다음 숫자에 거의 다 왔지만, 아직 지나지 않았으니 ‘시’는 그대로예요.' },
    'time-to-5-minutes': { title: '몇 시 몇 분', years: ['chodeung-2'],
      desc: '5분 단위로 시계 보기', how: '시계가 가리키는 시각을 ‘몇 시 몇 분’으로 쓰고, 아랫줄에는 디지털시계처럼 써 보세요.',
      tip: '긴바늘이 가리키는 숫자에 5를 곱하면 분이 돼요. 8을 가리키면 5 × 8 = 40, 40분이에요. 50분은 ‘다음 시 10분 전’, 55분은 ‘다음 시 5분 전’이라고도 해요.' },
    // 돈 계산 (생활 속 수학)
    'counting-coins': { title: '동전 세기', years: ['chodeung-2', 'chodeung-3'],
      desc: '10원, 50원, 100원, 500원 동전 세기', how: '동전은 모두 얼마인지 빈칸에 쓰세요.',
      tip: '가장 큰 동전부터 세어 보세요. 500원, 600원, 650원, 660원…처럼 이어서 세어 나가요.' },
    'giving-change': { title: '거스름돈 계산하기', years: ['chodeung-3'],
      desc: '1,000원, 5,000원을 냈을 때', how: '물건을 사고 받을 거스름돈은 얼마인지 구하세요.',
      tip: '물건값부터 낸 돈까지 이어서 세어 보세요. 650원에서 700원까지 50원, 700원에서 1,000원까지 300원. 거스름돈은 350원이에요.' },
    // 측정과 단위
    'perimeter-and-area': { title: '직사각형의 둘레와 넓이', years: ['chodeung-5'],
      desc: '1 cm 모눈 위의 직사각형', how: '모눈 한 칸은 한 변의 길이가 1 cm인 정사각형이에요. 직사각형의 둘레와 넓이를 구하세요.',
      tip: '둘레는 도형의 바깥을 한 바퀴 돈 길이예요. 네 변의 길이를 모두 더해요. 넓이는 안에 있는 1 cm² 칸의 수이고, (가로) × (세로)로도 구할 수 있어요.' },
    // 도형
    '2d-shapes': { title: '여러 가지 도형', years: ['chodeung-2', 'chodeung-3'],
      desc: '도형의 이름, 변과 꼭짓점의 수', how: '도형의 이름을 쓰고, 변과 꼭짓점이 몇 개인지 세어 보세요.',
      tip: '꼭짓점을 셀 때마다 작은 점을 찍어 두면 두 번 세지 않아요. 변의 수로 이름을 알 수 있어요. 변이 5개인 도형은 오각형이에요.' },
    // 표와 그래프
    'reading-bar-charts': { title: '막대그래프 읽기', years: ['chodeung-3', 'chodeung-4'],
      desc: '좋아하는 과일 조사', how: '우리 반 학생들이 좋아하는 과일을 조사하여 막대그래프로 나타냈어요. 그래프를 보고 물음에 답하세요.',
      tip: '막대 끝에서 옆으로 손가락을 쭉 옮겨 세로 눈금을 읽어요. 눈금 한 칸이 몇 명인지 먼저 확인하세요.' },
    // 규칙과 비율
    'missing-number-problems': { title: '□ 안에 알맞은 수', years: ['chodeung-3', 'chodeung-4'],
      desc: '□가 있는 식', how: '□ 안에 알맞은 수를 쓰세요.',
      tip: '거꾸로 계산해 보세요. □ + 7 = 15에서는 15 − 7을, 3 × □ = 24에서는 24 ÷ 3을 계산하면 돼요.' },
  },
};
