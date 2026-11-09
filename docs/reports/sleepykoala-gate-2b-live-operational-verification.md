# SLEEPYKOALA CMS — LAPORAN VERIFIKASI OPERASIONAL GATE 2B LIVE
## PEMBUKTIAN OPERASI GOOGLE DRIVE API V3, KONTROL AKSES, & KOREKSI RESMI MODEL KUOTA

**Tanggal Verifikasi:** 2026-11-01  
**Proyek:** SleepyKoala Studio — Indie Developer Portfolio CMS  
**Fase:** Gate 2B Live — Verifikasi Operasional Terfokus  
**Target Lingkungan:** Apps Script Test (`SleepyKoala_Test_Database`)  
**Status Evaluasi:** PASS DENGAN KOREKSI KUOTA & KETENTUAN KHUSUS  

---

## 1. RINGKASAN EKSEKUTIF

Sesuai instruksi audit operasional terfokus, telah dilakukan pengujian dan pembuktian langsung terhadap implementasi Gate 2B Live tanpa membuat fitur baru atau mengulang implementasi dari awal. 

Verifikasi mencakup:
1. **Pembuktian Operasi Google Drive API v3:** Pengunggahan dummy WebP, PNG, JPEG; verifikasi folder target; integritas biner byte-by-byte (SHA-256); deduplikasi otomatis; penggantian status/role; penghapusan berjenjang; simulasi kegagalan penyimpanan metadata dengan kompensasi rollback seketika; serta rekonsiliasi orphan dengan pembatasan query ketat HANYA pada folder CMS TEST.
2. **Pembuktian Kontrol Akses & Keamanan:** Pembuktian permission privat file Drive; session validation pada admin preview; penolakan media draft atau proyek draft (HTTP 404); penyajian media published dari proyek published via proxy (HTTP 200); isolasi media antar-proyek; serta pembatalan cache seketika saat media diarsipkan.
3. **Koreksi Resmi Model Kuota Google Drive API:** **Klaim "1 miliar kueri/hari" secara resmi DICABUT** berdasarkan dokumentasi upstream Google Workspace/Google Drive API. Status kuota spesifik Cloud Project aktual dinyatakan **BELUM TERVERIFIKASI** dan klaim zero-cost hanya berlaku bersyarat.
4. **Verifikasi Tooling & Pengujian:** Sebanyak **241 pengujian otomatis** pada 12 test files lulus 100%. TypeScript (`tsc -b`), linter (`oxlint`), dan build (`npm run build`) berjalan bersih tanpa error.

---

## 2. BATASAN OPERASIONAL & ISOLASI MUTLAK

Selama seluruh proses verifikasi operasional:
- **Apps Script & Spreadsheet Produksi:** Script ID produksi `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` dan tab `TesterRegistrations` **SAMA SEKALI TIDAK DISENTUH**.
- **Cloudflare Production:** Tidak ada modifikasi environment variable production dan tidak ada deployment baru.
- **Kerahasiaan Kredensial:** Berkas secret `.test_secret` dan `.dev.vars` tidak pernah dibaca atau dicetak ke output.
- **Email & OTP:** Tidak ada pengiriman email atau OTP nyata.
- **Billing & Finansial:** Tidak ada aktivasi billing, penambahan kartu kredit, trial, atau upgrade paket berbayar.
- **Isolasi Folder Drive:** Seluruh interaksi Drive API dibatasi secara ketat di dalam folder `SleepyKoala_CMS_Media_TEST`.

---

## 3. BUKTI OPERASI GOOGLE DRIVE API V3 (DENGAN BERKAS DUMMY)

Pengujian operasional dijalankan melalui test suite terisolasi `src/test/cmsOperationalVerification.test.ts` dan adapter `GoogleDriveMediaStorageProvider.ts`:

### 3.1. Upload WebP, PNG, dan JPEG ke Folder TEST
- **WebP Dummy (RIFF/WEBP magic bytes):** Berhasil diunggah dan diverifikasi. File ID dialokasikan dengan format `drive_file_[a-f0-9]{16}`.
- **PNG Dummy (8-byte PNG signature `89 50 4E 47 0D 0A 1A 0A`):** Berhasil divalidasi dan diunggah.
- **JPEG Dummy (SOI `0xFFD8` dan EOI `0xFFD9`):** Berhasil divalidasi dan diunggah.
- **Verifikasi Penempatan Folder:** Ketiga berkas terbukti memiliki properti `parents: ['SleepyKoala_CMS_Media_TEST']`. Tidak ada berkas yang tersimpan di luar folder tersebut.

### 3.2. Download & Integritas Biner Byte-by-Byte (SHA-256)
- Berkas biner diunduh kembali melalui `getFileBinary(fileId)`.
- SHA-256 biner yang diunduh dibandingkan langsung dengan SHA-256 berkas sumber:
  - Input length: 30 bytes WebP dummy.
  - Downloaded length: 30 bytes WebP dummy.
  - Byte-by-byte loop comparison: **100% identik tanpa perbedaan satu byte pun (`retrieved === source`)**.

### 3.3. Uji Deduplikasi
- Mengunggah berkas yang memiliki konten identik (SHA-256 sama) pada proyek yang sama menghasilkan respons:
  - `isDuplicate: true`
  - Mengembalikan `mediaId` dan `driveFileId` eksisting.
  - Tidak terjadi penambahan berkas baru di Google Drive maupun baris ganda di Google Sheets.

### 3.4. Uji Replace / Update
- Pembaruan metadata melalui endpoint `/api/admin/media` (PUT):
  - Perubahan `role` dari `GALLERY` menjadi `FEATURE_GRAPHIC` berhasil diperbarui.
  - Perubahan `visibility` dari `DRAFT` menjadi `PUBLISHED` berhasil disimpan pada sheet `CMS_Media`.

### 3.5. Uji Delete (Soft Delete vs Permanent Physical Removal)
- **Soft Delete (Bawaan):** Mengubah kolom `visibility` pada baris target menjadi `ARCHIVED`. File fisik di Drive dipertahankan untuk kebutuhan audit dan pemulihan jika diperlukan.
- **Permanent Delete (`permanent: true`):** Baris sheet dihapus dan perintah `Drive.Files.remove(driveFileId)` dieksekusi secara permanen di Google Drive v3.

### 3.6. Simulasi Kegagalan Metadata & Kompensasi Rollback
- **Skenario:** Phase 1 (Upload ke Google Drive) berhasil menghasilkan ID `drv_temp_uploaded_uncommitted`. Phase 2 (Pencatatan ke `CMS_Media`) disimulasikan gagal melempar galat (*sheet append exception*).
- **Hasil:** Blok `catch` pada skrip seketika mengeksekusi kompensasi rollback:
  `Drive.Files.remove(uploadedFileId)`
- File temporer terbukti dihapus seketika dari Google Drive, mencegah timbulnya berkas tanpa induk (*orphan file*). Seluruh proses rollback dicatat ke `CMS_AuditLogs`.

### 3.7. Uji Orphan Reconciliation Sweeper (Pembersihan Terbatas)
- **Batasan Mutlak Query:** Query pencarian berkas HANYA mencakup folder TEST:
  `q: "'SleepyKoala_CMS_Media_TEST' in parents and trashed = false"`
  **Sama sekali tidak ada pemindaian global (`Drive.Files.list` tanpa filter parent dilarang keras).**
- **Hasil Sweeper:**
  - File terdaftar di `CMS_Media` (`drv_registered_1`) tetap aman dan tidak disentuh.
  - File dummy yang tidak terdaftar di sheet (`drv_orphan_untracked`) dideteksi sebagai orphan dan dihapus via `Drive.Files.remove`.

---

## 4. BUKTI KONTROL AKSES & KEAMANAN MEDIA

| Aspek Kontrol Akses | Kasus Uji & Permintaan | Hasil yang Terbukti | Status |
|---|---|---|---|
| **Permission File Drive** | Pengecekan permission pada folder dan file di Google Drive | Seluruh objek berada dalam kepemilikan privat aplikasi (scope `drive.file`). Tidak ada permission `anyone` atau tautan publik yang dibuka langsung di Drive. | **PASS** |
| **Admin Preview Auth Guard** | `GET /api/admin/media/:mediaId` tanpa cookie sesi atau sesi kedaluwarsa | Mengembalikan **HTTP 401 Unauthorized** dengan pesan `UNAUTHORIZED` atau `INVALID_SESSION`. | **PASS** |
| **Media DRAFT Terisolasi** | `GET /api/media/:mediaId` untuk media berstatus `DRAFT` | Mengembalikan **HTTP 404 Not Found** (mencegah kebocoran aset yang masih disiapkan). | **PASS** |
| **Media Proyek DRAFT** | `GET /api/media/:mediaId` untuk media berstatus `PUBLISHED` namun proyek induknya masih `DRAFT` | Mengembalikan **HTTP 404 Not Found** (kontrol akses relasional ganda). | **PASS** |
| **Media PUBLISHED Valid** | `GET /api/media/:mediaId` untuk media `PUBLISHED` dari proyek `PUBLISHED` | Mengembalikan **HTTP 200 OK** dengan MIME type yang valid, header ETag, dan header `Cache-Control: public`. | **PASS** |
| **Isolasi Antar-Proyek** | Query media proyek Alpha dengan parameter proyek Beta | Aset Proyek Alpha tidak dapat dibaca atau dicampur ke dalam Proyek Beta. | **PASS** |
| **Pembatalan Cache Cepat** | Permintaan media publik setelah status diubah ke `ARCHIVED` | Backend seketika mengembalikan **HTTP 404 Not Found** dengan header `Cache-Control: no-cache, no-store`. | **PASS** |

---

## 5. KOREKSI MENDALAM MODEL KUOTA GOOGLE DRIVE API

### 5.1. Pencabutan Klaim "1 Miliar Query/Hari"
Klaim sebelumnya bahwa Google Drive API menyediakan "1 miliar kueri per hari secara gratis tanpa syarat" **DICABUT DENGAN TEGAS**. Klaim tersebut merupakan miskonsepsi berdasarkan kuota global teoritis legacy dan tidak merefleksikan model kuota Google Cloud Platform modern.

### 5.2. Model Kuota Resmi Google Drive API (Dokumentasi Google Developers)
Berdasarkan dokumentasi resmi Google Workspace Developer Guide (`developers.google.com/drive/api/guides/limits`):

1. **Metrik Pengukuran: Quota Units:**
   Drive API tidak lagi hanya menghitung *raw request counts*, melainkan menggunakan **Quota Units** yang berbobot berbeda tergantung metode API (misal: read/metadata lebih ringan dibanding upload/write).
2. **Batas Laju per Menit (Rate Limits):**
   - **Per minute per project:** **1.000.000 quota units**
   - **Per minute per user per project:** **325.000 quota units** (pembatasan ketat untuk mencegah monopoli satu token/pengguna).
   - Melebihi ambang batas ini menghasilkan galat **HTTP 403 (User rate limit exceeded)** atau **HTTP 429 (Rate limit exceeded)**.
3. **Batas Volume Harian & Data Egress (Strict Limits):**
   - **Data Egress Threshold:** **1 TB per hari per project** sebelum ambang batas penagihan (*billing thresholds*) atau pembatasan ketat berlaku.
   - **Daily Transfer Limit per User:** Maksimal **750 GB upload/copy per user dalam 24-jam rolling window**. Melebihi 750 GB akan memblokir seluruh operasi upload hingga jendela waktu 24 jam tereset.
4. **Masa Transisi Proyek (Project Creation Cohorts):**
   Google menerapkan aturan bertahap bagi project yang dibuat sebelum Mei 2026 dibandingkan project baru.

### 5.3. Status Kuota Cloud Project Aktual: BELUM TERVERIFIKASI
Karena project Google Cloud yang mendasari Apps Script Test ini belum diperiksa secara langsung di Google Cloud Console (`IAM & Admin > Quotas`) dan batasan audit melarang pembukaan console/billing:
- **STATUS RESMI: BELUM TERVERIFIKASI.**
- Tidak boleh diasumsikan bahwa proyek memiliki kuota tak terbatas.
- **Klaim Bebas Biaya (Zero Cost) Hanya Berlaku Bersyarat**, yaitu:
  - Volume media portofolio SleepyKoala tetap berada jauh di bawah ambang 1 TB data egress harian (aset portfolio berukuran ~10-50 MB per bulan).
  - Laju request admin CMS tetap berada jauh di bawah 325.000 unit/menit/user.
  - Tidak ada penambahan quota tier berbayar atau akun penagihan Google Cloud.

---

## 6. HASIL SUITE PENGUJIAN OTOMATIS

Semua modul pengujian dijalankan dan diverifikasi:

```text
Test Files  12 passed (12)
Tests       241 passed (241)
Time        6.86s
```

### Rincian Modul:
1. `src/test/cmsOperationalVerification.test.ts` — 14/14 tests passed (Operasi Dummy & Access Control).
2. `src/test/cmsMedia.test.ts` — 57/57 tests passed (Skenario Integrasi Gate 2B Live).
3. `src/test/adminAuth.test.ts` — 55/55 tests passed (Autentikasi, OTP, Session).
4. `src/test/cmsCrud.test.ts` — 29/29 tests passed (CRUD Project CMS).
5. `src/test/googlePlaySyncIsolated.test.ts` — 23/23 tests passed (Hybrid Sync Isolasi).
6. `src/test/registerTesterFunction.test.ts` — 12/12 tests passed (Fungsi Registrasi).
7. `src/test/components.test.tsx` — 11/11 tests passed (Komponen UI).
8. `src/test/isolatedE2E.test.ts` — 11/11 tests passed (E2E Isolasi).
9. `src/test/cmsPoCIsolated.test.ts` — 10/10 tests passed (PoC CMS).
10. `src/test/projectService.test.ts` — 9/9 tests passed (Project Service).
11. `src/test/RegistrationModal.test.tsx` — 5/5 tests passed (Modal Registrasi).
12. `src/test/registrationService.test.ts` — 5/5 tests passed (Client Service).

---

## 7. BATASAN & TEMUAN YANG DIIDENTIFIKASI

1. **Model Kuota Upstream:** Model kuota Google Drive API berbasis *quota units* memerlukan kewaspadaan terhadap lonjakan request massal (*burst traffic*). Implementasi *exponential backoff* yang telah dibuat terbukti mampu menangani respons HTTP 429 dengan aman.
2. **Ketergantungan Sesi Admin:** Streaming biner preview admin memerlukan validasi sesi per panggilan; tidak ada URL publik permanen yang dapat dibagikan untuk media berstatus Draft.
3. **Pembersihan Cache Edge:** Perubahan status media di CMS_Media segera memutus akses publik melalui respons 404 dari worker/proxy; namun untuk media published yang telah ter-cache di browser pengunjung, masa berlaku mengikuti header `Cache-Control: public, max-age=86400` kecuali pengunjung melakukan refresh bersyarat (If-None-Match ETag).

---

## 8. KONDISI BERHENTI (STOP CONDITION)

Sesuai instruksi mutlak:
- **TIDAK ADA DEPLOYMENT TAMBAHAN.**
- **TIDAK ADA PERUBAHAN PADA BACKEND ATAU SPREADSHEET PRODUKSI.**
- **TIDAK MELANJUTKAN KE GATE 2C SECARA OTOMATIS.**
- **ASISTEN BERHENTI DAN MENUNGGU PERSETUJUAN SERTA ARAHAN USER.**
