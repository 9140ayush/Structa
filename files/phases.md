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

- [x] Integrate Clerk (`<SignIn/>`, `<SignUp/>`, middleware) with GitHub OAuth as primary provider
- [x] Enable Clerk Organizations; build `(auth)` route group
- [x] Implement `Users` and `Organizations` Mongoose models
- [x] Implement Clerk webhook handler (`/api/webhooks/clerk`) syncing `user.created`/`user.updated`/org events into MongoDB
- [x] Build `(dashboard)` layout with middleware-protected routes
- [x] Implement GitHub OAuth repo listing + "Connect Repo" flow (`POST /api/repos`)
- [x] Implement `Repositories` Mongoose model
- [x] Build the empty-state dashboard ("Connect your first repo")
- [x] Tag release `v0.1.0`

---

## Phase 2 — Parsing Pipeline
**Milestone:** `M2`

- [x] Build the GitHub content-fetching layer (`lib/github.ts` via Octokit)
- [x] Build the file/folder tree + import-graph parser (heuristic-based for JS/TS)
- [x] Implement `Modules` Mongoose model and the sync Server Action (`POST /api/repos/[id]/sync`)
- [x] Compute and persist `healthScore` per repository
- [x] Build the repo dashboard grid (`RepoCard`, `HealthScoreRing`) with loading skeletons
- [x] Add rate limiting (Upstash) to the sync endpoint
- [x] Tag release `v0.2.0`

---

## Phase 3 — 3D Dependency Graph
**Milestone:** `M3`

- [x] Build `DependencyGraphScene.tsx`, `Node.tsx`, `Edge.tsx` in React Three Fiber
- [x] Implement server-side force-directed layout computation, exposed via `GET /api/repos/[id]/graph`
- [x] Implement camera fly-to-node interaction (`useFrame` + damped lerp)
- [x] Implement node sizing (by lines-of-code) and coloring (by complexity score)
- [x] Implement dynamic import of the canvas (`ssr:false`) and loading skeleton state
- [x] Implement Level-of-Detail reduction beyond ~500 nodes
- [x] Apply Framer Motion micro-interactions (node hover glow, panel transitions) per `design.md`
- [x] Tag release `v0.3.0`

---

# Phase 4 and Beyond — Redesigned Roadmap

Phases 0–3 above are final and locked. Everything below is a ground-up redesign of the roadmap that follows, evolving Structa from a single-mode repository visualizer into a production-grade **GitHub Architecture Explorer** with two coexisting, first-class experiences: **Workspace Mode** (repos the authenticated user has access to) and **Explorer Mode** (any public GitHub repository, backed by a shared cache).

The sequencing below is deliberate: AI intelligence ships first because both modes depend on it; Explorer's discovery-and-cache foundation ships before its dashboard, because there's nothing to browse without it; Workspace's deeper collaboration features and monetization land once both core experiences exist; and the roadmap closes with the production-hardening pass a real launch requires.

---

## Phase 4 — AI Intelligence Layer
**Milestone:** `M4 — Intelligence Core`
**Depends on:** Phase 2 (Parsing Pipeline), Phase 3 (Dependency Graph)
**Unlocks:** Phase 5 (Explorer needs the same AI pipeline), Phase 8 (contributor/complexity insights build on module summaries)

This phase builds the AI layer once, correctly, so that both Workspace and Explorer Mode can consume it identically in later phases — no separate AI implementation is built twice.

- [ ] Integrate OpenAI API for per-module summarization (triggered during sync)
- [ ] Design the summarization pipeline as a reusable service (`lib/ai/summarize.ts`), not repo-coupled, so Explorer's background indexing can call the same function in Phase 6
- [ ] Build "Ask the Codebase" chat UI (`ChatPanel.tsx`, `MessageBubble.tsx`) with Vercel AI SDK streaming
- [ ] Implement `ChatSessions` Mongoose model and `POST /api/chat`
- [ ] Implement citation of specific modules in chat answers (clickable chips linking back to 3D nodes)
- [ ] Implement semantic code search input (debounced, grounded in module summaries/embeddings)
- [ ] Implement AI-generated README/architecture doc export
- [ ] Add rate limiting to `/api/chat` and the summarization trigger (Upstash)
- [ ] Add graceful AI-failure handling (timeout → fallback message; never block graph rendering on AI failure)
- [ ] Tag release `v0.4.0`

---

## Phase 5 — Repository Discovery & Explorer Foundations
**Milestone:** `M5 — Discovery Layer`
**Depends on:** Phase 4 (reuses the summarization service as a black box)
**Unlocks:** Phase 6 (cache needs validated, normalized repos to key against), Phase 7 (dashboard needs an entry point)

This phase introduces Explorer Mode's front door — search and URL analysis — without yet building the cache or dashboard behind it. Both entry methods converge on one resolver so downstream phases only integrate once.

- [ ] Build the GitHub Search Service (`lib/github-search.ts`) wrapping the GitHub Search API via Octokit
- [ ] Build the Repository URL Resolver (`lib/repo-url-resolver.ts`) — accepts full URLs, `github.com/owner/repo`, or bare `owner/repo` shorthand
- [ ] Implement repository validation (must be public and accessible; reject private/non-existent repos before any downstream work)
- [ ] Implement repository metadata fetch (description, stars, primary language, last-updated, default branch)
- [ ] Normalize all accepted input formats to one canonical key (`owner/repo`, lowercased) — this is the join key every later phase (cache, history, analytics) will use
- [ ] Implement `GET /api/explorer/search` (Method 1 — search by name/owner)
- [ ] Implement `POST /api/explorer/resolve` (Method 2 — analyze by URL/shorthand)
- [ ] Scaffold the `(explorer)` route group and layout (search bar + URL input, no dashboard/org chrome yet)
- [ ] Implement error states for invalid URLs, private repos, and repos that don't exist
- [ ] Tag release `v0.5.0`

---

## Phase 6 — Shared Repository Cache & Background Indexing Engine
**Milestone:** `M6 — Cache & Indexing Engine`
**Depends on:** Phase 4 (AI pipeline being called), Phase 5 (canonical key + validation)
**Unlocks:** Phase 7 (dashboard reads from this cache)

The cache is Explorer Mode's entire cost-control and scalability strategy. This phase is infrastructure-heavy and deliberately ships before any Explorer UI is user-facing beyond search.

- [ ] Implement `PublicRepositories` Mongoose model (shared cache: metadata, `indexStatus`, `graphJson`, `moduleSummaries`, `healthScore`, `lastCommitShaAtIndex`, `exploreCount`)
- [ ] Implement `SearchHistory` Mongoose model
- [ ] Build the cache-lookup workflow: canonical key → indexed & fresh? → serve vs. queue indexing
- [ ] Build the background indexing worker/queue (Vercel Cron or scheduled Route Handler + job-status table) so indexing never runs inline in a user-facing request
- [ ] Wire the indexing worker to reuse the Phase 2 parser, Phase 3 graph generator, and Phase 4 AI summarizer against `PublicRepositories` instead of `Repositories`
- [ ] Implement indexing-status polling (`GET /api/explorer/status/[canonicalKey]`)
- [ ] Implement a concurrency lock so two simultaneous requests for the same uncached repo don't trigger duplicate indexing jobs
- [ ] Implement duplicate detection (different URL formats for the same repo must resolve to the same cache entry)
- [ ] Implement cache invalidation based on default-branch HEAD SHA comparison (not a fixed TTL)
- [ ] Implement manual repository refresh (`POST /api/explorer/repo/[canonicalKey]/refresh`, signed-in only, forces re-index regardless of SHA match)
- [ ] Implement cached-graph reuse (serve `graphJson`/`moduleSummaries` directly on cache hit — no recomputation)
- [ ] Document repository lifecycle states (`not_indexed` → `indexing` → `indexed` / `failed`) and their transitions
- [ ] Tag release `v0.6.0`

---

## Phase 7 — Explorer Dashboard & Search Experience
**Milestone:** `M7 — Explorer Experience`
**Depends on:** Phase 5 (discovery), Phase 6 (cache)
**Unlocks:** nothing downstream is blocked on this — it's the first fully user-facing Explorer milestone

This phase makes Explorer Mode a complete, polished, first-class experience — visually and functionally consistent with Workspace's existing 3D graph and chat, just pointed at a different data source.

- [ ] Build `explorer/[canonicalKey]/page.tsx`, reusing `DependencyGraphScene`, `Node`, `Edge`, and `ChatPanel` from Workspace Mode against cached Explorer data
- [ ] Implement `GET /api/explorer/repo/[canonicalKey]` (serve cached graph + summaries)
- [ ] Build `IndexingProgress.tsx` for the first-time (cache-miss) experience — validate → fetch → parse → graph → summarize, shown as real progress, not a blank spinner
- [ ] Implement the Popular Repositories surface (`GET /api/explorer/popular`, most-explored across all users)
- [ ] Implement Recently Explored (signed-in) and Search History surfaces (`GET /api/explorer/recent`)
- [ ] Add a persistent Workspace/Explorer mode switcher to the main navigation shell
- [ ] Implement `GET /api/explorer/analytics` (cache hit rate, top explored repos, search volume)
- [ ] Confirm Explorer intentionally excludes annotations, snapshots, and org analytics (Workspace-exclusive by product design)
- [ ] Full loading/error/empty-state pass across all Explorer pages and components
- [ ] Tag release `v0.7.0`

---

## Phase 8 — Advanced Workspace Intelligence
**Milestone:** `M8 — Workspace Depth`
**Depends on:** Phase 4 (module summaries feed contributor/complexity insights)
**Unlocks:** Phase 9 (RBAC gates some of these features by role)

With both core experiences live, this phase deepens Workspace Mode's differentiation for teams — the collaboration and governance features that don't make sense in a public, single-viewer Explorer context.

- [ ] Implement `Annotations` model + `POST /api/annotations` / `DELETE /api/annotations/[id]`
- [ ] Implement sticky-note annotation UI pinned to 3D nodes
- [ ] Implement `Snapshots` model + versioned graph diffing on each sync
- [ ] Build the snapshots page with visual diff view
- [ ] Implement circular-dependency detection and highlighting in the 3D graph
- [ ] Implement cyclomatic-complexity heatmap toggle (reusing the same complexity scoring used for node coloring since Phase 3)
- [ ] Implement contributor activity timeline mapped onto modules (via GitHub commits API)
- [ ] Build the Workspace analytics page (`GET /api/analytics/[repoId]`) — most-visited modules, contributor heatmap
- [ ] Tag release `v0.8.0`

---

## Phase 9 — Billing, RBAC & Private Repository Security
**Milestone:** `M9 — Monetization & Access Control`
**Depends on:** Phase 1 (Organizations model), Phase 8 (features being gated)
**Unlocks:** Phase 10 (production deploy assumes billing/security are final)

- [ ] Implement Stripe subscription billing (Free vs. Pro/Org plans)
- [ ] Implement Stripe webhook handler (`/api/webhooks/stripe`)
- [ ] Enforce Admin/Editor/Viewer role gates server-side across all mutating actions (repo connect, sync, annotate, billing management)
- [ ] Build the admin page (seat management, billing, audit log)
- [ ] Implement private repo support with encrypted token storage at rest
- [ ] Add Resend email alerts for architecture-affecting changes and billing events
- [ ] Confirm Explorer Mode has zero path to private-repository data (defense-in-depth check against Phase 5's validation step)
- [ ] Tag release `v0.9.0`

---

## Phase 10 — Production Hardening, Deployment & Scalability
**Milestone:** `M10 — Production Readiness`
**Depends on:** all prior phases
**Unlocks:** `v1.0.0` launch

The closing phase treats both modes as one product for QA and performance purposes — this is where Structa is proven ready for real, concurrent, public traffic rather than just feature-complete.

- [ ] Full performance pass: LOD thresholds, `unstable_cache` TTLs, bundle-size audit, dynamic-import boundaries for 3D/AI-heavy components
- [ ] Load-test the Explorer background indexing pipeline for concurrent first-time requests on the same popular repository
- [ ] Load-test Workspace sync under multiple simultaneous org syncs
- [ ] Add monitoring/observability: error tracking, structured logging, uptime checks, and alerting on indexing-job failure rate
- [ ] Add scalability review: MongoDB index audit (canonical key, org/user lookups), connection pooling, and a plan for horizontal scaling of the indexing worker
- [ ] Full cross-mode loading/error/empty-state audit (Workspace and Explorer together, not just individually)
- [ ] Security pass: re-verify webhook signature checks, rate-limit coverage, and secret handling across every endpoint added since Phase 4
- [ ] Production deploy to Vercel; verify all webhooks (GitHub, Clerk, Stripe) against production URLs
- [ ] Cross-mode regression pass confirming Explorer Mode's addition has not altered any Workspace Mode behavior
- [ ] Tag release `v1.0.0`

---

## Post-MVP Backlog (not scheduled into a phase yet)

Do not start these before Phase 10 is tagged `v1.0.0` without an explicit scope-change discussion:

- VS Code extension that syncs cursor position to the 3D map
- Public shareable read-only map links (Workspace)
- "Repo health" README badge
- Space/void theme customization for the 3D canvas
- Voice narration of AI module explanations
- Multi-language parsing (Python, Go, Rust, in addition to JS/TS)
- Explorer browser extension ("Explore this repo in Structa" button on GitHub itself)
- Explorer embed widget for blog posts/documentation sites
- GitLab/Bitbucket support for Explorer Mode
- Explorer-side crowd-sourced annotations (deferred — requires a moderation strategy first)
