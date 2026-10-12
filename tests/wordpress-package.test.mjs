import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { parse, parseFragment } from "parse5";
import PHPParser from "php-parser";
import { unzipSync } from "fflate";
import { createWordPressFiles, createWordPressArchive, repositoryRoot, apiUrl } from "../tools/build-wordpress-plugin.mjs";

function elements(document) {
  const result = [];
  function visit(node) {
    if (node.tagName) result.push(node);
    for (const child of node.childNodes || []) visit(child);
  }
  visit(document);
  return result;
}
const attribute = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
const { files, manifest } = await createWordPressFiles();

test("WordPress package contains only static runtime assets and its plugin adapter", () => {
  assert.equal(files.size, 27);
  for (const name of files.keys()) {
    if (["LICENSE", "THIRD_PARTY_NOTICES"].includes(name)) continue;
    assert.match(name, /^(?:app\/(?:index\.html|(?:styles|material-selector)\.css|(?:data|js|i18n)\/[a-z0-9-]+\.(?:js|json)|assets\/(?:thread-mills|info)\/[a-zA-Z0-9_.-]+\.(?:png|svg))|templates\/smiprog\.html|manifest\.json|smiprog-widget\.php)$/);
    assert.doesNotMatch(name, /server|test|\.env|\.xlsx|\.csv|\.map/);
  }
  assert.equal(manifest.materialSelectorApiUrl, apiUrl);
  assert.equal(manifest.styles.length, 2);
  assert.equal(manifest.scripts.length, 7);
  assert.match(files.get("LICENSE").toString(), /MIT License/);
  assert.match(files.get("LICENSE").toString(), /Copyright \(c\) 2026 SmiCut AB/);
  assert.match(files.get("THIRD_PARTY_NOTICES").toString(), /Lucide Icons and Contributors/);
});

test("HTML fragment has one app root, no page wrappers/scripts and plugin-relative images", () => {
  const nodes = elements(parseFragment(files.get("templates/smiprog.html").toString()));
  assert.equal(nodes.filter(node => attribute(node, "id") === "smiprog-app").length, 1);
  assert.equal(nodes.filter(node => ["html", "head", "body", "script", "link"].includes(node.tagName)).length, 0);
  const images = nodes.filter(node => node.tagName === "img");
  assert.equal(images.length, 2);
  for (const image of images) {
    const source = attribute(image, "src");
    assert.ok(source.startsWith("__SMIPROG_ASSET_BASE__"));
    assert.ok(files.has("app/assets/" + source.replace("__SMIPROG_ASSET_BASE__", "").split("?")[0]));
  }
});

test("Standalone HTML and WordPress manifest resolve assets with content-hash versions", () => {
  for (const node of elements(parse(files.get("app/index.html").toString()))) {
    for (const name of ["src", "href"]) {
      const reference = attribute(node, name);
      if (!reference?.startsWith("./")) continue;
      const url = new URL(reference, "https://www.smicut.com/wp-content/plugins/smiprog-widget/app/");
      const file = reference.slice(2).split("?")[0];
      assert.ok(files.has(`app/${file}`), reference);
      assert.equal(url.searchParams.get("v"), createHash("sha256").update(files.get(`app/${file}`)).digest("hex").slice(0, 16));
    }
  }
  const loaded = new Set();
  for (const script of manifest.scripts) {
    for (const dependency of script.dependencies) assert.ok(loaded.has(dependency));
    assert.equal(script.hash, createHash("sha256").update(files.get(`app/${script.file}`)).digest("hex").slice(0, 16));
    loaded.add(script.handle);
  }
  assert.equal(manifest.scripts[0].file, "i18n/en.js");
  assert.equal(manifest.scripts.at(-1).file, "js/app.js");
});

test("All generated JavaScript and PHP parse and the English language file survives", async () => {
  for (const [name, data] of files) {
    if (name.endsWith(".js")) new vm.Script(data.toString(), { filename: name });
  }
  const parser = new PHPParser({ parser: { suppressErrors: false, version: "8.0" } });
  const php = files.get("smiprog-widget.php").toString();
  assert.doesNotThrow(() => parser.parseCode(php, "smiprog-widget.php"));
  assert.doesNotMatch(php, /__SMIPROG_VERSION__/);
  assert.match(php, /add_shortcode\('smiprog'/);
  assert.match(php, /wp_add_inline_script/);
  assert.match(php, /esc_url/);
  const context = { window: {} };
  vm.runInNewContext(files.get("app/i18n/en.js").toString(), context);
  for (const locale of ["en"]) {
    const original = JSON.parse(await fs.readFile(path.join(repositoryRoot, `apps/web/i18n/${locale}.json`), "utf8"));
    assert.deepEqual(JSON.parse(files.get(`app/i18n/${locale}.json`).toString()), original);
    assert.equal(context.window.SmiProgTranslations[locale]["materialSelector.welcomeTitle"], original["materialSelector.welcomeTitle"]);
  }
});

test("Build is repeatable without changing the calculator's source files", async () => {
  const repeated = await createWordPressFiles();
  assert.deepEqual(repeated.manifest, manifest);
  assert.deepEqual(repeated.files, files);
});

test("Upload archive contains exactly the tested files under one plugin directory", () => {
  const archive = createWordPressArchive(files);
  const unzipped = unzipSync(archive);
  assert.equal(Object.keys(unzipped).length, files.size);
  for (const [name, data] of files) assert.deepEqual(Buffer.from(unzipped[`smiprog-widget/${name}`]), data);
  assert.deepEqual(createWordPressArchive(files), archive);
});

test("Minified engine preserves all 153 Excel cases, 57 golden cases and 36 Compare calculations", async () => {
  const source = { window: {} };
  const minified = { window: {} };
  vm.createContext(source);
  vm.createContext(minified);
  for (const file of ["data/smiprog-data.js", "js/core.js"]) {
    vm.runInContext(await fs.readFile(path.join(repositoryRoot, "apps/web", file), "utf8"), source);
    vm.runInContext(files.get(`app/${file}`).toString(), minified);
  }
  const oracle = JSON.parse(await fs.readFile(path.join(repositoryRoot, "apps/web/tests/excel-parity-oracle.json"), "utf8"));
  const costs = JSON.parse(await fs.readFile(path.join(repositoryRoot, "apps/web/tests/compare-cost-oracle.json"), "utf8"));
  const inputs = oracle.cases.map(entry => ({ name: entry.id, input: entry.input }));
  assert.equal(inputs.length, 153);
  const golden = path.join(repositoryRoot, "apps/web/tests/golden");
  for (const file of await fs.readdir(golden)) {
    if (!file.endsWith(".json")) continue;
    const fixture = JSON.parse(await fs.readFile(path.join(golden, file), "utf8"));
    if (fixture.status !== "todo") inputs.push({ name: fixture.name, input: fixture.input });
  }
  assert.equal(inputs.length, 210);
  for (const scenario of costs.cases) {
    for (const side of ["A", "B"]) {
      const reference = oracle.cases.find(entry => entry.id === scenario[`timingCase${side}`]);
      inputs.push({ name: scenario.id + side, input: { ...reference.input, machineCost: scenario.machineCost,
        toolLife: scenario[`life${side}`], overrides: { ...reference.input.overrides, toolPrice: scenario[`price${side}`] } } });
    }
  }
  assert.equal(inputs.length, 246);
  for (const { name, input } of inputs) {
    const original = source.window.SmiProgCore.calculate(input, source.window.SmiProgData, { includeInternalPosts: true });
    const built = minified.window.SmiProgCore.calculate(input, minified.window.SmiProgData, { includeInternalPosts: true });
    assert.equal(JSON.stringify(built), JSON.stringify(original), name);
  }
});
