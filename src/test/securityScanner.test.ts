import { describe, it, expect } from 'vitest';
import {
  scanFileContent,
  maskSensitiveValue,
  runSecurityScan,
  Category,
  Severity,
} from '../../scripts/security-scan.js';
import fs from 'node:fs';
import path from 'node:path';

describe('A1: Local Security & Privacy Scanner Suite', () => {
  describe('1. Secret Masking & Non-Disclosure', () => {
    it('masks secrets so original value is not leaked in output', () => {
      const dummySecret = 'AIzaSyDummySecretValueForUnitTesting12';
      const masked = maskSensitiveValue(dummySecret);

      expect(masked).toContain('***REDACTED***');
      expect(masked).not.toBe(dummySecret);
      expect(masked.startsWith('AIz')).toBe(true);
      expect(masked.endsWith('12')).toBe(true);
    });

    it('masks short sensitive tokens completely', () => {
      expect(maskSensitiveValue('short')).toBe('***REDACTED***');
      expect(maskSensitiveValue('')).toBe('***REDACTED***');
    });
  });

  describe('2. Prohibited Sensitive File Detection', () => {
    it('flags .env and .env.production as prohibited files', () => {
      const findings = scanFileContent('.env', 'PORT=3000');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].category).toBe(Category.SENSITIVE_FILE_NAME);
      expect(findings[0].severity).toBe(Severity.CRITICAL);

      const prodFindings = scanFileContent('.env.production', 'NODE_ENV=production');
      expect(prodFindings.length).toBeGreaterThan(0);
      expect(prodFindings[0].category).toBe(Category.SENSITIVE_FILE_NAME);
    });

    it('allows .env.example with dummy variables', () => {
      const findings = scanFileContent('.env.example', 'API_KEY=your_key_here');
      expect(findings.length).toBe(0);
    });

    it('flags Android keystore and certificate binaries', () => {
      const jksFindings = scanFileContent('app/release.jks', '');
      expect(jksFindings.length).toBe(1);
      expect(jksFindings[0].description).toContain('Android cryptographic keystore');

      const keystoreFindings = scanFileContent('upload.keystore', '');
      expect(keystoreFindings.length).toBe(1);

      const p12Findings = scanFileContent('cert.p12', '');
      expect(p12Findings.length).toBe(1);
    });

    it('flags service account JSON and credentials.json', () => {
      const saFindings = scanFileContent('service-account-key.json', '{}');
      expect(saFindings.length).toBe(1);
      expect(saFindings[0].category).toBe(Category.SENSITIVE_FILE_NAME);

      const credFindings = scanFileContent('credentials.json', '{}');
      expect(credFindings.length).toBe(1);
    });
  });

  describe('3. In-File Secret Pattern Detection', () => {
    it('detects dummy Google Cloud / Firebase API keys', () => {
      // 39-char dummy AIza key
      const content = 'const API_KEY = "AIzaSyDUMMY_KEY_FOR_TESTING_123456789";';
      const findings = scanFileContent('src/config.ts', content);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.SECRET_API_KEY);
      expect(findings[0].severity).toBe(Severity.CRITICAL);
      expect(findings[0].maskedFinding).toContain('***REDACTED***');
    });

    it('detects dummy GitHub Personal Access Tokens (classic and fine-grained)', () => {
      const classicPat = 'const token = "ghp_111122223333444455556666777788889999";';
      const classicFindings = scanFileContent('src/github.ts', classicPat);
      expect(classicFindings.length).toBe(1);
      expect(classicFindings[0].category).toBe(Category.SECRET_API_KEY);

      const fineGrained = 'const pat = "github_pat_11AAAAAA22BBBBBB33CCCCCC44DDDDDD55EEEEEE66FFFFFF77GGGGGG88HHHHHH99IIIIII00JJJJJJ";';
      const fgFindings = scanFileContent('src/github.ts', fineGrained);
      expect(fgFindings.length).toBe(1);
      expect(fgFindings[0].category).toBe(Category.SECRET_API_KEY);
    });

    it('detects dummy Cryptographic Private Key blocks', () => {
      const dummyKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0dummykeyforunittestingpurposesonly
-----END RSA PRIVATE KEY-----`;
      const findings = scanFileContent('keys/private.pem', dummyKey);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.SECRET_PRIVATE_KEY);
      expect(findings[0].severity).toBe(Severity.CRITICAL);
    });

    it('detects dummy AWS Access Key IDs', () => {
      const content = 'export const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";';
      const findings = scanFileContent('src/aws.ts', content);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.SECRET_API_KEY);
    });

    it('detects hardcoded database connection strings with passwords', () => {
      const dbUrl = 'const DB_URI = "postgres://admin_user:super_secret_pw123@prod-db.internal:5432/main";';
      const findings = scanFileContent('src/db.ts', dbUrl);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.SECRET_DATABASE);
      expect(findings[0].severity).toBe(Severity.CRITICAL);
    });

    it('ignores safe localhost and dummy database URLs', () => {
      const localDb = 'const DB_URI = "postgres://user:pass@localhost:5432/dev";';
      const findings = scanFileContent('src/db.ts', localDb);
      expect(findings.length).toBe(0);
    });
  });

  describe('4. PII (Personally Identifiable Information) Detection', () => {
    it('detects Indonesian NIK candidates in identity context', () => {
      const piiLine = 'const test_nik = "3171010101990001"; // KTP pengguna';
      const findings = scanFileContent('src/models/user.ts', piiLine);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.PII_IDENTITY_CARD);
      expect(findings[0].severity).toBe(Severity.HIGH);
    });

    it('ignores random 16-digit numbers outside personal identity context', () => {
      const randomTimestampOrBigInt = 'const timestampNanos = 1714567890123456n;';
      const findings = scanFileContent('src/utils/time.ts', randomTimestampOrBigInt);
      expect(findings.length).toBe(0);
    });

    it('detects phone numbers in personal contact context', () => {
      const phoneLine = 'const kontak_pengguna_wa = "+6281234567890";';
      const findings = scanFileContent('src/data/tester.ts', phoneLine);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.PII_PHONE);
    });

    it('detects credit card candidate sequences in payment context', () => {
      const ccLine = 'const customer_credit_card = "4111111111111111";';
      const findings = scanFileContent('src/billing/card.ts', ccLine);

      expect(findings.length).toBe(1);
      expect(findings[0].category).toBe(Category.PII_CREDIT_CARD);
    });
  });

  describe('5. Scanner Execution & File Preservation Guarantee', () => {
    it('passes cleanly on standard portfolio source files', () => {
      const safeCode = `
        import React from 'react';
        export const SafeComponent: React.FC = () => {
          return <div>SleepyKoala Studio</div>;
        };
      `;
      const findings = scanFileContent('src/components/SafeComponent.tsx', safeCode);
      expect(findings.length).toBe(0);
    });

    it('guarantees source files are never deleted or modified by scanner', () => {
      const testFile = path.resolve(process.cwd(), 'src/test/temp_scanner_probe.dummy.tmp');
      const originalContent = 'const TEST_TOKEN = "AIzaSyDummySecretValueForUnitTesting12";';

      fs.writeFileSync(testFile, originalContent, 'utf-8');

      try {
        const scanResult = runSecurityScan(process.cwd(), {
          files: ['src/test/temp_scanner_probe.dummy.tmp'],
        });

        // Verify scan failed due to detected secret
        expect(scanResult.success).toBe(false);
        expect(scanResult.totalFindings).toBeGreaterThan(0);

        // Verify file still exists intact with exact byte content
        expect(fs.existsSync(testFile)).toBe(true);
        const contentAfterScan = fs.readFileSync(testFile, 'utf-8');
        expect(contentAfterScan).toBe(originalContent);
      } finally {
        // Clean up temporary test file
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });
});
