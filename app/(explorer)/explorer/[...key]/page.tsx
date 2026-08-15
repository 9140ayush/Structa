/**
 * app/(explorer)/explorer/[...key]/page.tsx — Catch-all page for exploring public repository import graphs.
 *
 * Implements Task 1, 3, 9, 10, 11, 14, 15: Explorer repository view, loading, index progress, Q&A chat.
 */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import type { GraphPayload, GraphEdge } from "@/types/graph";
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

interface PageProps {
  params: Promise<{ key: string[] }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RepositoryExplorerPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const keyArray = unwrappedParams?.key || [];

  const owner = keyArray[0] || "";
  const repo = keyArray[1] || "";
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

  // Sidebar controls
  const [isChatOpen, setIsChatOpen] = useState(false);

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

        // Fetch fully-indexed graph details
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
        // Status is indexing or not_indexed -> trigger resolution first to ensure background indexing starts
        if (status === "not_indexed" && !pollIntervalRef.current) {
          await fetch("/api/explorer/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urlOrShorthand: canonicalKey }),
          });
        }

        // Start polling if not already started
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

  // Handle manual retry trigger
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

  // Derived Selected Node Details
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !activeRepo) return null;
    return activeRepo.graphPayload.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, activeRepo]);

  const selectedNodeConnections = React.useMemo(() => {
    if (!selectedNodeId || !activeRepo) return { imports: [], importedBy: [] };

    const imports: GraphEdge[] = [];
    const importedBy: GraphEdge[] = [];

    for (const edge of activeRepo.graphPayload.edges) {
      if (edge.from === selectedNodeId) imports.push(edge);
      if (edge.to === selectedNodeId) importedBy.push(edge);
    }

    return { imports, importedBy };
  }, [selectedNodeId, activeRepo]);

  // Loading details / index status view
  if (
    indexStatus === null ||
    indexStatus === "indexing" ||
    indexStatus === "not_indexed" ||
    isLoadingDetails
  ) {
    return (
      <div className="flex-1 w-full h-[calc(100vh-64px)] p-6 flex flex-col items-center justify-center relative bg-background overflow-hidden">
        <GraphSkeleton />
        <div className="absolute top-[35%] w-full flex justify-center z-10 px-4">
          <IndexingProgress status={indexStatus || "not_indexed"} />
        </div>
      </div>
    );
  }

  // Failed Index State
  if (indexStatus === "failed" || errorText) {
    return (
      <div className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center p-8 relative">
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
      <div className="flex-1 w-full h-[calc(100vh-64px)] flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-[calc(100vh-64px)] relative flex bg-background text-foreground overflow-hidden">
      {/* 3D Canvas Canvas Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden z-10">
        <div className="w-full h-full relative">
          <GraphCanvasWrapper
            data={activeRepo.graphPayload}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={setSelectedNodeId}
            onHoverNode={setHoveredNodeId}
          />
        </div>

        {/* Back Link to Search Landing */}
        <Link
          href="/explorer"
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface/90 backdrop-blur shadow-md text-xs font-mono text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Explorer</span>
        </Link>

        {/* Repo Info Header Badge */}
        <div className="absolute top-4 left-40 z-20 p-3 rounded-lg border border-border bg-surface/90 backdrop-blur shadow-md flex items-center gap-4 text-left">
          <div>
            <h2 className="font-heading font-bold text-xs text-foreground leading-normal">
              {activeRepo.repo.name}
            </h2>
            <p className="font-mono text-[10px] text-muted-foreground leading-normal flex items-center gap-1.5 mt-0.5">
              <span>{activeRepo.canonicalKey}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-accent" />
                {activeRepo.repo.defaultBranch}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 border-l border-border pl-4">
            <span className="font-mono text-[10px] text-muted-foreground block">Health Score</span>
            <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/25 text-primary font-mono text-[10px] font-bold">
              {activeRepo.healthScore}/100
            </div>
          </div>
        </div>

        {/* Float Controls: Ask chatbot toggle button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-mono text-xs font-bold uppercase hover:bg-accent/90 transition-all shadow-glow-accent"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask the Codebase</span>
          </button>
        )}
      </main>

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
                  <h2 className="font-heading font-semibold text-sm text-foreground truncate">
                    {selectedNode.name}
                  </h2>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
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

            {/* Complexity Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              <div className="p-3 rounded-md bg-card/60 border border-border">
                <span className="text-muted-foreground text-[9px] uppercase block mb-1">LOC</span>
                <span className="font-bold text-foreground text-xs">
                  {selectedNode.kind === "folder" ? "N/A" : selectedNode.loc}
                </span>
              </div>

              <div className="p-3 rounded-md bg-card/60 border border-border">
                <span className="text-muted-foreground text-[9px] uppercase block mb-1">
                  Complexity
                </span>
                <span
                  className="font-bold text-xs"
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

            {/* AI Summary Block */}
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

            {/* File Path */}
            <div className="mb-6">
              <span className="font-mono text-[10px] uppercase text-muted-foreground block mb-1.5">
                File Path
              </span>
              <code className="block p-2 rounded bg-card/85 border border-border font-mono text-[10px] text-foreground break-all leading-normal">
                {selectedNode.path}
              </code>
            </div>

            {/* Imports list */}
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

            {/* Imported By list */}
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

      {/* Grounded Codebase chatbot (ChatPanel) */}
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
    </div>
  );
}
