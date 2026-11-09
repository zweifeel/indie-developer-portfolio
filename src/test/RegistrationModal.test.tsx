import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistrationModal } from '../components/RegistrationModal';
import { getProjectBySlug } from '../services/projectService';
import * as registrationService from '../services/registrationService';

describe('RegistrationModal Integration with Backend Service', () => {
  const project = getProjectBySlug('mobile-kasir')!;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal with project info when isOpen is true', () => {
    render(<RegistrationModal isOpen={true} onClose={() => {}} project={project} />);

    expect(screen.getByText('Mobile Kasir')).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email aktif/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kirim pendaftaran/i })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <RegistrationModal isOpen={false} onClose={() => {}} project={project} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('submits form successfully and displays success confirmation screen', async () => {
    const mockRegister = vi.spyOn(registrationService, 'registerTester').mockResolvedValue({
      success: true,
      message: 'Pendaftaran closed testing berhasil diterima!',
      isDuplicate: false,
      projectId: 'mobile-kasir',
      maskedEmail: 'bu***@gmail.com',
    });

    render(<RegistrationModal isOpen={true} onClose={() => {}} project={project} />);

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/email aktif/i), {
      target: { value: 'budi.santoso@gmail.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /kirim pendaftaran/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          testerName: 'Budi Santoso',
          testerEmail: 'budi.santoso@gmail.com',
          projectId: 'mobile-kasir',
          projectName: 'Mobile Kasir',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Pendaftaran Berhasil Diterima')).toBeInTheDocument();
      expect(screen.getByText(/langkah berikutnya setelah pendaftaran/i)).toBeInTheDocument();
    });
  });

  it('displays "Email Sudah Terdaftar" screen when backend returns isDuplicate: true', async () => {
    vi.spyOn(registrationService, 'registerTester').mockResolvedValue({
      success: true,
      isDuplicate: true,
      message: 'Email Anda sudah terdaftar dalam antrean closed testing Mobile Kasir.',
      projectId: 'mobile-kasir',
      maskedEmail: 'bu***@gmail.com',
    });

    render(<RegistrationModal isOpen={true} onClose={() => {}} project={project} />);

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/email aktif/i), {
      target: { value: 'budi.santoso@gmail.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /kirim pendaftaran/i }));

    await waitFor(() => {
      expect(screen.getByText('Email Sudah Terdaftar')).toBeInTheDocument();
      expect(screen.getByText(/sudah terdaftar dalam antrean/i)).toBeInTheDocument();
    });
  });

  it('displays error alert when registration request fails', async () => {
    vi.spyOn(registrationService, 'registerTester').mockResolvedValue({
      success: false,
      error: 'SERVER_BUSY',
      message: 'Server sedang sibuk. Silakan coba kembali.',
    });

    render(<RegistrationModal isOpen={true} onClose={() => {}} project={project} />);

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/email aktif/i), {
      target: { value: 'budi.santoso@gmail.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /kirim pendaftaran/i }));

    await waitFor(() => {
      expect(screen.getByText('Pemberitahuan Sistem')).toBeInTheDocument();
      expect(screen.getByText('Server sedang sibuk. Silakan coba kembali.')).toBeInTheDocument();
    });
  });
});
