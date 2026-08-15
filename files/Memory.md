# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Current Status Overview

* **Current Phase**: Pre-Phase 9 System Audit & End-to-End Verification (Completed)
* **Latest Milestone**: `M8` (Phase 8 — Advanced Workspace Intelligence)
* **Tags Present**: `v0.1.0`, `v0.2.0`, `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`
* **Target Next Phase**: Phase 9 — Billing, RBAC & Private Repository Security

---

## Complete Phase Status Breakdown (Phases 0–8)

- [x] **Phase 0 — Project Setup & Environment**: App Router architecture, TypeScript, Tailwind, R3F, Clerk, MongoDB, `.env.local.example` templates.
- [x] **Phase 1 — Auth, Organizations & Repo Connection**: Clerk OAuth, webhooks (`user.created`/`user.updated`), Organization isolation, GitHub token listing, and repository connection (`POST /api/repos`).
- [x] **Phase 2 — Parsing Pipeline**: AST import extraction, JS/TS file tree parsing, CommonJS support, LOC calculation, complexity scoring, and repository health score calculation.
- [x] **Phase 3 — 3D Dependency Graph**: 3D force-directed layout engine (`lib/layout.ts`), spherical placement, cluster forces, R3F dynamic scene, camera fly-to controls, LOD thresholding (>500 nodes).
- [x] **Phase 4 — AI Intelligence Layer**: Reusable summarization service (`lib/ai/summarize.ts`), OpenAI batch processing, SSE streaming Q&A (`/api/chat`), grounded prompt engineering, `[[path:...]]` clickable citations, semantic search.
- [x] **Phase 5 — Repository Discovery & Explorer Foundations**: Repository URL resolver (`normalizeRepoUrl`), canonical key normalization (`owner/repo`), public repository validation, search API (`/api/explorer/search`), resolve API (`/api/explorer/resolve`).
- [x] **Phase 6 — Shared Repository Cache & Background Indexing**: `PublicRepositories` collection, asynchronous background worker (`lib/explorer-indexer.ts`), atomic locking & E11000 race condition handling, SHA freshness invalidation, status polling endpoint (`/api/explorer/status/[...key]`).
- [x] **Phase 7 — Explorer Dashboard & Search Experience**: Landing page (`/explorer`), popular/recent exploration grids, `IndexingProgress` visual stepper, mode switcher (`Workspace <-> Explorer`), grounded Q&A for public repos, Explorer analytics (`/api/explorer/analytics`).
- [x] **Phase 8 — Advanced Workspace Intelligence**: Sticky-note annotations (`/api/annotations`), commit snapshots (`/api/repos/[repoId]/snapshots`), 3D visual diff comparison dashboard (`/repos/[repoId]/snapshots`), Tarjan's SCC cycle detection engine, complexity heatmap, module visit logging (`ModuleVisit`), contributor activity timeline (`/repos/[repoId]/analytics`).
- [x] **System Audit & Manual QA**: `manual.md` QA checklist created; edge route protections added in `middleware.ts`; verified 0 errors across `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

---

## Validation Results

* **TypeScript**: ✅ Success (`npx tsc --noEmit` exits with 0 errors)
* **ESLint**: ✅ Success (`npm run lint` exits with 0 warnings/errors)
* **Build**: ✅ Success (`npm run build` generates production bundle cleanly)
* **Prettier**: ✅ Success (100% formatted)
* **Security & Authorization**: ✅ Strict organization boundaries enforced; private repos blocked from Explorer; edge API protection added in `middleware.ts`.
* **QA Guide**: ✅ `manual.md` created at project root.

---

## Next Steps

* **Next Phase**: Phase 9 — Billing, RBAC & Private Repository Security (Stripe subscription tiers, role-based access control, private repo access token encryption).
