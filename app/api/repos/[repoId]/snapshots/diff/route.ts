/**
 * GET /api/repos/[repoId]/snapshots/diff
 *
 * Compares two snapshots of a repository and returns the visual diff payload.
 * Query params: ?from=[commitSha]&to=[commitSha]
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
import type { GraphPayload, GraphNode, GraphEdge } from "@/types/graph";

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

export async function GET(
  req: NextRequest,
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

    const { searchParams } = new URL(req.url);
    const fromSha = searchParams.get("from");
    const toSha = searchParams.get("to");

    if (!fromSha || !toSha) {
      return NextResponse.json(
        { success: false, error: "from and to commit SHAs are required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 1. Verify Repository access
    let targetRepoId: mongoose.Types.ObjectId | null = null;

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
      const publicRepo = await PublicRepository.findOne({ canonicalKey });
      if (publicRepo) targetRepoId = publicRepo._id as mongoose.Types.ObjectId;
    }

    if (!targetRepoId) {
      return NextResponse.json(
        { success: false, error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 2. Query both snapshots
    const [fromSnapshot, toSnapshot] = await Promise.all([
      Snapshot.findOne({ repoId: targetRepoId, commitSha: fromSha }),
      Snapshot.findOne({ repoId: targetRepoId, commitSha: toSha }),
    ]);

    if (!fromSnapshot || !toSnapshot) {
      return NextResponse.json(
        { success: false, error: "One or both requested snapshots were not found." },
        { status: 404 },
      );
    }

    const fromGraph = fromSnapshot.graphJson as GraphPayload;
    const toGraph = toSnapshot.graphJson as GraphPayload;

    const fromNodePaths = new Map(fromGraph.nodes.map((n) => [n.path, n]));
    const toNodePaths = new Map(toGraph.nodes.map((n) => [n.path, n]));

    const addedNodes: string[] = [];
    const removedNodes: GraphNode[] = [];
    const changedNodes: string[] = [];
    const unchangedNodes: string[] = [];

    toGraph.nodes.forEach((node) => {
      const prev = fromNodePaths.get(node.path);
      if (!prev) {
        addedNodes.push(node.id);
      } else if (prev.loc !== node.loc || prev.complexityScore !== node.complexityScore) {
        changedNodes.push(node.id);
      } else {
        unchangedNodes.push(node.id);
      }
    });

    fromGraph.nodes.forEach((node) => {
      if (!toNodePaths.has(node.path)) {
        removedNodes.push(node);
      }
    });

    const fromEdges = new Set(fromGraph.edges.map((e) => `${e.fromPath}->${e.toPath}`));
    const toEdges = new Set(toGraph.edges.map((e) => `${e.fromPath}->${e.toPath}`));

    const addedEdges: Array<{ fromPath: string; toPath: string }> = [];
    const removedEdges: GraphEdge[] = [];

    toGraph.edges.forEach((e) => {
      if (!fromEdges.has(`${e.fromPath}->${e.toPath}`)) {
        addedEdges.push({ fromPath: e.fromPath, toPath: e.toPath });
      }
    });

    fromGraph.edges.forEach((e) => {
      if (!toEdges.has(`${e.fromPath}->${e.toPath}`)) {
        removedEdges.push(e);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        diff: {
          addedNodes,
          removedNodes,
          changedNodes,
          unchangedNodes,
          addedEdges,
          removedEdges,
        },
        toGraph,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/snapshots/diff]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to compute snapshot diff.",
      },
      { status: 500 },
    );
  }
}
