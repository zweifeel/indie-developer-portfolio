/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PROCEDURAL CAMPUS BUILDER (LAPIS 2)
 * 
 * Dynamic Three.js Scene Assembler:
 * 1. Spawns Unified Campus Foundation Slab & Corridors (Zero Blue Void)
 * 2. Spawns Thematic Rooms with Distinct Wall Props & Color Schemes
 * 3. Provisions 5 Human Crew Workstations per Room with Non-overlapping Seating
 * ============================================================================
 */

import * as THREE from 'three';
import type { Project } from '../../../types/project';
import {
  DynamicProjectRoom3D,
  ProjectCrewMember3D,
} from '../../../types/virtualOffice3D';
import {
  SHARED_FACILITIES,
  provisionProcedural3DCampus,
} from '../../../data/virtualOffice3DConfig';
import {
  buildUnifiedCampusGround,
  buildRoomMesh,
  buildWorkstationMesh,
  buildSharedFacilitiesGroup,
} from './officeGeometryBuilder';

export interface Assembled3DCampus {
  scene: THREE.Scene;
  rooms: DynamicProjectRoom3D[];
  crew: ProjectCrewMember3D[];
  crewMeshMap: Map<string, THREE.Group>;
  roomMeshMap: Map<string, THREE.Group>;
}

/**
 * Assemble a complete Three.js campus scene dynamically from projects
 */
export function assembleProcedural3DCampus(projects: readonly Project[] | Project[]): Assembled3DCampus {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f1d); // Deep elegant night slate

  // 1. Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xfffbeb, 0.95); // Warm cozy ambient light
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
  dirLight.position.set(30, 50, 25);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 150;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  scene.add(dirLight);

  // Soft cyan rim light from front-left
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
  rimLight.position.set(-25, 25, -20);
  scene.add(rimLight);

  // Warm amber soft fill light from back-right
  const fillLight = new THREE.DirectionalLight(0xfef08a, 0.3);
  fillLight.position.set(20, 20, 30);
  scene.add(fillLight);

  // 2. Unified Solid Campus Foundation Slab & Corridors (Eliminates All Blue Voids)
  const campusGround = buildUnifiedCampusGround();
  scene.add(campusGround);

  // 3. Shared Facilities (Lobby, Collaboration Plaza, Pantry)
  const sharedGroup = buildSharedFacilitiesGroup(SHARED_FACILITIES);
  scene.add(sharedGroup);

  // 4. Procedural Thematic Rooms & Workstations
  const { rooms, crew } = provisionProcedural3DCampus(projects);
  const crewMeshMap = new Map<string, THREE.Group>();
  const roomMeshMap = new Map<string, THREE.Group>();

  // Add Rooms & Workstations
  rooms.forEach((room) => {
    const roomMesh = buildRoomMesh(room);
    scene.add(roomMesh);
    roomMeshMap.set(room.projectId, roomMesh);

    // Add workstations for assigned crew members
    const roomCrew = crew.filter((c) => c.projectId === room.projectId);
    roomCrew.forEach((c) => {
      const station = buildWorkstationMesh(c.homeDeskPos, c.deskItem);
      scene.add(station);
    });
  });

  // 5. Add Crew Anchor Nodes (to host KayKit character models and animations)
  crew.forEach((c) => {
    const crewAnchor = new THREE.Group();
    crewAnchor.name = `crew_anchor_${c.id}`;
    // Position character seated on the chair, facing the desk & laptop
    crewAnchor.position.set(c.currentPos[0], c.currentPos[1], c.currentPos[2]);
    crewAnchor.rotation.y = c.facingAngleY;
    scene.add(crewAnchor);
    crewMeshMap.set(c.id, crewAnchor);
  });

  return {
    scene,
    rooms,
    crew,
    crewMeshMap,
    roomMeshMap,
  };
}

/**
 * Synchronize Three.js mesh positions with state data in animation frame
 */
export function syncCrewMeshes(
  crewList: ProjectCrewMember3D[],
  meshMap: Map<string, THREE.Group>
): void {
  crewList.forEach((c) => {
    const mesh = meshMap.get(c.id);
    if (mesh) {
      mesh.position.set(c.currentPos[0], c.currentPos[1], c.currentPos[2]);
      mesh.rotation.y = c.facingAngleY;

      // Subtle sleeping head tilt
      if (c.isSleeping) {
        mesh.rotation.z = 0.25; // tilted sleepy head
      } else {
        mesh.rotation.z = 0;
      }
    }
  });
}
