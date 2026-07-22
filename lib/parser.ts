/**
 * lib/parser.ts — Heuristic file/folder tree and import-graph parser.
 *
 * No AST, no Babel, no TypeScript compiler.
 * Uses regex-based import extraction for JS/TS files only.
 *
 * Server-side only. Never import this from a Client Component.
 */
import path from "path";
import type { GitTreeItem } from "./github";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileNode {
  path: string;
  type: "file" | "folder";
  name: string;
  /** Extension without dot (e.g. "ts", "tsx"). Empty string for folders. */
  ext: string;
  /** File size in bytes (from GitHub tree). 0 for folders. */
  size: number;
  children?: FileNode[];
}

export interface ModuleEdge {
  /** Importing file path (absolute repo path) */
  from: string;
  /** Imported file path (absolute repo path, resolved) */
  to: string;
}

export interface ParsedModule {
  path: string;
  type: "file" | "folder";
  imports: string[]; // absolute resolved paths within the repo
  /** Heuristic lines-of-code count (0 for folders) */
  loc: number;
  /**
   * Complexity score: heuristic based on LOC.
   * Score = Math.min(loc / 50, 10) → 0..10
   */
  complexityScore: number;
}

export interface ParseResult {
  /** Flat file node list (original tree items transformed) */
  nodes: FileNode[];
  /** Import edges between files */
  edges: ModuleEdge[];
  /** Per-module parsed metadata */
  modules: ParsedModule[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** JS/TS file extensions we parse for imports */
const PARSEABLE_EXTENSIONS = new Set(["js", "jsx", "ts", "tsx", "mjs", "cjs", "mts", "cts"]);

/** Directories to ignore when building the tree */
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "out",
  ".vercel",
  "coverage",
  "__pycache__",
]);

// ---------------------------------------------------------------------------
// Step 1 — Build flat + nested FileNode list from GitHub tree
// ---------------------------------------------------------------------------

export function buildFileTree(gitTree: GitTreeItem[]): FileNode[] {
  const nodes: FileNode[] = [];

  for (const item of gitTree) {
    const parts = item.path.split("/");

    // Skip items inside ignored directories
    if (parts.some((p) => IGNORED_DIRS.has(p))) continue;

    const name = parts[parts.length - 1];
    const ext =
      item.type === "blob" ? (name.includes(".") ? (name.split(".").pop() ?? "") : "") : "";

    nodes.push({
      path: item.path,
      type: item.type === "blob" ? "file" : "folder",
      name,
      ext,
      size: item.size ?? 0,
    });
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Step 2 — Extract imports from a single file's content (regex heuristic)
// ---------------------------------------------------------------------------

/**
 * Regex patterns for JS/TS import statements.
 * Captures the module specifier string.
 */
const IMPORT_PATTERNS = [
  // ES module static imports: import ... from '...'
  /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  // Dynamic imports: import('...')
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // CommonJS require: require('...')
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  // Export re-exports: export ... from '...'
  /export\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
];

export function extractRawImports(content: string): string[] {
  const found = new Set<string>();

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0; // reset global regex
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const specifier = match[1];
      if (specifier) found.add(specifier);
    }
  }

  return Array.from(found);
}

// ---------------------------------------------------------------------------
// Step 3 — Resolve a raw import specifier to an absolute repo path
// ---------------------------------------------------------------------------

/**
 * Candidate extensions to try when a relative import has no extension.
 * Ordered by likelihood.
 */
const EXTENSION_CANDIDATES = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];

/**
 * Resolve a module specifier relative to a source file into an absolute
 * repo path. Returns null if the import is external (node_modules).
 *
 * @param specifier   Raw import string (e.g. "../utils/helpers")
 * @param fromPath    Absolute path of the importing file within the repo
 * @param knownPaths  Set of all known file paths in the repo
 * @param aliases     Optional path alias map (e.g. { "@/": "src/" })
 */
export function resolveImport(
  specifier: string,
  fromPath: string,
  knownPaths: Set<string>,
  aliases: Record<string, string> = {},
): string | null {
  // External package — ignore
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    // Check alias prefixes
    let aliasMatched = false;
    for (const [prefix, replacement] of Object.entries(aliases)) {
      if (specifier.startsWith(prefix)) {
        specifier = replacement + specifier.slice(prefix.length);
        aliasMatched = true;
        break;
      }
    }
    if (!aliasMatched) return null;
  }

  const fromDir = path.dirname(fromPath);
  // Normalise to forward slashes (Windows-safe)
  const raw = specifier.startsWith("/")
    ? specifier.slice(1)
    : path.posix.normalize(path.posix.join(fromDir, specifier));

  // Exact match
  if (knownPaths.has(raw)) return raw;

  // Try extension candidates
  for (const ext of EXTENSION_CANDIDATES) {
    const candidate = raw + ext;
    if (knownPaths.has(candidate)) return candidate;
  }

  return null; // Could not resolve
}

// ---------------------------------------------------------------------------
// Step 4 — Build the full import graph across all files
// ---------------------------------------------------------------------------

/**
 * Build a complete import graph from fetched file contents.
 *
 * @param files       All file nodes from buildFileTree (type === "file")
 * @param contents    Fetched file content keyed by path
 * @param aliases     Path aliases from tsconfig/jsconfig (optional)
 */
export function buildImportGraph(
  files: FileNode[],
  contents: Map<string, string>,
  aliases: Record<string, string> = {},
): { edges: ModuleEdge[]; moduleMap: Map<string, ParsedModule> } {
  const knownPaths = new Set(files.map((f) => f.path));
  const edges: ModuleEdge[] = [];
  const moduleMap = new Map<string, ParsedModule>();

  for (const file of files) {
    const content = contents.get(file.path) ?? "";
    const loc = content.split("\n").length;
    const complexityScore = Math.min(loc / 50, 10);

    // Only extract imports for parseable JS/TS files
    const imports: string[] = [];
    if (PARSEABLE_EXTENSIONS.has(file.ext)) {
      const rawImports = extractRawImports(content);

      for (const specifier of rawImports) {
        const resolved = resolveImport(specifier, file.path, knownPaths, aliases);
        if (resolved && resolved !== file.path) {
          imports.push(resolved);
          edges.push({ from: file.path, to: resolved });
        }
      }
    }

    moduleMap.set(file.path, {
      path: file.path,
      type: "file",
      imports,
      loc,
      complexityScore,
    });
  }

  // Add folder nodes with empty metadata
  for (const file of files) {
    if (file.type === "folder" && !moduleMap.has(file.path)) {
      moduleMap.set(file.path, {
        path: file.path,
        type: "folder",
        imports: [],
        loc: 0,
        complexityScore: 0,
      });
    }
  }

  return { edges, moduleMap };
}

// ---------------------------------------------------------------------------
// Step 5 — Main parse entry point
// ---------------------------------------------------------------------------

/**
 * Full parse pipeline: builds the file tree, import graph, and per-module
 * metadata from a repo's GitHub tree and file contents.
 *
 * @param gitTree   Raw GitHub tree items
 * @param contents  Map of { filePath → rawTextContent }
 * @param aliases   Optional tsconfig path aliases ({ "@/": "src/" })
 */
export function parseRepository(
  gitTree: GitTreeItem[],
  contents: Map<string, string>,
  aliases: Record<string, string> = {},
): ParseResult {
  const nodes = buildFileTree(gitTree);
  const fileNodes = nodes.filter((n) => n.type === "file");

  const { edges, moduleMap } = buildImportGraph(fileNodes, contents, aliases);

  return {
    nodes,
    edges,
    modules: Array.from(moduleMap.values()),
  };
}

// ---------------------------------------------------------------------------
// Health score computation
// ---------------------------------------------------------------------------

/**
 * Compute a repository health score (0–100) from parse results.
 *
 * Formula:
 *   score = 100
 *     - avgComplexity × 30   (0..10 → contributes 0..30 points penalty)
 *     - edgeDensity × 30     (ratio of edges/files, capped at 1 → 0..30 penalty)
 *     - 0 (circular dep placeholder — Phase 5)
 *
 * Result is clamped to [0, 100].
 */
export function computeHealthScore(result: ParseResult): number {
  const fileModules = result.modules.filter((m) => m.type === "file");
  if (fileModules.length === 0) return 100;

  const avgComplexity =
    fileModules.reduce((sum, m) => sum + m.complexityScore, 0) / fileModules.length;

  const edgeDensity = Math.min(result.edges.length / Math.max(fileModules.length, 1), 1);

  const penalty = avgComplexity * 3 + edgeDensity * 30;
  const score = Math.round(Math.max(0, Math.min(100, 100 - penalty)));

  return score;
}
