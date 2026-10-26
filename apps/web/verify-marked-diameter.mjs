import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1100}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(new URL('./index.html', import.meta.url).href);
  await page.locator('[data-spg-tab="main"]').click();
  await page.locator('#spg-thread-length').fill('12');
  const field = page.locator('#spg-marked-diameter');
  const program = page.locator('#spg-cnc-program');
  assert.equal(await field.inputValue(), '7.50');
  const tool = await page.locator('#spg-tool').inputValue();
  const link = await page.locator('#spg-tool-link').getAttribute('href');
  for (const post of ['fanuc', 'heidenhain']) {
    await page.locator('#spg-control-system').selectOption(post);
    for (const hand of ['right', 'left']) {
      await page.locator('#spg-thread-hand').selectOption(hand);
      await page.locator('#spg-reset-diameter').click();
      const baseline = await program.inputValue();
      await field.fill('7,42');
      const changed = await program.inputValue();
      assert.notEqual(changed, baseline);
      assert.match(changed, post === 'fanuc' ? /I-1\.29/ : /IX-1\.29/);
      assert.equal(await page.locator('#spg-tool').inputValue(), tool);
      assert.equal(await page.locator('#spg-tool-link').getAttribute('href'), link);
      await field.fill('7.42');
      assert.equal(await program.inputValue(), changed);
      for (const invalid of ['', 'abc', 'Infinity', '0', '-2', '10']) {
        await field.fill(invalid);
        assert.doesNotMatch(await program.inputValue(), /G03|CP IPA/);
      }
      await page.locator('#spg-reset-diameter').click();
      assert.equal(await program.inputValue(), baseline);
    }
  }
  await field.fill('7.42');
  await page.locator('#spg-tool').selectOption({index: 1});
  assert.equal(await field.inputValue(), '7.50');
  await field.fill('7.42');
  await page.locator('#spg-thread-size').selectOption({label: 'M12'});
  assert.notEqual(await field.inputValue(), '7.42');
  await page.locator('#spg-tool').selectOption('__custom_tool__');
  assert.equal(await field.isVisible(), false);
  assert.equal(await page.locator('#spg-override-cutter-diameter').isVisible(), true);
  await page.locator('#spg-tool').selectOption({index: 0});
  assert.equal(await field.isVisible(), true);
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 1100});
    await field.fill('9,85');
    assert.equal(await field.isVisible(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path: `${tmpdir()}/smiprog-diameter-${width}.png`, fullPage: true});
  }
  assert.deepEqual(errors, []);
  console.log('Laser-marked diameter: both posts/hands, decimals, validation, reset, tool changes, custom tools and responsive layout passed.');
} finally { await browser.close(); }
