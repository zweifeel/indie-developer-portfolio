/**
 * ============================================================================
 * SLEEPYKOALA CMS — GET SESSION STATUS ENDPOINT
 * Route: GET /api/admin/auth/session
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  SESSION_COOKIE_NAME,
  parseCookies,
  verifySessionToken,
  callGasBackend,
  createClearSessionCookie,
  resolveM2MSecret,
  resolveSessionSecret,
} from './utils';

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

  try {
    // 1. Ekstraksi Cookie Sesi
    const cookies = parseCookies(request);
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({
          success: true,
          authenticated: false,
          message: 'Tidak ada sesi aktif.',
        }),
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    // 2. Verifikasi Kriptografis Token HMAC & Kedaluwarsa Lokal
    const sessionRes = resolveSessionSecret(env);
    if (!sessionRes.secret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CONFIGURATION_ERROR',
          message: 'Secret penandatangan sesi admin belum diatur.',
        }),
        { status: 503, headers: SECURITY_HEADERS }
      );
    }

    const verification = await verifySessionToken(sessionToken, sessionRes.secret);
    if (!verification.valid || !verification.payload) {
      // Token tidak valid atau tanda tangan HMAC salah / kedaluwarsa
      const headersWithClearedCookie = {
        ...SECURITY_HEADERS,
        'Set-Cookie': createClearSessionCookie(),
      };
      return new Response(
        JSON.stringify({
          success: true,
          authenticated: false,
          reason: verification.error || 'INVALID_OR_EXPIRED_SESSION',
        }),
        { status: 200, headers: headersWithClearedCookie }
      );
    }

    const payload = verification.payload;

    // 3. Verifikasi Versi Sesi Terpusat dengan Apps Script (Revocation Check)
    // Sesi wajib diverifikasi terhadap Apps Script backend (Fail-Closed).
    const m2m = resolveM2MSecret(env);
    if (!env.GAS_WEBAPP_URL || !m2m.secret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CONFIGURATION_ERROR',
          message: 'Layanan backend untuk verifikasi revokasi sesi belum dikonfigurasi.',
        }),
        { status: 503, headers: SECURITY_HEADERS }
      );
    }

    const gasResult = await callGasBackend(env, 'ADMIN_CHECK_SESSION', {
      sessionVersion: payload.sessionVersion,
    });

    if (gasResult.status !== 200 || !gasResult.body || !gasResult.body.success) {
      const isRevoked = gasResult.body?.error === 'SESSION_REVOKED';
      const headersWithClearedCookie = {
        ...SECURITY_HEADERS,
        ...(isRevoked ? { 'Set-Cookie': createClearSessionCookie() } : {}),
      };

      if (isRevoked) {
        return new Response(
          JSON.stringify({
            success: true,
            authenticated: false,
            reason: 'SESSION_REVOKED',
            message: 'Sesi telah dicabut secara terpusat oleh administrator.',
          }),
          { status: 200, headers: headersWithClearedCookie }
        );
      }

      // Fail-Closed: Backend gagal, timeout, atau mengembalikan 5xx/invalid
      return new Response(
        JSON.stringify({
          success: false,
          authenticated: false,
          error: gasResult.body?.error || 'BACKEND_CHECK_FAILED',
          message: 'Gagal memverifikasi status revokasi sesi dengan server pusat.',
        }),
        { status: gasResult.status >= 500 ? gasResult.status : 503, headers: SECURITY_HEADERS }
      );
    }

    // 4. Periksa kecocokan sessionVersion dari respons upstream
    const activeVersion = gasResult.body.data?.activeSessionVersion ?? gasResult.body.currentSessionVersion;
    if (typeof activeVersion === 'number' && activeVersion !== payload.sessionVersion) {
      const headersWithClearedCookie = {
        ...SECURITY_HEADERS,
        'Set-Cookie': createClearSessionCookie(),
      };
      return new Response(
        JSON.stringify({
          success: true,
          authenticated: false,
          reason: 'SESSION_VERSION_MISMATCH',
          message: 'Versi sesi tidak sesuai dengan sesi aktif terpusat.',
        }),
        { status: 200, headers: headersWithClearedCookie }
      );
    }

    // 5. Sesi Valid Sepenuhnya (HMAC Valid + Expiry Valid + Upstream Revocation Checked)
    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        email: payload.email,
        sessionVersion: payload.sessionVersion,
        environment: m2m.environment,
      }),
      { status: 200, headers: SECURITY_HEADERS }
    );
  } catch (err: any) {
    console.error('[Session Check Proxy Error]', err?.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Gagal memverifikasi status sesi.',
      }),
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
};
