# SLEEPYKOALA STUDIO — KEBIJAKAN KEAMANAN & PEMINDAIAN LOKAL (A1)
## LOCAL SECURITY & PRIVACY SCANNING POLICY

**Status:** Aktif & Diberlakukan untuk Seluruh Workspace  
**Prinsip Utama:** Local-First, Zero-Third-Party Upload, Fail-Closed, Zero Secret Leakage

---

## 1. LATAR BELAKANG & TUJUAN

Setiap project SleepyKoala Studio dikembangkan dalam workspace Antigravity masing-masing dan dihubungkan ke repository GitHub Private. Meskipun berstatus **Private**, repository dilarang keras menyimpan kredensial atau data pribadi pengguna.

Tooling pemindai lokal (`scripts/security-scan.js`) bertugas memindai kode sumber, konfigurasi, dan aset sebelum commit/push dilakukan, memastikan:
1. Tidak ada rahasia, API key, token, private key, atau keystore yang masuk ke Git.
2. Tidak ada Personally Identifiable Information (PII) yang terekspos.
3. Nilai temuan sensitif **tidak pernah dicetak** dalam log, terminal, screenshot, maupun laporan (disamarkan sebagai `***REDACTED***`).
4. File sensitif **tidak pernah dihapus atau diubah secara otomatis** (menghindari kehilangan data pengguna tanpa disengaja).
5. Kode sumber **tidak pernah diunggah** ke layanan scanner cloud pihak ketiga ($0.00 / Zero-Cost).

---

## 2. ATURAN DATA YANG DILARANG (STRICT DENYLIST)

### 2.1 Kredensial & Rahasia (Secrets)
- **Private Keys:** `-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`.
- **API Keys:** Google/Firebase API Key (`AIza...`), Cloudflare Global Key, AWS Access Key (`AKIA...`).
- **Access Tokens:** GitHub PAT (`ghp_...`, `github_pat_...`), Slack tokens, OAuth client secrets.
- **File Konfigurasi Lingkungan:** `.env`, `.env.local`, `.dev.vars`, `credentials.json`, `webcredential.txt`.
- **Kredensial Service Account:** `service-account*.json`, Google Play API JSON.
- **Android Keystore & Signing:** `*.jks`, `*.keystore`, `*.pk8`, `*.der`, `signing.properties`.
- **Database Connection URIs:** Connection string dengan password tersemat (`postgres://user:pass@host`).
- **Hardcoded Passwords:** Deklarasi kata sandi langsung dalam kode sumber.

### 2.2 Data Pribadi (Personally Identifiable Information / PII)
- **Data Kependudukan:** Nomor Induk Kependudukan (NIK 16-digit) dalam konteks data pengguna.
- **Nomor Telepon Pribadi:** Format Indonesia (`+628...` / `08...`) dalam data pelanggan/tester.
- **Nomor Kartu Pembayaran:** 13-16 digit kandidat nomor kartu kredit/debit.
- **Database Dump & Log:** File `.dump`, `.sql`, ekspor data CSV pelanggan, error crash dump berisi identitas pengguna.
- **Screenshot Sensitif:** Tangkapan layar yang menampilkan email, nomor telepon, atau data tester.

---

## 3. MEKANISME FAIL-CLOSED

Scanner menerapkan aturan **Fail-Closed**:
- Jika ditemukan minimal 1 pelanggaran kategori `CRITICAL` atau `HIGH`, proses pemindaian segera mengembalikan exit code `1`.
- Skrip otomatisasi commit/push wajib membatalkan proses Git write jika exit code adalah `1`.
- Pengembang/pengguna harus membersihkan atau memindahkan file rahasia ke konfigurasi lokal yang aman (`.gitignore`) sebelum dapat melanjutkan.

---

## 4. PENANGANAN REDAKSI & PELAPORAN

- Scanner hanya menampilkan:
  - ID Aturan (misal: `SEC-002`, `PII-001`)
  - Kategori & Tingkat Keparahan (`CRITICAL`, `HIGH`)
  - Path File & Baris (misal: `src/config.ts:14`)
  - Deskripsi Aturan
  - Pratinjau Tersamarkan (`AIza***REDACTED***1b`, `[Prohibited File: release.jks]`)
- Nilai asli rahasia tidak pernah ditampilkan ke konsol (`stdout` / `stderr`).

---

## 5. PANDUAN PENGUJIAN DENGAN FIXTURE DUMMY

Pengujian scanner hanya boleh menggunakan nilai palsu (*dummy test fixtures*) yang secara khusus dibuat untuk pengujian:
- Contoh Google API Key dummy: `AIzaSyDUMMY_TEST_KEY_FOR_SCANNER_987654`
- Contoh GitHub PAT dummy: `ghp_DUMMY_GITHUB_PAT_FOR_UNIT_TEST_998877`
- Contoh NIK dummy: `3171010101990001` dalam konteks `test_nik`
- Dilarang keras menggunakan kredensial produksi atau data pribadi nyata dalam pengujian apa pun.
