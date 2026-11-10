import fs from "node:fs/promises";
import vm from "node:vm";
const file = new URL("../data/tool-web-links.js", import.meta.url);
const context = { window: {} };
vm.runInNewContext(await fs.readFile(file, "utf8"), context);
const ids = JSON.parse(await fs.readFile(new URL("../data/webshop-product-ids.json", import.meta.url), "utf8"));
const entries = Object.fromEntries(Object.entries(context.window.SmiProgToolWebLinks).map(([article, entry]) => [
  article, { ...entry, ...(ids[entry.ean] ? { shopProductID: ids[entry.ean] } : {}) }
]));
await fs.writeFile(file, `/* Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE. */\nwindow.SmiProgToolWebLinks = Object.freeze(${JSON.stringify(entries, null, 2)});\n`);
console.log(`Matched ${Object.values(entries).filter(entry => entry.shopProductID).length} Swedish product links`);
