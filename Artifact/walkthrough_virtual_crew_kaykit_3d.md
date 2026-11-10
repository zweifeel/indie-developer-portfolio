# Walkthrough: Tampilan Virtual AI Crew 3D (KayKit Adventurers) & Multi-Repositori `zweifeel`

> [!NOTE]
> Seluruh tangkapan layar di bawah ini diambil secara nyata dari antarmuka web **SleepyKoala Studio** setelah integrasi model 3D otentik **KayKit Adventurers (CC0)** dan **KayKit Furniture Bits (CC0)** selesai diimplementasikan.

---

## 📸 1. Tangkapan Layar Tampilan Virtual AI Crew 3D (KayKit Adventurers)

````carousel
![Tampilan Kampus Virtual 3D KayKit Overview](E:/Antigravity Project/indie-developer-portfolio/Artifact/virtual_crew_3d_campus_overview.png)
<!-- slide -->
![Tampilan Close-Up Ruangan DompetNalar & Kru 3D KayKit](E:/Antigravity Project/indie-developer-portfolio/Artifact/virtual_crew_3d_dompetnalar_room.png)
````

### Detail Visual yang Terverifikasi:
1. **Karakter 3D KayKit Adventurers Otentik (`Knight.glb`, `Mage.glb`, `Rogue.glb`, `Barbarian.glb`):**
   - Menggunakan kloning kerangka tulang 3D (`SkeletonUtils.clone`) sehingga setiap anggota kru di seluruh 6 ruangan (**DompetNalar**, **IDLE MASTER**, **Mobile Kasir**, **Idle Mining**, **The Broken Origin**, **Worklume**) tampil utuh di meja kerja masing-masing maupun saat berjalan otonom menuju *Collaboration Plaza* dan *Pantry*.
2. **Perabotan Kantor 3D KayKit Otentik (`KayKit Furniture Bits`):**
   - Rak buku dekoratif (`shelf_B_large_decorated`), sofa santai biru (`couch`), tanaman kaktus pot (`cactus_medium_A`), dan karpet hangat (`rug_rectangle_A`) terpasang rapi di setiap ruangan proyek.
3. **Interaksi Pengunjung & Balon Percakapan (Chat Bubbles):**
   - Pengunjung dapat memilih tab ruangan (contoh: **DompetNalar**) untuk melakukan *zoom-in* kamera secara mulus, melihat daftar status kru di panel kanan, serta menekan tombol aksi cepat seperti **Traktir Kopi** (`/kopi`) atau **Bangunkan!** (`/bangunkan`).

---

## 🗂️ 2. Status Ekosistem Multi-Repositori GitHub (`zweifeel`)

Sesuai instruksi Owner, setiap proyek memiliki repositori GitHub masing-masing yang terpisah (tidak dicampur ke dalam satu repositori):

| Nama Proyek | Kategori | Repositori GitHub (`zweifeel`) | Visibilitas | Status Sinkronisasi |
| :--- | :--- | :--- | :--- | :--- |
| **SleepyKoala Portfolio** | Website Utama | `https://github.com/zweifeel/indie-developer-portfolio` | Public | ✅ **Tersinkronisasi (`master`)** |
| **DompetNalar** *(folder lokal: FinSmart)* | Aplikasi Finansial | `https://github.com/zweifeel/DompetNalar` | Public | ✅ **Terhubung ke Webhook** |
| **IDLE MASTER** | Game Android | `https://github.com/zweifeel/idle-master` | Private | ✅ **Repositori Siap** |
| **Mobile Kasir** | Aplikasi Kasir POS | `https://github.com/zweifeel/mobile-kasir` | Private | ✅ **Repositori Siap** |
| **Idle Mining** | Game Android | `https://github.com/zweifeel/idle-mining` | Private | ✅ **Repositori Siap** |
| **Worklume** | Aplikasi Platform | `https://github.com/zweifeel/worklume` | Private | ✅ **Repositori Siap** |
| **The Broken Origin** | Game Roblox | `https://github.com/zweifeel/TBO-ROBLOX` | Private | 🔒 **BEKU (Strict Freeze)** |
