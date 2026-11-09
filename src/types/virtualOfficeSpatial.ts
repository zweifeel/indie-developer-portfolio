/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VIRTUAL HQ SPATIAL ARCHITECTURE CONTRACT (B3.3)
 * 
 * Continuous Connected Isometric Office Floor Plan, Shared Circulation,
 * Camera Viewport Coordinates, and Dynamic Workspace Provisioning.
 * ============================================================================
 */

import { CoreAgentRole } from './virtualOffice';

/**
 * 2D Point in Global Isometric Coordinate Space
 */
export interface SpatialPoint {
  x: number;
  y: number;
}

/**
 * Camera Viewport Configuration
 */
export interface CameraViewport {
  x: number; // Viewport top-left X in world units
  y: number; // Viewport top-left Y in world units
  width: number; // Viewport width in world units
  height: number; // Viewport height in world units
  zoom: number; // Scale factor (e.g. 1.0 = overview, 2.0 = close-up)
}

/**
 * Spatial Wing / Sector
 */
export type OfficeWing = 'west_wing' | 'central_spine' | 'east_wing' | 'north_concourse';

/**
 * Facility / Workspace Classification
 */
export type SpatialZoneType =
  | 'workspace' // Project-specific workspace
  | 'reception' // Front lobby & visitor entrance
  | 'collaboration_plaza' // Open central meeting & coffee bar
  | 'boardroom' // Glass-partitioned shared conference room
  | 'server_facility' // Central build cluster & infrastructure
  | 'break_lounge' // Relaxation & recreation zone
  | 'corridor'; // Circulation pathway

/**
 * Unique Workspace Environmental Profile
 */
export interface WorkspaceEnvironmentProfile {
  projectId: string;
  projectSlug: string;
  projectName: string;
  category: string;
  wing: OfficeWing;
  floorZoneId: string;
  spatialAnchor: SpatialPoint; // Center point of workspace in global coordinates
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cameraPreset: CameraViewport;
  environmentTheme: {
    title: string;
    description: string;
    primaryColor: string;
    accentColor: string;
    ambientTint: string;
    flooring: 'parquet_warm' | 'slate_tech' | 'carpet_teal' | 'tile_obsidian';
    specialtyDecor: Array<{
      id: string;
      label: string;
      type: string;
      x: number;
      y: number;
      description: string;
    }>;
  };
  specializedAgents: Record<CoreAgentRole, {
    title: string;
    focus: string;
    stationAnchor: SpatialPoint;
  }>;
}

/**
 * Circulation Corridor Segment
 */
export interface CirculationCorridor {
  id: string;
  name: string;
  wing: OfficeWing;
  startPoint: SpatialPoint;
  endPoint: SpatialPoint;
  width: number;
  connectsTo: string[]; // IDs of zones or other corridors connected
}

/**
 * Global Connected Virtual HQ Floor Plan Definition
 */
export interface ConnectedHQFloorPlan {
  id: string;
  version: number;
  name: string;
  worldDimensions: {
    width: number; // e.g. 2400
    height: number; // e.g. 1400
  };
  overviewCamera: CameraViewport;
  sharedFacilities: Array<{
    id: string;
    name: string;
    zoneType: SpatialZoneType;
    wing: OfficeWing;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    cameraPreset: CameraViewport;
    features: string[];
  }>;
  workspaces: WorkspaceEnvironmentProfile[];
  circulation: CirculationCorridor[];
}
