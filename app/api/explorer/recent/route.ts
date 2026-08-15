/**
 * GET /api/explorer/recent
 *
 * API endpoint to retrieve recently explored public repositories for the signed-in user.
 * Return empty array for anonymous users.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SearchHistory } from "@/models/SearchHistory";
import { PublicRepository } from "@/models/PublicRepository";

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    // Anonymous users do not have explore history
    if (!userId) {
      return NextResponse.json({
        success: true,
        data: {
          repositories: [],
        },
      });
    }

    await connectToDatabase();

    // Fetch user's recent search history (limit to 30 to allow unique filtering)
    const history = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("canonicalKey")
      .lean();

    const uniqueKeys = Array.from(new Set(history.map((h) => h.canonicalKey))).slice(0, 10);

    if (uniqueKeys.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          repositories: [],
        },
      });
    }

    // Load repository details from the cache
    const cachedRepos = await PublicRepository.find({
      canonicalKey: { $in: uniqueKeys },
      indexStatus: "indexed",
    })
      .select("canonicalKey owner repo name url description stars language healthScore")
      .lean();

    // Maintain recent timeline sorting order
    const reposMap = new Map(cachedRepos.map((r) => [r.canonicalKey, r]));
    const sortedRepos = uniqueKeys
      .map((key) => reposMap.get(key))
      .filter((r): r is NonNullable<typeof r> => !!r);

    return NextResponse.json({
      success: true,
      data: {
        repositories: sortedRepos,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/explorer/recent]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve recent repositories.",
      },
      { status: 500 },
    );
  }
}
