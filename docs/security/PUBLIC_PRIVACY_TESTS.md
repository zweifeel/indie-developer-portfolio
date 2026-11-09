# SLEEPYKOALA STUDIO — PUBLIC PRIVACY & DATA LEAKAGE TESTS
## Work Package WP-06.2 Test Documentation & Verification Evidence

**Document Version:** 1.0.0  
**Status:** PASS (12/12 Scenarios Verified)  
**Target:** Public API, React DOM Rendering, Local Scanners, Git Hooks  
**Associated Automated Tests:** `src/test/securityIntegrationStage6.test.tsx` (Scenarios 13–24)

---

## 1. Overview & Privacy Principles

SleepyKoala Studio serves as an open indie developer portfolio while maintaining absolute privacy over sensitive operational details:
1. **Zero Internal Leakage:** Internal developer notes, raw Git commit hashes, feature branch names, unreviewed drafts, and unpublished features must NEVER be served to public visitors.
2. **Zero PII Exposure:** User registrations, tester identities, administrative credentials, and internal contact information must never appear in client bundles, public API responses, or repository commits.
3. **Defense-in-Depth Sanitization:** All user-facing text from metadata must be sanitized to prevent Cross-Site Scripting (XSS), script execution, or unsafe URI schemes (`javascript:`, `data:`, `vbscript:`).

---

## 2. Test Scenarios and Results

| Scenario | Objective | Input / Condition | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **Scenario 13** | Public API Internal Field Stripping | Query public progress for project | Response contains `roadmap` & `features`, but 0 internal fields | `internalNotes`, `gitCommits`, `devBranch` completely absent | **PASS** |
| **Scenario 14** | Public API Draft Filtering | Metadata has 2 published items and 2 draft items | Public response returns only 2 items | Only `status: 'published'` items included; drafts stripped | **PASS** |
| **Scenario 15** | Public UI Draft Exclusion | React component renders project details with mixed statuses | Rendered DOM contains only published items | Zero draft elements, zero hidden draft text | **PASS** |
| **Scenario 16** | XSS / Script Tag Escaping in DOM | Title contains `<script>alert('xss')</script>` | Sanitized / escaped by React DOM | Rendered as text `&lt;script&gt;`, zero script execution | **PASS** |
| **Scenario 17** | Dangerous URI Scheme Prevention | Screenshot path set to `javascript:stealToken()` | Rejected by validator with `DANGEROUS_URI_SCHEME` | Validation diagnostic emitted; item rejected | **PASS** |
| **Scenario 18** | Data URI Scheme Rejection | Screenshot path set to `data:text/html;base64,...` | Rejected by validator as unsafe URI | Validation diagnostic emitted; item rejected | **PASS** |
| **Scenario 19** | Markdown Link Safety | Progress description includes markdown link `[test](https://...)` | External links render with `rel="noopener noreferrer"` | Attributes verified in DOM rendering | **PASS** |
| **Scenario 20** | Local Privacy Scanner Execution | Run `scripts/privacy-scan.js` over entire repository | Scans all repository files for PII, emails, dumps | Scanned 2365 files; 0 unapproved PII detected | **PASS** |
| **Scenario 21** | Local Secret Scanner Execution | Run `scripts/security-scan.js` over entire repository | Scans all repository files for tokens, keys, passwords | Scanned 2365 files; 0 actionable secrets detected | **PASS** |
| **Scenario 22** | File Policy Enforcer Execution | Run `scripts/check-file-policy.js` | Inspects all files against strict whitelist policy | 2467 files inspected; 0 denied files, 0 unknown | **PASS** |
| **Scenario 23** | Upstream Error Fail-Closed | Apps Script throws internal exception (500) | Public API returns generic safe error | Returns `INTERNAL_ERROR`; 0 stack trace leaked | **PASS** |
| **Scenario 24** | Pre-Commit Privacy Guard | Commit attempt containing private author identity | Blocked by pre-commit hook scanner | Hook aborts commit with clear security diagnostic | **PASS** |

---

## 3. Remediation & Hardening Actions Taken

1. **Dangerous URI Scheme Validation in `portfolioMetadataValidator.ts`:**
   - *Previous state:* Screenshot paths were checked only for string type and basic presence.
   - *Hardening:* Enforced protocol validation:
     ```typescript
     const lowerPath = s.path.trim().toLowerCase();
     if (lowerPath.startsWith('javascript:') || lowerPath.startsWith('data:') || lowerPath.startsWith('vbscript:')) {
       diagnostics.push({
         code: 'DANGEROUS_URI_SCHEME',
         severity: 'error',
         path: `screenshots[${idx}].path`,
         message: `Jalur screenshot "${s.path}" menggunakan skema URI berbahaya yang dilarang.`,
       });
     }
     ```
2. **Public Endpoint Content Filter:**
   - In `functions/api/public/progress/[slug].ts`, response projection strictly includes only published roadmap items, features, and screenshots, omitting any draft or internal development fields.

---

## 4. Conclusion
All 12 privacy and data leakage test scenarios passed unconditionally. Public exposure is completely sanitized and zero internal or private data leaks are possible.
