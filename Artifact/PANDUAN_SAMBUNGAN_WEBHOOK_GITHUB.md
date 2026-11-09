# PANDUAN PRAKTIS: MENYAMBUNGKAN GITHUB WEBHOOK KE WEBSITE SLEEPYKOALA STUDIO

> [!NOTE]
> **Identitas Panduan:**
> - **Proyek:** SleepyKoala Studio — Indie Developer Portfolio
> - **Repositori Terhubung:** `lunachroc07-dot/FinSmart` (DompetNalar)
> - **Biaya:** **Rp 0 / $0.00 (100% Gratis Tanpa Langganan)**

---

## 🎯 Tujuan Panduan Ini

Panduan ini memandu Owner (Non-Coder) langkah demi langkah untuk menyambungkan repositori GitHub game DompetNalar (`FinSmart`) ke website resmi SleepyKoala Studio (`sleepykoala.pages.dev`).

Setelah jembatan ini terpasang:
- Setiap kali developer melakukan **commit** atau **push** fitur baru di game DompetNalar, GitHub akan otomatis mengirimkan sinyal ke website.
- Website akan menerima kabar tersebut dan menyimpannya secara aman sebagai **Draf**.
- Owner cukup membuka halaman **Web Admin CMS** (`/admin`) di website, meninjau perubahannya, dan menekan tombol publikasi!

---

## 📋 Langkah 1: Pasang Variabel Rahasia di Cloudflare Pages Dashboard

1. Buka browser dan login ke akun Cloudflare Anda: [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Pada menu sebelah kiri, klik **Workers & Pages**.
3. Pilih proyek: **`sleepykoala`**.
4. Klik tab **Settings** di bagian atas, lalu pilih submenu **Environment variables**.
5. Pada bagian **Production**, klik **Add variables** dan masukkan variabel rahasia berikut:

| Nama Variabel (Variable Name) | Nilai (Value) | Keterangan |
| :--- | :--- | :--- |
| `GITHUB_WEBHOOK_SECRET` | *(Buat kata sandi acak, misal: `koala_secret_2026_xyz`)* | Kunci gembok agar orang asing tidak bisa mengirim laporan palsu. Catat kunci ini karena akan dipakai di Langkah 2! |
| `GAS_WEBAPP_URL` | *(URL Google Apps Script Anda)* | Alamat database Google Sheets Anda. |
| `APPS_SCRIPT_SECRET` | *(Kunci rahasia Google Apps Script Anda)* | Kunci penghubung Cloudflare ke database Google. |

6. Klik tombol **Save** (Simpan).

---

## 📋 Langkah 2: Daftarkan Webhook di Repositori GitHub FinSmart

1. Buka browser dan buka halaman pengaturan repositori game Anda:  
   👉 `https://github.com/lunachroc07-dot/FinSmart/settings/hooks`
2. Di pojok kanan atas, klik tombol hijau **Add webhook**.
3. Jika diminta konfirmasi kata sandi akun GitHub, masukkan kata sandi Anda.
4. Isi formulir dengan data berikut:

```text
Payload URL:
https://sleepykoala.pages.dev/api/webhook/github

Content type:
application/json   <-- (PENTING: Pilih application/json, JANGAN application/x-www-form-urlencoded)

Secret:
(Masukkan kata sandi yang sama persis dengan yang Anda buat di Langkah 1 tadi)

SSL verification:
Enable SSL verification (Biarkan tercentang hijau)

Which events would you like to trigger this webhook?
(•) Just the push event
atau centang [x] Releases jika ingin versi rilis juga tercatat otomatis.

Active:
[x] Centang kotak "Active"
```

5. Klik tombol hijau **Add webhook** di bagian paling bawah.

---

## 📋 Langkah 3: Periksa Lampu Hijau (Ping Test PONG)

1. Begitu tombol *Add webhook* diklik, GitHub akan otomatis mengirimkan sinyal uji coba (*ping*) ke website Anda.
2. Segarkan (*refresh*) halaman Webhooks di GitHub.
3. Anda akan melihat ikon centang hijau ✅ di sebelah URL webhook `https://sleepykoala.pages.dev/api/webhook/github`.
4. Jika diklik, Anda akan melihat riwayat respons:
   - **Status Code:** `HTTP 200 OK`
   - **Response Body:** `{"success": true, "status": "PONG", "zen": "Keep it logically awesome."}`
5. Selamat! Jembatan otomatis antara game Anda dan website portofolio kini telah resmi aktif sempurna di internet!

---

## 🛡️ Jaminan Keamanan Terpasang:
- **Anti-Bocor:** Fitur game yang baru di-push TIDAK AKAN langsung tampil di website umum. Sistem selalu menyimpannya sebagai **Draf**.
- **Anti-Palsu:** Jika ada orang asing yang mencoba mengirimkan laporan tanpa rahasia yang cocok, Cloudflare langsung memblokirnya dengan kode `HTTP 401 Unauthorized`.
- **Anti-Duplikasi:** Jika GitHub mengirim sinyal berulang kali, sistem otomatis mengabaikan duplikasi tersebut tanpa membuat data berantakan.
