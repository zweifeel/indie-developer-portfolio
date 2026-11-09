# SLEEPYKOALA STUDIO — ADMOB APP-ADS.TXT SETUP REPORT

**Date:** 2026-11-05  
**Project:** DompetNalar / SleepyKoala Studio  
**Target Domain:** `https://sleepykoala.pages.dev`  
**Publisher ID:** `pub-2539100802088383`  
**Working Directory:** `E:\Antigravity Project\indie-developer-portfolio`  
**Active Branch:** `master`  
**Execution Mode:** EXPLICIT HUMAN AUTHORIZATION GRANTED — PRODUCTION DEPLOYMENT EXECUTED & VERIFIED LIVE

---

## 1. EXECUTIVE SUMMARY

Google AdMob requires an `app-ads.txt` file placed at the root of the developer website domain registered in the Google Play Console store listing (for DompetNalar: `https://sleepykoala.pages.dev/projects/dompetnalar`, which resolves to root domain `https://sleepykoala.pages.dev/app-ads.txt`).

This setup has been implemented and verified locally in the SleepyKoala portfolio codebase. In accordance with strict project security constraints, **no Cloudflare deployment has been performed**; all changes remain staged locally awaiting explicit human deployment approval.

---

## 2. PROJECT CONFIGURATION & PATH VERIFICATION

| Attribute | Value / Location | Inspection Details |
| :--- | :--- | :--- |
| **Cloudflare Pages Project Name** | `sleepykoala` | Verified from `wrangler.toml` (`name = "sleepykoala"`). |
| **Production Domain** | `https://sleepykoala.pages.dev` | Canonical public URL. |
| **App-Ads Root Target URL** | `https://sleepykoala.pages.dev/app-ads.txt` | Target URL scraped by Google AdMob crawler. |
| **Static Asset Source Directory** | `public/` | Vite static assets root directory. |
| **Source File Location** | `public/app-ads.txt` | `E:\Antigravity Project\indie-developer-portfolio\public\app-ads.txt` |
| **Build Command** | `npm run build` (`tsc -b && vite build`) | Verified from `package.json`. |
| **Build Output Directory** | `dist/` | Verified from `wrangler.toml` (`pages_build_output_dir = "dist"`). |
| **Build Output File Location** | `dist/app-ads.txt` | `E:\Antigravity Project\indie-developer-portfolio\dist\app-ads.txt` |

---

## 3. FILE CONTENT SPECIFICATION

The file was authored with the exact snippet provided by Google AdMob (including newline terminator):

```
google.com, pub-2539100802088383, DIRECT, f08c47fec0942fa0
```

### Breakdown:
- **Domain:** `google.com` (canonical advertising exchange domain).
- **Publisher ID:** `pub-2539100802088383` (authorized publisher identifier for SleepyKoala / DompetNalar).
- **Relationship Type:** `DIRECT` (direct publisher relationship without intermediary reselling).
- **Certification Authority ID:** `f08c47fec0942fa0` (Google AdMob TAG ID / Trustworthy Accountability Group).

---

## 4. ROUTING & SPA FALLBACK AUDIT

To ensure the AdMob crawler retrieves pure plain text (`text/plain`) rather than being hijacked by a Single Page Application (SPA) fallback or Cloudflare Pages Function, the following inspections were performed:

1. **Cloudflare Pages Static Asset Priority:**
   - In Cloudflare Pages, static files matching incoming request paths take precedence over rewrite rules in `_redirects`.
   - `public/_redirects` contains `/* /index.html 200` (SPA routing). Because `app-ads.txt` is physically present in `dist/`, Cloudflare Pages serves `dist/app-ads.txt` directly with HTTP 200 and MIME type `text/plain`.
2. **Cloudflare Pages Functions Scope:**
   - Inspected `functions/` directory: all Functions are strictly scoped under `/api/*` (`functions/api/admin/...`, `functions/api/projects/...`, etc.).
   - There are **no root-level middleware or wildcard functions** (`functions/_middleware.ts` or `functions/[[catchall]].ts`).
3. **Robots.txt Crawlability:**
   - Inspected `public/robots.txt`:
     ```
     User-agent: *
     Allow: /
     Disallow: /admin
     Disallow: /api/admin/
     ```
   - Access to `/app-ads.txt` is explicitly allowed for all user-agents, ensuring AdMob crawlers (`Google-Adwords-Instant`, `Mediapartners-Google`) are not blocked.

---

## 5. LOCAL VERIFICATION RESULTS

| Test / Check | Tool / Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **File Creation** | Filesystem inspection | **PASS** | `public/app-ads.txt` created with exact 59 bytes. |
| **Production Build** | `npm run build` | **PASS** | Build succeeded in 1.09s; `dist/app-ads.txt` generated at root. |
| **Content Match** | Byte-by-byte inspection | **PASS** | `google.com, pub-2539100802088383, DIRECT, f08c47fec0942fa0` (no HTML tags). |
| **Automated Tests** | `npm test` (Vitest) | **PASS (447/447)** | 23/23 test suites passed 100%, including new static asset validation tests. |
| **TypeScript Typecheck** | `npx tsc -b` | **PASS** | 0 errors. |
| **Linter** | `npx oxlint` | **PASS** | 0 errors across 79 files. |

---

## 6. PRODUCTION DEPLOYMENT EXECUTION & LIVE VERIFICATION

Upon receiving explicit user authorization (*"eksekusi deployment"*):

### 6.1 Deployment Execution
- **Command:**
  ```powershell
  npx wrangler pages deploy dist --project-name=sleepykoala --branch=main --commit-dirty=true
  ```
- **Execution Status:** Success (Exit code: 0).
- **Deployment URL:** `https://886de205.sleepykoala.pages.dev`
- **Canonical Production URL:** `https://sleepykoala.pages.dev`

### 6.2 Live Production Verification Evidence
Direct HTTP query executed against the live Cloudflare Pages production server:

```powershell
curl.exe -i -s "https://sleepykoala.pages.dev/app-ads.txt"
```

**Live HTTP Response:**
```http
HTTP/1.1 200 OK
Date: Thu, 05 Nov 2026 00:46:51 GMT
Content-Type: text/plain; charset=utf-8
Content-Length: 59
Connection: keep-alive
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=0, must-revalidate
ETag: "0a7d88db4f644056c6469afb9a07e97a"
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
Server: cloudflare

google.com, pub-2539100802088383, DIRECT, f08c47fec0942fa0
```

### 6.3 Site Health Check Post-Deployment
- `https://sleepykoala.pages.dev/app-ads.txt`: `HTTP 200 OK`, `Content-Type: text/plain; charset=utf-8`.
- `https://sleepykoala.pages.dev/projects/dompetnalar`: `HTTP 200 OK`.
- `https://sleepykoala.pages.dev/api/projects`: `HTTP 200 OK`.

---

## 7. NEXT STEPS FOR PROJECT OWNER (ADMOB CONSOLE)

1. Buka [Google AdMob Console](https://admob.google.com/).
2. Masuk ke menu **Apps** -> **All Apps** -> tab **app-ads.txt**.
3. Pastikan domain developer untuk aplikasi **DompetNalar** tertera sebagai `https://sleepykoala.pages.dev` atau `https://sleepykoala.pages.dev/projects/dompetnalar` pada Google Play Console store listing.
4. AdMob secara otomatis memindai `https://<developer-website-domain>/app-ads.txt` (yaitu `https://sleepykoala.pages.dev/app-ads.txt`).
5. Status perayapan biasanya diperbarui oleh crawler Google AdMob dalam waktu 24 jam.
