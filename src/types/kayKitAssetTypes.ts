/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — KAYKIT ASSET TYPES & STUDIO ROLE MATRIX
 * 
 * CC0 1.0 Universal Low-Poly Characters & Office Furniture Specifications
 * ============================================================================
 */

export type KayKitCharacterType = 'Knight' | 'Mage' | 'Rogue' | 'Barbarian';

export interface KayKitCharacterModelConfig {
  readonly id: string;
  readonly characterType: KayKitCharacterType;
  readonly modelPath: string;
  readonly scale: number;
  readonly defaultAnimation?: string;
  readonly roleTitle: string;
  readonly department: string;
}

export type KayKitFurnitureType =
  | 'table_medium'
  | 'table_medium_long'
  | 'chair_A'
  | 'couch'
  | 'shelf_B_large_decorated'
  | 'cactus_medium_A'
  | 'lamp_table'
  | 'book_set'
  | 'rug_rectangle_A';

export interface KayKitFurnitureModelConfig {
  readonly id: KayKitFurnitureType;
  readonly modelPath: string;
  readonly scale: number;
}

export const KAYKIT_CHARACTER_PATHS: Record<KayKitCharacterType, string> = {
  Knight: '/assets/virtual-office/models/kaykit/characters/Knight.glb',
  Mage: '/assets/virtual-office/models/kaykit/characters/Mage.glb',
  Rogue: '/assets/virtual-office/models/kaykit/characters/Rogue.glb',
  Barbarian: '/assets/virtual-office/models/kaykit/characters/Barbarian.glb',
};

export const KAYKIT_FURNITURE_PATHS: Record<KayKitFurnitureType, string> = {
  table_medium: '/assets/virtual-office/models/kaykit/furniture/table_medium.gltf',
  table_medium_long: '/assets/virtual-office/models/kaykit/furniture/table_medium_long.gltf',
  chair_A: '/assets/virtual-office/models/kaykit/furniture/chair_A.gltf',
  couch: '/assets/virtual-office/models/kaykit/furniture/couch.gltf',
  shelf_B_large_decorated: '/assets/virtual-office/models/kaykit/furniture/shelf_B_large_decorated.gltf',
  cactus_medium_A: '/assets/virtual-office/models/kaykit/furniture/cactus_medium_A.gltf',
  lamp_table: '/assets/virtual-office/models/kaykit/furniture/lamp_table.gltf',
  book_set: '/assets/virtual-office/models/kaykit/furniture/book_set.gltf',
  rug_rectangle_A: '/assets/virtual-office/models/kaykit/furniture/rug_rectangle_A.gltf',
};

/**
 * Canonical mapping between project rooms and their leading KayKit adventurer
 */
export const PROJECT_LEAD_ADVENTURER_MAP: Record<string, KayKitCharacterType> = {
  'dompetnalar': 'Mage',        // Core Intelligence & Data Wizard (FinSmart/DompetNalar)
  'idle-master': 'Knight',       // Battle-hardened System Architect
  'mobile-kasir': 'Rogue',       // Swift & nimble UX specialist
  'idle-mining': 'Barbarian',    // Heavy resource & engine worker
  'the-broken-origin': 'Knight', // Medieval MMORPG hero (Frozen)
  'worklume': 'Mage',           // Organization & workflow conjurer
};
