/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING SERVICE TESTS (LAPIS 2)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  initialize14DayTracker,
  updateDayCheckpoint,
} from '../services/closedTestingService';

describe('Closed Testing 14-Day Compliance Service', () => {
  it('initializes 14 consecutive days with 20+ required testers', () => {
    const tracker = initialize14DayTracker(
      'mobile-kasir',
      'Mobile Kasir',
      'com.sleepykoala.mobilekasir',
      '2026-11-10',
      25
    );

    expect(tracker.projectSlug).toBe('mobile-kasir');
    expect(tracker.days).toHaveLength(14);
    expect(tracker.totalRequiredTesters).toBe(20);
    expect(tracker.currentEnrolledTesters).toBe(25);
    expect(tracker.status).toBe('IN_PROGRESS');
    expect(tracker.overallProgressPercent).toBe(0);
    expect(tracker.days[0].dayNumber).toBe(1);
    expect(tracker.days[13].dayNumber).toBe(14);
  });

  it('marks day as compliant when all 4 checkpoints are verified', () => {
    let tracker = initialize14DayTracker(
      'mobile-kasir',
      'Mobile Kasir',
      'com.sleepykoala.mobilekasir',
      '2026-11-10',
      22
    );

    const checkpoints = ['opt_in_verification', 'crash_anr_monitoring', 'feedback_review', 'engagement_telemetry'];
    for (const cp of checkpoints) {
      tracker = updateDayCheckpoint(tracker, 1, cp, true);
    }

    expect(tracker.days[0].isDayFullyCompliant).toBe(true);
    expect(tracker.overallProgressPercent).toBe(7); // 1/14 = 7%
  });

  it('transitions to COMPLETED_READY_FOR_PRODUCTION when all 14 days are verified', () => {
    let tracker = initialize14DayTracker(
      'mobile-kasir',
      'Mobile Kasir',
      'com.sleepykoala.mobilekasir',
      '2026-11-10',
      24
    );

    const checkpoints = ['opt_in_verification', 'crash_anr_monitoring', 'feedback_review', 'engagement_telemetry'];
    for (let day = 1; day <= 14; day++) {
      for (const cp of checkpoints) {
        tracker = updateDayCheckpoint(tracker, day, cp, true);
      }
    }

    expect(tracker.overallProgressPercent).toBe(100);
    expect(tracker.status).toBe('COMPLETED_READY_FOR_PRODUCTION');
  });

  it('flags AT_RISK status if enrolled testers drop below 20', () => {
    const tracker = initialize14DayTracker(
      'mobile-kasir',
      'Mobile Kasir',
      'com.sleepykoala.mobilekasir',
      '2026-11-10',
      18
    );

    expect(tracker.status).toBe('AT_RISK');
  });
});
