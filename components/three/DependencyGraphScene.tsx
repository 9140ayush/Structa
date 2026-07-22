"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { GraphPayload, GraphNode } from "@/types/graph";
import { Node } from "./Node";
import { Edge } from "./Edge";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DependencyGraphSceneProps {
  data: GraphPayload;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onHoverNode: (nodeId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Camera Controller with Damped Lerp Fly-To
// ---------------------------------------------------------------------------

function CameraController({ selectedNode }: { selectedNode: GraphNode | null }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (selectedNode) {
      // Calculate camera offset position for selected node
      targetPos.current = new THREE.Vector3(
        selectedNode.x + 12,
        selectedNode.y + 8,
        selectedNode.z + 18,
      );
      targetLookAt.current = new THREE.Vector3(selectedNode.x, selectedNode.y, selectedNode.z);
    }
  }, [selectedNode]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (targetPos.current && targetLookAt.current) {
      // Damped lerp for smooth camera fly-to-node (motion-camera token: cubic-bezier)
      const lerpFactor = Math.min(delta * 3.5, 1.0);
      camera.position.lerp(targetPos.current, lerpFactor);
      controlsRef.current.target.lerp(targetLookAt.current, lerpFactor);
      controlsRef.current.update();

      // Stop lerping when close enough
      if (
        camera.position.distanceTo(targetPos.current) < 0.1 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.1
      ) {
        targetPos.current = null;
        targetLookAt.current = null;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      maxDistance={250}
      minDistance={2}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Scene Content
// ---------------------------------------------------------------------------

function SceneContent({
  data,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
}: DependencyGraphSceneProps) {
  // Map nodes for fast lookup by ID
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of data.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [data.nodes]);

  // Selected node reference for camera targeting
  const selectedNode = useMemo(() => {
    return selectedNodeId ? (nodeMap.get(selectedNodeId) ?? null) : null;
  }, [selectedNodeId, nodeMap]);

  // Active edges connected to hovered or selected node
  const activeEdgeIds = useMemo(() => {
    const active = new Set<string>();
    const activeId = selectedNodeId || hoveredNodeId;
    if (!activeId) return active;

    for (const edge of data.edges) {
      if (edge.from === activeId || edge.to === activeId) {
        active.add(edge.id);
      }
    }
    return active;
  }, [selectedNodeId, hoveredNodeId, data.edges]);

  return (
    <>
      {/* Background void color & fog fading distant nodes */}
      <color attach="background" args={["#0A0C10"]} />
      <fog attach="fog" args={["#0A0C10", 60, 220]} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[30, 50, 30]} intensity={1.2} />
      <pointLight position={[-20, -20, -20]} intensity={0.5} color="#7C9CFF" />

      {/* Starfield particle drift */}
      <Stars radius={150} depth={50} count={1200} factor={3} saturation={0} fade speed={1} />

      {/* Orbit Controls & Camera Controller */}
      <CameraController selectedNode={selectedNode} />

      {/* Render Edges */}
      <group>
        {data.edges.map((edge) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <Edge
              key={edge.id}
              edge={edge}
              fromNode={fromNode}
              toNode={toNode}
              isActive={activeEdgeIds.has(edge.id)}
              isLODActive={data.lod.isLODActive}
            />
          );
        })}
      </group>

      {/* Render Nodes */}
      <group>
        {data.nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isHovered={hoveredNodeId === node.id}
            isLODActive={data.lod.isLODActive}
            onSelect={(id) => onSelectNode(id)}
            onHover={(id) => onHoverNode(id)}
          />
        ))}
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported Component Container
// ---------------------------------------------------------------------------

export default function DependencyGraphScene(props: DependencyGraphSceneProps) {
  return (
    <div
      className="relative w-full h-full cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        // Deselect when clicking empty background space
        if (e.target === e.currentTarget) {
          props.onSelectNode(null);
        }
      }}
    >
      <Canvas
        camera={{ position: [0, 25, 60], fov: 45, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
