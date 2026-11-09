# SLEEPYKOALA STUDIO — PHASE 0: GAP ANALYSIS & READINESS MATRIX
**Document Reference:** `docs/reports/PHASE_0_GAP_ANALYSIS.md`  
**Milestone:** Phase 0 — Discovery & Baseline Inventory  
**Auditor:** Senior Software Architect, DevSecOps & Platform Auditor  
**Date:** 2026-11-08  
**Scope:** Workstream A Readiness vs Target 14-Step Publishing Architecture  

---

## 1. CATEGORICAL GAP BREAKDOWN

### Category A: Git & Version Control Gaps
- **GAP-A1 (High): Unconfigured Local Git Remote**  
  *Current State:* Running `git remote -v` returns no configured upstream remotes.  
  *Impact:* Prevents automated pushing and GitHub Actions triggering from this local repository.  
  *Remediation:* Set up authenticated HTTPS/SSH remote URL pointing to official SleepyKoala Studio GitHub repository.
- **GAP-A2 (Medium): Untracked Development & Prototype Artifacts**  
  *Current State:* Untracked files exist across `docs/reports/`, `public/assets/`, and `scratch/`.  
  *Impact:* Risk of committing extraneous debug artifacts.  
  *Remediation:* Refine `.gitignore` to explicitly exclude temporary prototype scratch directories.

---

### Category B: Ingestion & Backend Webhook Gaps
- **GAP-B1 (Critical): Missing GitHub Webhook Receiver on Edge Functions**  
  *Current State:* The directory `functions/api/` contains routes for `/projects`, `/register-tester`, `/settings`, and `/admin/*`, but has no `/webhook/github.ts`.  
  *Impact:* Step 10 & 11 of the 14-step pipeline cannot function automatically. Commits pushed to GitHub have no ingestion target.  
  *Remediation:* Build `functions/api/webhook/github.ts` implementing HMAC SHA256 signature verification (`X-Hub-Signature-256`) and relay logic.
- **GAP-B2 (High): Missing Ingestion Handler in Google Apps Script**  
  *Current State:* `backend/gas/Code.gs` handles standard CRUD (`CMS_GET_PROJECTS`, `CMS_SAVE_PROJECT`, etc.) but lacks a dedicated `SYNC_PROGRESS_METADATA` action.  
  *Impact:* Even if Edge receives progress payloads, GAS cannot parse and persist them into separate milestone/feature sheets.  
  *Remediation:* Implement `SYNC_PROGRESS_METADATA` handler in `backend/gas/Code.gs` with transactional batch upsert.

---

### Category C: Metadata & Schema Enforcement Gaps
- **GAP-C1 (Low / Resolved Baseline): Schema v1 Formalized**  
  *Current State:* `src/types/portfolioProgress.ts` and `src/services/portfolioMetadataValidator.ts` are implemented with 347 lines of unit tests.  
  *Impact:* Minor — Core validation logic exists and passes 100% of unit tests.  
  *Remediation:* Maintain schema freeze at v1 during Phase 1.
- **GAP-C2 (Medium): Missing Schema Verification Script in NPM Pipeline**  
  *Current State:* Validation is tested via Vitest, but there is no CLI runner (e.g. `npm run validate:metadata`) for stand-alone execution.  
  *Impact:* Developers cannot run a single pre-commit script to validate project metadata files outside test runs.  
  *Remediation:* Add `scripts/validate-metadata.js` executable via `npm run validate-metadata`.

---

### Category D: CMS & Dual-Storage Integration Gaps
- **GAP-D1 (Medium): CMS Admin UI Lacks Progress Tab**  
  *Current State:* `src/pages/AdminPage.tsx` provides tabs for Projects, Media, Settings, Compliance, and Audit Logs, but lacks a dedicated "Portfolio Progress" approval view.  
  *Impact:* Studio admin must review progress JSON documents manually or rely solely on automated ingestion.  
  *Remediation:* Add a "Progress & Roadmap" sub-view to CMS allowing visual promotion of items from `draft` to `public`.

---

### Category E: Frontend Public Presentation Gaps
- **GAP-E1 (High): Project Detail Page Lacks Progress & Roadmap Component**  
  *Current State:* `src/pages/ProjectDetailPage.tsx` displays metadata factboxes, description, tags, and compliance links, but does not render the `PublicProjectProgress` timeline.  
  *Impact:* Step 14 of the pipeline cannot display data to website visitors.  
  *Remediation:* Build `src/components/ProjectProgressTimeline.tsx` and integrate it below the technical highlights section.

---

### Category F: Security & Compliance Gaps
- **GAP-F1 (Medium): Scanner False-Positives on Temporary Itch.io Scrapes**  
  *Current State:* `scripts/security-scan.js` fails with exit code 1 due to 16-digit game IDs in `scratch/b343/*.html` matching credit card regexes.  
  *Impact:* Running security scans halts local build pipelines unless scratch directory is bypassed.  
  *Remediation:* Update `scripts/security-scan.js` ignore list to exclude `scratch/` while maintaining strict scanning on core source trees.
- **GAP-F2 (Low): Real Screenshot Verification Gate**  
  *Current State:* Schema enforces `verifiedRealApp: boolean`, but verification is self-attested in JSON.  
  *Impact:* Low risk of non-build screenshots being posted.  
  *Remediation:* Establish documentation guidelines in `docs/portfolio/screenshots/README.md`.

---

## 2. PRIORITIZED GAP MATRIX

| Gap ID | Priority | Category | Effort | Risk Level | Target Milestone |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-B1** | Critical | Edge Ingestion | Medium | High | Phase 1 (Pipeline Ingestion) |
| **GAP-B2** | High | GAS Backend | Medium | High | Phase 1 (Pipeline Ingestion) |
| **GAP-E1** | High | Public Presentation | Medium | Medium | Phase 1 (Frontend Mounting) |
| **GAP-A1** | High | Version Control | Low | Medium | Phase 1 (Git Configuration) |
| **GAP-F1** | Medium | DevSecOps Tooling | Low | Low | Phase 1 (Scanner Config) |
| **GAP-C2** | Medium | CLI Tooling | Low | Low | Phase 1 (NPM Scripts) |
| **GAP-D1** | Medium | CMS Admin UI | Medium | Low | Phase 2 (CMS Enhancement) |
| **GAP-A2** | Low | Git Cleanliness | Low | Low | Phase 1 (Maintenance) |
| **GAP-F2** | Low | Compliance Policy | Low | Low | Phase 2 (Documentation) |

---

## 3. PHASE 1 IMPLEMENTATION ROADMAP

```text
PHASE 1 IMPLEMENTATION SEQUENCE:
├── Gate 1.1: Security Scanner Ignore Rule & Scratch Isolation (GAP-F1)
├── Gate 1.2: Cloudflare Edge Webhook Listener (/api/webhook/github.ts) (GAP-B1)
│   ├── HMAC SHA256 Signature Verification
│   ├── Schema Validation & Prohibited Key Filter
│   └── Secret-Masked Audit Logging
├── Gate 1.3: Google Apps Script Progress Sync Handler (GAP-B2)
│   ├── Tabular Schema (Milestones, Features, Screenshots)
│   └── Fail-Closed Draft Status Defaulting
├── Gate 1.4: Standalone Metadata Validation CLI (GAP-C2)
│   └── npm run validate:metadata runner
├── Gate 1.5: Frontend Roadmap & Timeline Presentation (GAP-E1)
│   ├── src/components/ProjectProgressTimeline.tsx
│   └── ProjectDetailPage.tsx integration
└── Gate 1.6: Git Remote Connection & End-to-End Test (GAP-A1)
```
