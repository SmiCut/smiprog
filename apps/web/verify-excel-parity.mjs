import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { compareCncPrograms, rejectsInputSafely } from "./tests/cnc-parity-policy.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const snapshots = path.join(root, "tmp/excel-parity");
fs.mkdirSync(snapshots, { recursive: true });
const oraclePath = process.argv[2] || path.join(root, "tests/excel-parity-oracle.json");
const archive = fs.statSync(oraclePath).isFile() ? JSON.parse(fs.readFileSync(oraclePath, "utf8")) : null;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "tests/excel-parity-cases.json"), "utf8"));
const url = process.env.SMIPROG_URL || pathToFileURL(path.join(root, "index.html")).href;
const hashFile = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const provenance = { testedAt: new Date().toISOString(), url, localFrontend: !process.env.SMIPROG_URL,
  coreSha256: process.env.SMIPROG_URL ? null : hashFile(path.join(root, "js/core.js")),
  dataSha256: process.env.SMIPROG_URL ? null : hashFile(path.join(root, "data/smiprog-data.js")),
  manifestSha256: hashFile(path.join(root, "tests/excel-parity-cases.json")),
  oracleSha256: archive ? hashFile(oraclePath) : null };
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const results = [];
const errors = [];
const missing = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[data-spg-tab="main"]').click();
  await page.evaluate(() => {
    const original = window.SmiProgCore.calculate;
    window.SmiProgCore.calculate = (...args) => {
      const result = original(...args);
      // Main also refreshes Compare: do not mistake its last tool for the Main result.
      if (!new Error().stack.includes("renderCostData")) window.parityObservedResult = result;
      return result;
    };
  });
  for (const test of manifest.cases) {
    const snapshot = archive ? archive.cases.find(entry => entry.id === test.id) : null;
    const snapshotPath = path.join(oraclePath, test.id + ".json");
    if (!snapshot && (archive || !fs.existsSync(snapshotPath))) { missing.push(test.id); continue; }
    if (test.input.threadProfileId === "npsf") { results.push({ id: test.id, status: "not-exposed-in-ui" }); continue; }
    const oracle = snapshot || JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    const input = test.input;
    await page.selectOption("#spg-process", input.processId);
    await page.selectOption("#spg-control-system", input.controlSystemId);
    await page.selectOption("#spg-thread-profile", input.threadProfileId === "m" ? "m-manual" : input.threadProfileId === "g" ? "g-manual" : input.threadProfileId);
    await page.selectOption("#spg-material", input.materialId);
    await page.selectOption("#spg-thread-hand", "right");
    await page.evaluate(input => {
      function value(selector, value) {
        const element = document.querySelector(selector);
        element.value = value ?? "";
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      value("#spg-diameter", input.diameter);
      value("#spg-pitch", input.pitch);
      value("#spg-thread-length", input.threadLength);
      value("#spg-safety-distance", input.safetyDistance);
      value("#spg-program-template", "");
      // Leave custom mode before selecting the independently specified base tool.
      const select = document.querySelector("#spg-tool");
      value("#spg-tool", [...select.options].some(option => option.value === input.selectedToolId) ? input.selectedToolId : "");
      const overrides = input.overrides || {};
      if (overrides.cutterDiameter && overrides.cuttingEdgeLength && overrides.flutes) value("#spg-tool", "__custom_tool__");
      for (const [field, selector] of Object.entries({
        cutterDiameter: "#spg-override-cutter-diameter", cuttingEdgeLength: "#spg-override-edge-length", flutes: "#spg-override-flutes",
        cuttingSpeed: "#spg-override-cutting-speed", feedPerTooth: "#spg-override-feed", radialPasses: "#spg-override-radial-passes"
      })) value(selector, overrides[field]);
    }, input);
    const observed = await page.evaluate(() => ({ result: window.parityObservedResult, renderedProgram: document.querySelector("#spg-cnc-program").value }));
    const differences = [];
    if (JSON.stringify(oracle.input) !== JSON.stringify(input)) differences.push({ field: "oracleInput", excel: oracle.input, web: input });
    if (test.group !== "invalid-inputs") {
      for (const field of ["processId", "controlSystemId", "threadProfileId", "materialId", "selectedToolId"]) {
        if (observed.result?.input[field] !== input[field]) differences.push({ field: "input." + field, excel: input[field], web: observed.result?.input[field] });
      }
      for (const field of ["diameter", "pitch", "threadLength", "safetyDistance"]) {
        if (observed.result?.input[field] !== input[field]) differences.push({ field: "input." + field, excel: input[field], web: observed.result?.input[field] });
      }
      for (const field of ["cutterDiameter", "cuttingEdgeLength", "flutes", "cuttingSpeed", "feedPerTooth", "radialPasses"]) {
        const requested = input.overrides?.[field] ?? null;
        if (observed.result?.input.overrides[field] !== requested) differences.push({ field: "input.overrides." + field, excel: requested, web: observed.result?.input.overrides[field] });
      }
    }
    const validNumbers = Object.values(oracle.cuttingData).every(value => typeof value === "number" && Number.isFinite(value));
    const acceptedChanges = [];
    if (test.group === "invalid-inputs") {
      const errorDisplay = observed.renderedProgram === observed.result.cncProgram.join("\n")
        || (observed.result.input.threadLength === 0 && observed.renderedProgram === "");
      if (!rejectsInputSafely(observed.result) || !errorDisplay) differences.push({ field: "safeInputRejection", web: observed });
      else acceptedChanges.push({ kind: "invalid-input-rejection" });
    } else if (validNumbers && observed.result?.cuttingData) {
      for (const [field, excel] of Object.entries(oracle.cuttingData)) {
        const actual = observed.result.cuttingData[field];
        if (typeof actual !== "number" || !Number.isFinite(actual) || Math.abs(actual - excel) > 1e-6) differences.push({ field, excel, web: actual });
      }
    } else if (Boolean(observed.result?.cuttingData) !== validNumbers) differences.push({ field: "calculationAvailability", excel: validNumbers, web: Boolean(observed.result?.cuttingData) });
    if (test.group !== "invalid-inputs") {
      const programCheck = compareCncPrograms(observed.renderedProgram.split("\n"), oracle.cncProgram, input.controlSystemId);
      if (programCheck.differences.length) differences.push({ field: "renderedProgram", excel: oracle.cncProgram, web: observed.renderedProgram.split("\n") });
      acceptedChanges.push(...programCheck.accepted);
    }
    results.push({ id: test.id, status: differences.length ? "different" : "matched", differences, acceptedChanges, inputReadBack: observed.result?.input });
    if (test.id === "custom-diameter-7p5") await page.screenshot({ path: path.join(snapshots, "axial-parity-difference.png"), fullPage: true });
  }
  const report = { provenance, checked: results.length, matched: results.filter(result => result.status === "matched").length,
    different: results.filter(result => result.status === "different").length, notExposed: results.filter(result => result.status === "not-exposed-in-ui").length, missing, errors, results };
  fs.writeFileSync(path.join(snapshots, "browser-comparison.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, missing: missing.length, results: results.filter(result => result.status !== "matched").map(result => ({
    id: result.id, status: result.status, fields: result.differences?.map(difference => difference.field)
  })) }, null, 2));
  if (errors.length || report.different || missing.length) process.exitCode = 1;
} finally { await browser.close(); }
