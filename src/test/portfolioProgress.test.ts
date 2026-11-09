import { describe, it, expect } from 'vitest';
import {
  validateProgressMetadata,
  extractPublicProgress,
  createDefaultProgressDocument,
  migrateLegacyProgressDocument,
} from '../services/portfolioMetadataValidator';
import {
  ProjectProgressDocument,
  CANONICAL_SCHEMA_VERSION,
  canTransitionImplementation,
  canTransitionPublication,
} from '../types/portfolioProgress';
import fs from 'node:fs';
import path from 'node:path';

describe('STAGE 2: Metadata Contract & Schema Specification Suite', () => {
  describe('1. Schema Versioning & Universal Project Structure', () => {
    it('accepts a valid canonical metadata document with schemaVersion 2', () => {
      const canonicalDoc: ProjectProgressDocument = {
        schemaVersion: CANONICAL_SCHEMA_VERSION,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        projectType: 'APPLICATION',
        shortDescription: 'Aplikasi manajemen finansial mandiri offline-first.',
        publicDescription: 'Aplikasi pengatur anggaran bulanan dengan enkripsi lokal.',
        version: '1.2.0',
        roadmap: [
          {
            id: 'ms_core_engine',
            title: 'Core Engine & Database',
            description: 'Room DB and repository architecture.',
            priority: 'critical',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            targetQuarter: 'Q4 2025',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'feat_budget_tracker',
            milestoneId: 'ms_core_engine',
            title: 'Multi-account budgeting',
            description: 'Categorized monthly income and expense tracking.',
            priority: 'high',
            category: 'Core Finance',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [],
        events: [
          {
            id: 'evt_v120_release',
            eventType: 'feature_released',
            title: 'Release Version 1.2.0',
            description: 'Public release on Google Play.',
            timestamp: '2026-11-02T10:00:00.000Z',
            relatedId: 'feat_budget_tracker',
            relatedType: 'feature',
            publicationStatus: 'public',
          },
        ],
        updatedAt: '2026-11-02T10:00:00.000Z',
      };

      const result = validateProgressMetadata(canonicalDoc);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.sanitizedDoc?.schemaVersion).toBe(2);
      expect(result.sanitizedDoc?.projectType).toBe('APPLICATION');
      expect(result.sanitizedDoc?.events?.length).toBe(1);
    });

    it('accepts legacy metadata document with schemaVersion 1 and issues warning diagnostic', () => {
      const legacyDoc: ProjectProgressDocument = {
        schemaVersion: 1,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_01',
            title: 'Core Engine',
            description: 'Core logic',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      const result = validateProgressMetadata(legacyDoc);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('Legacy schemaVersion 1'))).toBe(true);
      expect(result.diagnostics.some((d) => d.code === 'LEGACY_SCHEMA_VERSION')).toBe(true);
    });

    it('rejects documents with unsupported schemaVersion (e.g. 99, 0, or negative)', () => {
      const invalidVersion = {
        schemaVersion: 99,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(invalidVersion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unsupported schemaVersion'))).toBe(true);
    });

    it('rejects invalid projectSlug format and missing projectName', () => {
      const badSlug = {
        schemaVersion: 2,
        projectSlug: 'Invalid Slug With Spaces!',
        projectName: '',
        roadmap: [],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(badSlug);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('projectSlug'))).toBe(true);
      expect(result.errors.some((e) => e.includes('projectName'))).toBe(true);
    });

    it('supports universal project categories (APPLICATION, GAME, WEBSITE, TOOL, OTHER)', () => {
      const types = ['APPLICATION', 'GAME', 'WEBSITE', 'TOOL', 'OTHER'] as const;
      types.forEach((t) => {
        const doc = {
          schemaVersion: 2,
          projectSlug: 'test-project',
          projectName: 'Test Project',
          projectType: t,
          roadmap: [],
          features: [],
          screenshots: [],
        };
        const result = validateProgressMetadata(doc);
        expect(result.valid).toBe(true);
        expect(result.sanitizedDoc?.projectType).toBe(t);
      });

      const badTypeDoc = {
        schemaVersion: 2,
        projectSlug: 'test-project',
        projectName: 'Test Project',
        projectType: 'INVALID_PROJECT_TYPE',
        roadmap: [],
        features: [],
        screenshots: [],
      };
      const badResult = validateProgressMetadata(badTypeDoc);
      expect(badResult.valid).toBe(false);
      expect(badResult.errors.some((e) => e.includes('INVALID_PROJECT_TYPE'))).toBe(true);
    });
  });

  describe('2. Identifier Validation & Relational Integrity', () => {
    it('accepts stable alphanumeric identifiers with hyphens and underscores', () => {
      const doc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms-core_01',
            title: 'Core Engine',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'feat_track-expense_99',
            milestoneId: 'ms-core_01',
            title: 'Feature',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [],
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      const result = validateProgressMetadata(doc);
      expect(result.valid).toBe(true);
    });

    it('rejects malformed identifiers (too short, spaces, special symbols)', () => {
      const doc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'x!', // Invalid: special symbol and < 3 chars
            title: 'Core Engine',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be 3-64 characters'))).toBe(true);
    });

    it('rejects duplicate identifiers within the same document', () => {
      const doc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'duplicate_id_01',
            title: 'Milestone 1',
            description: 'Desc',
            implementationStatus: 'planned',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'duplicate_id_01', // Conflict with milestone!
            title: 'Feature with same id',
            description: 'Desc',
            implementationStatus: 'planned',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [],
      };

      const result = validateProgressMetadata(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('duplicate identifier "duplicate_id_01"'))).toBe(true);
    });

    it('rejects broken relational references (feature referencing non-existent milestoneId)', () => {
      const doc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_existing_one',
            title: 'Existing Milestone',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'feat_broken_ref',
            milestoneId: 'ms_ghost_milestone', // Ghost reference!
            title: 'Feature with ghost milestone',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [],
      };

      const result = validateProgressMetadata(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('referenced milestoneId "ms_ghost_milestone" does not exist'))).toBe(true);
    });
  });

  describe('3. Implementation Status & State Machine Transitions', () => {
    it('accepts all 6 canonical implementation statuses', () => {
      const validStatuses = [
        'not_started',
        'planned',
        'in_progress',
        'completed',
        'blocked',
        'cancelled',
      ] as const;

      validStatuses.forEach((status, idx) => {
        const doc = {
          schemaVersion: 2,
          projectSlug: 'dompetnalar',
          projectName: 'DompetNalar',
          roadmap: [
            {
              id: `ms_${status}`,
              title: `Milestone ${status}`,
              description: 'Desc',
              implementationStatus: status,
              publicationStatus: 'draft',
              order: idx + 1,
              updatedAt: '2026-11-01T00:00:00.000Z',
            },
          ],
          features: [],
          screenshots: [],
        };
        const result = validateProgressMetadata(doc);
        expect(result.valid).toBe(true);
        expect(result.sanitizedDoc?.roadmap[0].implementationStatus).toBe(status);
      });
    });

    it('maps legacy "on_hold" status to canonical "blocked" with a warning', () => {
      const doc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_on_hold_item',
            title: 'Paused Task',
            description: 'Desc',
            implementationStatus: 'on_hold', // Legacy status
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(doc);
      expect(result.valid).toBe(true);
      expect(result.sanitizedDoc?.roadmap[0].implementationStatus).toBe('blocked');
      expect(result.warnings.some((w) => w.includes('mapped to canonical "blocked"'))).toBe(true);
    });

    it('rejects invalid implementation status values', () => {
      const badStatusDoc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_01',
            title: 'Test',
            description: 'Desc',
            implementationStatus: 'in_review_almost_done', // Invalid
            publicationStatus: 'draft',
            order: 1,
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(badStatusDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid implementationStatus'))).toBe(true);
    });

    it('evaluates implementation state transitions correctly', () => {
      // Valid transitions
      expect(canTransitionImplementation('not_started', 'planned').allowed).toBe(true);
      expect(canTransitionImplementation('planned', 'in_progress').allowed).toBe(true);
      expect(canTransitionImplementation('in_progress', 'completed').allowed).toBe(true);
      expect(canTransitionImplementation('in_progress', 'blocked').allowed).toBe(true);
      expect(canTransitionImplementation('blocked', 'in_progress').allowed).toBe(true);
      expect(canTransitionImplementation('completed', 'in_progress').allowed).toBe(true); // Rework
      expect(canTransitionImplementation('cancelled', 'planned').allowed).toBe(true); // Reactivation

      // Invalid transitions
      const invalidNotStartedToCompleted = canTransitionImplementation('not_started', 'completed');
      expect(invalidNotStartedToCompleted.allowed).toBe(false);
      expect(invalidNotStartedToCompleted.reason).toContain('Transisi status implementasi tidak sah');

      const invalidCompletedToNotStarted = canTransitionImplementation('completed', 'not_started');
      expect(invalidCompletedToNotStarted.allowed).toBe(false);

      const invalidCancelledToCompleted = canTransitionImplementation('cancelled', 'completed');
      expect(invalidCancelledToCompleted.allowed).toBe(false);
    });
  });

  describe('4. Publication Status & Strict Editorial Lifecycle', () => {
    it('accepts all 4 publication statuses (draft, review, public, hidden)', () => {
      const validPubStatuses = ['draft', 'review', 'public', 'hidden'] as const;

      validPubStatuses.forEach((pubStatus, idx) => {
        const doc = {
          schemaVersion: 2,
          projectSlug: 'dompetnalar',
          projectName: 'DompetNalar',
          roadmap: [
            {
              id: `ms_pub_${pubStatus}`,
              title: `Milestone ${pubStatus}`,
              description: 'Desc',
              implementationStatus: 'completed',
              publicationStatus: pubStatus,
              order: idx + 1,
              updatedAt: '2026-11-01T00:00:00.000Z',
            },
          ],
          features: [],
          screenshots: [],
        };

        const result = validateProgressMetadata(doc);
        expect(result.valid).toBe(true);
        expect(result.sanitizedDoc?.roadmap[0].publicationStatus).toBe(pubStatus);
      });
    });

    it('rejects invalid publication status strings', () => {
      const badPubDoc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [],
        features: [
          {
            id: 'feat_invalid_pub',
            title: 'Feature',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'visible_to_all_users', // Invalid!
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [],
      };

      const result = validateProgressMetadata(badPubDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid publicationStatus'))).toBe(true);
    });

    it('evaluates publication state transitions correctly', () => {
      // Valid transitions
      expect(canTransitionPublication('draft', 'review').allowed).toBe(true);
      expect(canTransitionPublication('review', 'public').allowed).toBe(true);
      expect(canTransitionPublication('public', 'hidden').allowed).toBe(true);
      expect(canTransitionPublication('hidden', 'draft').allowed).toBe(true);
      expect(canTransitionPublication('public', 'draft').allowed).toBe(true);

      // Strict Rule: draft cannot jump directly to public without review
      const directDraftToPublic = canTransitionPublication('draft', 'public');
      expect(directDraftToPublic.allowed).toBe(false);
      expect(directDraftToPublic.reason).toContain('harus melalui status "review"');
    });

    it('guarantees completed implementation does NOT automatically publish item', () => {
      const unstatedStatusDoc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_completed_unreviewed',
            title: 'Engineering Finished',
            description: 'Desc',
            implementationStatus: 'completed', // Completed!
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(unstatedStatusDoc);
      expect(result.valid).toBe(true);
      // Strict rule: defaults to 'draft'
      expect(result.sanitizedDoc?.roadmap[0].publicationStatus).toBe('draft');

      // Public projection must exclude it completely
      const publicView = extractPublicProgress(result.sanitizedDoc!);
      expect(publicView.roadmap.length).toBe(0);
    });
  });

  describe('5. Public Whitelist Projection & Data Sanitization', () => {
    it('guarantees draft, review, and hidden items are excluded from public projection', () => {
      const doc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_draft',
            title: 'Draft Milestone',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'ms_review',
            title: 'Review Milestone',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'review',
            order: 2,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'ms_hidden',
            title: 'Hidden Milestone',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'hidden',
            order: 3,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'ms_public',
            title: 'Official Public Milestone',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 4,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'feat_draft',
            title: 'Internal Secret Feature',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'feat_public',
            title: 'Approved Public Feature',
            description: 'Desc',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 2,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [
          {
            id: 'shot_unverified',
            caption: 'Unverified Screenshot',
            path: 'docs/portfolio/screenshots/unverified.png',
            publicationStatus: 'public',
            verifiedRealApp: false, // Rejected!
            sanitized: true,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'shot_clean',
            caption: 'Clean Verified Screenshot',
            path: 'docs/portfolio/screenshots/clean.png',
            publicationStatus: 'public',
            verifiedRealApp: true,
            sanitized: true,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        events: [
          {
            id: 'evt_draft_internal',
            eventType: 'general_update',
            title: 'Internal dev log',
            description: 'Desc',
            timestamp: '2026-11-01T00:00:00.000Z',
            publicationStatus: 'draft',
          },
          {
            id: 'evt_public_changelog',
            eventType: 'feature_released',
            title: 'Official v1.0.0 Launched',
            description: 'Desc',
            timestamp: '2026-11-02T00:00:00.000Z',
            publicationStatus: 'public',
          },
        ],
        updatedAt: '2026-11-02T00:00:00.000Z',
      };

      const publicView = extractPublicProgress(doc);

      // Only public roadmap milestone
      expect(publicView.roadmap.length).toBe(1);
      expect(publicView.roadmap[0].id).toBe('ms_public');
      expect((publicView.roadmap[0] as any).publicationStatus).toBeUndefined();

      // Only public feature
      expect(publicView.features.length).toBe(1);
      expect(publicView.features[0].id).toBe('feat_public');
      expect((publicView.features[0] as any).publicationStatus).toBeUndefined();

      // Only clean & verified screenshot
      expect(publicView.screenshots.length).toBe(1);
      expect(publicView.screenshots[0].id).toBe('shot_clean');
      expect((publicView.screenshots[0] as any).publicationStatus).toBeUndefined();
      expect((publicView.screenshots[0] as any).verifiedRealApp).toBeUndefined();

      // Only public changelog event
      expect(publicView.events.length).toBe(1);
      expect(publicView.events[0].id).toBe('evt_public_changelog');
      expect((publicView.events[0] as any).publicationStatus).toBeUndefined();
    });

    it('safely handles empty progress document without throwing', () => {
      const emptyDoc = createDefaultProgressDocument('new-project', 'New Project', 'GAME');
      const publicView = extractPublicProgress(emptyDoc);

      expect(publicView.roadmap.length).toBe(0);
      expect(publicView.features.length).toBe(0);
      expect(publicView.screenshots.length).toBe(0);
      expect(publicView.events.length).toBe(0);
      expect(publicView.projectSlug).toBe('new-project');
      expect(publicView.projectType).toBe('GAME');
    });
  });

  describe('6. Security Denylist & Deep Secret Leakage Prevention', () => {
    it('rejects metadata containing prohibited internal git or infrastructure keys in root or nested objects', () => {
      const contaminatedDoc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        commitHash: 'a1b2c3d4e5f6', // Prohibited!
        branch: 'feature/payment', // Prohibited!
        roadmap: [
          {
            id: 'ms_01',
            title: 'Milestone',
            description: 'Desc',
            implementationStatus: 'planned',
            publicationStatus: 'draft',
            serverProvider: 'AWS EC2 us-east-1', // Prohibited!
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(contaminatedDoc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('commitHash'))).toBe(true);
      expect(result.errors.some((e) => e.includes('branch'))).toBe(true);
      expect(result.errors.some((e) => e.includes('serverProvider'))).toBe(true);
    });

    it('detects and blocks simulated secret credentials inside string values', () => {
      const docWithToken = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_secret_leak',
            title: 'Setup Google API',
            description: 'Configured key: ' + ['AIza', 'SyTestSyntheticGoogleApiKeySecret_12345'].join(''), // Synthetic API key test vector
            implementationStatus: 'completed',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(docWithToken);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Google API Key'))).toBe(true);
      expect(result.diagnostics.some((d) => d.code === 'SENSITIVE_CONTENT_LEAK')).toBe(true);
    });

    it('detects and blocks private internal endpoints and localhost references', () => {
      const docWithInternalUrl = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_internal_url',
            title: 'Backend API connection',
            description: 'Syncs data to https://internal.sleepykoala.com/api/v1/sync',
            implementationStatus: 'completed',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
      };

      const result = validateProgressMetadata(docWithInternalUrl);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Private/Internal Endpoint'))).toBe(true);
    });
  });

  describe('7. Backward Compatibility & Deterministic Legacy Migration', () => {
    it('migrates legacy v1 document to canonical v2 deterministically and without input mutation', () => {
      const legacyV1Input = {
        schemaVersion: 1,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        updatedAt: '2026-11-01T00:00:00.000Z',
        customLegacyField: 'legacy_tracker_id_42',
        roadmap: [
          {
            id: 'ms_legacy_pause',
            title: 'Old Paused Task',
            description: 'Waiting for external library.',
            implementationStatus: 'on_hold', // Legacy status
            // publicationStatus is omitted
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'feat_legacy_01',
            title: 'Legacy Feature',
            description: 'Description',
            implementationStatus: 'completed',
            // publicationStatus omitted
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
      };

      // Create a deep copy to verify input immutability
      const inputSnapshot = JSON.parse(JSON.stringify(legacyV1Input));

      const migration1 = migrateLegacyProgressDocument(legacyV1Input);
      const migration2 = migrateLegacyProgressDocument(legacyV1Input);

      // Verify purity: original input object was not mutated
      expect(legacyV1Input).toEqual(inputSnapshot);

      // Verify determinism: running migration multiple times yields deep-equal output
      expect(migration1).toEqual(migration2);

      expect(migration1.success).toBe(true);
      const migrated = migration1.migratedDoc!;
      expect(migrated.schemaVersion).toBe(2);
      expect(migrated.roadmap[0].implementationStatus).toBe('blocked'); // 'on_hold' -> 'blocked'
      expect(migrated.roadmap[0].publicationStatus).toBe('draft'); // missing -> 'draft'
      expect(migrated.features[0].publicationStatus).toBe('draft'); // missing -> 'draft'
      expect(migrated.events).toEqual([]); // missing -> []

      // Verify custom unknown fields preserved in metadataExtras
      expect(migrated.metadataExtras?.customLegacyField).toBe('legacy_tracker_id_42');
      expect(migration1.preservedLegacyFields).toContain('customLegacyField');
    });
  });

  describe('8. Real Fixtures Verification (docs/portfolio/)', () => {
    it('validates docs/portfolio/roadmap.json matches schema for all canonical projects', () => {
      const roadmapPath = path.resolve(process.cwd(), 'docs/portfolio/roadmap.json');
      expect(fs.existsSync(roadmapPath)).toBe(true);

      const raw = JSON.parse(fs.readFileSync(roadmapPath, 'utf-8'));
      expect(raw.schemaVersion).toBe(1);

      const canonicalSlugs = [
        'dompetnalar',
        'idle-master',
        'mobile-kasir',
        'idle-mining',
        'the-broken-origin',
        'worklume',
      ];

      canonicalSlugs.forEach((slug) => {
        expect(raw.projects[slug]).toBeDefined();
        const projectRoadmap = raw.projects[slug];
        const doc: ProjectProgressDocument = {
          schemaVersion: raw.schemaVersion,
          projectSlug: projectRoadmap.projectSlug,
          projectName: projectRoadmap.projectName,
          roadmap: projectRoadmap.roadmap,
          features: [],
          screenshots: [],
          updatedAt: raw.updatedAt,
        };

        const result = validateProgressMetadata(doc);
        expect(result.valid).toBe(true);
      });
    });

    it('validates docs/portfolio/features.json matches schema for all canonical projects', () => {
      const featuresPath = path.resolve(process.cwd(), 'docs/portfolio/features.json');
      expect(fs.existsSync(featuresPath)).toBe(true);

      const raw = JSON.parse(fs.readFileSync(featuresPath, 'utf-8'));
      expect(raw.schemaVersion).toBe(1);

      const canonicalSlugs = [
        'dompetnalar',
        'idle-master',
        'mobile-kasir',
        'idle-mining',
        'the-broken-origin',
        'worklume',
      ];

      canonicalSlugs.forEach((slug) => {
        expect(raw.projects[slug]).toBeDefined();
        const projectFeatures = raw.projects[slug];
        const doc: ProjectProgressDocument = {
          schemaVersion: raw.schemaVersion,
          projectSlug: projectFeatures.projectSlug,
          projectName: projectFeatures.projectName,
          roadmap: [],
          features: projectFeatures.features || [],
          screenshots: projectFeatures.screenshots || [],
          updatedAt: raw.updatedAt,
        };

        const result = validateProgressMetadata(doc);
        expect(result.valid).toBe(true);
      });
    });
  });
});
