# SLEEPYKOALA CMS — MILESTONE 6.5.2
## HUMAN DEPLOYMENT PREPARATION REPORT
**Persiapan Deployment Pengiriman Real OTP Email — Strict No-Deploy**

- **Tanggal Dokumen:** 2 November 2026, 05:35 WIB
- **Tingkat Kepatuhan:** STRICT NO-DEPLOY — NO PRODUCTION MUTATION
- **Tujuan:** Memverifikasi kesiapan operasional akhir sebelum meminta otorisasi eksplisit deployment manusia.
- **Keputusan Akhir:** `READY FOR EXPLICIT HUMAN DEPLOYMENT APPROVAL`

---

## 1. STATUS SOURCE INTEGRITY & VERIFIKASI BASELINE KODE

Pemeriksaan integritas kode membuktikan bahwa berkas lokal yang akan dideploy identik 100% dengan hasil audit Milestone 6.5.1:

| Berkas | Waktu Modifikasi Terakhir | Ukuran (Bytes) | Status Integritas |
|---|---|---|---|
| [`functions/api/admin/auth/request-otp.ts`](file:///e:/Antigravity%20Project/indie-developer-portfolio/functions/api/admin/auth/request-otp.ts) | 02/11/2026 01:11:38 WIB | 4.942 | `VERIFIED` — Sesuai baseline Milestone 6.5 |
| [`backend/gas/Code.gs`](file:///e:/Antigravity%20Project/indie-developer-portfolio/backend/gas/Code.gs) | 02/11/2026 01:12:11 WIB | 109.419 | `VERIFIED` — Sesuai baseline Milestone 6.5 |
| [`backend/test_gas/Code.gs`](file:///e:/Antigravity%20Project/indie-developer-portfolio/backend/test_gas/Code.gs) | 02/11/2026 01:12:33 WIB | 103.970 | `VERIFIED` — Sesuai baseline Milestone 6.5 |
| [`src/test/adminAuth.test.ts`](file:///e:/Antigravity%20Project/indie-developer-portfolio/src/test/adminAuth.test.ts) | 02/11/2026 01:12:56 WIB | 48.803 | `VERIFIED` — Sesuai baseline Milestone 6.5 |
| [`src/test/milestone65RealOtpEmail.test.ts`](file:///e:/Antigravity%20Project/indie-developer-portfolio/src/test/milestone65RealOtpEmail.test.ts) | 02/11/2026 01:14:13 WIB | 17.759 | `VERIFIED` — Sesuai baseline Milestone 6.5 |

**Konfirmasi:** Tidak ada modifikasi kode baru, tidak ada berkas asing, dan seluruh 394 automated tests lulus secara konsisten.

---

## 2. TARGET DEPLOYMENT PRODUKSI & IDENTIFIKASI VERSI

### A. Google Apps Script Production
- **Script ID:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Active Deployment ID:** `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`
- **Versi Aktif Saat Ini:** Version 4 (`@4`)
- **Target Versi Baru Pasca-Deploy:** Version 5 (`@5`)
- **Deskripsi Rencana Rilis:** `SleepyKoala CMS Production V5 - Real OTP Email Delivery & Fail-Closed Remediation`
- **Berkas yang Di-push:** `backend/gas/Code.gs` dan `backend/gas/appsscript.json`

### B. Cloudflare Pages Production
- **Project Name:** `sleepykoala`
- **Production Domain:** `https://sleepykoala.pages.dev`
- **Deployment UUID Aktif Saat Ini:** `0ef893ab-266c-4af0-a782-7a8c01d75f4a`
- **Target Direktori Build:** `dist/` (ter-generate via `tsc -b && vite build`)
- **Edge Functions Aktif:** `functions/api/admin/auth/request-otp.ts` dan fungsi terkait lainnya.

---

## 3. STATUS KESIAPAN OAUTH GOOGLE MAILAPP & TINDAKAN MANUAL

1. **Deklarasi Manifest (`backend/gas/appsscript.json`):**
   Scope `"https://www.googleapis.com/auth/script.send_mail"` telah tercantum secara eksplisit pada baris ke-20.
2. **Kondisi Otorisasi Akun Pemilik (`zweifeel@gmail.com`):**
   Karena mode pengujian ketat melarang pengiriman email langsung, status otorisasi interaktif runtime akun pemilik berstatus **`NOT VERIFIED (PENDING HUMAN VERIFICATION)`**.
3. **Langkah Manual Interaktif yang Wajib Dilakukan Pemilik Akun Sebelum/Saat Rilis:**
   - Masuk ke [Google Apps Script Console](https://script.google.com/) menggunakan akun `zweifeel@gmail.com`.
   - Buka project `SleepyKoala Closed Testing Backend` (Script ID: `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`).
   - Jika saat menjalankan fungsi apa pun atau saat deploy muncul dialog *"Authorization Required"*, klik **Review Permissions**, pilih akun `zweifeel@gmail.com`, lalu klik **Allow** untuk mengizinkan skrip mengirimkan email atas nama akun tersebut.

---

## 4. KEBIJAKAN ZERO-COST & BATASAN KUOTA EMAIL

1. **Ketiadaan Layanan Berbayar:**
   Tidak ada integrasi dengan penyedia email pihak ketiga berbayar (seperti SendGrid, Mailgun, Amazon SES, atau Twilio). Sistem 100% menggunakan API bawaan Google MailApp yang terikat pada akun Google pengguna.
2. **Kepatuhan Kuota Bebas Biaya:**
   - Akun personal Google `@gmail.com` memiliki kuota gratis dasar sekitar 100 email per 24 jam.
   - Sistem membatasi konsumsi kuota OTP maksimal 15 email per 24 jam ([`CMS_CONFIG.MAX_OTP_PER_24H`](file:///e:/Antigravity%20Project/indie-developer-portfolio/backend/gas/Code.gs#L1005)) dan 5 email per jam ([`CMS_CONFIG.MAX_OTP_PER_HOUR`](file:///e:/Antigravity%20Project/indie-developer-portfolio/backend/gas/Code.gs#L1004)).
   - **Catatan Realistis:** Jumlah kuota aktual akun pengguna tidak diasumsikan gratis mutlak tanpa batas; jika kuota 100/hari tersebut habis (misal terpakai oleh layanan Google lain), pengecekan `MailApp.getRemainingDailyQuota() <= 0` akan menghentikan transaksi secara fail-closed dan menampilkan error transparan `EMAIL_QUOTA_EXCEEDED` (`HTTP 503`), tanpa biaya tambahan atau tagihan tak terduga.

---

## 5. DAFTAR RISIKO TERSISA & MITIGASINYA

| Risiko Tersisa | Tingkat Risiko | Mitigasi yang Telah Diterapkan |
|---|---|---|
| **Izin OAuth MailApp Belum Diberikan** | Sedang | `MailDeliveryAdapter.send()` dibungkus blok `try-catch`. Jika izin belum disetujui, server tidak crash melainkan merespons dengan error `EMAIL_DELIVERY_FAILED` (`HTTP 503`) dan OTP aktif seketika dibatalkan. |
| **Email Masuk ke Folder Spam/Promosi** | Rendah | Email dikirim langsung dari akun Google resmi pengembang (`zweifeel@gmail.com`) dengan subjek dan format teks jelas, meminimalkan deteksi filter spam. |
| **Lonjakan Request Bersamaan** | Sangat Rendah | Dilindungi secara serial oleh `LockService.getScriptLock()` dan batas jeda 60 detik (cooldown). |

---

## 6. PROSEDUR ROLLBACK RESMI (BASELINE TERVERIFIKASI)

Jika terjadi anomali kritis pasca-deployment:

### A. Rollback Google Apps Script
Kembalikan deployment produksi `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A` ke Version 4 (`@4`) atau Version 3 (`@3`):
```bash
npx @google/clasp deploy -i "AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A" -V 4 -d "Rollback to Production V4 Baseline"
```

### B. Rollback Cloudflare Pages
Alihkan deployment aktif Cloudflare Pages kembali ke baseline stabil sebelumnya:
- **Baseline Deployment UUID:** `0ef893ab-266c-4af0-a782-7a8c01d75f4a` (Milestone 6.4 baseline) atau `2c3cced9-fc9b-4bc7-857f-7826f9acd386` (Gate 5.2 baseline).
- **Prosedur:** Melalui Cloudflare Pages Dashboard > Deployments > Rollback / Deploy previous version.

---

## 7. KONFIRMASI MUTLAK NO-DEPLOY

- **Cloudflare Pages:** Tidak ada `wrangler pages deploy` yang dijalankan.
- **Google Apps Script:** Tidak ada `clasp push` atau `clasp deploy` yang dijalankan.
- **Email:** Nol email pengujian yang dikirimkan.
- **Database & Secrets:** Spreadsheet dan Secrets produksi tetap tidak berubah.

---

## 8. KEPUTUSAN FINAL & STOP CONDITION

Persiapan deployment telah selesai diperiksa secara read-only. Seluruh prasyarat teknis, mitigasi risiko, dan rencana rollback telah siap.

```text
================================================================================
FINAL DECISION:
READY FOR EXPLICIT HUMAN DEPLOYMENT APPROVAL
================================================================================
```

*Sistem sekarang berhenti dan menunggu persetujuan eksplisit pemilik proyek sebelum tindakan deployment apa pun dieksekusi.*
