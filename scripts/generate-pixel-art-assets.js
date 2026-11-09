/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PIXEL ART ASSET GENERATOR (MILESTONE B3)
 * 
 * Generates bespoke 2:1 isometric pixel art SVG sprites with:
 * - Crisp pixel edges (shape-rendering="crispEdges")
 * - 2:1 Dimetric perspective
 * - Cozy palette (warm wood, cream, sage green, soft teal, muted navy, warm amber)
 * - 100% legal CC0 / Studio Owned license
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSET_DIR = path.resolve(ROOT_DIR, 'public/assets/virtual-office');

// Helper to write SVG file
function writeSvg(subDir, fileName, content) {
  const targetDir = path.join(ASSET_DIR, subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, content.trim(), 'utf8');
  console.log(`✓ Generated: ${subDir}/${fileName}`);
}

// ----------------------------------------------------------------------------
// 1. FLOOR TILES (64x32 Isometric 2:1 Dimetric Tiles)
// ----------------------------------------------------------------------------

// Parquet Wood Floor Tile
writeSvg('floor-tiles', 'floor-parquet-tile.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32" shape-rendering="crispEdges">
  <!-- Isometric 2:1 Diamond Base -->
  <polygon points="32,0 64,16 32,32 0,16" fill="#8b5a2b" />
  <!-- Wood Planks Detail -->
  <polygon points="32,1 62,16 32,31 2,16" fill="#a67c52" />
  <!-- Plank Separators (Crisp Pixel Lines) -->
  <line x1="16" y1="8" x2="48" y2="24" stroke="#5c3a1e" stroke-width="1" />
  <line x1="48" y1="8" x2="16" y2="24" stroke="#784824" stroke-width="1" />
  <line x1="24" y1="12" x2="40" y2="20" stroke="#4a2810" stroke-width="1" />
  <!-- Isometric Highlight & Shadow Edges -->
  <polyline points="0,16 32,0 64,16" fill="none" stroke="#c49a6c" stroke-width="1" opacity="0.4" />
  <polyline points="0,16 32,32 64,16" fill="none" stroke="#3d2314" stroke-width="1" opacity="0.6" />
</svg>
`);

// Slate Dark Floor Tile
writeSvg('floor-tiles', 'floor-slate-tile.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32" shape-rendering="crispEdges">
  <polygon points="32,0 64,16 32,32 0,16" fill="#1e293b" />
  <polygon points="32,1 62,16 32,31 2,16" fill="#334155" />
  <line x1="32" y1="2" x2="32" y2="30" stroke="#0f172a" stroke-width="1" opacity="0.5" />
  <line x1="10" y1="16" x2="54" y2="16" stroke="#475569" stroke-width="1" opacity="0.3" />
  <polyline points="0,16 32,0 64,16" fill="none" stroke="#64748b" stroke-width="1" opacity="0.4" />
  <polyline points="0,16 32,32 64,16" fill="none" stroke="#090d16" stroke-width="1" opacity="0.8" />
</svg>
`);

// Cozy Carpet Tile
writeSvg('floor-tiles', 'floor-carpet-tile.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32" shape-rendering="crispEdges">
  <polygon points="32,0 64,16 32,32 0,16" fill="#2d3748" />
  <polygon points="32,1 62,16 32,31 2,16" fill="#3a4a5e" />
  <!-- Subtle Textile Pixel Stipple -->
  <rect x="20" y="10" width="2" height="1" fill="#4a5d75" />
  <rect x="42" y="10" width="2" height="1" fill="#4a5d75" />
  <rect x="31" y="15" width="2" height="2" fill="#5a708c" />
  <rect x="20" y="21" width="2" height="1" fill="#4a5d75" />
  <rect x="42" y="21" width="2" height="1" fill="#4a5d75" />
  <polyline points="0,16 32,0 64,16" fill="none" stroke="#5a708c" stroke-width="1" opacity="0.3" />
  <polyline points="0,16 32,32 64,16" fill="none" stroke="#1a202c" stroke-width="1" opacity="0.6" />
</svg>
`);

// ----------------------------------------------------------------------------
// 2. WALL TILES & WINDOWS
// ----------------------------------------------------------------------------

// Left Facing Wall with Wood Trim
writeSvg('wall-tiles', 'wall-warm-plaster-left.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="64" height="80" shape-rendering="crispEdges">
  <!-- Isometric Left Wall Plane -->
  <polygon points="0,0 64,32 64,80 0,48" fill="#e2ddd5" />
  <polygon points="1,2 63,33 63,77 1,46" fill="#f0ede6" />
  <!-- Baseboard Wood Trim -->
  <polygon points="0,42 64,74 64,80 0,48" fill="#5c3a1e" />
  <polygon points="0,43 64,75 64,78 0,46" fill="#8b5a2b" />
  <!-- Top Molding Trim -->
  <polygon points="0,0 64,32 64,36 0,4" fill="#8b5a2b" />
</svg>
`);

// Right Facing Wall with Wood Trim
writeSvg('wall-tiles', 'wall-warm-plaster-right.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="64" height="80" shape-rendering="crispEdges">
  <!-- Isometric Right Wall Plane -->
  <polygon points="0,32 64,0 64,48 0,80" fill="#d4cec3" />
  <polygon points="1,33 63,2 63,46 1,77" fill="#e5dfd4" />
  <!-- Baseboard Wood Trim -->
  <polygon points="0,74 64,42 64,48 0,80" fill="#4a2810" />
  <polygon points="0,75 64,43 64,46 0,78" fill="#784824" />
  <!-- Top Molding Trim -->
  <polygon points="0,32 64,0 64,4 0,36" fill="#784824" />
</svg>
`);

// Studio Cozy Window (Left Wall)
writeSvg('wall-tiles', 'wall-cozy-window.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" width="48" height="64" shape-rendering="crispEdges">
  <!-- Outer Window Frame -->
  <polygon points="4,10 44,30 44,58 4,38" fill="#5c3a1e" />
  <polygon points="6,12 42,30 42,56 6,38" fill="#8b5a2b" />
  <!-- Glass Pane with Sky Blue & Daylight Gradient -->
  <polygon points="8,15 40,31 40,53 8,37" fill="#bae6fd" />
  <!-- Window Panes Grid -->
  <line x1="24" y1="23" x2="24" y2="45" stroke="#8b5a2b" stroke-width="2" />
  <line x1="8" y1="26" x2="40" y2="42" stroke="#8b5a2b" stroke-width="2" />
  <!-- Sunlight Reflection Streak -->
  <polygon points="12,19 18,22 14,38 8,35" fill="#ffffff" opacity="0.6" />
  <!-- Cute Plant on Window Sill -->
  <rect x="22" y="38" width="6" height="4" fill="#b45309" />
  <circle cx="25" cy="36" r="3" fill="#22c55e" />
</svg>
`);

// Warm Brass Wall Sconce Lamp
writeSvg('wall-tiles', 'wall-sconce-lamp.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32" shape-rendering="crispEdges">
  <!-- Fixture Base -->
  <rect x="10" y="8" width="4" height="12" fill="#78350f" />
  <rect x="9" y="10" width="6" height="4" fill="#d97706" />
  <!-- Lantern Shade -->
  <polygon points="6,14 18,14 16,24 8,24" fill="#fbbf24" opacity="0.9" />
  <!-- Light Bulb Core -->
  <circle cx="12" cy="18" r="3" fill="#ffffff" />
  <!-- Ambient Glow Halo (Pixel Stipple) -->
  <circle cx="12" cy="18" r="8" fill="#fef08a" opacity="0.25" />
</svg>
`);

// ----------------------------------------------------------------------------
// 3. FURNITURE (Warm Wood Desks, Ergonomic Chairs, Bookshelves)
// ----------------------------------------------------------------------------

// Developer Desk (Isometric Left Facing, 64x56)
writeSvg('furniture', 'desk-wood-left.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56" width="64" height="56" shape-rendering="crispEdges">
  <!-- Desk Legs & Shadow -->
  <ellipse cx="32" cy="50" rx="26" ry="6" fill="#000000" opacity="0.25" />
  <rect x="6" y="24" width="4" height="26" fill="#3d2314" />
  <rect x="22" y="32" width="4" height="22" fill="#5c3a1e" />
  <rect x="54" y="24" width="4" height="26" fill="#3d2314" />
  <!-- Modesty Panel / Cable Management -->
  <polygon points="10,28 54,28 54,36 10,36" fill="#4a2810" />
  <!-- Table Top Thickness -->
  <polygon points="2,16 32,1 62,16 62,20 32,35 2,20" fill="#5c3a1e" />
  <!-- Table Top Surface -->
  <polygon points="2,16 32,1 62,16 32,31" fill="#8b5a2b" />
  <polygon points="4,16 32,3 60,16 32,29" fill="#a67c52" />
  <!-- Isometric Edge Highlight -->
  <line x1="2" y1="16" x2="32" y2="1" stroke="#d4a373" stroke-width="1" />
  <line x1="32" y1="1" x2="62" y2="16" stroke="#c49a6c" stroke-width="1" />
  <line x1="2" y1="20" x2="32" y2="35" stroke="#3d2314" stroke-width="1" />
  <line x1="32" y1="35" x2="62" y2="20" stroke="#2b180d" stroke-width="1" />
  <!-- Desk Cable Grommet Hole -->
  <ellipse cx="45" cy="14" rx="2" ry="1" fill="#2d180b" />
</svg>
`);

// Developer Desk (Isometric Right Facing, 64x56)
writeSvg('furniture', 'desk-wood-right.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56" width="64" height="56" shape-rendering="crispEdges">
  <ellipse cx="32" cy="50" rx="26" ry="6" fill="#000000" opacity="0.25" />
  <rect x="6" y="24" width="4" height="26" fill="#3d2314" />
  <rect x="38" y="32" width="4" height="22" fill="#5c3a1e" />
  <rect x="54" y="24" width="4" height="26" fill="#3d2314" />
  <polygon points="10,28 54,28 54,36 10,36" fill="#4a2810" />
  <polygon points="2,16 32,1 62,16 62,20 32,35 2,20" fill="#4a2810" />
  <polygon points="2,16 32,1 62,16 32,31" fill="#784824" />
  <polygon points="4,16 32,3 60,16 32,29" fill="#9c6e42" />
  <line x1="2" y1="16" x2="32" y2="1" stroke="#c49a6c" stroke-width="1" />
  <line x1="32" y1="1" x2="62" y2="16" stroke="#b08456" stroke-width="1" />
  <ellipse cx="19" cy="14" rx="2" ry="1" fill="#2d180b" />
</svg>
`);

// Cozy Office Swivel Chair (32x40)
writeSvg('furniture', 'office-chair-cozy.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40" shape-rendering="crispEdges">
  <!-- Castor Wheels & Base -->
  <ellipse cx="16" cy="38" rx="10" ry="3" fill="#000000" opacity="0.3" />
  <line x1="8" y1="36" x2="24" y2="36" stroke="#334155" stroke-width="2" />
  <line x1="16" y1="32" x2="16" y2="36" stroke="#475569" stroke-width="3" />
  <!-- Seat Cushion (Teal / Warm Navy Fabric) -->
  <polygon points="8,24 16,20 24,24 16,28" fill="#1e3a47" />
  <polygon points="8,24 16,20 24,24 24,26 16,30 8,26" fill="#152630" />
  <polygon points="9,24 16,21 23,24 16,27" fill="#2d5568" />
  <!-- Ergonomic Backrest -->
  <polygon points="10,8 22,8 24,20 8,20" fill="#1e3a47" />
  <polygon points="11,9 21,9 22,19 10,19" fill="#2d5568" />
  <rect x="13" y="12" width="6" height="4" fill="#447d99" />
</svg>
`);

// Cozy Bookshelf with Games and Manuals (48x72)
writeSvg('furniture', 'bookshelf-wood.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 72" width="48" height="72" shape-rendering="crispEdges">
  <!-- Base Shadow -->
  <ellipse cx="24" cy="68" rx="20" ry="4" fill="#000000" opacity="0.3" />
  <!-- Outer Wood Shell -->
  <polygon points="0,16 24,4 48,16 48,68 24,76 0,68" fill="#3d2314" />
  <polygon points="2,18 24,7 46,18 46,66 24,74 2,66" fill="#5c3a1e" />
  <!-- Shelf Dividers -->
  <!-- Shelf 1 (Top) -->
  <polygon points="4,28 24,18 44,28 44,30 24,20 4,30" fill="#8b5a2b" />
  <!-- Books on Shelf 1 -->
  <rect x="8" y="21" width="3" height="7" fill="#ef4444" />
  <rect x="12" y="19" width="4" height="9" fill="#3b82f6" />
  <rect x="17" y="20" width="3" height="8" fill="#10b981" />
  <rect x="28" y="21" width="4" height="7" fill="#f59e0b" />
  <rect x="33" y="19" width="3" height="9" fill="#8b5cf6" />
  <!-- Shelf 2 (Middle) -->
  <polygon points="4,44 24,34 44,44 44,46 24,36 4,46" fill="#8b5a2b" />
  <!-- Game Boxes / Binders on Shelf 2 -->
  <rect x="8" y="37" width="5" height="7" fill="#06b6d4" />
  <rect x="14" y="36" width="5" height="8" fill="#ec4899" />
  <rect x="28" y="38" width="6" height="6" fill="#64748b" />
  <rect x="35" y="37" width="4" height="7" fill="#a855f7" />
  <!-- Shelf 3 (Bottom) -->
  <polygon points="4,60 24,50 44,60 44,62 24,52 4,62" fill="#8b5a2b" />
  <!-- Storage Bins -->
  <polygon points="8,54 18,49 28,54 18,59" fill="#d97706" />
  <polygon points="26,55 35,50 44,55 35,60" fill="#0284c7" />
</svg>
`);

// ----------------------------------------------------------------------------
// 4. TECH & EQUIPMENT
// ----------------------------------------------------------------------------

// Dual Monitors Workstation Setup (48x36)
writeSvg('equipment', 'dual-monitors.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36" shape-rendering="crispEdges">
  <!-- Stands -->
  <rect x="14" y="22" width="6" height="6" fill="#334155" />
  <rect x="28" y="22" width="6" height="6" fill="#334155" />
  <!-- Left Monitor (Code Editor Screen) -->
  <polygon points="4,6 22,2 22,20 4,24" fill="#0f172a" />
  <polygon points="5,7 21,3 21,19 5,23" fill="#0284c7" />
  <!-- Code Lines Visual -->
  <line x1="7" y1="9" x2="15" y2="7" stroke="#38bdf8" stroke-width="1" />
  <line x1="9" y1="12" x2="19" y2="10" stroke="#f1f5f9" stroke-width="1" />
  <line x1="9" y1="15" x2="17" y2="13" stroke="#4ade80" stroke-width="1" />
  <line x1="7" y1="18" x2="13" y2="17" stroke="#f472b6" stroke-width="1" />
  <!-- Right Monitor (Preview / Telemetry Screen) -->
  <polygon points="24,2 42,6 42,24 24,20" fill="#0f172a" />
  <polygon points="25,3 41,7 41,23 25,19" fill="#1e1b4b" />
  <!-- Telemetry Graph Visual -->
  <polyline points="27,16 31,12 35,15 39,9" fill="none" stroke="#22d3ee" stroke-width="1.5" />
  <rect x="27" y="6" width="4" height="2" fill="#a7f3d0" />
  <rect x="33" y="6" width="6" height="2" fill="#fed7aa" />
  <!-- Keyboard & Mouse Pad -->
  <polygon points="12,27 24,24 36,27 24,30" fill="#1e293b" />
  <polygon points="14,27 24,25 34,27 24,29" fill="#334155" />
  <rect x="37" y="27" width="3" height="4" rx="1" fill="#64748b" />
</svg>
`);

// Retro Server Cluster Rack (36x64)
writeSvg('equipment', 'server-rack-retro.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 64" width="36" height="64" shape-rendering="crispEdges">
  <!-- Floor Shadow -->
  <ellipse cx="18" cy="60" rx="14" ry="4" fill="#000000" opacity="0.3" />
  <!-- Cabinet Body -->
  <polygon points="2,12 18,4 34,12 34,58 18,64 2,58" fill="#0f172a" />
  <polygon points="3,13 18,6 33,13 33,56 18,62 3,56" fill="#1e293b" />
  <!-- Server Unit 1 (Top) -->
  <polygon points="5,17 18,12 31,17 31,24 18,28 5,24" fill="#090d16" />
  <circle cx="9" cy="20" r="1.5" fill="#10b981" />
  <circle cx="13" cy="18" r="1.5" fill="#06b6d4" />
  <line x1="17" y1="16" x2="27" y2="20" stroke="#334155" stroke-width="1" />
  <!-- Server Unit 2 (Mid) -->
  <polygon points="5,29 18,24 31,29 31,36 18,40 5,36" fill="#090d16" />
  <circle cx="9" cy="32" r="1.5" fill="#f59e0b" />
  <circle cx="13" cy="30" r="1.5" fill="#10b981" />
  <line x1="17" y1="28" x2="27" y2="32" stroke="#334155" stroke-width="1" />
  <!-- Server Unit 3 (Bottom) -->
  <polygon points="5,41 18,36 31,41 31,48 18,52 5,48" fill="#090d16" />
  <circle cx="9" cy="44" r="1.5" fill="#10b981" />
  <circle cx="13" cy="42" r="1.5" fill="#8b5cf6" />
  <line x1="17" y1="40" x2="27" y2="44" stroke="#334155" stroke-width="1" />
</svg>
`);

// Espresso Coffee Machine (24x28)
writeSvg('equipment', 'coffee-machine.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" width="24" height="28" shape-rendering="crispEdges">
  <!-- Machine Base -->
  <polygon points="2,12 12,7 22,12 22,24 12,28 2,24" fill="#1c1917" />
  <polygon points="3,13 12,8 21,13 21,23 12,27 3,23" fill="#292524" />
  <!-- Pressure Gauge & Buttons -->
  <circle cx="12" cy="13" r="2" fill="#fbbf24" />
  <circle cx="16" cy="14" r="1" fill="#22c55e" />
  <!-- Coffee Spout & Cup -->
  <rect x="11" y="17" width="2" height="3" fill="#78716c" />
  <polygon points="9,20 12,18 15,20 15,24 12,26 9,24" fill="#f8fafc" />
  <!-- Steaming Vapor (Pixel Detail) -->
  <circle cx="12" cy="15" r="1" fill="#e2e8f0" opacity="0.6" />
  <circle cx="13" cy="13" r="0.8" fill="#e2e8f0" opacity="0.4" />
</svg>
`);

// Mobile Test Devices Stand (Android App Preset, 32x28)
writeSvg('equipment', 'test-phone-stand.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 28" width="32" height="28" shape-rendering="crispEdges">
  <!-- Wooden Stand Block -->
  <polygon points="2,14 16,7 30,14 16,21" fill="#8b5a2b" />
  <polygon points="2,14 16,21 30,14 30,18 16,25 2,18" fill="#5c3a1e" />
  <!-- Phone 1 (Left) -->
  <polygon points="6,6 12,3 12,16 6,19" fill="#0f172a" />
  <polygon points="7,7 11,5 11,15 7,17" fill="#38bdf8" />
  <!-- Tablet 2 (Center) -->
  <polygon points="14,4 24,9 24,19 14,14" fill="#0f172a" />
  <polygon points="15,6 23,10 23,18 15,14" fill="#34d399" />
</svg>
`);

// ----------------------------------------------------------------------------
// 5. DECORATIONS & PROPS
// ----------------------------------------------------------------------------

// Potted Monstera Plant (32x48)
writeSvg('decorations', 'plant-monstera.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48" shape-rendering="crispEdges">
  <!-- Shadow -->
  <ellipse cx="16" cy="44" rx="10" ry="3" fill="#000000" opacity="0.25" />
  <!-- Terracotta Planter -->
  <polygon points="8,32 16,28 24,32 24,42 16,46 8,42" fill="#c2410c" />
  <polygon points="9,33 16,29 23,33 23,41 16,45 9,41" fill="#ea580c" />
  <polygon points="8,32 16,28 24,32 16,35" fill="#7c2d12" />
  <!-- Stems -->
  <line x1="16" y1="31" x2="16" y2="18" stroke="#15803d" stroke-width="2" />
  <line x1="16" y1="24" x2="9" y2="16" stroke="#15803d" stroke-width="1.5" />
  <line x1="16" y1="22" x2="23" y2="14" stroke="#15803d" stroke-width="1.5" />
  <!-- Lush Pixel Leaves -->
  <!-- Top Center Leaf -->
  <polygon points="12,12 16,6 20,12 16,18" fill="#22c55e" />
  <polygon points="13,12 16,8 19,12 16,16" fill="#4ade80" />
  <!-- Left Leaf -->
  <polygon points="4,16 9,10 14,16 9,22" fill="#16a34a" />
  <!-- Right Leaf -->
  <polygon points="18,14 23,8 28,14 23,20" fill="#22c55e" />
</svg>
`);

// Wheeled Roadmap Whiteboard (48x54)
writeSvg('decorations', 'whiteboard-roadmap.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 54" width="48" height="54" shape-rendering="crispEdges">
  <!-- Wheels & Frame -->
  <rect x="6" y="46" width="3" height="4" fill="#334155" />
  <rect x="39" y="46" width="3" height="4" fill="#334155" />
  <line x1="7" y1="46" x2="7" y2="12" stroke="#475569" stroke-width="2" />
  <line x1="41" y1="46" x2="41" y2="12" stroke="#475569" stroke-width="2" />
  <!-- Board Surface -->
  <polygon points="4,10 44,10 44,40 4,40" fill="#f8fafc" />
  <rect x="4" y="8" width="40" height="2" fill="#64748b" />
  <rect x="4" y="40" width="40" height="2" fill="#64748b" />
  <!-- Diagram Content -->
  <text x="7" y="18" font-family="monospace" font-size="5" fill="#0284c7" font-weight="bold">ROADMAP</text>
  <rect x="7" y="21" width="10" height="4" fill="#38bdf8" />
  <rect x="20" y="21" width="12" height="4" fill="#4ade80" />
  <rect x="34" y="21" width="7" height="4" fill="#facc15" />
  <line x1="7" y1="28" x2="24" y2="28" stroke="#94a3b8" stroke-width="1" />
  <line x1="7" y1="32" x2="38" y2="32" stroke="#94a3b8" stroke-width="1" />
  <line x1="7" y1="36" x2="19" y2="36" stroke="#94a3b8" stroke-width="1" />
</svg>
`);

// Cozy Woven Rug (64x32)
writeSvg('decorations', 'cozy-rug-teal.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32" shape-rendering="crispEdges">
  <polygon points="32,2 62,16 32,30 2,16" fill="#134e4a" />
  <polygon points="32,4 58,16 32,28 6,16" fill="#115e59" />
  <!-- Woven Diamond Ornament -->
  <polygon points="32,8 48,16 32,24 16,16" fill="#2dd4bf" opacity="0.7" />
  <polygon points="32,11 42,16 32,21 22,16" fill="#f0fdfa" opacity="0.8" />
  <!-- Fringe Tassels -->
  <line x1="2" y1="16" x2="0" y2="15" stroke="#f0fdfa" stroke-width="1" />
  <line x1="62" y1="16" x2="64" y2="17" stroke="#f0fdfa" stroke-width="1" />
</svg>
`);

// Golden Studio Trophy (20x30)
writeSvg('decorations', 'studio-trophy.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 30" width="20" height="30" shape-rendering="crispEdges">
  <!-- Wooden Pedestal -->
  <polygon points="4,22 10,19 16,22 16,27 10,29 4,27" fill="#5c3a1e" />
  <polygon points="4,22 10,19 16,22 10,24" fill="#8b5a2b" />
  <!-- Golden Cup Stem -->
  <rect x="9" y="15" width="2" height="6" fill="#d97706" />
  <!-- Cup Body -->
  <polygon points="5,6 15,6 13,15 7,15" fill="#f59e0b" />
  <polygon points="6,7 14,7 12,14 8,14" fill="#fbbf24" />
  <!-- Handles -->
  <line x1="4" y1="8" x2="4" y2="12" stroke="#d97706" stroke-width="1.5" />
  <line x1="16" y1="8" x2="16" y2="12" stroke="#d97706" stroke-width="1.5" />
  <!-- Star on Cup -->
  <circle cx="10" cy="10" r="1.5" fill="#ffffff" />
</svg>
`);

// ----------------------------------------------------------------------------
// 6. THE 5 CORE PIXEL KOALA AGENTS (48x54 Crisp Isometric Characters)
// ----------------------------------------------------------------------------

function generateKoalaBase({ roleColor, secondaryColor, hat, accessory, deskObject }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56" width="48" height="56" shape-rendering="crispEdges">
  <!-- Shadow -->
  <ellipse cx="24" cy="50" rx="14" ry="4" fill="#000000" opacity="0.3" />

  <!-- KOALA EARS (Fluffy round with white tufts) -->
  <!-- Left Ear -->
  <circle cx="13" cy="16" r="7" fill="#64748b" />
  <circle cx="13" cy="16" r="4" fill="#f1f5f9" />
  <!-- Right Ear -->
  <circle cx="35" cy="16" r="7" fill="#64748b" />
  <circle cx="35" cy="16" r="4" fill="#f1f5f9" />

  <!-- HEAD (Warm Gray Koala) -->
  <ellipse cx="24" cy="22" rx="13" ry="11" fill="#64748b" />
  <ellipse cx="24" cy="23" rx="11" ry="9" fill="#94a3b8" />

  <!-- BIG NOSE (Characteristic Koala Oval) -->
  <ellipse cx="24" cy="25" rx="3.5" ry="5" fill="#1e293b" />
  <ellipse cx="23" cy="23" rx="1" ry="1.5" fill="#ffffff" opacity="0.6" />

  <!-- EXPRESSIVE EYES -->
  <circle cx="19" cy="21" r="1.8" fill="#0f172a" />
  <circle cx="29" cy="21" r="1.8" fill="#0f172a" />
  <circle cx="18.5" cy="20.5" r="0.6" fill="#ffffff" />
  <circle cx="28.5" cy="20.5" r="0.6" fill="#ffffff" />

  <!-- BODY & COZY SWEATER / UNIFORM -->
  <polygon points="16,32 32,32 36,46 12,46" fill="${roleColor}" />
  <!-- Collar / Trim -->
  <polygon points="20,32 24,36 28,32" fill="${secondaryColor || '#ffffff'}" />
  <!-- Arms resting forward -->
  <ellipse cx="14" cy="38" rx="3" ry="5" fill="#64748b" />
  <ellipse cx="34" cy="38" rx="3" ry="5" fill="#64748b" />
  <ellipse cx="16" cy="42" rx="2.5" ry="2.5" fill="#94a3b8" />
  <ellipse cx="32" cy="42" rx="2.5" ry="2.5" fill="#94a3b8" />

  ${hat || ''}
  ${accessory || ''}
  ${deskObject || ''}
</svg>
`;
}

// 1. Planner Agent (Koala Planner)
// Glasses, clipboard, cozy blue-gray cardigan
writeSvg('characters', 'koala-planner.svg', generateKoalaBase({
  roleColor: '#3b82f6', // Blueprint Blue
  secondaryColor: '#93c5fd',
  accessory: `
    <!-- Reading Glasses -->
    <rect x="16" y="19" width="6" height="4" fill="none" stroke="#f59e0b" stroke-width="1.5" />
    <rect x="26" y="19" width="6" height="4" fill="none" stroke="#f59e0b" stroke-width="1.5" />
    <line x1="22" y1="20" x2="26" y2="20" stroke="#f59e0b" stroke-width="1.5" />
  `,
  deskObject: `
    <!-- Task Clipboard -->
    <polygon points="20,38 28,34 32,44 24,48" fill="#8b5a2b" />
    <polygon points="21,39 27,36 30,43 24,46" fill="#f8fafc" />
    <line x1="23" y1="39" x2="27" y2="44" stroke="#0284c7" stroke-width="1" />
  `,
}));

// 2. Developer Agent (Koala Developer)
// Over-ear studio headphones, teal hoodie, dual monitor glow
writeSvg('characters', 'koala-developer.svg', generateKoalaBase({
  roleColor: '#0d9488', // Soft Studio Teal
  secondaryColor: '#5eead4',
  hat: `
    <!-- Over-Ear Studio Headphones -->
    <path d="M 12 17 Q 24 9 36 17" fill="none" stroke="#334155" stroke-width="2.5" />
    <rect x="9" y="17" width="4" height="8" rx="2" fill="#0f172a" />
    <rect x="35" y="17" width="4" height="8" rx="2" fill="#0f172a" />
    <rect x="10" y="19" width="2" height="4" fill="#14b8a6" />
    <rect x="36" y="19" width="2" height="4" fill="#14b8a6" />
  `,
  deskObject: `
    <!-- Mini Laptop / Mechanical Keyboard -->
    <polygon points="18,44 30,44 32,49 16,49" fill="#1e293b" />
    <line x1="19" y1="46" x2="29" y2="46" stroke="#2dd4bf" stroke-width="1" />
  `,
}));

// 3. Tester Agent (Koala Tester)
// Sage green vest, test phone tablet, bug-hunting magnifier
writeSvg('characters', 'koala-tester.svg', generateKoalaBase({
  roleColor: '#16a34a', // Sage / Emerald Green
  secondaryColor: '#86efac',
  accessory: `
    <!-- QA Inspection Monocle / Headset -->
    <circle cx="28.5" cy="21" r="3.5" fill="none" stroke="#10b981" stroke-width="1.5" />
    <line x1="31" y1="23" x2="35" y2="28" stroke="#10b981" stroke-width="1.5" />
  `,
  deskObject: `
    <!-- Glowing Android Test Device -->
    <polygon points="18,38 26,34 30,42 22,46" fill="#0f172a" />
    <polygon points="19,39 25,36 28,41 22,44" fill="#4ade80" />
    <!-- Android Bug Icon Dot -->
    <circle cx="24" cy="40" r="1.5" fill="#ffffff" />
  `,
}));

// 4. Reviewer Agent (Koala Reviewer)
// Warm amber scarf, review magnifying glass / notebook
writeSvg('characters', 'koala-reviewer.svg', generateKoalaBase({
  roleColor: '#d97706', // Warm Amber
  secondaryColor: '#fde68a',
  hat: `
    <!-- Cozy Winter Beret / Scholar Cap -->
    <ellipse cx="24" cy="13" rx="11" ry="4" fill="#78350f" />
    <circle cx="24" cy="11" r="2" fill="#b45309" />
  `,
  accessory: `
    <!-- Warm Cozy Knitted Scarf -->
    <path d="M 17 31 Q 24 35 31 31" fill="none" stroke="#d97706" stroke-width="4" />
    <rect x="25" y="33" width="5" height="10" fill="#b45309" />
  `,
  deskObject: `
    <!-- Review Checklist -->
    <polygon points="16,40 24,36 28,44 20,48" fill="#fef3c7" />
    <line x1="18" y1="41" x2="25" y2="44" stroke="#d97706" stroke-width="1" />
  `,
}));

// 5. Publisher Agent (Koala Publisher)
// Navy studio jacket, launch rocket emblem pin, distribution tablet
writeSvg('characters', 'koala-publisher.svg', generateKoalaBase({
  roleColor: '#1e3a8a', // Deep Navy
  secondaryColor: '#bfdbfe',
  hat: `
    <!-- Release Pilot Cap -->
    <polygon points="15,14 33,14 35,11 13,11" fill="#1e293b" />
    <rect x="17" y="11" width="14" height="4" fill="#1e3a8a" />
    <!-- Golden Wing Badge -->
    <polygon points="22,12 26,12 24,14" fill="#fbbf24" />
  `,
  accessory: `
    <!-- Studio ID Badge with Lanyard -->
    <line x1="24" y1="32" x2="24" y2="40" stroke="#f59e0b" stroke-width="1" />
    <rect x="22" y="39" width="4" height="5" fill="#f8fafc" />
    <rect x="23" y="40" width="2" height="2" fill="#0284c7" />
  `,
  deskObject: `
    <!-- Launch Controller Screen with Rocket Graphic -->
    <polygon points="18,40 28,35 32,43 22,48" fill="#0f172a" />
    <polygon points="19,41 27,37 30,42 22,46" fill="#38bdf8" />
    <!-- Tiny Rocket Shape -->
    <polygon points="25,39 27,41 23,43" fill="#ffffff" />
  `,
}));

console.log('\\n🎉 All SleepyKoala Cozy Pixel Art SVG Assets successfully generated!');
