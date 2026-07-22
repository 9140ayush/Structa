/**
 * lib/ratelimit.ts — Upstash Redis rate limiter configuration.
 *
 * Used to protect expensive endpoints:
 *  - POST /api/repos/[id]/sync (syncLimiter: 5 requests / user / hour)
 *  - POST /api/chat (chatLimiter: Phase 4)
 *
 * Fail-open policy: if Redis is unreachable, the request is allowed through
 * with a warning logged (Architecture.md §10: "Fail-open with conservative
 * default limit if Redis is unreachable, logged as a warning").
 *
 * Server-side only. Never import this from a Client Component.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis client
// ---------------------------------------------------------------------------

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------

/**
 * Sync endpoint limiter:
 * 5 syncs per user per hour using a fixed window algorithm.
 */
export const syncLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 h"),
  analytics: false,
  prefix: "structa:sync",
});

/**
 * Chat endpoint limiter (placeholder — wired in Phase 4):
 * 60 chat requests per user per hour.
 */
export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(60, "1 h"),
  analytics: false,
  prefix: "structa:chat",
});
