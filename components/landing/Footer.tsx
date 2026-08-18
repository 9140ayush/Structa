/**
 * components/landing/Footer.tsx — Landing page footer.
 *
 * Server Component.
 * Links only to confirmed-existing routes: /explorer, /sign-in, /sign-up, /dashboard.
 * No GitHub URL (not confirmed public). No dead links.
 */

import React from "react";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  const links: { label: string; href: string; external?: boolean }[][] = [
    [
      { label: "Product", href: "#" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Explorer", href: "/explorer" },
    ],
    [
      { label: "Account", href: "#" },
      { label: "Sign In", href: "/sign-in" },
      { label: "Create Account", href: "/sign-up" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  ];

  return (
    <footer
      className="relative border-t border-border bg-surface-elevated/40 px-4 sm:px-6 py-14"
      aria-label="Footer"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              aria-label="Structa home"
            >
              <div
                className="w-7 h-7 rounded-[7px] bg-primary flex items-center justify-center text-background font-mono font-bold text-sm"
                style={{ boxShadow: "0 0 16px rgba(61,220,151,0.3)" }}
              >
                S
              </div>
              <span className="font-heading font-semibold text-base text-foreground">Structa</span>
            </Link>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Turn any GitHub repository into a navigable 3D architecture map — with AI insights
              and a grounded codebase chat.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-10 sm:gap-16">
            {links.map((col, ci) => (
              <nav key={ci} aria-label={col[0].label}>
                <ul className="space-y-2.5">
                  {col.map((link, li) => (
                    <li key={link.label}>
                      {li === 0 ? (
                        <span className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
                          {link.label}
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            &copy; {year} Structa. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Explorer Mode is always free &middot; No signup required for public repos
          </p>
        </div>
      </div>
    </footer>
  );
}
