# SLEEPYKOALA CMS — GATE 3 PRODUCTION READINESS & PRE-DEPLOYMENT AUDIT REPORT
**Report Date:** 2026-11-01T06:38:00+07:00  
**Phase:** Gate 3 (Production Readiness & Pre-Deployment Audit)  
**Status:** **APPROVED / READY FOR PRODUCTION DEPLOYMENT**  
**Cost Impact:** **$0.00 / Rp0 (Strict Zero-Cost / Free-Tier Compliance)**  

---

## 1. EXECUTIVE SUMMARY

Gate 3 conducts an exhaustive, multi-dimensional security and operational audit of the SleepyKoala Studio CMS before any production deployment is authorized.

Following the successful completion and freezing of Gate 2D.3 (16 test suites, 339 tests passing, 0 type errors, 0 linter errors, clean production bundle), this audit confirms that the architecture, application code, security boundaries, and operational procedures are fully compliant with production-grade standards under the permanent **Zero-Cost / Free-Tier Lock**.

---

## 2. COMPREHENSIVE SECURITY AUDIT

### 2.1 OTP Authentication & Session Token Management
- **Mechanism:** Dual-token OTP authentication flow. Administrators request a 6-digit OTP sent via `MailApp.sendEmail` to the hardcoded authorized administrative email (`zweifeel@gmail.com`).
- **Cryptographic Signatures:** OTP secrets and session tokens are signed using HMAC-SHA256 with cryptographically strong secrets (`crypto.subtle` on Cloudflare Pages Functions, `Utilities.computeHmacSha256Signature` on Google Apps Script).
- **Session Token Lifespan:** Strict 1-hour expiration (`SESSION_TTL_SECONDS = 3600`). Expired tokens are rejected at the edge with HTTP 401 `INVALID_SESSION`.
- **Timing Attack Resistance:** Constant-time comparison logic is enforced across all token and signature verifications.
- **Brute-Force & Rate Limiting:**
  - Apps Script enforces a maximum of 3 failed attempts before an OTP is invalidated.
  - OTP expiration is set to 5 minutes (`300,000 ms`).
  - Edge rate limiting tracks IP and request frequency.
- **Session Revocation:** Logout increments `sessionVersion` in `CMS_Settings`, instantly invalidating all outstanding session tokens across all devices.

### 2.2 Server-to-Server (M2M) Handshake Security
- **Edge to Upstream Authentication:** Cloudflare Pages Functions and Google Apps Script communicate exclusively via signed M2M requests.
- **Replay Defense:** Every M2M payload includes:
  - `timestamp`: Verified within a 300-second drift tolerance window (`abs(now - timestamp) <= 300`).
  - `nonce`: Unique UUID generated per request to defeat replay attacks.
  - `signature`: HMAC-SHA256 signature covering `action + timestamp + nonce + dataHash`.
- **Secret Separation:** M2M secret (`APPS_SCRIPT_SECRET`) is stored strictly in Cloudflare encrypted environment variables and Apps Script Script Properties. Never checked into source control.

### 2.3 Cross-Site Request Forgery (CSRF) & Origin Defense
- **Custom Header Enforcement:** All state-changing endpoints (`POST`, `PUT`, `DELETE` under `/api/admin/*`) require `X-SleepyKoala-Admin: 1`. Simple cross-site HTML forms cannot supply custom headers.
- **Fetch Metadata:** Verification of `Sec-Fetch-Site` ensures requests originating from `cross-site` contexts are immediately rejected with HTTP 403 `CROSS_SITE_REQUEST_REJECTED`.
- **Origin Validation:** Validates `Origin` header against the expected host.
- **Cookie Security:** Session cookies are configured with `HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=3600`. JavaScript in the browser cannot read the session cookie.

### 2.4 Media Pipeline & Binary Transfer Security
- **File Size Ceiling:** Maximum 2.0MB binary file size (enforced at edge by request length, JSON length, and decoded byte length).
- **MIME Whitelist:** Strictly restricted to `image/webp`, `image/png`, and `image/jpeg`.
- **Magic Bytes Verification:** Binary payloads are validated at the byte level before storage or serving:
  - WebP: `RIFF....WEBP` header signature.
  - PNG: `\x89PNG\r\n\x1a\n` signature.
  - JPEG: `\xFF\xD8\xFF` SOI and `\xFF\xD9` EOI markers.
- **SHA-256 Integrity:** Content hashes are computed and verified before storage.
- **Cascading Referential Integrity:** Permanent media deletion removes all references from `CMS_Projects.screenshots`, `iconUrl`, and `featureGraphicUrl` under `LockService` mutex.

### 2.5 Fail-Closed Public Exposure & Caching Policies
- **Fail-Closed Fallback Privacy:** Public endpoints (`/api/projects`, `/api/projects/:slug`, `/api/media/:mediaId`) never fall back to static local JSON if upstream fails. On backend error/timeout, HTTP 503 is returned with `no-store, no-cache, must-revalidate`.
- **Instant Revocation Cache Policy:** Successful public responses carry `no-cache, must-revalidate` (RFC 9111), allowing conditional revalidation (`ETag` / `If-None-Match` returning 304) while guaranteeing immediate global revocation if an asset or project is unpublished or archived.
- **Admin Cache Policy:** All administrative endpoints enforce `private, no-store, no-cache, must-revalidate`.

### 2.6 Google Drive & Cloud Permissions (Least Privilege)
- **Drive Scope:** Configured exclusively to `https://www.googleapis.com/auth/drive.file`. The application cannot read, modify, or list any user files outside the folders and files it created itself.
- **No Service Account Keys:** No GCP Service Account keys or JSON credentials exist or are required.
- **Isolation:** `TesterRegistrations` tab is completely segregated and untouched by CMS operations.

---

## 3. OPERATIONAL & INFRASTRUCTURE READINESS

### 3.1 Cloudflare Pages Configuration (`wrangler.toml`)
- **Project Name:** `sleepykoala`
- **Output Directory:** `dist`
- **Compatibility Date:** `2026-10-30`
- **Functions:** Located in `functions/` directory, compiled and executed on Cloudflare Pages runtime with edge routing.
- **Environment Variables:**
  - `GAS_WEBAPP_URL`: Production Apps Script Web App URL.
  - `SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET` / `APPS_SCRIPT_SECRET`: M2M handshake secret.
  - `ADMIN_SESSION_SECRET`: Edge HMAC session signing secret.

### 3.2 Production Apps Script Configuration
- **Script ID (Production):** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Execution Mode:** `USER_DEPLOYING`
- **Access Level:** `ANYONE_ANONYMOUS`
- **Advanced Services:** Google Drive API v3 enabled.
- **OAuth Scopes:**
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/script.send_mail`
  - `https://www.googleapis.com/auth/drive.file`

### 3.3 Zero-Cost Compliance Verification
| Resource | Free Tier Limit | Production SleepyKoala Usage | Monthly Cost |
|---|---|---|---|
| Cloudflare Pages | Unlimited requests, 500 builds/month | ~10-20 builds/month, static CDN + Functions | **$0.00** |
| Cloudflare Workers/Functions | 100,000 requests/day | ~100-500 requests/day | **$0.00** |
| Google Apps Script | 20,000 trigger/URL calls/day, 6 min execution limit | ~200-500 calls/day, avg 400ms execution | **$0.00** |
| Google Sheets | 10 million cells | 5 tabs, ~5,000 cells | **$0.00** |
| Google Drive | 15 GB shared free quota | < 100 MB media assets | **$0.00** |
| Gmail MailApp | 100 emails/day | ~5-10 OTP & tester alert emails/day | **$0.00** |
| **Total Cost** | — | — | **$0.00 / Rp0** |

---

## 4. PRE-DEPLOYMENT CHECKLIST & ROLLBACK PROTOCOL

### 4.1 Pre-Deployment Checklist
- [x] All 16 unit, integration, and security test suites passing (339/339 tests).
- [x] TypeScript type checking clean (`npx tsc -b`, 0 errors).
- [x] Linter clean (`npm run lint`, 0 errors).
- [x] Production build generated and verified (`npm run build`, output in `dist/`).
- [x] Working tree clean of secret leaks or sensitive files.
- [x] Backup of existing production Apps Script code secured.
- [x] Clasp authentication verified (`~/.clasprc.json` valid).
- [x] Cloudflare authentication verified (`wrangler whoami` valid).

### 4.2 Rollback Protocol
In the event of an unexpected regression or deployment anomaly:
1. **Cloudflare Pages Rollback:**
   Execute `npx wrangler pages deployment list --project-name=sleepykoala` to identify the prior stable deployment ID, and redeploy or rollback via Cloudflare dashboard or wrangler CLI.
2. **Google Apps Script Rollback:**
   The previous production deployment version (Version 1: `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`) remains pinned and can be reactivated in seconds.
3. **Data Safety Guarantee:**
   `TesterRegistrations` is never altered. The CMS tabs in Google Sheets operate independently.

---

## 5. GATE SIGN-OFF
Gate 3 is officially **APPROVED**. The system is declared **READY FOR CONTROLLED PRODUCTION DEPLOYMENT (GATE 4)**.
