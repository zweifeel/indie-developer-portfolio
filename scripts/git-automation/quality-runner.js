/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: QUALITY RUNNER (STAGE 3)
 * 
 * Executes project-specific quality gates before commit/push.
 * Zero tolerance: Any failed gate strictly blocks the automation pipeline.
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import { PROJECT_CONFIGS } from './config.js';

/**
 * Runs all configured quality gates for a target project.
 * @param {string} projectSlug Project identifier.
 * @param {string} repoRoot Absolute path to git repository root.
 * @param {object} options Execution options.
 * @returns {object} Detailed quality run results.
 */
export function runQualityGates(projectSlug, repoRoot, options = { fastMode: false }) {
  const config = PROJECT_CONFIGS[projectSlug];
  if (!config) {
    return {
      allPassed: false,
      results: [],
      error: `No configuration found for project "${projectSlug}".`,
    };
  }

  const gates = config.qualityGates || [];
  if (gates.length === 0) {
    return {
      allPassed: true,
      results: [],
      message: 'No automated quality gates configured for this project.',
    };
  }

  const results = [];
  let allPassed = true;

  for (const gate of gates) {
    const startTime = Date.now();
    const commandStr = `${gate.cmd} ${gate.args.join(' ')}`;

    try {
      execSync(commandStr, {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes max per gate
      });

      results.push({
        name: gate.name,
        command: commandStr,
        passed: true,
        durationMs: Date.now() - startTime,
      });
    } catch (err) {
      allPassed = false;
      const errorOutput = err.stderr ? err.stderr.toString() : err.stdout ? err.stdout.toString() : err.message;

      results.push({
        name: gate.name,
        command: commandStr,
        passed: false,
        durationMs: Date.now() - startTime,
        error: errorOutput.substring(0, 500),
      });

      // Fail-closed: Stop on first quality gate failure to preserve resources
      break;
    }
  }

  return {
    allPassed,
    results,
    totalGates: gates.length,
    executedGates: results.length,
  };
}
