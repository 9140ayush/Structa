"use client";

/**
 * components/landing/TechCredibilityStrip.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Credibility strip highlighting the real technologies Structa supports and parses.
 * No fake customer logos or fabricated metrics (PRD.md / Rules.md constraint).
 */

import React from "react";
import {
  Code2,
  FileCode,
  Layers,
  Atom,
  Server,
  Terminal,
  Cpu,
  Database,
  Container,
  GitBranch,
} from "lucide-react";

interface TechItem {
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TECHNOLOGIES: TechItem[] = [
  { name: "TypeScript", category: "Language", icon: FileCode },
  { name: "JavaScript", category: "Language", icon: Code2 },
  { name: "Next.js", category: "Framework", icon: Layers },
  { name: "React", category: "Library", icon: Atom },
  { name: "Node.js", category: "Runtime", icon: Server },
  { name: "Python", category: "Language", icon: Terminal },
  { name: "Go", category: "Language", icon: Cpu },
  { name: "Rust", category: "Language", icon: Cpu },
  { name: "MongoDB", category: "Database", icon: Database },
  { name: "Docker", category: "DevOps", icon: Container },
  { name: "GitHub", category: "VCS", icon: GitBranch },
];

export function TechCredibilityStrip() {
  return (
    <section
      className="py-12 border-y border-border/60 bg-surface/40 overflow-hidden"
      aria-label="Supported Technologies"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">
          Continuous AST Parsing & Architecture Intelligence For Modern Stacks
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {TECHNOLOGIES.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-border/70 bg-surface/80 hover:bg-surface hover:border-primary/40 transition-all duration-200"
              >
                <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block font-sans text-xs font-medium text-foreground truncate">
                    {tech.name}
                  </span>
                  <span className="block font-mono text-[10px] text-muted-foreground/80 truncate">
                    {tech.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

