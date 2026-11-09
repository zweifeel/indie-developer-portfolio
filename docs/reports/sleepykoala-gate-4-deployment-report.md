# SLEEPYKOALA CMS — GATE 4 CONTROLLED PRODUCTION DEPLOYMENT REPORT
**Report Date:** 2026-11-01T06:50:00+07:00  
**Phase:** Gate 4 (Controlled Production Deployment)  
**Status:** **DEPLOYED / SUCCESSFUL**  
**Cost Impact:** **$0.00 / Rp0 (Strict Zero-Cost / Free-Tier Compliance)**  

---

## 1. EXECUTIVE SUMMARY

Gate 4 executed the controlled, non-destructive deployment of the SleepyKoala Studio CMS to production environments across Google Apps Script and Cloudflare Pages.

Prior to mutation, a complete backup of legacy production code was captured (`backend/gas_backup_pre_gate4/`). All 339 tests were confirmed passing, and TypeScript and linter checks were validated with 0 errors.

Both deployment targets were deployed, configured, and verified live:
1. **Google Apps Script Production Backend:** Upgraded to Version 3 (`AKfycbzvNccbBqIl1ObAwj8hiQit1KR0TtuvSTA_ZbyI9tblVJeZpRLe1xdkmo437qto9jRYTw`), with canonical deployment ID `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A` redeployed to Version 3.
2. **Cloudflare Pages Production Frontend & Edge Functions:** Deployed to project `sleepykoala` (production deployment `2c3cced9-d419-4bba-9577-03bb6353d987`), serving live traffic at `https://sleepykoala.pages.dev`.

---

## 2. PRODUCTION DEPLOYMENT METADATA

### 2.1 Backend (Google Apps Script Production)
- **Script ID:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Initial Baseline Deployment:** Version 1 (`AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`)
- **Pushed Version 2:** `AKfycbymjJ9PcQ_ieTQ2GNgavRfEvx402-X3yiQUVnbZ7T0YId5043w671KXfyzRxBzJMY_klA`
- **Pushed Version 3 (Canonical Seeded):** `AKfycbzvNccbBqIl1ObAwj8hiQit1KR0TtuvSTA_ZbyI9tblVJeZpRLe1xdkmo437qto9jRYTw`
- **Active Production Web App URL:** `https://script.google.com/macros/s/AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A/exec`
- **Access Level:** `ANYONE_ANONYMOUS` (Executed as `USER_DEPLOYING`)
- **OAuth Permissions:** `https://www.googleapis.com/auth/spreadsheets`, `https://www.googleapis.com/auth/script.send_mail`, `https://www.googleapis.com/auth/drive.file`
- **Advanced Service:** Google Drive API v3 enabled
- **Pre-Deployment Backup:** `backend/gas_backup_pre_gate4/`

### 2.2 Frontend & Edge Functions (Cloudflare Pages Production)
- **Project Name:** `sleepykoala`
- **Account:** `zweifeel@gmail.com` (`76fbb8b448465231780a93fd3c39863c`)
- **Production URL:** `https://sleepykoala.pages.dev`
- **Production Deployment Alias:** `https://master.sleepykoala.pages.dev`
- **Deployment Hash / ID:** `2c3cced9-d419-4bba-9577-03bb6353d987`
- **Environment:** `Production` (Branch: `main`)
- **Edge Routing:** Cloudflare Pages Functions compiled and mounted at `/api/*`

---

## 3. ZERO LEAKAGE & SENSITIVE DATA ENFORCEMENT
- No `.dev.vars` or `.test_secret` was committed or pushed to production.
- `E:\Antigravity Project\webcredential.txt` was never accessed or modified.
- `TesterRegistrations` tab was completely preserved with zero data deletion.
- Google Play Hybrid Sync remains `PAUSED`.
- The Broken Origin project was completely untouched.
- Total monetary cost: **$0.00 / Rp0**.

---

## 4. IMMEDIATE VERIFICATION SUMMARY
- `GET https://sleepykoala.pages.dev/api/projects` returned `HTTP 200 OK` with 6 canonical projects loaded from live CMS (`source: cms-live`).
- `GET https://sleepykoala.pages.dev/api/projects/mobile-kasir` returned `HTTP 200 OK` with `status: CLOSED_TESTING` and `registrationOpen: true`.
- `GET https://sleepykoala.pages.dev/api/projects/non-existent-project` returned `HTTP 404 Not Found`.
- `GET https://sleepykoala.pages.dev/api/admin/projects` without credentials returned `HTTP 401 Unauthorized`.
- `POST https://sleepykoala.pages.dev/api/admin/auth/request-otp` without CSRF header returned `HTTP 403 Forbidden`.

Deployment Gate 4 is complete and approved to transition into Gate 5 Post-Deployment Verification.
