"use client";

/**
 * app/(dashboard)/repos/[repoId]/architecture/page.tsx — Phase 11.4
 *
 * 2D Architecture & Hierarchy — a collapsible folder/module tree with
 * dependency relationship indicators.
 *
 * Data source: /api/repos/[repoId]/intelligence
 * Rendering: Pure CSS/SVG tree — no new 3D dependencies.
 */

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  Loader2,
  AlertTriangle,
  Box,
  ArrowRight,
  Network,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileTreeNode {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  loc: number;
  complexityScore: number;
  importsCount: number;
  importedByCount: number;
  summary?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children: Map<string, TreeNode>;
  metadata?: FileTreeNode;
  depth: number;
}

interface ArchPageProps {
  params: Promise<{ repoId: string }>;
}

// ---------------------------------------------------------------------------
// Build nested tree from flat file list
// ---------------------------------------------------------------------------

function buildTree(flatNodes: FileTreeNode[]): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>();

  for (const node of flatNodes) {
    const parts = node.path.split("/");
    let current = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!current.has(part)) {
        current.set(part, {
          name: part,
          path: currentPath,
          type: isLast ? node.type : "folder",
          children: new Map(),
          metadata: isLast ? node : undefined,
          depth: i,
        });
      }

      const treeNode = current.get(part)!;
      if (isLast) treeNode.metadata = node;
      current = treeNode.children;
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Tree node renderer
// ---------------------------------------------------------------------------

function TreeNodeView({
  node,
  repoId,
  defaultExpanded = false,
}: {
  node: TreeNode;
  repoId: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || node.depth < 2);
  const hasChildren = node.children.size > 0;
  const isFolder = node.type === "folder" || hasChildren;
  const meta = node.metadata;

  const complexityColor =
    (meta?.complexityScore ?? 0) >= 7
      ? "text-danger"
      : (meta?.complexityScore ?? 0) >= 4
        ? "text-warning"
        : "text-info";

  return (
    <div className="font-mono text-xs">
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md group cursor-pointer hover:bg-secondary transition-colors ${
          isFolder ? "" : "hover:border-l-2 hover:border-accent ml-1"
        }`}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) setExpanded((p) => !p);
        }}
      >
        {/* Expand / collapse chevron */}
        {isFolder ? (
          <span className="shrink-0 text-muted-foreground w-3.5">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          expanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-accent shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-accent/60 shrink-0" />
          )
        ) : (
          <FileCode className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}

        {/* Name */}
        <span className="text-foreground truncate">{node.name}</span>

        {/* Metadata pills (only for files) */}
        {!isFolder && meta && (
          <span className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {meta.loc > 0 && (
              <span className="text-[10px] text-muted-foreground">{meta.loc} LOC</span>
            )}
            {meta.complexityScore > 0 && (
              <span className={`text-[10px] font-bold ${complexityColor}`}>
                C:{meta.complexityScore}
              </span>
            )}
            {meta.importedByCount > 0 && (
              <span className="text-[10px] text-primary" title="Used by N modules">
                ←{meta.importedByCount}
              </span>
            )}
            <Link
              href={`/repos/${repoId}/graph`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-accent hover:underline"
            >
              Graph
            </Link>
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isFolder && expanded && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {Array.from(node.children.entries())
              .sort(([, a], [, b]) => {
                // Folders first, then files
                if (a.children.size > 0 && b.children.size === 0) return -1;
                if (a.children.size === 0 && b.children.size > 0) return 1;
                return a.name.localeCompare(b.name);
              })
              .map(([key, child]) => (
                <TreeNodeView key={key} node={child} repoId={repoId} />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Architecture Layer Summary
// ---------------------------------------------------------------------------

function detectArchLayers(
  tree: Map<string, TreeNode>,
): Array<{ name: string; description: string; fileCount: number }> {
  const LAYER_PATTERNS: Record<string, string> = {
    app: "Application routes and page components",
    pages: "Page components (legacy or Next.js pages router)",
    components: "Reusable UI components",
    lib: "Shared utilities, services, and helpers",
    api: "API route handlers",
    hooks: "Custom React hooks",
    models: "Database models and schemas",
    types: "TypeScript type definitions",
    styles: "CSS and styling files",
    tests: "Test files",
    public: "Static public assets",
    actions: "Server actions",
    utils: "Utility functions",
    services: "Service layer (business logic)",
    middleware: "Middleware functions",
    config: "Configuration files",
  };

  const layers: Array<{ name: string; description: string; fileCount: number }> = [];

  for (const [key, node] of tree.entries()) {
    const lower = key.toLowerCase();
    if (LAYER_PATTERNS[lower]) {
      const fileCount = countFiles(node);
      if (fileCount > 0) {
        layers.push({
          name: key,
          description: LAYER_PATTERNS[lower]!,
          fileCount,
        });
      }
    }
  }

  return layers.sort((a, b) => b.fileCount - a.fileCount);
}

function countFiles(node: TreeNode): number {
  if (node.type === "file" && node.children.size === 0) return 1;
  let count = 0;
  for (const child of node.children.values()) {
    count += countFiles(child);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ArchitecturePage({ params }: ArchPageProps) {
  const { repoId } = use(params);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setFileTree(data.fileTree ?? []);
      })
      .catch(() => setError("Failed to load architecture data."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  const tree = useMemo(() => buildTree(fileTree), [fileTree]);
  const archLayers = useMemo(() => detectArchLayers(tree), [tree]);

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <Network className="w-5 h-5 text-accent" />
              2D Architecture
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Repository hierarchy and structural organization
            </p>
          </div>
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 bg-accent/5 text-accent font-mono text-xs hover:bg-accent/10 transition-colors"
          >
            <Box className="w-3.5 h-3.5" />
            Open 3D Graph
          </Link>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">No repository data found.</p>
            <p className="font-mono text-xs text-muted-foreground">
              Sync the repository to generate architecture data.
            </p>
          </div>
        ) : (
          <>
            {/* Architecture Layers */}
            {archLayers.length > 0 && (
              <section>
                <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Detected Architecture Layers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {archLayers.map((layer) => (
                    <div
                      key={layer.name}
                      className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3"
                    >
                      <FolderOpen className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {layer.name}/
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {layer.fileCount} files
                          </span>
                        </div>
                        <p className="font-sans text-xs text-muted-foreground mt-0.5">
                          {layer.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* File Tree */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Repository Tree
                </h2>
                <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="text-danger font-bold">C:8+</span> High complexity
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-primary">←N</span> Used by N modules
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
                <div className="p-2">
                  {Array.from(tree.entries())
                    .sort(([, a], [, b]) => {
                      if (a.children.size > 0 && b.children.size === 0) return -1;
                      if (a.children.size === 0 && b.children.size > 0) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map(([key, node]) => (
                      <TreeNodeView
                        key={key}
                        node={node}
                        repoId={repoId}
                        defaultExpanded={node.depth === 0}
                      />
                    ))}
                </div>
              </div>

              <p className="font-mono text-[10px] text-muted-foreground mt-2">
                {fileTree.length} modules total · Hover a file to see metadata · Click a folder to
                expand/collapse
              </p>
            </section>

            {/* CTA */}
            <div className="flex gap-3 pb-4">
              <Link
                href={`/repos/${repoId}/graph`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors"
              >
                <Box className="w-3.5 h-3.5" />
                Explore in 3D Graph
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/repos/${repoId}/files`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-foreground font-mono text-xs hover:bg-secondary/80 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Intelligent File Explorer
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
