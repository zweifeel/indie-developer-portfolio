# SLEEPYKOALA CMS — GATE 2B ARCHITECTURE SUMMARY

Dokumen ini menguraikan arsitektur penyimpanan media CMS SleepyKoala yang diimplementasikan pada Gate 2B.

---

## 1. Diagram Aliran Data & Interaksi Komponen

```
[ Browser Admin / Public Client ]
           │
           │ HTTPS
           ▼
[ Cloudflare Pages Functions Edge ]
   ├── /api/admin/media          (Admin CRUD + CSRF + Session Auth)
   ├── /api/admin/media/:mediaId (Admin Preview: private, no-store)
   └── /api/media/:mediaId       (Public Proxy: Relational Auth Guard + ETag)
           │
           │ M2M HMAC-SHA256 Signed Payload
           ▼
[ Google Apps Script Test Backend (Code.gs) ]
   ├── LockService (Konkurensi Mutasi Media)
   ├── Sheets: CMS_Media & CMS_Projects (Metadata & Relasi)
   └── Storage Adapter Interface:
         ├── [MockMediaStorageProvider]        <-- Digunakan saat Gate 2B Lokal
         └── [GoogleDriveMediaStorageProvider] <-- Siap untuk Gate 2B Fase D/E (Live)
```

---

## 2. Fitur Arsitektural Utama

### A. Format & Validasi Berkas Ketat
- **Format yang Diizinkan:** WebP (`image/webp`), PNG (`image/png`), JPEG (`image/jpeg`).
- **Penolakan SVG & HTML:** Format vektor SVG dan berkas HTML ditolak secara mutlak untuk mencegah kerentanan Stored Cross-Site Scripting (XSS).
- **Magic Bytes Verification:** Ekstensi berkas tidak dipercaya secara mentah. Header byte biner wajib memvalidasi tanda pengenal asli (`RIFF....WEBP`, `\x89PNG`, `\xFF\xD8\xFF....\xFF\xD9`).
- **Sanitasi Nama Berkas:** Menghilangkan karakter direktori traversal (`../`, `..\`), karakter kontrol, null bytes, dan membatasi panjang nama menjadi <= 50 karakter alfanumerik.
- **Batas Ukuran Maksimal:** 2.0 MB biner (~2.8 MB Base64 string). Ukuran ini aman di bawah batas heap memori V8 Apps Script (~100 MB) yang hanya mengonsumsi 18–24 MB transient heap.

### B. Deduplikasi Kriptografis SHA-256
- Setiap berkas dihitung hash SHA-256 64-karakter heksadesimal sebelum disimpan.
- Jika berkas dengan hash identik sudah ada di sheet `CMS_Media`, backend langsung mengembalikan entri media yang sudah ada tanpa melakukan penyimpanan ulang ke storage fisik.
- Menghemat kapasitas Google Drive dan memangkas kuota I/O.

### C. Mekanisme Kompensasi Dual-Phase Rollback
- Tahap 1: Penyimpanan berkas biner ke storage.
- Tahap 2: Penulisan catatan metadata ke Google Sheets `CMS_Media`.
- Jika penulisan Google Sheets gagal atau terjadi exception:
  1. Kompensasi instan: Memanggil `Drive.Files.remove(fileId)` / `deleteFile(fileId)` untuk menghapus berkas yatim (orphan).
  2. Scheduled Reconciliation Sweeper (`ADMIN_RECONCILE_ORPHANS`): Mengecek storage provider secara berkala dan membandingkan dengan metadata sheet `CMS_Media`, menghapus berkas yatim yang tidak terdaftar.

### D. Otorisasi Relasional Publik Fail-Closed
- Endpoint publik `/api/media/:mediaId` menerapkan verifikasi dua arah:
  1. Status media dalam tabel `CMS_Media` wajib bernilai `PUBLISHED`.
  2. Proyek induk (`projectId`) dalam tabel `CMS_Projects` wajib bernilai `PUBLISHED`.
- Jika salah satu kondisi tidak terpenuhi (misal proyek masih berstatus `DRAFT` atau `ARCHIVED`), endpoint mengembalikan respons `404 Not Found` (bukan 403) untuk mencegah enumerasi aset privat oleh pihak luar.

### E. Strategi Caching Berjenjang
- **Admin Preview (`/api/admin/media/:mediaId`):** `Cache-Control: private, no-store, no-cache, must-revalidate` untuk menjamin aset draft tidak pernah tersimpan di cache CDN publik.
- **Public Serving (`/api/media/:mediaId`):** `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400` dengan header `ETag` ("<sha256>"). Mendukung respons `304 Not Modified` saat browser mengirimkan header `If-None-Match`.
- **Header Keamanan Tambahan:** `X-Content-Type-Options: nosniff` disertakan pada seluruh respons media untuk mencegah browser melakukan MIME sniffing.
