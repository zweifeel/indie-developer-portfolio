import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  onRequestPost,
} from '../../functions/api/webhook/github';
import {
  computeHmacSha256Hex,
  resolveRepositoryMapping,
  globalDeliveryTracker,
  STAGE3_REPOSITORY_MAP,
} from '../services/githubWebhookService';
import { render, screen } from '@testing-library/react';
import { RegistrationModal } from '../components/RegistrationModal';
import type { Project } from '../types/project';

describe('STAGE 7: Production Rollout, Cloudflare Headers & GitHub Webhook Sync Suite', () => {
  const TEST_SECRET = 'stage7_secure_production_webhook_secret_key_456';
  const MOCK_GAS_URL = 'https://script.google.com/macros/s/AKfycbStage7LiveDeployment/exec';
  const MOCK_M2M_SECRET = 'test_m2m_shared_secret_stage_7';

  const productionEnv = {
    GITHUB_WEBHOOK_SECRET: TEST_SECRET,
    GAS_WEBAPP_URL: MOCK_GAS_URL,
    APPS_SCRIPT_SECRET: MOCK_M2M_SECRET,
    ENVIRONMENT: 'production', // Live production mode (NOT test mock mode)
  };

  const sampleProject: Project = {
    id: 'mobile-kasir',
    slug: 'mobile-kasir',
    name: 'Mobile Kasir',
    category: 'APPLICATION',
    status: 'CLOSED_TESTING',
    shortDescription: 'Aplikasi kasir Android offline-first.',
    fullDescription: 'Aplikasi kasir lengkap untuk UMKM.',
    icon: '/assets/projects/mobile-kasir/icon.png',
    screenshots: [],
    version: '1.0.0-beta',
    lastUpdated: '2026-11-10',
    playStoreUrl: '',
    testingUrl: '',
    registrationOpen: true,
    testerRequirementDays: 14,
    featured: true,
    tags: ['Aplikasi', 'Closed Testing'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    globalDeliveryTracker.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalDeliveryTracker.clear();
  });

  describe('1. Cloudflare Pages Headers & Cache Verification', () => {
    it('verifies that public/_headers exists and configures strict security headers', () => {
      const headersPath = path.resolve(process.cwd(), 'public/_headers');
      expect(fs.existsSync(headersPath)).toBe(true);

      const content = fs.readFileSync(headersPath, 'utf-8');
      expect(content).toContain('X-Content-Type-Options: nosniff');
      expect(content).toContain('X-Frame-Options: DENY');
      expect(content).toContain('Referrer-Policy: strict-origin-when-cross-origin');
      expect(content).toContain('Permissions-Policy:');
    });

    it('verifies caching policy: 1-year immutable for /assets/* and revalidate for /*', () => {
      const headersPath = path.resolve(process.cwd(), 'public/_headers');
      const content = fs.readFileSync(headersPath, 'utf-8');

      expect(content).toContain('/assets/*');
      expect(content).toContain('max-age=31536000, immutable');
      expect(content).toContain('max-age=0, must-revalidate');
    });

    it('verifies that public/_redirects maintains SPA routing fallback', () => {
      const redirectsPath = path.resolve(process.cwd(), 'public/_redirects');
      expect(fs.existsSync(redirectsPath)).toBe(true);

      const content = fs.readFileSync(redirectsPath, 'utf-8');
      expect(content).toContain('/* /index.html 200');
    });
  });

  describe('2. Live Production GitHub Webhook Readiness for DompetNalar (FinSmart)', () => {
    it('verifies that dompetnalar is flagged readyForProductionWebhook: true in Stage 7', () => {
      const dompetConfig = STAGE3_REPOSITORY_MAP['dompetnalar'];
      expect(dompetConfig).toBeDefined();
      expect(dompetConfig.readyForProductionWebhook).toBe(true);
      expect(dompetConfig.expectedOwner).toBe('lunachroc07-dot');
      expect(dompetConfig.expectedRepo).toBe('finsmart');
    });

    it('resolves repository mapping successfully in strict PRODUCTION mode (allowUnverifiedPrerequisitesForTesting: false)', () => {
      const mapping = resolveRepositoryMapping('lunachroc07-dot/finsmart', {
        allowUnverifiedPrerequisitesForTesting: false,
      });

      expect(mapping.approved).toBe(true);
      expect(mapping.error).toBeUndefined();
      expect(mapping.info?.slug).toBe('dompetnalar');
    });

    it('processes live production webhook push event and dispatches M2M sync to Google Apps Script', async () => {
      const pushPayload = {
        ref: 'refs/heads/main',
        repository: {
          name: 'finsmart',
          full_name: 'lunachroc07-dot/finsmart',
          owner: {
            login: 'lunachroc07-dot',
          },
        },
        head_commit: {
          id: 'commit_sha_stage7_production_test_987654321',
          message: 'feat(core): Implement secure local export database',
          timestamp: '2026-11-10T00:30:00Z',
          author: {
            name: 'SleepyKoala Lead Dev',
            email: 'dev@sleepykoala.com',
          },
        },
        commits: [
          {
            id: 'commit_sha_stage7_production_test_987654321',
            message: 'feat(core): Implement secure local export database',
            timestamp: '2026-11-10T00:30:00Z',
          },
        ],
      };

      const rawBody = JSON.stringify(pushPayload);
      const signatureHex = await computeHmacSha256Hex(rawBody, TEST_SECRET);

      // Mock GAS upstream response
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            status: 'UPDATED',
            projectSlug: 'dompetnalar',
            action: 'SYNC_PROGRESS_METADATA',
            timestamp: '2026-11-10T00:30:05Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
      vi.stubGlobal('fetch', mockFetch);

      const request = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-uuid-stage7-live-001',
          'X-Hub-Signature-256': `sha256=${signatureHex}`,
        },
        body: rawBody,
      });

      const response = await onRequestPost({
        request,
        env: productionEnv,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toBe('PROCESSED');
      expect(data.projectSlug).toBe('dompetnalar');

      // Verify GAS was called with SYNC_PROGRESS_METADATA
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, fetchOpts] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe(MOCK_GAS_URL);
      const gasPayload = JSON.parse(fetchOpts.body);
      expect(gasPayload.action).toBe('SYNC_PROGRESS_METADATA');
      expect(gasPayload.projectSlug).toBe('dompetnalar');
      expect(gasPayload.event.publicationStatus).toBe('draft'); // Invariant: always draft
    });
  });

  describe('3. Strict Isolation of Frozen Repository (The Broken Origin)', () => {
    it('strictly rejects any webhook targeting the-broken-origin with HTTP 403 REPOSITORY_FROZEN', async () => {
      const tboPayload = {
        ref: 'refs/heads/main',
        repository: {
          name: 'tbo-roblox',
          full_name: 'zweifeel/tbo-roblox',
          owner: { login: 'zweifeel' },
        },
        head_commit: {
          id: 'unauthorized_tbo_commit_123',
          message: 'fix: unauthorized update',
        },
      };

      const rawBody = JSON.stringify(tboPayload);
      const signatureHex = await computeHmacSha256Hex(rawBody, TEST_SECRET);

      const request = new Request('https://sleepykoala.pages.dev/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'push',
          'X-GitHub-Delivery': 'delivery-uuid-stage7-tbo-freeze',
          'X-Hub-Signature-256': `sha256=${signatureHex}`,
        },
        body: rawBody,
      });

      const response = await onRequestPost({
        request,
        env: productionEnv,
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('REPOSITORY_FROZEN');
    });
  });

  describe('4. Unlimited Closed Testing Registration Presentation', () => {
    it('renders the unlimited quota reassurance badge in RegistrationModal', () => {
      render(
        <RegistrationModal
          isOpen={true}
          onClose={vi.fn()}
          project={sampleProject}
        />
      );

      expect(
        screen.getByText('Pendaftaran Terbuka Tanpa Batas Kuota')
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Seluruh pendaftar dengan akun Google Play yang valid akan diikutsertakan/i)
      ).toBeInTheDocument();
    });
  });
});
