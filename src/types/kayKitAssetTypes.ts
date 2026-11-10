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
  | 'chair_B_wood'
  | 'couch'
  | 'armchair'
  | 'shelf_B_large_decorated'
  | 'cabinet_medium_decorated'
  | 'cactus_medium_A'
  | 'lamp_table'
  | 'lamp_standing'
  | 'book_set'
  | 'rug_rectangle_A'
  | 'rug_oval_A'
  | 'pictureframe_large_A'
  | 'table_low'
  | 'kitchencounter_straight_A_decorated'
  | 'kitchencounter_sink'
  | 'table_round_A_decorated'
  | 'bench'
  | 'box_A';

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
  chair_B_wood: '/assets/virtual-office/models/kaykit/furniture/chair_B_wood.gltf',
  couch: '/assets/virtual-office/models/kaykit/furniture/couch.gltf',
  armchair: '/assets/virtual-office/models/kaykit/furniture/armchair.gltf',
  shelf_B_large_decorated: '/assets/virtual-office/models/kaykit/furniture/shelf_B_large_decorated.gltf',
  cabinet_medium_decorated: '/assets/virtual-office/models/kaykit/furniture/cabinet_medium_decorated.gltf',
  cactus_medium_A: '/assets/virtual-office/models/kaykit/furniture/cactus_medium_A.gltf',
  lamp_table: '/assets/virtual-office/models/kaykit/furniture/lamp_table.gltf',
  lamp_standing: '/assets/virtual-office/models/kaykit/furniture/lamp_standing.gltf',
  book_set: '/assets/virtual-office/models/kaykit/furniture/book_set.gltf',
  rug_rectangle_A: '/assets/virtual-office/models/kaykit/furniture/rug_rectangle_A.gltf',
  rug_oval_A: '/assets/virtual-office/models/kaykit/furniture/rug_oval_A.gltf',
  pictureframe_large_A: '/assets/virtual-office/models/kaykit/furniture/pictureframe_large_A.gltf',
  table_low: '/assets/virtual-office/models/kaykit/furniture/table_low.gltf',
  kitchencounter_straight_A_decorated: '/assets/virtual-office/models/kaykit/furniture/kitchencounter_straight_A_decorated.gltf',
  kitchencounter_sink: '/assets/virtual-office/models/kaykit/furniture/kitchencounter_sink.gltf',
  table_round_A_decorated: '/assets/virtual-office/models/kaykit/furniture/table_round_A_decorated.gltf',
  bench: '/assets/virtual-office/models/kaykit/furniture/bench.gltf',
  box_A: '/assets/virtual-office/models/kaykit/furniture/box_A.gltf',
};

/**
 * Canonical mapping between project rooms and their leading KayKit character
 */
export const PROJECT_LEAD_ADVENTURER_MAP: Record<string, KayKitCharacterType> = {
  'dompetnalar': 'Mage',
  'idle-master': 'Knight',
  'mobile-kasir': 'Rogue',
  'idle-mining': 'Barbarian',
  'the-broken-origin': 'Knight',
  'worklume': 'Mage',
};
