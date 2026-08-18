/**
 * components/landing/SecuritySection.tsx — Trust and security section.
 *
 * Server Component.
 * Only claims that are actually true and shipped:
 * - Clerk-based GitHub OAuth
 * - Server-side RBAC (Admin/Editor/Viewer)
 * - Encrypted-at-rest tokens for private repos
 * - Explorer Mode public-only isolation
 * No invented compliance claims, SOC2 language, or unshipped guarantees.
 */

import React from "react";
import { ShieldCheck, Lock, Eye, Globe } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Clerk-Powered GitHub OAuth",
    description:
      "Authentication is handled entirely by Clerk. GitHub OAuth tokens are verified server-side and never exposed to the client bundle.",
  },
  {
    icon: Lock,
    title: "Server-Side RBAC",
    description:
      "Workspace repos enforce Admin, Editor, and Viewer roles — all checked on the server before any data is returned. No client-side gating.",
  },
  {
    icon: Lock,
    title: "Encrypted Private Repo Tokens",
    description:
      "GitHub tokens for private repository access are encrypted at rest. They are only decrypted server-side during repo sync operations.",
  },
  {
    icon: Eye,
    title: "Explorer Mode Isolation",
    description:
      "Explorer Mode only ever analyzes public repositories. Private workspace data is strictly isolated and never reachable from the public Explorer.",
  },
  {
    icon: Globe,
    title: "Shared Cache — Public Data Only",
    description:
      "The Explorer's shared indexing cache contains only public repository data. No private repo artifacts ever enter the cache layer.",
  },
];

export function SecuritySection() {
  return (
    <section
      className="relative py-24 px-4 sm:px-6"
      aria-labelledby="security-heading"
    >
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            Security & privacy
          </p>
          <h2
            id="security-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Built with Security in Mind
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Structa handles GitHub credentials carefully. Here&apos;s exactly what we do — and
            what we don&apos;t.
          </p>
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 p-5 rounded-[16px] border border-border bg-surface hover:border-primary/25 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0"
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Honest disclaimer */}
        <p className="mt-10 text-center font-mono text-xs text-muted-foreground/50 max-w-md mx-auto leading-relaxed">
          We do not claim SOC 2 compliance or any formal security certification at this time.
          The above describes our current implemented security practices.
        </p>
      </div>
    </section>
  );
}
