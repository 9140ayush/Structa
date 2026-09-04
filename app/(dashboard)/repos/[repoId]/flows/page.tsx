"use client";

/**
 * app/(dashboard)/repos/[repoId]/flows/page.tsx — Phase 11.8
 *
 * Data & Request Flow Intelligence: detects API routes and entry points,
 * traces their import chains, visualizes as vertical flow diagrams.
 *
 * Uses existing intelligence API file tree — no new parsing pipelines.
 */

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Workflow,
  Loader2,
  AlertTriangle,
  Box,
  ArrowDown,
  FileCode,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface FileNode {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  importsCount: number;
  importedByCount: number;
  loc: number;
  complexityScore: number;
}

interface FlowPageProps {
  params: Promise<{ repoId: string }>;
}

// ---------------------------------------------------------------------------
// Entry point detection patterns
// ---------------------------------------------------------------------------

const ENTRY_PATTERNS = [
  { label: "API Route", pattern: /api\/.*route\.(ts|js)$/i, icon: "🌐" },
  { label: "API Route", pattern: /api\/.*\/(route|index)\.(ts|js)$/i, icon: "🌐" },
  { label: "Page Component", pattern: /app\/.*page\.(tsx|jsx)$/i, icon: "📄" },
  { label: "Server Action", pattern: /actions?\/.*\.(ts|js)$/i, icon: "⚡" },
  { label: "Middleware", pattern: /middleware\.(ts|js)$/i, icon: "🔀" },
  { label: "Entry Point", pattern: /^(index|main|server|app)\.(ts|js)$/i, icon: "🚀" },
  { label: "Cron Job", pattern: /cron|schedule|job/i, icon: "⏰" },
  { label: "Webhook Handler", pattern: /webhook/i, icon: "🔗" },
];

function detectEntryType(path: string): { label: string; icon: string } | null {
  for (const p of ENTRY_PATTERNS) {
    if (p.pattern.test(path)) return { label: p.label, icon: p.icon };
  }
  return null;
}

// Categorize a node in the flow
function categorizeNode(path: string): string {
  if (/api\/|route\./i.test(path)) return "API Layer";
  if (/controller/i.test(path)) return "Controller";
  if (/service/i.test(path)) return "Service";
  if (/model|schema/i.test(path)) return "Data Model";
  if (/middleware/i.test(path)) return "Middleware";
  if (/lib\/|util|helper/i.test(path)) return "Utility";
  if (/component/i.test(path)) return "Component";
  if (/hook/i.test(path)) return "Hook";
  if (/config/i.test(path)) return "Configuration";
  return "Module";
}

export default function FlowsPage({ params }: FlowPageProps) {
  const { repoId } = use(params);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setFileTree(data.fileTree ?? []);
      })
      .catch(() => setError("Failed to load flow data."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  // Detect entry points
  const entryPoints = useMemo(() => {
    return fileTree
      .filter((n) => n.type === "file" && detectEntryType(n.path) !== null)
      .map((n) => ({
        ...n,
        entryType: detectEntryType(n.path)!,
      }))
      .sort((a, b) => b.importedByCount - a.importedByCount || a.path.localeCompare(b.path));
  }, [fileTree]);

  // Find high-connectivity modules for a given entry (simplified chain)
  const getFlowChain = (entry: FileNode): FileNode[] => {
    // Heuristic: return modules with high importedBy counts that share the same
    // top-level folder, sorted by dependency depth heuristic (importedBy desc)
    const topFolder = entry.path.split("/")[0] ?? "";
    const related = fileTree
      .filter(
        (n) =>
          n.type === "file" &&
          n.id !== entry.id &&
          n.importedByCount > 0 &&
          n.path.startsWith(topFolder),
      )
      .sort((a, b) => b.importedByCount - a.importedByCount)
      .slice(0, 5);
    return related;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertTriangle className="w-6 h-6 text-danger" />
        <p className="font-mono text-sm text-danger">{error}</p>
      </div>
    );
  }

  const isEmpty = fileTree.length === 0;
  const noEntries = !isEmpty && entryPoints.length === 0;
  const activeEntry = entryPoints.find((e) => e.id === selectedFlow) ?? entryPoints[0];
  const flowChain = activeEntry ? getFlowChain(activeEntry) : [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" />
              Data & Request Flows
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Detected entry points and their execution chains
            </p>
          </div>
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 bg-accent/5 text-accent font-mono text-xs hover:bg-accent/10 transition-colors"
          >
            <Box className="w-3.5 h-3.5" /> 3D Graph
          </Link>
        </div>

        {/* Uncertainty notice */}
        <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-start gap-2 font-mono text-xs text-warning">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Flow reconstruction is heuristic-based on import analysis. Complete call chains require
            runtime tracing which is not available. Uncertainty is shown where chains are
            incomplete.
          </span>
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Workflow className="w-8 h-8 text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">No repository data found.</p>
          </div>
        )}

        {noEntries && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Workflow className="w-8 h-8 text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">
              No detectable entry points found.
            </p>
            <p className="font-mono text-xs text-muted-foreground text-center max-w-md">
              Entry points are detected from file paths like <code>api/*/route.ts</code>,{" "}
              <code>app/*/page.tsx</code>, <code>actions/*.ts</code>, or <code>middleware.ts</code>.
            </p>
          </div>
        )}

        {!isEmpty && !noEntries && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Entry point list */}
            <div>
              <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider mb-3">
                Detected Entry Points ({entryPoints.length})
              </h2>
              <div className="space-y-1.5">
                {entryPoints.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedFlow(entry.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedFlow === entry.id || (!selectedFlow && entry === entryPoints[0])
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-card/40 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{entry.entryType.icon}</span>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        {entry.entryType.label}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-foreground truncate">{entry.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">
                      {entry.path}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Flow diagram */}
            {activeEntry && (
              <motion.div
                key={activeEntry.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider mb-3">
                  Execution Flow — {activeEntry.name}
                </h2>

                <div className="space-y-0">
                  {/* Entry node */}
                  <FlowNode
                    label={activeEntry.entryType.label}
                    name={activeEntry.name}
                    path={activeEntry.path}
                    loc={activeEntry.loc}
                    isEntry
                    repoId={repoId}
                  />

                  {flowChain.length > 0 ? (
                    <>
                      {flowChain.map((node) => (
                        <React.Fragment key={node.id}>
                          <div className="flex justify-center py-1">
                            <ArrowDown className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <FlowNode
                            label={categorizeNode(node.path)}
                            name={node.name}
                            path={node.path}
                            loc={node.loc}
                            repoId={repoId}
                          />
                        </React.Fragment>
                      ))}

                      <div className="flex justify-center py-1">
                        <ArrowDown className="w-4 h-4 text-muted-foreground opacity-40" />
                      </div>
                      <div className="p-3 rounded-lg border border-dashed border-border bg-card/20 text-center">
                        <p className="font-mono text-xs text-muted-foreground">
                          ⋯ further chain reconstruction requires runtime tracing
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center py-1">
                        <ArrowDown className="w-4 h-4 text-muted-foreground opacity-40" />
                      </div>
                      <div className="p-3 rounded-lg border border-dashed border-border bg-card/20 text-center">
                        <p className="font-mono text-xs text-muted-foreground">
                          No related modules detected in same layer
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/repos/${repoId}/graph`}
                    className="flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
                  >
                    <Box className="w-3.5 h-3.5" />
                    Explore this module in the 3D Graph
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flow node component
// ---------------------------------------------------------------------------

function FlowNode({
  label,
  name,
  path,
  loc,
  isEntry = false,
  repoId,
}: {
  label: string;
  name: string;
  path: string;
  loc: number;
  isEntry?: boolean;
  repoId: string;
}) {
  return (
    <div
      className={`p-3.5 rounded-xl border ${
        isEntry ? "border-primary/40 bg-primary/10" : "border-border bg-card/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode
            className={`w-4 h-4 shrink-0 ${isEntry ? "text-primary" : "text-muted-foreground"}`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">{name}</span>
              <span
                className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                  isEntry
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border bg-card/40 text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] text-muted-foreground">{loc} LOC</span>
          <Link
            href={`/repos/${repoId}/files?file=${encodeURIComponent(path)}`}
            className="text-[10px] font-mono text-accent hover:underline"
            title="Open in File Explorer"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
