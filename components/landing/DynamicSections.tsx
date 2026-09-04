"use client";

/**
 * components/landing/DynamicSections.tsx
 *
 * Thin Client Component wrapper for all sections that require ssr:false dynamic imports.
 * Next.js 16.2.11 breaking change: `ssr: false` is NOT allowed in Server Components.
 * All `dynamic(..., { ssr: false })` calls must live in Client Components.
 *
 * This barrel component is imported by app/page.tsx (Server Component).
 * It collects all client-only dynamic imports in one place.
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";

// ---------------------------------------------------------------------------
// Shared skeleton
// ---------------------------------------------------------------------------

function SectionSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-[16px] bg-surface/30"
      style={{ height, margin: "0 auto" }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Dynamic imports — all ssr:false, must live in Client Component
// ---------------------------------------------------------------------------

const ExplorerShowcaseDynamic = dynamic(
  () =>
    import("@/components/landing/ExplorerShowcase").then((m) => ({ default: m.ExplorerShowcase })),
  { ssr: false, loading: () => <SectionSkeleton height={520} /> },
);

const AIUnderstandingDynamic = dynamic(
  () =>
    import("@/components/landing/AIUnderstanding").then((m) => ({ default: m.AIUnderstanding })),
  { ssr: false, loading: () => <SectionSkeleton height={480} /> },
);

const DependencyIntelligenceDynamic = dynamic(
  () =>
    import("@/components/landing/DependencyIntelligence").then((m) => ({
      default: m.DependencyIntelligence,
    })),
  { ssr: false, loading: () => <SectionSkeleton height={400} /> },
);

const TechnicalPipelineDynamic = dynamic(
  () =>
    import("@/components/landing/TechnicalPipeline").then((m) => ({
      default: m.TechnicalPipeline,
    })),
  { ssr: false, loading: () => <SectionSkeleton height={320} /> },
);

const CodeToUnderstandingDynamic = dynamic(
  () =>
    import("@/components/landing/CodeToUnderstanding").then((m) => ({
      default: m.CodeToUnderstanding,
    })),
  { ssr: false, loading: () => <SectionSkeleton height={500} /> },
);

// ---------------------------------------------------------------------------
// Named exports — one per section, re-exported as thin wrappers
// ---------------------------------------------------------------------------

export function ExplorerShowcaseSection() {
  return (
    <Suspense fallback={<SectionSkeleton height={520} />}>
      <ExplorerShowcaseDynamic />
    </Suspense>
  );
}

export function AIUnderstandingSection() {
  return (
    <Suspense fallback={<SectionSkeleton height={480} />}>
      <AIUnderstandingDynamic />
    </Suspense>
  );
}

export function DependencyIntelligenceSection() {
  return (
    <Suspense fallback={<SectionSkeleton height={400} />}>
      <DependencyIntelligenceDynamic />
    </Suspense>
  );
}

export function TechnicalPipelineSection() {
  return (
    <Suspense fallback={<SectionSkeleton height={320} />}>
      <TechnicalPipelineDynamic />
    </Suspense>
  );
}

export function CodeToUnderstandingSection() {
  return (
    <Suspense fallback={<SectionSkeleton height={500} />}>
      <CodeToUnderstandingDynamic />
    </Suspense>
  );
}
