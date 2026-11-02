// Build one portable HTML file per released language, including images and licenses.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parse, serializeOuter, parseFragment} from 'parse5';
import {createLanguagePackages} from './build-language-packages.mjs';
import {repositoryRoot} from './build-app-files.mjs';

function walk(node, visit) { visit(node); for (const child of [...(node.childNodes || [])]) walk(child, visit); }
const safeScript = text => text.replace(/<\/script/gi, '<\\/script');
function replace(node, markup) {
  const next = parseFragment(markup).childNodes;
  const parent = node.parentNode;
  for (const child of next) child.parentNode = parent;
  parent.childNodes.splice(parent.childNodes.indexOf(node), 1, ...next);
}

export async function createSingleHtmlDownloads() {
  const downloads = [];
  for (const {locale, standalone: files} of await createLanguagePackages()) {
    const assets = {};
    for (const [name, bytes] of files) {
      if (name.startsWith('assets/')) {
        const mime = name.endsWith('.svg') ? 'image/svg+xml' : 'image/webp';
        assets[name.slice(7)] = `data:${mime};base64,${bytes.toString('base64')}`;
      }
    }
    const doc = parse(files.get('index.html').toString());
    let firstScript;
    walk(doc, node => {
      const attr = name => node.attrs?.find(a => a.name === name);
      if (node.tagName === 'link' && attr('rel')?.value === 'stylesheet') {
        const name = attr('href').value.replace(/^\.\//, '').split('?')[0];
        if (!files.has(name)) throw new Error(`Missing stylesheet: ${name}`);
        replace(node, `<style>${files.get(name).toString()}</style>`);
      } else if (node.tagName === 'script' && attr('src')) {
        const name = attr('src').value.replace(/^\.\//, '').split('?')[0];
        if (!files.has(name)) throw new Error(`Missing script: ${name}`);
        if (!firstScript) {
          const init = `window.SmiProgConfig={locale:${JSON.stringify(locale)},embeddedAssets:${JSON.stringify(assets)}};document.querySelectorAll('[data-spg-embedded-image]').forEach(img=>{img.src=window.SmiProgConfig.embeddedAssets[img.dataset.spgEmbeddedImage];});`;
          replace(node, `<script>${safeScript(init)}</script><script>${safeScript(files.get(name).toString())}</script>`);
          firstScript = true;
        } else replace(node, `<script>${safeScript(files.get(name).toString())}</script>`);
      } else if (node.tagName === 'img' && attr('src')) {
        const name = attr('src').value.replace(/^\.\/assets\//, '').split('?')[0];
        if (!assets[name]) throw new Error(`Unembedded image: ${name}`);
        node.attrs = node.attrs.filter(a => a.name !== 'src');
        node.attrs.push({name:'data-spg-embedded-image', value:name});
      }
    });
    const notices = files.get('LICENSE').toString()+'\n\n'+files.get('THIRD_PARTY_NOTICES').toString();
    if (notices.includes('-->')) throw new Error('Unsafe license comment');
    // A fragment can be opened as a file and pasted directly into an existing page.
    // Keep document metadata out of the host page; scope language to the widget.
    const parts = [];
    walk(doc, node => {
      if (node.attrs?.some(a => a.name === 'id' && a.value === 'smiprog-app')) {
        node.attrs.push({name:'lang', value:locale});
      }
      if (node.tagName === 'head') {
        for (const child of node.childNodes || []) if (child.tagName === 'style') parts.push(serializeOuter(child));
      }
      if (node.tagName === 'body') {
        for (const child of node.childNodes || []) parts.push(serializeOuter(child));
      }
    });
    const html = `<!--\n${notices}\n-->\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n` + parts.join('\n');
    downloads.push({locale, name:`smiprog-${locale}.html`, bytes:Buffer.from(html)});
  }
  return downloads;
}

export async function buildSingleHtmlDownloads() {
  const out = path.join(repositoryRoot,'dist/downloads');
  await fs.mkdir(out,{recursive:true});
  const downloads = await createSingleHtmlDownloads();
  for(const file of downloads) await fs.writeFile(path.join(out,file.name),file.bytes);
  await fs.writeFile(path.join(out,'SMIPROG-SHA256SUMS'),downloads.map(f=>`${createHash('sha256').update(f.bytes).digest('hex')}  ${f.name}\n`).join(''));
  return downloads.map(({name,bytes,locale})=>({name,locale,bytes:bytes.length}));
}
if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(await buildSingleHtmlDownloads());
