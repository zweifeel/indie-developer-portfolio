import React, { useState } from 'react';
import {
  ProjectRoomConfig,
  AgentCrewMember,
  VIRTUAL_OFFICE_SIMULATION_LABEL,
} from '../../types/virtualOffice';
import { IsometricRoomCanvas } from './IsometricRoomCanvas';
import { Sparkles, Terminal, Box, User } from 'lucide-react';

interface ProjectRoomViewProps {
  room: ProjectRoomConfig;
  reducedMotion?: boolean;
  staticFallback?: boolean;
  onBackToHQ?: () => void;
  className?: string;
}

export const ProjectRoomView: React.FC<ProjectRoomViewProps> = ({
  room,
  reducedMotion = false,
  staticFallback = false,
  onBackToHQ,
  className = '',
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentCrewMember | null>(room.agents[0] || null);
  const [activeTab, setActiveTab] = useState<'agents' | 'decor' | 'logs'>('agents');

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header and Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-stone-800 bg-stone-900/80 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-100 flex items-center gap-2.5">
            <span>{room.projectName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono font-normal">
              {room.category}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Viewport mendalam ruang kerja tim agent virtual khusus proyek {room.projectName}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onBackToHQ && (
            <button
              onClick={onBackToHQ}
              className="px-3.5 py-1.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-750 text-xs font-medium text-stone-200 transition-colors shadow-sm"
            >
              ← Kembali ke Virtual HQ
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-950 text-right">
            <p className="text-[10px] font-mono text-stone-500 uppercase">Tema Ruangan</p>
            <p className="text-xs font-bold text-cyan-400">{room.themeStyle.name}</p>
          </div>
        </div>
      </div>

      {/* Main Close-up Isometric Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Isometric Canvas Column */}
        <div className="lg:col-span-8 space-y-3">
          <IsometricRoomCanvas
            room={room}
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onSelectAgent={(agent) => setSelectedAgent(agent)}
            selectedAgentId={selectedAgent?.id}
            isCloseUp={true}
          />
          <div className="p-3 rounded-xl border border-stone-800/80 bg-stone-950/70 text-xs text-stone-400 flex items-center justify-between">
            <span className="font-mono text-[11px]">
              Klik pada karakter Koala Agent di ruangan untuk membuka profil & log aktivitas.
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              {room.agents.length} Agent Aktif
            </span>
          </div>
        </div>

        {/* Room Inspector / Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Tab Navigation */}
          <div className="flex rounded-xl p-1 bg-stone-950 border border-stone-800">
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'agents'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Agent ({room.agents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('decor')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'decor'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Dekorasi ({room.themeStyle.decorItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulasi</span>
            </button>
          </div>

          {/* Tab 1: Agent Crew List & Inspector */}
          {activeTab === 'agents' && (
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="space-y-1.5 flex-1 max-h-[380px] overflow-y-auto pr-1">
                {room.agents.map((agent) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50'
                          : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center text-base shrink-0">
                        {agent.role === 'PLANNER' && '📋'}
                        {agent.role === 'DEVELOPER' && '💻'}
                        {agent.role === 'TESTER' && '🧪'}
                        {agent.role === 'REVIEWER' && '🔍'}
                        {agent.role === 'PUBLISHER' && '🚀'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-stone-200 truncate">{agent.name}</p>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-cyan-300 border border-stone-700">
                            {agent.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">
                          {agent.specialization}
                        </p>
                        <p className="text-[10px] font-mono text-emerald-400 truncate mt-1">
                          • {agent.currentActivity.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Agent Inspector Card */}
              {selectedAgent && (
                <div className="p-3.5 rounded-xl border border-stone-700 bg-stone-900/90 space-y-2 mt-2">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="text-[11px] font-bold text-stone-200">
                      Profil: {selectedAgent.name}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Slot: #{selectedAgent.position.slot} ({selectedAgent.position.xPercent}%, {selectedAgent.position.yPercent}%)
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {selectedAgent.description}
                  </p>
                  <div className="pt-2 border-t border-stone-800 text-[11px] font-mono">
                    <p className="text-stone-500">Aktivitas Saat Ini:</p>
                    <p className="text-cyan-300 mt-0.5">
                      {selectedAgent.currentActivity.detail}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Decor Items List */}
          {activeTab === 'decor' && (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              <p className="text-xs text-stone-400 mb-2">
                Objek tematik ruangan disesuaikan dengan domain proyek ({room.category}):
              </p>
              {room.themeStyle.decorItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-stone-800 bg-stone-900/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {item.type === 'whiteboard' && '📋'}
                      {item.type === 'server_rack' && '🗄️'}
                      {item.type === 'coffee_station' && '☕'}
                      {item.type === 'plant' && '🪴'}
                      {item.type === 'trophy' && '🏆'}
                      {item.type === 'bookshelf' && '📚'}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-200">
                        {item.label || item.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-[10px] font-mono text-stone-500">
                        Tipe: {item.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    ({item.xPercent}%, {item.yPercent}%)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Simulated Activity Log */}
          {activeTab === 'logs' && (
            <div className="p-3 rounded-xl border border-stone-800 bg-stone-950 font-mono text-xs text-stone-300 space-y-2 max-h-[480px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-500 text-[10px]">
                <span>AGENT ACTIVITY STREAM</span>
                <span className="text-emerald-400">LIVE SIMULATION</span>
              </div>
              {room.agents.map((agent) => (
                <div key={agent.id} className="py-1.5 border-b border-stone-900 last:border-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">{agent.name} ({agent.role})</span>
                    <span className="text-stone-500 text-[10px]">
                      Slot #{agent.position.slot}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    {agent.currentActivity.detail || agent.currentActivity.label}
                  </p>
                  <p className="text-[9px] text-stone-600 mt-0.5">
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
