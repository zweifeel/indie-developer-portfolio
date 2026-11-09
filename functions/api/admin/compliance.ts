/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN COMPLIANCE API ENDPOINT
 * Route: /api/admin/compliance
 * 
 * Methods:
 * - GET: Mengambil daftar kepatuhan seluruh proyek atau satu target proyek
 * - POST: Menyimpan / memperbarui / mempublikasikan Privacy Policy & Delete Account
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  MAX_PAYLOAD_SIZE,
  validateAdminCsrf,
  parseCookies,
  verifySessionToken,
  callGasBackend,
  SESSION_COOKIE_NAME,
  resolveSessionSecret,
} from './auth/utils';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

async function authenticateAdminSession(request: Request, env: AuthEnv) {
  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return { authenticated: false, status: 401, error: 'UNAUTHORIZED', message: 'Sesi admin tidak ditemukan. Silakan masuk kembali.' };
  }

  const sessionRes = resolveSessionSecret(env);
  if (!sessionRes.secret) {
    return { authenticated: false, status: 503, error: 'CONFIGURATION_ERROR', message: 'Secret admin belum dikonfigurasi.' };
  }

  const verification = await verifySessionToken(sessionToken, sessionRes.secret);
  if (!verification.valid || !verification.payload) {
    return { authenticated: false, status: 401, error: 'INVALID_SESSION', message: 'Sesi admin tidak valid atau telah kedaluwarsa.' };
  }

  return { authenticated: true, payload: verification.payload };
}

/**
 * GET /api/admin/compliance
 */
export const onRequestGet = async (context: {
  request: Request;
  env: AuthEnv;
}): Promise<Response> => {
  const { request, env } = context;

  const auth = await authenticateAdminSession(request, env);
  if (!auth.authenticated || !auth.payload) {
    return new Response(JSON.stringify({ success: false, error: auth.error, message: auth.message }), {
      status: auth.status,
      headers: SECURITY_HEADERS,
    });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get('target');

  const gasResult = await callGasBackend(env, 'ADMIN_GET_COMPLIANCE', {
    target: target || undefined,
    sessionVersion: auth.payload.sessionVersion,
  });

  return new Response(JSON.stringify(gasResult.body), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};

/**
 * POST /api/admin/compliance
 */
export const onRequestPost = async (context: {
  request: Request;
  env: AuthEnv;
}): Promise<Response> => {
  const { request, env } = context;

  // 1. Validasi Proteksi CSRF
  const csrf = validateAdminCsrf(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ success: false, error: csrf.error, message: csrf.message }), {
      status: 403,
      headers: SECURITY_HEADERS,
    });
  }

  // 2. Validasi Sesi
  const auth = await authenticateAdminSession(request, env);
  if (!auth.authenticated || !auth.payload) {
    return new Response(JSON.stringify({ success: false, error: auth.error, message: auth.message }), {
      status: auth.status,
      headers: SECURITY_HEADERS,
    });
  }

  // 3. Validasi Ukuran Payload
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE * 5) {
    return new Response(JSON.stringify({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Ukuran payload melebihi batas.' }), {
      status: 413,
      headers: SECURITY_HEADERS,
    });
  }

  try {
    const rawBody = await request.json();
    const { compliance, action } = rawBody as { compliance: any; action?: string };

    if (!compliance || typeof compliance !== 'object') {
      return new Response(JSON.stringify({ success: false, error: 'INVALID_DATA', message: 'Data compliance wajib disertakan.' }), {
        status: 400,
        headers: SECURITY_HEADERS,
      });
    }

    const gasResult = await callGasBackend(env, 'ADMIN_SAVE_COMPLIANCE', {
      compliance,
      action,
      adminEmail: auth.payload.email,
      sessionVersion: auth.payload.sessionVersion,
    });

    return new Response(JSON.stringify(gasResult.body), {
      status: gasResult.status,
      headers: SECURITY_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Payload JSON tidak valid: ' + err.message }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }
};
