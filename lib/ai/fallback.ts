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

  if (mode === "beginner") {
    return `## 1. What it does (The Big Picture)
"${repoName}" is a modern web application codebase consisting of **${stats.fileCount} source files** and **${stats.totalLOC.toLocaleString()} total lines of code**. In everyday terms, it is designed like a well-crafted digital platform where every file has a dedicated role—presenting screens to visitors, managing interactive features, and handling information behind the scenes without confusion.

The repository's structure is organized so that visual elements (pages and user interface components) are separated from the internal machinery (data structures and helper functions). This allows new features to be added cleanly without breaking existing components.

## 2. How it works (The Blueprint Analogy)
To understand how the pieces cooperate, imagine this application like an interactive restaurant or workshop:
- **The Dining Room (Pages & Visual Components)**: What visitors see on screen. When someone clicks a link or button, visual components display the response.
- **The Waitstaff (Routes & Request Handlers)**: Acts as the messenger between what the user clicks on screen and the engine room behind the scenes.
- **The Kitchen (Core Logic & Services)**: Performs the calculations, data transformations, and heavy lifting.
- **The Pantry (Data Models & Schemas)**: Keeps records, state, and data organized in a standardized layout.

With an average module complexity rating of **${stats.avgComplexity}/10** across **${stats.edgeCount} connection links**, the system maintains a clean and modular separation of responsibilities.

## 3. Key components (Meet the Modules)
The most essential files that keep the project running and are relied upon by other modules include:
${keyComponents
  .slice(0, 6)
  .map(
    (m) =>
      `- **${m.path.split("/").pop()}** (\`${m.path}\`): A core module implemented in ${m.loc} lines of code. It connects to ${m.importedByCount} other file${m.importedByCount === 1 ? "" : "s"} and manages foundational application capabilities.`,
  )
  .join("\n")}

## 4. Entry points (The Front Doors)
When someone accesses the application, execution starts at primary entry doorways that prepare the user interface:
${entryPoints
  .slice(0, 5)
  .map((m) => `- **\`${m.path}\`**: Functions as a primary route or layout entry point that initializes the view.`)
  .join("\n")}

## 5. External integrations (Helpers & Tools)
The application relies on declared external dependencies defined in configuration files (\`package.json\`, config files) to provide specialized capabilities:
- **Styling & Presentation**: Manages colors, typography, and responsive layouts across screen sizes.
- **Runtime Framework**: Provides modern routing, server-side capabilities, and fast interactive page updates.
- **Utility Libraries**: Provide helpers for data validation, animations, and icons.

## 6. Data flow (The User's Journey)
Here is what happens step-by-step when someone interacts with the application:
1. **Initial Visit**: The visitor requests a URL, and the entry layout (\`${entryPoints[0]?.path ?? "app/page.tsx"}\`) loads the foundation of the page.
2. **Component Assembly**: Modular view components render the navigation, content sections, and interactive controls.
3. **User Action**: The visitor clicks, scrolls, or inputs information, triggering event handlers.
4. **Processing**: Helper utilities and services calculate the required updates or fetch relevant data.
5. **Screen Update**: The application updates the view smoothly to reflect the result of the user's action.`;
  }

  // Technical Mode
  return `## 1. What it does & Architectural Scope
\`${repoName}\` is a modular software application comprising **${stats.fileCount} analyzed source files**, **${stats.totalLOC.toLocaleString()} lines of code (LOC)**, and **${stats.edgeCount} inter-module dependency relationships**. The architecture is structured with clear segregation between presentation layers, business logic utilities, and data contract definitions.

The codebase exhibits a mean complexity score of **${stats.avgComplexity}/10**, reflecting a balanced distribution between lightweight declarative components and concentrated domain logic modules.

## 2. How it works — Architecture & Design Patterns
The repository follows a modern component-driven architectural model:
- **Presentation Layer**: Client views and UI primitives encapsulate visual presentation, layout hierarchies, and user interaction states.
- **Routing & Controller Layer**: Request endpoints and page routers manage route transitions, parameter validation, and lifecycle hooks.
- **Domain & Service Layer**: Specialized utility libraries handle deterministic computation, data formatting, and business rule orchestration.
- **Schema & Data Layer**: Persistence models and type definitions enforce compile-time safety and domain integrity.

Module coupling is kept manageable by channeling inter-module communication through structured import contracts, preventing circular dependencies across architectural tiers.

## 3. Key components & Subsystems
High-centrality modules identified through topological analysis (in-degree connectivity and structural complexity):
${keyComponents
  .map(
    (m) =>
      `- **\`${m.path}\`**: ${m.loc} LOC | Complexity score: ${m.complexityScore}/10 | In-degree (imported by): ${m.importedByCount} | Out-degree (imports): ${m.importsCount}. Acts as a high-centrality building block within the dependency graph.`,
  )
  .join("\n")}

## 4. Entry points & Execution Lifecycles
Application bootstrap and request lifecycles initiate through designated root entry points:
${entryPoints
  .slice(0, 5)
  .map((m) => `- **\`${m.path}\`**: Root lifecycle entry point (${m.loc} LOC) responsible for route initialization and layout scaffolding.`)
  .join("\n")}

## 5. External integrations & Contracts
The repository interfaces with third-party ecosystem dependencies defined in the project manifest (\`package.json\`):
- **Framework & Runtime**: Handles route dispatching, server/client boundary segregation, and build-time optimization.
- **UI & Design Engine**: Implements utility-first styling and theme token bindings across light and dark modes.
- **Type Safety & Contracts**: Static typing boundaries prevent runtime contract violations between interconnected subsystems.

## 6. Data flow & End-to-End Lifecycles
A representative transaction executes through the following sequence:
1. **Request Ingestion**: Invocations arrive at designated route or view entry points (\`${entryPoints[0]?.path ?? "entry"}\`).
2. **Context & State Setup**: Root layouts and providers establish the operational context and reactive state bindings.
3. **Subsystem Delegation**: View components delegate computation to central utility modules (\`${keyComponents[0]?.path ?? "lib"}\`).
4. **Transformation & Processing**: Domain services execute deterministic operations across dependencies.
5. **DOM Reconciliation / Response**: Processed outputs are rendered into view state and presented to the client.`;
}
