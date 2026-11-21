/**
 * lib/ai/provider.ts — Multi-provider AI completion engine.
 *
 * Supports:
 * 1. Google Gemini Free Tier (via GEMINI_API_KEY, gemini-1.5-flash / gemini-2.0-flash)
 *    - Free forever via Google AI Studio (https://aistudio.google.com/app/apikey)
 * 2. OpenAI (via OPENAI_API_KEY, gpt-4o-mini)
 * 3. Graceful fallback to null when no provider key is available/working.
 *
 * Server-side only. Zero client leakage.
 */

import { getOpenAIClient, AI_MODEL } from "@/lib/openai";

export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

/**
 * Call Google Gemini REST API using native fetch (zero extra dependencies).
 */
async function callGemini(
  apiKey: string,
  prompt: string,
  options: AICompletionOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Primary: gemini-1.5-flash (fast, reliable, free tier)
    // Fallback: gemini-2.0-flash if needed
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.35,
          maxOutputTokens: options.maxTokens ?? 1500,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      throw new Error("Gemini returned empty response content.");
    }

    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call OpenAI API using existing OpenAI client.
 */
async function callOpenAI(prompt: string, options: AICompletionOptions = {}): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: options.maxTokens ?? 1500,
    temperature: options.temperature ?? 0.35,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned empty response.");
  }
  return content;
}

/**
 * Unified completion helper that prioritizes Gemini free key if provided,
 * then OpenAI, or throws a clean error if neither is functional.
 */
export async function generateAICompletion(
  prompt: string,
  options: AICompletionOptions = {},
): Promise<{ text: string; provider: "gemini" | "openai" }> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. If Gemini key is set, attempt Gemini first (Free Tier)
  if (geminiKey && geminiKey.length > 5) {
    try {
      const text = await callGemini(geminiKey, prompt, options);
      return { text, provider: "gemini" };
    } catch (geminiErr) {
      console.warn("[ai/provider] Gemini call failed, attempting fallback:", geminiErr);
    }
  }

  // 2. Attempt OpenAI if key is present
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey && !openAiKey.includes("placeholder")) {
    try {
      const text = await callOpenAI(prompt, options);
      return { text, provider: "openai" };
    } catch (openAiErr) {
      console.warn("[ai/provider] OpenAI call failed:", openAiErr);
    }
  }

  throw new Error("No active AI provider succeeded (checked Gemini & OpenAI).");
}
