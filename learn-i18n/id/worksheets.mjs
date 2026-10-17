// Indonesia. Amounts are integer sen: 100 sen = Rp1. Only whole-rupiah prices
// and genuine TE 2016 coin denominations are used. See BRIEF.md for BI sources.
const num = n => Number(n).toLocaleString('id-ID');
const money = sen => `Rp${(sen / 100).toLocaleString('id-ID', { minimumFractionDigits: sen % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const hours = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas'];
const sheet = (title, desc, how, tip, ...grades) => ({ title, desc, how, tip, years: grades.map(n => n === 0 ? 'tk-b' : `kelas-${n}`) });
export default {
  htmlLang: 'id', num, dec: (x, places) => x.toFixed(places).replace('.', ','), mul: '×', div: '÷',
  clockAlt: (h, m) => {
    const hour = h % 12 || 12, next = hour % 12 + 1, minute = m === 0 ? 12 : m / 5;
    return m === 0 ? `Jam: jarum panjang menunjuk ${minute}, jarum pendek menunjuk ${hour}` : `Jam: jarum panjang menunjuk ${minute}, jarum pendek berada di antara ${hour} dan ${next}`;
  },
  shapeAlt: n => `Bangun nomor ${n}`,
  fractionAlt: (kind, shaded, total) => `${kind}: ${shaded} dari ${total} bagian sama besar diwarnai`,
  fractionKinds: {bar:'Batang', circle:'Lingkaran', grid:'Petak'},
  coinAlt: value => `Koin ${value}`,
  rectangleAlt: (w, h) => `Persegi panjang pada petak ${w} kolom dan ${h} baris; setiap petak bersisi 1 cm`,
  chartAlt: 'Diagram batang buah pilihan murid; nilainya juga tercantum pada tabel', chartFruit: 'Buah', chartVotes: 'Banyak pilihan',
  tensOnes: b => `${b} puluhan dan ${b} satuan`, tensOnesA: (t, o) => `${t} puluhan dan ${o} satuan`,
  roundQ: (n, to, b) => `<b class="n">${n}</b> dibulatkan ke ${to} terdekat → ${b}`,
  of: (f, x) => `${f} dari ${x}`, pctOf: (p, x) => `${p}% dari ${x}`,
  timeWords: (h, m) => {
    const hh = h % 12 || 12, next = hh % 12 + 1;
    if (m === 0) return `pukul ${hours[hh]} tepat`;
    if (m === 30) return `pukul setengah ${hours[next]}`;
    if (m === 15) return `pukul ${hours[hh]} lewat seperempat`;
    if (m === 45) return `pukul ${hours[next]} kurang seperempat`;
    return m < 30 ? `pukul ${hours[hh]} lewat ${m} menit` : `pukul ${hours[next]} kurang ${60 - m} menit`;
  },
  digital: (h, m) => `${String(h % 12 || 12).padStart(2, '0')}.${String(m).padStart(2, '0')}`,
  money, coinValues: [10000, 20000, 50000, 100000], coinLabel: v => `<tspan font-size="4.8">${money(v)}</tspan>`,
  coins: {10000:['#D7DCE3',23,'circle'],20000:['#D7DCE3',25,'circle'],50000:['#D7DCE3',27.2,'circle'],100000:['#C4CBD3',24.1,'circle']},
  coinInner: () => null, paid: [200000,500000,1000000], costStep: 10000,
  shopItems: ['sebuah pensil','sepotong kue','sebuah penghapus','sebuah pisang','sebuah buku kecil','selembar stiker','sebuah jeruk','sebungkus kerupuk'],
  changeQ: (item, cost, paid, b) => `Kamu membeli ${item} seharga ${cost} dan membayar ${paid}. Kembalian: ${b}`,
  perimQ: b => `<div class="ansline">Keliling ${b} cm</div><div class="ansline">Luas ${b} cm²</div>`,
  perimA: (p, a) => `Keliling ${p} cm, luas ${a} cm²`,
  shapes: {3:'segitiga',4:'persegi',rect:'persegi panjang',5:'segi lima',6:'segi enam',8:'segi delapan',0:'lingkaran',7:'segi tujuh',10:'segi sepuluh'},
  shapeQ: b => `<div class="ansline wide">Nama:</div><div class="ansline">Sisi lurus ${b} Titik sudut ${b}</div>`,
  shapeA: (name, n) => n === 0 ? 'lingkaran: 0 sisi lurus, 0 titik sudut; tepinya melengkung' : `${name}: ${n} sisi lurus, ${n} titik sudut`,
  fruits: ['Mangga','Pisang','Pepaya','Jeruk','Jambu'],
  chartQs: (f, v, mx, mn) => [
    [`Berapa murid memilih ${f[1].toLowerCase()}?`,v[1]],['Buah apa yang paling banyak dipilih?',f[mx]],['Buah apa yang paling sedikit dipilih?',f[mn]],
    [`Berapa selisih banyak pemilih ${f[mx].toLowerCase()} dan ${f[mn].toLowerCase()}?`,v[mx]-v[mn]],['Berapa jumlah seluruh pilihan?',v.reduce((a,b)=>a+b,0)]],
  years: {'tk-b':'TK B','kelas-1':'SD Kelas 1','kelas-2':'SD Kelas 2','kelas-3':'SD Kelas 3','kelas-4':'SD Kelas 4','kelas-5':'SD Kelas 5','kelas-6':'SD Kelas 6'},
  yearsLabel: (ys,n) => ys.map(y=>n[y]).join(', '),
  name:'Nama',date:'Tanggal',tip:'Saran Indie:',answers:'Kunci jawaban',titleTag:t=>`${t} — lembar kerja Beequation Kids`,
  footer:'Boleh disalin untuk belajar di rumah dan sekolah. Lembar lain: <b>id.beequation.com/learn</b>',
  promo:'<b>Berlatih bersama Indie.</b> Cari hubungan bilangan dalam teka-teki sarang di id.beequation.com atau Beequation Kids. Pilih latihan sesuai kesiapan anak.',
  sheets: {
    'missing-numbers-to-100': sheet('Bilangan yang hilang sampai 100','Urutan dengan langkah 1, 2, 5, atau 10','Isi bilangan yang hilang. Perhatikan besar langkah setiap baris.','Cari selisih dua bilangan yang berdekatan sebelum melanjutkan.',2,3),
    'tens-and-ones': sheet('Puluhan dan satuan','Mengurai bilangan dua angka','Tuliskan banyak puluhan dan satuannya.','47 terdiri dari 4 puluhan dan 7 satuan. Gunakan ikatan sedotan jika diperlukan.',1,2),
    'hundreds-tens-ones': sheet('Ratusan, puluhan, dan satuan','Mengurai bilangan sampai 999','Tulis nilai setiap angka sebagai penjumlahan.','Pada 405, angka 0 menunjukkan tidak ada puluhan: 400 + 0 + 5.',3,4),
    'rounding': sheet('Pembulatan bilangan','Puluhan, ratusan, dan ribuan terdekat','Bulatkan ke nilai tempat yang diminta.','Letakkan bilangan di antara dua kelipatan terdekat. Jika tepat di tengah, bulatkan ke atas.',4,5,6),
    'number-bonds-to-10': sheet('Pasangan pembentuk 10','Dua bagian dengan jumlah 10','Isi bilangan yang belum ada.','Susun 10 benda menjadi dua kelompok. Setelah salah satu kelompok ditutup, cari banyak benda yang tertutup.',1,2),
    'number-bonds-to-20': sheet('Pasangan pembentuk 20','Dua bagian dengan jumlah 20','Lengkapi setiap pasangan agar jumlahnya 20.','13 + 7 = 20. Periksa dengan mengurangi: 20 − 13 = 7.',1,2),
    'add-and-subtract-within-20': sheet('Tambah dan kurang sampai 20','Memilih cara menghitung','Hitung hasil setiap operasi. Gunakan gambar bila membantu.','Untuk 8 + 5, buat 10 dahulu: 8 + 2 + 3 = 13.',1,2),
    'column-addition': sheet('Penjumlahan bersusun','Bilangan tiga angka dengan pengelompokan kembali','Jumlahkan mulai dari satuan. Catat puluhan yang terbentuk.','10 satuan ditukar dengan 1 puluhan; nilainya tetap.',3,4),
    'column-subtraction': sheet('Pengurangan bersusun','Bilangan tiga angka dengan penukaran nilai tempat','Kurangkan dari satuan. Tukar 1 puluhan menjadi 10 satuan bila perlu.','Periksa hasil dengan penjumlahan: 354 + 178 = 532, jadi 532 − 178 = 354.',3,4),
    'times-tables-2-5-10': sheet('Perkalian 2, 5, dan 10','Kelompok sama banyak','Hitung tiap hasil kali. Faktor 11 atau 12 adalah tantangan tambahan; uraikan menggunakan perkalian 10.','5 × 12 dapat dihitung sebagai 5 × 10 + 5 × 2 = 60.',3,4),
    'times-tables-3-4-8': sheet('Perkalian 3, 4, dan 8','Menghubungkan hasil kali','Hitung hasil kali. Soal dengan faktor 11 atau 12 boleh dikerjakan dengan gambar atau penguraian.','8 × 6 adalah dua kali 4 × 6: 24 + 24 = 48.',3,4),
    'division-facts': sheet('Pembagian dari perkalian','Mencari banyak kelompok atau isi kelompok','Hitung hasil bagi. Soal dengan pembagi 11 atau 12 merupakan perluasan.','Untuk 42 ÷ 6, cari bilangan yang jika dikalikan 6 menghasilkan 42.',3,4,5),
    'short-multiplication': sheet('Perkalian bersusun satu angka','Mengalikan bilangan tiga angka','Kalikan mulai dari satuan dan catat pengelompokan kembali.','Kalikan dahulu, lalu tambahkan simpanan dari kolom sebelumnya.',4,5),
    'what-fraction-is-shaded': sheet('Pecahan bagian berwarna','Bagian dari satu bangun utuh','Tuliskan pecahan bagian berwarna. Semua bagian dalam satu bangun sama besar.','Penyebut menyatakan semua bagian sama besar; pembilang menyatakan bagian yang dipilih.',3,4),
    'fractions-of-amounts': sheet('Pecahan dari banyak benda','Membagi sama banyak lalu mengambil bagian','Hitung pecahan dari setiap jumlah.','¾ dari 20: bagi 20 menjadi 4 kelompok, lalu ambil 3 kelompok. Hasilnya 15.',4,5,6),
    'equivalent-fractions': sheet('Pecahan senilai','Nilai sama, pembagian berbeda','Isi angka yang hilang agar kedua pecahan senilai.','Kalikan atau bagi pembilang dan penyebut dengan bilangan sama yang bukan nol.',4,5,6),
    'tenths-and-hundredths': sheet('Persepuluhan dan perseratusan','Mengubah pecahan menjadi desimal','Tulis setiap pecahan sebagai desimal dengan koma.','7/100 = 0,07. Nol pada persepuluhan menjaga nilai tempat.',4,5),
    'percentages-of-amounts': sheet('Persen dari suatu jumlah','Pengayaan: 10%, 25%, 50%, dan lainnya','Hitung bagian yang diminta. Gunakan gambar seratus petak jika perlu.','25% sama dengan ¼. Tentukan dahulu jumlah yang menjadi keseluruhan.',5,6),
    'time-oclock-and-half-past': sheet('Jam tepat dan setengah jam','Membaca jarum jam','Tulis waktu yang ditunjukkan jam.','Pukul setengah delapan berarti 07.30: setengah jam menuju pukul delapan.',2,3),
    'time-quarter-past-and-to': sheet('Lewat dan kurang seperempat','Membaca selang 15 menit','Tulis waktu dengan kata-kata.','Jarum panjang di 3 berarti lewat 15 menit; di 9 berarti kurang 15 menit menuju jam berikutnya.',2,3),
    'time-to-5-minutes': sheet('Membaca jam setiap lima menit','Kata-kata dan angka untuk waktu','Tulis waktu dengan kata-kata serta angka. Jam ini tidak membedakan pagi dan malam.','Hitung langkah jarum panjang lima-lima dari angka 12.',3,4),
    'counting-coins': sheet('Menghitung koin rupiah','Koin Rp100, Rp200, Rp500, dan Rp1.000','Jumlahkan nilai semua koin pada setiap kelompok.','Baca nominalnya. Koin yang lebih besar ukurannya belum tentu lebih besar nilainya.',3,4),
    'giving-change': sheet('Menghitung uang kembalian','Pembayaran Rp2.000, Rp5.000, atau Rp10.000','Kurangi uang pembayaran dengan harga. Harga di sini adalah contoh latihan.','Harga + kembalian harus sama dengan pembayaran.',3,4,5),
    'perimeter-and-area': sheet('Keliling dan luas persegi panjang','Mengukur tepi dan menghitung petak','Setiap petak bersisi 1 cm. Tentukan keliling dan luas.','Keliling menggunakan cm; luas menggunakan cm². Keduanya mengukur hal berbeda.',5,6),
    '2d-shapes': sheet('Nama dan sifat bangun datar','Sisi lurus dan titik sudut','Tulis nama bangun serta banyak sisi lurus dan titik sudut. Segi tujuh dan segi sepuluh adalah pengayaan.','Putar kertas. Nama bangun tidak berubah hanya karena posisinya berubah.',3,4),
    'reading-bar-charts': sheet('Membaca diagram batang','Contoh data buah pilihan murid','Baca diagram atau tabel, lalu jawab pertanyaan. Data ini dibuat untuk latihan.','Periksa skala. Satu langkah pada sumbu tidak selalu berarti satu murid.',4,5,6),
    'missing-number-problems': sheet('Bilangan dalam kotak','Menjaga kedua sisi tetap sama','Cari bilangan yang membuat kalimat matematika benar.','Masukkan kembali jawabanmu ke kotak untuk memeriksa kedua sisi.',4,5,6),
  },
};
