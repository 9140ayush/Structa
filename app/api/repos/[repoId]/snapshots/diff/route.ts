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
import { Snapshot } from "@/models/Snapshot";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import mongoose from "mongoose";

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
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

    // Verify Repository access
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

    // Load both snapshots
    const fromSnapshot = await Snapshot.findOne({ repoId: repo._id, commitSha: fromSha });
    const toSnapshot = await Snapshot.findOne({ repoId: repo._id, commitSha: toSha });

    if (!fromSnapshot || !toSnapshot) {
      return NextResponse.json(
        { success: false, error: "One or both snapshots could not be found." },
        { status: 404 },
      );
    }

    // Compute diff dynamically to ensure correctness
    const diff = calculateSnapshotDiff(
      fromSnapshot.graphJson as GraphLike,
      toSnapshot.graphJson as GraphLike,
    );

    return NextResponse.json({
      success: true,
      data: {
        from: {
          commitSha: fromSnapshot.commitSha,
          createdAt: fromSnapshot.createdAt,
        },
        to: {
          commitSha: toSnapshot.commitSha,
          createdAt: toSnapshot.createdAt,
          graphJson: toSnapshot.graphJson, // Return the "to" graph so client can render nodes
        },
        diff,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/snapshots/diff]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate snapshot diff.",
      },
      { status: 500 },
    );
  }
}

interface GraphNodeLike {
  id: string;
  path: string;
  name: string;
  kind: string;
  x: number;
  y: number;
  z: number;
  loc: number;
  complexityScore: number;
}

interface GraphEdgeLike {
  id: string;
  from: string;
  to: string;
  fromPath: string;
  toPath: string;
}

interface GraphLike {
  nodes?: GraphNodeLike[];
  edges?: GraphEdgeLike[];
}

/**
 * Helper to compute diff between two graph snapshots
 */
function calculateSnapshotDiff(oldGraph: GraphLike, newGraph: GraphLike) {
  const oldNodes = new Map<string, GraphNodeLike>((oldGraph?.nodes || []).map((n) => [n.path, n]));
  const newNodes = new Map<string, GraphNodeLike>((newGraph?.nodes || []).map((n) => [n.path, n]));

  const addedNodes: string[] = [];
  const removedNodes: GraphNodeLike[] = [];
  const changedNodes: string[] = [];
  const unchangedNodes: string[] = [];

  for (const [path, node] of newNodes.entries()) {
    const oldNode = oldNodes.get(path);
    if (!oldNode) {
      addedNodes.push(path);
    } else {
      const hasChanged =
        oldNode.loc !== node.loc || oldNode.complexityScore !== node.complexityScore;
      if (hasChanged) {
        changedNodes.push(path);
      } else {
        unchangedNodes.push(path);
      }
    }
  }

  for (const path of oldNodes.keys()) {
    if (!newNodes.has(path)) {
      const oldNode = oldNodes.get(path);
      if (oldNode) {
        removedNodes.push({
          id: oldNode.id,
          path: oldNode.path,
          name: oldNode.name,
          kind: oldNode.kind,
          x: oldNode.x,
          y: oldNode.y,
          z: oldNode.z,
          loc: oldNode.loc,
          complexityScore: oldNode.complexityScore,
        });
      }
    }
  }

  const oldEdges = new Set((oldGraph?.edges || []).map((e) => `${e.fromPath}->${e.toPath}`));
  const newEdges = new Set((newGraph?.edges || []).map((e) => `${e.fromPath}->${e.toPath}`));

  const addedEdges: Array<{ fromPath: string; toPath: string }> = [];
  const removedEdges: GraphEdgeLike[] = [];

  for (const edge of newGraph?.edges || []) {
    const key = `${edge.fromPath}->${edge.toPath}`;
    if (!oldEdges.has(key)) {
      addedEdges.push({ fromPath: edge.fromPath, toPath: edge.toPath });
    }
  }

  for (const edge of oldGraph?.edges || []) {
    const key = `${edge.fromPath}->${edge.toPath}`;
    if (!newEdges.has(key)) {
      removedEdges.push({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        fromPath: edge.fromPath,
        toPath: edge.toPath,
      });
    }
  }

  return {
    addedNodes,
    removedNodes,
    changedNodes,
    unchangedNodes,
    addedEdges,
    removedEdges,
  };
}
