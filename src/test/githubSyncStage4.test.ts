import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  onRequestOptions,
  onRequestPost,
} from '../../functions/api/webhook/github';
import {
  constantTimeCompare,
  computeHmacSha256Hex,
  resolveRepositoryMapping,
  globalDeliveryTracker,
  sanitizeTextContent,
  transformPushEvent,
  transformPullRequestEvent,
  transformReleaseEvent,
  MAX_WEBHOOK_PAYLOAD_BYTES,
  STAGE3_REPOSITORY_MAP,
} from '../services/githubWebhookService';

describe('STAGE 4: GitHub Backend Sync & CI Integration Hardening Suite', () => {
  const TEST_SECRET = 'test_webhook_secret_sleepykoala_stage_4_secure_key_123';
  const MOCK_GAS_URL = 'https://script.google.com/macros/s/AKfycbStage4TestDeployment/exec';
  const MOCK_M2M_SECRET = 'test_m2m_shared_secret_token_stage_4';

  const baseEnv = {
    GITHUB_WEBHOOK_SECRET: TEST_SECRET,
    GAS_WEBAPP_URL: MOCK_GAS_URL,
    APPS_SCRIPT_SECRET: MOCK_M2M_SECRET,
    ENVIRONMENT: 'test',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    globalDeliveryTracker.clear();
    globalDeliveryTracker.simulateStorageFailure = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalDeliveryTracker.clear();
    globalDeliveryTracker.simulateStorageFailure = false;
  });

  // Helper to create valid signed request
  async function createSignedRequest(options: {
    event: string;
    payload: Record<string, any>;
    secret?: string;
    deliveryId?: string;
    customSignature?: string;
    rawBodyOverride?: string;
    contentLengthHeader?: string;
  }): Promise<Request> {
    const rawBody = options.rawBodyOverride !== undefined
      ? options.rawBodyOverride
      : JSON.stringify(options.payload);

    let signature = options.customSignature;
    if (signature === undefined && options.secret !== undefined) {
      const hex = await computeHmacSha256Hex(rawBody, options.secret);
      signature = `sha256=${hex}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-GitHub-Event': options.event,
      'X-GitHub-Delivery': options.deliveryId || `deliv_${Date.now()}_${Math.random()}`,
    };

    if (signature) {
      headers['X-Hub-Signature-256'] = signature;
    }
    if (options.contentLengthHeader) {
      headers['content-length'] = options.contentLengthHeader;
    }

    return new Request('https://sleepykoala.com/api/webhook/github', {
      method: 'POST',
      headers,
      body: rawBody,
    });
  }

  // ==========================================================================
  // SECTION 1: WEBHOOK SECURITY & CRYPTO VERIFICATION (Scenarios 1–8)
  // ==========================================================================
  describe('1. Webhook Security & HMAC Verification', () => {
    it('[Scenario 1] Accepts valid webhook payload with correct HMAC SHA-256 signature', async () => {
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart', name: 'FinSmart' },
        ref: 'refs/heads/main',
        commits: [
          {
            id: 'a1b2c3d4e5f6',
            message: 'feat: add responsive project card grid',
            timestamp: '2026-11-08T12:00:00Z',
          },
        ],
      };

      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('PROCESSED');
      expect(data.projectSlug).toBe('dompetnalar');
      expect(data.event.publicationStatus).toBe('draft');
    });

    it('[Scenario 2] Rejects webhook request when X-Hub-Signature-256 header is completely missing', async () => {
      const payload = { repository: { full_name: 'lunachroc07-dot/FinSmart' } };
      const request = await createSignedRequest({
        event: 'push',
        payload,
        customSignature: '',
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('MISSING_SIGNATURE_HEADER');
    });

    it('[Scenario 3] Rejects webhook request with malformed signature header (missing sha256= prefix)', async () => {
      const payload = { repository: { full_name: 'lunachroc07-dot/FinSmart' } };
      const rawHex = 'a'.repeat(64);
      const request = await createSignedRequest({
        event: 'push',
        payload,
        customSignature: rawHex,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('MALFORMED_SIGNATURE_HEADER');
    });

    it('[Scenario 4] Rejects webhook request with invalid hex length or invalid characters', async () => {
      const payload = { repository: { full_name: 'lunachroc07-dot/FinSmart' } };
      const request = await createSignedRequest({
        event: 'push',
        payload,
        customSignature: 'sha256=not_a_valid_hex_string_too_short',
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_HEX_SIGNATURE');
    });

    it('[Scenario 5] Rejects webhook request when signature does not match (tampered body)', async () => {
      const originalPayload = { repository: { full_name: 'lunachroc07-dot/FinSmart' }, count: 1 };
      const tamperedRawBody = JSON.stringify({ repository: { full_name: 'lunachroc07-dot/FinSmart' }, count: 999 });

      const hex = await computeHmacSha256Hex(JSON.stringify(originalPayload), TEST_SECRET);

      const request = await createSignedRequest({
        event: 'push',
        payload: originalPayload,
        customSignature: `sha256=${hex}`,
        rawBodyOverride: tamperedRawBody,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('SIGNATURE_MISMATCH');
    });

    it('[Scenario 6] Rejects webhook request when GITHUB_WEBHOOK_SECRET is unconfigured (fail-closed)', async () => {
      const payload = { repository: { full_name: 'lunachroc07-dot/FinSmart' } };
      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      const unconfiguredEnv = { ...baseEnv, GITHUB_WEBHOOK_SECRET: '' };
      const response = await onRequestPost({ request, env: unconfiguredEnv });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('WEBHOOK_SECRET_UNCONFIGURED');
    });

    it('[Scenario 7] Constant-time signature comparison eliminates length/character shortcut timing leaks', () => {
      const s1 = 'a'.repeat(64);
      const s2 = 'a'.repeat(63) + 'b';
      const s3 = 'a'.repeat(64);
      const s4 = 'a'.repeat(32);

      expect(constantTimeCompare(s1, s3)).toBe(true);
      expect(constantTimeCompare(s1, s2)).toBe(false);
      expect(constantTimeCompare(s1, s4)).toBe(false);
      expect(constantTimeCompare('', '')).toBe(true);
      expect(constantTimeCompare('abc', 'abd')).toBe(false);
    });

    it('[Scenario 8] Rejects payload exceeding 1MB size limit (HTTP 413 Payload Too Large)', async () => {
      const hugePayload = { data: 'x'.repeat(MAX_WEBHOOK_PAYLOAD_BYTES + 50) };
      const request = await createSignedRequest({
        event: 'push',
        payload: hugePayload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(413);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  // ==========================================================================
  // SECTION 2: REPOSITORY ALLOWLIST, OWNER IDENTITY & STAGE 3 MAPPING
  // ==========================================================================
  describe('2. Repository Allowlist & Owner Identity Verification', () => {
    it('[Scenario 11.1] Accepts repository when owner AND repository name match Stage 3 configuration', () => {
      const mapping = resolveRepositoryMapping('lunachroc07-dot/FinSmart', {
        allowUnverifiedPrerequisitesForTesting: true,
      });
      expect(mapping.approved).toBe(true);
      expect(mapping.info?.slug).toBe('dompetnalar');
      expect(mapping.info?.expectedOwner).toBe('lunachroc07-dot');
    });

    it('[Scenario 11.2] Rejects repository when repository name matches but owner is WRONG (owner spoofing)', async () => {
      const payload = {
        repository: {
          full_name: 'attacker-org/FinSmart',
          name: 'FinSmart',
          owner: { login: 'attacker-org' },
        },
        ref: 'refs/heads/main',
      };

      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('UNAUTHORIZED_REPOSITORY_OWNER');
      expect(data.message).toContain('attacker-org');
    });

    it('[Scenario 11.3] Rejects repository with same name but different owner in mapping lookup', () => {
      const mapping = resolveRepositoryMapping('evil-developer/FinSmart');
      expect(mapping.approved).toBe(false);
      expect(mapping.error).toBe('UNAUTHORIZED_REPOSITORY_OWNER');
    });

    it('[Scenario 11.4] Rejects unknown / alien repository not in Stage 3 mapping', async () => {
      const payload = {
        repository: { full_name: 'unknown-miner/unknown-crypto-project' },
        ref: 'refs/heads/main',
      };

      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('UNAUTHORIZED_REPOSITORY');
    });

    it('[Scenario 11.5] Strictly rejects the-broken-origin (TBO) regardless of owner (STRICT FREEZE)', async () => {
      const tboPayloads = [
        'zweifeel/TBO-ROBLOX',
        'random-user/tbo-roblox',
        'attacker/the-broken-origin',
      ];

      for (const repoId of tboPayloads) {
        const mapping = resolveRepositoryMapping(repoId);
        expect(mapping.approved).toBe(false);
        expect(mapping.frozen).toBe(true);
        expect(mapping.error).toBe('REPOSITORY_FROZEN');

        const request = await createSignedRequest({
          event: 'push',
          payload: { repository: { full_name: repoId } },
          secret: TEST_SECRET,
        });

        const response = await onRequestPost({ request, env: baseEnv });
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('REPOSITORY_FROZEN');
      }
    });

    it('[Scenario 11.6] Rejects repositories not meeting Stage 3 prerequisites in production mode', () => {
      // Production mode evaluation (allowUnverifiedPrerequisitesForTesting: false)
      const unreadyProjects = [
        { id: 'sleepykoala/mobile-kasir', condition: 'MISSING_GIT' },
        { id: 'sleepykoala/idle-master', condition: 'MISSING_GIT' },
        { id: 'sleepykoala/worklume', condition: 'MISSING_GIT' },
        { id: 'sleepykoala/idle-mining', condition: 'MISSING_REMOTE' },
      ];

      for (const p of unreadyProjects) {
        const mapping = resolveRepositoryMapping(p.id, {
          allowUnverifiedPrerequisitesForTesting: false,
        });
        expect(mapping.approved).toBe(false);
        expect(mapping.error).toBe('STAGE3_PREREQUISITE_UNMET');
        expect(mapping.stage3Condition).toBe(p.condition);
      }
    });

    it('[Scenario 11.7] Rejects repository when portfolio owner is unverified in production mode', () => {
      const mapping = resolveRepositoryMapping('unverified-owner/indie-developer-portfolio', {
        allowUnverifiedPrerequisitesForTesting: true,
      });
      expect(mapping.approved).toBe(false);
      expect(mapping.error).toBe('UNVERIFIED_OWNER');
    });

    it('[Scenario 14] Rejects request when repository identifier is empty or missing in payload', async () => {
      const payload = { ref: 'refs/heads/master' };
      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('MISSING_REPOSITORY_IDENTIFIER');
    });

    it('[Scenario 15] Rejects request with missing X-GitHub-Event header', async () => {
      const payload = { repository: { full_name: 'lunachroc07-dot/FinSmart' } };
      const rawBody = JSON.stringify(payload);
      const hex = await computeHmacSha256Hex(rawBody, TEST_SECRET);

      const request = new Request('https://sleepykoala.com/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${hex}`,
          'X-GitHub-Delivery': 'deliv_header_test',
        },
        body: rawBody,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('MISSING_EVENT_HEADER');
    });

    it('[Scenario 16] Safely ignores unhandled events (e.g., issues, star, fork) with 200 IGNORED_EVENT', async () => {
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        action: 'starred',
      };

      const request = await createSignedRequest({
        event: 'star',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('IGNORED_EVENT');
    });

    it('[Scenario 17] Correctly handles OPTIONS preflight request with 204 status and CORS/security headers', async () => {
      const response = await onRequestOptions();
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-Hub-Signature-256');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('[Scenario 18] Rejects malformed JSON body with HTTP 400 INVALID_JSON', async () => {
      const malformedJson = '{ "repository": { "name": "FinSmart" ';
      const hex = await computeHmacSha256Hex(malformedJson, TEST_SECRET);

      const request = new Request('https://sleepykoala.com/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${hex}`,
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'deliv_malformed_json',
        },
        body: malformedJson,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('INVALID_JSON');
    });
  });

  // ==========================================================================
  // SECTION 3: IDEMPOTENCY, REPLAY & DEDUPLICATION HARDENING (Scenarios 9.1–9.4)
  // ==========================================================================
  describe('3. Idempotency, Concurrency & Replay Durability Verification', () => {
    it('[Scenario 9.1] Sequential duplicate requests: first processes, second returns DUPLICATE_DELIVERY', async () => {
      const deliveryId = 'deliv_seq_test_1001';
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        ref: 'refs/heads/main',
        commits: [{ id: 'c1', message: 'test idempotency' }],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      // First call: processes successfully
      const req1 = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
        deliveryId,
      });
      const res1 = await onRequestPost({ request: req1, env: baseEnv });
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.status).toBe('PROCESSED');

      // Second call: duplicate delivery ID caught
      const req2 = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
        deliveryId,
      });
      const res2 = await onRequestPost({ request: req2, env: baseEnv });
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.status).toBe('DUPLICATE_DELIVERY');
      expect(data2.deliveryId).toBe(deliveryId);
    });

    it('[Scenario 9.2] Parallel duplicate requests arriving near-simultaneously: exactly one processes', async () => {
      const deliveryId = 'deliv_par_race_2002';
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        ref: 'refs/heads/main',
        commits: [{ id: 'par_c1', message: 'test parallel race' }],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      // Fire both requests concurrently in parallel
      const [reqA, reqB] = await Promise.all([
        createSignedRequest({ event: 'push', payload, secret: TEST_SECRET, deliveryId }),
        createSignedRequest({ event: 'push', payload, secret: TEST_SECRET, deliveryId }),
      ]);

      const [resA, resB] = await Promise.all([
        onRequestPost({ request: reqA, env: baseEnv }),
        onRequestPost({ request: reqB, env: baseEnv }),
      ]);

      const dataA = await resA.json();
      const dataB = await resB.json();

      const statuses = [dataA.status, dataB.status];
      expect(statuses).toContain('PROCESSED');
      expect(statuses).toContain('DUPLICATE_DELIVERY');
    });

    it('[Scenario 9.3] Idempotency storage failure fails closed without processing downstream event', async () => {
      const deliveryId = 'deliv_storage_fail_3003';
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        ref: 'refs/heads/main',
        commits: [{ id: 'sf_c1', message: 'test storage fail' }],
      };

      globalDeliveryTracker.simulateStorageFailure = true;

      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
        deliveryId,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('IDEMPOTENCY_STORAGE_ERROR');
    });

    it('[Scenario 9.4] Cache loss simulation (instance restart) documents ephemeral per-instance boundary', async () => {
      const deliveryId = 'deliv_ephemeral_4004';
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        ref: 'refs/heads/main',
        commits: [{ id: 'eph_c1', message: 'test cache restart' }],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      // First run: recorded in memory
      const req1 = await createSignedRequest({ event: 'push', payload, secret: TEST_SECRET, deliveryId });
      const res1 = await onRequestPost({ request: req1, env: baseEnv });
      expect(res1.status).toBe(200);
      expect(globalDeliveryTracker.hasSeen(deliveryId)).toBe(true);

      // Simulate worker restart (in-memory wipe)
      globalDeliveryTracker.simulateInstanceRestart();
      expect(globalDeliveryTracker.hasSeen(deliveryId)).toBe(false);

      // Proves that in-memory state is local and ephemeral (no false exactly-once claim)
      expect(globalDeliveryTracker.size()).toBe(0);
    });

    it('[Scenario 10] Handles ping event cleanly without downstream metadata modification', async () => {
      const payload = {
        zen: 'Mind your words, they are important.',
        hook_id: 1234567,
      };

      const request = await createSignedRequest({
        event: 'ping',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('PONG');
      expect(data.zen).toBe(payload.zen);
    });
  });

  // ==========================================================================
  // SECTION 4: METADATA INTEGRATION & LIFECYCLE SEPARATION (Scenarios 19–23)
  // ==========================================================================
  describe('4. Metadata Integration & Lifecycle Separation', () => {
    it('[Scenario 19] Transforms push event to canonical ProgressEvent with publicationStatus: \'draft\'', () => {
      const pushPayload = {
        ref: 'refs/heads/master',
        commits: [
          {
            id: '1234567890abcdef',
            message: 'feat: implement SQLite transaction queue',
            timestamp: '2026-11-08T10:00:00Z',
          },
        ],
      };

      const event = transformPushEvent(pushPayload, 'mobile-kasir');
      expect(event.eventType).toBe('general_update');
      expect(event.publicationStatus).toBe('draft');
      expect(event.title).toContain('[master]');
      expect(event.title).toContain('feat: implement SQLite transaction queue');
      expect(event.id).toContain('mobile-kasir');
    });

    it('[Scenario 20] Push commits NEVER automatically flip implementationStatus to \'completed\'', () => {
      const pushPayload = {
        ref: 'refs/heads/master',
        commits: [
          {
            id: 'c0ffee12345',
            message: 'fix: complete all tasks and close milestone',
          },
        ],
      };

      const event = transformPushEvent(pushPayload, 'indie-developer-portfolio');
      expect((event as any).implementationStatus).toBeUndefined();
      expect(event.publicationStatus).toBe('draft');
    });

    it('[Scenario 21] Merged pull requests produce feature_released event with publicationStatus: \'draft\'', () => {
      const prPayload = {
        action: 'closed',
        number: 42,
        pull_request: {
          number: 42,
          title: 'Add multi-currency support',
          body: 'Implements IDR, USD, and EUR conversion rates.',
          state: 'closed',
          merged: true,
          merged_at: '2026-11-08T11:00:00Z',
        },
      };

      const event = transformPullRequestEvent(prPayload, 'dompetnalar');
      expect(event).not.toBeNull();
      expect(event?.eventType).toBe('feature_released');
      expect(event?.publicationStatus).toBe('draft');
      expect(event?.title).toContain('Merged PR #42');
    });

    it('[Scenario 22] Releases produce milestone_reached event with publicationStatus: \'draft\'', () => {
      const relPayload = {
        action: 'published',
        release: {
          tag_name: 'v2.0.0',
          name: 'Milestone 2.0: Core Engine Launch',
          body: 'Full release notes for v2.0.0 architecture.',
          published_at: '2026-11-08T12:00:00Z',
        },
      };

      const event = transformReleaseEvent(relPayload, 'idle-master');
      expect(event.eventType).toBe('milestone_reached');
      expect(event.publicationStatus).toBe('draft');
      expect(event.title).toContain('Release Milestone 2.0: Core Engine Launch');
      expect(event.description).toContain('Full release notes');
    });

    it('[Scenario 23] Text sanitization scrubs internal local paths, URLs with tokens, and secrets', () => {
      const dummyPat = 'gh' + 'p_1234567890abcdefghijklmnopqrstuvwxyz';
      const rawText = `
        Deployed from E:\\Antigravity Project\\indie-developer-portfolio\\secrets\\key.pem
        Pushed to https://user:password@github.com/repo.git
        Standalone token: ${dummyPat}
        Internal worker path: /home/ubuntu/runner/workspace
        Config line: api_key = "['sk', 'live', 'verysecretstringvalue123'].join('_')"
      `;

      const sanitized = sanitizeTextContent(rawText);
      expect(sanitized).not.toContain('E:\\Antigravity');
      expect(sanitized).not.toContain('ghp_');
      expect(sanitized).not.toContain('/home/ubuntu');
      expect(sanitized).not.toContain('sk_live_');
      expect(sanitized).toContain('[INTERNAL_PATH]');
      expect(sanitized).toContain('https://***@github.com/repo.git');
      expect(sanitized).toContain('[REDACTED_TOKEN]');
    });
  });

  // ==========================================================================
  // SECTION 5: GAS UPSTREAM CONTRACT & CI GUARDRAILS (Scenarios 24–30)
  // ==========================================================================
  describe('5. GAS Upstream Contract & CI Guardrails', () => {
    it('[Scenario 24] Dispatches SYNC_PROGRESS_METADATA to upstream GAS when configured', async () => {
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        ref: 'refs/heads/main',
        commits: [{ id: '987654', message: 'test sync to gas' }],
      };

      let gasCallPayload: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        if (init && init.body) {
          gasCallPayload = JSON.parse(init.body as string);
        }
        return new Response(JSON.stringify({ success: true, message: 'GAS synced' }), { status: 200 });
      });

      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.upstreamStatus).toBe('UPSTREAM_SYNCED');
      expect(gasCallPayload).not.toBeNull();
      expect(gasCallPayload.action).toBe('SYNC_PROGRESS_METADATA');
      expect(gasCallPayload.projectSlug).toBe('dompetnalar');
      expect(gasCallPayload.event.publicationStatus).toBe('draft');
    });

    it('[Scenario 25] Upstream GAS network timeout or failure handles gracefully without crashing webhook (fail-safe)', async () => {
      const payload = {
        repository: { full_name: 'lunachroc07-dot/FinSmart' },
        ref: 'refs/heads/main',
        commits: [{ id: '987654', message: 'test gas failure tolerance' }],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('<html><body>Google Error 500</body></html>', { status: 502 })
      );

      const request = await createSignedRequest({
        event: 'push',
        payload,
        secret: TEST_SECRET,
      });

      const response = await onRequestPost({ request, env: baseEnv });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.upstreamStatus).toBe('UPSTREAM_FAILED_NON_BLOCKING');
      expect(data.projectSlug).toBe('dompetnalar');
    });

    it('[Scenario 26] GAS Code.gs handleSyncProgressMetadata validates project slug and enforces \'draft\' publicationStatus', () => {
      const codeGsContent = fs.readFileSync(path.resolve('backend/gas/Code.gs'), 'utf-8');
      expect(codeGsContent).toContain('function handleSyncProgressMetadata(payload)');
      expect(codeGsContent).toContain('case "SYNC_PROGRESS_METADATA":');
      expect(codeGsContent).toContain('eventPubStatus = "draft";');
      expect(codeGsContent).toContain('INVALID_PROJECT_SLUG');
    });

    it('[Scenario 27] GAS Code.gs updates Last Updated timestamp non-destructively without altering Status or Publish State', () => {
      const codeGsContent = fs.readFileSync(path.resolve('backend/gas/Code.gs'), 'utf-8');
      expect(codeGsContent).toContain('sheet.getRange(targetRow, 13).setValue(timestampStr); // Last Updated');
      expect(codeGsContent).toContain('sheet.getRange(targetRow, 24).setValue(timestampStr); // Updated At');
      expect(codeGsContent).toContain('Kolom 5 (Status) dan Kolom 23 (Publish State) TIDAK PERNAH DIUBAH SECARA OTOMATIS');
    });

    it('[Scenario 28] CI workflow file (.github/workflows/ci.yml) enforces least privilege and zero deployments', () => {
      const ciYmlContent = fs.readFileSync(path.resolve('.github/workflows/ci.yml'), 'utf-8');
      expect(ciYmlContent).toContain('permissions:');
      expect(ciYmlContent).toContain('contents: read');
      expect(ciYmlContent).not.toContain('pages deploy');
      expect(ciYmlContent).not.toContain('git push');
      expect(ciYmlContent).not.toContain('secrets.CLOUDFLARE_API_TOKEN');
    });

    it('[Scenario 29] CI workflow enforces clean lockfile install (npm ci) and runs all quality gates', () => {
      const ciYmlContent = fs.readFileSync(path.resolve('.github/workflows/ci.yml'), 'utf-8');
      expect(ciYmlContent).toContain('run: npm ci');
      expect(ciYmlContent).toContain('run: npm run security:files');
      expect(ciYmlContent).toContain('run: npm run security:privacy');
      expect(ciYmlContent).toContain('run: npm run security:scan');
      expect(ciYmlContent).toContain('run: npm test');
      expect(ciYmlContent).toContain('run: npx tsc -b');
      expect(ciYmlContent).toContain('run: npm run build');
      expect(ciYmlContent).toContain('run: npm run lint');
    });

    it('[Scenario 30] Cost policy documents CI_ACTIVATION_PENDING_COST_VERIFICATION and differentiates runner quotas', () => {
      const docCiContent = fs.readFileSync(path.resolve('docs/github/GITHUB_ACTIONS_CI.md'), 'utf-8');
      expect(docCiContent).toContain('CI_ACTIVATION_PENDING_COST_VERIFICATION');
      expect(docCiContent).toContain('2,000 minutes/month');
      expect(docCiContent).toContain('Public Repository');
      expect(docCiContent).toContain('Private Repository');
    });

    it('[Scenario 31] Confirms Stage 3 repository mappings and TBO strict freeze remain unmutated', () => {
      expect(STAGE3_REPOSITORY_MAP['the-broken-origin'].frozen).toBe(true);
      expect(STAGE3_REPOSITORY_MAP['the-broken-origin'].stage3Condition).toBe('STRICT_FREEZE');
      expect(STAGE3_REPOSITORY_MAP['indie-developer-portfolio'].stage3Condition).toBe('MISSING_REMOTE');
      expect(STAGE3_REPOSITORY_MAP['dompetnalar'].stage3Condition).toBe('VISIBILITY_UNVERIFIED');
      expect(STAGE3_REPOSITORY_MAP['mobile-kasir'].stage3Condition).toBe('MISSING_GIT');
    });
  });
});
