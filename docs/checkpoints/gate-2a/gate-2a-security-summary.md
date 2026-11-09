# SLEEPYKOALA CMS — GATE 2A SECURITY AUDIT SUMMARY
**Security Architecture, Defenses, and Verification Bounds**

- **Date:** 2026-10-31
- **Status:** AUDITED & VERIFIED (PASS)

---

## 1. Security Architecture Summary

```
[ Browser Client ]
        │
        ▼ (HTTPS + X-SleepyKoala-Admin: 1 + SameSite=Strict HttpOnly Cookie)
[ Cloudflare Pages Functions Proxy ]
        │
        ▼ (Upstream HTTPS + Signed M2M HMAC-SHA256 + Anti-Replay Nonce)
[ Google Apps Script Web App (Test Container) ]
        │
        ▼ (LockService + Fail-Closed Validation)
[ Google Sheets Database (CMS_Projects, CMS_AuditLogs) ]
```

---

## 2. Security Controls Analysis

### 2.1. Cross-Site Request Forgery (CSRF)
- **Preflight Enforcer:** Inclusion of mandatory custom header `X-SleepyKoala-Admin: 1` triggers browser-level CORS preflight for all cross-origin requests, blocking automated simple-request ambient credential submission.
- **W3C Fetch Metadata:** Evaluates `Sec-Fetch-Site`. Requests marked as `'cross-site'` are rejected with `403 CROSS_SITE_REQUEST_REJECTED`.
- **Origin Validation:** If an `Origin` header is present, its hostname must match the destination `Host`. Cross-origin mismatches return `403 ORIGIN_MISMATCH`.
- **Cookie Confinement:** `sk_admin_session` cookie carries `SameSite=Strict; HttpOnly; Secure; Path=/api/admin`.

### 2.2. HMAC Signatures & Machine-to-Machine (M2M) Handshake
- **Canonical Request Format:** `METHOD:PATH:TIMESTAMP:NONCE:BODY_HASH`.
- **HMAC-SHA256:** Computed with `SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET`.
- **Web-Safe Encoding:** Standard base64 web-safe encoding with `=` padding preserved for exact match across Cloudflare and Google Apps Script (`Utilities.computeHmacSha256Signature`).

### 2.3. Anti-Replay Protection
- Every M2M request includes a unique cryptographically random 16-byte hex `nonce` and a millisecond `timestamp`.
- Apps Script checks the nonce against `ScriptProperties` under `LockService.getScriptLock().tryLock(10000)`. Re-used nonces are immediately rejected (`NONCE_REUSED`).
- Timestamps exceeding ±60,000ms from the server clock are rejected (`REQUEST_EXPIRED`).

### 2.4. Session Revocation & Invalidation
- Each issued session token contains `sessionVersion: number`.
- Apps Script maintains `ADMIN_SESSION_VERSION` in `ScriptProperties`.
- Every admin write or read operation verifies that the token's `sessionVersion` matches the active server version.
- Calling `POST /api/admin/auth/logout` with `{ revokeAll: true }` increments the version, revoking all existing sessions across all browsers.

### 2.5. CRUD Soft-Delete & Data Protection
- **No Hard Delete:** The CMS API does not expose a hard row delete method.
- **Archiving as Soft-Delete:** Transitioning a project to `ARCHIVED` updates its `publishState` column in place, retaining all data (slug, descriptions, screenshots, technical highlights, capabilities).
- **Public Concealment:** Public visitors cannot see `ARCHIVED` or `DRAFT` projects (`handleCmsGetProjects` filters for `publishState === "PUBLISHED"`).
- **Restoration:** An administrator can toggle an archived project back to `DRAFT` or `PUBLISHED` at any time.

### 2.6. Database & Tab Isolation
- Target spreadsheet is strictly container-bound to `SleepyKoala_Test_Database` (`1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4`).
- Only `CMS_Projects` and `CMS_AuditLogs` are accessed.
- `TesterRegistrations` and Play Store Sync tabs are unreferenced and isolated.

---

## 3. Scope Boundaries & Unverified Items (Deferred to Gate 2B)

The following items are outside the scope of Gate 2A and have **NOT** been executed or verified live:
1. **Google Drive API Live Operations:** Uploading images, binary streaming, and Drive folder creation were **NOT** performed in Gate 2A. They are deferred to Gate 2B pending explicit authorization.
2. **Apps Script Live Deployment of Gate 2A:** Code has been audited and verified locally; `clasp push` to deployment `@2` was not executed under Gate 2A.
3. **Production Migration:** Production Apps Script (`backend/gas/Code.gs`) remains un-migrated and completely untouched.
