# SLEEPYKOALA CMS — GATE 2B LIVE TEST RESULTS

**Tanggal Pengujian:** 2026-11-01  
**Runner:** Vitest v5.0.5  
**Hasil Keseluruhan:** 12 Test Files Passed (100%), 245 Tests Passed (100%), 0 Failures  

---

## 1. Rincian Pengujian Per Test File

| No | File Pengujian | Jumlah Test | Hasil | Status |
|---|---|---|---|---|
| 1 | `src/test/cmsMedia.test.ts` | 57 | 57 passed | **PASS** |
| 2 | `src/test/adminAuth.test.ts` | 55 | 55 passed | **PASS** |
| 3 | `src/test/cmsCrud.test.ts` | 29 | 29 passed | **PASS** |
| 4 | `src/test/googlePlaySyncIsolated.test.ts` | 23 | 23 passed | **PASS** |
| 5 | `src/test/cmsOperationalVerification.test.ts` | 18 | 18 passed | **PASS** |
| 6 | `src/test/registerTesterFunction.test.ts` | 12 | 12 passed | **PASS** |
| 7 | `src/test/components.test.tsx` | 11 | 11 passed | **PASS** |
| 8 | `src/test/isolatedE2E.test.ts` | 11 | 11 passed | **PASS** |
| 9 | `src/test/cmsPoCIsolated.test.ts` | 10 | 10 passed | **PASS** |
| 10 | `src/test/projectService.test.ts` | 9 | 9 passed | **PASS** |
| 11 | `src/test/RegistrationModal.test.tsx` | 5 | 5 passed | **PASS** |
| 12 | `src/test/registrationService.test.ts` | 5 | 5 passed | **PASS** |
| **TOTAL** | **12 File Pengujian** | **245** | **245 Passed** | **100% PASS** |

---

## 2. Rincian Penegakan Kebijakan Cache Revalidasi (`src/test/cmsOperationalVerification.test.ts` Bagian 4)

| Test Item | Deskripsi Kasus Uji | Durasi | Status |
|---|---|---|---|
| **4.1** | Respons 200 menyertakan `no-cache, must-revalidate` tanpa `s-maxage` | < 15ms | **PASS** |
| **4.2** | Conditional request `If-None-Match` menghasilkan 304 Not Modified saat status PUBLISHED | < 15ms | **PASS** |
| **4.3** | Saat media diarsipkan, browser revalidasi seketika menerima 404 Not Found | < 15ms | **PASS** |
| **4.4 (Regression)** | Klien memegang salinan cache 200 -> media diarsipkan -> permintaan berulang (unconditional & conditional) seketika 404 tanpa stale cache | < 25ms | **PASS** |

---

## 3. Verifikasi Build & Tooling

- **TypeScript (`npx tsc -b`):** 0 error, exit code 0.
- **Linter (`npm run lint`):** 0 error (3 warnings di hook non-media), exit code 0.
- **Production Build (`npm run build`):** Sukses dalam 1.24s, bundle tersimpan di `dist/`.
- **Clasp Test Deployment:** Versi 4 aktif pada deployment `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww`.
