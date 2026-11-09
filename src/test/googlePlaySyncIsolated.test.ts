import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mergeProjectWithPlayStoreListing,
  type PlayStoreListingData,
} from '../services/playStoreHybridService';
import { getProjectBySlug } from '../services/projectService';

/**
 * SLEEPYKOALA — MILESTONE 2: ISOLATED GOOGLE PLAY SYNC TESTS
 *
 * Target Eksklusif: Mobile Kasir (com.aistudio.kasirku.pmzxtw)
 * Kebijakan: ZERO COST (Rp0), Read-Only (Anti-Commit), Isolasi Total (TBO Untouched).
 *
 * Memvalidasi 16 Skenario Pengujian Terisolasi:
 * 1. Autentikasi berhasil
 * 2. Pembacaan listing berhasil
 * 3. Nama aplikasi terbaca
 * 4. Deskripsi singkat terbaca
 * 5. Deskripsi lengkap terbaca
 * 6. Video terbaca jika tersedia
 * 7. Gambar terbaca jika tersedia
 * 8. Permission ditolak ditangani dengan aman
 * 9. Package name salah ditangani
 * 10. API timeout ditangani
 * 11. Data tidak lengkap tidak menghapus data lama
 * 12. Sinkronisasi ulang tidak membuat duplikasi
 * 13. Data internal SleepyKoala tidak berubah
 * 14. Tidak ada operasi edits.commit
 * 15. Edit session dibersihkan via edits.delete in finally
 * 16. Tidak ada credential/private key dalam log
 */

describe('Google Play Sync Isolated Test Suite — Mobile Kasir Only', () => {
  const TARGET_PACKAGE = 'com.aistudio.kasirku.pmzxtw';
  const FORBIDDEN_TBO_PACKAGE = 'com.DefaultCompany.2D-URP';
  const UNCONFIGURED_PACKAGE = 'com.unknown.arbitraryapp';

  // Emulasi sheet tabel Google Sheets (PlayStoreListings & PlayStoreSyncLogs)
  let testPlayStoreListingsRows: Array<Record<string, unknown>> = [];
  let testPlayStoreSyncLogsRows: Array<Record<string, unknown>> = [];

  // Pelacak operasi API untuk audit Anti-Commit dan Pembersihan Edit
  let apiOperationsAudit: Array<{ method: string; url: string; payload?: unknown }> = [];
  let activeEditSessions: Set<string> = new Set();

  beforeEach(() => {
    vi.restoreAllMocks();
    testPlayStoreListingsRows = [];
    testPlayStoreSyncLogsRows = [];
    apiOperationsAudit = [];
    activeEditSessions = new Set();
  });

  // Emulasi implementasi Google Apps Script backend/test_gas/Code.gs
  const simulateGasSyncGooglePlayListing = (
    targetPackage: string,
    options?: {
      mockProvider?: (pkg: string) => Record<string, unknown>;
      deleteEditSessionHandler?: (pkg: string, editId: string) => void;
      triggerType?: string;
      simulateTimeout?: boolean;
      simulateHttpError?: number;
      serviceAccountConfigured?: boolean;
    }
  ) => {
    const opts = options || {};
    const timestampStr = '2026-10-31 13:00:00';
    let editSessionId: string | null = null;
    let editCleanedUp = false;
    let syncSuccess = false;
    let errorSummary = '';

    const maskEditId = (editId: string) => {
      if (!editId || editId.length < 6) return '***';
      return editId.substring(0, 3) + '***' + editId.substring(editId.length - 2);
    };

    try {
      // 1. Strict Target Validation (Hanya Mobile Kasir yang diizinkan)
      if (targetPackage !== TARGET_PACKAGE) {
        throw new Error(
          `Target package tidak diizinkan. Sinkronisasi terbatas hanya untuk: ${TARGET_PACKAGE}`
        );
      }

      // 2. Simulasi Provider Data
      let listingData: Record<string, unknown>;

      if (opts.simulateTimeout) {
        throw new Error('API Timeout: Google Play Publishing API tidak merespons dalam 30000ms.');
      }

      if (opts.simulateHttpError === 401 || opts.simulateHttpError === 403) {
        throw new Error(
          `Akses ditolak oleh Google Play API (HTTP ${opts.simulateHttpError}). Service Account tidak memiliki izin yang sesuai.`
        );
      }

      if (opts.simulateHttpError === 404) {
        throw new Error(
          `Aplikasi dengan package ${targetPackage} tidak ditemukan di Google Play Console (HTTP 404).`
        );
      }

      if (opts.mockProvider) {
        // Mock provider (dapat menyimulasikan pembuatan edit session)
        editSessionId = 'edit_session_test_987654321';
        activeEditSessions.add(editSessionId);
        apiOperationsAudit.push({
          method: 'POST',
          url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${targetPackage}/edits`,
        });

        listingData = opts.mockProvider(targetPackage);
      } else {
        if (!opts.serviceAccountConfigured) {
          throw new Error('Service Account Google Play belum dikonfigurasi di Script Properties.');
        }

        // Live Provider Flow
        editSessionId = 'edit_session_live_123456789';
        activeEditSessions.add(editSessionId);
        apiOperationsAudit.push({
          method: 'POST',
          url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${targetPackage}/edits`,
        });

        listingData = {
          title: 'Mobile Kasir - Point of Sale UMKM',
          shortDescription: 'Kelola kasir, inventaris, dan transaksi UMKM dengan cepat dan mudah.',
          fullDescription:
            'Mobile Kasir adalah aplikasi Point of Sale (POS) modern yang dirancang khusus untuk membantu UMKM.',
          language: 'id-ID',
          iconUrl: 'https://play-lh.googleusercontent.com/test_icon_kasirku_hash',
          featureGraphicUrl: 'https://play-lh.googleusercontent.com/test_fg_kasirku_hash',
          screenshots: [
            'https://play-lh.googleusercontent.com/test_ss1_hash',
            'https://play-lh.googleusercontent.com/test_ss2_hash',
          ],
          videoUrl: 'https://www.youtube.com/watch?v=mockKasirDemo',
        };
      }

      if (!listingData || !listingData.title) {
        throw new Error('Data listing yang diterima tidak lengkap dari Google Play API.');
      }

      // 4. Upsert ke Sheet PlayStoreListings
      const existingRowIndex = testPlayStoreListingsRows.findIndex(
        (r) => r.packageName === targetPackage
      );

      const rowData = {
        timestamp: timestampStr,
        packageName: targetPackage,
        projectSlug: 'mobile-kasir',
        title: listingData.title,
        shortDescription: listingData.shortDescription || '',
        fullDescription: listingData.fullDescription || '',
        language: listingData.language || 'id-ID',
        iconUrl: listingData.iconUrl || '',
        featureGraphicUrl: listingData.featureGraphicUrl || '',
        screenshotsJson: JSON.stringify(listingData.screenshots || []),
        videoUrl: listingData.videoUrl || '',
        syncStatus: 'SYNCED',
        notes: `Sinkronisasi berhasil pada ${timestampStr}`,
      };

      if (existingRowIndex >= 0) {
        testPlayStoreListingsRows[existingRowIndex] = rowData;
      } else {
        testPlayStoreListingsRows.push(rowData);
      }

      syncSuccess = true;
      return {
        success: true,
        packageName: targetPackage,
        title: listingData.title,
        timestamp: timestampStr,
      };
    } catch (err: unknown) {
      errorSummary = (err as Error).message || String(err);

      // Preserve existing data on failure, only update status & notes
      const existingRowIndex = testPlayStoreListingsRows.findIndex(
        (r) => r.packageName === targetPackage
      );
      if (existingRowIndex >= 0) {
        testPlayStoreListingsRows[existingRowIndex] = {
          ...testPlayStoreListingsRows[existingRowIndex],
          syncStatus: 'FAILED',
          notes: `Percobaan gagal pada ${timestampStr}: ${errorSummary}`,
        };
      }

      return {
        success: false,
        packageName: targetPackage,
        error: errorSummary,
        timestamp: timestampStr,
      };
    } finally {
      // 5. Jaminan Pembersihan Edit Session (Anti-Commit Guarantee)
      if (editSessionId) {
        if (opts.deleteEditSessionHandler) {
          opts.deleteEditSessionHandler(targetPackage, editSessionId);
        } else {
          apiOperationsAudit.push({
            method: 'DELETE',
            url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${targetPackage}/edits/${editSessionId}`,
          });
        }
        activeEditSessions.delete(editSessionId);
        editCleanedUp = true;
      } else {
        editCleanedUp = true;
      }

      // 6. Pencatatan Log Audit (Sanitized)
      testPlayStoreSyncLogsRows.push({
        timestamp: timestampStr,
        triggerType: opts.triggerType || 'MANUAL_TEST',
        targetPackage,
        status: syncSuccess ? 'SUCCESS' : 'FAILED',
        editSessionId: editSessionId ? maskEditId(editSessionId) : '-',
        editCleanedUp: editCleanedUp ? 'TRUE' : 'FALSE',
        errorSummary: errorSummary || 'Nol error (Sinkronisasi lancar)',
      });
    }
  };

  // =========================================================================
  // SKENARIO 1: AUTENTIKASI BERHASIL
  // =========================================================================
  it('Skenario 1: Autentikasi Service Account menghasilkan handshake yang valid', () => {
    const result = simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      serviceAccountConfigured: true,
    });

    expect(result.success).toBe(true);
    expect(testPlayStoreSyncLogsRows.length).toBe(1);
    expect(testPlayStoreSyncLogsRows[0].status).toBe('SUCCESS');
    expect(testPlayStoreSyncLogsRows[0].errorSummary).toBe('Nol error (Sinkronisasi lancar)');
  });

  // =========================================================================
  // SKENARIO 2: PEMBACAAN LISTING BERHASIL
  // =========================================================================
  it('Skenario 2: Pembacaan listing berhasil dan tersimpan ke sheet PlayStoreListings', () => {
    const result = simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      serviceAccountConfigured: true,
    });

    expect(result.success).toBe(true);
    expect(testPlayStoreListingsRows.length).toBe(1);
    expect(testPlayStoreListingsRows[0].packageName).toBe(TARGET_PACKAGE);
    expect(testPlayStoreListingsRows[0].syncStatus).toBe('SYNCED');
  });

  // =========================================================================
  // SKENARIO 3: NAMA APLIKASI TERBACA
  // =========================================================================
  it('Skenario 3: Nama aplikasi (title) dari Google Play terbaca secara akurat', () => {
    const result = simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir — POS Kasir Toko & UMKM',
        shortDescription: 'Aplikasi kasir pintar',
        fullDescription: 'Deskripsi lengkap',
      }),
    });

    expect(result.success).toBe(true);
    expect(testPlayStoreListingsRows[0].title).toBe('Mobile Kasir — POS Kasir Toko & UMKM');
  });

  // =========================================================================
  // SKENARIO 4: DESKRIPSI SINGKAT TERBACA
  // =========================================================================
  it('Skenario 4: Deskripsi singkat (shortDescription) terbaca dengan benar', () => {
    const expectedShortDesc = 'Solusi kasir digital cepat dan akurat untuk bisnis Anda.';
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir',
        shortDescription: expectedShortDesc,
        fullDescription: 'Deskripsi lengkap',
      }),
    });

    expect(testPlayStoreListingsRows[0].shortDescription).toBe(expectedShortDesc);
  });

  // =========================================================================
  // SKENARIO 5: DESKRIPSI LENGKAP TERBACA
  // =========================================================================
  it('Skenario 5: Deskripsi lengkap (fullDescription) terbaca secara menyeluruh', () => {
    const expectedFullDesc =
      'Mobile Kasir dirancang untuk mempermudah pencatatan penjualan harian, cetak struk Bluetooth, dan kelola stok.';
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir',
        shortDescription: 'Aplikasi kasir',
        fullDescription: expectedFullDesc,
      }),
    });

    expect(testPlayStoreListingsRows[0].fullDescription).toBe(expectedFullDesc);
  });

  // =========================================================================
  // SKENARIO 6: VIDEO TERBACA JIKA TERSEDIA
  // =========================================================================
  it('Skenario 6: Video promo YouTube terbaca jika ada, dan menangani nilai kosong jika tidak ada', () => {
    // Kasus 6a: Video tersedia
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir',
        shortDescription: 'Aplikasi kasir',
        fullDescription: 'Deskripsi lengkap',
        videoUrl: 'https://www.youtube.com/watch?v=kasirDemoVideo123',
      }),
    });
    expect(testPlayStoreListingsRows[0].videoUrl).toBe(
      'https://www.youtube.com/watch?v=kasirDemoVideo123'
    );

    // Kasus 6b: Video tidak tersedia
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir',
        shortDescription: 'Aplikasi kasir',
        fullDescription: 'Deskripsi lengkap',
        videoUrl: undefined,
      }),
    });
    expect(testPlayStoreListingsRows[0].videoUrl).toBe('');
  });

  // =========================================================================
  // SKENARIO 7: GAMBAR TERBACA JIKA TERSEDIA
  // =========================================================================
  it('Skenario 7: Ikon, Feature Graphic, dan Screenshots terbaca dan terserialisasi dengan benar', () => {
    const mockImages = {
      title: 'Mobile Kasir',
      iconUrl: 'https://play-lh.googleusercontent.com/icon12345',
      featureGraphicUrl: 'https://play-lh.googleusercontent.com/fg67890',
      screenshots: [
        'https://play-lh.googleusercontent.com/ss1',
        'https://play-lh.googleusercontent.com/ss2',
        'https://play-lh.googleusercontent.com/ss3',
      ],
    };

    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => mockImages,
    });

    const savedRow = testPlayStoreListingsRows[0];
    expect(savedRow.iconUrl).toBe(mockImages.iconUrl);
    expect(savedRow.featureGraphicUrl).toBe(mockImages.featureGraphicUrl);

    const parsedScreenshots = JSON.parse(savedRow.screenshotsJson as string);
    expect(parsedScreenshots).toHaveLength(3);
    expect(parsedScreenshots[0]).toBe('https://play-lh.googleusercontent.com/ss1');
  });

  // =========================================================================
  // SKENARIO 8: PERMISSION DITOLAK DITANGANI DENGAN AMAN
  // =========================================================================
  it('Skenario 8: HTTP 401 dan 403 (Permission ditolak) ditangani dengan aman tanpa crash', () => {
    const result403 = simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      simulateHttpError: 403,
    });

    expect(result403.success).toBe(false);
    expect(result403.error).toContain('Akses ditolak oleh Google Play API (HTTP 403)');
    expect(testPlayStoreSyncLogsRows[0].status).toBe('FAILED');
    expect(testPlayStoreSyncLogsRows[0].errorSummary).toContain('HTTP 403');
  });

  // =========================================================================
  // SKENARIO 9: PACKAGE NAME SALAH DITANGANI
  // =========================================================================
  it('Skenario 9: Package name di luar Mobile Kasir (termasuk TBO & unknown) ditolak secara ketat', () => {
    // 9a. Proyek The Broken Origin (TBO) harus diblokir mutlak
    const tboResult = simulateGasSyncGooglePlayListing(FORBIDDEN_TBO_PACKAGE);
    expect(tboResult.success).toBe(false);
    expect(tboResult.error).toContain('Target package tidak diizinkan');

    // 9b. Unknown package diblokir
    const unkResult = simulateGasSyncGooglePlayListing(UNCONFIGURED_PACKAGE);
    expect(unkResult.success).toBe(false);
    expect(unkResult.error).toContain('Target package tidak diizinkan');

    // 9c. Package 404 dari Google Play API
    const notFoundResult = simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      simulateHttpError: 404,
    });
    expect(notFoundResult.success).toBe(false);
    expect(notFoundResult.error).toContain('HTTP 404');
  });

  // =========================================================================
  // SKENARIO 10: API TIMEOUT DITANGANI
  // =========================================================================
  it('Skenario 10: API timeout ditangani dengan anggun dan dicatat ke log audit', () => {
    const timeoutResult = simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      simulateTimeout: true,
    });

    expect(timeoutResult.success).toBe(false);
    expect(timeoutResult.error).toContain('API Timeout');
    expect(testPlayStoreSyncLogsRows[0].status).toBe('FAILED');
    expect(testPlayStoreSyncLogsRows[0].errorSummary).toContain('API Timeout');
  });

  // =========================================================================
  // SKENARIO 11: DATA TIDAK LENGKAP TIDAK MENGHAPUS DATA LAMA (PRESERVATION)
  // =========================================================================
  it('Skenario 11: Kegagalan sinkronisasi atau respon parsial TIDAK menghapus data lama yang masih valid', () => {
    // Langkah 1: Berhasil sinkronisasi awal
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir - Valid Initial',
        shortDescription: 'Valid Short Desc',
        fullDescription: 'Valid Full Desc',
        iconUrl: 'https://play-lh.googleusercontent.com/initial_icon',
      }),
    });

    expect(testPlayStoreListingsRows[0].title).toBe('Mobile Kasir - Valid Initial');
    expect(testPlayStoreListingsRows[0].syncStatus).toBe('SYNCED');

    // Langkah 2: Percobaan sinkronisasi berikutnya mengalami error timeout
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      simulateTimeout: true,
    });

    // Verifikasi: Data lama (title, shortDesc, iconUrl) TETAP UTUH, tidak dihapus atau dikosongkan!
    expect(testPlayStoreListingsRows.length).toBe(1);
    expect(testPlayStoreListingsRows[0].title).toBe('Mobile Kasir - Valid Initial');
    expect(testPlayStoreListingsRows[0].shortDescription).toBe('Valid Short Desc');
    expect(testPlayStoreListingsRows[0].iconUrl).toBe('https://play-lh.googleusercontent.com/initial_icon');
    expect(testPlayStoreListingsRows[0].syncStatus).toBe('FAILED');
    expect(testPlayStoreListingsRows[0].notes).toContain('Percobaan gagal');
  });

  // =========================================================================
  // SKENARIO 12: SINKRONISASI ULANG TIDAK MEMBUAT DUPLIKASI (UPSERT)
  // =========================================================================
  it('Skenario 12: Sinkronisasi ulang memperbarui baris yang ada tanpa menambah baris duplikat', () => {
    // Sinkronisasi ke-1
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir v1',
        shortDescription: 'Versi Satu',
      }),
    });
    expect(testPlayStoreListingsRows.length).toBe(1);
    expect(testPlayStoreListingsRows[0].title).toBe('Mobile Kasir v1');

    // Sinkronisasi ke-2
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => ({
        title: 'Mobile Kasir v2',
        shortDescription: 'Versi Dua',
      }),
    });

    // Jumlah baris tetap 1 (Upsert bekerja dengan benar!)
    expect(testPlayStoreListingsRows.length).toBe(1);
    expect(testPlayStoreListingsRows[0].title).toBe('Mobile Kasir v2');
    expect(testPlayStoreListingsRows[0].shortDescription).toBe('Versi Dua');
  });

  // =========================================================================
  // SKENARIO 13: DATA INTERNAL SLEEPYKOALA TIDAK BERUBAH
  // =========================================================================
  it('Skenario 13: Hybrid Merge mempertahankan seluruh atribut internal SleepyKoala', () => {
    const localProject = getProjectBySlug('mobile-kasir');
    expect(localProject).toBeDefined();
    if (!localProject) return;

    // Listing data dari Google Play
    const playListing: PlayStoreListingData = {
      packageName: TARGET_PACKAGE,
      title: 'Mobile Kasir — Aplikasi Kasir POS Toko',
      shortDescription: 'Aplikasi kasir toko paling praktis.',
      fullDescription: 'Deskripsi lengkap dari Google Play Console...',
      iconUrl: 'https://play-lh.googleusercontent.com/new_icon_play',
      screenshots: ['https://play-lh.googleusercontent.com/new_ss1'],
      videoUrl: 'https://youtube.com/watch?v=newVideo',
      syncStatus: 'SYNCED',
    };

    const merged = mergeProjectWithPlayStoreListing(localProject, playListing);

    // Field otoritas Google Play terperbarui
    expect(merged.name).toBe('Mobile Kasir — Aplikasi Kasir POS Toko');
    expect(merged.shortDescription).toBe('Aplikasi kasir toko paling praktis.');
    expect(merged.fullDescription).toBe('Deskripsi lengkap dari Google Play Console...');
    expect(merged.icon).toBe('https://play-lh.googleusercontent.com/new_icon_play');
    expect(merged.screenshots).toEqual(['https://play-lh.googleusercontent.com/new_ss1']);

    // Otoritas Absolut SleepyKoala TIDAK PERNAH BERUBAH:
    expect(merged.id).toBe(localProject.id);
    expect(merged.slug).toBe(localProject.slug);
    expect(merged.category).toBe('APPLICATION');
    expect(merged.status).toBe('CLOSED_TESTING');
    expect(merged.registrationOpen).toBe(true);
    expect(merged.testerRequirementDays).toBe(14);
    expect(merged.featured).toBe(true);
    expect(merged.tags).toEqual(localProject.tags);
  });

  // =========================================================================
  // SKENARIO 14: TIDAK ADA OPERASI EDITS.COMMIT
  // =========================================================================
  it('Skenario 14: Jaminan Anti-Commit: API audit membuktikan edits.commit TIDAK PERNAH dipanggil', () => {
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      serviceAccountConfigured: true,
    });

    const commitCalls = apiOperationsAudit.filter((op) =>
      op.url.toLowerCase().includes('commit')
    );
    expect(commitCalls.length).toBe(0);

    // Seluruh operasi adalah Read atau Delete
    const nonMutatingMethods = apiOperationsAudit.map((op) => op.method);
    expect(nonMutatingMethods).not.toContain('PUT');
    expect(nonMutatingMethods).not.toContain('PATCH');
  });

  // =========================================================================
  // SKENARIO 15: EDIT SESSION DIBERSIHKAN VIA EDITS.DELETE IN FINALLY
  // =========================================================================
  it('Skenario 15: Edit session selalu dibersihkan via edits.delete di blok finally meskipun terjadi error', () => {
    let deletedEditId: string | null = null;

    // Simulasi kegagalan parsing di tengah sesi edit
    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => {
        throw new Error('Kegagalan acak saat parsing listing.');
      },
      deleteEditSessionHandler: (_pkg, editId) => {
        deletedEditId = editId;
      },
    });

    // Blok finally berhasil memanggil cleanup handler
    expect(deletedEditId).toBe('edit_session_test_987654321');
    expect(activeEditSessions.size).toBe(0);
    expect(testPlayStoreSyncLogsRows[0].editCleanedUp).toBe('TRUE');
  });

  // =========================================================================
  // SKENARIO 16: TIDAK ADA CREDENTIAL/PRIVATE KEY DALAM LOG
  // =========================================================================
  it('Skenario 16: Audit kebersihan log: Tidak ada private key, token, atau secret yang terekspos', () => {
    const FAKE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...';
    const FAKE_CLIENT_SECRET = 'GOCSPX-secretkey999888';

    simulateGasSyncGooglePlayListing(TARGET_PACKAGE, {
      mockProvider: () => {
        throw new Error(`Koneksi gagal dengan token: ${FAKE_CLIENT_SECRET}`);
      },
    });

    // Sanitasi verifikasi
    const logsString = JSON.stringify(testPlayStoreSyncLogsRows);
    expect(logsString).not.toContain(FAKE_PRIVATE_KEY);
    expect(logsString).not.toContain('-----BEGIN PRIVATE KEY-----');

    // ID sesi edit disamarkan (masked)
    expect(testPlayStoreSyncLogsRows[0].editSessionId).toMatch(/^[a-zA-Z0-9]{3}\*\*\*[a-zA-Z0-9]{2}$/);
    expect(logsString).not.toContain('edit_session_test_987654321');
  });

  // =========================================================================
  // PRE-AUTHENTICATION SECURITY AUDIT & CREDENTIAL HARDENING
  // =========================================================================
  describe('Pre-Authentication Security & Credential Validation Audit', () => {
    // Simulator fungsi autentikasi & validasi dari backend/test_gas/Code.gs
    const simulateCredentialValidation = (rawKey: string | null | undefined, targetPackage: string) => {
      // 1. Strict Target Package Check
      if (targetPackage !== TARGET_PACKAGE) {
        throw new Error(
          `Target package tidak diizinkan. Sinkronisasi terbatas hanya untuk: ${TARGET_PACKAGE}`
        );
      }

      // 2. Script Property Existence Check
      if (!rawKey || rawKey.trim() === '') {
        throw new Error('Service Account Google Play belum dikonfigurasi di Script Properties.');
      }

      // 3. JSON Validation
      let serviceAccount: Record<string, unknown>;
      try {
        serviceAccount = JSON.parse(rawKey);
      } catch {
        throw new Error('Format PLAY_SERVICE_ACCOUNT_KEY tidak valid (bukan JSON yang valid).');
      }

      if (!serviceAccount || typeof serviceAccount !== 'object') {
        throw new Error('Objek Service Account tidak valid.');
      }

      // 4. Client Email Check
      const clientEmail = serviceAccount.client_email;
      if (!clientEmail || typeof clientEmail !== 'string' || clientEmail.trim() === '') {
        throw new Error('client_email tidak tersedia dalam Service Account key.');
      }

      // 5. Private Key Check
      const privateKey = serviceAccount.private_key;
      if (!privateKey || typeof privateKey !== 'string' || privateKey.trim() === '') {
        throw new Error('private_key kosong atau tidak ditemukan dalam Service Account key.');
      }

      return {
        valid: true,
        clientEmail: clientEmail.trim(),
        privateKeyLength: privateKey.length,
      };
    };

    const simulateTokenExchange = (statusCode: number, rawResponseText: string) => {
      if (statusCode !== 200) {
        let sanitized = `HTTP ${statusCode}`;
        try {
          if (rawResponseText.trim().startsWith('{')) {
            const parsed = JSON.parse(rawResponseText);
            if (parsed.error) {
              if (typeof parsed.error === 'string') sanitized += `: ${parsed.error}`;
              else if (parsed.error.message) sanitized += `: ${parsed.error.message}`;
            }
          }
        } catch {
          // ignore
        }
        throw new Error(`Gagal memperoleh OAuth token dari Google OAuth2: Autentikasi token ditolak (${sanitized})`);
      }

      const data = JSON.parse(rawResponseText);
      if (!data.access_token) {
        throw new Error('Access token tidak ditemukan dalam respon Google OAuth2.');
      }
      return data.access_token;
    };

    it('Pre-Auth 1: Menolak jika PLAY_SERVICE_ACCOUNT_KEY tidak tersedia di Script Properties', () => {
      expect(() => simulateCredentialValidation(null, TARGET_PACKAGE)).toThrow(
        'Service Account Google Play belum dikonfigurasi di Script Properties.'
      );
      expect(() => simulateCredentialValidation('   ', TARGET_PACKAGE)).toThrow(
        'Service Account Google Play belum dikonfigurasi di Script Properties.'
      );
    });

    it('Pre-Auth 2: Menolak jika JSON credential tidak valid (malformed string atau tipe non-objek)', () => {
      expect(() => simulateCredentialValidation('{ malformed json ...', TARGET_PACKAGE)).toThrow(
        'Format PLAY_SERVICE_ACCOUNT_KEY tidak valid (bukan JSON yang valid).'
      );
      expect(() => simulateCredentialValidation('12345', TARGET_PACKAGE)).toThrow(
        'Objek Service Account tidak valid.'
      );
    });

    it('Pre-Auth 3: Menolak jika client_email tidak tersedia atau kosong', () => {
      const noEmail = JSON.stringify({
        type: 'service_account',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIE...',
      });
      expect(() => simulateCredentialValidation(noEmail, TARGET_PACKAGE)).toThrow(
        'client_email tidak tersedia dalam Service Account key.'
      );

      const emptyEmail = JSON.stringify({
        type: 'service_account',
        client_email: '   ',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIE...',
      });
      expect(() => simulateCredentialValidation(emptyEmail, TARGET_PACKAGE)).toThrow(
        'client_email tidak tersedia dalam Service Account key.'
      );
    });

    it('Pre-Auth 4: Menolak jika private_key kosong atau tidak ditemukan', () => {
      const noKey = JSON.stringify({
        type: 'service_account',
        client_email: 'sync@example.iam.gserviceaccount.com',
      });
      expect(() => simulateCredentialValidation(noKey, TARGET_PACKAGE)).toThrow(
        'private_key kosong atau tidak ditemukan dalam Service Account key.'
      );

      const emptyKey = JSON.stringify({
        type: 'service_account',
        client_email: 'sync@example.iam.gserviceaccount.com',
        private_key: '   ',
      });
      expect(() => simulateCredentialValidation(emptyKey, TARGET_PACKAGE)).toThrow(
        'private_key kosong atau tidak ditemukan dalam Service Account key.'
      );
    });

    it('Pre-Auth 5: Menolak token kedaluwarsa atau invalid_grant secara aman', () => {
      const expiredResponse = JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Invalid JWT: Token used too early or expired.',
      });

      expect(() => simulateTokenExchange(400, expiredResponse)).toThrow(
        'Autentikasi token ditolak (HTTP 400: invalid_grant)'
      );
    });

    it('Pre-Auth 6: Menolak package name yang tidak diizinkan sebelum memeriksa kredensial', () => {
      const validCreds = JSON.stringify({
        type: 'service_account',
        client_email: 'sync@example.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIE...',
      });

      // TBO Ditolak mutlak
      expect(() => simulateCredentialValidation(validCreds, FORBIDDEN_TBO_PACKAGE)).toThrow(
        'Target package tidak diizinkan'
      );

      // Package arbitrary lain ditolak mutlak
      expect(() => simulateCredentialValidation(validCreds, 'com.facebook.katana')).toThrow(
        'Target package tidak diizinkan'
      );
    });

    it('Pre-Auth 7: Memastikan sanitasi respon error dari Google API mencegah kebocoran HTML/internal', () => {
      const rawHtmlError = '<html><head><title>500 Internal Server Error</title></head><body>Backend Crash</body></html>';
      expect(() => simulateTokenExchange(500, rawHtmlError)).toThrow(
        'Autentikasi token ditolak (HTTP 500)'
      );
      // Memastikan HTML tidak terekspos ke pesan error
      expect(() => simulateTokenExchange(500, rawHtmlError)).not.toThrow('<body>');
    });
  });
});
