"use client";

/**
 * app/(dashboard)/repos/[repoId]/explanation/page.tsx — Phase 11.5
 *
 * End-to-end AI Repository Explanation page.
 *
 * Grounded in actual module analysis — no hallucinations.
 *
 * Features:
 *  - 5 Lifecycle Scenarios:
 *     1. Not synced (CTA to sync)
 *     2. Syncing in progress (loading indicator & polling)
 *     3. Sync succeeded (auto-refresh & render)
 *     4. Sync/AI failed (meaningful error explanation & retry)
 *     5. Synced but summaries missing (on-demand generation)
 *  - Technical / Beginner mode toggle
 *  - Dual Views:
 *     - Repository Architecture Overview (6-section grounded breakdown)
 *     - Module Navigation & Detailed Explanations
 *  - Clickable file pills navigating to 3D Graph, File Explorer, and Module Explorer
 *  - Working on-demand retry/refresh action
 */

import React, { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Code2,
  BookOpen,
  Box,
  Layers,
  Search,
  FolderOpen,
  Puzzle,
  AlertCircle,
  FileCode,
  Link2,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExplPageProps {
  params: Promise<{ repoId: string }>;
}

interface ModuleItem {
  id: string;
  name: string;
  path: string;
  type: string;
  loc: number;
  complexityScore: number;
  summary: string;
  summaryStatus: string;
  summaryError?: string;
  importsCount: number;
  importedByCount: number;
  imports?: Array<{ id: string; name: string; path: string }>;
  importedBy?: Array<{ id: string; name: string; path: string }>;
}

interface StatusResponse {
  repoId: string;
  repoName: string;
  repoUrl: string;
  isSynced: boolean;
  syncStatus: "not_synced" | "syncing" | "ready" | "missing_summaries" | "failed";
  aiSummariesStatus: string;
  aiSummariesError: string;
  lastSyncedAt: string | null;
  totalFileModules: number;
  doneSummariesCount: number;
  generatingCount: number;
  failedCount: number;
  cachedTechnical: string;
  cachedTechnicalAt: string | null;
  cachedBeginner: string;
  cachedBeginnerAt: string | null;
  modules: ModuleItem[];
}

interface GenerateResponse {
  explanation: string;
  cached: boolean;
  mode: "technical" | "beginner";
  generatedAt: string;
  fallback?: boolean;
  aiError?: string;
}

// ---------------------------------------------------------------------------
// Markdown & File pill renderer
// ---------------------------------------------------------------------------

function renderExplanation(text: string, repoId: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      nodes.push(<div key={key++} className="h-2.5" />);
    } else if (trimmed === "---" || trimmed === "***") {
      nodes.push(<hr key={key++} className="my-5 border-border/50" />);
    } else if (trimmed.startsWith("```")) {
      // Code block
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      nodes.push(
        <pre
          key={key++}
          className="my-3 p-3.5 rounded-lg bg-secondary/70 border border-border/60 font-mono text-xs overflow-x-auto text-foreground/90 leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
    } else if (trimmed.startsWith("> [!NOTE]")) {
      // Alert block note
      const alertLines: string[] = [];
      i++;
      while (i < lines.length && lines[i]!.trim().startsWith(">")) {
        alertLines.push(lines[i]!.trim().replace(/^>\s?/, ""));
        i++;
      }
      i--; // rewind one step
      nodes.push(
        <div
          key={key++}
          className="my-3 p-3.5 rounded-lg border border-accent/30 bg-accent/5 text-xs font-mono text-foreground/90 space-y-1"
        >
          <div className="flex items-center gap-1.5 font-bold text-accent">
            <Info className="w-4 h-4" />
            <span>Analysis Notice</span>
          </div>
          <p className="leading-relaxed">{alertLines.join(" ")}</p>
        </div>,
      );
    } else if (trimmed.startsWith("> ")) {
      // Standard blockquote
      nodes.push(
        <blockquote
          key={key++}
          className="my-2.5 pl-3.5 border-l-2 border-accent/40 italic text-muted-foreground text-sm leading-relaxed"
        >
          {renderInlineWithFileLinks(trimmed.slice(2), repoId)}
        </blockquote>,
      );
    } else if (trimmed.startsWith("# ")) {
      nodes.push(
        <h1
          key={key++}
          className="font-heading font-extrabold text-lg text-foreground mt-7 mb-3 pb-1.5 border-b border-border/50"
        >
          {trimmed.slice(2)}
        </h1>,
      );
    } else if (trimmed.startsWith("## ")) {
      nodes.push(
        <h2
          key={key++}
          className="font-heading font-bold text-base text-foreground mt-6 mb-2.5 pb-1 border-b border-border/40 flex items-center gap-2"
        >
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} className="font-heading font-semibold text-sm text-foreground mt-4 mb-1.5">
          {trimmed.slice(4)}
        </h3>,
      );
    } else if (trimmed.startsWith("#### ")) {
      nodes.push(
        <h4
          key={key++}
          className="font-heading font-medium text-xs uppercase tracking-wider text-muted-foreground mt-3 mb-1"
        >
          {trimmed.slice(5)}
        </h4>,
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      // Numbered list item: "1. Item text"
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        const [, num, body] = match;
        nodes.push(
          <div key={key++} className="flex items-start gap-2.5 my-1.5 pl-0.5">
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-accent/15 text-accent text-xs font-bold font-mono">
              {num}
            </span>
            <div className="font-sans text-sm text-foreground/90 leading-relaxed pt-0.5">
              {renderInlineWithFileLinks(body || "", repoId)}
            </div>
          </div>,
        );
      }
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      nodes.push(
        <li
          key={key++}
          className="font-sans text-sm text-foreground/90 leading-relaxed ml-5 list-disc my-1"
        >
          {renderInlineWithFileLinks(trimmed.slice(2), repoId)}
        </li>,
      );
    } else {
      nodes.push(
        <p key={key++} className="font-sans text-sm text-foreground/90 leading-relaxed my-1.5">
          {renderInlineWithFileLinks(trimmed, repoId)}
        </p>,
      );
    }
  }

  return nodes;
}

function renderInlineWithFileLinks(text: string, repoId: string): React.ReactNode {
  // Regex to match `code/file.ext` or **bold**
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      // If looks like a file path (contains slash or dot extension), link to files/3D graph
      const isPath = inner.includes("/") || /\.[a-z0-9]+$/i.test(inner);
      if (isPath) {
        return (
          <Link
            key={index}
            href={`/repos/${repoId}/files?file=${encodeURIComponent(inner)}`}
            className="inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-accent/10 border border-accent/25 text-accent hover:bg-accent/20 transition-colors mx-0.5"
            title={`View ${inner} in File Explorer`}
          >
            <FileCode className="w-3 h-3 shrink-0" />
            {inner}
          </Link>
        );
      }
      return (
        <code
          key={index}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-secondary text-foreground border border-border"
        >
          {inner}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ExplanationPage({ params }: ExplPageProps) {
  const { repoId } = use(params);

  // View state
  const [activeView, setActiveView] = useState<"overview" | "modules">("overview");
  const [mode, setMode] = useState<"technical" | "beginner">("technical");

  // Data state
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [cachedInfo, setCachedInfo] = useState<{
    cached: boolean;
    generatedAt?: string;
    fallback?: boolean;
    aiError?: string;
  } | null>(null);

  // Loading & Execution state
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Module exploration state
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleSearch, setModuleSearch] = useState<string>("");

  // Fetch status & existing explanations
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/repos/${repoId}/explain`, { cache: "no-store" });
      const data: StatusResponse = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as unknown as { error?: string }).error || "Failed to load explanation status.",
        );
      }
      setStatus(data);

      // Pre-select cached explanation if available for current mode
      if (mode === "technical" && data.cachedTechnical) {
        setExplanation(data.cachedTechnical);
        setCachedInfo({
          cached: true,
          generatedAt: data.cachedTechnicalAt || undefined,
          aiError: data.aiSummariesError || undefined,
        });
      } else if (mode === "beginner" && data.cachedBeginner) {
        setExplanation(data.cachedBeginner);
        setCachedInfo({
          cached: true,
          generatedAt: data.cachedBeginnerAt || undefined,
          aiError: data.aiSummariesError || undefined,
        });
      }
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoadingStatus(false);
    }
  }, [repoId, mode]);

  // Generate or regenerate explanation
  const generate = useCallback(
    async (forceRefresh = false, generateMissingSummaries = false) => {
      setIsGenerating(true);
      setError(null);
      try {
        const res = await fetch(`/api/repos/${repoId}/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, forceRefresh, generateMissingSummaries }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to generate explanation.");
        }

        const genRes = data as GenerateResponse;
        setExplanation(genRes.explanation);
        setCachedInfo({
          cached: genRes.cached,
          generatedAt: genRes.generatedAt,
          fallback: genRes.fallback,
          aiError: genRes.aiError,
        });

        // Refresh status in background to update module summary statuses
        void fetchStatus();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsGenerating(false);
      }
    },
    [repoId, mode, fetchStatus],
  );

  // Full repo sync trigger
  const triggerSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}/sync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to trigger synchronization.");
      }
      // Poll status until ready
      pollStatusUntilFinished();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSyncing(false);
    }
  };

  // Poll status when syncing or generating in background
  const pollStatusUntilFinished = useCallback(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const current = await fetchStatus();
      if (!current || attempts > 25) {
        clearInterval(interval);
        setIsSyncing(false);
        return;
      }
      if (current.syncStatus === "ready" || current.doneSummariesCount > 0) {
        clearInterval(interval);
        setIsSyncing(false);
        // Automatically fetch/generate explanation once ready
        void generate(false, false);
      }
    }, 2500);
  }, [fetchStatus, generate]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      const current = await fetchStatus();
      if (!isMounted || !current) return;
      const hasCached = mode === "technical" ? !!current.cachedTechnical : !!current.cachedBeginner;
      if (!hasCached && current.syncStatus === "ready") {
        void generate(false, false);
      } else if (current.syncStatus === "syncing") {
        setIsSyncing(true);
        pollStatusUntilFinished();
      }
    };
    void initialize();
    return () => {
      isMounted = false;
    };
  }, [repoId, mode, fetchStatus, generate, pollStatusUntilFinished]);

  // Filter modules for navigation (computed directly in render for React 19 Compiler)
  const modulesList = status?.modules ?? [];
  const filteredModules = moduleSearch.trim()
    ? modulesList.filter((m) => {
        const q = moduleSearch.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.path.toLowerCase().includes(q);
      })
    : modulesList;

  const effectiveSelectedId = selectedModuleId ?? filteredModules[0]?.id ?? null;
  const selectedModule =
    filteredModules.find((m) => m.id === effectiveSelectedId) ??
    modulesList.find((m) => m.id === effectiveSelectedId) ??
    null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              AI Repository Explanation
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Grounded in actual module analysis — no hallucinations
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View switcher: Overview vs Modules */}
            <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setActiveView("overview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  activeView === "overview"
                    ? "bg-accent text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Architecture Overview
              </button>
              <button
                onClick={() => setActiveView("modules")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  activeView === "modules"
                    ? "bg-accent text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Puzzle className="w-3.5 h-3.5" />
                Module Navigator
                {status?.totalFileModules ? (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-border/60">
                    {status.totalFileModules}
                  </span>
                ) : null}
              </button>
            </div>

            {/* Mode toggle: Technical vs Beginner */}
            <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setMode("technical")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  mode === "technical"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Technical
              </button>
              <button
                onClick={() => setMode("beginner")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                  mode === "beginner"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Beginner
              </button>
            </div>
          </div>
        </div>

        {/* Global Loading Bar */}
        {(isLoadingStatus || isGenerating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <div className="relative">
              <Sparkles className="w-10 h-10 text-warning opacity-20" />
              <Loader2 className="w-6 h-6 animate-spin text-accent absolute top-2 left-2" />
            </div>
            <p className="font-mono text-sm text-foreground">
              {isGenerating
                ? "Synthesizing repository architecture & module explanations…"
                : "Checking repository analysis status…"}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              Evaluating import graph topology, complexity scores, and module summaries
            </p>
          </motion.div>
        )}

        {/* SCENARIO 1: Repository Not Synced */}
        {!isLoadingStatus && !isGenerating && status && status.syncStatus === "not_synced" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border border-warning/30 bg-warning/5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-base text-foreground">
                  Repository Not Synchronized
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  To generate an accurate AI architectural explanation, Structa must first inspect
                  the GitHub repository file tree, parse import dependencies, and calculate code
                  metrics.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing…</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Start Synchronization</span>
                  </>
                )}
              </button>
              <Link
                href={`/repos/${repoId}/graph`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-accent" />
                Go to 3D Graph
              </Link>
            </div>
          </motion.div>
        )}

        {/* SCENARIO 2: Sync in Progress */}
        {!isLoadingStatus && isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border border-accent/30 bg-accent/5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 mt-0.5">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-heading font-bold text-base text-foreground">
                  Synchronization in Progress
                </h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Fetching AST structures and generating module summaries. This page will
                  automatically update as soon as synchronization completes.
                </p>
                {status && status.totalFileModules > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between font-mono text-xs text-muted-foreground mb-1">
                      <span>Analyzing modules…</span>
                      <span>
                        {status.doneSummariesCount} / {status.totalFileModules} done
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            (status.doneSummariesCount / Math.max(status.totalFileModules, 1)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SCENARIO 4 & 5: Error or Missing Summaries State */}
        {!isLoadingStatus &&
          !isGenerating &&
          !isSyncing &&
          status &&
          status.syncStatus === "missing_summaries" &&
          !explanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl border border-warning/30 bg-warning/5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-warning/10 text-warning shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Module Summaries Pending
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    Repository AST structure was parsed ({status.totalFileModules} files found), but
                    individual module summaries have not yet completed generation.
                  </p>
                  {status.aiSummariesError && (
                    <div className="mt-2 p-2.5 rounded bg-danger/10 border border-danger/25 text-xs font-mono text-danger">
                      Provider notice: {status.aiSummariesError}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => generate(true, true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Summaries
                </button>
                <button
                  onClick={triggerSync}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-sync from GitHub
                </button>
              </div>
            </motion.div>
          )}

        {/* Error Banner (if any uncaught failure occurs) */}
        {!isLoadingStatus && !isGenerating && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-xl border border-danger/30 bg-danger/5 space-y-3"
          >
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="font-mono text-sm font-semibold">{error}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => generate(true, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Generation
              </button>
              <Link
                href={`/repos/${repoId}/graph`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
              >
                <Box className="w-3.5 h-3.5" />
                Go to 3D Graph
              </Link>
            </div>
          </motion.div>
        )}

        {/* SCENARIO 3: Succeeded / Explanation Ready */}
        {!isLoadingStatus && !isGenerating && explanation && (
          <AnimatePresence mode="wait">
            {activeView === "overview" ? (
              <motion.div
                key="overview-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Meta Control Bar */}
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground flex-wrap gap-2 px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1.5 text-accent font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      {mode === "beginner" ? "Beginner Mode" : "Technical Architecture Mode"}
                    </span>
                    <span>·</span>
                    <span>
                      {cachedInfo?.cached ? "Cached" : "Freshly Generated"}
                    </span>
                    {cachedInfo?.generatedAt && (
                      <>
                        <span>·</span>
                        <span>{new Date(cachedInfo.generatedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generate(true, false)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary/50 text-foreground hover:bg-secondary font-mono text-xs transition-colors"
                      title="Force regenerate this explanation"
                    >
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Main Explanation Card */}
                <div className="p-6 sm:p-8 rounded-xl border border-border bg-card/75 shadow-sm space-y-1">
                  {renderExplanation(explanation, repoId)}
                </div>

                {/* Deep-Dive Links */}
                <div className="p-4 rounded-xl border border-border bg-card/40 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    Deep dive into repository intelligence:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/repos/${repoId}/graph`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
                    >
                      <Box className="w-3.5 h-3.5 text-accent" />
                      3D Graph
                    </Link>
                    <Link
                      href={`/repos/${repoId}/files`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      File Explorer
                    </Link>
                    <Link
                      href={`/repos/${repoId}/modules`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
                    >
                      <Puzzle className="w-3.5 h-3.5" />
                      Module Explorer
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* MODULE NAVIGATOR VIEW */
              <motion.div
                key="modules-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* Module List Sidebar (5 cols) */}
                <div className="lg:col-span-5 rounded-xl border border-border bg-card/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Puzzle className="w-4 h-4 text-accent" />
                      Repository Modules
                    </h3>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {filteredModules.length} module{filteredModules.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter modules by name or path…"
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Module Item List */}
                  <div className="max-h-[550px] overflow-y-auto space-y-1.5 pr-1">
                    {filteredModules.map((m) => {
                      const isSelected = m.id === selectedModuleId;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModuleId(m.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-accent/15 border-accent text-foreground shadow-sm"
                              : "bg-secondary/30 border-border/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-foreground truncate">
                              {m.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                m.complexityScore >= 7
                                  ? "bg-danger/10 text-danger border border-danger/20"
                                  : m.complexityScore >= 4
                                    ? "bg-warning/10 text-warning border border-warning/20"
                                    : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              Score {m.complexityScore}/10
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground truncate mt-0.5">
                            {m.path}
                          </p>
                          <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground/80 mt-1.5">
                            <span>{m.loc} LOC</span>
                            <span>·</span>
                            <span>{m.importsCount} imports</span>
                            <span>·</span>
                            <span>{m.importedByCount} used by</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Module Detail Panel (7 cols) */}
                <div className="lg:col-span-7 rounded-xl border border-border bg-card/80 p-6 space-y-5">
                  {selectedModule ? (
                    <>
                      {/* Module Header */}
                      <div className="border-b border-border/60 pb-4 space-y-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-accent" />
                            {selectedModule.name}
                          </h2>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                                selectedModule.complexityScore >= 7
                                  ? "bg-danger/10 text-danger border-danger/20"
                                  : selectedModule.complexityScore >= 4
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : "bg-primary/10 text-primary border-primary/20"
                              }`}
                            >
                              Complexity: {selectedModule.complexityScore}/10
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground">
                              {selectedModule.loc} lines
                            </span>
                          </div>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground break-all">
                          {selectedModule.path}
                        </p>
                      </div>

                      {/* Grounded Summary */}
                      <div className="space-y-2">
                        <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-warning" />
                          Module Purpose & Analysis
                        </h4>
                        <div className="p-4 rounded-lg bg-secondary/40 border border-border text-sm font-sans text-foreground/90 leading-relaxed">
                          {selectedModule.summary ||
                            `Module ${selectedModule.name} implements ${selectedModule.loc} lines of code. It consumes ${selectedModule.importsCount} dependency modules and is imported by ${selectedModule.importedByCount} other modules.`}
                        </div>
                      </div>

                      {/* Dependency Topology */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Imported Modules */}
                        <div className="p-3.5 rounded-lg border border-border bg-secondary/20 space-y-2">
                          <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-accent" />
                            Imports ({selectedModule.importsCount})
                          </span>
                          {selectedModule.imports && selectedModule.imports.length > 0 ? (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {selectedModule.imports.map((imp) => (
                                <Link
                                  key={imp.id}
                                  href={`/repos/${repoId}/files?file=${encodeURIComponent(imp.path)}`}
                                  className="block font-mono text-[11px] text-muted-foreground hover:text-accent truncate transition-colors"
                                  title={imp.path}
                                >
                                  → {imp.path}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="font-mono text-[11px] text-muted-foreground italic">
                              Zero internal dependencies.
                            </p>
                          )}
                        </div>

                        {/* Dependents (Used By) */}
                        <div className="p-3.5 rounded-lg border border-border bg-secondary/20 space-y-2">
                          <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-accent" />
                            Imported By ({selectedModule.importedByCount})
                          </span>
                          {selectedModule.importedBy && selectedModule.importedBy.length > 0 ? (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {selectedModule.importedBy.map((by) => (
                                <Link
                                  key={by.id}
                                  href={`/repos/${repoId}/files?file=${encodeURIComponent(by.path)}`}
                                  className="block font-mono text-[11px] text-muted-foreground hover:text-accent truncate transition-colors"
                                  title={by.path}
                                >
                                  ← {by.path}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="font-mono text-[11px] text-muted-foreground italic">
                              Not imported by other modules (root or isolated).
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Links for Selected Module */}
                      <div className="pt-2 flex flex-wrap gap-2.5 border-t border-border/60">
                        <Link
                          href={`/repos/${repoId}/graph?highlight=${selectedModule.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors"
                        >
                          <Box className="w-3.5 h-3.5" />
                          Locate in 3D Graph
                        </Link>
                        <Link
                          href={`/repos/${repoId}/files?file=${encodeURIComponent(selectedModule.path)}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Open File
                        </Link>
                        <Link
                          href={`/repos/${repoId}/modules?module=${selectedModule.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
                        >
                          <Puzzle className="w-3.5 h-3.5" />
                          Module Inspector
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="py-20 text-center space-y-2">
                      <Puzzle className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                      <p className="font-mono text-sm text-muted-foreground">
                        Select a module from the list to view its grounded explanation.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
