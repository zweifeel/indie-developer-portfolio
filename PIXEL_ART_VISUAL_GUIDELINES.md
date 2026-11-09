# SleepyKoala Studio — Pixel Art Visual Guidelines (Milestone B3)

Panduan gaya visual ini mendefinisikan standar artistik, spesifikasi teknis matematika isometrik, palet warna, dan aturan integrasi untuk Virtual Development Office SleepyKoala Studio.

---

## 1. Arah Visual: Cozy Isometric Pixel Art + Modern Professional Web UI

Sistem visual Virtual Office memadukan dua estetika:
1. **Cozy Isometric Pixel Art (2D/2.5D Canvas)**: Lingkungan ruang kerja hangat, ramah, dan bernuansa indie game studio menggunakan ubin isometrik dan sprite koala yang hidup.
2. **Modern Professional Web UI (Hybrid Framing)**: Frame kontainer bergradasi gelap (`stone-900`/`stone-950`), kartu informasi kaca (`backdrop-blur`), status pill monospaced, dan tipografi Tailwind yang bersih.

---

## 2. Matematika Proyeksi Isometrik (2:1 Dimetric Grid)

Virtual Office menggunakan proyeksi dimetrik standar game 2D (umumnya disebut *isometric pixel art*) dengan rasio perbandingan $2:1$.

### A. Rasio Langkah Pixel
- Setiap pergeseran 2 pixel horizontal ($\Delta x = 2$) berkorespondensi dengan 1 pixel vertikal ($\Delta y = 1$).
- Sudut kemiringan sumbu lantai adalah $\arctan(0.5) \approx 26.565^\circ$.
- Dimensi ubin standar: **Lebar 64px, Tinggi 32px**.

### B. Rumus Konversi Koordinat
Untuk memetakan koordinat ruang logis grid $(col, row)$ ke koordinat layar kanvas $(X, Y)$:

$$X_{\text{screen}} = X_{\text{origin}} + (col - row) \times \frac{\text{tileWidth}}{2}$$

$$Y_{\text{screen}} = Y_{\text{origin}} + (col + row) \times \frac{\text{tileHeight}}{2}$$

Dengan $\text{tileWidth} = 64\text{px}$ dan $\text{tileHeight} = 32\text{px}$:
$$X = X_0 + (col - row) \times 32$$
$$Y = Y_0 + (col + row) \times 16$$

### C. Depth Sorting & Z-Index Layering
Untuk mencegah tumpang tindih visual yang tidak natural:
- Elemen diurutkan berdasarkan kedalaman $Y_{\text{screen}}$: semakin besar nilai $Y$ (semakin ke bawah layar), semakin besar $Z\text{-index}$-nya.
- Penataan layer kanvas:
  1. `z-0`: Lantai isometrik (Parquet, Slate, Carpet)
  2. `z-1`: Karpet interior (`cozy-rug-teal`)
  3. `z-2`: Dinding plester belakang (`wall-warm-plaster-left`, `wall-warm-plaster-right`)
  4. `z-5`: Furnitur & peralatan dinding (Whiteboard, Server rack, Bookshelf, Window)
  5. `z-10`: Meja kerja workstation (`desk-wood-left`, `desk-wood-right`, Dual monitors)
  6. `z-20`: Karakter kru Koala (`PixelAgentAvatar` dinamis)
  7. `z-25`: Tanaman dan trofi latar depan (`plant-monstera`, `studio-trophy`)
  8. `z-30`: Notifikasi overlay dan banner status fallback statis

---

## 3. Palet Warna Cozy Studio

| Kategori Elemen | Kode Warna Hex | Peran Visual |
|---|---|---|
| **Warm Wood Brown** | `#8B5A2B`, `#6F421A`, `#4A2E12` | Meja kerja, rak buku, bingkai jendela, lis dinding |
| **Soft Cream / Plaster** | `#F5EBE0`, `#E3D5CA`, `#D5BDAF` | Dinding plester bertekstur, kertas blueprint, notasir |
| **Sage & Forest Green** | `#15803D`, `#166534`, `#0F766E` | Daun monstera, tanaman meja, aksen tester emerald |
| **Soft Teal / Cyan** | `#14B8A6`, `#0D9488`, `#06B6D4` | Hoodie developer, monitor terminal, karpet santai |
| **Warm Amber & Gold** | `#F59E0B`, `#D97706`, `#FDE047` | Lampu dinding sconce, piala studio, cardigan reviewer |
| **Deep Muted Navy** | `#1E293B`, `#0F172A`, `#2C3E50` | Jas formal planner, monitor casing, kursi ergonomis |
| **Warm Lighting Tint** | `rgba(245, 158, 11, 0.08)` | Ambient wash di atas lantai dan meja |

---

## 4. Standar Rendering Pixel Art pada Web Browser

Agar grafis SVG pixel art tidak diburamkan (*anti-aliased/blurred*) oleh engine peramban:

1. **Atribut SVG**:
   Semua file `.svg` wajib menyertakan atribut:
   ```xml
   <svg ... shape-rendering="crispEdges">
   ```
2. **CSS Image-Rendering**:
   Setiap tag `<img>` atau container yang merender aset SVG wajib menerapkan properti:
   ```css
   image-rendering: pixelated;
   image-rendering: crisp-edges; /* Fallback untuk Safari / WebKit */
   ```
3. **Grid Integer**:
   Semua elemen `<rect>`, `<path>`, dan `<polygon>` di dalam SVG harus menggunakan koordinat integer genap tanpa desimal mengambang.

---

## 5. Aksesibilitas dan Aturan Pengalaman Pengguna (WCAG AA)

1. **Reduced Motion**:
   - Jika pengguna menyalakan prefers-reduced-motion atau mengklik tombol `Motion: Off`, semua animasi CSS (`animate-bounce`, `animate-pulse`, `hover:-translate-y-0.5`) dinonaktifkan secara seketika.
2. **Mode Fallback Statis**:
   - Jika `staticFallback === true` diaktifkan (atau perangkat berdaya rendah terdeteksi), scene dirender sepenuhnya dalam bentuk gambar 2D datar tanpa dependensi animasi browser.
   - Banner transparan amber berstatus: *"Mode Fallback Statis Aktif — Menampilkan scene 2D isometrik pixel art tanpa animasi"* ditampilkan di bagian bawah kanvas.
3. **Navigasi Keyboard**:
   - Setiap avatar koala memiliki atribut `role="button"`, `tabIndex={0}`, dan label `aria-label` deskriptif lengkap.
   - Penekanan tombol `Enter` atau `Space` membuka detail agent inspector.
   - Focus ring kontras tinggi (`focus:ring-2 focus:ring-cyan-400`) menjamin keterlihatan fokus keyboard.
4. **Label Wajib Anti-Halusinasi**:
   - Baik di Virtual HQ maupun Project Room, banner dengan teks persis:
     `AI Agent Crew — Simulation`
     wajib selalu ditampilkan secara persisten untuk menegaskan kepada pengunjung bahwa kru koala adalah simulasi alur kerja AI studio, bukan staf manusia fisik.
