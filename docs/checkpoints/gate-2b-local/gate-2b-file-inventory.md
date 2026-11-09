# SLEEPYKOALA CMS — GATE 2B FILE INVENTORY

Dokumen ini mencatat seluruh berkas yang dibuat dan dimodifikasi dalam implementasi Gate 2B Local.

---

## 1. Berkas Baru yang Dibuat

| No | Path Berkas | Peran / Deskripsi |
|:---|:---|:---|
| 1 | `src/services/media/types.ts` | Definisi TypeScript tipe inti CMS media, storage provider interface, dan error classes |
| 2 | `src/services/media/fileValidation.ts` | Utilitas validasi murni: magic bytes, sanitasi nama berkas, SHA-256 digest, batas 2.0 MB |
| 3 | `src/services/media/MockMediaStorageProvider.ts` | Implementasi mock storage in-memory dengan fault injection (timeout, save failure, delete failure, quota) |
| 4 | `src/services/media/GoogleDriveMediaStorageProvider.ts` | Kontrak adapter Drive API v3 masa depan dengan proteksi fail-closed (`LIVE_DRIVE_DISABLED_IN_LOCAL_GATE_2B`) |
| 5 | `functions/api/admin/media.ts` | Cloudflare Pages Function endpoint admin media (GET, POST, PUT, DELETE) dengan verifikasi CSRF & session |
| 6 | `functions/api/admin/media/[mediaId].ts` | Dedicated admin media preview endpoint dengan cache-control `private, no-store, no-cache, must-revalidate` |
| 7 | `functions/api/media/[mediaId].ts` | Public media serving proxy endpoint dengan otorisasi relasional (`Project=PUBLISHED && Media=PUBLISHED`), ETag, dan `nosniff` |
| 8 | `src/services/cmsMediaService.ts` | Client-side SDK service untuk upload, fetch, status update, dan penghapusan media |
| 9 | `src/test/cmsMedia.test.ts` | Test suite komprehensif 37 pengujian untuk Gate 2B |

---

## 2. Berkas yang Dimodifikasi

| No | Path Berkas | Perubahan yang Diterapkan |
|:---|:---|:---|
| 1 | `backend/test_gas/Code.gs` | Menambahkan sheet `CMS_Media`, routing action `ADMIN_UPLOAD_MEDIA`, `ADMIN_GET_PROJECT_MEDIA`, `ADMIN_UPDATE_MEDIA_STATUS`, `ADMIN_DELETE_MEDIA`, `ADMIN_RECONCILE_ORPHANS`, `CMS_GET_PUBLIC_MEDIA`, implementasi handler dual-phase rollback, LockService, dan pengecekan otorisasi relasional |
| 2 | `src/pages/AdminPage.tsx` | Menambahkan Tab "Galeri & Media", filter dropdown proyek, grid media cards dengan thumbnail preview, badge role & visibility, copy URL button, toggle status button, delete button, dan modal dialog upload berkas dengan live preview gambar |

---

## 3. Berkas yang Tetap Dibekukan (FROZEN — Tidak Disentuh)

| Kategori | Berkas | Status |
|:---|:---|:---|
| Manifest Apps Script | `backend/test_gas/appsscript.json` | FROZEN (hanya berisi `spreadsheets`, `script.send_mail`, `drive.file`) |
| Apps Script Produksi | `backend/gas/Code.gs`, `backend/gas/appsscript.json` | FROZEN (tidak disentuh sama sekali) |
| Konfigurasi Cloudflare | `wrangler.toml` | FROZEN (tetap pada versi stabil `2026-10-30`) |
| Tabel Tester Registrations | Sheet `TesterRegistrations` | FROZEN (tidak dimodifikasi) |
| Kode Etalase Portofolio | `src/pages/ProjectsPage.tsx`, `ProjectDetailPage.tsx` | FROZEN |
| Registrasi Publik Tester | `functions/api/register-tester.ts` | FROZEN |
