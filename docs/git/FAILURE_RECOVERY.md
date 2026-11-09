# SLEEPYKOALA STUDIO — GIT AUTOMATION FAILURE RECOVERY
## Stage 3: Operational Troubleshooting, Rollback & Incident Response
**Document Version:** 1.0.0  
**Status:** Mandatory Operational Guide  
**Stage:** Stage 3 — Controlled Auto Commit & Push  
**Workspace:** `E:\Antigravity Project\indie-developer-portfolio`  
**License / Cost:** Zero-Cost ($0.00 / Rp 0)

---

## 1. Overview & Recovery Principles

The SleepyKoala Studio Git Automation Engine operates on a **fail-closed, non-destructive** recovery philosophy:
1. **Never Discard Working Edits:** The automation engine will never run `git reset --hard` or `git clean -fd`. If an error occurs, user modifications on the filesystem remain intact.
2. **Safe Index Rollback:** If staging fails halfway due to a security violation, the engine immediately calls `git restore --staged` or `git reset` on the index. The working tree files are untouched.
3. **Structured Audit Logging:** Every error is written to `docs/audit/git-automation.log` with a timestamp, project slug, sanitized remote URL, and error message.

---

## 2. Failure Diagnostic & Resolution Procedures

### 2.1. `MISSING_GIT` — Repository Uninitialized
- **Symptom:** CLI outputs `No Git repository found at path "E:\Antigravity Project\<Project>"`.
- **Root Cause:** Target directory exists but lacks a `.git` administrative subdirectory.
- **Resolution:**
  ```bash
  cd "E:\Antigravity Project\<Project>"
  git init -b main
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  ```
  After initialization, run `npm run git:status` to verify recognition.

---

### 2.2. `MISSING_REMOTE` — Remote Repository Unconfigured
- **Symptom:** CLI outputs `Git repository has no remote configured. Push blocked.`
- **Root Cause:** The local repository was initialized locally but has not been connected to GitHub.
- **Resolution:**
  1. Create a **Private** repository on GitHub manually (do not initialize with README).
  2. Add the remote using SSH or HTTPS:
     ```bash
     cd "E:\Antigravity Project\<Project>"
     git remote add origin https://github.com/<owner>/<repo>.git
     ```
  3. Verify via `git remote -v`.

---

### 2.3. `VISIBILITY_UNVERIFIED` — Repository Visibility Unconfirmed
- **Symptom:** CLI outputs `Repository visibility is unverified (must be verified PRIVATE before push).`
- **Root Cause:** The automation engine enforces a fail-closed check preventing push until repository visibility is confirmed private to avoid leaking commercial or intellectual property.
- **Resolution:**
  1. Open GitHub repository settings in browser.
  2. Confirm under "Danger Zone" that the repository visibility is **Private**.
  3. In `scripts/git-automation/config.js`, update `mappingStatus` to `RepoMappingStatus.READY` and set `canPushRemotely: true`.

---

### 2.4. `MISSING_UPSTREAM` — No Upstream Tracking Branch
- **Symptom:** CLI outputs `Branch "<branch>" does not have an upstream tracking branch configured. Push blocked.`
- **Root Cause:** Branch has not been pushed with `-u` or tracking was not established.
- **Resolution:**
  Establish upstream tracking manually for the initial push:
  ```bash
  cd "E:\Antigravity Project\<Project>"
  git push -u origin <branch>
  ```
  Subsequent pushes via the automation CLI will detect the tracking branch and succeed.

---

### 2.5. `BRANCH_MISMATCH` — Checked-Out Branch Does Not Match Configuration
- **Symptom:** CLI outputs `Branch mismatch: Currently on "feat/my-branch", but expected "master".`
- **Root Cause:** Active Git HEAD is on an unexpected or experimental branch.
- **Resolution:**
  ```bash
  cd "E:\Antigravity Project\<Project>"
  git checkout <expected_branch>
  # If working tree has uncommitted changes, stash or commit them first:
  # git stash
  # git checkout <expected_branch>
  # git stash pop
  ```

---

### 2.6. `QUALITY_GATE_FAILURE` — Tests, Typecheck, Build, or Lint Failed
- **Symptom:** Commit aborted with `Quality gate failed: Command "npm test" exited with code 1.`
- **Root Cause:** One of the configured project quality gates failed.
- **Resolution:**
  1. Identify the failing gate from the CLI output.
  2. Run the gate command manually to inspect the full stack trace:
     - `npm test`
     - `npx tsc -b`
     - `npm run build`
     - `npm run lint`
  3. Resolve the underlying code or type errors in the source code.
  4. Re-run `npm run git:dry-run` to verify that quality gates now pass.

---

### 2.7. `STAGING_VIOLATION` — Denylisted File, Secret, or PII Detected
- **Symptom:** Staging aborted with `Rejected 1 file: .env.production (Reason: Environment variable file (.env) prohibited).`
- **Root Cause:** An unapproved file, credential token, or customer PII was included in the staging candidate list.
- **Recovery Procedure:**
  1. The engine automatically rolls back staged changes (`git restore --staged`).
  2. If the prohibited file was created accidentally, remove it or add it to `.gitignore`:
     ```bash
     echo ".env.production" >> .gitignore
     ```
  3. If sensitive data (API key, customer phone) was inserted into an allowed source file, remove or replace the sensitive string with a synthetic dummy placeholder.
  4. Run `npm run security:scan` and `npm run security:privacy` to verify cleanliness.

---

### 2.8. `DIFF_VIOLATION` — Conflict Markers or Secret in Patch
- **Symptom:** Commit aborted with `Staged diff contains unresolved conflict markers or whitespace errors.`
- **Root Cause:** Unresolved merge conflict markers (`<<<<<<< HEAD`, `=======`) remain in staged files.
- **Resolution:**
  1. Search for conflict markers:
     ```bash
     git diff --cached --check
     ```
  2. Open the affected file, resolve merge conflicts manually, and save.
  3. Re-stage the resolved file and proceed.

---

### 2.9. `REMOTE_REJECTION` — Remote Upstream Diverged (Non-Fast-Forward)
- **Symptom:** Push aborted with `Git push failed: Updates were rejected because the remote contains work that you do not have locally.`
- **Root Cause:** Remote upstream branch contains new commits made by team members or from another machine.
- **Strict Constraint:** Forced push (`git push -f`) is **permanently prohibited**.
- **Resolution:**
  Pull upstream changes using fast-forward or rebase:
  ```bash
  cd "E:\Antigravity Project\<Project>"
  git fetch origin
  git pull --ff-only origin <branch>
  ```
  If upstream has diverged, create a safe merge commit or perform manual rebase locally, verify tests pass, and re-run `npm run git:push`.

---

## 3. Incident Logging & Audit Verification

All automated Git actions and failures are appended to:
`docs/audit/git-automation.log`

### Sample Log Structure
```json
{"timestamp":"2026-11-08T08:35:10.123Z","projectId":"indie-developer-portfolio","projectSlug":"indie-developer-portfolio","mode":"PUSH","remoteUrl":"https://***@github.com/lunachroc07-dot/portfolio.git","status":"BLOCKED","failureReason":"Remote URL and private visibility not yet configured"}
```

Audit entries contain zero embedded tokens, passwords, or plain-text credentials.
