/**
 * components/landing/structa-3d/sceneData.ts
 *
 * Structured visualization data for the Structa 3D exploder scene.
 * Pure TypeScript constants — no React, no Three.js.
 * Positions are in world-space units. Y-axis is up.
 *
 * The scene layers stack vertically:
 *   Repository  → y ≈ -7
 *   CodeModules → y ≈ -3
 *   DependencyGraph → y ≈ 0
 *   Architecture → y ≈ 4
 *   AICore      → y ≈ 8
 */

// ---------------------------------------------------------------------------
// Color palette (matches globals.css dark theme)
// ---------------------------------------------------------------------------

export const COLORS = {
  primary: "#3DDC97", // Signal Green
  accent: "#7C9CFF", // Ion Blue
  violet: "#9B7DFF",
  warning: "#F2B84B",
  danger: "#F0576B",
  bg: "#0A0C10",
  surface: "#12151B",
  surfaceElevated: "#191D26",
  border: "#242833",
  foreground: "#EDEFF3",
  mutedFg: "#8B92A3",
} as const;

// ---------------------------------------------------------------------------
// Module cluster types
// ---------------------------------------------------------------------------

export type ModuleClusterType =
  "frontend" | "backend" | "api" | "database" | "auth" | "services" | "utils";

export interface ModuleCluster {
  id: string;
  label: string;
  type: ModuleClusterType;
  /** World-space position of the cluster center (before scroll offset) */
  x: number;
  y: number;
  z: number;
  /** 0–1, drives node size and brightness */
  importance: number;
  /** Hex accent color for this cluster */
  color: string;
  /** Number of sub-module boxes rendered inside this cluster */
  subModuleCount: number;
}

export const MODULE_CLUSTERS: ModuleCluster[] = [
  {
    id: "mc-frontend",
    label: "Frontend",
    type: "frontend",
    x: -5.5,
    y: -3,
    z: 1.5,
    importance: 0.75,
    color: COLORS.accent,
    subModuleCount: 4,
  },
  {
    id: "mc-backend",
    label: "Backend",
    type: "backend",
    x: 5.5,
    y: -3,
    z: 1.5,
    importance: 0.85,
    color: COLORS.primary,
    subModuleCount: 5,
  },
  {
    id: "mc-api",
    label: "API Layer",
    type: "api",
    x: 0,
    y: -3,
    z: 3,
    importance: 0.8,
    color: "#60CDFF",
    subModuleCount: 3,
  },
  {
    id: "mc-database",
    label: "Database",
    type: "database",
    x: 3,
    y: -3,
    z: -3,
    importance: 0.7,
    color: COLORS.warning,
    subModuleCount: 3,
  },
  {
    id: "mc-auth",
    label: "Auth",
    type: "auth",
    x: -3,
    y: -3,
    z: -3,
    importance: 0.9,
    color: COLORS.violet,
    subModuleCount: 4,
  },
  {
    id: "mc-services",
    label: "Services",
    type: "services",
    x: -7,
    y: -3,
    z: -1,
    importance: 0.65,
    color: "#3DDCDC",
    subModuleCount: 3,
  },
  {
    id: "mc-utils",
    label: "Utils",
    type: "utils",
    x: 7,
    y: -3,
    z: -1,
    importance: 0.5,
    color: COLORS.mutedFg,
    subModuleCount: 3,
  },
];

// ---------------------------------------------------------------------------
// Dependency graph nodes
// ---------------------------------------------------------------------------

export type NodeImportance = "high" | "medium" | "low";

export interface DepNode {
  id: string;
  name: string;
  /** Position relative to the dependency graph center (y ≈ 0) */
  x: number;
  y: number;
  z: number;
  importance: NodeImportance;
  /** Which module cluster this node belongs to */
  clusterId: string;
}

export const DEP_NODES: DepNode[] = [
  // Auth cluster — high importance
  {
    id: "dn-middleware",
    name: "middleware.ts",
    x: 0,
    y: 0.3,
    z: 0,
    importance: "high",
    clusterId: "mc-auth",
  },
  {
    id: "dn-auth",
    name: "auth.service.ts",
    x: 3.2,
    y: 0.6,
    z: -1.5,
    importance: "high",
    clusterId: "mc-auth",
  },
  {
    id: "dn-session",
    name: "session.service.ts",
    x: 5.5,
    y: -0.4,
    z: -2.8,
    importance: "medium",
    clusterId: "mc-auth",
  },
  {
    id: "dn-user-repo",
    name: "user.repository.ts",
    x: 7.8,
    y: 0.5,
    z: -1.2,
    importance: "medium",
    clusterId: "mc-database",
  },

  // API cluster
  {
    id: "dn-api-repos",
    name: "api/repos/route.ts",
    x: -3.5,
    y: 1.2,
    z: -2,
    importance: "medium",
    clusterId: "mc-api",
  },
  {
    id: "dn-api-chat",
    name: "api/chat/route.ts",
    x: -6.5,
    y: -0.5,
    z: -0.5,
    importance: "high",
    clusterId: "mc-api",
  },
  {
    id: "dn-api-explore",
    name: "api/explore/route.ts",
    x: -5,
    y: 2,
    z: 1.5,
    importance: "medium",
    clusterId: "mc-api",
  },

  // Graph / Frontend cluster
  {
    id: "dn-dep-graph",
    name: "DependencyGraphScene.tsx",
    x: 2,
    y: -2.5,
    z: 2.5,
    importance: "high",
    clusterId: "mc-frontend",
  },
  {
    id: "dn-node",
    name: "Node.tsx",
    x: 4.5,
    y: -3.2,
    z: 3.2,
    importance: "medium",
    clusterId: "mc-frontend",
  },
  {
    id: "dn-edge",
    name: "Edge.tsx",
    x: 3.2,
    y: -4.5,
    z: 1.5,
    importance: "medium",
    clusterId: "mc-frontend",
  },

  // Lib cluster
  {
    id: "dn-db",
    name: "lib/db.ts",
    x: -2,
    y: 3.5,
    z: -3.5,
    importance: "high",
    clusterId: "mc-database",
  },
  {
    id: "dn-openai",
    name: "lib/openai.ts",
    x: -4.5,
    y: 4,
    z: -2,
    importance: "medium",
    clusterId: "mc-services",
  },
  {
    id: "dn-github",
    name: "lib/github.ts",
    x: -0.5,
    y: 5,
    z: -4,
    importance: "medium",
    clusterId: "mc-services",
  },

  // Models
  {
    id: "dn-repo-model",
    name: "models/Repo.ts",
    x: 1.5,
    y: 4.2,
    z: 1.5,
    importance: "medium",
    clusterId: "mc-database",
  },
  {
    id: "dn-module-model",
    name: "models/Module.ts",
    x: 3.8,
    y: 4.8,
    z: 0.2,
    importance: "medium",
    clusterId: "mc-database",
  },

  // Parsers — backend cluster
  {
    id: "dn-parser-imports",
    name: "parser/imports.ts",
    x: -3,
    y: -3,
    z: -1.5,
    importance: "high",
    clusterId: "mc-backend",
  },
  {
    id: "dn-parser-layout",
    name: "parser/layout.ts",
    x: -1.5,
    y: -4.2,
    z: -0.8,
    importance: "medium",
    clusterId: "mc-backend",
  },
  {
    id: "dn-parser-complexity",
    name: "parser/complexity.ts",
    x: -4.5,
    y: -3.5,
    z: -2.5,
    importance: "medium",
    clusterId: "mc-backend",
  },

  // UI components
  {
    id: "dn-chat-panel",
    name: "ChatPanel.tsx",
    x: -7.5,
    y: 0.8,
    z: 2.8,
    importance: "medium",
    clusterId: "mc-frontend",
  },
  {
    id: "dn-health-ring",
    name: "HealthScoreRing.tsx",
    x: -9,
    y: 2,
    z: 1.2,
    importance: "low",
    clusterId: "mc-frontend",
  },

  // Hooks / utils
  {
    id: "dn-use-graph",
    name: "use-graph-data.ts",
    x: 0,
    y: -5.5,
    z: 4,
    importance: "medium",
    clusterId: "mc-utils",
  },
  {
    id: "dn-use-chat",
    name: "use-chat-session.ts",
    x: -2,
    y: -6.5,
    z: 3,
    importance: "low",
    clusterId: "mc-utils",
  },
];

// ---------------------------------------------------------------------------
// Dependency edges
// ---------------------------------------------------------------------------

export interface DepEdge {
  id: string;
  from: string; // DepNode.id
  to: string;
  /** Drives edge opacity and particle speed */
  weight: "strong" | "normal" | "weak";
}

export const DEP_EDGES: DepEdge[] = [
  { id: "de-1", from: "dn-middleware", to: "dn-auth", weight: "strong" },
  { id: "de-2", from: "dn-auth", to: "dn-session", weight: "strong" },
  { id: "de-3", from: "dn-session", to: "dn-user-repo", weight: "normal" },
  { id: "de-4", from: "dn-middleware", to: "dn-api-repos", weight: "strong" },
  { id: "de-5", from: "dn-api-repos", to: "dn-db", weight: "normal" },
  { id: "de-6", from: "dn-api-chat", to: "dn-openai", weight: "strong" },
  { id: "de-7", from: "dn-api-chat", to: "dn-use-chat", weight: "normal" },
  { id: "de-8", from: "dn-api-explore", to: "dn-github", weight: "normal" },
  { id: "de-9", from: "dn-dep-graph", to: "dn-node", weight: "strong" },
  { id: "de-10", from: "dn-dep-graph", to: "dn-edge", weight: "strong" },
  { id: "de-11", from: "dn-api-repos", to: "dn-repo-model", weight: "normal" },
  { id: "de-12", from: "dn-dep-graph", to: "dn-module-model", weight: "normal" },
  { id: "de-13", from: "dn-parser-imports", to: "dn-parser-layout", weight: "strong" },
  { id: "de-14", from: "dn-parser-imports", to: "dn-parser-complexity", weight: "normal" },
  { id: "de-15", from: "dn-chat-panel", to: "dn-use-chat", weight: "strong" },
  { id: "de-16", from: "dn-use-graph", to: "dn-module-model", weight: "normal" },
  { id: "de-17", from: "dn-db", to: "dn-repo-model", weight: "strong" },
  { id: "de-18", from: "dn-openai", to: "dn-api-chat", weight: "normal" },
  { id: "de-19", from: "dn-auth", to: "dn-db", weight: "strong" },
  { id: "de-20", from: "dn-user-repo", to: "dn-repo-model", weight: "normal" },
  { id: "de-21", from: "dn-parser-imports", to: "dn-module-model", weight: "strong" },
  { id: "de-22", from: "dn-health-ring", to: "dn-module-model", weight: "weak" },
];

// ---------------------------------------------------------------------------
// Architecture blocks (the organized layer above the dependency graph)
// ---------------------------------------------------------------------------

export interface ArchBlock {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  color: string;
}

export const ARCH_BLOCKS: ArchBlock[] = [
  {
    id: "ab-frontend",
    label: "Frontend",
    sublabel: "React / Next.js",
    x: -6,
    y: 4,
    z: 0,
    width: 4.5,
    depth: 2.5,
    color: COLORS.accent,
  },
  {
    id: "ab-api",
    label: "API Layer",
    sublabel: "Next.js Routes",
    x: -1,
    y: 4,
    z: 0,
    width: 4,
    depth: 2.5,
    color: "#60CDFF",
  },
  {
    id: "ab-backend",
    label: "Backend",
    sublabel: "Parser / AI Pipeline",
    x: 4,
    y: 4,
    z: 0,
    width: 4.5,
    depth: 2.5,
    color: COLORS.primary,
  },
  {
    id: "ab-database",
    label: "Database",
    sublabel: "MongoDB / Models",
    x: 0,
    y: 4,
    z: -4,
    width: 5,
    depth: 2.5,
    color: COLORS.warning,
  },
];

// Architecture connections (drawn as lines between arch block centers)
export interface ArchConnection {
  id: string;
  from: string; // ArchBlock.id
  to: string;
}

export const ARCH_CONNECTIONS: ArchConnection[] = [
  { id: "ac-1", from: "ab-frontend", to: "ab-api" },
  { id: "ac-2", from: "ab-api", to: "ab-backend" },
  { id: "ac-3", from: "ab-api", to: "ab-database" },
  { id: "ac-4", from: "ab-backend", to: "ab-database" },
];

// ---------------------------------------------------------------------------
// Repository layer folder / file entries
// ---------------------------------------------------------------------------

export interface RepoEntry {
  id: string;
  name: string;
  kind: "folder" | "file";
  x: number;
  z: number;
}

export const REPO_ENTRIES: RepoEntry[] = [
  { id: "re-app", name: "app/", kind: "folder", x: -4, z: -1 },
  { id: "re-components", name: "components/", kind: "folder", x: -1.5, z: -1 },
  { id: "re-lib", name: "lib/", kind: "folder", x: 1.5, z: -1 },
  { id: "re-models", name: "models/", kind: "folder", x: 4, z: -1 },
  { id: "re-hooks", name: "hooks/", kind: "folder", x: -3, z: 1 },
  { id: "re-types", name: "types/", kind: "folder", x: 0, z: 1 },
  { id: "re-actions", name: "actions/", kind: "folder", x: 3, z: 1 },
  { id: "re-pkg", name: "package.json", kind: "file", x: -5, z: 0 },
  { id: "re-config", name: "next.config.ts", kind: "file", x: 5, z: 0 },
  { id: "re-ts", name: "tsconfig.json", kind: "file", x: -2, z: 2.2 },
  { id: "re-readme", name: "README.md", kind: "file", x: 2, z: 2.2 },
  { id: "re-env", name: ".env.local", kind: "file", x: 0, z: -2.5 },
];

// ---------------------------------------------------------------------------
// AI intelligence configuration
// ---------------------------------------------------------------------------

export const AI_CONFIG = {
  /** Number of concentric torus rings */
  ringCount: 4,
  /** Base radius of the innermost ring */
  innerRadius: 1.8,
  /** Radial gap between consecutive rings */
  ringGap: 1.0,
  /** Y-position of the AI core center (before scroll offset) */
  yCenter: 8.5,
  /** Particle count travelling upward through the AI core */
  particleCount: 40,
} as const;

// ---------------------------------------------------------------------------
// Insight panel data
// ---------------------------------------------------------------------------

export interface InsightPanel {
  id: string;
  title: string;
  body: string;
  /** Offset from AI core center */
  xOffset: number;
  zOffset: number;
  color: string;
}

export const INSIGHT_PANELS: InsightPanel[] = [
  {
    id: "ip-modules",
    title: "Module Summary",
    body: "22 modules parsed · avg 280 LOC",
    xOffset: -5.5,
    zOffset: 1,
    color: COLORS.primary,
  },
  {
    id: "ip-deps",
    title: "Dependency Insight",
    body: "auth.service.ts · 14 dependents",
    xOffset: 5.5,
    zOffset: 1,
    color: COLORS.accent,
  },
  {
    id: "ip-arch",
    title: "Architecture",
    body: "Frontend → API → Backend → DB",
    xOffset: 0,
    zOffset: -5,
    color: COLORS.violet,
  },
  {
    id: "ip-complexity",
    title: "Complexity",
    body: "3 high-complexity modules flagged",
    xOffset: 0,
    zOffset: 5,
    color: COLORS.warning,
  },
];
