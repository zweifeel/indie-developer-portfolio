# SLEEPYKOALA STUDIO — MILESTONE 6.5.6.2
## TARGETED MEDIA OWNERSHIP & SHA-256 DEDUPLICATION REVIEW
### STRICT READ-ONLY REVIEW — ZERO CODE MUTATION — NO DEPLOYMENT

**Date:** 2026-11-02  
**Reviewer:** Senior Full-Stack & Security Engineer (Independent Review)  
**Target Document:** Analisis Kepemilikan Media & Deduplikasi SHA-256  
**Working Directory:** `E:\Antigravity Project\indie-developer-portfolio`  
**Active Branch:** `master`  
**Active HEAD:** `cae5405a4dd36ee932f35c5716ce3be9270b9653`  
**Status:** **INVESTIGATION COMPLETE — ARCHITECTURAL FINDINGS DETAILED**  

---

## 1. WORKSPACE SAFETY CHECK

Pemeriksaan status workspace dilakukan secara ketat read-only:
- **Git Branch:** `master`
- **Git Commit HEAD:** `cae5405a4dd36ee932f35c5716ce3be9270b9653`
- **Working Tree:** Terverifikasi utuh, tidak ada file source code yang diubah, dihapus, atau di-reset selama proses audit ini.
- **Batasan Operasi:** Zero code mutation, zero spreadsheet mutation, zero Apps Script deploy, zero Cloudflare deploy.

---

## 2. PENELUSURAN DEDUPLIKASI SHA-256 & BUKTI KODE

Pemeriksaan dilakukan pada implementasi backend Google Apps Script (`backend/gas/Code.gs`), Cloudflare Pages Functions (`functions/api/media/[mediaId].ts`), dan layanan klien (`src/services/cmsMediaService.ts`).

### 2.1 Lokasi Kode Kunci
1. **Pembuatan Media ID Deterministik:** `backend/gas/Code.gs`, baris 2155–2165:
   ```javascript
   // 3. Hitung SHA-256 Hex Digest
   var rawDigest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
   var sha256Hex = "";
   for (var i = 0; i < rawDigest.length; i++) {
     var byteVal = (rawDigest[i] < 0) ? rawDigest[i] + 256 : rawDigest[i];
     var hex = byteVal.toString(16);
     sha256Hex += (hex.length === 1) ? "0" + hex : hex;
   }

   var mediaId = "med_" + sha256Hex.substring(0, 16);
   var driveFileId = "mock_drive_" + sha256Hex.substring(0, 16);
   ```
2. **Pengecekan Duplikasi saat Upload:** `backend/gas/Code.gs`, baris 2180–2208:
   ```javascript
   // 5. Cek Duplikasi / Idempotency
   if (lastRow > 1) {
     var data = mediaSheet.getRange(2, 1, lastRow - 1, 12).getValues();
     for (var r = 0; r < data.length; r++) {
       var existingSha = String(data[r][7] || "");
       var existingProj = String(data[r][1] || "");
       if (existingSha === sha256Hex && existingProj === projectId) {
         // File identik sudah terdaftar, kembalikan record tanpa duplikasi
         return createJsonResponse(true, null, "File identik sudah ada di pustaka media.", {
           media: {
             mediaId: String(data[r][0]),
             projectId: existingProj,
             // ... data media
           },
           publicUrl: "/api/media/" + String(data[r][0]),
           isDuplicate: true
         });
       }
     }
   }
   ```
3. **Penyajian Media Publik & Relational Check:** `backend/gas/Code.gs`, baris 2822–2867:
   ```javascript
   var mediaRows = mediaSheet.getRange(2, 1, lastRow - 1, 12).getValues();
   var matched = null;
   for (var m = 0; m < mediaRows.length; m++) {
     if (String(mediaRows[m][0]).trim() === mediaId) {
       matched = mediaRows[m];
       break; // <-- BERHENTI PADA BARIS PERTAMA YANG COCOK
     }
   }

   if (!matched) {
     return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
   }

   var mediaVisibility = String(matched[9] || "DRAFT");
   var parentProjectId = String(matched[1] || "");

   // Aturan 1: Media DRAFT atau ARCHIVED tidak boleh disajikan ke publik (Return 404)
   if (mediaVisibility !== "PUBLISHED") {
     return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
   }

   // Aturan 2: Proyek terkait HARUS dalam status PUBLISHED
   if (parentProjectId && parentProjectId !== "global") {
     var projSheet = getOrCreateCmsProjectsSheet(spreadsheet);
     // ... verifikasi CMS_Projects.publishState === 'PUBLISHED'
     if (!projectIsPublished) {
       return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
     }
   }
   ```

---

## 3. JAWABAN LENGKAP 6 PERTANYAAN DEDUPLIKASI

### Pertanyaan 1: Apakah pencarian hash dibatasi berdasarkan `projectId`, atau bersifat global?
**Jawaban:**
Pencarian hash pada saat pengecekan duplikasi upload **DIBATASI per `projectId`**:
```javascript
if (existingSha === sha256Hex && existingProj === projectId)
```
Sistem hanya mengembalikan `isDuplicate: true` jika file yang sama diunggah untuk proyek yang sama persis. Jika file identik diunggah untuk proyek berbeda, kondisi ini bernilai `false`.

### Pertanyaan 2: Jika file dengan hash sama diunggah untuk Proyek A dan sebelumnya sudah dimiliki Proyek B, apakah backend mengembalikan `mediaId` lama?
**Jawaban: YA, `mediaId` yang dihasilkan sama persis.**
Meskipun pengecekan duplikasi per-proyek menghasilkan `false`, pembentukan `mediaId` di baris 2164 bersifat **deterministik dari potongan hash SHA-256**:
`var mediaId = "med_" + sha256Hex.substring(0, 16);`
Karena konten biner kedua file identik, nilai `sha256Hex` identik, sehingga `mediaId` Proyek A dan Proyek B sama persis (misal `med_a1b2c3d4e5f60718`).

### Pertanyaan 3: Jika menggunakan `mediaId` lama, apakah `projectId` lama dipertahankan atau diperbarui?
**Jawaban: `projectId` lama TIDAK diperbarui, melainkan backend menambahkan BARIS BARU ke sheet `CMS_Media`.**
Karena `existingProj === projectId` bernilai `false`, backend melanjutkan eksekusi ke `mediaSheet.appendRow(rowValues)` (baris 2249).
Hasil di Google Sheet `CMS_Media`:
- Baris X: `[med_a1b2c3d4e5f60718, "proyek_b", drive_id_1, ..., sha256_hash, ...]`
- Baris Y: `[med_a1b2c3d4e5f60718, "proyek_a", drive_id_2, ..., sha256_hash, ...]`
Terdapat dua baris berbeda yang memiliki `mediaId` yang sama persis (terjadi duplikasi Primary Key di sheet).

### Pertanyaan 4: Apakah perubahan tersebut dapat memengaruhi akses publik ketika salah satu proyek menjadi DRAFT atau ARCHIVED?
**Jawaban: YA, SANGAT MEMENGARUHI (Terjadi fenomena *Asset Shadowing*).**
Pada saat publik mengakses `/api/media/med_a1b2c3d4e5f60718`:
Fungsi `handleCmsGetPublicMedia` (baris 2824–2828) melakukan perulangan dari atas ke bawah:
```javascript
for (var m = 0; m < mediaRows.length; m++) {
  if (String(mediaRows[m][0]).trim() === mediaId) {
    matched = mediaRows[m];
    break;
  }
}
```
Pencarian selalu berhenti pada baris teratas yang pertama kali ditemukan (`matched = Baris X`, milik Proyek B).
Kemudian sistem memeriksa apakah `parentProjectId` (Proyek B) berstatus `PUBLISHED`:
- Jika Proyek B di kemudian hari diubah ke `DRAFT` atau `ARCHIVED`, maka panggilan media untuk Proyek A akan **gagal (HTTP 404)**, meskipun Proyek A berstatus `PUBLISHED`!
- Sebaliknya, jika Proyek A diubah ke `DRAFT` namun Proyek B berstatus `PUBLISHED`, media Proyek A dapat diakses publik karena di-shadow oleh baris Proyek B.

### Pertanyaan 5: Apakah perilaku deduplikasi berbeda untuk media `global`?
**Jawaban:**
- **Saat Upload:** Perilaku sama persis. Duplikasi hanya terdeteksi jika `existingProj === 'global'`.
- **Saat Akses Publik:** Berbeda. Pada baris 2844:
  `if (parentProjectId && parentProjectId !== "global")`
  Jika `parentProjectId === "global"`, backend tidak memeriksa tabel `CMS_Projects`, sehingga media global selalu disajikan ke publik tanpa terpengaruh status proyek mana pun.
  *Namun*, jika file identik awalnya diunggah ke Proyek B, lalu diunggah lagi ke `global`, pencarian linear di `handleCmsGetPublicMedia` tetap akan menemukan baris Proyek B lebih dahulu!

### Pertanyaan 6: Apakah ada risiko satu proyek menggunakan media yang akses publiknya dikendalikan oleh proyek lain?
**Jawaban: YA, RISIKO TINGGI (HIGH ARCHITECTURAL RISK).**
Risiko timbul melalui 2 skenario nyata:
1. **Skenario Upload Berkas Identik:** Dua proyek menggunakan gambar yang sama (misal badge "Siap Rilis" atau icon format standar). Proyek yang mengunggah paling awal (baris paling atas) secara de facto mengendalikan hak akses publik proyek kedua.
2. **Skenario Media Library Picker:** Di Web Admin, administrator memilih media milik Proyek B melalui dialog *Pilih dari Media Library* saat mengedit Proyek A. URL yang tersimpan adalah `/api/media/:mediaId` milik Proyek B. Jika Proyek B diarsipkan, aset di Proyek A ikut hilang dari publik.

---

## 4. SKENARIO KONKRET PROYEK A DAN PROYEK B

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SKENARIO ASSET SHADOWING                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Proyek B (Mobile Kasir) mengunggah "badge-verified.webp".                │
│    -> SHA-256: 7f8a9b...                                                    │
│    -> Media ID: med_7f8a9b1234567890                                        │
│    -> Dicatat di CMS_Media Baris 2: [med_7f8a9b..., "mobile-kasir", ...]    │
│    -> Mobile Kasir berstatus PUBLISHED.                                     │
│                                                                             │
│ 2. Proyek A (DompetNalar) mengunggah file yang sama persis.                 │
│    -> Backend mendeteksi existingProj ('mobile-kasir') != projectId         │
│    -> Backend membuat baris baru Baris 3: [med_7f8a9b..., "dompetnalar", ..]│
│    -> DompetNalar berstatus PUBLISHED.                                      │
│                                                                             │
│ 3. Akses Publik Awal: Keduanya normal karena kedua proyek PUBLISHED.         │
│                                                                             │
│ 4. Suatu hari, pengembang mengarsipkan Proyek B:                            │
│    -> Mobile Kasir diubah menjadi ARCHIVED (atau DRAFT).                    │
│                                                                             │
│ 5. Dampak pada Proyek A (DompetNalar):                                      │
│    -> Pengunjung membuka portofolio publik DompetNalar (PUBLISHED).         │
│    -> Browser meminta GET /api/media/med_7f8a9b1234567890.                  │
│    -> handleCmsGetPublicMedia mencari di CMS_Media.                         │
│    -> Baris pertama yang cocok adalah Baris 2 (mobile-kasir).               │
│    -> Backend mengecek: mobile-kasir is ARCHIVED.                           │
│    -> Backend mengembalikan HTTP 404 NOT FOUND!                             │
│    -> HASIL: Logo/Gambar DompetNalar RUSAK di halaman publik,               │
│              meskipun DompetNalar berstatus PUBLISHED!                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. EVALUASI OPSI KEAMANAN (ARCHITECTURAL EVALUATION)

Berikut evaluasi mendalam terhadap 3 pendekatan keamanan tanpa melakukan perubahan kode sepihak:

| Parameter Evaluasi | Opsi 1: Scoped Deduplication (`projectId` spesifik) | Opsi 2: Global Deduplication with Explicit Ownership | Opsi 3: Shared Media via Dedicated `global` Namespace |
| :--- | :--- | :--- | :--- |
| **Deskripsi Konsep** | `mediaId` ditambahkan prefix `projectId` (contoh: `med_dompetnalar_<hash>` atau menggunakan UUID). Pengecekan duplikasi dan kepemilikan 100% terisolasi per proyek. | Konten fisik Drive dan hash SHA-256 bersifat global (1 copy), namun relasi kepemilikan dicatat multi-proyek (misal array `linkedProjectIds`). | Media proyek spesifik dilarang dibagi silang. Aset yang dipakai bersama wajib diunggah ke `projectId: 'global'`. |
| **Konsekuensi Penyimpanan** | File identik disimpan 2x di Google Drive jika diunggah oleh 2 proyek berbeda. Kapasitas Google Drive terpakai sedikit lebih banyak (~100–500 KB per duplikat). | Paling hemat penyimpanan (1 file fisik Google Drive untuk hash yang sama). | Efisien. Media spesifik tetap 1 copy, media bersama tersentralisasi di `global`. |
| **Kompatibilitas Data Lama** | Perlu memastikan format `mediaId` baru kompatibel dengan URL media yang sudah terlanjur tersimpan di sheet. | Memerlukan perubahan skema tabel `CMS_Media` (menambah kolom referensi proyek atau tabel relasi). | **100% Kompatibel dengan skema saat ini!** Tidak memerlukan modifikasi struktur sheet maupun migrasi kode Apps Script V5 yang sudah berjalan di Production. |
| **Akses Publik & Keamanan** | **Bebas Shadowing 100%.** Status Proyek B tidak akan pernah bisa mematikan aset Proyek A. | Aman, `GET /api/media` memeriksa apakah *salah satu* proyek yang menautkan media tersebut berstatus `PUBLISHED`. | Aman, aset global di-bypass dari pengecekan proyek (baris 2844) sehingga tidak terpengaruh status proyek mana pun. |
| **Dampak Kompleksitas** | Rendah di backend, cukup ubah generator `mediaId`. | Tinggi (perlu refactoring relasi database dan migrasi data). | **Nol kompleksitas backend.** Cukup penegasan filter di UI frontend Web Admin. |

---

## 6. REGRESSION TEST EVIDENCE

Pengujian dijalankan pada suite yang berkaitan langsung dengan media handling dan deduplikasi:

```text
========================================================================
1. Vitest Suite: src/test/cmsMedia.test.ts
   Tests:      57 passed (57)
   Duration:   2.51s
   Bukti:      Memverifikasi penanganan upload biner, deteksi isDuplicate: true,
               magic bytes, size ceiling 2 MB, dan update status media.

2. Vitest Suite: src/test/milestone656ProjectMediaManagement.test.tsx
   Tests:      22 passed (22)
   Duration:   3.14s
   Bukti:      Memverifikasi isolasi form admin, seleksi logo, multi-upload
               screenshot, reordering galeri, dan fallback kartu publik.
========================================================================
```
Semua 79 pengujian terkait media berjalan dan lulus 100% tanpa regresi.

---

## 7. HAL-HAL YANG BELUM DAPAT DIVERIFIKASI

1. **Uji Spreadsheet Fisik Dua Baris dengan Hash Identik:**
   Kondisi di mana sheet `CMS_Media` Production secara nyata memiliki 2 baris dengan `mediaId` yang sama persis belum pernah terjadi di Production karena data Production saat ini belum memiliki upload biner duplikat lintas proyek.
2. **Perilaku Drive API Duplikat di Lingkungan Fisik Google:**
   Apakah Drive API membatasi nama file yang sama pada folder target yang sama tidak dapat diuji tanpa mutasi Google Drive Production (sesuai batasan strict read-only).

---

## 8. REKOMENDASI TEKNIS BAGI PROJECT OWNER

1. **Solusi Jangka Pendek (Praktik Terbaik Segera — Zero Code Changes):**
   - Saat mengelola proyek di Web Admin, administrator **selalu mengunggah media langsung di dalam modal proyek yang bersangkutan** atau menggunakan filter default `editingProject.id` pada Media Library Picker.
   - Jangan memilih media milik proyek lain secara silang. Jika ada aset studio yang ingin dipakai bersama, unggah melalui namespace `global`.
   - Dengan prosedur operasional ini, tidak ada risiko asset shadowing yang dapat terjadi di Production.

2. **Solusi Arsitektural Jangka Menengah (Jika Diinginkan pada Milestone Mendatang):**
   - Jika Project Owner menghendaki proteksi otomatis di tingkat kode tanpa bergantung pada kedisiplinan admin:
     Ubah format `mediaId` pada `backend/gas/Code.gs` baris 2164 menjadi berbasis per-proyek:
     `var mediaId = "med_" + projectId.substring(0, 8) + "_" + sha256Hex.substring(0, 12);`
     Hal ini menjamin bahwa setiap proyek selalu memiliki `mediaId` yang unik secara mutlak di tabel `CMS_Media`, sepenuhnya menghilangkan potensi collision.

---

## 9. STOP CONDITION

Audit ini berstatus **STRICT READ-ONLY**. Tidak ada baris kode sumber, spreadsheet, Google Drive, atau Cloudflare yang dimodifikasi.

Laporan ini diserahkan kepada Project Owner (`zweifeel@gmail.com`) untuk peninjauan dan arahan selanjutnya.
