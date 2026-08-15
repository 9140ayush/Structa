/**
 * POST /api/annotations
 *
 * Creates a sticky-note annotation for a module in a Workspace repository.
 * Requires authentication and repository access authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Module } from "@/models/Module";
import { Annotation } from "@/models/Annotation";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import mongoose from "mongoose";

const AnnotationCreateSchema = z.object({
  repositoryId: z.string().min(1, "repositoryId is required"),
  moduleId: z.string().min(1, "moduleId is required"),
  content: z
    .string()
    .min(1, "Annotation content cannot be empty")
    .max(1000, "Content cannot exceed 1000 characters"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = AnnotationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const { repositoryId, moduleId, content } = parsed.data;

    await connectToDatabase();

    // 1. Verify Repository access
    const dbOrg = await getOrCreateOrganization(orgId, userId);
    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repositoryId),
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    // 2. Verify Module belongs to the repository
    const targetModule = await Module.findOne({
      _id: new mongoose.Types.ObjectId(moduleId),
      repoId: repo._id,
    });

    if (!targetModule) {
      return NextResponse.json(
        { success: false, error: "Module not found in this repository." },
        { status: 404 },
      );
    }

    // 3. Create annotation
    const annotation = await Annotation.create({
      repositoryId: repo._id,
      moduleId: targetModule._id,
      authorId: userId,
      content,
    });

    return NextResponse.json({
      success: true,
      data: annotation,
    });
  } catch (err: unknown) {
    console.error("[POST /api/annotations]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create annotation.",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/annotations
 *
 * Retrieves all annotations for a repository or module.
 * Query parameters: ?repositoryId=...&moduleId=...
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repositoryId = searchParams.get("repositoryId");
    const moduleId = searchParams.get("moduleId");

    if (!repositoryId) {
      return NextResponse.json(
        { success: false, error: "repositoryId query parameter is required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Verify Repository access
    const dbOrg = await getOrCreateOrganization(orgId, userId);
    const repo = await Repository.findOne({
      _id: new mongoose.Types.ObjectId(repositoryId),
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Repository not found or access denied." },
        { status: 404 },
      );
    }

    const query: Record<string, unknown> = { repositoryId: repo._id };
    if (moduleId) {
      query.moduleId = new mongoose.Types.ObjectId(moduleId);
    }

    const annotations = await Annotation.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        annotations,
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/annotations]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve annotations.",
      },
      { status: 500 },
    );
  }
}
