/**
 * ============================================================================
 * SLEEPYKOALA CMS — PUBLIC MEDIA PROXY ENDPOINT
 * Route: GET /api/media/:mediaId
 * 
 * Serves verified published media assets to the public portfolio.
 * Strict Relational Authorization Check:
 * Public access is ONLY granted if:
 * 1. CMS_Media.visibility === 'PUBLISHED'
 * 2. CMS_Projects.publishState === 'PUBLISHED'
 * If either condition fails, returns 404 Not Found to prevent asset leakage.
 * 
 * Binary Transfer: Real Base64 decoding, SHA-256 integrity check, magic bytes
 * verification, and conditional 304 Not Modified short-circuit.
 * ============================================================================
 */

import {
  AuthEnv,
  SECURITY_HEADERS,
  callGasBackend,
  ALLOWED_MEDIA_MIME_TYPES,
  decodeBase64Binary,
  computeBinarySha256Hex,
  verifyBinaryMagicBytes,
} from '../admin/auth/utils';

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

  const mediaId = params.mediaId;
  if (!mediaId || !/^med_[a-f0-9]{16}$/.test(mediaId)) {
    return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND', message: 'Media tidak ditemukan.' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Check conditional If-None-Match (ETag)
  const clientEtag = request.headers.get('if-none-match');

  // Query backend to resolve public media metadata, relational check, & binary
  const gasResult = await callGasBackend(env, 'CMS_GET_PUBLIC_MEDIA', {
    mediaId,
    ifNoneMatch: clientEtag || undefined,
  });

  // Handle upstream timeout
  if (gasResult.status === 504 || gasResult.body?.error === 'TIMEOUT') {
    return new Response(JSON.stringify({ success: false, error: 'UPSTREAM_TIMEOUT', message: 'Batas waktu komunikasi upstream terlampaui.' }), {
      status: 504,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Handle upstream temporary error / rate limit
  if (gasResult.status === 503 || gasResult.body?.error === 'SERVICE_UNAVAILABLE' || gasResult.body?.error === 'DRIVE_RATE_LIMIT') {
    return new Response(JSON.stringify({ success: false, error: 'SERVICE_UNAVAILABLE', message: 'Layanan media sementara tidak tersedia.' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Handle upstream gateway error / invalid response
  if (gasResult.status === 502 || gasResult.body?.error === 'INVALID_UPSTREAM_RESPONSE' || gasResult.body?.error === 'GATEWAY_ERROR') {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_UPSTREAM_RESPONSE', message: 'Respons dari upstream backend tidak valid.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Relational Check & 404: Unauthenticated access to draft, archived, nonexistent, or unpublished project
  if (gasResult.status !== 200 || !gasResult.body?.success || !gasResult.body?.data) {
    return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND', message: 'Media tidak ditemukan.' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  const media = gasResult.body.data;
  const currentEtag = media.etag || `"${media.sha256}"`;

  // 1. Conditional 304 Response:
  // If backend short-circuited or clientEtag matches currentEtag
  const isMatch = clientEtag && (clientEtag === currentEtag || clientEtag === `"${media.sha256}"` || clientEtag === media.sha256);
  if (media.notModified === true || isMatch) {
    return new Response(null, {
      status: 304,
      headers: {
        'ETag': currentEtag,
        'Cache-Control': 'no-cache, must-revalidate',
        'Vary': 'Accept-Encoding, If-None-Match',
      },
    });
  }

  // 2. Binary Verification & Decoding:
  const base64Data = media.base64Data;
  if (!base64Data || typeof base64Data !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_UPSTREAM_RESPONSE', message: 'Payload biner upstream kosong atau tidak valid.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Check payload size ceiling (2.8 MB Base64 string for ~2.0 MB binary)
  if (base64Data.length > 2.8 * 1024 * 1024) {
    return new Response(JSON.stringify({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Ukuran payload media melampaui batas aman 2.0 MB.' }), {
      status: 413,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Check allowed MIME type
  const mimeType = String(media.mimeType || '').toLowerCase();
  if (!ALLOWED_MEDIA_MIME_TYPES.includes(mimeType as any)) {
    return new Response(JSON.stringify({ success: false, error: 'INVALID_CONTENT_TYPE', message: 'Tipe MIME media tidak diizinkan.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  let binaryBytes: Uint8Array;
  try {
    binaryBytes = decodeBase64Binary(base64Data);
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'MALFORMED_BINARY_DATA', message: 'Gagal mendecode payload biner Base64.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Verify decoded size matches sizeBytes if provided
  if (media.sizeBytes && typeof media.sizeBytes === 'number' && binaryBytes.length !== media.sizeBytes) {
    return new Response(JSON.stringify({ success: false, error: 'SIZE_MISMATCH', message: 'Ukuran biner aktual tidak cocok dengan metadata.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Verify SHA-256 integrity
  const computedSha = await computeBinarySha256Hex(binaryBytes);
  if (media.sha256 && computedSha !== media.sha256.toLowerCase().trim()) {
    return new Response(JSON.stringify({ success: false, error: 'INTEGRITY_CHECK_FAILED', message: 'Checksum SHA-256 biner tidak cocok dengan metadata.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Verify Magic Bytes
  if (!verifyBinaryMagicBytes(binaryBytes, mimeType)) {
    return new Response(JSON.stringify({ success: false, error: 'MAGIC_BYTES_MISMATCH', message: 'File biner tidak memiliki tanda tangan magic bytes yang valid.' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
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
      'ETag': `"${computedSha}"`,
      'Cache-Control': 'no-cache, must-revalidate',
      'Vary': 'Accept-Encoding, If-None-Match',
    },
  });
};
