# SLEEPYKOALA STUDIO — MILESTONE 6 MANIFEST
## FILE & ARTIFACT INVENTORY

**Checkpoint ID:** `milestone-6-production-operation-20261101-v1`  
**Generated At:** 2026-11-01T07:40:00+07:00

---

## 1. FILE SYSTEM MANIFEST

### Core Public Web Files
- `index.html` — Document entrypoint containing canonical URL, Open Graph, Twitter cards, and Schema.org Organization JSON-LD.
- `public/robots.txt` — Public crawler instructions with admin disallow rules and canonical sitemap URL.
- `public/sitemap.xml` — Canonical sitemap covering all 9 public studio URLs.
- `public/assets/branding/sleepykoala-logo.png` — Official studio logo asset.

### React Application Components & Pages (`src/`)
- `src/App.tsx` — Main routing and root layout with horizontal overflow protection (`overflow-x-hidden`).
- `src/hooks/usePageMeta.ts` — Dynamic SEO meta management hook for title, description, canonical link, and dynamic Schema.org JSON-LD.
- `src/components/Navbar.tsx` — Responsive navigation with 44px min touch targets and official branding.
- `src/components/Footer.tsx` — Clean footer with zero-cost architecture transparency and official branding.
- `src/components/ProjectCard.tsx` — Project card component with touch targets, status badges, and solid typography.
- `src/components/RegistrationModal.tsx` — 14-day Closed Testing registration modal.
- `src/pages/HomePage.tsx` — Hero section with solid typography, calculated statistics, and featured projects.
- `src/pages/ProjectsPage.tsx` — Projects directory with category and 6 status filters, search bar, and empty/error states.
- `src/pages/ProjectDetailPage.tsx` — Full project details with conditional actions per status, Worklume capabilities, and JSON-LD application schema.
- `src/pages/FeedbackPage.tsx` — Diagnostic feedback form with honeypot spam protection, device model, and Android version inputs.
- `src/pages/AboutPage.tsx` — Studio philosophy, developer role, tech stack, and testing policies.
- `src/pages/AdminPage.tsx` — Admin CMS dashboard with OTP auth, project CRUD, 6 status dropdown, media library, and audit logs.

### Backend & Cloudflare Pages Functions (`functions/` & `backend/`)
- `functions/api/projects.ts` — Edge function for fetching published projects with fail-closed error handling and dual envelope parsing.
- `functions/api/projects/[slug].ts` — Edge function for fetching project detail with 404/503 handling.
- `functions/api/media/[mediaId].ts` — Binary media transfer function with ETag and Cache-Control headers.
- `functions/api/register-tester.ts` — 14-day Closed Testing registration endpoint with rate limiting and CSRF protection.
- `functions/api/admin/auth/` — Admin OTP authentication and session token verification handlers.
- `functions/api/admin/projects.ts` — Admin project management endpoints.
- `functions/api/admin/media.ts` & `[mediaId].ts` — Admin media management endpoints.
- `functions/api/admin/audit-logs.ts` — Admin audit logs query endpoint.
- `backend/gas/Code.gs` — Google Apps Script production v3 code with official project auto-seeding.

### Automated Acceptance & Unit Tests (`src/test/`)
- `src/test/milestone6Acceptance.test.ts` — Milestone 6 Acceptance suite (11 tests).
- `src/test/cmsGate2D3Acceptance.test.ts` — Gate 2D.3 acceptance tests (17 tests).
- `src/test/cmsGate2D2Remediation.test.ts` — Gate 2D.2 remediation tests (29 tests).
- `src/test/cmsGate2DFunctionalAcceptance.test.ts` — Gate 2D functional acceptance tests (26 tests).
- `src/test/cmsGate2CBinaryTransfer.test.ts` — Gate 2C binary transfer tests (22 tests).
- `src/test/cmsOperationalVerification.test.ts` — Operational verification tests (18 tests).
- `src/test/cmsCrud.test.ts` — CMS CRUD tests (29 tests).
- `src/test/cmsMedia.test.ts` — CMS Media library tests (57 tests).
- `src/test/adminAuth.test.ts` — Admin authentication & OTP tests (55 tests).
- `src/test/isolatedE2E.test.ts` — Isolated E2E registration tests (11 tests).
- `src/test/registerTesterFunction.test.ts` — Tester registration tests (12 tests).
- `src/test/googlePlaySyncIsolated.test.ts` — Google Play sync isolation tests (23 tests).
- `src/test/components.test.tsx` — UI component tests (11 tests).
- `src/test/RegistrationModal.test.tsx` — Registration modal tests (9 tests).
- `src/test/projectService.test.ts` — Project service tests (9 tests).
- `src/test/registrationService.test.ts` — Registration service tests (5 tests).
- `src/test/cmsPoCIsolated.test.ts` — Isolated PoC tests (10 tests).
