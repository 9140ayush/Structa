"use client";

/**
 * app/(dashboard)/repos/[repoId]/explanation/page.tsx — Phase 11.5
 *
 * AI Repository Explanation — generates a human-readable understanding
 * of the repository via POST /api/repos/[repoId]/explain.
 *
 * Features:
 *  - Technical / Beginner mode toggle
 *  - Cached result display (with refresh option)
 *  - Markdown-like rendering of AI response
 *  - Clickable section links to other repo sections
 */

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle, RefreshCw, Code2, BookOpen, Box } from "lucide-react";

interface ExplPageProps {
  params: Promise<{ repoId: string }>;
}

interface ExplResponse {
  explanation: string;
  cached: boolean;
  mode: "technical" | "beginner";
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Simple markdown-ish renderer for the explanation
// ---------------------------------------------------------------------------

function renderExplanation(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      nodes.push(<div key={key++} className="h-3" />);
    } else if (trimmed.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="font-heading font-bold text-base text-foreground mt-5 mb-2">
          {trimmed.slice(3)}
        </h2>,
      );
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      nodes.push(
        <h3 key={key++} className="font-heading font-semibold text-sm text-foreground mt-4 mb-1.5">
          {trimmed.slice(2, -2)}
        </h3>,
      );
    } else if (trimmed.startsWith("- ")) {
      nodes.push(
        <li
          key={key++}
          className="font-sans text-sm text-foreground/90 leading-relaxed ml-4 list-disc"
        >
          {renderInline(trimmed.slice(2))}
        </li>,
      );
    } else {
      nodes.push(
        <p key={key++} className="font-sans text-sm text-foreground/90 leading-relaxed">
          {renderInline(trimmed)}
        </p>,
      );
    }
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExplanationPage({ params }: ExplPageProps) {
  const { repoId } = use(params);
  const [mode, setMode] = useState<"technical" | "beginner">("technical");
  const [result, setResult] = useState<ExplResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, forceRefresh }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate explanation.");
      }
      setResult(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount + mode change if not loading
  useEffect(() => {
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, mode]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              AI Repository Explanation
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Grounded in actual module analysis — no hallucinations
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setMode("technical")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                mode === "technical"
                  ? "bg-accent text-background shadow-sm"
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
                  ? "bg-accent text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Beginner
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="relative">
              <Sparkles className="w-10 h-10 text-warning opacity-20" />
              <Loader2 className="w-6 h-6 animate-spin text-accent absolute top-2 left-2" />
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              Generating AI explanation from module summaries…
            </p>
            <p className="font-mono text-xs text-muted-foreground">This may take 10–20 seconds</p>
          </motion.div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-xl border border-danger/30 bg-danger/5 space-y-3"
          >
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="font-mono text-sm font-semibold">{error}</p>
            </div>
            {error.includes("No AI summaries") && (
              <div className="font-mono text-xs text-muted-foreground space-y-1">
                <p>The explanation requires module summaries which are generated during sync.</p>
                <p>Go to the 3D Graph section and click Sync to generate them.</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => generate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
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

        {/* Result */}
        {!isLoading && result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Meta bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-warning" />
                {result.cached ? "Cached" : "Freshly generated"} ·{" "}
                {new Date(result.generatedAt).toLocaleDateString()} ·{" "}
                {result.mode === "beginner" ? "Beginner mode" : "Technical mode"}
              </span>
              <button
                onClick={() => generate(true)}
                disabled={isLoading}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {/* Explanation body */}
            <div className="p-6 rounded-xl border border-border bg-card/60 space-y-1">
              {renderExplanation(result.explanation)}
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap gap-2 pt-2">
              <p className="w-full font-mono text-[11px] text-muted-foreground">Explore further:</p>
              <Link
                href={`/repos/${repoId}/graph`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
              >
                <Box className="w-3 h-3 text-accent" /> 3D Graph
              </Link>
              <Link
                href={`/repos/${repoId}/files`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
              >
                File Explorer
              </Link>
              <Link
                href={`/repos/${repoId}/tech-stack`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
              >
                Tech Stack
              </Link>
              <Link
                href={`/repos/${repoId}/dependencies`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
              >
                Dependencies
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
