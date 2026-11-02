import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

export const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
export const apiUrl = "https://smicut-material-selector-production.up.railway.app/api/chat";
const scriptNames = ["i18n/en.js", "js/i18n.js", "data/smiprog-data.js", "data/tool-web-links.js",
  "js/core.js", "js/material-selector.js", "js/app.js"];
const styleNames = ["styles.css", "material-selector.css"];
export async function createAppFiles() {
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
      if (!/^[a-zA-Z0-9_.-]+\.(webp|svg)$/.test(name)) continue;
      const relative = `assets/${directory}/${name}`;
      files.set(`app/${relative}`, await fs.readFile(path.join(sourceRoot, relative)));
    }
  }

  files.set("app/index.html", await fs.readFile(path.join(sourceRoot, "index.html")));
  files.set("LICENSE", await fs.readFile(path.join(repositoryRoot, "LICENSE")));
  files.set("THIRD_PARTY_NOTICES", await fs.readFile(path.join(repositoryRoot, "THIRD_PARTY_NOTICES")));
  return { files };
}
