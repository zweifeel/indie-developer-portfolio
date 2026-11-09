import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AuthEnv,
  createSessionToken,
  resolveM2MSecret,
  resolveSessionSecret,
  AUTHORIZED_ADMIN_EMAIL,
} from '../../functions/api/admin/auth/utils';
import { onRequestGet as sessionGet } from '../../functions/api/admin/auth/session';
import { onRequestPost as logoutPost } from '../../functions/api/admin/auth/logout';

describe('Milestone 6.2 Security Remediation Suite — Session Revocation & Secret Isolation', () => {
  const PROD_M2M_SECRET = 'prod-m2m-secret-d37f19b2c8a44e59a8c1';
  const TEST_M2M_SECRET = 'test-m2m-secret-966fdd41c80f47ae6809';
  const DEDICATED_SESSION_SECRET = 'dedicated-session-secret-a1b2c3d4e5f6';

  const PROD_ENV: AuthEnv = {
    ENVIRONMENT: 'production',
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbProdDeployment/exec',
    APPS_SCRIPT_SECRET: PROD_M2M_SECRET,
  };

  const TEST_ENV: AuthEnv = {
    ENVIRONMENT: 'test',
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeployment/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: TEST_M2M_SECRET,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SEC-M61-01: Secret Isolation & Environment Separation', () => {
    it('1. Production environment strictly uses APPS_SCRIPT_SECRET and never falls back to TEST secret', () => {
      const prodWithBoth: AuthEnv = {
        ENVIRONMENT: 'production',
        APPS_SCRIPT_SECRET: PROD_M2M_SECRET,
        SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: TEST_M2M_SECRET,
      };
      const res = resolveM2MSecret(prodWithBoth);
      expect(res.secret).toBe(PROD_M2M_SECRET);
      expect(res.environment).toBe('production');

      // If APPS_SCRIPT_SECRET is missing or empty in production, must NOT fallback to TEST secret
      const prodMissing: AuthEnv = {
        ENVIRONMENT: 'production',
        SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: TEST_M2M_SECRET,
      };
      const resMissing = resolveM2MSecret(prodMissing);
      expect(resMissing.secret).toBeNull();
      expect(resMissing.error).toBe('MISSING_PROD_M2M_SECRET');

      const prodEmpty: AuthEnv = {
        ENVIRONMENT: 'production',
        APPS_SCRIPT_SECRET: '',
        SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: TEST_M2M_SECRET,
      };
      const resEmpty = resolveM2MSecret(prodEmpty);
      expect(resEmpty.secret).toBeNull();
      expect(resEmpty.error).toBe('MISSING_PROD_M2M_SECRET');
    });

    it('2. TEST environment strictly uses test secret and never falls back to Production secret', () => {
      const testWithBoth: AuthEnv = {
        ENVIRONMENT: 'test',
        APPS_SCRIPT_SECRET: PROD_M2M_SECRET,
        SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: TEST_M2M_SECRET,
      };
      const res = resolveM2MSecret(testWithBoth);
      expect(res.secret).toBe(TEST_M2M_SECRET);
      expect(res.environment).toBe('test');

      const testEmpty: AuthEnv = {
        ENVIRONMENT: 'test',
        SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: '',
      };
      const resEmpty = resolveM2MSecret(testEmpty);
      expect(resEmpty.secret).toBeNull();
      expect(resEmpty.error).toBe('MISSING_TEST_M2M_SECRET');
    });

    it('3. Auto-detect mode without explicit flag isolates Production and TEST variables', () => {
      // Production presence only
      const prodAuto: AuthEnv = {
        APPS_SCRIPT_SECRET: PROD_M2M_SECRET,
      };
      const resProd = resolveM2MSecret(prodAuto);
      expect(resProd.secret).toBe(PROD_M2M_SECRET);
      expect(resProd.environment).toBe('production');

      // Test presence only
      const testAuto: AuthEnv = {
        SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: TEST_M2M_SECRET,
      };
      const resTest = resolveM2MSecret(testAuto);
      expect(resTest.secret).toBe(TEST_M2M_SECRET);
      expect(resTest.environment).toBe('test');

      // Empty variables fail closed
      const emptyAuto: AuthEnv = {
        APPS_SCRIPT_SECRET: '   ',
      };
      const resEmpty = resolveM2MSecret(emptyAuto);
      expect(resEmpty.secret).toBeNull();
      expect(resEmpty.error).toBe('EMPTY_PROD_M2M_SECRET');
    });

    it('4. Prioritizes dedicated ADMIN_SESSION_SECRET when configured', () => {
      const envWithDedicated: AuthEnv = {
        ...PROD_ENV,
        ADMIN_SESSION_SECRET: DEDICATED_SESSION_SECRET,
      };
      const res = resolveSessionSecret(envWithDedicated);
      expect(res.secret).toBe(DEDICATED_SESSION_SECRET);
      expect(res.source).toBe('ADMIN_SESSION_SECRET');

      // Empty dedicated session secret fails closed
      const envWithEmptyDedicated: AuthEnv = {
        ...PROD_ENV,
        ADMIN_SESSION_SECRET: '',
      };
      const resEmpty = resolveSessionSecret(envWithEmptyDedicated);
      expect(resEmpty.secret).toBeNull();
      expect(resEmpty.error).toBe('EMPTY_ADMIN_SESSION_SECRET');
    });

    it('5. Falls back to environment-isolated M2M secret only when ADMIN_SESSION_SECRET is omitted', () => {
      // In Production: falls back to Production M2M only
      const resProd = resolveSessionSecret(PROD_ENV);
      expect(resProd.secret).toBe(PROD_M2M_SECRET);
      expect(resProd.source).toBe('PRODUCTION_M2M');

      // In TEST: falls back to TEST M2M only
      const resTest = resolveSessionSecret(TEST_ENV);
      expect(resTest.secret).toBe(TEST_M2M_SECRET);
      expect(resTest.source).toBe('TEST_M2M');

      // Missing env fails closed
      const resNone = resolveSessionSecret({});
      expect(resNone.secret).toBeNull();
      expect(resNone.source).toBe('NONE');
    });
  });

  describe('SEC-M61-02: Session Revocation & Fail-Closed Behavior in Production', () => {
    it('1. Accepts valid session in Production environment using production config', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: nowSec,
          exp: nowSec + 3600,
        },
        PROD_M2M_SECRET
      );

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: true,
            valid: true,
            data: { activeSessionVersion: 1 },
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

      const res = await sessionGet({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(true);
      expect(data.email).toBe(AUTHORIZED_ADMIN_EMAIL);
      expect(data.sessionVersion).toBe(1);
    });

    it('2. Rejects expired session locally before contacting upstream backend', async () => {
      const pastSec = Math.floor(Date.now() / 1000) - 100;
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: pastSec - 3600,
          exp: pastSec, // Sudah kedaluwarsa
        },
        PROD_M2M_SECRET
      );

      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const req = new Request('http://localhost/api/admin/auth/session', {
        method: 'GET',
        headers: {
          Cookie: `sk_admin_session=${token}`,
        },
      });

      const res = await sessionGet({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
      expect(data.reason).toBe('SESSION_EXPIRED');

      // Upstream fetch must not be invoked for locally expired session
      expect(fetchSpy).not.toHaveBeenCalled();

      // Cookie must be cleared
      const setCookie = res.headers.get('Set-Cookie');
      expect(setCookie).toContain('Max-Age=0');
    });

    it('3. Rejects revoked session when backend reports SESSION_REVOKED and clears cookie', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: nowSec,
          exp: nowSec + 3600,
        },
        PROD_M2M_SECRET
      );

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'SESSION_REVOKED',
            message: 'Session revoked by admin.',
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

      const res = await sessionGet({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
      expect(data.reason).toBe('SESSION_REVOKED');

      const setCookie = res.headers.get('Set-Cookie');
      expect(setCookie).toContain('Max-Age=0');
    });

    it('4. Detects session version mismatch and clears cookie', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: nowSec,
          exp: nowSec + 3600,
        },
        PROD_M2M_SECRET
      );

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: true,
            data: { activeSessionVersion: 2 }, // Upstream active version is 2
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

      const res = await sessionGet({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
      expect(data.reason).toBe('SESSION_VERSION_MISMATCH');

      const setCookie = res.headers.get('Set-Cookie');
      expect(setCookie).toContain('Max-Age=0');
    });

    it('5. Fail-Closed: Apps Script timeout or 502/503 does NOT produce authenticated true', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: nowSec,
          exp: nowSec + 3600,
        },
        PROD_M2M_SECRET
      );

      // Backend returns 502 Bad Gateway
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        });
      });

      const req = new Request('http://localhost/api/admin/auth/session', {
        method: 'GET',
        headers: {
          Cookie: `sk_admin_session=${token}`,
        },
      });

      const res = await sessionGet({ request: req, env: PROD_ENV });
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
      expect(data.success).toBe(false);
    });

    it('6. Fail-Closed: Missing backend configuration in Production returns 503 and not authenticated', async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = await createSessionToken(
        {
          email: AUTHORIZED_ADMIN_EMAIL,
          sessionVersion: 1,
          iat: nowSec,
          exp: nowSec + 3600,
        },
        PROD_M2M_SECRET
      );

      // Environment without GAS_WEBAPP_URL
      const brokenEnv: AuthEnv = {
        ENVIRONMENT: 'production',
        APPS_SCRIPT_SECRET: PROD_M2M_SECRET,
      };

      const req = new Request('http://localhost/api/admin/auth/session', {
        method: 'GET',
        headers: {
          Cookie: `sk_admin_session=${token}`,
        },
      });

      const res = await sessionGet({ request: req, env: brokenEnv });
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.authenticated).toBeUndefined();
      expect(data.success).toBe(false);
      expect(data.error).toBe('CONFIGURATION_ERROR');
    });

    it('7. Logout invalidates session and clears cookie', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const req = new Request('http://localhost/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'X-SleepyKoala-Admin': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ revokeAll: true }),
      });

      const res = await logoutPost({ request: req, env: PROD_ENV });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const setCookie = res.headers.get('Set-Cookie');
      expect(setCookie).toContain('Max-Age=0');
    });
  });
});
