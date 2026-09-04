"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, Compass } from "lucide-react";

interface RepoErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RepoError({ error, reset }: RepoErrorProps) {
  useEffect(() => {
    // Log safe error telemetry without exposing internal sensitive tokens
    console.error("[Repository Boundary Error]", error.message);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 text-destructive shadow-sm">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight mb-2">
        Unable to load repository section
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mb-8">
        We encountered an issue retrieving the intelligence or visualization data for this section.
        This may be temporary if indexing or parsing is currently synchronizing.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Section
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Compass className="w-4 h-4" />
          Public Explorer
        </Link>
      </div>
    </div>
  );
}
