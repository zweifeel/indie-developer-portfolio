import React, { useState, useEffect } from 'react';
import {
  Compass,
  ZoomIn,
  RotateCcw,
  Eye,
  Layers,
  Building2,
  Film
} from 'lucide-react';
import { CoreAgentRole } from '../../types/virtualOffice';

/**
 * B3.4.2 — Independent Character Instance Contract
 * Every project owns 5 independent agent instances. Total = 30 project-agent instances.
 */
export interface ProjectAgentInstance {
  instanceId: string;
  projectId: string;
  projectName: string;
  role: CoreAgentRole;
  displayName: string;
  charAssetKey: string;
  stationPos: { x: number; y: number };
  facing: 'down' | 'side' | 'up';
  activity: string;
  state: 'working' | 'reviewing' | 'testing' | 'planning' | 'publishing' | 'walking';
  deskItem?: string;
}

/**
 * Canonical 6 projects with their 5 independent agent instances each (30 total)
 * B3.4.2: Positions updated to match reconstructed campus layout
 */
export const PROJECT_AGENT_INSTANCES: ProjectAgentInstance[] = [
  // 1. DompetNalar (Finance & Productivity) — room center (530, 370)
  {
    instanceId: 'agent_dompetnalar_planner',
    projectId: 'dompetnalar',
    projectName: 'DompetNalar',
    role: 'PLANNER',
    displayName: 'Budi (Finance Roadmap Lead)',
    charAssetKey: 'char_citizens_office_m_b',
    stationPos: { x: 408, y: 298 },
    facing: 'down',
    activity: 'Memetakan model cashflow runway & validasi compliance Google Play',
    state: 'planning',
    deskItem: 'Dual 4K Financial Charts'
  },
  {
    instanceId: 'agent_dompetnalar_developer',
    projectId: 'dompetnalar',
    projectName: 'DompetNalar',
    role: 'DEVELOPER',
    displayName: 'Reza (Ledger & SQLite Engineer)',
    charAssetKey: 'char_citizens_casual_f_b',
    stationPos: { x: 506, y: 298 },
    facing: 'down',
    activity: 'Implementasi enkripsi SQLCipher untuk database transaksi offline',
    state: 'working',
    deskItem: 'IDE & SQLite Benchmark'
  },
  {
    instanceId: 'agent_dompetnalar_tester',
    projectId: 'dompetnalar',
    projectName: 'DompetNalar',
    role: 'TESTER',
    displayName: 'Kevin (Biometric & Security QA)',
    charAssetKey: 'char_citizens_office_m_blue',
    stationPos: { x: 604, y: 298 },
    facing: 'side',
    activity: 'Uji penetrasi local authentication biometric & PIN recovery',
    state: 'testing',
    deskItem: 'Android Test Array'
  },
  {
    instanceId: 'agent_dompetnalar_reviewer',
    projectId: 'dompetnalar',
    projectName: 'DompetNalar',
    role: 'REVIEWER',
    displayName: 'Dewi (Architecture Reviewer)',
    charAssetKey: 'char_citizens_office_f_c',
    stationPos: { x: 450, y: 348 },
    facing: 'down',
    activity: 'Review zero-leakage privacy manifest & sanitasi log keuangan',
    state: 'reviewing',
    deskItem: 'Security Audit Checklist'
  },
  {
    instanceId: 'agent_dompetnalar_publisher',
    projectId: 'dompetnalar',
    projectName: 'DompetNalar',
    role: 'PUBLISHER',
    displayName: 'Hartono (Release & Compliance Lead)',
    charAssetKey: 'char_citizens_elder_m_a',
    stationPos: { x: 562, y: 348 },
    facing: 'down',
    activity: 'Verifikasi Google Play Financial Services Policy & app-ads.txt',
    state: 'publishing',
    deskItem: 'Console Release Dossier'
  },

  // 2. IDLE MASTER (Casual Mobile Game) — room center (1870, 370)
  {
    instanceId: 'agent_idlemaster_planner',
    projectId: 'idle-master',
    projectName: 'IDLE MASTER',
    role: 'PLANNER',
    displayName: 'Dimas (Game Loop Designer)',
    charAssetKey: 'char_citizens_office_m_b',
    stationPos: { x: 1748, y: 298 },
    facing: 'down',
    activity: 'Menyusun curve probabilitas gacha & balancing pacing chapter',
    state: 'planning',
    deskItem: 'Economy Progression Model'
  },
  {
    instanceId: 'agent_idlemaster_developer',
    projectId: 'idle-master',
    projectName: 'IDLE MASTER',
    role: 'DEVELOPER',
    displayName: 'Rian (Idle Math & Tick Engineer)',
    charAssetKey: 'char_citizens_casual_f_b',
    stationPos: { x: 1846, y: 298 },
    facing: 'down',
    activity: 'Optimasi kalkulasi akumulasi koin offline dengan BigNumber arithmetic',
    state: 'working',
    deskItem: 'Unity Game Simulator'
  },
  {
    instanceId: 'agent_idlemaster_tester',
    projectId: 'idle-master',
    projectName: 'IDLE MASTER',
    role: 'TESTER',
    displayName: 'Fajar (60 FPS Performance QA)',
    charAssetKey: 'char_citizens_office_m_blue',
    stationPos: { x: 1944, y: 298 },
    facing: 'side',
    activity: 'Stress test 60 FPS thermal throttling pada 8 profil perangkat Android',
    state: 'testing',
    deskItem: 'Framerate Profiler'
  },
  {
    instanceId: 'agent_idlemaster_reviewer',
    projectId: 'idle-master',
    projectName: 'IDLE MASTER',
    role: 'REVIEWER',
    displayName: 'Sarah (Game Feel & UX Reviewer)',
    charAssetKey: 'char_citizens_office_f_c',
    stationPos: { x: 1790, y: 348 },
    facing: 'down',
    activity: 'Review kepuasan tap haptics, particle timing, dan UI layout',
    state: 'reviewing',
    deskItem: 'Haptic Feedback Tool'
  },
  {
    instanceId: 'agent_idlemaster_publisher',
    projectId: 'idle-master',
    projectName: 'IDLE MASTER',
    role: 'PUBLISHER',
    displayName: 'Bambang (Play Store Monetization Lead)',
    charAssetKey: 'char_citizens_elder_m_a',
    stationPos: { x: 1902, y: 348 },
    facing: 'down',
    activity: 'Konfigurasi Google Play Billing SDK 7 & ad mediation placement',
    state: 'publishing',
    deskItem: 'Play Console Dashboard'
  },

  // 3. Mobile Kasir (Business / POS) — room center (530, 640)
  {
    instanceId: 'agent_mobilekasir_planner',
    projectId: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    role: 'PLANNER',
    displayName: 'Taufik (Retail Flow Planner)',
    charAssetKey: 'char_citizens_office_m_b',
    stationPos: { x: 408, y: 568 },
    facing: 'down',
    activity: 'Spesifikasi alur checkout kilat 3 ketukan dan split-bill merchant',
    state: 'planning'
  },
  {
    instanceId: 'agent_mobilekasir_developer',
    projectId: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    role: 'DEVELOPER',
    displayName: 'Bagus (Thermal Bluetooth Dev)',
    charAssetKey: 'char_citizens_casual_f_b',
    stationPos: { x: 506, y: 568 },
    facing: 'down',
    activity: 'Driver printing ESC/POS Bluetooth untuk thermal printer 58mm/80mm',
    state: 'working'
  },
  {
    instanceId: 'agent_mobilekasir_tester',
    projectId: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    role: 'TESTER',
    displayName: 'Ilham (Barcode Scanner QA)',
    charAssetKey: 'char_citizens_office_m_blue',
    stationPos: { x: 604, y: 568 },
    facing: 'side',
    activity: 'Uji akurasi pemindaian barcode QRIS & EAN-13 kecepatan tinggi',
    state: 'testing'
  },
  {
    instanceId: 'agent_mobilekasir_reviewer',
    projectId: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    role: 'REVIEWER',
    displayName: 'Nisa (Ledger Integrity Auditor)',
    charAssetKey: 'char_citizens_office_f_c',
    stationPos: { x: 450, y: 618 },
    facing: 'down',
    activity: 'Audit rekonsiliasi kas harian & pencegahan selisih shift kasir',
    state: 'reviewing'
  },
  {
    instanceId: 'agent_mobilekasir_publisher',
    projectId: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    role: 'PUBLISHER',
    displayName: 'Slamet (Merchant Release Manager)',
    charAssetKey: 'char_citizens_elder_m_a',
    stationPos: { x: 562, y: 618 },
    facing: 'down',
    activity: 'Perekrutan penguji tertutup 20 merchant aktif Google Play',
    state: 'publishing'
  },

  // 4. Idle Mining (Simulation Game) — room center (1870, 640)
  {
    instanceId: 'agent_idlemining_planner',
    projectId: 'idle-mining',
    projectName: 'Idle Mining',
    role: 'PLANNER',
    displayName: 'Hendra (Mine Economy Architect)',
    charAssetKey: 'char_citizens_office_m_b',
    stationPos: { x: 1748, y: 568 },
    facing: 'down',
    activity: 'Balancing rasio drill upgrade vs ore multiplier pada kedalaman 2000m',
    state: 'planning'
  },
  {
    instanceId: 'agent_idlemining_developer',
    projectId: 'idle-mining',
    projectName: 'Idle Mining',
    role: 'DEVELOPER',
    displayName: 'Aditya (Shaft Simulation Dev)',
    charAssetKey: 'char_citizens_casual_f_b',
    stationPos: { x: 1846, y: 568 },
    facing: 'down',
    activity: 'Implementasi algoritma pooling partikel runtuhan batu & elevator',
    state: 'working'
  },
  {
    instanceId: 'agent_idlemining_tester',
    projectId: 'idle-mining',
    projectName: 'Idle Mining',
    role: 'TESTER',
    displayName: 'Wahyu (Prestige Reset QA)',
    charAssetKey: 'char_citizens_office_m_blue',
    stationPos: { x: 1944, y: 568 },
    facing: 'side',
    activity: 'Verifikasi stabilitas prestige multiplier dan reset artifact save-data',
    state: 'testing'
  },
  {
    instanceId: 'agent_idlemining_reviewer',
    projectId: 'idle-mining',
    projectName: 'Idle Mining',
    role: 'REVIEWER',
    displayName: 'Ratna (Resource Loop Reviewer)',
    charAssetKey: 'char_citizens_office_f_c',
    stationPos: { x: 1790, y: 618 },
    facing: 'down',
    activity: 'Review anti-cheat timestamp clock-skew detection pada offline progress',
    state: 'reviewing'
  },
  {
    instanceId: 'agent_idlemining_publisher',
    projectId: 'idle-mining',
    projectName: 'Idle Mining',
    role: 'PUBLISHER',
    displayName: 'Subagyo (Simulation Release Lead)',
    charAssetKey: 'char_citizens_elder_m_a',
    stationPos: { x: 1902, y: 618 },
    facing: 'down',
    activity: 'Persiapan materi ASO, target keyword tambang, dan bundle icon',
    state: 'publishing'
  },

  // 5. The Broken Origin (Roblox MMORPG) — room center (1870, 910)
  {
    instanceId: 'agent_tbo_planner',
    projectId: 'the-broken-origin',
    projectName: 'The Broken Origin',
    role: 'PLANNER',
    displayName: 'Arya (World Lore & Raid Planner)',
    charAssetKey: 'char_citizens_office_m_b',
    stationPos: { x: 1748, y: 838 },
    facing: 'down',
    activity: 'Penyusunan alur questline Benua Aethelgard & raid boss loot-table',
    state: 'planning'
  },
  {
    instanceId: 'agent_tbo_developer',
    projectId: 'the-broken-origin',
    projectName: 'The Broken Origin',
    role: 'DEVELOPER',
    displayName: 'Gilang (Netcode & Combat Dev)',
    charAssetKey: 'char_citizens_casual_f_b',
    stationPos: { x: 1846, y: 838 },
    facing: 'down',
    activity: 'Sinkronisasi state multiplayer 60 tick & server authoritative rollback',
    state: 'working'
  },
  {
    instanceId: 'agent_tbo_tester',
    projectId: 'the-broken-origin',
    projectName: 'The Broken Origin',
    role: 'TESTER',
    displayName: 'Bayu (Combat Lag QA)',
    charAssetKey: 'char_citizens_office_m_blue',
    stationPos: { x: 1944, y: 838 },
    facing: 'side',
    activity: 'Simulasi beban 50 concurrent player dalam satu arena dungeon',
    state: 'testing'
  },
  {
    instanceId: 'agent_tbo_reviewer',
    projectId: 'the-broken-origin',
    projectName: 'The Broken Origin',
    role: 'REVIEWER',
    displayName: 'Maya (VFX & Animation Auditor)',
    charAssetKey: 'char_citizens_office_f_c',
    stationPos: { x: 1790, y: 888 },
    facing: 'down',
    activity: 'Review memory budget model 3D & batas partikel mobile Roblox',
    state: 'reviewing'
  },
  {
    instanceId: 'agent_tbo_publisher',
    projectId: 'the-broken-origin',
    projectName: 'The Broken Origin',
    role: 'PUBLISHER',
    displayName: 'Djoko (Roblox Experience Manager)',
    charAssetKey: 'char_citizens_elder_m_a',
    stationPos: { x: 1902, y: 888 },
    facing: 'down',
    activity: 'Penerbitan asset manifest OTA & verifikasi Roblox compliance',
    state: 'publishing'
  },

  // 6. Worklume (Enterprise SaaS) — room center (530, 910)
  {
    instanceId: 'agent_worklume_planner',
    projectId: 'worklume',
    projectName: 'Worklume',
    role: 'PLANNER',
    displayName: 'Farhan (SaaS Product Strategist)',
    charAssetKey: 'char_citizens_office_m_b',
    stationPos: { x: 408, y: 838 },
    facing: 'down',
    activity: 'Perancangan arsitektur multi-tenant organization & RBAC permission',
    state: 'planning'
  },
  {
    instanceId: 'agent_worklume_developer',
    projectId: 'worklume',
    projectName: 'Worklume',
    role: 'DEVELOPER',
    displayName: 'Eko (Microservices Architect)',
    charAssetKey: 'char_citizens_casual_f_b',
    stationPos: { x: 506, y: 838 },
    facing: 'down',
    activity: 'Pembangunan event bus asynchronous untuk sinkronisasi log real-time',
    state: 'working'
  },
  {
    instanceId: 'agent_worklume_tester',
    projectId: 'worklume',
    projectName: 'Worklume',
    role: 'TESTER',
    displayName: 'Danang (Load & Stress QA)',
    charAssetKey: 'char_citizens_office_m_blue',
    stationPos: { x: 604, y: 838 },
    facing: 'side',
    activity: 'Benchmarking latency query 100.000 audit record pada database cloud',
    state: 'testing'
  },
  {
    instanceId: 'agent_worklume_reviewer',
    projectId: 'worklume',
    projectName: 'Worklume',
    role: 'REVIEWER',
    displayName: 'Sinta (Enterprise Security Reviewer)',
    charAssetKey: 'char_citizens_office_f_c',
    stationPos: { x: 450, y: 888 },
    facing: 'down',
    activity: 'Verifikasi enkripsi AES-256 at-rest dan zero-trust API tokens',
    state: 'reviewing'
  },
  {
    instanceId: 'agent_worklume_publisher',
    projectId: 'worklume',
    projectName: 'Worklume',
    role: 'PUBLISHER',
    displayName: 'Winarto (SaaS Release Operations)',
    charAssetKey: 'char_citizens_elder_m_a',
    stationPos: { x: 562, y: 888 },
    facing: 'down',
    activity: 'Deploy pipeline canary release & SLA uptime monitoring 99.98%',
    state: 'publishing'
  }
];

export type CameraMode =
  | 'OVERVIEW'
  | 'RECEPTION'
  | 'DOMPETNALAR'
  | 'IDLE_MASTER'
  | 'MOBILE_KASIR'
  | 'IDLE_MINING'
  | 'THE_BROKEN_ORIGIN'
  | 'WORKLUME'
  | 'PLAZA'
  | 'BOARDROOM';

interface ViewportPreset {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

const VIEWPORT_PRESETS: Record<CameraMode, ViewportPreset> = {
  OVERVIEW: { x: 0, y: 0, w: 2400, h: 1400, label: 'Full Connected HQ Campus' },
  RECEPTION: { x: 800, y: 30, w: 800, h: 460, label: 'Main Reception & Lounge' },
  DOMPETNALAR: { x: 130, y: 170, w: 800, h: 420, label: 'DompetNalar Finance Suite' },
  IDLE_MASTER: { x: 1470, y: 170, w: 800, h: 420, label: 'IDLE MASTER Game Studio' },
  MOBILE_KASIR: { x: 130, y: 440, w: 800, h: 420, label: 'Mobile Kasir POS Hub' },
  IDLE_MINING: { x: 1470, y: 440, w: 800, h: 420, label: 'Idle Mining Production Room' },
  THE_BROKEN_ORIGIN: { x: 1470, y: 710, w: 800, h: 420, label: 'The Broken Origin MMORPG' },
  WORKLUME: { x: 130, y: 710, w: 800, h: 420, label: 'Worklume SaaS Operations' },
  PLAZA: { x: 850, y: 170, w: 700, h: 420, label: 'Collaboration Lounge' },
  BOARDROOM: { x: 700, y: 1000, w: 1000, h: 380, label: 'Executive Boardroom' }
};

/* ─── Isometric SVG Rendering Helpers ─── */
const IsoBlock = ({ x, y, w, d, h, t, l, r, s = '#3a3020', sw = 0.5 }: {
  x: number; y: number; w: number; d: number; h: number;
  t: string; l: string; r: string; s?: string; sw?: number;
}) => (
  <g>
    <polygon points={`${x},${y - d} ${x + w},${y} ${x},${y + d} ${x - w},${y}`} fill={t} stroke={s} strokeWidth={sw} />
    {h > 0 && (<>
      <polygon points={`${x - w},${y} ${x},${y + d} ${x},${y + d + h} ${x - w},${y + h}`} fill={l} stroke={s} strokeWidth={sw} />
      <polygon points={`${x},${y + d} ${x + w},${y} ${x + w},${y + h} ${x},${y + d + h}`} fill={r} stroke={s} strokeWidth={sw} />
    </>)}
  </g>
);

const IsoDesk = ({ x, y }: { x: number; y: number }) => (
  <IsoBlock x={x} y={y} w={22} d={11} h={8} t="#9c8060" l="#7c6040" r="#8c7050" />
);

const IsoMonitor = ({ x, y, c = '#22d3ee' }: { x: number; y: number; c?: string }) => (
  <g>
    <IsoBlock x={x} y={y - 6} w={1} d={7} h={9} t="#2a2a30" l="#111820" r="#181825" s="#333" />
    <line x1={x - 6} y1={y - 14} x2={x + 6} y2={y - 8} stroke={c} strokeWidth="1.2" opacity="0.5" />
  </g>
);

const IsoChair = ({ x, y }: { x: number; y: number }) => (
  <g>
    <IsoBlock x={x} y={y} w={6} d={6} h={3} t="#404040" l="#303030" r="#383838" s="#222" />
    <IsoBlock x={x} y={y - 5} w={6} d={1.5} h={10} t="#484848" l="#383838" r="#404040" s="#222" />
  </g>
);

const IsoPlant = ({ x, y }: { x: number; y: number }) => (
  <g>
    <IsoBlock x={x} y={y} w={4} d={4} h={6} t="#9c7850" l="#7c5830" r="#8c6840" s="#5a4020" />
    <ellipse cx={x} cy={y - 8} rx={9} ry={7} fill="#3d8a50" stroke="#2d6a3f" strokeWidth="0.5" />
    <ellipse cx={x - 3} cy={y - 10} rx={5} ry={4} fill="#4da860" opacity="0.7" />
  </g>
);

const IsoPlantTall = ({ x, y }: { x: number; y: number }) => (
  <g>
    <IsoBlock x={x} y={y} w={5} d={5} h={10} t="#8c6840" l="#6c4820" r="#7c5830" s="#4a3018" />
    <ellipse cx={x} cy={y - 14} rx={14} ry={11} fill="#2d7a40" stroke="#1d5a30" strokeWidth="0.6" />
    <ellipse cx={x + 4} cy={y - 17} rx={8} ry={6} fill="#3d9a55" opacity="0.6" />
    <ellipse cx={x - 5} cy={y - 12} rx={6} ry={5} fill="#4daa65" opacity="0.5" />
  </g>
);

const IsoBookshelf = ({ x, y }: { x: number; y: number }) => (
  <g>
    <IsoBlock x={x} y={y} w={18} d={7} h={28} t="#7c5a38" l="#5c3a18" r="#6c4a28" />
    <line x1={x - 16} y1={y + 10} x2={x + 2} y2={y + 1} stroke="#8c6a48" strokeWidth="0.6" />
    <line x1={x - 16} y1={y + 18} x2={x + 2} y2={y + 9} stroke="#8c6a48" strokeWidth="0.6" />
    <IsoBlock x={x - 8} y={y + 4} w={5} d={3} h={4} t="#c04040" l="#a03030" r="#b03838" s="#803030" />
    <IsoBlock x={x + 2} y={y + 3} w={4} d={3} h={5} t="#4060c0" l="#3050a0" r="#3858b0" s="#2840a0" />
    <IsoBlock x={x - 5} y={y + 12} w={6} d={3} h={4} t="#c0a040" l="#a08030" r="#b09038" s="#806020" />
  </g>
);

const IsoSofa = ({ x, y, c = '#6a5548' }: { x: number; y: number; c?: string }) => {
  const dl = '#' + Math.max(0, parseInt(c.slice(1, 3), 16) - 24).toString(16).padStart(2, '0')
    + Math.max(0, parseInt(c.slice(3, 5), 16) - 24).toString(16).padStart(2, '0')
    + Math.max(0, parseInt(c.slice(5, 7), 16) - 24).toString(16).padStart(2, '0');
  return (
    <g>
      <IsoBlock x={x} y={y} w={30} d={12} h={6} t={c} l={dl} r={c} s="#3a2818" />
      <IsoBlock x={x} y={y - 8} w={30} d={2} h={10} t={c} l={dl} r={c} s="#3a2818" />
    </g>
  );
};

const IsoCoffeeTable = ({ x, y }: { x: number; y: number }) => (
  <IsoBlock x={x} y={y} w={14} d={8} h={5} t="#b09070" l="#907050" r="#a08060" />
);

const IsoWhiteboard = ({ x, y, wx, wy }: { x: number; y: number; wx: number; wy: number }) => (
  <g>
    <polygon points={`${x},${y} ${x + wx},${y + wy} ${x + wx},${y + wy - 22} ${x},${y - 22}`} fill="#e8e4d8" stroke="#888" strokeWidth="0.7" />
    <polygon points={`${x + 2},${y - 2} ${x + wx - 2},${y + wy - 2} ${x + wx - 2},${y + wy - 20} ${x + 2},${y - 20}`} fill="#f4f0e8" stroke="#bbb" strokeWidth="0.3" />
  </g>
);

const IsoWallDisplay = ({ x, y, wx, wy, c = '#06b6d4' }: { x: number; y: number; wx: number; wy: number; c?: string }) => (
  <g>
    <polygon points={`${x},${y} ${x + wx},${y + wy} ${x + wx},${y + wy - 18} ${x},${y - 18}`} fill="#111827" stroke="#333" strokeWidth="0.7" />
    <polygon points={`${x + 1},${y - 1} ${x + wx - 1},${y + wy - 1} ${x + wx - 1},${y + wy - 17} ${x + 1},${y - 17}`} fill={c} opacity="0.2" />
  </g>
);

const IsoConfTable = ({ x, y }: { x: number; y: number }) => (
  <IsoBlock x={x} y={y} w={40} d={20} h={8} t="#6a5040" l="#4a3020" r="#5a4030" />
);

const IsoReceptionDesk = ({ x, y }: { x: number; y: number }) => (
  <g>
    <IsoBlock x={x} y={y} w={50} d={14} h={14} t="#8a7050" l="#5a4020" r="#6a5030" />
    <IsoBlock x={x + 30} y={y - 3} w={1} d={6} h={8} t="#2a2a30" l="#111820" r="#181825" s="#333" />
    <line x1={x + 24} y1={y - 10} x2={x + 36} y2={y - 4} stroke="#22d3ee" strokeWidth="1" opacity="0.5" />
  </g>
);

interface LemburIsometricPrototypeProps {
  reducedMotion?: boolean;
  staticFallback?: boolean;
}

export const LemburIsometricPrototype: React.FC<LemburIsometricPrototypeProps> = ({
  reducedMotion = false,
  staticFallback = false
}) => {
  const [cameraMode, setCameraMode] = useState<CameraMode>('OVERVIEW');
  const [selectedAgent, setSelectedAgent] = useState<ProjectAgentInstance | null>(PROJECT_AGENT_INSTANCES[0]);
  const [walkFrame, setWalkFrame] = useState(0);
  const [walkerX, setWalkerX] = useState(1100);
  const [activeTab, setActiveTab] = useState<'campus' | 'comparison' | 'animation'>('campus');

  useEffect(() => {
    if (reducedMotion || staticFallback) return;
    const interval = setInterval(() => {
      setWalkFrame((f) => (f + 1) % 8);
      setWalkerX((prev) => (prev >= 1300 ? 1100 : prev + 3));
    }, 110);
    return () => clearInterval(interval);
  }, [reducedMotion, staticFallback]);

  const currentViewport = VIEWPORT_PRESETS[cameraMode];
  const WH = 50; // wall height

  /* ─── Room renderer ─── */
  const renderRoom = (
    id: string, cx: number, cy: number, hw: number, hh: number,
    floorColor: string, label: string, labelColor: string, labelBg: string,
    cam: CameraMode, furniture: React.ReactNode
  ) => (
    <g id={id} className="cursor-pointer" onClick={() => setCameraMode(cam)}>
      {/* Floor overlay */}
      <polygon points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`} fill={floorColor} stroke="#7a6a58" strokeWidth="0.6" />
      {/* Back-left wall */}
      <polygon points={`${cx - hw},${cy} ${cx},${cy - hh} ${cx},${cy - hh - WH} ${cx - hw},${cy - WH}`} fill="#8a8078" stroke="#5a5248" strokeWidth="0.7" />
      {/* Back-right wall */}
      <polygon points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx + hw},${cy - WH} ${cx},${cy - hh - WH}`} fill="#706860" stroke="#5a5248" strokeWidth="0.7" />
      {/* Wall top cap */}
      <polygon points={`${cx},${cy - hh - WH} ${cx + hw},${cy - WH} ${cx},${cy - hh - WH + 3} ${cx - hw},${cy - WH}`} fill="#9a9088" stroke="#5a5248" strokeWidth="0.3" opacity="0.5" />
      {/* Windows on left wall */}
      <polygon points={`${cx - hw * 0.65},${cy - hh * 0.35 - WH * 0.7} ${cx - hw * 0.35},${cy - hh * 0.65 - WH * 0.7} ${cx - hw * 0.35},${cy - hh * 0.65 - WH * 0.25} ${cx - hw * 0.65},${cy - hh * 0.35 - WH * 0.25}`} fill="#4a6888" opacity="0.3" />
      {/* Windows on right wall */}
      <polygon points={`${cx + hw * 0.35},${cy - hh * 0.65 - WH * 0.7} ${cx + hw * 0.65},${cy - hh * 0.35 - WH * 0.7} ${cx + hw * 0.65},${cy - hh * 0.35 - WH * 0.25} ${cx + hw * 0.35},${cy - hh * 0.65 - WH * 0.25}`} fill="#4a6888" opacity="0.25" />
      {/* Room label */}
      <rect x={cx - 50} y={cy - hh - WH - 2} width={100} height={16} rx={3} fill={labelBg} stroke={labelColor} strokeWidth="0.8" />
      <text x={cx} y={cy - hh - WH + 10} fill={labelColor} fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{label}</text>
      {furniture}
    </g>
  );

  /* ─── Workstation group: desk + monitor + chair ─── */
  const ws = (x: number, y: number, mc?: string) => (
    <g>
      <IsoDesk x={x} y={y - 5} />
      <IsoMonitor x={x - 4} y={y - 5} c={mc} />
      <IsoChair x={x} y={y + 14} />
    </g>
  );

  return (
    <div className="w-full bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl text-stone-100 font-sans">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-800/80 bg-stone-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">B3.4.2 Virtual HQ Campus</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">30 Agents</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-100">
              Cozy Isometric Development Office
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['campus', 'comparison', 'animation'] as const).map((tab) => {
            const icons = { campus: Layers, comparison: Eye, animation: Film };
            const labels = { campus: 'Connected Virtual HQ', comparison: 'Asset & Perspective Comparison', animation: 'Animation & Walk Preview' };
            const colors = { campus: 'cyan', comparison: 'amber', animation: 'purple' };
            const Icon = icons[tab];
            const c = colors[tab];
            const active = activeTab === tab;
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${active ? `bg-${c}-500/20 text-${c}-300 border border-${c}-400/60 shadow-sm` : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{labels[tab]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'comparison' ? (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-red-900/40 bg-red-950/10 space-y-4">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-red-900/40 text-red-300 border border-red-700/50">SEBELUMNYA: B3.4.1 (Empty Diamonds)</span>
              <div className="aspect-video bg-stone-950 border border-red-900/30 rounded-xl flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-24 h-24 rounded-full border border-red-500/30 bg-red-950/40 flex items-center justify-center"><span className="text-3xl">◇</span></div>
                <p className="text-xs text-stone-300 max-w-xs">Enam bidang diamond kosong di atas background hitam. Tidak ada dinding, furnitur, koridor, atau kesan bangunan yang utuh.</p>
                <div className="px-3 py-1 bg-red-950/60 border border-red-800/40 rounded text-[11px] font-mono text-red-300">❌ Flat diamonds tanpa arsitektur</div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-emerald-900/40 bg-emerald-950/10 space-y-4">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">B3.4.2: Connected Isometric Campus</span>
              <div className="aspect-video bg-stone-950 border border-emerald-900/30 rounded-xl flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="flex items-center gap-3">
                  {['char_citizens_office_m_b', 'char_citizens_casual_f_b', 'char_citizens_office_m_blue', 'char_citizens_office_f_c', 'char_citizens_elder_m_a'].map((k) => (
                    <img key={k} src={`/assets/virtual-office/characters/modern-citizens/frames/${k}/stand_down.png`} alt="" className="w-10 h-10 object-contain" />
                  ))}
                </div>
                <p className="text-xs text-stone-300 max-w-xs">Satu kompleks kantor terpadu dengan dinding, lantai, furnitur, koridor, dan shared areas. 30 agen dewasa profesional di 6 ruang proyek.</p>
                <div className="px-3 py-1 bg-emerald-950/60 border border-emerald-800/40 rounded text-[11px] font-mono text-emerald-300">✅ Cozy Isometric Building with Furniture</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'animation' ? (
        <div className="p-6 space-y-6">
          <div className="border border-stone-800 rounded-2xl p-5 bg-stone-900/60 space-y-4">
            <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <span>Siklus Berjalan 4 Arah &amp; Animasi (Modern Citizens, nacl1234)</span>
            </h4>
            <p className="text-xs text-stone-300">Semua karakter memiliki grid 128x128 px dengan 8 frame walk per arah (Down, Up, Side) dan standing frame per arah.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {[{ dir: 'down', label: 'Walk Down' }, { dir: 'side', label: 'Walk Side' }, { dir: 'side', label: 'Walk Side (Mirror)', mirror: true }, { dir: 'up', label: 'Walk Up' }].map(({ dir, label, mirror }) => (
                <div key={label} className="p-4 rounded-xl border border-stone-800 bg-stone-950 text-center space-y-2">
                  <span className="text-[11px] font-mono text-cyan-400 block font-bold">{label}</span>
                  <img src={`/assets/virtual-office/characters/modern-citizens/frames/char_citizens_office_m_b/walk_${dir}_0${walkFrame}.png`} alt={label}
                    className={`w-16 h-16 mx-auto object-contain ${mirror ? 'scale-x-[-1]' : ''}`} />
                  <span className="text-[10px] font-mono text-stone-400">Frame {walkFrame + 1}/8</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Camera Presets */}
          <div className="px-4 py-2.5 bg-stone-900/60 border-b border-stone-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-stone-400 uppercase mr-1">Kamera:</span>
              {(Object.keys(VIEWPORT_PRESETS) as CameraMode[]).map((mode) => (
                <button key={mode} type="button" onClick={() => setCameraMode(mode)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all flex items-center gap-1 ${cameraMode === mode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50' : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'}`}>
                  {mode === 'OVERVIEW' ? <RotateCcw className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
                  <span>{VIEWPORT_PRESETS[mode].label}</span>
                </button>
              ))}
            </div>
            {cameraMode !== 'OVERVIEW' && (
              <button type="button" onClick={() => setCameraMode('OVERVIEW')}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900">
                Kembali ke Full HQ
              </button>
            )}
          </div>

          {/* ═══════════ MAIN SVG CANVAS — ISOMETRIC CAMPUS ═══════════ */}
          <div className="relative w-full aspect-[12/7] bg-[#0c1220] overflow-hidden select-none">
            <svg
              viewBox={`${currentViewport.x} ${currentViewport.y} ${currentViewport.w} ${currentViewport.h}`}
              className="w-full h-full"
              style={{ transition: reducedMotion ? 'none' : 'all 0.55s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <defs>
                <filter id="b342-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.55" />
                </filter>
                <linearGradient id="b342-skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#0c1220" />
                </linearGradient>
              </defs>

              {/* ── SKY BACKDROP ── */}
              <rect x="0" y="-100" width="2400" height="1500" fill="url(#b342-skyGrad)" />

              {/* ══════ 1. BUILDING FOUNDATION SLAB ══════ */}
              <polygon points="1200,25 2320,690 1200,1375 80,690" fill="#1a1510" stroke="#2a2218" strokeWidth="1.5" />

              {/* ══════ 2. BUILDING INTERIOR BASE FLOOR (corridor/shared color) ══════ */}
              <polygon points="1200,40 2300,690 1200,1360 100,690" fill="#b8a890" stroke="#9a8a78" strokeWidth="0.8" />

              {/* ══════ 3. BUILDING PERIMETER WALLS ══════ */}
              {/* Back-left outer wall */}
              <polygon points="100,690 1200,40 1200,-15 100,635" fill="#8a8078" stroke="#5a5248" strokeWidth="1" />
              {/* Back-right outer wall */}
              <polygon points="1200,40 2300,690 2300,635 1200,-15" fill="#706860" stroke="#5a5248" strokeWidth="1" />
              {/* Outer wall top cap line */}
              <line x1="100" y1="635" x2="1200" y2="-15" stroke="#a09888" strokeWidth="0.8" />
              <line x1="1200" y1="-15" x2="2300" y2="635" stroke="#a09888" strokeWidth="0.8" />

              {/* ══════ 4. RECEPTION AREA (top center) ══════ */}
              <g id="hq-reception" className="cursor-pointer" onClick={() => setCameraMode('RECEPTION')}>
                <polygon points="1200,55 1580,245 1200,435 820,245" fill="#d4c8b0" stroke="#a09080" strokeWidth="0.6" />
                {/* Reception back walls (shorter, integrated with building perimeter) */}
                <polygon points="820,245 1200,55 1200,10 820,200" fill="#908880" stroke="#6a6258" strokeWidth="0.7" />
                <polygon points="1200,55 1580,245 1580,200 1200,10" fill="#787068" stroke="#6a6258" strokeWidth="0.7" />
                {/* Logo sign on back wall */}
                <rect x="1155" y="8" width="90" height="20" rx="3" fill="#0a1628" stroke="#06b6d4" strokeWidth="1" />
                <text x="1200" y="22" fill="#22d3ee" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SLEEPYKOALA</text>
                {/* Reception desk */}
                <IsoReceptionDesk x={1200} y={240} />
                {/* Waiting sofas */}
                <IsoSofa x={940} y={270} c="#6a5a4a" />
                <IsoSofa x={1440} y={270} c="#6a5a4a" />
                <IsoCoffeeTable x={940} y={300} />
                <IsoCoffeeTable x={1440} y={300} />
                {/* Plants */}
                <IsoPlantTall x={850} y={220} />
                <IsoPlantTall x={1550} y={220} />
                <IsoPlant x={1080} y={160} />
                <IsoPlant x={1320} y={160} />
                {/* Info board on right wall */}
                <IsoWallDisplay x={1420} y={150} wx={80} wy={40} c="#f59e0b" />
              </g>

              {/* ══════ 5. ROW 1 ROOMS ══════ */}

              {/* DompetNalar Finance Suite */}
              {renderRoom('hq-dompetnalar', 530, 370, 280, 110,
                '#c8bca0', 'DOMPETNALAR FINANCE', '#67e8f9', '#082f49', 'DOMPETNALAR',
                <>
                  {ws(432, 342, '#22d3ee')}{ws(530, 342, '#38bdf8')}{ws(628, 342, '#06b6d4')}
                  {ws(474, 392, '#10b981')}{ws(586, 392, '#f59e0b')}
                  <IsoWallDisplay x={310} y={310} wx={60} wy={-24} c="#22d3ee" />
                  <IsoBookshelf x={720} y={340} />
                  <IsoPlant x={290} y={420} />
                  <IsoPlant x={700} y={300} />
                </>
              )}

              {/* Collaboration Lounge (center) */}
              <g id="hq-plaza" className="cursor-pointer" onClick={() => setCameraMode('PLAZA')}>
                <polygon points="1200,260 1400,370 1200,480 1000,370" fill="#c8ba98" stroke="#a09080" strokeWidth="0.6" />
                <polygon points="1000,370 1200,260 1200,210 1000,320" fill="#888078" stroke="#5a5248" strokeWidth="0.6" />
                <polygon points="1200,260 1400,370 1400,320 1200,210" fill="#706860" stroke="#5a5248" strokeWidth="0.6" />
                <rect x="1155" y="208" width="90" height="14" rx="2" fill="#18181b" stroke="#a1a1aa" strokeWidth="0.6" />
                <text x="1200" y="219" fill="#e4e4e7" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">LOUNGE</text>
                <IsoSofa x={1120} y={340} c="#6a5a50" />
                <IsoSofa x={1280} y={340} c="#6a5a50" />
                <IsoCoffeeTable x={1200} y={370} />
                <IsoWhiteboard x={1060} y={310} wx={50} wy={-20} />
                <IsoPlant x={1050} y={420} />
                <IsoPlant x={1350} y={420} />
                {/* Walking coworker in corridor */}
                <image
                  href={`/assets/virtual-office/characters/modern-citizens/frames/char_citizens_office_m_blue/walk_side_0${walkFrame}.png`}
                  x={walkerX} y="410" width="36" height="36" filter="url(#b342-shadow)" />
              </g>

              {/* IDLE MASTER Game Studio */}
              {renderRoom('hq-idlemaster', 1870, 370, 280, 110,
                '#c8a870', 'IDLE MASTER STUDIO', '#fde68a', '#451a03', 'IDLE_MASTER',
                <>
                  {ws(1772, 342, '#f59e0b')}{ws(1870, 342, '#fb923c')}{ws(1968, 342, '#f97316')}
                  {ws(1814, 392, '#ec4899')}{ws(1926, 392, '#a855f7')}
                  {/* Arcade cabinet prop */}
                  <IsoBlock x={2070} y={310} w={10} d={8} h={22} t="#701a75" l="#4a044e" r="#581060" s="#f472b6" sw={0.6} />
                  <line x1={2060} y1={290} x2={2070} y2={295} stroke="#f472b6" strokeWidth="0.8" opacity="0.7" />
                  <IsoWallDisplay x={1650} y={310} wx={60} wy={-24} c="#f59e0b" />
                  <IsoPlant x={1640} y={420} />
                  <IsoPlant x={2080} y={380} />
                </>
              )}

              {/* ══════ 6. ROW 2 ROOMS ══════ */}

              {/* Mobile Kasir POS Hub */}
              {renderRoom('hq-mobilekasir', 530, 640, 280, 110,
                '#b0bca0', 'MOBILE KASIR POS', '#a7f3d0', '#064e3b', 'MOBILE_KASIR',
                <>
                  {ws(432, 612, '#10b981')}{ws(530, 612, '#34d399')}{ws(628, 612, '#6ee7b7')}
                  {ws(474, 662, '#14b8a6')}{ws(586, 662, '#2dd4bf')}
                  {/* POS terminal demo */}
                  <IsoBlock x={720} y={610} w={12} d={8} h={16} t="#404040" l="#282828" r="#333" s="#555" />
                  <line x1={708} y1={595} x2={720} y2={601} stroke="#10b981" strokeWidth="1" opacity="0.6" />
                  <IsoWallDisplay x={310} y={580} wx={55} wy={-22} c="#10b981" />
                  <IsoPlant x={290} y={690} />
                  <IsoBookshelf x={720} y={660} />
                </>
              )}

              {/* Central Meeting Room */}
              <g id="hq-boardroom-meeting" className="cursor-pointer" onClick={() => setCameraMode('BOARDROOM')}>
                <polygon points="1200,530 1380,640 1200,750 1020,640" fill="#c0c0b8" stroke="#a09888" strokeWidth="0.6" />
                <polygon points="1020,640 1200,530 1200,480 1020,590" fill="#888078" stroke="#5a5248" strokeWidth="0.6" />
                <polygon points="1200,530 1380,640 1380,590 1200,480" fill="#706860" stroke="#5a5248" strokeWidth="0.6" />
                <rect x="1155" y="478" width="90" height="14" rx="2" fill="#18181b" stroke="#a1a1aa" strokeWidth="0.6" />
                <text x="1200" y="489" fill="#e4e4e7" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">MEETING ROOM</text>
                <IsoConfTable x={1200} y={640} />
                {/* Chairs around table */}
                <IsoChair x={1160} y={620} /><IsoChair x={1240} y={620} />
                <IsoChair x={1160} y={660} /><IsoChair x={1240} y={660} />
                <IsoChair x={1140} y={640} /><IsoChair x={1260} y={640} />
                {/* Presentation screen */}
                <IsoWallDisplay x={1080} y={580} wx={50} wy={-20} c="#3b82f6" />
                <IsoWhiteboard x={1250} y={580} wx={50} wy={20} />
                <IsoPlant x={1040} y={700} />
              </g>

              {/* Idle Mining Production Room */}
              {renderRoom('hq-idlemining', 1870, 640, 280, 110,
                '#c8b888', 'IDLE MINING LAB', '#ffedd5', '#7c2d12', 'IDLE_MINING',
                <>
                  {ws(1772, 612, '#f97316')}{ws(1870, 612, '#fb923c')}{ws(1968, 612, '#ea580c')}
                  {ws(1814, 662, '#d97706')}{ws(1926, 662, '#b45309')}
                  {/* Mining progression board */}
                  <IsoWallDisplay x={1650} y={580} wx={55} wy={-22} c="#f97316" />
                  {/* Pickaxe decoration (simple) */}
                  <line x1={2080} y1={575} x2={2095} y2={590} stroke="#a0a0a0" strokeWidth="1.5" />
                  <line x1={2088} y1={572} x2={2095} y2={590} stroke="#d97706" strokeWidth="1.5" />
                  <IsoPlant x={1640} y={690} />
                  <IsoBookshelf x={2060} y={620} />
                </>
              )}

              {/* ══════ 7. ROW 3 ROOMS ══════ */}

              {/* Worklume SaaS Operations */}
              {renderRoom('hq-worklume', 530, 910, 280, 110,
                '#a8c0c0', 'WORKLUME SAAS', '#e0f2fe', '#075985', 'WORKLUME',
                <>
                  {ws(432, 882, '#38bdf8')}{ws(530, 882, '#0ea5e9')}{ws(628, 882, '#0284c7')}
                  {ws(474, 932, '#06b6d4')}{ws(586, 932, '#0891b2')}
                  {/* Kanban / workflow board */}
                  <IsoWhiteboard x={310} y={850} wx={55} wy={-22} />
                  <IsoWallDisplay x={650} y={850} wx={55} wy={22} c="#38bdf8" />
                  <IsoPlant x={290} y={960} />
                  <IsoPlant x={740} y={870} />
                </>
              )}

              {/* Pantry / Utility Area (center bottom) */}
              <g id="hq-pantry" className="cursor-pointer" onClick={() => setCameraMode('OVERVIEW')}>
                <polygon points="1200,800 1380,910 1200,1020 1020,910" fill="#c8c0a8" stroke="#a09888" strokeWidth="0.6" />
                <polygon points="1020,910 1200,800 1200,750 1020,860" fill="#888078" stroke="#5a5248" strokeWidth="0.6" />
                <polygon points="1200,800 1380,910 1380,860 1200,750" fill="#706860" stroke="#5a5248" strokeWidth="0.6" />
                <rect x="1155" y="748" width="90" height="14" rx="2" fill="#18181b" stroke="#a1a1aa" strokeWidth="0.6" />
                <text x="1200" y="759" fill="#e4e4e7" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PANTRY</text>
                {/* Counter / coffee bar */}
                <IsoBlock x={1120} y={880} w={30} d={10} h={12} t="#7a6a58" l="#5a4a38" r="#6a5a48" />
                {/* Coffee machine */}
                <IsoBlock x={1100} y={870} w={5} d={5} h={10} t="#505050" l="#383838" r="#444" s="#333" />
                <ellipse cx={1100} cy={862} rx={3} ry={2} fill="#e11d48" />
                {/* Fridge */}
                <IsoBlock x={1300} y={870} w={10} d={8} h={22} t="#d0d0d0" l="#a0a0a0" r="#b8b8b8" s="#888" />
                {/* Small table with chairs */}
                <IsoCoffeeTable x={1200} y={930} />
                <IsoChair x={1170} y={940} />
                <IsoChair x={1230} y={940} />
                <IsoPlant x={1050} y={960} />
                <IsoPlant x={1340} y={870} />
              </g>

              {/* The Broken Origin MMORPG Studio */}
              {renderRoom('hq-tbo', 1870, 910, 280, 110,
                '#b0a0c0', 'THE BROKEN ORIGIN', '#ede9fe', '#4c1d95', 'THE_BROKEN_ORIGIN',
                <>
                  {ws(1772, 882, '#8b5cf6')}{ws(1870, 882, '#a78bfa')}{ws(1968, 882, '#7c3aed')}
                  {ws(1814, 932, '#6d28d9')}{ws(1926, 932, '#c084fc')}
                  {/* World map display */}
                  <IsoWallDisplay x={1650} y={850} wx={60} wy={-24} c="#8b5cf6" />
                  {/* Combat design board */}
                  <IsoWhiteboard x={2050} y={855} wx={50} wy={20} />
                  <IsoPlant x={1640} y={960} />
                  <IsoBookshelf x={2060} y={900} />
                </>
              )}

              {/* ══════ 8. EXECUTIVE BOARDROOM (bottom center) ══════ */}
              <g id="hq-boardroom" className="cursor-pointer" onClick={() => setCameraMode('BOARDROOM')}>
                <polygon points="1200,1060 1540,1230 1200,1340 860,1230" fill="#b0a0b0" stroke="#8a7a8a" strokeWidth="0.6" />
                <polygon points="860,1230 1200,1060 1200,1010 860,1180" fill="#888078" stroke="#5a5248" strokeWidth="0.7" />
                <polygon points="1200,1060 1540,1230 1540,1180 1200,1010" fill="#706860" stroke="#5a5248" strokeWidth="0.7" />
                <rect x="1140" y="1008" width="120" height="16" rx="3" fill="#2e1065" stroke="#c084fc" strokeWidth="0.8" />
                <text x="1200" y="1020" fill="#f3e8ff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">EXECUTIVE BOARDROOM</text>
                {/* Large conference table */}
                <IsoConfTable x={1200} y={1200} />
                {/* Chairs */}
                <IsoChair x={1130} y={1180} /><IsoChair x={1200} y={1175} /><IsoChair x={1270} y={1180} />
                <IsoChair x={1130} y={1220} /><IsoChair x={1200} y={1225} /><IsoChair x={1270} y={1220} />
                <IsoChair x={1100} y={1200} /><IsoChair x={1300} y={1200} />
                {/* Twin presentation screens */}
                <IsoWallDisplay x={940} y={1140} wx={60} wy={-24} c="#a855f7" />
                <IsoWallDisplay x={1370} y={1120} wx={60} wy={24} c="#6366f1" />
                <IsoPlantTall x={900} y={1280} />
                <IsoPlantTall x={1500} y={1280} />
                <IsoPlant x={1000} y={1100} />
              </g>

              {/* ══════ 9. DECORATIVE CORRIDOR ELEMENTS ══════ */}
              {/* Floor lamps along corridors */}
              <IsoPlant x={830} y={480} />
              <IsoPlant x={1570} y={480} />
              <IsoPlant x={830} y={750} />
              <IsoPlant x={1570} y={750} />
              <IsoPlant x={830} y={1020} />
              <IsoPlant x={1570} y={1020} />
              {/* Corridor floor accent lines */}
              <line x1="830" y1="460" x2="830" y2="1050" stroke="#a09080" strokeWidth="0.5" opacity="0.3" />
              <line x1="1570" y1="460" x2="1570" y2="1050" stroke="#a09080" strokeWidth="0.5" opacity="0.3" />

              {/* ══════ 10. AGENT SPRITES (depth-sorted by y) ══════ */}
              {[...PROJECT_AGENT_INSTANCES]
                .sort((a, b) => a.stationPos.y - b.stationPos.y)
                .map((agent) => {
                  const isSelected = selectedAgent?.instanceId === agent.instanceId;
                  return (
                    <g key={agent.instanceId} id={agent.instanceId} className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); }}>
                      <ellipse cx={agent.stationPos.x + 24} cy={agent.stationPos.y + 44} rx={12} ry={5} fill="#000" opacity="0.35" />
                      <image
                        href={`/assets/virtual-office/characters/modern-citizens/frames/${agent.charAssetKey}/stand_${agent.facing}.png`}
                        x={agent.stationPos.x} y={agent.stationPos.y} width="48" height="48" filter="url(#b342-shadow)" />
                      {isSelected && (
                        <circle cx={agent.stationPos.x + 24} cy={agent.stationPos.y + 24} r="26" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 2" />
                      )}
                    </g>
                  );
                })}
            </svg>

            {/* Radar HUD */}
            <div className="absolute bottom-3 right-3 bg-stone-900/90 border border-stone-800 rounded-2xl p-3 shadow-xl backdrop-blur-md max-w-[200px] text-xs space-y-1.5 pointer-events-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                  <Compass className="w-3 h-3" /> HQ Radar
                </span>
                <span className="text-[9px] font-mono text-stone-400">{cameraMode === 'OVERVIEW' ? '1x' : '2.5x'}</span>
              </div>
              <p className="text-[10px] text-stone-300 leading-tight">
                6 ruang proyek + shared areas. Klik ruangan untuk zoom.
              </p>
            </div>
          </div>

          {/* Agent Inspector */}
          {selectedAgent && (
            <div className="p-4 sm:p-5 bg-stone-900/90 border-t border-stone-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-stone-950 border border-cyan-500/40 p-1 flex items-center justify-center shrink-0 shadow-inner">
                  <img src={`/assets/virtual-office/characters/modern-citizens/frames/${selectedAgent.charAssetKey}/stand_down.png`} alt={selectedAgent.displayName} className="w-11 h-11 object-contain" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-stone-100">{selectedAgent.displayName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">{selectedAgent.role}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-300">{selectedAgent.projectName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs text-stone-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span><strong className="text-stone-400 font-normal">Tugas Simulasi: </strong><span className="text-amber-200">{selectedAgent.activity}</span></span>
                    <span className="text-stone-500 font-mono text-[11px]">ID: {selectedAgent.instanceId}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
                <div className="text-right text-[11px] font-mono text-stone-400 hidden sm:block">
                  <div>Aset: <strong className="text-stone-200">Modern Citizens (nacl1234)</strong></div>
                  <div className="text-emerald-400 font-bold">AI Agent Crew — Simulation</div>
                </div>
                <button type="button"
                  onClick={() => {
                    const k = selectedAgent.projectId.toUpperCase().replace(/-/g, '_') as CameraMode;
                    if (VIEWPORT_PRESETS[k]) setCameraMode(k);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyan-900/20">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom ke {selectedAgent.projectName}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
