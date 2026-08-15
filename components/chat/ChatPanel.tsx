/**
 * components/chat/ChatPanel.tsx — "Ask the Codebase" chat panel.
 *
 * Uses the custom useChatSession hook (streaming fetch, no ai/react dependency).
 *
 * Architecture.md §3: Chat is streamed from /api/chat Route Handler.
 * Architecture.md §6: components/chat/ChatPanel.tsx
 * design.md §6: motion-spring-panel for slide-in.
 * Rules.md §3: Grounded in repo data — never a generic chatbot.
 */
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Send,
  Bot,
  Loader2,
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Square,
} from "lucide-react";
import { useChatSession } from "@/hooks/use-chat-session";
import { MessageBubble } from "@/components/chat/MessageBubble";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  repoId: string;
  repoName: string;
  onCitationClick?: (modulePath: string) => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Suggestion prompts
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "Where is authentication handled?",
  "Which modules are the most complex?",
  "How is the database connection managed?",
  "What handles API routing in this codebase?",
  "Where are environment variables accessed?",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPanel({ repoId, repoName, onCitationClick, onClose }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { messages, input, isLoading, error, setInput, submit, stop, parseCitations } =
    useChatSession({ repoId, onCitationClick });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Debounce semantic search (350ms — Architecture.md §9)
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filter messages by semantic search
  const filteredMessages = searchDebounced.trim()
    ? messages.filter(
        (m) => m.content.toLowerCase().includes(searchDebounced.toLowerCase()) || m.role === "user",
      )
    : messages;

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      void submit(suggestion);
    },
    [submit],
  );

  // Handle textarea Enter key (submit) vs Shift+Enter (newline)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void submit();
    },
    [submit],
  );

  // Architecture doc export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Export failed.");
      }
      const { markdown } = (await res.json()) as { markdown: string };

      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${repoName.replace(/\//g, "-")}-architecture.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError((err as Error).message ?? "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }, [repoId, repoName]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-accent/10 border border-accent/25 text-accent">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground">Ask the Codebase</h2>
            <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
              {repoName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            title="Export AI-generated architecture documentation"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Export error */}
      {exportError && (
        <div className="px-4 py-2 flex items-center gap-2 bg-danger/10 border-b border-danger/20 text-danger text-xs font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{exportError}</span>
          <button onClick={() => setExportError(null)} className="ml-auto shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Semantic search bar (visible after 3+ messages)                   */}
      {/* ----------------------------------------------------------------- */}
      {messages.length > 3 && (
        <div className="px-3 py-2 border-b border-border bg-surface shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversation..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Messages area                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-8">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Ask anything about this codebase
              </h3>
              <p className="text-xs font-mono text-muted-foreground max-w-[240px] leading-relaxed">
                Answers are grounded in the repository&apos;s actual parsed modules and AI
                summaries.
              </p>
            </div>
            <div className="space-y-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border bg-card/60 hover:bg-secondary hover:border-accent/40 text-xs font-mono text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-accent shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtered messages */}
        {filteredMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            parseCitations={parseCitations}
            onCitationClick={onCitationClick}
          />
        ))}

        {/* Loading state */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-start"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent/15 border border-accent/30 text-accent">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-elevated border border-border flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-xs font-mono text-muted-foreground">Analyzing codebase...</span>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-mono"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => window.location.reload()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* No search results */}
        {!isEmpty && filteredMessages.length === 0 && searchDebounced && (
          <div className="text-center py-8 text-xs font-mono text-muted-foreground">
            No messages matching &ldquo;{searchDebounced}&rdquo;
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Input area                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="shrink-0 p-3 border-t border-border bg-surface">
        <form onSubmit={handleFormSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this codebase... (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground
                placeholder:text-muted-foreground resize-none
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                transition-all leading-relaxed"
            />
          </div>

          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-3 py-2.5 rounded-lg bg-danger/20 hover:bg-danger/30 text-danger
                font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 border border-danger/30"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-background
                font-mono text-xs font-semibold flex items-center gap-1.5
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 px-1">
          Grounded in parsed module summaries — only answers questions about this repository.
        </p>
      </div>
    </div>
  );
}
