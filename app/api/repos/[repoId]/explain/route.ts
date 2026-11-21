/**
 * app/api/repos/[repoId]/explain/route.ts
 *
 * End-to-end AI Repository Explanation API.
 * Supports:
 * - GET: Retrieves repository sync status, AI summarization progress/state,
 *        cached explanations (technical & beginner), and navigable module list.
 * - POST: Generates (or retrieves cached) repository explanation.
 *         Handles on-demand module summary generation when summaries are missing/failed.
 *         Graceful degradation: Uses OpenAI when healthy; falls back to AST static analysis
 *         if OpenAI is unavailable/rate-limited, never returning false errors or empty screens.
 *
 * Compatible with Workspace Mode (private repos, org RBAC) and Explorer Mode (PublicRepository).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository, type IRepository } from "@/models/Repository";
import { PublicRepository, type IPublicRepository } from "@/models/PublicRepository";
import { Module, type IModule, type SummaryStatus } from "@/models/Module";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { generateAICompletion } from "@/lib/ai/provider";
import { chatLimiter } from "@/lib/ratelimit";
import { summarizeModuleBatch, type SummarizeModuleInput } from "@/lib/ai/summarize";
import { getBatchFileContents } from "@/lib/github";
import {
  generateGroundedModuleSummary,
  generateGroundedRepoExplanation,
  type FallbackModuleInput,
} from "@/lib/ai/fallback";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

const BodySchema = z.object({
  mode: z.enum(["technical", "beginner"]).default("technical"),
  forceRefresh: z.boolean().default(false),
  generateMissingSummaries: z.boolean().default(false),
});

// Cache TTL — 7 days in ms
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.replace(/^\//, "").split("/");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve repository from either Workspace (Repository) or Explorer (PublicRepository).
 */
async function resolveRepo(
  repoId: string,
  userId: string | null,
  orgId: string | null | undefined,
): Promise<{
  repo: (IRepository | IPublicRepository) & {
    _id: mongoose.Types.ObjectId;
    name: string;
    url: string;
  };
  isPublic: boolean;
} | null> {
  // 1. Check workspace repo if authenticated and repoId is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(repoId) && userId) {
    try {
      const dbOrg = await getOrCreateOrganization(orgId, userId);
      const repo = await Repository.findOne({
        _id: new mongoose.Types.ObjectId(repoId),
        orgId: dbOrg._id,
      });
      if (repo) {
        return {
          repo: repo as unknown as IRepository & {
            _id: mongoose.Types.ObjectId;
            name: string;
            url: string;
          },
          isPublic: false,
        };
      }
    } catch (err) {
      console.warn("[explain] Error checking workspace repository:", err);
    }
  }

  // 2. Check PublicRepository (by ObjectId or canonicalKey "owner/repo" or "owner:repo")
  if (mongoose.Types.ObjectId.isValid(repoId)) {
    const publicRepo = await PublicRepository.findById(repoId);
    if (publicRepo) {
      return {
        repo: publicRepo as unknown as IPublicRepository & {
          _id: mongoose.Types.ObjectId;
          name: string;
          url: string;
        },
        isPublic: true,
      };
    }
  }

  const canonicalKey = decodeURIComponent(repoId).replace(":", "/").toLowerCase();
  const publicRepo = await PublicRepository.findOne({ canonicalKey });
  if (publicRepo) {
    return {
      repo: publicRepo as unknown as IPublicRepository & {
        _id: mongoose.Types.ObjectId;
        name: string;
        url: string;
      },
      isPublic: true,
    };
  }

  return null;
}

/**
 * Builds structured prompt for repository explanation tailored to Technical vs Beginner mode.
 */
function buildExplainPrompt(
  repoName: string,
  mode: "technical" | "beginner",
  summaries: Array<{ path: string; summary: string }>,
  stats: {
    fileCount: number;
    totalLOC: number;
    avgComplexity: number;
    edgeCount: number;
  },
): string {
  const summaryBlock = summaries
    .slice(0, 45)
    .map((s) => `- ${s.path}: ${s.summary}`)
    .join("\n");

  if (mode === "beginner") {
    return `You are an expert software mentor explaining the code repository "${repoName}" to a beginner, product manager, or junior engineer who wants a clear, intuitive mental model of the project.

Repository Statistics:
- ${stats.fileCount} source files analyzed
- ${stats.totalLOC.toLocaleString()} total lines of code
- ${stats.edgeCount} inter-module connections
- Average complexity rating: ${stats.avgComplexity}/10

Module summaries derived from code analysis:
${summaryBlock}

Instructions:
- Write an engaging, thorough, and highly educational explanation.
- DO NOT give a superficial 2-sentence summary. Each of the 6 sections must contain multiple well-developed paragraphs.
- Use a clear, consistent real-world analogy (such as a modern restaurant, digital workshop, or theatre production) to explain how the code works behind the scenes.
- Explain technical terms (like APIs, state, components, routes) in everyday language.
- Mention specific files in backticks (e.g. \`app/page.tsx\`) so the reader can connect the concept to the real codebase.

Structure your response with these exact bold section headers:

## 1. What it does (The Big Picture)
Explain the user-facing purpose of this repository in depth. What problem does it solve? Who is it built for? What does someone see and experience when using the live application?

## 2. How it works (The Blueprint Analogy)
Use an everyday analogy (e.g. front-of-house vs. back-of-house in a restaurant) to explain the overall architecture. How do the user interface, backend routes, and data helpers divide the work and collaborate?

## 3. Key building blocks (Meet the Modules)
Walk through the most critical parts of the codebase. Describe 4 to 6 important files or directories like members of a team, explaining what each one does in plain, accessible language.

## 4. Entry points (The Front Doors)
Explain where execution begins when someone visits or opens the project. Which files get loaded first, and what preparations do they make before displaying anything on screen?

## 5. Outside connections (Helpers & Tools)
Explain third-party libraries, styling engines, databases, or external services this project connects with. Compare each external tool to a familiar real-world helper (e.g. "Tailwind is like the painter's toolkit...").

## 6. The User's Journey (Step-by-Step Flow)
Provide a clear, numbered step-by-step walkthrough of what happens when a user performs a key action (such as loading the page, clicking a button, or submitting information), showing how the message travels through the code from front to back.`;
  }

  // Technical Mode (Experienced engineers / architects)
  return `You are a Principal Software Architect conducting an in-depth codebase orientation and architectural teardown for "${repoName}".

Repository Metrics & Dependency Graph Topology:
- Analyzed Files: ${stats.fileCount}
- Total Lines of Code (LOC): ${stats.totalLOC.toLocaleString()}
- Inter-Module Import Edges: ${stats.edgeCount}
- Mean Structural Complexity: ${stats.avgComplexity}/10

Extracted Module Summaries & AST Metadata:
${summaryBlock}

Instructions:
- Write a comprehensive, rigorous, senior-level architectural analysis.
- DO NOT provide brief, high-level summaries. Each section must provide deep multi-paragraph technical substance, concrete code insights, and design rationale.
- Cite specific file paths in backticks (e.g. \`path/to/module.ts\`) for every component, pattern, or dependency mentioned.
- Explicitly analyze architectural paradigms (e.g. Next.js App Router, SSR vs. Client Component boundaries, data fetching, state management, caching strategies, and API contracts).
- Address coupling, cohesion, complexity hotspots, and architectural trade-offs based on the metrics.

Structure your response with these exact bold section headers:

## 1. What it does & Architectural Scope
Comprehensive breakdown of the application domain, target user personas, functional boundaries, and core operational responsibilities. Contextualize the size (${stats.fileCount} files, ${stats.totalLOC.toLocaleString()} LOC) and structural scope of the implementation.

## 2. Architecture & Design Patterns
Analyze the overarching architectural paradigm (e.g., Next.js App Router, modular monolith, client-server segregation). Discuss design patterns, separation of concerns, how client and server environments interface, and how coupling is managed across the dependency graph.

## 3. Key Components & Subsystems
Detailed breakdown of the primary subsystems and highest-centrality modules. For each key module, analyze its structural role, internal logic, LOC, complexity score, and dependencies.

## 4. Execution Lifecycles & Entry Points
Trace the root execution pathways: initial HTTP requests, SSR hydration lifecycles, route handlers, layout bootstrapping, and interactive event dispatching. Detail the exact entry files and how runtime control flows from bootstrap to active state.

## 5. Integrations & External Contracts
Analyze all external integrations, database layers, third-party APIs, authentication providers, and cloud runtime assumptions. Explain how external boundaries are encapsulated or abstracted within internal utilities.

## 6. End-to-End Data Flow & Lifecycle
Provide a numbered, step-by-step tracing of an end-to-end data transaction (e.g., Client User Event -> View Dispatch -> Route Handler / Service Layer -> External API / Persistence -> Response Serialization -> Reactive View Update).`;
}

/**
 * On-demand module summary generation without full re-parse.
 */
async function generateMissingModuleSummaries(
  repo: { _id: mongoose.Types.ObjectId; url: string },
  userId: string | null,
  modules: IModule[],
): Promise<{ done: number; failed: number; aiError?: string }> {
  const unsummarized = modules.filter(
    (m) => m.type === "file" && (!m.summary || m.summaryStatus !== "done"),
  );

  if (unsummarized.length === 0) {
    return { done: 0, failed: 0 };
  }

  // Attempt to obtain GitHub token if available
  let token: string | undefined = undefined;
  if (userId) {
    try {
      const client = await clerkClient();
      const oauthRes = await client.users.getUserOauthAccessToken(userId, "oauth_github");
      token = oauthRes.data[0]?.token;
    } catch {
      // User might not have github oauth token connected
    }
  }
  if (!token && process.env.GITHUB_TOKEN) {
    token = process.env.GITHUB_TOKEN;
  }

  const contentMap = new Map<string, string>();
  const gh = parseGitHubUrl(repo.url);

  if (gh && token) {
    try {
      const pathsToFetch = unsummarized.slice(0, 30).map((m) => m.path);
      const batchContents = await getBatchFileContents(token, gh.owner, gh.repo, pathsToFetch);
      for (const item of batchContents) {
        contentMap.set(item.path, item.content);
      }
    } catch (fetchErr) {
      console.warn("[explain] Failed to fetch batch file contents from GitHub:", fetchErr);
    }
  }

  const inputs: SummarizeModuleInput[] = unsummarized.map((mod) => ({
    path: mod.path,
    type: mod.type,
    content: contentMap.get(mod.path) ?? "",
    loc: mod.loc ?? 0,
    complexityScore: mod.complexityScore ?? 0,
    importsCount: mod.imports?.length ?? 0,
    importedByCount: mod.importedBy?.length ?? 0,
  }));

  let aiError = "";
  let doneCount = 0;
  let failCount = 0;

  try {
    const batchResult = await summarizeModuleBatch(inputs, 3);
    const writeOps = [];

    for (const [path, result] of batchResult.results.entries()) {
      const mod = unsummarized.find((u) => u.path === path);
      if (!mod) continue;

      let finalSummary = result.summary;
      let finalStatus = result.status;

      if (result.status === "failed" || !finalSummary) {
        if (result.error && !aiError) aiError = result.error;
        // Generate grounded AST summary as fallback
        finalSummary = generateGroundedModuleSummary({
          path: mod.path,
          type: mod.type,
          loc: mod.loc ?? 0,
          complexityScore: mod.complexityScore ?? 0,
          importsCount: mod.imports?.length ?? 0,
          importedByCount: mod.importedBy?.length ?? 0,
        });
        finalStatus = "done";
        failCount++;
      } else {
        doneCount++;
      }

      writeOps.push({
        updateOne: {
          filter: { _id: mod._id },
          update: {
            $set: {
              summary: finalSummary,
              summaryStatus: finalStatus as SummaryStatus,
              summaryError: result.error || "",
            },
          },
        },
      });
    }

    if (writeOps.length > 0) {
      await Module.bulkWrite(writeOps);
    }
  } catch (batchErr: unknown) {
    aiError = batchErr instanceof Error ? batchErr.message : String(batchErr);
    console.warn("[explain] Batch summarization exception, using AST fallback:", aiError);

    // Fallback all modules to grounded AST summaries
    const writeOps = unsummarized.map((mod) => ({
      updateOne: {
        filter: { _id: mod._id },
        update: {
          $set: {
            summary: generateGroundedModuleSummary({
              path: mod.path,
              type: mod.type,
              loc: mod.loc ?? 0,
              complexityScore: mod.complexityScore ?? 0,
              importsCount: mod.imports?.length ?? 0,
              importedByCount: mod.importedBy?.length ?? 0,
            }),
            summaryStatus: "done" as const,
            summaryError: aiError,
          },
        },
      },
    }));

    if (writeOps.length > 0) {
      await Module.bulkWrite(writeOps);
    }
    failCount = unsummarized.length;
  }

  // Persist summarization state on repository
  try {
    const statusUpdate = {
      aiSummariesStatus: aiError && doneCount === 0 ? "failed" : aiError ? "partial" : "completed",
      aiSummariesError: aiError,
    };
    await Repository.findByIdAndUpdate(repo._id, statusUpdate);
  } catch {
    // ignore
  }

  return { done: doneCount, failed: failCount, aiError: aiError || undefined };
}

// ---------------------------------------------------------------------------
// GET Handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }
    const { repoId } = parsedParams.data;

    let userId: string | null = null;
    let orgId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
      orgId = authObj.orgId ?? null;
    } catch {
      // unauthenticated
    }

    await connectToDatabase();
    const resolved = await resolveRepo(repoId, userId, orgId);
    if (!resolved) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    const { repo } = resolved;
    const repoAny = repo as unknown as Record<string, unknown>;

    // Fetch all modules
    const modules = await Module.find({ repoId: repo._id })
      .select("path type loc complexityScore summary summaryStatus summaryError imports importedBy")
      .populate("imports", "path")
      .populate("importedBy", "path")
      .lean();

    const fileModules = modules.filter((m) => m.type === "file");
    const doneModules = fileModules.filter((m) => m.summaryStatus === "done" && !!m.summary);
    const generatingModules = fileModules.filter((m) => m.summaryStatus === "generating");
    const failedModules = fileModules.filter((m) => m.summaryStatus === "failed");

    // Lifecycle state determination
    const lastSyncedAt = (repoAny.lastSyncedAt as Date | undefined) ?? null;
    const isSynced = modules.length > 0;
    const aiSummariesStatus =
      (repoAny.aiSummariesStatus as string | undefined) ||
      (generatingModules.length > 0
        ? "generating"
        : isSynced && doneModules.length === 0
          ? "not_started"
          : "completed");
    const aiSummariesError = (repoAny.aiSummariesError as string | undefined) || "";

    let syncStatus: "not_synced" | "syncing" | "ready" | "missing_summaries" | "failed" = "ready";
    if (!isSynced) {
      syncStatus = "not_synced";
    } else if (aiSummariesStatus === "generating" || generatingModules.length > 0) {
      syncStatus = "syncing";
    } else if (doneModules.length === 0) {
      syncStatus = "missing_summaries";
    } else if (aiSummariesStatus === "failed" && doneModules.length === 0) {
      syncStatus = "failed";
    }

    // Map modules for frontend navigation
    const formattedModules = fileModules.map((m) => {
      const pathParts = m.path.split("/");
      const name = pathParts.pop() || m.path;
      return {
        id: String(m._id),
        name,
        path: m.path,
        type: m.type,
        loc: m.loc ?? 0,
        complexityScore: m.complexityScore ?? 0,
        summary: m.summary || "",
        summaryStatus: m.summaryStatus || "pending",
        summaryError: m.summaryError || "",
        importsCount: m.imports?.length ?? 0,
        importedByCount: m.importedBy?.length ?? 0,
        imports: ((m.imports as unknown as Array<{ _id: string; path: string }>) || []).map(
          (imp) => ({
            id: String(imp._id),
            path: imp.path,
            name: imp.path.split("/").pop() || imp.path,
          }),
        ),
        importedBy: ((m.importedBy as unknown as Array<{ _id: string; path: string }>) || []).map(
          (by) => ({
            id: String(by._id),
            path: by.path,
            name: by.path.split("/").pop() || by.path,
          }),
        ),
      };
    });

    return NextResponse.json({
      repoId: String(repo._id),
      repoName: repo.name,
      repoUrl: repo.url,
      isSynced,
      syncStatus,
      aiSummariesStatus,
      aiSummariesError,
      lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
      totalFileModules: fileModules.length,
      doneSummariesCount: doneModules.length,
      generatingCount: generatingModules.length,
      failedCount: failedModules.length,
      cachedTechnical: (repoAny.repoExplanation as string) || "",
      cachedTechnicalAt: repoAny.repoExplanationAt
        ? (repoAny.repoExplanationAt as Date).toISOString()
        : null,
      cachedBeginner: (repoAny.repoExplanationBeginner as string) || "",
      cachedBeginnerAt: repoAny.repoExplanationBeginnerAt
        ? (repoAny.repoExplanationBeginnerAt as Date).toISOString()
        : null,
      modules: formattedModules,
    });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/explain]", err);
    return NextResponse.json(
      { error: "Internal server error while fetching explanation status." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    let userId: string | null = null;
    let orgId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
      orgId = authObj.orgId ?? null;
    } catch {
      // unauthenticated
    }

    // Rate limiting for authenticated users
    let rateLimited = false;
    if (userId) {
      try {
        if (chatLimiter) {
          const { success } = await chatLimiter.limit(userId);
          if (!success) rateLimited = true;
        }
      } catch {
        // fail open
      }
    }

    if (rateLimited) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait before generating another explanation." },
        { status: 429 },
      );
    }

    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid repository ID." }, { status: 400 });
    }
    const { repoId } = parsedParams.data;

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // Empty or invalid body defaults to standard technical mode
    }
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const { mode, forceRefresh, generateMissingSummaries } = parsedBody.data;

    await connectToDatabase();
    const resolved = await resolveRepo(repoId, userId, orgId);
    if (!resolved) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    const { repo } = resolved;
    const repoAny = repo as unknown as Record<string, unknown>;

    // Fetch existing modules
    let allModules = await Module.find({ repoId: repo._id });
    if (allModules.length === 0) {
      return NextResponse.json(
        {
          error:
            "Repository has not been synchronized yet. Please synchronize the repository first.",
          syncStatus: "not_synced",
        },
        { status: 400 },
      );
    }

    const fileModules = allModules.filter((m) => m.type === "file");
    let doneModules = fileModules.filter((m) => m.summaryStatus === "done" && !!m.summary);

    // If summaries are missing, generate them on-demand
    if (
      doneModules.length === 0 ||
      generateMissingSummaries ||
      (forceRefresh && doneModules.length < fileModules.length)
    ) {
      await generateMissingModuleSummaries(repo, userId, allModules);
      // Re-query updated modules
      allModules = await Module.find({ repoId: repo._id });
      doneModules = allModules.filter(
        (m) => m.type === "file" && m.summaryStatus === "done" && !!m.summary,
      );
    }

    const cacheKey = mode === "beginner" ? "repoExplanationBeginner" : "repoExplanation";
    const cacheTimestampKey =
      mode === "beginner" ? "repoExplanationBeginnerAt" : "repoExplanationAt";

    const cachedExplanation = repoAny[cacheKey] as string | undefined;
    const cachedAt = repoAny[cacheTimestampKey] as Date | undefined;

    // Return cached explanation if valid and not forcing refresh
    if (
      !forceRefresh &&
      cachedExplanation &&
      cachedAt &&
      Date.now() - cachedAt.getTime() < CACHE_TTL_MS
    ) {
      return NextResponse.json({
        explanation: cachedExplanation,
        cached: true,
        mode,
        generatedAt: cachedAt.toISOString(),
      });
    }

    // Assemble statistics for explanation
    const totalLOC = fileModules.reduce((s, m) => s + (m.loc ?? 0), 0);
    const avgComplexity =
      fileModules.length > 0
        ? fileModules.reduce((s, m) => s + (m.complexityScore ?? 0), 0) / fileModules.length
        : 0;
    const edgeCount = fileModules.reduce((s, m) => s + (m.imports?.length ?? 0), 0);

    const fallbackModules: FallbackModuleInput[] = fileModules.map((m) => ({
      path: m.path,
      type: m.type,
      loc: m.loc ?? 0,
      complexityScore: m.complexityScore ?? 0,
      importsCount: m.imports?.length ?? 0,
      importedByCount: m.importedBy?.length ?? 0,
    }));

    // Primary path: Attempt AI generation (Gemini Free Tier or OpenAI)
    let explanation = "";

    try {
      const summariesForPrompt = (doneModules.length > 0 ? doneModules : fileModules).map((m) => ({
        path: m.path,
        summary:
          (m.summary as string) || `${m.path} (${m.loc} LOC, complexity ${m.complexityScore}/10)`,
      }));

      const prompt = buildExplainPrompt(repo.name, mode, summariesForPrompt, {
        fileCount: fileModules.length,
        totalLOC,
        avgComplexity: parseFloat(avgComplexity.toFixed(1)),
        edgeCount,
      });

      const { text } = await generateAICompletion(prompt, {
        maxTokens: 8192,
        temperature: 0.35,
      });

      explanation = text;
    } catch (aiErr: unknown) {
      console.warn(
        "[POST /api/repos/[repoId]/explain] AI generation failed, activating AST fallback:",
        aiErr instanceof Error ? aiErr.message : String(aiErr),
      );
    }

    // Fallback path: Synthesize grounded AST explanation if AI failed or returned empty
    let isFallback = false;
    if (!explanation) {
      isFallback = true;
      explanation = generateGroundedRepoExplanation({
        repoName: repo.name,
        mode,
        modules: fallbackModules,
        stats: {
          fileCount: fileModules.length,
          totalLOC,
          avgComplexity: parseFloat(avgComplexity.toFixed(1)),
          edgeCount,
        },
      });
    }

    // Cache generated explanation
    const updatePayload: Record<string, unknown> = {
      [cacheKey]: explanation,
      [cacheTimestampKey]: new Date(),
      aiSummariesError: "",
    };

    await Repository.findByIdAndUpdate(repo._id, updatePayload);

    return NextResponse.json({
      explanation,
      cached: false,
      mode,
      generatedAt: new Date().toISOString(),
      fallback: isFallback,
    });
  } catch (err: unknown) {
    console.error("[POST /api/repos/[repoId]/explain]", err);
    return NextResponse.json(
      { error: "Internal server error while processing explanation." },
      { status: 500 },
    );
  }
}
