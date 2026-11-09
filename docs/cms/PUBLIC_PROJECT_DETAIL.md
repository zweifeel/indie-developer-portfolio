# SLEEPYKOALA CMS — PUBLIC PROJECT DETAIL SPECIFICATION

## 1. PENDAHULUAN

Halaman detail proyek (`src/pages/ProjectDetailPage.tsx`) merupakan etalase publik utama SleepyKoala Studio. Dokumen ini menjelaskan integrasi proyeksi kemajuan kanonikal pada halaman detail untuk menyajikan roadmap strategis, fitur terverifikasi, galeri tangkapan layar, dan timeline aktivitas pengembangan secara transparan dan aman.

---

## 2. STRUKTUR & SEKSI DETAIL PROYEK

Halaman detail memuat 4 seksi kemajuan kanonikal yang bersumber dari API publik `/api/projects/:slug/progress`:

```
+-------------------------------------------------------------------------+
|                        PROJECT DETAIL HEADER                            |
|  Nama Proyek, Kategori, Deskripsi, Badge Status, Tombol Tester/Aksi     |
+-------------------------------------------------------------------------+
|                                                                         |
|  [ SEKSI 1: STRATEGIC ROADMAP ]                                         |
|  - Milestone pengembangan terurut (order ASC)                           |
|  - Target kuartal rilis (misal: Q1 2026, Q2 2026)                       |
|  - Badge status implementasi (Selesai, Sedang Dikerjakan, Terencana)    |
|                                                                         |
|  [ SEKSI 2: SPESIFIKASI FITUR TERVERIFIKASI ]                           |
|  - Kartu fitur dengan badge kategori (Core, Security, Storage, Engine)  |
|  - Prioritas fitur & deskripsi fungsional                               |
|  - Relasi ke milestone induk                                            |
|                                                                         |
|  [ SEKSI 3: TANGKAPAN LAYAR TERVERIFIKASI ]                             |
|  - Grid gambar build asli yang telah lolos sanitasi privasi             |
|  - Badge "Build Asli Terverifikasi"                                     |
|  - Caption informatif & modal preview interaktif                        |
|                                                                         |
|  [ SEKSI 4: AKTIVITAS PENGEMBANGAN TERKINI ]                            |
|  - Timeline event kemajuan proyek                                       |
|  - Tanggal verifikasi ISO 8601                                          |
|  - Nol kebocoran commit hash / branch internal                          |
|                                                                         |
+-------------------------------------------------------------------------+
|  [ SEKSI 5: VIRTUAL OFFICE CLOSE-UP ROOM ]                              |
|  Ruang kerja pixel art tim interaktif (PixelProjectRoom)                |
+-------------------------------------------------------------------------+
```

---

## 3. PROYEKSI PUBLIK (FAIL-CLOSED & ZERO LEAKAGE)

Data kemajuan proyek yang dikonsumsi oleh `ProjectDetailPage` diekstraksi secara ketat menggunakan fungsi `extractPublicProgress()`:

```typescript
export function extractPublicProgress(doc: ProjectProgressDocument): PublicProjectProgress {
  return {
    projectSlug: doc.projectSlug,
    projectName: doc.projectName,
    projectType: doc.projectType,
    roadmap: (doc.roadmap || []).filter((m) => m.publicationStatus === 'public').map(stripInternalMilestoneFields),
    features: (doc.features || []).filter((f) => f.publicationStatus === 'public').map(stripInternalFeatureFields),
    screenshots: (doc.screenshots || []).filter((s) => s.publicationStatus === 'public' && s.verifiedRealApp && s.sanitized),
    events: (doc.events || []).filter((e) => e.publicationStatus === 'public').map(stripInternalEventFields),
    lastPublicUpdate: doc.updatedAt,
  };
}
```

Bidang internal yang secara permanen dibuang dari respons publik:
- `publicationStatus` (implisit selalu publik)
- `internalBranch`
- `localFilePath`
- `developerNote`
- `commitHash`
- `internalNotes`
- Kredensial atau token rahasia

---

## 4. KETAHANAN KONDISI KOSONG (EMPTY STATE RESILIENCE)

Jika suatu proyek belum memiliki item publik pada salah satu kategori:
1. Komponen tidak mengalami error atau melempar runtime exception.
2. Seksi menyajikan placeholder informatif yang elegan, misalnya: *"Belum ada milestone publik yang dijadwalkan."* atau *"Tangkapan layar versi build rilis sedang dipersiapkan."*
3. Status keterlibatan closed testing atau pra-registrasi tetap dapat diakses normal melalui modal registrasi tester.

---

## 5. PENANGANAN KEGAGALAN & STATUS OFFLINE

Jika backend Apps Script atau Cloudflare Functions tidak dapat dihubungi:
1. Halaman menampilkan layar kesalahan ramah pengguna: *"Layanan Detail Proyek Tidak Tersedia"*.
2. Pengguna disediakan tombol *"Coba Lagi"* dan tautan navigasi *"Kembali ke Koleksi Proyek"*.
3. Sistem tidak pernah membocorkan stack trace, URL backend internal, atau error runtime kepada pengunjung.
