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
  GooglePlayProductionQuestion,
  CANONICAL_PRODUCTION_QUESTIONS,
  MAX_CRASH_RATE_PERCENT,
  MAX_ANR_RATE_PERCENT,
  MIN_REQUIRED_OPT_IN_TESTERS,
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
    const testerCompliant = day.activeTesterCount >= MIN_REQUIRED_OPT_IN_TESTERS;
    const crashRate = Math.max(0, 100 - day.crashFreeRatePercent);
    const crashCompliant = crashRate < MAX_CRASH_RATE_PERCENT;
    const anrCompliant = day.anrRatePercent < MAX_ANR_RATE_PERCENT;

    return {
      ...day,
      checkpoints: updatedCheckpoints,
      isDayFullyCompliant: allVerified && testerCompliant && crashCompliant && anrCompliant,
    };
  });

  const compliantDaysCount = updatedDays.filter((d) => d.isDayFullyCompliant).length;
  const progressPercent = Math.round((compliantDaysCount / 14) * 100);

  let status: ClosedTestingProjectTracker['status'] = tracker.status;
  if (compliantDaysCount === 14 && tracker.currentEnrolledTesters >= MIN_REQUIRED_OPT_IN_TESTERS) {
    status = 'COMPLETED_READY_FOR_PRODUCTION';
  } else if (tracker.currentEnrolledTesters < MIN_REQUIRED_OPT_IN_TESTERS) {
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

export function updateDayMetrics(
  tracker: ClosedTestingProjectTracker,
  dayNumber: number,
  metrics: {
    activeTesters?: number;
    crashFreeRate?: number;
    anrRate?: number;
    dailyNotes?: string;
  }
): ClosedTestingProjectTracker {
  const updatedDays = tracker.days.map((day) => {
    if (day.dayNumber !== dayNumber) return day;

    const activeTesterCount = metrics.activeTesters !== undefined ? metrics.activeTesters : day.activeTesterCount;
    const crashFreeRatePercent = metrics.crashFreeRate !== undefined ? metrics.crashFreeRate : day.crashFreeRatePercent;
    const anrRatePercent = metrics.anrRate !== undefined ? metrics.anrRate : day.anrRatePercent;
    const dailyNotes = metrics.dailyNotes !== undefined ? metrics.dailyNotes : day.dailyNotes;

    const allVerified = day.checkpoints.every((cp) => cp.isVerified);
    const testerCompliant = activeTesterCount >= MIN_REQUIRED_OPT_IN_TESTERS;
    const crashRate = Math.max(0, 100 - crashFreeRatePercent);
    const crashCompliant = crashRate < MAX_CRASH_RATE_PERCENT;
    const anrCompliant = anrRatePercent < MAX_ANR_RATE_PERCENT;

    return {
      ...day,
      activeTesterCount,
      crashFreeRatePercent,
      anrRatePercent,
      dailyNotes,
      isDayFullyCompliant: allVerified && testerCompliant && crashCompliant && anrCompliant,
    };
  });

  const compliantDaysCount = updatedDays.filter((d) => d.isDayFullyCompliant).length;
  const progressPercent = Math.round((compliantDaysCount / 14) * 100);

  let status: ClosedTestingProjectTracker['status'] = tracker.status;
  if (compliantDaysCount === 14 && tracker.currentEnrolledTesters >= MIN_REQUIRED_OPT_IN_TESTERS) {
    status = 'COMPLETED_READY_FOR_PRODUCTION';
  } else if (tracker.currentEnrolledTesters < MIN_REQUIRED_OPT_IN_TESTERS) {
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

export function getProductionAccessQuestions(): GooglePlayProductionQuestion[] {
  return CANONICAL_PRODUCTION_QUESTIONS.map((q) => ({ ...q }));
}

export function updateProductionAccessQuestionAnswer(
  questions: GooglePlayProductionQuestion[],
  id: string,
  newAnswer: string,
  isVerified?: boolean
): GooglePlayProductionQuestion[] {
  return questions.map((q) => {
    if (q.id !== id) return q;
    return {
      ...q,
      customAnswer: newAnswer,
      isVerified: isVerified !== undefined ? isVerified : q.isVerified,
    };
  });
}

export function exportAllProductionQuestionsMarkdown(
  questions: GooglePlayProductionQuestion[],
  tracker: ClosedTestingProjectTracker
): string {
  const lines: string[] = [];
  lines.push(`# FORMULIR PENGAJUAN AKSES PRODUKSI GOOGLE PLAY CONSOLE`);
  lines.push(`**Aplikasi:** ${tracker.projectName} (\`${tracker.packageName}\`)`);
  lines.push(`**Studio:** SleepyKoala Studio`);
  lines.push(`**Status Pengujian:** 14 Hari Closed Testing (${tracker.startDate} s/d ${tracker.endDate})`);
  lines.push(`**Jumlah Penguji Terdaftar:** ${tracker.currentEnrolledTesters} penguji aktif`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  questions.forEach((q) => {
    const answerToUse = q.customAnswer || q.officialAnswer;
    lines.push(`### Pertanyaan ${q.questionNumber}: ${q.title}`);
    lines.push(`**Pertanyaan Resmi (ID):** ${q.questionId}`);
    lines.push(`**Pertanyaan Resmi (EN):** *${q.questionEn}*`);
    lines.push(``);
    lines.push(`**Jawaban Pengembang:**`);
    lines.push(`> ${answerToUse}`);
    lines.push(``);
    lines.push(`*Catatan Panduan Reviewer:* ${q.guidanceNotes}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  });

  return lines.join('\n');
}

const STORAGE_KEY_TRACKER_PREFIX = 'sleepykoala_closed_testing_tracker_';
const STORAGE_KEY_QUESTIONS = 'sleepykoala_google_play_production_questions';

export function saveClosedTestingTrackerToStorage(tracker: ClosedTestingProjectTracker): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const key = `${STORAGE_KEY_TRACKER_PREFIX}${tracker.projectSlug}`;
    window.localStorage.setItem(key, JSON.stringify(tracker));
    return true;
  } catch {
    return false;
  }
}

export function loadClosedTestingTrackerFromStorage(projectSlug: string): ClosedTestingProjectTracker | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const key = `${STORAGE_KEY_TRACKER_PREFIX}${projectSlug}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProductionQuestionsToStorage(questions: GooglePlayProductionQuestion[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
    return true;
  } catch {
    return false;
  }
}

export function loadProductionQuestionsFromStorage(): GooglePlayProductionQuestion[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
