/**
 * GET /api/explorer/search?q=query
 *
 * Public repository search endpoint for Explorer Mode.
 * Unauthenticated and authenticated accessible.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchPublicRepositories } from "@/lib/github-search";

const QuerySchema = z.string().min(1, "Search query is required").max(100);

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const parsed = QuerySchema.safeParse(q);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid search query." },
        { status: 400 },
      );
    }

    const repos = await searchPublicRepositories(parsed.data);
    return NextResponse.json({ repos });
  } catch (err: unknown) {
    console.error("[GET /api/explorer/search]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to search public repositories." },
      { status: 500 },
    );
  }
}
