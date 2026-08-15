/**
 * hooks/use-chat-session.ts — Client-side chat state hook with streaming fetch.
 *
 * Uses native fetch + ReadableStream to consume the streaming /api/chat endpoint.
 * Does NOT depend on @ai-sdk/openai or ai/react (not available in ai v7 without gateway).
 *
 * Architecture.md §3: Chat uses streamed tokens from Route Handler.
 * Rules.md §2: AI calls never from Client Components — fetch calls /api/chat (server).
 */
"use client";

import { useState, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ParsedCitation {
  path: string;
  marker: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseChatSessionOptions {
  repoId: string;
  onCitationClick?: (modulePath: string) => void;
}

interface UseChatSessionReturn {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  setInput: (value: string) => void;
  submit: (overrideInput?: string) => Promise<void>;
  stop: () => void;
  parseCitations: (text: string) => ParsedCitation[];
}

let msgCounter = 0;
function newId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

export function useChatSession({ repoId }: UseChatSessionOptions): UseChatSessionReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const submit = useCallback(
    async (overrideInput?: string) => {
      const userText = (overrideInput ?? input).trim();
      if (!userText || isLoading) return;

      setInput("");
      setError(null);

      const userMessage: ChatMessage = { id: newId(), role: "user", content: userText };

      // Build the full history to send (including new user message)
      setMessages((prev) => {
        const updated = [...prev, userMessage];
        return updated;
      });

      // Prepare messages for the API (all prior + new user)
      const historyForApi = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Placeholder assistant message that we'll stream into
      const assistantId = newId();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoId, messages: historyForApi }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Chat request failed." }));
          throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        if (!res.body) throw new Error("No response body from chat endpoint.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
          );
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") {
          // User stopped — keep partial response
        } else {
          const msg = (err as Error).message ?? "AI service unavailable.";
          setError(msg);
          // Remove empty assistant placeholder on error
          setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content === "")));
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [input, isLoading, messages, repoId],
  );

  /** Parse [[path:...]] citation markers from an AI response */
  const parseCitations = useCallback((text: string): ParsedCitation[] => {
    const matches = Array.from(text.matchAll(/\[\[path:([^\]]+)\]\]/g));
    return matches.map((m) => ({
      path: m[1]?.trim() ?? "",
      marker: m[0] ?? "",
    }));
  }, []);

  return {
    messages,
    input,
    isLoading,
    error,
    setInput,
    submit,
    stop,
    parseCitations,
  };
}
