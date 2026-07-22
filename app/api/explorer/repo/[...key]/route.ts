/**
 * GET /api/explorer/repo/[...key]
 *
 * Route handler to fetch cached public repository graph payload by canonical key (e.g. facebook/react).
 * Unauthenticated and authenticated accessible.
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
        { error: "Invalid repository key format. Expected owner/repo." },
        { status: 400 },
      );
    }

    const canonicalKey = `${keyArray[0]!.toLowerCase()}/${keyArray[1]!.toLowerCase()}`;

    await connectToDatabase();

    const cachedRepo = await PublicRepository.findOne({ canonicalKey });
    if (!cachedRepo) {
      return NextResponse.json(
        { error: `Repository ${canonicalKey} is not indexed yet.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      canonicalKey,
      graphPayload: cachedRepo.graphPayload,
      healthScore: cachedRepo.healthScore,
      repo: {
        name: cachedRepo.name,
        owner: cachedRepo.owner,
        url: cachedRepo.url,
        stars: cachedRepo.stars,
        language: cachedRepo.language,
        description: cachedRepo.description,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/explorer/repo/[...key]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
