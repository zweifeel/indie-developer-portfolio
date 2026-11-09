/**
 * ============================================================================
 * SLEEPYKOALA CMS — PUBLIC SINGLE PROJECT API ENDPOINT
 * Route: /api/projects/:slug
 * 
 * Serves a single published project by its unique slug.
 * Strict Relational Authorization Check:
 * - Only returns 200 if the project exists and publishState === 'PUBLISHED'.
 * - Draft, Archived, or unknown slugs return 404 Not Found (no-store, no-cache).
 * - Fail-Closed: If backend is unavailable or fails, returns 503 Service Unavailable
 *   (no-store, no-cache). NEVER falls back to static projects.json.
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  callGasBackend,
} from '../admin/auth/utils';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

export const onRequestGet = async (context: {
  request: Request;
  params: { slug: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { params, env } = context;
  const slug = params.slug ? String(params.slug).trim().toLowerCase() : '';

  if (!slug) {
    return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND', message: 'Proyek tidak ditemukan.' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

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
      const matched = rawCmsProjects.find((p: any) => 
        p && 
        String(p.slug || '').trim().toLowerCase() === slug &&
        String(p.publishState || '').toUpperCase() === 'PUBLISHED'
      );

      if (!matched) {
        return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND', message: 'Proyek tidak ditemukan atau belum dipublikasikan.' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }

      const normalized = {
        ...matched,
        icon: matched.iconUrl || matched.icon || '',
        screenshots: Array.isArray(matched.screenshots) ? matched.screenshots : [],
        tags: Array.isArray(matched.tags) ? matched.tags : [],
        technicalHighlights: Array.isArray(matched.technicalHighlights) ? matched.technicalHighlights : [],
        capabilities: Array.isArray(matched.capabilities) ? matched.capabilities : [],
        publishState: 'PUBLISHED',
      };

      return new Response(JSON.stringify({
        success: true,
        data: normalized,
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

    // Fail-Closed: Backend unavailable / error / timeout
    return new Response(JSON.stringify({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Layanan detail proyek sementara tidak tersedia.',
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch {
    return new Response(JSON.stringify({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Layanan detail proyek sementara tidak tersedia.',
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
};
