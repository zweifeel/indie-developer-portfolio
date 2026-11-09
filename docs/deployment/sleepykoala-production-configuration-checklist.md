# SLEEPYKOALA CMS — PRODUCTION CONFIGURATION CHECKLIST
## SECRET AUDIT, ENVIRONMENT VARIABLES & PRE-DEPLOYMENT COMPATIBILITY MATRIX

**Tanggal:** 1 November 2026  
**Auditor:** DevOps & Security Operations Lead  
**Status Evaluasi:** ACTION REQUIRED — HUMAN CONFIGURATION  

---

## 1. AUDIT KONFIGURASI SECRET CLOUDFLARE PAGES

Pemeriksaan konfigurasi environment variables dan encrypted secrets pada proyek Cloudflare Pages `sleepykoala`:

| Environment Variable / Secret | Lingkungan | Status Saat Ini | Kategori Tindakan | Deskripsi & Fungsi |
|---|---|---|---|---|
| `GAS_WEBAPP_URL` | Production & Preview | **CONFIGURED & ACTIVE** | VERIFIED | URL Web App Google Apps Script deployment produksi (`https://script.google.com/macros/s/AKfycb.../exec`). Digunakan oleh Pages Functions untuk komunikasi hulu. |
| `APPS_SCRIPT_SECRET` | Production & Preview | **CONFIGURED & ACTIVE** | VERIFIED | Token rahasia M2M (Machine-to-Machine) untuk autentikasi antara Cloudflare edge functions dan backend Apps Script. Wajib dikirim pada header `X-Apps-Script-Secret`. |
| `ADMIN_SESSION_SECRET` | Production & Preview | **NOT SET (SAFE FALLBACK ACTIVE)** | **ACTION REQUIRED — HUMAN CONFIGURATION** | Kunci kriptografi khusus untuk signing cookie sesi administrator (`sk_session`). Kode Milestone 6.2/6.3 memiliki fallback otomatis ke `APPS_SCRIPT_SECRET` demi mencegah crash jika belum diatur, namun pemisahan secret sangat direkomendasikan untuk memenuhi standar isolasi keamanan mutlak (`SEC-M61-01`). |

---

## 2. PANDUAN HUMAN CONFIGURATION UNTUK `ADMIN_SESSION_SECRET`

Karena agen beroperasi di bawah batasan strict read-only dan perlindungan credential manusia, langkah berikut wajib dilakukan oleh Human Release Manager melalui Cloudflare Dashboard:

1. Buka browser dan login ke [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigasi ke: **Compute (Workers) > Workers & Pages > sleepykoala**.
3. Klik tab **Settings**, lalu pilih submenu **Variables and Secrets**.
4. Di bagian **Environment Variables / Secrets**, periksa tabel variabel.
5. Klik **Add variable** atau **Add secret**:
   - **Variable name:** `ADMIN_SESSION_SECRET`
   - **Value:** Masukkan string acak yang kuat (minimal 32 karakter alfanumerik acak, contoh: hasil dari `openssl rand -hex 24` atau string rahasia kuat studio).
   - **Type:** Pilih opsi **Secret** (terenkripsi).
6. Klik **Save and Deploy** (atau simpan perubahan).
7. Konfigurasi selesai. Secret baru akan otomatis digunakan pada deployment berikutnya.

---

## 3. MATRIKS KOMPATIBILITAS DEPLOYMENT

Evaluasi kompatibilitas antar-versi frontend/edge dan backend Apps Script:

| Versi Frontend / Edge | Versi Backend Apps Script | Status Kompatibilitas | Detail Teknis & Batasan |
|---|---|---|---|
| **Milestone 6.3 Frontend** | **Apps Script Version 3 (Live Prod)** | **VERIFIED VIA MOCK** | Seluruh rute publik, API tester, dan CMS CRUD berfungsi. **Catatan:** Backend V3 live belum memiliki string enum `"PRE_REGISTRATION"`. Jika admin memilih status ini di form edit sebelum backend V3 diperbarui, backend live akan menolak dengan `VALIDATION_ERROR`. Diperlukan push update ke GAS backend untuk aktivasi penuh fitur ini di live. |
| **Milestone 6.3 Frontend** | **Apps Script Version 2** | **CODE REVIEW ONLY** | Struktur endpoint dasar kompatibel, namun Versi 2 tidak mendukung pemeriksaan revocasi sesi `SEC-M61-02` dan referential integrity cleanup Gate 2D.2. Hanya layak sebagai fallback darurat. |
| **Milestone 6.3 Frontend** | **Apps Script Version 1** | **INCOMPATIBLE** | Versi 1 adalah versi lawas pra-CMS tanpa tabel database pendukung. DILARANG DIGUNAKAN. |
| **Milestone 6.2 Frontend** | **Apps Script Version 3 (Live Prod)** | **VERIFIED** | Baseline produksi stabil yang beroperasi saat ini. |

---

## 4. CHECKLIST PRA-DEPLOYMENT RELEASE MANAGER

Sebelum memberikan persetujuan deployment kepada agen atau menjalankan pipeline:

- [x] 1. Semua 19 test suite lokal lulus (380 tests passed).
- [x] 2. Build produksi `npm run build` sukses tanpa error TypeScript.
- [x] 3. Linter `oxlint` bersih tanpa error.
- [x] 4. Google Play Hybrid Sync terkonfirmasi PAUSED.
- [x] 5. Data 6 proyek resmi aman dan tidak ada dummy project.
- [ ] 6. Secret `ADMIN_SESSION_SECRET` telah dimasukkan ke Cloudflare Dashboard (Human Action).
- [ ] 7. Izin eksplisit deployment produksi diberikan oleh pengguna.
