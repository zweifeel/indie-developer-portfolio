/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CONNECTED VIRTUAL HQ MASTER FLOOR PLAN (B3.3)
 * 
 * Continuous Spatial Architecture, 2:1 Isometric Grid Coordinate System,
 * Six Unique Workspace Environments, Shared Facilities, and Circulation Wings.
 * ============================================================================
 */

import { ConnectedHQFloorPlan, WorkspaceEnvironmentProfile } from '../types/virtualOfficeSpatial';

export const CONNECTED_HQ_DIMENSIONS = {
  width: 2400,
  height: 1400,
} as const;

/**
 * Camera Viewport Presets
 */
export const HQ_CAMERA_PRESETS = {
  OVERVIEW: {
    x: 0,
    y: 0,
    width: 2400,
    height: 1400,
    zoom: 1.0,
  },
  RECEPTION: {
    x: 880,
    y: 60,
    width: 640,
    height: 420,
    zoom: 2.2,
  },
  COLLABORATION_PLAZA: {
    x: 880,
    y: 490,
    width: 640,
    height: 420,
    zoom: 2.2,
  },
  BOARDROOM: {
    x: 880,
    y: 920,
    width: 640,
    height: 420,
    zoom: 2.2,
  },
  DOMPETNALAR: {
    x: 100,
    y: 60,
    width: 680,
    height: 440,
    zoom: 2.0,
  },
  MOBILE_KASIR: {
    x: 100,
    y: 500,
    width: 680,
    height: 440,
    zoom: 2.0,
  },
  WORKLUME: {
    x: 100,
    y: 930,
    width: 680,
    height: 440,
    zoom: 2.0,
  },
  IDLE_MASTER: {
    x: 1620,
    y: 60,
    width: 680,
    height: 440,
    zoom: 2.0,
  },
  IDLE_MINING: {
    x: 1620,
    y: 500,
    width: 680,
    height: 440,
    zoom: 2.0,
  },
  THE_BROKEN_ORIGIN: {
    x: 1620,
    y: 930,
    width: 680,
    height: 440,
    zoom: 2.0,
  },
} as const;

/**
 * 6 Canonical Workspaces with Unique Environments
 */
export const CANONICAL_WORKSPACES: WorkspaceEnvironmentProfile[] = [
  // 1. DompetNalar (Upper West Wing)
  {
    projectId: 'dompetnalar',
    projectSlug: 'dompetnalar',
    projectName: 'DompetNalar',
    category: 'Finance / Productivity',
    wing: 'west_wing',
    floorZoneId: 'zone_west_upper',
    spatialAnchor: { x: 440, y: 280 },
    bounds: { x: 100, y: 60, width: 680, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.DOMPETNALAR,
    environmentTheme: {
      title: 'Modern Financial Analytics Suite',
      description: 'Ruang kerja perbankan digital & analitik keuangan dengan stasiun multi-monitor, lemari data terenkripsi, dan chart arus kas.',
      primaryColor: '#0284c7',
      accentColor: '#38bdf8',
      ambientTint: 'rgba(56, 189, 248, 0.12)',
      flooring: 'parquet_warm',
      specialtyDecor: [
        { id: 'dn_decor_1', label: 'Cashflow Analytics Board', type: 'financial_chart', x: 260, y: 140, description: 'Papan metrik anggaran bulanan & grafik burn-rate.' },
        { id: 'dn_decor_2', label: 'Encrypted Records Cabinet', type: 'secure_cabinet', x: 620, y: 150, description: 'Lemari arsip data keuangan terenkripsi offline-first.' },
        { id: 'dn_decor_3', label: 'Budget Ledger Desk', type: 'double_desk', x: 420, y: 310, description: 'Meja kerja ganda dengan layar kalkulasi amortisasi.' },
      ],
    },
    specializedAgents: {
      PLANNER: { title: 'Financial Systems Architect', focus: 'Merancang alur anggaran & modularitas Room database.', stationAnchor: { x: 300, y: 220 } },
      DEVELOPER: { title: 'Android Finance Engineer', focus: 'Mengembangkan ViewModel Jetpack Compose & validasi transaksi.', stationAnchor: { x: 420, y: 290 } },
      TESTER: { title: 'Ledger QA & Stress Tester', focus: 'Menguji presisi nilai desimal mata uang dan integritas SQLite.', stationAnchor: { x: 550, y: 240 } },
      REVIEWER: { title: 'Privacy & Security Auditor', focus: 'Meninjau kepatuhan isolasi data lokal tanpa kebocoran pihak ketiga.', stationAnchor: { x: 610, y: 350 } },
      PUBLISHER: { title: 'Play Store Compliance Lead', focus: 'Menyiapkan Data Safety form keuangan dan materi rilis closed test.', stationAnchor: { x: 370, y: 390 } },
    },
  },

  // 2. IDLE MASTER (Upper East Wing)
  {
    projectId: 'idle-master',
    projectSlug: 'idle-master',
    projectName: 'IDLE MASTER',
    category: 'Casual Mobile Game',
    wing: 'east_wing',
    floorZoneId: 'zone_east_upper',
    spatialAnchor: { x: 1960, y: 280 },
    bounds: { x: 1620, y: 60, width: 680, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.IDLE_MASTER,
    environmentTheme: {
      title: 'Casual Game Dev Studio',
      description: 'Studio pengembangan game mobile santai dengan arcade tester retro, papan loop progres pemain, dan stasiun balancing reward.',
      primaryColor: '#8b5cf6',
      accentColor: '#a78bfa',
      ambientTint: 'rgba(139, 92, 246, 0.12)',
      flooring: 'carpet_teal',
      specialtyDecor: [
        { id: 'im_decor_1', label: 'Game Loop Balancing Board', type: 'game_board', x: 1780, y: 140, description: 'Papan kalkulasi kurva eksponensial upgrade & idle reward.' },
        { id: 'im_decor_2', label: 'Mini Arcade Test Cabinet', type: 'arcade_cabinet', x: 2160, y: 150, description: 'Kabinet mini arcade untuk uji game feel dan respon sentuhan.' },
        { id: 'im_decor_3', label: 'Gameplay Test Bench', type: 'double_desk', x: 1940, y: 310, description: 'Meja uji frame-rate 60 FPS pada beragam chipset Android.' },
      ],
    },
    specializedAgents: {
      PLANNER: { title: 'Lead Game Economy Designer', focus: 'Menyeimbangkan rasio idle offline multiplier dan pacing pemain.', stationAnchor: { x: 1820, y: 220 } },
      DEVELOPER: { title: 'Mobile Game Engine Programmer', focus: 'Mengoptimasi sprite batching dan hemat daya baterai.', stationAnchor: { x: 1940, y: 290 } },
      TESTER: { title: 'Idle Loop & Touch Tester', focus: 'Memverifikasi akurasi kalkulasi timestamp offline sleep mode.', stationAnchor: { x: 2070, y: 240 } },
      REVIEWER: { title: 'Game Feel & Audio Reviewer', focus: 'Menilai responsivitas feedback haptic dan kepuasan animasi tombol.', stationAnchor: { x: 2130, y: 350 } },
      PUBLISHER: { title: 'Casual ASO Coordinator', focus: 'Merancang ikon game berdaya pikat tinggi dan preview Play Store.', stationAnchor: { x: 1890, y: 390 } },
    },
  },

  // 3. Mobile Kasir (Mid West Wing)
  {
    projectId: 'mobile-kasir',
    projectSlug: 'mobile-kasir',
    projectName: 'Mobile Kasir',
    category: 'Business / POS',
    wing: 'west_wing',
    floorZoneId: 'zone_west_mid',
    spatialAnchor: { x: 440, y: 720 },
    bounds: { x: 100, y: 500, width: 680, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.MOBILE_KASIR,
    environmentTheme: {
      title: 'Retail POS Operations Hub',
      description: 'Ruang operasional kasir & UMKM dengan terminal kasir fisik, printer struk termal uji Bluetooth, scanner barcode, dan flow inventaris.',
      primaryColor: '#059669',
      accentColor: '#34d399',
      ambientTint: 'rgba(16, 185, 129, 0.12)',
      flooring: 'tile_obsidian',
      specialtyDecor: [
        { id: 'mk_decor_1', label: 'Cashier POS Station', type: 'pos_terminal', x: 260, y: 580, description: 'Terminal kasir uji coba dengan tablet stand putar 360 derajat.' },
        { id: 'mk_decor_2', label: 'Thermal Bluetooth Printer', type: 'thermal_printer', x: 620, y: 590, description: 'Printer thermal uji cetak struk 58mm & format nota kilat.' },
        { id: 'mk_decor_3', label: 'Retail Barcode Bench', type: 'double_desk', x: 420, y: 750, description: 'Stasiun kalibrasi scanner kamera AI & pencarian SKU barang.' },
      ],
    },
    specializedAgents: {
      PLANNER: { title: 'Retail Operations Specialist', focus: 'Menyusun alur kasir kilat < 3 detik per transaksi konsumen.', stationAnchor: { x: 300, y: 660 } },
      DEVELOPER: { title: 'POS Engine Programmer', focus: 'Membangun konektivitas ESC/POS printer Bluetooth dan diskon bertingkat.', stationAnchor: { x: 420, y: 730 } },
      TESTER: { title: 'Transaction Edge-Case Tester', focus: 'Menguji ribuan entri struk saat koneksi printer terputus mendadak.', stationAnchor: { x: 550, y: 680 } },
      REVIEWER: { title: 'Merchant UX Inspector', focus: 'Memastikan ukuran tombol kasir ramah jempol kasir dan minim salah klik.', stationAnchor: { x: 610, y: 790 } },
      PUBLISHER: { title: 'Enterprise Release Specialist', focus: 'Mengelola closed testing 14 hari dengan komunitas pedagang nyata.', stationAnchor: { x: 370, y: 830 } },
    },
  },

  // 4. Idle Mining (Mid East Wing)
  {
    projectId: 'idle-mining',
    projectSlug: 'idle-mining',
    projectName: 'Idle Mining',
    category: 'Simulation Game',
    wing: 'east_wing',
    floorZoneId: 'zone_east_mid',
    spatialAnchor: { x: 1960, y: 720 },
    bounds: { x: 1620, y: 500, width: 680, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.IDLE_MINING,
    environmentTheme: {
      title: 'Resource Simulation Lab',
      description: 'Lab simulasi industri pertambangan dengan model conveyor belt mini, diagram ekstraksi mineral, dan kalkulator inflasi in-game.',
      primaryColor: '#d97706',
      accentColor: '#fbbf24',
      ambientTint: 'rgba(245, 158, 11, 0.12)',
      flooring: 'slate_tech',
      specialtyDecor: [
        { id: 'min_decor_1', label: 'Mineral Extraction Blueprint', type: 'geological_map', x: 1780, y: 580, description: 'Peta stratigrafi tambang virtual dan titik kedalaman deposit emas.' },
        { id: 'min_decor_2', label: 'Minecart Model & Ore Samples', type: 'cart_display', x: 2160, y: 590, description: 'Model replika gerobak rel tambang dan batuan kristal studio.' },
        { id: 'min_decor_3', label: 'Shaft Balancing Workstation', type: 'double_desk', x: 1940, y: 750, description: 'Meja uji otomasi lift shaft dan throughput elevator.' },
      ],
    },
    specializedAgents: {
      PLANNER: { title: 'Tycoon Systems Architect', focus: 'Merancang pohon riset teknologi tambang & otomatisasi supervisor.', stationAnchor: { x: 1820, y: 660 } },
      DEVELOPER: { title: 'Simulation Logic Engineer', focus: 'Mengimplementasikan formula big-number multi-quadrillion offline.', stationAnchor: { x: 1940, y: 730 } },
      TESTER: { title: 'Economy Stress Tester', focus: 'Menghindari infinite money exploit dan race condition auto-collect.', stationAnchor: { x: 2070, y: 680 } },
      REVIEWER: { title: 'Progression Curve Auditor', focus: 'Memastikan game tidak mengalami pacing wall atau kehabisan konten awal.', stationAnchor: { x: 2130, y: 790 } },
      PUBLISHER: { title: 'Tycoon Release Coordinator', focus: 'Menyusun paket peluncuran global dengan dukungan multiscreen tablet.', stationAnchor: { x: 1890, y: 830 } },
    },
  },

  // 5. The Broken Origin (Lower East Wing)
  {
    projectId: 'the-broken-origin',
    projectSlug: 'the-broken-origin',
    projectName: 'The Broken Origin',
    category: 'Roblox MMORPG',
    wing: 'east_wing',
    floorZoneId: 'zone_east_lower',
    spatialAnchor: { x: 1960, y: 1150 },
    bounds: { x: 1620, y: 930, width: 680, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.THE_BROKEN_ORIGIN,
    environmentTheme: {
      title: 'Fantasy MMORPG Command Studio',
      description: 'Studio pengembangan MMORPG berlatar fantasi dengan peta benua orisinal, replika pedang lore, dan server cluster multiplayer real-time.',
      primaryColor: '#7c3aed',
      accentColor: '#c084fc',
      ambientTint: 'rgba(124, 58, 237, 0.14)',
      flooring: 'parquet_warm',
      specialtyDecor: [
        { id: 'tbo_decor_1', label: 'Eldoria Continent World Map', type: 'fantasy_map', x: 1780, y: 1010, description: 'Peta benua dunia The Broken Origin dengan rute dungeon & raid boss.' },
        { id: 'tbo_decor_2', label: 'Studio Guild Crest Banner', type: 'guild_banner', x: 2160, y: 1020, description: 'Spanduk kain tenun lambang SleepyKoala Guild of Origin.' },
        { id: 'tbo_decor_3', label: 'Multiplayer Sync Test Bench', type: 'double_desk', x: 1940, y: 1180, description: 'Stasiun replikasi server-authoritative 50 pemain per instance.' },
      ],
    },
    specializedAgents: {
      PLANNER: { title: 'Lead World & Lore Architect', focus: 'Menyusun naskah mitologi dunia, quest branching, dan raid mechanics.', stationAnchor: { x: 1820, y: 1090 } },
      DEVELOPER: { title: 'Luau Engine & Combat Programmer', focus: 'Mengembangkan sistem combo senjata, hit-detection, dan network sync.', stationAnchor: { x: 1940, y: 1160 } },
      TESTER: { title: 'Multiplayer Latency & Raid QA', focus: 'Mensimulasikan lonjakan ping tinggi dan stress-test boss fight 40 player.', stationAnchor: { x: 2070, y: 1110 } },
      REVIEWER: { title: 'Combat Feel & Balance Reviewer', focus: 'Memastikan animasi i-frame dodge roll adil dan responsif bagi pemain.', stationAnchor: { x: 2130, y: 1220 } },
      PUBLISHER: { title: 'LiveOps & Community Manager', focus: 'Mengkoordinasikan event season pass, patch notes, dan anti-cheat security.', stationAnchor: { x: 1890, y: 1260 } },
    },
  },

  // 6. Worklume (Lower West Wing)
  {
    projectId: 'worklume',
    projectSlug: 'worklume',
    projectName: 'Worklume',
    category: 'SaaS / Productivity',
    wing: 'west_wing',
    floorZoneId: 'zone_west_lower',
    spatialAnchor: { x: 440, y: 1150 },
    bounds: { x: 100, y: 930, width: 680, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.WORKLUME,
    environmentTheme: {
      title: 'Modern Enterprise SaaS Suite',
      description: 'Studio pengembangan perangkat lunak produktivitas cloud dengan papan kanban sprint terstruktur, arsitektur microservices, dan telemetry dashboard.',
      primaryColor: '#0891b2',
      accentColor: '#22d3ee',
      ambientTint: 'rgba(8, 145, 178, 0.12)',
      flooring: 'slate_tech',
      specialtyDecor: [
        { id: 'wl_decor_1', label: 'Product Sprint Kanban Board', type: 'kanban_wall', x: 260, y: 1010, description: 'Papan kanban digital multi-sprint dengan backlog prioritas.' },
        { id: 'wl_decor_2', label: 'Cloud Architecture Schematic', type: 'architecture_poster', x: 620, y: 1020, description: 'Skema API gateway, caching layer, dan failover cluster.' },
        { id: 'wl_decor_3', label: 'Enterprise Workflow Desk', type: 'double_desk', x: 420, y: 1180, description: 'Meja kerja kolaborasi UI designer & frontend developer.' },
      ],
    },
    specializedAgents: {
      PLANNER: { title: 'Enterprise Product Manager', focus: 'Memetakan user journey B2B dan prioritas fitur automasi workflow.', stationAnchor: { x: 300, y: 1090 } },
      DEVELOPER: { title: 'Fullstack Platform Engineer', focus: 'Mengoptimasi load time dashboard SaaS dan validasi form dinamis.', stationAnchor: { x: 420, y: 1160 } },
      TESTER: { title: 'Cross-Platform Automation QA', focus: 'Menjalankan skenario e2e browser matrix dan pengujian aksesibilitas WCAG.', stationAnchor: { x: 550, y: 1110 } },
      REVIEWER: { title: 'Design System & UX Auditor', focus: 'Menjaga konsistensi token desain, spasi, dan keterbacaan tipografi.', stationAnchor: { x: 610, y: 1220 } },
      PUBLISHER: { title: 'Cloud Deployment Specialist', focus: 'Menyiapkan blue-green deployment dan pemantauan error live uptime.', stationAnchor: { x: 370, y: 1260 } },
    },
  },
];

/**
 * Shared Facilities in the Central Spine of the Connected HQ
 */
export const SHARED_HQ_FACILITIES = [
  // 1. Grand Reception & Lobby (Upper Center)
  {
    id: 'facility_reception',
    name: 'Lobi & Resepsionis Utama',
    zoneType: 'reception' as const,
    wing: 'central_spine' as const,
    bounds: { x: 880, y: 60, width: 640, height: 380 },
    cameraPreset: HQ_CAMERA_PRESETS.RECEPTION,
    features: [
      'Meja resepsionis kayu jati dengan lambang SleepyKoala Studio',
      'Papan info direktori studio digital',
      'Sofa tunggu tamu berbahan beludru teal',
      'Pintu masuk utama studio berpanel kaca ganda',
    ],
  },
  // 2. Central Collaboration Plaza (Mid Center)
  {
    id: 'facility_collaboration_plaza',
    name: 'Central Collaboration Plaza & Coffee Bar',
    zoneType: 'collaboration_plaza' as const,
    wing: 'central_spine' as const,
    bounds: { x: 880, y: 490, width: 640, height: 380 },
    cameraPreset: HQ_CAMERA_PRESETS.COLLABORATION_PLAZA,
    features: [
      'Mesin espresso stainless steel & bar santai',
      'Meja diskusi bundar lintas proyek',
      'Papan pengumuman sprint bersama studio',
      'Tanaman monstera indoor raksasa',
    ],
  },
  // 3. Shared Boardroom / Glass Conference Suite (Lower Center)
  {
    id: 'facility_boardroom',
    name: 'Ruang Rapat Utama & Presentation Suite',
    zoneType: 'boardroom' as const,
    wing: 'central_spine' as const,
    bounds: { x: 880, y: 920, width: 640, height: 420 },
    cameraPreset: HQ_CAMERA_PRESETS.BOARDROOM,
    features: [
      'Meja rapat kayu walnut 12 kursi ergonomis',
      'Layar proyektor presentasi milestone & demo',
      'Dinding kaca partisi kedap suara dengan pintu geser',
      'Piala penghargaan studio tahunan',
    ],
  },
];

/**
 * Circulation Network connecting all wings and facilities
 */
export const CIRCULATION_NETWORK = [
  {
    id: 'hallway_central_spine',
    name: 'Grand Central Corridor',
    wing: 'central_spine' as const,
    startPoint: { x: 1200, y: 60 },
    endPoint: { x: 1200, y: 1340 },
    width: 120,
    connectsTo: ['facility_reception', 'facility_collaboration_plaza', 'facility_boardroom', 'corridor_west_arterial', 'corridor_east_arterial'],
  },
  {
    id: 'corridor_west_arterial',
    name: 'West Wing Promenade',
    wing: 'west_wing' as const,
    startPoint: { x: 780, y: 680 },
    endPoint: { x: 100, y: 680 },
    width: 80,
    connectsTo: ['dompetnalar', 'mobile-kasir', 'worklume', 'hallway_central_spine'],
  },
  {
    id: 'corridor_east_arterial',
    name: 'East Wing Promenade',
    wing: 'east_wing' as const,
    startPoint: { x: 1620, y: 680 },
    endPoint: { x: 2300, y: 680 },
    width: 80,
    connectsTo: ['idle-master', 'idle-mining', 'the-broken-origin', 'hallway_central_spine'],
  },
];

/**
 * Master Connected HQ Floor Plan Object
 */
export const CONNECTED_VIRTUAL_HQ_FLOOR_PLAN: ConnectedHQFloorPlan = {
  id: 'hq_master_continuous_v1',
  version: 1,
  name: 'SleepyKoala Studio — Connected Virtual Headquarters',
  worldDimensions: CONNECTED_HQ_DIMENSIONS,
  overviewCamera: HQ_CAMERA_PRESETS.OVERVIEW,
  sharedFacilities: SHARED_HQ_FACILITIES,
  workspaces: CANONICAL_WORKSPACES,
  circulation: CIRCULATION_NETWORK,
};
