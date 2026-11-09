import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../types/virtualOffice';
import { provisionVirtualHQ } from '../data/virtualOfficePresets';
import rawProjects from '../data/projects.json';

describe('Milestone B3.4.4 — Production Virtual HQ Rebuild & Asset Validation Suite', () => {
  const B344_ASSET_ROOT = path.resolve(process.cwd(), 'public/assets/virtual-office/b344');

  describe('1. Free Permissive Asset Integrity & Directory Structure', () => {
    it('1.1. verifies the root b344 asset directory exists', () => {
      expect(fs.existsSync(B344_ASSET_ROOT)).toBe(true);
    });

    it('1.2. verifies key asset subdirectories exist', () => {
      const requiredDirs = [
        'architecture',
        'characters',
        'characters/modern-citizens',
        'characters/modern-citizens/frames',
        'characters/rigelriv',
        'floor',
        'furniture',
        'licenses',
        'walls',
      ];

      for (const dir of requiredDirs) {
        const fullPath = path.join(B344_ASSET_ROOT, dir);
        expect(fs.existsSync(fullPath), `Missing directory: ${dir}`).toBe(true);
      }
    });

    it('1.3. verifies essential isometric environment & furniture tiles exist', () => {
      const requiredTiles = [
        'floor/floor_office_carpet_tile.png',
        'walls/wall_office_window_left.png',
        'walls/wall_office_window_right.png',
        'furniture/office_desk.png',
        'furniture/office_monitor.png',
        'furniture/sofa_red_a.png',
        'furniture/table_dining_a.png',
        'furniture/whiteboard.png',
        'furniture/planter_divider_shelf.png',
        'furniture/coffee_machine.png',
        'furniture/water_cooler.png',
        'furniture/laser_printer.png',
      ];

      for (const tile of requiredTiles) {
        const fullPath = path.join(B344_ASSET_ROOT, tile);
        expect(fs.existsSync(fullPath), `Missing tile: ${tile}`).toBe(true);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(0);
      }
    });

    it('1.4. verifies Modern Citizens adult human character sprite frames exist', () => {
      const characterDirs = [
        'char_citizens_office_m_b',
        'char_citizens_office_m_blue',
        'char_citizens_casual_f_b',
        'char_citizens_office_f_c',
        'char_citizens_elder_m_a',
      ];

      for (const charDir of characterDirs) {
        const charPath = path.join(B344_ASSET_ROOT, 'characters/modern-citizens/frames', charDir);
        expect(fs.existsSync(charPath), `Missing character folder: ${charDir}`).toBe(true);
        const files = fs.readdirSync(charPath);
        expect(files.length).toBeGreaterThan(0);
        // Stand frame must exist
        const hasStandFrame = files.some((f) => f.startsWith('stand_'));
        expect(hasStandFrame, `${charDir} must contain at least one stand frame`).toBe(true);
      }
    });

    it('1.5. verifies animated walk-cycle sprite frames exist for hallway coworkers', () => {
      const walkFramesDir = path.join(
        B344_ASSET_ROOT,
        'characters/modern-citizens/frames/char_citizens_office_m_blue'
      );
      expect(fs.existsSync(walkFramesDir)).toBe(true);

      for (let i = 0; i <= 7; i++) {
        const frameName = `walk_side_0${i}.png`;
        const framePath = path.join(walkFramesDir, frameName);
        expect(fs.existsSync(framePath), `Missing animation frame: ${frameName}`).toBe(true);
        expect(fs.statSync(framePath).size).toBeGreaterThan(0);
      }
    });

    it('1.6. verifies ASSET_CREDITS.md and license texts confirm zero-cost ($0.00)', () => {
      const creditsPath = path.join(B344_ASSET_ROOT, 'ASSET_CREDITS.md');
      expect(fs.existsSync(creditsPath)).toBe(true);

      const creditsContent = fs.readFileSync(creditsPath, 'utf8');
      expect(creditsContent).toContain('$0.00');
      expect(creditsContent).toContain('Free');
      expect(creditsContent).toContain('Zero external hotlinks');

      const licensesDir = path.join(B344_ASSET_ROOT, 'licenses');
      expect(fs.existsSync(licensesDir)).toBe(true);
      const licenseFiles = fs.readdirSync(licensesDir);
      expect(licenseFiles.length).toBeGreaterThan(0);
    });
  });

  describe('2. Spatial Architecture & 30 Runtime Agent Preservation', () => {
    it('2.1. preserves the mandatory simulation label', () => {
      expect(VIRTUAL_OFFICE_SIMULATION_LABEL).toBe('AI Agent Crew — Simulation');
    });

    it('2.2. preserves all 6 official projects with exactly 5 agents per project (30 agents total)', () => {
      const hq = provisionVirtualHQ(rawProjects as any);
      expect(hq.rooms.length).toBe(6);

      let totalAgents = 0;
      for (const room of hq.rooms) {
        expect(room.agents.length).toBe(5);

        // Verify the 5 standard roles
        const roles = room.agents.map((a) => a.role);
        expect(roles).toContain('PLANNER');
        expect(roles).toContain('DEVELOPER');
        expect(roles).toContain('TESTER');
        expect(roles).toContain('REVIEWER');
        expect(roles).toContain('PUBLISHER');

        totalAgents += room.agents.length;
      }

      expect(totalAgents).toBe(30);
    });

    it('2.3. verifies project metadata alignment between projects.json and virtual office', () => {
      const hq = provisionVirtualHQ(rawProjects as any);
      for (const room of hq.rooms) {
        const matchingProject = rawProjects.find((p) => p.slug === room.projectSlug);
        expect(matchingProject).toBeDefined();
        expect(room.projectName).toBe(matchingProject?.name);
      }
    });
  });

  describe('3. Production Virtual HQ Campus Component Structure', () => {
    it('3.1. verifies ProductionVirtualHQCampus source file exists and contains essential campus areas', () => {
      const compPath = path.resolve(
        process.cwd(),
        'src/components/virtual-office/ProductionVirtualHQCampus.tsx'
      );
      expect(fs.existsSync(compPath)).toBe(true);

      const compContent = fs.readFileSync(compPath, 'utf8');

      // Shared Central Areas
      expect(compContent).toContain('area-reception');
      expect(compContent).toContain('area-plaza');
      expect(compContent).toContain('area-meeting');
      expect(compContent).toContain('area-pantry');

      // Dedicated Project Rooms
      expect(compContent).toContain('DompetNalar');
      expect(compContent).toContain('IDLE MASTER');
      expect(compContent).toContain('Mobile Kasir');
      expect(compContent).toContain('Idle Mining');
      expect(compContent).toContain('The Broken Origin');
      expect(compContent).toContain('Worklume');

      // Label check
      expect(compContent).toContain('VIRTUAL_OFFICE_SIMULATION_LABEL');
    });

    it('3.2. verifies PixelVirtualHQ wires ProductionVirtualHQCampus as default engine', () => {
      const hqPath = path.resolve(
        process.cwd(),
        'src/components/virtual-office/PixelVirtualHQ.tsx'
      );
      const hqContent = fs.readFileSync(hqPath, 'utf8');

      expect(hqContent).toContain('ProductionVirtualHQCampus');
      expect(hqContent).toContain("activeEngine === 'b344-production'");
    });

    it('3.3. verifies zero external hotlinks in virtual office components', () => {
      const filesToCheck = [
        'src/components/virtual-office/ProductionVirtualHQCampus.tsx',
        'src/components/virtual-office/PixelVirtualHQ.tsx',
        'src/components/virtual-office/PixelAgentAvatar.tsx',
      ];

      for (const file of filesToCheck) {
        const filePath = path.resolve(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check that image src doesn't contain external URLs like http:// or https://
        const matches = content.match(/src=["'](https?:\/\/[^"']+)["']/g);
        expect(matches).toBeNull();
      }
    });
  });
});
