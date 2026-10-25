import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium} from '@playwright/test'
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(root,'../../.scratch/desktop-underlay-jitter/underlay')
mkdirSync(out,{recursive:true})
const source=readFileSync(resolve(root,'client.js'),'utf8'),flag='data-dcb-chat-under-composer',match=source.match(/const CHAT_UNDER_COMPOSER = `([^`]+)`/)
assert.ok(match);const selector=match[1].replace('${CHAT_UNDER_COMPOSER_FLAG}',flag)
assert.ok(source.includes('${CHAT_UNDER_COMPOSER} { background: transparent !important; }'))
assert.ok(process.env.DSH_ASAR,'Set DSH_ASAR to verify the installed host stylesheet')
const fd=openSync(process.env.DSH_ASAR,'r');let host
try{
 const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
 let entry=JSON.parse(json);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'.split('/'))entry=entry.files[part]
 const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
 const source=bytes.toString(),at=source.indexOf('ConversationRoot.module.css'),region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at))
 host=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])
}finally{closeSync(fd)}
const prefix=host.match(/\.([\w]+)_body\{/)[1]
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1200,height:800},deviceScaleFactor:1.25}),errors=[],results=[]
page.on('pageerror',e=>errors.push(e.message))
try{
 await page.setContent(`<!doctype html><meta charset=utf-8><style>${host}:root{--dsw-alias-bg-base:#fff}*{box-sizing:border-box}body{margin:0;background:linear-gradient(110deg,#68a5cf,#344e91);font:14px/20px system-ui}body[data-ds-dark-theme]{--dsw-alias-bg-base:#15171b}main{height:800px!important;display:flex;flex-direction:column;overflow-y:auto}.history{height:2300px;flex:none;color:white;padding:20px}.card{height:100px;width:78%;margin:auto;border-radius:24px;background:#ffffff88;border:1px solid #fff8;box-shadow:0 4px 14px #0001;padding:18px;backdrop-filter:blur(2px)}[data-composer-seat]{height:140px;padding-top:20px}.meter{text-align:center;height:20px;opacity:.6}${selector}{background:transparent!important}@media(forced-colors:active){${selector}{background:Canvas!important}}</style><section class="${prefix}_embeddedBody" data-conversation-content data-content-phase=active><main class="${prefix}_scrollBody" data-conversation-scroll><article class=history><div data-chat-flow>合成聊天与蓝色背景</div></article><footer class="${prefix}_composerSeat" data-composer-seat><div class=card data-composer-card><div contenteditable data-composer-input>输入框保持独立玻璃材质</div></div><div class=meter>状态信息</div></footer></main></section>`)
 const geometry=()=>page.evaluate(()=>{const scroll=document.querySelector('[data-conversation-scroll]'),seat=document.querySelector('[data-composer-seat]'),card=document.querySelector('[data-composer-card]'),r=card.getBoundingClientRect();return{top:scroll.scrollTop,height:scroll.scrollHeight,seat:seat.offsetHeight,card:[r.x,r.y,r.width,r.height],cardBackground:getComputedStyle(card).backgroundColor}})
 for(const dark of [false,true]){
  await page.evaluate(dark=>{document.body.toggleAttribute('data-ds-dark-theme',dark);document.body.removeAttribute('data-dcb-chat-under-composer');document.querySelector('[data-conversation-scroll]').scrollTop=99999},dark)
  const before=await geometry();assert.notEqual(await page.locator('[data-composer-seat]').evaluate(el=>getComputedStyle(el).backgroundImage),'none')
  await page.screenshot({path:resolve(out,`mask-before-${dark?'dark':'light'}.png`)})
  await page.evaluate(()=>document.body.setAttribute('data-dcb-chat-under-composer',''))
  for(const phase of ['reading','data-chat-following-tail','data-submission-echo','data-pending-steering','data-input-fold','data-chat-running']){
   await page.evaluate(phase=>{const flow=document.querySelector('[data-chat-flow]');for(const name of ['data-chat-following-tail','data-submission-echo','data-pending-steering','data-input-fold','data-chat-running'])flow.removeAttribute(name);if(phase!=='reading')flow.setAttribute(phase,'')},phase)
   const paint=await page.locator('[data-composer-seat]').evaluate(el=>({background:getComputedStyle(el).backgroundColor,image:getComputedStyle(el).backgroundImage}))
   assert.deepEqual(paint,{background:'rgba(0, 0, 0, 0)',image:'none'},phase+' keeps the whole bottom seat clear')
   assert.deepEqual(await geometry(),before,'The switch only changes paint, never the editor or scroll geometry');results.push({dark,phase,paint})
  }
  await page.screenshot({path:resolve(out,`mask-clear-${dark?'dark':'light'}.png`)})
 }
 await page.evaluate(()=>{const overlay=document.createElement('div');overlay.dataset.conversationComposerOverlay='';document.querySelector('[data-composer-seat]').append(overlay)})
 assert.notEqual(await page.locator('[data-composer-seat]').evaluate(el=>getComputedStyle(el).backgroundImage),'none','Blocking overlays retain their own background')
 await page.locator('[data-conversation-composer-overlay]').evaluate(el=>el.remove());await page.emulateMedia({forcedColors:'active'})
 assert.notEqual(await page.locator('[data-composer-seat]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)')
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'result.json'),JSON.stringify({passed:14,results,errors},null,2));console.log(JSON.stringify({passed:14,out}))
}finally{await browser.close()}
