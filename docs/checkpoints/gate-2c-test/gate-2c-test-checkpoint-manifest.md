# SLEEPYKOALA CMS — GATE 2C TEST CHECKPOINT MANIFEST

**Checkpoint ID:** `gate-2c-test-20261101-v5`  
**Timestamp:** 2026-11-01T02:15:00+07:00  
**Baseline:** Gate 2B Live TEST (`gate-2b-live-test-20261101-rev2`)  
**Status:** **COMPLETE, AUDITED, VERIFIED, & FROZEN**  

---

## 1. Identitas Lingkungan Sistem

- **Target Script ID:** `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg` (Apps Script TEST)
- **Target Spreadsheet ID:** `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4` (Spreadsheet TEST)
- **Active Test Deployment:** `AKfycbxkvhdjjdD-CJXjChVqzE4tANNdGaAwy1MVWBhc2H4m_EQjLS2qEcYTHk2esYecqgz1Ww` Version 5
- **OAuth Scope:** `https://www.googleapis.com/auth/drive.file`
- **Advanced Service:** Google Drive API v3
- **Root Folder:** `SleepyKoala_CMS_Media_TEST` (ID: `1FldRootMediaTestFolderId01234567`)
- **Cache Policy:** `Cache-Control: no-cache, must-revalidate` (Zero `s-maxage`, instant revocation)
- **Zero-Cost Status:** ABSOLUTE ZERO COST (No billing account, no cards, hard-capped fail-closed)

---

## 2. Tabel Integritas Berkas & Hashes (SHA-256)

```text
47E9C654634723BF4BEB768ACF442C0A4D866132BA3543D0A2425985477E1502  backend/test_gas/appsscript.json
876F8C509C9AA13F86C1146389341C2AEC39ECF1CC6630FB272BFD58E8089F6B  backend/test_gas/Code.gs
F4900DFEE74EF34E2DC5ED2F36E55E788B7273D03043ACE0945D98926DBB2878  functions/api/media/[mediaId].ts
37DDA797A7CAC9FEBAD4693DD1D35092277EB6B73D586EBAC433974A335A85E5  functions/api/admin/media/[mediaId].ts
D3EBA15887150EF2732433AA17FF001BE7ADAAA8FA65AE1728C3183FE91C96CA  functions/api/admin/auth/utils.ts
CA8D522A5ADDF219F0C8215180ADC88C2453771B84B259E6307FCE13CD7CBA7B  src/services/media/types.ts
9CDC2EF80D8A3D78DFE52FC3928A60D691EBC9BE3A5FDD885AD0F3BDB52A6211  src/test/cmsGate2CBinaryTransfer.test.ts
409CE7FDE6DFE43DB07D5C2B5863243F0E01C3775EB5A7584F4144079699C081  src/test/cmsMedia.test.ts
021C6381E93AD987124E4BAC4AF2A54672F4704A5EE4064A856AEA0A77DDBA53  src/test/cmsOperationalVerification.test.ts
```

---

## 3. Batasan Mutlak & Konfirmasi Lingkungan Produksi

1. **Production Apps Script:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` (TERKUNCI & TIDAK DISENTUH).
2. **Production Spreadsheet & TesterRegistrations:** TIDAK PERNAH DIUBAH/DIBACA.
3. **Google Play Hybrid Sync:** Tetap PAUSED.
4. **The Broken Origin:** Subdomain & project terisolasi dan tidak tersentuh.
5. **Biaya Eksekusi:** Rp0 (Zero Cost Mutlak).
