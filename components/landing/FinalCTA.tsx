/**
 * components/landing/FinalCTA.tsx — Closing call-to-action.
 *
 * Primary: "Explore a GitHub Repository" → /explorer
 * Secondary: "Connect GitHub" → /sign-in
 * Reuses dynamically imported HeroRepositoryGraph at smaller scale.
 */

import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { HeroGraphShell } from "./HeroGraphShell";

export function FinalCTA() {
  return (
    <section
      className="relative py-24 px-4 sm:px-6 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Background graph (reuse hero R3F component at smaller scale) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true">
        <HeroGraphShell />
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <p className="font-mono text-xs text-primary uppercase tracking-widest mb-4">
          Ready to explore?
        </p>

        <h2
          id="final-cta-heading"
          className="font-heading font-bold text-foreground tracking-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          Your Next Codebase Is Waiting to Be{" "}
          <span className="text-primary" style={{ textShadow: "0 0 40px rgba(61,220,151,0.35)" }}>
            Understood.
          </span>
        </h2>

        <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
          Explore a GitHub repository and see what Structa can uncover — no account, no setup,
          no waiting.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/explorer"
            id="final-cta-primary"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[12px] bg-primary hover:bg-primary-hover text-background font-sans font-semibold text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ boxShadow: "0 0 32px rgba(61,220,151,0.40)" }}
          >
            Explore a GitHub Repository
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/sign-in"
            id="final-cta-secondary"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[12px] border border-border bg-secondary/40 hover:bg-secondary text-foreground font-sans font-medium text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <GitBranch className="w-5 h-5" aria-hidden="true" />
            Connect GitHub
          </Link>
        </div>

        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Explorer Mode is always free · Workspace Mode for private repos
        </p>
      </div>
    </section>
  );
}
