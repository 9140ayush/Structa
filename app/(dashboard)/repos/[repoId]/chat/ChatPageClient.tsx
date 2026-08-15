/**
 * app/(dashboard)/repos/[repoId]/chat/ChatPageClient.tsx — Client wrapper for chat page.
 *
 * Separate client component so the parent page.tsx stays a Server Component.
 * On citation click, navigates to the 3D map with the node selected.
 */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";

interface ChatPageClientProps {
  repoId: string;
  repoName: string;
}

export function ChatPageClient({ repoId, repoName }: ChatPageClientProps) {
  const router = useRouter();

  const handleCitationClick = (modulePath: string) => {
    // Navigate to 3D map, passing the highlighted module path as a query param
    router.push(`/repos/${repoId}?highlight=${encodeURIComponent(modulePath)}`);
  };

  return <ChatPanel repoId={repoId} repoName={repoName} onCitationClick={handleCitationClick} />;
}
