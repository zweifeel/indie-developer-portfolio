# SLEEPYKOALA CMS — MILESTONE 6.3 CHECKPOINT
## PRE-REGISTRATION STATUS INTEGRATION & PRODUCTION DEPLOYMENT PREPARATION
### LOCAL VERIFICATION BASELINE — STRICTLY NO REMOTE DEPLOYMENT

---

## 1. IKHTISAR CHECKPOINT

- **Milestone:** Milestone 6.3 — Pre-Registration Status Integration & Production Deployment Preparation
- **Tanggal:** 1 November 2026
- **Status:** PASS WITH CONDITIONS — HUMAN CONFIGURATION REQUIRED
- **Mode:** Local Verification, Documentation, & Staging Verification (Read-Only)
- **Zero-Cost / Free-Tier Lock:** VERIFIED ($0.00 / Rp0)
- **Production Mutasi / Deployment:** NONE (Zero remote writes, clasp push/deploy blocked, wrangler deploy blocked)

---

## 2. RUANG LINGKUP & PENCAPAIAN

### A. Integrasi Status Proyek Baru: `PRE_REGISTRATION`
Status ketujuh `PRE_REGISTRATION` (Pre-Registration) telah diintegrasikan secara holistik:
1. **Type Definitions:**
   - `src/types/project.ts`: Menambahkan `'PRE_REGISTRATION'` ke dalam tipe union `ProjectStatus`.
   - `src/services/cmsProjectService.ts`: Menambahkan `'PRE_REGISTRATION'` ke dalam tipe union `CmsProject.status`.
   - `src/services/projectService.ts`: Mendaftarkan `'PRE_REGISTRATION'` ke dalam `VALID_STATUSES` set.
2. **Lokalisasi & Terminologi:**
   - `src/locales/id.ts`: Label bahasa Indonesia terverifikasi (`'Pre-Registration'`), aksi (`'Pra-Registrasi Minat'`), dan deskripsi (`'Proyek sedang membuka pendaftaran minat awal sebelum peluncuran resmi.'`).
3. **Komponen Visual & UI:**
   - `src/components/StatusBadge.tsx`: Desain badge khusus indigo (`bg-indigo-950/70 text-indigo-300 border-indigo-700/60`) dengan dot indikator statis/pulsa.
   - `src/components/ProjectCard.tsx`: Integrasi label status, pencegahan tautan palsu ke Google Play bila `testingUrl` tidak ada.
   - `src/pages/ProjectDetailPage.tsx`: Tombol aksi pendaftaran minat awal hanya tampil bila `testingUrl` valid; jika tidak ada, menampilkan badge informatif tanpa tombol mati.
   - `src/pages/ProjectsPage.tsx`: Penambahan opsi filter status `Pre-Registration`.
   - `src/pages/AdminPage.tsx`: Penambahan opsi dropdown `PRE_REGISTRATION` pada form editor proyek CMS.
4. **Validasi Backend Apps Script:**
   - `backend/gas/Code.gs` dan `backend/test_gas/Code.gs`: Memperbarui `allowedStatuses` pada fungsi `saveProject` untuk mencakup `"PRE_REGISTRATION"`.

### B. Hasil Pengujian Otomatis
- **Test Suites:** 19 test files (semua lulus).
- **Total Tests:** 380 automated tests (380 passed, 0 failed).
- **TypeScript:** `tsc -b` lulus tanpa error (0 errors).
- **Vite Production Build:** Berhasil membuat bundle produksi teroptimasi.
- **Linter:** `oxlint` 0 error (4 warning non-blocking react set-state).

### C. Persiapan Deployment & Rollback Produksi
- **Deployment Plan:** Rencana peluncuran 13-langkah dengan kriteria verifikasi ketat.
- **Rollback Plan:** Dokumentasi pemulihan bertingkat untuk Apps Script (V3 ke V2) dan Cloudflare Pages (`2c3cced9-fc9b-4bc7-857f-7826f9acd386`).
- **Configuration Checklist:** Audit variabel lingkungan dan secret M2M (`APPS_SCRIPT_SECRET`, `ADMIN_SESSION_SECRET`, `GAS_WEBAPP_URL`).

---

## 3. FILE INVENTORY CHECKPOINT
Lihat rincian lengkap pada `manifest.md` dan hasil pengujian pada `test-results.md`.
