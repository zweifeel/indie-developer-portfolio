# SLEEPYKOALA MILESTONE B3.4.4 — ASSET CREDITS & PRODUCTION INVENTORY

**Project:** SleepyKoala Studio — Indie Developer Portfolio  
**Milestone:** B3.4.4 (Free Asset Acquisition, Animated Characters & Production Virtual HQ Rebuild)  
**Total Financial Cost:** $0.00 / Rp 0 (100% Free, Permissive Commercial Licenses)  
**External Dependencies:** Zero external hotlinks (All files locally hosted within `/public/assets/virtual-office/b344/`)  
**Production Status:** Production Virtual HQ Live Environment Integration

---

## 1. ACQUIRED & VERIFIED ASSET PACKS

### Candidate A1: ThirdAngle Isometric Office Starter
- **Creator / Publisher:** Playworks North / ThirdAngle
- **Source URL:** https://thirdangle.itch.io/office-starter
- **License:** Permissive Free Commercial License (`public/assets/virtual-office/b344/licenses/ThirdAngle_README_License.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Grid Projection:** True 2:1 Dimetric / Axonometric Isometric ($64 \times 32\text{ px}$ footprint, bottom anchor $y=59$)
- **Usage in Production:** Floor tiles (`floor_office_carpet_tile.png`), perimeter wall segments (`wall_plain_left.png`, `wall_plain_right.png`), window walls (`wall_office_window_left.png`, `wall_office_window_right.png`), wall ends, workstations, standing desks, printers, planter dividers.

### Candidate A2: Free Office Desk 3D Pixel Art Kit
- **Creator / Publisher:** Antahonist
- **Source URL:** https://antahonist.itch.io/free-office-desk-3d-pixel-art-kit
- **License:** Permissive Commercial License (`public/assets/virtual-office/b344/licenses/Antahonist_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Grid Projection:** True 2:1 Dimetric Isometric ($64 \times 64\text{ px}$ canvas envelopes)
- **Usage in Production:** Office desks, chairs, monitors, keyboards, laser printers, scanners, shredders, whiteboards, cork boards, filing cabinets, coat racks, potted plants, waste bins, water coolers, coffee machines, snack vending machines, office stationery.

### Candidate A4: riekahq Isometric Home Interiors Lite
- **Creator / Publisher:** riekahq
- **Source URL:** https://riekahq.itch.io/isometric-interiors-lite
- **License:** Permissive Commercial License (`public/assets/virtual-office/b344/licenses/Riekahq_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Usage in Production:** Reception and collaboration lounge sofas (`sofa_red_a.png`, `sofa_red_b.png`), coffee tables, standing ambient floor lamps, grandfather clock, indoor ceramic planters.

### Candidate A5: Kenney Isometric Prototype Tiles
- **Creator / Publisher:** Kenney (www.kenney.nl)
- **Source URL:** https://kenney-assets.itch.io/isometric-prototypes-tiles
- **License:** Creative Commons Zero (CC0 1.0 Universal - Public Domain) (`public/assets/virtual-office/b344/licenses/Kenney_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Usage in Production:** Reference architecture blocks, columns, doorway angles.

### Candidate B1: Free Isometric Modern Character
- **Creator / Publisher:** RigelRiv
- **Source URL:** https://gelgel.itch.io/isometric-modern-character
- **License:** Permissive Commercial Free License (`public/assets/virtual-office/b344/licenses/RigelRiv_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Usage in Production:** Adult human office worker sprites with 2-frame idle loop in isometric SE angle.

### Benchmark Baseline: Modern Citizens - Animated Characters
- **Creator / Publisher:** nacl1234
- **Source URL:** https://nacl1234.itch.io/modern-citizens-top-down-animated-characters
- **License:** CC0 / Public Domain Equivalent (`public/assets/virtual-office/b344/licenses/ModernCitizens_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Usage in Production:** 5 adult software engineering roles (Planner, Developer, Tester, Reviewer, Publisher), 4-direction standing idle and 8-frame walk cycles with grounded foot anchor at $y=124$.

---

## 2. DISQUALIFIED & BLOCKED CANDIDATE AUDIT

| Candidate | Reason for Disqualification | Resolution |
| :--- | :--- | :--- |
| **Gridwright Character Creator** | SaaS subscription model ($1 trial with watermarked free tier). Direct violation of the $0.00 financial budget constraint. | **DISQUALIFIED** |
| **HappyHustle: Modern Rooms & People** | Requires authenticated itch.io account claim (credential block) and utilizes 90-degree top-down RPG perspective incompatible with 2:1 isometric grid. | **DISQUALIFIED** |
| **Gridwright: City People** | Host server returned HTTP 404 (Asset file unretrievable). | **BLOCKED** |

---

## 3. ASSET PATH AND LOADING VERIFICATION

- All assets referenced in production code resolve to absolute local paths under `/assets/virtual-office/b344/`.
- Zero external CDN or network requests at runtime.
- 100% of 321 PNG files verified with PIL and confirmed uncorrupted.
- Strict compliance with `"AI Agent Crew — Simulation"`.
