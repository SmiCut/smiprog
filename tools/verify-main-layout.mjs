import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, webkit } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { repositoryRoot } from './build-app-files.mjs';

const out = path.join(repositoryRoot, 'dist/english-preview');
await fs.mkdir(out, { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium && process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH } : {});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(out, 'smiprog-en.html')).href);
    await page.locator('[data-spg-tab="main"]').click();
    await page.locator('#spg-thread-length').fill('12');
    assert.equal(await page.locator('.spg-info-button').count(), 3);
    assert.equal(await page.locator('.spg-cnc-card #spg-safety-distance').count(), 1);
    assert.equal(await page.locator('label[for="spg-tool"] .spg-step').textContent(), '7');
    assert.equal(await page.locator('label[for="spg-marked-diameter"] .spg-step').textContent(), '8');
    assert.notEqual(await page.locator('#spg-tool-cutting-length').textContent(), '-');
    assert.notEqual(await page.locator('#spg-tool-flutes').textContent(), '-');
    const program = page.locator('#spg-cnc-program');
    const before = await program.inputValue();
    await page.locator('#spg-safety-distance').fill('3');
    assert.notEqual(await program.inputValue(), before);
    await page.locator('#spg-safety-distance').fill('2');
    for (const [width, height] of [[1440,1100],[1024,1000],[877,1000],[720,1000],[561,900],[560,844],[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({ width, height });
      // WebKit can acknowledge a resize before its scroll containers are repainted.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        inner: innerWidth,
        scrollX,
        body: {width:document.body.getBoundingClientRect().width, scroll:document.body.scrollWidth},
        tabs: [...document.querySelectorAll('.spg-tabs')].map(n => ({
          width:n.getBoundingClientRect().width, scroll:n.scrollWidth,
          overflowX:getComputedStyle(n).overflowX, overflowY:getComputedStyle(n).overflowY
        })),
        nodes: [...document.querySelectorAll('#smiprog-app *')].filter(n => {
          const r = n.getBoundingClientRect();
          return r.width && r.right > innerWidth + 1;
        }).slice(0, 10).map(n => ({id:n.id, cls:n.className, width:n.getBoundingClientRect().width}))
      }));
      if (overflow.width > width + 1) await page.screenshot({path:path.join(out,'overflow.png'),fullPage:true});
      assert.ok(overflow.width <= width + 1, `${engine.name()} ${width}: ${JSON.stringify(overflow)}`);
      assert.equal(await page.locator('.spg-final-summary-item').evaluateAll(rows => rows.some(row => {
        const parent = row.getBoundingClientRect();
        return [...row.querySelectorAll('.spg-result-label, .spg-result-value')].some(child => child.getBoundingClientRect().bottom > parent.bottom + 1);
      })), false, `${engine.name()} ${width}: result text must fit its row`);
      for (const button of await page.locator('.spg-info-button').all()) {
        const id = await button.getAttribute('aria-controls');
        await button.click();
        assert.equal(await page.locator('#' + id).isVisible(), true, id);
        const rect = await page.locator('#' + id).boundingBox();
        assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1, `${width}: ${id} bounds`);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#' + id).isVisible(), false);
      }
      if ([1440,390].includes(width)) await page.screenshot({path:path.join(out, `main-${engine.name()}-${width}.png`),fullPage:true});
    }
    await page.locator('#spg-tool').selectOption('__custom_tool__');
    assert.equal(await page.locator('#spg-tool-metrics').isVisible(), false);
    for (const [id, step] of [['cutter-diameter','8'],['edge-length','9'],['flutes','10']]) {
      assert.equal(await page.locator(`label[for="spg-override-${id}"] .spg-step`).textContent(), step);
    }
    await page.locator('#spg-tool').selectOption({index:0});
    assert.equal(await page.locator('#spg-tool-metrics').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(`PASS ${engine.name()}: restored layout, three info buttons, keyboard dismissal, safety recalculation, custom tools, nine viewport sizes.`);
  } finally { await browser.close(); }
}
