"use client";

import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthScoreRingProps {
  /** Score from 0 to 100 */
  score: number;
  /** Diameter in pixels. Default: 56 */
  size?: number;
  /** Stroke width in pixels. Default: 5 */
  strokeWidth?: number;
  /** Show the numeric score inside the ring. Default: true */
  showLabel?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers — complexity-heatmap gradient per design.md
// ---------------------------------------------------------------------------

/**
 * Returns an HSL colour that linearly interpolates through the three
 * design tokens:
 *   0–49  : --primary   #3DDC97  (green)
 *   50–74 : --warning   #F2B84B  (amber)
 *   75–100: --danger    #F0576B  (red)
 *
 * Note: the ring shows health (higher = better), so 100 is green and 0 is red.
 */
function scoreToColor(score: number): string {
  if (score >= 75) return "var(--primary, #3DDC97)"; // primary — healthy
  if (score >= 50) return "var(--warning, #F2B84B)"; // warning — moderate
  return "var(--danger, #F0576B)"; // danger — critical
}

function scoreFontColor(score: number): string {
  if (score >= 75) return "var(--primary, #3DDC97)";
  if (score >= 50) return "var(--warning, #F2B84B)";
  return "var(--danger, #F0576B)";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HealthScoreRing({
  score,
  size = 56,
  strokeWidth = 5,
  showLabel = true,
  className = "",
}: HealthScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreToColor(clamped);
  const fontColor = scoreFontColor(clamped);

  // Animate from 0 → clamped on mount
  const targetOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={`Health score: ${clamped} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border, #242833)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {showLabel && (
        <span
          className="absolute font-mono text-[11px] font-semibold tabular-nums"
          style={{ color: fontColor }}
        >
          {clamped}
        </span>
      )}
    </div>
  );
}
