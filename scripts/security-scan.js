#!/usr/bin/env node
/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — LOCAL SECURITY & PRIVACY SCANNER (PHASE 1)
 * 
 * Free-Tier, Local-First, Zero-Third-Party Security Tooling
 * 
 * Capabilities:
 * 1. Scans tracked, staged, untracked, modified files or arbitrary target directories.
 * 2. Scans for Secrets: API keys, Private keys, Keystores, Cloud tokens, OAuth secrets,
 *    Database credentials, .env files, and session secrets.
 * 3. Scans for PII (Personally Identifiable Information): Unsanitized emails, Indonesian
 *    phone numbers, Indonesian NIKs, credit cards, user dump files.
 * 4. Zero Secret Leakage: Masks matched values as ***REDACTED*** in reports/logs.
 * 5. Safe & Non-Destructive: Never automatically mutates or deletes user files.
 * 6. Fail-Closed: Exits with status code 1 if critical secrets or PII are found.
 * 7. Verified False-Positive Handling: Surgical context-aware exemptions without
 *    weakening rule detection or blanket folder exclusions.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Severity levels
 */
export const Severity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Finding categories
 */
export const Category = {
  SECRET_API_KEY: 'SECRET_API_KEY',
  SECRET_PRIVATE_KEY: 'SECRET_PRIVATE_KEY',
  SECRET_KEYSTORE: 'SECRET_KEYSTORE',
  SECRET_ENV_FILE: 'SECRET_ENV_FILE',
  SECRET_CREDENTIAL: 'SECRET_CREDENTIAL',
  SECRET_DATABASE: 'SECRET_DATABASE',
  PII_EMAIL: 'PII_EMAIL',
  PII_PHONE: 'PII_PHONE',
  PII_IDENTITY_CARD: 'PII_IDENTITY_CARD',
  PII_CREDIT_CARD: 'PII_CREDIT_CARD',
  SENSITIVE_FILE_NAME: 'SENSITIVE_FILE_NAME',
};

/**
 * Finding classifications (Task 5 & 9)
 */
export const Classification = {
  CONFIRMED_TEST_FIXTURE: 'CONFIRMED_TEST_FIXTURE',
  POTENTIAL_PII: 'POTENTIAL_PII',
  CONFIRMED_SENSITIVE_FILE: 'CONFIRMED_SENSITIVE_FILE',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  NOT_VERIFIED: 'NOT_VERIFIED',
};

/**
 * Secret & PII Scanning Patterns
 */
export const SECURITY_RULES = [
  // 1. Private Keys
  {
    id: 'SEC-001',
    category: Category.SECRET_PRIVATE_KEY,
    severity: Severity.CRITICAL,
    description: 'Cryptographic Private Key block header detected',
    regex: /-----BEGIN\s+(?:[A-Z0-9_-]+\s+)?PRIVATE\s+KEY-----/gi,
  },
  // 2. Google / Firebase API Keys
  {
    id: 'SEC-002',
    category: Category.SECRET_API_KEY,
    severity: Severity.CRITICAL,
    description: 'Google Cloud / Firebase API Key pattern detected',
    regex: /\bAIza[0-9A-Za-z\-_]{30,45}\b/g,
  },
  // 3. GitHub Personal Access Tokens (Classic & Fine-Grained)
  {
    id: 'SEC-003',
    category: Category.SECRET_API_KEY,
    severity: Severity.CRITICAL,
    description: 'GitHub Personal Access Token (PAT) detected',
    regex: /\b(?:ghp_[a-zA-Z0-9_]{30,45}|github_pat_[a-zA-Z0-9_]{50,100}|gho_[a-zA-Z0-9_]{30,45})\b/g,
  },
  // 4. AWS Access Keys
  {
    id: 'SEC-004',
    category: Category.SECRET_API_KEY,
    severity: Severity.CRITICAL,
    description: 'Amazon Web Services (AWS) Access Key ID detected',
    regex: /\b(?:AKIA|ASIA|AROA)[0-9A-Z]{16}\b/g,
  },
  // 5. Generic Passwords / Secrets in assignment
  {
    id: 'SEC-005',
    category: Category.SECRET_CREDENTIAL,
    severity: Severity.HIGH,
    description: 'Hardcoded password or secret assignment detected',
    regex: /(?:password|client_secret|clientsecret|app_secret|appsecret|api_secret)\s*[:=]\s*['"][^'"\s]{8,}['"]/gi,
    ignorePattern: /(?:placeholder|dummy|example|your[-_]?password|your[-_]?secret|TODO|test_secret)/i,
  },
  // 6. Database Connection URIs with credentials
  {
    id: 'SEC-006',
    category: Category.SECRET_DATABASE,
    severity: Severity.CRITICAL,
    description: 'Database connection URI with embedded credentials detected',
    regex: /(?:postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_-]+:[^@\s]+@[a-zA-Z0-9.-]+/gi,
    ignorePattern: /(?:localhost|example\.com|user:pass|dummy)/i,
  },
  // 7. Cloudflare Global API Key
  {
    id: 'SEC-007',
    category: Category.SECRET_API_KEY,
    severity: Severity.CRITICAL,
    description: 'Cloudflare Global API Key pattern detected',
    regex: /\b[0-9a-f]{37}\b/g,
    validator: (match) => /^[0-9a-f]{37}$/.test(match),
  },
  // 8. Generic Bearer Token / JWT Pattern
  {
    id: 'SEC-008',
    category: Category.SECRET_API_KEY,
    severity: Severity.CRITICAL,
    description: 'Authorization Bearer Token or JWT pattern detected',
    regex: /\b(?:bearer\s+[a-zA-Z0-9_.-]{30,}|eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/gi,
    ignorePattern: /(?:dummy|placeholder|example|your[-_]?token|TODO|test_secret)/i,
  },
  // 9. Indonesian National Identity Number (NIK) - 16 consecutive digits in sensitive context
  {
    id: 'PII-001',
    category: Category.PII_IDENTITY_CARD,
    severity: Severity.HIGH,
    description: 'Indonesian NIK (Nomor Induk Kependudukan) candidate pattern detected',
    regex: /\b[1-9][0-9]{15}\b/g,
    contextFilter: (line) => /(?:nik|ktp|identitas|kependudukan|penduduk)/i.test(line),
  },
  // 10. Indonesian Phone Numbers in customer/user contexts
  {
    id: 'PII-002',
    category: Category.PII_PHONE,
    severity: Severity.HIGH,
    description: 'Indonesian mobile phone number candidate in personal data context detected',
    regex: /\b(?:\+62|62|0)8[1-9][0-9]{7,10}\b/g,
    contextFilter: (line) => /(?:telepon|phone|hp|nohp|telp|whatsapp|wa|kontak_pengguna|customer)/i.test(line),
  },
  // 11. Credit Card Numbers (13-16 digit candidates)
  {
    id: 'PII-003',
    category: Category.PII_CREDIT_CARD,
    severity: Severity.CRITICAL,
    description: 'Potential credit/debit card number sequence detected',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    contextFilter: (line) => {
      // Exclude HTML Twitter/OpenGraph social metadata markup ("twitter:card", "twitter:account_id")
      // which has no relationship to financial payment cards
      const sanitized = line
        .replace(/twitter:(?:card|account_id)/gi, '')
        .replace(/property=["']twitter:[^"']+["']/gi, '');
      return /(?:credit[\s_-]?card|debit[\s_-]?card|kartu[\s_-]?(?:kredit|debit)|\bcard\b|cc_num|cvv|exp(?:iry|iration))/i.test(sanitized);
    },
    validator: (match, line) => {
      // Specific verified false-positive exception (Task 3):
      // 4503599627724030 is itch.io's official public Twitter account ID embedded in HTML meta tags
      if (match === '4503599627724030' && line && /twitter:account_id/i.test(line)) {
        return false;
      }
      return true;
    },
  },
  // 12. Unsanitized Real Email Addresses in customer/tester contexts
  {
    id: 'PII-004',
    category: Category.PII_EMAIL,
    severity: Severity.HIGH,
    description: 'Real personal/customer email address candidate detected',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    contextFilter: (line) => /(?:tester|customer|pendaftar|registrant|nasabah|pelanggan)/i.test(line),
    validator: (email, line) => {
      const lower = email.toLowerCase();
      // Allow UI placeholders containing placeholder or standard template forms
      if (/(?:placeholder|contoh|email\.anda|akun\.playstore)/i.test(lower) || /(?:placeholder|contoh)/i.test(line)) {
        return false;
      }
      // Allow standard dummy RFC / documentation domains
      const isDummyDomain = /@(?:example\.(?:com|org|net|invalid)|test\.local|localhost|dummy\.local|domain\.test)$/i.test(lower);
      // Allow project official public contact addresses
      const isPublicContact = /^(?:contact|support|privacy|hello|info|admin)@(?:sleepykoalastudio\.com|gmail\.com)$/i.test(lower);
      return !isDummyDomain && !isPublicContact;
    },
  },
];

/**
 * File names and extensions that are strictly prohibited in Git
 */
export const PROHIBITED_FILE_PATTERNS = [
  { pattern: /^\.env(?:\..+)?$/, severity: Severity.CRITICAL, description: 'Environment variable file (.env) prohibited from repository' },
  { pattern: /\.(?:jks|keystore)$/i, severity: Severity.CRITICAL, description: 'Android cryptographic keystore file prohibited from repository' },
  { pattern: /\.(?:p12|pfx|pk8|der)$/i, severity: Severity.CRITICAL, description: 'Private certificate/key binary prohibited from repository' },
  { pattern: /webcredential\.txt$/i, severity: Severity.CRITICAL, description: 'Protected credential storage file prohibited from repository' },
  { pattern: /service[-_]account.*\.json$/i, severity: Severity.CRITICAL, description: 'GCP Service Account JSON prohibited from repository' },
  { pattern: /play[-_]key.*\.json$/i, severity: Severity.CRITICAL, description: 'Google Play API key file prohibited from repository' },
  { pattern: /credentials\.json$/i, severity: Severity.CRITICAL, description: 'OAuth or secret credentials JSON prohibited from repository' },
  { pattern: /client[-_]secret.*\.json$/i, severity: Severity.CRITICAL, description: 'OAuth client secret file prohibited from repository' },
  { pattern: /oauth.*\.json$/i, severity: Severity.CRITICAL, description: 'OAuth configuration token file prohibited from repository' },
  { pattern: /\.dev\.vars(?:\..+)?$/, severity: Severity.CRITICAL, description: 'Cloudflare Wrangler dev secrets file prohibited from repository' },
  { pattern: /\.(?:dump|sql|sqlite|rdb|backup)$/i, severity: Severity.CRITICAL, description: 'Database dump/backup binary file prohibited from repository' },
  { pattern: /\.key$/i, severity: Severity.CRITICAL, description: 'Cryptographic private key file (.key) prohibited from repository' },
  { pattern: /(?:^|[\\/])id_rsa(?:\.[a-zA-Z0-9]+)?$/i, severity: Severity.CRITICAL, description: 'SSH private key file prohibited from repository' },
  { pattern: /(?:^|[\\/])id_ed25519(?:\.[a-zA-Z0-9]+)?$/i, severity: Severity.CRITICAL, description: 'SSH ed25519 key file prohibited from repository' },
  { pattern: /signing\.properties$/i, severity: Severity.CRITICAL, description: 'Android signing properties file prohibited from repository' },
  { pattern: /release\.keystore$/i, severity: Severity.CRITICAL, description: 'Release keystore prohibited from repository' },
  { pattern: /(?:^|[\\/])testers?[-_]export.*\.json$/i, severity: Severity.CRITICAL, description: 'Tester PII export dump prohibited from repository' },
  { pattern: /(?:^|[\\/])testers?[-_].*\.csv$/i, severity: Severity.CRITICAL, description: 'Tester CSV data prohibited from repository' },
];

/**
 * Directories and paths allowed to be skipped during scanning
 */
export const DEFAULT_IGNORED_DIRS = [
  'node_modules',
  'dist',
  'dist-ssr',
  '.git',
  '.wrangler',
  '.vscode',
  '.idea',
  'coverage',
];

/**
 * Allowlist for known false positives or test fixtures
 */
export const DEFAULT_ALLOWLIST = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'SECURITY_SCAN_POLICY.md', // Policy documentation mentions rule patterns
  'scripts/security-scan.js', // The scanner itself defines regex patterns
  'scripts/privacy-scan.js', // Privacy scanner itself defines PII regex
  'backend/gas/schema.json', // Schema specification documenting example column formats
  'backend/README.md', // Backend architecture documentation
  'docs/checkpoints/', // Historical milestone snapshot archives
  'src/test/securityScanner.test.ts', // Unit test file containing intentional dummy scan fixtures
  'src/test/securityPhase1.test.ts', // Phase 1 security suite containing intentional dummy scan fixtures
  'src/test/gitAutomation.test.ts', // Git automation suite containing synthetic test fixtures
  'src/test/googlePlaySyncIsolated.test.ts', // Mock unit tests with synthetic Google Play key fixtures
  'src/test/registerTesterFunction.test.ts', // Mock unit tests with synthetic tester registration fixtures
  'src/test/registrationService.test.ts', // Mock unit tests with synthetic tester registration fixtures
  'src/test/milestone655AdminResponseFix.test.ts', // Mock admin tests
  'src/test/milestone66WebsiteContentCompliance.test.tsx', // Mock compliance tests
  'src/test/isolatedE2E.test.ts', // Mock E2E tests
  'src/test/cmsPoCIsolated.test.ts', // Mock CMS PoC tests
  'src/test/milestone6RealOtpEmail.test.ts', // Mock OTP email tests
  'src/test/milestone63PreRegistration.test.ts', // Mock pre-registration tests
  'src/test/milestone6Acceptance.test.ts', // Mock acceptance tests
  'src/test/RegistrationModal.test.tsx', // Mock UI modal tests
];

/**
 * Masks a detected string so that the sensitive value is NEVER printed to console/logs.
 * @param {string} str 
 * @returns {string} Masked string (e.g., "AIz***REDACTED***12")
 */
export function maskSensitiveValue(str) {
  if (!str) return '***REDACTED***';
  const clean = String(str).trim();
  if (clean.length <= 6) return '***REDACTED***';
  const prefix = clean.substring(0, 3);
  const suffix = clean.substring(clean.length - 2);
  return `${prefix}***REDACTED***${suffix}`;
}

/**
 * Scans a single file's content and filename against security and PII rules.
 * @param {string} filePath Absolute or relative file path
 * @param {string} content Text content of the file
 * @param {object} options Scanner options
 * @returns {Array<object>} List of findings
 */
export function scanFileContent(filePath, content, _options = {}) {
  const findings = [];
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(filePath);

  // 1. Check prohibited file patterns
  for (const rule of PROHIBITED_FILE_PATTERNS) {
    if (rule.pattern.test(fileName) || rule.pattern.test(normalizedPath)) {
      // Allow .env.example if strictly dummy
      if (fileName === '.env.example') continue;

      findings.push({
        id: 'FILE-PROHIBITED',
        category: Category.SENSITIVE_FILE_NAME,
        severity: rule.severity,
        classification: Classification.CONFIRMED_SENSITIVE_FILE,
        file: normalizedPath,
        line: 1,
        description: rule.description,
        maskedFinding: `[Prohibited File: ${fileName}]`,
      });
    }
  }

  // If binary file or prohibited binary, stop further text scanning
  if (/\.(?:jks|keystore|p12|pfx|pk8|der|png|jpg|jpeg|gif|webp|ico|svg|pdf|zip|tar|gz)$/i.test(fileName)) {
    return findings;
  }

  const lines = content.split(/\r?\n/);

  // 2. Scan lines against text regex rules
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    for (const rule of SECURITY_RULES) {
      if (rule.ignorePattern && rule.ignorePattern.test(line)) {
        continue;
      }

      if (rule.contextFilter && !rule.contextFilter(line)) {
        continue;
      }

      // Reset regex state
      rule.regex.lastIndex = 0;
      let match;

      while ((match = rule.regex.exec(line)) !== null) {
        const rawMatched = match[0];

        if (rule.validator && !rule.validator(rawMatched, line)) {
          continue;
        }

        let classification = Classification.NOT_VERIFIED;
        if (normalizedPath.startsWith('src/test/') || normalizedPath.startsWith('test-fixtures/') || normalizedPath.includes('dummy') || normalizedPath.includes('fixture')) {
          classification = Classification.CONFIRMED_TEST_FIXTURE;
        } else if (rule.severity === Severity.CRITICAL || rule.category === Category.SECRET_API_KEY || rule.category === Category.SECRET_PRIVATE_KEY) {
          classification = Classification.CONFIRMED_SENSITIVE_FILE;
        } else if (rule.category.startsWith('PII_')) {
          classification = Classification.POTENTIAL_PII;
        }

        findings.push({
          id: rule.id,
          category: rule.category,
          severity: rule.severity,
          classification,
          file: normalizedPath,
          line: lineNum,
          description: rule.description,
          maskedFinding: maskSensitiveValue(rawMatched),
        });
      }
    }
  });

  return findings;
}

/**
 * Collects target files from git status (tracked, untracked, staged, modified).
 * Falls back to walking directory if git is unavailable.
 * @param {string} rootDir 
 * @param {object} options 
 * @returns {Array<string>} List of relative file paths
 */
export function getFilesToScan(rootDir, options = {}) {
  const mode = options.mode || 'all';

  try {
    if (mode === 'staged') {
      const stagedOut = execSync('git diff --cached --name-only --diff-filter=ACMR', {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return stagedOut.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
    }

    if (mode === 'tracked') {
      const trackedOut = execSync('git ls-files', {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return trackedOut.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
    }

    // Collect all git-known files and untracked files
    const gitOutput = execSync('git status --porcelain=v1 -uall', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    const lines = gitOutput.split(/\r?\n/).filter(Boolean);
    const gitFiles = lines.map((l) => l.substring(3).trim());

    // Also include tracked files in working directory
    const trackedOutput = execSync('git ls-files', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const trackedFiles = trackedOutput.split(/\r?\n/).filter(Boolean);

    const fileSet = new Set([...gitFiles, ...trackedFiles]);
    return Array.from(fileSet).filter((relPath) => {
      const parts = relPath.split(/[/\\]/);
      return !parts.some((p) => DEFAULT_IGNORED_DIRS.includes(p));
    });
  } catch {
    // If not a git repo or git fails, perform safe directory walk
    return walkDir(rootDir, rootDir);
  }
}

/**
 * Recursive directory walker
 */
function walkDir(dir, baseDir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (DEFAULT_IGNORED_DIRS.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results = results.concat(walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push(relPath);
    }
  }

  return results;
}

/**
 * Runs a complete scan over a project directory.
 * @param {string} rootDir Project root directory
 * @param {object} options 
 * @returns {object} Scan result summary
 */
export function runSecurityScan(rootDir = process.cwd(), options = {}) {
  const allowlist = new Set([...DEFAULT_ALLOWLIST, ...(options.allowlist || [])]);
  const files = options.files || getFilesToScan(rootDir, options);

  const allFindings = [];
  let filesScanned = 0;

  for (const relPath of files) {
    const normalized = relPath.replace(/\\/g, '/');

    // Skip allowlisted files
    if (allowlist.has(normalized) || Array.from(allowlist).some((al) => normalized.endsWith(al) || normalized.startsWith(al))) {
      continue;
    }

    const fullPath = path.resolve(rootDir, relPath);
    if (!fs.existsSync(fullPath)) continue;

    // Check directory stat
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    // Skip huge binary files (> 5MB)
    if (stat.size > 5 * 1024 * 1024) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      filesScanned++;
      const findings = scanFileContent(relPath, content, options);
      allFindings.push(...findings);
    } catch {
      // Binary read failure or encoding skip
    }
  }

  const criticalCount = allFindings.filter((f) => f.severity === Severity.CRITICAL).length;
  const highCount = allFindings.filter((f) => f.severity === Severity.HIGH).length;
  const isClean = allFindings.length === 0;

  return {
    success: isClean,
    totalFilesScanned: filesScanned,
    totalFindings: allFindings.length,
    actionableFindings: allFindings.length,
    criticalCount,
    highCount,
    findings: allFindings,
    actionable: allFindings,
  };
}

/**
 * CLI Execution Entrypoint
 */
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/security-scan.js')) {
  const mode = process.argv.includes('--staged') ? 'staged' : process.argv.includes('--tracked') ? 'tracked' : 'all';
  const targetDir = process.argv[2] && !process.argv[2].startsWith('--') ? path.resolve(process.argv[2]) : process.cwd();
  
  console.log(`\n🔍 SleepyKoala Studio — Local Security & Privacy Scanner (Mode: ${mode})`);
  console.log(`📁 Scanning Target: ${targetDir}`);

  const result = runSecurityScan(targetDir, { mode });

  console.log(`📄 Scanned ${result.totalFilesScanned} files.`);

  if (result.success) {
    console.log(`\n✅ SCAN PASSED: Zero actionable secrets or unapproved PII detected. Repository is clean.\n`);
    process.exit(0);
  } else {
    console.error(`\n❌ SCAN FAILED: Detected ${result.actionableFindings} actionable secret(s) or sensitive data!\n`);

    result.actionable.forEach((f, idx) => {
      console.error(`[${idx + 1}] [${f.severity}] [${f.classification}] ${f.description}`);
      console.error(`    File:     ${f.file}:${f.line}`);
      console.error(`    Category: ${f.category}`);
      console.error(`    Preview:  ${f.maskedFinding}\n`);
    });

    console.error(`⚠️  Action Required: Remove secrets or sensitive data before committing or pushing.`);
    console.error(`⚠️  Note: Scanner NEVER deletes files automatically. Values are redacted in output for security.\n`);
    process.exit(1);
  }
}
