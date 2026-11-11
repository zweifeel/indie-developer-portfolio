# Walkthrough: Tahap 10 — Pengawasan Harian 14 Hari Closed Testing Mobile Kasir & 6 Formulir Evaluasi Akses Produksi Google Play Console

## 📌 Ringkasan Pekerjaan Selesai

Tahap 10 sesuai `ROADMAP.md` telah diselesaikan secara tuntas 100% End-to-End dengan arsitektur 3-Lapis (Data-First -> Logic -> UI-Last):
1. **Pengawasan Harian 14 Hari Closed Testing Mobile Kasir:**
   - Kalender timeline 14 hari interaktif (Hari ke-1 s/d Hari ke-14).
   - Input metrik Vitals harian: Jumlah tester aktif (batas min. 20), crash-free rate % (batas crash < 1.09%), ANR rate % (batas ANR < 0.47%), serta catatan temuan pengujian.
   - 4 Checkpoint harian terverifikasi otomatis.
   - Penyimpanan lokal browser (*LocalStorage*) persisten.
2. **6 Formulir Evaluasi Jawaban Resmi Pengajuan Akses Produksi Google Play Console:**
   - 6 Pertanyaan wajib Google Play untuk akun developer perorangan lengkap dengan pertanyaan dwibahasa (ID & EN) dan catatan panduan reviewer.
   - Naskah jawaban resmi komprehensif berstandar industri siap salin 1-klik (*1-Click Copy*).
   - Tombol *Salin Semua 6 Jawaban Sekaligus (Markdown)* untuk kepraktisan pengisian di Google Play Console.
   - Mode penyuntingan (edit kustom) dan tombol kembalikan ke teks resmi.
3. **Inisialisasi Git Bersih Repositori `mobile-kasir`:**
   - `.gitignore` diproteksi dari file raksasa `gradle-9.3.1-bin.zip` (137 MB) dan file sensitif keystore/kredensial.
   - Git lokal diinisialisasi bersih di `E:\Antigravity Project\mobile-kasir`.
   - Remote resmi disetel ke `https://github.com/zweifeel/mobile-kasir.git`.

---

## 🏛️ Hasil Verifikasi 4 Pilar (Anti Fake-Pass)

| Parameter Uji | Standar Target | Hasil Pengujian Aktual | Status |
| :--- | :--- | :--- | :--- |
| **Pengujian Otomatis (Vitest)** | Seluruh suite lulus | **806 / 806 Lulus (100% PASS across 42 Test Suites)** | 🟢 **PASS** |
| **Kompilasi TypeScript & Build** | 0 error | **0 Error TypeScript, Build Selesai dalam 5.22s** | 🟢 **PASS** |
| **DevSecOps Secret Scan** | 0 rahasia bocor | **0 Actionable Secrets detected (2.539 file dipindai)** | 🟢 **PASS** |
| **DevSecOps Privacy Scan** | 0 PII bocor | **0 Unapproved PII detected (2.539 file dipindai)** | 🟢 **PASS** |
| **DevSecOps File Policy** | 100% patuh | **2.634 File Patuh Kebijakan (0 File Ditolak)** | 🟢 **PASS** |
| **Biaya Operasional** | Rp 0 / $0.00 | **Rp 0 / $0.00 (LocalStorage & Free React Components)** | 🟢 **PASS** |

---

## 📖 Panduan Penggunaan untuk Owner (Non-Coder Friendly)

### Cara Memantau Closed Testing Harian & Mengisi Metrik Vitals:
1. Jalankan aplikasi web lokal atau buka `https://sleepykoala.pages.dev/admin`.
2. Masuk ke tab **COMPLIANCE**.
3. Di bagian **Monitoring 14 Hari Closed Testing**:
   - Klik kartu hari yang ingin diperiksa (misalnya **Hari ke-2** untuk hari ini).
   - Di kartu **Checklist & Metrik Vitals**, masukkan:
     - Jumlah tester aktif di Google Play Console (misal `24`).
     - Crash-Free Rate % dari Android Vitals (misal `100.0%`).
     - ANR Rate % dari Android Vitals (misal `0.00%`).
     - Tuliskan catatan feedback penguji jika ada.
   - Klik tombol **Simpan Metrik Hari Ini**.
   - Centang 4 butir checkpoint jika seluruh pengujian hari itu telah terkonfirmasi. Hari tersebut akan otomatis berubah menjadi hijau (**Terverifikasi**).

### Cara Menyalin Jawaban untuk Pengajuan Akses Produksi (Setelah Hari ke-14):
1. Gulir ke bawah pada tab **COMPLIANCE** ke bagian **Formulir Evaluasi Jawaban Resmi Pengajuan Akses Produksi**.
2. Anda memiliki 2 opsi praktis:
   - **Opsi 1 (Salin Semua Sekaligus):** Klik tombol hijau besar **"Salin Semua 6 Jawaban Sekaligus (Markdown)"** di pojok kanan atas untuk menyalin seluruh naskah dokumen lengkap ke clipboard.
   - **Opsi 2 (Salin Per Pertanyaan):** Klik tombol **"Salin Jawaban"** pada masing-masing kartu pertanyaan (Pertanyaan 1 s/d 6) saat Anda mengisi kolom formulir di Google Play Console satu per satu.
