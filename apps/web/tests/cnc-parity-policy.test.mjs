import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { compareCncPrograms, rejectsInputSafely } from "./cnc-parity-policy.mjs";

test("exact CNC programs have no accepted exceptions", () => {
  assert.deepEqual(compareCncPrograms(["G00 Z1.234"], ["G00 Z1.234"], "fanuc"), { differences: [], accepted: [] });
});

test("only the same negative Heidenhain axis may lose Excel's extra plus sign", () => {
  const result = compareCncPrograms(["10 L IZ-1 FMAX"], ["10 L IZ+-1 FMAX"], "heidenhain");
  assert.equal(result.differences.length, 0);
  assert.equal(result.accepted[0].kind, "heidenhain-single-axis-sign");
  for (const [web, control] of [["10 L IZ+1 FMAX", "heidenhain"], ["10 L IZ-1.001 FMAX", "heidenhain"],
    ["11 L IZ-1 FMAX", "heidenhain"], ["10 L IZ-1 FMAX", "fanuc"]]) {
    assert.equal(compareCncPrograms([web], ["10 L IZ+-1 FMAX"], control).differences.length, 1);
  }
});

test("float display exception cannot hide a changed motion or pass count", () => {
  const result = compareCncPrograms(["G00 Z1.234"], ["G00 Z1.234000000000001"], "fanuc");
  assert.equal(result.differences.length, 0);
  assert.equal(result.accepted[0].kind, "excel-float-display-artifact");
  for (const [web, excel] of [["G00 Z1.235", "G00 Z1.234"], ["G00 Z-1.234", "G00 Z1.234"],
    ["G00 Z1.2340001", "G00 Z1.234000100000001"], ["#100=1", "#100=10"],
    ["10 FN 0: Q1 =+1", "10 FN 0: Q1 =+10"], ["G01 Z1.234", "G01 Z1.234000000000001"]]) {
    assert.equal(compareCncPrograms([web], [excel], "heidenhain").differences.length, 1);
  }
  assert.equal(compareCncPrograms([], ["G00 Z1"], "fanuc").differences.length, 1);
  assert.equal(compareCncPrograms(["G00 Z1", "G00 Z2"], ["G00 Z1"], "fanuc").differences.length, 1);
});

test("invalid input must never yield cutting data or a usable CNC program", () => {
  const result = { errors: ["Invalid diameter"], cuttingData: null, costData: null, canGenerateCncProgram: false,
    cncProgram: ["The program doesn't accept your choice.", "Please, test with other values."] };
  assert.equal(rejectsInputSafely(result), true);
  for (const change of [{ errors: [] }, { cuttingData: { spindleSpeed: 1000 } }, { costData: {} },
    { canGenerateCncProgram: true }, { cncProgram: ["G00 Z-10"] }]) {
    assert.equal(rejectsInputSafely({ ...result, ...change }), false);
  }
});

test("the real core only marks supported, valid CNC output as available", () => {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ["../data/smiprog-data.js", "../js/core.js"]) {
    vm.runInContext(fs.readFileSync(new URL(file, import.meta.url), "utf8"), context);
  }
  const { SmiProgCore: core, SmiProgData: data } = context.window;
  const manifest = JSON.parse(fs.readFileSync(new URL("./excel-parity-cases.json", import.meta.url), "utf8"));
  const input = manifest.cases[0].input;
  assert.equal(core.calculate(input, data).canGenerateCncProgram, true);
  for (const control of data.controlSystems.filter(control => !control.uiVisible)) {
    assert.equal(core.calculate({ ...input, controlSystemId: control.id }, data).canGenerateCncProgram, false);
  }
  for (const change of [{ threadHand: "left" }, { processId: "lathe-live-tool" }]) {
    const result = core.calculate({ ...input, controlSystemId: "heidenhain", ...change }, data, { includeInternalPosts: true });
    assert.equal(result.canGenerateCncProgram, false);
    assert.equal(result.cncProgram.some(line => /\b(?:CP IPA|G0[123])\b/.test(line)), false);
  }
  for (const entry of manifest.cases.filter(entry => entry.group === "invalid-inputs")) {
    assert.equal(rejectsInputSafely(core.calculate(entry.input, data)), true, entry.id);
  }
});

test("reviewed motion corrections cannot hide changed feeds, counts or unreviewed Z values", () => {
  const corrections = JSON.parse(fs.readFileSync(new URL('./cnc-reviewed-corrections.json', import.meta.url)));
  const native = JSON.parse(fs.readFileSync(new URL('./excel-parity-oracle.json', import.meta.url)));
  const reference = native.cases.find(e => e.id === 'heidenhain-axial-length-100').cncProgram;
  const correction = corrections.find(e => e.cases.includes('heidenhain-axial-length-100'));
  const corrected = reference.slice();
  for (const change of correction.changes) corrected[change.line - 1] = change.corrected;
  assert.equal(compareCncPrograms(corrected, reference, 'heidenhain').differences.length, 0);
  for (const [before, after] of [['IZ+3.624', 'IZ+3.625'], ['Q1 =+10', 'Q1 =+9'], ['F156', 'F157']]) {
    // Use a concrete feed token from this oracle instead of depending on one feed value.
    const mutated = before.startsWith('F') ? corrected.map(l => l.replace(/ F(\d+)$/, (_, f) => ` F${Number(f)+1}`))
      : corrected.map(l => l.replace(before, after));
    assert.notDeepEqual(mutated, corrected);
    assert.ok(compareCncPrograms(mutated, reference, 'heidenhain').differences.length);
  }
  const changedReference = reference.map(l => l.replace('Q1 =+10', 'Q1 =+9'));
  assert.ok(compareCncPrograms(corrected, changedReference, 'heidenhain').differences.length);
});
