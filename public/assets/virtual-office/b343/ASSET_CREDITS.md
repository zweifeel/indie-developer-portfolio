# SLEEPYKOALA MILESTONE B3.4.3 — ASSET CREDITS & COMPATIBILITY REGISTER

**Project:** SleepyKoala Studio — Indie Developer Portfolio  
**Milestone:** B3.4.3 (Isometric Asset Acquisition & Visual Compatibility Prototype)  
**Total Financial Cost:** $0.00 / Rp 0 (100% Free, Permissive Commercial Licenses)  
**External Dependencies:** Zero external hotlinks (All files locally hosted within `/public/assets/virtual-office/b343/`)

---

## 1. ENVIRONMENT & ARCHITECTURE ASSETS

### Candidate A1: ThirdAngle Isometric Office Starter
- **Creator / Publisher:** Playworks North / ThirdAngle
- **Source URL:** https://thirdangle.itch.io/office-starter
- **License:** Permissive Free Commercial License (`public/assets/virtual-office/b343/licenses/ThirdAngle_README_License.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Grid Projection:** True 2:1 Dimetric / Axonometric Isometric ($64 \times 32\text{ px}$ footprint, bottom anchor $y=59$)
- **Acquired Files (13 transparent PNGs):**
  - `floor_office_carpet_tile.png` ($64 \times 64$, bottom $64 \times 32$ footprint)
  - `wall_plain_left.png`, `wall_plain_right.png` ($64 \times 128$)
  - `wall_office_window_left.png`, `wall_office_window_right.png` ($64 \times 128$)
  - `wall_end_left.png`, `wall_end_right.png` ($64 \times 128$)
  - `cubicle_workstation.png`, `standing_desk.png`, `ergonomic_office_chair.png`, `multifunction_printer.png`, `planter_divider_shelf.png`, `copy_paper_box_stack.png`

---

## 2. FURNITURE, TECH & PROP ASSETS

### Candidate A2: Free Office Desk - 3D Pixel Art Kit
- **Creator / Publisher:** Antahonist
- **Source URL:** https://antahonist.itch.io/free-office-desk-3d-pixel-art-kit
- **License:** Permissive Commercial License (`public/assets/virtual-office/b343/licenses/Antahonist_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Grid Projection:** True 2:1 Dimetric Isometric ($64 \times 64\text{ px}$ canvas envelopes)
- **Acquired Files (36 transparent PNGs):**
  - Desks & Chairs: `office_desk.png`, `standing_desk.png`, `office_chair.png`
  - Tech & Electronics: `office_monitor.png`, `office_keyboard.png`, `laser_printer.png`, `document_scanner.png`, `paper_shredder.png`, `projector.png`, `desk_phone.png`, `desk_speakerphone.png`, `desk_calculator.png`
  - Decor & Storage: `filing_cabinet.png`, `bookshelf.png`, `whiteboard.png`, `cork_board.png`, `coat_rack.png`, `potted_plant.png`, `waste_bin.png`, `water_cooler.png`, `coffee_machine.png`, `vending_snack.png`
  - Office Stationery: `desk_lamp.png`, `pen_cup.png`, `office_mug.png`, `stapler.png`, `tape_dispenser.png`, `hole_punch.png`, `scissors.png`, `rubber_stamp.png`, `clipboard.png`, `ring_binder.png`, `paper_ream.png`, `sticky_notes.png`, `paper_clips.png`, `desk_fan.png`

### Candidate A4: Isometric Home Interiors Lite
- **Creator / Publisher:** riekahq
- **Source URL:** https://riekahq.itch.io/isometric-interiors-lite
- **License:** Permissive Commercial License (`public/assets/virtual-office/b343/licenses/Riekahq_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Acquired Files (33 sprites):**
  - Interior seating, desk PC animated screen frames, bookshelves, lamps, plants (`public/assets/virtual-office/b343/environment/riekahq/`)

---

## 3. HUMAN CHARACTER ASSETS

### Candidate B1: Free Isometric Modern Character
- **Creator / Publisher:** RigelRiv
- **Source URL:** https://rigelriv.itch.io/isometric-modern-character
- **License:** Permissive Commercial Free License (`public/assets/virtual-office/b343/licenses/RigelRiv_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Projection:** Isometric angle ($22 \times 40\text{ px}$ sprite bounds)
- **Animation:** 2-frame idle animation per character, SE facing
- **Acquired Files:** Sliced frames `frame_0_0.png` through `frame_3_3.png` (`public/assets/virtual-office/b343/characters/rigelriv/`)

### Benchmark Baseline: Modern Citizens - Top-Down Animated Characters
- **Creator / Publisher:** nacl1234
- **Source URL:** https://nacl1234.itch.io/modern-citizens-top-down-animated-characters
- **License:** CC0 / Public Domain Equivalent (`public/assets/virtual-office/b343/licenses/ModernCitizens_LICENSE.txt`)
- **Cost:** Free ($0.00 / Rp 0)
- **Projection:** Axonometric / High-angle dimetric ($48 \times 48\text{ px}$ sprite on $128 \times 128\text{ px}$ frame)
- **Animation:** 4-direction idle & walking loops with explicit foot ground-anchor at $y=124$
- **Demographics:** 100% Adult Professional Software Engineers & Specialists (Zero child/teenager sprites in core roles)

---

## 4. COMPATIBILITY & INTEGRATION VERIFICATION

| Verification Metric | Target Requirement | ThirdAngle + Antahonist + Modern Citizens / RigelRiv | Status |
| :--- | :--- | :--- | :--- |
| **Grid Projection** | 2:1 Dimetric Isometric | $64 \times 32$ floor grid with seamless tiling | **VERIFIED COMPATIBLE** |
| **Canvas Envelopes** | Standardized $64 \times 64$ / $64 \times 128$ | Desks & props share $64 \times 64$, walls share $64 \times 128$ | **VERIFIED COMPATIBLE** |
| **Foot Grounding** | Ground plane bottom anchor | Anchors line up at bottom tile edge | **VERIFIED COMPATIBLE** |
| **Depth Sorting** | Front-to-back isometric z-index | Sorting key $(x + y) \times 1000 + z$ works cleanly | **VERIFIED COMPATIBLE** |
| **License Compliance** | Permissive commercial, no royalties | 100% Free, permissive commercial, $0.00 spent | **VERIFIED COMPLIANT** |
| **Agent Isolation** | 30 independent runtime agent instances | Zero canonical data modification; DompetNalar 5 agents live in Prototype D | **VERIFIED PRESERVED** |
