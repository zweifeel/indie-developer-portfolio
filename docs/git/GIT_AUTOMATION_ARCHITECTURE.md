# SLEEPYKOALA STUDIO — GIT AUTOMATION ARCHITECTURE
## Stage 3: Controlled Automatic Git Commit & Push Engine
**Document Version:** 1.0.0  
**Status:** Canonical Reference Architecture  
**Stage:** Stage 3 — Controlled Auto Commit & Push  
**Workspace:** `E:\Antigravity Project\indie-developer-portfolio`  
**License / Cost:** Zero-Cost ($0.00 / Rp 0)

---

## 1. Executive Summary & Purpose

The **SleepyKoala Studio Git Automation Engine** provides an automated, fail-closed, multi-project Git workflow toolset designed to manage commits and remote synchronization safely across independent studio projects. Built entirely using native Node.js and local Git commands, the system operates with zero third-party cloud dependencies and zero software license costs.

### Core Security & Operational Principles
1. **Default Mode is DRY-RUN:** All operations default to `DRY-RUN` (`ExecutionMode.DRY_RUN`). No Git objects or commits are created and no network packets are sent unless explicit command-line flags are provided.
2. **Explicit Allowlist Staging:** Bulk staging commands (`git add .`, `git add -A`, `git add *`) are strictly prohibited. Files are evaluated against the Stage 1 file policy, secret scanner, and privacy scanner before entering the Git index.
3. **Canonical Commit Standard:** Commit messages are strictly formatted as `<type>(<project>): <summary>`, adhering to conventional specifications. Empty commits and unauthorized amends are rejected.
4. **Push Gating & Private Remote Verification:** Automated pushes are blocked unless the target remote is verified, repository visibility is confirmed private, the active branch matches configuration, and an upstream tracking branch is properly configured.
5. **Zero Forced Operations:** Forced push flags (`--force`, `-f`), branch deletion, and history rewrites (`git reset --hard`, `git clean -fd`) are permanently prohibited and excluded from the automation codebase.
6. **Isolated Sandbox Verification:** Automated commit and push workflows are validated against 30 isolated test scenarios in temporary throwaway repositories (`%TEMP%/sk_git_*`), ensuring zero mutations to the main development repository.

---

## 2. Architecture & Subsystem Data Flow

```mermaid
flowchart TD
    CLI["CLI Entrypoint<br/>(scripts/git-automation/cli.js)"] --> ModeCheck{"Execution Mode"}
    
    ModeCheck -->|"STATUS"| StatusCmd["Change Detection<br/>(change-detection.js)"]
    ModeCheck -->|"DRY-RUN (Default)<br/>or COMMIT"| Pipeline["Controlled Pipeline"]
    ModeCheck -->|"PUSH"| PushGuard["Push Guard<br/>(push-guard.js)"]

    subgraph Pipeline ["Controlled Commit Pipeline"]
        A1["1. Change Detection<br/>(change-detection.js)"] --> A2["2. Safe Staging & Whitelist Check<br/>(safe-staging.js)"]
        A2 --> A3["3. Diff Inspection & Secret Scan<br/>(diff-inspector.js)"]
        A3 --> A4["4. Quality Gates Execution<br/>(quality-runner.js)"]
        A4 --> A5{"Dry Run Mode?"}
        A5 -->|"Yes"| A6["Plan Commit Summary<br/>(No Git Object Created)"]
        A5 -->|"No"| A7["Execute Commit<br/>(commit-engine.js)"]
    end

    subgraph PushEngine ["Push Gating Engine"]
        PushGuard --> B1{"Project Mapped &<br/>canPushRemotely?"}
        B1 -->|"No"| B2["Abort: Push Blocked"]
        B1 -->|"Yes"| B3{"Verify Remote URL &<br/>Private Visibility"}
        B3 -->|"Unverified"| B4["Abort: VISIBILITY_UNVERIFIED"]
        B3 -->|"Verified"| B5{"Active Branch &<br/>Upstream Valid?"}
        B5 -->|"No"| B6["Abort: Branch / Upstream Mismatch"]
        B5 -->|"Yes"| B7["Execute git push (Fast-Forward Only)"]
    end

    A6 --> Logger["Audit Logger<br/>(docs/audit/git-automation.log)"]
    A7 --> Logger
    B2 --> Logger
    B4 --> Logger
    B6 --> Logger
    B7 --> Logger
```

---

## 3. Subsystem Breakdown

### 3.1. Change Detection (`change-detection.js`)
- Executes `git status --porcelain=v1 -uall` to parse modified, added, deleted, renamed, and untracked files.
- Categorizes detected changes into project source files, build artifacts (e.g. `dist/`, `node_modules/`), and temporary files (`.tmp`, `.log`).
- Verifies Git root presence; gracefully reports `isGitRepo: false` if `.git` is missing.

### 3.2. Safe Staging Engine (`safe-staging.js`)
- Iterates through explicit file paths individually.
- Invokes Stage 1 `evaluateFilePolicy` to block denylisted extensions (`.env`, `.keystore`, `.sql`, `.dump`, `webcredential.txt`).
- Invokes Stage 1 `scanFileContent` to prevent staging files with credentials (API keys, private keys, JWTs).
- Invokes Stage 1 `scanPrivacyContent` to prevent staging unapproved PII (Indonesian mobile numbers, NIK).
- Respects `DEFAULT_ALLOWLIST` to prevent false positive rejection on verified test fixtures.
- If any file fails validation, the staging transaction is aborted and index changes are safely reverted via `git restore --staged`, leaving the developer's working tree files untouched.

### 3.3. Staged Diff Inspector (`diff-inspector.js`)
- Executes `git diff --cached --check` to identify whitespace errors and unresolved merge conflict markers (`<<<<<<<`, `=======`).
- Extracts patch content via `git diff --cached` and scans additions for leaked tokens or sensitive patterns.
- Ensures the staged index is non-empty before committing.

### 3.4. Quality Runner (`quality-runner.js`)
- Executes configured quality gates sequentially per project.
- For `indie-developer-portfolio`:
  1. Unit & Integration Tests: `npm test`
  2. TypeScript Compilation: `npx tsc -b`
  3. Production Build: `npm run build`
  4. Linter: `npm run lint`
  5. Repository Security: `node scripts/check-file-policy.js`
- Fail-Closed: If any gate returns a non-zero exit code, subsequent gates are aborted and the commit process terminates immediately.

### 3.5. Commit Engine (`commit-engine.js`)
- Validates commit parameters against canonical types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `chore`.
- Enforces structure: `<type>(<project>): <summary>`.
- Rejects empty summaries or non-string inputs.
- Prohibits `--amend` and `--allow-empty`.
- In `DRY-RUN` mode, computes and displays the planned commit message and staged diff without modifying Git HEAD.

### 3.6. Push Guard (`push-guard.js`)
- Enforces a 6-step verification pipeline:
  1. Project configuration check (`canPushRemotely: true`).
  2. Physical remote configuration check on disk (`git remote -v`).
  3. Private visibility verification (`VISIBILITY_UNVERIFIED` check).
  4. Branch alignment check (e.g. active branch must match `master` or `main`).
  5. Upstream tracking branch check (`git rev-parse --abbrev-ref @{u}`).
  6. Standard fast-forward push execution without force flags.

### 3.7. Audit Logger (`audit-logger.js`)
- Appends structured, timestamped audit entries to `docs/audit/git-automation.log`.
- Sanitizes remote URLs using `sanitizeRemoteUrl()` to ensure embedded credentials (e.g. `https://user:token@github.com/...`) are scrubbed to `https://***@github.com/...`.
- Records mode, project ID, commit hash, commit message, status (`PLANNED`, `COMMITTED`, `PUSHED`, `BLOCKED`, `ERROR`), and failure reasons.

---

## 4. CLI Interface & Execution Modes

The automation CLI is accessible via `scripts/git-automation/cli.js` and registered in `package.json`:

```bash
# 1. Audit status across all 7 projects
npm run git:status

# 2. Dry-run commit validation on indie-developer-portfolio (Default)
npm run git:dry-run -- --project indie-developer-portfolio --type feat --message "implement feature"

# 3. Controlled local commit (Quality gates must pass)
npm run git:commit -- --project indie-developer-portfolio --type fix --message "resolve layout bug"

# 4. Controlled remote push (Gated, fast-forward only)
npm run git:push -- --project indie-developer-portfolio
```

### CLI Options Table
| Flag | Description | Default | Allowed Values |
| :--- | :--- | :--- | :--- |
| `--mode` | Execution mode | `DRY-RUN` | `STATUS`, `DRY-RUN`, `COMMIT`, `PUSH` |
| `--project` | Target project slug | `indie-developer-portfolio` | Any canonical project slug |
| `--type` | Conventional commit type | `chore` | `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `chore` |
| `--message` | Commit summary line | *(Required for COMMIT)* | String (non-empty) |
| `--body` | Optional extended commit body | `""` | String |
| `--all` | Scan all configured projects | `false` | Boolean |

---

## 5. Security & Isolation Matrix

| Threat Scenario | Protection Mechanism | Fail-Safe Behavior |
| :--- | :--- | :--- |
| Staging `.env` or Keystore | Safe Staging Allowlist Filter | Rejected with `DENIED_PROHIBITED_FILE`; transaction rolled back |
| Staging API Key / PAT | Staging & Diff Secret Scanners | Rejected with `SECRET_DETECTED`; transaction rolled back |
| Staging Customer Phone / NIK | Privacy Scanner Context Filter | Rejected with `PII_DETECTED`; transaction rolled back |
| Commit with Failing Tests | Quality Runner (`npm test`) | Aborted; commit not executed |
| Commit with Broken TypeScript | Quality Runner (`npx tsc -b`) | Aborted; commit not executed |
| Push to Non-Existent Remote | Push Guard Remote Validation | Rejected before push; returns `MISSING_REMOTE` |
| Push on Detached / Wrong Branch | Push Guard Branch Check | Rejected; returns `Branch mismatch` |
| Push without Upstream Tracking | Push Guard Tracking Check | Rejected; returns `MISSING_UPSTREAM` |
| Push with Force Flag | Static Engine Lock | Codebase contains zero `--force` flags; forced overwrite is impossible |
| Accidental Main Repo Mutation | Throwaway Sandbox Isolation | All unit tests operate in isolated `%TEMP%` directories |

---

## 6. Verification & Quality Standard

The Stage 3 Git Automation engine has been verified through a dedicated test suite in `src/test/gitAutomation.test.ts` comprising **30 test scenarios**:
- Repository Mapping & Root Integrity: 8/8 PASS
- Safe Staging & Security Allowlist: 6/6 PASS
- Quality Gates & Commit Validation: 6/6 PASS
- Push Guards & Failure Recovery: 4/4 PASS
- Operational Hygiene, Dry-Run & Audit Logging: 6/6 PASS

Full test suite execution (`npm test`): **34 test files, 616 passing tests, 0 failures**.
TypeScript Typecheck (`npx tsc -b`): **0 errors**.
Production Bundle (`npm run build`): **0 errors, build successful**.
Security & Privacy Scanners: **0 actionable findings, 100% clean**.
Main Repository Git Status: **Clean, 0 commits created, HEAD unmutated (`cae5405`)**.
