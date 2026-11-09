/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: COMMIT ENGINE (STAGE 3)
 * 
 * Creates structured, verified commits following the canonical format:
 * `<type>(<project>): <summary>`
 * 
 * Strictly prohibits empty commits, history rewrites, and unauthorized amends.
 * In DRY-RUN mode, no Git objects are created.
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import { COMMIT_TYPES, PROJECT_CONFIGS } from './config.js';
import { inspectStagedDiff } from './diff-inspector.js';

/**
 * @typedef {object} CommitOptions
 * @property {string} projectSlug
 * @property {string} type
 * @property {string} summary
 * @property {string} [body]
 * @property {boolean} [dryRun]
 */

/**
 * Validates and executes a controlled Git commit.
 * @param {string} repoRoot Absolute path to git repository root.
 * @param {CommitOptions} options Commit options and message metadata.
 * @returns {object} Commit execution result.
 */
export function executeCommit(repoRoot, options) {
  const { projectSlug, type, summary, body, dryRun = true } = options;

  // 1. Verify project mapping
  const config = PROJECT_CONFIGS[projectSlug];
  if (!config) {
    return {
      success: false,
      error: `Project "${projectSlug}" is not recognized in repository mapping.`,
    };
  }

  if (!config.canCommitLocally) {
    return {
      success: false,
      error: `Project "${projectSlug}" is not eligible for automatic commit. Reason: ${config.blockReason}`,
    };
  }

  // 2. Validate commit message format
  if (!COMMIT_TYPES.includes(type)) {
    return {
      success: false,
      error: `Invalid commit type "${type}". Allowed types: ${COMMIT_TYPES.join(', ')}.`,
    };
  }

  if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
    return {
      success: false,
      error: 'Commit summary is required and cannot be empty.',
    };
  }

  const commitTitle = `${type}(${projectSlug}): ${summary.trim()}`;
  const fullMessage = body ? `${commitTitle}\n\n${body.trim()}` : commitTitle;

  // 3. Inspect staged diff
  const diffResult = inspectStagedDiff(repoRoot, projectSlug);
  if (!diffResult.valid || diffResult.empty) {
    return {
      success: false,
      commitMessage: fullMessage,
      error: diffResult.violations.join('; ') || 'Cannot commit: Staging area is invalid or empty.',
    };
  }

  // 4. In DRY-RUN mode, return planned commit without execution
  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      commitMessage: fullMessage,
      stagedSummary: diffResult.summary,
      message: 'Dry-run successful: Commit validated and ready for execution.',
    };
  }

  // 5. Execute commit
  try {
    // Write commit message via stdio to prevent shell quoting vulnerabilities
    execSync('git commit -F -', {
      cwd: repoRoot,
      input: fullMessage,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const commitHash = execSync('git rev-parse HEAD', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    return {
      success: true,
      dryRun: false,
      commitHash,
      commitMessage: fullMessage,
      stagedSummary: diffResult.summary,
    };
  } catch (err) {
    return {
      success: false,
      dryRun: false,
      commitMessage: fullMessage,
      error: `Git commit failed: ${err.message}`,
    };
  }
}
