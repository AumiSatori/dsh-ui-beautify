import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=new URL('..',import.meta.url)
const bundle=await build({stdin:{contents:`import{createUnifiedIcons}from'./src/unified-icons.js';window.mount=()=>{const manager=createUnifiedIcons(document,window);manager.sync('glass');return manager}`,loader:'js',resolveDir:fileURLToPath(project)},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><meta charset="utf-8"><style>html,body{margin:0}header{display:flex;gap:8px}.cr_headerUtilities{display:flex;gap:4px}.cr_headerUtilities button{width:30px;height:30px}</style><header class="cr_header"><div class="cr_headerUtilities"><button aria-label="更多操作">更多</button></div><div class="cr_headerUtilities"><button aria-label="更多操作">更多</button></div><div class="cr_headerUtilities"><button aria-label="更多操作">更多</button></div></header><script src="/fixture.js"></script>`
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'text/javascript':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:html)})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage()
try{
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.evaluate(()=>window.mount())
  assert.equal(await page.locator('[data-dcb-header-settings]').count(),1)
  assert.equal(await page.locator('.cr_headerUtilities [data-dcb-header-settings]').count(),1)
  console.log('PASS one settings entry is created for duplicate visible utility containers')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
