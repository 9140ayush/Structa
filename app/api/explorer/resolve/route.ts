/**
 * POST /api/explorer/resolve
 *
 * Explorer repository resolver and cache manager.
 * Checks the shared cache and returns cached data if fresh (Cache Hit).
 * If the cache is missing or stale, it enqueues a background indexing job
 * and returns the "indexing" status immediately without blocking.
 *
 * Accessible to all users (signed-in or anonymous).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeRepoUrl } from "@/lib/repo-url-resolver";
import { getPublicRepoDetails } from "@/lib/github-search";
import { getRepoHeadSha } from "@/lib/github";
import { PublicRepository } from "@/models/PublicRepository";
import { SearchHistory } from "@/models/SearchHistory";
import { runBackgroundIndexing } from "@/lib/explorer-indexer";

const ResolveBodySchema = z.object({
  urlOrShorthand: z.string().min(1, "URL or repository shorthand is required"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = ResolveBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 },
      );
    }

    const resolvedKey = normalizeRepoUrl(parsed.data.urlOrShorthand);
    if (!resolvedKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid repository format. Please enter a valid GitHub URL (https://github.com/owner/repo) or shorthand (owner/repo).",
        },
        { status: 400 },
      );
    }

    const { owner, repo, canonicalKey } = resolvedKey;

    await connectToDatabase();

    const token = process.env.GITHUB_PAT || "";

    // 1. Fetch current default branch and HEAD commit SHA from GitHub
    let headInfo: { commitSha: string; defaultBranch: string } | null = null;
    try {
      headInfo = await getRepoHeadSha(token, owner, repo);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const isNotFoundOrPrivate =
        status === 404 ||
        String(err).toLowerCase().includes("not found") ||
        String(err).toLowerCase().includes("private");

      if (isNotFoundOrPrivate) {
        return NextResponse.json(
          {
            success: false,
            error: `Repository ${owner}/${repo} was not found on GitHub or is private.`,
          },
          { status: 404 },
        );
      }
      // Log connection error and fail-open to cache checking if GitHub is temporarily down
      console.warn(`[resolve] Failed to fetch HEAD commit for ${canonicalKey}, failing-open:`, err);
    }

    // 2. Check the shared PublicRepository cache
    const existingCache = await PublicRepository.findOne({ canonicalKey });

    const { userId } = await auth();

    if (existingCache) {
      // Record search history for signed-in users
      if (userId) {
        await SearchHistory.create({ userId, canonicalKey });
      }

      if (existingCache.indexStatus === "indexed") {
        // Freshness check using default branch HEAD SHA
        const isFresh = headInfo ? existingCache.lastCommitShaAtIndex === headInfo.commitSha : true;

        if (isFresh) {
          // Cache Hit! Increment exploreCount atomically
          await PublicRepository.updateOne({ canonicalKey }, { $inc: { exploreCount: 1 } });

          return NextResponse.json({
            success: true,
            data: {
              cached: true,
              canonicalKey,
              graphPayload: existingCache.graphPayload,
              healthScore: existingCache.healthScore,
              indexStatus: "indexed",
              repo: {
                id: existingCache.githubRepoId,
                name: existingCache.name,
                fullName: `${existingCache.owner}/${existingCache.repo}`,
                owner: existingCache.owner,
                url: existingCache.url,
                stars: existingCache.stars,
                language: existingCache.language,
                description: existingCache.description,
                isPrivate: existingCache.isPrivate,
                defaultBranch: existingCache.defaultBranch,
                updatedAt: existingCache.indexedAt.toISOString(),
              },
            },
          });
        }

        // Cache Stale! Transition back to indexing and trigger re-index job
        existingCache.indexStatus = "indexing";
        existingCache.error = "";
        await existingCache.save();

        if (headInfo) {
          void runBackgroundIndexing(
            canonicalKey,
            owner,
            repo,
            headInfo.defaultBranch,
            headInfo.commitSha,
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            cached: false,
            canonicalKey,
            indexStatus: "indexing",
            repo: {
              id: existingCache.githubRepoId,
              name: existingCache.name,
              fullName: `${existingCache.owner}/${existingCache.repo}`,
              owner: existingCache.owner,
              url: existingCache.url,
              stars: existingCache.stars,
              language: existingCache.language,
              description: existingCache.description,
              isPrivate: existingCache.isPrivate,
              defaultBranch: existingCache.defaultBranch,
              updatedAt: existingCache.updatedAt.toISOString(),
            },
          },
        });
      }

      if (existingCache.indexStatus === "failed") {
        // If it failed, allow retrying if HEAD SHA details are available
        if (headInfo) {
          existingCache.indexStatus = "indexing";
          existingCache.error = "";
          await existingCache.save();

          void runBackgroundIndexing(
            canonicalKey,
            owner,
            repo,
            headInfo.defaultBranch,
            headInfo.commitSha,
          );

          return NextResponse.json({
            success: true,
            data: {
              cached: false,
              canonicalKey,
              indexStatus: "indexing",
              repo: {
                id: existingCache.githubRepoId,
                name: existingCache.name,
                fullName: `${existingCache.owner}/${existingCache.repo}`,
                owner: existingCache.owner,
                url: existingCache.url,
                stars: existingCache.stars,
                language: existingCache.language,
                description: existingCache.description,
                isPrivate: existingCache.isPrivate,
                defaultBranch: existingCache.defaultBranch,
                updatedAt: existingCache.updatedAt.toISOString(),
              },
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            cached: false,
            canonicalKey,
            indexStatus: "failed",
            error: existingCache.error,
            repo: {
              id: existingCache.githubRepoId,
              name: existingCache.name,
              fullName: `${existingCache.owner}/${existingCache.repo}`,
              owner: existingCache.owner,
              url: existingCache.url,
              stars: existingCache.stars,
              language: existingCache.language,
              description: existingCache.description,
              isPrivate: existingCache.isPrivate,
              defaultBranch: existingCache.defaultBranch,
              updatedAt: existingCache.updatedAt.toISOString(),
            },
          },
        });
      }

      // Already in 'indexing' or 'not_indexed' status — concurrency lock prevents duplicates
      return NextResponse.json({
        success: true,
        data: {
          cached: false,
          canonicalKey,
          indexStatus: existingCache.indexStatus,
          repo: {
            id: existingCache.githubRepoId,
            name: existingCache.name,
            fullName: `${existingCache.owner}/${existingCache.repo}`,
            owner: existingCache.owner,
            url: existingCache.url,
            stars: existingCache.stars,
            language: existingCache.language,
            description: existingCache.description,
            isPrivate: existingCache.isPrivate,
            defaultBranch: existingCache.defaultBranch,
            updatedAt: existingCache.updatedAt.toISOString(),
          },
        },
      });
    }

    // 3. Cache Miss — Validate repository public access and retrieve basic metadata
    let repoDetails;
    try {
      repoDetails = await getPublicRepoDetails(owner, repo, token);
    } catch (err: unknown) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : `Repository ${owner}/${repo} is private or does not exist.`,
        },
        { status: 400 },
      );
    }

    // Initialize document cache with indexStatus: 'indexing'
    let newCache;
    try {
      newCache = await PublicRepository.create({
        canonicalKey,
        owner,
        repo,
        name: repoDetails.name,
        url: repoDetails.url,
        description: repoDetails.description ?? "",
        stars: repoDetails.stars,
        language: repoDetails.language ?? "",
        githubRepoId: repoDetails.id,
        isPrivate: repoDetails.isPrivate,
        defaultBranch: headInfo?.defaultBranch || repoDetails.defaultBranch,
        indexStatus: "indexing",
        exploreCount: 1,
      });
    } catch (createErr: unknown) {
      if ((createErr as { code?: number })?.code === 11000) {
        const racingCache = await PublicRepository.findOne({ canonicalKey });
        if (racingCache) {
          return NextResponse.json({
            success: true,
            data: {
              cached: false,
              canonicalKey,
              indexStatus: racingCache.indexStatus,
              repo: {
                id: racingCache.githubRepoId,
                name: racingCache.name,
                fullName: `${racingCache.owner}/${racingCache.repo}`,
                owner: racingCache.owner,
                url: racingCache.url,
                stars: racingCache.stars,
                language: racingCache.language,
                description: racingCache.description,
                isPrivate: racingCache.isPrivate,
                defaultBranch: racingCache.defaultBranch,
                updatedAt: racingCache.createdAt.toISOString(),
              },
            },
          });
        }
      }
      throw createErr;
    }

    if (userId) {
      await SearchHistory.create({ userId, canonicalKey });
    }

    // Launch background worker indexing (asynchronous & non-blocking)
    if (headInfo) {
      void runBackgroundIndexing(
        canonicalKey,
        owner,
        repo,
        headInfo.defaultBranch,
        headInfo.commitSha,
      );
    } else {
      void runBackgroundIndexing(
        canonicalKey,
        owner,
        repo,
        repoDetails.defaultBranch,
        repoDetails.updatedAt, // fallback SHA if HEAD API was temporarily down
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cached: false,
        canonicalKey,
        indexStatus: "indexing",
        repo: {
          id: newCache.githubRepoId,
          name: newCache.name,
          fullName: `${newCache.owner}/${newCache.repo}`,
          owner: newCache.owner,
          url: newCache.url,
          stars: newCache.stars,
          language: newCache.language,
          description: newCache.description,
          isPrivate: newCache.isPrivate,
          defaultBranch: newCache.defaultBranch,
          updatedAt: newCache.createdAt.toISOString(),
        },
      },
    });
  } catch (err: unknown) {
    console.error("[POST /api/explorer/resolve]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to resolve repository.",
      },
      { status: 500 },
    );
  }
}
