/**
 * GET /api/explorer/analytics
 *
 * API endpoint to retrieve aggregate analytics for Explorer Mode.
 * Return public metrics (cache hit rate, top explored repos, aggregate search volume).
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PublicRepository } from "@/models/PublicRepository";
import { SearchHistory } from "@/models/SearchHistory";

export async function GET(): Promise<NextResponse> {
  try {
    await connectToDatabase();

    // 1. Compute Cache Hit Rate
    const repos = await PublicRepository.find({ indexStatus: "indexed" })
      .select("exploreCount")
      .lean();

    const totalIndexed = repos.length;
    let totalVisits = 0;
    repos.forEach((r) => {
      totalVisits += r.exploreCount ?? 1;
    });

    // Cache hit rate = (totalVisits - totalMisses) / totalVisits
    // A cache miss happens exactly once when a repo is first created/indexed.
    const totalMisses = totalIndexed;
    const totalHits = Math.max(0, totalVisits - totalMisses);
    const cacheHitRate = totalVisits > 0 ? totalHits / totalVisits : 1.0;

    // 2. Top explored repositories
    const topExplored = await PublicRepository.find({ indexStatus: "indexed" })
      .sort({ exploreCount: -1, stars: -1 })
      .limit(5)
      .select("canonicalKey exploreCount stars")
      .lean();

    // 3. Search history volume (aggregate counts)
    const searchVolume = await SearchHistory.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        cacheHitRate,
        totalVisits,
        totalMisses,
        searchVolume,
        topExplored: topExplored.map((r) => ({
          canonicalKey: r.canonicalKey,
          exploreCount: r.exploreCount,
          stars: r.stars,
        })),
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/explorer/analytics]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to compile explorer analytics.",
      },
      { status: 500 },
    );
  }
}
