# Rencana Implementasi: Tahap 10 — Pengawasan Harian 14 Hari Closed Testing Mobile Kasir & 6 Formulir Evaluasi Akses Produksi Google Play Console

## 1. Deskripsi Tujuan (Goal Description)

Berdasarkan instruksi langsung dari Owner SleepyKoala Studio (Non-Coder), proyek portofolio studio indie kini melangkah ke **TAHAP 10 SESUAI ROADMAP.MD**:
1. **Pengawasan Harian Kepatuhan 14 Hari Closed Testing Mobile Kasir di Google Play Console:**
   Menyediakan sistem pemantauan harian interaktif dan pencatatan metrik vital Google Play secara ketat:
   - Pemantauan minimal 20 tester opt-in aktif (saat ini terdaftar 24 tester).
   - Ambang batas aman stabilitas aplikasi: *Crash Rate* < 1.09% (Crash-free >= 98.91%) dan *ANR Rate* < 0.47%.
   - Pencatatan checklist harian 4 pilar (Verifikasi Opt-in, Inspeksi Crash/ANR, Review Feedback, Telemetri Pengujian Kasir Nyata) dari Hari ke-1 (2026-11-10) hingga Hari ke-14 (2026-11-23) dengan penyimpanan lokal persisten (*LocalStorage*).
2. **Penyiapan & Verifikasi 6 Formulir Evaluasi Jawaban Resmi Akses Produksi Google Play Store:**
   Menyediakan modul 6 formulir evaluasi jawaban resmi berstandar industri studio indie di Web Admin CMS (`/admin` -> tab `COMPLIANCE`):
   - 6 Pertanyaan wajib Google Play Console untuk akun perorangan (Metode Rekrutmen, Kemudahan Rekrutmen, Keterlibatan & Feedback, Ringkasan Masukan & Solusi Bug, Kriteria Kesiapan Produksi, serta Rencana Pasca-Rilis).
   - Jawaban resmi komprehensif berkualitas tinggi yang siap disalin 1-klik (*1-Click Copy*) maupun disalin seluruhnya sekaligus dalam format Markdown/Teks untuk ditempelkan ke Google Play Console.
   - Kemampuan penyesuaian (edit/customization) jawaban langsung oleh Owner dengan status verifikasi kelengkapan dokumen (*6/6 Siap Diajukan*).

> [!NOTE]
> **Catatan Khusus Terkait Deklarasi Owner atas Simulasi Kantor Virtual 3D:**
> Deklarasi Owner bahwa Simulasi Virtual Office 3D dinyatakan **BLOCKED** (kru AI masih tersangkut di meja, belum cerdas mencari rute lain saat berpapasan, dan masih ada ruangan tanpa dinding) telah kami catat secara resmi ke memori proyek. Perbaikan fisik dinding, navigasi A* mesh, dan pemecah jalur papasan akan diprioritaskan saat siklus revisi kantor virtual dibuka kembali. Sesuai instruksi mutlak Owner saat ini, seluruh fokus kerja dialihkan penuh ke **TAHAP 10**.

---

## 2. Analisis Risiko & Tabrakan Fitur (Bahasa Awam Non-Coder)

> [!IMPORTANT]
> **Analisis Risiko Arsitektur Sesuai Protokol 1 GEMINI.md:**
> - **Dampak ke Fitur Lain:**
>   Modul Kepatuhan (*COMPLIANCE*) ini berdiri secara terisolasi di dalam halaman Web Admin CMS (`/admin`). Seluruh 793 pengujian otomatis yang sudah lulus 100%, sistem pendaftaran tester publik di beranda, API Google Apps Script, dan sistem keamanan token **TIDAK AKAN TERSENTUH MAUPUN TERGANGGU**.
> - **Potensi Risiko (Analogi Sederhana):**
>   *Analogi:* Seperti menambahkan buku agenda kerja harian dan formulir laporan resmi di meja kantor Admin. Jika buku agenda ini dibuka atau ditulis, operasional toko kasir dan etalase toko di depan tetap berjalan normal tanpa risiko mati lampu atau barang rusak.
> - **Rekomendasi Aman:**
>   Menerapkan arsitektur **3-Lapis (Data-First -> Logic -> UI-Last)**:
>   1. *Lapis 1 (Data-First):* Menyusun kontrak data bertipe ketat (`GooglePlayProductionQuestion`, ambang batas `MAX_CRASH_RATE = 1.09%`, `MAX_ANR_RATE = 0.47%`).
>   2. *Lapis 2 (Headless Logic & CLI Test):* Menulis logika validasi dan pengujian otomatis di terminal via Vitest hingga 100% PASS sebelum membuat antarmuka visual.
>   3. *Lapis 3 (UI-Last):* Menampilkan kartu interaktif pemantau harian dan generator 6 formulir di dashboard admin dengan tombol salin instan.
> - **Mandat Anggaran Nol Rupiah (Rp 0 / $0.00):**
>   100% Gratis. Fitur ini menggunakan penyimpanan lokal browser (*LocalStorage*) dan pustaka bawaan React/Tailwind/Lucide yang sudah ada di proyek tanpa menambah dependensi berbayar atau sewa cloud baru.

---

## 3. User Review Required (Keputusan Kunci untuk Owner)

> [!TIP]
> **Keputusan Format Tampilan 6 Formulir di Tab COMPLIANCE:**
> Kami mengusulkan penempatan modul 6 formulir ini langsung menyatu di dalam kartu `ClosedTestingMonitor` di tab `COMPLIANCE`. 
> Dengan cara ini, Owner bisa melihat perkembangan 14 hari di bagian atas, dan tepat di bawahnya langsung tersedia 6 kotak jawaban resmi Google Play yang siap ditinjau dan disalin saat pengajuan produksi dibuka.
> Apakah Owner menyetujui penempatan terpadu ini, atau lebih suka dibuatkan sub-tab terpisah di dalam menu Kepatuhan? (Rekomendasi kami: Terpadu di dalam satu halaman agar ringkas dan mudah dipantau).

---

## 4. Open Questions (Pertanyaan Terbuka)

> [!NOTE]
> 1. **Tanggal Mulai Uji Coba Resmi:** Sistem saat ini mencatat tanggal awal Closed Testing adalah **10 November 2026** (Hari ke-1) dan tanggal hari ini adalah **11 November 2026** (Hari ke-2). Apakah tanggal awal ini sudah sesuai dengan tanggal rilis track Closed Testing di Google Play Console Anda? (Sistem menyediakan pengaturan tanggal dinamis jika Owner ingin menyesuaikannya).
> 2. **Metrik Harian Hari ke-1 & 2:** Untuk Hari ke-1 (kemarin) dan Hari ke-2 (hari ini), apakah ada catatan insiden atau bug khusus yang dilaporkan tester di Google Play Console, ataukah sistem stabil 100% (Crash rate 0.00% & ANR 0.00%)? (Secara default sistem akan mencatat metrik sempurna 100% crash-free).

---

## 5. Rincian Perubahan yang Diusulkan (Proposed Changes)

```mermaid
flowchart TD
    subgraph LAPIS_1["Lapis 1: Kontrak Data Bertipe (Data-First)"]
        TYPES["src/types/closedTestingTracker.ts\n• GooglePlayProductionQuestion\n• 6 Canonical Questions & Official Answers\n• Ambang Batas: Crash < 1.09%, ANR < 0.47%, Tester >= 20"]
    end

    subgraph LAPIS_2["Lapis 2: Logika Murni & Pengujian Terminal"]
        SERVICE["src/services/closedTestingService.ts\n• getProductionAccessQuestions()\n• updateProductionAccessQuestionAnswer()\n• exportAllProductionQuestionsMarkdown()\n• updateDayMetrics(day, testers, crash, anr, notes)\n• save/load Tracker via LocalStorage"]
        TESTS["src/test/closedTestingService.test.ts\n• Uji ambang batas 1.09% crash & 0.47% ANR\n• Uji 6 formulir evaluasi & export markdown\n• Uji penyimpanan persisten 14 hari"]
    end

    subgraph LAPIS_3["Lapis 3: Antarmuka Interaktif Web Admin CMS"]
        UI_MONITOR["src/components/admin/ClosedTestingMonitor.tsx\n• Pemantau Harian Interaktif (Hari 1 s/d 14)\n• Kartu Input Metrik Harian & Catatan Pengujian\n• 6 Formulir Jawaban Resmi Google Play Console\n• Tombol 1-Click Copy per Jawaban & Salin Semua"]
        UI_TESTS["src/test/closedTestingMonitor.test.tsx\n• Uji interaksi tombol salin jawaban\n• Uji toggle checkbox & input metrik harian"]
    end

    TYPES --> SERVICE
    SERVICE --> TESTS
    TESTS -->|100% Lulus| UI_MONITOR
    UI_MONITOR --> UI_TESTS
```

---

### Lapis 1: Skema Data & Tipe Bertipe (Data-First)

#### [MODIFY] `src/types/closedTestingTracker.ts`
- Menambahkan interface `GooglePlayProductionQuestion`:
  ```typescript
  export interface GooglePlayProductionQuestion {
    id: string; // e.g. 'q1_recruitment'
    questionNumber: number; // 1 to 6
    category: 'RECRUITMENT' | 'ENGAGEMENT' | 'READINESS';
    title: string;
    questionId: string; // Pertanyaan resmi Bahasa Indonesia
    questionEn: string; // Official question text in English
    officialAnswer: string; // Jawaban resmi komprehensif SleepyKoala Studio
    customAnswer?: string; // Jawaban yang disesuaikan Owner (opsional)
    isVerified: boolean;
    guidanceNotes: string; // Catatan panduan penilaian tim reviewer Google Play
  }
  ```
- Menambahkan konstanta `CANONICAL_PRODUCTION_QUESTIONS` yang memuat 6 naskah jawaban resmi:
  1. *Metode Rekrutmen Penguji* (Landing page web, formulir opt-in publik, komunitas pelaku UMKM kasir).
  2. *Kemudahan/Tantangan Rekrutmen* (Pengumpulan 24+ penguji opt-in aktif melebihi syarat minimal 20).
  3. *Keterlibatan Penguji & Feedback* (Skenario kasir harian, keranjang belanja, cetak printer thermal Bluetooth).
  4. *Ringkasan Feedback & Solusi Perbaikan* (Optimasi kontras struk thermal 58mm, perbaikan reconnect Bluetooth).
  5. *Kriteria Kesiapan Produksi* (Crash rate 0.00% < 1.09%, ANR 0.00% < 0.47%, 14 hari berturut-turut, 15+ variasi tipe HP).
  6. *Rencana Pasca-Rilis Produksi* (Fitur QRIS dinamis, integrasi multi-cabang kasir, pemantauan mingguan Android Vitals).
- Menambahkan konstanta kepatuhan resmi:
  - `MAX_CRASH_RATE_PERCENT = 1.09`
  - `MAX_ANR_RATE_PERCENT = 0.47`
  - `MIN_REQUIRED_OPT_IN_TESTERS = 20`
- Memperkaya `ClosedTestingDayRecord` dengan field `dailyNotes?: string` dan evaluasi akurat crash rate & ANR rate.

---

### Lapis 2: Logika Murni Backend / Service & Pengujian Terminal (Logic & CLI Test)

#### [MODIFY] `src/services/closedTestingService.ts`
- Menambahkan fungsi pembantu:
  - `getProductionAccessQuestions()`: Mengambil daftar 6 pertanyaan dengan status verifikasi.
  - `updateProductionAccessQuestionAnswer(questions, id, newAnswer, isVerified)`: Memperbarui teks dan status verifikasi pertanyaan.
  - `exportAllProductionQuestionsMarkdown(questions, tracker)`: Menghasilkan naskah lengkap seluruh pertanyaan dan jawaban terformat rapi untuk disalin 1-klik.
  - `updateDayMetrics(tracker, dayNumber, metrics: { activeTesters?: number, crashRate?: number, anrRate?: number, notes?: string })`: Memperbarui metrik harian spesifik dan menghitung ulang kepatuhan hari tersebut terhadap batas 1.09% crash dan 0.47% ANR.
  - `saveClosedTestingTrackerToStorage(tracker)` & `loadClosedTestingTrackerFromStorage()`: Menyimpan dan memuat state tracker dari `localStorage` browser secara aman (*safe failover* jika dijalankan di lingkungan testing/headless).

#### [MODIFY] `src/test/closedTestingService.test.ts`
- Menambahkan pengujian otomatis Vitest:
  - Validasi inisialisasi 6 pertanyaan resmi Google Play.
  - Validasi evaluasi ambang batas crash rate (< 1.09%) dan ANR (< 0.47%).
  - Validasi ekspor teks gabungan (Markdown) untuk keperluan copy-paste massal.
  - Validasi persistensi penyimpanan lokal.

---

### Lapis 3: Antarmuka Visual & Pengalaman Pengguna (UI-Last)

#### [MODIFY] `src/components/admin/ClosedTestingMonitor.tsx`
- **Bagian 1: Pemantau Harian 14 Hari yang Disempurnakan:**
  - Kalender 14 hari dengan penanda hari aktif (Hari ini: Hari ke-2).
  - Formulir inspeksi harian: Input jumlah tester aktif, crash rate %, ANR %, dan kolom catatan temuan/feedback harian.
  - Badge visual kepatuhan otomatis:
    - Tester: `>= 20` (Hijau) / `< 20` (Merah Peringatan).
    - Crash Rate: `< 1.09%` (Aman / Hijau) / `>= 1.09%` (Bahaya / Merah).
    - ANR Rate: `< 0.47%` (Aman / Hijau) / `>= 0.47%` (Bahaya / Merah).
  - Tombol simpan metrik harian langsung tersimpan ke *LocalStorage*.
- **Bagian 2: Modul 6 Formulir Evaluasi Jawaban Resmi Google Play Console:**
  - Tampilan kartu elegan untuk masing-masing dari 6 pertanyaan resmi.
  - Menampilkan pertanyaan dalam Bahasa Indonesia & Bahasa Inggris resmi Google Play Console.
  - Tombol **"Salin Jawaban"** (1-Click Copy) di setiap kartu dengan animasi status *"Tersalin!"*.
  - Mode **"Edit Jawaban"** jika Owner ingin menyesuaikan redaksi atau menambahkan data spesifik.
  - Tombol **"Salin Semua 6 Jawaban Sekaligus (Format Dokumen)"** untuk efisiensi pengisian di Google Play Console.
  - Progress bar kesiapan permohonan produksi (*6 / 6 Formulir Terverifikasi Siap Kirim*).

#### [MODIFY] `src/test/closedTestingMonitor.test.tsx`
- Memperluas pengujian komponen antarmuka:
  - Uji kemunculan 6 formulir evaluasi jawaban resmi.
  - Uji interaksi tombol salin jawaban ke clipboard.
  - Uji perubahan metrik harian dan pembaruan badge kepatuhan.

---

## 6. Rencana Verifikasi (Verification Plan)

### Automated Tests
1. **Pengujian Unit & Komponen (Vitest):**
   ```bash
   npm test -- --run
   ```
   *Target:* Memastikan seluruh 793 tes yang ada tetap lulus 100%, ditambah minimal 8 pengujian baru untuk logika 6 formulir evaluasi dan metrik kepatuhan (Total >= 801 tes lulus).
2. **Pemeriksaan Kompilasi TypeScript & Build:**
   ```bash
   npm run build
   ```
   *Target:* 0 TypeScript errors, 0 build warnings.
3. **Pemeriksaan Keamanan & Kebijakan File (DevSecOps):**
   ```bash
   node scripts/security-scan.js
   node scripts/privacy-scan.js
   node scripts/check-file-policy.js
   ```
   *Target:* 0 rahasia bocor, 0 data pribadi bocor, 100% berkas patuh kebijakan.

### Manual Verification (Protokol Mata AI & Validasi Browser)
1. Buka Web Admin CMS pada browser lokal (`http://localhost:5173/admin`).
2. Masuk ke tab **COMPLIANCE**.
3. Verifikasi modul **Monitoring 14 Hari Closed Testing**:
   - Periksa apakah Hari ke-1 dan Hari ke-2 dapat dipilih dan diedit metriknya.
   - Uji masukkan crash rate `0.5%` (harus berwarna hijau aman karena < 1.09%).
   - Uji masukkan crash rate `1.5%` (harus memunculkan indikator peringatan karena >= 1.09%).
4. Verifikasi modul **6 Formulir Evaluasi Jawaban Resmi Google Play**:
   - Periksa keberadaan 6 pertanyaan resmi dan jawaban standarnya.
   - Klik tombol "Salin Jawaban" pada pertanyaan 1 dan verifikasi teks tersalin ke clipboard.
   - Klik tombol "Salin Semua Jawaban" dan verifikasi format dokumen Markdown tersusun rapi.
   - Refresh browser untuk membuktikan bahwa data metrik dan catatan tersimpan aman di *LocalStorage*.
