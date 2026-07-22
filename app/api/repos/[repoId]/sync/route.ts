/**
 * POST /api/repos/[repoId]/sync
 *
 * Triggers a full re-parse of a connected GitHub repository:
 * 1. Validate auth and repo ownership
 * 2. Fetch the GitHub file tree via Octokit
 * 3. Download parseable JS/TS file contents (batch, with concurrency limit)
 * 4. Run heuristic parsing pipeline (file tree + import graph)
 * 5. Upsert Module documents into MongoDB
 * 6. Compute and persist health score on the Repository document
 * 7. Return sync result
 *
 * Rate-limited by Upstash (5 syncs/user/hour) — see lib/ratelimit.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Organization } from "@/models/Organization";
import { Module } from "@/models/Module";
import { getRepoTree, getBatchFileContents } from "@/lib/github";
import { parseRepository, computeHealthScore } from "@/lib/parser";
import { syncLimiter } from "@/lib/ratelimit";
import type { SyncResult } from "@/types/graph";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "owner/repo" from a GitHub URL */
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

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    // ------------------------------------------------------------------
    // 1. Auth
    // ------------------------------------------------------------------
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized or no active organization." },
        { status: 401 },
      );
    }

    // ------------------------------------------------------------------
    // 2. Rate limiting (fail-open if Redis unavailable)
    // ------------------------------------------------------------------
    let rateLimitPassed = true;
    try {
      const { success, limit, remaining, reset } = await syncLimiter.limit(userId);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Maximum 5 syncs per hour." },
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
      console.warn("[sync] Rate limiter unavailable, failing open:", rlErr);
      rateLimitPassed = false; // logged but allowed
    }

    // ------------------------------------------------------------------
    // 3. Validate params
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
    // 4. Verify repo ownership
    // ------------------------------------------------------------------
    await connectToDatabase();

    const dbOrg = await Organization.findOne({ clerkOrgId: orgId });
    if (!dbOrg) {
      return NextResponse.json({ error: "Organization not found in database." }, { status: 404 });
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

    // ------------------------------------------------------------------
    // 5. Obtain GitHub OAuth token via Clerk
    // ------------------------------------------------------------------
    const client = await clerkClient();
    const oauthRes = await client.users.getUserOauthAccessToken(userId, "oauth_github");
    const token = oauthRes.data[0]?.token;

    if (!token) {
      return NextResponse.json(
        { error: "GitHub OAuth token not found. Please reconnect your GitHub account." },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // 6. Parse the GitHub URL to get owner/repo
    // ------------------------------------------------------------------
    const repoHandle = parseGitHubUrl(repo.url);
    if (!repoHandle) {
      return NextResponse.json({ error: "Cannot parse GitHub repository URL." }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // 7. Fetch full recursive file tree from GitHub
    // ------------------------------------------------------------------
    const { tree, truncated } = await getRepoTree(token, repoHandle.owner, repoHandle.repo);

    if (truncated) {
      console.warn(
        `[sync] GitHub tree was truncated for ${repoHandle.owner}/${repoHandle.repo}. Large monorepo — results will be partial.`,
      );
    }

    // ------------------------------------------------------------------
    // 8. Download parseable JS/TS file contents
    // ------------------------------------------------------------------
    const PARSEABLE_EXTS = new Set(["js", "jsx", "ts", "tsx", "mjs", "cjs", "mts", "cts"]);

    const parseablePaths = tree
      .filter((item) => {
        if (item.type !== "blob") return false;
        const ext = item.path.split(".").pop() ?? "";
        return PARSEABLE_EXTS.has(ext);
      })
      // Limit to 500 files for MVP performance
      .slice(0, 500)
      .map((item) => item.path);

    const fetchedFiles = await getBatchFileContents(
      token,
      repoHandle.owner,
      repoHandle.repo,
      parseablePaths,
    );

    const contentMap = new Map<string, string>(fetchedFiles.map((f) => [f.path, f.content]));

    // ------------------------------------------------------------------
    // 9. Run parsing pipeline
    // ------------------------------------------------------------------
    const parseResult = parseRepository(tree, contentMap);

    // ------------------------------------------------------------------
    // 10. Compute health score (Task 4)
    // ------------------------------------------------------------------
    const healthScore = computeHealthScore(parseResult);

    // ------------------------------------------------------------------
    // 11. Upsert Module documents
    // ------------------------------------------------------------------

    // First: Prune any stale modules that were deleted or renamed in the repository
    const existingModules = await Module.find({ repoId: repo._id }).select("path").lean();
    const newPaths = new Set(parseResult.modules.map((mod) => mod.path));
    const pathsToDelete = existingModules.map((m) => m.path).filter((path) => !newPaths.has(path));

    if (pathsToDelete.length > 0) {
      await Module.deleteMany({ repoId: repo._id, path: { $in: pathsToDelete } });
    }

    // Second: upsert all modules without import refs (we need _ids first)
    const upsertOps = parseResult.modules.map((mod) => ({
      updateOne: {
        filter: { repoId: repo._id, path: mod.path },
        update: {
          $set: {
            repoId: repo._id,
            path: mod.path,
            type: mod.type,
            loc: mod.loc,
            complexityScore: mod.complexityScore,
            summary: "", // populated in Phase 4
          },
        },
        upsert: true,
      },
    }));

    if (upsertOps.length > 0) {
      await Module.bulkWrite(upsertOps);
    }

    // Second pass: wire up import references using resolved _ids
    const allModuleDocs = await Module.find({ repoId: repo._id }).select("_id path").lean();
    const pathToId = new Map<string, mongoose.Types.ObjectId>(
      allModuleDocs.map((m) => [m.path, m._id as mongoose.Types.ObjectId]),
    );

    const importWireOps = parseResult.modules
      .filter((mod) => mod.imports.length > 0)
      .map((mod) => {
        const fromId = pathToId.get(mod.path);
        if (!fromId) return null;

        const importIds = mod.imports
          .map((importPath) => pathToId.get(importPath))
          .filter((id): id is mongoose.Types.ObjectId => id !== undefined);

        return {
          updateOne: {
            filter: { _id: fromId },
            update: { $set: { imports: importIds } },
          },
        };
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    // Wire importedBy (reverse index)
    const importedByMap = new Map<string, mongoose.Types.ObjectId[]>();
    for (const mod of parseResult.modules) {
      for (const importPath of mod.imports) {
        if (!importedByMap.has(importPath)) importedByMap.set(importPath, []);
        const fromId = pathToId.get(mod.path);
        if (fromId) importedByMap.get(importPath)!.push(fromId);
      }
    }

    const importedByOps = Array.from(importedByMap.entries())
      .map(([path, ids]) => {
        const targetId = pathToId.get(path);
        if (!targetId) return null;
        return {
          updateOne: {
            filter: { _id: targetId },
            update: { $set: { importedBy: ids } },
          },
        };
      })
      .filter((op): op is NonNullable<typeof op> => op !== null);

    const allWireOps = [...importWireOps, ...importedByOps];
    if (allWireOps.length > 0) {
      await Module.bulkWrite(allWireOps);
    }

    // ------------------------------------------------------------------
    // 12. Persist health score + lastSyncedAt on Repository
    // ------------------------------------------------------------------
    await Repository.updateOne(
      { _id: repo._id },
      {
        $set: {
          healthScore,
          lastSyncedAt: new Date(),
        },
      },
    );

    // ------------------------------------------------------------------
    // 13. Return result
    // ------------------------------------------------------------------
    const result: SyncResult = {
      status: "synced",
      repoId: repo._id.toString(),
      healthScore,
      moduleCount: parseResult.modules.length,
      edgeCount: parseResult.edges.length,
      syncedAt: new Date().toISOString(),
    };

    if (!rateLimitPassed) {
      // Rate limiter was unavailable — add a warning header
      return NextResponse.json(result, {
        headers: { "X-RateLimit-Warning": "rate-limiter-unavailable" },
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[POST /api/repos/[repoId]/sync]", err);
    return NextResponse.json({ error: "Internal server error during sync." }, { status: 500 });
  }
}
