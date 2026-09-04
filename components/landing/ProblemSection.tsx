"use client";

/**
 * components/landing/ProblemSection.tsx — Before/After scroll-driven comparison.
 *
 * Framer Motion scroll-linked opacity + position transitions.
 * No GSAP per Rules.md §5.
 * design.md: motion-slow 350ms cubic-bezier(0.22,1,0.36,1) for entrances.
 */

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Folder, GitBranch, AlertTriangle, Network, Zap, Brain } from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BEFORE_ITEMS = [
  { icon: FileText, label: "README.md", sub: "Last updated 8 months ago", dim: true },
  { icon: Folder, label: "src/", sub: "134 files, unknown structure", dim: true },
  { icon: FileText, label: "index.ts", sub: "1,200 lines — where to start?", dim: true },
  { icon: GitBranch, label: "imports everywhere", sub: "Circular? Who knows", dim: true },
  {
    icon: AlertTriangle,
    label: "No architecture docs",
    sub: "Ask senior devs... if they're free",
    dim: true,
  },
];

const AFTER_ITEMS = [
  { icon: Network, label: "3D Dependency Map", sub: "Every file, every connection — spatially" },
  { icon: Zap, label: "AI Module Summaries", sub: "One paragraph per file, AI-generated" },
  { icon: Brain, label: "Ask the Codebase", sub: '"Where is auth handled?" → cited answer' },
  { icon: GitBranch, label: "Complexity Heatmap", sub: "See which modules are risky at a glance" },
  { icon: FileText, label: "Architecture Export", sub: "AI-generated README, ready to share" },
];

// ---------------------------------------------------------------------------
// Animated list item
// ---------------------------------------------------------------------------

function ListItem({
  icon: Icon,
  label,
  sub,
  dim,
  index,
  inView,
  isAfter,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  dim?: boolean;
  index: number;
  inView: boolean;
  isAfter?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isAfter ? 20 : -20 }}
      animate={inView ? { opacity: dim ? 0.4 : 1, x: 0 } : { opacity: 0, x: isAfter ? 20 : -20 }}
      transition={{
        duration: 0.35,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border transition-colors ${
        dim
          ? "border-border/50 bg-surface/30 filter grayscale"
          : "border-border bg-surface hover:border-primary/30"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
          dim ? "bg-secondary/50 text-muted-foreground/50" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium font-sans ${dim ? "text-muted-foreground/50" : "text-foreground"}`}
        >
          {label}
        </p>
        <p
          className={`text-xs font-mono mt-0.5 ${dim ? "text-muted-foreground/30" : "text-muted-foreground"}`}
        >
          {sub}
        </p>
      </div>
      {!dim && (
        <div
          className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0"
          style={{ boxShadow: "0 0 8px rgba(61,220,151,0.6)" }}
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-24 px-4 sm:px-6"
      aria-label="Before and after comparison"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            The onboarding problem
          </p>
          <h2
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            From Confusion to{" "}
            <span className="text-primary" style={{ textShadow: "0 0 30px rgba(61,220,151,0.3)" }}>
              Clarity
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            New engineers spend weeks mapping an unfamiliar codebase before contributing. Structa
            compresses that into minutes.
          </p>
        </motion.div>

        {/* Two-column comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          {/* Before */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-4 flex items-center gap-2"
            >
              <span className="px-2 py-0.5 rounded-md bg-danger/12 border border-danger/25 text-danger font-mono text-xs font-semibold">
                BEFORE
              </span>
              <span className="text-sm text-muted-foreground font-sans">Flying blind</span>
            </motion.div>
            <div className="space-y-2.5">
              {BEFORE_ITEMS.map((item, i) => (
                <ListItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  dim={item.dim}
                  index={i}
                  inView={inView}
                  isAfter={false}
                />
              ))}
            </div>
          </div>

          {/* After */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-4 flex items-center gap-2"
            >
              <span className="px-2 py-0.5 rounded-md bg-primary/12 border border-primary/25 text-primary font-mono text-xs font-semibold">
                WITH STRUCTA
              </span>
              <span className="text-sm text-muted-foreground font-sans">X-ray vision</span>
            </motion.div>
            <div className="space-y-2.5">
              {AFTER_ITEMS.map((item, i) => (
                <ListItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  sub={item.sub}
                  index={i}
                  inView={inView}
                  isAfter
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-14 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          {[
            { value: "< 60s", label: "To first graph" },
            { value: "Any", label: "Public GitHub repo" },
            { value: "0", label: "Lines of setup" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-[10px] border border-border bg-surface"
            >
              <p
                className="font-mono font-bold text-primary"
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  textShadow: "0 0 24px rgba(61,220,151,0.3)",
                }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-mono text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
