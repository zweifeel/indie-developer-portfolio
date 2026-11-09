import React from 'react';
import { ProjectRoomConfig, AgentCrewMember, VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';
import { PixelAgentAvatar } from './PixelAgentAvatar';

export interface PixelIsometricCanvasProps {
  room: ProjectRoomConfig;
  reducedMotion?: boolean;
  staticFallback?: boolean;
  onSelectAgent?: (agent: AgentCrewMember) => void;
  selectedAgentId?: string | null;
  className?: string;
  isCloseUp?: boolean;
  onSelectRoom?: () => void;
}

export const PixelIsometricCanvas: React.FC<PixelIsometricCanvasProps> = ({
  room,
  reducedMotion = false,
  staticFallback = false,
  onSelectAgent,
  selectedAgentId = null,
  className = '',
  isCloseUp = false,
  onSelectRoom,
}) => {
  const { themeStyle, agents, projectName, category } = room;
  const isAnimated = !reducedMotion && !staticFallback;

  // Determine category-specific equipment
  const isAndroid =
    category.toLowerCase().includes('android') ||
    category.toLowerCase().includes('finance') ||
    category.toLowerCase().includes('business') ||
    category.toLowerCase().includes('pos') ||
    category.toLowerCase().includes('tools');
  const isGameOrMMO =
    category.toLowerCase().includes('game') ||
    category.toLowerCase().includes('roblox') ||
    category.toLowerCase().includes('mmorpg') ||
    category.toLowerCase().includes('casual');

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-stone-800 bg-[#141210] select-none transition-shadow shadow-2xl ${
        onSelectRoom ? 'cursor-pointer hover:border-cyan-500/50 hover:shadow-cyan-950/30' : ''
      } ${className}`}
      style={{
        minHeight: isCloseUp ? '480px' : '400px',
      }}
      onClick={(e) => {
        // If clicking background and onSelectRoom is provided, trigger it
        if (e.target === e.currentTarget && onSelectRoom) {
          onSelectRoom();
        }
      }}
    >
      {/* 1. Mandatory Simulation Badge & Context Header */}
      <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-stone-950/90 backdrop-blur-md shadow-md">
          <span className={`w-2 h-2 rounded-full bg-cyan-400 ${isAnimated ? 'animate-ping' : ''}`} />
          <span className="text-[11px] font-mono font-medium text-cyan-300">
            {VIRTUAL_OFFICE_SIMULATION_LABEL}
          </span>
        </div>

        <div className="px-3.5 py-1 rounded-xl border border-stone-800/90 bg-stone-900/95 text-right backdrop-blur-sm shadow-md">
          <p className="text-xs font-bold text-stone-100">{projectName}</p>
          <p className="text-[10px] font-mono text-cyan-400">{category}</p>
        </div>
      </div>

      {/* 2. Cozy Studio Warm Lighting Wash */}
      <div
        className="absolute inset-0 pointer-events-none -z-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${themeStyle.ambientGlow || 'rgba(245, 158, 11, 0.16)'}, transparent 75%)`,
        }}
      />

      {/* 3. 2:1 Dimetric Isometric Environment Layers */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 520"
        preserveAspectRatio="xMidYMid meet"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <defs>
          {/* Parquet Floor Pattern on 64x32 Dimetric Tile */}
          <pattern id={`parquetTile_${room.id}`} width="64" height="32" patternUnits="userSpaceOnUse">
            <polygon points="32,0 64,16 32,32 0,16" fill="#784824" />
            <polygon points="32,1 62,16 32,31 2,16" fill="#8b5a2b" />
            <polygon points="32,2 60,16 32,30 4,16" fill="#9c6e42" />
            <line x1="16" y1="8" x2="48" y2="24" stroke="#5c3a1e" strokeWidth="1" />
            <line x1="48" y1="8" x2="16" y2="24" stroke="#6f421a" strokeWidth="1" />
          </pattern>

          {/* Left Wall Warm Plaster Gradient */}
          <linearGradient id={`wallLeftGrad_${room.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5ebe0" stopOpacity="0.98" />
            <stop offset="60%" stopColor="#e3d5ca" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d5bdaf" stopOpacity="0.92" />
          </linearGradient>

          {/* Right Wall Shaded Plaster Gradient */}
          <linearGradient id={`wallRightGrad_${room.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8dfd8" stopOpacity="0.96" />
            <stop offset="60%" stopColor="#d6c7bc" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#c4b5a5" stopOpacity="0.88" />
          </linearGradient>

          {/* Floor Shadow Ambient Gradient */}
          <linearGradient id={`floorContactShadow_${room.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e130c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1e130c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Studio Ceiling Architectural Timber Beam Across Top */}
        <rect x="0" y="0" width="800" height="24" fill="#3e2723" />
        <line x1="0" y1="24" x2="800" y2="24" stroke="#5d4037" strokeWidth="2" />
        {/* Recessed Track Light Spots */}
        <circle cx="200" cy="12" r="3" fill="#fde047" />
        <circle cx="400" cy="12" r="3" fill="#fde047" />
        <circle cx="600" cy="12" r="3" fill="#fde047" />

        {/* Back Wall (Left Plane) — Extended upward to enclose workspace completely */}
        <polygon points="0,24 400,105 400,260 0,175" fill={`url(#wallLeftGrad_${room.id})`} />
        {/* Left Wall Wood Wainscoting Baseboard */}
        <polygon points="0,165 400,250 400,260 0,175" fill="#5c3a1e" />
        <line x1="0" y1="165" x2="400" y2="250" stroke="#784824" strokeWidth="1.5" />

        {/* Back Wall (Right Plane) — Balanced 45% wall proportion */}
        <polygon points="400,105 800,24 800,175 400,260" fill={`url(#wallRightGrad_${room.id})`} />
        {/* Right Wall Wood Wainscoting Baseboard */}
        <polygon points="400,250 800,165 800,175 400,260" fill="#4a2810" />
        <line x1="400" y1="250" x2="800" y2="165" stroke="#6f421a" strokeWidth="1.5" />

        {/* Isometric Corner Seam Line */}
        <line x1="400" y1="105" x2="400" y2="260" stroke="#5c3a1e" strokeWidth="2" strokeOpacity="0.8" />

        {/* Floor 2:1 Isometric Plane with Parquet Pattern — Fully grounded enclosed space */}
        <polygon
          points="0,175 400,260 800,175 800,520 0,520"
          fill={`url(#parquetTile_${room.id})`}
        />
        {/* Wall-Floor Contact Shadow */}
        <polygon
          points="0,175 400,260 800,175 800,205 400,290 0,205"
          fill={`url(#floorContactShadow_${room.id})`}
        />

        {/* Animated Work Collaboration Trails between Coworkers */}
        {isAnimated && (
          <g stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45">
            <path d="M 280 220 Q 340 200 420 220" fill="none" className="animate-pulse" />
            <path d="M 420 220 Q 520 230 600 270" fill="none" className="animate-pulse" />
            <path d="M 600 270 Q 540 330 450 350" fill="none" className="animate-pulse" />
            <path d="M 450 350 Q 320 370 240 330" fill="none" className="animate-pulse" />
          </g>
        )}

        {/* Static Fallback Collaboration Lines */}
        {staticFallback && (
          <g stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.3">
            <line x1="280" y1="220" x2="420" y2="220" />
            <line x1="420" y1="220" x2="600" y2="270" />
            <line x1="600" y1="270" x2="450" y2="350" />
            <line x1="450" y1="350" x2="240" y2="330" />
          </g>
        )}
      </svg>

      {/* 4. Architectural Wall Elements (Window & Sconce Lamps) */}
      {/* Studio Cozy Window on Left Wall */}
      <div
        className="absolute left-[10%] top-[9%] pointer-events-none z-0"
        style={{ width: '84px', height: '116px' }}
      >
        <img
          src="/assets/virtual-office/wall-tiles/wall-cozy-window.svg"
          alt="Studio Window"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Brass Sconce Lamp on Left Wall */}
      <div
        className="absolute left-[23%] top-[13%] pointer-events-none z-0"
        style={{ width: '32px', height: '44px' }}
      >
        <img
          src="/assets/virtual-office/wall-tiles/wall-sconce-lamp.svg"
          alt="Left Wall Lamp"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Brass Sconce Lamp on Right Wall */}
      <div
        className="absolute right-[18%] top-[13%] pointer-events-none z-0"
        style={{ width: '32px', height: '44px' }}
      >
        <img
          src="/assets/virtual-office/wall-tiles/wall-sconce-lamp.svg"
          alt="Right Wall Lamp"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* 5. Cozy Studio Furniture & Workstations (Harmonious Grounding & Scale) */}

      {/* Back Wall Layer: Bookshelf (Left Wall) */}
      <div
        className="absolute left-[22%] top-[19%] pointer-events-none z-5"
        style={{ width: '64px', height: '96px' }}
      >
        <img
          src="/assets/virtual-office/furniture/bookshelf-wood.svg"
          alt="Bookshelf"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Back Wall Layer: Wheeled Roadmap Whiteboard (Center-Left) */}
      <div
        className="absolute left-[36%] top-[16%] pointer-events-none z-5"
        style={{ width: '76px', height: '86px' }}
      >
        <img
          src="/assets/virtual-office/decorations/whiteboard-roadmap.svg"
          alt="Roadmap Whiteboard"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Back Wall Layer: Retro Server Rack / Cluster (Center-Right) */}
      <div
        className="absolute right-[26%] top-[16%] pointer-events-none z-5"
        style={{ width: '52px', height: '92px' }}
      >
        <img
          src="/assets/virtual-office/equipment/server-rack-retro.svg"
          alt="Server Cluster"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Break Lounge Corner: Coffee Machine (Far Right) */}
      <div
        className="absolute right-[9%] top-[23%] pointer-events-none z-5"
        style={{ width: '40px', height: '46px' }}
      >
        <img
          src="/assets/virtual-office/equipment/coffee-machine.svg"
          alt="Espresso Coffee Machine"
          className="w-full h-full object-contain filter drop-shadow-sm"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Floor Center Layer: Cozy Woven Teal Rug */}
      <div
        className="absolute left-[50%] top-[56%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-1"
        style={{ width: '260px', height: '130px' }}
      >
        <img
          src="/assets/virtual-office/decorations/cozy-rug-teal.svg"
          alt="Studio Rug"
          className="w-full h-full object-contain opacity-85"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Workstation 1: Desk Left with Dual Monitors (Developer workstation) */}
      <div
        className="absolute left-[24%] top-[48%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ width: '104px', height: '90px' }}
      >
        <img
          src="/assets/virtual-office/furniture/desk-wood-left.svg"
          alt="Developer Desk"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Dual Monitors sitting on Desk */}
        <div className="absolute top-[2px] left-[22px] w-[60px] h-[44px]">
          <img
            src="/assets/virtual-office/equipment/dual-monitors.svg"
            alt="Dual Monitors"
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Workstation 2: Desk Right with Test Devices / Game Console (QA & Review area) */}
      <div
        className="absolute left-[72%] top-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ width: '104px', height: '90px' }}
      >
        <img
          src="/assets/virtual-office/furniture/desk-wood-right.svg"
          alt="QA & Review Desk"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Category Contextual Equipment */}
        {isAndroid && (
          <div className="absolute top-[6px] right-[24px] w-[42px] h-[36px]">
            <img
              src="/assets/virtual-office/equipment/test-phone-stand.svg"
              alt="Test Phone Stand"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}
        {isGameOrMMO && (
          <div className="absolute top-[4px] right-[28px] w-[30px] h-[44px]">
            <img
              src="/assets/virtual-office/decorations/studio-trophy.svg"
              alt="Game Trophy"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}
      </div>

      {/* Decorative Plants & Studio Accents */}
      {/* Potted Monstera Plant (Left Foreground) */}
      <div
        className="absolute left-[6%] bottom-[8%] pointer-events-none z-25"
        style={{ width: '52px', height: '76px' }}
      >
        <img
          src="/assets/virtual-office/decorations/plant-monstera.svg"
          alt="Monstera Plant"
          className="w-full h-full object-contain filter drop-shadow-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Golden Studio Award (Front Right Table / Stand) */}
      <div
        className="absolute right-[7%] bottom-[10%] pointer-events-none z-25"
        style={{ width: '34px', height: '50px' }}
      >
        <img
          src="/assets/virtual-office/decorations/studio-trophy.svg"
          alt="Studio Trophy"
          className="w-full h-full object-contain filter drop-shadow-md"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* 6. The 5 Core Human Coworker Agents (Layered in 2.5D space) */}
      <div className="absolute inset-0 z-20">
        {agents.map((agent) => (
          <PixelAgentAvatar
            key={agent.id}
            agent={agent}
            reducedMotion={reducedMotion}
            staticFallback={staticFallback}
            onSelect={onSelectAgent}
            isSelected={selectedAgentId === agent.id}
          />
        ))}
      </div>

      {/* 7. Static Fallback Notice (Only in static mode) */}
      {staticFallback && (
        <div className="absolute bottom-2 left-4 right-4 z-30 px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-950/95 text-center text-xs text-stone-300 backdrop-blur-sm shadow-md">
          <span className="font-semibold text-amber-300">Mode Fallback Statis Aktif</span> — Menampilkan scene 2D isometrik tanpa animasi.
        </div>
      )}
    </div>
  );
};
