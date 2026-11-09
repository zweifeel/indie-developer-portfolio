# SLEEPYKOALA CMS — ACCESS CONTROL & AUTHENTICATION SPECIFICATION

## 1. PENDAHULUAN

Dokumen ini mendefinisikan mekanisme kendali akses, otentikasi, otorisasi, dan mitigasi serangan untuk antarmuka manajemen kemajuan CMS SleepyKoala Studio.

---

## 2. MEKANISME OTENTIKASI ADMINISTRATOR

Akses ke fungsi editorial administratif diatur oleh sistem sesi berbasis HMAC-SHA256:

1. **Session Cookie:**
   - Nama cookie: `sleepykoala_admin_session` (didefinisikan dalam `SESSION_COOKIE_NAME`).
   - Atribut cookie: `HttpOnly; Secure; SameSite=Strict; Path=/`.
2. **Payload Token Sesi:**
   - `email`: Alamat email administrator yang terverifikasi.
   - `sessionVersion`: Nomor versi sesi (mendukung pencabutan massal/invalidation).
   - `iat`: Timestamp penerbitan (Issued At).
   - `exp`: Timestamp kedaluwarsa (Expiration), maksimal 12 jam.
3. **Verifikasi Kriptografis:**
   - Divalidasi melalui `verifySessionToken(token, secret)` menggunakan Web Crypto API (HMAC-SHA256).
   - Menolak token yang telah kedaluwarsa atau memiliki signature yang dimodifikasi.

---

## 3. PROTEKSI CROSS-SITE REQUEST FORGERY (CSRF)

Seluruh operasi mutasi data (`POST`, `PUT`, `DELETE`) pada endpoint `/api/admin/progress/:slug`:
1. **Wajib menyertakan Header CSRF:** `X-Admin-CSRF-Token` atau field payload `_csrf`.
2. Token CSRF divalidasi oleh fungsi `validateAdminCsrf(request, sessionPayload)`.
3. Permintaan mutasi yang tidak menyertakan CSRF token yang cocok secara otomatis ditolak dengan status **HTTP 403 Forbidden** (`CSRF_VERIFICATION_FAILED`).

---

## 4. PEMBATASAN UKURAN PAYLOAD & INPUT VALIDATION

1. **Batas Ukuran Payload:**
   - Dibatasi secara ketat maksimal 1 MB (`MAX_PAYLOAD_SIZE = 1048576` bytes).
   - Permintaan yang melebihi batas ditolak dengan **HTTP 413 Payload Too Large**.
2. **Validasi Slug Proyek:**
   - Format slug wajib mematuhi regex `^[a-z0-9-_]+$`.
   - Slug wajib terdaftar dalam daftar kanonikal (`isCanonicalProjectSlug`).
   - Permintaan dengan slug alien ditolak dengan **HTTP 400 Bad Request** (`INVALID_PROJECT_SLUG`).

---

## 5. REPOSITORY FREEZE ENFORCEMENT

Khusus untuk repositori **The Broken Origin (TBO ROBLOX)**:
- Berstatus `STRICT_FREEZE` / `REPOSITORY_FROZEN`.
- Seluruh mutasi progres ditolak di tingkat service layer dan API handler:
  ```json
  {
    "success": false,
    "error": "REPOSITORY_FROZEN",
    "message": "Repositori The Broken Origin (TBO) dibekukan secara permanen. Modifikasi progres dilarang."
  }
  ```
- Ini menjamin isolasi mutlak proyek TBO dari perubahan tidak sengaja.
