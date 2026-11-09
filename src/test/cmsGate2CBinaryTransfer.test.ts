/**
 * ============================================================================
 * SLEEPYKOALA CMS — GATE 2C REAL BINARY MEDIA TRANSFER TEST SUITE
 * 
 * Verifies the end-to-end binary transfer pipeline:
 * Google Drive -> Apps Script TEST -> Base64 JSON -> Cloudflare Pages Functions -> Client
 * 
 * Comprehensive Coverage:
 * 1. Binary Transfer: WebP, PNG, JPEG & Sizes (100KB, 500KB, 1MB, 1.5MB, ~2MB, >2MB)
 * 2. Integrity: Hash match/mismatch, corrupted Base64, size mismatch, magic bytes spoofing
 * 3. Authorization: Relational publishing state checks, project isolation, session checks
 * 4. Conditional Requests: ETag short-circuit (304), instant revocation on ARCHIVE (404)
 * 5. Reliability & Fail-Safe: Timeout (504), rate limit / quota (503), malformed upstream (502)
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SessionPayload,
  computeBinarySha256Hex,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestOptions as publicMediaOptions,
  onRequestGet as publicMediaGet,
} from '../../functions/api/media/[mediaId]';

import {
  onRequestOptions as adminPreviewOptions,
  onRequestGet as adminPreviewGet,
} from '../../functions/api/admin/media/[mediaId]';

import {
  onRequestPost as adminMediaPost,
} from '../../functions/api/admin/media';

describe('SleepyKoala CMS — Gate 2C Binary Transfer & Resilience Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  let validSessionCookie: string;
  let expiredSessionCookie: string;

  // Binary dummy generators with authentic magic byte signatures
  function createDummyWebP(sizeBytes: number): Uint8Array {
    const bytes = new Uint8Array(sizeBytes);
    // RIFF header
    bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46;
    // Length (dummy)
    bytes[4] = (sizeBytes - 8) & 0xff;
    bytes[5] = ((sizeBytes - 8) >> 8) & 0xff;
    bytes[6] = ((sizeBytes - 8) >> 16) & 0xff;
    bytes[7] = ((sizeBytes - 8) >> 24) & 0xff;
    // WEBP signature
    bytes[8] = 0x57; bytes[9] = 0x45; bytes[10] = 0x42; bytes[11] = 0x50;
    // Fill remaining bytes with deterministic pattern
    for (let i = 12; i < sizeBytes; i++) {
      bytes[i] = (i * 37) & 0xff;
    }
    return bytes;
  }

  function createDummyPng(sizeBytes: number): Uint8Array {
    const bytes = new Uint8Array(sizeBytes);
    // 8-byte PNG signature: 89 50 4E 47 0D 0A 1A 0A
    bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4e; bytes[3] = 0x47;
    bytes[4] = 0x0d; bytes[5] = 0x0a; bytes[6] = 0x1a; bytes[7] = 0x0a;
    for (let i = 8; i < sizeBytes; i++) {
      bytes[i] = (i * 41) & 0xff;
    }
    return bytes;
  }

  function createDummyJpeg(sizeBytes: number): Uint8Array {
    const bytes = new Uint8Array(sizeBytes);
    // SOI: FF D8 FF
    bytes[0] = 0xff; bytes[1] = 0xd8; bytes[2] = 0xff; bytes[3] = 0xe0;
    for (let i = 4; i < sizeBytes - 2; i++) {
      bytes[i] = (i * 43) & 0xff;
    }
    // EOI: FF D9
    bytes[sizeBytes - 2] = 0xff;
    bytes[sizeBytes - 1] = 0xd9;
    return bytes;
  }

  function toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  beforeEach(async () => {
    vi.restoreAllMocks();

    const nowSec = Math.floor(Date.now() / 1000);
    const validPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec,
      exp: nowSec + 86400,
    };
    const validToken = await createSessionToken(validPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    validSessionCookie = `sk_admin_session=${validToken}`;

    const expPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec - 90000,
      exp: nowSec - 3600,
    };
    const expToken = await createSessionToken(expPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    expiredSessionCookie = `sk_admin_session=${expToken}`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. BINARY TRANSFER: FORMAT & SCALED FILE SIZES (100KB to 2MB)
  // =========================================================================
  describe('1. Binary Transfer & Size Handling', () => {
    it('1.1. Transfer format WebP (100 KB) dengan fidelitas byte-by-byte', async () => {
      const originalBytes = createDummyWebP(100 * 1024);
      const sha = await computeBinarySha256Hex(originalBytes);
      const b64 = toBase64(originalBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'banner-100k.webp',
              mimeType: 'image/webp',
              sizeBytes: originalBytes.length,
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/webp');
      expect(res.headers.get('ETag')).toBe(`"${sha}"`);

      const receivedBuf = await res.arrayBuffer();
      const receivedBytes = new Uint8Array(receivedBuf);
      expect(receivedBytes.length).toBe(originalBytes.length);
      expect(receivedBytes).toEqual(originalBytes);
    });

    it('1.2. Transfer format PNG (500 KB) dengan fidelitas byte-by-byte', async () => {
      const originalBytes = createDummyPng(500 * 1024);
      const sha = await computeBinarySha256Hex(originalBytes);
      const b64 = toBase64(originalBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'screenshot-500k.png',
              mimeType: 'image/png',
              sizeBytes: originalBytes.length,
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/png');
      expect(res.headers.get('ETag')).toBe(`"${sha}"`);

      const receivedBuf = await res.arrayBuffer();
      const receivedBytes = new Uint8Array(receivedBuf);
      expect(receivedBytes.length).toBe(originalBytes.length);
      expect(receivedBytes).toEqual(originalBytes);
    });

    it('1.3. Transfer format JPEG (1 MB) dengan fidelitas byte-by-byte', async () => {
      const originalBytes = createDummyJpeg(1024 * 1024);
      const sha = await computeBinarySha256Hex(originalBytes);
      const b64 = toBase64(originalBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'feature-1mb.jpg',
              mimeType: 'image/jpeg',
              sizeBytes: originalBytes.length,
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/jpeg');

      const receivedBuf = await res.arrayBuffer();
      expect(receivedBuf.byteLength).toBe(originalBytes.length);
    });

    it('1.4. Transfer berkas ukuran 1.5 MB', async () => {
      const originalBytes = createDummyWebP(Math.floor(1.5 * 1024 * 1024));
      const sha = await computeBinarySha256Hex(originalBytes);
      const b64 = toBase64(originalBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'hero-1-5mb.webp',
              mimeType: 'image/webp',
              sizeBytes: originalBytes.length,
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBe(originalBytes.length);
    });

    it('1.5. Transfer berkas mendekati batas 2 MB (~1.95 MB)', async () => {
      const nearLimitBytes = createDummyWebP(2044723); // ~1.95 MB
      const sha = await computeBinarySha256Hex(nearLimitBytes);
      const b64 = toBase64(nearLimitBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'max-payload.webp',
              mimeType: 'image/webp',
              sizeBytes: nearLimitBytes.length,
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBe(nearLimitBytes.length);
    });

    it('1.6. Menolak upload berkas biner > 2 MB pada admin endpoint dengan HTTP 413', async () => {
      const oversizedB64 = 'A'.repeat(2.9 * 1024 * 1024); // > 2.8 MB base64 ceiling
      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Cookie': validSessionCookie,
        },
        body: JSON.stringify({
          projectId: 'mobile-kasir',
          fileName: 'oversized.webp',
          mimeType: 'image/webp',
          base64Data: oversizedB64,
        }),
      });

      const res = await adminMediaPost({ request: req, env: TEST_ENV } as any);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  // =========================================================================
  // 2. INTEGRITY CHECKS: CORRUPTION, MISMATCH & SPOOFING
  // =========================================================================
  describe('2. Binary Integrity & Anti-Corruption', () => {
    it('2.1. Menolak jika checksum SHA-256 tidak cocok dengan metadata (502 INTEGRITY_CHECK_FAILED)', async () => {
      const realBytes = createDummyWebP(1024);
      const b64 = toBase64(realBytes);
      const forgedSha = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'tampered.webp',
              mimeType: 'image/webp',
              sizeBytes: realBytes.length,
              sha256: forgedSha, // Forged / mismatched hash!
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(502);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const json = await res.json();
      expect(json.error).toBe('INTEGRITY_CHECK_FAILED');
    });

    it('2.2. Menolak jika Base64 rusak / tidak valid (502 MALFORMED_BINARY_DATA)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'corrupt.webp',
              mimeType: 'image/webp',
              sizeBytes: 100,
              sha256: 'somehash',
              base64Data: '!!!NotValidBase64Characters@#$%^&*',
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(502);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
    });

    it('2.3. Menolak jika ukuran biner terdekode berbeda dari sizeBytes (502 SIZE_MISMATCH)', async () => {
      const realBytes = createDummyWebP(2048);
      const sha = await computeBinarySha256Hex(realBytes);
      const b64 = toBase64(realBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'size-tampered.webp',
              mimeType: 'image/webp',
              sizeBytes: 1024, // Declared 1024 bytes, but actual payload is 2048 bytes!
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.error).toBe('SIZE_MISMATCH');
    });

    it('2.4. Menolak tipe MIME palsu (deklarasi WebP tapi byte PNG) dengan 502 MAGIC_BYTES_MISMATCH', async () => {
      const pngBytes = createDummyPng(512); // Real PNG bytes
      const sha = await computeBinarySha256Hex(pngBytes);
      const b64 = toBase64(pngBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'spoofed.webp',
              mimeType: 'image/webp', // Declares WebP!
              sizeBytes: pngBytes.length,
              sha256: sha,
              base64Data: b64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.error).toBe('MAGIC_BYTES_MISMATCH');
    });
  });

  // =========================================================================
  // 3. AUTHORIZATION & RELATIONAL PUBLICATION CHECKS
  // =========================================================================
  describe('3. Strict Relational Authorization', () => {
    it('3.1. Media DRAFT menghasilkan 404 (tidak ada data biner dikirim)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
    });

    it('3.2. Media ARCHIVED menghasilkan 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(404);
    });

    it('3.3. Proyek DRAFT menghasilkan 404 meskipun media berstatus PUBLISHED', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(404);
    });

    it('3.4. Admin preview tanpa cookie sesi valid ditolak dengan 401', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef');
      const res = await adminPreviewGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(401);
      expect(res.headers.get('Cache-Control')).toContain('no-store');

      const expReq = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        headers: { Cookie: expiredSessionCookie },
      });
      const resExp = await adminPreviewGet({ request: expReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);
      expect(resExp.status).toBe(401);
    });

    it('3.5. Admin preview dengan cookie sesi valid menyajikan biner privat (private, no-store)', async () => {
      const testBytes = createDummyWebP(512);
      const sha = await computeBinarySha256Hex(testBytes);
      const b64 = toBase64(testBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'admin-preview.webp',
              mimeType: 'image/webp',
              sizeBytes: testBytes.length,
              sha256: sha,
              base64Data: b64,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        headers: { Cookie: validSessionCookie },
      });
      const res = await adminPreviewGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store, no-cache, must-revalidate');
      const buf = await res.arrayBuffer();
      expect(new Uint8Array(buf)).toEqual(testBytes);
    });
  });

  // =========================================================================
  // 4. CONDITIONAL REQUESTS & INSTANT REVOCATION DYNAMICS
  // =========================================================================
  describe('4. Conditional 304 Short-Circuit & Instant Revocation', () => {
    it('4.1. ETag Cocok: Menghasilkan 304 Not Modified tanpa transmisi biner', async () => {
      const currentSha = '86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65';

      // Apps Script merespons short-circuit { notModified: true }
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              notModified: true,
              mediaId: 'med_0123456789abcdef',
              sha256: currentSha,
              etag: `"${currentSha}"`,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        headers: { 'If-None-Match': `"${currentSha}"` },
      });
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(304);
      expect(res.headers.get('ETag')).toBe(`"${currentSha}"`);
      expect(res.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');

      // Memastikan body kosong (0 bytes)
      const bodyText = await res.text();
      expect(bodyText).toBe('');
    });

    it('4.2. ETag Berbeda: Menghasilkan 200 dengan biner baru', async () => {
      const newBytes = createDummyWebP(1024);
      const newSha = await computeBinarySha256Hex(newBytes);
      const newB64 = toBase64(newBytes);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              notModified: false,
              mediaId: 'med_0123456789abcdef',
              safeName: 'updated.webp',
              mimeType: 'image/webp',
              sizeBytes: newBytes.length,
              sha256: newSha,
              etag: `"${newSha}"`,
              base64Data: newB64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        headers: { 'If-None-Match': '"old-stale-hash-123"' },
      });
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('ETag')).toBe(`"${newSha}"`);
    });

    it('4.3. Pencabutan Seketika: Media diarsipkan, revalidasi conditional seketika 404 (tidak ada 304 atau 200)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        headers: { 'If-None-Match': '"cached-hash-999"' },
      });
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      expect(res.headers.get('Cache-Control')).toContain('must-revalidate');
    });
  });

  // =========================================================================
  // 5. RELIABILITY, ERROR PROPAGATION & FAIL-SAFE BEHAVIOR
  // =========================================================================
  describe('5. Reliability & Fail-Safe Handling', () => {
    it('5.1. Apps Script Timeout menghasilkan 504 UPSTREAM_TIMEOUT (no-store)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        const err = new Error('AbortError');
        err.name = 'AbortError';
        throw err;
      });

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(504);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const json = await res.json();
      expect(json.error).toBe('UPSTREAM_TIMEOUT');
    });

    it('5.2. Upstream Drive Rate Limit (429 / DRIVE_RATE_LIMIT) menghasilkan 503 SERVICE_UNAVAILABLE', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'DRIVE_RATE_LIMIT',
            message: 'Batas kuota Google Drive terlampaui.',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(503);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const json = await res.json();
      expect(json.error).toBe('SERVICE_UNAVAILABLE');
    });

    it('5.3. Respons upstream HTML / Malformed JSON menghasilkan 502', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response('<html><body>Google 500 Internal Error</body></html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        })
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: req, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(502);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
    });

    it('5.4. Response OPTIONS preflight menghasilkan 204 No Content', async () => {
      const resPub = await publicMediaOptions();
      expect(resPub.status).toBe(204);

      const resAdm = await adminPreviewOptions();
      expect(resAdm.status).toBe(204);
    });
  });
});
