/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOUDFLARE PAGES FUNCTIONS SAME-ORIGIN PROXY
 * Route: POST /api/register-tester
 * 
 * Functions:
 * 1. Acts as same-origin proxy from frontend to Google Apps Script.
 * 2. Injects APPS_SCRIPT_SECRET handshake token securely on the server side.
 * 3. Hides Google Apps Script Web App URL from client bundle.
 * 4. Masks client IP before forwarding for privacy protection.
 * 5. Sanitizes error responses without leaking internal infrastructure details.
 * ============================================================================
 */

export interface Env {
  GAS_WEBAPP_URL?: string;
  APPS_SCRIPT_SECRET?: string;
}

interface RegisterPayload {
  testerName: string;
  testerEmail: string;
  projectId?: string;
  projectName?: string;
  appVersion?: string;
  honeypot?: string;
}

const MAX_PAYLOAD_SIZE = 50 * 1024; // 50 KB
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// Security response headers
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=UTF-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*', // Allows development dev-servers; same-origin in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

/**
 * Handle CORS Preflight
 */
export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

/**
 * Main POST handler
 */
export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  try {
    // 1. Verifikasi Environment Secrets
    const gasWebAppUrl = env.GAS_WEBAPP_URL;
    const appScriptSecret = env.APPS_SCRIPT_SECRET;

    if (!gasWebAppUrl || !gasWebAppUrl.startsWith('https://script.google.com/')) {
      console.error('[Configuration Error] GAS_WEBAPP_URL belum diatur atau bukan URL Apps Script yang valid.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CONFIGURATION_ERROR',
          message: 'Layanan backend sedang dalam persiapan konfigurasi. Silakan hubungi developer.',
        }),
        { status: 503, headers: SECURITY_HEADERS }
      );
    }

    // 2. Verifikasi Content-Length / Ukuran Payload
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Ukuran payload permintaan terlalu besar.',
        }),
        { status: 413, headers: SECURITY_HEADERS }
      );
    }

    // 3. Baca dan Validasi JSON Body
    let payload: RegisterPayload;
    try {
      payload = (await request.json()) as RegisterPayload;
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_JSON',
          message: 'Data permohonan harus berformat JSON yang valid.',
        }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 4. Honeypot Check (Anti-Bot)
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      // Return 200 OK without forwarding to save Google Apps Script execution time
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Pendaftaran berhasil diterima.',
        }),
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    // 5. Validasi Field Wajib
    const name = (payload.testerName || '').trim();
    const email = (payload.testerEmail || '').trim().toLowerCase();

    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Nama lengkap penguji wajib diisi (minimal 2 karakter).',
        }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Alamat email Google Play tidak valid.',
        }),
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 6. Metadata IP & User-Agent Masking
    const rawIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const clientIpMasked = maskIpAddress(rawIp);
    const userAgent = request.headers.get('user-agent') || '-';

    // 7. Siapkan Payload yang Diteruskan ke Google Apps Script
    const forwardedPayload = {
      testerName: name,
      testerEmail: email,
      projectId: payload.projectId || 'mobile-kasir',
      projectName: payload.projectName || 'Mobile Kasir',
      appVersion: payload.appVersion || '0.9.2-beta',
      clientIpMasked,
      userAgent: userAgent.slice(0, 200),
      // Injeksi token rahasia ke dalam JSON body via HTTPS (mekanisme autentikasi handshake resmi Apps Script Web App)
      secretToken: appScriptSecret || '',
    };

    // 8. Eksekusi Request ke Google Apps Script dengan Timeout AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let gasResponse: Response;
    try {
      gasResponse = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS doPost lebih stabil menerima text/plain
        },
        body: JSON.stringify(forwardedPayload),
        signal: controller.signal,
        redirect: 'follow', // GAS selalu merespons 302 redirect ke result URL
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      console.error('[Upstream GAS Fetch Error]', isAbort ? 'Request Timeout (10s)' : fetchErr);

      return new Response(
        JSON.stringify({
          success: false,
          error: isAbort ? 'TIMEOUT' : 'UPSTREAM_ERROR',
          message: isAbort
            ? 'Koneksi ke server pendaftaran timeout. Silakan periksa koneksi Anda dan coba lagi.'
            : 'Gagal menghubungi server database pendaftaran. Silakan coba kembali.',
        }),
        { status: 502, headers: SECURITY_HEADERS }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // 9. Parsing Response dari Google Apps Script
    let gasResultText = '';
    try {
      gasResultText = await gasResponse.text();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'BAD_GATEWAY',
          message: 'Respons dari database tidak dapat dibaca.',
        }),
        { status: 502, headers: SECURITY_HEADERS }
      );
    }

    let parsedResult: Record<string, unknown>;
    try {
      parsedResult = JSON.parse(gasResultText) as Record<string, unknown>;
    } catch {
      console.error('[Invalid Upstream Response]', gasResultText.slice(0, 300));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_UPSTREAM_RESPONSE',
          message: 'Respons backend tidak sesuai format standar.',
        }),
        { status: 502, headers: SECURITY_HEADERS }
      );
    }

    // 10. Teruskan Response Sanitized ke Client
    const httpStatus = parsedResult.success ? 200 : 400;
    return new Response(JSON.stringify(parsedResult), {
      status: httpStatus,
      headers: SECURITY_HEADERS,
    });
  } catch (error) {
    console.error('[Unhandled Proxy Error]', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan sistem internal. Silakan coba beberapa saat lagi.',
      }),
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
};

/**
 * Mask IP address untuk kepatuhan privasi (e.g. 192.168.1.100 -> 192.168.xxx.xxx)
 */
function maskIpAddress(ip: string): string {
  if (!ip) return 'UNKNOWN';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:xxxx:xxxx`;
    }
  }

  return 'MASKED_IP';
}
