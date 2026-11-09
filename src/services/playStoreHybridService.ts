import type { Project } from '../types/project';

export interface PlayStoreListingData {
  readonly packageName: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly language?: string;
  readonly iconUrl?: string;
  readonly featureGraphicUrl?: string;
  readonly screenshots?: readonly string[];
  readonly videoUrl?: string;
  readonly syncStatus?: 'SYNCED' | 'FAILED' | 'PENDING';
}

/**
 * Menggabungkan metadata internal SleepyKoala dengan listing Google Play Store.
 *
 * Aturan Otoritas (Hybrid Model):
 * 1. Google Play Console memegang otoritas atas:
 *    - Nama Aplikasi (title)
 *    - Deskripsi Singkat (shortDescription)
 *    - Deskripsi Lengkap (fullDescription)
 *    - Ikon Aplikasi (iconUrl via CDN Google Play, dengan fallback aset lokal)
 *    - Tangkapan Layar (screenshots via CDN Google Play, dengan fallback aset lokal)
 *    - Video Promosi (videoUrl jika tersedia)
 *
 * 2. SleepyKoala memegang otoritas atas:
 *    - ID & Slug Proyek (id, slug)
 *    - Kategori Proyek (category: GAME / APPLICATION)
 *    - Siklus Hidup & Status Proyek (status: CLOSED_TESTING, WORK_IN_PROGRESS, dll.)
 *    - Status Perekrutan Tester (registrationOpen, testerRequirementDays)
 *    - Sorotan Utama (featured, tags)
 *    - Konten Tambahan (technicalHighlights, capabilities, vision)
 *    - Fallback Aset Grafis Lokal (icon lokal jika remote gagal)
 */
export function mergeProjectWithPlayStoreListing(
  project: Project,
  listing: PlayStoreListingData | null | undefined
): Project {
  if (!listing || listing.syncStatus === 'FAILED') {
    return project;
  }

  const updatedName = listing.title && listing.title.trim().length > 0 ? listing.title.trim() : project.name;
  const updatedShortDesc =
    listing.shortDescription && listing.shortDescription.trim().length > 0
      ? listing.shortDescription.trim()
      : project.shortDescription;
  const updatedFullDesc =
    listing.fullDescription && listing.fullDescription.trim().length > 0
      ? listing.fullDescription.trim()
      : project.fullDescription;

  // Ikon: jika remote URL tersedia, gunakan remote, namun fallback lokal tetap ada di aset proyek
  const updatedIcon =
    listing.iconUrl && listing.iconUrl.trim().length > 0 ? listing.iconUrl.trim() : project.icon;

  // Screenshots: jika remote screenshots ada dan tidak kosong, gunakan itu
  const updatedScreenshots =
    listing.screenshots && listing.screenshots.length > 0 ? listing.screenshots : project.screenshots;

  return {
    ...project,
    name: updatedName,
    shortDescription: updatedShortDesc,
    fullDescription: updatedFullDesc,
    icon: updatedIcon,
    screenshots: updatedScreenshots,

    // Otoritas Absolut SleepyKoala
    id: project.id,
    slug: project.slug,
    category: project.category,
    status: project.status,
    registrationOpen: project.registrationOpen,
    testerRequirementDays: project.testerRequirementDays,
    featured: project.featured,
    tags: project.tags,
    technicalHighlights: project.technicalHighlights,
    capabilities: project.capabilities,
    vision: project.vision,
  };
}
