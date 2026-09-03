"use client";

/**
 * components/landing/structa-3d/InsightPanels.tsx
 *
 * Floating insight cards around the AI intelligence layer.
 * Uses Drei Html + Float for spatial positioning.
 * These panels convey Structa's output: module summaries, dependency insights,
 * architecture overview, complexity signals.
 *
 * Props:
 *   aiY         — Y position of the AI core
 *   yOffset     — scroll-driven vertical displacement
 *   opacity     — fade in at 80%+ scroll progress
 *   reducedMotion — disables Float drift
 */

import React from "react";
import { Float, Html } from "@react-three/drei";
import { INSIGHT_PANELS, AI_CONFIG, COLORS } from "./sceneData";

// ---------------------------------------------------------------------------
// Individual floating panel
// ---------------------------------------------------------------------------

function InsightCard({
  title,
  body,
  color,
  position,
  opacity,
  reducedMotion,
}: {
  title: string;
  body: string;
  color: string;
  position: [number, number, number];
  opacity: number;
  reducedMotion: boolean;
}) {
  const content = (
    <Html
      position={position}
      center
      distanceFactor={18}
      zIndexRange={[150, 0]}
      style={{ pointerEvents: "none", opacity: Math.max(0, Math.min(1, opacity)) }}
    >
      <div
        style={{
          background: "rgba(18,21,27,0.88)",
          border: `1px solid ${color}40`,
          borderRadius: 10,
          padding: "8px 14px",
          minWidth: 130,
          maxWidth: 170,
          backdropFilter: "blur(8px)",
          boxShadow: `0 0 20px ${color}25, 0 4px 16px rgba(0,0,0,0.6)`,
        }}
      >
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 700,
            color: color,
            margin: "0 0 3px 0",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9.5,
            color: COLORS.foreground,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {body}
        </p>
        <div
          style={{
            width: 24,
            height: 2,
            background: color,
            borderRadius: 2,
            marginTop: 6,
            opacity: 0.6,
          }}
        />
      </div>
    </Html>
  );

  if (reducedMotion) return content;

  return (
    <Float speed={0.6} rotationIntensity={0.04} floatIntensity={0.3}>
      {content}
    </Float>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

interface InsightPanelsProps {
  yOffset?: number;
  opacity?: number;
  reducedMotion?: boolean;
}

export function InsightPanels({
  yOffset = 0,
  opacity = 0,
  reducedMotion = false,
}: InsightPanelsProps) {
  const aiY = AI_CONFIG.yCenter + yOffset;

  return (
    <group>
      {INSIGHT_PANELS.map((panel) => (
        <InsightCard
          key={panel.id}
          title={panel.title}
          body={panel.body}
          color={panel.color}
          position={[panel.xOffset, aiY + 0.5, panel.zOffset]}
          opacity={opacity}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
