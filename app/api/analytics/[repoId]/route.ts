/**
 * GET /api/analytics/[repoId]
 * POST /api/analytics/[repoId]
 *
 * Workspace repository analytics route handler.
 * GET: Compiles top-visited modules and GitHub contributor module activity.
 * POST: Logs a file/module selection visit.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Module } from "@/models/Module";
import { ModuleVisit } from "@/models/ModuleVisit";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { normalizeRepoUrl } from "@/lib/repo-url-resolver";
import { Octokit } from "octokit";
import mongoose from "mongoose";

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

const VisitBodySchema = z.object({
  moduleId: z.string().min(1, "moduleId is required"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { success: false, error: parsedParams.error.issues[0]?.message ?? "Invalid params." },
        { status: 400 },
      );
    }

    const { repoId } = parsedParams.data;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const parsedBody = VisitBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const { moduleId } = parsedBody.data;

    await connectToDatabase();

    // Verify Repository access
    const dbOrg = await getOrCreateOrganization(orgId, userId);
    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repoId),
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // Verify Module exists
    const targetModule = await Module.findOne({
      _id: new mongoose.Types.ObjectId(moduleId),
      repoId: repo._id,
    });

    if (!targetModule) {
      return NextResponse.json(
        { success: false, error: "Module not found in this repository." },
        { status: 404 },
      );
    }

    // Atomically increment visit count per module per user
    await ModuleVisit.findOneAndUpdate(
      {
        repoId: repo._id,
        moduleId: targetModule._id,
        userId,
      },
      {
        $inc: { visitCount: 1 },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[POST /api/analytics/[repoId]]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to record module visit.",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { success: false, error: parsedParams.error.issues[0]?.message ?? "Invalid params." },
        { status: 400 },
      );
    }

    const { repoId } = parsedParams.data;

    await connectToDatabase();

    // 1. Verify Repository access
    const dbOrg = await getOrCreateOrganization(orgId, userId);
    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repoId),
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 2. Fetch top 10 most-visited files/modules
    const visits = await ModuleVisit.find({ repoId: repo._id })
      .sort({ visitCount: -1 })
      .limit(10)
      .lean();

    const moduleIds = visits.map((v) => v.moduleId);
    const matchedModules = await Module.find({ _id: { $in: moduleIds } })
      .select("path type loc complexityScore")
      .lean();

    const moduleMap = new Map(matchedModules.map((m) => [m._id.toString(), m]));
    const mostVisited = visits
      .map((v) => {
        const mod = moduleMap.get(v.moduleId.toString());
        if (!mod) return null;
        return {
          path: mod.path,
          type: mod.type,
          loc: mod.loc,
          complexityScore: mod.complexityScore,
          visitCount: v.visitCount,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    // 3. Retrieve GitHub commits contributor history (limit 15 commits for performance)
    const client = await clerkClient();
    const oauthRes = await client.users.getUserOauthAccessToken(userId, "oauth_github");
    const token = oauthRes.data[0]?.token;

    const commitTimeline: Array<{
      author: string;
      avatarUrl: string;
      commitSha: string;
      message: string;
      timestamp: string;
      changes: string[];
    }> = [];
    const contributorAggregates: Record<
      string,
      { commits: number; filesTouched: Set<string>; avatarUrl: string }
    > = {};

    if (token) {
      const repoDetails = normalizeRepoUrl(repo.url);
      if (repoDetails) {
        try {
          const octokit = new Octokit({ auth: token });
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner: repoDetails.owner,
            repo: repoDetails.repo,
            per_page: 15,
          });

          // Fetch file details concurrently (controlled limit to prevent API rate-limit stalls)
          const commitDetails = await Promise.allSettled(
            commits.map((c) =>
              octokit.rest.repos.getCommit({
                owner: repoDetails.owner,
                repo: repoDetails.repo,
                ref: c.sha,
              }),
            ),
          );

          // Get parsed repo modules list to filter files
          const parsedModules = await Module.find({ repoId: repo._id }).select("path").lean();
          const parsedPaths = new Set(parsedModules.map((m) => m.path));

          commitDetails.forEach((outcome, index) => {
            const commitObj = commits[index]!;
            if (outcome.status === "fulfilled") {
              const details = outcome.value.data;
              const changedFiles = (details.files || [])
                .map((f) => f.filename)
                .filter((p) => parsedPaths.has(p)); // Map only to real parsed modules

              const authorName =
                commitObj.commit.author?.name || commitObj.author?.login || "Unknown";
              const avatarUrl = commitObj.author?.avatar_url || "";

              if (changedFiles.length > 0) {
                // Timeline Activity Item
                commitTimeline.push({
                  author: authorName,
                  avatarUrl,
                  commitSha: commitObj.sha.slice(0, 7),
                  message: commitObj.commit.message.split("\n")[0] || "",
                  timestamp: commitObj.commit.author?.date || new Date().toISOString(),
                  changes: changedFiles,
                });

                // Contributor Aggregates
                if (!contributorAggregates[authorName]) {
                  contributorAggregates[authorName] = {
                    commits: 0,
                    filesTouched: new Set<string>(),
                    avatarUrl,
                  };
                }
                const stats = contributorAggregates[authorName]!;
                stats.commits += 1;
                changedFiles.forEach((file) => stats.filesTouched.add(file));
              }
            }
          });
        } catch (gitErr: unknown) {
          console.warn("[analytics] GitHub API retrieval failed:", gitErr);
        }
      }
    }

    // Convert contributor Sets to Arrays for serialization
    const contributors = Object.entries(contributorAggregates).map(([name, stats]) => ({
      name,
      commits: stats.commits,
      filesTouchedCount: stats.filesTouched.size,
      avatarUrl: stats.avatarUrl,
      filesTouched: Array.from(stats.filesTouched),
    }));

    return NextResponse.json({
      success: true,
      data: {
        mostVisited,
        timeline: commitTimeline,
        contributors,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/analytics/[repoId]]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to compile repo analytics.",
      },
      { status: 500 },
    );
  }
}
