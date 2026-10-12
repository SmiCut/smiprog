/*
 * Builds SmiProg locale JSON files from i18n/translations.csv.
 * The public CSV contains the released English text; other language drafts remain private.
 * Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const inputPath = path.join(webRoot, "i18n", "translations.csv");
const outputDir = path.join(webRoot, "i18n");
const metadataColumns = new Set([
  "screen",
  "comment",
  "max_length",
  "do_not_translate",
  "status"
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === "\"" && nextChar === "\"") {
        field += "\"";
        index += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((cell) => String(cell).trim()));
}

function normalizeHeader(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function buildDictionaries(rows) {
  if (!rows.length) {
    throw new Error("translations.csv is empty.");
  }

  const header = rows[0].map(normalizeHeader);
  const keyIndex = header.indexOf("key");
  const englishIndex = header.indexOf("en");
  if (keyIndex < 0) {
    throw new Error("translations.csv must include a key column.");
  }
  if (englishIndex < 0) {
    throw new Error("translations.csv must include an en column.");
  }

  const localeCandidates = header.filter((column) => column && column !== "key" && !metadataColumns.has(column));
  const locales = localeCandidates.filter((locale) => {
    if (locale === "en") return true;
    const columnIndex = header.indexOf(locale);
    return rows.slice(1).some((row) => String(row[columnIndex] || "").trim());
  });
  const dictionaries = Object.fromEntries(locales.map((locale) => [locale, {}]));
  const missing = Object.fromEntries(locales.map((locale) => [locale, []]));
  const errors = [];
  const seenKeys = new Set();

  rows.slice(1).forEach((row, rowOffset) => {
    const rowNumber = rowOffset + 2;
    const key = String(row[keyIndex] || "").trim();
    if (!key) {
      errors.push(`Row ${rowNumber} is missing key.`);
      return;
    }
    if (seenKeys.has(key)) {
      errors.push(`Row ${rowNumber} duplicates key "${key}".`);
      return;
    }
    seenKeys.add(key);

    locales.forEach((locale) => {
      const columnIndex = header.indexOf(locale);
      const value = row[columnIndex] ?? "";
      if (value === "") {
        missing[locale].push(key);
        if (locale === "en") {
          errors.push(`Row ${rowNumber} key "${key}" is missing English fallback.`);
        }
        return;
      }
      dictionaries[locale][key] = value;
    });
  });

  return { dictionaries, errors, locales, missing };
}

async function main() {
  const csv = await readFile(inputPath, "utf8");
  const rows = parseCsv(csv);
  const { dictionaries, errors, locales, missing } = buildDictionaries(rows);
  if (errors.length) {
    errors.forEach((error) => console.error(error));
    process.exitCode = 1;
    return;
  }

  await mkdir(outputDir, { recursive: true });
  await Promise.all(locales.map((locale) => {
    const outputPath = path.join(outputDir, `${locale}.json`);
    return writeFile(outputPath, `${JSON.stringify(dictionaries[locale], null, 2)}\n`);
  }));

  const bundledPath = path.join(outputDir, "en.js");
  await writeFile(bundledPath, `/* Generated from translations.csv. Copyright (c) 2026 SmiCut AB. */
(function (global) {
  "use strict";
  global.SmiProgTranslations = Object.freeze(${JSON.stringify(dictionaries, null, 2)});
})(window);
`);

  console.log(JSON.stringify({
    input: path.relative(webRoot, inputPath),
    locales,
    keys: Object.keys(dictionaries.en || {}).length,
    missing: Object.fromEntries(Object.entries(missing).filter(([, keys]) => keys.length))
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
