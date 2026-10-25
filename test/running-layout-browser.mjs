import assert from 'node:assert/strict'
import {readFileSync,openSync,readSync,closeSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
const project=fileURLToPath(new URL('..',import.meta.url)),out=resolve(project,'../../.scratch/completion-jitter-audit/running-layout')
mkdirSync(out,{recursive:true})
// Use the installed host's real row and glyph CSS instead of assigning the
// test row the plugin's desired dimensions.
if(!process.env.DSH_ASAR)throw Error('Set DSH_ASAR to test the installed status-row CSS')
const fd=openSync(process.env.DSH_ASAR,'r')
let nativeCss
try{const h=Buffer.alloc(16);readSync(fd,h,0,16,0);const b=Buffer.alloc(h.readUInt32LE(12));readSync(fd,b,0,b.length,16);let entry=JSON.parse(b);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part];const data=Buffer.alloc(entry.size);readSync(fd,data,0,data.length,8+h.readUInt32LE(4)+Number(entry.offset));const source=data.toString(),at=source.indexOf('ChatView.module.css'),region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at));nativeCss=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])}finally{closeSync(fd)}
const prefix=nativeCss.match(/\.([\w-]+)_running\{/)[1]
const entry=await build({stdin:{contents:`import {createRunningAnimations,runningAnimationCss} from './src/running-animation.js';window.mount=(catalog,options)=>{const style=document.createElement('style');style.textContent=runningAnimationCss;document.head.append(style);return createRunningAnimations(document,window,catalog,options)}`,resolveDir:project},bundle:true,write:false,format:'iife'})
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[]
page.on('pageerror',e=>errors.push(e.message))
let passed=0
try{
 for(const fontDelta of [0,4]){
  await page.setContent(`<style>${nativeCss}body{margin:0;font:14px/22px system-ui;--dsh-content-font-delta:${fontDelta}px}main{height:650px;overflow:auto}.history{height:1000px}.seat{height:90px;position:sticky;bottom:0;background:white}</style><main><div class="history"></div><div class="${prefix}_running" data-chat-running="true"><span class="${prefix}_runningContent"><span class="${prefix}_runningIcon"><svg width="14" height="14"></svg></span><span>合成状态文案</span></span></div><div class="seat" data-composer-seat>合成输入栏</div></main>`)
  const baseline=await page.evaluate(()=>{const row=document.querySelector('[data-chat-running]'),card=document.querySelector('[data-composer-seat]');window.metrics=()=>({row:row.getBoundingClientRect().height,seat:card.getBoundingClientRect().y,range:document.querySelector('main').scrollHeight});document.querySelector('main').scrollTop=9999;return window.metrics()})
  await page.addScriptTag({content:entry.outputFiles[0].text})
  await page.evaluate(()=>{window.releases=0;window.pack={id:'builtin-whale',actions:[{id:'one',type:'gif'}]};window.catalog={getSnapshot:()=>({packs:[window.pack]}),subscribe:()=>()=>{},load:async()=>{},acquire:()=>new Promise(resolve=>window.resolveAsset=()=>resolve({poster:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',url:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',release(){window.releases++}}))};window.control=window.mount(window.catalog,{runningAnimationEnabled:true,runningAnimationPack:'builtin-whale',runningAnimationSize:32})})
  await page.locator('[data-dcb-running-reserve]').waitFor()
  assert.deepEqual(await page.evaluate(()=>window.metrics()),baseline,'Waiting for an asset must retain native line and sticky geometry')
  await page.waitForFunction(()=>typeof window.resolveAsset==='function');await page.evaluate(()=>window.resolveAsset());await page.locator('[data-dcb-running-ready]').waitFor()
  for(const size of [16,32,80]){
   await page.evaluate(size=>window.control.setOptions({runningAnimationEnabled:true,runningAnimationPack:'builtin-whale',runningAnimationSize:size}),size)
   assert.deepEqual(await page.evaluate(()=>window.metrics()),baseline,'Paint size must not resize the native status line')
   assert.equal(await page.locator('.dcb-running-art').evaluate(e=>e.getBoundingClientRect().height),size)
  }
  await page.screenshot({path:resolve(out,`font-${fontDelta}.png`)})
  // React may retain a connected icon while changing its parent status.
  await page.locator('[data-chat-running]').evaluate(e=>e.removeAttribute('data-chat-running'))
  await page.locator('.dcb-running-art').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>window.releases),1)
  assert.equal(await page.locator('[data-dcb-running-reserve]').count(),0)
  await page.evaluate(()=>window.control.dispose());passed++
 }
 assert.deepEqual(errors,[])
 writeFileSync(resolve(out,'verification.json'),JSON.stringify({passed,errors},null,2))
 console.log(`PASS ${passed} native font-size cases: pending asset / loaded art / sizes 16–80 / connected status cleanup`)
}finally{await browser.close()}
