# SLEEPYKOALA CMS — MILESTONE 6.3 MANIFEST
## FILE INVENTORY & HASH / CHANGE REGISTER

---

### 1. FILE YANG DIUBAH (MODIFIED)

| File Path | Komponen / Lapisan | Deskripsi Perubahan |
|---|---|---|
| `src/types/project.ts` | Frontend Type | Menambahkan `'PRE_REGISTRATION'` pada union `ProjectStatus` |
| `src/services/cmsProjectService.ts` | CMS Client Service | Menambahkan `'PRE_REGISTRATION'` pada union `CmsProject.status` |
| `src/services/projectService.ts` | Public Service | Mendaftarkan `'PRE_REGISTRATION'` pada `VALID_STATUSES` |
| `src/locales/id.ts` | Localization | Menambahkan `statusPreRegistration`, `statusLabels.PRE_REGISTRATION`, `preRegistrationAction`, `preRegistrationInfo` |
| `src/components/StatusBadge.tsx` | UI Component | Menambahkan styling badge indigo untuk `PRE_REGISTRATION` |
| `src/components/ProjectCard.tsx` | UI Component | Menambahkan penanganan status `PRE_REGISTRATION` dan guard `testingUrl` |
| `src/pages/ProjectDetailPage.tsx` | UI Page | Menambahkan tombol pra-registrasi bersyarat dan badge informatif |
| `src/pages/ProjectsPage.tsx` | UI Page | Menambahkan filter opsi `PRE_REGISTRATION` |
| `src/pages/AdminPage.tsx` | CMS Admin Page | Menambahkan `<option value="PRE_REGISTRATION">` pada modal edit proyek |
| `backend/gas/Code.gs` | Production Backend | Menambahkan `"PRE_REGISTRATION"` pada `allowedStatuses` di `saveProject` |
| `backend/test_gas/Code.gs` | Test Backend | Menambahkan `"PRE_REGISTRATION"` pada `allowedStatuses` di `saveProject` |
| `src/test/milestone6Acceptance.test.ts` | Test Suite | Memperbarui verifikasi 7 status siklus hidup proyek |

---

### 2. FILE YANG DIBUAT (CREATED)

| File Path | Deskripsi |
|---|---|
| `src/test/milestone63PreRegistration.test.ts` | 18 unit & integration automated tests untuk status `PRE_REGISTRATION` |
| `docs/checkpoints/milestone-6.3-preregistration-deployment-preparation/README.md` | Ringkasan eksekutif checkpoint Milestone 6.3 |
| `docs/checkpoints/milestone-6.3-preregistration-deployment-preparation/manifest.md` | Inventaris file dan perubahan Milestone 6.3 |
| `docs/checkpoints/milestone-6.3-preregistration-deployment-preparation/test-results.md` | Log dan bukti eksekusi test runner, build, dan lint |
| `docs/reports/sleepykoala-milestone-63-implementation-report.md` | Laporan implementasi teknis lengkap Milestone 6.3 |
| `docs/audits/sleepykoala-milestone-63-final-verification.md` | Audit verifikasi akhir Milestone 6.3 |
| `docs/deployment/sleepykoala-production-deployment-plan.md` | Panduan rencana peluncuran 13-langkah ke lingkungan produksi |
| `docs/deployment/sleepykoala-production-rollback-plan.md` | Rencana pemulihan darurat dan mitigasi rollback terperinci |
| `docs/deployment/sleepykoala-production-configuration-checklist.md` | Audit dan checklist konfigurasi secret produksi |

---

### 3. CANONICAL OFFICIAL PROJECTS PRESERVATION
6 proyek portofolio resmi terbukti tidak mengalami modifikasi status otomatis atau data corrupt:
1. `dompetnalar` (APPLICATION, `READY_FOR_RELEASE`)
2. `idle-master` (GAME, `WORK_IN_PROGRESS`)
3. `mobile-kasir` (APPLICATION, `CLOSED_TESTING`, registrationOpen: true)
4. `idle-mining` (GAME, `COMING_SOON`)
5. `the-broken-origin` (GAME, `WORK_IN_PROGRESS`)
6. `worklume` (APPLICATION, `WORK_IN_PROGRESS`)
