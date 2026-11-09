import React, { useState } from 'react';
import {
  Grid,
  Layers,
  Sun,
  Moon,
  Eye,
  Info,
  Compass,
} from 'lucide-react';
import { PlacedProp } from './types';

/**
 * 2:1 Dimetric Coordinate Conversion Helper:
 * origin: (originX, originY)
 * screenX = originX + (col - row) * (tileWidth / 2)
 * screenY = originY + (col + row) * (tileHeight / 2)
 * For ThirdAngle & Antahonist:
 * tileWidth = 64, tileHeight = 32
 */
const TILE_W = 64;
const TILE_H = 32;

export const ENVIRONMENT_PROPS: PlacedProp[] = [
  // Walls along the back perimeter (Meeting at col 0, row 0)
  // Left wall runs along col = 0, row = 0..4
  {
    id: 'wall_corner_left_1',
    name: 'Office Wall (Window Left)',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_left.png',
    gridX: 0,
    gridY: 0,
    category: 'wall',
    description: 'ThirdAngle 64x128px double-cell wall segment with glass window',
  },
  {
    id: 'wall_plain_left_2',
    name: 'Office Wall (Plain Left)',
    assetPath: '/assets/virtual-office/b343/environment/wall_plain_left.png',
    gridX: 0,
    gridY: 2,
    category: 'wall',
    description: 'ThirdAngle 64x128px plain wall run segment',
  },
  {
    id: 'wall_end_left_3',
    name: 'Wall End Cap (Left)',
    assetPath: '/assets/virtual-office/b343/environment/wall_end_left.png',
    gridX: 0,
    gridY: 4,
    category: 'wall',
    description: 'ThirdAngle 4px end-cap terminating the left wall run',
  },

  // Right wall runs along row = 0, col = 0..4
  {
    id: 'wall_plain_right_1',
    name: 'Office Wall (Plain Right)',
    assetPath: '/assets/virtual-office/b343/environment/wall_plain_right.png',
    gridX: 0,
    gridY: 0,
    category: 'wall',
    description: 'ThirdAngle 64x128px plain wall meeting at corner vertex',
  },
  {
    id: 'wall_window_right_2',
    name: 'Office Wall (Window Right)',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_right.png',
    gridX: 2,
    gridY: 0,
    category: 'wall',
    description: 'ThirdAngle 64x128px double-cell window wall segment',
  },
  {
    id: 'wall_end_right_3',
    name: 'Wall End Cap (Right)',
    assetPath: '/assets/virtual-office/b343/environment/wall_end_right.png',
    gridX: 4,
    gridY: 0,
    category: 'wall',
    description: 'ThirdAngle 4px end-cap terminating the right wall run',
  },

  // Workstation Clusters & Desks
  {
    id: 'station_cubicle_1',
    name: 'Cubicle Workstation A',
    assetPath: '/assets/virtual-office/b343/environment/cubicle_workstation.png',
    gridX: 1,
    gridY: 1,
    category: 'furniture',
    description: 'ThirdAngle 64x64 modular cubicle desk with privacy panel',
  },
  {
    id: 'chair_ergo_1',
    name: 'Ergonomic Office Chair A',
    assetPath: '/assets/virtual-office/b343/environment/ergonomic_office_chair.png',
    gridX: 1,
    gridY: 2,
    category: 'furniture',
    description: 'ThirdAngle 64x64 ergonomic swivel mesh office chair',
  },
  {
    id: 'desk_standing_1',
    name: 'Height-Adjustable Standing Desk',
    assetPath: '/assets/virtual-office/b343/environment/standing_desk.png',
    gridX: 3,
    gridY: 1,
    category: 'furniture',
    description: 'ThirdAngle motorized standing desk with dual monitors',
  },
  {
    id: 'chair_ergo_2',
    name: 'Ergonomic Office Chair B',
    assetPath: '/assets/virtual-office/b343/furniture/office_chair.png',
    gridX: 3,
    gridY: 2,
    category: 'furniture',
    description: 'Antahonist 64x64 executive office task chair',
  },
  {
    id: 'desk_classic_1',
    name: 'Standard Developer Desk',
    assetPath: '/assets/virtual-office/b343/furniture/office_desk.png',
    gridX: 2,
    gridY: 3,
    category: 'furniture',
    description: 'Antahonist 64x64 solid oak finish computer workstation',
  },
  {
    id: 'tech_monitor_1',
    name: 'Ultra-Wide Code Monitor',
    assetPath: '/assets/virtual-office/b343/furniture/office_monitor.png',
    gridX: 2,
    gridY: 3,
    elevation: 14,
    category: 'tech',
    description: 'Antahonist 64x64 pixel-art display monitor positioned on desk',
  },

  // Tech & Infrastructure
  {
    id: 'printer_multi_1',
    name: 'Heavy Duty Multifunction Printer',
    assetPath: '/assets/virtual-office/b343/environment/multifunction_printer.png',
    gridX: 4,
    gridY: 1,
    category: 'tech',
    description: 'ThirdAngle 64x64 networked floor-standing laser printer/scanner',
  },
  {
    id: 'paper_boxes_1',
    name: 'A4 Copy Paper Box Stack',
    assetPath: '/assets/virtual-office/b343/environment/copy_paper_box_stack.png',
    gridX: 4,
    gridY: 2,
    category: 'decor',
    description: 'ThirdAngle paper boxes stacked adjacent to printer station',
  },

  // Room Dividers, Decor & Storage
  {
    id: 'shelf_planter_1',
    name: 'Biophilic Planter Divider Shelf',
    assetPath: '/assets/virtual-office/b343/environment/planter_divider_shelf.png',
    gridX: 1,
    gridY: 3,
    category: 'decor',
    description: 'ThirdAngle 64x64 acoustic divider shelf with lush greenery',
  },
  {
    id: 'cabinet_filing_1',
    name: '3-Drawer Metal Filing Cabinet',
    assetPath: '/assets/virtual-office/b343/furniture/filing_cabinet.png',
    gridX: 0,
    gridY: 3,
    category: 'furniture',
    description: 'Antahonist metal archives cabinet for compliance logs',
  },
  {
    id: 'board_whiteboard_1',
    name: 'Agile Sprint Whiteboard',
    assetPath: '/assets/virtual-office/b343/furniture/whiteboard.png',
    gridX: 3,
    gridY: 0,
    category: 'furniture',
    description: 'Antahonist 64x64 rolling whiteboard with architecture diagrams',
  },
  {
    id: 'plant_potted_1',
    name: 'Potted Office Ficus',
    assetPath: '/assets/virtual-office/b343/furniture/potted_plant.png',
    gridX: 4,
    gridY: 3,
    category: 'decor',
    description: 'Antahonist indoor ceramic potted plant adding cozy warmth',
  },
  {
    id: 'bin_waste_1',
    name: 'Recycle Waste Bin',
    assetPath: '/assets/virtual-office/b343/furniture/waste_bin.png',
    gridX: 2,
    gridY: 2,
    category: 'decor',
    description: 'Antahonist under-desk waste basket',
  },
];

export const PrototypeAEnvironment: React.FC = () => {
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAnchors, setShowAnchors] = useState<boolean>(false);
  const [lighting, setLighting] = useState<'day' | 'evening' | 'neon'>('evening');
  const [selectedProp, setSelectedProp] = useState<PlacedProp | null>(ENVIRONMENT_PROPS[0]);

  const gridCols = 5;
  const gridRows = 5;
  const originX = 340;
  const originY = 160;

  // Depth-sorting: items sorted by (gridX + gridY) + elevation
  const sortedProps = [...ENVIRONMENT_PROPS].sort((a, b) => {
    const depthA = (a.gridX + a.gridY) * 1000 + (a.elevation || 0);
    const depthB = (b.gridX + b.gridY) * 1000 + (b.elevation || 0);
    return depthA - depthB;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls Bar */}
      <div className="p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-xs font-mono font-medium text-cyan-300 mb-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prototype A — Isometric Office Environment (2:1 Grid)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-100">
            Modular 2:1 Dimetric Room & Architectural Assembly
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Seamless 64x32 carpet tile grid, precision left/right wall joins with window cutaways, workstations, chairs, storage, and office decor props.
          </p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-950 p-2 rounded-2xl border border-stone-800">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              showGrid
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid Overlay</span>
          </button>

          <button
            onClick={() => setShowAnchors(!showAnchors)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              showAnchors
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900 border border-stone-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>y=59 Anchors</span>
          </button>

          <div className="h-5 w-px bg-stone-800 mx-1" />

          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLighting('day')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                lighting === 'day'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Day Bright Ambient"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLighting('evening')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                lighting === 'evening'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Cozy Warm Evening"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLighting('neon')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                lighting === 'neon'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Studio Cyber Glow"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Isometric Canvas Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#0b0d14] rounded-3xl border border-stone-800 p-4 relative overflow-hidden shadow-2xl min-h-[520px] flex items-center justify-center">
          {/* Ambient Lighting Gradient based on mode */}
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
              lighting === 'day'
                ? 'bg-gradient-to-tr from-sky-950/20 via-amber-950/10 to-amber-500/10'
                : lighting === 'evening'
                ? 'bg-gradient-to-tr from-stone-950 via-amber-950/20 to-orange-500/15'
                : 'bg-gradient-to-tr from-stone-950 via-cyan-950/30 to-violet-500/15'
            }`}
          />

          {/* Isometric World Stage */}
          <div
            className="relative w-[700px] h-[480px] shrink-0 [image-rendering:pixelated]"
            style={{ transformOrigin: 'center center' }}
          >
            {/* LAYER 1: 64x32 Diamond Floor Grid */}
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((_, c) => {
                const sx = originX + (c - r) * (TILE_W / 2);
                const sy = originY + (c + r) * (TILE_H / 2);
                return (
                  <div
                    key={`floor_${c}_${r}`}
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

                    {/* Optional Grid Wireframe Diamond Overlay */}
                    {showGrid && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 64 64"
                      >
                        <polygon
                          points="32,32 64,48 32,64 0,48"
                          fill="none"
                          stroke={lighting === 'neon' ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.2)'}
                          strokeWidth="0.75"
                        />
                        <text
                          x="32"
                          y="50"
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.35)"
                          fontSize="7"
                          fontFamily="monospace"
                        >
                          {c},{r}
                        </text>
                      </svg>
                    )}
                  </div>
                );
              })
            )}

            {/* LAYER 2 & 3: Walls & Props (Sorted by Depth Key) */}
            {sortedProps.map((prop) => {
              const isWall = prop.category === 'wall';
              const sx = originX + (prop.gridX - prop.gridY) * (TILE_W / 2);
              const sy = originY + (prop.gridX + prop.gridY) * (TILE_H / 2);
              const isSelected = selectedProp?.id === prop.id;

              // Anchor offsets:
              // For ThirdAngle/Antahonist props on 64x64 canvas, bottom anchor is y=59.
              // For ThirdAngle walls on 64x128 canvas, anchor is vertex-aligned.
              const leftPx = sx - 32;
              const topPx = isWall ? sy - 96 : sy - 59 - (prop.elevation || 0);
              const widthPx = 64;
              const heightPx = isWall ? 128 : 64;
              const zIndex = (prop.gridX + prop.gridY) * 1000 + (prop.elevation || 0) + (isWall ? 0 : 50);

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProp(prop)}
                  className={`absolute cursor-pointer transition-transform duration-150 hover:scale-105 ${
                    isSelected ? 'filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''
                  }`}
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    zIndex,
                  }}
                  title={`${prop.name} (${prop.gridX}, ${prop.gridY})`}
                >
                  <img
                    src={prop.assetPath}
                    alt={prop.name}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />

                  {/* Anchor Point Marker */}
                  {showAnchors && (
                    <div
                      className="absolute w-2 h-2 rounded-full bg-amber-400 border border-black -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: '32px',
                        top: isWall ? '96px' : '59px',
                      }}
                    />
                  )}

                  {/* Active Selection Glow Ring */}
                  {isSelected && (
                    <div className="absolute inset-0 border border-cyan-400/80 rounded-lg pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom HUD Legend */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-stone-400 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800">
            <span>Grid: 5x5 Dimetric (64x32px)</span>
            <span className="text-cyan-400">Total Placed Sprites: {ENVIRONMENT_PROPS.length + 25}</span>
            <span>Anchor: y=59 Bottom Contact</span>
          </div>
        </div>

        {/* 3. Prop Inspector Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl border border-stone-800 bg-stone-900/80 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Prop Inspector</span>
            </h4>

            {selectedProp ? (
              <div className="space-y-4 text-xs">
                {/* Prop Preview Box */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center min-h-[120px] relative">
                  <img
                    src={selectedProp.assetPath}
                    alt={selectedProp.name}
                    className="max-h-24 max-w-full object-contain [image-rendering:pixelated]"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                    {selectedProp.category.toUpperCase()}
                  </span>
                </div>

                <div>
                  <div className="text-stone-400 font-mono text-[10px]">PROP NAME</div>
                  <div className="text-stone-100 font-bold text-sm">{selectedProp.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
                    <span className="text-stone-400 font-mono block">Grid Position</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      col: {selectedProp.gridX}, row: {selectedProp.gridY}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
                    <span className="text-stone-400 font-mono block">Elevation (Z)</span>
                    <span className="font-mono text-stone-200">
                      {selectedProp.elevation ? `+${selectedProp.elevation}px` : 'Ground (0)'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800/70">
                  <span className="text-stone-400 font-mono text-[10px] block mb-1">ASSET PATH</span>
                  <code className="text-[10px] text-stone-300 break-all select-all font-mono">
                    {selectedProp.assetPath}
                  </code>
                </div>

                <p className="text-stone-300 leading-relaxed text-xs">
                  {selectedProp.description}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">Click any placed prop in the room to inspect its parameters.</p>
            )}
          </div>

          {/* Quick Placed Props List */}
          <div className="p-4 rounded-3xl border border-stone-800 bg-stone-900/60 max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar">
            <div className="text-[11px] font-mono text-stone-400 mb-2 uppercase">Placed Sprites Directory</div>
            {ENVIRONMENT_PROPS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProp(p)}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                  selectedProp?.id === p.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                }`}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] font-mono text-stone-400">
                  [{p.gridX},{p.gridY}]
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
