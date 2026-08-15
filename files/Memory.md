# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Phase Information

* **Phase Number**: Phase 5
* **Milestone**: `M5`
* **Task Numbers**: Tasks 1 through 5
* **Task Titles**:
  * Task 1: GitHub Search Service (`lib/github-search.ts`) (Done)
  * Task 2: Repository URL Resolver (`lib/repo-url-resolver.ts`) (Done)
  * Task 3: Public Repository Validation & Metadata Fetching (Done)
  * Task 4: Standardize API Endpoints (`GET /api/explorer/search`, `POST /api/explorer/resolve`) (Done)
  * Task 5: Scaffold Explorer Route Group & Layout (`app/(explorer)/`) (Done)

---

## Change Summary (Phase 5)

* **Objective**: Scaffold the public Explorer foundations including search, URL normalization, metadata fetching, route group placement, and standardized JSON endpoints.
* **Reason for Implementation**: Establish the verified, canonical repository identity and discovery entry points before building the cache layer (Phase 6) and dashboard (Phase 7).
* **What was Completed**:
  * Scaffolder route group `(explorer)` by moving `app/explorer/` folder into `app/(explorer)/explorer/`.
  * Created `app/(explorer)/layout.tsx` wrapper for all Explorer page views.
  * Updated `lib/github-search.ts`: Extended `PublicSearchResult` interface with `defaultBranch` and `canonicalKey` properties to return comprehensive metadata from GitHub.
  * Updated `models/PublicRepository.ts`: Added `defaultBranch`, `githubRepoId`, and `isPrivate` to the Mongoose cache model interface and schema definition for compatibility.
  * Modified `app/api/explorer/search/route.ts`: Rewrote GET route to use standardized `{ success: true, data: { repositories } }` and `{ success: false, error }` formats.
  * Modified `app/api/explorer/resolve/route.ts`: Rewrote POST route to validate, parse inputs, check cache, fetch public metadata (rejecting private repos), run synchronous parsing for compatibility, and return standardized `{ success: true, data: details }` response.
  * Updated `app/(explorer)/explorer/page.tsx`: Aligned search debouncer and resolution handler to consume the standardized `{ success, data }` response shapes.

---

## Files Created (Phase 5)

* `app/(explorer)/layout.tsx` — Explorer Mode route group layout wrapper.

---

## Files Modified (Phase 5)

* `lib/github-search.ts` — Added `defaultBranch` and `canonicalKey` properties to public repository queries.
* `models/PublicRepository.ts` — Added schema mapping for cache properties.
* `app/api/explorer/search/route.ts` — Standardized response shape.
* `app/api/explorer/resolve/route.ts` — Standardized response shape, checked cache, and validated metadata.
* `app/(explorer)/explorer/page.tsx` — Relocated route file; updated API consumption logic.
* `files/phases.md` — Marked Phase 5 milestone completed.
* `files/Memory.md` — Updated for Phase 5 status.

---

## Files Deleted

*(None)*

---

## APIs

* `GET /api/explorer/search?q=query` — Public repo search (returns `{ success: true, data: { repositories } }`).
* `POST /api/explorer/resolve` — Resolves URL or shorthand, checks cache, validates accessibility, indexes on miss (returns `{ success: true, data }`).
* `GET /api/explorer/repo/[...key]` — Retrieve cached Explorer payloads.

---

## Models

* **PublicRepository** (`publicrepositories` — stores Explorer cached metadata and graphs)

---

## Components

* **GraphCanvasWrapper** (`components/three/GraphCanvasWrapper.tsx`)
* **GraphSkeleton** (`components/three/GraphSkeleton.tsx`)

---

## Validation Results

* **Build**: ✅ Success (production build compiles with 0 errors)
* **TypeScript**: ✅ Success (0 compiler issues on clean cache)
* **ESLint**: ✅ Success (0 linting or styling violations)
* **Prettier**: ✅ Success (Formatted output matches config)

---

## Next Steps

* **Next Task**: Phase 6 — Task 1: Implement background worker and queues.
* **Next Phase**: Phase 6 — Shared Repository Cache & Background Indexing Engine.
* **Current Project Progress**: Phase 5 Explorer Foundations are 100% complete and fully verified.
