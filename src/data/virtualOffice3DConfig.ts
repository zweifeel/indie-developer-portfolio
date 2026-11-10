/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE 3D CONFIGURATION
 * 
 * Shared Campus Facilities, Waypoint Network, and Procedural Room Generator.
 * ============================================================================
 */

import {
  SharedFacility3D,
  DynamicProjectRoom3D,
  ProjectCrewMember3D,
  Vector3Tuple,
  HumanAttire3D,
  CoreCrewRole,
} from '../types/virtualOffice3D';
import type { Project } from '../types/project';
import { CANONICAL_PROJECT_SEEDS } from './virtualOfficePresets';

/**
 * 3 Shared Facilities in Center & Amenities Wings
 */
export const SHARED_FACILITIES: SharedFacility3D[] = [
  {
    facilityId: 'reception',
    name: 'Lobi Utama & Resepsionis',
    centerPos: [0, 0, -22],
    bounds: { minX: -8, maxX: 8, minZ: -28, maxZ: -16 },
    waypoints: [
      [0, 0, -24],
      [-4, 0, -20],
      [4, 0, -20],
      [0, 0, -16],
    ],
  },
  {
    facilityId: 'collaboration_plaza',
    name: 'Collaboration Lounge & Sofa Diskusi',
    centerPos: [0, 0, 0],
    bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
    waypoints: [
      [-4, 0, -4],
      [4, 0, -4],
      [-4, 0, 4],
      [4, 0, 4],
      [0, 0, 0],
    ],
  },
  {
    facilityId: 'pantry_coffee_bar',
    name: 'Pantry Bersama & Coffee Bar',
    centerPos: [0, 0, 22],
    bounds: { minX: -8, maxX: 8, minZ: 16, maxZ: 28 },
    waypoints: [
      [-3, 0, 20],
      [3, 0, 20],
      [-3, 0, 24],
      [3, 0, 24],
    ],
  },
];

/**
 * Common Walkway Corridor Waypoints (connecting west rooms, center, and east rooms)
 */
export const CAMPUS_CORRIDOR_WAYPOINTS: Vector3Tuple[] = [
  [-13, 0, -20],
  [-13, 0, 0],
  [-13, 0, 20],
  [0, 0, -20],
  [0, 0, 0],
  [0, 0, 20],
  [13, 0, -20],
  [13, 0, 0],
  [13, 0, 20],
];

/**
 * Pre-defined Stylized Human Attires for Roles
 */
export const ROLE_ATTIRES: Record<CoreCrewRole, HumanAttire3D> = {
  PLANNER: {
    skinTone: '#e0ac69',
    hairColor: '#2b1d14',
    hairStyle: 'short_neat',
    topType: 'shirt_tie',
    topColor: '#38bdf8', // Light blue oxford shirt
    accentColor: '#1e3a8a',
    pantsColor: '#d4b996',
    shoesColor: '#3b2f2f',
    accessory: 'lanyard_id',
  },
  DEVELOPER: {
    skinTone: '#fcd34d',
    hairColor: '#18181b',
    hairStyle: 'side_part',
    topType: 'polo_cardigan',
    topColor: '#f4f4f5', // White polo
    accentColor: '#3f3f46', // Charcoal cardigan
    pantsColor: '#1e293b',
    shoesColor: '#09090b',
    accessory: 'headphones',
  },
  TESTER: {
    skinTone: '#fed7aa',
    hairColor: '#7c2d12',
    hairStyle: 'curly_top',
    topType: 'blazer_casual',
    topColor: '#18181b',
    accentColor: '#14b8a6', // Sage green blazer
    pantsColor: '#334155',
    shoesColor: '#0f172a',
    accessory: 'glasses',
  },
  REVIEWER: {
    skinTone: '#d97706',
    hairColor: '#1c1917',
    hairStyle: 'bob_cut',
    topType: 'vest_formal',
    topColor: '#ffffff',
    accentColor: '#1e40af', // Navy vest
    pantsColor: '#1e293b',
    shoesColor: '#451a03',
    accessory: 'lanyard_id',
  },
  PUBLISHER: {
    skinTone: '#fde68a',
    hairColor: '#451a03',
    hairStyle: 'short_neat',
    topType: 'shirt_tie',
    topColor: '#f8fafc',
    accentColor: '#dc2626',
    pantsColor: '#0f172a',
    shoesColor: '#18181b',
    accessory: 'glasses',
  },
};

/**
 * Canonical Crew Names by Role and Project index
 */
const CANONICAL_NAMES: Record<CoreCrewRole, string[]> = {
  PLANNER: ['Budi', 'Dimas', 'Adit', 'Fajar', 'Surya', 'Rama', 'Gilang', 'Bayu'],
  DEVELOPER: ['Reza', 'Rian', 'Fauzan', 'Taufik', 'Iqbal', 'Farhan', 'Hendra', 'Eko'],
  TESTER: ['Kevin', 'Riko', 'Andre', 'Bagas', 'Doni', 'Wisnu', 'Daffa', 'Yogi'],
  REVIEWER: ['Dewi', 'Siti', 'Maya', 'Nadia', 'Rina', 'Putri', 'Tania', 'Ayu'],
  PUBLISHER: ['Hartono', 'Gunawan', 'Wijaya', 'Salim', 'Kusuma', 'Santoso', 'Pratama', 'Wibowo'],
};

const DESK_ITEMS: Record<CoreCrewRole, string> = {
  PLANNER: 'Dual 4K Roadmap Display',
  DEVELOPER: 'IDE & Local Test Array',
  TESTER: 'Android Test Dock & Biometrics',
  REVIEWER: 'Code Quality & Privacy Checklist',
  PUBLISHER: 'Google Play Console Dashboard',
};

/**
 * Calculates coordinates for procedural room placement.
 * Even indices placed on West Wing (x < 0), Odd indices placed on East Wing (x > 0).
 */
export function calculateRoomCoordinates(index: number): {
  wing: 'west' | 'east';
  centerPos: Vector3Tuple;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  cameraFocusPos: Vector3Tuple;
} {
  const isWest = index % 2 === 0;
  const row = Math.floor(index / 2);
  const x = isWest ? -26 : 26;
  const z = -20 + row * 20;

  return {
    wing: isWest ? 'west' : 'east',
    centerPos: [x, 0, z],
    bounds: {
      minX: x - 10,
      maxX: x + 10,
      minZ: z - 8,
      maxZ: z + 8,
    },
    cameraFocusPos: [x, 0, z],
  };
}

/**
 * Generate dynamic rooms and their 5 assigned human crew members
 * based on ANY list of projects (from projects.json or CMS).
 */
export function provisionProcedural3DCampus(projects?: readonly Project[] | Project[]): {
  rooms: DynamicProjectRoom3D[];
  crew: ProjectCrewMember3D[];
} {
  const effectiveProjects = (projects && projects.length > 0) ? projects : (CANONICAL_PROJECT_SEEDS as unknown as Project[]);
  const rooms: DynamicProjectRoom3D[] = [];
  const crew: ProjectCrewMember3D[] = [];

  const roles: CoreCrewRole[] = ['PLANNER', 'DEVELOPER', 'TESTER', 'REVIEWER', 'PUBLISHER'];

  effectiveProjects.forEach((proj, pIndex) => {
    const { wing, centerPos, bounds, cameraFocusPos } = calculateRoomCoordinates(pIndex);
    const assignedCrewIds: string[] = [];

    // 5 Desks layout inside room: 3 along back wall, 2 in front (generously spaced)
    const deskOffsets: Array<[number, number]> = [
      [-5.0, -2.5], // Desk 0: Planner
      [0.0, -2.5],  // Desk 1: Developer
      [5.0, -2.5],  // Desk 2: Tester
      [-3.2, 2.5],  // Desk 3: Reviewer
      [3.2, 2.5],   // Desk 4: Publisher
    ];

    roles.forEach((role, rIndex) => {
      const crewId = `crew_${proj.id}_${role.toLowerCase()}`;
      assignedCrewIds.push(crewId);

      const [offX, offZ] = deskOffsets[rIndex];
      const homeDeskPos: Vector3Tuple = [
        centerPos[0] + offX,
        0,
        centerPos[2] + offZ,
      ];

      // Seated position on the chair behind the desk
      const seatedPos: Vector3Tuple = [
        centerPos[0] + offX,
        0,
        centerPos[2] + offZ + 0.75,
      ];

      const namesPool = CANONICAL_NAMES[role];
      const name = namesPool[pIndex % namesPool.length];

      crew.push({
        id: crewId,
        projectId: proj.id,
        projectSlug: proj.slug,
        projectName: proj.name,
        name,
        displayName: `${name} (${role})`,
        role,
        attire: ROLE_ATTIRES[role],
        deskIndex: rIndex,
        homeDeskPos,
        currentPos: [...seatedPos],
        targetPos: null,
        facingAngleY: Math.PI, // Facing forward towards desk and laptop
        currentState: 'WORKING_AT_DESK',
        speed: 2.2,
        deskItem: DESK_ITEMS[role],
        currentActivityLog: `Bekerja pada modul ${proj.name}`,
        isSleeping: false,
        speedBuffUntil: 0,
        activeChatBubble: null,
      });
    });

    rooms.push({
      roomId: `room_${proj.id}`,
      projectId: proj.id,
      projectSlug: proj.slug,
      projectName: proj.name,
      category: proj.category,
      status: proj.status,
      roomIndex: pIndex,
      wing,
      centerPos,
      bounds,
      cameraFocusPos,
      cameraFocusZoom: 2.4,
      assignedCrewIds,
    });
  });

  return { rooms, crew };
}
