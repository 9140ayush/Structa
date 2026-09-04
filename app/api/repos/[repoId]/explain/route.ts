/**
 * POST /api/repos/[repoId]/explain
 *
 * Generates (or retrieves cached) an AI-powered repository explanation.
 * Supports two modes: "technical" and "beginner".
 *
 * - Reads from Repository.repoExplanation cache first (7-day TTL).
 * - Falls back to assembling module summaries and calling OpenAI.
 * - Stores result on the Repository document to avoid re-generation.
 * - Uses existing getOpenAIClient(), AI_MODEL, chatLimiter infrastructure.
 * - Rate-limited via existing chatLimiter.
 *
 * Never exposes source code — only AI-generated summaries.
 * Architecture.md §8: Users cannot query repos outside their organization.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository, type IRepository } from "@/models/Repository";
import { Module } from "@/models/Module";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { getOpenAIClient, AI_MODEL } from "@/lib/openai";
import { chatLimiter } from "@/lib/ratelimit";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  repoId: z.string().min(1),
});

const BodySchema = z.object({
  mode: z.enum(["technical", "beginner"]).default("technical"),
  forceRefresh: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Cache TTL — 7 days in ms
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

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
    .slice(0, 30)
    .map((s) => `- ${s.path}: ${s.summary}`)
    .join("\n");

  const audienceNote =
    mode === "beginner"
      ? "Explain as if to someone who is not familiar with software development. Use plain language. Avoid jargon. Use analogies where helpful."
      : "Explain technically for an experienced software engineer. Use precise terminology. Be concise but thorough.";

  return `You are analyzing a software repository named "${repoName}".

Repository statistics:
- ${stats.fileCount} files analyzed
- ${stats.totalLOC.toLocaleString()} total lines of code
- ${stats.edgeCount} import dependencies
- Average complexity score: ${stats.avgComplexity}/10

Module summaries (derived from analysis):
${summaryBlock}

${audienceNote}

Please write a structured explanation of this repository covering:

1. **What it does** — The primary purpose and user-facing value of this project.
2. **How it works** — The main architectural approach (e.g. MVC, microservices, monorepo, etc.).
3. **Key components** — The most important modules or layers and their roles.
4. **Entry points** — Where execution begins (e.g. main files, API routes, page components).
5. **External integrations** — Third-party services, databases, or APIs it connects to.
6. **Data flow** — How data moves through the system at a high level.

Format your response in clear sections with bold headers. Reference specific files or paths from the summaries where relevant. If you cannot confidently answer a section from the available data, say "Not enough information to determine this confidently." Do not fabricate architectural assumptions.`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    // 1. Auth
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Rate limiting
    let rateLimited = false;
    try {
      if (chatLimiter) {
        const { success } = await chatLimiter.limit(userId);
        if (!success) rateLimited = true;
      }
    } catch {
      // fail-open
    }
    if (rateLimited) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait before generating another explanation." },
        { status: 429 },
      );
    }

    // 3. Validate params
    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid params." }, { status: 400 });
    }
    const { repoId } = parsedParams.data;

    // 4. Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const { mode, forceRefresh } = parsedBody.data;

    // 5. DB connection + auth check
    await connectToDatabase();
    const dbOrg = await getOrCreateOrganization(orgId, userId);

    if (!mongoose.Types.ObjectId.isValid(repoId)) {
      return NextResponse.json({ error: "Invalid repository ID format." }, { status: 400 });
    }

    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repoId),
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 6. Check cache
    const cacheKey = mode === "beginner" ? "repoExplanationBeginner" : "repoExplanation";
    const cacheTimestampKey =
      mode === "beginner" ? "repoExplanationBeginnerAt" : "repoExplanationAt";

    const repoAny = repo as unknown as IRepository & Record<string, unknown>;
    const cachedExplanation = repoAny[cacheKey] as string | undefined;
    const cachedAt = repoAny[cacheTimestampKey] as Date | undefined;

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

    // 7. Fetch module summaries
    const modules = await Module.find({
      repoId: repo._id,
      type: "file",
      summaryStatus: "done",
      summary: { $ne: "" },
    })
      .select("path summary loc complexityScore imports importedBy")
      .lean();

    if (modules.length === 0) {
      return NextResponse.json(
        {
          error: "No AI summaries available yet. Sync the repository to generate them.",
        },
        { status: 422 },
      );
    }

    // Build stats
    const allModules = await Module.find({ repoId: repo._id, type: "file" }).lean();
    const totalLOC = allModules.reduce((s, m) => s + (m.loc ?? 0), 0);
    const avgComplexity =
      allModules.length > 0
        ? allModules.reduce((s, m) => s + (m.complexityScore ?? 0), 0) / allModules.length
        : 0;
    const edgeCount = allModules.reduce((s, m) => s + (m.imports?.length ?? 0), 0);

    const summariesForPrompt = modules.map((m) => ({
      path: m.path,
      summary: (m.summary as string).slice(0, 300),
    }));

    // 8. Call OpenAI
    const prompt = buildExplainPrompt(repo.name, mode, summariesForPrompt, {
      fileCount: allModules.length,
      totalLOC,
      avgComplexity: parseFloat(avgComplexity.toFixed(1)),
      edgeCount,
    });

    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.4,
    });

    const explanation = response.choices[0]?.message?.content?.trim() ?? "";
    if (!explanation) {
      return NextResponse.json({ error: "AI returned empty response." }, { status: 502 });
    }

    // 9. Cache result
    await Repository.findByIdAndUpdate(repo._id, {
      [cacheKey]: explanation,
      [cacheTimestampKey]: new Date(),
    });

    return NextResponse.json({
      explanation,
      cached: false,
      mode,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[POST /api/repos/[repoId]/explain]", err);
    return NextResponse.json(
      { error: "Internal server error while generating explanation." },
      { status: 500 },
    );
  }
}
