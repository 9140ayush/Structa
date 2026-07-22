"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GraphPayload, GraphNode, GraphEdge } from "@/types/graph";

export function useGraphData(repoId: string) {
  const [data, setData] = useState<GraphPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch Graph Data
  const fetchGraph = useCallback(async () => {
    if (!repoId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/repos/${repoId}/graph`);
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Failed to fetch repository graph.");
      }

      setData(payload);
    } catch (err: unknown) {
      console.error("[useGraphData]", err);
      setError((err as Error).message || "Error loading graph data.");
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        fetchGraph();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchGraph]);

  // Derived Node Lookups
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    if (!data) return map;
    for (const node of data.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [data]);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? (nodeMap.get(selectedNodeId) ?? null) : null;
  }, [selectedNodeId, nodeMap]);

  // Incoming (importedBy) & Outgoing (imports) edges for selected node
  const selectedNodeConnections = useMemo(() => {
    if (!selectedNodeId || !data)
      return { imports: [] as GraphEdge[], importedBy: [] as GraphEdge[] };

    const imports: GraphEdge[] = [];
    const importedBy: GraphEdge[] = [];

    for (const edge of data.edges) {
      if (edge.from === selectedNodeId) {
        imports.push(edge);
      }
      if (edge.to === selectedNodeId) {
        importedBy.push(edge);
      }
    }

    return { imports, importedBy };
  }, [selectedNodeId, data]);

  // Search Filter
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim() || !data) return null;
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();

    for (const node of data.nodes) {
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) {
        matches.add(node.id);
      }
    }
    return matches;
  }, [searchQuery, data]);

  return {
    data,
    isLoading,
    error,
    selectedNodeId,
    hoveredNodeId,
    selectedNode,
    selectedNodeConnections,
    searchQuery,
    filteredNodeIds,
    setSelectedNodeId,
    setHoveredNodeId,
    setSearchQuery,
    refetch: fetchGraph,
  };
}
