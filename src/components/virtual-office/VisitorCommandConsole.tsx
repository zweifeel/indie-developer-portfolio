/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VISITOR COMMAND CONSOLE (LAPIS 3)
 * 
 * Interactive Command Input Bar, Quick Action Chips, and Command Guide Modal.
 * Allows visitors to trigger real-time 3D actions (wake up, serve coffee, pizza, etc.).
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Send,
  HelpCircle,
  Sparkles,
  Coffee,
  AlarmClock,
  Pizza,
  Zap,
  PartyPopper,
  MessageSquare,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  VisitorCommandFeedback,
} from '../../types/virtualOffice3D';
import {
  VISITOR_COMMAND_CATALOG,
} from '../../data/virtualOfficeDialogueBank';

export interface VisitorCommandConsoleProps {
  onExecuteCommand: (commandText: string) => void;
  lastFeedback?: VisitorCommandFeedback | null;
  className?: string;
  focusedProjectName?: string | null;
}

export const VisitorCommandConsole: React.FC<VisitorCommandConsoleProps> = ({
  onExecuteCommand,
  lastFeedback,
  className = '',
  focusedProjectName,
}) => {
  const [inputText, setInputText] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onExecuteCommand(inputText.trim());
    setInputText('');
  };

  const handleChipClick = (cmd: string) => {
    onExecuteCommand(cmd);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Command Input Bar */}
      <div className="p-3 sm:p-4 rounded-2xl border border-stone-800 bg-stone-900/90 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-stone-200 uppercase tracking-wider">
              Konsol Interaksi Pengunjung
            </span>
            {focusedProjectName && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-[10px] font-mono text-cyan-300">
                Target: {focusedProjectName}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-stone-800 hover:border-cyan-500/50 bg-stone-950/80 hover:bg-cyan-950/30 text-stone-400 hover:text-cyan-300 text-[11px] font-medium transition-colors"
            title="Buka panduan perintah interaktif"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Panduan Perintah</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik perintah (contoh: /bangunkan, /kopi, /pizza, /lembur, /pesta)..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-800 bg-stone-950 text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 2. Quick Action Chips (Touch-friendly for mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 scrollbar-none">
          <span className="text-[10px] font-mono text-stone-400 uppercase shrink-0">Aksi Cepat:</span>
          
          <button
            type="button"
            onClick={() => handleChipClick('/bangunkan')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/50 text-amber-300 text-xs font-medium transition-all shrink-0 hover:scale-[1.02]"
          >
            <AlarmClock className="w-3.5 h-3.5 text-amber-400" />
            <span>Bangunkan!</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('/kopi')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-yellow-500/40 bg-yellow-950/20 hover:bg-yellow-950/50 text-yellow-300 text-xs font-medium transition-all shrink-0 hover:scale-[1.02]"
          >
            <Coffee className="w-3.5 h-3.5 text-yellow-400" />
            <span>Traktir Kopi</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('/pizza')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-orange-500/40 bg-orange-950/20 hover:bg-orange-950/50 text-orange-300 text-xs font-medium transition-all shrink-0 hover:scale-[1.02]"
          >
            <Pizza className="w-3.5 h-3.5 text-orange-400" />
            <span>Kirim Pizza</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('/lembur')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/50 text-cyan-300 text-xs font-medium transition-all shrink-0 hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lembur</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('/pesta')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/50 text-emerald-300 text-xs font-medium transition-all shrink-0 hover:scale-[1.02]"
          >
            <PartyPopper className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pesta Rilis</span>
          </button>

          <button
            type="button"
            onClick={() => handleChipClick('/tanya')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/50 text-purple-300 text-xs font-medium transition-all shrink-0 hover:scale-[1.02]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Tanya Kabar</span>
          </button>
        </div>
      </div>

      {/* 3. Feedback Banner */}
      {lastFeedback && (
        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs transition-all animate-fadeIn ${
            lastFeedback.success
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
              : 'border-amber-500/40 bg-amber-950/30 text-amber-200'
          }`}
        >
          {lastFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold block">{lastFeedback.message}</span>
            <span className="text-[10px] text-stone-400 font-mono">
              Waktu: {lastFeedback.timestamp} • Perintah: {lastFeedback.command}
            </span>
          </div>
        </div>
      )}

      {/* 4. Cheat-Sheet Command Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-stone-100">
                  Panduan Perintah Interaktif Pengunjung
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Anda bisa mengetikkan perintah di bawah ini pada kolom interaksi atau mengklik tombol cepat untuk melihat reaksi langsung dari kru pengembang 3D:
            </p>

            <div className="space-y-2.5">
              {VISITOR_COMMAND_CATALOG.map((cmd) => (
                <div
                  key={cmd.command}
                  className="p-3 rounded-2xl border border-stone-800 bg-stone-950/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {cmd.command}
                    </span>
                    <span className="text-xs">{cmd.icon} {cmd.label}</span>
                  </div>
                  <p className="text-xs text-stone-300">{cmd.description}</p>
                  <div className="text-[11px] text-stone-400 font-mono">
                    Alias: {cmd.aliases.join(', ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-xs transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
