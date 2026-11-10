/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — KAYKIT 3D MODEL LOADER & CACHING ENGINE
 * 
 * Provides asynchronous loading, master-mesh caching, and instanced cloning
 * for official KayKit Adventurers (Knight, Mage, Rogue, Barbarian) and
 * KayKit Furniture Bits in Three.js WebGL scenes.
 * ============================================================================
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  KayKitCharacterType,
  KayKitFurnitureType,
  KAYKIT_CHARACTER_PATHS,
  KAYKIT_FURNITURE_PATHS,
  PROJECT_LEAD_ADVENTURER_MAP,
} from '../../../types/kayKitAssetTypes';

/**
 * Cache for loaded master models
 */
const characterCache = new Map<KayKitCharacterType, THREE.Group>();
const furnitureCache = new Map<KayKitFurnitureType, THREE.Group>();
const pendingLoads = new Map<string, Promise<THREE.Group>>();

let sharedLoader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!sharedLoader) {
    sharedLoader = new GLTFLoader();
  }
  return sharedLoader;
}

/**
 * Deep clone a Three.js hierarchy with shared geometries & materials
 */
export function cloneModelHierarchy(source: THREE.Group): THREE.Group {
  const clone = source.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return clone;
}

/**
 * Asynchronously load and cache a KayKit Adventurer model
 */
export async function loadKayKitCharacterModel(type: KayKitCharacterType): Promise<THREE.Group> {
  if (characterCache.has(type)) {
    return cloneModelHierarchy(characterCache.get(type)!);
  }

  const modelPath = KAYKIT_CHARACTER_PATHS[type];
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
        root.name = `kaykit_master_${type}`;

        // Scale and align for studio office desks (units ~1.8m height)
        root.scale.set(1.0, 1.0, 1.0);
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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
    return cloneModelHierarchy(master);
  } finally {
    pendingLoads.delete(modelPath);
  }
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
 * Preload all core KayKit adventurers and essential office furniture
 */
export async function preloadKayKitStudioAssets(): Promise<void> {
  const characters: KayKitCharacterType[] = ['Knight', 'Mage', 'Rogue', 'Barbarian'];
  const furniture: KayKitFurnitureType[] = [
    'table_medium',
    'table_medium_long',
    'chair_A',
    'couch',
    'shelf_B_large_decorated',
    'cactus_medium_A',
    'lamp_table',
    'book_set',
    'rug_rectangle_A',
  ];

  await Promise.allSettled([
    ...characters.map((c) => loadKayKitCharacterModel(c)),
    ...furniture.map((f) => loadKayKitFurnitureModel(f)),
  ]);
}

/**
 * Resolve character adventurer class from project slug
 */
export function resolveAdventurerForProject(projectSlug: string, memberIndex: number = 0): KayKitCharacterType {
  const base = PROJECT_LEAD_ADVENTURER_MAP[projectSlug.toLowerCase()];
  if (base && memberIndex === 0) {
    return base;
  }
  const roster: KayKitCharacterType[] = ['Knight', 'Mage', 'Rogue', 'Barbarian'];
  return roster[memberIndex % roster.length];
}
