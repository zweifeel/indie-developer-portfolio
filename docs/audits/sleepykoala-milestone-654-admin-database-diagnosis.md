# SLEEPYKOALA STUDIO — MILESTONE 6.5.4
## WEB ADMIN DATABASE ENVIRONMENT MISMATCH & ZERO-METRICS INVESTIGATION AUDIT
### STRICT READ-ONLY AUDIT REPORT

**Date:** 2026-11-02  
**Auditor:** Antigravity Senior Release & Security Engineer  
**Audit Target:** Web Admin Dashboard (`https://sleepykoala.pages.dev/admin`)  
**Status:** **INVESTIGATION COMPLETE — ROOT CAUSE IDENTIFIED & PROVEN**  
**Final Decision:** `PRODUCTION ADMIN CONNECTED CORRECTLY — UI/METRICS ISSUE`

---

## 1. EXECUTIVE SUMMARY

Pemeriksaan mendalam telah dilakukan terhadap insiden di mana Administrator yang berhasil login ke Web Admin Production (`https://sleepykoala.pages.dev/admin`) menemukan dashboard menampilkan:
- Label UI: `CMS Admin v2.0 — Test Database`
- Metrik Proyek: Total Proyek = 0, Proyek Rilis = 0, Proyek Draft = 0, Proyek Arsip = 0
- Metrik Media: Total Media = 0, Media Rilis = 0, Media Draft = 0, Media Arsip = 0
- Riwayat Aktivitas: Audit Log Aktivitas = 0
- Teks Tabel: *"Belum Ada Proyek di Database TEST"*

Sementara itu, website publik pada `GET /api/projects` telah diverifikasi secara live mengembalikan **6 proyek resmi** dari database live Google Sheets Production.

### Temuan Utama (Root Causes):
1. **Bukan Masalah Database / Bukan Salah Environment:**
   Web Admin Production **100% terhubung ke Google Apps Script Production (Script ID: `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`, Deployment ID: `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A` Version 5)** dan membaca Google Spreadsheet Production yang sama dengan API publik.
2. **Defek Parsing Skema JSON di Client Service (Penyebab Angka 0):**
   - Google Apps Script Production (`backend/gas/Code.gs:1866`) mengembalikan data dengan skema flat:
     `{ success: true, error: null, message: "Data proyek berhasil dimuat.", projects: [...6 proyek...], count: 6 }`.
   - Edge Function `functions/api/admin/projects.ts:79` meneruskan payload Apps Script secara langsung (`return new Response(JSON.stringify(gasResult.body)...)`).
   - Namun, frontend client service `src/services/cmsProjectService.ts:53-56` mengecek:
     `if (json.success && json.data) { return { success: true, data: json.data.projects || [] }; }`
   - Karena properti `json.data` bernilai `undefined` (proyek berada di `json.projects`), pengecekan tersebut mengevaluasi ke `false`. Fungsi kemudian mengembalikan `{ success: false, message: "Data proyek berhasil dimuat." }`.
   - Akibatnya, `src/pages/AdminPage.tsx` tidak pernah memanggil `setProjects()`, sehingga state `projects` tetap berupa array kosong `[]`.
   - Hal yang sama persis terjadi pada `fetchAdminAuditLogs` (mengecek `json.data.logs`, padahal backend mengembalikan `json.logs`) dan `fetchProjectMedia` (mengecek `json.data.media`, padahal backend mengembalikan `json.media`).
3. **Penyebab Label "Test Database":**
   Label `Test Database` dan teks `Ringkasan Metrik Database TEST` terbukti **100% hardcoded sebagai string statis JSX** pada `src/pages/AdminPage.tsx` (baris 510, 577, 697, 702, 917, 1392) yang tertinggal saat pengembangan awal Gate 2, bukan berasal dari respons database atau environment detection.

---

## 2. PEMBUKTIAN TEKNIS ENVIRONMENT AKTIF

### 2.1 Verifikasi Backend Apps Script & Spreadsheet
- **Script ID Production:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Deployment ID Production:** `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`
- **Status Version:** Version 5 (`@5`), diperbarui pada Milestone 6.5.3.

**Bukti Konkret:**
1. Pengiriman OTP nyata ke `zweifeel@gmail.com` berhasil terjadi karena `functions/api/admin/auth/request-otp.ts` memanggil `callGasBackend(env, 'ADMIN_REQUEST_OTP', ...)`. Pada Cloudflare Pages Production, `GAS_WEBAPP_URL` mengarah ke deployment `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`.
2. Apps Script Production V5 mengeksekusi `MailApp.sendEmail()` dan menolak fallback mock. Pemilik proyek menerima OTP nyata dan berhasil login.
3. Fungsi `getTargetSpreadsheet()` di `backend/gas/Code.gs:219` dipanggil oleh semua handler CMS (`handleCmsGetProjects`, `handleAdminSaveProject`, dll).
4. Pemanggilan publik `GET https://sleepykoala.pages.dev/api/projects` pada Edge runtime memanggil `callGasBackend(env, 'CMS_GET_PROJECTS', { isPublicOnly: true })` ke deployment ID yang sama persis, menghasilkan HTTP 200 dengan header `X-Data-Source: cms-live` dan 6 proyek publik:
   - `dompetnalar`
   - `idle-master`
   - `mobile-kasir`
   - `idle-mining`
   - `the-broken-origin`
   - `worklume`

### 2.2 Penentuan M2M Environment di Cloudflare Pages
Pada `functions/api/admin/auth/utils.ts:54-85`:
```typescript
export function resolveM2MSecret(env: AuthEnv) {
  if (env.ENVIRONMENT === 'production') {
    if (env.APPS_SCRIPT_SECRET && env.APPS_SCRIPT_SECRET.trim().length > 0) {
      return { secret: env.APPS_SCRIPT_SECRET, environment: 'production' };
    }
  }
  // Fallback tanpa ENVIRONMENT eksplisit
  if (env.APPS_SCRIPT_SECRET !== undefined && env.APPS_SCRIPT_SECRET.trim().length > 0) {
    return { secret: env.APPS_SCRIPT_SECRET, environment: 'production' };
  }
  ...
}
```
Pada Cloudflare Pages Production:
- Secret `APPS_SCRIPT_SECRET` terpasang.
- `resolveM2MSecret(env)` mendeteksi environment `production`.
- Signature HMAC-SHA256 M2M berhasil diverifikasi oleh Google Apps Script Production V5.
- Tidak ada indikasi kegagalan M2M atau koneksi ke TEST deployment ID.

---

## 3. PERBANDINGAN SUMBER DATA: PUBLIC API VS ADMIN API

Tabel berikut menunjukkan perbedaan pemrosesan data antara Website Publik (yang berhasil menampilkan 6 proyek) dan Web Admin (yang menampilkan angka 0):

| Aspek | Public API (`/api/projects`) | Admin API (`/api/admin/projects`) |
| :--- | :--- | :--- |
| **Edge Function File** | `functions/api/projects.ts` | `functions/api/admin/projects.ts` |
| **GAS Action** | `CMS_GET_PROJECTS` (`isPublicOnly: true`) | `CMS_GET_PROJECTS` (`isPublicOnly: false`) |
| **GAS Response Payload** | `{ success: true, projects: [...], count: 6 }` | `{ success: true, projects: [...], count: 6 }` |
| **Edge Response Normalization** | **DINORMALISASI:**<br>`gasResult.body?.projects` dipetakan ke properti `{ data: publishedProjects }` | **TIDAK DINORMALISASI:**<br>`gasResult.body` dikirim langsung apa adanya tanpa wrapper `data` |
| **HTTP Body dikirim ke Browser** | `{"success":true,"data":[...],"count":6,"source":"cms-live"}` | `{"success":true,"projects":[...],"count":6}` |
| **Client Service File** | `src/services/projectService.ts` | `src/services/cmsProjectService.ts` |
| **Pengecekan di Client Service** | `if (json.success && Array.isArray(json.data))` | `if (json.success && json.data)`<br>`return { success: true, data: json.data.projects }` |
| **Hasil Pengecekan Client** | **TRUE** (`json.data` ada) | **FALSE** (`json.data` adalah `undefined`) |
| **Status Return Service** | `{ success: true, projects: [...] }` | `{ success: false, message: "Data proyek berhasil dimuat." }` |
| **Dampak di UI Component** | Komponen menerima 6 proyek dan merender daftar proyek dengan sempurna. | `setProjects()` tidak dipanggil. State `projects` tetap `[]`. Metrik `total: 0`. Render fallback: *"Belum Ada Proyek di Database TEST"*. |

---

## 4. ASAL-USUL LABEL "TEST DATABASE" DAN TEKS STATIS LAINNYA

Pencarian mendalam pada seluruh kode sumber membuktikan bahwa string `Test Database` dan referensi `TEST` pada Web Admin merupakan teks statis yang ditulis secara langsung (hardcoded) pada file JSX:

### Lokasi Kode pada `src/pages/AdminPage.tsx`:
1. **Baris 509–511 (Header Dashboard):**
   ```tsx
   <span className="px-2 py-0.5 text-xs font-mono bg-amber-950 text-amber-400 border border-amber-800/40 rounded-md">
     Test Database
   </span>
   ```
2. **Baris 577 (Judul Metrik):**
   ```tsx
   <h2 className="text-xs font-mono uppercase tracking-wider text-stone-400">
     Ringkasan Metrik Database TEST
   </h2>
   ```
3. **Baris 697 (Loading State Proyek):**
   ```tsx
   <p className="text-xs">Memuat katalog proyek dari spreadsheet TEST...</p>
   ```
4. **Baris 702 (Empty State Katalog Proyek):**
   ```tsx
   <p className="text-sm font-semibold text-stone-300">Belum Ada Proyek di Database TEST</p>
   ```
5. **Baris 917 (Loading State Media):**
   ```tsx
   <p className="text-xs">Memuat daftar media dari storage Google Drive TEST...</p>
   ```
6. **Baris 1392 (Modal Unggah Media):**
   ```tsx
   <span>Unggah Media ke Storage TEST</span>
   ```

**Kesimpulan:** Tidak ada logika pemilihan environment di sisi frontend yang memilih label "Test Database". Teks ini semata-mata adalah label statis prototipe Gate 2 yang belum dimutakhirkan.

---

## 5. ROOT CAUSE METRIK MENAMPILKAN ANGKA NOL

Pada `src/pages/AdminPage.tsx`:
```typescript
const projectMetrics = {
  total: projects.length,
  published: projects.filter((p) => p.publishState === 'PUBLISHED').length,
  draft: projects.filter((p) => p.publishState === 'DRAFT').length,
  archived: projects.filter((p) => p.publishState === 'ARCHIVED').length,
};

const mediaMetrics = {
  total: mediaList.length,
  published: mediaList.filter((m) => m.visibility === 'PUBLISHED').length,
  draft: mediaList.filter((m) => m.visibility === 'DRAFT').length,
  archived: mediaList.filter((m) => m.visibility === 'ARCHIVED').length,
};
```
Karena `loadCmsData()` gagal memasukkan data akibat `projRes.success === false`, `logRes.success === false`, dan `mediaRes.success === false`, ketiga state React:
- `projects` = `[]`
- `mediaList` = `[]`
- `auditLogs` = `[]`

Maka seluruh properti metrik menghasilkan nilai:
- `projectMetrics.total` = 0
- `projectMetrics.published` = 0
- `projectMetrics.draft` = 0
- `projectMetrics.archived` = 0
- `mediaMetrics.total` = 0
- `mediaMetrics.published` = 0
- `mediaMetrics.draft` = 0
- `mediaMetrics.archived` = 0
- `auditLogs.length` = 0

---

## 6. MENGAPA TEST LOKAL SEBELUMNYA PASS (394/394)?

Pada audit Milestone 6.5 dan 6.5.1, test `cmsCrud.test.ts` baris 428–436 lulus karena pengujian unit menggunakan mock `fetch` tiruan:
```typescript
// src/test/cmsCrud.test.ts:433-436
return new Response(JSON.stringify({
  success: true,
  data: {
    projects: [{ id: 'p1', name: 'App 1', publishState: 'PUBLISHED' }],
  },
}));
```
Pembuat test menulis mock dengan struktur bersarang `{ success: true, data: { projects: [...] } }`. Mock ini cocok dengan `if (json.success && json.data)` di `cmsProjectService.ts`, namun **berbeda dengan respons nyata Google Apps Script Production** yang mengembalikan skema flat `{ success: true, projects: [...] }`.

---

## 7. REKOMENDASI SOLUSI & ANALISIS RISIKO

### 7.1 Solusi yang Direkomendasikan
Perbaikan mencakup dua tingkat pertahanan (defense-in-depth):

1. **Fleksibilitas Parsing di Client Service (Non-Breaking & Resilient):**
   Perbarui `src/services/cmsProjectService.ts` dan `src/services/cmsMediaService.ts` agar mendukung kedua skema:
   ```typescript
   // Di cmsProjectService.ts:
   const projects = Array.isArray(json.projects)
     ? json.projects
     : Array.isArray(json.data?.projects)
       ? json.data.projects
       : Array.isArray(json.data)
         ? json.data
         : null;

   if (json.success && projects) {
     return { success: true, data: projects };
   }
   ```
   Hal yang sama diterapkan pada `logs` (`json.logs || json.data?.logs`) dan `media` (`json.media || json.data?.media`).
2. **Normalisasi di Edge Functions (Opsional & Best-Practice):**
   Pada `functions/api/admin/projects.ts`, `audit-logs.ts`, dan `media.ts`, bungkus hasil panggilan dengan konsistensi `{ success: true, data: { projects: ... } }` seperti halnya `functions/api/projects.ts`.
3. **Pembersihan String Statis di UI (`src/pages/AdminPage.tsx`):**
   Ganti label statis `Test Database` menjadi `Production Database` (atau tampilkan badge dinamis), dan ubah teks deskripsi dari `Database TEST` / `spreadsheet TEST` menjadi `CMS Production Database`.

### 7.2 Analisis Risiko
- **Tingkat Risiko:** **SANGAT RENDAH (LOW RISK)**.
- **Dampak Data:** Zero data impact. Tidak ada perubahan pada skrip Google Apps Script V5, Google Sheets Production, atau Google Drive.
- **Downtime:** Zero downtime.
- **Biaya:** \$0.00 / Rp0 (Zero-Cost).

---

## 8. FINAL DECISION

```
PRODUCTION ADMIN CONNECTED CORRECTLY — UI/METRICS ISSUE
```

### Kesimpulan Akhir:
Sistem Web Admin Production **terhubung dengan benar ke backend dan database Production**.
Penyebab utama dari tampilan nol dan teks "Test Database" adalah:
1. **Defek mapping skema JSON** antara respons flat Google Apps Script (`json.projects`) dan parser client-side (`json.data.projects`).
2. **Teks statis hardcoded** pada komponen React `AdminPage.tsx`.

*Menunggu instruksi eksplisit dari pemilik proyek sebelum menerapkan perbaikan kode pada Milestone berikutnya.*
