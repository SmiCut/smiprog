// Generate independent language downloads from the shared, tested source.
// Copyright (c) 2026 SmiCut AB. Licensed under the MIT License; see LICENSE.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { transform } from 'esbuild';
import { zipSync } from 'fflate';
import { createWordPressFiles, createWordPressArchive, repositoryRoot } from './build-wordpress-plugin.mjs';

export const locales = ['en'];
const hash = data => createHash('sha256').update(data).digest('hex').slice(0, 16);

export async function createLanguagePackages() {
  const base = await createWordPressFiles();
  const english = JSON.parse(await fs.readFile(path.join(repositoryRoot, 'apps/web/i18n/en.json'), 'utf8'));
  const packages = [];
  for (const locale of locales) {
    const dictionary = JSON.parse(await fs.readFile(path.join(repositoryRoot, `apps/web/i18n/${locale}.json`), 'utf8'));
    const dictionaries = locale === 'en' ? { en: english } : { en: english, [locale]: dictionary };
    const bundle = await transform(`window.SmiProgTranslations = ${JSON.stringify(dictionaries)};`,
      { loader: 'js', minify: true, target: 'es2020', charset: 'utf8', legalComments: 'none' });
    const files = new Map(base.files);
    for (const name of files.keys()) {
      const match = name.match(/^app\/i18n\/([a-z]{2})\.json$/);
      if (match && !Object.hasOwn(dictionaries, match[1])) files.delete(name);
    }
    files.set('app/i18n/en.js', Buffer.from(bundle.code));
    const scriptHash = hash(files.get('app/i18n/en.js'));
    let html = files.get('app/index.html').toString();
    html = html.replace(/<html lang="[^"]*"/, `<html lang="${locale}"`)
      .replace(/(\.\/i18n\/en\.js\?v=)[a-f0-9]+/, `$1${scriptHash}`);
    files.set('app/index.html', Buffer.from(html));
    const manifest = structuredClone(base.manifest);
    manifest.version = `${base.manifest.version}-${locale}`;
    manifest.scripts.find(script => script.file === 'i18n/en.js').hash = scriptHash;
    files.set('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
    const php = files.get('smiprog-widget.php').toString()
      .replaceAll(base.manifest.version, manifest.version)
      .replace("array('locale' => get_locale())", `array('locale' => '${locale}')`);
    files.set('smiprog-widget.php', Buffer.from(php));
    files.set('README.txt', Buffer.from(`SmiProg (${locale}) — MIT licensed, copyright 2026 SmiCut AB.\n`
      + `Install this WordPress plugin and add [smiprog] to a page. Default language: ${locale}.\n`
      + 'Use shortcode locale="en" for the included English fallback if needed.\n'
      + 'Reference prices can be replaced in your own source version.\n'
      + 'Hosted AI service access is separate from the software license.\n'));
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
    packages.push({ locale, wordpress: files, standalone });
  }
  return packages;
}

export async function buildLanguagePackages() {
  const output = path.join(repositoryRoot, 'dist/languages');
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  const packages = await createLanguagePackages();
  for (const { locale, wordpress, standalone } of packages) {
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
    await fs.writeFile(path.join(output, `smiprog-widget-${locale}.zip`), createWordPressArchive(wordpress));
  }
  console.log(JSON.stringify({ output, locales: packages.map(p => p.locale), archives: packages.length * 2 }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) await buildLanguagePackages();
