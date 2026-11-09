/**
 * ============================================================================
 * SLEEPYKOALA CMS — PUBLIC SETTINGS API ENDPOINT
 * Route: /api/settings
 * 
 * Serves verified published website content & branding to the public website.
 * Fail-Closed & Cache Policy:
 * - Returns published settings only. If not published or unavailable, returns 404 or default.
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
    const gasResult = await callGasBackend(env, 'CMS_GET_SETTINGS', {
      isPublicOnly: true,
    });

    if (gasResult.status === 200 && gasResult.body?.success) {
      const settings = gasResult.body.data?.settings || gasResult.body.settings;
      if (!settings) {
        return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND', message: 'Pengaturan website belum dipublikasikan.' }), {
          status: 404,
          headers: {
            ...SECURITY_HEADERS,
            'Cache-Control': 'no-store, no-cache',
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        settings: settings,
      }), {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'Cache-Control': 'no-cache, must-revalidate',
        },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: gasResult.body?.error || 'BACKEND_ERROR',
      message: gasResult.body?.message || 'Gagal memuat pengaturan publik.',
    }), {
      status: gasResult.status >= 400 ? gasResult.status : 503,
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
