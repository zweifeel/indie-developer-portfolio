# SLEEPYKOALA CMS — MILESTONE 6.3 IMPLEMENTATION REPORT
## PRE-REGISTRATION STATUS INTEGRATION & PRODUCTION DEPLOYMENT PREPARATION

**Tanggal:** 1 November 2026  
**Status:** PASS WITH CONDITIONS — HUMAN CONFIGURATION REQUIRED  
**Lead Engineer / DevOps:** Autonomous Agent (Antigravity)  
**Lingkup:** Local Full-Stack Enhancements & Production Release Readiness  

---

## 1. EKSEKUTIF SUMMARY

Milestone 6.3 merealisasikan dua mandat pokok:
1. **Bagian A — Project Status Enhancement:** Menambahkan status baru `PRE_REGISTRATION` secara komprehensif dari lapisan type system TypeScript, visual token & badges, localization, halaman katalog & detail publik, form admin CMS, hingga validasi server-side Google Apps Script.
2. **Bagian B — Regression & Acceptance Test:** Menyusun test suite otomatis yang memverifikasi keabsahan status, perlindungan data privasi, isolasi status publikasi (`publishState`), dan verifikasi bahwa 6 proyek portofolio resmi tidak mengalami perubahan liar.
3. **Bagian C — Production Deployment Preparation:** Menyusun audit konfigurasi secret, matriks kompatibilitas frontend-backend, checklist deployment 13-langkah, dan prosedur rollback teruji.

Seluruh pekerjaan diselesaikan di bawah **ZERO-COST / FREE-TIER LOCK** ($0.00 / Rp0) tanpa melakukan mutasi atau deployment liar ke infrastruktur live production.

---

## 2. DETAIL IMPLEMENTASI BAGIAN A — STATUS PRE_REGISTRATION

### 2.1. Definisi 7 Status Siklus Hidup Proyek
Dengan integrasi `PRE_REGISTRATION`, sistem kini memiliki tepat 7 status kanonikal:
1. `RELEASED` (Sudah Dirilis)
2. `READY_FOR_RELEASE` (Siap Rilis)
3. `PRE_REGISTRATION` (Pre-Registration)
4. `CLOSED_TESTING` (Closed Testing)
5. `INTERNAL_TESTING` (Internal Testing)
6. `WORK_IN_PROGRESS` (Dalam Pengembangan)
7. `COMING_SOON` (Segera Hadir)

### 2.2. Perubahan Komponen & Kode
1. **TypeScript Definitions:**
   - `src/types/project.ts`:
     ```typescript
     export type ProjectStatus =
       | 'READY_FOR_RELEASE'
       | 'RELEASED'
       | 'PRE_REGISTRATION'
       | 'CLOSED_TESTING'
       | 'INTERNAL_TESTING'
       | 'WORK_IN_PROGRESS'
       | 'COMING_SOON';
     ```
   - `src/services/cmsProjectService.ts`: Menambahkan `'PRE_REGISTRATION'` ke dalam `CmsProject.status`.
   - `src/services/projectService.ts`: Menambahkan `'PRE_REGISTRATION'` ke dalam `VALID_STATUSES`.

2. **Lokalisasi (`src/locales/id.ts`):**
   - Menambahkan:
     - `filters.statusPreRegistration: 'Pre-Registration'`
     - `statusLabels.PRE_REGISTRATION: 'Pre-Registration'`
     - `projectDetail.preRegistrationAction: 'Pra-Registrasi Minat'`
     - `projectDetail.preRegistrationInfo: 'Proyek sedang membuka pendaftaran minat awal sebelum peluncuran resmi.'`

3. **StatusBadge (`src/components/StatusBadge.tsx`):**
   - Warna khusus tema Indigo yang membedakan tahap pra-registrasi dengan closed testing (amber) maupun rilis (emerald):
     ```typescript
     case 'PRE_REGISTRATION':
       colorClasses = 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60';
       dotClasses = 'bg-indigo-400';
       break;
     ```

4. **Katalog Proyek & Detail Halaman:**
   - `src/components/ProjectCard.tsx`: Mendukung deteksi `isPreReg`, menampilkan badge indigo. Tidak menampilkan tombol tautan Google Play palsu jika `testingUrl` kosong.
   - `src/pages/ProjectDetailPage.tsx`: Mendukung deteksi status `isPreRegistration`. Jika `testingUrl` diisi, menampilkan tombol aksi pendaftaran minat awal terverifikasi; jika tidak diisi, menampilkan badge informatif ramah pengguna tanpa tautan mati.
   - `src/pages/ProjectsPage.tsx`: Menambahkan opsi filter tab untuk `PRE_REGISTRATION`.

5. **Admin CMS (`src/pages/AdminPage.tsx`):**
   - Menambahkan opsi `<option value="PRE_REGISTRATION">PRE_REGISTRATION</option>` pada elemen select status pengembangan.

6. **Backend Apps Script Validation:**
   - `backend/gas/Code.gs` (baris 1847) dan `backend/test_gas/Code.gs` (baris 1763):
     ```javascript
     var allowedStatuses = ["READY_FOR_RELEASE", "RELEASED", "PRE_REGISTRATION", "CLOSED_TESTING", "INTERNAL_TESTING", "WORK_IN_PROGRESS", "COMING_SOON"];
     ```

---

## 3. HASIL VERIFIKASI & PENGUJIAN OTOMATIS (BAGIAN B)

### 3.1. Test Suite Milestone 6.3 (`src/test/milestone63PreRegistration.test.ts`)
18 pengujian terarah berhasil memvalidasi:
- `isValidProject` menerima seluruh 7 status dan menolak status di luar daftar.
- Label lokalisasi bahasa Indonesia bersih dari kata-kata bombastis.
- Bebas dari styling gradient text (`bg-clip-text`, `text-transparent`) demi keterbacaan solid.
- `StatusBadge`, `ProjectCard`, dan `ProjectDetailPage` merender status pra-registrasi secara konsisten tanpa tautan mati.
- Ortogonalitas antara status proyek dan status publikasi (`publishState`): perubahan status tidak otomatis memublikasikan proyek berstatus `DRAFT`.
- backend Apps Script validasi lokal menerima status baru.
- Preservasi 6 proyek resmi (`dompetnalar`, `idle-master`, `mobile-kasir`, `idle-mining`, `the-broken-origin`, `worklume`).

### 3.2. Regresi Penuh
- **19 Test Files:** Semua lulus.
- **380 Tests:** 380 Passed, 0 Failed.
- **TypeScript:** 0 Errors.
- **Vite Build:** Sukses memproduksi bundle produksi di direktori `dist/`.

---

## 4. CANONICAL OFFICIAL PROJECTS VERIFICATION
Data resmi 6 proyek tetap utuh:
- `dompetnalar`: APPLICATION, READY_FOR_RELEASE
- `idle-master`: GAME, WORK_IN_PROGRESS
- `mobile-kasir`: APPLICATION, CLOSED_TESTING (registrationOpen: true)
- `idle-mining`: GAME, COMING_SOON
- `the-broken-origin`: GAME, WORK_IN_PROGRESS
- `worklume`: APPLICATION, WORK_IN_PROGRESS

---

## 5. KESIMPULAN & STATUS
Implementasi lokal telah selesai 100% dan terverifikasi secara ketat. Proyek siap untuk persiapan deployment produksi berizin manusia.
