import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { RegistrationModal } from '../components/RegistrationModal';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { getProjectBySlug, resetProjectsCache } from '../services/projectService';
import rawProjects from '../data/projects.json';

describe('UI Component Unit Tests with Official Projects', () => {
  beforeEach(() => {
    resetProjectsCache();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/api/projects')) {
        return new Response(JSON.stringify({
          success: true,
          data: (rawProjects as any[]).map((p) => ({ ...p, publishState: 'PUBLISHED' })),
          source: 'cms-live',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not Found', { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetProjectsCache();
  });
  it('renders StatusBadge with Indonesian label for READY_FOR_RELEASE', () => {
    render(<StatusBadge status="READY_FOR_RELEASE" />);
    expect(screen.getByText('Siap Rilis')).toBeInTheDocument();
  });

  it('renders StatusBadge with Indonesian label for WORK_IN_PROGRESS', () => {
    render(<StatusBadge status="WORK_IN_PROGRESS" />);
    expect(screen.getByText('Dalam Pengembangan')).toBeInTheDocument();
  });

  it('renders StatusBadge with Indonesian label for CLOSED_TESTING', () => {
    render(<StatusBadge status="CLOSED_TESTING" />);
    expect(screen.getByText('Closed Testing')).toBeInTheDocument();
  });

  it('validates required fields in RegistrationModal', async () => {
    const mobileKasir = getProjectBySlug('mobile-kasir')!;
    render(
      <RegistrationModal
        isOpen={true}
        onClose={() => {}}
        project={mobileKasir}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /kirim pendaftaran/i });
    fireEvent.click(submitBtn);

    expect(screen.getAllByText('Kolom ini wajib diisi').length).toBeGreaterThan(0);
  });

  it('validates email format in RegistrationModal', async () => {
    const mobileKasir = getProjectBySlug('mobile-kasir')!;
    render(
      <RegistrationModal
        isOpen={true}
        onClose={() => {}}
        project={mobileKasir}
      />
    );

    const nameInput = screen.getByLabelText(/nama lengkap/i);
    const emailInput = screen.getByLabelText(/email aktif/i);
    const submitBtn = screen.getByRole('button', { name: /kirim pendaftaran/i });

    fireEvent.change(nameInput, { target: { value: 'Budi Tester' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Format alamat email tidak valid')).toBeInTheDocument();
  });

  it('renders DompetNalar detail without Play Store button and with Siap Rilis badge', () => {
    render(
      <MemoryRouter initialEntries={['/projects/dompetnalar']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /DompetNalar/i })).toBeInTheDocument();
    // Play Store download button must NOT be rendered because URL is empty
    expect(screen.queryByRole('link', { name: /unduh di google play/i })).not.toBeInTheDocument();
    // Must display Siap Rilis
    expect(screen.getAllByText(/Siap Rilis/i).length).toBeGreaterThan(0);
  });

  it('renders Mobile Kasir detail with Closed Testing registration button', () => {
    render(
      <MemoryRouter initialEntries={['/projects/mobile-kasir']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Mobile Kasir/i })).toBeInTheDocument();
    const joinButtons = screen.getAllByRole('button', { name: /daftar jadi penguji/i });
    expect(joinButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Ketentuan & Syarat Penguji Tertutup/i)).toBeInTheDocument();
  });

  it('renders IDLE MASTER detail with development status and no registration button', () => {
    render(
      <MemoryRouter initialEntries={['/projects/idle-master']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /IDLE MASTER/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Proyek masih dalam tahap pengembangan aktif/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('button', { name: /daftar jadi penguji/i })).not.toBeInTheDocument();
  });

  it('renders Worklume detail with tagline, capabilities grid, and vision section', () => {
    render(
      <MemoryRouter initialEntries={['/projects/worklume']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Worklume/i })).toBeInTheDocument();
    expect(screen.getByText('Work Smarter. Stay Organized.')).toBeInTheDocument();
    expect(screen.getByText('Core Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Universal Reporting')).toBeInTheDocument();
    expect(screen.getByText('Organizational Workspaces')).toBeInTheDocument();
    expect(screen.getByText('Local-First Data Management')).toBeInTheDocument();
    expect(screen.getByText('Our Vision')).toBeInTheDocument();
  });

  it('renders ProjectsPage with all status filters including Siap Rilis', () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Siap Rilis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Closed Testing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dalam Pengembangan' })).toBeInTheDocument();
    expect(screen.getByText('DompetNalar')).toBeInTheDocument();
    expect(screen.getByText('Mobile Kasir')).toBeInTheDocument();
  });

  it('gracefully renders 404 for unknown project slug in ProjectDetailPage', () => {
    render(
      <MemoryRouter initialEntries={['/projects/non-existent-project']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Proyek tidak ditemukan')).toBeInTheDocument();
  });

  describe('AdMob app-ads.txt Static Asset Verification', () => {
    it('verifies public/app-ads.txt exists with exact Google AdMob snippet', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.resolve(process.cwd(), 'public', 'app-ads.txt');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8').trim();
      expect(content).toBe('google.com, pub-2539100802088383, DIRECT, f08c47fec0942fa0');
      expect(content).not.toContain('<html');
      expect(content).not.toContain('<!DOCTYPE');
    });

    it('verifies dist/app-ads.txt exists after build with identical content', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.resolve(process.cwd(), 'dist', 'app-ads.txt');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        expect(content).toBe('google.com, pub-2539100802088383, DIRECT, f08c47fec0942fa0');
        expect(content).not.toContain('<html');
      }
    });
  });
});
