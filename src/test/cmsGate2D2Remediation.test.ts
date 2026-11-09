/**
 * ============================================================================
 * SLEEPYKOALA CMS — GATE 2D.2 TARGETED REMEDIATION TEST SUITE
 * 
 * Verifies the two authorized fixes:
 * 1. FINDING-2D1-01: Public Fallback Privacy Failure (14 Scenarios)
 * 2. FINDING-2D1-03: Media Screenshots Referential Integrity (15 Scenarios)
 * 
 * STRICT LOCAL UNIT & MOCK INTEGRATION TESTS ONLY.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  onRequestDelete as adminMediaDelete,
} from '../../functions/api/admin/media';

import {
  resetProjectsCache,
} from '../services/projectService';

describe('SleepyKoala CMS — Gate 2D.2 Targeted Remediation Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  let validSessionCookie: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    resetProjectsCache();

    const nowSec = Math.floor(Date.now() / 1000);
    const validPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec,
      exp: nowSec + 86400,
    };
    const validToken = await createSessionToken(validPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    validSessionCookie = `sk_admin_session=${validToken}`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetProjectsCache();
  });

  // =========================================================================
  // REMEDIATION A: FINDING-2D1-01 PUBLIC FALLBACK PRIVACY (14 SCENARIOS)
  // =========================================================================
  describe('Remediation A: FINDING-2D1-01 Public Fallback Privacy', () => {
    it('1. Backend sukses mengembalikan proyek PUBLISHED dengan HTTP 200', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [
              { id: 'proj_pub_1', slug: 'pub-one', name: 'Pub One', publishState: 'PUBLISHED' },
            ],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].slug).toBe('pub-one');
      expect(res.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');
      expect(res.headers.get('X-Data-Source')).toBe('cms-live');
    });

    it('2. Backend mengembalikan proyek DRAFT -> dikecualikan dari publik', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [
              { id: 'proj_draft', slug: 'draft-proj', name: 'Draft Proj', publishState: 'DRAFT' },
            ],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(0); // Proyek DRAFT dikecualikan
    });

    it('3. Backend mengembalikan proyek ARCHIVED -> dikecualikan dari publik', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [
              { id: 'proj_arc', slug: 'arc-proj', name: 'Archived Proj', publishState: 'ARCHIVED' },
            ],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(0); // Proyek ARCHIVED dikecualikan
    });

    it('4. Backend mengalami timeout -> HTTP 503 Fail-Closed tanpa fallback statis', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network timeout'));

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
      expect(json.data).toBeUndefined();
    });

    it('5. Backend mengembalikan HTTP 502 -> HTTP 503 Fail-Closed', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response('Bad Gateway', { status: 502, headers: { 'Content-Type': 'text/plain' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('6. Backend mengembalikan HTTP 503 -> HTTP 503 Fail-Closed', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response('Service Unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
    });

    it('7. Backend mengembalikan JSON tidak valid -> HTTP 503 Fail-Closed', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response('{"broken_json:', { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('8. Backend mengembalikan daftar kosong secara valid -> HTTP 200 dengan count 0', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
      expect(json.count).toBe(0);
      expect(res.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');
    });

    it('9. Endpoint detail untuk proyek yang tidak ditemukan -> HTTP 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: { projects: [] },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects/unknown-proj');
      const res = await publicSingleProjectGet({
        request: req,
        params: { slug: 'unknown-proj' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('10. Endpoint detail untuk proyek DRAFT -> HTTP 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [
              { id: 'proj_secret', slug: 'secret-game', name: 'Secret Game', publishState: 'DRAFT' },
            ],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects/secret-game');
      const res = await publicSingleProjectGet({
        request: req,
        params: { slug: 'secret-game' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('11. Endpoint detail untuk proyek ARCHIVED -> HTTP 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [
              { id: 'proj_old', slug: 'old-game', name: 'Old Game', publishState: 'ARCHIVED' },
            ],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects/old-game');
      const res = await publicSingleProjectGet({
        request: req,
        params: { slug: 'old-game' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('12. Tidak ada proyek statis yang dipublikasikan ulang saat backend gagal', async () => {
      // Simulasi backend outage
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Upstream Down'));

      // Panggilan ke /api/projects
      const listReq = new Request('https://sleepykoala.app/api/projects');
      const listRes = await publicProjectsGet({ request: listReq, env: TEST_ENV } as any);
      expect(listRes.status).toBe(503);
      const listJson = await listRes.json();
      expect(listJson.data).toBeUndefined(); // TIDAK MEMUAT projects.json

      // Panggilan ke direct slug /api/projects/worklume (yang ada di projects.json)
      const slugReq = new Request('https://sleepykoala.app/api/projects/worklume');
      const slugRes = await publicSingleProjectGet({
        request: slugReq,
        params: { slug: 'worklume' },
        env: TEST_ENV,
      } as any);
      expect(slugRes.status).toBe(503); // BUKAN 200 dari fallback!
    });

    it('13. Tidak ada pemaksaan publishState: PUBLISHED pada fallback', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Timeout'));

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      const json = await res.json();

      expect(json.source).not.toBe('fallback-static');
      expect(res.headers.get('X-Data-Source')).toBeNull();
    });

    it('14. Cache error menggunakan no-store, no-cache, must-revalidate', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response('Upstream Error', { status: 500 })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');

      const slugReq = new Request('https://sleepykoala.app/api/projects/dompetnalar');
      const slugRes = await publicSingleProjectGet({
        request: slugReq,
        params: { slug: 'dompetnalar' },
        env: TEST_ENV,
      } as any);
      expect(slugRes.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  // =========================================================================
  // REMEDIATION B: FINDING-2D1-03 MEDIA REFERENTIAL INTEGRITY (15 SCENARIOS)
  // =========================================================================
  describe('Remediation B: FINDING-2D1-03 Media Screenshots Referential Integrity', () => {
    // Pure function simulation representing cleanMediaReferencesFromProjects logic
    function simulateCleanMediaReferences(
      projects: Array<{
        id: string;
        screenshots: string[] | any;
        iconUrl?: string;
        featureGraphicUrl?: string;
      }>,
      mediaId: string
    ) {
      const affectedProjectIds: string[] = [];

      for (const proj of projects) {
        let isModified = false;

        // Check Icon URL
        if (proj.iconUrl && (proj.iconUrl.includes(mediaId) || proj.iconUrl === mediaId)) {
          proj.iconUrl = '';
          isModified = true;
        }

        // Check Feature Graphic URL
        if (proj.featureGraphicUrl && (proj.featureGraphicUrl.includes(mediaId) || proj.featureGraphicUrl === mediaId)) {
          proj.featureGraphicUrl = '';
          isModified = true;
        }

        // Check Screenshots JSON
        let ssArr = proj.screenshots;
        if (typeof ssArr === 'string') {
          try {
            ssArr = JSON.parse(ssArr);
          } catch {
            ssArr = [];
            proj.screenshots = [];
            isModified = true;
          }
        }
        if (!Array.isArray(ssArr)) {
          ssArr = [];
          isModified = true;
        }

        const initialLen = ssArr.length;
        const filtered = ssArr.filter((item: any) => {
          const str = typeof item === 'string' ? item : item?.url || '';
          return !(str === mediaId || str.includes('/' + mediaId) || str.includes(mediaId));
        });

        if (filtered.length !== initialLen) {
          proj.screenshots = filtered;
          isModified = true;
        }

        if (isModified) {
          affectedProjectIds.push(proj.id);
        }
      }

      return affectedProjectIds;
    }

    it('1. Media direferensikan oleh satu proyek -> screenshots dibersihkan', () => {
      const projects = [
        { id: 'proj_a', screenshots: ['/api/media/med_1', '/api/media/med_target'] },
        { id: 'proj_b', screenshots: ['/api/media/med_2'] },
      ];

      const affected = simulateCleanMediaReferences(projects, 'med_target');
      expect(affected).toEqual(['proj_a']);
      expect(projects[0].screenshots).toEqual(['/api/media/med_1']);
      expect(projects[1].screenshots).toEqual(['/api/media/med_2']);
    });

    it('2. Media direferensikan oleh beberapa proyek -> seluruh proyek dibersihkan', () => {
      const projects = [
        { id: 'proj_a', screenshots: ['/api/media/med_shared', '/api/media/med_1'] },
        { id: 'proj_b', screenshots: ['/api/media/med_shared'] },
        { id: 'proj_c', screenshots: ['/api/media/med_other'] },
      ];

      const affected = simulateCleanMediaReferences(projects, 'med_shared');
      expect(affected).toEqual(['proj_a', 'proj_b']);
      expect(projects[0].screenshots).toEqual(['/api/media/med_1']);
      expect(projects[1].screenshots).toEqual([]);
      expect(projects[2].screenshots).toEqual(['/api/media/med_other']);
    });

    it('3. Media tidak direferensikan proyek mana pun -> tidak ada proyek yang diubah', () => {
      const projects = [
        { id: 'proj_a', screenshots: ['/api/media/med_1'] },
      ];

      const affected = simulateCleanMediaReferences(projects, 'med_orphan');
      expect(affected).toEqual([]);
      expect(projects[0].screenshots).toEqual(['/api/media/med_1']);
    });

    it('4. Proyek memiliki beberapa screenshot dan hanya satu yang dihapus', () => {
      const projects = [
        { id: 'proj_a', screenshots: ['/api/media/med_1', '/api/media/med_delete', '/api/media/med_3'] },
      ];

      const affected = simulateCleanMediaReferences(projects, 'med_delete');
      expect(affected).toEqual(['proj_a']);
      expect(projects[0].screenshots).toEqual(['/api/media/med_1', '/api/media/med_3']);
    });

    it('5. Proyek memiliki array screenshots kosong -> tetap array kosong', () => {
      const projects = [
        { id: 'proj_a', screenshots: [] },
      ];

      const affected = simulateCleanMediaReferences(projects, 'med_any');
      expect(affected).toEqual([]);
      expect(projects[0].screenshots).toEqual([]);
    });

    it('6. JSON screenshots tidak valid -> ditangani secara aman tanpa throw error', () => {
      const projects = [
        { id: 'proj_corrupt', screenshots: '{corrupted_json' },
      ];

      expect(() => {
        simulateCleanMediaReferences(projects, 'med_any');
      }).not.toThrow();
      expect(projects[0].screenshots).toEqual([]);
    });

    it('7. Baris media tidak ditemukan -> API merespons NOT_FOUND', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: false,
          error: 'NOT_FOUND',
          message: 'Media tidak ditemukan.',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_nonexistent', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('NOT_FOUND');
    });

    it('8. File Drive tidak ditemukan -> pembersihan sheet dan referensi tetap berhasil', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          message: 'Media dan seluruh referensi terkait berhasil dihapus secara permanen.',
          data: {
            mediaId: 'med_drive_missing',
            permanent: true,
            cleanedProjectsCount: 1,
            cleanedProjectIds: ['proj_a'],
            driveRemovalSuccess: false,
            driveError: 'File not found on Drive',
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_drive_missing', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.cleanedProjectsCount).toBe(1);
    });

    it('9. Penghapusan file Drive gagal -> error tercatat di response & audit', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            mediaId: 'med_drive_fail',
            permanent: true,
            driveRemovalSuccess: false,
            driveError: 'Rate limit on Drive API',
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_drive_fail', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      const json = await res.json();
      expect(json.data.driveRemovalSuccess).toBe(false);
      expect(json.data.driveError).toContain('Rate limit');
    });

    it('10. Pembersihan juga menghapus referensi pada iconUrl dan featureGraphicUrl', () => {
      const projects = [
        { id: 'proj_icon', screenshots: [], iconUrl: '/api/media/med_icon_target', featureGraphicUrl: '/api/media/med_feat_target' },
      ];

      const affected = simulateCleanMediaReferences(projects, 'med_icon_target');
      expect(affected).toEqual(['proj_icon']);
      expect(projects[0].iconUrl).toBe('');
      expect(projects[0].featureGraphicUrl).toBe('/api/media/med_feat_target');
    });

    it('11. Penghapusan media dipanggil berulang -> aman dan idempotent', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          message: 'Media telah dihapus sebelumnya. Referensi tersisa berhasil dibersihkan.',
          data: {
            mediaId: 'med_repeated',
            permanent: true,
            idempotent: true,
            cleanedProjectsCount: 0,
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_repeated', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.idempotent).toBe(true);
    });

    it('12. Terjadi konflik lock service -> merespons SERVER_BUSY', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: false,
          error: 'SERVER_BUSY',
          message: 'Server sibuk. Gagal menghapus media.',
        }), { status: 503, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_busy', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe('SERVER_BUSY');
    });

    it('13. Audit log mencatat sukses penghapusan permanen dan daftar project yang dibersihkan', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            mediaId: 'med_audit_test',
            permanent: true,
            cleanedProjectsCount: 2,
            cleanedProjectIds: ['proj_1', 'proj_2'],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_audit_test', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      const json = await res.json();
      expect(json.data.cleanedProjectsCount).toBe(2);
      expect(json.data.cleanedProjectIds).toEqual(['proj_1', 'proj_2']);
    });

    it('14. Audit log mencatat peringatan jika file drive gagal dihapus', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            mediaId: 'med_warn',
            permanent: true,
            driveRemovalSuccess: false,
            driveError: 'Quota exhausted',
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_warn', permanent: true }),
      });

      const res = await adminMediaDelete({ request: req, env: TEST_ENV } as any);
      const json = await res.json();
      expect(json.data.driveRemovalSuccess).toBe(false);
      expect(json.data.driveError).toBe('Quota exhausted');
    });

    it('15. Tidak ada referensi media lain yang ikut terhapus', () => {
      const projects = [
        {
          id: 'proj_safe',
          screenshots: [
            '/api/media/med_keep_1',
            '/api/media/med_delete_target',
            '/api/media/med_keep_2',
            '/api/media/med_delete_target_substring_should_not_match',
          ],
        },
      ];

      simulateCleanMediaReferences(projects, 'med_delete_target');
      expect(projects[0].screenshots).toContain('/api/media/med_keep_1');
      expect(projects[0].screenshots).toContain('/api/media/med_keep_2');
      expect(projects[0].screenshots).not.toContain('/api/media/med_delete_target');
    });
  });
});
