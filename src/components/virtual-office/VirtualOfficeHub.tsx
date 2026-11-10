/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE HUB (LAPIS 3)
 * 
 * Official 3D Low-Poly Virtual Office Stage (Three.js WebGL):
 * - Authentic KayKit CC0 Low-Poly 3D Office Environment & Casual Crew
 * - Unified Ground Slab (Anti-Blue Void) with 6 Thematic Project Workspaces
 * - Smooth Interactive Drag-Pan & Cursor-Directed Zoom
 * - 360° Orbit, Chat Bubbles, and Visitor Commands
 * ============================================================================
 */

import React from 'react';
import {
  Sparkles,
  Building2,
  Box,
} from 'lucide-react';
import type { Project } from '../../types/project';
import type { VirtualHQConfig } from '../../types/virtualOffice';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';
import { ThreeCampusCanvas } from './ThreeCampusCanvas';

export interface VirtualOfficeHubProps {
  projects: readonly Project[] | Project[];
  hqConfig: VirtualHQConfig;
  className?: string;
}

export const VirtualOfficeHub: React.FC<VirtualOfficeHubProps> = ({
  projects,
  hqConfig,
  className = '',
}) => {
  return (
    <section
      className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 ${className}`}
      data-testid="virtual-office-hub"
    >
      {/* 1. Studio Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/80 backdrop-blur-md shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-cyan-400 shrink-0" />
            <span>Kampus Virtual 3D — SleepyKoala Virtual HQ</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Satu kampus kantor virtual terpadu 3D Low-Poly WebGL yang menghubungkan seluruh workstation tim pengembang indie SleepyKoala Studio. Anda bisa menjelajah bebas (drag-pan, orbit 360°, zoom kursor, chat bubbles, dan konsol perintah interaktif).
          </p>
        </div>

        {/* 2. Official 3D Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 shadow-inner self-stretch md:self-auto shrink-0 justify-center">
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold">3D Low-Poly WebGL</span>
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-cyan-500 text-stone-950 font-extrabold">
            LIVE
          </span>
        </div>
      </div>

      {/* 3. Main Stage Presentation (Three.js 3D Campus) */}
      <div className="transition-opacity duration-300">
        <ThreeCampusCanvas
          projects={projects}
          initialFocusedSlug={hqConfig.activeRoomId || null}
        />
      </div>
    </section>
  );
};
