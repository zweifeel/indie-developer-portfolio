# SLEEPYKOALA STUDIO — REPOSITORY MAPPING REFERENCE
## Stage 3: Multi-Project Mapping, Visibility & Push Eligibility Matrix
**Document Version:** 1.0.0  
**Status:** Canonical Configuration Reference  
**Stage:** Stage 3 — Controlled Auto Commit & Push  
**Workspace:** `E:\Antigravity Project\indie-developer-portfolio`  
**License / Cost:** Zero-Cost ($0.00 / Rp 0)

---

## 1. Overview & Project Mapping Policy

SleepyKoala Studio maintains distinct local directory trees and GitHub repositories for its indie portfolio, commercial tools, mobile apps, and game projects. To ensure strict isolation and avoid accidental cross-project Git pollution, the Git Automation Engine enforces an explicit mapping configuration in `scripts/git-automation/config.js`.

### Mapping Principles
1. **Explicit Root Binding:** Each project is bound to a verified local directory path. Actions targeting a project will verify the disk root before running any Git command.
2. **Path Isolation:** Files belonging to Project A cannot be committed to Project B. Cross-project commits are rejected.
3. **Fail-Closed Visibility Verification:** Pushes are blocked unless remote repository visibility is verified as private. If visibility has not been confirmed via safe API or user configuration, the status is set to `VISIBILITY_UNVERIFIED` and push is blocked.
4. **Special Project Protection (TBO):** `the-broken-origin` (`TBO ROBLOX`) is subject to an unconditional automation freeze. Automated staging, committing, and pushing to TBO are permanently blocked.

---

## 2. Multi-Project Status Matrix

The following table reflects the verified state of all 7 SleepyKoala Studio projects audited on disk:

| Project Slug | Local Directory Path | Git Root | Active Branch | Configured Remote | Mapping Status | Commit Eligible? | Push Eligible? | Notes & Enforcement |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :--- |
| `indie-developer-portfolio` | `E:\Antigravity Project\indie-developer-portfolio` | ✅ Present | `master` | *None* | `MISSING_REMOTE` | ✅ Yes *(Controlled)* | ❌ No | Portfolio web application; push blocked until remote & private visibility configured |
| `dompetnalar` | `E:\Antigravity Project\FinSmart` | ✅ Present | `main` | `origin https://github.com/lunachroc07-dot/FinSmart.git` | `VISIBILITY_UNVERIFIED` | ❌ No | Remote exists but private visibility unverified; push strictly blocked |
| `idle-master` | `E:\Antigravity Project\Idle Master` | ❌ None | N/A | *None* | `MISSING_GIT` | ❌ No | ❌ No | Directory exists; `.git` not initialized; automation blocked |
| `mobile-kasir` | `E:\Antigravity Project\mobile-kasir` | ❌ None | N/A | *None* | `MISSING_GIT` | ❌ No | ❌ No | Directory exists; `.git` not initialized; automation blocked |
| `idle-mining` | `E:\Antigravity Project\Idle mining` | ✅ Present | `master` | *None* | `MISSING_REMOTE` | ❌ No | ❌ No | Git initialized locally; remote unconfigured; push blocked |
| `the-broken-origin` | `E:\Antigravity Project\TBO ROBLOX` | ✅ Present | `feat/feat-066-memorystore-cache` | `origin https://github.com/zweifeel/TBO-ROBLOX.git` | `BLOCKED` | ❌ No | ❌ No | **Strict Freeze:** Commercial game repo; zero automated operations allowed |
| `worklume` | `E:\Antigravity Project\Worklume` | ❌ None | N/A | *None* | `MISSING_GIT` | ❌ No | ❌ No | Directory exists; `.git` not initialized; automation blocked |

---

## 3. Mapping Status Definitions

| Status Code | Description | Remediation Step |
| :--- | :--- | :--- |
| `READY` | Repository is fully mapped, verified clean, upstream configured, and eligible for push. | Normal operation. |
| `MISSING_GIT` | Directory on disk does not contain a valid `.git` repository folder. | Initialize repository manually (`git init -b main`) if intended. |
| `MISSING_REMOTE` | Local repository has no Git remote configured (`git remote -v` returns empty). | Add remote manually (`git remote add origin <private_url>`). |
| `MISSING_UPSTREAM` | Active branch has no upstream tracking branch configured (`@{u}` is unset). | Push branch with upstream setup (`git push -u origin <branch>`). |
| `VISIBILITY_UNVERIFIED` | Remote URL exists, but private visibility status is unconfirmed. | Verify repository is set to Private on GitHub; update configuration flag. |
| `BRANCH_MISMATCH` | Current checked-out branch does not match expected canonical branch. | Switch to canonical branch (`git checkout <expected_branch>`). |
| `BLOCKED` | Explicit policy block enforcing manual-only control (e.g. TBO protection). | Automated actions strictly forbidden; perform changes manually. |

---

## 4. Cross-Project Isolation Rules

To prevent accidental data or commit leakage between projects:
1. **CWD Validation:** Every Git command executes strictly with `cwd` set to the verified `repoPath` of the target project.
2. **Explicit Slug Verification:** The CLI `--project` argument is resolved against `PROJECT_CONFIGS`. If the slug is unrecognized, the execution terminates immediately.
3. **No Cross-Staging:** When files are staged via `safe-staging.js`, paths are resolved relative to the target project root. Paths escaping the project root (e.g. `../` references) are rejected by path validation.
4. **Remote URL Masking:** When displaying project remotes in CLI output or writing to audit logs, embedded credentials are scrubbed using `sanitizeRemoteUrl()`:
   - Input: `https://user:TOKEN_EXAMPLE@github.com/org/repo.git`
   - Sanitized: `https://***@github.com/org/repo.git`
