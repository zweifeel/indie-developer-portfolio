/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN PROGRESS API ENDPOINT
 * Route: /api/admin/progress/:slug
 * 
 * Strict Admin Authentication & Operations:
 * - GET: Retrieves full internal canonical progress document (including draft/review/hidden)
 * - POST: Non-destructive save / update of canonical progress metadata
 * - PUT: Performs editorial status transition with confirmation and audit logging
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
  AUTHORIZED_ADMIN_EMAIL,
} from '../auth/utils';

import {
  fetchAdminProjectProgress,
  saveAdminProjectProgress,
  transitionItemPublicationStatus,
  ProgressItemType,
} from '../../../../src/services/cmsProgressService';

import { PublicationStatus } from '../../../../src/types/portfolioProgress';

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
    return {
      authenticated: false,
      status: 401,
      error: 'UNAUTHORIZED',
      message: 'Sesi admin tidak ditemukan. Silakan masuk kembali.',
    };
  }

  const sessionRes = resolveSessionSecret(env);
  if (!sessionRes.secret) {
    return {
      authenticated: false,
      status: 503,
      error: 'CONFIGURATION_ERROR',
      message: 'Secret admin belum dikonfigurasi.',
    };
  }

  const verification = await verifySessionToken(sessionToken, sessionRes.secret);
  if (!verification.valid || !verification.payload) {
    return {
      authenticated: false,
      status: 401,
      error: 'INVALID_SESSION',
      message: 'Sesi admin tidak valid atau telah kedaluwarsa.',
    };
  }

  // Privilege escalation check: only AUTHORIZED_ADMIN_EMAIL can access admin progress
  if (verification.payload.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return {
      authenticated: false,
      status: 403,
      error: 'FORBIDDEN',
      message: 'Email dalam sesi tidak memiliki hak akses administrator.',
    };
  }

  return { authenticated: true, payload: verification.payload };
}

/**
 * GET /api/admin/progress/:slug
 * Mengambil metadata progress lengkap internal (Admin View)
 */
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
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const auth = await authenticateAdminSession(request, env);
  if (!auth.authenticated || !auth.payload) {
    return new Response(
      JSON.stringify({ success: false, error: auth.error, message: auth.message }),
      { status: auth.status, headers: SECURITY_HEADERS }
    );
  }

  // Live upstream check if GAS endpoint configured
  if (env.GAS_WEBAPP_URL && env.GAS_WEBAPP_URL.startsWith('https://script.google.com/')) {
    try {
      const gasResult = await callGasBackend(env, 'ADMIN_GET_PROGRESS', {
        projectSlug: slug,
        sessionVersion: auth.payload.sessionVersion,
      });

      return new Response(JSON.stringify(gasResult.body), {
        status: gasResult.status,
        headers: SECURITY_HEADERS,
      });
    } catch {
      // Fallback to local service below if upstream times out
    }
  }

  const localRes = await fetchAdminProjectProgress(slug);
  return new Response(JSON.stringify(localRes), {
    status: localRes.success ? 200 : 400,
    headers: SECURITY_HEADERS,
  });
};

/**
 * POST /api/admin/progress/:slug
 * Menyimpan atau memperbarui metadata progress secara non-destruktif
 */
export const onRequestPost = async (context: {
  request: Request;
  params: { slug: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { request, params, env } = context;
  const slug = params.slug ? String(params.slug).trim().toLowerCase() : '';

  if (!slug || !/^[a-z0-9-_]+$/.test(slug)) {
    return new Response(
      JSON.stringify({ success: false, error: 'INVALID_SLUG', message: 'Slug proyek tidak valid.' }),
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  // 1. CSRF Protection
  const csrf = validateAdminCsrf(request);
  if (!csrf.valid) {
    return new Response(
      JSON.stringify({ success: false, error: csrf.error, message: csrf.message }),
      { status: 403, headers: SECURITY_HEADERS }
    );
  }

  // 2. Sesi Admin
  const auth = await authenticateAdminSession(request, env);
  if (!auth.authenticated || !auth.payload) {
    return new Response(
      JSON.stringify({ success: false, error: auth.error, message: auth.message }),
      { status: auth.status, headers: SECURITY_HEADERS }
    );
  }

  // 3. Payload size check
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE * 5) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'PAYLOAD_TOO_LARGE',
        message: 'Ukuran payload melebihi batas aman 50 KB.',
      }),
      { status: 413, headers: SECURITY_HEADERS }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INVALID_JSON',
        message: 'Format request body bukan JSON yang valid.',
      }),
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const updateDoc = body.document || body;

  // Upstream GAS call if configured
  if (env.GAS_WEBAPP_URL && env.GAS_WEBAPP_URL.startsWith('https://script.google.com/')) {
    try {
      const gasResult = await callGasBackend(env, 'ADMIN_SAVE_PROGRESS', {
        projectSlug: slug,
        document: updateDoc,
        adminEmail: auth.payload.email,
        sessionVersion: auth.payload.sessionVersion,
      });

      return new Response(JSON.stringify(gasResult.body), {
        status: gasResult.status,
        headers: SECURITY_HEADERS,
      });
    } catch {
      // Fallback
    }
  }

  const localRes = await saveAdminProjectProgress(slug, updateDoc, auth.payload.email);
  const statusCode = localRes.success ? 200 : (localRes.error === 'REPOSITORY_FROZEN' ? 403 : 400);
  return new Response(JSON.stringify(localRes), {
    status: statusCode,
    headers: SECURITY_HEADERS,
  });
};

/**
 * PUT /api/admin/progress/:slug
 * Melakukan transisi status publikasi editorial (draft -> review -> public -> hidden)
 */
export const onRequestPut = async (context: {
  request: Request;
  params: { slug: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { request, params, env } = context;
  const slug = params.slug ? String(params.slug).trim().toLowerCase() : '';

  if (!slug || !/^[a-z0-9-_]+$/.test(slug)) {
    return new Response(
      JSON.stringify({ success: false, error: 'INVALID_SLUG', message: 'Slug proyek tidak valid.' }),
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const csrf = validateAdminCsrf(request);
  if (!csrf.valid) {
    return new Response(
      JSON.stringify({ success: false, error: csrf.error, message: csrf.message }),
      { status: 403, headers: SECURITY_HEADERS }
    );
  }

  const auth = await authenticateAdminSession(request, env);
  if (!auth.authenticated || !auth.payload) {
    return new Response(
      JSON.stringify({ success: false, error: auth.error, message: auth.message }),
      { status: auth.status, headers: SECURITY_HEADERS }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Format JSON tidak valid.' }),
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const { itemType, itemId, targetStatus } = body;
  if (!itemType || !itemId || !targetStatus) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Field itemType, itemId, dan targetStatus wajib disediakan.',
      }),
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  if (env.GAS_WEBAPP_URL && env.GAS_WEBAPP_URL.startsWith('https://script.google.com/')) {
    try {
      const gasResult = await callGasBackend(env, 'ADMIN_SET_PROGRESS_STATUS', {
        projectSlug: slug,
        itemType,
        itemId,
        targetStatus,
        adminEmail: auth.payload.email,
        sessionVersion: auth.payload.sessionVersion,
      });

      return new Response(JSON.stringify(gasResult.body), {
        status: gasResult.status,
        headers: SECURITY_HEADERS,
      });
    } catch {
      // Fallback
    }
  }

  const transitionRes = await transitionItemPublicationStatus({
    projectSlug: slug,
    itemType: itemType as ProgressItemType,
    itemId: String(itemId),
    targetStatus: targetStatus as PublicationStatus,
    adminEmail: auth.payload.email,
  });

  const statusCode = transitionRes.success ? 200 : (transitionRes.error === 'REPOSITORY_FROZEN' ? 403 : 400);
  return new Response(JSON.stringify(transitionRes), {
    status: statusCode,
    headers: SECURITY_HEADERS,
  });
};
