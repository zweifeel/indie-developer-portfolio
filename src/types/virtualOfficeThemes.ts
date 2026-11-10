/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE 3D THEMES & KAYKIT CONFIG (LAPIS 1)
 * 
 * Strict Data Contracts for:
 * 1. Thematic Room Styling (Fintech, Game Dev, Retail POS, Mining, SaaS Workspace)
 * 2. KayKit Rig Filter (hides fantasy weapons, hats, armor, keeps clean human)
 * 3. Official KayKit Furniture & Equipment Asset Catalog (CC0)
 * ============================================================================
 */

// Types for Virtual Office Themes

/**
 * List of fantasy equipment node names inside official KayKit GLBs to hide
 */
export const KAYKIT_FANTASY_NODES_TO_HIDE = [
  // Knight
  '1H_Sword',
  '2H_Sword',
  '1H_Sword_Offhand',
  'Badge_Shield',
  'Rectangle_Shield',
  'Round_Shield',
  'Spike_Shield',
  'Knight_Helmet',
  'Knight_Cape',
  // Mage
  '1H_Wand',
  '2H_Staff',
  'Spellbook',
  'Spellbook_open',
  'Mage_Hat',
  'Mage_Cape',
  // Rogue
  '1H_Crossbow',
  '2H_Crossbow',
  'Knife',
  'Knife_Offhand',
  'Throwable',
  'Rogue_Cape',
  // Barbarian
  '1H_Axe',
  '2H_Axe',
  '1H_Axe_Offhand',
  'Barbarian_Round_Shield',
  'Barbarian_Hat',
  'Barbarian_Cape',
] as const;

export type KayKitFantasyNodeName = (typeof KAYKIT_FANTASY_NODES_TO_HIDE)[number];

/**
 * Distinct Environment Styles for Canonical Projects
 */
export type RoomEnvironmentStyle =
  | 'FINTECH_METRIC'     // DompetNalar (Navy, Candlestick TV, Modern Vault)
  | 'GAME_DEV_CYBERPUNK' // IDLE MASTER (Dark Purple, RGB Neon, Arcade Cabinet)
  | 'RETAIL_STORE_POS'   // Mobile Kasir (Terracotta, POS Register, Mini Supermarket)
  | 'MINING_INDUSTRIAL'  // Idle Mining (Dark Stone, Timber, Gold Pickaxe Plaque)
  | 'WORKSPACE_SCANDI'   // Worklume (Birch Timber, Giant Kanban, Monstera Plant)
  | 'CENTRAL_PANTRY';    // Pantry & Plaza (Bar Counter, Espresso Machine, Lounge)

export interface ThematicRoomSpec {
  style: RoomEnvironmentStyle;
  floorColor: number;
  floorBorderColor: number;
  accentWallColor: number;
  neonAccentColor?: number;
  ambientWarmth: number;
  thematicProps: readonly string[];
}

export const PROJECT_THEMATIC_SPECS: Record<string, ThematicRoomSpec> = {
  'dompetnalar': {
    style: 'FINTECH_METRIC',
    floorColor: 0x1e293b, // Slate navy carpet
    floorBorderColor: 0x38bdf8, // Electric sky blue border
    accentWallColor: 0x0f172a,
    neonAccentColor: 0x38bdf8,
    ambientWarmth: 0.9,
    thematicProps: ['server_terminal', 'financial_chart_tv', 'cabinet_medium_decorated', 'couch'],
  },
  'idle-master': {
    style: 'GAME_DEV_CYBERPUNK',
    floorColor: 0x2e1065, // Deep violet carpet
    floorBorderColor: 0xa855f7, // Neon purple
    accentWallColor: 0x180838,
    neonAccentColor: 0xec4899,
    ambientWarmth: 1.0,
    thematicProps: ['arcade_cabinet', 'armchair', 'shelf_B_large_decorated', 'lamp_standing'],
  },
  'mobile-kasir': {
    style: 'RETAIL_STORE_POS',
    floorColor: 0x78350f, // Warm terracotta parquet
    floorBorderColor: 0xf59e0b, // Amber border
    accentWallColor: 0x451a03,
    neonAccentColor: 0xf59e0b,
    ambientWarmth: 1.1,
    thematicProps: ['pos_cash_register', 'shelf_B_large_decorated', 'cactus_medium_A', 'cabinet_medium_decorated'],
  },
  'idle-mining': {
    style: 'MINING_INDUSTRIAL',
    floorColor: 0x292524, // Dark industrial slate/stone
    floorBorderColor: 0xca8a04, // Golden brass trim
    accentWallColor: 0x1c1917,
    neonAccentColor: 0xeab308,
    ambientWarmth: 0.85,
    thematicProps: ['mining_trophy_plaque', 'shelf_B_large_decorated', 'lamp_table', 'cabinet_medium_decorated'],
  },
  'worklume': {
    style: 'WORKSPACE_SCANDI',
    floorColor: 0xe2e8f0, // Light Scandinavian birch timber
    floorBorderColor: 0x10b981, // Emerald trim
    accentWallColor: 0xf1f5f9,
    neonAccentColor: 0x10b981,
    ambientWarmth: 1.15,
    thematicProps: ['giant_kanban_board', 'armchair', 'cactus_medium_A', 'couch'],
  },
  'the-broken-origin': {
    style: 'FINTECH_METRIC',
    floorColor: 0x09090b, // Pure obsidian slab (Frozen)
    floorBorderColor: 0x64748b, // Muted slate border
    accentWallColor: 0x18181b,
    neonAccentColor: 0x64748b,
    ambientWarmth: 0.7,
    thematicProps: ['server_terminal', 'shelf_B_large_decorated', 'cabinet_medium_decorated'],
  },
};
