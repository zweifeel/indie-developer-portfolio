import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualOfficePrototype } from '../components/virtual-office/VirtualOfficePrototype';
import { ProjectRoomView } from '../components/virtual-office/ProjectRoomView';
import { provisionProjectRoom } from '../data/virtualOfficePresets';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../types/virtualOffice';

describe('Virtual Office Prototype UI Components (Phase B2)', () => {
  it('renders the mandatory AI Agent Crew — Simulation label prominently', () => {
    render(<VirtualOfficePrototype />);
    const labels = screen.getAllByText(VIRTUAL_OFFICE_SIMULATION_LABEL);
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rp0 Zero-Cost Architecture')).toBeInTheDocument();
  });

  it('renders all 6 canonical projects in the Virtual HQ Overview', () => {
    render(<VirtualOfficePrototype />);
    expect(screen.getByText('SleepyKoala Virtual Development Office')).toBeInTheDocument();
    expect(screen.getAllByText('DompetNalar').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Idle Master').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mobile Kasir').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Idle Mining Empire').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('The Broken Origin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Worklume').length).toBeGreaterThanOrEqual(1);
  });

  it('switches between Virtual HQ and Project Room View via tab buttons', () => {
    render(<VirtualOfficePrototype />);
    const roomTab = screen.getByText('Project Room View');
    fireEvent.click(roomTab);
    expect(screen.getByText('← Kembali ke Virtual HQ')).toBeInTheDocument();

    const hqTab = screen.getByText('Virtual HQ Overview');
    fireEvent.click(hqTab);
    expect(screen.getByText('Pilih Ruangan Proyek di Virtual HQ:')).toBeInTheDocument();
  });

  it('navigates from Virtual HQ into a specific room when a room card is clicked', () => {
    render(<VirtualOfficePrototype />);
    const dompetRoomBtn = screen.getByRole('button', { name: /DompetNalar/i });
    fireEvent.click(dompetRoomBtn);

    // After clicking room in HQ, user can switch or view room
    const roomTab = screen.getByText('Project Room View');
    fireEvent.click(roomTab);
    expect(screen.getByText(/Viewport mendalam ruang kerja tim agent virtual/i)).toBeInTheDocument();
  });

  it('renders 5 canonical agent crew members in ProjectRoomView', () => {
    const room = provisionProjectRoom({
      id: 'room-dompet',
      name: 'DompetNalar',
      slug: 'dompetnalar',
      category: 'Finance / Productivity',
    });

    render(<ProjectRoomView room={room} />);

    // Check roles
    expect(screen.getAllByText('PLANNER').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('DEVELOPER').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TESTER').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('REVIEWER').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PUBLISHER').length).toBeGreaterThanOrEqual(1);
  });

  it('displays agent profile and simulated activity when an agent is selected in inspector', () => {
    const room = provisionProjectRoom({
      id: 'room-tbo',
      name: 'The Broken Origin',
      slug: 'tbo-roblox',
      category: 'Roblox MMORPG',
    });

    render(<ProjectRoomView room={room} />);

    // Click Developer Agent
    const devBtns = screen.getAllByRole('button', { name: /Developer|Dev/i });
    fireEvent.click(devBtns[0]);

    expect(screen.getByText(/Profil: (Developer|Dev)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Network & Engine Developer/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches between Agent, Decor, and Log tabs in ProjectRoomView', () => {
    const room = provisionProjectRoom({
      id: 'room-test',
      name: 'Test Proyek',
      slug: 'test-proyek',
      category: 'Android App',
    });

    render(<ProjectRoomView room={room} />);

    // Switch to Decor tab
    const decorTab = screen.getByRole('button', { name: /Dekorasi/i });
    fireEvent.click(decorTab);
    expect(screen.getByText(/Objek tematik ruangan disesuaikan/i)).toBeInTheDocument();

    // Switch to Logs tab
    const logsTab = screen.getByRole('button', { name: /Simulasi/i });
    fireEvent.click(logsTab);
    expect(screen.getByText('AGENT ACTIVITY STREAM')).toBeInTheDocument();
  });

  it('toggles Reduced Motion state cleanly without throwing', () => {
    render(<VirtualOfficePrototype />);
    const motionToggle = screen.getByText(/Reduced Motion: OFF/i);
    fireEvent.click(motionToggle);
    expect(screen.getByText(/Reduced Motion: ON/i)).toBeInTheDocument();
  });

  it('toggles Static Fallback state and displays fallback information notice', () => {
    render(<VirtualOfficePrototype />);
    const staticToggle = screen.getByText(/Static Fallback: OFF/i);
    fireEvent.click(staticToggle);
    expect(screen.getByText(/Static Fallback: ON/i)).toBeInTheDocument();
    expect(screen.getByText(/Mode Fallback Statis Aktif/i)).toBeInTheDocument();
  });

  it('switches project via the dropdown selector and loads corresponding preset', () => {
    render(<VirtualOfficePrototype />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'room_tbo-roblox' } });

    // Switch to Room View to verify
    const roomTab = screen.getByText('Project Room View');
    fireEvent.click(roomTab);
    expect(screen.getAllByText('The Broken Origin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Roblox MMORPG').length).toBeGreaterThanOrEqual(1);
  });
});
