/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — OFFICE GEOMETRY BUILDER (THREE.JS PROCEDURAL)
 * 
 * Kay Lousberg (KayKit CC0) Aesthetic Low-Poly Humans, Furniture,
 * Dynamic Campus Rooms, and Visual Props.
 * ============================================================================
 */

import * as THREE from 'three';
import {
  DynamicProjectRoom3D,
  ProjectCrewMember3D,
  SharedFacility3D,
  Vector3Tuple,
} from '../../../types/virtualOffice3D';

/**
 * Palette of Warm Pastel & Studio Colors
 */
export const STUDIO_PALETTE = {
  floorWood: 0xd9b382,
  floorTrim: 0xb58b57,
  corridorWood: 0xc49a6c,
  wallPastel: 0xf3f4f6,
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
 * Build a modular low-poly human character in Kay Lousberg style
 */
export function buildKayKitHumanMesh(crew: ProjectCrewMember3D): THREE.Group {
  const group = new THREE.Group();
  group.name = `human_${crew.id}`;

  const attire = crew.attire;
  const skinMat = new THREE.MeshLambertMaterial({ color: attire.skinTone });
  const hairMat = new THREE.MeshLambertMaterial({ color: attire.hairColor });
  const topMat = new THREE.MeshLambertMaterial({ color: attire.topColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: attire.pantsColor });
  const shoesMat = new THREE.MeshLambertMaterial({ color: attire.shoesColor });

  // 1. Torso / Shirt
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.8, 0.45);
  const torsoMesh = new THREE.Mesh(torsoGeo, topMat);
  torsoMesh.position.y = 0.9;
  torsoMesh.castShadow = true;
  group.add(torsoMesh);

  // 1b. Attire Details (Tie, Cardigan/Blazer, or Vest)
  if (attire.accentColor) {
    const accentMat = new THREE.MeshLambertMaterial({ color: attire.accentColor });
    if (attire.topType === 'shirt_tie') {
      // Tie strip
      const tieGeo = new THREE.BoxGeometry(0.12, 0.45, 0.05);
      const tieMesh = new THREE.Mesh(tieGeo, accentMat);
      tieMesh.position.set(0, 0.95, 0.24);
      group.add(tieMesh);
    } else if (attire.topType === 'polo_cardigan' || attire.topType === 'blazer_casual') {
      // Open cardigan / blazer lapels
      const lapelLeftGeo = new THREE.BoxGeometry(0.18, 0.8, 0.06);
      const lapelRightGeo = new THREE.BoxGeometry(0.18, 0.8, 0.06);
      const lapelL = new THREE.Mesh(lapelLeftGeo, accentMat);
      const lapelR = new THREE.Mesh(lapelRightGeo, accentMat);
      lapelL.position.set(-0.25, 0.9, 0.22);
      lapelR.position.set(0.25, 0.9, 0.22);
      group.add(lapelL);
      group.add(lapelR);
    }
  }

  // 2. Head (Rounded Stylized Cube / Beveled)
  const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.5);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.y = 1.6;
  headMesh.castShadow = true;
  group.add(headMesh);

  // 2b. Cute Eyes (Stylized dots)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.14, 1.62, 0.26);
  rightEye.position.set(0.14, 1.62, 0.26);
  group.add(leftEye);
  group.add(rightEye);

  // 3. Hair Style
  const hairGeo = new THREE.BoxGeometry(0.58, 0.25, 0.54);
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.position.set(0, 1.85, -0.02);
  group.add(hairMesh);

  // 4. Accessories
  if (attire.accessory === 'glasses') {
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const glassBridge = new THREE.BoxGeometry(0.44, 0.12, 0.08);
    const glassMesh = new THREE.Mesh(glassBridge, glassMat);
    glassMesh.position.set(0, 1.62, 0.27);
    group.add(glassMesh);
  } else if (attire.accessory === 'headphones') {
    const phoneMat = new THREE.MeshLambertMaterial({ color: 0xe11d48 });
    const band = new THREE.BoxGeometry(0.68, 0.1, 0.3);
    const bandMesh = new THREE.Mesh(band, phoneMat);
    bandMesh.position.set(0, 1.25, 0.05);
    group.add(bandMesh);
  } else if (attire.accessory === 'lanyard_id') {
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const badgeGeo = new THREE.BoxGeometry(0.15, 0.2, 0.04);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0, 0.72, 0.25);
    group.add(badgeMesh);
  }

  // 5. Arms
  const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  const leftArm = new THREE.Mesh(armGeo, topMat);
  const rightArm = new THREE.Mesh(armGeo, topMat);
  leftArm.position.set(-0.48, 0.85, 0);
  rightArm.position.set(0.48, 0.85, 0);
  group.add(leftArm);
  group.add(rightArm);

  // 6. Legs & Pants
  const legGeo = new THREE.BoxGeometry(0.25, 0.5, 0.25);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.18, 0.25, 0);
  rightLeg.position.set(0.18, 0.25, 0);
  group.add(leftLeg);
  group.add(rightLeg);

  // 7. Shoes
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.12, 0.32);
  const leftShoe = new THREE.Mesh(shoeGeo, shoesMat);
  const rightShoe = new THREE.Mesh(shoeGeo, shoesMat);
  leftShoe.position.set(-0.18, 0.06, 0.03);
  rightShoe.position.set(0.18, 0.06, 0.03);
  group.add(leftShoe);
  group.add(rightShoe);

  return group;
}

/**
 * Build workstation furniture (Wooden desk, task chair, laptop, monitor)
 */
export function buildWorkstationMesh(pos: Vector3Tuple, _deskItemLabel: string): THREE.Group {
  const station = new THREE.Group();
  station.position.set(pos[0], pos[1], pos[2]);

  // Desk Top
  const deskMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.deskWood });
  const topGeo = new THREE.BoxGeometry(2.4, 0.12, 1.2);
  const topMesh = new THREE.Mesh(topGeo, deskMat);
  topMesh.position.y = 0.9;
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  station.add(topMesh);

  // Desk Legs
  const legMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.deskLegs });
  const legGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1);
  const legPositions = [
    [-1.1, 0.45, -0.5],
    [1.1, 0.45, -0.5],
    [-1.1, 0.45, 0.5],
    [1.1, 0.45, 0.5],
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const l = new THREE.Mesh(legGeo, legMat);
    l.position.set(lx, ly, lz);
    station.add(l);
  });

  // Chair
  const chairMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.chairBlack });
  const seatGeo = new THREE.BoxGeometry(0.7, 0.1, 0.7);
  const seatMesh = new THREE.Mesh(seatGeo, chairMat);
  seatMesh.position.set(0, 0.55, 0.8);
  station.add(seatMesh);

  const backGeo = new THREE.BoxGeometry(0.7, 0.7, 0.1);
  const backMesh = new THREE.Mesh(backGeo, chairMat);
  backMesh.position.set(0, 0.95, 1.12);
  station.add(backMesh);

  // Laptop
  const laptopMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.laptopSilver });
  const laptopBaseGeo = new THREE.BoxGeometry(0.6, 0.04, 0.4);
  const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
  laptopBase.position.set(0, 0.98, 0.1);
  station.add(laptopBase);

  // Glowing Screen
  const screenMat = new THREE.MeshBasicMaterial({ color: STUDIO_PALETTE.screenGlow });
  const screenGeo = new THREE.BoxGeometry(0.56, 0.38, 0.04);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, 1.2, -0.1);
  screenMesh.rotation.x = -Math.PI / 12;
  station.add(screenMesh);

  // Coffee Mug
  const mugMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.coffeeMug });
  const mugGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
  const mug = new THREE.Mesh(mugGeo, mugMat);
  mug.position.set(0.75, 1.04, 0.2);
  station.add(mug);

  return station;
}

/**
 * Build dynamic room walls and floors
 */
export function buildRoomMesh(room: DynamicProjectRoom3D): THREE.Group {
  const group = new THREE.Group();
  group.name = room.roomId;

  const w = room.bounds.maxX - room.bounds.minX;
  const d = room.bounds.maxZ - room.bounds.minZ;

  // Parquet Floor Tile
  const floorMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.floorWood });
  const floorGeo = new THREE.BoxGeometry(w, 0.2, d);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(room.centerPos[0], -0.1, room.centerPos[2]);
  floor.receiveShadow = true;
  group.add(floor);

  // Floor Edge Trim
  const trimMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.floorTrim });
  const trimGeo = new THREE.BoxGeometry(w + 0.4, 0.1, d + 0.4);
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.set(room.centerPos[0], -0.2, room.centerPos[2]);
  group.add(trim);

  // Low Isometric Half-Walls (Outer edges only so interior is easily visible)
  const wallMat = new THREE.MeshLambertMaterial({ color: STUDIO_PALETTE.wallPastel });
  const wallHeight = 2.4;

  // Back Wall
  const backWallGeo = new THREE.BoxGeometry(w, wallHeight, 0.3);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(room.centerPos[0], wallHeight / 2, room.bounds.minZ);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Side Wall (Far edge)
  const sideX = room.wing === 'west' ? room.bounds.minX : room.bounds.maxX;
  const sideWallGeo = new THREE.BoxGeometry(0.3, wallHeight, d);
  const sideWall = new THREE.Mesh(sideWallGeo, wallMat);
  sideWall.position.set(sideX, wallHeight / 2, room.centerPos[2]);
  sideWall.receiveShadow = true;
  group.add(sideWall);

  return group;
}

/**
 * Build Shared Facilities (Lobby, Lounge, Pantry)
 */
export function buildSharedFacilitiesGroup(facilities: SharedFacility3D[]): THREE.Group {
  const group = new THREE.Group();

  facilities.forEach((fac) => {
    const w = fac.bounds.maxX - fac.bounds.minX;
    const d = fac.bounds.maxZ - fac.bounds.minZ;

    // Floor
    const floorMat = new THREE.MeshLambertMaterial({
      color: fac.facilityId === 'collaboration_plaza' ? 0x0f766e : STUDIO_PALETTE.corridorWood,
    });
    const floorGeo = new THREE.BoxGeometry(w, 0.18, d);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(fac.centerPos[0], -0.09, fac.centerPos[2]);
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
