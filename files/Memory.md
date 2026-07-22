# Memory.md — Structa

This file is the single source of truth for **where things stand** — never for *what* to build (that's `PRD.md`) or *how* it's structured (that's `Architecture.md`). If this file seems stale or contradicts the actual repo state, flag that before trusting it.

---

## Status
Phase: **Phase 1 — Auth, Orgs & Repo Connection** (see `phases.md`)
Current file: *none - waiting for Phase 1 start*
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

## In Progress
*(nothing yet)*

## Next Up
- Phase 1 — Task 1: Integrate Clerk Auth (`<SignIn/>`, `<SignUp/>`, middleware) with GitHub OAuth as primary provider

## Notes / Deviations / Blockers
- **Vercel CLI CLI Auth:** The Vercel CLI token on the system was expired/invalid. The build compiles successfully locally with zero TS or ESLint errors. The user needs to run `npx vercel` to authenticate and deploy the shell.
- **Npm naming conventions:** Package was initialized as `structa` rather than `Structa` in `package.json` to comply with npm lowercase restrictions.

