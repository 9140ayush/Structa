"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
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
} from "lucide-react";
import { useGraphData } from "@/hooks/use-graph-data";
import { GraphCanvasWrapper } from "@/components/three/GraphCanvasWrapper";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RepoMapPageProps {
  params: Promise<{ repoId: string }>;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function RepoMapPage({ params }: RepoMapPageProps) {
  const { repoId } = use(params);

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

  // Sync trigger handler
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
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* ------------------------------------------------------------------- */}
      {/* Top Controls Header Bar                                             */}
      {/* ------------------------------------------------------------------- */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back Link & Repo Context */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-heading font-bold text-base text-foreground truncate">
              {data?.nodes[0]?.path.split("/")[0] ?? "Repository Map"}
            </h1>

            {data?.lod && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono border border-border bg-card/60 text-muted-foreground">
                <Layers className="w-3 h-3 text-accent" />
                {data.lod.totalNodes} Modules
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

        {/* Right: Actions & Sync */}
        <div className="flex items-center gap-3 shrink-0">
          {syncError && (
            <span className="hidden lg:inline text-xs font-mono text-danger">{syncError}</span>
          )}

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-accent" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Repo"}</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* Main 3D Viewport                                                    */}
      {/* ------------------------------------------------------------------- */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
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
            />

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

        {/* ----------------------------------------------------------------- */}
        {/* Framer Motion Side Panel for Selected Module                      */}
        {/* ----------------------------------------------------------------- */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }} // motion-spring-panel token per design.md §6
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

              {/* Path Display */}
              <div className="mb-6">
                <span className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">
                  File Path
                </span>
                <code className="block p-2.5 rounded bg-card/80 border border-border font-mono text-xs text-foreground break-all">
                  {selectedNode.path}
                </code>
              </div>

              {/* Outgoing Imports (Dependencies) */}
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

              {/* Incoming Dependents (Imported By) */}
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
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
