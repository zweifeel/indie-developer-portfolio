import React, { useState } from 'react';
import { ProjectRoomConfig, AgentCrewMember, VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';
import { PixelIsometricCanvas } from './PixelIsometricCanvas';
import { Sparkles, Terminal, Box, User, ToggleLeft, ToggleRight } from 'lucide-react';

export interface PixelProjectRoomProps {
  room: ProjectRoomConfig;
  className?: string;
  defaultReducedMotion?: boolean;
  defaultStaticFallback?: boolean;
}

export const PixelProjectRoom: React.FC<PixelProjectRoomProps> = ({
  room,
  className = '',
  defaultReducedMotion = false,
  defaultStaticFallback = false,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentCrewMember>(room.agents[0] || null);
  const [activeTab, setActiveTab] = useState<'agents' | 'decor' | 'logs'>('agents');
  const [reducedMotion, setReducedMotion] = useState(defaultReducedMotion);
  const [staticFallback, setStaticFallback] = useState(defaultStaticFallback);

  return (
    <div className={`w-full rounded-3xl border border-stone-850 bg-stone-900/40 p-4 sm:p-6 space-y-6 ${className}`}>
      {/* 1. Header with Simulation Watermark & Modern Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-100 flex items-center gap-2.5">
            <span>Ruang Kerja Tim: {room.projectName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-800 text-cyan-300 font-mono font-normal">
              {room.category}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Simulasi visual interaktif 2.5D isometric pixel art ruang kerja 5 agent inti SleepyKoala Studio.
          </p>
        </div>

        {/* Accessibility & Motion Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setReducedMotion((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              reducedMotion
                ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
            title="Nonaktifkan denyut animasi"
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
            title="Mode fallback statis hemat daya"
          >
            {staticFallback ? <ToggleRight className="w-4 h-4 text-purple-400" /> : <ToggleLeft className="w-4 h-4" />}
            <span>Statis: {staticFallback ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Close-Up Stage & Inspector Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pixel Art Isometric Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <PixelIsometricCanvas
            room={room}
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onSelectAgent={(agent) => setSelectedAgent(agent)}
            selectedAgentId={selectedAgent?.id}
            isCloseUp={true}
          />
          <div className="p-3 rounded-xl border border-stone-800/80 bg-stone-950/70 text-xs text-stone-400 flex items-center justify-between">
            <span className="font-mono text-[11px] text-stone-300">
              💡 Klik karakter Digital Coworker pada ruangan untuk memeriksa fokus tugas & spesialisasi.
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              Tema: {room.themeStyle.name}
            </span>
          </div>
        </div>

        {/* Right Column: Inspector & Crew Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Tab Selector */}
          <div className="flex rounded-xl p-1 bg-stone-950 border border-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab('agents')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'agents'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Tim Agent (5)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('decor')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'decor'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Perabot & Alat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Log Aktivitas</span>
            </button>
          </div>

          {/* TAB 1: 5 AGENTS LIST & INSPECTOR */}
          {activeTab === 'agents' && (
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Agent Quick Buttons */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {room.agents.map((agent) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50'
                          : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0">
                        <img
                          src={`/assets/virtual-office/characters/human-${agent.role.toLowerCase()}.svg`}
                          alt={agent.name}
                          className="w-7 h-7 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-stone-200 truncate">{agent.name}</p>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-stone-800 text-cyan-300 border border-stone-700">
                            {agent.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">
                          {agent.specialization}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Agent Inspector Card */}
              {selectedAgent && (
                <div className="p-4 rounded-xl border border-stone-700 bg-stone-900/90 space-y-2.5 shadow-md">
                  <div className="flex items-center gap-3 pb-2 border-b border-stone-800">
                    <img
                      src={`/assets/virtual-office/characters/human-${selectedAgent.role.toLowerCase()}.svg`}
                      alt={selectedAgent.name}
                      className="w-10 h-10 object-contain drop-shadow"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-100">{selectedAgent.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {selectedAgent.role}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-cyan-400">{selectedAgent.specialization}</p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    {selectedAgent.description}
                  </p>

                  <div className="pt-2 border-t border-stone-800/80 text-[11px] font-mono">
                    <p className="text-stone-400">Simulasi Tugas Terkini:</p>
                    <p className="text-cyan-300 font-semibold mt-0.5">
                      • {selectedAgent.currentActivity.label}: {selectedAgent.currentActivity.detail}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DECOR & EQUIPMENT */}
          {activeTab === 'decor' && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <p className="text-xs text-stone-400 mb-2">
                Peralatan pixel-art tematik yang dipasang khusus untuk kategori proyek ini:
              </p>
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-semibold">Meja Kerja Studio:</span>
                  <span className="font-mono text-cyan-400">Warm Oak Angled Desks</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-semibold">Layar Kerja:</span>
                  <span className="font-mono text-cyan-400">Dual Monitor IDE & Telemetri</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-semibold">Infrastruktur:</span>
                  <span className="font-mono text-cyan-400">Retro Server Cluster Rack</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-semibold">Lantai:</span>
                  <span className="font-mono text-cyan-400">2:1 Dimetric Wood Parquet</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span className="font-semibold">Suasana:</span>
                  <span className="font-mono text-cyan-400">Potted Monstera & Espresso Bar</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY STREAM */}
          {activeTab === 'logs' && (
            <div className="p-3 rounded-xl border border-stone-800 bg-stone-950 font-mono text-xs text-stone-300 space-y-2 max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-500 text-[10px]">
                <span>AGENT ACTIVITY STREAM</span>
                <span className="text-emerald-400">LIVE SIMULATION</span>
              </div>
              {room.agents.map((agent) => (
                <div key={agent.id} className="py-2 border-b border-stone-900 last:border-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">{agent.name} ({agent.role})</span>
                    <span className="text-stone-500 text-[10px]">Slot #{agent.position.slot}</span>
                  </div>
                  <p className="text-stone-300 text-[11px] mt-0.5">
                    {agent.currentActivity.detail || agent.currentActivity.label}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Spesialisasi: {agent.specialization}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
