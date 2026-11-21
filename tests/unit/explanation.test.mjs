import test from "node:test";
import assert from "node:assert/strict";
import {
  generateGroundedModuleSummary,
  generateGroundedRepoExplanation,
} from "../../lib/ai/fallback.ts";

test("generateGroundedModuleSummary produces grounded factual summaries from AST data", () => {
  const summary = generateGroundedModuleSummary({
    path: "app/api/repos/route.ts",
    type: "file",
    loc: 110,
    complexityScore: 4,
    importsCount: 6,
    importedByCount: 2,
  });

  assert.ok(summary.includes("API Endpoint"), "Should identify API Endpoint from path");
  assert.ok(summary.includes("110 lines of code"), "Should include exact LOC");
  assert.ok(summary.includes("complexity score 4/10"), "Should include complexity score");
  assert.ok(summary.includes("6 dependency modules"), "Should state dependency count");
  assert.ok(summary.includes("2 modules"), "Should state imported-by count");
});

test("generateGroundedRepoExplanation generates all 6 sections for technical mode", () => {
  const explanation = generateGroundedRepoExplanation({
    repoName: "Portfolio",
    mode: "technical",
    modules: [
      {
        path: "app/page.tsx",
        type: "file",
        loc: 85,
        complexityScore: 2,
        importsCount: 4,
        importedByCount: 1,
      },
      {
        path: "lib/auth.ts",
        type: "file",
        loc: 140,
        complexityScore: 5,
        importsCount: 2,
        importedByCount: 8,
      },
    ],
    stats: {
      fileCount: 2,
      totalLOC: 225,
      avgComplexity: 3.5,
      edgeCount: 6,
    },
  });

  assert.ok(explanation.includes("## 1. What it does"), "Must have section 1");
  assert.ok(explanation.includes("## 2. How it works"), "Must have section 2");
  assert.ok(explanation.includes("## 3. Key components"), "Must have section 3");
  assert.ok(explanation.includes("## 4. Entry points"), "Must have section 4");
  assert.ok(explanation.includes("## 5. External integrations"), "Must have section 5");
  assert.ok(explanation.includes("## 6. Data flow"), "Must have section 6");
  assert.ok(explanation.includes("Portfolio"), "Must reference repo name");
});

test("generateGroundedRepoExplanation formats beginner mode with analogies and plain language", () => {
  const explanation = generateGroundedRepoExplanation({
    repoName: "Portfolio",
    mode: "beginner",
    modules: [
      {
        path: "app/page.tsx",
        type: "file",
        loc: 85,
        complexityScore: 2,
        importsCount: 4,
        importedByCount: 1,
      },
    ],
    stats: {
      fileCount: 1,
      totalLOC: 85,
      avgComplexity: 2,
      edgeCount: 4,
    },
  });

  assert.ok(
    explanation.includes("digital workshop") || explanation.includes("restaurant"),
    "Should contain analogies",
  );
  assert.ok(explanation.includes("## 1. What it does"));
  assert.ok(explanation.includes("## 6. Data flow"));
});

test("generateGroundedRepoExplanation produces clean, structured markdown without leaked errors", () => {
  const explanation = generateGroundedRepoExplanation({
    repoName: "Portfolio",
    mode: "technical",
    modules: [],
    stats: {
      fileCount: 0,
      totalLOC: 0,
      avgComplexity: 0,
      edgeCount: 0,
    },
    aiError: "401 Unauthorized: Incorrect API key provided",
  });

  assert.ok(explanation.includes("## 1. What it does"), "Must include section 1");
  assert.ok(!explanation.includes("401 Unauthorized"), "Must not leak raw API errors into explanation text");
  assert.ok(!explanation.includes("sk-"), "Must never leak API key substrings into explanation text");
});
