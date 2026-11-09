/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: STAGED DIFF INSPECTOR (STAGE 3)
 * 
 * Verifies the Git staging area prior to commit:
 * - Scans cached diff content for secrets, tokens, and PII
 * - Checks conflict markers or whitespace corruptions via `git diff --cached --check`
 * - Validates project boundary alignment
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { scanFileContent as scanSecrets, Severity as SecretSeverity, DEFAULT_ALLOWLIST } from '../security-scan.js';
import { scanPrivacyContent } from '../privacy-scan.js';

/**
 * Inspects and validates the current Git staging area.
 * @param {string} repoRoot Absolute path to git repository root.
 * @param {string} projectSlug Optional target project identifier.
 * @returns {object} Diff analysis and validation results.
 */
export function inspectStagedDiff(repoRoot, projectSlug = null) {
  try {
    // 1. Get staged name-status
    const nameStatusOut = execSync('git diff --cached --name-status', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const lines = nameStatusOut.split('\n').filter((l) => l.trim().length > 0);
    const stagedItems = [];
    const violations = [];

    for (const line of lines) {
      const parts = line.split('\t');
      const status = parts[0].trim();
      const filePath = (parts[1] || '').trim();

      stagedItems.push({
        status,
        path: filePath,
        isAdd: status === 'A',
        isModify: status === 'M',
        isDelete: status === 'D',
        isRename: status.startsWith('R'),
      });
    }

    if (stagedItems.length === 0) {
      return {
        valid: false,
        empty: true,
        summary: { totalStaged: 0, added: 0, modified: 0, deleted: 0, renamed: 0 },
        violations: ['Staging area is empty. Nothing to commit.'],
        diffStat: '',
      };
    }

    // 2. Conflict markers & whitespace check with contextual markdown awareness
    try {
      execSync('git diff --cached --check', {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const checkOutput =
        (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
      const checkLines = checkOutput.split(/\r?\n/).filter(Boolean);

      for (const line of checkLines) {
        if (line.includes('trailing whitespace') || line.includes('space before tab')) {
          violations.push(`Whitespace error: ${line}`);
          continue;
        }

        if (line.includes('leftover conflict marker') || line.includes('conflict marker')) {
          const match = line.match(/^([^:]+):(\d+):/);
          if (!match) {
            violations.push(`Conflict marker: ${line}`);
            continue;
          }

          const fPath = match[1];
          const lineNum = parseInt(match[2], 10);
          const ext = path.extname(fPath).toLowerCase();

          // Contextual inspection for Markdown and documentation files
          if (['.md', '.markdown', '.txt', '.rst'].includes(ext)) {
            let fileContent = '';
            try {
              fileContent = execSync(`git show ":${fPath}"`, {
                cwd: repoRoot,
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'pipe'],
              });
            } catch {
              violations.push(`Conflict marker detected in "${fPath}" at line ${lineNum}`);
              continue;
            }

            const fileLines = fileContent.split(/\r?\n/);

            // Check if line is inside a fenced code block (``` ... ```)
            let inCodeBlock = false;
            let targetInCodeBlock = false;
            for (let i = 0; i < fileLines.length; i++) {
              if (fileLines[i].trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
              }
              if (i + 1 === lineNum) {
                targetInCodeBlock = inCodeBlock;
                break;
              }
            }

            if (targetInCodeBlock) {
              // Permitted: conflict marker example documented inside a markdown code block
              continue;
            }

            // Check for actual Git conflict boundary markers in the file
            const hasStartMarker = fileLines.some((l) => /^<{7}\s+/.test(l));
            const hasEndMarker = fileLines.some((l) => /^>{7}\s+/.test(l));

            if (hasStartMarker || hasEndMarker) {
              violations.push(`Unresolved Git conflict markers in "${fPath}" at line ${lineNum}`);
            } else {
              // No <<<<<<< or >>>>>>> present: line was a Setext heading (=======) or table divider
              // This is a valid markdown formatting element, so ignore this false positive!
              continue;
            }
          } else {
            // Source code files (.ts, .tsx, .js, etc.): any leftover conflict marker is strictly rejected
            violations.push(`Unresolved Git conflict markers in "${fPath}" at line ${lineNum}`);
          }
        }
      }
    }

    // 3. Inspect staged patch content for secrets and PII
    for (const item of stagedItems) {
      if (item.isDelete) continue;

      const normalized = item.path.replace(/\\/g, '/');
      const isAllowlisted = DEFAULT_ALLOWLIST.some(
        (al) => normalized === al || normalized.startsWith(al) || normalized.endsWith(al)
      );
      if (isAllowlisted) continue;

      let stagedContent = '';
      try {
        stagedContent = execSync(`git show ":${item.path}"`, {
          cwd: repoRoot,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        // Binary or unreadable
        continue;
      }

      // Check secrets in staged content
      const secretFindings = scanSecrets(item.path, stagedContent);
      const criticalSecrets = secretFindings.filter(
        (f) => f.severity === SecretSeverity.CRITICAL
      );
      if (criticalSecrets.length > 0) {
        violations.push(
          `Staged file "${item.path}" contains secret token: ${criticalSecrets[0].description}`
        );
      }

      // Check PII in staged content
      const privacyFindings = scanPrivacyContent(item.path, stagedContent);
      const criticalPii = privacyFindings.filter(
        (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH'
      );
      if (criticalPii.length > 0) {
        violations.push(
          `Staged file "${item.path}" contains PII data: ${criticalPii[0].description}`
        );
      }
    }

    // 4. Get human-readable diff stat
    const diffStat = execSync('git diff --cached --stat', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const summary = {
      totalStaged: stagedItems.length,
      added: stagedItems.filter((i) => i.isAdd).length,
      modified: stagedItems.filter((i) => i.isModify).length,
      deleted: stagedItems.filter((i) => i.isDelete).length,
      renamed: stagedItems.filter((i) => i.isRename).length,
      items: stagedItems,
    };

    return {
      valid: violations.length === 0,
      empty: false,
      summary,
      violations,
      diffStat,
    };
  } catch (err) {
    return {
      valid: false,
      empty: true,
      summary: { totalStaged: 0, added: 0, modified: 0, deleted: 0, renamed: 0 },
      violations: [`Error inspecting staged diff: ${err.message}`],
      diffStat: '',
    };
  }
}
