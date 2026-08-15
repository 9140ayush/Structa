"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { GraphPayload } from "@/types/graph";
import { GraphSkeleton } from "./GraphSkeleton";

// Dynamically import DependencyGraphScene with ssr: false per Rules.md §2
const DependencyGraphScene = dynamic(() => import("./DependencyGraphScene"), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

interface GraphCanvasWrapperProps {
  data: GraphPayload;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onHoverNode: (nodeId: string | null) => void;
  showComplexityHeatmap?: boolean;
  showCircularDeps?: boolean;
  cycleNodeIds?: Set<string>;
  cycleEdgeIds?: Set<string>;
  annotatedNodeIds?: Set<string>;
}

export function GraphCanvasWrapper(props: GraphCanvasWrapperProps) {
  return (
    <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-border bg-background">
      <DependencyGraphScene {...props} />
    </div>
  );
}
