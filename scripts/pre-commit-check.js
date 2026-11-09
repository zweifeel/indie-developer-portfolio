#!/usr/bin/env node
/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PRE-COMMIT SECURITY HOOK (TASK 6)
 * 
 * Local, Free-Tier, Zero-Network Git Pre-Commit Guard
 * 
 * Verifications executed before any commit:
 * 1. File Policy Validation (Denylist & Default Deny enforcement on staged files)
 * 2. Secret Scanning (API keys, private keys, keystores, database credentials)
 * 3. Privacy Scanning (Real personal emails, phone numbers, NIK, credit cards)
 * 4. Staged File Sanitization Verification
 * 
 * Fail-Closed: If any violation is found, commit is blocked with exit code 1.
 * Non-Destructive: Never modifies or deletes user files. Values are masked.
 * ============================================================================
 */

import { checkRepositoryFilePolicy } from './check-file-policy.js';
import { runSecurityScan } from './security-scan.js';
import { runPrivacyScan } from './privacy-scan.js';

export function runPreCommitChecks(rootDir = process.cwd(), options = {}) {
  const mode = options.mode || 'staged';
  console.log(`\n🚦 SleepyKoala Studio — Pre-Commit Security Guard (Mode: ${mode})`);
  console.log(`📁 Workspace: ${rootDir}\n`);

  let passed = true;
  const failureReasons = [];

  // 1. File Policy Check
  console.log('1️⃣  Running File Policy & Denylist Check on staged files...');
  const policyResult = checkRepositoryFilePolicy(rootDir, { mode, files: options.files });
  if (!policyResult.success) {
    passed = false;
    failureReasons.push('File Policy Violation: Denied or unknown files staged for commit.');
    console.error(`   ❌ Failed: ${policyResult.denied.length} denied file(s), ${policyResult.unknown.length} unknown artifact(s).`);
    policyResult.denied.forEach((d) => console.error(`      🚫 ${d.file}: ${d.reason}`));
    policyResult.unknown.forEach((u) => console.error(`      ❓ ${u.file}: ${u.reason}`));
  } else {
    console.log(`   ✅ File Policy Passed (${policyResult.allowed.length} file(s) compliant).`);
  }

  // 2. Secret Scan
  console.log('\n2️⃣  Running Local Secret Scan on staged files...');
  const secretResult = runSecurityScan(rootDir, { mode, files: options.files });
  if (!secretResult.success) {
    passed = false;
    failureReasons.push(`Secret Leakage: Detected ${secretResult.actionableFindings} actionable secret(s).`);
    console.error(`   ❌ Failed: ${secretResult.actionableFindings} secret(s) found!`);
    secretResult.actionable.forEach((f, idx) => {
      console.error(`      [${idx + 1}] [${f.severity}] ${f.description}`);
      console.error(`          File:    ${f.file}:${f.line}`);
      console.error(`          Preview: ${f.maskedFinding}`);
    });
  } else {
    console.log(`   ✅ Secret Scan Passed (${secretResult.totalFilesScanned} file(s) scanned, zero secrets).`);
  }

  // 3. Privacy Scan
  console.log('\n3️⃣  Running Local Privacy & PII Scan on staged files...');
  const privacyResult = runPrivacyScan(rootDir, { mode, files: options.files });
  if (!privacyResult.success) {
    passed = false;
    failureReasons.push(`Privacy Violation: Detected ${privacyResult.actionableFindings} unapproved PII item(s).`);
    console.error(`   ❌ Failed: ${privacyResult.actionableFindings} PII item(s) found!`);
    privacyResult.actionable.forEach((f, idx) => {
      console.error(`      [${idx + 1}] [${f.severity}] ${f.description}`);
      console.error(`          File:    ${f.file}:${f.line}`);
      console.error(`          Preview: ${f.maskedFinding}`);
    });
  } else {
    console.log(`   ✅ Privacy Scan Passed (${privacyResult.totalFilesScanned} file(s) scanned, zero PII).`);
  }

  console.log('\n' + '='.repeat(70));
  if (passed) {
    console.log('🎉 PRE-COMMIT VERIFICATION PASSED — All security standards met.');
    console.log('='.repeat(70) + '\n');
    return { success: true };
  } else {
    console.error('⛔ PRE-COMMIT BLOCKED — Commit rejected due to security policy violations.');
    failureReasons.forEach((r) => console.error(`   • ${r}`));
    console.error('='.repeat(70) + '\n');
    return { success: false, failureReasons };
  }
}

/**
 * CLI Entrypoint
 */
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/pre-commit-check.js')) {
  const mode = process.argv.includes('--all') ? 'all' : 'staged';
  const result = runPreCommitChecks(process.cwd(), { mode });
  process.exit(result.success ? 0 : 1);
}
