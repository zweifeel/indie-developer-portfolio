import React, { useState } from 'react';
import {
  Coffee,
  Sparkles,
  Smile,
  Building2,
} from 'lucide-react';
import { PlacedProp } from './types';

const TILE_W = 64;
const TILE_H = 32;

export const SHARED_AREA_PROPS: PlacedProp[] = [
  // Perimeter Walls (Left & Right meeting at 0,0)
  {
    id: 'shared_wall_w_l1',
    name: 'Atrium Window Wall Left',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_left.png',
    gridX: 0,
    gridY: 0,
    category: 'wall',
    description: 'Double-glazed daylight window wall illuminating the reception atrium',
  },
  {
    id: 'shared_wall_p_l2',
    name: 'Plain Wall Left',
    assetPath: '/assets/virtual-office/b343/environment/wall_plain_left.png',
    gridX: 0,
    gridY: 2,
    category: 'wall',
    description: 'Acoustic wall paneling along the left reception hallway',
  },
  {
    id: 'shared_wall_p_r1',
    name: 'Plain Wall Right (Meeting Corner)',
    assetPath: '/assets/virtual-office/b343/environment/wall_plain_right.png',
    gridX: 0,
    gridY: 0,
    category: 'wall',
    description: 'Corner join connecting reception atrium to breakroom corridor',
  },
  {
    id: 'shared_wall_w_r2',
    name: 'Atrium Window Wall Right',
    assetPath: '/assets/virtual-office/b343/environment/wall_office_window_right.png',
    gridX: 2,
    gridY: 0,
    category: 'wall',
    description: 'East-facing garden window allowing natural morning sunlight',
  },

  // 1. Reception Station
  {
    id: 'reception_counter',
    name: 'Executive Reception Desk',
    assetPath: '/assets/virtual-office/b343/furniture/office_desk.png',
    gridX: 1,
    gridY: 1,
    category: 'furniture',
    description: 'Main reception check-in desk for studio visitors, testers, and partners',
  },
  {
    id: 'reception_chair',
    name: 'Receptionist Task Chair',
    assetPath: '/assets/virtual-office/b343/furniture/office_chair.png',
    gridX: 0,
    gridY: 1,
    category: 'furniture',
    description: 'Comfortable swivel chair positioned behind reception desk',
  },
  {
    id: 'reception_monitor',
    name: 'Visitor Management Terminal',
    assetPath: '/assets/virtual-office/b343/furniture/office_monitor.png',
    gridX: 1,
    gridY: 1,
    elevation: 14,
    category: 'tech',
    description: 'Desktop terminal running guest registration and NDA sign-ins',
  },
  {
    id: 'reception_phone',
    name: 'Studio Intercom Speakerphone',
    assetPath: '/assets/virtual-office/b343/furniture/desk_speakerphone.png',
    gridX: 1,
    gridY: 1,
    elevation: 14,
    category: 'tech',
    description: 'Direct intercom connecting reception to development project rooms',
  },

  // 2. Breakroom & Beverage Corner (Back-right)
  {
    id: 'snack_vending_machine',
    name: 'Studio Snack Vending Machine',
    assetPath: '/assets/virtual-office/b343/furniture/vending_snack.png',
    gridX: 4,
    gridY: 0,
    category: 'furniture',
    description: 'Stocked snack machine providing healthy treats and energy drinks',
  },
  {
    id: 'espresso_machine',
    name: 'Italian Espresso Coffee Machine',
    assetPath: '/assets/virtual-office/b343/furniture/coffee_machine.png',
    gridX: 4,
    gridY: 1,
    category: 'furniture',
    description: 'High-pressure bean-to-cup espresso bar for software engineers',
  },
  {
    id: 'water_dispenser',
    name: 'Pure Spring Water Cooler',
    assetPath: '/assets/virtual-office/b343/furniture/water_cooler.png',
    gridX: 3,
    gridY: 0,
    category: 'furniture',
    description: 'Filtered cold/hot water dispenser for team hydration',
  },
  {
    id: 'breakroom_bin',
    name: 'Compost & Waste Station',
    assetPath: '/assets/virtual-office/b343/furniture/waste_bin.png',
    gridX: 4,
    gridY: 2,
    category: 'decor',
    description: 'Eco-friendly recycling and organic waste sorting bin',
  },

  // 3. Lounge & Social Seating (Center-South)
  {
    id: 'lounge_sofa_main',
    name: 'Velvet Lounge Sofa (riekahq)',
    assetPath: '/assets/virtual-office/b343/environment/riekahq/sofa_red_a.png',
    gridX: 2,
    gridY: 3,
    category: 'furniture',
    description: 'Plush crimson sofa providing cozy seating for casual discussions',
  },
  {
    id: 'lounge_sofa_side',
    name: 'Secondary Companion Sofa',
    assetPath: '/assets/virtual-office/b343/environment/riekahq/sofa_red_b.png',
    gridX: 3,
    gridY: 3,
    category: 'furniture',
    description: 'Right-facing companion sofa completing the L-shaped lounge nook',
  },
  {
    id: 'coffee_table_low',
    name: 'Oak Coffee & Magazine Table',
    assetPath: '/assets/virtual-office/b343/environment/riekahq/table_dining_a.png',
    gridX: 2,
    gridY: 2,
    category: 'furniture',
    description: 'Low-profile table holding tech magazines and coffee mugs',
  },
  {
    id: 'floor_lamp_warm',
    name: 'Cozy Ambient Floor Lamp',
    assetPath: '/assets/virtual-office/b343/environment/riekahq/lamp_floor_a.png',
    gridX: 1,
    gridY: 3,
    category: 'decor',
    description: 'Warm 2700K incandescent-style standing lamp creating cozy lounge atmosphere',
  },

  // 4. Decor & Atmosphere
  {
    id: 'coat_rack_stand',
    name: 'Solid Wood Coat Rack',
    assetPath: '/assets/virtual-office/b343/furniture/coat_rack.png',
    gridX: 0,
    gridY: 3,
    category: 'furniture',
    description: 'Standing coat tree for jackets, umbrellas, and studio hoodies',
  },
  {
    id: 'plant_palm_atrium',
    name: 'Atrium Majesty Palm',
    assetPath: '/assets/virtual-office/b343/furniture/potted_plant.png',
    gridX: 1,
    gridY: 0,
    category: 'decor',
    description: 'Lush tropical potted palm filtering indoor air',
  },
  {
    id: 'plant_pot_lounge',
    name: 'Terracotta Potted Plant',
    assetPath: '/assets/virtual-office/b343/environment/riekahq/plant_pot_a.png',
    gridX: 4,
    gridY: 3,
    category: 'decor',
    description: 'Terracotta ceramic plant accentuating the social lounge corner',
  },
  {
    id: 'clock_grandfather',
    name: 'Vintage Mahogany Grandfather Clock',
    assetPath: '/assets/virtual-office/b343/environment/riekahq/clock_grandfather_a.png',
    gridX: 0,
    gridY: 2,
    category: 'decor',
    description: 'Elegant wooden grandfather clock chiming milestone sprints',
  },
];

export const PrototypeBSharedArea: React.FC = () => {
  const [selectedProp, setSelectedProp] = useState<PlacedProp | null>(SHARED_AREA_PROPS[0]);

  const gridCols = 5;
  const gridRows = 5;
  const originX = 340;
  const originY = 160;

  const sortedProps = [...SHARED_AREA_PROPS].sort((a, b) => {
    const depthA = (a.gridX + a.gridY) * 1000 + (a.elevation || 0);
    const depthB = (b.gridX + b.gridY) * 1000 + (b.elevation || 0);
    return depthA - depthB;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Overview */}
      <div className="p-5 sm:p-6 rounded-3xl border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-950/40 text-xs font-mono font-medium text-orange-300 mb-2">
            <Coffee className="w-3.5 h-3.5 text-orange-400" />
            <span>Prototype B — Shared Office Area & Reception Social Hub</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-100">
            Studio Reception, Breakroom & Cozy Lounge Zone
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
            Integrated social space combining ThirdAngle architecture, Antahonist amenities (coffee machine, water cooler, snack vending), and riekahq cozy lounge sofas.
          </p>
        </div>

        {/* Ambient indicator */}
        <div className="flex items-center gap-2 bg-stone-950 px-3 py-2 rounded-2xl border border-stone-800 text-xs font-mono">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-stone-300">Atmosphere:</span>
          <span className="text-amber-300 font-semibold">Warm Cozy Breakroom</span>
        </div>
      </div>

      {/* 2. Main Viewport Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#0b0d14] rounded-3xl border border-stone-800 p-4 relative overflow-hidden shadow-2xl min-h-[520px] flex items-center justify-center">
          {/* Cozy warm evening glow background */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-stone-950 via-amber-950/30 to-orange-600/15" />

          {/* Corporate SleepyKoala Studio Wall Signage */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-stone-950/90 border border-stone-700/80 shadow-lg flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider text-stone-200 uppercase font-mono">
              SleepyKoala Studio — Headquarters Atrium
            </span>
          </div>

          {/* Isometric World Stage */}
          <div className="relative w-[700px] h-[480px] shrink-0 [image-rendering:pixelated]">
            {/* Floor Tiles */}
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((_, c) => {
                const sx = originX + (c - r) * (TILE_W / 2);
                const sy = originY + (c + r) * (TILE_H / 2);
                return (
                  <div
                    key={`shared_floor_${c}_${r}`}
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

            {/* Placed Props */}
            {sortedProps.map((prop) => {
              const isWall = prop.category === 'wall';
              const sx = originX + (prop.gridX - prop.gridY) * (TILE_W / 2);
              const sy = originY + (prop.gridX + prop.gridY) * (TILE_H / 2);
              const isSelected = selectedProp?.id === prop.id;

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
                    isSelected ? 'filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''
                  }`}
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    zIndex,
                  }}
                  title={`${prop.name}`}
                >
                  <img
                    src={prop.assetPath}
                    alt={prop.name}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 border border-amber-400/80 rounded-lg pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Lounge Chat Overlay Simulation */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-stone-400 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Coffee className="w-3.5 h-3.5" />
              <span>Coffee Corner & Lounge Nook Active</span>
            </span>
            <span>ThirdAngle + Antahonist + riekahq Combined</span>
          </div>
        </div>

        {/* 3. Detail Inspector Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl border border-stone-800 bg-stone-900/80 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Smile className="w-4 h-4 text-orange-400" />
              <span>Amenity & Prop Detail</span>
            </h4>

            {selectedProp ? (
              <div className="space-y-4 text-xs">
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
                  <div className="text-stone-400 font-mono text-[10px]">FACILITY ITEM</div>
                  <div className="text-stone-100 font-bold text-sm">{selectedProp.name}</div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div className="text-stone-400 font-mono text-[10px] mb-1">COZY BENEFIT</div>
                  <p className="text-stone-200 leading-relaxed">{selectedProp.description}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-950/40 border border-stone-800/60 font-mono text-[10px] text-stone-400 flex items-center justify-between">
                  <span>Grid Location:</span>
                  <span className="text-orange-300 font-semibold">[{selectedProp.gridX}, {selectedProp.gridY}]</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400">Select an item in the lounge to view its details.</p>
            )}
          </div>

          {/* Social Hub Highlights */}
          <div className="p-5 rounded-3xl border border-stone-800 bg-stone-900/60 space-y-3">
            <h5 className="text-xs font-bold text-stone-300 uppercase tracking-wider font-mono">
              Shared Area Design Features
            </h5>
            <ul className="text-xs text-stone-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-stone-200">Zero Incongruity:</strong> riekahq velvet seating meshes seamlessly with ThirdAngle 2:1 carpet.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-stone-200">High Productivity & Rest:</strong> Espresso machine & spring water cooler promote healthy developer work-rest cycles.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-stone-200">Corporate Identity:</strong> SleepyKoala Studio branding and front desk receptionist terminal.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
