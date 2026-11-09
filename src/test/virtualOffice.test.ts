import { describe, it, expect } from 'vitest';
import {
  CORE_AGENT_ROLES,
  VIRTUAL_OFFICE_SIMULATION_LABEL,
} from '../types/virtualOffice';
import {
  getPresetForCategory,
  provisionProjectRoom,
  provisionVirtualHQ,
  PRESET_ANDROID_APP,
  PRESET_OFFLINE_GAME,
  PRESET_MMORPG,
  PRESET_BUSINESS_WEB,
  PRESET_UNIVERSAL,
} from '../data/virtualOfficePresets';

describe('B1: Virtual Office Data Contract & Provisioner Suite', () => {
  describe('1. Baseline Contracts & Mandatory Labels', () => {
    it('enforces the exact mandatory simulation label', () => {
      expect(VIRTUAL_OFFICE_SIMULATION_LABEL).toBe('AI Agent Crew — Simulation');
    });

    it('enforces exactly five canonical core agent roles', () => {
      expect(CORE_AGENT_ROLES.length).toBe(5);
      expect(CORE_AGENT_ROLES).toEqual([
        'PLANNER',
        'DEVELOPER',
        'TESTER',
        'REVIEWER',
        'PUBLISHER',
      ]);
    });
  });

  describe('2. Category Preset Resolution', () => {
    it('resolves Android App preset for finance, tools, and kasir categories', () => {
      expect(getPresetForCategory('Finance').id).toBe(PRESET_ANDROID_APP.id);
      expect(getPresetForCategory('Kasir').id).toBe(PRESET_ANDROID_APP.id);
      expect(getPresetForCategory('Productivity').id).toBe(PRESET_ANDROID_APP.id);
      expect(getPresetForCategory('Tools').id).toBe(PRESET_ANDROID_APP.id);
    });

    it('resolves Offline Game preset for game, action, and idle categories', () => {
      expect(getPresetForCategory('Game').id).toBe(PRESET_OFFLINE_GAME.id);
      expect(getPresetForCategory('Action').id).toBe(PRESET_OFFLINE_GAME.id);
      expect(getPresetForCategory('Idle').id).toBe(PRESET_OFFLINE_GAME.id);
      expect(getPresetForCategory('Arcade').id).toBe(PRESET_OFFLINE_GAME.id);
    });

    it('resolves MMORPG preset for multiplayer/online categories', () => {
      expect(getPresetForCategory('MMORPG').id).toBe(PRESET_MMORPG.id);
      expect(getPresetForCategory('Multiplayer').id).toBe(PRESET_MMORPG.id);
    });

    it('resolves Business / Enterprise preset', () => {
      expect(getPresetForCategory('Enterprise').id).toBe(PRESET_BUSINESS_WEB.id);
      expect(getPresetForCategory('SaaS').id).toBe(PRESET_BUSINESS_WEB.id);
      expect(getPresetForCategory('POS').id).toBe(PRESET_BUSINESS_WEB.id);
    });

    it('falls back safely to PRESET_UNIVERSAL for unknown or empty categories', () => {
      expect(getPresetForCategory('QuantumPhysicsApp').id).toBe(PRESET_UNIVERSAL.id);
      expect(getPresetForCategory(undefined).id).toBe(PRESET_UNIVERSAL.id);
      expect(getPresetForCategory('').id).toBe(PRESET_UNIVERSAL.id);
      expect(getPresetForCategory('   ').id).toBe(PRESET_UNIVERSAL.id);
    });
  });

  describe('3. Per-Project Room Provisioning & Core 5 Agents', () => {
    it('provisions DompetNalar room with exactly 5 specialized Android agents', () => {
      const room = provisionProjectRoom({
        name: 'DompetNalar',
        slug: 'dompetnalar',
        category: 'Finance',
        shortDescription: 'Smart Personal Financial Manager',
        publishState: 'PUBLISHED',
      });

      expect(room.id).toBe('room_dompetnalar');
      expect(room.projectName).toBe('DompetNalar');
      expect(room.themePresetId).toBe(PRESET_ANDROID_APP.id);
      expect(room.visibility).toBe('public');
      expect(room.isArchived).toBe(false);
      expect(room.customized).toBe(false);

      // Verify agents count and roles
      expect(room.agents.length).toBe(5);
      const roles = room.agents.map((a) => a.role);
      expect(roles).toEqual(['PLANNER', 'DEVELOPER', 'TESTER', 'REVIEWER', 'PUBLISHER']);

      // Verify specialized titles
      expect(room.agents[0].specialization).toBe('Mobile App Architect');
      expect(room.agents[1].specialization).toBe('Android Engineer (Jetpack Compose)');
      expect(room.agents[2].specialization).toBe('Device Matrix & QA Tester');
      expect(room.agents[3].specialization).toBe('UX & Accessibility Reviewer');
      expect(room.agents[4].specialization).toBe('Google Play Release Manager');
    });

    it('provisions Idle Master room with Game Studio specialization', () => {
      const room = provisionProjectRoom({
        name: 'IDLE MASTER',
        slug: 'idle-master',
        category: 'Idle',
        shortDescription: 'Incremental Game',
        publishState: 'DRAFT',
      });

      expect(room.themePresetId).toBe(PRESET_OFFLINE_GAME.id);
      expect(room.visibility).toBe('draft');
      expect(room.agents.length).toBe(5);
      expect(room.agents[0].specialization).toBe('Lead Game Designer');
      expect(room.agents[1].specialization).toBe('Gameplay & Physics Programmer');
    });

    it('provisions The Broken Origin room with MMORPG specialization', () => {
      const room = provisionProjectRoom({
        name: 'The Broken Origin',
        slug: 'the-broken-origin',
        category: 'MMORPG',
        shortDescription: '2.5D Isometric Online RPG',
        publishState: 'PUBLISHED',
      });

      expect(room.themePresetId).toBe(PRESET_MMORPG.id);
      expect(room.agents.length).toBe(5);
      expect(room.agents[0].specialization).toBe('World & Systems Designer');
      expect(room.agents[1].specialization).toBe('Network & Engine Developer');
    });

    it('correctly handles archived project rooms', () => {
      const room = provisionProjectRoom({
        name: 'Legacy Project',
        slug: 'legacy-project',
        category: 'Tools',
        publishState: 'ARCHIVED',
      });

      expect(room.visibility).toBe('archived');
      expect(room.isArchived).toBe(true);
    });
  });

  describe('4. Dynamic N-Project Scalability (Beyond 6 Projects)', () => {
    it('seamlessly provisions Project #7 and beyond without code modifications', () => {
      const newProject7 = {
        name: 'CloudLogix',
        slug: 'cloudlogix',
        category: 'Enterprise',
        shortDescription: 'Cloud Log Aggregator',
        publishState: 'PUBLISHED' as const,
      };

      const newProject20 = {
        name: 'Retro Arcade Galaxy',
        slug: 'retro-arcade-galaxy',
        category: 'Arcade',
        shortDescription: 'Retro 80s arcade shooter',
        publishState: 'DRAFT' as const,
      };

      const room7 = provisionProjectRoom(newProject7);
      const room20 = provisionProjectRoom(newProject20);

      expect(room7.id).toBe('room_cloudlogix');
      expect(room7.agents.length).toBe(5);
      expect(room7.themePresetId).toBe(PRESET_BUSINESS_WEB.id);

      expect(room20.id).toBe('room_retro-arcade-galaxy');
      expect(room20.agents.length).toBe(5);
      expect(room20.themePresetId).toBe(PRESET_OFFLINE_GAME.id);
    });

    it('provisions a unified Virtual HQ containing all project rooms and global HQ agents', () => {
      const projects = [
        { name: 'DompetNalar', slug: 'dompetnalar', category: 'Finance', publishState: 'PUBLISHED' as const },
        { name: 'Mobile Kasir', slug: 'mobile-kasir', category: 'Kasir', publishState: 'PUBLISHED' as const },
        { name: 'Idle Mining', slug: 'idle-mining', category: 'Game', publishState: 'DRAFT' as const },
      ];

      const hq = provisionVirtualHQ(projects);

      expect(hq.id).toBe('hq_main');
      expect(hq.label).toBe(VIRTUAL_OFFICE_SIMULATION_LABEL);
      expect(hq.globalAgents.length).toBe(5);
      expect(hq.rooms.length).toBe(3);
      expect(hq.rooms.map((r) => r.projectSlug)).toEqual(['dompetnalar', 'mobile-kasir', 'idle-mining']);
      expect(hq.animation.enabled).toBe(true);
    });
  });
});
