"use client";

/**
 * app/(dashboard)/repos/[repoId]/health/page.tsx — Phase 11.10
 *
 * Codebase Health & Engineering Insights: diagnostic experience built on
 * the existing healthScore + Module complexity/coupling data.
 *
 * Never invents metrics the parser cannot reliably calculate.
 * Foundation: existing Repository.healthScore + Module.complexityScore.
 */

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Loader2,
  AlertTriangle,
  Box,
  AlertCircle,
  CheckCircle,
  Info,
  FileCode,
  Link2,
  Activity,
} from "lucide-react";

interface FileNodeHealth {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  complexityScore: number;
  loc: number;
  importsCount: number;
  importedByCount: number;
}

interface HealthPageProps {
  params: Promise<{ repoId: string }>;
}

interface HealthData {
  healthScore: number;
  fileCount: number;
  totalLOC: number;
  avgComplexity: number;
  edgeCount: number;
  topComplexFiles: FileNodeHealth[];
  topImportedModules: FileNodeHealth[];
  topImporterModules: FileNodeHealth[];
  isolatedModules: FileNodeHealth[];
  circularDependencies: { count: number; examples: Array<{ path: string[] }> };
  fileTree: FileNodeHealth[];
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

type Severity = "critical" | "warning" | "info" | "good";

function getSeverityStyle(s: Severity) {
  switch (s) {
    case "critical":
      return {
        icon: AlertCircle,
        color: "text-danger",
        border: "border-danger/30",
        bg: "bg-danger/5",
        badge: "bg-danger/10 text-danger border-danger/20",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        color: "text-warning",
        border: "border-warning/30",
        bg: "bg-warning/5",
        badge: "bg-warning/10 text-warning border-warning/20",
      };
    case "info":
      return {
        icon: Info,
        color: "text-accent",
        border: "border-accent/30",
        bg: "bg-accent/5",
        badge: "bg-accent/10 text-accent border-accent/20",
      };
    case "good":
      return {
        icon: CheckCircle,
        color: "text-primary",
        border: "border-primary/30",
        bg: "bg-primary/5",
        badge: "bg-primary/10 text-primary border-primary/20",
      };
  }
}

// ---------------------------------------------------------------------------
// Dimension analysis
// ---------------------------------------------------------------------------

interface Dimension {
  name: string;
  status: "Good" | "Medium" | "Needs attention";
  score: number; // 0-100
  note: string;
}

function computeDimensions(data: HealthData): Dimension[] {
  const dims: Dimension[] = [];

  // Complexity dimension
  const highComplexCount = data.topComplexFiles.filter((f) => f.complexityScore >= 7).length;
  const complexRatio = data.fileCount > 0 ? highComplexCount / data.fileCount : 0;
  dims.push({
    name: "Complexity",
    score: Math.max(0, 100 - complexRatio * 400),
    status: complexRatio > 0.2 ? "Needs attention" : complexRatio > 0.1 ? "Medium" : "Good",
    note:
      highComplexCount > 0
        ? `${highComplexCount} file${highComplexCount > 1 ? "s" : ""} with high complexity (≥7/10)`
        : "No high-complexity files detected",
  });

  // Coupling dimension
  const highCouplingCount = data.topImporterModules.filter((m) => m.importsCount > 10).length;
  const couplingRatio = data.fileCount > 0 ? highCouplingCount / data.fileCount : 0;
  dims.push({
    name: "Coupling",
    score: Math.max(0, 100 - couplingRatio * 500),
    status: couplingRatio > 0.15 ? "Needs attention" : couplingRatio > 0.08 ? "Medium" : "Good",
    note:
      highCouplingCount > 0
        ? `${highCouplingCount} module${highCouplingCount > 1 ? "s" : ""} import >10 dependencies`
        : "Coupling looks healthy",
  });

  // Architecture dimension (circular deps proxy)
  const cycleCount = data.circularDependencies.count;
  dims.push({
    name: "Architecture",
    score: Math.max(0, 100 - cycleCount * 10),
    status: cycleCount > 5 ? "Needs attention" : cycleCount > 0 ? "Medium" : "Good",
    note:
      cycleCount > 0
        ? `${cycleCount} circular dependenc${cycleCount === 1 ? "y" : "ies"} detected`
        : "No circular dependencies",
  });

  // Isolation dimension
  const isolatedRatio = data.fileCount > 0 ? data.isolatedModules.length / data.fileCount : 0;
  dims.push({
    name: "Connectivity",
    score: Math.max(0, 100 - isolatedRatio * 200),
    status: isolatedRatio > 0.3 ? "Needs attention" : isolatedRatio > 0.15 ? "Medium" : "Good",
    note:
      data.isolatedModules.length > 0
        ? `${data.isolatedModules.length} isolated module${data.isolatedModules.length > 1 ? "s" : ""} (no imports or dependents)`
        : "Good module connectivity",
  });

  return dims;
}

// ---------------------------------------------------------------------------
// Finding interface
// ---------------------------------------------------------------------------

interface Finding {
  title: string;
  description: string;
  severity: Severity;
  recommendation: string;
  files?: string[];
}

function computeFindings(data: HealthData): Finding[] {
  const findings: Finding[] = [];

  // High complexity files
  const criticalComplexFiles = data.topComplexFiles.filter((f) => f.complexityScore >= 8);
  if (criticalComplexFiles.length > 0) {
    findings.push({
      title: "High Complexity Files",
      description: `${criticalComplexFiles.length} file${criticalComplexFiles.length > 1 ? "s" : ""} have very high complexity scores (≥8/10).`,
      severity: criticalComplexFiles.length > 3 ? "critical" : "warning",
      recommendation:
        "Consider refactoring these files into smaller, more focused modules. High complexity correlates with bug density.",
      files: criticalComplexFiles.slice(0, 3).map((f) => f.path),
    });
  }

  // Circular dependencies
  if (data.circularDependencies.count > 0) {
    findings.push({
      title: "Circular Dependencies",
      description: `${data.circularDependencies.count} import cycle${data.circularDependencies.count > 1 ? "s" : ""} detected.`,
      severity: data.circularDependencies.count > 3 ? "critical" : "warning",
      recommendation:
        "Circular imports can cause module initialization order issues and make testing difficult. Consider extracting shared logic into a separate utility module.",
      files: data.circularDependencies.examples.slice(0, 2).map((e) => e.path.join(" → ")),
    });
  }

  // Highly coupled modules
  const highlyCoupled = data.topImporterModules.filter((m) => m.importsCount > 15);
  if (highlyCoupled.length > 0) {
    findings.push({
      title: "Highly Coupled Modules",
      description: `${highlyCoupled.length} module${highlyCoupled.length > 1 ? "s" : ""} import more than 15 other modules.`,
      severity: "warning",
      recommendation:
        "Modules with many dependencies are harder to test and more fragile to changes. Consider using dependency injection or breaking responsibilities apart.",
      files: highlyCoupled.slice(0, 3).map((f) => f.path),
    });
  }

  // Large files
  const largeFiles = data.fileTree
    .filter((f) => f.type === "file" && f.loc > 500)
    .sort((a, b) => b.loc - a.loc)
    .slice(0, 5);
  if (largeFiles.length > 0) {
    findings.push({
      title: "Large Files",
      description: `${largeFiles.length} file${largeFiles.length > 1 ? "s" : ""} exceed 500 lines of code.`,
      severity: "info",
      recommendation:
        "Large files often contain too many responsibilities. Consider splitting them into focused modules.",
      files: largeFiles.slice(0, 3).map((f) => `${f.path} (${f.loc} LOC)`),
    });
  }

  // Isolated modules
  if (data.isolatedModules.length > 5) {
    findings.push({
      title: "Isolated Modules",
      description: `${data.isolatedModules.length} files have no imports and no dependents.`,
      severity: "info",
      recommendation:
        "These files may be unused dead code or standalone scripts. Review whether they should be removed or better integrated.",
      files: data.isolatedModules.slice(0, 3).map((f) => f.path),
    });
  }

  // Good findings
  if (findings.filter((f) => f.severity === "critical").length === 0) {
    findings.push({
      title: "No Critical Issues",
      description: "No critical architectural problems detected.",
      severity: "good",
      recommendation: "Keep maintaining current code quality standards.",
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Health gauge
// ---------------------------------------------------------------------------

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#3DDC97" : score >= 60 ? "#F2B84B" : "#F0576B";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Fair" : "Needs Attention";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle
          cx={65}
          cy={65}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={12}
          className="text-border"
        />
        <circle
          cx={65}
          cy={65}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
        <text x={65} y={61} textAnchor="middle" fontSize={28} fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x={65} y={77} textAnchor="middle" fontSize={11} fill="#8B92A3">
          /100
        </text>
      </svg>
      <span className="font-mono text-sm font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dimension bar
// ---------------------------------------------------------------------------

function DimensionBar({ dim }: { dim: Dimension }) {
  const statusColor =
    dim.status === "Good"
      ? "text-primary"
      : dim.status === "Medium"
        ? "text-warning"
        : "text-danger";
  const barColor =
    dim.status === "Good" ? "bg-primary" : dim.status === "Medium" ? "bg-warning" : "bg-danger";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-foreground font-medium">{dim.name}</span>
        <span className={`font-semibold ${statusColor}`}>{dim.status}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000`}
          style={{ width: `${dim.score}%` }}
        />
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">{dim.note}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HealthPage({ params }: HealthPageProps) {
  const { repoId } = use(params);
  const [data, setData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load health data."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  const dimensions = useMemo(() => (data ? computeDimensions(data) : []), [data]);
  const findings = useMemo(() => (data ? computeFindings(data) : []), [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertTriangle className="w-6 h-6 text-danger" />
        <p className="font-mono text-sm text-danger">{error ?? "Failed to load health data."}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-danger" />
              Codebase Health
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Diagnostic insights from existing complexity and dependency analysis
            </p>
          </div>
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 bg-accent/5 text-accent font-mono text-xs hover:bg-accent/10 transition-colors"
          >
            <Box className="w-3.5 h-3.5" /> 3D Graph
          </Link>
        </div>

        {/* Health score + dimensions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 p-6 rounded-2xl border border-border bg-card/60"
        >
          <HealthGauge score={data.healthScore} />
          <div className="space-y-5">
            <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Health Dimensions
            </h2>
            {dimensions.map((dim) => (
              <DimensionBar key={dim.name} dim={dim} />
            ))}
          </div>
        </motion.div>

        {/* Findings */}
        <section>
          <h2 className="font-heading font-semibold text-base text-foreground mb-4">
            Top Findings
          </h2>
          <div className="space-y-3">
            {findings.map((finding, i) => {
              const style = getSeverityStyle(finding.severity);
              const SeverityIcon = style.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border ${style.border} ${style.bg} space-y-2`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityIcon className={`w-4 h-4 shrink-0 mt-0.5 ${style.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-sm text-foreground">
                          {finding.title}
                        </span>
                        <span
                          className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${style.badge} capitalize`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-muted-foreground mt-1">
                        {finding.description}
                      </p>
                      {finding.files && finding.files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {finding.files.map((f, fi) => (
                            <code
                              key={fi}
                              className="font-mono text-[10px] px-2 py-0.5 rounded bg-card/80 border border-border text-muted-foreground"
                            >
                              {f}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pl-7 font-sans text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-info shrink-0">💡</span>
                    <span>{finding.recommendation}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Links to related sections */}
        <section className="pb-4">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Related Sections
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/repos/${repoId}/dependencies`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
            >
              <Link2 className="w-3.5 h-3.5 text-warning" /> Dependency Intelligence
            </Link>
            <Link
              href={`/repos/${repoId}/files`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-info" /> File Explorer
            </Link>
            <Link
              href={`/repos/${repoId}/graph`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
            >
              <Box className="w-3.5 h-3.5 text-accent" /> 3D Graph
            </Link>
            <Link
              href={`/repos/${repoId}/analytics`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/40 hover:bg-secondary font-mono text-xs text-foreground transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-primary" /> Analytics
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
