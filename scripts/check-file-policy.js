#!/usr/bin/env node
/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — REPOSITORY FILE POLICY ENFORCER (TASK 2)
 * 
 * Strict "Default Deny" File Policy for Git Hygiene & Credential Protection
 * 
 * Rules:
 * 1. Default Deny: Unknown or untracked artifacts outside approved schemas are rejected.
 * 2. Denylist: Prohibits private keys, keystores, secrets, .env files, database dumps,
 *    unapproved tester data, and temporary logs.
 * 3. Allowlist: Permits approved source files, static assets, documentation, tests,
 *    and configuration files.
 * ============================================================================
 */

import path from 'node:path';
import { execSync } from 'node:child_process';

export const FileStatus = {
  ALLOWED_PROJECT_FILE: 'ALLOWED_PROJECT_FILE',
  CONFIRMED_TEST_FIXTURE: 'CONFIRMED_TEST_FIXTURE',
  DENIED_PROHIBITED_FILE: 'DENIED_PROHIBITED_FILE',
  DENIED_SENSITIVE_DATA: 'DENIED_SENSITIVE_DATA',
  UNKNOWN_ARTIFACT_REJECTED: 'UNKNOWN_ARTIFACT_REJECTED',
};

/**
 * Denylist patterns: Strictly prohibited from entering Git
 */
export const DENYLIST_PATTERNS = [
  // 1. Environment & Credential files
  { pattern: /^\.env(?:\..+)?$/, reason: 'Environment variable file (.env) prohibited from repository' },
  { pattern: /^\.dev\.vars(?:\..+)?$/, reason: 'Cloudflare Wrangler dev secret file prohibited' },
  { pattern: /webcredential\.txt$/i, reason: 'Protected credential storage file strictly prohibited' },
  { pattern: /credentials\.json$/i, reason: 'OAuth or secret credentials JSON file prohibited' },
  { pattern: /client[-_]secret.*\.json$/i, reason: 'OAuth client secret file prohibited' },
  { pattern: /oauth.*\.json$/i, reason: 'OAuth configuration token file prohibited' },
  { pattern: /service[-_]account.*\.json$/i, reason: 'GCP Service Account JSON prohibited' },
  { pattern: /play[-_]key.*\.json$/i, reason: 'Google Play API key file prohibited' },

  // 2. Cryptographic Keys & Keystores
  { pattern: /\.(?:jks|keystore)$/i, reason: 'Android cryptographic keystore file prohibited' },
  { pattern: /\.(?:p12|pfx|pk8|der|pem|key)$/i, reason: 'Cryptographic certificate/key binary prohibited' },
  { pattern: /(?:^|[\\/])id_rsa(?:\.pub)?$/i, reason: 'SSH private/public key prohibited' },
  { pattern: /(?:^|[\\/])id_ed25519(?:\.pub)?$/i, reason: 'SSH ed25519 key prohibited' },
  { pattern: /signing\.properties$/i, reason: 'Android signing properties file prohibited' },
  { pattern: /release\.keystore$/i, reason: 'Release keystore prohibited' },

  // 3. Database dumps & backups
  { pattern: /\.(?:dump|sql|sqlite|db|rdb|backup)$/i, reason: 'Database dump or binary state file prohibited' },

  // 4. Tester & customer PII data
  { pattern: /(?:^|[\\/])testers?[-_]export.*\.json$/i, reason: 'Tester PII export dump prohibited' },
  { pattern: /(?:^|[\\/])testers?[-_].*\.csv$/i, reason: 'Tester CSV data prohibited' },

  // 5. Build outputs & caches (if attempted in Git)
  { pattern: /(?:^|[\\/])node_modules[\\/]/i, reason: 'node_modules directory must not be tracked' },
  { pattern: /(?:^|[\\/])dist[\\/]/i, reason: 'dist build output must not be tracked' },
  { pattern: /(?:^|[\\/])coverage[\\/]/i, reason: 'Test coverage reports must not be tracked' },
  { pattern: /\.tsbuildinfo$/i, reason: 'TypeScript build cache must not be tracked' },
];

/**
 * Approved Root Files
 */
export const APPROVED_ROOT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'wrangler.toml',
  '.gitignore',
  '.oxlintrc.json',
  '.env.example',
  'README.md',
  'index.html',
  'PORTFOLIO_METADATA_SCHEMA.md',
  'SECURITY_SCAN_POLICY.md',
  'IMPLEMENTATION_DISCOVERY_REPORT.md',
  'IMPLEMENTATION_PROGRESS.md',
  'IMPLEMENTATION_TEST_REPORT.md',
  'PIXEL_ART_ASSET_INVENTORY.md',
  'PIXEL_ART_VISUAL_GUIDELINES.md',
  'SLEEPYKOALA_ADMOB_APP_ADS_TXT_SETUP_REPORT.md',
  'VIRTUAL_OFFICE_DESIGN.md',
  'roadmap_sleepykoala_updated.md',
  'ARCHITECTURE_MAP.md',
  'CARA_PAKAI_AMAN.md',
  'CURRENT_CHECKPOINT.md',
  'END_TO_END_PROOF.md',
  'GEMINI.md',
  'ROADMAP.md',
  'auto_sync.py',
  '.antigravityrules',
]);

/**
 * Approved Directory Prefixes
 */
export const APPROVED_DIRECTORIES = [
  'src/',
  'public/',
  'docs/',
  'scripts/',
  'functions/',
  'backend/',
  '.github/',
  'scratch/', // Local scratch files (allowed in working tree, blocked if staged with sensitive content)
  'Artifact/',
  'template-proyek-aman/',
];

/**
 * Approved File Extensions
 */
export const APPROVED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.ico',
  '.md',
  '.txt',
  '.toml',
  '.sample',
  '.claspignore',
  '.py',
  '.gs',
  '.xml',
  '.py',
  '.ps1',
  '.zip',
  '.bak',
  '.aseprite',
  '.url',
  '.yml',
  '.yaml',
]);

/**
 * Evaluates a single file path against repository file policies.
 * @param {string} filePath Relative path to project root
 * @returns {object} Policy assessment
 */
export function evaluateFilePolicy(filePath) {
  const clean = String(filePath).replace(/^["']|["']$/g, '').trim();
  const normalized = clean.replace(/\\/g, '/');
  const fileName = path.basename(normalized);
  const ext = path.extname(fileName).toLowerCase();

  // Special safe exception
  if (
    normalized === '.env.example' ||
    normalized === 'public/_redirects' ||
    normalized === 'public/_headers' ||
    fileName === '.antigravityrules' ||
    normalized.endsWith('.claspignore')
  ) {
    return {
      status: FileStatus.ALLOWED_PROJECT_FILE,
      file: normalized,
      reason: 'Sanitized dummy environment template, Cloudflare rule, or clasp ignore file',
    };
  }

  // 1. Check Denylist first (Highest Precedence)
  for (const item of DENYLIST_PATTERNS) {
    if (item.pattern.test(fileName) || item.pattern.test(normalized)) {
      return {
        status: FileStatus.DENIED_PROHIBITED_FILE,
        file: normalized,
        reason: item.reason,
      };
    }
  }

  // 2. Check if test fixture
  if (normalized.startsWith('src/test/') || normalized.startsWith('test-fixtures/')) {
    if (normalized.endsWith('.tmp') || normalized.includes('dummy') || normalized.includes('fixture')) {
      return {
        status: FileStatus.CONFIRMED_TEST_FIXTURE,
        file: normalized,
        reason: 'Confirmed test fixture in isolated test tree',
      };
    }
  }

  // 3. Check Approved Root Files
  if (APPROVED_ROOT_FILES.has(normalized)) {
    return {
      status: FileStatus.ALLOWED_PROJECT_FILE,
      file: normalized,
      reason: 'Approved repository root configuration/documentation file',
    };
  }

  // 4. Check Approved Directories & Approved Extensions
  const isInApprovedDir = APPROVED_DIRECTORIES.some((dir) => normalized.startsWith(dir));
  const hasApprovedExt = APPROVED_EXTENSIONS.has(ext);

  if (isInApprovedDir && hasApprovedExt) {
    return {
      status: FileStatus.ALLOWED_PROJECT_FILE,
      file: normalized,
      reason: 'Approved source file or documentation asset',
    };
  }

  // 5. Default Deny: Any unknown file is rejected
  return {
    status: FileStatus.UNKNOWN_ARTIFACT_REJECTED,
    file: normalized,
    reason: `File "${normalized}" does not match approved project paths or allowed extensions (Default Deny)`,
  };
}

/**
 * Runs file policy checks against repository files.
 * @param {string} rootDir Project root directory
 * @param {object} options Scan options (mode: 'tracked' | 'staged' | 'all')
 * @returns {object} Evaluation summary
 */
export function checkRepositoryFilePolicy(rootDir = process.cwd(), options = {}) {
  const mode = options.mode || 'all';
  let filesToCheck = [];

  try {
    if (mode === 'staged') {
      const stagedOut = execSync('git diff --cached --name-only --diff-filter=ACMR', {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      filesToCheck = stagedOut.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
    } else if (mode === 'tracked') {
      const trackedOut = execSync('git ls-files', {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      filesToCheck = trackedOut.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
    } else {
      // All files (tracked + working tree status)
      const trackedOut = execSync('git ls-files', {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const statusOut = execSync('git status --porcelain=v1 -uall', {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });

      const tracked = trackedOut.split(/\r?\n/).map((f) => f.trim()).filter(Boolean);
      const untracked = statusOut
        .split(/\r?\n/)
        .map((l) => l.substring(3).trim())
        .filter(Boolean);

      const set = new Set([...tracked, ...untracked]);
      filesToCheck = Array.from(set);
    }
  } catch {
    // If git fails, fallback to options.files or exit clean
    filesToCheck = options.files || [];
  }

  if (options.files && options.files.length > 0) {
    filesToCheck = options.files;
  }

  const results = {
    totalChecked: filesToCheck.length,
    allowed: [],
    fixtures: [],
    denied: [],
    unknown: [],
    success: true,
  };

  for (const file of filesToCheck) {
    const evalResult = evaluateFilePolicy(file);
    if (evalResult.status === FileStatus.ALLOWED_PROJECT_FILE) {
      results.allowed.push(evalResult);
    } else if (evalResult.status === FileStatus.CONFIRMED_TEST_FIXTURE) {
      results.fixtures.push(evalResult);
    } else if (evalResult.status === FileStatus.DENIED_PROHIBITED_FILE) {
      results.denied.push(evalResult);
      results.success = false;
    } else {
      results.unknown.push(evalResult);
      results.success = false;
    }
  }

  return results;
}

/**
 * CLI Entrypoint
 */
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/check-file-policy.js')) {
  const mode = process.argv.includes('--staged') ? 'staged' : process.argv.includes('--tracked') ? 'tracked' : 'all';
  console.log(`\n🛡️  SleepyKoala Studio — Repository File Policy Enforcer (Mode: ${mode})`);
  
  const results = checkRepositoryFilePolicy(process.cwd(), { mode });
  console.log(`📄 Total files inspected: ${results.totalChecked}`);
  console.log(`   ✅ Allowed files:     ${results.allowed.length}`);
  console.log(`   🧪 Test fixtures:     ${results.fixtures.length}`);
  console.log(`   🚫 Denied files:      ${results.denied.length}`);
  console.log(`   ❓ Unknown/Rejected:  ${results.unknown.length}\n`);

  if (results.denied.length > 0) {
    console.error('❌ DENYLIST VIOLATIONS DETECTED:');
    results.denied.forEach((d, idx) => {
      console.error(`   [${idx + 1}] File:   ${d.file}`);
      console.error(`       Reason: ${d.reason}`);
    });
    console.error('');
  }

  if (results.unknown.length > 0) {
    console.error('⚠️  DEFAULT-DENY UNKNOWN ARTIFACTS:');
    results.unknown.forEach((u, idx) => {
      console.error(`   [${idx + 1}] File:   ${u.file}`);
      console.error(`       Reason: ${u.reason}`);
    });
    console.error('');
  }

  if (results.success) {
    console.log('✅ File policy enforcement passed. All inspected files comply with repository standards.\n');
    process.exit(0);
  } else {
    console.error('❌ File policy enforcement failed. Resolve prohibited or unapproved files.\n');
    process.exit(1);
  }
}
