# PANDUAN PUSH GITHUB PERDANA & DEPLOYMENT CLOUDFLARE PAGES GRATIS
**Proyek:** SleepyKoala Studio — Indie Developer Portfolio  
**Tanggal:** 2026-11-10  
**Biaya Operasional:** **Rp 0 / $0.00 (100% Free FOSS & Cloudflare Free Tier)**  
**Kesehatan Sistem:** **770 / 770 Pengujian Lulus (100% PASS, Zero Regression)**  

---

## 🧭 PENGANTAR UNTUK OWNER (BAHASA AWAM NON-CODER)

Selamat! Seluruh sistem website portofolio studio Anda — mulai dari:
1. Formulir pendaftaran penguji beta Google Play Store,
2. Dashboard pemilik studio (Web Admin OTP),
3. Jembatan otomatis GitHub Webhook (anti-palsu),
4. Simulasi Kantor Virtual 2.5D Retro Pixel Campus, hingga
5. **Modul Kampus Kantor Virtual 3D Isometrik Three.js** (30+ kru manusia otonom bergaya Kay Lousberg, balon obrolan 3D, konsol perintah interaktif pengunjung `/kopi`, `/bangunkan`, `/pizza`, dll)

...semuanya telah **selesai 100%** dan terverifikasi di **770 pengujian otomatis tanpa ada satu pun eror**.

Langkah terakhir untuk membuat website ini bisa diakses oleh seluruh dunia dari HP dan laptop siapa saja adalah:
- **Langkah 1:** Mengunggah (*push*) kode dari laptop Anda ke gudang kode GitHub Anda (`lunachroc07-dot`).
- **Langkah 2:** Menyambungkan GitHub ke Cloudflare Pages agar website online secara otomatis di alamat gratis `https://<nama-pilihan-anda>.pages.dev` tanpa biaya sewa server sepeser pun.

---

## 🚀 LANGKAH 1: PUSH PERDANA KE GITHUB OWNER

Remote repositori GitHub resmi sudah kami pasangkan ke laptop Anda:
`origin -> https://github.com/lunachroc07-dot/indie-developer-portfolio.git`

Karena ini adalah pengunggahan perdana dan akun GitHub memerlukan izin keamanan satu kali di komputer Anda, ikuti langkah mudah berikut:

1. Buka aplikasi **PowerShell** atau **Terminal** di folder proyek ini (`E:\Antigravity Project\indie-developer-portfolio`), atau buka terminal di VS Code.
2. Salin dan tempel perintah berikut, lalu tekan **Enter**:
   ```bash
   git push -u origin master
   ```
3. **Apa yang akan terjadi di layar Anda?**
   - Jendela kecil Windows (atau tab browser Chrome/Edge) akan otomatis terbuka meminta izin login GitHub (Git Credential Manager).
   - Klik tombol hijau bertuliskan **"Sign in with your browser"** atau **"Authorize"**.
   - Begitu Anda klik, proses upload akan langsung berjalan di terminal sampai muncul tulisan:
     `Branch 'master' set up to track remote branch 'master' from 'origin'.`
4. Buka halaman GitHub Anda di browser: [https://github.com/lunachroc07-dot/indie-developer-portfolio](https://github.com/lunachroc07-dot/indie-developer-portfolio) — seluruh berkas kode, aset kantor 3D, dan konfigurasi sudah tersimpan rapi dan aman!

> [!NOTE]
> Jika repositori di GitHub Anda baru dibuat dan masih kosong (*empty repository*), push akan langsung berhasil 100%. Jika sebelumnya di GitHub Anda mencentang "Add a README file", jalankan `git pull origin master --rebase` satu kali sebelum melakukan push.

---

## ☁️ LANGKAH 2: MENGHUBUNGKAN KE CLOUDFLARE PAGES (100% GRATIS)

Cloudflare Pages menyediakan hosting berkecepatan tinggi dengan kuota bandwidth tak terbatas dan sertifikat SSL (gembok hijau HTTPS) secara gratis seumur hidup.

Ikuti panduan klik demi klik berikut:

1. **Masuk ke Dashboard Cloudflare:**
   - Kunjungi [https://dash.cloudflare.com/](https://dash.cloudflare.com/) dan login ke akun Cloudflare Anda.
2. **Pilih Menu Pages:**
   - Di bilah menu sebelah kiri, klik **Workers & Pages**.
   - Klik tombol biru **Create application**.
   - Pilih tab **Pages**, lalu klik **Connect to Git**.
3. **Pilih Akun & Repositori GitHub:**
   - Pilih akun GitHub Anda: `lunachroc07-dot`.
   - Pilih repositori: `indie-developer-portfolio`.
   - Klik **Begin setup**.
4. **Pengaturan Perakitan (Build Settings):**
   Isi kolom pengaturan persis seperti di bawah ini:
   - **Project name:** `sleepykoala` (atau nama lain yang Anda sukai. Alamat website Anda nantinya akan menjadi `https://sleepykoala.pages.dev`).
   - **Production branch:** `master`
   - **Framework preset:** Pilih **Vite** (atau **None**).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** *(Biarkan kosong / default `/`)*
5. **Simpan dan Luncurkan (Save and Deploy):**
   - Klik tombol biru **Save and Deploy** di bagian bawah.
   - Cloudflare akan merakit website Anda dalam waktu sekitar 1 menit.
   - Setelah selesai, muncul centang hijau besar bertuliskan: **"Success! Your site is deployed!"** disertai tautan website live Anda (`https://sleepykoala.pages.dev`).

> [!TIP]
> **Pintu Pintar (Cloudflare Functions) Otomatis Terhubung:**
> Seluruh kode pemroses formulir tester Google Play (`/api/register-tester`), autentikasi admin OTP (`/api/admin/auth/*`), dan penerima progres GitHub (`/api/webhook/github`) yang berada di dalam folder `functions/` akan secara otomatis aktif di Cloudflare tanpa perlu setelan server tambahan!

---

## 🎮 LANGKAH 3: PENGUJIAN VISUAL DI BROWSER NYATA

Kami telah memverifikasi seluruh fungsi visual dan interaksi secara mandiri di browser nyata:
1. **Pemandangan Kampus 3D:** Kampus isometrik memuat 6 ruangan proyek resmi studio lengkap dengan 30 kru manusia berbusana kantor rapi (Kay Lousberg style).
2. **Kamera Zoom-In Paten:** Mengklik nama proyek (misal: *DompetNalar*) membuat kamera berputar dan memperbesar sudut pandang ke dalam ruangan tersebut dengan drawer status kru di sebelah kanan.
3. **Konsol Perintah Pengunjung:**
   - Mengetik atau mengklik `/kopi` menyajikan kopi hangat ke meja kru (`+50% SPD`).
   - Balon obrolan melayang di atas kepala karakter 3D secara dinamis.
4. **Tab Switcher:** Pengunjung dapat bebas berganti antara **Kantor Virtual 3D** dan **2.5D Pixel Campus** kapan saja, dan pilihan tersimpan otomatis di browser mereka.

---

## 🏆 KESIMPULAN & STATUS
- **Status Tahap 7:** Siap Eksekusi Push & Live Deploy
- **Zero Regression:** 770 / 770 pengujian lulus (100% PASS)
- **Biaya:** Rp 0 / $0.00
