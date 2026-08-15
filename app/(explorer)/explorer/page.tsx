/**
 * app/(explorer)/explorer/page.tsx — Refactored Explorer Landing page.
 *
 * Implements Task 5, 6, 12, 13: Popular Repositories, Recently Explored, and Search History.
 */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowRight,
  Star,
  Loader2,
  Sparkles,
  Flame,
  History,
  Terminal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicSearchResult {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
}

interface RepositoryCardData {
  canonicalKey: string;
  owner: string;
  repo: string;
  name: string;
  url: string;
  description?: string;
  stars: number;
  language?: string;
  healthScore?: number;
  exploreCount?: number;
}

const FEATURED_REPOS = [
  { name: "facebook/react", label: "React" },
  { name: "vercel/next.js", label: "Next.js" },
  { name: "tailwindlabs/tailwindcss", label: "Tailwind CSS" },
  { name: "expressjs/express", label: "Express" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExplorerLandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();

  // Input & Resolution State
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<PublicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Popular & Recent Repos Lists
  const [popularRepos, setPopularRepos] = useState<RepositoryCardData[]>([]);
  const [recentRepos, setRecentRepos] = useState<RepositoryCardData[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Popular and Recent Repositories on mount / auth load
  useEffect(() => {
    async function fetchPopular() {
      try {
        const res = await fetch("/api/explorer/popular");
        const json = await res.json();
        if (res.ok && json.success) {
          setPopularRepos(json.data.repositories || []);
        }
      } catch (err) {
        console.error("Failed to load popular repositories:", err);
      } finally {
        setIsLoadingPopular(false);
      }
    }

    async function fetchRecent() {
      if (!isSignedIn) {
        setRecentRepos([]);
        setIsLoadingRecent(false);
        return;
      }
      try {
        const res = await fetch("/api/explorer/recent");
        const json = await res.json();
        if (res.ok && json.success) {
          setRecentRepos(json.data.repositories || []);
        }
      } catch (err) {
        console.error("Failed to load recent repositories:", err);
      } finally {
        setIsLoadingRecent(false);
      }
    }

    fetchPopular();
    if (isAuthLoaded) {
      fetchRecent();
    }
  }, [isSignedIn, isAuthLoaded]);

  // Debounced Search Query
  useEffect(() => {
    if (!inputVal.trim() || inputVal.includes("/") || inputVal.includes("http")) {
      Promise.resolve().then(() => {
        setSearchResults([]);
        setIsSearching(false);
      });
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    Promise.resolve().then(() => {
      setIsSearching(true);
    });
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/explorer/search?q=${encodeURIComponent(inputVal.trim())}`);
        const result = await res.json();
        if (res.ok && result.success) {
          setSearchResults(result.data.repositories || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [inputVal]);

  // Resolve Repository Handler (Methods 1, 2 & 3 pipeline)
  const handleResolve = async (targetUrlOrShorthand: string) => {
    if (!targetUrlOrShorthand.trim()) return;

    setIsResolving(true);
    setResolveError(null);
    setSearchResults([]);

    try {
      const res = await fetch("/api/explorer/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlOrShorthand: targetUrlOrShorthand.trim() }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to resolve repository.");
      }

      const canonicalKey = result.data.canonicalKey;
      router.push(`/explorer/${canonicalKey}`);
    } catch (err: unknown) {
      console.error("[handleResolve]", err);
      setResolveError((err as Error).message || "Could not resolve repository.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-start relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_85%_at_50%_-10%,rgba(124,156,255,0.06),rgba(255,255,255,0))] pointer-events-none" />

      {/* Hero section */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explorer Ingestion Engine</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-foreground">
            Explore Public GitHub Architecture
          </h2>
          <p className="text-muted-foreground text-sm font-mono leading-relaxed max-w-md mx-auto">
            Analyze dependency graphs, locate files, and prompt AI assistants for any public GitHub
            repository.
          </p>
        </div>
      </div>

      {/* Input Resolution search bar */}
      <div className="relative z-20 max-w-xl w-full mx-auto mb-16">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter owner/repo (e.g. facebook/react) or paste GitHub URL..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleResolve(inputVal);
            }}
            disabled={isResolving}
            className="w-full pl-11 pr-24 py-3 bg-surface-elevated/60 backdrop-blur border border-border rounded-xl font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors shadow-lg"
          />

          <div className="absolute right-2 flex items-center gap-2">
            {(isResolving || isSearching) && (
              <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
            )}
            <button
              onClick={() => handleResolve(inputVal)}
              disabled={isResolving || !inputVal.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent/90 disabled:bg-muted/30 text-background font-mono text-[10px] font-bold uppercase transition-colors"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* Suggestion Dropdown */}
        <AnimatePresence>
          {inputVal.trim() && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute left-0 right-0 mt-2 p-1.5 rounded-xl border border-border bg-surface-elevated/95 backdrop-blur-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
            >
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setInputVal(item.fullName);
                    handleResolve(item.fullName);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/70 transition-colors text-left group"
                >
                  <div className="min-w-0 pr-4">
                    <p className="font-mono text-xs font-semibold text-foreground truncate">
                      {item.fullName}
                    </p>
                    {item.description && (
                      <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-warning" />
                      <span>{item.stars.toLocaleString()}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert Box */}
        {resolveError && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-start gap-2.5 text-danger font-mono text-xs">
            <span className="font-bold shrink-0">FAIL:</span>
            <p className="leading-relaxed">{resolveError}</p>
          </div>
        )}

        {/* Featured Repo Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <span className="text-[10px] font-mono text-muted-foreground">Featured:</span>
          {FEATURED_REPOS.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setInputVal(item.name);
                handleResolve(item.name);
              }}
              className="px-2.5 py-1 rounded-md border border-border bg-card/45 hover:bg-secondary hover:border-accent/40 text-[10px] font-mono text-foreground transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Grid: Popular vs Recents */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left Column: Popular Repositories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Flame className="w-4 h-4 text-accent animate-pulse" />
            <h3 className="font-heading font-bold text-sm text-foreground">Popular Explorations</h3>
          </div>

          {isLoadingPopular ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : popularRepos.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-xs font-mono text-muted-foreground">
              Popular repositories will appear as developers explore codebases.
            </div>
          ) : (
            <div className="space-y-3">
              {popularRepos.map((repo) => (
                <div
                  key={repo.canonicalKey}
                  onClick={() => router.push(`/explorer/${repo.canonicalKey}`)}
                  className="p-4 rounded-xl border border-border bg-card/40 hover:bg-secondary/50 hover:border-accent/40 transition-all cursor-pointer flex justify-between items-center gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-mono text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors">
                      {repo.canonicalKey}
                    </h4>
                    {repo.description && (
                      <p className="text-[10px] font-sans text-muted-foreground line-clamp-1 leading-normal">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-muted-foreground">
                      <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">
                        {repo.language || "Unknown"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-warning" />
                        {repo.stars.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right space-y-0.5 font-mono">
                    <span className="text-[10px] text-accent block font-semibold">
                      {(repo.exploreCount || 0).toLocaleString()} Views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Explorations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-sm text-foreground">Recently Explored</h3>
          </div>

          {!isSignedIn ? (
            <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-3">
              <p className="text-xs font-mono text-muted-foreground">
                {"You haven't explored any repositories yet."}
              </p>
              <div className="pt-1">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 font-mono text-[10px] font-bold text-foreground transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-accent" />
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          ) : isLoadingRecent ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : recentRepos.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-xs font-mono text-muted-foreground">
              {"You haven't explored any repositories yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {recentRepos.map((repo) => (
                <div
                  key={repo.canonicalKey}
                  onClick={() => router.push(`/explorer/${repo.canonicalKey}`)}
                  className="p-4 rounded-xl border border-border bg-card/40 hover:bg-secondary/50 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-mono text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {repo.canonicalKey}
                    </h4>
                    {repo.description && (
                      <p className="text-[10px] font-sans text-muted-foreground line-clamp-1 leading-normal">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-muted-foreground">
                      <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">
                        {repo.language || "Unknown"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-warning" />
                        {repo.stars.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right space-y-0.5 font-mono">
                    <span className="text-[9px] text-muted-foreground block">
                      Health: {repo.healthScore ?? 100}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
