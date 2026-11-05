"use client";

/**
 * components/shared/StructaLogo.tsx
 *
 * Stylized geometric "S" logomark for Structa.
 * Crafted with mathematical 180° rotational symmetry matching the brand emblem.
 *
 * Theme-aware:
 * - Light Mode: Clean surface with high-contrast emerald/slate tone, hairline border, soft elevation.
 * - Dark Mode: Deep surface with vibrant glowing emerald (#3DDC97), border accent, and ambient glow.
 */

import React from "react";

// Normalized SVG path data centered at (50, 50) in a 100x100 viewBox
export const STRUCTA_S_PATH_TOP =
  "M 39.28 6.22 L 55.81 6.22 L 56.25 6.67 L 58.93 6.67 L 59.38 7.12 L 61.17 7.12 L 63.4 8.01 L 64.74 8.01 L 69.21 9.8 L 72.78 10.69 L 78.14 13.37 L 79.04 13.37 L 79.93 14.26 L 84.84 16.5 L 91.1 20.52 L 88.42 24.54 L 83.95 29.9 L 83.06 29.9 L 79.04 27.22 L 66.53 21.41 L 65.19 21.41 L 63.85 20.52 L 62.51 20.52 L 62.06 20.07 L 60.72 20.07 L 58.49 19.18 L 53.57 18.73 L 53.13 18.28 L 41.96 18.28 L 41.51 18.73 L 39.28 18.73 L 38.83 19.18 L 37.49 19.18 L 35.71 20.07 L 34.81 20.07 L 28.56 23.64 L 24.09 28.11 L 21.41 33.03 L 20.96 35.71 L 20.52 36.15 L 20.52 37.94 L 20.07 38.39 L 20.07 45.98 L 21.41 46.87 L 24.54 46.87 L 24.98 47.32 L 27.22 47.32 L 27.66 47.77 L 31.69 48.21 L 33.47 49.11 L 34.81 49.11 L 37.94 50.45 L 41.51 51.34 L 53.57 57.15 L 54.47 58.04 L 59.38 60.72 L 59.38 61.61 L 52.23 70.55 L 48.21 67.87 L 43.3 65.63 L 42.41 64.74 L 41.51 64.74 L 39.28 63.4 L 38.39 63.4 L 37.05 62.51 L 32.13 61.17 L 31.69 60.72 L 30.35 60.72 L 28.11 59.83 L 26.32 59.83 L 25.88 59.38 L 23.64 59.38 L 23.2 58.93 L 20.52 58.93 L 20.07 58.49 L 10.24 58.49 L 9.35 54.02 L 8.9 53.57 L 8.46 49.11 L 8.01 48.66 L 8.01 37.05 L 8.46 36.6 L 8.9 32.58 L 9.8 30.79 L 10.24 28.56 L 13.37 22.3 L 15.6 19.18 L 20.07 14.71 L 23.64 12.03 L 26.77 10.69 L 28.56 9.35 L 30.79 8.9 L 32.13 8.01 L 33.47 8.01 L 37.05 6.67 L 38.83 6.67 Z";

export const STRUCTA_S_PATH_BOTTOM =
  "M 60.72 93.78 L 44.19 93.78 L 43.75 93.33 L 41.07 93.33 L 40.62 92.88 L 38.83 92.88 L 36.6 91.99 L 35.26 91.99 L 30.79 90.2 L 27.22 89.31 L 21.86 86.63 L 20.96 86.63 L 20.07 85.74 L 15.16 83.5 L 8.9 79.48 L 11.58 75.46 L 16.05 70.1 L 16.94 70.1 L 20.96 72.78 L 33.47 78.59 L 34.81 78.59 L 36.15 79.48 L 37.49 79.48 L 37.94 79.93 L 39.28 79.93 L 41.51 80.82 L 46.43 81.27 L 46.87 81.72 L 58.04 81.72 L 58.49 81.27 L 60.72 81.27 L 61.17 80.82 L 62.51 80.82 L 64.29 79.93 L 65.19 79.93 L 71.44 76.36 L 75.91 71.89 L 78.59 66.97 L 79.04 64.29 L 79.48 63.85 L 79.48 62.06 L 79.93 61.61 L 79.93 54.02 L 78.59 53.13 L 75.46 53.13 L 75.02 52.68 L 72.78 52.68 L 72.34 52.23 L 68.31 51.79 L 66.53 50.89 L 65.19 50.89 L 62.06 49.55 L 58.49 48.66 L 46.43 42.85 L 45.53 41.96 L 40.62 39.28 L 40.62 38.39 L 47.77 29.45 L 51.79 32.13 L 56.7 34.37 L 57.59 35.26 L 58.49 35.26 L 60.72 36.6 L 61.61 36.6 L 62.95 37.49 L 67.87 38.83 L 68.31 39.28 L 69.65 39.28 L 71.89 40.17 L 73.68 40.17 L 74.12 40.62 L 76.36 40.62 L 76.8 41.07 L 79.48 41.07 L 79.93 41.51 L 89.76 41.51 L 90.65 45.98 L 91.1 46.43 L 91.54 50.89 L 91.99 51.34 L 91.99 62.95 L 91.54 63.4 L 91.1 67.42 L 90.2 69.21 L 89.76 71.44 L 86.63 77.7 L 84.4 80.82 L 79.93 85.29 L 76.36 87.97 L 73.23 89.31 L 71.44 90.65 L 69.21 91.1 L 67.87 91.99 L 66.53 91.99 L 62.95 93.33 L 61.17 93.33 Z";

interface StructaLogoIconProps {
  className?: string;
  size?: number | string;
  fill?: string;
  title?: string;
}

/**
 * Pure SVG vector logomark.
 * Renders the interlocking stylized "S".
 */
export function StructaLogoIcon({
  className = "w-full h-full",
  size,
  fill = "currentColor",
  title = "Structa Logomark",
}: StructaLogoIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill={fill}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={title}
      role="img"
    >
      <title>{title}</title>
      <path d={STRUCTA_S_PATH_TOP} />
      <path d={STRUCTA_S_PATH_BOTTOM} />
    </svg>
  );
}

interface StructaLogoBadgeProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  accent?: boolean;
}

const SIZE_MAP = {
  sm: { container: "w-7 h-7 rounded-[7px]", icon: 16 },
  md: { container: "w-8 h-8 rounded-lg", icon: 19 },
  lg: { container: "w-10 h-10 rounded-xl", icon: 24 },
  xl: { container: "w-12 h-12 rounded-2xl", icon: 28 },
};

/**
 * Polished squircle brand badge for top headers, cards, and footers.
 * Adapts seamlessly across both Dark and Light themes.
 */
export function StructaLogoBadge({
  size = "md",
  className = "",
  accent = false,
}: StructaLogoBadgeProps) {
  const cfg = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center transition-all duration-200 ${
        cfg.container
      } ${
        accent
          ? "bg-accent/15 border border-accent/30 text-accent shadow-sm"
          : "bg-surface-elevated/90 dark:bg-surface border border-border/90 hover:border-primary/50 text-emerald-700 dark:text-primary shadow-xs dark:shadow-[0_0_16px_rgba(61,220,151,0.2)]"
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <StructaLogoIcon size={cfg.icon} />
      </div>
    </div>
  );
}

/**
 * Universal Structa logo component.
 */
export function StructaLogo({
  variant = "badge",
  size = "md",
  className = "",
  accent = false,
}: {
  variant?: "badge" | "mark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  accent?: boolean;
}) {
  if (variant === "mark") {
    const iconSize = SIZE_MAP[size]?.icon ?? 20;
    return <StructaLogoIcon size={iconSize} className={className} />;
  }

  return <StructaLogoBadge size={size} className={className} accent={accent} />;
}

