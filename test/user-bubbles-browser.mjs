import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,openSync,readSync,closeSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../.scratch/claude-beautify'),'user-bubbles')
mkdirSync(output,{recursive:true})
let nativeCss='.native_userRow{display:flex;flex-direction:column;align-items:flex-end}.native_userStack{display:flex;flex-direction:column;align-items:flex-end;max-width:82%}.native_bubble{padding:10px 16px;background:#eee;border-radius:16px}',nativeUser=`function UserContent({content}){return React.createElement('div',{className:'native_userStack'},React.createElement('div',{'data-message-attachments':true},'notes.txt'),React.createElement('div',{className:'native_bubble'},content.text))}`,prefix='native'
if(process.env.DSH_ASAR){
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0);const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let entry=JSON.parse(json);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js'.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));const source=bytes.toString()
  const at=source.indexOf('MessageItem.module.css'),region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at))
  nativeCss=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1]);prefix=nativeCss.match(/\.([\w-]+)_userRow/)[1]
  const start=source.indexOf('function UserContent(');assert.ok(start>0);nativeUser=source.slice(start,source.indexOf('//#endregion',start))
  assert.ok(nativeUser.includes('MessageItem_module_css_default.bubble'))
 }finally{closeSync(fd)}
}
const fixture=await build({stdin:{resolveDir:project,contents:`import React from 'react';import * as jsxRuntime from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {flushSync,createPortal} from 'react-dom';import './test/fixture.jsx';import * as Bubbles from './src/user-bubbles.js';window.Bubbles=Bubbles;window.fixtureCreatePortal=createPortal;
const EMPTY_LABELS=[],react_jsx_runtime=jsxRuntime,MessageItem_module_css_default=new Proxy({},{get:(_,key)=>${JSON.stringify(prefix)}+'_'+key}),_deepseek_ai_dsh_client_ui_primitives={FileTypeIcon:()=>React.createElement('span',null,'TXT'),fileExtension:()=> 'txt',fileSizeText:()=> '12 B',JsonBlock:()=>null};
${nativeUser}
window.mountBubbles=()=>{const seat=document.createElement('div');seat.id='bubble-fixture';seat.dataset.chatFlow='';document.querySelector('[data-conversation-content]').append(seat);const content={text:'把今天的灵感，装进一个小气泡。\\n这是一条较长的消息，也会自然换行。',attachments:[{type:'file',file:{name:'notes.txt',bytes:12}}],extraBlocks:[]};const root=createRoot(seat),h=React.createElement;
flushSync(()=>root.render(h(React.Fragment,null,...['user','steering','echo'].map((kind,i)=>h('article',{key:kind,'data-chat-flow-kind':kind==='echo'?undefined:kind,'data-submission-echo':kind==='echo'?true:undefined,'data-chat-turn':i+1},h('div',{className:${JSON.stringify(prefix+'_userRow')}},h(UserContent,{content,facts:{},renderFactorySlot:(_name,props)=>h('span',null,props.text),renderSlot:()=>null,t:x=>x}),h('button',{onClick:()=>window.copies++},'复制提问')))),h('article',{'data-chat-flow-kind':'assistant-step'},h('div',{className:${JSON.stringify(prefix+'_bubble')},id:'assistant-control'},'模型回复不变')))));
window.nativeBubble=document.querySelector('[data-chat-flow-kind=user] [class$=_bubble]');window.nativeCopy=document.querySelector('#bubble-fixture button');window.nativeAttachment=document.querySelector('[data-message-attachments]');window.nativeAssistant=document.getElementById('assistant-control');if(!nativeBubble||!nativeCopy||!nativeAttachment||!nativeAssistant)throw Error('Missing native fixture elements: '+seat.innerHTML);window.baseline={bubble:getComputedStyle(nativeBubble).cssText,background:getComputedStyle(nativeBubble).background,border:getComputedStyle(nativeBubble).borderRadius,copy:getComputedStyle(nativeCopy).background,attachment:getComputedStyle(nativeAttachment).background,assistant:getComputedStyle(nativeAssistant).background};};`},bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'))],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'))]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1050}}),url=`http://127.0.0.1:${server.address().port}`,errors=[],requests=[]
page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith(url))requests.push(request.url())})
const key='dsh-claude-beautify:settings:v1',bubble=page.locator('[data-chat-flow-kind=user] [class$=_bubble]'),dialog=page.getByRole('dialog')
const settled=async()=>{await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function boot(preserve=false){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor();await page.addStyleTag({content:nativeCss+' :root{--dsw-specific-bubble:#edf2fb;--dsw-alias-label-primary:#252a32;--dsw-radius-xl:16px} body[data-ds-dark-theme]{--dsw-alias-label-primary:#eee;--dsw-alias-label-secondary:#bbb;--dsw-alias-bg-layer-1:#25252b;--dsw-alias-bg-layer-2:#303038} .settings-dialog{inset:35px 12%;padding:24px} #bubble-fixture{padding:22px} #bubble-fixture>article{margin:18px 0}'});
 await page.evaluate(({key,preserve})=>{
  if(!preserve)localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,messageMotion:false}))
  window.copies=0;window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='react-dom'?{createPortal:window.fixtureCreatePortal}:window.fixtureReact)}
  window.mountBubbles()
 },{key,preserve}).catch(error=>{throw Error(error.message+'\n'+errors.join('\n'))})
 await page.addScriptTag({url:url+'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;return()=>{}}},effect(cb){window.cleanups.push(cb())},inject(){}};window.plugin.apply(ctx);window.fixture.refresh();window.fixture.settings(true)});await selectSettingsCategory(page,'对话动效');await settled()
}
const choose=async name=>{await page.getByRole('radio',{name:`气泡：${name}`,exact:true}).click();await settled()}
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
try{
 await check('default preserves the native bubble, attachments, message actions and assistant content',async()=>{
  await boot();assert.equal(await page.getByRole('radio',{name:'气泡：默认',exact:true}).getAttribute('aria-checked'),'true')
  assert.equal(await page.locator('style[data-dcb-user-bubbles]').textContent(),'')
  assert.equal(await bubble.evaluate(el=>getComputedStyle(el).background),await page.evaluate(()=>window.baseline.background))
 })
 await check('QQ styling reaches native user, steering and pending bubbles without replacing content or painting neighboring controls',async()=>{
  await choose('QQ 蓝')
  assert.match(await bubble.evaluate(el=>getComputedStyle(el).backgroundImage),/linear-gradient/);assert.equal(await bubble.evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)')
  assert.equal(await page.locator('[data-chat-flow-kind=steering] [class$=_bubble]').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)')
  assert.equal(await page.locator('[data-submission-echo] [class$=_bubble]').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)')
  assert.equal(await bubble.evaluate(el=>getComputedStyle(el,'::after').pointerEvents),'none')
  assert.equal(await page.evaluate(()=>nativeBubble===document.querySelector('[data-chat-flow-kind=user] [class$=_bubble]')&&getComputedStyle(nativeCopy).background===baseline.copy&&getComputedStyle(nativeAttachment).background===baseline.attachment&&getComputedStyle(nativeAssistant).background===baseline.assistant),true)
  await page.evaluate(()=>{window.fixture.settings(false);window.nativeCopy.click()});await settled();assert.equal(await page.evaluate(()=>window.copies),1)
  await page.locator('#bubble-fixture').screenshot({path:resolve(output,'qq-bubbles.png')})
  await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'对话动效')
 })
 await check('cream and glass examples follow DSH themes and fit narrow settings',async()=>{
  for(const name of['奶油便签','透明玻璃']){
   await choose(name);await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'));const light=await bubble.evaluate(el=>getComputedStyle(el).backgroundColor)
   await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));assert.notEqual(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor),light,JSON.stringify(await page.evaluate(()=>({prefs:JSON.parse(localStorage.getItem('dsh-claude-beautify:settings:v1')),style:document.querySelector('style[data-dcb-user-bubbles]').textContent,variable:getComputedStyle(nativeBubble).getPropertyValue('--bubble-cream')}))))
   assert.equal(await bubble.evaluate(el=>getComputedStyle(el).color),'rgb(242, 244, 249)')
  }
  await page.setViewportSize({width:520,height:1000});await page.addStyleTag({content:'.settings-dialog{inset:20px 12px;padding:12px}'});assert.equal(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true)
  await dialog.locator('.dcb-bubble-settings').screenshot({path:resolve(output,'glass-narrow-dark.png')})
  await page.setViewportSize({width:1440,height:1050});await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'))
 })
 await check('custom drafts preview locally, apply only on save, and invalid selectors cannot leak into the page',async()=>{
  await choose('自定义 CSS');const editor=page.getByRole('textbox',{name:'用户气泡自定义 CSS',exact:true}),save=page.getByRole('button',{name:'保存气泡 CSS',exact:true})
  await page.getByRole('button',{name:'载入 QQ 示例',exact:true}).click();assert.match(await editor.inputValue(),/linear-gradient/)
  const original=await bubble.evaluate(el=>getComputedStyle(el).background)
  await editor.fill('.bubble { background: rgb(40, 90, 120); color: white; border-radius: 8px; }\n.dark .bubble { background: rgb(70, 50, 90); }');await settled()
  assert.equal(await page.locator('[data-dcb-user-preview]').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(40, 90, 120)')
  assert.equal(await bubble.evaluate(el=>getComputedStyle(el).background),original)
  await save.click();await settled();assert.equal(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(40, 90, 120)')
  await editor.fill('body { opacity: 0 }');await settled();assert.equal(await save.isDisabled(),true)
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).opacity),'1');assert.equal(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(40, 90, 120)')
  await page.getByRole('button',{name:'还原已保存 CSS',exact:true}).click();assert.match(await editor.inputValue(),/40, 90, 120/)
 })
 await check('scoping rejects external resources and sibling escapes while animations and media stay local and honor reduced motion',async()=>{
  const invalid=['.bubble, body {color:red}', '.bubble + div {color:red}', '@import "https://invalid.example/style.css";', '.bubble {background:url(https://invalid.example/a.png)}', '@font-face{font-family:test;src:local(test)}','.bubble {background:u\\72l(test)}']
  for(const source of invalid)assert.ok(await page.evaluate(source=>Bubbles.compileUserBubbleCss(window,source).error,source),source)
  const editor=page.getByRole('textbox',{name:'用户气泡自定义 CSS',exact:true})
  await editor.fill('.bubble { animation: pulse 2s infinite !important; } .bubble::after {content:"";pointer-events:auto !important} @keyframes pulse { from {opacity:.8} to {opacity:1} } @media(max-width:600px) {.bubble { border-radius: 7px; }}');await page.getByRole('button',{name:'保存气泡 CSS',exact:true}).click();await settled()
  assert.equal(await bubble.evaluate(el=>getComputedStyle(el).animationName),'dcb-user-bubble-live-pulse')
  assert.equal(await page.locator('[data-dcb-user-preview]').evaluate(el=>getComputedStyle(el).animationName),'dcb-user-bubble-preview-pulse')
  assert.equal(await bubble.evaluate(el=>getComputedStyle(el,'::after').pointerEvents),'none')
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await bubble.evaluate(el=>getComputedStyle(el).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'})
  await editor.fill('.bubble { background: rgb(40, 90, 120); color: white; } .dark .bubble { background: rgb(70, 50, 90); }');await page.getByRole('button',{name:'保存气泡 CSS',exact:true}).click();await settled()
 })
 await check('saved custom CSS survives reload and storage changes; appended virtual rows get styling without observers',async()=>{
  await boot(true);assert.equal((await saved()).userBubbleStyle,'custom');assert.equal(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(40, 90, 120)')
  await page.evaluate(key=>{const next=JSON.stringify({...JSON.parse(localStorage.getItem(key)),userBubbleCss:'.bubble {background:#abcdef;color:#123456}'});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},key);await settled()
  assert.equal(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(171, 205, 239)')
  const clone=await page.evaluate(()=>{const row=nativeBubble.closest('article').cloneNode(true);row.id='virtual-row';document.getElementById('bubble-fixture').append(row);return getComputedStyle(row.querySelector('[class$=_bubble]')).backgroundColor});assert.equal(clone,'rgb(171, 205, 239)')
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await choose('QQ 蓝');await page.locator('.dcb-bubble-settings').screenshot({path:resolve(output,'settings-qq.png')})
 })
 await check('default and disposal restore the original appearance without moving React-owned nodes',async()=>{
  await choose('默认');assert.equal(await page.locator('style[data-dcb-user-bubbles]').textContent(),'')
  assert.equal(await page.evaluate(()=>nativeBubble===document.querySelector('[data-chat-flow-kind=user] [class$=_bubble]')&&getComputedStyle(nativeBubble).borderRadius===baseline.border),true)
  await page.evaluate(()=>window.cleanups.reverse().forEach(clean=>clean?.()));assert.equal(await page.locator('style[data-dcb-user-bubbles]').count(),0)
 })
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);console.log(JSON.stringify({passed,native:!!process.env.DSH_ASAR,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
