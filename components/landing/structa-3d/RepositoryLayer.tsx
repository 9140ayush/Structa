"use client";

/**
 * components/landing/structa-3d/RepositoryLayer.tsx
 *
 * Bottom layer of the Structa 3D exploder.
 * Represents a raw GitHub repository — dark glass container with
 * folder and file geometry arranged inside.
 *
 * Props:
 *   yOffset — vertical scroll-driven displacement (added to base y=-7)
 *   opacity  — fade in/out driven by scroll progress
 *   reducedMotion — disables idle animation
 */

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { REPO_ENTRIES, COLORS } from "./sceneData";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RepositoryLayerProps {
  yOffset?: number;
  opacity?: number;
  reducedMotion?: boolean;
}

// ---------------------------------------------------------------------------
// Folder entry mesh
// ---------------------------------------------------------------------------

function FolderMesh({ x, z, reducedMotion }: { x: number; z: number; reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.accent),
        emissive: new THREE.Color(COLORS.accent),
        emissiveIntensity: 0.12,
        metalness: 0.5,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.08 + x;
  });

  return (
    <mesh ref={meshRef} position={[x, 0.35, z]} material={mat} castShadow={false}>
      <boxGeometry args={[0.55, 0.42, 0.42]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// File entry mesh (thin flat plane)
// ---------------------------------------------------------------------------

function FileMesh({ x, z }: { x: number; z: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(COLORS.foreground),
        emissive: new THREE.Color(COLORS.primary),
        emissiveIntensity: 0.04,
        metalness: 0.2,
        roughness: 0.45,
        transparent: true,
        opacity: 0.6,
      }),
    [],
  );

  return (
    <mesh position={[x, 0.25, z]} rotation={[-0.1, 0, 0]} material={mat}>
      <boxGeometry args={[0.45, 0.56, 0.04]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Repository container box (dark glass)
// ---------------------------------------------------------------------------

function RepoContainer({ opacity }: { opacity: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#0D1018"),
        emissive: new THREE.Color(COLORS.primary),
        emissiveIntensity: 0.04,
        metalness: 0.6,
        roughness: 0.15,
        transparent: true,
        opacity: Math.max(0, opacity * 0.82),
        side: THREE.FrontSide,
      }),
    [opacity],
  );

  const edgeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLORS.primary),
        transparent: true,
        opacity: Math.max(0, opacity * 0.35),
        wireframe: false,
      }),
    [opacity],
  );

  return (
    <group>
      {/* Main glass shell */}
      <mesh position={[0, 0, 0]} material={mat}>
        <boxGeometry args={[14, 2.2, 9]} />
      </mesh>
      {/* Glowing edge frame */}
      <mesh position={[0, 0, 0]} material={edgeMat}>
        <boxGeometry args={[14.08, 2.28, 9.08]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function RepositoryLayer({
  yOffset = 0,
  opacity = 1,
  reducedMotion = false,
}: RepositoryLayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const BASE_Y = -7;

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = BASE_Y + yOffset;
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Group || child instanceof THREE.Mesh) {
        // Update opacity on container
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, BASE_Y, 0]}>
      <RepoContainer opacity={opacity} />

      {/* Label badge */}
      <mesh position={[-6.4, 1.4, 0]}>
        <boxGeometry args={[1.6, 0.3, 0.04]} />
        <meshBasicMaterial
          color={new THREE.Color(COLORS.primary)}
          transparent
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* Folder and file entries inside the container */}
      {!reducedMotion || true
        ? REPO_ENTRIES.map((entry) =>
            entry.kind === "folder" ? (
              <FolderMesh key={entry.id} x={entry.x} z={entry.z} reducedMotion={reducedMotion} />
            ) : (
              <FileMesh key={entry.id} x={entry.x} z={entry.z} />
            ),
          )
        : null}

      {/* Grid floor lines inside container */}
      {[-6, -4, -2, 0, 2, 4, 6].map((x) => (
        <mesh key={`gl-${x}`} position={[x, -0.95, 0]}>
          <boxGeometry args={[0.01, 0.01, 8.8]} />
          <meshBasicMaterial color={new THREE.Color(COLORS.border)} transparent opacity={0.4} />
        </mesh>
      ))}
      {[-3.5, -1, 1, 3.5].map((z) => (
        <mesh key={`gz-${z}`} position={[0, -0.95, z]}>
          <boxGeometry args={[13.8, 0.01, 0.01]} />
          <meshBasicMaterial color={new THREE.Color(COLORS.border)} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}
