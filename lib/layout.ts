/**
 * lib/layout.ts — 3D Force-Directed Graph Layout Computation Engine.
 *
 * Runs server-side. Computes stable 3D coordinates (x, y, z) for nodes
 * using a 3D Fruchterman-Reingold / Coulomb-Hooke force simulation with:
 *  - Coulomb electrostatic repulsion (inverse-square)
 *  - Hooke spring attraction along import edges
 *  - Hierarchical folder/directory clustering forces
 *  - Central gravity pull toward origin (0, 0, 0)
 *  - Level-of-Detail (LOD) threshold calculation (>500 nodes)
 */

import type { GraphNode, GraphEdge, GraphPayload, GraphLODMetadata } from "@/types/graph";

// ---------------------------------------------------------------------------
// Simulation Configuration
// ---------------------------------------------------------------------------

const ITERATIONS = 90;
const INITIAL_RADIUS = 35;
const REPULSION_K = 1200; // Electrostatic constant
const SPRING_K = 0.08; // Hooke spring constant
const IDEAL_EDGE_LENGTH = 18; // Desired distance between connected nodes
const GRAVITY_K = 0.04; // Central gravity attraction strength
const CLUSTER_K = 0.12; // Attraction toward parent folder center
const LOD_THRESHOLD = 500; // Node count threshold for Level of Detail reduction

// ---------------------------------------------------------------------------
// Helper: Deterministic Pseudo-Random Seed from String
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return (hash >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Types for Raw Modules Input from DB
// ---------------------------------------------------------------------------

export interface RawModuleInput {
  _id: string;
  path: string;
  type: "file" | "folder";
  loc: number;
  complexityScore: number;
  imports: string[]; // Module IDs as strings
  importedBy: string[]; // Module IDs as strings
  /** AI-generated summary (Phase 4+) */
  summary?: string;
  /** AI summary status */
  summaryStatus?: string;
}

// ---------------------------------------------------------------------------
// Core Layout Engine
// ---------------------------------------------------------------------------

export function computeGraphLayout(rawModules: RawModuleInput[]): GraphPayload {
  const totalNodes = rawModules.length;
  const isLODActive = totalNodes > LOD_THRESHOLD;

  if (totalNodes === 0) {
    return {
      nodes: [],
      edges: [],
      lod: {
        isLODActive: false,
        totalNodes: 0,
        totalEdges: 0,
        threshold: LOD_THRESHOLD,
      },
      computedAt: new Date().toISOString(),
    };
  }

  // Map raw modules to internal node representation with initial spherical placement
  const nodeMap = new Map<
    string,
    {
      id: string;
      path: string;
      name: string;
      kind: "file" | "folder";
      complexityScore: number;
      loc: number;
      importsCount: number;
      importedByCount: number;
      summary: string;
      summaryStatus: string;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      folderPath: string;
    }
  >();

  // Extract edges
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const mod of rawModules) {
    const parts = mod.path.split("/");
    const name = parts[parts.length - 1] ?? mod.path;
    const folderPath = parts.slice(0, -1).join("/");

    // Spherical initial placement based on path hash for determinism
    const h1 = hashString(mod.path);
    const h2 = hashString(mod.path + ":theta");
    const phi = Math.acos(2 * h1 - 1);
    const theta = 2 * Math.PI * h2;
    const r = INITIAL_RADIUS * Math.cbrt(hashString(mod.path + ":r") || 0.1);

    nodeMap.set(mod._id, {
      id: mod._id,
      path: mod.path,
      name,
      kind: mod.type,
      complexityScore: mod.complexityScore ?? 0,
      loc: mod.loc ?? 0,
      importsCount: mod.imports?.length ?? 0,
      importedByCount: mod.importedBy?.length ?? 0,
      summary: mod.summary ?? "",
      summaryStatus: mod.summaryStatus ?? "pending",
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      vx: 0,
      vy: 0,
      vz: 0,
      folderPath,
    });
  }

  // Create edge records (only valid connections where both nodes exist)
  for (const mod of rawModules) {
    const fromId = mod._id;
    const fromPath = mod.path;
    for (const toId of mod.imports) {
      if (fromId === toId || !nodeMap.has(toId)) continue;
      const edgeKey = `${fromId}→${toId}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        const toPath = nodeMap.get(toId)!.path;
        edges.push({
          id: edgeKey,
          from: fromId,
          to: toId,
          fromPath,
          toPath,
        });
      }
    }
  }

  const nodesList = Array.from(nodeMap.values());

  // Compute folder cluster centers
  const folderCenters = new Map<string, { x: number; y: number; z: number; count: number }>();

  // -------------------------------------------------------------------------
  // Force Simulation Iteration Loop
  // -------------------------------------------------------------------------

  let temperature = 1.0;
  const coolingRate = 0.95;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // 1. Calculate current folder centroids
    folderCenters.clear();
    for (const node of nodesList) {
      if (!node.folderPath) continue;
      const current = folderCenters.get(node.folderPath) ?? { x: 0, y: 0, z: 0, count: 0 };
      current.x += node.x;
      current.y += node.y;
      current.z += node.z;
      current.count += 1;
      folderCenters.set(node.folderPath, current);
    }
    for (const [, center] of folderCenters) {
      if (center.count > 0) {
        center.x /= center.count;
        center.y /= center.count;
        center.z /= center.count;
      }
    }

    // 2. Electrostatic Repulsion between nodes (Coulomb force)
    for (let i = 0; i < nodesList.length; i++) {
      const nodeA = nodesList[i]!;
      for (let j = i + 1; j < nodesList.length; j++) {
        const nodeB = nodesList[j]!;

        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dz = nodeA.z - nodeB.z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.01; // Avoid division by zero
        const dist = Math.sqrt(distSq);

        // Repulsive force magnitude
        const force = (REPULSION_K / distSq) * temperature;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeA.vz += fz;
        nodeB.vx -= fx;
        nodeB.vy -= fy;
        nodeB.vz -= fz;
      }
    }

    // 3. Spring Attraction along Edges (Hooke's law)
    for (const edge of edges) {
      const source = nodeMap.get(edge.from);
      const target = nodeMap.get(edge.to);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dz = target.z - source.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;

      const displacement = dist - IDEAL_EDGE_LENGTH;
      const force = displacement * SPRING_K * temperature;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;

      source.vx += fx;
      source.vy += fy;
      source.vz += fz;
      target.vx -= fx;
      target.vy -= fy;
      target.vz -= fz;
    }

    // 4. Folder Clustering & Central Gravity
    for (const node of nodesList) {
      // Cluster attraction to folder centroid
      if (node.folderPath && folderCenters.has(node.folderPath)) {
        const center = folderCenters.get(node.folderPath)!;
        node.vx += (center.x - node.x) * CLUSTER_K * temperature;
        node.vy += (center.y - node.y) * CLUSTER_K * temperature;
        node.vz += (center.z - node.z) * CLUSTER_K * temperature;
      }

      // Central gravity pull toward origin
      node.vx -= node.x * GRAVITY_K * temperature;
      node.vy -= node.y * GRAVITY_K * temperature;
      node.vz -= node.z * GRAVITY_K * temperature;
    }

    // 5. Apply velocities with dampening
    for (const node of nodesList) {
      // Velocity capping
      const vLen = Math.sqrt(node.vx * node.vx + node.vy * node.vy + node.vz * node.vz) + 0.001;
      const maxDisplacement = 5 * temperature;
      const speed = Math.min(vLen, maxDisplacement);

      node.x += (node.vx / vLen) * speed;
      node.y += (node.vy / vLen) * speed;
      node.z += (node.vz / vLen) * speed;

      // Friction decay
      node.vx *= 0.5;
      node.vy *= 0.5;
      node.vz *= 0.5;
    }

    temperature *= coolingRate;
  }

  // -------------------------------------------------------------------------
  // Level-of-Detail (LOD) Flagging
  // -------------------------------------------------------------------------

  const finalNodes: GraphNode[] = nodesList.map((node) => {
    // If LOD is active (>500 nodes), flag minor leaf files (low LOC & low connections) as low priority
    const isLowPriorityLOD =
      isLODActive &&
      node.kind === "file" &&
      node.loc < 30 &&
      node.importsCount + node.importedByCount <= 1;

    return {
      id: node.id,
      path: node.path,
      name: node.name,
      kind: node.kind,
      complexityScore: Math.round(node.complexityScore * 10) / 10,
      loc: node.loc,
      importsCount: node.importsCount,
      importedByCount: node.importedByCount,
      summary: node.summary,
      summaryStatus: node.summaryStatus as GraphNode["summaryStatus"],
      x: Math.round(node.x * 100) / 100,
      y: Math.round(node.y * 100) / 100,
      z: Math.round(node.z * 100) / 100,
      isLowPriorityLOD,
    };
  });

  const lodMetadata: GraphLODMetadata = {
    isLODActive,
    totalNodes: finalNodes.length,
    totalEdges: edges.length,
    threshold: LOD_THRESHOLD,
  };

  const cycles = detectCycles(finalNodes, edges);

  return {
    nodes: finalNodes,
    edges,
    lod: lodMetadata,
    cycles,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Tarjan's Strongly Connected Components algorithm to find circular dependency loops.
 */
function detectCycles(
  nodes: Array<{ id: string }>,
  edges: Array<{ from: string; to: string }>,
): Array<{ nodes: string[]; edges: string[] }> {
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (adj.has(e.from)) {
      adj.get(e.from)!.push(e.to);
    }
  }

  const indexMap = new Map<string, number>();
  const lowlinkMap = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  let index = 0;
  const sccs: string[][] = [];

  function strongConnect(u: string) {
    indexMap.set(u, index);
    lowlinkMap.set(u, index);
    index++;
    stack.push(u);
    onStack.add(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!indexMap.has(v)) {
        strongConnect(v);
        lowlinkMap.set(u, Math.min(lowlinkMap.get(u)!, lowlinkMap.get(v)!));
      } else if (onStack.has(v)) {
        lowlinkMap.set(u, Math.min(lowlinkMap.get(u)!, indexMap.get(v)!));
      }
    }

    if (lowlinkMap.get(u) === indexMap.get(u)) {
      const scc: string[] = [];
      let w = "";
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== u);
      sccs.push(scc);
    }
  }

  for (const n of nodes) {
    if (!indexMap.has(n.id)) {
      strongConnect(n.id);
    }
  }

  const cycles: Array<{ nodes: string[]; edges: string[] }> = [];
  const selfLoops = new Set<string>();
  for (const e of edges) {
    if (e.from === e.to) {
      selfLoops.add(e.from);
    }
  }

  for (const scc of sccs) {
    const isCycle = scc.length > 1 || (scc.length === 1 && selfLoops.has(scc[0]!));
    if (isCycle) {
      const sccSet = new Set(scc);
      const sccEdges: string[] = [];
      for (const e of edges) {
        if (sccSet.has(e.from) && sccSet.has(e.to)) {
          sccEdges.push(`${e.from}→${e.to}`);
        }
      }
      cycles.push({
        nodes: scc,
        edges: sccEdges,
      });
    }
  }

  return cycles;
}
