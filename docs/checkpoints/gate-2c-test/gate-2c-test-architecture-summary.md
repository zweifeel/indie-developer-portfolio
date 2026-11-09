# SLEEPYKOALA CMS — GATE 2C TEST ARCHITECTURE SUMMARY

**Checkpoint ID:** `gate-2c-test-20261101-v5`  
**Status:** COMPLETE & FROZEN  

---

## 1. Arsitektur Media Proxy End-to-End

```mermaid
flowchart TD
    subgraph PublicVisitor["Pengunjung Publik"]
        Browser["Web Browser (Visitor)"]
    end

    subgraph CloudflarePages["Cloudflare Pages Functions (Edge)"]
        PublicProxy["/api/media/:mediaId"]
        AdminProxy["/api/admin/media/:mediaId"]
        IntegrityEngine["SHA-256 & Magic Bytes Validator"]
        Base64Decoder["V8 Native Base64 Decoder (atob)"]
    end

    subgraph GoogleAppsScript["Google Apps Script TEST (M2M)"]
        M2MVerifier["M2M Auth & Anti-Replay Guard"]
        RelationalChecker["Relational Publisher Checker<br>(CMS_Media + CMS_Projects)"]
        ConditionalEngine["ETag Short-Circuiting Engine"]
        DriveService["Advanced Drive Service v3"]
    end

    subgraph GoogleStorage["Google Cloud Storage (TEST)"]
        DriveFolder["Google Drive Test Folder<br>(SleepyKoala_CMS_Media_TEST)"]
        SheetsDB["Google Sheets Test Database"]
    end

    Browser -->|GET /api/media/:mediaId<br>If-None-Match: etag?| PublicProxy
    PublicProxy -->|M2M Signed POST<br>action: CMS_GET_PUBLIC_MEDIA| M2MVerifier
    M2MVerifier --> RelationalChecker
    RelationalChecker --> SheetsDB

    RelationalChecker -->|ETag Cocok| ConditionalEngine
    ConditionalEngine -->|notModified: true| PublicProxy
    PublicProxy -->|304 Not Modified (0 byte)| Browser

    RelationalChecker -->|ETag Beda / Cold Fetch| DriveService
    DriveService -->|Drive.Files.get (alt=media)| DriveFolder
    DriveService -->|Base64 JSON Response| PublicProxy
    PublicProxy --> Base64Decoder
    Base64Decoder --> IntegrityEngine
    IntegrityEngine -->|200 OK (Uint8Array Binary)| Browser
```

---

## 2. Prinsip & Karakteristik Kunci

1. **Buffered Transfer (Non-Streaming):**
   Apps Script membaca berkas Drive ke heap (`Blob`), mengonversi ke Base64 dalam JSON. Cloudflare Pages Function mendecode Base64 ke `Uint8Array` dan menyajikannya ke browser. Batas ukuran berkas dipatok maksimal 2.0 MB biner (~2.67 MB Base64).
2. **Single-Hop Conditional Short-Circuiting:**
   Pemeriksaan `If-None-Match` dievaluasi di level Apps Script sebelum membaca Drive. Jika ETag cocok, respons 304 Not Modified dikembalikan seketika tanpa konsumsi kuota Google Drive API.
3. **Pencabutan Akses Seketika (Instant Revocation):**
   Jika media diarsipkan atau proyek ditarik publikasinya, permintaan berulang (unconditional maupun conditional) seketika menghasilkan HTTP 404 Not Found (`no-store, no-cache, must-revalidate`). Tidak ada *stale cache* yang disajikan.
4. **Isolasi Mutlak:**
   Tidak ada URL atau ID file Google Drive internal yang dibocorkan kepada publik. Seluruh akses eksternal hanya menggunakan `mediaId` (`med_[a-f0-9]{16}`).
