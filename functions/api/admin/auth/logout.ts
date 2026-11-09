/**
 * ============================================================================
 * SLEEPYKOALA CMS — LOGOUT ENDPOINT
 * Route: POST /api/admin/auth/logout
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  validateAdminCsrf,
  callGasBackend,
  createClearSessionCookie,
} from './utils';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

export const onRequestPost = async (context: {
  request: Request;
  env: AuthEnv;
}): Promise<Response> => {
  const { request, env } = context;

  try {
    // 1. Verifikasi Proteksi CSRF
    const csrfCheck = validateAdminCsrf(request);
    if (!csrfCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: csrfCheck.error || 'CSRF_REJECTED',
          message: 'Permintaan logout ditolak oleh lapisan proteksi CSRF.',
        }),
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // 2. Baca Body Opsional (Untuk Dukungan Global Revocation)
    let revokeAll = false;
    try {
      const body = await request.json() as any;
      if (body && body.revokeAll === true) {
        revokeAll = true;
      }
    } catch {
      // Body kosong diperbolehkan untuk standard logout
    }

    // 3. Jika revokeAll diminta, panggil Apps Script untuk menaikkan ADMIN_SESSION_VERSION
    if (revokeAll) {
      const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
      await callGasBackend(env, 'ADMIN_REVOKE_SESSIONS', {
        clientIpMasked: clientIp,
      });
    }

    // 4. Hapus Cookie Sesi pada Browser Klien
    const clearCookieHeader = createClearSessionCookie();

    const headersWithClearedCookie = {
      ...SECURITY_HEADERS,
      'Set-Cookie': clearCookieHeader,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: revokeAll
          ? 'Seluruh sesi administrator berhasil dicabut dan logout selesai.'
          : 'Berhasil keluar dari sesi administrator.',
      }),
      { status: 200, headers: headersWithClearedCookie }
    );
  } catch (err: any) {
    console.error('[Logout Proxy Error]', err?.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan sistem saat memproses logout.',
      }),
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
};
