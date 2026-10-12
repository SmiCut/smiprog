import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { transform } from "esbuild";
import { parse, serialize, serializeOuter } from "parse5";
import { zipSync } from "fflate";

export const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
export const apiUrl = "https://smicut-material-selector-production.up.railway.app/api/chat";
const scriptNames = ["i18n/en.js", "js/i18n.js", "data/smiprog-data.js", "data/tool-web-links.js",
  "js/core.js", "js/material-selector.js", "js/app.js"];
const styleNames = ["styles.css", "material-selector.css"];
const hash = data => createHash("sha256").update(data).digest("hex").slice(0, 16);
const handle = file => `smiprog-${file.replace(/\.(js|css)$/, "").replaceAll("/", "-")}`;

function walk(node, visitor) {
  visitor(node);
  for (const child of node.childNodes || []) walk(child, visitor);
}

export async function createWordPressFiles() {
  const sourceRoot = path.join(repositoryRoot, "apps/web");
  const files = new Map();
  for (const file of [...scriptNames, ...styleNames]) {
    const source = await fs.readFile(path.join(sourceRoot, file), "utf8");
    const result = await transform(source, { loader: file.endsWith(".css") ? "css" : "js",
      minify: true, target: "es2020", legalComments: "none", charset: "utf8", sourcemap: false });
    files.set(`app/${file}`, Buffer.from(result.code));
  }
  for (const name of (await fs.readdir(path.join(sourceRoot, "i18n"))).sort()) {
    if (/^[a-z]{2}\.json$/.test(name)) {
      const data = JSON.parse(await fs.readFile(path.join(sourceRoot, "i18n", name), "utf8"));
      files.set(`app/i18n/${name}`, Buffer.from(JSON.stringify(data)));
    }
  }
  for (const directory of ["info", "thread-mills"]) {
    for (const name of (await fs.readdir(path.join(sourceRoot, "assets", directory))).sort()) {
      if (!/^[a-zA-Z0-9_.-]+\.(png|svg)$/.test(name)) continue;
      const relative = `assets/${directory}/${name}`;
      files.set(`app/${relative}`, await fs.readFile(path.join(sourceRoot, relative)));
    }
  }

  const manifest = {
    materialSelectorApiUrl: apiUrl,
    styles: styleNames.map(file => ({ handle: handle(file), file, hash: hash(files.get(`app/${file}`)) })),
    scripts: scriptNames.map((file, index) => ({ handle: handle(file), file,
      hash: hash(files.get(`app/${file}`)), dependencies: index ? [handle(scriptNames[index - 1])] : [] }))
  };
  const document = parse(await fs.readFile(path.join(sourceRoot, "index.html"), "utf8"));
  let app;
  walk(document, node => {
    if (node.attrs?.some(attr => attr.name === "id" && attr.value === "smiprog-app")) app = node;
    for (const attr of node.attrs || []) {
      if (!["src", "href"].includes(attr.name) || !attr.value.startsWith("./")) continue;
      const file = attr.value.slice(2).split("?")[0];
      if (files.has(`app/${file}`)) attr.value = `./${file}?v=${hash(files.get(`app/${file}`))}`;
    }
  });
  if (!app) throw new Error("SmiProg DOM root is missing");
  files.set("app/index.html", Buffer.from(serialize(document)));
  walk(app, node => {
    for (const attr of node.attrs || []) {
      if (["src", "href"].includes(attr.name) && attr.value.startsWith("./assets/")) {
        attr.value = attr.value.replace("./assets/", "__SMIPROG_ASSET_BASE__");
      }
    }
  });
  files.set("templates/smiprog.html", Buffer.from(serializeOuter(app)));
  const php = await fs.readFile(path.join(repositoryRoot, "wordpress/smiprog-widget.php"), "utf8");
  const digest = createHash("sha256");
  for (const [name, data] of files) digest.update(name).update(data);
  digest.update(php);
  manifest.version = `1.0.0-${digest.digest("hex").slice(0, 12)}`;
  files.set("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
  files.set("smiprog-widget.php", Buffer.from(php.replaceAll("__SMIPROG_VERSION__", manifest.version)));
  files.set("LICENSE", await fs.readFile(path.join(repositoryRoot, "LICENSE")));
  files.set("THIRD_PARTY_NOTICES", await fs.readFile(path.join(repositoryRoot, "THIRD_PARTY_NOTICES")));
  return { files, manifest };
}

export async function buildWordPressPackage() {
  const { files, manifest } = await createWordPressFiles();
  const output = path.join(repositoryRoot, "dist/wordpress/smiprog-widget");
  await fs.rm(output, { recursive: true, force: true });
  for (const [file, data] of files) {
    const target = path.join(output, file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }
  const archive = createWordPressArchive(files);
  await fs.writeFile(path.join(output, "../smiprog-widget.zip"), archive);
  const result = { version: manifest.version, files: files.size,
    unpackedBytes: [...files.values()].reduce((sum, file) => sum + file.length, 0), zipBytes: archive.length,
    directory: output, archive: path.join(output, "../smiprog-widget.zip") };
  await fs.writeFile(path.join(output, "../build-report.json"), JSON.stringify(result, null, 2) + "\n");
  return result;
}

export function createWordPressArchive(files) {
  const entries = Object.fromEntries([...files].map(([file, data]) =>
    [`smiprog-widget/${file}`, [data, { mtime: new Date("2026-01-01T00:00:00Z") }]]));
  return zipSync(entries, { level: 9 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await buildWordPressPackage(), null, 2));
}
