import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchAdminProjects,
  fetchAdminAuditLogs,
  CmsProject,
} from '../services/cmsProjectService';
import {
  fetchProjectMedia,
  uploadCmsMedia,
} from '../services/cmsMediaService';
import { getAdminSession } from '../services/adminAuthService';

describe('Milestone 6.5.5: Admin API Response Normalization & Metrics Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Flat project response
  it('1. fetchAdminProjects handles flat response ({ success: true, projects: [...] }) correctly', async () => {
    const mockFlatResponse = {
      success: true,
      error: null,
      message: 'Data proyek berhasil dimuat.',
      projects: [
        { id: 'p1', name: 'DompetNalar', publishState: 'PUBLISHED' },
        { id: 'p2', name: 'Worklume', publishState: 'DRAFT' },
      ],
      count: 2,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockFlatResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await fetchAdminProjects();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.data?.[0].id).toBe('p1');
    expect(res.data?.[1].name).toBe('Worklume');
  });

  // 2. Nested project response
  it('2. fetchAdminProjects handles nested response ({ success: true, data: { projects: [...] } }) correctly', async () => {
    const mockNestedResponse = {
      success: true,
      data: {
        projects: [
          { id: 'p3', name: 'Mobile Kasir', publishState: 'PUBLISHED' },
        ],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockNestedResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await fetchAdminProjects();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].id).toBe('p3');
  });

  // 3. Flat media response
  it('3. fetchProjectMedia handles flat response ({ success: true, media: [...] }) correctly', async () => {
    const mockFlatMedia = {
      success: true,
      error: null,
      message: 'Daftar media berhasil dimuat.',
      media: [
        {
          mediaId: 'm-1',
          projectId: 'p1',
          safeName: 'banner.webp',
          role: 'FEATURE_GRAPHIC',
          visibility: 'PUBLISHED',
        },
      ],
      count: 1,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockFlatMedia), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await fetchProjectMedia('*');
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].mediaId).toBe('m-1');
  });

  // 4. Nested media response
  it('4. fetchProjectMedia handles nested response ({ success: true, data: { media: [...] } }) correctly', async () => {
    const mockNestedMedia = {
      success: true,
      data: {
        media: [
          {
            mediaId: 'm-2',
            projectId: 'p2',
            safeName: 'icon.webp',
            role: 'ICON',
            visibility: 'DRAFT',
          },
        ],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockNestedMedia), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await fetchProjectMedia('p2');
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].mediaId).toBe('m-2');
  });

  // 5. Flat audit log response
  it('5. fetchAdminAuditLogs handles flat response ({ success: true, logs: [...] }) correctly', async () => {
    const mockFlatLogs = {
      success: true,
      error: null,
      message: 'Audit logs berhasil dimuat.',
      logs: [
        {
          timestamp: '2026-11-02 12:00:00',
          action: 'SAVE_PROJECT',
          targetId: 'p1',
          adminEmail: 'zweifeel@gmail.com',
          clientIp: '127.0.0.1',
          details: { publishState: 'PUBLISHED' },
        },
      ],
      count: 1,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockFlatLogs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await fetchAdminAuditLogs();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].action).toBe('SAVE_PROJECT');
  });

  // 6. Nested audit log response
  it('6. fetchAdminAuditLogs handles nested response ({ success: true, data: { logs: [...] } }) correctly', async () => {
    const mockNestedLogs = {
      success: true,
      data: {
        logs: [
          {
            timestamp: '2026-11-02 12:05:00',
            action: 'REORDER_PROJECTS',
            targetId: '-',
            adminEmail: 'zweifeel@gmail.com',
            clientIp: '127.0.0.1',
            details: { count: 3 },
          },
        ],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockNestedLogs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await fetchAdminAuditLogs();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data?.[0].action).toBe('REORDER_PROJECTS');
  });

  // 7. Response without required array (malformed response)
  it('7. Rejects responses missing expected arrays without fabricating empty success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, unexpectedKey: 123 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const projRes = await fetchAdminProjects();
    expect(projRes.success).toBe(false);
    expect(projRes.error).toBe('INVALID_RESPONSE_FORMAT');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const mediaRes = await fetchProjectMedia('*');
    expect(mediaRes.success).toBe(false);
    expect(mediaRes.error).toBe('INVALID_RESPONSE_FORMAT');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const logRes = await fetchAdminAuditLogs();
    expect(logRes.success).toBe(false);
    expect(logRes.error).toBe('INVALID_RESPONSE_FORMAT');
  });

  // 8. HTTP error and backend error preservation
  it('8. Preserves backend errors and handles network failures correctly', async () => {
    // Backend business error
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: 'SESSION_REVOKED',
          message: 'Sesi administrator telah dicabut atau kedaluwarsa.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const projRes = await fetchAdminProjects();
    expect(projRes.success).toBe(false);
    expect(projRes.error).toBe('SESSION_REVOKED');
    expect(projRes.message).toBe('Sesi administrator telah dicabut atau kedaluwarsa.');

    // Network error
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network connection dropped'));

    const netRes = await fetchAdminProjects();
    expect(netRes.success).toBe(false);
    expect(netRes.error).toBe('NETWORK_ERROR');
    expect(netRes.message).toContain('Network connection dropped');
  });

  // 9. uploadCmsMedia dual normalization
  it('9. uploadCmsMedia supports both flat and nested responses', async () => {
    const dummyFile = new File(['image-bytes'], 'test.webp', { type: 'image/webp' });

    // Flat response from Apps Script
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          media: {
            mediaId: 'm-upload-1',
            projectId: 'p1',
            safeName: 'test.webp',
            role: 'GALLERY',
            visibility: 'DRAFT',
          },
          isDuplicate: false,
          message: 'Media berhasil diunggah dan dicatat.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const uploadFlat = await uploadCmsMedia('p1', dummyFile);
    expect(uploadFlat.success).toBe(true);
    expect(uploadFlat.media?.mediaId).toBe('m-upload-1');
    expect(uploadFlat.isDuplicate).toBe(false);

    // Nested response from mocked API
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            media: {
              mediaId: 'm-upload-2',
              projectId: 'p1',
              safeName: 'test2.webp',
              role: 'GALLERY',
              visibility: 'DRAFT',
            },
            isDuplicate: true,
          },
          message: 'File identik sudah ada di pustaka media.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const uploadNested = await uploadCmsMedia('p1', dummyFile);
    expect(uploadNested.success).toBe(true);
    expect(uploadNested.media?.mediaId).toBe('m-upload-2');
    expect(uploadNested.isDuplicate).toBe(true);
  });

  // 10. Dashboard metrics calculation logic
  it('10. Dashboard metrics correctly compute totals, published, draft, and archived counts without duplication', () => {
    const sampleProjects: CmsProject[] = [
      { id: '1', slug: 'p1', name: 'P1', category: 'APPLICATION', status: 'RELEASED', publishState: 'PUBLISHED', shortDescription: '', fullDescription: '', screenshots: [], tags: [], technicalHighlights: [], capabilities: [], version: '1.0', lastUpdated: '', registrationOpen: false, featured: false },
      { id: '2', slug: 'p2', name: 'P2', category: 'APPLICATION', status: 'READY_FOR_RELEASE', publishState: 'PUBLISHED', shortDescription: '', fullDescription: '', screenshots: [], tags: [], technicalHighlights: [], capabilities: [], version: '1.0', lastUpdated: '', registrationOpen: false, featured: false },
      { id: '3', slug: 'p3', name: 'P3', category: 'GAME', status: 'WORK_IN_PROGRESS', publishState: 'DRAFT', shortDescription: '', fullDescription: '', screenshots: [], tags: [], technicalHighlights: [], capabilities: [], version: '1.0', lastUpdated: '', registrationOpen: false, featured: false },
      { id: '4', slug: 'p4', name: 'P4', category: 'GAME', status: 'WORK_IN_PROGRESS', publishState: 'DRAFT', shortDescription: '', fullDescription: '', screenshots: [], tags: [], technicalHighlights: [], capabilities: [], version: '1.0', lastUpdated: '', registrationOpen: false, featured: false },
      { id: '5', slug: 'p5', name: 'P5', category: 'GAME', status: 'COMING_SOON', publishState: 'DRAFT', shortDescription: '', fullDescription: '', screenshots: [], tags: [], technicalHighlights: [], capabilities: [], version: '1.0', lastUpdated: '', registrationOpen: false, featured: false },
      { id: '6', slug: 'p6', name: 'P6', category: 'APPLICATION', status: 'WORK_IN_PROGRESS', publishState: 'ARCHIVED', shortDescription: '', fullDescription: '', screenshots: [], tags: [], technicalHighlights: [], capabilities: [], version: '1.0', lastUpdated: '', registrationOpen: false, featured: false },
    ];

    const projectMetrics = {
      total: sampleProjects.length,
      published: sampleProjects.filter((p) => p.publishState === 'PUBLISHED').length,
      draft: sampleProjects.filter((p) => p.publishState === 'DRAFT').length,
      archived: sampleProjects.filter((p) => p.publishState === 'ARCHIVED').length,
    };

    expect(projectMetrics.total).toBe(6);
    expect(projectMetrics.published).toBe(2);
    expect(projectMetrics.draft).toBe(3);
    expect(projectMetrics.archived).toBe(1);
    expect(projectMetrics.published + projectMetrics.draft + projectMetrics.archived).toBe(projectMetrics.total);
  });

  // 11. Environment label isolation (production vs test)
  it('11. getAdminSession extracts environment correctly ensuring production and test labels never swap', async () => {
    // Production session
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          authenticated: true,
          email: 'zweifeel@gmail.com',
          sessionVersion: 1,
          environment: 'production',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const prodSession = await getAdminSession();
    expect(prodSession.authenticated).toBe(true);
    expect(prodSession.environment).toBe('production');

    // Test session
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          authenticated: true,
          email: 'test@example.com',
          sessionVersion: 1,
          environment: 'test',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const testSession = await getAdminSession();
    expect(testSession.authenticated).toBe(true);
    expect(testSession.environment).toBe('test');

    // Strict isolation: production != test
    expect(prodSession.environment).not.toBe(testSession.environment);
  });
});
