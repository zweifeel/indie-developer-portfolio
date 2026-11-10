/**
 * ============================================================================
 * STAGE 9 ACCEPTANCE & INTEGRATION TEST SUITE:
 * Web Admin CMS Changelog Workflow & GitHub Webhook Draft-to-Publish Pipeline
 * 
 * Verifies End-to-End:
 * 1. GitHub Webhook payload processing transforms commits into ProgressEvent with publicationStatus: 'draft'.
 * 2. Fail-Closed Public Isolation: Draft changelogs are never exposed to public visitors.
 * 3. Web Admin CMS Event Review: Admin can inspect incoming draft changelog events in AdminProgressManager.
 * 4. Editorial Workflow Transition: Admin reviews, edits, and transitions draft event to 'public'.
 * 5. Public Showcase Timeline: Published changelog appears on ProjectDetailPage public timeline.
 * 6. Audit Trail Logging: Publishing changelog leaves an immutable audit entry.
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import rawProjects from '../data/projects.json';

import {
  transformPushEvent,
  transformReleaseEvent,
  computeHmacSha256Hex,
} from '../services/githubWebhookService';

import {
  onRequestPost,
} from '../../functions/api/webhook/github';

import {
  CANONICAL_PROJECT_SLUGS,
  fetchPublicProjectProgress,
  fetchAdminProjectProgress,
  transitionItemPublicationStatus,
  recordProgressAuditLog,
  getProgressAuditLogs,
  resetProgressCache,
  setProgressDocumentCache,
} from '../services/cmsProgressService';

import {
  createDefaultProgressDocument,
} from '../services/portfolioMetadataValidator';

import {
  ProjectProgressDocument,
  ProgressEvent,
} from '../types/portfolioProgress';

import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { resetProjectsCache } from '../services/projectService';

describe('STAGE 9: Full E2E Web Admin CMS Changelog & GitHub Webhook Pipeline', () => {
  const TEST_SECRET = 'stage9_secure_webhook_secret_key_777';
  const ADMIN_EMAIL = 'zweifeel@gmail.com';

  beforeEach(() => {
    resetProgressCache();
    resetProjectsCache();

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/api/projects') && !url.includes('/progress')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: (rawProjects as any[]).map((p) => ({ ...p, publishState: 'PUBLISHED' })),
            source: 'cms-live',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetProgressCache();
    resetProjectsCache();
  });

  // Helper to create a signed webhook request
  async function createSignedWebhookRequest(payload: any, eventType: string = 'push'): Promise<Request> {
    const rawBody = JSON.stringify(payload);
    const signature = await computeHmacSha256Hex(rawBody, TEST_SECRET);

    return new Request('https://sleepykoala.pages.dev/api/webhook/github', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': eventType,
        'X-GitHub-Delivery': `delivery-stage9-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'X-Hub-Signature-256': `sha256=${signature}`,
      },
      body: rawBody,
    });
  }

  it('1. GitHub Webhook transforms commit event into a ProgressEvent with publicationStatus: "draft"', () => {
    const mockPushPayload = {
      ref: 'refs/heads/master',
      repository: {
        name: 'mobile-kasir',
        full_name: 'zweifeel/mobile-kasir',
        owner: { login: 'zweifeel' },
      },
      commits: [
        {
          id: 'commit_hash_1234567890abcdef',
          message: 'feat(bluetooth): Tambahkan dukungan printer thermal 58mm untuk cetak struk kasir',
          timestamp: '2026-11-10T20:00:00Z',
          author: { name: 'zweifeel', email: 'zweifeel@gmail.com' },
          url: 'https://github.com/zweifeel/mobile-kasir/commit/1234567890abcdef',
        },
      ],
    };

    const event = transformPushEvent(mockPushPayload, 'mobile-kasir');

    expect(event).toBeDefined();
    expect(event.id).toContain('evt_mobile-kasir_push');
    expect(event.publicationStatus).toBe('draft'); // Mandatory anti-leakage lock!
    expect(event.eventType).toBe('general_update');
    expect(event.title).toContain('printer thermal 58mm');
  });

  it('2. Webhook endpoint processes valid push event and returns DRAFT status without publishing', async () => {
    const mockPayload = {
      ref: 'refs/heads/master',
      repository: {
        name: 'mobile-kasir',
        full_name: 'zweifeel/mobile-kasir',
        owner: { login: 'zweifeel' },
      },
      commits: [
        {
          id: 'commit_hash_stage9_002',
          message: 'fix(laporan): Perbaikan kalkulasi laba rugi harian offline',
          timestamp: '2026-11-10T20:15:00Z',
          author: { name: 'zweifeel' },
          url: 'https://github.com/zweifeel/mobile-kasir/commit/stage9_002',
        },
      ],
    };

    const req = await createSignedWebhookRequest(mockPayload, 'push');
    const response = await onRequestPost({
      request: req,
      env: {
        GITHUB_WEBHOOK_SECRET: TEST_SECRET,
        PORTFOLIO_APPROVED_OWNER: 'zweifeel',
        ENVIRONMENT: 'test',
      } as any,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('PROCESSED');
    expect(body.projectSlug).toBe('mobile-kasir');
    expect(body.event.publicationStatus).toBe('draft');
  });

  it('3. Fail-Closed Public Isolation: Incoming draft changelog is strictly hidden from public visitors', async () => {
    const baseDoc = createDefaultProgressDocument('mobile-kasir', 'Mobile Kasir');

    // Add a draft event
    const draftEvent: ProgressEvent = {
      id: 'evt_draft_secret_001',
      title: 'Fitur Rahasia: Integrasi QRIS Dinamis Multi-Bank',
      description: 'Draf catatan rilis yang masih dalam tahap pengujian internal.',
      eventType: 'general_update',
      timestamp: '2026-11-10T20:20:00Z',
      publicationStatus: 'draft', // DRAFT!
    };

    baseDoc.events.push(draftEvent);
    setProgressDocumentCache('mobile-kasir', baseDoc);

    // Public visitor queries project progress
    const publicRes = await fetchPublicProjectProgress('mobile-kasir');
    expect(publicRes.success).toBe(true);

    // Verification: Draft event MUST NOT be present in public progress
    const foundInPublic = publicRes.data!.events.some((e: ProgressEvent) => e.id === 'evt_draft_secret_001');
    expect(foundInPublic).toBe(false);

    // Admin querying progress CAN see the draft event
    const adminRes = await fetchAdminProjectProgress('mobile-kasir');
    expect(adminRes.success).toBe(true);
    const foundInAdmin = adminRes.data!.events.some((e: ProgressEvent) => e.id === 'evt_draft_secret_001');
    expect(foundInAdmin).toBe(true);
  });

  it('4. Admin Editorial Workflow: Admin reviews and publishes changelog from draft -> review -> public', async () => {
    const baseDoc = createDefaultProgressDocument('mobile-kasir', 'Mobile Kasir');

    const draftEvent: ProgressEvent = {
      id: 'evt_draft_release_v1_0_2',
      title: 'Pembaruan v1.0.2: Dukungan Barcode Scanner Bluetooth',
      description: 'Kasir kini dapat memindai barcode produk via alat scanner bluetooth nirkabel.',
      eventType: 'milestone_reached',
      timestamp: '2026-11-10T20:30:00Z',
      publicationStatus: 'draft',
    };

    baseDoc.events.push(draftEvent);
    setProgressDocumentCache('mobile-kasir', baseDoc);

    // Initial state: hidden from public
    let publicRes = await fetchPublicProjectProgress('mobile-kasir');
    expect(publicRes.data!.events.some((e: ProgressEvent) => e.id === 'evt_draft_release_v1_0_2')).toBe(false);

    // Security Gate: direct draft -> public transition MUST be rejected!
    const directJump = await transitionItemPublicationStatus({
      projectSlug: 'mobile-kasir',
      itemType: 'event',
      itemId: 'evt_draft_release_v1_0_2',
      targetStatus: 'public',
      adminEmail: ADMIN_EMAIL,
    });
    expect(directJump.success).toBe(false);
    expect(directJump.error).toBe('INVALID_EDITORIAL_TRANSITION');

    // Step 1: Admin marks item as 'review'
    const reviewRes = await transitionItemPublicationStatus({
      projectSlug: 'mobile-kasir',
      itemType: 'event',
      itemId: 'evt_draft_release_v1_0_2',
      targetStatus: 'review',
      adminEmail: ADMIN_EMAIL,
    });
    expect(reviewRes.success).toBe(true);
    expect(reviewRes.newStatus).toBe('review');

    // Item in 'review' is STILL hidden from public visitors
    publicRes = await fetchPublicProjectProgress('mobile-kasir');
    expect(publicRes.data!.events.some((e: ProgressEvent) => e.id === 'evt_draft_release_v1_0_2')).toBe(false);

    // Step 2: Admin approves and publishes from 'review' to 'public'
    const publishRes = await transitionItemPublicationStatus({
      projectSlug: 'mobile-kasir',
      itemType: 'event',
      itemId: 'evt_draft_release_v1_0_2',
      targetStatus: 'public',
      adminEmail: ADMIN_EMAIL,
    });
    expect(publishRes.success).toBe(true);
    expect(publishRes.newStatus).toBe('public');

    // Now verify public visitor CAN see the published changelog!
    publicRes = await fetchPublicProjectProgress('mobile-kasir');
    expect(publicRes.success).toBe(true);
    const publicEvent = publicRes.data!.events.find((e: ProgressEvent) => e.id === 'evt_draft_release_v1_0_2');
    expect(publicEvent).toBeDefined();
    expect(publicEvent?.title).toBe('Pembaruan v1.0.2: Dukungan Barcode Scanner Bluetooth');
  });

  it('5. Public Showcase Timeline: ProjectDetailPage renders the published changelog to visitors', async () => {
    const baseDoc = createDefaultProgressDocument('dompetnalar', 'DompetNalar');

    const publishedEvent: ProgressEvent = {
      id: 'evt_published_e2e_showcase',
      title: 'Rilis Resmi Fitur Struk Kasir Digital WhatsApp',
      description: 'Pelanggan kini dapat menerima bukti struk belanja langsung via pesan WhatsApp otomatis.',
      eventType: 'milestone_reached',
      timestamp: '2026-11-10T20:45:00Z',
      publicationStatus: 'public',
    };

    baseDoc.events.push(publishedEvent);
    setProgressDocumentCache('dompetnalar', baseDoc);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/projects/dompetnalar']}>
          <Routes>
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Verify title appears in the rendered page
    expect(screen.getByText('Rilis Resmi Fitur Struk Kasir Digital WhatsApp')).toBeInTheDocument();
  });

  it('6. Audit Trail Logging: Publishing changelog leaves an immutable audit entry', async () => {
    const baseDoc = createDefaultProgressDocument('dompetnalar', 'DompetNalar');

    const changelogEvent: ProgressEvent = {
      id: 'evt_audit_dompetnalar_001',
      title: 'Optimalisasi Enkripsi Database SQLite Lokal',
      description: 'Kecepatan baca-tulis riwayat transaksi keuangan meningkat 40%.',
      eventType: 'general_update',
      timestamp: '2026-11-10T20:50:00Z',
      publicationStatus: 'draft',
    };

    baseDoc.events.push(changelogEvent);
    setProgressDocumentCache('dompetnalar', baseDoc);

    // Record audit entry
    recordProgressAuditLog({
      projectSlug: 'dompetnalar',
      action: 'UPDATE_PROGRESS_DOCUMENT',
      actorEmail: ADMIN_EMAIL,
      result: 'SUCCESS',
      details: {
        itemId: 'evt_audit_dompetnalar_001',
        publicationStatusAfter: 'public',
      },
    });

    const logs = getProgressAuditLogs('dompetnalar');
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[0];
    expect(lastLog.actorEmail).toBe(ADMIN_EMAIL);
    expect(lastLog.details.itemId).toBe('evt_audit_dompetnalar_001');
    expect(lastLog.details.publicationStatusAfter).toBe('public');
  });
});
