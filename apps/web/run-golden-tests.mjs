import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { compareCncPrograms } from "./tests/cnc-parity-policy.mjs";

const rootDir = process.cwd();
const context = { window: {}, console };
vm.createContext(context);

for (const file of [
  "data/smiprog-data.js",
  "js/core.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(rootDir, file), "utf8"), context, { filename: file });
}

const data = context.window.SmiProgData;
const core = context.window.SmiProgCore;
const fixturesDir = path.join(rootDir, "tests/golden");
const fixtureFiles = fs.readdirSync(fixturesDir).filter((file) => file.endsWith(".json"));

function assertEqual(actual, expected, label, failures) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertClose(actual, expected, label, failures) {
  if (typeof actual !== "number" || !Number.isFinite(actual)
    || typeof expected !== "number" || !Number.isFinite(expected)
    || Math.abs(actual - expected) > 0.000001) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

const results = [];
let totalFailures = 0;
const byControlSystem = {};
const byPostFeatureSummary = {};

// Missing/invalid outputs must fail, including when the expected result is zero.
for (const invalid of [null, undefined, NaN, Infinity, "", "0"]) {
  const failures = [];
  assertClose(invalid, 0, "numeric comparison guard", failures);
  if (failures.length !== 1) throw new Error("Numeric test guard accepted a non-finite or missing result.");
}

function summarizePostFeatures(postId, analysis) {
  byPostFeatureSummary[postId] = byPostFeatureSummary[postId] || {
    fixtures: 0,
    macroFixtures: 0,
    whileLoopFixtures: 0,
    polarInterpolationFixtures: 0,
    ijkArcFixtures: 0,
    radiusArcFixtures: 0,
    arcLinesWithoutIjk: 0
  };
  const summary = byPostFeatureSummary[postId];
  summary.fixtures += 1;
  if (analysis.usesMacroVariables) summary.macroFixtures += 1;
  if (analysis.usesWhileLoops) summary.whileLoopFixtures += 1;
  if (analysis.usesPolarInterpolation) summary.polarInterpolationFixtures += 1;
  if (analysis.usesIjkArcs) summary.ijkArcFixtures += 1;
  if (analysis.usesRadiusArcs) summary.radiusArcFixtures += 1;
  summary.arcLinesWithoutIjk += analysis.arcLinesWithoutIjk || 0;
}

for (const file of fixtureFiles) {
  const fixture = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), "utf8"));
  if (fixture.status === "todo") {
    results.push({
      file,
      name: fixture.name,
      status: "todo",
      passed: null,
      failures: []
    });
    continue;
  }

  const result = core.calculate(fixture.input, data, {
    includeInternalPosts: fixture.allowInternalPost === true
  });
  const failures = [];
  const controlSystemId = fixture.input.controlSystemId || "fanuc";
  const postId = result.postProcessor ? result.postProcessor.id : "unsupported";
  const programAnalysis = result.programAnalysis || {};
  summarizePostFeatures(postId, programAnalysis);
  byControlSystem[controlSystemId] = byControlSystem[controlSystemId] || { fixtures: 0, failures: 0, posts: {} };
  byControlSystem[controlSystemId].fixtures += 1;
  byControlSystem[controlSystemId].posts[postId] = (byControlSystem[controlSystemId].posts[postId] || 0) + 1;

  for (const [key, expected] of Object.entries(fixture.expectedCuttingData || {})) {
    assertClose(result.cuttingData && result.cuttingData[key], expected, `${fixture.name} cuttingData.${key}`, failures);
  }

  const programCheck = compareCncPrograms(Array.from(result.cncProgram), fixture.expectedCncProgram, controlSystemId);
  for (const difference of programCheck.differences) {
    failures.push(`${fixture.name} CNC line ${difference.line}: expected ${JSON.stringify(difference.excel)}, got ${JSON.stringify(difference.web)}`);
  }

  if (postId === "fanuc-iso-ijk") {
    if (programAnalysis.usesRadiusArcs) {
      failures.push(`${fixture.name} Fanuc ISO IJK post must not emit R-format arc moves.`);
    }
    if ((programAnalysis.arcLineCount || 0) > 0 && (programAnalysis.arcLinesWithoutIjk || 0) > 0) {
      failures.push(`${fixture.name} Fanuc ISO IJK post must emit I/J/K arc-center offsets on every G02/G03 line.`);
    }
  }

  totalFailures += failures.length;
  byControlSystem[controlSystemId].failures += failures.length;
  results.push({
    file,
    name: fixture.name,
    controlSystemId,
    postId,
    passed: failures.length === 0,
    acceptedFormattingChanges: programCheck.accepted,
    failures
  });
}

const releaseGateFailures = [];
const gateFixture = JSON.parse(fs.readFileSync(path.join(fixturesDir, "fanuc-original-default.json"), "utf8"));
for (const controlSystem of data.controlSystems || []) {
  const result = core.calculate({
    ...gateFixture.input,
    controlSystemId: controlSystem.id
  }, data);
  const visible = controlSystem.uiVisible === true || ["released", "timoApproved", "machineProven"].includes(controlSystem.releaseStatus);
  if (visible && controlSystem.postId && !result.canGenerateCncProgram) {
    releaseGateFailures.push(`${controlSystem.id} is visible but has no program post.`);
  }
  if (!visible && result.canGenerateCncProgram) {
    releaseGateFailures.push(`${controlSystem.id} is hidden but can generate CNC code.`);
  }
}
totalFailures += releaseGateFailures.length;
results.push({
  file: "release-gates",
  name: "Control-system UI visibility gating",
  passed: releaseGateFailures.length === 0,
  failures: releaseGateFailures
});

const fixtureResults = results.filter((result) => result.file !== "release-gates");

console.log(JSON.stringify({
  fixtureCount: fixtureFiles.length,
  activeCount: fixtureResults.filter((result) => result.status !== "todo").length,
  todoCount: fixtureResults.filter((result) => result.status === "todo").length,
  byControlSystem,
  byPostFeatureSummary,
  totalFailures,
  results
}, null, 2));

if (totalFailures > 0) {
  process.exitCode = 1;
}
