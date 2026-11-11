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

  // Campus Ground Boundary Clamp (-30 to 30 on X, -30 to 30 on Z for compact campus)
  const clampedX = Math.max(-30, Math.min(30, targetX));
  const clampedZ = Math.max(-30, Math.min(30, targetZ));

  return [clampedX, targetY, clampedZ];
}

/**
 * Calculate deterministic lateral lane offset based on agent ID (-0.8m to +0.8m)
 * Ensures crew members travelling along the same campus corridor walk side-by-side
 * across the 4-meter wide highway rather than lining up in a single-file conga line.
 */
export function getAgentLaneOffset(agentId: string): number {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = (hash * 31 + agentId.charCodeAt(i)) | 0;
  }
  const laneIndex = Math.abs(hash) % 5; // 0, 1, 2, 3, 4
  return (laneIndex - 2) * 0.4; // -0.8, -0.4, 0.0, +0.4, +0.8
}

/**
 * Resolve Agent-to-Agent collisions using personal space repulsion & lateral steering
 * - Walking agents maintain 1.35m personal space from other walking agents (softened in rooms)
 * - Head-on encounters apply lateral "Keep-Right" steering force to pass smoothly without deadlock
 * - Same-direction encounters apply lateral lane diversion to prevent single-file conga lines
 * - Walking agents maintain 1.25m clearance from seated agents (cannot walk through seated crew)
 * - Seated crew members remain firmly anchored to their chairs
 */
export function resolveAgentCollisions(
  crewList: ProjectCrewMember3D[],
  minDistance: number = 1.35
): ProjectCrewMember3D[] {
  const count = crewList.length;
  if (count <= 1) return crewList;

  const result = crewList.map((c) => ({
    ...c,
    currentPos: [...c.currentPos] as Vector3Tuple,
  }));

  const SEATED_SAFE_DISTANCE = 1.25;

  for (let i = 0; i < count; i++) {
    const a = result[i];
    // Seated crew members are firmly anchored to their chairs
    if (a.currentState === 'WORKING_AT_DESK' || a.currentState === 'SLEEPING') {
      continue;
    }

    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const b = result[j];

      const dx = a.currentPos[0] - b.currentPos[0];
      const dz = a.currentPos[2] - b.currentPos[2];
      const distSq = dx * dx + dz * dz;

      // Interaction with seated agent: walking agent receives 100% of deflection force
      if (b.currentState === 'WORKING_AT_DESK' || b.currentState === 'SLEEPING') {
        if (distSq < SEATED_SAFE_DISTANCE * SEATED_SAFE_DISTANCE && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const push = SEATED_SAFE_DISTANCE - dist;
          a.currentPos[0] += (dx / dist) * push;
          a.currentPos[2] += (dz / dist) * push;
        }
        continue;
      }

      // Determine effective personal space distance:
      // Inside project rooms (Math.abs(x) > 13), use gentle personal space (0.95m)
      // to prevent bouncing agents into desk colliders.
      const isInRoom = Math.abs(a.currentPos[0]) > 13.0 || Math.abs(b.currentPos[0]) > 13.0;
      const effectiveMinDist = isInRoom ? 0.95 : minDistance;

      // Interaction between two walking agents (i < j to avoid duplicate processing)
      if (i < j && distSq < effectiveMinDist * effectiveMinDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);

        // Calculate heading vectors based on facing angles
        const fAx = Math.sin(a.facingAngleY);
        const fAz = Math.cos(a.facingAngleY);
        const fBx = Math.sin(b.facingAngleY);
        const fBz = Math.cos(b.facingAngleY);

        // Dot product of forward headings to test for counter-directional (head-on) encounters
        const headingDot = fAx * fBx + fAz * fBz;

        if (headingDot < -0.2) {
          // Head-on / counter-flow encounter: apply Keep-Right Lateral Steering
          // Right-hand normal vector for agent A: (fAz, -fAx)
          // Right-hand normal vector for agent B: (fBz, -fBx)
          const lateralStrength = (effectiveMinDist - dist) * 0.45;

          a.currentPos[0] += fAz * lateralStrength;
          a.currentPos[2] += -fAx * lateralStrength;

          b.currentPos[0] += fBz * lateralStrength;
          b.currentPos[2] += -fBx * lateralStrength;

          // Gentle radial damping to avoid clipping while lateral steering takes effect
          if (dist < 0.6) {
            const radialPush = (0.6 - dist) * 0.25;
            a.currentPos[0] += (dx / dist) * radialPush;
            a.currentPos[2] += (dz / dist) * radialPush;
            b.currentPos[0] -= (dx / dist) * radialPush;
            b.currentPos[2] -= (dz / dist) * radialPush;
          }
        } else if (headingDot > 0.5 && !isInRoom) {
          // Same-direction tandem flow on campus corridors:
          // Apply lateral lane diversion to break up single-file conga lines
          const laneDiff = getAgentLaneOffset(a.id) - getAgentLaneOffset(b.id);
          const lateralDir = laneDiff !== 0 ? Math.sign(laneDiff) : 1;
          const lateralOvertake = (effectiveMinDist - dist) * 0.35;

          a.currentPos[0] += fAz * lateralOvertake * lateralDir;
          a.currentPos[2] += -fAx * lateralOvertake * lateralDir;

          b.currentPos[0] -= fBz * lateralOvertake * lateralDir;
          b.currentPos[2] -= -fBx * lateralOvertake * lateralDir;

          // Light radial separation
          const overlap = (effectiveMinDist - dist) * 0.25;
          a.currentPos[0] += (dx / dist) * overlap;
          a.currentPos[2] += (dz / dist) * overlap;
          b.currentPos[0] -= (dx / dist) * overlap;
          b.currentPos[2] -= (dz / dist) * overlap;
        } else {
          // Converging encounter: Standard soft radial boids separation
          const factor = isInRoom ? 0.35 : 0.5;
          const overlap = (effectiveMinDist - dist) * factor;
          const pushX = (dx / dist) * overlap;
          const pushZ = (dz / dist) * overlap;

          a.currentPos[0] += pushX;
          a.currentPos[2] += pushZ;
          b.currentPos[0] -= pushX;
          b.currentPos[2] -= pushZ;
        }
      }
    }
  }

  return result;
}
