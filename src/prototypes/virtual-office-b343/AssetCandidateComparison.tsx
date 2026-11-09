import React, { useState } from 'react';
import {
  XCircle,
  ExternalLink,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { AssetCandidateItem } from './types';

export const ASSET_CANDIDATES: AssetCandidateItem[] = [
  {
    id: 'thirdangle-starter',
    name: 'ThirdAngle Isometric Office Starter',
    category: 'Environment / Architecture',
    creator: 'Playworks North / ThirdAngle',
    sourceUrl: 'https://thirdangle.itch.io/office-starter',
    license: 'Permissive Commercial (modification & games permitted)',
    cost: '$0.00 (Free Starter Pack)',
    format: '13 Transparent PNGs (64x64 props/floors, 64x128 walls)',
    gridRatio: '2:1 Dimetric Isometric (64x32 footprint)',
    anchor: 'Bottom-anchored at y=59 on 64x64 canvas',
    status: 'APPROVED & TESTED',
    notes: 'Exact 2:1 dimetric projection. Walls join seamlessly at corners. Seamless 64x32 diamond carpet tile.',
    keySprites: [
      '/assets/virtual-office/b343/environment/floor_office_carpet_tile.png',
      '/assets/virtual-office/b343/environment/wall_plain_left.png',
      '/assets/virtual-office/b343/environment/wall_office_window_right.png',
      '/assets/virtual-office/b343/environment/cubicle_workstation.png',
      '/assets/virtual-office/b343/environment/standing_desk.png',
      '/assets/virtual-office/b343/environment/planter_divider_shelf.png',
    ],
  },
  {
    id: 'antahonist-kit',
    name: 'Free Office Desk 3D Pixel Art Kit',
    category: 'Furniture & Electronics',
    creator: 'Antahonist',
    sourceUrl: 'https://antahonist.itch.io/free-office-desk-3d-pixel-art-kit',
    license: 'Permissive Commercial (games, client work, unlimited commercial)',
    cost: '$0.00 (Free Asset Pack)',
    format: '36 Sprites across 3 scales (32px, 64px, 128px)',
    gridRatio: '2:1 Dimetric Isometric (matches ThirdAngle 64x64)',
    anchor: 'Bottom-centered ground contact',
    status: 'APPROVED & TESTED',
    notes: 'Extensive office tech and stationery set: dual monitors, desk lamps, whiteboards, filing cabinets, coffee machines, water coolers.',
    keySprites: [
      '/assets/virtual-office/b343/furniture/office_desk.png',
      '/assets/virtual-office/b343/furniture/office_monitor.png',
      '/assets/virtual-office/b343/furniture/whiteboard.png',
      '/assets/virtual-office/b343/furniture/filing_cabinet.png',
      '/assets/virtual-office/b343/furniture/water_cooler.png',
      '/assets/virtual-office/b343/furniture/coffee_machine.png',
      '/assets/virtual-office/b343/furniture/potted_plant.png',
      '/assets/virtual-office/b343/furniture/laser_printer.png',
    ],
  },
  {
    id: 'riekahq-interiors',
    name: 'Isometric Home Interiors Lite',
    category: 'Lounge / Interior',
    creator: 'riekahq',
    sourceUrl: 'https://riekahq.itch.io/isometric-interiors-lite',
    license: 'Permissive Commercial (games and commercial projects)',
    cost: '$0.00 (Free Lite Pack)',
    format: '33 Sprites (sofas, tables, lamps, animated screen)',
    gridRatio: 'Isometric / Axonometric',
    anchor: 'Bottom-centered ground plane',
    status: 'TESTED COMPATIBLE',
    notes: 'Ideal for Breakroom / Social Hub and Reception waiting lounge. Provides comfortable sofas and warm indoor plants.',
    keySprites: [
      '/assets/virtual-office/b343/environment/riekahq/sofa_red_a.png',
      '/assets/virtual-office/b343/environment/riekahq/table_dining_a.png',
      '/assets/virtual-office/b343/environment/riekahq/lamp_floor_a.png',
      '/assets/virtual-office/b343/environment/riekahq/plant_pot_a.png',
    ],
  },
  {
    id: 'rigelriv-modern',
    name: 'Free Isometric Modern Character',
    category: 'Human Characters',
    creator: 'RigelRiv',
    sourceUrl: 'https://rigelriv.itch.io/isometric-modern-character',
    license: 'Permissive Commercial Free Asset',
    cost: '$0.00 (Free Asset)',
    format: '7 Adult Character sprites (22x40px sprite bounding box)',
    gridRatio: 'Isometric 2:1 angle view',
    anchor: 'Bottom-edge foot ground line',
    status: 'APPROVED & TESTED',
    notes: 'True isometric angle with 2-frame idle animation. Scalable at 1.5x-2x for desk coordination. Single direction (SE facing).',
    keySprites: [
      '/assets/virtual-office/b343/characters/rigelriv/frame_0_0.png',
      '/assets/virtual-office/b343/characters/rigelriv/frame_0_1.png',
      '/assets/virtual-office/b343/characters/rigelriv/frame_1_0.png',
      '/assets/virtual-office/b343/characters/rigelriv/frame_2_0.png',
    ],
  },
  {
    id: 'modern-citizens',
    name: 'Modern Citizens - Animated Characters (Baseline)',
    category: 'Human Characters',
    creator: 'nacl1234',
    sourceUrl: 'https://nacl1234.itch.io/modern-citizens-top-down-animated-characters',
    license: 'CC0 / Public Domain Equivalent',
    cost: '$0.00 (Free Asset)',
    format: '48x48px sprites on 128x128px canvas',
    gridRatio: 'High-Angle Axonometric / 3/4 Bird\'s-Eye',
    anchor: 'Ground contact at y=124 on 128x128 frame',
    status: 'BASELINE BENCHMARK',
    notes: 'Approved B3.4.1 baseline. 100% adult professional roles, 4 directions, 8-frame walk cycles. Integrates well behind 64x64 desks.',
    keySprites: [
      '/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_office_m_b/stand_down.png',
      '/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_casual_f_b/stand_down.png',
      '/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_office_m_blue/stand_down.png',
      '/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_office_f_c/stand_down.png',
      '/assets/virtual-office/b343/characters/modern-citizens/frames/char_citizens_elder_m_a/stand_down.png',
    ],
  },
];

export const DISQUALIFIED_CANDIDATES = [
  {
    name: 'Gridwright Character Creator',
    reason: 'SaaS recurring subscription model ($1 trial with watermarked free tier). Violates zero-cost $0.00 requirement.',
  },
  {
    name: 'HappyHustle: Modern Rooms & People',
    reason: 'Requires authenticated claim account and utilizes 90-degree top-down RPG perspective incompatible with 2:1 isometric camera.',
  },
  {
    name: 'Gridwright City People',
    reason: 'Host server returned HTTP 404 (Asset file unretrievable).',
  },
];

export const AssetCandidateComparison: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('thirdangle-starter');

  const current = ASSET_CANDIDATES.find((c) => c.id === selectedCandidate) || ASSET_CANDIDATES[0];

  return (
    <div className="space-y-8">
      {/* 1. Header Overview & Zero Cost Banner */}
      <div className="p-6 rounded-3xl border border-stone-800 bg-stone-900/90 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-xs font-mono font-medium text-emerald-300 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Financial Cost Verified — $0.00 / Rp 0</span>
            </div>
            <h3 className="text-2xl font-bold text-stone-100">
              Isometric Asset Candidate Compatibility Matrix
            </h3>
            <p className="text-sm text-stone-300 mt-2 max-w-3xl leading-relaxed">
              Comparison and compatibility audit of candidate isometric environment, furniture, tech, and human character pixel-art assets against the 2:1 dimetric grid projection standard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-stone-950/70 p-4 rounded-2xl border border-stone-800/80">
            <div className="text-center px-3 py-1 border-r border-stone-800">
              <div className="text-xs text-stone-400 font-mono">Total Budget</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">$0.00</div>
            </div>
            <div className="text-center px-3 py-1 border-r border-stone-800">
              <div className="text-xs text-stone-400 font-mono">External Hotlinks</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">0</div>
            </div>
            <div className="text-center px-3 py-1">
              <div className="text-xs text-stone-400 font-mono">Grid Ratio</div>
              <div className="text-lg font-bold text-cyan-400 font-mono">2:1 Dimetric</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Candidate Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3">
        {ASSET_CANDIDATES.map((c) => {
          const isSelected = c.id === selectedCandidate;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCandidate(c.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                  : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                {c.category.split('/')[0].trim()}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Selected Candidate Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl border border-stone-800 bg-stone-900/70 shadow-xl">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>{current.name}</span>
            </h4>
            <span
              className={`text-xs font-mono px-3 py-1 rounded-full font-semibold border ${
                current.status === 'APPROVED & TESTED'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : current.status === 'BASELINE BENCHMARK'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {current.status}
            </span>
          </div>

          <p className="text-sm text-stone-300 leading-relaxed">{current.notes}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-stone-400 font-mono">Creator / Studio</div>
              <div className="text-stone-200 font-semibold mt-0.5">{current.creator}</div>
            </div>
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-stone-400 font-mono">Commercial License</div>
              <div className="text-emerald-300 font-semibold mt-0.5">{current.license}</div>
            </div>
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-stone-400 font-mono">Grid Ratio & Footprint</div>
              <div className="text-cyan-300 font-semibold mt-0.5">{current.gridRatio}</div>
            </div>
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-stone-400 font-mono">Canvas Anchor Rule</div>
              <div className="text-stone-200 font-semibold mt-0.5">{current.anchor}</div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={current.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>View Source on itch.io</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Sprite Preview Grid */}
        <div className="lg:col-span-5 bg-stone-950 p-5 rounded-2xl border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-3 pb-2 border-b border-stone-800">
              <span>LIVE SPRITE PREVIEWS</span>
              <span>100% LOCAL PNGs</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 place-items-center py-2">
              {current.keySprites.map((path, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-center p-1.5 relative group hover:border-cyan-500/50 transition-all shadow-inner"
                  title={path}
                >
                  <img
                    src={path}
                    alt="sprite"
                    className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
                  />
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-[9px] font-mono text-center text-cyan-300">
                    {path.split('/').pop()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-stone-400 text-center pt-3 border-t border-stone-800/60">
            Rendering mode: <span className="text-cyan-300">image-rendering: pixelated</span> (Zero blurry interpolation)
          </div>
        </div>
      </div>

      {/* 4. Disqualified / Blocked Candidates Audit */}
      <div className="p-6 rounded-3xl border border-stone-800/80 bg-stone-900/40">
        <h4 className="text-sm font-bold text-stone-300 flex items-center gap-2 mb-4">
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Disqualified / Blocked Candidates Audit</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DISQUALIFIED_CANDIDATES.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80">
              <div className="text-xs font-semibold text-rose-300 mb-1">{item.name}</div>
              <p className="text-xs text-stone-400 leading-relaxed">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
