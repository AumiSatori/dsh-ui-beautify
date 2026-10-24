import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(project,'..','.scratch','claude-beautify','particle-images')
mkdirSync(output,{recursive:true})
const fixture=await build({stdin:{contents:`import './test/fixture.jsx';import {inspectParticleImage} from './src/context-particle-image.js';import {sampleParticleArtwork} from './src/context-particle-renderer.js';window.inspectParticleImage=inspectParticleImage;window.sampleParticleArtwork=sampleParticleArtwork;`,resolveDir:project},bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',logo=nativeLogo()||{path:'M1 6Q7 1 13 6L22 1V9L17 8Q13 18 5 14Q1 11 1 6Z',width:24,height:18}
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1400,height:1000}}),page=await context.newPage(),errors=[],external=[]
page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(url))external.push(request.url())})
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
const scene=()=>page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0])
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function mount(){
 await page.goto(url);await page.getByTestId('todo-panel').waitFor();await page.evaluate(installLogoFixture,logo)
 await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
 await page.addScriptTag({url:url+'/client.js'})
 await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:window.fixtureBinding},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
 await page.addStyleTag({content:'.settings-dialog{inset:24px 10%;padding:24px;overflow:auto}'})
}
async function settings(){await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'粒子背景')}
async function close(){await page.evaluate(()=>window.fixture.settings(false));await page.waitForTimeout(100)}
async function settle(shape){await page.waitForFunction(shape=>{const s=window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().scenes[0];return s?.shape===shape&&s.ready&&s.progress===1&&s.visible},shape)}
async function upload(buffer,name='图片.png',mimeType='image/png'){
 await page.getByLabel('粒子图片文件',{exact:true}).setInputFiles({name,mimeType,buffer})
 await expect(page.getByRole('button',{name:'导入图片',exact:true})).toBeEnabled()
}
async function synthetic(type){return Buffer.from(await page.evaluate(type=>{const c=document.createElement('canvas');c.width=180;c.height=240;const x=c.getContext('2d');if(type==='image/jpeg'){x.fillStyle='white';x.fillRect(0,0,180,240)}x.fillStyle='#4678ce';x.beginPath();x.ellipse(90,120,65,95,0,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.fillRect(65,80,50,80);return c.toDataURL(type).split(',')[1]},type),'base64')}
try{
 await page.addInitScript(key=>localStorage.setItem(key,localStorage.getItem(key)||JSON.stringify({welcomeEnabled:false,particleProgressMode:'manual',particleManualProgress:100,particleCount:9600})),key)
 await mount();await settle('logo')
 await check('a fully gathered logo stays a moving point cloud',async()=>{
  const before=await scene();await page.waitForTimeout(650);const after=await scene()
  assert.ok(after.frames>before.frames+2&&after.frames-before.frames<=12);assert.equal(after.progress,1)
  await page.screenshot({path:resolve(output,'logo-formed-particles.png')})
 })
 await settings()
 const png=readFileSync(resolve(project,'assets/context-whale-cutout.png'))
 await check('PNG import selects a separate image shape and stores bounded local pixels without changing SVG selection data',async()=>{
  await expect(page.getByRole('radio',{name:'自定义图片',exact:true})).toBeDisabled()
  await upload(png,'角色.png')
  await expect(page.getByRole('radio',{name:'自定义图片',exact:true})).toHaveAttribute('aria-checked','true')
  const prefs=await saved();assert.ok(prefs.particleImageRevision);assert.equal(prefs.particleImageName,'角色.png');assert.ok(!JSON.stringify(prefs).includes('data:image'))
  const asset=await page.evaluate(revision=>new Promise((resolve,reject)=>{const open=indexedDB.open('dsh-ui-context-particles',1);open.onsuccess=()=>{const db=open.result,tx=db.transaction('artwork'),read=tx.objectStore('artwork').get('image:'+revision);read.onsuccess=()=>resolve({width:read.result.width,height:read.result.height,type:read.result.blob.type});tx.oncomplete=()=>db.close()};open.onerror=reject}),prefs.particleImageRevision)
  assert.ok(asset.width<=768&&asset.height<=768);assert.equal(asset.type,'image/png')
  await close();await settle('image');await page.screenshot({path:resolve(output,'image-formed-particles.png')})
  await page.reload();await mount();await settle('image');assert.equal((await saved()).particleImageRevision,prefs.particleImageRevision)
 })
 await check('image guidance stays visible after upload and the full-form preview updates only on edits and releases when closed',async()=>{
  await settings()
  await expect(page.getByText('推荐透明背景、单一主体、轮廓清晰、明暗对比强的图片。彩色底图、低对比渐变、复杂背景和细小文字更容易丢失细节。',{exact:true})).toBeVisible()
  const preview=page.getByRole('img',{name:'自定义图片完整成形预览',exact:true});await preview.locator('canvas').waitFor()
  await page.evaluate(()=>{window.previewDraws=0;window.previewCanvas=document.querySelector('.dcb-particle-image-preview canvas');const draw=WebGL2RenderingContext.prototype.drawArrays;window.originalPreviewDraw=draw;WebGL2RenderingContext.prototype.drawArrays=function(...args){if(this.canvas===window.previewCanvas)window.previewDraws++;return draw.apply(this,args)}})
  try{
   const progress=(await saved()).particleManualProgress,field=page.getByRole('spinbutton',{name:'粒子数',exact:true})
   await field.fill('16000');await field.press('Enter');await page.waitForFunction(()=>window.previewDraws>0)
   assert.equal((await saved()).particleManualProgress,progress)
   const draws=await page.evaluate(()=>window.previewDraws);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.previewDraws),draws,'a settled preview has no continuous drawing loop')
   await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.waitForFunction(draws=>window.previewDraws>draws,draws)
   assert.equal(await preview.locator('canvas').evaluate(el=>el===window.previewCanvas),true)
   await preview.screenshot({path:resolve(output,'image-preview-dark.png')})
   await field.fill('9600');await field.press('Enter');await page.evaluate(()=>document.body.removeAttribute('data-ds-dark-theme'))
  }finally{await page.evaluate(()=>WebGL2RenderingContext.prototype.drawArrays=window.originalPreviewDraw)}
  await close();await expect(page.locator('.dcb-particle-image-preview canvas')).toHaveCount(0)
  assert.equal(await page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.context-particles.v1')].snapshot().previewCount),0)
 })
 await check('imported pictures favor fine detail wherever it appears instead of a fixed upper-face rectangle',async()=>{
  const result=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=180;c.height=240;const x=c.getContext('2d');x.fillStyle='#7d9cda';x.fillRect(0,0,180,240)
   x.fillStyle='#fff0d9';x.fillRect(54,149,66,56);x.fillStyle='#24223b';x.fillRect(60,160,18,5);x.fillRect(96,160,18,5);x.fillRect(81,190,14,3)
   const model=await window.sampleParticleArtwork(c.toDataURL()),points=model.points.filter(p=>!p.ambient).slice(0,1200),count=(y1,y2)=>points.filter(p=>p.x>.3&&p.x<.67&&p.y>y1&&p.y<y2).length
   return{upper:count(.1,.33),lower:count(.62,.86),lowerFocus:points.filter(p=>p.y>.62&&p.focus>.2).length}
  })
  assert.ok(result.lower>result.upper*2,JSON.stringify(result));assert.ok(result.lowerFocus>30,'local detail also receives steadier motion')
 })
 await check('JPEG and WebP import by actual bytes, while blank, corrupt, oversized and disguised SVG keep the previous image',async()=>{
  await settings()
  for(const [type,name]of[['image/jpeg','主体.jpg'],['image/webp','主体.webp']]){await upload(await synthetic(type),name,'application/octet-stream');assert.equal((await saved()).particleImageName,name)}
  const cutout=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,160,160);x.fillStyle='#4678ce';x.beginPath();x.arc(80,80,60,0,Math.PI*2);x.fill();x.fillStyle='white';x.fillRect(65,65,30,30)
   const model=await window.sampleParticleArtwork(c.toDataURL()),ctx=model.detail.getContext('2d'),alpha=(x,y)=>ctx.getImageData(x,y,1,1).data[3]
   return{edge:alpha(0,0),interior:alpha(Math.floor(model.detail.width/2),Math.floor(model.detail.height/2)),width:model.detail.width,height:model.detail.height}
  })
  assert.equal(cutout.edge,0);assert.equal(cutout.interior,255);assert.ok(cutout.width<=576&&cutout.height<=576)
  const previous=(await saved()).particleImageRevision
  const blank=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;return c.toDataURL().split(',')[1]}),'base64')
  for(const buffer of[Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),Buffer.from('broken png'),blank,Buffer.alloc(10*1024*1024+1)]){
   await upload(buffer,'伪装.png');await expect(page.getByRole('alert')).toBeVisible();assert.equal((await saved()).particleImageRevision,previous)
  }
  const huge=Buffer.from(png);huge.writeUInt32BE(10000,16);await upload(huge,'太大.png');await expect(page.getByRole('alert')).toContainText('4096');assert.equal((await saved()).particleImageRevision,previous)
  await close();await settle('image');await page.reload();await mount();await settle('image')
 })
 await check('leaving settings during decoding preserves the selected image on refresh and keeps storage bounded',async()=>{
  await settings();const previous=(await saved()).particleImageRevision
  await page.evaluate(()=>{const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){HTMLImageElement.prototype.decode=decode;window.decodeHeld=true;return new Promise(resolve=>{window.finishImageDecode=()=>decode.call(this).then(resolve)})}})
  await page.getByLabel('粒子图片文件',{exact:true}).setInputFiles({name:'未应用.png',mimeType:'image/png',buffer:png})
  await page.waitForFunction(()=>window.decodeHeld);await close();await page.evaluate(()=>window.finishImageDecode());await page.waitForTimeout(400)
  assert.equal((await saved()).particleImageRevision,previous);await page.reload();await mount();await settle('image')
  const count=await page.evaluate(()=>new Promise(resolve=>{const open=indexedDB.open('dsh-ui-context-particles',1);open.onsuccess=()=>{const db=open.result,tx=db.transaction('artwork'),read=tx.objectStore('artwork').getAllKeys();read.onsuccess=()=>resolve(read.result.filter(key=>String(key).startsWith('image:')).length);tx.oncomplete=()=>db.close()}}))
  assert.ok(count<=2)
 })
 await check('image choices work on narrow dark settings, removal restores logo and pause/reduced motion still stop drawing',async()=>{
  await settings();await page.setViewportSize({width:430,height:932});await page.addStyleTag({content:'.settings-dialog{inset:12px;padding:14px}'})
  await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''))
  assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false)
  await page.getByRole('button',{name:'导入图片',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,'image-settings-narrow-dark.png')})
  const paused=(await scene()).frames;await page.waitForTimeout(250);assert.equal((await scene()).frames,paused)
  await page.getByRole('button',{name:'移除自定义图片',exact:true}).click();await expect(page.getByRole('radio',{name:'自定义图片',exact:true})).toBeDisabled();assert.equal((await saved()).particleImageRevision,'')
  await close();await settle('logo');await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(180)
  const still=(await scene()).frames;await page.waitForTimeout(250);assert.equal((await scene()).frames,still)
  await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()});assert.equal(await page.locator('.dcb-particle-layer').count(),0)
  assert.deepEqual(errors,[]);assert.deepEqual(external,[])
 })
 console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
