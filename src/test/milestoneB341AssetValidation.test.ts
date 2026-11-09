import { describe, it, expect } from 'vitest';
import {
  PROJECT_AGENT_INSTANCES,
} from '../components/virtual-office/LemburIsometricPrototype';
import {
  provisionVirtualHQ,
  provisionProjectRoom,
} from '../data/virtualOfficePresets';
import { CORE_AGENT_ROLES } from '../types/virtualOffice';
import fs from 'fs';
import path from 'path';

describe('Milestone B3.4.1 — Asset Validation & Connected Virtual HQ Prototype', () => {
  // 1. Core Architecture: 6 Canonical Projects & 30 Independent Agent Instances
  describe('1. 30 Project-Agent Instances Architecture', () => {
    it('defines exactly 30 project-agent instances across 6 canonical projects', () => {
      expect(PROJECT_AGENT_INSTANCES).toHaveLength(30);
    });

    it('allocates exactly 5 core roles per project', () => {
      const canonicalProjectIds = [
        'dompetnalar',
        'idle-master',
        'mobile-kasir',
        'idle-mining',
        'the-broken-origin',
        'worklume'
      ];

      for (const projId of canonicalProjectIds) {
        const projectAgents = PROJECT_AGENT_INSTANCES.filter((a) => a.projectId === projId);
        expect(projectAgents).toHaveLength(5);

        const roles = projectAgents.map((a) => a.role);
        for (const expectedRole of CORE_AGENT_ROLES) {
          expect(roles).toContain(expectedRole);
        }
      }
    });

    it('guarantees strictly unique instanceId for all 30 agents (no shared runtime object)', () => {
      const ids = PROJECT_AGENT_INSTANCES.map((a) => a.instanceId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(30);
    });

    it('ensures each agent instance has independent position, activity and task context', () => {
      const plannerDompet = PROJECT_AGENT_INSTANCES.find(
        (a) => a.instanceId === 'agent_dompetnalar_planner'
      );
      const plannerIdle = PROJECT_AGENT_INSTANCES.find(
        (a) => a.instanceId === 'agent_idlemaster_planner'
      );

      expect(plannerDompet).toBeDefined();
      expect(plannerIdle).toBeDefined();
      expect(plannerDompet?.instanceId).not.toBe(plannerIdle?.instanceId);
      expect(plannerDompet?.projectId).toBe('dompetnalar');
      expect(plannerIdle?.projectId).toBe('idle-master');
      expect(plannerDompet?.activity).not.toBe(plannerIdle?.activity);
      expect(plannerDompet?.stationPos.x).not.toBe(plannerIdle?.stationPos.x);
    });
  });

  // 2. Human Character Asset Acceptance Criteria (100% Adult Professional)
  describe('2. Adult Human Coworker Asset Verification', () => {
    const verifiedAssetKeys = [
      'char_citizens_office_m_b',
      'char_citizens_casual_f_b',
      'char_citizens_office_m_blue',
      'char_citizens_office_f_c',
      'char_citizens_elder_m_a'
    ];

    it('verifies all 5 core role assets are adult human coworkers with zero teenagers/children substituted', () => {
      for (const agent of PROJECT_AGENT_INSTANCES) {
        expect(verifiedAssetKeys).toContain(agent.charAssetKey);
        // Explicitly assert teenagers and children are NOT used in core roles
        expect(agent.charAssetKey).not.toContain('teen');
        expect(agent.charAssetKey).not.toContain('child');
        expect(agent.charAssetKey).not.toContain('boy');
        expect(agent.charAssetKey).not.toContain('girl');
      }
    });

    it('verifies all local frame files exist on disk with non-zero size', () => {
      const publicRoot = path.resolve(__dirname, '../../public/assets/virtual-office/characters/modern-citizens/frames');
      for (const assetKey of verifiedAssetKeys) {
        const framePath = path.join(publicRoot, assetKey, 'stand_down.png');
        expect(fs.existsSync(framePath)).toBe(true);
        const stat = fs.statSync(framePath);
        expect(stat.size).toBeGreaterThan(1000); // Verified non-empty binary PNG
      }
    });

    it('verifies walking animation frames exist for the 4 cardinal directions', () => {
      const publicRoot = path.resolve(__dirname, '../../public/assets/virtual-office/characters/modern-citizens/frames');
      const plannerDir = path.join(publicRoot, 'char_citizens_office_m_b');

      expect(fs.existsSync(path.join(plannerDir, 'stand_down.png'))).toBe(true);
      expect(fs.existsSync(path.join(plannerDir, 'stand_side.png'))).toBe(true);
      expect(fs.existsSync(path.join(plannerDir, 'stand_up.png'))).toBe(true);
      expect(fs.existsSync(path.join(plannerDir, 'walk_down_00.png'))).toBe(true);
      expect(fs.existsSync(path.join(plannerDir, 'walk_side_00.png'))).toBe(true);
      expect(fs.existsSync(path.join(plannerDir, 'walk_up_00.png'))).toBe(true);
    });
  });

  // 3. Room Identity Consistency & Dynamic Provisioning
  describe('3. Dynamic Provisioning & Canonical Room Contracts', () => {
    it('provisions all canonical project rooms consistently with 5 agents each', () => {
      const hq = provisionVirtualHQ();
      expect(hq.rooms).toHaveLength(6);

      for (const room of hq.rooms) {
        expect(room.agents).toHaveLength(5);
        expect(room.projectSlug).toBeDefined();
        expect(room.projectName).toBeDefined();
      }
    });

    it('dynamically provisions arbitrary future projects (Project 7+) with standard 5 agents', () => {
      const customProject = {
        name: 'Project Nova 7',
        slug: 'project-nova-7',
        category: 'Game / Casual'
      };

      const room = provisionProjectRoom(customProject);
      expect(room.id).toBe('room_project-nova-7');
      expect(room.agents).toHaveLength(5);
      expect(room.agents[0].role).toBe('PLANNER');
      expect(room.agents[1].role).toBe('DEVELOPER');
      expect(room.agents[2].role).toBe('TESTER');
      expect(room.agents[3].role).toBe('REVIEWER');
      expect(room.agents[4].role).toBe('PUBLISHER');
    });
  });

  // 4. Asset Licensing & Zero-Cost Compliance
  describe('4. Zero-Cost & License Integrity', () => {
    it('documents all candidate assets and license terms in ASSET_CREDITS.md', () => {
      const creditsPath = path.resolve(__dirname, '../../public/assets/virtual-office/ASSET_CREDITS.md');
      expect(fs.existsSync(creditsPath)).toBe(true);
      const content = fs.readFileSync(creditsPath, 'utf8');

      expect(content).toContain('Modern Citizens');
      expect(content).toContain('nacl1234');
      expect(content).toContain('Permissive Commercial');
      expect(content).toContain('$0.00');
      expect(content).toContain('char_citizens_office_m_blue');
    });

    it('verifies verified local reference file klasik.webp exists in scratch', () => {
      const refPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\51b8e4cf-4041-4888-a92a-ef2dedec86f9\\scratch\\klasik.webp';
      expect(fs.existsSync(refPath)).toBe(true);
      const stat = fs.statSync(refPath);
      expect(stat.size).toBe(113830);
    });
  });
});
