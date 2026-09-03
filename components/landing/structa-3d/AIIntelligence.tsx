"use client";

/**
 * components/landing/structa-3d/AIIntelligence.tsx
 *
 * AI Intelligence core — the apex of the Structa 3D exploder.
 * NOT a robot, NOT a brain, NOT a chatbot icon.
 *
 * Instead: concentric rotating torus rings + central icosahedral cluster
 * + upward-flowing data particles = abstract intelligence analyzing code below.
 *
 * Props:
 *   yOffset       — vertical scroll-driven displacement
 *   opacity       — fade in driven by scroll
 *   reducedMotion — disables ring rotation and particles
 *   scrollProgress — 0–1, drives activation intensity
 */

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AI_CONFIG, COLORS } from "./sceneData";

// ---------------------------------------------------------------------------
// Ring configuration
// ---------------------------------------------------------------------------

const RING_SPEEDS = [0.18, -0.13, 0.09, -0.07]; // radians/sec, alternating directions
const RING_TILTS: Array<[number, number, number]> = [
  [0, 0, 0],
  [Math.PI / 3, 0, 0],
  [0, 0, Math.PI / 4],
  [Math.PI / 5, Math.PI / 6, 0],
];
const RING_COLORS = [COLORS.primary, COLORS.accent, COLORS.violet, COLORS.primary];

// ---------------------------------------------------------------------------
// Single torus ring
// ---------------------------------------------------------------------------

function AIRing({
  radius,
  speed,
  tilt,
  color,
  opacity,
  reducedMotion,
}: {
  radius: number;
  speed: number;
  tilt: [number, number, number];
  color: string;
  opacity: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.1,
        transparent: true,
        opacity: Math.max(0, opacity * 0.75),
      }),
    [color, opacity],
  );

  useFrame((_, delta) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.y += speed * delta;
    ref.current.rotation.z += speed * 0.4 * delta;
  });

  return (
    <mesh ref={ref} rotation={tilt} material={mat}>
      <torusGeometry args={[radius, 0.055, 12, 80]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Central node cluster (icosahedra)
// ---------------------------------------------------------------------------

const CENTRAL_NODES: Array<{ pos: [number, number, number]; size: number; color: string }> = [
  { pos: [0, 0, 0], size: 0.55, color: COLORS.primary },
  { pos: [0.9, 0.3, 0.4], size: 0.28, color: COLORS.accent },
  { pos: [-0.8, 0.2, -0.5], size: 0.22, color: COLORS.violet },
  { pos: [0.3, -0.7, 0.6], size: 0.2, color: COLORS.primary },
  { pos: [-0.4, 0.7, -0.3], size: 0.18, color: COLORS.accent },
  { pos: [0, 0, 1.0], size: 0.16, color: COLORS.violet },
];

function CentralCluster({ opacity, reducedMotion }: { opacity: number; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.12;
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.08) * 0.15;
  });

  return (
    <group ref={groupRef}>
      {CENTRAL_NODES.map((n, i) => (
        <mesh key={i} position={n.pos}>
          <icosahedronGeometry args={[n.size, 0]} />
          <meshPhysicalMaterial
            color={new THREE.Color(n.color)}
            emissive={new THREE.Color(n.color)}
            emissiveIntensity={0.7}
            metalness={0.5}
            roughness={0.15}
            transparent
            opacity={Math.max(0, opacity * 0.9)}
          />
        </mesh>
      ))}

      {/* Connecting lines between central nodes */}
      {CENTRAL_NODES.slice(1).map((n, i) => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
          CENTRAL_NODES[0].pos[0],
          CENTRAL_NODES[0].pos[1],
          CENTRAL_NODES[0].pos[2],
          n.pos[0],
          n.pos[1],
          n.pos[2],
        ]);
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return (
          // @ts-expect-error R3F line JSX
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color={COLORS.primary}
              transparent
              opacity={Math.max(0, opacity * 0.4)}
            />
          </line>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Upward data flow particles
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = AI_CONFIG.particleCount;
// Pre-compute random start positions and phases
const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  radiusVariance: 0.5 + Math.random() * 2.5,
  phase: Math.random() * Math.PI * 2,
  speed: 0.25 + Math.random() * 0.35,
  xOffset: (Math.random() - 0.5) * 8,
  zOffset: (Math.random() - 0.5) * 8,
}));

function DataFlowParticles({
  yCenter,
  opacity,
  reducedMotion,
}: {
  yCenter: number;
  opacity: number;
  reducedMotion: boolean;
}) {
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    particleData.forEach((p, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      // Travel from y=-8 up to yCenter
      const progress = (t * p.speed + p.phase) % 1.0;
      const y = -8 + progress * (yCenter + 10);
      mesh.position.set(p.xOffset * (1 - progress), y, p.zOffset * (1 - progress));
      const fadeIn = Math.min(progress * 5, 1);
      const fadeOut = 1 - Math.max((progress - 0.8) * 5, 0);
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        opacity * fadeIn * fadeOut * 0.65,
      );
    });
  });

  return (
    <>
      {particleData.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[0, -8, 0]}
        >
          <sphereGeometry args={[0.045, 4, 4]} />
          <meshBasicMaterial color={COLORS.primary} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface AIIntelligenceProps {
  yOffset?: number;
  opacity?: number;
  reducedMotion?: boolean;
  scrollProgress?: number;
}

export function AIIntelligence({
  yOffset = 0,
  opacity = 1,
  reducedMotion = false,
}: AIIntelligenceProps) {
  const BASE_Y = AI_CONFIG.yCenter;

  return (
    <group position={[0, BASE_Y + yOffset, 0]}>
      {/* Concentric torus rings */}
      {Array.from({ length: AI_CONFIG.ringCount }).map((_, i) => {
        const radius = AI_CONFIG.innerRadius + i * AI_CONFIG.ringGap;
        return (
          <AIRing
            key={i}
            radius={radius}
            speed={RING_SPEEDS[i]}
            tilt={RING_TILTS[i]}
            color={RING_COLORS[i]}
            opacity={opacity}
            reducedMotion={reducedMotion}
          />
        );
      })}

      {/* Central icosahedral cluster */}
      <CentralCluster opacity={opacity} reducedMotion={reducedMotion} />

      {/* Ambient glow sphere (very large, transparent) */}
      <mesh>
        <sphereGeometry
          args={[AI_CONFIG.innerRadius + AI_CONFIG.ringCount * AI_CONFIG.ringGap + 0.5, 16, 16]}
        />
        <meshPhysicalMaterial
          color={new THREE.Color(COLORS.violet)}
          emissive={new THREE.Color(COLORS.violet)}
          emissiveIntensity={0.12}
          transparent
          opacity={Math.max(0, opacity * 0.06)}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Data flow particles (positioned in world space, not relative to AI core) */}
      <group position={[0, -BASE_Y - yOffset, 0]}>
        <DataFlowParticles
          yCenter={BASE_Y + yOffset}
          opacity={opacity}
          reducedMotion={reducedMotion}
        />
      </group>
    </group>
  );
}
