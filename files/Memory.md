# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Phase Information

* **Phase Number**: Phase 2
* **Milestone**: `M2`
* **Task Numbers**: Tasks 1 through 7
* **Task Titles**:
  * Task 1: Build GitHub content-fetching layer (`lib/github.ts`)
  * Task 2: Build file/folder tree + import-graph parser (`lib/parser.ts`)
  * Task 3: Implement `Module` Mongoose model + sync Route Handler + Server Actions + graph types
  * Task 4: Compute and persist `healthScore` per repository (embedded in Task 3 sync route)
  * Task 5: Build repo dashboard grid (`RepoCard`, `HealthScoreRing`) with loading skeletons
  * Task 6: Add Upstash rate limiting to the sync endpoint (`lib/ratelimit.ts`)
  * Task 7: Verify build/lint/TypeScript, commit, tag `v0.2.0`

---

## Change Summary

* **Objective**: Build the core data pipeline that transforms a connected GitHub repository into a parsed, health-scored, and grid-displayed set of modules, ready for Phase 3's 3D renderer.
* **Reason for Implementation**: Phase 2 is the backbone of the product — without parsing, there is no graph data to visualise or query.
* **What was Completed**:
  * GitHub content-fetching layer with recursive tree retrieval and batch file download (concurrency-limited).
  * Heuristic JS/TS import-graph parser (regex-based, no AST/Babel/compiler).
  * `Module` Mongoose model with per-file complexity scores and import/importedBy references.
  * `POST /api/repos/[repoId]/sync` route that orchestrates the full pipeline and persists modules + health score.
  * Health score formula: `100 - avgComplexity×3 - edgeDensity×30`, clamped to `[0, 100]`.
  * `RepoCard` component with Framer Motion hover/tap, animated `HealthScoreRing`, and sync button.
  * `HealthScoreRing` animated SVG progress ring using design.md colour tokens.
  * Dashboard grid updated to use `RepoCard` components with `RepoCardSkeleton` loading states.
  * Upstash Redis rate limiter (5 syncs/user/hour, fail-open).
  * Global `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` stubs.
  * `actions/repos.ts` server actions for `connectRepo` and `deleteRepo`.
  * `types/graph.ts` shared TypeScript types for graph data structures.
* **Important Decisions Taken**:
  * Sync runs **synchronously inline** — no external job queue is in the approved stack for this phase. Returns `{status: "synced"}` (not "queued"). Background queuing is a Phase 5+ concern.
  * File parse limited to **500 files** per sync for MVP performance. Large monorepos will be partial (truncation is logged server-side).
  * Upstash rate limiter uses **fail-open policy**: if Redis is unreachable or env vars are placeholders, the request is allowed through with a warning header.
  * Used `zod` `.issues` (not `.errors`) for `ZodError` field access — this version of Zod exposes `issues`, not `errors`.

---

## Files Created (Phase 2)

* `lib/github.ts` — Octokit wrapper: `getRepoTree`, `getFileContent`, `getBatchFileContents`.
* `lib/parser.ts` — Heuristic parser: `buildFileTree`, `extractRawImports`, `resolveImport`, `buildImportGraph`, `parseRepository`, `computeHealthScore`.
* `lib/ratelimit.ts` — Upstash Redis rate limiter config (`syncLimiter`, `chatLimiter` stub).
* `models/Module.ts` — Module Mongoose schema (repoId, path, type, loc, complexityScore, imports, importedBy).
* `app/api/repos/[repoId]/sync/route.ts` — `POST` sync Route Handler (full pipeline orchestrator).
* `actions/repos.ts` — Server Actions: `connectRepo`, `deleteRepo`.
* `types/graph.ts` — TypeScript types: `GraphNode`, `GraphEdge`, `GraphPayload`, `SyncStatus`, `SyncResult`.
* `components/shared/RepoCard.tsx` — `RepoCard` + `RepoCardSkeleton` components.
* `components/shared/HealthScoreRing.tsx` — Animated SVG health score ring.
* `app/loading.tsx` — Global loading fallback.
* `app/error.tsx` — Global error boundary with retry.
* `app/not-found.tsx` — Global 404 page.

---

## Files Modified (Phase 2)

* `app/(dashboard)/dashboard/page.tsx`
  * *Reason*: Replaced ad-hoc inline repo list with `RepoCard` grid and `RepoCardSkeleton`, added `handleSync` callback.
* `.env.local.example`
  * *Reason*: Added missing `CLERK_WEBHOOK_SECRET` entry.
* `files/Memory.md`
  * *Reason*: Keep progress and historical decisions synchronised.
* `files/phases.md`
  * *Reason*: Mark Phase 2 checklist items complete.

---

## Files Deleted

*(None)*

---

## APIs

* `GET /api/repos`
  * *Purpose*: List the repositories connected to the active organization.
* `GET /api/repos?source=github`
  * *Purpose*: Fetch available repositories from the user's GitHub account via Octokit.
* `POST /api/repos`
  * *Purpose*: Connect a new GitHub repository to the active organization in MongoDB.
* `POST /api/webhooks/clerk`
  * *Purpose*: Listen and parse Clerk user, organization, and membership sync events.
* `POST /api/repos/[repoId]/sync`
  * *Purpose*: Trigger a full re-parse of a connected repository. Fetches GitHub tree, downloads JS/TS files, runs heuristic parser, upserts Module documents, persists health score. Rate-limited (5/hour/user).

---

## Models

* **User**
  * *Collection*: `users`
  * *Purpose*: Store user profile information, plans, and Clerk mapping IDs.
* **Organization**
  * *Collection*: `organizations`
  * *Purpose*: Mirror organization context, ownership mappings, and seat roles.
* **Repository**
  * *Collection*: `repositories`
  * *Purpose*: Connect GitHub repository identifiers to active workspace contexts. Stores `healthScore` and `lastSyncedAt`.
* **Module**
  * *Collection*: `modules`
  * *Purpose*: Store per-file/folder parse results: path, type, LOC, complexity score, import/importedBy references. Compound-indexed on `{repoId, path}`.

---

## Components

* **RepoCard** + **RepoCardSkeleton**
  * *File*: `components/shared/RepoCard.tsx`
  * *Purpose*: Displays a connected repository with name, private/public badge, health ring, last synced date, and a sync button. Skeleton for loading states.
* **HealthScoreRing**
  * *File*: `components/shared/HealthScoreRing.tsx`
  * *Purpose*: Animated SVG circular progress ring showing repo health (0–100) using design.md colour tokens.
* **OrganizationSwitcher** & **UserButton** (Clerk SDK integrations)
  * *File*: `app/(dashboard)/layout.tsx`
  * *Purpose*: Workspace switcher and user profile controls.
* **OrganizationList** (Clerk SDK integration)
  * *File*: `app/(dashboard)/dashboard/page.tsx`
  * *Purpose*: Workspace creation and selector container when no active org is active.

---

## Libraries

* `@clerk/nextjs` (v7.5.22) — Authentication, routing guards, and session providers.
* `svix` (v1.98.0) — Verify Clerk webhook signatures.
* `octokit` (v5.0.5) — Connect and query the GitHub REST API.
* `zod` — Input validation for all Server Actions and Route Handlers. Use `.issues` not `.errors` on `ZodError`.
* `@upstash/ratelimit` — Fixed-window rate limiting for sync and chat endpoints.
* `@upstash/redis` — Redis client for Upstash.

---

## Environment Variables

* `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk client publication key.
* `CLERK_SECRET_KEY` — Clerk server secret key.
* `CLERK_WEBHOOK_SECRET` — Clerk webhook signature verification secret.
* `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — Path for sign-in router redirection.
* `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — Path for sign-up router redirection.
* `MONGODB_URI` — Database connection URI.
* `GITHUB_CLIENT_ID` — GitHub OAuth client identifier.
* `GITHUB_CLIENT_SECRET` — GitHub OAuth secret key.
* `UPSTASH_REDIS_REST_URL` — Upstash Redis REST endpoint URL.
* `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST authentication token.

---

## Database

* **Collections**: `users`, `organizations`, `repositories`, `modules`
* **Relationships**:
  * `repositories` references `organizations` (`orgId` → `organizations._id`).
  * `modules` references `repositories` (`repoId` → `repositories._id`).
  * `modules` self-references for `imports` and `importedBy` arrays.
  * `organizations` references `users` as owner (`ownerId` → `users._id`).
  * `organizations` contains a list of member users (`members.userId` → `users._id`).
* **Schema Updates**: Added `Module` model with compound unique index on `{repoId, path}`.

---

## Folder Changes

* `app/(auth)/` — Auth route group routing.
* `app/(dashboard)/` — Dashboard interface layout routing.
* `app/api/webhooks/clerk/` — Webhooks API path.
* `app/api/repos/` — Repository endpoints.
* `app/api/repos/[repoId]/sync/` — Sync endpoint (NEW Phase 2).
* `models/` — Database schema files.
* `components/shared/` — Shared UI components (NEW Phase 2).
* `actions/` — Server Actions (NEW Phase 2).
* `types/` — TypeScript type definitions (NEW Phase 2).

---

## Commands Executed

```bash
npm install zod @upstash/ratelimit @upstash/redis
npx prettier --write "app/(dashboard)/dashboard/page.tsx" "app/api/repos/[repoId]/sync/route.ts" "lib/github.ts" "lib/parser.ts"
npm run lint
npm run build
git add .
git commit -m "feat(parsing): implement Phase 2 parsing pipeline, sync endpoint, and dashboard grid"
git tag -a v0.2.0 -m "Phase 2 - Parsing Pipeline"
```

---

## Git History

* **Commits**:
  * `ece3829` (dev): `feat(auth): implement authentication, organizations, and repository connection`
  * `515a567` (dev): `feat(parsing): implement Phase 2 parsing pipeline, sync endpoint, and dashboard grid`
* **Git Tags**:
  * `v0.1.0` — Phase 1: Auth, Organizations & Repository Connection
  * `v0.2.0` — Phase 2: Parsing Pipeline

---

## Validation

* **Build**: ✅ Success (Turbopack, 0 errors)
* **TypeScript**: ✅ Success (0 compiler check errors)
* **ESLint**: ✅ Success (0 rule warnings or errors)
* **Prettier**: ✅ Success (0 format violations)

---

## Issues

* **Bugs Found (Phase 2)**:
  * `ZodError` in this version of Zod exposes `.issues` not `.errors`. Two occurrences required fixing (actions/repos.ts and sync route).
  * Removed `Check`, `Lock`, `Globe`, `ExternalLink`, `ChevronRight` icons from dashboard page imports but `Check` was still used in the modal success state — restored.
  * Unused `FileContent` import in `lib/parser.ts` caused ESLint warning — removed.
  * Several Prettier formatting differences between generated code and project config — fixed with `--write`.
* **Fixes Applied**: All issues resolved before tagging.
* **Remaining Issues**: None.

---

## Next Steps

* **Next Task**: Phase 3 — Task 1: Build `DependencyGraphScene.tsx`, `Node.tsx`, `Edge.tsx` in React Three Fiber.
* **Next Phase**: Phase 3 — 3D Dependency Graph.
* **Current Project Progress**: Phase 2 is 100% complete and fully verified (`v0.2.0` tagged).

---

## Last Updated

2026-07-22T13:02:00+05:30
