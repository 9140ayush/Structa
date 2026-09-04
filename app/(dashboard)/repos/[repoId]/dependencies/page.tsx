"use client";

/**
 * app/(dashboard)/repos/[repoId]/dependencies/page.tsx — Phase 11.9
 *
 * Dependency Intelligence: turns the raw import graph into actionable insights.
 * Shows most connected, most depended-on, isolated, and circular dependencies.
 */

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Link2,
  Loader2,
  AlertTriangle,
  Box,
  ArrowUpRight,
  ArrowDownLeft,
  Minus,
  AlertCircle,
  Trophy,
  Zap,
  Eye,
} from "lucide-react";

interface FileNodeDep {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  importsCount: number;
  importedByCount: number;
  complexityScore: number;
  loc: number;
}

interface CircularDep {
  path: string[];
}

interface DepPageProps {
  params: Promise<{ repoId: string }>;
}

interface IntelligenceData {
  topImportedModules: FileNodeDep[];
  topImporterModules: FileNodeDep[];
  isolatedModules: FileNodeDep[];
  circularDependencies: { count: number; examples: CircularDep[] };
  fileTree: FileNodeDep[];
}

// ---------------------------------------------------------------------------
// Insight card row
// ---------------------------------------------------------------------------

function CouplingRow({
  rank,
  node,
  metric,
  metricLabel,
  icon: Icon,
  color,
  repoId,
}: {
  rank: number;
  node: { id: string; path: string; name: string };
  metric: number;
  metricLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  repoId: string;
}) {
  const couplingWidth = Math.min((metric / 20) * 100, 100);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/40 hover:bg-secondary transition-colors group">
      <span className="font-mono text-xs text-muted-foreground w-6 text-center shrink-0">
        {rank}.
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-foreground truncate" title={node.path}>
          {node.path}
        </p>
        <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden w-24">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${couplingWidth}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Icon className={`w-3.5 h-3.5 ${color.replace("bg-", "text-")}`} />
        <span className={`font-mono text-sm font-bold ${color.replace("bg-", "text-")}`}>
          {metric}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{metricLabel}</span>
      </div>
      <Link
        href={`/repos/${repoId}/graph`}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        title="View in 3D Graph"
      >
        <Box className="w-3.5 h-3.5 text-accent" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DependenciesPage({ params }: DepPageProps) {
  const { repoId } = use(params);
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "depended-on" | "most-imports" | "isolated" | "circular"
  >("depended-on");

  useEffect(() => {
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load dependency data."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  // Stats summary
  const stats = useMemo(() => {
    if (!data) return null;
    const fileNodes = data.fileTree.filter((n) => n.type === "file");
    const totalEdges = fileNodes.reduce((s, n) => s + n.importsCount, 0);
    const avgConnections = fileNodes.length > 0 ? totalEdges / fileNodes.length : 0;
    return {
      totalEdges,
      avgConnections: avgConnections.toFixed(1),
      isolatedCount: data.isolatedModules.length,
      circularCount: data.circularDependencies.count,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertTriangle className="w-6 h-6 text-danger" />
        <p className="font-mono text-sm text-danger">{error ?? "Failed to load data."}</p>
      </div>
    );
  }

  const TABS = [
    { id: "depended-on" as const, label: "Most Depended-On", icon: Trophy },
    { id: "most-imports" as const, label: "Most Imports", icon: Zap },
    { id: "isolated" as const, label: "Isolated", icon: Eye },
    {
      id: "circular" as const,
      label: "Circular",
      icon: AlertCircle,
      danger: data.circularDependencies.count > 0,
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5 text-warning" />
              Dependency Intelligence
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Understand coupling, connectivity, and architectural relationships
            </p>
          </div>
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 bg-accent/5 text-accent font-mono text-xs hover:bg-accent/10 transition-colors"
          >
            <Box className="w-3.5 h-3.5" /> 3D Graph
          </Link>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Edges", value: stats.totalEdges, icon: Link2, color: "text-accent" },
              {
                label: "Avg Connections",
                value: stats.avgConnections,
                icon: Zap,
                color: "text-primary",
              },
              {
                label: "Isolated Modules",
                value: stats.isolatedCount,
                icon: Eye,
                color: "text-warning",
              },
              {
                label: "Circular Deps",
                value: stats.circularCount,
                icon: AlertCircle,
                color: stats.circularCount > 0 ? "text-danger" : "text-info",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="p-4 rounded-xl border border-border bg-card/60 text-center"
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                <p className={`font-heading font-bold text-xl ${color}`}>{value}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 flex-wrap border-b border-border">
          {TABS.map(({ id, label, icon: Icon, danger }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? danger
                    ? "text-danger border-danger"
                    : "text-accent border-accent"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === "circular" && data.circularDependencies.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-danger/10 text-danger text-[9px] border border-danger/20">
                  {data.circularDependencies.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {activeTab === "depended-on" && (
            <div className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground mb-3">
                Modules that many other modules import — high impact on the codebase.
              </p>
              {data.topImportedModules.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground italic">
                  No dependency data yet.
                </p>
              ) : (
                data.topImportedModules.map((node, i) => (
                  <CouplingRow
                    key={node.id}
                    rank={i + 1}
                    node={node}
                    metric={node.importedByCount}
                    metricLabel="dependents"
                    icon={ArrowDownLeft}
                    color="bg-primary"
                    repoId={repoId}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "most-imports" && (
            <div className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground mb-3">
                Modules that import the most others — potentially high coupling risk.
              </p>
              {data.topImporterModules.length === 0 ? (
                <p className="font-mono text-sm text-muted-foreground italic">
                  No dependency data yet.
                </p>
              ) : (
                data.topImporterModules.map((node, i) => (
                  <CouplingRow
                    key={node.id}
                    rank={i + 1}
                    node={node}
                    metric={node.importsCount}
                    metricLabel="imports"
                    icon={ArrowUpRight}
                    color="bg-warning"
                    repoId={repoId}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "isolated" && (
            <div className="space-y-2">
              <p className="font-mono text-xs text-muted-foreground mb-3">
                Files with no imports and no dependents — potentially unused or standalone
                utilities.
              </p>
              {data.isolatedModules.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg border border-info/30 bg-info/5 font-mono text-sm text-info">
                  <Minus className="w-4 h-4 shrink-0" />
                  No isolated modules detected — good connectivity.
                </div>
              ) : (
                data.isolatedModules.map((node, i) => (
                  <CouplingRow
                    key={node.id}
                    rank={i + 1}
                    node={node}
                    metric={node.loc}
                    metricLabel="LOC"
                    icon={Eye}
                    color="bg-warning"
                    repoId={repoId}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "circular" && (
            <div className="space-y-3">
              <p className="font-mono text-xs text-muted-foreground mb-3">
                Import cycles can cause initialization issues and complicate testing.
              </p>
              {data.circularDependencies.count === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg border border-info/30 bg-info/5 font-mono text-sm text-info">
                  ✓ No circular dependencies detected.
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg border border-danger/30 bg-danger/5 font-mono text-xs text-danger">
                    {data.circularDependencies.count} circular dependenc
                    {data.circularDependencies.count === 1 ? "y" : "ies"} detected. Enable
                    &ldquo;Circular Dependencies&rdquo; overlay in the 3D Graph to visualize.
                  </div>
                  {data.circularDependencies.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-danger/20 bg-card/60 space-y-2"
                    >
                      <p className="font-mono text-xs font-semibold text-danger">Cycle {i + 1}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ex.path.map((p, pi) => (
                          <React.Fragment key={pi}>
                            <code className="font-mono text-[11px] px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger">
                              {p.split("/").pop()}
                            </code>
                            {pi < ex.path.length - 1 && (
                              <ArrowUpRight className="w-3.5 h-3.5 text-danger/60 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    href={`/repos/${repoId}/graph`}
                    className="flex items-center gap-2 font-mono text-xs text-accent hover:underline"
                  >
                    <Box className="w-3.5 h-3.5" />
                    Visualize cycles in the 3D Graph (enable &ldquo;Circular Dependencies&rdquo;
                    toggle)
                  </Link>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
