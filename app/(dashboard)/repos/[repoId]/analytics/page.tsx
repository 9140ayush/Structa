"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, BarChart2, Users, History, FileText, Flame } from "lucide-react";

interface AnalyticsData {
  mostVisited: Array<{
    path: string;
    type: string;
    loc: number;
    complexityScore: number;
    visitCount: number;
  }>;
  timeline: Array<{
    author: string;
    avatarUrl: string;
    commitSha: string;
    message: string;
    timestamp: string;
    changes: string[];
  }>;
  contributors: Array<{
    name: string;
    commits: number;
    filesTouchedCount: number;
    avatarUrl: string;
    filesTouched: string[];
  }>;
}

interface AnalyticsPageProps {
  params: Promise<{ repoId: string }>;
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { repoId } = use(params);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/analytics/${repoId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to compile workspace analytics.");
        }
        setData(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to retrieve analytics.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [repoId]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/repos/${repoId}`}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            title="Back to Codebase Map"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-heading font-bold text-base text-foreground truncate">
            Workspace Intelligence & Analytics
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-y-auto p-6 lg:p-8">
        {isLoading ? (
          <div className="w-full h-96 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="font-mono text-xs text-muted-foreground">Compiling analytics report...</p>
          </div>
        ) : error || !data ? (
          <div className="max-w-md mx-auto p-6 rounded-xl border border-danger/20 bg-danger/5 text-center space-y-4">
            <p className="font-mono text-sm text-danger">{error || "No data available."}</p>
            <Link
              href={`/repos/${repoId}`}
              className="inline-block px-4 py-2 bg-secondary border border-border rounded-md font-mono text-xs hover:bg-secondary/80 text-foreground"
            >
              Return to Map
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Top row: Summary Cards / Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <Flame className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Total Collaborators
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {data?.contributors?.length || 0}
                </h2>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Active developers contributing commits.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <History className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Analyzed Commits
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {data?.timeline?.length || 0}
                </h2>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Recent architecture commits mapped onto modules.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 backdrop-blur-sm space-y-2">
                <div className="flex items-center gap-2 text-success">
                  <FileText className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Tracked Modules
                  </span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-foreground">
                  {data?.mostVisited?.length || 0}
                </h2>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Modules registered with workspace visits.
                </p>
              </div>
            </div>

            {/* Split layout: Heatmap / Visited modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Visited Modules */}
              <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <BarChart2 className="w-4 h-4 text-accent" />
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Most Visited Modules
                  </h3>
                </div>

                {data?.mostVisited?.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                    Not enough activity data yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.mostVisited?.map((v, index) => (
                      <div
                        key={v.path}
                        className="p-3 rounded-lg border border-border/60 bg-card/30 flex items-center justify-between gap-4 font-mono text-xs"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-muted-foreground shrink-0">#{index + 1}</span>
                          <span className="text-foreground font-bold truncate block" title={v.path}>
                            {v.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted-foreground text-[10px]">{v.loc} LOC</span>
                          <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/20 text-accent font-bold">
                            {v.visitCount} visits
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contributor Heatmap / Stats */}
              <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Contributor Module Activity
                  </h3>
                </div>

                {data?.contributors?.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                    No contributor activity is available yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.contributors?.map((c) => (
                      <div
                        key={c.name}
                        className="p-4 rounded-lg border border-border/60 bg-card/30 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt={c.name}
                                className="w-7 h-7 rounded-full border border-border shrink-0"
                              />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-muted-foreground uppercase shrink-0">
                                {c.name[0]}
                              </span>
                            )}
                            <span className="font-mono text-xs text-foreground font-bold truncate">
                              {c.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/20 text-primary">
                              {c.commits} commits
                            </span>
                            <span className="px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                              {c.filesTouchedCount} files
                            </span>
                          </div>
                        </div>

                        {/* Touched Files list */}
                        {c.filesTouched?.length > 0 && (
                          <div className="space-y-1 font-mono text-[10px] pl-9.5">
                            <span className="text-muted-foreground text-[9px] uppercase tracking-wider block mb-1">
                              Touched Modules:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {c.filesTouched.slice(0, 5).map((f: string) => (
                                <span
                                  key={f}
                                  className="px-2 py-0.5 rounded bg-surface border border-border text-foreground text-[9px] truncate max-w-[150px]"
                                  title={f}
                                >
                                  {f.split("/").pop()}
                                </span>
                              ))}
                              {c.filesTouched.length > 5 && (
                                <span className="text-muted-foreground py-0.5">
                                  +{c.filesTouched.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Commits Timeline */}
            <div className="p-6 rounded-xl border border-border bg-surface-elevated/40 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <History className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Recent Commit Architecture Timeline
                </h3>
              </div>

              {data?.timeline?.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-muted-foreground italic">
                  No commits history found.
                </div>
              ) : (
                <div className="relative border-l border-border pl-6 ml-3 space-y-6">
                  {data?.timeline?.map((commit) => (
                    <div key={commit.commitSha} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full border border-accent bg-[#0A0C10] group-hover:scale-125 transition-transform" />

                      <div className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[10px]">
                          <div className="flex items-center gap-2 min-w-0">
                            {commit.avatarUrl && (
                              <img
                                src={commit.avatarUrl}
                                alt={commit.author}
                                className="w-5 h-5 rounded-full border border-border shrink-0"
                              />
                            )}
                            <span className="text-foreground font-bold truncate">
                              {commit.author}
                            </span>
                            <span className="text-muted-foreground text-[9px] px-1.5 py-0.5 rounded bg-secondary border border-border font-mono shrink-0">
                              {commit.commitSha}
                            </span>
                          </div>
                          <span className="text-muted-foreground shrink-0">
                            {new Date(commit.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-foreground font-sans leading-normal">
                          {commit.message}
                        </p>

                        {commit.changes?.length > 0 && (
                          <div className="space-y-1 pl-3 border-l border-border/80 font-mono text-[9px] text-muted-foreground">
                            <span>Modified Modules:</span>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {commit.changes.map((file: string) => (
                                <li key={file} className="truncate" title={file}>
                                  {file}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
