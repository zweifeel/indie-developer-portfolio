/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — PROCEDURAL OFFICE TEXTURE GENERATOR (LAPIS 3)
 * 
 * Generates crisp procedural canvas textures for floors, walls, carpets,
 * and illuminated 3D room signage boards at 0 cost, 0 network bandwidth,
 * and 60 FPS performance.
 * ============================================================================
 */

import * as THREE from 'three';
import { RoomSignageSpec } from '../../../types/virtualOffice3D';

/**
 * Check if HTML5 Canvas is available
 */
function isCanvasSupported(): boolean {
  return typeof document !== 'undefined' && !!document.createElement('canvas');
}

/**
 * Creates high-detail wood parquet floor texture with planks and bevel seams
 */
export function createParquetFloorTexture(
  baseColor: string = '#d4a373',
  darkPlankColor: string = '#bc8a5f',
  seamColor: string = '#8b5a2b'
): THREE.CanvasTexture | null {
  if (!isCanvasSupported()) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base tone
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Draw wood parquet planks
    const plankWidth = 128;
    const plankHeight = 32;

    for (let y = 0; y < 512; y += plankHeight) {
      const rowOffset = (Math.floor(y / plankHeight) % 2) * (plankWidth / 2);
      for (let x = -rowOffset; x < 512 + plankWidth; x += plankWidth) {
        // Subtle plank color variance
        const variance = ((x * 13 + y * 7) % 5) * 4;
        ctx.fillStyle = (x + y) % 2 === 0 ? baseColor : darkPlankColor;
        ctx.globalAlpha = 0.95;
        ctx.fillRect(x + 1, y + 1, plankWidth - 2, plankHeight - 2);

        // Wood grain streaks
        ctx.strokeStyle = seamColor;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.15;
        for (let g = 0; g < 3; g++) {
          const gy = y + 6 + g * 8 + (x % 3);
          ctx.beginPath();
          ctx.moveTo(x + 2, gy);
          ctx.lineTo(x + plankWidth - 2, gy + (variance % 3) - 1);
          ctx.stroke();
        }
      }
    }

    // Outer grid seam
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = seamColor;
    ctx.lineWidth = 1.5;
    for (let y = 0; y <= 512; y += plankHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  } catch {
    return null;
  }
}

/**
 * Creates modern office ceramic tile texture with clean grout lines
 */
export function createOfficeTileTexture(
  tileColor: string = '#334155',
  groutColor: string = '#1e293b'
): THREE.CanvasTexture | null {
  if (!isCanvasSupported()) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Grout background
    ctx.fillStyle = groutColor;
    ctx.fillRect(0, 0, 512, 512);

    // Tiles grid 4x4
    const tileSize = 120;
    const margin = 8;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const tx = x * (tileSize + margin) + margin / 2;
        const ty = y * (tileSize + margin) + margin / 2;

        // Subtle gradient on each tile
        const grad = ctx.createLinearGradient(tx, ty, tx + tileSize, ty + tileSize);
        grad.addColorStop(0, tileColor);
        grad.addColorStop(1, groutColor);
        ctx.fillStyle = grad;
        ctx.fillRect(tx, ty, tileSize, tileSize);

        // Highlight top & left bevel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty + tileSize);
        ctx.lineTo(tx, ty);
        ctx.lineTo(tx + tileSize, ty);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  } catch {
    return null;
  }
}

/**
 * Creates cozy fabric carpet texture for lounges and pantries
 */
export function createCarpetTexture(
  carpetColor: string = '#0f766e',
  accentWeave: string = '#115e59'
): THREE.CanvasTexture | null {
  if (!isCanvasSupported()) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = carpetColor;
    ctx.fillRect(0, 0, 256, 256);

    // Cross weave texture
    ctx.strokeStyle = accentWeave;
    ctx.lineWidth = 1.0;
    ctx.globalAlpha = 0.25;

    for (let i = 0; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  } catch {
    return null;
  }
}

/**
 * Creates vibrant corridor runner texture with edge guide lines
 */
export function createCorridorRunnerTexture(
  runnerColor: string = '#0284c7',
  guideColor: string = '#38bdf8'
): THREE.CanvasTexture | null {
  if (!isCanvasSupported()) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Carpet runner base
    ctx.fillStyle = runnerColor;
    ctx.fillRect(0, 0, 256, 512);

    // Guide edge stripes
    ctx.fillStyle = guideColor;
    ctx.fillRect(8, 0, 8, 512);
    ctx.fillRect(256 - 16, 0, 8, 512);

    // Repeating cross hashes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(256 - 24, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 8);
    return texture;
  } catch {
    return null;
  }
}

/**
 * Generates an illuminated 3D Room Signage Board Canvas Texture
 */
export function createRoomSignageTexture(
  spec: RoomSignageSpec
): THREE.CanvasTexture | null {
  if (!isCanvasSupported()) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark sleek acrylic board background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 128);

    // Neon accent glow border
    ctx.strokeStyle = spec.accentColorHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);

    // Inner subtle glow
    ctx.fillStyle = spec.accentColorHex;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(8, 8, 496, 112);
    ctx.globalAlpha = 1.0;

    // Indicator LED dot
    ctx.fillStyle = spec.accentColorHex;
    ctx.beginPath();
    ctx.arc(36, 46, 8, 0, Math.PI * 2);
    ctx.fill();

    // Main Project Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.title.toUpperCase(), 58, 48);

    // Subtitle / Department
    ctx.fillStyle = spec.accentColorHex;
    ctx.font = '600 18px "Courier New", monospace';
    ctx.fillText(`• ${spec.subtitle.toUpperCase()}`, 58, 88);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  } catch {
    return null;
  }
}
