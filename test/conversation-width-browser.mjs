import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer} from 'node:http'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','window-chat-width-qa'))
mkdirSync(output,{recursive:true})
assert.ok(process.env.DSH_ASAR,'Set DSH_ASAR to test the installed host width controls')
const fd=openSync(process.env.DSH_ASAR,'r')
let source
try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
  const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let entry=JSON.parse(json);for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js'.split('/'))entry=entry.files[part]
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset));source=bytes.toString()
}finally{closeSync(fd)}
const at=source.indexOf('ConversationRoot.module.css'),region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at))
const css=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])
const classes=source.match(/var ConversationRoot_module_css_default = (\{[\s\S]*?\n\s*\});/)[1]
const start=source.indexOf('const WIDTH_PREF_KEY ='),controls=source.slice(start,source.indexOf('//#endregion',start))
assert.ok(controls.includes('function ConversationWidthControls(')&&controls.includes('setPointerCapture'))
const jsx=`import React from'react';import*as jsxRuntime from'react/jsx-runtime';import{createRoot}from'react-dom/client';
import{createConversationWidth,conversationWidthMode}from'./src/conversation-width.js';import{createSidebarOverlay,sidebarOverlayCss}from'./src/sidebar-overlay.js';import{createHeaderLayout,headerLayoutCss}from'./src/header-layout.js';
const react=React,react_jsx_runtime=jsxRuntime,ConversationRoot_module_css_default=${classes};${controls}
window.fixtureReact=React;let manager,overlay,headerLayout,observer;window.cleanups=[];window.widthSyncs=0;
const schedule=()=>{overlay.sync(true);manager.sync();headerLayout.sync(true);window.widthSyncs++};
function App(){const[body,setBody]=React.useState(null);return <main className={ConversationRoot_module_css_default.root} data-phase="active"><header className={ConversationRoot_module_css_default.header}><div className={ConversationRoot_module_css_default.headerLeading} data-conversation-header-leading></div><div className={ConversationRoot_module_css_default.titleRow}><div className={ConversationRoot_module_css_default.titleCluster}><span className={ConversationRoot_module_css_default.crumbs} data-test-title>聊天宽度 · 本机 DSH 原生拖动控件</span></div></div><nav data-conversation-tabs>对话　　轨迹　　上下文</nav></header><div className={ConversationRoot_module_css_default.body} data-conversation-content data-conversation-session="synthetic" ref={setBody}><div className={ConversationRoot_module_css_default.scrollBody} data-conversation-scroll><article data-chat-flow><p className="user">这是一段合成的窗口宽度演示。</p><p>全屏与普通窗口分别记住聊天宽度。缩小窗口时，正文和输入栏会临时适配可见区域。</p><p>切回原来的窗口后恢复之前调好的宽度。侧栏开合继续保留草稿和输入焦点。</p></article><div className={ConversationRoot_module_css_default.composerSeat}><div className="composer"><textarea aria-label="合成草稿" defaultValue="保留草稿和输入焦点"/><div>＋　完全权限 <span>模型选择　 🎙　↑</span></div></div></div></div><ConversationWidthControls container={body} phase="active"/></div></main>}
window.mount=()=>{window.root=createRoot(document.querySelector('#conversation'));window.root.render(<App/>)};
window.install=()=>{document.querySelector('#plugin-css').textContent=sidebarOverlayCss+headerLayoutCss;overlay=createSidebarOverlay(document,window,schedule);manager=createConversationWidth(document,window);headerLayout=createHeaderLayout(document,window);observer=new MutationObserver(schedule);observer.observe(document.querySelector('#conversation'),{childList:true,subtree:true});schedule();window.manager=manager};
window.dispose=()=>{observer.disconnect();manager.dispose();overlay.dispose();headerLayout.dispose();document.querySelector('#plugin-css').textContent=''};
window.remount=()=>{window.root.unmount();window.mount()};window.currentMode=()=>conversationWidthMode(document,window);
window.mount();`
const result=await build({stdin:{contents:jsx,resolveDir:project,loader:'jsx'},bundle:true,write:false,format:'iife',target:'es2022'})
const html=`<!doctype html><html data-windows-titlebar><meta charset="utf-8"><style>${css}
:root{--dsw-alias-bg-base:#fff;--dsw-alias-label-primary:#24272d;--dsw-alias-border-l3:#e3e6eb;--dsw-alias-scrollbar-bg-l1:#9ca3af;--dsh-windows-titlebar-height:40px}*{box-sizing:border-box}html,body{height:100%;margin:0;font:16px/1.8 system-ui;color:#24272d}.demo_frame{display:grid;grid-template-columns:349px minmax(0,1fr) 0px;height:100%;position:relative;overflow:hidden;padding-top:40px}.demo_centerCol{min-width:0;height:100%}.demo_sidebarCol{background:#f5f6f8;overflow:hidden}.sb_root{height:100%;padding:20px 14px}.brand{font-size:22px;font-weight:650}.nav{margin:26px 0;line-height:3}.titlebar{position:fixed;top:0;left:0;right:0;height:40px;padding:4px 22px;background:#f5f6f8;z-index:50}header{height:90px;padding:20px 24px;border-bottom:1px solid #ddd;font-weight:600;flex:none}[data-chat-flow]{width:var(--dsh-chat-content-width);max-width:calc(100% - 64px);margin:0 auto;padding:26px 0;flex:1}.user{background:#eaf0ff;border-radius:14px;padding:12px 18px}.composer{width:calc(var(--dsh-chat-content-width) + 32px);max-width:calc(100% - 32px);margin:16px auto;padding:16px;border:1px solid #e6e8ee;box-shadow:0 4px 26px #0000000d;border-radius:24px}textarea{width:100%;height:90px;resize:none;font:inherit;border:0;background:transparent;color:inherit;outline:none}.composer span{float:right}.dark{--dsw-alias-bg-base:#151619;--dsw-alias-label-primary:#e5e7eb;--dsw-alias-border-l3:#35373c;color:#e5e7eb;background:#151619}.dark .titlebar,.dark .demo_sidebarCol{background:#1d1f23}.dark .user{background:#282f43}.dark .composer{border-color:#35373c}
</style><style id="plugin-css"></style><div class="titlebar">☰　应用　编辑</div><div class="demo_frame" data-sidebar-collapsed="false"><aside class="demo_sidebarCol"><div class="sb_root" style="width:349px"><div class="brand">deepseek HARNESS</div><div class="nav">＋ 新会话<br>插件<br>插件市场<br>自动化任务<br>记忆系统<br>工作区<br>　聊天宽度验证</div></div></aside><div class="demo_centerCol" id="conversation"></div><aside class="demo_rightbarCol" data-rightbar-col></aside></div><script src="/fixture.js"></script></html>`
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/fixture.js'?'application/javascript':'text/html');res.end(req.url==='/fixture.js'?result.outputFiles[0].text:html)})
await new Promise(done=>server.listen(0,'127.0.0.1',done));const url=`http://127.0.0.1:${server.address().port}/`
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const context=await browser.newContext({viewport:{width:1600,height:1000},screen:{width:2560,height:1440}})
// Playwright changes screen.avail* with setViewportSize. A real monitor's work
// area stays fixed while its application window is restored or resized.
await context.addInitScript(()=>Object.defineProperties(screen,{availWidth:{configurable:true,get:()=>2560},availHeight:{configurable:true,get:()=>1440}}))
const page=await context.newPage(),errors=[],checks=[]
page.on('pageerror',error=>errors.push(error.message))
const KEY='dsh-ui-beautify:conversation-width:v1',NATIVE='dsh.conversation.contentWidth'
async function boot({saved=null,legacy='1400',fullscreen=false}={}){
  await page.goto(url);await page.waitForSelector('[data-width-handle]')
  await page.evaluate(({KEY,NATIVE,saved,legacy,fullscreen})=>{localStorage.clear();if(saved)localStorage.setItem(KEY,JSON.stringify(saved));if(legacy!==null)localStorage.setItem(NATIVE,legacy);document.documentElement.toggleAttribute('data-fullscreen',fullscreen);window.install()}, {KEY,NATIVE,saved,legacy,fullscreen})
  await settle()
}
async function settle(){await page.waitForTimeout(100)}
async function geometry(){return page.evaluate(({KEY,NATIVE})=>{
  const body=document.querySelector('[data-conversation-content]'),flow=document.querySelector('[data-chat-flow]'),input=document.querySelector('.composer'),box=e=>{const r=e.getBoundingClientRect();return {left:r.left,width:r.width,right:r.right}}
  return {body:box(body),flow:box(flow),composer:box(input),sidebar:box(document.querySelector('.demo_sidebarCol')),mode:body.getAttribute('data-dcb-chat-width-mode'),signals:{native:document.documentElement.hasAttribute('data-fullscreen'),api:!!document.fullscreenElement,media:matchMedia('(display-mode: fullscreen)').matches,outer:[outerWidth,outerHeight],screen:[screen.availWidth,screen.availHeight]},text:parseFloat(getComputedStyle(body).getPropertyValue('--dsh-chat-content-width')),saved:JSON.parse(localStorage.getItem(KEY)),native:localStorage.getItem(NATIVE),draft:document.querySelector('textarea').value,focus:document.activeElement===document.querySelector('textarea'),syncs:window.widthSyncs}
},{KEY,NATIVE})}
async function drag(dx){const box=await page.locator('[data-width-handle=right]').boundingBox();assert.ok(box?.width>0,'Native handle remains reachable');await page.mouse.move(box.x+box.width/2,box.y+60);await page.mouse.down();await page.mouse.move(box.x+box.width/2+dx,box.y+60,{steps:6});await page.mouse.up();await settle()}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
try{
 await check('legacy width migrates once; ordinary window keeps transcript and composer clear of expanded sidebar',async()=>{
  await boot();const g=await geometry();assert.equal(g.saved.window,1400);assert.equal(g.saved.fullscreen,null);assert.equal(g.mode,'window');assert.ok(g.flow.left>=g.sidebar.right+32);assert.ok(g.composer.left>=g.sidebar.right+16);assert.ok(g.composer.right<=1600-16);assert.equal(g.text,806)
  assert.ok(Math.abs((await page.locator('[data-test-title]').boundingBox()).x-g.flow.left)<1);await page.screenshot({path:resolve(output,'window-light.png')})
 })
 await check('native drag starts at the visible constrained width; switching modes restores separate preferences',async()=>{
  const before=await geometry();await drag(-40);const after=await geometry();assert.ok(Math.abs(after.text-(before.text-80))<2);assert.ok(Math.abs(after.saved.window-after.text)<2)
  await page.setViewportSize({width:2560,height:1380});await page.evaluate(()=>document.documentElement.setAttribute('data-fullscreen','true'));await settle();let g=await geometry();assert.equal(g.mode,'fullscreen');assert.equal(g.text,920);assert.equal(g.saved.fullscreen,null)
  await drag(140);g=await geometry();assert.equal(g.saved.fullscreen,1200);assert.equal(g.text,1200)
  await page.setViewportSize({width:1600,height:1000});await page.evaluate(()=>document.documentElement.removeAttribute('data-fullscreen'));await settle();g=await geometry();assert.ok(Math.abs(g.text-after.text)<2,JSON.stringify({before:after,returned:g}));assert.equal(g.saved.fullscreen,1200)
 })
 await check('fullscreen and window memories survive reload; temporary resize never overwrites saved widths',async()=>{
  const saved=(await geometry()).saved;await page.reload();await page.waitForSelector('[data-width-handle]');await page.evaluate(()=>window.install());await settle();assert.deepEqual((await geometry()).saved,saved)
  await page.setViewportSize({width:1080,height:900});await settle();let g=await geometry();assert.ok(g.composer.left>=g.sidebar.right+16);assert.ok(g.text<saved.window);assert.deepEqual(g.saved,saved)
  await page.setViewportSize({width:1600,height:1000});await settle();assert.equal((await geometry()).text,saved.window)
  await page.setViewportSize({width:2560,height:1380});await page.evaluate(()=>document.documentElement.setAttribute('data-fullscreen','true'));await settle();assert.equal((await geometry()).text,saved.fullscreen)
  await page.reload();await page.waitForSelector('[data-width-handle]');await page.evaluate(()=>{document.documentElement.setAttribute('data-fullscreen','true');window.install()});await settle();assert.equal((await geometry()).text,saved.fullscreen)
  await page.evaluate(()=>document.body.classList.add('dark'));await page.screenshot({path:resolve(output,'fullscreen-dark.png')})
 })
 await check('sidebar toggle, focus, remount and narrow layout preserve draft and preferences',async()=>{
  await page.setViewportSize({width:1600,height:1000});await page.evaluate(()=>document.documentElement.removeAttribute('data-fullscreen'));await settle();const before=await geometry();await page.locator('textarea').focus()
  await page.evaluate(()=>{document.querySelector('.demo_frame').setAttribute('data-sidebar-collapsed','true');document.querySelector('.demo_frame').style.gridTemplateColumns='0 minmax(0,1fr) 0';document.querySelector('.demo_sidebarCol').style.width='0'});await settle();const after=await geometry();assert.deepEqual(after.flow,before.flow);assert.deepEqual(after.composer,before.composer);assert.equal(after.focus,true);assert.equal(after.draft,before.draft)
  await page.evaluate(()=>window.remount());await page.waitForSelector('[data-dcb-chat-width-mode]');await settle();assert.deepEqual((await geometry()).saved,before.saved)
  await page.setViewportSize({width:520,height:850});await settle();let g=await geometry();assert.ok(g.composer.left>=0&&g.composer.right<=520);assert.deepEqual(g.saved,before.saved)
  await page.evaluate(()=>document.body.classList.add('dark'));await page.screenshot({path:resolve(output,'narrow-dark.png')})
 })
 await check('maximized desktop requires both work-area dimensions; browser fullscreen uses its own explicit signal',async()=>{
  const modes=await page.evaluate(()=>{const original={width:outerWidth,height:outerHeight};Object.defineProperty(window,'outerWidth',{configurable:true,value:screen.availWidth});Object.defineProperty(window,'outerHeight',{configurable:true,value:screen.availHeight});const max=window.currentMode();Object.defineProperty(window,'outerHeight',{configurable:true,value:screen.availHeight-200});const wide=window.currentMode();document.documentElement.removeAttribute('data-windows-titlebar');Object.defineProperty(window,'outerHeight',{configurable:true,value:screen.availHeight});const web=window.currentMode();Object.defineProperty(window,'outerWidth',{configurable:true,value:original.width});Object.defineProperty(window,'outerHeight',{configurable:true,value:original.height});document.documentElement.setAttribute('data-windows-titlebar','');return {max,wide,web}})
  assert.deepEqual(modes,{max:'fullscreen',wide:'window',web:'window'})
 })
 await check('pointer cancel and no-op click do not replace the saved preference with a temporary clamp',async()=>{
  await page.setViewportSize({width:1600,height:1000});await boot();const saved=(await geometry()).saved,handle=page.locator('[data-width-handle=right]');await handle.click();await settle();assert.deepEqual((await geometry()).saved,saved)
  const box=await handle.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+60);await page.mouse.down();await page.mouse.move(box.x+box.width/2+10,box.y+60);await handle.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();await settle();assert.deepEqual((await geometry()).saved,saved)
 })
 await check('changing window mode during a drag never commits into the other mode',async()=>{
  await boot({saved:{version:1,window:1000,fullscreen:1200}});const saved=(await geometry()).saved,handle=await page.locator('[data-width-handle=right]').boundingBox()
  await page.mouse.move(handle.x+handle.width/2,handle.y+60);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2+20,handle.y+60);await page.evaluate(()=>document.documentElement.setAttribute('data-fullscreen','true'));await settle();await page.mouse.up();await settle();assert.deepEqual((await geometry()).saved,saved)
  await page.evaluate(()=>document.documentElement.removeAttribute('data-fullscreen'));await settle()
 })
 await check('parallel-sidebar text holds remain intact and resume the saved width after release',async()=>{
  const expected=(await geometry()).text
  await page.evaluate(()=>{const body=document.querySelector('[data-conversation-content]');body.parentElement.setAttribute('data-dcb-sidebar-layout-lock','');body.style.setProperty('--dsh-chat-content-width','700px','important');window.manager.sync()});await settle();assert.equal((await geometry()).text,700)
  await page.evaluate(()=>document.querySelector('[data-phase]').removeAttribute('data-dcb-sidebar-layout-lock'));await settle();assert.equal((await geometry()).text,expected)
 })
 await check('reduced motion, forced colors, cleanup and idle remain stable without a permanent animation loop',async()=>{
  await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await settle();const before=await geometry();await page.waitForTimeout(300);assert.equal((await geometry()).syncs,before.syncs)
  await page.evaluate(()=>window.dispose());assert.equal(await page.locator('[data-dcb-chat-width-mode]').count(),0);assert.equal(await page.locator('[data-conversation-content]').evaluate(e=>e.style.getPropertyValue('--dsh-chat-content-width')),'')
  assert.equal(await page.locator('[data-phase]').evaluate(e=>e.style.getPropertyValue('--dsh-chat-user-width')),'1000px')
  assert.deepEqual((await geometry()).saved,before.saved)
  await page.setViewportSize({width:1800,height:1000});await settle();assert.equal(await page.locator('[data-dcb-chat-width-mode]').count(),0)
 })
 await check('all-settings reset restores automatic sizing in both modes; undo restores both independent widths',async()=>{
  await boot({saved:{version:1,window:1100,fullscreen:1800},legacy:null})
  const before=await page.evaluate(()=>window.manager.snapshot())
  await page.evaluate(()=>window.manager.reset());await settle()
  assert.deepEqual((await geometry()).saved,{version:1,window:null,fullscreen:null})
  assert.equal(await page.evaluate(()=>localStorage.getItem('dsh.conversation.contentWidth')),null)
  assert.equal(await page.locator('[data-phase]').evaluate(el=>el.style.getPropertyValue('--dsh-chat-user-width')),'')
  await page.evaluate(()=>document.documentElement.setAttribute('data-fullscreen','true'));await settle()
  assert.equal((await geometry()).mode,'fullscreen')
  await page.evaluate(value=>window.manager.restore(value),before);await settle()
  assert.deepEqual((await geometry()).saved,before)
  assert.equal(await page.evaluate(()=>localStorage.getItem('dsh.conversation.contentWidth')),'1800')
  await page.evaluate(()=>{document.documentElement.removeAttribute('data-fullscreen');window.manager.restore({window:1000,fullscreen:1800});window.dispose()});await settle()
 })
 await check('the generated complete plugin installs the width controller and restores native sizing on cleanup',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  await page.evaluate(()=>{window[Symbol.for('dsh-ui-beautify.startup-motion.v1')]=true;localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify({welcomeEnabled:false,sidebarOverlay:true}));window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(()=>window.fixtureReact)}})
  await page.addScriptTag({content:readFileSync(resolve(project,'client.js'),'utf8')})
  await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx)})
  await page.waitForSelector('[data-dcb-chat-width-mode]');await settle();const before=await geometry();assert.equal(before.mode,'window');assert.equal(before.saved.window,1000)
  await drag(-40);assert.equal((await geometry()).saved.window,before.text-80)
  await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()});await settle();assert.equal(await page.locator('[data-dcb-chat-width-mode]').count(),0);assert.equal(await page.locator('style[data-plugin="dsh-ui-beautify"]').count(),0)
 })
 assert.deepEqual(errors,[])
 writeFileSync(resolve(output,'verification.json'),JSON.stringify({host:process.env.DSH_ASAR,source:'Installed ConversationRoot CSS and unmodified ConversationWidthControls/WidthHandle; synthetic conversation and shell',checks,errors},null,2))
 console.log(`${checks.length} browser groups passed`)
}finally{await browser.close();await new Promise(done=>server.close(done))}
