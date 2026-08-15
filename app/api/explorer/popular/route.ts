/**
 * GET /api/explorer/popular
 *
 * API endpoint to retrieve the most popular public repositories explored on Structa.
 * Accessible to all users (signed-in or anonymous).
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PublicRepository } from "@/models/PublicRepository";

export async function GET(): Promise<NextResponse> {
  try {
    await connectToDatabase();

    // Fetch top 10 indexed public repositories by exploreCount
    const popularRepos = await PublicRepository.find({
      indexStatus: "indexed",
      isPrivate: false,
    })
      .sort({ exploreCount: -1, stars: -1 })
      .limit(10)
      .select(
        "canonicalKey owner repo name url description stars language healthScore exploreCount",
      )
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        repositories: popularRepos,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/explorer/popular]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve popular repositories.",
      },
      { status: 500 },
    );
  }
}
