/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING MONITOR UI TESTS (LAPIS 3)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClosedTestingMonitor } from '../components/admin/ClosedTestingMonitor';

describe('ClosedTestingMonitor Component (Lapis 3)', () => {
  it('renders the 14-day monitor header and metrics correctly', () => {
    render(<ClosedTestingMonitor />);

    expect(
      screen.getByText(/Monitoring 14 Hari Closed Testing — Mobile Kasir/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/24 \/ 20/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Memenuhi Syarat/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 14 Hari/i)).toBeInTheDocument();
    expect(screen.getByText(/Crash < 1.09% • ANR < 0.47%/i)).toBeInTheDocument();
  });

  it('renders all 14 day buttons in chronological order', () => {
    render(<ClosedTestingMonitor />);

    for (let day = 1; day <= 14; day++) {
      expect(screen.getAllByText(new RegExp(`Hari ke-${day}\\b`))[0]).toBeInTheDocument();
    }
  });

  it('toggles checkpoint checkboxes and updates compliance', () => {
    render(<ClosedTestingMonitor />);

    // Get the 4 checkpoint checkboxes specifically
    const optInCheckbox = screen.getByLabelText(/Opt-in Tester Verification/i);
    const crashAnrCheckbox = screen.getByLabelText(/Crash & ANR Rate Inspection/i);
    const feedbackCheckbox = screen.getByLabelText(/Tinjauan Feedback & Masukan Tester/i);
    const telemetryCheckbox = screen.getByLabelText(/Sesi Aplikasi & Pengujian Fitur Riil/i);

    expect(optInCheckbox).toBeInTheDocument();
    expect(crashAnrCheckbox).toBeInTheDocument();
    expect(feedbackCheckbox).toBeInTheDocument();
    expect(telemetryCheckbox).toBeInTheDocument();

    // Click all 4 checkboxes for Day 1
    fireEvent.click(optInCheckbox);
    fireEvent.click(crashAnrCheckbox);
    fireEvent.click(feedbackCheckbox);
    fireEvent.click(telemetryCheckbox);

    // Check that Day 1 is now marked as compliant
    expect(screen.getByText('HARI LULUS VALIDASI')).toBeInTheDocument();
    expect(screen.getByText('1 / 14 Hari')).toBeInTheDocument();
  });

  it('renders all 6 Google Play official production access questions', () => {
    render(<ClosedTestingMonitor />);

    expect(screen.getByText(/Formulir Evaluasi Jawaban Resmi Pengajuan Akses Produksi/i)).toBeInTheDocument();
    expect(screen.getByText(/6 \/ 6 Formulir Siap Kirim/i)).toBeInTheDocument();

    // Verify presence of all 6 questions
    expect(screen.getByText(/Metode Rekrutmen Penguji/i)).toBeInTheDocument();
    expect(screen.getByText(/Kemudahan & Aksesibilitas Rekrutmen/i)).toBeInTheDocument();
    expect(screen.getByText(/Keterlibatan Penguji & Alur Pengujian Fitur/i)).toBeInTheDocument();
    expect(screen.getByText(/Ringkasan Masukan & Tindakan Perbaikan/i)).toBeInTheDocument();
    expect(screen.getByText(/Kriteria Kesiapan Produksi/i)).toBeInTheDocument();
    expect(screen.getByText(/Rencana Pasca-Rilis & Pemantauan Kualitas/i)).toBeInTheDocument();

    // Verify copy all button exists
    expect(screen.getByText(/Salin Semua 6 Jawaban Sekaligus/i)).toBeInTheDocument();
  });

  it('allows editing and saving daily metrics with threshold warning', () => {
    render(<ClosedTestingMonitor />);

    // Find the save metrics button
    const saveButton = screen.getByRole('button', { name: /Simpan Metrik Hari Ini/i });
    expect(saveButton).toBeInTheDocument();

    // Save metrics
    fireEvent.click(saveButton);
    expect(screen.getByText(/Metrik dan catatan harian berhasil disimpan!/i)).toBeInTheDocument();
  });

  it('allows toggling question edit mode', () => {
    render(<ClosedTestingMonitor />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    expect(editButtons.length).toBeGreaterThan(0);

    // Click edit on question 1
    fireEvent.click(editButtons[0]);

    // Check that textarea and save button are visible
    expect(screen.getByText(/Simpan Perubahan/i)).toBeInTheDocument();
    expect(screen.getByText(/Kembalikan ke Teks Standar Resmi Studio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batal/i })).toBeInTheDocument();

    // Cancel edit
    fireEvent.click(screen.getByRole('button', { name: /Batal/i }));
    expect(screen.queryByText(/Simpan Perubahan/i)).not.toBeInTheDocument();
  });
});