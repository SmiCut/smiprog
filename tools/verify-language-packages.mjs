// Verify actual local language downloads on desktop and mobile, without live AI calls.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { buildLanguagePackages, locales } from './build-language-packages.mjs';
import { repositoryRoot } from './build-wordpress-plugin.mjs';

await buildLanguagePackages();
const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
try {
  for (const locale of locales) {
    const dictionary = JSON.parse(await fs.readFile(path.join(repositoryRoot, `apps/web/i18n/${locale}.json`), 'utf8'));
    const url = pathToFileURL(path.join(repositoryRoot, `dist/languages/smiprog-${locale}/index.html`)).href;
    for (const width of [1280, 390]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/api/chat', route => route.abort());
      await page.goto(url);
      assert.equal(await page.evaluate(() => window.SmiProgI18n.getLocale()), locale);
      assert.equal(await page.evaluate(() => window.SmiProgI18n.getMaterialSelectorLanguage()), locale);
      const tabs = page.locator('[data-spg-tab="main"]');
      assert.equal(await tabs.textContent(), dictionary['tabs.threadMilling']);
      await tabs.click();
      assert.match(await page.locator('#spg-cnc-program').inputValue(), /S\d+ M3/);
      assert.match(await page.locator('#spg-final-machining-time').innerText(), /\d/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
      const images = await page.locator('img').evaluateAll(nodes => nodes.filter(n => n.offsetWidth).map(n => n.complete && n.naturalWidth > 0));
      assert.ok(images.every(Boolean));
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`OK: ${locale} independent package, default language, CNC, images, desktop/mobile`);
  }
} finally { await browser.close(); }
