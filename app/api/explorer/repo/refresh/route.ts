/**
 * POST /api/explorer/repo/refresh
 *
 * Forces re-indexing of a public repository.
 * Signed-in users only. Respects the concurrency lock if already indexing.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PublicRepository } from "@/models/PublicRepository";
import { getRepoHeadSha } from "@/lib/github";
import { runBackgroundIndexing } from "@/lib/explorer-indexer";
import { z } from "zod";

const RefreshBodySchema = z.object({
  canonicalKey: z
    .string()
    .min(1, "canonicalKey is required")
    .includes("/", { message: "Invalid repository format. Expected owner/repo." }),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticated user check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to refresh repositories." },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = RefreshBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 },
      );
    }

    const { canonicalKey } = parsed.data;
    const [owner, repo] = canonicalKey.split("/");

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: "Invalid repository key format. Expected owner/repo." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 2. Fetch from cache to verify it is already indexed
    const cachedRepo = await PublicRepository.findOne({
      canonicalKey: canonicalKey.toLowerCase(),
    });
    if (!cachedRepo) {
      return NextResponse.json(
        { success: false, error: "Repository is not indexed yet. Resolve it first." },
        { status: 404 },
      );
    }

    // 3. Concurrency lock: do not queue another job if already indexing
    if (cachedRepo.indexStatus === "indexing") {
      return NextResponse.json({
        success: true,
        data: {
          message: "Repository is already indexing. No duplicate job created.",
          indexStatus: "indexing",
        },
      });
    }

    // 4. Force re-indexing in background
    const token = process.env.GITHUB_PAT || "";
    let headInfo;
    try {
      headInfo = await getRepoHeadSha(token, owner, repo);
    } catch (err: unknown) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not fetch GitHub branch info: ${err instanceof Error ? err.message : String(err)}`,
        },
        { status: 400 },
      );
    }

    // Atomically set status to indexing to acquire the lock
    cachedRepo.indexStatus = "indexing";
    cachedRepo.error = "";
    await cachedRepo.save();

    // Launch background worker (asynchronous & non-blocking)
    void runBackgroundIndexing(
      canonicalKey.toLowerCase(),
      owner,
      repo,
      headInfo.defaultBranch,
      headInfo.commitSha,
    );

    return NextResponse.json({
      success: true,
      data: {
        message: "Background indexing refreshed and enqueued successfully.",
        indexStatus: "indexing",
      },
    });
  } catch (err: unknown) {
    console.error("[POST /api/explorer/repo/refresh]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during refresh." },
      { status: 500 },
    );
  }
}
