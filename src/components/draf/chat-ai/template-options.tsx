"use client";

import { Building2, Handshake, Palette } from "lucide-react";

import { cn } from "@/lib/utils";
import { DraftTemplateBadge } from "@/components/draf-template-badge";

export interface TemplateOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  prompt: string;
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "creative_services",
    title: "Jasa & Layanan Kreatif",
    icon: <Palette className="size-3.5 text-blue-600" />,
    prompt: `Buatkan draf Perjanjian Jasa Kreatif dalam Bahasa Indonesia antara:

PIHAK PERTAMA / PENYEDIA JASA
* Nama: [Nama Penyedia Jasa/Agensi]
* Jenis usaha/status: [Freelancer/PT/CV/Agensi]
* Alamat: [Alamat]
* Email: [Email]
* Kontak: [Nomor Telepon]

PIHAK KEDUA / KLIEN
* Nama: [Nama Klien/Perusahaan]
* Jabatan (jika perusahaan): [Jabatan]
* Nama perusahaan: [Nama Perusahaan]
* Alamat: [Alamat]
* Email: [Email]
* Kontak: [Nomor Telepon]

### 1. RUANG LINGKUP PROYEK
* Jenis jasa: [Pengembangan Web/Desain Grafis/Branding/Video/Copywriting/Fotografi/dll.]
* Deskripsi proyek: [Deskripsi singkat]
* Tujuan proyek: [Tujuan]
* Deliverables/output akhir:
  1. [Deliverable 1]
  2. [Deliverable 2]
  3. [Deliverable 3]
* Hal-hal yang secara eksplisit tidak termasuk dalam ruang lingkup:
  [Sebutkan jika ada]

### 2. TIMELINE
* Tanggal mulai: [Tanggal]
* Target selesai: [Tanggal]
* Milestone/tahapan pekerjaan: [Tahapan]
* Ketentuan apabila terjadi keterlambatan karena materi, feedback, approval, atau keputusan dari Klien: [Ketentuan]

### 3. BIAYA DAN PEMBAYARAN
* Total nilai proyek: Rp[Nominal]
* DP: [Persen]% = Rp[Nominal], dibayarkan sebelum pekerjaan dimulai
* Termin kedua: [Persen]% = Rp[Nominal], dibayarkan pada [Milestone]
* Pelunasan: [Persen]% = Rp[Nominal], dibayarkan saat [serah terima/approval akhir]
* Metode pembayaran: [Transfer/dll.]
* Jatuh tempo setiap pembayaran: [Jumlah] hari sejak invoice
* Ketentuan keterlambatan pembayaran: [Denda/suspensi pekerjaan/dll.]
* Biaya di luar scope: [Tarif per jam/per proyek/berdasarkan quotation baru]

### 4. REVISI DAN APPROVAL
* Jumlah revisi minor yang termasuk dalam harga: maksimal [2/3] kali per deliverable/tahap.
* Definisi revisi minor: perubahan kecil yang tidak mengubah konsep, struktur, atau arah utama pekerjaan.
* Perubahan konsep, brief, atau scope setelah approval dianggap sebagai pekerjaan tambahan.
* Biaya revisi tambahan: [Rp[Nominal]/jam atau quotation terpisah].
* Batas waktu Klien memberikan feedback: maksimal [X] hari kerja.
* Pekerjaan dapat dianggap disetujui apabila [ketentuan approval].

### 5. HAK DAN KEWAJIBAN PARA PIHAK
Jelaskan secara jelas:
* kewajiban Penyedia Jasa;
* kewajiban Klien;
* kewajiban Klien menyediakan materi, data, akses, dan feedback;
* tanggung jawab atas keterlambatan yang disebabkan masing-masing pihak.

### 6. HAK CIPTA, HAK KEKAYAAN INTELEKTUAL, DAN SOURCE FILE
* Hak atas hasil karya final beralih kepada Klien setelah pembayaran lunas.
* Sebelum pelunasan, hak kepemilikan atas hasil karya tetap berada pada Penyedia Jasa.
* Jelaskan status source file/editable file: [termasuk/tidak termasuk/diserahkan setelah pelunasan].
* Jelaskan status font, stock image, musik, plugin, template, software, atau aset pihak ketiga.
* Penyedia Jasa berhak menggunakan hasil karya yang telah dipublikasikan untuk portofolio, website, media sosial, presentasi, dan materi promosi, kecuali Klien meminta kerahasiaan secara tertulis.
* Jangan menyatakan bahwa Penyedia Jasa dapat mengalihkan hak atas aset pihak ketiga yang memang tidak dimiliki oleh Penyedia Jasa.

### 7. KERAHASIAAN
Masukkan ketentuan mengenai kerahasiaan informasi, data, materi, strategi bisnis, kredensial, dan dokumen milik Klien yang diperoleh selama proyek.

### 8. PENGAKHIRAN DAN PEMBATALAN
Jika proyek dibatalkan atau dihentikan sepihak:
* pekerjaan yang telah selesai tetap wajib dibayar secara proporsional;
* DP [dapat/tidak dapat] dikembalikan;
* biaya pembatalan/termination fee: [Persen]% dari sisa nilai kontrak / [Nominal];
* jelaskan hak para pihak atas pekerjaan yang sudah dibuat;
* jelaskan kondisi termination karena wanprestasi atau pelanggaran kontrak.

### 9. PEKERJAAN TAMBAHAN / CHANGE REQUEST
Setiap pekerjaan di luar scope harus mendapatkan persetujuan terlebih dahulu dan dapat dikenakan biaya tambahan serta perubahan timeline.

### 10. FORCE MAJEURE
Masukkan ketentuan mengenai keadaan di luar kendali wajar para pihak yang dapat menghambat pelaksanaan pekerjaan.

### 11. PENYELESAIAN PERSELISIHAN
* Utamakan musyawarah terlebih dahulu.
* Jika tidak tercapai kesepakatan, gunakan mekanisme: [mediasi/arbitrase/pengadilan].
* Domisili/hukum yang berlaku: [Indonesia / wilayah hukum tertentu].

### 12. KETENTUAN LAIN
Tambahkan ketentuan mengenai:
* hubungan para pihak sebagai kontraktor independen;
* perubahan kontrak hanya sah jika disetujui secara tertulis;
* keterpisahan ketentuan (severability);
* keseluruhan perjanjian (entire agreement);
* pemberitahuan resmi;
* ketentuan yang tetap berlaku setelah kontrak berakhir jika relevan.

### INSTRUKSI PENYUSUNAN
1. Gunakan Bahasa Indonesia yang formal, jelas, profesional, dan mudah dipahami.
2. Gunakan struktur kontrak dengan judul, pasal, ayat, dan sub-ayat yang rapi.
3. Jangan mengarang data yang belum diberikan. Gunakan placeholder [....].
4. Hindari klausul yang ambigu atau bertentangan satu sama lain.
5. Pastikan persentase pembayaran berjumlah 100%.
6. Bedakan dengan jelas antara revisi minor dan perubahan scope.
7. Bedakan antara hak atas hasil karya final dan aset pihak ketiga.
8. Buat klausul yang seimbang untuk kedua belah pihak, kecuali saya secara eksplisit meminta kontrak yang lebih protektif terhadap salah satu pihak.
9. Setelah draf kontrak selesai, buat bagian "Asumsi dan Data yang Masih Perlu Dilengkapi" yang mencantumkan informasi yang masih menggunakan placeholder.
10. Tambahkan catatan singkat bahwa dokumen merupakan draft dan sebaiknya ditinjau oleh profesional hukum sebelum ditandatangani, terutama untuk proyek bernilai besar atau berisiko tinggi.

### FORMAT OUTPUT
Tampilkan:
1. Judul perjanjian
2. Identitas para pihak
3. Pembukaan
4. Pasal-pasal perjanjian
5. Ketentuan penutup
6. Kolom tanda tangan kedua pihak
7. Asumsi dan data yang masih perlu dilengkapi
8. Catatan review hukum`,
  },
  {
    id: "property_rental",
    title: "Sewa Tempat & Properti",
    icon: <Building2 className="size-3.5 text-amber-600" />,
    prompt: `Buatkan draf Perjanjian Sewa Tempat & Properti dalam Bahasa Indonesia antara:

PIHAK PERTAMA / PEMILIK / PEMBERI SEWA
* Nama: [Nama]
* Status/bentuk usaha: [Pribadi/PT/CV/dll.]
* Alamat: [Alamat]
* Email: [Email]
* Kontak: [Nomor Telepon]

PIHAK KEDUA / PENYEWA
* Nama: [Nama]
* Status/bentuk usaha: [Pribadi/PT/CV/dll.]
* Alamat: [Alamat]
* Email: [Email]
* Kontak: [Nomor Telepon]

### 1. OBJEK SEWA
* Jenis properti: [Rumah/Ruko/Gedung/Studio/Lahan/Ruang Kantor/Ruang Usaha/dll.]
* Nama properti: [Nama]
* Alamat lengkap: [Alamat]
* Luas: [Luas]
* Bagian/ruangan yang disewakan: [Detail]
* Fasilitas yang termasuk: [Daftar fasilitas]
* Inventaris/peralatan yang ikut disewakan: [Daftar]
* Kondisi awal properti: [Kondisi]
* Lampiran foto/inventaris: [Ada/Tidak]

### 2. TUJUAN DAN PENGGUNAAN PROPERTI
Properti hanya boleh digunakan untuk:
* Tujuan penggunaan: [Tempat tinggal/usaha/event/studio/kantor/dll.]
* Aktivitas yang diperbolehkan: [Aktivitas]
* Aktivitas yang dilarang: [Aktivitas]
* Ketentuan mengenai perubahan fungsi, renovasi, atau modifikasi properti: [Ketentuan]

### 3. JANGKA WAKTU SEWA
* Tanggal mulai: [Tanggal]
* Tanggal berakhir: [Tanggal]
* Durasi: [Jumlah bulan/tahun]
* Ketentuan perpanjangan: [Ketentuan]
* Batas waktu pemberitahuan jika ingin memperpanjang: [X] hari sebelum berakhir.

### 4. HARGA SEWA DAN PEMBAYARAN
* Nilai sewa: Rp[Nominal]
* Periode pembayaran: [Bulanan/Tahunan/Sekaligus]
* Uang jaminan/deposit: Rp[Nominal]
* Jadwal pembayaran: [Tanggal]
* Metode pembayaran: [Transfer/dll.]
* Biaya tambahan yang ditanggung Penyewa: [Listrik/Air/Internet/Service charge/Pajak/dll.]
* Denda keterlambatan: [Ketentuan]
* Ketentuan pengembalian deposit: [Ketentuan]

### 5. SERAH TERIMA
Atur ketentuan mengenai:
* tanggal serah terima;
* kondisi properti saat serah terima;
* kunci/access card/access code;
* daftar inventaris;
* meteran listrik/air;
* dokumentasi kondisi awal;
* berita acara serah terima.

### 6. PEMELIHARAAN DAN KERUSAKAN
Tentukan secara jelas:
* kewajiban Pemilik terhadap kerusakan struktural;
* kewajiban Penyewa terhadap kerusakan akibat penggunaan;
* pemeliharaan rutin;
* kerusakan karena kelalaian;
* mekanisme pelaporan kerusakan;
* siapa yang menanggung biaya perbaikan;
* batas waktu perbaikan.

### 7. RENOVASI DAN PERUBAHAN PROPERTI
Penyewa tidak boleh melakukan renovasi, pemasangan permanen, perubahan struktur, pengecatan, pemasangan signage, atau perubahan lainnya tanpa persetujuan tertulis Pemilik.
Jelaskan:
* perubahan yang diperbolehkan;
* siapa yang menanggung biaya;
* status hasil renovasi saat masa sewa berakhir;
* kewajiban mengembalikan properti ke kondisi semula jika diperlukan.

### 8. SUBSEWA DAN PENGALIHAN
Atur apakah Penyewa:
* boleh menyewakan kembali;
* boleh meminjamkan kepada pihak lain;
* boleh mengalihkan hak sewa;
* memerlukan persetujuan tertulis Pemilik.

### 9. AKSES PEMILIK
Atur hak Pemilik untuk memasuki properti untuk:
* inspeksi;
* perawatan;
* perbaikan;
* keadaan darurat;
* menunjukkan properti kepada calon penyewa/pembeli menjelang berakhirnya masa sewa.
Tetapkan pemberitahuan sebelumnya kecuali dalam keadaan darurat.

### 10. PAJAK, UTILITAS, DAN BIAYA LAIN
Jelaskan pihak yang bertanggung jawab atas:
* listrik;
* air;
* internet;
* kebersihan;
* keamanan;
* service charge;
* pajak;
* retribusi;
* biaya lingkungan;
* biaya perizinan penggunaan properti.

### 11. LARANGAN
Masukkan larangan terhadap penggunaan properti untuk kegiatan yang:
* melanggar hukum;
* menimbulkan gangguan atau kerusakan;
* menimbulkan bahaya;
* mengganggu lingkungan sekitar;
* melanggar ketentuan pengelola gedung/kompleks jika berlaku.

### 12. PENGAKHIRAN DAN PEMBATALAN
Atur kondisi pengakhiran perjanjian karena:
* masa sewa berakhir;
* kesepakatan bersama;
* pelanggaran perjanjian;
* keterlambatan pembayaran;
* penggunaan properti yang melanggar ketentuan;
* keadaan lain yang disepakati.
Jika terjadi pembatalan sepihak, tentukan:
* penalti;
* pembayaran proporsional;
* status deposit;
* kewajiban pengosongan;
* kompensasi jika ada.

### 13. PENGEMBALIAN PROPERTI
Saat masa sewa berakhir, Penyewa wajib:
* mengosongkan properti;
* mengembalikan kunci dan akses;
* mengembalikan inventaris;
* melunasi seluruh kewajiban;
* mengembalikan kondisi properti sesuai ketentuan.
Jelaskan mekanisme pemeriksaan akhir dan penyelesaian kerusakan.

### 14. KEADAAN KAHAR / FORCE MAJEURE
Masukkan ketentuan mengenai keadaan di luar kendali wajar para pihak dan dampaknya terhadap kewajiban pembayaran maupun penggunaan properti.

### 15. PENYELESAIAN PERSELISIHAN
Utamakan musyawarah. Jika tidak tercapai kesepakatan, gunakan:
* [Mediasi/Arbitrase/Pengadilan]
* Domisili hukum: [Wilayah]

### 16. KETENTUAN UMUM
Masukkan ketentuan mengenai:
* perubahan perjanjian;
* pemberitahuan resmi;
* keterpisahan ketentuan;
* keseluruhan perjanjian;
* hukum yang berlaku;
* hubungan para pihak.

### INSTRUKSI PENYUSUNAN
1. Gunakan Bahasa Indonesia formal, jelas, dan profesional.
2. Jangan mengarang data yang belum diberikan; gunakan placeholder [....].
3. Bedakan secara tegas tanggung jawab Pemilik dan Penyewa.
4. Pastikan ketentuan pembayaran, deposit, kerusakan, dan pengakhiran tidak saling bertentangan.
5. Jika ada klausul opsional, tandai sebagai [OPSIONAL].
6. Buat pasal dan ayat secara sistematis.
7. Sertakan bagian tanda tangan para pihak.
8. Sertakan daftar lampiran yang disarankan, seperti daftar inventaris dan berita acara serah terima.
9. Setelah kontrak, tampilkan bagian "Data yang Masih Perlu Dilengkapi".
10. Tambahkan catatan bahwa dokumen merupakan draft dan sebaiknya ditinjau oleh profesional hukum sebelum ditandatangani.

### FORMAT OUTPUT
Tampilkan:
1. Judul perjanjian
2. Identitas para pihak
3. Pembukaan
4. Pasal-pasal perjanjian
5. Ketentuan penutup
6. Tanda tangan
7. Daftar lampiran
8. Data yang masih perlu dilengkapi
9. Catatan review hukum`,
  },
  {
    id: "business_partnership",
    title: "Kemitraan Usaha & Bagi Hasil",
    icon: <Handshake className="size-3.5 text-indigo-600" />,
    prompt: `Buatkan draf Perjanjian Kemitraan Usaha dan Bagi Hasil dalam Bahasa Indonesia antara:

PIHAK PERTAMA / MITRA 1
* Nama: [Nama]
* Status/bentuk usaha: [Pribadi/PT/CV/dll.]
* Alamat: [Alamat]
* Email: [Email]
* Kontak: [Nomor Telepon]
* Peran dalam usaha: [Investor/Pengelola/Operator/Pemilik Aset/dll.]

PIHAK KEDUA / MITRA 2
* Nama: [Nama]
* Status/bentuk usaha: [Pribadi/PT/CV/dll.]
* Alamat: [Alamat]
* Email: [Email]
* Kontak: [Nomor Telepon]
* Peran dalam usaha: [Investor/Pengelola/Operator/Pemilik Aset/dll.]

### 1. LATAR BELAKANG DAN TUJUAN KEMITRAAN
* Nama usaha/proyek: [Nama]
* Jenis usaha: [Jenis]
* Deskripsi bisnis: [Deskripsi]
* Tujuan kemitraan: [Tujuan]
* Wilayah operasional: [Wilayah]
* Tanggal mulai kemitraan: [Tanggal]

### 2. KONTRIBUSI MASING-MASING PIHAK
Jelaskan secara terperinci kontribusi setiap pihak.
Mitra 1 memberikan:
* Modal uang: Rp[Nominal]
* Aset: [Aset]
* Tempat: [Tempat]
* Peralatan: [Peralatan]
* Keahlian/network/brand: [Detail]
* Kontribusi lainnya: [Detail]

Mitra 2 memberikan:
* Modal uang: Rp[Nominal]
* Aset: [Aset]
* Tenaga/pengelolaan: [Detail]
* Keahlian/network/brand: [Detail]
* Kontribusi lainnya: [Detail]

Jelaskan nilai kontribusi masing-masing pihak dan metode penilaiannya jika kontribusinya bukan berupa uang.

### 3. KEPEMILIKAN MODAL DAN ASET
Tentukan dengan jelas:
* siapa pemilik modal;
* siapa pemilik aset yang dibawa ke dalam usaha;
* apakah aset menjadi milik bersama atau tetap milik pihak asal;
* bagaimana aset diperlakukan saat kemitraan berakhir;
* bagaimana tambahan modal diperlakukan.

### 4. PERAN DAN TANGGUNG JAWAB
Mitra 1 bertanggung jawab atas: [Daftar]
Mitra 2 bertanggung jawab atas: [Daftar]
Jelaskan siapa yang memiliki kewenangan untuk:
* mengambil keputusan operasional;
* melakukan pembelian;
* menandatangani kontrak;
* mengelola rekening;
* merekrut pekerja;
* menentukan harga;
* melakukan promosi;
* menyetujui pengeluaran.

### 5. PENGELOLAAN KEUANGAN
Atur:
* rekening usaha;
* pencatatan transaksi;
* pembukuan;
* bukti pengeluaran;
* laporan keuangan;
* periode laporan;
* akses masing-masing pihak terhadap laporan;
* mekanisme pemeriksaan/audit;
* batas pengeluaran yang memerlukan persetujuan kedua pihak.

### 6. DEFINISI PENDAPATAN, BIAYA, DAN LABA
Definisikan secara eksplisit:
Omzet/Pendapatan: [Definisi]
Biaya operasional: [Daftar biaya]
Laba kotor: pendapatan dikurangi [komponen].
Laba bersih: pendapatan dikurangi seluruh biaya yang disepakati.
Pastikan dasar perhitungan bagi hasil menggunakan: [Omzet / Laba Kotor / Laba Bersih / Formula khusus]
Jangan menggunakan istilah "profit" atau "keuntungan" tanpa mendefinisikannya.

### 7. SKEMA BAGI HASIL
* Mitra 1: [Persen]%
* Mitra 2: [Persen]%
* Dasar perhitungan: [Omzet/Laba Kotor/Laba Bersih]
* Periode perhitungan: [Mingguan/Bulanan/Kuartalan]
* Tanggal pembayaran bagi hasil: [Tanggal]
* Rekonsiliasi/perhitungan: [Ketentuan]
Berikan contoh simulasi perhitungan menggunakan angka ilustratif agar tidak terjadi perbedaan interpretasi.

### 8. KERUGIAN USAHA
Tentukan:
* bagaimana kerugian ditanggung;
* apakah berdasarkan persentase modal;
* apakah berdasarkan persentase bagi hasil;
* batas tanggung jawab masing-masing pihak;
* bagaimana jika terjadi kerugian berturut-turut;
* bagaimana jika diperlukan tambahan modal.
Jangan mengasumsikan bahwa persentase bagi hasil otomatis sama dengan persentase tanggung jawab kerugian.

### 9. TAMBAHAN MODAL
Atur mekanisme apabila usaha membutuhkan tambahan modal:
* siapa yang wajib menyediakan;
* apakah kontribusi tambahan mengubah persentase kepemilikan/bagi hasil;
* apakah dianggap pinjaman kepada usaha;
* batas waktu penyetoran;
* konsekuensi apabila salah satu pihak tidak ikut menambah modal.

### 10. PENGAMBILAN KEPUTUSAN
Bedakan:
* keputusan operasional sehari-hari;
* keputusan strategis;
* keputusan yang wajib mendapatkan persetujuan kedua pihak.
Contoh keputusan yang memerlukan persetujuan bersama:
* utang/pinjaman;
* investasi besar;
* pembelian aset bernilai tinggi;
* perubahan model bisnis;
* penambahan mitra;
* pembukaan cabang;
* penjualan aset utama;
* perubahan persentase bagi hasil.

### 11. GAJI, FEE, DAN REIMBURSEMENT
Jika salah satu pihak aktif mengelola usaha, jelaskan apakah pihak tersebut menerima:
* gaji;
* management fee;
* uang operasional;
* reimbursement;
* atau hanya menerima bagi hasil.
Pastikan biaya tersebut diperhitungkan secara jelas sebelum menentukan laba yang dibagikan.

### 12. HAK KEKAYAAN INTELEKTUAL
Atur kepemilikan:
* merek;
* logo;
* desain;
* konten;
* domain;
* website;
* database pelanggan;
* akun media sosial;
* materi pemasaran;
* sistem/software;
* aset intelektual lainnya.
Bedakan aset yang dibuat sebelum kemitraan dan yang dibuat selama kemitraan.

### 13. KERAHASIAAN DAN DATA
Atur kerahasiaan mengenai:
* laporan keuangan;
* database pelanggan;
* supplier;
* harga;
* strategi bisnis;
* password/akses;
* informasi komersial;
* data lainnya.

### 14. LARANGAN DAN KONFLIK KEPENTINGAN
Atur larangan:
* menggunakan uang usaha untuk kepentingan pribadi;
* menyembunyikan transaksi;
* mengambil pelanggan usaha untuk kepentingan pribadi;
* menggunakan aset usaha tanpa izin;
* melakukan transaksi dengan pihak terafiliasi tanpa pengungkapan;
* tindakan lain yang merugikan usaha.

### 15. JANGKA WAKTU
* Tanggal mulai: [Tanggal]
* Jangka waktu: [X tahun/bulan]
* Perpanjangan: [Ketentuan]

### 16. PENGAKHIRAN KEMITRAAN
Kemitraan dapat berakhir karena:
* jangka waktu berakhir;
* kesepakatan bersama;
* salah satu pihak mengundurkan diri;
* pelanggaran material;
* kebangkrutan/ketidakmampuan menjalankan usaha;
* kondisi lain yang disepakati.

### 17. EXIT, BUYOUT, DAN PENYELESAIAN ASET
Jika salah satu pihak keluar, tentukan:
* hak pihak yang keluar;
* metode valuasi usaha;
* cara menghitung nilai kepemilikan;
* siapa yang dapat membeli bagian pihak yang keluar;
* jangka waktu pembayaran;
* perlakuan terhadap aset;
* perlakuan terhadap utang;
* perlakuan terhadap piutang;
* database pelanggan;
* merek dan IP.

### 18. PENGALIHAN HAK
Atur apakah masing-masing pihak boleh menjual, mengalihkan, atau menyerahkan kepentingannya dalam kemitraan kepada pihak ketiga.

### 19. WANPRESTASI
Tentukan tindakan apabila salah satu pihak:
* tidak memberikan kontribusi;
* mengambil uang usaha tanpa hak;
* menyalahgunakan aset;
* menyembunyikan pendapatan;
* melanggar kewajiban;
* melakukan tindakan yang menyebabkan kerugian material.
Jelaskan mekanisme pemberitahuan, kesempatan memperbaiki pelanggaran, dan konsekuensinya.

### 20. FORCE MAJEURE
Masukkan ketentuan mengenai keadaan di luar kendali wajar para pihak dan dampaknya terhadap usaha.

### 21. PENYELESAIAN PERSELISIHAN
* Musyawarah terlebih dahulu.
* Jika gagal: [Mediasi/Arbitrase/Pengadilan].
* Domisili hukum: [Wilayah].

### 22. KETENTUAN UMUM
Masukkan ketentuan mengenai:
* perubahan perjanjian;
* pemberitahuan;
* keterpisahan ketentuan;
* keseluruhan perjanjian;
* hukum yang berlaku;
* hubungan independen para pihak jika relevan.

### INSTRUKSI KHUSUS PENYUSUNAN
1. Gunakan Bahasa Indonesia formal, jelas, profesional, dan tidak ambigu.
2. Jangan mengarang data yang belum diberikan. Gunakan placeholder [....].
3. Jangan menganggap persentase modal, kepemilikan, bagi hasil, dan tanggung jawab kerugian selalu sama.
4. Definisikan secara matematis dasar perhitungan bagi hasil.
5. Berikan contoh simulasi perhitungan menggunakan angka ilustratif.
6. Bedakan dengan jelas antara omzet, laba kotor, laba bersih, biaya operasional, gaji/fee, dan bagi hasil.
7. Jika terdapat ketentuan yang belum ditentukan, tandai dengan [PERLU DIISI].
8. Tandai klausul opsional dengan [OPSIONAL].
9. Buat mekanisme exit/buyout yang cukup jelas agar tidak terjadi sengketa ketika salah satu pihak ingin keluar.
10. Pastikan seluruh klausul tidak saling bertentangan.
11. Sertakan bagian tanda tangan para pihak.
12. Setelah kontrak, tampilkan bagian "Data yang Masih Perlu Dilengkapi".
13. Tambahkan catatan bahwa dokumen merupakan draft dan sebaiknya ditinjau oleh profesional hukum sebelum ditandatangani.

### FORMAT OUTPUT
Tampilkan:
1. Judul perjanjian
2. Identitas para pihak
3. Latar belakang
4. Definisi
5. Pasal-pasal perjanjian
6. Formula dan simulasi bagi hasil
7. Ketentuan pengakhiran/exit
8. Ketentuan penutup
9. Tanda tangan
10. Lampiran jika diperlukan
11. Data yang masih perlu dilengkapi
12. Catatan review hukum`,
  },
];

export interface TemplateOptionsProps {
  hasText: boolean;
  onSelect: (prompt: string) => void;
  options?: TemplateOption[];
  className?: string;
}

/**
 * Animated template options badges for quick contract drafting.
 */
export function TemplateOptions({
  hasText,
  onSelect,
  options = TEMPLATE_OPTIONS,
  className,
}: TemplateOptionsProps) {
  return (
    <div
      aria-hidden={hasText}
      className={cn(
        "absolute left-0 right-0 top-full pt-3",
        "flex flex-wrap items-center justify-center gap-2",
        hasText ? "pointer-events-none" : "pointer-events-auto",
        className
      )}
    >
      {options.map((item, index) => {
        const delay = hasText
          ? (options.length - 1 - index) * 40
          : index * 60;
        return (
          <DraftTemplateBadge
            key={item.id}
            icon={item.icon}
            title={item.title}
            onClick={() => onSelect(item.prompt)}
            style={{
              opacity: hasText ? 0 : 1,
              transform: hasText ? "translateY(28px)" : "translateY(0px)",
              transition: `opacity 280ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 280ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
