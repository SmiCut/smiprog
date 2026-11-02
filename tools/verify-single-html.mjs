import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {buildSingleHtmlDownloads} from './build-single-html.mjs';
import {repositoryRoot} from './build-wordpress-plugin.mjs';
const downloads=await buildSingleHtmlDownloads();
const isolated=await fs.mkdtemp(path.join(os.tmpdir(),'smiprog-single-'));
const screenshotDir=path.join(repositoryRoot,'tmp/single-html');await fs.mkdir(screenshotDir,{recursive:true});
const browser=await chromium.launch();
try {
 for(const file of downloads){
  const bytes=await fs.readFile(path.join(repositoryRoot,'dist/downloads',file.name));
  const html=bytes.toString();assert(html.includes('MIT License')&&html.includes('Lucide Icons and Contributors'));
  assert(!/<script[^>]+src=/.test(html));assert(!/<link[^>]+rel="stylesheet"/.test(html));
  const target=path.join(isolated,file.name);await fs.writeFile(target,bytes);
  for(const width of [1280,390]){
   const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:2,offline:true});
   const p=await context.newPage();const errors=[],requests=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
   await p.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.__copied=text}}));
   await p.goto(pathToFileURL(target).href);
   const assetCount=await p.evaluate(async()=>{const images=Object.values(window.SmiProgConfig.embeddedAssets);await Promise.all(images.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=src})));return images.length});assert.equal(assetCount,11);
   await p.screenshot({path:path.join(screenshotDir,`start-${width}.png`),fullPage:true});
   await p.locator('[data-spg-tab="main"]').click();await p.locator('#spg-thread-length').fill('15');
   const reference=await context.newPage();await reference.goto(pathToFileURL(path.join(repositoryRoot,'apps/web/index.html')).href);await reference.locator('[data-spg-tab="main"]').click();await reference.locator('#spg-thread-length').fill('15');
   for(const control of ['fanuc','heidenhain'])for(const hand of ['right','left'])for(const diameter of ['7,50','7,42']){
    for(const page of [p,reference]){await page.locator('#spg-control-system').selectOption(control);await page.locator('#spg-thread-hand').selectOption(hand);await page.locator('#spg-marked-diameter').fill(diameter)}
    assert.equal(await p.locator('#spg-cnc-program').inputValue(),await reference.locator('#spg-cnc-program').inputValue());
   }
   await p.locator('#spg-copy-cnc').click();assert((await p.evaluate(()=>window.__copied)).endsWith(await p.locator('#spg-cnc-program').inputValue()));
   await p.screenshot({path:path.join(screenshotDir,`calculator-${width}.png`),fullPage:true});
   await p.locator('#spg-thread-length').fill('0');assert.equal(await p.locator('#spg-cnc-program').inputValue(),'');
   await p.locator('[data-spg-tab="compare"]').click();await p.locator('#spg-compare-password').fill('XL');await p.locator('#spg-unlock-compare').click();assert(await p.locator('#spg-compare-content').isVisible());
   await p.locator('[data-spg-tab="information"]').click();
   await p.waitForFunction(()=>Array.from(document.images).filter(i=>i.offsetWidth).every(i=>i.complete&&i.naturalWidth>0));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(errors,[]);assert.deepEqual(requests,[pathToFileURL(target).href]);
   // Service call stays external and keeps its contract; no real AI request.
   await context.setOffline(false);let payload;
   await p.route('**/api/chat',async route=>{payload=route.request().postDataJSON();await route.fulfill({contentType:'application/json',body:JSON.stringify({reply:'Test material reply'})})});
   await p.locator('[data-spg-tab="materialselector"]').click();
   await p.locator('[data-sms-role="input"]').fill('316L');
   const response=p.waitForResponse('**/api/chat');
   await p.locator('[data-sms-role="send"]').click();await response;
   assert.equal(payload.language,file.locale);assert.equal(payload.message,'316L');assert(Array.isArray(payload.history));
   await context.close();console.log(`PASS ${file.locale} ${width}px: isolated offline HTML, 11 images, CNC parity, overrides, copy, validation, Compare and no dependent requests`);
  }
 }
}finally{await browser.close();await fs.rm(isolated,{recursive:true,force:true})}
