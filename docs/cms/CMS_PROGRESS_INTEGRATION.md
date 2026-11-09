# SLEEPYKOALA CMS — PROGRESS METADATA INTEGRATION ARCHITECTURE

## 1. PENDAHULUAN & TUJUAN ARSITEKTUR

Dokumen ini mendefinisikan arsitektur integrasi antara sistem manajemen konten (CMS) SleepyKoala Studio dengan standar metadata kanonikal kemajuan proyek (Stage 2) dan event sinkronisasi GitHub terverifikasi (Stage 4).

Tujuan arsitektur:
1. Menyediakan repositori sentral metadata kemajuan untuk seluruh 6 proyek kanonikal SleepyKoala.
2. Memastikan pembaruan metadata bersifat non-destruktif (atomic partial updates tanpa menghapus array yang tidak dimodifikasi).
3. Mengisolasi status implementasi teknis (*implementation status*) dari status publikasi editorial (*publication status*).
4. Mengintegrasikan audit log editorial secara otomatis dan tersanitasi.
5. Mematuhi kebijakan zero-cost ($0.00 / Rp 0) menggunakan stack Cloudflare Pages Functions dan Google Sheets via Google Apps Script (GAS).

---

## 2. DIAGRAM ARSITEKTUR INTEGRASI

```
+-------------------------------------------------------------------------+
|                           SLEEPYKOALA CMS                               |
+-------------------------------------------------------------------------+
|                                                                         |
|  [ Web Admin UI ]                     [ Public / Preview Client ]       |
|  AdminProgressManager                 ProjectDetailPage                 |
|         |                                      |                        |
|  (Auth HMAC Cookie + CSRF)                     | (Public Whitelist GET) |
|         v                                      v                        |
|  [ Cloudflare Pages Functions ]        [ Public API Route ]             |
|  /api/admin/progress/:slug             /api/projects/:slug/progress     |
|  /api/admin/progress/:slug/preview             |                        |
|         |                                      |                        |
|         +-------------------+------------------+                        |
|                             |                                           |
|                             v                                           |
|                 [ Service Layer & Validation ]                          |
|                 src/services/cmsProgressService.ts                      |
|                 src/services/portfolioMetadataValidator.ts             |
|                             |                                           |
|                             v (M2M HMAC Token)                          |
|                 [ Google Apps Script Upstream ]                         |
|                 backend/gas/Code.gs -> CMS_Progress Sheet               |
|                                                                         |
|  [ GitHub Webhook ]                                                     |
|  functions/api/webhook/github.ts -> Stage 4 Push Event                  |
|         |                                                               |
|         +---> Appends to doc.events[] (Draft status, non-publishing)    |
+-------------------------------------------------------------------------+
```

---

## 3. MODEL DATA & SCHEMA KANONIKAL v2

Setiap dokumen kemajuan proyek mengimplementasikan kontrak `ProjectProgressDocument` v2:

```typescript
interface ProjectProgressDocument {
  readonly schemaVersion: 2;
  readonly projectSlug: string;
  readonly projectName: string;
  readonly projectType?: 'GAME' | 'APPLICATION' | 'TOOL' | 'OTHER';
  readonly roadmap: readonly RoadmapMilestone[];
  readonly features: readonly FeatureItem[];
  readonly screenshots: readonly ProgressScreenshot[];
  readonly events?: readonly ProgressEvent[];
  readonly lastSyncedCommit?: string;
  readonly lastSyncTimestamp?: string;
  readonly updatedAt: string;
}
```

### Karakteristik Model:
- **Immutabilitas Slug:** `projectSlug` divalidasi ketat terhadap allowlist kanonikal (`CANONICAL_PROJECT_SLUGS`). Slug alien ditolak dengan kode `INVALID_PROJECT_SLUG`.
- **Schema Migration Otomatis:** Dokumen legacy v1 secara otomatis dimigrasikan ke v2 saat dibaca melalui `migrateLegacyProgressDocument()`.
- **Fail-Closed Projection:** Hanya entitas dengan `publicationStatus === 'public'` yang dapat diproyeksikan ke publik melalui `extractPublicProgress()`.

---

## 4. INTEGRASI GITHUB SYNC (STAGE 4 TO STAGE 5)

Sesuai aturan keamanan:
1. Event push dari webhook GitHub Stage 4 disimpan ke dalam array `events[]` pada dokumen proyek.
2. **Event GitHub bersifat informasional dan otomatis berstatus DRAFT.**
3. GitHub push **TIDAK PERNAH** secara otomatis mempublikasikan fitur, milestone, atau tangkapan layar.
4. GitHub push **TIDAK PERNAH** mengubah `implementationStatus` milestone menjadi `completed` tanpa tinjauan manusia.

---

## 5. PENYIMPANAN BACKEND (GOOGLE APPS SCRIPT)

Sheet target: `CMS_Progress`
Struktur baris pada spreadsheet:
- `project_slug` (Key primer, lowercase string)
- `schema_version` (Integer, nilai 2)
- `payload_json` (Stringified `ProjectProgressDocument`)
- `updated_at` (ISO 8601 UTC timestamp)
- `updated_by` (Email administrator pelaksana)

Tindakan GAS yang didukung:
- `CMS_GET_PROJECT_PROGRESS`: Mengambil dokumen proyek tunggal.
- `ADMIN_SAVE_PROJECT_PROGRESS`: Menyimpan atau memperbarui dokumen proyek secara atomik.
- `ADMIN_SET_PROGRESS_STATUS`: Memperbarui status publikasi item tertentu.

---

## 6. KEPATUHAN ZERO-COST & KEAMANAN

1. Penyimpanan sepenuhnya menggunakan Google Drive/Sheets gratis via akun Google Studio yang ada.
2. Komputasi serverless berjalan di Cloudflare Pages Functions tier gratis (100.000 requests/hari).
3. Zero third-party paid database / Zero VPS / Zero external SaaS subscription.
