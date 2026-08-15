/**
 * lib/github-search.ts — Service wrapping GitHub public search & metadata fetching.
 * Server-side only.
 */

import { Octokit } from "octokit";
import { z } from "zod";

export interface PublicSearchResult {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
  isPrivate: boolean;
  updatedAt: string;
  defaultBranch: string;
  canonicalKey: string;
}

const QuerySchema = z.string().min(1).max(100);

function createOctokit(token?: string): Octokit {
  // Use token if available, otherwise unauthenticated requests (60 req/hr rate limit)
  const tokenToUse = token || process.env.GITHUB_PAT;
  return new Octokit(tokenToUse ? { auth: tokenToUse } : undefined);
}

/**
 * Search public GitHub repositories by name or topic.
 */
export async function searchPublicRepositories(
  query: string,
  token?: string,
): Promise<PublicSearchResult[]> {
  const cleanQuery = QuerySchema.parse(query.trim());
  const octokit = createOctokit(token);

  try {
    const { data } = await octokit.rest.search.repos({
      q: `${cleanQuery} is:public`,
      per_page: 20,
      sort: "stars",
      order: "desc",
    });

    return (data.items || []).map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner?.login || "",
      url: repo.html_url,
      description: repo.description ?? null,
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
      isPrivate: repo.private ?? false,
      updatedAt: repo.updated_at ?? new Date().toISOString(),
      defaultBranch: (repo as { default_branch?: string }).default_branch ?? "main",
      canonicalKey: `${(repo.owner?.login || "").toLowerCase()}/${repo.name.toLowerCase()}`,
    }));
  } catch (err: unknown) {
    console.error("[searchPublicRepositories]", err);
    throw new Error("Failed to search GitHub repositories.");
  }
}

/**
 * Fetch metadata for a specific public GitHub repository.
 * Throws error if repository is private or does not exist.
 */
export async function getPublicRepoDetails(
  owner: string,
  repo: string,
  token?: string,
): Promise<PublicSearchResult> {
  const octokit = createOctokit(token);

  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    if (data.private) {
      throw new Error(
        `Repository ${owner}/${repo} is private. Explorer mode only supports public repositories.`,
      );
    }

    return {
      id: data.id.toString(),
      name: data.name,
      fullName: data.full_name,
      owner: data.owner.login,
      url: data.html_url,
      description: data.description ?? null,
      stars: data.stargazers_count ?? 0,
      language: data.language ?? null,
      isPrivate: data.private,
      updatedAt: data.updated_at ?? new Date().toISOString(),
      defaultBranch: data.default_branch,
      canonicalKey: `${owner.toLowerCase()}/${repo.toLowerCase()}`,
    };
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      throw new Error(`Repository ${owner}/${repo} was not found on GitHub or is private.`);
    }
    throw err;
  }
}
