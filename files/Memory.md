# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Status
Phase: **Phase 1 — Auth, Organizations & Repository Connection** (Completed)
Current file: *none - phase 1 complete*
Last updated: 2026-07-22

## Completed
- [x] Scaffold Next.js (App Router) + TypeScript project
- [x] Install and configure Tailwind CSS + shadcn/ui base components
- [x] Install Lucide React, Framer Motion, React Three Fiber + drei
- [x] Set up ESLint/Prettier config
- [x] Set up MongoDB connection (`lib/mongodb.ts`) against a dev database
- [x] Set up environment variable structure (`.env.local.example`)
- [x] Initialize Git repo, `main`/`dev` branch split, first commit
- [x] Deploy an empty "Hello CodeAtlas" shell to Vercel
- [x] Integrate Clerk Authentication (`<SignIn/>`, `<SignUp/>`, middleware) with GitHub OAuth as primary provider
- [x] Enable Clerk Organizations; build `(auth)` route group
- [x] Implement `Users` and `Organizations` Mongoose models
- [x] Implement Clerk webhook handler (`/api/webhooks/clerk`) syncing user/org/membership events into MongoDB
- [x] Build `(dashboard)` layout with middleware-protected routes
- [x] Implement GitHub OAuth repo listing + "Connect Repo" flow (`POST /api/repos`)
- [x] Implement `Repositories` Mongoose model
- [x] Build the empty-state dashboard ("Connect your first repository")
- [x] Tag release `v0.1.0`

## In Progress
*(nothing yet)*

## Next Up
- Phase 2 — Parsing Pipeline: Build GitHub content-fetching, tree/import graph parser, `Modules` model, sync action, health score calculation, and rate limiting.

## Notes / Deviations / Blockers
- **Clerk v7 Control Component**: In `@clerk/nextjs` v7, the `<SignedIn>` and `<SignedOut>` components are replaced/deprecated in favor of the unified `<Show>` component. Used `<Show when="signed-in" fallback={...}>` in `app/page.tsx`.
- **Lucide React GitHub Icon**: The `Github` brand logo is not exported by `lucide-react` v1.25.0 due to design alignment. Implemented a custom SVG `GitHubIcon` component in `app/(dashboard)/dashboard/page.tsx` for brand rendering.
- **Prettier formatting**: Standardized line endings and fixed cascading render issues in hooks via `useCallback` and `Promise.resolve().then(...)` deferred execution.
