/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN MEDIA MANAGEMENT API ENDPOINT
 * Route: /api/admin/media
 * 
 * Methods:
 * - GET: Mengambil metadata media per project atau semua media
 * - POST: Mengunggah file media baru (WebP, PNG, JPEG) dengan verifikasi ketat
 * - PUT: Memperbarui status visibilitas (DRAFT, PUBLISHED, ARCHIVED) atau role
 * - DELETE: Menghapus / mengarsipkan file media
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
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
 * GET /api/admin/media?projectId=xxx
 * Mengambil metadata media
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
  const projectId = url.searchParams.get('projectId') || '*';

  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_GET_PROJECT_MEDIA', {
    projectId,
    sessionVersion: auth.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  const responseBody = gasResult.body;
  if (responseBody && typeof responseBody === 'object' && responseBody.success && Array.isArray(responseBody.media) && !responseBody.data) {
    responseBody.data = { media: responseBody.media };
  }

  return new Response(JSON.stringify(responseBody), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};

/**
 * POST /api/admin/media
 * Upload file media baru
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

  // 3. Batas Ukuran Request Header (3.5 MB base64 ceiling)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 3.5 * 1024 * 1024) {
    return new Response(JSON.stringify({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Ukuran payload melebihi batas 3.5 MB.' }), {
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

  const { fileName, mimeType, base64Data, projectId, role, visibility } = body;
  if (!base64Data || typeof base64Data !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'EMPTY_PAYLOAD', message: 'Data base64Data wajib disertakan.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  // Validasi batas binary size ~2.0 MB (2.8 MB base64 ceiling)
  if (base64Data.length > 2.8 * 1024 * 1024) {
    return new Response(JSON.stringify({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Ukuran file melebihi batas 2.0 MB.' }), {
      status: 413,
      headers: SECURITY_HEADERS,
    });
  }

  // 4. Panggil Apps Script M2M Backend
  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_UPLOAD_MEDIA', {
    projectId: projectId || 'global',
    fileName: fileName || 'asset.webp',
    mimeType: mimeType || 'image/webp',
    base64Data,
    role: role || 'GALLERY',
    visibility: visibility || 'DRAFT',
    sessionVersion: auth.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  const responseBody = gasResult.body;
  if (responseBody && typeof responseBody === 'object' && responseBody.success && Array.isArray(responseBody.media) && !responseBody.data) {
    responseBody.data = { media: responseBody.media };
  }

  return new Response(JSON.stringify(responseBody), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};

/**
 * PUT /api/admin/media
 * Memperbarui status visibilitas atau role media
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

  const { mediaId, visibility, role } = body;
  if (!mediaId) {
    return new Response(JSON.stringify({ success: false, error: 'VALIDATION_ERROR', message: 'Parameter mediaId wajib diisi.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_UPDATE_MEDIA_STATUS', {
    mediaId,
    visibility,
    role,
    sessionVersion: auth.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  const responseBody = gasResult.body;
  if (responseBody && typeof responseBody === 'object' && responseBody.success && Array.isArray(responseBody.media) && !responseBody.data) {
    responseBody.data = { media: responseBody.media };
  }

  return new Response(JSON.stringify(responseBody), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};

/**
 * DELETE /api/admin/media
 * Menghapus / mengarsipkan media
 */
export const onRequestDelete = async (context: {
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

  const { mediaId } = body;
  if (!mediaId) {
    return new Response(JSON.stringify({ success: false, error: 'VALIDATION_ERROR', message: 'Parameter mediaId wajib diisi.' }), {
      status: 400,
      headers: SECURITY_HEADERS,
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const isPermanent = body.permanent === true;
  const gasResult = await callGasBackend(env, 'ADMIN_DELETE_MEDIA', {
    mediaId,
    permanent: isPermanent,
    sessionVersion: auth.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  const responseBody = gasResult.body;
  if (responseBody && typeof responseBody === 'object' && responseBody.success && Array.isArray(responseBody.media) && !responseBody.data) {
    responseBody.data = { media: responseBody.media };
  }

  return new Response(JSON.stringify(responseBody), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};
