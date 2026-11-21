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

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  // If Gemini API key is configured, use Google's free-tier OpenAI-compatible endpoint
  if (geminiKey && geminiKey.length > 5) {
    _openai = new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    return _openai;
  }

  if (openAiKey) {
    _openai = new OpenAI({ apiKey: openAiKey });
    return _openai;
  }

  throw new Error(
    "[openai] Neither GEMINI_API_KEY nor OPENAI_API_KEY is set. Add GEMINI_API_KEY to .env.local (server-side only).",
  );
}

// ---------------------------------------------------------------------------
// Model configuration
// ---------------------------------------------------------------------------

/** Get the configured AI model based on available provider credentials. */
export function getAIModel(): string {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey && geminiKey.length > 5) {
    return "gemini-2.5-flash";
  }
  return "gpt-4o-mini";
}

/** The active AI model used for all Structa AI operations. */
export const AI_MODEL = (process.env.GEMINI_API_KEY?.trim()
  ? "gemini-2.5-flash"
  : "gpt-4o-mini") as string;

/** Maximum tokens for module summaries (keeps cost low, ~200 words). */
export const SUMMARY_MAX_TOKENS = 256 as const;

/** Maximum tokens for chat responses. */
export const CHAT_MAX_TOKENS = 1024 as const;

/** Request timeout in milliseconds. */
export const AI_TIMEOUT_MS = 20_000 as const;
