"use client";

/**
 * components/landing/HeroGraphShell.tsx — Client Component shell for the hero 3D graph.
 *
 * Next.js 16.2.11 breaking change: ssr:false is only allowed in Client Components.
 * This thin wrapper lives in a Client Component so it can use dynamic(..., { ssr: false }).
 *
 * Renders a Suspense boundary + loading spinner while the heavy R3F scene loads.
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";

const HeroRepositoryGraph = dynamic(
  () => import("./HeroRepositoryGraph").then((m) => ({ default: m.HeroRepositoryGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0A0C10]">
        <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    ),
  },
);

export function HeroGraphShell() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-[#0A0C10]">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      }
    >
      <HeroRepositoryGraph />
    </Suspense>
  );
}
