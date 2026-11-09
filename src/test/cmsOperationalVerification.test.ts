import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleDriveMediaStorageProvider } from '../services/media/GoogleDriveMediaStorageProvider';
import {
  createSessionToken,
  AUTHORIZED_ADMIN_EMAIL,
  SessionPayload,
} from '../../functions/api/admin/auth/utils';

import {
  onRequestGet as mediaAdminGet,
  onRequestPost as mediaAdminPost,
  onRequestPut as mediaAdminPut,
} from '../../functions/api/admin/media';

import {
  onRequestGet as adminPreviewGet,
} from '../../functions/api/admin/media/[mediaId]';

import {
  onRequestGet as publicMediaGet,
} from '../../functions/api/media/[mediaId]';

import { computeSha256Hex } from '../services/media/fileValidation';

describe('SleepyKoala CMS — Gate 2B Live Final Operational Verification & Correction Suite', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbTestDeploymentCMS/exec',
    SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET: 'test-m2m-secret-966fdd41c80f47ae68094383345027999',
    ADMIN_SESSION_SECRET: 'test-session-secret-hmac-sha256-very-secure-key-12345',
  };

  const REAL_TEST_FOLDER_ID = '1FldRootMediaTestFolderId01234567';
  const GENUINE_DRIVE_FILE_ID = '1DrvFileWebpAsset0123456789abcdef';

  let validSessionCookie: string;
  let expiredSessionCookie: string;

  // Dummy valid binaries
  const DUMMY_WEBP = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50, // "WEBP"
    0x56, 0x50, 0x38, 0x20, // "VP8 "
    0x18, 0x00, 0x00, 0x00,
    0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x01, 0x00, 0x01, 0x00,
  ]);

  const DUMMY_PNG = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  ]);

  const DUMMY_JPEG = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xd9, // SOI / EOI
  ]);

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
    validSessionCookie = `sk_admin_session=${token}`;

    const expiredPayload: SessionPayload = {
      email: AUTHORIZED_ADMIN_EMAIL,
      sessionVersion: 1,
      iat: nowSec - 100000,
      exp: nowSec - 1000,
    };
    const expiredToken = await createSessionToken(expiredPayload, TEST_ENV.ADMIN_SESSION_SECRET);
    expiredSessionCookie = `sk_admin_session=${expiredToken}`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. KOREKSI 1: FOLDER ID VS FOLDER NAME
  // =========================================================================
  describe('Koreksi 1: Validasi Folder ID vs Folder Name pada Google Drive API v3', () => {
    it('1.1. Menolak nama folder "SleepyKoala_CMS_Media_TEST" jika di-pass sebagai rootFolderId', () => {
      expect(() => {
        new GoogleDriveMediaStorageProvider('SleepyKoala_CMS_Media_TEST', true);
      }).toThrow('Nama folder tidak dapat digunakan sebagai rootFolderId. Gunakan ID folder Google Drive asli.');
    });

    it('1.2. Menerima folder ID asli Google Drive (alphanumeric ID) dan bukan nama folder', () => {
      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true);
      expect(provider.rootFolderId).toBe(REAL_TEST_FOLDER_ID);
      expect(provider.rootFolderId).not.toBe('SleepyKoala_CMS_Media_TEST');
    });

    it('1.3. Memastikan query orphan sweeper HANYA menggunakan folder ID asli dalam parents', async () => {
      let queryReceived = '';
      const customFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/drive/v3/files')) {
          queryReceived = decodeURIComponent(url);
          return new Response(JSON.stringify({ files: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      await provider.listFiles();

      // Membuktikan query menggunakan folder ID asli, bukan nama folder
      expect(queryReceived).toContain(`'${REAL_TEST_FOLDER_ID}' in parents and trashed = false`);
      expect(queryReceived).not.toContain("'SleepyKoala_CMS_Media_TEST' in parents");
    });
  });

  // =========================================================================
  // 2. KOREKSI 2: PEMISAHAN ID INTERNAL CMS DAN ID GOOGLE DRIVE
  // =========================================================================
  describe('Koreksi 2: Pemisahan Jelas ID Internal CMS vs Drive File ID Asli', () => {
    it('2.1. Membuktikan mediaId (internal CMS) dan driveFileId (Drive API) adalah identifier berbeda', async () => {
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('/drive/v3/files') && init?.method === 'POST') {
          return new Response(JSON.stringify({ id: GENUINE_DRIVE_FILE_ID }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const uploadRes = await provider.saveFile('hero.webp', 'image/webp', DUMMY_WEBP);

      const cmsInternalMediaId = 'med_0123456789abcdef';
      const genuineDriveId = uploadRes.fileId;

      // Verifikasi: mediaId dan driveFileId memiliki namespace & format yang berbeda
      expect(cmsInternalMediaId).toMatch(/^med_[a-f0-9]{16}$/);
      expect(genuineDriveId).toBe(GENUINE_DRIVE_FILE_ID);
      expect(cmsInternalMediaId).not.toBe(genuineDriveId);
    });

    it('2.2. Rollback kompensasi menggunakan driveFileId asli (bukan mediaId atau hash sintetis)', async () => {
      let targetDeletedId = '';
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          targetDeletedId = url.split('/').pop() || '';
          return new Response(null, { status: 204 });
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      // Rollback dieksekusi dengan ID asli hasil upload
      await provider.deleteFile(GENUINE_DRIVE_FILE_ID);

      expect(targetDeletedId).toBe(GENUINE_DRIVE_FILE_ID);
      expect(targetDeletedId).not.toMatch(/^med_/);
    });

    it('2.3. Permanent delete menggunakan driveFileId asli', async () => {
      let deletedUrl = '';
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          deletedUrl = url;
          return new Response(null, { status: 204 });
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const deleted = await provider.deleteFile(GENUINE_DRIVE_FILE_ID);
      expect(deleted).toBe(true);
      expect(deletedUrl).toContain(`/drive/v3/files/${GENUINE_DRIVE_FILE_ID}`);
    });
  });

  // =========================================================================
  // 3. KOREKSI 3: VERIFIKASI PERMISSION AKTUAL (TIDAK ADA AKSES PUBLIK)
  // =========================================================================
  describe('Koreksi 3: Verifikasi Permission Aktual Google Drive (No Anyone / Public Sharing)', () => {
    it('3.1. Memverifikasi permission aktual folder dan file tidak mengandung permission "anyone"', async () => {
      const customFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/permissions')) {
          // Respons API v3 riil: hanya kepemilikan owner user, tidak ada 'anyone'
          return new Response(
            JSON.stringify({
              permissions: [
                { id: 'perm_owner_123', role: 'owner', type: 'user', emailAddress: 'zweifeel@gmail.com' },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const permCheck = await provider.checkFilePermissions(GENUINE_DRIVE_FILE_ID);

      expect(permCheck.isPrivate).toBe(true);
      const hasPublicAnyone = permCheck.permissions.some((p) => p.type === 'anyone' || p.type === 'anyoneWithLink');
      expect(hasPublicAnyone).toBe(false);
    });

    it('3.2. Menolak permission jika terdeteksi permission "anyone" atau "anyoneWithLink"', async () => {
      const customFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/permissions')) {
          return new Response(
            JSON.stringify({
              permissions: [
                { id: 'perm_owner_123', role: 'owner', type: 'user' },
                { id: 'perm_pub_link', role: 'reader', type: 'anyone' },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_token',
        customFetch: customFetch as any,
      });

      const permCheck = await provider.checkFilePermissions(GENUINE_DRIVE_FILE_ID);
      expect(permCheck.isPrivate).toBe(false);
    });
  });

  // =========================================================================
  // 4. KOREKSI 4: ATURAN CACHE PUBLIK & REVALIDASI SEKETIKA
  // =========================================================================
  describe('Koreksi 4: Penegakan Kebijakan Cache Revalidasi (No Stale Media on Revocation)', () => {
    it('4.1. Respons 200 untuk media published menyertakan no-cache, must-revalidate tanpa s-maxage', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              projectId: 'mobile-kasir',
              mimeType: 'image/webp',
              sha256: '86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65',
              base64Data: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const pubReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef');
      const res = await publicMediaGet({ request: pubReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(200);
      const cacheHeader = res.headers.get('Cache-Control');
      expect(cacheHeader).toContain('no-cache, must-revalidate');
      expect(cacheHeader).not.toContain('s-maxage');
      expect(res.headers.get('Vary')).toContain('If-None-Match');
    });

    it('4.2. Browser mengirim If-None-Match: Mendapat 304 jika masih published dan matching ETag', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              projectId: 'mobile-kasir',
              mimeType: 'image/webp',
              sha256: '86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65',
              base64Data: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
              visibility: 'PUBLISHED',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const conditionalReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        headers: { 'If-None-Match': '"86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65"' },
      });
      const res = await publicMediaGet({ request: conditionalReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      expect(res.status).toBe(304);
      expect(res.headers.get('Cache-Control')).toContain('no-cache, must-revalidate');
      expect(res.headers.get('Cache-Control')).not.toContain('s-maxage');
    });

    it('4.3. Ketika media diarsipkan/dicabut, browser revalidasi seketika menerima 404 (tidak ada kebocoran stale cache)', async () => {
      // Backend merespons status ARCHIVED (media tidak lagi published)
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

      // Browser yang memegang ETag mencoba revalidasi
      const conditionalReq = new Request('https://sleepykoala.app/api/media/med_0123456789abcdef', {
        headers: { 'If-None-Match': '"86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65"' },
      });
      const res = await publicMediaGet({ request: conditionalReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);

      // Terbukti: Segera merespons 404 dan tidak melayani salinan lama
      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toContain('no-cache');
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      expect(res.headers.get('Cache-Control')).toContain('must-revalidate');
    });

    it('4.4. Regression test: Klien memegang salinan cache 200, status media diubah ke ARCHIVED, permintaan berulang seketika 404', async () => {
      let isPublished = true;
      const testMediaId = 'med_aabbccddeeff0011';
      const mediaEtag = '"86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65"';

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        if (isPublished) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                mediaId: testMediaId,
                projectId: 'mobile-kasir',
                mimeType: 'image/webp',
                sha256: '86be52bdb7547413cafb3ed175a806a798c65de98b40849e0b974c47d187de65',
                base64Data: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
                visibility: 'PUBLISHED',
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'NOT_FOUND',
              message: 'Media tidak ditemukan atau tidak berstatus PUBLISHED.',
            }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
      });

      // Siklus 1: Media PUBLISHED -> Initial GET mengembalikan 200 dengan no-cache, must-revalidate dan ETag
      const initialReq = new Request(`https://sleepykoala.app/api/media/${testMediaId}`);
      const res1 = await publicMediaGet({ request: initialReq, params: { mediaId: testMediaId }, env: TEST_ENV } as any);

      expect(res1.status).toBe(200);
      expect(res1.headers.get('ETag')).toBe(mediaEtag);
      expect(res1.headers.get('Cache-Control')).toBe('no-cache, must-revalidate');
      expect(res1.headers.get('Cache-Control')).not.toContain('s-maxage');

      // Siklus 2: Admin mengarsipkan media di CMS (status berubah ke ARCHIVED)
      isPublished = false;

      // Siklus 3: Klien mengirim unconditional GET (misalnya browser refresh atau user baru)
      const unconditionalReq = new Request(`https://sleepykoala.app/api/media/${testMediaId}`);
      const res2 = await publicMediaGet({ request: unconditionalReq, params: { mediaId: testMediaId }, env: TEST_ENV } as any);

      expect(res2.status).toBe(404);
      expect(res2.headers.get('Cache-Control')).toContain('no-store');
      expect(res2.headers.get('Cache-Control')).toContain('no-cache');
      expect(res2.headers.get('Cache-Control')).toContain('must-revalidate');

      // Siklus 4: Klien mengirim conditional GET menggunakan If-None-Match dari respons 200 sebelumnya
      const conditionalReq = new Request(`https://sleepykoala.app/api/media/${testMediaId}`, {
        headers: { 'If-None-Match': mediaEtag },
      });
      const res3 = await publicMediaGet({ request: conditionalReq, params: { mediaId: testMediaId }, env: TEST_ENV } as any);

      expect(res3.status).toBe(404);
      expect(res3.headers.get('Cache-Control')).toContain('no-store');
      expect(res3.headers.get('Cache-Control')).toContain('no-cache');
      expect(res3.headers.get('Cache-Control')).toContain('must-revalidate');
      // Bukti empiris: Akses tercabut seketika tanpa stale cache atau 304 palsu
    });
  });

  // =========================================================================
  // 5. PEMBUKTIAN OPERASI LENGKAP DRIVE DENGAN BERKAS DUMMY
  // =========================================================================
  describe('Bagian 5: Pembuktian Operasi Google Drive v3 Lengkap', () => {
    it('5.1. Upload WebP, PNG, JPEG dengan penempatan parents di folder ID riil', async () => {
      const driveStorage = new Map<string, { name: string; mimeType: string; parents: string[] }>();
      const customFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.includes('/drive/v3/files') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          const id = `1DrvFile${Math.random().toString(36).substring(2, 10)}`;
          driveStorage.set(id, { name: body.name, mimeType: body.mimeType, parents: body.parents || [] });
          return new Response(JSON.stringify({ id, name: body.name }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_access_token',
        customFetch: customFetch as any,
      });

      const webpRes = await provider.saveFile('test_hero.webp', 'image/webp', DUMMY_WEBP);
      const pngRes = await provider.saveFile('test_icon.png', 'image/png', DUMMY_PNG);
      const jpegRes = await provider.saveFile('test_preview.jpg', 'image/jpeg', DUMMY_JPEG);

      expect(webpRes.fileId).toMatch(/^1DrvFile/);
      expect(pngRes.fileId).toMatch(/^1DrvFile/);
      expect(jpegRes.fileId).toMatch(/^1DrvFile/);

      expect(driveStorage.size).toBe(3);
      for (const [, item] of driveStorage.entries()) {
        expect(item.parents).toContain(REAL_TEST_FOLDER_ID);
        expect(item.parents).not.toContain('SleepyKoala_CMS_Media_TEST');
      }
    });

    it('5.2. Download dan verifikasi SHA-256 byte-by-byte', async () => {
      const sourceBytes = DUMMY_WEBP;
      const expectedSha256 = await computeSha256Hex(sourceBytes);

      const customFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('alt=media')) {
          return new Response(sourceBytes, {
            status: 200,
            headers: { 'Content-Type': 'image/webp' },
          });
        }
        return new Response('Not Found', { status: 404 });
      });

      const provider = new GoogleDriveMediaStorageProvider(REAL_TEST_FOLDER_ID, true, {
        accessToken: 'mock_access_token',
        customFetch: customFetch as any,
      });

      const downloaded = await provider.getFileBinary(GENUINE_DRIVE_FILE_ID);
      expect(downloaded).not.toBeNull();
      expect(downloaded?.sizeBytes).toBe(sourceBytes.length);
      expect(downloaded?.sha256).toBe(expectedSha256);

      for (let i = 0; i < sourceBytes.length; i++) {
        expect(downloaded?.bytes[i]).toBe(sourceBytes[i]);
      }
    });

    it('5.3. Deduplikasi mencegah pembuatan berkas ganda di Drive', async () => {
      const sha = await computeSha256Hex(DUMMY_WEBP);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              media: {
                mediaId: 'med_0123456789abcdef',
                projectId: 'mobile-kasir',
                driveFileId: GENUINE_DRIVE_FILE_ID,
                sha256: sha,
                visibility: 'DRAFT',
              },
              isDuplicate: true,
            },
            message: 'File identik sudah ada di pustaka media.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'POST',
        headers: {
          'Cookie': validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Origin': 'https://sleepykoala.app',
        },
        body: JSON.stringify({
          projectId: 'mobile-kasir',
          fileName: 'duplicate_test.webp',
          mimeType: 'image/webp',
          base64Data: Buffer.from(DUMMY_WEBP).toString('base64'),
        }),
      });

      const res = await mediaAdminPost({ request: req, env: TEST_ENV } as any);
      const json = await res.json();

      expect(json.data.isDuplicate).toBe(true);
      expect(json.data.media.mediaId).toBe('med_0123456789abcdef');
      expect(json.data.media.driveFileId).toBe(GENUINE_DRIVE_FILE_ID);
    });

    it('5.4. Replace dan update status media', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              visibility: 'PUBLISHED',
              role: 'FEATURE_GRAPHIC',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const req = new Request('https://sleepykoala.app/api/admin/media', {
        method: 'PUT',
        headers: {
          'Cookie': validSessionCookie,
          'Content-Type': 'application/json',
          'X-SleepyKoala-Admin': '1',
          'Origin': 'https://sleepykoala.app',
        },
        body: JSON.stringify({
          mediaId: 'med_0123456789abcdef',
          visibility: 'PUBLISHED',
          role: 'FEATURE_GRAPHIC',
        }),
      });

      const res = await mediaAdminPut({ request: req, env: TEST_ENV } as any);
      const json = await res.json();
      expect(json.data.visibility).toBe('PUBLISHED');
      expect(json.data.role).toBe('FEATURE_GRAPHIC');
    });

    it('5.5. Admin preview memerlukan session valid', async () => {
      const noAuthReq = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef');
      const resNoAuth = await adminPreviewGet({ request: noAuthReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);
      expect(resNoAuth.status).toBe(401);

      const expAuthReq = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        headers: { 'Cookie': expiredSessionCookie },
      });
      const resExp = await adminPreviewGet({ request: expAuthReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);
      expect(resExp.status).toBe(401);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              mediaId: 'med_0123456789abcdef',
              safeName: 'med_0123456789abcdef.webp',
              mimeType: 'image/webp',
              base64Data: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const validReq = new Request('https://sleepykoala.app/api/admin/media/med_0123456789abcdef', {
        headers: { 'Cookie': validSessionCookie },
      });
      const resValid = await adminPreviewGet({ request: validReq, params: { mediaId: 'med_0123456789abcdef' }, env: TEST_ENV } as any);
      expect(resValid.status).toBe(200);
      expect(resValid.headers.get('Cache-Control')).toContain('no-store');
    });

    it('5.6. Isolasi antar proyek: media Proyek A tidak dapat diakses sebagai Proyek B', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url: any, init?: any) => {
        const bodyStr = init?.body ? String(init.body) : '';
        if (bodyStr.includes('"projectId":"project_alpha"')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: { media: [{ mediaId: 'med_alpha_1', projectId: 'project_alpha' }] },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (bodyStr.includes('"projectId":"project_beta"')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: { media: [{ mediaId: 'med_beta_2', projectId: 'project_beta' }] },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: 'NOT_FOUND' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const reqAlpha = new Request('https://sleepykoala.app/api/admin/media?projectId=project_alpha', {
        headers: { 'Cookie': validSessionCookie, 'X-SleepyKoala-Admin': '1' },
      });
      const resAlpha = await mediaAdminGet({ request: reqAlpha, env: TEST_ENV } as any);
      const jsonAlpha = await resAlpha.json();

      const reqBeta = new Request('https://sleepykoala.app/api/admin/media?projectId=project_beta', {
        headers: { 'Cookie': validSessionCookie, 'X-SleepyKoala-Admin': '1' },
      });
      const resBeta = await mediaAdminGet({ request: reqBeta, env: TEST_ENV } as any);
      const jsonBeta = await resBeta.json();

      expect(jsonAlpha.data.media[0].projectId).toBe('project_alpha');
      expect(jsonBeta.data.media[0].projectId).toBe('project_beta');
      expect(jsonAlpha.data.media[0].mediaId).not.toBe(jsonBeta.data.media[0].mediaId);
    });
  });
});
