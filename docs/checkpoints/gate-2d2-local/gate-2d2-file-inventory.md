# SLEEPYKOALA CMS — INVENTARIS BERKAS GATE 2D.2
## FILE INVENTORY & MODIFICATION SCOPE — LOCAL REMEDIATION ONLY

**Checkpoint ID:** `gate-2d2-local-20261101-v1`  
**Tanggal:** 2026-11-01  

---

## 1. BERKAS YANG DIMODIFIKASI (MODIFIED FILES)

| Path Berkas | Komponen / Peran | Tujuan Modifikasi |
|---|---|---|
| `functions/api/projects.ts` | Cloudflare Pages Function | Menghilangkan fallback `rawProjects` (`projects.json`), menerapkan *fail-closed* HTTP 503 dengan header `no-store, no-cache, must-revalidate` saat upstream Apps Script gagal/timeout. |
| `functions/api/projects/[slug].ts` | Cloudflare Pages Function | Menghilangkan fallback `rawProjects`, mengembalikan HTTP 503 saat upstream gagal, dan HTTP 404 saat slug tidak ditemukan atau berstatus draft/arsip. |
| `backend/test_gas/Code.gs` | Google Apps Script TEST Source | Menambahkan fungsi `cleanMediaReferencesFromProjects` dan memperbarui `handleAdminDeleteMedia` untuk membersihkan array `screenshots` JSON, `iconUrl`, dan `featureGraphicUrl` di `CMS_Projects` sebelum menghapus berkas. |
| `src/services/projectService.ts` | Client Service & Hooks | Mengubah `fetchPublishedProjects` agar tidak mengembalikan snapshot statis saat backend 503, dan memperbarui hook `useProjects` dengan state `isUnavailable`. |
| `src/pages/HomePage.tsx` | UI Halaman Utama | Menampilkan banner peringatan koneksi backend dengan tombol "Coba Lagi" saat `isUnavailable`, tanpa merender daftar palsu. |
| `src/pages/ProjectsPage.tsx` | UI Katalog Proyek | Membedakan secara eksplisit antara status server tidak tersedia (`isUnavailable`), katalog kosong (`allProjects.length === 0`), dan filter tidak cocok. |
| `src/pages/ProjectDetailPage.tsx` | UI Detail Proyek | Menampilkan status server tidak tersedia (`isUnavailable`) terpisah dari status proyek tidak ditemukan (404). |
| `src/test/cmsGate2DFunctionalAcceptance.test.ts` | Test Suite Vitest | Memperbarui pengujian skenario 4.1, 4.2, 4.5, dan 5.1/5.2 agar memvalidasi perilaku *fail-closed* 503. |
| `src/test/components.test.tsx` | Test Suite UI Vitest | Menambahkan mock handler `/api/projects` pada `beforeEach` agar pengujian render komponen UI stabil. |

---

## 2. BERKAS BARU YANG DITAMBAHKAN (ADDED FILES)

| Path Berkas | Peran / Deskripsi |
|---|---|
| `src/test/cmsGate2D2Remediation.test.ts` | Suite pengujian otomatis mencakup 29 skenario: 14 skenario untuk Remediasi A (Finding 01) dan 15 skenario untuk Remediasi B (Finding 03). |
| `docs/reports/sleepykoala-gate-2d2-remediation-report.md` | Laporan implementasi remediasi komprehensif. |
| `docs/audits/sleepykoala-gate-2d2-final-local-verification.md` | Laporan audit verifikasi akhir lokal. |
| `docs/checkpoints/gate-2d2-local/*` | Seluruh berkas dokumentasi checkpoint Gate 2D.2. |
