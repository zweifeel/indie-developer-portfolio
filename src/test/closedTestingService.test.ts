/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING SERVICE TESTS (LAPIS 2)
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import {
  initialize14DayTracker,
  updateDayCheckpoint,
  updateDayMetrics,
  getProductionAccessQuestions,
  updateProductionAccessQuestionAnswer,
  exportAllProductionQuestionsMarkdown,
  saveClosedTestingTrackerToStorage,
  loadClosedTestingTrackerFromStorage,
  saveProductionQuestionsToStorage,
  loadProductionQuestionsFromStorage,
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

  describe('Google Play 6 Production Access Questions', () => {
    it('provides exactly 6 official production questions with verified defaults', () => {
      const questions = getProductionAccessQuestions();
      expect(questions).toHaveLength(6);

      expect(questions[0].id).toBe('q1_recruitment');
      expect(questions[0].questionNumber).toBe(1);
      expect(questions[0].officialAnswer).toContain('https://sleepykoala.pages.dev');
      expect(questions[0].isVerified).toBe(true);

      expect(questions[1].id).toBe('q2_engagement_ease');
      expect(questions[2].id).toBe('q3_tester_engagement');
      expect(questions[3].id).toBe('q4_feedback_improvements');
      expect(questions[4].id).toBe('q5_production_readiness');
      expect(questions[5].id).toBe('q6_post_launch_plans');

      questions.forEach((q, idx) => {
        expect(q.questionNumber).toBe(idx + 1);
        expect(q.officialAnswer.length).toBeGreaterThan(50);
        expect(q.guidanceNotes.length).toBeGreaterThan(20);
      });
    });

    it('allows updating custom answer and verification status', () => {
      let questions = getProductionAccessQuestions();
      questions = updateProductionAccessQuestionAnswer(
        questions,
        'q4_feedback_improvements',
        'Jawaban kustom tambahan: Printer Bluetooth 58mm sudah dites pada 5 variasi HP.',
        true
      );

      const q4 = questions.find((q) => q.id === 'q4_feedback_improvements');
      expect(q4?.customAnswer).toContain('Printer Bluetooth 58mm');
      expect(q4?.isVerified).toBe(true);
    });

    it('generates a complete formatted markdown document for all 6 questions', () => {
      const questions = getProductionAccessQuestions();
      const tracker = initialize14DayTracker(
        'mobile-kasir',
        'Mobile Kasir',
        'com.sleepykoala.mobilekasir',
        '2026-11-10',
        24
      );

      const markdown = exportAllProductionQuestionsMarkdown(questions, tracker);
      expect(markdown).toContain('FORMULIR PENGAJUAN AKSES PRODUKSI GOOGLE PLAY CONSOLE');
      expect(markdown).toContain('Mobile Kasir');
      expect(markdown).toContain('com.sleepykoala.mobilekasir');
      expect(markdown).toContain('Pertanyaan 1:');
      expect(markdown).toContain('Pertanyaan 6:');
    });
  });

  describe('Daily Metrics and Threshold Evaluation', () => {
    it('evaluates compliance with crash rate < 1.09% and ANR < 0.47%', () => {
      let tracker = initialize14DayTracker(
        'mobile-kasir',
        'Mobile Kasir',
        'com.sleepykoala.mobilekasir',
        '2026-11-10',
        24
      );

      // Verify all checkpoints on Day 1
      const checkpoints = ['opt_in_verification', 'crash_anr_monitoring', 'feedback_review', 'engagement_telemetry'];
      for (const cp of checkpoints) {
        tracker = updateDayCheckpoint(tracker, 1, cp, true);
      }

      // Check compliant metrics (crash-free 99.5% => crash rate 0.5% < 1.09%, ANR 0.05% < 0.47%)
      tracker = updateDayMetrics(tracker, 1, {
        activeTesters: 24,
        crashFreeRate: 99.5,
        anrRate: 0.05,
        dailyNotes: 'Sesi pengujian normal tanpa hambatan.',
      });

      expect(tracker.days[0].isDayFullyCompliant).toBe(true);
      expect(tracker.days[0].dailyNotes).toBe('Sesi pengujian normal tanpa hambatan.');

      // Exceed crash rate (crash-free 98.0% => crash rate 2.0% > 1.09%)
      tracker = updateDayMetrics(tracker, 1, {
        crashFreeRate: 98.0,
      });
      expect(tracker.days[0].isDayFullyCompliant).toBe(false);

      // Restore crash-free, but exceed ANR rate (ANR 0.60% > 0.47%)
      tracker = updateDayMetrics(tracker, 1, {
        crashFreeRate: 100.0,
        anrRate: 0.60,
      });
      expect(tracker.days[0].isDayFullyCompliant).toBe(false);

      // Restore ANR, but drop active testers below 20
      tracker = updateDayMetrics(tracker, 1, {
        anrRate: 0.10,
        activeTesters: 19,
      });
      expect(tracker.days[0].isDayFullyCompliant).toBe(false);
    });

    it('handles localStorage saving and loading safely in test environments', () => {
      const tracker = initialize14DayTracker(
        'mobile-kasir',
        'Mobile Kasir',
        'com.sleepykoala.mobilekasir',
        '2026-11-10',
        24
      );

      const savedTracker = saveClosedTestingTrackerToStorage(tracker);
      expect(typeof savedTracker).toBe('boolean');

      const loadedTracker = loadClosedTestingTrackerFromStorage('mobile-kasir');
      if (typeof window !== 'undefined' && window.localStorage) {
        expect(loadedTracker?.projectSlug).toBe('mobile-kasir');
      }

      const questions = getProductionAccessQuestions();
      const savedQuestions = saveProductionQuestionsToStorage(questions);
      expect(typeof savedQuestions).toBe('boolean');

      const loadedQuestions = loadProductionQuestionsFromStorage();
      if (typeof window !== 'undefined' && window.localStorage) {
        expect(loadedQuestions).toHaveLength(6);
      }
    });
  });
});
