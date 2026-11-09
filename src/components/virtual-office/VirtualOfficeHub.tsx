/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE HUB (LAPIS 3)
 * 
 * Unified Virtual Office Switcher between:
 * - 3D Low-Poly Procedural Campus (Three.js WebGL, 30+ Human Crew, Chat Bubbles, Visitor Commands)
 * - 2.5D Pixel Art Campus (Stable Retro Isometric Simulation)
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Box,
  Image as ImageIcon,
} from 'lucide-react';
import type { Project } from '../../types/project';
import type { VirtualHQConfig } from '../../types/virtualOffice';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';
import { ThreeCampusCanvas, isWebGLAvailable } from './ThreeCampusCanvas';
import { PixelVirtualHQ } from './PixelVirtualHQ';

export interface VirtualOfficeHubProps {
  projects: readonly Project[] | Project[];
  hqConfig: VirtualHQConfig;
  className?: string;
  defaultMode?: '3d' | '2.5d';
}

const STORAGE_KEY = 'sleepykoala_virtual_office_mode';

export const VirtualOfficeHub: React.FC<VirtualOfficeHubProps> = ({
  projects,
  hqConfig,
  className = '',
  defaultMode = '3d',
}) => {
  const [activeMode, setActiveMode] = useState<'3d' | '2.5d'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === '3d' || saved === '2.5d') return saved;
    } catch {
      // safe fallback
    }
    // Headless test environments without WebGL automatically default to 2.5D
    if (typeof window !== 'undefined' && !isWebGLAvailable()) {
      return '2.5d';
    }
    return defaultMode;
  });

  const handleModeChange = (mode: '3d' | '2.5d') => {
    setActiveMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // safe fallback
    }
  };

  return (
    <section
      className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 ${className}`}
      data-testid="virtual-office-hub"
    >
      {/* 1. Studio Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/80 backdrop-blur-md shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-cyan-400 shrink-0" />
            <span>Kampus Virtual SleepyKoala Studio</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Satu kampus kantor virtual terpadu yang menghubungkan seluruh workstation proyek tim indie SleepyKoala Studio. Anda bisa menjelajah dalam mode <strong>3D Low-Poly WebGL interaktif</strong> (360° orbit, zoom, chat bubbles, konsol perintah) atau mode <strong>2.5D Pixel Campus</strong> klasik.
          </p>
        </div>

        {/* 2. Unified Tab Switcher (3D vs 2.5D) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-stone-800 bg-stone-950 shadow-inner self-stretch md:self-auto shrink-0 justify-center">
          <button
            type="button"
            onClick={() => handleModeChange('3d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeMode === '3d'
                ? 'bg-cyan-500 text-stone-950 shadow-md ring-1 ring-cyan-400'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
            data-testid="tab-switch-3d"
          >
            <Box className="w-4 h-4" />
            <span>Kantor Virtual 3D</span>
            <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-200 border border-cyan-800">
              Baru
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('2.5d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeMode === '2.5d'
                ? 'bg-stone-200 text-stone-950 shadow-md ring-1 ring-stone-300'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
            data-testid="tab-switch-25d"
          >
            <ImageIcon className="w-4 h-4" />
            <span>2.5D Pixel Campus</span>
          </button>
        </div>
      </div>

      {/* 3. Main Stage Presentation */}
      <div className="transition-opacity duration-300">
        {activeMode === '3d' ? (
          <ThreeCampusCanvas
            projects={projects}
            initialFocusedSlug={hqConfig.activeRoomId || null}
          />
        ) : (
          <PixelVirtualHQ hqConfig={hqConfig} />
        )}
      </div>
    </section>
  );
};
