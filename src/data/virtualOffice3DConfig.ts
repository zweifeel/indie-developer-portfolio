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
  ObstacleBox3D,
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
    centerPos: [0, 0, -20],
    bounds: { minX: -6.5, maxX: 6.5, minZ: -26, maxZ: -14 },
    waypoints: [
      [0, 0, -22],
      [-3, 0, -18],
      [3, 0, -18],
      [0, 0, -15],
    ],
  },
  {
    facilityId: 'collaboration_plaza',
    name: 'Collaboration Lounge & Sofa Diskusi',
    centerPos: [0, 0, 0],
    bounds: { minX: -6.5, maxX: 6.5, minZ: -6.5, maxZ: 6.5 },
    waypoints: [
      [-2.5, 0, -2.5],
      [2.5, 0, -2.5],
      [-2.5, 0, 2.5],
      [2.5, 0, 2.5],
      [0, 0, 0],
    ],
  },
  {
    facilityId: 'pantry_coffee_bar',
    name: 'Pantry Bersama & Coffee Bar',
    centerPos: [0, 0, 20],
    bounds: { minX: -6.5, maxX: 6.5, minZ: 14, maxZ: 26 },
    waypoints: [
      [-2.5, 0, 18],
      [2.5, 0, 18],
      [-2.5, 0, 22],
      [2.5, 0, 22],
    ],
  },
];

/**
 * Common Walkway Corridor Waypoints (connecting west rooms, center, and east rooms)
 */
export const CAMPUS_CORRIDOR_WAYPOINTS: Vector3Tuple[] = [
  [-9, 0, -20],
  [-9, 0, 0],
  [-9, 0, 20],
  [0, 0, -20],
  [0, 0, 0],
  [0, 0, 20],
  [9, 0, -20],
  [9, 0, 0],
  [9, 0, 20],
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

export const PERSONAL_SPACE_RADIUS = 0.9;
export const PERSONAL_COLLISION_DISTANCE = 1.15;

/**
 * Build safe multi-hop corridor routes between rooms and shared campus facilities
 * to guarantee crew NEVER step onto unpaved edges or void.
 */
export function buildCorridorRoute(
  startPos: Vector3Tuple,
  destPos: Vector3Tuple,
  room?: DynamicProjectRoom3D
): Vector3Tuple[] {
  const dx = destPos[0] - startPos[0];
  const dz = destPos[2] - startPos[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (!room || dist < 3.0) {
    return [[destPos[0], 0, destPos[2]]];
  }

  const [cx, , cz] = room.centerPos;
  const isWest = room.wing === 'west';
  // Doorway is on the corridor wall side (inner edge of the room)
  const insideDoorX = isWest ? cx + 7.5 : cx - 7.5;
  const outsideDoorX = isWest ? cx + 9.5 : cx - 9.5;

  const isInsideRoom = isWest ? startPos[0] < cx + 8.5 : startPos[0] > cx - 8.5;
  const isDestInsideRoom = (isWest ? destPos[0] < cx + 8.5 : destPos[0] > cx - 8.5) &&
    Math.abs(destPos[2] - cz) < 7.0;

  if (isInsideRoom && isDestInsideRoom) {
    return [[destPos[0], 0, destPos[2]]];
  }

  const route: Vector3Tuple[] = [];

  if (isInsideRoom) {
    // 1. Move to doorway inside room
    route.push([insideDoorX, 0, cz]);
    // 2. Step outside door onto the connector walkway
    route.push([outsideDoorX, 0, cz]);
    // 3. Move towards central spine
    route.push([0, 0, cz]);
    // 4. Move along central spine to destination Z
    route.push([0, 0, destPos[2]]);
    // 5. Final step into destination
    route.push([destPos[0], 0, destPos[2]]);
  } else {
    // Returning from shared facility (Lounge/Pantry/Spine) into room
    // 1. Move along central spine to room connector row Z
    route.push([0, 0, cz]);
    // 2. Move along connector walkway to outside doorway
    route.push([outsideDoorX, 0, cz]);
    // 3. Step through doorway into room
    route.push([insideDoorX, 0, cz]);
    // 4. If destination is chair (behind desk), first approach from aisle
    if (Math.abs(destPos[0] - cx) > 1.0) {
      route.push([destPos[0], 0, destPos[2] + 0.65]);
    }
    // 5. Final step into chair / seatedPos
    route.push([destPos[0], 0, destPos[2]]);
  }

  return route;
}

/**
 * Generate in-room wander destinations for autonomous crew activities
 */
export function getInRoomWanderTargets(room: DynamicProjectRoom3D): Vector3Tuple[] {
  const [cx, , cz] = room.centerPos;
  return [
    [cx - 4.5, 0, cz + 1.2], // near side prop / sofa
    [cx + 4.5, 0, cz + 1.2], // near arcade / showcase
    [cx, 0, cz],             // room center meeting zone
    [cx - 2.0, 0, cz + 3.8], // front left near corridor entry
    [cx + 2.0, 0, cz + 3.8], // front right near corridor entry
    [cx, 0, cz - 3.8],       // near back wall kanban / display
  ];
}

/**
 * Generate 3D Obstacle Bounding Boxes for Workstations, Walls, and Lounge to prevent clipping
 */
export function generateCampusObstacles(
  rooms: DynamicProjectRoom3D[],
  crew: ProjectCrewMember3D[]
): ObstacleBox3D[] {
  const obstacles: ObstacleBox3D[] = [];

  // 1. Workstations (Full Workstation Footprint covering desk AND task chair)
  crew.forEach((c) => {
    const [hx, , hz] = c.homeDeskPos;
    obstacles.push({
      id: `desk_${c.id}`,
      minX: hx - 1.25,
      maxX: hx + 1.25,
      minZ: hz - 0.70,
      maxZ: hz + 1.15, // Encompasses task chair to protect employee personal workspace
    });
  });

  // 2. Room Back and Outer Walls
  rooms.forEach((r) => {
    const cz = r.centerPos[2];
    // Back wall
    obstacles.push({
      id: `wall_back_${r.roomId}`,
      minX: r.bounds.minX,
      maxX: r.bounds.maxX,
      minZ: r.bounds.minZ - 0.3,
      maxZ: r.bounds.minZ + 0.3,
    });

    // Outer side wall
    if (r.wing === 'west') {
      obstacles.push({
        id: `wall_west_${r.roomId}`,
        minX: r.bounds.minX - 0.3,
        maxX: r.bounds.minX + 0.3,
        minZ: r.bounds.minZ,
        maxZ: r.bounds.maxZ,
      });
    } else {
      obstacles.push({
        id: `wall_east_${r.roomId}`,
        minX: r.bounds.maxX - 0.3,
        maxX: r.bounds.maxX + 0.3,
        minZ: r.bounds.minZ,
        maxZ: r.bounds.maxZ,
      });
    }

    // Inner corridor wall with doorway opening at center Z
    const doorX = r.wing === 'west' ? r.bounds.maxX : r.bounds.minX;
    obstacles.push({
      id: `wall_inner_n_${r.roomId}`,
      minX: doorX - 0.3,
      maxX: doorX + 0.3,
      minZ: r.bounds.minZ,
      maxZ: cz - 1.6,
    });
    obstacles.push({
      id: `wall_inner_s_${r.roomId}`,
      minX: doorX - 0.3,
      maxX: doorX + 0.3,
      minZ: cz + 1.6,
      maxZ: r.bounds.maxZ,
    });
  });

  // 3. Central Collaboration Lounge Glass Partition Walls (bounds: minX: -6.5, maxX: 6.5, minZ: -6.5, maxZ: 6.5)
  // North wall with door opening at x: -1.8 to 1.8
  obstacles.push({ id: 'lounge_wall_n1', minX: -6.5, maxX: -1.8, minZ: -6.7, maxZ: -6.3 });
  obstacles.push({ id: 'lounge_wall_n2', minX: 1.8, maxX: 6.5, minZ: -6.7, maxZ: -6.3 });
  // South wall with door opening at x: -1.8 to 1.8
  obstacles.push({ id: 'lounge_wall_s1', minX: -6.5, maxX: -1.8, minZ: 6.3, maxZ: 6.7 });
  obstacles.push({ id: 'lounge_wall_s2', minX: 1.8, maxX: 6.5, minZ: 6.3, maxZ: 6.7 });
  // West wall with door opening at z: -1.8 to 1.8
  obstacles.push({ id: 'lounge_wall_w1', minX: -6.7, maxX: -6.3, minZ: -6.5, maxZ: -1.8 });
  obstacles.push({ id: 'lounge_wall_w2', minX: -6.7, maxX: -6.3, minZ: 1.8, maxZ: 6.5 });
  // East wall with door opening at z: -1.8 to 1.8
  obstacles.push({ id: 'lounge_wall_e1', minX: 6.3, maxX: 6.7, minZ: -6.5, maxZ: -1.8 });
  obstacles.push({ id: 'lounge_wall_e2', minX: 6.3, maxX: 6.7, minZ: 1.8, maxZ: 6.5 });

  return obstacles;
}

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
  const x = isWest ? -18 : 18;
  const z = -20 + row * 20;

  return {
    wing: isWest ? 'west' : 'east',
    centerPos: [x, 0, z],
    bounds: {
      minX: x - 9,
      maxX: x + 9,
      minZ: z - 7.5,
      maxZ: z + 7.5,
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
        seatedPos: [...seatedPos],
        currentPos: [...seatedPos],
        targetPos: null,
        pathQueue: [],
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
