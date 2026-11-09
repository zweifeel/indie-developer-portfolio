# SLEEPYKOALA STUDIO — DOKUMENTASI SKEMA METADATA RESMI (STAGE 2)
## PORTFOLIO PROGRESS & ROADMAP CANONICAL SPECIFICATION

**Canonical Schema Version:** `2`  
**Supported Versions:** `1`, `2`  
**Baseline Standard:** `roadmap_sleepykoala_updated.md` (Stage 2)  
**Status:** Canonical Single Source of Truth  
**Target:** Standardisasi kontrak progres pengembangan, roadmap, fitur, screenshot terverifikasi, dan changelog publik tanpa membocorkan data infrastruktur, secret, maupun data pribadi.

---

## 1. PRINSIP UTAMA ARSITEKTUR

1. **Single Source of Truth:** Seluruh lapisan (Frontend React/TS, Web Admin, Project Detail, Portfolio Dashboard, dan Cloudflare Pages Functions) merujuk pada satu definisi kontrak yang seragam.
2. **Pemisahan Status Mutlak (Strict Status Separation):** Status rekayasa perangkat lunak (`implementationStatus`) terpisah 100% dari visibilitas publik (`publicationStatus`). Penyelesaian implementasi (`completed`) **tidak pernah otomatis mempublikasikan item**.
3. **Universal Project Support:** Mendukung aplikasi (`APPLICATION`), permainan (`GAME`), situs web (`WEBSITE`), perkakas/software (`TOOL`), maupun kategori lain (`OTHER`).
4. **Fail-Closed Whitelist Projection:** Tampilan publik (`extractPublicProgress()`) hanya menyajikan field yang masuk daftar putih (whitelist). Field sensitif, metadata internal, serta item berstatus `draft`, `review`, dan `hidden` dipangkas secara permanen sebelum respons dikirim ke publik.
5. **Zero-Cost & Non-Destructive Compatibility:** Mendukung schema v1 secara deterministik tanpa mutasi input dan tanpa penghapusan field tak dikenal secara diam-diam.

---

## 2. SPESIFIKASI STATUS & ENUM

### 2.1 Implementation Status (`implementationStatus`)
Menggambarkan siklus hidup pengembangan teknis:
- `not_started`: Pekerjaan belum dimulai dan masih dalam backlog awal.
- `planned`: Pekerjaan telah dijadwalkan dalam target milestone tertentu.
- `in_progress`: Pekerjaan sedang aktif dikembangkan atau diuji di lingkungan lokal.
- `completed`: Pekerjaan telah selesai diimplementasikan dan diverifikasi lulus uji.
- `blocked`: Pekerjaan terhambat oleh dependensi eksternal atau kendala teknis (pemetaan resmi dari legacy `on_hold`).
- `cancelled`: Pekerjaan dibatalkan dari ruang lingkup pengembangan.

### 2.2 Publication Status (`publicationStatus`)
Menggambarkan status editorial dan visibilitas pada situs portofolio publik:
- `draft` (**Default Mandatori**): Item baru otomatis berstatus draft. Hanya dapat dilihat secara internal/admin.
- `review`: Item diajukan untuk verifikasi editorial, kelayakan konten, dan kepatuhan privasi sebelum rilis publik.
- `public`: Item telah disetujui secara sadar dan ditampilkan pada halaman publik portofolio.
- `hidden`: Item ditarik atau disembunyikan dari publik. Segera dibersihkan dari seluruh output proyeksi publik.

### 2.3 Aturan Transisi Status
- **Transisi Implementasi:**
  - `not_started` ➔ `planned`, `cancelled`
  - `planned` ➔ `in_progress`, `blocked`, `cancelled`
  - `in_progress` ➔ `completed`, `blocked`, `cancelled`, `planned`
  - `blocked` ➔ `in_progress`, `planned`, `cancelled`
  - `completed` ➔ `in_progress` (rework/regresi), `cancelled`
  - `cancelled` ➔ `planned`, `not_started` (reaktivasi)
- **Transisi Publikasi:**
  - `draft` ➔ `review`, `hidden` (Item draft **tidak boleh** langsung melompat ke `public` tanpa melalui `review`).
  - `review` ➔ `public`, `draft`, `hidden`
  - `public` ➔ `hidden`, `draft` (pencabutan/revisi)
  - `hidden` ➔ `draft`, `review`

---

## 3. SPESIFIKASI KONTRAK KANONIKAL (v2)

### 3.1 Struktur Dokumen Progres (`ProjectProgressDocument`)
```typescript
interface ProjectProgressDocument {
  schemaVersion: 2;                       // Canonical version
  projectSlug: string;                    // Alphanumeric + hyphens, e.g. "dompetnalar"
  projectName: string;                    // e.g. "DompetNalar"
  projectType?: 'APPLICATION' | 'GAME' | 'WEBSITE' | 'TOOL' | 'OTHER';
  shortDescription?: string;             // Ringkasan 1-2 kalimat
  publicDescription?: string;            // Deskripsi lengkap publik
  version?: string;                       // e.g. "1.2.0"
  roadmap: RoadmapMilestone[];            // Daftar milestone terurut
  features: FeatureItem[];                // Daftar spesifikasi fitur
  screenshots: ProgressScreenshot[];      // Cuplikan layar aplikasi riil
  events?: ProgressEvent[];               // Riwayat progres / changelog
  updatedAt: string;                      // ISO 8601
  createdAt?: string;                     // ISO 8601
  metadataExtras?: Record<string, unknown>; // Preservasi field kustom/legacy
}
```

### 3.2 Roadmap Milestone (`RoadmapMilestone`)
```typescript
interface RoadmapMilestone {
  id: string;                             // Stable ID, e.g. "ms_dn_core" (regex: ^[a-zA-Z0-9_-]{3,64}$)
  title: string;                          // Judul milestone
  description: string;                    // Deskripsi capaian
  priority?: 'low' | 'medium' | 'high' | 'critical';
  implementationStatus: ImplementationStatus;
  publicationStatus: PublicationStatus;   // Default: 'draft'
  targetQuarter?: string;                 // e.g. "Q4 2025"
  targetDate?: string;                    // ISO 8601 YYYY-MM-DD
  completedAt?: string;                   // ISO 8601
  order: number;                          // Urutan tampilan
  updatedAt: string;                      // ISO 8601
  createdAt?: string;                     // ISO 8601
}
```

### 3.3 Feature Item (`FeatureItem`)
```typescript
interface FeatureItem {
  id: string;                             // Stable ID, e.g. "feat_dn_01"
  milestoneId?: string;                   // Relasi ke RoadmapMilestone.id yang valid
  title: string;                          // Nama fitur
  description: string;                    // Keterangan fungsional
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;                      // e.g. "Core Finance", "Security"
  implementationStatus: ImplementationStatus;
  publicationStatus: PublicationStatus;   // Default: 'draft'
  releaseVersion?: string;                // e.g. "1.0.0"
  screenshotIds?: string[];               // Relasi ke ProgressScreenshot.id
  order: number;                          // Urutan tampilan
  completedAt?: string;                   // ISO 8601
  updatedAt: string;                      // ISO 8601
  createdAt?: string;                     // ISO 8601
}
```

### 3.4 Progress Screenshot (`ProgressScreenshot`)
```typescript
interface ProgressScreenshot {
  id: string;                             // Stable ID, e.g. "shot_dn_home"
  featureId?: string;                     // Relasi ke FeatureItem.id yang valid
  caption: string;                        // Keterangan gambar
  path: string;                           // Path lokal terverifikasi
  publicationStatus: PublicationStatus;   // Default: 'draft'
  verifiedRealApp: boolean;               // Mandatori true untuk publikasi
  sanitized: boolean;                     // Mandatori true untuk publikasi (bebas PII)
  updatedAt: string;                      // ISO 8601
  createdAt?: string;                     // ISO 8601
}
```

### 3.5 Progress Event / Changelog (`ProgressEvent`)
```typescript
interface ProgressEvent {
  id: string;                             // Stable ID, e.g. "evt_20261108_release"
  eventType: 'milestone_reached' | 'feature_released' | 'status_changed' | 'general_update' | 'security_fix';
  title: string;                          // Ringkasan peristiwa
  description: string;                    // Penjelasan perubahan
  timestamp: string;                      // ISO 8601
  relatedId?: string;                     // ID milestone atau fitur terkait
  relatedType?: 'milestone' | 'feature';
  publicationStatus: PublicationStatus;   // Default: 'draft'
}
```

---

## 4. PROYEKSI PUBLIK (FAIL-CLOSED WHITELIST)

Fungsi `extractPublicProgress(doc)` melakukan proyeksi aman dengan aturan:
1. Menyaring **HANYA** item dengan `publicationStatus === 'public'`.
2. Untuk screenshot, wajib memenuhi kriteria triple: `publicationStatus === 'public' && verifiedRealApp === true && sanitized === true`.
3. Memangkas field internal (`publicationStatus`, `verifiedRealApp`, `sanitized`, `metadataExtras`, dan custom properties).
4. Hasil proyeksi menghasilkan tipe `PublicProjectProgress` yang aman dikirim ke peramban tanpa risiko kebocoran data rahasia.

---

## 5. KEAMANAN & DAFTAR LARANGAN (DENYLIST)

Metadata ditolak keras (`valid: false`) jika mengandung:
1. **Kunci Terlarang:** `branch`, `commit`, `commitHash`, `hash`, `sourceCode`, `token`, `secret`, `apiKey`, `password`, `server`, `serverProvider`, `endpoint`, `internalUrl`, `ipAddress`, `authorEmail`, `keystore`, `privateKey`, `credential`, `sessionSecret`.
2. **Pola Secret:** Pola Google API Key, GitHub Token, AWS Access Key, password literal.
3. **Pola Endpoint Privat:** `localhost`, `127.0.0.1`, IP private subnet (`192.168.*`, `10.*`), domain internal.
4. **Data Pribadi (PII):** NIK 16 digit, nomor telepon pribadi, email non-publik.
