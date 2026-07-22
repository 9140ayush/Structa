/**
 * actions/repos.ts — Server Actions for repository operations.
 *
 * All mutations go through Server Actions (Rules.md §2).
 * All inputs are validated with Zod.
 * All role checks are server-side.
 */
"use server";

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const ConnectRepoSchema = z.object({
  githubRepoId: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString())
    .refine((val) => val.length > 0, "githubRepoId is required"),
  name: z.string().min(1, "Repository name is required"),
  url: z.string().url("Invalid repository URL"),
  isPrivate: z.boolean().optional().default(false),
});

const DeleteRepoSchema = z.object({
  repoId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Action: connectRepo
// ---------------------------------------------------------------------------

export async function connectRepo(
  input: z.infer<typeof ConnectRepoSchema>,
): Promise<{ success: boolean; repoId?: string; error?: string }> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const parsed = ConnectRepoSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid input." };
    }

    await connectToDatabase();

    const dbOrg = await getOrCreateOrganization(orgId, userId);

    const existing = await Repository.findOne({
      orgId: dbOrg._id,
      githubRepoId: parsed.data.githubRepoId,
    });
    if (existing) {
      return { success: false, error: "Repository already connected." };
    }

    const repo = await Repository.create({
      orgId: dbOrg._id,
      githubRepoId: parsed.data.githubRepoId,
      name: parsed.data.name,
      url: parsed.data.url,
      isPrivate: parsed.data.isPrivate,
      healthScore: 100,
    });

    return { success: true, repoId: repo._id.toString() };
  } catch (err: unknown) {
    console.error("[connectRepo]", err);
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// Action: deleteRepo
// ---------------------------------------------------------------------------

export async function deleteRepo(
  input: z.infer<typeof DeleteRepoSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const parsed = DeleteRepoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid repository ID." };
    }

    await connectToDatabase();

    const dbOrg = await getOrCreateOrganization(orgId, userId);

    const deleted = await Repository.findOneAndDelete({
      _id: parsed.data.repoId,
      orgId: dbOrg._id,
    });

    if (!deleted) {
      return { success: false, error: "Repository not found or access denied." };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteRepo]", err);
    return { success: false, error: "Internal server error." };
  }
}
