/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — THREE.JS CAMPUS CANVAS (LAPIS 3)
 * 
 * Expansive 3D Campus Scene, 30+ Autonomous Human Crew, 360° Orbit & Drag-Pan,
 * Authentic KayKit Models with Live AnimationMixer (Sit & Work), Contextual
 * 3D Floating Chat Bubbles, and Interactive Project Room Drawer.
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Building2,
  Users,
  Compass,
  ArrowRight,
  Move,
  RotateCw,
} from 'lucide-react';
import type { Project } from '../../types/project';
import {
  DynamicProjectRoom3D,
  ProjectCrewMember3D,
  StudioActivityLog,
  VisitorCommandFeedback,
  ChatBubbleData,
  ObstacleBox3D,
} from '../../types/virtualOffice3D';
import {
  generateCampusObstacles,
} from '../../data/virtualOffice3DConfig';
import {
  assembleProcedural3DCampus,
  syncCrewMeshes,
} from './three/proceduralCampusBuilder';
import {
  stepCrewMovement,
  evaluateRandomDecisions,
} from './three/crewAIController';
import {
  updateBubbleExpirations,
  evaluateAutonomousBubbles,
} from './three/chatBubbleEngine';
import {
  executeVisitorCommand,
} from './three/visitorCommandParser';
import {
  CameraState,
  CAMPUS_OVERVIEW_PRESET,
  calculateRoomFocusState,
  stepCameraInterpolation,
  computeCameraPosition,
  applyCameraPan,
  applyPointerZoom,
} from './three/cameraTransitionController';
import { VisitorCommandConsole } from './VisitorCommandConsole';

export interface ThreeCampusCanvasProps {
  projects: readonly Project[] | Project[];
  initialFocusedSlug?: string | null;
  className?: string;
  onSelectProject?: (slug: string) => void;
}

/**
 * Check if WebGL context can be initialized
 */
export function isWebGLAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
      return false;
    }
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export const ThreeCampusCanvas: React.FC<ThreeCampusCanvasProps> = ({
  projects,
  initialFocusedSlug = null,
  className = '',
  onSelectProject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fallback state if WebGL is disabled
  const [webglSupported] = useState<boolean>(() => isWebGLAvailable());

interface CrewAnimationController {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAction: THREE.AnimationAction | null;
  currentClipName: string;
}

  // Simulation & State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<VisitorCommandFeedback | null>(null);
  const [activityLogs, setActivityLogs] = useState<StudioActivityLog[]>([]);
  const [activeBubbles, setActiveBubbles] = useState<ChatBubbleData[]>([]);
  const [controlMode, setControlMode] = useState<'orbit' | 'pan'>('pan');

  // Camera state refs for continuous frame loop
  const currentCameraState = useRef<CameraState>({ ...CAMPUS_OVERVIEW_PRESET });
  const desiredCameraState = useRef<CameraState>({ ...CAMPUS_OVERVIEW_PRESET });

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const crewMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const crewStateRef = useRef<ProjectCrewMember3D[]>([]);
  const roomsRef = useRef<DynamicProjectRoom3D[]>([]);
  const animationMixersRef = useRef<THREE.AnimationMixer[]>([]);
  const crewAnimControllersRef = useRef<Map<string, CrewAnimationController>>(new Map());
  const campusObstaclesRef = useRef<ObstacleBox3D[]>([]);

  // Drag interaction refs
  const isDragging = useRef<boolean>(false);
  const previousPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize scene data
  const { initialRooms, initialCrew } = useMemo(() => {
    const assembled = assembleProcedural3DCampus(projects);
    return {
      initialRooms: assembled.rooms,
      initialCrew: assembled.crew,
    };
  }, [projects]);

  // Keep refs in sync with initial data
  useEffect(() => {
    roomsRef.current = initialRooms;
    crewStateRef.current = initialCrew;
    campusObstaclesRef.current = generateCampusObstacles(initialRooms, initialCrew);
  }, [initialRooms, initialCrew]);

  // Focused Room computation
  const activeRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return initialRooms.find((r) => r.roomId === selectedRoomId || r.projectSlug === selectedRoomId) || null;
  }, [selectedRoomId, initialRooms]);

  // Crew in active room vs wandering away
  const activeRoomCrew = useMemo(() => {
    if (!activeRoom) return { inside: [], away: [] };
    const roomCrew = crewStateRef.current.filter((c) => c.projectId === activeRoom.projectId);
    const inside = roomCrew.filter((c) => c.currentState === 'WORKING_AT_DESK' || c.currentState === 'SLEEPING');
    const away = roomCrew.filter((c) => c.currentState !== 'WORKING_AT_DESK' && c.currentState !== 'SLEEPING');
    return { inside, away };
  }, [activeRoom, activityLogs]);

  // Focus on room handler
  const handleSelectRoom = useCallback((room: DynamicProjectRoom3D | null) => {
    if (!room) {
      setSelectedRoomId(null);
      desiredCameraState.current = { ...CAMPUS_OVERVIEW_PRESET };
    } else {
      setSelectedRoomId(room.roomId);
      desiredCameraState.current = calculateRoomFocusState(room);
      if (onSelectProject) {
        onSelectProject(room.projectSlug);
      }
    }
  }, [onSelectProject]);

  // Handle Initial Focused Slug
  useEffect(() => {
    if (initialFocusedSlug && initialRooms.length > 0) {
      const match = initialRooms.find((r) => r.projectSlug === initialFocusedSlug || r.projectId === initialFocusedSlug);
      if (match) {
        handleSelectRoom(match);
      }
    }
  }, [initialFocusedSlug, initialRooms, handleSelectRoom]);

  // Execute Visitor Command via Parser
  const handleExecuteCommand = useCallback((rawInput: string) => {
    const focusedRoomSlug = activeRoom?.projectSlug || null;
    const result = executeVisitorCommand(rawInput, crewStateRef.current, focusedRoomSlug);
    crewStateRef.current = result.updatedCrew;
    setLastFeedback(result.feedback);

    if (result.feedback.success) {
      setActivityLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          crewName: 'Pengunjung',
          projectId: 'campus',
          projectName: 'Kampus Virtual',
          message: result.feedback.message,
          type: 'command',
        },
        ...prev.slice(0, 40),
      ]);
    }
  }, [activeRoom]);

  // Main Three.js Lifecycle
  useEffect(() => {
    if (!webglSupported) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 620;

    // 1. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500);
    const initialCamPos = computeCameraPosition(currentCameraState.current);
    camera.position.set(initialCamPos[0], initialCamPos[1], initialCamPos[2]);
    camera.lookAt(currentCameraState.current.target[0], currentCameraState.current.target[1], currentCameraState.current.target[2]);
    cameraRef.current = camera;

    // 2. Scene Assembly
    const assembled = assembleProcedural3DCampus(projects);
    sceneRef.current = assembled.scene;
    crewMeshMapRef.current = assembled.crewMeshMap;
    crewStateRef.current = assembled.crew;
    roomsRef.current = assembled.rooms;

    // 2b. Enhance with Authentic KayKit 3D Models & Animations
    const enhanceWithKayKitModels = async () => {
      try {
        const {
          loadKayKitCharacterModel,
          getCharacterAnimations,
          loadKayKitFurnitureModel,
          resolveAdventurerForProject,
        } = await import('./three/kayKitModelLoader');

        animationMixersRef.current = [];
        crewAnimControllersRef.current.clear();

        // 1. Load Authentic KayKit Characters with Dynamic Multi-Action Animations
        for (let idx = 0; idx < assembled.crew.length; idx++) {
          const member = assembled.crew[idx];
          const charType = resolveAdventurerForProject(member.projectId, idx);
          try {
            const kayMesh = await loadKayKitCharacterModel(charType);
            const parentGroup = assembled.crewMeshMap.get(member.id);
            if (parentGroup && sceneRef.current) {
              parentGroup.clear(); // remove placeholder
              kayMesh.name = `kaykit_${charType}_${member.id}`;
              parentGroup.add(kayMesh);

              // Setup AnimationMixer with all animation actions
              const clips = getCharacterAnimations(charType);
              if (clips && clips.length > 0) {
                const mixer = new THREE.AnimationMixer(kayMesh);
                const actionsMap = new Map<string, THREE.AnimationAction>();
                clips.forEach((clip) => {
                  actionsMap.set(clip.name, mixer.clipAction(clip));
                });

                const sitClipAction =
                  actionsMap.get('Sit_Chair_Idle') ||
                  actionsMap.get('Sit_Chair_Pose') ||
                  actionsMap.get('Idle') ||
                  mixer.clipAction(clips[0]);

                sitClipAction.play();

                crewAnimControllersRef.current.set(member.id, {
                  mixer,
                  actions: actionsMap,
                  currentAction: sitClipAction,
                  currentClipName: 'Sit_Chair_Idle',
                });
                animationMixersRef.current.push(mixer);
              }
            }
          } catch (err) {
            console.warn('[KayKit] Unable to load character:', member.name, err);
          }
        }

        // 2. Load Authentic Thematic KayKit Furniture into Rooms
        for (const room of assembled.rooms) {
          const roomGroup = assembled.roomMeshMap.get(room.projectId);
          if (!roomGroup || !sceneRef.current) continue;

          const slug = room.projectSlug.toLowerCase();
          try {
            if (slug === 'dompetnalar') {
              const cabinet = await loadKayKitFurnitureModel('cabinet_medium_decorated');
              cabinet.position.set(room.centerPos[0] - 6.0, 0, room.bounds.minZ + 1.2);
              roomGroup.add(cabinet);

              const couch = await loadKayKitFurnitureModel('couch');
              couch.position.set(room.centerPos[0] + 5.5, 0, room.bounds.minZ + 1.5);
              roomGroup.add(couch);

              const rug = await loadKayKitFurnitureModel('rug_rectangle_A');
              rug.position.set(room.centerPos[0], 0.02, room.centerPos[2]);
              roomGroup.add(rug);

              const cactus = await loadKayKitFurnitureModel('cactus_medium_A');
              cactus.position.set(room.bounds.maxX - 1.2, 0, room.bounds.maxZ - 1.2);
              roomGroup.add(cactus);
            } else if (slug === 'idle-master') {
              const armchair = await loadKayKitFurnitureModel('armchair');
              armchair.position.set(room.centerPos[0] + 6.0, 0, room.bounds.minZ + 1.5);
              roomGroup.add(armchair);

              const shelf = await loadKayKitFurnitureModel('shelf_B_large_decorated');
              shelf.position.set(room.centerPos[0] - 5.5, 0, room.bounds.minZ + 1.0);
              roomGroup.add(shelf);

              const lamp = await loadKayKitFurnitureModel('lamp_standing');
              lamp.position.set(room.centerPos[0] + 6.5, 0, room.bounds.minZ + 0.8);
              roomGroup.add(lamp);

              const rug = await loadKayKitFurnitureModel('rug_oval_A');
              rug.position.set(room.centerPos[0], 0.02, room.centerPos[2]);
              roomGroup.add(rug);
            } else if (slug === 'mobile-kasir') {
              const cabinet = await loadKayKitFurnitureModel('cabinet_medium_decorated');
              cabinet.position.set(room.centerPos[0] - 5.5, 0, room.bounds.minZ + 1.0);
              roomGroup.add(cabinet);

              const shelf = await loadKayKitFurnitureModel('shelf_B_large_decorated');
              shelf.position.set(room.centerPos[0] + 5.5, 0, room.bounds.minZ + 1.0);
              roomGroup.add(shelf);

              const bench = await loadKayKitFurnitureModel('bench');
              bench.position.set(room.centerPos[0] + 5.5, 0, room.bounds.maxZ - 1.8);
              roomGroup.add(bench);

              const cactus = await loadKayKitFurnitureModel('cactus_medium_A');
              cactus.position.set(room.bounds.minX + 1.2, 0, room.bounds.maxZ - 1.2);
              roomGroup.add(cactus);
            } else if (slug === 'idle-mining') {
              const cabinet = await loadKayKitFurnitureModel('cabinet_medium_decorated');
              cabinet.position.set(room.centerPos[0] - 5.5, 0, room.bounds.minZ + 1.0);
              roomGroup.add(cabinet);

              const shelf = await loadKayKitFurnitureModel('shelf_B_large_decorated');
              shelf.position.set(room.centerPos[0] + 5.5, 0, room.bounds.minZ + 1.0);
              roomGroup.add(shelf);

              const box = await loadKayKitFurnitureModel('box_A');
              box.position.set(room.centerPos[0] - 6.5, 0, room.bounds.maxZ - 1.5);
              roomGroup.add(box);

              const rug = await loadKayKitFurnitureModel('rug_rectangle_A');
              rug.position.set(room.centerPos[0], 0.02, room.centerPos[2]);
              roomGroup.add(rug);
            } else if (slug === 'worklume') {
              const couch = await loadKayKitFurnitureModel('couch');
              couch.position.set(room.centerPos[0] - 5.5, 0, room.bounds.minZ + 1.5);
              roomGroup.add(couch);

              const armchair = await loadKayKitFurnitureModel('armchair');
              armchair.position.set(room.centerPos[0] + 5.5, 0, room.bounds.minZ + 1.5);
              roomGroup.add(armchair);

              const tableLow = await loadKayKitFurnitureModel('table_low');
              tableLow.position.set(room.centerPos[0] - 5.5, 0, room.bounds.minZ + 3.2);
              roomGroup.add(tableLow);

              const rug = await loadKayKitFurnitureModel('rug_oval_A');
              rug.position.set(room.centerPos[0], 0.02, room.centerPos[2]);
              roomGroup.add(rug);

              const cactus = await loadKayKitFurnitureModel('cactus_medium_A');
              cactus.position.set(room.bounds.maxX - 1.2, 0, room.bounds.maxZ - 1.2);
              roomGroup.add(cactus);
            } else {
              const shelf = await loadKayKitFurnitureModel('shelf_B_large_decorated');
              shelf.position.set(room.centerPos[0] - 4.2, 0, room.bounds.minZ + 0.8);
              roomGroup.add(shelf);
            }
          } catch {
            // Safe fallback
          }
        }

        // 3. Load Pantry Facilities Furniture
        try {
          const counter = await loadKayKitFurnitureModel('kitchencounter_straight_A_decorated');
          counter.position.set(-2, 0, 24);
          assembled.scene.add(counter);

          const sink = await loadKayKitFurnitureModel('kitchencounter_sink');
          sink.position.set(2, 0, 24);
          assembled.scene.add(sink);

          const cafeTable = await loadKayKitFurnitureModel('table_round_A_decorated');
          cafeTable.position.set(0, 0, 20);
          assembled.scene.add(cafeTable);
        } catch {
          // Safe fallback
        }
      } catch {
        // Silently retain procedural mesh in headless environments
      }
    };
    enhanceWithKayKitModels();

    // 3. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
    } catch {
      return;
    }

    // 4. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = Math.max(entry.contentRect.height, 580);
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 5. Animation Frame Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let decisionTimer = 0;
    let dialogueTimer = 0;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const deltaMs = time - lastTime;
      const deltaSec = Math.min(deltaMs / 1000, 0.1);
      lastTime = time;

      // Update KayKit AnimationMixers
      animationMixersRef.current.forEach((mixer) => mixer.update(deltaSec));

      // Dynamically blend KayKit animations based on crew state
      crewStateRef.current.forEach((c) => {
        const ctrl = crewAnimControllersRef.current.get(c.id);
        if (!ctrl) return;

        let targetClip = 'Sit_Chair_Idle';
        if (c.currentState === 'WALKING') {
          targetClip = 'Walking_A';
        } else if (c.currentState === 'AT_PANTRY' || c.currentState === 'INSPECTING_SCREEN') {
          targetClip = 'Interact';
        } else if (c.currentState === 'AT_LOUNGE') {
          targetClip = 'Sit_Floor_Idle';
        } else if (c.currentState === 'SLEEPING') {
          targetClip = 'Lie_Idle';
        } else if (c.currentState === 'CELEBRATING' || c.currentState === 'STRETCHING') {
          targetClip = 'Cheer';
        } else if (c.currentState === 'CHATTING') {
          targetClip = 'Idle';
        }

        if (ctrl.currentClipName !== targetClip) {
          const nextAction =
            ctrl.actions.get(targetClip) ||
            ctrl.actions.get('Walking_A') ||
            ctrl.actions.get('Idle') ||
            ctrl.actions.get('Sit_Chair_Idle');

          if (nextAction && nextAction !== ctrl.currentAction) {
            if (ctrl.currentAction) {
              ctrl.currentAction.fadeOut(0.2);
            }
            nextAction.reset().fadeIn(0.2).play();
            ctrl.currentAction = nextAction;
            ctrl.currentClipName = targetClip;
          }
        }
      });

      // Camera lerp
      currentCameraState.current = stepCameraInterpolation(
        currentCameraState.current,
        desiredCameraState.current,
        0.08
      );
      const camPos = computeCameraPosition(currentCameraState.current);
      camera.position.set(camPos[0], camPos[1], camPos[2]);
      camera.lookAt(
        currentCameraState.current.target[0],
        currentCameraState.current.target[1],
        currentCameraState.current.target[2]
      );

      // Autonomous Movement step with obstacle collision resolution
      const moveResult = stepCrewMovement(
        crewStateRef.current,
        deltaSec,
        time,
        campusObstaclesRef.current
      );
      crewStateRef.current = moveResult.updatedCrew;
      if (moveResult.arrivedLogs.length > 0) {
        setActivityLogs((prev) => [...moveResult.arrivedLogs, ...prev.slice(0, 40)]);
      }

      // Random Decision timer (~every 3.5s across all rooms)
      decisionTimer += deltaMs;
      if (decisionTimer > 3500) {
        decisionTimer = 0;
        const decResult = evaluateRandomDecisions(crewStateRef.current, time, roomsRef.current);
        crewStateRef.current = decResult.updatedCrew;
        if (decResult.decisionLogs.length > 0) {
          setActivityLogs((prev) => [...decResult.decisionLogs, ...prev.slice(0, 40)]);
        }
      }

      // Dialogue & Thought Bubbles timer (~every 4s)
      dialogueTimer += deltaMs;
      if (dialogueTimer > 4000) {
        dialogueTimer = 0;
        crewStateRef.current = evaluateAutonomousBubbles(crewStateRef.current, time);
      }

      // Clean expired bubbles
      crewStateRef.current = updateBubbleExpirations(crewStateRef.current, time);

      // Sync 3D Mesh positions
      syncCrewMeshes(crewStateRef.current, crewMeshMapRef.current);

      // Update projected bubbles for 2D HTML overlay
      const active = crewStateRef.current
        .map((c) => c.activeChatBubble)
        .filter((b): b is ChatBubbleData => Boolean(b));
      setActiveBubbles(active);

      // Render Scene
      renderer.render(assembled.scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [webglSupported, projects]);

  // Pointer Drag Handlers (Supports 360° Orbit & Ground-Plane Drag Pan)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    previousPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - previousPointer.current.x;
    const dy = e.clientY - previousPointer.current.y;
    previousPointer.current = { x: e.clientX, y: e.clientY };

    // Free Drag-to-Pan (Default) vs 360° Orbit Mode
    if (controlMode === 'pan') {
      if (e.buttons === 2 || e.shiftKey || e.altKey) {
        // Orbit rotation on right-click / shift-drag
        const speed = 0.006;
        desiredCameraState.current.orbitAngleHorizontal -= dx * speed;
        desiredCameraState.current.orbitAngleVertical = Math.max(
          Math.PI / 8, // ~22° min
          Math.min(Math.PI / 3, desiredCameraState.current.orbitAngleVertical + dy * speed) // ~60° max
        );
      } else {
        // Primary Free Ground Drag Pan
        desiredCameraState.current = applyCameraPan(
          desiredCameraState.current,
          dx,
          dy,
          0.055
        );
      }
    } else {
      if (e.buttons === 2 || e.shiftKey || e.altKey) {
        // Pan on secondary drag
        desiredCameraState.current = applyCameraPan(
          desiredCameraState.current,
          dx,
          dy,
          0.055
        );
      } else {
        // Primary Orbit rotation
        const speed = 0.006;
        desiredCameraState.current.orbitAngleHorizontal -= dx * speed;
        desiredCameraState.current.orbitAngleVertical = Math.max(
          Math.PI / 8, // ~22° min
          Math.min(Math.PI / 3, desiredCameraState.current.orbitAngleVertical + dy * speed) // ~60° max
        );
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  // Cursor-directed wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.04;
    desiredCameraState.current = applyPointerZoom(
      desiredCameraState.current,
      zoomDelta,
      14,
      85
    );
  };

  // Helper to project 3D coordinates to Screen %
  const projectToScreen = (worldPos: [number, number, number]) => {
    if (!cameraRef.current || !containerRef.current) return { left: '50%', top: '50%', visible: false };
    const vec = new THREE.Vector3(worldPos[0], worldPos[1], worldPos[2]);
    vec.project(cameraRef.current);

    // If point is behind camera, hide it
    if (vec.z > 1) return { left: '-999px', top: '-999px', visible: false };

    const x = (vec.x * 0.5 + 0.5) * 100;
    const y = (-(vec.y * 0.5) + 0.5) * 100;
    return { left: `${x}%`, top: `${y}%`, visible: true };
  };

  // WebGL Fallback View
  if (!webglSupported) {
    return (
      <div className="p-8 rounded-3xl border border-stone-800 bg-stone-900 text-center space-y-4">
        <Building2 className="w-12 h-12 text-cyan-400 mx-auto" />
        <h3 className="text-xl font-bold text-stone-100">
          Akselerasi Grafis 3D (WebGL) Tidak Tersedia
        </h3>
        <p className="text-xs text-stone-300 max-w-md mx-auto">
          Perangkat Anda belum mengaktifkan akselerasi hardware WebGL. Silakan buka halaman ini menggunakan browser modern dengan hardware acceleration aktif untuk menikmati visualisasi 3D Kampus SleepyKoala Studio.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-3xl border border-stone-800 bg-slate-950 overflow-hidden select-none ${className}`}
      style={{ minHeight: '620px' }}
      data-testid="three-campus-canvas-container"
      onContextMenu={(e) => e.preventDefault()} // prevent default right-click context menu so right-drag pan is smooth
    >
      {/* 1. Interactive 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-[620px] block cursor-grab active:cursor-grabbing touch-none"
        data-testid="three-campus-canvas"
      />

      {/* 2. Top Room Navigator Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto bg-stone-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800 shadow-xl max-w-full overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectRoom(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              !selectedRoomId
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-xs'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pemandangan Kampus (Overview)</span>
          </button>

          {initialRooms.map((r) => {
            const isSelected = selectedRoomId === r.roomId;
            return (
              <button
                key={r.roomId}
                type="button"
                onClick={() => handleSelectRoom(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-xs'
                    : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <span>{r.projectName}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode (Orbit vs Pan), Zoom, and Reset Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-stone-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800 shadow-xl">
          {/* Mode Switcher: Orbit vs Pan */}
          <button
            type="button"
            onClick={() => setControlMode((prev) => (prev === 'orbit' ? 'pan' : 'orbit'))}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              controlMode === 'pan'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-xs'
                : 'bg-stone-950 text-stone-300 hover:text-stone-100 border border-stone-800'
            }`}
            title={
              controlMode === 'pan'
                ? 'Mode Geser (Pan) Aktif — Geser layar/klik tarik untuk menggeser posisi kamera'
                : 'Mode Putar (Orbit) Aktif — Klik tarik untuk memutar sudut pandang 360°'
            }
          >
            {controlMode === 'pan' ? (
              <>
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Geser (Pan)</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Putar (Orbit)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              desiredCameraState.current = applyPointerZoom(desiredCameraState.current, -10);
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Zoom In"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              desiredCameraState.current = applyPointerZoom(desiredCameraState.current, 10);
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Zoom Out"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleSelectRoom(null)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Reset Sudut Pandang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Floating 3D Chat Bubbles (Projected Over Canvas) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {activeBubbles.map((bubble) => {
          const screenPos = projectToScreen(bubble.worldPos);
          if (!screenPos.visible) return null;

          return (
            <div
              key={bubble.id}
              className="absolute -translate-x-1/2 -translate-y-full transition-all duration-200 pointer-events-none"
              style={{ left: screenPos.left, top: screenPos.top }}
            >
              <div className="px-3 py-1.5 rounded-2xl border border-stone-700/80 bg-stone-900/95 backdrop-blur-md text-stone-100 shadow-2xl text-[11px] font-medium max-w-[220px] text-center animate-bounce">
                <span className="text-[10px] text-cyan-400 font-bold block truncate">
                  {bubble.speakerName}
                </span>
                <span className="leading-tight block">{bubble.text}</span>
              </div>
              <div className="w-2 h-2 bg-stone-900 border-r border-b border-stone-700/80 rotate-45 mx-auto -mt-1" />
            </div>
          );
        })}
      </div>

      {/* 4. Project Room Focus Drawer (Displays when a Room is Selected) */}
      {activeRoom && (
        <div className="absolute right-4 bottom-4 top-20 z-20 w-80 max-w-[90vw] pointer-events-auto">
          <div className="h-full rounded-3xl border border-stone-800 bg-stone-900/95 backdrop-blur-lg shadow-2xl p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                    {activeRoom.category}
                  </span>
                  <h4 className="text-base font-bold text-stone-100">
                    {activeRoom.projectName}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectRoom(null)}
                  className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-xs font-mono"
                  title="Kembali ke tampilan penuh kampus"
                >
                  ✕ Zoom Out
                </button>
              </div>

              {/* In Room Crew */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>Di Meja Kerja ({activeRoomCrew.inside.length}):</span>
                </div>
                <div className="space-y-1.5">
                  {activeRoomCrew.inside.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-stone-200 block">{c.name}</span>
                        <span className="text-[10px] text-stone-400">{c.deskItem}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        {c.isSleeping ? '💤 Zz' : 'Fokus'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Crew */}
              {activeRoomCrew.away.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Sedang Keluar ({activeRoomCrew.away.length}):</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeRoomCrew.away.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs space-y-0.5"
                      >
                        <span className="font-semibold text-amber-200 block">{c.name}</span>
                        <p className="text-[11px] text-stone-300">{c.currentActivityLog}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Room Footer Action */}
            <div className="pt-3 border-t border-stone-800 space-y-2">
              <Link
                to={`/projects/${activeRoom.projectSlug}`}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Halaman Detail {activeRoom.projectName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom Interactive Command Console Bar */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[480px] z-20 pointer-events-auto">
        <VisitorCommandConsole
          onExecuteCommand={handleExecuteCommand}
          lastFeedback={lastFeedback}
          focusedProjectName={activeRoom?.projectName || null}
        />
      </div>
    </div>
  );
};
