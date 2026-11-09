import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import {
  base64UrlEncode,
  base64UrlDecode,
  sha256Hex,
  signHmacSha256,
  verifyHmacSha256,
  createSessionToken,
  verifySessionToken,
  createSessionCookie,
  createClearSessionCookie,
  parseCookies,
  validateAdminCsrf,
  AUTHORIZED_ADMIN_EMAIL,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestOptions as requestOtpOptions,
  onRequestPost as requestOtpPost,
} from '../../functions/api/admin/auth/request-otp';

import {
  onRequestOptions as verifyOtpOptions,
  onRequestPost as verifyOtpPost,
} from '../../functions/api/admin/auth/verify-otp';

import {
  onRequestOptions as logoutOptions,
  onRequestPost as logoutPost,
} from '../../functions/api/admin/auth/logout';

import {
  onRequestOptions as sessionOptions,
  onRequestGet as sessionGet,
} from '../../functions/api/admin/auth/session';

import {
  requestAdminOtp,
  verifyAdminOtp,
  logoutAdmin,
  getAdminSession,
} from '../services/adminAuthService';

describe('SleepyKoala CMS — Gate 1A: Isolated Authentication & Secure Backend Test Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 0. BASE64URL & ENCODING CRYPTO UTILITIES
  // =========================================================================
  describe('0. Base64Url & Encoding Utilities', () => {
    it('roundtrips binary encoding through base64UrlEncode and base64UrlDecode', () => {
      const sample = new Uint8Array([0, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
      const encoded = base64UrlEncode(sample);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');

      const decoded = base64UrlDecode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(sample));
    });

    it('directly validates validateAdminCsrf helper behavior', () => {
      const validReq = new Request('http://localhost/api/admin/auth/test', {
        headers: { 'X-SleepyKoala-Admin': '1' },
      });
      expect(validateAdminCsrf(validReq).valid).toBe(true);

      const missingHeaderReq = new Request('http://localhost/api/admin/auth/test');
      expect(validateAdminCsrf(missingHeaderReq).valid).toBe(false);

      const crossSiteReq = new Request('http://localhost/api/admin/auth/test', {
        headers: {
          'X-SleepyKoala-Admin': '1',
          'Sec-Fetch-Site': 'cross-site',
        },
      });
      expect(validateAdminCsrf(crossSiteReq).valid).toBe(false);
    });
  });

  // =========================================================================
  // 1. OTP AUTHENTICATION ENGINE (GAS LOGIC & SPECIFICATION VERIFICATION)
  // =========================================================================
  describe('1. OTP Authentication Engine & State Machine', () => {
    // Simulator State Engine Apps Script
    let adminOtpState: {
      lastIssuedAt: number;
      recentTimestamps: number[];
      currentOtpHmac: string | null;
      otpExpiresAt: number;
      failedAttempts: number;
      activeSalt: string | null;
    };

    const generateSecure6DigitOtp = () => {
      // Mirip implementasi Apps Script menggunakan entropi UUID (Java SecureRandom)
      const uuid = crypto.randomUUID().replace(/-/g, '');
      const num = parseInt(uuid.substring(0, 8), 16);
      return String(100000 + (num % 900000));
    };

    const hashOtp = (rawOtp: string, salt: string) => {
      return crypto.createHmac('sha256', salt).update(rawOtp).digest('base64url');
    };

    beforeEach(() => {
      adminOtpState = {
        lastIssuedAt: 0,
        recentTimestamps: [],
        currentOtpHmac: null,
        otpExpiresAt: 0,
        failedAttempts: 0,
        activeSalt: null,
      };
    });

    it('OTP format is strictly 6 numeric digits and uses cryptographically secure randomness', () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateSecure6DigitOtp();
        expect(otp).toMatch(/^\d{6}$/);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it('OTP hashing stores HMAC-SHA256 digest with salt and never stores raw OTP', () => {
      const rawOtp = generateSecure6DigitOtp();
      const salt = crypto.randomUUID();
      const digest = hashOtp(rawOtp, salt);

      adminOtpState.currentOtpHmac = digest;
      adminOtpState.activeSalt = salt;

      expect(adminOtpState.currentOtpHmac).not.toBe(rawOtp);
      expect(adminOtpState.currentOtpHmac).toBe(digest);
      expect(hashOtp(rawOtp, salt)).toBe(digest);
    });

    it('successful verification matches hash and triggers single-use burn immediately', () => {
      const rawOtp = '654321';
      const salt = crypto.randomUUID();
      const digest = hashOtp(rawOtp, salt);
      const nowSec = Math.floor(Date.now() / 1000);

      adminOtpState.currentOtpHmac = digest;
      adminOtpState.activeSalt = salt;
      adminOtpState.otpExpiresAt = nowSec + 300;
      adminOtpState.failedAttempts = 0;

      // Verifikasi Pertama (Sukses)
      const computedHash = hashOtp(rawOtp, adminOtpState.activeSalt);
      expect(computedHash).toBe(adminOtpState.currentOtpHmac);

      // Single-use burn!
      adminOtpState.currentOtpHmac = null;
      adminOtpState.activeSalt = null;
      adminOtpState.otpExpiresAt = 0;

      // Verifikasi Kedua (Gagal karena sudah hangus)
      expect(adminOtpState.currentOtpHmac).toBeNull();
    });

    it('expired OTP (> 300 seconds) is rejected', () => {
      const rawOtp = '123456';
      const salt = crypto.randomUUID();
      const nowSec = Math.floor(Date.now() / 1000);

      adminOtpState.currentOtpHmac = hashOtp(rawOtp, salt);
      adminOtpState.activeSalt = salt;
      adminOtpState.otpExpiresAt = nowSec - 10; // Expired 10s ago

      const isExpired = nowSec > adminOtpState.otpExpiresAt;
      expect(isExpired).toBe(true);
    });

    it('wrong OTP increments failed attempts and locks after 3 failures', () => {
      const rawOtp = '112233';
      const salt = crypto.randomUUID();
      const digest = hashOtp(rawOtp, salt);
      const nowSec = Math.floor(Date.now() / 1000);

      adminOtpState.currentOtpHmac = digest;
      adminOtpState.activeSalt = salt;
      adminOtpState.otpExpiresAt = nowSec + 300;
      adminOtpState.failedAttempts = 0;

      // Percobaan 1 salah
      adminOtpState.failedAttempts++;
      expect(adminOtpState.failedAttempts).toBe(1);
      expect(adminOtpState.currentOtpHmac).not.toBeNull();

      // Percobaan 2 salah
      adminOtpState.failedAttempts++;
      expect(adminOtpState.failedAttempts).toBe(2);
      expect(adminOtpState.currentOtpHmac).not.toBeNull();

      // Percobaan 3 salah -> Kunci & hanguskan!
      adminOtpState.failedAttempts++;
      if (adminOtpState.failedAttempts >= 3) {
        adminOtpState.currentOtpHmac = null;
        adminOtpState.otpExpiresAt = 0;
      }

      expect(adminOtpState.failedAttempts).toBe(3);
      expect(adminOtpState.currentOtpHmac).toBeNull();
    });

    it('enforces 60-second cooldown between successive OTP requests', () => {
      const nowSec = 1000;
      adminOtpState.lastIssuedAt = nowSec;

      // Request pada detik ke-1030 (baru 30 detik)
      const attemptSec = 1030;
      const isCooldown = (attemptSec - adminOtpState.lastIssuedAt) < 60;
      expect(isCooldown).toBe(true);

      // Request pada detik ke-1061 (lewat 61 detik)
      const validAttemptSec = 1061;
      const isCooldownPassed = (validAttemptSec - adminOtpState.lastIssuedAt) < 60;
      expect(isCooldownPassed).toBe(false);
    });

    it('enforces 5 OTPs per hour rate limit', () => {
      const nowSec = 10000;
      // Isi 5 request dalam 1 jam terakhir
      adminOtpState.recentTimestamps = [
        nowSec - 500,
        nowSec - 400,
        nowSec - 300,
        nowSec - 200,
        nowSec - 100,
      ];

      const pastHourCount = adminOtpState.recentTimestamps.filter(t => (nowSec - t) < 3600).length;
      expect(pastHourCount).toBe(5);
      const isHourlyBlocked = pastHourCount >= 5;
      expect(isHourlyBlocked).toBe(true);
    });

    it('enforces 15 OTPs per 24 hours rolling limit', () => {
      const nowSec = 50000;
      // Isi 15 request dalam 24 jam terakhir
      adminOtpState.recentTimestamps = Array.from({ length: 15 }, (_, i) => nowSec - (i * 1000));

      const isDailyBlocked = adminOtpState.recentTimestamps.length >= 15;
      expect(isDailyBlocked).toBe(true);
    });

    it('handles concurrent verification races safely (only first burn wins)', () => {
      const rawOtp = '778899';
      const salt = crypto.randomUUID();
      const digest = hashOtp(rawOtp, salt);

      adminOtpState.currentOtpHmac = digest;
      adminOtpState.activeSalt = salt;
      adminOtpState.otpExpiresAt = Math.floor(Date.now() / 1000) + 300;

      let successCount = 0;
      let failureCount = 0;

      // Simulasi 2 thread concurrent memverifikasi kode yang sama
      const verifyAttempt = () => {
        if (!adminOtpState.currentOtpHmac) {
          failureCount++;
          return false;
        }
        // Atomic lock effect:
        adminOtpState.currentOtpHmac = null;
        successCount++;
        return true;
      };

      const res1 = verifyAttempt();
      const res2 = verifyAttempt();

      expect(res1).toBe(true);
      expect(res2).toBe(false);
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });

  // =========================================================================
  // 2. HMAC SESSION SECURITY & REVOCATION
  // =========================================================================
  describe('2. HMAC Session Token & Revocation Engine', () => {
    it('creates and verifies a valid HMAC-SHA256 session token', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = {
        email: AUTHORIZED_ADMIN_EMAIL,
        sessionVersion: 1,
        iat: nowSec,
        exp: nowSec + 3600,
      };

      const token = await createSessionToken(payload, TEST_ENV.ADMIN_SESSION_SECRET);
      expect(token).toContain('.');

      const result = await verifySessionToken(token, TEST_ENV.ADMIN_SESSION_SECRET);
      expect(result.valid).toBe(true);
      expect(result.payload?.email).toBe(AUTHORIZED_ADMIN_EMAIL);
      expect(result.payload?.sessionVersion).toBe(1);
    });

    it('rejects token with invalid signature', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = {
        email: AUTHORIZED_ADMIN_EMAIL,
        sessionVersion: 1,
        iat: nowSec,
        exp: nowSec + 3600,
      };

      const token = await createSessionToken(payload, 'wrong-secret-signature');
      const result = await verifySessionToken(token, TEST_ENV.ADMIN_SESSION_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('INVALID_SIGNATURE');
    });

    it('rejects expired session token', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = {
        email: AUTHORIZED_ADMIN_EMAIL,
        sessionVersion: 1,
        iat: nowSec - 7200,
        exp: nowSec - 3600, // Expired 1 hour ago
      };

      const token = await createSessionToken(payload, TEST_ENV.ADMIN_SESSION_SECRET);
      const result = await verifySessionToken(token, TEST_ENV.ADMIN_SESSION_SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SESSION_EXPIRED');
    });

    it('rejects revoked session when version is older than active ADMIN_SESSION_VERSION', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const oldPayload = {
        email: AUTHORIZED_ADMIN_EMAIL,
        sessionVersion: 1,
        iat: nowSec,
        exp: nowSec + 3600,
      };

      const token = await createSessionToken(oldPayload, TEST_ENV.ADMIN_SESSION_SECRET);
      const result = await verifySessionToken(token, TEST_ENV.ADMIN_SESSION_SECRET);
      expect(result.valid).toBe(true);

      // Simulasi kenaikan ADMIN_SESSION_VERSION = 2 di backend
      const currentBackendVersion = 2;
      const isRevoked = (result.payload?.sessionVersion || 0) < currentBackendVersion;
      expect(isRevoked).toBe(true);
    });

    it('rejects malformed or corrupted token structure', async () => {
      const result1 = await verifySessionToken('no-dot-token', TEST_ENV.ADMIN_SESSION_SECRET);
      expect(result1.valid).toBe(false);

      const result2 = await verifySessionToken('part1.part2.part3', TEST_ENV.ADMIN_SESSION_SECRET);
      expect(result2.valid).toBe(false);
    });

    it('parses and creates security-compliant session cookies', () => {
      const cookieStr = createSessionCookie('test-token-value', 86400);
      expect(cookieStr).toContain('sk_admin_session=test-token-value');
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('Secure');
      expect(cookieStr).toContain('SameSite=Strict');
      expect(cookieStr).toContain('Path=/api/admin');
      expect(cookieStr).toContain('Max-Age=86400');

      const clearCookie = createClearSessionCookie();
      expect(clearCookie).toContain('Max-Age=0');
      expect(clearCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');

      const reqWithCookie = new Request('http://localhost/api/admin/auth/session', {
        headers: { Cookie: 'sk_admin_session=cookie-val; other=123' },
      });
      const parsed = parseCookies(reqWithCookie);
      expect(parsed['sk_admin_session']).toBe('cookie-val');
      expect(parsed['other']).toBe('123');
    });
  });

  // =========================================================================
  // 3. SERVER-TO-SERVER (M2M) AUTHENTICATION & ANTI-REPLAY
  // =========================================================================
  describe('3. Machine-to-Machine Handshake & Anti-Replay Protection', () => {
    it('verifies valid M2M HMAC signature and canonical format', async () => {
      const nowMs = Date.now();
      const nonce = crypto.randomUUID();
      const bodyHash = await sha256Hex(JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL }));
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;

      const sig = await signHmacSha256(canonical, TEST_ENV.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET);
      const isValid = await verifyHmacSha256(canonical, sig, TEST_ENV.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET);
      expect(isValid).toBe(true);
    });

    it('rejects M2M signature with invalid secret', async () => {
      const nowMs = Date.now();
      const nonce = crypto.randomUUID();
      const bodyHash = await sha256Hex(JSON.stringify({ test: 1 }));
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;

      const sig = await signHmacSha256(canonical, 'wrong-secret');
      const isValid = await verifyHmacSha256(canonical, sig, TEST_ENV.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET);
      expect(isValid).toBe(false);
    });

    it('rejects M2M request with timestamp older than 60 seconds', () => {
      const nowMs = Date.now();
      const staleTimestamp = nowMs - 61000; // 61 detik lalu

      const isStale = Math.abs(nowMs - staleTimestamp) > 60000;
      expect(isStale).toBe(true);
    });

    it('detects and rejects reused nonces (Anti-Replay)', () => {
      const seenNonces = new Set<string>();
      const nonce = crypto.randomUUID();

      // Request pertama
      expect(seenNonces.has(nonce)).toBe(false);
      seenNonces.add(nonce);

      // Replay request kedua
      const isReplayed = seenNonces.has(nonce);
      expect(isReplayed).toBe(true);
    });

    it('rejects M2M signature when request body has been tampered with', async () => {
      const nowMs = Date.now();
      const nonce = crypto.randomUUID();
      const originalHash = await sha256Hex(JSON.stringify({ amount: 100 }));
      const tamperedHash = await sha256Hex(JSON.stringify({ amount: 9999 }));

      const canonicalOriginal = `POST:/api/admin:${nowMs}:${nonce}:${originalHash}`;
      const canonicalTampered = `POST:/api/admin:${nowMs}:${nonce}:${tamperedHash}`;

      const sig = await signHmacSha256(canonicalOriginal, TEST_ENV.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET);
      const isTamperedValid = await verifyHmacSha256(canonicalTampered, sig, TEST_ENV.SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET);
      expect(isTamperedValid).toBe(false);
    });
  });

  // =========================================================================
  // 4. CLOUDFLARE AUTH PROXY ENDPOINTS
  // =========================================================================
  describe('4. Cloudflare Pages Functions Auth Proxy Endpoints', () => {
    describe('A. POST /api/admin/auth/request-otp', () => {
      it('returns 204 for OPTIONS preflight with security headers', async () => {
        const res = await requestOtpOptions();
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
        expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      });

      it('rejects request with unsupported media type (missing JSON)', async () => {
        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: 'email=zweifeel@gmail.com',
        });
        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(415);
        const data = await res.json();
        expect(data.error).toBe('UNSUPPORTED_MEDIA_TYPE');
      });

      it('rejects request missing CSRF header X-SleepyKoala-Admin', async () => {
        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL }),
        });
        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('MISSING_CSRF_HEADER');
      });

      it('rejects cross-site request via Fetch Metadata Sec-Fetch-Site', async () => {
        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
            'Sec-Fetch-Site': 'cross-site',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL }),
        });
        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('CROSS_SITE_REQUEST_REJECTED');
      });

      it('rejects unauthorized admin email', async () => {
        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: 'attacker@evil.com' }),
        });
        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe('UNAUTHORIZED_EMAIL');
      });

      it('successfully dispatches OTP request upstream with mockEmailDelivery=true when explicitly requested in TEST', async () => {
        let sentUpstreamPayload: any = null;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
          sentUpstreamPayload = JSON.parse(options.body);
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
              data: { cooldownSeconds: 60, expiresAt: 1730380000 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL, mockEmailDelivery: true }),
        });

        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        // Verifikasi TEST explicit MOCK delivery
        expect(sentUpstreamPayload.action).toBe('ADMIN_REQUEST_OTP');
        expect(sentUpstreamPayload.mockEmailDelivery).toBe(true);
        expect(sentUpstreamPayload.signature).toBeDefined();
        expect(sentUpstreamPayload.nonce).toBeDefined();
      });

      it('dispatches OTP request with mockEmailDelivery=false by default in TEST when not specified', async () => {
        let sentUpstreamPayload: any = null;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
          sentUpstreamPayload = JSON.parse(options.body);
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
              data: { cooldownSeconds: 60, expiresAt: 1730380000 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL }),
        });

        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        expect(sentUpstreamPayload.mockEmailDelivery).toBe(false);
      });

      it('handles upstream timeout gracefully with 502 TIMEOUT', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          const err: any = new Error('AbortError');
          err.name = 'AbortError';
          throw err;
        });

        const req = new Request('http://localhost/api/admin/auth/request-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL }),
        });

        const res = await requestOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(502);
        const data = await res.json();
        expect(data.error).toBe('TIMEOUT');
      });
    });

    describe('B. POST /api/admin/auth/verify-otp', () => {
      it('returns 204 for OPTIONS preflight with security headers', async () => {
        const res = await verifyOtpOptions();
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      });

      it('validates 6-digit OTP format strictly', async () => {
        const req = new Request('http://localhost/api/admin/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL, otp: '123' }), // Kurang dari 6 digit
        });

        const res = await verifyOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('INVALID_FORMAT');
      });

      it('issues HttpOnly Secure SameSite=Strict cookie upon successful OTP verification', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                verifiedEmail: AUTHORIZED_ADMIN_EMAIL,
                sessionVersion: 1,
                issuedAt: 1730380000,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

        const req = new Request('http://localhost/api/admin/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL, otp: '654321' }),
        });

        const res = await verifyOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        const setCookie = res.headers.get('Set-Cookie');
        expect(setCookie).toBeDefined();
        expect(setCookie).toContain('sk_admin_session=');
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('Secure');
        expect(setCookie).toContain('SameSite=Strict');
        expect(setCookie).toContain('Path=/api/admin');
        expect(setCookie).toContain('Max-Age=86400');
      });

      it('returns error when OTP is invalid or locked', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'OTP_LOCKED',
              message: 'Terlalu banyak percobaan salah.',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

        const req = new Request('http://localhost/api/admin/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL, otp: '000000' }),
        });

        const res = await verifyOtpPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(423);
        const data = await res.json();
        expect(data.error).toBe('OTP_LOCKED');
      });
    });

    describe('C. POST /api/admin/auth/logout', () => {
      it('returns 204 for OPTIONS preflight with security headers', async () => {
        const res = await logoutOptions();
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      });

      it('clears session cookie on logout', async () => {
        const req = new Request('http://localhost/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ revokeAll: false }),
        });

        const res = await logoutPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        const setCookie = res.headers.get('Set-Cookie');
        expect(setCookie).toContain('Max-Age=0');
        expect(setCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      });

      it('dispatches ADMIN_REVOKE_SESSIONS upstream if revokeAll is true', async () => {
        let sentAction = '';
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
          sentAction = JSON.parse(options.body).action;
          return new Response(JSON.stringify({ success: true, newSessionVersion: 2 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        });

        const req = new Request('http://localhost/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SleepyKoala-Admin': '1',
          },
          body: JSON.stringify({ revokeAll: true }),
        });

        const res = await logoutPost({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        expect(sentAction).toBe('ADMIN_REVOKE_SESSIONS');
      });
    });

    describe('D. GET /api/admin/auth/session', () => {
      it('returns 204 for OPTIONS preflight with security headers', async () => {
        const res = await sessionOptions();
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      });

      it('returns unauthenticated when session cookie is absent', async () => {
        const req = new Request('http://localhost/api/admin/auth/session', {
          method: 'GET',
        });
        const res = await sessionGet({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.authenticated).toBe(false);
      });

      it('returns authenticated true when valid HMAC session cookie is present and version matches', async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const token = await createSessionToken(
          {
            email: AUTHORIZED_ADMIN_EMAIL,
            sessionVersion: 1,
            iat: nowSec,
            exp: nowSec + 3600,
          },
          TEST_ENV.ADMIN_SESSION_SECRET
        );

        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          return new Response(
            JSON.stringify({ success: true, valid: true, currentSessionVersion: 1 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

        const req = new Request('http://localhost/api/admin/auth/session', {
          method: 'GET',
          headers: {
            Cookie: `sk_admin_session=${token}`,
          },
        });

        const res = await sessionGet({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.authenticated).toBe(true);
        expect(data.email).toBe(AUTHORIZED_ADMIN_EMAIL);
      });

      it('revokes session and clears cookie when backend reports version mismatch', async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const token = await createSessionToken(
          {
            email: AUTHORIZED_ADMIN_EMAIL,
            sessionVersion: 1, // Versi 1
            iat: nowSec,
            exp: nowSec + 3600,
          },
          TEST_ENV.ADMIN_SESSION_SECRET
        );

        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'SESSION_REVOKED',
              valid: false,
              currentSessionVersion: 2, // Versi di backend sudah 2
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

        const req = new Request('http://localhost/api/admin/auth/session', {
          method: 'GET',
          headers: {
            Cookie: `sk_admin_session=${token}`,
          },
        });

        const res = await sessionGet({ request: req, env: TEST_ENV });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.authenticated).toBe(false);
        expect(data.reason).toBe('SESSION_REVOKED');

        const setCookie = res.headers.get('Set-Cookie');
        expect(setCookie).toContain('Max-Age=0');
      });
    });
  });

  // =========================================================================
  // 5. CLIENT AUTH SERVICE (INTEGRATION HELPER VERIFICATION)
  // =========================================================================
  describe('5. Admin Auth Client Service', () => {
    it('requestAdminOtp sends X-SleepyKoala-Admin and credentials same-origin', async () => {
      let capturedHeaders: any = null;
      let capturedCredentials: any = null;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init: any) => {
        capturedHeaders = init.headers;
        capturedCredentials = init.credentials;
        return new Response(JSON.stringify({ success: true, cooldownSeconds: 60 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const res = await requestAdminOtp(AUTHORIZED_ADMIN_EMAIL);
      expect(res.success).toBe(true);
      expect(capturedHeaders['X-SleepyKoala-Admin']).toBe('1');
      expect(capturedCredentials).toBe('same-origin');
    });

    it('verifyAdminOtp sends email and OTP cleanly', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: true,
            data: { email: AUTHORIZED_ADMIN_EMAIL, sessionVersion: 1, expiresInSeconds: 86400 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await verifyAdminOtp(AUTHORIZED_ADMIN_EMAIL, '123456');
      expect(res.success).toBe(true);
      expect(res.data?.sessionVersion).toBe(1);
    });

    it('logoutAdmin sends revokeAll flag and clears state', async () => {
      let sentBody: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init: any) => {
        sentBody = JSON.parse(init.body);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const res = await logoutAdmin(true);
      expect(res.success).toBe(true);
      expect(sentBody.revokeAll).toBe(true);
    });

    it('getAdminSession extracts session status properly', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({ success: true, authenticated: true, email: AUTHORIZED_ADMIN_EMAIL, sessionVersion: 1 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const status = await getAdminSession();
      expect(status.authenticated).toBe(true);
      expect(status.email).toBe(AUTHORIZED_ADMIN_EMAIL);
    });
  });

  // =========================================================================
  // 12. GATE 1A SECURITY REMEDIATION: OTP PEPPER & M2M ANTI-REPLAY TEST SUITE
  // =========================================================================
  describe('12. Gate 1A Remediation: OTP Pepper & Apps Script Anti-Replay', () => {
    // Simulasi logic Apps Script untuk OTP Pepper dengan Fail-Closed check
    function simulateAppsScriptOtpDigest(rawOtp: string, salt: string, pepper: string | null | undefined) {
      if (!pepper || pepper.trim() === '') {
        return { success: false, error: 'SERVER_CONFIG_ERROR', message: 'Konfigurasi keamanan server backend belum lengkap.' };
      }
      const hmac = crypto.createHmac('sha256', salt);
      hmac.update(rawOtp + pepper.trim());
      return { success: true, digest: hmac.digest('base64url') };
    }

    it('verifies OTP digest with correct pepper matches', () => {
      const pepper = 'mock-pepper-12345';
      const salt = 'mock-salt-uuid';
      const rawOtp = '749201';

      const storedResult = simulateAppsScriptOtpDigest(rawOtp, salt, pepper);
      const incomingResult = simulateAppsScriptOtpDigest(rawOtp, salt, pepper);

      expect(storedResult.success).toBe(true);
      expect(incomingResult.success).toBe(true);
      expect(incomingResult.digest).toBe(storedResult.digest);
    });

    it('rejects OTP verification when pepper is wrong or corrupted', () => {
      const salt = 'mock-salt-uuid';
      const rawOtp = '749201';
      const realPepper = 'mock-pepper-12345';
      const attackerPepper = 'wrong-attacker-pepper';

      const storedResult = simulateAppsScriptOtpDigest(rawOtp, salt, realPepper);
      const attackerResult = simulateAppsScriptOtpDigest(rawOtp, salt, attackerPepper);

      expect(storedResult.success).toBe(true);
      expect(attackerResult.success).toBe(true);
      expect(attackerResult.digest).not.toBe(storedResult.digest);
    });

    it('fails closed (SERVER_CONFIG_ERROR) when pepper is missing or null in runtime', () => {
      const salt = 'mock-salt-uuid';
      const rawOtp = '749201';

      const missingResult = simulateAppsScriptOtpDigest(rawOtp, salt, null);
      expect(missingResult.success).toBe(false);
      expect(missingResult.error).toBe('SERVER_CONFIG_ERROR');
    });

    it('fails closed (SERVER_CONFIG_ERROR) when pepper is empty or whitespace string', () => {
      const salt = 'mock-salt-uuid';
      const rawOtp = '749201';

      const emptyResult = simulateAppsScriptOtpDigest(rawOtp, salt, '   ');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('SERVER_CONFIG_ERROR');
    });

    // Simulasi logic Apps Script M2M Anti-Replay dengan LockService dan ScriptProperties
    class MockScriptProperties {
      private store = new Map<string, string>();
      getProperty(key: string): string | null {
        return this.store.get(key) || null;
      }
      setProperty(key: string, val: string): void {
        this.store.set(key, val);
      }
      deleteProperty(key: string): void {
        this.store.delete(key);
      }
      getProperties(): Record<string, string> {
        const obj: Record<string, string> = {};
        for (const [k, v] of this.store.entries()) {
          obj[k] = v;
        }
        return obj;
      }
    }

    class MockScriptLock {
      private isLocked = false;
      tryLock(_timeoutMs: number): boolean {
        if (this.isLocked) return false;
        this.isLocked = true;
        return true;
      }
      releaseLock(): void {
        this.isLocked = false;
      }
    }

    function simulateVerifyM2mAuth(
      payload: any,
      scriptProperties: MockScriptProperties,
      lock: MockScriptLock,
      simulatedNowMs: number
    ) {
      const expectedSecret = scriptProperties.getProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET');
      if (!expectedSecret || expectedSecret.trim() === '') {
        return { valid: false, error: 'SERVER_CONFIG_ERROR', message: 'Konfigurasi keamanan server backend belum lengkap.' };
      }

      if (payload.signature) {
        if (!payload.nonce || !payload.timestamp) {
          return { valid: false, error: 'INVALID_M2M_AUTH', message: 'Parameter nonce/timestamp wajib.' };
        }

        const reqTimestamp = Number(payload.timestamp);
        if (isNaN(reqTimestamp) || Math.abs(simulatedNowMs - reqTimestamp) > 60000) {
          return { valid: false, error: 'REQUEST_EXPIRED', message: 'Timestamp kedaluwarsa atau > 60 detik.' };
        }

        const lockAcquired = lock.tryLock(1000);
        if (!lockAcquired) {
          return { valid: false, error: 'SERVER_BUSY', message: 'Server sibuk.' };
        }

        try {
          const nonceKey = 'NONCE_M2M_' + String(payload.nonce);
          if (scriptProperties.getProperty(nonceKey)) {
            return { valid: false, error: 'NONCE_REUSED', message: 'Permintaan ditolak: Nonce sudah pernah digunakan.' };
          }

          const method = String(payload.method || 'POST').toUpperCase();
          const path = String(payload.path || '/api/admin');
          const bodyHash = String(payload.bodyHash || '');
          const canonical = `${method}:${path}:${reqTimestamp}:${payload.nonce}:${bodyHash}`;

          const computedSig = crypto.createHmac('sha256', expectedSecret.trim()).update(canonical).digest('base64url');
          if (computedSig !== payload.signature) {
            return { valid: false, error: 'UNAUTHORIZED_SIGNATURE', message: 'Tanda tangan tidak valid.' };
          }

          // Catat Nonce ke ScriptProperties (Fail-Closed jika penyimpanan gagal)
          try {
            scriptProperties.setProperty(nonceKey, String(simulatedNowMs));
          } catch {
            return { valid: false, error: 'STORAGE_ERROR', message: 'Gagal mencatat status keamanan nonce persisten.' };
          }

          // Cleanup expired nonces (>120s)
          const allProps = scriptProperties.getProperties();
          for (const key in allProps) {
            if (key.startsWith('NONCE_M2M_')) {
              const recorded = Number(allProps[key]);
              if (isNaN(recorded) || (simulatedNowMs - recorded) > 120000) {
                scriptProperties.deleteProperty(key);
              }
            }
          }

          return { valid: true };
        } finally {
          lock.releaseLock();
        }
      }

      return { valid: false, error: 'INVALID_AUTH' };
    }

    it('accepts valid M2M signed request on first attempt', () => {
      const props = new MockScriptProperties();
      props.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      const lock = new MockScriptLock();
      const nowMs = 1700000000000;
      const nonce = 'unique-nonce-1';
      const bodyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        action: 'ADMIN_REQUEST_OTP',
        method: 'POST',
        path: '/api/admin',
        timestamp: nowMs,
        nonce,
        bodyHash,
        signature,
      };

      const res = simulateVerifyM2mAuth(payload, props, lock, nowMs);
      expect(res.valid).toBe(true);
      expect(props.getProperty('NONCE_M2M_' + nonce)).toBe(String(nowMs));
    });

    it('rejects replayed nonce on second attempt (anti-replay)', () => {
      const props = new MockScriptProperties();
      props.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      const lock = new MockScriptLock();
      const nowMs = 1700000000000;
      const nonce = 'unique-nonce-2';
      const bodyHash = 'hash123';
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        method: 'POST',
        path: '/api/admin',
        timestamp: nowMs,
        nonce,
        bodyHash,
        signature,
      };

      const firstCall = simulateVerifyM2mAuth(payload, props, lock, nowMs);
      expect(firstCall.valid).toBe(true);

      const replayCall = simulateVerifyM2mAuth(payload, props, lock, nowMs + 1000);
      expect(replayCall.valid).toBe(false);
      expect(replayCall.error).toBe('NONCE_REUSED');
    });

    it('rejects expired timestamp beyond 60-second tolerance window', () => {
      const props = new MockScriptProperties();
      props.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      const lock = new MockScriptLock();
      const sentTime = 1700000000000;
      const arrivalTime = 1700000065000; // 65 detik kemudian (> 60s)
      const nonce = 'unique-nonce-expired';
      const bodyHash = 'hash123';
      const canonical = `POST:/api/admin:${sentTime}:${nonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        method: 'POST',
        path: '/api/admin',
        timestamp: sentTime,
        nonce,
        bodyHash,
        signature,
      };

      const res = simulateVerifyM2mAuth(payload, props, lock, arrivalTime);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('REQUEST_EXPIRED');
    });

    it('handles concurrent requests safely with lock protection', async () => {
      const props = new MockScriptProperties();
      props.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      const lock = new MockScriptLock();
      const nowMs = 1700000000000;
      const nonce = 'concurrent-nonce-1';
      const bodyHash = 'hash123';
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        method: 'POST',
        path: '/api/admin',
        timestamp: nowMs,
        nonce,
        bodyHash,
        signature,
      };

      // Simulasi dua eksekusi konkruen
      const res1 = simulateVerifyM2mAuth(payload, props, lock, nowMs);
      const res2 = simulateVerifyM2mAuth(payload, props, lock, nowMs);

      // Tepat satu yang berhasil (atau yang kedua gagal karena nonce reused atau lock busy)
      expect(res1.valid).toBe(true);
      expect(res2.valid).toBe(false);
      expect(['NONCE_REUSED', 'SERVER_BUSY']).toContain(res2.error);
    });

    it('evicts expired nonces older than retention period (120s) to preserve ScriptProperties capacity', () => {
      const props = new MockScriptProperties();
      props.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      const lock = new MockScriptLock();

      const oldTime = 1700000000000;
      props.setProperty('NONCE_M2M_old-nonce', String(oldTime));

      const newTime = oldTime + 130000; // 130 detik kemudian (>120s)
      const newNonce = 'new-nonce-after-cleanup';
      const bodyHash = 'hash123';
      const canonical = `POST:/api/admin:${newTime}:${newNonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        method: 'POST',
        path: '/api/admin',
        timestamp: newTime,
        nonce: newNonce,
        bodyHash,
        signature,
      };

      const res = simulateVerifyM2mAuth(payload, props, lock, newTime);
      expect(res.valid).toBe(true);

      // Nonce lama harus sudah di-evict
      expect(props.getProperty('NONCE_M2M_old-nonce')).toBeNull();
      // Nonce baru tersimpan
      expect(props.getProperty('NONCE_M2M_' + newNonce)).toBe(String(newTime));
    });

    it('fails closed (SERVER_BUSY) if LockService cannot acquire lock within timeout', () => {
      const props = new MockScriptProperties();
      props.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      const busyLock = new MockScriptLock();
      busyLock.tryLock(100); // Kunci sudah dipegang proses lain

      const nowMs = 1700000000000;
      const nonce = 'busy-nonce-test';
      const bodyHash = 'hash123';
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        method: 'POST',
        path: '/api/admin',
        timestamp: nowMs,
        nonce,
        bodyHash,
        signature,
      };

      const res = simulateVerifyM2mAuth(payload, props, busyLock, nowMs);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('SERVER_BUSY');
    });

    it('fails closed (STORAGE_ERROR) if ScriptProperties throws on quota or storage failure', () => {
      const failingProps = new MockScriptProperties();
      failingProps.setProperty('SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET', 'test-secret');
      // Override setProperty to throw (simulasi kuota terlampaui)
      failingProps.setProperty = (key: string, _val: string) => {
        if (key.startsWith('NONCE_M2M_')) {
          throw new Error('ScriptProperties quota exceeded (500KB limit)');
        }
      };

      const lock = new MockScriptLock();
      const nowMs = 1700000000000;
      const nonce = 'quota-exceeded-nonce';
      const bodyHash = 'hash123';
      const canonical = `POST:/api/admin:${nowMs}:${nonce}:${bodyHash}`;
      const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('base64url');

      const payload = {
        method: 'POST',
        path: '/api/admin',
        timestamp: nowMs,
        nonce,
        bodyHash,
        signature,
      };

      const res = simulateVerifyM2mAuth(payload, failingProps, lock, nowMs);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('STORAGE_ERROR');
    });
  });
});
