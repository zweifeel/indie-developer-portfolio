/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL OFFICE 3D DATA CONTRACT
 * 
 * Scalable 3D Procedural Campus, Autonomous Human Crew AI,
 * Contextual 3D Chat Bubbles, and Interactive Visitor Command Console.
 * ============================================================================
 */

export type Vector3Tuple = [number, number, number];

export type CoreCrewRole =
  | 'PLANNER'
  | 'DEVELOPER'
  | 'TESTER'
  | 'REVIEWER'
  | 'PUBLISHER';

export type CrewAIState =
  | 'WORKING_AT_DESK'
  | 'WALKING'
  | 'AT_PANTRY'
  | 'AT_LOUNGE'
  | 'VISITING_OTHER_ROOM'
  | 'IN_MEETING'
  | 'SLEEPING'
  | 'CELEBRATING'
  | 'STRETCHING'
  | 'CHATTING'
  | 'INSPECTING_SCREEN';

/**
 * 3D Obstacle Bounding Box for Collision Avoidance
 */
export interface ObstacleBox3D {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Thematic 3D Room Signage Specification
 */
export interface RoomSignageSpec {
  title: string;
  subtitle: string;
  accentColor: number;
  accentColorHex: string;
}

/**
 * Procedural Kay Lousberg-style Human Stylization
 */
export interface HumanAttire3D {
  skinTone: string; // e.g. '#e0ac69', sawo matang, kuning langsat
  hairColor: string; // e.g. '#2c1b18'
  hairStyle: 'short_neat' | 'side_part' | 'curly_top' | 'bob_cut' | 'bun';
  topType: 'shirt_tie' | 'polo_cardigan' | 'blazer_casual' | 'vest_formal';
  topColor: string;
  accentColor?: string; // tie or cardigan color
  pantsColor: string;
  shoesColor: string;
  accessory?: 'glasses' | 'headphones' | 'lanyard_id' | 'beret_hat' | 'none';
}

/**
 * Independent 3D Human Crew Member Instance
 */
export interface ProjectCrewMember3D {
  id: string; // e.g. 'agent_dompetnalar_dev'
  projectId: string; // e.g. 'dompetnalar'
  projectSlug: string;
  projectName: string;
  name: string; // Display name e.g. 'Reza'
  displayName: string; // e.g. 'Reza (SQLite & Ledger Engineer)'
  role: CoreCrewRole;
  attire: HumanAttire3D;
  deskIndex: number; // 0 to 4 in room
  homeDeskPos: Vector3Tuple;
  currentPos: Vector3Tuple;
  targetPos: Vector3Tuple | null;
  facingAngleY: number; // in radians
  currentState: CrewAIState;
  speed: number;
  deskItem: string; // e.g. 'Dual 4K Monitor', 'Android Test Dock'
  currentActivityLog: string;
  isSleeping: boolean;
  speedBuffUntil: number; // timestamp ms
  activeChatBubble?: ChatBubbleData | null;
}

/**
 * Procedurally Spawned Project Workspace
 */
export interface DynamicProjectRoom3D {
  roomId: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  category: string;
  status: string;
  roomIndex: number;
  wing: 'west' | 'east';
  centerPos: Vector3Tuple;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  cameraFocusPos: Vector3Tuple;
  cameraFocusZoom: number;
  assignedCrewIds: string[];
}

/**
 * Shared Common Facility (Lobby, Lounge, Pantry)
 */
export interface SharedFacility3D {
  facilityId: 'reception' | 'collaboration_plaza' | 'pantry_coffee_bar';
  name: string;
  centerPos: Vector3Tuple;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  waypoints: Vector3Tuple[];
}

/**
 * 3D Billboard Chat / Thought Bubble
 */
export interface ChatBubbleData {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  type: 'speech' | 'thought' | 'action';
  createdAt: number;
  durationMs: number;
  worldPos: Vector3Tuple;
}

/**
 * Visitor Interactive Command Definition
 */
export type VisitorCommandAction =
  | 'WAKE_UP'
  | 'SERVE_COFFEE'
  | 'ORDER_PIZZA'
  | 'CRUNCH_MODE'
  | 'PARTY_CONFETTI'
  | 'QUERY_STATUS';

export interface VisitorCommandDef {
  command: string;
  aliases: string[];
  actionType: VisitorCommandAction;
  label: string;
  icon: string;
  description: string;
  sampleUsage: string;
}

export interface VisitorCommandFeedback {
  success: boolean;
  command: string;
  message: string;
  targetCrewName?: string;
  actionType: VisitorCommandAction;
  timestamp: string;
}

/**
 * Studio Activity Log Entry
 */
export interface StudioActivityLog {
  id: string;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  crewName: string;
  message: string;
  type: 'movement' | 'work' | 'command' | 'dialogue';
}
