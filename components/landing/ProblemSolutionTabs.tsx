"use client";

/**
 * components/landing/ProblemSolutionTabs.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Interactive problem/solution pill-tab section inspired by incident.io structure.
 * Grounded in PRD.md architecture realities:
 * 1. Architecture Drift (docs rot vs real code)
 * 2. Slow Onboarding (weeks spent tracing code paths)
 * 3. Hidden Circular Loops (invisible cyclic dependencies)
 * 4. Blind Refactoring (unknown blast radius)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileWarning,
  Clock,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  GitPullRequest,
  Network,
  Search,
  Sparkles,
} from "lucide-react";

interface TabData {
  id: string;
  pillLabel: string;
  pillSub: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  problem: {
    badge: string;
    headline: string;
    points: string[];
    stat: string;
    statLabel: string;
  };
  solution: {
    badge: string;
    headline: string;
    points: string[];
    stat: string;
    statLabel: string;
  };
}

const TABS: TabData[] = [
  {
    id: "drift",
    pillLabel: "Architecture Drift",
    pillSub: "Docs rot vs real code",
    icon: FileWarning,
    title: "Architecture Drift & Stale Documentation",
    description:
      "Static documentation becomes obsolete the moment a pull request merges. Mental models remain locked in senior engineers' heads.",
    problem: {
      badge: "The Stale Reality",
      headline: "READMEs and Confluence diagrams last updated 11 months ago",
      points: [
        "Architectural diagrams drift within days of project kickoff",
        "New microservices and exports undocumented in repo root",
        "PR reviewers guess whether changes violate module boundaries",
      ],
      stat: "84%",
      statLabel: "of engineering teams report outdated architecture docs",
    },
    solution: {
      badge: "With Structa",
      headline: "Continuous, automated AST topology synchronized on every commit",
      points: [
        "Abstract Syntax Trees parsed directly from git commits in seconds",
        "Every file, export, and import edge mapped in real-time 3D",
        "Zero manual documentation maintenance required from developers",
      ],
      stat: "100%",
      statLabel: "codebase sync on git push via automated webhooks",
    },
  },
  {
    id: "onboarding",
    pillLabel: "Slow Onboarding",
    pillSub: "Weeks spent tracing",
    icon: Clock,
    title: "The 3-Week Codebase Onboarding Wall",
    description:
      "New engineers spend days clicking between files, tracing import statements, and asking senior teammates where execution begins.",
    problem: {
      badge: "The Onboarding Tax",
      headline: "140+ files, unknown entry points, and zero spatial orientation",
      points: [
        "New hires read files in arbitrary alphabetical directory order",
        "Senior engineers interrupted repeatedly to explain data flows",
        "First meaningful PR delayed by weeks of exploratory confusion",
      ],
      stat: "2.5 Weeks",
      statLabel: "average ramp-up time before a new engineer ships safely",
    },
    solution: {
      badge: "With Structa",
      headline: "Topological Reading Paths & AI-synthesized module summaries",
      points: [
        "Curated Reading Paths sequence modules from entry point to core logic",
        "Instant one-paragraph AI architectural synopses for every directory",
        "Interactive 2D tiered layers display exact system boundaries",
      ],
      stat: "< 1 Day",
      statLabel: "to complete mental clarity with structured reading paths",
    },
  },
  {
    id: "loops",
    pillLabel: "Hidden Circular Loops",
    pillSub: "Invisible import cycles",
    icon: RefreshCw,
    title: "Invisible Circular Dependencies & Bundle Bloat",
    description:
      "Tightly coupled circular imports sneak into large repos unnoticed, breaking tree-shaking and triggering hard-to-reproduce runtime initialization race conditions.",
    problem: {
      badge: "Silent Corruption",
      headline: "Circular imports create undefined runtime imports in production",
      points: [
        "Standard linters miss deep multi-hop circular dependency paths (A→B→C→A)",
        "Webpack/Vite bundlers inflate bundle sizes due to unshakeable dead code",
        "Modules fail at runtime with cryptic 'TypeError: Cannot read properties of undefined'",
      ],
      stat: "3+ Hops",
      statLabel: "average cycle depth invisible to basic static file linting",
    },
    solution: {
      badge: "With Structa",
      headline: "Tarjan's Strongly Connected Components algorithm isolates every cycle",
      points: [
        "Instant detection of all circular dependency clusters across the entire graph",
        "Cycles highlighted in high-contrast red with step-by-step uncoupling paths",
        "Health score penalties quantify the exact architectural severity",
      ],
      stat: "O(V + E)",
      statLabel: "linear-time Tarjan cycle detection with zero missed loops",
    },
  },
  {
    id: "refactoring",
    pillLabel: "Blind Refactoring",
    pillSub: "Unknown blast radius",
    icon: ShieldAlert,
    title: "Blind Refactoring & Cascading Regression Risks",
    description:
      "Changing a shared utility or modifying a database handler triggers unseen breaks across distant modules that unit tests failed to cover.",
    problem: {
      badge: "The Fear Factor",
      headline: "Developers avoid cleaning legacy code due to unknown blast radius",
      points: [
        "Uncertainty about which distant micro-features depend on a helper",
        "Refactoring touches trigger unexpected production incidents",
        "Codebases accumulate dead branches and legacy shims out of caution",
      ],
      stat: "62%",
      statLabel: "of developers fear refactoring core utilities without visual maps",
    },
    solution: {
      badge: "With Structa",
      headline: "Interactive Blast Radius visualizer illuminates all affected dependents",
      points: [
        "Click any node to see upstream callers and downstream dependencies",
        "Depth-based impact scoring warns if a module is critical to core runtime",
        "Architectural snapshots compare pre-and-post pull request structural drift",
      ],
      stat: "100%",
      statLabel: "downstream dependency visibility before committing any line",
    },
  },
];

export function ProblemSolutionTabs() {
  const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === activeTabId) ?? TABS[0];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="problem-heading">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
          Architectural Friction
        </span>
        <h2
          id="problem-heading"
          className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight mt-3"
        >
          Why Modern Engineering Teams Struggle with Complex Repositories
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Codebases grow exponentially. Human working memory does not. Select a challenge below to
          see how Structa replaces guesswork with automated architectural clarity.
        </p>
      </div>

      {/* Pill Tabs Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-left transition-all duration-200 border cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md font-semibold"
                  : "bg-surface/80 hover:bg-surface border-border text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
              <div>
                <span className="block text-xs font-sans leading-none">{tab.pillLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Comparison Cards */}
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Left Card: The Problem (Before Structa) */}
            <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive font-mono text-[11px] font-semibold mb-4">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{activeTab.problem.badge}</span>
                </div>

                <h3 className="text-xl font-heading font-semibold text-foreground leading-snug">
                  {activeTab.problem.headline}
                </h3>

                <ul className="mt-6 space-y-3.5">
                  {activeTab.problem.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/70 mt-2 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metric Box */}
              <div className="mt-8 pt-6 border-t border-border/60 flex items-baseline gap-3">
                <span className="font-heading text-3xl font-bold text-destructive">
                  {activeTab.problem.stat}
                </span>
                <span className="text-xs font-mono text-muted-foreground leading-tight">
                  {activeTab.problem.statLabel}
                </span>
              </div>
            </div>

            {/* Right Card: The Solution (With Structa) */}
            <div className="rounded-2xl border border-primary/40 bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary font-mono text-[11px] font-semibold mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeTab.solution.badge}</span>
                </div>

                <h3 className="text-xl font-heading font-semibold text-foreground leading-snug">
                  {activeTab.solution.headline}
                </h3>

                <ul className="mt-6 space-y-3.5">
                  {activeTab.solution.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metric Box */}
              <div className="mt-8 pt-6 border-t border-border flex items-baseline gap-3">
                <span className="font-heading text-3xl font-bold text-primary">
                  {activeTab.solution.stat}
                </span>
                <span className="text-xs font-mono text-muted-foreground leading-tight">
                  {activeTab.solution.statLabel}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

