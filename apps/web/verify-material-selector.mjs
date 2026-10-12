import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.SMIPROG_URL || pathToFileURL(path.join(root, "index.html")).href;
const steel = "Steel, medium carbon, C < 0.55% (HB < 200, Rm < 700 N/mm²)";
const inconel = "Inconel, 718 (HB < 370)";
const responses = [];
const requests = [];
const errors = [];
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });

async function open(locale = "en", viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(locale => {
    window.SmiProgConfig = { locale };
    const timeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => timeout(callback, delay === 30000 && window.testTimeout ? 30 : delay, ...args);
  }, locale);
  await page.route(/\/api\/(?:chat|material-selector)(?:\?|$)/, async route => {
    requests.push(route.request().postDataJSON());
    const response = responses.shift();
    assert.ok(response, "Unexpected material request");
    if (response.timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.abort().catch(() => {});
    } else {
      await route.fulfill({ status: response.status || 200, contentType: "application/json", body: JSON.stringify(response) });
    }
  });
  await page.goto(url);
  await page.locator('[data-spg-tab="materialselector"]').click();
  await page.waitForFunction(() => document.querySelector("#spg-material-selector-widget").dataset.smsInitialized === "true");
  return page;
}

async function send(page, message, response) {
  responses.push(response);
  await page.locator('[data-sms-role="input"]').fill(message);
  await page.locator('[data-sms-role="send"]').click();
  await page.waitForFunction(() => document.querySelector('[data-sms-role="send"]').getAttribute("aria-busy") === "false");
  assert.equal(await page.locator(".sms-loading-message").count(), 0);
}

async function layout(page) {
  const result = await page.locator(".sms-panel").evaluate(panel => {
    const rect = panel.getBoundingClientRect();
    const composer = panel.querySelector(".sms-composer").getBoundingClientRect();
    return { height: rect.height, expected: Math.min(620, innerHeight * .8), overflow: panel.scrollWidth > panel.clientWidth, composerInside: composer.bottom <= rect.bottom + 1 };
  });
  assert.ok(Math.abs(result.height - result.expected) <= 1, JSON.stringify(result));
  assert.equal(result.overflow, false);
  assert.equal(result.composerInside, true);
}

try {
  const page = await open();
  await layout(page);
  assert.equal(await page.locator('[data-sms-role="send"]').isDisabled(), true);
  assert.equal(await page.locator('[data-sms-role="welcome"]').isVisible(), true);
  await fs.mkdir(path.join(root, "tmp"), { recursive: true });
  await page.locator(".sms-panel").screenshot({ path: path.join(root, "tmp/material-selector-welcome.png") });

  const greeting = "Hello! Enter a material such as AISI 1045, 6061 aluminium or Inconel 718. Steel, medium carbon, C < 0.55%.";
  await send(page, "hej", { reply: greeting });
  assert.equal(await page.locator(".sms-category-result").count(), 0);
  assert.equal(await page.locator(".sms-explanation").last().textContent(), greeting);
  assert.equal(requests.at(-1).message, "hej");
  assert.equal(requests.at(-1).language, "en");

  await send(page, "AISI 1045", { materialCategoryKey: "steel-medium-carbon", reply: "AISI 1045 matches medium carbon steel.\n## Final Recommendation\n👉 " + steel + "\nAny more questions?" });
  const first = page.locator(".sms-message-bot").nth(1);
  assert.equal(await first.locator(".sms-category-result-value").textContent(), "Steel, medium carbon, C < 0.55%");
  assert.equal(await first.locator(".sms-category-spec").textContent(), " (HB < 200, Rm < 700 N/mm²)");
  assert.equal(await first.locator(".sms-explanation").isVisible(), false);
  await first.locator("summary").click();
  await page.waitForFunction(() => document.querySelector(".sms-message-bot details summary").textContent === "Hide explanation");
  assert.equal(await first.locator("summary").textContent(), "Hide explanation");
  assert.ok((await first.locator(".sms-explanation").textContent()).includes("Final Recommendation"));
  await first.locator("summary").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await first.evaluate(message => { const log = message.parentElement; log.scrollTop = message.offsetTop - log.offsetTop - 14; });
  await layout(page);
  await page.locator(".sms-panel").screenshot({ path: path.join(root, "tmp/material-selector-mobile-card.png") });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await first.locator(".sms-apply-material").click();
  assert.deepEqual(await page.locator("#spg-material, #spg-compare-material").evaluateAll(selects => selects.map(s => s.value)), ["material-2", "material-2"]);
  assert.equal(await first.locator(".sms-selected").isVisible(), true);
  await first.locator(".sms-apply-material").click();
  assert.equal(await first.locator(".sms-calculators").isVisible(), true);
  await first.locator('[data-sms-calculator="main"]').click();
  assert.equal(await page.locator("#spg-main-panel").isVisible(), true);
  await page.locator('[data-spg-tab="materialselector"]').click();
  page.once("dialog", dialog => dialog.accept("XL"));
  await first.locator('[data-sms-calculator="compare"]').click();
  assert.equal(await page.locator("#spg-compare-panel").isVisible(), true);
  await page.locator('[data-spg-tab="materialselector"]').click();

  await send(page, "Inconel 718", { materialCategoryKey: "inconel-718", reply: "## Final Recommendation\n👉 " + inconel });
  const second = page.locator(".sms-message-bot").nth(2);
  assert.equal(await second.locator(".sms-category-result-value").textContent(), "Inconel, 718");
  await second.locator(".sms-apply-material").click();
  assert.equal(await page.locator("#spg-material").inputValue(), "material-29");
  assert.equal(await first.locator(".sms-selected").isVisible(), false);
  await first.locator(".sms-apply-material").click();
  assert.equal(await page.locator("#spg-material").inputValue(), "material-2");
  await page.locator("#spg-material").evaluate(select => { select.value = "material-1"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  assert.equal(await first.locator(".sms-selected").isVisible(), false);

  for (const reply of ["## Final Recommendation\n" + steel, "👉 " + steel, "Material category: 2"]) {
    const before = await page.locator(".sms-category-result").count();
    await send(page, "AISI 1045", { reply });
    assert.equal(await page.locator(".sms-category-result").count(), before + 1);
  }
  for (const reply of ["You can ask about " + steel, "## Final Recommendation\nNickel, alloyed", "## Final Recommendation\nUnknown material", "Which material category 2 do you mean?"]) {
    const before = await page.locator(".sms-category-result").count();
    await send(page, "material help", { reply });
    assert.equal(await page.locator(".sms-category-result").count(), before);
    assert.equal(await page.locator(".sms-explanation").last().isVisible(), true);
  }
  await send(page, "unmapped key", { materialCategoryKey: "not-a-local-material", reply: "## Final Recommendation\nUnknown material" });
  assert.equal(await page.locator(".sms-message-bot").last().locator("details").count(), 0);
  assert.ok((await page.locator(".sms-explanation").last().textContent()).includes("Unknown material"));
  assert.equal(requests.at(-1).history.length, 12);

  await send(page, "HTML safety test", { reply: '<img src=x onerror="window.selectorInjected=true"><script>window.selectorInjected=true</script> [bad](javascript:alert(1))' });
  const escaped = page.locator(".sms-explanation").last();
  assert.equal(await escaped.locator("img, script, a[href^='javascript:']").count(), 0);
  assert.equal(await page.evaluate(() => Boolean(window.selectorInjected)), false);
  assert.ok((await escaped.textContent()).includes("<img"));

  const input = page.locator('[data-sms-role="input"]');
  await input.fill("multiline");
  const countBefore = requests.length;
  await input.press("Shift+Enter");
  await input.dispatchEvent("keydown", { key: "Enter", isComposing: true, keyCode: 229 });
  assert.equal(requests.length, countBefore);
  assert.ok((await input.inputValue()).includes("\n"));
  responses.push({ reply: "Full help text" });
  await input.press("Enter");
  await page.waitForFunction(() => document.querySelector('[data-sms-role="send"]').getAttribute("aria-busy") === "false");

  for (const failure of [{ status: 500, reply: "Service unavailable" }, { timeout: true }]) {
    await page.evaluate(() => window.testTimeout = true);
    await send(page, "retry this material", failure);
    assert.equal(await page.locator('[data-sms-role="retry"]').isVisible(), true);
    assert.equal(await page.locator('[data-sms-role="status"]').isVisible(), true);
    const userCount = await page.locator(".sms-message-user").count();
    const failed = requests.at(-1);
    responses.push({ materialCategoryKey: "steel-medium-carbon", reply: "Recovered" });
    await page.locator('[data-sms-role="retry"]').click();
    await page.waitForFunction(() => document.querySelector('[data-sms-role="send"]').getAttribute("aria-busy") === "false");
    assert.deepEqual(requests.at(-1), failed);
    assert.equal(await page.locator(".sms-message-user").count(), userCount);
    assert.equal(await page.locator('[data-sms-role="retry"]').isVisible(), false);
    assert.equal(await page.locator(".sms-message-bot").last().locator(".sms-category-result").count(), 1);
  }
  await layout(page);
  await page.locator(".sms-panel").screenshot({ path: path.join(root, "tmp/material-selector-chat.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await layout(page);
  await page.locator(".sms-panel").screenshot({ path: path.join(root, "tmp/material-selector-mobile.png") });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.close();

  const component = await fs.readFile(path.join(root, "js/material-selector.js"), "utf8");
  const markup = await fs.readFile(path.join(root, "index.html"), "utf8");
  const selectorKeys = new Set([
    ...Array.from(component.matchAll(/t\(["'](materialSelector\.[^"']+)["']/g), match => match[1]),
    ...Array.from(component.matchAll(/htmlText\(["']([^"']+)["']/g), match => "materialSelector." + match[1]),
    ...Array.from(markup.matchAll(/data-sms-i18n="([^"]+)"/g), match => "materialSelector." + match[1])
  ]);
  for (const locale of ["en", "en-za"]) {
    const dict = JSON.parse(await fs.readFile(path.join(root, "i18n", locale.split("-")[0] + ".json"), "utf8"));
    const localized = await open(locale, { width: 390, height: 844 });
    for (const key of selectorKeys) assert.ok(dict[key], locale + ": " + key);
    assert.equal(await localized.locator(".sms-welcome-title").textContent(), dict["materialSelector.welcomeTitle"]);
    await send(localized, "AISI 1045", { materialCategoryKey: "steel-medium-carbon", reply: "## Final Recommendation\n" + steel });
    assert.equal(requests.at(-1).language, locale);
    assert.equal(await localized.locator(".sms-category-result-value").textContent(), dict["materialGroup.steel"] + ", " + dict["materialDescriptor.steel-medium-carbon"]);
    assert.equal(await localized.locator("summary").textContent(), dict["materialSelector.showExplanation"]);
    await layout(localized);
    await localized.close();
  }

  for (const file of [path.join(root, "index.html"), path.join(root, "tests/fixtures/smicalc-selector-source.html")]) {
    const html = await fs.readFile(file, "utf8");
    for (const [, code] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (code.trim()) new vm.Script(code, { filename: file });
  }
  assert.deepEqual(errors, []);
  assert.equal(responses.length, 0);
  console.log(JSON.stringify({ passed: true, requests: requests.length, languages: 2, screenshots: ["welcome", "chat", "mobile"] }, null, 2));
} finally {
  await browser.close();
}
