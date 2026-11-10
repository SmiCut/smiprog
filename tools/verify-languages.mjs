import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { buildLanguagePackages, locales, webRoot } from "./build-language-packages.mjs";
import { repositoryRoot } from "./build-app-files.mjs";
import { buildSingleHtmlDownloads } from "./build-single-html.mjs";

await buildLanguagePackages();
await buildSingleHtmlDownloads();
const screenshots = path.join(webRoot, "tmp/languages");
await fs.mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}) });
const report = [];
let expectedProgram;
try {
  for (const locale of process.env.VERIFY_LOCALES?.split(",") || locales) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "en-US" });
    try {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } });
        Object.defineProperty(navigator, "share", { value: async value => { window.sharedText = value.text; } });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const dictionary = JSON.parse(await fs.readFile(path.join(webRoot, `i18n/${locale}.json`), "utf8"));
      const requests = [];
      await page.route("**/api/chat", async route => {
        const payload = route.request().postDataJSON();
        requests.push(payload);
        await route.fulfill({ json: payload.message === "hej"
          ? { reply: "Hello! Try a material such as AISI 1045, aluminium 6061 or Inconel 718." }
          : { reply: "Recommendation: AISI 1045", materialCategoryKey: "steel-medium-carbon" } });
      });
      await page.goto(pathToFileURL(path.join(repositoryRoot, `dist/downloads/smiprog-${locale}.html`)).href);
      assert.equal(await page.evaluate(() => window.SmiProgI18n.getLocaleKey()), locale);
      for (const view of ["start", "main", "compare", "information", "materialselector"]) {
        await page.locator(`[data-spg-tab="${view}"]`).click();
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 1100 });
          const issues = await page.evaluate(() => {
            const root = document.querySelector('#smiprog-app');
            const panel = root.querySelector('.spg-panel-active');
            return [...panel.querySelectorAll('button, .spg-field, .spg-result-label, .spg-compare-note-row, .spg-start-card')]
              .filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none' && !e.closest('.spg-dev-only'))
              .filter(e => { const r=e.getBoundingClientRect(); return r.right>innerWidth+1 || r.left < -1 || e.scrollWidth>e.clientWidth+2; })
              .map(e => `${e.id || e.className}: ${e.textContent.slice(0,70)}`);
          });
          if (issues.length) await page.screenshot({ path: path.join(screenshots, `${locale}-${view}-${width}-overflow.png`), fullPage: true });
          assert.deepEqual(issues, [], `${locale}/${view}/${width}: overflow`);
          if (view === 'compare') {
            const clipped = await page.locator('input.spg-compare-price-input:visible').evaluateAll(inputs => inputs.filter(input => {
              const style = getComputedStyle(input);
              const canvas = document.createElement('canvas').getContext('2d');
              canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
              return canvas.measureText(input.placeholder).width > input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
            }).map(input => input.placeholder));
            assert.deepEqual(clipped, [], `${locale}/${width}: clipped price hint`);
          }
          if (["start", "compare", "information"].includes(view)) await page.screenshot({ path: path.join(screenshots, `${locale}-${view}-${width}.png`), fullPage: true });
        }
      }
      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.locator('[data-spg-tab="main"]').click();
      const program = await page.locator('#spg-cnc-program').inputValue();
      expectedProgram ??= program;
      assert.equal(program, expectedProgram, `${locale}: CNC changed with locale`);
      await page.locator('#spg-copy-cutting-data').click();
      assert.ok((await page.evaluate(()=>window.copiedText)).includes(dictionary['thread.length']));
      await page.selectOption('#spg-control-system', 'heidenhain');
      await page.selectOption('#spg-thread-hand', 'left');
      assert.match(await page.locator('#spg-cnc-program').inputValue(), /CP IPA/);
      await page.selectOption('#spg-thread-hand', 'right');
      await page.selectOption('#spg-control-system', 'fanuc');
      await page.locator('[data-spg-tab="compare"]').click();
      assert.equal(await page.locator('#spg-compare-password').isVisible(), locale !== 'sv');
      assert.equal(await page.locator('#spg-machine-cost').inputValue(), locale === 'sv' ? '900' : '80');
      const input = page.locator('input.spg-compare-price-input:visible').first();
      assert.equal(await input.getAttribute('placeholder'), dictionary['compare.pricePlaceholder'].replace('{currency}', locale === 'sv' ? 'kr' : '€'));
      if (locale !== 'sv') {
        await page.locator('#spg-compare-password').fill('xl');
        await page.locator('#spg-unlock-compare').click();
        assert.equal(await page.locator('#spg-compare-unlock-message').textContent(), dictionary['compare.wrongPassword']);
        await page.locator('#spg-compare-password').fill('XL');
        await page.locator('#spg-unlock-compare').click();
        assert.equal(await page.locator('#spg-compare-access').isVisible(), false);
      }
      for (const [id,value] of [['spg-compare-tool-a-price','100'],['spg-compare-tool-b-price','200']]) {
        await page.locator(`#${id}`).fill(value); await page.locator(`#${id}`).blur();
      }
      const summary = await page.locator('#spg-compare-summary').textContent();
      assert.equal((summary.match(/[%％]/g) || []).length, 1);
      assert.doesNotMatch(summary, /\{\w+\}|%@/);
      await page.locator('#spg-copy-compare-results').click();
      const copy = await page.evaluate(()=>window.copiedText);
      assert.ok(copy.includes(dictionary['compare.totalCost']));
      assert.ok(copy.includes(summary));
      assert.ok(copy.includes(locale === 'sv' ? 'SWE/shop/productinfo/' : 'id.smicut.com/'));
      await page.getByRole('button', {name:dictionary['button.share'],exact:true}).click();
      assert.equal(await page.evaluate(()=>window.sharedText), copy);
      await input.fill('-1'); await input.blur();
      assert.ok((await page.locator('#spg-compare-summary').textContent()).includes(dictionary['compare.priceError']));
      await page.locator('#spg-use-current-setup').click();
      for (const [width,height] of [[390,844],[844,390],[768,1024]]) {
        await page.setViewportSize({width,height});
        assert.equal(await page.evaluate(()=>{
          const b=document.querySelector('#spg-use-current-setup').getBoundingClientRect();
          const n=document.querySelector('.spg-compare-note').getBoundingClientRect();
          return b.bottom <= n.top;
        }),width<=560&&height>=width);
      }
      await page.locator('[data-spg-tab="materialselector"]').click();
      const materialInput=page.locator('#spg-material-selector-input');
      await materialInput.fill('hej');await page.locator('#spg-material-selector-send').click();
      await page.getByText('Hello! Try a material such as AISI 1045, aluminium 6061 or Inconel 718.',{exact:true}).waitFor();
      assert.equal(await page.locator('.sms-category-result-value').count(),0);
      await materialInput.fill('AISI 1045');await page.locator('#spg-material-selector-send').click();
      await page.locator('.sms-category-result-value').waitFor();
      assert.ok((await page.locator('.sms-category-result-value').textContent()).includes(dictionary['materialDescriptor.steel-medium-carbon']));
      assert.ok(requests.every(request=>request.language===locale));
      assert.deepEqual(errors,[],locale);
      report.push({locale, passed:true, screenshots:6, checks:['all views','layout','prices','copy','share','validation','CNC parity','material key','greeting fallback']});
      console.log(`${locale}: passed`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
await fs.writeFile(path.join(repositoryRoot,'dist/languages/browser-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Verified ${report.length} languages`);
