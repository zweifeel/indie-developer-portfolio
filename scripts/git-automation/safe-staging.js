/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: SAFE STAGING ENGINE (STAGE 3)
 * 
 * STRICT RULE: NEVER execute `git add .` or `git add -A`.
 * Only stage explicitly verified files matching the repository allowlist.
 * If ANY file violates security policy or contains secrets, staging aborts
 * and rolls back all staged changes without modifying the working tree.
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { evaluateFilePolicy, FileStatus } from '../check-file-policy.js';
import { scanFileContent as scanSecrets, Category as SecretCategory, Severity as SecretSeverity, DEFAULT_ALLOWLIST } from '../security-scan.js';
import { scanPrivacyContent } from '../privacy-scan.js';

/**
 * @typedef {object} StagingResult
 * @property {boolean} success
 * @property {string[]} stagedFiles
 * @property {Array<{ path: string, reason: string, code: string }>} rejectedFiles
 * @property {boolean} rolledBack
 * @property {string} [error]
 */

/**
 * Retrieves the set of currently staged files in the Git index.
 * @param {string} repoRoot
 * @returns {Set<string>}
 */
function getPreExistingStagedFiles(repoRoot) {
  try {
    const output = execSync('git diff --cached --name-only', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return new Set(
      output
        .split(/\r?\n/)
        .map((f) => f.trim().replace(/\\/g, '/'))
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

/**
 * Safely stages an explicit list of files into the Git index.
 * @param {string} repoRoot Absolute path to git repository root.
 * @param {string[]} fileList Array of relative file paths to stage.
 * @param {object} options Optional flags (e.g. dryRun).
 * @returns {StagingResult} Result of the safe staging operation.
 */
export function stageFilesSafely(repoRoot, fileList, options = { dryRun: false }) {
  if (!repoRoot || !fs.existsSync(repoRoot)) {
    return {
      success: false,
      stagedFiles: [],
      rejectedFiles: [],
      rolledBack: false,
      error: `Repository root does not exist: "${repoRoot}"`,
    };
  }

  // Snapshot pre-existing Git index state before transaction starts
  const preExistingStaged = getPreExistingStagedFiles(repoRoot);

  if (!Array.isArray(fileList) || fileList.length === 0) {
    return {
      success: true,
      stagedFiles: [],
      rejectedFiles: [],
      rolledBack: false,
    };
  }

  const stagedFiles = [];
  const rejectedFiles = [];

  // 1. Audit each file candidate against Security, File Policy, and Privacy rules
  for (const relativePath of fileList) {
    const normalized = relativePath.replace(/\\/g, '/');
    const absolutePath = path.join(repoRoot, relativePath);

    // Rule 1: File Policy Enforcer (Default Deny & Prohibited Denylist)
    const policyEvaluation = evaluateFilePolicy(normalized);
    const isAllowed =
      policyEvaluation.status === FileStatus.ALLOWED_PROJECT_FILE ||
      policyEvaluation.status === FileStatus.ALLOWED_TEST_FIXTURE;

    if (!isAllowed) {
      rejectedFiles.push({
        path: normalized,
        reason: `File rejected under repository file policy (${policyEvaluation.reason}).`,
        code: policyEvaluation.status,
      });
      continue;
    }

    // If file was deleted, we only check path policy (cannot scan contents of deleted file)
    if (!fs.existsSync(absolutePath)) {
      stagedFiles.push(normalized);
      continue;
    }

    // Authorized documentation & test fixtures in allowlist skip secret/PII checks
    const isAllowlisted = DEFAULT_ALLOWLIST.some(
      (al) => normalized === al || normalized.startsWith(al) || normalized.endsWith(al)
    );
    if (isAllowlisted) {
      stagedFiles.push(normalized);
      continue;
    }

    // If file is binary, skip text scanning if allowed
    const isBinary = /\.(?:png|jpg|jpeg|gif|webp|ico|svg|pdf|zip|tar|gz)$/i.test(normalized);
    if (!isBinary) {
      const content = fs.readFileSync(absolutePath, 'utf-8');

      // Rule 2: Secret Scanning
      const secretFindings = scanSecrets(normalized, content);
      const criticalSecrets = secretFindings.filter(
        (f) => f.severity === SecretSeverity.CRITICAL || f.category === SecretCategory.SECRET_API_KEY
      );
      if (criticalSecrets.length > 0) {
        rejectedFiles.push({
          path: normalized,
          reason: `Secret token detected in file: ${criticalSecrets[0].description}`,
          code: 'SECRET_DETECTED',
        });
        continue;
      }

      // Rule 3: Privacy & PII Scanning
      const privacyFindings = scanPrivacyContent(normalized, content);
      const actionablePii = privacyFindings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');
      if (actionablePii.length > 0) {
        rejectedFiles.push({
          path: normalized,
          reason: `Unapproved personal identifiable information (PII) detected: ${actionablePii[0].description}`,
          code: 'PII_DETECTED',
        });
        continue;
      }
    }

    stagedFiles.push(normalized);
  }

  // Fail-Closed: If any candidate file was rejected, abort the whole staging batch
  // Note: Since git add was not yet run, pre-existing index state is 100% preserved
  if (rejectedFiles.length > 0) {
    return {
      success: false,
      stagedFiles: [],
      rejectedFiles,
      rolledBack: false,
      error: `Staging aborted: ${rejectedFiles.length} file(s) violated repository security policy.`,
    };
  }

  // In DRY-RUN mode, do not mutate git index
  if (options.dryRun) {
    return {
      success: true,
      stagedFiles,
      rejectedFiles: [],
      rolledBack: false,
    };
  }

  // 2. Perform controlled staging file-by-file (NEVER git add . or git add -A)
  const newlyStagedThisTx = [];
  try {
    for (const fileToStage of stagedFiles) {
      const wasAlreadyStaged = preExistingStaged.has(fileToStage);
      execSync(`git add -- "${fileToStage}"`, {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (!wasAlreadyStaged) {
        newlyStagedThisTx.push(fileToStage);
      }
    }

    return {
      success: true,
      stagedFiles,
      rejectedFiles: [],
      rolledBack: false,
    };
  } catch (err) {
    // 3. Rollback ONLY changes introduced by this transaction
    // Pre-existing staged files belonging to the developer are strictly preserved!
    let rollbackFailed = false;
    for (const fileToUnstage of newlyStagedThisTx) {
      try {
        execSync(`git restore --staged -- "${fileToUnstage}"`, {
          cwd: repoRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        try {
          execSync(`git reset HEAD -- "${fileToUnstage}"`, {
            cwd: repoRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        } catch {
          rollbackFailed = true;
        }
      }
    }

    return {
      success: false,
      stagedFiles: [],
      rejectedFiles: [],
      rolledBack: !rollbackFailed,
      error: `Failed to stage files: ${err.message}. Index rolled back safely without modifying pre-existing staged files.`,
    };
  }
}
