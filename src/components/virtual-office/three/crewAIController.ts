/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CREW AI CONTROLLER (LAPIS 2)
 * 
 * Multi-Agent Autonomous Random Wandering, Collision Avoidance, Waypoint Navigation,
 * State Machine Transitions, and Live Activity Logging.
 * ============================================================================
 */

import {
  ProjectCrewMember3D,
  StudioActivityLog,
  Vector3Tuple,
  ObstacleBox3D,
  DynamicProjectRoom3D,
  CrewAIState,
} from '../../../types/virtualOffice3D';
import {
  SHARED_FACILITIES,
  getInRoomWanderTargets,
  buildCorridorRoute,
} from '../../../data/virtualOffice3DConfig';
import { calculateGroundDistance } from './chatBubbleEngine';
import {
  resolveObstacleCollision,
  resolveAgentCollisions,
  getAgentLaneOffset,
} from './collisionSystem';

/**
 * Step crew positions towards their target position with collision resolution.
 */
export function stepCrewMovement(
  crewList: ProjectCrewMember3D[],
  deltaSeconds: number,
  now: number,
  obstacles: ObstacleBox3D[] = []
): { updatedCrew: ProjectCrewMember3D[]; arrivedLogs: StudioActivityLog[] } {
  const arrivedLogs: StudioActivityLog[] = [];
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let updatedCrew: ProjectCrewMember3D[] = crewList.map((crew): ProjectCrewMember3D => {
    if (!crew.targetPos) {
      return crew;
    }

    // Effective speed with speed buff consideration
    const isBuffed = now < crew.speedBuffUntil;
    const baseSpeed = crew.speed * (isBuffed ? 1.6 : 1.0);
    const stepDistance = baseSpeed * deltaSeconds;

    const current = crew.currentPos;
    const target = crew.targetPos;

    const dx = target[0] - current[0];
    const dz = target[2] - current[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance <= stepDistance || distance < 0.25) {
      // Arrived at current target waypoint
      const rawArrived: Vector3Tuple = [target[0], 0, target[2]];
      const arrivedPos: Vector3Tuple = obstacles.length > 0
        ? resolveObstacleCollision(current, rawArrived, obstacles)
        : rawArrived;

      // If there are more waypoints queued in the corridor route, advance to next hop
      if (crew.pathQueue && crew.pathQueue.length > 0) {
        const nextRawWaypoint = crew.pathQueue[0];
        const remainingQueue = crew.pathQueue.slice(1);

        // Apply dynamic lane offset along Highway Corridor & Crossways
        const laneOffset = getAgentLaneOffset(crew.id);
        const isHighway = Math.abs(Math.abs(nextRawWaypoint[0]) - 10.5) < 0.3;
        const isCrossway = Math.abs(Math.abs(nextRawWaypoint[2]) - 15.0) < 0.3;

        const nextWaypoint: Vector3Tuple = [
          isHighway ? nextRawWaypoint[0] + laneOffset : nextRawWaypoint[0],
          0,
          isCrossway ? nextRawWaypoint[2] + laneOffset * 0.4 : nextRawWaypoint[2],
        ];

        const nextFacing = Math.atan2(nextWaypoint[0] - arrivedPos[0], nextWaypoint[2] - arrivedPos[2]);
        return {
          ...crew,
          currentPos: arrivedPos,
          targetPos: nextWaypoint,
          pathQueue: remainingQueue,
          currentState: 'WALKING' as const,
          facingAngleY: nextFacing,
          stuckCounter: 0,
          lastTargetDist: calculateGroundDistance(arrivedPos, nextWaypoint),
        };
      }

      let nextState: CrewAIState = crew.currentState;
      let logMsg = '';
      let finalFacing = crew.facingAngleY;
      let finalPos = arrivedPos;

      if (crew.currentState === 'WALKING') {
        // Check if returned home to chair behind desk
        const targetChair = crew.seatedPos || [crew.homeDeskPos[0], 0, crew.homeDeskPos[2] + 0.75];
        const distToChair = calculateGroundDistance(arrivedPos, targetChair);

        if (distToChair < 0.6) {
          nextState = 'WORKING_AT_DESK';
          finalPos = [...targetChair];
          finalFacing = Math.PI; // Face forward towards computer screen
          logMsg = `Kembali ke meja kerja dan fokus melanjutkan tugas di ${crew.projectName}.`;
        } else {
          // Check if arrived at Pantry
          const distToPantry = calculateGroundDistance(arrivedPos, SHARED_FACILITIES[2].centerPos);
          if (distToPantry < 5) {
            nextState = 'AT_PANTRY';
            logMsg = `Tiba di Pantry untuk mengambil kopi / air minum.`;
          } else {
            // Check if arrived at Lounge
            const distToLounge = calculateGroundDistance(arrivedPos, SHARED_FACILITIES[1].centerPos);
            if (distToLounge < 5) {
              nextState = 'AT_LOUNGE';
              logMsg = `Duduk di Collaboration Lounge untuk beristirahat.`;
            } else {
              // In-room activity
              const dice = Math.random();
              if (dice < 0.35) {
                nextState = 'STRETCHING';
                logMsg = `Melakukan peregangan sejenak di ruang ${crew.projectName}.`;
              } else if (dice < 0.70) {
                nextState = 'INSPECTING_SCREEN';
                logMsg = `Memeriksa layar monitor / papan ide di ruang ${crew.projectName}.`;
              } else {
                nextState = 'CHATTING';
                logMsg = `Berdiskusi santai dengan rekan tim di ruang ${crew.projectName}.`;
              }
            }
          }
        }
      }

      if (logMsg) {
        arrivedLogs.push({
          id: `log_${now}_${crew.id}`,
          timestamp,
          projectId: crew.projectId,
          projectName: crew.projectName,
          crewName: crew.name,
          message: logMsg,
          type: 'movement',
        });
      }

      return {
        ...crew,
        currentPos: finalPos,
        targetPos: null,
        pathQueue: [],
        currentState: nextState,
        facingAngleY: finalFacing,
        currentActivityLog: logMsg || crew.currentActivityLog,
        stuckCounter: 0,
        lastPosSnapshot: [...finalPos],
        lastTargetDist: undefined,
      };
    }

    // True Target-Progress Anti-Stuck Tracking:
    // Measures whether the agent is actually reducing distance to destination.
    // Collision vibrations (0.06m) cannot bypass this sensor because distance to target remains stagnant.
    const currentDistToTarget = distance;
    let stuckCount = crew.stuckCounter || 0;
    const lastTargetDist = crew.lastTargetDist !== undefined ? crew.lastTargetDist : currentDistToTarget;
    const progressTowardsTarget = lastTargetDist - currentDistToTarget;

    // If agent made meaningful forward progress (> 0.02m) towards target, decrement stuck counter
    if (progressTowardsTarget > 0.02) {
      stuckCount = Math.max(0, stuckCount - 1);
    } else {
      stuckCount += 1;
    }

    // Auto-Unstuck Recovery: If stagnant or oscillating for >= 25 frames (~0.8 - 1.2s)
    if (stuckCount >= 25) {
      // 1. Advance to next hop in pathQueue if available
      if (crew.pathQueue && crew.pathQueue.length > 0) {
        const nextRawWaypoint = crew.pathQueue[0];
        const remainingQueue = crew.pathQueue.slice(1);

        const laneOffset = getAgentLaneOffset(crew.id);
        const isHighway = Math.abs(Math.abs(nextRawWaypoint[0]) - 10.5) < 0.3;
        const isCrossway = Math.abs(Math.abs(nextRawWaypoint[2]) - 15.0) < 0.3;

        const nextWaypoint: Vector3Tuple = [
          isHighway ? nextRawWaypoint[0] + laneOffset : nextRawWaypoint[0],
          0,
          isCrossway ? nextRawWaypoint[2] + laneOffset * 0.4 : nextRawWaypoint[2],
        ];

        const nextFacing = Math.atan2(nextWaypoint[0] - current[0], nextWaypoint[2] - current[2]);
        arrivedLogs.push({
          id: `log_unstuck_${now}_${crew.id}`,
          timestamp,
          projectId: crew.projectId,
          projectName: crew.projectName,
          crewName: crew.name,
          message: `${crew.name} memutar rute untuk melewati hambatan di ${crew.projectName}.`,
          type: 'movement',
        });
        return {
          ...crew,
          targetPos: nextWaypoint,
          pathQueue: remainingQueue,
          facingAngleY: nextFacing,
          stuckCounter: 0,
          lastPosSnapshot: [...current],
          lastTargetDist: calculateGroundDistance(current, nextWaypoint),
        };
      } else {
        // 2. Clear blocked target and redirect into open aisle / highway
        const escapeTarget: Vector3Tuple = [
          current[0] > 0 ? (current[0] > 13 ? current[0] - 1.5 : 10.5) : (current[0] < -13 ? current[0] + 1.5 : -10.5),
          0,
          current[2] + (dz >= 0 ? 1.5 : -1.5),
        ];
        arrivedLogs.push({
          id: `log_unstuck_${now}_${crew.id}`,
          timestamp,
          projectId: crew.projectId,
          projectName: crew.projectName,
          crewName: crew.name,
          message: `${crew.name} mengambil jalan memutar alternatif di ${crew.projectName}.`,
          type: 'movement',
        });
        return {
          ...crew,
          targetPos: escapeTarget,
          stuckCounter: 0,
          lastPosSnapshot: [...current],
          lastTargetDist: calculateGroundDistance(current, escapeTarget),
        };
      }
    }

    // Move towards target
    const ratio = stepDistance / distance;
    const rawNextX = current[0] + dx * ratio;
    const rawNextZ = current[2] + dz * ratio;
    const facingAngleY = Math.atan2(dx, dz);

    // Exclude own workstation collider for the assigned employee (they cannot collide with their own desk)
    const effectiveObstacles = obstacles.filter((obs) => obs.id !== `desk_${crew.id}`);

    // Apply obstacle collision and sliding
    const resolvedPos = effectiveObstacles.length > 0
      ? resolveObstacleCollision(current, [rawNextX, 0, rawNextZ], effectiveObstacles)
      : ([rawNextX, 0, rawNextZ] as Vector3Tuple);

    return {
      ...crew,
      currentPos: resolvedPos,
      facingAngleY,
      stuckCounter: stuckCount,
      lastPosSnapshot: (now % 1000 < 100) ? [...resolvedPos] : (crew.lastPosSnapshot || current),
      lastTargetDist: currentDistToTarget,
    };
  });

  // Apply agent-to-agent separation with psychological personal space radius & lateral steering
  updatedCrew = resolveAgentCollisions(updatedCrew, 1.35);

  return { updatedCrew, arrivedLogs };
}

/**
 * Multi-Agent Decision Making: Periodically allow multiple crew members across
 * different rooms to decide their next autonomous activity.
 */
export function evaluateRandomDecisions(
  crewList: ProjectCrewMember3D[],
  now: number,
  rooms: DynamicProjectRoom3D[] = []
): { updatedCrew: ProjectCrewMember3D[]; decisionLogs: StudioActivityLog[] } {
  const updatedCrew = crewList.map((c) => ({ ...c }));
  const decisionLogs: StudioActivityLog[] = [];
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Group crew by project so every room gets a chance to be lively
  const projectGroups = new Map<string, ProjectCrewMember3D[]>();
  updatedCrew.forEach((c) => {
    const list = projectGroups.get(c.projectId) || [];
    list.push(c);
    projectGroups.set(c.projectId, list);
  });

  // Evaluate 1 candidate per project group to ensure active life across the entire campus
  projectGroups.forEach((groupCrew, projectId) => {
    // Filter candidates that are not currently walking
    const idleCandidates = groupCrew.filter((c) => c.targetPos === null);
    if (idleCandidates.length === 0) return;

    // Pick 1 candidate in this room
    const candidate = idleCandidates[Math.floor(Math.random() * idleCandidates.length)];
    const matchingRoom = rooms.find((r) => r.projectId === projectId);

    // 1. If currently at desk -> 45% chance to do something (walk in-room, visit pantry/lounge, or stretch)
    if (candidate.currentState === 'WORKING_AT_DESK') {
      const dice = Math.random();

      if (dice < 0.08) {
        // Doze off / take a micro nap
        candidate.currentState = 'SLEEPING';
        candidate.isSleeping = true;
        candidate.currentActivityLog = 'Tertidur sejenak karena lelah kompilasi build...';
        decisionLogs.push({
          id: `log_${now}_${candidate.id}`,
          timestamp,
          projectId: candidate.projectId,
          projectName: candidate.projectName,
          crewName: candidate.name,
          message: `Tertidur sejenak di meja kerja (${candidate.projectName}).`,
          type: 'work',
        });
      } else if (dice < 0.35 && matchingRoom) {
        // In-room activity (walk to whiteboard, inspect screen, or stretch via structured room aisles)
        const inRoomTargets = getInRoomWanderTargets(matchingRoom);
        const target = inRoomTargets[Math.floor(Math.random() * inRoomTargets.length)];
        const inRoomRoute = buildCorridorRoute(candidate.currentPos, target, matchingRoom);

        candidate.currentState = 'WALKING';
        candidate.targetPos = [...inRoomRoute[0]];
        candidate.pathQueue = inRoomRoute.slice(1);
        candidate.isSleeping = false;
        candidate.currentActivityLog = `Bangkit dari meja untuk berkeliling di ruang ${candidate.projectName}`;

        decisionLogs.push({
          id: `log_${now}_${candidate.id}`,
          timestamp,
          projectId: candidate.projectId,
          projectName: candidate.projectName,
          crewName: candidate.name,
          message: `Berdiri meregangkan badan dan berkeliling di ruang ${candidate.projectName}.`,
          type: 'movement',
        });
      } else if (dice < 0.55) {
        // Go to Pantry or Collaboration Lounge via safe corridor route
        const destination = Math.random() < 0.55 ? SHARED_FACILITIES[2] : SHARED_FACILITIES[1]; // Pantry or Plaza
        const waypoints = destination.waypoints;
        const targetPoint = waypoints[Math.floor(Math.random() * waypoints.length)];

        const route = buildCorridorRoute(candidate.currentPos, targetPoint, matchingRoom);
        candidate.currentState = 'WALKING';
        candidate.targetPos = [...route[0]];
        candidate.pathQueue = route.slice(1);
        candidate.isSleeping = false;
        const destName = destination.facilityId === 'pantry_coffee_bar' ? 'Pantry Kopi' : 'Collaboration Lounge';
        candidate.currentActivityLog = `Berjalan menuju ${destName}`;

        decisionLogs.push({
          id: `log_${now}_${candidate.id}`,
          timestamp,
          projectId: candidate.projectId,
          projectName: candidate.projectName,
          crewName: candidate.name,
          message: `Meninggalkan meja untuk pergi ke ${destName}.`,
          type: 'movement',
        });
      }
    }
    // 2. If currently doing in-room activities or at Pantry/Lounge -> 70% chance to return to desk
    else if (
      candidate.currentState === 'AT_PANTRY' ||
      candidate.currentState === 'AT_LOUNGE' ||
      candidate.currentState === 'STRETCHING' ||
      candidate.currentState === 'INSPECTING_SCREEN' ||
      candidate.currentState === 'CHATTING'
    ) {
      if (Math.random() < 0.70) {
        const chairTarget = candidate.seatedPos || [candidate.homeDeskPos[0], 0, candidate.homeDeskPos[2] + 0.75];
        const route = buildCorridorRoute(candidate.currentPos, chairTarget, matchingRoom);
        candidate.currentState = 'WALKING';
        candidate.targetPos = [...route[0]];
        candidate.pathQueue = route.slice(1);
        candidate.currentActivityLog = `Kembali ke ruang kerja ${candidate.projectName}`;

        decisionLogs.push({
          id: `log_${now}_${candidate.id}`,
          timestamp,
          projectId: candidate.projectId,
          projectName: candidate.projectName,
          crewName: candidate.name,
          message: `Selesai istirahat dan berjalan kembali ke ruang ${candidate.projectName}.`,
          type: 'movement',
        });
      }
    }
  });

  return { updatedCrew, decisionLogs };
}
