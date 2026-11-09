import os

content = r'''import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ZoomIn,
  RotateCcw,
  Compass,
  Layers,
  Sun,
  Moon,
  Play,
  Pause,
} from 'lucide-react';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';
import {
  PROJECT_AGENT_INSTANCES,
  ProjectAgentInstance,
  CameraMode,
} from './LemburIsometricPrototype';

export interface ProductionVirtualHQCampusProps {
  reducedMotion?: boolean;
  staticFallback?: boolean;
  onSelectProjectRoom?: (projectSlug: string) => void;
  className?: string;
}

interface ViewportPreset {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  category: string;
}

export const CAMPUS_VIEWPORT_PRESETS: Record<CameraMode, ViewportPreset> = {
  OVERVIEW: { x: 0, y: 0, w: 2400, h: 1440, label: 'Full Connected HQ Campus', category: 'Campus' },
  RECEPTION: { x: 800, y: 30, w: 800, h: 440, label: 'Main Reception & Lounge', category: 'Shared' },
  DOMPETNALAR: { x: 100, y: 130, w: 780, h: 420, label: 'DompetNalar Finance Suite', category: 'Finance & Productivity' },
  IDLE_MASTER: { x: 1520, y: 130, w: 780, h: 420, label: 'IDLE MASTER Game Studio', category: 'Casual Mobile Game' },
  MOBILE_KASIR: { x: 100, y: 480, w: 780, h: 420, label: 'Mobile Kasir POS Hub', category: 'POS & Business' },
  IDLE_MINING: { x: 1520, y: 480, w: 780, h: 420, label: 'Idle Mining Production Room', category: 'Simulation Game' },
  THE_BROKEN_ORIGIN: { x: 1520, y: 830, w: 780, h: 420, label: 'The Broken Origin MMORPG', category: 'MMORPG Adventure' },
  WORKLUME: { x: 100, y: 830, w: 780, h: 420, label: 'Worklume SaaS Operations', category: 'Enterprise SaaS' },
  PLAZA: { x: 840, y: 260, w: 720, h: 400, label: 'Collaboration Lounge', category: 'Shared' },
  BOARDROOM: { x: 840, y: 980, w: 720, h: 400, label: 'Executive Boardroom', category: 'Meeting' },
};

// Autonomous Corridor Waypoint Paths
interface Waypoint {
  x: number;
  y: number;
  pauseFrames?: number;
}

interface AutonomousWalker {
  id: string;
  name: string;
  role: string;
  charAssetKey: string;
  waypoints: Waypoint[];
  currentIdx: number;
  targetIdx: number;
  x: number;
  y: number;
  speed: number;
  pauseCount: number;
  facing: 'left' | 'right' | 'down' | 'up';
}

export const INITIAL_WALKERS: AutonomousWalker[] = [
  {
    id: 'walker_lead',
    name: 'Dimas (Tech Lead)',
    role: 'COORDINATOR',
    charAssetKey: 'char_citizens_office_m_blue',
    waypoints: [
      { x: 1200, y: 240, pauseFrames: 15 },
      { x: 1200, y: 420, pauseFrames: 25 },
      { x: 1200, y: 620, pauseFrames: 20 },
      { x: 1200, y: 880, pauseFrames: 30 },
      { x: 1200, y: 620, pauseFrames: 15 },
      { x: 1200, y: 420, pauseFrames: 10 },
    ],
    currentIdx: 0,
    targetIdx: 1,
    x: 1200,
    y: 240,
    speed: 1.8,
    pauseCount: 0,
    facing: 'down',
  },
  {
    id: 'walker_dev',
    name: 'Rian (Game Scripter)',
    role: 'DEVELOPER',
    charAssetKey: 'char_citizens_casual_f_b',
    waypoints: [
      { x: 780, y: 340, pauseFrames: 20 },
      { x: 1040, y: 430, pauseFrames: 10 },
      { x: 1200, y: 430, pauseFrames: 35 },
      { x: 1360, y: 430, pauseFrames: 10 },
      { x: 1620, y: 340, pauseFrames: 25 },
      { x: 1360, y: 430, pauseFrames: 10 },
      { x: 1200, y: 430, pauseFrames: 20 },
      { x: 1040, y: 430, pauseFrames: 10 },
    ],
    currentIdx: 0,
    targetIdx: 1,
    x: 780,
    y: 340,
    speed: 1.6,
    pauseCount: 0,
    facing: 'right',
  },
  {
    id: 'walker_qa',
    name: 'Siti (QA Specialist)',
    role: 'TESTER',
    charAssetKey: 'char_citizens_office_f_c',
    waypoints: [
      { x: 780, y: 660, pauseFrames: 20 },
      { x: 1060, y: 630, pauseFrames: 15 },
      { x: 1160, y: 620, pauseFrames: 40 },
      { x: 1200, y: 820, pauseFrames: 25 },
      { x: 1060, y: 630, pauseFrames: 15 },
    ],
    currentIdx: 0,
    targetIdx: 1,
    x: 780,
    y: 660,
    speed: 1.5,
    pauseCount: 0,
    facing: 'right',
  },
];

export const ProductionVirtualHQCampus: React.FC<ProductionVirtualHQCampusProps> = ({
  reducedMotion = false,
  staticFallback = false,
  onSelectProjectRoom,
  className = '',
}) => {
  const [cameraMode, setCameraMode] = useState<CameraMode>('OVERVIEW');
  const [selectedAgent, setSelectedAgent] = useState<ProjectAgentInstance>(PROJECT_AGENT_INSTANCES[0]);
  const [lighting, setLighting] = useState<'day' | 'evening' | 'cyber'>('evening');
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(true);
  const [walkFrame, setWalkFrame] = useState<number>(0);
  const [idleTick, setIdleTick] = useState<number>(0);
  const [walkers, setWalkers] = useState<AutonomousWalker[]>(INITIAL_WALKERS);

  // Animation frame loop using requestAnimationFrame
  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion || staticFallback || !isPlayingAnimation) return;

    const animate = (timestamp: number) => {
      if (timestamp - lastTickRef.current > 110) {
        lastTickRef.current = timestamp;
        setWalkFrame((f) => (f + 1) % 8);
        setIdleTick((t) => (t + 1) % 100);

        // Update autonomous walkers along their waypoints
        setWalkers((prevWalkers) =>
          prevWalkers.map((w) => {
            if (w.pauseCount > 0) {
              return { ...w, pauseCount: w.pauseCount - 1 };
            }

            const target = w.waypoints[w.targetIdx];
            const dx = target.x - w.x;
            const dy = target.y - w.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < w.speed + 1) {
              // Reached waypoint
              const nextIdx = (w.targetIdx + 1) % w.waypoints.length;
              return {
                ...w,
                x: target.x,
                y: target.y,
                currentIdx: w.targetIdx,
                targetIdx: nextIdx,
                pauseCount: target.pauseFrames || 0,
              };
            }

            // Step toward target
            const nextX = w.x + (dx / dist) * w.speed;
            const nextY = w.y + (dy / dist) * w.speed;
            const facing: 'left' | 'right' | 'down' | 'up' =
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? 'right'
                  : 'left'
                : dy > 0
                ? 'down'
                : 'up';

            return {
              ...w,
              x: nextX,
              y: nextY,
              facing,
            };
          })
        );
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [reducedMotion, staticFallback, isPlayingAnimation]);

  const framePadded = walkFrame.toString().padStart(2, '0');
  const currentViewport = CAMPUS_VIEWPORT_PRESETS[cameraMode] || CAMPUS_VIEWPORT_PRESETS.OVERVIEW;

  const handleRoomClick = (mode: CameraMode, slug?: string) => {
    setCameraMode(mode);
    if (slug && onSelectProjectRoom) {
      onSelectProjectRoom(slug);
    }
  };

  /* Helper to render workstations using real pixel-art PNG sprites */
  const renderWorkstation = (
    key: string,
    x: number,
    y: number,
    agent: ProjectAgentInstance
  ) => {
    const isSelected = selectedAgent?.instanceId === agent.instanceId;
    const idleOffset = !reducedMotion && isPlayingAnimation ? Math.sin(idleTick * 0.3) * 1.2 : 0;

    return (
      <g
        key={key}
        className="cursor-pointer group select-none"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAgent(agent);
        }}
      >
        {/* Office Chair (behind desk) */}
        <image
          href="/assets/virtual-office/b344/furniture/ergonomic_office_chair.png"
          x={x - 24}
          y={y - 20}
          width="48"
          height="48"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Human Agent Sprite (Standing/Working at Desk) */}
        <image
          href={`/assets/virtual-office/b344/characters/modern-citizens/frames/${agent.charAssetKey}/stand_${agent.facing === 'side' ? 'side' : 'down'}.png`}
          x={x - 26}
          y={y - 38 + idleOffset}
          width="52"
          height="52"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Desk Base */}
        <image
          href="/assets/virtual-office/b344/furniture/office_desk.png"
          x={x - 32}
          y={y - 12}
          width="64"
          height="64"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Desktop Monitor Display */}
        <image
          href="/assets/virtual-office/b344/furniture/office_monitor.png"
          x={x - 32}
          y={y - 24}
          width="64"
          height="64"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Activity & Targeting Indicator on Selected / Hover */}
        {isSelected && (
          <g>
            <circle
              cx={x}
              cy={y + 10}
              r="28"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              className="animate-spin"
            />
            <rect
              x={x - 45}
              y={y - 56}
              width="90"
              height="16"
              rx="4"
              fill="#082f49"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            <text
              x={x}
              y={y - 45}
              fill="#bae6fd"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {agent.displayName.split(' ')[0]} ({agent.role})
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className={`w-full bg-[#080a10] border border-stone-800 rounded-3xl overflow-hidden shadow-2xl text-stone-100 font-sans ${className}`}>
      {/* 1. Campus Header & Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-800/80 bg-stone-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Connected Isometric Virtual HQ Campus
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                30 Active Agents
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hidden sm:inline-block">
                $0.00 Verified
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-100">
              Cozy Pixel-Art Modern Development Complex
            </h3>
          </div>
        </div>

        {/* Global HUD Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Animation Play/Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
            className={`p-2 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
              isPlayingAnimation
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-stone-950 text-stone-400 border border-stone-800'
            }`}
            title={isPlayingAnimation ? 'Pause Corridor Walk Cycle' : 'Resume Corridor Walk Cycle'}
          >
            {isPlayingAnimation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Animation</span>
          </button>

          {/* Lighting Selector */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setLighting('day')}
              className={`p-1.5 rounded-lg transition-all ${
                lighting === 'day' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50' : 'text-stone-400'
              }`}
              title="Day Bright Ambient"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLighting('evening')}
              className={`p-1.5 rounded-lg transition-all ${
                lighting === 'evening' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50' : 'text-stone-400'
              }`}
              title="Cozy Warm Evening"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLighting('cyber')}
              className={`p-1.5 rounded-lg transition-all ${
                lighting === 'cyber' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-stone-400'
              }`}
              title="Studio Cyber Glow"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Return to Overview */}
          {cameraMode !== 'OVERVIEW' && (
            <button
              type="button"
              onClick={() => setCameraMode('OVERVIEW')}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Full Campus</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Room Camera Quick Switcher */}
      <div className="px-4 py-2.5 bg-stone-900/60 border-b border-stone-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[11px] font-mono text-stone-400 uppercase shrink-0 mr-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fokus Kamera:</span>
        </span>
        {(Object.keys(CAMPUS_VIEWPORT_PRESETS) as CameraMode[]).map((mode) => {
          const preset = CAMPUS_VIEWPORT_PRESETS[mode];
          const isActive = cameraMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => handleRoomClick(mode)}
              className={`px-3 py-1 rounded-xl font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm font-bold'
                  : 'bg-stone-950/80 text-stone-400 hover:text-stone-200 border border-stone-800/80'
              }`}
            >
              {mode === 'OVERVIEW' ? <RotateCcw className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Stage: High-Angle Isometric Campus SVG Viewport */}
      <div className="relative w-full aspect-[12/7] bg-[#07090e] overflow-hidden select-none">
        {/* Dynamic Ambient Background Lighting */}
        <div
          className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
            lighting === 'day'
              ? 'bg-gradient-to-tr from-sky-950/20 via-amber-950/10 to-amber-500/10'
              : lighting === 'evening'
              ? 'bg-gradient-to-tr from-stone-950 via-amber-950/20 to-orange-500/15'
              : 'bg-gradient-to-tr from-stone-950 via-cyan-950/30 to-violet-500/15'
          }`}
        />

        <svg
          viewBox={`${currentViewport.x} ${currentViewport.y} ${currentViewport.w} ${currentViewport.h}`}
          className="w-full h-full"
          style={{
            transition: reducedMotion ? 'none' : 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            imageRendering: 'pixelated',
          }}
        >
          <defs>
            <filter id="campus-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.65" />
            </filter>

            {/* Pattern: Office Carpet Tile */}
            <pattern id="carpet-pattern" width="64" height="32" patternUnits="userSpaceOnUse">
              <image
                href="/assets/virtual-office/b344/floor/floor_office_carpet_tile.png"
                x="0"
                y="-32"
                width="64"
                height="64"
                style={{ imageRendering: 'pixelated' }}
              />
            </pattern>

            {/* Pattern: Parquet Floor */}
            <pattern id="parquet-pattern" width="64" height="32" patternUnits="userSpaceOnUse">
              <image
                href="/assets/virtual-office/b344/floor/floor_parquet.png"
                x="0"
                y="-32"
                width="64"
                height="64"
                style={{ imageRendering: 'pixelated' }}
              />
            </pattern>

            {/* Pattern: Rich Wood Floor */}
            <pattern id="wood-pattern" width="64" height="32" patternUnits="userSpaceOnUse">
              <image
                href="/assets/virtual-office/b344/floor/floor_wood.png"
                x="0"
                y="-32"
                width="64"
                height="64"
                style={{ imageRendering: 'pixelated' }}
              />
            </pattern>

            {/* Pattern: Luxury Red Boardroom Carpet */}
            <pattern id="red-carpet-pattern" width="64" height="32" patternUnits="userSpaceOnUse">
              <image
                href="/assets/virtual-office/b344/floor/floor_carpet_red.png"
                x="0"
                y="-32"
                width="64"
                height="64"
                style={{ imageRendering: 'pixelated' }}
              />
            </pattern>
          </defs>

          {/* ══════ 1. UNIFIED ARCHITECTURAL FOUNDATION & MAIN CORRIDOR ══════ */}
          {/* Main concrete foundation perimeter */}
          <polygon
            points="1200,20 2360,690 1200,1400 40,690"
            fill="#12141c"
            stroke="#272a38"
            strokeWidth="3"
          />

          {/* Grand Interconnected Office Carpet Runner & Hallways */}
          <polygon
            points="1200,35 2320,690 1200,1380 80,690"
            fill="url(#carpet-pattern)"
            stroke="#3b3f54"
            strokeWidth="1"
          />

          {/* Central Pedestrian Corridor Highlight Path */}
          <polygon
            points="1200,80 1380,180 1380,1260 1200,1360 1020,1260 1020,180"
            fill="#181b26"
            stroke="#475569"
            strokeWidth="1"
            opacity="0.85"
          />

          {/* ══════ 2. PERIMETER CUTAWAY ARCHITECTURAL WALLS ══════ */}
          {/* North-West Perimeter Wall Run (Outer Building Envelope) */}
          <g id="envelope-northwest">
            <polygon
              points="80,690 1200,35 1200,-35 80,620"
              fill="#262938"
              stroke="#171822"
              strokeWidth="2"
            />
            {/* Office Glass Windows along NW Wall */}
            {[200, 420, 640, 860, 1080].map((wx, idx) => (
              <image
                key={`win_nw_${idx}`}
                href="/assets/virtual-office/b344/walls/wall_office_window_left.png"
                x={wx}
                y={620 - (wx - 80) * 0.58}
                width="64"
                height="128"
                style={{ imageRendering: 'pixelated' }}
                opacity="0.9"
              />
            ))}
          </g>

          {/* North-East Perimeter Wall Run (Outer Building Envelope) */}
          <g id="envelope-northeast">
            <polygon
              points="1200,35 2320,690 2320,620 1200,-35"
              fill="#1e202c"
              stroke="#171822"
              strokeWidth="2"
            />
            {/* Office Glass Windows along NE Wall */}
            {[1260, 1480, 1700, 1920, 2140].map((wx, idx) => (
              <image
                key={`win_ne_${idx}`}
                href="/assets/virtual-office/b344/walls/wall_office_window_right.png"
                x={wx}
                y={-35 + (wx - 1200) * 0.58}
                width="64"
                height="128"
                style={{ imageRendering: 'pixelated' }}
                opacity="0.9"
              />
            ))}
          </g>

          {/* ══════ 3. MAIN ENTRANCE & RECEPTION AREA (North) ══════ */}
          <g
            id="area-reception"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('RECEPTION')}
          >
            {/* Reception Polished Parquet Floor */}
            <polygon
              points="1200,45 1580,240 1200,430 820,240"
              fill="url(#parquet-pattern)"
              stroke="#06b6d4"
              strokeWidth="1"
            />

            {/* Corporate SleepyKoala Studio Wall Signage Banner */}
            <rect x="1130" y="2" width="140" height="26" rx="4" fill="#0b1120" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="1200" y="19" fill="#22d3ee" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              SLEEPYKOALA HQ
            </text>

            {/* Reception Front Desk & Terminal */}
            <image
              href="/assets/virtual-office/b344/furniture/office_desk.png"
              x="1168"
              y="200"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/office_monitor.png"
              x="1178"
              y="186"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Receptionist Coworker */}
            <image
              href="/assets/virtual-office/b344/characters/modern-citizens/frames/char_citizens_office_m_blue/stand_down.png"
              x="1174"
              y="160"
              width="52"
              height="52"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Waiting Lounge Crimson Sofas & Coffee Tables */}
            <image
              href="/assets/virtual-office/b344/furniture/sofa_red_a.png"
              x="920"
              y="220"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/table_dining_a.png"
              x="960"
              y="260"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/sofa_red_b.png"
              x="1420"
              y="220"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/table_dining_a.png"
              x="1380"
              y="260"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Ambient Lighting & Decorative Indoor Plants */}
            <image
              href="/assets/virtual-office/b344/furniture/lamp_floor_a.png"
              x="870"
              y="180"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/lamp_floor_b.png"
              x="1470"
              y="180"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/potted_plant.png"
              x="840"
              y="220"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/potted_plant.png"
              x="1510"
              y="220"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
          </g>

          {/* ══════ 4. SHARED AREA: COLLABORATION LOUNGE PLAZA (Center) ══════ */}
          <g
            id="area-plaza"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('PLAZA')}
          >
            {/* Plaza Wood Parquet Floor */}
            <polygon
              points="1200,280 1480,420 1200,560 920,420"
              fill="url(#parquet-pattern)"
              stroke="#64748b"
              strokeWidth="1"
            />
            {/* Area Rug */}
            <polygon
              points="1200,320 1400,420 1200,520 1000,420"
              fill="#2b1810"
              stroke="#9a3412"
              strokeWidth="1"
              opacity="0.9"
            />

            <rect x="1145" y="295" width="110" height="18" rx="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.8" />
            <text x="1200" y="308" fill="#cbd5e1" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              COLLABORATION PLAZA
            </text>

            {/* Brainstorm Whiteboard & Corkboard */}
            <image
              href="/assets/virtual-office/b344/furniture/whiteboard.png"
              x="1168"
              y="320"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/cork_board.png"
              x="1080"
              y="320"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Dual Red Loungers & Discussion Table */}
            <image
              href="/assets/virtual-office/b344/furniture/sofa_red_a.png"
              x="1100"
              y="390"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/sofa_red_b.png"
              x="1240"
              y="390"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/table_dining_a.png"
              x="1170"
              y="420"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Planter Shelves & Bookshelf Dividers */}
            <image
              href="/assets/virtual-office/b344/furniture/planter_divider_shelf.png"
              x="960"
              y="380"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/planter_divider_shelf.png"
              x="1380"
              y="380"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/bookshelf.png"
              x="1040"
              y="440"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
          </g>

          {/* ══════ 5. SHARED AREA: PANTRY & BEVERAGE HUB (Center-South) ══════ */}
          <g
            id="area-pantry"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('OVERVIEW')}
          >
            {/* Pantry Tile Floor */}
            <polygon
              points="1200,560 1440,680 1200,800 960,680"
              fill="#1e1b18"
              stroke="#b45309"
              strokeWidth="1"
            />
            <rect x="1145" y="562" width="110" height="16" rx="3" fill="#1c1917" stroke="#b45309" strokeWidth="0.8" />
            <text x="1200" y="574" fill="#fde68a" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              PANTRY &amp; BREAK HUB
            </text>

            {/* Coffee Machine & Water Dispenser & Vending Machine */}
            <image
              href="/assets/virtual-office/b344/furniture/coffee_machine.png"
              x="1130"
              y="600"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/water_cooler.png"
              x="1050"
              y="610"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/vending_snack.png"
              x="1310"
              y="600"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Bar Dining Table & Dining Chairs */}
            <image
              href="/assets/virtual-office/b344/furniture/table_dining_b.png"
              x="1170"
              y="650"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/chair_a.png"
              x="1130"
              y="660"
              width="48"
              height="48"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/chair_b.png"
              x="1230"
              y="660"
              width="48"
              height="48"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/waste_bin.png"
              x="1020"
              y="650"
              width="48"
              height="48"
              style={{ imageRendering: 'pixelated' }}
            />
          </g>

          {/* ══════ 6. SHARED AREA: CENTRAL MEETING ROOM ══════ */}
          <g
            id="area-meeting"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('BOARDROOM')}
          >
            {/* Meeting Room Blue Floor */}
            <polygon
              points="1200,780 1520,940 1200,1100 880,940"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <rect x="1130" y="785" width="140" height="20" rx="3" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1" />
            <text x="1200" y="799" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              CENTRAL MEETING ROOM
            </text>

            {/* Entrance Doorway Arch (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="960"
              y="850"
              width="80"
              height="160"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Large Conference Table & 8 Ergonomic Chairs */}
            <image
              href="/assets/virtual-office/b344/furniture/table_dining_a.png"
              x="1140"
              y="880"
              width="120"
              height="90"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Conference Chairs Around Table */}
            <image href="/assets/virtual-office/b344/furniture/office_chair.png" x="1110" y="860" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/office_chair.png" x="1170" y="840" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/office_chair.png" x="1240" y="860" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/office_chair.png" x="1110" y="930" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/office_chair.png" x="1170" y="950" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/office_chair.png" x="1240" y="930" width="48" height="48" style={{ imageRendering: 'pixelated' }} />

            {/* Wall Presentation Display & Whiteboard */}
            <image
              href="/assets/virtual-office/b344/furniture/whiteboard.png"
              x="1168"
              y="820"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/potted_plant.png"
              x="1340"
              y="890"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
          </g>

          {/* ══════ 7. SHARED AREA: EXECUTIVE BOARDROOM (South) ══════ */}
          <g
            id="area-boardroom"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('BOARDROOM')}
          >
            {/* Luxury Red Boardroom Carpet */}
            <polygon
              points="1200,1080 1520,1240 1200,1400 880,1240"
              fill="url(#red-carpet-pattern)"
              stroke="#dc2626"
              strokeWidth="1.5"
            />
            <rect x="1135" y="1085" width="130" height="20" rx="3" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1" />
            <text x="1200" y="1099" fill="#fef2f2" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              EXECUTIVE BOARDROOM
            </text>

            {/* Long Boardroom Conference Table & Executive Chairs */}
            <image
              href="/assets/virtual-office/b344/furniture/table_dining_a.png"
              x="1130"
              y="1170"
              width="140"
              height="90"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Grandfather Clock & Doc Storage Bookshelf */}
            <image
              href="/assets/virtual-office/b344/furniture/clock_grandfather_a.png"
              x="1020"
              y="1150"
              width="64"
              height="96"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/bookshelf.png"
              x="1360"
              y="1160"
              width="64"
              height="64"
              style={{ imageRendering: 'pixelated' }}
            />
            <image
              href="/assets/virtual-office/b344/furniture/plant_pot_a.png"
              x="1340"
              y="1250"
              width="48"
              height="48"
              style={{ imageRendering: 'pixelated' }}
            />
          </g>

          {/* ══════ 8. ROOM 1: DOMPETNALAR FINANCE SUITE (North-West) ══════ */}
          <g
            id="area-dompetnalar"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('DOMPETNALAR', 'dompetnalar')}
          >
            {/* Room Floor Plane */}
            <polygon
              points="480,150 820,320 480,490 140,320"
              fill="#172554"
              stroke="#3b82f6"
              strokeWidth="1.5"
            />
            {/* Rear NW Back Wall */}
            <polygon
              points="140,320 480,150 480,90 140,260"
              fill="#1e3a8a"
              stroke="#1e40af"
              strokeWidth="1"
            />
            {/* East Partition Wall Dividing from Corridor */}
            <polygon
              points="480,150 820,320 820,260 480,90"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Doorway Archway (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="760"
              y="220"
              width="64"
              height="128"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Room Label Badge */}
            <rect x="420" y="100" width="120" height="20" rx="4" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
            <text x="480" y="114" fill="#dbeafe" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              DOMPETNALAR
            </text>

            {/* Wall Whiteboard & Specialty Finance Props */}
            <image href="/assets/virtual-office/b344/furniture/whiteboard.png" x="340" y="130" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/filing_cabinet.png" x="220" y="210" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/laser_printer.png" x="280" y="230" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/copy_paper_box_stack.png" x="180" y="260" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/potted_plant.png" x="220" y="340" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/waste_bin.png" x="680" y="360" width="48" height="48" style={{ imageRendering: 'pixelated' }} />

            {/* 5 Dedicated Workstations & Agents */}
            {renderWorkstation('ws_d1', 340, 270, PROJECT_AGENT_INSTANCES[0])}
            {renderWorkstation('ws_d2', 480, 270, PROJECT_AGENT_INSTANCES[1])}
            {renderWorkstation('ws_d3', 620, 270, PROJECT_AGENT_INSTANCES[2])}
            {renderWorkstation('ws_d4', 410, 350, PROJECT_AGENT_INSTANCES[3])}
            {renderWorkstation('ws_d5', 550, 350, PROJECT_AGENT_INSTANCES[4])}
          </g>

          {/* ══════ 9. ROOM 2: IDLE MASTER GAME STUDIO (North-East) ══════ */}
          <g
            id="area-idlemaster"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('IDLE_MASTER', 'idle-master')}
          >
            {/* Parquet Game Studio Floor */}
            <polygon
              points="1920,150 2260,320 1920,490 1580,320"
              fill="url(#parquet-pattern)"
              stroke="#a855f7"
              strokeWidth="1.5"
            />
            {/* Rear NE Back Wall */}
            <polygon
              points="1580,320 1920,150 1920,90 1580,260"
              fill="#3b0764"
              stroke="#581c87"
              strokeWidth="1"
            />
            {/* Partition Wall */}
            <polygon
              points="1920,150 2260,320 2260,260 1920,90"
              fill="#1e1b4b"
              stroke="#312e81"
              strokeWidth="1"
            />
            {/* Doorway Archway (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="1600"
              y="220"
              width="64"
              height="128"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Room Label Badge */}
            <rect x="1860" y="100" width="120" height="20" rx="4" fill="#581c87" stroke="#c084fc" strokeWidth="1" />
            <text x="1920" y="114" fill="#f3e8ff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              IDLE MASTER
            </text>

            {/* Retro Arcade Machine Cabinet & Props */}
            <image href="/assets/virtual-office/b344/furniture/arcade_cabinet.png" x="2140" y="270" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/cork_board.png" x="1800" y="140" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/whiteboard.png" x="1980" y="130" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/bookshelf.png" x="2140" y="210" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/sofa_red_b.png" x="2100" y="340" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/coffee_machine.png" x="1720" y="210" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/lamp_floor_b.png" x="1680" y="230" width="64" height="64" style={{ imageRendering: 'pixelated' }} />

            {/* 5 Workstations & Agents */}
            {renderWorkstation('ws_im1', 1780, 270, PROJECT_AGENT_INSTANCES[5])}
            {renderWorkstation('ws_im2', 1920, 270, PROJECT_AGENT_INSTANCES[6])}
            {renderWorkstation('ws_im3', 2060, 270, PROJECT_AGENT_INSTANCES[7])}
            {renderWorkstation('ws_im4', 1850, 350, PROJECT_AGENT_INSTANCES[8])}
            {renderWorkstation('ws_im5', 1990, 350, PROJECT_AGENT_INSTANCES[9])}
          </g>

          {/* ══════ 10. ROOM 3: MOBILE KASIR POS HUB (Mid-West) ══════ */}
          <g
            id="area-kasir"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('MOBILE_KASIR', 'mobile-kasir')}
          >
            {/* Charcoal Slate Floor */}
            <polygon
              points="480,500 820,670 480,840 140,670"
              fill="#1c1917"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            {/* Rear Wall */}
            <polygon
              points="140,670 480,500 480,440 140,610"
              fill="#292524"
              stroke="#44403c"
              strokeWidth="1"
            />
            {/* Doorway Archway (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="760"
              y="570"
              width="64"
              height="128"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Room Label Badge */}
            <rect x="420" y="450" width="120" height="20" rx="4" fill="#78350f" stroke="#fbbf24" strokeWidth="1" />
            <text x="480" y="464" fill="#fef3c7" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              MOBILE KASIR
            </text>

            {/* Specialty Cashier POS Counter & Retail Merch Props */}
            <image href="/assets/virtual-office/b344/furniture/pos_counter.png" x="220" y="620" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/planter_divider_shelf.png" x="220" y="540" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/whiteboard.png" x="380" y="480" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/laser_printer.png" x="290" y="580" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/copy_paper_box_stack.png" x="180" y="600" width="48" height="48" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/waste_bin.png" x="680" y="710" width="48" height="48" style={{ imageRendering: 'pixelated' }} />

            {/* 5 Workstations & Agents */}
            {renderWorkstation('ws_k1', 340, 620, PROJECT_AGENT_INSTANCES[10])}
            {renderWorkstation('ws_k2', 480, 620, PROJECT_AGENT_INSTANCES[11])}
            {renderWorkstation('ws_k3', 620, 620, PROJECT_AGENT_INSTANCES[12])}
            {renderWorkstation('ws_k4', 410, 700, PROJECT_AGENT_INSTANCES[13])}
            {renderWorkstation('ws_k5', 550, 700, PROJECT_AGENT_INSTANCES[14])}
          </g>

          {/* ══════ 11. ROOM 4: IDLE MINING PRODUCTION ROOM (Mid-East) ══════ */}
          <g
            id="area-mining"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('IDLE_MINING', 'idle-mining-empire')}
          >
            {/* Earth Stone Floor */}
            <polygon
              points="1920,500 2260,670 1920,840 1580,670"
              fill="#27272a"
              stroke="#ea580c"
              strokeWidth="1.5"
            />
            {/* Rear Wall */}
            <polygon
              points="1580,670 1920,500 1920,440 1580,610"
              fill="#3f3f46"
              stroke="#52525b"
              strokeWidth="1"
            />
            {/* Doorway Archway (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="1600"
              y="570"
              width="64"
              height="128"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Room Label Badge */}
            <rect x="1860" y="450" width="120" height="20" rx="4" fill="#7c2d12" stroke="#fdba74" strokeWidth="1" />
            <text x="1920" y="464" fill="#ffedd5" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              IDLE MINING
            </text>

            {/* Server Rack & Telemetry Props */}
            <image href="/assets/virtual-office/b344/furniture/server_rack.png" x="2140" y="550" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/whiteboard.png" x="1980" y="480" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/bookshelf.png" x="2140" y="620" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/water_cooler.png" x="1720" y="550" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/waste_bin.png" x="2060" y="710" width="48" height="48" style={{ imageRendering: 'pixelated' }} />

            {/* 5 Workstations & Agents */}
            {renderWorkstation('ws_m1', 1780, 620, PROJECT_AGENT_INSTANCES[15])}
            {renderWorkstation('ws_m2', 1920, 620, PROJECT_AGENT_INSTANCES[16])}
            {renderWorkstation('ws_m3', 2060, 620, PROJECT_AGENT_INSTANCES[17])}
            {renderWorkstation('ws_m4', 1850, 700, PROJECT_AGENT_INSTANCES[18])}
            {renderWorkstation('ws_m5', 1990, 700, PROJECT_AGENT_INSTANCES[19])}
          </g>

          {/* ══════ 12. ROOM 5: THE BROKEN ORIGIN MMORPG STUDIO (South-East) ══════ */}
          <g
            id="area-brokenorigin"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('THE_BROKEN_ORIGIN', 'the-broken-origin')}
          >
            {/* Rich Wood Floor */}
            <polygon
              points="1920,850 2260,1020 1920,1190 1580,1020"
              fill="url(#wood-pattern)"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            {/* Rear Wall */}
            <polygon
              points="1580,1020 1920,850 1920,790 1580,960"
              fill="#450a0a"
              stroke="#7f1d1d"
              strokeWidth="1"
            />
            {/* Doorway Archway (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="1600"
              y="920"
              width="64"
              height="128"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Room Label Badge */}
            <rect x="1850" y="800" width="140" height="20" rx="4" fill="#991b1b" stroke="#fca5a5" strokeWidth="1" />
            <text x="1920" y="814" fill="#fee2e2" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              THE BROKEN ORIGIN
            </text>

            {/* World Map Whiteboard & Lore Bookshelf */}
            <image href="/assets/virtual-office/b344/furniture/whiteboard.png" x="1980" y="830" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/cork_board.png" x="1780" y="830" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/bookshelf.png" x="2140" y="900" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/server_rack.png" x="1720" y="890" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/potted_plant.png" x="2140" y="1000" width="64" height="64" style={{ imageRendering: 'pixelated' }} />

            {/* 5 Workstations & Agents */}
            {renderWorkstation('ws_t1', 1780, 970, PROJECT_AGENT_INSTANCES[20])}
            {renderWorkstation('ws_t2', 1920, 970, PROJECT_AGENT_INSTANCES[21])}
            {renderWorkstation('ws_t3', 2060, 970, PROJECT_AGENT_INSTANCES[22])}
            {renderWorkstation('ws_t4', 1850, 1050, PROJECT_AGENT_INSTANCES[23])}
            {renderWorkstation('ws_t5', 1990, 1050, PROJECT_AGENT_INSTANCES[24])}
          </g>

          {/* ══════ 13. ROOM 6: WORKLUME SAAS OPERATIONS (South-West) ══════ */}
          <g
            id="area-worklume"
            className="cursor-pointer group"
            onClick={() => handleRoomClick('WORKLUME', 'worklume')}
          >
            {/* Dark Slate Floor */}
            <polygon
              points="480,850 820,1020 480,1190 140,1020"
              fill="#09090b"
              stroke="#06b6d4"
              strokeWidth="1.5"
            />
            {/* Rear Wall */}
            <polygon
              points="140,1020 480,850 480,790 140,960"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="1"
            />
            {/* Doorway Archway (Kenney) */}
            <image
              href="/assets/virtual-office/b344/architecture/doorOpen_E.png"
              x="760"
              y="920"
              width="64"
              height="128"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Room Label Badge */}
            <rect x="420" y="800" width="120" height="20" rx="4" fill="#082f49" stroke="#38bdf8" strokeWidth="1" />
            <text x="480" y="814" fill="#e0f2fe" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              WORKLUME SAAS
            </text>

            {/* Cloud Server Cluster & Kanban Board */}
            <image href="/assets/virtual-office/b344/furniture/server_rack.png" x="220" y="890" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/whiteboard.png" x="380" y="830" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/cork_board.png" x="550" y="830" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/multifunction_printer.png" x="700" y="880" width="64" height="64" style={{ imageRendering: 'pixelated' }} />
            <image href="/assets/virtual-office/b344/furniture/filing_cabinet.png" x="250" y="960" width="64" height="64" style={{ imageRendering: 'pixelated' }} />

            {/* 5 Workstations & Agents */}
            {renderWorkstation('ws_w1', 340, 970, PROJECT_AGENT_INSTANCES[25])}
            {renderWorkstation('ws_w2', 480, 970, PROJECT_AGENT_INSTANCES[26])}
            {renderWorkstation('ws_w3', 620, 970, PROJECT_AGENT_INSTANCES[27])}
            {renderWorkstation('ws_w4', 410, 1050, PROJECT_AGENT_INSTANCES[28])}
            {renderWorkstation('ws_w5', 550, 1050, PROJECT_AGENT_INSTANCES[29])}
          </g>

          {/* ══════ 14. AUTONOMOUS ROAMING COWORKERS (Corridor Life) ══════ */}
          {walkers.map((w) => {
            const isPaused = w.pauseCount > 0;
            const spriteFile = isPaused
              ? 'stand_down.png'
              : `walk_${w.facing === 'up' ? 'up' : 'side'}_${framePadded}.png`;
            const isFlipped = w.facing === 'left';

            return (
              <g
                key={w.id}
                className="pointer-events-none select-none transition-transform"
                style={{
                  transform: isFlipped ? `scale(-1, 1) translate(-${w.x * 2 + 54}px, 0)` : undefined,
                }}
              >
                {/* Coworker Drop Shadow */}
                <ellipse
                  cx={w.x + 27}
                  cy={w.y + 46}
                  rx="14"
                  ry="6"
                  fill="#000"
                  opacity="0.45"
                />

                {/* Animated Sprite */}
                <image
                  href={`/assets/virtual-office/b344/characters/modern-citizens/frames/${w.charAssetKey}/${spriteFile}`}
                  x={w.x}
                  y={w.y}
                  width="54"
                  height="54"
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Live Nameplate on Hover */}
                <rect
                  x={w.x - 10}
                  y={w.y - 12}
                  width="74"
                  height="12"
                  rx="2"
                  fill="#020617"
                  stroke="#38bdf8"
                  strokeWidth="0.6"
                  opacity="0.85"
                />
                <text
                  x={w.x + 27}
                  y={w.y - 3}
                  fill="#38bdf8"
                  fontSize="7"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {w.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Radar HUD in bottom-right corner */}
        <div className="absolute bottom-3 right-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-xl backdrop-blur-md max-w-[210px] text-xs space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Compass className="w-3 h-3" /> HQ Radar
            </span>
            <span className="text-[9px] font-mono text-stone-400">
              {cameraMode === 'OVERVIEW' ? '1.0x Full' : '2.2x Zoom'}
            </span>
          </div>
          <p className="text-[10px] text-stone-300 leading-tight">
            6 studio terpadu + 4 area bersama. Klik ruang mana saja untuk zoom.
          </p>
        </div>
      </div>

      {/* 4. Live Agent Inspector Panel */}
      {selectedAgent && (
        <div className="p-4 sm:p-5 bg-stone-900/95 border-t border-stone-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-stone-950 border border-cyan-500/40 p-1 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={`/assets/virtual-office/b344/characters/modern-citizens/frames/${selectedAgent.charAssetKey}/stand_down.png`}
                alt={selectedAgent.displayName}
                className="w-12 h-12 object-contain [image-rendering:pixelated]"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-stone-100">{selectedAgent.displayName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  {selectedAgent.role}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300">
                  {selectedAgent.projectName}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs text-stone-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  <strong className="text-stone-400 font-normal">Tugas Simulasi: </strong>
                  <span className="text-amber-200">{selectedAgent.activity}</span>
                </span>
                <span className="text-stone-500 font-mono text-[11px]">ID: {selectedAgent.instanceId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
            <div className="text-right text-[11px] font-mono text-stone-400 hidden lg:block mr-2">
              <div>Aset: <strong className="text-stone-200">Modern Citizens (CC0)</strong></div>
              <div className="text-emerald-400 font-bold">{VIRTUAL_OFFICE_SIMULATION_LABEL}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                const k = selectedAgent.projectId.toUpperCase().replace(/-/g, '_') as CameraMode;
                if (CAMPUS_VIEWPORT_PRESETS[k]) setCameraMode(k);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Zoom Ruang {selectedAgent.projectName}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
'''

dest_path = r"src\components\virtual-office\ProductionVirtualHQCampus.tsx"
with open(dest_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Successfully wrote {dest_path} ({len(content)} bytes)")
