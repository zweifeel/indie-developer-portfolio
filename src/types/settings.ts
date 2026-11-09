/**
 * SleepyKoala Studio — Website Content & Branding Settings Types
 * Milestone 6.6
 */

export interface NavLinkItem {
  id: string;
  label: string;
  path: string;
  isExternal?: boolean;
}

export interface SocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
  discord?: string;
  playStore?: string;
}

export interface CustomStatItem {
  id: string;
  label: string;
  value: string;
  description?: string;
}

export interface HomepageSettings {
  badgeText: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  featuredSectionTitle: string;
  featuredSectionSubtitle: string;
  showStats: boolean;
  customStats?: CustomStatItem[];
}

export interface AboutSettings {
  developerName: string;
  developerRole: string;
  studioName: string;
  bioParagraphs: string[];
  philosophyTitle: string;
  philosophyDescription: string;
  techStack: string[];
  socialLinks: SocialLinks;
  contactNote: string;
}

export interface BrandingSettings {
  studioName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  supportEmail: string;
}

export interface FooterSettings {
  bioSummary: string;
  copyrightText: string;
  showFeedbackLink: boolean;
  additionalDisclaimer?: string;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogImageUrl?: string;
}

export type ContentPublishStatus = 'draft' | 'published';

export interface SiteSettings {
  id: string; // 'current' or version id
  branding: BrandingSettings;
  homepage: HomepageSettings;
  about: AboutSettings;
  navigation: NavLinkItem[];
  footer: FooterSettings;
  seo: SeoSettings;
  status: ContentPublishStatus;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'current',
  status: 'published',
  version: 1,
  updatedAt: '2026-11-02T00:00:00.000Z',
  publishedAt: '2026-11-02T00:00:00.000Z',
  branding: {
    studioName: 'SleepyKoala Studio',
    tagline: 'Crafting fun, polished, and lightweight mobile games.',
    supportEmail: 'contact@sleepykoalastudio.com',
  },
  homepage: {
    badgeText: 'Indie Game Developer',
    headline: 'Crafting Digital Experiences That Delight',
    subheadline: 'Koleksi game indie orisinal yang dirancang dengan teliti, mengedepankan keseruan gameplay dan estetika audio visual yang memikat.',
    primaryCtaText: 'Jelajahi Proyek',
    primaryCtaLink: '/projects',
    secondaryCtaText: 'Tentang Saya',
    secondaryCtaLink: '/about',
    featuredSectionTitle: 'Game & Aplikasi Pilihan',
    featuredSectionSubtitle: 'Temukan berbagai judul terbaru yang sedang dikembangkan dan telah dirilis.',
    showStats: true,
  },
  about: {
    developerName: 'SleepyKoala',
    developerRole: 'Solo Indie Developer & Game Designer',
    studioName: 'SleepyKoala Studio',
    bioParagraphs: [
      'Halo! Saya seorang indie developer independen yang berfokus membangun game mobile dan pengalaman digital interaktif yang hangat, menyenangkan, dan berkesan.',
      'Bekerja secara solo memungkinkan saya mengontrol estetika, mekanisme permainan, performa teknis, hingga detail terkecil dengan penuh dedikasi.'
    ],
    philosophyTitle: 'Filosofi Pengembangan',
    philosophyDescription: 'Gameplay yang berbobot tidak memerlukan spesifikasi berlebih. Pengalaman pemain, transparansi, dan penghargaan terhadap waktu pengguna adalah fondasi setiap karya.',
    techStack: [
      'Unity (C#)',
      'Godot Engine (GDScript / C#)',
      'TypeScript & React',
      'Cloudflare Pages & Workers',
      'Google Apps Script & Sheets DB',
      'Pixel Art & Vector Illustration',
      'Digital Audio & SFX Production'
    ],
    socialLinks: {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      email: 'contact@sleepykoalastudio.com',
      playStore: 'https://play.google.com/store/apps/dev?id=sleepykoala'
    },
    contactNote: 'Tertarik berkolaborasi, memberikan masukan, atau sekadar bertukar sapa seputar game development? Jangan ragu untuk menghubungi melalui email atau formulir feedback.'
  },
  navigation: [
    { id: 'nav-home', label: 'Beranda', path: '/' },
    { id: 'nav-projects', label: 'Proyek', path: '/projects' },
    { id: 'nav-about', label: 'Tentang', path: '/about' },
    { id: 'nav-feedback', label: 'Feedback', path: '/feedback' },
  ],
  footer: {
    bioSummary: 'SleepyKoala Studio — Dedicated solo indie game developer crafting memorable lightweight games with love.',
    copyrightText: '© 2026 SleepyKoala Studio. All rights reserved.',
    showFeedbackLink: true,
  },
  seo: {
    metaTitle: 'SleepyKoala Studio — Indie Game Developer Portfolio',
    metaDescription: 'Official portfolio and game showcase of SleepyKoala Studio. Discover polished indie games, mobile adventures, and devlogs.',
    metaKeywords: ['Indie Game', 'Game Developer', 'Mobile Games', 'SleepyKoala', 'Android Games', 'Unity', 'Godot'],
  }
};
