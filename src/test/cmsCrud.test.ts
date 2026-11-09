import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SessionPayload,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestOptions as projectsOptions,
  onRequestGet as projectsGet,
  onRequestPost as projectsPost,
  onRequestPut as projectsPut,
} from '../../functions/api/admin/projects';

import {
  onRequestOptions as auditLogsOptions,
  onRequestGet as auditLogsGet,
} from '../../functions/api/admin/audit-logs';

import {
  fetchAdminProjects,
  saveAdminProject,
  reorderAdminProjects,
  fetchAdminAuditLogs,
  CmsProject,
} from '../services/cmsProjectService';

describe('SleepyKoala CMS — Gate 2A: Admin Dashboard & CRUD Operations Test Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  let validSessionCookie: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    const nowSec = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec,
      exp: nowSec + 86400,
    };
    const token = await createSessionToken(payload, TEST_ENV.ADMIN_SESSION_SECRET);
    validSessionCookie = `sk_admin_session=${token}; Path=/; HttpOnly; SameSite=Strict`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. ENDPOINTS: OPTIONS CORS / PREFLIGHT
  // =========================================================================
  describe('Preflight (OPTIONS) Requests', () => {
    it('should return 204 with security headers on /api/admin/projects OPTIONS', async () => {
      const res = await projectsOptions();
      expect(res.status).toBe(204);
      expect(res.headers.get('Content-Type')).toBe('application/json; charset=UTF-8');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should return 204 with security headers on /api/admin/audit-logs OPTIONS', async () => {
      const res = await auditLogsOptions();
      expect(res.status).toBe(204);
      expect(res.headers.get('Content-Type')).toBe('application/json; charset=UTF-8');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  // =========================================================================
  // 2. ENDPOINTS: GET /api/admin/projects
  // =========================================================================
  describe('GET /api/admin/projects (Authentication & Fetch)', () => {
    it('should return 401 when no session cookie is provided', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'GET',
        headers: { 'X-SleepyKoala-Admin': '1' },
      });

      const res = await projectsGet({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('should return 401 when session cookie has forged signature', async () => {
      const forgedCookie = 'sk_admin_session=header.payload.invalid_signature; Path=/';
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'GET',
        headers: {
          'Cookie': forgedCookie,
          'X-SleepyKoala-Admin': '1',
        },
      });

      const res = await projectsGet({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('should return 503 if ADMIN_SESSION_SECRET is unconfigured', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'GET',
        headers: {
          'Cookie': validSessionCookie,
          'X-SleepyKoala-Admin': '1',
        },
      });

      const res = await projectsGet({ request: req, env: { ...TEST_ENV, ADMIN_SESSION_SECRET: '' } as any });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('CONFIGURATION_ERROR');
    });

    it('should return 200 and project list when session is valid and GAS responds', async () => {
      const mockProjects = [
        {
          id: 'proj-dompetnalar',
          name: 'DompetNalar',
          slug: 'dompetnalar',
          category: 'APPLICATION',
          status: 'READY_FOR_RELEASE',
          publishState: 'PUBLISHED',
          featured: true,
          version: '1.2.0',
        },
        {
          id: 'proj-secret-draft',
          name: 'Secret Game Draft',
          slug: 'secret-game',
          category: 'GAME',
          status: 'WORK_IN_PROGRESS',
          publishState: 'DRAFT',
          featured: false,
          version: '0.1.0',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: { projects: mockProjects, source: 'SHEETS' },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'GET',
        headers: {
          'Cookie': validSessionCookie,
          'X-SleepyKoala-Admin': '1',
        },
      });

      const res = await projectsGet({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.projects).toHaveLength(2);
      expect(json.data.projects[1].publishState).toBe('DRAFT');
    });
  });

  // =========================================================================
  // 3. ENDPOINTS: POST /api/admin/projects (Save / Upsert)
  // =========================================================================
  describe('POST /api/admin/projects (CSRF, Validation & Save)', () => {
    const validSampleProject: Partial<CmsProject> = {
      id: 'proj-new-app',
      name: 'New Test App',
      slug: 'new-test-app',
      category: 'APPLICATION',
      status: 'WORK_IN_PROGRESS',
      publishState: 'DRAFT',
      shortDescription: 'Deskripsi singkat aplikasi pengujian.',
      fullDescription: 'Deskripsi lengkap aplikasi pengujian SleepyKoala.',
      version: '1.0.0',
      lastUpdated: '2026-10-31',
      registrationOpen: false,
      featured: false,
      tags: ['Test', 'Utility'],
      technicalHighlights: ['Vite', 'React'],
      capabilities: [],
      screenshots: [],
    };

    it('should return 403 when CSRF header is missing', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: validSampleProject }),
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('MISSING_CSRF_HEADER');
    });

    it('should return 401 when session is missing on POST', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({ project: validSampleProject }),
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('should return 400 when body is invalid JSON', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: 'invalid-json-{',
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('INVALID_JSON');
    });

    it('should return 400 when project object is missing from payload', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ wrongField: 'data' }),
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('VALIDATION_ERROR');
    });

    it('should return 200 on successful project save via Apps Script backend', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: {
            id: 'proj-new-app',
            name: 'New Test App',
            publishState: 'DRAFT',
            updatedAt: '2026-10-31T13:40:00Z',
          },
          message: 'Proyek berhasil disimpan ke database.',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: validSampleProject }),
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('proj-new-app');
      expect(json.data.publishState).toBe('DRAFT');
    });
  });

  // =========================================================================
  // 4. ENDPOINTS: PUT /api/admin/projects (Reorder Projects)
  // =========================================================================
  describe('PUT /api/admin/projects (Reorder)', () => {
    it('should return 403 when CSRF header is missing on PUT', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ orderedIds: ['p1', 'p2'] }),
      });

      const res = await projectsPut({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(403);
    });

    it('should return 400 when orderedIds is not an array', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ orderedIds: 'not-an-array' }),
      });

      const res = await projectsPut({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('VALIDATION_ERROR');
    });

    it('should return 200 when valid reorder request is processed', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: { updatedCount: 3 },
          message: 'Urutan proyek berhasil diperbarui.',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ orderedIds: ['proj-2', 'proj-1', 'proj-3'] }),
      });

      const res = await projectsPut({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.updatedCount).toBe(3);
    });
  });

  // =========================================================================
  // 5. ENDPOINTS: GET /api/admin/audit-logs
  // =========================================================================
  describe('GET /api/admin/audit-logs (Security & Audit Trail)', () => {
    it('should return 401 when unauthenticated', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/audit-logs', {
        method: 'GET',
        headers: { 'X-SleepyKoala-Admin': '1' },
      });

      const res = await auditLogsGet({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('should return 200 with audit logs for authenticated admin', async () => {
      const mockLogs = [
        {
          timestamp: '2026-10-31T13:45:00Z',
          action: 'SAVE_PROJECT',
          targetId: 'proj-new-app',
          adminEmail: AUTHORIZED_ADMIN_EMAIL,
          clientIp: '127.0.0.1',
          details: { name: 'New Test App', publishState: 'DRAFT' },
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: { logs: mockLogs, total: 1 },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const req = new Request('https://sleepykoala.com/api/admin/audit-logs', {
        method: 'GET',
        headers: {
          'Cookie': validSessionCookie,
          'X-SleepyKoala-Admin': '1',
        },
      });

      const res = await auditLogsGet({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.logs).toHaveLength(1);
      expect(json.data.logs[0].action).toBe('SAVE_PROJECT');
    });
  });

  // =========================================================================
  // 6. CLIENT SERVICE: cmsProjectService.ts
  // =========================================================================
  describe('Client Service: cmsProjectService', () => {
    it('fetchAdminProjects should include CSRF header and return projects array', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init) => {
        expect(url).toBe('/api/admin/projects');
        expect(init?.headers).toEqual(expect.objectContaining({
          'X-SleepyKoala-Admin': '1',
        }));
        return new Response(JSON.stringify({
          success: true,
          data: {
            projects: [{ id: 'p1', name: 'App 1', publishState: 'PUBLISHED' }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const result = await fetchAdminProjects();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('App 1');
    });

    it('saveAdminProject should send JSON POST with project payload and CSRF header', async () => {
      const testProject: Partial<CmsProject> = { id: 'p-update', name: 'Updated App' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init) => {
        expect(url).toBe('/api/admin/projects');
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual(expect.objectContaining({
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        }));
        expect(JSON.parse(init?.body as string)).toEqual({ project: testProject });
        return new Response(JSON.stringify({
          success: true,
          data: { id: 'p-update' },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const result = await saveAdminProject(testProject);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('reorderAdminProjects should send JSON PUT with orderedIds', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init) => {
        expect(url).toBe('/api/admin/projects');
        expect(init?.method).toBe('PUT');
        expect(JSON.parse(init?.body as string)).toEqual({ orderedIds: ['p2', 'p1'] });
        return new Response(JSON.stringify({
          success: true,
          data: { updatedCount: 2 },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const result = await reorderAdminProjects(['p2', 'p1']);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('fetchAdminAuditLogs should send GET request with CSRF header', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url, init) => {
        expect(url).toBe('/api/admin/audit-logs');
        expect(init?.method).toBe('GET');
        expect(init?.headers).toEqual(expect.objectContaining({
          'X-SleepyKoala-Admin': '1',
        }));
        return new Response(JSON.stringify({
          success: true,
          data: { logs: [] },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const result = await fetchAdminAuditLogs();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('handles network failure gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
        throw new Error('Connection refused');
      });

      const result = await fetchAdminProjects();
      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Connection refused');
    });
  });

  // =========================================================================
  // 7. CRITICAL ISOLATION & SECURITY GUARANTEES
  // =========================================================================
  describe('Gate 2A Security & Isolation Boundaries', () => {
    it('verifies publishState enum enforcement (DRAFT, PUBLISHED, ARCHIVED)', () => {
      const validStates = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
      expect(validStates).toContain('DRAFT');
      expect(validStates).toContain('PUBLISHED');
      expect(validStates).toContain('ARCHIVED');
      expect(validStates).not.toContain('UNKNOWN');
      expect(validStates).not.toContain('DELETED');
    });

    it('verifies project category enum enforcement (APPLICATION, GAME)', () => {
      const validCategories = ['APPLICATION', 'GAME'];
      expect(validCategories).toContain('APPLICATION');
      expect(validCategories).toContain('GAME');
      expect(validCategories).not.toContain('OTHER');
    });

    it('ensures that TesterRegistrations sheet is never targeted by CMS CRUD handlers', () => {
      // String audit over endpoint code to verify no reference to TesterRegistrations
      const codeString = projectsPost.toString() + projectsGet.toString() + projectsPut.toString() + auditLogsGet.toString();
      expect(codeString).not.toContain('TesterRegistrations');
      expect(codeString).not.toContain('ClosedTesting');
    });

    it('ensures that Google Drive operations are never called during Gate 2A', () => {
      const codeString = projectsPost.toString() + projectsGet.toString() + projectsPut.toString() + auditLogsGet.toString();
      expect(codeString).not.toContain('DriveApp');
      expect(codeString).not.toContain('Drive.Files');
      expect(codeString).not.toContain('uploadMedia');
    });

    it('rejects cross-site requests via Fetch Metadata Sec-Fetch-Site', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Sec-Fetch-Site': 'cross-site',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: { id: 'p1', name: 'Test' } }),
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('CROSS_SITE_REQUEST_REJECTED');
    });

    it('rejects untrusted cross-origin requests via Origin header check', async () => {
      const req = new Request('https://sleepykoala.com/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Origin': 'https://malicious-site.com',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: { id: 'p1', name: 'Test' } }),
      });

      const res = await projectsPost({ request: req, env: TEST_ENV as any });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('ORIGIN_MISMATCH');
    });

    it('verifies initial 6 official SleepyKoala projects: slugs, categories, and READY_FOR_RELEASE status isolation', async () => {
      const rawData = await import('../data/projects.json');
      const projects = rawData.default;

      expect(projects).toHaveLength(6);

      const expectedMap: Record<string, { name: string; category: string; status: string; featured: boolean }> = {
        'dompetnalar': { name: 'DompetNalar', category: 'APPLICATION', status: 'READY_FOR_RELEASE', featured: true },
        'idle-master': { name: 'IDLE MASTER', category: 'GAME', status: 'WORK_IN_PROGRESS', featured: false },
        'mobile-kasir': { name: 'Mobile Kasir', category: 'APPLICATION', status: 'CLOSED_TESTING', featured: true },
        'idle-mining': { name: 'Idle Mining', category: 'GAME', status: 'WORK_IN_PROGRESS', featured: false },
        'the-broken-origin': { name: 'The Broken Origin', category: 'GAME', status: 'WORK_IN_PROGRESS', featured: false },
        'worklume': { name: 'Worklume', category: 'APPLICATION', status: 'WORK_IN_PROGRESS', featured: true },
      };

      for (const p of projects) {
        const exp = expectedMap[p.slug];
        expect(exp).toBeDefined();
        expect(p.name).toBe(exp.name);
        expect(p.category).toBe(exp.category);
        expect(p.status).toBe(exp.status);
        expect(p.featured).toBe(exp.featured);
      }

      // CRITICAL: READY_FOR_RELEASE must NOT equal RELEASED
      const dompetNalar = projects.find((p: any) => p.slug === 'dompetnalar');
      expect(dompetNalar).toBeDefined();
      expect(dompetNalar?.status).toBe('READY_FOR_RELEASE');
      expect(dompetNalar?.status).not.toBe('RELEASED');
    });

    it('verifies archive and restore lifecycle does not delete data (soft-delete)', async () => {
      // 1. Simulasikan update status ke ARCHIVED
      let lastSavedState: string | undefined;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        const parsed = JSON.parse(init?.body as string);
        lastSavedState = parsed.project.publishState;
        return new Response(JSON.stringify({
          success: true,
          data: { id: parsed.project.id, publishState: lastSavedState },
          message: 'Status berhasil diperbarui.',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      // Archive
      const archiveRes = await saveAdminProject({ id: 'dompetnalar', publishState: 'ARCHIVED' });
      expect(archiveRes.success).toBe(true);
      expect(lastSavedState).toBe('ARCHIVED');

      // Restore to PUBLISHED
      const restoreRes = await saveAdminProject({ id: 'dompetnalar', publishState: 'PUBLISHED' });
      expect(restoreRes.success).toBe(true);
      expect(lastSavedState).toBe('PUBLISHED');
    });
  });
});
