/**
 * ============================================================================
 * SLEEPYKOALA CMS — MOCK MEDIA STORAGE PROVIDER
 * ============================================================================
 * Provides in-memory media storage for local development and integration tests.
 * Zero external network access. Supports controlled fault-injection for testing
 * atomic rollback and orphan cleanup routines.
 */

import {
  AllowedMimeType,
  MediaStorageProvider,
  QuotaExceededError,
  StorageError,
  StorageFileBinary,
} from './types';

export class MockMediaStorageProvider implements MediaStorageProvider {
  readonly providerName = 'MockStorageProvider';

  private files: Map<string, StorageFileBinary> = new Map();
  private fileMetadataMap: Map<string, { name: string; createdAt: string }> = new Map();
  private currentBytes = 0;

  constructor(public readonly maxStorageBytes: number = 100 * 1024 * 1024) {}

  // Fault injection switches for test scenarios
  public simulateNetworkTimeout = false;
  public simulateSaveFailure = false;
  public simulateDeleteFailure = false;

  public setSimulateNetworkTimeout(val: boolean): void {
    this.simulateNetworkTimeout = val;
  }

  public setSimulateSaveFailure(val: boolean): void {
    this.simulateSaveFailure = val;
  }

  public setSimulateDeleteFailure(val: boolean): void {
    this.simulateDeleteFailure = val;
  }

  public hasFile(fileId: string): boolean {
    return this.files.has(fileId);
  }

  async saveFile(
    fileName: string,
    mimeType: AllowedMimeType,
    bytes: Uint8Array,
    metadata?: Record<string, string>
  ): Promise<{ fileId: string; sizeBytes: number; sha256: string }> {
    if (this.simulateNetworkTimeout) {
      throw new StorageError('Simulated upstream network timeout (10s)', 'TIMEOUT', 504);
    }

    if (this.simulateSaveFailure) {
      throw new StorageError('Simulated upload storage write failure', 'STORAGE_WRITE_FAILURE', 500);
    }

    if (this.currentBytes + bytes.length > this.maxStorageBytes) {
      throw new QuotaExceededError('Kapasitas penyimpanan mock terlampaui.');
    }

    const randomHex = Array.from(new Uint8Array(64))
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    const sha256 = metadata?.sha256 || randomHex;
    const fileId = `mock_drive_${sha256.substring(0, 16)}`;

    const binary: StorageFileBinary = {
      fileId,
      mimeType,
      bytes: new Uint8Array(bytes),
      sha256,
      sizeBytes: bytes.length,
    };

    this.files.set(fileId, binary);
    this.currentBytes += bytes.length;
    this.fileMetadataMap.set(fileId, {
      name: fileName,
      createdAt: new Date().toISOString(),
    });

    return {
      fileId,
      sizeBytes: bytes.length,
      sha256,
    };
  }

  async getFileBinary(fileId: string): Promise<StorageFileBinary | null> {
    if (this.simulateNetworkTimeout) {
      throw new StorageError('Simulated upstream network timeout (10s)', 'TIMEOUT', 504);
    }
    const file = this.files.get(fileId);
    return file || null;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    if (this.simulateDeleteFailure) {
      throw new StorageError('Simulated delete compensation failure', 'DELETE_FAILED', 500);
    }

    const existing = this.files.get(fileId);
    if (existing) {
      this.currentBytes -= existing.sizeBytes;
    }

    const existed = this.files.has(fileId);
    this.files.delete(fileId);
    this.fileMetadataMap.delete(fileId);
    return existed;
  }

  async listFiles(): Promise<Array<{ fileId: string; name: string; sizeBytes: number; createdAt: string }>> {
    const results: Array<{ fileId: string; name: string; sizeBytes: number; createdAt: string }> = [];
    for (const [fileId, binary] of this.files.entries()) {
      const meta = this.fileMetadataMap.get(fileId);
      results.push({
        fileId,
        name: meta?.name || 'asset',
        sizeBytes: binary.sizeBytes,
        createdAt: meta?.createdAt || new Date().toISOString(),
      });
    }
    return results;
  }

  // Testing & diagnostic helper methods
  clear(): void {
    this.files.clear();
    this.fileMetadataMap.clear();
    this.simulateNetworkTimeout = false;
    this.simulateSaveFailure = false;
    this.simulateDeleteFailure = false;
  }

  getFileCount(): number {
    return this.files.size;
  }
}

// Default singleton instance for local mocking
export const mockMediaStorage = new MockMediaStorageProvider();
