/**
 * ============================================================================
 * SLEEPYKOALA CMS — GITHUB WEBHOOK ENDPOINT (CLOUDFLARE PAGES FUNCTIONS)
 * Route: /api/webhook/github
 * 
 * Capabilities & Security Guarantees:
 * 1. Web Cryptography HMAC-SHA256 signature verification (X-Hub-Signature-256).
 * 2. Constant-time signature comparison to eliminate timing attacks.
 * 3. Payload size enforcement: max 1 MB (1,048,576 bytes), HTTP 413.
 * 4. Repository Allowlist validation: rejects untracked or unknown repositories.
 * 5. Special freeze policy enforcement: the-broken-origin is strictly blocked.
 * 6. Delivery Idempotency: tracks X-GitHub-Delivery to ignore duplicate payloads.
 * 7. Canonical metadata translation:
 *    - publicationStatus is ALWAYS 'draft'.
 *    - implementationStatus is NEVER automatically changed to 'completed'.
 * 8. Server-to-Server M2M sync to Google Apps Script (action: SYNC_PROGRESS_METADATA).
 * 9. Fail-Closed security: Unconfigured secrets reject with HTTP 500/401.
 * ============================================================================
 */

import {
  AuthEnv,
  callGasBackend,
} from '../admin/auth/utils';
import {
  GitHubWebhookEnv,
  MAX_WEBHOOK_PAYLOAD_BYTES,
  verifyGitHubSignature,
  resolveRepositoryMapping,
  globalDeliveryTracker,
  transformPushEvent,
  transformPullRequestEvent,
  transformReleaseEvent,
} from '../../../src/services/githubWebhookService';

export const WEBHOOK_SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=UTF-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256, X-GitHub-Event, X-GitHub-Delivery',
};

function jsonResponse(data: Record<string, any>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: WEBHOOK_SECURITY_HEADERS,
  });
}

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: WEBHOOK_SECURITY_HEADERS,
  });
};

export const onRequestPost = async (context: {
  request: Request;
  env: GitHubWebhookEnv & AuthEnv;
}): Promise<Response> => {
  const { request, env } = context;

  // 1. Strict Payload Size Check (Pre-read header inspection)
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredSize = parseInt(contentLengthHeader, 10);
    if (!isNaN(declaredSize) && declaredSize > MAX_WEBHOOK_PAYLOAD_BYTES) {
      return jsonResponse(
        {
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: `Ukuran payload (${declaredSize} bytes) melebihi batas 1 MB.`,
        },
        413
      );
    }
  }

  // 2. Read raw request bytes for HMAC computation & size enforcement
  let rawBytes: Uint8Array;
  let rawBodyText: string;
  try {
    const arrayBuffer = await request.arrayBuffer();
    rawBytes = new Uint8Array(arrayBuffer);
    if (rawBytes.byteLength > MAX_WEBHOOK_PAYLOAD_BYTES) {
      return jsonResponse(
        {
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: `Ukuran raw payload (${rawBytes.byteLength} bytes) melebihi batas 1 MB.`,
        },
        413
      );
    }
    rawBodyText = new TextDecoder('utf-8').decode(rawBytes);
  } catch (err: any) {
    return jsonResponse(
      {
        success: false,
        error: 'BAD_REQUEST',
        message: 'Gagal membaca payload request: ' + (err?.message || 'Unknown stream error'),
      },
      400
    );
  }

  // 3. Secret Resolution & Signature Verification
  const webhookSecret = env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.trim().length === 0) {
    console.error('[GitHub Webhook Security] GITHUB_WEBHOOK_SECRET tidak dikonfigurasi.');
    return jsonResponse(
      {
        success: false,
        error: 'WEBHOOK_SECRET_UNCONFIGURED',
        message: 'Konfigurasi secret webhook belum diatur di environment.',
      },
      500
    );
  }

  const signatureHeader = request.headers.get('x-hub-signature-256');
  const sigCheck = await verifyGitHubSignature(rawBytes, signatureHeader, webhookSecret);
  if (!sigCheck.valid) {
    console.warn('[GitHub Webhook Security] Verifikasi HMAC gagal:', sigCheck.error);
    return jsonResponse(
      {
        success: false,
        error: sigCheck.error || 'INVALID_SIGNATURE',
        message: 'Tanda tangan HMAC SHA-256 tidak valid atau tidak cocok.',
      },
      401
    );
  }

  // 4. Delivery Idempotency Handling (Atomic Check & Acquire)
  const deliveryId = request.headers.get('x-github-delivery');
  if (deliveryId) {
    const acquireRes = globalDeliveryTracker.acquire(deliveryId);
    if (acquireRes.isDuplicate) {
      return jsonResponse(
        {
          success: true,
          status: 'DUPLICATE_DELIVERY',
          deliveryId,
          message: 'Delivery event telah diproses sebelumnya (Idempotent ignore).',
        },
        200
      );
    }
    if (!acquireRes.acquired) {
      console.error('[GitHub Webhook Idempotency] Gagal menyimpan delivery ID:', acquireRes.error);
      return jsonResponse(
        {
          success: false,
          error: 'IDEMPOTENCY_STORAGE_ERROR',
          message: 'Gagal mengamankan status idempotensi delivery event.',
        },
        500
      );
    }
  }

  // 5. JSON Parsing
  let payload: any;
  try {
    payload = JSON.parse(rawBodyText);
  } catch {
    return jsonResponse(
      {
        success: false,
        error: 'INVALID_JSON',
        message: 'Payload bukan JSON yang valid.',
      },
      400
    );
  }

  // 6. Event Header Handling
  const eventType = request.headers.get('x-github-event');
  if (!eventType || eventType.trim().length === 0) {
    return jsonResponse(
      {
        success: false,
        error: 'MISSING_EVENT_HEADER',
        message: 'Header X-GitHub-Event wajib disertakan.',
      },
      400
    );
  }

  // Handle ping event (initial handshake from GitHub UI)
  if (eventType === 'ping') {
    return jsonResponse(
      {
        success: true,
        status: 'PONG',
        zen: payload.zen || 'Keep it logically awesome.',
        deliveryId: deliveryId || 'none',
      },
      200
    );
  }

  // 7. Repository Allowlist, Owner Verification & Stage 3 Prerequisites
  const rawRepoName = payload.repository?.name;
  const rawRepoOwner = payload.repository?.owner?.login;
  const rawFullName = payload.repository?.full_name || (rawRepoOwner && rawRepoName ? `${rawRepoOwner}/${rawRepoName}` : (rawRepoName || ''));

  const repoCheck = resolveRepositoryMapping(rawFullName, {
    owner: rawRepoOwner,
    repoName: rawRepoName,
    configuredPortfolioOwner: env.PORTFOLIO_APPROVED_OWNER,
    allowUnverifiedPrerequisitesForTesting: env.ENVIRONMENT === 'test',
  });

  if (repoCheck.frozen) {
    console.warn(`[GitHub Webhook Policy] Repositori ${rawFullName} DIBLOKIR: Proyek dibekukan.`);
    return jsonResponse(
      {
        success: false,
        error: 'REPOSITORY_FROZEN',
        reason: repoCheck.message || repoCheck.error,
        message: 'Operasi webhook untuk repositori ini ditolak oleh kebijakan keamanan isolasi proyek.',
      },
      403
    );
  }

  if (repoCheck.error === 'UNAUTHORIZED_REPOSITORY_OWNER') {
    console.warn(`[GitHub Webhook Policy] Owner repositori ditolak: ${rawFullName}`);
    return jsonResponse(
      {
        success: false,
        error: 'UNAUTHORIZED_REPOSITORY_OWNER',
        message: repoCheck.message || 'Owner repositori tidak cocok dengan pemetaan resmi Stage 3.',
      },
      403
    );
  }

  if (repoCheck.error === 'STAGE3_PREREQUISITE_UNMET' || repoCheck.error === 'UNVERIFIED_OWNER') {
    console.warn(`[GitHub Webhook Policy] Prasyarat Stage 3 belum terpenuhi: ${rawFullName} (${repoCheck.stage3Condition})`);
    return jsonResponse(
      {
        success: false,
        error: repoCheck.error,
        stage3Condition: repoCheck.stage3Condition,
        message: repoCheck.message || 'Repositori belum memenuhi prasyarat integrasi Stage 3.',
      },
      403
    );
  }

  if (!repoCheck.approved || !repoCheck.info) {
    console.warn(`[GitHub Webhook Policy] Repositori tidak diizinkan: ${rawFullName}`);
    return jsonResponse(
      {
        success: false,
        error: repoCheck.error || 'UNAUTHORIZED_REPOSITORY',
        message: repoCheck.message || 'Repositori tidak terdaftar dalam allowlist sinkronisasi resmi SleepyKoala Studio.',
      },
      403
    );
  }

  const projectSlug = repoCheck.info.slug;

  // 8. Event Processing & Metadata Translation
  let progressEvent: any = null;

  if (eventType === 'push') {
    progressEvent = transformPushEvent(payload, projectSlug);
  } else if (eventType === 'pull_request') {
    progressEvent = transformPullRequestEvent(payload, projectSlug);
    if (!progressEvent) {
      // PR event that does not require a changelog entry (e.g. unmerged close)
      return jsonResponse(
        {
          success: true,
          status: 'IGNORED_PR_ACTION',
          action: payload.action,
          message: 'Aksi PR diabaikan oleh kebijakan publikasi.',
        },
        200
      );
    }
  } else if (eventType === 'release') {
    progressEvent = transformReleaseEvent(payload, projectSlug);
  } else {
    // Unsupported event (issues, star, fork, etc.)
    return jsonResponse(
      {
        success: true,
        status: 'IGNORED_EVENT',
        eventType,
        message: `Event '${eventType}' diabaikan secara aman sesuai kebijakan webhook.`,
      },
      200
    );
  }

  // 9. Upstream Google Apps Script Synchronization (if configured)
  let upstreamStatus = 'LOCAL_SYNC_ONLY';
  let upstreamDetails: any = null;

  if (env.GAS_WEBAPP_URL && env.GAS_WEBAPP_URL.trim().length > 0) {
    try {
      const gasResult = await callGasBackend(env, 'SYNC_PROGRESS_METADATA', {
        projectSlug,
        event: progressEvent,
        githubDeliveryId: deliveryId || 'none',
        eventType,
      });

      if (gasResult.status === 200 && gasResult.body?.success) {
        upstreamStatus = 'UPSTREAM_SYNCED';
        upstreamDetails = gasResult.body;
      } else {
        console.warn('[GitHub Webhook Upstream] Gagal menyinkronkan ke Apps Script:', gasResult.body);
        upstreamStatus = 'UPSTREAM_FAILED_NON_BLOCKING';
        upstreamDetails = gasResult.body;
      }
    } catch (gasErr: any) {
      console.error('[GitHub Webhook Upstream] Exception saat menghubungi Apps Script:', gasErr?.message);
      upstreamStatus = 'UPSTREAM_EXCEPTION';
    }
  }

  return jsonResponse(
    {
      success: true,
      status: 'PROCESSED',
      projectSlug,
      eventType,
      deliveryId: deliveryId || 'none',
      event: progressEvent,
      upstreamStatus,
      upstreamDetails,
    },
    200
  );
};
