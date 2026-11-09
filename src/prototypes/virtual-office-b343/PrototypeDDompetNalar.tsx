import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Play,
  Pause,
  UserCheck,
} from 'lucide-react';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../../types/virtualOffice';
import { PROJECT_AGENT_INSTANCES, ProjectAgentInstance } from '../../components/virtual-office/LemburIsometricPrototype';

const TILE_W = 64;
const TILE_H = 32;

// The 5 Canonical Agent Instances for DompetNalar
const DOMPETNALAR_AGENTS = PROJECT_AGENT_INSTANCES.filter(
  (a) => a.projectId === 'dompetnalar'
);

interface RoomProp {
  id: string;
  name: string;
  assetPath: string;
  gridX: number;
  gridY: number;
  elevation?: number;
  category: 'wall' | 'furniture' | 'tech' | 'decor';
}

// 6x6 DompetNalar Room Layout
const DOMPETNALAR_ROOM_PROPS: RoomProp[] = [
  // Perimeter Walls (Left col 0, Right row 0)
  {
    id: 'dn_wall_w_l1',
    name: 'Window Wall Left',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_left.png',
    gridX: 0,
    gridY: 0,
    category: 'wall',
  },
  {
    id: 'dn_wall_p_l2',
    name: 'Plain Wall Left',
    assetPath: '/assets/virtual-office/b343/environment/wall_plain_left.png',
    gridX: 0,
    gridY: 2,
    category: 'wall',
  },
  {
    id: 'dn_wall_w_l3',
    name: 'Window Wall Left End',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_left.png',
    gridX: 0,
    gridY: 4,
    category: 'wall',
  },
  {
    id: 'dn_wall_p_r1',
    name: 'Plain Wall Right Corner',
    assetPath: '/assets/virtual-office/b343/environment/wall_plain_right.png',
    gridX: 0,
    gridY: 0,
    category: 'wall',
  },
  {
    id: 'dn_wall_w_r2',
    name: 'Window Wall Right',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_right.png',
    gridX: 2,
    gridY: 0,
    category: 'wall',
  },
  {
    id: 'dn_wall_w_r3',
    name: 'Window Wall Right End',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_right.png',
    gridX: 4,
    gridY: 0,
    category: 'wall',
  },

  // 1. Planner Desk (Budi) at grid (1, 1)
  {
    id: 'dn_desk_planner',
    name: 'Financial Roadmap Executive Desk',
    assetPath: '/assets/virtual-office/b343/environment/cubicle_workstation.png',
    gridX: 1,
    gridY: 1,
    category: 'furniture',
  },
  {
    id: 'dn_chair_planner',
    name: 'Planner Mesh Chair',
    assetPath: '/assets/virtual-office/b343/environment/ergonomic_office_chair.png',
    gridX: 1,
    gridY: 2,
    category: 'furniture',
  },

  // 2. Developer Desk (Reza) at grid (3, 1)
  {
    id: 'dn_desk_dev',
    name: 'High-Performance SQLite Station',
    assetPath: '/assets/virtual-office/b343/environment/standing_desk.png',
    gridX: 3,
    gridY: 1,
    category: 'furniture',
  },
  {
    id: 'dn_chair_dev',
    name: 'Developer Chair',
    assetPath: '/assets/virtual-office/b343/furniture/office_chair.png',
    gridX: 3,
    gridY: 2,
    category: 'furniture',
  },

  // 3. Tester Desk (Kevin) at grid (5, 1)
  {
    id: 'dn_desk_tester',
    name: 'Android QA Test Bench',
    assetPath: '/assets/virtual-office/b343/furniture/office_desk.png',
    gridX: 5,
    gridY: 1,
    category: 'furniture',
  },
  {
    id: 'dn_monitor_tester',
    name: 'QA Matrix Display',
    assetPath: '/assets/virtual-office/b343/furniture/office_monitor.png',
    gridX: 5,
    gridY: 1,
    elevation: 14,
    category: 'tech',
  },
  {
    id: 'dn_chair_tester',
    name: 'Tester Task Chair',
    assetPath: '/assets/virtual-office/b343/environment/ergonomic_office_chair.png',
    gridX: 5,
    gridY: 2,
    category: 'furniture',
  },

  // 4. Reviewer Desk (Dewi) at grid (1, 3)
  {
    id: 'dn_desk_reviewer',
    name: 'Architecture Review Desk',
    assetPath: '/assets/virtual-office/b343/furniture/office_desk.png',
    gridX: 1,
    gridY: 3,
    category: 'furniture',
  },
  {
    id: 'dn_monitor_reviewer',
    name: 'Code Review Ultra-wide Monitor',
    assetPath: '/assets/virtual-office/b343/furniture/office_monitor.png',
    gridX: 1,
    gridY: 3,
    elevation: 14,
    category: 'tech',
  },
  {
    id: 'dn_chair_reviewer',
    name: 'Reviewer Chair',
    assetPath: '/assets/virtual-office/b343/furniture/office_chair.png',
    gridX: 1,
    gridY: 4,
    category: 'furniture',
  },

  // 5. Publisher Desk (Hartono) at grid (3, 3)
  {
    id: 'dn_desk_publisher',
    name: 'Compliance & Release Desk',
    assetPath: '/assets/virtual-office/b343/environment/cubicle_workstation.png',
    gridX: 3,
    gridY: 3,
    category: 'furniture',
  },
  {
    id: 'dn_chair_publisher',
    name: 'Compliance Chair',
    assetPath: '/assets/virtual-office/b343/environment/ergonomic_office_chair.png',
    gridX: 3,
    gridY: 4,
    category: 'furniture',
  },

  // Room Infrastructure, Whiteboard, & Decor
  {
    id: 'dn_whiteboard',
    name: 'Financial Modeling & Google Policy Whiteboard',
    assetPath: '/assets/virtual-office/b343/furniture/whiteboard.png',
    gridX: 4,
    gridY: 0,
    category: 'furniture',
  },
  {
    id: 'dn_filing_cabinets',
    name: 'Encrypted Ledger Backup Storage',
    assetPath: '/assets/virtual-office/b343/furniture/filing_cabinet.png',
    gridX: 0,
    gridY: 3,
    category: 'furniture',
  },
  {
    id: 'dn_planter_divider',
    name: 'Acoustic Planter Divider',
    assetPath: '/assets/virtual-office/b343/environment/planter_divider_shelf.png',
    gridX: 2,
    gridY: 2,
    category: 'decor',
  },
  {
    id: 'dn_coffee_bar',
    name: 'DompetNalar Espresso Nook',
    assetPath: '/assets/virtual-office/b343/furniture/coffee_machine.png',
    gridX: 5,
    gridY: 3,
    category: 'furniture',
  },
  {
    id: 'dn_water_dispenser',
    name: 'Spring Water Cooler',
    assetPath: '/assets/virtual-office/b343/furniture/water_cooler.png',
    gridX: 5,
    gridY: 4,
    category: 'furniture',
  },
];

// Agent Grid Coordinates within the 6x6 room:
const AGENT_GRID_COORDS: Record<string, { x: number; y: number }> = {
  agent_dompetnalar_planner: { x: 1, y: 1 },
  agent_dompetnalar_developer: { x: 3, y: 1 },
  agent_dompetnalar_tester: { x: 5, y: 1 },
  agent_dompetnalar_reviewer: { x: 1, y: 3 },
  agent_dompetnalar_publisher: { x: 3, y: 3 },
};

export const PrototypeDDompetNalar: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<ProjectAgentInstance>(
    DOMPETNALAR_AGENTS[0]
  );
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [walkProgress, setWalkProgress] = useState<number>(0);
  const [walkFrame, setWalkFrame] = useState<number>(0);

  const gridCols = 6;
  const gridRows = 6;
  const originX = 380;
  const originY = 140;

  // Animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setWalkFrame((prev) => (prev + 1) % 8);
      if (isSimulatingWalk) {
        setWalkProgress((prev) => (prev + 0.05) % 1);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [isSimulatingWalk]);

  const framePadded = walkFrame.toString().padStart(2, '0');

  // Sorted room props
  const sortedProps = [...DOMPETNALAR_ROOM_PROPS].sort((a, b) => {
    const depthA = (a.gridX + a.gridY) * 1000 + (a.elevation || 0);
    const depthB = (b.gridX + b.gridY) * 1000 + (b.elevation || 0);
    return depthA - depthB;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Banner */}
      <div className="p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-xs font-mono font-medium text-emerald-300 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Prototype D — One Complete Project Room (DompetNalar)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-100 flex items-center gap-2.5">
            <span>DompetNalar Dedicated Project Room</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              5 Independent Agents
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Complete high-fidelity production prototype demonstrating 5 independent runtime agent instances, project-specific financial dual monitors, compliance archive, biophilic planters, and interactive agent inspector.
          </p>
        </div>

        {/* Corridor Waypoint Simulation Toggle */}
        <div className="flex items-center gap-2 bg-stone-950 p-2 rounded-2xl border border-stone-800">
          <button
            onClick={() => setIsSimulatingWalk(!isSimulatingWalk)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              isSimulatingWalk
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
            }`}
          >
            {isSimulatingWalk ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Corridor Pathing: {isSimulatingWalk ? 'ACTIVE' : 'IDLE'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Room Viewport Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#0a0c12] rounded-3xl border border-stone-800 p-4 relative overflow-hidden shadow-2xl min-h-[560px] flex items-center justify-center">
          {/* Subtle Emerald & Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-stone-950 via-emerald-950/20 to-cyan-900/15" />

          {/* Project Title Plaque */}
          <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-stone-800 shadow-lg flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-stone-100 uppercase tracking-wider font-mono">
                DompetNalar — Financial Security Core
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                Status: Ready For Release | SQLite Encrypted | 5 Agents Live
              </div>
            </div>
          </div>

          {/* Isometric World Stage */}
          <div className="relative w-[760px] h-[520px] shrink-0 [image-rendering:pixelated]">
            {/* 6x6 Diamond Floor Tile Grid */}
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((_, c) => {
                const sx = originX + (c - r) * (TILE_W / 2);
                const sy = originY + (c + r) * (TILE_H / 2);
                return (
                  <div
                    key={`dn_floor_${c}_${r}`}
                    className="absolute"
                    style={{
                      left: `${sx - TILE_W / 2}px`,
                      top: `${sy - TILE_H / 2}px`,
                      width: `${TILE_W}px`,
                      height: `${TILE_H * 2}px`,
                      zIndex: (c + r) * 10,
                    }}
                  >
                    <img
                      src="/assets/virtual-office/b343/environment/floor_office_carpet_tile.png"
                      alt="carpet"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                );
              })
            )}

            {/* Room Props (Walls, Desks, Whiteboards, Coffee Nook) */}
            {sortedProps.map((prop) => {
              const isWall = prop.category === 'wall';
              const sx = originX + (prop.gridX - prop.gridY) * (TILE_W / 2);
              const sy = originY + (prop.gridX + prop.gridY) * (TILE_H / 2);

              const leftPx = sx - 32;
              const topPx = isWall ? sy - 96 : sy - 59 - (prop.elevation || 0);
              const widthPx = 64;
              const heightPx = isWall ? 128 : 64;
              const zIndex = (prop.gridX + prop.gridY) * 1000 + (prop.elevation || 0) + (isWall ? 0 : 50);

              return (
                <div
                  key={prop.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    zIndex,
                  }}
                >
                  <img
                    src={prop.assetPath}
                    alt={prop.name}
                    className="w-full h-full object-contain select-none"
                  />
                </div>
              );
            })}

            {/* The 5 Canonical DompetNalar Agents Seated at Desks */}
            {DOMPETNALAR_AGENTS.map((agent) => {
              const coords = AGENT_GRID_COORDS[agent.instanceId] || { x: 1, y: 1 };
              const isSelected = selectedAgent.instanceId === agent.instanceId;

              // Waypoint dynamic offset when walking simulation is active for Tester (Kevin)
              let currentGridX = coords.x;
              let currentGridY = coords.y;
              let agentFacing = agent.facing;
              let isWalking = false;

              if (isSimulatingWalk && agent.role === 'TESTER') {
                isWalking = true;
                // Move Kevin back and forth between desk (5,1) and coffee bar (5,3)
                currentGridX = 5;
                currentGridY = 1 + walkProgress * 2;
                agentFacing = walkProgress > 0.5 ? 'up' : 'down';
              }

              const sx = originX + (currentGridX - currentGridY) * (TILE_W / 2);
              const sy = originY + (currentGridX + currentGridY) * (TILE_H / 2);

              // Sprite source
              const spriteSrc = isWalking
                ? `/assets/virtual-office/b343/characters/modern-citizens/frames/${agent.charAssetKey}/walk_${agentFacing}_${framePadded}.png`
                : `/assets/virtual-office/b343/characters/modern-citizens/frames/${agent.charAssetKey}/stand_${agentFacing}.png`;

              // Z-Index: sitting behind desk means agent is in between chair and desk
              const agentZ = (Math.round(currentGridX) + Math.round(currentGridY)) * 1000 + (isWalking ? 80 : 35);

              return (
                <div
                  key={agent.instanceId}
                  onClick={() => setSelectedAgent(agent)}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${sx - 64}px`,
                    top: `${sy - 94}px`,
                    width: '128px',
                    height: '128px',
                    zIndex: agentZ,
                  }}
                  title={`${agent.displayName} — ${agent.role}`}
                >
                  <img
                    src={spriteSrc}
                    alt={agent.displayName}
                    className={`w-full h-full object-contain [image-rendering:pixelated] transition-transform duration-150 ${
                      isSelected ? 'scale-110 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.9)]' : 'group-hover:scale-105'
                    }`}
                  />

                  {/* Name Tag Pill */}
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-mono whitespace-nowrap shadow-md pointer-events-none transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-stone-950 font-bold scale-105'
                        : 'bg-stone-950/80 text-stone-300 border border-stone-800'
                    }`}
                  >
                    {agent.displayName.split(' ')[0]} ({agent.role})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom HUD Legend */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-stone-400 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span>5 / 5 Agents Online & Grounded</span>
            </span>
            <span className="text-stone-400">Canonical DompetNalar Crew</span>
            <span className="text-cyan-400 font-semibold">{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
          </div>
        </div>

        {/* 3. Interactive Agent Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl border border-stone-800 bg-stone-900/80 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Agent Live Inspector</span>
            </h4>

            {selectedAgent && (
              <div className="space-y-4 text-xs">
                {/* Agent Avatar Box */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center min-h-[140px] relative">
                  <img
                    src={`/assets/virtual-office/b343/characters/modern-citizens/frames/${selectedAgent.charAssetKey}/stand_down.png`}
                    alt={selectedAgent.displayName}
                    className="max-h-28 max-w-full object-contain [image-rendering:pixelated]"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {selectedAgent.role}
                  </span>
                </div>

                <div>
                  <div className="text-stone-400 font-mono text-[10px]">AGENT INSTANCE & ROLE</div>
                  <div className="text-stone-100 font-bold text-sm">{selectedAgent.displayName}</div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">{selectedAgent.instanceId}</div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
                  <div className="text-stone-400 font-mono text-[10px]">CURRENT SIMULATED SPRINT TASK</div>
                  <p className="text-stone-200 leading-relaxed font-medium">
                    {selectedAgent.activity}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
                    <span className="text-stone-400 font-mono block">Station Desk Prop</span>
                    <span className="text-cyan-300 font-semibold truncate block">
                      {selectedAgent.deskItem || 'Standard Station'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
                    <span className="text-stone-400 font-mono block">Sprint State</span>
                    <span className="text-emerald-300 font-semibold uppercase">
                      {selectedAgent.state}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Agent Crew Selector */}
          <div className="p-4 rounded-3xl border border-stone-800 bg-stone-900/60 space-y-2">
            <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
              DompetNalar Crew Roster
            </div>
            {DOMPETNALAR_AGENTS.map((agent) => (
              <button
                key={agent.instanceId}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                  selectedAgent.instanceId === agent.instanceId
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                }`}
              >
                <div>
                  <div className="font-semibold">{agent.displayName.split(' ')[0]}</div>
                  <div className="text-[10px] font-mono text-stone-400">{agent.role}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                  {agent.state}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
