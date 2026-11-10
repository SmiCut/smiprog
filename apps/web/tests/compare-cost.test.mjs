import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

const context = { window: {} };
vm.createContext(context);
for (const file of ["../data/smiprog-data.js", "../js/core.js"]) vm.runInContext(fs.readFileSync(new URL(file, import.meta.url), "utf8"), context);
const { SmiProgCore: core, SmiProgData: data } = context.window;
const oracleFile = new URL("./excel-parity-oracle.json", import.meta.url);
const timings = JSON.parse(fs.readFileSync(oracleFile));
const costs = JSON.parse(fs.readFileSync(new URL("./compare-cost-oracle.json", import.meta.url)));

test("Compare uses the same native timing oracle as the CNC audit", () => {
  assert.equal(costs.sourceUnchanged, true);
  assert.equal(costs.engine, "Microsoft Excel / calculate full");
  assert.equal(costs.timingOracleSha256, createHash("sha256").update(fs.readFileSync(oracleFile)).digest("hex"));
});

for (const scenario of costs.cases) {
  test(scenario.id, () => {
    for (const side of ["A", "B"]) {
      const reference = timings.cases.find(entry => entry.id === scenario["timingCase" + side]);
      const input = { ...reference.input, machineCost: scenario.machineCost, toolLife: scenario["life" + side],
        overrides: { ...reference.input.overrides, toolPrice: scenario["price" + side] } };
      const result = core.calculate(input, data, { includeInternalPosts: true });
      assert.equal(result.errors.length, 0);
      assert.equal(result.cuttingData.machiningTime, reference.cuttingData.machiningTime);
      for (const [field, value] of Object.entries(scenario["expected" + side])) {
        assert.equal(typeof value, "number");
        assert.ok(Number.isFinite(result.costData[field]));
        assert.ok(Math.abs(result.costData[field] - value) <= 1e-8, `${side} ${field}: Excel ${value}, web ${result.costData[field]}`);
      }
    }
  });
}

test("cost overrides distinguish zero from empty and reject invalid values", () => {
  const input = timings.cases[0].input;
  const base = core.calculate(input, data);
  assert.equal(base.costData.toolPrice, base.tool.priceEur);
  assert.equal(core.calculate({ ...input, overrides: { toolPrice: 0 } }, data).costData.toolPrice, 0);
  for (const changes of [{ machineCost: -1 }, { machineCost: "NaN" }, { toolLife: 0 }, { toolLife: -1 },
    { toolLife: "Infinity" }, { overrides: { toolPrice: -1 } }]) {
    const result = core.calculate({ ...input, ...changes }, data);
    assert.ok(result.errors.length);
    assert.equal(result.costData, null);
  }
});

test("Compare with no allowed reference keeps time and machine cost without a catalogue-price fallback", () => {
  const input = timings.cases[0].input;
  const locked = { comparePricing: { referencePrice: null } };
  const result = core.calculate({ ...input, overrides: {} }, data, locked);
  assert.equal(result.errors.length, 0);
  assert.ok(result.cuttingData.machiningTime > 0);
  assert.ok(result.costData.machineCostPerThread > 0);
  assert.equal(result.costData.toolPrice, null);
  assert.equal(result.costData.toolingCostPerThread, null);
  assert.equal(result.costData.totalCostPerThread, null);
  const zero = core.calculate({ ...input, overrides: { toolPrice: 0 } }, data, locked);
  assert.equal(zero.costData.totalCostPerThread, zero.costData.machineCostPerThread);
  const priced = core.calculate({ ...input, overrides: {} }, data, { comparePricing: { referencePrice: 2460 } });
  assert.equal(priced.costData.toolPrice, 2460);
  const custom = core.calculate({ ...input, overrides: { cutterDiameter: 5, cuttingEdgeLength: 10, flutes: 3 } }, data,
    { comparePricing: { referencePrice: 2460 } });
  assert.equal(custom.tool.isCustom, true);
  assert.equal(custom.costData.toolPrice, null);
  for (const price of ["NaN", "Infinity", -1]) {
    const invalid = core.calculate({ ...input, overrides: { toolPrice: price } }, data,
      { comparePricing: { referencePrice: 227.8 } });
    assert.ok(invalid.errors.length);
    assert.equal(invalid.costData, null);
  }
});
