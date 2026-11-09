# SLEEPYKOALA STUDIO — WEBHOOK SECURITY POLICY
## Stage 4: Cryptographic Verification, Access Control & Payload Sanitization Standards

**Document Version:** 1.0.0  
**Status:** Canonical Security Policy  
**Stage:** Stage 4 — GitHub Backend Sync & CI Integration  
**Workspace:** `E:\Antigravity Project\indie-developer-portfolio`  
**License / Cost:** Zero-Cost ($0.00 / Rp 0)

---

## 1. Cryptographic Signature Policy (HMAC-SHA256)

Every incoming HTTP request to `/api/webhook/github` MUST be verified using GitHub's `X-Hub-Signature-256` header before any body payload parsing or downstream processing.

### 1.1 Web Cryptography Standard
- Cloudflare Pages Functions run in the V8 Workers runtime. Signature verification is implemented exclusively via the standardized **Web Cryptography API** (`crypto.subtle.importKey`, `crypto.subtle.sign`).
- Zero Node.js `crypto` dependencies are required, avoiding polyfill overhead and runtime divergence.

### 1.2 Constant-Time Signature Comparison
To eliminate side-channel timing attacks where an attacker infers characters of the valid signature based on comparison latency:
```ts
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
```
Shortcuts, early returns, or character-by-character `===` loops are strictly prohibited.

---

## 2. Fail-Closed Secret Resolution

1. **Mandatory Configuration:** The environment variable `GITHUB_WEBHOOK_SECRET` must be set in the Cloudflare Pages deployment environment.
2. **Missing Secret Behavior:** If `GITHUB_WEBHOOK_SECRET` is missing, empty, or unconfigured, the endpoint immediately aborts with:
   - HTTP Status: `500 Internal Server Error`
   - JSON Body: `{ "success": false, "error": "WEBHOOK_SECRET_UNCONFIGURED" }`
3. **No Default Fallbacks:** The system NEVER falls back to default dummy strings in production mode.

---

## 3. Denial of Service & Size Protection

1. **Pre-read Header Inspection:** If the incoming `content-length` header exceeds `1,048,576 bytes` (1 MB), the request is rejected immediately with HTTP 413 `PAYLOAD_TOO_LARGE`.
2. **Raw Byte Length Inspection:** If the actual byte stream exceeds 1 MB during streaming, ingestion terminates with HTTP 413.
3. **Memory Safeguards:** In-memory idempotency caches utilize fixed-capacity ring sets (max 1,000 entries) to prevent unbounded memory growth.

---

## 4. Repository Access Control, Owner Verification & Stage 3 Alignment

The webhook engine strictly validates incoming repository identity using the **Owner + Repository combination**, aligned with Stage 3 `REPOSITORY_MAPPING.md`:

| Project Slug | Canonical Name | Expected Owner | Expected Repo | Stage 3 Condition | Production Webhook Readiness |
| :--- | :--- | :---: | :--- | :---: | :---: |
| `dompetnalar` | DompetNalar (FinSmart) | `lunachroc07-dot` | `FinSmart` | `VISIBILITY_UNVERIFIED` | 🚫 BLOCKED (Visibility unverified) |
| `indie-developer-portfolio` | SleepyKoala Portfolio | *Configured / Unset* | `indie-developer-portfolio` | `MISSING_REMOTE` | 🚫 BLOCKED (Remote unconfigured) |
| `idle-master` | IDLE MASTER | *None* | `idle-master` | `MISSING_GIT` | 🚫 BLOCKED (No Git initialized) |
| `mobile-kasir` | Mobile Kasir | *None* | `mobile-kasir` | `MISSING_GIT` | 🚫 BLOCKED (No Git initialized) |
| `idle-mining` | Idle Mining | *None* | `idle-mining` | `MISSING_REMOTE` | 🚫 BLOCKED (No remote configured) |
| `worklume` | Worklume | *None* | `worklume` | `MISSING_GIT` | 🚫 BLOCKED (No Git initialized) |
| `the-broken-origin` | TBO ROBLOX | `zweifeel` | `TBO-ROBLOX` | `STRICT_FREEZE` | 🚫 **STRICT FREEZE (HTTP 403)** |

### Strict Owner Verification Rules
1. **Owner + Repo Identity:** Both the repository owner and repository name must be present in the webhook payload and must match the Stage 3 configuration.
2. **Owner Mismatch Rejection:** If a repository name matches an approved project (e.g. `FinSmart`), but the owner is different (e.g. `attacker/FinSmart`), the request is rejected with HTTP 403 `UNAUTHORIZED_REPOSITORY_OWNER`.
3. **Stage 3 Prerequisite Gate:** Repositories lacking a Git repository (`MISSING_GIT`) or lacking a remote (`MISSING_REMOTE`) are rejected in production mode with HTTP 403 `STAGE3_PREREQUISITE_UNMET`.
4. **Strict Freeze on `the-broken-origin`:** In alignment with Stage 1 and Stage 3 policies, `the-broken-origin` (`TBO ROBLOX`) is subject to an unconditional automation freeze. Webhooks targeting TBO are blocked fail-closed with HTTP 403 `REPOSITORY_FROZEN`.

---

## 5. Information Scrubbing & Sanitization Policy

Any commit message, PR title, release summary, or error message destined for progress events or audit logs passes through `sanitizeTextContent`:
1. **Local Paths:** Absolute filesystem paths (e.g. `E:\Antigravity Project\...` or `/home/ubuntu/...`) are replaced with `[INTERNAL_PATH]`.
2. **Embedded Credentials:** URLs containing basic authentication (e.g. `https://user:token@github.com/...`) are scrubbed to `https://***@github.com/...`.
3. **API Keys & Tokens:** Token patterns such as `ghp_...`, `gho_...`, `sk_live_...`, and `api_key = ...` are redacted with `[REDACTED_TOKEN]`.

---

## 6. Idempotency Durability, Instance Boundaries & Production Status

### 6.1 Architectural Idempotency Boundary
The current implementation utilizes an atomic in-memory tracker (`DeliveryIdTracker`) with a 1,000-entry capacity:
- **Intra-Instance Guarantee:** Protects against sequential and concurrent duplicate requests arriving at the same Cloudflare Worker instance.
- **Cross-Instance Limitation:** Cloudflare Pages Functions run across globally distributed V8 isolates. In-memory state is NOT shared across edge points of presence (PoPs) or worker restarts.
- **Delivery Guarantee:** The webhook provides an **AT-LEAST-ONCE** guarantee with local deduplication. It does **NOT** guarantee distributed exactly-once delivery.
- **Storage Failure Fail-Closed:** If delivery ID tracking encounters an error, the webhook terminates with HTTP 500 `IDEMPOTENCY_STORAGE_ERROR` and halts downstream processing.

### 6.2 Production Activation Status
Because persistent, distributed storage (e.g. Cloudflare KV, D1, or Durable Objects) would require additional architecture and paid/free tier quota configurations outside zero-cost parameters:
- **Production Status:** **`BLOCKED_PENDING_PERSISTENT_IDEMPOTENCY`**
- **Activation Prerequisite:** Before production webhook activation, a shared, persistent, and authorized deduplication backend must be provisioned.

