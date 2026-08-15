# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Phase Information

* **Phase Number**: Phase 6
* **Milestone**: `M6`
* **Task Numbers**: Tasks 1 through 7
* **Task Titles**:
  * Task 1: PublicRepositories Cache Schema (`models/PublicRepository.ts`) (Done)
  * Task 2: SearchHistory Model (`models/SearchHistory.ts`) (Done)
  * Task 3: Cache-Lookup & Freshness Workflow (HEAD SHA comparison) (Done)
  * Task 4: Background Indexing Worker (`lib/explorer-indexer.ts`) (Done)
  * Task 5: Status Polling Route (`GET /api/explorer/status/[...key]`) (Done)
  * Task 6: Concurrency Lock & Duplicate URL Prevention (Done)
  * Task 7: Manual Refresh API & Signed-in Auth (`POST /api/explorer/repo/refresh`) (Done)

---

## Change Summary (Phase 6)

* **Objective**: Implement the shared cache model, indexing worker, and job locks to avoid repeated repository parses, control AI costs, and support asynchronous processing of public repositories in Explorer Mode.
* **Reason for Implementation**: Primary cost-control and performance scaling strategy for Explorer Mode. Avoids blocking requests on indexing and ensures private repos never enter the cache.
* **What was Completed**:
  * Extended `models/PublicRepository.ts` schema with: `indexStatus`, `lastCommitShaAtIndex`, `exploreCount`, `moduleSummaries`, `error`, `createdAt`, `updatedAt`.
  * Created `models/SearchHistory.ts` to record signed-in user Explorer queries for pagination in later phases.
  * Added `getRepoHeadSha` in `lib/github.ts` to fetch default branch and HEAD commit SHA without parsing the file tree.
  * Created `lib/explorer-indexer.ts`: Background indexer worker mapping trees, parsing dependencies, executing force-directed layouts, and calling AI summarization. Updates status to `indexed` or `failed`.
  * Rewrote `app/api/explorer/resolve/route.ts` to implement cache hit (serve directly from Mongo), stale cache (queue re-indexing asynchronously), and cache miss (create record with status `indexing` and start worker).
  * Created `app/api/explorer/status/[...key]/route.ts` status polling API.
  * Created `app/api/explorer/repo/refresh/route.ts` manual refresh API for signed-in users.
  * Refactored `app/(explorer)/explorer/page.tsx` search/resolve fetching to poll the status API on cache miss/indexing state and overlay progress text on the skeleton.

---

## Files Created (Phase 6)

* `models/SearchHistory.ts` — Search history Mongoose model.
* `lib/explorer-indexer.ts` — Explorer indexing background worker.
* `app/api/explorer/status/[...key]/route.ts` — Index status polling API.
* `app/api/explorer/repo/refresh/route.ts` — Manual repository refresh API.

---

## Files Modified (Phase 6)

* `models/PublicRepository.ts` — Added cache schema fields and TypeScript automatic timestamps.
* `lib/github.ts` — Added default branch HEAD SHA resolver.
* `app/api/explorer/resolve/route.ts` — Integrated asynchronous cache checking and worker.
* `app/api/explorer/repo/[...key]/route.ts` — Aligned response to standardized JSON shape.
* `app/(explorer)/explorer/page.tsx` - Integrated loading skeleton status overlay and polling interval logic.
* `files/phases.md` — Marked Phase 6 milestone completed.
* `files/Memory.md` — Updated for Phase 6 status.

---

## Files Deleted

* `app/api/explorer/repo/[...key]/refresh/route.ts` (deleted due to catch-all URL routing limitations; replaced by `/api/explorer/repo/refresh`).

---

## APIs

* `GET /api/explorer/search?q=query` — Public repo search suggestions.
* `POST /api/explorer/resolve` — Input resolution, cache management, and job enqueuing.
* `GET /api/explorer/status/[...key]` — Index status polling.
* `POST /api/explorer/repo/refresh` — Signed-in forced indexing.
* `GET /api/explorer/repo/[...key]` — Load fully indexed graph payload.

---

## Models

* **PublicRepository** (`publicrepositories` — stores Explorer cached metadata, graphs, and statuses)
* **SearchHistory** (`searchhistories` — stores user activity)

---

## Validation Results

* **Build**: ✅ Success (production build compiles cleanly)
* **TypeScript**: ✅ Success (0 compiler issues on clean cache)
* **ESLint**: ✅ Success (0 linting or styling violations)
* **Prettier**: ✅ Success (Formatted output matches config)

---

## Next Steps

* **Next Task**: Phase 7 — Task 1: Build the Explorer Dashboard UI.
* **Next Phase**: Phase 7 — Explorer Dashboard & Search Experience.
* **Current Project Progress**: Phase 6 Cache & Background Indexing is 100% complete and fully verified.
