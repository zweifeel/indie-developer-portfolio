/**
 * ============================================================================
 * SLEEPYKOALA CMS — PROGRESS METADATA SERVICE (STAGE 5)
 * 
 * Single Source of Truth for CMS Progress Integration:
 * 1. Non-destructive Reading & Writing of Canonical Progress Documents (v2)
 * 2. Strict Project Isolation (validates project slugs, prevents cross-project leakage)
 * 3. Fail-Closed Public Whitelist Projection via extractPublicProgress()
 * 4. Protected Preview Projection for Authorized Administrators
 * 5. State Machine for Editorial Publication Workflow (draft -> review -> public -> hidden)
 * 6. Auditable Editorial Actions (zero credentials / secret logging)
 * 7. In-Memory Decoupled Cache & Fallback for Offline / Mock Runtime
 * ============================================================================
 */

import {
  CANONICAL_SCHEMA_VERSION,
  CanonicalProjectType,
  PublicationStatus,
  ProjectProgressDocument,
  PublicProjectProgress,
  PublicRoadmapItem,
  PublicFeatureItem,
  PublicScreenshotItem,
  PublicProgressEvent,
  canTransitionPublication,
} from '../types/portfolioProgress';

import {
  validateProgressMetadata,
  extractPublicProgress,
  migrateLegacyProgressDocument,
  createDefaultProgressDocument,
} from './portfolioMetadataValidator';

// Canonical Project Slugs
export const CANONICAL_PROJECT_SLUGS = [
  'dompetnalar',
  'idle-master',
  'mobile-kasir',
  'idle-mining',
  'the-broken-origin',
  'worklume',
] as const;

export type CanonicalProjectSlug = (typeof CANONICAL_PROJECT_SLUGS)[number];

export function isCanonicalProjectSlug(slug: string): slug is CanonicalProjectSlug {
  return (CANONICAL_PROJECT_SLUGS as readonly string[]).includes(slug.toLowerCase().trim());
}

/**
 * Editorial Audit Log Entry Contract
 */
export interface ProgressAuditEntry {
  readonly id: string;
  readonly timestamp: string; // ISO 8601
  readonly projectSlug: string;
  readonly action: string;
  readonly actorEmail: string;
  readonly clientIpMasked: string;
  readonly result: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  readonly details: Record<string, unknown>;
  readonly errorCode?: string;
}

/**
 * GitHub Sync Status Representation for CMS Admin
 */
export type GitHubSyncStatus =
  | 'NOT_CONNECTED'
  | 'READY'
  | 'SYNCED'
  | 'PENDING'
  | 'FAILED'
  | 'BLOCKED'
  | 'UNVERIFIED';

export interface ProjectSyncInfo {
  readonly projectSlug: string;
  readonly syncStatus: GitHubSyncStatus;
  readonly stage3Condition: string;
  readonly isFrozen: boolean;
  readonly lastSyncAttempt?: string;
  readonly lastSuccessfulSync?: string;
  readonly pendingEventsCount: number;
  readonly requiresEditorialReview: boolean;
  readonly limitationsNotice?: string;
}

/**
 * Baseline Initial Mock/Seed Documents for the 6 Canonical Projects
 */
const initialProgressDocuments: Map<string, ProjectProgressDocument> = new Map();

function seedInitialProgressDocuments(): void {
  // 1. DompetNalar (Application) - Has public roadmap and features from Stage 2 fixtures
  initialProgressDocuments.set('dompetnalar', {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    projectSlug: 'dompetnalar',
    projectName: 'DompetNalar',
    projectType: 'APPLICATION',
    roadmap: [
      {
        id: 'ms_dn_core',
        title: 'Arsitektur Inti & Manajemen Anggaran',
        description: 'Pencatatan transaksi multi-akun offline-first dan kalkulasi anggaran bulanan.',
        priority: 'high',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        targetQuarter: 'Q4 2025',
        order: 1,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'ms_dn_compliance',
        title: 'Google Play Compliance & AdMob app-ads.txt',
        description: 'Integrasi Kebijakan Privasi mandatori, alur hapus akun, dan app-ads.txt AdMob.',
        priority: 'critical',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        targetQuarter: 'Q1 2026',
        order: 2,
        updatedAt: '2026-11-05T00:00:00.000Z',
      },
      {
        id: 'ms_dn_analytics',
        title: 'Grafik Analisis Pengeluaran & Ekspor CSV',
        description: 'Visualisasi tren keuangan dan ekspor laporan ke format spreadsheet.',
        priority: 'medium',
        implementationStatus: 'in_progress',
        publicationStatus: 'draft', // Draft! Must not appear on public page
        targetQuarter: 'Q2 2026',
        order: 3,
        updatedAt: '2026-11-07T00:00:00.000Z',
      },
    ],
    features: [
      {
        id: 'feat_dn_01',
        milestoneId: 'ms_dn_core',
        title: 'Pencatatan Pemasukan & Pengeluaran',
        description: 'Form input cepat dengan kategori kustom dan multi-mata uang lokal.',
        category: 'Core Finance',
        priority: 'high',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        screenshotIds: ['shot_dn_home'],
        order: 1,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'feat_dn_02',
        milestoneId: 'ms_dn_core',
        title: 'Penyimpanan Lokal Terenkripsi (Room DB)',
        description: 'Semua data finansial tersimpan aman di perangkat pengguna tanpa server eksternal.',
        category: 'Storage & Privacy',
        priority: 'high',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        screenshotIds: [],
        order: 2,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'feat_dn_03',
        milestoneId: 'ms_dn_analytics',
        title: 'Laporan Visual Distribusi Pengeluaran',
        description: 'Diagram donat interaktif pengeluaran per kategori bulanan.',
        category: 'Analytics',
        priority: 'medium',
        implementationStatus: 'in_progress',
        publicationStatus: 'draft', // Draft!
        screenshotIds: [],
        order: 3,
        updatedAt: '2026-11-07T00:00:00.000Z',
      },
    ],
    screenshots: [
      {
        id: 'shot_dn_home',
        featureId: 'feat_dn_01',
        caption: 'Tampilan dashboard ringkasan anggaran DompetNalar',
        path: '/assets/projects/dompetnalar/screenshots/1.png',
        publicationStatus: 'public',
        verifiedRealApp: true,
        sanitized: true,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'shot_dn_analytics_draft',
        featureId: 'feat_dn_03',
        caption: 'Mockup diagram analisis pengeluaran (internal draft)',
        path: '/assets/projects/dompetnalar/screenshots/draft-analytics.png',
        publicationStatus: 'draft', // Draft screenshot!
        verifiedRealApp: false,
        sanitized: true,
        updatedAt: '2026-11-07T00:00:00.000Z',
      },
    ],
    events: [
      {
        id: 'evt_dn_compliance_ready',
        eventType: 'milestone_reached',
        title: 'Milestone Kepatuhan Google Play Terpenuhi',
        description: 'Seluruh persyaratan privasi dan kebijakan developer Google Play selesai diverifikasi.',
        timestamp: '2026-11-05T10:00:00.000Z',
        relatedId: 'ms_dn_compliance',
        relatedType: 'milestone',
        publicationStatus: 'public',
      },
      {
        id: 'evt_dn_internal_push',
        eventType: 'general_update',
        title: 'Internal Sync dari Git Push',
        description: 'Pembaruan kode modul analitik dari developer.',
        timestamp: '2026-11-08T09:00:00.000Z',
        publicationStatus: 'draft', // Synced event remains draft until approved
      },
    ],
    updatedAt: '2026-11-08T09:00:00.000Z',
  });

  // 2. IDLE MASTER (Game) - Work in progress
  initialProgressDocuments.set('idle-master', {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    projectSlug: 'idle-master',
    projectName: 'IDLE MASTER',
    projectType: 'GAME',
    roadmap: [
      {
        id: 'ms_im_engine',
        title: 'Prototipe Game Loop & Idle Mechanics',
        description: 'Sistem akumulasi koin offline dan leveling karakter berbasis waktu.',
        priority: 'high',
        implementationStatus: 'in_progress',
        publicationStatus: 'public',
        targetQuarter: 'Q1 2026',
        order: 1,
        updatedAt: '2026-11-05T00:00:00.000Z',
      },
    ],
    features: [
      {
        id: 'feat_im_idle_calc',
        milestoneId: 'ms_im_engine',
        title: 'Offline Progress Calculator',
        description: 'Kalkulasi pendapatan pemain saat aplikasi tidak aktif secara adil.',
        category: 'Game Engine',
        priority: 'high',
        implementationStatus: 'in_progress',
        publicationStatus: 'public',
        order: 1,
        updatedAt: '2026-11-05T00:00:00.000Z',
      },
    ],
    screenshots: [],
    events: [],
    updatedAt: '2026-11-05T00:00:00.000Z',
  });

  // 3. Mobile Kasir (Application) - Closed Testing
  initialProgressDocuments.set('mobile-kasir', {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    projectSlug: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    projectType: 'APPLICATION',
    roadmap: [
      {
        id: 'ms_mk_pos_core',
        title: 'Sistem POS Kasir & Transaksi Cepat',
        description: 'Katalog produk, keranjang belanja, dan cetak struk via thermal printer Bluetooth.',
        priority: 'high',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        targetQuarter: 'Q4 2025',
        order: 1,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'ms_mk_closed_testing',
        title: 'Closed Testing 14 Hari Google Play',
        description: 'Perekrutan dan pengujian tertutup bersama 20+ tester aktif.',
        priority: 'critical',
        implementationStatus: 'in_progress',
        publicationStatus: 'public',
        targetQuarter: 'Q1 2026',
        order: 2,
        updatedAt: '2026-11-07T00:00:00.000Z',
      },
    ],
    features: [
      {
        id: 'feat_mk_pos_01',
        milestoneId: 'ms_mk_pos_core',
        title: 'Cetak Struk Bluetooth Thermal',
        description: 'Koneksi langsung dengan printer kasir portabel 58mm/80mm ESC/POS.',
        category: 'Hardware Integration',
        priority: 'high',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        order: 1,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ],
    screenshots: [],
    events: [],
    updatedAt: '2026-11-07T00:00:00.000Z',
  });

  // 4. Idle Mining (Game)
  initialProgressDocuments.set('idle-mining', createDefaultProgressDocument('idle-mining', 'Idle Mining', 'GAME'));

  // 5. The Broken Origin (TBO ROBLOX - Game, STRICT FREEZE)
  initialProgressDocuments.set('the-broken-origin', createDefaultProgressDocument('the-broken-origin', 'The Broken Origin', 'GAME'));

  // 6. Worklume (Tool / Productivity Website)
  initialProgressDocuments.set('worklume', createDefaultProgressDocument('worklume', 'Worklume', 'TOOL'));
}

seedInitialProgressDocuments();

/**
 * In-memory state storage (decoupled runtime and test isolation)
 */
let activeProgressDocuments: Map<string, ProjectProgressDocument> = new Map(initialProgressDocuments);
const inMemoryAuditLogs: ProgressAuditEntry[] = [];

/**
 * Resets in-memory storage to initial baseline (essential for isolated tests)
 */
export function resetProgressCache(): void {
  seedInitialProgressDocuments();
  activeProgressDocuments = new Map(initialProgressDocuments);
  inMemoryAuditLogs.length = 0;
}

/**
 * Sets raw document in cache (for testing or manual sync)
 */
export function setProgressDocumentCache(slug: string, doc: ProjectProgressDocument): void {
  activeProgressDocuments.set(slug.toLowerCase().trim(), doc);
}

/**
 * Generates an audit record safely (Sanitizes details, zero secrets/passwords/PII)
 */
export function recordProgressAuditLog(entry: {
  projectSlug: string;
  action: string;
  actorEmail?: string;
  clientIpMasked?: string;
  result: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  details: Record<string, unknown>;
  errorCode?: string;
}): ProgressAuditEntry {
  // Strip any accidental sensitive tokens from details
  const cleanDetails: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entry.details)) {
    if (/secret|token|password|auth|credential|key/i.test(k)) {
      cleanDetails[k] = '[REDACTED]';
    } else if (typeof v === 'string' && v.length > 500) {
      cleanDetails[k] = v.slice(0, 500) + '...[TRUNCATED]';
    } else {
      cleanDetails[k] = v;
    }
  }

  const record: ProgressAuditEntry = {
    id: `audit_prog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    projectSlug: entry.projectSlug,
    action: entry.action,
    actorEmail: entry.actorEmail || 'admin:zweifeel@gmail.com',
    clientIpMasked: entry.clientIpMasked || '127.0.0.1',
    result: entry.result,
    details: cleanDetails,
    errorCode: entry.errorCode,
  };

  inMemoryAuditLogs.unshift(record);
  return record;
}

export function getProgressAuditLogs(filterSlug?: string): readonly ProgressAuditEntry[] {
  if (filterSlug) {
    return inMemoryAuditLogs.filter((l) => l.projectSlug.toLowerCase() === filterSlug.toLowerCase());
  }
  return inMemoryAuditLogs;
}

/**
 * Resolves GitHub Sync Information for a project based on Stage 3 & 4 baseline
 */
export function getProjectSyncInfo(slug: string): ProjectSyncInfo {
  const normSlug = slug.toLowerCase().trim();

  if (normSlug === 'the-broken-origin') {
    return {
      projectSlug: normSlug,
      syncStatus: 'BLOCKED',
      stage3Condition: 'STRICT_FREEZE',
      isFrozen: true,
      pendingEventsCount: 0,
      requiresEditorialReview: false,
      limitationsNotice: 'Project komersial The Broken Origin berada dalam status STRICT_FREEZE. Integrasi Git dan webhook diblokir permanen.',
    };
  }

  if (normSlug === 'dompetnalar') {
    return {
      projectSlug: normSlug,
      syncStatus: 'READY',
      stage3Condition: 'VISIBILITY_UNVERIFIED',
      isFrozen: false,
      lastSyncAttempt: '2026-11-08T09:00:00.000Z',
      lastSuccessfulSync: '2026-11-08T09:00:00.000Z',
      pendingEventsCount: 1, // 1 event needs editorial review
      requiresEditorialReview: true,
      limitationsNotice: 'Event GitHub tersinkronkan dengan status DRAFT. Memerlukan peninjauan editorial admin sebelum publikasi.',
    };
  }

  if (normSlug === 'mobile-kasir' || normSlug === 'idle-master' || normSlug === 'worklume') {
    return {
      projectSlug: normSlug,
      syncStatus: 'NOT_CONNECTED',
      stage3Condition: 'MISSING_GIT',
      isFrozen: false,
      pendingEventsCount: 0,
      requiresEditorialReview: false,
      limitationsNotice: 'Repository Git lokal belum diinisialisasi untuk project ini (Prasyarat Stage 3 belum terpenuhi).',
    };
  }

  if (normSlug === 'idle-mining') {
    return {
      projectSlug: normSlug,
      syncStatus: 'NOT_CONNECTED',
      stage3Condition: 'MISSING_REMOTE',
      isFrozen: false,
      pendingEventsCount: 0,
      requiresEditorialReview: false,
      limitationsNotice: 'Remote GitHub belum dikonfigurasi untuk project ini (Prasyarat Stage 3 belum terpenuhi).',
    };
  }

  return {
    projectSlug: normSlug,
    syncStatus: 'UNVERIFIED',
    stage3Condition: 'UNKNOWN_PROJECT',
    isFrozen: false,
    pendingEventsCount: 0,
    requiresEditorialReview: false,
  };
}

// ============================================================================
// 1. PUBLIC PROGRESS READ API (FAIL-CLOSED & WHITELIST PROJECTION ONLY)
// ============================================================================

/**
 * Fetches public progress for a project.
 * STRICT SECURITY INVARIANT:
 * - Guarantees ZERO leakage of draft, review, or hidden items.
 * - Guarantees ZERO internal git branches, commits, secrets, or file paths.
 * - Always returns PublicProjectProgress via extractPublicProgress().
 */
export async function fetchPublicProjectProgress(slug: string): Promise<{
  success: boolean;
  data?: PublicProjectProgress;
  error?: string;
  message?: string;
}> {
  const normSlug = slug.toLowerCase().trim();

  // Try API first if in browser environment
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(normSlug)}/progress`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return { success: true, data: json.data };
        }
      }
    } catch {
      // In local testing or when function backend is mocked, fall back to in-memory projection
    }
  }

  // Fallback to in-memory canonical document with STRICT public projection
  const doc = activeProgressDocuments.get(normSlug);
  if (!doc) {
    return {
      success: false,
      error: 'PROJECT_PROGRESS_NOT_FOUND',
      message: `Metadata progress tidak ditemukan untuk project "${slug}".`,
    };
  }

  // Always project through extractPublicProgress
  const publicProjection = extractPublicProgress(doc);
  return {
    success: true,
    data: publicProjection,
  };
}

// ============================================================================
// 2. ADMIN PROGRESS READ & WRITE API (AUTHENTICATED INTERNAL VIEW)
// ============================================================================

/**
 * Fetches internal progress document for authenticated admin
 */
export async function fetchAdminProjectProgress(slug: string): Promise<{
  success: boolean;
  data?: ProjectProgressDocument;
  error?: string;
  message?: string;
}> {
  const normSlug = slug.toLowerCase().trim();

  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const res = await fetch(`/api/admin/progress/${encodeURIComponent(normSlug)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        credentials: 'same-origin',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return { success: true, data: json.data };
        }
      }
    } catch {
      // Local fallback
    }
  }

  let doc = activeProgressDocuments.get(normSlug);
  if (!doc) {
    // If not existing yet, create default draft document
    const isCanonical = isCanonicalProjectSlug(normSlug);
    if (!isCanonical) {
      return {
        success: false,
        error: 'INVALID_PROJECT_SLUG',
        message: `Project "${slug}" bukan merupakan project terdaftar SleepyKoala.`,
      };
    }

    doc = createDefaultProgressDocument(
      normSlug,
      normSlug === 'the-broken-origin' ? 'The Broken Origin' : normSlug,
      normSlug.includes('mining') || normSlug.includes('master') ? 'GAME' : 'APPLICATION'
    );
    activeProgressDocuments.set(normSlug, doc);
  }

  return {
    success: true,
    data: doc,
  };
}

/**
 * Non-destructive update of progress document by Admin
 */
export async function saveAdminProjectProgress(
  slug: string,
  updatePayload: Partial<ProjectProgressDocument>,
  adminEmail: string = 'zweifeel@gmail.com'
): Promise<{
  success: boolean;
  data?: ProjectProgressDocument;
  error?: string;
  message?: string;
  diagnostics?: readonly unknown[];
}> {
  const normSlug = slug.toLowerCase().trim();

  // Validate slug
  if (!normSlug || !/^[a-z0-9-_]+$/.test(normSlug)) {
    recordProgressAuditLog({
      projectSlug: slug,
      action: 'UPDATE_PROGRESS_DOCUMENT',
      actorEmail: adminEmail,
      result: 'REJECTED',
      details: { reason: 'Invalid project slug format' },
      errorCode: 'INVALID_PROJECT_SLUG',
    });
    return {
      success: false,
      error: 'INVALID_PROJECT_SLUG',
      message: 'Format slug proyek tidak valid.',
    };
  }

  // Prevent modifying TBO if frozen
  if (normSlug === 'the-broken-origin') {
    recordProgressAuditLog({
      projectSlug: normSlug,
      action: 'UPDATE_PROGRESS_DOCUMENT',
      actorEmail: adminEmail,
      result: 'REJECTED',
      details: { reason: 'Attempt to mutate STRICT_FREEZE project' },
      errorCode: 'REPOSITORY_FROZEN',
    });
    return {
      success: false,
      error: 'REPOSITORY_FROZEN',
      message: 'Project The Broken Origin berada dalam status STRICT_FREEZE dan tidak dapat dimodifikasi.',
    };
  }

  // 1. Prohibited keys & sensitive check on raw input payload
  const rawValidation = validateProgressMetadata(updatePayload, { allowLegacyV1: true });
  const criticalErrors = rawValidation.diagnostics.filter(
    (d) => d.code === 'PROHIBITED_KEY_DETECTED' || d.code === 'SENSITIVE_CONTENT_LEAK'
  );
  if (criticalErrors.length > 0) {
    const errorMsgs = criticalErrors.map((e) => e.message);
    recordProgressAuditLog({
      projectSlug: normSlug,
      action: 'VALIDATION_FAILURE',
      actorEmail: adminEmail,
      result: 'FAILURE',
      details: { errors: errorMsgs },
      errorCode: 'PROHIBITED_METADATA_KEY',
    });
    return {
      success: false,
      error: 'SCHEMA_VALIDATION_FAILED',
      message: `Validasi schema gagal: ${errorMsgs.join('; ')}`,
      diagnostics: criticalErrors,
    };
  }

  // Get current existing document (or default)
  const existingDoc = activeProgressDocuments.get(normSlug) || createDefaultProgressDocument(normSlug, normSlug);

  // Migration check: If existing document or update payload has schemaVersion: 1, migrate it non-destructively
  let baseDoc = existingDoc;
  if (baseDoc.schemaVersion === 1 || updatePayload.schemaVersion === 1) {
    const migration = migrateLegacyProgressDocument(baseDoc);
    if (migration.success && migration.migratedDoc) {
      baseDoc = migration.migratedDoc;
    }
  }

  // Non-destructive merge: Only replace provided arrays/fields; preserve everything else
  const mergedCandidate: ProjectProgressDocument = {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    projectSlug: normSlug,
    projectName: updatePayload.projectName || baseDoc.projectName,
    projectType: (updatePayload.projectType as CanonicalProjectType) || baseDoc.projectType || 'APPLICATION',
    roadmap: updatePayload.roadmap !== undefined ? updatePayload.roadmap : baseDoc.roadmap,
    features: updatePayload.features !== undefined ? updatePayload.features : baseDoc.features,
    screenshots: updatePayload.screenshots !== undefined ? updatePayload.screenshots : baseDoc.screenshots,
    events: updatePayload.events !== undefined ? updatePayload.events : (baseDoc.events || []),
    updatedAt: new Date().toISOString(),
  };

  // Run full validation & security checks
  const validation = validateProgressMetadata(mergedCandidate);
  if (!validation.valid || !validation.sanitizedDoc) {
    recordProgressAuditLog({
      projectSlug: normSlug,
      action: 'VALIDATION_FAILURE',
      actorEmail: adminEmail,
      result: 'FAILURE',
      details: { errors: validation.errors, warnings: validation.warnings },
      errorCode: 'SCHEMA_VALIDATION_FAILED',
    });
    return {
      success: false,
      error: 'SCHEMA_VALIDATION_FAILED',
      message: `Validasi schema gagal: ${validation.errors.join('; ')}`,
      diagnostics: validation.diagnostics,
    };
  }

  // Save sanitized document in active cache
  activeProgressDocuments.set(normSlug, validation.sanitizedDoc);

  recordProgressAuditLog({
    projectSlug: normSlug,
    action: 'UPDATE_PROGRESS_DOCUMENT',
    actorEmail: adminEmail,
    result: 'SUCCESS',
    details: {
      milestoneCount: validation.sanitizedDoc.roadmap.length,
      featureCount: validation.sanitizedDoc.features.length,
      screenshotCount: validation.sanitizedDoc.screenshots.length,
      eventCount: (validation.sanitizedDoc.events || []).length,
      updatedAt: validation.sanitizedDoc.updatedAt,
    },
  });

  return {
    success: true,
    data: validation.sanitizedDoc,
    message: 'Metadata progress proyek berhasil disimpan.',
  };
}

// ============================================================================
// 3. EDITORIAL TRANSITION & WORKFLOW CONTROLLER
// ============================================================================

export type ProgressItemType = 'milestone' | 'roadmap' | 'feature' | 'screenshot' | 'event';

/**
 * Transitions publication status of a specific item or entire progress document
 * Enforces editorial state machine: draft -> review -> public -> hidden / draft
 */
export async function transitionItemPublicationStatus(params: {
  projectSlug: string;
  itemType: ProgressItemType;
  itemId: string;
  targetStatus: PublicationStatus;
  adminEmail?: string;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  previousStatus?: PublicationStatus;
  newStatus?: PublicationStatus;
}> {
  const normSlug = params.projectSlug.toLowerCase().trim();
  const actorEmail = params.adminEmail || 'zweifeel@gmail.com';

  if (normSlug === 'the-broken-origin') {
    return {
      success: false,
      error: 'REPOSITORY_FROZEN',
      message: 'Project The Broken Origin berada dalam status STRICT_FREEZE.',
    };
  }

  const doc = activeProgressDocuments.get(normSlug);
  if (!doc) {
    return {
      success: false,
      error: 'PROJECT_PROGRESS_NOT_FOUND',
      message: `Dokumen progress tidak ditemukan untuk "${params.projectSlug}".`,
    };
  }

  let currentStatus: PublicationStatus = 'draft';
  let found = false;

  let newRoadmap = [...doc.roadmap];
  let newFeatures = [...doc.features];
  let newScreenshots = [...doc.screenshots];
  let newEvents = [...(doc.events || [])];

  const now = new Date().toISOString();

  if (params.itemType === 'milestone' || params.itemType === 'roadmap') {
    newRoadmap = doc.roadmap.map((m) => {
      if (m.id === params.itemId) {
        found = true;
        currentStatus = m.publicationStatus;
        return { ...m, publicationStatus: params.targetStatus, updatedAt: now };
      }
      return m;
    });
  } else if (params.itemType === 'feature') {
    newFeatures = doc.features.map((f) => {
      if (f.id === params.itemId) {
        found = true;
        currentStatus = f.publicationStatus;
        return { ...f, publicationStatus: params.targetStatus, updatedAt: now };
      }
      return f;
    });
  } else if (params.itemType === 'screenshot') {
    newScreenshots = doc.screenshots.map((s) => {
      if (s.id === params.itemId) {
        found = true;
        currentStatus = s.publicationStatus;
        return { ...s, publicationStatus: params.targetStatus, updatedAt: now };
      }
      return s;
    });
  } else if (params.itemType === 'event') {
    newEvents = (doc.events || []).map((e) => {
      if (e.id === params.itemId) {
        found = true;
        currentStatus = e.publicationStatus;
        return { ...e, publicationStatus: params.targetStatus };
      }
      return e;
    });
  }

  if (!found) {
    return {
      success: false,
      error: 'ITEM_NOT_FOUND',
      message: `Item "${params.itemId}" bertipe "${params.itemType}" tidak ditemukan.`,
    };
  }

  // Validate editorial transition rule
  const transitionCheck = canTransitionPublication(currentStatus, params.targetStatus);
  if (!transitionCheck.allowed) {
    recordProgressAuditLog({
      projectSlug: normSlug,
      action: 'INVALID_TRANSITION',
      actorEmail,
      result: 'REJECTED',
      details: {
        itemType: params.itemType,
        itemId: params.itemId,
        from: currentStatus,
        to: params.targetStatus,
        reason: transitionCheck.reason,
      },
      errorCode: 'INVALID_EDITORIAL_TRANSITION',
    });
    return {
      success: false,
      error: 'INVALID_EDITORIAL_TRANSITION',
      message: transitionCheck.reason || 'Transisi status editorial tidak sah.',
    };
  }

  // If publishing a screenshot, verify real app & sanitized invariants
  if (params.itemType === 'screenshot' && params.targetStatus === 'public') {
    const targetShot = newScreenshots.find((s) => s.id === params.itemId);
    if (!targetShot || !targetShot.verifiedRealApp || !targetShot.sanitized) {
      recordProgressAuditLog({
        projectSlug: normSlug,
        action: 'PUBLISH_SCREENSHOT_REJECTED',
        actorEmail,
        result: 'REJECTED',
        details: {
          itemId: params.itemId,
          verifiedRealApp: targetShot?.verifiedRealApp,
          sanitized: targetShot?.sanitized,
        },
        errorCode: 'UNVERIFIED_SCREENSHOT',
      });
      return {
        success: false,
        error: 'UNVERIFIED_SCREENSHOT',
        message: 'Screenshot hanya dapat dipublikasikan jika sudah diverifikasi dari build asli (verifiedRealApp) dan bersih dari PII (sanitized).',
      };
    }
  }

  // Apply update to active document
  const updatedDoc: ProjectProgressDocument = {
    ...doc,
    roadmap: newRoadmap,
    features: newFeatures,
    screenshots: newScreenshots,
    events: newEvents,
    updatedAt: now,
  };

  activeProgressDocuments.set(normSlug, updatedDoc);

  // Determine audit action label
  let auditAction = 'UPDATE_ITEM_STATUS';
  if (params.targetStatus === 'review') auditAction = 'SUBMIT_FOR_REVIEW';
  if (params.targetStatus === 'public') auditAction = 'APPROVE_PUBLICATION';
  if (params.targetStatus === 'hidden') auditAction = 'HIDE_ITEM';
  if ((currentStatus as PublicationStatus) === 'public' && params.targetStatus === 'draft') auditAction = 'UNPUBLISH_ITEM';

  recordProgressAuditLog({
    projectSlug: normSlug,
    action: auditAction,
    actorEmail,
    result: 'SUCCESS',
    details: {
      itemType: params.itemType,
      itemId: params.itemId,
      from: currentStatus,
      to: params.targetStatus,
    },
  });

  return {
    success: true,
    previousStatus: currentStatus,
    newStatus: params.targetStatus,
    message: `Status publikasi item "${params.itemId}" berhasil diubah menjadi "${params.targetStatus}".`,
  };
}

// ============================================================================
// 4. PROTECTED PREVIEW PROJECTION (ADMIN ONLY)
// ============================================================================

/**
 * Generates preview projection for authenticated admin.
 * Formats all items (including draft & review) into public projection shape,
 * but marks isPreview: true and excludes hidden items.
 */
export async function fetchAdminProgressPreview(slug: string): Promise<{
  success: boolean;
  data?: PublicProjectProgress & { isPreview: true };
  error?: string;
  message?: string;
}> {
  const normSlug = slug.toLowerCase().trim();
  const doc = activeProgressDocuments.get(normSlug);

  if (!doc) {
    return {
      success: false,
      error: 'PROJECT_PROGRESS_NOT_FOUND',
      message: `Metadata progress tidak ditemukan untuk "${slug}".`,
    };
  }

  // Preview projection: includes public, review, and draft items (EXCLUDES hidden items)
  // Maps them into the same shape as PublicProjectProgress
  const previewRoadmap: PublicRoadmapItem[] = doc.roadmap
    .filter((m) => m.publicationStatus !== 'hidden')
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      priority: m.priority,
      implementationStatus: m.implementationStatus,
      targetQuarter: m.targetQuarter,
      targetDate: m.targetDate,
      completedAt: m.completedAt,
      order: m.order,
      updatedAt: m.updatedAt,
    }));

  const previewFeatures: PublicFeatureItem[] = doc.features
    .filter((f) => f.publicationStatus !== 'hidden')
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      id: f.id,
      milestoneId: f.milestoneId,
      title: f.title,
      description: f.description,
      priority: f.priority,
      category: f.category,
      implementationStatus: f.implementationStatus,
      releaseVersion: f.releaseVersion,
      screenshotIds: f.screenshotIds ? [...f.screenshotIds] : [],
      order: f.order,
      completedAt: f.completedAt,
      updatedAt: f.updatedAt,
    }));

  const previewScreenshots: PublicScreenshotItem[] = doc.screenshots
    .filter((s) => s.publicationStatus !== 'hidden')
    .map((s) => ({
      id: s.id,
      featureId: s.featureId,
      caption: s.caption,
      path: s.path,
      updatedAt: s.updatedAt,
    }));

  const previewEvents: PublicProgressEvent[] = (doc.events || [])
    .filter((e) => e.publicationStatus !== 'hidden')
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((e) => ({
      id: e.id,
      eventType: e.eventType,
      title: e.title,
      description: e.description,
      timestamp: e.timestamp,
      relatedId: e.relatedId,
      relatedType: e.relatedType,
    }));

  return {
    success: true,
    data: {
      schemaVersion: doc.schemaVersion,
      projectSlug: doc.projectSlug,
      projectName: doc.projectName,
      projectType: doc.projectType,
      roadmap: previewRoadmap,
      features: previewFeatures,
      screenshots: previewScreenshots,
      events: previewEvents,
      lastPublicUpdate: doc.updatedAt,
      isPreview: true,
    },
  };
}
