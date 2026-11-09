/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — STAGE 3: CONTROLLED GIT AUTOMATION TEST SUITE
 * 
 * Strict Sandbox Testing: All Git commit and push actions are executed in
 * isolated temporary throwaway repositories (%TEMP%/sk_git_test_*).
 * 
 * Zero mutations to the main repository working tree or remote.
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import {
  PROJECT_CONFIGS,
  RepoMappingStatus,
  getProjectConfig,
  sanitizeRemoteUrl,
} from '../../scripts/git-automation/config.js';
import { detectChanges } from '../../scripts/git-automation/change-detection.js';
import { stageFilesSafely } from '../../scripts/git-automation/safe-staging.js';
import { inspectStagedDiff } from '../../scripts/git-automation/diff-inspector.js';
import { runQualityGates } from '../../scripts/git-automation/quality-runner.js';
import { executeCommit } from '../../scripts/git-automation/commit-engine.js';
import { executePush } from '../../scripts/git-automation/push-guard.js';
import { logAuditEntry } from '../../scripts/git-automation/audit-logger.js';

describe('STAGE 3: Controlled Automatic Git Commit & Push Suite', () => {
  let sandboxDir: string;
  let remoteDir: string;

  beforeEach(() => {
    // Create isolated temporary repository sandbox
    sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sk_git_sandbox_'));
    execSync('git init -b master', { cwd: sandboxDir, stdio: 'ignore' });
    execSync('git config user.name "SleepyKoala Test Auditor"', { cwd: sandboxDir, stdio: 'ignore' });
    execSync('git config user.email "auditor@test.local"', { cwd: sandboxDir, stdio: 'ignore' });

    // Create bare remote repository for push testing
    remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sk_remote_sandbox_'));
    execSync('git init --bare', { cwd: remoteDir, stdio: 'ignore' });
  });

  afterEach(() => {
    // Clean up temporary sandboxes safely
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
      fs.rmSync(remoteDir, { recursive: true, force: true });
    } catch {
      // Ignored
    }
  });

  describe('1. Repository Mapping & Root Integrity', () => {
    it('[Scenario 1] accepts verified repository root matching configuration', () => {
      const config = getProjectConfig('indie-developer-portfolio');
      expect(config).toBeDefined();
      expect(config?.slug).toBe('indie-developer-portfolio');
      expect(config?.expectedBranch).toBe('master');
    });

    it('[Scenario 2] blocks operations if repository root is wrong or non-existent', () => {
      const bogusPath = path.join(os.tmpdir(), 'non_existent_repo_dir_12345');
      const changeResult = detectChanges(bogusPath);
      expect(changeResult.isGitRepo).toBe(false);

      const commitResult = executeCommit(bogusPath, {
        projectSlug: 'indie-developer-portfolio',
        type: 'feat',
        summary: 'test wrong root',
        dryRun: false,
      });
      expect(commitResult.success).toBe(false);
    });

    it('[Scenario 3] recognizes matched remote configuration for configured projects', () => {
      const dompetNalarConfig = getProjectConfig('dompetnalar');
      expect(dompetNalarConfig?.expectedRemote).toBe('origin');
      expect(dompetNalarConfig?.expectedRemoteUrl).toContain('FinSmart.git');
    });

    it('[Scenario 4] blocks push if remote does not match expected configuration', () => {
      // Configure different remote in sandbox
      execSync(`git remote add origin file:///${remoteDir.replace(/\\/g, '/')}`, {
        cwd: sandboxDir,
        stdio: 'ignore',
      });

      const pushResult = executePush(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        dryRun: false,
      });
      expect(pushResult.success).toBe(false);
      expect(pushResult.error).toContain('Remote URL and private visibility not yet configured');
    });

    it('[Scenario 5] blocks push when repository has no remotes configured (MISSING_REMOTE)', () => {
      const pushResult = executePush(sandboxDir, {
        projectSlug: 'idle-mining', // Idle mining has no remote
        dryRun: false,
      });
      expect(pushResult.success).toBe(false);
      expect(pushResult.error).toContain('Git repository has no remote configured');
    });

    it('[Scenario 6] blocks push if active branch does not match expected branch', () => {
      // Switch sandbox to feature branch
      execSync('git checkout -b feature/test-work', { cwd: sandboxDir, stdio: 'ignore' });
      execSync(`git remote add origin file:///${remoteDir.replace(/\\/g, '/')}`, {
        cwd: sandboxDir,
        stdio: 'ignore',
      });

      // Temporarily mock canPushRemotely to test branch guard
      const origConfig = PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely;
      PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = true;
      try {
        const pushResult = executePush(sandboxDir, {
          projectSlug: 'indie-developer-portfolio',
          dryRun: false,
        });
        expect(pushResult.success).toBe(false);
        expect(pushResult.error).toContain('Branch mismatch');
      } finally {
        PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = origConfig;
      }
    });

    it('[Scenario 7] blocks push when upstream tracking branch is missing (MISSING_UPSTREAM)', () => {
      // In sandbox, master has no upstream
      fs.writeFileSync(path.join(sandboxDir, 'init.txt'), 'hello');
      execSync('git add init.txt && git commit -m "initial commit"', { cwd: sandboxDir, stdio: 'ignore' });
      execSync(`git remote add origin file:///${remoteDir.replace(/\\/g, '/')}`, {
        cwd: sandboxDir,
        stdio: 'ignore',
      });

      const origConfig = PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely;
      PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = true;
      try {
        const pushResult = executePush(sandboxDir, {
          projectSlug: 'indie-developer-portfolio',
          dryRun: false,
        });
        expect(pushResult.success).toBe(false);
        expect(pushResult.error).toContain('does not have an upstream tracking branch configured');
      } finally {
        PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = origConfig;
      }
    });

    it('[Scenario 8] blocks push when repository visibility is unverified (VISIBILITY_UNVERIFIED)', () => {
      const dompetResult = executePush(sandboxDir, {
        projectSlug: 'dompetnalar',
        dryRun: false,
      });
      expect(dompetResult.success).toBe(false);
      expect(dompetResult.mappingStatus).toBe(RepoMappingStatus.VISIBILITY_UNVERIFIED);
      expect(dompetResult.error).toContain('Repository visibility is unverified');
    });
  });

  describe('2. Safe Staging & Security Allowlist', () => {
    it('[Scenario 9] successfully stages legitimate project source files', () => {
      fs.mkdirSync(path.join(sandboxDir, 'src/components'), { recursive: true });
      const safeFile = path.join(sandboxDir, 'src/components/Navbar.tsx');
      fs.writeFileSync(safeFile, 'export const Navbar = () => null;');

      const result = stageFilesSafely(sandboxDir, ['src/components/Navbar.tsx'], { dryRun: false });
      expect(result.success).toBe(true);
      expect(result.stagedFiles).toContain('src/components/Navbar.tsx');
      expect(result.rejectedFiles.length).toBe(0);

      // Verify Git index contains Navbar.tsx
      const staged = execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' });
      expect(staged).toContain('src/components/Navbar.tsx');
    });

    it('[Scenario 10] refuses to stage prohibited files (.env, release.keystore, sql dumps)', () => {
      const prohibited1 = path.join(sandboxDir, '.env.production');
      const prohibited2 = path.join(sandboxDir, 'release.keystore');
      const prohibited3 = path.join(sandboxDir, 'backup.sql');
      fs.writeFileSync(prohibited1, 'PORT=3000');
      fs.writeFileSync(prohibited2, 'binary');
      fs.writeFileSync(prohibited3, 'SELECT 1;');

      const result = stageFilesSafely(
        sandboxDir,
        ['.env.production', 'release.keystore', 'backup.sql'],
        { dryRun: false }
      );
      expect(result.success).toBe(false);
      expect(result.rejectedFiles.length).toBe(3);
      expect(result.stagedFiles.length).toBe(0);

      // Verify nothing is staged in Git index
      const staged = execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' });
      expect(staged.trim()).toBe('');
    });

    it('[Scenario 11] refuses to stage unknown alien extensions (.xyz, .bin, .exe)', () => {
      const alien1 = path.join(sandboxDir, 'payload.xyz');
      const alien2 = path.join(sandboxDir, 'binary.bin');
      fs.writeFileSync(alien1, 'unknown data');
      fs.writeFileSync(alien2, 'binary data');

      const result = stageFilesSafely(sandboxDir, ['payload.xyz', 'binary.bin'], { dryRun: false });
      expect(result.success).toBe(false);
      expect(result.rejectedFiles.some((f) => f.code === 'UNKNOWN_ARTIFACT_REJECTED')).toBe(true);
    });

    it('[Scenario 12] refuses to stage files containing dummy secret tokens', () => {
      fs.mkdirSync(path.join(sandboxDir, 'src'), { recursive: true });
      const poisonedFile = path.join(sandboxDir, 'src/config.ts');
      // Construct secret dynamically to avoid static scanner tripping
      fs.writeFileSync(poisonedFile, 'export const key = "' + ['AIzaSy', 'SecretTokenSynthetic1234567890abcdef'].join('') + '";');

      const result = stageFilesSafely(sandboxDir, ['src/config.ts'], { dryRun: false });
      expect(result.success).toBe(false);
      expect(result.rejectedFiles.some((f) => f.code === 'SECRET_DETECTED')).toBe(true);
    });

    it('[Scenario 13] refuses to stage files containing unapproved PII in customer context', () => {
      fs.mkdirSync(path.join(sandboxDir, 'src'), { recursive: true });
      const piiFile = path.join(sandboxDir, 'src/testers.json');
      fs.writeFileSync(piiFile, JSON.stringify({ customer_phone: '+6281234567890', customer_nik: '3201011234560001' }));

      const result = stageFilesSafely(sandboxDir, ['src/testers.json'], { dryRun: false });
      expect(result.success).toBe(false);
      expect(result.rejectedFiles.some((f) => f.code === 'PII_DETECTED')).toBe(true);
    });

    it('[Scenario 14] rejects staged diff containing conflict markers or whitespace errors', () => {
      const conflictFile = path.join(sandboxDir, 'Conflict.tsx');
      fs.writeFileSync(
        conflictFile,
        'export const x = 1;\n<<<<<<< HEAD\nconst a = 1;\n=======\nconst a = 2;\n>>>>>>> branch\n'
      );
      execSync('git add Conflict.tsx', { cwd: sandboxDir, stdio: 'ignore' });

      const diffResult = inspectStagedDiff(sandboxDir);
      expect(diffResult.valid).toBe(false);
      expect(diffResult.violations.some((v) => v.includes('conflict markers'))).toBe(true);
    });
  });

  describe('3. Quality Gates & Commit Validation', () => {
    it('[Scenario 15] quality runner aborts if any command fails', () => {
      // Mock quality gate failure
      const testConfig = {
        qualityGates: [{ name: 'Failing Test Gate', cmd: 'node', args: ['-e', 'process.exit(1)'] }],
      };
      PROJECT_CONFIGS['mock-failing-project'] = {
        ...PROJECT_CONFIGS['indie-developer-portfolio'],
        slug: 'mock-failing-project',
        qualityGates: testConfig.qualityGates,
      } as any;

      try {
        const qualityResult = runQualityGates('mock-failing-project', sandboxDir);
        expect(qualityResult.allPassed).toBe(false);
        expect(qualityResult.results[0].passed).toBe(false);
      } finally {
        delete PROJECT_CONFIGS['mock-failing-project'];
      }
    });

    it('[Scenario 16] quality runner passes when all configured gates succeed', () => {
      const testConfig = {
        qualityGates: [{ name: 'Passing Health Gate', cmd: 'node', args: ['-e', 'process.exit(0)'] }],
      };
      PROJECT_CONFIGS['mock-passing-project'] = {
        ...PROJECT_CONFIGS['indie-developer-portfolio'],
        slug: 'mock-passing-project',
        qualityGates: testConfig.qualityGates,
      } as any;

      try {
        const qualityResult = runQualityGates('mock-passing-project', sandboxDir);
        expect(qualityResult.allPassed).toBe(true);
        expect(qualityResult.results[0].passed).toBe(true);
      } finally {
        delete PROJECT_CONFIGS['mock-passing-project'];
      }
    });

    it('[Scenario 17] commit is blocked if staging diff contains secrets', () => {
      const file = path.join(sandboxDir, 'Leaky.tsx');
      fs.writeFileSync(file, 'const token = "' + ['AIzaSy', 'SecretLeakSynthetic1234567890abcdef'].join('') + '";');
      execSync('git add Leaky.tsx', { cwd: sandboxDir, stdio: 'ignore' });

      const commitResult = executeCommit(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        type: 'feat',
        summary: 'add leaky component',
        dryRun: false,
      });

      expect(commitResult.success).toBe(false);
      expect(commitResult.error).toContain('secret token');
    });

    it('[Scenario 18] clean commit succeeds in sandbox with structured message', () => {
      const cleanFile = path.join(sandboxDir, 'Component.tsx');
      fs.writeFileSync(cleanFile, 'export const Component = () => <div>Hello</div>;\n');
      execSync('git add Component.tsx', { cwd: sandboxDir, stdio: 'ignore' });

      const commitResult = executeCommit(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        type: 'feat',
        summary: 'add clean component',
        dryRun: false,
      });

      expect(commitResult.success).toBe(true);
      expect(commitResult.commitHash).toBeDefined();
      expect(commitResult.commitMessage).toBe('feat(indie-developer-portfolio): add clean component');

      // Verify git log confirms commit
      const logMsg = execSync('git log -1 --pretty=%B', { cwd: sandboxDir, encoding: 'utf-8' });
      expect(logMsg.trim()).toBe('feat(indie-developer-portfolio): add clean component');
    });

    it('[Scenario 19] empty commit is rejected', () => {
      // Nothing is staged
      const commitResult = executeCommit(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        type: 'chore',
        summary: 'empty commit attempt',
        dryRun: false,
      });

      expect(commitResult.success).toBe(false);
      expect(commitResult.error).toContain('Staging area is empty');
    });

    it('[Scenario 20] commit formats follow canonical <type>(<project>): <summary>', () => {
      const types = ['feat', 'fix', 'refactor', 'test', 'docs', 'build', 'chore'] as const;

      types.forEach((t) => {
        fs.writeFileSync(path.join(sandboxDir, `${t}.txt`), `test content for ${t}\n`);
        execSync(`git add ${t}.txt`, { cwd: sandboxDir, stdio: 'ignore' });

        const result = executeCommit(sandboxDir, {
          projectSlug: 'indie-developer-portfolio',
          type: t,
          summary: `unit test ${t}`,
          dryRun: false,
        });

        expect(result.success).toBe(true);
        expect(result.commitMessage).toBe(`${t}(indie-developer-portfolio): unit test ${t}`);
      });
    }, 15000);
  });

  describe('4. Push Guards & Failure Recovery', () => {
    it('[Scenario 21] push is rejected if project mapping has canPushRemotely=false', () => {
      const result = executePush(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        dryRun: false,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Push blocked for project');
    });

    it('[Scenario 22] push without upstream is rejected cleanly', () => {
      fs.writeFileSync(path.join(sandboxDir, 'test.txt'), 'clean');
      execSync('git add test.txt && git commit -m "clean commit"', { cwd: sandboxDir, stdio: 'ignore' });
      execSync(`git remote add origin file:///${remoteDir.replace(/\\/g, '/')}`, { cwd: sandboxDir, stdio: 'ignore' });

      const origConfig = PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely;
      PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = true;
      try {
        const result = executePush(sandboxDir, {
          projectSlug: 'indie-developer-portfolio',
          dryRun: false,
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('upstream tracking branch');
      } finally {
        PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = origConfig;
      }
    });

    it('[Scenario 23] push to non-existent remote handles failure safely without hanging', () => {
      fs.mkdirSync(path.join(sandboxDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(sandboxDir, 'docs/test.md'), '# clean');
      execSync('git add docs/test.md && git commit -m "clean commit"', { cwd: sandboxDir, stdio: 'ignore' });
      // Point origin to invalid path
      execSync('git remote add origin file:///non_existent_remote_path_9999', { cwd: sandboxDir, stdio: 'ignore' });
      // Configure upstream tracking and dummy remote ref without contacting remote
      execSync('git config branch.master.remote origin', { cwd: sandboxDir, stdio: 'ignore' });
      execSync('git config branch.master.merge refs/heads/master', { cwd: sandboxDir, stdio: 'ignore' });
      execSync('git update-ref refs/remotes/origin/master HEAD', { cwd: sandboxDir, stdio: 'ignore' });

      const origConfig = PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely;
      PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = true;
      try {
        const result = executePush(sandboxDir, {
          projectSlug: 'indie-developer-portfolio',
          dryRun: false,
        });
        expect(result.success).toBe(false);
        expect(result.pushed).toBe(false);
        expect(result.error).toContain('Git push failed');
      } finally {
        PROJECT_CONFIGS['indie-developer-portfolio'].canPushRemotely = origConfig;
      }
    });

    it('[Scenario 24] remote divergence does not execute force push', () => {
      // Proves push guard command NEVER includes --force or -f
      const pushEngineSource = fs.readFileSync(
        path.resolve(process.cwd(), 'scripts/git-automation/push-guard.js'),
        'utf-8'
      );
      expect(pushEngineSource).not.toContain('--force');
      expect(pushEngineSource).not.toContain(' -f ');
      expect(pushEngineSource).not.toContain('reset --hard');
    });
  });

  describe('5. Operational Hygiene, Dry-Run & Audit Logging', () => {
    it('[Scenario 25] DRY-RUN execution creates 0 commits and leaves Git history unmutated', () => {
      fs.mkdirSync(path.join(sandboxDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(sandboxDir, 'docs/dryrun.md'), '# Dry Run Note\n');
      execSync('git add docs/dryrun.md', { cwd: sandboxDir, stdio: 'ignore' });

      const initialCommitCount = execSync('git rev-list --count HEAD 2>nul || echo 0', {
        cwd: sandboxDir,
        encoding: 'utf-8',
      }).trim();

      const dryRunResult = executeCommit(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        type: 'docs',
        summary: 'dry run test commit',
        dryRun: true,
      });

      expect(dryRunResult.success).toBe(true);
      expect(dryRunResult.dryRun).toBe(true);

      const finalCommitCount = execSync('git rev-list --count HEAD 2>nul || echo 0', {
        cwd: sandboxDir,
        encoding: 'utf-8',
      }).trim();

      expect(finalCommitCount).toBe(initialCommitCount);
    });

    it('[Scenario 26] status inspection does not stage or modify repository files', () => {
      fs.writeFileSync(path.join(sandboxDir, 'unstaged.txt'), 'dirty content');
      const statusBefore = execSync('git status --porcelain', { cwd: sandboxDir, encoding: 'utf-8' });

      const changes = detectChanges(sandboxDir);
      expect(changes.hasChanges).toBe(true);

      const statusAfter = execSync('git status --porcelain', { cwd: sandboxDir, encoding: 'utf-8' });
      expect(statusAfter).toBe(statusBefore);
    });

    it('[Scenario 27] aborted staging safely rolls back index without deleting working tree files', () => {
      const workingFile = path.join(sandboxDir, 'important-user-work.txt');
      fs.writeFileSync(workingFile, 'valuable user progress');

      // Attempt staging along with a prohibited file
      const result = stageFilesSafely(
        sandboxDir,
        ['important-user-work.txt', '.env.secret'],
        { dryRun: false }
      );

      expect(result.success).toBe(false);
      // Working tree file must still exist unharmed!
      expect(fs.existsSync(workingFile)).toBe(true);
      expect(fs.readFileSync(workingFile, 'utf-8')).toBe('valuable user progress');

      // Index must be empty
      const staged = execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' });
      expect(staged.trim()).toBe('');
    });

    it('[Scenario 28] audit log sanitizes remote URLs and does not leak embedded credentials', () => {
      const leakyUrl = 'https://user:ghp_SuperSecretToken1234567890abcdef@github.com/org/repo.git';
      const cleanUrl = sanitizeRemoteUrl(leakyUrl);

      expect(cleanUrl).not.toContain('ghp_SuperSecretToken');
      expect(cleanUrl).toContain('***@github.com');

      const auditSuccess = logAuditEntry({
        projectId: 'test_project',
        projectSlug: 'test',
        mode: 'PUSH',
        remoteUrl: leakyUrl,
        status: 'BLOCKED',
        failureReason: 'Blocked for testing',
      });
      expect(auditSuccess).toBe(true);
    });

    it('[Scenario 29] cross-project mapping confusion is prevented (project slug isolation)', () => {
      // Attempting to commit to dompetnalar path with indie-developer-portfolio slug
      const result = executeCommit(sandboxDir, {
        projectSlug: 'the-broken-origin', // TBO is strictly blocked
        type: 'feat',
        summary: 'unauthorized cross-project action',
        dryRun: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('is not eligible for automatic commit');
      expect(result.error).toContain('Strict policy rule');
    });

    it('[Scenario 30] push mode exclusively targets verified remotes and upstreams', () => {
      // In sandbox, set up a real remote and upstream
      fs.writeFileSync(path.join(sandboxDir, 'valid.txt'), 'push me');
      execSync('git add valid.txt && git commit -m "valid commit"', { cwd: sandboxDir, stdio: 'ignore' });
      execSync(`git remote add origin file:///${remoteDir.replace(/\\/g, '/')}`, { cwd: sandboxDir, stdio: 'ignore' });
      execSync('git push -u origin master', { cwd: sandboxDir, stdio: 'ignore' });

      // Add one more commit to push
      fs.writeFileSync(path.join(sandboxDir, 'valid2.txt'), 'push me too');
      execSync('git add valid2.txt && git commit -m "second commit"', { cwd: sandboxDir, stdio: 'ignore' });

      // Mock push configuration for isolated sandbox test
      PROJECT_CONFIGS['mock-verified-push'] = {
        ...PROJECT_CONFIGS['indie-developer-portfolio'],
        slug: 'mock-verified-push',
        expectedRemote: 'origin',
        expectedBranch: 'master',
        canPushRemotely: true,
      } as any;

      try {
        const pushResult = executePush(sandboxDir, {
          projectSlug: 'mock-verified-push',
          dryRun: false,
        });

        expect(pushResult.success).toBe(true);
        expect(pushResult.pushed).toBe(true);
        expect(pushResult.targetRemote).toBe('origin');
        expect(pushResult.targetBranch).toBe('master');

        // Verify remote received the commit
        const remoteRev = execSync('git rev-parse HEAD', { cwd: remoteDir, encoding: 'utf-8' }).trim();
        const localRev = execSync('git rev-parse HEAD', { cwd: sandboxDir, encoding: 'utf-8' }).trim();
        expect(remoteRev).toBe(localRev);
      } finally {
        delete PROJECT_CONFIGS['mock-verified-push'];
      }
    });
  });

  describe('6. Hardening & Final Acceptance Verification', () => {
    it('[Scenario 31] safe staging preserves pre-existing user staged files across all failure cases', () => {
      // 1. Initial base commit
      fs.mkdirSync(path.join(sandboxDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(sandboxDir, 'src/init.ts'), 'export const base = 1;');
      execSync('git add src/init.ts && git commit -m "base"', { cwd: sandboxDir, stdio: 'ignore' });

      // File A: Pre-staged by user before automation starts
      fs.writeFileSync(path.join(sandboxDir, 'src/FileA.tsx'), 'export const FileA = () => <div>Pre-staged</div>;');
      execSync('git add src/FileA.tsx', { cwd: sandboxDir, stdio: 'ignore' });
      expect(execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' }).trim()).toContain('src/FileA.tsx');

      // File B: Unstaged user file in working directory
      fs.writeFileSync(path.join(sandboxDir, 'src/FileB.tsx'), 'export const FileB = () => <div>Unstaged</div>;');

      // File C: Contains secret dummy token
      fs.writeFileSync(
        path.join(sandboxDir, 'src/FileC.ts'),
        'export const token = "' + ['AIzaSy', 'SecretTokenDummy999888777666555444333'].join('') + '";'
      );

      // File E: Unapproved extension
      fs.writeFileSync(path.join(sandboxDir, 'FileE.xyz'), 'unapproved');

      // Failure Test 1: Batch contains secret (File C)
      const res1 = stageFilesSafely(sandboxDir, ['src/FileB.tsx', 'src/FileC.ts'], { dryRun: false });
      expect(res1.success).toBe(false);
      // File A MUST still be staged!
      let stagedAfter = execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' }).trim();
      expect(stagedAfter).toContain('src/FileA.tsx');
      expect(stagedAfter).not.toContain('src/FileB.tsx');
      // Working tree File B must still exist!
      expect(fs.existsSync(path.join(sandboxDir, 'src/FileB.tsx'))).toBe(true);

      // Failure Test 2: Batch contains unapproved file (File E)
      const res2 = stageFilesSafely(sandboxDir, ['src/FileB.tsx', 'FileE.xyz'], { dryRun: false });
      expect(res2.success).toBe(false);
      stagedAfter = execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' }).trim();
      expect(stagedAfter).toContain('src/FileA.tsx');
      expect(stagedAfter).not.toContain('src/FileB.tsx');

      // Failure Test 3: Simulation of execution error during git add (File D)
      const res3 = stageFilesSafely(sandboxDir, ['src/non-existent-FileD.ts'], { dryRun: false });
      expect(res3.success).toBe(false);
      stagedAfter = execSync('git diff --cached --name-only', { cwd: sandboxDir, encoding: 'utf-8' }).trim();
      // Even after execution error rollback, File A remains staged!
      expect(stagedAfter).toContain('src/FileA.tsx');
    });

    it('[Scenario 32] contextual conflict marker detection differentiates real conflicts from markdown constructs', () => {
      // 0. Base commit to ensure HEAD exists
      fs.writeFileSync(path.join(sandboxDir, 'init.txt'), 'init');
      execSync('git add init.txt && git commit -m "init"', { cwd: sandboxDir, stdio: 'ignore' });

      // 1. Real Git conflict marker in code file -> REJECTED
      fs.mkdirSync(path.join(sandboxDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(sandboxDir, 'src/Conflict.ts'),
        'export const a = 1;\n<<<<<<< HEAD\nconst b = 1;\n=======\nconst b = 2;\n>>>>>>> feat\n'
      );
      execSync('git add src/Conflict.ts', { cwd: sandboxDir, stdio: 'ignore' });
      const resReal = inspectStagedDiff(sandboxDir);
      expect(resReal.valid).toBe(false);
      expect(resReal.violations.some((v) => v.includes('conflict marker'))).toBe(true);
      execSync('git reset HEAD src/Conflict.ts', { cwd: sandboxDir, stdio: 'ignore' });
      fs.rmSync(path.join(sandboxDir, 'src/Conflict.ts'));

      // 2. Markdown Setext Heading (=======) -> ACCEPTED
      fs.mkdirSync(path.join(sandboxDir, 'docs'), { recursive: true });
      fs.writeFileSync(
        path.join(sandboxDir, 'docs/Setext.md'),
        '# Main Documentation\n\nSection Title\n=======\n\nDocumentation body text.\n'
      );
      execSync('git add docs/Setext.md', { cwd: sandboxDir, stdio: 'ignore' });
      const resSetext = inspectStagedDiff(sandboxDir);
      expect(resSetext.valid).toBe(true);
      expect(resSetext.violations.length).toBe(0);
      execSync('git reset HEAD docs/Setext.md', { cwd: sandboxDir, stdio: 'ignore' });
      fs.rmSync(path.join(sandboxDir, 'docs/Setext.md'));

      // 3. Documentation mentioning conflict markers inside code block -> ACCEPTED
      fs.writeFileSync(
        path.join(sandboxDir, 'docs/Help.md'),
        '# Merge Help\n\nWhen a conflict occurs:\n```text\n<<<<<<< HEAD\ncode\n=======\nalternate\n>>>>>>> branch\n```\n'
      );
      execSync('git add docs/Help.md', { cwd: sandboxDir, stdio: 'ignore' });
      const resCodeBlock = inspectStagedDiff(sandboxDir);
      expect(resCodeBlock.valid).toBe(true);
      expect(resCodeBlock.violations.length).toBe(0);
      execSync('git reset HEAD docs/Help.md', { cwd: sandboxDir, stdio: 'ignore' });
      fs.rmSync(path.join(sandboxDir, 'docs/Help.md'));

      // 4. Markdown table divider with ======= -> ACCEPTED
      fs.writeFileSync(
        path.join(sandboxDir, 'docs/Table.md'),
        '| Name | Description |\n| ======= | ======= |\n| Item 1 | Details |\n'
      );
      execSync('git add docs/Table.md', { cwd: sandboxDir, stdio: 'ignore' });
      const resTable = inspectStagedDiff(sandboxDir);
      expect(resTable.valid).toBe(true);
      expect(resTable.violations.length).toBe(0);
      execSync('git reset HEAD docs/Table.md', { cwd: sandboxDir, stdio: 'ignore' });
      fs.rmSync(path.join(sandboxDir, 'docs/Table.md'));

      // 5. Real trailing whitespace error -> REJECTED
      fs.writeFileSync(path.join(sandboxDir, 'src/Whitespace.ts'), 'export const clean = 10;   \n');
      execSync('git add src/Whitespace.ts', { cwd: sandboxDir, stdio: 'ignore' });
      const resWhitespace = inspectStagedDiff(sandboxDir);
      expect(resWhitespace.valid).toBe(false);
      expect(resWhitespace.violations.some((v) => v.includes('Whitespace error'))).toBe(true);
    }, 15000);

    it('[Scenario 33] local commit and remote push policies are evaluated independently', () => {
      const portfolio = getProjectConfig('indie-developer-portfolio');
      expect(portfolio?.canCommitLocally).toBe(true);
      expect(portfolio?.canPushRemotely).toBe(false);

      const dompet = getProjectConfig('dompetnalar');
      expect(dompet?.canCommitLocally).toBe(false);
      expect(dompet?.canPushRemotely).toBe(false);
      expect(dompet?.mappingStatus).toBe(RepoMappingStatus.VISIBILITY_UNVERIFIED);

      // Verify that canCommitLocally=true allows commit in sandbox even if canPushRemotely=false
      fs.mkdirSync(path.join(sandboxDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(sandboxDir, 'src/local.ts'), 'export const local = 99;\n');
      execSync('git add src/local.ts', { cwd: sandboxDir, stdio: 'ignore' });

      const commitResult = executeCommit(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        type: 'feat',
        summary: 'independent local commit',
        dryRun: false,
      });
      expect(commitResult.success).toBe(true);
      expect(commitResult.commitHash).toBeDefined();

      // But push for indie-developer-portfolio is strictly rejected
      const pushResult = executePush(sandboxDir, {
        projectSlug: 'indie-developer-portfolio',
        dryRun: false,
      });
      expect(pushResult.success).toBe(false);
      expect(pushResult.error).toContain('Push blocked for project');
    });
  });
});
