# SLEEPYKOALA CMS — GATE 2A ENVIRONMENT BOUNDARIES
**Environment Matrix, Script Identification, and Boundary Affirmations**

- **Date:** 2026-10-31
- **Status:** STRICTLY ISOLATED & ENFORCED

---

## 1. Environment Comparison Matrix

| Property | Test Environment (Gate 2A Target) | Production Environment (Untouched) |
|:---|:---|:---|
| **Project Name** | `SleepyKoala_Test_Database` | `SLEEPYKOALA STUDIO — CLOSED TESTING REGISTRATION BACKEND` |
| **Apps Script ID** | `12G5pUNdWv9oGAUpMaAIcMYqKwmuQmsI854r99EGMszxgQ37p08-IFTWg` | `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD` |
| **Container Spreadsheet** | `SleepyKoala_Test_Database` | `SleepyKoala Studio — Closed Testing Registrations (Production)` |
| **Spreadsheet ID** | `1Ciremegyuict3L7mAeOB05HKLfH7FfDddHE8kRgV1e4` | *Kept isolated in production configuration* |
| **Local Backend Directory** | `backend/test_gas/` | `backend/gas/` |
| **Secret Property Name** | `SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET` | `APPS_SCRIPT_SECRET` |
| **Clasp Configuration** | `backend/test_gas/.clasp.json` | `backend/gas/.clasp.json` |
| **Database Tabs Used** | `CMS_Projects`, `CMS_AuditLogs` | `TesterRegistrations` |
| **Status in Gate 2A** | **ACTIVE FOR LOCAL TESTING** | **FROZEN & UNTOUCHED (ZERO OPERATIONS)** |

---

## 2. Affirmation of Production Untouched State

1. **No Code Changes in `backend/gas/`:** The production backend script file [`backend/gas/Code.gs`](file:///E:/Antigravity%20Project/indie-developer-portfolio/backend/gas/Code.gs) has not been edited, staged, pushed, or deployed. Its last modified timestamp remains prior to the start of the CMS project.
2. **No Secret Mutation:** Production `APPS_SCRIPT_SECRET` has not been altered or loaded into local development variables.
3. **No Database Modification:** Production spreadsheet tabs, including `TesterRegistrations`, have had zero read, write, or append requests executed against them.
4. **Google Play Hybrid Sync:** Remains in state `PAUSED — AWAITING EXPLICIT USER APPROVAL`. No sync jobs have been scheduled or triggered.
5. **The Broken Origin (TBO):** No TBO files, game assets, or repositories have been touched.

---

## 3. Affirmation of Google Drive Segregation

1. **Zero Drive Operations in Gate 2A:** In accordance with the project roadmap, Gate 2A focuses exclusively on the Admin Dashboard UI and Google Sheets CRUD engine.
2. **Drive Scope Preparation Only (Gate 1C):** The test manifest `backend/test_gas/appsscript.json` was prepared in Gate 1C with the restricted scope `https://www.googleapis.com/auth/drive.file`.
3. **No Runtime Drive API Invocation:** During Gate 2A, no files or folders were created, read, or modified in Google Drive. All media and asset upload capabilities are reserved for Gate 2B.
