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
- [x] **Simulasi Kantor Virtual 2.5D (Virtual HQ Campus):** Simulasi kampus kantor interaktif berbasis piksel dengan karakter pengembang yang bergerak dinamis.

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

---

## 🚀 TAHAP AKTIF SELANJUTNYA (EKSEKUSI DI NEW CHAT)

### 7. Persiapan Peluncuran Produksi & Aktivasi Sinkronisasi GitHub (Stage 7)
- [x] **7.1 Penyiapan Aturan Cloudflare Pages (`public/_headers`):** Proteksi injeksi web nosniff, DENY, strict-origin, dan cache aset 1 tahun immutable di domain gratis `*.pages.dev` ($0.00 / Rp 0).
- [x] **7.2 Penguncian Pendaftaran Tester Terbuka Tanpa Batas:** Formulir pendaftaran Google Play closed testing menampilkan badge resmi kuota tanpa batas dan ramah pengguna.
- [x] **7.3 Buka Kunci Sinkronisasi GitHub Webhook:** Repositori DompetNalar (`FinSmart`) dibuka kuncinya untuk penerimaan sinyal webhook produksi (`readyForProductionWebhook: true`).
- [x] **7.4 Panduan Sambungan Webhook GitHub Nyata:** Panduan langkah-demi-langkah praktis bergambar bagi Owner untuk menyambungkan Webhook di GitHub Settings (`Artifact/PANDUAN_SAMBUNGAN_WEBHOOK_GITHUB.md`).
- [x] **7.5 Verifikasi Kualitas Penuh:** 751 pengujian otomatis lulus 100%, 0 eror TypeScript, 0 eror linter, 0 kebocoran rahasia/privasi, 2.500 berkas patuh kebijakan repositori.

---

## 🚀 TAHAP AKTIF SELANJUTNYA (EKSEKUSI DI PERANGKAT / SESI BARU)

### 🎨 Modul Kantor Virtual 3D Low-Poly Isometrik (Three.js WebGL)
Sesuai inspirasi dari video lembur.id & gaya karakter manusia ramah Kay Lousberg (CC0):
- [x] **Modul 3D Low-Poly Isometrik Studio (`ThreeCampusCanvas.tsx` & `VirtualOfficeHub.tsx`):**
  - Kantor 3D interaktif berbasis Three.js WebGL (100% Gratis / Open-Source — Rp 0).
  - Skalabilitas prosedural dinamis mengikuti daftar proyek studio di `projects.json` / CMS.
  - 30+ Kru manusia berbusana kantor rapi (Kay Lousberg style) bergerak mandiri (working, sleeping, walking to pantry, lounge).
  - Kontrol interaktif: Orbit 360°, zoom in/out, kunci paten ruang proyek via lerp kamera.
  - Balon obrolan melayang di atas kepala karakter dan konsol interaksi pengunjung (/bangunkan, /kopi, /pizza, /lembur, /pesta).
  - Terintegrasi dengan tab switcher di beranda mendampingi versi 2.5D Pixel Campus.
  - 770 / 770 pengujian Vitest lulus 100% (zero regression).

---

## 🚀 TAHAP AKTIF SELANJUTNYA (EKSEKUSI DI NEW CHAT)

### 8. Peluncuran Live Produksi Cloudflare Pages & Pemantauan Tester
- [x] **8.1 Push Perdana Repositori ke GitHub Owner (`zweifeel`):** Cabang `master` telah berhasil di-push ke `https://github.com/zweifeel/indie-developer-portfolio.git` dan 4 repositori proyek mandiri (`idle-master`, `mobile-kasir`, `idle-mining`, `worklume`) telah dibuat di bawah akun `zweifeel`.
- [x] **8.2 Integrasi Model 3D Otentik KayKit Adventurers & Furniture (CC0):** Karakter `Knight.glb`, `Mage.glb`, `Rogue.glb`, `Barbarian.glb` serta perabotan kantor 3D KayKit telah terpasang dan terverifikasi visual di browser nyata.
- [x] **8.3 Pembaruan & Deployment Produksi Cloudflare Pages (`sleepykoala.pages.dev`):** Menggunakan proyek eksisting `sleepykoala` tanpa duplikasi, mengunggah kunci terenkripsi `GITHUB_WEBHOOK_SECRET`, dan merilis 1.008 aset produksi (termasuk modul kantor 3D KayKit Adventurers) langsung ke alamat publik `https://sleepykoala.pages.dev` ($0.00 / Rp 0).
- [x] **8.4 Uji Coba Formulir Tester & Webhook GitHub Nyata di Alamat Live:** Pendaftaran Beta Tester `mobile-kasir` berhasil tersimpan ke Google Sheets (`HTTP 200 OK`, `an***@gmail.com`), Webhook GitHub terpasang pada 5 repositori aktif `zweifeel` dengan verifikasi HMAC-SHA256 ping `200 PONG` (0.11s), dan tampilan visual 3D telah terverifikasi via Protokol Mata AI.
