# SLEEPYKOALA STUDIO — METADATA VERSIONING & COMPATIBILITY
## SCHEMA EVOLUTION & MIGRATION POLICY (STAGE 2)

**Document ID:** `docs/metadata/METADATA_VERSIONING.md`  
**Current Canonical Schema Version:** `2`  
**Supported Legacy Versions:** `1`  
**Migration Engine:** [`src/services/portfolioMetadataValidator.ts`](file:///E:/Antigravity%20Project/indie-developer-portfolio/src/services/portfolioMetadataValidator.ts) (`migrateLegacyProgressDocument`)

---

## 1. VERSIONING PHILOSOPHY

SleepyKoala Studio follows an explicit, integer-based schema versioning strategy for metadata (`schemaVersion: 1`, `schemaVersion: 2`, etc.).

### 1.1 Non-Breaking (Backward-Compatible) Changes
The following changes increment internal minor features without requiring a new major schema version:
- Adding an optional field to an existing entity (e.g., adding `priority?: ItemPriority` or `targetDate?: string`).
- Adding a new valid enum option to an extensible list (e.g., adding `'WEBSITE'` to `CanonicalProjectType`).
- Adding new warning-level diagnostics that do not invalidate previously valid payloads.

### 1.2 Breaking Changes
The following changes mandate incrementing `CANONICAL_SCHEMA_VERSION`:
- Modifying the type or meaning of an existing field.
- Renaming or deleting an existing required field.
- Introducing a new required field without a default value.
- Removing an enum value from an existing required status field.
- Changing the structure of the public projection.

---

## 2. LEGACY COMPATIBILITY RULES (V1 ➔ V2)

### 2.1 Mapping Table

| Aspect | Schema v1 (Legacy) | Canonical Schema v2 | Migration Action |
|---|---|---|---|
| `schemaVersion` | `1` | `2` | Upgraded to `2`. |
| `implementationStatus` | `on_hold` | `blocked` | Automatically mapped: `'on_hold'` ➔ `'blocked'`. |
| `publicationStatus` | Missing or undefined | `draft` | Defaulted to `'draft'`. |
| `events` (Changelog) | Missing | `[]` | Initialized as empty array `[]`. |
| `projectType` | Missing | Inferred or `'APPLICATION'` | Defaulted safely without throwing. |
| Unknown top-level fields | Unstructured | `metadataExtras` | Preserved in `metadataExtras` without data loss. |

### 2.2 Guarantees of the Migration Engine
1. **Deterministic Output:** Running `migrateLegacyProgressDocument(doc)` multiple times on the same input produces deep-equal output.
2. **Input Immutability (Pure Function):** The input document is never mutated in-place.
3. **No Silent Drops:** Any non-standard fields in the legacy document are tracked in `preservedLegacyFields` and nested safely under `migratedDoc.metadataExtras`.
4. **Fail-Closed on Non-Objects:** If the input is not a JSON object, migration immediately fails with `success: false` and explanatory warnings.

---

## 3. RUNTIME COMPATIBILITY BEHAVIOR

When `validateProgressMetadata(doc)` is executed:
- **Canonical v2:** Evaluated directly. Produces 0 version warnings.
- **Legacy v1:** Accepted under backward compatibility. Produces diagnostic `LEGACY_SCHEMA_VERSION` (severity: `warning`) alerting the operator to migrate to v2.
- **Unsupported Version (e.g. 99, 0, or negative):** Rejected immediately with `valid: false` and diagnostic `UNSUPPORTED_SCHEMA_VERSION` (severity: `error`).

---

## 4. ZERO PRODUCTION MUTATION POLICY

Stage 2 only provides the contract definitions, validators, and pure migration functions.

- **No automated write-back** to production Google Sheets or Cloudflare storage is permitted during Stage 2.
- Data files in `docs/portfolio/` (`roadmap.json` and `features.json`) are preserved as valid test fixtures.
