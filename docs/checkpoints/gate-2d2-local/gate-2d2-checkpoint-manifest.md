# SLEEPYKOALA CMS — MANIFEST KRIPTOGRAFIS CHECKPOINT GATE 2D.2
## CRYPTOGRAPHIC CHECKPOINT MANIFEST — GATE 2D.2 LOCAL REMEDIATION

**Checkpoint ID:** `gate-2d2-local-20261101-v1`  
**Tanggal:** 2026-11-01  
**Baseline:** Gate 2D Checkpoint (`gate-2d-test-20261101-v1`)  
**Status Evaluasi:** **IMPLEMENTATION COMPLETE — LOCAL ONLY — PENDING ACCEPTANCE**  
**Algoritma Hash:** SHA-256 (Canonical Upper-case Hex)

---

## 1. TABEL HASH SHA-256 BERKAS INTI GATE 2D.2

| Path Berkas | SHA-256 Checksum | Peran / Deskripsi |
|---|---|---|
| `functions/api/projects.ts` | `A128DF36741BA618E66387FEA0479ECA15411B2CB9D6CD124D5D5A55F6745CC3` | Public projects endpoint (Fail-closed HTTP 503, no-store, no fallback) |
| `functions/api/projects/[slug].ts` | `7BCF24A2AD0C84A8064ED35451768E8E238925C812F7E23329D1F03D3E86FCA6` | Public single project slug resolver (Fail-closed HTTP 503 / Strict 404) |
| `backend/test_gas/Code.gs` | `A3633941899A3CA535493B097B34DF5760D026CF0D9B9299F8BAD720EB9FE1EA` | Apps Script TEST backend with referential cleanup in `handleAdminDeleteMedia` |
| `src/services/projectService.ts` | `ABCF94BEDB041A8721169C2D53358D78D502974143BB6CB46C2546F71288A7BD` | Client service & reactive hook with explicit `isUnavailable` handling |
| `src/pages/HomePage.tsx` | `06B0BFEAC865F87D0F3A97E4DA0DF0F9605C465D9E0E42BF61D0E94D82FAA371` | Dynamic Home page with honest unavailable banner and retry button |
| `src/pages/ProjectsPage.tsx` | `A26B41219389B751AAFA4BAFBB38E2632AE43228392E6A1A5E0F1CFEBD5AD1D1` | Dynamic Projects page with explicit unavailable, empty, and filter states |
| `src/pages/ProjectDetailPage.tsx` | `D4D07510456F8F61F8880E96D93C4BB5B2EC60497F3F7B7456D7F67F20A8FF25` | Dynamic Project detail page separating 503 outage from 404 not found |
| `src/test/cmsGate2DFunctionalAcceptance.test.ts` | `4541669D4CEB5E8CB25EAE2467366185CF5B0C973B2BDA735A0ADF60AD391DFE` | Updated 25 E2E integration acceptance tests with fail-closed assertions |
| `src/test/cmsGate2D2Remediation.test.ts` | `FCE2039C34CBB5E03CCEB64CE516C2FD66E821DE7CB4D6EE00AA56A13573346C` | 29 dedicated unit and mock integration tests for Finding 01 & Finding 03 |
| `src/test/components.test.tsx` | `470A143D1BEC51017A727970A86251554603147FA2DA77BF2F16209005E505A0` | UI component test suite with mock fetch setup |

---

## 2. PERNYATAAN INTEGRITAS

Seluruh berkas yang tertera pada tabel di atas telah melalui validasi kriptografis dan dipastikan tidak mengalami modifikasi yang tidak terotorisasi.
