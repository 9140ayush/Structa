/**
 * GET /api/explorer/status/[...key]
 *
 * Route handler to fetch public repository indexing status by canonical key (e.g. facebook/react).
 * Returns status, progress, or failure error details if indexing failed.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PublicRepository } from "@/models/PublicRepository";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  try {
    const rawParams = await context.params;
    const keyArray = rawParams.key || [];

    if (keyArray.length < 2) {
      return NextResponse.json(
        { success: false, error: "Invalid repository key format. Expected owner/repo." },
        { status: 400 },
      );
    }

    const canonicalKey = `${keyArray[0]!.toLowerCase()}/${keyArray[1]!.toLowerCase()}`;

    await connectToDatabase();

    const repo = await PublicRepository.findOne({ canonicalKey });
    if (!repo) {
      return NextResponse.json({
        success: true,
        data: {
          canonicalKey,
          indexStatus: "not_indexed",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        canonicalKey,
        indexStatus: repo.indexStatus,
        error: repo.error || undefined,
        healthScore: repo.indexStatus === "indexed" ? repo.healthScore : undefined,
        indexedAt: repo.indexStatus === "indexed" ? repo.indexedAt : undefined,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/explorer/status/[...key]]", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
