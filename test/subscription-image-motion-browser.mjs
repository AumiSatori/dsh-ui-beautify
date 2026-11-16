import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
import {homedir} from 'node:os'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativePluginDeclarations} from './native-plugin-module.mjs'

const root=fileURLToPath(new URL('..',import.meta.url))
const client=process.env.DSH_CODEX_CLIENT||resolve(homedir(),'.dsh/profiles/desktop/node_modules/dsh-codex-subscription/lib/client.js')
const viewer=readFileSync(resolve(dirname(client),'client.image-viewer.js'),'utf8')
const adapterSource=readFileSync(client,'utf8')
const legacy=nativePluginDeclarations(adapterSource,['ImageLightbox'],{dependencies:false})
const legacyCss=(adapterSource.match(/\.dcsLightbox[^{}\n]*\{[^}]*\}/g)||[]).join('\n')
const out=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../../outputs/image-preview-motion'),'subscription')
mkdirSync(out,{recursive:true})
const fixture=(await build({stdin:{resolveDir:root,contents:`
import * as React from 'react';import * as JSX from 'react/jsx-runtime';import * as ReactDOM from 'react-dom';import {createRoot} from 'react-dom/client';
import {createImagePreviewMotion,imagePreviewMotionCss} from './src/image-preview-motion.js';
const react=React,react_jsx_runtime=JSX;
const IconCloseOutline16=()=>React.createElement('span',null,'×');
${legacy}
window.fixtureModules={react:React,'react/jsx-runtime':JSX,'react-dom':ReactDOM};
window.__ModuleLoader__={load(spec){window.viewer=spec.factory(name=>{if(!fixtureModules[name])throw Error('Unexpected viewer dependency '+name);return fixtureModules[name]})}};
window.startFixture=()=>{
 document.head.append(Object.assign(document.createElement('style'),{textContent:viewer.SUBSCRIPTION_IMAGE_VIEWER_CSS+imagePreviewMotionCss+${JSON.stringify(legacyCss)}}));
 window.motion=createImagePreviewMotion(document,window);
 // Mirror the beautifier's shared presentation observer. No host session or
 // remote service is used; the actual installed viewer receives synthetic data.
 const presentation=new MutationObserver(records=>motion.observeMutations?.(records));presentation.observe(document.body,{childList:true,subtree:true});
 let request,revision=0,notes={};const listeners=new Set(),publish=()=>{for(const fn of listeners)fn()};
 const service={subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},getSnapshot:()=>request,getAnnotationsSnapshot:()=>notes,setAnnotations(id,value){notes={...notes,[id]:value}},cancelPending(){},invoke:async()=>{},close(){request=undefined;publish()}};
 const root=createRoot(document.querySelector('[data-slot="shell.overlay"]'));
 const renderViewer=()=>root.render(React.createElement(viewer.SubscriptionImageViewerOverlay,{service,t:key=>({imagePreview:'图片预览',imageClosePreview:'关闭',imageNext:'下一张',imagePrevious:'上一张'}[key]||key)}));renderViewer();
 window.fixture={open(images){ReactDOM.flushSync(()=>{request={revision:++revision,index:0,opener:document.querySelector('#thumbnail'),items:(images||[document.querySelector('#thumbnail img').src]).map((src,i)=>({id:'synthetic-'+i,src,name:'合成图片 '+i,actions:[]}))};publish()})},openLegacy(){ReactDOM.flushSync(()=>root.render(React.createElement(ImageLightbox,{src:document.querySelector('#thumbnail img').src,alt:'合成图片',labels:{dialog:'图片预览',close:'关闭'},onClose:()=>ReactDOM.flushSync(renderViewer)})))},close(){ReactDOM.flushSync(()=>service.close())},dispose(){motion.dispose();presentation.disconnect();root.unmount()}};
 document.querySelector('#thumbnail').onclick=()=>fixture.open();
};
`},bundle:true,write:false,format:'iife'})).outputFiles[0].text
const svg=color=>`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="${color}"/><circle cx="480" cy="270" r="140" fill="#d3e4df"/></svg>`
const data=color=>'data:image/svg+xml,'+encodeURIComponent(svg(color))
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[],results=[]
page.on('pageerror',error=>errors.push(error.message))
const dialog=page.locator('dialog.dcsiv-root'),image=dialog.locator('img.dcsiv-image')
const tick=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
const animations=()=>page.evaluate(()=>document.getAnimations().filter(a=>a.id.startsWith('dcb-image-preview')).map(a=>a.id))
const entry=()=>page.waitForFunction(()=>{const all=document.getAnimations().filter(a=>a.id.startsWith('dcb-image-preview'));if(!all.some(a=>a.id==='dcb-image-preview-enter'))return false;for(const a of all){a.pause();a.currentTime=84}return true},null,{timeout:2500})
const finish=()=>page.evaluate(()=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-image-preview'))a.finish()})
const close=async()=>{await page.evaluate(()=>fixture.close());await tick();assert.equal(await dialog.count(),0);await finish();await tick();assert.deepEqual(await animations(),[])}
async function check(name,run){await run();results.push(name);console.log('PASS '+name)}
async function middle(target=image){return target.evaluate(async node=>{for(const a of document.getAnimations())if(a.id.startsWith('dcb-image-preview')){a.pause();a.currentTime=84}await new Promise(done=>requestAnimationFrame(done));const s=getComputedStyle(node);return{opacity:+s.opacity,scale:+s.scale,translate:s.translate,filter:s.filter,willChange:s.willChange}})}
try{
 await page.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:30px;font:14px system-ui;background:#eef1f3}#thumbnail img{width:220px}button{cursor:pointer}</style><button id="thumbnail" aria-label="打开聊天图片"><img alt="合成聊天图片" src="${data('#4b6880')}"></button><section id="application"><div style="display:contents" data-slot="shell.overlay"></div></section>`)
 await page.addScriptTag({content:fixture});await page.addScriptTag({content:viewer});await page.evaluate(()=>startFixture())
 await page.locator('#thumbnail img').evaluate(node=>node.decode())
 await check('installed subscription viewer nested in the shell overlay has a real opening frame',async()=>{
  await page.getByRole('button',{name:'打开聊天图片'}).click();await dialog.waitFor();await entry()
  const sample=await middle();assert.ok(sample.opacity>0&&sample.opacity<1);assert.ok(sample.scale>.9&&sample.scale<1);assert.ok(parseFloat(sample.translate.split(' ')[1])>0);assert.match(sample.filter,/blur\((?!0px)/)
  await page.screenshot({path:resolve(out,'opening-midframe.png')});await finish();await tick()
  assert.equal(await image.evaluate(node=>getComputedStyle(node).scale),'none');assert.equal(await image.evaluate(node=>getComputedStyle(node).willChange),'auto')
  await close();assert.equal(await page.getByRole('button',{name:'打开聊天图片'}).evaluate(node=>node===document.activeElement),true)
 })
 await check('native zoom and dragging keep their own transform during entry',async()=>{
  await page.getByRole('button',{name:'打开聊天图片'}).click();await entry();await middle()
  const surface=dialog.locator('.dcsiv-surface'),before=await surface.evaluate(node=>node.style.transform)
  await dialog.locator('.dcsiv-stage').dispatchEvent('wheel',{deltaY:-180,clientX:550,clientY:300});await tick()
  const zoom=await surface.evaluate(node=>node.style.transform);assert.notEqual(zoom,before)
  await finish();await tick();assert.equal(await surface.evaluate(node=>node.style.transform),zoom)
  await dialog.locator('.dcsiv-stage').dblclick();await tick();assert.notEqual(await surface.evaluate(node=>node.style.transform),zoom)
  await page.getByRole('button',{name:'关闭',exact:true}).click();await tick();assert.equal(await dialog.count(),0);await finish();await tick()
 })
 await check('switching gallery images and rapid reopening release obsolete image effects',async()=>{
  await page.evaluate(images=>fixture.open(images),[data('#4b6880'),data('#80594b')]);await entry();await finish();await tick()
  await page.keyboard.press('ArrowRight');await entry();assert.ok((await image.getAttribute('src')).includes('80594b'))
  await page.keyboard.press('Escape');await tick();assert.equal(await dialog.count(),0);await finish();await tick();assert.deepEqual(await animations(),[])
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'打开聊天图片'}).click();await entry();await close()}
  assert.equal(await page.locator('[data-dcb-image-preview-moving]').count(),0)
 })
 await check('a delayed image gets its opening animation after loading instead of using it up on an empty frame',async()=>{
  let release
  const ready=new Promise(resolve=>{release=resolve})
  await page.route('https://motion.test/slow.svg',async route=>{await ready;await route.fulfill({contentType:'image/svg+xml',body:svg('#4b6880')})})
  await page.evaluate(()=>fixture.open(['https://motion.test/slow.svg']));await dialog.waitFor();await tick()
  assert.deepEqual(await animations(),[]);release();await entry();await middle();await finish();await close()
 })
 await check('the installed legacy subscription dialog also animates and retains its native close action',async()=>{
  await page.evaluate(()=>fixture.openLegacy());await entry();const legacyImage=page.locator('dialog.dcsLightbox > img'),sample=await middle(legacyImage)
  assert.ok(sample.scale>.9&&sample.scale<1,JSON.stringify(sample));await finish();await page.getByRole('button',{name:'关闭',exact:true}).click();await tick();assert.equal(await page.locator('dialog.dcsLightbox').count(),0);await finish();await tick();assert.deepEqual(await animations(),[])
 })
 await check('disabling motion during an image load cancels the pending entry',async()=>{
  let release;const ready=new Promise(resolve=>{release=resolve})
  await page.route('https://motion.test/cancelled.svg',async route=>{await ready;await route.fulfill({contentType:'image/svg+xml',body:svg('#80594b')})})
  await page.evaluate(()=>fixture.open(['https://motion.test/cancelled.svg']));await dialog.waitFor();await page.evaluate(()=>motion.sync(false));release()
  await image.evaluate(node=>node.decode());await tick();assert.deepEqual(await animations(),[]);await close();await page.evaluate(()=>motion.sync(true))
 })
 await check('native closing is immediate while a noninteractive top-layer copy animates out',async()=>{
  await page.getByRole('button',{name:'打开聊天图片'}).click();await entry();await finish();await tick()
  await page.keyboard.press('Escape');await tick();assert.equal(await dialog.count(),0)
  const ghost=page.locator('[data-dcb-image-preview-ghost]');assert.equal(await ghost.count(),1)
  const sample=await middle(ghost.locator('img.dcsiv-image'));assert.ok(sample.scale>.9&&sample.scale<1);assert.ok(sample.opacity>0&&sample.opacity<1);assert.match(sample.filter,/blur\((?!0px)/)
  assert.equal(await ghost.getAttribute('aria-hidden'),'true');assert.equal(await ghost.evaluate(node=>node.inert),true)
  assert.equal(await ghost.evaluate(node=>node.matches(':popover-open')),true);assert.equal(await ghost.evaluate(node=>getComputedStyle(node,'::backdrop').pointerEvents),'none')
  assert.equal(await ghost.locator('[role],[tabindex],[id]').count(),0);assert.equal(await page.getByRole('button',{name:'打开聊天图片'}).evaluate(node=>node===document.activeElement),true)
  await page.screenshot({path:resolve(out,'closing-midframe.png')});await finish();await tick();assert.equal(await ghost.count(),0)
 })
 await check('reopening during exit continues from the visible image and releases the outgoing copy',async()=>{
  await page.getByRole('button',{name:'打开聊天图片'}).click();await entry();await finish();await tick();await page.keyboard.press('Escape');await tick()
  const ghost=page.locator('[data-dcb-image-preview-ghost]'),before=await middle(ghost.locator('img.dcsiv-image'))
  // The inert visual copy must allow a real pointer click through to the chat.
  await page.getByRole('button',{name:'打开聊天图片'}).click()
  const first=await image.evaluate(node=>{const a=node.getAnimations().find(a=>a.id==='dcb-image-preview-enter');a.pause();a.currentTime=0;const s=getComputedStyle(node);return{scale:+s.scale,opacity:+s.opacity}})
  assert.ok(Math.abs(first.scale-before.scale)<.01);assert.ok(Math.abs(first.opacity-before.opacity)<.03);assert.equal(await ghost.count(),0)
  await finish();await close()
 })
 await check('quiet preferences, narrow dark layout and disposal preserve the viewer and clean up',async()=>{
  for(const preference of [{reducedMotion:'reduce'},{reducedMotion:'no-preference',forcedColors:'active'}]){await page.emulateMedia(preference);await page.getByRole('button',{name:'打开聊天图片'}).click();await dialog.waitFor();await tick();assert.deepEqual(await animations(),[]);await close()}
  await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:780});await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  await page.getByRole('button',{name:'打开聊天图片'}).click();await entry();await middle();await page.screenshot({path:resolve(out,'dark-narrow-midframe.png')});await page.evaluate(()=>motion.sync(false));assert.deepEqual(await animations(),[]);await close()
  await page.evaluate(()=>motion.sync(true));await page.getByRole('button',{name:'打开聊天图片'}).click();await entry();await page.evaluate(()=>fixture.dispose());assert.deepEqual(await animations(),[]);assert.equal(await page.locator('[data-dcb-image-preview-moving]').count(),0)
 })
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'checks.json'),JSON.stringify({passed:results.length,results,errors},null,2))
 console.log(JSON.stringify({passed:results.length,out}))
}finally{await browser.close()}
