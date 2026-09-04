"use client";

/**
 * components/shared/RepoLayoutShell.tsx
 *
 * Client shell for the repository section layout.
 * Controls state for Unified Search (Cmd+K) and renders header & tab navigation.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, GitBranch, Search } from "lucide-react";
import { RepoNavTabs } from "@/components/shared/RepoNavTabs";
import { UnifiedSearchModal } from "@/components/shared/UnifiedSearchModal";

interface RepoLayoutShellProps {
  repoId: string;
  repoName: string;
  repoUrl: string;
  healthScore: number;
  children: React.ReactNode;
}

function getHealthColor(score: number): string {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

interface RepoIntelligenceData {
  fileTree?: Array<{ id: string; path: string; name: string; type: string; summary?: string }>;
  detectedTech?: Array<{ name: string; category: string }>;
  topImportedModules?: Array<{ id: string; path: string; name: string }>;
}

export function RepoLayoutShell({
  repoId,
  repoName,
  repoUrl,
  healthScore,
  children,
}: RepoLayoutShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState<RepoIntelligenceData | null>(null);

  useEffect(() => {
    async function loadSearchData() {
      try {
        const res = await fetch(`/api/repos/${repoId}/intelligence`);
        if (res.ok) {
          const json = await res.json();
          setIntelligenceData(json);
        }
      } catch {
        // Non-fatal
      }
    }
    loadSearchData();
  }, [repoId]);

  return (
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 flex flex-col"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* Context Bar */}
      <div className="h-12 border-b border-border bg-card/60 backdrop-blur-md flex items-center px-4 sm:px-6 gap-3 shrink-0 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-7 h-7 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          <div className="h-4 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-3.5 h-3.5 text-accent shrink-0" />
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading font-semibold text-sm text-foreground hover:text-accent transition-colors truncate"
            >
              {repoName}
            </a>
          </div>

          <span
            className={`hidden sm:inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full border bg-card/50 ${getHealthColor(
              healthScore,
            )} border-current/20 shrink-0`}
          >
            <ShieldCheck className="w-3 h-3" />
            {healthScore}/100
          </span>
        </div>

        {/* Global Search Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-card/60 hover:bg-secondary text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Search codebase...</span>
            <kbd className="text-[10px] bg-secondary px-1 py-0.2 rounded border border-border">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <RepoNavTabs repoId={repoId} onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Unified Search Modal */}
      <UnifiedSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        repoId={repoId}
        intelligenceData={intelligenceData}
      />
    </div>
  );
}
