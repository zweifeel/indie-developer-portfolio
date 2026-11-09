/**
 * ============================================================================
 * SLEEPYKOALA CMS — STAGE 5 ACCEPTANCE & INTEGRATION TEST SUITE
 * 
 * Verifies all functional and security requirements for Stage 5:
 * 1. CMS Progress Data Integration & Non-Destructive Mutations
 * 2. Editorial Workflow State Machine (draft -> review -> public -> hidden / draft)
 * 3. Strict Fail-Closed Privacy & Whitelist Public Projection
 * 4. Protected Preview Projection (noindex, isolated from public cache)
 * 5. Audit Logging with Automatic Secret Scrubbing
 * 6. Project Isolation & STRICT_FREEZE Enforcement for TBO
 * 7. Independent Separation of Implementation and Publication Lifecycles
 * 8. Server-Side Functions API Endpoints & Auth Gate Verification
 * 9. DOM Component Acceptance: ProjectDetailPage Public Rendering
 * 10. DOM Component Acceptance: ProjectDetailPage Protected Preview Mode
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import rawProjects from '../data/projects.json';

import {
  CANONICAL_SCHEMA_VERSION,
  ProjectProgressDocument,
  RoadmapMilestone,
  ProgressScreenshot,
  ProgressEvent,
  canTransitionPublication,
} from '../types/portfolioProgress';

import {
  extractPublicProgress,
  migrateLegacyProgressDocument,
  createDefaultProgressDocument,
} from '../services/portfolioMetadataValidator';

import {
  CANONICAL_PROJECT_SLUGS,
  isCanonicalProjectSlug,
  fetchPublicProjectProgress,
  fetchAdminProjectProgress,
  saveAdminProjectProgress,
  transitionItemPublicationStatus,
  fetchAdminProgressPreview,
  getProjectSyncInfo,
  getProgressAuditLogs,
  recordProgressAuditLog,
  resetProgressCache,
  setProgressDocumentCache,
} from '../services/cmsProgressService';

import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SESSION_COOKIE_NAME,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestGet as publicProgressGet,
  onRequestOptions as publicProgressOptions,
} from '../../functions/api/projects/[slug]/progress';

import {
  onRequestGet as adminProgressGet,
  onRequestPost as adminProgressPost,
} from '../../functions/api/admin/progress/[slug]';

import {
  onRequestGet as adminPreviewGet,
  onRequestOptions as adminPreviewOptions,
} from '../../functions/api/admin/progress/[slug]/preview';

import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { resetProjectsCache } from '../services/projectService';

describe('STAGE 5: CMS Progress Metadata & Project Detail Integration Suite', () => {
  const TEST_SECRET = 'test_session_secret_123456789012345678901234567890';
  const mockEnv = {
    ADMIN_SESSION_SECRET: TEST_SECRET,
    APPS_SCRIPT_SECRET: TEST_SECRET,
  };

  beforeEach(() => {
    resetProgressCache();
    resetProjectsCache();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/projects') && !url.includes('/progress')) {
        return new Response(JSON.stringify({
          success: true,
          data: (rawProjects as any[]).map((p) => ({ ...p, publishState: 'PUBLISHED' })),
          source: 'cms-live',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not Found', { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. CMS PROGRESS DATA INTEGRATION & NON-DESTRUCTIVE MUTATIONS
  // ==========================================================================
  describe('1. CMS Progress Data Integration & Non-Destructive Mutations', () => {
    it('initializes canonical progress document with default draft status for new project', async () => {
      const res = await fetchAdminProjectProgress('worklume');
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
      expect(res.data?.projectSlug).toBe('worklume');
      expect(res.data?.projectType).toBe('TOOL');
      expect(Array.isArray(res.data?.roadmap)).toBe(true);
      expect(Array.isArray(res.data?.features)).toBe(true);
      expect(Array.isArray(res.data?.screenshots)).toBe(true);
    });

    it('rejects progress operations for unknown or alien project slugs', async () => {
      const res = await fetchAdminProjectProgress('unknown-alien-project');
      expect(res.success).toBe(false);
      expect(res.error).toBe('INVALID_PROJECT_SLUG');
    });

    it('performs non-destructive partial updates without wiping unchanged arrays', async () => {
      const initial = await fetchAdminProjectProgress('dompetnalar');
      expect(initial.success).toBe(true);
      const initialFeaturesCount = initial.data!.features.length;
      const initialScreenshotsCount = initial.data!.screenshots.length;
      expect(initialFeaturesCount).toBeGreaterThan(0);
      expect(initialScreenshotsCount).toBeGreaterThan(0);

      const newMilestone: RoadmapMilestone = {
        id: 'ms_dn_cloud_sync',
        title: 'Sinkronisasi Cloud Opsional',
        description: 'Penyimpanan terenkripsi ujung-ke-ujung.',
        priority: 'high',
        implementationStatus: 'planned',
        publicationStatus: 'draft',
        order: 4,
        updatedAt: new Date().toISOString(),
      };

      const updateRes = await saveAdminProjectProgress('dompetnalar', {
        roadmap: [...initial.data!.roadmap, newMilestone],
      });

      expect(updateRes.success).toBe(true);
      expect(updateRes.data?.roadmap.length).toBe(initial.data!.roadmap.length + 1);
      expect(updateRes.data?.features.length).toBe(initialFeaturesCount);
      expect(updateRes.data?.screenshots.length).toBe(initialScreenshotsCount);
    });

    it('automatically migrates legacy schema v1 documents to canonical v2', async () => {
      const legacyDoc: any = {
        schemaVersion: 1,
        projectSlug: 'mobile-kasir',
        projectName: 'Mobile Kasir',
        roadmap: [
          {
            id: 'ms_legacy_1',
            title: 'Legacy Feature',
            description: 'Legacy description',
            implementationStatus: 'on_hold',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
        legacyCustomField: 'preserved_value',
      };

      const migration = migrateLegacyProgressDocument(legacyDoc);
      expect(migration.success).toBe(true);
      expect(migration.migratedDoc?.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
      expect(migration.migratedDoc?.roadmap[0].implementationStatus).toBe('blocked');
      expect(migration.preservedLegacyFields).toContain('legacyCustomField');
      expect(migration.migratedDoc?.metadataExtras?.legacyCustomField).toBe('preserved_value');
    });

    it('rejects updates containing prohibited internal keys', async () => {
      const maliciousPayload: any = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        branch: 'feature/secret-algo',
        commit: 'cae5405',
        roadmap: [],
        features: [],
        screenshots: [],
      };

      const res = await saveAdminProjectProgress('dompetnalar', maliciousPayload);
      expect(res.success).toBe(false);
      expect(res.error).toBe('SCHEMA_VALIDATION_FAILED');
      expect(res.message).toMatch(/branch|commit|prohibited/i);
    });
  });

  // ==========================================================================
  // 2. EDITORIAL WORKFLOW STATE MACHINE
  // ==========================================================================
  describe('2. Editorial Workflow State Machine (draft -> review -> public -> hidden)', () => {
    it('enforces canonical transition order: draft -> review -> public', () => {
      expect(canTransitionPublication('draft', 'review').allowed).toBe(true);
      const directPublic = canTransitionPublication('draft', 'public');
      expect(directPublic.allowed).toBe(false);
      expect(directPublic.reason).toMatch(/harus melalui status "review"/i);
      expect(canTransitionPublication('review', 'public').allowed).toBe(true);
      expect(canTransitionPublication('review', 'draft').allowed).toBe(true);
    });

    it('supports retracting published content to hidden or draft (unpublish reliability)', async () => {
      const doc = await fetchAdminProjectProgress('dompetnalar');
      const milestone = doc.data?.roadmap.find((m) => m.id === 'ms_dn_core');
      expect(milestone?.publicationStatus).toBe('public');

      const hideRes = await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'milestone',
        itemId: 'ms_dn_core',
        targetStatus: 'hidden',
      });

      expect(hideRes.success).toBe(true);
      expect(hideRes.newStatus).toBe('hidden');

      const publicRes = await fetchPublicProjectProgress('dompetnalar');
      expect(publicRes.success).toBe(true);
      const publicMilestoneIds = publicRes.data?.roadmap.map((m) => m.id);
      expect(publicMilestoneIds).not.toContain('ms_dn_core');
    });

    it('rejects publishing a screenshot that has not been verified from real build and sanitized', async () => {
      const doc = await fetchAdminProjectProgress('dompetnalar');
      const unverifiedShot: ProgressScreenshot = {
        id: 'shot_unverified_test',
        caption: 'Unverified test shot',
        path: '/assets/test.png',
        publicationStatus: 'review',
        verifiedRealApp: false,
        sanitized: false,
        updatedAt: new Date().toISOString(),
      };

      await saveAdminProjectProgress('dompetnalar', {
        screenshots: [...doc.data!.screenshots, unverifiedShot],
      });

      const publishRes = await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'screenshot',
        itemId: 'shot_unverified_test',
        targetStatus: 'public',
      });

      expect(publishRes.success).toBe(false);
      expect(publishRes.error).toBe('UNVERIFIED_SCREENSHOT');
      expect(publishRes.message).toMatch(/build asli|sanitized/i);
    });

    it('guarantees GitHub push event does NOT automatically publish items or complete milestones', async () => {
      const gitSyncedEvent: ProgressEvent = {
        id: 'evt_git_push_001',
        eventType: 'general_update',
        title: 'Git Push Commit #12345',
        description: 'Auto sync from repository',
        timestamp: new Date().toISOString(),
        publicationStatus: 'draft',
      };

      await saveAdminProjectProgress('dompetnalar', {
        events: [gitSyncedEvent],
      });

      const publicRes = await fetchPublicProjectProgress('dompetnalar');
      const publicEventIds = publicRes.data?.events.map((e) => e.id);
      expect(publicEventIds).not.toContain('evt_git_push_001');

      const adminDoc = await fetchAdminProjectProgress('dompetnalar');
      const inProgressMilestone = adminDoc.data?.roadmap.find((m) => m.id === 'ms_dn_analytics');
      expect(inProgressMilestone?.implementationStatus).toBe('in_progress');
    });
  });

  // ==========================================================================
  // 3. STRICT PRIVACY & FAIL-CLOSED PUBLIC PROJECTION
  // ==========================================================================
  describe('3. Strict Privacy & Fail-Closed Public Projection (Zero Leakage)', () => {
    it('guarantees extractPublicProgress() scrubs all draft, review, and hidden items', () => {
      const mixedDoc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [
          {
            id: 'ms_public',
            title: 'Public Milestone',
            description: 'Visible',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'ms_draft',
            title: 'Draft Milestone',
            description: 'Should be hidden',
            implementationStatus: 'in_progress',
            publicationStatus: 'draft',
            order: 2,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'ms_review',
            title: 'Review Milestone',
            description: 'Should be hidden',
            implementationStatus: 'planned',
            publicationStatus: 'review',
            order: 3,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'ms_hidden',
            title: 'Hidden Milestone',
            description: 'Should be hidden',
            implementationStatus: 'completed',
            publicationStatus: 'hidden',
            order: 4,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [
          {
            id: 'feat_public',
            title: 'Public Feature',
            description: 'Visible',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
          {
            id: 'feat_draft',
            title: 'Draft Feature',
            description: 'Hidden',
            implementationStatus: 'planned',
            publicationStatus: 'draft',
            order: 2,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        screenshots: [],
        events: [],
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      const projected = extractPublicProgress(mixedDoc);

      expect(projected.roadmap.length).toBe(1);
      expect(projected.roadmap[0].id).toBe('ms_public');
      expect(projected.features.length).toBe(1);
      expect(projected.features[0].id).toBe('feat_public');

      expect((projected.roadmap[0] as any).publicationStatus).toBeUndefined();
      expect((projected.features[0] as any).publicationStatus).toBeUndefined();
    });

    it('scrubs credentials, file paths, and internal keys from public output', () => {
      const docWithSensitiveFields: any = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        internalRepoUrl: 'https://github.com/private/repo.git',
        developerNote: 'Do not deploy to prod yet',
        secretToken: 'dummy_super_secret_token_never_expose',
        roadmap: [
          {
            id: 'ms_safe',
            title: 'Aman',
            description: 'Deskripsi publik',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            internalBranch: 'feature/internal-branch',
            localFilePath: 'C:\\Users\\Admin\\project\\code.ts',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
        events: [],
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      const publicResult = extractPublicProgress(docWithSensitiveFields);
      const jsonString = JSON.stringify(publicResult);

      expect(jsonString).not.toMatch(/dummy_super_secret_token/);
      expect(jsonString).not.toMatch(/internalRepoUrl/);
      expect(jsonString).not.toMatch(/developerNote/);
      expect(jsonString).not.toMatch(/internalBranch/);
      expect(jsonString).not.toMatch(/C:\\Users\\Admin/);
    });
  });

  // ==========================================================================
  // 4. PROTECTED PREVIEW PROJECTION
  // ==========================================================================
  describe('4. Protected Preview Projection (Admin Only, Noindex)', () => {
    it('returns preview projection containing draft & review items but excluding hidden items', async () => {
      const previewRes = await fetchAdminProgressPreview('dompetnalar');
      expect(previewRes.success).toBe(true);
      expect(previewRes.data).toBeDefined();
      expect(previewRes.data?.isPreview).toBe(true);

      const milestoneIds = previewRes.data?.roadmap.map((m) => m.id);
      expect(milestoneIds).toContain('ms_dn_core');
      expect(milestoneIds).toContain('ms_dn_analytics');

      const hiddenCheck = previewRes.data?.roadmap.some((m: any) => m.publicationStatus === 'hidden');
      expect(hiddenCheck).toBe(false);
    });

    it('differentiates public projection from preview projection', async () => {
      const publicRes = await fetchPublicProjectProgress('dompetnalar');
      const previewRes = await fetchAdminProgressPreview('dompetnalar');

      expect(publicRes.success).toBe(true);
      expect(previewRes.success).toBe(true);
      expect(publicRes.data?.roadmap.length).toBe(2);
      expect(previewRes.data?.roadmap.length).toBe(3);
    });
  });

  // ==========================================================================
  // 5. AUDIT LOGGING & SECURITY SANITIZATION
  // ==========================================================================
  describe('5. Audit Logging & Security Sanitization', () => {
    it('records editorial actions with sanitized details and zero secret leaks', () => {
      const entry = recordProgressAuditLog({
        projectSlug: 'dompetnalar',
        action: 'UPDATE_PROGRESS_DOCUMENT',
        actorEmail: 'zweifeel@gmail.com',
        clientIpMasked: '10.0.0.***',
        result: 'SUCCESS',
        details: {
          milestoneCount: 3,
          authToken: 'sk_live_very_secret_token_123',
          apiKey: 'AIzaSySecretApiKeyMustBeRedacted',
          password: 'dummy_admin_password_123',
        },
      });

      expect(entry.id).toMatch(/^audit_prog_/);
      expect(entry.projectSlug).toBe('dompetnalar');
      expect(entry.actorEmail).toBe('zweifeel@gmail.com');
      expect(entry.details.milestoneCount).toBe(3);
      expect(entry.details.authToken).toBe('[REDACTED]');
      expect(entry.details.apiKey).toBe('[REDACTED]');
      expect(entry.details.password).toBe('[REDACTED]');
    });

    it('filters audit logs by project slug', () => {
      recordProgressAuditLog({
        projectSlug: 'dompetnalar',
        action: 'PUBLISH_MILESTONE',
        result: 'SUCCESS',
        details: { id: 'ms_dn_core' },
      });

      recordProgressAuditLog({
        projectSlug: 'mobile-kasir',
        action: 'PUBLISH_MILESTONE',
        result: 'SUCCESS',
        details: { id: 'ms_mk_pos' },
      });

      const dnLogs = getProgressAuditLogs('dompetnalar');
      const mkLogs = getProgressAuditLogs('mobile-kasir');

      expect(dnLogs.every((l) => l.projectSlug === 'dompetnalar')).toBe(true);
      expect(mkLogs.every((l) => l.projectSlug === 'mobile-kasir')).toBe(true);
    });
  });

  // ==========================================================================
  // 6. PROJECT ISOLATION & STRICT FREEZE (TBO ROBLOX)
  // ==========================================================================
  describe('6. Project Isolation & STRICT_FREEZE Enforcement for TBO', () => {
    it('verifies all 6 canonical projects are supported', () => {
      expect(CANONICAL_PROJECT_SLUGS).toHaveLength(6);
      expect(isCanonicalProjectSlug('dompetnalar')).toBe(true);
      expect(isCanonicalProjectSlug('idle-master')).toBe(true);
      expect(isCanonicalProjectSlug('mobile-kasir')).toBe(true);
      expect(isCanonicalProjectSlug('idle-mining')).toBe(true);
      expect(isCanonicalProjectSlug('the-broken-origin')).toBe(true);
      expect(isCanonicalProjectSlug('worklume')).toBe(true);
      expect(isCanonicalProjectSlug('non-canonical-app')).toBe(false);
    });

    it('strictly enforces REPOSITORY_FROZEN on The Broken Origin (TBO ROBLOX)', async () => {
      const syncInfo = getProjectSyncInfo('the-broken-origin');
      expect(syncInfo.syncStatus).toBe('BLOCKED');
      expect(syncInfo.isFrozen).toBe(true);
      expect(syncInfo.stage3Condition).toBe('STRICT_FREEZE');

      const updateRes = await saveAdminProjectProgress('the-broken-origin', {
        roadmap: [
          {
            id: 'ms_tbo_hack',
            title: 'Unauthorized Mutation',
            description: 'Should be rejected',
            implementationStatus: 'completed',
            publicationStatus: 'draft',
            order: 1,
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      expect(updateRes.success).toBe(false);
      expect(updateRes.error).toBe('REPOSITORY_FROZEN');

      const transitionRes = await transitionItemPublicationStatus({
        projectSlug: 'the-broken-origin',
        itemType: 'milestone',
        itemId: 'ms_tbo_hack',
        targetStatus: 'public',
      });

      expect(transitionRes.success).toBe(false);
      expect(transitionRes.error).toBe('REPOSITORY_FROZEN');
    });

    it('accurately reports Stage 3 & 4 baseline prerequisites in SyncInfo', () => {
      const dnSync = getProjectSyncInfo('dompetnalar');
      expect(dnSync.syncStatus).toBe('READY');
      expect(dnSync.stage3Condition).toBe('VISIBILITY_UNVERIFIED');
      expect(dnSync.requiresEditorialReview).toBe(true);

      const mkSync = getProjectSyncInfo('mobile-kasir');
      expect(mkSync.syncStatus).toBe('NOT_CONNECTED');
      expect(mkSync.stage3Condition).toBe('MISSING_GIT');

      const imSync = getProjectSyncInfo('idle-mining');
      expect(imSync.syncStatus).toBe('NOT_CONNECTED');
      expect(imSync.stage3Condition).toBe('MISSING_REMOTE');
    });
  });

  // ==========================================================================
  // 7. PUBLIC PROJECT DETAIL COMPONENT RESILIENCE & FALLBACK
  // ==========================================================================
  describe('7. Public Project Detail Component Resilience & Fallback', () => {
    it('returns empty lists gracefully when a project has no public progress yet', async () => {
      setProgressDocumentCache('idle-mining', createDefaultProgressDocument('idle-mining', 'Idle Mining', 'GAME'));

      const publicRes = await fetchPublicProjectProgress('idle-mining');
      expect(publicRes.success).toBe(true);
      expect(publicRes.data?.roadmap).toHaveLength(0);
      expect(publicRes.data?.features).toHaveLength(0);
      expect(publicRes.data?.screenshots).toHaveLength(0);
      expect(publicRes.data?.events).toHaveLength(0);
    });

    it('enforces independent separation between implementation and publication status', () => {
      const completedDraftMilestone: RoadmapMilestone = {
        id: 'ms_test_independent',
        title: 'Fitur Sudah Jadi Namun Masih Rahasia',
        description: 'Completed in dev, not yet ready for public marketing.',
        implementationStatus: 'completed',
        publicationStatus: 'draft',
        order: 1,
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const doc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [completedDraftMilestone],
        features: [],
        screenshots: [],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const publicProjection = extractPublicProgress(doc);
      expect(publicProjection.roadmap).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 8. SERVER-SIDE FUNCTIONS API ENDPOINTS & AUTHENTICATION GATES
  // ==========================================================================
  describe('8. Server-Side Functions API Endpoints & Auth Gate Verification', () => {
    it('public progress route /api/projects/:slug/progress returns public projection with valid CORS', async () => {
      const optRes = await publicProgressOptions();
      expect(optRes.status).toBe(204);

      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv as any,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.projectSlug).toBe('dompetnalar');
      expect(json.data.roadmap.length).toBe(2); // ms_dn_core and ms_dn_compliance
      // Draft milestone ms_dn_analytics must be excluded
      const ids = json.data.roadmap.map((m: any) => m.id);
      expect(ids).not.toContain('ms_dn_analytics');
    });

    it('admin progress route /api/admin/progress/:slug blocks unauthenticated requests with HTTP 401', async () => {
      const unauthReq = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar');
      const res = await adminProgressGet({
        request: unauthReq,
        params: { slug: 'dompetnalar' },
        env: mockEnv as any,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('admin preview route /api/admin/progress/:slug/preview injects noindex and returns draft/review items for authenticated admin', async () => {
      const optRes = await adminPreviewOptions();
      expect(optRes.status).toBe(204);
      expect(optRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      // Create valid session token
      const now = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: now,
          exp: now + 3600,
        },
        TEST_SECRET
      );

      const authReq = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar/preview', {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const res = await adminPreviewGet({
        request: authReq,
        params: { slug: 'dompetnalar' },
        env: mockEnv as any,
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      expect(res.headers.get('Cache-Control')).toMatch(/no-store|no-cache/);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isPreview).toBe(true);
      const ids = json.data.roadmap.map((m: any) => m.id);
      // Both public and draft items present in preview
      expect(ids).toContain('ms_dn_core');
      expect(ids).toContain('ms_dn_analytics');
    });

    it('admin progress mutation endpoint /api/admin/progress/:slug validates CSRF protection', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: now,
          exp: now + 3600,
        },
        TEST_SECRET
      );

      // Missing Sec-Fetch-Site and Origin header -> CSRF failure
      const invalidCsrfReq = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
          Origin: 'https://evil-attacker.com',
        },
        body: JSON.stringify({ document: { projectName: 'Hacked' } }),
      });

      const res = await adminProgressPost({
        request: invalidCsrfReq,
        params: { slug: 'dompetnalar' },
        env: mockEnv as any,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/CSRF/i);
    });
  });

  // ==========================================================================
  // 9. DOM COMPONENT ACCEPTANCE: ProjectDetailPage PUBLIC RENDERING
  // ==========================================================================
  describe('9. DOM Component Acceptance: ProjectDetailPage Public Rendering', () => {
    it('renders DompetNalar detail page with Strategic Roadmap and Verified Features from public projection', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/projects/dompetnalar']}>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // 1. Core header verification
      expect(screen.getByRole('heading', { level: 1, name: /DompetNalar/i })).toBeInTheDocument();

      // 2. Strategic Roadmap Section
      expect(screen.getByRole('heading', { level: 2, name: /Strategic Roadmap/i })).toBeInTheDocument();
      // Public milestones rendered
      expect(screen.getByText('Arsitektur Inti & Manajemen Anggaran')).toBeInTheDocument();
      expect(screen.getByText('Google Play Compliance & AdMob app-ads.txt')).toBeInTheDocument();

      // Invariant: Draft milestone ms_dn_analytics must NOT be rendered on public page!
      expect(screen.queryByText('Grafik Analisis Pengeluaran & Ekspor CSV')).not.toBeInTheDocument();

      // 3. Verified Features Section
      expect(screen.getByRole('heading', { level: 2, name: /Spesifikasi Fitur Terverifikasi/i })).toBeInTheDocument();
      expect(screen.getByText('Pencatatan Pemasukan & Pengeluaran')).toBeInTheDocument();
      expect(screen.getByText('Penyimpanan Lokal Terenkripsi (Room DB)')).toBeInTheDocument();
      // Draft feature feat_dn_03 must NOT be rendered
      expect(screen.queryByText('Laporan Visual Distribusi Pengeluaran')).not.toBeInTheDocument();

      // 4. Activity Timeline Section
      expect(screen.getByRole('heading', { level: 2, name: /Linimasa Perkembangan Proyek/i })).toBeInTheDocument();
      expect(screen.getByText('Milestone Kepatuhan Google Play Terpenuhi')).toBeInTheDocument();
      // Internal git push event must NOT be rendered
      expect(screen.queryByText('Internal Sync dari Git Push')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 10. DOM COMPONENT ACCEPTANCE: ProjectDetailPage PREVIEW MODE
  // ==========================================================================
  describe('10. DOM Component Acceptance: ProjectDetailPage Protected Preview Mode', () => {
    it('displays prominent [PREVIEW MODE] banner and renders draft items when query param ?preview=true is set', async () => {
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/projects/dompetnalar?preview=true']}>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // 1. Preview Banner
      expect(screen.getByText(/\[PREVIEW MODE\]/i)).toBeInTheDocument();
      expect(screen.getByText('NOINDEX')).toBeInTheDocument();

      // 2. Draft items ARE rendered in preview mode
      expect(screen.getByText('Grafik Analisis Pengeluaran & Ekspor CSV')).toBeInTheDocument();
      expect(screen.getByText('Laporan Visual Distribusi Pengeluaran')).toBeInTheDocument();
    });
  });
});
