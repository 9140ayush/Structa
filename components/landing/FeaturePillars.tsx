/**
 * components/landing/FeaturePillars.tsx — Four feature pillars.
 *
 * Client Component — uses onMouseEnter/onMouseLeave for hover glow effect.
 * Analyze pillar includes annotations, snapshots, cycle detection, heatmap toggle
 * — all confirmed shipped per codebase inspection (Phase 8 verification §0).
 * Contributor-activity timeline is NOT included (not found in codebase).
 */

"use client";

import React from "react";
import { Brain, Compass, Search, Activity } from "lucide-react";

// ---------------------------------------------------------------------------
// Pillar data
// ---------------------------------------------------------------------------

const PILLARS = [
  {
    id: "understand",
    icon: Brain,
    label: "Understand",
    color: "primary" as const,
    headline: "AI-Generated Module Insights",
    description:
      "Every file and folder gets a one-paragraph AI summary explaining what it does, what it imports, and why it exists — generated automatically on sync.",
    bullets: [
      "AI summaries for every file and folder",
      "Ask the codebase in natural language",
      "Answers grounded in parsed module data",
      "AI-generated architecture doc export",
    ],
  },
  {
    id: "explore",
    icon: Compass,
    label: "Explore",
    color: "accent" as const,
    headline: "Interactive 3D Architecture Map",
    description:
      "Navigate your codebase spatially. Fly through a force-directed 3D graph where node size represents lines of code and color reflects complexity.",
    bullets: [
      "Force-directed 3D dependency graph",
      "Node size = lines of code",
      "Camera fly-to on node selection",
      "Level-of-detail above 500 nodes",
    ],
  },
  {
    id: "discover",
    icon: Search,
    label: "Discover",
    color: "warning" as const,
    headline: "Explore Any Public Repository",
    description:
      "No account required. Paste any GitHub URL or owner/repo shorthand — Structa fetches, parses, and maps it. Popular repos are cached for instant access.",
    bullets: [
      "Explorer Mode — no login required",
      "URL, owner/repo, or shorthand input",
      "Shared indexing cache for popular repos",
      "Semantic code search across modules",
    ],
  },
  {
    id: "analyze",
    icon: Activity,
    label: "Analyze",
    color: "danger" as const,
    headline: "Health Scoring and Dependency Analysis",
    description:
      "See repository health at a glance. Identify circular dependencies, high-complexity hotspots, and architectural risk — all in one view.",
    bullets: [
      "Repository health score (0–100)",
      "Complexity heatmap toggle",
      "Circular dependency detection",
      "Versioned snapshots with visual diffs",
    ],
  },
];

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const COLOR_MAP = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    glow: "0 0 20px rgba(61,220,151,0.2)",
    dot: "bg-primary",
    hoverBorder: "hover:border-primary/40",
  },
  accent: {
    bg: "bg-accent/10",
    border: "border-accent/20",
    text: "text-accent",
    glow: "0 0 20px rgba(124,156,255,0.2)",
    dot: "bg-accent",
    hoverBorder: "hover:border-accent/40",
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    text: "text-warning",
    glow: "0 0 20px rgba(242,184,75,0.2)",
    dot: "bg-warning",
    hoverBorder: "hover:border-warning/40",
  },
  danger: {
    bg: "bg-danger/10",
    border: "border-danger/20",
    text: "text-danger",
    glow: "0 0 20px rgba(240,87,107,0.2)",
    dot: "bg-danger",
    hoverBorder: "hover:border-danger/40",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeaturePillars() {
  return (
    <section
      id="features"
      className="relative py-24 px-4 sm:px-6"
      aria-labelledby="features-heading"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(124,156,255,0.04),transparent)]" />

      <div className="relative max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
            Core capabilities
          </p>
          <h2
            id="features-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            One Platform.{" "}
            <span className="text-accent" style={{ textShadow: "0 0 30px rgba(124,156,255,0.3)" }}>
              Every Angle.
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Structa combines 3D visualization, AI understanding, and real-time analysis into a
            single interface — grounded in your actual codebase.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PILLARS.map((pillar) => {
            const c = COLOR_MAP[pillar.color];
            return (
              <div
                key={pillar.id}
                id={`feature-${pillar.id}`}
                className={`group flex flex-col p-6 rounded-[16px] border ${c.border} bg-surface ${c.hoverBorder} hover:bg-surface-elevated transition-all duration-200`}
                style={{ boxShadow: "none" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = c.glow;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-[10px] ${c.bg} border ${c.border} flex items-center justify-center ${c.text} mb-4`}>
                  <pillar.icon className="w-5 h-5" aria-hidden="true" />
                </div>

                {/* Label pill */}
                <span className={`font-mono text-[10px] uppercase tracking-widest ${c.text} mb-2`}>
                  {pillar.label}
                </span>

                {/* Headline */}
                <h3 className="font-heading font-semibold text-base text-foreground leading-snug mb-3">
                  {pillar.headline}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed font-sans mb-5">
                  {pillar.description}
                </p>

                {/* Bullets */}
                <ul className="mt-auto space-y-2" aria-label={`${pillar.label} features`}>
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
                      <span className="text-xs font-mono text-muted-foreground leading-relaxed">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
