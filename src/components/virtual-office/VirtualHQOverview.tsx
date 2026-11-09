import React, { useState } from 'react';
import {
  VirtualHQConfig,
  ProjectRoomConfig,
  VIRTUAL_OFFICE_SIMULATION_LABEL,
  AgentCrewMember,
} from '../../types/virtualOffice';
import { IsometricRoomCanvas } from './IsometricRoomCanvas';
import { Sparkles, Building2 } from 'lucide-react';

interface VirtualHQOverviewProps {
  hqConfig: VirtualHQConfig;
  onSelectRoom?: (room: ProjectRoomConfig) => void;
  reducedMotion?: boolean;
  staticFallback?: boolean;
}

export const VirtualHQOverview: React.FC<VirtualHQOverviewProps> = ({
  hqConfig,
  onSelectRoom,
  reducedMotion = false,
  staticFallback = false,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string>(
    hqConfig.activeRoomId || hqConfig.rooms[0]?.id || ''
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentCrewMember | null>(null);

  const activeRoom = hqConfig.rooms.find((r) => r.id === activeRoomId) || hqConfig.rooms[0];

  const handleRoomClick = (room: ProjectRoomConfig) => {
    setActiveRoomId(room.id);
    setSelectedAgent(null);
    onSelectRoom?.(room);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-stone-800 bg-stone-900/80 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-100 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>{hqConfig.name}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Simulasi visual tata kelola kantor pengembangan virtual dan 5 agent inti SleepyKoala Studio.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-950 text-right">
            <p className="text-[10px] font-mono text-stone-500 uppercase">Total Ruangan</p>
            <p className="text-sm font-bold text-stone-200">{hqConfig.rooms.length} Proyek</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-950 text-right">
            <p className="text-[10px] font-mono text-stone-500 uppercase">Agent Inti</p>
            <p className="text-sm font-bold text-cyan-400">5 Per Ruangan</p>
          </div>
        </div>
      </div>

      {/* Main Isometric Room Stage */}
      {activeRoom && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Viewport Ruangan Aktif:
              </span>
              <span className="text-sm font-bold text-cyan-300">{activeRoom.projectName}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono">
                {activeRoom.category}
              </span>
            </div>

            <span className="text-xs text-stone-500 font-mono">
              Tema: {activeRoom.themeStyle.name}
            </span>
          </div>

          <IsometricRoomCanvas
            room={activeRoom}
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onSelectAgent={(agent) => setSelectedAgent(agent)}
            selectedAgentId={selectedAgent?.id}
          />
        </div>
      )}

      {/* Agent Detail Modal / Card when selected */}
      {selectedAgent && (
        <div className="p-4 rounded-xl border border-cyan-500/40 bg-stone-900/90 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {selectedAgent.role}
              </span>
              <h4 className="text-sm font-bold text-stone-100">{selectedAgent.name}</h4>
              <span className="text-xs text-stone-400">• {selectedAgent.specialization}</span>
            </div>
            <p className="text-xs text-stone-400 mt-1 max-w-xl">{selectedAgent.description}</p>
            <p className="text-xs text-cyan-400 font-mono mt-1">
              Aktivitas: {selectedAgent.currentActivity.label} — {selectedAgent.currentActivity.detail}
            </p>
          </div>

          <button
            onClick={() => setSelectedAgent(null)}
            className="px-3 py-1 rounded-lg border border-stone-700 bg-stone-800 text-xs text-stone-300 hover:text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Room Directory / Navigator Grid (Selecting Project Rooms) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Pilih Ruangan Proyek di Virtual HQ:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {hqConfig.rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-md ring-1 ring-cyan-400/50'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">
                    {room.category}
                  </span>
                  <p className="text-xs font-bold text-stone-200 truncate">{room.projectName}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500">
                  <span>5 Agent</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
