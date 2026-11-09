# SLEEPYKOALA CMS — MILESTONE 6.5 MANIFEST
**Daftar Berkas & Komponen Terdampak Remediasi OTP Email**

| Berkas | Jenis Perubahan | Deskripsi Fungsional |
|---|---|---|
| `functions/api/admin/auth/request-otp.ts` | Modified | Mengganti flag statis `mockEmailDelivery: true` dengan evaluasi dinamis lingkungan via `resolveM2MSecret(env)`. Production dipaksa `mockEmailDelivery: false`. TEST hanya menggunakan mock jika `body.mockEmailDelivery === true`. |
| `backend/gas/Code.gs` | Modified | Menambahkan pengecekan kuota `MailApp.getRemainingDailyQuota()`, blok `try-catch` exception handling pada `MailDeliveryAdapter.send()`, pembatalan OTP aktif saat email gagal, dan isolasi lingkungan backend. |
| `backend/test_gas/Code.gs` | Modified | Sinkronisasi penuh dengan logika hardening pengiriman email OTP yang sama dengan `backend/gas/Code.gs`. |
| `src/test/adminAuth.test.ts` | Modified | Menyesuaikan unit test request OTP agar memvalidasi pemisahan eksplisit antara real email (default) dan mock (eksplisit di TEST). |
| `src/test/milestone65RealOtpEmail.test.ts` | Created | Test suite terdedikasi (13 pengujian) yang mencakup seluruh skenario kegagalan kuota, exception MailApp, pembatalan OTP, isolasi environment, dan HTTP status code mapping. |
| `docs/reports/sleepykoala-milestone-65-otp-email-remediation.md` | Created | Laporan komprehensif implementasi lokal remediasi Milestone 6.5. |
| `docs/audits/sleepykoala-milestone-65-final-verification.md` | Created | Laporan audit verifikasi akhir lokal Milestone 6.5. |
