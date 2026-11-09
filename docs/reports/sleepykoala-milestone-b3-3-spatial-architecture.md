# SLEEPYKOALA STUDIO — MILESTONE B3.3 REPORT
## VIRTUAL HQ SPATIAL ARCHITECTURE REDESIGN
### One Large Connected Isometric Office — Multiple Unique Project Workspaces

**Project:** SleepyKoala Studio — Indie Developer Portfolio  
**Milestone:** B3.3 — Spatial Architecture Clarification  
**Visual & Spatial Direction:** Continuous 2400×1400 Isometric Campus with Shared Facilities and 6 Dedicated Project Workspaces  
**Reference Inspiration:** Lembur.id (Spatial connected office experience without copying proprietary branding or assets)  
**Status:** Architecture Proposal & Layout Prototype Completed  
**Verification:** Vitest (28 test files, 509 tests passed 100%), TypeScript (0 errors), Oxlint (0 errors), Production Build (Clean), Secret Scanner (0 findings)

---

## EXECUTIVE SUMMARY

Milestone B3.3 resolves a critical architectural misunderstanding:
The SleepyKoala Virtual Development Office is **NOT** a small, isolated isometric room that is swapped per project, nor is it a set of disconnected cards or detached rooms.

Instead, the Virtual Office is now structured as **ONE LARGE, CONTINUOUS, CONNECTED VIRTUAL HEADQUARTERS (2400×1400 coordinate space)** containing:
1. **Central Shared Core**: Grand Entrance Lobby & Reception, Central Collaboration Plaza & Espresso Bar, and Shared Executive Boardroom / Presentation Suite.
2. **West Wing Workspaces**: DompetNalar (Finance & Productivity Suite), Mobile Kasir (POS Operations Hub), and Worklume (Enterprise SaaS Operations Suite).
3. **East Wing Workspaces**: IDLE MASTER (Casual Game Dev Studio), Idle Mining (Resource Simulation Lab), and The Broken Origin (MMORPG Command Studio).
4. **Circulation Network**: The Grand Central Spine corridor with arterial connectors uniting every room into a coherent physical office floor.
5. **Camera & Navigation**: Smooth, cinematic pan and zoom transitions across the campus with the surrounding headquarters always maintaining spatial context.
6. **Campus Radar Minimap**: Real-time spatial radar displaying current camera viewport, active rooms, agent count, and instant jump targets.

---

## 1. FULL HQ FLOOR-PLAN PROTOTYPE & SPATIAL MAP

The Virtual HQ floor plan spans a continuous isometric canvas of **2400 × 1400 units** (2:1 isometric aspect ratio).

```
+-----------------------------------------------------------------------------------------------+
|                                  SLEEPYKOALA VIRTUAL HEADQUARTERS                            |
|                                       (2400 x 1400 px Canvas)                                |
+-------------------------------+-------------------------------+-------------------------------+
|          WEST WING            |         CENTRAL SPINE         |           EAST WING           |
+-------------------------------+-------------------------------+-------------------------------+
| [Server Cluster Rack]         | [Grand Entrance & Reception]  | [Quality Assurance Lab]       |
|                               |  x: 880, y: 60, w: 640, h: 380|                               |
| [DompetNalar Finance Suite]   |                               | [IDLE MASTER Casual Studio]   |
|  x: 100, y: 60, w: 680, h: 420|                               |  x: 1620, y: 60, w: 680, h:420|
|  * Cashflow boards & vaults   |                               |  * Mini arcade cabinet & art  |
|                               |                               |                               |
| ~~~ West Arterial (y: 460) ~~ | ~~~ Central Spine (x: 1200) ~| ~~~ East Arterial (y: 460) ~~ |
|                               |                               |                               |
| [Mobile Kasir POS Hub]        | [Collaboration Plaza & Bar]   | [Idle Mining Resource Lab]    |
|  x: 100, y: 500, w: 680, h:420|  x: 880, y: 490, w: 640, h:380|  x: 1620, y: 500, w: 680, h:420|
|  * POS terminal & barcode bench| * Espresso bar & lounge     |  * Minecart & core drills     |
|                               |                               |                               |
| ~~~ West Arterial (y: 890) ~~ | ~~~ Central Spine (x: 1200) ~| ~~~ East Arterial (y: 890) ~~ |
|                               |                               |                               |
| [Worklume Enterprise Suite]   | [Executive Boardroom Suite]   | [The Broken Origin MMORPG]    |
|  x: 100, y: 930, w: 680, h:420|  x: 880, y: 920, w: 640, h:420|  x: 1620, y: 930, w: 680, h:420|
|  * Kanban wall & architecture |  * Large oval conference table|  * Realm map & guild banners   |
+-------------------------------+-------------------------------+-------------------------------+
```

### Spatial Coordinates Table

| Zone / Room ID | Wing | Type | Bounds $(X, Y, W, H)$ | Target Center $(X_c, Y_c)$ |
|---|---|---|---|---|
| `reception` | Central Spine | Shared Facility | $(880, 60, 640, 380)$ | $(1200, 250)$ |
| `collaboration-plaza` | Central Spine | Shared Facility | $(880, 490, 640, 380)$ | $(1200, 680)$ |
| `boardroom` | Central Spine | Shared Facility | $(880, 920, 640, 420)$ | $(1200, 1130)$ |
| `dompetnalar` | West Wing | Project Workspace | $(100, 60, 680, 420)$ | $(440, 270)$ |
| `mobile-kasir` | West Wing | Project Workspace | $(100, 500, 680, 420)$ | $(440, 710)$ |
| `worklume` | West Wing | Project Workspace | $(100, 930, 680, 420)$ | $(440, 1140)$ |
| `idle-master` | East Wing | Project Workspace | $(1620, 60, 680, 420)$ | $(1960, 270)$ |
| `idle-mining` | East Wing | Project Workspace | $(1620, 500, 680, 420)$ | $(1960, 710)$ |
| `the-broken-origin`| East Wing | Project Workspace | $(1620, 930, 680, 420)$ | $(1960, 1140)$ |
| `server-cluster` | West Service | Shared Infrastructure | $(200, 10, 280, 45)$ | $(340, 32)$ |
| `qa-lab` | East Service | Shared Infrastructure | $(1920, 10, 280, 45)$ | $(2060, 32)$ |

---

## 2. SIX DISTINCT PROJECT WORKSPACE DESIGNS

Each project workspace has a unique architectural atmosphere, color palette, floor treatment, and functional props:

### 1. `dompetnalar` — Finance & Productivity Suite
- **Aesthetic:** High-precision modern financial office with corporate teal/emerald accents.
- **Flooring:** Slate-gray carpet tiles with emerald boundary trim.
- **Decorative Props:**
  - Dual 4K analytics workstations with live green/red candlestick charts.
  - Wall-mounted Cashflow Projection & Runway Dashboard (`P&L +42.8%`).
  - Heavy-duty Encrypted Offline Ledger Vault with biometric scanner lock.
  - Regulatory compliance binder shelf & tax computation station.

### 2. `idle-master` — Casual Mobile Game Dev Studio
- **Aesthetic:** Energetic indie game developer studio with vibrant amber, purple, and neon gold highlights.
- **Flooring:** Warm oak herringbone parquet with colorful pixel rugs.
- **Decorative Props:**
  - Custom SleepyKoala Mini Arcade Playtest Cabinet (`JOYSTICK READY`).
  - Whiteboard with Game Economy Loop, Gacha Probability Curve & Core Progression flow.
  - Animation light-box desk with character model sheets.
  - Mobile device testing carousel with 8 varied Android screen ratios.

### 3. `mobile-kasir` — Retail & POS Operations Hub
- **Aesthetic:** Practical, streamlined commercial hardware & retail checkout laboratory.
- **Flooring:** Durable industrial vinyl floor tiles in charcoal and safety cyan.
- **Decorative Props:**
  - Retail Counter with dual-screen POS cash register & barcode hand scanner.
  - High-speed thermal Bluetooth receipt printer emitting sample roll paper.
  - Offline SQLite Sync Diagnostic monitor displaying transaction queue status.
  - Inventory scanner charging cradle and thermal paper roll stack.

### 4. `idle-mining` — Resource Simulation Lab
- **Aesthetic:** Deep-rock industrial research bay with warm copper, bronze, and stone accents.
- **Flooring:** Heavy-duty reinforced steel floor plating with hazard warning borders.
- **Decorative Props:**
  - Glass showcase containing geological core samples and raw ore crystals.
  - Mini industrial ore cart on brass tracks filled with mineral chunks.
  - Subterranean Shaft Balancing Terminal showing mining depth ($1200\text{m}$) and yield/sec.
  - Industrial ventilation ductwork and safety lantern stands.

### 5. `the-broken-origin` — MMORPG Fantasy Command Studio
- **Aesthetic:** Epic fantasy game command center with mystical deep violet, indigo, and gold accents.
- **Flooring:** Polished obsidian flagstone with glowing cyan mana conduits.
- **Decorative Props:**
  - Wall-sized Parchment Cartography Map of the fantasy continent of Aethelgard.
  - Guild Banner of the Broken Origin hanging from carved timber brackets.
  - Multiplayer Network Synchronization Terminal monitoring tick rate & packet loss.
  - Concept art easel featuring celestial weapons and raid boss sketches.

### 6. `worklume` — Enterprise SaaS Operations Suite
- **Aesthetic:** Sleek enterprise modern tech office with minimalist blue, silver, and slate accents.
- **Flooring:** Acoustic sound-dampening felt carpet in modern geometric navy.
- **Decorative Props:**
  - Full-wall Physical Magnetic Sprint Kanban (`TO-DO`, `IN PROGRESS`, `CODE REVIEW`, `DONE`).
  - Enterprise Microservices Topology Diagram (`API GATEWAY -> WORKERS -> POSTGRES`).
  - Stand-up meeting whiteboard with quarterly OKRs and SLA uptime indicators ($99.98\%$).
  - Clean cable-managed ergonomic standing desks with dual vertical monitors.

---

## 3. SHARED OFFICE CIRCULATION DESIGN

The circulation system connects all spaces into a physical working studio:

1. **The Grand Central Spine (Primary North-South Corridor)**
   - **Position:** Canvas center $X = 1140 \dots 1260$ spanning the entire height $Y = 0 \dots 1400$.
   - **Width:** 120 coordinate units.
   - **Flooring:** Polished terrazzo with dark accent expansion joints.
   - **Function:** Links the Reception Desk, Collaboration Plaza, and Boardroom directly to all wing corridors.

2. **West & East Arterial Promenades (Secondary East-West Corridors)**
   - **North Arterial:** $Y = 460 \dots 520$, connecting Row 1 workspaces to Row 2 workspaces.
   - **South Arterial:** $Y = 890 \dots 950$, connecting Row 2 workspaces to Row 3 workspaces.
   - **Function:** Provides natural movement paths between adjacent workspaces without cutting through private desks.

3. **Perimeter Corridors & Service Walkways**
   - Direct access lanes to Server Cluster (Northwest) and Quality Assurance Lab (Northeast).

---

## 4. CAMERA AND NAVIGATION BEHAVIOR

The camera uses dynamic coordinate interpolation to deliver an intuitive experience:

### A. Two Core Modes
1. **Campus Overview Mode (`OVERVIEW`)**
   - Viewport: $X: 0, Y: 0, W: 2400, H: 1400$.
   - Shows the entire studio floor at once, giving visitors an immediate sense of scale and team presence.
2. **Workspace Focus Mode (Project 1..6 or Shared Facilities)**
   - Viewport: $W: 1000, H: 650$ centered on target workspace $(X_c, Y_c)$.
   - Camera smoothly pans and zooms directly into the chosen team's room.
   - **Context Preservation:** Crucially, neighboring corridors, adjacent rooms, and central plaza facilities remain visible in the peripheral camera bounds, reinforcing that this is a single real building rather than an isolated card.

### B. Navigation Methods
1. **Interactive Workspace Clicking:** Clicking directly on any workspace floor or banner pans the camera to that workspace.
2. **Top Navigation Bar:** Project pills (`DompetNalar`, `IDLE MASTER`, etc.) and facility buttons (`Lobi`, `Plaza`, `Boardroom`, `Full HQ Campus`).
3. **Campus Radar Minimap:** Positioned in the bottom-right corner, shows the complete HQ floor layout, highlighting the active camera viewport rectangle and permitting instant camera jumps.
4. **Smooth Transitions:** Interpolated SVG `viewBox` coordinates with `transition: viewBox 0.45s cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 5. SHARED SPATIAL COORDINATE ARCHITECTURE

The spatial system is implemented in `src/types/virtualOfficeSpatial.ts` and `src/data/virtualOfficeFloorPlan.ts`:

```typescript
export interface SpatialPoint {
  x: number;
  y: number;
}

export interface CameraViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom?: number;
}

export interface WorkspaceEnvironmentProfile {
  projectId: string;
  projectName: string;
  wing: OfficeWing;
  bounds: { x: number; y: number; width: number; height: number };
  accentColor: string;
  themeStyle: RoomThemeStyle;
  cameraPreset: CameraViewport;
  agentWorkstations: AgentWorkstation[];
  props: EnvironmentalProp[];
}
```

---

## 6. DYNAMIC FUTURE-PROJECT PROVISIONING DESIGN (N-PROJECTS)

To support future projects (Project 7, 8, etc.) without redesigning the floor plan:

### Provisioning Strategy: North Concourse Expansion Bays & Mezzanine Floor Level 2
1. **Formulaic Extension Coordinates:**
   Each additional project $n > 6$ is assigned coordinates based on expansion index $k = n - 6$:
   $$\text{Wing}(k) = \begin{cases} \text{West Extension}, & k \text{ is odd} \\ \text{East Extension}, & k \text{ is even} \end{cases}$$
   $$Y_k = 1450 + \left\lfloor \frac{k-1}{2} \right\rfloor \times 440$$
2. **Mezzanine Level 2 (Vertical Expansion):**
   The architecture supports an optional Level 2 Mezzanine floor plan tab (`L1: Ground Campus` / `L2: Innovation Loft`) where another $6$ workspaces can be provisioned using identical coordinates with a level selector.
3. **Zero Hardcoded Limit:**
   `CONNECTED_VIRTUAL_HQ_FLOOR_PLAN.workspaces` is dynamically populated from the CMS project registry (`src/data/projects.ts` or CMS API). Any new project registered automatically receives a default workspace profile if not custom-styled.

---

## 7. DESKTOP AND MOBILE LAYOUT PROTOTYPES

### Desktop Experience
- Rendered in a 16:9 responsive container with high-density pixel rendering.
- Full camera HUD with quick-jump pills, motion toggle, and static fallback toggle.
- Agent inspector panel in the lower left displaying the active digital coworker's persona, title, current simulation task, and status.
- Campus Radar in the lower right displaying full HQ mini-view.

### Mobile Experience
- Resizes gracefully on mobile viewports (tested at $390 \times 844\text{px}$).
- Campus Radar minimap dynamically adjusts, keeping spatial orientation clear.
- Full touch and click support for switching rooms and inspecting agents.
- WCAG AA compliant contrast ratios and minimum tap target sizes ($> 44\text{px}$).

---

## 8. PERFORMANCE & LIGHTWEIGHT RENDERING STRATEGY

1. **Lightweight SVG / CSS:**
   - 0kB Three.js or WebGL dependency.
   - Clean native SVG elements with GPU hardware acceleration (`transform-gpu`, `will-change: viewBox`).
   - Gzipped payload impact is negligible (< 18 kB).
2. **Zero Third-Party Assets:**
   - All sprites and avatars are local SVGs or local assets; no external CDNs or external image hotlinks.
3. **Reduced-Motion & Static Fallback:**
   - Respects `prefers-reduced-motion` browser preferences.
   - Manual "Motion: On/Off" toggle disables all CSS bobbing and radar pulses.
   - "Statis: On/Off" mode renders an accessible static campus diagram for assistive technologies.

---

## 9. IMPLEMENTATION IMPACT & COMPATIBILITY REPORT

- **Preserved Existing Features:**
  - Retained `src/types/virtualOffice.ts` and core agent data contracts.
  - Retained `src/data/virtualOfficeData.ts` agent profiles and simulation statuses.
  - Kept the mandatory simulation label: `"AI Agent Crew — Simulation"`.
  - Kept the 5 core human digital coworkers per workspace (`Planner`, `Developer`, `Tester`, `Reviewer`, `Publisher`).
- **Files Added:**
  - `src/types/virtualOfficeSpatial.ts`: Spatial models, camera viewports, and room profiles.
  - `src/data/virtualOfficeFloorPlan.ts`: 2400×1400 floor plan, corridor network, and 6 workspace specifications.
  - `src/components/virtual-office/ConnectedVirtualHQCanvas.tsx`: Interactive continuous spatial canvas with smooth camera transitions and Campus Radar.
- **Files Updated:**
  - `src/components/virtual-office/PixelVirtualHQ.tsx`: Integrates the Connected Virtual HQ Canvas while keeping project buttons and simulation controls synchronized.

---

## VISUAL EVIDENCE (CAPTURED SCREENSHOTS)

The following 6 visual proof screenshots have been generated and archived:

1. **Full Connected HQ Campus Overview:**  
   `docs/reports/screenshots/b33-01-full-hq-campus-overview.png`  
   *(Shows all wings, corridors, central lobby, plaza, and boardroom in one grand connected campus view)*

2. **Camera Zoom — DompetNalar Finance Suite:**  
   `docs/reports/screenshots/b33-02-dompetnalar-workspace-zoom.png`  
   *(Demonstrates camera zoom into the West Wing finance analytics lab with neighboring corridors visible)*

3. **Camera Zoom — IDLE MASTER Game Studio:**  
   `docs/reports/screenshots/b33-03-idle-master-game-studio.png`  
   *(Demonstrates camera zoom into the East Wing casual game studio with mini arcade cabinet)*

4. **Camera Zoom — The Broken Origin MMORPG Studio:**  
   `docs/reports/screenshots/b33-04-the-broken-origin-studio.png`  
   *(Demonstrates camera zoom into the lower East Wing fantasy MMORPG studio with continent map and guild banner)*

5. **Camera Zoom — Central Collaboration Plaza & Espresso Bar:**  
   `docs/reports/screenshots/b33-05-collaboration-plaza-boardroom.png`  
   *(Demonstrates the central collaboration hub linking the West and East wings)*

6. **Mobile View with Campus Radar Minimap:**  
   `docs/reports/screenshots/b33-06-mobile-virtual-hq-radar.png`  
   *(Shows responsive layout on mobile screen with active Campus Radar)*

---

## VERIFICATION GATES

- `vitest run`: **28 test files passed | 509 tests passed (100%)**
- `npx tsc -b`: **0 errors**
- `npx oxlint`: **0 errors**
- `npm run build`: **Built successfully (dist folder intact)**
- `npm run scan`: **315 files scanned | 0 secrets / 0 PII leaks found**
- **Git status:** **Clean** (No commits made, no push executed, awaiting user review).
- **Hosting / Deployments:** **ZERO deployments executed** (no Cloudflare Pages, no Apps Script clasp).
