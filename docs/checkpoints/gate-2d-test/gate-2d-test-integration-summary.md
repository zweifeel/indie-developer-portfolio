# SLEEPYKOALA CMS — GATE 2D INTEGRATION SUMMARY

**Checkpoint ID:** `gate-2d-test-20261101-v1`  
**Status:** COMPLETE & FROZEN  

---

## 1. Integrasi Dashboard Admin (`/admin`)

Dashboard administrator telah terintegrasi sepenuhnya dengan backend CMS TEST dan spreadsheet `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4`:

### A. Autentikasi & Sesi
- Sesi diverifikasi melalui cookie `sk_admin_session` yang divalidasi via HMAC-SHA256 (`ADMIN_SESSION_SECRET`).
- Setiap permintaan mutasi (POST, PUT, DELETE) wajib menyertakan header proteksi CSRF `X-SleepyKoala-Admin: 1` dan lolos validasi origin `Sec-Fetch-Site`.
- Sesi terikat pada `sessionVersion` di database; pembaruan versi sesi secara otomatis mencabut seluruh sesi aktif (*instant session revocation*).

### B. Tinjauan Metrik Dashboard (Section 4.B)
- Menampilkan 8 metrik operasional secara simultan:
  1. Total Proyek
  2. Proyek Terpublikasi (PUBLISHED)
  3. Proyek Draf (DRAFT)
  4. Proyek Diarsipkan (ARCHIVED)
  5. Total Media
  6. Media Terpublikasi (PUBLISHED)
  7. Media Draf (DRAFT)
  8. Media Diarsipkan (ARCHIVED)
- Status loading (`loadingData`), penanganan error dengan tombol coba lagi (`loadError`), dan status kosong (`projects.length === 0`) disajikan secara terpisah tanpa manipulasi data palsu.

### C. Manajemen Siklus Proyek (CRUD)
- **Create:** Membuat draf proyek baru dengan input field terstruktur.
- **Read:** Membaca daftar proyek terurut sesuai prioritas.
- **Update:** Mengedit seluruh metadata (kategori, status pengembangan, deskripsi, tagline, durasi closed testing, ikon, dan tangkapan layar).
- **Publish / Unpublish:** Mengubah status antara `PUBLISHED` dan `DRAFT`.
- **Archive / Restore:** Mengarsipkan proyek tidak aktif dan memulihkannya kembali.
- **Reorder:** Menggeser prioritas naik/turun yang langsung diupdate ke Google Sheets via `ADMIN_REORDER_PROJECTS`.
- **Pratinjau (Preview Mode):** Administrator dapat melihat simulasi tampilan halaman publik sebelum dipublikasikan.

### D. Pustaka Media & Penyimpanan
- **Upload:** Mendukung berkas WebP, PNG, JPEG dengan batas ukuran 2.0 MB, verifikasi magic bytes dan checksum SHA-256.
- **Admin Preview:** Pratinjau gambar terotentikasi via `/api/admin/media/:mediaId` dengan header `Cache-Control: private, no-store`.
- **Replace:** Penggantian gambar dengan berkas baru sembari mengarsipkan aset lama secara otomatis.
- **Filter & Cari:** Filter interaktif berdasarkan proyek, role (`GALLERY`, `ICON`, `FEATURE_GRAPHIC`, `SCREENSHOT`), dan visibilitas (`PUBLISHED`, `DRAFT`, `ARCHIVED`).
- **Penghapusan:** Pilihan soft-delete (arsip) atau penghapusan fisik permanen dari Google Drive dan database setelah konfirmasi administrator.

---

## 2. Integrasi Website Publik

Website portofolio publik (`HomePage`, `ProjectsPage`, `ProjectDetailPage`, `FeedbackPage`) kini bersumber dinamis dari endpoint `/api/projects`:

1. **Sinkronisasi Reaktif:** Komponen menggunakan hook `useProjects()` yang memuat proyek aktif saat aplikasi dibuka.
2. **Eliminasi Ketergantungan Build:** Pembaruan konten di CMS langsung terlihat pada request pengunjung berikutnya tanpa perlu mengedit `projects.json` atau melakukan commit/build ulang.
3. **Penyaringan Fail-Closed:** Proyek yang berstatus `DRAFT` atau `ARCHIVED` tidak pernah disajikan di katalog publik, dan akses langsung ke slug proyek draf/arsip mengembalikan HTTP 404.
4. **Fallback Statis Terdokumentasi:** Jika terjadi kegagalan jaringan atau timeout upstream ke Apps Script, sistem beralih secara anggun ke dataset statis `projects.json` dengan penanda header `X-Data-Source: fallback-static`.
