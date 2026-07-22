# PRD.md — Structa

## 1. Product Overview

**Product name:** Structa
**One-line pitch:** Structa turns any GitHub repository into a living, explorable 3D architecture map with AI-generated documentation and an "ask the codebase" chat.

**Vision:** Replace weeks of manual codebase spelunking and stale onboarding wikis with a live, AI-annotated 3D map of a repository's real structure — one that updates every time the code does, and that a developer can literally fly through and ask questions of.

## 2. Problem Statement

New engineers routinely spend 2–4 weeks just building a mental model of a codebase before they can contribute meaningfully. Open-source maintainers lose contributors because onboarding docs go stale the moment the code changes. Engineering managers have no fast way to see which modules are risky, brittle, or under-owned. Structa replaces tribal knowledge and stale wikis with a live, AI-annotated 3D map that updates every time the repo does.

## 3. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| **New hire / onboarding engineer** | Just joined a team, needs to understand an unfamiliar codebase fast | A fast, visual mental model instead of reading files linearly |
| **OSS maintainer** | Maintains a public repo, wants to lower the barrier for new contributors | Always-fresh docs and architecture overview without manual upkeep |
| **Engineering manager / lead** | Doing architecture reviews, assessing risk/ownership | A bird's-eye view of complexity, ownership, and change hotspots |
| **Job-seeker / candidate** | Wants to demonstrate deep codebase-understanding skill in interviews | A tool that makes exploring a large unfamiliar repo look and feel impressive |

## 4. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Fast time-to-understanding | A new user can connect a repo and see a navigable 3D map in < 60s for a repo with ≤ 2,000 files |
| AI grounding is actually useful, not generic | ≥ 80% of "Ask the Codebase" answers reference specific, real modules (cited) |
| Visualization scales | 3D graph stays interactive (≥ 30fps) up to 500 nodes without LOD, and remains usable beyond that with LOD reduction |
| Org/team adoption loop works | ≥ 1 team seat invited per 5 connected private repos (directional MVP signal) |
| Demonstrates real engineering depth | Full RBAC + billing + webhook-driven sync pipeline functioning end-to-end |

## 5. Scope

### In Scope (MVP)
- GitHub OAuth connection and public/private repo import
- Automated parsing of file/folder tree and import graph
- AI-generated one-paragraph summary per file/module
- Interactive 3D dependency graph
- Semantic code search
- "Ask the Codebase" AI chat grounded in parsed repo data
- Dashboard of connected repos with a computed health score
- AI-generated README/architecture doc export
- Org accounts with Admin/Editor/Viewer roles
- Stripe subscription billing (Free vs Pro/Org plan)

### Explicitly Out of Scope for MVP
- VS Code extension
- Full AST-level parsing (MVP uses import-graph heuristics, not a full compiler frontend)
- Multi-repo monorepo cross-linking
- Slack/Discord webhook alerts
- Public shareable read-only map links
- Voice narration
- Multi-language parsing beyond JS/TS (Python/Go/Rust are Phase 2+)

## 6. Complete Feature List

### Core Features (MVP — must ship)
1. GitHub OAuth connection and repo import
2. Automated parsing of file/folder tree and import graph
3. AI-generated one-paragraph summary per file/module
4. Interactive 3D dependency graph (folders/files as nodes, imports as edges)
5. Semantic code search ("find where auth tokens are validated")
6. "Ask the Codebase" AI chat grounded in the parsed repo
7. Dashboard of connected repos with a computed health score
8. One-click export of an AI-generated README/architecture doc

### Advanced Features (MVP — should ship if time allows, else Phase 2)
9. Circular-dependency detection and highlighting
10. Cyclomatic-complexity heatmap overlay on the 3D graph
11. Contributor activity timeline mapped onto modules
12. Role-based AI onboarding checklists (frontend/backend/devops)
13. Side-by-side comparison view for two repos
14. Slack/Discord webhook alerts on architecture-affecting PRs
15. Versioned architecture snapshots with visual diffing
16. Sticky-note style annotations pinned to any 3D node

### Premium Features (post-MVP monetization expansion)
17. Private repo support with encrypted token storage
18. Org accounts with Admin/Editor/Viewer seats
19. AI refactor suggestions that draft an actual PR description
20. Embeddable, read-only interactive map widget for internal wikis
21. Usage analytics: most-visited modules, who explored what
22. Higher-throughput priority AI queries

### Nice-to-Have Features (backlog, not scheduled)
23. VS Code extension that syncs cursor position to the 3D map
24. Public shareable read-only map links
25. "Repo health" badge for README files
26. Space/void theme customization for the 3D canvas
27. Voice narration of AI module explanations
28. Multi-language parsing (Python, Go, Rust, in addition to JS/TS)

## 7. User Stories (MVP)

- *As a new hire*, I can connect our team's repo and see a 3D map of its structure within a minute, so I can start building a mental model immediately.
- *As a new hire*, I can click any node and get an AI summary of what it does, so I don't have to read every file line-by-line.
- *As a new hire*, I can ask "where is X handled?" in the chat and get an answer that cites real files, so I trust the answer instead of a generic guess.
- *As an OSS maintainer*, I can export an AI-generated architecture doc, so my README stays roughly current without manual rewriting.
- *As an engineering manager*, I can toggle a complexity heatmap, so I can spot risky, overly complex modules at a glance.
- *As an org admin*, I can invite teammates with Editor/Viewer roles and manage which private repos are connected, so access stays controlled.
- *As a subscriber*, I can upgrade to Pro/Org to unlock private repos and higher AI usage limits, so the product scales with my team's needs.

## 8. Non-Goals

- Structa does **not** replace a full IDE or static-analysis/linting tool — it visualizes structure and generates explanatory summaries, not enforce code style.
- Structa does **not** claim 100% accurate dependency resolution for every possible build tool/bundler config in MVP — it uses reasonable import-graph heuristics, with full AST parsing as a stated future improvement.
- Structa is **not** a general-purpose chatbot — the "Ask the Codebase" chat is always grounded in a specific connected repo's parsed data.

## 9. Assumptions & Constraints

- GitHub is the only supported Git host in MVP (no GitLab/Bitbucket).
- OpenAI API is the LLM provider for summarization, chat, and refactor suggestions.
- Private repo tokens are encrypted at rest; access is scoped to the minimum GitHub permissions needed (repo contents, read-only, plus webhook registration).
- Parsing very large monorepos (10k+ files) is a known MVP limitation — the health-score and graph pipeline is optimized for typical app-sized repos (up to a few thousand files) with LOD-based graceful degradation beyond that.
