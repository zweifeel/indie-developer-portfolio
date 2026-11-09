import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '../types/settings';
import {
  generateDefaultPrivacyPolicy,
  generateDefaultDeleteAccount,
} from '../types/compliance';
import {
  fetchPublicSiteSettings,
  saveAdminSiteSettings,
} from '../services/cmsSettingsService';
import {
  fetchPublicCompliance,
  saveAdminCompliance,
} from '../services/cmsComplianceService';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { DeleteAccountPage } from '../pages/DeleteAccountPage';
import { AdminPage } from '../pages/AdminPage';

describe('Milestone 6.6 — Website Content & Play Console Compliance Manager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Website Content & Branding Models & Defaults', () => {
    it('provides a complete DEFAULT_SITE_SETTINGS fallback structure', () => {
      expect(DEFAULT_SITE_SETTINGS).toBeDefined();
      expect(DEFAULT_SITE_SETTINGS.id).toBe('current');
      expect(DEFAULT_SITE_SETTINGS.status).toBe('published');
      expect(DEFAULT_SITE_SETTINGS.branding.studioName).toBe('SleepyKoala Studio');
      expect(DEFAULT_SITE_SETTINGS.branding.supportEmail).toBe('contact@sleepykoalastudio.com');
      expect(DEFAULT_SITE_SETTINGS.homepage.headline).toBe('Crafting Digital Experiences That Delight');
      expect(DEFAULT_SITE_SETTINGS.about.developerName).toBe('SleepyKoala');
      expect(Array.isArray(DEFAULT_SITE_SETTINGS.navigation)).toBe(true);
      expect(DEFAULT_SITE_SETTINGS.navigation.length).toBeGreaterThan(0);
      expect(DEFAULT_SITE_SETTINGS.footer.copyrightText).toContain('SleepyKoala Studio');
      expect(DEFAULT_SITE_SETTINGS.seo.metaTitle).toContain('SleepyKoala Studio');
    });

    it('falls back safely to DEFAULT_SITE_SETTINGS when network fails or returns 500', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const settings = await fetchPublicSiteSettings();
      expect(settings).toEqual(DEFAULT_SITE_SETTINGS);
    });

    it('falls back safely when response is not ok (e.g. 404/503)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);
      const settings = await fetchPublicSiteSettings();
      expect(settings).toEqual(DEFAULT_SITE_SETTINGS);
    });

    it('loads custom published settings when API succeeds', async () => {
      const customSettings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        version: 2,
        branding: {
          ...DEFAULT_SITE_SETTINGS.branding,
          studioName: 'SleepyKoala Ultimate',
        },
        status: 'published',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, settings: customSettings }),
      } as any);

      const settings = await fetchPublicSiteSettings();
      expect(settings.branding.studioName).toBe('SleepyKoala Ultimate');
      expect(settings.version).toBe(2);
    });

    it('sends CSRF header X-SleepyKoala-Admin: 1 on admin settings save', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          settings: { ...DEFAULT_SITE_SETTINGS, version: 2, status: 'published' },
        }),
      } as any);

      const res = await saveAdminSiteSettings(DEFAULT_SITE_SETTINGS, true);
      expect(res.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/settings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-SleepyKoala-Admin': '1',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('2. Google Play Console Compliance Generators & Rules', () => {
    it('generates standard Play Console Privacy Policy with fail-closed draft status', () => {
      const policy = generateDefaultPrivacyPolicy('DompetNalar', 'dompetnalar');
      expect(policy.status).toBe('draft');
      expect(policy.version).toBe(1);
      expect(policy.contactEmail).toBe('privacy@sleepykoalastudio.com');
      expect(policy.summary).toContain('DompetNalar');
      expect(policy.content).toContain('Kebijakan Privasi untuk DompetNalar');
      expect(policy.dataCollected.length).toBeGreaterThan(0);
      expect(policy.thirdPartyServices).toContain('Google Play Services (layanan autentikasi, leaderboard & pencapaian opsional)');
    });

    it('generates standard Play Console Delete Account guide with dual options and clear turnaround', () => {
      const deleteAcc = generateDefaultDeleteAccount('DompetNalar', 'dompetnalar');
      expect(deleteAcc.status).toBe('draft');
      expect(deleteAcc.version).toBe(1);
      expect(deleteAcc.requestEmail).toBe('support@sleepykoalastudio.com');
      expect(deleteAcc.turnaroundTime).toBe('3-7 hari kerja');
      expect(deleteAcc.deletionMethods.length).toBe(2);
      expect(deleteAcc.content).toContain('Permintaan Penghapusan Akun & Data — DompetNalar');
      expect(deleteAcc.content).toContain('Opsi 1: Penghapusan Mandiri Melalui Aplikasi');
      expect(deleteAcc.content).toContain('Opsi 2: Permintaan Melalui Email');
      expect(deleteAcc.dataDeletedList.length).toBeGreaterThan(0);
    });

    it('enforces fail-closed public compliance lookup (returns NOT_FOUND when status is draft or 404)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      const res = await fetchPublicCompliance('idle-master');
      expect(res.success).toBe(false);
      expect(res.error).toBe('NOT_FOUND');
    });

    it('fetches published compliance data successfully for public viewing', async () => {
      const mockCompliance = {
        success: true,
        project: { id: 'dompetnalar', slug: 'dompetnalar', name: 'DompetNalar' },
        privacyPolicy: generateDefaultPrivacyPolicy('DompetNalar', 'dompetnalar'),
        deleteAccount: generateDefaultDeleteAccount('DompetNalar', 'dompetnalar'),
      };
      mockCompliance.privacyPolicy.status = 'published';
      mockCompliance.deleteAccount.status = 'published';

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompliance,
      } as any);

      const res = await fetchPublicCompliance('dompetnalar');
      expect(res.success).toBe(true);
      expect(res.project?.name).toBe('DompetNalar');
      expect(res.privacyPolicy?.status).toBe('published');
    });

    it('sends CSRF header X-SleepyKoala-Admin: 1 on admin compliance update', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          compliance: {
            projectId: 'dompetnalar',
            projectSlug: 'dompetnalar',
            projectName: 'DompetNalar',
            privacyPolicy: generateDefaultPrivacyPolicy('DompetNalar', 'dompetnalar'),
            deleteAccount: generateDefaultDeleteAccount('DompetNalar', 'dompetnalar'),
            updatedAt: '2026-11-02T00:00:00.000Z',
          },
        }),
      } as any);

      const res = await saveAdminCompliance(
        {
          projectId: 'dompetnalar',
          projectSlug: 'dompetnalar',
          projectName: 'DompetNalar',
        },
        'publish_privacy'
      );

      expect(res.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/admin/compliance',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-SleepyKoala-Admin': '1',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('3. Public Compliance Page Components Rendering', () => {
    it('renders PrivacyPolicyPage successfully when policy is published', async () => {
      const publishedPolicy = generateDefaultPrivacyPolicy('DompetNalar', 'dompetnalar');
      publishedPolicy.status = 'published';

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          project: { id: 'dompetnalar', slug: 'dompetnalar', name: 'DompetNalar' },
          privacyPolicy: publishedPolicy,
        }),
      } as any);

      render(
        <MemoryRouter initialEntries={['/projects/dompetnalar/privacy']}>
          <Routes>
            <Route path="/projects/:slug/privacy" element={<PrivacyPolicyPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Kebijakan Privasi')).toBeInTheDocument();
      });

      expect(screen.getByText(/Google Play Compliance/i)).toBeInTheDocument();
      expect(screen.getByText(/Ringkasan Utama/i)).toBeInTheDocument();
      expect(screen.getByText(/Terverifikasi & Aktif/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Halaman Hapus Akun/i })).toBeInTheDocument();
    });

    it('renders fail-closed error state in PrivacyPolicyPage when unconfigured or draft', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      render(
        <MemoryRouter initialEntries={['/projects/unconfigured-app/privacy']}>
          <Routes>
            <Route path="/projects/:slug/privacy" element={<PrivacyPolicyPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Kebijakan Privasi Belum Tersedia')).toBeInTheDocument();
      });

      expect(screen.getByText(/Kembali ke Detail Proyek/i)).toBeInTheDocument();
    });

    it('renders DeleteAccountPage with official guidance, turnaround time, and mailto link', async () => {
      const publishedDelete = generateDefaultDeleteAccount('DompetNalar', 'dompetnalar');
      publishedDelete.status = 'published';

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          project: { id: 'dompetnalar', slug: 'dompetnalar', name: 'DompetNalar' },
          deleteAccount: publishedDelete,
        }),
      } as any);

      render(
        <MemoryRouter initialEntries={['/projects/dompetnalar/delete-account']}>
          <Routes>
            <Route path="/projects/:slug/delete-account" element={<DeleteAccountPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Hapus Akun & Data Pengguna')).toBeInTheDocument();
      });

      expect(screen.getByText(/Tindakan ini bersifat permanen!/i)).toBeInTheDocument();
      expect(screen.getByText(/Estimasi Proses: 3-7 hari kerja/i)).toBeInTheDocument();
      expect(screen.getByText(/Data yang Dihapus Permanen/i)).toBeInTheDocument();
      expect(screen.getByText(/Buka Email Permintaan/i)).toBeInTheDocument();
    });

    it('renders fail-closed error state in DeleteAccountPage when unconfigured or draft', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      render(
        <MemoryRouter initialEntries={['/projects/unconfigured-app/delete-account']}>
          <Routes>
            <Route path="/projects/:slug/delete-account" element={<DeleteAccountPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Halaman Belum Tersedia')).toBeInTheDocument();
      });

      expect(screen.getByText(/Kembali ke Detail Proyek/i)).toBeInTheDocument();
    });
  });

  describe('4. Web Admin 5-Tab Navigation & Module Integration (Milestone 6.6.1)', () => {
    const setupAdminMocks = () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
        const url = String(input);
        if (url.includes('/api/admin/auth/session')) {
          return new Response(
            JSON.stringify({
              success: true,
              authenticated: true,
              email: 'zweifeel@gmail.com',
              environment: 'production',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (url.includes('/api/admin/projects')) {
          return new Response(
            JSON.stringify({
              success: true,
              projects: [
                {
                  id: 'dompetnalar',
                  slug: 'dompetnalar',
                  name: 'DompetNalar',
                  category: 'APPLICATION',
                  status: 'READY_FOR_RELEASE',
                  publishState: 'PUBLISHED',
                  screenshots: [],
                },
                {
                  id: 'idle-master',
                  slug: 'idle-master',
                  name: 'IDLE MASTER',
                  category: 'GAME',
                  status: 'WORK_IN_PROGRESS',
                  publishState: 'PUBLISHED',
                  screenshots: [],
                },
                {
                  id: 'mobile-kasir',
                  slug: 'mobile-kasir',
                  name: 'Mobile Kasir',
                  category: 'APPLICATION',
                  status: 'CLOSED_TESTING',
                  publishState: 'PUBLISHED',
                  screenshots: [],
                },
                {
                  id: 'idle-mining',
                  slug: 'idle-mining',
                  name: 'Idle Mining',
                  category: 'GAME',
                  status: 'WORK_IN_PROGRESS',
                  publishState: 'PUBLISHED',
                  screenshots: [],
                },
                {
                  id: 'the-broken-origin',
                  slug: 'the-broken-origin',
                  name: 'The Broken Origin',
                  category: 'GAME',
                  status: 'WORK_IN_PROGRESS',
                  publishState: 'PUBLISHED',
                  screenshots: [],
                },
                {
                  id: 'worklume',
                  slug: 'worklume',
                  name: 'Worklume',
                  category: 'APPLICATION',
                  status: 'WORK_IN_PROGRESS',
                  publishState: 'PUBLISHED',
                  screenshots: [],
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (url.includes('/api/admin/media')) {
          return new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/api/admin/audit-logs')) {
          return new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/api/admin/settings')) {
          return new Response(JSON.stringify({ success: true, settings: DEFAULT_SITE_SETTINGS }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/api/admin/compliance')) {
          return new Response(
            JSON.stringify({
              success: true,
              complianceRecords: [
                {
                  projectId: 'dompetnalar',
                  projectSlug: 'dompetnalar',
                  projectName: 'DompetNalar',
                  privacyPolicy: generateDefaultPrivacyPolicy('DompetNalar', 'dompetnalar'),
                  deleteAccount: generateDefaultDeleteAccount('DompetNalar', 'dompetnalar'),
                  updatedAt: '2026-11-02T00:00:00.000Z',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(JSON.stringify({ success: false, error: 'NOT_FOUND' }), { status: 404 });
      });
    };

    it('displays all 5 required navigation tabs on the Web Admin dashboard', async () => {
      setupAdminMocks();

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminPage />
        </MemoryRouter>
      );

      // Verify header and all 5 tabs appear
      await waitFor(() => {
        expect(screen.getByText(/Katalog Proyek/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Pustaka Media/i)).toBeInTheDocument();
      expect(screen.getByText(/Audit Log Aktivitas/i)).toBeInTheDocument();
      expect(screen.getByText(/Pengaturan Website/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy Policy & Delete Account/i)).toBeInTheDocument();
    });

    it('opens Pengaturan Website module and allows switching between content sub-tabs', async () => {
      setupAdminMocks();

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pengaturan Website/i)).toBeInTheDocument();
      });

      // Click Pengaturan Website tab
      fireEvent.click(screen.getByText(/Pengaturan Website/i));

      await waitFor(() => {
        expect(screen.getByText('Branding & Kontak')).toBeInTheDocument();
      });

      expect(screen.getByText('Beranda / Hero')).toBeInTheDocument();
      expect(screen.getByText('Tentang Developer')).toBeInTheDocument();
      expect(screen.getByText('Menu Navigasi')).toBeInTheDocument();
      expect(screen.getByText('Footer & Disclaimer')).toBeInTheDocument();
      expect(screen.getByText('SEO & Metadata')).toBeInTheDocument();

      // Check actions: Simpan Draft and Publikasikan
      expect(screen.getByText('Simpan Draft')).toBeInTheDocument();
      expect(screen.getByText('Publikasikan ke Website')).toBeInTheDocument();
    });

    it('opens Privacy Policy & Delete Account module and opens per-project editor modal', async () => {
      setupAdminMocks();

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Privacy Policy & Delete Account/i)).toBeInTheDocument();
      });

      // Click Compliance tab
      fireEvent.click(screen.getByText(/Privacy Policy & Delete Account/i));

      await waitFor(() => {
        expect(screen.getByText('Privacy Policy & Delete Account (Google Play Compliance)')).toBeInTheDocument();
      });

      // Verify project row
      expect(screen.getByText('DompetNalar')).toBeInTheDocument();

      // Click Kelola Dokumen
      const manageButtons = screen.getAllByText('Kelola Dokumen');
      expect(manageButtons.length).toBeGreaterThan(0);
      fireEvent.click(manageButtons[0]);

      // Verify modal opened
      await waitFor(() => {
        expect(screen.getByText(/Kepatuhan Play Console: DompetNalar/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Kebijakan Privasi (Privacy Policy)')).toBeInTheDocument();
      expect(screen.getByText('Panduan Hapus Akun (Delete Account)')).toBeInTheDocument();
      expect(screen.getByText('Muat Template Standar Google Play')).toBeInTheDocument();
    });

    it('switches between tabs cleanly without corrupting state', async () => {
      setupAdminMocks();

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Katalog Proyek/i)).toBeInTheDocument();
      });

      // Switch to Media
      fireEvent.click(screen.getByText(/Pustaka Media/i));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Unggah Media Baru/i })).toBeInTheDocument();
      });

      // Switch to Audit Logs
      fireEvent.click(screen.getByText(/Audit Log Aktivitas/i));
      await waitFor(() => {
        expect(screen.getByText(/Jejak Aktivitas Terakhir/i)).toBeInTheDocument();
      });

      // Switch to Website Settings
      fireEvent.click(screen.getByText(/Pengaturan Website/i));
      await waitFor(() => {
        expect(screen.getByText('Branding & Kontak')).toBeInTheDocument();
      });

      // Switch back to Projects
      fireEvent.click(screen.getByText(/Katalog Proyek/i));
      await waitFor(() => {
        expect(screen.getByText('DompetNalar')).toBeInTheDocument();
      });
    });
  });
});
