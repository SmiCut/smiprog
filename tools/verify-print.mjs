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
      await page.addStyleTag({content: 'body h1, body h2, body table {font-family: Georgia;line-height:45px} body th{background:#111} body dd{padding-left:20px}'});
      await page.locator('[data-spg-tab="main"]').click();
      await page.locator('#spg-thread-length').fill('');
      await page.locator('#print-main').click();
      assert.equal(await page.locator('.spg-report-error').innerText(),dictionary['print.incomplete']);
      await page.locator('#spg-thread-length').fill('12');
      const dialog = page.locator('#spg-report-preview');
      for (const mode of ['main','cnc','compare']) {
        if (mode === 'compare') {
          await page.locator('[data-spg-tab="compare"]').click();
          if (locale !== 'sv') {
            await page.locator('#spg-compare-password').fill('XL');
            await page.locator('#spg-unlock-compare').click();
          }
          await page.locator('input.spg-compare-price-input:visible').first().fill('125');
          await page.locator('.spg-compare-discount-input:visible').first().fill('15');
        }
        const button = page.locator('#print-'+mode);
        assert.equal(await button.innerText(),dictionary['print.button']);
        await button.click();
        assert.equal(await dialog.isVisible(),true);
        assert.equal(await dialog.locator('h1').first().innerText(),dictionary[mode==='compare'?'print.comparison':'print.setup']);
        assert.equal(await dialog.locator('.report-code').count(), mode === 'cnc' ? 1 : 0);
        for (const sheet of await dialog.locator('.report-sheet').all()) {
          const gap = await sheet.evaluate(el => el.getBoundingClientRect().bottom - el.querySelector('footer').getBoundingClientRect().bottom);
          assert(Math.abs(gap) <= 1, locale+' preview footer gap: '+gap);
        }
        if (mode === 'main') {
          const hostStyles = await dialog.evaluate(el => {
            const style = selector => getComputedStyle(el.querySelector(selector));
            return [style('tbody th').backgroundColor,style('tbody th').fontFamily === style('article').fontFamily,
              style('dd').paddingLeft,style('h2').lineHeight];
          });
          assert.deepEqual(hostStyles.slice(0,3),['rgba(0, 0, 0, 0)',true,'0px']);
          assert(parseFloat(hostStyles[3]) < 24);
        }
        if (mode === 'cnc') {
          assert.equal(await dialog.locator('pre').innerText(),await page.locator('#spg-cnc-program').inputValue());
          assert.equal(await dialog.locator('.report-page-number').last().innerText(),dictionary['print.page'].replace('{page}','2').replace('{pages}','2'));
        }
        if (mode === 'compare') {
          assert.equal(await dialog.locator('.report-sheet').count(),1);
          const prices = await dialog.locator('.report-price .report-cell-values span').evaluateAll(values => values.map(el=>getComputedStyle(el).color));
          assert(prices.length >= 4 && prices.every(color=>color === 'rgb(0, 0, 0)'));
          assert(await dialog.locator('.report-difference').count()>0);
          if (engine === chromium) {
            for (const format of ['A4','Letter']) {
              const pdf = await page.pdf({format,printBackground:true});
              const pages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g);
              assert.equal(pages?.length,1,locale+' '+format+' comparison PDF');
            }
          }
        }
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
          else assert.equal(boxes.length,1);
          assert(boxes.every(box=>Math.abs(box.width-794)<1 && Math.abs(box.height-1123)<1));
        }
      }
      assert.deepEqual(errors,[]);
      await page.close();
      console.log(engine.name(),locale,'OK');
    }
  } finally { await browser.close(); }
}
