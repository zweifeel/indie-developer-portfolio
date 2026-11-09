#!/usr/bin/env node
/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT HOOKS INSTALLER
 * 
 * Automatically configures pre-commit and pre-push hooks on fresh clones.
 * Can be run via: node scripts/setup-hooks.js
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

export function installHooks(rootDir = process.cwd()) {
  const gitDir = path.resolve(rootDir, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('ℹ️  Not a git repository root. Skipping hook installation.');
    return { success: false, reason: 'NOT_GIT_REPO' };
  }

  const hooksDir = path.resolve(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const preCommitContent = '#!/bin/sh\nnode scripts/pre-commit-check.js\n';
  const prePushContent = '#!/bin/sh\nnode scripts/pre-push-check.js\n';

  fs.writeFileSync(path.resolve(hooksDir, 'pre-commit'), preCommitContent, { mode: 0o777 });
  fs.writeFileSync(path.resolve(hooksDir, 'pre-push'), prePushContent, { mode: 0o777 });

  console.log('✅ Git security hooks successfully installed in .git/hooks/');
  return { success: true };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/setup-hooks.js')) {
  installHooks(process.cwd());
}
