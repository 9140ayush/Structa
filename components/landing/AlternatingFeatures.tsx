"use client";

/**
 * components/landing/AlternatingFeatures.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * 4 alternating feature sections inspired by incident.io layout:
 * - Text + spec/proof card on one side
 * - Product mockup on the other side
 * - Small icon-tab row beneath each mockup
 * - Grounded strictly in PRD.md & phases.md (zero invented metrics or fake customers)
 */

import React, { useState } from "react";
import {
  Box,
  Layers,
  Sparkles,
  RefreshCw,
  Compass,
  History,
  CheckCircle2,
  FileCode2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
  Maximize2,
  GitPullRequest,
  Search,
} from "lucide-react";

export function AlternatingFeatures() {
  const [feature1Tab, setFeature1Tab] = useState(0);
  const [feature2Tab, setFeature2Tab] = useState(0);
  const [feature3Tab, setFeature3Tab] = useState(0);
  const [feature4Tab, setFeature4Tab] = useState(0);

  return (
    <div className="py-12 space-y-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ------------------------------------------------------------------ */}
      {/* FEATURE 1: Spatial 3D & 2D Architecture Navigation                */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Text & Proof Card */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-semibold mb-4">
            <Box className="w-3.5 h-3.5" />
            <span>Spatial Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-tight">
            Navigate Your Codebase Like a Physical City, Not a Text File
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Folder trees hide coupling. Structa lifts your entire repository into three-dimensional
            space where cluster proximity reflects actual module interdependence.
          </p>

          {/* Proof / Specification Card */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold text-primary uppercase">
                Technical Architecture Spec
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">Force-Directed AST</span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              Extracts raw ECMAScript and TypeScript AST import trees in real-time, executing
              force-directed relaxation algorithms to position high-degree hubs at natural visual
              centers.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> WebGL accelerated
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> 2D tiered fallback
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mockup Frame + Icon Tab Row */}
        <div>
          <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
            {/* Mockup Titlebar */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center justify-between text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span>Spatial Orbit • 3D Canvas</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>

            {/* Mockup Body — scoped dark void container */}
            <div className="h-64 sm:h-72 bg-[#0A0C10] p-6 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1E2330_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Graphical clusters */}
              <div className="relative z-10 flex items-center gap-8 text-center">
                <div className="p-4 rounded-xl border border-[#3DDC97]/40 bg-[#12151C]/90 shadow-[0_0_20px_rgba(61,220,151,0.2)]">
                  <Box className="w-8 h-8 text-[#3DDC97] mx-auto mb-1 animate-pulse" />
                  <span className="font-mono text-xs text-[#EDEFF3] font-semibold block">
                    Core Router
                  </span>
                  <span className="font-mono text-[10px] text-[#7D8590]">12 In-degree</span>
                </div>

                <div className="w-12 h-0.5 bg-gradient-to-r from-[#3DDC97] to-[#58A6FF]" />

                <div className="p-4 rounded-xl border border-[#58A6FF]/40 bg-[#12151C]/90 shadow-[0_0_20px_rgba(88,166,255,0.2)]">
                  <Layers className="w-8 h-8 text-[#58A6FF] mx-auto mb-1" />
                  <span className="font-mono text-xs text-[#EDEFF3] font-semibold block">
                    Data Layer
                  </span>
                  <span className="font-mono text-[10px] text-[#7D8590]">8 In-degree</span>
                </div>
              </div>
            </div>

            {/* Icon Tab Row */}
            <div className="p-2 border-t border-border bg-surface-elevated/50 grid grid-cols-4 gap-1 text-[11px] font-mono">
              {[
                { label: "3D Orbit", icon: Box },
                { label: "2D Tiers", icon: Layers },
                { label: "Clusters", icon: FileCode2 },
                { label: "Focus Ring", icon: Maximize2 },
              ].map((tab, i) => {
                const Icon = tab.icon;
                const active = feature1Tab === i;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setFeature1Tab(i)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURE 2: AI Copilot Grounded in Real AST (Alternating)          */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Mockup Frame + Icon Tab Row (Order 2 on mobile, 1 on desktop) */}
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
            {/* Mockup Titlebar */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center justify-between text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="flex items-center gap-1.5 text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Grounded Copilot Session
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-500">Grounded</span>
            </div>

            {/* Mockup Body: Interactive Chat UI */}
            <div className="h-64 sm:h-72 p-5 bg-surface/50 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-3">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary text-primary-foreground px-3.5 py-2 text-xs font-sans">
                    Where does token refresh get handled during an expired session?
                  </div>
                </div>

                {/* Copilot Response with Line-range Citation */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-secondary/80 border border-border px-3.5 py-2.5 text-xs font-sans space-y-2">
                    <p className="text-foreground leading-relaxed">
                      Token refresh is triggered by the Axios response interceptor in{" "}
                      <span className="font-mono text-primary font-semibold">
                        authInterceptor.ts
                      </span>
                      . It detects <code className="font-mono text-[11px] bg-background px-1 py-0.5 rounded">401 UNAUTHORIZED</code> and triggers the token refresh queue.
                    </p>
                    <div className="pt-2 border-t border-border/60 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] font-semibold">
                        <FileCode2 className="w-3 h-3" />
                        src/lib/authInterceptor.ts:L42-L78
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>AST Verified Match</span>
                <span>Confidence: 99.4%</span>
              </div>
            </div>

            {/* Icon Tab Row */}
            <div className="p-2 border-t border-border bg-surface-elevated/50 grid grid-cols-4 gap-1 text-[11px] font-mono">
              {[
                { label: "Citations", icon: Sparkles },
                { label: "Breadcrumbs", icon: FileCode2 },
                { label: "Signatures", icon: CheckCircle2 },
                { label: "No Hallucination", icon: Shield },
              ].map((tab, i) => {
                const Icon = tab.icon;
                const active = feature2Tab === i;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setFeature2Tab(i)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Text & Proof Card (Order 1 on mobile, 2 on desktop) */}
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AST-Grounded AI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-tight">
            An AI Assistant That Never Guesses or Hallucinates
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Generic LLMs guess how code operates based on common patterns. Structa feeds the verified
            Abstract Syntax Tree into the prompt context so every answer cites concrete line ranges.
          </p>

          {/* Proof / Context Card */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold text-primary uppercase">
                Grounded Citation Engine
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">AST + Embeddings</span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              Queries are mapped against repository symbol tables and import graphs. Unverified
              claims are filtered out before reaching your screen.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Exact line citations
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Clickable file jumps
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURE 3: Health Scores, Cycle Detection & Blast Radius          */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Text & Proof Card */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive font-mono text-xs font-semibold mb-4">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cycle & Blast Radius Analysis</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-tight">
            Expose Hidden Circular Loops Before They Reach Production
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Detect Tarjan cycles in linear time. Calculate the downstream blast radius before
            modifying core shared utility libraries.
          </p>

          {/* Proof / Algorithm Card */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold text-primary uppercase">
                Mathematical Graph Analysis
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">Tarjan O(V+E)</span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              Executes Strongly Connected Components decomposition across all file import edges.
              Identifies circular loops of arbitrary depth with automated remediation suggestions.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Circular loop isolation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Blast radius scoring
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mockup Frame + Icon Tab Row */}
        <div>
          <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
            {/* Mockup Titlebar */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center justify-between text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="text-destructive font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> 1 Circular Loop Detected
              </span>
              <span>Tarjan Analysis</span>
            </div>

            {/* Mockup Body: Cycle Diagram */}
            <div className="h-64 sm:h-72 p-6 bg-surface/50 flex flex-col justify-center">
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> 3-Node Circular Loop
                  </span>
                  <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-semibold">
                    High Severity
                  </span>
                </div>

                <div className="font-mono text-xs text-foreground/90 bg-background/80 p-3 rounded-lg border border-border space-y-1">
                  <div className="flex items-center gap-2 text-destructive">
                    <span>1.</span> <span>services/authService.ts</span>
                  </div>
                  <div className="pl-4 text-muted-foreground">↓ imports apiClient</div>
                  <div className="flex items-center gap-2 text-destructive">
                    <span>2.</span> <span>lib/apiClient.ts</span>
                  </div>
                  <div className="pl-4 text-muted-foreground">↓ imports tokenStorage</div>
                  <div className="flex items-center gap-2 text-destructive">
                    <span>3.</span> <span>utils/tokenStorage.ts</span>
                  </div>
                  <div className="pl-4 text-destructive font-semibold">
                    ↺ imports authService (Circular Cycle)
                  </div>
                </div>
              </div>
            </div>

            {/* Icon Tab Row */}
            <div className="p-2 border-t border-border bg-surface-elevated/50 grid grid-cols-4 gap-1 text-[11px] font-mono">
              {[
                { label: "Cycles", icon: RefreshCw },
                { label: "Heatmap", icon: Activity },
                { label: "Blast Radius", icon: Shield },
                { label: "Fix Plan", icon: CheckCircle2 },
              ].map((tab, i) => {
                const Icon = tab.icon;
                const active = feature3Tab === i;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setFeature3Tab(i)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURE 4: Curated Reading Paths & Repository Evolution           */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: Mockup Frame + Icon Tab Row (Order 2 on mobile, 1 on desktop) */}
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
            {/* Mockup Titlebar */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-elevated flex items-center justify-between text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="flex items-center gap-1 text-primary">
                <Compass className="w-3.5 h-3.5" /> Recommended Reading Path
              </span>
              <span>4 Steps</span>
            </div>

            {/* Mockup Body: Step-by-Step Sequence */}
            <div className="h-64 sm:h-72 p-5 bg-surface/50 overflow-y-auto space-y-2.5">
              {[
                {
                  step: "01",
                  file: "src/server/index.ts",
                  desc: "HTTP Gateway & Server Bootstrap",
                  time: "8 min",
                  done: true,
                },
                {
                  step: "02",
                  file: "src/middleware/auth.ts",
                  desc: "Session Validation & RBAC Guard",
                  time: "12 min",
                  done: true,
                },
                {
                  step: "03",
                  file: "src/services/astEngine.ts",
                  desc: "Core AST Parsing & Graph Serialization",
                  time: "20 min",
                  active: true,
                },
                {
                  step: "04",
                  file: "src/workers/webhookQueue.ts",
                  desc: "Background Sync & Cache Invalidation",
                  time: "15 min",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono ${
                    item.active
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-surface/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                        item.done
                          ? "bg-primary text-primary-foreground"
                          : item.active
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.step}
                    </span>
                    <div>
                      <span className="font-semibold text-foreground block">{item.file}</span>
                      <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-secondary">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Icon Tab Row */}
            <div className="p-2 border-t border-border bg-surface-elevated/50 grid grid-cols-4 gap-1 text-[11px] font-mono">
              {[
                { label: "Sequencing", icon: Compass },
                { label: "Time Est", icon: Activity },
                { label: "Prereqs", icon: CheckCircle2 },
                { label: "Git Story", icon: History },
              ].map((tab, i) => {
                const Icon = tab.icon;
                const active = feature4Tab === i;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setFeature4Tab(i)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Text & Proof Card (Order 1 on mobile, 2 on desktop) */}
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Guided Onboarding</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight leading-tight">
            Ramp Up New Engineers in Hours, Not Weeks
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Stop handing new team members a 200-file repository with &quot;start with index.js&quot;.
            Structa calculates topological prerequisites and sequences an optimal reading path.
          </p>

          {/* Proof / Velocity Card */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold text-primary uppercase">
                Topological Sequence Analysis
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">Kahn&apos;s Algorithm</span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              Orders files according to prerequisite depth so engineers learn foundational schemas
              and configuration primitives before encountering complex orchestration logic.
            </p>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Estimated reading times
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Historical git story
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

