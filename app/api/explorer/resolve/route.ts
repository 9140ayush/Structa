/**
 * POST /api/explorer/resolve
 *
 * Explorer repository resolver and indexer endpoint.
 * Converges both Explorer Search & Explorer URL Paste into a single pipeline.
 * Serves cached graph payloads immediately if available, or indexes the public
 * repository synchronously on cache miss.
 *
 * Accessible to all users (signed-in or anonymous).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeRepoUrl } from "@/lib/repo-url-resolver";
import { getPublicRepoDetails } from "@/lib/github-search";
import { getRepoTree, getBatchFileContents } from "@/lib/github";
import { parseRepository, computeHealthScore } from "@/lib/parser";
import { computeGraphLayout, type RawModuleInput } from "@/lib/layout";
import { PublicRepository } from "@/models/PublicRepository";

const ResolveBodySchema = z.object({
  urlOrShorthand: z.string().min(1, "URL or repository shorthand is required"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = ResolveBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 },
      );
    }

    const resolvedKey = normalizeRepoUrl(parsed.data.urlOrShorthand);
    if (!resolvedKey) {
      return NextResponse.json(
        {
          error:
            "Invalid repository format. Please enter a valid GitHub URL (https://github.com/owner/repo) or shorthand (owner/repo).",
        },
        { status: 400 },
      );
    }

    const { owner, repo, canonicalKey } = resolvedKey;

    await connectToDatabase();

    // 1. Check shared PublicRepository cache
    const existingCache = await PublicRepository.findOne({ canonicalKey });
    if (existingCache) {
      return NextResponse.json({
        cached: true,
        canonicalKey,
        graphPayload: existingCache.graphPayload,
        healthScore: existingCache.healthScore,
        repo: {
          name: existingCache.name,
          owner: existingCache.owner,
          url: existingCache.url,
          stars: existingCache.stars,
          language: existingCache.language,
          description: existingCache.description,
        },
      });
    }

    // 2. Cache miss — Validate public repository accessibility via GitHub API
    const token = process.env.GITHUB_PAT || "";
    let repoDetails;
    try {
      repoDetails = await getPublicRepoDetails(owner, repo, token);
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error:
            (err as Error).message || `Repository ${owner}/${repo} is private or does not exist.`,
        },
        { status: 400 },
      );
    }

    // 3. Synchronous Indexing: Fetch recursive tree
    const treeResult = await getRepoTree(token, owner, repo);
    const blobItems = treeResult.tree.filter((item) => item.type === "blob");

    // Filter JS/TS source files (max 400 files for fast first index)
    const validExtensions = /\.(js|jsx|ts|tsx|mjs|cjs)$/i;
    const sourcePaths = blobItems
      .map((item) => item.path)
      .filter((p) => validExtensions.test(p))
      .slice(0, 400);

    // Download batch file contents
    const fetchedFiles = await getBatchFileContents(token, owner, repo, sourcePaths);

    // Parse repository structure & import graph
    const contentMap = new Map<string, string>(fetchedFiles.map((f) => [f.path, f.content]));
    const parseResult = parseRepository(treeResult.tree, contentMap);
    const healthScore = computeHealthScore(parseResult);
    const modules = parseResult.modules;

    // Map parsed modules & edges to RawModuleInput format for force-directed layout computation
    const moduleMap = new Map<string, RawModuleInput>();
    const pathToIdMap = new Map<string, string>();

    parseResult.modules.forEach((m, index) => {
      const id = `mod_${index}_${m.path.replace(/[^a-zA-Z0-9]/g, "_")}`;
      pathToIdMap.set(m.path, id);
      moduleMap.set(m.path, {
        _id: id,
        path: m.path,
        type: m.type,
        loc: m.loc ?? 0,
        complexityScore: m.complexityScore ?? 0,
        imports: [],
        importedBy: [],
      });
    });

    for (const edge of parseResult.edges) {
      const fromId = pathToIdMap.get(edge.from);
      const toId = pathToIdMap.get(edge.to);
      if (fromId && toId) {
        const fromMod = moduleMap.get(edge.from);
        const toMod = moduleMap.get(edge.to);
        if (fromMod && !fromMod.imports.includes(toId)) {
          fromMod.imports.push(toId);
        }
        if (toMod && !toMod.importedBy.includes(fromId)) {
          toMod.importedBy.push(fromId);
        }
      }
    }

    const rawInputs = Array.from(moduleMap.values());

    // Compute 3D Force-Directed Layout
    const graphPayload = computeGraphLayout(rawInputs);

    // 4. Save to PublicRepository cache
    const publicRepo = await PublicRepository.create({
      canonicalKey,
      owner,
      repo,
      name: repoDetails.name,
      url: repoDetails.url,
      description: repoDetails.description ?? "",
      stars: repoDetails.stars,
      language: repoDetails.language ?? "",
      healthScore,
      graphPayload,
      moduleCount: modules.length,
      indexedAt: new Date(),
    });

    return NextResponse.json({
      cached: false,
      canonicalKey,
      graphPayload,
      healthScore,
      repo: {
        name: publicRepo.name,
        owner: publicRepo.owner,
        url: publicRepo.url,
        stars: publicRepo.stars,
        language: publicRepo.language,
        description: publicRepo.description,
      },
    });
  } catch (err: unknown) {
    console.error("[POST /api/explorer/resolve]", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to resolve and index repository." },
      { status: 500 },
    );
  }
}
