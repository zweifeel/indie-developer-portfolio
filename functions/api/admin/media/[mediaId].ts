/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN MEDIA PREVIEW ENDPOINT
 * Route: GET /api/admin/media/:mediaId
 * 
 * Provides authenticated administrators with direct preview of draft, published,
 * or archived media assets. Uses strict private no-store cache controls to prevent
 * public CDN edge caching of private assets.
 * 
 * Fetches authenticated binary from Apps Script (M2M signed), verifies Base64
 * integrity and magic bytes, and streams as binary to admin browser.
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  parseCookies,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  callGasBackend,
  decodeBase64Binary,
  verifyBinaryMagicBytes,
  resolveSessionSecret,
} from '../auth/utils';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  });
};

export const onRequestGet = async (context: {
  request: Request;
  params: { mediaId: string };
  env: AuthEnv;
}): Promise<Response> => {
  const { request, params, env } = context;

  // 1. Validasi Sesi Admin
  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED', message: 'Sesi admin tidak ditemukan.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  const sessionRes = resolveSessionSecret(env);
  if (!sessionRes.secret) {
    return new Response(JSON.stringify({ success: false, error: 'CONFIGURATION_ERROR', message: 'Secret admin belum dikonfigurasi.' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
  const verification = await verifySessionToken(sessionToken, sessionRes.secret);
  if (!verification.valid || !verification.payload) {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_SESSION', message: 'Sesi admin tidak valid.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  const mediaId = params.mediaId;
  if (!mediaId || !/^med_[a-f0-9]{16}$/.test(mediaId)) {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_MEDIA_ID', message: 'Format ID media tidak valid.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // 2. Fetch authenticated binary from Apps Script
  const clientIp = request.headers.get('CF-Connecting-IP') || 'CLIENT_PROXY';
  const gasResult = await callGasBackend(env, 'ADMIN_GET_MEDIA_BINARY', {
    mediaId,
    sessionVersion: verification.payload.sessionVersion,
    clientIpMasked: clientIp,
  });

  if (gasResult.status !== 200 || !gasResult.body?.success || !gasResult.body?.data) {
    const status = gasResult.status === 401 ? 401 : gasResult.status === 404 ? 404 : 502;
    return new Response(JSON.stringify(gasResult.body || { success: false, error: 'NOT_FOUND', message: 'Media tidak ditemukan.' }), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });
  }

  const media = gasResult.body.data;
  const base64Data = media.base64Data;
  if (!base64Data || typeof base64Data !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_UPSTREAM_RESPONSE', message: 'Payload biner upstream kosong atau tidak valid.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });
  }

  const mimeType = String(media.mimeType || 'image/webp').toLowerCase();
  let binaryBytes: Uint8Array;
  try {
    binaryBytes = decodeBase64Binary(base64Data);
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'MALFORMED_BINARY_DATA', message: 'Gagal mendecode payload biner Base64.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });
  }

  if (!verifyBinaryMagicBytes(binaryBytes, mimeType)) {
    return new Response(JSON.stringify({ success: false, error: 'MAGIC_BYTES_MISMATCH', message: 'File biner tidak memiliki magic bytes yang valid.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });
  }

  const safeFilename = media.safeName || `${mediaId}.${mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp'}`;

  return new Response(binaryBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
    },
  });
};
