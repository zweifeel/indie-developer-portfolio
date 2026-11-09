/**
 * ============================================================================
 * SLEEPYKOALA CMS — PUBLIC COMPLIANCE API ENDPOINT
 * Route: /api/compliance/:slug
 * 
 * Serves verified published Privacy Policy and Delete Account guidelines for a project.
 * Fail-Closed: If unconfigured, draft, or backend offline, returns 404 / 503.
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
  params: { slug?: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { params, env } = context;
  const slug = params?.slug;

  if (!slug) {
    return new Response(JSON.stringify({ success: false, error: 'BAD_REQUEST', message: 'Parameter slug proyek diperlukan.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  try {
    const gasResult = await callGasBackend(env, 'CMS_GET_COMPLIANCE', {
      slugOrId: slug,
      isPublicOnly: true,
    });

    if (gasResult.status === 200 && gasResult.body?.success) {
      return new Response(JSON.stringify(gasResult.body), {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'Cache-Control': 'no-cache, must-revalidate',
        },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: gasResult.body?.error || 'NOT_FOUND',
      message: gasResult.body?.message || 'Halaman kepatuhan tidak ditemukan atau belum dipublikasikan.',
    }), {
      status: gasResult.status === 404 ? 404 : 503,
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'no-store, no-cache',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'SERVER_ERROR',
      message: err.message || 'Terjadi kesalahan internal server.',
    }), {
      status: 500,
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'no-store, no-cache',
      },
    });
  }
};
