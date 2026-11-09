# SLEEPYKOALA STUDIO — METADATA CONTRACT SPECIFICATION
## SINGLE SOURCE OF TRUTH (STAGE 2)

**Document ID:** `docs/metadata/METADATA_CONTRACT.md`  
**Current Canonical Version:** `2`  
**Supported Versions:** `1`, `2`  
**Module Locations:**  
- Types: [`src/types/portfolioProgress.ts`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/types/portfolioProgress.ts)  
- Validator & Sanitizer: [`src/services/portfolioMetadataValidator.ts`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/services/portfolioMetadataValidator.ts)  
- Test Suite: [`src/test/portfolioProgress.test.ts`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/test/portfolioProgress.test.ts)  

---

## 1. PURPOSE & ARCHITECTURAL SCOPE

The Metadata Contract defines the exact structure, constraints, lifecycle transitions, and exposure projection rules for all project progress information within SleepyKoala Studio.

It acts as the immutable single source of truth consumed across:
- React + TypeScript public pages (`ProjectDetailPage.tsx`, `HomePage.tsx`)
- Web Admin CMS services (`cmsProjectService.ts`)
- Cloudflare Pages Functions API routes (`/api/projects/:slug`)
- Google Apps Script backend storage
- Future GitHub webhook synchronization and automation engines

---

## 2. CANONICAL DATA STRUCTURES

### 2.1 ProjectProgressDocument (Root Entity)

| Field | Type | Required | Description |
|---|---|:---:|---|
| `schemaVersion` | `number` | Yes | Must be `2` (or `1` in legacy mode). |
| `projectSlug` | `string` | Yes | Alphanumeric lowercase with hyphens (`^[a-z0-9-_]+$`). |
| `projectName` | `string` | Yes | Human-readable official project name. |
| `projectType` | `'APPLICATION' \| 'GAME' \| 'WEBSITE' \| 'TOOL' \| 'OTHER'` | No | Category of project. |
| `shortDescription` | `string` | No | 1-2 sentence public overview. |
| `publicDescription`| `string` | No | Full markdown/prose public description. |
| `version` | `string` | No | Current semver release or build identifier. |
| `roadmap` | `RoadmapMilestone[]` | Yes | Array of ordered milestones. |
| `features` | `FeatureItem[]` | Yes | Array of functional feature items. |
| `screenshots` | `ProgressScreenshot[]` | Yes | Array of verified UI / gameplay captures. |
| `events` | `ProgressEvent[]` | No | Changelog events and progression milestones. |
| `updatedAt` | `string` | Yes | ISO 8601 UTC timestamp of last metadata modification. |
| `createdAt` | `string` | No | ISO 8601 UTC timestamp of initial creation. |
| `metadataExtras` | `Record<string, unknown>` | No | Safe container preserving non-standard/legacy fields. |

### 2.2 RoadmapMilestone Entity

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | `string` | Yes | Stable identifier (`^[a-zA-Z0-9_-]{3,64}$`), e.g., `ms_core_01`. |
| `title` | `string` | Yes | Concise milestone title. |
| `description` | `string` | Yes | Milestone objective and scope. |
| `priority` | `'low' \| 'medium' \| 'high' \| 'critical'` | No | Milestone scheduling priority. |
| `implementationStatus` | `ImplementationStatus` | Yes | Current engineering state. |
| `publicationStatus` | `PublicationStatus` | Yes | Editorial publication state (defaults to `'draft'`). |
| `targetQuarter` | `string` | No | Target calendar quarter, e.g., `Q2 2026`. |
| `targetDate` | `string` | No | ISO 8601 target completion date (YYYY-MM-DD). |
| `completedAt` | `string` | No | ISO 8601 timestamp when verification passed. |
| `order` | `number` | Yes | Sequential sort order integer (1-based). |
| `updatedAt` | `string` | Yes | ISO 8601 UTC update timestamp. |
| `createdAt` | `string` | No | ISO 8601 UTC creation timestamp. |

### 2.3 FeatureItem Entity

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | `string` | Yes | Stable identifier (`^[a-zA-Z0-9_-]{3,64}$`), e.g., `feat_expense_01`. |
| `milestoneId` | `string` | No | Valid `id` referencing an existing `RoadmapMilestone`. |
| `title` | `string` | Yes | Feature name. |
| `description` | `string` | Yes | Functional description. |
| `priority` | `'low' \| 'medium' \| 'high' \| 'critical'` | No | Feature scheduling priority. |
| `category` | `string` | No | Functional domain, e.g., "UI", "Storage", "Finance". |
| `implementationStatus` | `ImplementationStatus` | Yes | Current engineering state. |
| `publicationStatus` | `PublicationStatus` | Yes | Editorial publication state (defaults to `'draft'`). |
| `releaseVersion` | `string` | No | Release version tagging this feature. |
| `screenshotIds` | `string[]` | No | Array of valid `id`s referencing `ProgressScreenshot`. |
| `order` | `number` | Yes | Sequential sort order integer. |
| `completedAt` | `string` | No | ISO 8601 completion timestamp. |
| `updatedAt` | `string` | Yes | ISO 8601 UTC timestamp. |
| `createdAt` | `string` | No | ISO 8601 UTC timestamp. |

### 2.4 ProgressScreenshot Entity

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | `string` | Yes | Stable identifier (`^[a-zA-Z0-9_-]{3,64}$`), e.g., `shot_home_01`. |
| `featureId` | `string` | No | Valid `id` referencing an existing `FeatureItem`. |
| `caption` | `string` | Yes | Explanatory caption for public presentation. |
| `path` | `string` | Yes | Relative path within repository or media asset identifier. |
| `publicationStatus` | `PublicationStatus` | Yes | Editorial state (defaults to `'draft'`). |
| `verifiedRealApp` | `boolean` | Yes | Must be `true` for public visibility (originates from genuine app). |
| `sanitized` | `boolean` | Yes | Must be `true` for public visibility (free of PII/secrets). |
| `updatedAt` | `string` | Yes | ISO 8601 UTC timestamp. |
| `createdAt` | `string` | No | ISO 8601 UTC timestamp. |

### 2.5 ProgressEvent Entity (Changelog)

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | `string` | Yes | Stable identifier (`^[a-zA-Z0-9_-]{3,64}$`), e.g., `evt_v120_release`. |
| `eventType` | `ProgressEventType` | Yes | One of: `milestone_reached`, `feature_released`, `status_changed`, `general_update`, `security_fix`. |
| `title` | `string` | Yes | Headline summary of the event. |
| `description` | `string` | Yes | Context and details of progress. |
| `timestamp` | `string` | Yes | ISO 8601 UTC timestamp of occurrence. |
| `relatedId` | `string` | No | Referenced milestone or feature identifier. |
| `relatedType` | `'milestone' \| 'feature'` | No | Type of referenced entity. |
| `publicationStatus` | `PublicationStatus` | Yes | Editorial publication state (defaults to `'draft'`). |

---

## 3. RELATIONAL INTEGRITY RULES

1. **Unique Identifiers:** Every `id` within `roadmap`, `features`, `screenshots`, and `events` must be globally unique across the document.
2. **Milestone Foreign Key:** If `feature.milestoneId` is specified, it must exist in `doc.roadmap`.
3. **Feature Foreign Key:** If `screenshot.featureId` is specified, it must exist in `doc.features`.
4. **Event Foreign Key:** If `event.relatedId` is specified with `relatedType: 'milestone'`, it must exist in `doc.roadmap`. If specified with `relatedType: 'feature'`, it must exist in `doc.features`.

---

## 4. STATUS ENUMS & TRANSITION GUARDS

### 4.1 Implementation Status Lifecycle
```text
  [not_started] ───► [planned] ───► [in_progress] ───► [completed]
        │                │                ▲                  │
        │                ▼                │ (rework)         │
        │           [blocked] ────────────┘                  │
        ▼                │                                   ▼
   [cancelled] ◄─────────┴─────────────────────────────► [cancelled]
        │
        └─► (reactivate) ──► [planned] / [not_started]
```

### 4.2 Publication Status Lifecycle
```text
  [draft] (default) ────► [review] ────► [public]
     ▲                       ▲              │
     │ (revert)              │ (resubmit)   │ (revoke)
     └───────────────────────┴──────────────▼
                                         [hidden]
```
- **Strict Guard Rule:** Items cannot transition directly from `draft` to `public`. They must enter `review` first.
- **Independence Guarantee:** Changing `implementationStatus` does not alter `publicationStatus`. A completed feature remains in `draft` until explicitly published.

---

## 5. VALIDATION API REFERENCE

Function: `validateProgressMetadata(data: unknown, options?: { allowLegacyV1?: boolean }): ValidationResult`

- Returns structured diagnostic results:
  - `valid`: `boolean`
  - `errors`: array of string messages
  - `warnings`: array of string warnings
  - `diagnostics`: array of `{ code, message, path, severity }`
  - `sanitizedDoc`: clean typed `ProjectProgressDocument` if valid
