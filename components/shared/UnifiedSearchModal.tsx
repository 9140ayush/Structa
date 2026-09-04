"use client";

/**
 * components/shared/UnifiedSearchModal.tsx — Phase 11.16
 *
 * Unified Repository Search Modal: keyboard-driven (Cmd+K / Ctrl+K) search
 * across Files, Folders, Modules, Technologies, and Architecture concepts.
 *
 * Direct navigation to File Explorer, Module Explorer, 3D Graph, or Copilot.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FileCode,
  Folder,
  Puzzle,
  Cpu,
  Network,
  Box,
  MessageSquareCode,
  Sparkles,
  CornerDownLeft,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "Files" | "Folders" | "Modules" | "Tech Stack" | "Architecture";
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  graphUrl?: string;
  copilotPrompt?: string;
}

interface UnifiedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoId: string;
  intelligenceData?: {
    fileTree?: Array<{ id: string; path: string; name: string; type: string; summary?: string }>;
    detectedTech?: Array<{ name: string; category: string }>;
    topImportedModules?: Array<{ id: string; path: string; name: string }>;
  } | null;
}

export function UnifiedSearchModal({
  isOpen,
  onClose,
  repoId,
  intelligenceData,
}: UnifiedSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global shortcut (Cmd+K or Ctrl+K) and Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Compute search index from intelligence payload
  const allResults = useMemo<SearchResult[]>(() => {
    if (!intelligenceData) return [];

    const results: SearchResult[] = [];
    const files = intelligenceData.fileTree || [];

    // 1. Files & Folders
    files.forEach((f) => {
      if (f.type === "file") {
        results.push({
          id: `file-${f.id}`,
          title: f.name,
          subtitle: f.path,
          category: "Files",
          icon: FileCode,
          url: `/repos/${repoId}/files?file=${encodeURIComponent(f.path)}`,
          graphUrl: `/repos/${repoId}/graph?focus=${encodeURIComponent(f.id)}`,
          copilotPrompt: `Explain the file ${f.path} in this repository`,
        });
      } else {
        results.push({
          id: `folder-${f.id}`,
          title: f.name,
          subtitle: f.path,
          category: "Folders",
          icon: Folder,
          url: `/repos/${repoId}/architecture?folder=${encodeURIComponent(f.path)}`,
        });
      }
    });

    // 2. Modules
    const uniqueModules = intelligenceData.topImportedModules || [];
    uniqueModules.forEach((m) => {
      results.push({
        id: `module-${m.id}`,
        title: m.name,
        subtitle: m.path,
        category: "Modules",
        icon: Puzzle,
        url: `/repos/${repoId}/modules?module=${encodeURIComponent(m.id)}`,
        graphUrl: `/repos/${repoId}/graph?focus=${encodeURIComponent(m.id)}`,
        copilotPrompt: `Explain the module ${m.name} (${m.path})`,
      });
    });

    // 3. Tech Stack
    const techs = intelligenceData.detectedTech || [];
    techs.forEach((t, idx) => {
      results.push({
        id: `tech-${idx}-${t.name}`,
        title: t.name,
        subtitle: `Category: ${t.category}`,
        category: "Tech Stack",
        icon: Cpu,
        url: `/repos/${repoId}/tech-stack`,
      });
    });

    // 4. Architecture Layer concepts
    const archLayers = ["app", "components", "lib", "services", "api", "models", "utils"];
    archLayers.forEach((layer) => {
      results.push({
        id: `arch-${layer}`,
        title: `${layer.toUpperCase()} Layer`,
        subtitle: `Architecture subsystem /${layer}`,
        category: "Architecture",
        icon: Network,
        url: `/repos/${repoId}/architecture`,
      });
    });

    return results;
  }, [intelligenceData, repoId]);

  // Filtered results
  const filtered = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 15);
    const q = query.toLowerCase();
    return allResults
      .filter(
        (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [allResults, query]);

  // Handle arrow key navigation in list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].url);
        onClose();
      }
    },
    [filtered, selectedIndex, router, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search input header */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-card/80 gap-3 shrink-0">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search files, modules, tech, architecture..."
            className="flex-1 bg-transparent border-0 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground">
              No repository entities matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.url);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs font-mono
                    ${
                      isSelected
                        ? "bg-accent/10 border border-accent/30 text-foreground"
                        : "hover:bg-secondary/60 text-muted-foreground border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected
                          ? "bg-accent/20 text-accent"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-foreground truncate flex items-center gap-2">
                        {item.title}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-secondary border border-border text-muted-foreground uppercase font-bold">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate font-mono">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Actions on hover/select */}
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 shrink-0">
                    {item.graphUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(item.graphUrl!);
                          onClose();
                        }}
                        title="Focus in 3D Graph"
                        className="p-1 rounded hover:bg-accent/20 hover:text-accent transition-colors"
                      >
                        <Box className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {item.copilotPrompt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/repos/${repoId}/copilot?prompt=${encodeURIComponent(item.copilotPrompt!)}`,
                          );
                          onClose();
                        }}
                        title="Ask Copilot"
                        className="p-1 rounded hover:bg-accent/20 hover:text-accent transition-colors"
                      >
                        <MessageSquareCode className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-card/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1 text-accent">
            <Sparkles className="w-3 h-3" /> Grounded Repository Intelligence
          </div>
        </div>
      </div>
    </div>
  );
}
