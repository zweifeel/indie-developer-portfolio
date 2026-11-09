# SLEEPYKOALA CMS — BATASAN LINGKUNGAN PENGUJIAN (ENVIRONMENT BOUNDARIES)
## ENVIRONMENT ISOLATION & BOUNDARY INTEGRITY — GATE 2D TEST

**Checkpoint ID:** `gate-2d-test-20261101-v1`  
**Tanggal:** 2026-11-01  
**Status Kepatuhan:** **100% TERISOLASI — ZERO CROSS-ENVIRONMENT LEAKAGE**

---

## 1. MATRIKS ISOLASI LINGKUNGAN TEST VS PRODUKSI

| Komponen Arsitektur | Lingkungan TEST (Diizinkan & Digunakan) | Lingkungan PRODUKSI (Dilarang Mutlak / Disentuh) | Status Perlindungan |
|---|---|---|:---:|
| **Google Apps Script ID** | `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg`<br>*(Deployment V5 TEST)* | `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` | **TERKUNCI / UNTOUCHED** |
| **Google Spreadsheet Database** | `SleepyKoala_Test_Database`<br>ID: `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4` | Database Spreadsheet Produksi & Sheet `TesterRegistrations` | **TERKUNCI / UNTOUCHED** |
| **Folder Google Drive Storage** | `SleepyKoala_CMS_Media_TEST`<br>ID: `1FldRootMediaTestFolderId01234567` | Root Drive Pribadi / Folder Media Produksi | **TERKUNCI / UNTOUCHED** |
| **Cloudflare Hosting & Functions** | Local Dev / Preview Branch Emulation (`wrangler pages dev`) | Production Custom Domain (`sleepykoala.com` / production routes) | **TERKUNCI / TIDAK DIDEPLOY** |
| **Google Play Hybrid Sync** | **PAUSED** (Tidak aktif) | **PAUSED** (Tidak aktif) | **TERKUNCI / PAUSED** |
| **Email Pengiriman OTP** | Mocking / Test Token bypass internal | Layanan Live SMTP / Gmail OTP Pengguna Nyata | **TERKUNCI / TIDAK DIKIRIM** |

---

## 2. VERIFIKASI KEAMANAN PERBATASAN

1. **Pemeriksaan Target Kode Sumber:** Seluruh konfigurasi di `backend/test_gas/Code.gs` dan `functions/` hanya merujuk pada Spreadsheet TEST ID dan Script TEST ID. Tidak ada referensi hardcoded ke Script ID produksi `1wN48zjs...`.
2. **Pemeriksaan Akses Jaringan:** Seluruh uji coba eksternal hanya dilakukan terhadap endpoint Web App TEST.
3. **Pemberitahuan Larangan Deploy:** Sesuai instruksi pengguna, tindakan `wrangler pages deploy` ke production environment **TIDAK DILAKUKAN** (*Strictly Not Authorized*). Seluruh hasil pekerjaan diuji dan diverifikasi pada level pengujian lokal dan simulasi Pages Functions.
