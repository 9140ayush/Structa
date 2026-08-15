/**
 * app/(dashboard)/repos/[repoId]/chat/page.tsx — Repo Chat Page.
 *
 * A dedicated full-page chat view for "Ask the Codebase".
 * Links back to the 3D map page for citation navigation.
 *
 * Architecture.md §6: app/(dashboard)/repos/[repoId]/chat/page.tsx
 */
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import { Repository } from "@/models/Repository";
import { getOrCreateOrganization } from "@/lib/auth-sync";
import mongoose from "mongoose";
import { ChatPageClient } from "./ChatPageClient";

interface ChatPageProps {
  params: Promise<{ repoId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { repoId } = await params;

  await connectToDatabase();

  const dbOrg = await getOrCreateOrganization(orgId, userId);

  const repo = await Repository.findOne({
    _id: new mongoose.Types.ObjectId(repoId),
    orgId: dbOrg._id,
  })
    .select("name url healthScore lastSyncedAt")
    .lean();

  if (!repo) {
    redirect("/dashboard");
  }

  const repoName = repo.name as string;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-surface shrink-0">
        <Link
          href={`/repos/${repoId}`}
          className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          3D Map
        </Link>

        <span className="text-border">·</span>

        <div className="flex items-center gap-2 font-mono text-sm">
          <Activity className="w-4 h-4 text-accent" />
          <span className="text-foreground font-medium">{repoName}</span>
          <span className="text-muted-foreground">/ Ask the Codebase</span>
        </div>
      </header>

      {/* Full-height chat panel */}
      <div className="flex-1 min-h-0">
        <ChatPageClient repoId={repoId} repoName={repoName} />
      </div>
    </div>
  );
}
