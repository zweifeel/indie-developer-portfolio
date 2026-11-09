import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  VirtualHQConfig,
  ProjectRoomConfig,
  VIRTUAL_OFFICE_SIMULATION_LABEL,
} from '../../types/virtualOffice';
import { ConnectedVirtualHQCanvas } from './ConnectedVirtualHQCanvas';
import { LemburIsometricPrototype } from './LemburIsometricPrototype';
import { ProductionVirtualHQCampus } from './ProductionVirtualHQCampus';
import {
  Sparkles,
  Building2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Compass,
  Layers,
} from 'lucide-react';

export interface PixelVirtualHQProps {
  hqConfig: VirtualHQConfig;
  className?: string;
  defaultReducedMotion?: boolean;
  defaultStaticFallback?: boolean;
}

export const PixelVirtualHQ: React.FC<PixelVirtualHQProps> = ({
  hqConfig,
  className = '',
  defaultReducedMotion = false,
  defaultStaticFallback = false,
}) => {
  const navigate = useNavigate();
  const [activeRoomId, setActiveRoomId] = useState<string>(
    hqConfig.activeRoomId || hqConfig.rooms[0]?.id || ''
  );
  const [activeEngine, setActiveEngine] = useState<'b344-production' | 'b34-prototype' | 'b33-spatial'>('b344-production');
  const [reducedMotion, setReducedMotion] = useState(defaultReducedMotion);
  const [staticFallback, setStaticFallback] = useState(defaultStaticFallback);

  const activeRoom = hqConfig.rooms.find((r) => r.id === activeRoomId) || hqConfig.rooms[0];

  const handleSelectRoom = (room: ProjectRoomConfig) => {
    setActiveRoomId(room.id);
  };

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 ${className}`}>
      {/* 1. Header & Studio Atmosphere Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/80 backdrop-blur-md shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-100 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-cyan-400 shrink-0" />
            <span>{hqConfig.name || 'SleepyKoala Virtual Development Office'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Satu kantor pusat terpadu (<strong className="text-amber-300 font-semibold">Connected Isometric Virtual Headquarters</strong>) yang menghubungkan lobi, plaza kolaborasi, boardroom, dan seluruh workspace tim proyek SleepyKoala Studio dalam satu lingkungan spasial yang nyata.
          </p>
        </div>

        {/* Controls: Reduced Motion & Static Fallback */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={() => setReducedMotion((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              reducedMotion
                ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
            title="Nonaktifkan denyut animasi gerak"
          >
            {reducedMotion ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
            <span>Motion: {reducedMotion ? 'Off' : 'On'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStaticFallback((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              staticFallback
                ? 'border-purple-500/50 bg-purple-950/30 text-purple-300'
                : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
            title="Mode fallback gambar statis hemat daya"
          >
            {staticFallback ? <ToggleRight className="w-4 h-4 text-purple-400" /> : <ToggleLeft className="w-4 h-4" />}
            <span>Statis: {staticFallback ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* 2. Room Directory Tabs / Navigator Grid (Selecting Project Workspaces in Connected HQ) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Pilih Ruang Kerja Proyek di Virtual HQ:
          </span>
          {activeRoom && (
            <Link
              to={`/projects/${activeRoom.projectSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Buka Halaman Detail {activeRoom.projectName}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Responsive Horizontal Scrollable Container on Mobile, 6-col Grid on Desktop */}
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {hqConfig.rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => handleSelectRoom(room)}
                className={`min-w-[150px] sm:min-w-0 p-3 rounded-2xl border text-left transition-all flex flex-col justify-between shrink-0 ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg ring-1 ring-cyan-400/50'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-0.5 truncate">
                    {room.category}
                  </span>
                  <p className="text-xs font-bold text-stone-100 truncate">{room.projectName}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400">
                  <span className="font-mono">5 Agent</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.5 Engine Selector: B3.4.4 Production Campus vs B3.4.2 Prototype vs B3.3 Spatial Engine */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveEngine('b344-production')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeEngine === 'b344-production'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>B3.4.4 Production: Cozy Pixel Campus (Live Aset)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEngine('b34-prototype')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeEngine === 'b34-prototype'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>B3.4.2 Fallback Prototype</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveEngine('b33-spatial')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            activeEngine === 'b33-spatial'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>B3.3 Campus Floorplan</span>
        </button>

        <Link
          to="/prototypes/virtual-office-b343"
          className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 ml-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>B3.4.3: Asset Lab</span>
          <ExternalLink className="w-3 h-3 text-emerald-400" />
        </Link>
      </div>

      {/* 3. Main Stage */}
      <div className="space-y-4">
        {activeEngine === 'b344-production' ? (
          <ProductionVirtualHQCampus
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onSelectProjectRoom={(slug) => {
              const foundRoom = hqConfig.rooms.find((r) => r.projectSlug === slug);
              if (foundRoom) {
                setActiveRoomId(foundRoom.id);
              }
            }}
          />
        ) : activeEngine === 'b34-prototype' ? (
          <LemburIsometricPrototype
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
          />
        ) : (
          <ConnectedVirtualHQCanvas
            initialFocusSlug={activeRoom?.projectSlug || null}
            onSelectProject={(slug) => {
              const foundRoom = hqConfig.rooms.find((r) => r.projectSlug === slug);
              if (foundRoom) {
                setActiveRoomId(foundRoom.id);
              }
            }}
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onNavigateDetail={(slug) => navigate(`/projects/${slug}`)}
          />
        )}
      </div>
    </section>
  );
};
