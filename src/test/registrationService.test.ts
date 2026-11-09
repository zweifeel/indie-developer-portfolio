import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerTester, type RegistrationPayload } from '../services/registrationService';

describe('registrationService Unit Tests', () => {
  const samplePayload: RegistrationPayload = {
    testerName: 'Budi Santoso',
    testerEmail: 'budi.tester@gmail.com',
    projectId: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    appVersion: '0.9.2-beta',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST to /api/register-tester and returns success response', async () => {
    const mockSuccessResponse = {
      success: true,
      message: 'Pendaftaran closed testing berhasil diterima!',
      projectId: 'mobile-kasir',
      maskedEmail: 'bu***@gmail.com',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    });

    const result = await registerTester(samplePayload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/register-tester',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(samplePayload),
      })
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('berhasil diterima');
    expect(result.isDuplicate).toBeFalsy();
  });

  it('correctly handles duplicate registration response without throwing', async () => {
    const mockDuplicateResponse = {
      success: true,
      isDuplicate: true,
      message: 'Email Anda sudah terdaftar dalam antrean closed testing Mobile Kasir.',
      projectId: 'mobile-kasir',
      maskedEmail: 'bu***@gmail.com',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDuplicateResponse,
    });

    const result = await registerTester(samplePayload);

    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(true);
    expect(result.message).toContain('sudah terdaftar');
  });

  it('handles server validation errors (400 Bad Request)', async () => {
    const mockErrorResponse = {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Format alamat email Google Play tidak valid.',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockErrorResponse,
    });

    const result = await registerTester({
      ...samplePayload,
      testerEmail: 'invalid',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('VALIDATION_ERROR');
    expect(result.message).toContain('tidak valid');
  });

  it('handles gateway/timeout errors (502 / AbortError) gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

    const result = await registerTester(samplePayload);

    expect(result.success).toBe(false);
    expect(result.error).toBe('TIMEOUT');
    expect(result.message).toContain('timeout');
  });

  it('handles network connection failure gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    const result = await registerTester(samplePayload);

    expect(result.success).toBe(false);
    expect(result.error).toBe('NETWORK_ERROR');
    expect(result.message).toContain('Failed to fetch');
  });
});
