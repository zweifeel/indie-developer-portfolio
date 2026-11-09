# SLEEPYKOALA STUDIO — GITHUB INTEGRATION FAILURE RECOVERY
## Stage 4: Runbook for Webhook, M2M Sync & CI Pipeline Failure Scenarios

**Document Version:** 1.0.0  
**Status:** Canonical Runbook & Failure Recovery Guide  
**Stage:** Stage 4 — GitHub Backend Sync & CI Integration  
**Workspace:** `E:\Antigravity Project\indie-developer-portfolio`  
**License / Cost:** Zero-Cost ($0.00 / Rp 0)

---

## 1. Overview & Resilience Model

The GitHub backend sync and CI infrastructure operates on a **fail-closed security model** combined with **fail-safe operational degradation**:
- Security checks fail closed (unauthorized requests and untracked repositories are immediately blocked).
- Transient upstream outages (such as Google Apps Script rate limits or temporary network timeouts) degrade safely: the webhook acknowledges event ingestion without crashing and records audit warnings.

---

## 2. Failure Scenarios & Troubleshooting Runbook

### Scenario A: Webhook Signature Mismatch (HTTP 401 `INVALID_SIGNATURE`)
- **Symptoms:** GitHub Webhook delivery dashboard shows red "401 Unauthorized" with body `{"error": "SIGNATURE_MISMATCH"}`.
- **Root Causes:**
  1. The secret entered in GitHub Webhook settings does not match `GITHUB_WEBHOOK_SECRET` in Cloudflare Pages environment variables.
  2. The webhook payload was modified by an intermediate proxy.
- **Remediation Steps:**
  1. Go to GitHub Repository -> Settings -> Webhooks.
  2. Update the Webhook Secret to match the configured secret in Cloudflare Pages.
  3. Ensure Content Type is set to `application/json`.
  4. Click "Redeliver" on the failed delivery in GitHub.

---

### Scenario B: Webhook Secret Unconfigured (HTTP 500 `WEBHOOK_SECRET_UNCONFIGURED`)
- **Symptoms:** GitHub Webhook delivery returns HTTP 500.
- **Root Causes:** `GITHUB_WEBHOOK_SECRET` is missing or empty in the runtime environment.
- **Remediation Steps:**
  1. In Cloudflare Dashboard -> Pages -> Settings -> Environment Variables, add `GITHUB_WEBHOOK_SECRET`.
  2. For local testing, add `GITHUB_WEBHOOK_SECRET` to local test environment variables.
  3. Redeliver webhook event from GitHub.

---

### Scenario C: Repository Frozen Blocked (HTTP 403 `REPOSITORY_FROZEN`)
- **Symptoms:** Webhook returns HTTP 403 with `{"error": "REPOSITORY_FROZEN"}`.
- **Root Causes:** An automated webhook was triggered by `the-broken-origin` (`TBO ROBLOX`).
- **Policy Enforcement:** This is **intentional by design**. TBO is subject to a strict freeze under repository isolation rules.
- **Remediation Steps:**
  1. Do NOT unblock TBO.
  2. Remove or disable the webhook on the TBO repository if automated syncing is not desired.

---

### Scenario D: Upstream Apps Script Timeout or Parse Failure
- **Symptoms:** Webhook returns HTTP 200 with `upstreamStatus: "UPSTREAM_FAILED_NON_BLOCKING"`.
- **Root Causes:** Google Apps Script consumer quota exceeded, Apps Script execution timed out (>10s), or deployment ID changed.
- **Fail-Safe Mechanism:** The Cloudflare Pages Function does NOT return HTTP 500 to GitHub, preventing GitHub from disabling the webhook after repeated delivery failures.
- **Remediation Steps:**
  1. Check Google Apps Script Executions log in Google Cloud / Apps Script editor.
  2. Verify that `GAS_WEBAPP_URL` and `APPS_SCRIPT_SECRET` in Cloudflare Pages match the active Apps Script deployment.
  3. Check Google Drive / Sheets quota usage.

---

### Scenario E: GitHub Actions CI Quality Gate Failure
- **Symptoms:** Pull request or push to master receives red "X" failure from GitHub Actions `quality-gates` job.
- **Root Causes:**
  1. Step 4 failure: An unapproved file format or keystore was committed (`security:files`).
  2. Step 5 failure: Unmasked PII or dummy card number detected (`security:privacy`).
  3. Step 6 failure: Dummy secret token detected (`security:scan`).
  4. Step 7 failure: Vitest test broke (`npm test`).
  5. Step 8 failure: TypeScript type error (`npx tsc -b`).
- **Remediation Steps:**
  1. Inspect the specific failing step log in the GitHub Actions run details.
  2. Reproduce the failure locally:
     ```bash
     npm run security:files
     npm run security:privacy
     npm run security:scan
     npm test
     npx tsc -b
     ```
  3. Fix the local source code or remove the unapproved file.
  4. Push the fix to re-trigger CI quality gates.
