# SleepyKoala Studio — Pixel Art Asset Inventory (Milestone B3)

Dokumen ini mencatat inventaris lengkap seluruh aset visual SVG pixel art yang dibuat secara orisinal untuk Virtual Development Office SleepyKoala Studio.

Semua aset dibuat menggunakan geometri pixel SVG berbasis grid integer, menggunakan atribut `shape-rendering="crispEdges"` dan CSS `image-rendering: pixelated;` untuk menghasilkan tepi pixel yang tajam pada semua rasio zoom dan resolusi layar.

---

## 1. Ringkasan Inventaris Aset

- **Total Kategori**: 6 kategori (Characters, Furniture, Equipment, Decorations, Wall Tiles, Floor Tiles)
- **Total Aset SVG Orisinal**: 24 file
- **Lisensi**: Studio-Owned / CC0 1.0 Universal (Bebas royalti, kepemilikan studio penuh, $0.00 biaya pihak ketiga)
- **Format**: Scalable Vector Graphics (.svg) dengan pixel grid integer

---

## 2. Rincian Aset Berdasarkan Kategori

### A. Characters (Human Digital Coworkers) — 5 Aset
Direktori: `public/assets/virtual-office/characters/`

| Aset | Dimensi / Grid | Warna Utama (Hex) | Kostum & Aksesori | Role Mapping |
|---|---|---|---|---|
| `human-planner.svg` | 64×88 (Vector) | `#2563EB`, `#1E3A8A`, `#3F2314` | Setelan Blazer Navy, dasi biru, kacamata bingkai kawat, tablet roadmap digital | **Planner** (Perencana Proyek) |
| `human-developer.svg` | 64×88 (Vector) | `#14B8A6`, `#0F766E`, `#1C1917` | Hoodie modern teal-cyan, headphone over-neck, laptop perak IDE live code | **Developer** (Implementasi Fitur) |
| `human-tester.svg` | 64×88 (Vector) | `#10B981`, `#047857`, `#9A3412` | Kemeja oxford emerald, smart slacks, smartphone uji Android QA pass | **Tester** (Quality Assurance) |
| `human-reviewer.svg` | 64×88 (Vector) | `#F59E0B`, `#B45309`, `#171717` | Cardigan rajut warm amber, kacamata bulat tortoiseshell, clipboard checklist review | **Reviewer** (Review Arsitektur & UX) |
| `human-publisher.svg` | 64×88 (Vector) | `#0284C7`, `#0369A1`, `#18181B` | Bomber jacket sky-blue, studio lanyard badge ID, tablet launch console | **Publisher** (Build & Release Play Console) |

### B. Furniture (Furnitur Kantor Cozy) — 4 Aset
Direktori: `public/assets/virtual-office/furniture/`

| Aset | Dimensi / Grid | Proyeksi | Warna Utama | Deskripsi & Penempatan |
|---|---|---|---|---|
| `desk-wood-left.svg` | 64×48 | Isometrik 2:1 | `#8B5A2B`, `#6F421A`, `#4A2E12` | Meja kayu hangat menghadap kiri-depan untuk stasiun Developer & Planner |
| `desk-wood-right.svg` | 64×48 | Isometrik 2:1 | `#8B5A2B`, `#6F421A`, `#4A2E12` | Meja kayu hangat menghadap kanan-depan untuk stasiun QA & Reviewer |
| `office-chair-cozy.svg` | 24×32 | Isometrik 2:1 | `#2C3E50`, `#1A252F`, `#7F8C8D` | Kursi kerja ergonomis dengan bantalan navy dan roda castors |
| `bookshelf-wood.svg` | 32×64 | Dinding Kiri | `#6F421A`, `#533214`, `#E67E22` | Rak buku kayu jati vertikal berisi buku teknis, dokumentasi, dan map arsip |

### C. Equipment (Perangkat Kerja & Server) — 4 Aset
Direktori: `public/assets/virtual-office/equipment/`

| Aset | Dimensi / Grid | Proyeksi | Warna Utama | Deskripsi & Penempatan |
|---|---|---|---|---|
| `dual-monitors.svg` | 48×32 | Isometrik 2:1 | `#1E293B`, `#0F172A`, `#14B8A6` | Setup monitor ganda dengan visualisasi code editor dan terminal real-time |
| `server-rack-retro.svg` | 32×56 | Isometrik 2:1 | `#334155`, `#1E293B`, `#10B981` | Lemari server rack retro dengan lampu LED status blinking hijau/amber |
| `coffee-machine.svg` | 24×28 | Isometrik 2:1 | `#475569`, `#334155`, `#D97706` | Mesin espresso stainless steel dengan steam wand dan cangkir keramik |
| `test-phone-stand.svg` | 28×24 | Isometrik 2:1 | `#0F172A`, `#3B82F6`, `#10B981` | Rak dudukan ponsel uji Android dengan layar pengujian Play Store |

### D. Decorations (Dekorasi Suasana Studio) — 4 Aset
Direktori: `public/assets/virtual-office/decorations/`

| Aset | Dimensi / Grid | Proyeksi | Warna Utama | Deskripsi & Penempatan |
|---|---|---|---|---|
| `plant-monstera.svg` | 32×48 | 2.5D | `#15803D`, `#166534`, `#B45309` | Tanaman Monstera daun lebar dalam pot terakota untuk suasana asri studio |
| `whiteboard-roadmap.svg` | 48×40 | Dinding Belakang | `#F8FAFC`, `#94A3B8`, `#3B82F6` | Papan tulis beroda dengan sketsa sprint timeline, diagram, dan sticky notes |
| `cozy-rug-teal.svg` | 96×48 | Isometrik 2:1 | `#0F766E`, `#115E59`, `#FCD34D` | Karpet tenun isometrik teal berpinggiran krem di tengah lantai kantor |
| `studio-trophy.svg` | 20×28 | Isometrik 2:1 | `#F59E0B`, `#B45309`, `#1E293B` | Piala penghargaan studio berlapis emas di atas dudukan kayu obsidian |

### E. Wall Tiles (Dinding & Pencahayaan) — 4 Aset
Direktori: `public/assets/virtual-office/wall-tiles/`

| Aset | Dimensi / Grid | Proyeksi | Warna Utama | Deskripsi & Penempatan |
|---|---|---|---|---|
| `wall-warm-plaster-left.svg` | 64×128 | Isometrik Kiri | `#F5EBE0`, `#E3D5CA`, `#D5BDAF` | Dinding plester bergradasi hangat dengan lis kayu skirting kiri |
| `wall-warm-plaster-right.svg` | 64×128 | Isometrik Kanan | `#E8DFD8`, `#D6C7BC`, `#C4B5A5` | Dinding plester sisi kanan dengan bayangan lembut dan lis bawah |
| `wall-cozy-window.svg` | 48×64 | Dinding Kiri | `#D5BDAF`, `#38BDF8`, `#FDE047` | Jendela berbingkai kayu dengan pemandangan langit senja studio |
| `wall-sconce-lamp.svg` | 16×24 | Tempel Dinding | `#78350F`, `#FBBF24`, `#FEF3C7` | Lampu dinding sconce kuningan dengan pendar cahaya amber hangat |

### F. Floor Tiles (Ubin Lantai Isometrik) — 3 Aset
Direktori: `public/assets/virtual-office/floor-tiles/`

| Aset | Dimensi / Grid | Proyeksi | Warna Utama | Deskripsi & Penempatan |
|---|---|---|---|---|
| `floor-parquet-tile.svg` | 64×32 | Isometrik 2:1 | `#B45309`, `#92400E`, `#78350F` | Ubin kayu parket herringbone hangat untuk area kerja utama kantor |
| `floor-slate-tile.svg` | 64×32 | Isometrik 2:1 | `#475569`, `#334155`, `#1E293B` | Ubin batu slate abu-abu dingin untuk server room atau command center |
| `floor-carpet-tile.svg` | 64×32 | Isometrik 2:1 | `#0F766E`, `#134E4A`, `#042F2E` | Ubin karpet velvet teal lembut untuk area rapat dan meeting lounge |

---

## 3. Tooling & Contact Sheet

Sebuah contact sheet interaktif berbasis HTML mandiri disediakan di:
`public/assets/virtual-office/previews/contact-sheet.html`

File tersebut menyajikan:
- Grid pratinjau semua 24 aset dengan perbesaran pixel (zoom x1, x2, x4, x8)
- Palet warna sampel hex
- Panduan ukuran grid pixel
- Uji keterbacaan teks dan kontras rasio WCAG AA
