# SLEEPYKOALA CMS — PRIVACY BOUNDARY & DATA SANITIZATION POLICY

## 1. PENDAHULUAN

SleepyKoala Studio memprioritaskan keamanan informasi dan privasi kode sumber. Dokumen ini mendefinisikan batasan privasi mutlak (privacy boundary) antara sistem internal pengembang dengan data publik yang disajikan melalui CMS.

---

## 2. EMPAT LARANGAN MUTLAK KEBOCORAN (FOUR ZERO LEAKAGE INVARIANTS)

Sistem CMS menjamin secara kriptografis dan prosedural empat hal berikut:

1. **Zero Secret & Credential Leakage:**
   Tidak ada API key, token GitHub, webhook secret, password database, atau private key yang boleh muncul dalam respons API publik maupun audit log.
2. **Zero Commit Hash Leakage:**
   SHA-1 atau SHA-256 Git commit hash bersifat internal. API publik hanya menyajikan tanggal pembaruan umum atau nomor versi rilis semantik.
3. **Zero Internal Branch Leakage:**
   Nama branch internal pengembang (misalnya: `feature/internal-refactor`, `fix/issue-123`) tidak pernah dipublikasikan.
4. **Zero Local File Path Leakage:**
   Jalur direktori komputer lokal (misalnya: `C:\Users\Admin\...`, `/home/developer/...`, `E:\Antigravity Project\...`) dilarang keras muncul dalam deskripsi publik, metadata, maupun URL aset.

---

## 3. MEKANISME ENFORCEMENT & DETEKSI OTOMATIS

### A. Validasi Input Mutasi CMS (`portfolioMetadataValidator.ts`)
Setiap payload pembaruan yang dikirimkan ke CMS diperiksa terhadap:
- **Kunci Prohibited:** Deteksi keberadaan key seperti `secretToken`, `internalBranch`, `localFilePath`, `gitRemoteUrl`, `privateKey`, `credential`. Payload yang mengandung key ini ditolak dengan error `PROHIBITED_KEY_DETECTED`.
- **Pola Konten Sensitif:** Regex scanner mendeteksi pola path sistem operasi (`[A-Za-z]:\\` atau `/Users/` atau `/home/`), token `ghp_`, atau key `AIzaSy`. Payload ditolak dengan error `SENSITIVE_CONTENT_LEAK`.

### B. Proyeksi Whitelist Publik (`extractPublicProgress`)
Bahkan jika data internal lolos ke database:
- Fungsi `extractPublicProgress()` menyaring data secara whitelist, bukan blacklist.
- Hanya field-field yang terdaftar secara eksplisit dalam tipe `PublicProjectProgress` yang diizinkan keluar ke browser publik.
- Seluruh properti lain dibuang secara permanen.

---

## 4. PENANGANAN ASSET & TANGKAPAN LAYAR

1. Seluruh URL tangkapan layar wajib menggunakan jalur relatif kanonikal di bawah `/assets/projects/<slug>/screenshots/`.
2. Dilarang menggunakan URL hosting sementara, link Discord CDN, atau tautan lokal `file:///`.
3. Seluruh gambar wajib menjalani proses sanitasi visual untuk memastikan tidak ada data pelanggan atau antarmuka internal yang sensitif.
