import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../types/virtualOffice';
import { CAMPUS_VIEWPORT_PRESETS, INITIAL_WALKERS } from '../components/virtual-office/ProductionVirtualHQCampus';
import { PROJECT_AGENT_INSTANCES } from '../components/virtual-office/LemburIsometricPrototype';

describe('Milestone B3.4.5 — Architectural Layout Reconstruction, Office Furnishing & Live Character Animation Suite', () => {
  const CAMPUS_FILE = path.resolve(
    process.cwd(),
    'src/components/virtual-office/ProductionVirtualHQCampus.tsx'
  );

  describe('1. Architectural Wall & Floor Reconstruction', () => {
    it('1.1. verifies the source component file exists and contains the updated campus architecture', () => {
      expect(fs.existsSync(CAMPUS_FILE)).toBe(true);
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      // Architectural Foundation and Envelopes
      expect(content).toContain('envelope-northwest');
      expect(content).toContain('envelope-northeast');

      // Doorway integrations
      expect(content).toContain('doorOpen_E.png');

      // Multiple floor patterns
      expect(content).toContain('parquet-pattern');
      expect(content).toContain('wood-pattern');
      expect(content).toContain('red-carpet-pattern');
      expect(content).toContain('carpet-pattern');
    });

    it('1.2. verifies all 4 shared central areas and executive boardroom are defined with distinct IDs', () => {
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      expect(content).toContain('id="area-reception"');
      expect(content).toContain('id="area-plaza"');
      expect(content).toContain('id="area-pantry"');
      expect(content).toContain('id="area-meeting"');
      expect(content).toContain('id="area-boardroom"');
    });

    it('1.3. verifies all 6 dedicated project rooms are defined with distinct IDs and rear walls', () => {
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      expect(content).toContain('id="area-dompetnalar"');
      expect(content).toContain('id="area-idlemaster"');
      expect(content).toContain('id="area-kasir"');
      expect(content).toContain('id="area-mining"');
      expect(content).toContain('id="area-brokenorigin"');
      expect(content).toContain('id="area-worklume"');
    });
  });

  describe('2. High Furniture & Equipment Density per Project Room', () => {
    it('2.1. verifies project-specific specialty props exist in source', () => {
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      // DompetNalar: laser printer & filing cabinets
      expect(content).toContain('laser_printer.png');
      expect(content).toContain('filing_cabinet.png');

      // IDLE MASTER: arcade cabinet & concept boards
      expect(content).toContain('arcade_cabinet.png');
      expect(content).toContain('cork_board.png');

      // Mobile Kasir: POS counter & retail shelves
      expect(content).toContain('pos_counter.png');
      expect(content).toContain('planter_divider_shelf.png');

      // Idle Mining: server rack & water cooler
      expect(content).toContain('server_rack.png');
      expect(content).toContain('water_cooler.png');

      // The Broken Origin: world map & lore bookshelves
      expect(content).toContain('bookshelf.png');

      // Worklume: server rack & multifunction printer
      expect(content).toContain('multifunction_printer.png');
    });

    it('2.2. verifies each project room has 5 distinct workstation calls', () => {
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      for (let i = 1; i <= 5; i++) {
        expect(content).toContain(`ws_d${i}`); // DompetNalar
        expect(content).toContain(`ws_im${i}`); // IDLE MASTER
        expect(content).toContain(`ws_k${i}`); // Mobile Kasir
        expect(content).toContain(`ws_m${i}`); // Idle Mining
        expect(content).toContain(`ws_t${i}`); // The Broken Origin
        expect(content).toContain(`ws_w${i}`); // Worklume
      }
    });
  });

  describe('3. Autonomous Live Character Animation & Simulation Engine', () => {
    it('3.1. verifies autonomous walkers are defined with valid corridor waypoints', () => {
      expect(INITIAL_WALKERS.length).toBeGreaterThanOrEqual(3);

      for (const walker of INITIAL_WALKERS) {
        expect(walker.id).toBeDefined();
        expect(walker.name).toBeDefined();
        expect(walker.charAssetKey).toBeDefined();
        expect(walker.waypoints.length).toBeGreaterThanOrEqual(3);

        // Verify waypoints stay within valid bounds (campus coordinates: 100 to 2300, 100 to 1300)
        for (const pt of walker.waypoints) {
          expect(pt.x).toBeGreaterThan(50);
          expect(pt.x).toBeLessThan(2350);
          expect(pt.y).toBeGreaterThan(50);
          expect(pt.y).toBeLessThan(1350);
        }
      }
    });

    it('3.2. verifies animation toggle and reduced motion guards exist', () => {
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      expect(content).toContain('isPlayingAnimation');
      expect(content).toContain('setIsPlayingAnimation');
      expect(content).toContain('reducedMotion');
      expect(content).toContain('requestAnimationFrame');
      expect(content).toContain('cancelAnimationFrame');
    });

    it('3.3. verifies characters use proper sprite scaling and pixelated rendering', () => {
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');

      expect(content).toContain('width="52"');
      expect(content).toContain('height="52"');
      expect(content).toContain("imageRendering: 'pixelated'");
    });
  });

  describe('4. Preservation of Contracts, 30 Agents & Simulation Labels', () => {
    it('4.1. preserves all 30 runtime agent instances across 6 projects', () => {
      expect(PROJECT_AGENT_INSTANCES.length).toBe(30);

      const projects = new Set(PROJECT_AGENT_INSTANCES.map((a) => a.projectId));
      expect(projects.size).toBe(6);

      const roles = ['PLANNER', 'DEVELOPER', 'TESTER', 'REVIEWER', 'PUBLISHER'];
      for (const p of projects) {
        const projectAgents = PROJECT_AGENT_INSTANCES.filter((a) => a.projectId === p);
        expect(projectAgents.length).toBe(5);
        for (const role of roles) {
          expect(projectAgents.some((a) => a.role === role)).toBe(true);
        }
      }
    });

    it('4.2. preserves mandatory simulation label', () => {
      expect(VIRTUAL_OFFICE_SIMULATION_LABEL).toBe('AI Agent Crew — Simulation');
      const content = fs.readFileSync(CAMPUS_FILE, 'utf8');
      expect(content).toContain('VIRTUAL_OFFICE_SIMULATION_LABEL');
    });

    it('4.3. verifies camera viewport presets provide coverage for all campus spaces', () => {
      const modes = [
        'OVERVIEW',
        'RECEPTION',
        'DOMPETNALAR',
        'IDLE_MASTER',
        'MOBILE_KASIR',
        'IDLE_MINING',
        'THE_BROKEN_ORIGIN',
        'WORKLUME',
        'PLAZA',
        'BOARDROOM',
      ];

      for (const mode of modes) {
        const preset = CAMPUS_VIEWPORT_PRESETS[mode as keyof typeof CAMPUS_VIEWPORT_PRESETS];
        expect(preset, `Preset ${mode} should exist`).toBeDefined();
        expect(preset.w).toBeGreaterThan(0);
        expect(preset.h).toBeGreaterThan(0);
        expect(preset.label).toBeDefined();
      }
    });
  });
});
