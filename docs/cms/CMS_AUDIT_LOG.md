# SLEEPYKOALA CMS — AUDIT LOG & COMPLIANCE SPECIFICATION

## 1. PENDAHULUAN

Untuk memastikan akuntabilitas editorial, kepatuhan keamanan, dan jejak rekam perubahan yang transparan, seluruh tindakan mutasi pada CMS SleepyKoala Studio dicatat secara otomatis dalam sistem Audit Log.

---

## 2. STRUKTUR DATA AUDIT LOG

Setiap aktivitas editorial dicatat dengan skema berikut:

```typescript
interface ProgressAuditLogEntry {
  readonly id: string;           // Prefix 'audit_prog_' + timestamp + random suffix
  readonly timestamp: string;    // ISO 8601 UTC
  readonly actorEmail: string;   // Email administrator pelaksana
  readonly projectSlug: string;  // Slug proyek target
  readonly action:               // Jenis tindakan editorial
    | 'PROGRESS_INIT'
    | 'PROGRESS_UPDATE'
    | 'ITEM_TRANSITION'
    | 'ITEM_PUBLISH'
    | 'ITEM_UNPUBLISH'
    | 'ITEM_HIDE'
    | 'ITEM_REVISE';
  readonly itemType?: 'roadmap' | 'feature' | 'screenshot' | 'event';
  readonly itemId?: string;
  readonly previousStatus?: string;
  readonly newStatus?: string;
  readonly result: 'SUCCESS' | 'REJECTED' | 'FAILED';
  readonly details: Record<string, unknown>; // Data kontekstual tersanitasi
}
```

---

## 3. SANITASI OTOMATIS DETAIL AUDIT (SECRET SCRUBBING)

Sebelum log disimpan, fungsi `recordProgressAuditLog()` secara rekursif memindai objek `details` menggunakan sanitasi mendalam:

1. **Pendeteksian Kunci Sensitif:**
   Kunci yang mengandung pola berikut disanitasi menjadi `[REDACTED]`:
   - `token`, `auth`, `secret`, `key`, `password`, `credential`, `private`, `bearer`
2. **Pendeteksian Nilai Rahasia:**
   Nilai string yang cocok dengan pola token atau kunci API disanitasi:
   - `AIzaSy...` (Google API Key)
   - `ghp_...` / `gho_...` (GitHub Personal Access Token)
   - `sk_live_...` (Stripe / Service Key)
3. **Hasil Sanitasi:**
   Jejak audit bersih dari kredensial, aman dari kebocoran data saat log diinspeksi oleh sesama tim pengembang atau administrator.

---

## 4. PENYIMPANAN & RETENSI AUDIT LOG

1. **Primary Persistence:** Tabel spreadsheet `CMS_Audit` via Google Apps Script upstream.
2. **Runtime Cache:** Penyimpanan memori dan browser storage untuk peninjauan cepat di Web Admin.
3. **Filtering:** Kemampuan filter berdasarkan `projectSlug` dan rentang tanggal untuk memudahkan audit trail spesifik proyek.

---

## 5. INSPEKTOR AUDIT LOG PADA WEB ADMIN

Komponen `AdminProgressManager.tsx` menyertakan panel inspeksi riwayat audit interaktif:
- Menampilkan daftar entri audit terurut secara kronologis terbalik (terbaru di atas).
- Menampilkan badge aksi (misal: `ITEM_PUBLISH`, `ITEM_UNPUBLISH`).
- Menampilkan rincian aktor pelaksana, waktu tindakan, dan ringkasan perubahan status (`draft -> review -> public`).
