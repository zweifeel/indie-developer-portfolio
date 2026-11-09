# SLEEPYKOALA STUDIO — MILESTONE B3.4 REPORT
## LEMBUR-INSPIRED ISOMETRIC CAMERA & HUMAN CHARACTER ASSET RESEARCH
### High-Angle Axonometric 3/4 Bird's-Eye Camera & Verified Free Human Coworker Assets

**Project:** SleepyKoala Studio — Indie Developer Portfolio  
**Milestone:** B3.4 — Visual Direction Correction & Research  
**Primary Visual Reference:** [Lembur.id](https://lembur.id/) & [Klasik Office Map](https://lembur.id/gambar/tema/klasik.webp)  
**Primary Character Asset:** [Modern Citizens — Top-Down Animated Characters (nacl1234)](https://nacl1234.itch.io/modern-citizens-top-down-animated-characters)  
**Secondary Asset Benchmark:** [Office Pixel Art (Imersa Studios)](https://imersastudios.itch.io/office-pixel-art)  
**Status:** Inspection, Asset Acquisition, Spatial Prototype, and Verification Completed  
**Verification:** Vitest (28 test files, 509 tests passed 100%), TypeScript (0 errors), Oxlint (0 errors), Production Build (Clean), Secret Scanner (0 findings)

---

## 1. LEMBUR.ID CAMERA AND SPATIAL ANALYSIS

Visual inspection and spatial reverse-engineering of `https://lembur.id/gambar/tema/klasik.webp` (1000×782px) identified the core architectural principles that define its polished visual presentation:

1. **True High-Angle Dimetric / Axonometric Projection (2:1 Ratio):**
   - The camera is elevated high above the office floor, looking diagonally down across the whole floor plan.
   - Floor grid lines run along $26.56^\circ$ angles (2 horizontal pixels for every 1 vertical pixel).
   - This axonometric angle guarantees that rectangular rooms appear as coherent 2:1 diamonds without vertical convergence distortion.

2. **Cutaway Architectural Walls:**
   - The back walls (Northwest and Northeast) are rendered with full architectural height (approx 48–64px tall), displaying windows, whiteboards, studio branding, and wall-mounted telemetry dashboards.
   - The front and side boundaries (Southwest and Southeast) are cut down to ground level or rendered as low glass partitions with steel stanchions.
   - This eliminates visual occlusion: visitors can see directly into every workstation, chair, and floor detail.

3. **Unified Spatial Projection across All Objects:**
   - Desks are not flat rectangles: desk surfaces are $2:1$ isometric parallelograms, and vertical desk legs drop straight down ($90^\circ$).
   - Dual/triple monitors are angled to face the workstation chairs.
   - Chairs are tucked beneath the desks, correctly occluded by the desk surfaces.
   - Potted monstera plants, coffee bars, and filing cabinets all share the exact same $30^\circ / 2:1$ projection.

4. **Character Scale and Perspective:**
   - Characters are **not** huge portrait avatars or front-facing cards.
   - Characters are scaled proportionally to furniture (approx 38–48px tall), placed directly inside the rooms.
   - Characters are viewed from an elevated 3/4 perspective: top of the head is rounded and visible, shoulders slope downward, torsos are foreshortened, and feet are anchored firmly on the floor tiles.

---

## 2. CAMERA IMPLEMENTATION PROPOSAL FOR SLEEPYKOALA

To replace the disapproved B3.1 presentation (which looked like flat billboard cutouts standing in front of a diamond grid), SleepyKoala Virtual HQ adopts a two-tier camera architecture:

### A. Core Mathematical Structure
- **Global Coordinate Space:** $1920 \times 1080$ continuous SVG canvas.
- **Isometric Transformation:**
  $$\begin{cases} X_{\text{screen}} = X_0 + (u - v) \times \frac{W_{\text{tile}}}{2} \\ Y_{\text{screen}} = Y_0 + (u + v) \times \frac{H_{\text{tile}}}{2} \end{cases}$$
  where $W_{\text{tile}} = 64\text{px}$ and $H_{\text{tile}} = 32\text{px}$ ($2:1$ dimetric ratio).
- **Z-Sorting & Anchoring:**
  Every prop and character has a defined foot anchor $(X_a, Y_a)$ where $Y_a$ dictates rendering order ($z$-index). Objects with larger $Y_a$ render in front of objects with smaller $Y_a$.

### B. Two-Tier Cinematic Camera
1. **Full HQ Campus Overview (`OVERVIEW`):**
   - Viewport: $X: 0, Y: 0, W: 1920, H: 1080$.
   - Shows the entire interconnected campus: Grand Reception, Central Collaboration Plaza, Executive Boardroom, DompetNalar Suite, and IDLE MASTER Studio simultaneously.
2. **Workspace Focus (`DOMPETNALAR`, `IDLE_MASTER`, `PLAZA`, `BOARDROOM`):**
   - Viewport: $W: 760 \dots 900, H: 480 \dots 560$ centered on the chosen room.
   - Smooth pan and zoom ($0.55\text{s}$ cubic-bezier transition).
   - **Crucial Context Preservation:** Corridors and neighboring rooms remain visible in the peripheral frame, reinforcing that the visitor has entered a real room in a unified building.

---

## 3. CANDIDATE ASSET COMPARISON

| Criteria | Candidate 1: Modern Citizens (nacl1234) | Candidate 2: Office Pixel Art (Imersa Studios) | Candidate 3: OpenGameArt / Generic |
|---|---|---|---|
| **Perspective** | **High top-down 3/4 view** (Matches high-angle camera) | Top-down 3/4 orthographic (0° horizontal walls) | Mixed / Orthographic front-facing |
| **Character Scale** | **128×128px cell, character height ~85-100px** (scales cleanly to 48px) | 32×32px pixel art | Variable (16px to 64px) |
| **Available Free Characters** | **6 distinct characters** across Part 1.1 & Part 1.2 free samples | **Only 1 character** in free tier ($0) | Often only 1-2 characters per author |
| **5 Roles Availability** | **100% Covered** without payment | Fails: 5 characters requires paid tier ($9.99) | Inconsistent styles across artists |
| **Animations Available** | **8-frame walk in 4 directions** + standing frames per direction | 4-frame idle + 4-frame walk in 4 directions | Often static only |
| **Commercial License** | **Permissive Commercial License** (Modify, recolor, combine freely) | Free tier requires attribution; paid tiers exist | Mixed / Variable CC licenses |
| **Zero-Cost Compliance** | **$0.00 / Rp0 (100% Free Sample)** | Paid tiers violate strict $0 rule | Variable |
| **Evaluation Verdict** | **SELECTED AS PRIMARY CANDIDATE** | **Reference/Benchmark Only** | **Disqualified** |

---

## 4. VERIFIED ASSET PACK DETAILS & 5 CORE ROLES MAPPING

From `Modern Citizens — Top-Down Animated Characters` (Part 1.1 and Part 1.2 free samples), exactly 5 adult human coworkers were assigned to the canonical SleepyKoala roles:

| Role | Character ID | Visual Profile & Office Attire | Assigned Workspace | State & Task |
|---|---|---|---|---|
| **1. Planner** | `char_citizens_office_m_b` | Adult male, white collared dress shirt, dark navy slacks, neat brown hair. | `dompetnalar` | Memetakan model cashflow runway & validasi compliance Google Play. |
| **2. Developer** | `char_citizens_casual_f_b` | Adult female, orange tech hoodie, beige slacks, dark hair bun. | `idle-master` | Menyeimbangkan formula kalkulasi idle income offline tick. |
| **3. Tester** | `char_citizens_teen_f_a` | Young female QA specialist, active purple jacket, dark slacks, ponytail. | `idle-master` | Playtest benchmark 60 FPS pada 8 variasi resolusi layar Android. |
| **4. Reviewer** | `char_citizens_office_f_c` | Senior female reviewer, corporate teal blouse, black pencil skirt. | `dompetnalar` | Auditing offline SQLite encryption & PIN biometric vault. |
| **5. Publisher** | `char_citizens_elder_m_a` | Executive release lead, formal gray business suit, spectacles, walking cane. | `boardroom` | Review rilis closed testing 14 hari & verifikasi app-ads.txt. |
| *(Bonus) Receptionist* | `char_citizens_teen_m_a` | Studio coordinator & greeter, green collared shirt, jeans. | `reception` | Menerima tamu & mengoordinasikan jadwal rapat tim proyek. |

### Technical Specifications
- **Frame Dimensions:** $128 \times 128\text{px}$ per frame with transparent alpha background.
- **Anchor Point:** Exact bottom-center $(64, 124)$ where the feet touch the ground.
- **Sprite Sheet Layout:** $1024 \times 512\text{px}$ regular 8-column grid.
  - Row 0: `walk_down` (8 frames)
  - Row 1: `walk_up` (8 frames)
  - Row 2: `walk_side` (8 frames - faces right; mirrored for left)
  - Row 3: `stand` (3 frames: down, up, side)
- **Local Storage Path:** `public/assets/virtual-office/characters/modern-citizens/` (Zero external hotlinks).

---

## 5. LICENSE VERIFICATION & STRICT ZERO-COST COMPLIANCE

The license for `Modern Citizens` was extracted directly from `Documentation/LICENSE.txt` inside the official itch.io distribution:

```text
TOPDOWN-MODERN-CHAR-CITIZENS-PART1-1 v1.0 - License

You may:
- Use these assets in personal and commercial projects (games, prototypes, game jams, videos of your game, marketing for your game).
- Modify, recolor, crop, combine and build on the assets.
- Use them in any number of projects.

You may not:
- Resell, re-upload or redistribute the assets as-is or with minor changes, on their own or as part of another asset pack, template or bundle.
- Claim the original assets as your own artwork.

Attribution is not required but is appreciated.
```

- **Cost:** **$0.00 / Rp0**. Downloaded from the free sample tier. No subscription, no paid tier, no trial.
- **Documentation:** Formally credited and logged in [`public/assets/virtual-office/ASSET_CREDITS.md`](file:///E:/Antigravity%20Project/indie-developer-portfolio/public/assets/virtual-office/ASSET_CREDITS.md).

---

## 6. PROTOTYPE IMPLEMENTATION & VISUAL PROOF

A dedicated interactive prototype component was built and integrated:
- Component: [`src/components/virtual-office/LemburIsometricPrototype.tsx`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/components/virtual-office/LemburIsometricPrototype.tsx)
- Integration: [`src/components/virtual-office/PixelVirtualHQ.tsx`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/components/virtual-office/PixelVirtualHQ.tsx)

### Visual Evidence Captured:

1. **Desktop 1440px Overview:**  
   `docs/reports/screenshots/b34-01-desktop-lembur-overview.png`  
   *(Demonstrates the large connected isometric campus with reception, plaza, boardroom, DompetNalar, and IDLE MASTER with human coworkers).*

2. **Camera Zoom — DompetNalar Finance Suite:**  
   `docs/reports/screenshots/b34-02-zoom-dompetnalar-workspace.png`  
   *(Demonstrates high 3/4 camera zoomed into DompetNalar with Budi and Dewi seated at dual-monitor slate desks).*

3. **Camera Zoom — IDLE MASTER Game Studio:**  
   `docs/reports/screenshots/b34-03-zoom-idlemaster-workspace.png`  
   *(Demonstrates high 3/4 camera zoomed into IDLE MASTER with warm parquet flooring, mini arcade cabinet, and coworkers Rian and Siti).*

4. **Side-by-Side Comparison:**  
   `docs/reports/screenshots/b34-04-side-by-side-comparison.png`  
   *(Direct comparison contrasting B3.1 flat front-facing billboard representation vs B3.4 Lembur-inspired 3/4 axonometric camera).*

5. **Mobile Viewport (390px Width):**  
   `docs/reports/screenshots/b34-05-mobile-lembur-prototype.png`  
   *(Demonstrates responsive scaling, touch target accessibility, and active coworker drawer on mobile).*

---

## 7. KNOWN LIMITATIONS & MITIGATIONS

1. **Sitting vs Standing Sprite Variations:**
   - Modern Citizens provides complete 4-direction walk cycles and standing idle frames, but does not include dedicated sitting frames.
   - **Mitigation:** In the prototype, workstations are rendered with high isometric desk surfaces that naturally occlude the lower torso and legs, creating a natural seated appearance at the dual-monitor setups.
2. **Diagonal Walking Paths:**
   - The sprites feature 4 orthogonal walk directions (`down`, `up`, `side`).
   - **Mitigation:** In the isometric campus, corridors are oriented along main axes where side-walking and down-walking align with arterial circulation paths.

---

## 8. RECOMMENDED FINAL IMPLEMENTATION DIRECTION

Based on the research and prototype evaluation, the recommended roadmap forward is:
1. **Adopt Modern Citizens as the Official Digital Coworker Asset Pack:**
   - 100% legal, free commercial license, zero cost.
   - 5 visually distinct adult human coworkers with consistent modern office attire.
   - High top-down 3/4 view matches the high-angle axonometric camera.
2. **Retain the Unified Connected Campus Layout (2400×1400 / 1920×1080):**
   - Retain all shared facilities (Reception, Collaboration Plaza, Boardroom).
   - Retain unique workspace themes for all 6 projects.
   - Continue using hardware-accelerated SVG with CSS viewBox camera transitions (0kB WebGL overhead).

---

## 9. VERIFICATION GATES SUMMARY

- `vitest run`: **28 test files passed | 509 tests passed (100%)**
- `npx tsc -b`: **0 errors**
- `npx oxlint`: **0 errors**
- `npm run build`: **Clean (dist/ bundle succeeded)**
- `npm run scan`: **315 files scanned | 0 secrets / 0 PII leaks**
- **Deployments:** **ZERO executed** (Local prototype only).
- **Git:** **ZERO commits made, ZERO pushed (awaiting user approval)**.
