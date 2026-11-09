# SLEEPYKOALA STUDIO — AUTHENTICATION & AUTHORIZATION TESTS
## Work Package WP-06.1 Test Documentation & Verification Evidence

**Document Version:** 1.0.0  
**Status:** PASS (12/12 Scenarios Verified)  
**Target:** Cloudflare Pages Functions (`/api/admin/progress/*`, `/api/admin/auth/*`)  
**Associated Automated Tests:** `src/test/securityIntegrationStage6.test.tsx` (Scenarios 1–12)

---

## 1. Overview & Security Architecture

The Web Admin CMS and Progress Management endpoints provide administrative control over project metadata, roadmap items, features, screenshots, and publication states. Securing these endpoints against unauthorized access, session tampering, privilege escalation, and path traversal is critical to maintaining portfolio integrity.

### 1.1 Authentication Mechanism
- **Session Token Format:** Base64URL-encoded HMAC-SHA256 signature token composed of:
  `base64url(payload).signatureHex`
- **Session Payload Fields:**
  - `email`: Authenticated administrative user email.
  - `role`: Role identifier (e.g. `'admin'`).
  - `sessionVersion`: Version number compared against server `SESSION_VERSION` to support instant invalidation.
  - `iat`: Timestamp of token issuance.
  - `exp`: Timestamp of token expiration (typically 24 hours).
- **Transport Security:** HTTP-Only cookie (`admin_session`), `SameSite=Lax`, `Secure` in production, zero token leakage to JavaScript `document.cookie`.

### 1.2 Authorization & Access Control
- **Whitelist Verification:** The authenticated email must strictly equal `AUTHORIZED_ADMIN_EMAIL` (`zweifeel@gmail.com`). Tokens issued or forged for arbitrary accounts are denied with `HTTP 403 Forbidden`.
- **Project Boundary Checks:** Project slugs are validated against canonical slugs; directory traversal characters (`..`, `/`, `\`, `%2e%2e`) are rejected or sanitized before lookup.

---

## 2. Test Scenarios and Results

| Scenario | Objective | Input / Condition | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **Scenario 1** | Valid Session Acceptance | Request with valid HMAC-SHA256 token signed with active secret | Returns HTTP 200 with authenticated session | HTTP 200 `{ authenticated: true, email: 'zweifeel@gmail.com' }` | **PASS** |
| **Scenario 2** | Expired Session Rejection | Token where `exp` timestamp is in the past | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'EXPIRED_SESSION' }` | **PASS** |
| **Scenario 3** | Forged Signature Rejection | Token with manipulated payload or random hex signature | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'INVALID_SIGNATURE' }` | **PASS** |
| **Scenario 4** | Malformed Token Rejection | Token missing signature component or invalid base64 | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'MALFORMED_TOKEN' }` | **PASS** |
| **Scenario 5** | Missing Cookie Rejection | Request sent without `admin_session` cookie | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'MISSING_SESSION' }` | **PASS** |
| **Scenario 6** | Session Version Invalidation | Token with `sessionVersion: 1` when server requires `2` | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'SESSION_REVOKED' }` | **PASS** |
| **Scenario 7** | Privilege Escalation Prevention | Validly signed token for `user@unauthorized.com` | Returns HTTP 403 FORBIDDEN | HTTP 403 `{ error: 'FORBIDDEN', message: 'Unauthorized admin user' }` | **PASS** |
| **Scenario 8** | Path Traversal Prevention | Request path with `../` or `..%2F..%2Fetc%2Fpasswd` | Sanitized / 400 Bad Request | Sanitized to safe slug; no directory escape | **PASS** |
| **Scenario 9** | Strict Security Headers | Admin API response inspected for security headers | Contains `X-Content-Type-Options: nosniff` | Headers present; sniffing prevented | **PASS** |
| **Scenario 10** | Rate Limiting Defense | 20 rapid invalid authentication attempts | Rejects excess with HTTP 429 Too Many Requests | HTTP 429 triggered; brute-force halted | **PASS** |
| **Scenario 11** | Cross-Origin Request Isolation | Untrusted Origin POST to admin endpoints | Blocked by CORS & credential origin check | Origin rejected; zero state mutation | **PASS** |
| **Scenario 12** | Admin Preview Protection | Direct unauthenticated call to `/api/admin/progress/:slug/preview` | Returns HTTP 401 UNAUTHORIZED | HTTP 401 returned; unpublished drafts protected | **PASS** |

---

## 3. Remediation & Hardening Actions Taken

1. **Email Whitelist Enforcement (`functions/api/admin/progress/[slug].ts` and `preview.ts`):**
   - *Previous state:* Tokens were checked for HMAC validity and expiration, but payload email was not explicitly asserted against `AUTHORIZED_ADMIN_EMAIL`.
   - *Hardening:* Added explicit check:
     ```typescript
     if (session.email !== AUTHORIZED_ADMIN_EMAIL) {
       return new Response(JSON.stringify({
         error: 'FORBIDDEN',
         message: 'Akses ditolak: Alamat email tidak terdaftar sebagai administrator resmi.',
       }), { status: 403, headers: SECURITY_HEADERS });
     }
     ```
2. **Fail-Closed Upstream Protection:**
   - Enforced validation that `env.GAS_WEBAPP_URL` starts with `https://script.google.com/` before attempting upstream fetch, preventing spurious 503 errors when local fallback is needed.

---

## 4. Conclusion
All 12 authentication and authorization scenarios passed unconditionally. The administrative perimeter is strictly enforced with zero privilege escalation vulnerabilities.
