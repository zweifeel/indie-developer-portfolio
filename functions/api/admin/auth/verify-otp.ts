/**
 * ============================================================================
 * SLEEPYKOALA CMS — VERIFY OTP ENDPOINT
 * Route: POST /api/admin/auth/verify-otp
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  MAX_PAYLOAD_SIZE,
  AUTHORIZED_ADMIN_EMAIL,
  SESSION_TTL_SECONDS,
  validateAdminCsrf,
  callGasBackend,
  createSessionToken,
  createSessionCookie,
  resolveSessionSecret,
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

    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_FORMAT',
          message: 'Kode OTP harus terdiri dari tepat 6 digit angka.',
        }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 5. Panggil Backend Apps Script via M2M Handshake
    const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
    const gasResult = await callGasBackend(env, 'ADMIN_VERIFY_OTP', {
      email,
      otp,
      clientIpMasked: clientIp,
    });

    if (!gasResult.body.success) {
      const errorStatus = gasResult.body.error === 'OTP_LOCKED' ? 423 : 401;
      return new Response(JSON.stringify(gasResult.body), {
        status: gasResult.status !== 200 ? gasResult.status : errorStatus,
        headers: SECURITY_HEADERS,
      });
    }

    // 6. OTP Sukses & Single-Use Burn: Terbitkan HMAC Session Cookie
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
    const sessionSecret = sessionRes.secret;

    const sessionVersion = typeof gasResult.body.data?.sessionVersion === 'number'
      ? gasResult.body.data.sessionVersion
      : 1;

    const nowSec = Math.floor(Date.now() / 1000);
    const sessionToken = await createSessionToken(
      {
        email,
        sessionVersion,
        iat: nowSec,
        exp: nowSec + SESSION_TTL_SECONDS,
      },
      sessionSecret
    );

    const cookieHeader = createSessionCookie(sessionToken, SESSION_TTL_SECONDS);

    const headersWithCookie = {
      ...SECURITY_HEADERS,
      'Set-Cookie': cookieHeader,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Autentikasi administrator berhasil.',
        data: {
          email,
          sessionVersion,
          expiresInSeconds: SESSION_TTL_SECONDS,
          environment: resolveM2MSecret(env).environment,
        },
      }),
      { status: 200, headers: headersWithCookie }
    );
  } catch (err: any) {
    console.error('[Verify OTP Proxy Error]', err?.message);
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
