import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const timings = JSON.parse(fs.readFileSync(path.join(root, "tests/excel-parity-oracle.json")));
const costs = JSON.parse(fs.readFileSync(path.join(root, "tests/compare-cost-oracle.json")));
const url = process.env.SMIPROG_URL || pathToFileURL(path.join(root, "index.html")).href;
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const errors = [];
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url);
  await page.locator('[data-spg-tab="compare"]').click();
  await page.fill("#spg-compare-password", "XL");
  await page.click("#spg-unlock-compare");
  for (const scenario of costs.cases) {
    const a = timings.cases.find(entry => entry.id === scenario.timingCaseA).input;
    const b = timings.cases.find(entry => entry.id === scenario.timingCaseB).input;
    for (const field of ["processId", "controlSystemId", "threadProfileId", "diameter", "pitch", "threadLength", "materialId"]) {
      assert.equal(a[field], b[field], `A/B operations must agree: ${field}`);
    }
    await page.evaluate(({ a, b, scenario }) => {
      const set = (id, value) => {
        const element = document.getElementById(id);
        element.value = value ?? "";
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const fields = { cutterDiameter: "diameter", cuttingEdgeLength: "length", flutes: "flutes",
        cuttingSpeed: "speed", feedPerTooth: "feed", radialPasses: "passes" };
      for (const side of ["a", "b"]) for (const field of ["price", "life", ...Object.values(fields)]) set(`spg-compare-tool-${side}-${field}`, "");
      set("spg-process", a.processId);
      set("spg-control-system", a.controlSystemId);
      set("spg-compare-thread-profile", a.threadProfileId === "m" ? "m-manual" : a.threadProfileId === "g" ? "g-manual" : a.threadProfileId);
      set("spg-compare-material", a.materialId);
      set("spg-compare-diameter", a.diameter);
      set("spg-compare-pitch", a.pitch);
      set("spg-compare-thread-length", a.threadLength);
      set("spg-machine-cost", scenario.machineCost);
      for (const [side, input] of [["a", a], ["b", b]]) {
        set(`spg-compare-tool-${side}`, input.selectedToolId);
        if (input.overrides?.cutterDiameter) set(`spg-compare-tool-${side}`, "__custom_tool__");
        for (const [key, field] of Object.entries(fields)) set(`spg-compare-tool-${side}-${field}`, input.overrides?.[key]);
        set(`spg-compare-tool-${side}-price`, scenario["price" + side.toUpperCase()]);
        set(`spg-compare-tool-${side}-life`, scenario["life" + side.toUpperCase()]);
      }
    }, { a, b, scenario });
    const rows = await page.locator("#spg-cost-data > .spg-compare-result-row").evaluateAll(rows => rows.map(row => ({
      label: row.firstElementChild.textContent,
      values: [...row.querySelectorAll(".spg-compare-cell-value")].map(value => value.textContent),
      differences: [...row.querySelectorAll(".spg-compare-cell-difference")].map(value => value.textContent)
    })));
    const fields = { "Tooling cost per thread": "toolingCostPerThread", "Total cost per thread": "totalCostPerThread" };
    for (const [label, field] of Object.entries(fields)) {
      const row = rows.find(row => row.label === label);
      assert.ok(row, label);
      const format = value => value.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
      assert.deepEqual(row.values, [format(scenario.expectedA[field]), format(scenario.expectedB[field])], scenario.id + " " + field);
      const expectedDifferences = [scenario.expectedB[field] === 0 ? "" : Math.round((scenario.expectedA[field] / scenario.expectedB[field] - 1) * 100) + "%",
        scenario.expectedA[field] === 0 ? "" : Math.round((scenario.expectedB[field] / scenario.expectedA[field] - 1) * 100) + "%"].filter(Boolean);
      assert.deepEqual(row.differences, expectedDifferences, scenario.id + " " + field + " percentages");
    }
    const summary = await page.locator("#spg-compare-summary").textContent();
    const difference = scenario.expectedB.totalCostPerThread - scenario.expectedA.totalCostPerThread;
    if (difference === 0) assert.equal(summary, "Both tools have the same calculated total cost per thread.");
    else {
      const winner = difference < 0 ? "Tool B:" : "Tool A:";
      const saving = Math.abs(difference).toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const baseline = difference < 0 ? scenario.expectedA.totalCostPerThread : scenario.expectedB.totalCostPerThread;
      const percent = Math.round(Math.abs(difference) / baseline * 100);
      assert.ok(summary.startsWith(winner));
      assert.ok(summary.includes(`saves € ${saving} per thread (${percent}% lower total cost)`));
    }
    results.push({ id: scenario.id, passed: true, rows, summary });
  }
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async text => { window.compareCopiedText = text; } } });
  });
  await page.click("#spg-copy-compare-results");
  await page.waitForFunction(() => Boolean(window.compareCopiedText));
  const copied = await page.evaluate(() => window.compareCopiedText);
  assert.ok(copied.includes("SmiCut Internal Thread Milling Compare"));
  assert.ok(copied.includes("Total cost per thread"));
  assert.ok(copied.includes("123,45"));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  fs.mkdirSync(path.join(root, "tmp"), { recursive: true });
  await page.screenshot({ path: path.join(root, "tmp/compare-cost-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.fill("#spg-compare-tool-a-life", "0");
  await page.locator("#spg-compare-tool-a-life").press("Tab");
  assert.match(await page.locator("#spg-compare-summary").textContent(), /valid tool life/);
  const invalidRow = page.locator("#spg-cost-data > .spg-compare-result-row").filter({ has: page.locator(".spg-result-label", { hasText: "Total cost per thread" }) });
  assert.equal(await invalidRow.locator(".spg-compare-cell-value").first().textContent(), "-");
  assert.deepEqual(errors, []);
  const report = { url, cases: results.length, passed: results.every(result => result.passed), invalidLifeRejected: true,
    percentagesAndWinnerVerified: true, copyVerified: true, mobileOverflow: false, errors, results };
  fs.mkdirSync(path.join(root, "tmp"), { recursive: true });
  fs.writeFileSync(path.join(root, "tmp/compare-cost-browser.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
} finally { await browser.close(); }
