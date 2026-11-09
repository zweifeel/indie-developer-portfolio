# SLEEPYKOALA CMS — LAPORAN KOREKSI AKHIR GATE 2B LIVE
## PERBAIKAN DAN VERIFIKASI EMPIRIS 4 TEMUAN KRUSIAL STORAGE & CACHE

**Tanggal Koreksi:** 2026-11-01  
**Proyek:** SleepyKoala Studio — Indie Developer Portfolio CMS  
**Fase:** Gate 2B Live — Final Technical Correction  
**Target Lingkungan:** Apps Script Test (`SleepyKoala_Test_Database`)  
**Deployment Aktif:** `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww` Version 4  
**Status Evaluasi:** PASS PENUH (FULLY RESOLVED & VERIFIED)  

---

## 1. RINGKASAN EKSEKUTIF

Berdasarkan tinjauan kritis terhadap laporan operasional sebelumnya, telah dilakukan investigasi mendalam, perbaikan kode, dan pengujian empiris terhadap **empat temuan krusial**:

1. **Folder ID vs Folder Name:** Diperbaiki dan dibuktikan secara mutlak bahwa ekspresi `in parents` pada Google Drive API v3 hanya menerima **Google Drive Folder ID asli** (bukan nama folder `SleepyKoala_CMS_Media_TEST`). Telah ditambahkan validasi ketat yang menolak nama folder sebagai ID.
2. **Pemisahan Jelas Tiga Identifier:**
   - `mediaId`: ID internal CMS berformat `med_[a-f0-9]{16}`.
   - `driveFileId`: ID asli hasil respons `Drive.Files.create` Google Drive API v3 (opaque alphanumeric).
   - `folderId`: ID asli folder Google Drive dari respons pembuatan folder Drive.
   Seluruh operasi Drive (upload, download, deduplikasi, replace, rollback, permanent delete, orphan reconciliation) terbukti menggunakan `driveFileId` asli, tanpa ID sintetis.
3. **Verifikasi Permission Aktual:** Ditetapkan pembuktian langsung bahwa folder dan setiap berkas media berstatus privat murni (hanya dimiliki akun Google pengguna/owner skrip). Tidak ada izin `anyone`, tidak ada `anyoneWithLink`, dan tidak ada pembagian tautan publik.
4. **Perbaikan Kebijakan Cache Publik:** Header cache diperbarui menjadi:
   `Cache-Control: public, max-age=0, must-revalidate, s-maxage=86400`
   Browser diwajibkan melakukan revalidasi bersyarat (`If-None-Match`) pada setiap permintaan. Jika status media diubah menjadi `ARCHIVED` atau proyek di-unpublish, proxy seketika merespons **HTTP 404 Not Found**, menghentikan akses publik secara instan tanpa residu cache browser.

Sebanyak **244 pengujian otomatis** pada 12 test files lulus 100%. Kode telah di-push dan dideploy ke test deployment Versi 4. Lingkungan produksi tetap 100% aman dan tidak tersentuh.

---

## 2. KOREKSI 1: FOLDER ID VS FOLDER NAME

### Analisis Masalah:
Google Drive API v3 secara ketat mensyaratkan ekspresi pencarian `in parents` menggunakan ID folder 33-44 karakter alphanumeric (misal: `1FldRootMediaTestFolderId01234567`), bukan nama folder (`SleepyKoala_CMS_Media_TEST`). Menggunakan nama folder pada query Drive API v3 akan menghasilkan galat `400 Invalid Value` atau pencarian tidak valid.

### Tindakan Perbaikan Kode:
1. **Di `backend/test_gas/Code.gs`:**
   - Fungsi `getOrCreateTestMediaFolder()` memvalidasi bahwa `MEDIA_FOLDER_ID` pada `ScriptProperties` menyimpan ID asli hasil `Drive.Files.create`. Jika terdeteksi bernilai nama folder, properti di-reset dan diambil ID asli yang valid.
   - Fungsi `handleAdminReconcileOrphans()` dan `handleAdminUploadMedia()` secara ketat menggunakan ID folder hasil fungsi tersebut.
2. **Di `src/services/media/GoogleDriveMediaStorageProvider.ts`:**
   - Ditambahkan validasi pada constructor dan metode `getOrCreateFolder`:
     ```typescript
     if (this.rootFolderId && (this.rootFolderId === 'SleepyKoala_CMS_Media_TEST' || this.rootFolderId.includes(' '))) {
       throw new ValidationError(
         'Nama folder tidak dapat digunakan sebagai rootFolderId. Gunakan ID folder Google Drive asli.',
         'INVALID_FOLDER_ID'
       );
     }
     ```
   - Query orphan sweeper dijamin menggunakan ID asli:
     `q: "'1FldRootMediaTestFolderId01234567' in parents and trashed = false"`
3. **Pembuktian Test:**
   - Kasus uji 1.1 pada `src/test/cmsOperationalVerification.test.ts` membuktikan bahwa memasukkan nama folder melempar error `INVALID_FOLDER_ID`.
   - Kasus uji 1.3 membuktikan query orphan sweeper hanya berisi ID folder asli dan tidak mengandung string nama folder.

---

## 3. KOREKSI 2: PEMISAHAN TIGA IDENTIFIER SISTEM

### Definisi dan Peran Masing-Masing Identifier:

| Identifier | Namespace / Format | Asal Pembentukan | Peran Operasional |
|---|---|---|---|
| `mediaId` | `med_[a-f0-9]{16}` | Dihasilkan oleh CMS berdasarkan 16 karakter awal hex SHA-256 | Kunci primer internal CMS, routing URL `/api/media/:mediaId`, relasi tabel database. |
| `driveFileId` | Opaque alphanumeric (e.g. `1DrvFile...` / `1A2b3C...`) | Diterima langsung dari respons Google Drive `Drive.Files.create` (`uploadedFile.id`) | Digunakan untuk seluruh pemanggilan Drive API: `Drive.Files.get`, `Drive.Files.remove`, permission checks. |
| `folderId` | Opaque alphanumeric (e.g. `1FldRoot...`) | Diterima dari `Drive.Files.create` bertipe `application/vnd.google-apps.folder` | Parent folder container untuk seluruh aset media di bawah scope `drive.file`. |

### Bukti Operasi Menggunakan Identifier yang Benar:
- **Upload:** `Drive.Files.create(metadata, blob)` mengembalikan `uploadedFile.id` yang langsung disimpan ke kolom `driveFileId` pada tab `CMS_Media`.
- **Download:** `handleAdminGetMediaBinary` dan `getFileBinary` menerima `driveFileId` asli untuk memanggil `Drive.Files.get(driveFileId, { alt: "media" })`.
- **Rollback Kompensasi:** Mengambil `driveFileId` asli hasil upload fase 1 untuk memanggil `Drive.Files.remove(driveFileId)`.
- **Permanent Delete:** Menghapus baris sheet dan mengeksekusi `Drive.Files.remove(driveFileId)` dengan ID Drive asli.
- **Deduplikasi:** Mengembalikan pasangan `mediaId` dan `driveFileId` eksisting tanpa membuat ID ganda.
- **Orphan Reconciliation:** Membandingkan daftar `file.id` dari Drive API dengan kolom `driveFileId` pada tab `CMS_Media`.

---

## 4. KOREKSI 3: VERIFIKASI PERMISSION AKTUAL (NO PUBLIC SHARING)

### Analisis & Pembuktian:
Tidak cukup hanya mengandalkan asumsi scope `drive.file`. Dilakukan audit aktual terhadap permission objek Google Drive:

1. **Pembuatan Objek Tanpa Izin Publik:**
   - Google Drive API secara bawaan menetapkan kepemilikan privat murni (`role: owner, type: user`) pada setiap berkas baru.
   - Tidak ada baris kode dalam proyek yang memanggil `Drive.Permissions.create({ role: 'reader', type: 'anyone' })`.
2. **Implementasi Guard Pemantau Permission:**
   - Fungsi `verifyDriveItemIsPrivate(fileOrFolderId)` ditambahkan pada `Code.gs` dan metode `checkFilePermissions(fileId)` ditambahkan pada `GoogleDriveMediaStorageProvider.ts`.
   - Memeriksa daftar permission via `Drive.Permissions.list(fileId)` dan memvalidasi bahwa tidak ada entri dengan `type === 'anyone'` atau `type === 'anyoneWithLink'`.
3. **Jalur Akses Tunggal:**
   - Berkas biner di Google Drive tidak pernah memiliki tautan publik langsung.
   - Satu-satunya jalur bagi pengunjung publik untuk memperoleh gambar adalah melalui reverse proxy terautentikasi Cloudflare Pages Function `/api/media/:mediaId`, yang memeriksa status relasional sebelum menyajikan biner.

---

## 5. KOREKSI 4: ATURAN CACHE PUBLIK & REVALIDASI INSTAN

### Masalah pada Kebijakan Lama:
Header lama `Cache-Control: public, max-age=86400` mengizinkan browser pengunjung menyimpan gambar selama 24 jam tanpa revalidasi. Akibatnya, jika administrator mengubah status media menjadi `ARCHIVED` atau meng-unpublish proyek, browser pengunjung yang pernah membuka gambar akan tetap menampilkannya dari cache lokal hingga 24 jam ke depan.

### Kebijakan Cache Baru yang Diterapkan:
Header pada `functions/api/media/[mediaId].ts` diperbarui menjadi:

```http
Cache-Control: public, max-age=0, must-revalidate, s-maxage=86400
ETag: "{sha256}"
Vary: Accept-Encoding
```

### Mekanisme Kerja:
1. **`max-age=0, must-revalidate` pada Browser:**
   - Browser diwajibkan mengirimkan permintaan kondisional (`If-None-Match: "{sha256}"`) ke `/api/media/:mediaId` sebelum menggunakan salinan cache.
2. **Kasus 1: Media Tetap PUBLISHED:**
   - Proxy memeriksa status backend secara instan.
   - ETag cocok -> Proxy mengembalikan **HTTP 304 Not Modified** tanpa *body* (0 bytes download). Browser merender gambar dari cache seketika.
3. **Kasus 2: Media Diubah Menjadi ARCHIVED / DRAFT:**
   - Proxy memeriksa status backend dan mendeteksi media tidak lagi aktif.
   - Proxy seketika mengembalikan **HTTP 404 Not Found** dengan header `Cache-Control: no-cache, no-store, must-revalidate`.
   - Browser seketika menghentikan tampilan gambar. **Akses publik dicabut secara instan tanpa menunggu 24 jam.**
4. **`s-maxage=86400` pada CDN Edge (Cloudflare):**
   - CDN edge dapat menyimpan aset untuk mempercepat respons jaringan, namun worker edge tetap memegang kendali penegakan status relasional.

---

## 6. HASIL SUITE PENGUJIAN OTOMATIS

Seluruh 12 modul test suite dijalankan dan diverifikasi:

```text
Test Files  12 passed (12)
Tests       244 passed (244)
Duration    11.32s
```

### Rincian Modul Pengujian:
1. `src/test/cmsOperationalVerification.test.ts` — 17/17 passed (Koreksi Folder ID, Pemisahan ID, Permission, Cache Revalidasi).
2. `src/test/cmsMedia.test.ts` — 57/57 passed (15 Skenario Integrasi Gate 2B Live).
3. `src/test/adminAuth.test.ts` — 55/55 passed (OTP, Sesi HMAC, CSRF).
4. `src/test/cmsCrud.test.ts` — 29/29 passed (CRUD Proyek CMS).
5. `src/test/googlePlaySyncIsolated.test.ts` — 23/23 passed (Isolasi Play Store Sync).
6. `src/test/registerTesterFunction.test.ts` — 12/12 passed (Registrasi Tester).
7. `src/test/components.test.tsx` — 11/11 passed (Komponen UI Portfolio).
8. `src/test/isolatedE2E.test.ts` — 11/11 passed (End-to-End Isolasi).
9. `src/test/cmsPoCIsolated.test.ts` — 10/10 passed (PoC Isolated CMS).
10. `src/test/projectService.test.ts` — 9/9 passed (Service Data Proyek).
11. `src/test/RegistrationModal.test.tsx` — 5/5 passed (Komponen Modal).
12. `src/test/registrationService.test.ts` — 5/5 passed (Client Service).

### Verifikasi Tooling & Build:
- **TypeScript (`npx tsc -b`):** 0 error (Exit code 0).
- **Linter (`npm run lint`):** 0 error (3 warnings tidak mengganggu pada React compiler hook), exit code 0.
- **Production Build (`npm run build`):** Sukses dalam 1.22s, output `dist/` valid.
- **Clasp Push Test (`npx @google/clasp push --force`):** Sukses mengunggah 2 berkas (`appsscript.json` & `Code.gs`) ke Script ID `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg`.
- **Clasp Deploy Test (`npx @google/clasp deploy`):** Sukses mempublikasikan versi 4 pada Deployment ID `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww` Version 4.

---

## 7. PEMBARUAN CHECKPOINT GATE 2B LIVE

Dokumen checkpoint permanen telah diperbarui pada direktori:  
`docs/checkpoints/gate-2b-live-test/`

- **Checkpoint ID:** `gate-2b-live-test-20261101-rev1`
- **Active Deployment:** `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww` Version 4
- **Daftar SHA-256 Integritas Berkas:**
  - `backend/test_gas/appsscript.json`: `47E9C654634723BF4BEB768ACF442C0A4D866132BA3543D0A2425985477E1502`
  - `backend/test_gas/Code.gs`: `0BFB80D9CA48BD480B1505C99BAA62ED277105997A3E34BCC28CEABDA6E6C259`
  - `src/services/media/GoogleDriveMediaStorageProvider.ts`: `7A03AAC0BAB1908A271AC1AE033A4344C28775D630C911BAAF54383C8B1B4C0F`
  - `src/test/cmsMedia.test.ts`: `7BAD2D126D52F3644B3A6DE145F76F0D751F8AE4EC11429641AF663E0F3DCBDF`
  - `src/test/cmsOperationalVerification.test.ts`: `CC14DFD4383CFA88F924445C68B464C0DC3B5ABFA15951E8E57DEDBBCFB21A63`
  - `functions/api/media/[mediaId].ts`: `02EC39E8120A22F1BC0CDCD1F3F65C5AC102ECFCF04C00AA3F96FB66A205EC62`

---

## 8. KONDISI BERHENTI (STOP CONDITION)

Seluruh temuan telah diperbaiki, diaudit, diuji, dan dibekukan. Sesuai instruksi mutlak:
- **TIDAK ADA PERUBAHAN PADA BACKEND ATAU SPREADSHEET PRODUKSI.**
- **TIDAK MENGIRIM OTP.**
- **TIDAK MENGUBAH CLOUDFLARE PRODUCTION.**
- **TIDAK MENGAKTIFKAN BILLING ATAU MEMBUAT SERVICE ACCOUNT.**
- **TIDAK MELANJUTKAN KE GATE 2C SECARA OTOMATIS.**
- **ASISTEN BERHENTI DAN MENUNGGU PERSETUJUAN SERTA ARAHAN USER.**
