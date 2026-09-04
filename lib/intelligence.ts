/**
 * lib/intelligence.ts
 *
 * Shared algorithmic utilities for repository intelligence:
 *   - Heuristic path-based tech stack detection
 *   - Depth-first search (DFS) circular dependency detection
 *   - Deterministic health & complexity scoring
 */

export interface TechEntry {
  name: string;
  category: string;
  evidence: string;
  confidence: "high" | "medium";
}

export interface TechSignature {
  pattern: RegExp;
  name: string;
  category: string;
  confidence: "high" | "medium";
}

export const TECH_SIGNATURES: TechSignature[] = [
  // Runtimes & Languages
  { pattern: /package\.json$/i, name: "Node.js", category: "Runtime", confidence: "high" },
  { pattern: /\.(ts|tsx)$/, name: "TypeScript", category: "Language", confidence: "high" },
  { pattern: /\.(jsx?)$/, name: "JavaScript", category: "Language", confidence: "medium" },
  { pattern: /\.(py)$/, name: "Python", category: "Language", confidence: "high" },
  { pattern: /\.(go)$/, name: "Go", category: "Language", confidence: "high" },
  { pattern: /\.(rs)$/, name: "Rust", category: "Language", confidence: "high" },
  { pattern: /\.(java)$/, name: "Java", category: "Language", confidence: "high" },

  // Frameworks
  {
    pattern: /next\.config\.(ts|js|mjs)$/i,
    name: "Next.js",
    category: "Framework",
    confidence: "high",
  },
  { pattern: /vite\.config/i, name: "Vite", category: "Build Tool", confidence: "high" },
  { pattern: /remix\.config/i, name: "Remix", category: "Framework", confidence: "high" },
  { pattern: /nuxt\.config/i, name: "Nuxt.js", category: "Framework", confidence: "high" },
  { pattern: /angular\.json$/i, name: "Angular", category: "Framework", confidence: "high" },
  { pattern: /svelte\.config/i, name: "Svelte", category: "Framework", confidence: "high" },
  { pattern: /astro\.config/i, name: "Astro", category: "Framework", confidence: "high" },
  { pattern: /express/i, name: "Express", category: "Backend Framework", confidence: "medium" },
  {
    pattern: /fastapi|flask|django/i,
    name: "Python Web Framework",
    category: "Backend Framework",
    confidence: "medium",
  },

  // UI & Styling
  { pattern: /tailwind\.config/i, name: "Tailwind CSS", category: "Styling", confidence: "high" },
  { pattern: /\.module\.css$/i, name: "CSS Modules", category: "Styling", confidence: "high" },
  {
    pattern: /styled-components/i,
    name: "Styled Components",
    category: "Styling",
    confidence: "medium",
  },

  // Databases & ORMs
  { pattern: /prisma\//i, name: "Prisma", category: "Database ORM", confidence: "high" },
  { pattern: /mongoose|mongodb/i, name: "MongoDB", category: "Database", confidence: "medium" },
  { pattern: /drizzle/i, name: "Drizzle ORM", category: "Database ORM", confidence: "high" },
  { pattern: /supabase/i, name: "Supabase", category: "Database", confidence: "medium" },
  { pattern: /redis/i, name: "Redis", category: "Cache", confidence: "medium" },

  // Auth
  { pattern: /clerk/i, name: "Clerk", category: "Authentication", confidence: "medium" },
  { pattern: /next-auth/i, name: "NextAuth", category: "Authentication", confidence: "medium" },
  { pattern: /auth0/i, name: "Auth0", category: "Authentication", confidence: "medium" },
  {
    pattern: /supabase.*auth/i,
    name: "Supabase Auth",
    category: "Authentication",
    confidence: "medium",
  },

  // AI
  { pattern: /openai/i, name: "OpenAI", category: "AI", confidence: "medium" },
  { pattern: /anthropic/i, name: "Anthropic Claude", category: "AI", confidence: "medium" },
  { pattern: /langchain/i, name: "LangChain", category: "AI", confidence: "medium" },
  { pattern: /huggingface/i, name: "Hugging Face", category: "AI", confidence: "medium" },

  // Testing
  { pattern: /jest\.config/i, name: "Jest", category: "Testing", confidence: "high" },
  { pattern: /vitest\.config/i, name: "Vitest", category: "Testing", confidence: "high" },
  { pattern: /cypress/i, name: "Cypress", category: "Testing (E2E)", confidence: "high" },
  { pattern: /playwright/i, name: "Playwright", category: "Testing (E2E)", confidence: "high" },
  {
    pattern: /\.test\.(ts|js|tsx|jsx)$/,
    name: "Unit Tests",
    category: "Testing",
    confidence: "medium",
  },
  {
    pattern: /\.spec\.(ts|js|tsx|jsx)$/,
    name: "Unit Tests",
    category: "Testing",
    confidence: "medium",
  },

  // DevOps
  { pattern: /dockerfile/i, name: "Docker", category: "DevOps", confidence: "high" },
  { pattern: /docker-compose/i, name: "Docker Compose", category: "DevOps", confidence: "high" },
  {
    pattern: /\.github\/workflows/i,
    name: "GitHub Actions",
    category: "CI/CD",
    confidence: "high",
  },
  { pattern: /vercel\.json$/i, name: "Vercel", category: "Deployment", confidence: "high" },

  // State Management
  { pattern: /redux/i, name: "Redux", category: "State Management", confidence: "medium" },
  { pattern: /zustand/i, name: "Zustand", category: "State Management", confidence: "medium" },
  { pattern: /jotai/i, name: "Jotai", category: "State Management", confidence: "medium" },
  { pattern: /recoil/i, name: "Recoil", category: "State Management", confidence: "medium" },
];

/**
 * Detects technology stack by matching repository file paths against known signatures.
 */
export function detectTechStack(paths: string[]): TechEntry[] {
  const detected = new Map<string, TechEntry>();

  for (const filePath of paths) {
    for (const sig of TECH_SIGNATURES) {
      if (sig.pattern.test(filePath)) {
        if (!detected.has(sig.name)) {
          detected.set(sig.name, {
            name: sig.name,
            category: sig.category,
            confidence: sig.confidence,
            evidence: filePath,
          });
        }
      }
    }
  }

  return Array.from(detected.values()).sort((a, b) => {
    // Sort by: high confidence first, then alphabetically within same confidence
    if (a.confidence !== b.confidence) {
      return a.confidence === "high" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export interface CycleResult {
  count: number;
  examples: Array<{ path: string[] }>;
}

/**
 * Depth-first search (DFS) to detect circular dependency chains in a directed graph.
 */
export function detectCycles(
  moduleIds: string[],
  adjList: Map<string, string[]>,
  maxCyclesToReport = 5,
): CycleResult {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const stack: string[] = [];
  const cycles: Array<{ path: string[] }> = [];

  function dfs(nodeId: string): boolean {
    if (cycles.length >= maxCyclesToReport) return false;
    visited.add(nodeId);
    inStack.add(nodeId);
    stack.push(nodeId);

    const neighbours = adjList.get(nodeId) ?? [];
    for (const neighbour of neighbours) {
      if (!visited.has(neighbour)) {
        dfs(neighbour);
      } else if (inStack.has(neighbour)) {
        // Found a cycle — extract it
        const cycleStart = stack.indexOf(neighbour);
        if (cycleStart !== -1) {
          const cyclePath = stack.slice(cycleStart);
          cycles.push({ path: [...cyclePath, neighbour] });
        }
      }
    }

    stack.pop();
    inStack.delete(nodeId);
    return false;
  }

  for (const id of moduleIds) {
    if (!visited.has(id)) {
      dfs(id);
    }
  }

  return { count: cycles.length, examples: cycles.slice(0, maxCyclesToReport) };
}

/**
 * Calculates a 0-100 repository health score based on complexity, cycles, and isolated files.
 */
export function calculateHealthScore(params: {
  avgComplexity: number;
  circularCount: number;
  isolatedCount: number;
  totalFiles: number;
}): number {
  const { avgComplexity, circularCount, isolatedCount, totalFiles } = params;
  if (totalFiles === 0) return 100;

  let score = 100;

  // Penalize high average complexity (normal range ~1-5, penalty above 5)
  if (avgComplexity > 10) {
    score -= Math.min(25, (avgComplexity - 10) * 2);
  } else if (avgComplexity > 5) {
    score -= (avgComplexity - 5) * 1.5;
  }

  // Penalize circular dependencies heavily (10 points per circular chain, max 40)
  score -= Math.min(40, circularCount * 10);

  // Penalize high ratio of isolated modules (dead code indicators)
  const isolatedRatio = isolatedCount / totalFiles;
  if (isolatedRatio > 0.3) {
    score -= Math.min(20, Math.round((isolatedRatio - 0.3) * 50));
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
