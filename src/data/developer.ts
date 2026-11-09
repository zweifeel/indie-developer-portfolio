export interface DeveloperProfile {
  readonly name: string;
  readonly role: string;
  readonly location: string;
  readonly bio: string;
  readonly contactNote: string;
  readonly philosophy: readonly string[];
  readonly coreInterests: readonly string[];
  readonly techStack: readonly {
    readonly category: string;
    readonly items: readonly string[];
  }[];
  readonly socialLinks: readonly {
    readonly label: string;
    readonly url: string;
    readonly icon: string;
  }[];
}

export const developerProfile: DeveloperProfile = {
  name: 'SleepyKoala',
  role: 'Android Game & Application Studio',
  location: 'Indonesia',
  bio: 'SleepyKoala adalah studio pengembang independen yang berfokus pada game mobile retro, utilitas berdaya guna tinggi, dan aplikasi Android berarsitektur bersih yang dirilis melalui Google Play Console.',
  contactNote: 'Gunakan formulir Feedback pada masing-masing halaman proyek untuk mengirim laporan bug, masukan, atau usulan fitur.',
  philosophy: [
    'Zero Bloatware: Aplikasi harus berukuran efisien, hemat daya baterai, dan tidak membebani memori perangkat pengguna.',
    'Offline-First: Pengalaman utama harus dapat dinikmati tanpa ketergantungan koneksi internet konstan.',
    'Respect User Privacy: Tidak ada pelacakan analitik invasif atau iklan yang mengganggu alur pengguna.',
    'Craftsmanship & Rigor: Setiap rilis melewati uji coba tertutup minimal 14 hari sebelum rilis publik di Google Play.',
  ],
  coreInterests: [
    '2D & Retro Mobile RPGs',
    'Android Native Development (Jetpack Compose, Kotlin, C++ Oboe Audio)',
    'Offline Algorithmic Systems & Data Compression',
    'High-Performance UI/UX dengan Zero Frame Drops',
  ],
  techStack: [
    {
      category: 'Mobile & Game Engines',
      items: ['Android SDK', 'Jetpack Compose', 'Kotlin', 'Godot Engine', 'C++ / NDK'],
    },
    {
      category: 'Web & Tools',
      items: ['React', 'TypeScript', 'Tailwind CSS', 'Cloudflare Pages', 'Git'],
    },
    {
      category: 'Audio & Asset Creation',
      items: ['Aseprite', 'Pixel Art', 'Chiptune Synthesizers', 'Audacity'],
    },
  ],
  socialLinks: [
    {
      label: 'Google Play Console',
      url: '#',
      icon: 'Play',
    },
    {
      label: 'GitHub',
      url: '#',
      icon: 'Github',
    },
  ],
};
