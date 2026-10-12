import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import PHPParser from 'php-parser';
import { createLanguagePackages, locales } from '../tools/build-language-packages.mjs';
import { repositoryRoot } from '../tools/build-wordpress-plugin.mjs';

const packages = await createLanguagePackages();

test('every available locale has an independent static and WordPress package', () => {
  assert.deepEqual(packages.map(p => p.locale), locales);
  for (const p of packages) {
    assert.match(p.standalone.get('index.html').toString(), new RegExp(`<html lang="${p.locale}"`));
    assert.match(p.standalone.get('LICENSE').toString(), /MIT License/);
    assert.match(p.wordpress.get('LICENSE').toString(), /MIT License/);
    const parser = new PHPParser({ parser: { suppressErrors: false, version: '8.0' } });
    const php = p.wordpress.get('smiprog-widget.php').toString();
    assert.doesNotThrow(() => parser.parseCode(php, 'smiprog-widget.php'));
    assert.ok(php.includes(`array('locale' => '${p.locale}')`));
  }
});

test('each package contains its chosen dictionary plus English fallback and unchanged calculation code', async () => {
  const baseContext = { window: {} };
  const sourceCore = await fs.readFile(path.join(repositoryRoot, 'apps/web/js/core.js'), 'utf8');
  vm.runInNewContext(sourceCore, baseContext);
  for (const p of packages) {
    const context = { window: {} };
    vm.runInNewContext(p.standalone.get('i18n/en.js').toString(), context);
    assert.deepEqual(Object.keys(context.window.SmiProgTranslations).sort(), [...new Set(['en', p.locale])].sort());
    const original = JSON.parse(await fs.readFile(path.join(repositoryRoot, `apps/web/i18n/${p.locale}.json`), 'utf8'));
    assert.deepEqual(JSON.parse(JSON.stringify(context.window.SmiProgTranslations[p.locale])), original);
    const calculationContext = { window: {} };
    for (const file of ['data/smiprog-data.js', 'js/core.js']) vm.runInNewContext(p.standalone.get(file).toString(), calculationContext);
    const fixture = JSON.parse(await fs.readFile(path.join(repositoryRoot, 'apps/web/tests/golden/fanuc-original-default.json'), 'utf8'));
    const result = calculationContext.window.SmiProgCore.calculate(fixture.input, calculationContext.window.SmiProgData);
    assert.deepEqual(Array.from(result.cncProgram), fixture.expectedCncProgram);
  }
});

test('local scripts, styles and images resolve inside each standalone package', () => {
  for (const p of packages) {
    function walk(node) {
      for (const attribute of node.attrs || []) {
        if (['src', 'href'].includes(attribute.name) && attribute.value.startsWith('./')) {
          assert.ok(p.standalone.has(attribute.value.slice(2).split('?')[0]), attribute.value);
        }
      }
      for (const child of node.childNodes || []) walk(child);
    }
    walk(parse(p.standalone.get('index.html').toString()));
  }
});
