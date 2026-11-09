# SLEEPYKOALA CMS — TINJAUAN KEAMANAN GATE 2D.2
## SECURITY REVIEW — PUBLIC PRIVACY & REFERENTIAL INTEGRITY

**Checkpoint ID:** `gate-2d2-local-20261101-v1`  
**Tanggal:** 2026-11-01  
**Auditor:** Antigravity Senior Application Security Auditor  

---

## 1. EVALUASI KEAMANAN PRIVASI PUBLIK (FINDING-2D1-01)

### A. Kebijakan Fail-Closed
- **Sebelum:** Upstream error beralih ke snapshot `projects.json` lokal dan memaksakan status `PUBLISHED`.
- **Sesudah:** Upstream error seketika menghentikan transmisi dan merespons dengan HTTP 503 *Service Unavailable*.
- **Evaluasi Keamanan:** Mengeliminasi 100% risiko kebocoran data proyek DRAFT atau ARCHIVED ke publik saat terjadi kegagalan jaringan atau server backend.

### B. Kebijakan Cache Error
- Seluruh respons error akibat backend tidak tersedia (HTTP 503) diinjeksi header:
  `Cache-Control: no-store, no-cache, must-revalidate`
- Mencegah CDN Cloudflare, shared cache proxy, atau browser menyimpan state error sebagai respons permanen yang dapat mengacaukan pemulihan.

---

## 2. EVALUASI INTEGRITAS DATA & REFERENSI (FINDING-2D1-03)

### A. Pencegahan Dangling References
- Fungsi `cleanMediaReferencesFromProjects` menjamin bahwa setiap penghapusan fisik berkas media secara atomik memindai kolom `Screenshots JSON`, `Icon URL`, dan `Feature Graphic URL` pada seluruh entri di `CMS_Projects`.
- Referensi yang dibersihkan langsung disimpan kembali ke spreadsheet, mencegah adanya URL media mati (404 broken image) pada halaman portofolio publik.

### B. Proteksi Konkruensi & Transaksi Parsial
- `LockService.getScriptLock()` mencegah race condition antara dua administrator yang melakukan penghapusan secara bersamaan.
- Urutan dual-phase (bersihkan referensi proyek terlebih dahulu, baru hapus baris media dan file fisik Drive) menjamin integritas referensial data tetap terjaga sekalipun Google Drive API mengalami rate limit.

---

## 3. AUDIT TRAIL & LOGGING

- Setiap mutasi penghapusan permanen dicatat di sheet `CMS_AuditLogs` dengan payload terstruktur:
  - `action: "PERMANENT_REMOVAL"`
  - `driveFileId: driveFileId`
  - `cleanedProjectsCount: number`
  - `cleanedProjectIds: string[]`
  - `driveRemovalSuccess: boolean`
  - `driveError: string | undefined`
- Menjamin *non-repudiation* dan keterlacakan penuh seluruh aktivitas pengelolaan aset.
