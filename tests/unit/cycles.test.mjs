import test from "node:test";
import assert from "node:assert/strict";
import { detectCycles, calculateHealthScore } from "../../lib/intelligence.ts";

test("detectCycles returns count 0 for acyclic directed graphs (DAG)", () => {
  const moduleIds = ["modA", "modB", "modC", "modD"];
  const adjList = new Map([
    ["modA", ["modB", "modC"]],
    ["modB", ["modD"]],
    ["modC", ["modD"]],
    ["modD", []],
  ]);

  const result = detectCycles(moduleIds, adjList);
  assert.equal(result.count, 0, "DAG must have 0 cycles");
  assert.equal(result.examples.length, 0, "DAG should have empty examples array");
});

test("detectCycles detects direct 2-node circular dependency", () => {
  const moduleIds = ["modA", "modB"];
  const adjList = new Map([
    ["modA", ["modB"]],
    ["modB", ["modA"]],
  ]);

  const result = detectCycles(moduleIds, adjList);
  assert.ok(result.count >= 1, "Should detect at least 1 cycle");
  assert.ok(result.examples.length >= 1, "Should include cycle example");

  const examplePath = result.examples[0].path;
  assert.equal(
    examplePath[0],
    examplePath[examplePath.length - 1],
    "Path must start and end at same node",
  );
});

test("detectCycles detects multi-node circular dependency loop", () => {
  const moduleIds = ["modA", "modB", "modC", "modD"];
  const adjList = new Map([
    ["modA", ["modB"]],
    ["modB", ["modC"]],
    ["modC", ["modA"]],
    ["modD", ["modA"]],
  ]);

  const result = detectCycles(moduleIds, adjList);
  assert.ok(result.count >= 1, "Should detect triangular cycle between A, B, C");

  const example = result.examples[0];
  assert.ok(
    example.path.includes("modA") && example.path.includes("modB") && example.path.includes("modC"),
  );
});

test("calculateHealthScore computes pristine score for clean repos", () => {
  const pristineScore = calculateHealthScore({
    avgComplexity: 2.1,
    circularCount: 0,
    isolatedCount: 0,
    totalFiles: 25,
  });

  assert.equal(pristineScore, 100, "Clean repository should receive 100 health score");
});

test("calculateHealthScore penalizes circular dependencies and excessive complexity", () => {
  const degradedScore = calculateHealthScore({
    avgComplexity: 12.5, // High complexity penalty
    circularCount: 2, // 2 * 10 = 20 pts penalty
    isolatedCount: 15, // 15/20 = 75% isolated (dead code) penalty
    totalFiles: 20,
  });

  assert.ok(degradedScore < 70, `Score should be significantly degraded, got ${degradedScore}`);
  assert.ok(degradedScore >= 0, "Score must never drop below 0");
});
