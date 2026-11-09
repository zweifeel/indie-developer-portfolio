# SLEEPYKOALA STUDIO — PUBLIC METADATA EXPOSURE POLICY
## PRIVACY, PROJECTION WHITELIST & SECURITY POLICY (STAGE 2)

**Document ID:** `docs/metadata/PUBLIC_METADATA_POLICY.md`  
**Standard:** Strict Fail-Closed Whitelist Projection  
**Engine:** [`src/services/portfolioMetadataValidator.ts`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/services/portfolioMetadataValidator.ts) (`extractPublicProgress`)

---

## 1. PURPOSE & PRINCIPLES

Public portfolio visitors and search engine indexers must only receive information that has been deliberately approved for publication.

Internal engineering mechanics, secret tokens, infrastructure topologies, customer details, and draft tasks must never leak into public API responses or DOM elements.

### Core Policy Directives:
1. **Whitelist Only (No Blacklist Projections):** The public projection is built from an explicit whitelist of allowed fields. It is never constructed by deleting keys from an internal document.
2. **Fail-Closed Default:** If an item's publication status is unclear, corrupted, or omitted, it defaults to `'draft'` and is excluded from the public projection.
3. **Status Independence:** An item with `implementationStatus === 'completed'` does **NOT** become public automatically. Publication requires an explicit `'public'` status.

---

## 2. WHITELIST PROJECTION SPECIFICATION

When `extractPublicProgress(internalDoc)` is executed, only the following fields are emitted:

### 2.1 Root Entity (`PublicProjectProgress`)
- `schemaVersion`
- `projectSlug`
- `projectName`
- `projectType`
- `shortDescription`
- `publicDescription`
- `version`
- `roadmap`: Array of `PublicRoadmapItem`
- `features`: Array of `PublicFeatureItem`
- `screenshots`: Array of `PublicScreenshotItem`
- `events`: Array of `PublicProgressEvent`
- `lastPublicUpdate`

### 2.2 Prohibited in Public Output (Stripped Automatically)
- `publicationStatus` (Redundant and internal)
- `verifiedRealApp` (Internal verification flag)
- `sanitized` (Internal verification flag)
- `metadataExtras` (Internal arbitrary fields)
- `createdAt` (Internal operational timestamp)
- Any internal notes or draft items

---

## 3. VISIBILITY MATRIX

| `implementationStatus` | `publicationStatus` | Included in Public Projection? |
|---|:---:|:---:|
| `not_started` | `draft` | ❌ NO |
| `planned` | `draft` | ❌ NO |
| `in_progress` | `draft` | ❌ NO |
| `completed` | `draft` | ❌ NO (Requires explicit publication approval) |
| `completed` | `review` | ❌ NO (Staged for review, not yet public) |
| `completed` | `public` | ✅ **YES** |
| `in_progress` | `public` | ✅ **YES** (Public progress announcement) |
| `planned` | `public` | ✅ **YES** (Public roadmap item) |
| Any | `hidden` | ❌ NO (Immediately revoked) |

---

## 4. SCREENSHOT VERIFICATION REQUIREMENTS

A screenshot item may **ONLY** appear in public output if all three conditions are satisfied:
1. `publicationStatus === 'public'`
2. `verifiedRealApp === true` (Confirms image is captured from an authentic, running software build, not a concept mockup)
3. `sanitized === true` (Confirms image has been audited and is free from browser tabs, notifications, emails, API keys, or personal data)

If a screenshot is marked `'public'` but `verifiedRealApp` or `sanitized` is false, `validateProgressMetadata` issues a warning diagnostic (`UNVERIFIED_PUBLIC_SCREENSHOT`) and `extractPublicProgress` drops it from public output.

---

## 5. REJECTED SENSITIVE PATTERNS & KEYS

Any metadata document containing the following is immediately rejected (`valid: false`):

### 5.1 Prohibited Key Names
- `branch`, `commit`, `commitHash`, `hash`, `sourceCode`
- `token`, `secret`, `apiKey`, `password`
- `server`, `serverProvider`, `endpoint`, `internalUrl`, `ipAddress`
- `authorEmail`, `keystore`, `privateKey`, `credential`, `sessionSecret`

### 5.2 Prohibited String Patterns (Scanned Recursively)
- Google API Keys (`AIza[0-9A-Za-z-_]{35}`)
- GitHub Personal Access Tokens (`gh[pousr]_[A-Za-z0-9_]{36,255}`)
- AWS Access Keys (`(?:AKIA|ASIA)[A-Z0-9]{16}`)
- Internal endpoints (`localhost`, `127.0.0.1`, `192.168.*`, `10.*`, `internal.*`)
- Indonesian National Identity Numbers (NIK: 16 digits)
- Mobile phone numbers and customer emails
