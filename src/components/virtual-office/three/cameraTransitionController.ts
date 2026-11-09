/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CAMERA TRANSITION CONTROLLER (LAPIS 2)
 * 
 * Smooth Lerp Interpolations between Full Campus Overview and
 * Focused Project Room Viewport.
 * ============================================================================
 */

import { Vector3Tuple, DynamicProjectRoom3D } from '../../../types/virtualOffice3D';

export interface CameraState {
  target: Vector3Tuple;
  orbitAngleHorizontal: number; // yaw in radians
  orbitAngleVertical: number; // pitch in radians
  distance: number; // camera distance from target
}

export const CAMPUS_OVERVIEW_PRESET: CameraState = {
  target: [0, 0, 0],
  orbitAngleHorizontal: Math.PI / 4, // 45 degrees isometric
  orbitAngleVertical: Math.PI / 5, // ~36 degrees pitch
  distance: 65,
};

export const ROOM_FOCUS_DISTANCE = 22;
export const ROOM_FOCUS_PITCH = Math.PI / 4.5;

/**
 * Linear interpolation helper
 */
export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

export function lerpVector3(
  start: Vector3Tuple,
  end: Vector3Tuple,
  alpha: number
): Vector3Tuple {
  return [
    lerp(start[0], end[0], alpha),
    lerp(start[1], end[1], alpha),
    lerp(start[2], end[2], alpha),
  ];
}

/**
 * Calculates target camera state for a focused project room
 */
export function calculateRoomFocusState(room: DynamicProjectRoom3D): CameraState {
  // Angle slightly faces the room entrance
  const yaw = room.wing === 'west' ? Math.PI / 3.5 : (Math.PI * 2) / 3;

  return {
    target: [...room.cameraFocusPos],
    orbitAngleHorizontal: yaw,
    orbitAngleVertical: ROOM_FOCUS_PITCH,
    distance: ROOM_FOCUS_DISTANCE,
  };
}

/**
 * Step camera state towards desired state with damping
 */
export function stepCameraInterpolation(
  current: CameraState,
  desired: CameraState,
  alpha: number = 0.08
): CameraState {
  const target = lerpVector3(current.target, desired.target, alpha);
  const orbitAngleHorizontal = lerp(current.orbitAngleHorizontal, desired.orbitAngleHorizontal, alpha);
  const orbitAngleVertical = lerp(current.orbitAngleVertical, desired.orbitAngleVertical, alpha);
  const distance = lerp(current.distance, desired.distance, alpha);

  return {
    target,
    orbitAngleHorizontal,
    orbitAngleVertical,
    distance,
  };
}

/**
 * Compute 3D Cartesian position from orbit spherical parameters
 */
export function computeCameraPosition(state: CameraState): Vector3Tuple {
  const y = state.target[1] + state.distance * Math.sin(state.orbitAngleVertical);
  const horizontalRadius = state.distance * Math.cos(state.orbitAngleVertical);
  const x = state.target[0] + horizontalRadius * Math.sin(state.orbitAngleHorizontal);
  const z = state.target[2] + horizontalRadius * Math.cos(state.orbitAngleHorizontal);

  return [x, y, z];
}
