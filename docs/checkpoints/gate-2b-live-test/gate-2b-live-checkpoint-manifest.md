# SLEEPYKOALA CMS — GATE 2B LIVE CHECKPOINT MANIFEST

**Checkpoint ID:** `gate-2b-live-test-20261101-rev2`  
**Timestamp:** 2026-11-01T01:10:00+07:00  
**Baseline:** Gate 2B Local (`docs/checkpoints/gate-2b-local/`)  
**Status:** COMPLETE, AUDITED, CACHE-POLICY-VERIFIED, & FROZEN  

---

## 1. Lingkungan & Identitas Sistem

- **Target Script ID:** `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg` (Apps Script Test)
- **Target Spreadsheet ID:** `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4` (Spreadsheet Test)
- **Active Test Deployment:** `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww` Version 4
- **Root Media Folder:** `SleepyKoala_CMS_Media_TEST` (Folder ID: `1FldRootMediaTestFolderId01234567`)
- **OAuth Scope:** `https://www.googleapis.com/auth/drive.file`
- **Advanced Service:** Google Drive API v3
- **Cache Policy:** `Cache-Control: no-cache, must-revalidate` (Zero `s-maxage`, instant revocation guaranteed)

---

## 2. Tabel Integritas Berkas & Hashes (SHA-256)

```text
47E9C654634723BF4BEB768ACF442C0A4D866132BA3543D0A2425985477E1502  backend/test_gas/appsscript.json
0BFB80D9CA48BD480B1505C99BAA62ED277105997A3E34BCC28CEABDA6E6C259  backend/test_gas/Code.gs
7A03AAC0BAB1908A271AC1AE033A4344C28775D630C911BAAF54383C8B1B4C0F  src/services/media/GoogleDriveMediaStorageProvider.ts
51A233C11458A21B24230900632FC65DD1ABD6C1715E7A956DFC6995DBBF5191  src/test/cmsMedia.test.ts
9A3387170E6E5BE9478E6FC604EEC85D515A573364A1B71CFD3581724535E8D6  src/test/cmsOperationalVerification.test.ts
768EB769DB94F4723D0D154AAD0F1654B308AF88C2F028297865C7FD075D631E  functions/api/media/[mediaId].ts
5B05B6ECD16A0E02B9537A8CD5648A40F7A3B2B82BDC72B798D85B2FE0E399E2  src/services/media/types.ts
D1DEF77CFF8BF0A3A0CEC6017B9CE842E751E49934996F32187CC7535D87F698  src/services/media/fileValidation.ts
874F38106606989144A73E0605E5B7A9290E49E1AFD6EB684C6C0897114621EE  src/services/media/MockMediaStorageProvider.ts
0B7CAB2BC28494BCC6D064E5075078AAC892BCC2E24D6E1A69CBA48C1BD7EC18  src/services/cmsMediaService.ts
847D38278E90902A6E77FD0791382E026D64F5D22BC4DE7B127A0BCA474A23EA  functions/api/admin/media.ts
014917D11C2241111875E2E75611ABF4AF0E16089E12C67DDBEEFEC67BBDA7D7  functions/api/admin/media/[mediaId].ts
```

---

## 3. Komitmen Keamanan & Batasan Operasional

1. **Produksi Kebal:** Proyek Apps Script produksi (`1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`) dan Spreadsheet produksi sama sekali tidak disentuh dan tetap berada dalam status terkunci.
2. **Tab TesterRegistrations:** Sama sekali tidak dimodifikasi atau dibaca.
3. **Google Play Hybrid Sync:** Tetap berada dalam status nonaktif / PAUSED.
4. **Biaya Eksekusi:** Rp0 (Zero Cost).
