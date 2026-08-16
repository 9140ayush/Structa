/**
 * GET /api/repos/[repoId]/snapshots
 *
 * Retrieves all architecture snapshots for a given Workspace or Explorer repository.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { PublicRepository } from "@/models/PublicRepository";
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
    const { userId, orgId } = await auth();

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

    // 1. Check Workspace Repository
    let targetRepoId: mongoose.Types.ObjectId | null = null;
    let publicRepo = null;

    if (mongoose.Types.ObjectId.isValid(repoId) && userId) {
      const dbOrg = await getOrCreateOrganization(orgId, userId);
      const repo = await Repository.findOne({
        _id: new mongoose.Types.ObjectId(repoId),
        orgId: dbOrg._id,
      });
      if (repo) targetRepoId = repo._id as mongoose.Types.ObjectId;
    }

    if (!targetRepoId) {
      const canonicalKey = decodeURIComponent(repoId).replace(":", "/").toLowerCase();
      publicRepo = await PublicRepository.findOne({ canonicalKey });
      if (publicRepo) targetRepoId = publicRepo._id as mongoose.Types.ObjectId;
    }

    if (!targetRepoId) {
      return NextResponse.json(
        { success: false, error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 2. Query all snapshots for this repository
    const foundSnapshots = await Snapshot.find({ repoId: targetRepoId })
      .sort({ createdAt: -1 })
      .select("commitSha createdAt")
      .lean();

    let snapshotItems = foundSnapshots.map((s) => ({
      commitSha: s.commitSha,
      createdAt: s.createdAt,
    }));

    // If no snapshot exists yet for this public repository, auto-create initial snapshot
    if (snapshotItems.length === 0 && publicRepo?.graphPayload) {
      const initialSnap = await Snapshot.create({
        repoId: publicRepo._id,
        commitSha: publicRepo.lastCommitShaAtIndex || "main",
        graphJson: publicRepo.graphPayload,
      });
      snapshotItems = [
        {
          commitSha: initialSnap.commitSha,
          createdAt: initialSnap.createdAt,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        snapshots: snapshotItems.map((s) => ({
          commitSha: s.commitSha,
          createdAt: s.createdAt.toISOString(),
        })),
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/snapshots]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load architecture snapshots.",
      },
      { status: 500 },
    );
  }
}
