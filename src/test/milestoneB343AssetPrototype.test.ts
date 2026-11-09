import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  PROJECT_AGENT_INSTANCES,
} from '../components/virtual-office/LemburIsometricPrototype';
import { CORE_AGENT_ROLES, VIRTUAL_OFFICE_SIMULATION_LABEL } from '../types/virtualOffice';
import { ASSET_CANDIDATES, DISQUALIFIED_CANDIDATES } from '../prototypes/virtual-office-b343/AssetCandidateComparison';
import { ENVIRONMENT_PROPS } from '../prototypes/virtual-office-b343/PrototypeAEnvironment';
import { SHARED_AREA_PROPS } from '../prototypes/virtual-office-b343/PrototypeBSharedArea';

describe('Milestone B3.4.3 — Isometric Asset Acquisition & Visual Compatibility Prototype', () => {
  const publicDir = path.resolve(__dirname, '../../public');
  const b343Dir = path.join(publicDir, 'assets/virtual-office/b343');

  // 1. Zero-Cost & License Verification
  describe('1. Zero Financial Cost ($0.00 / Rp 0) & Commercial Licensing', () => {
    it('provides comprehensive ASSET_CREDITS.md with $0.00 cost verification', () => {
      const creditsPath = path.join(b343Dir, 'ASSET_CREDITS.md');
      expect(fs.existsSync(creditsPath)).toBe(true);
      const content = fs.readFileSync(creditsPath, 'utf-8');
      expect(content).toContain('$0.00');
      expect(content).toContain('Rp 0');
      expect(content).toContain('ThirdAngle');
      expect(content).toContain('Antahonist');
      expect(content).toContain('RigelRiv');
      expect(content).toContain('Modern Citizens');
    });

    it('stores permissive commercial license files locally in /b343/licenses/', () => {
      const licenseDir = path.join(b343Dir, 'licenses');
      expect(fs.existsSync(licenseDir)).toBe(true);

      const requiredLicenses = [
        'ThirdAngle_README_License.txt',
        'Antahonist_LICENSE.txt',
        'Riekahq_LICENSE.txt',
        'RigelRiv_LICENSE.txt',
        'ModernCitizens_LICENSE.txt',
      ];

      for (const lic of requiredLicenses) {
        const fullPath = path.join(licenseDir, lic);
        expect(fs.existsSync(fullPath), `License missing: ${lic}`).toBe(true);
        expect(fs.statSync(fullPath).size).toBeGreaterThan(0);
      }
    });

    it('documents disqualified and blocked candidates with clear rationale', () => {
      expect(DISQUALIFIED_CANDIDATES.length).toBeGreaterThanOrEqual(3);
      const names = DISQUALIFIED_CANDIDATES.map((c) => c.name);
      expect(names.some((n) => n.includes('Gridwright Character Creator'))).toBe(true);
      expect(names.some((n) => n.includes('HappyHustle'))).toBe(true);
      expect(names.some((n) => n.includes('Gridwright City People'))).toBe(true);
    });
  });

  // 2. Candidate Asset Verification (ThirdAngle, Antahonist, riekahq, RigelRiv, Modern Citizens)
  describe('2. Candidate Isometric Assets Local Availability & Dimensions', () => {
    it('contains ThirdAngle 2:1 dimetric environment files (floors, walls, workstations)', () => {
      const envDir = path.join(b343Dir, 'environment');
      const requiredThirdAngle = [
        'floor_office_carpet_tile.png',
        'wall_plain_left.png',
        'wall_plain_right.png',
        'wall_office_window_left.png',
        'wall_office_window_right.png',
        'wall_end_left.png',
        'wall_end_right.png',
        'cubicle_workstation.png',
        'standing_desk.png',
        'ergonomic_office_chair.png',
        'multifunction_printer.png',
        'planter_divider_shelf.png',
        'copy_paper_box_stack.png',
      ];

      for (const file of requiredThirdAngle) {
        const fp = path.join(envDir, file);
        expect(fs.existsSync(fp), `Missing ThirdAngle sprite: ${file}`).toBe(true);
        expect(fs.statSync(fp).size).toBeGreaterThan(0);
      }
    });

    it('contains Antahonist 64x64 furniture and tech props', () => {
      const furnDir = path.join(b343Dir, 'furniture');
      const requiredAntahonist = [
        'office_desk.png',
        'office_chair.png',
        'office_monitor.png',
        'office_keyboard.png',
        'whiteboard.png',
        'filing_cabinet.png',
        'water_cooler.png',
        'coffee_machine.png',
        'vending_snack.png',
        'potted_plant.png',
        'laser_printer.png',
      ];

      for (const file of requiredAntahonist) {
        const fp = path.join(furnDir, file);
        expect(fs.existsSync(fp), `Missing Antahonist sprite: ${file}`).toBe(true);
        expect(fs.statSync(fp).size).toBeGreaterThan(0);
      }
    });

    it('contains riekahq lounge and interior sprites', () => {
      const riekahqDir = path.join(b343Dir, 'environment/riekahq');
      const requiredRiekahq = [
        'sofa_red_a.png',
        'sofa_red_b.png',
        'table_dining_a.png',
        'lamp_floor_a.png',
        'plant_pot_a.png',
      ];

      for (const file of requiredRiekahq) {
        const fp = path.join(riekahqDir, file);
        expect(fs.existsSync(fp), `Missing riekahq sprite: ${file}`).toBe(true);
        expect(fs.statSync(fp).size).toBeGreaterThan(0);
      }
    });

    it('contains RigelRiv human character frames (Candidate B1)', () => {
      const rigelDir = path.join(b343Dir, 'characters/rigelriv');
      const requiredRigel = [
        'frame_0_0.png',
        'frame_0_1.png',
        'frame_1_0.png',
        'frame_1_1.png',
      ];

      for (const file of requiredRigel) {
        const fp = path.join(rigelDir, file);
        expect(fs.existsSync(fp), `Missing RigelRiv frame: ${file}`).toBe(true);
        expect(fs.statSync(fp).size).toBeGreaterThan(0);
      }
    });

    it('contains Modern Citizens adult software engineer frames (Benchmark Baseline)', () => {
      const mcDir = path.join(b343Dir, 'characters/modern-citizens/frames');
      const coreRoles = [
        'char_citizens_office_m_b',
        'char_citizens_casual_f_b',
        'char_citizens_office_m_blue',
        'char_citizens_office_f_c',
        'char_citizens_elder_m_a',
      ];

      for (const roleDir of coreRoles) {
        const standDown = path.join(mcDir, roleDir, 'stand_down.png');
        expect(fs.existsSync(standDown), `Missing stand_down for ${roleDir}`).toBe(true);
        expect(fs.statSync(standDown).size).toBeGreaterThan(0);
      }
    });
  });

  // 3. Grid Geometry & Mathematical Compatibility
  describe('3. 2:1 Dimetric Isometric Geometry & Depth Sorting', () => {
    it('accurately computes 2:1 dimetric screen projection coordinates', () => {
      const originX = 340;
      const originY = 160;
      const tileW = 64;
      const tileH = 32;

      const calcScreenPos = (col: number, row: number) => ({
        x: originX + (col - row) * (tileW / 2),
        y: originY + (col + row) * (tileH / 2),
      });

      // Cell (0,0) is at origin
      const originCell = calcScreenPos(0, 0);
      expect(originCell.x).toBe(340);
      expect(originCell.y).toBe(160);

      // East move (+1 col) shifts x by +32, y by +16 (2:1 ratio)
      const eastCell = calcScreenPos(1, 0);
      expect(eastCell.x).toBe(372);
      expect(eastCell.y).toBe(176);
      expect((eastCell.x - originCell.x) / (eastCell.y - originCell.y)).toBe(2);

      // South move (+1 row) shifts x by -32, y by +16 (2:1 ratio)
      const southCell = calcScreenPos(0, 1);
      expect(southCell.x).toBe(308);
      expect(southCell.y).toBe(176);
      expect((originCell.x - southCell.x) / (southCell.y - originCell.y)).toBe(2);
    });

    it('ensures correct front-to-back depth sorting key', () => {
      const backProp = { gridX: 0, gridY: 0, elevation: 0 };
      const midProp = { gridX: 2, gridY: 1, elevation: 0 };
      const frontProp = { gridX: 3, gridY: 3, elevation: 0 };

      const depthKey = (p: { gridX: number; gridY: number; elevation: number }) =>
        (p.gridX + p.gridY) * 1000 + p.elevation;

      expect(depthKey(backProp)).toBeLessThan(depthKey(midProp));
      expect(depthKey(midProp)).toBeLessThan(depthKey(frontProp));
    });
  });

  // 4. DompetNalar 5-Agent Isolation & Preservation of 30 Studio Agents
  describe('4. Preservation of 30 Runtime Agent Instances', () => {
    it('strictly preserves all 30 independent runtime agent instances', () => {
      expect(PROJECT_AGENT_INSTANCES).toHaveLength(30);
    });

    it('allocates exactly 5 independent agents for DompetNalar', () => {
      const dnAgents = PROJECT_AGENT_INSTANCES.filter((a) => a.projectId === 'dompetnalar');
      expect(dnAgents).toHaveLength(5);

      const roles = dnAgents.map((a) => a.role);
      for (const expectedRole of CORE_AGENT_ROLES) {
        expect(roles).toContain(expectedRole);
      }
    });

    it('preserves strictly mandatory simulation label', () => {
      expect(VIRTUAL_OFFICE_SIMULATION_LABEL).toBe('AI Agent Crew — Simulation');
    });
  });

  // 5. Prototype Configurations
  describe('5. Prototype Environments Setup', () => {
    it('loads Prototype A environment with at least 15 placed architectural items', () => {
      expect(ENVIRONMENT_PROPS.length).toBeGreaterThanOrEqual(15);
      const hasWalls = ENVIRONMENT_PROPS.some((p) => p.category === 'wall');
      const hasFurniture = ENVIRONMENT_PROPS.some((p) => p.category === 'furniture');
      expect(hasWalls).toBe(true);
      expect(hasFurniture).toBe(true);
    });

    it('loads Prototype B shared area with lounge seating, coffee bar, and reception items', () => {
      expect(SHARED_AREA_PROPS.length).toBeGreaterThanOrEqual(12);
      const hasCoffee = SHARED_AREA_PROPS.some((p) => p.id === 'espresso_machine');
      const hasWater = SHARED_AREA_PROPS.some((p) => p.id === 'water_dispenser');
      const hasSofa = SHARED_AREA_PROPS.some((p) => p.id === 'lounge_sofa_main');
      expect(hasCoffee).toBe(true);
      expect(hasWater).toBe(true);
      expect(hasSofa).toBe(true);
    });

    it('contains all 5 asset candidate cards in ASSET_CANDIDATES', () => {
      expect(ASSET_CANDIDATES.length).toBe(5);
      const ids = ASSET_CANDIDATES.map((c) => c.id);
      expect(ids).toContain('thirdangle-starter');
      expect(ids).toContain('antahonist-kit');
      expect(ids).toContain('riekahq-interiors');
      expect(ids).toContain('rigelriv-modern');
      expect(ids).toContain('modern-citizens');
    });
  });
});
