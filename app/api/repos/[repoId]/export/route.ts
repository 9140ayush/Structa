/**
 * GET /api/repos/[repoId]/export
 *
 * Generates and returns an AI-written architecture documentation markdown file
 * for the given repository.
 *
 * PRD.md §5: One-click export of an AI-generated README/architecture doc.
 * Architecture.md §7: Route Handler pattern, Clerk auth required.
 * Rules.md §2: AI call server-side only, never from Client Component.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Module } from "@/models/Module";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { getOpenAIClient, AI_MODEL } from "@/lib/openai";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    // ------------------------------------------------------------------
    // 1. Auth
    // ------------------------------------------------------------------
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // ------------------------------------------------------------------
    // 2. Validate params
    // ------------------------------------------------------------------
    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: parsedParams.error.issues[0]?.message ?? "Invalid params." },
        { status: 400 },
      );
    }

    const { repoId } = parsedParams.data;

    // ------------------------------------------------------------------
    // 3. Verify repo ownership
    // ------------------------------------------------------------------
    await connectToDatabase();

    const dbOrg = await getOrCreateOrganization(orgId, userId);

    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repoId),
      orgId: dbOrg._id,
    })
      .select("name url healthScore lastSyncedAt isPrivate")
      .lean();

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // 4. Collect module summaries for the doc
    // ------------------------------------------------------------------
    const modules = await Module.find({
      repoId: new mongoose.Types.ObjectId(repoId),
      summaryStatus: "done",
      summary: { $ne: "" },
    })
      .sort({ complexityScore: -1 })
      .limit(50)
      .select("path summary type loc complexityScore imports importedBy")
      .lean();

    if (modules.length === 0) {
      return NextResponse.json(
        {
          error:
            "No module summaries available. Please trigger a sync first and wait for AI summarization to complete.",
        },
        { status: 422 },
      );
    }

    // ------------------------------------------------------------------
    // 5. Generate architecture doc via OpenAI
    // ------------------------------------------------------------------
    const prompt = buildDocPrompt(
      repo as {
        name: string;
        url: string;
        healthScore: number;
        lastSyncedAt: Date;
      },
      modules,
    );

    const client = getOpenAIClient();

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), 30_000);

    let markdown: string;
    try {
      const response = await client.chat.completions.create(
        {
          model: AI_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.3,
        },
        { signal: controller.signal },
      );
      markdown = response.choices[0]?.message?.content?.trim() ?? "";
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!markdown) {
      return NextResponse.json(
        { error: "AI failed to generate documentation. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ markdown });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/export]", err);
    return NextResponse.json({ error: "Internal server error during export." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildDocPrompt(
  repo: { name: string; url: string; healthScore: number; lastSyncedAt: Date },
  modules: Array<{
    path: string;
    summary: string;
    type: string;
    loc: number;
    complexityScore: number;
  }>,
): string {
  const moduleList = modules
    .map(
      (m) => `- **${m.path}** (LOC: ${m.loc}, complexity: ${m.complexityScore}/10)\n  ${m.summary}`,
    )
    .join("\n\n");

  return `You are a senior software architect. Generate a comprehensive, professional architecture documentation file in Markdown for the following GitHub repository.

Repository: ${repo.name}
URL: ${repo.url}
Health Score: ${repo.healthScore}/100
Last analyzed: ${new Date(repo.lastSyncedAt).toISOString()}

## Key Modules Analyzed (${modules.length} files)

${moduleList}

## Your Task

Write a structured Markdown architecture document with these sections:
1. **Overview** — What this codebase does, its primary purpose and domain
2. **Architecture** — High-level description of how the code is organized
3. **Key Modules** — The most important files/modules and their roles (reference the ones above)
4. **Data Flow** — How data moves through the system based on the module structure
5. **Entry Points** — Where the application starts / main entry points
6. **Complexity Hotspots** — Files with high complexity scores and why they matter
7. **Getting Started** — How a new developer would navigate this codebase

Be specific, factual, and concise. Base all claims on the module data provided above.
Format it as proper Markdown that can be directly added to a README.`;
}
