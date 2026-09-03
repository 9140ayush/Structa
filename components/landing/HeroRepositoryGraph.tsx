"use client";

/**
 * components/landing/HeroRepositoryGraph.tsx — Structa 3D Product Explainer.
 *
 * Replaces the original dependency-ball scene with a full exploded-view
 * architecture visualization: Repository → Code Modules → Dependency Graph
 * → Architecture → AI Intelligence → Understanding.
 *
 * Rules.md §2: dynamically imported (ssr:false) — this file is the inner component.
 * Next.js 16.2.11 breaking change: ssr:false is only allowed in Client Components.
 *
 * Scroll-driven animation:
 *   - A scroll listener updates a ref (avoids React state, no re-renders in useFrame)
 *   - The Canvas scene reads the ref every frame via useFrame
 *
 * Mouse parallax:
 *   - Pointer events update a mouseRef
 *   - CameraParallax inside the scene reads it
 *
 * prefers-reduced-motion:
 *   - Detected via matchMedia, collapses all animation
 *
 * Mobile:
 *   - Canvas is rendered at reduced resolution via dpr prop
 *   - Particle count is reduced (handled inside sceneData AI_CONFIG)
 *
 * WebGL fallback:
 *   - StaticFallback is shown if WebGL is unavailable
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { Structa3DScene } from "./structa-3d/Structa3DScene";

// ---------------------------------------------------------------------------
// WebGL availability check
// ---------------------------------------------------------------------------

function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Static fallback (no WebGL or reduced-motion with static preference)
// ---------------------------------------------------------------------------

function StaticFallback() {
  const layers = [
    { label: "Repository", color: "#EDEFF3" },
    { label: "Code Modules", color: "#7C9CFF" },
    { label: "Dependency Graph", color: "#3DDC97" },
    { label: "Architecture", color: "#9B7DFF" },
    { label: "AI Intelligence", color: "#3DDC97" },
    { label: "Understanding", color: "#3DDC97" },
  ];

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#0A0C10] px-6"
      aria-label="Structa transformation: Repository to Understanding"
      role="img"
    >
      {layers.map((layer, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 w-full max-w-xs">
          <div
            className="w-full px-4 py-2.5 rounded-[8px] border text-center font-mono text-xs font-semibold"
            style={{
              borderColor: `${layer.color}30`,
              background: `${layer.color}0D`,
              color: layer.color,
            }}
          >
            {layer.label}
          </div>
          {i < layers.length - 1 && <span className="text-[#242833] font-mono text-[10px]">↓</span>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scroll progress indicator overlay
// ---------------------------------------------------------------------------

function ScrollProgress({ progress }: { progress: number }) {
  const stages = [
    { label: "Repository", threshold: 0.05 },
    { label: "Modules", threshold: 0.3 },
    { label: "Graph", threshold: 0.5 },
    { label: "Architecture", threshold: 0.65 },
    { label: "AI", threshold: 0.8 },
    { label: "Insights", threshold: 0.9 },
  ];

  const activeIndex = stages.reduce((acc, stage, i) => (progress >= stage.threshold ? i : acc), 0);

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none"
      aria-hidden="true"
    >
      {stages.map((stage, i) => {
        const isActive = i <= activeIndex;
        return (
          <div key={stage.label} className="flex items-center gap-1.5">
            <div
              className="transition-all duration-500"
              style={{
                width: i === activeIndex ? 8 : 4,
                height: i === activeIndex ? 8 : 4,
                borderRadius: "50%",
                background: isActive ? "#3DDC97" : "#242833",
                boxShadow: i === activeIndex ? "0 0 6px #3DDC97" : "none",
              }}
            />
            {i === activeIndex && (
              <span
                className="font-mono text-[9px] text-primary whitespace-nowrap"
                style={{ color: "#3DDC97" }}
              >
                {stage.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Insight chip overlay (replaces the original CitationOverlay)
// ---------------------------------------------------------------------------

function InsightChip({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-5 right-5 flex items-center gap-2 px-3.5 py-2 rounded-full font-mono text-xs border pointer-events-none"
          style={{
            background: "rgba(61,220,151,0.1)",
            borderColor: "rgba(61,220,151,0.35)",
            color: "#3DDC97",
            boxShadow: "0 0 16px rgba(61,220,151,0.2)",
          }}
          aria-label="AI analyzing auth.service.ts — 14 dependents"
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#3DDC97" }}
          />
          <span className="font-semibold">auth.service.ts</span>
          <span style={{ color: "rgba(61,220,151,0.65)" }}>· 14 dependents</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export function HeroRepositoryGraph() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [webGLAvailable] = useState(() => supportsWebGL());

  // Hover state for explosion trigger
  const [isHovered, setIsHovered] = useState(false);

  // Progress ref — read by useFrame inside Canvas, no React re-renders
  const scrollRef = useRef(0);
  // Mouse position ref — read by CameraParallax inside Canvas
  const mouseRef = useRef({ x: 0, y: 0 });

  // Progress state (only for the UI overlay — low frequency update)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Subscribe to future reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Smooth hover animation loop — interpolates scrollRef (progress) 0 <-> 1 when hovered
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const target = isHovered ? 1 : 0;
      const current = scrollRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.001) {
        const next = current + diff * Math.min(delta * 4.5, 1);
        scrollRef.current = next;
        setScrollProgress(next);
        rafId = requestAnimationFrame(animate);
      } else {
        scrollRef.current = target;
        setScrollProgress(target);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isHovered]);

  // Pointer enter / move / leave handlers for hover explosion + camera parallax
  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    mouseRef.current = { x: 0, y: 0 };
  }, []);

  // Detect mobile for DPR reduction
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (!webGLAvailable) {
    return <StaticFallback />;
  }

  return (
    <div
      className="relative w-full h-full cursor-pointer select-none"
      aria-label="Interactive 3D Structa architecture visualization — Hover to explode"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handlePointerEnter}
      onTouchEnd={handlePointerLeave}
    >
      <Canvas
        camera={{ position: [14, 8, 24], fov: 50, near: 0.1, far: 200 }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        aria-hidden="true"
      >
        <Structa3DScene scrollRef={scrollRef} mouseRef={mouseRef} reducedMotion={reducedMotion} />
      </Canvas>

      {/* Explosion stage progress indicator */}
      {!reducedMotion && <ScrollProgress progress={scrollProgress} />}

      {/* Insight chip — visible when exploded */}
      <InsightChip visible={isHovered && scrollProgress > 0.6 && !reducedMotion} />

      {/* Layer label — bottom left */}
      <div
        className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-widest pointer-events-none flex items-center gap-2"
        style={{ color: "rgba(139,146,163,0.7)" }}
        aria-hidden="true"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] animate-pulse" />
        <span>Hover to explode</span>
        <span style={{ color: "rgba(139,146,163,0.3)" }}>·</span>
        <span>Structa 3D</span>
      </div>
    </div>
  );
}
