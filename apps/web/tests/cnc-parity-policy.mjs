// Narrow, documented display corrections. Never normalize pass counts or motion values.
export function compareCncPrograms(actual, expected, controlSystemId) {
  const differences = [];
  const accepted = [];
  for (let index = 0; index < Math.max(actual.length, expected.length); index++) {
    const web = actual[index];
    const excel = expected[index];
    if (web === excel) continue;
    const change = { line: index + 1, excel, web };
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
