# CHECKLIST MONITORING CLOSED TESTING 14 HARI GOOGLE PLAY CONSOLE — MOBILE KASIR

> **Dokumen Resmi Kepatuhan Rilis Produksi Google Play SleepyKoala Studio**  
> Target Aplikasi: **Mobile Kasir** (`com.sleepykoala.mobilekasir`)  
> Mandat Kebijakan: **20+ Tester Terverifikasi (Opted-in) Aktif Selama 14 Hari Berturut-turut**  
> Biaya Pelaksanaan: **$0.00 / Rp 0** (Memanfaatkan Cloudflare Pages & Google Sheets Gratis)

---

## 📋 1. RINGKASAN KEBIJAKAN GOOGLE PLAY (ATURAN 14 HARI)

Sejak November 2023, Google Play memberlakukan aturan ketat bagi akun developer pribadi (personal developer account):
1. **Jumlah Penguji Minimum:** Wajib mengikutsertakan minimal **20 tester**.
2. **Durasi Wajib:** Pengujian tertutup (Closed Testing) wajib berjalan tanpa jeda selama minimal **14 hari berturut-turut**.
3. **Status Opt-in Aktif:** Seluruh 20 tester harus mengklik link undangan pengujian ("Join on Android" / "Join on the web") dan memasang (install) aplikasi.
4. **Metrik Kestabilan:**
   - *Crash-Free Users:* Wajib **di atas 99.0%**.
   - *User-Perceived ANR (Application Not Responding):* Wajib **di bawah 0.47%**.

---

## 🛠️ 2. CHECKLIST VERIFIKASI HARIAN (HARI KE-1 S/D HARI KE-14)

Lakukan 4 langkah verifikasi harian ini di dashboard Google Play Console dan dashboard Admin CMS SleepyKoala (`/admin` -> tab `COMPLIANCE`):

### ✅ Langkah 1: Cek Jumlah Tester Opt-in Aktif
- Buka **Google Play Console** -> Pilih **Mobile Kasir** -> **Testing** -> **Closed testing**.
- Pastikan angka **"Installed by testers" / "Opted-in"** tetap **>= 20**.
- *Jika ada tester yang mundur atau uninstall:* Buka Google Sheets pendaftar Closed Testing SleepyKoala dan tambahkan email tester cadangan dari antrean pendaftaran website.

### ✅ Langkah 2: Audit Crash & ANR di Android Vitals
- Buka menu **Quality** -> **Android vitals** -> **Crashes and ANRs**.
- Pastikan tidak ada lonjakan crash baru. Jika ada crash, prioritaskan penanganan hotfix tanpa menghentikan jalur Closed Testing.

### ✅ Langkah 3: Tinjau Feedback & Komentar Penguji
- Buka menu **Ratings & reviews** -> **Testing feedback**.
- Catat saran pengguna mengenai:
  - Kemudahan input transaksi penjualan & cetak struk via Bluetooth thermal printer.
  - Performa pencarian katalog barang saat ribuan SKU dimuat.

### ✅ Langkah 4: Validasi Checklist di Dashboard Admin CMS
- Buka `https://sleepykoala.pages.dev/admin` (atau localhost saat development).
- Masuk ke tab **COMPLIANCE**.
- Centang 4 butir checkpoint untuk hari yang bersangkutan:
  1. *Opt-in Tester Verification*
  2. *Crash & ANR Rate Inspection*
  3. *Tinjauan Feedback & Masukan Tester*
  4. *Sesi Aplikasi & Pengujian Fitur Riil*

---

## 🎯 3. FORMULIR PANDUAN PENGAJUAN PRODUKSI (SETELAH HARI KE-14)

Ketika progress telah mencapai 100% (14 dari 14 hari telah tercentang hijau), tombol **"Apply for production" (Ajukan Akses Produksi)** akan aktif di Google Play Console.

Siapkan jawaban resmi studio berikut:
1. **Bagaimana Anda merekrut penguji?**
   > *"Kami mengumpulkan penguji melalui formulir pendaftaran komunitas resmi di website kami (https://sleepykoala.pages.dev) yang menargetkan pemilik UMKM, kasir ritel, dan pengembang aplikasi Android di Indonesia."*
2. **Keterlibatan penguji selama 14 hari:**
   > *"Penguji menguji skenario kasir harian: pencatatan transaksi kasir kilat, manajemen inventaris stok, pembagian struk digital via WhatsApp, dan integrasi printer Bluetooth."*
3. **Feedback yang diterima dan perubahan yang dilakukan:**
   > *"Berdasarkan masukan penguji, kami mengoptimalkan kecepatan pencarian produk pada mode offline dan menyempurnakan kontras tata letak kasir untuk penggunaan di bawah sinar matahari terang."*

---

## 🛡️ 4. PENANGGULANGAN RISIKO (TROUBLESHOOTING)

| Kejadian | Risiko | Solusi Cepat |
| :--- | :--- | :--- |
| Jumlah tester turun menjadi 19 | Periode 14 hari di-reset oleh Google Play | Segera masukkan 2-3 email dari daftar tunggu form Google Sheets dan kirimkan broadcast WhatsApp/email untuk opt-in. |
| Ditemukan bug fatal | Crash rate melebihi 1% | Rilis update bundle AAB baru ke track Closed Testing yang sama (jangan hapus track atau rilis di track lain). |
| Tester lupa membuka aplikasi | Kurangnya sinyal aktivitas di Android Vitals | Kirim reminder email berisi skenario pengujian 5 menit (misal: "Coba fitur diskon manual hari ini"). |
