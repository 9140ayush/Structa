"use client";

/**
 * app/(dashboard)/repos/[repoId]/tech-stack/page.tsx — Phase 11.7
 *
 * Tech Stack Intelligence: detected technologies grouped by category,
 * with evidence files and category-level explanations.
 */

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Loader2, AlertTriangle, FileCode, Box } from "lucide-react";

interface TechEntry {
  name: string;
  category: string;
  evidence: string;
  confidence: "high" | "medium";
}

interface TechStackPageProps {
  params: Promise<{ repoId: string }>;
}

// Category descriptions for context
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Language: "Primary programming languages used in this repository.",
  Runtime: "The execution environment(s) this project runs in.",
  Framework: "High-level application frameworks that define the project structure.",
  "Backend Framework": "Server-side web frameworks handling requests and routing.",
  "Build Tool": "Tools for bundling, compiling, and optimizing the codebase.",
  Styling: "CSS frameworks, preprocessors, or styling solutions.",
  Database: "Data storage and retrieval solutions.",
  "Database ORM": "Object-Relational Mappers or query builders for database access.",
  Authentication: "User identity, session, and access management.",
  AI: "AI/ML libraries, APIs, or platforms integrated into this project.",
  Testing: "Frameworks and utilities for automated testing.",
  "Testing (E2E)": "End-to-end browser testing frameworks.",
  "State Management": "Client-side state management solutions.",
  DevOps: "Containerization and infrastructure tooling.",
  "CI/CD": "Continuous integration and deployment pipelines.",
  Deployment: "Hosting and deployment platforms.",
  Cache: "Caching and in-memory data store solutions.",
};

// Category badge color
function getCategoryStyle(cat: string): string {
  const styles: Record<string, string> = {
    Language: "border-accent/30 bg-accent/10 text-accent",
    Runtime: "border-primary/30 bg-primary/10 text-primary",
    Framework: "border-warning/30 bg-warning/10 text-warning",
    "Backend Framework": "border-warning/30 bg-warning/10 text-warning",
    Styling: "border-info/30 bg-info/10 text-info",
    Database: "border-danger/30 bg-danger/10 text-danger",
    "Database ORM": "border-danger/30 bg-danger/10 text-danger",
    Authentication: "border-primary/30 bg-primary/10 text-primary",
    AI: "border-warning/30 bg-warning/10 text-warning",
    Testing: "border-info/30 bg-info/10 text-info",
    "State Management": "border-accent/30 bg-accent/10 text-accent",
    DevOps: "border-muted-foreground/30 bg-secondary text-muted-foreground",
    "CI/CD": "border-muted-foreground/30 bg-secondary text-muted-foreground",
    Deployment: "border-primary/30 bg-primary/10 text-primary",
  };
  return styles[cat] ?? "border-border bg-card/40 text-muted-foreground";
}

export default function TechStackPage({ params }: TechStackPageProps) {
  const { repoId } = use(params);
  const [techList, setTechList] = useState<TechEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/repos/${repoId}/intelligence`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setTechList(data.detectedTech ?? []);
      })
      .catch(() => setError("Failed to load tech stack data."))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, TechEntry[]>();
    for (const tech of techList) {
      if (!map.has(tech.category)) map.set(tech.category, []);
      map.get(tech.category)!.push(tech);
    }
    // Sort categories: Language first, then alphabetical
    return Array.from(map.entries()).sort(([a], [b]) => {
      const priority = ["Language", "Runtime", "Framework", "Backend Framework"];
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai !== -1 && bi === -1) return -1;
      if (bi !== -1 && ai === -1) return 1;
      if (ai !== -1 && bi !== -1) return ai - bi;
      return a.localeCompare(b);
    });
  }, [techList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertTriangle className="w-6 h-6 text-danger" />
        <p className="font-mono text-sm text-danger">{error}</p>
      </div>
    );
  }

  const isEmpty = techList.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              Tech Stack Intelligence
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              {techList.length} technologies detected from repository file analysis
            </p>
          </div>
          <Link
            href={`/repos/${repoId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30 bg-accent/5 text-accent font-mono text-xs hover:bg-accent/10 transition-colors"
          >
            <Box className="w-3.5 h-3.5" /> 3D Graph
          </Link>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Cpu className="w-8 h-8 text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">No technologies detected yet.</p>
            <p className="font-mono text-xs text-muted-foreground">
              Sync the repository to enable tech stack detection.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, techs], ci) => (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.05 }}
              >
                <div className="mb-3">
                  <h2 className="font-heading font-semibold text-base text-foreground">
                    {category}
                  </h2>
                  {CATEGORY_DESCRIPTIONS[category] && (
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {techs.map((tech) => (
                    <div
                      key={tech.name}
                      className={`p-4 rounded-xl border transition-all hover:shadow-md ${getCategoryStyle(tech.category)}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-heading font-semibold text-sm text-foreground">
                          {tech.name}
                        </span>
                        <span
                          className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${
                            tech.confidence === "high"
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-card/40 text-muted-foreground"
                          }`}
                        >
                          {tech.confidence}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                        <FileCode className="w-3 h-3 shrink-0" />
                        <span className="truncate" title={tech.evidence}>
                          {tech.evidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}

        {/* Footer note */}
        {!isEmpty && (
          <p className="font-mono text-[10px] text-muted-foreground pb-4">
            Detection is heuristic-based on file paths and names. Confidence: high = config file
            match; medium = path/import pattern match.
          </p>
        )}
      </div>
    </div>
  );
}
