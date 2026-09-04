import test from "node:test";
import assert from "node:assert/strict";

// Mirroring the pure detection logic from lib/intelligence.ts
import { detectTechStack, TECH_SIGNATURES } from "../../lib/intelligence.ts";

test("TECH_SIGNATURES has comprehensive coverage", () => {
  assert.ok(TECH_SIGNATURES.length > 20, "Should have more than 20 technology signatures");
  const categories = new Set(TECH_SIGNATURES.map((s) => s.category));
  assert.ok(categories.has("Framework"));
  assert.ok(categories.has("Language"));
  assert.ok(categories.has("Database") || categories.has("Database ORM"));
  assert.ok(categories.has("Authentication"));
  assert.ok(categories.has("AI"));
});

test("detectTechStack detects web frameworks and languages accurately", () => {
  const samplePaths = [
    "package.json",
    "next.config.ts",
    "tailwind.config.mjs",
    "app/layout.tsx",
    "lib/mongodb.ts",
    "Dockerfile",
    "app/api/auth/route.ts",
  ];

  const results = detectTechStack(samplePaths);
  const detectedNames = new Set(results.map((r) => r.name));

  assert.ok(detectedNames.has("Node.js"), "Should detect Node.js from package.json");
  assert.ok(detectedNames.has("Next.js"), "Should detect Next.js from next.config.ts");
  assert.ok(detectedNames.has("TypeScript"), "Should detect TypeScript from .ts/.tsx");
  assert.ok(detectedNames.has("Tailwind CSS"), "Should detect Tailwind CSS");
  assert.ok(detectedNames.has("MongoDB"), "Should detect MongoDB from lib/mongodb.ts");
  assert.ok(detectedNames.has("Docker"), "Should detect Docker from Dockerfile");
});

test("detectTechStack deduplicates multiple occurrences of same tech", () => {
  const samplePaths = [
    "components/Header.tsx",
    "components/Footer.tsx",
    "lib/utils.ts",
    "lib/layout.ts",
  ];

  const results = detectTechStack(samplePaths);
  const tsEntries = results.filter((r) => r.name === "TypeScript");
  assert.equal(tsEntries.length, 1, "TypeScript should only appear once");
});

test("detectTechStack returns empty array for unrecognized files", () => {
  const samplePaths = ["notes.txt", "archive.bin", "unknown_blob"];
  const results = detectTechStack(samplePaths);
  assert.equal(results.length, 0, "Should return empty array for unknown files");
});

test("detectTechStack sorts high confidence items before medium confidence", () => {
  const samplePaths = [
    "server/express-server.js", // Express is medium confidence
    "package.json", // Node.js is high confidence
    "next.config.ts", // Next.js is high confidence
  ];

  const results = detectTechStack(samplePaths);
  assert.ok(results.length >= 2);

  const firstHigh = results.findIndex((r) => r.confidence === "high");
  const firstMedium = results.findIndex((r) => r.confidence === "medium");

  if (firstMedium !== -1 && firstHigh !== -1) {
    assert.ok(firstHigh < firstMedium, "High confidence entries must come before medium");
  }
});
