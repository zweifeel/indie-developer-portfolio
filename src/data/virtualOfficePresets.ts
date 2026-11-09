/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL DEVELOPMENT OFFICE PRESETS & PROVISIONER (B1)
 * 
 * Data-Driven Theme Presets, Role Specializations, and Provisioning Engine
 * Supports N arbitrary projects without hardcoding.
 * ============================================================================
 */

import {
  CoreAgentRole,
  CORE_AGENT_ROLES,
  RoomThemePreset,
  ProjectRoomConfig,
  AgentCrewMember,
  VirtualHQConfig,
  VIRTUAL_OFFICE_SIMULATION_LABEL,
  SimulatedActivity,
} from '../types/virtualOffice';

/**
 * Standard Default Isometric Coordinate Slots for the 5 Agents
 */
export const DEFAULT_AGENT_SLOTS = [
  { slot: 1, xPercent: 38, yPercent: 36, direction: 'south' },
  { slot: 2, xPercent: 20, yPercent: 50, direction: 'east' },
  { slot: 3, xPercent: 58, yPercent: 40, direction: 'south' },
  { slot: 4, xPercent: 74, yPercent: 56, direction: 'west' },
  { slot: 5, xPercent: 45, yPercent: 66, direction: 'north' },
] as const;

/**
 * Default Simulated Activity for each core role
 */
export const DEFAULT_ROLE_ACTIVITIES: Record<CoreAgentRole, SimulatedActivity> = {
  PLANNER: {
    type: 'PLANNING',
    label: 'Menyusun Task & Prioritas',
    detail: 'Menelaah backlog fitur dan roadmap rilis.',
  },
  DEVELOPER: {
    type: 'CODING',
    label: 'Mengembangkan Fitur',
    detail: 'Menulis arsitektur kode dan implementasi logika.',
  },
  TESTER: {
    type: 'TESTING',
    label: 'Menguji Skenario',
    detail: 'Memvalidasi fungsionalitas dan uji ketahanan edge-case.',
  },
  REVIEWER: {
    type: 'REVIEWING',
    label: 'Review Kualitas & UX',
    detail: 'Memastikan standar desain, clean code, dan keterbacaan.',
  },
  PUBLISHER: {
    type: 'PUBLISHING',
    label: 'Menyiapkan Materi Rilis',
    detail: 'Menyiapkan metadata kepatuhan Google Play dan dokumentasi.',
  },
};

/**
 * 1. PRESET: ANDROID MOBILE APPLICATIONS (Finance, Kasir, Productivity, Tools)
 */
export const PRESET_ANDROID_APP: RoomThemePreset = {
  id: 'preset_android_app',
  name: 'Android Studio Workspace',
  description: 'Ruang kerja bernuansa modern studio aplikasi Android dengan perangkat uji dan arsitektur mobile.',
  matchedCategories: ['Finance', 'Productivity', 'Tools', 'Kasir', 'Business', 'Utilities', 'Application'],
  theme: {
    id: 'theme_android_blue_cyan',
    name: 'Android Studio Space',
    wallColor: '#0f172a',
    floorColor: '#1e293b',
    accentColor: '#38bdf8',
    ambientGlow: 'rgba(56, 189, 248, 0.15)',
    decorItems: [
      { id: 'decor_1', type: 'whiteboard', xPercent: 15, yPercent: 15, label: 'App Architecture' },
      { id: 'decor_2', type: 'server_rack', xPercent: 85, yPercent: 15, label: 'Build CI/CD' },
      { id: 'decor_3', type: 'coffee_station', xPercent: 90, yPercent: 70, label: 'Coffee Point' },
      { id: 'decor_4', type: 'plant', xPercent: 10, yPercent: 75 },
    ],
  },
  defaultSpecializations: {
    PLANNER: {
      specialization: 'Mobile App Architect',
      description: 'Merancang arsitektur aplikasi Android modular dan roadmap milestone.',
    },
    DEVELOPER: {
      specialization: 'Android Engineer (Jetpack Compose)',
      description: 'Membangun UI responsif, Room database offline-first, dan ViewModel.',
    },
    TESTER: {
      specialization: 'Device Matrix & QA Tester',
      description: 'Menguji variasi resolusi Android, orientasi layar, dan konsistensi data.',
    },
    REVIEWER: {
      specialization: 'UX & Accessibility Reviewer',
      description: 'Meninjau kontras, navigasi satu tangan, dan kepatuhan Material Design 3.',
    },
    PUBLISHER: {
      specialization: 'Google Play Release Manager',
      description: 'Mengelola listing Play Console, Closed Testing 14 hari, dan kepatuhan privasi.',
    },
  },
};

/**
 * 2. PRESET: OFFLINE / SINGLE-PLAYER GAMES (Idle, Action, Arcade, Puzzle)
 */
export const PRESET_OFFLINE_GAME: RoomThemePreset = {
  id: 'preset_offline_game',
  name: 'Game Design Studio',
  description: 'Ruang studio game dengan monitor ganda, papan konsep game loop, dan meja balancing.',
  matchedCategories: ['Game', 'Action', 'Idle', 'Arcade', 'Simulation', 'Puzzle', 'Casual'],
  theme: {
    id: 'theme_game_purple_violet',
    name: 'Game Dev Lab',
    wallColor: '#1e1b4b',
    floorColor: '#2e1065',
    accentColor: '#a855f7',
    ambientGlow: 'rgba(168, 85, 247, 0.15)',
    decorItems: [
      { id: 'decor_1', type: 'whiteboard', xPercent: 15, yPercent: 15, label: 'Game Loop & Economy' },
      { id: 'decor_2', type: 'poster', xPercent: 50, yPercent: 10, label: 'Concept Art' },
      { id: 'decor_3', type: 'trophy', xPercent: 85, yPercent: 20, label: 'Hall of Fame' },
      { id: 'decor_4', type: 'plant', xPercent: 88, yPercent: 75 },
    ],
  },
  defaultSpecializations: {
    PLANNER: {
      specialization: 'Lead Game Designer',
      description: 'Merancang mekanika gameplay inti, kurva progresi pemain, dan balancing.',
    },
    DEVELOPER: {
      specialization: 'Gameplay & Physics Programmer',
      description: 'Mengembangkan sistem state machine, simulasi offline gain, dan kontrol responsif.',
    },
    TESTER: {
      specialization: 'Balance & Difficulty Tester',
      description: 'Menguji pacing permainan, validasi ekonomi in-game, dan stabilitas 60 FPS.',
    },
    REVIEWER: {
      specialization: 'Game Feel & Audio Reviewer',
      description: 'Mengevaluasi juiciness efek visual, haptic feedback, dan harmonisasi SFX.',
    },
    PUBLISHER: {
      specialization: 'App Store Optimization (ASO) Specialist',
      description: 'Menyiapkan screenshot aksi gameplay, ikon visual memikat, dan video pratinjau.',
    },
  },
};

/**
 * 3. PRESET: MULTIPLAYER / MMORPG / LIVE-OPS GAMES
 */
export const PRESET_MMORPG: RoomThemePreset = {
  id: 'preset_mmorpg',
  name: 'MMORPG Operations Hub',
  description: 'Pusat komando game multiplayer dengan monitor status jaringan dan papan peta dunia.',
  matchedCategories: ['MMORPG', 'Multiplayer', 'Online', 'RPG'],
  theme: {
    id: 'theme_mmorpg_emerald_cyan',
    name: 'Command Guild Hall',
    wallColor: '#064e3b',
    floorColor: '#022c22',
    accentColor: '#10b981',
    ambientGlow: 'rgba(16, 185, 129, 0.15)',
    decorItems: [
      { id: 'decor_1', type: 'whiteboard', xPercent: 15, yPercent: 15, label: 'World Map & Lore' },
      { id: 'decor_2', type: 'server_rack', xPercent: 85, yPercent: 15, label: 'Cluster State' },
      { id: 'decor_3', type: 'bookshelf', xPercent: 10, yPercent: 70, label: 'Rulebooks' },
      { id: 'decor_4', type: 'coffee_station', xPercent: 88, yPercent: 75 },
    ],
  },
  defaultSpecializations: {
    PLANNER: {
      specialization: 'World & Systems Designer',
      description: 'Merancang ekologi dunia, sistem pertempuran, dan arsitektur kelas karakter.',
    },
    DEVELOPER: {
      specialization: 'Network & Engine Developer',
      description: 'Mengembangkan sinkronisasi state jaringan, replikasi entitas, dan mitigasi lag.',
    },
    TESTER: {
      specialization: 'Combat & Economy Stress Tester',
      description: 'Menguji ketahanan beban multipemain, exploit transaksi, dan konsistensi status.',
    },
    REVIEWER: {
      specialization: 'Multiplayer Balance & Anti-Cheat Reviewer',
      description: 'Memastikan keadilan kompetisi, validasi data server-side, dan kepuasan komunitas.',
    },
    PUBLISHER: {
      specialization: 'LiveOps & Distribution Coordinator',
      description: 'Mengelola jadwal rilis patch konten, event berkala, dan integrasi backend CDN.',
    },
  },
};

/**
 * 4. PRESET: ENTERPRISE & BUSINESS WEB / DESKTOP (SaaS, Enterprise, POS)
 */
export const PRESET_BUSINESS_WEB: RoomThemePreset = {
  id: 'preset_business_web',
  name: 'Enterprise Workflow Office',
  description: 'Ruang kerja profesional dengan papan metrik performa, integrasi database, dan kepatuhan sistem.',
  matchedCategories: ['Enterprise', 'SaaS', 'POS', 'Management', 'Accounting'],
  theme: {
    id: 'theme_business_amber_slate',
    name: 'Executive Tech Suite',
    wallColor: '#1c1917',
    floorColor: '#292524',
    accentColor: '#f59e0b',
    ambientGlow: 'rgba(245, 158, 11, 0.15)',
    decorItems: [
      { id: 'decor_1', type: 'whiteboard', xPercent: 15, yPercent: 15, label: 'Dataflow Schema' },
      { id: 'decor_2', type: 'server_rack', xPercent: 85, yPercent: 15, label: 'Edge Infrastructure' },
      { id: 'decor_3', type: 'bookshelf', xPercent: 10, yPercent: 70, label: 'Compliance Manuals' },
      { id: 'decor_4', type: 'plant', xPercent: 88, yPercent: 75 },
    ],
  },
  defaultSpecializations: {
    PLANNER: {
      specialization: 'Business Solutions Architect',
      description: 'Menganalisis kebutuhan bisnis pengguna dan memetakan alur transaksi kritis.',
    },
    DEVELOPER: {
      specialization: 'Fullstack & Systems Engineer',
      description: 'Membangun logika bisnis tangguh, integritas ACID, dan responsivitas UI.',
    },
    TESTER: {
      specialization: 'Data Integrity & Edge-Case Tester',
      description: 'Menguji keakuratan pembulatan finansial, konektivitas offline, dan sinkronisasi.',
    },
    REVIEWER: {
      specialization: 'Security & ISO Compliance Reviewer',
      description: 'Memastikan enkripsi data lokal, keamanan sesi, dan kepatuhan privasi.',
    },
    PUBLISHER: {
      specialization: 'Deployment & Release Coordinator',
      description: 'Menyiapkan dokumentasi instalasi, panduan pengguna, dan checklist audit.',
    },
  },
};

/**
 * 5. PRESET: UNIVERSAL FALLBACK (Untuk Kategori yang Tidak Dikenali / Custom)
 */
export const PRESET_UNIVERSAL: RoomThemePreset = {
  id: 'preset_universal',
  name: 'SleepyKoala Creative Space',
  description: 'Ruang kerja fleksibel universal dengan estetika khas SleepyKoala Studio.',
  matchedCategories: ['*'],
  theme: {
    id: 'theme_universal_slate_cyan',
    name: 'Universal Craft Room',
    wallColor: '#18181b',
    floorColor: '#27272a',
    accentColor: '#22d3ee',
    ambientGlow: 'rgba(34, 211, 238, 0.15)',
    decorItems: [
      { id: 'decor_1', type: 'whiteboard', xPercent: 15, yPercent: 15, label: 'Project Roadmap' },
      { id: 'decor_2', type: 'bookshelf', xPercent: 85, yPercent: 15, label: 'Tech Library' },
      { id: 'decor_3', type: 'coffee_station', xPercent: 10, yPercent: 70, label: 'Rest Area' },
      { id: 'decor_4', type: 'plant', xPercent: 88, yPercent: 75 },
    ],
  },
  defaultSpecializations: {
    PLANNER: {
      specialization: 'Product Architect & Planner',
      description: 'Menyusun visi produk, pemecahan tugas, dan perencanaan milestone.',
    },
    DEVELOPER: {
      specialization: 'Core Software Developer',
      description: 'Mengembangkan arsitektur aplikasi dan mengimplementasikan fitur utama.',
    },
    TESTER: {
      specialization: 'Quality Assurance Tester',
      description: 'Menguji keandalan sistem dan memverifikasi seluruh skenario pengujian.',
    },
    REVIEWER: {
      specialization: 'Code & Product Reviewer',
      description: 'Meninjau standar kualitas kode, kemudahan penggunaan, dan konsistensi.',
    },
    PUBLISHER: {
      specialization: 'Release & Compliance Coordinator',
      description: 'Menyiapkan paket distribusi, dokumentasi publik, dan verifikasi rilis.',
    },
  },
};

/**
 * All Registered Presets in Search Order
 */
export const ALL_ROOM_PRESETS: readonly RoomThemePreset[] = [
  PRESET_ANDROID_APP,
  PRESET_OFFLINE_GAME,
  PRESET_MMORPG,
  PRESET_BUSINESS_WEB,
  PRESET_UNIVERSAL, // Fallback always last
] as const;

/**
 * Matches a category string to the best matching RoomThemePreset
 * Fallback to PRESET_UNIVERSAL if not found.
 */
export function getPresetForCategory(category?: string): RoomThemePreset {
  if (!category || typeof category !== 'string') {
    return PRESET_UNIVERSAL;
  }

  const normalized = category.trim().toLowerCase();
  if (!normalized) {
    return PRESET_UNIVERSAL;
  }

  for (const preset of ALL_ROOM_PRESETS) {
    if (preset.id === PRESET_UNIVERSAL.id) continue;
    const match = preset.matchedCategories.some((c) =>
      normalized.includes(c.toLowerCase()) || c.toLowerCase().includes(normalized)
    );
    if (match) {
      return preset;
    }
  }

  return PRESET_UNIVERSAL;
}

/**
 * Generates an AgentCrewMember with the correct archetype and coordinate slot
 */
export function createAgentCrewMember(
  role: CoreAgentRole,
  projectSlug: string,
  preset: RoomThemePreset,
  slotIndex: number
): AgentCrewMember {
  const specData = preset.defaultSpecializations[role];
  const slotPos = DEFAULT_AGENT_SLOTS[slotIndex] || DEFAULT_AGENT_SLOTS[0];

  const roleArchetypeMap: Record<CoreAgentRole, AgentCrewMember['avatar']['archetype']> = {
    PLANNER: 'human_planner',
    DEVELOPER: 'human_dev',
    TESTER: 'human_tester',
    REVIEWER: 'human_reviewer',
    PUBLISHER: 'human_publisher',
  };

  const roleNameMap: Record<CoreAgentRole, string> = {
    PLANNER: 'Planner',
    DEVELOPER: 'Developer',
    TESTER: 'Tester',
    REVIEWER: 'Reviewer',
    PUBLISHER: 'Publisher',
  };

  return {
    id: `agent_${projectSlug}_${role.toLowerCase()}`,
    role,
    name: roleNameMap[role],
    specialization: specData.specialization,
    description: specData.description,
    position: {
      slot: slotPos.slot,
      xPercent: slotPos.xPercent,
      yPercent: slotPos.yPercent,
      direction: slotPos.direction,
    },
    avatar: {
      archetype: roleArchetypeMap[role],
      primaryColor: preset.theme.accentColor,
      accessory: role === 'PLANNER' ? 'glasses' : role === 'TESTER' ? 'headset' : 'none',
    },
    currentActivity: DEFAULT_ROLE_ACTIVITIES[role],
  };
}

/**
 * Data-driven automatic provisioning of a Project Room
 * Scalable for any new project (Project #7, #20, etc.) without code modifications.
 */
export function provisionProjectRoom(project: {
  id?: string;
  name: string;
  slug: string;
  category?: string;
  tagline?: string;
  shortDescription?: string;
  status?: string;
  publishState?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}): ProjectRoomConfig {
  const preset = getPresetForCategory(project.category);
  const now = new Date().toISOString();

  // Exactly 5 agents generated in canonical order
  const agents: AgentCrewMember[] = CORE_AGENT_ROLES.map((role, idx) =>
    createAgentCrewMember(role, project.slug, preset, idx)
  );

  const isPublished = project.publishState === 'PUBLISHED';
  const isArchived = project.publishState === 'ARCHIVED';

  return {
    id: `room_${project.slug}`,
    projectId: project.id || project.slug,
    projectSlug: project.slug,
    projectName: project.name,
    category: project.category || 'General',
    tagline: project.tagline || project.shortDescription || 'Studio Project',
    themePresetId: preset.id,
    themeStyle: { ...preset.theme },
    agents,
    visibility: isArchived ? 'archived' : isPublished ? 'public' : 'draft',
    isArchived,
    customized: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const CANONICAL_PROJECT_SEEDS = [
  { id: 'proj-dompetnalar', name: 'DompetNalar', slug: 'dompetnalar', category: 'Finance / Productivity' },
  { id: 'proj-idle-master', name: 'Idle Master', slug: 'idle-master', category: 'Casual Mobile Game' },
  { id: 'proj-mobile-kasir', name: 'Mobile Kasir', slug: 'mobile-kasir', category: 'Business / POS' },
  { id: 'proj-idle-mining', name: 'Idle Mining Empire', slug: 'idle-mining-empire', category: 'Simulation Game' },
  { id: 'proj-tbo', name: 'The Broken Origin', slug: 'tbo-roblox', category: 'Roblox MMORPG' },
  { id: 'proj-worklume', name: 'Worklume', slug: 'worklume', category: 'SaaS / Productivity' },
];

/**
 * Provisions a complete Virtual HQ containing the 5 global agents and all provisioned project rooms
 */
export function provisionVirtualHQ(projects: ReadonlyArray<{
  id?: string;
  name: string;
  slug: string;
  category?: string;
  tagline?: string;
  shortDescription?: string;
  status?: string;
  publishState?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}> = CANONICAL_PROJECT_SEEDS): VirtualHQConfig {
  const now = new Date().toISOString();
  const effectiveProjects = (projects && projects.length > 0) ? projects : CANONICAL_PROJECT_SEEDS;
  const rooms = effectiveProjects.map((p) => provisionProjectRoom(p));

  // Global HQ core agents stationed at main command area
  const globalAgents: AgentCrewMember[] = CORE_AGENT_ROLES.map((role, idx) =>
    createAgentCrewMember(role, 'hq', PRESET_UNIVERSAL, idx)
  );

  return {
    id: 'hq_main',
    version: 1,
    label: VIRTUAL_OFFICE_SIMULATION_LABEL,
    name: 'SleepyKoala Virtual Development Office',
    globalAgents,
    rooms,
    activeRoomId: rooms[0]?.id || null,
    animation: {
      enabled: true,
      reducedMotion: false,
      motionLevel: 'subtle',
      staticFallback: false,
    },
    updatedAt: now,
  };
}
