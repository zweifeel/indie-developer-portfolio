# SLEEPYKOALA CMS — PRODUCTION ROLLBACK PLAN
## EMERGENCY RESTORATION PROCEDURES & TARGET COMPATIBILITY MATRIX

**Ref:** PLAN-M63-ROLLBACK  
**Target Keamanan:** Zero Downtime, Zero Data Loss, Strict Zero-Cost ($0.00 / Rp0)  
**Tingkat Kesiapan:** READY FOR IMMEDIATE RESTORATION IF NEEDED  

---

## 1. MATRIKS TARGET ROLLBACK

### 1.1. Cloudflare Pages Rollback Targets

| Deployment UUID | Status Rollback | Keterangan & Keselamatan |
|---|---|---|
| `2c3cced9-fc9b-4bc7-857f-7826f9acd386` | **PRIMARY VIABLE ROLLBACK TARGET (RECOMMENDED)** | Deployment produksi Gate 5.0 aktif saat ini. Telah terbukti stabil, memiliki integritas visual penuh, mendukung CMS edge functions dasar, dan berfungsi 100%. |
| `e67ff19b-c40b-4654-8fe4-9ee7da56403b` | **STRICTLY FORBIDDEN / INCOMPATIBLE** | Deployment lama yang mengalami kegagalan konfigurasi dan menghasilkan HTTP 503 error. Dilarang keras melakukan rollback ke deployment ini! |

### 1.2. Google Apps Script Backend Rollback Targets

| Apps Script Version | Status Rollback | Keterangan & Keselamatan |
|---|---|---|
| **Version 3 (`@3`)** | **CURRENT PRODUCTION BASELINE** | Versi aktif saat ini (`AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`). Mendukung seluruh operasi CMS, audit log, dan isolasi media. |
| **Version 2 (`@2`)** | **VIABLE FALLBACK CANDIDATE** | Versi Gate 4. Mendukung skema database CMS dasar, namun tidak memiliki penyempurnaan session revocation `SEC-M61-02` dan referential cleanup Gate 2D.2. Hanya digunakan jika Version 3/4 mengalami crash fatal. |
| **Version 1 (`@1`)** | **STRICTLY FORBIDDEN / INCOMPATIBLE** | Versi lawas tanpa modul CMS, tanpa otentikasi admin, dan tanpa tabel spreadsheet CMS. Dilarang keras melakukan redeploy ke Versi 1! |

---

## 2. TRIGGER ROLLBACK DARURAT

Rollback wajib diaktifkan secara cepat jika salah satu kondisi berikut terjadi setelah rilis:
1. **Critical Outage:** Halaman publik atau rute `/projects` mengembalikan respons HTTP 500, 502, atau 503 berkelanjutan selama lebih dari 3 menit.
2. **Security Vulnerability Leak:** Terjadi bypass otentikasi admin atau proyek berstatus `DRAFT` dapat diakses secara publik tanpa otentikasi.
3. **Database Write Failure:** Permintaan simpan proyek atau pendaftaran tester gagal menyimpan baris baru ke Google Sheets secara berulang.
4. **Data Corruption:** Terdapat indikasi kerusakan pada data spreadsheet `CMS_Projects` atau `TesterRegistrations`.

---

## 3. PROSEDUR STEP-BY-STEP ROLLBACK

### A. Prosedur Rollback Cloudflare Pages (Frontend / Edge)
1. Buka terminal workspace atau Cloudflare Dashboard.
2. Jika menggunakan Wrangler CLI:
   ```bash
   npx wrangler pages deployment rollback 2c3cced9-fc9b-4bc7-857f-7826f9acd386 --project-name sleepykoala
   ```
3. Jika menggunakan Cloudflare Dashboard:
   - Navigasi ke: **Workers & Pages > Projects > sleepykoala > Deployments**.
   - Cari Deployment ID `2c3cced9-fc9b-4bc7-857f-7826f9acd386`.
   - Klik menu titik tiga (...) pada baris tersebut, lalu pilih **Rollback to this deployment**.
4. Verifikasi instan:
   - Akses `https://sleepykoala.pages.dev` dan verifikasi HTTP 200 OK.

### B. Prosedur Rollback Apps Script Backend
1. Jika deployment Apps Script baru (misal Version 4) bermasalah, kembalikan deployment ke Version 3:
   ```bash
   cd backend/gas
   clasp redeploy --deploymentId AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A --versionNumber 3 --description "Emergency Rollback to Version 3 Baseline"
   ```
2. Alternatif via Apps Script Web IDE:
   - Buka project Apps Script via browser.
   - Klik **Deploy > Manage deployments**.
   - Pilih deployment aktif `AKfycbxc...`, klik tombol edit (ikon pensil).
   - Ubah versi target kembali ke **Version 3**.
   - Klik **Deploy**.

---

## 4. PERLINDUNGAN DATA & INTEGRITAS DATABASE
Selama proses rollback:
- **TIDAK ADA DATA YANG DIHAPUS:** Seluruh baris di Google Sheets (`CMS_Projects`, `CMS_Media`, `CMS_AuditLogs`, `TesterRegistrations`) tetap aman dan tidak disentuh.
- **AUDIT LOGGING:** Setiap upaya pemulihan atau rollback wajib dicatat dalam berkas log operasional studio.
