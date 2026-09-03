"use client";

/**
 * components/landing/structa-3d/Structa3DScene.tsx
 *
 * Main scene compositor for the Structa 3D exploded-view product visualization.
 *
 * Responsibilities:
 *   - Assembles RepositoryLayer, CodeModules, DependencyGraph,
 *     ArchitectureLayer, AIIntelligence, InsightPanels, SceneLighting
 *   - Manages scroll-driven layer separation via a scrollRef (avoids React
 *     state in useFrame — instead reads a ref synced from a scroll listener)
 *   - Handles mouse parallax camera drift via useFrame
 *   - Passes reducedMotion down to all children
 *
 * Scroll timeline (mapped to scrollRef.current 0–1):
 *   0.00–0.20  Repository visible, other layers compact
 *   0.20–0.40  Modules lift out of repository
 *   0.40–0.60  Dependency graph separates
 *   0.60–0.75  Architecture layer rises
 *   0.75–0.90  AI core activates
 *   0.90–1.00  Insight panels fade in
 */

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneLighting } from "./SceneLighting";
import { RepositoryLayer } from "./RepositoryLayer";
import { CodeModules } from "./CodeModules";
import { DependencyGraph } from "./DependencyGraph";
import { ArchitectureLayer } from "./ArchitectureLayer";
import { AIIntelligence } from "./AIIntelligence";
import { InsightPanels } from "./InsightPanels";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Structa3DSceneProps {
  scrollRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
}

// ---------------------------------------------------------------------------
// Utility: smooth clamped range mapping
// ---------------------------------------------------------------------------

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

// ---------------------------------------------------------------------------
// Scene parallax group (shifts scene content slightly toward mouse)
// Using a group shift instead of camera mutation avoids react-hooks/immutability.
// ---------------------------------------------------------------------------

function ParallaxGroup({
  mouseRef,
  reducedMotion,
  children,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetOffset = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;

    // Subtle inverse parallax — scene shifts opposite to mouse = camera parallax feel
    targetOffset.current.x += (-mouseRef.current.x * 0.8 - targetOffset.current.x) * delta * 1.2;
    targetOffset.current.y += (-mouseRef.current.y * 0.4 - targetOffset.current.y) * delta * 1.2;

    groupRef.current.position.x = targetOffset.current.x;
    groupRef.current.position.y = targetOffset.current.y;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Main scene content (inner — runs inside Canvas)
// ---------------------------------------------------------------------------

export function Structa3DScene({ scrollRef, mouseRef, reducedMotion }: Structa3DSceneProps) {
  // Layer y-offsets — driven by useFrame reading scrollRef
  const repoOffsetRef = useRef(0);
  const modulesOffsetRef = useRef(0);
  const graphOffsetRef = useRef(0);
  const archOffsetRef = useRef(0);
  const aiOffsetRef = useRef(0);

  // Opacity refs
  const repoOpacityRef = useRef(1);
  const modulesOpacityRef = useRef(0);
  const graphOpacityRef = useRef(0);
  const archOpacityRef = useRef(0);
  const aiOpacityRef = useRef(0);
  const insightOpacityRef = useRef(0);

  // Dummy state to trigger re-render each frame with latest values
  const [layerState, setLayerState] = React.useState({
    repoOffset: 0,
    modulesOffset: 0,
    graphOffset: 0,
    archOffset: 0,
    aiOffset: 0,
    repoOpacity: 1,
    modulesOpacity: 0,
    graphOpacity: 0,
    archOpacity: 0,
    aiOpacity: 0,
    insightOpacity: 0,
    scrollProgress: 0,
  });

  const frameCount = useRef(0);

  useFrame((_, delta) => {
    const s = scrollRef.current;
    const lerpFactor = Math.min(delta * 8.0, 1);

    // --- Layer y-offsets (separation on scroll) ---
    // Repository: stays put (base y=-7), slight downward push after 20%
    const targetRepoOffset = mapRange(s, 0.2, 0.6, 0, -1.5);
    repoOffsetRef.current += (targetRepoOffset - repoOffsetRef.current) * lerpFactor;

    // Code modules: lift from inside repo
    const targetModulesOffset = mapRange(s, 0.15, 0.55, 0, 2.5);
    modulesOffsetRef.current += (targetModulesOffset - modulesOffsetRef.current) * lerpFactor;

    // Dependency graph: rises and spreads
    const targetGraphOffset = mapRange(s, 0.3, 0.7, 0, 1.5);
    graphOffsetRef.current += (targetGraphOffset - graphOffsetRef.current) * lerpFactor;

    // Architecture layer: lifts higher
    const targetArchOffset = mapRange(s, 0.5, 0.85, 0, 1.5);
    archOffsetRef.current += (targetArchOffset - archOffsetRef.current) * lerpFactor;

    // AI core: stays high, subtle activation pulse could live here
    const targetAiOffset = mapRange(s, 0.65, 0.95, 0, 0.8);
    aiOffsetRef.current += (targetAiOffset - aiOffsetRef.current) * lerpFactor;

    // --- Opacities ---
    repoOpacityRef.current +=
      (mapRange(s, 0.0, 0.15, 0.4, 1.0) - repoOpacityRef.current) * lerpFactor;
    modulesOpacityRef.current +=
      (mapRange(s, 0.1, 0.4, 0, 1) - modulesOpacityRef.current) * lerpFactor;
    graphOpacityRef.current +=
      (mapRange(s, 0.25, 0.6, 0, 1) - graphOpacityRef.current) * lerpFactor;
    archOpacityRef.current += (mapRange(s, 0.45, 0.75, 0, 1) - archOpacityRef.current) * lerpFactor;
    aiOpacityRef.current += (mapRange(s, 0.6, 0.9, 0, 1) - aiOpacityRef.current) * lerpFactor;
    insightOpacityRef.current +=
      (mapRange(s, 0.82, 1.0, 0, 1) - insightOpacityRef.current) * lerpFactor;

    // Throttle state updates to every 2 frames to reduce React overhead
    frameCount.current++;
    if (frameCount.current % 2 === 0) {
      setLayerState({
        repoOffset: repoOffsetRef.current,
        modulesOffset: modulesOffsetRef.current,
        graphOffset: graphOffsetRef.current,
        archOffset: archOffsetRef.current,
        aiOffset: aiOffsetRef.current,
        repoOpacity: repoOpacityRef.current,
        modulesOpacity: modulesOpacityRef.current,
        graphOpacity: graphOpacityRef.current,
        archOpacity: archOpacityRef.current,
        aiOpacity: aiOpacityRef.current,
        insightOpacity: insightOpacityRef.current,
        scrollProgress: s,
      });
    }
  });

  return (
    <>
      {/* Scene backdrop */}
      <color attach="background" args={["#0A0C10"]} />
      <fog attach="fog" args={["#0A0C10", 40, 100]} />

      {/* Lighting (outside parallax group so it illuminates uniformly) */}
      <SceneLighting />

      {/* Background particles */}
      {!reducedMotion && <BackgroundParticles />}

      {/* Parallax group wraps all scene geometry */}
      <ParallaxGroup mouseRef={mouseRef} reducedMotion={reducedMotion}>
        {/* Repository layer — bottom */}
        <RepositoryLayer
          yOffset={layerState.repoOffset}
          opacity={layerState.repoOpacity}
          reducedMotion={reducedMotion}
        />

        {/* Code module clusters */}
        <CodeModules
          yOffset={layerState.modulesOffset}
          opacity={layerState.modulesOpacity}
          reducedMotion={reducedMotion}
        />

        {/* Dependency graph */}
        <DependencyGraph
          yOffset={layerState.graphOffset}
          opacity={layerState.graphOpacity}
          reducedMotion={reducedMotion}
        />

        {/* Architecture layer */}
        <ArchitectureLayer
          yOffset={layerState.archOffset}
          opacity={layerState.archOpacity}
          reducedMotion={reducedMotion}
        />

        {/* AI intelligence core */}
        <AIIntelligence
          yOffset={layerState.aiOffset}
          opacity={layerState.aiOpacity}
          reducedMotion={reducedMotion}
          scrollProgress={layerState.scrollProgress}
        />

        {/* Floating insight panels */}
        <InsightPanels
          yOffset={layerState.aiOffset}
          opacity={layerState.insightOpacity}
          reducedMotion={reducedMotion}
        />
      </ParallaxGroup>
    </>
  );
}

// ---------------------------------------------------------------------------
// Background micro-particles (ambient atmosphere)
// ---------------------------------------------------------------------------

const BG_PARTICLE_COUNT = 80;
const bgParticlePositions = new Float32Array(BG_PARTICLE_COUNT * 3);
for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
  bgParticlePositions[i * 3 + 0] = (Math.random() - 0.5) * 40;
  bgParticlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
  bgParticlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
}

function BackgroundParticles() {
  const ref = useRef<THREE.Points>(null);

  const geometry = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(bgParticlePositions, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.012;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color={new THREE.Color("#7C9CFF")}
        size={0.06}
        transparent
        opacity={0.28}
        sizeAttenuation
      />
    </points>
  );
}
