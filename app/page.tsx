/**
 * app/page.tsx — Structa landing page (redesigned).
 *
 * Server Component — static shell for fast first paint.
 * Heavy 3D and interactive sections use Client Component wrappers (DynamicSections)
 * because Next.js 16.2.11 breaking change: ssr:false is NOT allowed in Server Components.
 *
 * Architecture.md §3: Marketing routes are SSG/ISR.
 * Rules.md §2: No secrets in client bundle; 3D canvas always ssr:false.
 */

import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RepositorySearch } from "@/components/landing/RepositorySearch";
import { FeaturePillars } from "@/components/landing/FeaturePillars";
import { UseCases } from "@/components/landing/UseCases";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { Footer } from "@/components/landing/Footer";
import { FinalCTA } from "@/components/landing/FinalCTA";
// Client Component barrel: all ssr:false dynamic imports must live in a Client Component
// (Next.js 16.2.11 breaking change — see AGENTS.md)
import {
  ExplorerShowcaseSection,
  AIUnderstandingSection,
  DependencyIntelligenceSection,
  TechnicalPipelineSection,
  CodeToUnderstandingSection,
} from "@/components/landing/DynamicSections";

// ---------------------------------------------------------------------------
// Loading skeleton for Suspense boundaries
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
// Divider / visual separator
// ---------------------------------------------------------------------------

function SectionDivider() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="h-px bg-border/50" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <>
      {/* Sticky Navbar — Client Component for scroll state + Clerk Show */}
      <Navbar />

      <main id="main-content">
        {/* §5.2 Hero — static shell + Client Component 3D graph shell */}
        <Hero />

        <SectionDivider />

        {/* §5.3 Problem → Solution */}
        <ProblemSection />

        <SectionDivider />

        {/* Signature exploded visual — Client Component (ssr:false) */}
        <Suspense fallback={<SectionSkeleton height={500} />}>
          <CodeToUnderstandingSection />
        </Suspense>

        <SectionDivider />

        {/* §5.5 Live repository search — wired to real explorer resolve API */}
        <RepositorySearch />

        <SectionDivider />

        {/* §5.6 How It Works */}
        <HowItWorks />

        <SectionDivider />

        {/* §5.7 Explorer showcase — product UI recreation */}
        <Suspense fallback={<SectionSkeleton height={520} />}>
          <ExplorerShowcaseSection />
        </Suspense>

        <SectionDivider />

        {/* §5.8 AI Understanding */}
        <Suspense fallback={<SectionSkeleton height={480} />}>
          <AIUnderstandingSection />
        </Suspense>

        <SectionDivider />

        {/* §5.9 Dependency Intelligence */}
        <Suspense fallback={<SectionSkeleton height={400} />}>
          <DependencyIntelligenceSection />
        </Suspense>

        <SectionDivider />

        {/* §5.10 Feature Pillars */}
        <FeaturePillars />

        <SectionDivider />

        {/* §5.11 Use Cases */}
        <UseCases />

        <SectionDivider />

        {/* §5.12 Technical Pipeline */}
        <Suspense fallback={<SectionSkeleton height={320} />}>
          <TechnicalPipelineSection />
        </Suspense>

        <SectionDivider />

        {/* §5.13 Security */}
        <SecuritySection />

        <SectionDivider />

        {/* §5.14 Final CTA */}
        <FinalCTA />
      </main>

      {/* §5.15 Footer */}
      <Footer />
    </>
  );
}
