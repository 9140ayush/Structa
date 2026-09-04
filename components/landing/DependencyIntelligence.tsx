"use client";

/**
 * components/landing/DependencyIntelligence.tsx — Dependency visualization section.
 *
 * Shows how a module connects outward (imports) and inward (importedBy).
 * Copy uses importedByCount / importsCount framing from the real Module schema.
 * No "critical path" scoring claim (not confirmed).
 */

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FileCode, ArrowRight, ArrowLeft } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock dependency data
// ---------------------------------------------------------------------------

const CENTER_MODULE = { name: "auth.service.ts", loc: 420, complexity: 8.1 };

const IMPORTED_BY = [
  { name: "middleware.ts", count: 1 },
  { name: "api/auth.route.ts", count: 1 },
  { name: "api/user.route.ts", count: 1 },
  { name: "dashboard/layout.tsx", count: 1 },
];

const IMPORTS = [
  { name: "session.service.ts", count: 1 },
  { name: "user.repository.ts", count: 1 },
  { name: "lib/db.ts", count: 1 },
];

// ---------------------------------------------------------------------------
// Module chip
// ---------------------------------------------------------------------------

function ModuleChip({
  name,
  direction,
  index,
  inView,
}: {
  name: string;
  direction: "in" | "out";
  index: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isIn = direction === "in";

  return (
    <motion.div
      initial={{ opacity: 0, x: isIn ? -20 : 20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.35, delay: 0.3 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2"
    >
      {isIn && (
        <ArrowRight
          className={`w-3.5 h-3.5 transition-colors ${hovered ? "text-accent" : "text-border"}`}
          aria-hidden="true"
        />
      )}
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border font-mono text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isIn
            ? "border-accent/25 bg-accent/8 text-accent hover:bg-accent/15 hover:border-accent/40"
            : "border-primary/25 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/40"
        }`}
      >
        <FileCode className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span className="truncate max-w-[140px]">{name}</span>
      </button>
      {!isIn && (
        <ArrowRight
          className={`w-3.5 h-3.5 transition-colors ${hovered ? "text-primary" : "text-border"}`}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DependencyIntelligence() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6" aria-labelledby="dep-intel-heading">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
            Dependency intelligence
          </p>
          <h2
            id="dep-intel-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            See How Everything Connects
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Start from any module. Expand outward to see what it imports, and inward to see what
            depends on it. Understand the blast radius of any change before you make it.
          </p>
        </motion.div>

        {/* Dependency visualization */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
          {/* Imported by */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col gap-2.5"
            aria-label="Modules that import auth.service.ts"
          >
            <p className="font-mono text-[10px] text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Imported by ({IMPORTED_BY.length} modules)
            </p>
            {IMPORTED_BY.map((mod, i) => (
              <ModuleChip key={mod.name} name={mod.name} direction="in" index={i} inView={inView} />
            ))}
          </motion.div>

          {/* Center node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3"
            aria-label="Selected module: auth.service.ts"
          >
            <div
              className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-primary bg-primary/10 text-center"
              style={{ boxShadow: "0 0 40px rgba(61,220,151,0.25)" }}
            >
              <FileCode className="w-7 h-7 text-primary mb-1" aria-hidden="true" />
              <span className="font-mono text-xs font-bold text-primary leading-tight px-2">
                {CENTER_MODULE.name}
              </span>
              {/* Pulse ring */}
              <span
                className="absolute inset-0 rounded-full border border-primary/40 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
              <span className="px-2 py-0.5 rounded-md bg-secondary border border-border">
                {CENTER_MODULE.loc} LOC
              </span>
              <span
                className="px-2 py-0.5 rounded-md border"
                style={{
                  background: "rgba(242,184,75,0.1)",
                  borderColor: "rgba(242,184,75,0.25)",
                  color: "#F2B84B",
                }}
              >
                Complexity {CENTER_MODULE.complexity}/10
              </span>
            </div>
          </motion.div>

          {/* Imports */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col gap-2.5"
            aria-label="Modules that auth.service.ts imports"
          >
            <p className="font-mono text-[10px] text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
              Imports ({IMPORTS.length} modules)
              <ArrowRight className="w-3 h-3" />
            </p>
            {IMPORTS.map((mod, i) => (
              <ModuleChip
                key={mod.name}
                name={mod.name}
                direction="out"
                index={i}
                inView={inView}
              />
            ))}
          </motion.div>
        </div>

        {/* Key stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.55 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-accent" /> Directed edges show import flow
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-primary" /> Node size = lines of code
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface">
            <span className="w-2 h-2 rounded-full bg-warning" /> Color = complexity score
          </span>
        </motion.div>
      </div>
    </section>
  );
}
