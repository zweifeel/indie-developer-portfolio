# SLEEPYKOALA CMS — GATE 2C TEST RESULTS

**Tanggal Pengujian:** 2026-11-01  
**Runner:** Vitest v5.0.5  
**Hasil Keseluruhan:** 13 Test Files Passed (100%), 267 Tests Passed (100%), 0 Failures  
**Status:** **100% PASS**

---

## 1. Rincian Pengujian Per Test File

| No | File Pengujian | Jumlah Test | Hasil | Status |
|---|---|---|---|---|
| 1 | `src/test/cmsGate2CBinaryTransfer.test.ts` | 22 | 22 passed | **PASS** |
| 2 | `src/test/cmsMedia.test.ts` | 57 | 57 passed | **PASS** |
| 3 | `src/test/adminAuth.test.ts` | 55 | 55 passed | **PASS** |
| 4 | `src/test/cmsCrud.test.ts` | 29 | 29 passed | **PASS** |
| 5 | `src/test/googlePlaySyncIsolated.test.ts` | 23 | 23 passed | **PASS** |
| 6 | `src/test/cmsOperationalVerification.test.ts` | 18 | 18 passed | **PASS** |
| 7 | `src/test/registerTesterFunction.test.ts` | 12 | 12 passed | **PASS** |
| 8 | `src/test/components.test.tsx` | 11 | 11 passed | **PASS** |
| 9 | `src/test/isolatedE2E.test.ts` | 11 | 11 passed | **PASS** |
| 10 | `src/test/cmsPoCIsolated.test.ts` | 10 | 10 passed | **PASS** |
| 11 | `src/test/projectService.test.ts` | 9 | 9 passed | **PASS** |
| 12 | `src/test/RegistrationModal.test.tsx` | 5 | 5 passed | **PASS** |
| 13 | `src/test/registrationService.test.ts` | 5 | 5 passed | **PASS** |
| **TOTAL** | **13 File Pengujian** | **267** | **267 Passed** | **100% PASS** |

---

## 2. Rincian 22 Kasus Uji Gate 2C Binary Transfer

| Skenario | Deskripsi Kasus Uji | Durasi | Status |
|---|---|---|---|
| **1.1** | Transfer format WebP (100 KB) dengan fidelitas byte-by-byte | < 700ms | **PASS** |
| **1.2** | Transfer format PNG (500 KB) dengan fidelitas byte-by-byte | < 2.0s | **PASS** |
| **1.3** | Transfer format JPEG (1 MB) dengan fidelitas byte-by-byte | < 50ms | **PASS** |
| **1.4** | Transfer berkas ukuran 1.5 MB | < 60ms | **PASS** |
| **1.5** | Transfer berkas mendekati batas 2 MB (~1.95 MB) | < 100ms | **PASS** |
| **1.6** | Menolak upload berkas biner > 2 MB pada admin endpoint dengan HTTP 413 | < 25ms | **PASS** |
| **2.1** | Menolak jika checksum SHA-256 tidak cocok dengan metadata (HTTP 502) | < 10ms | **PASS** |
| **2.2** | Menolak jika Base64 rusak / karakter ilegal (HTTP 502) | < 10ms | **PASS** |
| **2.3** | Menolak jika ukuran biner terdekode berbeda dari sizeBytes (HTTP 502) | < 15ms | **PASS** |
| **2.4** | Menolak tipe MIME palsu (deklarasi WebP tapi byte PNG) dengan HTTP 502 | < 10ms | **PASS** |
| **3.1** | Media DRAFT menghasilkan HTTP 404 (0 byte biner dikirim) | < 5ms | **PASS** |
| **3.2** | Media ARCHIVED menghasilkan HTTP 404 | < 5ms | **PASS** |
| **3.3** | Proyek DRAFT menghasilkan HTTP 404 meskipun media PUBLISHED | < 5ms | **PASS** |
| **3.4** | Admin preview tanpa cookie sesi valid ditolak dengan HTTP 401 | < 5ms | **PASS** |
| **3.5** | Admin preview dengan cookie sesi valid menyajikan biner privat (`private, no-store`) | < 10ms | **PASS** |
| **4.1** | ETag Cocok: Menghasilkan HTTP 304 Not Modified tanpa transmisi biner | < 5ms | **PASS** |
| **4.2** | ETag Berbeda: Menghasilkan HTTP 200 dengan biner baru | < 5ms | **PASS** |
| **4.3** | Pencabutan Seketika: Media diarsipkan, conditional revalidation seketika HTTP 404 | < 5ms | **PASS** |
| **5.1** | Apps Script Timeout (10s) menghasilkan HTTP 504 `UPSTREAM_TIMEOUT` | < 5ms | **PASS** |
| **5.2** | Upstream Drive Rate Limit (429) menghasilkan HTTP 503 `SERVICE_UNAVAILABLE` | < 5ms | **PASS** |
| **5.3** | Respons upstream HTML / Malformed JSON menghasilkan HTTP 502 | < 10ms | **PASS** |
| **5.4** | Response OPTIONS preflight menghasilkan HTTP 204 No Content | < 5ms | **PASS** |

---

## 3. Verifikasi Tooling

- **TypeScript (`npx tsc -b`):** 0 error, exit code 0.
- **Linter (`npm run lint`):** 0 error, exit code 0.
- **Production Build (`npm run build`):** Sukses dalam 2.15s, bundle tersimpan di `dist/`.
- **Clasp Test Deploy:** Deployment Versi 5 aktif pada `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww`.
