"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GraphEdge, GraphNode } from "@/types/graph";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EdgeProps {
  edge: GraphEdge;
  fromNode: GraphNode;
  toNode: GraphNode;
  isActive: boolean; // Connected to hovered or selected node
  isLODActive: boolean;
  showCircularDeps?: boolean;
  isPartOfCycle?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Edge({
  edge,
  fromNode,
  toNode,
  isActive,
  isLODActive,
  showCircularDeps = false,
  isPartOfCycle = false,
}: EdgeProps) {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);

  // Position vectors
  const startVec = useMemo(
    () => new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z),
    [fromNode.x, fromNode.y, fromNode.z],
  );
  const endVec = useMemo(
    () => new THREE.Vector3(toNode.x, toNode.y, toNode.z),
    [toNode.x, toNode.y, toNode.z],
  );

  // Line Geometry
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      startVec.x,
      startVec.y,
      startVec.z,
      endVec.x,
      endVec.y,
      endVec.z,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [startVec, endVec]);

  // Color & Opacity
  let edgeColor = isActive ? "#3DDC97" : "#7C9CFF"; // Signal Green when active, Ion Blue when resting
  let opacity = isActive ? 0.95 : isLODActive ? 0.2 : 0.4;
  let linewidth = isActive ? 2 : 1;

  if (edge.diffStatus) {
    if (edge.diffStatus === "added") {
      edgeColor = "#22C55E";
      opacity = 0.95;
      linewidth = 2.5;
    } else if (edge.diffStatus === "removed") {
      edgeColor = "#EF4444";
      opacity = 0.95;
      linewidth = 2.5;
    } else {
      edgeColor = "#4B5563";
      opacity = 0.15;
      linewidth = 1;
    }
  } else if (showCircularDeps) {
    if (isPartOfCycle) {
      edgeColor = "#F5A623";
      opacity = 0.95;
      linewidth = 3;
    } else {
      opacity = 0.05;
      linewidth = 1;
    }
  }

  // Animated directional particle flow along the edge
  useFrame(({ clock }) => {
    if (!particleRef.current) return;
    const speed = isActive ? 1.5 : 0.8;
    const progress = (clock.getElapsedTime() * speed) % 1.0;
    particleRef.current.position.lerpVectors(startVec, endVec, progress);
  });

  return (
    <group key={edge.id}>
      {/* Edge Line */}
      {/* @ts-expect-error Three.js line JSX element binding in R3F */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={edgeColor} transparent opacity={opacity} linewidth={linewidth} />
      </line>

      {/* Animated Directional Flow Particle */}
      {(!showCircularDeps || isPartOfCycle) && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[isActive ? 0.25 : 0.15, 8, 8]} />
          <meshBasicMaterial color={edgeColor} transparent opacity={isActive ? 1.0 : 0.6} />
        </mesh>
      )}
    </group>
  );
}
