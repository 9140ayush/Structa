/**
 * lib/openai.ts — Server-only OpenAI client singleton.
 *
 * Rules:
 * - Never import this from a Client Component.
 * - Never expose OPENAI_API_KEY to the browser.
 * - All AI calls route through Server Actions or Route Handlers.
 *
 * Architecture.md §1: OpenAI API + Vercel AI SDK for summarization and chat.
 * Rules.md §2: AI calls are never made directly from a Client Component.
 * Rules.md §2: Secrets never reach the client bundle.
 */
import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Singleton: one client per server process
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null;

/**
 * Returns the shared OpenAI client.
 * Throws a clear error at call time (not import time) if the key is missing,
 * so development builds without a key fail with a readable message.
 */
export function getOpenAIClient(): OpenAI {
  if (_openai) return _openai;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("[openai] OPENAI_API_KEY is not set. Add it to .env.local (server-side only).");
  }

  _openai = new OpenAI({ apiKey });
  return _openai;
}

// ---------------------------------------------------------------------------
// Model configuration
// ---------------------------------------------------------------------------

/** The OpenAI model used for all Structa AI operations. */
export const AI_MODEL = "gpt-4o-mini" as const;

/** Maximum tokens for module summaries (keeps cost low, ~200 words). */
export const SUMMARY_MAX_TOKENS = 256 as const;

/** Maximum tokens for chat responses. */
export const CHAT_MAX_TOKENS = 1024 as const;

/** Request timeout in milliseconds. */
export const AI_TIMEOUT_MS = 20_000 as const;
