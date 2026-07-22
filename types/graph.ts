/**
 * types/graph.ts — Shared TypeScript types for the graph data structures
 * used across the parsing pipeline and future 3D rendering.
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
  /** Lines of code (file nodes only) */
  loc?: number;
  /**
   * Position hint for the force-directed layout.
   * Computed server-side in Phase 3.
   */
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphEdge {
  id: string; // `${from}→${to}`
  from: string; // GraphNode.id
  to: string; // GraphNode.id
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** ISO timestamp of when this snapshot was computed */
  computedAt: string;
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
