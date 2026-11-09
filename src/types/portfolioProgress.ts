/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PORTFOLIO PROGRESS METADATA SCHEMA (STAGE 2)
 * 
 * Single Source of Truth for:
 * - Development progress & lifecycle tracking
 * - Strategic Roadmap & Milestones
 * - Feature specifications & categorization
 * - Verified screenshot attachments
 * - Structured changelog / progress events
 * - Strict separation between Implementation & Publication lifecycles
 * - Fail-closed whitelist public projection (Zero secret or internal data leaks)
 * ============================================================================
 */

/**
 * Canonical Schema Version
 */
export const CANONICAL_SCHEMA_VERSION = 2;
export const PROGRESS_SCHEMA_VERSION = 2;
export const SUPPORTED_SCHEMA_VERSIONS = [1, 2] as const;
export type SupportedSchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number];

/**
 * Universal Project Types (Extensible across applications, games, websites, tools)
 */
export type CanonicalProjectType =
  | 'APPLICATION'
  | 'GAME'
  | 'WEBSITE'
  | 'TOOL'
  | 'OTHER';

export const VALID_PROJECT_TYPES: readonly CanonicalProjectType[] = [
  'APPLICATION',
  'GAME',
  'WEBSITE',
  'TOOL',
  'OTHER',
] as const;

/**
 * Implementation Status (Development Lifecycle)
 * Strict requirement: Represents engineering stage, NEVER visibility.
 */
export type ImplementationStatus =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export const VALID_IMPLEMENTATION_STATUSES: readonly ImplementationStatus[] = [
  'not_started',
  'planned',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
] as const;

/**
 * Legacy Implementation Status (v1 compatibility alias: 'on_hold' -> 'blocked')
 */
export type LegacyImplementationStatus = ImplementationStatus | 'on_hold';

/**
 * Publication Status (Visibility on Public Portfolio)
 * Strict requirement: Completely decoupled from implementationStatus.
 * - 'draft'   : Default for all new items. Visible ONLY to admin/internal.
 * - 'review'  : Staged for editorial/compliance review before publication.
 * - 'public'  : Explicitly approved and visible on public portfolio.
 * - 'hidden'  : Revoked or archived; immediately purged from public views.
 */
export type PublicationStatus = 'draft' | 'review' | 'public' | 'hidden';

export const VALID_PUBLICATION_STATUSES: readonly PublicationStatus[] = [
  'draft',
  'review',
  'public',
  'hidden',
] as const;

/**
 * Item Priority Levels
 */
export type ItemPriority = 'low' | 'medium' | 'high' | 'critical';

export const VALID_ITEM_PRIORITIES: readonly ItemPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

/**
 * Progress Event Types (Changelog / Activity Stream)
 */
export type ProgressEventType =
  | 'milestone_reached'
  | 'feature_released'
  | 'status_changed'
  | 'general_update'
  | 'security_fix';

export const VALID_EVENT_TYPES: readonly ProgressEventType[] = [
  'milestone_reached',
  'feature_released',
  'status_changed',
  'general_update',
  'security_fix',
] as const;

/**
 * Roadmap Milestone Item (Internal Contract)
 */
export interface RoadmapMilestone {
  readonly id: string; // Stable ID, e.g. "ms_dn_core"
  readonly title: string;
  readonly description: string;
  readonly priority?: ItemPriority;
  readonly implementationStatus: ImplementationStatus;
  readonly publicationStatus: PublicationStatus; // Default: 'draft'
  readonly targetQuarter?: string; // e.g. "Q1 2026"
  readonly targetDate?: string; // ISO 8601 (YYYY-MM-DD)
  readonly completedAt?: string; // ISO 8601
  readonly order: number;
  readonly updatedAt: string; // ISO 8601
  readonly createdAt?: string; // ISO 8601
}

/**
 * Feature Progress Item (Internal Contract)
 */
export interface FeatureItem {
  readonly id: string; // Stable ID, e.g. "feat_offline_budgeting"
  readonly milestoneId?: string; // Associated roadmap milestone ID
  readonly title: string;
  readonly description: string;
  readonly priority?: ItemPriority;
  readonly category?: string; // e.g. "Core Engine", "UI", "Storage"
  readonly implementationStatus: ImplementationStatus;
  readonly publicationStatus: PublicationStatus; // Default: 'draft'
  readonly releaseVersion?: string; // e.g. "1.2.0"
  readonly screenshotIds?: readonly string[];
  readonly order: number;
  readonly completedAt?: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
  readonly createdAt?: string; // ISO 8601
}

/**
 * Screenshot Reference Item (Internal Contract)
 * STRICT RULE: Screenshot default 'draft'.
 * Must originate from genuine build/application, not mockups.
 */
export interface ProgressScreenshot {
  readonly id: string; // Stable ID, e.g. "shot_budget_summary"
  readonly featureId?: string; // Associated feature ID
  readonly caption: string;
  readonly path: string; // Relative path in repo or mediaId
  readonly publicationStatus: PublicationStatus; // Default: 'draft'
  readonly verifiedRealApp: boolean; // Confirms captured from actual build
  readonly sanitized: boolean; // Confirms free from PII, notifications, tokens
  readonly updatedAt: string; // ISO 8601
  readonly createdAt?: string; // ISO 8601
}

/**
 * Progress Event Item (Internal Changelog Contract)
 */
export interface ProgressEvent {
  readonly id: string; // Stable ID, e.g. "evt_20261108_v1_release"
  readonly eventType: ProgressEventType;
  readonly title: string;
  readonly description: string;
  readonly timestamp: string; // ISO 8601
  readonly relatedId?: string; // Related milestone or feature ID
  readonly relatedType?: 'milestone' | 'feature';
  readonly publicationStatus: PublicationStatus; // Default: 'draft'
}

/**
 * Complete Project Progress Document (Repo metadata / Source of Truth)
 * File: docs/portfolio/roadmap.json and features.json
 */
export interface ProjectProgressDocument {
  readonly schemaVersion: number; // 2 (canonical) or 1 (legacy compatible)
  readonly projectSlug: string; // Stable slug, e.g. "dompetnalar"
  readonly projectName: string;
  readonly projectType?: CanonicalProjectType;
  readonly shortDescription?: string;
  readonly publicDescription?: string;
  readonly version?: string;
  readonly roadmap: readonly RoadmapMilestone[];
  readonly features: readonly FeatureItem[];
  readonly screenshots: readonly ProgressScreenshot[];
  readonly events?: readonly ProgressEvent[];
  readonly updatedAt: string; // ISO 8601
  readonly createdAt?: string; // ISO 8601
  readonly metadataExtras?: Readonly<Record<string, unknown>>; // Preserved legacy fields
}

/**
 * Public Sanitized Projection Items
 * Whitelisted fields only — publicationStatus and internal metadata are completely omitted.
 */
export interface PublicRoadmapItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority?: ItemPriority;
  readonly implementationStatus: ImplementationStatus;
  readonly targetQuarter?: string;
  readonly targetDate?: string;
  readonly completedAt?: string;
  readonly order: number;
  readonly updatedAt: string;
}

export interface PublicFeatureItem {
  readonly id: string;
  readonly milestoneId?: string;
  readonly title: string;
  readonly description: string;
  readonly priority?: ItemPriority;
  readonly category?: string;
  readonly implementationStatus: ImplementationStatus;
  readonly releaseVersion?: string;
  readonly screenshotIds?: readonly string[];
  readonly order: number;
  readonly completedAt?: string;
  readonly updatedAt: string;
}

export interface PublicScreenshotItem {
  readonly id: string;
  readonly featureId?: string;
  readonly caption: string;
  readonly path: string;
  readonly updatedAt: string;
}

export interface PublicProgressEvent {
  readonly id: string;
  readonly eventType: ProgressEventType;
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly relatedId?: string;
  readonly relatedType?: 'milestone' | 'feature';
}

/**
 * Public Sanitized Progress View (Served to Public Portfolio)
 * STRICT RULE: Contains ONLY items where publicationStatus === 'public'.
 * For screenshots: requires publicationStatus === 'public' && verifiedRealApp && sanitized.
 */
export interface PublicProjectProgress {
  readonly schemaVersion: number;
  readonly projectSlug: string;
  readonly projectName: string;
  readonly projectType?: CanonicalProjectType;
  readonly shortDescription?: string;
  readonly publicDescription?: string;
  readonly version?: string;
  readonly roadmap: readonly PublicRoadmapItem[];
  readonly features: readonly PublicFeatureItem[];
  readonly screenshots: readonly PublicScreenshotItem[];
  readonly events: readonly PublicProgressEvent[];
  readonly lastPublicUpdate: string;
}

/**
 * Prohibited keys that must NEVER appear in progress metadata
 */
export const PROHIBITED_METADATA_KEYS = [
  'branch',
  'commit',
  'commithash',
  'hash',
  'sourcecode',
  'token',
  'secret',
  'apikey',
  'password',
  'server',
  'serverprovider',
  'endpoint',
  'internalurl',
  'ipaddress',
  'authoremail',
  'keystore',
  'privatekey',
  'credential',
  'privatekeypass',
  'accesstoken',
  'sessionsecret',
] as const;

/**
 * Status Transition Result
 */
export interface TransitionResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

/**
 * Validates Implementation Status Transition according to state machine rules.
 */
export function canTransitionImplementation(
  from: ImplementationStatus | 'on_hold',
  to: ImplementationStatus
): TransitionResult {
  // Normalize legacy on_hold
  const normalizedFrom: ImplementationStatus = from === 'on_hold' ? 'blocked' : from;

  if (normalizedFrom === to) {
    return { allowed: true };
  }

  const allowedMap: Record<ImplementationStatus, readonly ImplementationStatus[]> = {
    not_started: ['planned', 'cancelled'],
    planned: ['in_progress', 'blocked', 'cancelled'],
    in_progress: ['completed', 'blocked', 'cancelled', 'planned'],
    blocked: ['in_progress', 'planned', 'cancelled'],
    completed: ['in_progress', 'cancelled'], // Allow rework or retrospective cancellation
    cancelled: ['planned', 'not_started'], // Reactivation
  };

  const targets = allowedMap[normalizedFrom] || [];
  if (targets.includes(to)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Transisi status implementasi tidak sah dari "${normalizedFrom}" ke "${to}". Transisi yang diizinkan: ${targets.join(', ') || 'tidak ada'}.`,
  };
}

/**
 * Validates Publication Status Transition according to strict editorial lifecycle rules.
 */
export function canTransitionPublication(
  from: PublicationStatus,
  to: PublicationStatus,
  _context?: { isCompleted?: boolean }
): TransitionResult {
  if (from === to) {
    return { allowed: true };
  }

  const allowedMap: Record<PublicationStatus, readonly PublicationStatus[]> = {
    draft: ['review', 'hidden'],
    review: ['public', 'draft', 'hidden'],
    public: ['hidden', 'draft'],
    hidden: ['draft', 'review'],
  };

  // Special editorial rule: draft cannot jump directly to public without review
  if (from === 'draft' && to === 'public') {
    return {
      allowed: false,
      reason: 'Item berstatus "draft" harus melalui status "review" sebelum dipublikasikan ke "public".',
    };
  }

  const targets = allowedMap[from] || [];
  if (!targets.includes(to)) {
    return {
      allowed: false,
      reason: `Transisi status publikasi tidak sah dari "${from}" ke "${to}". Transisi yang diizinkan: ${targets.join(', ')}.`,
    };
  }

  return { allowed: true };
}
