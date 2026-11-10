/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — KAYKIT ASSETS DOWNLOADER (CC0 1.0 UNIVERSAL)
 * 
 * Downloads official 3D low-poly characters (Adventurers) and office furniture
 * from KayKit Game Assets GitHub repositories to local public folder:
 * public/assets/virtual-office/models/kaykit/
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_RAW_ADVENTURERS = 'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/main/addons/kaykit_character_pack_adventures/Characters/gltf/';
const BASE_RAW_FURNITURE_GLTF = 'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/main/addons/kaykit_furniture_bits/Assets/gltf/';
const BASE_RAW_FURNITURE_TEX = 'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0/main/addons/kaykit_furniture_bits/Assets/texture/';

const CHARACTERS_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'virtual-office', 'models', 'kaykit', 'characters');
const FURNITURE_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'virtual-office', 'models', 'kaykit', 'furniture');

const ASSETS_TO_DOWNLOAD = [
  // Characters (GLB)
  { url: `${BASE_RAW_ADVENTURERS}Knight.glb`, dest: path.join(CHARACTERS_DIR, 'Knight.glb') },
  { url: `${BASE_RAW_ADVENTURERS}Mage.glb`, dest: path.join(CHARACTERS_DIR, 'Mage.glb') },
  { url: `${BASE_RAW_ADVENTURERS}Rogue.glb`, dest: path.join(CHARACTERS_DIR, 'Rogue.glb') },
  { url: `${BASE_RAW_ADVENTURERS}Barbarian.glb`, dest: path.join(CHARACTERS_DIR, 'Barbarian.glb') },

  // Furniture (GLTF + BIN)
  { url: `${BASE_RAW_FURNITURE_GLTF}table_medium.gltf`, dest: path.join(FURNITURE_DIR, 'table_medium.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}table_medium.bin`, dest: path.join(FURNITURE_DIR, 'table_medium.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}table_medium_long.gltf`, dest: path.join(FURNITURE_DIR, 'table_medium_long.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}table_medium_long.bin`, dest: path.join(FURNITURE_DIR, 'table_medium_long.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}chair_A.gltf`, dest: path.join(FURNITURE_DIR, 'chair_A.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}chair_A.bin`, dest: path.join(FURNITURE_DIR, 'chair_A.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}couch.gltf`, dest: path.join(FURNITURE_DIR, 'couch.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}couch.bin`, dest: path.join(FURNITURE_DIR, 'couch.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}shelf_B_large_decorated.gltf`, dest: path.join(FURNITURE_DIR, 'shelf_B_large_decorated.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}shelf_B_large_decorated.bin`, dest: path.join(FURNITURE_DIR, 'shelf_B_large_decorated.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}cactus_medium_A.gltf`, dest: path.join(FURNITURE_DIR, 'cactus_medium_A.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}cactus_medium_A.bin`, dest: path.join(FURNITURE_DIR, 'cactus_medium_A.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}lamp_table.gltf`, dest: path.join(FURNITURE_DIR, 'lamp_table.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}lamp_table.bin`, dest: path.join(FURNITURE_DIR, 'lamp_table.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}book_set.gltf`, dest: path.join(FURNITURE_DIR, 'book_set.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}book_set.bin`, dest: path.join(FURNITURE_DIR, 'book_set.bin') },
  { url: `${BASE_RAW_FURNITURE_GLTF}rug_rectangle_A.gltf`, dest: path.join(FURNITURE_DIR, 'rug_rectangle_A.gltf') },
  { url: `${BASE_RAW_FURNITURE_GLTF}rug_rectangle_A.bin`, dest: path.join(FURNITURE_DIR, 'rug_rectangle_A.bin') },

  // Shared Furniture Texture
  { url: `${BASE_RAW_FURNITURE_TEX}furniturebits_texture.png`, dest: path.join(FURNITURE_DIR, 'furniturebits_texture.png') },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`[SKIP] Exists: ${path.basename(dest)} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
      return resolve(dest);
    }

    console.log(`[DOWNLOAD] Fetching ${path.basename(dest)}...`);
    const file = fs.createWriteStream(dest);

    const request = https.get(url, { headers: { 'User-Agent': 'SleepyKoala-Studio-Asset-Fetcher' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          const sizeKb = (fs.statSync(dest).size / 1024).toFixed(1);
          console.log(`[SUCCESS] Saved ${path.basename(dest)} (${sizeKb} KB)`);
          resolve(dest);
        });
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  console.log('======================================================================');
  console.log('📦 SLEEPYKOALA STUDIO — KAYKIT CC0 ASSET DOWNLOADER');
  console.log('======================================================================');

  let successCount = 0;
  for (const item of ASSETS_TO_DOWNLOAD) {
    try {
      await downloadFile(item.url, item.dest);
      successCount++;
    } catch (err) {
      console.error(`[ERROR] Failed downloading ${item.url}:`, err.message);
    }
  }

  console.log('======================================================================');
  console.log(`🎉 Download Complete: ${successCount} / ${ASSETS_TO_DOWNLOAD.length} files verified.`);
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('Fatal error during download:', err);
  process.exit(1);
});
