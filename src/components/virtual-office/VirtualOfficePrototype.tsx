import React, { useState } from 'react';
import {
  VirtualHQConfig,
  ProjectRoomConfig,
  VIRTUAL_OFFICE_SIMULATION_LABEL,
} from '../../types/virtualOffice';
import {
  provisionVirtualHQ,
  provisionProjectRoom,
} from '../../data/virtualOfficePresets';
import { VirtualHQOverview } from './VirtualHQOverview';
import { ProjectRoomView } from './ProjectRoomView';
import { Building2, Layout, Sliders, Sparkles, ToggleLeft, ToggleRight, Plus } from 'lucide-react';

interface VirtualOfficePrototypeProps {
  initialHq?: VirtualHQConfig;
  className?: string;
}

export const VirtualOfficePrototype: React.FC<VirtualOfficePrototypeProps> = ({
  initialHq,
  className = '',
}) => {
  // State for HQ Configuration
  const [hqConfig, setHqConfig] = useState<VirtualHQConfig>(() => initialHq || provisionVirtualHQ());
  
  // Navigation State
  const [viewMode, setViewMode] = useState<'hq' | 'room'>('hq');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    hqConfig.activeRoomId || hqConfig.rooms[0]?.id || ''
  );

  // Accessibility & Display Preferences
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [staticFallback, setStaticFallback] = useState<boolean>(false);

  const activeRoom = hqConfig.rooms.find((r) => r.id === selectedRoomId) || hqConfig.rooms[0];

  const handleSelectRoomFromHQ = (room: ProjectRoomConfig) => {
    setSelectedRoomId(room.id);
    setViewMode('room');
  };

  const handleAddSampleRoom = (category: string, presetName: string) => {
    const newRoom = provisionProjectRoom({
      id: `room-${Date.now()}`,
      name: `Demo ${presetName} #${hqConfig.rooms.length + 1}`,
      category,
      slug: `demo-${Date.now()}`,
    });
    setHqConfig((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));
  };

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 ${className}`}>
      {/* Simulation Compliance Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-cyan-500/30 bg-stone-900/90 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-300">
                {VIRTUAL_OFFICE_SIMULATION_LABEL}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Rp0 Zero-Cost Architecture
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Visual prototype kantor virtual 2.5D Isometric SVG & CSS murni. Tanpa backend berbayar atau WebGL berat.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-950 border border-stone-800 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setViewMode('hq')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'hq'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Virtual HQ Overview</span>
          </button>
          <button
            onClick={() => setViewMode('room')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'room'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Project Room View</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar: Settings, Accessibility & Room Selector */}
      <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900/60 flex flex-wrap items-center justify-between gap-4">
        {/* Project Room Selector (Quick Dropdown) */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-stone-500" />
            <span>Ruangan Proyek:</span>
          </span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-950 text-xs font-mono text-stone-200 focus:outline-none focus:border-cyan-400"
          >
            {hqConfig.rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.projectName} ({room.category})
              </option>
            ))}
          </select>

          <button
            onClick={() => handleAddSampleRoom('Mobile App', 'Android')}
            className="px-2.5 py-1.5 rounded-xl border border-stone-800 bg-stone-950 text-stone-400 hover:text-cyan-300 hover:border-cyan-500/40 text-xs transition-colors flex items-center gap-1"
            title="Uji skalabilitas provisioning N-proyek otomatis"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Sampel Proyek</span>
          </button>
        </div>

        {/* Accessibility & Fallback Toggles */}
        <div className="flex items-center gap-4 text-xs font-medium">
          {/* Reduced Motion Toggle */}
          <button
            onClick={() => setReducedMotion((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              reducedMotion
                ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
            title="Nonaktifkan animasi dan pulsing untuk kenyamanan pengguna sensitif gerak"
          >
            {reducedMotion ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4" />}
            <span>Reduced Motion: {reducedMotion ? 'ON' : 'OFF'}</span>
          </button>

          {/* Static Fallback Toggle */}
          <button
            onClick={() => setStaticFallback((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              staticFallback
                ? 'border-purple-500/50 bg-purple-950/30 text-purple-300'
                : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
            }`}
            title="Paksa render mode gambar/kartu statis (kompatibilitas browser lama / hemat baterai)"
          >
            {staticFallback ? <ToggleRight className="w-4 h-4 text-purple-400" /> : <ToggleLeft className="w-4 h-4" />}
            <span>Static Fallback: {staticFallback ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'hq' ? (
        <VirtualHQOverview
          hqConfig={hqConfig}
          onSelectRoom={handleSelectRoomFromHQ}
          reducedMotion={reducedMotion}
          staticFallback={staticFallback}
        />
      ) : (
        activeRoom && (
          <ProjectRoomView
            room={activeRoom}
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onBackToHQ={() => setViewMode('hq')}
          />
        )
      )}
    </div>
  );
};
