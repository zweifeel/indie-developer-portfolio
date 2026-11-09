/**
 * ============================================================================
 * SLEEPYKOALA CMS — MILESTONE 6.5
 * Real OTP Email Delivery & Fail-Closed Remediation Test Suite
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost as requestOtpPost } from '../../functions/api/admin/auth/request-otp';
import {
  AuthEnv,
  AUTHORIZED_ADMIN_EMAIL,
} from '../../functions/api/admin/auth/utils';

describe('Milestone 6.5 — Real OTP Email Delivery & Fail-Closed Remediation', () => {
  const PROD_ENV: AuthEnv = {
    ENVIRONMENT: 'production',
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbProdDeploymentCMS/exec',
    APPS_SCRIPT_SECRET: 'prod-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'prod-session-secret-hmac-sha256-very-secure-key-12345',
  };

  const TEST_ENV: AuthEnv = {
    ENVIRONMENT: 'test',
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
  // 1. CLOUDFLARE EDGE: PRODUCTION VS TEST ENVIRONMENT ISOLATION
  // =========================================================================
  describe('1. Cloudflare Pages Functions Environment Email Flag Enforcement', () => {
    it('1.1. Production ALWAYS dispatches mockEmailDelivery=false to upstream backend', async () => {
      let sentPayload: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
        sentPayload = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
            data: { cooldownSeconds: 60, expiresAt: Math.floor(Date.now() / 1000) + 300 },
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

      const res = await requestOtpPost({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verifikasi bahwa Production secara mutlak mengirimkan mockEmailDelivery: false
      expect(sentPayload.action).toBe('ADMIN_REQUEST_OTP');
      expect(sentPayload.mockEmailDelivery).toBe(false);
    });

    it('1.2. Production CANNOT fall back to mock even if client requests mockEmailDelivery=true', async () => {
      let sentPayload: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
        sentPayload = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
            data: { cooldownSeconds: 60, expiresAt: Math.floor(Date.now() / 1000) + 300 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      // Klien mencoba mengirimkan mockEmailDelivery: true pada production
      const req = new Request('http://localhost/api/admin/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL, mockEmailDelivery: true }),
      });

      const res = await requestOtpPost({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);

      // Di environment production, permintaan mock diabaikan dan tetap dipaksa false
      expect(sentPayload.mockEmailDelivery).toBe(false);
    });

    it('1.3. TEST environment defaults to mockEmailDelivery=false unless explicitly requested', async () => {
      let sentPayload: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
        sentPayload = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
            data: { cooldownSeconds: 60, expiresAt: Math.floor(Date.now() / 1000) + 300 },
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
      expect(sentPayload.mockEmailDelivery).toBe(false);
    });

    it('1.4. TEST environment activates mockEmailDelivery=true only when explicitly requested', async () => {
      let sentPayload: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options: any) => {
        sentPayload = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
            data: { cooldownSeconds: 60, expiresAt: Math.floor(Date.now() / 1000) + 300 },
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
      expect(sentPayload.mockEmailDelivery).toBe(true);
    });

    it('1.5. Incomplete or unknown environment fails closed with 503 CONFIGURATION_ERROR', async () => {
      const invalidEnv: AuthEnv = {
        GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbInvalid/exec',
      };

      const req = new Request('http://localhost/api/admin/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({ email: AUTHORIZED_ADMIN_EMAIL }),
      });

      const res = await requestOtpPost({ request: req, env: invalidEnv });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('CONFIGURATION_ERROR');
    });
  });

  // =========================================================================
  // 2. ERROR MAPPING & HTTP STATUS CODES
  // =========================================================================
  describe('2. Upstream Error Status Code Mapping', () => {
    it('2.1. Maps EMAIL_QUOTA_EXCEEDED to HTTP 503 Service Unavailable', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'EMAIL_QUOTA_EXCEEDED',
            message: 'Layanan pengiriman email sementara tidak tersedia karena batas kuota server tercapai.',
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

      const res = await requestOtpPost({ request: req, env: PROD_ENV });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('EMAIL_QUOTA_EXCEEDED');
    });

    it('2.2. Maps EMAIL_DELIVERY_FAILED to HTTP 503 Service Unavailable', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'EMAIL_DELIVERY_FAILED',
            message: 'Gagal mengirimkan email kode OTP ke administrator.',
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

      const res = await requestOtpPost({ request: req, env: PROD_ENV });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('EMAIL_DELIVERY_FAILED');
    });

    it('2.3. Preserves HTTP 429 for rate limit and cooldown errors', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'COOLDOWN_ACTIVE',
            message: 'Mohon tunggu 45 detik sebelum meminta OTP baru.',
            data: { waitSeconds: 45 },
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

      const res = await requestOtpPost({ request: req, env: PROD_ENV });
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('COOLDOWN_ACTIVE');
    });
  });

  // =========================================================================
  // 3. APPS SCRIPT LOGIC SIMULATION (MAIL DELIVERY ADAPTER & OTP STATE)
  // =========================================================================
  describe('3. Apps Script MailDeliveryAdapter & State Invalidation Logic', () => {
    interface MockState {
      lastIssuedAt: number;
      recentTimestamps: number[];
      currentOtpHmac: string | null;
      otpExpiresAt: number;
      failedAttempts: number;
      activeSalt: string | null;
    }

    const createMockMailDeliveryAdapter = (options: {
      quota: number;
      shouldThrow?: boolean;
    }) => ({
      send: (_email: string, _subject: string, _body: string, isMock: boolean) => {
        if (isMock) {
          return { success: true, provider: 'MOCK' };
        }

        try {
          const remainingQuota = options.quota;
          if (remainingQuota <= 0) {
            return {
              success: false,
              error: 'EMAIL_QUOTA_EXCEEDED',
              message: 'Layanan pengiriman email sementara tidak tersedia karena batas kuota server tercapai.',
              provider: 'MAILAPP',
            };
          }

          if (options.shouldThrow) {
            throw new Error('Google Apps Script MailApp Exception: Service error');
          }

          return { success: true, provider: 'MAILAPP' };
        } catch {
          return {
            success: false,
            error: 'EMAIL_DELIVERY_FAILED',
            message: 'Gagal mengirimkan email kode OTP ke administrator. Silakan coba kembali nanti.',
            provider: 'MAILAPP',
          };
        }
      },
    });

    const simulateHandleAdminRequestOtp = (options: {
      adapter: ReturnType<typeof createMockMailDeliveryAdapter>;
      isTestEnvironment: boolean;
      payloadMockDelivery?: boolean;
      initialState?: MockState;
    }) => {
      const state: MockState = options.initialState || {
        lastIssuedAt: 0,
        recentTimestamps: [],
        currentOtpHmac: null,
        otpExpiresAt: 0,
        failedAttempts: 0,
        activeSalt: null,
      };

      const nowSec = 1730480000;
      const rawOtp = '654321';
      const salt = 'mock-salt-uuid';
      const otpHmac = 'mock-otp-hmac-digest';

      // Rules: Production WAJIB pengiriman nyata (isTestEnvironment && payloadMockDelivery === true)
      const useMock = options.isTestEnvironment && options.payloadMockDelivery === true;

      const sendResult = options.adapter.send(
        AUTHORIZED_ADMIN_EMAIL,
        'Subject',
        'Body with ' + rawOtp,
        useMock
      );

      if (!sendResult || !sendResult.success) {
        // Fail-Closed: OTP harus dibatalkan/tidak disimpan
        state.currentOtpHmac = null;
        state.otpExpiresAt = 0;
        state.activeSalt = null;
        return {
          response: {
            success: false,
            error: sendResult ? sendResult.error : 'EMAIL_DELIVERY_FAILED',
            message: sendResult ? sendResult.message : 'Gagal mengirimkan email.',
          },
          finalState: state,
        };
      }

      // Success: simpan state persisten
      state.lastIssuedAt = nowSec;
      state.recentTimestamps.push(nowSec);
      state.currentOtpHmac = otpHmac;
      state.otpExpiresAt = nowSec + 300;
      state.failedAttempts = 0;
      state.activeSalt = salt;

      return {
        response: {
          success: true,
          error: null,
          message: 'Kode OTP telah berhasil dikirimkan ke email administrator.',
          data: { cooldownSeconds: 60, expiresAt: state.otpExpiresAt },
        },
        finalState: state,
      };
    };

    it('3.1. Successful real email delivery stores active OTP and returns success', () => {
      const adapter = createMockMailDeliveryAdapter({ quota: 100 });
      const result = simulateHandleAdminRequestOtp({
        adapter,
        isTestEnvironment: false, // Production
        payloadMockDelivery: false,
      });

      expect(result.response.success).toBe(true);
      expect(result.finalState.currentOtpHmac).toBe('mock-otp-hmac-digest');
      expect(result.finalState.otpExpiresAt).toBe(1730480000 + 300);
      expect(result.finalState.activeSalt).toBe('mock-salt-uuid');
    });

    it('3.2. MailApp quota exhausted returns EMAIL_QUOTA_EXCEEDED and leaves NO active OTP', () => {
      const adapter = createMockMailDeliveryAdapter({ quota: 0 });
      const result = simulateHandleAdminRequestOtp({
        adapter,
        isTestEnvironment: false, // Production
        payloadMockDelivery: false,
      });

      expect(result.response.success).toBe(false);
      expect(result.response.error).toBe('EMAIL_QUOTA_EXCEEDED');
      // Pastikan OTP tidak aktif
      expect(result.finalState.currentOtpHmac).toBeNull();
      expect(result.finalState.otpExpiresAt).toBe(0);
      expect(result.finalState.activeSalt).toBeNull();
    });

    it('3.3. MailApp exception returns EMAIL_DELIVERY_FAILED and leaves NO active OTP', () => {
      const adapter = createMockMailDeliveryAdapter({ quota: 100, shouldThrow: true });
      const result = simulateHandleAdminRequestOtp({
        adapter,
        isTestEnvironment: false, // Production
        payloadMockDelivery: false,
      });

      expect(result.response.success).toBe(false);
      expect(result.response.error).toBe('EMAIL_DELIVERY_FAILED');
      // Detail internal Google tidak diekspos
      expect(result.response.message).not.toContain('Exception');
      expect(result.response.message).not.toContain('Google Apps Script');
      // OTP dibatalkan
      expect(result.finalState.currentOtpHmac).toBeNull();
      expect(result.finalState.otpExpiresAt).toBe(0);
      expect(result.finalState.activeSalt).toBeNull();
    });

    it('3.4. Production backend ignores payload.mockEmailDelivery=true and executes MailApp', () => {
      // Di production (isTestEnvironment: false), jika quota = 0, MailApp quota check tetap berjalan
      const adapter = createMockMailDeliveryAdapter({ quota: 0 });
      const result = simulateHandleAdminRequestOtp({
        adapter,
        isTestEnvironment: false, // Production
        payloadMockDelivery: true, // Mencoba memaksa mock
      });

      // Tetap gagal karena real MailApp dijalankan (mock diabaikan)
      expect(result.response.success).toBe(false);
      expect(result.response.error).toBe('EMAIL_QUOTA_EXCEEDED');
    });

    it('3.5. TEST backend honors mockEmailDelivery=true when explicitly requested', () => {
      // Di TEST (isTestEnvironment: true), jika mock diminta, mock digunakan tanpa cek kuota
      const adapter = createMockMailDeliveryAdapter({ quota: 0 });
      const result = simulateHandleAdminRequestOtp({
        adapter,
        isTestEnvironment: true, // TEST environment
        payloadMockDelivery: true, // Explicit mock
      });

      expect(result.response.success).toBe(true);
      expect(result.finalState.currentOtpHmac).toBe('mock-otp-hmac-digest');
    });
  });
});
