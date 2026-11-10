/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING TRACKER TYPES (LAPIS 1)
 * 
 * Strict Data Contracts for Google Play 14-Day Closed Testing Compliance:
 * - 20+ Active Opt-in Testers requirement
 * - 14 Consecutive Days tracking with daily verification checkpoints
 * - Zero Dummy / Real Analytics logging
 * ============================================================================
 */

export interface DailyCheckpointItem {
  id: string;
  label: string;
  description: string;
  isVerified: boolean;
  verifiedAt?: string;
  notes?: string;
}

export interface ClosedTestingDayRecord {
  dayNumber: number; // 1 to 14
  dateString: string; // YYYY-MM-DD
  activeTesterCount: number; // must be >= 20
  crashFreeRatePercent: number; // e.g. 99.8
  anrRatePercent: number; // e.g. 0.05
  checkpoints: DailyCheckpointItem[];
  isDayFullyCompliant: boolean;
}

export interface ClosedTestingProjectTracker {
  projectSlug: string;
  projectName: string;
  packageName: string;
  startDate: string; // ISO date
  endDate: string; // ISO date (start + 14 days)
  currentDay: number;
  totalRequiredTesters: number; // 20
  currentEnrolledTesters: number;
  status: 'PENDING_START' | 'IN_PROGRESS' | 'COMPLETED_READY_FOR_PRODUCTION' | 'AT_RISK';
  days: ClosedTestingDayRecord[];
  overallProgressPercent: number;
}

export const CANONICAL_DAILY_CHECKPOINTS = [
  {
    id: 'opt_in_verification',
    label: 'Opt-in Tester Verification',
    description: 'Minimal 20 tester berstatus aktif (opted-in) di Google Play Console track Closed Testing.',
  },
  {
    id: 'crash_anr_monitoring',
    label: 'Crash & ANR Rate Inspection',
    description: 'Crash-free user rate berada di atas 99.0% dan tingkat ANR di bawah ambang batas buruk 0.47%.',
  },
  {
    id: 'feedback_review',
    label: 'Tinjauan Feedback & Masukan Tester',
    description: 'Memeriksa feedback di email tester atau Google Play form untuk isu transaksi/printer Bluetooth.',
  },
  {
    id: 'engagement_telemetry',
    label: 'Sesi Aplikasi & Pengujian Fitur Riil',
    description: 'Tester membuka aplikasi, melakukan transaksi kasir simulasi, dan memvalidasi keranjang belanja.',
  },
] as const;
