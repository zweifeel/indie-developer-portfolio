# PANDUAN PENYAMBUNGAN CUSTOM DOMAIN RESMI STUDIO ($0.00 / Rp 0)

> [!NOTE]
> **PROFIL PANDUAN (RAMAH PEMILIK STUDIO NON-CODER):**
> Dokumen ini disusun khusus agar Anda dapat menghubungkan nama domain kustom studio Anda sendiri (contoh: `sleepykoalastudio.com` atau `sleepykoala.id`) ke website portofolio Cloudflare Pages tanpa pusing dengan istilah teknis rumit dan **tanpa biaya sewa server sepeser pun ($0.00 / Rp 0)**.

---

## 1. Domain Bawaan vs Custom Domain (Penjelasan Bahasa Awam)

| Parameter | Domain Bawaan Saat Ini (`sleepykoala.pages.dev`) | Domain Kustom Sendiri (Misal: `sleepykoalastudio.com`) |
| :--- | :--- | :--- |
| **Biaya Hosting & Server** | **Rp 0 / Selamanya Bebas Biaya** | **Rp 0 / Selamanya Bebas Biaya** (Tetap di Cloudflare Pages) |
| **Sertifikat Keamanan (Gembok Hijau HTTPS/SSL)** | Otomatis Aktif (Dikelola Cloudflare) | Otomatis Aktif & Diperbarui Otomatis (Rp 0) |
| **Status di Google Play & AdMob** | Sudah Resmi Terhubung (`app-ads.txt` Aktif) | Tetap Aman (Dapat ditambahkan sebagai domain utama) |
| **Status Pendaftaran Tester** | Aktif ke Google Sheets | Tetap Aktif ke Google Sheets |
| **Kapan Diperlukan?** | Sudah sangat cukup untuk publikasi resmi | Opsional: Jika ingin terlihat lebih profesional di kartu nama |

> [!TIP]
> **Domain bawaan `https://sleepykoala.pages.dev` yang aktif saat ini 100% sah dan aman digunakan selamanya.**
> Anda tidak wajib membeli domain jika belum ingin mengeluarkan biaya pembelian nama domain. Namun jika suatu saat Anda ingin memiliki alamat web dengan nama studio sendiri, ikuti 3 langkah mudah di bawah ini!

---

## 2. Tiga Langkah Mudah Menghubungkan Custom Domain

### Langkah 1: Miliki Nama Domain (Registrar)
- Beli nama domain dari registrar pilihan Anda (misalnya Cloudflare Registrar, Niagahoster, Domainesia, Namecheap, dll).
  *Catatan: Pembelian nama domain adalah satu-satunya biaya (biasanya ~Rp 100.000–150.000/tahun kepada penyedia domain), sedangkan Cloudflare Pages **tidak memungut biaya hosting apa pun (Rp 0)**.*

### Langkah 2: Tambahkan Domain di Dashboard Cloudflare Pages
1. Buka browser dan login ke akun Cloudflare Anda: `https://dash.cloudflare.com/` (menggunakan akun `zweifeel@gmail.com`).
2. Di menu sebelah kiri, klik **Workers & Pages**.
3. Klik nama proyek Anda: **`sleepykoala`**.
4. Di bilah tab atas, klik tab **Custom domains**.
5. Klik tombol biru **Set up a custom domain**.
6. Ketikkan nama domain Anda (contoh: `sleepykoalastudio.com` atau subdomain `www.sleepykoalastudio.com`).
7. Klik **Continue**.

### Langkah 3: Arahkan DNS (Catatan Alamat Domain)
Cloudflare Pages akan memberikan petunjuk DNS yang sangat sederhana:
- **Jika domain Anda didaftarkan di Cloudflare:**
  Sistem akan otomatis mengatur catatan DNS dalam 1-klik tanpa perlu mengetik apa pun!
- **Jika domain Anda dibeli di penyedia lain (misal Niagahoster/Namecheap):**
  Buka panel kontrol penyedia domain Anda, masuk ke menu **DNS Management**, dan tambahkan satu baris:
  - **Tipe (Type):** `CNAME`
  - **Nama (Name / Host):** `@` (atau `www`)
  - **Target / Value:** `sleepykoala.pages.dev`
  - **Proxy Status:** Aktifkan awan oranye (Proxied) jika menggunakan Cloudflare DNS.

---

## 3. Verifikasi & Keamanan Otomatis
- Dalam waktu 5–15 menit, Cloudflare akan otomatis memverifikasi sambungan dan menerbitkan sertifikat SSL gembok aman (HTTPS).
- File iklan Google AdMob `https://[domain-anda]/app-ads.txt` dan formulir pendaftaran Google Play tester otomatis berfungsi di bawah domain baru tanpa perlu mengubah kode sumber website!
