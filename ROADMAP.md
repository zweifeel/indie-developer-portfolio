# ROADMAP.md
# RENCANA TAHAPAN FITUR: SleepyKoala Studio Portfolio

> [!TIP]
> **PANDUAN PENGERJAAN AMAN (UNTUK OWNER & AGEN):**
> Kerjakan SATU per SATU fitur secara vertikal (End-to-End sampai tuntas teruji nyata) sebelum berpindah ke fitur berikutnya.
> Dilarang melompati tahapan tanpa verifikasi 100% lulus!

---

## 🏆 TAHAP SELESAI (SUDAH BERFUNGSI NORMAL & LOLOS UJI 100%)

Fitur-fitur di bawah ini telah selesai dibangun, teruji nyata dari hulu ke hilir, dan diproteksi agar tidak rusak:

### 1. Etalase Portofolio Publik & Halaman Web
- [x] **Halaman Beranda (Home Page):** Sambutan pengembang indie, sorotan game unggulan, dan statistik studio.
- [x] **Katalog Proyek Game & Aplikasi:** Daftar kartu proyek (DompetNalar, IDLE MASTER, Mobile Kasir, Idle Mining Empire).
- [x] **Halaman Detail Proyek Lengkap:** Menampilkan deskripsi game, status rilis, pratinjau media, dan peta jalan fitur.
- [x] **Halaman Kebijakan & Kepatuhan:** Halaman *Privacy Policy* dan *Delete Account* sesuai standar resmi Google Play Store.

### 2. Pendaftaran Penguji Coba (Beta Tester) Google Play
- [x] **Formulir Pendaftaran Interaktif:** Jendela pop-up ramah pengguna untuk calon tester memasukkan email Google Play.
- [x] **Penyaluran Data Tanpa Biaya (Zero-Cost):** Cloudflare Functions meneruskan data pendaftaran ke Google Sheets melalui Google Apps Script tanpa menyewa server berbayar (Rp 0).
- [x] **Penanganan Anti-Gagal (Fail-Safe):** Jika server Google sedang lambat/sibuk, pengguna menerima pesan yang jelas dan ramah tanpa ada eror yang bocor.
- [x] **Kuota Tanpa Batas (Unlimited):** Dikonfirmasi Owner untuk dibuka seluas-luasnya tanpa pembatasan 20 tester.

### 3. Ruang Kerja Pemilik (Web Admin CMS)
- [x] **Pintu Masuk Aman (OTP Email):** Login khusus pemilik (`zweifeel@gmail.com`) menggunakan kode angka sekali pakai ke email, tanpa kata sandi rumit.
- [x] **Pengatur Progres & Fitur Game:** Pemilik bisa menambah fitur baru, menandai fitur yang sudah selesai, mengunggah screenshot, dan memilih mana yang siap dipublikasikan ke publik.
- [x] **Pemisahan Draf vs Publik:** Fitur yang masih dalam tahap rahasia/draf tidak akan pernah bocor ke halaman web umum sebelum disetujui pemilik.
- [x] **Mode Pratinjau (Preview Mode):** Pemilik bisa melihat tampilan halaman sebelum tombol "Publikasikan" ditekan.

### 4. Satpam & Otomasi Keamanan Lokal (DevSecOps)
- [x] **Pemindai Rahasia & Kredensial:** Otomatis memindai 2.365+ file untuk memastikan tidak ada token atau kata sandi yang tersimpan di kode.
- [x] **Pemindai Privasi & Data Pribadi (PII):** Memastikan tidak ada data email atau identitas pengguna yang tersimpan di riwayat file.
- [x] **Aturan File Ketat (File Policy):** Memastikan 2.467+ file dalam repositori bersih dari file sampah atau file asing.
- [x] **Pengawal Otomatis Git (Safe Staging & Push Guard):** Mencegah penimpaan file kerjaan yang belum disimpan, menolak push jika ada eror, dan memblokir modifikasi proyek yang dibekukan (TBO).

### 5. Jembatan Otomatis GitHub (Webhook Sync)
- [x] **Penerima Laporan Progres:** Pintu pintar yang menerima sinyal saat pengembang memperbarui kode game di repositori GitHub private.
- [x] **Penyaring Anti-Palsu (HMAC-SHA256):** Memverifikasi tanda tangan digital resmi dari GitHub sehingga orang asing tidak bisa mengirim laporan palsu.
- [x] **Pencegah Duplikasi (Anti-Replay):** Laporan yang dikirim berulang kali akan otomatis disaring sehingga data tidak berantakan.

### 6. Uji Mutu & Ketahanan Menyeluruh (Stage 6)
- [x] **60 Skenario Uji Keamanan Khusus:** Membuktikan pertahanan terhadap pencurian hak akses admin, kebocoran data draf, dan gangguan server.
- [x] **743 Pengujian Otomatis Lolos 100%:** Seluruh 37 suite pengujian sistem berjalan sempurna dalam waktu 36 detik.

### 7. Persiapan Peluncuran Produksi & Aktivasi Sinkronisasi GitHub (Stage 7)
- [x] **7.1 Penyiapan Aturan Cloudflare Pages (`public/_headers`):** Proteksi injeksi web nosniff, DENY, strict-origin, dan cache aset 1 tahun immutable di domain gratis `*.pages.dev` ($0.00 / Rp 0).
- [x] **7.2 Penguncian Pendaftaran Tester Terbuka Tanpa Batas:** Formulir pendaftaran Google Play closed testing menampilkan badge resmi kuota tanpa batas dan ramah pengguna.
- [x] **7.3 Buka Kunci Sinkronisasi GitHub Webhook:** Repositori DompetNalar (`FinSmart`) dibuka kuncinya untuk penerimaan sinyal webhook produksi (`readyForProductionWebhook: true`).
- [x] **7.4 Panduan Sambungan Webhook GitHub Nyata:** Panduan langkah-demi-langkah praktis bergambar bagi Owner untuk menyambungkan Webhook di GitHub Settings (`Artifact/PANDUAN_SAMBUNGAN_WEBHOOK_GITHUB.md`).
- [x] **7.5 Verifikasi Kualitas Penuh:** 751 pengujian otomatis lulus 100%, 0 eror TypeScript, 0 eror linter, 0 kebocoran rahasia/privasi, 2.500 berkas patuh kebijakan repositori.

### 8. Peluncuran Live Produksi Cloudflare Pages & Multi-Repo zweifeel
- [x] **8.1 Push Perdana Repositori ke GitHub Owner (`zweifeel`):** Cabang `master` telah berhasil di-push ke `https://github.com/zweifeel/indie-developer-portfolio.git` dan 4 repositori proyek mandiri (`idle-master`, `mobile-kasir`, `idle-mining`, `worklume`) telah dibuat di bawah akun `zweifeel`.
- [x] **8.2 Integrasi Model 3D Otentik KayKit Adventurers & Furniture (CC0):** Karakter `Knight.glb`, `Mage.glb`, `Rogue.glb`, `Barbarian.glb` serta perabotan kantor 3D KayKit telah terpasang dan terverifikasi visual di browser nyata.
- [x] **8.3 Pembaruan & Deployment Produksi Cloudflare Pages (`sleepykoala.pages.dev`):** Menggunakan proyek eksisting `sleepykoala` tanpa duplikasi, mengunggah kunci terenkripsi `GITHUB_WEBHOOK_SECRET`, dan merilis 1.008 aset produksi (termasuk modul kantor 3D KayKit Adventurers) langsung ke alamat publik `https://sleepykoala.pages.dev` ($0.00 / Rp 0).
- [x] **8.4 Uji Coba Formulir Tester & Webhook GitHub Nyata di Alamat Live:** Pendaftaran Beta Tester `mobile-kasir` berhasil tersimpan ke Google Sheets (`HTTP 200 OK`, `an***@gmail.com`), Webhook GitHub terpasang pada 5 repositori aktif `zweifeel` dengan verifikasi HMAC-SHA256 ping `200 PONG` (0.11s), dan tampilan visual 3D telah terverifikasi via Protokol Mata AI.

---

## 🚀 TAHAP AKTIF SAAT INI (EKSEKUSI BERJALAN)

### 🎨 8.5 Rekonstruksi Total Modul Kantor Virtual 3D (Kasual, Animasi Hidup & Ekosistem KayKit Lengkap)
Berdasarkan umpan balik langsung Owner dari tangkapan layar:
- [x] **8.5.1 Penghapusan Total Mode 2.5D Rusak:** Menghapus tab switcher 2.5D dan komponen pixel art yang menghasilkan broken image icons dari `HomePage.tsx` dan `VirtualOfficeHub.tsx`. Kantor Virtual 3D WebGL kini menjadi modul tunggal resmi studio.
- [x] **8.5.2 Pembersihan Senjata & Atribut Fantasi Karakter KayKit:** Model tetap 100% asli KayKit (Kay Lousberg CC0), namun seluruh node senjata (`1H_Sword`, `2H_Sword`, `Shield`, `Crossbow`, `Axe`, `Mage_Hat`, `Knight_Helmet`, `Cape`) dinonaktifkan. Kru tampil bersih dalam pakaian kerja kasual rapi dengan laptop dan cangkir kopi.
- [x] **8.5.3 Aktivasi Animasi Bawaan KayKit (`Sit_Chair_Idle` & `Interact`):** Karakter di meja kerja bergerak hidup dengan animasi duduk rapi di kursi dan mengetik di atas keyboard laptop via `THREE.AnimationMixer`.
- [x] **8.5.4 Penyambungan Pondasi Lantai Kampus Terpadu (Anti-Bolong Biru):** Membangun pelat lantai dasar kampus (`campusGroundSlab`) dan koridor penghubung berkarpet runner yang menyatukan Sayap Barat, Lobi Utama, Pantry Kopi, dan Sayap Timur secara mulus tanpa ada jurang bolong.
- [x] **8.5.5 Penambahan Aset Lingkungan Kantor Resmi KayKit (100% Satu Gaya):** Mengunduh dan memasang paket resmi KayKit Furniture Bits (`armchair`, `cabinet_medium_decorated`, `lamp_standing`, `rug_oval_A`, `pictureframe_large_A`, `chair_B_wood`, `table_low`), KayKit Restaurant Bits (`kitchencounter_straight_A_decorated`, `kitchencounter_sink`, `table_round_A_decorated`), dan KayKit City Bits (`bench`, `box_A`) berlisensi CC0.
- [x] **8.5.6 Dekorasi Lingkungan Tematik Tiap Ruang Kerja:** Tiap ruangan memiliki identitas visual unik: DompetNalar (TV grafik candlestick & kabinet), IDLE MASTER (mesin dingdong arcade & armchair), Mobile Kasir (meja kasir supermarket & rak display produk), Idle Mining (plakat beliung emas & rak batu), Worklume (papan kanban raksasa & tanaman monstera), Pantry Bersama (meja bar counter, sink, & cafe table).
- [x] **8.5.7 Navigasi Kamera Bebas (Drag-Pan & Zoom Terarah):** Mendukung geser bebas (drag-to-pan dengan klik kanan / mode pan) dan zoom kursor di viewport laptop maupun layar sentuh HP.

---

## 🚀 TAHAP PRIORITAS BERIKUTNYA

### 📊 9. Monitoring Closed Testing 14 Hari Mobile Kasir & Verifikasi CMS Changelog
- [ ] **9.1 Modul Pemantauan 14 Hari Closed Testing di Web Admin CMS (`/admin`):**
  - Progress tracker interaktif hari ke-1 sampai hari ke-14.
  - Verifikasi kepatuhan dashboard Google Play Console (20 tester opt-in, crash rate < 1.09%, ANR rate < 0.47%).
  - Generator draf jawaban resmi 6 pertanyaan pengajuan akses produksi Google Play siap-salin 1-klik.
- [ ] **9.2 Verifikasi Hulu-ke-Hilir Alur CMS Changelog GitHub Webhook:**
  - Uji otomatis event webhook masuk sebagai DRAFT (anti-bocor ke etalase publik).
  - Uji peninjauan dan penyuntingan oleh Admin di `/admin` -> `PROGRESS` -> `EVENTS`.
  - Uji publikasi langsung muncul di etalase publik (`/project/:slug` Linimasa Perkembangan Proyek).
- [ ] **9.3 Artefak Panduan Eksekutif Owner (`CHECKLIST_MONITORING_CLOSED_TESTING_14_HARI_MOBILE_KASIR.md`):** Panduan operasional harian ramah non-coder untuk memantau Google Play Console hingga permohonan produksi disetujui Google.
