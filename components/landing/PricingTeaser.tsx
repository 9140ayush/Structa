"use client";

/**
 * components/landing/PricingTeaser.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Landing page pricing section teaser with Free / Pro / Org tiers,
 * annual/monthly billing pill toggle, and test-mode notice.
 * Grounded in PRD.md & phases.md.
 */

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

export function PricingTeaser() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      aria-labelledby="pricing-heading"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-primary font-semibold">
          Transparent Architecture Pricing
        </span>
        <h2
          id="pricing-heading"
          className="text-3xl sm:text-4xl font-heading font-bold text-foreground tracking-tight mt-3"
        >
          Start Free. Scale as Your Architecture Expands.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Explorer Mode is always free for open-source repositories. Upgrade to Workspace Mode for
          private repositories, team RBAC, and deeper AST intelligence.
        </p>

        {/* Monthly / Annual Pill Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full border border-border bg-surface shadow-sm">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all cursor-pointer ${
              !annual
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-sans font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              annual
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Stripe Test Mode Notice Badge */}
      <div className="max-w-md mx-auto mb-10 p-3 rounded-xl border border-primary/25 bg-primary/5 text-center text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        <span>Stripe Integration is running in safe Test Mode with dummy payment cards.</span>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
        {/* Tier 1: Free */}
        <div className="rounded-2xl border border-border bg-surface p-7 sm:p-8 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-foreground">Free</h3>
              <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                Individual
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Essential 3D repository visualization for individual open-source developers.
            </p>

            <div className="my-6">
              <span className="font-heading text-4xl font-extrabold text-foreground">$0</span>
              <span className="font-mono text-xs text-muted-foreground ml-2">/ forever</span>
            </div>

            <ul className="space-y-3 pt-6 border-t border-border/60 text-xs sm:text-sm text-muted-foreground font-sans">
              {[
                "1 Connected Workspace Repository",
                "Full Explorer Mode (Public GitHub Repos)",
                "Interactive 3D Dependency Graph",
                "Standard AI Module Summaries",
                "1 Developer Seat",
                "Community Support",
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/sign-up"
            className="mt-8 w-full py-3 rounded-xl border border-border bg-surface-elevated hover:bg-secondary text-foreground text-center font-sans font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Get Started Free
          </Link>
        </div>

        {/* Tier 2: Pro (Highlighted) */}
        <div className="rounded-2xl border-2 border-primary bg-surface p-7 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[10px] font-bold uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-sm">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-foreground">Pro</h3>
              <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                Professional
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Deep architectural analysis and grounded Copilot for high-velocity teams.
            </p>

            <div className="my-6">
              <span className="font-heading text-4xl font-extrabold text-foreground">
                {annual ? "$24" : "$29"}
              </span>
              <span className="font-mono text-xs text-muted-foreground ml-2">/ month</span>
              {annual && (
                <span className="block font-mono text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Billed annually ($288/yr)
                </span>
              )}
            </div>

            <ul className="space-y-3 pt-6 border-t border-border/60 text-xs sm:text-sm text-foreground/90 font-medium font-sans">
              {[
                "Unlimited Private & Public Repositories",
                "Grounded Copilot with Line Citations",
                "Tarjan Cycle Detection & Blast Radius",
                "Curated Topological Reading Paths",
                "Automated GitHub Webhook Sync",
                "Up to 5 Team Seats included",
                "Priority Email Support",
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/sign-up"
            className="mt-8 w-full py-3 rounded-xl bg-primary hover:opacity-95 text-primary-foreground text-center font-sans font-semibold text-sm transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Upgrade to Pro
          </Link>
        </div>

        {/* Tier 3: Organization */}
        <div className="rounded-2xl border border-border bg-surface p-7 sm:p-8 flex flex-col justify-between shadow-sm hover:border-primary/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-foreground">Organization</h3>
              <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                Enterprise
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Complete governance, RBAC permissions, and audit logs for engineering orgs.
            </p>

            <div className="my-6">
              <span className="font-heading text-4xl font-extrabold text-foreground">
                {annual ? "$64" : "$79"}
              </span>
              <span className="font-mono text-xs text-muted-foreground ml-2">/ seat / month</span>
              {annual && (
                <span className="block font-mono text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Billed annually
                </span>
              )}
            </div>

            <ul className="space-y-3 pt-6 border-t border-border/60 text-xs sm:text-sm text-muted-foreground font-sans">
              {[
                "Everything in Pro Tier",
                "Granular RBAC (Admin, Editor, Viewer)",
                "Full System Audit Event Logging",
                "Architectural Drift Snapshots",
                "Custom Security Rule Policies",
                "Dedicated Account Manager & SLA",
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/sign-up"
            className="mt-8 w-full py-3 rounded-xl border border-border bg-surface-elevated hover:bg-secondary text-foreground text-center font-sans font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Contact for Org
          </Link>
        </div>
      </div>

      {/* Link to full comparison */}
      <div className="mt-12 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-primary hover:underline"
        >
          <span>View full feature comparison & FAQ</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

