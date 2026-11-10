/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — COLLISION & AVOIDANCE SYSTEM (LAPIS 2)
 * 
 * Obstacle Bounding Box Sliding, Agent-to-Agent Separation (Boids),
 * and Walkable Campus Bounds Clamping.
 * ============================================================================
 */

import { ObstacleBox3D, ProjectCrewMember3D, Vector3Tuple } from '../../../types/virtualOffice3D';

/**
 * Check if a point (with given radius) intersects with an obstacle bounding box
 */
export function isPointInsideObstacle(
  x: number,
  z: number,
  box: ObstacleBox3D,
  radius: number = 0.4
): boolean {
  return (
    x + radius > box.minX &&
    x - radius < box.maxX &&
    z + radius > box.minZ &&
    z - radius < box.maxZ
  );
}

/**
 * Resolve collision against obstacle boxes with smooth wall-sliding behavior
 */
export function resolveObstacleCollision(
  currentPos: Vector3Tuple,
  nextPos: Vector3Tuple,
  obstacles: ObstacleBox3D[],
  radius: number = 0.4
): Vector3Tuple {
  let [targetX, targetY, targetZ] = nextPos;
  const [currX, , currZ] = currentPos;

  for (const box of obstacles) {
    if (isPointInsideObstacle(targetX, targetZ, box, radius)) {
      // Attempt sliding along X axis only (cancel Z movement)
      if (!isPointInsideObstacle(targetX, currZ, box, radius)) {
        targetZ = currZ;
      }
      // Attempt sliding along Z axis only (cancel X movement)
      else if (!isPointInsideObstacle(currX, targetZ, box, radius)) {
        targetX = currX;
      }
      // If both collide, push slightly away to closest box edge
      else {
        const distLeft = Math.abs((targetX + radius) - box.minX);
        const distRight = Math.abs((targetX - radius) - box.maxX);
        const distTop = Math.abs((targetZ + radius) - box.minZ);
        const distBottom = Math.abs((targetZ - radius) - box.maxZ);

        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        if (minDist === distLeft) targetX = box.minX - radius - 0.05;
        else if (minDist === distRight) targetX = box.maxX + radius + 0.05;
        else if (minDist === distTop) targetZ = box.minZ - radius - 0.05;
        else targetZ = box.maxZ + radius + 0.05;
      }
    }
  }

  // Campus Ground Boundary Clamp (-40 to 40 on X, -40 to 40 on Z)
  const clampedX = Math.max(-39, Math.min(39, targetX));
  const clampedZ = Math.max(-39, Math.min(39, targetZ));

  return [clampedX, targetY, clampedZ];
}

/**
 * Resolve Agent-to-Agent collisions using gentle repulsive separation force (Boids)
 */
export function resolveAgentCollisions(
  crewList: ProjectCrewMember3D[],
  minDistance: number = 0.75
): ProjectCrewMember3D[] {
  const count = crewList.length;
  if (count <= 1) return crewList;

  const result = crewList.map((c) => ({
    ...c,
    currentPos: [...c.currentPos] as Vector3Tuple,
  }));

  for (let i = 0; i < count; i++) {
    const a = result[i];
    // Don't displace crew members who are sitting at desk
    if (a.currentState === 'WORKING_AT_DESK' || a.currentState === 'SLEEPING') {
      continue;
    }

    for (let j = i + 1; j < count; j++) {
      const b = result[j];
      if (b.currentState === 'WORKING_AT_DESK' || b.currentState === 'SLEEPING') {
        continue;
      }

      const dx = a.currentPos[0] - b.currentPos[0];
      const dz = a.currentPos[2] - b.currentPos[2];
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistance * minDistance && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDistance - dist) * 0.5;
        const pushX = (dx / dist) * overlap;
        const pushZ = (dz / dist) * overlap;

        a.currentPos[0] += pushX;
        a.currentPos[2] += pushZ;
        b.currentPos[0] -= pushX;
        b.currentPos[2] -= pushZ;
      }
    }
  }

  return result;
}
