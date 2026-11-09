#!/usr/bin/env node
/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CONTROLLED GIT AUTOMATION CLI (STAGE 3)
 * 
 * Usage:
 *   node scripts/git-automation/cli.js --mode STATUS
 *   node scripts/git-automation/cli.js --project indie-developer-portfolio --mode DRY-RUN
 *   node scripts/git-automation/cli.js --project indie-developer-portfolio --mode COMMIT --type feat --message "summary"
 *   node scripts/git-automation/cli.js --project indie-developer-portfolio --mode PUSH
 * 
 * DEFAULT MODE IS ALWAYS "DRY-RUN". PUSH IS NEVER THE DEFAULT.
 * ============================================================================
 */

import {
  ExecutionMode,
  DEFAULT_EXECUTION_MODE,
  PROJECT_CONFIGS,
  COMMIT_TYPES,
  getProjectConfig,
} from './config.js';
import { detectChanges } from './change-detection.js';
import { stageFilesSafely } from './safe-staging.js';
import { inspectStagedDiff } from './diff-inspector.js';
import { runQualityGates } from './quality-runner.js';
import { executeCommit } from './commit-engine.js';
import { executePush } from './push-guard.js';
import { logAuditEntry } from './audit-logger.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: DEFAULT_EXECUTION_MODE,
    project: 'indie-developer-portfolio',
    type: 'chore',
    message: '',
    all: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      options.mode = args[++i].toUpperCase();
    } else if (arg === '--project' && args[i + 1]) {
      options.project = args[++i];
    } else if (arg === '--type' && args[i + 1]) {
      options.type = args[++i].toLowerCase();
    } else if (arg === '--message' && args[i + 1]) {
      options.message = args[++i];
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🛡️  SleepyKoala Studio — Git Automation CLI (Stage 3)

Usage:
  node scripts/git-automation/cli.js [options]

Options:
  --project <slug>     Target project slug (default: indie-developer-portfolio)
  --mode <mode>        Execution mode: STATUS, DRY-RUN, COMMIT, PUSH (default: DRY-RUN)
  --type <type>        Commit type: ${COMMIT_TYPES.join(', ')} (default: chore)
  --message <summary>  Commit summary message
  --all                Show status for all configured canonical projects
  --help, -h           Show this help message
`);
}

function printProjectStatus(projectSlug) {
  const config = PROJECT_CONFIGS[projectSlug];
  if (!config) {
    console.error(`❌ Project "${projectSlug}" not recognized in repository mapping.`);
    return;
  }

  console.log(`\n============================================================`);
  console.log(`📦 Project: ${config.name} (${config.slug})`);
  console.log(`📁 Local Root: ${config.localRoot}`);
  console.log(`🏷️  Mapping Status: ${config.mappingStatus}`);
  console.log(`🌿 Expected Branch: ${config.expectedBranch || 'N/A'}`);
  console.log(`🔗 Remote: ${config.expectedRemote || 'NONE'} (${config.expectedRemoteUrl || 'NONE'})`);
  console.log(`🔒 Upstream: ${config.upstream || 'NONE'}`);
  console.log(`✅ Auto-Commit Eligible: ${config.canCommitLocally ? 'YES' : 'NO'}`);
  console.log(`🚀 Auto-Push Eligible:   ${config.canPushRemotely ? 'YES' : 'NO'}`);
  if (config.blockReason) {
    console.log(`⚠️  Guard Reason:        ${config.blockReason}`);
  }

  try {
    const changes = detectChanges(config.localRoot);
    if (!changes.isGitRepo) {
      console.log(`ℹ️  Git Status: Directory is not a Git repository.`);
    } else {
      console.log(`📊 Working Tree Changes: ${changes.totalChanges} file(s)`);
      if (changes.totalChanges > 0) {
        console.log(`   - Modified: ${changes.modified.length}`);
        console.log(`   - Added:    ${changes.added.length}`);
        console.log(`   - Deleted:  ${changes.deleted.length}`);
        console.log(`   - Untracked:${changes.untracked.length}`);
      }
    }
  } catch (err) {
    console.log(`⚠️  Could not inspect Git status: ${err.message}`);
  }
}

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  console.log(`\n🛡️  SleepyKoala Studio — Git Automation Engine`);
  console.log(`🎯 Target Project: ${opts.project}`);
  console.log(`⚙️  Active Mode:    ${opts.mode}`);

  // Mode: STATUS
  if (opts.mode === ExecutionMode.STATUS || opts.all) {
    if (opts.all) {
      for (const slug of Object.keys(PROJECT_CONFIGS)) {
        printProjectStatus(slug);
      }
    } else {
      printProjectStatus(opts.project);
    }
    process.exit(0);
  }

  const config = getProjectConfig(opts.project);
  if (!config) {
    console.error(`\n❌ Error: Unknown project slug "${opts.project}". Run with --all to view configured projects.`);
    process.exit(1);
  }

  // Detect working tree changes
  const changeResult = detectChanges(config.localRoot);
  if (!changeResult.isGitRepo) {
    console.error(`\n❌ Error: "${config.localRoot}" is not a Git repository.`);
    process.exit(1);
  }

  const candidateFiles = changeResult.changes
    .filter((c) => !c.isTemporary && !c.isBuildOutput)
    .map((c) => c.path);

  console.log(`\n🔍 Working tree inspection: ${changeResult.totalChanges} total, ${candidateFiles.length} candidate file(s).`);

  // Mode: DRY-RUN
  if (opts.mode === ExecutionMode.DRY_RUN) {
    console.log(`\n[DRY-RUN] Simulating safe staging and quality verification...`);
    const stagingSim = stageFilesSafely(config.localRoot, candidateFiles, { dryRun: true });

    if (!stagingSim.success) {
      console.error(`❌ [DRY-RUN] Staging validation failed:`);
      stagingSim.rejectedFiles.forEach((f) => console.error(`   - ${f.path}: ${f.reason}`));
      process.exit(1);
    }

    console.log(`✅ [DRY-RUN] Staging policy verified. ${stagingSim.stagedFiles.length} file(s) eligible.`);
    if (opts.message) {
      const plannedMsg = `${opts.type}(${opts.project}): ${opts.message}`;
      console.log(`📝 [DRY-RUN] Planned Commit Message:\n   "${plannedMsg}"`);
    }

    logAuditEntry({
      projectId: config.id,
      projectSlug: config.slug,
      mode: ExecutionMode.DRY_RUN,
      repoRoot: config.localRoot,
      status: 'SUCCESS',
      filesConsidered: candidateFiles,
      filesStaged: stagingSim.stagedFiles,
    });

    console.log(`\n🎉 [DRY-RUN COMPLETED] Repository remains completely unmutated.`);
    process.exit(0);
  }

  // Mode: COMMIT
  if (opts.mode === ExecutionMode.COMMIT) {
    if (!config.canCommitLocally) {
      console.error(`\n❌ Auto-commit blocked: ${config.blockReason}`);
      process.exit(1);
    }

    if (!opts.message) {
      console.error(`\n❌ Error: Commit message summary is required. Use --message "<summary>".`);
      process.exit(1);
    }

    // Run Quality Gates before commit
    console.log(`\n🧪 Running Quality Gates for ${config.name}...`);
    const qualityResult = runQualityGates(config.slug, config.localRoot);
    if (!qualityResult.allPassed) {
      console.error(`\n❌ Quality gates failed! Commit aborted.`);
      qualityResult.results.forEach((r) => {
        if (!r.passed) console.error(`   - [FAIL] ${r.name}: ${r.error}`);
      });
      process.exit(1);
    }

    // Safe Staging
    console.log(`\n📦 Staging eligible files safely...`);
    const stagingResult = stageFilesSafely(config.localRoot, candidateFiles, { dryRun: false });
    if (!stagingResult.success) {
      console.error(`\n❌ Staging aborted: ${stagingResult.error}`);
      process.exit(1);
    }

    // Execute Commit
    console.log(`\n💾 Executing commit...`);
    const commitResult = executeCommit(config.localRoot, {
      projectSlug: config.slug,
      type: opts.type,
      summary: opts.message,
      dryRun: false,
    });

    if (!commitResult.success) {
      console.error(`\n❌ Commit execution failed: ${commitResult.error}`);
      process.exit(1);
    }

    console.log(`\n✅ Commit created successfully!`);
    console.log(`   SHA:     ${commitResult.commitHash}`);
    console.log(`   Message: ${commitResult.commitMessage}`);

    logAuditEntry({
      projectId: config.id,
      projectSlug: config.slug,
      mode: ExecutionMode.COMMIT,
      repoRoot: config.localRoot,
      status: 'SUCCESS',
      commitHash: commitResult.commitHash,
      filesStaged: stagingResult.stagedFiles,
      qualityGatesPassed: true,
    });

    process.exit(0);
  }

  // Mode: PUSH
  if (opts.mode === ExecutionMode.PUSH) {
    console.log(`\n🚀 Validating push guard prerequisites...`);
    const pushResult = executePush(config.localRoot, {
      projectSlug: config.slug,
      dryRun: false,
    });

    if (!pushResult.success) {
      console.error(`\n❌ Push rejected: ${pushResult.error}`);
      logAuditEntry({
        projectId: config.id,
        projectSlug: config.slug,
        mode: ExecutionMode.PUSH,
        repoRoot: config.localRoot,
        status: 'BLOCKED',
        failureReason: pushResult.error,
      });
      process.exit(1);
    }

    console.log(`\n✅ Push executed successfully to ${pushResult.targetRemote}/${pushResult.targetBranch}`);
    process.exit(0);
  }

  console.error(`\n❌ Unknown execution mode "${opts.mode}". Use STATUS, DRY-RUN, COMMIT, or PUSH.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(`\n❌ Unhandled exception: ${err.message}`);
  process.exit(1);
});
