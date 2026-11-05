import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { Check, X, ShieldCheck, HelpCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | Structa — 3D Architecture Intelligence",
  description:
    "Predictable, transparent pricing for codebase architecture visualization, grounded AST Copilot, and cycle detection.",
};

interface FeatureRow {
  name: string;
  category: string;
  free: string | boolean;
  pro: string | boolean;
  org: string | boolean;
}

const COMPARISON_ROWS: FeatureRow[] = [
  // Repositories & Scale
  {
    category: "Repositories & Scale",
    name: "Public Repositories (Explorer)",
    free: "Unlimited",
    pro: "Unlimited",
    org: "Unlimited",
  },
  {
    category: "Repositories & Scale",
    name: "Private Workspace Repositories",
    free: "1 Repository",
    pro: "Unlimited",
    org: "Unlimited",
  },
  {
    category: "Repositories & Scale",
    name: "Included Seats",
    free: "1 Seat",
    pro: "5 Seats",
    org: "Custom / Per Seat",
  },
  {
    category: "Repositories & Scale",
    name: "Continuous Webhook Sync",
    free: false,
    pro: true,
    org: true,
  },

  // Architecture & Graph Views
  {
    category: "Architecture & Visuals",
    name: "Interactive 3D Dependency Graph",
    free: true,
    pro: true,
    org: true,
  },
  {
    category: "Architecture & Visuals",
    name: "2D Layered Architecture View",
    free: true,
    pro: true,
    org: true,
  },
  {
    category: "Architecture & Visuals",
    name: "Tarjan's Circular Import Detection",
    free: "Basic (1-hop)",
    pro: "Full Multi-hop",
    org: "Full Multi-hop",
  },
  {
    category: "Architecture & Visuals",
    name: "Blast Radius Impact Analysis",
    free: false,
    pro: true,
    org: true,
  },
  {
    category: "Architecture & Visuals",
    name: "Curated Reading Paths",
    free: "Topological only",
    pro: "Full AI Sequences",
    org: "Custom Org Paths",
  },
  {
    category: "Architecture & Visuals",
    name: "Repo Story (Git Evolution)",
    free: "Recent 5 commits",
    pro: "Full Commit History",
    org: "Full Commit History",
  },

  // AI & Grounding
  {
    category: "AI & Understanding",
    name: "AI Module Summaries",
    free: "Standard",
    pro: "Advanced AST",
    org: "Advanced AST",
  },
  {
    category: "AI & Understanding",
    name: "Grounded Copilot with Citations",
    free: false,
    pro: true,
    org: true,
  },
  {
    category: "AI & Understanding",
    name: "Line-Range Citation Verification",
    free: false,
    pro: true,
    org: true,
  },

  // Governance & Security
  {
    category: "Governance & Security",
    name: "Role-Based Access Control (RBAC)",
    free: false,
    pro: false,
    org: "Admin, Editor, Viewer",
  },
  {
    category: "Governance & Security",
    name: "System Audit Logs",
    free: false,
    pro: false,
    org: true,
  },
  {
    category: "Governance & Security",
    name: "Custom Governance Rules",
    free: false,
    pro: false,
    org: true,
  },
  {
    category: "Governance & Security",
    name: "Support SLA",
    free: "Community",
    pro: "Priority Email",
    org: "Dedicated Manager & SLA",
  },
];

const FAQS = [
  {
    q: "Is Explorer Mode truly free?",
    a: "Yes. Explorer Mode lets anyone explore public GitHub repositories with zero account creation or payment required. We believe open-source architecture should always be accessible.",
  },
  {
    q: "How does Structa connect to private repositories?",
    a: "Structa integrates via Clerk and GitHub OAuth with fine-grained permissions. We only request read access to repository code trees and never store your private source code on persistent external disks.",
  },
  {
    q: "What does 'AST-Grounded Copilot' mean?",
    a: "Unlike generic chat models that guess how your code works, Structa extracts concrete Abstract Syntax Trees from your codebase. When you ask a question, our Copilot validates its answers against real file paths, function signatures, and line ranges.",
  },
  {
    q: "How does Stripe billing work during development/testing?",
    a: "Our Stripe integration operates in test mode. You can test plan upgrades and cancellations safely without incurring real credit card charges.",
  },
  {
    q: "Can I cancel or switch plans at any time?",
    a: "Yes. You can upgrade, downgrade, or cancel your subscription at any time directly from the Settings > Plan & Billing dashboard.",
  },
  {
    q: "Does Structa work with monorepos?",
    a: "Yes. Structa parses Turborepo, Nx, and pnpm workspaces, isolating package boundaries and mapping cross-package dependency relationships seamlessly.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />

      <main id="main-content" className="pt-16 pb-24">
        {/* On-page tier cards & toggle */}
        <PricingTeaser />

        {/* Feature Comparison Table */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
              Side-by-Side Breakdown
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight mt-2">
              Compare All Features
            </h2>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-elevated/70">
                    <th className="py-4 px-6 font-heading font-semibold text-foreground w-1/2 sm:w-2/5">
                      Feature
                    </th>
                    <th className="py-4 px-4 font-heading font-semibold text-foreground text-center">
                      Free ($0)
                    </th>
                    <th className="py-4 px-4 font-heading font-semibold text-primary text-center">
                      Pro ($29/mo)
                    </th>
                    <th className="py-4 px-4 font-heading font-semibold text-foreground text-center">
                      Organization ($79/seat)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-surface-elevated/30 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-sans text-foreground/90">
                        <span className="block font-medium">{row.name}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">
                          {row.category}
                        </span>
                      </td>

                      {/* Free */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {typeof row.free === "boolean" ? (
                          row.free ? (
                            <Check className="w-4 h-4 text-primary mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-muted-foreground">{row.free}</span>
                        )}
                      </td>

                      {/* Pro */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs bg-primary/5">
                        {typeof row.pro === "boolean" ? (
                          row.pro ? (
                            <Check className="w-4 h-4 text-primary mx-auto font-bold" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="font-semibold text-primary">{row.pro}</span>
                        )}
                      </td>

                      {/* Org */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {typeof row.org === "boolean" ? (
                          row.org ? (
                            <Check className="w-4 h-4 text-primary mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-foreground">{row.org}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
              Questions & Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface p-6 shadow-sm"
              >
                <h3 className="font-heading font-semibold text-base text-foreground flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed font-sans pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Bar */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface to-accent/10 p-8 sm:p-12 text-center shadow-lg">
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Ready to See Your Architecture in 3D?
            </h3>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Explore any public GitHub repository right now with zero setup, or connect your
              team&apos;s private workspace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/explorer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-sans font-semibold text-sm hover:opacity-95 shadow-md"
              >
                <span>Try Explorer Mode</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border bg-surface hover:bg-surface-elevated text-foreground font-sans font-semibold text-sm"
              >
                <span>Start Free Trial</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

