/**
 * types/graph.ts — Shared TypeScript types for the graph data structures
 * used across the parsing pipeline and 3D rendering engine.
 */

// ---------------------------------------------------------------------------
// Graph node / edge types (used by 3D scene in Phase 3)
// ---------------------------------------------------------------------------

export type NodeKind = "file" | "folder";

export interface GraphNode {
  id: string; // Module._id as string
  path: string;
  name: string;
  kind: NodeKind;
  complexityScore: number; // 0..10
  loc: number; // Lines of code (0 for folders)
  importsCount: number; // Number of outgoing imports
  importedByCount: number; // Number of incoming dependents
  /** AI-generated summary (populated in Phase 4, empty if pending/failed) */
  summary?: string;
  /** AI summary generation status */
  summaryStatus?: "pending" | "generating" | "done" | "failed" | "skipped";
  /** 3D spatial position computed server-side */
  x: number;
  y: number;
  z: number;
  /** Level-of-Detail flag (true if node is low priority during LOD reduction) */
  isLowPriorityLOD?: boolean;
  /** Phase 8: Architecture diff status coloring */
  diffStatus?: "added" | "removed" | "changed" | "unchanged";
}

export interface GraphEdge {
  id: string; // `${from}→${to}`
  from: string; // GraphNode.id
  to: string; // GraphNode.id
  fromPath: string;
  toPath: string;
  /** Phase 8: Architecture diff status coloring */
  diffStatus?: "added" | "removed" | "unchanged";
}

export interface GraphLODMetadata {
  isLODActive: boolean;
  totalNodes: number;
  totalEdges: number;
  threshold: number;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  lod: GraphLODMetadata;
  /** ISO timestamp of when this graph layout was computed */
  computedAt: string;
  cycles?: Array<{
    nodes: string[];
    edges: string[];
  }>;
}

// ---------------------------------------------------------------------------
// Interaction & UI State Types
// ---------------------------------------------------------------------------

export interface NodeSelectionState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
}

export interface CameraTargetState {
  x: number;
  y: number;
  z: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
}

// ---------------------------------------------------------------------------
// Sync-related types
// ---------------------------------------------------------------------------

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncResult {
  status: SyncStatus;
  repoId: string;
  healthScore: number;
  moduleCount: number;
  edgeCount: number;
  syncedAt: string;
}
