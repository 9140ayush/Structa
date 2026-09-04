"use client";

/**
 * app/(dashboard)/repos/[repoId]/copilot/page.tsx — Phase 11.14
 *
 * Repository Copilot: Evolved conversational intelligence interface.
 * Grounded in repository data with citations to Files, Modules, and 3D Graph.
 * Supports context modes (Repository-wide, Module-specific, File-specific).
 */

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareCode, Loader2 } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";

interface CopilotPageProps {
  params: Promise<{ repoId: string }>;
}

export default function RepositoryCopilotPage({ params }: CopilotPageProps) {
  const { repoId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [repoName, setRepoName] = useState("Repository");
  const [contextMode, setContextMode] = useState<"repository" | "module" | "file">("repository");

  useEffect(() => {
    async function fetchRepo() {
      try {
        setLoading(true);
        const res = await fetch(`/api/repos/${repoId}/intelligence`);
        if (res.ok) {
          const data = await res.json();
          setRepoName(data.repoName || "Repository");
        }
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    }
    fetchRepo();
  }, [repoId]);

  const handleCitationClick = (modulePath: string) => {
    // Navigate to module or file view
    router.push(`/repos/${repoId}/files?file=${encodeURIComponent(modulePath)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 font-mono text-xs text-muted-foreground py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span>Initializing Repository Copilot...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header bar */}
      <div className="h-12 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 font-mono text-xs">
          <MessageSquareCode className="w-4 h-4 text-accent" />
          <span className="font-bold text-foreground">{repoName}</span>
          <span className="text-muted-foreground">/ Repository Copilot</span>
        </div>

        {/* Context Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-card/60 text-xs font-mono">
          <button
            onClick={() => setContextMode("repository")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              contextMode === "repository"
                ? "bg-accent text-background font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Repo-Wide
          </button>
          <button
            onClick={() => setContextMode("module")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              contextMode === "module"
                ? "bg-accent text-background font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Module-Focused
          </button>
          <button
            onClick={() => setContextMode("file")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              contextMode === "file"
                ? "bg-accent text-background font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            File-Focused
          </button>
        </div>
      </div>

      {/* Embedded Full Panel */}
      <div className="flex-1 min-h-0">
        <ChatPanel repoId={repoId} repoName={repoName} onCitationClick={handleCitationClick} />
      </div>
    </div>
  );
}
