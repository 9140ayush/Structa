/**
 * GET /api/repos/[repoId]/snapshots
 *
 * Retrieves all architecture snapshots for a given Workspace repository.
 * Enforces Clerk authentication and workspace-level authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Snapshot } from "@/models/Snapshot";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import mongoose from "mongoose";

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    // 1. Auth check
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const rawParams = await context.params;
    const parsed = ParamsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid params." },
        { status: 400 },
      );
    }

    const { repoId } = parsed.data;

    await connectToDatabase();

    // 2. Validate repo access
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

    // 3. Query all snapshots for this repository
    const snapshots = await Snapshot.find({ repoId: repo._id })
      .sort({ createdAt: -1 })
      .select("commitSha createdAt diffFromPrevious")
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        snapshots,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/snapshots]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load snapshots.",
      },
      { status: 500 },
    );
  }
}
