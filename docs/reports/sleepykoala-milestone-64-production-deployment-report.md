# SLEEPYKOALA CMS — MILESTONE 6.4 PRODUCTION DEPLOYMENT REPORT
## EKSEKUSI PELUNCURAN PRODUKSI & PENERIMAAN AKHIR CMS

**Tanggal Rilis:** 1 November 2026, 18:05 WIB  
**Status Evaluasi:** `PASS — PRODUCTION DEPLOYMENT AND FINAL ACCEPTANCE COMPLETE`  
**Lead Release & QA Engineer:** Autonomous Agent (Antigravity)  
**Lingkup:** End-to-End Production Deployment & Verification  

---

## 1. EXECUTIVE SUMMARY

Milestone 6.4 menandai keberhasilan peluncuran resmi sistem CMS SleepyKoala Studio ke lingkungan Production. Seluruh tahapan peluncuran dieksekusi secara terkontrol dengan urutan *Backend-First* (Apps Script Version 4 terlebih dahulu, disusul oleh Frontend Cloudflare Pages Milestone 6.3), memastikan transisi dengan risiko downtime rendah tanpa incompatibilitas skema.

### Status Infrastruktur Live:
- **Cloudflare Pages Production Deployment:** `0ef893ab-266c-4af0-a782-7a8c01d75f4a` (Aktif)
- **Primary Domain:** `https://sleepykoala.pages.dev`
- **Custom Domain:** `https://master.sleepykoala.dev`
- **Google Apps Script Production:** Script ID `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Apps Script Active Version:** Version 4 (`@4`)
- **Active Deployment ID:** `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`
- **Biaya:** $0.00 / Rp0 (Zero-Cost / Free-Tier Lock dipatuhi 100%)
- **Data 6 Proyek Resmi:** Utuh dan terkonfirmasi menyajikan data langsung dari Google Sheets (`cms-live`).

---

## 2. DETAIL EKSEKUSI PHASE A — APPS SCRIPT VERSION 4

### 2.1. Push dan Deploy Version 4
1. **Pre-Deployment Backup:** Source `backend/gas` dibackup ke `docs/checkpoints/milestone-6.4-production/backup_gas_v3/`.
2. **Push Source Code:**
   - Perintah: `npx @google/clasp push -f`
   - Hasil: Berhasil mengunggah 2 file (`appsscript.json` dan `Code.gs`).
3. **Penerbitan Immutable Version 4:**
   - Perintah: `npx @google/clasp deploy --description "SleepyKoala CMS Production V4 - Pre-Registration & Session Hardening"`
   - Hasil: Terbit Version 4 (`@4`).
4. **Pembaruan Active Deployment:**
   - Perintah: `npx @google/clasp redeploy -V 4 -d "SleepyKoala CMS Production V4 - Pre-Registration & Session Hardening" AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`
   - Hasil: Deployment aktif `AKfycbxc...` berhasil diarahkan ke Version 4 tanpa mengubah URL WebApp.

### 2.2. Verifikasi Handler & Fitur Backend V4
- Enum `PRE_REGISTRATION` diakui secara sah pada validasi `allowedStatuses`.
- 15 Action Handlers aktif dan siap melayani permintaan.
- Advanced Drive API v3 digunakan secara ketat tanpa ketergantungan `DriveApp`.
- Pembersihan referensi media permanen (`cleanMediaReferencesFromProjects`) aktif.

---

## 3. DETAIL EKSEKUSI PHASE B — FRONTEND CLOUDFLARE PAGES M6.3

### 3.1. Build & Quality Verification
- **Test Suite:** 19 test files, 380 automated tests lulus 100%.
- **Typecheck:** `tsc -b` lulus tanpa error (0 errors).
- **Linter:** `oxlint` lulus tanpa error (0 errors).
- **Vite Production Build:**
  - `dist/index.html`: 2.91 kB
  - `dist/assets/index-Dtx1tfFC.css`: 62.50 kB
  - `dist/assets/index-7H6n5fUj.js`: 430.12 kB

### 3.2. Peluncuran Cloudflare Pages
- **Perintah:** `npx wrangler pages deploy dist --project-name sleepykoala --branch main`
- **Deployment UUID Baru:** `0ef893ab-266c-4af0-a782-7a8c01d75f4a`
- **Environment:** `Production` (Branch `main`)
- **Direct URL:** `https://0ef893ab.sleepykoala.pages.dev`
- **Production Alias:** `https://sleepykoala.pages.dev`

---

## 4. PHASE C — WEB ADMIN GUI FINAL ACCEPTANCE

Web Admin GUI (`https://sleepykoala.pages.dev/admin`) telah terpasang dan diverifikasi secara operasional:

1. **Dashboard & Login:**
   - Panel login memvalidasi email administrator resmi (`zweifeel@gmail.com`).
   - Otentikasi OTP dilindungi CSRF header (`X-SleepyKoala-Admin: 1`).
   - Sesi terenkripsi menggunakan `ADMIN_SESSION_SECRET` (Value Encrypted pada Cloudflare).
2. **Project Management:**
   - Administrator dapat menambah, mengedit, mengubah slug, kategori (APPLICATION/GAME), deskripsi, dan status proyek tanpa perlu mengubah kode sumber atau build ulang website.
   - 7 Status didukung penuh: `RELEASED`, `READY_FOR_RELEASE`, `PRE_REGISTRATION`, `CLOSED_TESTING`, `INTERNAL_TESTING`, `WORK_IN_PROGRESS`, `COMING_SOON`.
   - `publishState` (`DRAFT`, `PUBLISHED`, `ARCHIVED`) terpisah dari status siklus hidup.
3. **Media Library:**
   - Upload gambar terisolasi ke Google Drive folder khusus via Drive API v3.
   - Format WebP, PNG, JPEG dengan limit 2 MB dan magic byte validation.
   - Penghapusan permanen media membersihkan referensi gambar pada `CMS_Projects`.
4. **Audit Logs:**
   - Seluruh mutasi admin dicatat ke sheet `CMS_AuditLogs`.

---

## 5. PHASE D — PUBLIC WEBSITE ACCEPTANCE

Pengujian rute publik langsung ke domain produksi:

| Rute URL | HTTP Status | Response Time | Verifikasi Konten |
|---|---|---|---|
| `/` | 200 OK | 0.12s | Beranda studio merender hero, branding, dan sorotan proyek |
| `/projects` | 200 OK | 0.19s | Katalog menyajikan filter status termasuk tab Pre-Registration |
| `/api/projects` | 200 OK | 3.02s | Response live Google Sheets V4 (`cms-live`, 6 proyek resmi) |
| `/projects/mobile-kasir` | 200 OK | 0.14s | Detail Mobile Kasir (`registrationOpen: true`, syarat 14 hari) |
| `/projects/worklume` | 200 OK | 0.14s | Detail Worklume (`Work Smarter. Stay Organized.`, grid kapabilitas) |
| `/about` | 200 OK | 0.09s | Halaman profil studio & komitmen indie engineering |
| `/robots.txt` | 200 OK | 0.42s | Proteksi rute `/admin` dan `/api/admin/` |
| `/sitemap.xml` | 200 OK | 0.37s | Indeks SEO untuk seluruh halaman kanonikal |

### Preservasi 6 Proyek Resmi:
1. `dompetnalar` (APPLICATION, `READY_FOR_RELEASE`)
2. `idle-master` (GAME, `WORK_IN_PROGRESS`)
3. `mobile-kasir` (APPLICATION, `CLOSED_TESTING`, pendaftaran penguji aktif)
4. `idle-mining` (GAME, `WORK_IN_PROGRESS`)
5. `the-broken-origin` (GAME, `WORK_IN_PROGRESS`)
6. `worklume` (APPLICATION, `WORK_IN_PROGRESS`)

---

## 6. PHASE E & F — SECURITY, REGRESSION & LIVE VERIFICATION

1. **Fail-Closed Boundary:**
   - Request ke `/api/admin/projects` tanpa session cookie mengembalikan **HTTP 401 Unauthorized**.
   - Request ke `/api/admin/media` tanpa session cookie mengembalikan **HTTP 401 Unauthorized**.
   - Request POST tanpa header CSRF mengembalikan **HTTP 403 Forbidden**.
2. **Secret Isolation:**
   - `ADMIN_SESSION_SECRET` digunakan untuk menandatangani token sesi HMAC.
   - `APPS_SCRIPT_SECRET` digunakan secara eksklusif untuk otentikasi M2M ke Google Apps Script.
   - Nol secret di dalam client bundle JavaScript.

---

## 7. ROLLBACK READINESS & RECOVERY PROCEDURES

- **Target Rollback Cloudflare Primer:** `2c3cced9-fc9b-4bc7-857f-7826f9acd386` (Gate 5.0).
- **Target Rollback Apps Script Primer:** Version 3 (`@3`) via `npx @google/clasp redeploy -V 3 AKfycbxcX7x7Q...`.
- **Target Dilarang:** Deployment `e67ff19b...` (broken 503) dan Apps Script Version 1.

---

## 8. KEPUTUSAN FINAL

**`PASS — PRODUCTION DEPLOYMENT AND FINAL ACCEPTANCE COMPLETE`**
