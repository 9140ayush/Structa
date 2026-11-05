/**
 * app/page.tsx — Structa marketing landing page.
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Server Component static shell for instant first paint and CDN caching.
 *
 * Architecture.md §3: Marketing routes are SSG/ISR.
 * Compositional rhythm inspired by incident.io:
 * 1. Navbar (Sticky, Clerk auth aware, with ThemeToggle)
 * 2. Hero (Centered headline, subcopy, 2 pill CTAs, rounded product-mockup frame)
 * 3. TechCredibilityStrip (Real supported tech logos/badges)
 * 4. ProblemSolutionTabs (Pill tabs: Architecture Drift, Slow Onboarding, Loops, Refactoring)
 * 5. PlatformRadialDiagram (Core 3D engine + 12 satellite views)
 * 6. GradientBand (4 equal glass cards: Copilot, Module Summaries, Tarjan Cycles, Webhook Sync)
 * 7. AlternatingFeatures (4 alternating 2-column feature deep dives)
 * 8. RepositorySearch (Real live explorer input with quick repo pills)
 * 9. PricingTeaser (Free, Pro, Org tiers with toggle and test mode badge)
 * 10. FinalCTA (Full-bleed gradient CTA band with pill buttons)
 * 11. Footer (Multi-column links, live status badge, and embedded ThemeToggle)
 */

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TechCredibilityStrip } from "@/components/landing/TechCredibilityStrip";
import { ProblemSolutionTabs } from "@/components/landing/ProblemSolutionTabs";
import { PlatformRadialDiagram } from "@/components/landing/PlatformRadialDiagram";
import { GradientBand } from "@/components/landing/GradientBand";
import { AlternatingFeatures } from "@/components/landing/AlternatingFeatures";
import { RepositorySearch } from "@/components/landing/RepositorySearch";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

// Visual divider
function SectionDivider() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-px bg-border/60" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Sticky Top Navbar */}
      <Navbar />

      <main id="main-content">
        {/* 1. Hero: Centered headline, 2 pill CTAs, and large product-mockup frame */}
        <Hero />

        {/* 2. Credibility strip: Real technologies Structa supports and parses */}
        <TechCredibilityStrip />

        {/* 3. Problem / Solution Pill Tabs */}
        <ProblemSolutionTabs />

        <SectionDivider />

        {/* 4. Platform Radial Architecture: Core 3D engine + 12 satellite views */}
        <PlatformRadialDiagram />

        {/* 5. Full-bleed gradient band with 4 equal glass cards */}
        <GradientBand />

        {/* 6. Alternating deep-dive feature sections with mockup + icon-tab row */}
        <AlternatingFeatures />

        <SectionDivider />

        {/* 7. Live Interactive Repository Explorer Search */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
              Live Interactive Explorer
            </span>
            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight mt-2">
              Try It on Any Public GitHub Repository
            </h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">
              Enter any repository URL or shorthand below to extract and visualize its Abstract Syntax Tree in real-time.
            </p>
          </div>
          <RepositorySearch />
        </section>

        <SectionDivider />

        {/* 8. Pricing Teaser */}
        <PricingTeaser />

        {/* 9. Full-Bleed Final Call-to-Action */}
        <FinalCTA />
      </main>

      {/* 10. Multi-column Footer with status indicator & ThemeToggle */}
      <Footer />
    </>
  );
}
