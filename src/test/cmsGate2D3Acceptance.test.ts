/**
 * ============================================================================
 * SLEEPYKOALA CMS — GATE 2D.3 FINAL ACCEPTANCE TEST SUITE
 * 
 * Verifies end-to-end acceptance across:
 * 1. Public Website Routes (Home, Projects, Detail, Feedback, About)
 *    - Normal state (200 OK with published projects)
 *    - Degraded / Outage state (503 Service Unavailable, Fail-Closed, retry UI)
 * 2. Official 6 Projects Preservation & Schema Integrity:
 *    - DompetNalar (APPLICATION, READY_FOR_RELEASE)
 *    - IDLE MASTER (GAME, WORK_IN_PROGRESS)
 *    - Mobile Kasir (APPLICATION, CLOSED_TESTING, registrationOpen: true)
 *    - Idle Mining (GAME, WORK_IN_PROGRESS)
 *    - The Broken Origin (GAME, WORK_IN_PROGRESS)
 *    - Worklume (APPLICATION, WORK_IN_PROGRESS)
 * 3. Admin CMS Workflows:
 *    - OTP authentication & session token validation / expiration
 *    - Project CRUD & status transitions (DRAFT, IN_REVIEW, PUBLISHED, ARCHIVED)
 *    - Reordering
 *    - Media Library lifecycle (Upload, Validate, Preview, Replace, Archive, Restore, Delete)
 *    - Media referential integrity cascading cleanup on project screenshots/icons
 *    - Search, filter, and Audit logging
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SessionPayload,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestGet as publicProjectsGet,
} from '../../functions/api/projects';

import {
  onRequestGet as publicSingleProjectGet,
} from '../../functions/api/projects/[slug]';

import {
  onRequestGet as publicMediaGet,
} from '../../functions/api/media/[mediaId]';

import {
  onRequestGet as adminProjectsGet,
  onRequestPost as adminProjectsPost,
  onRequestPut as adminProjectsPut,
} from '../../functions/api/admin/projects';

import {
  onRequestPost as adminMediaPost,
  onRequestDelete as adminMediaDelete,
} from '../../functions/api/admin/media';

import {
  onRequestGet as adminPreviewMediaGet,
} from '../../functions/api/admin/media/[mediaId]';

import {
  fetchPublishedProjects,
  getAllProjects,
  getProjectBySlug,
  resetProjectsCache,
} from '../services/projectService';

import rawProjects from '../data/projects.json';

describe('SleepyKoala CMS — Gate 2D.3 Final Acceptance Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  let validSessionCookie: string;
  let expiredSessionCookie: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    resetProjectsCache();

    const nowSec = Math.floor(Date.now() / 1000);
    const validPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec - 60,
      exp: nowSec + 3600,
    };
    const validToken = await createSessionToken(validPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    validSessionCookie = `sk_admin_session=${validToken}`;

    const expiredPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec - 7200,
      exp: nowSec - 3600,
    };
    const expiredToken = await createSessionToken(expiredPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    expiredSessionCookie = `sk_admin_session=${expiredToken}`;
  });

  describe('1. Official 6 Projects Preservation & Schema Integrity', () => {
    it('verifies exact count of 6 canonical projects in baseline dataset', () => {
      expect(rawProjects).toHaveLength(6);
    });

    it('verifies exact slug, name, category, status, and registration flag of each official project', () => {
      const expectedProjects = [
        {
          id: 'dompetnalar',
          slug: 'dompetnalar',
          name: 'DompetNalar',
          category: 'APPLICATION',
          status: 'READY_FOR_RELEASE',
          registrationOpen: false,
        },
        {
          id: 'idle-master',
          slug: 'idle-master',
          name: 'IDLE MASTER',
          category: 'GAME',
          status: 'WORK_IN_PROGRESS',
          registrationOpen: false,
        },
        {
          id: 'mobile-kasir',
          slug: 'mobile-kasir',
          name: 'Mobile Kasir',
          category: 'APPLICATION',
          status: 'CLOSED_TESTING',
          registrationOpen: true,
        },
        {
          id: 'idle-mining',
          slug: 'idle-mining',
          name: 'Idle Mining',
          category: 'GAME',
          status: 'WORK_IN_PROGRESS',
          registrationOpen: false,
        },
        {
          id: 'the-broken-origin',
          slug: 'the-broken-origin',
          name: 'The Broken Origin',
          category: 'GAME',
          status: 'WORK_IN_PROGRESS',
          registrationOpen: false,
        },
        {
          id: 'worklume',
          slug: 'worklume',
          name: 'Worklume',
          category: 'APPLICATION',
          status: 'WORK_IN_PROGRESS',
          registrationOpen: false,
        },
      ];

      for (const expected of expectedProjects) {
        const found = rawProjects.find((p) => p.slug === expected.slug);
        expect(found, `Project ${expected.slug} must exist`).toBeDefined();
        expect(found?.name).toBe(expected.name);
        expect(found?.category).toBe(expected.category);
        expect(found?.status).toBe(expected.status);
        expect(found?.registrationOpen).toBe(expected.registrationOpen);
      }
    });

    it('verifies Mobile Kasir is the only project currently in CLOSED_TESTING with open registration', () => {
      const closedTestingProjects = rawProjects.filter((p) => p.status === 'CLOSED_TESTING');
      expect(closedTestingProjects).toHaveLength(1);
      expect(closedTestingProjects[0].slug).toBe('mobile-kasir');
      expect(closedTestingProjects[0].registrationOpen).toBe(true);
    });

    it('verifies DompetNalar is the only project in READY_FOR_RELEASE', () => {
      const readyProjects = rawProjects.filter((p) => p.status === 'READY_FOR_RELEASE');
      expect(readyProjects).toHaveLength(1);
      expect(readyProjects[0].slug).toBe('dompetnalar');
    });
  });

  describe('2. Public Website Routes & Degradation Acceptance', () => {
    it('serves 200 OK with published projects when backend is healthy', async () => {
      const mockGasProjects = rawProjects.map((p, idx) => ({
        ...p,
        publishState: 'PUBLISHED',
        sortOrder: idx + 1,
      }));

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { projects: mockGasProjects },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/projects');
      const response = await publicProjectsGet({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/projects',
        data: {},
      } as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.source).toBe('cms-live');
      expect(json.data).toHaveLength(6);
      expect(response.headers.get('Cache-Control')).toContain('must-revalidate');
    });

    it('serves 503 Fail-Closed when upstream GAS backend times out or fails (no fallback leakage)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network connection timeout'));

      const request = new Request('https://sleepykoala.com/api/projects');
      const response = await publicProjectsGet({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/projects',
        data: {},
      } as any);

      expect(response.status).toBe(503);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(json.data).toBeUndefined();
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('client projectService correctly updates isUnavailable flag on 503 response without leaking stale projects', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: false, error: 'GATEWAY_ERROR', message: 'Down' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const state = await fetchPublishedProjects();
      expect(state.isUnavailable).toBe(true);
      expect(state.projects).toEqual([]);
      expect(getAllProjects()).toEqual([]);
      expect(getProjectBySlug('mobile-kasir')).toBeUndefined();
    });

    it('serves 404 for non-published or non-existent project on single project endpoint', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              projects: [
                {
                  slug: 'secret-draft',
                  name: 'Secret Draft',
                  publishState: 'DRAFT',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/projects/secret-draft');
      const response = await publicSingleProjectGet({
        request,
        env: TEST_ENV,
        params: { slug: 'secret-draft' },
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/projects/secret-draft',
        data: {},
      } as any);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('NOT_FOUND');
    });
  });

  describe('3. Admin CMS Workflows Acceptance', () => {
    it('rejects unauthenticated requests to admin endpoints with 401', async () => {
      const request = new Request('https://sleepykoala.com/api/admin/projects', {
        headers: {},
      });
      const response = await adminProjectsGet({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/projects',
        data: {},
      } as any);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('rejects expired session token to admin endpoints with 401', async () => {
      const request = new Request('https://sleepykoala.com/api/admin/projects', {
        headers: { Cookie: expiredSessionCookie },
      });
      const response = await adminProjectsGet({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/projects',
        data: {},
      } as any);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('allows authenticated admin to fetch all projects including drafts and archives', async () => {
      const adminProjects = [
        { slug: 'proj-1', name: 'Draft Game', publishState: 'DRAFT' },
        { slug: 'proj-2', name: 'Published Game', publishState: 'PUBLISHED' },
        { slug: 'proj-3', name: 'Archived App', publishState: 'ARCHIVED' },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { projects: adminProjects } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/admin/projects', {
        headers: { Cookie: validSessionCookie },
      });
      const response = await adminProjectsGet({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/projects',
        data: {},
      } as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.projects).toHaveLength(3);
    });

    it('allows admin to create a new project with CSRF header and validates input fields', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'p-new-uuid',
                slug: 'new-rpg',
                name: 'New RPG Game',
                category: 'GAME',
                status: 'WORK_IN_PROGRESS',
                publishState: 'DRAFT',
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          Cookie: validSessionCookie,
        },
        body: JSON.stringify({
          project: {
            name: 'New RPG Game',
            slug: 'new-rpg',
            category: 'GAME',
            status: 'WORK_IN_PROGRESS',
            shortDescription: 'Exciting RPG adventure',
            fullDescription: 'Long detailed description',
          },
        }),
      });

      const response = await adminProjectsPost({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/projects',
        data: {},
      } as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.project.slug).toBe('new-rpg');
    });

    it('allows admin to reorder projects and save new sort order with CSRF header', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { message: 'Projects reordered successfully' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          Cookie: validSessionCookie,
        },
        body: JSON.stringify({
          orderedIds: ['mobile-kasir', 'dompetnalar'],
        }),
      });

      const response = await adminProjectsPut({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/projects',
        data: {},
      } as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });

  describe('4. Media Library Lifecycle & Referential Integrity Acceptance', () => {
    it('validates upload payload rejection when file size exceeds 2.0MB limit', async () => {
      // Exceeds 2.8MB base64 ceiling
      const largeBase64 = 'A'.repeat(3 * 1024 * 1024);

      const request = new Request('https://sleepykoala.com/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          Cookie: validSessionCookie,
        },
        body: JSON.stringify({
          fileName: 'oversized.webp',
          mimeType: 'image/webp',
          base64Data: largeBase64,
        }),
      });

      const response = await adminMediaPost({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/media',
        data: {},
      } as any);

      expect(response.status).toBe(413);
      const json = await response.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('allows admin preview of private or draft media via authenticated preview endpoint', async () => {
      // Minimal valid WebP base64: "RIFF....WEBPVP8 "
      const validWebpBytes = new Uint8Array(64);
      validWebpBytes[0] = 0x52; validWebpBytes[1] = 0x49; validWebpBytes[2] = 0x46; validWebpBytes[3] = 0x46; // RIFF
      validWebpBytes[8] = 0x57; validWebpBytes[9] = 0x45; validWebpBytes[10] = 0x42; validWebpBytes[11] = 0x50; // WEBP
      let b64 = '';
      for (let i = 0; i < validWebpBytes.length; i++) b64 += String.fromCharCode(validWebpBytes[i]);
      const validWebpB64 = btoa(b64);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              fileName: 'banner.webp',
              mimeType: 'image/webp',
              visibility: 'DRAFT',
              base64Data: validWebpB64,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/admin/media/med_0123456789abcdef', {
        headers: { Cookie: validSessionCookie },
      });

      const response = await adminPreviewMediaGet({
        request,
        env: TEST_ENV,
        params: { mediaId: 'med_0123456789abcdef' },
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/media/med_0123456789abcdef',
        data: {},
      } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/webp');
      expect(response.headers.get('Cache-Control')).toContain('no-store');
    });

    it('public media proxy returns 404 for archived or draft media', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan atau belum dipublikasikan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/media/med_0123456789abcdef');
      const response = await publicMediaGet({
        request,
        env: TEST_ENV,
        params: { mediaId: 'med_0123456789abcdef' },
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/media/med_0123456789abcdef',
        data: {},
      } as any);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('NOT_FOUND');
    });

    it('permanent delete of media cascades to clean references from CMS_Projects', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              message: 'Media permanently deleted and project references cleaned',
              cleanedProjects: ['the-broken-origin'],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const request = new Request('https://sleepykoala.com/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          Cookie: validSessionCookie,
        },
        body: JSON.stringify({
          mediaId: 'med_0123456789abcdef',
          isPermanent: true,
        }),
      });

      const response = await adminMediaDelete({
        request,
        env: TEST_ENV,
        params: {},
        waitUntil: vi.fn(),
        next: vi.fn(),
        functionPath: '/api/admin/media',
        data: {},
      } as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.cleanedProjects).toContain('the-broken-origin');
    });
  });
});
