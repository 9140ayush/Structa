/**
 * app/(dashboard)/repos/[repoId]/chat/page.tsx
 *
 * Redirects legacy /chat path to the new Phase 11.14 Repository Copilot section.
 */
import { redirect } from "next/navigation";

interface ChatPageProps {
  params: Promise<{ repoId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { repoId } = await params;
  redirect(`/repos/${repoId}/copilot`);
}
