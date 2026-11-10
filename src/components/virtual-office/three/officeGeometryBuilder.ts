/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — OFFICE GEOMETRY BUILDER (THREE.JS PROCEDURAL)
 * 
 * Authentic KayKit CC0 Low-Poly Office Architecture:
 * 1. Unified Campus Ground Slab & Corridor Runners (Zero Blue Void)
 * 2. Distinct Thematic Room Styling (Fintech, Game Dev, Retail POS, Mining, SaaS)
 * 3. Ergonomic Workstations & Clean Non-overlapping Seating Grid
 * 4. Thematic Wall Props (Financial Charts TV, Arcade Dingdong, Kanban Board, Pickaxe Plaque)
 * ============================================================================
 */

import * as THREE from 'three';
import {
  DynamicProjectRoom3D,
  SharedFacility3D,
  Vector3Tuple,
} from '../../../types/virtualOffice3D';
import {
  PROJECT_THEMATIC_SPECS,
  ThematicRoomSpec,
} from '../../../types/virtualOfficeThemes';
import {
  createParquetFloorTexture,
  createOfficeTileTexture,
  createCarpetTexture,
  createCorridorRunnerTexture,
  createRoomSignageTexture,
  createWainscotingWallTexture,
  createAcousticSlatsWallTexture,
  getArchitecturalTexture,
} from './officeTextureGenerator';

/**
 * Palette of Warm Pastel & Studio Colors
 */
export const STUDIO_PALETTE = {
  floorWood: 0xd9b382,
  floorTrim: 0xb58b57,
  campusBaseSlab: 0x1e293b, // Deep modern slate foundation
  campusBaseBorder: 0x334155, // Clean architectural border
  corridorRunner: 0x0284c7, // Vibrant sky blue runner carpet
  corridorWood: 0xc49a6c,
  wallPastel: 0xf8fafc,
  wallAccent: 0xe2e8f0,
  wallGlass: 0x93c5fd,
  deskWood: 0xa87b51,
  deskLegs: 0x27272a,
  chairBlack: 0x18181b,
  laptopSilver: 0xcbd5e1,
  screenGlow: 0x38bdf8,
  sofaTeal: 0x0f766e,
  coffeeMaker: 0x18181b,
  coffeeMug: 0xfef08a,
  plantGreen: 0x15803d,
  potTerracotta: 0xc2410c,
  haloCyan: 0x22d3ee,
};

/**
 * Build Unified Campus Ground Platform & Corridors (Zero Blue Void)
 */
export function buildUnifiedCampusGround(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'unified_campus_foundation';

  // 1. Massive Solid Foundation Slab covering the whole campus
  // Campus spans from x: -38 to 38 (width ~76), z: -38 to 38 (depth ~76)
  const slabGeo = new THREE.BoxGeometry(82, 0.4, 82);
  const slabTex = createOfficeTileTexture('#1e293b', '#0f172a');
  const slabMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.campusBaseSlab });
  if (slabTex) slabMat.map = slabTex;
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.set(0, -0.3, 0);
  slab.receiveShadow = true;
  group.add(slab);

  // 1b. Foundation Edge Trim
  const borderGeo = new THREE.BoxGeometry(83, 0.15, 83);
  const borderMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.campusBaseBorder });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.set(0, -0.45, 0);
  group.add(border);

  // 2. Central Spine Corridor (North-South connecting Reception, Plaza, Pantry)
  const spineGeo = new THREE.BoxGeometry(10, 0.04, 66);
  const spineMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.set(0, -0.08, 0);
  spine.receiveShadow = true;
  group.add(spine);

  // 2b. Central Spine Carpet Runner with edge guide strips
  const runnerGeo = new THREE.BoxGeometry(4.5, 0.05, 62);
  const runnerTex = createCorridorRunnerTexture('#0284c7', '#38bdf8');
  const runnerMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.corridorRunner });
  if (runnerTex) runnerMat.map = runnerTex;
  const runner = new THREE.Mesh(runnerGeo, runnerMat);
  runner.position.set(0, -0.06, 0);
  group.add(runner);

  // 3. West & East Wing Connector Walkways (Connecting Spine to Project Rooms)
  const rows = [-20, 0, 20];
  rows.forEach((z) => {
    // West connector
    const westWalkGeo = new THREE.BoxGeometry(18, 0.04, 6);
    const westWalk = new THREE.Mesh(westWalkGeo, spineMat);
    westWalk.position.set(-13, -0.08, z);
    group.add(westWalk);

    // East connector
    const eastWalkGeo = new THREE.BoxGeometry(18, 0.04, 6);
    const eastWalk = new THREE.Mesh(eastWalkGeo, spineMat);
    eastWalk.position.set(13, -0.08, z);
    group.add(eastWalk);

    // Subtle guide lights along walkways
    const lightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const postMat = new THREE.MeshLambertMaterial({ color: 0x18181b });

    const createBollard = (x: number, bz: number) => {
      const bollard = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), postMat);
      post.position.y = 0.4;
      const glow = new THREE.Mesh(lightGeo, lightMat);
      glow.position.y = 0.8;
      bollard.add(post);
      bollard.add(glow);
      bollard.position.set(x, 0, bz);
      return bollard;
    };

    group.add(createBollard(-6, z - 3.2));
    group.add(createBollard(-6, z + 3.2));
    group.add(createBollard(6, z - 3.2));
    group.add(createBollard(6, z + 3.2));
  });

  return group;
}

/**
 * Build workstation furniture (Wooden desk, task chair, laptop, dual screens, coffee mug)
 */
export function buildWorkstationMesh(pos: Vector3Tuple, deskItemLabel: string): THREE.Group {
  const station = new THREE.Group();
  station.name = `workstation_${deskItemLabel.replace(/\s+/g, '_')}`;
  station.position.set(pos[0], pos[1], pos[2]);

  // 1. Desk Top
  const deskMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.deskWood });
  const topGeo = new THREE.BoxGeometry(2.4, 0.12, 1.3);
  const topMesh = new THREE.Mesh(topGeo, deskMat);
  topMesh.position.y = 0.85;
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  station.add(topMesh);

  // 2. Desk Legs (Sturdy metal modern frame)
  const legMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.deskLegs });
  const legGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
  const legPositions = [
    [-1.1, 0.425, -0.55],
    [1.1, 0.425, -0.55],
    [-1.1, 0.425, 0.55],
    [1.1, 0.425, 0.55],
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(lx, ly, lz);
    station.add(l);
  });

  // 3. Ergonomic Office Swivel Chair (Carefully positioned behind desk)
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 0.75); // 0.75m behind desk center

  const chairMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.chairBlack });
  const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.65), chairMat);
  seatMesh.position.y = 0.5; // Exactly comfortable seating height
  chairGroup.add(seatMesh);

  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.65, 0.08), chairMat);
  backMesh.position.set(0, 0.85, 0.32);
  chairGroup.add(backMesh);

  // Chair Base stem & castors
  const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), legMat);
  stemMesh.position.y = 0.25;
  chairGroup.add(stemMesh);

  const starBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 5), legMat);
  starBase.position.y = 0.04;
  chairGroup.add(starBase);

  station.add(chairGroup);

  // 4. Laptop / Work Computer
  const laptopMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.laptopSilver });
  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.38), laptopMat);
  laptopBase.position.set(0, 0.92, 0.05);
  station.add(laptopBase);

  // Glowing Screen (Tilted facing chair)
  const screenMat = new THREE.MeshBasicMaterial({ color: STUDIO_PALETTE.screenGlow });
  const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.03), screenMat);
  screenMesh.position.set(0, 1.1, -0.12);
  screenMesh.rotation.x = -Math.PI / 14;
  station.add(screenMesh);

  // 5. Desk Accessories
  // Coffee Mug
  const mugMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.coffeeMug });
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.13, 8), mugMat);
  mug.position.set(0.75, 0.98, 0.15);
  station.add(mug);

  // Mouse Pad & Optical Mouse
  const padMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.25), padMat);
  pad.position.set(0.55, 0.92, 0.15);
  station.add(pad);

  const mouseMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.1), mouseMat);
  mouse.position.set(0.55, 0.94, 0.15);
  station.add(mouse);

  return station;
}

/**
 * Build Thematic Props for Project Rooms (Candlestick TV, Arcade, POS, Kanban, Pickaxe)
 */
export function buildThematicRoomProps(room: DynamicProjectRoom3D): THREE.Group {
  const group = new THREE.Group();
  group.name = `thematic_props_${room.projectSlug}`;
  const slug = room.projectSlug.toLowerCase();
  const spec: ThematicRoomSpec = PROJECT_THEMATIC_SPECS[slug] || PROJECT_THEMATIC_SPECS['dompetnalar'];

  const backZ = room.bounds.minZ + 0.3;

  if (spec.style === 'FINTECH_METRIC') {
    // 1. Large Wall Mounted Financial Stock Chart TV Screen
    const tvGroup = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.4, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x09090b })
    );
    const display = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 2.2, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x022c22 }) // Deep matrix dark green
    );
    display.position.z = 0.08;
    tvGroup.add(frame);
    tvGroup.add(display);

    // Add Candlestick Bars on the TV screen
    const barColors = [0x10b981, 0x10b981, 0xef4444, 0x10b981, 0x10b981, 0x10b981];
    barColors.forEach((col, idx) => {
      const barH = 0.4 + (idx * 0.22) % 1.4;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, barH, 0.05),
        new THREE.MeshBasicMaterial({ color: col })
      );
      bar.position.set(-1.4 + idx * 0.55, -0.3 + barH / 2, 0.12);
      tvGroup.add(bar);
    });

    tvGroup.position.set(room.centerPos[0], 2.2, backZ);
    group.add(tvGroup);
  } else if (spec.style === 'GAME_DEV_CYBERPUNK') {
    // 2. Retro Arcade Machine Dingdong
    const arcade = new THREE.Group();
    const arcadeBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.8, 1.4),
      new THREE.MeshLambertMaterial({ color: 0x4c1d95 })
    );
    arcadeBody.position.y = 1.4;

    const arcadeScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.8, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xec4899 }) // Glowing hot pink 8-bit screen
    );
    arcadeScreen.position.set(0, 1.7, 0.7);
    arcadeScreen.rotation.x = -Math.PI / 10;

    const marquee = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }) // Cyan glowing marquee
    );
    marquee.position.set(0, 2.65, 0.65);

    arcade.add(arcadeBody);
    arcade.add(arcadeScreen);
    arcade.add(marquee);
    arcade.position.set(room.centerPos[0] + (room.wing === 'west' ? -6 : 6), 0, room.centerPos[2] - 3.5);
    arcade.rotation.y = room.wing === 'west' ? Math.PI / 4 : -Math.PI / 4;
    group.add(arcade);
  } else if (spec.style === 'RETAIL_STORE_POS') {
    // 3. Supermarket Mini Checkout Counter & POS Register
    const posStation = new THREE.Group();
    const counterDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.1, 1.4),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b }) // Amber checkout desk
    );
    counterDesk.position.y = 0.55;

    const cashRegister = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x1c1917 })
    );
    cashRegister.position.set(-0.6, 1.3, 0);

    const posDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    posDisplay.position.set(-0.6, 1.6, 0.2);

    posStation.add(counterDesk);
    posStation.add(cashRegister);
    posStation.add(posDisplay);
    posStation.position.set(room.centerPos[0] + (room.wing === 'west' ? -5.5 : 5.5), 0, room.centerPos[2] + 2.5);
    group.add(posStation);
  } else if (spec.style === 'MINING_INDUSTRIAL') {
    // 4. Mining Trophy & Gold Pickaxe Wall Plaque
    const plaque = new THREE.Group();
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.6, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x78350f }) // Walnut wood plaque
    );
    const pickHead = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.18, 0.12),
      new THREE.MeshLambertMaterial({ color: 0xfacc15 }) // Golden pickaxe head
    );
    const pickHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.2, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x451a03 })
    );
    pickHead.position.set(0, 0.2, 0.08);
    pickHandle.position.set(0, -0.2, 0.08);

    plaque.add(board);
    plaque.add(pickHead);
    plaque.add(pickHandle);
    plaque.position.set(room.centerPos[0], 2.2, backZ);
    group.add(plaque);
  } else if (spec.style === 'WORKSPACE_SCANDI') {
    // 5. Giant Agile Kanban Board on Wall with Colorful Sticky Notes
    const kanban = new THREE.Group();
    const boardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 2.2, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.9, 2.3, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xd97706 })
    );
    kanban.add(frameMesh);
    kanban.add(boardMesh);

    // Sticky Notes (Yellow, Pink, Cyan, Green)
    const noteColors = [0xfef08a, 0xf472b6, 0x38bdf8, 0x4ade80, 0xfef08a, 0xf472b6, 0x38bdf8];
    noteColors.forEach((nc, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const note = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.02),
        new THREE.MeshBasicMaterial({ color: nc })
      );
      note.position.set(-1.6 + col * 1.4, 0.4 - row * 0.6, 0.06);
      kanban.add(note);
    });

    kanban.position.set(room.centerPos[0], 2.2, backZ);
    group.add(kanban);
  }

  return group;
}

/**
 * Build dynamic room walls and floors with Thematic Styling, Architectural Walls,
 * Doorway Portals, and Illuminated 3D Project Signage Boards.
 */
export function buildRoomMesh(room: DynamicProjectRoom3D): THREE.Group {
  const group = new THREE.Group();
  group.name = room.roomId;

  const w = room.bounds.maxX - room.bounds.minX;
  const d = room.bounds.maxZ - room.bounds.minZ;

  const spec: ThematicRoomSpec =
    PROJECT_THEMATIC_SPECS[room.projectSlug.toLowerCase()] ||
    PROJECT_THEMATIC_SPECS['dompetnalar'];

  // 1. Procedural Textured Floor Tile (Poly Haven Architectural WebP or High-Detail Canvas)
  let floorTexture: THREE.Texture | null = null;
  const hexStr = `#${spec.floorColor.toString(16).padStart(6, '0')}`;
  const borderHexStr = `#${spec.floorBorderColor.toString(16).padStart(6, '0')}`;

  if (spec.style === 'FINTECH_METRIC') {
    floorTexture = getArchitecturalTexture(
      '/assets/virtual-office/textures/floors/terrazzo_modern.webp',
      4,
      4,
      () => createParquetFloorTexture(hexStr, borderHexStr, '#451a03')
    );
  } else if (spec.style === 'GAME_DEV_CYBERPUNK') {
    floorTexture = getArchitecturalTexture(
      '/assets/virtual-office/textures/floors/slate_tiles_dark.webp',
      4,
      4,
      () => createOfficeTileTexture('#2e1065', '#1e0845')
    );
  } else if (spec.style === 'RETAIL_STORE_POS') {
    floorTexture = getArchitecturalTexture(
      '/assets/virtual-office/textures/floors/parquet_herringbone.webp',
      4,
      4,
      () => createParquetFloorTexture(hexStr, '#92400e', '#451a03')
    );
  } else if (spec.style === 'MINING_INDUSTRIAL') {
    floorTexture = getArchitecturalTexture(
      '/assets/virtual-office/textures/floors/wood_plank_warm.webp',
      4,
      4,
      () => createOfficeTileTexture(hexStr, '#1c1917')
    );
  } else if (spec.style === 'WORKSPACE_SCANDI') {
    floorTexture = getArchitecturalTexture(
      '/assets/virtual-office/textures/floors/wood_laminate_light.webp',
      4,
      4,
      () => createParquetFloorTexture(hexStr, borderHexStr, '#451a03')
    );
  } else {
    floorTexture = getArchitecturalTexture(
      '/assets/virtual-office/textures/floors/parquet_herringbone.webp',
      4,
      4,
      () => createParquetFloorTexture(hexStr, borderHexStr, '#451a03')
    );
  }

  const floorMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  if (floorTexture) floorMat.map = floorTexture;
  else floorMat.color.setHex(spec.floorColor);

  const floorGeo = new THREE.BoxGeometry(w, 0.18, d);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(room.centerPos[0], -0.09, room.centerPos[2]);
  floor.receiveShadow = true;
  group.add(floor);

  // Thematic Floor Edge Trim
  const trimMat = new THREE.MeshLambertMaterial({ color: spec.floorBorderColor });
  const trimGeo = new THREE.BoxGeometry(w + 0.3, 0.1, d + 0.3);
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.set(room.centerPos[0], -0.18, room.centerPos[2]);
  group.add(trim);

  // 2. Full Architectural Office Walls (2.8m height with Wainscoting & Crown Trims)
  let wallTexture: THREE.Texture | null = null;
  if (spec.style === 'GAME_DEV_CYBERPUNK') {
    wallTexture = createAcousticSlatsWallTexture('#9333ea', '#09090b');
  } else if (spec.style === 'FINTECH_METRIC') {
    wallTexture = createWainscotingWallTexture('#f8fafc', '#0f172a', '#334155');
  } else if (spec.style === 'RETAIL_STORE_POS') {
    wallTexture = createWainscotingWallTexture('#fef3c7', '#78350f', '#b45309');
  } else if (spec.style === 'MINING_INDUSTRIAL') {
    wallTexture = createWainscotingWallTexture('#e7e5e4', '#1c1917', '#44403c');
  } else if (spec.style === 'WORKSPACE_SCANDI') {
    wallTexture = createWainscotingWallTexture('#f8fafc', '#475569', '#64748b');
  } else {
    wallTexture = createWainscotingWallTexture('#f8fafc', '#1e293b', '#334155');
  }

  const wallMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  if (wallTexture) {
    wallMat.map = wallTexture;
  } else {
    wallMat.color.setHex(spec.accentWallColor);
  }

  const wallHeight = 2.8;

  // 2a. Back Wall
  const backWallGeo = new THREE.BoxGeometry(w, wallHeight, 0.3);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(room.centerPos[0], wallHeight / 2, room.bounds.minZ);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Back Wall Baseboard Trim (Bottom)
  const baseboardGeo = new THREE.BoxGeometry(w, 0.22, 0.35);
  const baseboardMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
  baseboard.position.set(room.centerPos[0], 0.11, room.bounds.minZ);
  group.add(baseboard);

  // Back Wall Chair-Rail Trim (Moulding at 1.05m height)
  const chairRailGeo = new THREE.BoxGeometry(w, 0.1, 0.35);
  const chairRailMat = new THREE.MeshLambertMaterial({ color: spec.floorBorderColor });
  const chairRail = new THREE.Mesh(chairRailGeo, chairRailMat);
  chairRail.position.set(room.centerPos[0], 1.05, room.bounds.minZ);
  group.add(chairRail);

  // Back Wall Crown Moulding (Top)
  const crownGeo = new THREE.BoxGeometry(w, 0.12, 0.36);
  const crownMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.set(room.centerPos[0], 2.74, room.bounds.minZ);
  group.add(crown);

  // 2b. Outer Side Wall (Far edge opposite corridor)
  const sideX = room.wing === 'west' ? room.bounds.minX : room.bounds.maxX;
  const sideWallGeo = new THREE.BoxGeometry(0.3, wallHeight, d);
  const sideWall = new THREE.Mesh(sideWallGeo, wallMat);
  sideWall.position.set(sideX, wallHeight / 2, room.centerPos[2]);
  sideWall.receiveShadow = true;
  group.add(sideWall);

  // Side Wall Baseboard Trim
  const sideBaseboardGeo = new THREE.BoxGeometry(0.35, 0.22, d);
  const sideBaseboard = new THREE.Mesh(sideBaseboardGeo, baseboardMat);
  sideBaseboard.position.set(sideX, 0.11, room.centerPos[2]);
  group.add(sideBaseboard);

  // Side Wall Chair-Rail Trim
  const sideChairRailGeo = new THREE.BoxGeometry(0.35, 0.1, d);
  const sideChairRail = new THREE.Mesh(sideChairRailGeo, chairRailMat);
  sideChairRail.position.set(sideX, 1.05, room.centerPos[2]);
  group.add(sideChairRail);

  // 2c. Corridor Entry Wall with Center Doorway Opening (4.5m) and Glass Partitions
  const corridorX = room.wing === 'west' ? room.bounds.maxX : room.bounds.minX;
  const wallSegmentLength = (d - 4.5) / 2; // ~5.75m per side

  // North segment
  const northWallGeo = new THREE.BoxGeometry(0.3, wallHeight, wallSegmentLength);
  const northWall = new THREE.Mesh(northWallGeo, wallMat);
  northWall.position.set(corridorX, wallHeight / 2, room.bounds.minZ + wallSegmentLength / 2);
  group.add(northWall);

  // South segment
  const southWallGeo = new THREE.BoxGeometry(0.3, wallHeight, wallSegmentLength);
  const southWall = new THREE.Mesh(southWallGeo, wallMat);
  southWall.position.set(corridorX, wallHeight / 2, room.bounds.maxZ - wallSegmentLength / 2);
  group.add(southWall);

  // Doorway Lintel Beam (above 2.2m door opening)
  const lintelGeo = new THREE.BoxGeometry(0.35, 0.6, 4.6);
  const lintelMat = new THREE.MeshLambertMaterial({ color: 0x27272a });
  const lintel = new THREE.Mesh(lintelGeo, lintelMat);
  lintel.position.set(corridorX, 2.5, room.centerPos[2]);
  group.add(lintel);

  // Doorway Side Posts (Casing Frame)
  const postGeo = new THREE.BoxGeometry(0.38, 2.2, 0.18);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x27272a });
  const postNorth = new THREE.Mesh(postGeo, postMat);
  postNorth.position.set(corridorX, 1.1, room.centerPos[2] - 2.25);
  const postSouth = new THREE.Mesh(postGeo, postMat);
  postSouth.position.set(corridorX, 1.1, room.centerPos[2] + 2.25);
  group.add(postNorth);
  group.add(postSouth);

  // Modern Glass Partition Windows on North & South corridor walls
  const glassMat = new THREE.MeshLambertMaterial({
    color: STUDIO_PALETTE.wallGlass,
    transparent: true,
    opacity: 0.35,
  });
  const glassGeo = new THREE.BoxGeometry(0.08, 1.4, wallSegmentLength - 1.2);
  const glassNorth = new THREE.Mesh(glassGeo, glassMat);
  glassNorth.position.set(corridorX, 1.4, room.bounds.minZ + wallSegmentLength / 2);
  group.add(glassNorth);

  const glassSouth = new THREE.Mesh(glassGeo, glassMat);
  glassSouth.position.set(corridorX, 1.4, room.bounds.maxZ - wallSegmentLength / 2);
  group.add(glassSouth);

  // 3. 3D Illuminated Room Signage Board (Displaying Project Name & Role)
  const signTex = createRoomSignageTexture({
    title: room.projectName,
    subtitle: `${room.category} LAB`,
    accentColor: spec.neonAccentColor || 0x38bdf8,
    accentColorHex: borderHexStr,
  });

  const signBoardGeo = new THREE.BoxGeometry(0.12, 1.1, 4.2);
  const signBoardMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  if (signTex) signBoardMat.map = signTex;
  const signMesh = new THREE.Mesh(signBoardGeo, signBoardMat);
  signMesh.position.set(corridorX + (room.wing === 'west' ? 0.2 : -0.2), 3.2, room.centerPos[2]);
  group.add(signMesh);

  // Subtle LED Glow Light under the signboard
  const signLight = new THREE.PointLight(spec.neonAccentColor || 0x38bdf8, 0.8, 8);
  signLight.position.set(corridorX, 3.2, room.centerPos[2]);
  group.add(signLight);

  // 4. Add Thematic Interior Wall Props
  const thematicProps = buildThematicRoomProps(room);
  group.add(thematicProps);

  return group;
}

/**
 * Build Shared Facilities (Lobby, Lounge, Pantry) with Textured Surfaces
 */
export function buildSharedFacilitiesGroup(facilities: SharedFacility3D[]): THREE.Group {
  const group = new THREE.Group();

  facilities.forEach((fac) => {
    const w = fac.bounds.maxX - fac.bounds.minX;
    const d = fac.bounds.maxZ - fac.bounds.minZ;

    // Floor with procedural texture
    let facFloorTex: THREE.CanvasTexture | null = null;
    let baseCol = STUDIO_PALETTE.corridorWood;

    if (fac.facilityId === 'collaboration_plaza') {
      facFloorTex = createCarpetTexture('#0f766e', '#134e4a');
      baseCol = 0x0f766e;
    } else if (fac.facilityId === 'pantry_coffee_bar') {
      facFloorTex = createOfficeTileTexture('#334155', '#1e293b');
      baseCol = 0x334155;
    } else {
      facFloorTex = createOfficeTileTexture('#1e293b', '#0f172a');
      baseCol = 0x1e293b;
    }

    const floorMat = new THREE.MeshLambertMaterial({ color: baseCol });
    if (facFloorTex) floorMat.map = facFloorTex;
    const floorGeo = new THREE.BoxGeometry(w, 0.16, d);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(fac.centerPos[0], -0.08, fac.centerPos[2]);
    group.add(floor);

    // Collaboration Lounge Props
    if (fac.facilityId === 'collaboration_plaza') {
      const sofaMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.sofaTeal });
      const sofaGeo = new THREE.BoxGeometry(4.2, 0.6, 1.4);
      const sofa1 = new THREE.Mesh(sofaGeo, sofaMat);
      sofa1.position.set(0, 0.3, -3.5);
      const sofa2 = new THREE.Mesh(sofaGeo, sofaMat);
      sofa2.position.set(0, 0.3, 3.5);
      group.add(sofa1);
      group.add(sofa2);

      // Coffee Table in Plaza Center
      const tableMat = new THREE.MeshLambertMaterial({ color: 0x27272a });
      const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 2.4), tableMat);
      table.position.set(0, 0.22, 0);
      group.add(table);
    }

    // Pantry Props (Coffee maker counter)
    if (fac.facilityId === 'pantry_coffee_bar') {
      const counterMat = new THREE.MeshLambertMaterial({ color: 0x3f3f46 });
      const counter = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.1, 1.2), counterMat);
      counter.position.set(0, 0.55, fac.centerPos[2] + 2);
      group.add(counter);

      // Coffee Machine on Counter
      const machineMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.coffeeMaker });
      const machine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.7), machineMat);
      machine.position.set(0, 1.5, fac.centerPos[2] + 2);
      group.add(machine);
    }
  });

  return group;
}
