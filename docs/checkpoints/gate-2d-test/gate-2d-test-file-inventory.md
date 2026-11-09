# SLEEPYKOALA CMS — GATE 2D FILE INVENTORY

**Checkpoint ID:** `gate-2d-test-20261101-v1`  
**Status:** COMPLETE & FROZEN  

---

## 1. Berkas yang Ditambahkan dan Dimodifikasi pada Gate 2D

| No | Path Berkas | Tipe Perubahan | Peran & Deskripsi |
|---|---|---|---|
| 1 | `functions/api/projects.ts` | **NEW** | Endpoint publik `/api/projects`: menyajikan proyek `PUBLISHED` dari backend TEST dengan `no-cache, must-revalidate` dan fallback statis aman. |
| 2 | `functions/api/projects/[slug].ts` | **NEW** | Endpoint publik `/api/projects/:slug`: menyajikan detail proyek tunggal dengan otorisasi ketat (404 untuk DRAFT/ARCHIVED). |
| 3 | `src/services/projectService.ts` | **MODIFIED** | Ditambahkan sinkronisasi dinamis `fetchPublishedProjects()`, reaktif hook `useProjects()`, dan event listener pembaruan otomatis. |
| 4 | `src/pages/AdminPage.tsx` | **MODIFIED** | Dashboard overview lengkap (8 metrik proyek & media), pemisahan state loading/error/empty, preview mode, replace media, permanent delete, dan filter interaktif. |
| 5 | `functions/api/admin/media.ts` | **MODIFIED** | Menambahkan dukungan penerusan parameter `permanent: true` untuk penghapusan fisik dari Google Drive dan database. |
| 6 | `src/services/cmsMediaService.ts` | **MODIFIED** | Ditambahkan fungsi `replaceCmsMedia` dan dukungan `permanent` boolean pada `deleteCmsMedia`. |
| 7 | `src/pages/HomePage.tsx` | **MODIFIED** | Diintegrasikan dengan hook `useProjects()` untuk penyajian dinamis konten proyek rilis dan testing. |
| 8 | `src/pages/ProjectsPage.tsx` | **MODIFIED** | Diintegrasikan dengan hook `useProjects()` untuk penyaringan dan pencarian dinamis katalog proyek. |
| 9 | `src/pages/ProjectDetailPage.tsx` | **MODIFIED** | Diintegrasikan dengan hook `useProjects()` untuk resolusi dinamis slug proyek publik. |
| 10 | `src/pages/FeedbackPage.tsx` | **MODIFIED** | Diintegrasikan dengan hook `useProjects()` untuk form feedback dinamis per proyek. |
| 11 | `src/test/cmsGate2DFunctionalAcceptance.test.ts` | **NEW** | Test suite penerimaan fungsionalitas komprehensif Gate 2D (24 skenario uji). |
| 12 | `docs/reports/sleepykoala-gate-2d-implementation-report.md` | **NEW** | Laporan implementasi dan pengujian Gate 2D. |
| 13 | `docs/checkpoints/gate-2d-test/*` | **NEW** | Paket dokumentasi dan audit checkpoint Gate 2D. |

---

## 2. Berkas Baseline yang Dipertahankan Tanpa Regresi

- `backend/test_gas/Code.gs`: Tetap menggunakan Deployment V5 yang telah terverifikasi pada Gate 2C.
- `backend/test_gas/appsscript.json`: Scope `drive.file` dan Drive v3 Advanced Google Service.
- `functions/api/media/[mediaId].ts`: Proxy media biner Gate 2C tetap aktif dan terverifikasi.
- `functions/api/admin/auth/*`: Arsitektur OTP, cookie sesi HMAC, CSRF, dan M2M handshake.
