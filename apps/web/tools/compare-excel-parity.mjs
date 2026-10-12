import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { compareCncPrograms, rejectsInputSafely } from "../tests/cnc-parity-policy.mjs";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotSource = path.resolve(process.argv[2] || path.join(web, "tests/excel-parity-oracle.json"));
const snapshotDir = path.join(web, "tmp/excel-parity");
fs.mkdirSync(snapshotDir, { recursive: true });
const manifestPath = process.argv[3] || path.join(web, "tests/excel-parity-cases.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const caseIds = new Set(manifest.cases.map(caseInfo => caseInfo.id));
const context = { window: {} };
vm.createContext(context);
for (const file of ["data/smiprog-data.js", "js/core.js"]) vm.runInContext(fs.readFileSync(path.join(web, file), "utf8"), context);
const { SmiProgCore: core, SmiProgData: data } = context.window;
const isArchive = fs.statSync(snapshotSource).isFile();
const archive = isArchive ? JSON.parse(fs.readFileSync(snapshotSource, "utf8")) : null;
const entries = archive ? archive.cases : fs.readdirSync(snapshotSource).filter(file => file.endsWith(".json")).map(file => JSON.parse(fs.readFileSync(path.join(snapshotSource, file), "utf8")));
const results = [];
const catalogue = archive?.catalogue || JSON.parse(fs.readFileSync(path.join(snapshotSource, "catalogue.json"), "utf8"));
const staticDifferences = [];
for (const type of ["tools", "materials"]) {
  for (const source of catalogue[type]) {
    const local = data[type].find(entry => String(entry.id) === String(source.id));
    for (const [field, value] of Object.entries(source)) {
      if (field === "id") continue;
      if (local?.[field] !== value) staticDifferences.push({ type, id: source.id, field, excel: value, web: local?.[field],
        kind: field === "description" && typeof value === "string" && value.replace(/_\s+/g, "_") === local?.[field] ? "article-spacing-only" : "technical" });
    }
  }
  for (const local of data[type]) if (!catalogue[type].some(source => String(source.id) === String(local.id))) staticDifferences.push({ type, id: local.id, field: "missingFromExcel" });
}

for (const oracle of entries) {
  if (!oracle.input || !oracle.engine || !caseIds.has(oracle.id)) continue;
  const input = { ...oracle.input };
  delete input.selectedToolIndex;
  // The manifest identifies the requested tool independently; no web outputs build the oracle.
  const result = core.calculate(input, data, { includeInternalPosts: true });
  const differences = [];
  const acceptedChanges = [];
  function exact(field, actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) differences.push({ field, excel: expected, web: actual });
  }
  exact("oracleInput", manifest.cases.find(test => test.id === oracle.id).input, oracle.input);
  exact("candidateToolIds", Array.from(result.candidates, tool => tool.id), oracle.candidateToolIds);
  const validExcelNumbers = Object.values(oracle.cuttingData).every(value => typeof value === "number" && Number.isFinite(value));
  if (oracle.group === "invalid-inputs") {
    if (!rejectsInputSafely(result)) differences.push({ field: "safeInputRejection", excel: "No generated CNC or calculation for invalid input", web: result });
    else acceptedChanges.push({ kind: "invalid-input-rejection", excel: oracle.cncProgram, web: Array.from(result.cncProgram) });
  } else if (validExcelNumbers && result.cuttingData) {
    for (const [field, excel] of Object.entries(oracle.cuttingData)) {
      const webValue = result.cuttingData[field];
      if (typeof webValue !== "number" || !Number.isFinite(webValue) || Math.abs(webValue - excel) > 1e-6) differences.push({ field, excel, web: webValue });
    }
    if (!result.tool?.isCustom) exact("selectedToolId", String(result.tool?.id || ""), oracle.selectedToolId);
    const programCheck = compareCncPrograms(Array.from(result.cncProgram), oracle.cncProgram, input.controlSystemId);
    if (programCheck.differences.length) differences.push({ field: "cncProgram", excel: oracle.cncProgram, web: Array.from(result.cncProgram) });
    acceptedChanges.push(...programCheck.accepted);
  } else {
    exact("cncProgram", Array.from(result.cncProgram), oracle.cncProgram);
    if (Boolean(result.cuttingData) !== validExcelNumbers) differences.push({ field: "calculationAvailability", excel: validExcelNumbers, web: Boolean(result.cuttingData) });
  }
  results.push({ id: oracle.id, group: oracle.group, passed: differences.length === 0,
    input, selectedTool: result.tool?.description, excelValidNumbers: validExcelNumbers, errors: Array.from(result.errors),
    webRejectsInput: !result.cuttingData && result.errors.length > 0 && !result.programAnalysis.arcLineCount,
    differences, acceptedChanges });
}
const summary = { provenance: { sourceSha256: archive?.sourceSha256 || entries.find(entry => entry.sourceSha256)?.sourceSha256,
  excelVersion: archive?.excelVersion || process.env.EXCEL_VERSION || "unrecorded", testedAt: new Date().toISOString(),
  coreSha256: createHash("sha256").update(fs.readFileSync(path.join(web, "js/core.js"))).digest("hex"),
  dataSha256: createHash("sha256").update(fs.readFileSync(path.join(web, "data/smiprog-data.js"))).digest("hex"),
  manifestSha256: createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex"),
  oracleSha256: isArchive ? createHash("sha256").update(fs.readFileSync(snapshotSource)).digest("hex") : null
}, catalogue: { tools: catalogue.tools.length, materials: catalogue.materials.length, technicalDifferences: staticDifferences.filter(difference => difference.kind !== "article-spacing-only").length, differences: staticDifferences }, planned: caseIds.size, missing: [...caseIds].filter(id => !results.some(result => result.id === id)), cases: results.length, passed: results.filter(result => result.passed).length,
  failed: results.filter(result => !result.passed).length, groups: {}, results };
summary.exactMatches = results.filter(result => result.passed && !result.acceptedChanges.length).length;
summary.acceptedChangeCases = results.filter(result => result.passed && result.acceptedChanges.length).length;
for (const result of results) {
  const group = summary.groups[result.group] ||= { cases: 0, passed: 0, failed: 0 };
  group.cases++; group[result.passed ? "passed" : "failed"]++;
}
fs.writeFileSync(path.join(snapshotDir, "comparison.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify({ ...summary, missing: summary.missing.length, results: results.filter(result => !result.passed).map(result => process.argv.includes("--details") ? ({ ...result,
  differences: result.differences.map(difference => difference.field === "cncProgram" ? { field: difference.field,
    changedLines: Array.from({ length: Math.max(difference.excel.length, difference.web.length) }, (_, index) => ({ line: index + 1, excel: difference.excel[index], web: difference.web[index] })).filter(line => line.excel !== line.web)
  } : difference)
}) : ({ id: result.id, group: result.group, fields: result.differences.map(difference => difference.field), webRejectsInput: result.webRejectsInput })) }, null, 2));
if (process.argv.includes("--save-oracle")) {
  if (isArchive || summary.missing.length || results.some(result => result.differences.some(difference => difference.field === "oracleInput"))) throw new Error("Capture every requested Excel input before saving the oracle.");
  const capture = JSON.parse(fs.readFileSync(path.join(snapshotSource, "capture-summary.json"), "utf8"));
  if (!capture.sourceUnchanged || entries.filter(entry => caseIds.has(entry.id)).some(entry => entry.sourceSha256 !== capture.sourceSha256)) throw new Error("Source workbook provenance mismatch.");
  fs.writeFileSync(path.join(web, "tests/excel-parity-oracle.json"), JSON.stringify({ schemaVersion: 1,
    sourceWorkbook: manifest.referenceWorkbook, sourceSha256: capture.sourceSha256, sourceUnchanged: true,
    excelVersion: process.env.EXCEL_VERSION || "unrecorded", catalogue, cases: manifest.cases.map(test => entries.find(entry => entry.id === test.id))
  }, null, 2) + "\n");
}
if (process.argv.includes("--save-report")) {
  const browserReport = JSON.parse(fs.readFileSync(path.join(snapshotDir, "browser-comparison.json"), "utf8"));
  if (summary.failed || summary.catalogue.technicalDifferences || summary.missing.length || browserReport.missing.length
    || browserReport.different || browserReport.errors.length || browserReport.checked !== summary.planned) {
    throw new Error("Do not archive a failed or incomplete verification report.");
  }
  if (!browserReport.provenance?.localFrontend || !summary.provenance.oracleSha256
    || ["coreSha256", "dataSha256", "manifestSha256", "oracleSha256"].some(field => (
      browserReport.provenance[field] !== summary.provenance[field]
    ))) throw new Error("Rerun local browser verification against the current code, manifest and native oracle.");
  fs.writeFileSync(path.join(web, "tests/excel-parity-verification.json"), JSON.stringify({ comparison: summary, browser: browserReport }, null, 2) + "\n");
}
if (summary.failed || summary.missing.length || summary.catalogue.technicalDifferences) process.exitCode = 1;
