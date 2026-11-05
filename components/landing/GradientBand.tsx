"use client";

/**
 * components/landing/GradientBand.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Full-bleed gradient band containing 4 equal glass-style feature cards,
 * inspired by the incident.io compositional rhythm.
 *
 * Cards grounded in PRD.md & phases.md capabilities:
 * 1. Grounded Copilot (citations)
 * 2. Per-Module Summaries
 * 3. Deep Cycle Detection (Tarjan's algorithm)
 * 4. Webhook Sync (continuous AST updates)
 */

import React from "react";
import { Sparkles, FileText, RefreshCw, GitCommit, ArrowUpRight } from "lucide-react";

interface GlassCard {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  metric: string;
  metricLabel: string;
}

const CARDS: GlassCard[] = [
  {
    title: "Grounded AI Copilot",
    subtitle: "STRICT AST CITATIONS",
    description:
      "Ask natural questions like 'Where is state reconciliation handled?' and get exact answers citing specific files, functions, and line ranges.",
    icon: Sparkles,
    metric: "100%",
    metricLabel: "Code-verified citations",
  },
  {
    title: "Per-Module Summaries",
    subtitle: "AI SYNTHESIZED ARCHITECTURE",
    description:
      "Automated architectural synopses generated for every file and folder. New team members understand any component in thirty seconds flat.",
    icon: FileText,
    metric: "< 30s",
    metricLabel: "Per-file comprehension",
  },
  {
    title: "Deep Cycle Detection",
    subtitle: "TARJAN'S ALGORITHM",
    description:
      "Mathematical cycle detection isolates every circular import across your dependency graph before it triggers production bundle bloat or runtime crashes.",
    icon: RefreshCw,
    metric: "0",
    metricLabel: "Undetected circular loops",
  },
  {
    title: "Continuous Webhook Sync",
    subtitle: "ALWAYS PRODUCTION READY",
    description:
      "Native GitHub webhooks trigger incremental AST re-indexing on every merged pull request. Your architecture map stays permanently fresh.",
    icon: GitCommit,
    metric: "Realtime",
    metricLabel: "Automated git synchronization",
  },
];

export function GradientBand() {
  return (
    <section
      className="relative w-full py-20 border-y border-border/80 overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/30 dark:via-teal-950/25 dark:to-blue-950/30"
      aria-label="Core Capabilities"
    >
      {/* Background ambient mesh */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#EDEFF3 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            Engineered For Precision
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight mt-2">
            Built from the Ground Up for Real Production Codebases
          </h2>
        </div>

        {/* 4 Equal Glass Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="backdrop-blur-md bg-surface/80 border border-border/80 hover:border-primary/50 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                      {card.subtitle}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-baseline justify-between">
                  <div>
                    <span className="font-heading text-xl font-bold text-foreground">
                      {card.metric}
                    </span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {card.metricLabel}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

