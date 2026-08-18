/**
 * components/landing/HowItWorks.tsx — Three-step "how Structa works" section.
 *
 * Server Component — static, no heavy animation budget.
 * Each step has a real-product mini visualization (not a generic icon card).
 */

import React from "react";
import { GitBranch, Cpu, Compass } from "lucide-react";

// ---------------------------------------------------------------------------
// Step data
// ---------------------------------------------------------------------------

const STEPS = [
  {
    number: "01",
    icon: GitBranch,
    title: "Connect",
    description:
      "Connect your own repo via GitHub OAuth (Workspace Mode) or paste any public GitHub URL — no account required (Explorer Mode).",
    visual: (
      // Mini URL input visual
      <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-[10px] border border-accent/30 bg-surface font-mono text-xs">
        <span className="text-muted-foreground">github.com/</span>
        <span className="text-accent font-semibold">vercel/next.js</span>
        <span className="ml-auto px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold">
          Explore →
        </span>
      </div>
    ),
  },
  {
    number: "02",
    icon: Cpu,
    title: "Understand",
    description:
      "Structa fetches the repo tree, parses import dependencies (heuristic-based for JS/TS), builds a force-directed 3D layout, and generates AI module summaries.",
    visual: (
      // Mini pipeline stepper
      <div className="mt-4 space-y-1.5">
        {[
          { label: "Repository Validation", done: true },
          { label: "Fetching Source Tree", done: true },
          { label: "Parsing Dependencies", active: true },
          { label: "Building 3D Layout", pending: true },
          { label: "Generating AI Summaries", pending: true },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                step.done
                  ? "bg-primary"
                  : step.active
                    ? "bg-accent animate-pulse"
                    : "bg-border"
              }`}
            />
            <span
              className={`font-mono text-[10px] ${
                step.done
                  ? "text-muted-foreground line-through"
                  : step.active
                    ? "text-accent"
                    : "text-muted-foreground/50"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "03",
    icon: Compass,
    title: "Explore",
    description:
      "Fly through the 3D map. Click any module to read its AI summary. Ask the codebase a question and get a cited, evidence-backed answer — grounded in the specific repo.",
    visual: (
      // Mini chat snippet
      <div className="mt-4 space-y-2">
        <div className="flex gap-2 items-start">
          <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-[8px] text-primary font-mono font-bold">U</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl rounded-tl-sm bg-primary/10 border border-primary/20 text-[10px] font-mono text-foreground">
            Where is auth handled?
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
            <span className="text-[8px] text-accent font-mono font-bold">AI</span>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="px-2.5 py-1.5 rounded-xl rounded-tl-sm bg-surface-elevated border border-border text-[10px] font-mono text-muted-foreground">
              Auth flows through middleware.ts → auth.service.ts…
            </div>
            <div className="flex gap-1">
              {["middleware.ts", "auth.service.ts"].map((f) => (
                <span
                  key={f}
                  className="px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono text-[9px]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 px-4 sm:px-6"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            Three steps
          </p>
          <h2
            id="how-it-works-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            How Structa Works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group relative flex flex-col p-6 rounded-[16px] border border-border bg-surface hover:border-primary/30 transition-all duration-200"
            >
              {/* Step number */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-4xl font-bold text-border select-none">
                  {step.number}
                </span>
                <div className="w-10 h-10 rounded-[10px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
                  <step.icon className="w-5 h-5" />
                </div>
              </div>

              {/* Content */}
              <h3 className="font-heading font-semibold text-lg text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed font-sans">
                {step.description}
              </p>

              {/* Product visualization */}
              {step.visual}

              {/* Connection line for desktop (decorative) */}
              {step.number !== "03" && (
                <div
                  className="hidden md:block absolute top-1/2 -right-[16px] w-8 h-px bg-border z-10"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
