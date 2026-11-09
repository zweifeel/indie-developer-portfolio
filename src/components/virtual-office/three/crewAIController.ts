/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CREW AI CONTROLLER (LAPIS 2)
 * 
 * Autonomous Random Wandering, Waypoint Navigation, State Machine Transitions,
 * and Live Activity Logging.
 * ============================================================================
 */

import {
  ProjectCrewMember3D,
  StudioActivityLog,
  Vector3Tuple,
} from '../../../types/virtualOffice3D';
import {
  SHARED_FACILITIES,
} from '../../../data/virtualOffice3DConfig';
import { calculateGroundDistance } from './chatBubbleEngine';

/**
 * Step crew positions towards their target position.
 */
export function stepCrewMovement(
  crewList: ProjectCrewMember3D[],
  deltaSeconds: number,
  now: number
): { updatedCrew: ProjectCrewMember3D[]; arrivedLogs: StudioActivityLog[] } {
  const arrivedLogs: StudioActivityLog[] = [];
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const updatedCrew = crewList.map((crew) => {
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

    if (distance <= stepDistance || distance < 0.2) {
      // Arrived at target
      const arrivedPos: Vector3Tuple = [target[0], 0, target[2]];
      let nextState = crew.currentState;
      let logMsg = '';

      if (crew.currentState === 'WALKING') {
        // Check if returned home to desk
        const distToHome = calculateGroundDistance(arrivedPos, crew.homeDeskPos);
        if (distToHome < 0.5) {
          nextState = 'WORKING_AT_DESK';
          logMsg = `Kembali ke meja kerja dan fokus melanjutkan tugas di ${crew.projectName}.`;
        } else {
          // Arrived at destination facility
          const distToPantry = calculateGroundDistance(arrivedPos, SHARED_FACILITIES[2].centerPos);
          if (distToPantry < 8) {
            nextState = 'AT_PANTRY';
            logMsg = `Tiba di Pantry untuk mengambil kopi / air minum.`;
          } else {
            nextState = 'AT_LOUNGE';
            logMsg = `Duduk di Collaboration Lounge untuk beristirahat.`;
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
        currentPos: arrivedPos,
        targetPos: null,
        currentState: nextState,
        currentActivityLog: logMsg || crew.currentActivityLog,
      };
    }

    // Move towards target
    const ratio = stepDistance / distance;
    const nextX = current[0] + dx * ratio;
    const nextZ = current[2] + dz * ratio;
    const facingAngleY = Math.atan2(dx, dz);

    return {
      ...crew,
      currentPos: [nextX, 0, nextZ] as Vector3Tuple,
      facingAngleY,
    };
  });

  return { updatedCrew, arrivedLogs };
}

/**
 * Periodically pick a crew member at random to change state / wander or return home.
 */
export function evaluateRandomDecisions(
  crewList: ProjectCrewMember3D[],
  now: number
): { updatedCrew: ProjectCrewMember3D[]; decisionLogs: StudioActivityLog[] } {
  const updatedCrew = crewList.map((c) => ({ ...c }));
  const decisionLogs: StudioActivityLog[] = [];
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Only pick 1 or 2 crew members per evaluation turn to maintain a smooth natural flow
  const candidateIndex = Math.floor(Math.random() * updatedCrew.length);
  const candidate = updatedCrew[candidateIndex];

  if (!candidate || candidate.targetPos !== null) {
    return { updatedCrew, decisionLogs };
  }

  // 1. If currently at desk -> 30% chance to go out to pantry or lounge, or 10% chance to doze off
  if (candidate.currentState === 'WORKING_AT_DESK') {
    const dice = Math.random();

    if (dice < 0.12) {
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
    } else if (dice < 0.40) {
      // Go to Pantry or Collaboration Lounge
      const destination = Math.random() < 0.6 ? SHARED_FACILITIES[2] : SHARED_FACILITIES[1]; // Pantry or Plaza
      const waypoints = destination.waypoints;
      const targetPoint = waypoints[Math.floor(Math.random() * waypoints.length)];

      candidate.currentState = 'WALKING';
      candidate.targetPos = [...targetPoint];
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
  // 2. If currently at Pantry or Lounge -> 60% chance to return to home desk
  else if (candidate.currentState === 'AT_PANTRY' || candidate.currentState === 'AT_LOUNGE') {
    if (Math.random() < 0.65) {
      candidate.currentState = 'WALKING';
      candidate.targetPos = [...candidate.homeDeskPos];
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

  return { updatedCrew, decisionLogs };
}
