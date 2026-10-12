#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "smiprog-data.js");
const defaultCsvPath = path.join(root, "data", "tool-prices.csv");

function usage() {
  console.log([
    "Usage:",
    "  node tools/update-tool-prices.mjs --export [csv-path]",
    "  node tools/update-tool-prices.mjs --import [csv-path]",
    "",
    "CSV columns:",
    "  Article,Price EUR",
    "",
    "Use comma or semicolon separated CSV. Decimal comma and decimal point are both accepted."
  ].join("\n"));
}

function readData() {
  const source = fs.readFileSync(dataPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: dataPath });
  return sandbox.window.SmiProgData;
}

function writeData(data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(dataPath, `window.SmiProgData = ${json};\n`);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",;\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function detectDelimiter(line) {
  return (line.match(/;/g) || []).length > (line.match(/,/g) || []).length ? ";" : ",";
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parsePrice(value) {
  let cleaned = String(value || "")
    .replace(/\s/g, "")
    .replace(/€/g, "");

  if (cleaned.includes(".") && cleaned.includes(",")) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    cleaned = lastComma > lastDot
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    const lastComma = cleaned.lastIndexOf(",");
    cleaned = `${cleaned.slice(0, lastComma).replace(/,/g, "")}.${cleaned.slice(lastComma + 1)}`;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeArticle(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function readPriceCsv(csvPath) {
  const text = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  if (!lines.length) throw new Error(`No rows found in ${csvPath}`);

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => header.toLowerCase().trim());
  const articleIndex = headers.findIndex((header) => ["article", "artikel", "part number", "partnumber"].includes(header));
  const priceIndex = headers.findIndex((header) => ["price eur", "price", "pris", "pris eur", "eur"].includes(header));
  if (articleIndex < 0 || priceIndex < 0) {
    throw new Error("CSV must include Article and Price EUR columns.");
  }

  const prices = new Map();
  for (const line of lines.slice(1)) {
    const columns = parseCsvLine(line, delimiter);
    const article = (columns[articleIndex] || "").trim();
    if (!article) continue;
    const price = parsePrice(columns[priceIndex]);
    if (price === null) throw new Error(`Invalid price for ${article}: ${columns[priceIndex]}`);
    prices.set(article, price);
  }
  return prices;
}

function exportPrices(csvPath) {
  const data = readData();
  const rows = ["Article,Price EUR"];
  data.tools
    .slice()
    .sort((left, right) => left.description.localeCompare(right.description))
    .forEach((tool) => {
      rows.push([csvEscape(tool.description), csvEscape(tool.priceEur ?? "")].join(","));
    });
  fs.writeFileSync(csvPath, `${rows.join("\n")}\n`);
  console.log(`Exported ${rows.length - 1} prices to ${csvPath}`);
}

function importPrices(csvPath) {
  const data = readData();
  const prices = readPriceCsv(csvPath);
  const normalizedPrices = new Map();
  for (const [article, price] of prices.entries()) {
    const key = normalizeArticle(article);
    if (!normalizedPrices.has(key)) normalizedPrices.set(key, price);
  }
  let updated = 0;
  const missing = [];

  data.tools.forEach((tool) => {
    const hasExactPrice = prices.has(tool.description);
    const normalizedPrice = normalizedPrices.get(normalizeArticle(tool.description));
    if (!hasExactPrice && normalizedPrice === undefined) {
      missing.push(tool.description);
      return;
    }
    const nextPrice = hasExactPrice ? prices.get(tool.description) : normalizedPrice;
    if (tool.priceEur !== nextPrice) updated += 1;
    tool.priceEur = nextPrice;
  });

  writeData(data);
  console.log(`Imported ${prices.size} price rows from ${csvPath}`);
  console.log(`Updated ${updated} tools in ${dataPath}`);
  if (missing.length) {
    console.log(`No price row for ${missing.length} tools. Existing prices were kept.`);
  }
}

const [mode, fileArg] = process.argv.slice(2);
const csvPath = path.resolve(root, fileArg || defaultCsvPath);

if (mode === "--export") {
  exportPrices(csvPath);
} else if (mode === "--import") {
  importPrices(csvPath);
} else {
  usage();
  process.exit(mode ? 1 : 0);
}
