/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — KAYKIT 3D MODEL LOADER & CACHING ENGINE
 * 
 * Provides asynchronous loading, master-mesh caching, weapon cleaning (casual mode),
 * and instanced cloning for official KayKit characters and KayKit Furniture Bits
 * in Three.js WebGL scenes.
 * ============================================================================
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  KayKitCharacterType,
  KayKitFurnitureType,
  KAYKIT_CHARACTER_PATHS,
  KAYKIT_FURNITURE_PATHS,
  PROJECT_LEAD_ADVENTURER_MAP,
} from '../../../types/kayKitAssetTypes';
import { KAYKIT_FANTASY_NODES_TO_HIDE } from '../../../types/virtualOfficeThemes';
import type { HumanAttire3D } from '../../../types/virtualOffice3D';

/**
 * Cache for loaded master models & animations
 */
const characterCache = new Map<KayKitCharacterType, THREE.Group>();
const animationsCache = new Map<KayKitCharacterType, THREE.AnimationClip[]>();
const furnitureCache = new Map<KayKitFurnitureType, THREE.Group>();
const kenneyCache = new Map<string, THREE.Group>();
const pendingLoads = new Map<string, Promise<THREE.Group>>();
const attireTextureCache = new Map<string, THREE.CanvasTexture>();

let sharedLoader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!sharedLoader) {
    sharedLoader = new GLTFLoader();
  }
  return sharedLoader;
}

/**
 * Procedurally generate an office attire 8x4 palette texture for KayKit character rigs.
 * Completely replaces all medieval armor, shields, and fantasy metal with crisp office clothing:
 * Oxford shirts, polo/cardigans, tailored slacks/chinos, leather shoes/sneakers, and distinct natural hair colors.
 */
export function createOfficePaletteTexture(attire: HumanAttire3D): THREE.CanvasTexture {
  const cacheKey = `${attire.skinTone}_${attire.hairColor}_${attire.topColor}_${attire.accentColor || ''}_${attire.pantsColor}_${attire.shoesColor}`;
  if (attireTextureCache.has(cacheKey)) {
    return attireTextureCache.get(cacheKey)!;
  }

  // 512x512 Canvas for 8 cols x 4 rows (64px x 128px per swatch)
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  const cellW = 512 / 8; // 64
  const cellH = 512 / 4; // 128

  const skin = attire.skinTone || '#e0ac69';
  const hair = attire.hairColor || '#18181b';
  const top = attire.topColor || '#f8fafc';
  const accent = attire.accentColor || '#1e3a8a';
  const pants = attire.pantsColor || '#1e293b';
  const shoes = attire.shoesColor || '#111827';
  const eyes = '#18181b';
  const belt = '#3b2f2f';

  const fillCell = (col: number, row: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
    // Subtle shading gradient at bottom of cell for stylized clothing folds
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(col * cellW, row * cellH + cellH * 0.72, cellW, cellH * 0.28);
  };

  // Row 0 (Top)
  fillCell(0, 0, skin);   // Col 0: Face / Skin
  fillCell(1, 0, hair);   // Col 1: Natural Hair
  fillCell(2, 0, eyes);   // Col 2: Pupils
  fillCell(3, 0, top);    // Col 3: Shirt / Top Body
  fillCell(4, 0, accent); // Col 4: Collar / Cardigan
  fillCell(5, 0, skin);   // Col 5: Hands / Skin
  fillCell(6, 0, accent); // Col 6: Trim / Tie / Badge
  fillCell(7, 0, belt);   // Col 7: Belt / Watch

  // Row 1
  fillCell(0, 1, top);    // Col 0: Sleeves / Arms
  fillCell(1, 1, top);    // Col 1: Cuffs
  fillCell(2, 1, shoes);  // Col 2: Shoes / Sneakers
  fillCell(3, 1, pants);  // Col 3: Pants secondary
  fillCell(4, 1, top);    // Col 4: Shirt details
  fillCell(5, 1, accent); // Col 5: Cardigan trim
  fillCell(6, 1, pants);  // Col 6: Trousers / Slacks
  fillCell(7, 1, pants);  // Col 7: Pants primary

  // Row 2
  fillCell(0, 2, skin);
  fillCell(1, 2, hair);
  fillCell(2, 2, shoes);
  fillCell(3, 2, pants);
  fillCell(4, 2, top);
  fillCell(5, 2, top);
  fillCell(6, 2, pants);
  fillCell(7, 2, pants);

  // Row 3 (Bottom)
  fillCell(0, 3, skin);
  fillCell(1, 3, hair);
  fillCell(2, 3, shoes);
  fillCell(3, 3, pants);
  fillCell(4, 3, top);
  fillCell(5, 3, top);
  fillCell(6, 3, pants);
  fillCell(7, 3, pants);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  attireTextureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Deep clone a Three.js hierarchy (supports rigged SkinnedMesh via SkeletonUtils)
 * Injects custom office attire texture and eliminates all medieval knight armor/weapons.
 */
export function cloneModelHierarchy(source: THREE.Group, attire?: HumanAttire3D): THREE.Group {
  let clone: THREE.Group;
  try {
    clone = SkeletonUtils.clone(source) as THREE.Group;
  } catch {
    clone = source.clone(true);
  }

  const officeTex = attire ? createOfficePaletteTexture(attire) : null;

  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      // Apply customized office attire texture (removes metallic armor gradients)
      if (officeTex && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => {
            const clonedMat = m.clone() as THREE.MeshStandardMaterial;
            clonedMat.map = officeTex;
            clonedMat.needsUpdate = true;
            return clonedMat;
          });
        } else {
          const clonedMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
          clonedMat.map = officeTex;
          clonedMat.needsUpdate = true;
          mesh.material = clonedMat;
        }
      }
    }
    // Re-enforce weapon and armor removal on clones
    const nameLower = child.name.toLowerCase();
    if (
      KAYKIT_FANTASY_NODES_TO_HIDE.includes(child.name as any) ||
      nameLower.includes('armor') ||
      nameLower.includes('shield') ||
      nameLower.includes('sword') ||
      nameLower.includes('helmet') ||
      nameLower.includes('cape')
    ) {
      child.visible = false;
    }
  });
  return clone;
}

/**
 * Asynchronously load and cache a KayKit character model
 * Strips all weapons, shields, helmets, and wizard hats so they appear as casual office humans.
 */
export async function loadKayKitCharacterModel(
  type: KayKitCharacterType,
  attire?: HumanAttire3D
): Promise<THREE.Group> {
  if (characterCache.has(type)) {
    return cloneModelHierarchy(characterCache.get(type)!, attire);
  }

  const modelPath = KAYKIT_CHARACTER_PATHS[type];
  if (pendingLoads.has(modelPath)) {
    const loaded = await pendingLoads.get(modelPath)!;
    return cloneModelHierarchy(loaded, attire);
  }

  const loadPromise = new Promise<THREE.Group>((resolve, reject) => {
    const loader = getLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;
        root.name = `kaykit_master_${type}`;

        // Cache animations
        if (gltf.animations && gltf.animations.length > 0) {
          animationsCache.set(type, gltf.animations);
        }

        // Scale and align for studio office desks (units ~1.8m height)
        root.scale.set(1.0, 1.0, 1.0);
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          // Remove all weapons, armor, hats, and capes for clean office casual look
          const nameLower = child.name.toLowerCase();
          if (
            KAYKIT_FANTASY_NODES_TO_HIDE.includes(child.name as any) ||
            nameLower.includes('armor') ||
            nameLower.includes('shield') ||
            nameLower.includes('sword') ||
            nameLower.includes('helmet') ||
            nameLower.includes('cape')
          ) {
            child.visible = false;
          }
        });

        characterCache.set(type, root);
        resolve(root);
      },
      undefined,
      (err) => {
        console.warn(`[KayKitLoader] Unable to load ${modelPath}, fallback will be used:`, err);
        reject(err);
      }
    );
  });

  pendingLoads.set(modelPath, loadPromise);

  try {
    const master = await loadPromise;
    return cloneModelHierarchy(master, attire);
  } finally {
    pendingLoads.delete(modelPath);
  }
}

/**
 * Get animation clips for a KayKit character
 */
export function getCharacterAnimations(type: KayKitCharacterType): THREE.AnimationClip[] {
  return animationsCache.get(type) || [];
}

/**
 * Asynchronously load and cache a KayKit Furniture model
 */
export async function loadKayKitFurnitureModel(type: KayKitFurnitureType): Promise<THREE.Group> {
  if (furnitureCache.has(type)) {
    return cloneModelHierarchy(furnitureCache.get(type)!);
  }

  const modelPath = KAYKIT_FURNITURE_PATHS[type];
  if (pendingLoads.has(modelPath)) {
    const loaded = await pendingLoads.get(modelPath)!;
    return cloneModelHierarchy(loaded);
  }

  const loadPromise = new Promise<THREE.Group>((resolve, reject) => {
    const loader = getLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;
        root.name = `kaykit_furniture_${type}`;

        // Normalize furniture scale
        root.scale.set(1.2, 1.2, 1.2);
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        furnitureCache.set(type, root);
        resolve(root);
      },
      undefined,
      (err) => {
        console.warn(`[KayKitLoader] Unable to load furniture ${modelPath}:`, err);
        reject(err);
      }
    );
  });

  pendingLoads.set(modelPath, loadPromise);

  try {
    const master = await loadPromise;
    return cloneModelHierarchy(master);
  } finally {
    pendingLoads.delete(modelPath);
  }
}

/**
 * Asynchronously load and cache a Kenney CC0 Furniture / Prop model
 */
export async function loadKenneyFurnitureModel(name: string): Promise<THREE.Group> {
  if (kenneyCache.has(name)) {
    return cloneModelHierarchy(kenneyCache.get(name)!);
  }

  const modelPath = `/assets/virtual-office/models/kenney/${name}.glb`;
  if (pendingLoads.has(modelPath)) {
    const loaded = await pendingLoads.get(modelPath)!;
    return cloneModelHierarchy(loaded);
  }

  const loadPromise = new Promise<THREE.Group>((resolve, reject) => {
    const loader = getLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene;
        root.name = `kenney_${name}`;
        root.scale.set(1.5, 1.5, 1.5);
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        kenneyCache.set(name, root);
        resolve(root);
      },
      undefined,
      (err) => {
        console.warn(`[KenneyLoader] Unable to load ${modelPath}:`, err);
        reject(err);
      }
    );
  });

  pendingLoads.set(modelPath, loadPromise);

  try {
    const master = await loadPromise;
    return cloneModelHierarchy(master);
  } finally {
    pendingLoads.delete(modelPath);
  }
}

/**
 * Preload all core KayKit characters and essential office furniture
 */
export async function preloadKayKitStudioAssets(): Promise<void> {
  const characters: KayKitCharacterType[] = ['Knight', 'Mage', 'Rogue', 'Barbarian'];
  const furniture: KayKitFurnitureType[] = [
    'table_medium',
    'table_medium_long',
    'chair_A',
    'chair_B_wood',
    'couch',
    'armchair',
    'shelf_B_large_decorated',
    'cabinet_medium_decorated',
    'cactus_medium_A',
    'lamp_table',
    'lamp_standing',
    'book_set',
    'rug_rectangle_A',
    'rug_oval_A',
    'pictureframe_large_A',
    'table_low',
    'kitchencounter_straight_A_decorated',
    'kitchencounter_sink',
    'table_round_A_decorated',
    'bench',
    'box_A',
  ];

  await Promise.allSettled([
    ...characters.map((c) => loadKayKitCharacterModel(c)),
    ...furniture.map((f) => loadKayKitFurnitureModel(f)),
  ]);
}

/**
 * Resolve character class from project slug
 */
export function resolveAdventurerForProject(projectSlug: string, memberIndex: number = 0): KayKitCharacterType {
  const base = PROJECT_LEAD_ADVENTURER_MAP[projectSlug.toLowerCase()];
  if (base && memberIndex === 0) {
    return base;
  }
  const roster: KayKitCharacterType[] = ['Knight', 'Mage', 'Rogue', 'Barbarian'];
  return roster[memberIndex % roster.length];
}
