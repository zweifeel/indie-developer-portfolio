import { Finding, ScanResult } from './security-scan';

export function scanPrivacyContent(filePath: string, content: string): Finding[];

export function runPrivacyScan(rootDir?: string, options?: any): ScanResult;
