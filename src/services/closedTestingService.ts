/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING SERVICE (LAPIS 2)
 * 
 * Business Logic for:
 * 1. Initializing 14-day tracking matrix
 * 2. Evaluating daily compliance (>= 20 testers & crash rate > 99%)
 * 3. Computing production application readiness score
 * ============================================================================
 */

import {
  ClosedTestingProjectTracker,
  ClosedTestingDayRecord,
  CANONICAL_DAILY_CHECKPOINTS,
} from '../types/closedTestingTracker';

export function initialize14DayTracker(
  projectSlug: string,
  projectName: string,
  packageName: string,
  startDateStr: string,
  initialEnrolledTesters: number = 24
): ClosedTestingProjectTracker {
  const startDate = new Date(startDateStr);
  const days: ClosedTestingDayRecord[] = [];

  for (let i = 1; i <= 14; i++) {
    const dayDate = new Date(startDate.getTime() + (i - 1) * 24 * 60 * 60 * 1000);
    const dateFormatted = dayDate.toISOString().split('T')[0];

    days.push({
      dayNumber: i,
      dateString: dateFormatted,
      activeTesterCount: initialEnrolledTesters,
      crashFreeRatePercent: 100.0,
      anrRatePercent: 0.0,
      checkpoints: CANONICAL_DAILY_CHECKPOINTS.map((cp) => ({
        id: cp.id,
        label: cp.label,
        description: cp.description,
        isVerified: false,
      })),
      isDayFullyCompliant: false,
    });
  }

  const endDate = new Date(startDate.getTime() + 13 * 24 * 60 * 60 * 1000);

  return {
    projectSlug,
    projectName,
    packageName,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    currentDay: 1,
    totalRequiredTesters: 20,
    currentEnrolledTesters: initialEnrolledTesters,
    status: initialEnrolledTesters >= 20 ? 'IN_PROGRESS' : 'AT_RISK',
    days,
    overallProgressPercent: 0,
  };
}

export function updateDayCheckpoint(
  tracker: ClosedTestingProjectTracker,
  dayNumber: number,
  checkpointId: string,
  isVerified: boolean,
  notes?: string
): ClosedTestingProjectTracker {
  const updatedDays = tracker.days.map((day) => {
    if (day.dayNumber !== dayNumber) return day;

    const updatedCheckpoints = day.checkpoints.map((cp) => {
      if (cp.id !== checkpointId) return cp;
      return {
        ...cp,
        isVerified,
        verifiedAt: isVerified ? new Date().toISOString() : undefined,
        notes: notes !== undefined ? notes : cp.notes,
      };
    });

    const allVerified = updatedCheckpoints.every((cp) => cp.isVerified);
    const testerCompliant = day.activeTesterCount >= tracker.totalRequiredTesters;
    const crashCompliant = day.crashFreeRatePercent >= 99.0 && day.anrRatePercent <= 0.47;

    return {
      ...day,
      checkpoints: updatedCheckpoints,
      isDayFullyCompliant: allVerified && testerCompliant && crashCompliant,
    };
  });

  const compliantDaysCount = updatedDays.filter((d) => d.isDayFullyCompliant).length;
  const progressPercent = Math.round((compliantDaysCount / 14) * 100);

  let status: ClosedTestingProjectTracker['status'] = tracker.status;
  if (compliantDaysCount === 14 && tracker.currentEnrolledTesters >= 20) {
    status = 'COMPLETED_READY_FOR_PRODUCTION';
  } else if (tracker.currentEnrolledTesters < tracker.totalRequiredTesters) {
    status = 'AT_RISK';
  } else {
    status = 'IN_PROGRESS';
  }

  return {
    ...tracker,
    days: updatedDays,
    overallProgressPercent: progressPercent,
    status,
  };
}
