/**
 * components/shared/IndexingProgress.tsx — Indexing progress stepper interface.
 *
 * design.md §6: motion transitions and glassmorphism.
 */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IndexingProgressProps {
  status: "not_indexed" | "indexing" | "indexed" | "failed";
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IndexingProgress({ status, error }: IndexingProgressProps) {
  const steps = [
    {
      id: "validate",
      label: "Repository Validation",
      description: "Verifying repository visibility and accessibility",
    },
    {
      id: "fetch",
      label: "Fetching Repository Source",
      description: "Fetching source directories and recursive trees from GitHub",
    },
    {
      id: "parse",
      label: "Parsing Codebase",
      description: "Extracting imports, parsing dependencies, and sizing modules",
    },
    {
      id: "layout",
      label: "Building 3D Layout Graph",
      description: "Computing force-directed physics engine coordinates",
    },
    {
      id: "ai",
      label: "Generating AI Summaries",
      description: "Compiling OpenAI technical summaries for source files",
    },
  ];

  const getStepState = (stepId: string) => {
    if (status === "failed") {
      return "failed";
    }

    // Coarse status mapping to approximate visual stages
    if (status === "indexed") {
      return "completed";
    }

    if (status === "indexing") {
      // Show progress dynamically or just general loading
      if (stepId === "validate" || stepId === "fetch") {
        return "completed";
      }
      if (stepId === "parse" || stepId === "layout") {
        return "loading";
      }
      return "pending";
    }

    // not_indexed
    if (stepId === "validate") {
      return "loading";
    }
    return "pending";
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-xl border border-border bg-surface-elevated/70 backdrop-blur-md shadow-2xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h3 className="font-heading font-bold text-sm text-foreground">
          {status === "failed" ? "Indexing Failed" : "Indexing Codebase Architecture"}
        </h3>
        <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
          {status === "failed"
            ? "An error occurred during repository ingestion."
            : "Compiling repository metadata and computing spatial visual layouts."}
        </p>
      </div>

      {/* Stepper */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const state = getStepState(step.id);

          return (
            <div key={step.id} className="flex gap-3 items-start">
              {/* Connector line */}
              <div className="relative flex flex-col items-center justify-center shrink-0 w-5">
                <div className="z-10">
                  {state === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-primary bg-background rounded-full" />
                  )}
                  {state === "loading" && (
                    <Loader2 className="w-5 h-5 text-accent animate-spin bg-background rounded-full" />
                  )}
                  {state === "pending" && (
                    <Circle className="w-5 h-5 text-muted-foreground bg-background rounded-full" />
                  )}
                  {state === "failed" && (
                    <AlertCircle className="w-5 h-5 text-danger bg-background rounded-full" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-5 bottom-[-16px] w-[1px] bg-border" />
                )}
              </div>

              {/* Text metadata */}
              <div className="space-y-0.5">
                <p
                  className={`text-xs font-heading font-semibold transition-colors duration-200 ${
                    state === "completed"
                      ? "text-foreground"
                      : state === "loading"
                        ? "text-accent"
                        : state === "failed"
                          ? "text-danger"
                          : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Output block */}
      {status === "failed" && error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-[11px] font-mono leading-relaxed"
        >
          <span className="font-bold">Error:</span> {error}
        </motion.div>
      )}
    </div>
  );
}
