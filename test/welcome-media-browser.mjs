import assert from 'node:assert/strict'
import {readFileSync,mkdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {createServer} from 'node:http'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {nativeLogo,installLogoFixture} from './native-logo.mjs'
import {selectSettingsCategory} from './settings-navigation.mjs'

const project=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(project,'..','..','outputs','dsh-ui-beautify'),'welcome-media')
mkdirSync(output,{recursive:true})
const gif=resolve(output,'synthetic-motion.gif'),video=resolve(output,'synthetic-short.mp4'),long=resolve(output,'synthetic-too-long.mp4'),webm=resolve(output,'synthetic-short.webm')
const ffmpeg=(...args)=>execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'pipe',windowsHide:true})
ffmpeg('-f','lavfi','-i','testsrc2=size=320x180:rate=12','-t','1.2','-loop','0',gif)
ffmpeg('-f','lavfi','-i','testsrc2=size=320x180:rate=12','-f','lavfi','-i','sine=frequency=440:sample_rate=44100','-t','1.2','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',video)
ffmpeg('-f','lavfi','-i','color=blue:size=32x32:rate=1','-t','16','-c:v','libx264','-preset','ultrafast',long)
ffmpeg('-f','lavfi','-i','testsrc2=size=160x90:rate=10','-t','1','-c:v','libvpx-vp9','-deadline','realtime','-cpu-used','8',webm)
const fixture=await build({entryPoints:[resolve(project,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const media=await build({stdin:{contents:"export * from './src/welcome-media.js'; export {createStartupMotion} from './src/startup-motion.js'",resolveDir:project},bundle:true,write:false,format:'iife',globalName:'WelcomeMedia'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(project,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(project,'client.js'),'utf8')],'/media.js':['text/javascript',media.outputFiles[0].text]}
const server=createServer((req,res)=>{const route=routes[req.url];if(!route){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':route[0]}).end(route[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url=`http://127.0.0.1:${server.address().port}`,key='dsh-ui-beautify:settings:v1',logo=nativeLogo()
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1200,height:950}}),page=await context.newPage(),errors=[],external=[]
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('http')&&!r.url().startsWith(url+'/'))external.push(r.url())})
await context.addInitScript(()=>{
  window.liveObjectURLs=new Set();window.trackedVideos=[]
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),element=document.createElement.bind(document)
  URL.createObjectURL=blob=>{const url=create(blob);window.liveObjectURLs.add(url);return url}
  URL.revokeObjectURL=url=>{window.liveObjectURLs.delete(url);return revoke(url)}
  document.createElement=(name,...args)=>{const node=element(name,...args);if(name==='video')window.trackedVideos.push(node);return node}
})
let passed=0
async function check(name,fn){await fn();passed++;console.log('PASS '+name)}
const section=page.locator('[data-dcb-settings-block=welcome]'),upload=page.locator('input[type=file][aria-label="上传开屏素材"]')
const urls=()=>page.evaluate(()=>window.liveObjectURLs.size)
async function mount(){
  await page.getByTestId('todo-panel').waitFor();await page.evaluate(installLogoFixture,logo)
  await page.evaluate(()=>{window.cleanups=[];window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:window.fixtureFishLogo,FISH_LOGO_PATH:window.nativeLogo?.path,FISH_LOGO_VIEWBOX:window.nativeLogo}:window.fixtureReact)}})
  await page.addScriptTag({url:url+'/client.js'});await page.addScriptTag({url:url+'/media.js'})
  await page.evaluate(()=>{const ctx={slots:{inject(_name,cb){cb()},register(spec,c){if(spec.name==='settings.section')window.fixtureSettings=c;else{window.fixtureHeader=c;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},sidebarRight:{openResource(){}},effect(cb){window.cleanups.push(cb())},inject(_names,cb){cb(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
}
async function settings(){await page.evaluate(()=>window.fixture.settings(true));await selectSettingsCategory(page,'开屏欢迎');await section.waitFor();await page.waitForTimeout(350)}
async function readStored(){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)}
async function nextBoot(patch={}){
  await page.evaluate(({key,patch})=>{const old=JSON.parse(localStorage.getItem(key)),next={welcomeEnabled:true,...patch},scheme=document.body.hasAttribute('data-ds-dark-theme')?'dark':'light';localStorage.setItem(key,JSON.stringify({...old,...next,welcomeThemes:old.welcomeThemes?{...old.welcomeThemes,[scheme]:{...old.welcomeThemes[scheme],...next}}:null}))},{key,patch})
  await page.reload();await mount()
}
async function waitPoster(){await page.waitForTimeout(260);await section.locator('[data-dcb-welcome-media] canvas').waitFor();await page.waitForFunction(()=>window.liveObjectURLs.size===0);assert.equal(await urls(),0)}
try{
  await page.goto(url);await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,welcomeMode:'text'})),key);await mount();await settings()
  await check('the default preview fills the native DSH silhouette with characters and needs no separate logo switch',async()=>{
    if(logo)assert.equal(await section.locator('[data-dcb-welcome-character-logo] mask path').getAttribute('d'),logo.path)
    assert.equal(await section.locator('[data-dcb-character-row]').count(),33)
    assert.equal(await section.getByRole('switch',{name:'显示 DSH Logo'}).count(),0)
    await section.screenshot({path:resolve(output,'logo-welcome-settings.png')})
  })
  await check('switching modes collapses fields smoothly and upload persists a binary GIF without embedding it in preferences',async()=>{
    const group=section.getByRole('radiogroup',{name:'开屏类型'}),textFields=section.locator('.dcb-welcome-collapse').first()
    const before=await textFields.evaluate(el=>el.getBoundingClientRect().height)
    await group.getByRole('radio',{name:'动图 / 短视频'}).click();await page.waitForTimeout(60)
    const middle=await textFields.evaluate(el=>({height:el.getBoundingClientRect().height,opacity:Number(getComputedStyle(el).opacity)}))
    assert.ok(middle.height>0&&middle.height<before&&middle.opacity>0&&middle.opacity<1)
    await upload.setInputFiles(gif);await section.locator('.dcb-welcome-file-name').getByText(/synthetic-motion.gif/).waitFor();await waitPoster()
    const saved=await readStored();assert.equal(saved.welcomeMode,'media');assert.ok(saved.welcomeMediaRevision);assert.ok(JSON.stringify(saved).length<6000);assert.equal(JSON.stringify(saved).includes('data:'),false)
    assert.equal(await section.locator('.dcb-welcome-collapse').first().evaluate(el=>el.getBoundingClientRect().height),0)
    assert.equal(await section.locator('select,input[type=checkbox],input[type=radio],input[type=range]').count(),0)
    assert.equal(await section.locator('.dcb-welcome-upload [data-cost=high]').count(),1)
  })
  await check('GIF preview decodes animated frames only while playing and releases its object URL at completion',async()=>{
    await section.getByRole('radiogroup',{name:'动图显示时长'}).getByRole('radio',{name:'2 秒'}).click();await page.waitForTimeout(300)
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await section.locator('[data-dcb-welcome-media] img').waitFor()
    const frame=async()=>createHash('sha256').update(await section.locator('[data-dcb-welcome-media] img').screenshot()).digest('hex')
    await page.waitForTimeout(140);const a=await frame();await page.waitForTimeout(300);assert.notEqual(await frame(),a)
    assert.equal(await urls(),1);await page.waitForTimeout(1800);await waitPoster();assert.equal(await section.locator('img,video').count(),0)
    await section.screenshot({path:resolve(output,'gif-settings-poster.png')})
  })
  await check('saved GIF plays on the next startup, preserves contain/cover, and fades into staged content on time',async()=>{
    await section.getByRole('radiogroup',{name:'画面适配'}).getByRole('radio',{name:'铺满裁切'}).click();await nextBoot()
    const img=page.locator('[data-dcb-welcome] [data-dcb-welcome-media] img');await img.waitFor();assert.equal(await img.evaluate(el=>getComputedStyle(el).objectFit),'contain')
    await page.setViewportSize({width:580,height:860})
    await page.waitForTimeout(350)
    assert.equal(await page.locator('[data-dcb-welcome-copy]').evaluate(el=>Math.round(el.getBoundingClientRect().width)),580)
    await page.screenshot({path:resolve(output,'gif-fullscreen-narrow.png')})
    await page.setViewportSize({width:1200,height:950})
    await page.waitForTimeout(180);await page.screenshot({path:resolve(output,'gif-fullscreen.png')})
    await page.locator('[data-dcb-welcome]').waitFor({state:'detached',timeout:3500});assert.equal(await urls(),0)
    assert.equal(await page.locator('[data-composer-seat]').isVisible(),true);await page.waitForTimeout(800)
    assert.equal(await page.evaluate(()=>window[Symbol.for('dsh-ui-beautify.startup-status.v2')].reason),'complete')
    await settings();await waitPoster()
  })
  await check('MP4 replacement remains muted and plays once in both preview and actual startup',async()=>{
    await upload.setInputFiles(video);await section.locator('.dcb-welcome-file-name').filter({hasText:/synthetic-short.mp4/}).waitFor();await waitPoster()
    await section.getByRole('button',{name:'播放欢迎预览'}).click();const movie=section.locator('video');await movie.waitFor()
    await page.waitForTimeout(180)
    assert.deepEqual(await movie.evaluate(el=>({muted:el.muted,controls:el.controls,loop:el.loop,inline:el.playsInline,playing:!el.paused})),{muted:true,controls:false,loop:false,inline:true,playing:true})
    await page.waitForTimeout(1450);await waitPoster()
    await nextBoot();await page.locator('[data-dcb-welcome] video').waitFor();await page.waitForTimeout(150)
    assert.equal(await page.locator('[data-dcb-welcome] video').evaluate(el=>el.muted&&!el.paused),true)
    await page.screenshot({path:resolve(output,'mp4-fullscreen.png')})
    await page.locator('[data-dcb-welcome]').waitFor({state:'detached',timeout:2800});assert.equal(await urls(),0)
    assert.equal(await page.evaluate(()=>window.trackedVideos.every(v=>v.paused&&!v.hasAttribute('src'))),true)
    await settings();await waitPoster()
  })
  await check('WebM is accepted, invalid, oversized and overlong uploads leave the last good media intact',async()=>{
    await upload.setInputFiles(webm);await section.locator('.dcb-welcome-file-name').filter({hasText:/synthetic-short.webm/}).waitFor();await waitPoster();const revision=(await readStored()).welcomeMediaRevision
    await upload.setInputFiles({name:'fake.gif',mimeType:'image/gif',buffer:Buffer.from('<svg onload="alert(1)"></svg>')})
    await section.getByRole('alert').filter({hasText:'支持 GIF'}).waitFor();assert.equal((await readStored()).welcomeMediaRevision,revision)
    await upload.setInputFiles(long);await section.getByRole('alert').filter({hasText:'15 秒以内'}).waitFor();assert.equal((await readStored()).welcomeMediaRevision,revision)
    const rejected=await page.evaluate(async()=>{try{await WelcomeMedia.inspectWelcomeMedia(new File([new Uint8Array(20*1024*1024+1)],'huge.gif',{type:'image/gif'}),document,window);return false}catch(e){return e.message.includes('20MB')}})
    assert.equal(rejected,true);await waitPoster();assert.equal(await urls(),0)
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await section.locator('video').waitFor();await page.waitForTimeout(1300);await waitPoster()
  })
  await check('preview close, keyboard skip, reduced motion and plugin disposal release all media decoders and URLs',async()=>{
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await page.waitForTimeout(120);assert.equal(await urls(),1)
    await selectSettingsCategory(page,'输入栏');assert.equal(await urls(),0)
    await selectSettingsCategory(page,'开屏欢迎');await waitPoster()
    await section.getByRole('button',{name:'播放欢迎预览'}).click();await page.waitForTimeout(120);assert.equal(await urls(),1)
    await page.evaluate(()=>window.fixture.settings(false));await page.waitForTimeout(80);assert.equal(await urls(),0)
    await nextBoot();await page.locator('[data-dcb-welcome] video').waitFor();await page.keyboard.press('Escape');assert.equal(await urls(),0);assert.equal(await page.locator('[data-dcb-welcome]').count(),0)
    await page.emulateMedia({reducedMotion:'reduce'});await nextBoot();assert.equal(await page.locator('[data-dcb-welcome]').count(),0);assert.equal(await urls(),0)
    await settings();await waitPoster();await section.getByRole('button',{name:'播放欢迎预览'}).click();await page.waitForTimeout(200);assert.equal(await urls(),0)
    await page.emulateMedia({reducedMotion:'no-preference'});await section.getByRole('button',{name:'播放欢迎预览'}).click();await page.waitForTimeout(120)
    await page.evaluate(()=>{window.fixture.settings(false);for(const cb of window.cleanups.reverse())cb?.()});await page.waitForTimeout(100);assert.equal(await urls(),0)
  })
  await check('missing or undecodable media falls back to native-logo welcome, and no asset fetch leaves the device',async()=>{
    await page.reload();await mount();await page.keyboard.press('Escape');await settings();await section.getByRole('button',{name:'移除素材'}).click()
    await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).welcomeMode==='characters',key)
    await nextBoot({welcomeMode:'media'});await page.locator(logo?'[data-dcb-welcome-character-logo]':'[data-dcb-welcome-art]').waitFor()
    if(logo)assert.equal(await page.locator('[data-dcb-welcome-character-logo] mask path').getAttribute('d'),logo.path)
    await page.keyboard.press('Escape');assert.equal(await urls(),0)
    const bytes=[...readFileSync(video).subarray(0,24)]
    await page.evaluate(async bytes=>{const store=WelcomeMedia.createWelcomeMediaStore(window);await store.save({blob:new Blob([Uint8Array.from(bytes)],{type:'video/mp4'}),type:'video/mp4',kind:'video',duration:1,revision:'broken'});store.dispose()},bytes)
    await nextBoot({welcomeMode:'media',welcomeMediaRevision:'broken'});await page.locator(logo?'[data-dcb-welcome-character-logo]':'[data-dcb-welcome-art]').waitFor({timeout:2500});assert.equal(await urls(),0);await page.keyboard.press('Escape')
    assert.deepEqual(external,[])
  })
  await check('a stalled asset read falls back on time, and a late result cannot revive a skipped or disposed startup',async()=>{
    const bytes=[...readFileSync(gif)]
    for(const action of ['timeout','keyboard','dispose']){
      await page.goto(url);await page.getByTestId('todo-panel').waitFor();await page.addScriptTag({url:url+'/media.js'})
      await page.evaluate(()=>{
        const store={load:()=>new Promise(resolve=>{window.resolveLateAsset=resolve})}
        window.delayedBoot=WelcomeMedia.createStartupMotion(document,window,{welcomeEnabled:true,welcomeMode:'media',welcomeDuration:1200},{mediaStore:store})
      })
      await page.waitForFunction(()=>typeof window.resolveLateAsset==='function')
      if(action==='timeout'){
        await page.locator('[data-dcb-welcome-art]').waitFor({timeout:1600})
        await page.locator('[data-dcb-welcome]').waitFor({state:'detached',timeout:2200})
      }else if(action==='keyboard')await page.keyboard.press('Escape')
      else await page.evaluate(()=>window.delayedBoot.dispose())
      await page.evaluate(bytes=>window.resolveLateAsset({blob:new Blob([Uint8Array.from(bytes)],{type:'image/gif'}),type:'image/gif',kind:'image',revision:'late'}),bytes)
      await page.waitForTimeout(120)
      assert.equal(await page.locator('[data-dcb-welcome]').count(),0);assert.equal(await urls(),0)
      await page.evaluate(()=>window.delayedBoot.dispose())
    }
  })
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,output}))
}finally{await browser.close();await new Promise(done=>server.close(done))}
