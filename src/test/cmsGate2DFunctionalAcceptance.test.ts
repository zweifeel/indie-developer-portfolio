/**
 * ============================================================================
 * SLEEPYKOALA CMS — GATE 2D FUNCTIONAL ACCEPTANCE TEST SUITE
 * 
 * Verifies the full integration & acceptance criteria:
 * 1. Project Lifecycle: Create draft -> Read -> Edit -> Preview draft -> Publish ->
 *    Verify on public site -> Unpublish -> Verify removed from public -> Archive ->
 *    Restore -> Reorder.
 * 2. Media Lifecycle: Upload -> Admin preview -> Project association -> Publish ->
 *    Verify public proxy 200 -> Replace -> Archive -> Verify 404 -> Restore ->
 *    Permanent delete with confirmation.
 * 3. Strict Authorization & Relational Privacy.
 * 4. Reliability, Resilience, & Fail-Closed / Fallback Behavior.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SessionPayload,
  computeBinarySha256Hex,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestGet as publicProjectsGet,
  onRequestOptions as publicProjectsOptions,
} from '../../functions/api/projects';

import {
  onRequestGet as publicSingleProjectGet,
  onRequestOptions as publicSingleProjectOptions,
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
  calculateProjectStatistics,
} from '../services/projectService';

import {
  replaceCmsMedia,
} from '../services/cmsMediaService';

describe('SleepyKoala CMS — Gate 2D Functional Acceptance & Integration Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  let validSessionCookie: string;
  let expiredSessionCookie: string;

  // Valid Dummy Binaries
  function createDummyWebP(sizeBytes: number = 64): Uint8Array {
    const bytes = new Uint8Array(sizeBytes);
    bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46; // "RIFF"
    bytes[8] = 0x57; bytes[9] = 0x45; bytes[10] = 0x42; bytes[11] = 0x50; // "WEBP"
    for (let i = 12; i < sizeBytes; i++) bytes[i] = (i * 31) & 0xff;
    return bytes;
  }

  function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

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

    const expPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec - 90000,
      exp: nowSec - 3600,
    };
    const expToken = await createSessionToken(expPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    expiredSessionCookie = `sk_admin_session=${expToken}`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetProjectsCache();
  });

  // =========================================================================
  // 1. PROJECT LIFECYCLE ACCEPTANCE (SECTION 9.1)
  // =========================================================================
  describe('1. Project Lifecycle Functional Acceptance', () => {
    const sampleDraftProject = {
      id: 'proj_sleepy_chrono',
      slug: 'sleepy-chrono',
      name: 'Sleepy Chrono Timer',
      category: 'APPLICATION',
      status: 'WORK_IN_PROGRESS',
      publishState: 'DRAFT',
      shortDescription: 'Pengatur waktu produktivitas minimalis.',
      fullDescription: 'Aplikasi pengatur waktu tidur dan produktivitas terfokus.',
      tagline: 'Waktu berkualitas untuk fokus dan istirahat.',
      version: '1.0.0-draft',
      screenshots: [],
      tags: ['productivity', 'timer'],
      registrationOpen: false,
      featured: false,
    };

    it('1.1 & 1.2: Membuat proyek DRAFT baru via admin endpoint dan membacanya', async () => {
      // Mock upstream GAS response for save
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({
          success: true,
          message: 'Proyek berhasil disimpan.',
          data: { project: sampleDraftProject },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: sampleDraftProject }),
      });

      const res = await adminProjectsPost({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.project.publishState).toBe('DRAFT');
    });

    it('1.3 & 1.4: Mengedit metadata proyek dan menyimpannya', async () => {
      const updatedProject = {
        ...sampleDraftProject,
        tagline: 'Tagline diperbarui untuk testing Gate 2D',
        version: '1.0.1-beta',
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({
          success: true,
          message: 'Proyek berhasil diperbarui.',
          data: { project: updatedProject },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: updatedProject }),
      });

      const res = await adminProjectsPost({ request: req, env: TEST_ENV } as any);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.project.tagline).toBe('Tagline diperbarui untuk testing Gate 2D');
    });

    it('1.5: Proyek DRAFT TIDAK muncul di endpoint publik /api/projects dan slug mengembalikan 404', async () => {
      // Upstream GAS returns 1 draft project and 1 published project
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: {
            projects: [
              sampleDraftProject,
              {
                id: 'dompetnalar',
                slug: 'dompetnalar',
                name: 'DompetNalar',
                category: 'APPLICATION',
                status: 'READY_FOR_RELEASE',
                publishState: 'PUBLISHED',
                shortDescription: 'Aplikasi keuangan',
                fullDescription: 'Aplikasi keuangan cerdas',
                iconUrl: '/api/media/med_icon_dompet',
                screenshots: [],
                version: '1.0.0',
                lastUpdated: '2026-10-31',
                registrationOpen: false,
                featured: true,
              },
            ],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      // Query public list /api/projects
      const listReq = new Request('https://sleepykoala.app/api/projects');
      const listRes = await publicProjectsGet({ request: listReq, env: TEST_ENV } as any);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      
      // Proyek DRAFT harus dikecualikan
      const slugs = listJson.data.map((p: any) => p.slug);
      expect(slugs).not.toContain('sleepy-chrono');
      expect(slugs).toContain('dompetnalar');

      // Query direct slug /api/projects/sleepy-chrono
      const slugReq = new Request('https://sleepykoala.app/api/projects/sleepy-chrono');
      const slugRes = await publicSingleProjectGet({
        request: slugReq,
        params: { slug: 'sleepy-chrono' },
        env: TEST_ENV,
      } as any);
      expect(slugRes.status).toBe(404);
      expect(slugRes.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('1.6 & 1.7: Mempublikasikan proyek (PUBLISHED) dan membuktikan muncul di website publik', async () => {
      const publishedChrono = {
        ...sampleDraftProject,
        publishState: 'PUBLISHED',
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: {
            projects: [publishedChrono],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      // 1. Cek public list
      const listReq = new Request('https://sleepykoala.app/api/projects');
      const listRes = await publicProjectsGet({ request: listReq, env: TEST_ENV } as any);
      const listJson = await listRes.json();
      expect(listJson.data.length).toBe(1);
      expect(listJson.data[0].slug).toBe('sleepy-chrono');

      // 2. Cek public direct slug
      const slugReq = new Request('https://sleepykoala.app/api/projects/sleepy-chrono');
      const slugRes = await publicSingleProjectGet({
        request: slugReq,
        params: { slug: 'sleepy-chrono' },
        env: TEST_ENV,
      } as any);
      expect(slugRes.status).toBe(200);
      const slugJson = await slugRes.json();
      expect(slugJson.data.name).toBe('Sleepy Chrono Timer');
      expect(slugRes.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');
    });

    it('1.8 & 1.9: Meng-unpublish proyek dan membuktikan seketika hilang dari publik (Instant Revocation 404)', async () => {
      // Backend now reports project as DRAFT
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({
          success: true,
          data: {
            projects: [{ ...sampleDraftProject, publishState: 'DRAFT' }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const listReq = new Request('https://sleepykoala.app/api/projects');
      const listRes = await publicProjectsGet({ request: listReq, env: TEST_ENV } as any);
      const listJson = await listRes.json();
      expect(listJson.data.length).toBe(0);

      const slugReq = new Request('https://sleepykoala.app/api/projects/sleepy-chrono');
      const slugRes = await publicSingleProjectGet({
        request: slugReq,
        params: { slug: 'sleepy-chrono' },
        env: TEST_ENV,
      } as any);
      expect(slugRes.status).toBe(404);
    });

    it('1.10 & 1.11: Mengarsipkan proyek dan memulihkannya (Restore)', async () => {
      // 1. Archive
      const archivedProject = { ...sampleDraftProject, publishState: 'ARCHIVED' };
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          message: 'Proyek diarsipkan.',
          data: { project: archivedProject },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const arcReq = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: archivedProject }),
      });
      const arcRes = await adminProjectsPost({ request: arcReq, env: TEST_ENV } as any);
      const arcJson = await arcRes.json();
      expect(arcJson.data.project.publishState).toBe('ARCHIVED');

      // 2. Restore to PUBLISHED
      const restoredProject = { ...sampleDraftProject, publishState: 'PUBLISHED' };
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          message: 'Proyek dipulihkan.',
          data: { project: restoredProject },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const restReq = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: restoredProject }),
      });
      const restRes = await adminProjectsPost({ request: restReq, env: TEST_ENV } as any);
      const restJson = await restRes.json();
      expect(restJson.data.project.publishState).toBe('PUBLISHED');
    });

    it('1.12: Mengatur ulang urutan proyek (Reorder Projects)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          message: 'Urutan proyek berhasil diperbarui.',
          data: { count: 3 },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ orderedIds: ['proj_c', 'proj_a', 'proj_b'] }),
      });

      const res = await adminProjectsPut({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  // =========================================================================
  // 2. MEDIA LIFECYCLE ACCEPTANCE (SECTION 9.2)
  // =========================================================================
  describe('2. Media Lifecycle Functional Acceptance', () => {
    const dummyWebP = createDummyWebP(512);
    const dummyB64 = toBase64(dummyWebP);
    let sampleSha: string;

    beforeEach(async () => {
      sampleSha = await computeBinarySha256Hex(dummyWebP);
    });

    it('2.1 & 2.2: Mengunggah berkas gambar valid dan melakukan admin preview', async () => {
      const mockMediaMetadata = {
        mediaId: 'med_0123456789abcdef',
        projectId: 'mobile-kasir',
        driveFileId: 'drv_file_test_987',
        originalName: 'banner.webp',
        safeName: 'banner.webp',
        mimeType: 'image/webp',
        sizeBytes: dummyWebP.length,
        sha256: sampleSha,
        role: 'FEATURE_GRAPHIC',
        visibility: 'DRAFT',
        uploadedAt: '2026-11-01 02:00:00',
        uploadedBy: AUTHORIZED_ADMIN_EMAIL,
      };

      // 1. Upload via admin
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          message: 'Media berhasil diunggah.',
          data: { media: mockMediaMetadata },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const upReq = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({
          projectId: 'mobile-kasir',
          fileName: 'banner.webp',
          mimeType: 'image/webp',
          base64Data: dummyB64,
          role: 'FEATURE_GRAPHIC',
          visibility: 'DRAFT',
        }),
      });

      const upRes = await adminMediaPost({ request: upReq, env: TEST_ENV } as any);
      expect(upRes.status).toBe(200);

      // 2. Preview via admin endpoint (terotentikasi, private no-store)
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            ...mockMediaMetadata,
            base64Data: dummyB64,
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const prevReq = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        headers: {
          'Cookie': validSessionCookie,
        },
      });

      const prevRes = await adminPreviewMediaGet({
        request: prevReq,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any);

      expect(prevRes.status).toBe(200);
      expect(prevRes.headers.get('Content-Type')).toBe('image/webp');
      expect(prevRes.headers.get('Cache-Control')).toContain('private');
      expect(prevRes.headers.get('Cache-Control')).toContain('no-store');
    });

    it('2.3, 2.4 & 2.5: Mempublikasikan media dan membuktikan public proxy mengalirkan biner 200', async () => {
      // Upstream GAS returns media as PUBLISHED and parent project is PUBLISHED
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            mediaId: 'med_0123456789abcdef',
            safeName: 'banner.webp',
            mimeType: 'image/webp',
            sizeBytes: dummyWebP.length,
            sha256: sampleSha,
            etag: `"${sampleSha}"`,
            base64Data: dummyB64,
            visibility: 'PUBLISHED',
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const pubReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const pubRes = await publicMediaGet({
        request: pubReq,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any);

      expect(pubRes.status).toBe(200);
      expect(pubRes.headers.get('Content-Type')).toBe('image/webp');
      expect(pubRes.headers.get('ETag')).toBe(`"${sampleSha}"`);
      expect(pubRes.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');

      const buf = await pubRes.arrayBuffer();
      expect(buf.byteLength).toBe(dummyWebP.length);
    });

    it('2.6: Mengganti berkas media (Replace) via replaceCmsMedia service', async () => {
      const newDummy = createDummyWebP(1024);
      const newSha = await computeBinarySha256Hex(newDummy);

      // Mock upload & status updates
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url: any, init: any) => {
        const body = JSON.parse(init.body);
        if (init.method === 'POST') {
          return new Response(JSON.stringify({
            success: true,
            data: {
              media: {
                mediaId: 'med_new111222333444',
                projectId: 'mobile-kasir',
                sha256: newSha,
                role: 'FEATURE_GRAPHIC',
                visibility: 'PUBLISHED',
              },
            },
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (init.method === 'PUT') {
          expect(body.mediaId).toBe('med_0123456789abcdef');
          expect(body.visibility).toBe('ARCHIVED');
          return new Response(JSON.stringify({
            success: true,
            message: 'Status media lama diarsipkan.',
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(null, { status: 404 });
      });

      const dummyFile = new File([newDummy.buffer as ArrayBuffer], 'replacement.webp', { type: 'image/webp' });
      const replaceResult = await replaceCmsMedia(
        'med_0123456789abcdef',
        'mobile-kasir',
        dummyFile,
        'FEATURE_GRAPHIC',
        'PUBLISHED'
      );

      expect(replaceResult.success).toBe(true);
      expect(replaceResult.media?.mediaId).toBe('med_new111222333444');
    });

    it('2.7 & 2.8: Mengarsipkan media (HTTP 404 pada public proxy) dan memulihkannya (Restore)', async () => {
      // 1. Media berstatus ARCHIVED
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: false,
          error: 'NOT_FOUND',
          message: 'Media tidak ditemukan.',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      );

      const arcReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const arcRes = await publicMediaGet({
        request: arcReq,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any);

      expect(arcRes.status).toBe(404);
      expect(arcRes.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');

      // 2. Media dipulihkan kembali ke PUBLISHED
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            mediaId: 'med_0123456789abcdef',
            safeName: 'banner.webp',
            mimeType: 'image/webp',
            sizeBytes: dummyWebP.length,
            sha256: sampleSha,
            etag: `"${sampleSha}"`,
            base64Data: dummyB64,
            visibility: 'PUBLISHED',
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const restRes = await publicMediaGet({
        request: arcReq,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any);

      expect(restRes.status).toBe(200);
      expect(restRes.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');
    });

    it('2.9: Menghapus media secara permanen dari Google Drive & database dengan parameter permanent: true', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url: any, init: any) => {
        const body = JSON.parse(init.body);
        expect(body.permanent).toBe(true);
        expect(body.mediaId).toBe('med_0123456789abcdef');
        return new Response(JSON.stringify({
          success: true,
          message: 'Media berhasil dihapus secara permanen dari Google Drive dan database.',
          data: { mediaId: 'med_0123456789abcdef', permanent: true },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const delReq = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ mediaId: 'med_0123456789abcdef', permanent: true }),
      });

      const delRes = await adminMediaDelete({ request: delReq, env: TEST_ENV } as any);
      expect(delRes.status).toBe(200);
      const json = await delRes.json();
      expect(json.success).toBe(true);
      expect(json.data.permanent).toBe(true);
    });
  });

  // =========================================================================
  // 3. STRICT AUTHORIZATION & PRIVACY (SECTION 9.3)
  // =========================================================================
  describe('3. Strict Authorization & Privacy Guarantees', () => {
    it('3.1: Permintaan Admin API tanpa cookie sesi ditolak 401', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'GET',
      });
      const res = await adminProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('UNAUTHORIZED');
    });

    it('3.2: Permintaan Admin API dengan cookie sesi kedaluwarsa ditolak 401', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'GET',
        headers: { 'Cookie': expiredSessionCookie },
      });
      const res = await adminProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('INVALID_SESSION');
    });

    it('3.3: Mutasi Admin API tanpa header CSRF X-SleepyKoala-Admin ditolak 403', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: { id: 'x' } }),
      });
      const res = await adminProjectsPost({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('MISSING_CSRF_HEADER');
    });

    it('3.4: Mutasi Admin API dari sumber cross-site ditolak 403', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Sec-Fetch-Site': 'cross-site',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({ project: { id: 'x' } }),
      });
      const res = await adminProjectsPost({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('CROSS_SITE_REQUEST_REJECTED');
    });

    it('3.5: Public endpoint /api/projects/:slug untuk proyek DRAFT menghasilkan 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [{ slug: 'hidden-draft', publishState: 'DRAFT' }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects/hidden-draft');
      const res = await publicSingleProjectGet({
        request: req,
        params: { slug: 'hidden-draft' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('3.6: Public endpoint /api/projects/:slug untuk proyek ARCHIVED menghasilkan 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: {
            projects: [{ slug: 'old-archived', publishState: 'ARCHIVED' }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/projects/old-archived');
      const res = await publicSingleProjectGet({
        request: req,
        params: { slug: 'old-archived' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('3.7: Relational Privacy: Media dari proyek DRAFT ditolak dari akses publik', async () => {
      // Backend relational check: parent project is DRAFT -> returns NOT_FOUND
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: false,
          error: 'NOT_FOUND',
          message: 'Media tidak ditemukan.',
        }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      );

      const req = new Request('https://sleepykoala.app/api/media/med_draft_proj_media');
      const res = await publicMediaGet({
        request: req,
        params: { mediaId: 'med_draft_proj_media' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  // =========================================================================
  // 4. RELIABILITY, RESILIENCE & FAIL-CLOSED BEHAVIOR (SECTION 9.4)
  // =========================================================================
  describe('4. Reliability, Resilience & Fail-Closed Behavior', () => {
    it('4.1: Upstream Apps Script timeout menghasilkan HTTP 503 Fail-Closed tanpa mempublikasikan fallback statis', async () => {
      // Mock fetch timeout
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Upstream timeout'));

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
      expect(json.data).toBeUndefined(); // TIDAK ADA fallback data statis
    });

    it('4.2: Upstream Apps Script merespons 502 / Invalid JSON menghasilkan HTTP 503 Fail-Closed', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response('<html><body>Google Error 500</body></html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        })
      );

      const req = new Request('https://sleepykoala.app/api/projects');
      const res = await publicProjectsGet({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });

    it('4.3: Menolak unggahan media melebihi batas 2.0 MB dengan HTTP 413', async () => {
      const hugeB64 = 'A'.repeat(3 * 1024 * 1024); // 3 MB string
      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({
          projectId: 'mobile-kasir',
          fileName: 'huge.webp',
          mimeType: 'image/webp',
          base64Data: hugeB64,
        }),
      });

      const res = await adminMediaPost({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('4.4: Permintaan OPTIONS preflight menghasilkan HTTP 204 No Content', async () => {
      const resList = await publicProjectsOptions();
      expect(resList.status).toBe(204);

      const resSingle = await publicSingleProjectOptions();
      expect(resSingle.status).toBe(204);
    });

    it('4.5: Direct slug endpoint /api/projects/:slug menghasilkan HTTP 503 saat upstream timeout', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Upstream timeout'));

      const req = new Request('https://sleepykoala.app/api/projects/dompetnalar');
      const res = await publicSingleProjectGet({
        request: req,
        params: { slug: 'dompetnalar' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
      expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    });
  });

  // =========================================================================
  // 5. CLIENT SYNCHRONIZATION & REACTIVE HOOK (SECTION 6 & 10)
  // =========================================================================
  describe('5. Client Synchronization & projectService Reactivity', () => {
    it('5.1: fetchPublishedProjects memperbarui in-memory activeProjects saat CMS merilis data baru', async () => {
      const mockCmsData = [
        {
          id: 'proj_new_game',
          slug: 'new-game',
          name: 'New Game Studio',
          category: 'GAME',
          status: 'RELEASED',
          shortDescription: 'Game baru terbit dari CMS',
          fullDescription: 'Deskripsi lengkap game CMS',
          icon: '/api/media/med_icon_new',
          screenshots: [],
          version: '1.0.0',
          lastUpdated: '2026-11-01',
          registrationOpen: false,
          featured: true,
          publishState: 'PUBLISHED',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: true,
          data: mockCmsData,
          source: 'cms-live',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const result = await fetchPublishedProjects();
      expect(result.projects.length).toBe(1);
      expect(result.isUnavailable).toBe(false);

      // Verify that getAllProjects() and getProjectBySlug() now return the CMS-synced data
      const all = getAllProjects();
      expect(all.length).toBe(1);
      expect(all[0].slug).toBe('new-game');

      const single = getProjectBySlug('new-game');
      expect(single?.name).toBe('New Game Studio');

      // Verify calculateProjectStatistics computes on live data
      const stats = calculateProjectStatistics();
      expect(stats.totalProjects).toBe(1);
      expect(stats.releasedProjects).toBe(1);
      expect(stats.totalGames).toBe(1);
    });

    it('5.2: fetchPublishedProjects menghasilkan isUnavailable: true dan mengosongkan proyek saat backend 503', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Layanan katalog proyek sementara tidak tersedia.',
        }), { status: 503, headers: { 'Content-Type': 'application/json' } })
      );

      const result = await fetchPublishedProjects();
      expect(result.projects.length).toBe(0);
      expect(result.isUnavailable).toBe(true);
      expect(result.error).toContain('Layanan katalog proyek sementara tidak tersedia');
      expect(getAllProjects().length).toBe(0); // Proyek dikosongkan demi privasi fail-closed
    });
  });
});
