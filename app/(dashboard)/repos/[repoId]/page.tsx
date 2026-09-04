/**
 * app/(dashboard)/repos/[repoId]/page.tsx
 *
 * Phase 11.1: Redirects /repos/[repoId] → /repos/[repoId]/overview
 *
 * The repository experience now lives in sub-routes under this path.
 * All existing functionality is preserved in the dedicated section pages.
 */

import { redirect } from "next/navigation";

interface RepoIndexPageProps {
  params: Promise<{ repoId: string }>;
}

export default async function RepoIndexPage({ params }: RepoIndexPageProps) {
  const { repoId } = await params;
  redirect(`/repos/${repoId}/overview`);
}
