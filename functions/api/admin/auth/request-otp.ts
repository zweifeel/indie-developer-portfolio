/**
 * ============================================================================
 * SLEEPYKOALA CMS — REQUEST OTP ENDPOINT
 * Route: POST /api/admin/auth/request-otp
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  MAX_PAYLOAD_SIZE,
  AUTHORIZED_ADMIN_EMAIL,
  validateAdminCsrf,
  callGasBackend,
  resolveM2MSecret,
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
    // 1. Verifikasi Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Header Content-Type harus berupa application/json.',
        }),
        { status: 415, headers: SECURITY_HEADERS }
      );
    }

    // 2. Verifikasi Ukuran Payload
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Ukuran payload permintaan melebihi batas 10 KB.',
        }),
        { status: 413, headers: SECURITY_HEADERS }
      );
    }

    // 3. Verifikasi Proteksi CSRF & Origin
    const csrfCheck = validateAdminCsrf(request);
    if (!csrfCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: csrfCheck.error || 'CSRF_REJECTED',
          message: 'Permintaan ditolak oleh lapisan proteksi CSRF.',
        }),
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // 4. Baca dan Validasi Body JSON
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_JSON',
          message: 'Format data body harus berupa JSON yang valid.',
        }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || email !== AUTHORIZED_ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UNAUTHORIZED_EMAIL',
          message: 'Email tidak diotorisasi sebagai administrator.',
        }),
        { status: 401, headers: SECURITY_HEADERS }
      );
    }

    // 5. Resolusi Environment & M2M Secret (Fail-Closed)
    const m2m = resolveM2MSecret(env);
    if (!m2m.secret || m2m.environment === 'unknown') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CONFIGURATION_ERROR',
          message: 'Konfigurasi keamanan lingkungan backend tidak valid atau tidak lengkap.',
        }),
        { status: 503, headers: SECURITY_HEADERS }
      );
    }

    // Pemisahan Environment:
    // - Production WAJIB pengiriman email nyata (mockEmailDelivery: false) tanpa fallback ke mock.
    // - TEST hanya boleh menggunakan mock jika secara eksplisit diaktifkan (via body.mockEmailDelivery === true).
    const mockEmailDelivery = m2m.environment === 'production'
      ? false
      : (body.mockEmailDelivery === true);

    // 6. Teruskan ke Backend Apps Script via M2M Handshake
    const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
    const gasResult = await callGasBackend(env, 'ADMIN_REQUEST_OTP', {
      email,
      mockEmailDelivery,
      clientIpMasked: clientIp,
    });

    const isRateLimited = gasResult.body?.error === 'COOLDOWN_ACTIVE' ||
      gasResult.body?.error === 'HOURLY_LIMIT_EXCEEDED' ||
      gasResult.body?.error === 'DAILY_LIMIT_EXCEEDED';

    const isServiceError = gasResult.body?.error === 'EMAIL_QUOTA_EXCEEDED' ||
      gasResult.body?.error === 'EMAIL_DELIVERY_FAILED' ||
      gasResult.body?.error === 'SERVER_CONFIG_ERROR';

    const status = gasResult.body?.success
      ? 200
      : isRateLimited
        ? 429
        : isServiceError
          ? 503
          : 400;

    return new Response(JSON.stringify(gasResult.body), {
      status: gasResult.status !== 200 && !gasResult.body?.success ? gasResult.status : status,
      headers: SECURITY_HEADERS,
    });
  } catch (err: any) {
    console.error('[Request OTP Proxy Error]', err?.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan sistem internal pada auth proxy.',
      }),
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
};
