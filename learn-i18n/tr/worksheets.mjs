// Turkey (tr): the printable worksheets' words, formats and pictures, and which sheets Turkey uses.
// Read by tools/make-worksheets.mjs --lang tr (see learn-i18n/README.md). Facts follow learn-i18n/tr/BRIEF.md:
// decimal comma, no separator in four-digit numbers and a no-break space from 10 000 up, × and ÷ in primary school,
// %25 (sign before the number), lira and kuruş (coins 5, 10, 25, 50 kuruş, 1 TL, 5 TL), clock phrases as children
// learn them ("saat üçü çeyrek geçiyor", "saat dörde çeyrek var", "saat üç buçuk"), times written 15.30 (TDK),
// çarpım tablosu to 10 × 10 in 3. sınıf, decimals and percentages from 5. sınıf (TYMM).
// Suffixes after numerals follow the spoken number ("12’nin", "20’nin", "40’ın", "%20’si", "¾’ü").
//
// Left out: multiplication-check-practice (England's timed tables check; Turkey has no tables test).
// The times-table, grid and division sheets ask up to 12; Turkey's çarpım tablosu goes to 10 × 10, so the sheets
// name the 11 and 12 questions as extras ("ek meydan okuma"), solved by the ×10 shortcut.
// Change is in whole liras paid with notes (20, 50, 100 TL): shop prices are whole liras now (BRIEF 6).

const NBSP = ' ';

// ---- Turkish suffixes after a numeral, following the vowel harmony of the spoken number ----
const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
// the last word said when reading n aloud (natural numbers to 999 999)
const lastWord = n => (n % 10 ? ONES[n % 10] : n % 100 ? TENS[(n % 100) / 10] : n % 1000 ? 'yüz' : n ? 'bin' : 'sıfır');
const lastVowel = w => [...w].reverse().find(c => 'aeıioöuü'.includes(c));
const endsInVowel = w => 'aeıioöuü'.includes(w[w.length - 1]);
const four = v => ({ a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[v]);
// genitive: 12’nin, 30’un, 40’ın, 100’ün
const gen = n => { const w = lastWord(n); return `${n}’${endsInVowel(w) ? 'n' : ''}${four(lastVowel(w))}n`; };
// third-person possessive: %25’i, %20’si, %10’u, ¾’ü, ⅔’si
const poss = w => `’${endsInVowel(w) ? 's' : ''}${four(lastVowel(w))}`;

// whole numbers: four digits together (2500), a no-break space from five digits (10 000, 250 000)
const num = n => (Math.abs(n) >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : String(n));

// money in kuruş: "75 kuruş", "5 TL", "6,85 TL"
const money = k => (k < 100 ? `${k}${NBSP}kuruş` : k % 100 === 0 ? `${num(k / 100)}${NBSP}TL`
  : `${num(Math.floor(k / 100))},${String(k % 100).padStart(2, '0')}${NBSP}TL`);

// ---- clock phrases (h 1 to 12 on a dial, m in 5s) ----
const HOUR = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on', 'on bir', 'on iki'];
// accusative with "geçiyor": "üçü çeyrek geçiyor"
const HOUR_ACC = ['', 'biri', 'ikiyi', 'üçü', 'dördü', 'beşi', 'altıyı', 'yediyi', 'sekizi', 'dokuzu', 'onu', 'on biri', 'on ikiyi'];
// dative with "var": "dörde çeyrek var"
const HOUR_DAT = ['', 'bire', 'ikiye', 'üçe', 'dörde', 'beşe', 'altıya', 'yediye', 'sekize', 'dokuza', 'ona', 'on bire', 'on ikiye'];
const MIN = { 5: 'beş', 10: 'on', 15: 'çeyrek', 20: 'yirmi', 25: 'yirmi beş' };
// "saat üç", "saat üç buçuk", "saat yarım" (12.30), "saat üçü on geçiyor", "saat dörde yirmi var"
function timeWords(h, m) {
  const hh = h % 12 || 12, next = hh % 12 + 1;
  if (m === 0) return `saat ${HOUR[hh]}`;
  if (m === 30) return hh === 12 ? 'saat yarım' : `saat ${HOUR[hh]} buçuk`;
  if (m < 30) return `saat ${HOUR_ACC[hh]} ${MIN[m]} geçiyor`;
  return `saat ${HOUR_DAT[next]} ${MIN[60 - m]} var`;
}
// A dial time comes twice a day; 3. sınıf learns öğleden önce / öğleden sonra and the 24-hour day.
// Written with a point, as TDK and the brief ask in text: "04.05 ya da 16.05" (12.05 → "12.05 ya da 00.05").
function digital(h, m) {
  const hh = h % 12 || 12, mm = String(m).padStart(2, '0'), p2 = x => String(x).padStart(2, '0');
  return `${p2(hh)}.${mm} ya da ${p2(hh === 12 ? 0 : hh + 12)}.${mm}`;
}

// coin colours (BRIEF 6): 1 kuruş brass, 5/10/25 kuruş gold-coloured; 50 kuruş gold centre in a silver ring;
// 1 TL and 5 TL silver centre in a gold ring
const BRASS = '#C9A15A', GOLD = '#E2C35A', SILVER = '#C8CCD0';

const PLACE = { 10: 'En yakın onluğa', 100: 'En yakın yüzlüğe', 1000: 'En yakın binliğe' };
// fruit names on the chart, and their accusative ("muzu", "armudu")
const FRUITS = ['Elma', 'Muz', 'Üzüm', 'Portakal', 'Armut'];
const ACC = { Elma: 'elmayı', Muz: 'muzu', Üzüm: 'üzümü', Portakal: 'portakalı', Armut: 'armudu' };
const cap = s => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

export default {
  // Text alternatives describe the picture, without adding a worked answer.
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Saat: yelkovan ${minute} sayısını gösteriyor ve akrep ${hour} sayısını gösteriyor`
      : `Saat: yelkovan ${minute} sayısını gösteriyor ve akrep ${hour} ile ${next} arasında`;
  },
  shapeAlt: n => `Şekil ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind}: ${total} eş parçanın ${shaded} tanesi boyalı`,
  fractionKinds: {"bar": "Şerit", "circle": "Daire", "grid": "Kareli şekil"},
  coinAlt: value => `${value} değerinde madeni para`,
  rectangleAlt: (w, h) => `Bir kenarı 1 cm olan karelerden oluşan, ${w} sütun ve ${h} satırlık bir dikdörtgen`,
  chartAlt: "En sevilen meyveler için verilen oyların sütun grafiği; değerler aşağıdaki tabloda",
  chartFruit: "Meyve", chartVotes: "Oy sayısı",
  htmlLang: 'tr',
  num,
  dec: (x, places) => x.toFixed(places).replace('.', ','),
  mul: '×', div: '÷',
  tensOnes: b => `${b} onluk ${b} birlik`,
  tensOnesA: (t, o) => `${t} onluk ${o} birlik`,
  roundQ: (n, to, b) => `${PLACE[String(to).replace(/\D/g, '')]}: <b class="n">${n}</b> ≈ ${b}`,
  // "12’nin ⅓’i", "20’nin ¾’ü" (the suffix follows the numerator as it is read: "dörtte üçü")
  of: (f, x) => { const n = Number((/<b>(\d+)<\/b>/.exec(f) || [])[1]); return `${gen(x)} ${f}${poss(lastWord(n))}`; },
  // "80’in %25’i", "60’ın %20’si"
  pctOf: (p, x) => `${gen(x)} %${p}${poss(lastWord(p))}`,

  timeWords, digital,

  money,
  coinValues: [5, 10, 25, 50, 100, 500],
  coinLabel: v => (v >= 100 ? `${v / 100} TL` : `${v} kr`),
  // real diameters in mm (Darphane 2023 circulation set); the fill is the outer part of the coin
  coins: { 1: [BRASS, 16.5, 'circle'], 5: [GOLD, 17.5, 'circle'], 10: [GOLD, 18.5, 'circle'], 25: [GOLD, 20.5, 'circle'],
    50: [SILVER, 23.85, 'circle'], 100: [GOLD, 26.15, 'circle'], 500: [GOLD, 28.15, 'circle'] },
  coinInner: v => (v === 50 ? GOLD : v === 100 || v === 500 ? SILVER : null),
  // change: pay with a 20, 50 or 100 TL note; prices are whole liras
  paid: [2000, 5000, 10000], costStep: 100,
  shopItems: ['bir defter', 'bir kitap', 'bir top', 'bir oyuncak araba', 'bir paket çıkartma', 'bir kutu boya kalemi', 'bir yapboz', 'bir kalem kutusu'],
  // no suffix needed on the amounts: "Fiyatı 37 TL olan bir defter alıyorsun ve 50 TL veriyorsun."
  changeQ: (item, cost, paid, b) => `Fiyatı ${cost} olan ${item} alıyorsun ve ${paid} veriyorsun. Para üstü: ${b}`,

  // 4. sınıf (2018) and 5. sınıf measure area in unit squares ("birimkare")
  perimQ: b => `<div class="ansline">Çevre uzunluğu ${b} cm</div><div class="ansline">Alan ${b} birimkare</div>`,
  perimA: (p, a) => `Çevre uzunluğu ${p} cm, alan ${a} birimkare`,
  shapes: { 3: 'üçgen', 4: 'kare', rect: 'dikdörtgen', 5: 'beşgen', 6: 'altıgen', 8: 'sekizgen', 0: 'daire', 7: 'yedigen', 10: 'ongen' },
  shapeQ: b => `<div class="ansline wide">Adı:</div><div class="ansline">Kenar ${b} Köşe ${b}</div>`,
  shapeA: (name, n) => (n === 0 ? 'daire: 0 kenar, 0 köşe (çevresi eğri bir çizgi)' : `${name}: ${n} kenar, ${n} köşe`),

  fruits: FRUITS,
  chartQs: (f, v, mx, mn) => [
    [`${cap(ACC[f[1]])} kaç öğrenci seçti?`, v[1]],
    ['En çok seçilen meyve hangisi?', f[mx]],
    ['En az seçilen meyve hangisi?', f[mn]],
    [`${cap(ACC[f[mx]])} seçenler, ${ACC[f[mn]]} seçenlerden kaç kişi fazla?`, v[mx] - v[mn]],
    ['Ankete toplam kaç öğrenci katıldı?', v.reduce((a, b) => a + b, 0)],
  ],

  years: { anasinifi: 'Anasınıfı', '1-sinif': '1. sınıf', '2-sinif': '2. sınıf', '3-sinif': '3. sınıf',
    '4-sinif': '4. sınıf', '5-sinif': '5. sınıf', '6-sinif': '6. sınıf' },
  // "2. sınıf", "1. ve 2. sınıf", "3., 4. ve 5. sınıf", "Anasınıfı ve 1. sınıf"
  yearsLabel: (ys, n) => {
    const pre = ys.filter(y => !/^\d-sinif$/.test(y)).map(y => n[y]);
    const nums = ys.filter(y => /^\d-sinif$/.test(y)).map(y => `${y[0]}.`);
    const list = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} ve ${a[a.length - 1]}` : a[0]);
    return [...pre, ...(nums.length ? [`${list(nums)} sınıf`] : [])].join(' ve ');
  },
  name: 'Adı Soyadı', date: 'Tarih', tip: 'Indie’nin ipucu:', answers: 'Cevap anahtarı',
  titleTag: t => `${t}: Beequation Kids çalışma kâğıdı`,
  footer: 'Evde ve sınıfta kullanmak için dilediğiniz kadar çoğaltabilirsiniz. Daha fazla çalışma kâğıdı: <b>tr.beequation.com/learn</b>',
  promo: '<b>Indie ile alıştırma yapın.</b> tr.beequation.com’da ücretsiz petek bulmacalarını oynayın ya da telefonunuzda veya tabletinizde Beequation Kids’i arayın: reklam yok, veri toplanmaz, süre baskısı yok.',

  sheets: {
    // sayılar ve basamak değeri
    'missing-numbers-to-100': { title: '100’e kadar ritmik sayma', years: ['1-sinif', '2-sinif'],
      desc: 'Birer, ikişer, beşer ve onar say', how: 'Her sayı dizisinde eksik sayıları bul ve kutulara yaz.',
      tip: 'Sayarken sayıları yüksek sesle söyle. Yanlış bir atlamayı kulağın hemen fark eder!' },
    'tens-and-ones': { title: 'Onluklar ve birlikler', years: ['2-sinif'],
      desc: 'İki basamaklı sayıları ayır', how: 'Her sayının kaç onluk ve kaç birlikten oluştuğunu yaz.',
      tip: 'Soldaki rakam onlar basamağındadır ve kaç onluk olduğunu söyler. 47 sayısında 4 onluk ve 7 birlik vardır.' },
    'hundreds-tens-ones': { title: 'Yüzler, onlar, birler', years: ['3-sinif'],
      desc: '1000’e kadar basamak değeri', how: 'Her sayıyı basamak değerlerinin toplamı olarak yaz: yüzler + onlar + birler.',
      tip: 'Sıfır, boş kalan basamağın yerini tutar. 405 sayısında hiç onluk yoktur ama 0 sayesinde 4 yüzler basamağında kalır: 405 = 400 + 0 + 5.' },
    'rounding': { title: 'Sayıları yuvarlama', years: ['4-sinif'],
      desc: 'En yakın onluğa, yüzlüğe ve binliğe', how: 'Her sayıyı istenen basamağa yuvarla. Binliğe yuvarlama soruları ek bir meydan okuma: kural aynı!',
      tip: 'Yuvarlayacağın basamağın hemen sağındaki rakama bak. 5 ya da daha büyükse yukarı, 5’ten küçükse aşağı yuvarla: 3462 en yakın yüzlüğe yuvarlanınca 3500 olur.' },
    // toplama ve çıkarma
    'number-bonds-to-10': { title: '10’a tamamlama', years: ['anasinifi', '1-sinif'],
      desc: 'Toplamı 10 eden sayı ikilileri', how: '10 etmesi için kutuya hangi sayı gelmeli? Bul ve yaz.',
      tip: 'Parmaklarını kullan! 7 parmağını aç. Kaç parmağın kapalı kaldı? 7’yi 10’a tamamlayan sayı işte o: 3.' },
    'number-bonds-to-20': { title: '20’ye tamamlama', years: ['1-sinif', '2-sinif'],
      desc: 'Toplamı 20 eden sayı ikilileri', how: 'Eksik sayıyı bul ve kutuya yaz. Her işlemde toplamı 20 eden iki sayı var.',
      tip: '3 + 7 = 10 olduğunu biliyorsan 13 + 7 = 20 olduğunu da bilirsin. 10’a tamamlamak, 20’ye tamamlamanın anahtarı!' },
    'add-and-subtract-within-20': { title: '20’ye kadar toplama ve çıkarma', years: ['1-sinif', '2-sinif'],
      desc: 'Karışık toplama ve çıkarma işlemleri', how: 'Her işlemin sonucunu bul.',
      tip: 'Çıkarırken sayı doğrusunda geriye doğru sayabilirsin. Ya da şöyle düşün: Küçük sayıya kaç eklersem büyük sayıya ulaşırım?' },
    'column-addition': { title: 'Eldeli toplama', years: ['3-sinif', '4-sinif'],
      desc: 'Üç basamaklı sayılar, alt alta', how: 'Toplama işlemlerini alt alta yap. Birler basamağından başla!',
      tip: 'Bir basamağın toplamı 10 ya da daha fazlaysa birlerini yaz, 1’i elde olarak soldaki basamağın üstüne küçükçe yaz. O basamağı toplarken eldeyi de ekle.' },
    'column-subtraction': { title: 'Onluk bozarak çıkarma', years: ['3-sinif', '4-sinif'],
      desc: 'Üç basamaklı sayılar, alt alta', how: 'Çıkarma işlemlerini alt alta yap. Birler basamağından başla!',
      tip: 'Üstteki rakam küçükse soldaki basamaktan bir onluk boz. Sonunda sağlama yap: 532 − 178 = 354 ise 354 + 178 = 532 olmalı.' },
    // çarpma ve bölme
    'times-tables-2-5-10': { title: '2’ler, 5’ler ve 10’lar çarpım tablosu', years: ['2-sinif', '3-sinif'],
      desc: 'Karışık çarpma işlemleri', how: 'Her çarpma işleminin sonucunu bul. 11 ve 12 ile çarpma ek bir meydan okuma: 5 × 12, 5 × 10 ile 5 × 2’nin toplamıdır.',
      tip: '10’lar çarpım tablosundaki her sonuç 0 ile, 5’ler çarpım tablosundaki her sonuç 0 ya da 5 ile biter.' },
    'times-tables-3-4-8': { title: '3’ler, 4’ler ve 8’ler çarpım tablosu', years: ['3-sinif', '4-sinif'],
      desc: 'Karışık çarpma işlemleri', how: 'Her çarpma işleminin sonucunu bul. 11 ve 12 ile çarpma ek bir meydan okuma: 4 × 11, 4 × 10 ile 4’ün toplamıdır.',
      tip: '8’ler çarpım tablosu, 4’ler çarpım tablosunun iki katıdır. 4 × 6 = 24 ise 8 × 6 = 48.' },
    'multiplication-grid': { title: 'Çarpım tablosunu doldur', years: ['3-sinif', '4-sinif'],
      desc: '10 × 10’luk tablo ve 11, 12 ek satırları', how: 'Her satırın başındaki sayıyı her sütunun üstündeki sayıyla çarp ve kesiştikleri kareye yaz. 11 ve 12’nin satır ve sütunları ek bir meydan okuma.',
      tip: 'Önce kolay satırları doldur: 1, 2, 5 ve 10. Sonra tablonun kuralından yararlan: 3 × 7 ile 7 × 3 aynı sonucu verir.' },
    'division-facts': { title: 'Çarpım tablosuyla bölme', years: ['3-sinif', '4-sinif'],
      desc: 'Kalansız bölme işlemleri', how: 'Her bölme işleminin sonucunu bul. 88 ÷ 11 gibi çarpım tablosunun dışına çıkan işlemler ek bir meydan okuma!',
      tip: 'Bölme, çarpmanın tersidir. 42 ÷ 6 için kendine sor: 6 kere kaç 42 eder?' },
    'short-multiplication': { title: 'Alt alta çarpma', years: ['3-sinif', '4-sinif'],
      desc: 'Üç basamaklı sayıyı bir basamaklı sayıyla çarp', how: 'Çarpma işlemlerini alt alta yap. Birler basamağından başla!',
      tip: 'Önce birler basamağını çarp. Sonuç 10 ya da daha büyükse birlerini yaz, onlukları elde olarak tut ve bir sonraki çarpımın sonucuna ekle.' },
    // kesirler
    'what-fraction-is-shaded': { title: 'Boyalı kısım hangi kesir?', years: ['3-sinif', '4-sinif'],
      desc: 'Şekillerden kesir oku', how: 'Her şeklin boyalı kısmını kesirle yaz.',
      tip: 'Önce bütün eş parçaları say: Bu sayı paydadır, kesir çizgisinin altına yazılır. Sonra boyalı parçaları say: Bu da paydır, çizginin üstüne yazılır.' },
    'fractions-of-amounts': { title: 'Bir çokluğun kesir kadarı', years: ['4-sinif', '5-sinif'],
      desc: '20’nin ¾’ü gibi işlemler', how: 'Her işlemin sonucunu bul.',
      tip: 'Önce paydaya böl, sonra payla çarp. 20’nin ¾’ü için: 20 ÷ 4 = 5, sonra 5 × 3 = 15.' },
    'equivalent-fractions': { title: 'Denk kesirler', years: ['5-sinif', '6-sinif'],
      desc: 'Eksik pay ya da paydayı bul', how: 'Kesirlerin denk olması için kutuya gelecek sayıyı yaz.',
      tip: 'Paydayı hangi sayıyla çarptıysan payı da aynı sayıyla çarp. Buna genişletme denir: ½ = ⁴⁄₈, çünkü pay da payda da 4 ile çarpıldı.' },
    // ondalık gösterim ve yüzdeler
    'tenths-and-hundredths': { title: 'Onda birler ve yüzde birler', years: ['5-sinif', '6-sinif'],
      desc: 'Kesirleri ondalık gösterimle yaz', how: 'Her kesri ondalık gösterimle yaz.',
      tip: 'Virgülden sonraki ilk basamak onda birler, ikinci basamak yüzde birler basamağıdır. ⁷⁄₁₀₀ = 0,07 (sıfır tam yüzde yedi).' },
    'percentages-of-amounts': { title: 'Bir çokluğun yüzdesi', years: ['5-sinif', '6-sinif'],
      desc: '%10, %25, %50 ve daha fazlası', how: 'Her işlemin sonucunu bul.',
      tip: '%10’u bulmak için 10’a böl. Sonra ondan yararlan: %30, %10’un 3 katıdır; %5 ise %10’un yarısıdır.' },
    // saat okuma
    'time-oclock-and-half-past': { title: 'Tam ve yarım saatler', years: ['2-sinif'],
      desc: 'Saatleri oku', how: 'Her saatin gösterdiği zamanı yazıyla yaz.',
      tip: 'Kısa olan akrep saati, uzun olan yelkovan dakikayı gösterir. Yelkovan 12’yi gösteriyorsa saat tamdır, 6’yı gösteriyorsa buçuktur.' },
    'time-quarter-past-and-to': { title: 'Çeyrek geçiyor, çeyrek var', years: ['2-sinif'],
      desc: 'Saatleri oku', how: 'Her saatin gösterdiği zamanı yazıyla yaz.',
      tip: 'Yelkovan 3’ü gösteriyorsa saat çeyrek geçiyordur, 9’u gösteriyorsa bir sonraki saate çeyrek vardır. O zaman akrep bir sonraki sayıya çok yaklaşmıştır.' },
    'time-to-5-minutes': { title: 'Beşer dakikalarla saat okuma', years: ['3-sinif'],
      desc: 'Analog ve dijital saat', how: 'Her saatin gösterdiği zamanı yazıyla yaz. Alt satıra da rakamlarla, öğleden önceki ve öğleden sonraki hâlini yaz (04.05 ya da 16.05 gibi).',
      tip: 'Yelkovan her sayıda 5 dakika ilerler: beşer beşer say. Yelkovan 6’yı geçince bir sonraki saate kaç dakika kaldığına bak: 8’deyse 20 dakika vardır, yani “… yirmi var”.' },
    // paralarımız
    'counting-coins': { title: 'Paraları sayalım', years: ['2-sinif', '3-sinif'],
      desc: 'Madenî paraları topla', how: 'Her kumbarada ne kadar para var? Toplamı yaz.',
      tip: 'En değerli paradan başla, sonra üstüne ekleyerek say: 1 TL, 1,50 TL, 1,75 TL, 1,85 TL…' },
    'giving-change': { title: 'Para üstü', years: ['2-sinif', '3-sinif'],
      desc: '20 TL, 50 TL ve 100 TL ile ödeme', how: 'Her alışverişte ne kadar para üstü alırsın? Hesapla.',
      tip: 'Fiyattan ödediğin paraya kadar ileri say. 37 TL’den 50 TL’ye: 3 TL eklersen 40 TL olur, 10 TL daha eklersen 50 TL. Para üstü 13 TL.' },
    // ölçme
    'perimeter-and-area': { title: 'Çevre uzunluğu ve alan', years: ['4-sinif', '5-sinif'],
      desc: 'Kareli zeminde dikdörtgenler', how: 'Her karenin bir kenarı 1 cm. Her dikdörtgenin çevre uzunluğunu ve alanını bul.',
      tip: 'Çevre uzunluğu, şeklin etrafında bir tur dolaşan yolun uzunluğudur: bütün kenarları topla. Alan ise içindeki birimkarelerin sayısıdır.' },
    // geometrik şekiller
    '2d-shapes': { title: 'Geometrik şekiller', years: ['3-sinif'],
      desc: 'Adları, kenarları ve köşeleri', how: 'Her şeklin adını yaz, kenarlarını ve köşelerini say.',
      tip: 'Sayarken her köşeye küçük bir nokta koy. Böylece hiçbir köşeyi iki kez saymazsın!' },
    // veri ve grafikler
    'reading-bar-charts': { title: 'Sütun grafiği okuma', years: ['4-sinif', '5-sinif'],
      desc: 'En sevilen meyve anketi', how: 'Bir sınıftaki öğrenciler en sevdikleri meyveyi seçti. Sütun grafiğine bakarak soruları cevapla.',
      tip: 'Parmağını sütunun tepesine koy ve dümdüz yandaki sayılara kaydır. Sütunun değerini böyle okursun.' },
    // örüntüler ve cebir
    'missing-number-problems': { title: 'Eksik sayıyı bul', years: ['3-sinif', '4-sinif', '5-sinif'],
      desc: 'Kutudaki sayı kaç?', how: 'Her eşitlikte kutuya gelecek sayıyı bul.',
      tip: 'Ters işlemi kullan. ▢ + 7 = 15 için 15 − 7 işlemini yap. 3 × ▢ = 24 için 24 ÷ 3 işlemini yap.' },
  },
};
