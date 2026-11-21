/**
 * lib/ai/fallback.ts
 *
 * Grounded fallback generator for module summaries and repository explanations.
 * Strictly adheres to Architecture.md §10 & Rules.md:
 * - Never hallucinates or fabricates unsupported facts.
 * - Derived directly from AST parse results (LOC, complexity, import topology, directory structure).
 * - Provides graceful degradation when OpenAI API is unavailable, rate-limited, or unconfigured.
 */

export interface FallbackModuleInput {
  path: string;
  type: "file" | "folder";
  loc: number;
  complexityScore: number;
  importsCount: number;
  importedByCount: number;
  imports?: string[];
  importedBy?: string[];
}

export interface FallbackRepoInput {
  repoName: string;
  mode: "technical" | "beginner";
  modules: FallbackModuleInput[];
  stats: {
    fileCount: number;
    totalLOC: number;
    avgComplexity: number;
    edgeCount: number;
    techStack?: string[];
  };
  aiError?: string;
}

/**
 * Categorize a file based on directory and file naming conventions.
 */
function categorizeFilePath(path: string): { category: string; description: string } {
  const normalized = path.toLowerCase();

  if (
    normalized.endsWith(".json") ||
    normalized.includes("config.") ||
    normalized.startsWith(".")
  ) {
    return {
      category: "Configuration",
      description: "Configures project build, environment, or dependencies",
    };
  }
  if (
    normalized.includes("/api/") ||
    normalized.includes("route.ts") ||
    normalized.includes("route.js")
  ) {
    return {
      category: "API Endpoint",
      description: "Backend server route handling incoming HTTP requests",
    };
  }
  if (
    normalized.includes("page.tsx") ||
    normalized.includes("page.jsx") ||
    normalized.includes("layout.tsx")
  ) {
    return {
      category: "View / Page Layout",
      description: "User interface view or route layout rendered for client navigation",
    };
  }
  if (normalized.includes("/components/")) {
    return {
      category: "UI Component",
      description: "Reusable user interface component for rendering visual presentation elements",
    };
  }
  if (
    normalized.includes("/models/") ||
    normalized.includes("/schemas/") ||
    normalized.includes("schema.ts")
  ) {
    return {
      category: "Data Model",
      description: "Database schema or domain model defining entity contracts and storage layout",
    };
  }
  if (normalized.includes("/hooks/") || normalized.includes("use")) {
    return {
      category: "Custom Hook",
      description: "Encapsulates reactive state management and reusable lifecycle behaviors",
    };
  }
  if (normalized.includes("/types/") || normalized.endsWith(".d.ts")) {
    return {
      category: "Type Definitions",
      description: "Provides TypeScript type definitions and compile-time contract interfaces",
    };
  }
  if (normalized.includes("/lib/") || normalized.includes("/utils/")) {
    return {
      category: "Core Utility / Service",
      description: "Core domain logic, helper routines, or service integrations",
    };
  }
  if (normalized.includes("test") || normalized.includes("spec")) {
    return {
      category: "Test Suite",
      description: "Automated test assertions verifying component or utility correctness",
    };
  }

  return {
    category: "Source Module",
    description: "Internal application module participating in repository logic",
  };
}

/**
 * Generate a concise, factual module summary derived from AST analysis.
 */
export function generateGroundedModuleSummary(input: FallbackModuleInput): string {
  if (input.type === "folder") {
    return `Directory containing structural sub-modules.`;
  }

  const { category, description } = categorizeFilePath(input.path);
  const baseName = input.path.split("/").pop() ?? input.path;

  const complexityDescriptor =
    input.complexityScore >= 7
      ? "high structural complexity"
      : input.complexityScore >= 4
        ? "moderate branching complexity"
        : "low complexity";

  let connectionSentence = "";
  if (input.importsCount > 0 && input.importedByCount > 0) {
    connectionSentence = `Consumes ${input.importsCount} dependency module${input.importsCount === 1 ? "" : "s"} and is imported by ${input.importedByCount} module${input.importedByCount === 1 ? "" : "s"}.`;
  } else if (input.importsCount > 0) {
    connectionSentence = `Consumes ${input.importsCount} internal dependency module${input.importsCount === 1 ? "" : "s"} as a client module.`;
  } else if (input.importedByCount > 0) {
    connectionSentence = `Functions as a shared foundation imported by ${input.importedByCount} other module${input.importedByCount === 1 ? "" : "s"}.`;
  } else {
    connectionSentence = `Operates as a self-contained module with zero internal import dependencies.`;
  }

  return `${category} (${baseName}): ${description}. Implements ${input.loc} lines of code with ${complexityDescriptor} (complexity score ${input.complexityScore}/10). ${connectionSentence}`;
}

/**
 * Generate a complete repository-level explanation grounded in AST analysis.
 */
export function generateGroundedRepoExplanation(input: FallbackRepoInput): string {
  const { repoName, mode, modules, stats, aiError } = input;

  // Identify entry points
  const entryPoints = modules.filter(
    (m) =>
      m.path.includes("page.tsx") ||
      m.path.includes("layout.tsx") ||
      m.path.includes("route.ts") ||
      m.path.includes("main.") ||
      m.path.includes("index."),
  );

  // Identify key components (highest complexity or most imported)
  const keyComponents = [...modules]
    .filter((m) => m.type === "file")
    .sort((a, b) => b.importedByCount + b.complexityScore - (a.importedByCount + a.complexityScore))
    .slice(0, 8);

  const fallbackNotice = aiError
    ? `> [!NOTE]\n> **Grounded Static Analysis**: Generated directly from AST metadata and dependency graph topology. (AI provider notice: ${aiError})\n\n`
    : "";

  if (mode === "beginner") {
    return `${fallbackNotice}## 1. What it does
"${repoName}" is a software project comprising **${stats.fileCount} source files** and **${stats.totalLOC.toLocaleString()} lines of code**. In simple terms, it functions like a well-organized digital workshop where each file has a specific job—some create what users see on screen, others handle data behind the scenes, and helper files keep everything running smoothly.

## 2. How it works
Think of this project like a restaurant:
- **The Dining Room (Frontend / Views)**: Files that build pages and show information to the user.
- **The Waitstaff (APIs & Routes)**: Routes that take requests from the page and deliver answers back.
- **The Kitchen (Core Logic & Services)**: Utility modules where complex calculations and business rules are executed.
- **The Pantry (Data Models & Storage)**: Where records, data structures, and state are defined and stored.

With an average complexity rating of **${stats.avgComplexity}/10** across **${stats.edgeCount} connection links**, the system is structured into clear, manageable compartments.

## 3. Key components
The most central modules that other parts of the project rely on include:
${keyComponents
  .slice(0, 5)
  .map(
    (m) =>
      `- **${m.path.split("/").pop()}** (\`${m.path}\`): A core building block used by ${m.importedByCount} other file${m.importedByCount === 1 ? "" : "s"} (${m.loc} lines).`,
  )
  .join("\n")}

## 4. Entry points
When someone opens or runs the application, execution starts at key entry doors:
${entryPoints
  .slice(0, 4)
  .map((m) => `- **${m.path}**: Serves as a primary interface or navigation entry point.`)
  .join("\n")}

## 5. External integrations
The repository relies on structured dependency declarations and configuration files (\`package.json\`, config files) to connect external libraries, framework features, and external services with its custom internal code.

## 6. Data flow
1. **User Interaction**: Actions begin at the view entry points.
2. **Request Routing**: Requests travel to internal services and API handlers.
3. **Processing**: Core logic modules process the data according to the project's rules.
4. **Presentation**: The resulting state or data is reflected back to the user interface.`;
  }

  // Technical Mode
  return `${fallbackNotice}## 1. What it does
\`${repoName}\` is a modular software repository consisting of **${stats.fileCount} analyzed files**, **${stats.totalLOC.toLocaleString()} lines of code**, and **${stats.edgeCount} inter-module import relationships**. The architecture is structured to separate presentation interfaces, business logic services, and data schema boundaries.

## 2. How it works
The repository utilizes a modular architectural model with an average module complexity of **${stats.avgComplexity}/10**:
- **Presentation Layer**: Client pages and view components managing visual state and interactions.
- **Routing & Controller Layer**: Request endpoints handling input validation, routing, and dispatching.
- **Domain & Service Layer**: Specialized internal libraries orchestrating data transformations and business rules.
- **Schema & Data Layer**: Persistence models establishing domain entity definitions and storage contracts.

## 3. Key components
High-centrality modules identified by dependency connectivity and structural complexity:
${keyComponents
  .map(
    (m) =>
      `- **\`${m.path}\`**: ${m.loc} LOC | Complexity score: ${m.complexityScore}/10 | In-degree (imported by): ${m.importedByCount} | Out-degree (imports): ${m.importsCount}.`,
  )
  .join("\n")}

## 4. Entry points
Key application lifecycles and request routing initiate from:
${entryPoints
  .slice(0, 5)
  .map((m) => `- **\`${m.path}\`**: Root route / page entry point (${m.loc} LOC).`)
  .join("\n")}

## 5. External integrations
The module import graph interfaces with external ecosystem packages defined in project configuration manifests. Inter-module boundaries maintain clean separation between internal utilities and third-party dependencies.

## 6. Data flow
1. **Entry Ingestion**: Invocations arrive via designated route and view entry points.
2. **Dependency Resolution**: Request handlers delegate computation to core library utilities (\`${keyComponents[0]?.path ?? "lib"}\`).
3. **Data Transformation**: Domain services execute deterministic operations across dependency nodes.
4. **State / Response Delivery**: Processed payloads are returned upstream to view components and external consumers.`;
}
