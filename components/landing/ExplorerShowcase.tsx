"use client";

/**
 * components/landing/ExplorerShowcase.tsx — Realistic product UI showcase.
 *
 * Reuses HealthScoreRing directly.
 * Layout: repo tree (left) · graph placeholder (center) · AI chat panel (right).
 * Animated sequence on scroll-into-view: nodes appearing, module selected,
 * AI explanation streaming with citation chips.
 * Uses mock data — no API calls.
 */

import React, { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { HealthScoreRing } from "@/components/shared/HealthScoreRing";
import {
  FileCode,
  Folder,
  ChevronRight,
  Bot,
  Globe,
  GitBranch,
  Star,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock tree data
// ---------------------------------------------------------------------------

const MOCK_TREE = [
  { id: "t1", name: "app/", type: "folder", depth: 0, expanded: true },
  { id: "t2", name: "(auth)/", type: "folder", depth: 1 },
  { id: "t3", name: "(dashboard)/", type: "folder", depth: 1 },
  { id: "t4", name: "api/", type: "folder", depth: 1 },
  { id: "t5", name: "middleware.ts", type: "file", depth: 1, active: true },
  { id: "t6", name: "components/", type: "folder", depth: 0 },
  { id: "t7", name: "auth.service.ts", type: "file", depth: 1, highlighted: true },
  { id: "t8", name: "lib/", type: "folder", depth: 0 },
  { id: "t9", name: "hooks/", type: "folder", depth: 0 },
];

// Mock node grid for the graph visualization
const MOCK_GRAPH_NODES = [
  { id: "g1", x: 50, y: 40, r: 18, complexity: 0.8, selected: false, name: "auth.service" },
  { id: "g2", x: 150, y: 60, r: 14, complexity: 0.5, selected: true, name: "middleware" },
  { id: "g3", x: 240, y: 45, r: 20, complexity: 0.3, selected: false, name: "api/chat" },
  { id: "g4", x: 90, y: 140, r: 12, complexity: 0.6, selected: false, name: "session.ts" },
  { id: "g5", x: 190, y: 150, r: 16, complexity: 0.9, selected: false, name: "parser.ts" },
  { id: "g6", x: 270, y: 130, r: 11, complexity: 0.2, selected: false, name: "lib/db" },
  { id: "g7", x: 60, y: 200, r: 13, complexity: 0.4, selected: false, name: "hooks/chat" },
  { id: "g8", x: 160, y: 210, r: 15, complexity: 0.7, selected: false, name: "Node.tsx" },
];

const MOCK_EDGES_SVG = [
  { from: "g1", to: "g2" }, { from: "g2", to: "g3" }, { from: "g1", to: "g4" },
  { from: "g3", to: "g5" }, { from: "g5", to: "g6" }, { from: "g4", to: "g7" },
  { from: "g5", to: "g8" }, { from: "g2", to: "g5" },
];

function complexityColor(t: number): string {
  if (t < 0.5) {
    // green → amber interpolation
    const r = Math.round(61 + (242 - 61) * (t * 2));
    const g = Math.round(220 + (184 - 220) * (t * 2));
    const b = Math.round(151 + (75 - 151) * (t * 2));
    return `rgb(${r},${g},${b})`;
  }
  // amber → red
  const r2 = Math.round(242 + (240 - 242) * ((t - 0.5) * 2));
  const g2 = Math.round(184 + (87 - 184) * ((t - 0.5) * 2));
  const b2 = Math.round(75 + (107 - 75) * ((t - 0.5) * 2));
  return `rgb(${r2},${g2},${b2})`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExplorerShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <section
      ref={ref}
      className="relative py-24 px-4 sm:px-6"
      aria-labelledby="showcase-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
            The product
          </p>
          <h2
            id="showcase-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Your Codebase, in 3D
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Explore structure, click modules, ask questions — all in one interface grounded in real
            parsed data.
          </p>
        </motion.div>

        {/* Product UI mock */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[16px] border border-border overflow-hidden shadow-[0_0_80px_rgba(61,220,151,0.08)] bg-surface"
          style={{ minHeight: 480 }}
        >
          {/* Repo header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-background font-mono font-bold text-xs"
                style={{ boxShadow: "0 0 12px rgba(61,220,151,0.4)" }}
              >
                S
              </div>
              <div>
                <p className="font-mono text-xs font-semibold text-foreground">vercel / next.js</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 font-mono text-[9px] text-muted-foreground">
                    <Globe className="w-2.5 h-2.5" /> Public
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[9px] text-muted-foreground">
                    <GitBranch className="w-2.5 h-2.5" /> main
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[9px] text-warning">
                    <Star className="w-2.5 h-2.5" /> 128k
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HealthScoreRing score={87} size={44} strokeWidth={4} />
              <span className="font-mono text-[9px] text-muted-foreground hidden sm:block">Health: 87/100</span>
            </div>
          </div>

          {/* Three-panel layout */}
          <div className="flex h-[400px]">
            {/* Left: File tree */}
            <div className="w-44 sm:w-52 border-r border-border bg-surface-elevated/40 overflow-hidden shrink-0">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Repository</p>
              </div>
              <div className="py-1">
                {MOCK_TREE.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${
                      item.active
                        ? "bg-primary/10 border-l-2 border-primary"
                        : item.highlighted
                          ? "bg-accent/8 border-l-2 border-accent"
                          : "hover:bg-secondary/40 border-l-2 border-transparent"
                    }`}
                    style={{ paddingLeft: `${12 + item.depth * 10}px` }}
                  >
                    {item.type === "folder" ? (
                      <>
                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Folder className="w-3 h-3 text-accent shrink-0" />
                      </>
                    ) : (
                      <FileCode className={`w-3 h-3 shrink-0 ${item.active ? "text-primary" : item.highlighted ? "text-accent" : "text-muted-foreground"}`} />
                    )}
                    <span className={`font-mono text-[10px] truncate ${item.active ? "text-primary font-semibold" : item.highlighted ? "text-accent" : "text-muted-foreground"}`}>
                      {item.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Center: Graph */}
            <div className="flex-1 relative bg-[#0A0C10] overflow-hidden">
              <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/60 z-10">
                3D Dependency Map
              </div>

              {/* SVG graph */}
              <svg className="w-full h-full" viewBox="0 0 320 260" aria-hidden="true">
                {/* Edges */}
                {MOCK_EDGES_SVG.map((edge, i) => {
                  const from = MOCK_GRAPH_NODES.find((n) => n.id === edge.from);
                  const to = MOCK_GRAPH_NODES.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  const isActive = selectedNode === from.id || selectedNode === to.id;
                  return (
                    <motion.line
                      key={i}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isActive ? "#3DDC97" : "#7C9CFF"}
                      strokeWidth={isActive ? 1.5 : 0.6}
                      strokeOpacity={isActive ? 0.9 : 0.3}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.06 }}
                    />
                  );
                })}
                {/* Nodes */}
                {MOCK_GRAPH_NODES.map((node, i) => {
                  const isSelected = selectedNode === node.id || node.selected;
                  const col = complexityColor(node.complexity);
                  return (
                    <motion.g
                      key={node.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={inView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformOrigin: `${node.x}px ${node.y}px`, cursor: "pointer" }}
                      onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                    >
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r={node.r * 1.6} fill="none" stroke="#3DDC97" strokeWidth={1} strokeOpacity={0.6} />
                      )}
                      <circle cx={node.x} cy={node.y} r={node.r} fill={col} fillOpacity={0.85} />
                      {isSelected && (
                        <circle cx={node.x} cy={node.y} r={node.r} fill={col} fillOpacity={0.3}>
                          <animate attributeName="r" values={`${node.r};${node.r * 1.4};${node.r}`} dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </motion.g>
                  );
                })}
              </svg>

              {/* Selected node tooltip */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-elevated border border-primary/30 font-mono text-[10px] text-primary shadow-lg"
                    style={{ boxShadow: "0 0 20px rgba(61,220,151,0.2)" }}
                  >
                    <FileCode className="w-3 h-3" />
                    {MOCK_GRAPH_NODES.find((n) => n.id === selectedNode)?.name}.ts
                    <span className="text-muted-foreground">— click to open</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: AI chat panel preview */}
            <div className="w-52 sm:w-64 border-l border-border bg-surface overflow-hidden shrink-0 hidden lg:flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-elevated shrink-0">
                <div className="p-1 rounded-md bg-accent/10 text-accent">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="font-heading font-semibold text-xs text-foreground">Ask the Codebase</span>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-hidden">
                {/* Example exchange */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="text-right"
                >
                  <span className="inline-block px-2.5 py-1.5 rounded-xl rounded-tr-sm bg-primary/10 border border-primary/20 font-mono text-[9px] text-foreground">
                    Which modules are most complex?
                  </span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 1.0 }}
                >
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                      <Bot className="w-2.5 h-2.5 text-accent" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="px-2.5 py-1.5 rounded-xl rounded-tl-sm bg-surface-elevated border border-border font-mono text-[9px] text-muted-foreground leading-relaxed">
                        The highest-complexity modules are the parser and graph layout engine...
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {["parser.ts", "Node.tsx"].map((f) => (
                          <span key={f} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-mono text-[8px]">
                            <FileCode className="w-2 h-2 shrink-0" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.3 }}
                  className="flex items-center gap-1.5 text-muted-foreground"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-accent" />
                  <span className="font-mono text-[9px]">Analyzing codebase…</span>
                </motion.div>
              </div>
              <div className="px-3 py-2.5 border-t border-border shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-card border border-border">
                  <span className="font-mono text-[9px] text-muted-foreground/60 flex-1">Ask anything…</span>
                  <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-[8px] text-background font-bold">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
