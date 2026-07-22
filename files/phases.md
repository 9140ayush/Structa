# phases.md — Structa

Work exactly one task at a time, in order. Do not skip ahead to a later phase or task even if it looks easy or related. Each phase corresponds to a GitHub milestone (see below) and should end in a tagged release.

---

## Phase 0 — Project Setup
**Milestone:** `M0`

- [x] Scaffold Next.js (App Router) + TypeScript project
- [x] Install and configure Tailwind CSS + shadcn/ui base components
- [x] Install Lucide React, Framer Motion, React Three Fiber + drei
- [x] Set up ESLint/Prettier config
- [x] Set up MongoDB connection (`lib/mongodb.ts`) against a dev database
- [x] Set up environment variable structure (`.env.local.example`) for Clerk, MongoDB, GitHub, OpenAI, Stripe, Resend, Upstash
- [x] Initialize Git repo, `main`/`dev` branch split, first commit
- [x] Deploy an empty "Hello Structa" shell to Vercel to confirm the pipeline works end-to-end

---

## Phase 1 — Auth, Orgs & Repo Connection
**Milestone:** `M1`

- [ ] Integrate Clerk (`<SignIn/>`, `<SignUp/>`, middleware) with GitHub OAuth as primary provider
- [ ] Enable Clerk Organizations; build `(auth)` route group
- [ ] Implement `Users` and `Organizations` Mongoose models
- [ ] Implement Clerk webhook handler (`/api/webhooks/clerk`) syncing `user.created`/`user.updated`/org events into MongoDB
- [ ] Build `(dashboard)` layout with middleware-protected routes
- [ ] Implement GitHub OAuth repo listing + "Connect Repo" flow (`POST /api/repos`)
- [ ] Implement `Repositories` Mongoose model
- [ ] Build the empty-state dashboard ("Connect your first repo")
- [ ] Tag release `v0.1.0`

---

## Phase 2 — Parsing Pipeline
**Milestone:** `M2`

- [ ] Build the GitHub content-fetching layer (`lib/github.ts` via Octokit)
- [ ] Build the file/folder tree + import-graph parser (heuristic-based for JS/TS)
- [ ] Implement `Modules` Mongoose model and the sync Server Action (`POST /api/repos/[id]/sync`)
- [ ] Compute and persist `healthScore` per repository
- [ ] Build the repo dashboard grid (`RepoCard`, `HealthScoreRing`) with loading skeletons
- [ ] Add rate limiting (Upstash) to the sync endpoint
- [ ] Tag release `v0.2.0`

---

## Phase 3 — 3D Dependency Graph
**Milestone:** `M3`

- [ ] Build `DependencyGraphScene.tsx`, `Node.tsx`, `Edge.tsx` in React Three Fiber
- [ ] Implement server-side force-directed layout computation, exposed via `GET /api/repos/[id]/graph`
- [ ] Implement camera fly-to-node interaction (`useFrame` + damped lerp)
- [ ] Implement node sizing (by lines-of-code) and coloring (by complexity score)
- [ ] Implement dynamic import of the canvas (`ssr:false`) and loading skeleton state
- [ ] Implement Level-of-Detail reduction beyond ~500 nodes
- [ ] Apply Framer Motion micro-interactions (node hover glow, panel transitions) per `design.md`
- [ ] Tag release `v0.3.0`

---

## Phase 4 — AI Summaries & Chat
**Milestone:** `M4`

- [ ] Integrate OpenAI API for per-module summarization (triggered during sync)
- [ ] Build "Ask the Codebase" chat UI (`ChatPanel.tsx`, `MessageBubble.tsx`) with Vercel AI SDK streaming
- [ ] Implement `ChatSessions` Mongoose model and `POST /api/chat`
- [ ] Implement citation of specific modules in chat answers (clickable chips)
- [ ] Implement semantic code search input (debounced)
- [ ] Implement AI-generated README/architecture doc export
- [ ] Add rate limiting to `/api/chat`
- [ ] Tag release `v0.4.0`

---

## Phase 5 — Annotations, Snapshots & Analytics
**Milestone:** `M5`

- [ ] Implement `Annotations` model + `POST /api/annotations` / `DELETE /api/annotations/[id]`
- [ ] Implement sticky-note annotation UI pinned to 3D nodes
- [ ] Implement `Snapshots` model + versioned graph diffing on each sync
- [ ] Build the snapshots page with visual diff view
- [ ] Implement circular-dependency detection and complexity heatmap toggle
- [ ] Implement contributor activity timeline (via GitHub commits API)
- [ ] Build the analytics page (`GET /api/analytics/[repoId]`) — most-visited modules, contributor heatmap
- [ ] Tag release `v0.5.0`

---

## Phase 6 — Billing, RBAC Polish & Deploy
**Milestone:** `M6`

- [ ] Implement Stripe subscription billing (Free vs Pro/Org plans)
- [ ] Implement Stripe webhook handler (`/api/webhooks/stripe`)
- [ ] Enforce Admin/Editor/Viewer role gates server-side across all mutating actions
- [ ] Build the admin page (seat management, billing, audit log)
- [ ] Implement private repo support with encrypted token storage
- [ ] Add Resend email alerts for architecture-affecting changes
- [ ] Full pass on loading/error/empty states across all pages
- [ ] Final performance pass (LOD thresholds, caching TTLs, bundle size check)
- [ ] Production deploy to Vercel, verify all webhooks against production URLs
- [ ] Tag release `v1.0.0`

---

## Post-MVP Backlog (not scheduled into a phase yet)

Pulled from `PRD.md` Nice-to-Have list — do not start these before Phase 6 is tagged `v1.0.0` without an explicit scope-change discussion:

- VS Code extension
- Public shareable read-only map links
- "Repo health" README badge
- Space/void theme customization
- Voice narration of AI explanations
- Multi-language parsing (Python, Go, Rust)
