# SleepyKoala Studio --- Roadmap Otomatisasi Progres & Keamanan GitHub

**Status:** Rancangan dikunci sebagai baseline; implementasi belum
dimulai hanya dengan dibuatnya dokumen ini.

## 1. Tujuan

Membangun alur otomatis untuk setiap project: 1. Workspace Antigravity
project mengembangkan dan menguji project. 2. Setelah satu task selesai,
workspace memeriksa perubahan, menjalankan test/build, secret scanning,
dan privacy scanning. 3. Jika seluruh pemeriksaan lolos, workspace
melakukan Git commit dan push ke repository GitHub Private project yang
sesuai. 4. Push memicu backend SleepyKoala untuk mengambil metadata
progres yang diizinkan. 5. Website memperbarui halaman detail project
yang sudah ada.

Website SleepyKoala adalah penerima, validator, sinkronisator, dan
penerbit metadata progres. Website bukan pelaku commit/push source code
project lain.

## 2. Prinsip arsitektur

### Workspace project

Setiap project memiliki workspace Antigravity sendiri. Workspace
tersebut hanya mengelola repository project itu sendiri, termasuk
pengembangan, test, pemeriksaan keamanan, commit, push, dan metadata
progres.

### GitHub

-   Satu repository **Private** untuk setiap project.
-   Semua repository dikelola melalui satu akun GitHub utama pengguna.
-   Autentikasi lokal menggunakan Git Credential Manager atau GitHub
    CLI.
-   GitHub Desktop opsional untuk melihat diff, riwayat, status
    repository, dan pemulihan manual.
-   Tidak perlu login ulang per project jika autentikasi Git lokal sudah
    tersedia.
-   Jangan pernah menyimpan token atau password di source code, remote
    URL, file project, log, screenshot, maupun dokumentasi.

### Website SleepyKoala

-   Menggunakan halaman detail project dan CMS yang sudah ada.
-   Backend mengakses repository Private secara server-side dengan
    permission minimum.
-   Token tidak boleh dikirim ke browser.
-   Hanya metadata whitelist yang diambil; source code tidak disalin ke
    website publik.
-   Push event memicu sinkronisasi. Rekonsiliasi terjadwal boleh
    digunakan secara terbatas untuk event terlewat.
-   Jika kuota gratis habis, sinkronisasi ditunda/gagal aman. Tidak
    boleh upgrade, mengaktifkan billing, atau retry tanpa batas.

## 3. Pemetaan repository

Satu repository Private per project:

  -------------------------------------------------------------------------------
  Project           Slug                  Repository yang       Visibilitas
                                          disarankan            
  ----------------- --------------------- --------------------- -----------------
  DompetNalar       `dompetnalar`         `dompetnalar`         Private

  IDLE MASTER       `idle-master`         `idle-master`         Private

  Mobile Kasir      `mobile-kasir`        `mobile-kasir`        Private

  Idle Mining       `idle-mining`         `idle-mining`         Private

  The Broken Origin `the-broken-origin`   `the-broken-origin`   Private

  Worklume          `worklume`            `worklume`            Private
  -------------------------------------------------------------------------------

Nama repository adalah usulan dan diverifikasi saat onboarding.
Workspace tidak boleh push ke repository project lain. Sebelum Git write
operation, verifikasi root folder, remote URL, repository identity,
branch, dan akun Git. Jika ada ketidaksesuaian, hentikan proses; jangan
menebak atau memperbaiki remote secara otomatis.

## 4. Metadata progres

Setiap repository menyediakan direktori metadata khusus, misalnya:

``` text
docs/
  portfolio/
    roadmap.json
    features.json
    screenshots/
      README.md
```

Format final harus menggunakan schema berversi dan konsisten untuk semua
project.

### Status implementasi

-   `planned`
-   `in_progress`
-   `completed`
-   `on_hold`
-   `cancelled`

### Status publikasi

-   `draft`
-   `public`
-   `hidden`

Keduanya wajib terpisah. Item baru default `draft`. Status `completed`
tidak otomatis berarti `public`. Hanya item `public` yang valid boleh
ditampilkan. Item `hidden` harus berhenti tampil, termasuk jika
sebelumnya pernah dipublikasikan.

### Konten yang boleh dipublikasikan

Hanya: 1. Roadmap. 2. Nama fitur. 3. Deskripsi fitur. 4. Screenshot
aktual yang telah disetujui.

Jangan mempublikasikan branch, commit hash/history, source code,
struktur repository, backend architecture, server provider, endpoint
internal, token, API key, kredensial, log, atau informasi pribadi.

### Screenshot

Screenshot harus berasal dari aplikasi/game aktual, bukan mockup yang
diklaim sebagai bukti implementasi. Setiap screenshot default `draft`
dan harus diperiksa dari notifikasi, email, nomor telepon, alamat, ID
akun, data pelanggan/tester, kredensial, log, terminal, tab browser, dan
informasi internal. Screenshot yang meragukan tidak boleh
dipublikasikan. Status publikasi screenshot terpisah dari status fitur.

## 5. Alur auto commit dan push

Otomatisasi berjalan setelah satu task/unit pekerjaan selesai, bukan
setiap file disimpan.

1.  Identifikasi workspace dan project.
2.  Verifikasi root folder, remote, repository, branch, dan akun Git.
3.  Periksa seluruh file modified, added, deleted, renamed, untracked,
    ignored, serta file yang sudah ter-track.
4.  Jalankan test, lint, typecheck, build, atau validasi relevan.
5.  Jalankan secret scanning dan privacy scanning.
6.  Periksa diff dan pastikan perubahan sesuai task.
7.  Validasi metadata dan referensi screenshot.
8.  Commit hanya jika semua pemeriksaan wajib lolos.
9.  Push hanya ke remote/branch yang sudah diverifikasi.
10. Laporkan hasil dengan bukti; jangan mengklaim sukses jika perintah
    gagal.

Jika test gagal, ditemukan rahasia/data pribadi, file tidak dikenal,
remote salah, autentikasi gagal, atau konflik, hentikan otomatisasi.
Jangan melewati pemeriksaan atau menutupi kegagalan.

Aturan Git: - Dilarang `git push --force` dan `--force-with-lease`. -
Jangan melakukan amend, rebase, reset, clean, atau penghapusan
destruktif otomatis. - Jangan menghapus perubahan pengguna yang belum
dikomit. - Jangan memakai `git add .` secara membabi buta tanpa meninjau
file yang akan masuk. - Konflik/non-fast-forward harus dilaporkan;
jangan menimpa remote. - Pesan commit tidak boleh memuat data pribadi
atau rahasia.

## 6. Kebijakan keamanan wajib untuk semua project

Aturan ini berlaku untuk setiap workspace dan repository, walaupun
repository berstatus Private.

### 6.1 Data yang dilarang masuk Git

**Rahasia/kredensial:** - API key, access token, refresh token, bearer
token. - OAuth client secret, password, PIN, recovery code. - Private
key, SSH private key, certificate private material. - Service-account
JSON atau kredensial service account. - Database connection string yang
mengandung kredensial. - Cookie, session ID, CSRF secret, webhook
secret. - `.env`, `.env.local`, `.dev.vars`, file secret, konfigurasi
lokal sensitif. - Android keystore, signing configuration rahasia,
signing password. - Backup kredensial, export password manager, file
autentikasi.

**Informasi pribadi/data pengguna:** - Nama lengkap, email, nomor
telepon, alamat, tanggal lahir, atau identitas pribadi tanpa dasar/izin
publikasi. - ID akun, nomor pelanggan/transaksi, data pembayaran, data
tester. - Data kesehatan, keuangan, lokasi presisi, dan data sensitif
lain. - Database dump, backup, ekspor CSV/Excel pengguna, log produksi,
crash dump, screenshot berisi data pribadi. - Percakapan, email, atau
dokumen privat pihak lain.

**Informasi operasional internal:** - URL admin privat atau endpoint
internal yang tidak ditujukan untuk publik. - Konfigurasi produksi,
detail infrastruktur, log autentikasi. - Cache, temporary files, artefak
lokal yang tidak dibutuhkan.

Daftar ini adalah batas minimum. Temuan yang meragukan harus dianggap
sensitif sampai terbukti aman.

### 6.2 Pengamanan repository

Setiap repository wajib memiliki: - `.gitignore` sesuai teknologi
project. - Aturan allowlist/denylist file. - Contoh konfigurasi seperti
`.env.example` hanya bila diperlukan dan semua nilainya dummy. -
Dokumentasi penyediaan secret secara lokal tanpa menuliskan nilainya. -
Secret scanner lokal gratis sebelum commit dan push. - Pemeriksaan file
yang sudah ter-track; `.gitignore` saja tidak cukup. - Pemeriksaan
commit yang akan didorong. - Hak akses repository seminimal mungkin. -
Perlindungan branch yang tersedia pada paket gratis, tanpa fitur
berbayar.

Utamakan scanner lokal gratis. Jangan mengunggah source code ke layanan
pemindai pihak ketiga.

### 6.3 Jika rahasia terdeteksi

1.  Batalkan commit/push otomatis.
2.  Jangan cetak nilai rahasia ke terminal, log, laporan, atau chat.
3.  Laporkan nama file, kategori, dan lokasi secara tersamarkan.
4.  Jangan otomatis menghapus atau mengubah file pengguna.
5.  Jika rahasia pernah masuk Git, perlakukan sebagai kemungkinan
    kebocoran dan sarankan pencabutan/rotasi melalui pemiliknya.
6.  Menghapus file pada commit terbaru tidak berarti rahasia hilang dari
    riwayat.
7.  Jangan rewrite history atau force push tanpa otorisasi eksplisit dan
    rencana pemulihan.

### 6.4 Autentikasi GitHub

-   Gunakan Git Credential Manager atau GitHub CLI.
-   Jangan menaruh token di remote URL, source code, script, prompt,
    log, screenshot, atau dokumentasi.
-   Jangan membuat file token baru di workspace.
-   Jangan menampilkan token saat memeriksa autentikasi.
-   Gunakan akun GitHub utama yang diotorisasi pengguna.
-   Jika login/otorisasi tidak tersedia atau kedaluwarsa, hentikan push
    dan minta pengguna menyelesaikan autentikasi.

**Repository Private bukan pengganti secret management.** Semua
repository harus tetap bersih dari kredensial dan data pribadi.

## 7. Integrasi backend GitHub

Preferensi: - GitHub App yang dibatasi ke repository terpilih, dengan
permission read-only minimum untuk metadata/contents. - Fine-grained PAT
terbatas ke repository terpilih hanya sebagai alternatif MVP jika GitHub
App tidak layak. - Token hanya disimpan di secret storage/backend
environment. - Webhook push menjadi pemicu sinkronisasi. - Rekonsiliasi
terjadwal terbatas untuk event terlewat. - Validasi asal webhook,
repository mapping, ref/commit, schema, ukuran, tipe media, URL, dan
referensi file. - Ambil hanya path whitelist. - Sanitasi/menolak HTML
atau konten aktif yang tidak aman. - Proses idempotent agar event
berulang tidak menggandakan data. - Audit log tidak boleh menyimpan
token, payload sensitif, atau rahasia. - Kegagalan sinkronisasi tidak
boleh membuka draft atau menghapus konten publik valid.

## 8. Integrasi CMS dan Web Admin

Web Admin perlu menyediakan: - Pemetaan project ke repository Private. -
Status koneksi/sinkronisasi per project. - Waktu dan hasil sinkronisasi
terakhir. - Pesan error aman tanpa rahasia. - Preview konten. - Kontrol
publish, hide, dan unpublish. - Status publikasi roadmap, fitur, dan
screenshot. - Audit log perubahan publikasi.

Tampilkan status koneksi, bukan nilai token/secret. Perubahan konten
biasa harus dapat dilakukan lewat Web Admin tanpa source-code edit
setelah fitur tersedia.

## 9. Batasan biaya

-   Hanya gunakan layanan gratis yang memenuhi kebutuhan.
-   Dilarang mengaktifkan billing, kartu pembayaran, free trial,
    upgrade, domain/hosting/VPS berbayar.
-   Pantau kuota API, webhook, dan storage.
-   Gunakan event-driven sync untuk menghindari polling berlebihan.
-   Retry harus terbatas, memakai backoff dan idempotency.
-   Jika kuota habis, tunda/gagalkan dengan aman; jangan upgrade.
-   Jangan mengklaim biaya mutlak Rp0 sebelum kuota dan konfigurasi akun
    diverifikasi.

## 10. Tahapan roadmap implementasi

### Tahap 0 --- Discovery dan inventarisasi read-only

-   Audit workspace, repository, root folder, remote, branch, dan
    autentikasi.
-   Audit CMS SleepyKoala: project detail, Web Admin, backend, Apps
    Script, Cloudflare, storage, audit log.
-   Inventarisasi integrasi GitHub dan batas gratis.
-   Identifikasi risiko secret/PII per project.
-   Buat diagram alur dan daftar file yang akan diubah.

**Gate:** tidak ada source-code edit, commit, push, deploy, atau mutasi
production Apps Script/spreadsheet.

### Tahap 1 --- Standar repository dan keamanan lokal

-   Tetapkan repository Private per project dan mapping workspace.
-   Terapkan `.gitignore`, allowlist/denylist, contoh konfigurasi aman.
-   Pilih scanner lokal gratis.
-   Implementasikan pre-commit/pre-push check atau mekanisme setara.
-   Uji dengan fixture dummy, termasuk file yang sudah ter-track.

**Gate:** temuan secret dummy memblokir commit/push; nilai rahasia tidak
muncul di log; tidak ada kredensial sungguhan digunakan dalam test.

### Tahap 2 --- Metadata progres dan schema

-   Definisikan schema berversi untuk roadmap, fitur, screenshot.
-   Pisahkan status implementasi dan publikasi.
-   Default `draft`.
-   Tetapkan ID, ukuran, tipe file, dan validasi.
-   Dokumentasikan cara Antigravity memperbarui metadata.

**Gate:** `completed` tidak otomatis `public`; draft/hidden tidak dapat
tampil.

### Tahap 3 --- Otomatisasi commit/push

-   Konfigurasikan autentikasi Git lokal.
-   Verifikasi remote per workspace.
-   Implementasikan test, scan, diff review, commit, push.
-   Tangani konflik, remote salah, dan autentikasi gagal secara
    fail-closed.

**Gate:** hanya repository yang dipetakan dapat dituju; tidak ada force
push/destructive Git command otomatis; perubahan pengguna terjaga.

### Tahap 4 --- Backend GitHub sync

-   Implementasikan integrasi server-side permission minimum.
-   Simpan token hanya di backend secret storage.
-   Implementasikan validasi webhook dan mapping repository.
-   Ambil metadata whitelist saja.
-   Terapkan schema validation, sanitasi, limit ukuran, idempotency,
    audit log, retry terbatas.

**Gate:** token tidak pernah masuk browser; repository/event invalid
ditolak; event duplikat aman; tidak ada billing/upgrade.

### Tahap 5 --- Integrasi CMS dan halaman project

-   Hubungkan metadata ke CMS yang sudah ada.
-   Tampilkan roadmap, fitur, dan screenshot di halaman detail.
-   Tambahkan preview, status sync, publish/hide/unpublish, audit log di
    Web Admin.
-   Pastikan responsif dan aksesibel.

**Gate:** hanya konten public yang tampil; konten dapat ditarik; tidak
ada detail Git/internal yang terekspos.

### Tahap 6 --- Uji keamanan dan integrasi menyeluruh

Uji secret/PII dummy, file tracked, riwayat commit, screenshot sensitif,
metadata invalid, webhook palsu/duplikat, remote salah, konflik, kuota,
timeout, dan pemulihan.

**Gate:** semua uji keamanan kritis lulus; draft/hidden tidak dapat
diakses melalui URL/API publik; kegagalan selalu fail-closed.

### Tahap 7 --- Final readiness review dan persetujuan deployment

-   Audit kompatibilitas CMS/backend dan migrasi.
-   Verifikasi konfigurasi environment/secret tanpa menampilkan
    nilainya.
-   Siapkan deployment plan, smoke test, rollback, dan pemulihan.
-   Laporkan bukti, risiko, dan batasan.

**Gate:** tidak ada deployment otomatis; deployment hanya setelah
persetujuan eksplisit pengguna; tidak ada perubahan production di luar
scope.

## 11. Skenario uji wajib

  -----------------------------------------------------------------------
  Skenario                            Hasil wajib
  ----------------------------------- -----------------------------------
  API key/token dummy pada file baru  Commit/push diblokir

  Secret pada file yang sudah tracked Commit/push diblokir

  Secret dalam commit yang akan       Push diblokir
  didorong                            

  `.env`/keystore masuk staging       Commit diblokir

  Data pribadi dummy terdeteksi       Commit/publikasi diblokir sesuai
                                      konteks

  Screenshot berisi data pribadi      Tidak dipublikasikan

  Remote salah atau workspace salah   Proses berhenti

  Test/build gagal                    Commit/push berhenti

  Konflik/non-fast-forward            Tidak force push; laporkan

  Metadata invalid                    Sinkronisasi ditolak

  Status draft/hidden                 Tidak tampil publik

  Fitur completed tetapi draft        Tidak tampil publik

  Webhook invalid                     Ditolak

  Webhook duplikat                    Idempotent

  Kuota habis                         Tertunda/gagal aman; tidak upgrade

  Token tidak tersedia                Sinkronisasi berhenti tanpa
                                      membocorkan token
  -----------------------------------------------------------------------

Gunakan data dummy khusus pengujian, bukan kredensial sungguhan.

## 12. Aturan kerja Antigravity

Berlaku untuk semua workspace: 1. Patuhi batas workspace dan repository.
2. Jangan menampilkan atau menyalin secret ke source code, log,
screenshot, dokumentasi, atau chat. 3. Jangan mengandalkan `.gitignore`
saja. 4. Jangan commit/push sebelum scan keamanan selesai. 5. Jangan
menonaktifkan scanner untuk membuat proses berhasil. 6. Jangan
mengubah/menghapus file pengguna yang tidak terkait. 7. Jangan force
push atau rewrite history otomatis. 8. Jangan menyentuh production
website, Apps Script, spreadsheet, atau Cloudflare di luar scope dan
persetujuan. 9. Jangan deploy tanpa persetujuan eksplisit. 10. Jangan
aktifkan billing, upgrade, atau layanan berbayar. 11. Jangan mengklaim
test/scan/push/sync berhasil tanpa bukti. 12. Bedakan hasil nyata,
mock/simulasi, code review, dan hal yang belum diverifikasi.

Setiap laporan workspace harus memuat project/repository, daftar file
berubah, test/build, status secret/privacy scan, status commit/push,
status metadata publikasi, status sync (jika terbukti), error/risiko,
dan pekerjaan tertunda. Jangan pernah menyertakan nilai kredensial atau
data pribadi.

## 13. Di luar scope

-   Dashboard monitoring internal developer.
-   Menampilkan branch, commit history, atau aktivitas Git kepada
    pengunjung.
-   Mempublikasikan source code.
-   Menjadikan repository Public demi kemudahan integrasi.
-   Mempublikasikan semua screenshot secara otomatis.
-   Menganggap fitur selesai otomatis boleh diumumkan.
-   Membangun ulang branding SleepyKoala.
-   Mengubah project yang tidak terkait.
-   Deployment tanpa persetujuan.
-   Layanan berbayar, billing, free trial, VPS, atau domain berbayar.


## 14. AI Agent Crew — Virtual Development Office (baseline desain dikunci)

### 14.1 Tujuan dan batasan

SleepyKoala memiliki pengalaman visual **AI Agent Crew — Simulation** berupa kantor pengembangan virtual. Fitur ini adalah simulasi visual di browser, bukan sistem AI agent sungguhan dan bukan pemantauan aktivitas Antigravity secara realtime.

- Tidak memerlukan VPS, backend agent runtime, API AI, atau layanan berbayar.
- Tidak menjalankan tugas pengembangan, test, review, atau publikasi sungguhan.
- Jangan menyatakan atau memberi kesan bahwa agent sedang benar-benar mengerjakan project.
- Beri label yang terlihat jelas: **AI Agent Crew — Simulation**.
- Animasi tidak boleh mengganggu navigasi, konten portofolio, performa, atau aksesibilitas.

### 14.2 Arah visual yang dikunci

- **Bukan 3D.** Gunakan ilustrasi kantor virtual bergaya 2D/2.5D isometrik/stylized.
- Hindari WebGL, real-time 3D rendering, dan aset/efek berat.
- Gunakan teknologi web ringan seperti CSS, SVG, dan JavaScript.
- Visual dapat menampilkan karakter agent, meja kerja, komputer, ruang rapat, papan tugas, jalur komunikasi, dan partikel aktivitas.
- Gerakan dapat mencakup berjalan, mengetik, berdiskusi, membaca/meninjau, berpindah area, serta indikator agent aktif dalam simulasi.
- Sediakan tampilan responsif desktop/mobile dan dukungan `prefers-reduced-motion` atau kontrol pengurangan animasi.
- Animasi harus memiliki fallback statis yang informatif jika animasi dinonaktifkan atau perangkat berkinerja rendah.

### 14.3 Arsitektur: One Virtual HQ, Multiple Project Rooms

**Virtual HQ** adalah kantor pusat yang tampil pada dashboard utama portofolio.

- Dashboard menampilkan tampilan keseluruhan kantor/peta ruangan.
- Lima agent inti dapat terlihat pada area kerja pusat dan area bersama.
- Pengunjung dapat memilih ruangan proyek dari peta/navigasi kantor.
- Kamera/viewport dapat berpindah atau memperbesar ruangan yang dipilih; transisi harus ringan dan dapat dilewati.

**Project Room** adalah satu ruangan virtual untuk setiap project.

- Setiap project memiliki satu konfigurasi Project Room.
- Dashboard Virtual HQ dan halaman detail project harus menggunakan identitas serta konfigurasi ruangan yang sama; jangan membuat dua kantor/ruangan terpisah untuk project yang sama.
- Di dashboard, ruangan dilihat sebagai bagian dari keseluruhan kantor.
- Di halaman detail, viewport menampilkan close-up/zoom dari ruangan yang sama.
- Halaman daftar project cukup menampilkan indikator/ikon crew kecil; tidak perlu animasi kantor penuh pada setiap kartu.
- Ruangan memiliki dekorasi/tema dan konteks aktivitas yang sesuai dengan kategori serta deskripsi project, dengan identitas visual SleepyKoala yang konsisten.

### 14.4 Lima agent inti dan spesialisasi per project

Jumlah agent inti tetap **lima** dan identitas dasarnya konsisten di semua project:

1. **Planner Agent** — perencanaan, pemecahan tugas, prioritas.
2. **Developer Agent** — pengembangan/implementasi.
3. **Tester Agent** — pengujian dan pemeriksaan skenario.
4. **Reviewer Agent** — evaluasi kualitas dan konsistensi.
5. **Publisher Agent** — persiapan dokumentasi/materi publikasi dan kesiapan rilis.

Spesialisasi, deskripsi, dekorasi kontekstual, dan aktivitas simulasi ditentukan dari kategori serta deskripsi project. Contoh spesialisasi:

- Android application: App Architect, Android Developer, QA Tester, UX Reviewer, Release Manager.
- Offline game: Game Designer, Gameplay Developer, Balance Tester, Game Reviewer, Release Manager.
- MMORPG: World Designer, Systems Developer, Combat & Economy Tester, Multiplayer Reviewer, Release Manager.
- Web application: Web Architect, Frontend Developer, QA Tester, UX Reviewer, Deployment Coordinator.
- Business software: Business Analyst, Workflow Developer, Data Tester, UX Reviewer, Release Coordinator.

Nama spesialisasi di atas adalah contoh konfigurasi, bukan daftar role yang harus dipakai secara kaku. Jika kategori tidak dikenal atau data tidak cukup, gunakan konfigurasi universal yang aman. Jangan menambah jumlah agent inti otomatis hanya karena kategori project berbeda.

### 14.5 Pembuatan project dan ruangan otomatis

Saat project baru dibuat melalui Web Admin/CMS:

1. Sistem membuat konfigurasi Project Room dari data project (minimal nama, slug, kategori, dan deskripsi).
2. Sistem menyiapkan lima agent inti beserta spesialisasi, deskripsi, dan aktivitas simulasi kontekstual.
3. Sistem memilih tema/dekorasi ruangan berdasarkan kategori project menggunakan preset yang tersedia.
4. Ruangan baru otomatis ditambahkan ke peta Virtual HQ.
5. Halaman detail project menggunakan konfigurasi ruangan yang sama.
6. Jika kategori tidak dikenali, gunakan preset universal; jangan menggagalkan pembuatan project hanya karena generator tema tidak menemukan kecocokan.

Pembuatan ini harus **data-driven dan berbasis template/configuration**, bukan komponen hardcoded per project. Penambahan project ke-7, ke-20, atau berikutnya tidak boleh memerlukan source-code edit khusus untuk project tersebut.

Perubahan nama, kategori, atau deskripsi project dapat memicu rekomendasi pembaruan konfigurasi, tetapi jangan menimpa penyesuaian manual Admin tanpa konfirmasi atau aturan merge yang jelas.

### 14.6 Siklus hidup ruangan

- Project baru: buat ruangan dan konfigurasi agent otomatis.
- Project diedit: perbarui konteks ruangan sesuai perubahan; pertahankan penyesuaian manual yang tidak bertentangan.
- Project diarsipkan: pindahkan ruangan ke area/daftar arsip; jangan langsung menghapus konfigurasi.
- Project dihapus: nonaktifkan/hapus keterkaitan ruangan sesuai kebijakan penghapusan project dan konfirmasi Admin; jangan meninggalkan ruangan yatim yang tampil publik.
- Visibilitas ruangan mengikuti status publikasi/visibilitas project. Project draft/hidden tidak boleh bocor ke peta kantor publik.
- Project yang tidak dipublikasikan tidak boleh muncul hanya karena konfigurasi ruangannya tersedia.

### 14.7 Pengelolaan melalui Web Admin

Jika pengelolaan visual ini diimplementasikan, Admin setidaknya dapat:

- Melihat preview Virtual HQ dan Project Room.
- Mengubah tema/dekorasi dari preset yang tersedia.
- Mengubah nama tampilan, spesialisasi, dan deskripsi agent.
- Mengatur urutan/penempatan agent dan area ruangan dalam batas template.
- Mengaktifkan/nonaktifkan animasi atau memilih fallback statis.
- Memeriksa status visibilitas ruangan.

Pengaturan Admin tidak boleh mengubah label simulasi menjadi klaim aktivitas nyata. Jangan menambahkan pemantauan branch, commit, aktivitas Git, atau aktivitas Antigravity realtime sebagai bagian dari fitur ini.

### 14.8 Implementasi dan acceptance gate

Fitur Virtual Office adalah workstream desain/implementasi terpisah dari pipeline GitHub progress publishing. Penguncian konsep ini **bukan bukti implementasi** dan tidak memberi izin deployment.

Tahapan yang disarankan:

1. **Design/data contract:** definisikan schema konfigurasi Virtual HQ, Project Room, lima agent inti, preset kategori, status visibilitas, dan fallback universal.
2. **Static prototype:** buat satu Virtual HQ dan beberapa Project Room contoh menggunakan ilustrasi 2D/2.5D ringan; uji desktop/mobile dan reduced motion.
3. **Dynamic project provisioning:** hubungkan pembuatan project CMS dengan generator konfigurasi room/agent berbasis data.
4. **Shared room rendering:** pastikan dashboard dan halaman detail memakai konfigurasi/identitas room yang sama; halaman detail menampilkan close-up, bukan duplikat.
5. **Admin controls:** tambahkan preview dan pengaturan yang diperlukan tanpa mengharuskan source-code edit untuk project baru.
6. **Security, visibility, and performance tests:** uji project draft/hidden, arsip, penghapusan, kategori tak dikenal, banyak project, fallback, aksesibilitas, dan performa.
7. **Readiness review:** laporkan bukti implementasi, hasil test, batasan, dan rencana rollback. Deployment tetap memerlukan persetujuan eksplisit pengguna.

**Gate:** tidak ada VPS/AI API/layanan berbayar; tidak ada klaim aktivitas nyata; project baru menghasilkan room melalui data/config; dashboard dan detail menggunakan room yang sama; project private/draft tidak tampil publik; reduced motion/fallback berfungsi; tidak ada deployment tanpa persetujuan.

---

## 15. Definition of Done

Sistem selesai jika: - Setiap project yang di-onboard memiliki
repository Private terpisah dan mapping workspace benar. - Auto
commit/push hanya berjalan setelah test, diff review, secret scan, dan
privacy scan lolos. - Tidak ada rahasia atau data pribadi dalam commit
yang didorong. - Backend menyinkronkan metadata tanpa mengekspos
token. - Halaman project hanya menampilkan roadmap, nama/deskripsi
fitur, dan screenshot yang disetujui. - Draft/hidden tetap tidak publik
dan dapat ditarik. - Web Admin mengelola mapping, preview, status, dan
publikasi. - Audit log/laporan tidak membocorkan informasi sensitif. -
Batas gratis dipatuhi dan kuota habis ditangani aman. - Bukti test dan
final readiness review tersedia. - Deployment hanya setelah persetujuan
eksplisit pengguna.

-   Virtual HQ menggunakan visual 2D/2.5D ringan, bukan 3D.
-   Setiap project memiliki Project Room yang dibuat dari konfigurasi data.
-   Dashboard dan halaman detail menggunakan identitas/konfigurasi room yang sama.
-   Project baru otomatis memperoleh lima agent inti dengan spesialisasi sesuai kategori/deskripsi.
-   Project draft/hidden tidak muncul di Virtual HQ publik.
-   Animasi selalu diberi label simulasi, memiliki fallback statis, dan mendukung reduced motion.
-   Fitur Virtual Office tidak membutuhkan VPS, AI API, atau layanan berbayar.

**Status dokumen:** rancangan dan aturan keamanan serta konsep Virtual Office dikunci sebagai baseline. Roadmap ini bukan bukti bahwa implementasi sudah dimulai atau selesai.
