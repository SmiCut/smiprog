import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import vm from "node:vm";
import path from "node:path";
import { parse } from "parse5";
import { locales, webRoot, walk, attribute } from "../tools/build-language-packages.mjs";
import { createSingleHtmlDownloads } from "../tools/build-single-html.mjs";

const dictionaries = Object.fromEntries(await Promise.all(locales.map(async locale => [locale,
  JSON.parse(await fs.readFile(path.join(webRoot, `i18n/${locale}.json`), "utf8"))])));
const helper = await fs.readFile(path.join(webRoot, "js/i18n.js"), "utf8");
function runtime(locale) {
  const window = { SmiProgTranslations: dictionaries, SmiProgConfig: { locale } };
  vm.runInNewContext(helper, { window, Intl });
  return window.SmiProgI18n;
}

test("all 16 dictionaries have complete matching keys and named placeholders", () => {
  const keys = Object.keys(dictionaries.en).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(dictionaries[locale]).sort(), keys, locale);
    for (const key of keys) {
      const text = dictionaries[locale][key];
      assert.ok(text.trim(), `${locale}/${key}`);
      assert.doesNotMatch(text, /%(?:\d+\$)?@|%%/, `${locale}/${key}: Swift placeholder`);
      assert.deepEqual([...text.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),
        [...dictionaries.en[key].matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(), `${locale}/${key}`);
      if (/^material(?:Group|Descriptor)\./.test(key)) assert.doesNotMatch(text, /Rm\s*\(N\/mm2\)|N\/mm2\s*</);
    }
    const text = runtime(locale).format("compare.saving", { tool: "A", amount: "42", percent: "12" });
    assert.equal((text.match(/[%％]/g) || []).length, 1, locale);
    assert.doesNotMatch(text, /\{\w+\}/);
    for (const key of ['materialSelector.title', 'start.materialSelector.title']) {
      assert.ok((dictionaries[locale][key].match(/SmiCut|スミカット/g) || []).length <= 1, `${locale}/${key}: duplicate brand`);
    }
  }
});

test("regional and Chinese variants resolve without losing backend market codes", () => {
  for (const [locale, key, backend] of [
    ["zh-Hans", "zh", "zh"], ["zh-CN", "zh", "zh"], ["zh-Hant-TW", "zh-tw", "zh-tw"],
    ["zh-TW", "zh-tw", "zh-tw"], ["zh_HK", "zh-tw", "zh-tw"],
    ["en-ZA", "en", "en-za"], ["fr-BE", "fr", "fr-be"], ["es-GL", "es", "es-gl"],
    ["nl-BE", "nl", "nl-be"], ["sv_SE", "sv", "sv-se"], ["xx", "en", "xx"]
  ]) {
    const i18n = runtime(locale);
    assert.equal(i18n.getLocaleKey(), key);
    assert.equal(i18n.getMaterialSelectorLanguage(), backend);
    assert.equal(i18n.t("compare.useCurrent"), dictionaries[key]["compare.useCurrent"]);
    assert.doesNotThrow(()=>new Intl.NumberFormat(i18n.getNumberLocale()).format(1.5));
  }
  assert.equal(runtime("en").t("unknown", "Fallback"), "Fallback");
});

test("generated HTML exists in each language and every inline script parses", async () => {
  const downloads = await createSingleHtmlDownloads();
  for (const locale of locales) {
    const file = path.join(webRoot, `languages/${locale}.html`);
    for (const html of [await fs.readFile(file, "utf8"), downloads.find(item => item.locale === locale).bytes.toString()]) {
      const document = parse(html);
      let count = 0;
      walk(document, node => {
        if (node.tagName === "html" && attribute(node, "lang")) assert.equal(attribute(node, "lang"), locale);
        if (node.tagName === "script" && !attribute(node, "src")) {
          new vm.Script(node.childNodes.map(n=>n.value || "").join(""), { filename: file });
          count++;
        }
        for (const attr of node.attrs || []) {
          if (attr.name.startsWith("data-i18n")) assert.ok(dictionaries[locale][attr.value], `${locale}: ${attr.value}`);
        }
      });
      assert.ok(count > 0);
    }
  }
});
