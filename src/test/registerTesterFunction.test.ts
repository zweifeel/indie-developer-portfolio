import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestOptions, onRequestPost } from '../../functions/api/register-tester';

describe('Cloudflare Pages Function: /api/register-tester', () => {
  const validEnv = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentId/exec',
    APPS_SCRIPT_SECRET: 'test-crypto-secret-token-64-characters-long-example-value-here',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('A. CORS Preflight (OPTIONS)', () => {
    it('returns status 204 with security headers', async () => {
      const response = await onRequestOptions();
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('B. Configuration & Environment Validation', () => {
    it('returns 503 CONFIGURATION_ERROR if GAS_WEBAPP_URL is missing', async () => {
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerName: 'Budi Santoso', testerEmail: 'budi@gmail.com' }),
      });

      const response = await onRequestPost({ request, env: { GAS_WEBAPP_URL: '' } });
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('CONFIGURATION_ERROR');
    });

    it('returns 503 CONFIGURATION_ERROR if GAS_WEBAPP_URL is not a script.google.com domain', async () => {
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerName: 'Budi Santoso', testerEmail: 'budi@gmail.com' }),
      });

      const response = await onRequestPost({
        request,
        env: { GAS_WEBAPP_URL: 'https://malicious-domain.com/exec' },
      });
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('C. Request & Input Validation', () => {
    it('returns 413 PAYLOAD_TOO_LARGE if Content-Length exceeds 50KB', async () => {
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'content-length': '60000',
        },
        body: JSON.stringify({ testerName: 'Budi', testerEmail: 'budi@gmail.com' }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(413);
      const data = await response.json();
      expect(data.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('returns 400 INVALID_JSON on malformed JSON body', async () => {
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-data{{{',
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('INVALID_JSON');
    });

    it('returns 400 VALIDATION_ERROR if testerName is missing or shorter than 2 chars', async () => {
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerName: 'A', testerEmail: 'budi@gmail.com' }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('minimal 2 karakter');
    });

    it('returns 400 VALIDATION_ERROR if testerEmail is invalid', async () => {
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerName: 'Budi Santoso', testerEmail: 'not-an-email' }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('tidak valid');
    });

    it('returns 200 OK without forwarding upstream if honeypot is filled (Anti-Bot)', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerName: 'Spam Bot',
          testerEmail: 'bot@spam.com',
          honeypot: 'filled-by-bot',
        }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // Ensure upstream was never called
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('D. Upstream Handshake & Security Handling', () => {
    it('forwards request to GAS with injected secretToken and masked IP', async () => {
      let forwardedBody: Record<string, unknown> | null = null;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        forwardedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Pendaftaran berhasil diterima.',
          }),
          { status: 200 }
        );
      });

      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '180.252.55.101',
          'user-agent': 'TestAgent/1.0',
        },
        body: JSON.stringify({
          testerName: 'Siti Aminah',
          testerEmail: 'siti@gmail.com',
          projectId: 'mobile-kasir',
          projectName: 'Mobile Kasir',
        }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(200);
      const clientData = await response.json();
      expect(clientData.success).toBe(true);

      // Verify forwarded payload to GAS
      expect(forwardedBody).not.toBeNull();
      expect(forwardedBody!['secretToken']).toBe(validEnv.APPS_SCRIPT_SECRET);
      expect(forwardedBody!['clientIpMasked']).toBe('180.252.xxx.xxx');
      expect(forwardedBody!['testerEmail']).toBe('siti@gmail.com');

      // Verify client response NEVER contains the secretToken or GAS URL
      expect(JSON.stringify(clientData)).not.toContain(validEnv.APPS_SCRIPT_SECRET);
      expect(JSON.stringify(clientData)).not.toContain('AKfycb');
    });

    it('handles upstream duplicate response gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            isDuplicate: true,
            message: 'Email Anda sudah terdaftar dalam antrean closed testing.',
            maskedEmail: 'si***@gmail.com',
          }),
          { status: 200 }
        )
      );

      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerName: 'Siti Aminah',
          testerEmail: 'siti@gmail.com',
        }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.isDuplicate).toBe(true);
      expect(data.maskedEmail).toBe('si***@gmail.com');
    });

    it('returns 502 TIMEOUT when upstream fetch aborts (timeout simulation)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerName: 'Siti Aminah',
          testerEmail: 'siti@gmail.com',
        }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.error).toBe('TIMEOUT');
      expect(data.message).toContain('timeout');
    });

    it('returns 502 INVALID_UPSTREAM_RESPONSE when upstream returns HTML or non-JSON', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('<html><body>Google Error 500</body></html>', { status: 500 })
      );

      const request = new Request('http://localhost/api/register-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerName: 'Siti Aminah',
          testerEmail: 'siti@gmail.com',
        }),
      });

      const response = await onRequestPost({ request, env: validEnv });
      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.error).toBe('INVALID_UPSTREAM_RESPONSE');
    });
  });
});
