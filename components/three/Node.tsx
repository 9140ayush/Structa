"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GraphNode } from "@/types/graph";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NodeProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isLODActive: boolean;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  showComplexityHeatmap?: boolean;
  showCircularDeps?: boolean;
  isPartOfCycle?: boolean;
  hasAnnotation?: boolean;
}

// ---------------------------------------------------------------------------
// Complexity Heatmap Gradient per design.md (#3DDC97 -> #F2B84B -> #F0576B)
// ---------------------------------------------------------------------------

function getComplexityColor(score: number): THREE.Color {
  const clamped = Math.max(0, Math.min(10, score));
  const t = clamped / 10;

  const low = new THREE.Color("#3DDC97"); // Signal Green
  const mid = new THREE.Color("#F2B84B"); // Amber Warning
  const high = new THREE.Color("#F0576B"); // Danger Red

  if (t < 0.5) {
    return low.clone().lerp(mid, t * 2);
  }
  return mid.clone().lerp(high, (t - 0.5) * 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Node({
  node,
  isSelected,
  isHovered,
  isLODActive,
  onSelect,
  onHover,
  showComplexityHeatmap = false,
  showCircularDeps = false,
  isPartOfCycle = false,
  hasAnnotation = false,
}: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [internalHovered, setInternalHovered] = useState(false);

  // Sizing: Radius scaled by LOC for files, fixed radius for folders
  const radius = useMemo(() => {
    if (node.kind === "folder") return 1.4;
    // Logarithmic scaling for file LOC (0.6 to 2.2)
    return 0.6 + Math.min(Math.log10(Math.max(1, node.loc)) * 0.5, 1.6);
  }, [node.kind, node.loc]);

  // Color calculation based on active mode
  const baseColor = useMemo(() => {
    if (node.diffStatus) {
      if (node.diffStatus === "added") return new THREE.Color("#22C55E");
      if (node.diffStatus === "removed") return new THREE.Color("#EF4444");
      if (node.diffStatus === "changed") return new THREE.Color("#F5A623");
      return new THREE.Color("#4B5563"); // unchanged
    }
    if (showCircularDeps && isPartOfCycle) {
      return new THREE.Color("#F5A623"); // Warning Orange for cycles
    }
    if (showComplexityHeatmap) {
      if (node.kind === "folder") return new THREE.Color("#7C9CFF"); // Accent Ion Blue for folders
      return getComplexityColor(node.complexityScore);
    }
    // Normal graph coloring: Blue for folders, cool slate/grey for files
    if (node.kind === "folder") return new THREE.Color("#7C9CFF");
    return new THREE.Color("#4B5563");
  }, [
    node.kind,
    node.complexityScore,
    showComplexityHeatmap,
    showCircularDeps,
    isPartOfCycle,
    node.diffStatus,
  ]);

  // Emissive color on hover/selection
  const emissiveColor = useMemo(() => {
    if (node.diffStatus) {
      if (node.diffStatus === "added") return new THREE.Color("#22C55E");
      if (node.diffStatus === "removed") return new THREE.Color("#EF4444");
      if (node.diffStatus === "changed") return new THREE.Color("#F5A623");
      return new THREE.Color("#000000");
    }
    if (showCircularDeps && isPartOfCycle) return new THREE.Color("#F5A623");
    if (isSelected) return new THREE.Color("#3DDC97"); // Primary glow for selected
    if (isHovered || internalHovered) return new THREE.Color("#7C9CFF"); // Ion Blue glow for hover
    return new THREE.Color("#000000");
  }, [isSelected, isHovered, internalHovered, showCircularDeps, isPartOfCycle, node.diffStatus]);

  // Pulse animation on hover/selection
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (isSelected || isHovered || internalHovered || (showCircularDeps && isPartOfCycle)) {
      const pulseSpeed = showCircularDeps && isPartOfCycle ? 6 : 4;
      const scaleFactor = 1 + Math.sin(clock.getElapsedTime() * pulseSpeed) * 0.08;
      meshRef.current.scale.setScalar(scaleFactor);
    } else {
      meshRef.current.scale.setScalar(1.0);
    }
  });

  // LOD Optimization: skip rendering detailed labels or complex meshes for low priority nodes
  const skipLabels = isLODActive && node.isLowPriorityLOD && !isHovered && !isSelected;

  return (
    <group position={[node.x, node.y, node.z]}>
      {/* 3D Mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setInternalHovered(true);
          onHover(node.id);
        }}
        onPointerOut={() => {
          setInternalHovered(false);
          onHover(null);
        }}
      >
        {node.kind === "folder" ? (
          // Folders rendered as rounded boxes / icosahedrons
          <boxGeometry args={[radius * 1.5, radius * 1.5, radius * 1.5]} />
        ) : (
          // Files rendered as spheres
          <sphereGeometry args={[radius, skipLabels ? 8 : 16, skipLabels ? 8 : 16]} />
        )}

        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.8 : isHovered || internalHovered ? 0.5 : 0.1}
          roughness={0.3}
          metalness={0.2}
          transparent={showCircularDeps}
          opacity={showCircularDeps ? (isPartOfCycle ? 1.0 : 0.15) : 1.0}
        />
      </mesh>

      {/* Emissive Selection Ring */}
      {(isSelected || isHovered || internalHovered || (showCircularDeps && isPartOfCycle)) && (
        <mesh>
          <ringGeometry args={[radius * 1.3, radius * 1.5, 32]} />
          <meshBasicMaterial
            color={
              isSelected ? "#3DDC97" : showCircularDeps && isPartOfCycle ? "#F5A623" : "#7C9CFF"
            }
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* HTML Overlay Label (Rendered for non-LOD skipped nodes or when hovered/selected) */}
      {!skipLabels && (isHovered || isSelected || internalHovered || !isLODActive) && (
        <Html
          position={[0, radius + 0.8, 0]}
          center
          distanceFactor={25}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shadow-md transition-all border ${
              isSelected
                ? "bg-surface-elevated border-primary text-primary font-semibold"
                : isHovered || internalHovered
                  ? "bg-surface-elevated border-accent text-accent"
                  : "bg-surface/80 border-border text-text-primary"
            }`}
          >
            {hasAnnotation && <span className="mr-1 text-warning">📝</span>}
            {node.name}
            {node.kind === "file" && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">({node.loc} LOC)</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
