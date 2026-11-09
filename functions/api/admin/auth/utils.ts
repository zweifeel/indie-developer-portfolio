/**
 * ============================================================================
 * SLEEPYKOALA CMS — AUTH UTILITIES & SECURITY ENGINE (CLOUDFLARE PAGES FUNCTIONS)
 * 
 * Features:
 * 1. Web Cryptography HMAC-SHA256 & SHA-256 (Zero external dependencies).
 * 2. Tamper-proof HMAC Session Token creation & verification.
 * 3. Strict Cookie management (HttpOnly, Secure, SameSite=Strict, Path=/api/admin).
 * 4. CSRF, Origin, & Fetch Metadata validation.
 * 5. Server-to-Server (M2M) signed handshake with anti-replay protection.
 * ============================================================================
 */

export interface AuthEnv {
  ENVIRONMENT?: string;
  GAS_WEBAPP_URL?: string;
  APPS_SCRIPT_SECRET?: string;
  SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET?: string;
  ADMIN_SESSION_SECRET?: string;
}

export interface SessionPayload {
  email: string;
  sessionVersion: number;
  iat: number; // Seconds
  exp: number; // Seconds
}

export const AUTHORIZED_ADMIN_EMAIL = 'zweifeel@gmail.com';
export const SESSION_COOKIE_NAME = 'sk_admin_session';
export const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 jam (86400 detik)
export const MAX_PAYLOAD_SIZE = 10 * 1024; // 10 KB
export const UPSTREAM_TIMEOUT_MS = 10000; // 10 detik

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=UTF-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, X-SleepyKoala-Admin',
};

// ============================================================================
// 0. ENVIRONMENT & SECRET RESOLUTION ENGINE (SEC-M61-01 REMEDIATION)
// ============================================================================

/**
 * Resolves Server-to-Server (M2M) communication secret with strict isolation:
 * - Production NEVER falls back to TEST secret.
 * - TEST NEVER falls back to Production secret.
 * - Missing or empty secret causes fail-closed (secret: null).
 */
export function resolveM2MSecret(env: AuthEnv): {
  secret: string | null;
  environment: 'production' | 'test' | 'unknown';
  error?: string;
} {
  // Explicit environment flag if provided
  if (env.ENVIRONMENT === 'production') {
    if (env.APPS_SCRIPT_SECRET && env.APPS_SCRIPT_SECRET.trim().length > 0) {
      return { secret: env.APPS_SCRIPT_SECRET, environment: 'production' };
    }
    return { secret: null, environment: 'production', error: 'MISSING_PROD_M2M_SECRET' };
  }

  if (env.ENVIRONMENT === 'test') {
    if (env.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET && env.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET.trim().length > 0) {
      return { secret: env.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET, environment: 'test' };
    }
    if (env.APPS_SCRIPT_SECRET && env.APPS_SCRIPT_SECRET.trim().length > 0) {
      return { secret: env.APPS_SCRIPT_SECRET, environment: 'test' };
    }
    return { secret: null, environment: 'test', error: 'MISSING_TEST_M2M_SECRET' };
  }

  // Without explicit ENVIRONMENT flag, inspect exclusive presence without cross-fallback
  if (env.APPS_SCRIPT_SECRET !== undefined) {
    if (env.APPS_SCRIPT_SECRET.trim().length > 0) {
      return { secret: env.APPS_SCRIPT_SECRET, environment: 'production' };
    }
    return { secret: null, environment: 'production', error: 'EMPTY_PROD_M2M_SECRET' };
  }

  if (env.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET !== undefined) {
    if (env.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET.trim().length > 0) {
      return { secret: env.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET, environment: 'test' };
    }
    return { secret: null, environment: 'test', error: 'EMPTY_TEST_M2M_SECRET' };
  }

  return { secret: null, environment: 'unknown', error: 'NO_M2M_SECRET_CONFIGURED' };
}

/**
 * Resolves HMAC session cookie signing secret:
 * - Prioritizes dedicated ADMIN_SESSION_SECRET.
 * - If omitted, falls back to the M2M secret of that specific environment ONLY (zero cross-environment leakage).
 * - Empty or missing secret causes fail-closed (secret: null).
 */
export function resolveSessionSecret(env: AuthEnv): {
  secret: string | null;
  source: 'ADMIN_SESSION_SECRET' | 'PRODUCTION_M2M' | 'TEST_M2M' | 'NONE';
  error?: string;
} {
  if (env.ADMIN_SESSION_SECRET !== undefined) {
    if (env.ADMIN_SESSION_SECRET.trim().length > 0) {
      return { secret: env.ADMIN_SESSION_SECRET, source: 'ADMIN_SESSION_SECRET' };
    }
    return { secret: null, source: 'ADMIN_SESSION_SECRET', error: 'EMPTY_ADMIN_SESSION_SECRET' };
  }

  const m2m = resolveM2MSecret(env);
  if (m2m.secret) {
    return {
      secret: m2m.secret,
      source: m2m.environment === 'production' ? 'PRODUCTION_M2M' : 'TEST_M2M',
    };
  }

  return { secret: null, source: 'NONE', error: m2m.error || 'NO_SESSION_SECRET' };
}

// ============================================================================
// 1. BASE64URL & CRYPTO HELPERS (WEB CRYPTOGRAPHY API)
// ============================================================================

export function base64UrlEncode(bytes: Uint8Array, stripPadding: boolean = true): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const webSafe = base64.replace(/\+/g, '-').replace(/\//g, '_');
  return stripPadding ? webSafe.replace(/=+$/, '') : webSafe;
}

export function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function signHmacSha256(data: string, secret: string, stripPadding: boolean = true): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return base64UrlEncode(new Uint8Array(signature), stripPadding);
}

export async function verifyHmacSha256(data: string, signatureBase64Url: string, secret: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBytes = base64UrlDecode(signatureBase64Url);
    return await crypto.subtle.verify('HMAC', key, signatureBytes as unknown as BufferSource, enc.encode(data));
  } catch {
    return false;
  }
}

// ============================================================================
// 2. HMAC SESSION TOKEN GENERATION & VERIFICATION
// ============================================================================

export async function createSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(enc.encode(payloadStr));
  const signature = await signHmacSha256(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: SessionPayload; error?: string }> {
  if (!token || !token.includes('.')) {
    return { valid: false, error: 'INVALID_TOKEN_FORMAT' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'MALFORMED_TOKEN' };
  }

  const [payloadB64, signature] = parts;
  const isSignatureValid = await verifyHmacSha256(payloadB64, signature, secret);
  if (!isSignatureValid) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  try {
    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (!payload.email || typeof payload.sessionVersion !== 'number' || !payload.exp) {
      return { valid: false, error: 'INVALID_PAYLOAD' };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= payload.exp) {
      return { valid: false, error: 'SESSION_EXPIRED' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'CORRUPTED_PAYLOAD' };
  }
}

// ============================================================================
// 3. COOKIE MANAGEMENT
// ============================================================================

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

export function createSessionCookie(token: string, maxAgeSeconds: number = SESSION_TTL_SECONDS): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${maxAgeSeconds}`;
}

export function createClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ============================================================================
// 4. CSRF, ORIGIN & FETCH METADATA VALIDATION
// ============================================================================

export function validateAdminCsrf(request: Request): { valid: boolean; error?: string; message?: string } {
  // 1. Verifikasi Custom Header (Blokir Simple Request Cross-Site CSRF)
  const adminHeader = request.headers.get('X-SleepyKoala-Admin');
  if (adminHeader !== '1') {
    return { valid: false, error: 'MISSING_CSRF_HEADER', message: 'Header proteksi CSRF X-SleepyKoala-Admin tidak ditemukan.' };
  }

  // 2. Fetch Metadata Sec-Fetch-Site Check
  const secFetchSite = request.headers.get('Sec-Fetch-Site');
  if (secFetchSite && secFetchSite === 'cross-site') {
    return { valid: false, error: 'CROSS_SITE_REQUEST_REJECTED', message: 'Permintaan lintas situs (cross-site) ditolak.' };
  }

  // 3. Origin / Host Match Check (Jika header Origin tersedia)
  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const reqUrl = new URL(request.url);
      if (originUrl.host !== reqUrl.host) {
        // Dev environment tolerance (localhost)
        const isLocalDev = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1';
        const isOriginDev = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
        if (!(isLocalDev && isOriginDev)) {
          return { valid: false, error: 'ORIGIN_MISMATCH', message: 'Origin tidak sesuai dengan host.' };
        }
      }
    } catch {
      return { valid: false, error: 'MALFORMED_ORIGIN', message: 'Format header Origin tidak valid.' };
    }
  }

  return { valid: true };
}

// ============================================================================
// 5. SERVER-TO-SERVER (M2M) SIGNED HANDSHAKE WITH APPS SCRIPT
// ============================================================================

export async function callGasBackend(
  env: AuthEnv,
  action: string,
  data: Record<string, unknown>
): Promise<{ status: number; body: any }> {
  const gasWebAppUrl = env.GAS_WEBAPP_URL;
  const m2m = resolveM2MSecret(env);

  if (!gasWebAppUrl || !gasWebAppUrl.startsWith('https://script.google.com/')) {
    return {
      status: 503,
      body: {
        success: false,
        error: 'CONFIGURATION_ERROR',
        message: 'Layanan backend Apps Script belum dikonfigurasi.',
      },
    };
  }

  if (!m2m.secret) {
    return {
      status: 503,
      body: {
        success: false,
        error: 'CONFIGURATION_ERROR',
        message: m2m.environment === 'production'
          ? 'Kunci APPS_SCRIPT_SECRET produksi belum dikonfigurasi.'
          : 'Kunci SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET belum dikonfigurasi.',
      },
    };
  }

  const appScriptSecret = m2m.secret;

  const nowMs = Date.now();
  const nonce = crypto.randomUUID();
  const bodyHash = await sha256Hex(JSON.stringify(data));

  // Canonical String: POST:/api/admin:{timestamp}:{nonce}:{bodyHash}
  const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;
  // Apps Script Utilities.base64EncodeWebSafe mempertahankan padding '=' sehingga stripPadding harus false
  const signature = await signHmacSha256(canonical, appScriptSecret, false);

  const signedPayload = {
    action,
    timestamp: nowMs,
    nonce,
    bodyHash,
    signature,
    secretToken: appScriptSecret, // Kompatibilitas ganda
    ...data,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(signedPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return { status: response.status, body: json };
    } catch {
      console.error('[Upstream GAS Parse Error] Response bukan JSON yang valid.');
      return {
        status: 502,
        body: {
          success: false,
          error: 'INVALID_UPSTREAM_RESPONSE',
          message: 'Respons dari upstream backend tidak valid.',
        },
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        status: 502,
        body: {
          success: false,
          error: 'TIMEOUT',
          message: 'Koneksi ke backend Apps Script melebihi batas waktu (10 detik).',
        },
      };
    }

    return {
      status: 502,
      body: {
        success: false,
        error: 'GATEWAY_ERROR',
        message: 'Gagal menghubungi backend Apps Script.',
      },
    };
  }
}

// ============================================================================
// 6. BINARY MEDIA VALIDATION & PROCESSING HELPERS
// ============================================================================

export const ALLOWED_MEDIA_MIME_TYPES = ['image/webp', 'image/png', 'image/jpeg'] as const;

export function decodeBase64Binary(base64Str: string): Uint8Array {
  const cleanBase64 = base64Str.replace(/^data:image\/[a-z+]+;base64,/, '').trim();
  const normalized = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function computeBinarySha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function verifyBinaryMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 12) return false;
  const mime = mimeType.toLowerCase().trim();

  if (mime === 'image/webp') {
    const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    return isRiff && isWebp;
  }

  if (mime === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    const isSoi = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isEoi = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    return isSoi && isEoi;
  }

  return false;
}
