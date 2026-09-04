"use client";

/**
 * app/(dashboard)/repos/[repoId]/story/page.tsx — Phase 11.13
 *
 * Repository Story: Human-readable narrative describing how the repository works.
 * Grounded in parsed repository intelligence with clickable references to
 * Modules, Files, Architecture, Flows, and 3D Graph.
 */

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  BookOpen,
  Box,
  Network,
  Workflow,
  ShieldAlert,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface StoryTechItem {
  name: string;
  category: string;
}

interface StoryModuleItem {
  id: string;
  name: string;
}

interface StoryIntelligencePayload {
  repoName: string;
  moduleCount: number;
  fileCount: number;
  totalLOC: number;
  avgComplexity: number;
  edgeCount: number;
  healthScore: number;
  topImportedModules?: StoryModuleItem[];
  detectedTech?: StoryTechItem[];
  circularDependencies?: { count: number };
}

interface StoryPageProps {
  params: Promise<{ repoId: string }>;
}

export default function RepositoryStoryPage({ params }: StoryPageProps) {
  const { repoId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StoryIntelligencePayload | null>(null);
  const [mode, setMode] = useState<"beginner" | "technical">("beginner");

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        const res = await fetch(`/api/repos/${repoId}/intelligence`);
        if (!res.ok) throw new Error("Failed to fetch repository intelligence.");
        const json: StoryIntelligencePayload = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load Repository Story.");
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, [repoId]);

  const topModules = data?.topImportedModules || [];
  const techStack = data?.detectedTech || [];
  const cycles = data?.circularDependencies?.count || 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 font-mono text-xs text-muted-foreground py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span>Composing Repository Story...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-xl mx-auto my-12 bg-danger/10 border border-danger/20 rounded-xl text-danger font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to generate Repository Story
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" /> Repository Story
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            The narrative of how {data.repoName} is built, structured, and operates.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-card/60 shrink-0">
          <button
            onClick={() => setMode("beginner")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              mode === "beginner"
                ? "bg-accent text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Beginner Overview
          </button>
          <button
            onClick={() => setMode("technical")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              mode === "technical"
                ? "bg-accent text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Technical Breakdown
          </button>
        </div>
      </div>

      {/* Story Chapter Content */}
      <div className="max-w-4xl mx-auto w-full space-y-8 font-mono text-xs text-foreground">
        {/* Chapter 1: Project Purpose */}
        <section className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-accent">
            <span className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-xs">
              1
            </span>
            Project Purpose & Scope
          </div>
          <p className="leading-relaxed text-muted-foreground">
            {data.repoName} is a software repository comprising {data.moduleCount} modules (
            {data.fileCount} files) across {data.totalLOC} lines of code.
            {mode === "beginner"
              ? " It brings together key components to deliver a unified application experience."
              : ` The codebase maintains an average complexity score of ${data.avgComplexity}/10 with ${data.edgeCount} dependency relationships.`}
          </p>
        </section>

        {/* Chapter 2: Entry Point */}
        <section className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-accent">
            <span className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-xs">
              2
            </span>
            Application Entry Point
          </div>
          <p className="leading-relaxed text-muted-foreground">
            When execution begins, the system initializes through core entry routes and
            configuration files.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href={`/repos/${repoId}/reading-path`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" /> View Entry Points in Reading Path
            </Link>
          </div>
        </section>

        {/* Chapter 3: Major Architecture */}
        <section className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-accent">
            <span className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-xs">
              3
            </span>
            Major Architecture & Technology Stack
          </div>
          <p className="leading-relaxed text-muted-foreground">
            The technology stack leverages {techStack.length} detected technologies, including:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {techStack.map((tech: StoryTechItem) => (
              <span
                key={tech.name}
                className="px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground text-xs"
              >
                {tech.name} <span className="text-muted-foreground">({tech.category})</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href={`/repos/${repoId}/architecture`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Network className="w-3.5 h-3.5" /> Explore 2D Architecture
            </Link>
            <Link
              href={`/repos/${repoId}/graph`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Box className="w-3.5 h-3.5" /> View in 3D Graph
            </Link>
          </div>
        </section>

        {/* Chapter 4: Core Modules */}
        <section className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-accent">
            <span className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-xs">
              4
            </span>
            Core Modules & Foundation
          </div>
          <p className="leading-relaxed text-muted-foreground">
            The core architecture revolves around high-impact foundational modules:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {topModules.slice(0, 4).map((mod: StoryModuleItem) => (
              <Link
                key={mod.id}
                href={`/repos/${repoId}/modules?module=${encodeURIComponent(mod.id)}`}
                className="p-3 rounded-lg border border-border bg-card/60 hover:bg-secondary transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-foreground truncate">{mod.name}</span>
                <span className="text-[10px] text-accent">Inspect Module →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Chapter 5: Data & Request Flow */}
        <section className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-accent">
            <span className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-xs">
              5
            </span>
            Data & Request Execution Flow
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Requests flow from entry endpoints into core services and database storage handlers.
          </p>
          <div className="pt-2">
            <Link
              href={`/repos/${repoId}/flows`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Workflow className="w-3.5 h-3.5 text-accent" /> Trace Request Flows
            </Link>
          </div>
        </section>

        {/* Chapter 6: Architectural Concerns & Health */}
        <section className="p-6 rounded-xl border border-border bg-card/40 space-y-3">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-accent">
            <span className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-xs">
              6
            </span>
            Architectural Risks & Health Assessment
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Current Codebase Health Score is{" "}
            <span className="font-bold text-foreground">{data.healthScore}/100</span>.
            {cycles > 0
              ? ` Detected ${cycles} circular dependency cycle(s) that require refactoring.`
              : " No circular dependencies detected."}
          </p>
          <div className="pt-2">
            <Link
              href={`/repos/${repoId}/health`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-warning" /> View Full Codebase Health
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
