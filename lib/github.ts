/**
 * lib/github.ts — Octokit wrapper for GitHub content fetching.
 * Server-side only. Never import this from a Client Component.
 */
import { Octokit } from "octokit";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitTreeItem {
  path: string;
  type: "blob" | "tree"; // blob = file, tree = folder
  size?: number;
  sha: string;
}

export interface GitTreeResult {
  tree: GitTreeItem[];
  truncated: boolean;
}

export interface FileContent {
  path: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Validation schemas (all external API responses go through Zod)
// ---------------------------------------------------------------------------

const RepoParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
});

const FilePathSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  branch: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

/**
 * Resolve the default branch for a repository.
 */
async function getDefaultBranch(octokit: Octokit, owner: string, repo: string): Promise<string> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data.default_branch;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the full recursive file tree for a repository.
 * Uses git trees API for efficiency — single request for the entire tree.
 *
 * @param token   GitHub OAuth access token
 * @param owner   Repository owner (user or org)
 * @param repo    Repository name
 * @param branch  Branch name — defaults to the repo's default branch
 */
export async function getRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch?: string,
): Promise<GitTreeResult> {
  const params = RepoParamsSchema.parse({ owner, repo, branch });
  const octokit = createOctokit(token);

  try {
    const targetBranch =
      params.branch ?? (await getDefaultBranch(octokit, params.owner, params.repo));

    // First, get the branch ref to obtain the tree SHA
    const { data: refData } = await octokit.rest.git.getRef({
      owner: params.owner,
      repo: params.repo,
      ref: `heads/${targetBranch}`,
    });

    const commitSha = refData.object.sha;

    // Get the commit to obtain the root tree SHA
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner: params.owner,
      repo: params.repo,
      commit_sha: commitSha,
    });

    const treeSha = commitData.tree.sha;

    // Fetch the full recursive tree
    const { data: treeData } = await octokit.rest.git.getTree({
      owner: params.owner,
      repo: params.repo,
      tree_sha: treeSha,
      recursive: "1",
    });

    const items: GitTreeItem[] = (treeData.tree ?? [])
      .filter((item) => item.path && (item.type === "blob" || item.type === "tree"))
      .map((item) => ({
        path: item.path as string,
        type: item.type as "blob" | "tree",
        size: item.size,
        sha: item.sha as string,
      }));

    return {
      tree: items,
      truncated: treeData.truncated ?? false,
    };
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404 || status === 403) {
      throw new Error(
        `Could not access repository ${owner}/${repo}. If this is a private repository, please reconnect GitHub with private repo ("repo") access scopes.`,
      );
    }
    throw err;
  }
}

/**
 * Download the raw text content of a single file in a repository.
 *
 * @param token   GitHub OAuth access token
 * @param owner   Repository owner
 * @param repo    Repository name
 * @param path    File path relative to repo root (e.g. "src/index.ts")
 * @param branch  Branch name — defaults to the repo's default branch
 */
export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string,
): Promise<FileContent> {
  const params = FilePathSchema.parse({ owner, repo, path, branch });
  const octokit = createOctokit(token);

  const ref = params.branch ?? (await getDefaultBranch(octokit, params.owner, params.repo));

  const { data } = await octokit.rest.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref,
  });

  // getContent returns an object or array; we only handle single file (object with encoding)
  if (Array.isArray(data)) {
    throw new Error(`Path "${params.path}" is a directory, not a file.`);
  }

  if (!("content" in data) || !("encoding" in data)) {
    throw new Error(`Unexpected response shape for path "${params.path}".`);
  }

  const fileData = data as { content: string; encoding: string };

  if (fileData.encoding !== "base64") {
    throw new Error(`Unexpected encoding "${fileData.encoding}" for path "${params.path}".`);
  }

  // Decode base64 content (GitHub wraps lines at 60 chars with \n)
  const decoded = Buffer.from(fileData.content.replace(/\n/g, ""), "base64").toString("utf-8");

  return { path: params.path, content: decoded };
}

/**
 * Fetch the contents of multiple files in parallel, skipping files that error.
 * Returns only the files successfully fetched.
 *
 * @param token   GitHub OAuth access token
 * @param owner   Repository owner
 * @param repo    Repository name
 * @param paths   Array of file paths to fetch
 * @param branch  Branch name — optional
 */
export async function getBatchFileContents(
  token: string,
  owner: string,
  repo: string,
  paths: string[],
  branch?: string,
): Promise<FileContent[]> {
  const CONCURRENCY = 10;
  const results: FileContent[] = [];

  // Process in chunks to avoid rate-limit spikes
  for (let i = 0; i < paths.length; i += CONCURRENCY) {
    const chunk = paths.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((p) => getFileContent(token, owner, repo, p, branch)),
    );

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.warn("[github] Failed to fetch file:", result.reason);
      }
    }
  }

  return results;
}
