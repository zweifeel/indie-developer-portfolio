/**
 * ============================================================================
 * SLEEPYKOALA CMS — MEDIA FILE VALIDATION & SECURITY UTILITIES
 * ============================================================================
 */

import { AllowedMimeType, ValidationError } from './types';

export const ALLOWED_MIME_TYPES: readonly AllowedMimeType[] = [
  'image/webp',
  'image/png',
  'image/jpeg',
] as const;

export const MAX_BINARY_SIZE = 2 * 1024 * 1024; // 2,097,152 bytes (2.0 MB)
export const RECOMMENDED_BINARY_SIZE = 1.5 * 1024 * 1024; // 1.5 MB

/**
 * Normalizes input filename to prevent path traversal and special characters.
 */
export function sanitizeFileName(originalName: string, mimeType?: AllowedMimeType): string {
  const extensionMap: Record<AllowedMimeType, string> = {
    'image/webp': 'webp',
    'image/png': 'png',
    'image/jpeg': 'jpg',
  };

  let expectedExt = mimeType ? extensionMap[mimeType] : '';
  if (!expectedExt) {
    const match = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const candidate = match ? match[1].toLowerCase() : '';
    if (['webp', 'png', 'jpg', 'jpeg'].includes(candidate)) {
      expectedExt = candidate === 'jpeg' ? 'jpg' : candidate;
    } else {
      expectedExt = 'webp';
    }
  }

  // Strip path traversal characters (../, ..\, /,\), null bytes, control chars
  const stripped = originalName
    .replace(/\0/g, '')
    .replace(/\.\.+[/\\]*/g, '')
    .replace(/[/\\]+/g, '');

  const base = stripped
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize non-alphanumeric chars
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_+/, '')
    .replace(/_+$/, '')
    .substring(0, 50);

  const cleanBase = base || 'asset';
  return `${cleanBase}.${expectedExt}`;
}

/**
 * Validates Base64 string format and decodes into Uint8Array.
 */
export function decodeBase64Image(base64Str: string): Uint8Array {
  if (!base64Str || typeof base64Str !== 'string') {
    throw new ValidationError('Data gambar Base64 kosong atau tidak valid.', 'EMPTY_PAYLOAD');
  }

  // Strip optional data URI prefix: data:image/xxx;base64,
  const cleanBase64 = base64Str.replace(/^data:image\/[a-z+]+;base64,/, '').trim();

  // Validate base64 charset
  if (!/^[A-Za-z0-9+/=_-]+$/.test(cleanBase64)) {
    throw new ValidationError('Format Base64 mengandung karakter tidak valid.', 'INVALID_BASE64');
  }

  try {
    // Web Standards decoding (browser & worker)
    const normalized = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(normalized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new ValidationError('Gagal mendekode data Base64.', 'MALFORMED_BASE64');
  }
}

/**
 * Inspects raw binary header bytes to verify authentic image file signatures.
 */
export function verifyMagicBytes(bytes: Uint8Array, declaredMime: string): AllowedMimeType {
  const normalizedMime = declaredMime.toLowerCase().trim();

  if (normalizedMime === 'image/svg+xml' || normalizedMime.includes('svg') || normalizedMime.includes('html')) {
    throw new ValidationError('Format SVG dan dokumen HTML dilarang karena risiko keamanan skrip.', 'FORBIDDEN_FORMAT');
  }

  if (ALLOWED_MIME_TYPES.indexOf(normalizedMime as AllowedMimeType) === -1) {
    throw new ValidationError(
      `Tipe MIME ${declaredMime} tidak didukung. Hanya WebP, PNG, dan JPEG yang diizinkan.`,
      'UNSUPPORTED_MIME'
    );
  }

  if (bytes.length < 12) {
    throw new ValidationError('Ukuran data biner terlalu kecil untuk file gambar valid.', 'CORRUPTED_BINARY');
  }

  // 1. WebP: Bytes 0-3 == 'RIFF' (0x52, 0x49, 0x46, 0x46) and Bytes 8-11 == 'WEBP' (0x57, 0x45, 0x42, 0x50)
  if (normalizedMime === 'image/webp') {
    const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (!isRiff || !isWebp) {
      throw new ValidationError('Magic bytes WebP (RIFF/WEBP) tidak cocok. File biner rusak atau bukan WebP asli.', 'INVALID_WEBP_SIGNATURE');
    }
    return 'image/webp';
  }

  // 2. PNG: Bytes 0-7 == 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A
  if (normalizedMime === 'image/png') {
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
    if (!isPng) {
      throw new ValidationError('Magic bytes PNG (\\x89PNG) tidak cocok. File biner rusak atau bukan PNG asli.', 'INVALID_PNG_SIGNATURE');
    }
    return 'image/png';
  }

  // 3. JPEG: Bytes 0-2 == 0xFF, 0xD8, 0xFF (Start of Image)
  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    const isJpegSoi = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isJpegEoi = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    if (!isJpegSoi) {
      throw new ValidationError('Magic bytes JPEG (SOI \\xFF\\xD8\\xFF) tidak cocok. File bukan JPEG asli.', 'INVALID_JPEG_SIGNATURE');
    }
    if (!isJpegEoi) {
      throw new ValidationError('Penanda akhir file JPEG (EOI \\xFF\\xD9) tidak ditemukan. File mungkin terpotong.', 'TRUNCATED_JPEG');
    }
    return 'image/jpeg';
  }

  throw new ValidationError('Tipe MIME tidak dikenali.', 'UNSUPPORTED_MIME');
}

/**
 * Computes deterministic SHA-256 lowercase hex string from binary bytes.
 */
export async function computeSha256Hex(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates complete raw upload payload and returns sanitized metadata + bytes.
 */
export async function validateMediaUpload(
  originalName: string,
  declaredMime: string,
  base64Data: string
): Promise<{
  bytes: Uint8Array;
  mimeType: AllowedMimeType;
  safeName: string;
  sizeBytes: number;
  sha256: string;
  mediaId: string;
}> {
  // 1. Decode Base64
  const bytes = decodeBase64Image(base64Data);

  // 2. Validate Size Ceiling (2.0 MB Hard Limit)
  if (bytes.length > MAX_BINARY_SIZE) {
    throw new ValidationError(
      `Ukuran file (${(bytes.length / 1024 / 1024).toFixed(2)} MB) melebihi batas keras maksimum 2.0 MB.`,
      'PAYLOAD_TOO_LARGE'
    );
  }

  if (bytes.length === 0) {
    throw new ValidationError('File biner kosong (0 bytes).', 'EMPTY_FILE');
  }

  // 3. Verify Magic Bytes & Enforce Strict Whitelist
  const verifiedMime = verifyMagicBytes(bytes, declaredMime);

  // 4. Compute Cryptographic Hash
  const sha256 = await computeSha256Hex(bytes);

  // 5. Generate Safe Filename & Deterministic Media ID
  const safeName = sanitizeFileName(originalName, verifiedMime);
  const mediaId = `med_${sha256.substring(0, 16)}`;

  return {
    bytes,
    mimeType: verifiedMime,
    safeName,
    sizeBytes: bytes.length,
    sha256,
    mediaId,
  };
}
