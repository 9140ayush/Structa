/**
 * lib/explorer-indexer.ts — Background worker for public repository indexing.
 *
 * Runs server-side. Coordinates tree fetching, codebase parsing, graph generation,
 * and AI summarization per-module, then updates the shared cache.
 */
import { getPublicRepoDetails } from "@/lib/github-search";
import { getRepoTree, getBatchFileContents } from "@/lib/github";
import { parseRepository, computeHealthScore } from "@/lib/parser";
import { computeGraphLayout, type RawModuleInput } from "@/lib/layout";
import {
  summarizeModuleBatch,
  type SummarizeModuleInput,
  type SummarizeModuleResult,
} from "@/lib/ai/summarize";
import { PublicRepository } from "@/models/PublicRepository";
import { connectToDatabase } from "@/lib/mongodb";

export async function runBackgroundIndexing(
  canonicalKey: string,
  owner: string,
  repo: string,
  defaultBranch: string,
  targetCommitSha: string,
): Promise<void> {
  const token = process.env.GITHUB_PAT || "";
  try {
    console.log(
      `[worker] Starting background indexing for ${canonicalKey} at commit ${targetCommitSha}...`,
    );

    await connectToDatabase();

    // 1. Double check public status from GitHub first
    const repoDetails = await getPublicRepoDetails(owner, repo, token);
    if (repoDetails.isPrivate) {
      throw new Error("Repository is private. Private repositories are not cached.");
    }

    // 2. Fetch recursive tree
    const treeResult = await getRepoTree(token, owner, repo, defaultBranch);
    const blobItems = treeResult.tree.filter((item) => item.type === "blob");

    // Filter JS/TS files (limit to 400 for cost/performance)
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

    // Map parsed modules & edges to RawModuleInput format
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

    // 3. AI Summarization (reusing summarizeModuleBatch as a black box)
    const fileModules = parseResult.modules.filter((m) => m.type === "file");
    const summarizeInputs: SummarizeModuleInput[] = fileModules.map((mod) => {
      const importedByCount = parseResult.edges.filter((edge) => edge.to === mod.path).length;
      return {
        path: mod.path,
        type: mod.type,
        content: contentMap.get(mod.path) ?? "",
        loc: mod.loc,
        complexityScore: mod.complexityScore,
        importsCount: mod.imports.length,
        importedByCount,
      };
    });

    let aiResults = new Map<string, SummarizeModuleResult>();
    const moduleSummaries: Record<string, string> = {};

    if (summarizeInputs.length > 0) {
      // Run batch summarization (concurrency limit 3 to control latency & costs)
      const batchResult = await summarizeModuleBatch(summarizeInputs, 3);
      aiResults = batchResult.results;

      for (const [path, res] of batchResult.results.entries()) {
        if (res.status === "done" && res.summary) {
          moduleSummaries[path] = res.summary;
        }
      }
    }

    // Map AI summaries back onto graphPayload nodes
    graphPayload.nodes = graphPayload.nodes.map((node) => {
      if (node.kind === "file") {
        const aiRes = aiResults.get(node.path);
        return {
          ...node,
          summary: aiRes?.summary ?? "",
          summaryStatus: (aiRes?.status ?? "failed") as import("@/models/Module").SummaryStatus,
        };
      }
      return {
        ...node,
        summary: "",
        summaryStatus: "skipped" as const,
      };
    });

    // 4. Update the document cache with fully-indexed details
    await PublicRepository.updateOne(
      { canonicalKey },
      {
        $set: {
          name: repoDetails.name,
          url: repoDetails.url,
          description: repoDetails.description ?? "",
          stars: repoDetails.stars,
          language: repoDetails.language ?? "",
          healthScore,
          graphPayload,
          moduleSummaries,
          moduleCount: modules.length,
          lastCommitShaAtIndex: targetCommitSha,
          indexStatus: "indexed",
          error: "",
          indexedAt: new Date(),
        },
      },
    );

    console.log(`[worker] Successfully indexed ${canonicalKey} at commit ${targetCommitSha}.`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[worker] Background indexing failed for ${canonicalKey}:`, errorMsg);

    // Save failure status and message back to DB
    await PublicRepository.updateOne(
      { canonicalKey },
      {
        $set: {
          indexStatus: "failed",
          error: errorMsg,
        },
      },
    );
  }
}
