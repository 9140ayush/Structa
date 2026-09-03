"use client";

/**
 * components/landing/structa-3d/CodeModules.tsx
 *
 * Code module clusters — the organized software components extracted
 * from the raw repository. Each cluster floats above the repository
 * and below the dependency graph.
 *
 * Uses Float from drei for gentle idle drift.
 * Hover shows an Html label panel via drei Html.
 *
 * Props:
 *   yOffset       — vertical scroll-driven displacement
 *   opacity       — fade in/out driven by scroll
 *   reducedMotion — disables Float and idle animations
 */

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { MODULE_CLUSTERS, ModuleCluster, COLORS } from "./sceneData";

// ---------------------------------------------------------------------------
// Sub-module box (small building block within a cluster)
// ---------------------------------------------------------------------------

function SubModule({
  position,
  color,
  isActive,
}: {
  position: [number, number, number];
  color: string;
  isActive: boolean;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: isActive ? 0.55 : 0.1,
        metalness: 0.55,
        roughness: 0.2,
        transparent: true,
        opacity: isActive ? 0.95 : 0.78,
      }),
    [color, isActive],
  );

  return (
    <mesh position={position} material={mat}>
      <boxGeometry args={[0.38, 0.38, 0.38]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Sub-module offsets for each cluster size
// ---------------------------------------------------------------------------

const SUB_MODULE_OFFSETS: Record<number, Array<[number, number, number]>> = {
  3: [
    [0, 0, 0],
    [0.55, 0, 0],
    [0, 0.55, 0],
  ],
  4: [
    [0, 0, 0],
    [0.55, 0, 0],
    [0, 0.55, 0],
    [0.55, 0.55, 0],
  ],
  5: [
    [0, 0, 0],
    [0.55, 0, 0],
    [0, 0.55, 0],
    [0.55, 0.55, 0],
    [0.27, 0.27, 0.55],
  ],
};

// ---------------------------------------------------------------------------
// Single cluster group
// ---------------------------------------------------------------------------

function ModuleClusterMesh({
  cluster,
  yOffset,
  opacity,
  reducedMotion,
}: {
  cluster: ModuleCluster;
  yOffset: number;
  opacity: number;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const BASE_Y = cluster.y;

  const offsets = SUB_MODULE_OFFSETS[cluster.subModuleCount] ?? SUB_MODULE_OFFSETS[3];

  // Container box material
  const containerMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(cluster.color),
        emissive: new THREE.Color(cluster.color),
        emissiveIntensity: hovered ? 0.35 : 0.07,
        metalness: 0.5,
        roughness: 0.18,
        transparent: true,
        opacity: hovered ? 0.25 : 0.12,
        side: THREE.DoubleSide,
      }),
    [cluster.color, hovered],
  );

  const borderMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(cluster.color),
        transparent: true,
        opacity: hovered ? opacity * 0.8 : opacity * 0.3,
        wireframe: true,
      }),
    [cluster.color, hovered, opacity],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = BASE_Y + yOffset;
  });

  const floatContent = (
    <group ref={groupRef} position={[cluster.x, BASE_Y, cluster.z]}>
      {/* Container box */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        material={containerMat}
      >
        <boxGeometry args={[2, 1.6, 1.6]} />
      </mesh>

      {/* Wireframe border */}
      <mesh material={borderMat}>
        <boxGeometry args={[2.02, 1.62, 1.62]} />
      </mesh>

      {/* Sub-modules */}
      <group position={[-0.42, -0.35, -0.35]}>
        {offsets.map((pos, idx) => (
          <SubModule key={idx} position={pos} color={cluster.color} isActive={hovered} />
        ))}
      </group>

      {/* Label panel */}
      {hovered && (
        <Html
          position={[0, 1.4, 0]}
          center
          distanceFactor={20}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(18,21,27,0.92)",
              border: `1px solid ${cluster.color}55`,
              borderRadius: 8,
              padding: "6px 12px",
              minWidth: 120,
              boxShadow: `0 0 16px ${cluster.color}30`,
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                fontWeight: 700,
                color: cluster.color,
                margin: 0,
              }}
            >
              {cluster.label}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: COLORS.mutedFg,
                margin: "2px 0 0 0",
              }}
            >
              {cluster.subModuleCount} modules
            </p>
          </div>
        </Html>
      )}
    </group>
  );

  if (reducedMotion) return floatContent;

  return (
    <Float speed={0.8 + cluster.importance * 0.6} rotationIntensity={0.08} floatIntensity={0.25}>
      {floatContent}
    </Float>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface CodeModulesProps {
  yOffset?: number;
  opacity?: number;
  reducedMotion?: boolean;
}

export function CodeModules({ yOffset = 0, opacity = 1, reducedMotion = false }: CodeModulesProps) {
  return (
    <group>
      {MODULE_CLUSTERS.map((cluster) => (
        <ModuleClusterMesh
          key={cluster.id}
          cluster={cluster}
          yOffset={yOffset}
          opacity={opacity}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
