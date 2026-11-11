/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING MONITOR (LAPIS 3)
 * 
 * Interactive 14-Day Google Play Compliance Monitor & 6 Production Access Forms
 * - 20+ Active Testers tracker
 * - 14 Consecutive Days grid with daily checklist & metrics inspection
 * - Crash-free & ANR health indicators (Crash < 1.09%, ANR < 0.47%)
 * - 6 Official Google Play Production Access questionnaire responses
 * - 1-Click Copy per answer & Bulk copy all answers in formatted Markdown
 * - 100% Client-side state & safe persistence in LocalStorage
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Edit3,
  Save,
  RotateCcw,
  FileText,
  ShieldCheck,
  Activity,
  Bug,
} from 'lucide-react';
import {
  ClosedTestingProjectTracker,
  GooglePlayProductionQuestion,
  MAX_CRASH_RATE_PERCENT,
  MAX_ANR_RATE_PERCENT,
  MIN_REQUIRED_OPT_IN_TESTERS,
} from '../../types/closedTestingTracker';
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
} from '../../services/closedTestingService';

export interface ClosedTestingMonitorProps {
  className?: string;
}

export const ClosedTestingMonitor: React.FC<ClosedTestingMonitorProps> = ({
  className = '',
}) => {
  // 1. Tracker State
  const [tracker, setTracker] = useState<ClosedTestingProjectTracker>(() => {
    const loaded = loadClosedTestingTrackerFromStorage('mobile-kasir');
    return (
      loaded ||
      initialize14DayTracker(
        'mobile-kasir',
        'Mobile Kasir',
        'com.sleepykoala.mobilekasir',
        '2026-11-10',
        24
      )
    );
  });

  // 2. Production Questions State
  const [questions, setQuestions] = useState<GooglePlayProductionQuestion[]>(() => {
    const loaded = loadProductionQuestionsFromStorage();
    return loaded && loaded.length === 6 ? loaded : getProductionAccessQuestions();
  });

  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const selectedDay = tracker.days.find((d) => d.dayNumber === selectedDayNumber) || tracker.days[0];

  // Daily metrics editing inputs
  const [metricTesters, setMetricTesters] = useState<number>(selectedDay.activeTesterCount);
  const [metricCrashFree, setMetricCrashFree] = useState<number>(selectedDay.crashFreeRatePercent);
  const [metricAnr, setMetricAnr] = useState<number>(selectedDay.anrRatePercent);
  const [metricNotes, setMetricNotes] = useState<string>(selectedDay.dailyNotes || '');
  const [metricSaveMessage, setMetricSaveMessage] = useState<string | null>(null);

  // Sync inputs when user selects a different day
  useEffect(() => {
    const day = tracker.days.find((d) => d.dayNumber === selectedDayNumber) || tracker.days[0];
    setMetricTesters(day.activeTesterCount);
    setMetricCrashFree(day.crashFreeRatePercent);
    setMetricAnr(day.anrRatePercent);
    setMetricNotes(day.dailyNotes || '');
    setMetricSaveMessage(null);
  }, [selectedDayNumber]);

  // Questions editing & copy state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [tempAnswerText, setTempAnswerText] = useState<string>('');
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Persist tracker whenever it changes
  useEffect(() => {
    saveClosedTestingTrackerToStorage(tracker);
  }, [tracker]);

  // Persist questions whenever they change
  useEffect(() => {
    saveProductionQuestionsToStorage(questions);
  }, [questions]);

  // Checkpoint Toggle Handler
  const handleToggleCheckpoint = (checkpointId: string, currentStatus: boolean) => {
    setTracker((prev) =>
      updateDayCheckpoint(prev, selectedDayNumber, checkpointId, !currentStatus)
    );
  };

  // Metrics Save Handler
  const handleSaveMetrics = () => {
    setTracker((prev) =>
      updateDayMetrics(prev, selectedDayNumber, {
        activeTesters: metricTesters,
        crashFreeRate: metricCrashFree,
        anrRate: metricAnr,
        dailyNotes: metricNotes,
      })
    );
    setMetricSaveMessage('Metrik dan catatan harian berhasil disimpan!');
    setTimeout(() => setMetricSaveMessage(null), 3000);
  };

  // Copy helper with safe fallback
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle single question copy
  const handleCopyQuestion = async (q: GooglePlayProductionQuestion) => {
    const textToCopy = q.customAnswer || q.officialAnswer;
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setCopiedQuestionId(q.id);
      setTimeout(() => setCopiedQuestionId(null), 2500);
    }
  };

  // Handle bulk copy all questions
  const handleCopyAllQuestions = async () => {
    const markdown = exportAllProductionQuestionsMarkdown(questions, tracker);
    const success = await copyTextToClipboard(markdown);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    }
  };

  // Question Edit Handlers
  const handleStartEditQuestion = (q: GooglePlayProductionQuestion) => {
    setEditingQuestionId(q.id);
    setTempAnswerText(q.customAnswer || q.officialAnswer);
  };

  const handleSaveQuestionEdit = (id: string) => {
    setQuestions((prev) =>
      updateProductionAccessQuestionAnswer(prev, id, tempAnswerText, true)
    );
    setEditingQuestionId(null);
  };

  const handleResetQuestionToOfficial = (id: string) => {
    const canonical = getProductionAccessQuestions().find((q) => q.id === id);
    if (canonical) {
      setQuestions((prev) =>
        updateProductionAccessQuestionAnswer(prev, id, canonical.officialAnswer, true)
      );
      setEditingQuestionId(null);
    }
  };

  const handleToggleQuestionVerified = (id: string, current: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isVerified: !current } : q))
    );
  };

  const compliantDaysCount = tracker.days.filter((d) => d.isDayFullyCompliant).length;
  const verifiedQuestionsCount = questions.filter((q) => q.isVerified).length;
  const currentCrashRate = Math.max(0, 100 - selectedDay.crashFreeRatePercent);
  const isCurrentCrashSafe = currentCrashRate < MAX_CRASH_RATE_PERCENT;
  const isCurrentAnrSafe = selectedDay.anrRatePercent < MAX_ANR_RATE_PERCENT;
  const isCurrentTestersSafe = selectedDay.activeTesterCount >= MIN_REQUIRED_OPT_IN_TESTERS;

  return (
    <div
      className={`bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-8 shadow-xl ${className}`}
      data-testid="closed-testing-monitor"
    >
      {/* ==================================================================== */}
      {/* 1. Header Banner & Vitals Health Indicators */}
      {/* ==================================================================== */}
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
            Paket: <code className="text-stone-300 font-mono">{tracker.packageName}</code> • Periode:{' '}
            {tracker.startDate} s/d {tracker.endDate}
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-stone-950 border border-stone-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">Tester Aktif</div>
              <div className="text-sm font-bold text-stone-100">
                {tracker.currentEnrolledTesters} / {tracker.totalRequiredTesters}
                <span className="text-[10px] text-emerald-400 ml-1.5 font-normal">
                  (Memenuhi Syarat)
                </span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-stone-950 border border-stone-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">Kepatuhan</div>
              <div className="text-sm font-bold text-stone-100">
                {compliantDaysCount} / 14 Hari
                <span className="text-[10px] text-cyan-400 ml-1.5 font-mono">
                  ({tracker.overallProgressPercent}%)
                </span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-stone-950 border border-stone-800 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">Batas Vitals</div>
              <div className="text-xs font-mono font-bold text-stone-200">
                Crash &lt; {MAX_CRASH_RATE_PERCENT}% • ANR &lt; {MAX_ANR_RATE_PERCENT}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. 14-Day Timeline Grid */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
            Kalender Timeline 14 Hari Berturut-turut:
          </div>
          <div className="text-xs text-stone-400 font-mono">
            Hari Terpilih: <strong className="text-cyan-400">Hari ke-{selectedDayNumber}</strong>
          </div>
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

      {/* ==================================================================== */}
      {/* 3. Detail Checklist & Daily Metrics Panel for Selected Day */}
      {/* ==================================================================== */}
      <div className="p-5 rounded-2xl border border-stone-800 bg-stone-950/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
          <div>
            <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <span>
                Checklist &amp; Metrik Vitals: Hari ke-{selectedDay.dayNumber} ({selectedDay.dateString})
              </span>
            </h4>
            <p className="text-xs text-stone-400">
              Lakukan inspeksi Google Play Console setiap hari dan inputkan metrik stabilitas aplikasi.
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
              {selectedDay.isDayFullyCompliant
                ? 'HARI LULUS VALIDASI'
                : 'BELUM MEMENUHI SEMUA SYARAT'}
            </span>
          </div>
        </div>

        {/* Daily Metrics Input Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-900/60 border border-stone-800">
          {/* Active Testers */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-stone-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tester Aktif (Min. 20)</span>
            </label>
            <input
              type="number"
              min="0"
              value={metricTesters}
              onChange={(e) => setMetricTesters(Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-950 border ${
                isCurrentTestersSafe ? 'border-stone-700 text-stone-100' : 'border-rose-500 text-rose-300'
              }`}
            />
            <div className="text-[10px] font-mono">
              {isCurrentTestersSafe ? (
                <span className="text-emerald-400">✓ Memenuhi syarat (&gt;= 20)</span>
              ) : (
                <span className="text-rose-400">⚠ Di bawah batas minimal (&lt; 20)</span>
              )}
            </div>
          </div>

          {/* Crash-Free Rate */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-stone-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Crash-Free Rate % (Batas &gt; 98.91%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={metricCrashFree}
              onChange={(e) => setMetricCrashFree(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-950 border ${
                isCurrentCrashSafe ? 'border-stone-700 text-stone-100' : 'border-rose-500 text-rose-300'
              }`}
            />
            <div className="text-[10px] font-mono">
              Crash Rate: <strong>{currentCrashRate.toFixed(2)}%</strong>{' '}
              {isCurrentCrashSafe ? (
                <span className="text-emerald-400">(Aman &lt; {MAX_CRASH_RATE_PERCENT}%)</span>
              ) : (
                <span className="text-rose-400">(BAHAYA &gt;= {MAX_CRASH_RATE_PERCENT}%)</span>
              )}
            </div>
          </div>

          {/* ANR Rate */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-stone-300 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span>ANR Rate % (Batas &lt; 0.47%)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={metricAnr}
              onChange={(e) => setMetricAnr(parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-stone-950 border ${
                isCurrentAnrSafe ? 'border-stone-700 text-stone-100' : 'border-rose-500 text-rose-300'
              }`}
            />
            <div className="text-[10px] font-mono">
              {isCurrentAnrSafe ? (
                <span className="text-emerald-400">✓ Aman (&lt; {MAX_ANR_RATE_PERCENT}%)</span>
              ) : (
                <span className="text-rose-400">⚠ Melebihi ambang batas buruk!</span>
              )}
            </div>
          </div>

          {/* Daily Notes Textarea */}
          <div className="sm:col-span-3 space-y-1 mt-1">
            <label className="text-[11px] font-mono text-stone-300">
              Catatan Harian / Masukan Feedback Penguji (Opsional):
            </label>
            <textarea
              rows={2}
              value={metricNotes}
              onChange={(e) => setMetricNotes(e.target.value)}
              placeholder="Contoh: Pengujian alur cetak struk thermal 58mm berjalan mulus di 5 perangkat Xiaomi & Samsung..."
              className="w-full px-3 py-2 rounded-lg text-xs bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex items-center justify-between pt-1">
              {metricSaveMessage && (
                <span className="text-xs text-emerald-400 font-medium">
                  {metricSaveMessage}
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleSaveMetrics}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-stone-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Metrik Hari Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoint Items */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider">
            4 Butir Pemeriksaan Wajib Hari ke-{selectedDay.dayNumber}:
          </div>
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
            <strong className="text-amber-300">Catatan Kebijakan Google Play:</strong> Seluruh 20 tester
            wajib tetap terdaftar dan terhubung (opted-in) ke link pengujian internal/tertutup tanpa jeda
            putus selama 14 hari penuh. Pastikan angka crash rate di bawah 1.09% dan ANR di bawah 0.47%
            sebelum mengajukan akses produksi.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. Google Play 6 Official Production Access Questionnaires */}
      {/* ==================================================================== */}
      <div className="p-6 rounded-3xl border border-stone-800 bg-stone-950/95 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-[11px] font-mono font-medium text-emerald-300 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Play Production Access Application (6 Pertanyaan Wajib)</span>
            </div>
            <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Formulir Evaluasi Jawaban Resmi Pengajuan Akses Produksi</span>
            </h3>
            <p className="text-xs text-stone-400">
              Disiapkan khusus untuk akun developer perorangan SleepyKoala Studio agar lolos review
              evaluasi Google Play Store 100%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300">
              Kesiapan:{' '}
              <strong className="text-emerald-400">
                {verifiedQuestionsCount} / {questions.length} Formulir Siap Kirim
              </strong>
            </div>

            <button
              type="button"
              onClick={handleCopyAllQuestions}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-md"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-stone-950" />
                  <span>Semua Jawaban Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Semua 6 Jawaban Sekaligus (Markdown)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* List of 6 Questions */}
        <div className="space-y-4">
          {questions.map((q) => {
            const isEditing = editingQuestionId === q.id;
            const isCopied = copiedQuestionId === q.id;
            const answerDisplay = q.customAnswer || q.officialAnswer;

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-stone-800 bg-stone-900/60 space-y-4 hover:border-stone-700 transition-colors"
                data-testid={`question-card-${q.id}`}
              >
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Pertanyaan {q.questionNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-stone-800 text-stone-300">
                        {q.category}
                      </span>
                      {q.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Siap Diajukan</span>
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-bold text-stone-100">{q.title}</h5>
                    <div className="text-xs text-stone-300 font-medium">
                      🇮🇩 {q.questionId}
                    </div>
                    <div className="text-xs text-stone-400 italic">
                      🌐 {q.questionEn}
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q)}
                      className="px-3 py-1.5 rounded-lg border border-stone-700 hover:border-emerald-500 bg-stone-950 text-stone-200 hover:text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Jawaban</span>
                        </>
                      )}
                    </button>

                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => handleStartEditQuestion(q)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 bg-stone-950 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1 transition-colors"
                        title="Sesuaikan redaksi jawaban"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingQuestionId(null)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200 text-xs transition-colors"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer Content */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={tempAnswerText}
                      onChange={(e) => setTempAnswerText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-stone-950 border border-cyan-500/70 text-stone-100 font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleResetQuestionToOfficial(q.id)}
                        className="text-[11px] font-mono text-stone-400 hover:text-stone-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kembalikan ke Teks Standar Resmi Studio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveQuestionEdit(q.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-stone-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/80 space-y-2">
                    <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                      Jawaban Resmi SleepyKoala Studio:
                    </div>
                    <p className="text-xs text-stone-200 leading-relaxed">
                      {answerDisplay}
                    </p>
                  </div>
                )}

                {/* Reviewer Guidance Notes & Verification Checkbox */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stone-800/60 text-[11px]">
                  <div className="text-stone-400 italic">
                    💡 <span className="font-semibold text-stone-300">Catatan Reviewer:</span>{' '}
                    {q.guidanceNotes}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={q.isVerified}
                      onChange={() => handleToggleQuestionVerified(q.id, q.isVerified)}
                      className="rounded border-stone-700 bg-stone-950 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className="font-mono text-stone-300 text-[11px]">
                      Tandai Siap Kirim
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};