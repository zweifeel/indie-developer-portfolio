# SLEEPYKOALA CMS — GATE 2B KNOWN LIMITATIONS & PREREQUISITES

Dokumen ini mendokumentasikan batasan teknis yang diketahui pada implementasi Gate 2B Local serta prasyarat sebelum melangkah ke integrasi Google Drive langsung (Live Phase).

---

## 1. Batasan Teknis Gate 2B Local

1. **Storage Bersifat In-Memory / Simulasi Mock:**
   - Dalam lingkungan pengujian lokal, `MockMediaStorageProvider` menyimpan berkas biner dalam memori RAM proses. Berkas akan hilang saat proses runner berhenti.
   - Hal ini sengaja dirancang untuk memenuhi batasan mutlak bahwa **tidak ada akses ke Google Drive nyata** selama tahap Gate 2B Local.

2. **Apps Script Method Calling Google Drive:**
   - Metode `Drive.Files.remove(fileId)` digunakan dalam arsitektur karena metode `delete` adalah kata kunci reserved pada bahasa JavaScript V8.
   - Panggilan ini hanya akan aktif saat Google Drive API v3 Advanced Service diaktifkan di Apps Script test pada Gate 2B Fase D/E.

3. **Maksimal Ukuran Berkas 2.0 MB:**
   - Dibatasi secara ketat pada 2.0 MB untuk menghindari batas transient heap memory Apps Script (~100 MB).
   - Video, GIF animasi, dan berkas format vektor (SVG) tidak didukung dalam CMS ini.

4. **Ketergantungan pada Root Folder ID:**
   - Scope OAuth `drive.file` hanya mengizinkan aplikasi membaca dan mengelola berkas yang dibuat oleh aplikasi itu sendiri.
   - Folder CMS root harus dibuat oleh skrip aplikasi melalui `Drive.Files.create()` atau disimpan ID-nya pada `ScriptProperties.setProperty("MEDIA_FOLDER_ID", ...)`.

---

## 2. Prasyarat Sebelum Melanjutkan ke Live Integration (Gate 2B Fase D/E)

Sebelum izin live integration diberikan oleh pengguna, langkah-langkah berikut wajib diverifikasi secara terpisah:

1. **Persetujuan Eksplisit Pengguna:**
   - Agen **dilarang keras** melakukan live clasp push atau mengaktifkan Google Drive API tanpa prompt persetujuan eksplisit.
2. **Aktivasi Google Drive API pada Cloud Project Apps Script:**
   - Pada Google Cloud Console yang terhubung ke Apps Script test project (`SleepyKoala_Test_Database`), pastikan Google Drive API v3 telah di-enable.
3. **Inisialisasi Folder Root CMS Test:**
   - Menjalankan fungsi bootstrap satu kali pada test backend untuk membuat folder induk `SleepyKoala_CMS_Media_Test` dan menyimpan ID-nya ke `ScriptProperties`.
4. **Validasi OAuth Consent Screen Test:**
   - Memastikan akun pengembang terdaftar sebagai Test User pada OAuth Consent Screen internal Google Cloud Console untuk menghindari layar verifikasi yang memblokir.
