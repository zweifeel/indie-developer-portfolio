# SLEEPYKOALA CMS — PREVIEW & PUBLISHING SPECIFICATION

## 1. PENDAHULUAN

Sistem pratinjau (preview mode) memungkinkan administrator dan reviewer internal SleepyKoala Studio memeriksa tampilan halaman detail proyek lengkap dengan konten berstatus `draft` dan `review` sebelum disetujui untuk konsumsi publik.

---

## 2. MEKANISME PROTEKSI AKSES PRATINJAU

Pratinjau editorial hanya dapat diakses melalui dua jalur terlindungi:
1. **Frontend Route:** `GET /projects/:slug?preview=true`
2. **Server-Side API Route:** `GET /api/admin/progress/:slug/preview`

### Verifikasi Sesi Administrator:
- Endpoint `/api/admin/progress/:slug/preview` memeriksa cookie sesi terenkripsi (`SESSION_COOKIE_NAME`).
- Token sesi diverifikasi menggunakan HMAC-SHA256 (`verifySessionToken`).
- Jika sesi tidak valid, kedaluwarsa, atau tidak memiliki cookie admin, server mengembalikan status **HTTP 401 Unauthorized**.
- Tidak ada data draft yang dibocorkan kepada pengguna yang tidak terotentikasi.

---

## 3. PERLINDUNGAN MESIN PENCARI (SEO SAFETY)

Untuk mencegah mesin pencari (Google, Bing, DuckDuckGo) mengindeks konten pratinjau atau membocorkan materi rilis yang belum final:

1. **Injeksi Meta Tag HTML:**
   Hook `usePageMeta` secara dinamis menambahkan tag berikut ke `<head>` dokumen saat `preview=true`:
   ```html
   <meta name="robots" content="noindex, nofollow" />
   ```
2. **Header HTTP X-Robots-Tag:**
   Endpoint preview mengirimkan header HTTP wajib:
   ```http
   X-Robots-Tag: noindex, nofollow
   ```
3. **Anti-Caching Header:**
   ```http
   Cache-Control: no-store, no-cache, must-revalidate, max-age=0
   Pragma: no-cache
   ```

---

## 4. INDIKATOR VISUAL PRATINJAU (PREVIEW BANNER)

Saat halaman detail dibuka dalam mode preview, komponen `ProjectDetailPage.tsx` menampilkan banner mencolok di bagian atas halaman:

```
+-------------------------------------------------------------------------+
| [PREVIEW MODE]  Pratinjau Editorial Terlindungi                         |
| Anda sedang melihat konten Draft & Review. Halaman ini tidak terindeks  |
| oleh mesin pencari.                                [ NOINDEX ] [ DRAFT ]|
+-------------------------------------------------------------------------+
```

Item yang berstatus `draft` dan `review` juga dilengkapi dengan badge penanda status individual sehingga reviewer dapat dengan mudah membedakan item yang sudah publik vs item yang masih dalam peninjauan.

---

## 5. PERBANDINGAN PROYEKSI PUBLIK VS PRATINJAU

| Kriteria | Proyeksi Publik (`extractPublicProgress`) | Proyeksi Pratinjau (`fetchAdminProgressPreview`) |
|---|---|---|
| Item `draft` | **Dikeluarkan sepenuhnya** | Ditampilkan dengan label Draft |
| Item `review` | **Dikeluarkan sepenuhnya** | Ditampilkan dengan label Review |
| Item `public` | Ditampilkan normal | Ditampilkan normal |
| Item `hidden` | **Dikeluarkan sepenuhnya** | **Dikeluarkan sepenuhnya** |
| Field Rahasia (secrets, passwords) | Dihapus permanen | Dihapus permanen |
| Path Lokal & Branch Internal | Dihapus permanen | Dihapus permanen |
| Header `X-Robots-Tag` | Standar (Indexable) | `noindex, nofollow` |
| Autentikasi | Terbuka (Public) | Wajib Admin Session (HMAC) |
