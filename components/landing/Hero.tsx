"use client";

/**
 * components/landing/Hero.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Centered hero inspired by incident.io compositional rhythm:
 * - Large centered headline + subcopy
 * - 2 pill CTAs (primary solid + secondary outline)
 * - Large rounded product-mockup frame with soft elevation
 * - Static/SVG interactive high-fidelity 3D map + inspector mockup (no live WebGL canvas overhead on SSG landing)
 * - 100% compliant with Structa's design tokens (design.md / Rules.md)
 */

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  GitBranch,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  Box,
  FileCode2,
  CheckCircle2,
  Share2,
} from "lucide-react";

export function Hero() {
  const [activeNode, setActiveNode] = useState<string>("ReactFiberWorkLoop.ts");

  return (
    <section
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background ambient radial gradients */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 right-1/4 w-[400px] h-[300px] rounded-full bg-accent/8 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-xs font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Structa v1.3 • Dual-Theme Architecture Intelligence</span>
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto"
        >
          Understand Any Codebase.{" "}
          <span className="text-primary inline-block">Before You Touch the Code.</span>
        </h1>

        {/* Subcopy */}
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Structa transforms any GitHub repository into an interactive 3D dependency topology with
          grounded AI insights, blast radius analysis, and module comprehension.
        </p>

        {/* Pill CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            id="hero-cta-connect"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-sans font-semibold text-sm hover:opacity-95 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span>Connect a Repository</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/explorer"
            id="hero-cta-explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full border border-border bg-surface/90 hover:bg-surface text-foreground font-sans font-semibold text-sm transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Compass className="w-4 h-4 text-muted-foreground" />
            <span>Explore a Public Repo</span>
          </Link>
        </div>

        {/* Trust micro-copy */}
        <p className="mt-4 font-mono text-xs text-muted-foreground/80">
          Instant AST extraction • No credit card required • Public repos always free
        </p>

        {/* Product Mockup Frame */}
        <div className="mt-14 max-w-5xl mx-auto text-left rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
          {/* Mockup Window Titlebar */}
          <div className="px-4 py-3 border-b border-border bg-surface-elevated flex items-center justify-between gap-4">
            {/* macOS traffic light dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
            </div>

            {/* Simulated URL / Repository breadcrumb */}
            <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-background/60 font-mono text-xs text-muted-foreground">
              <GitBranch className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">structa.dev/explorer/facebook/react</span>
              <span className="ml-auto text-[10px] uppercase font-semibold text-primary">v19.0.0</span>
            </div>

            {/* Quick status badge */}
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline">AST Indexed</span>
            </div>
          </div>

          {/* Sub-navigation bar inside mockup */}
          <div className="px-4 py-2 border-b border-border/60 bg-surface/80 flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono">
            <div className="flex items-center gap-1">
              <span className="px-3 py-1 rounded-md bg-primary/10 text-primary font-medium flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" /> 3D Graph
              </span>
              <span className="px-3 py-1 rounded-md text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer">
                <Layers className="w-3.5 h-3.5" /> 2D Architecture
              </span>
              <span className="px-3 py-1 rounded-md text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" /> Copilot
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="hidden sm:inline">Health: 94/100</span>
              <span className="hidden sm:inline">•</span>
              <span>18 Modules</span>
            </div>
          </div>

          {/* Mockup Canvas Interior — scoped to dark void container to maintain high-contrast 3D canvas aesthetic */}
          <div className="relative h-[440px] sm:h-[500px] w-full bg-[#0A0C10] overflow-hidden select-none">
            {/* Dark void grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#EDEFF3 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Connecting SVG Dependency Arcs */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3DDC97" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#58A6FF" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#58A6FF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Connecting lines between nodes */}
              <path
                d="M 230 240 Q 320 180 430 160"
                stroke="url(#primaryGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              <path
                d="M 230 240 Q 300 280 380 340"
                stroke="url(#primaryGrad)"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M 430 160 Q 510 180 560 250"
                stroke="url(#accentGrad)"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M 380 340 Q 480 330 560 250"
                stroke="url(#accentGrad)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                fill="none"
              />
              <path
                d="M 140 150 Q 180 190 230 240"
                stroke="#3DDC97"
                strokeOpacity="0.4"
                strokeWidth="1"
                fill="none"
              />
            </svg>

            {/* Interactive Graph Nodes */}
            {/* Center Core Node: ReactFiberWorkLoop */}
            <div
              onClick={() => setActiveNode("ReactFiberWorkLoop.ts")}
              className="absolute top-[215px] left-[170px] sm:left-[200px] z-20 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-2 rounded-full bg-[#3DDC97]/20 blur-md group-hover:bg-[#3DDC97]/40 transition-all" />
                <div className="w-12 h-12 rounded-full border-2 border-[#3DDC97] bg-[#12151C] flex items-center justify-center text-[#3DDC97] shadow-[0_0_20px_rgba(61,220,151,0.5)]">
                  <Box className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#181C26]/90 border border-[#1E2330] font-mono text-[11px] text-[#EDEFF3]">
                ReactFiberWorkLoop.ts
              </span>
            </div>

            {/* Node 2: ReactFiberHooks.ts */}
            <div
              onClick={() => setActiveNode("ReactFiberHooks.ts")}
              className="absolute top-[135px] left-[380px] sm:left-[410px] z-20 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-2 rounded-full bg-[#58A6FF]/20 blur-md group-hover:bg-[#58A6FF]/40 transition-all" />
                <div className="w-10 h-10 rounded-full border-2 border-[#58A6FF] bg-[#12151C] flex items-center justify-center text-[#58A6FF] shadow-[0_0_15px_rgba(88,166,255,0.4)]">
                  <FileCode2 className="w-4 h-4" />
                </div>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#181C26]/90 border border-[#1E2330] font-mono text-[11px] text-[#EDEFF3]">
                ReactFiberHooks.ts
              </span>
            </div>

            {/* Node 3: ReactDOMRoot.ts */}
            <div
              onClick={() => setActiveNode("ReactDOMRoot.ts")}
              className="absolute top-[315px] left-[340px] sm:left-[360px] z-20 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border-2 border-[#F59E0B] bg-[#12151C] flex items-center justify-center text-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#181C26]/90 border border-[#1E2330] font-mono text-[11px] text-[#EDEFF3]">
                ReactDOMRoot.ts
              </span>
            </div>

            {/* Node 4: Scheduler.ts */}
            <div
              onClick={() => setActiveNode("Scheduler.ts")}
              className="absolute top-[225px] left-[520px] sm:left-[540px] z-20 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border-2 border-[#A78BFA] bg-[#12151C] flex items-center justify-center text-[#A78BFA] shadow-[0_0_12px_rgba(167,139,250,0.4)]">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#181C26]/90 border border-[#1E2330] font-mono text-[11px] text-[#EDEFF3]">
                Scheduler.ts
              </span>
            </div>

            {/* Node 5: ReactSharedInternals */}
            <div
              onClick={() => setActiveNode("ReactSharedInternals.ts")}
              className="absolute top-[125px] left-[100px] sm:left-[120px] z-20 cursor-pointer group hidden sm:block"
            >
              <div className="w-8 h-8 rounded-full border border-[#38BDF8] bg-[#12151C] flex items-center justify-center text-[#38BDF8]">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#181C26]/90 border border-[#1E2330] font-mono text-[11px] text-[#EDEFF3]">
                SharedInternals.ts
              </span>
            </div>

            {/* Floating Module Inspector Card (Right side overlay) */}
            <div className="absolute top-4 right-4 z-30 w-72 sm:w-80 rounded-xl border border-[#1E2330] bg-[#12151C]/95 backdrop-blur-md p-4 text-[#EDEFF3] shadow-2xl">
              <div className="flex items-start justify-between gap-2 border-b border-[#1E2330] pb-2.5">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-[#3DDC97]/15 text-[#3DDC97] font-mono text-[10px] font-semibold uppercase">
                    Core Reconciler
                  </span>
                  <h4 className="font-mono text-xs font-semibold text-[#EDEFF3] mt-1 truncate">
                    {activeNode}
                  </h4>
                  <p className="font-mono text-[10px] text-[#7D8590]">packages/react-reconciler</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#3DDC97]">94/100</span>
                  <span className="block font-mono text-[9px] text-[#7D8590]">Health Score</span>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="px-2 py-1.5 rounded bg-[#181C26] border border-[#1E2330]">
                  <span className="block font-mono text-xs font-bold text-[#EDEFF3]">14</span>
                  <span className="block font-mono text-[9px] text-[#7D8590]">In-Degree</span>
                </div>
                <div className="px-2 py-1.5 rounded bg-[#181C26] border border-[#1E2330]">
                  <span className="block font-mono text-xs font-bold text-[#EDEFF3]">28</span>
                  <span className="block font-mono text-[9px] text-[#7D8590]">Out-Degree</span>
                </div>
                <div className="px-2 py-1.5 rounded bg-[#181C26] border border-[#1E2330]">
                  <span className="block font-mono text-xs font-bold text-[#EDEFF3]">0</span>
                  <span className="block font-mono text-[9px] text-[#3DDC97]">Cycles</span>
                </div>
              </div>

              {/* Grounded AI Synopsis */}
              <div className="rounded-lg bg-[#181C26]/70 border border-[#1E2330] p-2.5 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 text-[#3DDC97] font-mono text-[10px] font-semibold mb-1">
                  <Sparkles className="w-3 h-3" /> Grounded AST Summary
                </div>
                <p className="text-[#EDEFF3]/90 font-sans text-xs">
                  Coordinates fiber traversal, work scheduling, and priority lanes. Dispatches render
                  phases to host renderers.
                </p>
                <div className="mt-2 pt-2 border-t border-[#1E2330] flex items-center justify-between font-mono text-[10px] text-[#7D8590]">
                  <span>AST: 1,842 LOC</span>
                  <span className="text-[#3DDC97]">Verified Grounded</span>
                </div>
              </div>
            </div>

            {/* Bottom floating HUD / View pill indicators */}
            <div className="absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E2330] bg-[#12151C]/90 backdrop-blur-md font-mono text-xs text-[#7D8590]">
              <span className="w-2 h-2 rounded-full bg-[#3DDC97]" />
              <span className="text-[#EDEFF3]">3D Topology Live</span>
              <span>•</span>
              <span>13 Shipped Views Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
