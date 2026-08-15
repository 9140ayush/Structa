/**
 * components/chat/MessageBubble.tsx — Individual chat message with citation chips.
 *
 * design.md §7: Chat citations rendered as pill chips using --accent at 15% background tint
 * with --accent text, radius-full.
 */
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Bot, User, FileCode } from "lucide-react";
import type { ChatMessage, ParsedCitation } from "@/hooks/use-chat-session";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
  parseCitations: (text: string) => ParsedCitation[];
  onCitationClick?: (modulePath: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageBubble({ message, parseCitations, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const { cleanText, citations } = useMemo(() => {
    if (isUser) return { cleanText: message.content, citations: [] };

    const found = parseCitations(message.content);
    // Replace [[path:...]] markers with backtick path for display
    const clean = message.content.replace(/\[\[path:([^\]]+)\]\]/g, "`$1`");
    // Deduplicate by path
    const unique = Array.from(new Map(found.map((c) => [c.path, c])).values());
    return { cleanText: clean, citations: unique };
  }, [message.content, isUser, parseCitations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
          isUser
            ? "bg-primary/15 border-primary/30 text-primary"
            : "bg-accent/15 border-accent/30 text-accent"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end flex flex-col" : ""}`}>
        <div
          className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-sm"
              : "bg-surface-elevated border border-border text-foreground rounded-tl-sm"
          }`}
        >
          {cleanText}
        </div>

        {/* Citation chips — design.md §7: accent color, radius-full */}
        {citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {citations.map((citation) => (
              <button
                key={citation.path}
                onClick={() => onCitationClick?.(citation.path)}
                title={`Jump to ${citation.path} in the 3D graph`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border transition-all duration-150
                  bg-accent/10 border-accent/25 text-accent
                  hover:bg-accent/20 hover:border-accent/50 cursor-pointer"
              >
                <FileCode className="w-3 h-3 shrink-0" />
                <span className="max-w-[180px] truncate">
                  {citation.path.split("/").pop() ?? citation.path}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
