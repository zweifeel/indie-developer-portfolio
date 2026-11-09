#!/usr/bin/env node
/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — LOCAL PRIVACY & PII SCANNER (TASK 5)
 * 
 * Free-Tier, Local-First, Zero-Third-Party Privacy Auditing Tool
 * 
 * Capabilities:
 * 1. Scans for Personally Identifiable Information (PII):
 *    - Real user/customer/tester emails (excluding RFC dummy domains and official contacts)
 *    - Indonesian mobile numbers (+628... / 08...)
 *    - Indonesian NIK (Nomor Induk Kependudukan - 16 digits)
 *    - Credit and debit card numbers in payment contexts
 *    - Unapproved tester export files and database dumps
 * 2. Classifies findings:
 *    - CONFIRMED_TEST_FIXTURE
 *    - POTENTIAL_PII
 *    - CONFIRMED_SENSITIVE_FILE
 *    - FALSE_POSITIVE
 *    - NOT_VERIFIED
 * 3. Masked Reporting: Masked preview (e.g. 081***REDACTED***89) with zero plain text leaks.
 * 4. Fail-Closed: Exits with code 1 if unapproved PII or customer dumps are detected.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  Classification,
  Severity,
  Category,
  maskSensitiveValue,
  getFilesToScan,
  DEFAULT_ALLOWLIST,
} from './security-scan.js';

export const PRIVACY_RULES = [
  // 1. Indonesian NIK (Nomor Induk Kependudukan)
  {
    id: 'PII-NIK-001',
    category: Category.PII_IDENTITY_CARD,
    severity: Severity.HIGH,
    description: 'Indonesian NIK (16-digit identity number candidate) in identity context',
    regex: /\b[1-9][0-9]{15}\b/g,
    contextFilter: (line) => /(?:nik|ktp|identitas|kependudukan|penduduk|nomor_ktp)/i.test(line),
  },
  // 2. Indonesian Mobile Phone Number
  {
    id: 'PII-PHONE-002',
    category: Category.PII_PHONE,
    severity: Severity.HIGH,
    description: 'Indonesian mobile phone number candidate in personal data context',
    regex: /\b(?:\+62|62|0)8[1-9][0-9]{7,10}\b/g,
    contextFilter: (line) => /(?:telepon|phone|hp|nohp|telp|whatsapp|wa|kontak_pengguna|customer|tester)/i.test(line),
    validator: (match) => !match.startsWith('00000000'), // Ignore clear dummy sequences
  },
  // 3. Payment Card Sequence
  {
    id: 'PII-CARD-003',
    category: Category.PII_CREDIT_CARD,
    severity: Severity.CRITICAL,
    description: 'Credit or debit card number sequence in payment context',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    contextFilter: (line) => {
      const sanitized = line
        .replace(/twitter:(?:card|account_id)/gi, '')
        .replace(/property=["']twitter:[^"']+["']/gi, '');
      return /(?:credit[\s_-]?card|debit[\s_-]?card|kartu[\s_-]?(?:kredit|debit)|\bcard\b|cc_num|cvv|exp(?:iry|iration))/i.test(sanitized);
    },
    validator: (match, line) => {
      // Verified Itch.io social media account ID
      if (match === '4503599627724030' && line && /twitter:account_id/i.test(line)) {
        return false;
      }
      return true;
    },
  },
  // 4. Real User / Customer / Tester Email
  {
    id: 'PII-EMAIL-004',
    category: Category.PII_EMAIL,
    severity: Severity.HIGH,
    description: 'Personal email address in customer, tester, or user registration context',
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    contextFilter: (line) => /(?:tester|customer|pendaftar|registrant|nasabah|pelanggan|user_email)/i.test(line),
    validator: (email, line) => {
      const lower = email.toLowerCase();
      // Allow UI placeholders
      if (/(?:placeholder|contoh|email\.anda|akun\.playstore)/i.test(lower) || /(?:placeholder|contoh)/i.test(line)) {
        return false;
      }
      // Allow RFC dummy domains
      const isDummyDomain = /@(?:example\.(?:com|org|net|invalid)|test\.local|localhost|dummy\.local|domain\.test)$/i.test(lower);
      // Allow official public contact addresses
      const isPublicContact = /^(?:contact|support|privacy|hello|info|admin)@(?:sleepykoala|gmail\.com)$/i.test(lower);
      return !isDummyDomain && !isPublicContact;
    },
  },
];

/**
 * Prohibited PII and Data Dump Files
 */
export const PROHIBITED_PII_FILES = [
  { pattern: /(?:^|[\\/])testers?[-_]export.*\.json$/i, severity: Severity.CRITICAL, description: 'Tester PII database export JSON prohibited' },
  { pattern: /(?:^|[\\/])testers?[-_].*\.csv$/i, severity: Severity.CRITICAL, description: 'Tester personal data CSV file prohibited' },
  { pattern: /\.(?:dump|sql|sqlite|rdb|backup)$/i, severity: Severity.CRITICAL, description: 'Database dump file potentially containing user records' },
];

/**
 * Scans a file for privacy and PII findings
 * @param {string} filePath 
 * @param {string} content 
 * @returns {Array<object>}
 */
export function scanPrivacyContent(filePath, content) {
  const findings = [];
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(filePath);

  // 1. Check prohibited PII files
  for (const rule of PROHIBITED_PII_FILES) {
    if (rule.pattern.test(fileName) || rule.pattern.test(normalizedPath)) {
      findings.push({
        id: 'PII-FILE-PROHIBITED',
        category: Category.SENSITIVE_FILE_NAME,
        severity: rule.severity,
        classification: Classification.CONFIRMED_SENSITIVE_FILE,
        file: normalizedPath,
        line: 1,
        description: rule.description,
        maskedFinding: `[Prohibited Data File: ${fileName}]`,
      });
    }
  }

  // Skip binaries
  if (/\.(?:jks|keystore|p12|pfx|pk8|der|key|pem|png|jpg|jpeg|gif|webp|ico|svg|pdf|zip|tar|gz)$/i.test(fileName)) {
    return findings;
  }

  const lines = content.split(/\r?\n/);

  // 2. Scan lines
  lines.forEach((line, index) => {
    const lineNum = index + 1;

    for (const rule of PRIVACY_RULES) {
      if (rule.contextFilter && !rule.contextFilter(line)) {
        continue;
      }

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
        } else if (rule.severity === Severity.CRITICAL) {
          classification = Classification.CONFIRMED_SENSITIVE_FILE;
        } else {
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
 * Runs privacy scan on project directory
 * @param {string} rootDir 
 * @param {object} options 
 * @returns {object}
 */
export function runPrivacyScan(rootDir = process.cwd(), options = {}) {
  const allowlist = new Set([...DEFAULT_ALLOWLIST, ...(options.allowlist || [])]);
  const files = options.files || getFilesToScan(rootDir, options);

  const allFindings = [];
  let filesScanned = 0;

  for (const relPath of files) {
    const normalized = relPath.replace(/\\/g, '/');

    if (allowlist.has(normalized) || Array.from(allowlist).some((al) => normalized.endsWith(al) || normalized.startsWith(al))) {
      continue;
    }

    const fullPath = path.resolve(rootDir, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;
    if (stat.size > 5 * 1024 * 1024) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      filesScanned++;
      const findings = scanPrivacyContent(relPath, content);
      allFindings.push(...findings);
    } catch {
      // ignore read error
    }
  }

  const actionable = allFindings.filter((f) => 
    f.classification !== Classification.CONFIRMED_TEST_FIXTURE && 
    f.classification !== Classification.FALSE_POSITIVE
  );

  return {
    success: actionable.length === 0,
    totalFilesScanned: filesScanned,
    totalFindings: allFindings.length,
    actionableFindings: actionable.length,
    actionable,
    findings: allFindings,
  };
}

/**
 * CLI Entrypoint
 */
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/privacy-scan.js')) {
  const mode = process.argv.includes('--staged') ? 'staged' : process.argv.includes('--tracked') ? 'tracked' : 'all';
  const targetDir = process.argv[2] && !process.argv[2].startsWith('--') ? path.resolve(process.argv[2]) : process.cwd();

  console.log(`\n🔒 SleepyKoala Studio — Local Privacy & PII Scanner (Mode: ${mode})`);
  console.log(`📁 Scanning Target: ${targetDir}`);

  const result = runPrivacyScan(targetDir, { mode });
  console.log(`📄 Scanned ${result.totalFilesScanned} files.`);

  if (result.success) {
    console.log(`\n✅ PRIVACY SCAN PASSED: Zero unapproved PII or user dumps detected.\n`);
    process.exit(0);
  } else {
    console.error(`\n❌ PRIVACY SCAN FAILED: Detected ${result.actionableFindings} actionable PII violation(s)!\n`);

    result.actionable.forEach((f, idx) => {
      console.error(`[${idx + 1}] [${f.severity}] [${f.classification}] ${f.description}`);
      console.error(`    File:     ${f.file}:${f.line}`);
      console.error(`    Category: ${f.category}`);
      console.error(`    Preview:  ${f.maskedFinding}\n`);
    });

    console.error(`⚠️  Action Required: Sanitize personal identifiable information before committing.`);
    console.error(`⚠️  Note: Scanner NEVER deletes files automatically. Values are redacted in output.\n`);
    process.exit(1);
  }
}
