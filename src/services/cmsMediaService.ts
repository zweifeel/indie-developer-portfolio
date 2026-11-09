/**
 * ============================================================================
 * SLEEPYKOALA CMS — CLIENT MEDIA SERVICE
 * ============================================================================
 */

import { CmsMediaMetadata, MediaRole, MediaVisibility, UploadMediaResult, AllowedMimeType } from './media/types';
import { verifyMagicBytes, ALLOWED_MIME_TYPES, MAX_BINARY_SIZE } from './media/fileValidation';

const CSRF_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-SleepyKoala-Admin': '1',
};

/**
 * Reads a browser File object as Base64 string
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data url prefix if present
      const base64 = result.replace(/^data:[^;]+;base64,/, '');
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates file MIME type, size limit, and magic bytes signature before upload
 */
export async function validateMediaFileBeforeUpload(file: File): Promise<{
  valid: boolean;
  error?: string;
  message?: string;
}> {
  const rawMime = (file.type || '').toLowerCase();
  if (rawMime.includes('svg') || rawMime.includes('html') || rawMime.includes('xml')) {
    return {
      valid: false,
      error: 'FORBIDDEN_FORMAT',
      message: 'Format SVG dan HTML dilarang karena risiko keamanan skrip.',
    };
  }

  if (rawMime && !ALLOWED_MIME_TYPES.includes(rawMime as AllowedMimeType)) {
    return {
      valid: false,
      error: 'UNSUPPORTED_MIME',
      message: `Tipe MIME ${file.type} tidak didukung. Hanya WebP, PNG, dan JPEG yang diizinkan.`,
    };
  }

  if (file.size > MAX_BINARY_SIZE) {
    return {
      valid: false,
      error: 'PAYLOAD_TOO_LARGE',
      message: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas 2.0 MB.`,
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    verifyMagicBytes(bytes, rawMime || 'image/webp');
  } catch (err: any) {
    return {
      valid: false,
      error: err.code || 'INVALID_SIGNATURE',
      message: err.message || 'Signature biner berkas tidak valid atau rusak.',
    };
  }

  return { valid: true };
}

/**
 * Uploads a media asset to the CMS backend
 */
export async function uploadCmsMedia(
  projectId: string,
  file: File,
  role: MediaRole = 'GALLERY',
  visibility: MediaVisibility = 'DRAFT'
): Promise<UploadMediaResult> {
  try {
    // Client-side pre-validation: format & security check
    const rawMime = (file.type || '').toLowerCase();
    if (rawMime.includes('svg') || rawMime.includes('html') || rawMime.includes('xml')) {
      return {
        success: false,
        error: 'FORBIDDEN_FORMAT',
        message: 'Format SVG dan HTML dilarang karena risiko keamanan skrip.',
      };
    }

    if (rawMime && !ALLOWED_MIME_TYPES.includes(rawMime as AllowedMimeType)) {
      return {
        success: false,
        error: 'UNSUPPORTED_MIME',
        message: `Tipe MIME ${file.type} tidak didukung. Hanya WebP, PNG, dan JPEG yang diizinkan.`,
      };
    }

    // Size check
    if (file.size > MAX_BINARY_SIZE) {
      return {
        success: false,
        error: 'PAYLOAD_TOO_LARGE',
        message: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas 2.0 MB.`,
      };
    }

    const base64Data = await readFileAsBase64(file);

    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: CSRF_HEADERS,
      credentials: 'same-origin',
      body: JSON.stringify({
        projectId,
        fileName: file.name,
        mimeType: file.type || 'image/webp',
        base64Data,
        role,
        visibility,
      }),
    });

    const json = await res.json();
    if (json.success) {
      const media = json.media || json.data?.media;
      if (media) {
        return {
          success: true,
          media,
          publicUrl: json.publicUrl || json.data?.publicUrl || `/api/media/${media.mediaId}`,
          isDuplicate: Boolean(json.isDuplicate ?? json.data?.isDuplicate),
          message: json.message,
        };
      }
    }

    return {
      success: false,
      error: json.error || 'UPLOAD_FAILED',
      message: json.message || 'Gagal mengunggah media.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err.message || 'Terjadi kesalahan jaringan.',
    };
  }
}

/**
 * Fetches all media assets for a given project (or all projects)
 */
export async function fetchProjectMedia(
  projectId: string = '*'
): Promise<{ success: boolean; data?: CmsMediaMetadata[]; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/admin/media?projectId=${encodeURIComponent(projectId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
    });

    const json = await res.json();
    if (json.success) {
      const rawMedia = Array.isArray(json.media)
        ? json.media
        : Array.isArray(json.data?.media)
          ? json.data.media
          : Array.isArray(json.data)
            ? json.data
            : null;

      if (rawMedia !== null) {
        return { success: true, data: rawMedia };
      }
      return {
        success: false,
        error: 'INVALID_RESPONSE_FORMAT',
        message: json.message || 'Format data media yang diterima tidak valid.',
      };
    }
    return { success: false, error: json.error, message: json.message || 'Gagal memuat pustaka media.' };
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

/**
 * Updates media visibility or role
 */
export async function updateMediaStatus(
  mediaId: string,
  visibility?: MediaVisibility,
  role?: MediaRole
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/media', {
      method: 'PUT',
      headers: CSRF_HEADERS,
      credentials: 'same-origin',
      body: JSON.stringify({ mediaId, visibility, role }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

/**
 * Deletes / archives a media asset
 */
export async function deleteCmsMedia(
  mediaId: string,
  permanent: boolean = false
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: CSRF_HEADERS,
      credentials: 'same-origin',
      body: JSON.stringify({ mediaId, permanent }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

/**
 * Replaces an existing media asset by uploading a new file with the target project and role
 */
export async function replaceCmsMedia(
  existingMediaId: string,
  projectId: string,
  file: File,
  role: MediaRole = 'GALLERY',
  visibility: MediaVisibility = 'PUBLISHED'
): Promise<UploadMediaResult> {
  const uploadRes = await uploadCmsMedia(projectId, file, role, visibility);
  if (!uploadRes.success) {
    return uploadRes;
  }
  if (uploadRes.media && uploadRes.media.mediaId !== existingMediaId) {
    await updateMediaStatus(existingMediaId, 'ARCHIVED');
  }
  return uploadRes;
}
