/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION: AUDIT LOGGER (STAGE 3)
 * 
 * Local, security-sanitized audit log for Git automation operations.
 * ZERO CREDENTIALS, ZERO PII, ZERO RAW SECRETS SAVED.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { sanitizeRemoteUrl } from './config.js';

const LOG_DIR = 'docs/audit';
const LOG_FILE = path.join(LOG_DIR, 'git-automation.log');

/**
 * Appends a structured, sanitized audit entry to the local log file.
 * @param {object} entry Audit entry data.
 */
export function logAuditEntry(entry) {
  const timestamp = new Date().toISOString();

  const sanitizedEntry = {
    timestamp,
    projectId: entry.projectId || 'UNKNOWN',
    projectSlug: entry.projectSlug || 'UNKNOWN',
    mode: entry.mode || 'DRY-RUN',
    repoRoot: entry.repoRoot || '',
    branch: entry.branch || '',
    remoteUrl: sanitizeRemoteUrl(entry.remoteUrl),
    filesConsidered: Array.isArray(entry.filesConsidered) ? entry.filesConsidered.length : 0,
    filesStaged: Array.isArray(entry.filesStaged) ? entry.filesStaged.length : 0,
    qualityGatesPassed: entry.qualityGatesPassed === true,
    commitHash: entry.commitHash || null,
    pushSuccess: entry.pushSuccess === true,
    status: entry.status || 'SUCCESS',
    failureReason: entry.failureReason ? String(entry.failureReason).substring(0, 300) : null,
  };

  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const logLine = JSON.stringify(sanitizedEntry) + '\n';
    fs.appendFileSync(LOG_FILE, logLine, 'utf-8');
    return true;
  } catch {
    // Fail-safe: Audit logging failure must not break caller or leak data
    return false;
  }
}
