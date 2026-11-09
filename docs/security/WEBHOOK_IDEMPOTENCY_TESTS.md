# SLEEPYKOALA STUDIO — WEBHOOK SECURITY & IDEMPOTENCY TESTS
## Work Package WP-06.3 Test Documentation & Verification Evidence

**Document Version:** 1.0.0  
**Status:** PASS (12/12 Scenarios Verified)  
**Target:** GitHub Webhook Handler (`functions/api/webhook/github.ts`)  
**Associated Automated Tests:** `src/test/securityIntegrationStage6.test.tsx` (Scenarios 25–36 / 36–47 in WP numbering)

---

## 1. Overview & Ingestion Security

The GitHub Webhook integration bridges developer Git push activity with the automated portfolio CMS. Because incoming webhooks originate over the public internet, they represent an entry point that must be shielded with cryptographic verification, strict event/branch filtering, replay prevention (idempotency), and repository boundary enforcement.

### 1.1 Webhook Verification Pipeline
1. **Method & Header Validation:** Only `POST` requests bearing valid `X-GitHub-Event`, `X-GitHub-Delivery`, and `X-Hub-Signature-256` headers are accepted.
2. **HMAC-SHA256 Cryptographic Verification:** Payload raw body is hashed against `GITHUB_WEBHOOK_SECRET` using timing-safe comparison (`crypto.subtle.timingSafeEqual`).
3. **Idempotency Tracker:** GitHub delivery UUIDs (`X-GitHub-Delivery`) are recorded in an in-memory/KV cache (`DeliveryIdTracker`). Subsequent deliveries of the exact same UUID are acknowledged with `HTTP 200 DUPLICATE_DELIVERY` without re-processing.
4. **Branch & Event Filtering:** Only `push` events targeting the configured default branch (e.g. `refs/heads/master` or `refs/heads/main`) are processed. Non-default branches or PR/issue events are skipped immediately.
5. **Repository Allowlist & Freeze Enforcement:**
   - Repositories outside the Stage 3 mapping are rejected with `HTTP 403 Forbidden`.
   - Frozen repositories (e.g. `the-broken-origin` / TBO) are explicitly blocked with `HTTP 403 REPOSITORY_FROZEN`.

---

## 2. Test Scenarios and Results

| Scenario | Objective | Input / Condition | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **Scenario 25** | Valid HMAC-SHA256 Verification | Payload signed with correct secret and valid hex signature | Signature accepted; webhook processed | Verification passed; status HTTP 200 | **PASS** |
| **Scenario 26** | Invalid Signature Rejection | Payload signed with incorrect secret or altered bytes | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'INVALID_SIGNATURE' }` | **PASS** |
| **Scenario 27** | Missing Signature Header | Request missing `X-Hub-Signature-256` header | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'MISSING_SIGNATURE' }` | **PASS** |
| **Scenario 28** | Malformed Signature Format | Header has no `sha256=` prefix (e.g. raw sha1 or bad string) | Returns HTTP 401 UNAUTHORIZED | HTTP 401 `{ error: 'MALFORMED_SIGNATURE' }` | **PASS** |
| **Scenario 29** | Payload Tampering Detection | Valid signature, but payload modified in transit | Returns HTTP 401 UNAUTHORIZED | Timing-safe check fails; HTTP 401 returned | **PASS** |
| **Scenario 30** | Idempotency / Deduplication | Exact same `X-GitHub-Delivery` GUID submitted twice | Second request returns HTTP 200 DUPLICATE | Returns `{ success: true, status: 'DUPLICATE_DELIVERY' }` | **PASS** |
| **Scenario 31** | Unregistered Repository Rejection | Webhook for `AttackerOrg/unknown-rogue-repo` | Returns HTTP 403 FORBIDDEN | HTTP 403 `{ error: 'UNAUTHORIZED_REPOSITORY' }` | **PASS** |
| **Scenario 32** | Frozen Repository Enforcement | Webhook for `SleepyKoala-Studio/the-broken-origin` | Returns HTTP 403 REPOSITORY_FROZEN | HTTP 403 `{ error: 'REPOSITORY_FROZEN' }` | **PASS** |
| **Scenario 33** | Branch Filter Skip | Push to `refs/heads/feature/stage6-test` | Skipped with HTTP 200 `SKIPPED_BRANCH` | HTTP 200 returned; zero CMS mutation | **PASS** |
| **Scenario 34** | Event Filter Skip | Non-push event (e.g. `X-GitHub-Event: issues`) | Skipped with HTTP 200 `SKIPPED_EVENT` | HTTP 200 returned; zero processing | **PASS** |
| **Scenario 35** | Ping Event Handling | GitHub ping event (`zen`, `hook_id`) | Responds with HTTP 200 `PONG` | HTTP 200 `{ message: 'Pong! Webhook configured.' }` | **PASS** |
| **Scenario 36** | Delivery Tracker Memory Bound | High volume of distinct delivery IDs tracked | Bounded capacity; no memory exhaustion | Size capped appropriately via LRU eviction | **PASS** |

---

## 3. Remediation & Hardening Actions Taken

1. **DeliveryIdTracker Boundary Assurance:**
   - Ensured tracker exposes atomic `.acquire(deliveryId)` returning `{ isDuplicate, acquired, error }` with an enforced ceiling on stored delivery tokens.
2. **Frozen Project Guard:**
   - Explicit guard in `functions/api/webhook/github.ts` verifies `isFrozen` status before checking any event details, ensuring blocked repositories cannot trigger background tasks or upstream calls.

---

## 4. Conclusion
All 12 webhook and idempotency test scenarios passed unconditionally. Ingestion is cryptographically authenticated, strictly filtered, idempotent, and resilient against replay attacks.
