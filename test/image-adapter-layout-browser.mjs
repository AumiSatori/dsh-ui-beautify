import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {messageImageLayoutCss} from '../src/message-image-layout.js'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(root,'../image-send-layout');mkdirSync(out,{recursive:true})
if(!process.env.DSH_CODEX_CLIENT)throw Error('Set DSH_CODEX_CLIENT to the installed subscription adapter client')
const source=readFileSync(process.env.DSH_CODEX_CLIENT,'utf8'),start=source.indexOf('function MessageImagePreview('),end=source.indexOf('const IMAGE_PREVIEWS_CSS =',start)
assert.ok(start>=0&&end>start,'Installed image adapter must expose the expected component boundary')
const nativeCss=source.slice(end).match(/const IMAGE_PREVIEWS_CSS = `([\s\S]*?)`;/)[1]
const fixture=(await build({stdin:{resolveDir:root,contents:`import * as react from 'react';import * as react_jsx_runtime from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';function openPreview(){window.opened++}${source.slice(start,end)}
window.mount=(image,compact=false)=>{window.requests=[];window.opened=0;window.root=createRoot(document.querySelector('#image-seat'));window.load=()=>new Promise((resolve,reject)=>requests.push({resolve,reject}));window.render=image=>flushSync(()=>root.render(react.createElement(MessageImagePreviews,{images:[image],compact,align:'end',loadImage:load,t:key=>key})));window.render(image)};`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850},deviceScaleFactor:1.25}),results=[],errors=[]
page.on('pageerror',error=>errors.push(error.message))
async function measure(){return page.evaluate(()=>{const frame=document.querySelector('.codexImageThumb'),image=frame.querySelector('img'),box=frame.getBoundingClientRect(),scroll=document.querySelector('main');return{height:box.height,width:box.width,top:box.top,range:scroll.scrollHeight,offset:scroll.scrollTop,imageHeight:image?.getBoundingClientRect().height}})}
try{
 for(const [mode,width,height]of [['landscape',1600,900],['portrait',900,1600],['wide',4000,200],['tall',200,4000],['small',64,32],['missing',1600,900],['short',1600,900],['edge',1600,900],['narrow-dark',1600,900],['tile',1600,900]]){
  const narrow=mode==='narrow-dark';await page.setViewportSize({width:narrow?360:1280,height:850});await page.goto('about:blank')
  await page.setContent(`<!doctype html><style>${nativeCss}*{box-sizing:border-box}body{margin:0;font:14px/22px system-ui;background:${narrow?'#17191e':'#fff'};color:${narrow?'#edf0f5':'#252830'}}main{height:800px;overflow:auto;overflow-anchor:none}section{width:min(720px,100%);margin:auto}.history{height:${mode==='short'?40:mode==='edge'?580:1200}px}footer{height:100px;position:sticky;bottom:0;background:${narrow?'#252830':'#f4f6fa'}}[data-message-attachments]{display:flex;justify-content:flex-end}</style><main><section><div class=history>合成历史</div><div id=image-seat data-message-attachments></div><p>合成图片消息</p></section><footer>合成输入栏</footer></main>`)
  if(!process.env.DSH_IMAGE_BASELINE)await page.addStyleTag({content:messageImageLayoutCss})
  await page.addScriptTag({content:fixture})
  await page.evaluate(({width,height,mode})=>{window.ref={attachment:{attachmentId:'synthetic',name:'合成图片',...mode==='missing'?{}:{width,height}}};mount(ref,mode==='tile');window.size=new ResizeObserver(()=>{const scroll=document.querySelector('main');scroll.scrollTop=scroll.scrollHeight});size.observe(document.querySelector('section'))},{width,height,mode})
  await page.waitForTimeout(mode==='edge'?2200:140)
  const pending=await measure(),url='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#6485bb"/></svg>`)
  await page.evaluate(url=>requests.splice(0).forEach(request=>request.resolve(url)),url);await page.locator('.codexImageThumb img').waitFor();await page.waitForTimeout(70)
  await page.waitForTimeout(140);const loaded=await measure();results.push({mode,pending,loaded})
  if(!process.env.DSH_IMAGE_BASELINE){for(const key of ['height','width','top','range','offset'])assert.equal(loaded[key],pending[key],mode+': '+key+' must not change during decoding');assert.ok(loaded.imageHeight<=240);await page.locator('.codexImageThumb').click();assert.equal(await page.evaluate(()=>opened),1)}
  if(narrow&&!process.env.DSH_IMAGE_BASELINE)await page.screenshot({path:resolve(out,'adapter-stable-dark-narrow.png')})
  if(mode==='landscape'&&!process.env.DSH_IMAGE_BASELINE){
   // The adapter remounts when an optimistic preview becomes an authenticated
   // attachment, clearing src in between. Keep both that handoff and retry stable.
   const stable=await measure();await page.evaluate(url=>render({preview:{url,name:'合成图片',width:1600,height:900}}),url);await page.waitForTimeout(30)
   await page.evaluate(()=>render(ref));await page.waitForTimeout(30);assert.equal((await measure()).height,stable.height)
   await page.evaluate(()=>requests.splice(0).forEach(request=>request.reject(Error('synthetic'))));await page.waitForTimeout(30);assert.equal((await measure()).height,stable.height)
   await page.locator('.codexImageThumb').click();await page.waitForTimeout(30);assert.equal((await measure()).height,stable.height)
   await page.evaluate(url=>requests.splice(0).forEach(request=>request.resolve(url)),url);await page.locator('.codexImageThumb img').waitFor();assert.equal((await measure()).height,stable.height)
  }
  await page.evaluate(()=>size.disconnect());console.log(JSON.stringify(results.at(-1)))
 }
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,process.env.DSH_IMAGE_BASELINE?'adapter-image-baseline.json':'adapter-image-fixed.json'),JSON.stringify(results,null,2))
 console.log(process.env.DSH_IMAGE_BASELINE?'BASELINE 10 subscription adapter cases':'PASS 10 subscription adapter cases plus preview handoff, retry and original-preview action')
}finally{await browser.close()}
