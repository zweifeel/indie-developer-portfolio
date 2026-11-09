/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE 3D DIALOGUE & COMMAND BANK
 * 
 * Contextual Tech Dialogues, Casual Coffee Chatter, Thought Bubbles,
 * and Responsive Visitor Commands.
 * ============================================================================
 */

import { VisitorCommandDef } from '../types/virtualOffice3D';

export const VISITOR_COMMAND_CATALOG: VisitorCommandDef[] = [
  {
    command: '/bangunkan',
    aliases: ['bangun', 'tepuk', '/tepuk', 'wake', '/wake'],
    actionType: 'WAKE_UP',
    label: 'Bangunkan!',
    icon: '⏰',
    description: 'Menepuk pundak kru yang melamun/tidur agar kaget dan langsung kembali mengetik cepat.',
    sampleUsage: '/bangunkan',
  },
  {
    command: '/kopi',
    aliases: ['coffee', '/coffee', 'traktir-kopi', '/traktir-kopi', 'espresso'],
    actionType: 'SERVE_COFFEE',
    label: 'Traktir Kopi',
    icon: '☕',
    description: 'Menyajikan cangkir kopi panas ke meja kru untuk meningkatkan kecepatan kerja (+50% SPD).',
    sampleUsage: '/kopi',
  },
  {
    command: '/pizza',
    aliases: ['snack', '/snack', 'kirim-pizza', '/kirim-pizza', 'makan'],
    actionType: 'ORDER_PIZZA',
    label: 'Kirim Pizza',
    icon: '🍕',
    description: 'Mengirim seloyang pizza lezat ke lounge dan memanggil rekan-rekan untuk istirahat bersama.',
    sampleUsage: '/pizza',
  },
  {
    command: '/lembur',
    aliases: ['crunch', '/crunch', 'overtime', '/overtime', 'fokus'],
    actionType: 'CRUNCH_MODE',
    label: 'Mode Lembur',
    icon: '⚡',
    description: 'Menyalakan mode fokus tinggi: lampu meredup hangat, monitor menyala terang, dan kru mengetik cepat.',
    sampleUsage: '/lembur',
  },
  {
    command: '/pesta',
    aliases: ['party', '/party', 'celebrate', '/celebrate', 'rilis', '/rilis'],
    actionType: 'PARTY_CONFETTI',
    label: 'Pesta Rilis',
    icon: '🎉',
    description: 'Meledakkan konfeti perayaan atas pencapaian milestone dan kesiapan rilis Google Play.',
    sampleUsage: '/pesta',
  },
  {
    command: '/tanya',
    aliases: ['status', '/status', 'info', '/info'],
    actionType: 'QUERY_STATUS',
    label: 'Tanya Status',
    icon: '💬',
    description: 'Menanyakan kabar progres langsung kepada kru terdekat via balon obrolan.',
    sampleUsage: '/tanya',
  },
];

export const RANDOM_THOUGHT_BUBBLES: string[] = [
  '💭 Optimasi indeks database berhasil turun ke 0.8ms!',
  '💭 Checklist kepatuhan Google Play 14 hari sudah aman.',
  '💭 Shader pencahayaan isometriknya kelihatan cozy banget.',
  '💭 Menyiapkan unit test integrasi untuk edge function...',
  '💭 Perlu refactor state manager sebelum staging rilis.',
  '💭 Zero memory leak, rendering stabil di 60 FPS!',
  '💭 Jangan lupa commit pesan dengan format konvensional.',
  '💭 UI tablet kasirnya responsif di layar sentuh.',
  '💤 Ngantuk dikit nunggu compile gradle selesai... zZz',
  '💤 Semalam begadang review pull request... *hoam*',
];

export const CASUAL_DIALOGUES: Array<{ speaker: string; reply: string }> = [
  {
    speaker: 'Bro, query transaksi offline sudah diuji dengan SQLCipher?',
    reply: 'Udah aman bro! Enkripsinya tembus benchmark tanpa lag.',
  },
  {
    speaker: 'Bisa minta tolong cek responsivitas layout tablet 10 inci?',
    reply: 'Siap! Breakpoint layarnya barusan ku-adjust di CSS container.',
  },
  {
    speaker: 'Kopi di pantry baru diseduh, mau sekalian kuambilkan?',
    reply: 'Boleh banget! Yang americano tanpa gula ya, thanks!',
  },
  {
    speaker: 'Status pengujian 14 hari tester Google Play gimana?',
    reply: 'Mantap, feedback tester positif dan zero crash di crashlytics!',
  },
  {
    speaker: 'Desain icon barunya kelihatan clean dan eye-catching.',
    reply: 'Makasih! Pilihan palet warna hangatnya memang sengaja dibikin cozy.',
  },
];

export const WAKE_UP_REACTIONS: string[] = [
  '❗ *Kaget!* Waduh ketahuan bengong... Langsung gas coding lagi!',
  '❗ Siap bos! Mata langsung melek, lanjut review pull request!',
  '❗ Hehe ketiduran sebentar... Langsung tancap gas testing!',
];

export const COFFEE_REACTIONS: string[] = [
  '☕ Wow kopi espresso hangat! Terima kasih banyak bos, energi 100%!',
  '☕ Pas banget lagi butuh kafein! Kecepatan coding meningkat drastis!',
  '☕ Kopi premium SleepyKoala Studio emang juara!',
];
