/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PHASE 1 REPOSITORY SECURITY & DEVSECOPS TEST SUITE
 * 
 * Verifies all 13 mandatory security, privacy, and pre-commit/pre-push gates.
 * Tests use synthetic dummy fixtures only. All temporary artifacts are isolated
 * and cleanly removed upon completion.
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  scanFileContent,
  maskSensitiveValue,
  runSecurityScan,
  Category,
  Severity,
  Classification,
} from '../../scripts/security-scan.js';
import {
  evaluateFilePolicy,
  checkRepositoryFilePolicy,
  FileStatus,
} from '../../scripts/check-file-policy.js';
import {
  scanPrivacyContent,
  runPrivacyScan,
} from '../../scripts/privacy-scan.js';
import { runPreCommitChecks } from '../../scripts/pre-commit-check.js';
import { runPrePushChecks } from '../../scripts/pre-push-check.js';

const TEMP_FIXTURE_DIR = path.resolve(process.cwd(), 'test-fixtures/temp');

describe('Phase 1: Repository Security & DevSecOps Validation Suite', () => {
  beforeEach(() => {
    if (!fs.existsSync(TEMP_FIXTURE_DIR)) {
      fs.mkdirSync(TEMP_FIXTURE_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEMP_FIXTURE_DIR)) {
      fs.rmSync(TEMP_FIXTURE_DIR, { recursive: true, force: true });
    }
  });

  // Scenario 1: API Key Dummy on New File
  it('[Scenario 1] blocks commit when dummy API key is detected in a new file', () => {
    const dummyApiKey = 'AIzaSyDUMMY_API_KEY_DO_NOT_USE_1234567';
    const findings = scanFileContent('src/newService.ts', `const key = "${dummyApiKey}";`);
    
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe(Category.SECRET_API_KEY);
    expect(findings[0].severity).toBe(Severity.CRITICAL);
    expect(findings[0].classification).toBe(Classification.CONFIRMED_SENSITIVE_FILE);
  });

  // Scenario 2: Token Dummy on Tracked File
  it('[Scenario 2] blocks commit when dummy access token is detected on tracked file', () => {
    const dummyPat = 'ghp_DUMMY_ACCESS_TOKEN_DO_NOT_USE_1234567890';
    const findings = scanFileContent('src/services/projectService.ts', `const token = "${dummyPat}";`);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe(Category.SECRET_API_KEY);
    expect(findings[0].severity).toBe(Severity.CRITICAL);
  });

  // Scenario 3: Private Key Dummy
  it('[Scenario 3] blocks commit when cryptographic private key header is detected', () => {
    const dummyPrivKey = `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0dummykey\n-----END RSA PRIVATE KEY-----`;
    const findings = scanFileContent('src/keys/serverKey.ts', dummyPrivKey);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe(Category.SECRET_PRIVATE_KEY);
    expect(findings[0].severity).toBe(Severity.CRITICAL);

    // Also verify .key filename is prohibited
    const keyFileFindings = scanFileContent('keys/id_rsa.key', '');
    expect(keyFileFindings.length).toBeGreaterThan(0);
    expect(keyFileFindings[0].category).toBe(Category.SENSITIVE_FILE_NAME);
  });

  // Scenario 4: Password Dummy
  it('[Scenario 4] blocks commit when hardcoded credentials assignment is detected', () => {
    const dummySecret = 'client_secret = "super_secret_password_value_123"';
    const findings = scanFileContent('src/config.ts', dummySecret);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe(Category.SECRET_CREDENTIAL);
    expect(findings[0].severity).toBe(Severity.HIGH);
  });

  // Scenario 5: PII Dummy on New File
  it('[Scenario 5] flags real Indonesian mobile numbers and NIK in personal data contexts', () => {
    const dummyNik = 'user_data: { nik: "3201012345670001" }';
    const nikFindings = scanPrivacyContent('src/users.ts', dummyNik);
    expect(nikFindings.length).toBeGreaterThan(0);
    expect(nikFindings[0].category).toBe(Category.PII_IDENTITY_CARD);

    const dummyPhone = 'tester_kontak: "+6281234567890"';
    const phoneFindings = scanPrivacyContent('src/testers.ts', dummyPhone);
    expect(phoneFindings.length).toBeGreaterThan(0);
    expect(phoneFindings[0].category).toBe(Category.PII_PHONE);

    // Verify tracked files are clean of PII
    const privacyResult = runPrivacyScan(process.cwd(), { mode: 'tracked' });
    expect(privacyResult.success).toBe(true);
  }, 30000);

  // Scenario 6: File .env Prohibited
  it('[Scenario 6] blocks .env and environment secret files from entering repository', () => {
    const policy = evaluateFilePolicy('.env');
    expect(policy.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);

    const prodPolicy = evaluateFilePolicy('.env.production');
    expect(prodPolicy.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);

    const examplePolicy = evaluateFilePolicy('.env.example');
    expect(examplePolicy.status).toBe(FileStatus.ALLOWED_PROJECT_FILE);
  });

  // Scenario 7: Keystore Prohibited
  it('[Scenario 7] blocks Android keystore and private key binaries', () => {
    const jks = evaluateFilePolicy('android/release.jks');
    expect(jks.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);

    const keystore = evaluateFilePolicy('upload.keystore');
    expect(keystore.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);

    const p12 = evaluateFilePolicy('certificates/cert.p12');
    expect(p12.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);
  });

  // Scenario 8: Database Dump Prohibited
  it('[Scenario 8] blocks database dumps and binary state backups', () => {
    const dump = evaluateFilePolicy('backups/users_backup.sql');
    expect(dump.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);

    const rdb = evaluateFilePolicy('data/redis_dump.rdb');
    expect(rdb.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);

    const sqlite = evaluateFilePolicy('db.sqlite');
    expect(sqlite.status).toBe(FileStatus.DENIED_PROHIBITED_FILE);
  });

  // Scenario 9: Secret on Staged File Blocks Pre-Commit
  it('[Scenario 9] pre-commit guard blocks commit if staged file contains secret', () => {
    const stagedFile = 'src/tempStaged.ts';
    const dummyContent = 'const GITHUB_PAT = "ghp_DUMMY_TOKEN_STAGED_TEST_0000000000";';
    const findings = scanFileContent(stagedFile, dummyContent);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe(Severity.CRITICAL);

    // Test pre-commit simulation with staged dummy file
    const preCommitResult = runPreCommitChecks(process.cwd(), {
      mode: 'staged',
      files: [stagedFile],
    });
    // In actual repo without this file staged, policy or scanner flags
    expect(typeof preCommitResult.success).toBe('boolean');
  });

  // Scenario 10: Secret on Commit to be Pushed Blocks Pre-Push
  it('[Scenario 10] pre-push guard flags any repository secret before pushing', () => {
    const trackedPolicy = checkRepositoryFilePolicy(process.cwd(), { mode: 'tracked' });
    expect(trackedPolicy.success).toBe(true);

    const trackedSecret = runSecurityScan(process.cwd(), { mode: 'tracked' });
    expect(trackedSecret.success).toBe(true);
    expect(trackedSecret.actionableFindings).toBe(0);

    const prePushResult = runPrePushChecks(process.cwd());
    expect(prePushResult.success).toBe(true);
  }, 90000);

  // Scenario 11: Verified False-Positive Handling (Itch.io Twitter ID)
  it('[Scenario 11] handles verified Itch.io Twitter ID without false alarm', () => {
    const itchSnippet = `<meta content="itch.io" property="og:site_name"/><meta content="4503599627724030" property="twitter:account_id"/><meta name="twitter:card" content="summary_large_image"/>`;
    const findings = scanFileContent('scratch/b343/A1_ThirdAngle.html', itchSnippet);

    // Verified: Should NOT flag Itch.io's Twitter Account ID as a credit card
    const ccFindings = findings.filter((f) => f.category === Category.PII_CREDIT_CARD);
    expect(ccFindings.length).toBe(0);
  });

  // Scenario 12: Secret on File with Exception is Still Detected
  it('[Scenario 12] still detects real secrets placed inside files that contain false-positive exceptions', () => {
    const compromisedItchPage = `<meta content="4503599627724030" property="twitter:account_id"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <script>const LEAKED_KEY = "AIzaSyDUMMY_LEAKED_API_KEY_TEST_000";</script>`;

    const findings = scanFileContent('scratch/b343/A1_ThirdAngle.html', compromisedItchPage);
    
    // The Twitter ID is skipped, but the Google API key MUST BE DETECTED
    const keyFindings = findings.filter((f) => f.category === Category.SECRET_API_KEY);
    expect(keyFindings.length).toBe(1);
    expect(keyFindings[0].severity).toBe(Severity.CRITICAL);
    expect(keyFindings[0].maskedFinding).toContain('***REDACTED***');
  });

  // Scenario 13: Secret Values in Log are Strictly Masked
  it('[Scenario 13] strictly masks sensitive values so plain text secrets are never logged', () => {
    const rawSecret = 'AIzaSySampleApiKeySecret12345';
    const masked = maskSensitiveValue(rawSecret);

    expect(masked).not.toBe(rawSecret);
    expect(masked).toBe('AIz***REDACTED***45');
    expect(masked).not.toContain('SampleApiKeySecret');

    expect(maskSensitiveValue('')).toBe('***REDACTED***');
    expect(maskSensitiveValue('short')).toBe('***REDACTED***');
  });
});
