/**
 * components/landing/UseCases.tsx — Four user persona use cases.
 *
 * Server Component — simple, low animation budget per design spec §5.11.
 */

import React from "react";
import { UserCheck, GitMerge, GraduationCap, BarChart3 } from "lucide-react";

const USE_CASES = [
  {
    icon: UserCheck,
    headline: "New to the Team",
    description:
      "Join an unfamiliar codebase and build a mental model in minutes, not weeks. See how every module connects before your first PR.",
    tag: "Onboarding",
  },
  {
    icon: GitMerge,
    headline: "OSS Contributor",
    description:
      "Understand a project's architecture instantly. Find the right file to change, see what you'll affect, and write better PRs from day one.",
    tag: "Open Source",
  },
  {
    icon: GraduationCap,
    headline: "Learning Real Codebases",
    description:
      "Study how production-grade systems are actually architected. Explore React, Next.js, TypeScript — without cloning a thing.",
    tag: "Education",
  },
  {
    icon: BarChart3,
    headline: "Engineering Leads",
    description:
      "Spot architectural risk before it compounds. Identify high-complexity modules, circular dependencies, and under-owned areas across your org's repos.",
    tag: "Architecture Review",
  },
];

export function UseCases() {
  return (
    <section className="relative py-24 px-4 sm:px-6" aria-labelledby="use-cases-heading">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            Built for developers
          </p>
          <h2
            id="use-cases-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Who Uses Structa
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {USE_CASES.map((item) => (
            <div
              key={item.headline}
              className="flex gap-4 p-6 rounded-[16px] border border-border bg-surface hover:border-primary/25 hover:bg-surface-elevated transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-[10px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <item.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-heading font-semibold text-base text-foreground">
                    {item.headline}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full border border-border bg-secondary font-mono text-[9px] text-muted-foreground uppercase tracking-wide">
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
