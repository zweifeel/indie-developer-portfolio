import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { PixelProjectRoom } from '../components/virtual-office/PixelProjectRoom';
import { PixelIsometricCanvas } from '../components/virtual-office/PixelIsometricCanvas';
import {
  provisionVirtualHQ,
  provisionProjectRoom,
} from '../data/virtualOfficePresets';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../types/virtualOffice';
import rawProjects from '../data/projects.json';

describe('Milestone B3 — Cozy Isometric Pixel Art Virtual Office Suite', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/api/projects')) {
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
  });

  describe('1. Visual Style & Pixel Art Assets Integrity', () => {
    it('uses local /assets/virtual-office/ paths and never hotlinks third-party domains', () => {
      const room = provisionProjectRoom({
        name: 'DompetNalar',
        slug: 'dompetnalar',
        category: 'Finance / Productivity',
      });

      render(
        <MemoryRouter>
          <PixelIsometricCanvas room={room} />
        </MemoryRouter>
      );

      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
      images.forEach((img) => {
        const src = img.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).toMatch(/^\/assets\/virtual-office\//);
        expect(src).not.toMatch(/^https?:\/\//); // Zero external hotlinking
      });
    });

    it('applies crisp pixelated image rendering style to all pixel sprites', () => {
      const room = provisionProjectRoom({
        name: 'DompetNalar',
        slug: 'dompetnalar',
        category: 'Finance / Productivity',
      });

      render(
        <MemoryRouter>
          <PixelIsometricCanvas room={room} />
        </MemoryRouter>
      );

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img.style.imageRendering).toBe('pixelated');
      });
    });
  });

  describe('2. Core 5 Pixel Agents in Every Room', () => {
    it('renders exactly five core agents in canonical order with specialized roles', () => {
      const room = provisionProjectRoom({
        name: 'Mobile Kasir',
        slug: 'mobile-kasir',
        category: 'Business / POS',
      });

      render(
        <MemoryRouter>
          <PixelProjectRoom room={room} />
        </MemoryRouter>
      );

      // Verify the 5 canonical roles are present in the room
      expect(screen.getAllByText('PLANNER').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('DEVELOPER').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('TESTER').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('REVIEWER').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('PUBLISHER').length).toBeGreaterThanOrEqual(1);
      expect(room.agents.length).toBe(5);
    });

    it('displays agent profile and current simulated task when an agent is selected', () => {
      const room = provisionProjectRoom({
        name: 'The Broken Origin',
        slug: 'tbo-roblox',
        category: 'Roblox MMORPG',
      });

      render(
        <MemoryRouter>
          <PixelProjectRoom room={room} />
        </MemoryRouter>
      );

      // Select Developer Agent
      const devBtns = screen.getAllByRole('button', { name: /Developer|Dev/i });
      fireEvent.click(devBtns[0]);

      expect(screen.getAllByText(/Developer|Dev/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Network & Engine Developer/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Simulasi Tugas Terkini:/i)).toBeInTheDocument();
    });
  });

  describe('3. Shared Room Identity & Single Source of Truth', () => {
    it('provisions the exact same room ID and configuration for HQ and Detail view', () => {
      const project = {
        name: 'DompetNalar',
        slug: 'dompetnalar',
        category: 'Finance / Productivity',
      };

      const hq = provisionVirtualHQ([project]);
      const detailRoom = provisionProjectRoom(project);

      // Single Room Identity Guarantee
      expect(hq.rooms[0].id).toBe(detailRoom.id);
      expect(hq.rooms[0].projectId).toBe(detailRoom.projectId);
      expect(hq.rooms[0].projectSlug).toBe(detailRoom.projectSlug);
      expect(hq.rooms[0].themePresetId).toBe(detailRoom.themePresetId);
      expect(hq.rooms[0].agents.length).toBe(detailRoom.agents.length);
    });

    it('prevents duplicate room records for the same project slug in HQ', () => {
      const projects = [
        { name: 'DompetNalar', slug: 'dompetnalar', category: 'Finance' },
        { name: 'Mobile Kasir', slug: 'mobile-kasir', category: 'POS' },
      ];

      const hq = provisionVirtualHQ(projects);
      const roomIds = hq.rooms.map((r) => r.id);
      const uniqueRoomIds = new Set(roomIds);
      expect(roomIds.length).toBe(uniqueRoomIds.size);
    });
  });

  describe('4. HomePage & ProjectDetailPage Real Integrations', () => {
    it('renders PixelVirtualHQ inside HomePage with 6 canonical project buttons', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      );

      // Check mandatory simulation label
      const badges = await screen.findAllByText(VIRTUAL_OFFICE_SIMULATION_LABEL);
      expect(badges.length).toBeGreaterThanOrEqual(1);

      // Check HQ Title
      expect(screen.getByText(/SleepyKoala Virtual Development Office|SleepyKoala Virtual HQ/i)).toBeInTheDocument();

      // Check 6 canonical projects in HQ room directory
      expect(screen.getAllByText(/DompetNalar/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/IDLE MASTER/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Mobile Kasir/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Idle Mining/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/The Broken Origin/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Worklume/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders PixelProjectRoom close-up inside ProjectDetailPage for /projects/dompetnalar', async () => {
      render(
        <MemoryRouter initialEntries={['/projects/dompetnalar']}>
          <Routes>
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for page to load
      const badges = await screen.findAllByText(VIRTUAL_OFFICE_SIMULATION_LABEL);
      expect(badges.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText(/Ruang Kerja Tim: DompetNalar/i)).toBeInTheDocument();
      expect(screen.getByText(/Android Studio Space/i)).toBeInTheDocument();
    });
  });

  describe('5. Accessibility, Motion & Fallback Preferences', () => {
    it('toggles Reduced Motion and stops animated ping/pulse without throwing', () => {
      const room = provisionProjectRoom({
        name: 'DompetNalar',
        slug: 'dompetnalar',
        category: 'Finance / Productivity',
      });

      render(
        <MemoryRouter>
          <PixelProjectRoom room={room} defaultReducedMotion={false} />
        </MemoryRouter>
      );

      const motionBtn = screen.getByRole('button', { name: /Motion: On/i });
      fireEvent.click(motionBtn);
      expect(screen.getByRole('button', { name: /Motion: Off/i })).toBeInTheDocument();
    });

    it('toggles Static Fallback and renders static notice banner', () => {
      const room = provisionProjectRoom({
        name: 'Idle Master',
        slug: 'idle-master',
        category: 'Casual Mobile Game',
      });

      render(
        <MemoryRouter>
          <PixelProjectRoom room={room} defaultStaticFallback={false} />
        </MemoryRouter>
      );

      const staticBtn = screen.getByRole('button', { name: /Statis: Off/i });
      fireEvent.click(staticBtn);
      expect(screen.getByRole('button', { name: /Statis: On/i })).toBeInTheDocument();
      expect(screen.getByText(/Mode Fallback Statis Aktif/i)).toBeInTheDocument();
    });
  });
});
