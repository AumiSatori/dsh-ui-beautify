import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {build} from 'esbuild'
import {chromium,expect} from '@playwright/test'
import {selectSettingsCategory} from './settings-navigation.mjs'

const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../.scratch/claude-beautify'),'theme-media')
mkdirSync(output,{recursive:true})
const day=resolve(output,'synthetic-day.gif'),night=resolve(output,'synthetic-night.gif'),movie=resolve(output,'synthetic-night.mp4')
const ffmpeg=(...args)=>execFileSync(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'pipe',windowsHide:true})
ffmpeg('-f','lavfi','-i','testsrc2=size=96x64:rate=6','-t','1','-loop','0',day)
ffmpeg('-f','lavfi','-i','testsrc2=size=128x96:rate=6','-t','1','-vf','hue=h=120','-loop','0',night)
ffmpeg('-f','lavfi','-i','testsrc2=size=160x96:rate=6','-t','1','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',movie)
const fixture=await build({entryPoints:[resolve(root,'test/fixture.jsx')],bundle:true,write:false,format:'iife'})
const routes={'/':['text/html; charset=utf-8',readFileSync(resolve(root,'test/fixture.html'),'utf8')],'/fixture.js':['text/javascript',fixture.outputFiles[0].text],'/client.js':['text/javascript',readFileSync(resolve(root,'client.js'),'utf8')]}
const server=createServer((req,res)=>{const row=routes[req.url];if(!row)return res.writeHead(404).end();res.writeHead(200,{'content-type':row[0]}).end(row[1])})
await new Promise(done=>server.listen(0,'127.0.0.1',done))
const url='http://127.0.0.1:'+server.address().port,key='dsh-ui-beautify:settings:v1',browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'})
const context=await browser.newContext({viewport:{width:1280,height:950}}),page=await context.newPage(),errors=[],checks=[]
await context.addInitScript(()=>{
  window.mediaURLs=new Map();window.mediaVideos=[]
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),element=document.createElement.bind(document)
  URL.createObjectURL=blob=>{const url=create(blob);window.mediaURLs.set(url,blob);return url}
  URL.revokeObjectURL=url=>{window.mediaURLs.delete(url);return revoke(url)}
  document.createElement=(name,...args)=>{const node=element(name,...args);if(name==='video')window.mediaVideos.push(node);return node}
})
const saved=(target=page)=>target.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)
const welcome=(target=page)=>target.locator('[data-dcb-settings-block=welcome]'),background=(target=page)=>target.locator('[data-dcb-settings-block=background]')
async function mount(target=page){
  target.on('pageerror',error=>errors.push(error.message));await target.goto(url);await target.getByTestId('todo-panel').waitFor()
  await target.evaluate(key=>{
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,width:350,messageMotion:false}))
    window.cleanups=[];window.themeListeners=new Set()
    const setTheme=scheme=>{localStorage.setItem('fixture:media-theme',scheme);document.body.toggleAttribute('data-ds-dark-theme',scheme==='dark');for(const fn of window.themeListeners)fn(window.hostTheme.getTheme())}
    window.hostTheme={getTheme:()=>({active:{colorScheme:document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'}}),setTheme}
    setTheme(localStorage.getItem('fixture:media-theme')||'light')
    window.__ModuleLoader__={load:spec=>window.plugin=spec.factory(name=>name==='@deepseek-ai/dsh-client-ui-primitives'?{FishLogo:()=>null}:window.fixtureReact)}
  },key)
  await target.addScriptTag({url:url+'/client.js'})
  await target.evaluate(()=>{const ctx={theme:window.hostTheme,slots:{inject(_name,fn){fn()},register(spec,component){if(spec.name==='settings.section')window.fixtureSettings=component;else{window.fixtureHeader=component;window.fixtureHeaderSpec=spec}return()=>{}}},sessions:{binding:id=>window.fixtureBinding(id)},effect:fn=>window.cleanups.push(fn()),on(name,fn){if(name==='theme/change'){window.themeListeners.add(fn);window.cleanups.push(()=>window.themeListeners.delete(fn))}},inject(_names,fn){fn(ctx)}};window.plugin.apply(ctx);window.fixture.refresh()})
}
async function settings(category,target=page){await target.evaluate(()=>{document.querySelector('[data-dcb-welcome-skip]')?.click();window.fixture.settings(true)});await selectSettingsCategory(target,category)}
async function theme(scheme,target=page){await target.evaluate(scheme=>window.hostTheme.setTheme(scheme),scheme);await expect(target.locator('.dcb-theme-toggle')).toHaveAttribute('data-scheme',scheme);await target.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))}
async function uploadWelcome(file,target=page){await settings('开屏欢迎',target);await welcome(target).getByRole('radio',{name:'动图 / 短视频',exact:true}).click();await welcome(target).getByLabel('上传开屏素材',{exact:true}).setInputFiles(file);await welcome(target).locator('.dcb-welcome-upload').getByText(file.split(/[\\/]/).at(-1),{exact:false}).waitFor();await welcome(target).locator('[data-dcb-welcome-media] canvas').waitFor()}
async function enabled(section,label,wanted){const button=section.getByRole('switch',{name:label,exact:true});if(await button.getAttribute('aria-checked')!==String(wanted))await button.click()}
async function range(label,value){await background().getByRole('slider',{name:label,exact:true}).evaluate((el,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,String(value));el.dispatchEvent(new Event('input',{bubbles:true}))},value)}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
let dayId,nightId,dayBg,nightBg
try{
  await mount()
  await check('opening settings, GIF files and enabled states are independently remembered for day and night',async()=>{
    await uploadWelcome(day);await welcome().getByRole('radio',{name:'铺满裁切',exact:true}).click();await welcome().getByRole('radio',{name:'2 秒',exact:true}).click();await enabled(welcome(),'开屏欢迎动效',true)
    dayId=(await saved()).welcomeThemes.light.welcomeMediaRevision
    await theme('dark');await expect(welcome().getByRole('switch',{name:'开屏欢迎动效',exact:true})).toHaveAttribute('aria-checked','false')
    await expect(welcome().getByRole('radio',{name:'默认 · Logo 字符填充',exact:true})).toHaveAttribute('aria-checked','true')
    await uploadWelcome(night);await welcome().getByRole('radio',{name:'5 秒',exact:true}).click();await enabled(welcome(),'开屏欢迎动效',true)
    nightId=(await saved()).welcomeThemes.dark.welcomeMediaRevision;assert.notEqual(dayId,nightId)
    for(const scheme of ['light','dark','light']){
      await theme(scheme);await welcome().locator('.dcb-welcome-upload').getByText(scheme==='light'?'synthetic-day.gif':'synthetic-night.gif',{exact:false}).waitFor()
      await expect(welcome().getByRole('radio',{name:scheme==='light'?'铺满裁切':'完整显示',exact:true})).toHaveAttribute('aria-checked','true')
      await expect(welcome().getByRole('radio',{name:scheme==='light'?'2 秒':'5 秒',exact:true})).toHaveAttribute('aria-checked','true')
    }
    const value=await saved();assert.equal(value.width,350);assert.equal(value.messageMotion,false);assert.equal(JSON.stringify(value).includes('data:'),false)
  })
  await check('actual startup after reload resolves the current theme file instead of the most recently imported file',async()=>{
    for(const [scheme,file,fit]of [['light',day,'cover'],['dark',night,'contain']]){
      await theme(scheme);await mount();const image=page.locator('[data-dcb-welcome] img');await image.waitFor()
      const bytes=await image.evaluate(async el=>[...new Uint8Array(await window.mediaURLs.get(el.src).arrayBuffer())])
      assert.equal(createHash('sha256').update(Buffer.from(bytes)).digest('hex'),createHash('sha256').update(readFileSync(file)).digest('hex'))
      assert.equal(await image.evaluate(el=>getComputedStyle(el).objectFit),'contain');await page.evaluate(()=>document.documentElement.setAttribute('data-fullscreen','true'));await expect.poll(()=>image.evaluate(el=>getComputedStyle(el).objectFit)).toBe(fit);await page.evaluate(()=>document.documentElement.removeAttribute('data-fullscreen'))
      await page.evaluate(()=>document.querySelector('[data-dcb-welcome-skip]').click())
      await settings('开屏欢迎');await welcome().locator('[data-dcb-welcome-media] canvas').waitFor()
    }
  })
  await check('a theme switch stops an active opening preview, and an asynchronous upload remains assigned to its starting theme',async()=>{
    await welcome().getByRole('button',{name:'播放欢迎预览',exact:true}).click();await welcome().locator('[data-dcb-welcome-media] img').waitFor()
    await theme('light');await welcome().locator('.dcb-welcome-upload').getByText('synthetic-day.gif',{exact:false}).waitFor();await welcome().locator('[data-dcb-welcome-media] canvas').waitFor()
    assert.equal(await page.locator('[data-dcb-welcome]').count(),0,'theme changes do not replay the full opening animation')
    await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.originalMediaPut=put;IDBObjectStore.prototype.put=function(...args){if(this.name==='media'&&String(args[1]).startsWith('asset:')&&args[0]?.name==='async-day.gif'){IDBObjectStore.prototype.put=put;window.hostTheme.setTheme('dark')}return put.apply(this,args)}})
    await welcome().getByLabel('上传开屏素材',{exact:true}).setInputFiles({name:'async-day.gif',mimeType:'image/gif',buffer:readFileSync(day)})
    await expect.poll(async()=>(await saved()).welcomeThemes.light.welcomeMediaRevision).not.toBe(dayId)
    await expect(page.locator('.dcb-theme-toggle')).toHaveAttribute('data-scheme','dark');assert.equal((await saved()).welcomeThemes.dark.welcomeMediaRevision,nightId)
    await welcome().locator('.dcb-welcome-upload').getByText('synthetic-night.gif',{exact:false}).waitFor();dayId=(await saved()).welcomeThemes.light.welcomeMediaRevision
  })
  await check('removing one theme opening leaves the opposite file usable, including a second browser window',async()=>{
    await welcome().getByRole('button',{name:'移除素材',exact:true}).click()
    assert.equal((await saved()).welcomeThemes.dark.welcomeMediaRevision,'');assert.equal((await saved()).welcomeThemes.light.welcomeMediaRevision,dayId)
    const other=await context.newPage();try{await mount(other);await theme('light',other);await settings('开屏欢迎',other);await welcome(other).locator('.dcb-welcome-upload').getByText('async-day.gif',{exact:false}).waitFor();await welcome(other).locator('[data-dcb-welcome-media] canvas').waitFor()}finally{await other.close()}
    await uploadWelcome(movie);nightId=(await saved()).welcomeThemes.dark.welcomeMediaRevision
  })
  await check('background GIF/video, opacity, blur, fit, position and enabled state restore independently with the theme',async()=>{
    await theme('light');await settings('全图背景');await background().getByLabel('导入全图背景',{exact:true}).setInputFiles(day);await page.locator('[data-dcb-background-layer] img').waitFor()
    await range('背景可见度',62);await range('背景模糊',2);await background().getByRole('group',{name:'背景铺放方式'}).getByRole('button',{name:'完整显示',exact:true}).click();await background().getByRole('group',{name:'背景画面位置'}).getByRole('button',{name:'靠上',exact:true}).click()
    dayBg=(await saved()).backgroundThemes.light.backgroundRevision
    await theme('dark');await background().getByLabel('导入全图背景',{exact:true}).setInputFiles(movie);await page.locator('[data-dcb-background-layer] video').waitFor()
    await range('背景可见度',28);await range('背景模糊',7);await background().getByRole('group',{name:'背景铺放方式'}).getByRole('button',{name:'拉伸',exact:true}).click();await background().getByRole('group',{name:'背景画面位置'}).getByRole('button',{name:'靠右',exact:true}).click();await enabled(background(),'视频声音',true)
    nightBg=(await saved()).backgroundThemes.dark.backgroundRevision
    for(const scheme of ['light','dark','light']){
      await theme(scheme);await expect(background().getByRole('slider',{name:'背景可见度',exact:true})).toHaveValue(scheme==='light'?'62':'28')
      await expect(background().getByRole('slider',{name:'背景模糊',exact:true})).toHaveValue(scheme==='light'?'2':'7')
      await expect(background().getByRole('group',{name:'背景画面位置'}).getByRole('button',{name:scheme==='light'?'靠上':'靠右',exact:true})).toHaveAttribute('aria-pressed','true')
      await expect(background().getByRole('switch',{name:'视频声音',exact:true})).toHaveAttribute('aria-checked',String(scheme==='dark'))
      const layer=page.locator('[data-dcb-background-layer]');await layer.locator(scheme==='light'?'img':'video').waitFor()
      assert.equal(await layer.evaluate(el=>el.style.getPropertyValue('--dcb-bg-opacity')),scheme==='light'?'0.62':'0.28')
    }
    await background().screenshot({path:resolve(output,'day-background-memory.png')})
    await theme('dark');await enabled(background(),'启用全图背景',false);await expect(page.locator('[data-dcb-background-layer]')).toHaveCount(0)
    await theme('light');await page.locator('[data-dcb-background-layer] img').waitFor();await mount();await settings('全图背景')
    await expect(background().getByRole('slider',{name:'背景可见度',exact:true})).toHaveValue('62')
    await theme('dark');await expect(background().getByRole('switch',{name:'启用全图背景',exact:true})).toHaveAttribute('aria-checked','false')
    await page.setViewportSize({width:540,height:950});await background().screenshot({path:resolve(output,'night-background-memory-narrow.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    const value=await saved();assert.equal(value.backgroundThemes.light.backgroundRevision,dayBg);assert.equal(value.backgroundThemes.dark.backgroundRevision,nightBg)
  })
  await check('a legacy shared opening file survives clearing or replacing only one theme, without duplicating its binary',async()=>{
    const legacyContext=await browser.newContext(),legacy=await legacyContext.newPage()
    try{
      await legacy.goto(url)
      await legacy.evaluate(async({key,bytes})=>{
        await new Promise((resolve,reject)=>{const request=indexedDB.open('dsh-ui-beautify-welcome',1);request.onupgradeneeded=()=>request.result.createObjectStore('media');request.onsuccess=()=>{const db=request.result,tx=db.transaction('media','readwrite');tx.objectStore('media').put({revision:'legacy',name:'legacy.gif',type:'image/gif',kind:'image',blob:new Blob([new Uint8Array(bytes)],{type:'image/gif'}),size:bytes.length,width:96,height:64},'opening');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=reject}})
        localStorage.setItem(key,JSON.stringify({welcomeEnabled:false,particleEnabled:false,welcomeMode:'media',welcomeMediaRevision:'legacy'}))
      },{key,bytes:[...readFileSync(day)]})
      await mount(legacy);await settings('开屏欢迎',legacy);await welcome(legacy).locator('.dcb-welcome-upload').getByText('legacy.gif',{exact:false}).waitFor()
      await welcome(legacy).getByRole('button',{name:'移除素材',exact:true}).click()
      await theme('dark',legacy);await welcome(legacy).locator('.dcb-welcome-upload').getByText('legacy.gif',{exact:false}).waitFor();await welcome(legacy).locator('[data-dcb-welcome-media] canvas').waitFor()
      await theme('light',legacy);await uploadWelcome(night,legacy);await theme('dark',legacy)
      await welcome(legacy).locator('.dcb-welcome-upload').getByText('legacy.gif',{exact:false}).waitFor();await welcome(legacy).locator('[data-dcb-welcome-media] canvas').waitFor()
      const stored=await saved(legacy);assert.equal(stored.welcomeThemes.dark.welcomeMediaRevision,'legacy');assert.notEqual(stored.welcomeThemes.light.welcomeMediaRevision,'legacy')
      const count=await legacy.evaluate(()=>new Promise(resolve=>{const request=indexedDB.open('dsh-ui-beautify-welcome',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('media'),read=tx.objectStore('media').getAll();read.onsuccess=()=>resolve(read.result.filter(item=>item.blob).length);tx.oncomplete=()=>db.close()}}));assert.equal(count,2)
    }finally{await legacyContext.close()}
  })
  await check('repeated opening replacements bound stored binaries while preserving both active theme files',async()=>{
    await theme('light');await settings('开屏欢迎')
    for(let i=0;i<5;i++){
      await welcome().getByLabel('上传开屏素材',{exact:true}).setInputFiles({name:`replacement-${i}.gif`,mimeType:'image/gif',buffer:readFileSync(day)})
      await welcome().locator('.dcb-welcome-upload').getByText(`replacement-${i}.gif`,{exact:false}).waitFor();await welcome().locator('[data-dcb-welcome-media] canvas').waitFor()
    }
    const revisions=Object.values((await saved()).welcomeThemes).map(value=>value.welcomeMediaRevision)
    const data=await page.evaluate(()=>new Promise(resolve=>{const request=indexedDB.open('dsh-ui-beautify-welcome',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('media'),read=tx.objectStore('media').getAll();read.onsuccess=()=>resolve(read.result.filter(item=>item.blob).map(item=>item.revision));tx.oncomplete=()=>db.close()}}))
    assert.ok(data.length<=4,JSON.stringify(data));for(const revision of revisions)assert.ok(data.includes(revision))
  })
  await page.evaluate(()=>{for(const fn of window.cleanups.reverse())fn?.()});assert.equal(await page.evaluate(()=>window.mediaURLs.size),0);assert.equal(await page.evaluate(()=>window.mediaVideos.every(v=>v.paused)),true)
  assert.deepEqual(errors,[]);writeFileSync(resolve(output,'verification.json'),JSON.stringify({checks,errors,scope:'Synthetic GIF/video files and real plugin settings, IndexedDB and startup playback'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,output}))
}finally{await context.close();await browser.close();await new Promise(done=>server.close(done))}
