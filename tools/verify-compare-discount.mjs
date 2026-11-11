import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { repositoryRoot } from './build-app-files.mjs';
import { buildSingleHtmlDownloads } from './build-single-html.mjs';

await buildSingleHtmlDownloads();
const output = path.join(repositoryRoot, 'tmp/compare-discount');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
try {
  const page = await browser.newPage({ viewport: { width: 877, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async text => { window.copiedText = text; } }
  }));
  await page.goto(pathToFileURL(path.join(repositoryRoot, 'dist/downloads/smiprog-en.html')).href);
  await page.locator('[data-spg-tab="compare"]').click();
  const discount = page.locator('#spg-compare-discount');
  const apply = page.locator('#spg-compare-apply-discount');
  const row = label => page.locator('#spg-cost-data > .spg-compare-result-row')
    .filter({ has: page.locator('.spg-result-label', { hasText: new RegExp(`^${label}$`) }) });
  const values = label => row(label).locator('.spg-compare-cell-value').allTextContents();
  const assertPriceState = async active => {
    for (const [label, inactive] of [['Tooling cost', active], ['Price after discount', !active]]) {
      const rows = page.locator('.spg-compare-result-row, .spg-compare-mobile-result-row')
        .filter({ has: page.locator('.spg-result-label', { hasText: new RegExp(`^${label}$`) }) });
      assert.equal(await rows.count(), 3);
      assert.deepEqual(await rows.evaluateAll(nodes => nodes.map(node => node.classList.contains('spg-compare-price-inactive'))), [inactive, inactive, inactive]);
      if (inactive) {
        const colors = await rows.locator('.spg-compare-cell-value, .spg-compare-mobile-reference-value, input')
          .evaluateAll(nodes => nodes.map(node => getComputedStyle(node).color));
        assert.ok(colors.length >= 4 && colors.every(color => color === 'rgb(143, 139, 136)'));
      }
    }
  };
  assert.equal(await discount.isVisible(), false);
  assert.equal(await row('Price after discount').count(), 0);
  await page.locator('#spg-compare-password').fill('xl');
  await page.locator('#spg-unlock-compare').click();
  assert.equal(await discount.isVisible(), false);
  await page.locator('#spg-compare-password').fill('XL');
  await page.locator('#spg-unlock-compare').click();
  assert.equal(await discount.isVisible(), true);
  assert.equal(await apply.isChecked(), false);
  assert.equal(await page.getByRole('switch', { name: 'Apply discount', exact: true }).count(), 1);
  assert.equal(await row('Price after discount').isVisible(), true);
  await assertPriceState(false);
  const original = await values('Total cost per thread');
  const time = await values('Time to mill thread');
  const machine = await values('Machine cost per thread');
  const gross = (await values('Tooling cost')).map(value => Number.parseFloat(value.replaceAll(',', '')));
  await discount.fill('20');
  assert.deepEqual(await values('Total cost per thread'), original);
  assert.deepEqual(await values('Price after discount'), gross.map(value => `${(value * .8).toFixed(2)} €`));
  await apply.check();
  await apply.press('Space');
  assert.equal(await apply.isChecked(), false);
  await apply.press('Space');
  assert.equal(await apply.isChecked(), true);
  await assertPriceState(true);
  assert.deepEqual(await values('Price after discount'), gross.map(value => `${(value * .8).toFixed(2)} €`));
  assert.deepEqual(await values('Time to mill thread'), time);
  assert.deepEqual(await values('Machine cost per thread'), machine);
  assert.notDeepEqual(await values('Total cost per thread'), original);
  await apply.uncheck();
  await assertPriceState(false);
  assert.deepEqual(await values('Total cost per thread'), original);
  assert.equal(await discount.inputValue(), '20');
  assert.deepEqual(await values('Price after discount'), gross.map(value => `${(value * .8).toFixed(2)} €`));
  await page.locator('#spg-copy-compare-results').click();
  assert.doesNotMatch(await page.evaluate(() => window.copiedText), /Price after discount|Discount \(%\)/);
  await apply.check();
  for (const [side, price] of [['a', '100'], ['b', '200']]) {
    await page.locator(`#spg-compare-tool-${side}-price`).fill(price);
    await page.locator(`#spg-compare-tool-${side}-price`).blur();
  }
  assert.deepEqual(await values('Price after discount'), ['80.00 €', '160.00 €']);
  await assertPriceState(true);
  for (const invalid of ['-1', '100.01', '']) {
    await discount.fill(invalid);
    assert.match(await page.locator('#spg-compare-summary').textContent(), /discount from 0 to 100%/);
    assert.deepEqual(await values('Total cost per thread'), ['-', '-']);
    assert.equal(await discount.getAttribute('aria-invalid'), 'true');
  }
  await apply.uncheck();
  assert.equal(await discount.getAttribute('aria-invalid'), 'false');
  await discount.fill('100');
  await apply.check();
  assert.deepEqual(await values('Price after discount'), ['0.00 €', '0.00 €']);
  assert.deepEqual(await values('Total cost per thread'), await values('Machine cost per thread'));
  await discount.fill('12.5');
  assert.deepEqual(await values('Price after discount'), ['87.50 €', '175.00 €']);
  await page.locator('#spg-copy-compare-results').click();
  const copied = await page.evaluate(() => window.copiedText);
  assert.match(copied, /Discount \(%\): 12.50/);
  assert.match(copied, /Price after discount: 87.50 €/);
  await page.reload();
  await page.locator('[data-spg-tab="compare"]').click();
  assert.equal(await apply.isChecked(), true);
  assert.equal(await discount.inputValue(), '12.5');
  assert.deepEqual(await values('Price after discount'), ['87.50 €', '175.00 €']);
  for (const [width, height] of [[1440, 1100], [877, 1000], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await discount.count(), 1);
    assert.equal(await discount.isVisible(), true);
    await assertPriceState(true);
    await apply.uncheck();
    await assertPriceState(false);
    await apply.check();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#spg-compare-discount-controls').evaluate(e => e.scrollWidth > e.clientWidth), false);
    assert.ok(await discount.evaluate(e => e.getBoundingClientRect().width <= 90));
    await discount.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `${width}-${height}.png`) });
  }
  assert.equal(await page.locator('[data-i18n="compare.referencePrices"]').count(), 0);
  assert.doesNotMatch(await page.locator('#spg-compare-panel').innerText(), /catalogue prices/i);
  assert.deepEqual(errors, []);
  console.log('PASS: locked/unlocked, shared discount, own prices, on/off, validation, 100%, copy, reload, mobile/desktop');
} finally {
  await browser.close();
}
