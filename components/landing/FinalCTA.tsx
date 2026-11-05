"use client";

/**
 * components/landing/FinalCTA.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Full-bleed CTA band with dual-theme gradient, pill CTAs,
 * and high-contrast typography compliant with design.md.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 border-t border-border/80 overflow-hidden bg-gradient-to-b from-surface via-primary/5 to-surface-elevated dark:from-background dark:via-primary/10 dark:to-background"
      aria-labelledby="final-cta-heading"
    >
      {/* Background ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Configuration Required • 100% Free For Public Repos</span>
        </div>

        <h2
          id="final-cta-heading"
          className="text-3xl sm:text-5xl font-heading font-bold text-foreground tracking-tight leading-tight"
        >
          Your Next Codebase Is Waiting to Be{" "}
          <span className="text-primary inline-block">Understood.</span>
        </h2>

        <p className="mt-5 text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Explore any open-source GitHub repository in seconds, or connect your private team
          workspace to automate architectural governance.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            id="final-cta-connect"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-primary text-primary-foreground font-sans font-semibold text-base hover:opacity-95 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span>Connect a Repository</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/explorer"
            id="final-cta-explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full border border-border bg-surface/90 hover:bg-surface text-foreground font-sans font-semibold text-base transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Compass className="w-4 h-4 text-muted-foreground" />
            <span>Explore Public Repositories</span>
          </Link>
        </div>

        <p className="mt-5 font-mono text-xs text-muted-foreground">
          Explorer Mode is always free &middot; Workspace Mode includes private repos &amp; RBAC
        </p>
      </div>
    </section>
  );
}
