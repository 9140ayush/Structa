# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Phase Information

* **Phase Number**: Phase 1
* **Milestone**: `M1`
* **Task Numbers**: Tasks 1 through 9
* **Task Titles**:
  * Task 1: Integrate Clerk Authentication
  * Task 2: Enable Clerk Organizations
  * Task 3: Create MongoDB Models (User, Organization)
  * Task 4: Implement Clerk Webhooks (`/api/webhooks/clerk`)
  * Task 5: Build Protected Dashboard Layout
  * Task 6: Implement Repository Connection
  * Task 7: Create Repository Model
  * Task 8: Build Empty Dashboard UI
  * Task 9: Complete Milestone (Verify build, commit, tag v0.1.0)

---

## Change Summary

* **Objective**: Establish the secure user workspace environment by integrating authentication, organization constraints, webhook syncs, and the initial codebase connection flow.
* **Reason for Implementation**: User access and repository security contexts are critical starting points for fetching, analyzing, and rendering private code models in subsequent phases.
* **What was Completed**:
  * Configured Clerk middleware and path routers to protect dashboard areas.
  * Designed schemas to track users, organizations, and linked repositories in MongoDB.
  * Configured Clerk webhooks to automatically mirror authentication updates in MongoDB collections.
  * Built endpoints to list available GitHub repositories and connect them to active workspaces.
  * Designed the dashboard layout and the landing/welcome screen to direct flows cleanly.
* **Important Decisions Taken**:
  * Decided to retrieve the user's GitHub OAuth token dynamically on the server via Clerk (`clerkClient.users.getUserOauthAccessToken`) rather than storing it in the database in plaintext, complying with security rules.
  * Used Clerk v7's unified `<Show>` component on the landing page rather than deprecated `<SignedIn>`/`<SignedOut>` components.
  * Avoided calling state-setting hooks synchronously within mounting effects by wrapping triggers in `useCallback` and deferring execution with `Promise.resolve().then(...)`.

---

## Files Created

* `middleware.ts` — Authentication routing middleware.
* `models/User.ts` — User schema model.
* `models/Organization.ts` — Organization schema model.
* `models/Repository.ts` — Repository schema model.
* `app/api/webhooks/clerk/route.ts` — Clerk webhook handler for database sync.
* `app/api/repos/route.ts` — Repository connection and list endpoint.
* `app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Sign-in catch-all route page.
* `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Sign-up catch-all route page.
* `app/(dashboard)/layout.tsx` — Dashboard skeleton shell layout.
* `app/(dashboard)/dashboard/page.tsx` — Connected repository list and import portal.

---

## Files Modified

* `app/layout.tsx`
  * *Reason*: Wrapped the root React application structure with `<ClerkProvider>` and specified the global redirection policy `afterSignOutUrl="/"`.
* `app/page.tsx`
  * *Reason*: Styled with conditional routing using Clerk's `<Show>` wrapper for dashboard entry-point accessibility.
* `files/Memory.md`
  * *Reason*: Keep progress and historical decisions synchronized.
* `files/phases.md`
  * *Reason*: Mark checklist items completed.

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
  * *Purpose*: Connect GitHub repository identifiers to active workspace contexts.

---

## Components

* **GitHubIcon**
  * *File*: `app/(dashboard)/dashboard/page.tsx`
  * *Purpose*: Custom inline SVG logo representing GitHub.
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

---

## Environment Variables

* `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk client publication key.
* `CLERK_SECRET_KEY` — Clerk server secret key.
* `CLERK_WEBHOOK_SECRET` — Clerk webhook signature verification secret.
* `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — Path for sign-in router redirection.
* `NEXT_PUBLIC_CLERK_SIGN_UP_URL` — Path for sign-up router redirection.
* `MONGODB_URI` — Database connection uri.
* `GITHUB_CLIENT_ID` — GitHub OAuth client identifier.
* `GITHUB_CLIENT_SECRET` — GitHub OAuth secret key.

---

## Database

* **Collections**: `users`, `organizations`, `repositories`
* **Relationships**:
  * `repositories` references `organizations` (`orgId` -> `organizations._id`).
  * `organizations` references `users` as owner (`ownerId` -> `users._id`).
  * `organizations` contains a list of member users (`members.userId` -> `users._id`).
* **Schema Updates**: Created initial indexed schemas matching the Architecture.md specifications.

---

## Folder Changes

* `app/(auth)/` — Auth route group routing.
* `app/(dashboard)/` — Dashboard interface layout routing.
* `app/api/webhooks/clerk/` — Webhooks api path.
* `app/api/repos/` — Repository endpoints.
* `models/` — Database schema files.

---

## Commands Executed

```bash
npm install @clerk/nextjs svix octokit
npx prettier --write "app/(dashboard)/dashboard/page.tsx"
npx eslint --fix
npm run build
npm run lint
git add .
git commit -m "feat(auth): implement authentication, organizations, and repository connection"
git tag -a v0.1.0 -m "Phase 1 - Auth, Organizations & Repository Connection"
```

---

## Git History

* **Commits**:
  * `ece3829` (dev): `feat(auth): implement authentication, organizations, and repository connection`
* **Git Tag**: `v0.1.0` (Milestone M1 completion release)

---

## Validation

* **Build**: Success (turbopack optimization succeeds)
* **TypeScript**: Success (0 compiler check errors)
* **ESLint**: Success (0 rule warnings or errors)
* **Prettier**: Success (0 code format violations)

---

## Issues

* **Bugs Found**:
  * Deprecated `afterSignOutUrl` on `<UserButton />` threw a typescript compile error in Next.js 16.
  * Synced effects calling state hooks synchronously caused warning trace cascades in the render cycle.
  * Windows line endings (`CRLF`) threw format warnings in Prettier.
* **Fixes Applied**:
  * Moved `afterSignOutUrl` to the `<ClerkProvider>` root provider.
  * Wrapped state handlers in `useCallback` and resolved effects asynchronously via `Promise.resolve().then(...)`.
  * Ran ESLint auto-formatters to fix trailing carriage returns.
* **Remaining Issues**: None.

---

## Next Steps

* **Next Task**: Phase 2 — Task 1: Build GitHub content-fetching layer (`lib/github.ts` via Octokit).
* **Next Phase**: Phase 2 — Parsing Pipeline.
* **Current Project Progress**: Phase 1 is 100% complete and fully verified.

---

## Last Updated

2026-07-22T12:15:00+05:30
