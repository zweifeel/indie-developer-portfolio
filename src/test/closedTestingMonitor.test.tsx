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
    expect(screen.getByText(/Memenuhi Syarat/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 14 Hari/i)).toBeInTheDocument();
  });

  it('renders all 14 day buttons in chronological order', () => {
    render(<ClosedTestingMonitor />);

    for (let day = 1; day <= 14; day++) {
      expect(screen.getByText(`Hari ke-${day}`)).toBeInTheDocument();
    }
  });

  it('toggles checkpoint checkboxes and updates compliance', () => {
    render(<ClosedTestingMonitor />);

    // Get the first checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(4);

    // Click all 4 checkboxes for Day 1
    checkboxes.forEach((cb) => {
      fireEvent.click(cb);
    });

    // Check that Day 1 is now marked as compliant
    expect(screen.getByText('HARI LULUS VALIDASI')).toBeInTheDocument();
    expect(screen.getByText('1 / 14 Hari')).toBeInTheDocument();
  });
});
