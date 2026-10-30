import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { RegistrationModal } from '../components/RegistrationModal';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { getProjectBySlug } from '../services/projectService';

describe('UI Component Unit Tests with Official Projects', () => {
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
    expect(screen.getByText(/Proyek masih dalam tahap pengembangan aktif/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /daftar jadi penguji/i })).not.toBeInTheDocument();
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
});
