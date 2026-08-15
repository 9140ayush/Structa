/**
 * POST /api/chat
 *
 * Grounded repository chat endpoint with OpenAI streaming.
 * Supports both Workspace Mode (ObjectId) and Explorer Mode (canonicalKey).
 *
 * Rules.md §2: AI calls never from Client Components.
 * Rules.md §2: All external input validated with Zod.
 * Rules.md §3: Rate limiting is a correctness requirement, not polish.
 * Architecture.md §8: Users cannot query repos outside their organization.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { PublicRepository } from "@/models/PublicRepository";
import { Module } from "@/models/Module";
import { ChatSession } from "@/models/ChatSession";
import { chatLimiter } from "@/lib/ratelimit";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { getOpenAIClient, AI_MODEL, CHAT_MAX_TOKENS } from "@/lib/openai";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const ChatRequestSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1, "At least one message is required")
    .max(50, "Message history too long"),
});

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  // ------------------------------------------------------------------
  // 1. Auth & Mode Detection
  // ------------------------------------------------------------------
  const { userId, orgId } = await auth();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { repoId, messages } = parsed.data;

  // Mode detection: canonicalKey containing slash indicates Explorer Mode
  const isExplorer = repoId.includes("/");

  if (!isExplorer && !userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  // ------------------------------------------------------------------
  // 2. Rate limiting (fail-open if Redis unavailable)
  // ------------------------------------------------------------------
  if (userId) {
    try {
      const { success, limit, remaining, reset } = await chatLimiter.limit(userId);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Maximum 60 chat requests per hour." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": String(remaining),
              "X-RateLimit-Reset": String(reset),
            },
          },
        );
      }
    } catch (rlErr: unknown) {
      console.warn("[chat] Rate limiter unavailable, failing open:", rlErr);
    }
  }

  // ------------------------------------------------------------------
  // 3. Database fetch & Grounding
  // ------------------------------------------------------------------
  await connectToDatabase();

  let targetRepoObjectId: mongoose.Types.ObjectId;
  let repoName: string;
  let repoUrl: string;
  let groundingModules: Array<{
    path: string;
    summary: string;
    complexityScore: number;
    loc: number;
  }> = [];
  const pathToModuleId = new Map<string, string>();

  if (isExplorer) {
    const canonicalKey = repoId.toLowerCase();
    const cachedRepo = await PublicRepository.findOne({ canonicalKey });

    if (!cachedRepo) {
      return NextResponse.json({ error: "Repository not found in cache." }, { status: 404 });
    }
    if (cachedRepo.isPrivate) {
      return NextResponse.json({ error: "Private repositories are denied." }, { status: 403 });
    }

    targetRepoObjectId = cachedRepo._id as mongoose.Types.ObjectId;
    repoName = cachedRepo.name;
    repoUrl = cachedRepo.url;

    // Retrieve grounding files from the cached graph
    const nodes = cachedRepo.graphPayload?.nodes || [];
    const fileNodes = nodes.filter((n) => n.kind === "file" && n.summary);

    // Sort by complexity score to get key files
    fileNodes.sort((a, b) => (b.complexityScore || 0) - (a.complexityScore || 0));
    const topFileNodes = fileNodes.slice(0, 30);

    groundingModules = topFileNodes.map((n) => ({
      path: n.path,
      summary: n.summary || "",
      complexityScore: n.complexityScore || 0,
      loc: n.loc || 0,
    }));

    nodes.forEach((n) => {
      pathToModuleId.set(n.path, n.id);
    });
  } else {
    // Workspace Mode
    const dbOrg = await getOrCreateOrganization(orgId, userId!);
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

    targetRepoObjectId = repo._id as mongoose.Types.ObjectId;
    repoName = repo.name;
    repoUrl = repo.url;

    const modules = await Module.find({
      repoId: repo._id,
      summaryStatus: "done",
      type: "file",
      summary: { $ne: "" },
    })
      .sort({ complexityScore: -1 })
      .limit(30)
      .select("path summary complexityScore loc")
      .lean();

    groundingModules = modules as Array<{
      path: string;
      summary: string;
      complexityScore: number;
      loc: number;
    }>;

    const allModulePaths = await Module.find({ repoId: repo._id }).select("_id path").lean();
    allModulePaths.forEach((m) => {
      pathToModuleId.set(m.path, (m._id as mongoose.Types.ObjectId).toString());
    });
  }

  // ------------------------------------------------------------------
  // 4. Build grounded system prompt
  // ------------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(repoName, repoUrl, groundingModules);

  // ------------------------------------------------------------------
  // 5. Stream response via OpenAI SDK
  // ------------------------------------------------------------------
  const client = getOpenAIClient();

  const openaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const aiStream = await client.chat.completions.create({
          model: AI_MODEL,
          messages: openaiMessages,
          max_tokens: CHAT_MAX_TOKENS,
          temperature: 0.3,
          stream: true,
        });

        for await (const chunk of aiStream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            controller.enqueue(new TextEncoder().encode(delta));
          }
        }

        controller.close();

        // Only persist chat session if the user is authenticated
        if (userId) {
          void persistChatSession(targetRepoObjectId, userId, messages, fullText, pathToModuleId);
        }
      } catch (err: unknown) {
        console.error("[chat] Stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistChatSession(
  repoId: mongoose.Types.ObjectId,
  userId: string,
  userMessages: Array<{ role: string; content: string }>,
  assistantResponse: string,
  pathToModuleId: Map<string, string>,
): Promise<void> {
  try {
    const citedPaths = extractCitedPaths(assistantResponse, pathToModuleId);
    const lastUserMessage = [...userMessages].reverse().find((m) => m.role === "user");

    await ChatSession.findOneAndUpdate(
      { repoId, userId },
      {
        $push: {
          messages: {
            $each: [
              ...(lastUserMessage
                ? [
                    {
                      role: "user" as const,
                      content: lastUserMessage.content,
                      citedModuleIds: [],
                      createdAt: new Date(),
                    },
                  ]
                : []),
              {
                role: "assistant" as const,
                content: assistantResponse,
                citedModuleIds: citedPaths,
                createdAt: new Date(),
              },
            ],
          },
        },
      },
      { upsert: true, new: true },
    );
  } catch (persistErr) {
    console.error("[chat] Failed to persist chat session:", persistErr);
  }
}

function buildSystemPrompt(
  repoName: string,
  repoUrl: string,
  modules: Array<{ path: string; summary: string; complexityScore: number; loc: number }>,
): string {
  const moduleContext =
    modules.length > 0
      ? modules
          .map(
            (m) =>
              `### ${m.path}\nComplexity: ${m.complexityScore}/10 | LOC: ${m.loc}\nSummary: ${m.summary}`,
          )
          .join("\n\n")
      : "No module summaries are available yet. Ask the user to trigger a sync first.";

  return `You are an expert software architect assistant helping developers understand the codebase of the repository "${repoName}" (${repoUrl}).

You MUST ground ALL answers in the actual module data provided below. Do not invent information about the codebase.
If you reference a specific file, always include its path in backticks, for example: \`src/lib/auth.ts\`
When citing a file that appears in the module list below, wrap the path like this: [[path:src/lib/auth.ts]] — this makes it clickable.
If a question cannot be answered from the module data, say so clearly. Do not guess or make up module names.

This is NOT a general-purpose chatbot. You only answer questions about this specific repository.

## Repository Modules (${modules.length} most significant files)

${moduleContext}

## Instructions
- Answer concisely and technically
- Always cite specific files when making architectural claims
- Use [[path:filename]] syntax for files that appear in the module list above
- If summaries are missing, tell the user to run a sync first
- Never answer questions unrelated to this codebase`;
}

function extractCitedPaths(text: string, pathToModuleId: Map<string, string>): string[] {
  const matches = text.matchAll(/\[\[path:([^\]]+)\]\]/g);
  const cited = new Set<string>();
  for (const match of matches) {
    const path = match[1]?.trim();
    if (path && pathToModuleId.has(path)) {
      cited.add(pathToModuleId.get(path)!);
    }
  }
  return Array.from(cited);
}
