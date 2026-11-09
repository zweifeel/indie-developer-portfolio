# SLEEPYKOALA CMS — RINGKASAN ARSITEKTUR GATE 2D.2
## FAIL-CLOSED PRIVACY & REFERENTIAL INTEGRITY ARCHITECTURE

**Checkpoint ID:** `gate-2d2-local-20261101-v1`  
**Tanggal:** 2026-11-01  

---

## 1. ARSITEKTUR FAIL-CLOSED UNTUK ENDPOINT PUBLIK (FINDING-2D1-01)

Sebelum Gate 2D.2, ketika Google Apps Script mengalami *timeout*, error 502/503, atau respon tidak valid, Cloudflare Pages Functions membaca `projects.json` dan memaksakan status `publishState: 'PUBLISHED'`. Hal ini melanggar privasi jika admin sebelumnya telah mengubah salah satu proyek baseline menjadi `DRAFT` atau `ARCHIVED`.

### Arsitektur Baru:
1. **Penghapusan Total Fallback Statis:** Berkas `projects.json` tidak lagi diimpor atau dijadikan fallback pada `functions/api/projects.ts` maupun `functions/api/projects/[slug].ts`.
2. **Respon Fail-Closed:**
   - **Katalog (`/api/projects`):** Jika upstream gagal, mengembalikan HTTP 503 *Service Unavailable* dengan payload `{ success: false, error: 'SERVICE_UNAVAILABLE', message: '...' }` dan header `Cache-Control: no-store, no-cache, must-revalidate`.
   - **Detail Slug (`/api/projects/:slug`):** Jika upstream gagal, mengembalikan HTTP 503. Jika upstream normal tetapi slug tidak ada atau berstatus `DRAFT`/`ARCHIVED`, mengembalikan HTTP 404 *Not Found*.
3. **Penyajian Frontend yang Jujur:**
   - Hook `useProjects()` membedakan antara backend yang tidak tersedia (`isUnavailable: true`), katalog yang sah kosong (`allProjects.length === 0`), dan filter pencarian yang tidak cocok.
   - Halaman publik menampilkan pesan gangguan sementara disertai tombol "Coba Lagi", tanpa merender data lama atau data palsu.

---

## 2. ARSITEKTUR INTEGRITAS REFERENSIAL MEDIA (FINDING-2D1-03)

Sebelum Gate 2D.2, penghapusan permanen media (`handleAdminDeleteMedia` dengan `permanent: true`) hanya menghapus baris di `CMS_Media` dan berkas di Google Drive, meninggalkan referensi string di kolom `screenshots` JSON pada sheet `CMS_Projects`.

### Arsitektur Baru:
1. **Locking & Concurrency:** Memanfaatkan `LockService.getScriptLock().tryLock(10000)` untuk mencegah modifikasi konkruen.
2. **Urutan Operasi yang Aman (Dual-Phase Cleanup):**
   - **Fase 1 (Pembersihan Referensi Proyek):** Fungsi `cleanMediaReferencesFromProjects` memeriksa seluruh proyek di `CMS_Projects`. Memvalidasi kolom `screenshots` JSON, `iconUrl`, dan `featureGraphicUrl`. Menghapus elemen yang cocok dengan `mediaId` dan memperbarui baris sheet proyek.
   - **Fase 2 (Penghapusan Media Record):** Baris dihapus dari sheet `CMS_Media`.
   - **Fase 3 (Penghapusan Fisik Drive):** Berkas dihapus dari Google Drive menggunakan `Drive.Files.remove` dengan retry berbatas.
   - **Fase 4 (Audit Trail):** Operasi dicatat secara mendalam di `CMS_AuditLogs`, memuat jumlah dan ID proyek yang berhasil dibersihkan serta status penghapusan file Drive.
3. **Idempotensi & Penanganan Parsial:**
   - Jika media telah dihapus sebelumnya namun permintaan diulang, sistem tetap memverifikasi `CMS_Projects` dan mengembalikan respons sukses idempoten tanpa menimbulkan error data.
   - Toleran terhadap format JSON `screenshots` yang rusak (di-parse secara aman dan dinormalisasi menjadi array kosong).
