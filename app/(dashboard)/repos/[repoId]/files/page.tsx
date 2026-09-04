"use client";

/**
 * app/(dashboard)/repos/[repoId]/files/page.tsx — Phase 11.6
 *
 * Intelligent File Explorer: searchable, sortable, filterable file browser
 * with LOC, complexity, dependency overlays on every file.
 */

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileCode,
  Folder,
  Search,
  X,
  Loader2,
  AlertTriangle,
  ArrowUpDown,
  Box,
  Filter,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileNode {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  loc: number;
  complexityScore: number;
  importsCount: number;
  importedByCount: number;
  summary?: string;
  summaryStatus?: string;
}

type SortKey = "path" | "loc" | "complexity" | "imports" | "importedBy";
type SortDir = "asc" | "desc";
type FileFilter = "all" | "file" | "folder";

interface FilesPageProps {
  params: Promise<{ repoId: string }>;
}

// ---------------------------------------------------------------------------
// Extension categorisation for badges
// ---------------------------------------------------------------------------

function getExtBadgeColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["ts", "tsx"].includes(ext)) return "text-accent border-accent/30 bg-accent/10";
  if (["js", "jsx"].includes(ext)) return "text-warning border-warning/30 bg-warning/10";
  if (["css", "scss"].includes(ext)) return "text-primary border-primary/30 bg-primary/10";
  if (["json", "yaml", "yml", "toml"].includes(ext)) return "text-info border-info/30 bg-info/10";
  if (["md", "mdx"].includes(ext)) return "text-muted-foreground border-border bg-card/40";
  return "text-muted-foreground border-border bg-card/40";
}

function getComplexityColor(score: number): string {
  if (score >= 7) return "text-danger";
  if (score >= 4) return "text-warning";
  return "text-info";
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

function sortNodes(nodes: FileNode[], key: SortKey, dir: SortDir): FileNode[] {
  return [...nodes].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "path":
        cmp = a.path.localeCompare(b.path);
        break;
      case "loc":
        cmp = a.loc - b.loc;
        break;
      case "complexity":
        cmp = a.complexityScore - b.complexityScore;
        break;
      case "imports":
        cmp = a.importsCount - b.importsCount;
        break;
      case "importedBy":
        cmp = a.importedByCount - b.importedByCount;
        break;
    }
    return dir === "desc" ? -cmp : cmp;
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FilesPage({ params }: FilesPageProps) {
  const { repoId } = use(params);
  const [allNodes, setAllNodes] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("path");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setAllNodes(data.fileTree ?? []);
      })
      .catch(() => setError("Failed to load file data."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  // Filtered + sorted list
  const filteredNodes = useMemo(() => {
    let nodes = allNodes;
    if (typeFilter !== "all") nodes = nodes.filter((n) => n.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n) => n.path.toLowerCase().includes(q) || n.name.toLowerCase().includes(q),
      );
    }
    return sortNodes(nodes, sortKey, sortDir);
  }, [allNodes, typeFilter, searchQuery, sortKey, sortDir]);

  const paged = filteredNodes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredNodes.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const renderSortIcon = (k: SortKey) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )
    ) : (
      <ArrowUpDown className="w-3 h-3 opacity-40" />
    );

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
            <FileCode className="w-5 h-5 text-info" />
            Intelligent File Explorer
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {allNodes.length} modules · Browse with complexity, LOC, and dependency overlays
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search by path or filename…"
              className="w-full pl-8 pr-8 py-2 rounded-md border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border">
            {(["all", "file", "folder"] as FileFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setTypeFilter(f);
                  setPage(0);
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  typeFilter === f
                    ? "bg-accent text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "file" && <FileCode className="w-3 h-3" />}
                {f === "folder" && <Folder className="w-3 h-3" />}
                {f === "all" && <Filter className="w-3 h-3" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <span className="font-mono text-xs text-muted-foreground shrink-0">
            {filteredNodes.length} results
          </span>
        </div>

        {/* Table */}
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Search className="w-8 h-8 text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">No files match your search.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-2 px-4 py-2 bg-secondary/40 border-b border-border font-mono text-[10px] uppercase text-muted-foreground">
              <button
                className="flex items-center gap-1 text-left hover:text-foreground"
                onClick={() => handleSort("path")}
              >
                Path {renderSortIcon("path")}
              </button>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("loc")}
              >
                LOC {renderSortIcon("loc")}
              </button>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("complexity")}
              >
                Complexity {renderSortIcon("complexity")}
              </button>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("imports")}
              >
                Imports {renderSortIcon("imports")}
              </button>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleSort("importedBy")}
              >
                Used By {renderSortIcon("importedBy")}
              </button>
              <span>Graph</span>
            </div>

            {/* Rows */}
            {paged.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-2 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors group"
              >
                {/* Path */}
                <div className="flex items-center gap-2 min-w-0">
                  {node.type === "folder" ? (
                    <Folder className="w-3.5 h-3.5 text-accent shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-mono text-xs text-foreground truncate" title={node.path}>
                    {node.path}
                  </span>
                  {node.type === "file" && (
                    <span
                      className={`shrink-0 font-mono text-[9px] px-1.5 py-0.5 rounded-full border ${getExtBadgeColor(node.name)}`}
                    >
                      {node.name.split(".").pop()?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* LOC */}
                <span className="font-mono text-xs text-muted-foreground text-right w-14">
                  {node.type === "file" ? node.loc.toLocaleString() : "—"}
                </span>

                {/* Complexity */}
                <span
                  className={`font-mono text-xs font-bold text-right w-16 ${node.type === "file" ? getComplexityColor(node.complexityScore) : "text-muted-foreground"}`}
                >
                  {node.type === "file" ? `${node.complexityScore}/10` : "—"}
                </span>

                {/* Imports */}
                <span className="font-mono text-xs text-muted-foreground text-right w-12">
                  {node.importsCount > 0 ? `↑${node.importsCount}` : "—"}
                </span>

                {/* Used By */}
                <span className="font-mono text-xs text-muted-foreground text-right w-14">
                  {node.importedByCount > 0 ? `←${node.importedByCount}` : "—"}
                </span>

                {/* Graph link */}
                <div className="flex justify-center">
                  <Link
                    href={`/repos/${repoId}/graph`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open in 3D Graph"
                  >
                    <Box className="w-3.5 h-3.5 text-accent" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground pt-2">
            <span>
              Page {page + 1} of {totalPages} · {filteredNodes.length} files
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-md border border-border bg-secondary disabled:opacity-40 hover:bg-secondary/80 transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md border border-border bg-secondary disabled:opacity-40 hover:bg-secondary/80 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
