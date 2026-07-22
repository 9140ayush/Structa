"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Compass,
  ArrowRight,
  Star,
  X,
  FileCode,
  Folder,
  ArrowUpRight,
  ArrowDownLeft,
  Focus,
  Globe,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { GraphPayload, GraphEdge } from "@/types/graph";
import { GraphCanvasWrapper } from "@/components/three/GraphCanvasWrapper";
import { GraphSkeleton } from "@/components/three/GraphSkeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicSearchResult {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
}

interface ResolvedRepoData {
  canonicalKey: string;
  graphPayload: GraphPayload;
  healthScore: number;
  repo: {
    name: string;
    owner: string;
    url: string;
    stars: number;
    language: string;
    description: string;
  };
}

const FEATURED_REPOS = [
  { name: "facebook/react", label: "React" },
  { name: "vercel/next.js", label: "Next.js" },
  { name: "tailwindlabs/tailwindcss", label: "Tailwind CSS" },
  { name: "expressjs/express", label: "Express" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExplorerPage() {
  // Input & Resolution State
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<PublicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Active Resolved Repo Data
  const [activeRepo, setActiveRepo] = useState<ResolvedRepoData | null>(null);

  // 3D Graph Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Search Query
  useEffect(() => {
    if (!inputVal.trim() || inputVal.includes("/") || inputVal.includes("http")) {
      Promise.resolve().then(() => {
        setSearchResults([]);
        setIsSearching(false);
      });
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    Promise.resolve().then(() => setIsSearching(true));
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/explorer/search?q=${encodeURIComponent(inputVal.trim())}`);
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data.repos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [inputVal]);

  // Resolve Repository Handler (Method 2 & Method 3 pipeline)
  const handleResolve = useCallback(async (targetUrlOrShorthand: string) => {
    if (!targetUrlOrShorthand.trim()) return;

    setIsResolving(true);
    setResolveError(null);
    setSearchResults([]);

    try {
      const res = await fetch("/api/explorer/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlOrShorthand: targetUrlOrShorthand.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve repository.");
      }

      setActiveRepo(data);
      setSelectedNodeId(null);
      setHoveredNodeId(null);
    } catch (err: unknown) {
      console.error("[handleResolve]", err);
      setResolveError((err as Error).message || "Could not resolve repository.");
    } finally {
      setIsResolving(false);
    }
  }, []);

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

  return (
    <div className="relative w-full h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ------------------------------------------------------------------- */}
      {/* Header Bar                                                          */}
      {/* ------------------------------------------------------------------- */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent">
              <Compass className="w-4 h-4" />
            </div>
            <h1 className="font-heading font-bold text-sm text-foreground">
              Structa Architecture Explorer
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
              Public Mode
            </span>
          </div>
        </div>

        {/* Featured Repo Pills */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Featured:</span>
          {FEATURED_REPOS.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setInputVal(item.name);
                handleResolve(item.name);
              }}
              className="px-2.5 py-1 rounded-md border border-border bg-card/40 hover:bg-secondary hover:border-accent/40 text-xs font-mono text-foreground transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* Search & URL Resolution Bar                                         */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-20 px-6 py-4 border-b border-border bg-surface/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputVal) handleResolve(inputVal);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search public repos or paste GitHub URL / shorthand (e.g. vercel/next.js)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 absolute right-3 top-3 text-accent animate-spin" />
              )}
            </div>

            <button
              type="submit"
              disabled={isResolving || !inputVal.trim()}
              className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-background font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isResolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Indexing...</span>
                </>
              ) : (
                <>
                  <span>Explore 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Error Message Dropdown */}
          {resolveError && (
            <div className="mt-2 p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{resolveError}</span>
            </div>
          )}

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-lg shadow-2xl overflow-hidden max-h-72 overflow-y-auto z-50 divide-y divide-border">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setInputVal(item.fullName);
                    handleResolve(item.fullName);
                  }}
                  className="w-full text-left p-3 hover:bg-secondary/60 transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-heading font-semibold text-xs text-foreground group-hover:text-accent truncate">
                        {item.fullName}
                      </span>
                      {item.language && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-card border border-border text-muted-foreground">
                          {item.language}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-xl">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-warning" />
                      <span>{item.stars.toLocaleString()}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Main Viewport Content                                               */}
      {/* ------------------------------------------------------------------- */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {isResolving ? (
          <div className="w-full h-full p-6 flex flex-col items-center justify-center">
            <GraphSkeleton />
          </div>
        ) : !activeRepo ? (
          /* Empty Landing State */
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,156,255,0.15),rgba(255,255,255,0))]" />
            <div className="relative z-10 max-w-xl flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center shadow-glow-primary">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  Explore Any Public GitHub Architecture
                </h2>
                <p className="text-muted-foreground text-xs font-mono leading-relaxed">
                  Enter a repository shorthand like{" "}
                  <code className="text-accent font-semibold">facebook/react</code> or paste a
                  GitHub URL above to analyze its import graph in interactive 3D.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {FEATURED_REPOS.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setInputVal(item.name);
                      handleResolve(item.name);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-accent text-xs font-mono text-foreground flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 text-accent" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 3D Canvas Viewport */
          <div className="w-full h-full relative">
            <GraphCanvasWrapper
              data={activeRepo.graphPayload}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onSelectNode={setSelectedNodeId}
              onHoverNode={setHoveredNodeId}
            />

            {/* Repo Info Header Badge */}
            <div className="absolute top-4 left-4 z-10 p-3 rounded-lg border border-border bg-surface/90 backdrop-blur-md shadow-xl flex items-center gap-3">
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {activeRepo.repo.name}
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {activeRepo.canonicalKey} • {activeRepo.graphPayload.nodes.length} Modules
                </p>
              </div>

              <div className="px-2.5 py-1 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-xs font-semibold">
                Health: {activeRepo.healthScore}/100
              </div>
            </div>

            {/* Side Panel Drawer for Selected Node */}
            <AnimatePresence>
              {selectedNode && (
                <motion.aside
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 border-l border-border bg-surface/95 backdrop-blur-xl p-6 z-30 shadow-2xl flex flex-col overflow-y-auto"
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
                        LOC
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

                  <div className="mb-6">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground block mb-1">
                      File Path
                    </span>
                    <code className="block p-2.5 rounded bg-card/80 border border-border font-mono text-xs text-foreground break-all">
                      {selectedNode.path}
                    </code>
                  </div>

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
          </div>
        )}
      </main>
    </div>
  );
}
