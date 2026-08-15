# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Phase Information

* **Phase Number**: Phase 4
* **Milestone**: `M4`
* **Task Numbers**: Tasks 1 through 9
* **Task Titles**:
  * Task 1: Audit Phase 2 & 3 Dependencies (Done)
  * Task 2: OpenAI Config & Client Setup (Done)
  * Task 3: Module Summarization Service (Done)
  * Task 4: Sync Pipeline Integration (Done)
  * Task 5: Chat Sessions Persistence & Route (Done)
  * Task 6: Chat React Hook & Message Bubble UI (Done)
  * Task 7: Grounded Chat Panel Viewport & Search (Done)
  * Task 8: Architecture Doc Export API (Done)
  * Task 9: UI Integration, Testing, Linting & Build Verification (Done)

---

## Change Summary (Phase 4)

* **Objective**: Build a robust, reusable AI Intelligence Layer including progressive module summarization, "Ask the Codebase" Q&A chat with citations, semantic search filters, and architecture doc export.
* **Reason for Implementation**: Primary product differentiator and core onboarding experience enabling instant developer comprehension of codebases.
* **What was Completed**:
  * Installed `openai` and `ai` (Vercel AI SDK) dependencies.
  * Implemented `lib/openai.ts`: Server-only OpenAI client singleton with timeout limits and gpt-4o-mini configurations.
  * Extended `models/Module.ts` with `summaryStatus` enum (`pending` | `generating` | `done` | `failed` | `skipped`) to track progressive AI processing.
  * Implemented `lib/ai/summarize.ts`: Reusable, repo-agnostic module summarization service with concurrency limits, token truncation, and error fallback states.
  * Modified `app/api/repos/[repoId]/sync/route.ts`: Integrated fire-and-forget background module summarization that is non-blocking to the user's graph-rendering sync response.
  * Implemented `models/ChatSession.ts`: Persisted chat Q&A history schema including citations.
  * Implemented `app/api/chat/route.ts`: Streaming POST chat handler leveraging OpenAI text-stream directly to circumvent ai-sdk v7 gateway peer-dependency constraints. Features Zod validation, role authentication, and strict organization ownership gates.
  * Implemented `hooks/use-chat-session.ts`: Custom client-side React hook managing text stream decoding, message state, and citation markers.
  * Implemented `components/chat/MessageBubble.tsx`: Styled chat bubbles using theme tokens with clickable module citation chips.
  * Implemented `components/chat/ChatPanel.tsx`: Collapsible "Ask the Codebase" utility featuring suggestions, message streaming, conversation search, and doc export.
  * Wired `ChatPanel` and `Sparkles` summary highlights into the main 3D Map viewport (`app/(dashboard)/repos/[repoId]/page.tsx`).
  * Implemented `app/api/repos/[repoId]/export/route.ts`: Route handler to generate and download AI-compiled markdown architecture documentation.
  * Created dedicated `app/(dashboard)/repos/[repoId]/chat/page.tsx` full-page workspace chat view.

---

## Files Created (Phase 4)

* `lib/openai.ts` — Server-side OpenAI client wrapper.
* `lib/ai/summarize.ts` — Codebase summarization engine.
* `models/ChatSession.ts` — Mongoose model for chat sessions.
* `app/api/chat/route.ts` — Chat text-streaming route.
* `app/api/repos/[repoId]/export/route.ts` — Architecture markdown doc export API.
* `hooks/use-chat-session.ts` — Custom text-streaming React hook.
* `components/chat/MessageBubble.tsx` — Chat message bubbles with citations.
* `components/chat/ChatPanel.tsx` — Technical slide-out chat view.
* `app/(dashboard)/repos/[repoId]/chat/page.tsx` — Workspace Chat page.
* `app/(dashboard)/repos/[repoId]/chat/ChatPageClient.tsx` — Client wrapper for the Chat page.

---

## Files Modified (Phase 4)

* `models/Module.ts` — Added `summaryStatus` enum field.
* `types/graph.ts` — Added summary fields to `GraphNode` interface.
* `lib/layout.ts` — Propagated summary fields through force simulation layout nodes.
* `app/api/repos/[repoId]/graph/route.ts` — Included summary fields in the layout output.
* `app/api/repos/[repoId]/sync/route.ts` — Wired background AI summarization job.
* `app/(dashboard)/repos/[repoId]/page.tsx` — Added Chat Panel drawer and AI summary card to the node panel.
* `files/phases.md` — Marked Phase 4 milestone completed.
* `files/Memory.md` — Updated for Phase 4 status.

---

## Files Deleted

*(None)*

---

## APIs

* `GET /api/repos` — List org's connected repositories.
* `POST /api/repos` — Connect a new GitHub repository.
* `POST /api/repos/[repoId]/sync` — Parse repository & launch progressive AI summarization.
* `GET /api/repos/[repoId]/graph` — Fetch computed 3D layout coordinates, now with summaries.
* `POST /api/chat` — Request streaming assistant answers grounded in codebase module data.
* `GET /api/repos/[repoId]/export` — Generate and export structural architecture Markdown.

---

## Models

* **User** (`users`)
* **Organization** (`organizations`)
* **Repository** (`repositories`)
* **Module** (`modules` — stores AST statistics and one-paragraph AI summary)
* **ChatSession** (`chatsessions` — stores grounded message histories)

---

## Components

* **RepoCard** (`components/shared/RepoCard.tsx`)
* **HealthScoreRing** (`components/shared/HealthScoreRing.tsx`)
* **Node** (`components/three/Node.tsx`)
* **Edge** (`components/three/Edge.tsx`)
* **DependencyGraphScene** (`components/three/DependencyGraphScene.tsx`)
* **ChatPanel** (`components/chat/ChatPanel.tsx`)
* **MessageBubble** (`components/chat/MessageBubble.tsx`)

---

## Libraries

* `@clerk/nextjs` (v7.5.22) — Auth & Org mapping.
* `openai` (v4.x) — Chat completions & streams.
* `ai` (v7.x) — Vercel AI SDK core utilities.
* `zod` (v4.4.3) — Schema validator.
* `@upstash/ratelimit` — Security rate-limiting.

---

## Environment Variables

* `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
* `CLERK_SECRET_KEY`
* `CLERK_WEBHOOK_SECRET`
* `MONGODB_URI`
* `GITHUB_CLIENT_ID`
* `GITHUB_CLIENT_SECRET`
* `UPSTASH_REDIS_REST_URL`
* `UPSTASH_REDIS_REST_TOKEN`
* `OPENAI_API_KEY` (Server-only secret)

---

## Validation Results

* **Build**: ✅ Success (Turbopack production build compiles with 0 errors)
* **TypeScript**: ✅ Success (0 compiler issues)
* **ESLint**: ✅ Success (0 linting or styling rule violations)
* **Prettier**: ✅ Success (Formatted output matches config)

---

## Next Steps

* **Next Task**: Phase 5 — Task 1: Build the GitHub Search Service (`lib/github-search.ts`).
* **Next Phase**: Phase 5 — Repository Discovery & Explorer Foundations.
* **Current Project Progress**: Phase 4 AI Intelligence Layer is 100% complete and fully verified.
