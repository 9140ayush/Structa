"use client";

/**
 * components/landing/PlatformRadialDiagram.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Central "platform" diagram with items arranged radially around a core,
 * inspired by incident.io architecture diagram section.
 *
 * Core: Structa Intelligence Engine (3D AST Graph)
 * Orbit: 12 Shipped Product Views (Overview, 2D Architecture, Files, Tech Stack,
 * Flows, Dependencies, Health, Module Explorer, Reading Path, Story, Copilot, ⌘K Search).
 */

import React, { useState } from "react";
import {
  Box,
  Layers,
  FolderTree,
  Cpu,
  Workflow,
  Network,
  Activity,
  FileCode2,
  Compass,
  History,
  Sparkles,
  Command,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";

interface ViewItem {
  id: string;
  name: string;
  category: "Visual" | "Intelligence" | "Navigation" | "Analysis";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const SATELLITE_VIEWS: ViewItem[] = [
  {
    id: "overview",
    name: "Overview",
    category: "Visual",
    description: "Repository health score, LOC metrics, and key subsystem distribution.",
    icon: LayoutDashboard,
    tag: "Vitals",
  },
  {
    id: "2d-arch",
    name: "2D Architecture",
    category: "Visual",
    description: "Hierarchical tiered layout separating entry points, core logic, and shared utilities.",
    icon: Layers,
    tag: "Tiers",
  },
  {
    id: "files",
    name: "Files Explorer",
    category: "Navigation",
    description: "Spatial directory tree navigator with per-folder complexity heatmaps.",
    icon: FolderTree,
    tag: "Tree",
  },
  {
    id: "tech-stack",
    name: "Tech Stack",
    category: "Analysis",
    description: "Automated framework, library, and dev dependency detection.",
    icon: Cpu,
    tag: "Stack",
  },
  {
    id: "flows",
    name: "Execution Flows",
    category: "Visual",
    description: "Step-by-step function call and event sequence tracing across files.",
    icon: Workflow,
    tag: "Traces",
  },
  {
    id: "dependencies",
    name: "Deep Dependencies",
    category: "Analysis",
    description: "Tarjan's cycle detection and blast radius dependency impact trees.",
    icon: Network,
    tag: "Cycles",
  },
  {
    id: "health",
    name: "Health & Hotspots",
    category: "Analysis",
    description: "Structural coupling, cyclomatic risk, and stability scoring (0-100).",
    icon: Activity,
    tag: "Quality",
  },
  {
    id: "modules",
    name: "Module Explorer",
    category: "Navigation",
    description: "In-depth module inspector with symbol exports, imports, and AST docstrings.",
    icon: FileCode2,
    tag: "Inspector",
  },
  {
    id: "reading-path",
    name: "Reading Path",
    category: "Intelligence",
    description: "Sequenced onboarding guide ordering files by dependency prerequisites.",
    icon: Compass,
    tag: "Onboard",
  },
  {
    id: "story",
    name: "Repo Story",
    category: "Intelligence",
    description: "Git commit history reconstructed as architectural evolution phases.",
    icon: History,
    tag: "Timeline",
  },
  {
    id: "copilot",
    name: "Grounded Copilot",
    category: "Intelligence",
    description: "Natural-language chat with strict AST citations and line-range proof.",
    icon: Sparkles,
    tag: "AI Chat",
  },
  {
    id: "command",
    name: "⌘K Universal Search",
    category: "Navigation",
    description: "Instant keyboard-driven fuzzy search across files, symbols, and views.",
    icon: Command,
    tag: "Quick Jump",
  },
];

export function PlatformRadialDiagram() {
  const [activeItem, setActiveItem] = useState<ViewItem>(SATELLITE_VIEWS[10]); // Copilot default

  return (
    <section
      className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden"
      aria-labelledby="platform-heading"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
          Unified Platform Architecture
        </span>
        <h2
          id="platform-heading"
          className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight mt-3"
        >
          One Core Intelligence Engine. 12 Specialized Perspectives.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Every repository is parsed into a single, high-fidelity Abstract Syntax Tree. Structa then
          projects that topology across 12 purpose-built analytical views for total codebase mastery.
        </p>
      </div>

      {/* Main Interactive Diagram Container */}
      <div className="relative rounded-2xl border border-border bg-surface/50 p-6 sm:p-10 shadow-lg">
        {/* Ambient Center Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[90px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Center Hub: The Core Engine */}
        <div className="max-w-md mx-auto text-center mb-12 relative z-10">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-[0_0_30px_rgba(61,220,151,0.25)] mb-4">
            <Box className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-heading font-bold text-foreground">
            Structa 3D Graph Engine
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Core Topological AST & Dependency Extraction Kernel
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Active Perspective:</span>
            <span className="font-semibold text-primary">{activeItem.name}</span>
          </div>
        </div>

        {/* Orbiting Satellite Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
          {SATELLITE_VIEWS.map((view) => {
            const Icon = view.icon;
            const isSelected = view.id === activeItem.id;
            return (
              <button
                key={view.id}
                onClick={() => setActiveItem(view)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-surface border-primary shadow-md ring-1 ring-primary/40"
                    : "bg-surface/70 hover:bg-surface border-border/80 hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-foreground/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {view.tag}
                  </span>
                </div>

                <div>
                  <h4
                    className={`font-sans text-sm font-semibold transition-colors ${
                      isSelected ? "text-foreground" : "text-foreground/90"
                    }`}
                  >
                    {view.name}
                  </h4>
                  <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {view.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected View Spotlight Banner */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-elevated/40 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <activeItem.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm text-foreground">
                  {activeItem.name} View
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-semibold">
                  {activeItem.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{activeItem.description}</p>
            </div>
          </div>

          <a
            href="/explorer"
            className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-primary hover:underline shrink-0"
          >
            <span>Try in Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

