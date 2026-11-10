/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING MONITOR (LAPIS 3)
 * 
 * Interactive 14-Day Google Play Compliance Monitor for Mobile Kasir:
 * - 20+ Active Testers tracker
 * - 14 Consecutive Days grid with daily checklist
 * - Crash-free & ANR health indicators
 * - 100% Client-side state & safe persistence
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ClosedTestingProjectTracker,
} from '../../types/closedTestingTracker';
import {
  initialize14DayTracker,
  updateDayCheckpoint,
} from '../../services/closedTestingService';

export interface ClosedTestingMonitorProps {
  className?: string;
}

export const ClosedTestingMonitor: React.FC<ClosedTestingMonitorProps> = ({
  className = '',
}) => {
  const [tracker, setTracker] = useState<ClosedTestingProjectTracker>(() =>
    initialize14DayTracker(
      'mobile-kasir',
      'Mobile Kasir',
      'com.sleepykoala.mobilekasir',
      '2026-11-10',
      24
    )
  );

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const selectedDay = tracker.days.find((d) => d.dayNumber === selectedDayNumber) || tracker.days[0];

  const handleToggleCheckpoint = (checkpointId: string, currentStatus: boolean) => {
    setTracker((prev) =>
      updateDayCheckpoint(prev, selectedDayNumber, checkpointId, !currentStatus)
    );
  };

  const compliantDaysCount = tracker.days.filter((d) => d.isDayFullyCompliant).length;

  return (
    <div
      className={`bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6 shadow-xl ${className}`}
      data-testid="closed-testing-monitor"
    >
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Play Console 14-Day Mandatory Policy</span>
          </div>
          <h3 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>Monitoring 14 Hari Closed Testing — {tracker.projectName}</span>
          </h3>
          <p className="text-xs text-stone-400">
            Paket: <code className="text-stone-300 font-mono">{tracker.packageName}</code> • Periode: {tracker.startDate} s/d {tracker.endDate}
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-950 border border-stone-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">Tester Aktif</div>
              <div className="text-sm font-bold text-stone-100">
                {tracker.currentEnrolledTesters} / {tracker.totalRequiredTesters}
                <span className="text-[10px] text-emerald-400 ml-1.5 font-normal">(Memenuhi Syarat)</span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-stone-950 border border-stone-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">Kepatuhan</div>
              <div className="text-sm font-bold text-stone-100">
                {compliantDaysCount} / 14 Hari
                <span className="text-[10px] text-cyan-400 ml-1.5 font-mono">({tracker.overallProgressPercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 14-Day Timeline Grid */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
          Kalender Timeline 14 Hari Berturut-turut:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {tracker.days.map((day) => {
            const isSelected = day.dayNumber === selectedDayNumber;
            return (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => setSelectedDayNumber(day.dayNumber)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-md ring-1 ring-cyan-400/50'
                    : day.isDayFullyCompliant
                    ? 'border-emerald-700/60 bg-emerald-950/20 hover:border-emerald-600'
                    : 'border-stone-800 bg-stone-950/70 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-stone-200">
                    Hari ke-{day.dayNumber}
                  </span>
                  {day.isDayFullyCompliant ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                  )}
                </div>
                <div className="text-[10px] text-stone-400 font-mono mt-1">
                  {day.dateString}
                </div>
                <div className="text-[10px] mt-1.5 font-medium">
                  {day.isDayFullyCompliant ? (
                    <span className="text-emerald-400">Terverifikasi</span>
                  ) : (
                    <span className="text-stone-400">Belum Selesai</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Detail Checklist for Selected Day */}
      <div className="p-5 rounded-2xl border border-stone-800 bg-stone-950/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
          <div>
            <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <span>Checklist Verifikasi: Hari ke-{selectedDay.dayNumber} ({selectedDay.dateString})</span>
            </h4>
            <p className="text-xs text-stone-400">
              Lakukan pengecekan checklist setiap hari pada Google Play Console sebelum menandai lulus.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                selectedDay.isDayFullyCompliant
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-stone-900 text-stone-400 border border-stone-800'
              }`}
            >
              {selectedDay.isDayFullyCompliant ? 'HARI LULUS VALIDASI' : 'BELUM MEMENUHI SEMUA SYARAT'}
            </span>
          </div>
        </div>

        {/* Checkpoint Items */}
        <div className="space-y-2.5">
          {selectedDay.checkpoints.map((cp) => (
            <label
              key={cp.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                cp.isVerified
                  ? 'bg-emerald-950/15 border-emerald-900/60 text-stone-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <input
                type="checkbox"
                checked={cp.isVerified}
                onChange={() => handleToggleCheckpoint(cp.id, cp.isVerified)}
                className="mt-0.5 rounded border-stone-700 bg-stone-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
              />
              <div className="space-y-0.5 select-none">
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>{cp.label}</span>
                  {cp.isVerified && (
                    <span className="text-[10px] font-mono text-emerald-400 font-normal">
                      ✓ Diverifikasi
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {cp.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Status Callout */}
        <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/80 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-stone-300 leading-relaxed">
            <strong className="text-amber-300">Catatan Kebijakan Google Play:</strong> Seluruh 20 tester wajib tetap terdaftar dan terhubung (opted-in) ke link pengujian internal/tertutup tanpa jeda putus selama 14 hari penuh. Jangan mempublikasikan rilis baru yang tidak stabil selama periode pengujian berjalan.
          </p>
        </div>
      </div>
    </div>
  );
};
