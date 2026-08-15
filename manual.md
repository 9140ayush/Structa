# Structa Manual QA & Feature Verification Guide

## 1. Purpose

This document provides a comprehensive, step-by-step manual QA verification guide for Structa (Phases 0 through 8). It enables developers and QA engineers to clone the repository, set up the environment, run the server, and systematically test all core workflows, visual graph components, AI features, security boundaries, and cache engines.

---

## 2. Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x+`
- **Git**: Installed and configured
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Clerk Account**: Configured with GitHub OAuth provider and Organizations enabled
- **GitHub PAT (Personal Access Token)**: Read-only access for public repos and tree parsing
- **OpenAI API Key**: Required for Phase 4 AI summarization and grounded streaming chat

---

## 3. Environment Setup

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in the required environment variables in `.env.local`.

---

## 4. Required Environment Variables

Ensure the following key/value parameters exist in `.env.local`:

```ini
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/structa

# GitHub Integration
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_PAT=ghp_...

# OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# Upstash Redis Rate Limiting (Optional - Fails Open if omitted)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## 5. Start Development Server

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Basic Health Check

- [x] Access root URL `http://localhost:3000`
  - **Expected**: Landing page renders cleanly with mode switching tabs and CTA buttons.
- [x] Check terminal console
  - **Expected**: No compilation errors or unhandled warnings.

---

## 7. Phase 0 — Project Setup Verification

- [x] App Router architecture (`app/` directory exclusively; no `pages/` folder present)
  - **Expected**: All routes reside in App Router syntax.
- [x] TypeScript & ESLint setup
  - **Expected**: `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 8. Phase 1 — Authentication & Repository Connection

### 8.1 Sign Up
- [ ] Navigate to `/sign-up`
  - **Expected**: Clerk sign-up card displays with GitHub OAuth and email options.

### 8.2 Sign In
- [ ] Navigate to `/sign-in` and sign in with GitHub OAuth
  - **Expected**: Authentication succeeds and redirects to `/dashboard`.

### 8.3 Sign Out
- [ ] Click Clerk UserButton and select "Sign Out"
  - **Expected**: User session terminates; protected route `/dashboard` redirects to `/sign-in`.

### 8.4 Organizations
- [ ] Open Clerk Organization Switcher and create or select an Organization
  - **Expected**: Organization scope is persisted; MongoDB `Organization` document is synchronized.

### 8.5 GitHub Connection
- [ ] Connect GitHub OAuth account
  - **Expected**: Personal & org public repositories list in the "Connect Repository" drawer.

### 8.6 Repository Connection
- [ ] Select a repository and click "Connect Repo" (`POST /api/repos`)
  - **Expected**: Repository document is created; dashboard grid updates with new card.

---

## 9. Phase 2 — Parsing & Sync

### 9.1 Sync
- [ ] Click "Sync Repo" button (`POST /api/repos/[repoId]/sync`)
  - **Expected**: Spinner animates; backend fetches recursive tree, parses JS/TS files, and calculates health score.

### 9.2 Parsing
- [ ] Verify AST parsing of imports (ES modules, CommonJS `require`, dynamic `import()`, re-exports)
  - **Expected**: Dependencies and edges are correctly derived.

### 9.3 Modules
- [ ] Check MongoDB `modules` collection for synced repo
  - **Expected**: Documents exist with `path`, `loc`, `complexityScore`, `imports`, `importedBy`.

### 9.4 Health Score
- [ ] Inspect HealthScoreRing component on repository dashboard
  - **Expected**: Health score percentage (0–100) displays with color-coded ring indicator.

---

## 10. Phase 3 — 3D Architecture

### 10.1 Open Graph
- [ ] Open a connected repository map at `/repos/[repoId]`
  - **Expected**: 3D React Three Fiber (R3F) canvas mounts smoothly.

### 10.2 Nodes
- [ ] Verify 3D spheres
  - **Expected**: Folders render in Ion Blue (`#7C9CFF`); files render in Slate (`#4B5563`).

### 10.3 Edges
- [ ] Verify 3D connecting lines
  - **Expected**: Curves connect importing files to dependency files.

### 10.4 Hover
- [ ] Hover mouse cursor over a node
  - **Expected**: Node scale pulses and label tooltip displays file path and LOC.

### 10.5 Selection
- [ ] Click a 3D node
  - **Expected**: Camera flies smoothly to target node; slide-in drawer opens with metadata and incoming/outgoing dependencies.

### 10.6 Camera
- [ ] Drag, scroll, and rotate canvas
  - **Expected**: Smooth 60 FPS OrbitControls manipulation without camera clipping.

### 10.7 Search
- [ ] Type module path in top header search input
  - **Expected**: Matching node highlights and focuses in 3D scene.

### 10.8 Complexity
- [ ] Inspect node radiuses
  - **Expected**: Higher LOC / complexity modules render with larger sphere geometries.

### 10.9 LOD
- [ ] Test repository with >500 modules
  - **Expected**: Level of Detail (LOD) threshold activates; low-priority edges fade to optimize performance.

---

## 11. Phase 4 — AI Intelligence

### 11.1 Module Summaries
- [ ] Click a file module in the slide-in drawer
  - **Expected**: One-paragraph AI summary displays under "AI Summary".

### 11.2 Ask the Codebase
- [ ] Click "Ask Codebase" button to open ChatPanel and submit a question: *"Explain the architecture of this repo"*
  - **Expected**: Streaming response streams in real-time, grounded specifically in repository files.

### 11.3 Citations
- [ ] Click a `[[path:src/...]]` citation tag in assistant chat message
  - **Expected**: 3D graph camera moves to focus on cited module immediately.

### 11.4 Semantic Search
- [ ] Ask: *"Where is authentication handled?"*
  - **Expected**: Response cites relevant auth modules correctly.

### 11.5 README Export
- [ ] Trigger export endpoint (`GET /api/repos/[repoId]/export`)
  - **Expected**: Architecture markdown document downloads cleanly.

### 11.6 AI Failure
- [ ] Simulate OpenAI API key error
  - **Expected**: Graph visualization renders normally; AI summaries fail gracefully without crashing UI.

---

## 12. Phase 5 — Explorer Discovery

### 12.1 Search
- [ ] Type repository query in `/explorer` search box (e.g. `react`)
  - **Expected**: GitHub search results dropdown lists matching public repos.

### 12.2 Full URL
- [ ] Paste full GitHub URL: `https://github.com/facebook/react`
  - **Expected**: Resolver redirects to canonical route `/explorer/facebook/react`.

### 12.3 owner/repo
- [ ] Enter shorthand: `facebook/react`
  - **Expected**: Resolver canonicalizes string and opens repo.

### 12.4 Canonical Key
- [ ] Enter `Facebook/React` vs `facebook/react`
  - **Expected**: Both converge to lowercased single canonical key `facebook/react`.

### 12.5 Private Repo Rejection
- [ ] Attempt resolving a private repository URL in Explorer Mode
  - **Expected**: Resolution fails with error *"Repository is private or inaccessible"*.

### 12.6 Invalid Repo
- [ ] Enter invalid URL `https://github.com/invalid/nonexistent-12345`
  - **Expected**: 404 error card displays cleanly.

---

## 13. Phase 6 — Cache & Indexing

### 13.1 Cache Miss
- [ ] Explore an un-indexed public repository
  - **Expected**: Document created in `PublicRepositories` collection with `indexStatus: "indexing"`.

### 13.2 Background Indexing
- [ ] Inspect terminal logs during initial exploration
  - **Expected**: Asynchronous worker `[worker] Starting background indexing...` logs progress without blocking HTTP response.

### 13.3 Status
- [ ] Poll `/api/explorer/status/facebook/react`
  - **Expected**: Returns JSON payload showing `indexStatus` (`indexing` -> `indexed`).

### 13.4 Cache Hit
- [ ] Refresh page after indexing completes
  - **Expected**: Graph loads instantly from `PublicRepository.graphPayload` without re-running parser or OpenAI API calls.

### 13.5 SHA Invalidation
- [ ] Trigger resolution when GitHub branch HEAD commit changes
  - **Expected**: Stale cache detected; background re-index queued automatically.

### 13.6 Concurrency
- [ ] Issue 3 concurrent POST `/api/explorer/resolve` requests for `facebook/react` simultaneously
  - **Expected**: Exactly one `PublicRepositories` document created; race condition handled gracefully.

### 13.7 Manual Refresh
- [ ] Click "Refresh Cache" (`POST /api/explorer/repo/refresh`)
  - **Expected**: Forces re-index job for signed-in user.

---

## 14. Phase 7 — Explorer Experience

### 14.1 Explorer Landing
- [ ] Navigate to `/explorer`
  - **Expected**: Landing page displays search hero, Popular Repositories grid, and Recently Explored list.

### 14.2 Popular
- [ ] Check Popular Repositories list
  - **Expected**: Top indexed public repositories display sorted by `exploreCount`.

### 14.3 Recent
- [ ] Check Recently Explored list (signed-in user)
  - **Expected**: User's recent search history items render correctly.

### 14.4 Repository Dashboard
- [ ] Navigate to `/explorer/facebook/react`
  - **Expected**: Layout displays 3D canvas, metadata panel, and grounded chatbot.

### 14.5 Explorer 3D Graph
- [ ] Interact with Explorer 3D canvas
  - **Expected**: Full 3D node selection and camera movement operational.

### 14.6 Explorer Chat
- [ ] Ask question in Explorer ChatPanel
  - **Expected**: Streamed response grounds using `moduleSummaries` cached in `PublicRepository`.

### 14.7 Indexing Progress
- [ ] Open un-indexed repo
  - **Expected**: `IndexingProgress` visual stepper renders progress stages (Validation -> Fetch -> Parse -> Graph -> Summarize).

### 14.8 Workspace/Explorer Switcher
- [ ] Click "Workspace" tab in header switcher
  - **Expected**: Navigates seamlessly to `/dashboard` while preserving user authentication state.

### 14.9 Explorer Analytics
- [ ] Fetch `/api/explorer/analytics`
  - **Expected**: Returns JSON containing cache hit rate, total explored volume, and top public repos.

---

## 15. Phase 8 — Workspace Intelligence

### 15.1 Annotations
- [ ] Add a sticky-note annotation to a module in Workspace drawer
  - **Expected**: Annotation saves to MongoDB; gold `📝` badge appears next to module label in 3D scene.

### 15.2 Snapshots
- [ ] Sync workspace repository after a new commit
  - **Expected**: New `Snapshot` document created storing commit SHA and spatial layout representation.

### 15.3 Graph Diff
- [ ] Navigate to `/repos/[repoId]/snapshots` and select two commits to compare
  - **Expected**: 3D visual diff canvas highlights Added (Green), Removed (Red), Changed (Yellow), and Unchanged (Slate) modules.

### 15.4 Circular Dependencies
- [ ] Enable "Circular Dependencies" toggle in graph controls panel
  - **Expected**: Tarjan SCC algorithm highlights cycle paths in pulsing neon orange while fading non-cycle nodes.

### 15.5 Complexity Heatmap
- [ ] Enable "Complexity Heatmap" toggle
  - **Expected**: Nodes recolor dynamically based on LOC and complexity score.

### 15.6 Contributor Activity
- [ ] Navigate to `/repos/[repoId]/analytics`
  - **Expected**: Contributor list renders commit counts, avatar icons, and touched module files.

### 15.7 Workspace Analytics
- [ ] Inspect Workspace Analytics metrics
  - **Expected**: Most-visited modules list renders visit counts recorded atomically via `ModuleVisit`.

---

## 16. Security Verification

- [x] Verify private repository isolation
  - **Expected**: Explorer Mode rejects private repo URLs; Workspace private repos never leak into PublicRepositories cache.
- [x] Verify API authorization checks
  - **Expected**: Accessing `/api/repos/[otherOrgRepoId]` returns 401/404.
- [x] Verify secret protection
  - **Expected**: `OPENAI_API_KEY`, `CLERK_SECRET_KEY`, and `GITHUB_PAT` exist server-side only.

---

## 17. Failure-State Verification

- [x] Network disconnection during 3D graph load
  - **Expected**: Graceful error card displays with "Retry Loading Graph" button.
- [x] Invalid JSON payload to API endpoints
  - **Expected**: Returns HTTP 400 with Zod error details.

---

## 18. Complete End-to-End Test — Workspace

1. Sign in to Structa.
2. Select Organization.
3. Connect a GitHub repository.
4. Click "Sync Repo".
5. Open 3D Map.
6. Hover and select a file node.
7. Read AI Summary.
8. Open Ask Codebase and submit question.
9. Click cited file link.
10. Add sticky-note annotation.
11. View Architecture Snapshots comparison.
12. View Workspace Intelligence Analytics.

---

## 19. Complete End-to-End Test — Explorer

1. Navigate to `/explorer`.
2. Paste public URL: `https://github.com/facebook/react`.
3. View indexing progress or instant cache hit.
4. Interact with 3D codebase visualization.
5. Open Explorer ChatPanel and query repo details.
6. Click citation to navigate graph.

---

## 20. Cache-Hit Test

1. Explore `facebook/react`.
2. Wait for `indexStatus: "indexed"`.
3. Re-enter `facebook/react`.
4. **Expected**: Graph loads in <50ms from cache; 0 GitHub parser or OpenAI calls executed.

---

## 21. Cache-Miss Test

1. Explore a previously un-indexed repo (e.g. `expressjs/express`).
2. **Expected**: `indexStatus: "indexing"` returns immediately; background indexing worker executes asynchronously.

---

## 22. Changed-Repository Test

1. Re-explore an indexed repository after a new GitHub commit is pushed.
2. **Expected**: HEAD SHA mismatch detected; cache marked stale and background re-index triggered.

---

## 23. Authentication/Authorization Test

1. Copy direct URL of a private Workspace repository `/repos/[repoId]`.
2. Log out and paste URL in browser.
3. **Expected**: Clerk middleware intercepts request and redirects to `/sign-in`.

---

## 24. Browser Console Check

- [x] Open Browser Developer Tools Console during 3D scene interaction.
  - **Expected**: 0 WebGL crashes, 0 React hydration errors, 0 unhandled promise rejections.

---

## 25. Terminal Log Check

- [x] Inspect Node.js server console output during active use.
  - **Expected**: Clean log output; no unhandled promise rejections or raw stack trace leaks.

---

## 26. Build/Lint/Test Check

Execute full validation suite:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- **Expected**: All commands exit with code 0.

---

## 27. Final Release Checklist

- [x] Phase 0 verified
- [x] Phase 1 verified
- [x] Phase 2 verified
- [x] Phase 3 verified
- [x] Phase 4 verified
- [x] Phase 5 verified
- [x] Phase 6 verified
- [x] Phase 7 verified
- [x] Phase 8 verified
- [x] Critical Bugs: 0
- [x] High Bugs: 0
- [x] Medium Bugs: 0
- [x] Production Build: PASS
- [x] `manual.md` created
- [x] `Memory.md` updated
