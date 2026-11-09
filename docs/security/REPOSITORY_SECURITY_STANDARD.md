# SLEEPYKOALA STUDIO — REPOSITORY SECURITY STANDARD
**Document Reference:** `docs/security/REPOSITORY_SECURITY_STANDARD.md`  
**Milestone:** Phase 1 — Repository Standards & Local Security  
**Version:** 1.0.0  
**Status:** Approved & Enforced Locally  
**Author:** DevSecOps & Application Security Team  

---

## 1. PRINCIPLES & SECURITY POSTURE

SleepyKoala Studio operates under strict DevSecOps and data privacy guidelines:
1. **Default Deny:** Unknown, unstructured, or untracked binary files outside approved directory paths and extensions are rejected from entering version control.
2. **Zero-Cost & Free-Tier Boundary:** All security scanners and validation hooks run 100% locally with zero cloud subscription, zero external API costs ($0.00 / Rp 0), and zero data transmission to third parties.
3. **Zero Secret Leakage:** Any credential pattern detected by scanners is automatically masked in console outputs, audit logs, and reports (`***REDACTED***`).
4. **Fail-Closed Execution:** Commits, pushes, and pipeline syncs exit with code 1 if critical credentials, private keys, or unapproved PII are discovered.
5. **Strict Non-Interference:** Development on the portfolio publishing pipeline must never mutate or regress existing modules (including the Virtual Development Office).

---

## 2. STANDARDIZED `.gitignore` SPECIFICATION

The repository `.gitignore` enforces strict exclusions across 7 core layers:

```gitignore
# 1. Logs & Runtime Debug Traces: logs/, *.log, npm-debug.log*, etc.
# 2. Build Outputs & Caches: node_modules/, dist/, dist-ssr/, coverage/, .cache/, .turbo/, .vite/, *.tsbuildinfo
# 3. Environment Secrets: *.local, .env, .env.local, .env.* (with explicit exception !.env.example), .dev.vars, .clasp.json
# 4. Protected Credentials: *credential*, webcredential.txt, *service-account*.json, client_secret*.json, oauth*.json, *.key, *.pem, *.p12, *.pfx, *.jks, *.keystore, *.pk8, *.der, id_rsa*, id_ed25519*, signing.properties, release.keystore
# 5. Database Dumps: *.dump, *.sql, *.sqlite, *.db, *.rdb, *.backup, testers-export*.json, tester-*.csv
# 6. Testing Temporary Fixtures: *.fixture.tmp, *.dummy.tmp, test-fixtures/temp/, screenshots/
# 7. OS & Editor Metadata: .vscode/*, !.vscode/extensions.json, .idea/, .DS_Store, Thumbs.db, Desktop.ini
# 8. Whitelisted Safe Source Exceptions: !src/styles/tokens.ts
```

*Note on Tracked Files:* `.gitignore` only prevents untracked files from being staged. Tracked files are audited independently via `check-file-policy.js --tracked`.

---

## 3. REPOSITORY FILE POLICY: ALLOWLIST & DENYLIST

The script `scripts/check-file-policy.js` enforces the "Default Deny" boundary:

### 3.1 Denylist Patterns
- Environment variables: `^\.env(?:\..+)?$`, `^\.dev\.vars(?:\..+)?$`
- Dedicated credential files: `webcredential\.txt`, `credentials\.json`, `client[-_]secret.*\.json`, `oauth.*\.json`
- Service accounts: `service[-_]account.*\.json`, `play[-_]key.*\.json`
- Keystores & private keys: `\.(?:jks|keystore|p12|pfx|pk8|der|pem|key)$`, `id_rsa*`, `id_ed25519*`
- Signing materials: `signing\.properties`, `release\.keystore`
- Database dumps & backups: `\.(?:dump|sql|sqlite|db|rdb|backup)$`
- Tester PII dumps: `testers?[-_]export.*\.json`, `testers?[-_].*\.csv`
- Cache directories: `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`

### 3.2 Approved Project Structure (Allowlist)
- **Approved Root Files:** `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `wrangler.toml`, `.gitignore`, `.oxlintrc.json`, `.env.example`, `README.md`, `index.html`, `PORTFOLIO_METADATA_SCHEMA.md`, `SECURITY_SCAN_POLICY.md`, `roadmap_sleepykoala_updated.md`.
- **Approved Directories:** `src/`, `public/`, `docs/`, `scripts/`, `functions/`, `backend/`, `.github/`, `scratch/`.
- **Approved Extensions:** `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.css`, `.html`, `.svg`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.ico`, `.md`, `.txt`, `.toml`, `.sample`, `.claspignore`, `.gs`, `.xml`, `.py`, `.ps1`, `.zip`, `.bak`, `.aseprite`, `.url`.

---

## 4. LOCAL SECURITY & PRIVACY SCANNERS

### 4.1 Security Scanner (`scripts/security-scan.js`)
Evaluates tracked and staged files against 12 core security rules:
- `SEC-001`: Cryptographic Private Key headers (`-----BEGIN ... PRIVATE KEY-----`)
- `SEC-002`: Google Cloud & Firebase API keys (`AIza...`)
- `SEC-003`: GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`, `gho_...`)
- `SEC-004`: AWS Access Key IDs (`AKIA...`, `ASIA...`, `AROA...`)
- `SEC-005`: Hardcoded credentials & password assignments
- `SEC-006`: Database connection URIs (`postgres://`, `mongodb://`, etc.)
- `SEC-007`: Cloudflare Global API keys (37-character hex strings)
- `SEC-008`: Authorization Bearer tokens & JWT signatures
- `PII-001`: Indonesian NIK (16-digit identity number in personal context)
- `PII-002`: Indonesian mobile phone numbers (`+628...`, `08...`)
- `PII-003`: Payment card sequences (13-16 digits with financial context)
- `PII-004`: Unsanitized customer/tester email addresses

### 4.2 Privacy Scanner (`scripts/privacy-scan.js`)
Audits repository files for personal data leakage:
- Identifies customer/tester emails while allowing standard RFC dummy domains (`@example.invalid`, `@test.local`) and official public support contacts.
- Checks for customer database dumps and transaction exports.
- Classifies findings: `CONFIRMED_TEST_FIXTURE`, `POTENTIAL_PII`, `CONFIRMED_SENSITIVE_FILE`, `FALSE_POSITIVE`, `NOT_VERIFIED`.

---

## 5. FALSE-POSITIVE INVESTIGATION & SURGICAL RESOLUTION

### 5.1 The 6 Investigated Itch.io HTML Findings
During Phase 0, the scanner flagged 6 files in `scratch/b343/`:
- `A1_ThirdAngle.html:1`
- `A2_Antahonist.html:1`
- `A3_Gedar.html:1`
- `A4_Riekahq.html:1`
- `B1_RigelRiv.html:1`
- `B3_HappyHustle.html:1`

### 5.2 Technical Root Cause
1. All 6 files are public HTML downloads from Itch.io game asset pages.
2. On line 1 of minified HTML headers, Itch.io embeds its official public Twitter account ID:
   `<meta content="4503599627724030" property="twitter:account_id"/>`
3. The ID `4503599627724030` (associated with `twitter:account_id`) is 16 digits long and starts with `4`, matching the Visa payment regex pattern (`/\b4[0-9]{15}\b/`).
4. On the same minified line, Itch.io declares its Twitter Card format:
   `<meta name="twitter:card" content="summary_large_image"/>`
5. The rule `PII-003` previously used `contextFilter: (line) => /(?:card|credit|...)/i.test(line)`. The substring `card` in `twitter:card` triggered the context filter.
6. The combination of a 16-digit integer starting with 4, a matching Luhn checksum, and the word `card` in `twitter:card` produced the false alert.

### 5.3 Surgical Remediation
In strict accordance with Task 3 directives, **neither `scratch/` nor `scratch/b343/` were blanket-ignored**.
Instead, two targeted protections were implemented in `PII-003`:
1. **Context Sanitization:** Strips HTML Twitter/OpenGraph markup (`twitter:card`, `twitter:account_id`) before testing for payment card keywords (`credit_card`, `debit_card`, `cvv`, etc.).
2. **Validator Exemption:** Specifically verifies that `4503599627724030` inside `<meta property="twitter:account_id">` is Itch.io's verified social media identifier.
3. **No False Negatives:** If a genuine credit card (e.g. `4500 1234 5678 9010` with `card_number` or `cvv`) or an API key is inserted into any Itch.io file, it is **still immediately flagged with Severity: CRITICAL**.

---

## 6. PRE-COMMIT & PRE-PUSH GIT HOOK GUARDS

### 6.1 Pre-Commit Hook (`.git/hooks/pre-commit`)
Invokes `node scripts/pre-commit-check.js`.
1. Inspects all staged files (`git diff --cached --name-only`).
2. Validates against Denylist & Default Deny policy.
3. Runs secret and privacy scanners over staged file contents.
4. If any violation is found: Commit is blocked, details are printed with values masked, and exit code 1 is returned.

### 6.2 Pre-Push Hook (`.git/hooks/pre-push`)
Invokes `node scripts/pre-push-check.js`.
1. Audits all tracked files in Git index.
2. Scans full repository for secrets and unapproved PII.
3. Inspects pending commit diffs (`git diff @{u}..HEAD` or recent commits).
4. If critical findings exist: Remote push is blocked, exit code 1 is returned.

---

## 7. EXECUTION COMMANDS (NPM CHECKS)

| Command | Role | Target | Fail-Closed Exit Code |
| :--- | :--- | :--- | :---: |
| `npm run security:scan` | Secret & Token Scan | Full Workspace | `1` on secrets |
| `npm run security:privacy` | Privacy & PII Scan | Full Workspace | `1` on PII |
| `npm run security:files` | File Policy & Denylist | Full Workspace | `1` on denied |
| `npm run security:precommit` | Pre-Commit Verification | Staged Files | `1` on violation |
| `npm run security:prepush` | Pre-Push Verification | Tracked Files & Diffs | `1` on violation |
| `npm run security:test` | DevSecOps Test Suites | Test Fixtures | `1` on test fail |

---

## 8. RECOVERY PROCEDURES (WHAT TO DO IF SCAN FAILS)

1. **If a secret is flagged:**
   - Locate the flagged file and line indicated in the report.
   - Replace the plain text secret with an environment variable reference (`env.APPS_SCRIPT_SECRET` or `.dev.vars`).
   - Run `npm run security:scan` to confirm resolution.
2. **If an unapproved file is flagged:**
   - Check if the file is a temporary artifact or cache.
   - Add its pattern to `.gitignore` if it should never be tracked.
   - Run `npm run security:files` to confirm resolution.
3. **If PII is flagged:**
   - Replace personal customer/tester emails with dummy placeholders (e.g. `tester@example.invalid`).
   - Ensure screenshots do not contain personal notification banners or unapproved device data.
   - Run `npm run security:privacy` to verify.
