/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PROCEDURAL CAMPUS BUILDER (LAPIS 2)
 * 
 * Dynamic Three.js Scene Assembler: Spawns rooms for ANY project count,
 * provisions 5 human crew members per project, and manages mesh nodes.
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
  buildRoomMesh,
  buildWorkstationMesh,
  buildKayKitHumanMesh,
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
  scene.background = new THREE.Color(0x0f172a); // Deep modern slate slate-900

  // 1. Lighting
  const ambientLight = new THREE.AmbientLight(0xfffbeb, 0.9); // Warm cozy ambient
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(25, 45, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  // Soft cyan rim light from front
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
  rimLight.position.set(-20, 20, -15);
  scene.add(rimLight);

  // 2. Shared Facilities (Lobby, Collaboration Plaza, Pantry)
  const sharedGroup = buildSharedFacilitiesGroup(SHARED_FACILITIES);
  scene.add(sharedGroup);

  // 3. Procedural Rooms & Crew
  const { rooms, crew } = provisionProcedural3DCampus(projects);
  const crewMeshMap = new Map<string, THREE.Group>();
  const roomMeshMap = new Map<string, THREE.Group>();

  // Add Rooms & Workstations
  rooms.forEach((room) => {
    const roomMesh = buildRoomMesh(room);
    scene.add(roomMesh);
    roomMeshMap.set(room.projectId, roomMesh);

    // Add workstations for assigned crew
    const roomCrew = crew.filter((c) => c.projectId === room.projectId);
    roomCrew.forEach((c) => {
      const station = buildWorkstationMesh(c.homeDeskPos, c.deskItem);
      scene.add(station);
    });
  });

  // Add Human Characters
  crew.forEach((c) => {
    const humanMesh = buildKayKitHumanMesh(c);
    humanMesh.position.set(c.currentPos[0], c.currentPos[1], c.currentPos[2]);
    humanMesh.rotation.y = c.facingAngleY;
    scene.add(humanMesh);
    crewMeshMap.set(c.id, humanMesh);
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

      // Gentle breathing idle / sleeping head tilt
      if (c.isSleeping) {
        mesh.rotation.z = 0.25; // tilted sleepy head
      } else {
        mesh.rotation.z = 0;
      }
    }
  });
}
