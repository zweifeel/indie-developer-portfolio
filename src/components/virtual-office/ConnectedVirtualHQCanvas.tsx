import React, { useState, useEffect, useRef } from 'react';
import {
  HQ_CAMERA_PRESETS,
  CONNECTED_HQ_DIMENSIONS,
  CANONICAL_WORKSPACES,
} from '../../data/virtualOfficeFloorPlan';
import { CameraViewport } from '../../types/virtualOfficeSpatial';
import { VIRTUAL_OFFICE_SIMULATION_LABEL, CoreAgentRole } from '../../types/virtualOffice';
import {
  Maximize2,
  Compass,
  Coffee,
  Users,
  Building,
  Gamepad2,
  Coins,
  Store,
  Pickaxe,
  Swords,
  Layers,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

export interface ConnectedVirtualHQCanvasProps {
  initialFocusSlug?: string | null;
  onSelectProject?: (slug: string) => void;
  reducedMotion?: boolean;
  staticFallback?: boolean;
  className?: string;
  onNavigateDetail?: (slug: string) => void;
}

const PROJECT_ICONS: Record<string, React.ReactNode> = {
  dompetnalar: <Coins className="w-3.5 h-3.5 text-sky-400" />,
  'idle-master': <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />,
  'mobile-kasir': <Store className="w-3.5 h-3.5 text-emerald-400" />,
  'idle-mining': <Pickaxe className="w-3.5 h-3.5 text-amber-400" />,
  'the-broken-origin': <Swords className="w-3.5 h-3.5 text-violet-400" />,
  worklume: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
};

const ROLE_SPRITE_MAP: Record<CoreAgentRole, string> = {
  PLANNER: '/assets/virtual-office/characters/human-planner.svg',
  DEVELOPER: '/assets/virtual-office/characters/human-developer.svg',
  TESTER: '/assets/virtual-office/characters/human-tester.svg',
  REVIEWER: '/assets/virtual-office/characters/human-reviewer.svg',
  PUBLISHER: '/assets/virtual-office/characters/human-publisher.svg',
};

export const ConnectedVirtualHQCanvas: React.FC<ConnectedVirtualHQCanvasProps> = ({
  initialFocusSlug = null,
  onSelectProject,
  reducedMotion = false,
  staticFallback = false,
  className = '',
  onNavigateDetail,
}) => {
  const [activeZone, setActiveZone] = useState<string>(initialFocusSlug || 'OVERVIEW');
  const [selectedAgent, setSelectedAgent] = useState<{
    role: CoreAgentRole;
    name: string;
    title: string;
    focus: string;
    projectSlug: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialFocusSlug if updated externally
  useEffect(() => {
    if (initialFocusSlug) {
      setActiveZone(initialFocusSlug);
    }
  }, [initialFocusSlug]);

  // Determine current camera coordinates
  const getCameraForZone = (zoneId: string): CameraViewport => {
    switch (zoneId) {
      case 'dompetnalar':
        return HQ_CAMERA_PRESETS.DOMPETNALAR;
      case 'idle-master':
        return HQ_CAMERA_PRESETS.IDLE_MASTER;
      case 'mobile-kasir':
        return HQ_CAMERA_PRESETS.MOBILE_KASIR;
      case 'idle-mining':
        return HQ_CAMERA_PRESETS.IDLE_MINING;
      case 'the-broken-origin':
        return HQ_CAMERA_PRESETS.THE_BROKEN_ORIGIN;
      case 'worklume':
        return HQ_CAMERA_PRESETS.WORKLUME;
      case 'reception':
        return HQ_CAMERA_PRESETS.RECEPTION;
      case 'collaboration_plaza':
        return HQ_CAMERA_PRESETS.COLLABORATION_PLAZA;
      case 'boardroom':
        return HQ_CAMERA_PRESETS.BOARDROOM;
      default:
        return HQ_CAMERA_PRESETS.OVERVIEW;
    }
  };

  const camera = getCameraForZone(activeZone);
  const isOverview = activeZone === 'OVERVIEW';

  const handleSelectZone = (zoneKey: string) => {
    setActiveZone(zoneKey);
    setSelectedAgent(null);
    if (zoneKey !== 'OVERVIEW' && !zoneKey.startsWith('facility_')) {
      onSelectProject?.(zoneKey);
    }
  };

  const activeWorkspace = CANONICAL_WORKSPACES.find((w) => w.projectSlug === activeZone);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden border border-stone-800 bg-[#0d0f12] select-none shadow-2xl transition-all ${className}`}
      style={{
        aspectRatio: '16/10',
        minHeight: '520px',
      }}
      tabIndex={0}
      aria-label="SleepyKoala Connected Virtual Headquarters"
    >
      {/* 1. TOP HEADER HUD: Mandatory Label, Status & View Mode */}
      <div className="absolute top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Mandatory Simulation Label */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-stone-950/90 backdrop-blur-md shadow-lg pointer-events-auto">
          <span className={`w-2 h-2 rounded-full bg-cyan-400 ${!reducedMotion && !staticFallback ? 'animate-ping' : ''}`} />
          <span className="text-[11px] font-mono font-medium text-cyan-300">
            {VIRTUAL_OFFICE_SIMULATION_LABEL}
          </span>
        </div>

        {/* Current Camera / Location Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl border border-stone-800 bg-stone-950/90 backdrop-blur-md shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-stone-200">
            {isOverview ? 'HQ Campus Overview (100% Zoom)' : `Workspace: ${activeWorkspace?.projectName || activeZone}`}
          </span>
          {!isOverview && (
            <button
              type="button"
              onClick={() => handleSelectZone('OVERVIEW')}
              className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-2.5 h-2.5" />
              <span>Full HQ</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. THE CONTINUOUS ISOMETRIC WORLD CANVAS */}
      <div
        className="w-full h-full relative"
        style={{
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox={`${camera.x} ${camera.y} ${camera.width} ${camera.height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transition: reducedMotion || staticFallback ? 'none' : 'viewBox 0.75s cubic-bezier(0.25, 1, 0.5, 1)',
            shapeRendering: 'crispEdges',
          }}
        >
          <defs>
            {/* Master Parquet Pattern */}
            <pattern id="hq_parquet_tile" width="64" height="32" patternUnits="userSpaceOnUse">
              <polygon points="32,0 64,16 32,32 0,16" fill="#6f421a" />
              <polygon points="32,1 62,16 32,31 2,16" fill="#8b5a2b" />
              <polygon points="32,2 60,16 32,30 4,16" fill="#9c6e42" />
              <line x1="16" y1="8" x2="48" y2="24" stroke="#5c3a1e" strokeWidth="1" />
              <line x1="48" y1="8" x2="16" y2="24" stroke="#5c3a1e" strokeWidth="1" />
            </pattern>

            {/* Tech Slate Tile Pattern for Lab / POS */}
            <pattern id="hq_slate_tile" width="64" height="32" patternUnits="userSpaceOnUse">
              <polygon points="32,0 64,16 32,32 0,16" fill="#1e293b" />
              <polygon points="32,1 62,16 32,31 2,16" fill="#334155" />
              <polygon points="32,2 60,16 32,30 4,16" fill="#475569" />
            </pattern>

            {/* Teal Carpet Tile Pattern for Lounge / Game Studio */}
            <pattern id="hq_carpet_tile" width="64" height="32" patternUnits="userSpaceOnUse">
              <polygon points="32,0 64,16 32,32 0,16" fill="#0f766e" />
              <polygon points="32,1 62,16 32,31 2,16" fill="#115e59" />
              <polygon points="32,2 60,16 32,30 4,16" fill="#134e4a" />
            </pattern>

            {/* Wall Gradients */}
            <linearGradient id="wall_warm_grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5ebe0" />
              <stop offset="100%" stopColor="#d5bdaf" />
            </linearGradient>
            <linearGradient id="wall_shaded_grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e3d5ca" />
              <stop offset="100%" stopColor="#bfa094" />
            </linearGradient>

            {/* Corridor Carpet Runner Gradient */}
            <linearGradient id="corridor_runner" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* ================================================================ */}
          {/* A. CONTINUOUS BUILDING FOUNDATION & WALL ARCHITECTURE             */}
          {/* ================================================================ */}

          {/* Exterior Building Grounding Base */}
          <rect x="0" y="0" width={CONNECTED_HQ_DIMENSIONS.width} height={CONNECTED_HQ_DIMENSIONS.height} fill="#111317" />

          {/* Master Continuous Parquet Floor for the Whole Office Campus */}
          <rect x="60" y="40" width="2280" height="1320" rx="16" fill="url(#hq_parquet_tile)" />

          {/* Structural Architectural Timber Ceiling Beams (Spanning across the campus) */}
          <g stroke="#3e2723" strokeWidth="8" opacity="0.65">
            <line x1="60" y1="40" x2="2340" y2="40" />
            <line x1="60" y1="480" x2="2340" y2="480" strokeWidth="4" />
            <line x1="60" y1="910" x2="2340" y2="910" strokeWidth="4" />
            <line x1="860" y1="40" x2="860" y2="1360" strokeWidth="6" />
            <line x1="1540" y1="40" x2="1540" y2="1360" strokeWidth="6" />
          </g>

          {/* ================================================================ */}
          {/* B. CENTRAL CIRCULATION CORRIDORS (Connecting All Workspaces)     */}
          {/* ================================================================ */}

          {/* Grand Central Spine Corridor (North-South Avenue) */}
          <rect x="1140" y="40" width="120" height="1320" fill="url(#corridor_runner)" />
          <line x1="1140" y1="40" x2="1140" y2="1360" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6" />
          <line x1="1260" y1="40" x2="1260" y2="1360" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6" />

          {/* West Arterial Hallway (Cross-Connecting to West Workspaces) */}
          <rect x="100" y="460" width="1040" height="60" fill="url(#corridor_runner)" opacity="0.7" />

          {/* East Arterial Hallway (Cross-Connecting to East Workspaces) */}
          <rect x="1260" y="460" width="1040" height="60" fill="url(#corridor_runner)" opacity="0.7" />

          {/* Second Arterial Cross-Walkways (Lower Level) */}
          <rect x="100" y="890" width="1040" height="60" fill="url(#corridor_runner)" opacity="0.7" />
          <rect x="1260" y="890" width="1040" height="60" fill="url(#corridor_runner)" opacity="0.7" />

          {/* ================================================================ */}
          {/* C. SHARED CENTRAL FACILITIES (Lobby, Plaza, Boardroom)          */}
          {/* ================================================================ */}

          {/* 1. LOBI & RESEPSIONIS UTAMA (Top Center) */}
          <g
            id="zone_reception"
            className="cursor-pointer group"
            onClick={() => handleSelectZone('reception')}
          >
            {/* Reception Floor Boundary */}
            <rect x="880" y="60" width="640" height="380" rx="12" fill="#18181b" stroke="#3f3f46" strokeWidth="2" opacity="0.9" />
            {/* Reception Counter Desk */}
            <rect x="1100" y="160" width="200" height="60" rx="6" fill="#8b5a2b" stroke="#5c3a1e" strokeWidth="2" />
            <text x="1200" y="195" fill="#fef3c7" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              SLEEPYKOALA RECEPTION
            </text>
            {/* Visitor Lounge Sofas */}
            <rect x="920" y="140" width="100" height="40" rx="4" fill="#0f766e" />
            <rect x="920" y="240" width="100" height="40" rx="4" fill="#0f766e" />
            <rect x="1380" y="140" width="100" height="40" rx="4" fill="#0f766e" />
            <rect x="1380" y="240" width="100" height="40" rx="4" fill="#0f766e" />
            {/* Zone Tag */}
            <rect x="1120" y="80" width="160" height="26" rx="13" fill="#27272a" stroke="#52525b" strokeWidth="1" />
            <text x="1200" y="97" fill="#e4e4e7" fontSize="11" fontWeight="bold" textAnchor="middle">
              🏢 LOBI & MASUK
            </text>
          </g>

          {/* 2. CENTRAL COLLABORATION PLAZA & COFFEE BAR (Mid Center) */}
          <g
            id="zone_collaboration_plaza"
            className="cursor-pointer group"
            onClick={() => handleSelectZone('collaboration_plaza')}
          >
            {/* Plaza Floor Tile */}
            <rect x="880" y="490" width="640" height="380" rx="12" fill="url(#hq_carpet_tile)" stroke="#0d9488" strokeWidth="2" opacity="0.85" />
            {/* Espresso Bar Counter */}
            <rect x="940" y="540" width="180" height="50" rx="6" fill="#334155" stroke="#475569" strokeWidth="2" />
            <text x="1030" y="570" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
              ☕ ESPRESSO BAR
            </text>
            {/* Discussion Circular Tables */}
            <circle cx="1200" cy="670" r="50" fill="#92400e" stroke="#78350f" strokeWidth="2" />
            <circle cx="1200" cy="670" r="8" fill="#fef3c7" />
            {/* Poufs / Stools */}
            <circle cx="1130" cy="670" r="14" fill="#0284c7" />
            <circle cx="1270" cy="670" r="14" fill="#0284c7" />
            <circle cx="1200" cy="600" r="14" fill="#0284c7" />
            <circle cx="1200" cy="740" r="14" fill="#0284c7" />
            {/* Zone Tag */}
            <rect x="1110" y="505" width="180" height="26" rx="13" fill="#134e4a" stroke="#2dd4bf" strokeWidth="1" />
            <text x="1200" y="522" fill="#ccfbf1" fontSize="11" fontWeight="bold" textAnchor="middle">
              ☕ COLLABORATION PLAZA
            </text>
          </g>

          {/* 3. SHARED BOARDROOM / PRESENTATION SUITE (Bottom Center) */}
          <g
            id="zone_boardroom"
            className="cursor-pointer group"
            onClick={() => handleSelectZone('boardroom')}
          >
            {/* Glass Conference Suite Floor */}
            <rect x="880" y="920" width="640" height="420" rx="12" fill="#1c1917" stroke="#78716c" strokeWidth="2" opacity="0.95" />
            {/* Glass Partitions on Borders */}
            <line x1="880" y1="920" x2="1520" y2="920" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
            <line x1="880" y1="920" x2="880" y2="1340" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
            <line x1="1520" y1="920" x2="1520" y2="1340" stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
            {/* Boardroom Long Walnut Table */}
            <rect x="980" y="1040" width="440" height="90" rx="12" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            {/* 10 Executive Chairs around Table */}
            {[1020, 1100, 1180, 1260, 1340].map((chairX) => (
              <React.Fragment key={chairX}>
                <rect x={chairX} y={1005} width="28" height="24" rx="4" fill="#1e293b" />
                <rect x={chairX} y={1140} width="28" height="24" rx="4" fill="#1e293b" />
              </React.Fragment>
            ))}
            {/* Big Presentation Screen */}
            <rect x="1080" y="940" width="240" height="18" rx="2" fill="#0284c7" />
            {/* Zone Tag */}
            <rect x="1110" y="930" width="180" height="26" rx="13" fill="#292524" stroke="#d97706" strokeWidth="1" />
            <text x="1200" y="947" fill="#fef3c7" fontSize="11" fontWeight="bold" textAnchor="middle">
              📊 SHARED BOARDROOM
            </text>
          </g>

          {/* ================================================================ */}
          {/* D. THE SIX DEDICATED PROJECT WORKSPACES                          */}
          {/* ================================================================ */}

          {CANONICAL_WORKSPACES.map((ws) => {
            const isTargeted = activeZone === ws.projectSlug;
            const { bounds, environmentTheme, specializedAgents } = ws;

            return (
              <g
                key={ws.projectId}
                id={`workspace_${ws.projectSlug}`}
                className="cursor-pointer transition-opacity"
                onClick={() => handleSelectZone(ws.projectSlug)}
              >
                {/* Workspace Floor Baseplate */}
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={bounds.width}
                  height={bounds.height}
                  rx="14"
                  fill={
                    environmentTheme.flooring === 'slate_tech'
                      ? 'url(#hq_slate_tile)'
                      : environmentTheme.flooring === 'carpet_teal'
                      ? 'url(#hq_carpet_tile)'
                      : environmentTheme.flooring === 'tile_obsidian'
                      ? '#18181b'
                      : 'url(#hq_parquet_tile)'
                  }
                  stroke={isTargeted ? ws.environmentTheme.accentColor : '#3f3f46'}
                  strokeWidth={isTargeted ? 4 : 2}
                  className="transition-all duration-300"
                />

                {/* Ambient Color Wash Overlay for Workspace Identity */}
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={bounds.width}
                  height={bounds.height}
                  rx="14"
                  fill={environmentTheme.ambientTint}
                  pointerEvents="none"
                />

                {/* Project Header Banner & Doorway Nameplate */}
                <g transform={`translate(${bounds.x + 20}, ${bounds.y + 16})`}>
                  <rect
                    x="0"
                    y="0"
                    width="260"
                    height="32"
                    rx="8"
                    fill="#09090b"
                    stroke={environmentTheme.accentColor}
                    strokeWidth="1.5"
                  />
                  <text x="12" y="21" fill="#f4f4f5" fontSize="13" fontWeight="bold">
                    {ws.projectName}
                  </text>
                  <text x="160" y="20" fill={environmentTheme.accentColor} fontSize="10" fontFamily="monospace">
                    {ws.category}
                  </text>
                </g>

                {/* Workspace Specialty Decor Props */}
                {environmentTheme.specialtyDecor.map((decor) => (
                  <g key={decor.id} transform={`translate(${decor.x}, ${decor.y})`}>
                    <rect x="0" y="0" width="70" height="42" rx="4" fill="#27272a" stroke="#52525b" strokeWidth="1" />
                    <text x="35" y="24" fill="#a1a1aa" fontSize="9" textAnchor="middle">
                      {decor.label}
                    </text>
                  </g>
                ))}

                {/* Dual Workstations & Equipment Desks */}
                {/* Workstation A (Planner & Dev area) */}
                <g transform={`translate(${bounds.x + 160}, ${bounds.y + 180})`}>
                  <rect x="0" y="0" width="130" height="70" rx="6" fill="#8b5a2b" stroke="#5c3a1e" strokeWidth="1.5" />
                  {/* Dual Monitors on Desk */}
                  <rect x="30" y="4" width="70" height="12" rx="2" fill="#1e293b" />
                  <rect x="35" y="16" width="60" height="2" fill="#0284c7" />
                </g>

                {/* Workstation B (Tester & Reviewer area) */}
                <g transform={`translate(${bounds.x + 390}, ${bounds.y + 180})`}>
                  <rect x="0" y="0" width="130" height="70" rx="6" fill="#8b5a2b" stroke="#5c3a1e" strokeWidth="1.5" />
                  {/* QA Device Stand / Props on Desk */}
                  <rect x="40" y="6" width="50" height="14" rx="2" fill="#334155" />
                  <circle cx="65" cy="13" r="3" fill="#10b981" />
                </g>

                {/* 5 Core Digital Coworkers Stationed in this Workspace */}
                {(['PLANNER', 'DEVELOPER', 'TESTER', 'REVIEWER', 'PUBLISHER'] as CoreAgentRole[]).map((role) => {
                  const agentData = specializedAgents[role];
                  const isAgentSelected =
                    selectedAgent?.role === role && selectedAgent?.projectSlug === ws.projectSlug;

                  return (
                    <g
                      key={role}
                      transform={`translate(${agentData.stationAnchor.x}, ${agentData.stationAnchor.y})`}
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectZone(ws.projectSlug);
                        setSelectedAgent({
                          role,
                          name: role,
                          title: agentData.title,
                          focus: agentData.focus,
                          projectSlug: ws.projectSlug,
                        });
                      }}
                    >
                      {/* Ground Contact Shadow */}
                      <ellipse cx="20" cy="52" rx="16" ry="4" fill="#000" opacity="0.4" />

                      {/* Selection Glow Halo */}
                      {isAgentSelected && (
                        <circle cx="20" cy="24" r="28" fill={environmentTheme.accentColor} opacity="0.35" />
                      )}

                      {/* Human Coworker SVG Sprite */}
                      <image
                        href={ROLE_SPRITE_MAP[role]}
                        x="0"
                        y="0"
                        width="40"
                        height="55"
                        style={{ imageRendering: 'pixelated' }}
                      />

                      {/* Compact Role Tag on Avatar */}
                      <rect
                        x="-10"
                        y="56"
                        width="60"
                        height="16"
                        rx="4"
                        fill="#09090b"
                        stroke={isAgentSelected ? environmentTheme.accentColor : '#52525b'}
                        strokeWidth="1"
                      />
                      <text
                        x="20"
                        y="68"
                        fill={isAgentSelected ? environmentTheme.accentColor : '#e4e4e7'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {role}
                      </text>
                    </g>
                  );
                })}

                {/* Corridor Entrance Threshold with Door Marker */}
                <g transform={`translate(${bounds.x + (bounds.width / 2) - 30}, ${bounds.y + bounds.height - 12})`}>
                  <rect x="0" y="0" width="60" height="12" fill="#0284c7" opacity="0.6" />
                  <polygon points="30,2 24,10 36,10" fill="#ffffff" />
                </g>
              </g>
            );
          })}
        </svg>

        {/* 3. MINIMAP RADAR (Bottom Right Corner) */}
        <div className="absolute bottom-4 right-4 z-40 hidden sm:flex flex-col items-end">
          <div className="p-2 rounded-2xl border border-stone-800 bg-stone-950/95 shadow-2xl backdrop-blur-md w-44">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-800 mb-1.5">
              <span className="text-[10px] font-mono font-bold text-stone-300">CAMPUS RADAR</span>
              <span className="text-[9px] font-mono text-cyan-400">2400×1400</span>
            </div>
            {/* Schematic Minimap Grid */}
            <div className="relative w-full h-24 bg-stone-900 rounded-lg overflow-hidden border border-stone-800">
              {/* West Wing Workspaces */}
              <div
                className={`absolute left-1 top-1 w-11 h-6 rounded border ${
                  activeZone === 'dompetnalar' ? 'border-sky-400 bg-sky-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('dompetnalar')}
                title="DompetNalar"
              />
              <div
                className={`absolute left-1 top-8 w-11 h-6 rounded border ${
                  activeZone === 'mobile-kasir' ? 'border-emerald-400 bg-emerald-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('mobile-kasir')}
                title="Mobile Kasir"
              />
              <div
                className={`absolute left-1 top-15 w-11 h-6 rounded border ${
                  activeZone === 'worklume' ? 'border-cyan-400 bg-cyan-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('worklume')}
                title="Worklume"
              />

              {/* Central Spine Facilities */}
              <div
                className={`absolute left-14 top-1 w-14 h-6 rounded border ${
                  activeZone === 'reception' ? 'border-amber-400 bg-amber-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('reception')}
                title="Reception Lobby"
              />
              <div
                className={`absolute left-14 top-8 w-14 h-6 rounded border ${
                  activeZone === 'collaboration_plaza' ? 'border-teal-400 bg-teal-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('collaboration_plaza')}
                title="Collaboration Plaza"
              />
              <div
                className={`absolute left-14 top-15 w-14 h-6 rounded border ${
                  activeZone === 'boardroom' ? 'border-amber-400 bg-amber-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('boardroom')}
                title="Boardroom"
              />

              {/* East Wing Workspaces */}
              <div
                className={`absolute right-1 top-1 w-11 h-6 rounded border ${
                  activeZone === 'idle-master' ? 'border-purple-400 bg-purple-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('idle-master')}
                title="IDLE MASTER"
              />
              <div
                className={`absolute right-1 top-8 w-11 h-6 rounded border ${
                  activeZone === 'idle-mining' ? 'border-amber-400 bg-amber-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('idle-mining')}
                title="Idle Mining"
              />
              <div
                className={`absolute right-1 top-15 w-11 h-6 rounded border ${
                  activeZone === 'the-broken-origin' ? 'border-violet-400 bg-violet-950/80' : 'border-stone-700 bg-stone-800/60'
                } cursor-pointer`}
                onClick={() => handleSelectZone('the-broken-origin')}
                title="The Broken Origin"
              />
            </div>
            <p className="text-[9px] text-stone-400 text-center mt-1">Klik zona untuk pan kamera</p>
          </div>
        </div>
      </div>

      {/* 4. SELECTED AGENT / WORKSPACE DETAIL INSPECTOR MODAL */}
      {selectedAgent && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-52 z-40 p-4 rounded-2xl border border-cyan-500/40 bg-stone-900/95 shadow-2xl backdrop-blur-md flex items-start justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <img
              src={ROLE_SPRITE_MAP[selectedAgent.role]}
              alt={selectedAgent.name}
              className="w-12 h-14 object-contain shrink-0 drop-shadow"
              style={{ imageRendering: 'pixelated' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedAgent.role}
                </span>
                <h4 className="text-sm font-bold text-stone-100">{selectedAgent.title}</h4>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">{selectedAgent.focus}</p>
              <p className="text-[11px] text-cyan-400 font-mono mt-1">
                Lokasi: Workspace {selectedAgent.projectSlug.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedAgent(null)}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5. BOTTOM CAMERA & WORKSPACE NAVIGATION BAR */}
      <div className="p-3 bg-stone-950/95 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {/* Overview button */}
          <button
            type="button"
            onClick={() => handleSelectZone('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              isOverview
                ? 'bg-cyan-500 text-stone-950 shadow-md shadow-cyan-500/20'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full HQ Campus</span>
          </button>

          {/* Shared Facilities */}
          <button
            type="button"
            onClick={() => handleSelectZone('reception')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1 ${
              activeZone === 'reception'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Building className="w-3 h-3 text-amber-400" />
            <span>Lobi</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectZone('collaboration_plaza')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1 ${
              activeZone === 'collaboration_plaza'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Coffee className="w-3 h-3 text-teal-400" />
            <span>Plaza</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectZone('boardroom')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1 ${
              activeZone === 'boardroom'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Users className="w-3 h-3 text-amber-400" />
            <span>Boardroom</span>
          </button>

          {/* Separator */}
          <span className="w-px h-5 bg-stone-800 mx-1" />

          {/* The 6 Project Workspaces */}
          {CANONICAL_WORKSPACES.map((ws) => {
            const isSelected = activeZone === ws.projectSlug;
            return (
              <button
                key={ws.projectSlug}
                type="button"
                onClick={() => handleSelectZone(ws.projectSlug)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700'
                }`}
              >
                {PROJECT_ICONS[ws.projectSlug] || <Building className="w-3 h-3" />}
                <span>{ws.projectName}</span>
              </button>
            );
          })}
        </div>

        {/* Project Detail Navigation Link (When workspace selected) */}
        {activeWorkspace && onNavigateDetail && (
          <button
            type="button"
            onClick={() => onNavigateDetail(activeWorkspace.projectSlug)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-1 shadow-md shadow-cyan-900/20"
          >
            <span>Halaman Detail Proyek</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
