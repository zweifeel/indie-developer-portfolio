export interface Finding {
  id: string;
  category: string;
  severity: string;
  classification?: string;
  file: string;
  line: number;
  description: string;
  maskedFinding: string;
}

export interface ScanResult {
  success: boolean;
  totalFilesScanned: number;
  totalFindings: number;
  actionableFindings?: number;
  criticalCount: number;
  highCount: number;
  findings: Finding[];
  actionable?: Finding[];
}

export const Severity: {
  CRITICAL: string;
  HIGH: string;
  MEDIUM: string;
  LOW: string;
};

export const Category: {
  SECRET_API_KEY: string;
  SECRET_PRIVATE_KEY: string;
  SECRET_KEYSTORE: string;
  SECRET_ENV_FILE: string;
  SECRET_CREDENTIAL: string;
  SECRET_DATABASE: string;
  PII_EMAIL: string;
  PII_PHONE: string;
  PII_IDENTITY_CARD: string;
  PII_CREDIT_CARD: string;
  SENSITIVE_FILE_NAME: string;
};

export const Classification: {
  CONFIRMED_TEST_FIXTURE: string;
  POTENTIAL_PII: string;
  CONFIRMED_SENSITIVE_FILE: string;
  FALSE_POSITIVE: string;
  NOT_VERIFIED: string;
};

export const DEFAULT_ALLOWLIST: string[];

export function maskSensitiveValue(str?: string): string;

export function scanFileContent(filePath: string, content: string, options?: any): Finding[];

export function getFilesToScan(rootDir: string, options?: any): string[];

export function runSecurityScan(rootDir?: string, options?: any): ScanResult;
