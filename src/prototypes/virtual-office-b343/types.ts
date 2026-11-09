/**
 * ============================================================================
 * SLEEPYKOALA MILESTONE B3.4.3 — PROTOTYPE TYPES & DEFINITIONS
 * ============================================================================
 */

export type SubPrototypeTab =
  | 'comparison'
  | 'environment'
  | 'shared-area'
  | 'characters'
  | 'dompetnalar';

export interface AssetCandidateItem {
  id: string;
  name: string;
  category: 'Environment / Architecture' | 'Furniture & Electronics' | 'Human Characters' | 'Lounge / Interior';
  creator: string;
  sourceUrl: string;
  license: string;
  cost: string;
  format: string;
  gridRatio: string;
  anchor: string;
  status: 'APPROVED & TESTED' | 'TESTED COMPATIBLE' | 'BASELINE BENCHMARK' | 'DISQUALIFIED / BLOCKED';
  notes: string;
  keySprites: string[];
}

export interface IsometricTileCoord {
  col: number; // x in grid (0..N)
  row: number; // y in grid (0..N)
}

export interface PlacedProp {
  id: string;
  name: string;
  assetPath: string;
  gridX: number;
  gridY: number;
  elevation?: number; // z
  width?: number;
  height?: number;
  category: 'floor' | 'wall' | 'furniture' | 'decor' | 'character' | 'tech';
  description?: string;
}

export interface CharacterComparisonModel {
  candidateId: string;
  candidateName: string;
  creator: string;
  license: string;
  cost: string;
  spriteBounds: string;
  footAnchor: string;
  directions: string[];
  animationFrames: string;
  pros: string[];
  cons: string[];
  status: string;
}
