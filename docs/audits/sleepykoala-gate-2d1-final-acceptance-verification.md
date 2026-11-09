# SLEEPYKOALA CMS — LAPORAN VERIFIKASI PENERIMAAN AKHIR GATE 2D.1
## FINAL ACCEPTANCE VERIFICATION & CHECKPOINT INTEGRITY AUDIT
### STRICT READ-ONLY AUDIT — ZERO CODE / SCHEMA / DATA MODIFICATION

**Tanggal Audit:** 2026-11-01  
**Proyek:** SleepyKoala Studio — Indie Developer Portfolio CMS  
**Fase Audit:** Gate 2D.1 — Final Acceptance Verification & Checkpoint Integrity  
**Mode Operasional:** **STRICT READ-ONLY (Tanpa modifikasi kode, data, schema, atau deployment)**  
**Auditor:** Antigravity Senior Application Security Auditor & System Reliability Engineer  
**Keputusan Penerimaan Akhir:** **FAIL — REMEDIATION REQUIRED** *(Privasi Fallback Mengharuskan Remediasi)*  
**Status Lingkungan Produksi:** **100% TERISOLASI & TIDAK TERSENTUH (HARD STOP AKTIF)**

---

## 1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Sesuai instruksi audit operasional **Gate 2D.1**, telah dilakukan verifikasi penerimaan akhir yang independen, ketat, dan berbasis bukti faktual terhadap implementasi Gate 2D (`gate-2d-test-20261101-v1`).

Pemeriksaan ini dilakukan dalam mode **STRICT READ-ONLY** dengan tujuan menguji risiko spesifik tanpa mengasumsikan klaim laporan sebelumnya sebagai kebenaran mutlak. 

### Ringkasan Temuan Utama:
1. **Verifikasi Kritis A (Fallback & Privasi Publik) — [FAIL]:** Ditemukan kerentanan privasi berisiko **HIGH** pada `functions/api/projects.ts` dan `functions/api/projects/[slug].ts`. Ketika upstream Google Apps Script mengalami kegagalan, timeout, atau HTTP 502, sistem melakukan fallback statis tanpa syarat ke `src/data/projects.json` dan memaksakan status `publishState: 'PUBLISHED'` pada seluruh proyek baseline. Akibatnya, proyek baseline yang sengaja di-`DRAFT` atau di-`ARCHIVED` oleh admin di CMS akan **bocor dan muncul kembali ke publik** selama periode kegagalan upstream. Hal ini melanggar prinsip keamanan mutlak: *"Kegagalan upstream tidak boleh menyebabkan proyek yang sudah DRAFT atau ARCHIVED muncul kembali sebagai konten publik hanya karena fallback statis berisi data lama."*
2. **Verifikasi Kritis B (Bukti Integrasi Backend TEST) — [PARTIAL]:** Seluruh 291 pengujian pada test runner Vitest (`cmsGate2DFunctionalAcceptance.test.ts`, `cmsGate2CBinaryTransfer.test.ts`, dll.) berjalan menggunakan *in-memory mock/spies* (`vi.spyOn(globalThis, 'fetch')` dan stub responses). Tidak ada pengujian otomatis yang melakukan panggilan jaringan live HTTP ke Apps Script TEST (`script.google.com`) atau Google Drive API v3 secara langsung dalam test suite Gate 2D. Bukti live riil hanya tercatat pada audit operasional Gate 1B (live OTP curl) dan Gate 2B/2C metadata deployment.
3. **Verifikasi Kritis C (Konsistensi Proyek & Media) — [PASS WITH OBSERVATION]:** Kontrol akses relasional antara proyek dan media di level backend Apps Script dan Cloudflare Functions terbukti konsisten (media draft/archived atau media dari proyek draft/archived ditolak 404 `no-store, no-cache`). Ditemukan catatan teknis berisiko **LOW** (*dangling reference*) di mana penghapusan permanen media tidak membersihkan string referensi pada JSON `screenshots` di tabel proyek.
4. **Verifikasi Kritis D (Kepatuhan Biaya Nol / Zero-Cost) — [PASS WITH LIMITATION]:** Secara arsitektur, sistem terkunci pada paket gratis Rp0 (Cloudflare Pages Free, Apps Script Standard Consumer, Google Drive Free 15GB, batasan retry maksimal 3x). Namun, status kuota riil dan billing pada Google Cloud Console secara definitif berstatus `NOT VERIFIED VIA CONSOLE` karena ketiadaan hak akses pembacaan billing konsol.
5. **Verifikasi Kritis E (Integritas Checkpoint & Git) — [PASS]:** Seluruh 16 berkas inti yang tercantum dalam `gate-2d-test-checkpoint-manifest.md` terbukti memiliki hash SHA-256 yang **100% cocok dan identik** dengan berkas pada disk.
6. **Batas Lingkungan Produksi — [PASS]:** Script ID produksi `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`, spreadsheet produksi, dan `TesterRegistrations` **100% tidak tersentuh**. Google Play Hybrid Sync tetap **PAUSED**.

---

## 2. SCOPE DAN METODE PEMERIKSAAN

Audit ini dilakukan dengan membatasi diri secara ketat pada analisis statis, penelusuran kode, verifikasi integritas kriptografis, dan evaluasi hasil pengujian yang sudah ada:

- **Metode Pemeriksaan:**
  - *Source Code Tracing:* Penelusuran alur eksekusi `functions/api/projects.ts`, `functions/api/projects/[slug].ts`, `functions/api/media/[mediaId].ts`, `src/services/projectService.ts`, dan `backend/test_gas/Code.gs`.
  - *Cryptographic Verification:* Perhitungan ulang hash SHA-256 seluruh berkas menggunakan algoritma SHA-256 kanonikal dan pencocokan terhadap manifest checkpoint.
  - *Test Rigor Inspection:* Audit terhadap berkas-berkas `src/test/` untuk membedakan antara *unit test*, *mock server integration*, dan *live network execution*.
  - *Git State Inspection:* Pemeriksaan branch, HEAD commit, dan status working tree.
- **Larangan yang Ditegakkan:**
  - Tidak ada berkas kode sumber yang diubah.
  - Tidak ada perintah `clasp push` atau mutasi deployment.
  - Tidak ada request jaringan live yang memutasi data Google Sheets atau Google Drive.
  - Tidak ada pengiriman OTP atau email.
  - Tidak ada aktivasi billing atau upgrade layanan.

---

## 3. EVIDENCE MATRIX (MATRIKS BUKTI INTEGRASI)

Berikut adalah matriks klasifikasi bukti faktual pada seluruh fitur CMS SleepyKoala:

| Fitur CMS | Mock / Stub Test | Live TEST Evidence (Network/API) | Browser / E2E Evidence | Status Bukti Faktual |
|---|:---:|:---:|:---:|:---:|
| **Admin Authentication & Session** | `adminAuth.test.ts` (55 tests)<br>`cmsGate2DFunctionalAcceptance.test.ts` | Gate 1B Live OTP Verification Log (`AKfycbx...`) | JSDOM unit tests (React Testing Library) | **VERIFIED (Mock + Historical Live OTP)** |
| **Project List / Read** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.2)<br>`cmsCrud.test.ts` | Apps Script Deployment V5 Code Audit (`handleCmsGetProjects`) | JSDOM unit render | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Project Create / Update** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.1, 1.5) | Deployment V5 Code Audit (`handleAdminSaveProject`) | JSDOM UI interaction | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Publish / Unpublish** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.6, 1.9) | Deployment V5 Code Audit (`publishState` transition) | JSDOM UI interaction | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Archive / Restore** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.11, 1.13) | Deployment V5 Code Audit (`publishState: 'ARCHIVED'`) | JSDOM UI interaction | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Project Reorder** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.13) | Deployment V5 Code Audit (`handleAdminReorderProjects`) | JSDOM UI interaction | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Audit Logging** | `auditLog.test.ts` (14 tests) | Deployment V5 Code Audit (`CMS_AuditLogs` append) | N/A (Backend) | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Media Upload** | `cmsMedia.test.ts` (57 tests)<br>`cmsGate2DFunctionalAcceptance.test.ts` (2.1) | Gate 2B Live Operational Report (Drive v3 schema check) | JSDOM file upload event | **VERIFIED VIA MOCK & ADAPTER AUDIT** |
| **Media Preview (Admin)** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 2.2)<br>`cmsGate2CBinaryTransfer.test.ts` | Base64-Binary memory pipeline audit | JSDOM image render | **VERIFIED VIA MOCK & PIPELINE AUDIT** |
| **Media Replace** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 2.4)<br>`cmsMediaService.test.ts` | Dual-phase upload & archive logic audit | JSDOM UI interaction | **VERIFIED VIA MOCK & SERVICE AUDIT** |
| **Media Archive / Restore** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 2.5) | Deployment V5 Code Audit (`CMS_Media` visibility) | JSDOM UI interaction | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Permanent Delete** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 2.5) | Deployment V5 Code Audit (`Drive.Files.remove`) | JSDOM modal confirmation | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Public Project Listing** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.7) | Fallback & upstream proxy code audit | `components.test.tsx` (JSDOM) | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Public Project Detail** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.8) | Fallback & slug resolver code audit | `ProjectDetailPage.tsx` in JSDOM | **VERIFIED VIA MOCK & CODE AUDIT** |
| **Draft / Archived Privacy** | `cmsGate2DFunctionalAcceptance.test.ts` (Test 1.3, 1.4, 1.10, 1.12, 3.1, 3.2) | Fail-closed relational filter audit | JSDOM 404 view | **FAIL ON FALLBACK OUTAGE SCENARIO** |

*Catatan: Seluruh tes integrasi Gate 2D yang berjalan otomatis pada CI/test-runner menggunakan mock fetch (`vi.spyOn(globalThis, 'fetch')`). Tidak ada pengujian browser nyata (Playwright/Puppeteer/Selenium) atau panggilan jaringan internet live ke Google Drive selama `npm test`.*

---

## 4. HASIL VERIFIKASI KRITIS A — FALLBACK DAN PRIVASI PUBLIK

**Status Verifikasi:** **FAIL (TIDAK LULUS)**

### Analisis Skenario Operasional:

| Skenario | Deskripsi Skenario | Dampak pada Halaman Publik | Dampak pada Direct URL (`/projects/:slug`) | Resiko Kebocoran Data Lama? | Status Keamanan |
|:---:|---|---|---|:---:|:---:|
| **1** | Proyek PUBLISHED ada di backend dan fallback | Proyek tampil normal | HTTP 200 OK | Tidak (data sinkron) | **AMAN** |
| **2** | Proyek diubah dari PUBLISHED menjadi DRAFT | Jika backend normal: Proyek hilang.<br>**Jika backend gagal: Proyek MUNCUL KEMBALI dari fallback!** | Jika backend normal: 404.<br>**Jika backend gagal: 200 OK dari fallback!** | **YA, BOCOR DARI FALLBACK** | **FAIL** |
| **3** | Proyek diubah dari PUBLISHED menjadi ARCHIVED | Jika backend normal: Proyek hilang.<br>**Jika backend gagal: Proyek MUNCUL KEMBALI dari fallback!** | Jika backend normal: 404.<br>**Jika backend gagal: 200 OK dari fallback!** | **YA, BOCOR DARI FALLBACK** | **FAIL** |
| **4** | Proyek dihapus dari CMS backend | Proyek baru: tidak tampil.<br>**Proyek baseline: MUNCUL KEMBALI dari fallback!** | Proyek baru: 404.<br>**Proyek baseline: 200 OK dari fallback!** | **YA, UNTUK BASELINE PROJECTS** | **FAIL** |
| **5** | Backend gagal setelah perubahan status publikasi | Fallback aktif. Proyek yang baru saja di-draft/diarsip seketika tampil sebagai publik. | Mengembalikan 200 OK dengan payload `projects.json`. | **YA, REVERT OTOMATIS KE SNAPSHOT STATIS** | **FAIL** |
| **6** | Backend gagal saat fallback menyimpan snapshot lama | Snapshot `projects.json` menyajikan proyek dengan `publishState: 'PUBLISHED'` tanpa memedulikan status CMS. | Mengembalikan 200 OK untuk setiap slug yang ada di `projects.json`. | **YA, DATA USANG TERPUBLIKASI** | **FAIL** |
| **7** | Backend kembali normal setelah gagal | Proyek draft/arsip kembali hilang dari UI publik. | Direct URL kembali merespons 404 `no-store, no-cache`. | Data pulih, namun telah terjadi kebocoran sementara selama outage. | **PULIH (TEMPORARY LEAKAGE OCCURRED)** |

### Bukti Kode Kerentanan:
1. Pada `functions/api/projects.ts` baris 73–76 & 94–97:
```typescript
// Upstream unavailable, timed out, or returned error -> Fallback statis terdokumentasi
console.warn('[Projects API] Upstream Apps Script tidak tersedia atau merespons error, menggunakan fallback statis.');
const staticPublished = (rawProjects as any[]).map((p) => ({
  ...p,
  publishState: 'PUBLISHED', // <-- MEMAKSAKAN SEMUA PROYEK BASELINE JADI PUBLISHED!
}));
```
2. Pada `functions/api/projects/[slug].ts` baris 93–119:
```typescript
// Fallback search in rawProjects
const fallbackMatched = (rawProjects as any[]).find((p) => p.slug.toLowerCase() === slug);
if (!fallbackMatched) { ... }
return new Response(JSON.stringify({
  success: true,
  data: {
    ...fallbackMatched,
    publishState: 'PUBLISHED', // <-- MENGEMBALIKAN 200 DENGAN STATUS PUBLISHED!
  },
  source: 'fallback-static',
}), { status: 200, ... });
```
3. Pada `src/services/projectService.ts` baris 42–45:
```typescript
const initialStaticProjects: readonly Project[] = (rawProjects as unknown[]).filter(isValidProject);
let activeProjects: readonly Project[] = initialStaticProjects;
```

**Kesimpulan Evaluasi:** Implementasi fallback statis saat ini tidak membedakan proyek yang secara sengaja dicabut publikasinya dengan proyek yang sah untuk dipublikasikan. Kehadiran header `X-Data-Source: fallback-static` tidak mencegah browser merender proyek privat kepada publik.

---

## 5. HASIL VERIFIKASI KRITIS B — INTEGRASI BACKEND TEST NYATA

**Status Verifikasi:** **PARTIAL (TIDAK ADA PENGUJIAN JARINGAN LIVE DALAM GATE 2D RUNNER)**

- **Temuan Pengujian Otomatis:**
  Seluruh 291 pengujian pada 14 file pengujian di `src/test/` mengeksekusi kode Cloudflare Pages Functions dan modul client di dalam runner Vitest berbasis lingkungan simulasi JSDOM/Node.js.
- **Mekanisme Mocking:**
  Komunikasi M2M ke Apps Script di-mock menggunakan:
  ```typescript
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    return new Response(JSON.stringify({ ... }), { status: 200, ... });
  });
  ```
- **Fakta Operasional:**
  Tidak ada satupun tes dalam `npm test` yang mengirimkan paket TCP/HTTPS nyata ke endpoint `https://script.google.com/macros/s/AKfycb.../exec` atau Google Drive API v3. 
- **Klasifikasi Bukti:**
  Klaim "Live Integration" pada laporan Gate 2D harus diklasifikasikan secara jujur sebagai:
  - **Mock Integration & Contract Validation:** Memvalidasi bahwa kode Pages Functions dan UI merespons kontrak JSON Apps Script dan Drive API dengan benar.
  - **Live Backend Ready:** Kode Apps Script telah dideploy pada Versi 5 (`AKfycbxkvhdjjdD...`), namun eksekusi jaringan live tidak dijalankan secara otomatis dalam test suite rutin untuk menjaga isolasi dan mencegah konsumsi kuota.

---

## 6. HASIL VERIFIKASI KRITIS C — KONSISTENSI PROYEK DAN MEDIA

**Status Verifikasi:** **PASS WITH OBSERVATION**

### Pemeriksaan Aturan Relasional:
1. **Proyek DRAFT $\rightarrow$ Media Privat:** **AMAN (PASS)**  
   Pada `backend/test_gas/Code.gs` baris 2561–2585, `handleCmsGetPublicMedia` memeriksa status proyek induk (`pState === 'PUBLISHED'`). Jika proyek berstatus DRAFT, request mengembalikan 404 `NOT_FOUND`.
2. **Proyek ARCHIVED $\rightarrow$ Media Privat:** **AMAN (PASS)**  
   Jika proyek induk berstatus ARCHIVED, request ke `/api/media/:mediaId` mengembalikan 404 `NOT_FOUND`.
3. **Media DRAFT & ARCHIVED $\rightarrow$ Publik:** **AMAN (PASS)**  
   Pada `backend/test_gas/Code.gs` baris 2557, jika `mediaVisibility !== 'PUBLISHED'`, seketika mengembalikan 404 `NOT_FOUND`.
4. **Isolasi Media Proxy Cloudflare:** **AMAN (PASS)**  
   Pada `functions/api/media/[mediaId].ts`, endpoint publik TIDAK memiliki fallback statis. Jika upstream merespons 404, 502, atau 504, media proxy merespons dengan header `Cache-Control: no-store, no-cache, must-revalidate`.
5. **Observasi Konsistensi (Dangling References):** **CATATAN LOW**  
   Pada `backend/test_gas/Code.gs` baris 2324–2340 (`handleAdminDeleteMedia` dengan `permanent: true`), baris media dihapus dari spreadsheet `CMS_Media` dan berkas dihapus dari Google Drive. Namun, sistem tidak melakukan sanitasi otomatis terhadap array JSON `screenshots` atau string `iconUrl` pada proyek terkait di `CMS_Projects`. Referensi yang tertinggal akan menghasilkan error gambar 404 di frontend jika proyek tidak diedit secara manual.

---

## 7. HASIL VERIFIKASI KRITIS D — ZERO-COST / FREE-TIER COMPLIANCE

**Status Verifikasi:** **PASS WITH LIMITATION (BELUM TERVERIFIKASI DI KONSOL GCP)**

### Analisis Kepatuhan Beban Biaya:
1. **Tidak Ada Layanan Berbayar Terdeteksi:** Tidak ada penggunaan Cloudflare Workers KV berbayar, Cloudflare Images berbayar, Google Cloud Storage buckets berbayar, atau Third-Party Paid APIs.
2. **Hard-Cap Rejection:** 
   - Cloudflare Pages Free: Dibatasi 100.000 requests/hari. Jika kuota habis, Cloudflare menolak dengan HTTP 429 tanpa biaya tambahan.
   - Google Apps Script: Dibatasi kuota eksekusi 90 menit/hari. Jika habis, Google mengembalikan pesan kuota terlampaui tanpa tagihan finansial.
   - Google Drive: Dibatasi kuota gratis 15 GB akun personal.
3. **Keterbatasan Verifikasi:**
   Sesuai batasan mutlak proyek (dilarang mengakses akun penagihan/billing dan dilarang mengubah konfigurasi akun), parameter kuota spesifik pada Google Cloud Console berstatus **`NOT VERIFIED VIA CONSOLE`**. Namun secara arsitektur, tidak ada risiko finansial karena tidak ada instrumen pembayaran yang terhubung.
4. **Perlindungan Terhadap Retry Storms:**
   Pada `GoogleDriveMediaStorageProvider.ts` dan `backend/test_gas/Code.gs`, seluruh operasi retry dibatasi maksimal 3 kali percobaan dengan interval exponential backoff (300–500 ms). Tidak ada loop tak berhingga (*infinite retry loop*).

---

## 8. HASIL PEMERIKSAAN CHECKPOINT DAN INTEGRITAS GIT

**Status Verifikasi:** **PASS (INTEGRITAS KRIPTOGRAFIS 100% SESUAI)**

### 8.1. Verifikasi Hash SHA-256 Terhadap Manifest Checkpoint
Seluruh berkas yang terdaftar dalam [`gate-2d-test-checkpoint-manifest.md`](file:///e:/Antigravity%20Project/indie-developer-portfolio/docs/checkpoints/gate-2d-test/gate-2d-test-checkpoint-manifest.md) telah dihitung ulang hash SHA-256-nya pada disk aktual:

| Path Berkas | Hash Manifest | Hash Aktual pada Disk | Status Kesesuaian |
|---|---|---|:---:|
| `functions/api/projects.ts` | `CF978692...` | `CF978692...` | **IDENTIK (MATCH)** |
| `functions/api/projects/[slug].ts` | `9628AADD...` | `9628AADD...` | **IDENTIK (MATCH)** |
| `functions/api/admin/projects.ts` | `D4C2A666...` | `D4C2A666...` | **IDENTIK (MATCH)** |
| `functions/api/admin/media.ts` | `459D2514...` | `459D2514...` | **IDENTIK (MATCH)** |
| `functions/api/admin/media/[mediaId].ts` | `37DDA797...` | `37DDA797...` | **IDENTIK (MATCH)** |
| `functions/api/media/[mediaId].ts` | `F4900DFE...` | `F4900DFE...` | **IDENTIK (MATCH)** |
| `src/services/projectService.ts` | `5F403723...` | `5F403723...` | **IDENTIK (MATCH)** |
| `src/services/cmsProjectService.ts` | `DC9A659A...` | `DC9A659A...` | **IDENTIK (MATCH)** |
| `src/services/cmsMediaService.ts` | `22975DF1...` | `22975DF1...` | **IDENTIK (MATCH)** |
| `src/pages/AdminPage.tsx` | `EED879E5...` | `EED879E5...` | **IDENTIK (MATCH)** |
| `src/pages/HomePage.tsx` | `6C90AB20...` | `6C90AB20...` | **IDENTIK (MATCH)** |
| `src/pages/ProjectsPage.tsx` | `245967AC...` | `245967AC...` | **IDENTIK (MATCH)** |
| `src/pages/ProjectDetailPage.tsx` | `0E533683...` | `0E533683...` | **IDENTIK (MATCH)** |
| `src/pages/FeedbackPage.tsx` | `4D23B2D3...` | `4D23B2D3...` | **IDENTIK (MATCH)** |
| `src/test/cmsGate2DFunctionalAcceptance.test.ts` | `5522F8A9...` | `5522F8A9...` | **IDENTIK (MATCH)** |
| `backend/test_gas/Code.gs` | `876F8C50...` | `876F8C50...` | **IDENTIK (MATCH)** |

### 8.2. Status Git Repository
- **Active Branch:** `master`
- **Current HEAD:** `cae5405 fix(typography): restore original dark developer studio accent palette, enforce solid typography without text gradients`
- **Working Tree State:** Terdapat 17 file termodifikasi dan direktori baru yang belum di-commit (`backend/`, `docs/`, `functions/`, dll.). Sesuai instruksi audit, kondisi working tree dipertahankan tanpa perubahan (*no git reset/checkout/clean*). Perubahan ini merupakan akumulasi implementasi dari Gate 1A hingga Gate 2D yang didokumentasikan dalam checkpoint.

---

## 9. CONFIRMATION OF ENVIRONMENT BOUNDARIES

Batas isolasi lingkungan diverifikasi tetap utuh dan terlindungi:
1. **Apps Script Produksi:** Script ID `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` berada di `backend/gas/.clasp.json` dan **TIDAK PERNAH DIJALANKAN** `clasp push`.
2. **Spreadsheet Produksi:** ID spreadsheet produksi dan tab `TesterRegistrations` **100% TIDAK TERSENTUH**.
3. **Google Play Hybrid Sync:** Parameter `IS_PLAY_STORE_SYNC_PAUSED = true` tetap aktif, sinkronisasi **PAUSED**.
4. **Cloudflare Production:** Tidak ada eksekusi `wrangler pages deploy` ke production environment.
5. **Kerahasiaan Kredensial:** Berkas secret `.dev.vars` dan `webcredential.txt` tidak pernah dimodifikasi atau dicetak.

---

## 10. DAFTAR TEMUAN, RISIKO, DAN TINGKAT KEPARAHAN

### FINDING-2D1-01: Static Fallback Causes Information Disclosure of Draft/Archived Baseline Projects During Upstream Failure
- **Tingkat Keparahan:** **HIGH**
- **Lokasi:** `functions/api/projects.ts` (baris 73–76, 94–97), `functions/api/projects/[slug].ts` (baris 93–119).
- **Bukti Aktual:**
  Kode memetakan seluruh array `rawProjects` (`src/data/projects.json`) menjadi `publishState: 'PUBLISHED'` saat terjadi exception atau kegagalan backend. Jika proyek baseline (misalnya `worklume` atau `idle-mining`) di-draft atau diarsipkan di CMS, kegagalan upstream akan menyebabkan proyek tersebut tampil kembali ke publik.
- **Dampak:** Pelanggaran privasi dan inkonsistensi status publikasi. Pengguna publik dapat melihat proyek yang seharusnya tersembunyi selama masa kegagalan jaringan Apps Script.
- **Status Verifikasi:** **VERIFIED (REPRODUCIBLE CODE PATH)**
- **Rekomendasi (Tanpa Implementasi):**
  Pada tahap perbaikan berikutnya (Gate 2D.2), mekanisme fallback tidak boleh memaksakan status `PUBLISHED` pada seluruh berkas statis, atau fallback publik hanya boleh menyajikan proyek yang secara eksplisit tidak memiliki tombstone/penarikan, atau mengembalikan respons degradasi yang aman (*graceful degraded state*) tanpa memaparkan data usang.

### FINDING-2D1-02: Test Runner Suite Relies Exclusively on In-Memory Mocks Without Live Network Verification
- **Tingkat Keparahan:** **MEDIUM**
- **Lokasi:** `src/test/cmsGate2DFunctionalAcceptance.test.ts`.
- **Bukti Aktual:**
  Panggilan `callGasBackend` diuji melalui `vi.spyOn(globalThis, 'fetch')` dengan data tiruan (*mock responses*).
- **Dampak:** Tingkat kepercayaan terhadap integrasi live berbasis bukti historis dan verifikasi kontrak, bukan pembuktian jaringan real-time pada setiap eksekusi runner.
- **Status Verifikasi:** **VERIFIED**
- **Rekomendasi:** Dokumentasikan batas ini dalam dokumen operasional. Jalankan verifikasi *smoke test* live terisolasi secara periodik saat diberikan otorisasi khusus.

### FINDING-2D1-03: Permanent Media Deletion Leaves Dangling References in Project Metadata
- **Tingkat Keparahan:** **LOW**
- **Lokasi:** `backend/test_gas/Code.gs` (`handleAdminDeleteMedia`, baris 2324–2340).
- **Bukti Aktual:**
  Penghapusan media secara fisik menghapus baris di `CMS_Media` dan berkas di Google Drive, namun tidak membersihkan ID media dari JSON `screenshots` di sheet `CMS_Projects`.
- **Dampak:** Pengunjung publik tidak mengalami kebocoran data (karena media mengembalikan 404), namun halaman portofolio dapat menampilkan placeholder gambar rusak jika admin tidak mengedit proyek.
- **Status Verifikasi:** **VERIFIED**
- **Rekomendasi:** Tambahkan verifikasi referensi proyek sebelum penghapusan permanen atau sanitasi metadata relasional.

### FINDING-2D1-04: Google Cloud Console Quota & Billing Status Unverifiable from Local Sandbox
- **Tingkat Keparahan:** **INFO**
- **Lokasi:** Google Cloud Console / Drive API v3 project quota.
- **Bukti Aktual:** Ketiadaan hak akses pembacaan konsol GCP dari lingkungan pengujian lokal.
- **Dampak:** Angka sisa kuota eksak di Google Cloud Console berstatus `NOT VERIFIED VIA CONSOLE`.
- **Status Verifikasi:** **UNVERIFIABLE WITHOUT CONSOLE ACCESS**
- **Rekomendasi:** Pertahankan arsitektur fail-closed dan batas retry maksimal 3 kali.

---

## 11. HAL YANG BELUM DAPAT DIVERIFIKASI (UNVERIFIED ITEMS)

1. **Live Network Round-Trip pada Eksekusi Test Runner:** Vitest tidak menjalankan request HTTP melintasi internet ke Google Apps Script selama pengujian otomatis demi mencegah flakiness dan kuota habis.
2. **Tampilan Nyata pada Browser Headed:** Pengujian antarmuka frontend saat ini mengandalkan JSDOM dan React Testing Library, belum melibatkan engine peramban nyata (*Chromium/Gecko*).
3. **Konfigurasi Kuota Konsol GCP:** Quota dashboard pada konsol Google Cloud tidak dapat diinspeksi secara langsung dari workspace lokal.

---

## 12. REKOMENDASI TINDAK LANJUT

1. **Jadwalkan Gate 2D.2 Remediasi Fallback:** Lakukan perbaikan terfokus pada `functions/api/projects.ts` dan `functions/api/projects/[slug].ts` untuk memastikan kegagalan upstream tidak membocorkan proyek berstatus DRAFT atau ARCHIVED.
2. **Pertahankan Pembekuan (Freeze):** Jangan melakukan deployment produksi sebelum kerentanan fallback (FINDING-2D1-01) diperbaiki dan diverifikasi ulang.
3. **Pertahankan Batas Lingkungan:** Script produksi dan spreadsheet produksi tetap terkunci 100%.

---

## 13. KEPUTUSAN PENERIMAAN AKHIR (FINAL ACCEPTANCE DECISION)

Berdasarkan aturan evaluasi Section 10 pada panduan instruksi audit:
> *"FAIL — REMEDIATION REQUIRED: Jika ditemukan pelanggaran privasi, akses tidak sah, kebocoran data, atau kegagalan integritas yang terbukti. Jangan menurunkan tingkat keparahan hanya agar Gate 2D dapat dinyatakan lulus."*

Maka keputusan akhir audit Gate 2D.1 ditetapkan sebagai:

### **KEPUTUSAN: FAIL — REMEDIATION REQUIRED**
*(Alasan: Ditemukan jalur kegagalan fallback yang berpotensi membocorkan data proyek DRAFT/ARCHIVED ke publik saat terjadi gangguan upstream Apps Script — FINDING-2D1-01)*

---

## 14. PROTOKOL HARD STOP

Audit telah selesai secara lengkap dalam mode **READ-ONLY**.
- Tidak ada perbaikan kode yang dilakukan dalam sesi ini.
- Tidak ada deployment atau perubahan konfigurasi yang dijalankan.
- Tidak ada data produksi yang disentuh.
- Sistem berhenti dan menunggu arahan eksplisit Project Owner untuk tahap remediasi berikutnya.
