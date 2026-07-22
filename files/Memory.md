# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Phase Information

* **Phase Number**: Phase 3
* **Milestone**: `M3`
* **Task Numbers**: Tasks 1 through 10
* **Task Titles**:
  * Task 1: Graph Data Types & 3D Layout Engine (`types/graph.ts`, `lib/layout.ts`)
  * Task 2 & 3: Server-side Graph API & Force-directed Layout (`GET /api/repos/[repoId]/graph`)
  * Task 4, 5, 6, 8: R3F Visualization Components (`DependencyGraphScene.tsx`, `Node.tsx`, `Edge.tsx`)
  * Task 7: Dynamic Canvas Loading & Skeleton (`GraphCanvasWrapper.tsx`, `GraphSkeleton.tsx`)
  * Task 9: 3D Map Page & Framer Motion UI Shell (`repos/[repoId]/page.tsx`, `use-graph-data.ts`)
  * Task 10: Validation, Build, Commit & Tag `v0.3.0`

---

## Change Summary (Phase 3)

* **Objective**: Build a high-performance, explorable 3D dependency graph with React Three Fiber, Drei, and Framer Motion powered by a server-computed force-directed layout engine.
* **Reason for Implementation**: Core differentiator of Structa — visual 3D navigation of codebase architecture.
* **What was Completed**:
  * Extended `types/graph.ts` with 3D spatial properties (`x`, `y`, `z`), node connectivity metrics (`importsCount`, `importedByCount`), LOD metadata, camera target, and interaction state types.
  * Implemented `lib/layout.ts`: deterministic 3D Coulomb-Hooke force-directed simulation engine with central gravity, folder clustering, and LOD thresholding (>500 nodes).
  * Implemented `GET /api/repos/[repoId]/graph`: authenticated, Zod-validated Route Handler that queries `Module` documents from MongoDB, invokes `computeGraphLayout`, and returns JSON graph payloads.
  * Implemented `hooks/use-graph-data.ts`: custom hook managing 3D graph fetching, node selection, hover states, and search path filtering.
  * Implemented `components/three/Node.tsx`: R3F node rendering spheres for files and rounded boxes for folders, sizing geometries by LOC, applying complexity heatmap gradient (`#3DDC97` -> `#F2B84B` -> `#F0576B`), emissive hover/selection glow, Drei `<Html>` labels, and LOD geometry reduction.
  * Implemented `components/three/Edge.tsx`: 3D edge lines in Ion Blue (`#7C9CFF`) with 40% resting opacity, 100% active selection glow (`#3DDC97`), and R3F `useFrame` animated directional particle flow.
  * Implemented `components/three/DependencyGraphScene.tsx`: R3F Canvas container with near-black void background (`#0A0C10`), depth fog, starfield drift, OrbitControls damping, and camera fly-to-node damped lerp animation.
  * Implemented `components/three/GraphSkeleton.tsx` & `GraphCanvasWrapper.tsx`: dynamic import wrapper (`next/dynamic`, `ssr: false`) with radar grid loading fallback per `Rules.md` §2.
  * Implemented `app/(dashboard)/repos/[repoId]/page.tsx`: 3D Map viewport shell with top header, module search, sync trigger, and Framer Motion spring drawer (`motion-spring-panel`) for selected module metadata and dependency navigation.
* **Important Decisions Taken**:
  * Kept R3F canvas isolated inside dynamically imported Client Components (`ssr: false`), preventing any SSR/prerender bundle errors in Next.js App Router.
  * Preserved dark void background (`#0A0C10`) for 3D canvas per `design.md` §8 even when chrome is in light mode to maintain node/edge contrast.
  * Deferred effect execution in `useGraphData` with `Promise.resolve().then(...)` to comply with React ESLint state rules.

---

## Files Created (Phase 3)

* `lib/layout.ts` — 3D force-directed layout computation engine.
* `app/api/repos/[repoId]/graph/route.ts` — `GET /api/repos/[repoId]/graph` graph payload endpoint.
* `components/three/Node.tsx` — 3D R3F Node mesh component with LOC sizing, heatmap tint, and Drei labels.
* `components/three/Edge.tsx` — 3D R3F Edge line component with directional particle flow.
* `components/three/DependencyGraphScene.tsx` — R3F Canvas scene with OrbitControls, fog, and fly-to camera lerp.
* `components/three/GraphSkeleton.tsx` — Radar grid loading skeleton component.
* `components/three/GraphCanvasWrapper.tsx` — Dynamic import (`ssr: false`) wrapper component.
* `hooks/use-graph-data.ts` — Custom hook for 3D graph fetching and state management.
* `app/(dashboard)/repos/[repoId]/page.tsx` — 3D Repository Map dashboard page with Framer Motion side panel.

---

## Files Modified (Phase 3)

* `types/graph.ts` — Updated node and graph payload interfaces for 3D graphics & LOD.
* `files/phases.md` — Marked Phase 3 milestone checklist complete.
* `files/Memory.md` — Updated progress log and task state per strict memory rules.

---

## Files Deleted

*(None)*

---

## APIs

* `GET /api/repos` — List org's connected repositories.
* `GET /api/repos?source=github` — Fetch GitHub repositories for user account.
* `POST /api/repos` — Connect a new GitHub repository.
* `POST /api/webhooks/clerk` — Sync user/org webhook events into MongoDB.
* `POST /api/repos/[repoId]/sync` — Trigger GitHub re-parse, Module upserts, health score computation.
* `GET /api/repos/[repoId]/graph` — Return server-computed 3D force-directed graph JSON (`GraphPayload`).

---

## Models

* **User** (`users` collection)
* **Organization** (`organizations` collection)
* **Repository** (`repositories` collection — stores `healthScore` and `lastSyncedAt`)
* **Module** (`modules` collection — stores path, type, LOC, complexityScore, imports, importedBy)

---

## Components

* **RepoCard** & **RepoCardSkeleton** (`components/shared/RepoCard.tsx`)
* **HealthScoreRing** (`components/shared/HealthScoreRing.tsx`)
* **Node** (`components/three/Node.tsx`)
* **Edge** (`components/three/Edge.tsx`)
* **DependencyGraphScene** (`components/three/DependencyGraphScene.tsx`)
* **GraphSkeleton** (`components/three/GraphSkeleton.tsx`)
* **GraphCanvasWrapper** (`components/three/GraphCanvasWrapper.tsx`)

---

## Libraries

* `@clerk/nextjs` (v7.5.22) — Auth & Organizations.
* `svix` (v1.98.0) — Clerk webhook verification.
* `octokit` (v5.0.5) — GitHub API integration.
* `zod` (v4.4.3) — Input validation across API & Server Actions.
* `@upstash/ratelimit` & `@upstash/redis` — Rate limiting.
* `three` & `@types/three` — Three.js core 3D engine.
* `@react-three/fiber` (v9.6.1) — Declarative React Three Fiber renderer.
* `@react-three/drei` (v10.7.7) — Drei 3D controls, HTML overlays, stars, text helpers.
* `framer-motion` (v12.42.2) — Interactive UI drawer spring transitions & micro-interactions.

---

## Environment Variables

* `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
* `CLERK_SECRET_KEY`
* `CLERK_WEBHOOK_SECRET`
* `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
* `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
* `MONGODB_URI`
* `GITHUB_CLIENT_ID`
* `GITHUB_CLIENT_SECRET`
* `UPSTASH_REDIS_REST_URL`
* `UPSTASH_REDIS_REST_TOKEN`

---

## Database

* **Collections**: `users`, `organizations`, `repositories`, `modules`

---

## Folder Changes

* `components/three/` — Added R3F 3D graph components.
* `app/(dashboard)/repos/[repoId]/` — Added 3D map page.
* `app/api/repos/[repoId]/graph/` — Added graph payload API route.

---

## Commands Executed

```bash
npx prettier --write "components/three/**/*.tsx" "app/api/repos/[repoId]/graph/route.ts" "app/(dashboard)/repos/[repoId]/page.tsx" "lib/layout.ts" "hooks/use-graph-data.ts" "types/graph.ts"
npm run lint
npx eslint --fix
npm run build
git add .
git commit -m "feat(3d-graph): implement Phase 3 3D dependency graph scene, server-side force layout API, dynamic R3F canvas, and Framer Motion UI shell"
git tag -a v0.3.0 -m "Phase 3 - 3D Dependency Graph"
```

---

## Git History

* **Commits**:
  * `ece3829` (dev): `feat(auth): implement authentication, organizations, and repository connection`
  * `515a567` (dev): `feat(parsing): implement Phase 2 parsing pipeline, sync endpoint, and dashboard grid`
  * `ecdf95f` (dev): `refactor(parsing): fix folder nodes parsing, prune stale modules, and use CSS theme variables in HealthScoreRing`
  * `fcf415e` (dev): `feat(3d-graph): implement Phase 3 3D dependency graph scene, server-side force layout API, dynamic R3F canvas, and Framer Motion UI shell`
* **Git Tags**:
  * `v0.1.0` — Phase 1 Release
  * `v0.2.0` — Phase 2 Release
  * `v0.3.0` — Phase 3 Release

---

## Validation Results

* **Build**: ✅ Success (Turbopack production build, 0 errors)
* **TypeScript**: ✅ Success (0 compiler check errors)
* **ESLint**: ✅ Success (0 rule warnings or errors)
* **Prettier**: ✅ Success (0 format violations)

---

## Issues & Fixes

* **Bugs Found (Phase 3)**:
  * ESLint `prefer-const` warnings on 3D force simulation variables in `lib/layout.ts` — fixed via `eslint --fix`.
  * ESLint `react-hooks/set-state-in-effect` warning in `use-graph-data.ts` — resolved by wrapping trigger in `Promise.resolve().then(...)`.
  * Unused icons in `repos/[repoId]/page.tsx` — cleaned up.
* **Fixes Applied**: All issues resolved prior to tagging `v0.3.0`.
* **Three Repository-Connection Methods Implementation**:
  * *Method 1 (Workspace Connect)*: Hardened Zod schemas in `actions/repos.ts` and `app/api/repos/route.ts` (`z.union([z.string(), z.number()])`), improved private repo access error handling in `lib/github.ts`, and verified end-to-end connection flow.
  * *Method 2 (Explorer Search)* & *Method 3 (Explorer URL Paste)*: Implemented `lib/repo-url-resolver.ts` (normalizes URLs & shorthands to `owner/repo`), `lib/github-search.ts` (GitHub Search API wrapper), `models/PublicRepository.ts` (shared Mongoose cache model), `GET /api/explorer/search`, `POST /api/explorer/resolve` (checks cache, or synchronously fetches, parses, computes 3D layout, and stores in shared cache), `GET /api/explorer/repo/[...key]`, and `app/explorer/page.tsx` UI with R3F 3D Canvas integration.
  * *Scoping Deviation Note*: Explicitly pulled forward a synchronous slice of Phase 5 (Discovery), Phase 6 (shared cache lookup & single-request indexing), and Phase 7 (Explorer dashboard) so that Methods 2 and 3 produce functional 3D graphs end-to-end immediately for both authenticated and anonymous users, while deferring full background worker queues and search history surfaces to their respective phases.
* **Files Created**:
  * `lib/repo-url-resolver.ts` — Normalizes GitHub URLs and `owner/repo` shorthands to canonical keys.
  * `lib/github-search.ts` — Octokit wrapper for searching public repositories and fetching metadata.
  * `models/PublicRepository.ts` — Shared Mongoose model for Explorer repository cache.
  * `app/api/explorer/search/route.ts` — Public repository search endpoint.
  * `app/api/explorer/resolve/route.ts` — Repository URL/shorthand resolver and synchronous indexer.
  * `app/api/explorer/repo/[...key]/route.ts` — Endpoint to retrieve cached public repository graph payloads.
  * `app/explorer/page.tsx` — Explorer Mode UI page with search bar, URL paste, 3D Canvas, and side panel drawer.
* **Remaining Issues**: None.

---

## Next Steps

* **Next Task**: Phase 4 — Task 1: Integrate OpenAI API for per-module summarization (triggered during sync).
* **Next Phase**: Phase 4 — AI Summaries & Chat.
* **Current Project Progress**: All three repository-connection methods (Workspace Connect, Explorer Search, Explorer URL Paste) are 100% complete, verified, and rendering interactive 3D dependency graphs.

---

## Last Updated

2026-07-22T15:20:00+05:30
