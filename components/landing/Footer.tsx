"use client";

/**
 * components/landing/Footer.tsx
 *
 * Phase 13 — Dual-Theme UI Overhaul.
 * Rich multi-column footer with live status badge and embedded ThemeToggle.
 * Links strictly to confirmed routes: /explorer, /pricing, /sign-in, /sign-up, /dashboard, /settings.
 */

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { StructaLogoBadge } from "@/components/shared/StructaLogo";

export function Footer() {
  const year = new Date().getFullYear();

  const navigationColumns = [
    {
      title: "Architecture Views",
      links: [
        { label: "3D Dependency Graph", href: "/explorer" },
        { label: "2D Layered Architecture", href: "/explorer" },
        { label: "Cycle Detection (Tarjan)", href: "/explorer" },
        { label: "Topological Reading Paths", href: "/explorer" },
        { label: "AST-Grounded Copilot", href: "/explorer" },
      ],
    },
    {
      title: "Product & Plans",
      links: [
        { label: "Public Repo Explorer", href: "/explorer" },
        { label: "Pricing & Plans", href: "/pricing" },
        { label: "Workspace Mode", href: "/dashboard" },
        { label: "Supported Tech Stacks", href: "/#tech-stack" },
      ],
    },
    {
      title: "Account & Access",
      links: [
        { label: "Sign In", href: "/sign-in" },
        { label: "Create Account", href: "/sign-up" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Appearance & Settings", href: "/settings" },
      ],
    },
  ];

  return (
    <footer
      className="relative border-t border-border bg-surface-elevated/70 px-4 sm:px-6 lg:px-8 py-16"
      aria-label="Footer"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission (Spans 2 columns on lg) */}
          <div className="lg:col-span-2 max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md group"
              aria-label="Structa home"
            >
              <StructaLogoBadge size="md" className="group-hover:scale-105" />
              <span className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors tracking-tight">
                Structa
              </span>
            </Link>

            <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Continuous 3D architecture intelligence for engineering teams. Understand dependencies,
              isolate circular loops, and query your codebase with AST-grounded citations.
            </p>

            {/* Operational Status Pill */}
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono text-foreground shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Navigation Columns */}
          {navigationColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright, Mode Note, and Theme Toggle */}
        <div className="mt-14 pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs font-mono text-muted-foreground text-center sm:text-left">
            <p>&copy; {year} Structa, Inc. All rights reserved.</p>
            <span className="hidden sm:inline">&middot;</span>
            <p>Explorer Mode is free for all public repositories.</p>
          </div>

          {/* Embedded Accessible Theme Toggle */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">Appearance:</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
