import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'

const root=fileURLToPath(new URL('..',import.meta.url))
const bundle=await build({stdin:{contents:`import{createUnifiedIcons,unifiedIconsCss}from './src/unified-icons.js';window.boot=()=>{const s=document.createElement('style');s.textContent=unifiedIconsCss;document.head.append(s);window.icons=createUnifiedIcons(document,window,()=>{});window.icons.sync('glass')}`,resolveDir:root},bundle:true,format:'iife',write:false})
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;font:14px system-ui;background:linear-gradient(120deg,#b8d9ef,#ead1e1)}.file{display:flex;gap:10px;align-items:center;margin:20px;padding:10px;width:280px;border:1px solid #8885}.icon{display:grid;place-items:center;width:34px;height:38px;background:#eee}.dcb-output{display:flex;align-items:center;gap:10px;margin:20px;padding:5px;border:0;background:transparent}.dcb-tile{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px}.dcb-file-name{flex:1}.dcb-file-type{font-size:11px}</style><div data-presented-file class="file"><span class="icon x_fileIcon"><span>OLD</span></span><div class="x_fileBody"><span class="x_fileName">预算.xlsx</span></div></div><button class="dcb-output"><span class="dcb-tile" data-kind="file">MD</span><span class="dcb-file-name">FEATURES-ALL</span><span class="dcb-file-type">MD</span></button><script src="/fixture.js"></script>`
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:html)})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage(),checks=[]
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>boot())
 await page.waitForSelector('[data-dcb-file-icon]')
 const read=()=>page.evaluate(()=>({icon:{ext:document.querySelector('[data-dcb-file-icon]').getAttribute('data-dcb-file-ext'),tone:document.querySelector('[data-dcb-file-icon]').getAttribute('data-dcb-file-tone'),after:getComputedStyle(document.querySelector('[data-dcb-file-icon]'),'::after').content,color:getComputedStyle(document.querySelector('[data-dcb-file-icon]'),'::before').backgroundColor},tile:{ext:document.querySelector('[data-dcb-file-tile]').getAttribute('data-dcb-file-ext'),tone:document.querySelector('[data-dcb-file-tile]').getAttribute('data-dcb-file-tone'),after:getComputedStyle(document.querySelector('[data-dcb-file-tile]'),'::after').content,color:getComputedStyle(document.querySelector('[data-dcb-file-tile]'),'::before').backgroundColor}}))
 const value=await read();assert.deepEqual(value.icon,{ext:'XLSX',tone:'spreadsheet',after:'"XLSX"',color:'rgb(39, 163, 107)'});assert.deepEqual(value.tile,{ext:'MD',tone:'document',after:'"MD"',color:'rgb(71, 120, 208)'});checks.push('native cards and output rows use color-coded suffix badges')
 await page.evaluate(()=>{document.querySelector('[data-presented-file]').remove();document.querySelector('.dcb-output').remove();window.icons.sync('glass')});await page.waitForTimeout(20);assert.equal(await page.locator('[data-dcb-file-icon],[data-dcb-file-tile]').count(),0);checks.push('decorations release when cards leave the DOM')
 await page.evaluate(()=>window.icons.dispose());checks.push('dispose completes without leaving icon attributes')
 console.log(JSON.stringify({passed:checks.length,checks}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
