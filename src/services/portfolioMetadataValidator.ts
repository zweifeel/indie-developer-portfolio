/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PORTFOLIO PROGRESS METADATA VALIDATOR (STAGE 2)
 * 
 * Strict Schema Validation, Security Key Sanitization, Relational Integrity,
 * Status Transition Enforcement, and Fail-Closed Whitelist Projection
 * ============================================================================
 */

import {
  CANONICAL_SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  VALID_IMPLEMENTATION_STATUSES,
  VALID_PUBLICATION_STATUSES,
  VALID_ITEM_PRIORITIES,
  VALID_PROJECT_TYPES,
  VALID_EVENT_TYPES,
  PROHIBITED_METADATA_KEYS,
  ProjectProgressDocument,
  PublicProjectProgress,
  PublicRoadmapItem,
  PublicFeatureItem,
  PublicScreenshotItem,
  PublicProgressEvent,
  RoadmapMilestone,
  FeatureItem,
  ProgressScreenshot,
  ProgressEvent,
  CanonicalProjectType,
  ImplementationStatus,
  PublicationStatus,
} from '../types/portfolioProgress';

export interface DiagnosticItem {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly diagnostics: readonly DiagnosticItem[];
  readonly sanitizedDoc?: ProjectProgressDocument;
}

export interface MigrationResult {
  readonly success: boolean;
  readonly migratedDoc?: ProjectProgressDocument;
  readonly warnings: readonly string[];
  readonly preservedLegacyFields: readonly string[];
}

/**
 * Regex patterns for secret detection inside string values
 */
const SENSITIVE_PATTERNS: ReadonlyArray<{ name: string; regex: RegExp }> = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/ },
  { name: 'AWS Access Key', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Generic Password Pattern', regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/i },
  { name: 'Private/Internal Endpoint', regex: /https?:\/\/(?:internal|localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)/i },
  { name: 'Private Email Address', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/ },
  { name: 'Indonesian Phone Number', regex: /(?:\+62|62|08)[2-9][0-9]{7,11}\b/ },
];

/**
 * Recursively inspects an object for forbidden internal/sensitive keys.
 */
function checkForProhibitedKeys(obj: unknown, path: string = ''): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];
  if (!obj || typeof obj !== 'object') return diagnostics;

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
    const currentPath = path ? `${path}.${key}` : key;

    if (PROHIBITED_METADATA_KEYS.some((pk) => lowerKey === pk || lowerKey.includes(pk))) {
      diagnostics.push({
        code: 'PROHIBITED_KEY_DETECTED',
        message: `Prohibited sensitive key detected in metadata: "${currentPath}"`,
        path: currentPath,
        severity: 'error',
      });
    }

    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null) {
      diagnostics.push(...checkForProhibitedKeys(val, currentPath));
    }
  }

  return diagnostics;
}

/**
 * Recursively scans string values for secret tokens and sensitive PII.
 */
function checkForSensitiveContent(obj: unknown, path: string = ''): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];
  if (!obj) return diagnostics;

  if (typeof obj === 'string') {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.regex.test(obj)) {
        diagnostics.push({
          code: 'SENSITIVE_CONTENT_LEAK',
          message: `Sensitive content pattern (${pattern.name}) detected at "${path}".`,
          path,
          severity: 'error',
        });
      }
    }
    return diagnostics;
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      diagnostics.push(...checkForSensitiveContent((obj as Record<string, unknown>)[key], currentPath));
    }
  }

  return diagnostics;
}

/**
 * Helper to validate ISO 8601 date strings
 */
function isValidIsoDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string' || dateStr.trim().length === 0) return false;
  const timestamp = Date.parse(dateStr);
  return !Number.isNaN(timestamp);
}

/**
 * Helper to validate stable identifiers
 */
const STABLE_ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;
function isValidIdentifier(id: string): boolean {
  return typeof id === 'string' && STABLE_ID_REGEX.test(id);
}

/**
 * Validates a progress metadata document against the strict canonical schema (v2)
 * with backward compatibility support for legacy schema v1.
 */
export function validateProgressMetadata(
  data: unknown,
  options: { allowLegacyV1?: boolean } = { allowLegacyV1: true }
): ValidationResult {
  const diagnostics: DiagnosticItem[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Metadata payload must be a non-empty JSON object.'],
      warnings: [],
      diagnostics: [
        {
          code: 'INVALID_PAYLOAD',
          message: 'Metadata payload must be a non-empty JSON object.',
          path: 'root',
          severity: 'error',
        },
      ],
    };
  }

  const doc = data as Record<string, any>;

  // 1. Prohibited keys security check
  diagnostics.push(...checkForProhibitedKeys(doc));

  // 2. Sensitive content pattern check
  diagnostics.push(...checkForSensitiveContent(doc));

  // 3. Validate schemaVersion
  if (typeof doc.schemaVersion !== 'number' || !SUPPORTED_SCHEMA_VERSIONS.includes(doc.schemaVersion as any)) {
    diagnostics.push({
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      message: `Unsupported schemaVersion: ${doc.schemaVersion}. Expected version ${SUPPORTED_SCHEMA_VERSIONS.join(' or ')}.`,
      path: 'schemaVersion',
      severity: 'error',
    });
  } else if (doc.schemaVersion === 1) {
    if (options.allowLegacyV1 === false) {
      diagnostics.push({
        code: 'UNSUPPORTED_SCHEMA_VERSION',
        message: 'Legacy schemaVersion 1 is not permitted when strict canonical v2 is enforced.',
        path: 'schemaVersion',
        severity: 'error',
      });
    } else {
      diagnostics.push({
        code: 'LEGACY_SCHEMA_VERSION',
        message: 'Legacy schemaVersion 1 detected. Automatic migration to canonical version 2 is recommended.',
        path: 'schemaVersion',
        severity: 'warning',
      });
    }
  }

  // 4. Validate projectSlug & projectName
  if (!doc.projectSlug || typeof doc.projectSlug !== 'string' || !/^[a-z0-9-_]+$/.test(doc.projectSlug)) {
    diagnostics.push({
      code: 'INVALID_REQUIRED_FIELD',
      message: 'Field "projectSlug" is required and must be lowercase alphanumeric with hyphens.',
      path: 'projectSlug',
      severity: 'error',
    });
  }

  if (!doc.projectName || typeof doc.projectName !== 'string' || doc.projectName.trim().length === 0) {
    diagnostics.push({
      code: 'INVALID_REQUIRED_FIELD',
      message: 'Field "projectName" is required.',
      path: 'projectName',
      severity: 'error',
    });
  }

  // Validate projectType if present
  let validatedProjectType: CanonicalProjectType | undefined = undefined;
  if (doc.projectType !== undefined) {
    if (!VALID_PROJECT_TYPES.includes(doc.projectType)) {
      diagnostics.push({
        code: 'INVALID_PROJECT_TYPE',
        message: `Field "projectType" has invalid value "${doc.projectType}". Valid values: ${VALID_PROJECT_TYPES.join(', ')}.`,
        path: 'projectType',
        severity: 'error',
      });
    } else {
      validatedProjectType = doc.projectType;
    }
  }

  // 5. Global Identifier uniqueness registry
  const seenIds = new Set<string>();

  // 6. Validate Roadmap
  const validatedRoadmap: RoadmapMilestone[] = [];
  const roadmapIdSet = new Set<string>();

  if (doc.roadmap !== undefined) {
    if (!Array.isArray(doc.roadmap)) {
      diagnostics.push({
        code: 'INVALID_FIELD_TYPE',
        message: 'Field "roadmap" must be an array.',
        path: 'roadmap',
        severity: 'error',
      });
    } else {
      doc.roadmap.forEach((item: any, idx: number) => {
        const itemPath = `roadmap[${idx}]`;

        if (!item.id || typeof item.id !== 'string') {
          diagnostics.push({
            code: 'INVALID_IDENTIFIER',
            message: `${itemPath}: missing or invalid "id"`,
            path: `${itemPath}.id`,
            severity: 'error',
          });
        } else {
          if (!isValidIdentifier(item.id)) {
            diagnostics.push({
              code: 'INVALID_IDENTIFIER_FORMAT',
              message: `${itemPath}: identifier "${item.id}" must be 3-64 characters (alphanumeric, dash, underscore).`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          if (roadmapIdSet.has(item.id) || seenIds.has(item.id)) {
            diagnostics.push({
              code: 'DUPLICATE_IDENTIFIER',
              message: `${itemPath}: duplicate identifier "${item.id}".`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          roadmapIdSet.add(item.id);
          seenIds.add(item.id);
        }

        if (!item.title || typeof item.title !== 'string') {
          diagnostics.push({
            code: 'INVALID_REQUIRED_FIELD',
            message: `${itemPath}: missing or invalid "title"`,
            path: `${itemPath}.title`,
            severity: 'error',
          });
        }

        // Implementation Status (support legacy on_hold -> blocked)
        let impStatus: ImplementationStatus = item.implementationStatus;
        if (item.implementationStatus === 'on_hold') {
          impStatus = 'blocked';
          diagnostics.push({
            code: 'LEGACY_STATUS_MAPPED',
            message: `${itemPath}: legacy status "on_hold" mapped to canonical "blocked".`,
            path: `${itemPath}.implementationStatus`,
            severity: 'warning',
          });
        } else if (!VALID_IMPLEMENTATION_STATUSES.includes(item.implementationStatus)) {
          diagnostics.push({
            code: 'INVALID_IMPLEMENTATION_STATUS',
            message: `${itemPath}: invalid implementationStatus "${item.implementationStatus}". Valid: ${VALID_IMPLEMENTATION_STATUSES.join(', ')}`,
            path: `${itemPath}.implementationStatus`,
            severity: 'error',
          });
        }

        // Publication Status (defaults to 'draft')
        const pubStatus: PublicationStatus = item.publicationStatus || 'draft';
        if (!VALID_PUBLICATION_STATUSES.includes(pubStatus)) {
          diagnostics.push({
            code: 'INVALID_PUBLICATION_STATUS',
            message: `${itemPath}: invalid publicationStatus "${pubStatus}". Valid: ${VALID_PUBLICATION_STATUSES.join(', ')}`,
            path: `${itemPath}.publicationStatus`,
            severity: 'error',
          });
        }

        // Priority validation
        if (item.priority !== undefined && !VALID_ITEM_PRIORITIES.includes(item.priority)) {
          diagnostics.push({
            code: 'INVALID_PRIORITY',
            message: `${itemPath}: invalid priority "${item.priority}". Valid: ${VALID_ITEM_PRIORITIES.join(', ')}`,
            path: `${itemPath}.priority`,
            severity: 'error',
          });
        }

        // Timestamps validation
        if (item.updatedAt && !isValidIsoDate(item.updatedAt)) {
          diagnostics.push({
            code: 'INVALID_TIMESTAMP',
            message: `${itemPath}: "updatedAt" must be a valid ISO 8601 date string.`,
            path: `${itemPath}.updatedAt`,
            severity: 'error',
          });
        }
        if (item.completedAt && !isValidIsoDate(item.completedAt)) {
          diagnostics.push({
            code: 'INVALID_TIMESTAMP',
            message: `${itemPath}: "completedAt" must be a valid ISO 8601 date string.`,
            path: `${itemPath}.completedAt`,
            severity: 'error',
          });
        }

        validatedRoadmap.push({
          id: String(item.id || `ms_${idx + 1}`),
          title: String(item.title || ''),
          description: String(item.description || ''),
          priority: item.priority,
          implementationStatus: impStatus || 'planned',
          publicationStatus: pubStatus,
          targetQuarter: item.targetQuarter ? String(item.targetQuarter) : undefined,
          targetDate: item.targetDate ? String(item.targetDate) : undefined,
          completedAt: item.completedAt ? String(item.completedAt) : undefined,
          order: typeof item.order === 'number' ? item.order : idx + 1,
          updatedAt: item.updatedAt && isValidIsoDate(item.updatedAt) ? item.updatedAt : new Date().toISOString(),
          createdAt: item.createdAt ? String(item.createdAt) : undefined,
        });
      });
    }
  }

  // 7. Validate Features
  const validatedFeatures: FeatureItem[] = [];
  const featureIdSet = new Set<string>();

  if (doc.features !== undefined) {
    if (!Array.isArray(doc.features)) {
      diagnostics.push({
        code: 'INVALID_FIELD_TYPE',
        message: 'Field "features" must be an array.',
        path: 'features',
        severity: 'error',
      });
    } else {
      doc.features.forEach((item: any, idx: number) => {
        const itemPath = `features[${idx}]`;

        if (!item.id || typeof item.id !== 'string') {
          diagnostics.push({
            code: 'INVALID_IDENTIFIER',
            message: `${itemPath}: missing or invalid "id"`,
            path: `${itemPath}.id`,
            severity: 'error',
          });
        } else {
          if (!isValidIdentifier(item.id)) {
            diagnostics.push({
              code: 'INVALID_IDENTIFIER_FORMAT',
              message: `${itemPath}: identifier "${item.id}" must be 3-64 characters (alphanumeric, dash, underscore).`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          if (featureIdSet.has(item.id) || seenIds.has(item.id)) {
            diagnostics.push({
              code: 'DUPLICATE_IDENTIFIER',
              message: `${itemPath}: duplicate identifier "${item.id}".`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          featureIdSet.add(item.id);
          seenIds.add(item.id);
        }

        // Relational check: milestoneId must exist in roadmap if roadmap is provided
        if (item.milestoneId !== undefined) {
          if (typeof item.milestoneId !== 'string' || !isValidIdentifier(item.milestoneId)) {
            diagnostics.push({
              code: 'INVALID_IDENTIFIER_FORMAT',
              message: `${itemPath}: milestoneId "${item.milestoneId}" is invalid.`,
              path: `${itemPath}.milestoneId`,
              severity: 'error',
            });
          } else if (roadmapIdSet.size > 0 && !roadmapIdSet.has(item.milestoneId)) {
            diagnostics.push({
              code: 'BROKEN_RELATIONSHIP',
              message: `${itemPath}: referenced milestoneId "${item.milestoneId}" does not exist in roadmap.`,
              path: `${itemPath}.milestoneId`,
              severity: 'error',
            });
          }
        }

        if (!item.title || typeof item.title !== 'string') {
          diagnostics.push({
            code: 'INVALID_REQUIRED_FIELD',
            message: `${itemPath}: missing or invalid "title"`,
            path: `${itemPath}.title`,
            severity: 'error',
          });
        }

        // Implementation Status (support legacy on_hold -> blocked)
        let impStatus: ImplementationStatus = item.implementationStatus;
        if (item.implementationStatus === 'on_hold') {
          impStatus = 'blocked';
          diagnostics.push({
            code: 'LEGACY_STATUS_MAPPED',
            message: `${itemPath}: legacy status "on_hold" mapped to canonical "blocked".`,
            path: `${itemPath}.implementationStatus`,
            severity: 'warning',
          });
        } else if (!VALID_IMPLEMENTATION_STATUSES.includes(item.implementationStatus)) {
          diagnostics.push({
            code: 'INVALID_IMPLEMENTATION_STATUS',
            message: `${itemPath}: invalid implementationStatus "${item.implementationStatus}". Valid: ${VALID_IMPLEMENTATION_STATUSES.join(', ')}`,
            path: `${itemPath}.implementationStatus`,
            severity: 'error',
          });
        }

        const pubStatus: PublicationStatus = item.publicationStatus || 'draft';
        if (!VALID_PUBLICATION_STATUSES.includes(pubStatus)) {
          diagnostics.push({
            code: 'INVALID_PUBLICATION_STATUS',
            message: `${itemPath}: invalid publicationStatus "${pubStatus}". Valid: ${VALID_PUBLICATION_STATUSES.join(', ')}`,
            path: `${itemPath}.publicationStatus`,
            severity: 'error',
          });
        }

        if (item.priority !== undefined && !VALID_ITEM_PRIORITIES.includes(item.priority)) {
          diagnostics.push({
            code: 'INVALID_PRIORITY',
            message: `${itemPath}: invalid priority "${item.priority}". Valid: ${VALID_ITEM_PRIORITIES.join(', ')}`,
            path: `${itemPath}.priority`,
            severity: 'error',
          });
        }

        if (item.updatedAt && !isValidIsoDate(item.updatedAt)) {
          diagnostics.push({
            code: 'INVALID_TIMESTAMP',
            message: `${itemPath}: "updatedAt" must be a valid ISO 8601 date string.`,
            path: `${itemPath}.updatedAt`,
            severity: 'error',
          });
        }

        validatedFeatures.push({
          id: String(item.id || `feat_${idx + 1}`),
          milestoneId: item.milestoneId ? String(item.milestoneId) : undefined,
          title: String(item.title || ''),
          description: String(item.description || ''),
          priority: item.priority,
          category: item.category ? String(item.category) : undefined,
          implementationStatus: impStatus || 'planned',
          publicationStatus: pubStatus,
          releaseVersion: item.releaseVersion ? String(item.releaseVersion) : undefined,
          screenshotIds: Array.isArray(item.screenshotIds) ? item.screenshotIds.map(String) : [],
          order: typeof item.order === 'number' ? item.order : idx + 1,
          completedAt: item.completedAt ? String(item.completedAt) : undefined,
          updatedAt: item.updatedAt && isValidIsoDate(item.updatedAt) ? item.updatedAt : new Date().toISOString(),
          createdAt: item.createdAt ? String(item.createdAt) : undefined,
        });
      });
    }
  }

  // 8. Validate Screenshots
  const validatedScreenshots: ProgressScreenshot[] = [];
  const screenshotIdSet = new Set<string>();

  if (doc.screenshots !== undefined) {
    if (!Array.isArray(doc.screenshots)) {
      diagnostics.push({
        code: 'INVALID_FIELD_TYPE',
        message: 'Field "screenshots" must be an array.',
        path: 'screenshots',
        severity: 'error',
      });
    } else {
      doc.screenshots.forEach((item: any, idx: number) => {
        const itemPath = `screenshots[${idx}]`;

        if (!item.id || typeof item.id !== 'string') {
          diagnostics.push({
            code: 'INVALID_IDENTIFIER',
            message: `${itemPath}: missing or invalid "id"`,
            path: `${itemPath}.id`,
            severity: 'error',
          });
        } else {
          if (!isValidIdentifier(item.id)) {
            diagnostics.push({
              code: 'INVALID_IDENTIFIER_FORMAT',
              message: `${itemPath}: identifier "${item.id}" must be 3-64 characters (alphanumeric, dash, underscore).`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          if (screenshotIdSet.has(item.id) || seenIds.has(item.id)) {
            diagnostics.push({
              code: 'DUPLICATE_IDENTIFIER',
              message: `${itemPath}: duplicate identifier "${item.id}".`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          screenshotIdSet.add(item.id);
          seenIds.add(item.id);
        }

        // Relational check: featureId must exist in features if features are provided
        if (item.featureId !== undefined) {
          if (typeof item.featureId !== 'string' || !isValidIdentifier(item.featureId)) {
            diagnostics.push({
              code: 'INVALID_IDENTIFIER_FORMAT',
              message: `${itemPath}: featureId "${item.featureId}" is invalid.`,
              path: `${itemPath}.featureId`,
              severity: 'error',
            });
          } else if (featureIdSet.size > 0 && !featureIdSet.has(item.featureId)) {
            diagnostics.push({
              code: 'BROKEN_RELATIONSHIP',
              message: `${itemPath}: referenced featureId "${item.featureId}" does not exist in features.`,
              path: `${itemPath}.featureId`,
              severity: 'error',
            });
          }
        }

        if (!item.path || typeof item.path !== 'string') {
          diagnostics.push({
            code: 'INVALID_REQUIRED_FIELD',
            message: `${itemPath}: missing or invalid "path"`,
            path: `${itemPath}.path`,
            severity: 'error',
          });
        } else {
          const lowerPath = item.path.trim().toLowerCase();
          if (lowerPath.startsWith('javascript:') || lowerPath.startsWith('data:') || lowerPath.startsWith('vbscript:')) {
            diagnostics.push({
              code: 'DANGEROUS_URI_SCHEME',
              message: `${itemPath}: path contains dangerous URI scheme (${item.path})`,
              path: `${itemPath}.path`,
              severity: 'error',
            });
          }
        }

        const pubStatus: PublicationStatus = item.publicationStatus || 'draft';
        if (!VALID_PUBLICATION_STATUSES.includes(pubStatus)) {
          diagnostics.push({
            code: 'INVALID_PUBLICATION_STATUS',
            message: `${itemPath}: invalid publicationStatus "${pubStatus}". Valid: ${VALID_PUBLICATION_STATUSES.join(', ')}`,
            path: `${itemPath}.publicationStatus`,
            severity: 'error',
          });
        }

        // Verification safety rule: screenshot marked public must be verified and sanitized
        if (pubStatus === 'public' && (!item.verifiedRealApp || !item.sanitized)) {
          diagnostics.push({
            code: 'UNVERIFIED_PUBLIC_SCREENSHOT',
            message: `${itemPath}: screenshot marked "public" must have verifiedRealApp=true and sanitized=true. It will be filtered from public view.`,
            path: itemPath,
            severity: 'warning',
          });
        }

        validatedScreenshots.push({
          id: String(item.id || `shot_${idx + 1}`),
          featureId: item.featureId ? String(item.featureId) : undefined,
          caption: String(item.caption || ''),
          path: String(item.path || ''),
          publicationStatus: pubStatus,
          verifiedRealApp: Boolean(item.verifiedRealApp),
          sanitized: Boolean(item.sanitized),
          updatedAt: item.updatedAt && isValidIsoDate(item.updatedAt) ? item.updatedAt : new Date().toISOString(),
          createdAt: item.createdAt ? String(item.createdAt) : undefined,
        });
      });
    }
  }

  // 9. Validate Events (Changelog)
  const validatedEvents: ProgressEvent[] = [];
  const eventIdSet = new Set<string>();

  if (doc.events !== undefined) {
    if (!Array.isArray(doc.events)) {
      diagnostics.push({
        code: 'INVALID_FIELD_TYPE',
        message: 'Field "events" must be an array.',
        path: 'events',
        severity: 'error',
      });
    } else {
      doc.events.forEach((item: any, idx: number) => {
        const itemPath = `events[${idx}]`;

        if (!item.id || typeof item.id !== 'string') {
          diagnostics.push({
            code: 'INVALID_IDENTIFIER',
            message: `${itemPath}: missing or invalid "id"`,
            path: `${itemPath}.id`,
            severity: 'error',
          });
        } else {
          if (!isValidIdentifier(item.id)) {
            diagnostics.push({
              code: 'INVALID_IDENTIFIER_FORMAT',
              message: `${itemPath}: identifier "${item.id}" must be 3-64 characters (alphanumeric, dash, underscore).`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          if (eventIdSet.has(item.id) || seenIds.has(item.id)) {
            diagnostics.push({
              code: 'DUPLICATE_IDENTIFIER',
              message: `${itemPath}: duplicate identifier "${item.id}".`,
              path: `${itemPath}.id`,
              severity: 'error',
            });
          }
          eventIdSet.add(item.id);
          seenIds.add(item.id);
        }

        if (!item.eventType || !VALID_EVENT_TYPES.includes(item.eventType)) {
          diagnostics.push({
            code: 'INVALID_EVENT_TYPE',
            message: `${itemPath}: invalid eventType "${item.eventType}". Valid: ${VALID_EVENT_TYPES.join(', ')}`,
            path: `${itemPath}.eventType`,
            severity: 'error',
          });
        }

        if (!item.title || typeof item.title !== 'string') {
          diagnostics.push({
            code: 'INVALID_REQUIRED_FIELD',
            message: `${itemPath}: missing or invalid "title"`,
            path: `${itemPath}.title`,
            severity: 'error',
          });
        }

        if (!item.timestamp || !isValidIsoDate(item.timestamp)) {
          diagnostics.push({
            code: 'INVALID_TIMESTAMP',
            message: `${itemPath}: "timestamp" must be a valid ISO 8601 date string.`,
            path: `${itemPath}.timestamp`,
            severity: 'error',
          });
        }

        // Relational check for relatedId
        if (item.relatedId !== undefined) {
          if (item.relatedType === 'milestone' && !roadmapIdSet.has(item.relatedId)) {
            diagnostics.push({
              code: 'BROKEN_RELATIONSHIP',
              message: `${itemPath}: referenced milestone relatedId "${item.relatedId}" does not exist in roadmap.`,
              path: `${itemPath}.relatedId`,
              severity: 'error',
            });
          } else if (item.relatedType === 'feature' && !featureIdSet.has(item.relatedId)) {
            diagnostics.push({
              code: 'BROKEN_RELATIONSHIP',
              message: `${itemPath}: referenced feature relatedId "${item.relatedId}" does not exist in features.`,
              path: `${itemPath}.relatedId`,
              severity: 'error',
            });
          }
        }

        const pubStatus: PublicationStatus = item.publicationStatus || 'draft';
        if (!VALID_PUBLICATION_STATUSES.includes(pubStatus)) {
          diagnostics.push({
            code: 'INVALID_PUBLICATION_STATUS',
            message: `${itemPath}: invalid publicationStatus "${pubStatus}". Valid: ${VALID_PUBLICATION_STATUSES.join(', ')}`,
            path: `${itemPath}.publicationStatus`,
            severity: 'error',
          });
        }

        validatedEvents.push({
          id: String(item.id || `evt_${idx + 1}`),
          eventType: item.eventType,
          title: String(item.title || ''),
          description: String(item.description || ''),
          timestamp: item.timestamp,
          relatedId: item.relatedId ? String(item.relatedId) : undefined,
          relatedType: item.relatedType,
          publicationStatus: pubStatus,
        });
      });
    }
  }

  const errors = diagnostics.filter((d) => d.severity === 'error').map((d) => d.message);
  const warnings = diagnostics.filter((d) => d.severity === 'warning').map((d) => d.message);

  if (errors.length > 0) {
    return { valid: false, errors, warnings, diagnostics };
  }

  const sanitizedDoc: ProjectProgressDocument = {
    schemaVersion: doc.schemaVersion,
    projectSlug: doc.projectSlug,
    projectName: doc.projectName,
    projectType: validatedProjectType,
    shortDescription: doc.shortDescription ? String(doc.shortDescription) : undefined,
    publicDescription: doc.publicDescription ? String(doc.publicDescription) : undefined,
    version: doc.version ? String(doc.version) : undefined,
    roadmap: validatedRoadmap,
    features: validatedFeatures,
    screenshots: validatedScreenshots,
    events: validatedEvents,
    updatedAt: doc.updatedAt && isValidIsoDate(doc.updatedAt) ? doc.updatedAt : new Date().toISOString(),
    createdAt: doc.createdAt && isValidIsoDate(doc.createdAt) ? doc.createdAt : undefined,
    metadataExtras: doc.metadataExtras && typeof doc.metadataExtras === 'object' ? doc.metadataExtras : undefined,
  };

  return { valid: true, errors: [], warnings, diagnostics, sanitizedDoc };
}

/**
 * Strict Public Sanitizer: Extracts ONLY items with publicationStatus === 'public'.
 * Guarantees that draft, review, and hidden items are NEVER returned to the public website,
 * even if implementationStatus === 'completed'.
 * 
 * Uses strict whitelist field projection — zero internal keys or status leaked.
 */
export function extractPublicProgress(doc: ProjectProgressDocument): PublicProjectProgress {
  const publicRoadmap: PublicRoadmapItem[] = (doc.roadmap || [])
    .filter((m) => m.publicationStatus === 'public')
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

  const publicFeatures: PublicFeatureItem[] = (doc.features || [])
    .filter((f) => f.publicationStatus === 'public')
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

  const publicScreenshots: PublicScreenshotItem[] = (doc.screenshots || [])
    .filter((s) => s.publicationStatus === 'public' && s.verifiedRealApp && s.sanitized)
    .map((s) => ({
      id: s.id,
      featureId: s.featureId,
      caption: s.caption,
      path: s.path,
      updatedAt: s.updatedAt,
    }));

  const publicEvents: PublicProgressEvent[] = (doc.events || [])
    .filter((e) => e.publicationStatus === 'public')
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
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
    schemaVersion: doc.schemaVersion,
    projectSlug: doc.projectSlug,
    projectName: doc.projectName,
    projectType: doc.projectType,
    shortDescription: doc.shortDescription,
    publicDescription: doc.publicDescription,
    version: doc.version,
    roadmap: publicRoadmap,
    features: publicFeatures,
    screenshots: publicScreenshots,
    events: publicEvents,
    lastPublicUpdate: doc.updatedAt,
  };
}

/**
 * Pure, deterministic, non-destructive migration function that transforms
 * legacy v1 metadata documents into canonical v2 structure.
 */
export function migrateLegacyProgressDocument(
  data: unknown,
  options?: { fallbackTimestamp?: string }
): MigrationResult {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      warnings: ['Input payload is not a valid JSON object.'],
      preservedLegacyFields: [],
    };
  }

  const defaultTimestamp = options?.fallbackTimestamp || new Date().toISOString();

  const raw = data as Record<string, any>;
  const warnings: string[] = [];
  const preservedFields: string[] = [];

  // Track standard known top-level fields
  const standardFields = new Set([
    'schemaVersion',
    'projectSlug',
    'projectName',
    'projectType',
    'shortDescription',
    'publicDescription',
    'version',
    'roadmap',
    'features',
    'screenshots',
    'events',
    'updatedAt',
    'createdAt',
    'metadataExtras',
  ]);

  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!standardFields.has(k)) {
      extras[k] = v;
      preservedFields.push(k);
    }
  }

  if (raw.schemaVersion === 1) {
    warnings.push('Migrating schemaVersion from 1 to canonical 2.');
  }

  // Migrate roadmap items (supports canonical 'roadmap' or legacy v1 'milestones')
  const rawRoadmap = Array.isArray(raw.roadmap)
    ? raw.roadmap
    : (Array.isArray(raw.milestones) ? raw.milestones : []);
  const migratedRoadmap: RoadmapMilestone[] = rawRoadmap.map((item: any, idx: number) => {
        let status: ImplementationStatus = item.implementationStatus || 'planned';
        if (item.implementationStatus === 'on_hold') {
          status = 'blocked';
          warnings.push(`roadmap[${idx}]: mapped legacy status "on_hold" to "blocked".`);
        }

        const pubStatus: PublicationStatus = item.publicationStatus || 'draft';
        if (!item.publicationStatus) {
          warnings.push(`roadmap[${idx}]: defaulted missing publicationStatus to "draft".`);
        }

        return {
          id: String(item.id || `ms_${idx + 1}`),
          title: String(item.title || ''),
          description: String(item.description || ''),
          priority: item.priority,
          implementationStatus: status,
          publicationStatus: pubStatus,
          targetQuarter: item.targetQuarter ? String(item.targetQuarter) : undefined,
          targetDate: item.targetDate ? String(item.targetDate) : undefined,
          completedAt: item.completedAt ? String(item.completedAt) : undefined,
          order: typeof item.order === 'number' ? item.order : idx + 1,
          updatedAt: item.updatedAt || defaultTimestamp,
          createdAt: item.createdAt,
        };
      });

  // Migrate feature items
  const migratedFeatures: FeatureItem[] = Array.isArray(raw.features)
    ? raw.features.map((item: any, idx: number) => {
        let status: ImplementationStatus = item.implementationStatus || 'planned';
        if (item.implementationStatus === 'on_hold') {
          status = 'blocked';
          warnings.push(`features[${idx}]: mapped legacy status "on_hold" to "blocked".`);
        }

        const pubStatus: PublicationStatus = item.publicationStatus || 'draft';
        if (!item.publicationStatus) {
          warnings.push(`features[${idx}]: defaulted missing publicationStatus to "draft".`);
        }

        return {
          id: String(item.id || `feat_${idx + 1}`),
          milestoneId: item.milestoneId ? String(item.milestoneId) : undefined,
          title: String(item.title || ''),
          description: String(item.description || ''),
          priority: item.priority,
          category: item.category ? String(item.category) : undefined,
          implementationStatus: status,
          publicationStatus: pubStatus,
          releaseVersion: item.releaseVersion ? String(item.releaseVersion) : undefined,
          screenshotIds: Array.isArray(item.screenshotIds) ? [...item.screenshotIds] : [],
          order: typeof item.order === 'number' ? item.order : idx + 1,
          completedAt: item.completedAt ? String(item.completedAt) : undefined,
          updatedAt: item.updatedAt || defaultTimestamp,
          createdAt: item.createdAt,
        };
      })
    : [];

  // Migrate screenshots
  const migratedScreenshots: ProgressScreenshot[] = Array.isArray(raw.screenshots)
    ? raw.screenshots.map((item: any, idx: number) => ({
        id: String(item.id || `shot_${idx + 1}`),
        featureId: item.featureId ? String(item.featureId) : undefined,
        caption: String(item.caption || ''),
        path: String(item.path || ''),
        publicationStatus: item.publicationStatus || 'draft',
        verifiedRealApp: Boolean(item.verifiedRealApp),
        sanitized: Boolean(item.sanitized),
        updatedAt: item.updatedAt || defaultTimestamp,
        createdAt: item.createdAt,
      }))
    : [];

  // Migrate events
  const migratedEvents: ProgressEvent[] = Array.isArray(raw.events)
    ? raw.events.map((item: any, idx: number) => ({
        id: String(item.id || `evt_${idx + 1}`),
        eventType: item.eventType || 'general_update',
        title: String(item.title || ''),
        description: String(item.description || ''),
        timestamp: item.timestamp || defaultTimestamp,
        relatedId: item.relatedId ? String(item.relatedId) : undefined,
        relatedType: item.relatedType,
        publicationStatus: item.publicationStatus || 'draft',
      }))
    : [];

  const migratedDoc: ProjectProgressDocument = {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    projectSlug: String(raw.projectSlug || raw.slug || ''),
    projectName: String(raw.projectName || raw.name || ''),
    projectType: raw.projectType,
    shortDescription: raw.shortDescription,
    publicDescription: raw.publicDescription,
    version: raw.version,
    roadmap: migratedRoadmap,
    features: migratedFeatures,
    screenshots: migratedScreenshots,
    events: migratedEvents,
    updatedAt: raw.updatedAt || defaultTimestamp,
    createdAt: raw.createdAt,
    metadataExtras: Object.keys(extras).length > 0 ? extras : undefined,
  };

  return {
    success: true,
    migratedDoc,
    warnings,
    preservedLegacyFields: preservedFields,
  };
}

/**
 * Generates an empty default progress document for a project (All items draft)
 */
export function createDefaultProgressDocument(
  projectSlug: string,
  projectName: string,
  projectType: CanonicalProjectType = 'APPLICATION'
): ProjectProgressDocument {
  return {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    projectSlug,
    projectName,
    projectType,
    roadmap: [],
    features: [],
    screenshots: [],
    events: [],
    updatedAt: new Date().toISOString(),
  };
}
