/**
 * lib/ai/summarize.ts — Reusable, repository-agnostic module summarization service.
 *
 * Architectural requirements:
 * - Must be callable by Workspace Mode sync (Phase 4) AND Explorer Mode indexing (Phase 6).
 * - No dependency on Workspace UI, ChatPanel, or any specific dashboard component.
 * - No dependency on a specific route — accepts plain data structures.
 * - Server-side only. Never import from a Client Component.
 * - AI failure must never propagate to callers as an uncaught exception.
 *
 * Rules.md §2: AI calls never from Client Components.
 * Rules.md §2: Secrets never reach the client bundle.
 * Architecture.md §10: OpenAI failure → graceful fallback, never block graph rendering.
 */

"use server";

import { getOpenAIClient, AI_MODEL, SUMMARY_MAX_TOKENS, AI_TIMEOUT_MS } from "@/lib/openai";
import type { SummaryStatus } from "@/models/Module";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input accepted from any caller (Workspace sync OR Explorer indexing). */
export interface SummarizeModuleInput {
  /** Absolute repo-relative path (e.g. "src/lib/auth.ts") */
  path: string;
  /** file or folder */
  type: "file" | "folder";
  /** Raw source code content. May be empty or undefined for binary/missing files. */
  content?: string;
  /** Lines of code count */
  loc: number;
  /** Heuristic complexity score 0..10 */
  complexityScore: number;
  /** Number of outgoing imports */
  importsCount: number;
  /** Number of modules that import this one */
  importedByCount: number;
}

/** Result returned to all callers — never throws. */
export interface SummarizeModuleResult {
  summary: string;
  status: SummaryStatus;
  /** Set when status is 'failed' */
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum source content length sent to OpenAI (chars). Keeps cost and latency low. */
const MAX_CONTENT_CHARS = 3_000;

/** Minimum content length to bother summarizing. */
const MIN_CONTENT_CHARS = 20;

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Generates a one-paragraph technical summary for a single module.
 *
 * Never throws. Returns `{ status: 'failed', summary: '' }` on any error.
 * Never blocks: uses AbortController with AI_TIMEOUT_MS.
 */
export async function summarizeModule(input: SummarizeModuleInput): Promise<SummarizeModuleResult> {
  // Skip folders — not meaningful to summarize.
  if (input.type === "folder") {
    return { summary: "", status: "skipped" };
  }

  const content = input.content?.trim() ?? "";

  // Skip files with no meaningful content.
  if (content.length < MIN_CONTENT_CHARS) {
    return { summary: "", status: "skipped" };
  }

  // Trim oversized files to stay within budget.
  const truncatedContent =
    content.length > MAX_CONTENT_CHARS
      ? content.slice(0, MAX_CONTENT_CHARS) + "\n\n[...content truncated for brevity]"
      : content;

  const prompt = buildPrompt(input, truncatedContent);

  // AbortController for timeout enforcement
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create(
      {
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: SUMMARY_MAX_TOKENS,
        temperature: 0.3,
      },
      { signal: controller.signal },
    );

    const summary = response.choices[0]?.message?.content?.trim() ?? "";

    if (!summary) {
      return { summary: "", status: "failed", error: "OpenAI returned empty summary." };
    }

    return { summary, status: "done" };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Distinguish timeout from other errors for better logging
    if (controller.signal.aborted) {
      console.warn(`[summarize] Timeout summarizing ${input.path}`);
      return { summary: "", status: "failed", error: "OpenAI request timed out." };
    }

    console.warn(`[summarize] Failed to summarize ${input.path}:`, errorMessage);
    return { summary: "", status: "failed", error: errorMessage };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// ---------------------------------------------------------------------------
// Batch summarization
// ---------------------------------------------------------------------------

export interface BatchSummarizeResult {
  /** Map from module path → result */
  results: Map<string, SummarizeModuleResult>;
  /** Total modules processed */
  total: number;
  /** Successfully summarized count */
  done: number;
  /** Skipped count (folders, tiny files) */
  skipped: number;
  /** Failed count */
  failed: number;
}

/**
 * Summarizes a batch of modules with controlled concurrency.
 * Never throws — errors per-module are captured in results.
 *
 * @param modules   Array of module inputs
 * @param concurrency  Max parallel OpenAI requests (default: 3)
 */
export async function summarizeModuleBatch(
  modules: SummarizeModuleInput[],
  concurrency = 3,
): Promise<BatchSummarizeResult> {
  const results = new Map<string, SummarizeModuleResult>();
  let done = 0;
  let skipped = 0;
  let failed = 0;

  // Process in chunks of `concurrency`
  for (let i = 0; i < modules.length; i += concurrency) {
    const chunk = modules.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map((m) => summarizeModule(m)));

    for (let j = 0; j < chunk.length; j++) {
      const mod = chunk[j]!;
      const outcome = settled[j]!;

      let result: SummarizeModuleResult;
      if (outcome.status === "fulfilled") {
        result = outcome.value;
      } else {
        // Should not happen since summarizeModule never throws, but handle defensively
        result = { summary: "", status: "failed", error: String(outcome.reason) };
      }

      results.set(mod.path, result);

      if (result.status === "done") done++;
      else if (result.status === "skipped") skipped++;
      else failed++;
    }
  }

  return { results, total: modules.length, done, skipped, failed };
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(input: SummarizeModuleInput, content: string): string {
  const name = input.path.split("/").pop() ?? input.path;
  const complexityLabel =
    input.complexityScore >= 7 ? "high" : input.complexityScore >= 4 ? "medium" : "low";

  return `You are analyzing a source file from a software repository.

File: ${input.path}
File name: ${name}
Lines of code: ${input.loc}
Complexity: ${complexityLabel} (score ${input.complexityScore}/10)
Imports ${input.importsCount} other modules. Imported by ${input.importedByCount} other modules.

Source code:
\`\`\`
${content}
\`\`\`

Write a concise, technical one-paragraph summary (2-4 sentences) explaining:
1. The primary purpose of this file/module.
2. The key functionality or logic it contains.
3. Its role in the overall codebase architecture (if evident from imports/names).

Be specific and factual. Do not mention the file path in your answer. Do not write "This file..." at the start. Focus on what the code actually does.`;
}
