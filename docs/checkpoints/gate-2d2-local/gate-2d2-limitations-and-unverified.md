# SLEEPYKOALA CMS — KETERBATASAN & ITEM BELUM DIVERIFIKASI GATE 2D.2
## LIMITATIONS & UNVERIFIED ITEMS — LOCAL REMEDIATION ONLY

**Checkpoint ID:** `gate-2d2-local-20261101-v1`  
**Tanggal:** 2026-11-01  

---

## 1. BATASAN RUANG LINGKUP GATE 2D.2

1. **Local Only:** Seluruh perbaikan hanya dilakukan pada kode sumber lokal (`backend/test_gas/Code.gs`, `functions/api/projects.ts`, `functions/api/projects/[slug].ts`, `src/services/projectService.ts`, dan halaman UI).
2. **Tidak Ada Deployment:**
   - Tidak ada perintah `clasp push` ke Apps Script TEST (`12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg`).
   - Tidak ada pembuatan versi Apps Script baru (Deployment V5 tetap aktif).
   - Tidak ada perintah `wrangler pages deploy` ke Cloudflare Pages.
3. **Tidak Ada Mutasi Data Eksternal:**
   - Tidak ada data yang ditulis, diubah, atau dihapus pada Google Spreadsheet TEST (`1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4`).
   - Tidak ada berkas yang diunggah atau dihapus pada Google Drive TEST (`SleepyKoala_CMS_Media_TEST`).

---

## 2. ITEM YANG BELUM DAPAT DIVERIFIKASI SECARA LIVE

1. **Eksekusi Fisik Google Drive API v3:** Pengujian fungsi `cleanMediaReferencesFromProjects` dan `Drive.Files.remove` diverifikasi secara menyeluruh melalui unit test dan simulasi algoritma mock, belum dieksekusi secara live terhadap deployment backend TEST.
2. **Uji Jaringan Real-Time:** Runner pengujian Vitest tidak melakukan pemanggilan HTTP langsung melintasi internet ke Google Apps Script.
3. **Tinjauan Kuota Konsol GCP:** Parameter kuota numerik pada Google Cloud Console tetap berstatus `NOT VERIFIED VIA CONSOLE`.
