"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  Network,
  Sparkles,
  FolderOpen,
  Cpu,
  Workflow,
  Link2,
  HeartPulse,
  Puzzle,
  Compass,
  BookOpen,
  MessageSquareCode,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Tab definition (13 Phase 11 Sections)
// ---------------------------------------------------------------------------

interface Tab {
  segment: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const TABS: Tab[] = [
  { segment: "overview", label: "Overview", icon: LayoutDashboard },
  { segment: "graph", label: "3D Graph", icon: Box, badge: "3D" },
  { segment: "architecture", label: "Architecture", icon: Network },
  { segment: "explanation", label: "AI Explanation", icon: Sparkles },
  { segment: "files", label: "Files", icon: FolderOpen },
  { segment: "tech-stack", label: "Tech Stack", icon: Cpu },
  { segment: "flows", label: "Flows", icon: Workflow },
  { segment: "dependencies", label: "Dependencies", icon: Link2 },
  { segment: "health", label: "Health", icon: HeartPulse },
  { segment: "modules", label: "Modules", icon: Puzzle },
  { segment: "reading-path", label: "Reading Path", icon: Compass },
  { segment: "story", label: "Repo Story", icon: BookOpen },
  { segment: "copilot", label: "Copilot", icon: MessageSquareCode },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RepoNavTabsProps {
  repoId: string;
  onOpenSearch?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RepoNavTabs({ repoId, onOpenSearch }: RepoNavTabsProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine active segment from the pathname
  const activeSegment = (() => {
    const parts = pathname.split("/");
    const repoIdIndex = parts.findIndex((p) => p === repoId);
    if (repoIdIndex !== -1 && parts[repoIdIndex + 1]) {
      return parts[repoIdIndex + 1];
    }
    return "overview";
  })();

  return (
    <div className="border-b border-border bg-card/40 backdrop-blur-md shrink-0 flex items-center justify-between px-2 sm:px-4">
      {/* Scrollable Tabs */}
      <div
        ref={scrollRef}
        className="flex items-stretch overflow-x-auto scrollbar-none gap-0 flex-1 min-w-0"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map(({ segment, label, icon: Icon, badge }) => {
          const isActive = activeSegment === segment;
          return (
            <Link
              key={segment}
              href={`/repos/${repoId}/${segment}`}
              className={`
                relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono font-medium
                whitespace-nowrap transition-colors shrink-0 border-b-2
                ${
                  isActive
                    ? "text-accent border-accent font-semibold"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
              {badge && (
                <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-accent/20 text-accent font-bold">
                  {badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Unified Search Quick Trigger */}
      {onOpenSearch && (
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 ml-2 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-accent/40 text-xs font-mono transition-colors shrink-0"
          title="Search repository (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-accent" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="text-[10px] bg-card border border-border px-1 py-0.2 rounded text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      )}
    </div>
  );
}
