"use client";

/**
 * components/landing/structa-3d/DependencyGraph.tsx
 *
 * 3D dependency network — the visual heart of Structa's product story.
 *
 * Architecture:
 *   - Individual Mesh nodes per DEP_NODE (not instanced — 22 nodes is fine)
 *   - BufferGeometry line for each DEP_EDGE
 *   - One animated flow particle per edge (small sphere travelling along edge)
 *   - Hover state: selected node + connected edges brighten, others dim
 *   - Click: select / deselect a node
 *
 * Props:
 *   yOffset       — vertical scroll-driven displacement
 *   opacity       — overall layer opacity
 *   reducedMotion — disables particle animation and pulsing
 */

import React, { useRef, useState, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DEP_NODES, DEP_EDGES, DepNode, DepEdge, COLORS } from "./sceneData";

// ---------------------------------------------------------------------------
// Node radius by importance
// ---------------------------------------------------------------------------

function nodeRadius(importance: DepNode["importance"]): number {
  switch (importance) {
    case "high":
      return 0.52;
    case "medium":
      return 0.36;
    case "low":
      return 0.24;
  }
}

function nodeBaseColor(importance: DepNode["importance"]): string {
  switch (importance) {
    case "high":
      return COLORS.primary;
    case "medium":
      return COLORS.accent;
    case "low":
      return COLORS.mutedFg;
  }
}

// ---------------------------------------------------------------------------
// Single node mesh
// ---------------------------------------------------------------------------

function DepNodeMesh({
  node,
  isHovered,
  isSelected,
  isDimmed,
  yOffset,
  onHover,
  onSelect,
  reducedMotion,
}: {
  node: DepNode;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  yOffset: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const radius = nodeRadius(node.importance);
  const baseHex = nodeBaseColor(node.importance);

  const isActive = isHovered || isSelected;

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(baseHex),
        emissive: new THREE.Color(isSelected ? COLORS.primary : isActive ? COLORS.accent : baseHex),
        emissiveIntensity: isSelected ? 0.8 : isActive ? 0.5 : isDimmed ? 0.02 : 0.12,
        metalness: 0.4,
        roughness: 0.25,
        transparent: true,
        opacity: isDimmed ? 0.18 : 0.95,
      }),
    [baseHex, isActive, isSelected, isDimmed],
  );

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(isSelected ? COLORS.primary : COLORS.accent),
        transparent: true,
        opacity: isActive ? 0.65 : 0,
        side: THREE.DoubleSide,
      }),
    [isActive, isSelected],
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;
    if (isActive) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4.5) * 0.07;
      meshRef.current.scale.setScalar(s);
    } else {
      meshRef.current.scale.setScalar(1);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group position={[node.x, node.y + yOffset, node.z]}>
      <mesh
        ref={meshRef}
        material={mat}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} material={ringMat}>
        <ringGeometry args={[radius * 1.35, radius * 1.6, 32]} />
      </mesh>

      {/* HTML label on hover/select */}
      {isActive && (
        <Html
          position={[0, radius + 0.5, 0]}
          center
          distanceFactor={22}
          zIndexRange={[200, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(18,21,27,0.94)",
              border: `1px solid ${isSelected ? COLORS.primary : COLORS.accent}55`,
              borderRadius: 7,
              padding: "5px 10px",
              boxShadow: `0 0 14px ${isSelected ? COLORS.primary : COLORS.accent}25`,
              minWidth: 110,
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                color: isSelected ? COLORS.primary : COLORS.accent,
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              {node.name}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 8.5,
                color: COLORS.mutedFg,
                margin: "2px 0 0 0",
              }}
            >
              {node.importance} importance
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Edge line + flow particle
// ---------------------------------------------------------------------------

function DepEdgeMesh({
  edge,
  fromNode,
  toNode,
  isActive,
  isDimmed,
  yOffset,
  reducedMotion,
}: {
  edge: DepEdge;
  fromNode: DepNode;
  toNode: DepNode;
  isActive: boolean;
  isDimmed: boolean;
  yOffset: number;
  reducedMotion: boolean;
}) {
  const particleRef = useRef<THREE.Mesh>(null);

  const startVec = useMemo(
    () => new THREE.Vector3(fromNode.x, fromNode.y + yOffset, fromNode.z),
    [fromNode.x, fromNode.y, fromNode.z, yOffset],
  );
  const endVec = useMemo(
    () => new THREE.Vector3(toNode.x, toNode.y + yOffset, toNode.z),
    [toNode.x, toNode.y, toNode.z, yOffset],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array([
      startVec.x,
      startVec.y,
      startVec.z,
      endVec.x,
      endVec.y,
      endVec.z,
    ]);
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [startVec, endVec]);

  const color = isActive ? COLORS.primary : COLORS.accent;
  const opacity = isActive ? 0.9 : isDimmed ? 0.05 : edge.weight === "strong" ? 0.38 : 0.2;
  const particleSpeed = edge.weight === "strong" ? 0.65 : 0.4;

  useFrame(({ clock }) => {
    if (reducedMotion || !particleRef.current) return;
    const progress = (clock.getElapsedTime() * particleSpeed) % 1.0;
    particleRef.current.position.lerpVectors(startVec, endVec, progress);
    particleRef.current.visible = !isDimmed;
  });

  return (
    <group>
      {/* @ts-expect-error R3F line JSX */}
      <line geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </line>

      {/* Animated flow particle */}
      <mesh ref={particleRef} position={[startVec.x, startVec.y, startVec.z]}>
        <sphereGeometry args={[isActive ? 0.1 : 0.065, 6, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isActive ? 0.95 : isDimmed ? 0 : 0.55}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface DependencyGraphProps {
  yOffset?: number;
  opacity?: number;
  reducedMotion?: boolean;
}

export function DependencyGraph({ yOffset = 0, reducedMotion = false }: DependencyGraphProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);
  const handleSelect = useCallback(
    (id: string | null) => setSelectedId((prev) => (prev === id ? null : id)),
    [],
  );

  const activeId = selectedId ?? hoveredId;

  // Connected edge/node sets for active node
  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    const nodeSet = new Set<string>();
    const edgeSet = new Set<string>();
    if (!activeId) return { connectedNodeIds: nodeSet, connectedEdgeIds: edgeSet };
    nodeSet.add(activeId);
    for (const edge of DEP_EDGES) {
      if (edge.from === activeId || edge.to === activeId) {
        edgeSet.add(edge.id);
        nodeSet.add(edge.from);
        nodeSet.add(edge.to);
      }
    }
    return { connectedNodeIds: nodeSet, connectedEdgeIds: edgeSet };
  }, [activeId]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, DepNode>();
    for (const n of DEP_NODES) m.set(n.id, n);
    return m;
  }, []);

  // Click background to deselect
  const handleBackgroundClick = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, []);

  return (
    <group onClick={handleBackgroundClick}>
      {/* Edges */}
      {DEP_EDGES.map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const isActive = connectedEdgeIds.has(edge.id);
        const isDimmed = activeId !== null && !isActive;
        return (
          <DepEdgeMesh
            key={edge.id}
            edge={edge}
            fromNode={from}
            toNode={to}
            isActive={isActive}
            isDimmed={isDimmed}
            yOffset={yOffset}
            reducedMotion={reducedMotion}
          />
        );
      })}

      {/* Nodes */}
      {DEP_NODES.map((node) => {
        const isHovered = hoveredId === node.id;
        const isSelected = selectedId === node.id;
        const isDimmed = activeId !== null && !connectedNodeIds.has(node.id);
        return (
          <DepNodeMesh
            key={node.id}
            node={node}
            isHovered={isHovered}
            isSelected={isSelected}
            isDimmed={isDimmed}
            yOffset={yOffset}
            onHover={handleHover}
            onSelect={handleSelect}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </group>
  );
}
