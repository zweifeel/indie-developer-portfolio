# SLEEPYKOALA CMS — GATE 2B SECURITY AUDIT REPORT

Laporan audit keamanan pasca-implementasi Gate 2B Local.

---

## 1. Lingkup & Metodologi Audit
Audit ini mencakup:
- Seluruh endpoint API baru (`/api/admin/media`, `/api/admin/media/:mediaId`, `/api/media/:mediaId`)
- Komponen backend Apps Script (`Code.gs` handler media)
- Utilitas validasi berkas (`fileValidation.ts`)
- Antarmuka UI dashboard admin (`AdminPage.tsx`)
- Model ancaman STRIDE, OWASP Top 10 API, dan batasan operasional Google Cloud.

---

## 2. Analisis Model Ancaman STRIDE & Mitigasi

### A. Spoofing (Pemalsuan Identitas)
- **Risiko:** Penyerang mencoba mengunggah atau mengubah media tanpa autentikasi admin.
- **Mitigasi:**
  - Setiap endpoint admin (`/api/admin/media`, `/api/admin/media/:mediaId`) mewajibkan cookie sesi `sk_admin_session` yang ditandatangani HMAC-SHA256 dengan secret aman.
  - Sesi memeriksa email yang terotorisasi (`zweifeel@gmail.com`) dan nomor versi sesi aktif.
  - Komunikasi antara Cloudflare Pages Functions dan Google Apps Script dilindungi tanda tangan M2M HMAC-SHA256 dengan timestamp (toleransi 5 menit) dan nonce acak untuk mencegah replay attacks.
- **Status:** **PASS**

### B. Tampering (Manipulasi Data & File Injection)
- **Risiko:** Penyerang menyamarkan payload berbahaya (skrip SVG, shell, payload biner korup) sebagai berkas gambar valid.
- **Mitigasi:**
  - Verifikasi biner melalui magic bytes (byte 0-11) memverifikasi tanda tangan fisik WebP, PNG, dan JPEG.
  - Berkas SVG (`image/svg+xml`) dan dokumen HTML (`text/html`) dilarang keras dan langsung memicu pengecualian keamanan `FORBIDDEN_FORMAT` untuk mencegah Stored XSS.
  - Sanitasi nama berkas menghapus karakter path traversal (`../`, `..\`), karakter direktori (`/`, `\`), null bytes, dan mengompresi karakter berbahaya menjadi underscore.
- **Status:** **PASS**

### C. Repudiation (Penyangkalan Tindakan)
- **Risiko:** Admin atau aktor jahat menyangkal aktivitas upload atau penghapusan media.
- **Mitigasi:**
  - Setiap operasi mutasi media dicatat secara permanen di sheet `CMS_AuditLogs` mencakup `timestamp` (WIB), `action` (UPLOAD_MEDIA, UPDATE_MEDIA_STATUS, DELETE_MEDIA), `targetId` (`mediaId`), `adminEmail`, masked `clientIp`, dan rincian parameter JSON.
- **Status:** **PASS**

### D. Information Disclosure (Kebocoran Data Privat & Asset Enumeration)
- **Risiko:** Pengguna publik mengakses aset draf/arsip atau mengeksplorasi ID media yang belum dirilis melalui tebakan ID (IDOR / Resource Enumeration).
- **Mitigasi:**
  - Otorisasi Relasional Ganda pada endpoint publik: Hanya mengizinkan akses jika media `PUBLISHED` DAN proyek induk `PUBLISHED`.
  - Jika media masih draf, diarsipkan, atau proyek induk belum rilis publik, endpoint mengembalikan respons `404 Not Found` (bukan 403 Forbidden), sehingga pihak luar tidak dapat membedakan antara media yang tidak ada dan media yang masih berstatus draf.
  - Admin Preview (`/api/admin/media/:mediaId`) menetapkan header `Cache-Control: private, no-store, no-cache, must-revalidate` untuk mencegah edge caching pada CDN publik Cloudflare.
- **Status:** **PASS**

### E. Denial of Service (Exhaustion of Quota & Memory Crash)
- **Risiko:** Berkas berukuran sangat besar menghabiskan transient heap memory V8 Apps Script atau kuota Google Drive.
- **Mitigasi:**
  - Batas biner 2.0 MB diterapkan berlapis di client-side (`cmsMediaService.ts`), di edge proxy Cloudflare Functions (`content-length` check & base64 string length check), dan di backend Apps Script (`bytes.length > MAX_BINARY_SIZE`).
  - Berkas 2.0 MB hanya mengonsumsi ~18-24 MB transient heap, jauh di bawah batas 100 MB Apps Script V8.
  - Deduplikasi SHA-256 mencegah upload ganda atas gambar yang sama.
- **Status:** **PASS**

### F. Elevation of Privilege (Bypass Otorisasi)
- **Risiko:** Manipulasi hak akses publik atau manipulasi status visibilitas media.
- **Mitigasi:**
  - Perubahan status visibilitas media hanya dapat dilakukan melalui endpoint admin `PUT /api/admin/media` yang memvalidasi CSRF `X-SleepyKoala-Admin: 1` dan sesi admin aktif.
- **Status:** **PASS**

---

## 3. Matriks Hasil Audit Keamanan

| Kategori Pengujian | Parameter Verifikasi | Status | Catatan |
|:---|:---|:---:|:---|
| CSRF Protection | Validasi header `X-SleepyKoala-Admin: 1` pada POST, PUT, DELETE | **PASS** | Permintaan mutasi tanpa header ditolak HTTP 403 |
| MIME Spoofing | Header magic bytes vs deklarasi MIME | **PASS** | Spoofing terdeteksi dan dibatalkan sebelum storage |
| Stored XSS | Penolakan berkas SVG dan HTML | **PASS** | SVG dan HTML ditolak mutlak (fail-closed) |
| IDOR / Enumeration | Pemeriksaan relasi proyek-media pada endpoint publik | **PASS** | Mengembalikan 404 pada proyek draf/arsip |
| Cache Leaks | Header cache-control endpoint admin preview | **PASS** | `private, no-store, no-cache, must-revalidate` |
| Edge Caching | Header cache-control endpoint publik | **PASS** | `public, max-age=86400` + ETag validation |
| Memory Safety | Ukuran payload biner <= 2.0 MB | **PASS** | Divalidasi di 3 layer arsitektural |
| Atomic Rollback | Kompensasi penghapusan berkas saat penulisan metadata gagal | **PASS** | Teruji via fault injection pada mock provider |
| Zero Drive Exposure | Proteksi fail-closed adapter Google Drive | **PASS** | Throws `LIVE_DRIVE_DISABLED_IN_LOCAL_GATE_2B` |
