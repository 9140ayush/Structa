"use client";

/**
 * app/(dashboard)/repos/[repoId]/graph/page.tsx
 *
 * The 3D Dependency Graph — Structa's PRIMARY visual experience.
 *
 * This is the existing RepoMapPage, relocated to its own sub-route
 * as part of Phase 11.1 (Unified Navigation).
 *
 * CRITICAL: The 3D graph components (DependencyGraphScene, Node, Edge,
 * GraphCanvasWrapper) are NOT modified. Only the surrounding shell
 * (header toolbar, URL) has changed.
 *
 * What changed from the original page.tsx:
 *  - Removed the full header (back button, repo name) — now in layout.tsx
 *  - Retains: search, sync, chat, analytics/snapshots, complexity toggles
 *  - Height calculation adjusted to account for the new layout context bar + tab bar
 */

import React, { useState, use, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  X,
  FileCode,
  Folder,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Focus,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useGraphData } from "@/hooks/use-graph-data";
import { GraphCanvasWrapper } from "@/components/three/GraphCanvasWrapper";
import dynamic from "next/dynamic";

// Dynamically import ChatPanel (code-split — Architecture.md §9)
const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((m) => ({ default: m.ChatPanel })),
  { ssr: false, loading: () => null },
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GraphPageProps {
  params: Promise<{ repoId: string }>;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function GraphPage({ params }: GraphPageProps) {
  const { repoId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    data,
    isLoading,
    error,
    selectedNodeId,
    hoveredNodeId,
    selectedNode,
    selectedNodeConnections,
    searchQuery,
    setSelectedNodeId,
    setHoveredNodeId,
    setSearchQuery,
    refetch,
  } = useGraphData(repoId);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Phase 8 visual toggles
  const [showComplexityHeatmap, setShowComplexityHeatmap] = useState(false);
  const [showCircularDeps, setShowCircularDeps] = useState(false);

  // Annotations state
  const [annotations, setAnnotations] = useState<
    Array<{ _id: string; content: string; createdAt: string }>
  >([]);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  const [annotationInput, setAnnotationInput] = useState("");
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [annotationError, setAnnotationError] = useState<string | null>(null);
  const [annotatedNodeIds, setAnnotatedNodeIds] = useState<Set<string>>(new Set());

  // Handle citation click navigation from chat: ?highlight=path
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight && data?.nodes) {
      const node = data.nodes.find((n) => n.path === highlight);
      if (node) {
        setSelectedNodeId(node.id);
        router.replace(`/repos/${repoId}/graph`, { scroll: false });
      }
    }
  }, [searchParams, data, repoId, setSelectedNodeId, router]);

  // Log module visits
  useEffect(() => {
    if (selectedNodeId && selectedNode) {
      void fetch(`/api/analytics/${repoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: selectedNodeId }),
      }).catch((err) => console.warn("[visit-log] Failed to log visit:", err));
    }
  }, [selectedNodeId, selectedNode, repoId]);

  // Fetch all annotated node IDs
  const fetchAnnotatedNodes = useCallback(async () => {
    try {
      const res = await fetch(`/api/annotations?repositoryId=${repoId}`);
      const json = await res.json();
      if (json.success) {
        const ids = new Set<string>(
          (json.data.annotations || []).map((a: { moduleId: string }) => a.moduleId),
        );
        setAnnotatedNodeIds(ids);
      }
    } catch (err) {
      console.error("[annotations-badge] Failed to fetch annotated nodes:", err);
    }
  }, [repoId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAnnotatedNodes();
    });
  }, [fetchAnnotatedNodes, selectedNodeId]);

  // Fetch specific module annotations when drawer is open
  useEffect(() => {
    if (selectedNodeId) {
      Promise.resolve().then(() => {
        setIsLoadingAnnotations(true);
        setAnnotationError(null);
      });
      fetch(`/api/annotations?repositoryId=${repoId}&moduleId=${selectedNodeId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setAnnotations(json.data.annotations || []);
          } else {
            setAnnotationError(json.error || "Failed to load annotations.");
          }
        })
        .catch((err) => {
          console.error(err);
          setAnnotationError("Network error loading annotations.");
        })
        .finally(() => setIsLoadingAnnotations(false));
    } else {
      Promise.resolve().then(() => {
        setAnnotations([]);
      });
    }
  }, [selectedNodeId, repoId]);

  // Add Annotation
  const handleAddAnnotation = async () => {
    if (!annotationInput.trim() || !selectedNodeId) return;
    setIsSavingAnnotation(true);
    setAnnotationError(null);
    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: repoId,
          moduleId: selectedNodeId,
          content: annotationInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save annotation.");
      }
      setAnnotations((prev) => [json.data, ...prev]);
      setAnnotationInput("");
      fetchAnnotatedNodes();
    } catch (err: unknown) {
      setAnnotationError((err as Error).message);
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  // Delete Annotation
  const handleDeleteAnnotation = async (annId: string) => {
    try {
      const res = await fetch(`/api/annotations/${annId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete annotation.");
      }
      setAnnotations((prev) => prev.filter((a) => a._id !== annId));
      fetchAnnotatedNodes();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Memoize cycle data
  const cycleNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!data?.cycles) return set;
    for (const cycle of data.cycles) {
      for (const nodeId of cycle.nodes) {
        set.add(nodeId);
      }
    }
    return set;
  }, [data]);

  const cycleEdgeIds = useMemo(() => {
    const set = new Set<string>();
    if (!data?.cycles) return set;
    for (const cycle of data.cycles) {
      for (const edgeId of cycle.edges) {
        set.add(edgeId);
      }
    }
    return set;
  }, [data]);

  // Sync handler
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}/sync`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to sync repository.");
      }
      await refetch();
    } catch (err: unknown) {
      setSyncError((err as Error).message || "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-background overflow-hidden">
      {/* --------------------------------------------------------------- */}
      {/* Graph Toolbar                                                     */}
      {/* --------------------------------------------------------------- */}
      <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Module count + search */}
        <div className="flex items-center gap-4 min-w-0">
          {data?.lod && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border border-border bg-card/60 text-muted-foreground">
              <Layers className="w-3 h-3 text-accent" />
              {data.lod.totalNodes} Modules
            </span>
          )}

          {/* Search */}
          <div className="hidden md:flex items-center relative w-60">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
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
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {syncError && (
            <span className="hidden lg:inline text-xs font-mono text-danger">{syncError}</span>
          )}

          <Link
            href={`/repos/${repoId}/health`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Health</span>
          </Link>

          <Link
            href={`/repos/${repoId}/analytics`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>

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

      {/* --------------------------------------------------------------- */}
      {/* Main 3D Viewport                                                  */}
      {/* --------------------------------------------------------------- */}
      <main className="relative flex-1 w-full overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="p-3 rounded-full bg-danger/10 text-danger border border-danger/30">
              <Activity className="w-6 h-6" />
            </div>
            <p className="font-mono text-sm text-danger">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-md bg-secondary border border-border text-xs font-mono text-foreground hover:bg-secondary/80"
            >
              Retry Loading Graph
            </button>
          </div>
        ) : !data || isLoading ? (
          <div className="w-full h-full p-4">
            <GraphCanvasWrapper
              data={{
                nodes: [],
                edges: [],
                lod: { isLODActive: false, totalNodes: 0, totalEdges: 0, threshold: 500 },
                computedAt: "",
              }}
              selectedNodeId={null}
              hoveredNodeId={null}
              onSelectNode={() => {}}
              onHoverNode={() => {}}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            <GraphCanvasWrapper
              data={data}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onSelectNode={setSelectedNodeId}
              onHoverNode={setHoveredNodeId}
              showComplexityHeatmap={showComplexityHeatmap}
              showCircularDeps={showCircularDeps}
              cycleNodeIds={cycleNodeIds}
              cycleEdgeIds={cycleEdgeIds}
              annotatedNodeIds={annotatedNodeIds}
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

              {showCircularDeps && (
                <div className="pt-1.5 border-t border-border mt-1 text-[10px] text-muted-foreground leading-normal">
                  {cycleNodeIds.size > 0 ? (
                    <span className="text-warning font-semibold">
                      ⚠️ {data.cycles?.length} circular paths ({cycleNodeIds.size} modules
                      affected).
                    </span>
                  ) : (
                    <span className="text-info">No circular dependencies detected.</span>
                  )}
                </div>
              )}
            </div>

            {/* LOD Info Toast */}
            {data.lod.isLODActive && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-md border border-warning/30 bg-surface/90 backdrop-blur-md text-[11px] font-mono text-warning flex items-center gap-2 shadow-md">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Large codebase ({data.lod.totalNodes} modules) — LOD detail reduction active.
                </span>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* Module Detail Side Panel                                         */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 border-l border-border bg-surface/95 backdrop-blur-xl p-6 z-30 shadow-2xl flex flex-col overflow-y-auto"
            >
              {/* Drawer Header */}
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

              {/* Module Metadata Grid */}
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
                    Complexity
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

              {/* Path Display */}
              <div className="mb-6">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">
                  File Path
                </span>
                <code className="block p-2.5 rounded bg-card/80 border border-border font-mono text-xs text-foreground break-all">
                  {selectedNode.path}
                </code>
              </div>

              {/* AI Summary */}
              {selectedNode.kind === "file" && (
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-2 font-mono text-xs font-semibold text-foreground">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>AI Summary</span>
                  </div>

                  {selectedNode.summaryStatus === "done" && selectedNode.summary ? (
                    <p className="text-xs font-sans text-muted-foreground leading-relaxed p-3 rounded-md bg-card/60 border border-border">
                      {selectedNode.summary}
                    </p>
                  ) : selectedNode.summaryStatus === "generating" ||
                    selectedNode.summaryStatus === "pending" ? (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-card/60 border border-border text-xs font-mono text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                      <span>Generating summary... sync in progress.</span>
                    </div>
                  ) : selectedNode.summaryStatus === "failed" ? (
                    <p className="text-xs font-mono text-danger/80 p-3 rounded-md bg-danger/5 border border-danger/20">
                      AI summary unavailable for this file.
                    </p>
                  ) : null}
                </div>
              )}

              {/* Outgoing Imports */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2 font-mono text-xs font-semibold text-foreground">
                  <ArrowUpRight className="w-4 h-4 text-accent" />
                  <span>Imports ({selectedNodeConnections.imports.length})</span>
                </div>

                {selectedNodeConnections.imports.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground italic">
                    No outgoing module imports.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNodeConnections.imports.map((edge) => (
                      <li key={edge.id}>
                        <button
                          onClick={() => setSelectedNodeId(edge.to)}
                          className="w-full text-left p-2 rounded border border-border bg-card/40 hover:bg-secondary hover:border-accent/50 transition-colors flex items-center justify-between font-mono text-xs text-foreground group"
                        >
                          <span className="truncate">{edge.toPath}</span>
                          <Focus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent shrink-0 ml-2" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Incoming Dependents */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-2 font-mono text-xs font-semibold text-foreground">
                  <ArrowDownLeft className="w-4 h-4 text-primary" />
                  <span>Imported By ({selectedNodeConnections.importedBy.length})</span>
                </div>

                {selectedNodeConnections.importedBy.length === 0 ? (
                  <p className="font-mono text-xs text-muted-foreground italic">
                    No incoming dependent modules.
                  </p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNodeConnections.importedBy.map((edge) => (
                      <li key={edge.id}>
                        <button
                          onClick={() => setSelectedNodeId(edge.from)}
                          className="w-full text-left p-2 rounded border border-border bg-card/40 hover:bg-secondary hover:border-primary/50 transition-colors flex items-center justify-between font-mono text-xs text-foreground group"
                        >
                          <span className="truncate">{edge.fromPath}</span>
                          <Focus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Annotations Section */}
              <div className="border-t border-border pt-5 mt-4">
                <div className="flex items-center gap-1.5 mb-3 font-mono text-xs font-semibold text-foreground">
                  <span>📝</span>
                  <span>Module Annotations</span>
                </div>

                {isLoadingAnnotations ? (
                  <div className="flex items-center gap-2 py-3 text-xs font-mono text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>Loading annotations...</span>
                  </div>
                ) : annotations.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground italic mb-4">
                    No annotations yet. Add a note to help your team understand this module.
                  </p>
                ) : (
                  <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                    {annotations.map((ann) => (
                      <div
                        key={ann._id}
                        className="p-3 rounded-md bg-card/60 border border-border space-y-2"
                      >
                        <p className="text-xs font-sans text-foreground leading-normal break-all">
                          {ann.content}
                        </p>
                        <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                          <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                          <button
                            onClick={() => handleDeleteAnnotation(ann._id)}
                            className="text-danger hover:underline hover:text-danger/80"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2.5">
                  <textarea
                    rows={2}
                    value={annotationInput}
                    onChange={(e) => setAnnotationInput(e.target.value)}
                    placeholder="Refactor this service before adding new features..."
                    className="w-full p-2.5 rounded-md border border-border bg-card/85 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent font-sans transition-all"
                  />
                  {annotationError && (
                    <p className="text-[10px] font-mono text-danger">{annotationError}</p>
                  )}
                  <button
                    onClick={handleAddAnnotation}
                    disabled={isSavingAnnotation || !annotationInput.trim()}
                    className="w-full py-1.5 rounded-md bg-accent hover:bg-accent/90 disabled:bg-muted/30 text-background font-mono text-xs font-bold transition-colors"
                  >
                    {isSavingAnnotation ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* --------------------------------------------------------------- */}
        {/* Chat Panel                                                       */}
        {/* --------------------------------------------------------------- */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              key="chat-panel"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] z-40 shadow-2xl"
            >
              <ChatPanel
                repoId={repoId}
                repoName={data?.nodes[0]?.path.split("/")[0] ?? "Repository"}
                onCitationClick={(path) => {
                  const node = data?.nodes.find((n) => n.path === path);
                  if (node) setSelectedNodeId(node.id);
                  setIsChatOpen(false);
                }}
                onClose={() => setIsChatOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
