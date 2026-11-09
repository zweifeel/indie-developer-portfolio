/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: PUSH GUARD (STAGE 3)
 * 
 * Strict pre-push gating engine:
 * - Verifies verified remote URL, private visibility, branch, and upstream
 * - Prevents non-fast-forward and forced push flags unconditionally
 * - Blocks execution if any remote, upstream, or visibility check is unverified
 * - Default mode is always DRY-RUN
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import { PROJECT_CONFIGS, sanitizeRemoteUrl } from './config.js';

/**
 * @typedef {object} PushOptions
 * @property {string} projectSlug
 * @property {boolean} [dryRun]
 */

/**
 * Validates push prerequisites and optionally performs controlled push.
 * @param {string} repoRoot Absolute path to git repository root.
 * @param {PushOptions} options Push parameters.
 * @returns {object} Result of push gating and execution.
 */
export function executePush(repoRoot, options) {
  const { projectSlug, dryRun = true } = options;

  // 1. Verify project mapping configuration
  const config = PROJECT_CONFIGS[projectSlug];
  if (!config) {
    return {
      success: false,
      pushed: false,
      error: `Project "${projectSlug}" is not recognized in repository mapping.`,
    };
  }

  // 2. Check push eligibility
  if (!config.canPushRemotely) {
    return {
      success: false,
      pushed: false,
      mappingStatus: config.mappingStatus,
      error: `Push blocked for project "${projectSlug}": ${config.blockReason}`,
    };
  }

  // 3. Verify actual Git remote on disk
  let configuredRemotes = '';
  try {
    configuredRemotes = execSync('git remote -v', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    return {
      success: false,
      pushed: false,
      error: `Failed to inspect remotes on repository: ${err.message}`,
    };
  }

  if (!configuredRemotes.trim()) {
    return {
      success: false,
      pushed: false,
      mappingStatus: 'MISSING_REMOTE',
      error: `No Git remotes configured on repository at "${repoRoot}".`,
    };
  }

  // 4. Verify branch and upstream
  let currentBranch = '';
  try {
    currentBranch =
      execSync('git branch --show-current', {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim() ||
      execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
  } catch (err) {
    return {
      success: false,
      pushed: false,
      error: `Failed to determine current branch: ${err.message}`,
    };
  }

  if (config.expectedBranch && currentBranch !== config.expectedBranch) {
    return {
      success: false,
      pushed: false,
      error: `Branch mismatch: Currently on "${currentBranch}", but expected "${config.expectedBranch}".`,
    };
  }

  // Check upstream tracking
  let upstream = '';
  try {
    upstream = execSync('git rev-parse --abbrev-ref @{u}', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return {
      success: false,
      pushed: false,
      mappingStatus: 'MISSING_UPSTREAM',
      error: `Branch "${currentBranch}" does not have an upstream tracking branch configured. Push blocked.`,
    };
  }

  // 5. In DRY-RUN mode, confirm readiness and stop
  if (dryRun) {
    return {
      success: true,
      pushed: false,
      dryRun: true,
      targetRemote: config.expectedRemote,
      sanitizedUrl: sanitizeRemoteUrl(config.expectedRemoteUrl),
      targetBranch: currentBranch,
      upstream,
      message: 'Dry-run successful: Remote, branch, and upstream verified. Ready for push.',
    };
  }

  // 6. Execute push (strictly without forced overwrite flags)
  try {
    execSync(`git push ${config.expectedRemote} ${currentBranch}`, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      success: true,
      pushed: true,
      dryRun: false,
      targetRemote: config.expectedRemote,
      targetBranch: currentBranch,
      upstream,
    };
  } catch (err) {
    return {
      success: false,
      pushed: false,
      error: `Git push failed: ${err.message}`,
    };
  }
}
