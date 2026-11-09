# SLEEPYKOALA CMS — MILESTONE 6.4 PRODUCTION DEPLOYMENT METADATA

**Waktu Peluncuran:** 1 November 2026, 18:05 WIB  
**Status Eksekusi:** SUCCESSFUL — LIVE PRODUCTION DEPLOYED  

---

## 1. CLOUDFLARE PAGES PRODUCTION METADATA

- **Project Name:** `sleepykoala`
- **Environment:** `Production`
- **Branch:** `main`
- **Commit SHA:** `cae5405`
- **New Active Deployment UUID:** `0ef893ab-266c-4af0-a782-7a8c01d75f4a`
- **Direct Deployment URL:** `https://0ef893ab.sleepykoala.pages.dev`
- **Primary Production Domain:** `https://sleepykoala.pages.dev`
- **Custom Domain Target:** `https://master.sleepykoala.dev`
- **Previous Baseline (Rollback Target):** `2c3cced9-fc9b-4bc7-857f-7826f9acd386`
- **Incompatible Deployment (Forbidden):** `e67ff19b-2b76-4324-a287-ae17d2f72d4b`
- **Active Edge Secrets:**
  - `ADMIN_SESSION_SECRET` (Value Encrypted)
  - `APPS_SCRIPT_SECRET` (Value Encrypted)
  - `GAS_WEBAPP_URL` (Value Encrypted)

---

## 2. GOOGLE APPS SCRIPT PRODUCTION METADATA

- **Script ID:** `1wN48zjs08Ukw54-YAdTe5s57A0zwxiYvGQpo74adWYtkSRVYo5uP3fvD`
- **Active Deployment ID:** `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A`
- **Active Version:** Version 4 (`@4`)
- **Version Description:** `SleepyKoala CMS Production V4 - Pre-Registration & Session Hardening`
- **Immutable Version History:**
  - `Version 1`: SleepyKoala Closed Testing Backend V1 (Legacy, Forbidden for CMS rollback)
  - `Version 2`: SleepyKoala CMS Production V2 - Full Integration & Gate 4 Deployment
  - `Version 3`: SleepyKoala CMS Production V3 - Canonical Projects Seeded (Rollback Baseline)
  - `Version 4`: SleepyKoala CMS Production V4 - Pre-Registration & Session Hardening (Active Production)
- **Active Deployments List (`npx @google/clasp deployments`):**
  - `AKfycbwyhSC4BmXo2PDH532WVW7hNDv7J5xxkTSgBJ12gupW` @HEAD
  - `AKfycbymjJ9PcQ_ieTQ2GNgavRfEvx402-X3yiQUVnbZ7T0YId5043w671KXfyzRxBzJMY_klA` @2 (V2 Rollback candidate)
  - `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A` @4 (Active Production Endpoint)
  - `AKfycbzvNccbBqIl1ObAwj8hiQit1KR0TtuvSTA_ZbyI9tblVJeZpRLe1xdkmo437qto9jRYTw` @3 (V3 Seeded snapshot)
  - `AKfycbwsokp3vxceyPiQj6UWIKATvtw8k_foQFo1QAuYF79oVMFBghIL969Xmq8e9W_a7ZyNWg` @4 (V4 Deployment snapshot)

---

## 3. LIVE SMOKE TEST BUKTI AKTUAL (HTTP VERIFIED)

| Endpoint | HTTP Status | Response Time | Keterangan |
|---|---|---|---|
| `GET https://sleepykoala.pages.dev/` | 200 OK | 0.12s | Beranda publik menyajikan bundle baru `index-7H6n5fUj.js` |
| `GET https://sleepykoala.pages.dev/projects` | 200 OK | 0.19s | Katalog menyajikan filter status termasuk Pre-Registration |
| `GET https://sleepykoala.pages.dev/api/projects` | 200 OK | 3.02s | Response live dari Google Sheets V4 (`cms-live`, 6 proyek resmi) |
| `GET https://sleepykoala.pages.dev/admin` | 200 OK | 0.09s | Web Admin GUI panel tersedia |
| `GET https://sleepykoala.pages.dev/api/admin/auth/session` | 200 OK | 0.14s | Fail-closed: `{"success":true,"authenticated":false}` |
| `GET https://sleepykoala.pages.dev/api/admin/projects` | 401 Unauthorized | 0.15s | Dilindungi otentikasi sesi |
| `GET https://sleepykoala.pages.dev/api/admin/media` | 401 Unauthorized | 0.16s | Dilindungi otentikasi sesi |
| `POST https://sleepykoala.pages.dev/api/admin/auth/verify-otp` (No CSRF) | 403 Forbidden | 0.13s | Dilindungi CSRF header |
| `POST https://sleepykoala.pages.dev/api/admin/auth/verify-otp` (Invalid email) | 401 Unauthorized | 0.14s | Otentikasi email admin terproteksi |
