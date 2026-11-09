/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN PROJECTS API ENDPOINT
 * Route: /api/admin/projects
 * 
 * Methods:
 * - GET: Mengambil seluruh proyek (termasuk status DRAFT dan ARCHIVED)
 * - POST: Menyimpan atau memperbarui proyek (Upsert)
 * - PUT: Mengatur ulang urutan proyek
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

/**
 * Helper validasi sesi admin dari cookie
 */
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
 * GET /api/admin/projects
 * Mengambil seluruh data proyek CMS (Internal Admin)
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

  const gasResult = await callGasBackend(env, 'CMS_GET_PROJECTS', {
    isPublicOnly: false,
    sessionVersion: auth.payload.sessionVersion,
  });

  const body = gasResult.body;
  if (body && typeof body === 'object' && body.success && Array.isArray(body.projects) && !body.data) {
    body.data = { projects: body.projects };
  }

  return new Response(JSON.stringify(body), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};

/**
 * POST /api/admin/projects
 * Menyimpan atau memperbarui proyek (Create/Update/Draft/Publish/Archive)
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

  // 3. Validasi Content-Length
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE * 5) {
    return new Response(JSON.stringify({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Ukuran payload melebihi batas.' }), {
      status: 413,
      headers: SECURITY_HEADERS,
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Format data JSON tidak valid.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  const project = body.project;
  if (!project || typeof project !== 'object') {
    return new Response(JSON.stringify({ success: false, error: 'VALIDATION_ERROR', message: 'Payload project wajib disertakan.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_SAVE_PROJECT', {
    project,
    sessionVersion: auth.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  return new Response(JSON.stringify(gasResult.body), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};

/**
 * PUT /api/admin/projects
 * Mengatur ulang urutan tampilan proyek
 */
export const onRequestPut = async (context: {
  request: Request;
  env: AuthEnv;
}): Promise<Response> => {
  const { request, env } = context;

  const csrf = validateAdminCsrf(request);
  if (!csrf.valid) {
    return new Response(JSON.stringify({ success: false, error: csrf.error, message: csrf.message }), {
      status: 403,
      headers: SECURITY_HEADERS,
    });
  }

  const auth = await authenticateAdminSession(request, env);
  if (!auth.authenticated || !auth.payload) {
    return new Response(JSON.stringify({ success: false, error: auth.error, message: auth.message }), {
      status: auth.status,
      headers: SECURITY_HEADERS,
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Format data JSON tidak valid.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  const orderedIds = body.orderedIds;
  if (!Array.isArray(orderedIds)) {
    return new Response(JSON.stringify({ success: false, error: 'VALIDATION_ERROR', message: 'Parameter orderedIds harus berupa array string.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_REORDER_PROJECTS', {
    orderedIds,
    sessionVersion: auth.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  return new Response(JSON.stringify(gasResult.body), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};
