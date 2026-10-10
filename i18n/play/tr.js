const T = {
  locale: 'tr',
  indie: 'Arı Indie', back: 'Geri', close: 'Kapat', quit: 'Çık', settings: 'Ayarlar', frac: s => s.replace('/', ' bölü '),
  switchApp: 'Uygulama değiştir', siteAria: 'Beequation: beequation.com sitesine dön',
  tiers: ['Yumurta', 'Larva', 'Vızıltı', 'İşçi Arı', 'Tarlacı', 'Bekçi', 'Veliaht', 'Kraliçe'],
  ages: ['5+', '6+', '7+', '8+', '10+', '12+', 'Genç ve yetişkin', 'Uzman'],
  modes: { add: ['Toplama', 'Diğer ikisinin toplamı olan sayıyı bul'], mul: ['Çarpma', 'Diğer ikisinin çarpımı olan sayıyı bul'], neg: ['Negatifler', 'Sıfırın altındaki sayılarla toplama'],
    frac: ['Kesirler', 'Kesirleri zihinden topla'], mixed: ['Karışık', 'Toplama ya da çarpma: Her bulmacada değişir'], hive: ['Büyük Kovan', 'Önce dört petek, sonra onların cevapları'] },
  dailyJunior: 'Günün bulmacası', dailyPro: 'Günün Kovanı',
  // Beequation Kids (children are addressed with "sen", grown-ups with "siz", as in the app)
  worlds: {
    add: ['Toplama Çayırı', ['Toplam Filizi', 'Artı Arkadaşı', 'Süper Toplayıcı', 'Toplama Ası', 'Toplam Kahramanı', 'Çayır Ustası']],
    mul: ['Çarpım Bahçesi', ['Çarpım İribaşı', 'Çifte Parıltı', 'Çarpma Sihri', 'Çarpım Profesörü', 'Bahçe Dâhisi', 'Çarpım Devi']],
    frac: ['Kesir Ormanı', ['Yarımlar Kahramanı', 'Çeyrek Kraliçesi', 'Dilim Yıldızı', 'Kesir Şampiyonu']],
    hive: ['Büyük Kovan', ['Çalışkan Arı', 'Petek Kaptanı', 'Kovan Efsanesi']],
  },
  gateTitle: 'Yalnızca yetişkinler için', gatePrompt: 'Bu sayıyı rakamlarla yazın:', gateAnswer: 'Rakamlarla cevap', gateMiss: 'Doğru değil. Yeni sayıyı deneyin.',
  gateOk: 'Devam', gateCancel: 'Vazgeç',
  // a four-digit number in words, for the grown-ups check (only [1-9][1-9][10-99] are asked); same text as the app
  gateWords: n => {
    const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, r = n % 100;
    const thousands = th === 1 ? 'bin' : `${ONES[th]} bin`;
    const hundreds = h === 1 ? 'yüz' : `${ONES[h]} yüz`;
    const rest = r % 10 === 0 ? TENS[r / 10] : `${TENS[Math.floor(r / 10)]} ${ONES[r % 10]}`;
    return `${thousands} ${hundreds} ${rest}`;
  },
  stickersN: n => `${n} çıkartma`, grownAria: 'Ebeveyn alanı', grown: 'Ebeveyn', hello: 'Merhaba! Ben Indie.<br>Hadi sayı avına çıkalım!', play: 'Oyna',
  unlock: 'Kilidi aç', starsOf: (n, of) => `★ ${n}/${of}`, today: 'Günün bulmacası', doneTick: 'Bitti ✓', isNew: 'Yeni!',
  kLevelAria: (t, st, s) => `Seviye ${t}${st === 'paid' ? ', kilitli' : st === 'locked' ? ', henüz açılmadı' : `, ${s} yıldız`}`,
  moreLevels: 'Tam sürümde seni daha çok seviye bekliyor.', askGrown: 'Bir büyüğüne sor', paidNudge: 'Bu seviyeler tam sürümde. Bir büyüğüne sor!',
  finishFirst: t => `Önce ${t}. seviyeyi bitir. Sen yaparsın!`,
  cheer: ['Sen yaparsın!', 'Acele etme.', 'Üçüncü sayıyı veren iki sayıyı bul!', 'Her sayıya tek tek bak.'], yay: ['Evet!', 'Harika!', 'Buldun!', 'Süper!', 'Vay canına!'],
  puzzleOf: (n, of) => `Bulmaca ${n}, toplam ${of}`, worldLevel: (w, t) => `${w}, seviye ${t}`, smallCombOf: n => `, küçük petek ${n}, toplam 4`, bigComb: ', büyük petek!',
  useAnswers: 'Şimdi dört cevabını kullan!', kAsk: word => `Hangi sayı, diğer iki sayının ${word}?`, added: 'toplamı', multiplied: 'çarpımı',
  hint: 'İpucu', psst: x => `Psst! ${x} ile başlamayı dene.`, oops: 'Hay aksi! Başka bir tane dene.',
  heads: ['', 'Aferin!', 'Harikasın!', 'Muhteşem!'], helpNone: 've hiç ipucu kullanmadın!', helpOne: 've sadece 1 ipucu kullandın.', helpN: n => `ve ${n} ipucu kullandın.`,
  starsAria: n => `3 üzerinden ${n} yıldız`, solvedAll: n => `${n} bulmacanın hepsini çözdün`, comeBack: 'Yeni bulmaca için yarın yine gel!', newSticker: 'Yeni çıkartma!',
  addedToBook: 'Çıkartma albümüne eklendi', get3: 'Bu seviyenin çıkartmasını kazanmak için 3 yıldız topla.', nextLevel: 'Sonraki seviye', again: 'Tekrar oyna', home: 'Ana sayfa', map: 'Harita',
  myStickers: 'Çıkartmalarım', stickersHow: 'Bir seviyede 3 yıldız toplarsan o seviyenin çıkartmasını kazanırsın.', notWon: n => `${n}, henüz kazanılmadı`,
  forGrown: 'Ebeveynler için', kFull: 'Tam sürümün kilidi açıldı', kUnlockAll: n => `${n} seviyenin tamamını açın`, kThanks: 'Teşekkürler! Tüm dünyalar ve seviyeler açık.',
  kFree: n => `Ücretsiz sürümde ${n} seviye ve günün bulmacası var. Abone olun ya da ömür boyu erişimi bir kez satın alın; dört dünyanın tüm seviyeleri açılsın: daha zor toplama işlemleri, 15’e kadar çarpım tablosu, kesirler ve Büyük Kovan.`,
  kPrice: 'Fiyatlar ayda 4,99 £ ile başlar; ilk 7 gün ücretsiz. Reklam yok. Veri toplanmaz. İstediğiniz zaman iptal edin.', backToFree: 'Ücretsiz sürüme dön (yalnızca önizleme)',
  kBuy: 'Tam sürümün kilidini açın', previewNote: 'Bu önizlemede gerçek bir satın alma yapılmaz. Uygulamada bu düğmeyle App Store ya da Google Play açılır.', helpsTitle: 'Nasıl yardımcı olur?',
  helps: 'Her bulmacada çocuğunuz, diğer iki sayıdan oluşan sayıyı bulur. Bu da sayılar arasındaki ilişkileri görmesini ve zihinden işlem becerisini geliştirir. Indie’nin ipuçları ortamı sakin tutar; yıldızlar ipuçlarını ve hataları nazikçe hesaba katar ve yarışılacak bir saat yoktur.',
  progress: 'İlerleme', reset: 'İlerlemeyi sıfırla', resetAsk: 'Bu cihazdaki yıldızlar ve çıkartmalar silinsin mi?', resetDone: 'İlerleme sıfırlandı',
  // Beequation Pro (the player is addressed with "sen", as in the app)
  streakAria: n => `${n} günlük seri`, dailyOn: d => `Günün Kovanı, ${d}`, hiveNo: n => `Kovan No. ${n}`, doneIn: t => `Tamamlandı: ${t}. Gece yarısı yeni bir kovan açılır.`,
  tenMixed: 'On karışık bulmaca. Bugün herkes aynı bulmacaları oynuyor.', seeResult: 'Sonucunu gör', playToday: 'Bugünün kovanını oyna', blitzTile: '60 sn Blitz',
  best: n => `Rekor ${n}`, beatClock: 'Zamana karşı yarış', hiveSub: 'Uzman, 4’ü 1 arada', practice: 'Alıştırma', highest: 'Ulaşılan en yüksek seviye', notStarted: 'Başlanmadı',
  rounds: (tagline, hive) => `${tagline}. Her turda ${hive ? '3 kovan' : '10 bulmaca'}.`,
  aLevelAria: (t, name, st, s) => `Seviye ${t}, ${name}${st === 'paid' ? ', tam sürümde' : st === 'locked' ? ', kilitli' : `, ${s} yıldız`}`,
  cellsAges: (n, a) => `${n} hücre, ${/^\d/.test(a) ? `${a} yaş` : a}`, fullVersion: 'Tam sürüm', finishLevel: t => `Önce ${t}. seviyeyi bitir`,
  blitzTitle: '60 saniyelik Blitz', blitzHow: 'Bir dakikada çözebildiğin kadar çöz. Her yanlış dokunuş 2 saniye kaybettirir. Açık olan en yüksek seviyende oynarsın.',
  nameLevel: (name, t) => `${name}, seviye ${t}`, solvedWord: 'çözüldü', smallComb: n => `Küçük petek ${n}/4`, finalComb: 'Son petek: dört cevabın',
  aAsk: b => `Diğer iki sayının ${b} olan sayıyı bul`, addUpTo: 'toplamı', multiplyTo: 'çarpımı', inARow: n => `Üst üste ${n}`, wrongCosts: 'Yanlış dokunuş 2 saniye kaybettirir',
  dailyDone: 'Günün Kovanı tamamlandı', firstDaily: 'İlk günlük kovanın. Yarın yine gel.', faster: n => `Geçen seferden ${n} saniye daha hızlı`,
  slower: n => `Geçen seferden ${n} saniye daha yavaş`, sameTime: 'Geçen seferle aynı süre', blitzOf: name => `Blitz: ${name}`, nSolved: n => `${n} çözüldü`,
  newBest: 'Yeni kişisel rekor', yourBest: n => `Rekorun: ${n}`, levelDone: (name, t) => `${name} ${t} tamamlandı`,
  subJoin: (a, b) => `${a}. ${b}`,
  slips: n => `${n} hata`, for3: par => `3 yıldız için: ${par} altında, en fazla 1 hata.`, fullMarks: 'Tam puan.',
  shareNo: n => `Beequation No. ${n}`, firstTry: 'İlk denemede', oneSlip: '1 hata', twoPlus: '2 veya daha fazla', streak: n => `${n} günlük seri`, last7: 'Son 7 gün',
  share: 'Sonucu paylaş', nextName: (name, t) => `Sıradaki: ${name} ${t}`, unlockNext: 'Sonraki seviyelerin kilidini aç', playBlitz: '60 sn Blitz oyna',
  shareBlitz: (n, mode, name) => `Beequation Blitz: 60 saniyede ${n} bulmaca (${mode}, ${name})`, copied: 'Sonuç kopyalandı',
  aAll: n => `${n} seviyenin tamamı`, aThanks: 'Teşekkürler. Tüm seviyeler açık.',
  aFree: n => `Ücretsiz sürümde ${n} seviye, Günün Kovanı ve Blitz var. Tam sürüm, Büyük Kovan’ın uzman bulmacaları dahil olmak üzere Kraliçe seviyesine kadar tüm seviyeleri açar.`,
  aPrice: 'Fiyatlar ayda 2,99 £ ya da yılda 29,99 £ ile başlar; ilk 7 gün ücretsiz. Ömür boyu erişim de var. Reklam yok. İstediğin zaman iptal et.', aBuy: 'Tam sürümün kilidini aç',
  howTitle: 'Nasıl oynanır?', how: 'Her petekte bir sayı, diğer iki sayının toplamı ya da çarpımıdır. O sayıya dokun. Her tur 10 bulmacadır; Büyük Kovan’da dört petek çözersin, sonra da onların cevaplarından oluşan bir petek.',
  aFull: 'Tam sürümün kilidi açıldı',
  // the chooser
  chooseIntro: 'Aynı bulmacaya dayanan iki uygulama. Denemek için birini seç. İstediğin zaman değiştirebilirsin.',
  kidsPick: '5–12 yaş arası. Şeker renkli dünyalar, Arı Indie ve çıkartmalar; saat yok.', proPick: 'Gençler ve yetişkinler. Seri takipli Günün Kovanı, 60 saniyelik Blitz ve uzman seviyeler.',
  savedHere: 'İlerleme yalnızca bu tarayıcıda kaydedilir.',
};
