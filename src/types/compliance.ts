/**
 * SleepyKoala Studio — Google Play Console Compliance Types
 * Milestone 6.6
 */

export type ComplianceStatus = 'not_configured' | 'draft' | 'published';

export interface PrivacyPolicyData {
  status: ComplianceStatus;
  version: number;
  effectiveDate: string;
  lastUpdated: string;
  contactEmail: string;
  summary: string;
  content: string; // Full text / markdown / sections
  dataCollected: string[];
  thirdPartyServices: string[];
  userRightsSummary?: string;
  childrenPrivacyClause?: string;
}

export interface DeleteAccountData {
  status: ComplianceStatus;
  version: number;
  lastUpdated: string;
  requestEmail: string;
  turnaroundTime: string; // e.g. "3-7 hari kerja"
  retentionPolicy: string;
  deletionMethods: string[];
  content: string; // Detailed instructions
  dataDeletedList: string[];
  dataRetainedList: string[];
}

export interface ProjectCompliance {
  projectId: string;
  projectSlug: string;
  projectName: string;
  privacyPolicy: PrivacyPolicyData;
  deleteAccount: DeleteAccountData;
  updatedAt: string;
  publishedAt?: string;
  updatedBy?: string;
}

/**
 * Generate standard Google Play compliant templates for a project
 */
export function generateDefaultPrivacyPolicy(projectName: string, _projectSlug?: string, contactEmail = 'privacy@sleepykoalastudio.com'): PrivacyPolicyData {
  const today = new Date().toISOString().split('T')[0];
  return {
    status: 'draft',
    version: 1,
    effectiveDate: today,
    lastUpdated: new Date().toISOString(),
    contactEmail,
    summary: `Kebijakan Privasi ini menjelaskan bagaimana SleepyKoala Studio mengumpulkan, menggunakan, dan melindungi informasi Anda sehubungan dengan penggunaan game "${projectName}".`,
    dataCollected: [
      'Informasi Perangkat Dasar (model, versi OS, resolusi layar)',
      'Statistik Permainan Lokal (skor, progres level, konfigurasi audio)',
      'Crash Logs & Diagnostik anonim (jika diaktifkan oleh pengguna)'
    ],
    thirdPartyServices: [
      'Google Play Services (layanan autentikasi, leaderboard & pencapaian opsional)',
      'Google Play In-App Billing (jika pembelian dalam aplikasi tersedia)'
    ],
    userRightsSummary: 'Pengguna berhak untuk meminta penghapusan data, menolak pelacakan analitik non-esensial, dan menghubungi tim pengembang untuk klarifikasi privasi apa pun.',
    childrenPrivacyClause: 'Aplikasi ini tidak secara sengaja mengumpulkan data identitas pribadi dari anak-anak di bawah usia 13 tahun (atau usia yang setara di yurisdiksi Anda).',
    content: `# Kebijakan Privasi untuk ${projectName}

**Tanggal Efektif:** ${today}
**Terakhir Diperbarui:** ${today}

Selamat datang di **${projectName}**, karya orisinal dari **SleepyKoala Studio**. Kami menghargai privasi para pemain dan berkomitmen penuh untuk melindungi integritas informasi digital Anda.

### 1. Informasi yang Kami Kumpulkan
Game ini dirancang dengan prinsip minimasi data:
- **Data Tersimpan Lokal:** Progres permainan, preferensi suara, dan status pencapaian disimpan secara lokal di memori perangkat Anda.
- **Data Diagnostik:** Laporan kerusakan anonim (crash reports) yang disediakan secara standar melalui Google Play Console untuk membantu perbaikan bug.
- **Kami TIDAK mengumpulkan:** Nama asli, nomor telepon, alamat rumah, lokasi GPS presisi, kontak, atau data sensitif lainnya.

### 2. Layanan Pihak Ketiga
Aplikasi ini dapat memanfaatkan API resmi Google:
- **Google Play Games Services:** Digunakan untuk sinkronisasi cloud save dan achievement (hanya jika Anda memilih masuk).
- Kebijakan privasi Google dapat dilihat di [Google Privacy Policy](https://policies.google.com/privacy).

### 3. Keamanan Data
Kami mengadopsi standar enkripsi standar industri pada seluruh transfer data jaringan HTTPS jika ada sinkronisasi cloud. Data lokal dilindungi oleh sandboxing sistem operasi Android.

### 4. Hak Pengguna & Penghapusan Data
Anda berhak menghapus seluruh progres game Anda kapan saja melalui menu pengaturan dalam aplikasi atau dengan membersihkan cache/data aplikasi di pengaturan sistem Android Anda. Untuk permintaan penghapusan data akun tertaut, silakan kunjungi halaman Hapus Akun atau hubungi kami melalui email di bawah.

### 5. Kontak
Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami di:
**Email:** ${contactEmail}
**Studio:** SleepyKoala Studio
`
  };
}

export function generateDefaultDeleteAccount(projectName: string, _projectSlug?: string, requestEmail = 'support@sleepykoalastudio.com'): DeleteAccountData {
  return {
    status: 'draft',
    version: 1,
    lastUpdated: new Date().toISOString(),
    requestEmail,
    turnaroundTime: '3-7 hari kerja',
    retentionPolicy: 'Data akun dan cloud save yang terhapus tidak dapat dipulihkan kembali. Catatan transaksi finansial agregat dapat disimpan hingga periode yang diwajibkan oleh regulasi perpajakan yang berlaku.',
    deletionMethods: [
      'Melalui Menu Pengaturan di dalam game (Hapus Progres / Akun)',
      `Mengirimkan email permintaan penghapusan akun ke ${requestEmail}`
    ],
    dataDeletedList: [
      'ID Pemain (Player Identifier)',
      'Cloud Save & Progres Game',
      'Riwayat skor dan peringkat lokal',
      'Data preferensi pengguna'
    ],
    dataRetainedList: [
      'Log audit transaksi finansial anonim (sesuai kewajiban hukum Google Play / pajak)'
    ],
    content: `# Permintaan Penghapusan Akun & Data — ${projectName}

Sesuai dengan kebijakan privasi Google Play Console, pemain **${projectName}** memiliki hak penuh untuk meminta penghapusan akun serta seluruh data terkait yang disimpan oleh SleepyKoala Studio.

### Opsi 1: Penghapusan Mandiri Melalui Aplikasi
1. Buka game **${projectName}** di perangkat Anda.
2. Masuk ke menu **Pengaturan (Settings)** di pojok layar utama.
3. Gulir ke bawah hingga bagian **Privasi & Akun**.
4. Tekan tombol **Hapus Data Akun** dan konfirmasikan tindakan Anda.

### Opsi 2: Permintaan Melalui Email
Jika Anda telah mencopot (uninstall) aplikasi atau tidak dapat mengakses game:
1. Kirimkan email ke: **${requestEmail}**
2. Gunakan subjek: \`[HAPUS AKUN] Permintaan Penghapusan Data - ${projectName}\`
3. Sertakan informasi verifikasi:
   - User ID / In-game ID (jika ada) atau alamat email Google Play yang terhubung.
   - Perkiraan waktu terakhir bermain.
4. Tim kami akan memverifikasi dan memproses permohonan dalam waktu **3-7 hari kerja**.

Setelah diproses, konfirmasi penghapusan permanen akan dikirimkan kembali ke email Anda.`
  };
}
