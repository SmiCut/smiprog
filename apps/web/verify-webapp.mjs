import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { compareCncPrograms } from "./tests/cnc-parity-policy.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1
});

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

const appUrl = process.env.SMIPROG_URL || pathToFileURL(path.resolve("index.html")).href;
const fixturesDir = path.resolve("tests/golden");
const goldenFixtureFile = "fanuc-original-default.json";
const fixtureFiles = (await fs.readdir(fixturesDir))
  .filter((file) => file.endsWith(".json"))
  .sort();
const goldenFixture = JSON.parse(await fs.readFile(path.join(fixturesDir, goldenFixtureFile), "utf8"));
const templateFixtures = (await Promise.all(
  fixtureFiles
    .filter((file) => file !== goldenFixtureFile)
    .map(async (file) => JSON.parse(await fs.readFile(path.join(fixturesDir, file), "utf8")))
)).filter((fixture) => (
  fixture.status !== "todo"
  && ["fanuc", "heidenhain"].includes(fixture.input?.controlSystemId)
));

function getUiThreadProfileId(fixtureProfileId) {
  if (fixtureProfileId === "m") return "m-manual";
  if (fixtureProfileId === "g") return "g-manual";
  return fixtureProfileId || "m";
}

async function fillDimension(selector, value) {
  const textValue = String(value);
  const readonly = await page.$eval(selector, (input) => input.readOnly);
  if (!readonly) {
    await page.fill(selector, textValue);
    return;
  }

  await page.$eval(selector, (input, nextValue) => {
    input.value = nextValue;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, textValue);
}

async function fillFixtureInput(fixture) {
  const overrides = fixture.input.overrides || {};
  await page.selectOption("#spg-process", fixture.input.processId || "machining-center");
  await page.selectOption("#spg-control-system", fixture.input.controlSystemId || "fanuc");
  await page.selectOption("#spg-thread-hand", fixture.input.threadHand || "right");
  await page.selectOption("#spg-thread-profile", getUiThreadProfileId(fixture.input.threadProfileId));
  await page.selectOption("#spg-material", fixture.input.materialId || "material-14");
  await page.$eval("#spg-program-template", (select, programVariant) => {
    select.value = programVariant || "";
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, fixture.input.programVariant || "");
  await fillDimension("#spg-diameter", fixture.input.diameter);
  await fillDimension("#spg-pitch", fixture.input.pitch);
  await page.fill("#spg-thread-length", String(fixture.input.threadLength));
  await page.fill("#spg-safety-distance", String(fixture.input.safetyDistance));
  const usesCustomTool = Boolean(overrides.cutterDiameter || overrides.cuttingEdgeLength || overrides.flutes);
  await page.$eval("#spg-tool", (select, selectedToolId) => {
    const values = Array.from(select.options).map((option) => option.value);
    const nextValue = selectedToolId && values.includes(String(selectedToolId))
      ? String(selectedToolId)
      : (values[0] || "");
    select.value = nextValue;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }, fixture.input.selectedToolId || "");
  if (usesCustomTool) {
    await page.selectOption("#spg-tool", "__custom_tool__");
    await page.fill("#spg-override-cutter-diameter", String(overrides.cutterDiameter || ""));
    await page.fill("#spg-override-edge-length", String(overrides.cuttingEdgeLength || ""));
    await page.fill("#spg-override-flutes", String(overrides.flutes || ""));
  }
  await page.fill("#spg-override-feed", String(overrides.feedPerTooth || ""));
  await page.fill("#spg-override-radial-passes", String(overrides.radialPasses || ""));
}

function collectCncMismatches(fixture, cncText) {
  return compareCncPrograms(cncText.split("\n"), fixture.expectedCncProgram, fixture.input.controlSystemId).differences;
}

await page.goto(appUrl, { waitUntil: "networkidle" });

const title = await page.title();
const tool = await page.locator("#spg-tool option:checked").textContent();
const cnc = await page.locator("#spg-cnc-program").inputValue();
const cncDisclaimerText = await page.locator("#spg-cnc-disclaimer").textContent();
const programTemplateOptions = await page.locator("#spg-program-template option").count();
const controlSystemOptions = await page.locator("#spg-control-system option").evaluateAll((options) => (
  options.map((option) => ({ value: option.value, label: option.textContent }))
));

const desktopMainScreenshotPath = path.resolve("tmp/smiprog-webapp-desktop-main.png");
await fs.mkdir(path.dirname(desktopMainScreenshotPath), { recursive: true });
await page.screenshot({ path: desktopMainScreenshotPath, fullPage: true });
await page.click("[data-spg-tab=\"main\"]");

const initialThreadLengthUi = await page.evaluate(() => ({
  threadLengthValue: document.querySelector("#spg-thread-length").value,
  toolText: document.querySelector("#spg-tool").selectedOptions[0]?.textContent || "",
  toolFieldHeight: document.querySelector("#spg-tool-field").getBoundingClientRect().height,
  toolLinkText: document.querySelector("#spg-tool-link")?.textContent?.trim() || "",
  toolLinkHref: document.querySelector("#spg-tool-link")?.getAttribute("href") || "",
  noteText: document.querySelector("#spg-note-message")?.textContent || "",
  noteVisible: !document.querySelector(".spg-note").hidden && getComputedStyle(document.querySelector(".spg-note")).display !== "none",
  noteInsideInputs: Boolean(document.querySelector(".spg-inputs-card .spg-note #spg-note-message"))
}));
await page.fill("#spg-thread-length", "999");
const noMatchingToolUi = await page.evaluate(() => ({
  toolText: document.querySelector("#spg-tool").selectedOptions[0]?.textContent || "",
  toolLinkText: document.querySelector("#spg-tool-link")?.textContent?.trim() || "",
  toolLinkHref: document.querySelector("#spg-tool-link")?.getAttribute("href") || "",
  noteText: document.querySelector("#spg-note-message")?.textContent || "",
  noteVisible: !document.querySelector(".spg-note").hidden && getComputedStyle(document.querySelector(".spg-note")).display !== "none"
}));
await page.fill("#spg-thread-length", "30");
await page.waitForFunction(() => {
  const image = document.querySelector(".spg-thread-mill-image");
  return image && image.complete;
});
const selectedToolLinkUi = await page.evaluate(() => ({
  toolText: document.querySelector("#spg-tool").selectedOptions[0]?.textContent || "",
  toolFieldHeight: document.querySelector("#spg-tool-field").getBoundingClientRect().height,
  toolLinkText: document.querySelector("#spg-tool-link")?.textContent?.trim() || "",
  toolLinkHref: document.querySelector("#spg-tool-link")?.href || "",
  toolLinkDisabled: document.querySelector("#spg-tool-link")?.classList.contains("spg-tool-link-disabled") || false,
  toolImageSrc: document.querySelector("#spg-tool-summary .spg-thread-mill-image")?.getAttribute("src") || "",
  toolImageLoaded: (document.querySelector("#spg-tool-summary .spg-thread-mill-image")?.naturalWidth || 0) > 0,
  toolTypeText: Array.from(document.querySelectorAll(".spg-tool-type-row .spg-result-value"))
    .map((element) => element.textContent?.trim() || "")
    .join(""),
  noteText: document.querySelector("#spg-note-message")?.textContent || ""
}));
const selectedToolScreenshotPath = path.resolve("tmp/smiprog-webapp-selected-tool.png");
await page.screenshot({ path: selectedToolScreenshotPath, fullPage: true });
await page.setViewportSize({ width: 390, height: 1300 });
const selectedToolMobileScreenshotPath = path.resolve("tmp/smiprog-webapp-selected-tool-mobile.png");
await page.screenshot({ path: selectedToolMobileScreenshotPath, fullPage: true });
await page.setViewportSize({ width: 1440, height: 1100 });
await page.selectOption("#spg-tool", "__custom_tool__");
await page.fill("#spg-override-cutter-diameter", "7");
await page.fill("#spg-override-edge-length", "1.5");
await page.fill("#spg-override-flutes", "3");
await page.waitForFunction(() => document.querySelector("#spg-tool-summary .spg-thread-mill-image")?.getAttribute("src")?.includes("NS06045D16_P60_AC.png"));
const customSingleToothImageSrc = await page.locator("#spg-tool-summary .spg-thread-mill-image").getAttribute("src");
await page.fill("#spg-override-edge-length", "3");
await page.waitForFunction(() => document.querySelector("#spg-tool-summary .spg-thread-mill-image")?.getAttribute("src")?.includes("NM06045E16_1.0ISO_AC.png"));
const customTwoTeethImageSrc = await page.locator("#spg-tool-summary .spg-thread-mill-image").getAttribute("src");
const customToolImageUi = {
  singleToothImageSrc: customSingleToothImageSrc || "",
  twoTeethImageSrc: customTwoTeethImageSrc || ""
};
await page.fill("#spg-thread-length", "");

const standardThreadUi = await page.evaluate(() => ({
  hasCustomSize: Array.from(document.querySelector("#spg-thread-size").options).some((option) => option.textContent === "Custom size"),
  diameterReadonly: document.querySelector("#spg-diameter").readOnly,
  pitchReadonly: document.querySelector("#spg-pitch").readOnly
}));
await page.selectOption("#spg-thread-profile", "m-manual");
const manualThreadUi = await page.evaluate(() => ({
  threadSizeText: document.querySelector("#spg-thread-size").selectedOptions[0]?.textContent || "",
  threadSizeDisabled: document.querySelector("#spg-thread-size").disabled,
  diameterReadonly: document.querySelector("#spg-diameter").readOnly,
  pitchReadonly: document.querySelector("#spg-pitch").readOnly
}));
async function getThreadSizeOptionLabels(profileId) {
  await page.selectOption("#spg-thread-profile", profileId);
  return page.evaluate(() => Array.from(document.querySelector("#spg-thread-size").options).map((option) => option.textContent?.trim() || ""));
}
const extendedThreadOptionsUi = {
  metricCoarse: await getThreadSizeOptionLabels("m"),
  unc: await getThreadSizeOptionLabels("unc"),
  unf: await getThreadSizeOptionLabels("unf")
};
await page.selectOption("#spg-thread-profile", "m");
await page.fill("#spg-thread-length", "12");

await page.click("[data-spg-tab=\"compare\"]");
await page.fill("#spg-compare-password", "XL");
await page.click("#spg-unlock-compare");

const compareVisible = await page.locator("#spg-compare-content").isVisible();
const costRows = await page.locator("#spg-cost-data .spg-result-row").count();

const compareScreenshotPath = path.resolve("tmp/smiprog-webapp-desktop-compare.png");
await page.screenshot({ path: compareScreenshotPath, fullPage: true });
await page.setViewportSize({ width: 390, height: 1800 });
const compareMobileScreenshotPath = path.resolve("tmp/smiprog-webapp-mobile-compare.png");
await page.screenshot({ path: compareMobileScreenshotPath, fullPage: true });
await page.setViewportSize({ width: 1440, height: 1100 });

await page.click("[data-spg-tab=\"main\"]");
await page.selectOption("#spg-material", "material-3");
await page.selectOption("#spg-thread-profile", "m");
await page.selectOption("#spg-thread-size", { label: "M10" });
await page.fill("#spg-thread-length", "12");
await page.selectOption("#spg-tool", "222");
const mainCuttingDataUi = await page.evaluate(() => ({
  machiningTimeText: document.querySelector("#spg-final-machining-time")?.textContent || ""
}));
await page.click("[data-spg-tab=\"compare\"]");
await page.selectOption("#spg-compare-material", "material-3");
await page.selectOption("#spg-compare-thread-profile", "m");
await page.selectOption("#spg-compare-thread-size", { label: "M10" });
await page.fill("#spg-compare-thread-length", "12");
await page.selectOption("#spg-compare-tool-a", "67");
await page.selectOption("#spg-compare-tool-b", "410");
await page.selectOption("#spg-compare-tool-a", "__custom_tool__");
await page.fill("#spg-compare-tool-a-diameter", "7.5");
await page.fill("#spg-compare-tool-a-length", "32");
await page.fill("#spg-compare-tool-a-flutes", "5");
await page.locator("#spg-compare-tool-a-flutes").blur();
const compareNsCustomTimingUi = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll("#spg-cost-data .spg-compare-result-row"));
  const timeRow = rows.find((row) => row.querySelector(".spg-result-label")?.textContent?.toLowerCase().includes("time to mill"));
  return {
    timeText: timeRow?.textContent || "",
    toolAType: document.querySelector("#spg-compare-tool-a-type")?.textContent || ""
  };
});
await page.selectOption("#spg-compare-tool-a", "415");
await page.evaluate(() => {
  ["#spg-compare-tool-a-diameter", "#spg-compare-tool-a-length", "#spg-compare-tool-a-flutes"].forEach((selector) => {
    const input = document.querySelector(selector);
    if (!input) return;
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

await page.selectOption("#spg-compare-tool-a", "__custom_tool__");
const compareCustomMissingUi = await page.evaluate(() => ({
  diameterInSummary: Boolean(document.querySelector("#spg-compare-tool-a-summary #spg-compare-tool-a-diameter")),
  noteText: document.querySelector("#spg-compare-summary")?.textContent || "",
  resultText: document.querySelector("#spg-cost-data")?.textContent || ""
}));
await page.fill("#spg-compare-tool-a-diameter", "7");
await page.fill("#spg-compare-tool-a-length", "18");
await page.fill("#spg-compare-tool-a-flutes", "3");
await page.locator("#spg-compare-tool-a-flutes").blur();
const compareCustomFilledUi = await page.evaluate(() => ({
  diameterInSummary: Boolean(document.querySelector("#spg-compare-tool-a-summary #spg-compare-tool-a-diameter")),
  resultText: document.querySelector("#spg-cost-data")?.textContent || ""
}));

await page.click("#spg-compare-tool-a-price");
await page.keyboard.type("9");
const compareInputFocusUi = await page.evaluate(() => ({
  activeId: document.activeElement?.id || "",
  value: document.querySelector("#spg-compare-tool-a-price")?.value || ""
}));
const compareOwnValueDraftReferenceUi = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll("#spg-cost-data .spg-compare-result-row"));
  const priceRow = rows.find((row) => row.querySelector(".spg-result-label")?.textContent?.includes("Tooling cost"));
  const referenceValue = priceRow?.children[1]?.querySelector(".spg-compare-cell-value");
  return {
    referenceText: referenceValue?.textContent || "",
    referenceMuted: referenceValue?.classList.contains("spg-result-value-muted") || false,
    inputValue: document.querySelector("#spg-compare-tool-a-price")?.value || ""
  };
});
await page.keyboard.press("Enter");
const compareOwnValueReferenceUi = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll("#spg-cost-data .spg-compare-result-row"));
  const priceRow = rows.find((row) => row.querySelector(".spg-result-label")?.textContent?.includes("Tooling cost"));
  const referenceValue = priceRow?.children[1]?.querySelector(".spg-compare-cell-value");
  return {
    referenceText: referenceValue?.textContent || "",
    referenceMuted: referenceValue?.classList.contains("spg-result-value-muted") || false,
    inputValue: document.querySelector("#spg-compare-tool-a-price")?.value || ""
  };
});

await page.click("[data-spg-tab=\"information\"]");
const informationUi = await page.evaluate(() => ({
  activeTab: document.querySelector(".spg-tab-active")?.textContent?.trim() || "",
  panelVisible: !document.querySelector("#spg-information-panel").hidden && getComputedStyle(document.querySelector("#spg-information-panel")).display !== "none",
  warningText: document.querySelector(".spg-info-warning")?.textContent?.replace(/\s+/g, " ").trim() || "",
  cardCount: document.querySelectorAll(".spg-info-card").length,
  hasToolCompensation: Array.from(document.querySelectorAll(".spg-info-card h2")).some((heading) => heading.textContent?.trim() === "Tool Compensation"),
  hasTaperedThreads: Array.from(document.querySelectorAll(".spg-info-card h2")).some((heading) => heading.textContent?.trim() === "Tapered Threads")
}));
const informationScreenshotPath = path.resolve("tmp/smiprog-webapp-information.png");
await page.screenshot({ path: informationScreenshotPath, fullPage: true });

await page.setViewportSize({ width: 390, height: 1100 });
await page.click("[data-spg-tab=\"main\"]");
const mobileLayoutColumns = await page.locator("#spg-main-panel .spg-layout").evaluate((element) => getComputedStyle(element).gridTemplateColumns);
const mobileScreenshotPath = path.resolve("tmp/smiprog-webapp-mobile-main.png");
await page.screenshot({ path: mobileScreenshotPath, fullPage: true });

await page.setViewportSize({ width: 1440, height: 1100 });
await fillFixtureInput(goldenFixture);
const goldenUiCnc = await page.locator("#spg-cnc-program").inputValue();
const goldenUiMismatches = collectCncMismatches(goldenFixture, goldenUiCnc);
const goldenValidNoteUi = await page.evaluate(() => ({
  noteText: document.querySelector("#spg-note-message")?.textContent || "",
  noteVisible: !document.querySelector(".spg-note").hidden && getComputedStyle(document.querySelector(".spg-note")).display !== "none"
}));
const goldenUiScreenshotPath = path.resolve("tmp/smiprog-webapp-golden-ui.png");
await page.screenshot({ path: goldenUiScreenshotPath, fullPage: true });

await page.selectOption("#spg-thread-hand", "left");
const leftHandUi = await page.evaluate(() => {
  const cncText = document.querySelector("#spg-cnc-program")?.value || "";
  const lines = cncText.split("\n");
  return {
    selectedText: document.querySelector("#spg-thread-hand")?.selectedOptions[0]?.textContent || "",
    cncText,
    firstRapidLine: lines[1] || "",
    hasNegativeHelixZ: lines.some((line) => /^G0[23]\b/.test(line) && /\bZ-/.test(line)),
    hasPositiveHelixZ: lines.some((line) => /^G0[23]\b/.test(line) && /\bZ(?!-)/.test(line)),
    machiningTimeText: document.querySelector("#spg-final-machining-time")?.textContent || ""
  };
});
await page.selectOption("#spg-thread-hand", "right");

const templateUiMismatches = [];
for (const fixture of templateFixtures) {
  await fillFixtureInput(fixture);
  const cncText = await page.locator("#spg-cnc-program").inputValue();
  const mismatches = collectCncMismatches(fixture, cncText);
  if (mismatches.length) {
    templateUiMismatches.push({
      name: fixture.name,
      programVariant: fixture.input.programVariant,
      mismatches
    });
  }
}

const threadSelectorMismatches = [];
if (standardThreadUi.hasCustomSize) {
  threadSelectorMismatches.push("Standard thread profiles must not expose Custom size.");
}
if (!standardThreadUi.diameterReadonly || !standardThreadUi.pitchReadonly) {
  threadSelectorMismatches.push("Standard thread profiles must lock diameter and pitch/TPI inputs.");
}
if (manualThreadUi.threadSizeText !== "Manual size" || !manualThreadUi.threadSizeDisabled) {
  threadSelectorMismatches.push("Manual thread profiles must show a disabled Manual size selector.");
}
if (manualThreadUi.diameterReadonly || manualThreadUi.pitchReadonly) {
  threadSelectorMismatches.push("Manual thread profiles must allow diameter and pitch/TPI editing.");
}
[
  ["metricCoarse", ["M1", "M1.1", "M1.2", "M1.4", "M1.6", "M1.8"]],
  ["unc", ["No. 1-64 UNC"]],
  ["unf", ["No. 0-80 UNF", "No. 1-72 UNF"]]
].forEach(([profileId, requiredLabels]) => {
  requiredLabels.forEach((label) => {
    if (!extendedThreadOptionsUi[profileId].includes(label)) {
      threadSelectorMismatches.push(`${profileId} must include ${label}.`);
    }
  });
});

const toolNoteMismatches = [];
if (initialThreadLengthUi.threadLengthValue !== "12") {
  toolNoteMismatches.push("Thread length must start with 12 on first load.");
}
if (initialThreadLengthUi.toolText === "Enter thread length" || initialThreadLengthUi.toolText === "No matching tool") {
  toolNoteMismatches.push("Tool selector must select a matching tool on first load.");
}
if (initialThreadLengthUi.noteText !== "") {
  toolNoteMismatches.push("Initial valid input must not show a note message.");
}
if (!initialThreadLengthUi.noteVisible) {
  toolNoteMismatches.push("Initial note frame must be visible.");
}
if (!initialThreadLengthUi.noteInsideInputs) {
  toolNoteMismatches.push("Note frame must be placed under the input/tool section.");
}
if (noMatchingToolUi.toolText !== "No matching tool") {
  toolNoteMismatches.push("Tool selector must show No matching tool when no tool fits selected thread length.");
}
if (!noMatchingToolUi.noteText.includes("selected thread and thread length")) {
  toolNoteMismatches.push("No-matching-tool note must mention selected thread and thread length.");
}
if (!noMatchingToolUi.noteVisible) {
  toolNoteMismatches.push("No-matching-tool note frame must be visible.");
}
if (selectedToolLinkUi.toolLinkText !== "➜ See tool page for all dimensions and 3D STEP file") {
  toolNoteMismatches.push("Selected standard tool must show the tool page link text.");
}
if (!/^https:\/\/id\.smicut\.com\/0\d{13}$/.test(selectedToolLinkUi.toolLinkHref)) {
  toolNoteMismatches.push("Selected standard tool must link to the SmiCut ID EAN page.");
}
if (selectedToolLinkUi.toolLinkDisabled) {
  toolNoteMismatches.push("Selected standard tool link must be enabled.");
}
if (!selectedToolLinkUi.toolImageSrc.includes("NB08075D21_1.5ISO_AC.png") || !selectedToolLinkUi.toolImageLoaded) {
  toolNoteMismatches.push("Selected standard tool must show the linked thread mill image.");
}
if (selectedToolLinkUi.toolTypeText !== "Solid Carbide Thread Mill, ThreadBurr") {
  toolNoteMismatches.push("Selected NB tool must show the Solid Carbide Thread Mill, ThreadBurr type.");
}
if (!customToolImageUi.singleToothImageSrc.includes("NS06045D16_P60_AC.png")) {
  toolNoteMismatches.push("Custom tool image must switch to NS when cutting length equals pitch.");
}
if (!customToolImageUi.twoTeethImageSrc.includes("NM06045E16_1.0ISO_AC.png")) {
  toolNoteMismatches.push("Custom tool image must switch to NM when cutting length is double pitch.");
}
if (Math.abs(selectedToolLinkUi.toolFieldHeight - initialThreadLengthUi.toolFieldHeight) > 2) {
  toolNoteMismatches.push("Tool field height must stay stable between empty and selected tool states.");
}
if (noMatchingToolUi.toolLinkHref) {
  toolNoteMismatches.push("Tool page link must not be active when no standard tool is selected.");
}
if (goldenValidNoteUi.noteText !== "") {
  toolNoteMismatches.push("Valid Fanuc input must keep the note text empty.");
}
if (!goldenValidNoteUi.noteVisible) {
  toolNoteMismatches.push("Valid Fanuc input must keep the note frame visible.");
}

const informationMismatches = [];
if (informationUi.activeTab !== "Information" || !informationUi.panelVisible) {
  informationMismatches.push("Information tab must open the information panel.");
}
if (!informationUi.warningText.includes("recommended starting data")) {
  informationMismatches.push("Information warning must explain recommended starting data.");
}
if (informationUi.cardCount < 8) {
  informationMismatches.push("Information panel must include the adapted guidance sections.");
}
if (!informationUi.hasToolCompensation || !informationUi.hasTaperedThreads) {
  informationMismatches.push("Information panel must include key tooling and tapered thread sections.");
}

const compareMismatches = [];
const mainCuttingDataMismatches = [];
const threadHandMismatches = [];
const controlSystemMismatches = [];
const controlSystemValues = controlSystemOptions.map((option) => option.value);
if (controlSystemValues.length !== 2 || !controlSystemValues.includes("fanuc") || !controlSystemValues.includes("heidenhain")) {
  controlSystemMismatches.push("Control-system selector must show Fanuc and Heidenhain in the pre-launch UI.");
}
if (!controlSystemOptions.some((option) => option.value === "fanuc" && option.label.includes("Fanuc"))) {
  controlSystemMismatches.push("Released Fanuc control option must stay visible.");
}
if (!controlSystemOptions.some((option) => option.value === "heidenhain" && option.label.includes("Heidenhain"))) {
  controlSystemMismatches.push("Heidenhain control option must be visible in the pre-launch UI.");
}
if (!cncDisclaimerText.includes("simulation") || !cncDisclaimerText.includes("single block")) {
  controlSystemMismatches.push("CNC program view must include the phase 1 verification disclaimer.");
}
if (!mainCuttingDataUi.machiningTimeText.includes("9,5 seconds")) {
  mainCuttingDataMismatches.push("Main cutting data must show decimal machining time with comma formatting.");
}
if (leftHandUi.selectedText !== "Left-hand thread") {
  threadHandMismatches.push("Thread hand selector must expose Left-hand thread.");
}
if (!leftHandUi.hasNegativeHelixZ || leftHandUi.hasPositiveHelixZ) {
  threadHandMismatches.push("Left-hand Fanuc program must use negative Z motion in the helical G03 moves.");
}
if (leftHandUi.firstRapidLine === goldenFixture.expectedCncProgram[1]) {
  threadHandMismatches.push("Left-hand Fanuc program must start above the deepest right-hand start point.");
}
const goldenMachiningTimeText = String(goldenFixture.expectedCuttingData.machiningTime).replace(".", ",");
if (!leftHandUi.machiningTimeText.includes(`${goldenMachiningTimeText} seconds`)) {
  threadHandMismatches.push("Thread hand must not change cutting data or machining time.");
}
if (!compareNsCustomTimingUi.timeText.includes("9,5") || !compareNsCustomTimingUi.timeText.includes("4,8")) {
  compareMismatches.push("Compare custom tool dimensions must preserve the selected NS base tool type for machining time.");
}
if (compareInputFocusUi.activeId !== "spg-compare-tool-a-price" || compareInputFocusUi.value !== "9") {
  compareMismatches.push("Compare own-value input must keep focus while typing.");
}
if (!compareOwnValueDraftReferenceUi.referenceText.includes("€") || compareOwnValueDraftReferenceUi.referenceText === "-" || compareOwnValueDraftReferenceUi.referenceMuted || compareOwnValueDraftReferenceUi.inputValue !== "9") {
  compareMismatches.push("Compare own-value rows must keep the recommended value visible and unmuted while typing.");
}
if (!compareOwnValueReferenceUi.referenceText.includes("€") || compareOwnValueReferenceUi.referenceText === "-" || !compareOwnValueReferenceUi.referenceMuted || compareOwnValueReferenceUi.inputValue !== "9") {
  compareMismatches.push("Compare own-value rows must keep the recommended value visible and muted after confirmation.");
}
if (!compareCustomMissingUi.diameterInSummary || !compareCustomMissingUi.noteText.includes("custom tool dimensions")) {
  compareMismatches.push("Compare custom tool dimensions must move dimension inputs into the Tool A card and request missing dimensions.");
}
if (!compareCustomFilledUi.diameterInSummary || !compareCustomFilledUi.resultText.includes("Total cost per thread")) {
  compareMismatches.push("Compare custom tool dimensions must produce results after entering cutter diameter, cutting length and flutes.");
}

// Exercise rejection and recovery through the rendered UI at both widths.
const radialValidationMismatches = [];
for (const width of [1440, 390]) {
  await page.goto(appUrl);
  await page.click('[data-spg-tab="main"]');
  await page.setViewportSize({ width, height: 1100 });
  await fillFixtureInput({ input: {
    processId: "machining-center", controlSystemId: "heidenhain", threadProfileId: "m",
    materialId: "material-14", diameter: 1.6, pitch: 0.4, threadLength: 5.6, safetyDistance: 2,
    overrides: { cutterDiameter: 1.4, cuttingEdgeLength: 5.6, flutes: 4, radialPasses: 3 }
  } });
  const invalidProgram = await page.locator("#spg-cnc-program").inputValue();
  const message = await page.locator("#spg-note-message").textContent();
  if (/CP IPA|G0[123]/.test(invalidProgram) || !message.includes("radial pass")) {
    radialValidationMismatches.push(`Invalid radial geometry must show an error and no CNC at width ${width}.`);
  }
  await page.screenshot({ path: path.resolve(`tmp/smiprog-radial-error-${width}.png`), fullPage: true });
  await page.fill("#spg-override-radial-passes", "1");
  if (!(await page.locator("#spg-cnc-program").inputValue()).includes("CP IPA+360")
    || (await page.locator("#spg-note-message").textContent()).includes("radial pass")) {
    radialValidationMismatches.push(`Valid single-pass geometry must recover CNC at width ${width}.`);
  }
  await page.selectOption("#spg-thread-hand", "left");
  const leftProgram = await page.locator("#spg-cnc-program").inputValue();
  if (!/CP IPA\+360 IZ-.*DR\+/.test(leftProgram) || !/\bRL\b/.test(leftProgram)
    || /CP .*IZ\+|\bRR\b/.test(leftProgram)) {
    radialValidationMismatches.push(`Heidenhain left-hand must use the downward Fanuc strategy at width ${width}.`);
  }
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true,
      value: { writeText: async text => { window.leftHandCopiedText = text; } } });
  });
  await page.click("#spg-copy-cnc");
  const copied = await page.evaluate(() => window.leftHandCopiedText);
  if (!copied?.includes(leftProgram) || !copied.includes("Left-hand")) {
    radialValidationMismatches.push(`Left-hand CNC copy must match the displayed program at width ${width}.`);
  }
  await page.screenshot({ path: path.resolve(`tmp/smiprog-heidenhain-left-${width}.png`), fullPage: true });
  await page.selectOption("#spg-thread-hand", "right");
  if (!/CP IPA\+360 IZ\+/.test(await page.locator("#spg-cnc-program").inputValue())) {
    radialValidationMismatches.push(`Switching back to right-hand must restore upward motion at width ${width}.`);
  }
}

await browser.close();

console.log(JSON.stringify({
  title,
  tool,
  cncLines: cnc.split("\n").length,
  firstCncLine: cnc.split("\n")[0],
  programTemplateOptions,
  controlSystemOptions,
  cncDisclaimerText,
  controlSystemPassed: controlSystemMismatches.length === 0,
  controlSystemMismatches,
  compareVisible,
  costRows,
  mainCuttingDataUi,
  mainCuttingDataPassed: mainCuttingDataMismatches.length === 0,
  mainCuttingDataMismatches,
  leftHandUi: {
    selectedText: leftHandUi.selectedText,
    firstRapidLine: leftHandUi.firstRapidLine,
    hasNegativeHelixZ: leftHandUi.hasNegativeHelixZ,
    hasPositiveHelixZ: leftHandUi.hasPositiveHelixZ,
    machiningTimeText: leftHandUi.machiningTimeText
  },
  threadHandPassed: threadHandMismatches.length === 0,
  threadHandMismatches,
  compareNsCustomTimingUi,
  compareInputFocusUi,
  compareOwnValueDraftReferenceUi,
  compareOwnValueReferenceUi,
  compareCustomMissingUi,
  compareCustomFilledUi,
  comparePassed: compareMismatches.length === 0,
  compareMismatches,
  mobileLayoutColumns,
  standardThreadUi,
  manualThreadUi,
  threadSelectorPassed: threadSelectorMismatches.length === 0,
  threadSelectorMismatches,
  initialThreadLengthUi,
  noMatchingToolUi,
  selectedToolLinkUi,
  goldenValidNoteUi,
  toolNotePassed: toolNoteMismatches.length === 0,
  toolNoteMismatches,
  informationUi,
  informationPassed: informationMismatches.length === 0,
  informationMismatches,
  uiFixtureCount: templateFixtures.length + 1,
  goldenUiPassed: goldenUiMismatches.length === 0,
  goldenUiMismatches,
  templateUiPassed: templateUiMismatches.length === 0,
  templateUiMismatches,
  radialValidationMismatches,
  errors,
  screenshots: {
    desktopMain: desktopMainScreenshotPath,
    selectedTool: selectedToolScreenshotPath,
    selectedToolMobile: selectedToolMobileScreenshotPath,
    desktopCompare: compareScreenshotPath,
    mobileCompare: compareMobileScreenshotPath,
    information: informationScreenshotPath,
    mobileMain: mobileScreenshotPath,
    goldenUi: goldenUiScreenshotPath
  }
}, null, 2));

if (radialValidationMismatches.length > 0 || goldenUiMismatches.length > 0 || templateUiMismatches.length > 0 || threadSelectorMismatches.length > 0 || toolNoteMismatches.length > 0 || informationMismatches.length > 0 || mainCuttingDataMismatches.length > 0 || threadHandMismatches.length > 0 || controlSystemMismatches.length > 0 || compareMismatches.length > 0 || errors.length > 0) {
  process.exitCode = 1;
}
