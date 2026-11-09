/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GITHUB WEBHOOK SERVICE & SECURITY ENGINE (STAGE 4)
 * 
 * Capabilities:
 * 1. Web Cryptography API HMAC-SHA256 signature verification (X-Hub-Signature-256).
 * 2. Constant-time signature comparison (mitigating timing attacks).
 * 3. Strict repository allowlist & owner verification matching Stage 3:
 *    - Rejects repositories with incorrect owner even if repo name matches.
 *    - Enforces Stage 3 integration prerequisites (MISSING_GIT, MISSING_REMOTE).
 * 4. Special policy enforcement: the-broken-origin frozen repository protection.
 * 5. Atomic delivery idempotency handling via X-GitHub-Delivery tracking:
 *    - Guards against parallel race conditions.
 *    - Fail-closed if delivery ID storage fails.
 *    - Documented ephemeral per-instance boundary (no false exactly-once claims).
 * 6. Canonical metadata transformation preserving strict lifecycle separation:
 *    - publicationStatus is ALWAYS 'draft' (editorial gating).
 *    - implementationStatus is NEVER automatically flipped to 'completed'.
 * 7. Fail-closed secret resolution & sanitized audit logging.
 * ============================================================================
 */

import {
  ProgressEvent,
  ProgressEventType,
  PublicationStatus,
} from '../types/portfolioProgress';

export const MAX_WEBHOOK_PAYLOAD_BYTES = 1024 * 1024; // 1 MB limit

export interface GitHubWebhookEnv {
  GITHUB_WEBHOOK_SECRET?: string;
  PORTFOLIO_APPROVED_OWNER?: string;
  GAS_WEBAPP_URL?: string;
  APPS_SCRIPT_SECRET?: string;
  SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET?: string;
  ENVIRONMENT?: string;
}

export type Stage3Condition =
  | 'MISSING_REMOTE'
  | 'MISSING_GIT'
  | 'VISIBILITY_UNVERIFIED'
  | 'STRICT_FREEZE';

export interface Stage3RepoConfig {
  readonly slug: string;
  readonly canonicalName: string;
  readonly expectedOwner: string | null;
  readonly expectedRepo: string;
  readonly stage3Condition: Stage3Condition;
  readonly readyForProductionWebhook: boolean;
  readonly frozen?: boolean;
  readonly unmetPrerequisiteReason?: string;
}

/**
 * Strict repository allowlist derived directly from Stage 3 REPOSITORY_MAPPING.md
 * and scripts/git-automation/config.js.
 */
export const STAGE3_REPOSITORY_MAP: Readonly<Record<string, Stage3RepoConfig>> = {
  'dompetnalar': {
    slug: 'dompetnalar',
    canonicalName: 'DompetNalar (FinSmart)',
    expectedOwner: 'lunachroc07-dot',
    expectedRepo: 'finsmart',
    stage3Condition: 'VISIBILITY_UNVERIFIED',
    readyForProductionWebhook: true, // Stage 7: Confirmed private repository, unlocked for production webhook intake
    unmetPrerequisiteReason: 'Repository exists and verified private for Stage 7 live webhook intake.',
  },
  'indie-developer-portfolio': {
    slug: 'indie-developer-portfolio',
    canonicalName: 'SleepyKoala Studio Website',
    expectedOwner: null, // Remote not yet configured on local repository in Stage 3
    expectedRepo: 'indie-developer-portfolio',
    stage3Condition: 'MISSING_REMOTE',
    readyForProductionWebhook: false,
    unmetPrerequisiteReason: 'Local repository has no Git remote or verified owner configured (MISSING_REMOTE).',
  },
  'idle-master': {
    slug: 'idle-master',
    canonicalName: 'IDLE MASTER',
    expectedOwner: null,
    expectedRepo: 'idle-master',
    stage3Condition: 'MISSING_GIT',
    readyForProductionWebhook: false,
    unmetPrerequisiteReason: 'Directory does not contain a Git repository (.git missing).',
  },
  'mobile-kasir': {
    slug: 'mobile-kasir',
    canonicalName: 'Mobile Kasir',
    expectedOwner: null,
    expectedRepo: 'mobile-kasir',
    stage3Condition: 'MISSING_GIT',
    readyForProductionWebhook: false,
    unmetPrerequisiteReason: 'Directory does not contain a Git repository (.git missing).',
  },
  'idle-mining': {
    slug: 'idle-mining',
    canonicalName: 'Idle Mining',
    expectedOwner: null,
    expectedRepo: 'idle-mining',
    stage3Condition: 'MISSING_REMOTE',
    readyForProductionWebhook: false,
    unmetPrerequisiteReason: 'Git repository has no remote configured (git remote -v is empty).',
  },
  'worklume': {
    slug: 'worklume',
    canonicalName: 'Worklume',
    expectedOwner: null,
    expectedRepo: 'worklume',
    stage3Condition: 'MISSING_GIT',
    readyForProductionWebhook: false,
    unmetPrerequisiteReason: 'Directory does not contain a Git repository (.git missing).',
  },
  'the-broken-origin': {
    slug: 'the-broken-origin',
    canonicalName: 'The Broken Origin (TBO ROBLOX)',
    expectedOwner: 'zweifeel',
    expectedRepo: 'tbo-roblox',
    stage3Condition: 'STRICT_FREEZE',
    readyForProductionWebhook: false,
    frozen: true,
    unmetPrerequisiteReason: 'Strict freeze policy: the-broken-origin is prohibited from all automated synchronization.',
  },
};

export interface ResolveRepoOptions {
  owner?: string;
  repoName?: string;
  configuredPortfolioOwner?: string;
  allowUnverifiedPrerequisitesForTesting?: boolean;
}

export interface ResolveRepoResult {
  approved: boolean;
  info?: Stage3RepoConfig;
  frozen?: boolean;
  stage3Condition?: Stage3Condition | 'UNKNOWN';
  error?: string;
  message?: string;
}

/**
 * Resolves and validates repository identity:
 * - Verifies owner + repo name combination.
 * - Rejects repos with wrong owner even if repo name matches.
 * - Explicitly and unconditionally blocks the-broken-origin (TBO).
 * - Enforces Stage 3 integration readiness.
 */
export function resolveRepositoryMapping(
  repoIdentifier: string | undefined,
  options: ResolveRepoOptions = {}
): ResolveRepoResult {
  if (!repoIdentifier || typeof repoIdentifier !== 'string' || repoIdentifier.trim().length === 0) {
    return {
      approved: false,
      error: 'MISSING_REPOSITORY_IDENTIFIER',
      message: 'Repository identifier is missing or empty.',
    };
  }

  const clean = repoIdentifier.trim();
  let parsedOwner: string | null = options.owner ? options.owner.trim().toLowerCase() : null;
  let parsedRepo: string = options.repoName ? options.repoName.trim().toLowerCase() : '';

  if (clean.includes('/')) {
    const parts = clean.split('/');
    parsedOwner = parts[0].trim().toLowerCase();
    parsedRepo = parts[1].trim().toLowerCase();
  } else if (!parsedRepo) {
    parsedRepo = clean.toLowerCase();
  }

  // 1. Unconditional check for the-broken-origin (STRICT FREEZE)
  if (
    parsedRepo === 'the-broken-origin' ||
    parsedRepo === 'tbo-roblox' ||
    parsedRepo === 'tbo' ||
    (parsedOwner === 'zweifeel' && parsedRepo.includes('tbo'))
  ) {
    return {
      approved: false,
      frozen: true,
      stage3Condition: 'STRICT_FREEZE',
      error: 'REPOSITORY_FROZEN',
      message: 'the-broken-origin is strictly frozen under repository isolation policy.',
    };
  }

  // 2. Lookup in Stage 3 Repository Matrix
  let matchedConfig: Stage3RepoConfig | null = null;
  for (const config of Object.values(STAGE3_REPOSITORY_MAP)) {
    const target = config.expectedRepo.toLowerCase();
    if (parsedRepo === target || parsedRepo === config.slug.toLowerCase()) {
      matchedConfig = config;
      break;
    }
  }

  if (!matchedConfig) {
    return {
      approved: false,
      stage3Condition: 'UNKNOWN',
      error: 'UNAUTHORIZED_REPOSITORY',
      message: `Repository '${parsedRepo}' is not registered in the approved Stage 3 mapping.`,
    };
  }

  // 3. Strict Owner Verification (Higher precedence than prerequisite readiness)
  if (matchedConfig.expectedOwner !== null) {
    if (!parsedOwner) {
      return {
        approved: false,
        stage3Condition: matchedConfig.stage3Condition,
        error: 'MISSING_REPOSITORY_OWNER',
        message: `Repository '${matchedConfig.expectedRepo}' requires explicit owner verification (expected: '${matchedConfig.expectedOwner}').`,
      };
    }

    if (parsedOwner !== matchedConfig.expectedOwner.toLowerCase()) {
      return {
        approved: false,
        stage3Condition: matchedConfig.stage3Condition,
        error: 'UNAUTHORIZED_REPOSITORY_OWNER',
        message: `Repository owner '${parsedOwner}' does not match expected owner '${matchedConfig.expectedOwner}'.`,
      };
    }
  } else {
    // Project has no verified owner configured in Stage 3 (e.g. indie-developer-portfolio, mobile-kasir)
    const configuredOwner = options.configuredPortfolioOwner?.trim().toLowerCase();
    if (configuredOwner && parsedOwner && parsedOwner !== configuredOwner) {
      return {
        approved: false,
        stage3Condition: matchedConfig.stage3Condition,
        error: 'UNAUTHORIZED_REPOSITORY_OWNER',
        message: `Repository owner '${parsedOwner}' does not match configured owner '${configuredOwner}'.`,
      };
    }
  }

  // 4. Stage 3 Integration Prerequisite Check (Production Readiness)
  if (!matchedConfig.readyForProductionWebhook && !options.allowUnverifiedPrerequisitesForTesting) {
    return {
      approved: false,
      stage3Condition: matchedConfig.stage3Condition,
      error: 'STAGE3_PREREQUISITE_UNMET',
      message: matchedConfig.unmetPrerequisiteReason || 'Project has not met Stage 3 integration prerequisites.',
    };
  }

  // 5. Unverified Owner Check for projects with null expectedOwner
  if (
    matchedConfig.expectedOwner === null &&
    parsedOwner &&
    parsedOwner !== 'sleepykoala-studio' &&
    parsedOwner !== 'zweifeel' &&
    !options.configuredPortfolioOwner
  ) {
    return {
      approved: false,
      stage3Condition: matchedConfig.stage3Condition,
      error: 'UNVERIFIED_OWNER',
      message: `Repository '${matchedConfig.expectedRepo}' has no verified owner in Stage 3 mapping.`,
    };
  }

  return {
    approved: true,
    info: matchedConfig,
    stage3Condition: matchedConfig.stage3Condition,
  };
}

// ============================================================================
// 1. CRYPTO & CONSTANT-TIME SIGNATURE ENGINE (WEB CRYPTOGRAPHY API)
// ============================================================================

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Computes HMAC-SHA256 hex digest for a raw UTF-8 string or byte array using Web Cryptography API.
 */
export async function computeHmacSha256Hex(
  data: string | Uint8Array,
  secret: string
): Promise<string> {
  const enc = new TextEncoder();
  const rawBytes = typeof data === 'string' ? enc.encode(data) : data;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, rawBytes as unknown as BufferSource);
  const hashBytes = new Uint8Array(signatureBuffer);

  let hex = '';
  for (let i = 0; i < hashBytes.length; i++) {
    hex += hashBytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Validates GitHub X-Hub-Signature-256 header.
 */
export async function verifyGitHubSignature(
  rawBody: string | Uint8Array,
  signatureHeader: string | null | undefined,
  secret: string | undefined
): Promise<{ valid: boolean; error?: string }> {
  if (!secret || secret.trim().length === 0) {
    return {
      valid: false,
      error: 'WEBHOOK_SECRET_UNCONFIGURED',
    };
  }

  if (!signatureHeader || typeof signatureHeader !== 'string' || signatureHeader.trim().length === 0) {
    return {
      valid: false,
      error: 'MISSING_SIGNATURE_HEADER',
    };
  }

  const prefix = 'sha256=';
  const cleanHeader = signatureHeader.trim();
  if (!cleanHeader.startsWith(prefix)) {
    return {
      valid: false,
      error: 'MALFORMED_SIGNATURE_HEADER',
    };
  }

  const receivedHex = cleanHeader.substring(prefix.length).trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(receivedHex)) {
    return {
      valid: false,
      error: 'INVALID_HEX_SIGNATURE',
    };
  }

  try {
    const expectedHex = await computeHmacSha256Hex(rawBody, secret);
    const matches = constantTimeCompare(expectedHex, receivedHex);

    if (!matches) {
      return {
        valid: false,
        error: 'SIGNATURE_MISMATCH',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'SIGNATURE_COMPUTATION_FAILED',
    };
  }
}

// ============================================================================
// 2. IDEMPOTENCY ENGINE (DELIVERY ID TRACKER)
// ============================================================================

export interface DeliveryAcquireResult {
  isDuplicate: boolean;
  acquired: boolean;
  error?: string;
}

/**
 * Ephemeral In-Memory Delivery Tracker.
 * 
 * ARCHITECTURAL LIMITATION & DURABILITY NOTICE:
 * - This cache is in-memory and local to a single Cloudflare Worker instance.
 * - It guards against sequential and parallel duplicates arriving at the same instance.
 * - It does NOT provide distributed, persistent cross-instance deduplication.
 * - Upon worker restart or request routing to another edge pop, memory is reset.
 * - Delivery guarantee is AT-LEAST-ONCE. Exactly-once processing is NOT claimed.
 * - Production integration status: BLOCKED_PENDING_PERSISTENT_IDEMPOTENCY.
 */
export class DeliveryIdTracker {
  private seenIds: Set<string> = new Set();
  private maxCapacity: number;
  public simulateStorageFailure: boolean = false;

  constructor(maxCapacity: number = 1000) {
    this.maxCapacity = maxCapacity;
  }

  public hasSeen(deliveryId: string): boolean {
    if (!deliveryId || typeof deliveryId !== 'string') return false;
    return this.seenIds.has(deliveryId.trim());
  }

  /**
   * Atomically checks and reserves a delivery ID.
   * If two requests with the same ID arrive in parallel, the second fails immediately.
   */
  public acquire(deliveryId: string): DeliveryAcquireResult {
    if (!deliveryId || typeof deliveryId !== 'string') {
      return { isDuplicate: false, acquired: false, error: 'INVALID_DELIVERY_ID' };
    }
    const clean = deliveryId.trim();

    if (this.simulateStorageFailure) {
      return { isDuplicate: false, acquired: false, error: 'STORAGE_FAILURE' };
    }

    if (this.seenIds.has(clean)) {
      return { isDuplicate: true, acquired: false };
    }

    // Capacity eviction (FIFO)
    if (this.seenIds.size >= this.maxCapacity) {
      const first = this.seenIds.values().next().value;
      if (first !== undefined) {
        this.seenIds.delete(first);
      }
    }

    this.seenIds.add(clean);
    return { isDuplicate: false, acquired: true };
  }

  public record(deliveryId: string): boolean {
    return this.acquire(deliveryId).acquired;
  }

  public clear(): void {
    this.seenIds.clear();
  }

  public simulateInstanceRestart(): void {
    this.clear();
  }

  public size(): number {
    return this.seenIds.size;
  }
}

export const globalDeliveryTracker = new DeliveryIdTracker(1000);

// ============================================================================
// 3. SANITIZATION & SCRUBBING UTILITIES
// ============================================================================

export function sanitizeTextContent(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // 1. Scrub tokens / secret patterns first
  sanitized = sanitized.replace(/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}/g, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/(api[-_]?key|secret|token|password)\s*[:=]\s*['"]?[a-zA-Z0-9_\-.~+]{8,}['"]?/gi, '$1="[REDACTED]"');

  // 2. Scrub credentials embedded in URLs
  sanitized = sanitized.replace(/https?:\/\/[^@\s]+@([^\s]+)/g, 'https://***@$1');

  // 3. Scrub local paths (Windows & POSIX, handling spaces in directory names)
  sanitized = sanitized.replace(/[A-Za-z]:\\[^\r\n'"]+(?:\.[a-zA-Z0-9]+|\b)/g, '[INTERNAL_PATH]');
  sanitized = sanitized.replace(/\/(?:home|Users|var|tmp|etc)\/[^ \t\r\n'"]+/g, '[INTERNAL_PATH]');

  return sanitized.trim();
}

export function sanitizeUrl(urlStr: string | undefined): string | undefined {
  if (!urlStr || typeof urlStr !== 'string') return undefined;
  try {
    const parsed = new URL(urlStr);
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return sanitizeTextContent(urlStr);
  }
}

// ============================================================================
// 4. EVENT TRANSFORMATION TO CANONICAL METADATA
// ============================================================================

export interface RawCommit {
  id?: string;
  message?: string;
  timestamp?: string;
  url?: string;
  author?: {
    name?: string;
    email?: string;
  };
}

export interface GitHubPushPayload {
  ref?: string;
  before?: string;
  after?: string;
  created?: boolean;
  deleted?: boolean;
  forced?: boolean;
  commits?: RawCommit[];
  head_commit?: RawCommit | null;
  repository?: {
    name?: string;
    full_name?: string;
    html_url?: string;
    private?: boolean;
    owner?: {
      login?: string;
    };
  };
  pusher?: {
    name?: string;
  };
  sender?: {
    login?: string;
  };
}

export interface GitHubPullRequestPayload {
  action?: string;
  number?: number;
  pull_request?: {
    id?: number;
    number?: number;
    title?: string;
    body?: string | null;
    state?: string;
    merged?: boolean;
    merged_at?: string | null;
    head?: {
      ref?: string;
      sha?: string;
    };
    base?: {
      ref?: string;
    };
    html_url?: string;
  };
  repository?: {
    name?: string;
    full_name?: string;
    owner?: {
      login?: string;
    };
  };
  sender?: {
    login?: string;
  };
}

export interface GitHubReleasePayload {
  action?: string;
  release?: {
    id?: number;
    tag_name?: string;
    name?: string | null;
    body?: string | null;
    draft?: boolean;
    prerelease?: boolean;
    published_at?: string | null;
    html_url?: string;
  };
  repository?: {
    name?: string;
    full_name?: string;
    owner?: {
      login?: string;
    };
  };
  sender?: {
    login?: string;
  };
}

export function transformPushEvent(
  payload: GitHubPushPayload,
  slug: string
): ProgressEvent {
  const commit = payload.head_commit || (payload.commits && payload.commits.length > 0 ? payload.commits[0] : null);
  const rawMsg = commit?.message || 'Repository updated via push';
  const firstLine = rawMsg.split('\n')[0].trim();
  const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';

  const shortSha = commit?.id ? commit.id.substring(0, 7) : 'head';
  const title = sanitizeTextContent(`[${branch}] ${firstLine}`);
  const description = sanitizeTextContent(
    commit?.message || `Pushed to branch ${branch} with commit ${shortSha}`
  );

  const timestamp = commit?.timestamp || new Date().toISOString();
  const eventId = `evt_${slug}_push_${shortSha}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    id: eventId,
    eventType: 'general_update' as ProgressEventType,
    title,
    description,
    timestamp,
    publicationStatus: 'draft' as PublicationStatus, // Invariant: fail-closed draft
  };
}

export function transformPullRequestEvent(
  payload: GitHubPullRequestPayload,
  slug: string
): ProgressEvent | null {
  const pr = payload.pull_request;
  if (!pr) return null;

  const isMerged = payload.action === 'closed' && pr.merged === true;
  const isOpened = payload.action === 'opened';

  if (!isMerged && !isOpened) {
    return null;
  }

  const actionText = isMerged ? 'Merged PR' : 'Opened PR';
  const prNum = pr.number || payload.number || 0;
  const rawTitle = pr.title || `Pull Request #${prNum}`;
  const title = sanitizeTextContent(`${actionText} #${prNum}: ${rawTitle}`);
  const description = sanitizeTextContent(pr.body || `Pull request #${prNum} (${pr.state})`);
  const timestamp = pr.merged_at || new Date().toISOString();
  const eventId = `evt_${slug}_pr_${prNum}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    id: eventId,
    eventType: isMerged ? ('feature_released' as ProgressEventType) : ('general_update' as ProgressEventType),
    title,
    description,
    timestamp,
    publicationStatus: 'draft' as PublicationStatus, // Invariant: fail-closed draft
  };
}

export function transformReleaseEvent(
  payload: GitHubReleasePayload,
  slug: string
): ProgressEvent {
  const rel = payload.release;
  const tag = rel?.tag_name || 'v1.0.0';
  const releaseName = rel?.name || tag;
  const title = sanitizeTextContent(`Release ${releaseName}`);
  const description = sanitizeTextContent(rel?.body || `Official release ${tag} published.`);
  const timestamp = rel?.published_at || new Date().toISOString();
  const eventId = `evt_${slug}_rel_${tag}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    id: eventId,
    eventType: 'milestone_reached' as ProgressEventType,
    title,
    description,
    timestamp,
    publicationStatus: 'draft' as PublicationStatus, // Invariant: editorial approval required
  };
}
