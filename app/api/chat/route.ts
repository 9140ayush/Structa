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

const NodeContextSchema = z.object({
  nodeId: z.string(),
  nodeName: z.string(),
  nodePath: z.string(),
  nodeKind: z.string(),
  nodeSummary: z.string().optional(),
  importsCount: z.number().optional(),
  importedByCount: z.number().optional(),
  loc: z.number().optional(),
  complexityScore: z.number().optional(),
});

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
  contextMode: z.enum(["repository", "module", "file"]).optional().default("repository"),
  moduleId: z.string().optional(),
  filePath: z.string().optional(),
  nodeContext: NodeContextSchema.optional(),
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

  const { repoId, messages, contextMode, moduleId, filePath, nodeContext } = parsed.data;

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

    // Build context-aware module query
    let moduleQuery: Record<string, unknown> = {
      repoId: repo._id,
      summaryStatus: "done",
      type: "file",
      summary: { $ne: "" },
    };

    // Module-focused: narrow to a specific module by ID
    if (contextMode === "module" && moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      // Fetch target module + related modules
      const targetModule = await Module.findOne({
        _id: new mongoose.Types.ObjectId(moduleId),
        repoId: repo._id,
      })
        .select("path summary complexityScore loc")
        .lean();

      const relatedModules = await Module.find(moduleQuery)
        .sort({ complexityScore: -1 })
        .limit(20)
        .select("path summary complexityScore loc")
        .lean();

      const combined = targetModule
        ? [
            targetModule as { path: string; summary: string; complexityScore: number; loc: number },
            ...(relatedModules as Array<{
              path: string;
              summary: string;
              complexityScore: number;
              loc: number;
            }>).filter((m) => m.path !== (targetModule as { path: string }).path),
          ]
        : (relatedModules as Array<{
            path: string;
            summary: string;
            complexityScore: number;
            loc: number;
          }>);

      groundingModules = combined as Array<{
        path: string;
        summary: string;
        complexityScore: number;
        loc: number;
      }>;
    } else if (contextMode === "file" && filePath) {
      // File-focused: get the specific file + its neighbors
      moduleQuery = { ...moduleQuery, path: { $regex: filePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } };
      const fileModules = await Module.find(moduleQuery)
        .limit(5)
        .select("path summary complexityScore loc")
        .lean();

      const remaining = await Module.find({
        repoId: repo._id,
        summaryStatus: "done",
        type: "file",
        summary: { $ne: "" },
      })
        .sort({ complexityScore: -1 })
        .limit(25)
        .select("path summary complexityScore loc")
        .lean();

      const filePathSet = new Set((fileModules as Array<{ path: string }>).map((m) => m.path));
      const combined = [
        ...fileModules,
        ...(remaining as Array<{ path: string; summary: string; complexityScore: number; loc: number }>).filter((m) => !filePathSet.has(m.path)),
      ];

      groundingModules = combined as Array<{
        path: string;
        summary: string;
        complexityScore: number;
        loc: number;
      }>;
    } else {
      // Repository-wide (default)
      const modules = await Module.find(moduleQuery)
        .sort({ complexityScore: -1 })
        .limit(40)
        .select("path summary complexityScore loc")
        .lean();

      groundingModules = modules as Array<{
        path: string;
        summary: string;
        complexityScore: number;
        loc: number;
      }>;
    }

    const allModulePaths = await Module.find({ repoId: repo._id }).select("_id path").lean();
    allModulePaths.forEach((m) => {
      pathToModuleId.set(m.path, (m._id as mongoose.Types.ObjectId).toString());
    });
  }

  // ------------------------------------------------------------------
  // 4. Build grounded system prompt
  // ------------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(
    repoName,
    repoUrl,
    groundingModules,
    contextMode,
    nodeContext,
  );

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
        const errMsg = err instanceof Error ? err.message : "AI service error";
        // Send error as text before closing so the client sees it
        controller.enqueue(
          new TextEncoder().encode(
            `\n\n⚠️ ${errMsg.includes("401") ? "AI authentication error — check API key configuration." : errMsg.includes("429") ? "AI usage limit reached. Please try again later." : errMsg.includes("quota") ? "AI quota exceeded. Please try again later." : "AI service temporarily unavailable. Please retry."}`,
          ),
        );
        controller.close();
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
  contextMode: "repository" | "module" | "file" = "repository",
  nodeContext?: {
    nodeId: string;
    nodeName: string;
    nodePath: string;
    nodeKind: string;
    nodeSummary?: string;
    importsCount?: number;
    importedByCount?: number;
    loc?: number;
    complexityScore?: number;
  },
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

  // Build node context section if provided (3D Graph "Ask Codebase")
  const nodeSection = nodeContext
    ? `\n## Currently Selected Node in 3D Graph\nThe user is currently viewing this module in the 3D dependency graph:\n- **File:** \`${nodeContext.nodePath}\`\n- **Type:** ${nodeContext.nodeKind}\n- **Complexity:** ${nodeContext.complexityScore ?? "N/A"}/10\n- **Lines of Code:** ${nodeContext.loc ?? "N/A"}\n- **Imports:** ${nodeContext.importsCount ?? "N/A"} modules\n- **Imported by:** ${nodeContext.importedByCount ?? "N/A"} modules${nodeContext.nodeSummary ? `\n- **Summary:** ${nodeContext.nodeSummary}` : ""}\n\nWhen answering, prioritize information about this module unless the user asks about something else.\n`
    : "";

  // Context mode label for the prompt
  const modeLabel =
    contextMode === "module"
      ? "MODULE-FOCUSED"
      : contextMode === "file"
        ? "FILE-FOCUSED"
        : "REPOSITORY-WIDE";

  return `You are an expert software architect assistant helping developers understand the codebase of the repository "${repoName}" (${repoUrl}).

You are operating in ${modeLabel} context mode.

You MUST ground ALL answers in the actual module data provided below. Do not invent information about the codebase.
If you reference a specific file, always include its path in backticks, for example: \`src/lib/auth.ts\`
When citing a file that appears in the module list below, wrap the path like this: [[path:src/lib/auth.ts]] — this makes it clickable.
If a question cannot be answered from the module data, say so clearly. Do not guess or make up module names.

This is NOT a general-purpose chatbot. You only answer questions about this specific repository.
${nodeSection}
## Repository Modules (${modules.length} most significant files)

${moduleContext}

## Instructions
- Answer in detail — provide thorough, technically accurate responses with concrete examples from the codebase
- Always cite specific files when making architectural claims using [[path:filename]] syntax
- Explain the "why" behind architectural decisions when possible
- For beginner-level questions, explain concepts clearly without assuming deep expertise
- For technical questions, go deep on implementation details, patterns, and trade-offs
- Use [[path:filename]] syntax for files that appear in the module list above
- If summaries are missing, tell the user to run a sync first
- Never answer questions unrelated to this codebase
- When asked about architecture, provide a comprehensive overview covering: main modules, data flow, design patterns, and key dependencies`;
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
