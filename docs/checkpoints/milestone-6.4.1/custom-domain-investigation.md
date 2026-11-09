# SLEEPYKOALA CMS — INVESTIGASI TEKNIS CUSTOM DOMAIN
## INVESTIGASI MENGAPA `master.sleepykoala.dev` TIDAK DAPAT DIAKSES

**Tanggal Audit:** 1 November 2026  
**Auditor:** Senior DevOps & Network Security Engineer  
**Domain Sasaran:** `https://master.sleepykoala.dev`  
**Status Evaluasi:** ROOT CAUSE IDENTIFIED — HUMAN ACTION REQUIRED (NON-BLOCKING)  

---

## 1. TEMUAN DAN BUKTI INVESTIGASI (EVIDENCE-BASED)

### 1.1. Pemeriksaan Konfigurasi Cloudflare Pages
Perintah resmi Cloudflare CLI:
`npx wrangler pages project list`

Output:
```text
┌──────────────┬───────────────────────┬──────────────┬───────────────┐
│ Project Name │ Project Domains       │ Git Provider │ Last Modified │
├──────────────┼───────────────────────┼──────────────┼───────────────┤
│ sleepykoala  │ sleepykoala.pages.dev │ No           │ 1 hour ago    │
└──────────────┴───────────────────────┴──────────────┴───────────────┘
```
**Fakta:** Subdomain `master.sleepykoala.dev` **belum pernah ditambahkan atau dihubungkan ke proyek Cloudflare Pages `sleepykoala`**. Proyek ini secara resmi hanya memiliki domain `sleepykoala.pages.dev`.

### 1.2. Pemeriksaan DNS Global (DoH & Resolver)
1. **Cloudflare DNS over HTTPS (1.1.1.1):**
   - Query: `https://cloudflare-dns.com/dns-query?name=sleepykoala.dev&type=A`
   - Status: **RCODE 3 (NXDOMAIN)**.
   - Authority: Charleston Road Registry (`dev.`).
2. **Google Public DNS (8.8.8.8):**
   - Query: `nslookup master.sleepykoala.dev 8.8.8.8`
   - Hasil: `*** dns.google can't find master.sleepykoala.dev: Non-existent domain` (NXDOMAIN).
   - Query: `nslookup sleepykoala.dev 8.8.8.8`
   - Hasil: `*** dns.google can't find sleepykoala.dev: Non-existent domain` (NXDOMAIN).

---

## 2. ROOT CAUSE ANALYSIS (RCA)

1. **Bukan Kegagalan TLS/SSL:** Server tidak pernah mencapai tahap TLS handshake karena proses resolusi nama host gagal di level DNS paling dasar.
2. **Bukan Kegagalan Aplikasi / Pages Functions:** Aplikasi web dan seluruh edge functions di Cloudflare berjalan 100% normal pada `https://sleepykoala.pages.dev`.
3. **Penyebab Utama:**
   - Domain `sleepykoala.dev` tidak terdaftar atau zona DNS-nya belum dikonfigurasi pada authoritative nameserver manapun (NXDOMAIN).
   - Domain `master.sleepykoala.dev` belum didaftarkan di tab **Custom Domains** pada Cloudflare Pages project `sleepykoala`.

---

## 3. ZERO-COST COMPLIANCE & REKOMENDASI TINDAKAN MANUSIA

Sesuai **ZERO-COST / FREE-TIER LOCK**:
- Agen dilarang keras membeli, menyewa, atau mendaftarkan domain baru ($0.00 / Rp0).
- Agen tidak dapat menambahkan custom domain ke Pages tanpa kepemilikan domain aktual oleh pemilik proyek.

### Tindakan Pengguna (Jika Ingin Mengaktifkan Custom Domain di Masa Depan):
1. Pastikan domain `sleepykoala.dev` telah dibeli/didaftarkan oleh pemilik di registrar domain pilihan (misalnya Cloudflare Registrar, Namecheap, Google Domains).
2. Tambahkan domain `sleepykoala.dev` ke akun Cloudflare pemilik.
3. Di Cloudflare Pages: buka **Workers & Pages > sleepykoala > Custom domains > Set up a custom domain**.
4. Masukkan `master.sleepykoala.dev`.
5. Cloudflare akan secara otomatis mengelola CNAME dan sertifikat SSL/TLS gratis.

### Solusi Saat Ini (Production Fallback yang Sah):
Website produksi dan Web Admin CMS resmi beroperasi penuh pada domain bawaan Cloudflare Pages yang aman dan gratis:
- **Public Website:** `https://sleepykoala.pages.dev`
- **Web Admin CMS:** `https://sleepykoala.pages.dev/admin`
- **Public API:** `https://sleepykoala.pages.dev/api/projects`
