"use client";

/**
 * components/modules/ModuleDetailPanel.tsx — Phase 11.11
 *
 * Reusable Module Detail view / drawer.
 * Displays all metadata for a specific repository module:
 *  - Purpose & AI Summary
 *  - File path & LOC
 *  - Complexity score & coupling indicators
 *  - Dependencies (Depends On) & Dependents (Used By)
 *  - Quick actions: Show in 3D Graph, Open File, Explain with Copilot
 */

import React from "react";
import Link from "next/link";
import {
  Puzzle,
  Box,
  FileCode,
  Link2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Code2,
  Layers,
} from "lucide-react";

export interface ModuleData {
  id: string;
  name: string;
  path: string;
  type: string;
  loc: number;
  complexityScore: number;
  summary?: string;
  summaryStatus?: string;
  importsCount?: number;
  importedByCount?: number;
  imports?: Array<{ id: string; name: string; path: string }>;
  importedBy?: Array<{ id: string; name: string; path: string }>;
}

interface ModuleDetailPanelProps {
  module: ModuleData;
  repoId: string;
  onClose?: () => void;
  isDrawer?: boolean;
}

export function ModuleDetailPanel({
  module,
  repoId,
  onClose,
  isDrawer = false,
}: ModuleDetailPanelProps) {
  const getComplexityBadge = (score: number) => {
    if (score >= 7)
      return { text: "High Complexity", color: "bg-danger/10 text-danger border-danger/20" };
    if (score >= 4)
      return { text: "Medium Complexity", color: "bg-warning/10 text-warning border-warning/20" };
    return { text: "Low Complexity", color: "bg-primary/10 text-primary border-primary/20" };
  };

  const badge = getComplexityBadge(module.complexityScore);

  return (
    <div
      className={`bg-card border border-border rounded-xl p-5 space-y-6 ${
        isDrawer ? "shadow-2xl" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-4 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/25 text-accent shrink-0 mt-0.5">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base text-foreground break-all">
                {module.name}
              </h2>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
              >
                {badge.text}
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground break-all mt-0.5">
              {module.path}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/repos/${repoId}/graph?focus=${encodeURIComponent(module.id)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/10 text-accent font-mono text-xs font-semibold hover:bg-accent/20 transition-colors"
        >
          <Box className="w-3.5 h-3.5" />
          Show in 3D Graph
        </Link>

        <Link
          href={`/repos/${repoId}/files?file=${encodeURIComponent(module.path)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground font-mono text-xs font-medium hover:bg-secondary transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
          Open File
        </Link>

        <Link
          href={`/repos/${repoId}/copilot?prompt=${encodeURIComponent(`Explain the module ${module.name} (${module.path}) in detail`)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-foreground font-mono text-xs font-medium hover:bg-secondary transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Explain with AI
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono mb-1">
            <Code2 className="w-3.5 h-3.5" /> LOC
          </div>
          <div className="font-heading font-bold text-sm text-foreground">{module.loc}</div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono mb-1">
            <Layers className="w-3.5 h-3.5" /> Complexity
          </div>
          <div className="font-heading font-bold text-sm text-foreground">
            {module.complexityScore}/10
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono mb-1">
            <ArrowRight className="w-3.5 h-3.5" /> Depends On
          </div>
          <div className="font-heading font-bold text-sm text-foreground">
            {module.importsCount ?? module.imports?.length ?? 0}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Used By
          </div>
          <div className="font-heading font-bold text-sm text-foreground">
            {module.importedByCount ?? module.importedBy?.length ?? 0}
          </div>
        </div>
      </div>

      {/* Purpose / AI Summary */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> Purpose & Architecture Role
        </h3>
        <div className="p-3.5 rounded-lg border border-border bg-card/60 font-mono text-xs leading-relaxed text-muted-foreground">
          {module.summary || (
            <span className="italic">
              No AI summary generated for this module yet. Click &ldquo;Explain with AI&rdquo; to
              analyze.
            </span>
          )}
        </div>
      </div>

      {/* Dependencies & Dependents Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Depends On */}
        <div className="space-y-2">
          <h4 className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-accent" /> Depends On (
            {module.imports?.length ?? module.importsCount ?? 0})
          </h4>
          <div className="p-3 rounded-lg border border-border bg-card/40 space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
            {module.imports && module.imports.length > 0 ? (
              module.imports.map((imp) => (
                <Link
                  key={imp.id}
                  href={`/repos/${repoId}/modules?module=${encodeURIComponent(imp.id)}`}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground truncate"
                >
                  <span className="truncate">{imp.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground italic text-xs">No internal dependencies.</p>
            )}
          </div>
        </div>

        {/* Used By */}
        <div className="space-y-2">
          <h4 className="font-heading font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-accent" /> Used By (
            {module.importedBy?.length ?? module.importedByCount ?? 0})
          </h4>
          <div className="p-3 rounded-lg border border-border bg-card/40 space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
            {module.importedBy && module.importedBy.length > 0 ? (
              module.importedBy.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/repos/${repoId}/modules?module=${encodeURIComponent(dep.id)}`}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground truncate"
                >
                  <span className="truncate">{dep.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground italic text-xs">
                No dependents referencing this file.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
