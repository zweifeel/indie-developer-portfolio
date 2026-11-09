# SLEEPYKOALA CMS — GATE 2D ARCHITECTURE SUMMARY

**Checkpoint ID:** `gate-2d-test-20261101-v1`  
**Status:** COMPLETE & FROZEN  

---

## 1. Topologi Alur Data Dinamis

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser)"]
        AdminUI["/admin (Admin Dashboard)"]
        PublicUI["/, /projects, /projects/:slug (Public Portfolio)"]
    end

    subgraph EdgeLayer ["Cloudflare Pages Functions Edge"]
        AdminProxy["/api/admin/projects & /api/admin/media"]
        PublicProjProxy["/api/projects & /api/projects/:slug"]
        PublicMediaProxy["/api/media/:mediaId (Gate 2C Binary Proxy)"]
    end

    subgraph BackendLayer ["Google Apps Script TEST (Deployment V5)"]
        GAS["Code.gs (Signed M2M Handshake)"]
    end

    subgraph StorageLayer ["Google Workspace Storage (TEST)"]
        SheetDB["Google Sheets: CMS_Projects, CMS_Media, CMS_AuditLogs"]
        DriveStore["Google Drive: Folder SleepyKoala_CMS_Media_TEST"]
    end

    AdminUI -->|Session Cookie + CSRF| AdminProxy
    PublicUI -->|Standard HTTP GET| PublicProjProxy
    PublicUI -->|Image Tag / Assets| PublicMediaProxy

    AdminProxy -->|Signed M2M HMAC + Nonce| GAS
    PublicProjProxy -->|Signed M2M HMAC + Nonce| GAS
    PublicMediaProxy -->|Signed M2M HMAC + Nonce| GAS

    GAS -->|SpreadsheetApp Locks| SheetDB
    GAS -->|Advanced Drive Service v3| DriveStore
```

---

## 2. Prinsip Arsitektur Kunci

1. **Strict Relational Guarding:**
   - Halaman publik **HANYA** menerima proyek yang berstatus `PUBLISHED`.
   - Media **HANYA** disajikan publik jika media tersebut berstatus `PUBLISHED` **dan** proyek induknya berstatus `PUBLISHED`.
   - Jika salah satu kondisi gagal, respons langsung mengembalikan **HTTP 404 Not Found** dengan header `Cache-Control: no-store, no-cache, must-revalidate`.
2. **Dynamic Client Synchronization (`useProjects`):**
   - Komponen React frontend tidak lagi terikat statis pada build-time JSON.
   - Panggilan asynchronous `/api/projects` memuat proyek aktif secara reaktif.
   - Jika koneksi ke backend Apps Script terputus atau timeout, sistem secara transparan beralih ke fallback dataset `projects.json` tanpa membocorkan error atau menghentikan rendering portofolio.
3. **No Build Step Required for Content Updates:**
   - Penambahan proyek, perubahan deskripsi, pembaruan status perekrutan closed testing, atau penggantian aset media langsung tercermin pada permintaan berikutnya.
4. **Zero Cache Poisoning Policy (RFC 9111):**
   - Header untuk 200/304: `Cache-Control: no-cache, must-revalidate`.
   - Header untuk 404/Error: `Cache-Control: no-store, no-cache, must-revalidate`.
   - Header untuk Admin Preview: `Cache-Control: private, no-store, no-cache, must-revalidate`.
   - Tidak ada instruksi `s-maxage` pada edge publik yang dapat menyebabkan stale private content.
