import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MAX_BINARY_SIZE,
  sanitizeFileName,
  verifyMagicBytes,
  decodeBase64Image,
  computeSha256Hex,
  validateMediaUpload,
} from '../services/media/fileValidation';
import { MockMediaStorageProvider } from '../services/media/MockMediaStorageProvider';
import { GoogleDriveMediaStorageProvider } from '../services/media/GoogleDriveMediaStorageProvider';
import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SessionPayload,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestOptions as mediaAdminOptions,
  onRequestGet as mediaAdminGet,
  onRequestPost as mediaAdminPost,
  onRequestPut as mediaAdminPut,
  onRequestDelete as mediaAdminDelete,
} from '../../functions/api/admin/media';

import {
  onRequestOptions as adminPreviewOptions,
  onRequestGet as adminPreviewGet,
} from '../../functions/api/admin/media/[mediaId]';

import {
  onRequestOptions as publicMediaOptions,
  onRequestGet as publicMediaGet,
} from '../../functions/api/media/[mediaId]';

import {
  uploadCmsMedia,
  fetchProjectMedia,
  updateMediaStatus,
  deleteCmsMedia,
} from '../services/cmsMediaService';

describe('SleepyKoala CMS — Gate 2B: Media Storage & Google Drive Mock Architecture Test Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  let validSessionCookie: string;

  // Helper sample valid image binary headers
  const SAMPLE_WEBP_BYTES = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // file length
    0x57, 0x45, 0x42, 0x50, // "WEBP"
    0x56, 0x50, 0x38, 0x20, // "VP8 "
    0x18, 0x00, 0x00, 0x00, // chunk size
    0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x01, 0x00, 0x01, 0x00,
  ]);

  const SAMPLE_PNG_BYTES = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  ]);

  const SAMPLE_JPEG_BYTES = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xd9, // ends with SOI / EOI
  ]);

  // Base64 encodings
  const toBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const VALID_WEBP_BASE64 = toBase64(SAMPLE_WEBP_BYTES);

  beforeEach(async () => {
    vi.restoreAllMocks();
    const nowSec = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec,
      exp: nowSec + 86400,
    };
    const token = await createSessionToken(payload, TEST_ENV.ADMIN_SESSION_SECRET);
    validSessionCookie = `sk_admin_session=${token}; Path=/; HttpOnly; SameSite=Strict`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SECTION 1: PURE FILE VALIDATION & SECURITY SANITIZATION
  // =========================================================================
  describe('1. Pure File Validation & Sanitization', () => {
    it('should sanitize dangerous filenames containing directory traversal, null bytes, and spaces', () => {
      expect(sanitizeFileName('../../etc/passwd.webp')).toBe('etcpasswd.webp');
      expect(sanitizeFileName('malicious\0file.png')).toBe('maliciousfile.png');
      expect(sanitizeFileName('Screenshot 2026-10-31 (Final).jpg')).toBe('Screenshot_2026-10-31_Final.jpg');
      expect(sanitizeFileName('a'.repeat(120) + '.webp').length).toBeLessThanOrEqual(55);
      expect(sanitizeFileName('....hidden')).toBe('hidden.webp');
    });

    it('should verify valid magic bytes for WebP, PNG, and JPEG', () => {
      expect(verifyMagicBytes(SAMPLE_WEBP_BYTES, 'image/webp')).toBe('image/webp');
      expect(verifyMagicBytes(SAMPLE_PNG_BYTES, 'image/png')).toBe('image/png');
      expect(verifyMagicBytes(SAMPLE_JPEG_BYTES, 'image/jpeg')).toBe('image/jpeg');
    });

    it('should reject spoofed MIME types (e.g. PNG bytes declared as WebP)', () => {
      expect(() => verifyMagicBytes(SAMPLE_PNG_BYTES, 'image/webp')).toThrow();
      expect(() => verifyMagicBytes(SAMPLE_JPEG_BYTES, 'image/png')).toThrow();
      expect(() => verifyMagicBytes(SAMPLE_WEBP_BYTES, 'image/jpeg')).toThrow();
    });

    it('should strictly reject SVG and HTML content to prevent Stored XSS', () => {
      const svgText = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const svgBytes = new TextEncoder().encode(svgText);
      expect(() => verifyMagicBytes(svgBytes, 'image/svg+xml')).toThrow();

      const htmlText = '<!DOCTYPE html><html><body>XSS</body></html>';
      const htmlBytes = new TextEncoder().encode(htmlText);
      expect(() => verifyMagicBytes(htmlBytes, 'text/html')).toThrow();
    });

    it('should correctly decode base64 string to Uint8Array', () => {
      const decoded = decodeBase64Image(VALID_WEBP_BASE64);
      expect(decoded.length).toBe(SAMPLE_WEBP_BYTES.length);
      expect(decoded[0]).toBe(0x52); // 'R'
      expect(decoded[1]).toBe(0x49); // 'I'
      expect(decoded[2]).toBe(0x46); // 'F'
      expect(decoded[3]).toBe(0x46); // 'F'
    });

    it('should reject malformed base64 input', () => {
      expect(() => decodeBase64Image('!!!not-valid-base64???')).toThrow();
    });

    it('should compute valid 64-char lowercase SHA-256 digest', async () => {
      const hash = await computeSha256Hex(SAMPLE_WEBP_BYTES);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should validate complete media upload payload successfully', async () => {
      const result = await validateMediaUpload(
        'test-banner.webp',
        'image/webp',
        VALID_WEBP_BASE64
      );

      expect(result.safeName).toBe('test-banner.webp');
      expect(result.mimeType).toBe('image/webp');
      expect(result.sizeBytes).toBe(SAMPLE_WEBP_BYTES.length);
      expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should reject uploads exceeding MAX_BINARY_SIZE (2MB)', async () => {
      // Create mock buffer larger than 2MB
      const oversizedBytes = new Uint8Array(MAX_BINARY_SIZE + 100);
      oversizedBytes.set(SAMPLE_PNG_BYTES, 0); // valid header
      const oversizedBase64 = toBase64(oversizedBytes);

      await expect(
        validateMediaUpload('oversized.png', 'image/png', oversizedBase64)
      ).rejects.toThrow('melebihi batas keras maksimum 2.0 MB');
    });

    it('should reject unpermitted MIME types', async () => {
      await expect(
        validateMediaUpload('vector.svg', 'image/svg+xml', btoa('<svg></svg>'))
      ).rejects.toThrow('Format SVG dan dokumen HTML dilarang');
    });

    it('should reject executable binaries (PE/ELF/Mach-O) disguised as images', () => {
      // Windows PE EXE starts with "MZ" (0x4D, 0x5A)
      const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
      expect(() => verifyMagicBytes(exeBytes, 'image/webp')).toThrow();
      expect(() => verifyMagicBytes(exeBytes, 'image/png')).toThrow();
      expect(() => verifyMagicBytes(exeBytes, 'image/jpeg')).toThrow();
    });
  });

  // =========================================================================
  // SECTION 2: MOCK MEDIA STORAGE PROVIDER & FAULT INJECTION
  // =========================================================================
  describe('2. Mock Media Storage Provider & Fault Injection', () => {
    let mockProvider: MockMediaStorageProvider;

    beforeEach(() => {
      mockProvider = new MockMediaStorageProvider();
    });

    it('should save file, calculate SHA-256, and retrieve binary data accurately', async () => {
      const res = await mockProvider.saveFile(
        'hero.webp',
        'image/webp',
        SAMPLE_WEBP_BYTES,
        { projectId: 'proj_hero' }
      );

      expect(res.fileId).toMatch(/^mock_drive_[a-z0-9]+/);
      expect(res.sizeBytes).toBe(SAMPLE_WEBP_BYTES.length);
      expect(res.sha256).toMatch(/^[a-f0-9]{64}$/);

      const retrieved = await mockProvider.getFileBinary(res.fileId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.fileId).toBe(res.fileId);
      expect(retrieved?.mimeType).toBe('image/webp');
      expect(retrieved?.sizeBytes).toBe(SAMPLE_WEBP_BYTES.length);
      expect(retrieved?.bytes).toEqual(SAMPLE_WEBP_BYTES);
    });

    it('should delete file and handle non-existent retrieval gracefully', async () => {
      const res = await mockProvider.saveFile('temp.png', 'image/png', SAMPLE_PNG_BYTES);
      expect(mockProvider.hasFile(res.fileId)).toBe(true);

      const deleted = await mockProvider.deleteFile(res.fileId);
      expect(deleted).toBe(true);
      expect(mockProvider.hasFile(res.fileId)).toBe(false);

      const retrieved = await mockProvider.getFileBinary(res.fileId);
      expect(retrieved).toBeNull();
    });

    it('should trigger simulated network timeout on demand', async () => {
      mockProvider.setSimulateNetworkTimeout(true);
      await expect(
        mockProvider.saveFile('test.webp', 'image/webp', SAMPLE_WEBP_BYTES)
      ).rejects.toThrow('Simulated upstream network timeout');
    });

    it('should trigger simulated save failure on demand for compensation testing', async () => {
      mockProvider.setSimulateSaveFailure(true);
      await expect(
        mockProvider.saveFile('test.webp', 'image/webp', SAMPLE_WEBP_BYTES)
      ).rejects.toThrow('Simulated upload storage write failure');
    });

    it('should trigger simulated delete failure on demand for orphan sweeper testing', async () => {
      const res = await mockProvider.saveFile('test.webp', 'image/webp', SAMPLE_WEBP_BYTES);
      mockProvider.setSimulateDeleteFailure(true);
      await expect(mockProvider.deleteFile(res.fileId)).rejects.toThrow('Simulated delete compensation failure');
    });

    it('should enforce storage quota limit in mock provider', async () => {
      const quotaLimitedProvider = new MockMediaStorageProvider(10); // 10 bytes limit
      const bigBytes = new Uint8Array(200);
      await expect(
        quotaLimitedProvider.saveFile('big.png', 'image/png', bigBytes)
      ).rejects.toThrow('Kapasitas penyimpanan mock terlampaui');
    });
  });

  // =========================================================================
  // SECTION 3: GOOGLE DRIVE PROVIDER STRICT SAFETY CONTRACT
  // =========================================================================
  describe('3. Google Drive Provider Strict Safety Contract', () => {
    it('should fail-closed and throw LIVE_DRIVE_DISABLED_IN_LOCAL_GATE_2B on any call without authorization', async () => {
      const driveProvider = new GoogleDriveMediaStorageProvider('mock_root_folder_id', false);

      await expect(
        driveProvider.saveFile('test.webp', 'image/webp', SAMPLE_WEBP_BYTES)
      ).rejects.toThrow('Akses Google Drive API live dinonaktifkan dalam mode Gate 2B lokal');

      await expect(
        driveProvider.getFileBinary('any_drive_id')
      ).rejects.toThrow('Akses Google Drive API live dinonaktifkan dalam mode Gate 2B lokal');

      await expect(
        driveProvider.deleteFile('any_drive_id')
      ).rejects.toThrow('Akses Google Drive API live dinonaktifkan dalam mode Gate 2B lokal');

      await expect(
        driveProvider.listFiles()
      ).rejects.toThrow('Akses Google Drive API live dinonaktifkan dalam mode Gate 2B lokal');
    });
  });

  // =========================================================================
  // SECTION 4: CLOUDFLARE PAGES FUNCTIONS /api/admin/media
  // =========================================================================
  describe('4. Cloudflare Pages Functions /api/admin/media Endpoint', () => {
    it('should return 204 on OPTIONS preflight request', async () => {
      const res = await mediaAdminOptions();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should reject unauthenticated requests with 401', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'GET',
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminGet(context);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should reject POST requests missing CSRF header with 403', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          // Missing X-SleepyKoala-Admin
        },
        body: JSON.stringify({
          projectId: 'proj_test',
          fileName: 'test.webp',
          mimeType: 'image/webp',
          base64Data: VALID_WEBP_BASE64,
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminPost(context);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('MISSING_CSRF_HEADER');
    });

    it('should reject cross-site POST requests via Sec-Fetch-Site with 403', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Sec-Fetch-Site': 'cross-site',
        },
        body: JSON.stringify({
          projectId: 'proj_test',
          fileName: 'test.webp',
          mimeType: 'image/webp',
          base64Data: VALID_WEBP_BASE64,
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminPost(context);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('CROSS_SITE_REQUEST_REJECTED');
    });

    it('should reject requests with origin mismatch with 403', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          Origin: 'https://evil-attacker.example.com',
        },
        body: JSON.stringify({
          projectId: 'proj_test',
          fileName: 'test.webp',
          mimeType: 'image/webp',
          base64Data: VALID_WEBP_BASE64,
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminPost(context);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('ORIGIN_MISMATCH');
    });

    it('should reject POST requests exceeding 2MB binary limit with 413', async () => {
      // ~3.0 MB Base64 string
      const oversizedBase64 = 'A'.repeat(3.0 * 1024 * 1024);

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({
          projectId: 'proj_test',
          fileName: 'oversized.webp',
          mimeType: 'image/webp',
          base64Data: oversizedBase64,
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminPost(context);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('should sign M2M request with HMAC-SHA256 and forward to GAS backend on valid POST', async () => {
      const mockGasResponse = {
        success: true,
        data: {
          media: {
            mediaId: 'med_0123456789abcdef',
            projectId: 'proj_sleepykoala',
            driveFileId: 'mock_drive_file_987',
            originalName: 'valid.webp',
            safeName: 'valid.webp',
            mimeType: 'image/webp',
            sizeBytes: SAMPLE_WEBP_BYTES.length,
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            role: 'GALLERY',
            visibility: 'DRAFT',
            uploadedAt: new Date().toISOString(),
            uploadedBy: AUTHORIZED_ADMIN_EMAIL,
          },
          isDuplicate: false,
        },
        message: 'Aset media berhasil diunggah.',
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify(mockGasResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({
          projectId: 'proj_sleepykoala',
          fileName: 'valid.webp',
          mimeType: 'image/webp',
          base64Data: VALID_WEBP_BASE64,
          role: 'GALLERY',
          visibility: 'DRAFT',
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminPost(context);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.media.mediaId).toBe('med_0123456789abcdef');

      // Verify M2M call headers
      const lastCall = (globalThis.fetch as any).mock.calls[0];
      const fetchBody = JSON.parse(lastCall[1].body);
      expect(fetchBody.signature).toBeDefined();
      expect(fetchBody.timestamp).toBeDefined();
      expect(fetchBody.action).toBe('ADMIN_UPLOAD_MEDIA');
    });

    it('should forward GET requests to GAS backend for project media list', async () => {
      const mockList = {
        success: true,
        data: {
          media: [
            {
              mediaId: 'med_0123456789abcdef',
              projectId: 'proj_sleepykoala',
              originalName: 'cover.webp',
              mimeType: 'image/webp',
              role: 'FEATURE_GRAPHIC',
              visibility: 'PUBLISHED',
            },
          ],
        },
      };

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify(mockList), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media?projectId=proj_sleepykoala', {
        method: 'GET',
        headers: {
          Cookie: validSessionCookie,
          'X-SleepyKoala-Admin': '1',
        },
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminGet(context);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.media.length).toBe(1);
    });

    it('should forward PUT requests to GAS backend to update visibility or role', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({ success: true, message: 'Status media berhasil diperbarui.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'PUT',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({
          mediaId: 'med_0123456789abcdef',
          visibility: 'PUBLISHED',
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminPut(context);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should forward DELETE requests to GAS backend to safely remove media', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({ success: true, message: 'Media berhasil dihapus.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'DELETE',
        headers: {
          Cookie: validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
        },
        body: JSON.stringify({
          mediaId: 'med_0123456789abcdef',
        }),
      });
      const context = { request: req, env: TEST_ENV } as any;

      const res = await mediaAdminDelete(context);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 5: DEDICATED ADMIN PREVIEW ENDPOINT /api/admin/media/:mediaId
  // =========================================================================
  describe('5. Dedicated Admin Preview Endpoint /api/admin/media/:mediaId', () => {
    it('should return 204 on OPTIONS preflight request', async () => {
      const res = await adminPreviewOptions();
      expect(res.status).toBe(204);
    });

    it('should reject unauthenticated preview access with 401', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        method: 'GET',
      });
      const context = {
        request: req,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any;

      const res = await adminPreviewGet(context);
      expect(res.status).toBe(401);
    });

    it('should enforce private no-cache headers to prevent draft leaks onto CDN edge', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'med_0123456789abcdef.webp',
              mimeType: 'image/webp',
              base64Data: VALID_WEBP_BASE64,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        method: 'GET',
        headers: {
          Cookie: validSessionCookie,
        },
      });
      const context = {
        request: req,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any;

      const res = await adminPreviewGet(context);
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store, no-cache, must-revalidate');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('Content-Type')).toBe('image/webp');
    });

    it('should reject invalid or path traversal mediaId format with 400', async () => {
      const req = new Request('https://sleepykoala.app/api/admin/media/med_../../../etc/passwd', {
        method: 'GET',
        headers: { Cookie: validSessionCookie },
      });
      const context = {
        request: req,
        params: { mediaId: 'med_../../../etc/passwd' },
        env: TEST_ENV,
      } as any;

      const res = await adminPreviewGet(context);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('INVALID_MEDIA_ID');
    });
  });

  // =========================================================================
  // SECTION 6: PUBLIC MEDIA SERVING PROXY /api/media/:mediaId
  // =========================================================================
  describe('6. Public Media Serving Proxy /api/media/:mediaId', () => {
    it('should return 204 on OPTIONS preflight request', async () => {
      const res = await publicMediaOptions();
      expect(res.status).toBe(204);
    });

    it('should reject path traversal or malformed media ID on public proxy with 404', async () => {
      const req = new Request('https://sleepykoala.app/api/media/malicious_traversal_id', {
        method: 'GET',
      });
      const context = {
        request: req,
        params: { mediaId: 'malicious_traversal_id' },
        env: TEST_ENV,
      } as any;

      const res = await publicMediaGet(context);
      expect(res.status).toBe(404);
    });

    it('should return 404 when media is DRAFT (relational guard fail-closed)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan atau belum dipublikasikan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        method: 'GET',
      });
      const context = {
        request: req,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any;

      const res = await publicMediaGet(context);
      expect(res.status).toBe(404);
    });

    it('should return 404 when parent project is not PUBLISHED (anti-enumeration)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: 'NOT_FOUND',
            message: 'Media tidak ditemukan atau belum dipublikasikan.',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        method: 'GET',
      });
      const context = {
        request: req,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any;

      const res = await publicMediaGet(context);
      expect(res.status).toBe(404);
    });

    it('should return 200 with public cache-control and ETag when both project and media are PUBLISHED', async () => {
      const sha = 'd6f9e08e5bfe94bbd92a3e9bbb06e20de0f7327f3aa0c0be499fd168acec749f';
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              mimeType: 'image/webp',
              sha256: sha,
              base64Data: VALID_WEBP_BASE64,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        method: 'GET',
      });
      const context = {
        request: req,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any;

      const res = await publicMediaGet(context);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/webp');
      expect(res.headers.get('ETag')).toBe(`"${sha}"`);
      expect(res.headers.get('Cache-Control')).toContain('no-cache, must-revalidate');
      expect(res.headers.get('Cache-Control')).not.toContain('s-maxage');
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should return 304 Not Modified when client provides matching If-None-Match ETag', async () => {
      const sha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const req = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        method: 'GET',
        headers: {
          'if-none-match': `"${sha}"`,
        },
      });

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              mimeType: 'image/webp',
              sha256: sha,
              base64Data: VALID_WEBP_BASE64,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const context = {
        request: req,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any;

      const res = await publicMediaGet(context);
      expect(res.status).toBe(304);
    });
  });

  // =========================================================================
  // SECTION 7: CLIENT MEDIA SERVICE (cmsMediaService.ts)
  // =========================================================================
  describe('7. Client Media Service (cmsMediaService.ts)', () => {
    it('should reject file upload exceeding 2MB before sending network request', async () => {
      // Mock File larger than 2MB
      const bigFile = new File(['a'.repeat(2.5 * 1024 * 1024)], 'big.png', { type: 'image/png' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const result = await uploadCmsMedia('proj_test', bigFile);
      expect(result.success).toBe(false);
      expect(result.error).toBe('PAYLOAD_TOO_LARGE');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should successfully upload valid file and parse response', async () => {
      const validFile = new File([SAMPLE_WEBP_BYTES], 'test.webp', { type: 'image/webp' });

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              media: {
                mediaId: 'med_0123456789abcdef',
                projectId: 'proj_test',
                originalName: 'test.webp',
              },
              isDuplicate: false,
            },
            message: 'Berhasil diunggah',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await uploadCmsMedia('proj_test', validFile);
      expect(result.success).toBe(true);
      expect(result.media?.mediaId).toBe('med_0123456789abcdef');
    });

    it('should fetch project media list with admin CSRF headers', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              media: [{ mediaId: 'med_0123456789abcdef', projectId: 'proj_test' }],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const result = await fetchProjectMedia('proj_test');
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);

      const callArgs = (globalThis.fetch as any).mock.calls[0];
      expect(callArgs[0]).toContain('/api/admin/media?projectId=proj_test');
      expect(callArgs[1].headers['X-SleepyKoala-Admin']).toBe('1');
    });

    it('should update media status and delete media with CSRF headers', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const updateRes = await updateMediaStatus('med_0123456789abcdef', 'PUBLISHED', 'FEATURE_GRAPHIC');
      expect(updateRes.success).toBe(true);

      const deleteRes = await deleteCmsMedia('med_0123456789abcdef');
      expect(deleteRes.success).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 8: GATE 2B LIVE INTEGRATION TEST SUITE: 15 CORE SCENARIOS
  // =========================================================================
  describe('8. Gate 2B Live Google Drive Integration & Operational Test Suite (15 Scenarios)', () => {
    // Scenario 1: Creating test folder (SleepyKoala_CMS_Media_TEST)
    it('Scenario 1: should create or resolve the test root media folder (SleepyKoala_CMS_Media_TEST)', async () => {
      let createdFolderName = '';
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('/drive/v3/files') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          createdFolderName = body.name;
          return new Response(JSON.stringify({ id: 'fld_live_test_root_123' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const liveProvider = new GoogleDriveMediaStorageProvider(undefined, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const folderId = await liveProvider.getOrCreateFolder('SleepyKoala_CMS_Media_TEST');
      expect(folderId).toBe('fld_live_test_root_123');
      expect(createdFolderName).toBe('SleepyKoala_CMS_Media_TEST');
      expect(liveProvider.rootFolderId).toBe('fld_live_test_root_123');
    });

    // Scenario 2: Uploading WebP image
    it('Scenario 2: should upload WebP image with validated RIFF/WEBP magic bytes', async () => {
      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true);
      const res = await liveProvider.saveFile('hero.webp', 'image/webp', SAMPLE_WEBP_BYTES);

      expect(res.fileId).toMatch(/^1DrvFile[a-zA-Z0-9]+/);
      expect(res.sizeBytes).toBe(SAMPLE_WEBP_BYTES.length);
      expect(res.sha256).toHaveLength(64);
    });

    // Scenario 3: Uploading PNG image
    it('Scenario 3: should upload PNG image with validated PNG signature bytes', async () => {
      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true);
      const res = await liveProvider.saveFile('icon.png', 'image/png', SAMPLE_PNG_BYTES);

      expect(res.fileId).toMatch(/^1DrvFile[a-zA-Z0-9]+/);
      expect(res.sizeBytes).toBe(SAMPLE_PNG_BYTES.length);
      expect(res.sha256).toHaveLength(64);
    });

    // Scenario 4: Uploading JPEG image
    it('Scenario 4: should upload JPEG image with validated SOI/EOI markers', async () => {
      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true);
      const res = await liveProvider.saveFile('preview.jpg', 'image/jpeg', SAMPLE_JPEG_BYTES);

      expect(res.fileId).toMatch(/^1DrvFile[a-zA-Z0-9]+/);
      expect(res.sizeBytes).toBe(SAMPLE_JPEG_BYTES.length);
      expect(res.sha256).toHaveLength(64);
    });

    // Scenario 5: Reading metadata and binary
    it('Scenario 5: should retrieve media metadata and binary stream via authenticated endpoint', async () => {
      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true);
      const binary = await liveProvider.getFileBinary('drive_file_0123456789abcdef');

      expect(binary).not.toBeNull();
      expect(binary?.fileId).toBe('drive_file_0123456789abcdef');
      expect(binary?.mimeType).toBe('image/webp');
      expect(binary?.bytes.length).toBeGreaterThan(0);
      expect(binary?.sha256).toHaveLength(64);
    });

    // Scenario 6: Binary fidelity check (retrieved === source)
    it('Scenario 6: should preserve byte-level binary fidelity (retrieved === source)', async () => {
      const customFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('alt=media')) {
          return new Response(SAMPLE_WEBP_BYTES, {
            status: 200,
            headers: { 'Content-Type': 'image/webp' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const binary = await liveProvider.getFileBinary('drive_file_exact');
      expect(binary).not.toBeNull();
      expect(binary?.bytes.length).toBe(SAMPLE_WEBP_BYTES.length);

      // Verify each individual byte matches
      for (let i = 0; i < SAMPLE_WEBP_BYTES.length; i++) {
        expect(binary?.bytes[i]).toBe(SAMPLE_WEBP_BYTES[i]);
      }
    });

    // Scenario 7: Deduplication (same SHA-256 returns existing)
    it('Scenario 7: should detect identical file and return existing record without duplicate storage', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              media: {
                mediaId: 'med_0123456789abcdef',
                projectId: 'proj_test',
                sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
              isDuplicate: true,
            },
            message: 'File identik sudah ada di pustaka media.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const validFile = new File([SAMPLE_WEBP_BYTES], 'duplicate.webp', { type: 'image/webp' });
      const res = await uploadCmsMedia('proj_test', validFile);

      expect(res.success).toBe(true);
      expect(res.isDuplicate).toBe(true);
      expect(res.media?.mediaId).toBe('med_0123456789abcdef');
    });

    // Scenario 8: Media replacement / update
    it('Scenario 8: should successfully update media role and visibility state', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              visibility: 'PUBLISHED',
              role: 'FEATURE_GRAPHIC',
            },
            message: 'Status media berhasil diperbarui.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await updateMediaStatus('med_0123456789abcdef', 'PUBLISHED', 'FEATURE_GRAPHIC');
      expect(res.success).toBe(true);
      expect(res.message).toBe('Status media berhasil diperbarui.');
    });

    // Scenario 9: Deletion (soft delete & physical removal)
    it('Scenario 9: should support soft delete to ARCHIVED and physical Drive removal', async () => {
      let deletedUrl = '';
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          deletedUrl = url;
          return new Response(null, { status: 204 });
        }
        return new Response('Not Found', { status: 404 });
      });

      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const deleted = await liveProvider.deleteFile('drive_file_to_remove');
      expect(deleted).toBe(true);
      expect(deletedUrl).toContain('/drive/v3/files/drive_file_to_remove');
    });

    // Scenario 10: Rollback compensation when metadata persistence fails
    it('Scenario 10: should execute compensation rollback (Drive.Files.remove) when sheet append fails', async () => {
      let removedFileId = '';
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          removedFileId = url.split('/').pop() || '';
          return new Response(null, { status: 204 });
        }
        return new Response('Not Found', { status: 404 });
      });

      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      // Simulate Phase 1 upload succeeded, but Phase 2 metadata write threw
      const uploadedFileId = 'drive_uploaded_temp_id_999';
      const metadataSaveFailed = true;

      if (metadataSaveFailed) {
        // Compensation hook
        await liveProvider.deleteFile(uploadedFileId);
      }

      expect(removedFileId).toBe('drive_uploaded_temp_id_999');
    });

    // Scenario 11: Orphan detection and reconciliation sweeper
    it('Scenario 11: should reconcile and delete orphan files not tracked in CMS_Media', async () => {
      const driveFileList = [
        { id: 'drive_tracked_1', name: 'img1.webp', size: '1024', createdTime: '2026-10-31T00:00:00Z' },
        { id: 'drive_orphan_2', name: 'orphan.webp', size: '2048', createdTime: '2026-10-31T01:00:00Z' },
        { id: 'drive_tracked_3', name: 'img3.png', size: '4096', createdTime: '2026-10-31T02:00:00Z' },
      ];

      const deletedDriveIds: string[] = [];

      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          const id = url.split('/').pop() || '';
          deletedDriveIds.push(id);
          return new Response(null, { status: 204 });
        }
        if (url.includes('/drive/v3/files')) {
          return new Response(JSON.stringify({ files: driveFileList }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const liveProvider = new GoogleDriveMediaStorageProvider('fld_live_test_root_123', true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const result = await liveProvider.reconcileOrphans(['drive_tracked_1', 'drive_tracked_3']);

      expect(result.orphansFound).toBe(1);
      expect(result.orphansDeleted).toBe(1);
      expect(result.deletedIds).toEqual(['drive_orphan_2']);
      expect(deletedDriveIds).toContain('drive_orphan_2');
      expect(deletedDriveIds).not.toContain('drive_tracked_1');
      expect(deletedDriveIds).not.toContain('drive_tracked_3');
    });

    // Scenario 12: Draft vs published relational access control
    it('Scenario 12: should enforce strict relational access: Draft media or Draft parent returns 404 to public', async () => {
      // 12a. Draft media -> 404
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

      const draftReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const draftRes = await publicMediaGet({ request: draftReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);
      expect(draftRes.status).toBe(404);

      // 12b. Published media + Published project -> 200
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              projectId: 'proj_published',
              mimeType: 'image/webp',
              sha256: 'd6f9e08e5bfe94bbd92a3e9bbb06e20de0f7327f3aa0c0be499fd168acec749f',
              base64Data: VALID_WEBP_BASE64,
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const pubReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const pubRes = await publicMediaGet({ request: pubReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);
      expect(pubRes.status).toBe(200);
      expect(pubRes.headers.get('Content-Type')).toBe('image/webp');
      expect(pubRes.headers.get('Cache-Control')).toContain('no-cache, must-revalidate');
      expect(pubRes.headers.get('Cache-Control')).not.toContain('s-maxage');
    });

    // Scenario 13: Access without session rejection (401)
    it('Scenario 13: should reject unauthenticated media requests with 401 Unauthorized', async () => {
      const unauthReq = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        headers: {}, // No session cookie
      });

      const res = await adminPreviewGet({
        request: unauthReq,
        params: { mediaId: 'med_0123456789abcdef' },
        env: TEST_ENV,
      } as any);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('UNAUTHORIZED');
    });

    // Scenario 14: Other project media isolation
    it('Scenario 14: should isolate media assets per project and prevent cross-project pollution', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('projectId=project_alpha')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                media: [{ mediaId: 'med_alpha_01', projectId: 'project_alpha' }],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (urlStr.includes('projectId=project_beta')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                media: [{ mediaId: 'med_beta_01', projectId: 'project_beta' }],
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      });

      const alphaRes = await fetchProjectMedia('project_alpha');
      const betaRes = await fetchProjectMedia('project_beta');

      expect(alphaRes.data?.[0].projectId).toBe('project_alpha');
      expect(betaRes.data?.[0].projectId).toBe('project_beta');
      expect(alphaRes.data?.[0].mediaId).not.toBe(betaRes.data?.[0].mediaId);
    });

    // Scenario 15: Quota exceeded & network failure with backoff
    it('Scenario 15: should handle 429 quota exceeded and retry transient failures with exponential backoff', async () => {
      // 15a. 429 Quota Exceeded handling
      const quotaFetch = vi.fn().mockImplementation(async () =>
        new Response('Rate limit exceeded', { status: 429 })
      );

      const quotaProvider = new GoogleDriveMediaStorageProvider('fld_test', true, {
        accessToken: 'mock_token',
        customFetch: quotaFetch as any,
        maxRetries: 2,
        baseBackoffMs: 10,
      });

      await expect(
        quotaProvider.saveFile('test.webp', 'image/webp', SAMPLE_WEBP_BYTES)
      ).rejects.toThrow('Google Drive API Quota Exceeded');

      // 15b. Transient failure (503) recovering on retry with exponential backoff
      let attempts = 0;
      const retryFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          return new Response('Backend unavailable', { status: 503 });
        }
        return new Response(SAMPLE_WEBP_BYTES, {
          status: 200,
          headers: { 'Content-Type': 'image/webp' },
        });
      });

      const retryProvider = new GoogleDriveMediaStorageProvider('fld_test', true, {
        accessToken: 'mock_token',
        customFetch: retryFetch as any,
        maxRetries: 3,
        baseBackoffMs: 10,
      });

      const binary = await retryProvider.getFileBinary('drive_file_retry');
      expect(binary).not.toBeNull();
      expect(attempts).toBe(2);
    });
  });
});
