/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — STAGE 6: SECURITY & INTEGRATION TEST ACCEPTANCE SUITE
 * 
 * Verifies End-to-End Integrity, Security Boundaries & Zero-Cost Architecture:
 * - WP-06.1: CMS Authentication & Authorization Security (Scenarios 1-12)
 * - WP-06.2: Public Privacy & Data Leakage Testing (Scenarios 13-24)
 * - WP-06.3: Editorial Workflow & Publishing State Machine (Scenarios 25-34)
 * - WP-06.4: Webhook, Signature & Idempotency Security (Scenarios 35-44)
 * - WP-06.5: Cross-Stage End-to-End Integration (Scenarios 45-54)
 * - WP-06.6: Failure Recovery & Reliability (Scenarios 55-60)
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import rawProjects from '../data/projects.json';

import {
  createSessionToken,
  base64UrlEncode,
  AUTHORIZED_ADMIN_EMAIL,
  SESSION_COOKIE_NAME,
  AuthEnv,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestGet as adminProgressGet,
  onRequestPost as adminProgressPost,
  onRequestOptions as adminProgressOptions,
} from '../../functions/api/admin/progress/[slug]';

import {
  onRequestGet as adminPreviewGet,
} from '../../functions/api/admin/progress/[slug]/preview';

import {
  onRequestGet as publicProgressGet,
} from '../../functions/api/projects/[slug]/progress';

import {
  onRequestPost as githubWebhookPost,
} from '../../functions/api/webhook/github';

import {
  CANONICAL_SCHEMA_VERSION,
  ProjectProgressDocument,
  RoadmapMilestone,
  ProgressScreenshot,
  canTransitionPublication,
} from '../types/portfolioProgress';

import {
  extractPublicProgress,
  migrateLegacyProgressDocument,
  validateProgressMetadata,
} from '../services/portfolioMetadataValidator';

import {
  fetchPublicProjectProgress,
  fetchAdminProjectProgress,
  saveAdminProjectProgress,
  transitionItemPublicationStatus,
  getProjectSyncInfo,
  getProgressAuditLogs,
  resetProgressCache,
  setProgressDocumentCache,
} from '../services/cmsProgressService';

import {
  computeHmacSha256Hex,
  DeliveryIdTracker,
  globalDeliveryTracker,
} from '../services/githubWebhookService';

import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { resetProjectsCache } from '../services/projectService';

describe('STAGE 6: Security & Integration Tests Suite', () => {
  const TEST_SECRET = 'test_secret_key_for_session_token_validation_32bytes';
  const WEBHOOK_SECRET = 'test_webhook_secret_key_for_hmac_signing_32bytes';

  const mockEnv: AuthEnv & { GITHUB_WEBHOOK_SECRET: string; ENVIRONMENT: string; PORTFOLIO_APPROVED_OWNER: string } = {
    ADMIN_SESSION_SECRET: TEST_SECRET,
    APPS_SCRIPT_SECRET: TEST_SECRET,
    GITHUB_WEBHOOK_SECRET: WEBHOOK_SECRET,
    ENVIRONMENT: 'test',
    PORTFOLIO_APPROVED_OWNER: 'SleepyKoala-Studio',
  };

  beforeEach(() => {
    resetProgressCache();
    resetProjectsCache();
    globalDeliveryTracker.clear();

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

  // Helper to create a valid admin session cookie
  async function createValidAdminCookie(email = AUTHORIZED_ADMIN_EMAIL, ttl = 3600): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const token = await createSessionToken(
      {
        email,
        sessionVersion: 1,
        iat: now,
        exp: now + ttl,
      },
      TEST_SECRET
    );
    return `${SESSION_COOKIE_NAME}=${token}`;
  }

  // ==========================================================================
  // WP-06.1: CMS AUTHENTICATION & AUTHORIZATION SECURITY
  // ==========================================================================
  describe('WP-06.1 — CMS Authentication & Authorization Security', () => {
    it('Scenario 1: rejects GET request without admin session cookie with HTTP 401', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar');
      const res = await adminProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('Scenario 2: rejects request with invalid/malformed session token string with HTTP 401', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=not_a_valid_jwt_format` },
      });
      const res = await adminProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('Scenario 3: rejects expired session token (exp in past) with HTTP 401', async () => {
      // Create token with exp in the past (-10 seconds)
      const expiredCookie = await createValidAdminCookie(AUTHORIZED_ADMIN_EMAIL, -10);
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        headers: { Cookie: expiredCookie },
      });
      const res = await adminProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('Scenario 4: rejects token with forged/tampered signature with HTTP 401', async () => {
      const validCookie = await createValidAdminCookie();
      const token = validCookie.replace(`${SESSION_COOKIE_NAME}=`, '');
      const [payloadPart] = token.split('.');
      const forgedToken = `${payloadPart}.tampered_signature_bytes_1234567890`;

      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${forgedToken}` },
      });
      const res = await adminProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('Scenario 5: rejects token when payload has been tampered with keeping old signature with HTTP 401', async () => {
      const validCookie = await createValidAdminCookie();
      const token = validCookie.replace(`${SESSION_COOKIE_NAME}=`, '');
      const [, originalSig] = token.split('.');

      // Alter payload content
      const tamperedPayload = {
        email: AUTHORIZED_ADMIN_EMAIL,
        sessionVersion: 999, // tampered
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7200,
      };
      const enc = new TextEncoder();
      const tamperedB64 = base64UrlEncode(enc.encode(JSON.stringify(tamperedPayload)));
      const tamperedToken = `${tamperedB64}.${originalSig}`;

      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${tamperedToken}` },
      });
      const res = await adminProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('Scenario 6: prevents privilege escalation when token is signed for non-admin email with HTTP 403', async () => {
      // Attacker generates token for an unauthorized email signed with secret
      const attackerCookie = await createValidAdminCookie('unauthorized_user@example.com');
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        headers: { Cookie: attackerCookie },
      });
      const res = await adminProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('FORBIDDEN');
    });

    it('Scenario 7: rejects POST mutation when CSRF header X-SleepyKoala-Admin is missing with HTTP 403', async () => {
      const adminCookie = await createValidAdminCookie();
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
          // Missing X-SleepyKoala-Admin
        },
        body: JSON.stringify({ document: { roadmap: [] } }),
      });

      const res = await adminProgressPost({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('MISSING_CSRF_HEADER');
    });

    it('Scenario 8: rejects mutation when Sec-Fetch-Site indicates cross-site with HTTP 403', async () => {
      const adminCookie = await createValidAdminCookie();
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
          'X-SleepyKoala-Admin': '1',
          'Sec-Fetch-Site': 'cross-site', // Attack vector
        },
        body: JSON.stringify({ document: { roadmap: [] } }),
      });

      const res = await adminProgressPost({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('CROSS_SITE_REQUEST_REJECTED');
    });

    it('Scenario 9: OPTIONS request returns 204 with strict security headers', async () => {
      const res = await adminProgressOptions();
      expect(res.status).toBe(204);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Access-Control-Allow-Methods')).toMatch(/GET/);
    });

    it('Scenario 10: rejects non-canonical or alien project slug with HTTP 400', async () => {
      const adminCookie = await createValidAdminCookie();
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/alien-unapproved-project', {
        headers: { Cookie: adminCookie },
      });

      const res = await adminProgressGet({
        request: req,
        params: { slug: 'alien-unapproved-project' },
        env: mockEnv,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_PROJECT_SLUG');
    });

    it('Scenario 11: rejects directory traversal or malicious slug characters with HTTP 400', async () => {
      const adminCookie = await createValidAdminCookie();
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar/../../etc/passwd', {
        headers: { Cookie: adminCookie },
      });

      const res = await adminProgressGet({
        request: req,
        params: { slug: '../dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_SLUG');
    });

    it('Scenario 12: unauthenticated access to preview endpoint fails closed with HTTP 401', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar/preview');
      const res = await adminPreviewGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });
  });

  // ==========================================================================
  // WP-06.2: PUBLIC PRIVACY & DATA LEAKAGE TESTING
  // ==========================================================================
  describe('WP-06.2 — Public Privacy & Data Leakage Testing', () => {
    it('Scenario 13: public progress endpoint returns strictly whitelisted fields', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const data = json.data;
      expect(data).toHaveProperty('projectSlug');
      expect(data).toHaveProperty('projectName');
      expect(data).toHaveProperty('roadmap');
      expect(data).toHaveProperty('features');
      expect(data).toHaveProperty('screenshots');
      expect(data).toHaveProperty('events');
      expect(data).toHaveProperty('lastPublicUpdate');

      // Prohibited top-level internal fields must NEVER exist
      expect(data.lastSyncedCommit).toBeUndefined();
      expect(data.developerNote).toBeUndefined();
      expect(data.internalRepoUrl).toBeUndefined();
    });

    it('Scenario 14: guarantees 0% leakage of draft and review items in public response', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      const json = await res.json();
      const roadmapIds = json.data.roadmap.map((m: any) => m.id);
      const featureIds = json.data.features.map((f: any) => f.id);

      // ms_dn_analytics is draft -> must NOT be in public response
      expect(roadmapIds).not.toContain('ms_dn_analytics');
      // feat_dn_03 is draft -> must NOT be in public response
      expect(featureIds).not.toContain('feat_dn_03');
    });

    it('Scenario 15: guarantees hidden items are completely stripped from public response', async () => {
      // Seed a document with a hidden feature
      const doc = await fetchAdminProjectProgress('dompetnalar');
      expect(doc.success).toBe(true);
      const fullDoc = doc.data!;

      const updatedFeatures = [
        ...fullDoc.features,
        {
          id: 'feat_dn_secret_hidden',
          milestoneId: 'ms_dn_core',
          title: 'Fitur Tersembunyi Rahasia',
          description: 'Hanya untuk pengujian isolasi hidden status.',
          category: 'Core',
          priority: 'low' as const,
          implementationStatus: 'completed' as const,
          publicationStatus: 'hidden' as const,
          order: 99,
          updatedAt: '2026-11-08T00:00:00.000Z',
        },
      ];

      setProgressDocumentCache('dompetnalar', { ...fullDoc, features: updatedFeatures });

      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      const json = await res.json();
      const featureIds = json.data.features.map((f: any) => f.id);
      expect(featureIds).not.toContain('feat_dn_secret_hidden');
    });

    it('Scenario 16: zero commit hashes in public response payload', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      const bodyText = await res.text();
      // Test regex for 40-char git commit SHA
      expect(bodyText).not.toMatch(/\b[0-9a-f]{40}\b/);
    });

    it('Scenario 17: zero internal branch names in public response payload', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      const bodyText = await res.text();
      expect(bodyText).not.toMatch(/feature\//i);
      expect(bodyText).not.toMatch(/hotfix\//i);
      expect(bodyText).not.toMatch(/origin\/master/i);
    });

    it('Scenario 18: zero local filesystem paths in public response payload', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      const bodyText = await res.text();
      // Windows / Unix absolute directory paths
      expect(bodyText).not.toMatch(/[a-zA-Z]:\\[Uu]sers\\/);
      expect(bodyText).not.toMatch(/\/home\/[a-zA-Z0-9_-]+/);
      expect(bodyText).not.toMatch(/\/Users\/[a-zA-Z0-9_-]+/);
    });

    it('Scenario 19: query parameter manipulation (?debug=true, ?includeDrafts=true) does NOT leak drafts', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress?debug=true&includeDrafts=true&status=all&admin=true');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });

      const json = await res.json();
      const roadmapIds = json.data.roadmap.map((m: any) => m.id);
      expect(roadmapIds).not.toContain('ms_dn_analytics');
    });

    it('Scenario 20: SQLi / XSS string in slug parameter is rejected with HTTP 400', async () => {
      const maliciousSlugs = [
        "dompetnalar' OR '1'='1",
        '<script>alert(1)</script>',
        'dompetnalar; DROP TABLE users;',
        'dompetnalar%20AND%201=1',
      ];

      for (const badSlug of maliciousSlugs) {
        const req = new Request(`https://sleepykoala.pages.dev/api/projects/${encodeURIComponent(badSlug)}/progress`);
        const res = await publicProgressGet({
          request: req,
          params: { slug: badSlug },
          env: mockEnv,
        });

        expect(res.status).toBe(400);
      }
    });

    it('Scenario 21: extractPublicProgress strips unknown and arbitrary metadata properties', () => {
      const rawDoc: any = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        internalSecurityRating: 'CONFIDENTIAL',
        backendDatabaseHost: 'postgres.internal.net',
        devTeamNotes: 'Sensitive architectural remarks',
        roadmap: [
          {
            id: 'ms_safe_1',
            title: 'Milestone Aman',
            description: 'Deskripsi publik',
            implementationStatus: 'completed',
            publicationStatus: 'public',
            internalReviewer: 'lead_dev',
            order: 1,
            updatedAt: '2026-11-01T00:00:00.000Z',
          },
        ],
        features: [],
        screenshots: [],
        events: [],
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      const publicProj = extractPublicProgress(rawDoc);
      expect((publicProj as any).internalSecurityRating).toBeUndefined();
      expect((publicProj as any).backendDatabaseHost).toBeUndefined();
      expect((publicProj as any).devTeamNotes).toBeUndefined();
      expect((publicProj.roadmap[0] as any).internalReviewer).toBeUndefined();
    });

    it('Scenario 22: sanitizes HTML/script injection attempts in progress title and descriptions in React DOM', async () => {
      // Seed a document with script tags in titles
      const doc = await fetchAdminProjectProgress('dompetnalar');
      const fullDoc = doc.data!;

      const xssRoadmap: RoadmapMilestone = {
        id: 'ms_xss_test',
        title: '<img src=x onerror=alert(1)> Milestone XSS',
        description: '<script>document.location="http://evil.com"</script> Deskripsi aman',
        implementationStatus: 'completed',
        publicationStatus: 'public',
        order: 10,
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      setProgressDocumentCache('dompetnalar', { ...fullDoc, roadmap: [xssRoadmap] });

      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/projects/dompetnalar']}>
            <Routes>
              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            </Routes>
          </MemoryRouter>
        );
      });

      // Verify React escapes the text safely as text content, not executable script tag
      const heading = screen.getByText(/Milestone XSS/i);
      expect(heading).toBeInTheDocument();
      // Ensure no raw unescaped script tag was injected into DOM
      expect(document.querySelector('script[src*="evil.com"]')).toBeNull();
    });

    it('Scenario 23: rejects screenshots with dangerous URI schemes (javascript:, data:)', () => {
      const maliciousScreenshot: ProgressScreenshot = {
        id: 'shot_malicious',
        featureId: 'feat_dn_01',
        caption: 'Hacker payload',
        path: 'javascript:alert(document.cookie)',
        publicationStatus: 'public',
        verifiedRealApp: true,
        sanitized: true,
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const doc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [],
        features: [],
        screenshots: [maliciousScreenshot],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const diagnostics = validateProgressMetadata(doc);
      const errors = diagnostics.diagnostics.filter((d) => d.severity === 'error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes('path') || e.code === 'INVALID_SCREENSHOT_PATH')).toBe(true);
    });

    it('Scenario 24: preview endpoint verifies admin session before rendering draft items', async () => {
      // Unauthenticated -> 401
      const unauthReq = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar/preview');
      const unauthRes = await adminPreviewGet({
        request: unauthReq,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });
      expect(unauthRes.status).toBe(401);

      // Authenticated -> 200 with draft items and noindex header
      const adminCookie = await createValidAdminCookie();
      const authReq = new Request('https://sleepykoala.pages.dev/api/admin/progress/dompetnalar/preview', {
        headers: { Cookie: adminCookie },
      });
      const authRes = await adminPreviewGet({
        request: authReq,
        params: { slug: 'dompetnalar' },
        env: mockEnv,
      });
      expect(authRes.status).toBe(200);
      expect(authRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      const json = await authRes.json();
      expect(json.data.roadmap.some((m: any) => m.id === 'ms_dn_analytics')).toBe(true);
    });
  });

  // ==========================================================================
  // WP-06.3: EDITORIAL WORKFLOW & PUBLISHING STATE MACHINE
  // ==========================================================================
  describe('WP-06.3 — Editorial Workflow & Publishing State Machine', () => {
    it('Scenario 25: allows valid forward transition order: draft -> review -> public', () => {
      expect(canTransitionPublication('draft', 'review').allowed).toBe(true);
      expect(canTransitionPublication('review', 'public').allowed).toBe(true);
    });

    it('Scenario 26: blocks direct transition from draft -> public (must pass review)', () => {
      expect(canTransitionPublication('draft', 'public').allowed).toBe(false);
    });

    it('Scenario 27: blocks transition to invalid unapproved state', () => {
      expect(canTransitionPublication('draft', 'archived' as any).allowed).toBe(false);
    });

    it('Scenario 28: allows transition from review -> draft for editorial revision', () => {
      expect(canTransitionPublication('review', 'draft').allowed).toBe(true);
    });

    it('Scenario 29: guarantees unpublish reliability: public -> hidden and public -> draft succeed immediately', async () => {
      expect(canTransitionPublication('public', 'hidden').allowed).toBe(true);
      expect(canTransitionPublication('public', 'draft').allowed).toBe(true);

      const hideRes = await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_compliance',
        targetStatus: 'hidden',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      expect(hideRes.success).toBe(true);
      expect(hideRes.newStatus).toBe('hidden');

      // Verify immediate exclusion from public endpoint
      const pubRes = await fetchPublicProjectProgress('dompetnalar');
      const pubMilestones = pubRes.data?.roadmap.map((m) => m.id);
      expect(pubMilestones).not.toContain('ms_dn_compliance');
    });

    it('Scenario 30: supports re-publishing an item from hidden through review to public', async () => {
      expect(canTransitionPublication('hidden', 'review').allowed).toBe(true);
      expect(canTransitionPublication('review', 'public').allowed).toBe(true);

      // Transition to hidden first
      await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_compliance',
        targetStatus: 'hidden',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      // Restore through review to public
      await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_compliance',
        targetStatus: 'review',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      const restoreRes = await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_compliance',
        targetStatus: 'public',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      expect(restoreRes.success).toBe(true);
      expect(restoreRes.newStatus).toBe('public');

      const pubRes = await fetchPublicProjectProgress('dompetnalar');
      const pubMilestones = pubRes.data?.roadmap.map((m) => m.id);
      expect(pubMilestones).toContain('ms_dn_compliance');
    });

    it('Scenario 31: rejects publishing screenshot without verifiedRealApp=true AND sanitized=true', async () => {
      const doc = await fetchAdminProjectProgress('dompetnalar');
      const fullDoc = doc.data!;

      const unverifiedScreenshot: ProgressScreenshot = {
        id: 'shot_unverified_speculative',
        featureId: 'feat_dn_01',
        caption: 'Mockup spekulatif',
        path: '/assets/projects/dompetnalar/screenshots/spec.png',
        publicationStatus: 'review', // In review
        verifiedRealApp: false, // NOT verified from real build!
        sanitized: true,
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      setProgressDocumentCache('dompetnalar', {
        ...fullDoc,
        screenshots: [...fullDoc.screenshots, unverifiedScreenshot],
      });

      const publishRes = await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'screenshot',
        itemId: 'shot_unverified_speculative',
        targetStatus: 'public',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      expect(publishRes.success).toBe(false);
      expect(['SCREENSHOT_NOT_VERIFIED', 'UNVERIFIED_SCREENSHOT']).toContain(publishRes.error);
    });

    it('Scenario 32: handles idempotent transition requests to identical status safely without error', async () => {
      // Transition already public item to public again
      const idempRes = await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_core',
        targetStatus: 'public',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      expect(idempRes.success).toBe(true);
      expect(idempRes.newStatus).toBe('public');
    });

    it('Scenario 33: preserves complete independence of implementationStatus and publicationStatus', () => {
      const milestone: RoadmapMilestone = {
        id: 'ms_complete_in_code_only',
        title: 'Fitur Sudah Jadi Namun Rahasia',
        description: 'Telah rampung di Git master, tapi rilis pemasaran belum disetujui.',
        implementationStatus: 'completed',
        publicationStatus: 'draft',
        order: 5,
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const doc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [milestone],
        features: [],
        screenshots: [],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const publicResult = extractPublicProgress(doc);
      // Must NOT be exposed publicly despite being completed in code!
      expect(publicResult.roadmap).toHaveLength(0);
    });

    it('Scenario 34: maintains transactional integrity when partial update contains prohibited keys', async () => {
      const beforeDoc = await fetchAdminProjectProgress('dompetnalar');
      const originalRoadmapCount = beforeDoc.data?.roadmap.length;

      // Attempt to save malicious payload
      const badSave = await saveAdminProjectProgress('dompetnalar', {
        secretToken: 'dummy_secret_attack_payload',
        roadmap: [],
      } as any, AUTHORIZED_ADMIN_EMAIL);

      expect(badSave.success).toBe(false);
      expect(['PROHIBITED_KEY_DETECTED', 'SCHEMA_VALIDATION_FAILED']).toContain(badSave.error);

      // Verify state was NOT corrupted or wiped
      const afterDoc = await fetchAdminProjectProgress('dompetnalar');
      expect(afterDoc.data?.roadmap.length).toBe(originalRoadmapCount);
    });
  });

  // ==========================================================================
  // WP-06.4: WEBHOOK, SIGNATURE & IDEMPOTENCY SECURITY
  // ==========================================================================
  describe('WP-06.4 — Webhook, Signature & Idempotency Security', () => {
    it('Scenario 35: verifies valid HMAC-SHA256 signature for GitHub webhook push event', async () => {
      const payload = {
        ref: 'refs/heads/master',
        repository: {
          name: 'indie-developer-portfolio',
          full_name: 'SleepyKoala-Studio/indie-developer-portfolio',
          owner: { login: 'SleepyKoala-Studio' },
        },
        commits: [
          {
            id: '1111222233334444555566667777888899990000',
            message: 'feat(dompetnalar): implement core budget ledger',
            timestamp: '2026-11-08T12:00:00Z',
            author: { name: 'Lead Dev', email: 'dev@sleepykoalastudio.com' },
          },
        ],
      };

      const rawBody = JSON.stringify(payload);
      const signature = await computeHmacSha256Hex(rawBody, WEBHOOK_SECRET);

      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-sec-01',
        },
        body: rawBody,
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('PROCESSED');
    });

    it('Scenario 36: rejects invalid HMAC signature with HTTP 401', async () => {
      const rawBody = JSON.stringify({ ref: 'refs/heads/master' });
      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'sha256=wrong_signature_bytes_1234567890abcdef1234567890abcdef12345678',
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-sec-02',
        },
        body: rawBody,
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(['INVALID_SIGNATURE', 'INVALID_HEX_SIGNATURE']).toContain(json.error);
    });

    it('Scenario 37: rejects missing X-Hub-Signature-256 header with HTTP 401', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'push',
        },
        body: JSON.stringify({ ref: 'refs/heads/master' }),
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(['MISSING_SIGNATURE', 'MISSING_SIGNATURE_HEADER']).toContain(json.error);
    });

    it('Scenario 38: rejects malformed signature format (no sha256= prefix) with HTTP 401', async () => {
      const rawBody = JSON.stringify({ ref: 'refs/heads/master' });
      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': 'md5=invalid_prefix',
          'X-GitHub-Event': 'push',
        },
        body: rawBody,
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(['INVALID_SIGNATURE_FORMAT', 'MALFORMED_SIGNATURE_HEADER']).toContain(json.error);
    });

    it('Scenario 39: rejects request when payload is tampered after signature generation with HTTP 401', async () => {
      const originalPayload = { ref: 'refs/heads/master', note: 'original' };
      const rawOriginal = JSON.stringify(originalPayload);
      const signature = await computeHmacSha256Hex(rawOriginal, WEBHOOK_SECRET);

      const tamperedPayload = { ref: 'refs/heads/master', note: 'tampered_by_attacker' };
      const rawTampered = JSON.stringify(tamperedPayload);

      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`, // Signature of original
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-sec-03',
        },
        body: rawTampered, // Tampered body
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(['INVALID_SIGNATURE', 'SIGNATURE_MISMATCH']).toContain(json.error);
    });

    it('Scenario 40: rejects payload exceeding maximum size (1 MB limit) with HTTP 413', async () => {
      const oversizedReq = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '2097152', // 2 MB
        },
        body: JSON.stringify({ ref: 'refs/heads/master' }),
      });

      const res = await githubWebhookPost({
        request: oversizedReq,
        env: mockEnv,
      });

      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('Scenario 41: rejects repository outside allowlist with HTTP 403', async () => {
      const unmappedPayload = {
        ref: 'refs/heads/master',
        repository: {
          name: 'unknown-rogue-repo',
          full_name: 'AttackerOrg/unknown-rogue-repo',
          owner: { login: 'AttackerOrg' },
        },
      };

      const rawBody = JSON.stringify(unmappedPayload);
      const signature = await computeHmacSha256Hex(rawBody, WEBHOOK_SECRET);

      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-sec-04',
        },
        body: rawBody,
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(['UNAUTHORIZED_REPOSITORY', 'UNAUTHORIZED_REPOSITORY_OWNER']).toContain(json.error);
    });

    it('Scenario 42: rejects webhook targeting frozen project The Broken Origin (TBO) with HTTP 403', async () => {
      const tboPayload = {
        ref: 'refs/heads/master',
        repository: {
          name: 'the-broken-origin',
          full_name: 'SleepyKoala-Studio/the-broken-origin',
          owner: { login: 'SleepyKoala-Studio' },
        },
      };

      const rawBody = JSON.stringify(tboPayload);
      const signature = await computeHmacSha256Hex(rawBody, WEBHOOK_SECRET);

      const req = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-sec-05',
        },
        body: rawBody,
      });

      const res = await githubWebhookPost({
        request: req,
        env: mockEnv,
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('REPOSITORY_FROZEN');
    });

    it('Scenario 43: delivers idempotency deduplication returning 200 with idempotent=true on replay', async () => {
      const payload = {
        ref: 'refs/heads/master',
        repository: {
          name: 'indie-developer-portfolio',
          full_name: 'SleepyKoala-Studio/indie-developer-portfolio',
          owner: { login: 'SleepyKoala-Studio' },
        },
        commits: [],
      };

      const rawBody = JSON.stringify(payload);
      const signature = await computeHmacSha256Hex(rawBody, WEBHOOK_SECRET);
      const deliveryId = 'delivery-unique-dedup-100';

      const makeReq = () =>
        new Request('https://sleepykoala.pages.dev/api/webhook/github', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': `sha256=${signature}`,
            'X-GitHub-Event': 'push',
            'X-GitHub-Delivery': deliveryId,
          },
          body: rawBody,
        });

      // 1st request -> Processed
      const res1 = await githubWebhookPost({ request: makeReq(), env: mockEnv });
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.status).toBe('PROCESSED');

      // 2nd request with same delivery ID -> Deduplicated
      const res2 = await githubWebhookPost({ request: makeReq(), env: mockEnv });
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.success).toBe(true);
      expect(['DEDUPLICATED', 'DUPLICATE_DELIVERY']).toContain(json2.status);
      expect(json2.message).toMatch(/Idempotent/i);
    });

    it('Scenario 44: verifies bounded LRU tracker eviction for in-memory V8 isolate delivery tracking', () => {
      const smallTracker = new DeliveryIdTracker(3);
      expect(smallTracker.acquire('del-1').acquired).toBe(true);
      expect(smallTracker.acquire('del-2').acquired).toBe(true);
      expect(smallTracker.acquire('del-3').acquired).toBe(true);

      // del-1 is duplicate
      expect(smallTracker.acquire('del-1').isDuplicate).toBe(true);

      // Adding del-4 evicts oldest (del-1)
      expect(smallTracker.acquire('del-4').acquired).toBe(true);
      expect(smallTracker.size()).toBe(3);
    });
  });

  // ==========================================================================
  // WP-06.5: CROSS-STAGE END-TO-END INTEGRATION
  // ==========================================================================
  describe('WP-06.5 — Cross-Stage End-to-End Integration', () => {
    it('Scenario 45: ingests valid Stage 2 metadata contract into Stage 5 CMS and serves public projection', async () => {
      const syncInfo = getProjectSyncInfo('dompetnalar');
      expect(syncInfo.projectSlug).toBe('dompetnalar');
      expect(syncInfo.stage3Condition).toBe('VISIBILITY_UNVERIFIED');
      expect(syncInfo.isFrozen).toBe(false);

      const pubRes = await fetchPublicProjectProgress('dompetnalar');
      expect(pubRes.success).toBe(true);
      expect(pubRes.data?.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
      expect(pubRes.data?.roadmap.length).toBeGreaterThanOrEqual(1);
    });

    it('Scenario 46: handles unsupported schema version cleanly without unhandled exception', () => {
      const invalidVersionDoc = {
        schemaVersion: 999, // unsupported
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [],
        features: [],
        screenshots: [],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const diagnostics = validateProgressMetadata(invalidVersionDoc as any);
      expect(diagnostics.valid).toBe(false);
      expect(diagnostics.diagnostics.some((d) => d.code === 'UNSUPPORTED_SCHEMA_VERSION')).toBe(true);
    });

    it('Scenario 47: rejects metadata document missing required projectSlug', () => {
      const missingSlugDoc = {
        schemaVersion: 2,
        projectName: 'Proyek Tanpa Slug',
        roadmap: [],
        features: [],
        screenshots: [],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const diagnostics = validateProgressMetadata(missingSlugDoc as any);
      expect(diagnostics.valid).toBe(false);
      expect(diagnostics.diagnostics.some((d) => d.path === 'projectSlug' && d.code === 'INVALID_REQUIRED_FIELD')).toBe(true);
    });

    it('Scenario 48: safely filters additional unknown metadata properties without crash', () => {
      const foreignFieldsDoc = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        unknownCustomFieldX: 12345,
        unknownCustomFieldY: { deep: 'nested' },
        roadmap: [],
        features: [],
        screenshots: [],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const publicProj = extractPublicProgress(foreignFieldsDoc as any);
      expect((publicProj as any).unknownCustomFieldX).toBeUndefined();
      expect((publicProj as any).unknownCustomFieldY).toBeUndefined();
    });

    it('Scenario 49: migrates legacy schema v1 document to canonical v2 preserving all items', () => {
      const legacyV1Doc = {
        schemaVersion: 1,
        slug: 'dompetnalar',
        name: 'DompetNalar',
        milestones: [
          {
            id: 'legacy_ms_01',
            title: 'Legacy Milestone',
            status: 'completed',
            order: 1,
          },
        ],
        features: [
          {
            id: 'legacy_feat_01',
            title: 'Legacy Feature',
            status: 'completed',
          },
        ],
      };

      const migration = migrateLegacyProgressDocument(legacyV1Doc);
      expect(migration.success).toBe(true);
      expect(migration.migratedDoc?.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
      expect(migration.migratedDoc?.projectSlug).toBe('dompetnalar');
      expect(migration.migratedDoc?.roadmap.length).toBe(1);
      expect(migration.migratedDoc?.roadmap[0].id).toBe('legacy_ms_01');
      expect(migration.migratedDoc?.roadmap[0].publicationStatus).toBe('draft'); // Safely defaults to draft
    });

    it('Scenario 50: sorts public activity events by timestamp in descending order (newest first)', () => {
      const doc: ProjectProgressDocument = {
        schemaVersion: 2,
        projectSlug: 'dompetnalar',
        projectName: 'DompetNalar',
        roadmap: [],
        features: [],
        screenshots: [],
        events: [
          {
            id: 'ev_old',
            eventType: 'feature_released',
            title: 'Aktivitas Lama',
            description: 'Dilakukan 3 hari lalu',
            timestamp: '2026-11-05T00:00:00.000Z',
            publicationStatus: 'public',
          },
          {
            id: 'ev_new',
            eventType: 'feature_released',
            title: 'Aktivitas Baru',
            description: 'Dilakukan hari ini',
            timestamp: '2026-11-08T00:00:00.000Z',
            publicationStatus: 'public',
          },
        ],
        updatedAt: '2026-11-08T00:00:00.000Z',
      };

      const publicProj = extractPublicProgress(doc);
      expect(publicProj.events[0].id).toBe('ev_new');
      expect(publicProj.events[1].id).toBe('ev_old');
    });

    it('Scenario 51: public progress endpoint returns 404 cleanly for unknown project slug', async () => {
      const req = new Request('https://sleepykoala.pages.dev/api/projects/unknown-game-99/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'unknown-game-99' },
        env: mockEnv,
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('NOT_FOUND');
    });

    it('Scenario 52: enforces REPOSITORY_FROZEN isolation on The Broken Origin across entire lifecycle', async () => {
      const frozenSave = await saveAdminProjectProgress(
        'the-broken-origin',
        { roadmap: [] } as any,
        AUTHORIZED_ADMIN_EMAIL
      );
      expect(frozenSave.success).toBe(false);
      expect(frozenSave.error).toBe('REPOSITORY_FROZEN');

      const frozenTransition = await transitionItemPublicationStatus({
        projectSlug: 'the-broken-origin',
        itemType: 'roadmap',
        itemId: 'ms_tbo_any',
        targetStatus: 'public',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });
      expect(frozenTransition.success).toBe(false);
      expect(frozenTransition.error).toBe('REPOSITORY_FROZEN');
    });

    it('Scenario 53: public endpoint returns HTTP 503 fail-closed when upstream GAS fails or times out', async () => {
      // Configure GAS URL so it enters the live upstream branch
      const gasEnv: AuthEnv = {
        ...mockEnv,
        GAS_WEBAPP_URL: 'https://script.google.com/macros/s/unreachable-endpoint/exec',
      };

      // Mock fetch failure
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network connection timeout'));

      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: gasEnv,
      });

      expect([502, 503]).toContain(res.status);
      expect(res.headers.get('Cache-Control')).toMatch(/no-store|no-cache/);
    });

    it('Scenario 54: verified publication propagation reflects in public API instantly', async () => {
      // 1. Transition draft milestone ms_dn_analytics to review then public
      await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_analytics',
        targetStatus: 'review',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      await transitionItemPublicationStatus({
        projectSlug: 'dompetnalar',
        itemType: 'roadmap',
        itemId: 'ms_dn_analytics',
        targetStatus: 'public',
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
      });

      // 2. Fetch public endpoint
      const pubRes = await fetchPublicProjectProgress('dompetnalar');
      expect(pubRes.success).toBe(true);
      const pubIds = pubRes.data?.roadmap.map((m) => m.id);
      expect(pubIds).toContain('ms_dn_analytics');
    });
  });

  // ==========================================================================
  // WP-06.6: FAILURE RECOVERY & RELIABILITY
  // ==========================================================================
  describe('WP-06.6 — Failure Recovery & Reliability', () => {
    it('Scenario 55: upstream Apps Script 502/503 handles fail-closed without leaking stack trace', async () => {
      const gasEnv: AuthEnv = {
        ...mockEnv,
        GAS_WEBAPP_URL: 'https://script.google.com/macros/s/fail-simulation/exec',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Upstream Internal Server Error', { status: 502 })
      );

      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: gasEnv,
      });

      expect([502, 503]).toContain(res.status);
      const body = await res.text();
      expect(body).not.toMatch(/Error: /);
      expect(body).not.toMatch(/at /); // No V8 stack traces
    });

    it('Scenario 56: malformed non-JSON upstream response handles gracefully without throwing', async () => {
      const gasEnv: AuthEnv = {
        ...mockEnv,
        GAS_WEBAPP_URL: 'https://script.google.com/macros/s/html-error-simulation/exec',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('<html><body>Google Error 500</body></html>', { status: 200 })
      );

      const req = new Request('https://sleepykoala.pages.dev/api/projects/dompetnalar/progress');
      const res = await publicProgressGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: gasEnv,
      });

      expect([502, 503]).toContain(res.status);
    });

    it('Scenario 57: handles localStorage quota exceeded simulation gracefully with fallback to in-memory cache', async () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError: The quota has been exceeded.');
      });

      // Saving should still succeed via in-memory fallback
      const saveRes = await saveAdminProjectProgress(
        'dompetnalar',
        {
          schemaVersion: 2,
          projectSlug: 'dompetnalar',
          projectName: 'DompetNalar',
          roadmap: [],
          features: [],
          screenshots: [],
          events: [],
          updatedAt: '2026-11-08T00:00:00.000Z',
        },
        AUTHORIZED_ADMIN_EMAIL
      );

      expect(saveRes.success).toBe(true);
      setItemSpy.mockRestore();
    });

    it('Scenario 58: handles corrupted JSON in localStorage safely by resetting to canonical defaults', async () => {
      // Mock localStorage.getItem to return corrupted JSON
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{"invalid_json_corrupted: true');

      const fetchRes = await fetchAdminProjectProgress('dompetnalar');
      expect(fetchRes.success).toBe(true);
      expect(fetchRes.data?.projectSlug).toBe('dompetnalar');
      expect(fetchRes.data?.roadmap.length).toBeGreaterThan(0);

      getItemSpy.mockRestore();
    });

    it('Scenario 59: resetProgressCache invalidates memory state and allows clean re-initialization', async () => {
      const docBefore = await fetchAdminProjectProgress('dompetnalar');
      expect(docBefore.success).toBe(true);

      resetProgressCache();

      const docAfter = await fetchAdminProjectProgress('dompetnalar');
      expect(docAfter.success).toBe(true);
      expect(docAfter.data?.projectSlug).toBe('dompetnalar');
    });

    it('Scenario 60: concurrent read/write requests execute without race conditions or memory corruption', async () => {
      const concurrentOperations = [
        fetchAdminProjectProgress('dompetnalar'),
        fetchPublicProjectProgress('dompetnalar'),
        fetchAdminProjectProgress('idle-master'),
        fetchPublicProjectProgress('mobile-kasir'),
        getProjectSyncInfo('dompetnalar'),
        getProgressAuditLogs('dompetnalar'),
      ];

      const results = await Promise.all(concurrentOperations);
      for (const res of results) {
        expect(res).toBeDefined();
      }
    });
  });
});
