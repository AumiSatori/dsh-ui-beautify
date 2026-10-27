import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeHeaderFixture} from './native-header.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url))
import {csvPreview,outputContentReader} from '../src/output-viewer.js'
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'../../outputs/dsh-ui-beautify'),'artifacts')
mkdirSync(output,{recursive:true})
const nativeHeader=nativeHeaderFixture()
const fixture=await build({stdin:{contents:`import React from 'react';import * as jsxRuntime from 'react/jsx-runtime';import {createRoot} from 'react-dom/client';import {createPortal,flushSync} from 'react-dom'; import './test/fixture.jsx'; window.fixtureCreatePortal=createPortal;${nativeHeader?.fixture||''}`,resolveDir:project},bundle:true,write:false,format:'iife'})
const html=`<!doctype html><html><head><style>body{margin:0;font:30px system-ui;background:#f0efec;color:#242424}header{height:250px;padding:60px;background:linear-gradient(135deg,#f2c171,#6861b0);color:white}h1{font-size:54px;margin:0 0 14px}section{padding:30px 60px;display:flex;gap:25px}.shape{width:100px;height:100px;background:#fff4a2;border-radius:50%}.shape+div{background:#fff;border-radius:0}</style></head><body><header><h1>Artifact Preview</h1><p>Independent output beside the chat</p></header><section><div class="shape"></div><div class="shape"></div></section><script>parent.postMessage('artifact-cover-script-ran','*')</script></body></html>`
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')
const files=[{path:'outputs/Preview page.html',description:'页面演示'},{path:'outputs/report.md'},{path:'outputs/query.sql'},{path:'outputs/result.json'},{path:'outputs/data.csv'},{path:'outputs/frame.png'},{path:'outputs/demo.mp4'},{path:'outputs/archive.zip'}]
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'))],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'))]}
if(process.env.DSH_ARTIFACT_CLIENT)routes['/artifact.js']=['text/javascript',readFileSync(process.env.DSH_ARTIFACT_CLIENT)]
const server=createServer((req,res)=>{
 const route=routes[req.url]
 if(route)return res.writeHead(200,{'Content-Type':route[0]}).end(route[1])
 // Deliberately reproduce the installed host: legacy Artifact routes are absent.
 res.writeHead(404).end()
})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[]
page.on('pageerror',error=>errors.push(error.message))
const url=`http://127.0.0.1:${server.address().port}`,card=page.getByTestId('dcb-summary')
const settled=async()=>{await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))}
async function loadCompanion(){
 if(routes['/artifact.js']){
  await page.addScriptTag({url:url+'/artifact.js'})
  await page.evaluate(()=>window.plugins['dsh-artifact-preview'].apply({slots:{inject(_slot,cb){cb()},register(){return()=>{}}},effect(cb){return cb()}}))
 }else await page.evaluate(()=>{
  window.__dshCanPreviewPath=path=>/\.(?:x?html?|md|sql|json|csv|png)$/i.test(path)
  window.__dshOpenFilePreview=path=>{window.previewRequests.push(path)}
  const marker=document.createElement('style');marker.dataset.testCompanion='';document.head.append(marker)
 })
 await page.evaluate(()=>window.companionHooks={open:window.__dshOpenFilePreview,can:window.__dshCanPreviewPath})
 await settled()
}
async function boot({companion=false,noPortal=false,native=false,missingSessionHook=false,viewerCrash=false,enabled=true,preserveSettings=false}={}){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor()
 await page.evaluate(({html,png,noPortal,viewerCrash,enabled,preserveSettings})=>{
  window.plugins={};window.cleanups=[];window.opened=[];window.previewRequests=[];window.reads=[];window.stats=[];window.coverScripts=0;window.slowReads=false
  if(!preserveSettings)localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify({welcomeEnabled:false,enabled}))
  window.addEventListener('message',event=>{if(event.data==='artifact-cover-script-ran')window.coverScripts++})
  window.viewerCrash=viewerCrash
  const originalReact=window.fixtureReact,react={...originalReact,useSyncExternalStore(subscribe,getSnapshot,...rest){const value=getSnapshot();if(window.viewerCrash&&value&&typeof value==='object'&&'present'in value&&'open'in value)throw Error('Synthetic optional viewer render failure');return originalReact.useSyncExternalStore(subscribe,getSnapshot,...rest)}}
  window.__ModuleLoader__={load(spec){window.plugins[spec.id]=spec.factory(name=>name==='react-dom'?{createPortal:noPortal?undefined:window.fixtureCreatePortal}:name==='react/jsx-runtime'?{jsx:(type,props,key)=>react.createElement(type,{...props,key}),jsxs:(type,props,key)=>react.createElement(type,{...props,key})}:name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null,CodeBlock:({code})=>react.createElement('pre',null,react.createElement('code',null,code)),MarkdownText:({text})=>react.createElement('div',null,...text.split('\n\n').map((block,i)=>react.createElement(block.startsWith('# ')?'h1':'p',{key:i},block.replace(/^# /,''))))}:react)}}
  const face={
   stat:async(session,path)=>{window.stats.push({session,path});return path.includes('missing')&&!window.recovered?{ok:false}:{ok:true,value:{absolutePath:`D:/synthetic/${session}/${path.replaceAll('\\','/')}`,bytes:path.includes('oversize')?700000:1000}}},
   readBytes:async(session,path,_options,signal)=>{
    window.reads.push({session,path})
    if(window.slowReads)await new Promise(done=>{const timer=setTimeout(done,typeof window.slowReads==='number'?window.slowReads:250);signal?.addEventListener('abort',()=>{clearTimeout(timer);window.abortedReads=(window.abortedReads||0)+1;done()},{once:true})})
    if(path.includes('broken'))throw new Error('read failure')
    const text=path.endsWith('.md')?'# Output preview\n\nSynthetic report':path.endsWith('.csv')?'name,value\n"demo, one",1\n"two\nlines",2':path.endsWith('.json')?'{"preview":true}':path.endsWith('.sql')?'select 1 as preview;':html
    return{ok:true,value:{data:path.endsWith('.png')?png:Array.from(new TextEncoder().encode(text))}}
   },
  }
  window.testFace=face
  window.testCtx={
   get:name=>name==='remote'?{workspaceFiles:face}:name==='remote.workspaceFiles'?face:undefined,
   slots:{inject(_slot,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},
   sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource:address=>window.opened.push(address)},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(window.testCtx)},
  }
 },{html,png:Array.from(png),noPortal,viewerCrash,enabled,preserveSettings})
 if(companion)await loadCompanion()
 await page.addScriptTag({url:url+'/client.js'})
 await page.evaluate(files=>{window.plugins['dsh-ui-beautify'].apply(window.testCtx);window.fixture.refresh();window.fixture.records([{event:{type:'deliverables/presented',seq:1,data:{files}}}])},files)
 if(native){
  assert.ok(nativeHeader,'Set DSH_ASAR for native header integration checks')
  await page.addStyleTag({content:nativeHeader.css+' [data-native-header-fixture] > header {height:auto;flex:none;} [data-native-header-fixture] header nav {display:flex;}'});
  await page.evaluate(missingSessionHook=>window.mountNativeHeader({missingSessionHook}),missingSessionHook)
  if(!await page.getByRole('button',{name:'会话进度与输出',exact:true}).count())throw new Error('Native header fixture failed: '+errors.join('; '))
 }
  if(enabled){const entry=page.getByRole('button',{name:'会话进度与输出',exact:true});if(await entry.getAttribute('aria-expanded')!=='true'){await entry.click();await settled()}}
}
async function clickOutput(path){const entry=page.getByRole('button',{name:'会话进度与输出',exact:true});if(await entry.getAttribute('aria-expanded')!=='true'){await entry.click();await settled()}await card.locator('.dcb-output').filter({hasText:path.split(/[/\\]/).at(-1).replace(/\.[^.]+$/,'')}).click();await settled()}
async function patch(value){await page.evaluate(value=>{const key='dsh-ui-beautify:settings:v1',next=JSON.stringify({...JSON.parse(localStorage.getItem(key)||'{}'),...value});localStorage.setItem(key,next);dispatchEvent(new StorageEvent('storage',{key,newValue:next}))},value);await settled()}
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
try{
 if(nativeHeader)await check('the installed native header survives refresh, missing optional session hooks and a failed optional reader',async()=>{
  for(const options of [{},{missingSessionHook:true},{viewerCrash:true}]){
   await boot({companion:true,native:true,...options})
   const header=page.locator('[data-native-header-fixture] > header')
   assert.equal(await header.getByText('页头兼容测试',{exact:true}).isVisible(),true)
   assert.equal(await header.getByRole('tab',{name:'对话',exact:true}).isVisible(),true)
   assert.equal(await header.getByRole('tab',{name:'轨迹',exact:true}).isVisible(),true)
   assert.equal(await header.getByRole('tab',{name:'上下文',exact:true}).isVisible(),true)
   assert.equal(await header.getByRole('button',{name:'会话进度与输出',exact:true}).isVisible(),true)
   assert.equal(await header.getByRole('button',{name:'右侧栏',exact:true}).isVisible(),true)
   await clickOutput('report.md')
   if(options.viewerCrash){assert.equal(await page.locator('.dcb-file-viewer').count(),0);assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/report.md')}
   else{await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor();await page.getByRole('button',{name:'关闭文件预览'}).click();await settled()}
   assert.equal(await header.getByRole('tab',{name:'对话',exact:true}).isVisible(),true)
   await page.screenshot({path:resolve(output,options.viewerCrash?'native-header-preview-failed.png':options.missingSessionHook?'native-header-optional-hook.png':'native-header-refreshed.png')})
  }
 })
 await check('the enabled card includes Artifact previews without a companion or a separate preference',async()=>{
  await boot();await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor()
  assert.equal(await card.locator('.dcb-output').count(),files.length)
  assert.equal(await page.evaluate(()=>typeof window.__dshOpenFilePreview),'undefined')
  assert.equal(await page.evaluate(()=>window.coverScripts),0)
 })
 await check('output rows and Artifact cards share the styled file context menu',async()=>{
  await boot()
  await card.locator('.dcb-output').filter({hasText:'report'}).click({button:'right'})
  const menu=page.getByRole('menu',{name:'report.md 文件操作',exact:true})
  await menu.waitFor()
  assert.deepEqual(await menu.locator('button > span:last-child').allTextContents(),['打开','复制路径','打开文件位置','重命名','删除','属性'])
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'})
  const artifact=card.locator('.dcb-artifact[data-preview-state=ready]').first().locator('.dcb-artifact-open')
  await artifact.click({button:'right'})
  const artifactMenu=page.locator('.dcb-file-context-menu').last()
  await artifactMenu.waitFor();await artifactMenu.getByRole('menuitem',{name:'属性',exact:true}).click()
  await page.locator('.dcb-file-context-status').filter({hasText:'D:/synthetic/a/outputs/Preview page.html'}).waitFor()
  await page.keyboard.press('Escape');await artifactMenu.waitFor({state:'hidden'})
 })
 await check('one visual output uses one column; multiple image and HTML covers use two while attachments span the row',async()=>{
  const grid=card.locator('.dcb-output-grid')
  async function show(paths){
   await page.evaluate(paths=>window.fixture.records([{event:{type:'deliverables/presented',seq:2,data:{files:paths.map(path=>({path}))}}}]),paths);await settled()
   await grid.waitFor()
  }
  async function boxes(){return grid.locator(':scope > *').evaluateAll(nodes=>nodes.map(node=>{const box=node.getBoundingClientRect();return{x:box.x,y:box.y,width:box.width,height:box.height}}))}
  await show(['outputs/one.png']);assert.equal(await grid.getAttribute('data-columns'),'1')
  let rect=await boxes();assert.ok(Math.abs(rect[0].width-(await grid.boundingBox()).width)<1)
  await show(['outputs/one.png','outputs/two.png','outputs/three.png']);assert.equal(await grid.getAttribute('data-columns'),'2')
  rect=await boxes();assert.ok(Math.abs(rect[0].y-rect[1].y)<1);assert.ok(rect[2].y>rect[0].y);assert.ok(Math.abs(rect[0].width-rect[1].width)<1)
  await card.screenshot({path:resolve(output,'image-grid-light.png')})
  await show(['outputs/one.png','outputs/Preview page.html','outputs/archive.zip']);await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor();await settled()
  rect=await boxes();assert.ok(Math.abs(rect[0].y-rect[1].y)<1);assert.ok(rect[2].width>rect[0].width*1.9)
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await card.screenshot({path:resolve(output,'image-html-grid-dark.png')})
  await page.setViewportSize({width:390,height:900});await settled();assert.equal(await grid.evaluate(node=>node.scrollWidth<=node.clientWidth+1),true)
  await card.screenshot({path:resolve(output,'image-grid-narrow.png')})
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await settled();assert.equal(await grid.evaluate(node=>node.scrollWidth<=node.clientWidth+1),true)
  await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});await page.setViewportSize({width:1280,height:1000});await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'))
  await show(['outputs/Preview page.html','outputs/archive.zip']);await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor();assert.equal(await grid.getAttribute('data-columns'),'1')
  assert.equal(await page.evaluate(()=>window.coverScripts),0)
  await card.screenshot({path:resolve(output,'single-html-column.png')})
  await boot()
 })
 await check('original glass materials and black-white scope styles survive unfilled inner controls',async()=>{
  await boot({native:!!nativeHeader})
  await page.addStyleTag({content:'[data-native-header-fixture]{background:linear-gradient(120deg,#b8e1ef,#b4c3df 55%,#e3cbc5)!important} body[data-ds-dark-theme] [data-native-header-fixture]{background:linear-gradient(120deg,#132e40,#28344c 55%,#463443)!important}'})
  const row=card.locator('.dcb-output').filter({hasText:'report'})
  for(const dark of [false,true])for(const cardStyle of ['clear','css','glass']){
   await page.evaluate(dark=>document.body.toggleAttribute('data-ds-dark-theme',dark),dark);await patch({cardStyle,iconStyle:'glass'})
   await page.mouse.move(10,800);await page.evaluate(()=>document.activeElement?.blur());await settled()
   assert.notEqual(await card.evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)','The outer glass material must retain its original surface')
   assert.notEqual(await card.evaluate(node=>getComputedStyle(node).backgroundImage),'none','Retain optical highlights instead of flattening the whole card')
   assert.equal(await card.locator('.dcb-scope-switch').evaluate(node=>getComputedStyle(node).backgroundColor),dark?'rgb(17, 17, 17)':'rgb(255, 255, 255)')
   assert.equal(await card.locator('.dcb-scope-indicator path').evaluate(node=>getComputedStyle(node).fill),dark?'rgb(255, 255, 255)':'rgb(17, 17, 17)')
   assert.equal(await card.locator('[data-dcb-icon]').count(),0,'Nested summary controls must not be classified as header toolbar buttons')
   const fills=await card.locator('.dcb-module-toggle,.dcb-resource-summary,.dcb-output,.dcb-tile,.dcb-artifact').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).backgroundColor))
   assert.ok(fills.every(value=>value==='rgba(0, 0, 0, 0)'),JSON.stringify(fills))
   await row.hover();await settled();assert.notEqual(await row.evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)')
   if(!dark&&cardStyle==='glass')await card.screenshot({path:resolve(output,'transparent-glass-output-hover.png')})
   await page.mouse.move(10,800);await row.focus();await settled();assert.notEqual(await row.evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)')
   await page.evaluate(()=>document.activeElement?.blur());await settled()
   if(cardStyle==='glass')await card.screenshot({path:resolve(output,dark?'transparent-glass-dark.png':'transparent-glass-light.png')})
  }
  await page.emulateMedia({forcedColors:'active'});await settled();assert.notEqual(await card.evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)')
  await page.emulateMedia({forcedColors:'none'});await boot()
 })
 await check('a companion loaded later leaves the existing card, all files and static covers intact',async()=>{
  await page.evaluate(()=>window.originalCard=document.querySelector('.dcb-summary'));await loadCompanion()
  await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor();await settled()
  assert.equal(await page.evaluate(()=>window.originalCard===document.querySelector('.dcb-summary')),true)
  assert.equal(await card.locator('.dcb-output').count(),files.length);assert.equal(await page.evaluate(()=>window.coverScripts),0)
  const frame=card.locator('.dcb-artifact iframe');assert.equal(await frame.getAttribute('sandbox'),'');assert.equal(await frame.getAttribute('tabindex'),'-1')
  await page.waitForFunction(()=>document.querySelector('.dcb-artifact iframe')?.contentDocument===null)
  assert.match(await frame.getAttribute('srcdoc'),/Content-Security-Policy/)
  await card.screenshot({path:resolve(output,'artifact-light.png')})
 })
 await check('supported rows render actual contents through session reads while all legacy file routes return 404',async()=>{
  assert.equal(await page.evaluate(async()=> (await fetch('/dsh-files/static/missing.html')).status),404)
  for(const path of files.slice(0,-1).map(file=>file.path)){
   await clickOutput(path)
   const viewer=page.getByRole('region',{name:'文件预览',exact:true});await viewer.locator('[data-content-status=ready]').waitFor()
   assert.equal(await page.evaluate(()=>window.reads.at(-1).session),'a');assert.equal(await page.evaluate(()=>window.reads.at(-1).path),path)
   if(path.endsWith('.md'))assert.equal(await viewer.getByRole('heading',{name:'Output preview'}).isVisible(),true)
   if(path.endsWith('.csv'))assert.deepEqual(await viewer.locator('td').allTextContents(),['demo, one','1','two\nlines','2'])
   if(path.endsWith('.json'))assert.match(await viewer.locator('pre').innerText(),/"preview": true/)
   if(path.endsWith('.sql'))assert.match(await viewer.locator('pre').innerText(),/select 1/)
   if(path.endsWith('.png'))await viewer.locator('img').evaluate(el=>el.decode())
    if(path.endsWith('.mp4'))assert.equal(await viewer.locator('video[controls]').count(),1)
   if(path.endsWith('.html')){
    await viewer.frameLocator('iframe').getByRole('heading',{name:'Artifact Preview'}).waitFor()
    await viewer.screenshot({path:resolve(output,'viewer-html.png')})
    await viewer.getByRole('button',{name:'源码',exact:true}).click();assert.match(await viewer.locator('pre').innerText(),/<!doctype html>/)
   }
   assert.equal(await page.locator('#__dsh_artifact_preview__[data-open="1"]').count(),0)
   await viewer.getByRole('button',{name:'关闭文件预览'}).click();await settled();assert.equal(await viewer.count(),0)
  }
  const before=await page.evaluate(()=>window.previewRequests.length);await clickOutput('archive.zip');assert.equal(await page.evaluate(()=>window.previewRequests.length),before)
  assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/archive.zip')
  await page.evaluate(()=>{window.fixture.session('b');window.fixtureBinding('b').eventSource.replace([{event:{type:'deliverables/presented',seq:1,data:{files:[{path:'outputs/Preview page.html'}]}}}])});await settled()
  if(!await card.count()){await page.getByRole('button',{name:'会话进度与输出',exact:true}).click();await settled()}
  await clickOutput('Preview page.html');await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor();assert.equal(await page.evaluate(()=>window.reads.at(-1).session),'b')
  await page.getByRole('button',{name:'关闭文件预览'}).click();await settled()
  const absolute='D:\\another-workspace\\Absolute Page.html'
  await page.evaluate(path=>window.fixtureBinding('b').eventSource.replace([{event:{type:'deliverables/presented',seq:2,data:{files:[{path}]}}}]),absolute);await settled()
  await clickOutput(absolute);await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor();assert.equal(await page.evaluate(()=>window.reads.at(-1).path),absolute)
  await page.getByRole('button',{name:'关闭文件预览'}).click();await settled()
 })
 await check('MD and HTML preview interactions preserve manual and hover cards while ordinary outside clicks still dismiss them',async()=>{
  for(const origin of ['manual','hover'])for(const path of ['report.md','Preview page.html']){
   await boot({companion:true})
   const entry=page.getByRole('button',{name:'会话进度与输出',exact:true})
   if(origin==='hover'){
    await entry.click();await settled();await page.mouse.move(40,400);await entry.hover();await settled()
   }
   assert.equal(await card.getAttribute('data-open-origin'),origin)
   await clickOutput(path)
   const viewer=page.getByRole('region',{name:'文件预览',exact:true});await viewer.locator('[data-content-status=ready]').waitFor()
   await page.mouse.move(40,500);await page.waitForTimeout(500);await settled()
   assert.equal(await card.getAttribute('data-state'),'open','Reading a file must not trigger the hover leave timer')
   assert.equal(await entry.getAttribute('aria-expanded'),'true')
   await viewer.getByRole('button',{name:'源码',exact:true}).click();await settled()
   assert.equal(await card.getAttribute('data-state'),'open','The portalled source button belongs to this card')
   await viewer.getByRole('button',{name:'预览',exact:true}).click();await settled()
   await viewer.getByRole('button',{name:'重新加载文件'}).click();await viewer.locator('[data-content-status=ready]').waitFor();await settled()
   if(path.endsWith('.html'))await viewer.frameLocator('iframe').getByRole('heading',{name:'Artifact Preview'}).click()
   assert.equal(await card.getAttribute('data-state'),'open')
   assert.equal(await card.getAttribute('data-open-origin'),origin,'Preview interaction never silently pins a hover card')
   await viewer.getByRole('button',{name:'关闭文件预览'}).click();await settled()
   assert.equal(await card.getAttribute('data-state'),'open','Closing the reader returns to the still-open card')
   await page.locator('.scroll').click({position:{x:20,y:260}});await settled()
   assert.equal(await card.count(),0,'The normal outside-click dismissal still works after reading')
  }
 })
 await check('missing or broken companion capabilities do not affect previews; read failures retain retry and host-open controls',async()=>{
  await boot({companion:true})
  for(const failure of ['can-throw','removed']){
   await page.evaluate(failure=>{
    window.__dshCanPreviewPath=()=>{if(failure==='can-throw')throw new Error('unsupported');return true}
    window.__dshOpenFilePreview=()=>false
    if(failure==='removed'){delete window.__dshOpenFilePreview;delete window.__dshCanPreviewPath}
   },failure)
   const path='outputs/Preview page.html'
   if(failure==='removed'){await page.evaluate(()=>window.fixture.records([{event:{type:'deliverables/presented',seq:4,data:{files:[{path:'outputs/Preview page.html'}]}}}]));await settled()}
   await clickOutput(path);await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor()
   assert.equal(await page.evaluate(()=>window.opened.length),0)
   await page.getByRole('button',{name:'关闭文件预览'}).click();await settled()
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await settled();assert.equal(await card.locator('.dcb-artifact').count(),1)
  await boot({companion:true});await page.evaluate(()=>window.fixture.records([{event:{type:'deliverables/presented',seq:4,data:{files:[{path:'outputs/missing.html'}]}}}]));await settled()
  await clickOutput('missing.html');const viewer=page.getByRole('region',{name:'文件预览',exact:true});await viewer.getByRole('alert').waitFor()
  assert.match(await viewer.getByRole('alert').innerText(),/文件不存在/)
  await viewer.getByRole('alert').getByRole('button',{name:'用 DSH 打开'}).click();assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/missing.html')
  await settled();assert.equal(await viewer.count(),0);await clickOutput('missing.html');await viewer.getByRole('alert').waitFor()
  await page.evaluate(()=>window.recovered=true);await viewer.getByRole('button',{name:'重试',exact:true}).click();await viewer.locator('[data-content-status=ready]').waitFor()
  await viewer.frameLocator('iframe').getByRole('heading',{name:'Artifact Preview'}).waitFor()
  const before=await page.evaluate(()=>window.reads.length)
  await viewer.getByRole('button',{name:'重新加载文件'}).click();await viewer.locator('[data-content-status=ready]').waitFor();assert.equal(await page.evaluate(()=>window.reads.length),before+1)
  await viewer.getByRole('button',{name:'关闭文件预览'}).click();await settled()
  await boot({companion:true,noPortal:true});await clickOutput('report.md');assert.equal(await page.locator('.dcb-file-viewer').count(),0);assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/report.md')
 })
 await check('read limits, cancellation, encoding errors and bounded quoted CSV are enforced independently of the companion',async()=>{
  const signal=new AbortController().signal;let reads=0
  const binding={current:{stat:async()=>({ok:true,value:{bytes:3*1024*1024}}),readBytes:async()=>{reads++;return{ok:true,value:{data:[255]}}}}}
  const read=outputContentReader(binding)
  await assert.rejects(()=>read('a','large.md',signal),/2 MB/);assert.equal(reads,0)
  binding.current.stat=async()=>({ok:true,value:{bytes:1}})
  await assert.rejects(()=>read('a','invalid.md',signal),/文字编码/)
  const abort=new AbortController();binding.current.stat=async()=>{abort.abort();return{ok:true,value:{bytes:1}}}
  reads=0;await assert.rejects(()=>read('a','cancelled.md',abort.signal),{name:'AbortError'});assert.equal(reads,0)
  assert.deepEqual(csvPreview('\uFEFFname,value\r\n"a,b","two""quotes"\r\n"two\nlines",3').rows,[['name','value'],['a,b','two"quotes'],['two\nlines','3']])
  assert.deepEqual(csvPreview('header\n1\n2\n3',3),{rows:[['header'],['1'],['2']],truncated:true})
 })
 await check('the reader keeps stale loads out, cancels on session changes and releases image URLs on close and unmount',async()=>{
  await boot({companion:true})
  await page.evaluate(()=>{
   const original=window.testFace.readBytes
   window.testFace.readBytes=async(session,path,options,signal)=>{if(path.endsWith('.md'))await new Promise(done=>setTimeout(done,1000));return original(session,path,options,signal)}
   const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);window.viewerURLs=[];window.revokedURLs=[]
   URL.createObjectURL=blob=>{const url=create(blob);window.viewerURLs.push(url);return url}
   URL.revokeObjectURL=url=>{window.revokedURLs.push(url);return revoke(url)}
  })
  await clickOutput('report.md');await page.getByRole('button',{name:'关闭文件预览'}).click();await settled();await clickOutput('query.sql');await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor()
  await page.waitForFunction(()=>window.reads.some(file=>file.path.endsWith('.md')));assert.match(await page.locator('.dcb-file-viewer pre').innerText(),/select 1/)
  await page.getByRole('button',{name:'关闭文件预览'}).click();await settled()
  await clickOutput('frame.png');const image=page.locator('.dcb-file-viewer img');await image.evaluate(el=>el.decode());const src=await image.getAttribute('src')
  await page.getByRole('button',{name:'关闭文件预览'}).click();await settled();assert.equal(await page.evaluate(src=>window.revokedURLs.includes(src),src),true)
  await page.evaluate(()=>window.slowReads=1000);await clickOutput('query.sql');await page.locator('.dcb-file-viewer [data-content-status=loading]').waitFor()
  await page.evaluate(()=>window.fixture.session('b'));await settled();assert.equal(await page.locator('.dcb-file-viewer').count(),0);assert.ok(await page.evaluate(()=>window.abortedReads>0))
  await page.evaluate(()=>{window.fixture.session('a');window.slowReads=false});await settled();await clickOutput('frame.png');await page.locator('.dcb-file-viewer img').evaluate(el=>el.decode());const last=await page.locator('.dcb-file-viewer img').getAttribute('src')
  await page.evaluate(()=>window.cleanups.forEach(clean=>clean?.()));await settled();assert.equal(await page.locator('.dcb-file-viewer').count(),0);assert.equal(await page.evaluate(src=>window.revokedURLs.includes(src),last),true)
 })
 await check('the rounded glass reader resizes, reverses visible motion, restores focus and fits dark narrow screens',async()=>{
  await boot({companion:true});await clickOutput('report.md')
  const viewer=page.locator('.dcb-file-viewer'),handle=viewer.getByRole('separator'),before=await viewer.boundingBox(),grip=await handle.boundingBox()
  await page.mouse.move(grip.x+3,grip.y+200);await page.mouse.down();await page.mouse.move(grip.x-81,grip.y+200);await page.mouse.up()
  assert.equal(Math.round((await viewer.boundingBox()).width-before.width),84);assert.equal(await viewer.getAttribute('data-dragging'),null)
  await handle.focus();await page.keyboard.press('ArrowRight');assert.equal(Math.round((await viewer.boundingBox()).width-before.width),60)
  const closeFrame=await viewer.evaluate(el=>{el.querySelector('[aria-label="关闭文件预览"]').click();return new Promise(done=>requestAnimationFrame(()=>{const a=el.getAnimations().find(a=>a.id==='dcb-output-viewer');a.pause();a.currentTime=100;const s=getComputedStyle(el);done({opacity:+s.opacity,filter:s.filter,x:new DOMMatrix(s.transform).m41,inert:el.inert})}))})
  assert.ok(closeFrame.opacity>0&&closeFrame.opacity<1&&closeFrame.x>0&&closeFrame.filter!=='none');assert.equal(closeFrame.inert,true)
  await viewer.screenshot({path:resolve(output,'viewer-closing-middle.png'),animations:'allow'})
  await page.evaluate(()=>Array.from(document.querySelectorAll('.dcb-output')).find(el=>el.textContent.includes('report')).click())
  await settled();assert.equal(await viewer.count(),1);assert.equal(await viewer.getAttribute('data-state'),'open')
  await page.keyboard.press('Escape');await settled();assert.equal(await viewer.count(),0);assert.equal(await page.evaluate(()=>document.activeElement.matches('.dcb-output,.dcb-entry')),true)
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.setViewportSize({width:390,height:844})
  await clickOutput('report.md');const rect=await viewer.boundingBox();assert.ok(rect.x>=7&&rect.x+rect.width<=383&&rect.y>=7&&rect.y+rect.height<=837)
  const bodyRect=await viewer.locator('.dcb-file-viewer-body').boundingBox(),textRect=await viewer.getByRole('heading',{name:'Output preview'}).boundingBox();assert.ok(textRect.y-bodyRect.y<45,'document content starts at the reader padding, independent of global article margins')
  assert.equal(await viewer.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
  const colors=await viewer.evaluate(el=>({background:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color,blur:getComputedStyle(el.querySelector('.dcb-file-viewer-head')).backdropFilter}));assert.match(colors.background,/30, 33, 39/);assert.match(colors.text,/228, 232, 239/);assert.match(colors.blur,/blur/)
  await viewer.screenshot({path:resolve(output,'viewer-dark-narrow.png')})
  assert.equal(await viewer.evaluate(el=>el.classList.contains('dcb-file-viewer-moving')),false);assert.equal(await viewer.locator('.dcb-file-viewer-body').evaluate(el=>el.style.willChange),'')
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'关闭文件预览'}).click();await settled();await clickOutput('report.md');assert.equal(await viewer.evaluate(el=>el.getAnimations({subtree:true}).length),0)
  await page.getByRole('button',{name:'关闭文件预览'}).click();await settled();await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1280,height:1000})
 })
 await check('HTML covers honor read limits and failures, load only three latest covers, and keep all other outputs accessible',async()=>{
  await boot({companion:true})
  const many=['first.html','second.html','third.html','oversize.html','broken.html'].map(path=>({path:`outputs/${path}`}))
  await page.evaluate(files=>{window.reads=[];window.fixture.records([{event:{type:'deliverables/presented',seq:5,data:{files}}}])},many);await settled()
  assert.equal(await card.locator('.dcb-artifact').count(),3);assert.equal(await card.locator('.dcb-output').count(),5)
  assert.equal(await page.evaluate(()=>window.reads.some(file=>/first|second|oversize/.test(file.path))),false)
  assert.equal(await card.locator('.dcb-artifact[data-preview-state=unavailable]').count(),2)
  assert.equal(await card.locator('.dcb-artifact iframe').count(),1)
  await page.evaluate(files=>window.fixture.records([{event:{type:'deliverables/presented',seq:5,data:{files}}},{event:{type:'deliverables/presented',seq:6,data:{files:[{path:'outputs/first.html'}]}}}]),many);await settled()
  assert.equal(await card.locator('.dcb-artifact').filter({hasText:'first'}).count(),1,'a newly redelivered older file receives a cover according to its latest declaration')
  assert.equal(await card.locator('.dcb-artifact').filter({hasText:'third'}).count(),0)
  assert.equal(await card.locator('.dcb-output').count(),5,'promoting a newer cover never loses an output')
 })
 await check('covers fit narrow dark glass cards, preserve a visible reveal, honor reduced motion and release reads on unmount',async()=>{
  await boot({companion:true});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await patch({cardStyle:'glass'})
  await page.setViewportSize({width:390,height:844});await settled()
  const size=await card.locator('.dcb-artifact-cover').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('iframe').getBoundingClientRect();return{width:a.width,height:a.height,frameWidth:b.width,frameHeight:b.height,duration:getComputedStyle(el).animationDuration}})
  assert.ok(Math.abs(size.width-size.frameWidth)<1&&Math.abs(size.height-size.frameHeight)<1);assert.equal(size.duration,'0.28s')
  await card.screenshot({path:resolve(output,'artifact-dark-narrow.png')})
  const middle=await card.locator('.dcb-artifact-cover').evaluate(el=>{el.style.animation='none';void el.offsetWidth;el.style.removeProperty('animation');const a=el.getAnimations()[0];a.pause();a.currentTime=65;const style=getComputedStyle(el),matrix=new DOMMatrix(style.transform);return{opacity:Number(style.opacity),y:matrix.m42,scale:matrix.m11}})
  assert.ok(middle.opacity>0&&middle.opacity<1&&middle.y>0&&middle.scale<1,'the cover visibly fades, moves and scales during its reveal')
  await card.screenshot({path:resolve(output,'artifact-cover-reveal.png')});await card.locator('.dcb-artifact-cover').evaluate(el=>el.getAnimations().forEach(a=>a.finish()))
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await card.locator('.dcb-artifact-cover').evaluate(el=>getComputedStyle(el).animationName),'none')
  await page.evaluate(()=>{window.slowReads=true;window.fixture.records([{event:{type:'deliverables/presented',seq:10,data:{files:[{path:'outputs/slow.html'}]}}}])});await page.waitForFunction(()=>window.reads.some(file=>file.path.endsWith('slow.html')))
  await page.evaluate(()=>{window.fixtureHeader=null;window.fixture.refresh()});await settled()
  assert.ok(await page.evaluate(()=>window.abortedReads>0));assert.equal(await page.locator('.dcb-artifact iframe').count(),0)
 })
 await check('Artifact is explained without a switch and follows the task panel across toggles and reloads',async()=>{
  await page.setViewportSize({width:1280,height:1000});await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'})
  await boot()
  await page.evaluate(()=>window.fixture.settings(true))
  await selectSettingsCategory(page,'任务面板')
  assert.equal(await page.getByRole('switch',{name:'内置 Artifact 模式',exact:true}).count(),0)
  assert.equal(await page.getByRole('dialog').getByText('Artifact 预览随任务面板启用。',{exact:false}).isVisible(),true)
  const toggle=page.getByRole('switch',{name:'启用右上角任务面板',exact:true})
  assert.equal(await toggle.getAttribute('aria-checked'),'true')
  await toggle.click();await settled();assert.equal(await page.getByRole('button',{name:'会话进度与输出',exact:true}).count(),0)
  await toggle.click();await settled();assert.equal(await toggle.getAttribute('aria-checked'),'true')
  await page.getByRole('dialog').screenshot({path:resolve(output,'builtin-settings.png')})
  await page.evaluate(()=>window.fixture.settings(false));await settled()
  await clickOutput('Preview page.html');await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor()
  assert.equal(await page.getByRole('button',{name:'会话进度与输出',exact:true}).isVisible(),true)
  assert.equal(await page.evaluate(()=>typeof window.__dshOpenFilePreview),'undefined')
  await patch({artifactMode:false});await boot({preserveSettings:true})
  await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor()
  await clickOutput('report.md');await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor()
  assert.equal(await page.getByRole('heading',{name:'Output preview',exact:true}).isVisible(),true)
 })
 await check('built-in mode reads every supported format without companion hooks, and keeps source, refresh and native-open controls',async()=>{
  await boot({native:!!nativeHeader})
  await page.evaluate(()=>{window.__dshCanPreviewPath=()=>{throw Error('must not use companion')};window.__dshOpenFilePreview=()=>{throw Error('must not open companion')}})
  for(const {path}of files.slice(0,-1)){
   await clickOutput(path)
   const viewer=page.getByRole('region',{name:'文件预览',exact:true});await viewer.locator('[data-content-status=ready]').waitFor()
   assert.deepEqual(await page.evaluate(()=>window.reads.at(-1)),{session:'a',path})
   if(path.endsWith('.html')){
    await viewer.frameLocator('iframe').getByRole('heading',{name:'Artifact Preview'}).waitFor()
    await page.waitForFunction(()=>window.coverScripts>0)
    await viewer.getByRole('button',{name:'源码',exact:true}).click();assert.match(await viewer.locator('pre').innerText(),/<!doctype html>/)
    await viewer.getByRole('button',{name:'预览',exact:true}).click()
    const count=await page.evaluate(()=>window.reads.length)
    await viewer.getByRole('button',{name:'重新加载文件',exact:true}).click();await viewer.locator('[data-content-status=ready]').waitFor()
    assert.ok(await page.evaluate(()=>window.reads.length)>count)
    await settled();await viewer.screenshot({path:resolve(output,'builtin-html.png')})
   }
   if(path.endsWith('.md'))assert.equal(await viewer.getByRole('heading',{name:'Output preview'}).isVisible(),true)
   if(path.endsWith('.sql'))assert.match(await viewer.locator('pre').innerText(),/select 1/)
   if(path.endsWith('.json'))assert.match(await viewer.locator('pre').innerText(),/"preview": true/)
   if(path.endsWith('.csv'))assert.deepEqual(await viewer.locator('td').allTextContents(),['demo, one','1','two\nlines','2'])
   if(path.endsWith('.png'))await viewer.locator('img').evaluate(el=>el.decode())
   await viewer.getByRole('button',{name:'关闭文件预览'}).click();await settled()
  }
  assert.equal(await page.evaluate(()=>window.opened.length),0)
  await clickOutput('archive.zip');assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/archive.zip')
  await clickOutput('report.md');await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor()
  await page.locator('.dcb-file-viewer-head').getByRole('button',{name:'用 DSH 打开',exact:true}).click();await settled()
  assert.equal(await page.locator('.dcb-file-viewer').count(),0)
  assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/report.md')
 })
 await check('disabling the task panel cancels pending reads and its previews; enabling it restores the full card',async()=>{
  await boot()
  await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor()
  await page.evaluate(()=>window.slowReads=1500);await clickOutput('query.sql')
  await page.locator('.dcb-file-viewer [data-content-status=loading]').waitFor()
  await patch({enabled:false})
  assert.equal(await page.locator('.dcb-file-viewer').count(),0)
  assert.equal(await card.locator('.dcb-artifact').count(),0)
  assert.ok(await page.evaluate(()=>window.abortedReads>0))
  const count=await page.evaluate(()=>window.reads.length)
  await page.evaluate(()=>window.fixtureHeaderSpec.inject('a').openOutput('outputs/Preview page.html'));await settled()
  assert.equal(await page.evaluate(()=>window.reads.length),count)
  assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/Preview%20page.html')
  await patch({enabled:true});await clickOutput('report.md');await card.locator('.dcb-artifact[data-preview-state=ready]').waitFor();await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor()
 })
 await check('both load orders preserve third-party hooks and an already-open external preview, including when the card is disabled',async()=>{
  for(const late of[false,true]){
   await boot({companion:!late});if(late)await loadCompanion()
   await page.evaluate(()=>{
    let panel=document.getElementById('__dsh_artifact_preview__')
    if(!panel){panel=document.createElement('aside');panel.id='__dsh_artifact_preview__';panel.hidden=true;panel.__state={hide(){panel.dataset.open='0'}};document.body.append(panel)}
    if(panel.__state?.show)panel.__state.show();else panel.dataset.open='1'
    window.externalPreviewState=panel.__state
    window.fixtureHeaderSpec.inject('a').openOutput('outputs/report.md')
   })
   await page.locator('.dcb-file-viewer [data-content-status=ready]').waitFor();await settled()
   const untouched=()=>page.evaluate(()=>window.__dshOpenFilePreview===window.companionHooks.open&&window.__dshCanPreviewPath===window.companionHooks.can&&document.getElementById('__dsh_artifact_preview__').__state===window.externalPreviewState&&document.getElementById('__dsh_artifact_preview__').dataset.open==='1')
   assert.equal(await untouched(),true)
   await patch({enabled:false});assert.equal(await page.locator('.dcb-file-viewer').count(),0);assert.equal(await untouched(),true)
   await page.evaluate(()=>window.__dshOpenFilePreview('D:/synthetic/a/outputs/report.md'));await settled()
   assert.equal(await page.locator('.dcb-file-viewer').count(),0);assert.equal(await untouched(),true)
  }
 })
 await check('built-in mode fails back to DSH when the host portal or optional reader cannot render',async()=>{
  for(const options of [{noPortal:true},{viewerCrash:true}]){
   await boot(options)
   await clickOutput('report.md')
   assert.equal(await page.locator('.dcb-file-viewer').count(),0)
   assert.equal(await page.evaluate(()=>window.opened.at(-1)),'dsh-resource://file/session/a/outputs/report.md')
  }
 })
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,companion:process.env.DSH_ARTIFACT_CLIENT?'installed plugin':'hook contract fixture',output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
