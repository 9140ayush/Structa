"use client";

/**
 * app/(dashboard)/repos/[repoId]/reading-path/page.tsx — Phase 11.12
 *
 * Recommended Reading Path: Helps developers answer "Where should I start?".
 * Heuristically builds an ordered reading list categorized into Entry Point,
 * Foundational Modules, Core Business Logic, and Supporting Infrastructure.
 */

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  FileCode,
  Puzzle,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface ReadingStep {
  stepNumber: string;
  title: string;
  path: string;
  category:
    "Entry Point" | "Foundational Modules" | "Core Business Logic" | "Supporting Infrastructure";
  why: string;
  whatYouWillLearn: string;
  moduleId?: string;
}

interface ComplexFile {
  id: string;
  path: string;
  name: string;
  complexityScore: number;
  summary?: string;
}

interface ReadingPathFile {
  id: string;
  path: string;
  name: string;
  complexityScore?: number;
  summary?: string;
}

interface ReadingPathIntelligencePayload {
  repoName: string;
  fileTree?: ReadingPathFile[];
  topComplexFiles?: ComplexFile[];
}

interface ReadingPathPageProps {
  params: Promise<{ repoId: string }>;
}

export default function ReadingPathPage({ params }: ReadingPathPageProps) {
  const { repoId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReadingPathIntelligencePayload | null>(null);
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        const res = await fetch(`/api/repos/${repoId}/intelligence`);
        if (!res.ok) throw new Error("Failed to fetch repository intelligence.");
        const json: ReadingPathIntelligencePayload = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load Reading Path.");
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, [repoId]);

  // Generate recommended path dynamically based on intelligence payload
  const steps = useMemo<ReadingStep[]>(() => {
    if (!data?.fileTree) return [];
    const files: Array<{
      id: string;
      path: string;
      name: string;
      complexityScore?: number;
      summary?: string;
    }> = data.fileTree;

    const list: ReadingStep[] = [];

    // 1. Overview / README
    const readme = files.find((f) => /readme/i.test(f.path));
    if (readme) {
      list.push({
        stepNumber: "01",
        title: "Repository README & Documentation",
        path: readme.path,
        category: "Entry Point",
        why: "Provides high-level context, prerequisites, and project intentions.",
        whatYouWillLearn:
          "Project goals, setup instructions, and high-level architectural overview.",
        moduleId: readme.id,
      });
    }

    // 2. Application Entry Point
    const entry = files.find((f) =>
      /index\.(ts|js|tsx|jsx)$|main\.(ts|js)|app\/page\.tsx|server\.(ts|js)/i.test(f.path),
    );
    if (entry) {
      list.push({
        stepNumber: "02",
        title: "Application Bootstrap & Entry Point",
        path: entry.path,
        category: "Entry Point",
        why: "This is where the runtime process boots up and sets up global state.",
        whatYouWillLearn: "Initialization routine, middleware loading, and root route mounting.",
        moduleId: entry.id,
      });
    }

    // 3. Foundational / Config / Auth / DB Modules
    const foundations = files.filter((f) => /config|database|db|auth|middleware|lib/i.test(f.path));
    if (foundations.length > 0) {
      const topFoundations = foundations.slice(0, mode === "beginner" ? 2 : 4);
      topFoundations.forEach((f) => {
        list.push({
          stepNumber: String(list.length + 1).padStart(2, "0"),
          title: `Foundational Infrastructure: ${f.name}`,
          path: f.path,
          category: "Foundational Modules",
          why: "Powers cross-cutting concerns used across the entire codebase.",
          whatYouWillLearn:
            f.summary || "Database connections, session handling, and environment configuration.",
          moduleId: f.id,
        });
      });
    }

    // 4. Core Business Logic (Top Complex / Highly Imported Modules)
    const coreModules = (data.topComplexFiles || [])
      .filter((f: ComplexFile) => !list.some((s) => s.path === f.path))
      .slice(0, mode === "beginner" ? 3 : 6);

    coreModules.forEach((f: ComplexFile) => {
      list.push({
        stepNumber: String(list.length + 1).padStart(2, "0"),
        title: `Core Domain Service: ${f.name}`,
        path: f.path,
        category: "Core Business Logic",
        why: `Highest complexity (${f.complexityScore}/10) and primary business rules.`,
        whatYouWillLearn:
          f.summary || "Core logic workflows, data transformations, and domain rules.",
        moduleId: f.id,
      });
    });

    // 5. Supporting Utilities
    const utils = files.filter(
      (f) => /util|helper|common|components/i.test(f.path) && !list.some((s) => s.path === f.path),
    );
    if (utils.length > 0) {
      const topUtils = utils.slice(0, 2);
      topUtils.forEach((f) => {
        list.push({
          stepNumber: String(list.length + 1).padStart(2, "0"),
          title: `Supporting Component/Utility: ${f.name}`,
          path: f.path,
          category: "Supporting Infrastructure",
          why: "Reusable helpers and UI primitives used across services.",
          whatYouWillLearn: "Utility functions, formatting helpers, and shared components.",
          moduleId: f.id,
        });
      });
    }

    return list;
  }, [data, mode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 font-mono text-xs text-muted-foreground py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span>Generating Recommended Reading Path...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-xl mx-auto my-12 bg-danger/10 border border-danger/20 rounded-xl text-danger font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load Reading Path
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
            <Compass className="w-5 h-5 text-accent" /> Recommended Reading Path
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Answers &ldquo;Where should I start?&rdquo; with a curated exploration sequence for{" "}
            {data.repoName}.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-card/60 shrink-0">
          <button
            onClick={() => setMode("beginner")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              mode === "beginner"
                ? "bg-accent text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Beginner Track
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-all ${
              mode === "advanced"
                ? "bg-accent text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Deep Dive Track
          </button>
        </div>
      </div>

      {/* Path Sequence Timeline */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {steps.map((step) => (
          <div
            key={step.stepNumber}
            className="relative flex items-start gap-4 p-5 rounded-xl border border-border bg-card/40 hover:bg-card/70 transition-all font-mono text-xs"
          >
            {/* Step Number Badge */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent font-heading font-bold text-base shrink-0">
              {step.stepNumber}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">{step.title}</h3>
                  <p className="text-[11px] text-muted-foreground break-all">{step.path}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary border border-border text-accent uppercase">
                  {step.category}
                </span>
              </div>

              {/* Rationale & Learnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border/40 bg-secondary/30">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <HelpCircle className="w-3.5 h-3.5 text-accent" /> Why read this?
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{step.why}</p>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-secondary/30">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> What you will understand
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{step.whatYouWillLearn}</p>
                </div>
              </div>

              {/* Navigation Action links */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {step.moduleId && (
                  <Link
                    href={`/repos/${repoId}/modules?module=${encodeURIComponent(step.moduleId)}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card text-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    <Puzzle className="w-3 h-3 text-accent" /> Inspect Module
                  </Link>
                )}

                <Link
                  href={`/repos/${repoId}/files?file=${encodeURIComponent(step.path)}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <FileCode className="w-3 h-3 text-muted-foreground" /> View Source
                </Link>

                <Link
                  href={`/repos/${repoId}/copilot?prompt=${encodeURIComponent(`Explain ${step.path} in detail`)}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-accent" /> Ask Copilot
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
