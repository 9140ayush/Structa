/**
 * GET /api/repos/[repoId]/graph
 *
 * Fetches the 3D dependency graph JSON for a repository:
 * 1. Validate auth and org membership via Clerk
 * 2. Validate repoId parameter using Zod
 * 3. Verify repository ownership in MongoDB
 * 4. Fetch all Module documents for the repository
 * 5. Compute server-side 3D force-directed layout (lib/layout.ts)
 * 6. Return typed GraphPayload (nodes, edges, LOD metadata, computedAt)
 *
 * Server-side only. Architecture.md §7 compliant.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Module } from "@/models/Module";
import { computeGraphLayout, type RawModuleInput } from "@/lib/layout";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import type { GraphPayload } from "@/types/graph";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Input Validation Schema
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    // 1. Auth check
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Validate route parameters
    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: parsedParams.error.issues[0]?.message ?? "Invalid params." },
        { status: 400 },
      );
    }

    const { repoId } = parsedParams.data;

    // 3. Database connection & repo authorization check
    await connectToDatabase();

    const dbOrg = await getOrCreateOrganization(orgId, userId);

    if (!mongoose.Types.ObjectId.isValid(repoId)) {
      return NextResponse.json({ error: "Invalid repository ID format." }, { status: 400 });
    }

    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repoId),
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 4. Fetch all Module documents for this repo
    const modules = await Module.find({ repoId: repo._id }).lean();

    if (!modules || modules.length === 0) {
      // If repo has not been synced yet, return empty graph payload
      const emptyPayload: GraphPayload = {
        nodes: [],
        edges: [],
        lod: {
          isLODActive: false,
          totalNodes: 0,
          totalEdges: 0,
          threshold: 500,
        },
        computedAt: new Date().toISOString(),
      };
      return NextResponse.json(emptyPayload);
    }

    // 5. Transform database modules to RawModuleInput format
    const rawInputs: RawModuleInput[] = modules.map((mod) => ({
      _id: (mod._id as mongoose.Types.ObjectId).toString(),
      path: mod.path,
      type: mod.type,
      loc: mod.loc ?? 0,
      complexityScore: mod.complexityScore ?? 0,
      imports: (mod.imports ?? []).map((id) => (id as mongoose.Types.ObjectId).toString()),
      importedBy: (mod.importedBy ?? []).map((id) => (id as mongoose.Types.ObjectId).toString()),
    }));

    // 6. Compute 3D Force-directed Layout
    const graphPayload = computeGraphLayout(rawInputs);

    // 7. Return JSON GraphPayload
    return NextResponse.json(graphPayload);
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/graph]", err);
    return NextResponse.json(
      { error: "Internal server error while generating graph." },
      { status: 500 },
    );
  }
}
