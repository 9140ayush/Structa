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
import { getOpenAIClient, AI_MODEL } from "@/lib/openai";
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
 * Builds OpenAI structured prompt for repository explanation.
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
    .slice(0, 35)
    .map((s) => `- ${s.path}: ${s.summary}`)
    .join("\n");

  const audienceNote =
    mode === "beginner"
      ? "Explain as if to someone who is not familiar with software development. Use plain language. Avoid jargon. Use clear everyday analogies where helpful."
      : "Explain technically for an experienced software engineer. Use precise terminology, architectural concepts, and reference concrete module relationships.";

  return `You are analyzing a software repository named "${repoName}".

Repository statistics:
- ${stats.fileCount} files analyzed
- ${stats.totalLOC.toLocaleString()} total lines of code
- ${stats.edgeCount} import dependencies
- Average complexity score: ${stats.avgComplexity}/10

Module summaries (derived from code analysis):
${summaryBlock}

${audienceNote}

Please write a structured explanation of this repository covering:

1. **What it does** — The primary purpose and user-facing value of this project.
2. **How it works** — The main architectural approach (e.g. Next.js App Router, MVC, service-oriented, monorepo, etc.).
3. **Key components** — The most important modules or layers and their roles.
4. **Entry points** — Where execution begins (e.g. main files, API routes, page components).
5. **External integrations** — Third-party services, databases, or APIs it connects to.
6. **Data flow** — How data moves through the system at a high level.

Format your response in clear sections with bold headers (## 1. What it does, etc.). Reference specific files or paths from the summaries where relevant. If you cannot confidently answer a section from the available data, provide a grounded assessment and avoid unsupported assumptions.`;
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

    // Primary path: Attempt OpenAI generation
    let explanation = "";
    let openAiError: string | undefined = undefined;

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

      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
        temperature: 0.35,
      });

      explanation = response.choices[0]?.message?.content?.trim() ?? "";
    } catch (aiErr: unknown) {
      openAiError = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.warn(
        "[POST /api/repos/[repoId]/explain] OpenAI generation failed, activating AST fallback:",
        openAiError,
      );
    }

    // Fallback path: Synthesize grounded AST explanation if OpenAI failed or returned empty
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
        aiError: openAiError,
      });
    }

    // Cache generated explanation
    const updatePayload: Record<string, unknown> = {
      [cacheKey]: explanation,
      [cacheTimestampKey]: new Date(),
    };
    if (openAiError) {
      updatePayload.aiSummariesError = openAiError;
    }

    await Repository.findByIdAndUpdate(repo._id, updatePayload);

    return NextResponse.json({
      explanation,
      cached: false,
      mode,
      generatedAt: new Date().toISOString(),
      fallback: isFallback,
      aiError: openAiError,
    });
  } catch (err: unknown) {
    console.error("[POST /api/repos/[repoId]/explain]", err);
    return NextResponse.json(
      { error: "Internal server error while processing explanation." },
      { status: 500 },
    );
  }
}
