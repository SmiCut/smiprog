// Generate independent language downloads from the shared, tested source.
// Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { transform } from 'esbuild';
import { zipSync } from 'fflate';
import { parse, parseFragment, serialize } from 'parse5';
import { createAppFiles, repositoryRoot } from './build-app-files.mjs';

export const locales = ['en', 'sv', 'da', 'de', 'es', 'fr', 'hu', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'ru', 'zh', 'zh-tw'];
export const webRoot = path.join(repositoryRoot, 'apps/web');
export function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}
export const attribute = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
function localizeHtml(html, dictionary, locale, review = false) {
  const document = parse(html);
  walk(document, node => {
    if (!node.tagName) return;
    const key = attribute(node, 'data-i18n') || attribute(node, 'data-i18n-html');
    if (key) {
      if (!dictionary[key]) throw new Error(`${locale}: missing ${key}`);
      node.childNodes = attribute(node, 'data-i18n-html')
        ? parseFragment(dictionary[key]).childNodes
        : [{ nodeName: '#text', value: dictionary[key] }];
      node.childNodes.forEach(child => { child.parentNode = node; });
    }
    if (node.tagName === 'title') node.childNodes = [{ nodeName: '#text', value: dictionary['app.title'], parentNode: node }];
    for (const attr of node.attrs) {
      const key = attribute(node, `data-i18n-${attr.name}`);
      if (key) {
        if (!dictionary[key]) throw new Error(`${locale}: missing ${key}`);
        attr.value = dictionary[key];
      }
      if (node.tagName === 'html' && attr.name === 'lang') attr.value = locale;
      if (review && ['src', 'href'].includes(attr.name) && attr.value.startsWith('./')) attr.value = '../' + attr.value.slice(2);
    }
  });
  if (review) {
    const head = document.childNodes.find(n => n.tagName === 'html').childNodes.find(n => n.tagName === 'head');
    const config = parseFragment(`<script>window.SmiProgConfig=${JSON.stringify({locale, assetBase:'../assets/'})};</script>`).childNodes[0];
    config.parentNode = head;
    head.childNodes.unshift(config);
  }
  return serialize(document);
}
const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 16);

export async function createLanguagePackages() {
  const base = await createAppFiles();
  const english = JSON.parse(await fs.readFile(path.join(repositoryRoot, 'apps/web/i18n/en.json'), 'utf8'));
  const packages = [];
  for (const locale of locales) {
    const dictionary = JSON.parse(await fs.readFile(path.join(repositoryRoot, `apps/web/i18n/${locale}.json`), 'utf8'));
    const dictionaries = locale === 'en' ? { en: english } : { en: english, [locale]: dictionary };
    const bundle = await transform(`window.SmiProgTranslations = ${JSON.stringify(dictionaries)};`,
      { loader: 'js', minify: true, target: 'es2020', charset: 'utf8', legalComments: 'none' });
    const files = new Map(base.files);
    for (const name of files.keys()) {
      const match = name.match(/^app\/i18n\/([a-z]{2}(?:-[a-z]{2})?)\.json$/);
      if (match && !Object.hasOwn(dictionaries, match[1])) files.delete(name);
    }
    files.set('app/i18n/en.js', Buffer.from(bundle.code));
    const scriptHash = hash(files.get('app/i18n/en.js'));
    let html = files.get('app/index.html').toString();
    html = html.replace(/<html lang="[^"]*"/, `<html lang="${locale}"`)
      .replace(/(\.\/i18n\/en\.js\?v=)[a-f0-9]+/, `$1${scriptHash}`);
    files.set('app/index.html', Buffer.from(localizeHtml(html, dictionary, locale)));
    const standalone = new Map();
    for (const [name, bytes] of files) {
      if (name.startsWith('app/')) standalone.set(name.slice(4), bytes);
    }
    standalone.set('LICENSE', files.get('LICENSE'));
    standalone.set('THIRD_PARTY_NOTICES', files.get('THIRD_PARTY_NOTICES'));
    standalone.set('README.txt', Buffer.from(`SmiProg (${locale}) — MIT licensed, copyright 2026 SmiCut AB.\n`
      + 'Open index.html in your browser, or serve this folder from your website.\n'
      + 'Keep the complete folder together so local scripts and images resolve.\n'
      + 'See https://github.com/SmiCut/smiprog for source, price editing and branding instructions.\n'
      + 'Hosted AI service access is separate from the software license.\n'));
    packages.push({ locale, standalone });
  }
  return packages;
}

export async function buildLanguagePackages() {
  const output = path.join(repositoryRoot, 'dist/languages');
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  const packages = await createLanguagePackages();
  const reviewRoot = path.join(webRoot, 'languages');
  await fs.mkdir(reviewRoot, {recursive:true});
  const source = await fs.readFile(path.join(webRoot, 'index.html'), 'utf8');
  for (const { locale, standalone } of packages) {
    const dictionary = JSON.parse(await fs.readFile(path.join(webRoot, `i18n/${locale}.json`), 'utf8'));
    await fs.writeFile(path.join(reviewRoot, `${locale}.html`), localizeHtml(source, dictionary, locale, true));
    const folder = path.join(output, `smiprog-${locale}`);
    await fs.rm(folder, { recursive: true, force: true });
    for (const [name, bytes] of standalone) {
      const target = path.join(folder, name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes);
    }
    const entries = Object.fromEntries([...standalone].map(([name, bytes]) =>
      [`smiprog-${locale}/${name}`, [new Uint8Array(bytes), { mtime: new Date('2026-01-01T00:00:00Z') }]]));
    await fs.writeFile(path.join(output, `smiprog-${locale}.zip`), zipSync(entries, { level: 9 }));
  }
  const names = ['English','Svenska','Dansk','Deutsch','Español','Français','Magyar','Bahasa Indonesia','Italiano','日本語','한국어','Nederlands','Polski','Русский','简体中文','繁體中文（台灣）'];
  await fs.writeFile(path.join(reviewRoot, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SmiProg</title><style>body{font:16px system-ui;margin:32px auto;padding:0 20px;max-width:680px}a{display:block;padding:10px;color:#704b3a}ul{list-style:none;padding:0}</style></head><body><h1>SmiProg</h1><nav><ul>${locales.map((locale,i)=>`<li><a lang="${locale}" href="${locale}.html">${names[i]}</a></li>`).join('')}</ul></nav></body></html>\n`);
  console.log(JSON.stringify({ output, locales: packages.map(p => p.locale), archives: packages.length }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await buildLanguagePackages();
