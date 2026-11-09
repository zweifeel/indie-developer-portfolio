# SLEEPYKOALA CMS — MANIFEST KRIPTOGRAFIS CHECKPOINT GATE 2D
## CRYPTOGRAPHIC CHECKPOINT MANIFEST — GATE 2D TEST ENVIRONMENT

**Checkpoint ID:** `gate-2d-test-20261101-v1`  
**Tanggal:** 2026-11-01  
**Baseline:** Gate 2C TEST (`gate-2c-test-20261101-v5`)  
**Status Evaluasi:** **PASS PENUH — FROZEN DI TEST ENVIRONMENT**  
**Algoritma Hash:** SHA-256 (Canonical Upper-case Hex)

---

## 1. TABEL HASH SHA-256 BERKAS INTI

| Path Berkas | SHA-256 Checksum | Peran / Deskripsi |
|---|---|---|
| `functions/api/projects.ts` | `CF9786920F5E80A04E40FA51DB20138E5EE6DEB87A4B0B464A4FE2E4A632DF85` | Public published projects API with RFC 9111 no-cache & static fallback |
| `functions/api/projects/[slug].ts` | `9628AADDA3473F6B3204A4485A4936BC3BD5108503C5A776B53ECE90F2D7BC5C` | Public project slug resolver (Strict 404 for draft/archived) |
| `functions/api/admin/projects.ts` | `D4C2A6660F2FEE8B88ECA536B1EA40ABCA5EFF739C1768E7684A7A898B2A3DD5` | Admin projects handler (CRUD, reorder, restore, publish) |
| `functions/api/admin/media.ts` | `459D25149B6BB184F1342003985DD2DE7276D69E8D9C20CB1A4CB3C09AE6AA18` | Admin media handler (Upload, replace, permanent delete forwarding) |
| `functions/api/admin/media/[mediaId].ts` | `37DDA797A7CAC9FEBAD4693DD1D35092277EB6B73D586EBAC433974A335A85E5` | Admin media detail & binary preview proxy |
| `functions/api/media/[mediaId].ts` | `F4900DFEE74EF34E2DC5ED2F36E55E788B7273D03043ACE0945D98926DBB2878` | Public media proxy (Strict 404 for draft/archived) |
| `src/services/projectService.ts` | `5F4037238A4D9DEBC9850D3C0110D726EF1119EC96F790C66F928993ED346098` | Dynamic public project service & `useProjects` reactive hook |
| `src/services/cmsProjectService.ts` | `DC9A659A0BCB23B7697E6A1F58628475503A4B0FC9D795D79A1DF2338E33F701` | Admin project CRUD client service |
| `src/services/cmsMediaService.ts` | `22975DF1C9F79A229912BD1D3FB77EFAF4DCDB3C5AFCEEFD0DDD09FEB2F6F028` | Admin media client service (Upload, replace, permanent delete) |
| `src/pages/AdminPage.tsx` | `EED879E566487D4BE83916FD41F9B9778A133A8FC684E1678EFF8E0CF91A89A2` | Comprehensive Admin Dashboard (Overview, CRUD, Media Library) |
| `src/pages/HomePage.tsx` | `6C90AB2062F6B0C95211C132D20F7878D6578749FD29F19A47B17215DFBB4743` | Dynamic Home page connected to `useProjects` |
| `src/pages/ProjectsPage.tsx` | `245967AC0A3AD3BBB16AA48F04A118DE86135D44FFFA0D0F69DE6AC3C3D09594` | Dynamic Projects catalog page connected to `useProjects` |
| `src/pages/ProjectDetailPage.tsx` | `0E5336834038F7CE625FAFEF8D0F26F7A7BA435EEC9C7A5587F75CF377CE6DC8` | Dynamic Project detail page connected to `useProjects` |
| `src/pages/FeedbackPage.tsx` | `4D23B2D3DC06EC5EDB97A3D022616F4A50F780854A708E07373E3F0C31DA7E3A` | Dynamic Feedback page connected to `useProjects` |
| `src/test/cmsGate2DFunctionalAcceptance.test.ts` | `5522F8A9C2F22556C02ACD0F1B10E671713A9DC1AA3731D6217C910A595DFBC3` | 24 Gate 2D end-to-end integration acceptance tests |
| `backend/test_gas/Code.gs` | `876F8C509C9AA13F86C1146389341C2AEC39ECF1CC6630FB272BFD58E8089F6B` | Google Apps Script TEST backend (Deployment V5) |

---

## 2. PERNYATAAN INTEGRITAS

Seluruh berkas yang tertera pada tabel di atas telah melalui validasi kriptografis dan dipastikan tidak mengalami modifikasi yang tidak terotorisasi. Setiap perubahan di masa mendatang wajib memperbarui manifes ini.
