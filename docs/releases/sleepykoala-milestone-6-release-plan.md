# SLEEPYKOALA STUDIO — MILESTONE 6 RELEASE PLAN
## CONTROLLED PRODUCTION DEPLOYMENT & ROLLBACK SPECIFICATION

**Release Plan ID:** `release-plan-m6-20261101`  
**Target Application:** SleepyKoala Studio (`https://sleepykoala.pages.dev`)  
**Status:** DRAFT / PENDING HUMAN APPROVAL  
**Deployment Authorization:** STRICTLY REQUIRES HUMAN SIGN-OFF

---

## 1. PRE-DEPLOYMENT VERIFICATION GATE

Sebelum perintah deployment produksi dieksekusi, seluruh syarat wajib berikut harus terpenuhi:

1. [x] Seluruh automated test lulus (350/350 tests, 17 files).
2. [x] TypeScript build berhasil tanpa error (`tsc -b && vite build`).
3. [x] Linter bersih tanpa blocking error (`oxlint`).
4. [x] Baseline produksi saat ini teridentifikasi dan terkunci:
   - Cloudflare Pages: Deployment `2c3cced9-fc9b-4bc7-857f-7826f9acd386` (HTTP 200 OK aktif).
   - Apps Script Production: Deployment `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A` (Version 3 aktif).
5. [x] Rollback plan terverifikasi dan siap dieksekusi dalam hitungan detik jika terjadi anomali.

---

## 2. PRODUCTION DEPLOYMENT PROCEDURE (WHEN APPROVED)

> **PERINGATAN:** Langkah-langkah di bawah ini hanya boleh dijalankan setelah pengguna memberikan konfirmasi persetujuan eksplisit.

### Langkah 1: Build Aset Produksi
```bash
npm run build
```
Memastikan folder `dist/` tergenerasi dengan aset bundle JavaScript, CSS, `robots.txt`, `sitemap.xml`, dan favicon terbaru.

### Langkah 2: Deploy Cloudflare Pages Production
```bash
npx wrangler pages deploy dist --project-name sleepykoala --branch master --commit-dirty=true
```
Mencatat UUID deployment baru yang dihasilkan dan memverifikasi status live pada `https://sleepykoala.pages.dev`.

### Langkah 3: Verifikasi Pasca-Deployment (Smoke Testing)
- `GET https://sleepykoala.pages.dev/` -> HTTP 200, logo studio muncul, title benar.
- `GET https://sleepykoala.pages.dev/projects` -> HTTP 200, 6 proyek terdaftar, filter berfungsi.
- `GET https://sleepykoala.pages.dev/projects/dompetnalar` -> HTTP 200, status "Siap Rilis", tidak ada link Play Store 404.
- `GET https://sleepykoala.pages.dev/projects/mobile-kasir` -> HTTP 200, tombol "Gabung Closed Testing" aktif.
- `GET https://sleepykoala.pages.dev/robots.txt` -> HTTP 200, Disallow `/admin`, Sitemap terhubung.
- `GET https://sleepykoala.pages.dev/sitemap.xml` -> HTTP 200, 9 URL kanonikal terdaftar.
- `GET https://sleepykoala.pages.dev/admin` -> HTTP 200, formulir OTP muncul, terlindungi.

---

## 3. ROLLBACK PROCEDURE (EMERGENCY RECOVERY)

Jika ditemukan masalah pasca-deployment pada Cloudflare Pages:

1. **Rollback Cloudflare Pages:**
   Gunakan deployment ID kanonikal yang telah terbukti stabil:
   - Target Rollback Cloudflare Deployment UUID: `2c3cced9-fc9b-4bc7-857f-7826f9acd386`
   *(Catatan: Jangan pernah melakukan rollback ke deployment `e67ff19b-2b76-4324-a287-ae17d2f72d4b` karena menghasilkan HTTP 503).*

2. **Rollback Backend Apps Script (Jika Diperlukan):**
   Jika terjadi isu pada Apps Script:
   - Target Rollback Backend: Version 2 (`@2`)
   - Syntax:
     ```bash
     npx clasp redeploy -V 2 -d "Emergency rollback to Version 2" AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A
     ```
   *(Catatan: Jangan pernah melakukan rollback ke Version 1 karena Version 1 tidak memiliki handler CMS).*

---

## 4. SIGN-OFF & DEPLOYMENT TRIGGER

Status saat ini:
**MILESTONE 6 IMPLEMENTATION COMPLETE — PRODUCTION OPERATION — RELEASE CANDIDATE READY — AWAITING HUMAN DEPLOYMENT APPROVAL**
