"use client";

/**
 * components/landing/TechnicalPipeline.tsx — Technical data-flow pipeline.
 *
 * SVG + Framer Motion particle animation (no GSAP, no raw Three.js).
 * Honest pipeline per Architecture.md §2:
 * GitHub → Octokit Ingestion → Import-Graph Parser → 3D Layout Engine → AI Summaries (OpenAI) → Explorer + Workspace
 */

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GitBranch, Download, Layers, Network, Sparkles, Monitor } from "lucide-react";

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

const STAGES = [
  {
    id: "github",
    icon: GitBranch,
    label: "GitHub",
    sub: "Source of truth",
    color: "#EDEFF3",
  },
  {
    id: "ingest",
    icon: Download,
    label: "Octokit Ingestion",
    sub: "Repo tree fetch + rate-limit handling",
    color: "#7C9CFF",
  },
  {
    id: "parse",
    icon: Layers,
    label: "Import-Graph Parser",
    sub: "Heuristic JS/TS import resolution",
    color: "#F2B84B",
  },
  {
    id: "layout",
    icon: Network,
    label: "3D Layout Engine",
    sub: "Force-directed spatial coordinates",
    color: "#3DDC97",
  },
  {
    id: "ai",
    icon: Sparkles,
    label: "AI Summaries",
    sub: "OpenAI — per-module, on sync",
    color: "#7C9CFF",
  },
  {
    id: "product",
    icon: Monitor,
    label: "Explorer + Workspace",
    sub: "3D map · AI chat · search",
    color: "#3DDC97",
  },
];

// ---------------------------------------------------------------------------
// Particle dot along connector
// ---------------------------------------------------------------------------

function PipelineConnector({ index, inView }: { index: number; inView: boolean }) {
  return (
    <div className="hidden lg:flex items-center justify-center w-8 shrink-0" aria-hidden="true">
      {/* Static line */}
      <div className="w-full h-px bg-border relative overflow-hidden">
        {/* Animated particle */}
        {inView && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
            style={{ left: "-8px", boxShadow: "0 0 6px rgba(61,220,151,0.6)" }}
            animate={{ left: ["−8px", "calc(100% + 8px)"] }}
            transition={{
              duration: 1.2,
              delay: 0.5 + index * 0.35,
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "linear",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TechnicalPipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6" aria-labelledby="pipeline-heading">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Under the hood
          </p>
          <h2
            id="pipeline-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            How the Pipeline Works
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            From a GitHub URL to a navigable 3D map — here&apos;s what Structa does with your
            repository.
          </p>
        </motion.div>

        {/* Pipeline stages */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-center gap-2 lg:gap-0">
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              {/* Stage card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-2 p-4 rounded-[12px] border border-border bg-surface lg:w-[140px] xl:w-[148px] shrink-0 hover:border-border/80 hover:bg-surface-elevated transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{
                    background: `${stage.color}14`,
                    border: `1px solid ${stage.color}30`,
                    color: stage.color,
                  }}
                >
                  <stage.icon
                    className="w-4.5 h-4.5"
                    style={{ width: 18, height: 18 }}
                    aria-hidden="true"
                  />
                </div>
                <div className="lg:text-center min-w-0">
                  <p className="font-mono text-xs font-semibold text-foreground leading-snug">
                    {stage.label}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground mt-0.5 leading-relaxed lg:text-center">
                    {stage.sub}
                  </p>
                </div>
              </motion.div>

              {/* Connector — except after last */}
              {i < STAGES.length - 1 && <PipelineConnector index={i} inView={inView} />}
            </React.Fragment>
          ))}
        </div>

        {/* Accuracy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-10 text-center font-mono text-xs text-muted-foreground/60 max-w-lg mx-auto leading-relaxed"
        >
          The parser uses import-graph heuristics for JS/TS — not full AST/compiler-level analysis.
          Multi-language support (Python, Go, Rust) is on the roadmap.
        </motion.p>
      </div>
    </section>
  );
}
