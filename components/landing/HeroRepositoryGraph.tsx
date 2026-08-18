"use client";

/**
 * components/landing/HeroRepositoryGraph.tsx — Landing-page hero 3D graph.
 *
 * Rules.md §2: dynamically imported (ssr:false) — this file is the inner component.
 * Small curated mock graph (~28 nodes), complexity-gradient colored per design.md §3.
 * Idle rotation, pointer-proximity glow, prefers-reduced-motion freeze.
 * After 3s idle: one node highlights + citation chip fades in.
 */

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock graph data — illustrative, not real API data
// ---------------------------------------------------------------------------

interface MockNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  complexityScore: number; // 0-10
  loc: number;
  importedByCount: number;
}

interface MockEdge {
  id: string;
  from: string;
  to: string;
}

const MOCK_NODES: MockNode[] = [
  // Core auth cluster
  { id: "n1", name: "middleware.ts", x: 0, y: 0, z: 0, complexityScore: 7.2, loc: 280, importedByCount: 12 },
  { id: "n2", name: "auth.service.ts", x: 4, y: 1, z: -2, complexityScore: 8.1, loc: 420, importedByCount: 14 },
  { id: "n3", name: "session.service.ts", x: 7, y: -1, z: -4, complexityScore: 5.4, loc: 190, importedByCount: 8 },
  { id: "n4", name: "user.repository.ts", x: 10, y: 1, z: -2, complexityScore: 4.2, loc: 210, importedByCount: 6 },
  // API cluster
  { id: "n5", name: "api/repos/route.ts", x: -5, y: 2, z: -3, complexityScore: 6.8, loc: 350, importedByCount: 5 },
  { id: "n6", name: "api/chat/route.ts", x: -9, y: -1, z: -1, complexityScore: 9.2, loc: 580, importedByCount: 3 },
  { id: "n7", name: "api/explore/route.ts", x: -7, y: 3, z: 2, complexityScore: 5.1, loc: 220, importedByCount: 4 },
  // Graph/3D cluster
  { id: "n8", name: "DependencyGraph.tsx", x: 3, y: -4, z: 3, complexityScore: 9.5, loc: 640, importedByCount: 2 },
  { id: "n9", name: "Node.tsx", x: 7, y: -5, z: 4, complexityScore: 7.8, loc: 320, importedByCount: 1 },
  { id: "n10", name: "Edge.tsx", x: 5, y: -7, z: 2, complexityScore: 5.6, loc: 180, importedByCount: 1 },
  // Config/lib cluster
  { id: "n11", name: "lib/db.ts", x: -3, y: 5, z: -5, complexityScore: 2.1, loc: 80, importedByCount: 9 },
  { id: "n12", name: "lib/openai.ts", x: -6, y: 6, z: -3, complexityScore: 3.4, loc: 95, importedByCount: 7 },
  { id: "n13", name: "lib/github.ts", x: -1, y: 7, z: -6, complexityScore: 4.7, loc: 150, importedByCount: 5 },
  // Models cluster
  { id: "n14", name: "models/Repo.ts", x: 2, y: 6, z: 2, complexityScore: 3.2, loc: 120, importedByCount: 8 },
  { id: "n15", name: "models/Module.ts", x: 5, y: 7, z: 0, complexityScore: 4.8, loc: 200, importedByCount: 6 },
  { id: "n16", name: "models/Chat.ts", x: 8, y: 5, z: 3, complexityScore: 2.9, loc: 90, importedByCount: 4 },
  // Parsing cluster
  { id: "n17", name: "parser/imports.ts", x: -4, y: -4, z: -2, complexityScore: 8.7, loc: 490, importedByCount: 3 },
  { id: "n18", name: "parser/layout.ts", x: -2, y: -6, z: -1, complexityScore: 7.4, loc: 380, importedByCount: 2 },
  { id: "n19", name: "parser/complexity.ts", x: -6, y: -5, z: -3, complexityScore: 6.3, loc: 260, importedByCount: 2 },
  // UI cluster
  { id: "n20", name: "ChatPanel.tsx", x: -10, y: 1, z: 4, complexityScore: 8.3, loc: 460, importedByCount: 1 },
  { id: "n21", name: "HealthScoreRing.tsx", x: -12, y: 3, z: 2, complexityScore: 3.1, loc: 110, importedByCount: 3 },
  { id: "n22", name: "RepoCard.tsx", x: -11, y: -2, z: 5, complexityScore: 4.4, loc: 175, importedByCount: 2 },
  // Hooks
  { id: "n23", name: "use-graph-data.ts", x: 0, y: -8, z: 6, complexityScore: 5.9, loc: 230, importedByCount: 2 },
  { id: "n24", name: "use-chat-session.ts", x: -3, y: -9, z: 4, complexityScore: 6.7, loc: 290, importedByCount: 1 },
  // Config
  { id: "n25", name: "middleware.ts", x: 13, y: 0, z: -1, complexityScore: 3.8, loc: 100, importedByCount: 0 },
  { id: "n26", name: "next.config.ts", x: 14, y: 2, z: 1, complexityScore: 1.5, loc: 40, importedByCount: 0 },
  { id: "n27", name: "tailwind.config.ts", x: 15, y: -1, z: -2, complexityScore: 1.2, loc: 55, importedByCount: 0 },
  { id: "n28", name: "globals.css", x: 13, y: -3, z: 2, complexityScore: 1.0, loc: 165, importedByCount: 4 },
];

const MOCK_EDGES: MockEdge[] = [
  { id: "e1", from: "n1", to: "n2" }, { id: "e2", from: "n2", to: "n3" },
  { id: "e3", from: "n3", to: "n4" }, { id: "e4", from: "n1", to: "n5" },
  { id: "e5", from: "n5", to: "n11" }, { id: "e6", from: "n6", to: "n12" },
  { id: "e7", from: "n6", to: "n24" }, { id: "e8", from: "n7", to: "n13" },
  { id: "e9", from: "n8", to: "n9" }, { id: "e10", from: "n8", to: "n10" },
  { id: "e11", from: "n5", to: "n14" }, { id: "e12", from: "n8", to: "n15" },
  { id: "e13", from: "n17", to: "n18" }, { id: "e14", from: "n17", to: "n19" },
  { id: "e15", from: "n20", to: "n24" }, { id: "e16", from: "n23", to: "n15" },
  { id: "e17", from: "n11", to: "n14" }, { id: "e18", from: "n12", to: "n6" },
  { id: "e19", from: "n2", to: "n11" }, { id: "e20", from: "n4", to: "n14" },
];

// ---------------------------------------------------------------------------
// Complexity gradient — exact from design.md (#3DDC97 → #F2B84B → #F0576B)
// ---------------------------------------------------------------------------

function getComplexityColor(score: number): THREE.Color {
  const t = Math.max(0, Math.min(10, score)) / 10;
  const low = new THREE.Color("#3DDC97");
  const mid = new THREE.Color("#F2B84B");
  const high = new THREE.Color("#F0576B");
  if (t < 0.5) return low.clone().lerp(mid, t * 2);
  return mid.clone().lerp(high, (t - 0.5) * 2);
}

// ---------------------------------------------------------------------------
// Inner node mesh
// ---------------------------------------------------------------------------

function HeroNode({
  node,
  isHighlighted,
  reducedMotion,
}: {
  node: MockNode;
  isHighlighted: boolean;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const radius = 0.5 + Math.min(Math.log10(Math.max(1, node.loc)) * 0.28, 0.9);
  const baseColor = getComplexityColor(node.complexityScore);
  const emissiveColor = isHighlighted ? new THREE.Color("#3DDC97") : new THREE.Color("#000000");

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;
    if (isHighlighted) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.1;
      meshRef.current.scale.setScalar(s);
    } else {
      meshRef.current.scale.setScalar(1.0);
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 14, 14]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isHighlighted ? 1.2 : 0.08}
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>
      {isHighlighted && (
        <mesh>
          <ringGeometry args={[radius * 1.35, radius * 1.6, 32]} />
          <meshBasicMaterial color="#3DDC97" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Edge mesh with particle flow
// ---------------------------------------------------------------------------

function HeroEdge({
  from,
  to,
  isActive,
  reducedMotion,
}: {
  from: MockNode;
  to: MockNode;
  isActive: boolean;
  reducedMotion: boolean;
}) {
  const particleRef = useRef<THREE.Mesh>(null);
  const startVec = useMemo(() => new THREE.Vector3(from.x, from.y, from.z), [from.x, from.y, from.z]);
  const endVec = useMemo(() => new THREE.Vector3(to.x, to.y, to.z), [to.x, to.y, to.z]);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array([startVec.x, startVec.y, startVec.z, endVec.x, endVec.y, endVec.z]);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [startVec, endVec]);

  useFrame(({ clock }) => {
    if (reducedMotion || !particleRef.current) return;
    const progress = (clock.getElapsedTime() * (isActive ? 1.4 : 0.6)) % 1.0;
    particleRef.current.position.lerpVectors(startVec, endVec, progress);
  });

  return (
    <group>
      {/* @ts-expect-error R3F line JSX */}
      <line geometry={geometry}>
        <lineBasicMaterial
          color={isActive ? "#3DDC97" : "#7C9CFF"}
          transparent
          opacity={isActive ? 0.9 : 0.32}
        />
      </line>
      <mesh ref={particleRef}>
        <sphereGeometry args={[isActive ? 0.18 : 0.1, 6, 6]} />
        <meshBasicMaterial color={isActive ? "#3DDC97" : "#7C9CFF"} transparent opacity={isActive ? 1.0 : 0.55} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene content with idle rotation
// ---------------------------------------------------------------------------

function HeroSceneContent({
  highlightedId,
  reducedMotion,
}: {
  highlightedId: string | null;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.06;
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.04) * 0.07;
  });

  return (
    <>
      <color attach="background" args={["#0A0C10"]} />
      <fog attach="fog" args={["#0A0C10", 30, 80]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[20, 30, 20]} intensity={1.1} />
      <pointLight position={[-15, -15, -15]} intensity={0.5} color="#7C9CFF" />
      <Stars radius={100} depth={40} count={800} factor={2.5} saturation={0} fade speed={reducedMotion ? 0 : 1} />

      <group ref={groupRef}>
        {MOCK_EDGES.map((edge) => {
          const fromNode = MOCK_NODES.find((n) => n.id === edge.from);
          const toNode = MOCK_NODES.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const isActive = highlightedId === edge.from || highlightedId === edge.to;
          return (
            <HeroEdge key={edge.id} from={fromNode} to={toNode} isActive={isActive} reducedMotion={reducedMotion} />
          );
        })}

        {MOCK_NODES.map((node) => (
          <HeroNode
            key={node.id}
            node={node}
            isHighlighted={node.id === highlightedId}
            reducedMotion={reducedMotion}
          />
        ))}
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Citation chip overlay (the "micro AI beat")
// ---------------------------------------------------------------------------

const HIGHLIGHT_NODE = MOCK_NODES.find((n) => n.id === "n2")!; // auth.service.ts — referenced by 14

function CitationOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs border bg-accent/15 border-accent/30 text-accent shadow-lg pointer-events-none"
          aria-label="auth.service.ts — Referenced by 14 modules"
        >
          <FileCode className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold">auth.service.ts</span>
          <span className="text-accent/70">· Referenced by 14 modules</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

export function HeroRepositoryGraph() {
  const [showCitation, setShowCitation] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Micro AI beat: after 3s, highlight auth.service.ts and show chip
  useEffect(() => {
    if (reducedMotion) return;
    const t = setTimeout(() => setShowCitation(true), 3000);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  return (
    <div className="relative w-full h-full" aria-label="Interactive 3D dependency graph visualization">
      <Canvas
        camera={{ position: [0, 8, 32], fov: 50, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false }}
        aria-hidden="true"
      >
        <HeroSceneContent
          highlightedId={showCitation && !reducedMotion ? HIGHLIGHT_NODE.id : null}
          reducedMotion={reducedMotion}
        />
      </Canvas>
      <CitationOverlay visible={showCitation && !reducedMotion} />
    </div>
  );
}
