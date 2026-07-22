# Rules.md — Structa

These are hard constraints. If a rule and a convenient shortcut conflict, **the rule wins.** Flag the conflict instead of silently violating it. Priority order when documents conflict: `Rules.md` > `Architecture.md` > `PRD.md` > `design.md` > `phases.md`.

## 1. Mandatory Stack — always use

- **Next.js App Router** — no Pages Router, ever. No `pages/` directory.
- **TypeScript** everywhere — no `.js`/`.jsx` files in `app/`, `components/`, `lib/`, `actions/`.
- **Tailwind CSS + shadcn/ui** for all styling and base components. No CSS-in-JS libraries (styled-components, Emotion), no plain `.css` modules except genuinely global resets.
- **Clerk** for all auth. No custom session/JWT handling, no NextAuth.
- **MongoDB + Mongoose** for all persistence. No Prisma, no direct MongoDB driver calls bypassing Mongoose models.
- **React Three Fiber** for the 3D graph. No raw Three.js imperative scenes outside R3F's declarative component model, no Spline for this project (R3F was chosen specifically for graph-shaped data).
- **Framer Motion** for all animation — no manual CSS keyframes for interactive UI motion (static marketing-page keyframes are acceptable if trivial).
- **Lucide React** for all icons — no mixing in another icon set.
- **Vercel** for deployment. No assumptions about Node runtime features unavailable on Vercel's Edge/Serverless runtimes.

## 2. Mandatory Patterns

- **All mutations go through Server Actions or Route Handlers** — never call MongoDB directly from a Client Component.
- **All external input is validated with Zod** before it touches business logic — Server Action arguments, Route Handler bodies, and webhook payloads alike.
- **Role checks are server-side, always** — a client-side `role === 'admin'` check is a UX nicety, never the actual gate. The real gate lives in the Server Action/Route Handler.
- **The 3D canvas is always a dynamically imported Client Component** (`next/dynamic`, `ssr:false`) — never imported directly into a Server Component tree.
- **Secrets never reach the client bundle.** OpenAI, GitHub, Stripe, and Resend keys are read only in server-side files (Route Handlers, Server Actions, `lib/`). If a value must reach the client, it goes through `NEXT_PUBLIC_` explicitly and deliberately, never by accident.
- **Webhook handlers verify signatures before processing** (GitHub, Clerk, Stripe) — no exceptions, even in early development.
- **AI calls are never made directly from a Client Component.** All OpenAI calls route through a Server Action or Route Handler so keys stay server-side and responses can be cached/rate-limited.
- **Every list of unbounded size is paginated or virtualized** — repo lists, chat history, annotations.

## 3. Explicitly Avoid

- ❌ No `pages/` directory or Pages Router APIs (`getServerSideProps`, `getStaticProps`).
- ❌ No `any` type in TypeScript except at a well-isolated third-party-library boundary, and only with a comment explaining why.
- ❌ No inline `style={{...}}` props for anything expressible in Tailwind.
- ❌ No client-side polling loops for data that a webhook or Server Action revalidation should handle instead.
- ❌ No storing GitHub tokens, OpenAI keys, or Stripe secrets in MongoDB documents in plaintext — encrypt tokens at rest.
- ❌ No blocking the 3D graph's first render on an AI call — summaries populate progressively, not as a load-bearing dependency of the graph itself rendering.
- ❌ No generic, templated-looking UI — this product's differentiator is the 3D experience and grounded AI chat; don't let the dashboard shell regress into a generic default-shadcn-theme CRUD look (see `design.md`).
- ❌ No building a generic-purpose chatbot — the "Ask the Codebase" chat must always be grounded in a specific repo's parsed data, with citations.
- ❌ No skipping rate limiting on AI-calling endpoints "for now" — cost-control is a correctness requirement, not a polish item.
- ❌ No introducing a new library, pattern, or architectural change not already described in `Architecture.md` without proposing it and waiting for confirmation.

## 4. Coding Conventions

- **Naming:** PascalCase for components (`RepoCard.tsx`), camelCase for functions/variables, kebab-case for route folders that need it, UPPER_SNAKE_CASE for env vars.
- **File placement:** exactly matches `Architecture.md`'s folder structure. If a file doesn't obviously belong anywhere in that structure, stop and ask rather than guessing a new top-level folder.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) — see `phases.md` for milestone tagging.
- **One task at a time:** work exactly one task from `phases.md` per session/PR. Unrelated "while I'm here" fixes get logged as a note in `Memory.md`, not bundled in.
- **Error handling:** every Server Action and Route Handler wraps its logic in try/catch and returns a typed `{success, data}` or `{success: false, error}` shape — never lets an unhandled exception reach the client as a raw 500 with no context.
- **Loading/error/empty states are not optional** — every data-fetching page needs a `loading.tsx`/`<Suspense>` fallback, an `error.tsx`, and a designed empty state before it's considered "done," not added later as polish.

## 5. Ambiguity & Conflict Protocol

- If a task in `phases.md` is ambiguous, or if `PRD.md`/`Architecture.md`/`Rules.md` conflict with each other, **stop and ask** — don't guess and proceed.
- If a listed library or pattern genuinely doesn't work for a specific task, state the deviation explicitly, explain why, and wait for confirmation before proceeding. Never silently substitute a different approach.
- Keep changes scoped to files relevant to the current task only.
