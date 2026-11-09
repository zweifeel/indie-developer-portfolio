# SLEEPYKOALA CMS — LAPORAN PEMERIKSAAN & REMEDIASI KEBIJAKAN CACHE PUBLIK GATE 2B LIVE

**Tanggal Audit:** 2026-11-01  
**Status Target:** Apps Script TEST (`SleepyKoala_Test_Database`)  
**Lingkungan:** TEST ONLY (Deployment V4)  
**Status Audit:** **PASS — INSTANT REVOCATION FULLY ENFORCED**

---

## 1. Latar Belakang & Identifikasi Masalah

Pada peninjauan awal konfigurasi endpoint publik media (`/api/media/:mediaId`), header respons yang diterapkan adalah:
```http
Cache-Control: public, max-age=0, must-revalidate, s-maxage=86400
ETag: "{sha256}"
```

### Analisis Kerapuhan `s-maxage=86400`
Berdasarkan spesifikasi **RFC 9111 (HTTP Caching)**:
1. Direktif `s-maxage` secara khusus mengesampingkan `max-age` dan menginstruksikan **shared cache** (seperti edge cache Cloudflare CDN atau corporate proxy) untuk menganggap representasi respons berstatus valid dan segar (*fresh*) selama durasi yang ditentukan (86.400 detik = 24 jam).
2. Akibatnya, jika administrator CMS mengarsipkan (*archive*) sebuah gambar atau membatalkan publikasi (*unpublish*) proyek terkait, shared cache/CDN Cloudflare akan tetap melayani respons `200 OK` berisi gambar tersebut kepada pengunjung publik selama hingga 24 jam tanpa melakukan subrequest revalidasi ke origin Pages Function.
3. Hal ini melanggar prinsip **pencabutan akses seketika (*instant access revocation*)** dan menimbulkan risiko kebocoran aset rahasia/ditarik.

---

## 2. Pemeriksaan Perilaku Cache Aktual Sepanjang Jalur Distribusi

| Titik Evaluasi | Konfigurasi Lama | Konfigurasi Baru (Hasil Remediasi) | Analisis & Perilaku Aktual |
|---|---|---|---|
| **Endpoint Publik** (`functions/api/media/[mediaId].ts`) | `public, max-age=0, must-revalidate, s-maxage=86400` | `no-cache, must-revalidate`<br>`Vary: Accept-Encoding, If-None-Match` | `s-maxage` dihapus total. Direktif `no-cache` mewajibkan validasi ke origin sebelum menyajikan salinan cache. |
| **Cloudflare Pages / CDN Edge** | Menyimpan respons `200 OK` selama 24 jam karena `s-maxage=86400` | Meneruskan permintaan ke origin Pages Function untuk revalidasi atau menyajikan 304 jika ETag cocok | Tidak ada penyimpanan statis tanpa revalidasi. Edge Cloudflare terikat pada origin check. |
| **Browser Cache** | Wajib revalidasi (`max-age=0, must-revalidate`) | Wajib revalidasi (`no-cache, must-revalidate`) | Browser menyimpan cache lokal bersama ETag, tetapi **selalu** mengirimkan `If-None-Match` ke origin sebelum menampilkan. |
| **Respons 200 OK** | Disertai `s-maxage` (risiko stale di CDN) | `no-cache, must-revalidate` + `ETag` + `Vary` | Media aktif disajikan dengan jaminan kontrol penuh di origin. |
| **Respons 304 Not Modified** | Header cache sebelumnya ambigu | `no-cache, must-revalidate` + `ETag` + `Vary` | Bandwidth hemat (0-byte payload), verifikasi cepat status PUBLISHED. |
| **Respons 404 Not Found** | `no-cache, no-store, must-revalidate` | `no-cache, no-store, must-revalidate` | Saat media ditarik/diarsipkan, respons 404 dipaksa tidak disimpan di cache mana pun. |

---

## 3. Bukti Pengujian Empiris & Regression Test

Pengujian empiris dilakukan pada test suite:
- `src/test/cmsOperationalVerification.test.ts` (Bagian Koreksi 4)
- `src/test/cmsMedia.test.ts` (Skenario 7 & 12)

### Skenario Uji 4.4 (Regression Test: Pencabutan Seketika dari Cache 200):
1. **Siklus 1 (Status PUBLISHED):**
   - Klien melakukan permintaan GET pertama ke `/api/media/med_aabbccddeeff0011`.
   - Respons: `HTTP 200 OK`, `ETag: "e3b0c44..."`, `Cache-Control: no-cache, must-revalidate`.
   - Terbukti: Header `s-maxage` **TIDAK ADA**.
2. **Siklus 2 (Aksi Admin):**
   - Admin mengubah status media menjadi `ARCHIVED` (atau unpublish proyek terkait).
3. **Siklus 3 (Unconditional GET):**
   - Klien mengirim GET biasa ke URL yang sama.
   - Respons: `HTTP 404 NOT_FOUND`, `Cache-Control: no-cache, no-store, must-revalidate`.
4. **Siklus 4 (Conditional GET dengan ETag lama):**
   - Klien mengirim GET dengan header `If-None-Match: "e3b0c44..."` (revalidasi cache yang dipegang sebelumnya).
   - Respons: `HTTP 404 NOT_FOUND` (BUKAN 200 dan BUKAN 304).
   - Header: `Cache-Control: no-cache, no-store, must-revalidate`.
   - **Kesimpulan Empiris:** Klien dan perantara tidak dapat lagi mengakses aset yang telah diarsipkan. Kebocoran stale cache terbukti nihil (0%).

---

## 4. Hasil Verifikasi Tooling & Otomatisasi

Semua tahapan pengujian dan build lulus 100%:
1. **Vitest Test Suite:**
   ```text
   Test Files  12 passed (12)
        Tests  245 passed (245)
     Duration  6.84s
   ```
2. **TypeScript Compilation:**
   ```bash
   npx tsc -b
   # Exit code 0, no diagnostic errors
   ```
3. **Linter:**
   ```bash
   npm run lint
   # 0 errors, 3 warnings (non-blocking)
   ```
4. **Production Build:**
   ```bash
   npm run build
   # Built in 1.24s (dist/ produced successfully)
   ```

---

## 5. Ringkasan Perubahan Berkas

1. `functions/api/media/[mediaId].ts`:
   - Menghapus seluruh instansi `s-maxage=86400`.
   - Menetapkan `Cache-Control: no-cache, must-revalidate` untuk 200 dan 304.
   - Menambahkan header `Vary: Accept-Encoding, If-None-Match`.
   - Mempertahankan `Cache-Control: no-cache, no-store, must-revalidate` untuk 404.
2. `src/test/cmsMedia.test.ts`:
   - Menyesuaikan ekspektasi pengujian Skenario 7 dan Skenario 12 dengan kebijakan cache baru (`no-cache, must-revalidate`, negasi `s-maxage`).
3. `src/test/cmsOperationalVerification.test.ts`:
   - Memperbarui pengujian 4.1, 4.2, dan 4.3 untuk validasi `no-cache, must-revalidate` dan verifikasi ketiadaan `s-maxage`.
   - Menambahkan pengujian regresi 4.4 (simulasi siklus cache 200 -> ARCHIVED -> 404 revalidasi seketika).

---

## 6. Pernyataan Batasan Mutlak

- Proyek Apps Script produksi (`1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`) dan spreadsheet produksi **TIDAK PERNAH DISENTUH**.
- Tab `TesterRegistrations` **TIDAK PERNAH DIUBAH/DIBACA**.
- Google Play Hybrid Sync tetap dalam status **PAUSED**.
- Tidak ada email OTP yang dikirimkan.
- Tidak ada biaya, billing, upgrade, atau langganan berbayar (tetap Rp0).
