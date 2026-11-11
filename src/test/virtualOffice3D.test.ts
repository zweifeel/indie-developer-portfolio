/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE 3D HEADLESS UNIT TEST SUITE (LAPIS 2)
 * 
 * Verifies Procedural Scaling, Kay Lousberg Human Crew Provisioning,
 * Autonomous Crew AI State Machine, Chat Bubble Engine, Visitor Commands,
 * and Camera Transitions.
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import type { Project } from '../types/project';
import {
  calculateRoomCoordinates,
  provisionProcedural3DCampus,
  buildCorridorRoute,
  generateCampusObstacles,
} from '../data/virtualOffice3DConfig';
import {
  executeVisitorCommand,
} from '../components/virtual-office/three/visitorCommandParser';
import {
  calculateGroundDistance,
  updateBubbleExpirations,
  evaluateAutonomousBubbles,
} from '../components/virtual-office/three/chatBubbleEngine';
import {
  stepCrewMovement,
  evaluateRandomDecisions,
} from '../components/virtual-office/three/crewAIController';
import {
  CAMPUS_OVERVIEW_PRESET,
  calculateRoomFocusState,
  stepCameraInterpolation,
  computeCameraPosition,
} from '../components/virtual-office/three/cameraTransitionController';
import {
  assembleProcedural3DCampus,
  syncCrewMeshes,
} from '../components/virtual-office/three/proceduralCampusBuilder';
import {
  getAgentLaneOffset,
} from '../components/virtual-office/three/collisionSystem';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'dompetnalar',
    slug: 'dompetnalar',
    name: 'DompetNalar',
    category: 'APPLICATION',
    status: 'READY_FOR_RELEASE',
    shortDescription: 'Financial management application',
    fullDescription: 'Full description',
    icon: '/assets/icon.png',
    screenshots: [],
    version: '1.0.0',
    lastUpdated: '2026-11-10',
    featured: true,
    registrationOpen: false,
  },
  {
    id: 'mobile-kasir',
    slug: 'mobile-kasir',
    name: 'Mobile Kasir',
    category: 'APPLICATION',
    status: 'CLOSED_TESTING',
    shortDescription: 'Mobile POS application',
    fullDescription: 'Full description',
    icon: '/assets/icon.png',
    screenshots: [],
    version: '1.0.0',
    lastUpdated: '2026-11-10',
    featured: true,
    registrationOpen: true,
  },
  {
    id: 'worklume',
    slug: 'worklume',
    name: 'Worklume',
    category: 'APPLICATION',
    status: 'WORK_IN_PROGRESS',
    shortDescription: 'Universal workspace',
    fullDescription: 'Full description',
    icon: '/assets/icon.png',
    screenshots: [],
    version: '1.0.0',
    lastUpdated: '2026-11-10',
    featured: true,
    registrationOpen: false,
  },
  {
    id: 'idle-master',
    slug: 'idle-master',
    name: 'IDLE MASTER',
    category: 'GAME',
    status: 'WORK_IN_PROGRESS',
    shortDescription: 'Casual game',
    fullDescription: 'Full description',
    icon: '/assets/icon.png',
    screenshots: [],
    version: '1.0.0',
    lastUpdated: '2026-11-10',
    featured: false,
    registrationOpen: false,
  },
  {
    id: 'idle-mining',
    slug: 'idle-mining',
    name: 'Idle Mining',
    category: 'GAME',
    status: 'WORK_IN_PROGRESS',
    shortDescription: 'Mining simulation',
    fullDescription: 'Full description',
    icon: '/assets/icon.png',
    screenshots: [],
    version: '1.0.0',
    lastUpdated: '2026-11-10',
    featured: false,
    registrationOpen: false,
  },
  {
    id: 'the-broken-origin',
    slug: 'the-broken-origin',
    name: 'The Broken Origin',
    category: 'GAME',
    status: 'WORK_IN_PROGRESS',
    shortDescription: 'MMORPG game',
    fullDescription: 'Full description',
    icon: '/assets/icon.png',
    screenshots: [],
    version: '1.0.0',
    lastUpdated: '2026-11-10',
    featured: false,
    registrationOpen: false,
  },
];

describe('Virtual Office 3D — Suite (Lapis 1 & 2)', () => {
  describe('1. Procedural Campus Scaling & Geometry Rules', () => {
    it('calculates alternating West and East wing positions without overlap', () => {
      const room0 = calculateRoomCoordinates(0);
      const room1 = calculateRoomCoordinates(1);
      const room2 = calculateRoomCoordinates(2);
      const room3 = calculateRoomCoordinates(3);

      expect(room0.wing).toBe('west');
      expect(room0.centerPos[0]).toBeLessThan(0);
      expect(room1.wing).toBe('east');
      expect(room1.centerPos[0]).toBeGreaterThan(0);
      expect(room2.wing).toBe('west');
      expect(room2.centerPos[2]).toBeGreaterThan(room0.centerPos[2]);
      expect(room3.wing).toBe('east');
      expect(room3.centerPos[2]).toBeGreaterThan(room1.centerPos[2]);
    });

    it('provisions exactly 5 human crew members per project', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      expect(rooms).toHaveLength(6);
      expect(crew).toHaveLength(30);

      // Verify each room has 5 assigned crew
      rooms.forEach((r) => {
        expect(r.assignedCrewIds).toHaveLength(5);
        const assignedCrew = crew.filter((c) => c.projectId === r.projectId);
        expect(assignedCrew).toHaveLength(5);
      });
    });

    it('scales procedurally beyond 6 projects when new projects are added', () => {
      const extendedProjects = [
        ...MOCK_PROJECTS,
        {
          id: 'project-7',
          slug: 'project-7',
          name: 'Project Seven',
          category: 'APPLICATION' as const,
          status: 'WORK_IN_PROGRESS' as const,
          shortDescription: 'New 7th project',
          fullDescription: '',
          icon: '',
          screenshots: [],
          version: '1.0.0',
          lastUpdated: '',
          featured: false,
          registrationOpen: false,
        },
      ];

      const { rooms, crew } = provisionProcedural3DCampus(extendedProjects);
      expect(rooms).toHaveLength(7);
      expect(crew).toHaveLength(35);
      expect(rooms[6].projectId).toBe('project-7');
      expect(rooms[6].assignedCrewIds).toHaveLength(5);
    });
  });

  describe('2. Visitor Command Parser & Interaction Logic', () => {
    it('wakes up a sleeping crew member upon /bangunkan command', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      crew[0].isSleeping = true;
      crew[0].currentState = 'SLEEPING';

      const result = executeVisitorCommand('/bangunkan', crew);
      expect(result.feedback.success).toBe(true);
      expect(result.feedback.actionType).toBe('WAKE_UP');
      expect(result.visualEffect).toBe('WAKE_EXCLAMATION');
      expect(result.updatedCrew[0].isSleeping).toBe(false);
      expect(result.updatedCrew[0].currentState).toBe('WORKING_AT_DESK');
      expect(result.updatedCrew[0].activeChatBubble?.type).toBe('action');
    });

    it('applies speed buff and dialogue upon /kopi command', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const result = executeVisitorCommand('/kopi', crew);

      expect(result.feedback.success).toBe(true);
      expect(result.feedback.actionType).toBe('SERVE_COFFEE');
      expect(result.visualEffect).toBe('COFFEE_FLOAT');
      const target = result.updatedCrew.find((c) => c.speedBuffUntil > Date.now());
      expect(target).toBeDefined();
    });

    it('moves crew to lounge upon /pizza command', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const result = executeVisitorCommand('/pizza', crew);

      expect(result.feedback.success).toBe(true);
      expect(result.feedback.actionType).toBe('ORDER_PIZZA');
      expect(result.visualEffect).toBe('PIZZA_APPEAR');
      const atLounge = result.updatedCrew.filter((c) => c.currentState === 'AT_LOUNGE');
      expect(atLounge.length).toBeGreaterThanOrEqual(1);
    });

    it('activates crunch mode upon /lembur command', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const result = executeVisitorCommand('/lembur', crew, 'dompetnalar');

      expect(result.feedback.success).toBe(true);
      expect(result.feedback.actionType).toBe('CRUNCH_MODE');
      expect(result.visualEffect).toBe('CRUNCH_LIGHT');
      const dompetCrew = result.updatedCrew.filter((c) => c.projectId === 'dompetnalar');
      dompetCrew.forEach((c) => {
        expect(c.currentState).toBe('WORKING_AT_DESK');
        expect(c.isSleeping).toBe(false);
      });
    });

    it('celebrates milestone upon /pesta command', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const result = executeVisitorCommand('/pesta', crew);

      expect(result.feedback.success).toBe(true);
      expect(result.feedback.actionType).toBe('PARTY_CONFETTI');
      expect(result.visualEffect).toBe('CONFETTI_BURST');
      const celebrators = result.updatedCrew.filter((c) => c.currentState === 'CELEBRATING');
      expect(celebrators.length).toBeGreaterThan(0);
    });

    it('handles unknown commands gracefully with helpful guidance', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const result = executeVisitorCommand('/randomAlienCommand', crew);

      expect(result.feedback.success).toBe(false);
      expect(result.feedback.message).toContain('tidak dikenali');
    });
  });

  describe('3. Chat Bubble & Autonomous Proximity Dialogue', () => {
    it('calculates ground distance accurately', () => {
      const dist = calculateGroundDistance([0, 0, 0], [3, 0, 4]);
      expect(dist).toBe(5);
    });

    it('cleans expired chat bubbles', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const now = 10000;
      crew[0].activeChatBubble = {
        id: 'bubble_test',
        speakerId: crew[0].id,
        speakerName: crew[0].name,
        text: 'Hello world',
        type: 'speech',
        createdAt: 1000,
        durationMs: 3000, // expires at 4000
        worldPos: [0, 0, 0],
      };

      const updated = updateBubbleExpirations(crew, now);
      expect(updated[0].activeChatBubble).toBeNull();
    });

    it('triggers proximity dialogue when two crew members walk close to each other', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      crew[0].currentState = 'WALKING';
      crew[0].currentPos = [0, 0, 0];
      crew[1].currentState = 'WALKING';
      crew[1].currentPos = [1.5, 0, 1.5]; // distance ~2.12 < 4.0

      const updated = evaluateAutonomousBubbles(crew, Date.now());
      expect(updated[0].activeChatBubble).toBeDefined();
      expect(updated[1].activeChatBubble).toBeDefined();
    });
  });

  describe('4. Autonomous Navigation & Movement Simulation', () => {
    it('steps crew towards target position and arrives cleanly', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      crew[0].currentPos = [0, 0, 0];
      crew[0].targetPos = [0.1, 0, 0.1]; // distance < 0.2
      crew[0].currentState = 'WALKING';

      const { updatedCrew } = stepCrewMovement(crew, 0.1, Date.now());
      expect(updatedCrew[0].targetPos).toBeNull(); // arrived
    });

    it('evaluates random decision transitions across rooms', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const { updatedCrew } = evaluateRandomDecisions(crew, Date.now(), rooms);
      expect(updatedCrew).toHaveLength(crew.length);
    });

    it('resolves obstacle collision by sliding along obstacle edges', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const obstacles = [
        { id: 'desk_test', minX: 5, maxX: 7, minZ: 5, maxZ: 7 },
      ];
      crew[0].currentPos = [4, 0, 6];
      crew[0].targetPos = [6, 0, 6]; // walking directly into obstacle center
      crew[0].currentState = 'WALKING';

      const { updatedCrew } = stepCrewMovement(crew, 1.0, Date.now(), obstacles);
      // Position should not be inside obstacle interior
      const posX = updatedCrew[0].currentPos[0];
      const posZ = updatedCrew[0].currentPos[2];
      const isInside = posX > 5.2 && posX < 6.8 && posZ > 5.2 && posZ < 6.8;
      expect(isInside).toBe(false);
    });

    it('resolves agent-to-agent overlap with repulsive separation', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      crew[0].currentState = 'WALKING';
      crew[0].currentPos = [10, 0, 10];
      crew[1].currentState = 'WALKING';
      crew[1].currentPos = [10.1, 0, 10.1]; // overlapping within 0.15m

      const { updatedCrew } = stepCrewMovement(crew, 0.01, Date.now());
      const dist = calculateGroundDistance(updatedCrew[0].currentPos, updatedCrew[1].currentPos);
      expect(dist).toBeGreaterThan(0.2); // actively pushed apart by personal space
    });

    it('builds multi-hop corridor route through doorway, connector walkway and Campus Highway Network', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const westRoom = rooms[0]; // West room
      const pantryPos: [number, number, number] = [0, 0, 20];

      const route = buildCorridorRoute(crew[0].currentPos, pantryPos, westRoom);
      expect(route.length).toBeGreaterThanOrEqual(4);

      // Initial hops must safely exit desk into room aisle, then through room doorway
      expect(route[0][2]).toBeCloseTo(westRoom.centerPos[2]); // Safe departure into central aisle cz
      const hasDoorwayWaypoint = route.some((pt) => Math.abs(pt[0] - (westRoom.centerPos[0] + 7.5)) < 0.1);
      expect(hasDoorwayWaypoint).toBe(true);
      // Intermediate hop should transition onto Highway Corridor (x = -10.5 for West)
      const hasHighwayWaypoint = route.some((pt) => Math.abs(pt[0] - (-10.5)) < 0.2);
      expect(hasHighwayWaypoint).toBe(true);
      // South crossway hop to pantry entrance [0, 0, 18]
      const hasCrosswayEntrance = route.some((pt) => pt[0] === 0 && pt[2] === 18);
      expect(hasCrosswayEntrance).toBe(true);
      // Final hop should land at pantry destination
      const last = route[route.length - 1];
      expect(last[0]).toBe(pantryPos[0]);
      expect(last[2]).toBe(pantryPos[2]);
    });

    it('steers walking agents laterally to the right when meeting head-on (Keep-Right Rule)', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      // Agent 0 is walking South (facingAngleY = 0 -> forward vector [0, 1])
      crew[0].currentState = 'WALKING';
      crew[0].currentPos = [0, 0, 9.5];
      crew[0].targetPos = [0, 0, 15];
      crew[0].facingAngleY = 0; // facing +Z (South)

      // Agent 1 is walking North (facingAngleY = Math.PI -> forward vector [0, -1])
      crew[1].currentState = 'WALKING';
      crew[1].currentPos = [0, 0, 10.5];
      crew[1].targetPos = [0, 0, 5];
      crew[1].facingAngleY = Math.PI; // facing -Z (North)

      const { updatedCrew } = stepCrewMovement(crew, 0.01, Date.now());

      // Agent 0 (Southbound) should be steered to its right (+X / East)
      // Agent 1 (Northbound) should be steered to its right (-X / West)
      expect(updatedCrew[0].currentPos[0]).toBeGreaterThan(0);
      expect(updatedCrew[1].currentPos[0]).toBeLessThan(0);
      // Both agents should have distinct lateral paths, preventing 1D head-on stalemate
      expect(Math.abs(updatedCrew[0].currentPos[0] - updatedCrew[1].currentPos[0])).toBeGreaterThan(0.15);
    });

    it('routes pedestrians along open highway corridors and safe crossways without intersecting solid walls', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const westRoom = rooms[2]; // South-West room (Row 2, Z = 24)
      const pantryPos: [number, number, number] = [0, 0, 24];

      // Route going from South-West room towards Pantry
      const route = buildCorridorRoute(crew[10].currentPos, pantryPos, westRoom);

      // Verify that NO waypoint cuts through pantry_wall_west (minX: -6.7, maxX: -6.3, minZ: 18, maxZ: 30)
      route.forEach((pt) => {
        const inWallWest = pt[0] >= -6.7 && pt[0] <= -6.3 && pt[2] >= 18 && pt[2] <= 30;
        expect(inWallWest).toBe(false);
      });

      // Must safely enter from the North entrance (Z = 18, X = 0)
      const hasNorthEntrance = route.some((pt) => Math.abs(pt[0]) < 0.5 && Math.abs(pt[2] - 18) < 0.5);
      expect(hasNorthEntrance).toBe(true);
    });

    it('calculates deterministic lateral lane offset to stagger agents across corridor', () => {
      const offset1 = getAgentLaneOffset('crew_dompetnalar_planner');
      const offset2 = getAgentLaneOffset('crew_dompetnalar_developer');
      const offset3 = getAgentLaneOffset('crew_dompetnalar_tester');
      const offset4 = getAgentLaneOffset('crew_dompetnalar_reviewer');
      const offset5 = getAgentLaneOffset('crew_dompetnalar_publisher');

      const offsets = [offset1, offset2, offset3, offset4, offset5];
      // All offsets must be within [-0.8, 0.8]
      offsets.forEach((off) => {
        expect(off).toBeGreaterThanOrEqual(-0.8);
        expect(off).toBeLessThanOrEqual(0.8);
      });
      // Should have diverse lateral values (not all identical)
      const uniqueOffsets = new Set(offsets);
      expect(uniqueOffsets.size).toBeGreaterThan(1);
    });

    it('executes auto-unstuck recovery maneuver when agent is blocked for multiple frames', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const testObstacle = [
        { id: 'impassable_barrier', minX: -2, maxX: 2, minZ: 5, maxZ: 7 },
      ];

      crew[0].currentState = 'WALKING';
      crew[0].currentPos = [0, 0, 4.5]; // Right in front of barrier
      crew[0].targetPos = [0, 0, 6.0]; // Inside barrier
      crew[0].pathQueue = [[0, 0, 10]]; // Alternate path hop queued
      crew[0].stuckCounter = 24; // 1 frame away from threshold
      crew[0].lastPosSnapshot = [0, 0, 4.5];
      crew[0].lastTargetDist = 1.5;

      // Step simulation
      const { updatedCrew, arrivedLogs } = stepCrewMovement(crew, 0.05, Date.now(), testObstacle);

      // Should have triggered unstuck and advanced to next waypoint in pathQueue
      expect(updatedCrew[0].stuckCounter).toBe(0);
      expect(updatedCrew[0].targetPos).toEqual([0, 0, 10]);
      expect(arrivedLogs.some((l) => l.message.includes('memutar rute'))).toBe(true);
    });

    it('registers obstacle boxes for reception and pantry boundary walls', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const obstacles = generateCampusObstacles(rooms, crew);

      const requiredWallIds = [
        'reception_wall_back',
        'reception_wall_west',
        'reception_wall_east',
        'pantry_wall_back',
        'pantry_wall_west',
        'pantry_wall_east',
      ];

      requiredWallIds.forEach((id) => {
        const obs = obstacles.find((o) => o.id === id);
        expect(obs, `Missing boundary wall ${id}`).toBeDefined();
      });
    });

    it('advances through pathQueue waypoints sequentially until final arrival', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      crew[0].currentPos = [0, 0, 0];
      crew[0].targetPos = [0.1, 0, 0.1]; // Close to arrival of hop 1
      crew[0].pathQueue = [[0, 0, 10], [5, 0, 10]];
      crew[0].currentState = 'WALKING';

      // Step movement — should advance to next hop in pathQueue
      const { updatedCrew } = stepCrewMovement(crew, 0.1, Date.now());
      expect(updatedCrew[0].targetPos).toEqual([0, 0, 10]);
      expect(updatedCrew[0].pathQueue).toEqual([[5, 0, 10]]);
      expect(updatedCrew[0].currentState).toBe('WALKING');
    });

    it('ensures workstation obstacle bounding box protects employee seating zone from others', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const obstacles = generateCampusObstacles(rooms, crew);

      crew.forEach((c) => {
        const deskBox = obstacles.find((o) => o.id === `desk_${c.id}`);
        expect(deskBox).toBeDefined();
        if (deskBox && c.seatedPos) {
          // Bounding box encompasses both desk and task chair
          expect(deskBox.maxZ).toBeGreaterThanOrEqual(c.seatedPos[2]);
          expect(deskBox.minZ).toBeLessThan(c.homeDeskPos[2]);
        }
      });
    });

    it('provisions office attires with natural hair colors and casual clothing for all crew members', () => {
      const { crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      expect(crew).toHaveLength(30);

      crew.forEach((c) => {
        expect(c.attire).toBeDefined();
        expect(c.attire.skinTone).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(c.attire.hairColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(c.attire.topColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(c.attire.pantsColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(c.attire.shoesColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      // Verify diversity of hair colors across the team
      const hairColors = new Set(crew.map((c) => c.attire.hairColor));
      expect(hairColors.size).toBeGreaterThanOrEqual(4);
    });

    it('registers obstacle boxes for collaboration lounge and pantry furniture', () => {
      const { rooms, crew } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const obstacles = generateCampusObstacles(rooms, crew);

      const requiredObstacleIds = [
        'lounge_coffee_table',
        'lounge_sofa_n',
        'lounge_sofa_s',
        'lounge_chair_w',
        'lounge_chair_e',
        'lounge_tv_unit',
        'pantry_counter_straight',
        'pantry_counter_sink',
        'pantry_table_round',
      ];

      requiredObstacleIds.forEach((id) => {
        const obs = obstacles.find((o) => o.id === id);
        expect(obs, `Missing obstacle ${id}`).toBeDefined();
      });
    });

    it('routes in-room movement through room aisles instead of diagonal straight lines', () => {
      const { rooms } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const room = rooms[0];
      const start: [number, number, number] = [room.centerPos[0] - 4.5, 0, room.centerPos[2] - 2.5];
      const target: [number, number, number] = [room.centerPos[0] + 4.5, 0, room.centerPos[2] + 2.5];

      const route = buildCorridorRoute(start, target, room);
      expect(route.length).toBeGreaterThanOrEqual(3);

      // Intermediate hop should route via room central aisle (x = room.centerPos[0])
      const hasAisleHop = route.some((pt) => Math.abs(pt[0] - room.centerPos[0]) < 0.1);
      expect(hasAisleHop).toBe(true);
    });
  });

  describe('5. Camera Transition & Focus Controller', () => {
    it('calculates correct focus coordinates for a selected room', () => {
      const { rooms } = provisionProcedural3DCampus(MOCK_PROJECTS);
      const focusState = calculateRoomFocusState(rooms[0]);

      expect(focusState.target).toEqual(rooms[0].cameraFocusPos);
      expect(focusState.distance).toBe(22);
    });

    it('interpolates smoothly between camera states', () => {
      const start = { ...CAMPUS_OVERVIEW_PRESET };
      const desired = {
        target: [10, 0, 10] as [number, number, number],
        orbitAngleHorizontal: 1.0,
        orbitAngleVertical: 0.5,
        distance: 25,
      };

      const next = stepCameraInterpolation(start, desired, 0.1);
      expect(next.distance).toBeLessThan(start.distance);
      expect(next.target[0]).toBeGreaterThan(start.target[0]);
    });

    it('computes valid 3D Cartesian coordinates from spherical orbit parameters', () => {
      const pos = computeCameraPosition(CAMPUS_OVERVIEW_PRESET);
      expect(pos).toHaveLength(3);
      expect(pos[1]).toBeGreaterThan(0); // Camera is above ground
    });
  });

  describe('6. Three.js Procedural Scene Assembly', () => {
    it('assembles a complete Three.js scene with meshes without crashing', () => {
      const assembled = assembleProcedural3DCampus(MOCK_PROJECTS);
      expect(assembled.scene).toBeDefined();
      expect(assembled.rooms).toHaveLength(6);
      expect(assembled.crew).toHaveLength(30);
      expect(assembled.crewMeshMap.size).toBe(30);
      expect(assembled.roomMeshMap.size).toBe(6);
    });

    it('synchronizes Three.js mesh positions with state updates', () => {
      const assembled = assembleProcedural3DCampus(MOCK_PROJECTS);
      assembled.crew[0].currentPos = [15, 0, 25];
      assembled.crew[0].isSleeping = true;

      syncCrewMeshes(assembled.crew, assembled.crewMeshMap);
      const mesh = assembled.crewMeshMap.get(assembled.crew[0].id);
      expect(mesh?.position.x).toBe(15);
      expect(mesh?.position.z).toBe(25);
      expect(mesh?.rotation.z).toBe(0.25); // sleepy tilt
    });
  });
});
