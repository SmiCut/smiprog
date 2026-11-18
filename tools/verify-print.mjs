import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { repositoryRoot } from './build-app-files.mjs';
import { locales } from './build-language-packages.mjs';
import { buildSingleHtmlDownloads } from './build-single-html.mjs';

await buildSingleHtmlDownloads();
const bridge = await fs.readFile(new URL('../ios-print/report-page.js', import.meta.url),'utf8');
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    for (const locale of locales) {
      const dictionary = JSON.parse(await fs.readFile(path.join(repositoryRoot,'apps/web/i18n',locale+'.json'),'utf8'));
      const url = pathToFileURL(path.join(repositoryRoot,'dist/downloads','smiprog-'+locale+'.html')).href;
      const page = await browser.newPage({viewport:{width:engine === chromium ? 1280 : 390,height:850}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route(/^https?:/, route => route.abort());
      await page.goto(url);
      await page.locator('[data-spg-tab="main"]').click();
      await page.locator('#spg-thread-length').fill('');
      await page.locator('#print-main').click();
      assert.equal(await page.locator('.spg-report-error').innerText(),dictionary['print.incomplete']);
      await page.locator('#spg-thread-length').fill('12');
      const dialog = page.locator('#spg-report-preview');
      for (const mode of ['main','cnc','compare']) {
        if (mode === 'compare') await page.locator('[data-spg-tab="compare"]').click();
        const button = page.locator('#print-'+mode);
        assert.equal(await button.innerText(),dictionary['print.button']);
        await button.click();
        assert.equal(await dialog.isVisible(),true);
        assert.equal(await dialog.locator('h1').first().innerText(),dictionary[mode==='compare'?'print.comparison':'print.setup']);
        assert.equal(await dialog.locator('.report-code').count(), mode === 'cnc' ? 1 : 0);
        if (mode === 'cnc') {
          assert.equal(await dialog.locator('pre').innerText(),await page.locator('#spg-cnc-program').inputValue());
          assert.equal(await dialog.locator('.report-page-number').last().innerText(),dictionary['print.page'].replace('{page}','2').replace('{pages}','2'));
        }
        if (mode === 'compare') assert(await dialog.locator('.report-difference').count()>0);
        await dialog.locator('[data-close]').click();
      }
      if (engine === webkit) {
        await page.setViewportSize({width:794,height:1123});
        for (const mode of ['cnc','compare']) {
          await page.goto(url);
          await page.addScriptTag({content:bridge});
          const fields = [{id:mode==='cnc'?'spg-thread-length':'spg-compare-thread-length',value:'12'}];
          const boxes = await page.evaluate(({mode,fields}) => prepareSmiProgPages(mode, fields, null),{mode,fields});
          if (mode === 'cnc') assert.equal(boxes.length,2);
          else assert(boxes.length >= 1 && boxes.length <= 2);
          assert(boxes.every(box=>Math.abs(box.width-794)<1 && Math.abs(box.height-1123)<1));
        }
      }
      assert.deepEqual(errors,[]);
      await page.close();
      console.log(engine.name(),locale,'OK');
    }
  } finally { await browser.close(); }
}
