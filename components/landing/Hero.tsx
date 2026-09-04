/**
 * components/landing/Hero.tsx — Landing page hero section.
 *
 * Server Component outer shell — assembles copy and a Client Component graph shell.
 * The 3D graph is wrapped in a Client Component (HeroGraphShell) to allow ssr:false dynamic import.
 * Next.js 16.2.11 breaking change: ssr:false can only be used in Client Components.
 */

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { HeroGraphShell } from "./HeroGraphShell";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Hero() {
  return (
    <section
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-16"
      aria-labelledby="hero-headline"
    >
      {/* Background glow spots */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] rounded-full bg-accent/8 blur-[140px] pointer-events-none" />

      {/* Subtle dot-grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#EDEFF3 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 py-16 lg:py-24">
        {/* Left: Copy */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/8 text-primary font-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            No sign-up required &mdash; any public GitHub repo
          </div>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="font-heading font-bold tracking-tight text-foreground leading-[1.08]"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)" }}
          >
            Understand Any Codebase.{" "}
            <span className="text-primary" style={{ textShadow: "0 0 40px rgba(61,220,151,0.35)" }}>
              Before You Touch
            </span>{" "}
            the Code.
          </h1>

          {/* Subhead */}
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Structa turns a GitHub repository into a navigable{" "}
            <span className="text-foreground font-medium">3D architecture map</span> — with
            AI-generated module explanations you can question directly, grounded in the real code.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/explorer"
              id="hero-cta-primary"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] bg-primary hover:bg-primary-hover text-background font-sans font-semibold text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ boxShadow: "0 0 24px rgba(61,220,151,0.35)" }}
            >
              Explore a Repository
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              id="hero-cta-secondary"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[10px] border border-border bg-secondary/40 hover:bg-secondary text-foreground font-sans font-medium text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right: 3D Graph — Client Component shell */}
        <div className="flex-1 w-full lg:max-w-[52%] aspect-[4/3] lg:aspect-auto lg:h-[520px] rounded-[16px] border border-border overflow-hidden bg-[#0A0C10] shadow-[0_0_80px_rgba(61,220,151,0.08)]">
          <HeroGraphShell />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground">
        <ChevronDown className="w-4 h-4 animate-bounce" />
        <span className="font-mono text-[10px] uppercase tracking-widest">scroll</span>
      </div>
    </section>
  );
}
