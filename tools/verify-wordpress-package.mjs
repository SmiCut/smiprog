import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { repositoryRoot, buildWordPressPackage, apiUrl } from "./build-wordpress-plugin.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const build = await buildWordPressPackage();
const root = build.directory;
const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
const prefix = "/wp-content/plugins/smiprog-widget/app/";
const fragment = (await fs.readFile(path.join(root, "templates/smiprog.html"), "utf8"))
  .replaceAll("__SMIPROG_ASSET_BASE__", prefix + "assets/");
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };
const requests = [];
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  requests.push(url.pathname);
  if (url.pathname === "/products/smiprog/") {
    const locale = url.searchParams.get("locale") || "en";
    assert.match(locale, /^[a-z-]+$/);
    const config = { locale, assetBase: prefix + "assets/", materialSelectorApiUrl: apiUrl };
    const styles = manifest.styles.map(style => `<link rel="stylesheet" href="${prefix}${style.file}?ver=${style.hash}">`).join("");
    const scripts = manifest.scripts.map(script => `<script src="${prefix}${script.file}?ver=${script.hash}"></script>`).join("");
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html lang="${locale}"><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles}<style>body{margin:0}h2{color:red}button{border-radius:30px;font-size:24px}img{max-width:100%}</style></head><body><div class="wordpress-content">${fragment}</div><script>window.SmiProgConfig=${JSON.stringify(config)}</script>${scripts}</body></html>`);
    return;
  }
  if (!url.pathname.startsWith(prefix)) { response.writeHead(404); response.end(); return; }
  const target = path.resolve(root, "app", decodeURIComponent(url.pathname.slice(prefix.length)));
  if (!target.startsWith(path.join(root, "app") + path.sep)) { response.writeHead(403); response.end(); return; }
  try {
    const data = await fs.readFile(target);
    response.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/products/smiprog/`;
const screenshots = path.join(repositoryRoot, "apps/web/tmp/wordpress-package");
await fs.mkdir(screenshots, { recursive: true });
const errors = [];
const materialRequests = [];
let startLayouts = 0;
let dimensionLegends = 0;

async function verifyStartPage(page, locale) {
  assert.equal(await page.locator("#spg-start-panel h1").count(), 0, "The WordPress page provides the SmiProg heading");
  for (const width of [1440, 768, 720, 561, 560, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    const layout = await page.locator(".spg-start-grid").evaluate(grid => {
      const fits = element => {
        const parent = element.closest(".spg-start-card").getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        return rect.left >= parent.left && rect.right <= parent.right + 1
          && rect.top >= parent.top && rect.bottom <= parent.bottom + 1;
      };
      const cards = [...grid.querySelectorAll(".spg-start-card")];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        count: cards.length,
        cardRects: cards.map(card => {
          const rect = card.getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, bottom: rect.bottom };
        }),
        sidePadding: getComputedStyle(document.querySelector("#smiprog-app")).paddingLeft,
        fits: cards.every(card => [...card.children].every(fits)),
        textClear: cards.every(card => {
          const visual = card.querySelector(".spg-start-card-symbol, .spg-start-card-visual, .spg-start-card-materialselector-icon").getBoundingClientRect();
          return [...card.querySelectorAll(":scope > strong, :scope > span[data-i18n]")].every(text => {
            const rect = text.getBoundingClientRect();
            return rect.right <= visual.left + 1 || rect.left >= visual.right - 1
              || rect.bottom <= visual.top + 1 || rect.top >= visual.bottom - 1;
          });
        }),
        headingSizes: cards.map(card => getComputedStyle(card.querySelector("strong > [data-i18n]")).fontSize),
        colors: cards.map(card => getComputedStyle(card.querySelector("strong > [data-i18n]")).color)
      };
    });
    assert.equal(layout.count, 4);
    assert.equal(layout.overflow, false, `${locale}/${width}: page overflow`);
    assert.equal(layout.fits, true, `${locale}/${width}: card content overflow`);
    assert.equal(layout.textClear, true, `${locale}/${width}: overlapping card content`);
    assert.deepEqual(layout.headingSizes, Array(4).fill("20px"));
    assert.equal(new Set(layout.colors).size, 4, "Start card headings must keep their category colors");
    assert.equal(layout.sidePadding, width <= 720 ? "10px" : "0px", `${locale}/${width}: SmiCalc mobile spacing`);
    const [main, compare, information, material] = layout.cardRects;
    if (width > 560) {
      assert.equal(main.top, compare.top, `${locale}/${width}: first row`);
      assert.equal(information.top, material.top, `${locale}/${width}: second row`);
      assert.equal(main.left, information.left);
      assert.equal(compare.left, material.left);
      assert.ok(information.top >= main.bottom + 11);
      assert.ok(compare.left > main.left);
      assert.ok(layout.cardRects.every(rect => Math.abs(rect.width - main.width) < 1));
    } else {
      assert.ok(layout.cardRects.every(rect => rect.left === main.left && rect.left >= 10));
      assert.ok(layout.cardRects.slice(1).every((rect, i) => rect.top >= layout.cardRects[i].bottom + 11));
    }
    startLayouts++;
    if (locale === "en" && [1440, 390].includes(width)) {
      await page.screenshot({ path: path.join(screenshots, width === 1440 ? "start-desktop.png" : "start-mobile.png"),
        fullPage: true, animations: "disabled" });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const target of ["main", "compare", "information", "materialselector"]) {
    await page.locator(`[data-spg-start-tab="${target}"]`).click();
    assert.equal(await page.locator(`[data-spg-tab="${target}"]`).getAttribute("aria-selected"), "true");
    await page.locator('[data-spg-tab="start"]').click();
  }
  await page.locator('[data-spg-start-tab="main"]').focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#spg-main-panel").isVisible(), true);
  await page.locator('[data-spg-tab="start"]').click();
}

let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  for (const locale of ["en", "en-za"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.route(apiUrl, async route => {
      const data = route.request().postDataJSON();
      materialRequests.push({ url: route.request().url(), ...data });
      const reply = data.message === "hej"
        ? { reply: "Hello! Ask about AISI 1045, 6061 aluminium or Inconel 718." }
        : data.message === "unknown" ? { reply: "## Final Recommendation\nUnknown material" }
        : { materialCategoryKey: data.message === "Inconel 718" ? "inconel-718" : "steel-medium-carbon", reply: "## Final Recommendation\nMaterial matched" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reply) });
    });
    await page.goto(url + `?locale=${locale}`);
    assert.equal(await page.locator("#smiprog-app").count(), 1);
    await page.waitForFunction(() => document.querySelector("#spg-material").options.length > 0);
    await verifyStartPage(page, locale);
    const initialImages = await page.locator("#smiprog-app img").evaluateAll(images => images.filter(image => image.getAttribute("src")).map(image => ({ source: image.src, lazy: image.loading === "lazy", loaded: image.complete && image.naturalWidth > 0 })));
    assert.ok(initialImages.every(image => image.source.includes(prefix) && (image.lazy || image.loaded)), JSON.stringify(initialImages));
    await page.locator('[data-spg-tab="information"]').click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const legend = await page.locator(".spg-info-figure figcaption").evaluate(caption => {
        return [...caption.children].map(row => {
          const label = row.querySelector("[data-i18n]");
          return { rowBorder: getComputedStyle(row).borderTopWidth,
            labelBorder: getComputedStyle(label).borderTopWidth,
            labelPadding: getComputedStyle(label).paddingTop,
            labelDisplay: getComputedStyle(label).display };
        });
      });
      assert.equal(legend.length, 6);
      assert.deepEqual(legend.map(row => row.rowBorder), ["0px", "1px", "1px", "1px", "1px", "1px"]);
      assert.ok(legend.every(row => row.labelBorder === "0px" && row.labelPadding === "0px" && row.labelDisplay !== "grid"), `${locale}/${width}: duplicated legend row styling`);
      dimensionLegends++;
      if (locale === "en") await page.locator(".spg-info-figure figcaption").screenshot({
        path: path.join(screenshots, width === 1440 ? "dimension-legend-desktop.png" : "dimension-legend-mobile.png"), animations: "disabled" });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-spg-tab="main"]').click();
    const before = materialRequests.length;
    await page.locator("#spg-thread-length").fill("16");
    await page.locator("#spg-thread-length").blur();
    assert.ok((await page.locator("#spg-cnc-program").inputValue()).length > 100);
    const toolImage = page.locator('#spg-main-panel img[src*="/assets/thread-mills/"]').first();
    await toolImage.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('#spg-main-panel img')].every(image => image.complete && image.naturalWidth > 0));
    if (locale === "en") await page.screenshot({ path: path.join(screenshots, "calculator.png"), fullPage: true, animations: "disabled" });
    assert.equal(materialRequests.length, before, "Calculations must not call Railway");
    await page.locator('[data-spg-tab="compare"]').click();
    if (await page.locator("#spg-compare-password").isVisible()) {
      assert.equal(await page.locator('[data-i18n="compare.lockHelp"]').textContent(), "This section is intended for SmiCut and distributors.");
      await page.locator("#spg-compare-password").fill("smicut");
      await page.locator("#spg-unlock-compare").click();
      assert.equal(await page.locator("#spg-compare-content").isVisible(), false, "The previous Compare password must be rejected");
      await page.locator("#spg-compare-password").fill("XL");
      await page.locator("#spg-unlock-compare").click();
    }
    assert.equal(await page.locator("#spg-compare-content").isVisible(), true);
    assert.ok((await page.locator("#spg-cost-data").textContent()).trim().length > 0);
    assert.equal(materialRequests.length, before, "Compare must not call Railway");
    await page.locator('[data-spg-tab="materialselector"]').click();
    const dictionary = JSON.parse(await fs.readFile(path.join(root, `app/i18n/${locale.split("-")[0]}.json`), "utf8"));
    assert.equal(await page.locator(".sms-welcome-title").textContent(), dictionary["materialSelector.welcomeTitle"]);
    for (const message of ["hej", "AISI 1045", "Inconel 718", "unknown"]) {
      await page.locator('[data-sms-role="input"]').fill(message);
      await page.locator('[data-sms-role="send"]').click();
      await page.waitForFunction(() => document.querySelector('[data-sms-role="send"]').getAttribute("aria-busy") === "false");
      const last = page.locator(".sms-message-bot").last();
      assert.equal(await last.locator(".sms-category-result").count(), ["hej", "unknown"].includes(message) ? 0 : 1);
      assert.equal(materialRequests.at(-1).language, locale);
      if (message === "unknown") assert.ok((await last.locator(".sms-explanation").textContent()).includes("Final Recommendation"));
      if (message === "AISI 1045") {
        assert.equal(await last.locator(".sms-category-result-value").textContent(), dictionary["materialGroup.steel"] + ", " + dictionary["materialDescriptor.steel-medium-carbon"]);
        assert.equal(await last.locator(".sms-category-spec").textContent(), " (HB < 200, Rm < 700 N/mm²)");
      }
    }
    if (locale === "en") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(screenshots, "desktop.png"), fullPage: true, animations: "disabled" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator(".spg-tabs").count(), 1);
    }
    await page.close();
  }
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", error => errors.push(error.message));
  await mobile.goto(url);
  await mobile.locator('[data-spg-tab="materialselector"]').click();
  assert.equal(await mobile.locator('[data-spg-tab="materialselector"]').getAttribute("aria-selected"), "true");
  assert.equal(await mobile.locator(".sms-welcome-title").isVisible(), true);
  assert.equal(await mobile.locator(".spg-tabs").count(), 1);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: path.join(screenshots, "mobile.png"), animations: "disabled" });
  await mobile.locator('[data-spg-tab="compare"]').click();
  await mobile.locator("#spg-compare-password").fill(" xl ");
  await mobile.locator("#spg-unlock-compare").click();
  assert.equal(await mobile.locator("#spg-compare-content").isVisible(), true, "Compare password stays case-insensitive and trimmed");
  await mobile.close();
  const standalone = await browser.newPage();
  await standalone.goto(`http://127.0.0.1:${server.address().port}${prefix}index.html`);
  await standalone.waitForFunction(() => document.querySelector("#spg-material").options.length > 0);
  await standalone.close();
  assert.deepEqual(errors, []);
  assert.equal(requests.filter(url => url.startsWith("/api/")).length, 0);
  const report = { passed: true, version: build.version, locales: 6, startLayouts, dimensionLegends, materialRequests: materialRequests.length,
    comparePassword: { value: "XL", previousRejected: true, caseInsensitive: true },
    materialApiUrl: apiUrl, localProxyRequests: 0, phpRuntime: "Not run; PHP syntax parsed separately. Test on WordPress before publication.",
    screenshots: ["start-desktop.png", "start-mobile.png", "dimension-legend-desktop.png", "dimension-legend-mobile.png", "calculator.png", "desktop.png", "mobile.png"] };
  await fs.writeFile(path.join(repositoryRoot, "dist/wordpress/browser-verification.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
