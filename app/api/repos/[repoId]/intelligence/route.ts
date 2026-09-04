/**
 * GET /api/repos/[repoId]/intelligence
 *
 * Returns a computed repository intelligence payload assembled from
 * existing Module and Repository documents — no new parsing, no new AI calls.
 *
 * Used as the shared data contract for all Phase 11 sections:
 * Overview, Architecture, Files, Tech Stack, Flows, Dependencies, Health.
 *
 * Security: Auth + org-membership enforced (same pattern as /graph route).
 * Never fabricates metrics. Returns only what the DB actually contains.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Module } from "@/models/Module";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  repoId: z.string().min(1, "repoId is required"),
});

import { detectTechStack, detectCycles } from "@/lib/intelligence";

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ repoId: string }> },
): Promise<NextResponse> {
  try {
    // 1. Auth
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Validate params
    const rawParams = await context.params;
    const parsedParams = ParamsSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: parsedParams.error.issues[0]?.message ?? "Invalid params." },
        { status: 400 },
      );
    }
    const { repoId } = parsedParams.data;

    // 3. DB + org membership check
    await connectToDatabase();
    const dbOrg = await getOrCreateOrganization(orgId, userId);

    if (!mongoose.Types.ObjectId.isValid(repoId)) {
      return NextResponse.json({ error: "Invalid repository ID format." }, { status: 400 });
    }

    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repoId),
      orgId: dbOrg._id,
    }).lean();

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 4. Fetch all modules
    const modules = await Module.find({ repoId: repo._id }).lean();

    if (!modules || modules.length === 0) {
      return NextResponse.json({
        repoId,
        repoName: repo.name,
        repoUrl: repo.url,
        isPrivate: repo.isPrivate,
        healthScore: repo.healthScore ?? 100,
        lastSyncedAt: repo.lastSyncedAt?.toISOString() ?? null,
        moduleCount: 0,
        fileCount: 0,
        folderCount: 0,
        totalLOC: 0,
        edgeCount: 0,
        avgComplexity: 0,
        topComplexFiles: [],
        topImportedModules: [],
        topImporterModules: [],
        isolatedModules: [],
        circularDependencies: { count: 0, examples: [] },
        detectedTech: [],
        fileTree: [],
        computedAt: new Date().toISOString(),
      });
    }

    // 5. Compute stats
    const fileModules = modules.filter((m) => m.type === "file");
    const folderModules = modules.filter((m) => m.type === "folder");

    const totalLOC = fileModules.reduce((s, m) => s + (m.loc ?? 0), 0);
    const avgComplexity =
      fileModules.length > 0
        ? fileModules.reduce((s, m) => s + (m.complexityScore ?? 0), 0) / fileModules.length
        : 0;

    // Count total edges
    const edgeCount = fileModules.reduce((s, m) => s + (m.imports?.length ?? 0), 0);

    // Top complex files (top 12)
    const topComplexFiles = [...fileModules]
      .sort((a, b) => (b.complexityScore ?? 0) - (a.complexityScore ?? 0))
      .slice(0, 12)
      .map((m) => ({
        id: (m._id as mongoose.Types.ObjectId).toString(),
        path: m.path,
        name: m.path.split("/").pop() ?? m.path,
        complexityScore: m.complexityScore ?? 0,
        loc: m.loc ?? 0,
        summary: m.summary ?? "",
        summaryStatus: m.summaryStatus ?? "pending",
      }));

    // Top imported modules (most depended-on)
    const topImportedModules = [...fileModules]
      .sort((a, b) => (b.importedBy?.length ?? 0) - (a.importedBy?.length ?? 0))
      .slice(0, 12)
      .map((m) => ({
        id: (m._id as mongoose.Types.ObjectId).toString(),
        path: m.path,
        name: m.path.split("/").pop() ?? m.path,
        importedByCount: m.importedBy?.length ?? 0,
        importsCount: m.imports?.length ?? 0,
      }));

    // Top importer modules (most outgoing deps)
    const topImporterModules = [...fileModules]
      .sort((a, b) => (b.imports?.length ?? 0) - (a.imports?.length ?? 0))
      .slice(0, 12)
      .map((m) => ({
        id: (m._id as mongoose.Types.ObjectId).toString(),
        path: m.path,
        name: m.path.split("/").pop() ?? m.path,
        importsCount: m.imports?.length ?? 0,
        importedByCount: m.importedBy?.length ?? 0,
      }));

    // Isolated modules (no imports AND no importedBy)
    const isolatedModules = fileModules
      .filter((m) => (m.imports?.length ?? 0) === 0 && (m.importedBy?.length ?? 0) === 0)
      .slice(0, 20)
      .map((m) => ({
        id: (m._id as mongoose.Types.ObjectId).toString(),
        path: m.path,
        name: m.path.split("/").pop() ?? m.path,
        loc: m.loc ?? 0,
      }));

    // Cycle detection — build adjacency list of IDs
    const adjList = new Map<string, string[]>();
    for (const mod of fileModules) {
      const id = (mod._id as mongoose.Types.ObjectId).toString();
      adjList.set(
        id,
        (mod.imports ?? []).map((imp) => (imp as mongoose.Types.ObjectId).toString()),
      );
    }
    const circularDependencies = detectCycles(
      fileModules.map((m) => (m._id as mongoose.Types.ObjectId).toString()),
      adjList,
    );

    // Tech stack detection
    const allPaths = modules.map((m) => m.path);
    const detectedTech = detectTechStack(allPaths);

    // Full file tree (for Files section)
    const fileTree = modules.map((m) => ({
      id: (m._id as mongoose.Types.ObjectId).toString(),
      path: m.path,
      name: m.path.split("/").pop() ?? m.path,
      type: m.type as "file" | "folder",
      loc: m.loc ?? 0,
      complexityScore: m.complexityScore ?? 0,
      importsCount: m.imports?.length ?? 0,
      importedByCount: m.importedBy?.length ?? 0,
      summary: m.summary ?? "",
      summaryStatus: m.summaryStatus ?? "pending",
    }));

    return NextResponse.json({
      repoId,
      repoName: repo.name,
      repoUrl: repo.url,
      isPrivate: repo.isPrivate,
      healthScore: repo.healthScore ?? 100,
      lastSyncedAt: repo.lastSyncedAt?.toISOString() ?? null,
      moduleCount: modules.length,
      fileCount: fileModules.length,
      folderCount: folderModules.length,
      totalLOC,
      edgeCount,
      avgComplexity: parseFloat(avgComplexity.toFixed(2)),
      topComplexFiles,
      topImportedModules,
      topImporterModules,
      isolatedModules,
      circularDependencies,
      detectedTech,
      fileTree,
      computedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[GET /api/repos/[repoId]/intelligence]", err);
    return NextResponse.json(
      { error: "Internal server error while computing repository intelligence." },
      { status: 500 },
    );
  }
}
