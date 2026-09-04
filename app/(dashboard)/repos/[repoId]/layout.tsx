/**
 * app/(dashboard)/repos/[repoId]/layout.tsx
 *
 * Persistent navigation shell for the repository multi-section experience.
 * Wraps all /repos/[repoId]/* sub-pages with:
 *   1. A repo context bar (back button, repo name, repo health indicator)
 *   2. The horizontal section tab bar (Phase 11.1)
 *
 * Breaks out of the dashboard main's max-w-7xl padding with negative margins
 * so the graph sub-page can render full-viewport.
 *
 * Server Component — fetches minimal repo metadata for the context bar.
 */

import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import { RepoLayoutShell } from "@/components/shared/RepoLayoutShell";
import mongoose from "mongoose";

interface RepoLayoutProps {
  children: React.ReactNode;
  params: Promise<{ repoId: string }>;
}

export default async function RepoLayout({ children, params }: RepoLayoutProps) {
  const { repoId } = await params;

  // Auth check
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  let repoName = "Repository";
  let repoUrl = "#";
  let healthScore = 100;

  try {
    await connectToDatabase();
    if (mongoose.Types.ObjectId.isValid(repoId)) {
      const dbOrg = await getOrCreateOrganization(orgId, userId);
      const repo = await Repository.findOne({
        _id: new mongoose.Types.ObjectId(repoId),
        orgId: dbOrg._id,
      })
        .select("name url healthScore")
        .lean();

      if (repo) {
        repoName = repo.name;
        repoUrl = repo.url;
        healthScore = repo.healthScore ?? 100;
      }
    }
  } catch {
    // Non-fatal fallback
  }

  return (
    <RepoLayoutShell
      repoId={repoId}
      repoName={repoName}
      repoUrl={repoUrl}
      healthScore={healthScore}
    >
      {children}
    </RepoLayoutShell>
  );
}
