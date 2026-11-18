import fs from 'node:fs/promises';
import path from 'node:path';
import { zipSync } from 'fflate';
import { repositoryRoot } from './build-app-files.mjs';
import { createSingleHtmlDownloads } from './build-single-html.mjs';

const read = name => fs.readFile(path.join(repositoryRoot,name));
const version = JSON.parse(await read('package.json')).version;
const archive = {};
for (const file of ['README.md','SmiProgPrintKit.swift']) archive[file] = await read('ios-print/'+file);
for (const file of ['LICENSE','THIRD_PARTY_NOTICES']) archive[file] = await read(file);
archive['SmiProgPrintResources/report-page.js'] = await read('ios-print/report-page.js');
for (const {name,bytes} of await createSingleHtmlDownloads()) archive['SmiProgPrintResources/'+name] = bytes;
const output = path.join(repositoryRoot,'dist/downloads','SmiProg-iOS-Print-Kit-v'+version+'.zip');
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,zipSync(archive,{level:9}));
console.log(output);
