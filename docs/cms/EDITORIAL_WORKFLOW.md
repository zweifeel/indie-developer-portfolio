# SLEEPYKOALA CMS — EDITORIAL WORKFLOW & STATE MACHINE SPECIFICATION

## 1. PENDAHULUAN

Dokumen ini mendefinisikan alur kerja editorial (editorial workflow) yang mengatur siklus hidup seluruh konten kemajuan proyek di SleepyKoala Studio, termasuk milestone roadmap, spesifikasi fitur terverifikasi, tangkapan layar (screenshots), dan timeline aktivitas.

---

## 2. FINITE STATE MACHINE (FSM) PUBLIKASI

Status publikasi dikendalikan oleh Finite State Machine yang ketat:

```
        +-----------------------------+
        |            DRAFT            | <------+
        +-----------------------------+        |
                       |                       |
            (Kirim ke Peninjauan)              |
                       v                       |
        +-----------------------------+        | (Tarik Kembali /
        |           REVIEW            |        |  Unpublish)
        +-----------------------------+        |
                       |                       |
        (Verifikasi Selesai & Disetujui)       |
                       v                       |
        +-----------------------------+        |
        |           PUBLIC            | -------+
        +-----------------------------+        |
                       |                       |
            (Sembunyikan Sementara)            |
                       v                       |
        +-----------------------------+        |
        |           HIDDEN            | -------+
        +-----------------------------+
```

### Tabel Transisi Status:

| Status Asal | Status Target | Diizinkan? | Persyaratan / Guard |
|---|---|:---:|---|
| `draft` | `review` | **YA** | Metadata dasar lengkap, tidak mengandung prohibited keys. |
| `draft` | `public` | **TIDAK** | Konten wajib melalui tahap peninjauan (`review`) terlebih dahulu. |
| `draft` | `hidden` | **TIDAK** | Konten draft belum pernah dipublikasikan. |
| `review` | `public` | **YA** | Disetujui oleh admin. Khusus screenshot: wajib `verifiedRealApp: true` dan `sanitized: true`. |
| `review` | `draft` | **YA** | Ditolak / dikembalikan untuk revisi. |
| `review` | `hidden` | **TIDAK** | Hanya konten yang sudah pernah publik yang dapat disembunyikan. |
| `public` | `hidden` | **YA** | Penarikan cepat dari tampilan publik tanpa menghapus status verifikasi. |
| `public` | `draft` | **YA** | Pembatalan publikasi total untuk revisi besar. |
| `hidden` | `public` | **YA** | Pemulihan kembali ke publik setelah isu terselesaikan. |
| `hidden` | `draft` | **YA** | Pengembalian ke draft untuk pengeditan ulang. |

---

## 3. ATURAN VERIFIKASI TANGKAPAN LAYAR (SCREENSHOTS)

Untuk mencegah kebocoran mockup mentah, aset AI tidak tersanitasi, atau informasi internal rahasia:
1. **Aturan Verifikasi Real App:** Tangkapan layar yang diajukan ke status `public` wajib memiliki flag boolean `verifiedRealApp: true`. Ini membuktikan gambar diambil dari build aplikasi/game yang sebenarnya, bukan concept art spekulatif.
2. **Aturan Sanitasi Privasi:** Tangkapan layar wajib memiliki flag `sanitized: true`. Ini membuktikan gambar telah diperiksa dan bersih dari nomor rekening riil, nomor telepon, kredensial, watermark proprietary, atau informasi pelanggan.
3. **Pemberlakuan Guard:** Fungsi `transitionItemPublicationStatus()` menolak transisi ke `public` dengan error `SCREENSHOT_NOT_VERIFIED` atau `SCREENSHOT_NOT_SANITIZED` jika salah satu syarat tidak terpenuhi.

---

## 4. KEANDALAN UNPUBLISH (PENARIKAN INSTAN)

1. Tindakan **Hide** atau **Unpublish** dapat dieksekusi seketika dari Web Admin (`AdminProgressManager.tsx`).
2. Begitu status diubah menjadi `hidden` atau `draft`, proyeksi publik pada `/api/projects/:slug/progress` langsung mengecualikan item tersebut pada pemanggilan berikutnya.
3. Respons publik menggunakan header HTTP `Cache-Control: no-cache, must-revalidate` (RFC 9111), sehingga browser dan proxy CDN tidak menyajikan versi lama yang telah ditarik.

---

## 5. PEMISAHAN STATUS IMPLEMENTASI VS STATUS PUBLIKASI

Sistem menegakkan pemisahan ortogonal antara:
- **`implementationStatus`** (`planned` | `in_progress` | `completed` | `blocked`): Mencerminkan status teknis kode di repository.
- **`publicationStatus`** (`draft` | `review` | `public` | `hidden`): Mencerminkan izin editorial untuk menampilkan informasi tersebut kepada publik.

Sebuah fitur yang telah selesai diimplementasikan secara teknis (`implementationStatus === 'completed'`) dapat tetap berstatus `draft` jika belum siap diumumkan untuk strategi pemasaran atau kerahasiaan rilis.
