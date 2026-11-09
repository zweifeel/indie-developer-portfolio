/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN AUDIT LOGS API ENDPOINT
 * Route: /api/admin/audit-logs
 * 
 * Methods:
 * - GET: Mengambil riwayat audit log CMS
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
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

export const onRequestGet = async (context: {
  request: Request;
  env: AuthEnv;
}): Promise<Response> => {
  const { request, env } = context;

  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED', message: 'Sesi admin tidak ditemukan.' }), {
      status: 401,
      headers: SECURITY_HEADERS,
    });
  }

  const sessionRes = resolveSessionSecret(env);
  if (!sessionRes.secret) {
    return new Response(JSON.stringify({ success: false, error: 'CONFIGURATION_ERROR', message: 'Secret admin belum dikonfigurasi.' }), {
      status: 503,
      headers: SECURITY_HEADERS,
    });
  }

  const verification = await verifySessionToken(sessionToken, sessionRes.secret);
  if (!verification.valid || !verification.payload) {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_SESSION', message: 'Sesi admin tidak valid.' }), {
      status: 401,
      headers: SECURITY_HEADERS,
    });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_GET_AUDIT_LOGS', {
    sessionVersion: verification.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  const body = gasResult.body;
  if (body && typeof body === 'object' && body.success && Array.isArray(body.logs) && !body.data) {
    body.data = { logs: body.logs };
  }

  return new Response(JSON.stringify(body), {
    status: gasResult.status,
    headers: SECURITY_HEADERS,
  });
};
