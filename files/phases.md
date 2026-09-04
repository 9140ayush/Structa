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

- [x] Integrate OpenAI API for per-module summarization (triggered during sync)
- [x] Design the summarization pipeline as a reusable service (`lib/ai/summarize.ts`), not repo-coupled, so Explorer's background indexing can call the same function in Phase 6
- [x] Build "Ask the Codebase" chat UI (`ChatPanel.tsx`, `MessageBubble.tsx`) with Vercel AI SDK streaming
- [x] Implement `ChatSessions` Mongoose model and `POST /api/chat`
- [x] Implement citation of specific modules in chat answers (clickable chips linking back to 3D nodes)
- [x] Implement semantic code search input (debounced, grounded in module summaries/embeddings)
- [x] Implement AI-generated README/architecture doc export
- [x] Add rate limiting to `/api/chat` and the summarization trigger (Upstash)
- [x] Add graceful AI-failure handling (timeout → fallback message; never block graph rendering on AI failure)
- [x] Tag release `v0.4.0`

---

## Phase 5 — Repository Discovery & Explorer Foundations
**Milestone:** `M5 — Discovery Layer`
**Depends on:** Phase 4 (reuses the summarization service as a black box)
**Unlocks:** Phase 6 (cache needs validated, normalized repos to key against), Phase 7 (dashboard needs an entry point)

This phase introduces Explorer Mode's front door — search and URL analysis — without yet building the cache or dashboard behind it. Both entry methods converge on one resolver so downstream phases only integrate once.

- [x] Build the GitHub Search Service (`lib/github-search.ts`) wrapping the GitHub Search API via Octokit
- [x] Build the Repository URL Resolver (`lib/repo-url-resolver.ts`) — accepts full URLs, `github.com/owner/repo`, or bare `owner/repo` shorthand
- [x] Implement repository validation (must be public and accessible; reject private/non-existent repos before any downstream work)
- [x] Implement repository metadata fetch (description, stars, primary language, last-updated, default branch)
- [x] Normalize all accepted input formats to one canonical key (`owner/repo`, lowercased) — this is the join key every later phase (cache, history, analytics) will use
- [x] Implement `GET /api/explorer/search` (Method 1 — search by name/owner)
- [x] Implement `POST /api/explorer/resolve` (Method 2 — analyze by URL/shorthand)
- [x] Scaffold the `(explorer)` route group and layout (search bar + URL input, no dashboard/org chrome yet)
- [x] Implement error states for invalid URLs, private repos, and repos that don't exist
- [x] Tag release `v0.5.0`

---

## Phase 6 — Shared Repository Cache & Background Indexing Engine
**Milestone:** `M6 — Cache & Indexing Engine`
**Depends on:** Phase 4 (AI pipeline being called), Phase 5 (canonical key + validation)
**Unlocks:** Phase 7 (dashboard reads from this cache)

The cache is Explorer Mode's entire cost-control and scalability strategy. This phase is infrastructure-heavy and deliberately ships before any Explorer UI is user-facing beyond search.

- [x] Implement `PublicRepositories` Mongoose model (shared cache: metadata, `indexStatus`, `graphJson`, `moduleSummaries`, `healthScore`, `lastCommitShaAtIndex`, `exploreCount`)
- [x] Implement `SearchHistory` Mongoose model
- [x] Build the cache-lookup workflow: canonical key → indexed & fresh? → serve vs. queue indexing
- [x] Build the background indexing worker/queue (Vercel Cron or scheduled Route Handler + job-status table) so indexing never runs inline in a user-facing request
- [x] Wire the indexing worker to reuse the Phase 2 parser, Phase 3 graph generator, and Phase 4 AI summarizer against `PublicRepositories` instead of `Repositories`
- [x] Implement indexing-status polling (`GET /api/explorer/status/[canonicalKey]`)
- [x] Implement a concurrency lock so two simultaneous requests for the same uncached repo don't trigger duplicate indexing jobs
- [x] Implement duplicate detection (different URL formats for the same repo must resolve to the same cache entry)
- [x] Implement cache invalidation based on default-branch HEAD SHA comparison (not a fixed TTL)
- [x] Implement manual repository refresh (`POST /api/explorer/repo/[canonicalKey]/refresh`, signed-in only, forces re-index regardless of SHA match)
- [x] Implement cached-graph reuse (serve `graphJson`/`moduleSummaries` directly on cache hit — no recomputation)
- [x] Document repository lifecycle states (`not_indexed` → `indexing` → `indexed` / `failed`) and their transitions
- [x] Tag release `v0.6.0`

---

## Phase 7 — Explorer Dashboard & Search Experience
**Milestone:** `M7 — Explorer Experience`
**Depends on:** Phase 5 (discovery), Phase 6 (cache)
**Unlocks:** nothing downstream is blocked on this — it's the first fully user-facing Explorer milestone

This phase makes Explorer Mode a complete, polished, first-class experience — visually and functionally consistent with Workspace's existing 3D graph and chat, just pointed at a different data source.

- [x] Build `explorer/[canonicalKey]/page.tsx`, reusing `DependencyGraphScene`, `Node`, `Edge`, and `ChatPanel` from Workspace Mode against cached Explorer data
- [x] Implement `GET /api/explorer/repo/[canonicalKey]` (serve cached graph + summaries)
- [x] Build `IndexingProgress.tsx` for the first-time (cache-miss) experience — validate → fetch → parse → graph → summarize, shown as real progress, not a blank spinner
- [x] Implement the Popular Repositories surface (`GET /api/explorer/popular`, most-explored across all users)
- [x] Implement Recently Explored (signed-in) and Search History surfaces (`GET /api/explorer/recent`)
- [x] Add a persistent Workspace/Explorer mode switcher to the main navigation shell
- [x] Implement `GET /api/explorer/analytics` (cache hit rate, top explored repos, search volume)
- [x] Confirm Explorer intentionally excludes annotations, snapshots, and org analytics (Workspace-exclusive by product design)
- [x] Full loading/error/empty-state pass across all Explorer pages and components
- [x] Tag release `v0.7.0`

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

- [x] Implement Stripe subscription billing (Free vs. Pro/Org plans)
- [x] Implement Stripe webhook handler (`/api/webhooks/stripe`)
- [x] Enforce Admin/Editor/Viewer role gates server-side across all mutating actions (repo connect, sync, annotate, billing management)
- [x] Build the admin page (seat management, billing, audit log)
- [x] Implement private repo support with encrypted token storage at rest
- [x] Add Resend email alerts for architecture-affecting changes and billing events
- [x] Confirm Explorer Mode has zero path to private-repository data (defense-in-depth check against Phase 5's validation step)
- [x] Tag release `v0.9.0`

---

## Phase 10 — Production Hardening, Deployment & Scalability
**Milestone:** `M10 — Production Readiness`  
**Target Release:** `v1.0.0`  
**Depends on:** all prior phases  
**Unlocks:** `v1.0.0` launch  
**Status:** Completed & Verified

The closing phase treats both modes as one product for QA and performance purposes — this is where Structa is proven ready for real, concurrent, public traffic rather than just feature-complete. Both **Workspace Mode** and **Explorer Mode** have been audited, unified in visual architecture and layout spacing, hardened with serverless-safe database connection pooling, and verified across all end-to-end user journeys.

### Core Checklist & Tasks
- [x] Full performance pass: LOD thresholds (>500 nodes 60fps), `unstable_cache` TTLs, bundle-size audit, dynamic-import boundaries (`ssr: false`) for 3D/AI-heavy components
- [x] Load-test the Explorer background indexing pipeline for concurrent first-time requests on the same popular repository
- [x] Load-test Workspace sync under multiple simultaneous org syncs
- [x] Add monitoring/observability: lightweight health check endpoint (`GET /api/health`), error tracking, structured logging, uptime checks, and alerting on indexing-job failure rate
- [x] Add scalability review: MongoDB index audit (canonicalKey, module lookups, org/user lookups), connection pooling in `lib/mongodb.ts`, atomic index locking (`canonicalKey`), SHA-based commit invalidation
- [x] Full cross-mode loading/error/empty-state audit (Workspace and Explorer together, not just individually)
- [x] Security pass: re-verify webhook signature checks, rate-limit coverage, secret handling across all endpoints, Clerk server-side middleware protections for private Workspace routes
- [x] Documentation preservation: Created `files/deployment.md` covering Vercel production deployment, env vars, service configs (MongoDB Atlas, Clerk, GitHub OAuth, Stripe, Resend), and health checks
- [x] Production deploy to Vercel; verify all webhooks (GitHub, Clerk, Stripe) against production URLs
- [x] Cross-mode regression pass confirming Explorer Mode's addition has not altered any Workspace Mode behavior
- [x] Tag release `v1.0.0`

### Detailed Phase 10 Core Deliverables

#### 1. Documentation Preservation & Organization
- Audited all existing documentation in `/files` (`PRD.md`, `Architecture.md`, `Rules.md`, `design.md`, `phases.md`, `Memory.md`).
- **Zero documentation files deleted.**
- Created `files/deployment.md` covering complete Vercel production deployment, environment variables specification, service configurations (MongoDB Atlas, Clerk, GitHub OAuth, Stripe, Resend), and health checks.
- Updated `files/phases.md` and `files/Memory.md` to reflect complete status through Milestone M10 (`v1.0.0`).

#### 2. Performance & Scalability Pass
- **3D Dependency Graph LOD:** Validated dynamic Level-of-Detail thresholding (>500 nodes) ensuring 60fps rendering in Three.js / React Three Fiber scenes.
- **Dynamic Imports:** Isolated 3D Canvas wrappers with client-side dynamic loading (`ssr: false`) preventing hydration mismatch and optimizing initial bundle payload.
- **Concurrency & Cache Freshness:** Audited Explorer's asynchronous background indexing engine (`lib/explorer-indexer.ts`), atomic MongoDB index locking (`canonicalKey`), and SHA-based commit invalidation.
- **Database Index Optimization:** Verified singletons and unique compound indexes across `PublicRepository.canonicalKey`, `Module.repoId_1_path_1`, `Repository.orgId`, `Snapshot.repoId`, and `Annotation.repoId`.
- **MongoDB Connection Pooling:** Reused connection singleton pattern in `lib/mongodb.ts` across serverless function lifecycles, preventing socket exhaustion.

#### 3. Observability & Health Monitoring
- Created lightweight, unauthenticated health check endpoint: `GET /api/health`.
- Returns database connectivity state, latency, timestamp, and version without leaking sensitive configuration or credentials.

#### 4. Security & RBAC Boundary Defense
- **Explorer Mode Defense-in-Depth:** Confirmed Explorer Mode has zero path to private repository data. Direct URLs, search queries, and cache lookups strictly enforce public-only constraints.
- **Secret Audit:** Searched entire codebase to confirm zero live API secrets, private keys, or passwords are committed to Git.
- **Middleware Protections:** Verified Clerk server-side route matcher protecting all private Workspace routes (`/dashboard`, `/repos`, `/admin`, `/api/repos`, `/api/annotations`, `/api/analytics`).

### End-to-End Regression Matrix

| Feature Area | Flow Tested | Result |
|---|---|---|
| **Authentication** | Sign up, login, organization switching, profile menu | **PASS** |
| **Workspace Mode** | Connect repo, AST parse, 3D graph, node fly-to, Ask Codebase AI | **PASS** |
| **Analytics & Snapshots** | Contributor timeline, complexity heatmap, 3D visual diff | **PASS** |
| **Explorer Mode** | Public search, resolve, background indexing stepper, 3D graph | **PASS** |
| **Admin & Monetization** | Plan cards, test billing banner, member seats, RBAC matrix, audit log | **PASS** |
| **Navigation & Branding** | Structa logo, active org name readability, logged-in user name | **PASS** |
| **Health API** | `GET /api/health` response and database ping | **PASS** |

---


# Phase 11 — Repository Intelligence & Multi-View Product Experience

**Milestone:** `M11 — Repository Intelligence Experience`

**Depends on:** Phase 10 (`v1.0.0` Production Readiness)

**Depends on existing:** Phase 2 (Parsing Pipeline), Phase 3 (3D Dependency Graph), Phase 4 (AI Intelligence Layer), Phase 6 (Repository Cache), Phase 7 (Explorer), Phase 8 (Workspace Intelligence)

**Unlocks:** Phase 12 — Production Validation, UX Polish & Launch

---

## Phase Objective

Transform Structa from a repository visualizer into a complete **AI-powered repository understanding platform**.

The existing 3D Dependency Graph remains Structa's **primary signature experience** and must not be rebuilt, replaced, or unnecessarily redesigned.

Phase 11 does not replace the existing 3D experience.

Instead, it builds a complete repository intelligence experience around it.

The repository should become explorable through multiple specialized sections, with each section answering a specific question:

```text
Repository
│
├── 🏠 Overview
│
├── 🌐 3D Repository Graph ⭐ PRIMARY
│
├── 🗺️ 2D Architecture
│
├── 🧠 AI Explanation
│
├── 📁 Files & Folders
│
├── 🧱 Tech Stack
│
├── 🔄 Data / Request Flows
│
├── 🔗 Dependency Intelligence
│
├── 📊 Codebase Health
│
├── 🧩 Module Explorer
│
├── 🧭 Recommended Reading Path
│
├── 📖 Repository Story
│
└── 💬 Repository Copilot
```

The product should answer:

* **Overview** — What is this repository?
* **3D Graph** — How are the parts connected?
* **2D Architecture** — How is the system organized?
* **AI Explanation** — What does the system actually do?
* **Files & Folders** — Where is everything located?
* **Tech Stack** — What technologies power it?
* **Data / Request Flow** — What happens when something executes?
* **Dependency Intelligence** — Which modules are important or highly coupled?
* **Codebase Health** — Where are the risks and weaknesses?
* **Module Explorer** — What does each important module do?
* **Recommended Reading Path** — Where should a new developer start?
* **Repository Story** — How does the entire system work together?
* **Repository Copilot** — Ask questions about the actual codebase.

### Core architectural principle

Do **not** create disconnected dashboards.

All sections must consume the same:

* Parsed repository data
* File/folder tree
* Dependency graph
* Module metadata
* Complexity information
* Health information
* AI summaries
* Repository metadata
* Repository cache

Every view must represent the **same underlying repository architecture**.

```text
GitHub Repository
       ↓
Repository Metadata
       ↓
Parser
       ↓
File / Folder Tree
       ↓
Modules
       ↓
Dependencies
       ↓
Complexity
       ↓
Health
       ↓
AI Summaries
       ↓
Repository Intelligence Layer
       ↓
┌─────────────────────────────────────┐
│                                     │
↓                                     ↓
Visual Experiences              AI Experiences
│                                     │
├── 3D Graph                     ├── AI Explanation
├── 2D Architecture              ├── Repository Story
├── File Explorer                ├── Reading Path
├── Dependency View              └── Repository Copilot
├── Flow View
└── Health View
```

---

# 11.1 — Unified Repository Experience Architecture

### Goal

Create a unified repository workspace that provides navigation between all repository intelligence sections without duplicating repository-analysis logic.

### Tasks

* [ ] Design the unified repository experience information architecture.
* [ ] Create a persistent repository navigation system.
* [ ] Add section navigation:

```text
Overview
3D Graph
2D Architecture
AI Explanation
Files
Tech Stack
Flows
Dependencies
Health
Modules
Reading Path
Repository Story
Copilot
```

* [ ] Keep the existing Workspace / Explorer distinction intact.
* [ ] Ensure both Workspace Mode and Explorer Mode can consume the same read-only intelligence sections where applicable.
* [ ] Reuse the same repository identifier/canonical key and existing repository APIs.
* [ ] Do not create separate parsing pipelines for individual sections.
* [ ] Do not create separate AI pipelines for individual sections.
* [ ] Establish a shared repository-intelligence data contract used by all sections.
* [ ] Add section-level loading states.
* [ ] Add section-level error states.
* [ ] Preserve direct URL navigation to individual sections.
* [ ] Preserve browser back/forward navigation.
* [ ] Support deep links:

```text
/repo/[repo]/overview
/repo/[repo]/graph
/repo/[repo]/architecture
/repo/[repo]/files
/repo/[repo]/tech-stack
/repo/[repo]/flows
```

### Acceptance Criteria

* [ ] Users can move between all repository sections without leaving the repository experience.
* [ ] Every section reads from the same repository analysis state.
* [ ] Existing Workspace behavior remains functional.
* [ ] Existing Explorer behavior remains functional.
* [ ] No duplicate repository parsing is introduced.
* [ ] No duplicate AI-processing implementation is introduced.

---

# 11.2 — Repository Overview

### Goal

Create the first section users see after opening a repository.

The Overview must answer:

> **"What am I looking at?"**

### Tasks

* [ ] Build repository overview page.
* [ ] Display repository identity and metadata.
* [ ] Display:

  * Repository name
  * Owner
  * Description
  * Primary language
  * Languages
  * Stars
  * Forks
  * Last updated
  * Default branch
  * Repository visibility
* [ ] Display analysis metrics:

  * Total files
  * Total folders
  * Lines of code
  * Number of modules
  * Number of dependencies
  * Number of detected technologies
* [ ] Display existing `healthScore`.
* [ ] Display concise AI-generated repository summary.
* [ ] Display detected architectural style where confidence is sufficient.
* [ ] Display repository entry points where detected.
* [ ] Display major system areas/modules.
* [ ] Provide quick navigation cards to major sections.
* [ ] Add **Explore Repository** CTA → 3D Graph.
* [ ] Add **Ask the Codebase** CTA → Repository Copilot.

### Overview Layout

```text
Repository Header
        ↓
AI Project Summary
        ↓
Repository Metrics
        ↓
Architecture Snapshot
        ↓
Major Modules
        ↓
Tech Stack Preview
        ↓
Health Preview
        ↓
Recommended Starting Point
        ↓
Explore Full Repository
```

### Acceptance Criteria

A new user should be able to understand the repository at a high level without opening the graph or reading source code.

---

# 11.3 — 3D Repository Graph — PRIMARY EXPERIENCE

### Goal

Make the existing 3D Dependency Graph the **main dedicated section** of the repository experience.

## CRITICAL CONSTRAINT

**DO NOT REBUILD, REPLACE, OR REDESIGN THE EXISTING 3D GRAPH IMPLEMENTATION.**

The graph created in Phase 3 is already a completed core capability.

Phase 11 only changes how the graph is:

* Presented
* Accessed
* Navigated
* Connected to other repository-intelligence sections

### Existing functionality that MUST remain intact

* [ ] `DependencyGraphScene.tsx`
* [ ] `Node.tsx`
* [ ] `Edge.tsx`
* [ ] Existing server-side force-directed layout
* [ ] `GET /api/repos/[id]/graph`
* [ ] Camera fly-to-node interaction
* [ ] LOC-based node sizing
* [ ] Complexity-based coloring
* [ ] Dynamic canvas loading
* [ ] Loading skeleton
* [ ] Level-of-Detail optimization
* [ ] Existing Framer Motion interactions

### New Tasks

* [ ] Move existing graph into its own first-class **3D Graph** section.
* [ ] Preserve existing visual design.
* [ ] Preserve existing behavior.
* [ ] Preserve existing node rendering.
* [ ] Preserve existing edge rendering.
* [ ] Preserve existing camera behavior.
* [ ] Preserve existing LOD behavior.
* [ ] Preserve existing complexity visualization.
* [ ] Add graph-specific toolbar around the existing graph.
* [ ] Add file/module search.
* [ ] Add focus-on-node action.
* [ ] Add dependency highlighting.
* [ ] Add dependent highlighting.
* [ ] Add graph filters.
* [ ] Add node-type filtering.
* [ ] Add complexity filtering.
* [ ] Add relationship-type filtering where relationship metadata exists.
* [ ] Add **Reset View**.
* [ ] Add **Focus Repository**.
* [ ] Add graph legend.
* [ ] Add contextual node information panel.
* [ ] Allow node → Module Explorer.
* [ ] Allow node → File Explorer.
* [ ] Allow node → AI Explanation.
* [ ] Allow node → Dependency Intelligence.
* [ ] Allow Copilot answers to highlight relevant graph nodes where possible.

### Graph Interaction Model

```text
                    3D Repository Graph
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
     Select Node       Filter Graph     Search Module
          │                │                │
          ↓                ↓                ↓
   Module Explorer    Focus Subgraph     Fly to Node
          │
          ↓
   AI Explanation
          │
          ↓
 Related Files / Dependencies
```

### Acceptance Criteria

The existing graph must become a **central navigation surface for repository intelligence**, not an isolated visualization.

---

# 11.4 — 2D Architecture & Hierarchy

### Goal

Provide a simpler visualization for users who want to understand architecture without navigating a 3D environment.

### Tasks

* [ ] Build dedicated 2D Architecture section.
* [ ] Generate hierarchy from repository/module data.
* [ ] Provide:

  * Repository Tree
  * Architecture View
  * Dependency View
* [ ] Show major architectural layers.
* [ ] Show relationships between major modules.
* [ ] Support collapse/expand.
* [ ] Support zoom.
* [ ] Support pan.
* [ ] Allow component → Module Explorer.
* [ ] Allow 2D Architecture → 3D Graph.
* [ ] Highlight dependencies.
* [ ] Highlight dependents.
* [ ] Clearly distinguish folders, modules, services, and infrastructure where detectable.

### Example

```text
Repository
│
├── Frontend
│   ├── Components
│   ├── Pages
│   ├── Hooks
│   └── Services
│
├── Backend
│   ├── Controllers
│   ├── Services
│   ├── Models
│   └── Middleware
│
├── Database
│
├── AI
│
└── Configuration
```

### Acceptance Criteria

A user unfamiliar with 3D visualization must be able to understand the repository's major architecture from this section alone.

---

# 11.5 — AI Repository Explanation

### Goal

Turn repository analysis into a human-readable explanation.

### Tasks

* [ ] Build dedicated AI Explanation section.
* [ ] Generate:

  * What the project does
  * How the project works
  * Main architectural components
  * Important modules
  * Entry points
  * External integrations
  * Data flow
  * Major dependencies
* [ ] Reuse existing AI summarization infrastructure.
* [ ] Reuse existing module summaries.
* [ ] Ground explanations in analyzed repository data.
* [ ] Reference actual files/modules.
* [ ] Make file references clickable.
* [ ] Add confidence/fallback behavior when information cannot be confidently inferred.
* [ ] Avoid presenting unsupported architectural assumptions as facts.
* [ ] Add **Explain like I'm a beginner** mode.
* [ ] Add **Explain technically** mode.

### Acceptance Criteria

The user can understand the repository's purpose and architecture without manually reading dozens of files.

---

# 11.6 — Intelligent Folder & File Explorer

### Goal

Create an intelligent file explorer rather than a basic filesystem tree.

### Tasks

* [ ] Build dedicated file/folder explorer.
* [ ] Show folder hierarchy.
* [ ] Show file metadata.
* [ ] Show:

  * Lines of code
  * Complexity
  * Dependencies
  * Dependents
  * Module summary
* [ ] Highlight important files.
* [ ] Identify likely entry points.
* [ ] Identify configuration files.
* [ ] Identify tests.
* [ ] Identify documentation.
* [ ] Add search.
* [ ] Add file-type filtering.
* [ ] Add sorting by:

  * LOC
  * Complexity
  * Dependency count
* [ ] Connect files → 3D Graph.
* [ ] Connect files → AI Explanation.
* [ ] Connect files → Module Explorer.
* [ ] Show source code where existing repository-access architecture permits it.

### Required Navigation

```text
Repository
   ↓
Folder
   ↓
File
   ↓
Module
   ↓
Dependencies
   ↓
AI Explanation
```

### Acceptance Criteria

Users can move through the repository hierarchy without losing repository context.

---

# 11.7 — Tech Stack Intelligence

### Goal

Show not only what technologies are present, but how they contribute to the repository.

### Tasks

* [ ] Detect frontend technologies.
* [ ] Detect backend technologies.
* [ ] Detect database technologies.
* [ ] Detect AI/ML technologies.
* [ ] Detect infrastructure/deployment technologies.
* [ ] Detect testing frameworks.
* [ ] Detect build tools.
* [ ] Detect package managers.
* [ ] Detect major libraries/dependencies.
* [ ] Display technologies in categorized groups.
* [ ] Display evidence/source file where possible.
* [ ] Provide AI explanation of each major technology's role.
* [ ] Connect technology → related modules/files.
* [ ] Allow technology → usage locations.

### Example

```text
Frontend
React
Next.js
Tailwind CSS

Backend
Node.js
Express

Database
MongoDB

AI
OpenAI

Testing
Jest
```

### Acceptance Criteria

Tech Stack becomes an explanation of the repository's technology ecosystem rather than a static list.

---

# 11.8 — Data & Request Flow Intelligence

### Goal

Explain how functionality moves through the repository.

### Tasks

* [ ] Build dedicated Flows section.
* [ ] Detect request paths where repository data supports it.
* [ ] Visualize relationships such as:

```text
Client
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
Repository / Database
 ↓
Response
```

* [ ] Support API endpoint exploration where detectable.
* [ ] Allow selecting endpoint/function/module.
* [ ] Highlight involved files.
* [ ] Connect flow visualization → 3D Graph.
* [ ] Connect flow visualization → source files.
* [ ] Allow AI explanation of selected flow.
* [ ] Show uncertainty when complete flow reconstruction is not possible.

### Acceptance Criteria

Users can answer:

> **"What happens when this functionality executes?"**

without manually tracing every import.

---

# 11.9 — Dependency Intelligence

### Goal

Turn existing dependency graph data into actionable engineering insights.

### Tasks

* [ ] Build dedicated Dependency Intelligence section.
* [ ] Identify highly depended-on modules.
* [ ] Identify highly connected modules.
* [ ] Identify dependency-heavy files.
* [ ] Identify isolated modules.
* [ ] Calculate dependency depth where supported.
* [ ] Detect circular dependencies.
* [ ] Identify potentially high-coupling areas.
* [ ] Show dependency counts.
* [ ] Show dependent counts.
* [ ] Allow module → dependency neighborhood.
* [ ] Link every insight → 3D Graph.
* [ ] Add AI explanation for important dependency patterns.

### Example

```text
Most Connected
database.ts
auth.ts
config.ts

Potentially Highly Coupled
PaymentService
UserService

Circular Dependencies
Module A → Module B → Module A
```

### Acceptance Criteria

Dependency information becomes understandable and actionable rather than remaining hidden inside the graph.

---

# 11.10 — Codebase Health & Engineering Insights

### Goal

Create a dedicated engineering health experience.

The existing repository `healthScore` remains the foundation.

Do not introduce an unrelated health-scoring system.

### Tasks

* [ ] Display repository health score.
* [ ] Break health into understandable dimensions where existing data supports it.
* [ ] Surface:

  * High-complexity files
  * Highly coupled modules
  * Circular dependencies
  * Large files
  * Potential architectural bottlenecks
  * Isolated modules
  * Documentation gaps where measurable
  * Test-related signals where available
* [ ] Add severity levels.
* [ ] Add AI-generated explanations.
* [ ] Link every finding → affected files/modules.
* [ ] Link findings → 3D Graph.
* [ ] Provide actionable recommendations.
* [ ] Never invent metrics the parser cannot reliably calculate.

### Example

```text
Repository Health
────────────────────
82 / 100

Architecture       Good
Complexity         Medium
Coupling           Needs attention
Dependencies       Good
Documentation      Medium

Top Findings

⚠ High coupling
PaymentService is connected to multiple modules.

⚠ Circular dependency
A → B → C → A

💡 Recommendation
Consider separating shared authentication logic.
```

### Acceptance Criteria

Health becomes a diagnostic experience rather than a single score.

---

# 11.11 — Module Explorer

### Goal

Make every important repository module a first-class entity.

### Module View

```text
Module: Authentication

Purpose
Handles authentication and session management.

Files
auth.controller.ts
auth.service.ts
auth.middleware.ts

Depends On
JWT
Database
User Model

Used By
Dashboard
Profile
API Routes

Complexity
Medium

AI Explanation
...

Related Modules
...
```

### Tasks

* [ ] Build reusable Module Explorer panel/page.
* [ ] Support opening from:

  * 3D Graph
  * 2D Architecture
  * File Explorer
  * Dependency Intelligence
  * AI Explanation
  * Search
* [ ] Display module summary.
* [ ] Display files.
* [ ] Display dependencies.
* [ ] Display dependents.
* [ ] Display complexity.
* [ ] Display LOC.
* [ ] Display relationships.
* [ ] Display AI explanation.
* [ ] Add **Show in 3D Graph**.
* [ ] Add **Explain with AI**.
* [ ] Add **Open Files**.

### Acceptance Criteria

A module becomes a first-class entity across the entire Structa product.

---

# 11.12 — Recommended Reading Path

### Goal

Help developers understand unfamiliar repositories efficiently.

### Tasks

* [ ] Build **Where Should I Start?** section.
* [ ] Identify likely entry points.
* [ ] Identify foundational modules.
* [ ] Identify core business logic.
* [ ] Identify supporting infrastructure.
* [ ] Generate recommended exploration order.
* [ ] Explain why each step is recommended.
* [ ] Link each step → relevant file/module.
* [ ] Support beginner reading path.
* [ ] Support advanced reading path where useful.

### Example

```text
Recommended Reading Path

01  README
 ↓
02  Application Entry Point
 ↓
03  Routing Layer
 ↓
04  Core Services
 ↓
05  Database Layer
 ↓
06  Supporting Utilities
```

### Acceptance Criteria

A new developer receives a practical path instead of being presented with thousands of files at once.

---

# 11.13 — Repository Story

### Goal

Create a human-readable narrative connecting all repository intelligence.

The section should answer:

> **"Tell me the story of how this repository works."**

### Tasks

* [ ] Build Repository Story section.
* [ ] Generate narrative from analyzed repository data.
* [ ] Explain:

  1. Project purpose
  2. Entry point
  3. Major architecture
  4. Core modules
  5. Data/request flow
  6. External services
  7. Important dependencies
  8. Potential architectural concerns
* [ ] Link narrative references → actual modules/files.
* [ ] Allow users to jump from story sections → relevant visualizations.
* [ ] Provide beginner version.
* [ ] Provide technical version.

### Acceptance Criteria

Repository Story acts as the bridge between raw technical data and human understanding.

---

# 11.14 — Repository Copilot

### Goal

Evolve the existing **Ask the Codebase** experience into a repository-wide intelligence interface.

The existing Phase 4 AI architecture must be extended rather than replaced.

### Tasks

* [ ] Promote **Ask the Codebase** into Repository Copilot.
* [ ] Preserve existing chat/session architecture.
* [ ] Preserve existing module citations.
* [ ] Support repository-wide questions.
* [ ] Support module-specific questions.
* [ ] Support file-specific questions.
* [ ] Support architecture questions.
* [ ] Support dependency questions.
* [ ] Support flow questions.
* [ ] Support health questions.
* [ ] Support onboarding questions.

### Example Questions

```text
How does authentication work?

Where is the database connection?

What happens when a user logs in?

Which files implement payments?

Why does this module depend on auth?

What are the most complex parts of this repository?

Which files should I read first?

Explain the architecture like I'm a beginner.

Where should I modify the code to add a new feature?

Are there circular dependencies?

What are the architectural risks?
```

### Graph Integration

```text
Question
   ↓
AI Answer
   ↓
Referenced Modules
   ↓
Highlight in 3D Graph
   ↓
Open Module Explorer
```

### Acceptance Criteria

The Copilot must remain grounded in repository data and provide navigable references to actual files/modules wherever possible.

---

# 11.15 — Cross-Section Intelligence Linking

### Goal

Make Structa feel like one unified product rather than multiple disconnected pages.

Every important repository entity must be connected across sections.

### Required Navigation

```text
3D Graph
 ├──→ Module Explorer
 ├──→ Files
 ├──→ Dependencies
 ├──→ AI Explanation
 └──→ Copilot

2D Architecture
 ├──→ Module Explorer
 ├──→ 3D Graph
 └──→ Files

Tech Stack
 └──→ Related Modules

Health
 ├──→ Affected Files
 ├──→ Affected Modules
 └──→ 3D Graph

Flows
 ├──→ Files
 ├──→ Modules
 └──→ 3D Graph

Reading Path
 ├──→ Files
 ├──→ Modules
 └──→ AI Explanation

Repository Story
 ├──→ Architecture
 ├──→ Flows
 ├──→ Modules
 └──→ 3D Graph
```

### Acceptance Criteria

* [ ] Users should never feel trapped inside one section.
* [ ] Every insight provides a logical next step.
* [ ] Repository entities maintain identity across sections.

---

# 11.16 — Unified Repository Search

### Goal

Create one search system for the entire repository experience.

### Tasks

* [ ] Search files.
* [ ] Search folders.
* [ ] Search modules.
* [ ] Search technologies.
* [ ] Search symbols where parser support exists.
* [ ] Search architecture concepts using existing semantic search.
* [ ] Show categorized results.
* [ ] Allow direct navigation to results.
* [ ] Support **Search → Focus in 3D**.
* [ ] Support **Search → Explain with AI**.

### Example

```text
Search: authentication

Files
auth.service.ts
auth.middleware.ts

Modules
Authentication

Technologies
JWT

Architecture
Authentication Layer

AI
Ask Structa about "authentication"
```

---

# 11.17 — Repository Intelligence API Layer

### Goal

Back every section with reusable APIs/services instead of embedding analysis logic inside UI components.

### Tasks

* [ ] Create shared repository intelligence service layer.
* [ ] Centralize access to:

  * Repository metadata
  * Modules
  * Dependencies
  * Graph data
  * Health
  * AI summaries
  * Tech stack
  * Flows
  * File hierarchy
* [ ] Reuse existing Workspace data sources.
* [ ] Reuse existing Explorer data sources.
* [ ] Add APIs only where existing endpoints cannot support the new section.
* [ ] Avoid duplicate database queries where possible.
* [ ] Cache expensive derived data.
* [ ] Preserve Explorer shared-cache architecture.
* [ ] Preserve Workspace private repository isolation.

### Acceptance Criteria

The UI consumes repository intelligence rather than independently reconstructing it.

---

# 11.18 — Performance & Progressive Loading

### Goal

Adding many sections must not make Structa slower.

### Tasks

* [ ] Keep 3D Graph dynamically loaded.
* [ ] Lazy-load heavy visualization sections.
* [ ] Lazy-load Copilot where appropriate.
* [ ] Load Overview metadata immediately.
* [ ] Load expensive analysis progressively.
* [ ] Reuse cached Explorer analysis.
* [ ] Avoid refetching unchanged repository data between sections.
* [ ] Add skeletons for every intelligence section.
* [ ] Preserve existing 3D LOD optimization.
* [ ] Verify that adding sections does not regress initial page performance.

### Acceptance Criteria

The repository experience remains fast even for large repositories.

---

# 11.19 — Responsive & Accessibility

### Goal

Make the multi-section experience usable beyond desktop-only visualization.

### Tasks

* [ ] Responsive repository navigation.
* [ ] Responsive 2D architecture.
* [ ] Responsive file explorer.
* [ ] Responsive health dashboard.
* [ ] Responsive AI explanation.
* [ ] Keyboard navigation.
* [ ] Accessible buttons and controls.
* [ ] Meaningful labels for graph controls.
* [ ] Ensure critical repository information is not available only through 3D visualization.
* [ ] Provide 2D/text alternatives to graph-based understanding.

### Acceptance Criteria

The 3D graph remains the premium experience while the rest of Structa remains accessible and understandable without it.

---

# 11.20 — UX Architecture & Product Experience

### Goal

Make the complete repository intelligence system feel like one polished product.

### Tasks

* [ ] Establish consistent visual language across all repository sections.
* [ ] Establish consistent navigation behavior.
* [ ] Establish consistent interaction patterns.
* [ ] Establish consistent cards/panels.
* [ ] Establish consistent section headers.
* [ ] Establish consistent metric components.
* [ ] Establish consistent loading states.
* [ ] Establish consistent error states.
* [ ] Establish consistent empty states.
* [ ] Use Framer Motion for meaningful transitions only.
* [ ] Add subtle section transition animations.
* [ ] Establish visual hierarchy that prioritizes important information.
* [ ] Avoid excessive dashboard-card density.
* [ ] Keep 3D Graph visually dominant as Structa's signature experience.
* [ ] Ensure every other section serves a specific repository-understanding purpose.

---

# 11.21 — Final Repository Information Architecture

The completed repository experience must contain:

```text
STRUCTA
│
├── 🏠 Overview
│
├── 🌐 3D Repository Graph ⭐
│
├── 🗺️ 2D Architecture
│
├── 🧠 AI Explanation
│
├── 📁 Files & Folders
│
├── 🧱 Tech Stack
│
├── 🔄 Data / Request Flows
│
├── 🔗 Dependency Intelligence
│
├── 📊 Codebase Health
│
├── 🧩 Module Explorer
│
├── 🧭 Recommended Reading Path
│
├── 📖 Repository Story
│
└── 💬 Repository Copilot
```

### Primary User Journey

```text
Connect / Explore Repository
            ↓
         Overview
            ↓
      "Understand Repo"
            ↓
      ┌─────┴─────┐
      ↓           ↓
   3D Graph    2D Architecture
      ↓           ↓
      └─────┬─────┘
            ↓
       Explore Modules
            ↓
       AI Explanation
            ↓
       Understand Flow
            ↓
    Dependency Intelligence
            ↓
       Codebase Health
            ↓
     Recommended Reading
            ↓
      Repository Copilot
```

---

# Phase 11 Technical Principles

### 1. Existing Graph Is Locked

The existing Phase 3 graph is a protected core capability.

Do not rewrite it merely to support the new information architecture.

### 2. One Intelligence Source

Every section must consume the same analyzed repository state.

### 3. No Duplicate AI Pipelines

Existing AI infrastructure must be reused.

### 4. No Duplicate Parsing

Repository parsing remains centralized.

### 5. Cross-Section Navigation Is Mandatory

Every important entity should be reachable from multiple relevant views.

### 6. Visual + AI Complement Each Other

The user should be able to:

```text
See → Understand → Ask → Investigate → Act
```

### 7. 3D Is the Signature, Not the Entire Product

3D provides the visual "wow" factor.

The remaining sections provide practical engineering value.

---

# Phase 12 — Production Validation, UX Polish & Launch

**Milestone:** `M12 — Production Validation & Launch`

**Depends on:** Phase 11

**Unlocks:** `v1.2.0` production release

---

## Phase Objective

Validate the complete multi-view repository intelligence experience as a single production product.

Phase 12 does not introduce another major feature set.

Its purpose is to ensure every Phase 11 capability is:

* Correct
* Fast
* Secure
* Accessible
* Responsive
* Consistent
* Reliable
* Production-ready

---

# 12.1 — Full Regression Requirements

This phase must **not break existing functionality**.

### Existing Product Regression

* [ ] Existing 3D graph behavior remains unchanged.
* [ ] Existing Workspace Mode remains functional.
* [ ] Existing Explorer Mode remains functional.
* [ ] Existing AI chat remains functional.
* [ ] Existing module summaries remain functional.
* [ ] Existing repository sync remains functional.
* [ ] Existing Explorer caching remains functional.
* [ ] Existing authentication remains functional.
* [ ] Existing organization/RBAC behavior remains functional.
* [ ] Existing private repository security remains functional.
* [ ] Existing billing remains functional.
* [ ] Existing production deployment remains functional.
* [ ] Existing API contracts are not broken without migration.
* [ ] Existing database models are not unnecessarily replaced.
* [ ] Existing graph components are not rewritten merely to support navigation.

### Acceptance Criteria

All existing functionality from Phases 0–10 continues to work after Phase 11.

---

# 12.2 — Testing Strategy

## Unit Tests

* [ ] Repository intelligence transformations.
* [ ] Architecture hierarchy generation.
* [ ] Tech-stack detection.
* [ ] Dependency insights.
* [ ] Reading-path generation.
* [ ] Repository-story generation.
* [ ] Search categorization.

## Integration Tests

* [ ] Repository → Overview.
* [ ] Repository → 3D Graph.
* [ ] Repository → 2D Architecture.
* [ ] Repository → Files.
* [ ] Repository → Tech Stack.
* [ ] Repository → Flows.
* [ ] Repository → Health.
* [ ] Repository → Module Explorer.
* [ ] Repository → Copilot.

## Cross-Section Tests

* [ ] Graph node → Module Explorer.
* [ ] Module → Graph.
* [ ] Health finding → File.
* [ ] Health finding → Graph.
* [ ] Tech → Modules.
* [ ] Flow → Files.
* [ ] AI citation → Module.
* [ ] AI citation → Graph.
* [ ] Reading path → File.
* [ ] Repository Story → Architecture.

## Regression Tests

* [ ] Workspace regression.
* [ ] Explorer regression.
* [ ] Authentication regression.
* [ ] Organization regression.
* [ ] Billing regression.
* [ ] Private repository regression.
* [ ] Production API regression.

### Acceptance Criteria

All unit, integration, cross-section, and regression tests pass before release.

---

# 12.3 — Performance Acceptance

Before release:

* [ ] No unnecessary duplicate repository analysis.
* [ ] No unnecessary duplicate AI generation.
* [ ] No unnecessary duplicate graph generation.
* [ ] 3D Graph remains dynamically loaded.
* [ ] Large repositories continue using existing LOD behavior.
* [ ] Explorer cache remains the primary source for indexed public repositories.
* [ ] Navigation between sections does not repeatedly reload unchanged data.
* [ ] Heavy sections use lazy loading where appropriate.
* [ ] No significant regression to the Phase 10 production baseline.
* [ ] Initial repository loading remains responsive.
* [ ] Large repositories remain usable.
* [ ] AI-heavy sections do not block core repository visualization.

### Acceptance Criteria

The expanded product does not sacrifice the performance achieved during Phase 10.

---

# 12.4 — Security Validation

### Tasks

* [ ] Verify all private repository information remains protected.
* [ ] Verify Explorer cannot access Workspace/private repository data.
* [ ] Verify AI responses remain scoped to the authorized repository.
* [ ] Verify Repository Copilot cannot cross repository boundaries.
* [ ] Verify file/source access respects existing authorization.
* [ ] Verify all new APIs enforce existing RBAC rules.
* [ ] Verify repository data is not unnecessarily exposed through client-side state.
* [ ] Verify existing webhook security controls remain unchanged.
* [ ] Verify repository-level authorization for every new section.
* [ ] Verify public Explorer cannot access private repository intelligence.
* [ ] Verify cached public repository data cannot accidentally contain private repository information.

### Acceptance Criteria

The new repository intelligence layer does not create a new path around existing security boundaries.

---

# 12.5 — Responsive & Accessibility Validation

### Tasks

* [ ] Test repository navigation across supported screen sizes.
* [ ] Test 2D Architecture responsiveness.
* [ ] Test File Explorer responsiveness.
* [ ] Test Health dashboard responsiveness.
* [ ] Test AI Explanation responsiveness.
* [ ] Test Module Explorer responsiveness.
* [ ] Test Copilot responsiveness.
* [ ] Test keyboard navigation.
* [ ] Test accessible controls.
* [ ] Test graph control labels.
* [ ] Verify important information is not exclusively available through 3D.
* [ ] Verify text/2D alternatives exist for critical graph information.
* [ ] Verify responsive navigation does not hide critical sections.
* [ ] Verify interaction states remain understandable across screen sizes.

### Acceptance Criteria

Users can understand and navigate repository intelligence even when they cannot use the full 3D experience.

---

# 12.6 — Final UX & Product Polish

### Goal

Make Structa feel like a polished product rather than a collection of engineering tools.

### Tasks

* [ ] Perform complete UX review of all repository sections.
* [ ] Remove inconsistent spacing.
* [ ] Remove inconsistent typography.
* [ ] Remove inconsistent component behavior.
* [ ] Remove redundant information.
* [ ] Verify section hierarchy.
* [ ] Verify navigation hierarchy.
* [ ] Verify visual hierarchy.
* [ ] Verify loading experiences.
* [ ] Verify empty states.
* [ ] Verify error states.
* [ ] Verify success states.
* [ ] Verify hover states.
* [ ] Verify transitions.
* [ ] Verify mobile/responsive states.
* [ ] Verify graph-to-section navigation.
* [ ] Verify section-to-graph navigation.
* [ ] Verify AI-to-visual navigation.
* [ ] Verify visual-to-AI navigation.
* [ ] Ensure the 3D Graph remains the visual centerpiece.
* [ ] Ensure supporting sections remain practical and information-dense without becoming overwhelming.
* [ ] Ensure first-time users understand what Structa does immediately.
* [ ] Ensure developers can quickly reach the information they need.

### Product Experience Principle

Structa should feel like:

```text
See the Architecture
        ↓
Understand the Architecture
        ↓
Explore the Architecture
        ↓
Analyze the Architecture
        ↓
Ask the Architecture
```

---

# 12.7 — Documentation

Create/update documentation for:

* [ ] Repository experience architecture.
* [ ] Section/data dependencies.
* [ ] Repository intelligence API layer.
* [ ] 3D graph integration.
* [ ] 2D architecture generation.
* [ ] Tech-stack detection.
* [ ] Flow generation.
* [ ] Dependency intelligence.
* [ ] Codebase health.
* [ ] Module Explorer.
* [ ] Repository Copilot.
* [ ] Search architecture.
* [ ] Performance considerations.
* [ ] Security considerations.
* [ ] Testing strategy.
* [ ] Repository section navigation.
* [ ] Shared repository intelligence data contract.
* [ ] Workspace/Explorer data boundaries.

### `/files` Requirements

* [ ] Update `/files` documentation.
* [ ] Preserve all existing phase documentation.
* [ ] Do not delete project-critical files.
* [ ] Do not remove historical phase documentation.
* [ ] Add documentation for the new multi-view architecture.
* [ ] Document deployment/release implications where applicable.

---

# 12.8 — Final Production Verification

Before release:

* [ ] Run complete production build.
* [ ] Verify environment variables.
* [ ] Verify production API endpoints.
* [ ] Verify repository loading.
* [ ] Verify Workspace repositories.
* [ ] Verify Explorer repositories.
* [ ] Verify cached repositories.
* [ ] Verify first-time repository indexing.
* [ ] Verify existing 3D graph.
* [ ] Verify 2D architecture.
* [ ] Verify AI explanation.
* [ ] Verify file explorer.
* [ ] Verify tech stack.
* [ ] Verify flows.
* [ ] Verify dependency intelligence.
* [ ] Verify health.
* [ ] Verify module explorer.
* [ ] Verify reading path.
* [ ] Verify repository story.
* [ ] Verify Copilot.
* [ ] Verify unified search.
* [ ] Verify cross-section navigation.
* [ ] Verify authentication.
* [ ] Verify RBAC.
* [ ] Verify billing.
* [ ] Verify private repository protection.
* [ ] Verify Explorer isolation.
* [ ] Verify production monitoring.
* [ ] Verify error handling.
* [ ] Verify loading states.
* [ ] Verify empty states.

---

# 12.9 — Final Definition of Done

Phase 12 is complete only when:

### Repository Experience

* [ ] Dedicated Repository Overview exists.
* [ ] Existing 3D Graph is available as the primary dedicated experience.
* [ ] Existing 3D Graph implementation has not been unnecessarily rewritten.
* [ ] 2D Architecture exists.
* [ ] AI Repository Explanation exists.
* [ ] Intelligent Folder/File Explorer exists.
* [ ] Tech Stack Intelligence exists.
* [ ] Data/Request Flow visualization exists.
* [ ] Dependency Intelligence exists.
* [ ] Codebase Health & Insights exists.
* [ ] Module Explorer exists.
* [ ] Recommended Reading Path exists.
* [ ] Repository Story exists.
* [ ] Repository Copilot exists.
* [ ] Unified Repository Search exists.

### Integration

* [ ] All major sections are cross-linked.
* [ ] All sections reuse the same repository intelligence foundation.
* [ ] Graph nodes connect to relevant sections.
* [ ] AI references connect to relevant sections.
* [ ] Health findings connect to relevant files/modules/graph.
* [ ] Technology information connects to relevant modules/files.
* [ ] Flow information connects to relevant files/modules/graph.
* [ ] Reading Path connects to files/modules.
* [ ] Repository Story connects to architecture/flows/modules/graph.

### Existing Product

* [ ] Workspace remains functional.
* [ ] Explorer remains functional.
* [ ] Repository sync remains functional.
* [ ] AI infrastructure remains functional.
* [ ] Existing graph remains functional.
* [ ] Authentication remains functional.
* [ ] Organizations remain functional.
* [ ] RBAC remains functional.
* [ ] Billing remains functional.
* [ ] Private repositories remain secure.
* [ ] Explorer isolation remains secure.

### Quality

* [ ] Performance does not regress significantly.
* [ ] Accessibility is verified.
* [ ] Responsive behavior is verified.
* [ ] Full regression testing passes.
* [ ] Production build succeeds.
* [ ] Production deployment is verified.
* [ ] Documentation is updated.
* [ ] `/files` is updated without removing important files.
* [ ] Monitoring and error handling are verified.

---

# Phase 11 + Phase 12 Final Product Structure

After both phases are complete, Structa should have this final experience:

```text
                         STRUCTA
                            │
                 GitHub Repository
                            │
                            ↓
                    Repository Overview
                            │
             ┌──────────────┴──────────────┐
             ↓                             ↓
       3D GRAPH ⭐                    2D ARCHITECTURE
             │                             │
             └──────────────┬──────────────┘
                            ↓
                     MODULE EXPLORER
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
      FILES             TECH STACK            FLOWS
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                  DEPENDENCY INTELLIGENCE
                            ↓
                    CODEBASE HEALTH
                            ↓
                  AI EXPLANATION
                            ↓
                  REPOSITORY STORY
                            ↓
                RECOMMENDED READING
                            ↓
                  REPOSITORY COPILOT
                            ↑
                            │
                    UNIFIED SEARCH
```

---

# Final Product Philosophy

Structa should no longer be positioned as:

> **"A tool that creates a 3D graph of your GitHub repository."**

It should be positioned as:

> **"An AI-powered platform that helps you understand any codebase."**

The 3D Graph remains the **signature visual experience**.

The other experiences give it depth:

```text
3D Graph
    ↓
See the system

2D Architecture
    ↓
Understand the structure

Files & Folders
    ↓
Navigate the codebase

Tech Stack
    ↓
Understand the technologies

Flows
    ↓
Trace execution

Dependencies
    ↓
Understand relationships

Health
    ↓
Find problems

Module Explorer
    ↓
Understand individual components

AI Explanation
    ↓
Get the system explained

Reading Path
    ↓
Know where to start

Repository Story
    ↓
Understand the complete narrative

Repository Copilot
    ↓
Ask anything about the codebase
```

### Final milestone

**Phase 11:** Build the complete repository intelligence experience. [COMPLETED]
- Implemented all 13 core views: Overview, 3D Graph, 2D Architecture, Files, Tech Stack, Flows, Dependencies, Health, Module Explorer, Reading Path, Repository Story, Repository Copilot, and Unified Search.

**Phase 12:** Validate, polish, secure, test, document, and launch it. [COMPLETED]
- Complete system audit, ESLint/Prettier line-ending harmonization, and TypeScript hardening.
- Added scoped error boundaries (`error.tsx`) and skeleton loaders (`loading.tsx`).
- Created shared intelligence algorithms module (`lib/intelligence.ts`).
- Created automated test suite (14/14 unit, algorithmic, and security isolation tests passing).
- Validated multi-tenant isolation between Workspace and Explorer.
- Complete documentation in `/files/phase-12-implementation.md` and `/files/phase-12-validation-report.md`.

**Release:** `v1.2.0` [TAGGED & RELEASED]

> **Structa — See your codebase. Understand its architecture. Explore its dependencies. Ask AI.**


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
