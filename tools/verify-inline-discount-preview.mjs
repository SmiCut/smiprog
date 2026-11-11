import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { parse } from 'parse5';
import { createSingleHtmlDownloads } from './build-single-html.mjs';
import { repositoryRoot } from './build-app-files.mjs';

// This is an English-only review build; do not replace the released language files.
const english = (await createSingleHtmlDownloads()).find(file => file.locale === 'en');
const output = path.join(repositoryRoot, 'dist/english-preview');
await fs.mkdir(output, { recursive: true });
const target = path.join(output, english.name);
await fs.writeFile(target, english.bytes);
function checkScripts(node) {
  if (node.tagName === 'script') new vm.Script(node.childNodes.map(child => child.value || '').join(''));
  for (const child of node.childNodes || []) checkScripts(child);
}
checkScripts(parse(english.bytes.toString()));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 877, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async text => { window.copiedText = text; } }
  }));
  await page.goto(pathToFileURL(target).href);
  await page.locator('[data-spg-tab="compare"]').click();
  for (const selector of ['#spg-thread-profile', '#spg-compare-thread-profile']) {
    const fine = page.locator(`${selector} option[value="m-manual"]`);
    assert.match(await fine.textContent(), /Metric fine$/);
    assert.doesNotMatch(await fine.textContent(), /Own dimensions/);
  }
  const inputs = () => page.locator('.spg-compare-discount-input:visible');
  const row = label => page.locator('#spg-cost-data > .spg-compare-result-row')
    .filter({ has: page.locator('.spg-result-label', { hasText: new RegExp(`^${label}$`) }) });
  const values = label => row(label).locator('.spg-compare-cell-value').evaluateAll(nodes => nodes.map(node => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('button').forEach(button => button.remove());
    return copy.textContent;
  }));
  const synced = async value => assert.deepEqual(await inputs().evaluateAll(nodes => nodes.map(n => n.value)), [value, value]);
  const priceState = async active => {
    const empty = await inputs().first().inputValue() === '';
    for (const [label, inactive] of [['Tooling cost', active], ['Price after discount', !active && !empty]]) {
      const rows = page.locator('.spg-compare-result-row, .spg-compare-mobile-result-row')
        .filter({ has: page.locator('.spg-result-label', { hasText: new RegExp(`^${label}$`) }) });
      assert.deepEqual(await rows.evaluateAll(nodes => nodes.map(n => n.classList.contains('spg-compare-price-inactive'))), [inactive, inactive, inactive]);
    }
    if (empty) {
      assert.deepEqual(await values('Price after discount'), ['-', '-']);
      const colors = await row('Price after discount').locator('.spg-compare-cell-value').evaluateAll(nodes => nodes.map(n => getComputedStyle(n).color));
      assert.deepEqual(colors, ['rgb(47, 104, 164)', 'rgb(47, 104, 164)']);
    }
  };
  assert.equal(await inputs().count(), 0);
  assert.equal(await row('Price after discount').count(), 0);
  await page.locator('#spg-compare-password').fill('xl');
  await page.locator('#spg-unlock-compare').click();
  assert.equal(await inputs().count(), 0);
  await page.locator('#spg-compare-password').fill('XL');
  await page.locator('#spg-unlock-compare').click();
  assert.equal(await inputs().count(), 2);
  assert.equal(await page.locator('#spg-compare-discount-controls, #spg-compare-apply-discount').count(), 0);
  await synced('');
  for (const input of await inputs().all()) assert.equal(await input.getAttribute('placeholder'), '%');
  for (const input of await page.locator('.spg-compare-price-input:visible').all()) assert.equal(await input.getAttribute('placeholder'), '\u20ac');
  await priceState(false);
  const original = await values('Total cost per thread');
  const machine = await values('Machine cost per thread');
  const time = await values('Time to mill thread');
  const gross = (await values('Tooling cost')).map(v => Number.parseFloat(v.replaceAll(',', '')));
  await page.locator('#spg-cost-data').screenshot({ path: path.join(output, 'discount-empty-desktop.png') });
  await inputs().nth(0).fill('20');
  await synced('20');
  await priceState(true);
  assert.deepEqual(await values('Price after discount'), gross.map(v => `${(v * .8).toFixed(2)} €`));
  assert.notDeepEqual(await values('Total cost per thread'), original);
  assert.deepEqual(await values('Machine cost per thread'), machine);
  assert.deepEqual(await values('Time to mill thread'), time);
  await inputs().nth(1).fill('');
  await synced('');
  await priceState(false);
  assert.deepEqual(await values('Total cost per thread'), original);
  await inputs().nth(1).pressSequentially('12.5');
  await synced('12.5');
  await inputs().nth(1).fill('12,5');
  await synced('12,5');
  for (const [side, price] of [['a', '100'], ['b', '200']]) {
    await page.locator(`#spg-compare-tool-${side}-price`).fill(price);
    await page.locator(`#spg-compare-tool-${side}-price`).blur();
  }
  assert.deepEqual(await values('Price after discount'), ['87.50 €', '175.00 €']);
  for (const invalid of ['-1', '100.01', 'abc']) {
    await inputs().nth(0).fill(invalid);
    await synced(invalid);
    assert.deepEqual(await values('Total cost per thread'), ['-', '-']);
    for (const input of await inputs().all()) assert.equal(await input.getAttribute('aria-invalid'), 'true');
  }
  await inputs().nth(1).fill('100');
  assert.deepEqual(await values('Price after discount'), ['0.00 €', '0.00 €']);
  assert.deepEqual(await values('Total cost per thread'), await values('Machine cost per thread'));
  await inputs().nth(0).fill('0');
  await synced('0');
  await priceState(false);
  assert.deepEqual(await values('Price after discount'), ['100.00 €', '200.00 €']);
  await inputs().nth(1).fill('20');
  await page.locator('#spg-copy-compare-results').click();
  assert.match(await page.evaluate(() => window.copiedText), /Discount \(%\): 20.00/);
  assert.match(await page.evaluate(() => window.copiedText), /Price after discount: 80.00 €/);
  await page.reload();
  await page.locator('[data-spg-tab="compare"]').click();
  await synced('20');
  await page.locator('#spg-cost-data').screenshot({ path: path.join(output, 'discount-active-desktop.png') });
  for (const [width, height] of [[1440, 1100], [877, 1000], [720, 1000], [561, 1000], [560, 844], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await inputs().count(), 2);
    const fieldStyles = await page.locator('.spg-compare-result-row:visible, .spg-compare-mobile-result-row:visible').evaluateAll(rows => rows.flatMap(row => [...row.querySelectorAll('input')].map(input => {
      const rect = input.getBoundingClientRect();
      const style = getComputedStyle(input, '::placeholder');
      return { width: rect.width, height: rect.height, symbol: input.placeholder, placeholder: [style.color, style.fontFamily, style.fontSize, style.fontWeight, style.fontStyle, style.textAlign, style.opacity] };
    })));
    const other = fieldStyles.find(field => !['\u20ac', '%'].includes(field.symbol));
    const moneyFields = fieldStyles.filter(field => ['\u20ac', '%'].includes(field.symbol));
    assert.equal(moneyFields.length, 4);
    for (const field of moneyFields) {
      assert.ok(Math.abs(field.width - other.width) < 1, `${width}: equal input widths`);
      assert.equal(field.height, other.height, `${width}: equal input heights`);
      assert.deepEqual(field.placeholder, moneyFields[0].placeholder, `${width}: matching symbol styles`);
    }
    await inputs().nth(1).fill('25');
    await synced('25');
    await priceState(true);
    await inputs().nth(0).fill('');
    await synced('');
    await priceState(false);
    assert.equal(await row('Price after discount').count(), 1);
    const layout = await page.locator('.spg-compare-discount-row:visible').evaluateAll(nodes => nodes.map(node => ({
      overflow: node.scrollWidth > node.clientWidth + 1,
      overlap: [...node.querySelectorAll('input')].some(input => {
        const value = input.previousElementSibling.getBoundingClientRect();
        const field = input.getBoundingClientRect();
        return value.right > field.left || field.right > node.getBoundingClientRect().right;
      })
    })));
    assert.ok(layout.every(row => !row.overflow && !row.overlap), `${width}: ${JSON.stringify(layout)}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: page overflow`);
    if (width === 390) {
      await page.locator('.spg-compare-mobile-result-card').first().screenshot({ path: path.join(output, 'discount-empty-mobile.png') });
      await inputs().nth(1).fill('20');
      await page.locator('.spg-compare-mobile-result-card').first().screenshot({ path: path.join(output, 'discount-active-mobile.png') });
    }
  }
  assert.deepEqual(errors, []);
  for (const [width, height] of [[877, 1000], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const visibleRows = page.locator('.spg-compare-result-row:visible, .spg-compare-mobile-result-row:visible');
    const fields = [
      ['Tooling cost', '100'], ['Tool life', '150'], ['Cutting speed', '110'],
      ['Feed/tooth', '0.025'], ['Radial passes (max 3)', '2'], ['Price after discount', '20']
    ];
    for (const [label, value] of fields) {
      const matchingRows = visibleRows.filter({ has: page.locator('.spg-result-label', { hasText: label, exact: true }) });
      for (const side of [0, 1]) {
        const field = matchingRows.locator('input').nth(side);
        await field.fill(value);
        await field.blur();
        const cell = field.locator('..');
        const reset = cell.locator('.spg-compare-reset');
        assert.equal(await reset.count(), 1, `${width}: ${label} ${side} reset`);
        assert.equal(await reset.getAttribute('title'), 'Restore recommended value');
        const geometry = await reset.evaluate(button => {
          const rect = button.getBoundingClientRect();
          const reference = button.parentElement;
          const range = document.createRange();
          range.selectNode(reference.firstChild);
          const text = range.getBoundingClientRect();
          const input = reference.nextElementSibling.getBoundingClientRect();
          return { width: rect.width, height: rect.height, gap: rect.left - text.right, clear: rect.right <= input.left };
        });
        assert.deepEqual([geometry.width, geometry.height], [18, 18]);
        assert.ok(geometry.gap >= 7 && geometry.clear, `${width}: ${label} spacing ${JSON.stringify(geometry)}`);
        await reset.click();
        assert.equal(await field.inputValue(), '', `${width}: ${label} clears`);
        assert.equal(await cell.locator('.spg-compare-reset').count(), 0);
        if (label === 'Price after discount') await synced('');
      }
    }
    // Show every editable row with its restore control in the review screenshots.
    for (const [label, value] of fields) {
      const matchingRows = visibleRows.filter({ has: page.locator('.spg-result-label', { hasText: label, exact: true }) });
      for (const side of [0, 1]) {
        await matchingRows.locator('input').nth(side).fill(value);
        await matchingRows.locator('input').nth(side).blur();
      }
    }
    const screenshotTarget = width > 560 ? page.locator('#spg-cost-data') : page.locator('.spg-compare-mobile-result-card').first();
    await screenshotTarget.screenshot({ path: path.join(output, `restore-${width}.png`) });
  }
  await page.reload();
  await page.locator('[data-spg-tab="compare"]').click();
  await inputs().first().fill('');
  await page.reload();
  await page.locator('[data-spg-tab="compare"]').click();
  await synced('');
  assert.deepEqual(errors, []);
  console.log('PASS restore buttons: all six editable rows, tools A/B, shared discount reset, 18px buttons, 8px spacing, desktop/mobile.');
  console.log('PASS English preview: scripts parse; unlock; A/B live sync; decimals; clearing; zero; 100%; invalid values; price state; cost calculations; copy; reload; 8 desktop/mobile sizes.');
} finally {
  await browser.close();
}
