import fs from "node:fs";
import { createHash } from "node:crypto";
const reviewedCorrections = JSON.parse(fs.readFileSync(new URL("./cnc-reviewed-corrections.json", import.meta.url), "utf8"));

// Preserved Excel programs stay immutable. Each intentional motion correction is
// pinned to a full reference hash and exact before/after blocks; no numeric tolerance.
export function compareCncPrograms(actual, expected, controlSystemId) {
  const referenceHash = createHash("sha256").update(JSON.stringify(expected)).digest("hex");
  const correction = reviewedCorrections.find(entry => entry.controlSystemId === controlSystemId
    && entry.referenceSha256 === referenceHash);
  const differences = [];
  const accepted = [];
  for (let index = 0; index < Math.max(actual.length, expected.length); index++) {
    const web = actual[index];
    const excel = expected[index];
    if (web === excel) continue;
    const change = { line: index + 1, excel, web };
    const reviewed = correction?.changes.find(entry => entry.line === index + 1
      && entry.excel === excel && entry.corrected === web);
    if (reviewed) {
      accepted.push({ ...change, kind: correction.reason });
      continue;
    }
    const legacySignedAxis = controlSystemId === "heidenhain" && typeof excel === "string"
      && excel.match(/^(\d+ L IZ)\+(-\d+(?:\.\d*)?) FMAX$/);
    if (legacySignedAxis && web === `${legacySignedAxis[1]}${legacySignedAxis[2]} FMAX`) {
      accepted.push({ ...change, kind: "heidenhain-single-axis-sign" });
      continue;
    }
    const excelRapid = typeof excel === "string" && excel.match(/^G00 Z(-?\d+(?:\.\d*)?)$/);
    const webRapid = typeof web === "string" && web.match(/^G00 Z(-?\d+(?:\.\d{0,3})?)$/);
    if (excelRapid && webRapid && Number.isFinite(Number(excelRapid[1]))
      && Number.isFinite(Number(webRapid[1])) && Math.abs(Number(excelRapid[1]) - Number(webRapid[1])) <= 1e-12) {
      accepted.push({ ...change, kind: "excel-float-display-artifact" });
      continue;
    }
    differences.push(change);
  }
  return { differences, accepted };
}

export function rejectsInputSafely(result) {
  return result.errors.length > 0 && result.cuttingData === null && result.costData === null
    && result.canGenerateCncProgram === false
    && JSON.stringify(result.cncProgram) === JSON.stringify([
      "The program doesn't accept your choice.", "Please, test with other values."
    ]);
}
