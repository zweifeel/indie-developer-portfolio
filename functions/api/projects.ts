/**
 * ============================================================================
 * SLEEPYKOALA CMS — PUBLIC PROJECTS API ENDPOINT
 * Route: /api/projects
 * 
 * Serves verified published projects from the CMS database to the public website.
 * Strict Relational Authorization Check:
 * - Only projects with publishState === 'PUBLISHED' are returned.
 * - Draft and Archived projects are strictly excluded.
 * - Fail-Closed: If upstream backend is unavailable, timed out, or returns 5xx/invalid,
 *   returns HTTP 503 (no-store, no-cache). NEVER falls back to static projects.json.
 * - Cache-Control: no-cache, must-revalidate (RFC 9111) for successful responses.
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  callGasBackend,
} from './admin/auth/utils';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

export const onRequestGet = async (context: {
  request: Request;
  env: AuthEnv;
}): Promise<Response> => {
  const { env } = context;

  try {
    const gasResult = await callGasBackend(env, 'CMS_GET_PROJECTS', {
      isPublicOnly: true,
    });

    const rawCmsProjects = Array.isArray(gasResult.body?.data?.projects)
      ? gasResult.body.data.projects
      : Array.isArray(gasResult.body?.projects)
        ? gasResult.body.projects
        : null;

    if (gasResult.status === 200 && gasResult.body?.success && rawCmsProjects) {
      
      // Strict Relational Filter: Hanya proyek PUBLISHED
      const publishedProjects = rawCmsProjects
        .filter((p: any) => p && String(p.publishState || '').toUpperCase() === 'PUBLISHED')
        .map((p: any) => ({
          ...p,
          icon: p.iconUrl || p.icon || '',
          screenshots: Array.isArray(p.screenshots) ? p.screenshots : [],
          tags: Array.isArray(p.tags) ? p.tags : [],
          technicalHighlights: Array.isArray(p.technicalHighlights) ? p.technicalHighlights : [],
          capabilities: Array.isArray(p.capabilities) ? p.capabilities : [],
          publishState: 'PUBLISHED',
        }));

      return new Response(JSON.stringify({
        success: true,
        data: publishedProjects,
        count: publishedProjects.length,
        source: 'cms-live',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Cache-Control': 'no-cache, must-revalidate',
          'Vary': 'Accept-Encoding',
          'X-Data-Source': 'cms-live',
        },
      });
    }

    // Fail-Closed: Upstream error, timeout, or invalid response
    console.warn('[Projects API] Upstream Apps Script tidak tersedia atau merespons error:', gasResult.status, gasResult.body?.error);
    return new Response(JSON.stringify({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Layanan katalog proyek sementara tidak tersedia.',
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[Projects API] Exception saat memanggil backend:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Layanan katalog proyek sementara tidak tersedia.',
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
};
