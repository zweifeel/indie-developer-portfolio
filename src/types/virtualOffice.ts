/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL DEVELOPMENT OFFICE DATA CONTRACT (B1)
 * 
 * Reusable, Scalable, 2D/2.5D Isometric Simulation Architecture
 * Baseline Locked: Pure Browser Simulation — Zero AI Runtime / Zero External API
 * 
 * Mandatory System Label: "AI Agent Crew — Simulation"
 * ============================================================================
 */

/**
 * Mandatory Label that MUST always accompany the simulation UI
 */
export const VIRTUAL_OFFICE_SIMULATION_LABEL = 'AI Agent Crew — Simulation';

/**
 * The 5 Canonical Core Agent Roles
 * Strictly 5 agents across all project rooms and Virtual HQ.
 */
export type CoreAgentRole =
  | 'PLANNER'
  | 'DEVELOPER'
  | 'TESTER'
  | 'REVIEWER'
  | 'PUBLISHER';

export const CORE_AGENT_ROLES: readonly CoreAgentRole[] = [
  'PLANNER',
  'DEVELOPER',
  'TESTER',
  'REVIEWER',
  'PUBLISHER',
] as const;

/**
 * Simulated Activity Types (Lightweight Visual States)
 */
export type SimulatedActivityType =
  | 'PLANNING'
  | 'CODING'
  | 'TESTING'
  | 'REVIEWING'
  | 'PUBLISHING'
  | 'DISCUSSING'
  | 'READING'
  | 'IDLE';

export interface SimulatedActivity {
  type: SimulatedActivityType;
  label: string; // Indonesian friendly label (e.g., "Menyusun Task")
  detail?: string; // Optional contextual status detail
  updatedAt?: string;
}

/**
 * Visual Appearance & Avatar for 2D/2.5D Character Styling
 */
export interface AgentAvatarStyle {
  archetype:
    | 'human_planner'
    | 'human_dev'
    | 'human_tester'
    | 'human_reviewer'
    | 'human_publisher'
    | 'koala_planner'
    | 'koala_dev'
    | 'koala_tester'
    | 'koala_reviewer'
    | 'koala_publisher'
    | 'custom';
  primaryColor: string; // Hex color for clothing/accent
  secondaryColor?: string;
  accessory?: 'glasses' | 'headset' | 'hat' | 'clipboard' | 'badge' | 'none';
  deskItem?: 'laptop' | 'dual_monitor' | 'test_tablet' | 'notepad' | 'coffee_mug';
}

/**
 * Agent Coordinate & Template Slot Position
 */
export interface AgentRoomPosition {
  slot: number; // 1 to 5 (order in room)
  xPercent: number; // 0 - 100 percentage in 2.5D isometric plane
  yPercent: number; // 0 - 100 percentage in 2.5D isometric plane
  direction: 'north' | 'south' | 'east' | 'west'; // Facing direction
}

/**
 * Core Agent Crew Member Configuration
 */
export interface AgentCrewMember {
  id: string; // Unique id e.g. "agent_dompetnalar_planner"
  role: CoreAgentRole;
  name: string; // Display name e.g. "Koala Planner"
  specialization: string; // Category-specific e.g. "App Architect & Task Planner"
  description: string; // Responsibilities summary
  position: AgentRoomPosition;
  avatar: AgentAvatarStyle;
  currentActivity: SimulatedActivity;
}

/**
 * Room Theme & Decor Palette
 */
export interface RoomThemeStyle {
  id: string; // e.g. "theme_finance_clean"
  name: string; // e.g. "Clean Finance Office"
  wallColor: string;
  floorColor: string;
  accentColor: string;
  ambientGlow: string;
  decorItems: Array<{
    id: string;
    type: 'whiteboard' | 'plant' | 'bookshelf' | 'server_rack' | 'coffee_station' | 'poster' | 'trophy';
    xPercent: number;
    yPercent: number;
    label?: string;
  }>;
}

/**
 * Preset configuration template matching a project category
 */
export interface RoomThemePreset {
  id: string;
  name: string;
  description: string;
  matchedCategories: readonly string[]; // Categories matched, e.g. ['Finance', 'Productivity', 'Tools']
  theme: RoomThemeStyle;
  defaultSpecializations: Record<CoreAgentRole, {
    specialization: string;
    description: string;
  }>;
}

/**
 * Project Room Configuration (Per-Project)
 * Shared between Virtual HQ (overview) and ProjectDetailPage (close-up).
 */
export interface ProjectRoomConfig {
  id: string; // e.g. "room_dompetnalar"
  projectId: string; // Associated project identifier
  projectSlug: string; // Slug e.g. "dompetnalar"
  projectName: string; // Display name
  category: string; // Category e.g. "Finance"
  tagline?: string;
  themePresetId: string; // e.g. "preset_android_app"
  themeStyle: RoomThemeStyle;
  agents: AgentCrewMember[]; // Exactly 5 agents
  visibility: 'public' | 'draft' | 'archived'; // Mirrors project visibility
  isArchived: boolean;
  customized: boolean; // True if manual adjustments made in Web Admin
  createdAt: string;
  updatedAt: string;
}

/**
 * Animation & Accessibility Preferences
 */
export interface AnimationPreferences {
  enabled: boolean;
  reducedMotion: boolean; // Follows window.matchMedia('(prefers-reduced-motion)')
  motionLevel: 'none' | 'subtle' | 'full';
  staticFallback: boolean; // If true, render high-clarity static isometric snapshot
}

/**
 * Virtual HQ Global Configuration (Dashboard Canvas)
 */
export interface VirtualHQConfig {
  id: string; // "hq_main"
  version: number; // Schema version e.g. 1
  label: string; // Always "AI Agent Crew — Simulation"
  name: string; // "SleepyKoala Virtual Development Office"
  globalAgents: AgentCrewMember[]; // Core HQ general agents
  rooms: ProjectRoomConfig[]; // Dynamic array of rooms (1 per project)
  activeRoomId?: string | null; // Currently highlighted room in HQ viewport
  animation: AnimationPreferences;
  updatedAt: string;
}
