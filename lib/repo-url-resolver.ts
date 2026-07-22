/**
 * lib/repo-url-resolver.ts — GitHub repository URL & shorthand resolver.
 *
 * Normalizes input string formats (full URL, github.com/owner/repo, owner/repo)
 * to a canonical key format ("owner/repo", lowercased).
 *
 * Server-side and Client-side usable. Pure string parsing logic.
 */

export interface ResolvedRepoKey {
  owner: string;
  repo: string;
  canonicalKey: string; // e.g. "facebook/react"
  fullUrl: string; // e.g. "https://github.com/facebook/react"
}

export function normalizeRepoUrl(input: string): ResolvedRepoKey | null {
  if (!input || typeof input !== "string") return null;

  let cleaned = input.trim();

  // Strip trailing slashes, .git suffix, and fragment/query parameters
  cleaned = cleaned.replace(/\.git$/, "");
  cleaned = cleaned.replace(/[?#].*$/, "");
  cleaned = cleaned.replace(/\/+$/, "");

  // Match full GitHub URL patterns (http/https)
  // e.g. https://github.com/facebook/react or https://github.com/facebook/react/tree/main
  const urlMatch = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/i);
  if (urlMatch && urlMatch[1] && urlMatch[2]) {
    const owner = urlMatch[1].trim();
    const repo = urlMatch[2].trim();
    if (isValidOwnerRepo(owner, repo)) {
      const canonicalKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
      return {
        owner,
        repo,
        canonicalKey,
        fullUrl: `https://github.com/${owner}/${repo}`,
      };
    }
  }

  // Match shorthand "owner/repo"
  // e.g. facebook/react or vercel/next.js
  const shorthandMatch = cleaned.match(/^([^\/]+)\/([^\/]+)$/);
  if (shorthandMatch && shorthandMatch[1] && shorthandMatch[2]) {
    const owner = shorthandMatch[1].trim();
    const repo = shorthandMatch[2].trim();
    if (isValidOwnerRepo(owner, repo)) {
      const canonicalKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
      return {
        owner,
        repo,
        canonicalKey,
        fullUrl: `https://github.com/${owner}/${repo}`,
      };
    }
  }

  return null;
}

function isValidOwnerRepo(owner: string, repo: string): boolean {
  if (!owner || !repo) return false;
  // Basic sanity check against invalid characters
  const validNameRegex = /^[a-zA-Z0-9_.-]+$/;
  return validNameRegex.test(owner) && validNameRegex.test(repo);
}
