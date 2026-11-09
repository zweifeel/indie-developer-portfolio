/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN PROTECTED PREVIEW API ENDPOINT
 * Route: /api/admin/progress/:slug/preview
 * 
 * Strict Admin Protected Preview:
 * - Requires authenticated admin session cookie (UNAUTHORIZED if missing or invalid)
 * - Returns preview projection (includes draft and review items, formatted in public shape)
 * - Excludes hidden items
 * - Sets X-Robots-Tag: noindex, nofollow (Prevents search engine crawling)
 * - Sets Cache-Control: no-store, no-cache, must-revalidate (Zero caching / leaking into public cache)
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  parseCookies,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  resolveSessionSecret,
  AUTHORIZED_ADMIN_EMAIL,
} from '../../auth/utils';

import {
  fetchAdminProgressPreview,
} from '../../../../../src/services/cmsProgressService';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      ...SECURITY_HEADERS,
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};

export const onRequestGet = async (context: {
  request: Request;
  params: { slug: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { request, params, env } = context;
  const slug = params.slug ? String(params.slug).trim().toLowerCase() : '';

  if (!slug || !/^[a-z0-9-_]+$/.test(slug)) {
    return new Response(
      JSON.stringify({ success: false, error: 'INVALID_SLUG', message: 'Slug proyek tidak valid.' }),
      {
        status: 400,
        headers: {
          ...SECURITY_HEADERS,
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  // 1. Authenticate Admin Session
  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Akses pratinjau memerlukan sesi administrator yang valid.',
      }),
      {
        status: 401,
        headers: {
          ...SECURITY_HEADERS,
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  const sessionRes = resolveSessionSecret(env);
  if (!sessionRes.secret) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'CONFIGURATION_ERROR',
        message: 'Secret admin belum dikonfigurasi.',
      }),
      {
        status: 503,
        headers: {
          ...SECURITY_HEADERS,
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  const verification = await verifySessionToken(sessionToken, sessionRes.secret);
  if (!verification.valid || !verification.payload) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INVALID_SESSION',
        message: 'Sesi administrator tidak valid atau telah kedaluwarsa.',
      }),
      {
        status: 401,
        headers: {
          ...SECURITY_HEADERS,
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  // Privilege escalation check: only AUTHORIZED_ADMIN_EMAIL can access admin preview
  if (verification.payload.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'FORBIDDEN',
        message: 'Email dalam sesi tidak memiliki hak akses administrator.',
      }),
      {
        status: 403,
        headers: {
          ...SECURITY_HEADERS,
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  }

  // 2. Fetch Preview Projection
  const previewRes = await fetchAdminProgressPreview(slug);

  return new Response(JSON.stringify(previewRes), {
    status: previewRes.success ? 200 : 404,
    headers: {
      ...SECURITY_HEADERS,
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
};
