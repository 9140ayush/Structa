"use client";

/**
 * components/landing/structa-3d/ArchitectureLayer.tsx
 *
 * Organized architecture map — the visual transformation from complex
 * dependencies into a clean, labeled structural layout.
 *
 * Each architecture block is a transparent glass panel with an Html label.
 * Connection lines between panels are rendered as BufferGeometry lines.
 *
 * Props:
 *   yOffset       — vertical scroll-driven displacement
 *   opacity       — fade in/out driven by scroll
 *   reducedMotion — disables idle animation
 */

import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { ARCH_BLOCKS, ARCH_CONNECTIONS, ArchBlock, COLORS } from "./sceneData";

// ---------------------------------------------------------------------------
// Glass panel for one architecture block
// ---------------------------------------------------------------------------

function ArchPanel({
  block,
  yOffset,
  opacity,
}: {
  block: ArchBlock;
  yOffset: number;
  opacity: number;
}) {
  const bodyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(block.color),
        emissive: new THREE.Color(block.color),
        emissiveIntensity: 0.08,
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: Math.max(0, opacity * 0.14),
        side: THREE.DoubleSide,
      }),
    [block.color, opacity],
  );

  const edgeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(block.color),
        transparent: true,
        opacity: Math.max(0, opacity * 0.55),
        wireframe: true,
      }),
    [block.color, opacity],
  );

  const labelOpacity = Math.max(0, Math.min(1, opacity));

  return (
    <group position={[block.x, block.y + yOffset, block.z]}>
      {/* Glass fill */}
      <mesh material={bodyMat}>
        <boxGeometry args={[block.width, 1.2, block.depth]} />
      </mesh>

      {/* Wire frame border */}
      <mesh material={edgeMat}>
        <boxGeometry args={[block.width + 0.05, 1.25, block.depth + 0.05]} />
      </mesh>

      {/* Html label */}
      <Html
        position={[0, 0.9, 0]}
        center
        distanceFactor={20}
        zIndexRange={[50, 0]}
        style={{ pointerEvents: "none", opacity: labelOpacity }}
      >
        <div
          style={{
            textAlign: "center",
            minWidth: 80,
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 700,
              color: block.color,
              margin: 0,
              textShadow: `0 0 10px ${block.color}80`,
              whiteSpace: "nowrap",
            }}
          >
            {block.label}
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 8.5,
              color: COLORS.mutedFg,
              margin: "2px 0 0 0",
              whiteSpace: "nowrap",
            }}
          >
            {block.sublabel}
          </p>
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Connection line between architecture blocks
// ---------------------------------------------------------------------------

function ArchConnection({
  fromBlock,
  toBlock,
  yOffset,
  opacity,
}: {
  fromBlock: ArchBlock;
  toBlock: ArchBlock;
  yOffset: number;
  opacity: number;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array([
      fromBlock.x,
      fromBlock.y + yOffset,
      fromBlock.z,
      toBlock.x,
      toBlock.y + yOffset,
      toBlock.z,
    ]);
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [fromBlock.x, fromBlock.y, fromBlock.z, toBlock.x, toBlock.y, toBlock.z, yOffset]);

  return (
    // @ts-expect-error R3F line JSX
    <line geometry={geometry}>
      <lineBasicMaterial color={COLORS.border} transparent opacity={Math.max(0, opacity * 0.5)} />
    </line>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface ArchitectureLayerProps {
  yOffset?: number;
  opacity?: number;
  reducedMotion?: boolean;
}

export function ArchitectureLayer({ yOffset = 0, opacity = 1 }: ArchitectureLayerProps) {
  const blockMap = useMemo(() => {
    const m = new Map<string, ArchBlock>();
    for (const b of ARCH_BLOCKS) m.set(b.id, b);
    return m;
  }, []);

  return (
    <group>
      {/* Architecture block panels */}
      {ARCH_BLOCKS.map((block) => (
        <ArchPanel key={block.id} block={block} yOffset={yOffset} opacity={opacity} />
      ))}

      {/* Connection lines */}
      {ARCH_CONNECTIONS.map((conn) => {
        const from = blockMap.get(conn.from);
        const to = blockMap.get(conn.to);
        if (!from || !to) return null;
        return (
          <ArchConnection
            key={conn.id}
            fromBlock={from}
            toBlock={to}
            yOffset={yOffset}
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}
