import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildSingleHtmlDownloads } from './build-single-html.mjs';
import { repositoryRoot } from './build-app-files.mjs';

const files = await buildSingleHtmlDownloads();
const output = path.join(repositoryRoot, 'tmp/compare-layout');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
// Include constrained WordPress columns, not only full-width browser windows.
const cases = [
  [877, 1000, 728], [1200, 1000, 728], [1440, 1000, 1100],
  [1100, 1000, 861], [1100, 1000, 860], [860, 1000, 714],
  [900, 1000, 681], [900, 1000, 680], [720, 1000, 600],
  [561, 1000, 561], [560, 844, 560], [390, 844, 390],
  [844, 390, 728], [540, 320, 540], [1200, 1000, 390]
];
try {
  for (const file of files.filter(file => !process.env.VERIFY_LOCALES || process.env.VERIFY_LOCALES.split(',').includes(file.locale))) {
    const context = await browser.newContext({ viewport: { width: 877, height: 1000 }, offline: true });
    const page = await context.newPage();
    const html = await fs.readFile(path.join(repositoryRoot, 'dist/downloads', file.name), 'utf8');
    await page.evaluate(() => { navigator.share = async () => {}; });
    await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#host{max-width:100%;margin:auto}</style><article id="host">${html}</article>`);
    await page.locator('[data-spg-tab="compare"]').click();
    assert.equal(await page.locator('.spg-compare-result-copy-group button').count(), 1, `${file.locale}: only Copy in Results, even with Web Share available`);
    assert.equal(await page.locator('#spg-copy-compare-results').isVisible(), true, `${file.locale}: Copy remains available`);
    if (file.locale !== 'sv') {
      await page.locator('#spg-compare-password').fill('XL');
      await page.locator('#spg-unlock-compare').click();
    }
    await page.locator('#spg-compare-discount').fill('20');
    await page.locator('#spg-compare-apply-discount').check();
    for (const [width, height, hostWidth] of cases) {
      await page.setViewportSize({ width, height });
      await page.locator('#host').evaluate((node, size) => { node.style.width = `${size}px`; }, hostWidth);
      const layout = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect();
        const workspace = rect('.spg-compare-workspace');
        const tools = rect('.spg-compare-tool-grid');
        const button = rect('#spg-use-current-setup');
        const note = rect('.spg-compare-note');
        const cards = [...document.querySelectorAll('.spg-compare-tool-card')];
        return {
          unusedWidth: workspace.right - tools.right,
          narrowCards: cards.filter(card => card.getBoundingClientRect().width < Math.min(300, workspace.width) - 1).length,
          overflow: [...document.querySelectorAll('.spg-compare-tool-metric, .spg-compare-tool-type-label, .spg-compare-tool-select-row, .spg-compare-note-row, .spg-compare-discount-controls, .spg-compare-discount-toggle')]
            .filter(node => node.scrollWidth > node.clientWidth + 2).map(node => node.className),
          buttonAbove: button.bottom <= note.top,
          fullWidthButton: Math.abs(button.width - note.width) < 1,
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          imagesLoaded: [...document.querySelectorAll('.spg-compare-tool-card img')].every(img => img.complete && img.naturalWidth > 0)
        };
      });
      const label = `${file.locale}: viewport ${width}x${height}, host ${hostWidth}`;
      if (file.locale === 'en' && [728, 390].includes(hostWidth)) {
        await page.screenshot({ path: path.join(output, `${file.locale}-${width}-${height}-${hostWidth}.png`), fullPage: true });
      }
      assert(Math.abs(layout.unusedWidth) < 2, `${label}: unused workspace width ${layout.unusedWidth}`);
      assert.equal(layout.narrowCards, 0, `${label}: squeezed tool cards`);
      assert.deepEqual(layout.overflow, [], `${label}: text overflow`);
      assert.equal(layout.pageOverflow, false, `${label}: page overflow`);
      assert.equal(layout.imagesLoaded, true, `${label}: tool images`);
      const portraitPhone = width <= 560 && height >= width;
      assert.equal(layout.buttonAbove, portraitPhone, `${label}: setup button position`);
      if (portraitPhone) assert.equal(layout.fullWidthButton, true, `${label}: setup button width`);
    }
    await context.close();
    console.log(`PASS ${file.locale}: ${cases.length} Compare viewport/container combinations`);
  }
} finally {
  await browser.close();
}
