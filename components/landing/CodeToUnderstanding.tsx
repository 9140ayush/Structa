"use client";

/**
 * components/landing/CodeToUnderstanding.tsx — Signature exploded visual.
 *
 * Scroll-driven layered separation: Repository → Files → Modules →
 * Dependency Graph → Architecture Map → AI Layer → Understanding.
 * Built with Framer Motion useScroll + useTransform (no GSAP, no R3F here).
 * Dynamically imported (ssr:false) in page.tsx due to scroll hooks.
 * prefers-reduced-motion: collapses to a simple static stacked view.
 */

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GitBranch, FileCode, Network, Map, Sparkles, Brain } from "lucide-react";

// ---------------------------------------------------------------------------
// Layer definitions
// ---------------------------------------------------------------------------

const LAYERS = [
  {
    id: "repo",
    icon: GitBranch,
    label: "Repository",
    sub: "github.com/9140/Structa",
    color: "#EDEFF3",
    bgOpacity: 0.06,
  },
  {
    id: "files",
    icon: FileCode,
    label: "Files & Folders",
    sub: "134 source files, 18 directories",
    color: "#7C9CFF",
    bgOpacity: 0.08,
  },
  {
    id: "modules",
    icon: FileCode,
    label: "Parsed Modules",
    sub: "Import graph extracted, LOC counted, complexity scored",
    color: "#F2B84B",
    bgOpacity: 0.07,
  },
  {
    id: "graph",
    icon: Network,
    label: "Dependency Graph",
    sub: "Force-directed 3D layout computed",
    color: "#3DDC97",
    bgOpacity: 0.09,
  },
  {
    id: "map",
    icon: Map,
    label: "Architecture Map",
    sub: "Navigable 3D space — fly through, click, explore",
    color: "#3DDC97",
    bgOpacity: 0.06,
  },
  {
    id: "ai",
    icon: Sparkles,
    label: "AI Intelligence",
    sub: "Per-module summaries, grounded Q&A",
    color: "#7C9CFF",
    bgOpacity: 0.08,
  },
  {
    id: "understanding",
    icon: Brain,
    label: "Structured Understanding",
    sub: "Your codebase — finally legible",
    color: "#3DDC97",
    bgOpacity: 0.12,
  },
];

// ---------------------------------------------------------------------------
// Static fallback (reduced-motion)
// ---------------------------------------------------------------------------

function StaticLayers() {
  return (
    <div
      className="flex flex-col items-center gap-2 py-12 px-4"
      aria-label="Structa transformation layers"
    >
      {LAYERS.map((layer, i) => (
        <div
          key={layer.id}
          className="w-full max-w-sm flex items-center gap-3 px-5 py-3.5 rounded-[12px] border"
          style={{
            borderColor: `${layer.color}25`,
            background: `${layer.color}0D`,
          }}
        >
          <layer.icon
            className="w-4 h-4 shrink-0"
            style={{ color: layer.color }}
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-xs font-semibold" style={{ color: layer.color }}>
              {layer.label}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">{layer.sub}</p>
          </div>
          {i < LAYERS.length - 1 && (
            <div className="absolute left-1/2 -bottom-3 w-px h-3 bg-border" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated scroll-driven version
// ---------------------------------------------------------------------------

function AnimatedLayer({
  layer,
  index,
  progress,
  total,
}: {
  layer: (typeof LAYERS)[0];
  index: number;
  progress: number;
  total: number;
}) {
  // Each layer separates proportionally as scroll progress increases
  const separation = 52; // px per layer
  const yOffset = index * separation * Math.min(progress * 2, 1);
  const opacity = 0.2 + (1 - 0.2) * Math.min(progress * 2 + 0.3, 1);

  return (
    <motion.div
      className="absolute w-full max-w-lg"
      style={{
        top: `${index * 52}px`,
        zIndex: total - index,
        y: yOffset,
        opacity,
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-[12px] border backdrop-blur-sm"
        style={{
          borderColor: `${layer.color}22`,
          background: `rgba(25,29,38,0.85)`,
          boxShadow: progress > 0.3 ? `0 0 20px ${layer.color}18` : "none",
        }}
      >
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{
            background: `${layer.color}18`,
            border: `1px solid ${layer.color}30`,
            color: layer.color,
          }}
        >
          <layer.icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold" style={{ color: layer.color }}>
            {layer.label}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground truncate">{layer.sub}</p>
        </div>

        {/* Connecting arrow to next layer */}
        {index < total - 1 && progress > 0.2 && (
          <div className="ml-auto shrink-0">
            <span className="font-mono text-[10px]" style={{ color: layer.color }}>
              ↓
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function CodeToUnderstanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => setScrollProgress(v));
    return unsub;
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-4 sm:px-6"
      aria-labelledby="transform-heading"
    >
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            The transformation
          </p>
          <h2
            id="transform-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Code <span className="text-muted-foreground">→</span>{" "}
            <span className="text-primary" style={{ textShadow: "0 0 30px rgba(61,220,151,0.3)" }}>
              Understanding
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Structa takes a flat, opaque repository and restructures it into a navigable, queryable
            architecture map — layer by layer.
          </p>
        </div>

        {reducedMotion ? (
          <StaticLayers />
        ) : (
          <div className="flex justify-center">
            <div
              className="relative w-full max-w-lg"
              style={{ height: `${LAYERS.length * 52 + 200}px` }}
              aria-label="Structa transformation: from repository to structured understanding"
            >
              {LAYERS.map((layer, i) => (
                <AnimatedLayer
                  key={layer.id}
                  layer={layer}
                  index={i}
                  progress={scrollProgress}
                  total={LAYERS.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
