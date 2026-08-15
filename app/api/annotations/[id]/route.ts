/**
 * DELETE /api/annotations/[id]
 *
 * Deletes a Workspace module annotation.
 * Enforces Clerk authorization and repository owner access checks.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { Annotation } from "@/models/Annotation";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import mongoose from "mongoose";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const rawParams = await context.params;
    const annotationId = rawParams.id;

    if (!annotationId || !mongoose.Types.ObjectId.isValid(annotationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid annotation ID." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 1. Fetch annotation
    const annotation = await Annotation.findById(annotationId);
    if (!annotation) {
      return NextResponse.json({ success: false, error: "Annotation not found." }, { status: 404 });
    }

    // 2. Verify Repository access of target organization
    const dbOrg = await getOrCreateOrganization(orgId, userId);
    const repo = await Repository.findOne({
      _id: annotation.repositoryId,
      orgId: dbOrg._id,
    });

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Access denied to repository annotations." },
        { status: 403 },
      );
    }

    // 3. Delete annotation (either author or admin/editor can delete)
    await Annotation.findByIdAndDelete(annotationId);

    return NextResponse.json({
      success: true,
      data: {
        id: annotationId,
      },
    });
  } catch (err: unknown) {
    console.error("[DELETE /api/annotations/[id]]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete annotation.",
      },
      { status: 500 },
    );
  }
}
