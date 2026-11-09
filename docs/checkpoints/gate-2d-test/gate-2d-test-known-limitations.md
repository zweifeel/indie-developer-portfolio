# SLEEPYKOALA CMS — BATASAN & CATATAN OPERASIONAL (KNOWN LIMITATIONS)
## OPERATIONAL CONSTRAINTS & LIMITATIONS — GATE 2D TEST

**Checkpoint ID:** `gate-2d-test-20261101-v1`  
**Tanggal:** 2026-11-01  
**Status Dokumen:** **INFORMASIONAL & MITIGASI ARSITEKTUR**

---

## 1. DAFTAR BATASAN OPERASIONAL

### 1. Batas Ukuran Berkas Media Maksimal 2 MB
- **Deskripsi:** Unggahan berkas media (WebP, PNG, JPEG) dibatasi secara ketat maksimal 2.097.152 bytes (2 MB).
- **Alasan Teknis:** Cloudflare Pages Functions (Free Tier) memiliki batas alokasi memori edge 128 MB dan Apps Script Web App memiliki batas payload transmisi HTTP POST.
- **Mitigasi:** Validasi instan di sisi klien sebelum pengiriman dan penolakan HTTP 413 *Payload Too Large* di sisi Cloudflare Functions edge sebelum diteruskan ke Apps Script.

### 2. Overhead Base64 pada Transmisi Biner Media
- **Deskripsi:** Transmisi media dari Google Drive melalui Apps Script Web App menggunakan format JSON dengan representasi data Base64.
- **Alasan Teknis:** Google Apps Script Web App tidak mendukung direct streaming biner raw tanpa memicu redirect OAuth Google Login yang memblokir akses publik.
- **Mitigasi:** Overhead base64 sebesar ~33% dapat ditoleransi karena ukuran berkas dibatasi maksimal 2 MB (ukuran payload base64 ~2.66 MB, jauh di bawah batas Apps Script 50 MB).

### 3. Latensi Cold Start Google Apps Script
- **Deskripsi:** Permintaan pertama setelah backend tidak aktif selama beberapa menit dapat mengalami jeda 1.000 - 2.500 ms akibat inisialisasi container Google Apps Script.
- **Mitigasi:**
  1. Halaman web publik dilengkapi dengan mekanisme fallback transparan ke `projects.json` lokal jika batas waktu (timeout) 5 detik terlampaui.
  2. Klien frontend menggunakan in-memory cache dengan hook reaktif `useProjects()` sehingga perpindahan antar-halaman publik berlangsung instan (0 ms).

### 4. Batas Waktu CPU Edge Cloudflare (10 ms)
- **Deskripsi:** Paket gratis Cloudflare Pages membatasi waktu pemrosesan CPU murni maksimal 10 ms per invocation.
- **Mitigasi:** Operasi I/O jaringan (fetch ke Apps Script) bersifat asinkron dan tidak memotong kuota CPU time. Parsing base64 ke `Uint8Array` dioptimalkan dan rata-rata hanya memakan waktu 1 - 3 ms CPU time.

### 5. Penghapusan Permanen Bersifat Irreversible
- **Deskripsi:** Penghapusan media secara fisik (`permanent=true`) menghapus entri dari spreadsheet `CMS_Media` dan memanggil `Drive.Files.remove(driveFileId)` yang menghapus berkas secara permanen dari Google Drive tanpa masuk Trash.
- **Mitigasi:** UI Admin Dashboard mewajibkan konfirmasi ganda sebelum eksekusi permanent delete dilakukan.
