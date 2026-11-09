# SLEEPYKOALA CMS — FAILURE RECOVERY & INCIDENT PLAYBOOK

## 1. PENDAHULUAN

Dokumen ini menguraikan strategi pemulihan kegagalan (failure recovery) dan mitigasi risiko operasional pada sistem integrasi CMS dan halaman detail proyek SleepyKoala Studio.

---

## 2. SKENARIO KEGAGALAN & STRATEGI PENANGANAN

### Skenario 1: Google Apps Script Upstream Down / Timeout (HTTP 502/503)
- **Dampak:** Cloudflare Pages Functions tidak dapat membaca/menulis ke Google Sheets `CMS_Progress`.
- **Perilaku Public Endpoint:**
  - Menghasilkan respons **HTTP 503 Service Unavailable** (`UPSTREAM_UNAVAILABLE`) dengan header `Cache-Control: no-store, no-cache, must-revalidate`.
  - **Prinsip Fail-Closed:** Sistem TIDAK PERNAH menyajikan fallback statis yang berpotensi menyajikan data kadaluwarsa atau membocorkan draft.
- **Perilaku Admin Endpoint:**
  - Menampilkan banner peringatan di Web Admin bahwa sinkronisasi cloud terhambat.
  - Perubahan disimpan di cache lokal dengan status `PENDING_SYNC`.
- **Prosedur Pemulihan:**
  1. Periksa status Google Apps Script dashboard.
  2. Verifikasi kuota eksekusi Google Workspace.
  3. Tekan tombol "Coba Lagi" pada Web Admin setelah koneksi upstream pulih.

---

### Skenario 2: Korupsi Data atau Payload Schema Tidak Valid
- **Dampak:** Dokumen kemajuan memiliki struktur rusak atau tipe data yang tidak sesuai.
- **Pencegahan:**
  - `validateProjectProgressDocument()` memvalidasi payload sebelum disimpan.
  - Jika `schemaVersion === 1`, sistem otomatis menjalankan migrasi ke v2 melalui `migrateLegacyProgressDocument()`.
  - Jika payload rusak parah, operasi ditolak dengan status **HTTP 400 Bad Request** (`INVALID_PROGRESS_PAYLOAD`).
- **Prosedur Pemulihan:**
  1. Buka sheet `CMS_Progress` di Google Sheets.
  2. Gunakan Version History Google Sheets untuk me-restore versi payload JSON sebelum korupsi terjadi.

---

### Skenario 3: Upaya Publikasi Konten Belum Terverifikasi
- **Dampak:** Pengguna admin mencoba mempublikasikan screenshot mockup atau belum tersanitasi.
- **Pencegahan:**
  - FSM publikasi memblokir transisi jika `verifiedRealApp !== true` atau `sanitized !== true`.
  - Error ditampilkan di antarmuka Web Admin: *"Tangkapan layar harus berasal dari build asli dan lolos sanitasi privasi."*
- **Prosedur Pemulihan:**
  - Reviewer melengkapi verifikasi dan sanitasi gambar di menu screenshot manager, kemudian menandai checkbox konfirmasi sebelum mempublikasikan ulang.

---

### Skenario 4: Konflik Pengeditan Bersamaan (Concurrent Edits)
- **Dampak:** Dua tab admin mengubah dokumen progres proyek yang sama pada saat bersamaan.
- **Mitigasi:**
  - Menggunakan field `updatedAt` sebagai penanda versi optimistik (optimistic timestamping).
  - Mutasi parsial dilakukan secara atomik per entitas (milestone/fitur/screenshot).
- **Prosedur Pemulihan:**
  - Refresh data proyek di Web Admin sebelum menyimpan perubahan baru.
