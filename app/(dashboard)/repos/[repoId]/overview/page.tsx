"use client";

/**
 * app/(dashboard)/repos/[repoId]/overview/page.tsx — Phase 11.2
 *
 * Repository Overview: the first section users see after opening a repository.
 * Answers: "What am I looking at?"
 *
 * Data source: GET /api/repos/[repoId]/intelligence (aggregated from existing Module docs)
 * No new AI calls, no new parsing pipelines.
 */

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Box,
  Network,
  FolderOpen,
  Cpu,
  HeartPulse,
  Sparkles,
  MessageSquare,
  ArrowRight,
  FileCode,
  Loader2,
  AlertTriangle,
  Lock,
  Globe,
  Link2,
  Workflow,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntelligencePayload {
  repoId: string;
  repoName: string;
  repoUrl: string;
  isPrivate: boolean;
  healthScore: number;
  lastSyncedAt: string | null;
  moduleCount: number;
  fileCount: number;
  folderCount: number;
  totalLOC: number;
  edgeCount: number;
  avgComplexity: number;
  topComplexFiles: Array<{
    id: string;
    path: string;
    name: string;
    complexityScore: number;
    loc: number;
    summary?: string;
    summaryStatus?: string;
  }>;
  topImportedModules: Array<{
    id: string;
    path: string;
    name: string;
    importedByCount: number;
    importsCount: number;
  }>;
  circularDependencies: { count: number; examples: Array<{ path: string[] }> };
  detectedTech: Array<{ name: string; category: string; evidence: string; confidence: string }>;
  computedAt: string;
}

interface OverviewPageProps {
  params: Promise<{ repoId: string }>;
}

// ---------------------------------------------------------------------------
// Quick-nav section cards
// ---------------------------------------------------------------------------

const SECTION_CARDS = [
  {
    segment: "graph",
    label: "3D Graph",
    description: "Explore the dependency graph in 3D",
    icon: Box,
    accent: "text-accent border-accent/20 bg-accent/5",
    primary: true,
  },
  {
    segment: "architecture",
    label: "2D Architecture",
    description: "Visualize folder hierarchy and layers",
    icon: Network,
    accent: "text-primary border-primary/20 bg-primary/5",
    primary: false,
  },
  {
    segment: "explanation",
    label: "AI Explanation",
    description: "Get an AI-generated project overview",
    icon: Sparkles,
    accent: "text-warning border-warning/20 bg-warning/5",
    primary: false,
  },
  {
    segment: "files",
    label: "File Explorer",
    description: "Browse files with intelligence overlays",
    icon: FolderOpen,
    accent: "text-info border-info/20 bg-info/5",
    primary: false,
  },
  {
    segment: "modules",
    label: "Module Explorer",
    description: "Inspect first-class repository modules",
    icon: FolderOpen,
    accent: "text-accent border-accent/20 bg-accent/5",
    primary: false,
  },
  {
    segment: "reading-path",
    label: "Reading Path",
    description: "Where to start exploring this repo",
    icon: Network,
    accent: "text-primary border-primary/20 bg-primary/5",
    primary: false,
  },
  {
    segment: "story",
    label: "Repository Story",
    description: "Complete human-readable narrative",
    icon: Sparkles,
    accent: "text-warning border-warning/20 bg-warning/5",
    primary: false,
  },
  {
    segment: "copilot",
    label: "Repo Copilot",
    description: "Conversational Q&A over codebase",
    icon: MessageSquare,
    accent: "text-info border-info/20 bg-info/5",
    primary: false,
  },
  {
    segment: "tech-stack",
    label: "Tech Stack",
    description: "Detected technologies and frameworks",
    icon: Cpu,
    accent: "text-accent border-accent/20 bg-accent/5",
    primary: false,
  },
  {
    segment: "flows",
    label: "Flows",
    description: "Trace request and data flows",
    icon: Workflow,
    accent: "text-primary border-primary/20 bg-primary/5",
    primary: false,
  },
  {
    segment: "dependencies",
    label: "Dependencies",
    description: "Understand coupling and relationships",
    icon: Link2,
    accent: "text-warning border-warning/20 bg-warning/5",
    primary: false,
  },
  {
    segment: "health",
    label: "Health",
    description: "Complexity, coupling, and insights",
    icon: HeartPulse,
    accent: "text-danger border-danger/20 bg-danger/5",
    primary: false,
  },
];

// ---------------------------------------------------------------------------
// Health score ring
// ---------------------------------------------------------------------------

function HealthRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#3DDC97" : score >= 60 ? "#F2B84B" : "#F0576B";
  const offset = circ - (score / 100) * circ;

  return (
    <svg width={90} height={90} viewBox="0 0 90 90" className="shrink-0">
      <circle
        cx={45}
        cy={45}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        className="text-border"
      />
      <circle
        cx={45}
        cy={45}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x={45} y={50} textAnchor="middle" fontSize={18} fontWeight="bold" fill={color}>
        {score}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-heading font-bold text-foreground">{value}</span>
      {sub && <span className="text-[11px] font-mono text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OverviewPage({ params }: OverviewPageProps) {
  const { repoId } = use(params);
  const [intel, setIntel] = useState<IntelligencePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setIntel(data);
      })
      .catch(() => setError("Failed to load repository intelligence."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="font-mono text-sm text-muted-foreground">Loading repository overview…</p>
        </div>
      </div>
    );
  }

  if (error || !intel) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertTriangle className="w-8 h-8 text-danger" />
        <p className="font-mono text-sm text-danger">{error ?? "Failed to load overview."}</p>
        <p className="font-mono text-xs text-muted-foreground">
          Sync the repository to generate intelligence data.
        </p>
        <Link
          href={`/repos/${repoId}/graph`}
          className="px-4 py-2 rounded-md bg-accent text-background font-mono text-xs font-bold hover:bg-accent/90 transition-colors"
        >
          Open 3D Graph & Sync
        </Link>
      </div>
    );
  }

  const notSynced = intel.moduleCount === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* -------------------------------------------------------------- */}
        {/* Repository Header                                               */}
        {/* -------------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between gap-6 flex-wrap"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-2xl text-foreground">{intel.repoName}</h1>
              <span
                className={`flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                  intel.isPrivate
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-primary/30 bg-primary/10 text-primary"
                }`}
              >
                {intel.isPrivate ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : (
                  <Globe className="w-2.5 h-2.5" />
                )}
                {intel.isPrivate ? "Private" : "Public"}
              </span>
            </div>
            <a
              href={intel.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              {intel.repoUrl}
            </a>
            {intel.lastSyncedAt && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Last synced: {new Date(intel.lastSyncedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Health Ring */}
          <div className="flex flex-col items-center gap-1">
            <HealthRing score={intel.healthScore} />
            <span className="font-mono text-[10px] text-muted-foreground">Health Score</span>
          </div>
        </motion.div>

        {/* -------------------------------------------------------------- */}
        {/* Not-synced banner                                               */}
        {/* -------------------------------------------------------------- */}
        {notSynced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="font-mono text-sm font-semibold text-warning">
                Repository not yet synced
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Open the 3D Graph and click Sync to analyze this repository.
              </p>
            </div>
            <Link
              href={`/repos/${repoId}/graph`}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-warning text-background font-mono text-xs font-bold hover:bg-warning/90 transition-colors shrink-0"
            >
              Sync Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Metrics Grid                                                    */}
        {/* -------------------------------------------------------------- */}
        {!notSynced && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Repository Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard label="Total Modules" value={intel.moduleCount} />
              <MetricCard label="Files" value={intel.fileCount} />
              <MetricCard label="Folders" value={intel.folderCount} />
              <MetricCard label="Lines of Code" value={intel.totalLOC.toLocaleString()} />
              <MetricCard label="Dependencies" value={intel.edgeCount} />
              <MetricCard
                label="Avg Complexity"
                value={`${intel.avgComplexity}/10`}
                sub={
                  intel.avgComplexity >= 7 ? "High" : intel.avgComplexity >= 4 ? "Medium" : "Low"
                }
              />
            </div>
          </motion.section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Tech Stack Preview                                              */}
        {/* -------------------------------------------------------------- */}
        {intel.detectedTech.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Tech Stack
              </h2>
              <Link
                href={`/repos/${repoId}/tech-stack`}
                className="font-mono text-xs text-accent hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {intel.detectedTech.slice(0, 14).map((tech) => (
                <span
                  key={tech.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/60 font-mono text-xs text-foreground"
                >
                  <Cpu className="w-3 h-3 text-accent" />
                  {tech.name}
                  <span className="text-[9px] text-muted-foreground uppercase">
                    {tech.category}
                  </span>
                </span>
              ))}
              {intel.detectedTech.length > 14 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-border bg-card/40 font-mono text-xs text-muted-foreground">
                  +{intel.detectedTech.length - 14} more
                </span>
              )}
            </div>
          </motion.section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Most Complex Files                                              */}
        {/* -------------------------------------------------------------- */}
        {intel.topComplexFiles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Most Complex Files
              </h2>
              <Link
                href={`/repos/${repoId}/health`}
                className="font-mono text-xs text-accent hover:underline flex items-center gap-1"
              >
                View health <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {intel.topComplexFiles.slice(0, 6).map((file) => (
                <Link
                  key={file.id}
                  href={`/repos/${repoId}/graph`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/40 hover:bg-secondary hover:border-accent/30 transition-colors group"
                >
                  <FileCode className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-accent" />
                  <span className="font-mono text-xs text-foreground truncate flex-1">
                    {file.path}
                  </span>
                  <span
                    className="font-mono text-xs shrink-0"
                    style={{
                      color:
                        file.complexityScore >= 7
                          ? "#F0576B"
                          : file.complexityScore >= 4
                            ? "#F2B84B"
                            : "#3DDC97",
                    }}
                  >
                    {file.complexityScore}/10
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {file.loc} LOC
                  </span>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Circular Dependencies Alert                                     */}
        {/* -------------------------------------------------------------- */}
        {intel.circularDependencies.count > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-mono text-sm font-semibold text-warning">
                {intel.circularDependencies.count} Circular Dependenc
                {intel.circularDependencies.count === 1 ? "y" : "ies"} Detected
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Circular dependencies can cause initialization issues and complicate testing.
              </p>
            </div>
            <Link
              href={`/repos/${repoId}/dependencies`}
              className="flex items-center gap-1 font-mono text-xs text-warning hover:underline shrink-0"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Section Cards                                                   */}
        {/* -------------------------------------------------------------- */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
            Explore Repository
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SECTION_CARDS.map(({ segment, label, description, icon: Icon, accent }) => (
              <Link
                key={segment}
                href={`/repos/${repoId}/${segment}`}
                className={`p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg group flex flex-col gap-2 ${accent}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5" />
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm text-foreground">{label}</p>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* -------------------------------------------------------------- */}
        {/* CTA Buttons                                                     */}
        {/* -------------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-3 pb-4"
        >
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background font-mono text-sm font-bold hover:bg-accent/90 transition-colors"
          >
            <Box className="w-4 h-4" />
            Explore 3D Graph
          </Link>
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground font-mono text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Ask the Codebase
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
