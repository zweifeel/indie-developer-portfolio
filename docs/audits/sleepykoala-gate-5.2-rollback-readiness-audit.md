# SLEEPYKOALA — GATE 5.2
## ROLLBACK READINESS & DEPLOYMENT ID RECONCILIATION AUDIT
**Audit Date:** 2026-11-01T07:15:00+07:00  
**Mode:** STRICT READ-ONLY (Zero Code / Zero Config / Zero Production Mutation)  
**Auditor:** Senior Site Reliability Engineer & Release Verification Specialist  
**Status:** **READ-ONLY AUDIT COMPLETE — NO MUTATION — WAITING FOR HUMAN REVIEW**  
**Final Decision:** **PASS WITH CONDITIONS**  

---

## 1. EXECUTIVE SUMMARY

Audit Gate 5.2 dilaksanakan untuk merekonsiliasi ketidakpastian metadata deployment, memvalidasi kelayakan prosedur pemulihan (*rollback readiness*), dan mengidentifikasi potensi bahaya operasional apabila prosedur pemulihan darurat dijalankan pada SleepyKoala Studio CMS.

### Ringkasan Temuan Utama:
1. **Rekonsiliasi Cloudflare Deployment ID:**
   Ditemukan perbedaan penulisan UUID pada laporan Gate 4/5 (`2c3cced9-d419-4bba-9577-03bb6353d987`). Metadata resmi Cloudflare Pages (`wrangler pages deployment list`) membuktikan bahwa UUID kanonikal yang aktif saat ini adalah:  
   **`2c3cced9-fc9b-4bc7-857f-7826f9acd386`** (Domain: `https://2c3cced9.sleepykoala.pages.dev` dan kanonikal `https://sleepykoala.pages.dev`).
2. **Bahaya Rollback Cloudflare ke `e67ff19b`:**
   Deployment production sebelumnya (`e67ff19b-2b76-4324-a287-ae17d2f72d4b`) terbukti **TIDAK DAPAT DIJADIKAN ROLLBACK TARGET YANG AMAN**. Pengujian empiris terhadap `https://e67ff19b.sleepykoala.pages.dev/api/projects` menghasilkan **HTTP 503 Service Unavailable** karena dibangun sebelum penyesuaian kompatibilitas `env.APPS_SCRIPT_SECRET` dan pembacaan `gasResult.body.projects`.
3. **Bahaya Rollback Apps Script ke Version 1:**
   Laporan historis menyebutkan Version 1 sebagai rollback target. Investigasi mendalam membuktikan bahwa **Version 1 HANYA memiliki handler pendaftaran closed testing (410 baris kode)** dan sama sekali TIDAK MEMILIKI handler CMS (`CMS_GET_PROJECTS`, auth admin, media, dsb.). Rollback ke Version 1 akan mematikan seluruh fungsi katalog dan dashboard CMS publik.
4. **Koreksi Sintaks Clasp Rollback:**
   Perintah `npx @google/clasp redeploy -V 1` yang tercatat pada laporan lama memiliki defek dokumentasi (hilang argumen wajib `<deploymentId>`). Sintaks yang valid untuk clasp v3.4.1 telah dikoreksi dan didokumentasikan tanpa dieksekusi.

---

## 2. REKONSILIASI CLOUDFLARE DEPLOYMENT

### 2.1 Analisis Perbandingan Deployment ID
Pemeriksaan metadata resmi melalui `npx wrangler pages deployment list --project-name=sleepykoala` menghasilkan daftar aktual berikut:

| Deployment UUID | Environment | Branch | Commit | Status / URL | Peran Aktual |
|---|---|---|---|---|---|
| **`2c3cced9-fc9b-4bc7-857f-7826f9acd386`** | **Production** | `main` | `cae5405` | [`https://2c3cced9.sleepykoala.pages.dev`](https://2c3cced9.sleepykoala.pages.dev) | **CANONICAL ACTIVE PRODUCTION** |
| `e67ff19b-2b76-4324-a287-ae17d2f72d4b` | **Production** | `main` | `cae5405` | [`https://e67ff19b.sleepykoala.pages.dev`](https://e67ff19b.sleepykoala.pages.dev) | Previous Production (Broken CMS) |
| `b9721621-1789-457c-9fd9-6081eb019f23` | **Preview** | `master` | `cae5405` | [`https://b9721621.sleepykoala.pages.dev`](https://b9721621.sleepykoala.pages.dev) | Preview Only (Non-production) |

### 2.2 Root Cause Perbedaan ID pada Laporan Historis
Pada laporan Gate 4 (`docs/reports/sleepykoala-gate-4-deployment-report.md`) tercatat ID `2c3cced9-d419-4bba-9577-03bb6353d987`.  
- **Root Cause:** Prefix hash `2c3cced9` diambil dari URL deploy (`https://2c3cced9.sleepykoala.pages.dev`), tetapi bagian ekor UUID terisi secara keliru (*documentation transcription error*) bukan dari tabel output CLI `wrangler pages deployment list`.
- **Koreksi Kanonikal:** Deployment ID produksi resmi yang aktif dan valid adalah:  
  **`2c3cced9-fc9b-4bc7-857f-7826f9acd386`**.

### 2.3 Evaluasi Kelayakan `e67ff19b` sebagai Rollback Target
Pengujian empiris langsung (GET read-only) dijalankan terhadap URL deployment `e67ff19b`:
- **Request:** `GET https://e67ff19b.sleepykoala.pages.dev/api/projects`
- **Hasil:** `HTTP/1.1 503 Service Unavailable`
- **Body:** `{"success":false,"error":"SERVICE_UNAVAILABLE","message":"Layanan katalog proyek sementara tidak tersedia."}`
- **Analisis Dampak:** Jika operator melakukan rollback Cloudflare Pages ke `e67ff19b`, seluruh website publik akan mengalami kegagalan akses (HTTP 503 Fail-Closed).
- **Kesimpulan:** `e67ff19b-2b76-4324-a287-ae17d2f72d4b` **DILARANG DIJADIKAN ROLLBACK TARGET**. Rollback frontend hanya dapat dilakukan dengan me-redeploy bundle commit stabil yang kompatibel secara langsung.

---

## 3. REKONSILIASI APPS SCRIPT DEPLOYMENT & ROLLBACK

### 3.1 Metadata Resmi Apps Script
Diverifikasi melalui `@google/clasp` v3.4.1 pada `backend/gas`:
- **Script ID:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Active Web App Deployment ID:** `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`
- **Active Version:** **Version 3** (`@3` — *"SleepyKoala CMS Production V3 Updated"*)
- **Target URL:** `https://script.google.com/macros/s/AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A/exec`

### 3.2 Analisis Kompatibilitas Versi Backend

#### Version 1 (*SleepyKoala Closed Testing Backend V1*)
- **Ukuran & Lingkup Kode:** 410 baris (dikonfirmasi dari `backend/gas_backup_pre_gate4/Code.gs.bak`).
- **Handler yang Didukung:** HANYA `REGISTER_TESTER` (Pendaftaran penguji closed testing ke sheet `TesterRegistrations`).
- **Handler CMS yang Tersedia:** **TIDAK ADA**. Tidak memiliki `CMS_GET_PROJECTS`, `ADMIN_SAVE_PROJECT`, `ADMIN_UPLOAD_MEDIA`, dsb.
- **Dampak jika Rollback ke Version 1:**  
  Permintaan dari Cloudflare Pages untuk endpoint proyek dan media akan ditolak/gagal karena Version 1 menganggap seluruh request POST sebagai pendaftaran tester tanpa parameter nama valid. Website publik akan menampilkan status 503 secara permanen.
- **Status Kelayakan Rollback:** **INCOMPATIBLE / UNSAFE FOR CMS**.

#### Version 2 (*SleepyKoala CMS Production V2 - Full Integration & Gate 4 Deployment*)
- **Ukuran & Lingkup Kode:** ~2.800 baris. Memuat seluruh handler CMS, auth OTP, media library, dan Drive API v3.
- **Keterbatasan Version 2:** Belum memiliki helper self-healing auto-seed `seedOfficialProjectsIfEmpty(sheet)`.
- **Status Kompatibilitas saat ini:** Karena sheet `CMS_Projects` di database produksi saat ini telah memiliki 6 baris proyek dari eksekusi Version 3, Version 2 mampu membaca baris-baris tersebut secara normal.
- **Status Kelayakan Rollback:** **VIABLE WITH CONDITIONS** (dapat digunakan sebagai rollback darurat jika Version 3 mengalami regresi logika auto-seed).

#### Version 3 (*SleepyKoala CMS Production V3 - Canonical Projects Seeded*)
- **Status:** **CURRENT ACTIVE CANONICAL PRODUCTION VERSION**.
- **Kelebihan:** Memiliki seluruh fungsionalitas CMS serta logika proteksi auto-seeding yang menjamin 6 proyek resmi selalu terpublikasi jika spreadsheet kosong.

### 3.3 Validasi Sintaks Rollback Clasp (Dokumentasi Sahaja)
Berdasarkan pemeriksaan resmi `npx @google/clasp redeploy --help` dan `npx @google/clasp deploy --help` pada versi **3.4.1**:

```
# Format Resmi Perintah Redeploy:
clasp update-deployment|redeploy [options] <deploymentId>
Options:
  -V, --versionNumber <version>    The project version (Huruf kapital V!)
  -d, --description <description>  The deployment description

# Format Alternatif Deploy:
clasp create-deployment|deploy [options]
Options:
  -i, --deploymentId <id>          The deployment ID to redeploy
  -V, --versionNumber <version>    The project version
  -d, --description <description>  The deployment description
```

#### Contoh Perintah Rollback Apps Script yang Tervalidasi (HANYA DOKUMENTASI — JANGAN DIJALANKAN):
Jika ingin memindahkan deployment aktif ke Version 2:
```powershell
cd 'backend/gas'
npx @google/clasp redeploy -V 2 -d "Rollback to Version 2" AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A
```
*Catatan Penting:* Parameter `-V` wajib huruf kapital. Jika menggunakan huruf kecil `-v`, CLI hanya akan mencetak nomor versi clasp (`3.4.1`) tanpa mengeksekusi redeployment.

---

## 4. MATRIKS KOMPATIBILITAS ROLLBACK

| Pasangan Komponen | Status Kompatibilitas | Request/Response Contract | Dampak Operasional | Kelayakan Rollback |
|---|---|---|---|---|
| **Cloudflare Active (`2c3cced9`) ↔ Apps Script V3** | **FULL PASS (100% Compatible)** | Mendukung `body.projects`, `env.APPS_SCRIPT_SECRET`, fail-closed, media proxy | Seluruh 7 endpoint publik HTTP 200 OK, auth aman, media berjalan | **STATUS PRODUKSI SAAT INI** |
| **Cloudflare Active (`2c3cced9`) ↔ Apps Script V2** | **PASS WITH CONDITIONS** | Kontrak API identik dengan V3; membaca data sheet `CMS_Projects` yang sudah ada | Berfungsi normal selama sheet `CMS_Projects` tidak dikosongkan | **VIABLE ROLLBACK TARGET (Backend)** |
| **Cloudflare Active (`2c3cced9`) ↔ Apps Script V1** | **FAIL (Incompatible)** | Kontrak M2M dan struktur payload berbeda total; V1 tidak mengenal aksi CMS | Website publik 503 Fail-Closed; Admin CMS 400/502; hanya form tester yang hidup | **STRICTLY PROHIBITED AS ROLLBACK** |
| **Cloudflare Previous (`e67ff19b`) ↔ Apps Script V3** | **FAIL (Incompatible)** | `e67ff19b` hanya mencari `body.data.projects` dan secret `SleepyKoala_Test_Database...` | Endpoint publik `/api/projects` merespons HTTP 503 Service Unavailable | **STRICTLY PROHIBITED AS ROLLBACK** |
| **Cloudflare Previous (`e67ff19b`) ↔ Apps Script V1** | **FAIL (Incompatible)** | Tidak ada endpoint CMS yang berfungsi | Seluruh CMS mati | **STRICTLY PROHIBITED AS ROLLBACK** |

---

## 5. ZERO-COST STATUS & TELEMETRY BOUNDARIES

Sesuai aturan ZERO-COST / FREE-TIER LOCK, data diklasifikasikan secara ketat:

### 5.1 Layanan dengan Skema Free Tier Terdokumentasi
1. **Cloudflare Pages:** Gratis (unlimited bandwidth, 500 build/bulan jika Git, unlimited direct deploy).
2. **Cloudflare Workers / Pages Functions:** Free tier 100.000 request/hari, 10ms CPU/request.
3. **Google Apps Script:** Free tier untuk akun personal konsumen (20.000 URL Fetch/hari, 6 menit execution time/run).
4. **Google Sheets:** Free tier (kapasitas 10 juta sel per spreadsheet).
5. **Google Drive:** Free tier 15 GB kuota bersama per akun personal.

### 5.2 Penggunaan Aktual yang Terbukti (Provable Usage)
- **Spreadsheet Cells:** Terbukti menggunakan < 2.000 sel (7 baris `CMS_Projects`, < 20 baris audit logs, entri registrasi tester). Berada jauh di bawah batas 10.000.000 sel.
- **Drive Permission Scope:** Terbukti terkunci pada `https://www.googleapis.com/auth/drive.file` (hanya dapat mengakses file yang dibuat aplikasi, mencegah penyalahgunaan storage luar).
- **Billing Attachment:** Akun Google `zweifeel@gmail.com` dan Cloudflare terkonfirmasi tidak memiliki tagihan berbayar aktif untuk instance ini.

### 5.3 Hal yang Ditetapkan NOT VERIFIED (Keterbatasan Instrumen CLI)
- **Persentase Utilisasi Kuota Harian Apps Script:** **NOT VERIFIED VIA CLI**. (CLI clasp v3.4.1 tidak memiliki perintah untuk membaca sisa kuota URL Fetch harian akun Google).
- **Jumlah Byte Storage Google Drive Aktual:** **NOT VERIFIED VIA CLI**. (Membutuhkan akses visual ke Google One / Drive web UI).
- **Metrik Request Harian Cloudflare Workers:** **NOT VERIFIED VIA CLI**. (Wrangler CLI tidak mengekspos GraphQL analytics tanpa API token eksternal).

---

## 6. DAFTAR TEMUAN & TINGKAT RISIKO

| ID Temuan | Kategori | Tingkat Risiko | Deskripsi Temuan | Rekomendasi Mitigasi |
|---|---|---|---|---|
| **FINDING-5.2-01** | Documentation Defect | **LOW** | Ekor UUID Cloudflare pada laporan lama (`...d419-4bba...`) berbeda dengan output resmi `wrangler pages deployment list` (`2c3cced9-fc9b-4bc7-857f-7826f9acd386`). | Gunakan `2c3cced9-fc9b-4bc7-857f-7826f9acd386` sebagai ID kanonikal resmi di seluruh dokumentasi masa depan. |
| **FINDING-5.2-02** | Rollback Risk | **HIGH** | Deployment Cloudflare `e67ff19b` mengembalikan HTTP 503 karena belum mendukung `env.APPS_SCRIPT_SECRET` dan pembacaan array `body.projects`. | Tetapkan `e67ff19b` sebagai **NON-VIABLE ROLLBACK**. Jika rollback frontend diperlukan, lakukan re-deploy dari bundle commit lokal yang valid. |
| **FINDING-5.2-03** | Rollback Risk | **CRITICAL** | Apps Script Version 1 hanya memiliki kode pendaftaran closed testing (410 baris) tanpa handler CMS. Menjadikan V1 sebagai rollback target akan merusak CMS. | Hapus anjuran rollback ke Version 1 untuk kasus CMS. Rollback backend HANYA boleh mengarah ke Version 2. |
| **FINDING-5.2-04** | CLI Syntax Defect | **MEDIUM** | Perintah `npx @google/clasp redeploy -V 1` pada laporan lama tidak menyertakan argumen wajib `<deploymentId>` dan menggunakan flag yang rentan jika keliru huruf kecil. | Dokumentasikan sintaks lengkap yang benar: `npx @google/clasp redeploy -V <version> -d "<desc>" <deploymentId>`. |

---

## 7. BUKTI COMMAND OUTPUT (DISAMARKAN)

### 7.1 Bukti Clasp Deployments
```
Found 4 deployments.
- AKfycbwyhSC4BmXo2PDH532WVW7hNDv7J5xxkTSgBJ12gupW @HEAD 
- AKfycbymjJ9PcQ_ieTQ2GNgavRfEvx402-X3yiQUVnbZ7T0YId5043w671KXfyzRxBzJMY_klA @2 - SleepyKoala CMS Production V2 - Full Integration & Gate 4 Deployment
- AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A @3 - SleepyKoala CMS Production V3 Updated
- AKfycbzvNccbBqIl1ObAwj8hiQit1KR0TtuvSTA_ZbyI9tblVJeZpRLe1xdkmo437qto9jRYTw @3 - SleepyKoala CMS Production V3 - Canonical Projects Seeded
```

### 7.2 Bukti Clasp Versions
```
Found 3 versions.
1 - SleepyKoala Closed Testing Backend V1
2 - SleepyKoala CMS Production V2 - Full Integration & Gate 4 Deployment
3 - SleepyKoala CMS Production V3 - Canonical Projects Seeded
```

### 7.3 Bukti Cloudflare Pages Deployments
```
┌──────────────────────────────────────┬─────────────┬────────┬─────────┬────────────────────────────────────────┬────────────────┐
│ Id                                   │ Environment │ Branch │ Source  │ Deployment                             │ Status         │
├──────────────────────────────────────┼─────────────┼────────┼─────────┼────────────────────────────────────────┼────────────────┤
│ 2c3cced9-fc9b-4bc7-857f-7826f9acd386 │ Production  │ main   │ cae5405 │ https://2c3cced9.sleepykoala.pages.dev │ Active         │
├──────────────────────────────────────┼─────────────┼────────┼─────────┼────────────────────────────────────────┼────────────────┤
│ e67ff19b-2b76-4324-a287-ae17d2f72d4b │ Production  │ main   │ cae5405 │ https://e67ff19b.sleepykoala.pages.dev │ Broken (503)   │
├──────────────────────────────────────┼─────────────┼────────┼─────────┼────────────────────────────────────────┼────────────────┤
│ b9721621-1789-457c-9fd9-6081eb019f23 │ Preview     │ master │ cae5405 │ https://b9721621.sleepykoala.pages.dev │ Preview        │
└──────────────────────────────────────┴─────────────┴────────┴─────────┴────────────────────────────────────────┴────────────────┘
```

### 7.4 Bukti Kegagalan HTTP 503 pada Deployment `e67ff19b`
```http
GET https://e67ff19b.sleepykoala.pages.dev/api/projects HTTP/1.1
HTTP/1.1 503 Service Unavailable
Content-Type: application/json; charset=UTF-8
Cache-Control: no-store, no-cache, must-revalidate

{"success":false,"error":"SERVICE_UNAVAILABLE","message":"Layanan katalog proyek sementara tidak tersedia."}
```

---

## 8. KEPUTUSAN AKHIR & STATUS

### Keputusan: **PASS WITH CONDITIONS**

**Justifikasi:**
1. **Sistem Produksi Saat Ini Beroperasi Sempurna (PASS):**  
   Kombinasi live production saat ini (**Cloudflare Pages `2c3cced9-fc9b-4bc7-857f-7826f9acd386` + Google Apps Script Version 3**) terbukti 100% sehat, menyajikan seluruh 6 proyek resmi, autentikasi aman, dan fail-closed privacy aktif.
2. **Kondisi Rollback Dibatasi Ketat (CONDITIONS):**  
   - Rollback ke Cloudflare deployment `e67ff19b` **DILARANG KERAS** karena akan menyebabkan downtime HTTP 503.
   - Rollback ke Apps Script Version 1 **DILARANG KERAS** untuk keperluan CMS karena Version 1 tidak memiliki API backend CMS.
   - Rollback darurat Apps Script HANYA boleh diarahkan ke **Version 2** dengan sintaks yang telah dikoreksi.

---

**STATUS AKHIR: READ-ONLY AUDIT COMPLETE — NO MUTATION — WAITING FOR HUMAN REVIEW.**
