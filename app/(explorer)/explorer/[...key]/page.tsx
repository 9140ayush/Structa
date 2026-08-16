/**
 * app/(explorer)/explorer/[...key]/page.tsx — Catch-all page for exploring public repository import graphs, analytics, and snapshots.
 *
 * Layout mirrors the Workspace repository page shell for visual consistency.
 * Supports:
 * - /explorer/[owner]/[repo] -> 3D Dependency Graph Explorer
 * - /explorer/[owner]/[repo]/analytics -> Explorer Repository Analytics
 * - /explorer/[owner]/[repo]/snapshots -> Explorer Architecture Snapshots
 */
"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileCode,
  Folder,
  ArrowUpRight,
  ArrowDownLeft,
  Focus,
  Loader2,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  GitBranch,
  Search,
  Layers,
  Activity,
  ExternalLink,
  Flame,
  History,
  FileText,
  BarChart2,
  Users,
  Play,
  Eye,
  GitCommit,
} from "lucide-react";
import type { GraphPayload, GraphNode, GraphEdge } from "@/types/graph";
import { GraphCanvasWrapper } from "@/components/three/GraphCanvasWrapper";
import { GraphSkeleton } from "@/components/three/GraphSkeleton";
import { IndexingProgress } from "@/components/shared/IndexingProgress";
import { ChatPanel } from "@/components/chat/ChatPanel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResolvedRepoData {
  canonicalKey: string;
  graphPayload: GraphPayload;
  healthScore: number;
  repo: {
    id: string;
    name: string;
    fullName: string;
    owner: string;
    url: string;
    stars: number;
    language: string;
    description: string;
    isPrivate: boolean;
    defaultBranch: string;
    updatedAt: string;
  };
}

interface AnalyticsData {
  mostVisited: Array<{
    path: string;
    type: string;
    loc: number;
    complexityScore: number;
    visitCount: number;
  }>;
  timeline: Array<{
    author: string;
    avatarUrl: string;
    commitSha: string;
    message: string;
    timestamp: string;
    changes: string[];
  }>;
  contributors: Array<{
    name: string;
    commits: number;
    filesTouchedCount: number;
    avatarUrl: string;
    filesTouched: string[];
  }>;
}

interface SnapshotDiffResult {
  addedNodes: string[];
  removedNodes: GraphNode[];
  changedNodes: string[];
  unchangedNodes: string[];
  addedEdges: Array<{ fromPath: string; toPath: string }>;
  removedEdges: GraphEdge[];
}

interface PageProps {
  params: Promise<{ key: string[] }>;
}

// ---------------------------------------------------------------------------
// Explorer Analytics Sub-View Component
// ---------------------------------------------------------------------------
function ExplorerAnalyticsView({
  canonicalKey,
  owner,
  repo,
}: {
  canonicalKey: string;
  owner: string;
  repo: string;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/analytics/${encodeURIComponent(`${owner}:${repo}`)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to compile explorer analytics.");
        }
        setData(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to retrieve analytics.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [owner, repo]);

  return (
    <div className="relative w-full h-[calc(100vh-10rem)] min-h-[600px] flex flex-col bg-background overflow-hidden rounded-xl border border-border">
      {/* Header bar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/explorer/${canonicalKey}`}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Codebase Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-heading font-bold text-base text-foreground truncate">
            {owner}/{repo} — Explorer Analytics
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-y-auto p-6 lg:p-8">
        {isLoading ? (
          <div className="w-full h-96 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="font-mono text-xs text-muted-foreground">Compiling analytics report...</p>
          </div>
        ) : error || !data ? (
          <div className="max-w-md mx-auto p-6 rounded-xl border border-danger/20 bg-danger/5 text-center space-y-4">
            <p className="font-mono text-sm text-danger">{error || "No data available."}</p>
            <Link
              href={`/explorer/${canonicalKey}`}
              className="inline-block px-4 py-2 bg-secondary border border-border rounded-md font-mono text-xs hover:bg-secondary/80 text-foreground"
            >
              Return to Map
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Top row: Summary Cards / Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <Flame className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Total Collaborators
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {data.contributors?.length || 0}
                </h2>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Active developers contributing commits.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <History className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Analyzed Commits
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {data.timeline?.length || 0}
                </h2>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Recent architecture commits mapped onto modules.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-success">
                  <FileText className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Tracked Modules
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {data.mostVisited?.length || 0}
                </h2>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Modules registered with activity.
                </p>
              </div>
            </div>

            {/* Split layout: Heatmap / Visited modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Visited Modules */}
              <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <BarChart2 className="w-4 h-4 text-accent" />
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Most Visited / High Complexity Modules
                  </h3>
                </div>

                {data.mostVisited?.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                    Not enough activity data yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.mostVisited?.map((v, index) => (
                      <div
                        key={v.path}
                        className="p-3 rounded-lg border border-border/60 bg-card/30 flex items-center justify-between gap-4 font-mono text-xs"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-muted-foreground shrink-0">#{index + 1}</span>
                          <span className="text-foreground font-bold truncate block" title={v.path}>
                            {v.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted-foreground text-[10px]">{v.loc} LOC</span>
                          <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/20 text-accent font-bold">
                            {v.visitCount} visits
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contributor Heatmap / Stats */}
              <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Contributor Module Activity
                  </h3>
                </div>

                {data.contributors?.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                    No contributor activity available yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.contributors?.map((c) => (
                      <div
                        key={c.name}
                        className="p-3 rounded-lg border border-border/60 bg-card/30 space-y-2 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt={c.name}
                                className="w-5 h-5 rounded-full border border-border"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                                {c.name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-foreground">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-accent font-bold">{c.commits} commits</span>
                            <span className="text-muted-foreground">
                              ({c.filesTouchedCount} files)
                            </span>
                          </div>
                        </div>

                        {c.filesTouched.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {c.filesTouched.slice(0, 5).map((f) => (
                              <span
                                key={f}
                                className="px-1.5 py-0.5 rounded bg-secondary text-[9px] text-muted-foreground truncate max-w-[140px]"
                                title={f}
                              >
                                {f.split("/").pop()}
                              </span>
                            ))}
                            {c.filesTouched.length > 5 && (
                              <span className="text-[9px] text-muted-foreground self-center">
                                +{c.filesTouched.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Commits Timeline */}
            <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <History className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Architecture Commit Timeline
                </h3>
              </div>

              {data.timeline?.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                  No GitHub commit timeline recorded.
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {data.timeline?.map((item) => (
                    <div
                      key={item.commitSha}
                      className="p-3 rounded-lg border border-border/60 bg-card/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.author}
                            className="w-6 h-6 rounded-full border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {item.author.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-foreground font-bold block truncate">
                            {item.message}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            by {item.author} • {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-secondary border border-border font-bold">
                          {item.commitSha}
                        </span>
                        <span className="text-accent">{item.changes.length} files touched</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explorer Snapshots Sub-View Component
// ---------------------------------------------------------------------------
function ExplorerSnapshotsView({
  canonicalKey,
  owner,
  repo,
}: {
  canonicalKey: string;
  owner: string;
  repo: string;
}) {
  const [snapshots, setSnapshots] = useState<Array<{ commitSha: string; createdAt: string }>>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [fromSha, setFromSha] = useState("");
  const [toSha, setToSha] = useState("");

  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<SnapshotDiffResult | null>(null);
  const [diffGraphPayload, setDiffGraphPayload] = useState<GraphPayload | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSnapshots() {
      try {
        const res = await fetch(`/api/repos/${encodeURIComponent(`${owner}:${repo}`)}/snapshots`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load architecture snapshots.");
        }
        const snaps = json.data.snapshots || [];
        setSnapshots(snaps);

        if (snaps.length >= 2) {
          setToSha(snaps[0].commitSha);
          setFromSha(snaps[1].commitSha);
        } else if (snaps.length === 1) {
          setToSha(snaps[0].commitSha);
        }
      } catch (err: unknown) {
        setListError(err instanceof Error ? err.message : "Failed to load snapshots.");
      } finally {
        setIsLoadingList(false);
      }
    }
    loadSnapshots();
  }, [owner, repo]);

  const handleCompare = async () => {
    if (!fromSha || !toSha) {
      setCompareError("Please select both a base commit and a target commit.");
      return;
    }

    setIsComparing(true);
    setCompareError(null);
    try {
      const res = await fetch(
        `/api/repos/${encodeURIComponent(`${owner}:${repo}`)}/snapshots/diff?from=${fromSha}&to=${toSha}`,
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Snapshot comparison failed.");
      }

      const { diff, toGraph } = json.data;
      setDiffResult(diff);

      const addedSet = new Set<string>(diff.addedNodes || []);
      const changedSet = new Set<string>(diff.changedNodes || []);

      const formattedNodes = (toGraph.nodes || []).map((n: GraphNode) => {
        let diffStatus: "added" | "removed" | "changed" | "unchanged" = "unchanged";
        if (addedSet.has(n.id)) diffStatus = "added";
        else if (changedSet.has(n.id)) diffStatus = "changed";

        return {
          ...n,
          diffStatus,
        };
      });

      const formattedPayload: GraphPayload = {
        ...toGraph,
        nodes: formattedNodes,
      };

      setDiffGraphPayload(formattedPayload);
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-10rem)] min-h-[600px] flex flex-col bg-background overflow-hidden rounded-xl border border-border">
      {/* Header bar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/explorer/${canonicalKey}`}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Codebase Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-heading font-bold text-base text-foreground truncate">
              {owner}/{repo} — Architecture Snapshots
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border border-border bg-card/60 text-muted-foreground">
              <GitCommit className="w-3 h-3 text-accent" />
              {snapshots.length} Snapshots
            </span>
          </div>
        </div>

        {/* Snapshot Selector / Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs">
            <label className="text-muted-foreground">Base:</label>
            <select
              value={fromSha}
              onChange={(e) => setFromSha(e.target.value)}
              className="bg-card border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select SHA</option>
              {snapshots.map((s) => (
                <option key={`from-${s.commitSha}`} value={s.commitSha}>
                  {s.commitSha.slice(0, 7)} ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>

            <span className="text-muted-foreground">→</span>

            <label className="text-muted-foreground">Target:</label>
            <select
              value={toSha}
              onChange={(e) => setToSha(e.target.value)}
              className="bg-card border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select SHA</option>
              {snapshots.map((s) => (
                <option key={`to-${s.commitSha}`} value={s.commitSha}>
                  {s.commitSha.slice(0, 7)} ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {compareError && (
            <span className="hidden lg:inline text-xs font-mono text-danger">{compareError}</span>
          )}

          <button
            onClick={handleCompare}
            disabled={isComparing || !fromSha || !toSha}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/90 text-background font-mono text-xs font-bold uppercase transition-all disabled:opacity-50"
          >
            {isComparing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Compare Diff</span>
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {isLoadingList ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : listError ? (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="max-w-md p-6 rounded-xl border border-danger/20 bg-danger/5 text-center space-y-4">
              <p className="font-mono text-sm text-danger">{listError}</p>
            </div>
          </div>
        ) : diffGraphPayload ? (
          <div className="w-full h-full relative">
            <GraphCanvasWrapper
              data={diffGraphPayload}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onSelectNode={setSelectedNodeId}
              onHoverNode={setHoveredNodeId}
            />

            {/* Visual Diff Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-2xl font-mono text-[10px]">
              <span className="uppercase text-muted-foreground font-bold tracking-wider">
                Visual Diff Legend
              </span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3DDC97]" />
                <span className="text-foreground">
                  Added Modules ({diffResult?.addedNodes.length || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F2B84B]" />
                <span className="text-foreground">
                  Modified Modules ({diffResult?.changedNodes.length || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7C9CFF]" />
                <span className="text-foreground">
                  Unchanged Modules ({diffResult?.unchangedNodes.length || 0})
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-accent">
              <Eye className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-heading font-bold text-sm text-foreground">
                Select Commits to Visual Diff
              </h3>
              <p className="text-muted-foreground font-mono text-xs">
                Select a base and target commit from the header selectors above to generate a 3D
                architecture visual diff.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RepositoryExplorerPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const keyArray = unwrappedParams?.key || [];

  const owner = keyArray[0] || "";
  const repo = keyArray[1] || "";
  const subView = keyArray[2] || ""; // "analytics" | "snapshots" | ""
  const canonicalKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

  // State Management
  const [indexStatus, setIndexStatus] = useState<
    "not_indexed" | "indexing" | "indexed" | "failed" | null
  >(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState<ResolvedRepoData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 3D Graph Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Toolbar / panel controls
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showComplexityHeatmap, setShowComplexityHeatmap] = useState(false);
  const [showCircularDeps, setShowCircularDeps] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Core Status verification & Polling
  const checkStatusAndLoad = useCallback(async () => {
    if (!owner || !repo) {
      setErrorText("Invalid repository key format. Expected owner/repo.");
      return;
    }

    try {
      const statusRes = await fetch(`/api/explorer/status/${canonicalKey}`);
      const statusJson = await statusRes.json();

      if (!statusRes.ok || !statusJson.success) {
        throw new Error(statusJson.error || "Failed to load index status.");
      }

      const status = statusJson.data.indexStatus;
      setIndexStatus(status);

      if (status === "indexed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        setIsLoadingDetails(true);
        const repoRes = await fetch(`/api/explorer/repo/${canonicalKey}`);
        const repoJson = await repoRes.json();
        setIsLoadingDetails(false);

        if (repoRes.ok && repoJson.success) {
          setActiveRepo(repoJson.data);
          setErrorText(null);
        } else {
          setErrorText(repoJson.error || "Failed to fetch repository graph.");
        }
      } else if (status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setErrorText(statusJson.data.error || "Ingestion and indexing failed.");
      } else {
        if (status === "not_indexed" && !pollIntervalRef.current) {
          await fetch("/api/explorer/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urlOrShorthand: canonicalKey }),
          });
        }

        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(async () => {
            try {
              const pollRes = await fetch(`/api/explorer/status/${canonicalKey}`);
              const pollJson = await pollRes.json();

              if (pollRes.ok && pollJson.success) {
                const pollStatus = pollJson.data.indexStatus;
                setIndexStatus(pollStatus);

                if (pollStatus === "indexed") {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;

                  setIsLoadingDetails(true);
                  const detailRes = await fetch(`/api/explorer/repo/${canonicalKey}`);
                  const detailJson = await detailRes.json();
                  setIsLoadingDetails(false);

                  if (detailRes.ok && detailJson.success) {
                    setActiveRepo(detailJson.data);
                    setErrorText(null);
                  } else {
                    setErrorText(detailJson.error || "Failed to load indexed graph.");
                  }
                } else if (pollStatus === "failed") {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                  setErrorText(pollJson.data.error || "Indexing failed.");
                }
              }
            } catch (pollErr) {
              console.error("Error in polling tick:", pollErr);
            }
          }, 2000);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorText((err as Error).message || "Failed to verify repository index status.");
    }
  }, [owner, repo, canonicalKey]);

  useEffect(() => {
    Promise.resolve().then(() => {
      checkStatusAndLoad();
    });

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkStatusAndLoad]);

  const handleRetry = async () => {
    setErrorText(null);
    setIndexStatus("indexing");

    try {
      const res = await fetch("/api/explorer/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlOrShorthand: canonicalKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to trigger indexing.");
      }
      checkStatusAndLoad();
    } catch (err: unknown) {
      setErrorText((err as Error).message || "Retry failed to start.");
      setIndexStatus("failed");
    }
  };

  const searchHighlightNodeId = useMemo(() => {
    if (!searchQuery.trim() || !activeRepo) return null;
    const q = searchQuery.toLowerCase();
    const match = activeRepo.graphPayload.nodes.find(
      (n) => n.path.toLowerCase().includes(q) || n.name.toLowerCase().includes(q),
    );
    return match?.id ?? null;
  }, [searchQuery, activeRepo]);

  const effectiveSelectedNodeId = selectedNodeId ?? searchHighlightNodeId;

  const selectedNode = useMemo(() => {
    if (!effectiveSelectedNodeId || !activeRepo) return null;
    return activeRepo.graphPayload.nodes.find((n) => n.id === effectiveSelectedNodeId) ?? null;
  }, [effectiveSelectedNodeId, activeRepo]);

  const selectedNodeConnections = useMemo(() => {
    if (!effectiveSelectedNodeId || !activeRepo) return { imports: [], importedBy: [] };

    const imports: GraphEdge[] = [];
    const importedBy: GraphEdge[] = [];

    for (const edge of activeRepo.graphPayload.edges) {
      if (edge.from === effectiveSelectedNodeId) imports.push(edge);
      if (edge.to === effectiveSelectedNodeId) importedBy.push(edge);
    }

    return { imports, importedBy };
  }, [effectiveSelectedNodeId, activeRepo]);

  // Handle Sub-Views (Analytics & Snapshots)
  if (subView === "analytics") {
    return <ExplorerAnalyticsView canonicalKey={canonicalKey} owner={owner} repo={repo} />;
  }

  if (subView === "snapshots") {
    return <ExplorerSnapshotsView canonicalKey={canonicalKey} owner={owner} repo={repo} />;
  }

  // ---------------------------------------------------------------------------
  // Loading / Indexing State
  // ---------------------------------------------------------------------------

  if (
    indexStatus === null ||
    indexStatus === "indexing" ||
    indexStatus === "not_indexed" ||
    isLoadingDetails
  ) {
    return (
      <div className="w-full h-[calc(100vh-10rem)] min-h-[600px] p-6 flex flex-col items-center justify-center relative bg-background overflow-hidden rounded-xl border border-border">
        <GraphSkeleton />
        <div className="absolute top-[35%] w-full flex justify-center z-10 px-4">
          <IndexingProgress status={indexStatus || "not_indexed"} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Failed State
  // ---------------------------------------------------------------------------

  if (indexStatus === "failed" || errorText) {
    return (
      <div className="w-full h-[calc(100vh-10rem)] min-h-[600px] flex flex-col items-center justify-center p-8 relative bg-background overflow-hidden rounded-xl border border-border">
        <div className="max-w-md w-full p-6 rounded-xl border border-border bg-surface-elevated/70 backdrop-blur-md text-center space-y-6 shadow-2xl z-10">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto text-danger">
            <X className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-foreground">
              Analysis Unsuccessful
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
              {
                "We couldn't analyze this repository. The repository may have changed or contains no JS/TS files."
              }
            </p>
          </div>

          {errorText && (
            <div className="p-3 rounded-lg bg-danger/5 border border-danger/10 text-left font-mono text-[10px] text-danger max-h-32 overflow-y-auto break-all">
              {errorText}
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/explorer"
              className="px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 font-mono text-[10px] text-foreground transition-all"
            >
              Back to Explorer
            </Link>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-background font-mono text-[10px] font-bold uppercase transition-all shadow-glow-accent"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeRepo) {
    return (
      <div className="w-full h-[calc(100vh-10rem)] min-h-[600px] flex items-center justify-center bg-background rounded-xl border border-border">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main View — mirrors Workspace repository page layout exactly
  // ---------------------------------------------------------------------------

  return (
    <div className="relative w-full h-[calc(100vh-10rem)] min-h-[600px] flex flex-col bg-background overflow-hidden rounded-xl border border-border">
      {/* Top Controls Header Bar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back to Explorer + Repo Name + Module Count */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/explorer"
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Explorer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-heading font-bold text-base text-foreground truncate">
              {activeRepo.repo.name}
            </h1>

            {activeRepo.graphPayload?.lod && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border border-border bg-card/60 text-muted-foreground">
                <Layers className="w-3 h-3 text-accent" />
                {activeRepo.graphPayload.lod.totalNodes} Modules
              </span>
            )}
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="hidden md:flex items-center relative w-72">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules by path..."
            className="w-full pl-9 pr-8 py-1.5 rounded-md border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Analytics + Snapshots + Branch + Ask Codebase */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/explorer/${canonicalKey}/analytics`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          <Link
            href={`/explorer/${canonicalKey}/snapshots`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Snapshots</span>
          </Link>

          <a
            href={activeRepo.repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors"
            title={`Open ${activeRepo.canonicalKey} on GitHub`}
          >
            <GitBranch className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">{activeRepo.repo.defaultBranch}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-xs transition-colors ${
              isChatOpen
                ? "bg-accent/15 border-accent/40 text-accent"
                : "border-border bg-secondary hover:bg-secondary/80 text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Codebase</span>
          </button>
        </div>
      </header>

      {/* Main 3D Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <div className="w-full h-full relative">
          <GraphCanvasWrapper
            data={activeRepo.graphPayload}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={setSelectedNodeId}
            onHoverNode={setHoveredNodeId}
            showComplexityHeatmap={showComplexityHeatmap}
            showCircularDeps={showCircularDeps}
          />

          {/* Floating Graph Controls Panel */}
          <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-2xl font-mono text-xs max-w-xs">
            <span className="text-[10px] uppercase text-muted-foreground block font-bold mb-1 tracking-wider">
              Graph Controls
            </span>

            <label className="flex items-center justify-between gap-4 cursor-pointer py-1 text-foreground hover:text-accent select-none">
              <span>Complexity Heatmap</span>
              <input
                type="checkbox"
                checked={showComplexityHeatmap}
                onChange={(e) => setShowComplexityHeatmap(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent bg-background w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer py-1 text-foreground hover:text-accent select-none">
              <span>Circular Dependencies</span>
              <input
                type="checkbox"
                checked={showCircularDeps}
                onChange={(e) => setShowCircularDeps(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent bg-background w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* LOD Info Toast */}
          {activeRepo.graphPayload.lod.isLODActive && (
            <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-md border border-warning/30 bg-surface/90 backdrop-blur-md text-[11px] font-mono text-warning flex items-center gap-2 shadow-md">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>
                Large codebase ({activeRepo.graphPayload.lod.totalNodes} modules) — LOD detail
                reduction active.
              </span>
            </div>
          )}
        </div>

        {/* Selected Node Sidebar Drawer */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 border-l border-border bg-surface/95 backdrop-blur-xl p-6 z-20 shadow-2xl flex flex-col overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 border-b border-border pb-4 mb-5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded bg-secondary border border-border shrink-0 text-accent">
                    {selectedNode.kind === "folder" ? (
                      <Folder className="w-5 h-5" />
                    ) : (
                      <FileCode className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading font-semibold text-base text-foreground truncate">
                      {selectedNode.name}
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      {selectedNode.kind}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
                <div className="p-3 rounded-md bg-card/60 border border-border">
                  <span className="text-muted-foreground text-[10px] uppercase block mb-1">
                    Lines of Code
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {selectedNode.kind === "folder" ? "N/A" : selectedNode.loc}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-card/60 border border-border">
                  <span className="text-muted-foreground text-[10px] uppercase block mb-1">
                    Complexity Score
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{
                      color:
                        selectedNode.complexityScore >= 7
                          ? "#F0576B"
                          : selectedNode.complexityScore >= 4
                            ? "#F2B84B"
                            : "#3DDC97",
                    }}
                  >
                    {selectedNode.complexityScore}/10
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px] uppercase text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>AI Technical Summary</span>
                </div>
                <div className="p-3.5 rounded-lg bg-secondary/40 border border-border text-xs text-foreground leading-relaxed">
                  {selectedNode.summary || (
                    <span className="text-muted-foreground italic">No AI summary generated.</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block mb-1.5">
                  File Path
                </span>
                <code className="block p-2 rounded bg-card/85 border border-border font-mono text-[10px] text-foreground break-all leading-normal">
                  {selectedNode.path}
                </code>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2 font-mono text-xs font-semibold text-foreground">
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                  <span>Imports ({selectedNodeConnections.imports.length})</span>
                </div>

                {selectedNodeConnections.imports.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground italic pl-1">
                    No outgoing module imports.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNodeConnections.imports.map((edge) => (
                      <li key={edge.id}>
                        <button
                          onClick={() => setSelectedNodeId(edge.to)}
                          className="w-full text-left p-2 rounded border border-border bg-card/40 hover:bg-secondary hover:border-accent/50 transition-colors flex items-center justify-between font-mono text-[10px] text-foreground group"
                        >
                          <span className="truncate">{edge.toPath}</span>
                          <Focus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent shrink-0 ml-2" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2 font-mono text-xs font-semibold text-foreground">
                  <ArrowDownLeft className="w-4 h-4 text-primary" />
                  <span>Imported By ({selectedNodeConnections.importedBy.length})</span>
                </div>

                {selectedNodeConnections.importedBy.length === 0 ? (
                  <p className="font-mono text-[11px] text-muted-foreground italic pl-1">
                    No incoming dependent modules.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNodeConnections.importedBy.map((edge) => (
                      <li key={edge.id}>
                        <button
                          onClick={() => setSelectedNodeId(edge.from)}
                          className="w-full text-left p-2 rounded border border-border bg-card/40 hover:bg-secondary hover:border-primary/50 transition-colors flex items-center justify-between font-mono text-[10px] text-foreground group"
                        >
                          <span className="truncate">{edge.fromPath}</span>
                          <Focus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Grounded Codebase ChatPanel */}
        <AnimatePresence>
          {isChatOpen && (
            <div className="absolute inset-y-0 right-0 w-80 sm:w-96 z-30 shadow-2xl flex">
              <ChatPanel
                repoId={canonicalKey}
                repoName={activeRepo.repo.name}
                onCitationClick={(modulePath) => {
                  const found = activeRepo.graphPayload.nodes.find((n) => n.path === modulePath);
                  if (found) setSelectedNodeId(found.id);
                }}
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
