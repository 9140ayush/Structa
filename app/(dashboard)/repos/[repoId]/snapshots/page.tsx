"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Play, Eye, GitCommit } from "lucide-react";
import { GraphCanvasWrapper } from "@/components/three/GraphCanvasWrapper";
import type { GraphPayload, GraphNode, GraphEdge } from "@/types/graph";

interface SnapshotsPageProps {
  params: Promise<{ repoId: string }>;
}

interface SnapshotDiffResult {
  addedNodes: string[];
  removedNodes: GraphNode[];
  changedNodes: string[];
  unchangedNodes: string[];
  addedEdges: Array<{ fromPath: string; toPath: string }>;
  removedEdges: GraphEdge[];
}

export default function SnapshotsPage({ params }: SnapshotsPageProps) {
  const { repoId } = use(params);
  const [snapshots, setSnapshots] = useState<Array<{ commitSha: string; createdAt: string }>>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Compare selection states
  const [fromSha, setFromSha] = useState("");
  const [toSha, setToSha] = useState("");

  // Comparison result states
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<SnapshotDiffResult | null>(null);

  // Formatted GraphPayload for 3D Visual Diff rendering
  const [diffGraphPayload, setDiffGraphPayload] = useState<GraphPayload | null>(null);

  // Selected node in visual diff
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Load snapshots list on mount
  useEffect(() => {
    async function loadSnapshots() {
      try {
        const res = await fetch(`/api/repos/${repoId}/snapshots`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load architecture snapshots.");
        }
        const snaps = json.data.snapshots || [];
        setSnapshots(snaps);

        // Pre-fill selection with latest two versions if available
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
  }, [repoId]);

  // Execute comparison
  const handleCompare = async () => {
    if (!fromSha || !toSha) return;
    setIsComparing(true);
    setCompareError(null);
    setDiffResult(null);
    setDiffGraphPayload(null);
    setSelectedNodeId(null);

    try {
      const res = await fetch(`/api/repos/${repoId}/snapshots/diff?from=${fromSha}&to=${toSha}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Comparison failed.");
      }

      const { to, diff } = json.data;
      setDiffResult(diff);

      // Merge and construct diff payload for R3F
      const newerGraph = to.graphJson;
      const addedSet = new Set<string>(diff.addedNodes);
      const changedSet = new Set<string>(diff.changedNodes);

      // 1. Map newer graph nodes with diff status
      const mergedNodes: GraphNode[] = newerGraph.nodes.map((node: GraphNode) => {
        let diffStatus: GraphNode["diffStatus"] = "unchanged";
        if (addedSet.has(node.path)) {
          diffStatus = "added";
        } else if (changedSet.has(node.path)) {
          diffStatus = "changed";
        }
        return {
          ...node,
          diffStatus,
        };
      });

      // 2. Map removed nodes from older graph and place them with "removed" status
      diff.removedNodes.forEach((node: GraphNode) => {
        mergedNodes.push({
          id: `removed-${node.id}`,
          path: node.path,
          name: node.name,
          kind: node.kind,
          complexityScore: node.complexityScore,
          loc: node.loc,
          importsCount: 0,
          importedByCount: 0,
          x: node.x,
          y: node.y,
          z: node.z,
          diffStatus: "removed",
        });
      });

      // 3. Map newer graph edges with diff status
      const addedEdgeKeys = new Set(
        diff.addedEdges.map((e: GraphEdge) => `${e.fromPath}->${e.toPath}`),
      );
      const mergedEdges: GraphEdge[] = newerGraph.edges.map((edge: GraphEdge) => {
        const key = `${edge.fromPath}->${edge.toPath}`;
        return {
          ...edge,
          diffStatus: addedEdgeKeys.has(key) ? "added" : "unchanged",
        };
      });

      // 4. Map removed edges
      diff.removedEdges.forEach((edge: GraphEdge) => {
        // Find if nodes exist in mergedNodes (might need to map ids correctly)
        const fromNode = mergedNodes.find((n) => n.path === edge.fromPath);
        const toNode = mergedNodes.find((n) => n.path === edge.toPath);

        if (fromNode && toNode) {
          mergedEdges.push({
            id: `removed-${edge.id}`,
            from: fromNode.id,
            to: toNode.id,
            fromPath: edge.fromPath,
            toPath: edge.toPath,
            diffStatus: "removed",
          });
        }
      });

      setDiffGraphPayload({
        nodes: mergedNodes,
        edges: mergedEdges,
        lod: newerGraph.lod,
        computedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : "Failed to run comparison.");
    } finally {
      setIsComparing(false);
    }
  };

  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !diffGraphPayload) return null;
    return diffGraphPayload.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, diffGraphPayload]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/repos/${repoId}`}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Codebase Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-heading font-bold text-base text-foreground truncate">
            Architecture Snapshots
          </h1>
        </div>
      </header>

      {/* Main layout splitting controls and canvas */}
      <div className="flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Selectors & History List */}
        <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-surface/40 backdrop-blur p-6 flex flex-col overflow-y-auto shrink-0 space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-sm text-foreground">Compare Versions</h3>
            <p className="text-xs font-sans text-muted-foreground leading-normal">
              Select two historical snapshots of this codebase to run an architectural diff.
            </p>

            <div className="space-y-3">
              {/* Version A: Older */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-muted-foreground">
                  Version A (Older)
                </label>
                <select
                  value={fromSha}
                  onChange={(e) => setFromSha(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  <option value="">Select older snapshot...</option>
                  {snapshots.map((snap) => (
                    <option key={snap.commitSha} value={snap.commitSha}>
                      {snap.commitSha.slice(0, 7)} — {new Date(snap.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Version B: Newer */}
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase text-muted-foreground">
                  Version B (Newer)
                </label>
                <select
                  value={toSha}
                  onChange={(e) => setToSha(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  <option value="">Select newer snapshot...</option>
                  {snapshots.map((snap) => (
                    <option key={snap.commitSha} value={snap.commitSha}>
                      {snap.commitSha.slice(0, 7)} — {new Date(snap.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompare}
                disabled={isComparing || !fromSha || !toSha || fromSha === toSha}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-accent hover:bg-accent/90 disabled:bg-muted/30 text-background font-mono text-xs font-bold transition-colors"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                    <span>Comparing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Compare Snapshots</span>
                  </>
                )}
              </button>

              {fromSha === toSha && fromSha !== "" && (
                <p className="text-[10px] font-mono text-warning text-center">
                  Cannot compare identical commit versions.
                </p>
              )}
            </div>
          </div>

          {/* Snapshot History timeline */}
          <div className="flex-1 flex flex-col space-y-3 pt-4 border-t border-border">
            <span className="font-mono text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
              Snapshot History
            </span>

            {isLoadingList ? (
              <div className="flex items-center gap-2 py-6 justify-center text-xs font-mono text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>Loading snapshot list...</span>
              </div>
            ) : listError ? (
              <p className="text-xs font-mono text-danger p-3 bg-danger/5 border border-danger/20 rounded-md">
                {listError}
              </p>
            ) : snapshots.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-xl text-center">
                <p className="text-xs font-mono text-muted-foreground leading-normal">
                  No architecture snapshots available yet. A snapshot will be created after your
                  next repository sync.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-96 pr-1">
                {snapshots.map((snap) => (
                  <div
                    key={snap.commitSha}
                    className="p-3 rounded-lg border border-border bg-card/40 flex items-start gap-2.5 font-mono text-[11px]"
                  >
                    <GitCommit className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div className="min-w-0 space-y-1">
                      <div className="font-bold text-foreground truncate">
                        SHA: {snap.commitSha.slice(0, 10)}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(snap.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: R3F 3D Visual Diff Graph */}
        <div className="flex-1 h-full relative overflow-hidden bg-[#0A0C10]">
          {compareError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-background/90">
              <p className="font-mono text-sm text-danger mb-4">{compareError}</p>
            </div>
          )}

          {!diffGraphPayload && !isComparing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#0A0C10]">
              <Eye className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading font-bold text-base text-foreground mb-1">
                Visual Diff Canvas
              </h3>
              <p className="text-xs font-sans text-muted-foreground max-w-xs">
                Run a comparison to view added, removed, and changed dependencies in 3D.
              </p>
            </div>
          ) : isComparing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#0A0C10] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="font-mono text-xs text-muted-foreground">
                Computing spatial graph difference...
              </p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <GraphCanvasWrapper
                data={diffGraphPayload!}
                selectedNodeId={selectedNodeId}
                hoveredNodeId={hoveredNodeId}
                onSelectNode={setSelectedNodeId}
                onHoverNode={setHoveredNodeId}
              />

              {/* Color legend overlay */}
              <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-2xl font-mono text-[10px]">
                <span className="font-bold text-foreground uppercase tracking-wider mb-1 block">
                  Legend
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <span className="text-foreground">
                    Added Modules ({diffResult?.addedNodes?.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <span className="text-foreground">
                    Removed Modules ({diffResult?.removedNodes?.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#F5A623]" />
                  <span className="text-foreground">
                    Changed Modules ({diffResult?.changedNodes?.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#4B5563]" />
                  <span className="text-muted-foreground">Unchanged Modules</span>
                </div>
              </div>

              {/* Selection info details */}
              {selectedNode && (
                <div className="absolute top-6 right-6 z-10 w-72 p-4 rounded-xl border border-border bg-surface/90 backdrop-blur-md shadow-2xl space-y-3">
                  <h4 className="font-heading font-bold text-xs text-foreground truncate">
                    {selectedNode.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded bg-card/60 border border-border">
                      <span className="text-muted-foreground block mb-0.5">LOC</span>
                      <span className="text-foreground font-bold">{selectedNode.loc}</span>
                    </div>
                    <div className="p-2 rounded bg-card/60 border border-border">
                      <span className="text-muted-foreground block mb-0.5">COMPLEXITY</span>
                      <span className="text-foreground font-bold">
                        {selectedNode.complexityScore}/10
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-card/60 border border-border font-mono text-[10px] flex items-center justify-between">
                    <span className="text-muted-foreground">DIFF STATUS</span>
                    <span
                      className="font-bold uppercase"
                      style={{
                        color:
                          selectedNode.diffStatus === "added"
                            ? "#22C55E"
                            : selectedNode.diffStatus === "removed"
                              ? "#EF4444"
                              : selectedNode.diffStatus === "changed"
                                ? "#F5A623"
                                : "#9CA3AF",
                      }}
                    >
                      {selectedNode.diffStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
