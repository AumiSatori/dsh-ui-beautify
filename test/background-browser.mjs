import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','.scratch','ui-beautify-qa'),'background')
mkdirSync(output,{recursive:true})
const video=resolve(output,'local-background.mp4')
execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=320x180:rate=12','-t','2','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:'pipe',windowsHide:true})
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-claude-beautify:settings:v1',logo=nativeLogo()
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],external=[]
await context.addInitScript(()=>{
  window.liveBackgroundURLs=new Set()
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL)
  URL.createObjectURL=blob=>{const value=create(blob);window.liveBackgroundURLs.add(value);return value}
  URL.revokeObjectURL=value=>{window.liveBackgroundURLs.delete(value);return revoke(value)}
})
page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().startsWith('http')&&!request.url().startsWith(url+'/'))external.push(request.url())})
let passed=0
const section=page.locator('[data-dcb-settings-block=background]'),upload=page.getByLabel('导入全图背景',{exact:true}),wallpaper=page.locator('[data-dcb-background-layer]')
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
async function mount(){
  await page.getByTestId('todo-panel').waitFor();await page.evaluate(installLogoFixture,logo)
  await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await page.addScriptTag({url:url+'/client.js'})
  await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,c){if(spec.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
  await page.addStyleTag({content:'.settings-dialog{inset:40px 14%;padding:24px}.dcb-settings{font-size:14px}'})
}
const settings=async()=>{await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'全图背景')}
const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
const ready=()=>page.waitForFunction(()=>document.body.hasAttribute('data-dcb-background')&&document.querySelector('[data-dcb-background-layer]')?.hidden===false)
const picture=async(name,color)=>({name,mimeType:'image/png',buffer:Buffer.from(await page.evaluate(color=>{const canvas=document.createElement('canvas');canvas.width=800;canvas.height=450;const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,800,450);gradient.addColorStop(0,color);gradient.addColorStop(1,'#efb5c8');ctx.fillStyle=gradient;ctx.fillRect(0,0,800,450);return canvas.toDataURL('image/png').split(',')[1]},color),'base64')})
try{
  await page.goto(url);await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,turnGlass:false})),key);await mount();await settings()
  await check('new category starts off and leaves host fills unchanged before import',async()=>{
    assert.equal(await wallpaper.count(),0);assert.equal(await section.getByRole('switch',{name:'启用全图背景'}).getAttribute('aria-checked'),'false')
    assert.equal(await page.getByRole('tab').count(),7);assert.equal(await page.locator('.nav').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(244, 243, 239)')
  })
  const first=await picture('first-local.png','#4d91e8'),second=await picture('second-local.png','#739461')
  await check('local image covers layout paths without intercepting clicks or clearing dialog surfaces',async()=>{
    await upload.setInputFiles(first);await ready()
    assert.equal((await saved()).backgroundName,'first-local.png');assert.equal(await wallpaper.evaluate(node=>getComputedStyle(node).pointerEvents),'none')
    assert.equal(await page.locator('.nav').evaluate(node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)')
    assert.equal(await page.getByRole('dialog').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(255, 255, 255)')
    await page.getByRole('dialog').screenshot({path:resolve(output,'background-settings-light.png')})
    await page.evaluate(()=>window.fixture.settings(false));await page.screenshot({path:resolve(output,'background-window-light.png')})
    await page.getByRole('button',{name:'打开设置',exact:true}).click();await selectSettingsCategory(page,'全图背景')
  })
  await check('appearance changes update one image without allocating another file URL',async()=>{
    const source=await wallpaper.locator('img').getAttribute('src')
    await section.getByRole('slider',{name:'背景可见度'}).focus();await page.keyboard.press('End')
    await section.getByRole('slider',{name:'背景模糊'}).focus();await page.keyboard.press('End')
    await section.getByRole('button',{name:'完整显示',exact:true}).click();await section.getByRole('button',{name:'靠上',exact:true}).click()
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-dcb-background-layer] img')).filter==='blur(20px)')
    assert.equal(await wallpaper.locator('img').getAttribute('src'),source);assert.equal(await page.evaluate(()=>window.liveBackgroundURLs.size),1)
    const style=await wallpaper.locator('img').evaluate(node=>{const css=getComputedStyle(node);return[css.opacity,css.objectFit,css.objectPosition]})
    assert.deepEqual(style,['1','contain','50% 0%']);assert.equal((await saved()).backgroundOpacity,100)
    await section.getByRole('slider',{name:'背景模糊'}).focus();await page.keyboard.press('Home')
    await section.getByRole('slider',{name:'背景可见度'}).focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight')
  })
  await check('streaming task updates and scrolling do not rescan wallpaper layout paths',async()=>{
    await page.waitForTimeout(100)
    await page.evaluate(()=>{window.wallpaperScans=0;window.nativeQueryAll=document.querySelectorAll;document.querySelectorAll=function(selector){if(selector.includes('.frame > .nav'))window.wallpaperScans++;return window.nativeQueryAll.call(this,selector)}})
    try{
      for(let index=0;index<12;index++){await page.evaluate(index=>{window.fixture.update([{content:'流式更新 '+index,status:'in_progress'}]);document.dispatchEvent(new Event('scroll'))},index);await page.waitForTimeout(20)}
      assert.equal(await page.evaluate(()=>window.wallpaperScans),0);assert.equal(await page.evaluate(()=>window.liveBackgroundURLs.size),1)
    }finally{await page.evaluate(()=>{document.querySelectorAll=window.nativeQueryAll})}
  })
  await check('invalid files preserve the selected background and valid replacement supports undo',async()=>{
    const revision=(await saved()).backgroundRevision
    await upload.setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg/>')});await section.getByRole('alert').waitFor();assert.equal((await saved()).backgroundRevision,revision)
    await page.evaluate(()=>{window.nativeBackgroundPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='wallpaper')throw new DOMException('storage full','QuotaExceededError');return window.nativeBackgroundPut.apply(this,args)}})
    try{await upload.setInputFiles(second);await section.getByRole('alert').filter({hasText:'无法保存背景'}).waitFor();assert.equal((await saved()).backgroundRevision,revision);await ready()}
    finally{await page.evaluate(()=>{IDBObjectStore.prototype.put=window.nativeBackgroundPut})}
    await upload.setInputFiles(second);await page.waitForFunction(()=>document.querySelector('.dcb-background-file')?.textContent==='second-local.png');await ready()
    await section.getByRole('button',{name:'恢复上一张'}).click();await page.waitForFunction(()=>document.querySelector('.dcb-background-file')?.textContent==='first-local.png');await ready()
    assert.equal((await saved()).backgroundRevision,revision)
  })
  await check('reload restores the local asset and disabling retains it without keeping a decoder',async()=>{
    await page.reload();await mount();await ready();await settings();assert.equal((await saved()).backgroundName,'first-local.png')
    assert.equal(await section.getByRole('button',{name:'恢复上一张'}).isEnabled(),true)
    await section.getByRole('switch',{name:'启用全图背景'}).click();await wallpaper.waitFor({state:'detached'})
    assert.equal(await page.evaluate(()=>window.liveBackgroundURLs.size),0);assert.ok((await saved()).backgroundRevision)
    assert.equal(await page.locator('.nav').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(244, 243, 239)')
    await page.reload();await mount();await settings();assert.equal(await section.getByRole('button',{name:'恢复上一张'}).isEnabled(),true)
    await section.getByRole('switch',{name:'启用全图背景'}).click();await ready()
    assert.equal(JSON.stringify(await saved()).includes('base64'),false)
  })
  await check('video loops muted, pauses in background and respects reduced motion and forced colors',async()=>{
    await upload.setInputFiles(video);await ready();await wallpaper.locator('video').waitFor()
    await page.waitForFunction(()=>{const video=document.querySelector('[data-dcb-background-layer] video');return video&&!video.paused&&video.currentTime>.05})
    assert.deepEqual(await wallpaper.locator('video').evaluate(node=>[node.loop,node.muted,node.playsInline]),[true,true,true])
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await wallpaper.locator('video').evaluate(node=>node.paused),true)
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!document.querySelector('[data-dcb-background-layer] video').paused)
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-dcb-background-layer] video').paused)
    await page.emulateMedia({forcedColors:'active'});await page.waitForFunction(()=>!document.body.hasAttribute('data-dcb-background'))
    await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'none'});await ready()
    assert.equal(await page.getByRole('dialog').locator('video').count(),0,'settings preview never adds a second video decoder')
  })
  await check('dark/narrow settings fit and clearing restores host fills and releases file URLs',async()=>{
    await page.evaluate(()=>document.body.setAttribute('data-ds-dark-theme',''));await page.setViewportSize({width:700,height:1000});await page.addStyleTag({content:'.settings-dialog{inset:16px 8px;padding:16px}'})
    assert.equal(await page.getByRole('dialog').evaluate(node=>node.scrollWidth<=node.clientWidth+1),true)
    await page.getByRole('dialog').screenshot({path:resolve(output,'background-settings-dark-narrow.png')})
    await section.getByRole('button',{name:'清除背景',exact:true}).click();await wallpaper.waitFor({state:'detached'})
    assert.equal(await page.evaluate(()=>window.liveBackgroundURLs.size),0);assert.equal((await saved()).backgroundRevision,'');assert.equal(await page.locator('[data-dcb-background-surface]').count(),0)
    await page.evaluate(()=>{for(const cleanup of window.cleanups.reverse())cleanup?.()});assert.equal(await page.locator('[data-dcb-background-layer]').count(),0)
  })
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
