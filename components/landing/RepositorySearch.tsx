"use client";

/**
 * components/landing/RepositorySearch.tsx — Real, working Explorer entry point.
 *
 * Wires to POST /api/explorer/resolve → canonicalKey → /explorer/${canonicalKey}.
 * Accepts full URL / owner/repo / shorthand (matches the real resolver).
 * Reuses IndexingProgress visual language for the "what happens next" preview.
 */

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";
import { IndexingProgress } from "@/components/shared/IndexingProgress";

// ---------------------------------------------------------------------------
// Featured repos (quick-try pills)
// ---------------------------------------------------------------------------

const FEATURED = [
  { label: "React", value: "facebook/react" },
  { label: "Next.js", value: "vercel/next.js" },
  { label: "Tailwind CSS", value: "tailwindlabs/tailwindcss" },
  { label: "Express", value: "expressjs/express" },
  { label: "TypeScript", value: "microsoft/TypeScript" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RepositorySearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Show indexing preview after a short delay to tease the first-run experience
  useEffect(() => {
    if (isResolving) {
      const t = setTimeout(() => setShowPreview(true), 400);
      return () => clearTimeout(t);
    } else {
      setShowPreview(false);
    }
  }, [isResolving]);

  const handleResolve = async (target: string) => {
    const trimmed = target.trim();
    if (!trimmed) return;
    setIsResolving(true);
    setError(null);
    try {
      const res = await fetch("/api/explorer/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlOrShorthand: trimmed }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Could not resolve repository.");
      }
      router.push(`/explorer/${result.data.canonicalKey}`);
    } catch (err: unknown) {
      setError((err as Error).message || "Could not resolve repository.");
      setIsResolving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleResolve(value);
  };

  return (
    <section
      id="explore"
      className="relative py-24 px-4 sm:px-6"
      aria-labelledby="repo-search-heading"
    >
      {/* Accent radial glow behind the section */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(124,156,255,0.05),transparent)]" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-3">
            Try it now — free, no account needed
          </p>
          <h2
            id="repo-search-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Explore Any Public GitHub Repository
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Paste a GitHub URL, <code className="font-mono text-accent text-sm">owner/repo</code>,
            or shorthand. We'll build the 3D map.
          </p>
        </motion.div>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 relative"
        >
          <div
            className="relative flex items-center gap-2 p-2 rounded-[16px] border bg-surface/80 backdrop-blur-md shadow-lg transition-colors"
            style={{
              borderColor: error ? "rgba(240,87,107,0.4)" : "rgba(124,156,255,0.25)",
            }}
          >
            <div className="flex-1 flex items-center gap-3 pl-2">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                id="repo-search-input"
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="github.com/9140ayush/Structa"
                disabled={isResolving}
                className="flex-1 bg-transparent py-3 text-foreground font-mono text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
                aria-label="GitHub repository URL or shorthand"
                autoComplete="off"
                spellCheck={false}
              />
              {value && !isResolving && (
                <button
                  onClick={() => { setValue(""); setError(null); inputRef.current?.focus(); }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              id="repo-search-submit"
              onClick={() => void handleResolve(value)}
              disabled={isResolving || !value.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-background font-sans font-semibold text-sm transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ boxShadow: "0 0 20px rgba(61,220,151,0.3)" }}
              aria-label="Explore repository"
            >
              {isResolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resolving…
                </>
              ) : (
                <>
                  Explore
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 flex items-start gap-2 px-4 py-3 rounded-[10px] bg-danger/10 border border-danger/25 text-danger text-xs font-mono text-left"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Featured pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Try:</span>
            {FEATURED.map((item) => (
              <button
                key={item.value}
                onClick={() => { setValue(item.value); void handleResolve(item.value); }}
                disabled={isResolving}
                className="px-3 py-1 rounded-full border border-border bg-secondary/40 hover:bg-secondary hover:border-accent/40 text-xs font-mono text-foreground transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* IndexingProgress preview — shows while resolving to tease first-run experience */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <p className="font-mono text-xs text-muted-foreground mb-4 text-center">
                Here&apos;s what happens next&hellip;
              </p>
              <IndexingProgress status="indexing" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
