"use client";

/**
 * app/(dashboard)/repos/[repoId]/modules/page.tsx — Phase 11.11
 *
 * Module Explorer: First-class repository module inspection experience.
 * Lists all detected modules with searching, filtering, and detailed inspection panel.
 */

import React, { useState, useEffect, useMemo, use } from "react";
import { useSearchParams } from "next/navigation";
import { Puzzle, Search, Loader2, AlertCircle } from "lucide-react";
import { ModuleDetailPanel, ModuleData } from "@/components/modules/ModuleDetailPanel";

interface ModulesPageProps {
  params: Promise<{ repoId: string }>;
}

interface FileTreeItem {
  id: string;
  name: string;
  path: string;
  type: string;
  loc?: number;
  complexityScore?: number;
  summary?: string;
  summaryStatus?: string;
  importsCount?: number;
  importedByCount?: number;
}

interface RepoIntelligencePayload {
  repoName: string;
  moduleCount: number;
  fileTree: FileTreeItem[];
}

export default function ModulesPage({ params }: ModulesPageProps) {
  const { repoId } = use(params);
  const searchParams = useSearchParams();
  const targetModuleId = searchParams.get("module");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RepoIntelligencePayload | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);
        const res = await fetch(`/api/repos/${repoId}/intelligence`);
        if (!res.ok) throw new Error("Failed to fetch repository intelligence.");
        const json: RepoIntelligencePayload = await res.json();
        setData(json);

        // Preselect target module if passed in URL query param
        if (targetModuleId && json.fileTree) {
          const found = json.fileTree.find((m: FileTreeItem) => m.id === targetModuleId);
          if (found) {
            setSelectedModule(found as ModuleData);
          }
        }
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to load modules.");
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, [repoId, targetModuleId]);

  const modules = useMemo<ModuleData[]>(() => {
    if (!data?.fileTree) return [];
    return data.fileTree.map((f: FileTreeItem) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      type: f.type,
      loc: f.loc || 0,
      complexityScore: f.complexityScore || 0,
      summary: f.summary || "",
      summaryStatus: f.summaryStatus,
      importsCount: f.importsCount || 0,
      importedByCount: f.importedByCount || 0,
    }));
  }, [data]);

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(
      (m) => m.name.toLowerCase().includes(q) || m.path.toLowerCase().includes(q),
    );
  }, [modules, searchQuery]);

  // Set default selection
  useEffect(() => {
    if (!selectedModule && filteredModules.length > 0 && !targetModuleId) {
      setSelectedModule(filteredModules[0]);
    }
  }, [filteredModules, selectedModule, targetModuleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 font-mono text-xs text-muted-foreground py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span>Loading Module Explorer...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-xl mx-auto my-12 bg-danger/10 border border-danger/20 rounded-xl text-danger font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load Module Explorer
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-accent" /> Module Explorer
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            First-class entity inspection for every module in {data.repoName}.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card/60">
            Total Modules: <span className="font-bold text-foreground">{modules.length}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Module List Sidebar */}
        <div className="lg:col-span-5 flex flex-col space-y-3 min-h-[400px]">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules by name or path..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Module items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[600px]">
            {filteredModules.map((m) => {
              const isSelected = selectedModule?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModule(m)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all font-mono text-xs ${
                    isSelected
                      ? "bg-accent/10 border-accent text-foreground shadow-sm"
                      : "bg-card/40 border-border text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-foreground mb-1">
                    <span className="truncate flex items-center gap-2">
                      <Puzzle className="w-3.5 h-3.5 text-accent shrink-0" />
                      {m.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border shrink-0">
                      LOC {m.loc}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.path}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Module Detail Panel */}
        <div className="lg:col-span-7">
          {selectedModule ? (
            <ModuleDetailPanel module={selectedModule} repoId={repoId} />
          ) : (
            <div className="h-full flex items-center justify-center p-12 border border-border border-dashed rounded-xl text-center font-mono text-xs text-muted-foreground">
              Select a module from the list to view full intelligence details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
