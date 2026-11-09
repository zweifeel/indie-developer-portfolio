/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: CHANGE DETECTION ENGINE (STAGE 3)
 * 
 * Accurately classifies working tree modifications, additions, deletions,
 * renames, and untracked artifacts within a target repository root.
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export const ChangeType = {
  MODIFIED: 'MODIFIED',
  ADDED: 'ADDED',
  DELETED: 'DELETED',
  RENAMED: 'RENAMED',
  UNTRACKED: 'UNTRACKED',
  IGNORED: 'IGNORED',
};

/**
 * Detects working tree changes in a target git repository.
 * @param {string} repoRoot Absolute path to git repository root.
 * @returns {object} Summary of detected changes.
 */
export function detectChanges(repoRoot) {
  if (!repoRoot || !fs.existsSync(repoRoot)) {
    return {
      isGitRepo: false,
      hasChanges: false,
      changes: [],
      error: `Repository root does not exist: "${repoRoot}"`,
    };
  }

  const gitDir = path.join(repoRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    return {
      isGitRepo: false,
      hasChanges: false,
      changes: [],
      error: 'NOT_A_GIT_REPOSITORY',
    };
  }

  try {
    // Run porcelain status with untracked files listed individually
    const stdout = execSync('git status --porcelain=v1 -uall', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const lines = stdout.split('\n').filter((l) => l.trim().length > 0);
    const changes = [];

    for (const line of lines) {
      const indexStatus = line.substring(0, 1);
      const workTreeStatus = line.substring(1, 2);
      const filePath = line.substring(3).trim();

      let type = ChangeType.MODIFIED;
      if (indexStatus === '?' || workTreeStatus === '?') {
        type = ChangeType.UNTRACKED;
      } else if (indexStatus === 'A' || workTreeStatus === 'A') {
        type = ChangeType.ADDED;
      } else if (indexStatus === 'D' || workTreeStatus === 'D') {
        type = ChangeType.DELETED;
      } else if (indexStatus === 'R' || workTreeStatus === 'R') {
        type = ChangeType.RENAMED;
      }

      // Check if file is temporary or build artifact
      const isTemporary = /(?:\.tmp$|\.swp$|\.bak$|~$)|\b(?:scratch|tmp|temp)\b/i.test(filePath);
      const isBuildOutput = /^dist\/|\.turbo\/|\.next\//i.test(filePath);

      changes.push({
        path: filePath,
        absolutePath: path.join(repoRoot, filePath),
        indexStatus,
        workTreeStatus,
        type,
        isTemporary,
        isBuildOutput,
      });
    }

    return {
      isGitRepo: true,
      hasChanges: changes.length > 0,
      totalChanges: changes.length,
      modified: changes.filter((c) => c.type === ChangeType.MODIFIED),
      added: changes.filter((c) => c.type === ChangeType.ADDED),
      deleted: changes.filter((c) => c.type === ChangeType.DELETED),
      renamed: changes.filter((c) => c.type === ChangeType.RENAMED),
      untracked: changes.filter((c) => c.type === ChangeType.UNTRACKED),
      changes,
    };
  } catch (err) {
    return {
      isGitRepo: true,
      hasChanges: false,
      changes: [],
      error: err.message,
    };
  }
}
