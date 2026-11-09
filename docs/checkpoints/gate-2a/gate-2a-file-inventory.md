# SLEEPYKOALA CMS — GATE 2A FILE INVENTORY
**Inventory & Separation of Files across Implementation Gates**

- **Date:** 2026-10-31
- **Status:** COMPLETE & AUDITED

---

## 1. Gate 2A Files (Admin Dashboard & CRUD Engine)

The following files were specifically created or modified as part of **Gate 2A**:

| File Path | Nature | Purpose / Functional Scope |
|:---|:---|:---|
| `src/pages/AdminPage.tsx` | **Created** | Admin dashboard UI component with OTP login, metrics summary cards, project table, reorder controls, project editor modal with live preview, and audit log viewer. |
| `src/services/cmsProjectService.ts` | **Created** | Client-side API layer invoking `/api/admin/projects` (GET, POST, PUT) and `/api/admin/audit-logs` (GET) with CSRF protection and fallback templates. |
| `functions/api/admin/projects.ts` | **Created** | Cloudflare Pages Function proxy handling GET (list), POST (save/upsert), and PUT (reorder) with CSRF and session checks. |
| `functions/api/admin/audit-logs.ts` | **Created** | Cloudflare Pages Function proxy handling GET (audit logs) with session authentication. |
| `src/test/cmsCrud.test.ts` | **Created** | Vitest test suite (29 tests) verifying preflight headers, authentication, CSRF, validation, soft-delete, reorder, and isolation. |
| `src/App.tsx` | **Modified** | Imported `AdminPage` and registered `<Route path="/admin" element={<AdminPage />} />`. |
| `backend/test_gas/Code.gs` | **Modified** | Added CRUD handlers: `handleAdminSaveProject`, `handleAdminReorderProjects`, and `handleAdminGetAuditLogs` protected by `LockService` and `verifyM2mAuth`. |

---

## 2. Segregation from Prior Gates (Gate 1A, 1B, 1C)

To prevent regression or cross-contamination, the files powering prior gates are cataloged separately:

### Gate 1A: Isolated Core Authentication & Anti-Replay
- `functions/api/admin/auth/utils.ts`: Core cryptographic utilities (HMAC-SHA256, session tokens, base64url, CSRF validator, M2M signer `callGasBackend`).
- `functions/api/admin/auth/request-otp.ts`: Pages Function endpoint for administrator OTP dispatch requests.
- `functions/api/admin/auth/verify-otp.ts`: Pages Function endpoint for verifying OTP and issuing `sk_admin_session` cookie.
- `functions/api/admin/auth/session.ts`: Pages Function endpoint for checking session validity.
- `functions/api/admin/auth/logout.ts`: Pages Function endpoint for session clearance and global session revocation.
- `src/services/adminAuthService.ts`: Client-side service managing admin authentication calls.
- `src/test/adminAuth.test.ts`: 55 unit tests covering Gate 1A security mechanics.

### Gate 1B: Test Secret M2M Handshake & Live Probe
- `.dev.vars`: Local development secrets containing `SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET` and `ADMIN_SESSION_SECRET` (strictly excluded from Git).
- `backend/test_gas/.clasp.json`: Test environment Apps Script binding pointing to Script ID `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg`.
- `backend/test_gas/.test_secret`: Local reference marker for test environment secret.

### Gate 1C: Drive Scope Preparation (No Operations)
- `backend/test_gas/appsscript.json`: Manifest configured with `drive.file` OAuth scope and Drive API v3 advanced service definition.
- `backend/test_gas/appsscript.json.bak`: Pre-Gate 1C backup manifest.

---

## 3. Production Environment Separation (Untouched)

The following files represent the production application and have had **ZERO** modifications during Gate 2A:
- `backend/gas/Code.gs` (Production Apps Script backend — Untouched)
- `backend/gas/.clasp.json` (Production script binding: `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` — Untouched)
- `backend/gas/appsscript.json` (Production manifest — Untouched)
- `src/services/playStoreHybridService.ts` (Play Store sync service — Paused)
