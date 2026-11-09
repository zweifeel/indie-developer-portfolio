# SLEEPYKOALA CMS — GATE 2B LIVE TEST FILE INVENTORY

**Tanggal Checkpoint:** 2026-11-01  
**Fase:** Gate 2B Live (Google Drive Integration — Test Environment Only)  
**Status Lingkungan:** TEST ACTIVE (`SleepyKoala_Test_Database`)  
**Production Status:** STRICTLY UNTOUCHED & FROZEN  

---

## 1. Berkas Komponen Utama Gate 2B Live

| No | Path Berkas | Peran / Deskripsi | Algoritma & SHA-256 Hash |
|---|---|---|---|
| 1 | `backend/test_gas/appsscript.json` | Manifest Apps Script Test (Drive v3 Advanced Service & OAuth Scopes) | SHA256: `47E9C654634723BF4BEB768ACF442C0A4D866132BA3543D0A2425985477E1502` |
| 2 | `backend/test_gas/Code.gs` | Implementasi Backend GAS Test: Drive API v3 handlers, dual-phase rollback, retry backoff, orphan sweeper | SHA256: `0D45B9F284E2617DDA151ECDF43C87288B0542025D32E13BA0CB662852D60734` |
| 3 | `src/services/media/GoogleDriveMediaStorageProvider.ts` | Adapter Google Drive API v3 live dengan retry backoff, quota handling, dan fail-closed guard | SHA256: `345423A006292165AA194D1C21218F384ED68029160E453BB6E1D7F15CD9FEE0` |
| 4 | `src/test/cmsMedia.test.ts` | Test suite 57 pengujian (42 unit/mock + 15 skenario live operasional & integrasi) | SHA256: `68B4A0FFE0E93D018BC17582EDD66E33858716D2198F8BCC61A5CC27ACF67736` |
| 5 | `src/services/media/types.ts` | Definisi tipe dan error classes (`StorageError`, `QuotaExceededError`, `ValidationError`) | SHA256: `5C70BAEBBE35E5B807B4F932971FA3FD39665F0433E32C9E48858A9CE6572F3E` |
| 6 | `src/services/media/fileValidation.ts` | Validasi biner, verifikasi magic bytes (WebP, PNG, JPEG), sanitasi nama berkas, SHA-256 | SHA256: `4F5C9C8945AEBCDB9CE221F24785501B6B92BC9A648B1C88AC97FF5BA53A0453` |
| 7 | `src/services/media/MockMediaStorageProvider.ts` | Mock provider in-memory untuk pengujian lokal terisolasi & fallback fail-closed | SHA256: `9BFE636C697F4A80D415512DF21BD76E015942465CD629C0FE2D62ECFDE9E62C` |
| 8 | `src/services/cmsMediaService.ts` | Client API service untuk upload, fetch, update status, dan penghapusan media | SHA256: `EE84B4892FA711090BE4ED91054366A1EF8C176378A589EEB3DF16F5E397A537` |
| 9 | `functions/api/admin/media.ts` | Cloudflare Pages Function: Admin media CRUD, CSRF protection, session check | SHA256: `E9ED608F79D404A8A04BC10DCAE02C9C5B26EAE2CD6A5A8E300B70A2D0D194B4` |
| 10 | `functions/api/admin/media/[mediaId].ts` | Cloudflare Pages Function: Admin media preview dengan private `no-store` cache control | SHA256: `1C4ED53CBE5BAF7F138BDCDFF101B2E3E80E384DDFCF98C87F0CF0B308C1D6E5` |
| 11 | `functions/api/media/[mediaId].ts` | Cloudflare Pages Function: Public media proxy dengan strict relational authorization | SHA256: `476FCECEAFE9E3C8B7F5BEF776735EC7DC57159F38E6108170D5FE8AE7FF8784` |

---

## 2. Status Integrasi dan Deployment

- **Target Deployment:** Script ID `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg` (Deployment ID: `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww` Version 3).
- **Spreadsheet Test:** ID `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4` (Tab: `CMS_Media`, `CMS_Projects`, `CMS_AuditLogs`).
- **Production Backend:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` (0% disentuh, 100% aman).
