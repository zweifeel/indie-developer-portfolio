# SLEEPYKOALA STUDIO — STAGE 6 SECURITY TEST PLAN
## Comprehensive Security & Cross-Stage Integration Test Plan

**Document Version:** 1.0.0  
**Status:** APPROVED & EXECUTED  
**Author:** Antigravity Architect & Senior QA / Security Engineer  
**Scope:** Stage 2, Stage 3, Stage 4, Stage 5 cross-boundary verification & hardening  
**Execution Date:** 2026-11-08  
**Zero-Cost Policy:** Strictly Enforced ($0.00 / Rp 0 expenditure)

---

## 1. Executive Summary & Purpose

The purpose of Stage 6 is to provide end-to-end security, boundary, and reliability validation across all integrated modules of SleepyKoala Studio:
1. **Stage 1 & Stage 3:** Repository file policies, local pre-commit/pre-push hooks, secret & privacy scanners, Git automation engine.
2. **Stage 2:** Canonical Progress Metadata Contract (v2 schema, strictly typed, referential integrity).
3. **Stage 4:** GitHub Backend Sync & CI Integration (HMAC-SHA256 signatures, branch restrictions, event filters, deduplication, frozen repository enforcement).
4. **Stage 5:** CMS Integration & Public Project Detail Pages (Admin authentication/authorization, publication state machine, client/server sanitization, draft previews).

Stage 6 consolidates automated test suites and security verification scripts to prove that no privilege escalation, data leakage, denial-of-service, or unhandled failures can compromise SleepyKoala Studio or breach zero-cost guarantees.

---

## 2. Test Architecture & Environment

### 2.1 Test Framework
- **Test Runner:** Vitest v3.x (`vitest run`)
- **Environment:** Node.js (jsdom / happy-dom for React DOM rendering)
- **Type Checker:** TypeScript v5.7 (`tsc -b`)
- **Linter & Scanner:** Oxlint (`oxlint`), Custom AST/Regex Scanners (`check-file-policy.js`, `privacy-scan.js`, `security-scan.js`)

### 2.2 Test Suite Structure
The primary Stage 6 automated suite is implemented in [`src/test/securityIntegrationStage6.test.tsx`](../../src/test/securityIntegrationStage6.test.tsx), comprising **60 dedicated test scenarios** divided into 6 Work Packages:
- **WP-06.1:** Authentication & Authorization Testing (Scenarios 1–12)
- **WP-06.2:** Public Privacy & Data Leakage Testing (Scenarios 13–24)
- **WP-06.3:** Webhook Security & Idempotency Testing (Scenarios 25–36)
- **WP-06.4:** Cross-Stage Integration Testing (Scenarios 37–48)
- **WP-06.5:** State Machine & Concurrency Testing (Scenarios 49–54)
- **WP-06.6:** Failure Recovery & Reliability Testing (Scenarios 55–60)

---

## 3. Work Package Test Specifications

### WP-06.1: Authentication & Authorization Testing
| ID | Area | Objective | Acceptance Criteria |
|---|---|---|---|
| SEC-AUTH-01 | Admin Session | Validate valid HMAC-SHA256 session token | HTTP 200 returned with valid session metadata |
| SEC-AUTH-02 | Admin Session | Reject expired session token (`exp` in past) | HTTP 401 UNAUTHORIZED |
| SEC-AUTH-03 | Admin Session | Reject forged HMAC signature | HTTP 401 UNAUTHORIZED |
| SEC-AUTH-04 | Admin Session | Reject malformed token formats (missing parts) | HTTP 401 UNAUTHORIZED |
| SEC-AUTH-05 | Admin Session | Reject missing session cookies | HTTP 401 UNAUTHORIZED |
| SEC-AUTH-06 | Admin Session | Session version mismatch (revoked session) | HTTP 401 UNAUTHORIZED |
| SEC-AUTH-07 | Privilege Escalation | Non-admin email signed with valid secret | HTTP 403 FORBIDDEN |
| SEC-AUTH-08 | Privilege Escalation | Path traversal in project slug parameter | Rejected / sanitized (no file access) |
| SEC-AUTH-09 | Admin Headers | Response contains strict security headers | `X-Content-Type-Options: nosniff` present |
| SEC-AUTH-10 | Auth Rate Limiting | Brute force session attempts | Blocked after exceeding threshold |
| SEC-AUTH-11 | CSRF & Origin | Rejects cross-origin POST without credentials | SameSite=Lax/Strict isolation enforced |
| SEC-AUTH-12 | Admin Preview | Preview endpoint rejects unauthenticated access | HTTP 401 UNAUTHORIZED |

### WP-06.2: Public Privacy & Data Leakage Testing
| ID | Area | Objective | Acceptance Criteria |
|---|---|---|---|
| SEC-PRIV-01 | Public API | Internal-only fields excluded from public response | `gitCommits`, `internalNotes`, `devBranch` stripped |
| SEC-PRIV-02 | Public API | Draft/Archived items excluded from public query | Only `status: 'published'` items visible |
| SEC-PRIV-03 | Public UI | Draft/Archived items filtered out in public UI | Component renders zero draft elements |
| SEC-PRIV-04 | Public UI | XSS / HTML script tag sanitization in titles/descs | Escaped in React DOM; zero raw HTML execution |
| SEC-PRIV-05 | Public UI | Dangerous URI scheme injection in screenshots | Rejected by validator (`javascript:`, `data:`) |
| SEC-PRIV-06 | Public UI | Markdown link safety (external link rel/target) | `rel="noopener noreferrer"` enforced |
| SEC-PRIV-07 | Scanner | Local privacy scanner checks zero PII | Scans >2300 files with 0 leaks |
| SEC-PRIV-08 | Scanner | Local secret scanner checks zero keys/tokens | Scans >2300 files with 0 actionable secrets |
| SEC-PRIV-09 | File Policy | Local file policy enforcer checks zero denied files | 0 unapproved/denied files in repository |
| SEC-PRIV-10 | Error Handling | Upstream errors never leak stack traces to client | Clean generic error response |
| SEC-PRIV-11 | Telemetry | Zero tracking pixels or third-party cookies | 100% self-hosted zero-cost assets |
| SEC-PRIV-12 | Git Privacy | Hook blocks commit containing private author emails | Privacy scanner pre-commit hook active |

### WP-06.3: Webhook Security & Idempotency Testing
| ID | Area | Objective | Acceptance Criteria |
|---|---|---|---|
| SEC-WH-01 | Signature | Valid HMAC-SHA256 signature verification | Accepted (HTTP 200) |
| SEC-WH-02 | Signature | Invalid HMAC signature | HTTP 401 UNAUTHORIZED |
| SEC-WH-03 | Signature | Missing signature header (`x-hub-signature-256`) | HTTP 401 UNAUTHORIZED |
| SEC-WH-04 | Replay Attack | Delivery ID deduplication (replayed delivery) | HTTP 200 with `DUPLICATE_DELIVERY` |
| SEC-WH-05 | Branch Filter | Push to non-default branch (`feature/x`) | Ignored with HTTP 200 `SKIPPED_BRANCH` |
| SEC-WH-06 | Event Filter | Non-push event (`issues`, `fork`) | Ignored with HTTP 200 `SKIPPED_EVENT` |
| SEC-WH-07 | Repository | Unregistered repository pushed | HTTP 403 / 404 forbidden/unrecognized |
| SEC-WH-08 | Frozen Repo | Pushes to frozen repository (`TBO`) | HTTP 403 `REPOSITORY_FROZEN` |
| SEC-WH-09 | LRU Cache | Delivery cache capacity & evictions | Bounded memory, no OOM |
| SEC-WH-10 | Large Payload | Oversized webhook payload (>1MB) | Rejected before processing |
| SEC-WH-11 | Ping Event | GitHub `ping` event handling | Responded with HTTP 200 `PONG` |
| SEC-WH-12 | Secret Rotation | Support dual/active webhook secrets | Seamless fallback |

### WP-06.4: Cross-Stage Integration Testing
| ID | Area | Objective | Acceptance Criteria |
|---|---|---|---|
| SEC-INT-01 | Stage 2 Contract | Validates canonical progress metadata v2 | 100% compliant schema check |
| SEC-INT-02 | Stage 2 Schema | Invalid item structure rejected by validator | Emits diagnostic errors |
| SEC-INT-03 | Stage 2 Migration | Non-destructive migration from v1 to v2 | Preserves all milestone & feature records |
| SEC-INT-04 | Stage 3 Sync | Safe staging preserves untracked & user index | Rollback does not touch pre-staged files |
| SEC-INT-05 | Stage 3 Quality | Quality runner gates all checks before push | Tests, lint, types, scanners must pass |
| SEC-INT-06 | Stage 4 Mapping | Repository mapping aligns with Stage 3 | Sync info matches official table |
| SEC-INT-07 | Stage 5 Admin | Admin update persists to CMS store | Changes immediately visible in Admin UI |
| SEC-INT-08 | Stage 5 Public | Public detail page loads updated CMS metadata | Public items updated, draft hidden |
| SEC-INT-09 | Stage 5 Cache | ETag/Cache invalidation on CMS update | Stale content purged |
| SEC-INT-10 | Stage 5 Fallback | Local mock fallback when remote unconfigured | Graceful operation without crashes |
| SEC-INT-11 | Referential Check | Events referencing non-existent milestones | Validator detects `BROKEN_RELATIONSHIP` |
| SEC-INT-12 | Slug Consistency | Slug mismatch between URL and document payload | Rejected with `SLUG_MISMATCH` |

### WP-06.5: State Machine & Concurrency Testing
| ID | Area | Objective | Acceptance Criteria |
|---|---|---|---|
| SEC-STATE-01 | Publication | Transition `draft` -> `published` | Success; item marked published |
| SEC-STATE-02 | Unpublication | Transition `published` -> `draft` / `hidden` | Success; removed from public view |
| SEC-STATE-03 | Archive | Transition item to `archived` | Success; read-only state |
| SEC-STATE-04 | Illegal Transition | Invalid state jump (e.g. invalid string) | Rejected by schema validator |
| SEC-STATE-05 | Concurrency | Optimistic locking / version check | Detects concurrent edit conflict |
| SEC-STATE-06 | Batch Update | Atomic update of multiple items | All-or-nothing consistency |

### WP-06.6: Failure Recovery & Reliability Testing
| ID | Area | Objective | Acceptance Criteria |
|---|---|---|---|
| SEC-FAIL-01 | Upstream Down | Apps Script returns 502/503 | Handled fail-closed; clean error |
| SEC-FAIL-02 | Malformed Upstream| Non-JSON string returned by upstream | Handled gracefully; zero uncaught exceptions |
| SEC-FAIL-03 | Timeout | Upstream fetch times out | Aborted safely; client gets clean 504 |
| SEC-FAIL-04 | Network Partition | Client offline | Shows cached/offline state cleanly |
| SEC-FAIL-05 | Missing Config | Env variables absent (`GAS_WEBAPP_URL`) | Operates in safe local fallback |
| SEC-FAIL-06 | Storage Failure | Local storage read/write error | Catches gracefully; fallback to in-memory |

---

## 4. Execution Protocol & Verification Gates
All verification gates must be run in sequence and report zero errors:
1. `npm test` -> All unit and integration test suites pass (Vitest).
2. `npx tsc -b` -> Strict TypeScript typecheck passes with 0 errors.
3. `npm run build` -> Production Vite build succeeds with 0 errors.
4. `npm run lint` -> Oxlint passes with 0 errors.
5. `npm run security:files` -> Repository file policy enforcer passes (0 denied files).
6. `npm run security:privacy` -> Privacy & PII scanner passes (0 unapproved PII).
7. `npm run security:scan` -> Secret & credential scanner passes (0 actionable secrets).
