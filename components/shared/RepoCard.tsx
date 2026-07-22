"use client";

import { motion } from "framer-motion";
import { Lock, Globe, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { HealthScoreRing } from "@/components/shared/HealthScoreRing";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepoCardData {
  _id: string;
  name: string;
  url: string;
  isPrivate: boolean;
  healthScore: number;
  lastSyncedAt?: string;
}

interface RepoCardProps {
  repo: RepoCardData;
  onSync?: (repoId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RepoCard({ repo, onSync }: RepoCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onSync || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSync(repo._id);
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSynced = repo.lastSyncedAt
    ? new Date(repo.lastSyncedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="group relative"
    >
      <Link
        href={`/repos/${repo._id}`}
        className="block rounded-[10px] border border-border bg-card p-6 shadow-sm
                   transition-shadow duration-200 hover:shadow-md focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                   focus-visible:ring-offset-background"
        aria-label={`View ${repo.name} repository`}
      >
        {/* Card header */}
        <div className="flex items-start justify-between gap-3">
          {/* Name + private badge */}
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-lg leading-tight text-foreground truncate">
              {repo.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono
                           border"
                style={
                  repo.isPrivate
                    ? {
                        background: "rgba(240,87,107,0.08)",
                        borderColor: "rgba(240,87,107,0.25)",
                        color: "#F0576B",
                      }
                    : {
                        background: "rgba(61,220,151,0.08)",
                        borderColor: "rgba(61,220,151,0.25)",
                        color: "#3DDC97",
                      }
                }
              >
                {repo.isPrivate ? (
                  <>
                    <Lock className="h-2.5 w-2.5" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe className="h-2.5 w-2.5" />
                    Public
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Health score ring */}
          <HealthScoreRing score={repo.healthScore} size={52} strokeWidth={4} />
        </div>

        {/* URL */}
        <div className="mt-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground truncate">
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{repo.url.replace("https://github.com/", "")}</span>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="font-mono text-xs text-muted-foreground">
            {lastSynced ? (
              <>Last synced {lastSynced}</>
            ) : (
              <span className="text-warning">Never synced</span>
            )}
          </span>

          {onSync && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-md border border-border
                         bg-secondary px-2.5 py-1 font-mono text-xs text-foreground
                         transition-colors hover:border-accent/40 hover:bg-secondary/70
                         disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Sync ${repo.name}`}
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing…" : "Sync"}
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

export function RepoCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-border bg-card p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-5 rounded bg-border w-3/4" />
          <div className="h-4 rounded bg-border w-1/3" />
        </div>
        <div className="h-14 w-14 rounded-full bg-border shrink-0" />
      </div>
      <div className="mt-4 h-3 rounded bg-border w-2/3" />
      <div className="mt-5 border-t border-border pt-4">
        <div className="h-3 rounded bg-border w-1/4" />
      </div>
    </div>
  );
}
