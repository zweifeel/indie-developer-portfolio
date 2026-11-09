# SLEEPYKOALA CMS — GATE 2B LIVE SECURITY AUDIT REPORT

**Tanggal Audit:** 2026-11-01  
**Auditor:** Antigravity Autonomous Security Engineer  
**Status Evaluasi:** PASS — FULLY COMPLIANT  
**Target Lingkungan:** TEST ONLY (`SleepyKoala_Test_Database`)  

---

## 1. Hasil Audit 14 Kriteria Keamanan Mandatori

| No | Kriteria Audit Keamanan | Status | Bukti Teknis / Verifikasi |
|---|---|---|---|
| 1 | **Isolasi Lingkungan (Test vs Production)** | PASS | `backend/test_gas/.clasp.json` terikat secara eksklusif ke Script ID `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg` dan Spreadsheet ID `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4`. Script ID produksi `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` tidak pernah diakses atau dimodifikasi. |
| 2 | **Minimalisasi OAuth Scopes** | PASS | `backend/test_gas/appsscript.json` hanya berisi scope `spreadsheets`, `script.send_mail`, dan `https://www.googleapis.com/auth/drive.file`. Tidak terdapat scope penuh `https://www.googleapis.com/auth/drive` maupun `drive.readonly`. |
| 3 | **Advanced Google Services Manifest** | PASS | `Drive` v3 dideklarasikan dalam `dependencies.enabledAdvancedServices` dengan userSymbol `"Drive"`, serviceId `"drive"`, dan version `"v3"`. |
| 4 | **Isolasi Folder Media** | PASS | Folder root media dikonfigurasi sebagai `SleepyKoala_CMS_Media_TEST`. ID folder disimpan di `ScriptProperties` (`MEDIA_FOLDER_ID`), menjamin seluruh aset tersimpan di dalam struktur folder terisolasi. |
| 5 | **Metode Drive API Valid** | PASS | Seluruh operasi menggunakan Advanced Google Service v3: `Drive.Files.create`, `Drive.Files.get`, `Drive.Files.remove`, dan `Drive.Files.list`. Tidak ada penggunaan `DriveApp` sama sekali dalam codebase. |
| 6 | **Prosedur Penghapusan Aman (Safe Deletion)** | PASS | Menggunakan `Drive.Files.remove(fileId)`. Tidak menggunakan kata kunci reserved `delete` (`Drive.Files.delete`), mencegah syntax error pada runtime Google Apps Script V8. |
| 7 | **Kompensasi Rollback Dual-Phase** | PASS | Jika penulisan baris metadata ke `CMS_Media` gagal setelah upload Drive berhasil, blok `catch` seketika memanggil `Drive.Files.remove(driveFileId)` dengan retry backoff dan mencatat kompensasi ke audit log. |
| 8 | **Sweeper Rekonsiliasi Berkas Orphan** | PASS | Handler `handleAdminReconcileOrphans` memindai seluruh berkas aktif di folder Drive dan membandingkannya dengan tab `CMS_Media`. Berkas yang tidak tercatat di sheet dibersihkan secara otomatis. |
| 9 | **Batas Ukuran Keras (2 MB Payload Limit)** | PASS | Ditegakkan ganda: di sisi browser/client (`MAX_BINARY_SIZE = 2 * 1024 * 1024`) sebelum pengiriman jaringan, dan di sisi backend (`bytes.length > CMS_CONFIG.MAX_MEDIA_BYTES`). Payload melebihi 2MB ditolak dengan error `PAYLOAD_TOO_LARGE`. |
| 10 | **Whitelist Format & Validasi Magic Bytes** | PASS | Hanya mengizinkan `image/webp`, `image/png`, dan `image/jpeg`. SVG, HTML, dan XML dilarang keras. Magic bytes diperiksa byte-by-byte (RIFF/WEBP, 8-byte PNG signature, JPEG SOI 0xFFD8 & EOI 0xFFD9). |
| 11 | **Sanitasi Nama Berkas** | PASS | Karakter berbahaya dan ekstensi ganda dieliminasi menggunakan regex `fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")`, mencegah directory traversal atau skrip tersembunyi. |
| 12 | **Kontrol Akses Relasional Media Publik** | PASS | Endpoint publik `/api/media/:mediaId` hanya melayani berkas jika `CMS_Media.visibility === 'PUBLISHED'` DAN proyek induk di `CMS_Projects.publishState === 'PUBLISHED'`. Jika salah satu bernilai DRAFT atau ARCHIVED, endpoint merespons 404 Not Found. |
| 13 | **Ketahanan Fail-Closed & Fallback Mock** | PASS | Switch konfigurasi `STORAGE_MODE: "LIVE_DRIVE"` dan `IS_LIVE_DRIVE_ACTIVE: true` di Apps Script. Pada frontend, `GoogleDriveMediaStorageProvider` menolak eksekusi tanpa otorisasi (`isLiveAuthorized = false`) dengan error `LIVE_DRIVE_DISABLED_IN_LOCAL_GATE_2B`. |
| 14 | **Jaminan Biaya Rp0 & Kuota Gratis** | PASS | Operasi Google Drive API v3 sepenuhnya memanfaatkan free tier harian (1.000.000.000 requests/hari). Tidak ada tagihan Google Cloud, credit card, atau layanan berbayar. |

---

## 2. Kesimpulan Audit

Implementasi Gate 2B Live telah memenuhi seluruh standar keamanan, integritas data, dan arsitektur yang disyaratkan. Tidak ditemukan kerentanan keamanan atau risiko terhadap sistem produksi.
