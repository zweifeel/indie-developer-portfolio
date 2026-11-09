# Panduan Integrasi Backend SleepyKoala (Milestone 2)

Dokumen ini memandu pemasangan dan pengaktifan backend pendaftaran closed testing untuk Google Play Console menggunakan arsitektur **100% Bebas Biaya (IDR 0 / bulan)**:
- **Database**: Google Sheets (Milik Akun Google Anda)
- **Logika & Otomasi**: Google Apps Script (Web App)
- **Notifikasi**: Gmail MailApp (Terkirim otomatis ke `zweifeel@gmail.com`)
- **Same-Origin Proxy**: Cloudflare Pages Functions (Project: `sleepykoala`)

---

## 1. Persiapan Google Sheets (Database)

1. Buka [Google Sheets](https://sheets.new) di browser Anda dengan akun Google Anda.
2. Beri nama spreadsheet:
   ```
   SleepyKoala — Closed Testing Database
   ```
3. Ubah nama tab (sheet pertama di bagian bawah) menjadi:
   ```
   TesterRegistrations
   ```
4. Salin ID Spreadsheet dari bilah URL browser Anda:
   - Format URL: `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
   - Simpan `<SPREADSHEET_ID>` ini untuk dimasukkan ke Apps Script di Langkah 2.

> **Catatan Header**: Kolom header akan dibuat dan diformat secara otomatis oleh script saat pendaftaran pertama atau saat fungsi uji mandiri dijalankan.

---

## 2. Pemasangan Google Apps Script (Web App)

1. Di dalam spreadsheet yang baru dibuat, buka menu:
   **Ekstensi (Extensions)** &rarr; **Apps Script**.
2. Beri nama proyek Apps Script:
   ```
   SleepyKoala Backend API
   ```
3. Buka file `Code.gs` di editor Apps Script, hapus kode bawaan, dan salin seluruh isi file lokal:
   [`backend/gas/Code.gs`](file:///e:/Antigravity%20Project/indie-developer-portfolio/backend/gas/Code.gs)
4. Buka **Setelan Proyek (Project Settings)** (ikon roda gigi di menu samping kiri):
   - Centang opsi: **Tampilkan file manifes "appsscript.json" di editor**.
   - Kembali ke Editor &rarr; buka file `appsscript.json`.
   - Ganti isinya dengan isi file lokal:
     [`backend/gas/appsscript.json`](file:///e:/Antigravity%20Project/indie-developer-portfolio/backend/gas/appsscript.json)
5. Masih di **Setelan Proyek (Project Settings)** &rarr; gulir ke bagian **Properti Script (Script Properties)**:
   - Klik **Tambahkan properti script (Add script property)** dan tambahkan 3 variabel berikut:

| Properti (Property) | Nilai (Value) | Keterangan |
| :--- | :--- | :--- |
| `APPS_SCRIPT_SECRET` | *(Buat passphrase acak, mis: `sk_sec_789432_test`)* | Token handshake rahasia antara Cloudflare & Apps Script |
| `NOTIFICATION_EMAIL` | `zweifeel@gmail.com` | Email tujuan notifikasi pendaftar baru |
| `SPREADSHEET_ID` | *(ID Spreadsheet dari Langkah 1)* | ID Google Sheets target penyimpanan |

6. **Uji Coba & Otorisasi Izin**:
   - Kembali ke file `Code.gs`.
   - Pada dropdown fungsi di bilah atas, pilih fungsi: `testSetupAndPermissions`.
   - Klik tombol **Jalankan (Run)**.
   - Google akan menampilkan jendela persetujuan izin (OAuth):
     - Pilih akun Google Anda (`zweifeel@gmail.com`).
     - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced (Lanjutan)** &rarr; klik **Go to SleepyKoala Backend API (unsafe)**.
     - Klik **Allow (Izinkan)** untuk memberikan akses Sheets dan pengiriman email MailApp.
   - Periksa tab Log Eksekusi. Jika tertulis *"Uji Mandiri Selesai — Backend Siap Digunakan"*, spreadsheet Anda telah terhubung dan baris header telah dibuat.

7. **Deploy sebagai Web App**:
   - Di pojok kanan atas, klik tombol **Terapkan (Deploy)** &rarr; pilih **Penerapan baru (New deployment)**.
   - Klik ikon roda gigi di sebelah kiri *Select type* &rarr; pilih **Aplikasi web (Web app)**.
   - Atur setelan deployment persis seperti berikut:
     - **Deskripsi**: `SleepyKoala Closed Testing v1.0`
     - **Jalankan sebagai (Execute as)**: `Saya (email Anda)`
     - **Siapa yang memiliki akses (Who has access)**: `Siapa saja (Anyone)` *(Wajib agar proxy Cloudflare dapat meneruskan request)*.
   - Klik **Terapkan (Deploy)**.
   - Salin **URL Aplikasi Web (Web App URL)** yang dihasilkan. Formatnya:
     ```
     https://script.google.com/macros/s/AKfycb.../exec
     ```
   - Simpan URL ini untuk Langkah 3.

---

## 3. Konfigurasi Cloudflare Pages

> [!IMPORTANT]
> **Pemisahan Proyek Cloudflare**:
> Akun Cloudflare Anda saat ini digunakan untuk proyek *The Broken Origin (TBO)*.
> Proyek SleepyKoala dibuat **sepenuhnya terpisah** dengan nama proyek: `sleepykoala`. Proyek TBO tidak akan disentuh atau terpengaruh.

### A. Jika Menggunakan Cloudflare Dashboard (Metode Resmi & Direkomendasikan)

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com) &rarr; masuk ke menu **Workers & Pages**.
2. Klik **Create application** &rarr; pilih tab **Pages** &rarr; pilih **Connect to Git** (atau *Upload assets*).
3. Beri nama proyek:
   ```
   sleepykoala
   ```
4. Pada setelan Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Masuk ke **Project Settings** &rarr; **Environment variables**:
   - Tambahkan 2 variabel rahasia (Enkripsi / Encrypt):

| Variable Name | Environment | Value |
| :--- | :--- | :--- |
| `GAS_WEBAPP_URL` | Production & Preview | `https://script.google.com/macros/s/AKfycb.../exec` *(URL dari Langkah 2)* |
| `APPS_SCRIPT_SECRET` | Production & Preview | *(Passphrase yang Anda masukkan di Script Properties)* |

6. Simpan konfigurasi. Cloudflare Pages Functions akan secara otomatis memproses file [`functions/api/register-tester.ts`](file:///e:/Antigravity%20Project/indie-developer-portfolio/functions/api/register-tester.ts) sebagai same-origin proxy di rute `/api/register-tester`.

---

## 4. Keamanan & Batasan Operasional Bebas Biaya

1. **Non-Atomic Transaction Handling**:
   - Penyimpanan data pendaftaran ke Google Sheets dan pengiriman notifikasi email ke Gmail Anda bukan transaksi atomik database ACID.
   - Script dirancang untuk mengutamakan keselamatan data penguji: baris data disimpan terlebih dahulu di Google Sheets. Jika kuota harian Gmail MailApp habis (100 email/hari untuk akun Google gratis), status email akan dicatat di kolom *Notes*, namun data tester **tidak akan pernah hilang**.
2. **Perlindungan Spam**:
   - **Honeypot Field**: Form memuat field tersembunyi untuk mengecoh bot.
   - **Size Limit**: Payload dibatasi maksimal 50 KB.
   - **Duplicate Detection**: Pendaftaran dengan kombinasi *Project ID* dan *Email* yang sama tidak akan dimasukkan ganda dan tidak memicu email spam ke inbox Anda.
3. **Kepatuhan Privasi**:
   - Alamat IP pengguna dimasking (misal: `180.252.xxx.xxx`) sebelum disimpan untuk melindungi privasi pendaftar.
   - Data email hanya digunakan untuk mengundang akun ke program Google Play Console Closed Testing.
4. **Mekanisme Autentikasi Handshake (`APPS_SCRIPT_SECRET`)**:
   - Google Apps Script Web App `doPost(e)` tidak mengekspos custom HTTP headers (`e.headers`). Oleh karena itu, autentikasi handshake dilakukan secara aman melalui properti `payload.secretToken` di dalam JSON request body menggunakan protokol HTTPS terenkripsi.
   - Cloudflare Pages Functions menyuntikkan `secretToken` ini di sisi server dari Environment Secret sebelum meneruskan request ke Apps Script Web App.
   - Jika `secretToken` kosong, tidak tersedia, atau tidak cocok dengan `APPS_SCRIPT_SECRET` di Script Properties, Apps Script akan langsung menolak request dengan status `UNAUTHORIZED`.
   - Nilai secret tidak pernah dicatat ke log eksekusi maupun dikembalikan dalam respons error.
