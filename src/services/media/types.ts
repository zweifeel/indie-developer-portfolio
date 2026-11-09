/**
 * ============================================================================
 * SLEEPYKOALA CMS — MEDIA STORAGE PROVIDER TYPES & CONTRACTS
 * ============================================================================
 */

export type AllowedMimeType = 'image/webp' | 'image/png' | 'image/jpeg';
export type MediaRole = 'ICON' | 'FEATURE_GRAPHIC' | 'SCREENSHOT' | 'GALLERY';
export type MediaVisibility = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CmsMediaMetadata {
  mediaId: string;           // Formatted: med_[a-f0-9]{16}
  projectId: string;         // Slug or ID of the parent project
  driveFileId: string;       // Provider-specific file identifier
  originalName: string;      // User-submitted filename (< 100 chars)
  safeName: string;          // Normalized alphanumeric filename
  mimeType: AllowedMimeType; // Verified MIME type
  sizeBytes: number;         // Binary length in bytes (<= 2,097,152)
  sha256: string;            // 64-character lowercase hex digest
  role: MediaRole;           // Functional asset role
  visibility: MediaVisibility; // DRAFT | PUBLISHED | ARCHIVED
  uploadedAt: string;        // ISO 8601 UTC timestamp
  uploadedBy: string;        // Administrator email
  updatedAt?: string;        // Last status update timestamp
}

export interface UploadMediaInput {
  projectId: string;
  originalName: string;
  mimeType: string;
  base64Data: string;
  role?: MediaRole;
  visibility?: MediaVisibility;
}

export interface UploadMediaResult {
  success: boolean;
  media?: CmsMediaMetadata;
  publicUrl?: string;
  error?: string;
  message?: string;
  isDuplicate?: boolean;
}

export interface StorageFileBinary {
  fileId: string;
  mimeType: AllowedMimeType;
  bytes: Uint8Array;
  sha256: string;
  sizeBytes: number;
}

export interface PublicMediaResponse {
  notModified: boolean;
  mediaId: string;
  safeName?: string;
  mimeType?: AllowedMimeType;
  sizeBytes?: number;
  sha256: string;
  etag: string;
  base64Data?: string;
  visibility: MediaVisibility;
}

/**
 * Custom Error Classes for Storage Provider
 */
export class StorageError extends Error {
  constructor(message: string, public code: string, public status: number = 500) {
    super(message);
    this.name = 'StorageError';
  }
}

export class QuotaExceededError extends StorageError {
  constructor(message: string = 'Kapasitas penyimpanan atau kuota request terlampaui.') {
    super(message, 'STORAGE_QUOTA_EXCEEDED', 429);
    this.name = 'QuotaExceededError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Standard Storage Provider Contract
 */
export interface MediaStorageProvider {
  readonly providerName: string;

  /**
   * Save a binary file to storage
   */
  saveFile(
    fileName: string,
    mimeType: AllowedMimeType,
    bytes: Uint8Array,
    metadata?: Record<string, string>
  ): Promise<{ fileId: string; sizeBytes: number; sha256: string }>;

  /**
   * Retrieve binary stream of an existing file
   */
  getFileBinary(fileId: string): Promise<StorageFileBinary | null>;

  /**
   * Permanently delete a file from storage (Compensation / Rollback / Lifecycle)
   */
  deleteFile(fileId: string): Promise<boolean>;

  /**
   * List all stored files for orphan reconciliation
   */
  listFiles(): Promise<Array<{ fileId: string; name: string; sizeBytes: number; createdAt: string }>>;
}
