# Architecture.md — Structa

## 1. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | Next.js (App Router) | Streaming AI responses, server components for repo data fetch |
| Language | TypeScript | Type-safe AST/graph parsing pipeline |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent dashboard UI |
| Auth | Clerk | Auth plus built-in Organizations for team seats |
| Database | MongoDB + Mongoose | Flexible schema for arbitrary graph-shaped repo data |
| 3D | React Three Fiber (Three.js) | Renders the navigable 3D dependency graph |
| Animation | Framer Motion | Node hover states, side-panel transitions |
| Icons | Lucide React | UI iconography |
| Git integration | Octokit (GitHub API) | Fetching repo contents, commits, PR events |
| AI | OpenAI API + Vercel AI SDK | Code summarization, chat Q&A, refactor suggestions, streaming |
| File uploads | UploadThing | Org logo/avatar uploads |
| Email | Resend | Architecture-change email alerts |
| Payments | Stripe | Premium/org subscription billing |
| Rate limiting | Upstash Redis | Rate limiting AI and sync endpoints |
| Deployment | Vercel | Hosting, edge network, environment management |

## 2. High-Level Data Flow

```
Browser (Client Components)
   │  user actions (connect repo, ask chat, open node)
   ▼
Next.js Route Handlers / Server Actions  ── Zod validation ──►  Business logic
   │                                                              │
   ├──► Octokit ──► GitHub API (repo contents, commits, PRs)      │
   ├──► OpenAI API (summarize, chat, refactor suggestions) ◄──────┘
   ├──► MongoDB (Users, Organizations, Repositories, Modules, Snapshots, Annotations, ChatSessions, Notifications)
   ├──► Stripe (subscriptions) / Resend (emails) / UploadThing (uploads)
   ▼
Response streamed or returned to client → React Server Components render → 3D graph hydrates client-side
```

- **Server Components** render repo/module metadata already cached in MongoDB at request time (fast first paint, no client waterfall).
- **Client Components** (3D canvas, chat UI, modals) hydrate separately and fetch their own data via lightweight Route Handlers once mounted.
- **Server Actions** handle all mutations (connect repo, trigger sync, create annotation) — never direct client-to-MongoDB writes.
- **Webhooks** (GitHub push/PR events, Clerk user/org events, Stripe subscription events) are the system's event-driven backbone for keeping data fresh without polling.

## 3. Rendering Strategy

| Route type | Strategy | Notes |
|---|---|---|
| Marketing (`/`, `/pricing`) | SSG | Fully static, ISR-revalidated on content change |
| Dashboard shell | SSR | Per-org data, wrapped in `<Suspense>` |
| 3D graph payload | Client-fetched | Fetched via Route Handler after canvas mounts, keeps first paint fast |
| Chat | Streamed | Vercel AI SDK `useChat`, tokens streamed from Route Handler |
| Analytics aggregations | Cached | `unstable_cache`, 5-minute TTL |

## 4. Database Design (MongoDB)

**Users**
```
_id, clerkId: string, email: string, name: string, avatarUrl: string,
plan: enum['free','pro'], createdAt: Date
```

**Organizations**
```
_id, name: string, ownerId: ref Users,
members: [{ userId: ref Users, role: enum['admin','editor','viewer'] }],
plan: enum, createdAt: Date
```

**Repositories**
```
_id, orgId: ref Organizations, githubRepoId: string, name: string, url: string,
isPrivate: boolean, lastSyncedAt: Date, healthScore: number
```

**Modules**
```
_id, repoId: ref Repositories, path: string, type: enum['file','folder'],
summary: string, complexityScore: number,
imports: [ref Modules], importedBy: [ref Modules]
```

**Snapshots**
```
_id, repoId: ref Repositories, createdAt: Date, graphJson: object, diffFromPrevious: object
```

**Annotations**
```
_id, repoId: ref Repositories, moduleId: ref Modules, userId: ref Users,
text: string, createdAt: Date
```

**ChatSessions**
```
_id, repoId: ref Repositories, userId: ref Users,
messages: [{ role, content, createdAt }]
```

**Notifications**
```
_id, orgId: ref Organizations, type: string, payload: object, read: boolean, createdAt: Date
```

**Relationships summary:** `Organizations` own `Repositories`; `Repositories` own `Modules`, `Snapshots`, `Annotations` (via `moduleId`), and `ChatSessions`. `Users` belong to `Organizations` via the `members` array and are referenced by `Annotations`/`ChatSessions` as authors.

## 5. Authentication Flow

Sign-up/login run entirely through Clerk's hosted components (`<SignIn/>`, `<SignUp/>`) mounted at `/sign-in` and `/sign-up`, with GitHub OAuth as the primary provider so a repo connection can piggyback on the same token. Clerk middleware protects every route under `(dashboard)` — unauthenticated requests redirect to `/sign-in`. Organization membership (Admin/Editor/Viewer) is stored via Clerk Organizations and mirrored into the `Organizations` collection on webhook events, and Server Actions re-check the caller's role before any mutating operation (e.g., only Admins can connect private repos or manage billing). User profile data (avatar, plan) syncs from Clerk into `Users` via a `user.updated` webhook. Sessions are handled entirely by Clerk's JWT-based session tokens, verified in middleware and in Route Handlers.

## 6. Folder Structure

```
Structa/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── repos/[repoId]/
│   │   │   ├── page.tsx              # 3D map
│   │   │   ├── chat/page.tsx
│   │   │   └── snapshots/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── admin/page.tsx
│   ├── api/
│   │   ├── repos/route.ts
│   │   ├── repos/[repoId]/sync/route.ts
│   │   ├── repos/[repoId]/graph/route.ts
│   │   ├── chat/route.ts
│   │   ├── annotations/route.ts
│   │   ├── analytics/[repoId]/route.ts
│   │   └── webhooks/{clerk,github,stripe}/route.ts
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                          # shadcn components
│   ├── three/
│   │   ├── DependencyGraphScene.tsx
│   │   ├── Node.tsx
│   │   └── Edge.tsx
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   └── MessageBubble.tsx
│   └── shared/
│       ├── RepoCard.tsx
│       ├── HealthScoreRing.tsx
│       └── Toaster.tsx
├── lib/
│   ├── mongodb.ts
│   ├── github.ts                   # Octokit wrapper
│   ├── openai.ts
│   ├── stripe.ts
│   ├── ratelimit.ts                # Upstash config
│   └── utils.ts
├── models/
│   ├── User.ts
│   ├── Organization.ts
│   ├── Repository.ts
│   ├── Module.ts
│   ├── Snapshot.ts
│   ├── Annotation.ts
│   ├── ChatSession.ts
│   └── Notification.ts
├── actions/
│   ├── repos.ts                    # connect, sync, delete
│   ├── chat.ts
│   ├── annotations.ts
│   └── billing.ts
├── hooks/
│   ├── use-graph-data.ts
│   └── use-chat-session.ts
├── middleware.ts
└── types/
    └── graph.ts
```

**Rule:** new files go where this structure says. Proposing a structural change requires flagging it explicitly per `Rules.md`, not silently deviating.

## 7. API Design

| Method | Endpoint | Purpose | Auth | Example Response |
|---|---|---|---|---|
| POST | `/api/repos` | Connect a new GitHub repo | Required | `{repoId, name, status:"syncing"}` |
| GET | `/api/repos` | List org's repos | Required | `{repos: [...]}` |
| POST | `/api/repos/[id]/sync` | Trigger re-parse of repo | Required (Editor+) | `{status:"queued"}` |
| GET | `/api/repos/[id]/graph` | Fetch graph JSON for 3D scene | Required | `{nodes:[...], edges:[...]}` |
| POST | `/api/chat` | Ask AI a question about a repo | Required | `{answer, citedModules:[...]}` |
| GET | `/api/repos/[id]/snapshots` | List architecture snapshots | Required | `{snapshots:[...]}` |
| POST | `/api/annotations` | Create a node annotation | Required | `{annotationId}` |
| DELETE | `/api/annotations/[id]` | Remove annotation | Required (owner) | `{success:true}` |
| POST | `/api/webhooks/github` | Receive push/PR events | Signature-verified | `{received:true}` |
| POST | `/api/webhooks/stripe` | Handle subscription events | Signature-verified | `{received:true}` |
| POST | `/api/webhooks/clerk` | Sync user/org changes | Signature-verified | `{received:true}` |
| GET | `/api/analytics/[repoId]` | Usage/contributor analytics | Required (Admin) | `{topModules:[...]}` |

## 8. Security Architecture

- Zod validation on every Server Action and Route Handler input
- Clerk-issued JWTs verified in middleware for every protected route
- Role checks (Admin/Editor/Viewer) enforced server-side, never trusted from the client
- Rate limiting on `/api/chat` and `/api/repos/[id]/sync` via Upstash Redis
- All user-generated text (annotations, chat) sanitized before render to prevent XSS
- GitHub tokens encrypted at rest; never exposed to the client
- CSRF mitigated by SameSite cookies + Clerk's built-in protections
- Secrets (OpenAI, GitHub, Stripe keys) only in server-side environment variables

## 9. Performance Strategy

- `next/image` for all avatars/logos with automatic sizing
- Dynamic import of the R3F canvas (`next/dynamic`, `ssr:false`) so 3D libs don't block first paint
- Code-split chat panel and analytics charts into separate chunks
- ISR for the marketing/pricing pages
- SSR for dashboard shell, streamed with `<Suspense>` around the graph fetch
- `unstable_cache` for expensive graph-layout computations
- Debounced semantic search input
- Level-of-detail reduction on the 3D graph when node count exceeds ~500

## 10. Third-Party Integrations

| Service | Purpose | Failure Mode Handling |
|---|---|---|
| GitHub API (Octokit) | Repo import, sync, webhooks | Retry with backoff; surface "sync failed" state on repo card |
| OpenAI API | Summaries, chat, refactor suggestions | Timeout → graceful fallback message; never block graph rendering on AI failure |
| Clerk | Auth, Organizations | Webhook signature verification; treat Clerk as source of truth for identity |
| Stripe | Billing | Webhook-driven state sync; never trust client-reported plan status |
| Resend | Email alerts | Fire-and-forget, non-blocking; failures logged, not surfaced to user flow |
| Upstash Redis | Rate limiting | Fail-open with conservative default limit if Redis is unreachable, logged as a warning |
